/**
 * Winston日志配置
 * 提供不同级别的日志记录功能
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { startLogRotationService } = require('../utils/logRotation');

// 简单的敏感数据清理函数（避免循环依赖）
const sanitizeLogData = (data) => {
  if (!data) return data;
  
  if (typeof data === 'string') {
    // 简单替换敏感信息
    return data
      .replace(/(password[=:]\s*['"]?[^'"\s]{8,}['"]?)/gi, 'password=[REDACTED]')
      .replace(/(token[=:]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?)/gi, 'token=[REDACTED]')
      .replace(/(secret[=:]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?)/gi, 'secret=[REDACTED]')
      .replace(/(eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*)/g, '[JWT_TOKEN]');
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeLogData(item));
    }
    
    const sanitized = {};
    const sensitiveFields = ['password', 'token', 'secret', 'jwt', 'apiKey', 'secretKey'];
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    return sanitized;
  }
  
  return data;
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/(password[=:]\s*['"]?[^'"\s]{8,}['"]?)/gi, 'password=[REDACTED]')
    .replace(/(token[=:]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?)/gi, 'token=[REDACTED]')
    .replace(/(secret[=:]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?)/gi, 'secret=[REDACTED]')
    .replace(/(eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*)/g, '[JWT_TOKEN]');
};

// 创建日志目录（如果不存在）
const logDir = path.join(process.cwd(), 'logs');
const auditLogDir = path.join(logDir, 'audit');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

if (!fs.existsSync(auditLogDir)) {
  fs.mkdirSync(auditLogDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// 控制台输出格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ai-serve' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // 审计日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'audit.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // 安全日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'warn',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // 操作审计日志文件
    new winston.transports.File({
      filename: path.join(auditLogDir, 'operation.log'),
      level: 'info',
      maxsize: 15728640, // 15MB
      maxFiles: 15,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // 登录审计日志文件
    new winston.transports.File({
      filename: path.join(auditLogDir, 'login.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 15,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // 异常审计日志文件
    new winston.transports.File({
      filename: path.join(auditLogDir, 'anomaly.log'),
      level: 'warn',
      maxsize: 15728640, // 15MB
      maxFiles: 20,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
});

// 在非生产环境下，同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// 延迟启动日志轮转服务，避免循环依赖
setTimeout(() => {
  try {
    const { startLogRotationService } = require('../utils/logRotation');
    startLogRotationService();
  } catch (error) {
    console.error('启动日志轮转服务失败:', error.message);
  }
}, 1000);

/**
 * 记录用户操作审计日志
 * @param {Object} req - Express请求对象
 * @param {string} action - 操作类型
 * @param {Object} details - 操作详情
 */
const auditLog = (req, action, details = {}) => {
  // 清理敏感信息
  const sanitizedDetails = sanitizeLogData(details);
  
  const auditInfo = {
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous',
    username: req.user?.username || 'anonymous',
    ip: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
    userAgent: (req.get && req.get('User-Agent')) || 'unknown',
    method: req.method,
    url: req.originalUrl,
    action,
    details: sanitizedDetails,
    sessionId: req.sessionID || 'none'
  };

  logger.info(`[AUDIT] ${action}`, auditInfo);
};

/**
 * 记录安全相关事件
 * @param {Object} req - Express请求对象
 * @param {string} event - 安全事件类型
 * @param {Object} details - 事件详情
 */
const securityLog = (req, event, details = {}) => {
  // 清理敏感信息
  const sanitizedDetails = sanitizeLogData(details);
  
  const securityInfo = {
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous',
    username: req.user?.username || 'anonymous',
    ip: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
    userAgent: (req.get && req.get('User-Agent')) || 'unknown',
    method: req.method,
    url: req.originalUrl,
    event,
    details: sanitizedDetails,
    sessionId: req.sessionID || 'none'
  };

  logger.warn(`[SECURITY] ${event}`, securityInfo);
};

/**
 * 记录数据库操作
 * @param {string} operation - 操作类型
 * @param {Object} details - 操作详情
 */
const dbLog = (operation, details = {}) => {
  // 清理敏感信息
  const sanitizedDetails = sanitizeLogData(details);
  
  const dbInfo = {
    timestamp: new Date().toISOString(),
    operation,
    details: sanitizedDetails
  };

  logger.info(`[DB] ${operation}`, dbInfo);
};

/**
 * 记录API调用
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {number} responseTime - 响应时间（毫秒）
 */
const apiLog = (req, res, responseTime) => {
  // 清理IP地址和URL中的敏感信息
  const sanitizedIp = req.ip ? req.ip.replace(/\d+\.\d+\.\d+\.\d+/, '[IP]') : 'unknown';
  const sanitizedUrl = sanitizeString(req.originalUrl);
  
  const apiInfo = {
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous',
    ip: sanitizedIp,
    method: req.method,
    url: sanitizedUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: (req.get && req.get('User-Agent')) || 'unknown'
  };

  logger.info(`[API] ${req.method} ${sanitizedUrl}`, apiInfo);
};

// 导出便捷方法（避免循环依赖）
module.exports = {
  info: (message, meta) => logger.info(message, meta),
  error: (message, meta) => logger.error(message, meta),
  warn: (message, meta) => logger.warn(message, meta),
  debug: (message, meta) => logger.debug(message, meta),
  // 记录HTTP请求
  http: (message, meta) => logger.http(message, meta),
  // 记录数据库操作
  db: dbLog,
  // 记录认证相关操作
  auth: (message, meta) => logger.info(`[AUTH] ${message}`, meta),
  // 记录API调用
  api: apiLog,
  // 记录审计日志
  audit: auditLog,
  // 记录安全日志
  security: securityLog,
  // 获取原始logger实例（避免循环依赖，使用getter）
  get logger() {
    return logger;
  }
};