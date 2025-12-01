/**
 * IP白名单中间件
 * 只允许白名单中的IP访问敏感接口
 */

const logger = require('../../config/logger');

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

module.exports = ipWhitelist;