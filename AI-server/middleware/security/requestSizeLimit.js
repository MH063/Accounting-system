/**
 * 请求大小限制中间件
 * 防止大文件攻击
 */

const logger = require('../../config/logger');

const requestSizeLimit = (maxSize = '5mb') => {
  return (req, res, next) => {
    const contentLength = req.get('Content-Length');
    const maxBytes = parseSize(maxSize);
    
    // 调试日志
    logger.info(`[SECURITY] 请求大小检查: Content-Length=${contentLength}, 允许大小=${maxBytes}字节`);
    console.log(`[SECURITY DEBUG] 请求大小检查: Content-Length=${contentLength}, 允许大小=${maxBytes}字节`);
    
    if (contentLength && parseInt(contentLength) > maxBytes) {
      console.log(`[SECURITY DEBUG] 请求大小超限: Content-Length=${contentLength}, 允许大小=${maxBytes}字节`);
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
  const match = size.toLowerCase().match(/^(\d+)([a-z]+)?$/);
  
  if (!match) {
    return parseInt(size);
  }
  
  const value = parseInt(match[1]);
  const unit = match[2] || 'b';
  
  return value * (units[unit] || 1);
};

module.exports = requestSizeLimit;