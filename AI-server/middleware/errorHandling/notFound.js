/**
 * 404错误处理中间件
 * 处理未匹配任何路由的请求
 */

const logger = require('../../config/logger');

const notFoundHandler = () => {
  return (req, res, next) => {
    // 如果前面的中间件都没有处理这个请求，则返回404
    logger.warn(`[404] 未找到路由: ${req.method} ${req.originalUrl}`);
    
    res.status(404).json({
      success: false,
      message: '请求的资源不存在',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  };
};

module.exports = notFoundHandler;