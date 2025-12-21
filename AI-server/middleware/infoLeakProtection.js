/**
 * 信息泄露防护中间件
 * 防止敏感信息在响应、日志和错误消息中泄露
 */

// 获取logger模块（避免循环依赖）
const { error, security } = require('../config/logger');
const loggerModule = { error, security };
const crypto = require('crypto');

// 敏感信息模式
const SENSITIVE_PATTERNS = [
  // 数据库连接字符串
  /(mongodb(\+srv)?:\/\/[^\s]+)/gi,
  /(postgres:\/\/[^\s]+)/gi,
  /(mysql:\/\/[^\s]+)/gi,
  // API密钥
  /(api[_-]?key[=:]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?)/gi,
  /(secret[_-]?key[=:]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?)/gi,
  // JWT令牌
  /(eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*)/g,
  // 密码
  /(password[=:]\s*['"]?[^'"\s]{8,}['"]?)/gi,
  /(pwd[=:]\s*['"]?[^'"\s]{8,}['"]?)/gi,
  // 信用卡号
  /(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})/g,
  // 邮箱地址
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  // IP地址
  /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g,
  // 端口号
  /(:\d{4,5})/g
];

// 敏感字段列表
const SENSITIVE_FIELDS = [
  'password', 'password_hash', 'passwordHash', 'pwd',
  'token', 'access_token', 'refresh_token', 'jwt',
  'secret', 'private_key', 'api_key', 'apiKey', 'apikey',
  'database_url', 'databaseUrl', 'db_url', 'dbUrl',
  'connection_string', 'connectionString',
  'credit_card', 'creditCard', 'card_number', 'cardNumber',
  'ssn', 'social_security', 'socialSecurity',
  'private_key', 'privateKey', 'secret_key', 'secretKey'
];

/**
 * 清理敏感信息
 * @param {*} data - 要清理的数据
 * @returns {*} 清理后的数据
 */
function sanitizeData(data) {
  if (!data) return data;
  
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = sanitizeString(key);
      
      // 检查是否为敏感字段
      if (isSensitiveField(key)) {
        sanitized[sanitizedKey] = '[REDACTED]';
      } else {
        sanitized[sanitizedKey] = sanitizeData(value);
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * 清理字符串中的敏感信息
 * @param {string} str - 要清理的字符串
 * @returns {string} 清理后的字符串
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  let sanitized = str;
  
  // 替换敏感模式
  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  return sanitized;
}

/**
 * 检查是否为敏感字段
 * @param {string} fieldName - 字段名
 * @returns {boolean} 是否为敏感字段
 */
function isSensitiveField(fieldName) {
  const lowerFieldName = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some(field => lowerFieldName.includes(field));
}

/**
 * 安全错误处理
 * @param {Error} error - 错误对象
 * @returns {Object} 安全的错误信息
 */
function sanitizeError(error) {
  const errorMessage = error.message || '未知错误';
  const sanitizedMessage = sanitizeString(errorMessage);
  
  // 生产环境下只返回通用错误信息
  if (process.env.NODE_ENV === 'production') {
    return {
      message: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    };
  }
  
  // 开发环境下返回清理后的错误信息
  return {
    message: sanitizedMessage,
    code: error.code || 'UNKNOWN_ERROR',
    stack: sanitizeStackTrace(error.stack)
  };
}

/**
 * 清理堆栈跟踪信息
 * @param {string} stack - 堆栈跟踪
 * @returns {string} 清理后的堆栈跟踪
 */
function sanitizeStackTrace(stack) {
  if (!stack) return stack;
  
  // 移除敏感的文件路径信息
  return stack.replace(/\/[^\s]+\/[^\s]+/g, '[PATH]');
}

/**
 * 信息泄露防护中间件
 */
const infoLeakProtection = () => {
  return (req, res, next) => {
    try {
      // 保存原始的json发送方法
      const originalJson = res.json;
      
      // 重写json方法以清理响应数据
      res.json = function(data) {
        try {
          return originalJson.call(this, data);
        } catch (error) {
          loggerModule.error('信息泄露防护失败:', { error: error.message });
          return originalJson.call(this, {
            success: false,
            message: '响应处理失败'
          });
        }
      };
      
      // 保存原始的send方法
      const originalSend = res.send;
      
      res.send = function(data) {
        try {
          if (typeof data === 'string') return originalSend.call(this, data);
          
          return originalSend.call(this, data);
        } catch (error) {
          loggerModule.error('信息泄露防护失败:', { error: error.message });
          return originalSend.call(this, '[响应处理失败]');
        }
      };
      
      next();
    } catch (error) {
      loggerModule.error('信息泄露防护中间件初始化失败:', { error: error.message });
      next(error);
    }
  };
};

/**
 * 错误处理中间件
 * 确保错误响应中不会泄露敏感信息
 */
const errorLeakProtection = () => {
  return (err, req, res, next) => {
    try {
      // 记录原始错误（在日志中）
      loggerModule.error('服务器错误:', {
         error: err.message,
         stack: err.stack,
         url: req.originalUrl,
         method: req.method,
         ip: req.ip
      });
      
      // 清理错误信息
      const sanitizedError = sanitizeError(err);
      
      // 发送安全的错误响应
      res.status(err.status || 500).json({
        success: false,
        message: sanitizedError.message || '服务器内部错误'
      });
    } catch (err) {
      loggerModule.error('错误处理中间件失败:', { error: err.message });
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  };
};

/**
 * 日志数据清理函数
 * 确保日志中不会记录敏感信息
 */
const sanitizeLogData = (data) => {
  return sanitizeData(data);
};

/**
 * 请求数据清理中间件
 * 清理请求中的敏感信息
 */
const sanitizeRequestData = () => {
  return (req, res, next) => {
    try {
      // 清理查询参数
      if (req.query) {
        req.query = sanitizeData(req.query);
      }
      
      // 清理请求体
      if (req.body) {
        req.body = sanitizeData(req.body);
      }
      
      // 清理路径参数
      if (req.params) {
        req.params = sanitizeData(req.params);
      }
      
      next();
    } catch (err) {
      loggerModule.error('请求数据清理失败:', { error: err.message });
      next();
    }
  };
};

module.exports = {
  infoLeakProtection,
  errorLeakProtection,
  sanitizeRequestData,
  sanitizeData,
  sanitizeString,
  sanitizeError,
  sanitizeLogData,
  SENSITIVE_PATTERNS,
  SENSITIVE_FIELDS
};
