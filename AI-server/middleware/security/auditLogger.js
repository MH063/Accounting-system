/**
 * 安全审计日志中间件
 * 记录所有安全相关的事件和操作
 */

const fs = require('fs');
const path = require('path');
const logger = require('../../config/logger');

// 确保审计日志目录存在
const auditLogDir = path.join(__dirname, '../../logs/audit');
if (!fs.existsSync(auditLogDir)) {
  fs.mkdirSync(auditLogDir, { recursive: true });
}

// 审计日志文件路径
const auditLogFile = path.join(auditLogDir, 'security-audit.log');

/**
 * 安全审计日志记录器
 * @param {Object} req - 请求对象
 * @param {string} eventType - 事件类型
 * @param {Object} eventData - 事件数据
 */
const logSecurityEvent = (req, eventType, eventData = {}) => {
  try {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      method: req.method,
      url: req.originalUrl,
      eventData
    };

    // 写入审计日志文件
    fs.appendFileSync(auditLogFile, JSON.stringify(auditEntry) + '\n');
    
    // 同时记录到常规日志
    logger.security(req, `安全审计事件: ${eventType}`, eventData);
  } catch (error) {
    logger.error('[AUDIT] 审计日志记录失败:', error);
  }
};

/**
 * 安全审计中间件
 * @returns {Function} Express中间件
 */
const securityAuditMiddleware = () => {
  return (req, res, next) => {
    // 记录请求开始时间
    const startTime = Date.now();
    
    // 监听响应结束事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // 记录请求审计信息
      logSecurityEvent(req, 'REQUEST_PROCESSED', {
        statusCode: res.statusCode,
        responseTime: duration,
        contentType: res.get('Content-Type') || ''
      });
    });
    
    // 记录请求开始
    logSecurityEvent(req, 'REQUEST_RECEIVED', {
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    next();
  };
};

module.exports = {
  logSecurityEvent,
  securityAuditMiddleware
};