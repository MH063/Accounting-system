/**
 * 全局错误处理中间件
 * 捕获并处理应用程序中的所有未处理错误
 */

const logger = require('../../config/logger');

const globalErrorHandler = () => {
  return (err, req, res, next) => {
    // 记录错误日志
    logger.error('[GLOBAL_ERROR] 未处理的错误:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // 确定HTTP状态码
    const statusCode = err.status || err.statusCode || 500;
    let message = err.message || '服务器内部错误';

    // 针对特定类型的错误优化提示信息
    if (err.name === 'ValidationError') {
      message = `数据验证失败: ${err.message}`;
    } else if (err.code === '23505') {
      message = '数据已存在，请勿重复提交';
    }

    // 发送错误响应
    res.status(statusCode).json({
      success: false,
      message: message,
      error_code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details || undefined 
      }),
      timestamp: new Date().toISOString()
    });
  };
};

module.exports = globalErrorHandler;