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
    // 确保 data 始终是一个对象，处理双层嵌套结构 (Rule 5)
    // 如果 data 是数组，自动包装成对象
    if (Array.isArray(data)) {
      response.data = { list: data };
    } else {
      response.data = data;
    }
  }
  
  logger.debug(`[RESPONSE] ${message}`, {
    statusCode,
    success: true,
    hasData: data !== null
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

// 导出别名以增强兼容性
const sendSuccess = successResponse;
const sendError = errorResponse;

/**
 * 包装路由处理器，确保成功响应状态码为200
 * @param {Function} handler - 路由处理函数
 * @returns {Function} 包装后的处理函数
 */
const responseWrapper = (handler) => {
  return async (req, res, next) => {
    try {
      const originalJson = res.json;
      res.json = function(data) {
        if (data && data.success === true && res.statusCode !== 200) {
          res.statusCode = 200;
        }
        return originalJson.call(this, data);
      };
      
      const handlerLength = handler.length;
      
      let result;
      if (handlerLength >= 3) {
        result = await handler(req, res, next);
      } else {
        result = await handler(req, res);
      }
      
      if (result !== undefined && !res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  successResponse,
  errorResponse,
  sendSuccess,
  sendError,
  responseWrapper
};