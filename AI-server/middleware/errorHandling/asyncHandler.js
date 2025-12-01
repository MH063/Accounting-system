/**
 * 异步错误处理包装器
 * 捕获异步路由处理器中的错误并传递给错误处理中间件
 */

const logger = require('../../config/logger');

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error('[ASYNC_HANDLER] 异步处理错误:', {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method
      });
      next(error);
    });
  };
};

module.exports = asyncHandler;