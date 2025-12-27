/**
 * 令牌黑名单管理器
 * 用于管理被撤销/过期的JWT令牌，支持双令牌机制
 */

const logger = require('../config/logger');
const redis = require('redis');

/**
 * 令牌黑名单类
 */
class TokenBlacklist {
  constructor() {
    this.client = null;
    this.memoryStore = {}; // 修改为对象存储，记录撤销详情
    this.redisEnabled = false;
    this.initializeRedis();
  }

  /**
   * 初始化Redis连接
   */
  async initializeRedis() {
    try {
      if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        this.client = redis.createClient({
          url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '[REDIS_HOST]'}:${process.env.REDIS_PORT || 6379}`,
          password: process.env.REDIS_PASSWORD,
          db: process.env.REDIS_DB || 1
        });

        this.client.on('error', (err) => {
          logger.warn('[TokenBlacklist] Redis连接错误，使用内存存储', { error: err.message });
          this.redisEnabled = false;
        });

        this.client.on('connect', () => {
          logger.info('[TokenBlacklist] Redis连接成功');
          this.redisEnabled = true;
        });

        await this.client.connect();
      }
    } catch (error) {
      logger.warn('[TokenBlacklist] Redis初始化失败，使用内存存储', { error: error.message });
      this.redisEnabled = false;
    }
  }

  /**
   * 将令牌添加到黑名单
   * @param {string} token - JWT令牌
   * @param {string} reason - 撤销原因
   * @param {number} expiresIn - 过期时间（秒）
   */
  async revokeToken(token, reason = 'manual_revoke', expiresIn = null) {
    try {
      const tokenId = this.extractTokenId(token);
      if (!tokenId) {
        logger.error('[TokenBlacklist] 无法提取令牌ID', { token: token.substring(0, 20) + '...' });
        return false;
      }

      const revokedInfo = {
        tokenId,
        revokedAt: Date.now(),
        reason,
        tokenType: this.getTokenType(token)
      };

      // 如果没有指定过期时间，根据令牌类型设置
      if (!expiresIn) {
        expiresIn = this.getDefaultExpiry(token);
      }

      if (this.redisEnabled && this.client) {
        // 使用Redis存储
        const key = `revoked_token:${tokenId}`;
        await this.client.setEx(key, expiresIn, JSON.stringify(revokedInfo));
        
        // 同时记录到已撤销令牌集合
        await this.client.sAdd('revoked_tokens', token);
      } else {
        // 使用内存存储详情，支持jti索引
        this.memoryStore[tokenId] = revokedInfo;
        
        // 设置内存清理
        setTimeout(() => {
          delete this.memoryStore[tokenId];
        }, expiresIn * 1000);
      }

      logger.info('[TokenBlacklist] 令牌已撤销', { 
        tokenId, 
        reason, 
        expiresIn,
        type: revokedInfo.tokenType
      });

      return true;
    } catch (error) {
      logger.error('[TokenBlacklist] 撤销令牌失败', { error: error.message, reason });
      return false;
    }
  }

  /**
   * 检查令牌是否在黑名单中
   * @param {string} token - JWT令牌
   * @param {boolean} ignoreGracePeriod - 是否忽略宽限期（默认不忽略）
   * @returns {boolean} 是否在黑名单中
   */
  async isTokenRevoked(token, ignoreGracePeriod = false) {
    try {
      const tokenId = this.extractTokenId(token);
      if (!tokenId) return false;

      let revokedInfoStr = null;
      if (this.redisEnabled && this.client) {
        // Redis检查
        const key = `revoked_token:${tokenId}`;
        revokedInfoStr = await this.client.get(key);
      } else {
        // 内存检查
        // 内存存储现在需要支持存储撤销信息对象，而不仅仅是Set
        // 兼容旧代码，如果Set里有，则认为是撤销的
        if (this.memoryStore instanceof Set) {
          return this.memoryStore.has(token);
        }
        revokedInfoStr = this.memoryStore[tokenId];
      }

      if (!revokedInfoStr) return false;

      // 如果提供了撤销信息，检查宽限期
      try {
        const revokedInfo = typeof revokedInfoStr === 'string' ? JSON.parse(revokedInfoStr) : revokedInfoStr;
        
        // 并发刷新宽限期处理：
        // 如果是因为令牌轮换导致的撤销，且在宽限期内（例如10秒），则允许使用
        if (!ignoreGracePeriod && revokedInfo.reason === 'token_rotated') {
          const GRACE_PERIOD_MS = 10000; // 10秒宽限期
          const timeSinceRevocation = Date.now() - revokedInfo.revokedAt;
          
          if (timeSinceRevocation < GRACE_PERIOD_MS) {
            logger.debug('[TokenBlacklist] 令牌处于轮换宽限期内，允许使用', { 
              tokenId, 
              timeSinceRevocation: `${timeSinceRevocation}ms` 
            });
            return false; // 不视为撤销
          }
        }
      } catch (e) {
        // 解析失败，按已撤销处理
        return true;
      }

      return true;
    } catch (error) {
      logger.error('[TokenBlacklist] 检查令牌状态失败', { error: error.message });
      return false;
    }
  }

  /**
   * 批量撤销令牌（用于用户注销等）
   * @param {Array<string>} tokens - 令牌数组
   * @param {string} reason - 撤销原因
   */
  async revokeTokens(tokens, reason = 'bulk_revoke') {
    const results = [];
    
    for (const token of tokens) {
      try {
        const success = await this.revokeToken(token, reason);
        results.push({ token: token.substring(0, 20) + '...', success });
      } catch (error) {
        results.push({ token: token.substring(0, 20) + '...', success: false, error: error.message });
      }
    }

    logger.info('[TokenBlacklist] 批量撤销令牌完成', { 
      total: tokens.length, 
      success: results.filter(r => r.success).length,
      reason 
    });

    return results;
  }

  /**
   * 获取黑名单统计信息
   */
  async getStats() {
    try {
      let redisStats = null;
      
      if (this.redisEnabled && this.client) {
        const dbSize = await this.client.dbSize();
        const revokedCount = await this.client.sCard('revoked_tokens');
        
        redisStats = {
          databaseSize: dbSize,
          revokedTokenCount: revokedCount,
          storage: 'redis'
        };
      }

      return {
        redis: redisStats,
        memory: {
          revokedTokenCount: Object.keys(this.memoryStore).length,
          storage: 'memory'
        },
        enabled: this.redisEnabled,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('[TokenBlacklist] 获取统计信息失败', { error: error.message });
      return {
        error: error.message,
        memory: {
          revokedTokenCount: Object.keys(this.memoryStore).length,
          storage: 'memory'
        },
        enabled: this.redisEnabled
      };
    }
  }

  /**
   * 清理过期的黑名单条目
   */
  async cleanup() {
    try {
      if (this.redisEnabled && this.client) {
        // Redis会自动清理过期的key，这里只是记录清理操作
        const beforeSize = await this.client.dbSize();
        
        logger.info('[TokenBlacklist] 清理完成', { 
          beforeSize,
          storage: 'redis'
        });
      } else {
        // 内存存储清理
        logger.info('[TokenBlacklist] 内存存储状态', { 
          currentSize: Object.keys(this.memoryStore).length,
          storage: 'memory'
        });
      }
    } catch (error) {
      logger.error('[TokenBlacklist] 清理黑名单失败', { error: error.message });
    }
  }

  /**
   * 从令牌中提取JWT ID (jti)
   * @param {string} token - JWT令牌
   * @returns {string|null} JWT ID
   */
  extractTokenId(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.jti || payload.jwtid || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取令牌类型
   * @param {string} token - JWT令牌
   * @returns {string} 令牌类型
   */
  getTokenType(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return 'unknown';

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.tokenType || payload.type || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * 获取默认过期时间
   * @param {string} token - JWT令牌
   * @returns {number} 过期时间（秒）
   */
  getDefaultExpiry(token) {
    const type = this.getTokenType(token);
    
    // 根据令牌类型返回默认过期时间
    switch (type) {
      case 'access':
        return 24 * 60 * 60; // 24小时
      case 'refresh':
        return 7 * 24 * 60 * 60; // 7天
      default:
        return 24 * 60 * 60; // 默认24小时
    }
  }

  /**
   * 关闭连接
   */
  async close() {
    try {
      if (this.client && this.redisEnabled) {
        await this.client.quit();
        logger.info('[TokenBlacklist] Redis连接已关闭');
      }
    } catch (error) {
      logger.error('[TokenBlacklist] 关闭连接失败', { error: error.message });
    }
  }
}

// 创建单例实例
const tokenBlacklist = new TokenBlacklist();

module.exports = {
  tokenBlacklist,
  TokenBlacklist
};