/**
 * 错误处理中间件索引文件
 * 导出所有错误处理相关的中间件
 */

const normalizePath = require('./normalizePath');
const notFoundHandler = require('./notFound');
const globalErrorHandler = require('./globalErrorHandler');
const { enhancedGlobalErrorHandler } = require('./enhancedErrorHandler');
const asyncHandler = require('./asyncHandler');

/**
 * 重试装饰器函数
 * @param {Function} fn - 要包装的异步函数
 * @param {Object} options - 重试选项
 * @param {number} options.maxRetries - 最大重试次数
 * @param {number} options.delay - 重试延迟（毫秒）
 * @param {Function} options.shouldRetry - 判断是否应该重试的函数
 * @returns {Function} 包装后的函数
 */
const withRetry = (fn, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    shouldRetry = () => true
  } = options;

  return async (...args) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // 如果是最后一次尝试或者不应该重试，则抛出错误
        if (attempt === maxRetries || !shouldRetry(error)) {
          throw error;
        }
        
        // 等待重试
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError;
  };
};

module.exports = {
  normalizePath,
  notFound: notFoundHandler,
  notFoundHandler,
  errorHandler: globalErrorHandler,
  globalErrorHandler,
  enhancedErrorHandler: enhancedGlobalErrorHandler,
  enhancedGlobalErrorHandler,
  asyncHandler,
  withRetry
};