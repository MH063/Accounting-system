/**
 * 请求头安全检查中间件
 * 检查恶意请求头和User-Agent
 */

const logger = require('../../config/logger');

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

module.exports = securityHeaders;