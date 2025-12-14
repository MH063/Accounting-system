/**
 * 多级缓存系统
 * 实现L1（内存）和L2（Redis）缓存策略，提供高性能的数据缓存解决方案
 */

const Redis = require('ioredis');
const { LRUCache } = require('lru-cache');
const logger = require('./logger');

/**
 * L1缓存配置 - 内存缓存（LRU）
 */
const l1Cache = new LRUCache({
  max: 1000, // 最大缓存项数
  ttl: 1000 * 60 * 5, // 5分钟过期时间
  updateAgeOnGet: true, // 访问时更新年龄
  updateAgeOnHas: true, // 检查时更新年龄
  dispose: (value, key) => {
    logger.debug(`[L1-CACHE] 内存缓存项被清除: ${key}`);
  }
});

/**
 * L2缓存配置 - Redis缓存
 */
let l2Cache = null;

class RedisManager {
  constructor() {
    this.redis = null;
    this.isConnected = false;
  }

  /**
   * 初始化Redis连接
   */
  async initialize() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4, // IPv4
        connectTimeout: 10000,
        commandTimeout: 5000
      };

      this.redis = new Redis(redisConfig);

      // 连接事件处理
      this.redis.on('connect', () => {
        logger.info('[L2-CACHE] Redis连接建立');
      });

      this.redis.on('ready', () => {
        logger.info('[L2-CACHE] Redis连接就绪');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.error('[L2-CACHE] Redis连接错误:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('[L2-CACHE] Redis连接关闭');
        this.isConnected = false;
      });

      this.redis.on('reconnecting', () => {
        logger.info('[L2-CACHE] Redis重连中...');
      });

      // 尝试连接
      await this.redis.connect();
      return true;

    } catch (error) {
      logger.error('[L2-CACHE] Redis初始化失败:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 获取Redis实例
   */
  getClient() {
    return this.redis;
  }

  /**
   * 检查Redis连接状态
   */
  isRedisConnected() {
    return this.isConnected && this.redis && this.redis.status === 'ready';
  }

  /**
   * 设置键值对
   */
  async set(key, value, ttl = 3600) {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error(`[L2-CACHE] 设置缓存失败: ${key}`, error.message);
      return false;
    }
  }

  /**
   * 获取键值对
   */
  async get(key) {
    try {
      if (!this.isRedisConnected()) {
        return null;
      }

      const value = await this.redis.get(key);
      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error(`[L2-CACHE] 获取缓存失败: ${key}`, error.message);
      return null;
    }
  }

  /**
   * 删除键
   */
  async del(key) {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`[L2-CACHE] 删除缓存失败: ${key}`, error.message);
      return false;
    }
  }

  /**
   * 清空所有缓存
   */
  async flush() {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      await this.redis.flushdb();
      return true;
    } catch (error) {
      logger.error('[L2-CACHE] 清空缓存失败:', error.message);
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats() {
    try {
      if (!this.isRedisConnected()) {
        return null;
      }

      const info = await this.redis.info('memory');
      const usedMemory = info.match(/used_memory:(\d+)/);
      const usedMemoryHuman = info.match(/used_memory_human:([^\r\n]+)/);

      return {
        connected: this.isConnected,
        usedMemory: usedMemory ? parseInt(usedMemory[1]) : 0,
        usedMemoryHuman: usedMemoryHuman ? usedMemoryHuman[1] : '0B',
        status: this.redis.status
      };
    } catch (error) {
      logger.error('[L2-CACHE] 获取Redis状态失败:', error.message);
      return null;
    }
  }

  /**
   * 关闭Redis连接
   */
  async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
        logger.info('[L2-CACHE] Redis连接已关闭');
      }
    } catch (error) {
      logger.error('[L2-CACHE] 关闭Redis连接失败:', error.message);
    }
  }
}

// 创建Redis管理器实例
const redisManager = new RedisManager();

/**
 * 多级缓存系统类
 */
class MultiLevelCache {
  constructor() {
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * 生成缓存键
   * @param {string} prefix - 键前缀
   * @param {string} key - 键名
   * @returns {string} 完整键名
   */
  generateKey(prefix, key) {
    return `${prefix}:${key}`;
  }

  /**
   * 获取缓存数据 - 多级查询策略
   * @param {string} key - 缓存键
   * @param {string} prefix - 键前缀
   * @returns {Promise<any>} 缓存数据或null
   */
  async get(key, prefix = 'cache') {
    const fullKey = this.generateKey(prefix, key);

    // 首先查询L1缓存（内存）
    let value = l1Cache.get(fullKey);
    if (value !== undefined) {
      this.stats.l1Hits++;
      logger.debug(`[MULTI-CACHE] L1缓存命中: ${fullKey}`);
      return value;
    }

    this.stats.l1Misses++;

    // L1缓存未命中，查询L2缓存（Redis）
    value = await redisManager.get(fullKey);
    if (value !== null) {
      this.stats.l2Hits++;
      logger.debug(`[MULTI-CACHE] L2缓存命中: ${fullKey}`);
      
      // 将数据回写到L1缓存
      l1Cache.set(fullKey, value);
      return value;
    }

    this.stats.l2Misses++;
    logger.debug(`[MULTI-CACHE] 缓存未命中: ${fullKey}`);
    return null;
  }

  /**
   * 设置缓存数据 - 同时写入L1和L2
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {Object} options - 选项配置
   * @returns {Promise<boolean>} 是否设置成功
   */
  async set(key, value, options = {}) {
    const {
      prefix = 'cache',
      l1Ttl = 300, // L1缓存5分钟
      l2Ttl = 3600, // L2缓存1小时
      forceL2Only = false // 是否只写入L2
    } = options;

    const fullKey = this.generateKey(prefix, key);
    let success = true;

    // 设置L1缓存
    if (!forceL2Only) {
      l1Cache.set(fullKey, value, { ttl: l1Ttl * 1000 });
      logger.debug(`[MULTI-CACHE] L1缓存设置: ${fullKey}`);
    }

    // 设置L2缓存
    const l2Success = await redisManager.set(fullKey, value, l2Ttl);
    if (!l2Success) {
      success = false;
      logger.warn(`[MULTI-CACHE] L2缓存设置失败: ${fullKey}`);
    } else {
      logger.debug(`[MULTI-CACHE] L2缓存设置: ${fullKey}`);
    }

    if (success) {
      this.stats.sets++;
    }

    return success;
  }

  /**
   * 删除缓存数据
   * @param {string} key - 缓存键
   * @param {string} prefix - 键前缀
   * @returns {Promise<boolean>} 是否删除成功
   */
  async del(key, prefix = 'cache') {
    const fullKey = this.generateKey(prefix, key);
    
    // 删除L1缓存
    l1Cache.delete(fullKey);
    
    // 删除L2缓存
    const l2Success = await redisManager.del(fullKey);
    
    if (l2Success) {
      this.stats.deletes++;
      logger.debug(`[MULTI-CACHE] 缓存删除: ${fullKey}`);
    }

    return l2Success;
  }

  /**
   * 清空所有缓存
   * @param {string} prefix - 键前缀过滤
   * @returns {Promise<boolean>} 是否清空成功
   */
  async flush(prefix = null) {
    // 清空L1缓存
    if (prefix) {
      // 如果指定了前缀，只删除匹配的键
      const keys = Array.from(l1Cache.keys());
      keys.forEach(key => {
        if (key.startsWith(`${prefix}:`)) {
          l1Cache.delete(key);
        }
      });
    } else {
      l1Cache.clear();
    }

    // 清空L2缓存
    const l2Success = await redisManager.flush();

    if (l2Success) {
      this.stats.deletes++;
      logger.info('[MULTI-CACHE] 所有缓存已清空');
    }

    return l2Success;
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const l1Stats = {
      size: l1Cache.size,
      max: l1Cache.max,
      hitRate: this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses) * 100 || 0
    };

    return {
      l1: l1Stats,
      l2: {
        hits: this.stats.l2Hits,
        misses: this.stats.l2Misses,
        hitRate: this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses) * 100 || 0
      },
      overall: {
        totalHits: this.stats.l1Hits + this.stats.l2Hits,
        totalMisses: this.stats.l1Misses + this.stats.l2Misses,
        sets: this.stats.sets,
        deletes: this.stats.deletes,
        hitRate: (this.stats.l1Hits + this.stats.l2Hits) / 
                 (this.stats.l1Hits + this.stats.l2Hits + this.stats.l1Misses + this.stats.l2Misses) * 100 || 0
      }
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * 根据前缀批量删除缓存
   * @param {string} prefix - 键前缀
   * @returns {Promise<number>} 删除的缓存数量
   */
  async batchDelete(prefix) {
    let deletedCount = 0;

    // 批量删除L1缓存
    const l1Keys = Array.from(l1Cache.keys());
    l1Keys.forEach(key => {
      if (key.startsWith(`${prefix}:`)) {
        l1Cache.delete(key);
        deletedCount++;
      }
    });

    // 批量删除L2缓存（需要使用SCAN命令）
    if (redisManager.isRedisConnected()) {
      try {
        const redis = redisManager.getClient();
        let cursor = '0';
        
        do {
          const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}:*`, 'COUNT', 100);
          cursor = nextCursor;
          
          if (keys.length > 0) {
            const result = await redis.del(...keys);
            deletedCount += result;
          }
        } while (cursor !== '0');
        
      } catch (error) {
        logger.error(`[MULTI-CACHE] 批量删除L2缓存失败:`, error.message);
      }
    }

    logger.info(`[MULTI-CACHE] 批量删除完成，删除 ${deletedCount} 个缓存项`);
    return deletedCount;
  }

  /**
   * 检查缓存健康状态
   */
  async healthCheck() {
    const health = {
      l1: {
        status: 'healthy',
        size: l1Cache.size,
        max: l1Cache.max
      },
      l2: {
        status: 'unhealthy',
        connected: false,
        error: null
      }
    };

    // 检查L2缓存状态
    try {
      const redisStats = await redisManager.getStats();
      if (redisStats && redisStats.connected) {
        health.l2.status = 'healthy';
        health.l2.connected = true;
        health.l2.stats = redisStats;
      } else {
        health.l2.error = 'Redis连接不可用';
      }
    } catch (error) {
      health.l2.error = error.message;
    }

    const overallStatus = health.l1.status === 'healthy' && health.l2.status === 'healthy' ? 'healthy' : 'degraded';
    
    return {
      status: overallStatus,
      details: health,
      timestamp: new Date().toISOString()
    };
  }
}

// 导出单例实例
const multiLevelCache = new MultiLevelCache();

// 导出函数接口
module.exports = {
  // 多级缓存实例
  multiLevelCache,
  
  // Redis管理器
  redisManager,
  
  // 便捷方法
  cache: {
    get: (key, prefix) => multiLevelCache.get(key, prefix),
    set: (key, value, options) => multiLevelCache.set(key, value, options),
    del: (key, prefix) => multiLevelCache.del(key, prefix),
    flush: (prefix) => multiLevelCache.flush(prefix),
    stats: () => multiLevelCache.getStats(),
    healthCheck: () => multiLevelCache.healthCheck()
  },
  
  // 初始化方法
  initialize: () => redisManager.initialize(),
  close: () => redisManager.close()
};