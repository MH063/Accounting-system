/**
 * 请求日志中间件
 * 自动记录所有API请求和响应
 */

const logger = require('../config/logger');

/**
 * 记录API请求和响应的中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const requestLogger = (req, res, next) => {
  // 记录请求开始时间
  const startTime = Date.now();
  
  // 记录原始的res.end方法
  const originalEnd = res.end;
  
  // 重写res.end方法，以便在响应结束时记录日志
  res.end = function(chunk, encoding) {
    // 计算响应时间
    const responseTime = Date.now() - startTime;
    
    // 记录API调用日志
    logger.api(req, res, responseTime);
    
    // 记录审计日志（仅对关键操作）
    const criticalOperations = ['POST', 'PUT', 'DELETE'];
    if (criticalOperations.includes(req.method)) {
      logger.audit(req, `${req.method} ${req.originalUrl}`, {
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        requestBody: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined
      });
    }
    
    // 记录安全事件（如认证失败、权限不足等）
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.security(req, `访问被拒绝 (${res.statusCode})`, {
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`
      });
    }
    
    // 调用原始的end方法
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * 清理请求体，移除敏感信息
 * @param {Object} body - 请求体
 * @returns {Object} 清理后的请求体
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

module.exports = {
  requestLogger,
  sanitizeRequestBody
};