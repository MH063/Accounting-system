/**
 * 会话指标统计中间件
 * 用于记录用户在活跃会话期间的业务请求数量
 */

const UserService = require('../services/UserService');
const logger = require('../config/logger');

const userService = new UserService();

/**
 * 业务请求计数中间件
 * 只有当用户已通过 JWT 认证（req.user 存在）且不是心跳请求时才计数
 */
const sessionMetricsMiddleware = async (req, res, next) => {
  try {
    // 只有当用户已认证且有有效的会话令牌时才计数
    if (req.user && req.user.id) {
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader && authHeader.split(' ')[1];

      // 排除心跳请求本身，避免重复计数
      const isHeartbeat = req.originalUrl.includes('/auth/heartbeat');

      if (sessionToken && !isHeartbeat) {
        // 异步增加业务请求计数，不阻塞请求响应
        // 使用 setImmediate 确保在下一个事件循环中执行
        setImmediate(() => {
          userService.incrementBusinessRequest(req.user.id, sessionToken)
            .catch(err => {
              // 这里的错误通常不影响业务，仅记录日志
              logger.debug('[SessionMetrics] 增加业务请求计数失败', { 
                userId: req.user.id,
                error: err.message 
              });
            });
        });
      }
    }
  } catch (error) {
    // 中间件本身的错误不应中断请求流程
    logger.error('[SessionMetrics] 中间件执行异常', { error: error.message });
  } finally {
    next();
  }
};

module.exports = sessionMetricsMiddleware;
