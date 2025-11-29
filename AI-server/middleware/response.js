/**
 * 响应中间件
 * 确保所有成功响应的状态码为200
 */

const logger = require('../config/logger');

/**
 * 成功响应中间件
 * @param {Object} data - 响应数据
 * @param {string} message - 响应消息
 * @param {Object} res - Express响应对象
 */
const successResponse = (res, data = null, message = '操作成功', statusCode = 200) => {
  const response = {
    success: true,
    message
  };
  
  // 如果有数据，添加到响应中
  if (data !== null) {
    response.data = data;
  }
  
  logger.info(`[RESPONSE] ${message}`, {
    statusCode,
    success: true
  });
  
  return res.status(statusCode).json(response);
};

/**
 * 错误响应中间件
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {Object} error - 错误详情
 */
const errorResponse = (res, message = '操作失败', statusCode = 400, error = null) => {
  const response = {
    success: false,
    message
  };
  
  // 如果有错误详情，添加到响应中
  if (error) {
    response.error = error;
  }
  
  logger.error(`[RESPONSE] ${message}`, {
    statusCode,
    success: false,
    error: error ? error.message : null
  });
  
  return res.status(statusCode).json(response);
};

/**
 * 包装路由处理器，确保成功响应状态码为200
 * @param {Function} handler - 路由处理函数
 * @returns {Function} 包装后的处理函数
 */
const responseWrapper = (handler) => {
  return async (req, res, next) => {
    try {
      // 重写res.json方法，确保成功响应状态码为200
      const originalJson = res.json;
      res.json = function(data) {
        // 如果响应包含success: true，确保状态码为200
        if (data && data.success === true && res.statusCode !== 200) {
          res.statusCode = 200;
        }
        return originalJson.call(this, data);
      };
      
      // 调用原始处理函数
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  successResponse,
  errorResponse,
  responseWrapper
};