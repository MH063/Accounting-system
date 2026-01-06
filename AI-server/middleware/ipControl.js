/**
 * IP 访问控制中间件
 */

const IPControlService = require('../services/IPControlService');
const logger = require('../config/logger');
const { errorResponse } = require('./response');

const ipControl = async (req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.ip || 
                   req.connection?.remoteAddress || 
                   req.socket?.remoteAddress;
  
  // 处理 IP 地址（如果有多个则取第一个）
  let ip = clientIp;
  if (ip && typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // 处理 IPv6 映射
  if (ip && typeof ip === 'string' && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  const isAllowed = await IPControlService.checkAccess(ip);

  if (!isAllowed) {
    logger.security(req, 'IP 访问被拦截', {
      ip,
      path: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent')
    });

    return errorResponse(res, '您的 IP 地址不在允许访问列表中，或已被加入黑名单', 403);
  }

  next();
};

module.exports = ipControl;
