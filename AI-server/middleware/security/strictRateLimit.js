/**
 * 敏感接口严格限流中间件
 * 对敏感操作（如登录、上传、数据库操作）应用更严格的限制
 */

const logger = require('../../config/logger');

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
        if (data && data.success === true) {
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

module.exports = strictRateLimit;