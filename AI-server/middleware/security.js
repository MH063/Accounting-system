/**
 * 安全防护中间件
 * 提供IP白名单、请求头检查、SQL注入防护等功能
 */

const logger = require('../config/logger');

/**
 * IP白名单中间件
 * 只允许白名单中的IP访问敏感接口
 */
const ipWhitelist = (allowedIps = []) => {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // 如果没有配置白名单，则允许所有IP
    if (allowedIps.length === 0) {
      logger.info(`[SECURITY] 未配置IP白名单，允许访问: IP=${clientIp}, 路径=${req.path}`);
      return next();
    }
    
    // 检查IP是否在白名单中
    if (allowedIps.includes(clientIp)) {
      logger.info(`[SECURITY] IP白名单验证通过: IP=${clientIp}, 路径=${req.path}`);
      return next();
    }
    
    // 记录未授权访问尝试
    logger.warn(`[SECURITY] 未授权IP尝试访问: IP=${clientIp}, 路径=${req.path}, User-Agent=${userAgent}`);
    
    res.status(403).json({
      success: false,
      message: '访问被拒绝：您的IP地址不在允许列表中'
    });
  };
};

/**
 * 敏感接口严格限流中间件
 * 对敏感操作（如登录、上传、数据库操作）应用更严格的限制
 */
const strictRateLimit = (options = {}) => {
  const {
    windowMs = 60000, // 1分钟
    maxRequests = 5, // 每分钟最多5次请求
    skipSuccessfulRequests = true // 成功后不计入限制
  } = options;
  
  const requestCounts = new Map();
  
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const key = `${clientIp}:${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // 清理过期的记录
    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }
    
    const requests = requestCounts.get(key);
    
    // 移除窗口外的请求记录
    while (requests.length > 0 && requests[0] < windowStart) {
      requests.shift();
    }
    
    // 检查是否超过限制
    if (requests.length >= maxRequests) {
      const userAgent = req.get('User-Agent') || 'unknown';
      logger.warn(`[SECURITY] 敏感接口限流触发: IP=${clientIp}, 路径=${req.path}, 尝试次数=${requests.length}, User-Agent=${userAgent}`);
      
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试'
      });
    }
    
    // 记录本次请求
    requests.push(now);
    
    // 请求完成后清理计数（如果成功）
    if (skipSuccessfulRequests) {
      const originalJson = res.json;
      res.json = function(data) {
        if (data.success === true) {
          const cleanRequests = requestCounts.get(key) || [];
          if (cleanRequests.length > 0) {
            cleanRequests.pop(); // 移除最后一次请求记录
          }
        }
        return originalJson.call(this, data);
      };
    }
    
    next();
  };
};

/**
 * 请求头安全检查中间件
 * 检查恶意请求头和User-Agent
 */
const securityHeaders = () => {
  return (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    const suspiciousPatterns = [
      /bot|crawler|spider/i,
      /sqlmap/i,
      /nikto|nmap/i,
      /script/i,
      /\.\./,
      /<script/i
    ];
    
    // 检查User-Agent
    if (userAgent) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(userAgent)) {
          logger.warn(`[SECURITY] 检测到可疑User-Agent: IP=${req.ip}, User-Agent=${userAgent}`);
          return res.status(403).json({
            success: false,
            message: '访问被拒绝：请求头格式异常'
          });
        }
      }
    }
    
    // 检查Referer
    if (referer) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(referer)) {
          logger.warn(`[SECURITY] 检测到可疑Referer: IP=${req.ip}, Referer=${referer}`);
          return res.status(403).json({
            success: false,
            message: '访问被拒绝：请求头格式异常'
          });
        }
      }
    }
    
    next();
  };
};

/**
 * SQL注入防护中间件
 * 检查请求参数中是否存在SQL注入攻击
 */
const sqlInjectionProtection = () => {
  const dangerousPatterns = [
    /('|(\\x27)|;|(\\x3B)|\\x00|0x00|%00|\\'|'|(\\x22))/,
    /(union|select|insert|update|delete|drop|create|alter|exec|execute|script)/i,
    /(\\b(or|and)\\b.*=\\b)|(\\b(or|and)\\b.*\\b)\\b/i
  ];
  
  return (req, res, next) => {
    const checkValue = (value) => {
      if (typeof value === 'string') {
        for (const pattern of dangerousPatterns) {
          if (pattern.test(value)) {
            logger.warn(`[SECURITY] SQL注入防护触发: IP=${req.ip}, 路径=${req.path}, 可疑值=${value.substring(0, 100)}`);
            return true;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const key in value) {
          if (checkValue(value[key])) {
            return true;
          }
        }
      }
      return false;
    };
    
    // 检查查询参数
    if (checkValue(req.query)) {
      return res.status(400).json({
        success: false,
        message: '请求参数格式异常'
      });
    }
    
    // 检查请求体
    if (checkValue(req.body)) {
      return res.status(400).json({
        success: false,
        message: '请求参数格式异常'
      });
    }
    
    next();
  };
};

/**
 * 请求大小限制中间件
 * 防止大文件攻击
 */
const requestSizeLimit = (maxSize = '5mb') => {
  return (req, res, next) => {
    const contentLength = req.get('Content-Length');
    const maxBytes = parseSize(maxSize);
    
    console.log(`[SECURITY DEBUG] 请求大小检查: Content-Length=${contentLength}, 允许大小=${maxBytes}字节, 最大大小=${maxSize}`);
    logger.info(`[SECURITY] 请求大小检查: Content-Length=${contentLength}, 允许大小=${maxBytes}字节, 最大大小=${maxSize}`);
    
    if (contentLength && parseInt(contentLength) > maxBytes) {
      console.log(`[SECURITY DEBUG] 请求大小超限: Content-Length=${contentLength}, 允许大小=${maxBytes}字节, 最大大小=${maxSize}`);
      logger.warn(`[SECURITY] 请求大小超限: IP=${req.ip}, Content-Length=${contentLength}, 允许大小=${maxSize}`);
      return res.status(413).json({
        success: false,
        message: '请求内容过大'
      });
    }
    
    next();
  };
};

/**
 * 解析大小字符串为字节数
 * @param {string} size - 大小字符串 (如 '5mb', '1gb')
 * @returns {number} 字节数
 */
const parseSize = (size) => {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  
  // 使用更简单的正则表达式来解析大小字符串
  const match = size.toLowerCase().match(/^(\d+)\s*([a-z]*)$/);
  
  if (!match) {
    // 如果无法解析，尝试直接转换为数字
    const numericValue = parseFloat(size);
    return isNaN(numericValue) ? 0 : numericValue;
  }
  
  const value = parseInt(match[1]);
  const unit = (match[2] || 'b').toLowerCase();
  
  return value * (units[unit] || 1);
};

module.exports = {
  ipWhitelist,
  strictRateLimit,
  securityHeaders,
  sqlInjectionProtection,
  requestSizeLimit
};