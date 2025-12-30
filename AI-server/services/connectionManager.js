/**
 * 连接管理器服务
 * 用于管理所有客户端连接，支持批量断开操作
 */

const { pool } = require('../config/database');
const { getRedisClient, isRedisAvailable } = require('../config/redis');
const logger = require('../config/logger');

const TOKEN_BLACKLIST_PREFIX = 'jzb:token:blacklist:';
const CONNECTION_TRACKING_KEY = 'jzb:connections:active';
const DISCONNECT_OPERATION_KEY = 'jzb:disconnect:operations';

class ConnectionManager {
  constructor() {
    this.redis = null;
    this.initRedis();
  }

  initRedis() {
    try {
      if (isRedisAvailable()) {
        this.redis = getRedisClient();
      }
    } catch (error) {
      logger.warn('[ConnectionManager] Redis连接初始化失败，将使用数据库模式', error.message);
    }
  }

  /**
   * 获取所有活跃客户端连接
   * @param {Object} options 过滤选项
   */
  async getActiveConnections(options = {}) {
    const { excludeAdmin = true, target = 'client' } = options;

    try {
      let query = `
        SELECT 
          s.id as session_id,
          s.user_id,
          s.session_token,
          s.ip_address,
          s.user_agent,
          s.status,
          s.created_at,
          s.last_accessed_at,
          s.online_score,
          s.heartbeat_count,
          u.username
        FROM user_sessions s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active'
        AND s.expires_at > NOW()
      `;

      const params = [];

      if (target === 'client') {
        query += `
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur
            INNER JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = u.id AND r.role_name = 'admin'
          )
        `;
        query += ` AND s.user_agent LIKE '%Mozilla%'`;
      } else if (target === 'admin') {
        query += `
          AND EXISTS (
            SELECT 1 FROM user_roles ur
            INNER JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = u.id AND r.role_name = 'admin'
          )
        `;
      }

      query += ` ORDER BY s.last_accessed_at DESC`;

      const result = await pool.query(query, params);

      logger.info('[ConnectionManager] 获取活跃连接', {
        total: result.rows.length,
        filters: { target: options.target || 'client' }
      });

      return result.rows;
    } catch (error) {
      logger.error('[ConnectionManager] 获取活跃连接失败:', error);
      throw error;
    }
  }

  /**
   * 批量断开连接（使会话失效）
   * @param {Object} options 断开选项
   */
  async disconnectAllClients(options = {}) {
    const {
      mode = 'async',
      reason = 'admin_disconnect',
      initiatedBy = 'system',
      excludeUserIds = [],
      includeUserIds = [],
      target = 'client'
    } = options;

    const operationId = `disconnect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    logger.info('[ConnectionManager] 开始批量断开连接', {
      operationId,
      mode,
      reason,
      initiatedBy,
      target,
      excludeUserIdsCount: excludeUserIds.length,
      includeUserIdsCount: includeUserIds.length
    });

    try {
      const connections = await this.getActiveConnections({
        target,
        excludeAdmin: target === 'client'
      });

      const filteredConnections = connections.filter(conn => {
        if (excludeUserIds.length > 0 && excludeUserIds.includes(conn.user_id)) {
          return false;
        }
        if (includeUserIds.length > 0 && !includeUserIds.includes(conn.user_id)) {
          return false;
        }
        return true;
      });

      logger.info('[ConnectionManager] 过滤后的连接', {
        totalConnections: connections.length,
        filteredConnections: filteredConnections.length
      });

      let result;
      if (mode === 'sync') {
        result = await this.syncDisconnect(operationId, filteredConnections, {
          reason,
          initiatedBy
        });
      } else {
        result = await this.asyncDisconnect(operationId, filteredConnections, {
          reason,
          initiatedBy
        });
      }

      const duration = Date.now() - startTime;

      const summary = {
        operationId,
        mode,
        reason,
        initiatedBy,
        totalRequested: filteredConnections.length,
        successfullyDisconnected: result.successCount,
        failedCount: result.failCount,
        skippedCount: result.skippedCount,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        errors: result.errors.slice(0, 10)
      };

      logger.info('[ConnectionManager] 批量断开操作完成', summary);

      await this.logDisconnectOperation(summary);

      return summary;
    } catch (error) {
      logger.error('[ConnectionManager] 批量断开连接失败:', error);
      throw error;
    }
  }

  /**
   * 同步断开模式 - 立即执行
   */
  async syncDisconnect(operationId, connections, metadata) {
    const { reason, initiatedBy } = metadata;
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const conn of connections) {
      try {
        const disconnectResult = await this.disconnectSingleConnection(conn, {
          operationId,
          reason,
          initiatedBy
        });

        if (disconnectResult.success) {
          successCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        failCount++;
        errors.push({
          userId: conn.user_id,
          username: conn.username,
          error: error.message
        });
      }
    }

    return { successCount, failCount, skippedCount, errors };
  }

  /**
   * 异步断开模式 - 分批处理
   */
  async asyncDisconnect(operationId, connections, metadata) {
    const { reason, initiatedBy } = metadata;
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    const errors = [];

    const BATCH_SIZE = 100;
    const DELAY_BETWEEN_BATCHES = 50;

    for (let i = 0; i < connections.length; i += BATCH_SIZE) {
      const batch = connections.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (conn) => {
          try {
            const result = await this.disconnectSingleConnection(conn, {
              operationId,
              reason,
              initiatedBy
            });
            return result;
          } catch (error) {
            return { success: false, error: error.message, conn };
          }
        })
      );

      for (const result of batchResults) {
        if (result.success) {
          successCount++;
        } else if (result.skipped) {
          skippedCount++;
        } else {
          failCount++;
          errors.push({
            userId: result.conn?.user_id,
            username: result.conn?.username,
            error: result.error
          });
        }
      }

      if (i + BATCH_SIZE < connections.length) {
        await this.delay(DELAY_BETWEEN_BATCHES);
      }
    }

    return { successCount, failCount, skippedCount, errors };
  }

  /**
   * 断开单个连接
   */
  async disconnectSingleConnection(connection, metadata = {}) {
    const { operationId, reason, initiatedBy } = metadata;

    try {
      const now = new Date();

      await pool.query(`
        UPDATE user_sessions 
        SET 
          status = 'revoked',
          updated_at = $1
        WHERE id = $2 AND status = 'active'
      `, [now, connection.session_id]);

      if (this.redis) {
        const tokenKey = `${TOKEN_BLACKLIST_PREFIX}${connection.session_token}`;
        await this.redis.set(tokenKey, JSON.stringify({
          revoked: true,
          revokedAt: now.toISOString(),
          reason,
          operationId,
          revokedBy: initiatedBy
        }), 'EX', 86400);
      }

      logger.debug('[ConnectionManager] 已断开单个连接', {
        operationId,
        userId: connection.user_id,
        username: connection.username,
        sessionId: connection.session_id
      });

      return { success: true, connection };
    } catch (error) {
      logger.error('[ConnectionManager] 断开单个连接失败:', error);
      return { success: false, error: error.message, connection };
    }
  }

  /**
   * 按用户ID断开连接
   */
  async disconnectByUserIds(userIds, metadata = {}) {
    const { operationId, reason, initiatedBy } = metadata;

    const connections = await this.getActiveConnections({ 
      target: 'client',
      excludeAdmin: true 
    });
    const filteredConnections = connections.filter(conn => userIds.includes(conn.user_id));

    logger.info('[ConnectionManager] 按用户ID断开连接', {
      operationId,
      userIdsCount: userIds.length,
      matchedConnections: filteredConnections.length
    });

    return this.syncDisconnect(operationId, filteredConnections, {
      reason: reason || 'user_disconnect',
      initiatedBy
    });
  }

  /**
   * 获取连接统计信息
   */
  async getConnectionStats() {
    try {
      const stats = {};

      const totalQuery = `
        SELECT 
          COUNT(*) as total_active,
          COUNT(CASE WHEN status = 'active' AND expires_at > NOW() THEN 1 END) as truly_active
        FROM user_sessions
      `;
      const totalResult = await pool.query(totalQuery);
      stats.total = parseInt(totalResult.rows[0].total_active);
      stats.trulyActive = parseInt(totalResult.rows[0].truly_active);

      const roleQuery = `
        SELECT 
          r.role_name as role,
          COUNT(DISTINCT s.user_id) as user_count,
          COUNT(s.id) as session_count
        FROM user_sessions s
        INNER JOIN users u ON s.user_id = u.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE s.status = 'active' AND s.expires_at > NOW()
        GROUP BY r.role_name
      `;
      const roleResult = await pool.query(roleQuery);
      stats.byRole = roleResult.rows;

      const recentQuery = `
        SELECT 
          COUNT(*) as last_minute,
          COUNT(CASE WHEN last_accessed_at > NOW() - INTERVAL '5 minutes' THEN 1 END) as last_5_minutes
        FROM user_sessions
        WHERE status = 'active' AND expires_at > NOW()
      `;
      const recentResult = await pool.query(recentQuery);
      stats.recentActivity = {
        lastMinute: parseInt(recentResult.rows[0].last_minute),
        last5Minutes: parseInt(recentResult.rows[0].last_5_minutes)
      };

      return {
        success: true,
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[ConnectionManager] 获取连接统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 记录断开操作日志
   */
  async logDisconnectOperation(summary) {
    try {
      // 简化日志记录，避免外键约束问题
      logger.info('[ConnectionManager] 批量断开操作日志', {
        operationId: summary.operationId,
        reason: summary.reason,
        initiatedBy: summary.initiatedBy,
        totalRequested: summary.totalRequested,
        successfullyDisconnected: summary.successfullyDisconnected,
        failedCount: summary.failedCount,
        duration: summary.duration
      });
    } catch (error) {
      logger.error('[ConnectionManager] 记录断开操作日志失败:', error);
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取当前连接管理器状态
   */
  getStatus() {
    return {
      redisAvailable: isRedisAvailable(),
      redisConfigured: !!this.redis,
      tokenBlacklistPrefix: TOKEN_BLACKLIST_PREFIX
    };
  }
}

module.exports = new ConnectionManager();
