/**
 * 增强的错误处理中间件
 * 防止敏感信息泄露，提供安全的错误响应
 */

const logger = require('../../config/logger');
const { filterSensitive } = require('../../config/sensitiveDataFilter');

// 错误类型映射
const ERROR_TYPES = {
  VALIDATION_ERROR: 'ValidationError',
  AUTHENTICATION_ERROR: 'AuthenticationError',
  AUTHORIZATION_ERROR: 'AuthorizationError',
  NOT_FOUND_ERROR: 'NotFoundError',
  DATABASE_ERROR: 'DatabaseError',
  NETWORK_ERROR: 'NetworkError',
  INTERNAL_ERROR: 'InternalError'
};

// HTTP状态码映射
const STATUS_CODES = {
  [ERROR_TYPES.VALIDATION_ERROR]: 400,
  [ERROR_TYPES.AUTHENTICATION_ERROR]: 401,
  [ERROR_TYPES.AUTHORIZATION_ERROR]: 403,
  [ERROR_TYPES.NOT_FOUND_ERROR]: 404,
  [ERROR_TYPES.DATABASE_ERROR]: 500,
  [ERROR_TYPES.NETWORK_ERROR]: 502,
  [ERROR_TYPES.INTERNAL_ERROR]: 500
};

// 用户友好的错误消息映射
const USER_FRIENDLY_MESSAGES = {
  [ERROR_TYPES.VALIDATION_ERROR]: '请求参数验证失败',
  [ERROR_TYPES.AUTHENTICATION_ERROR]: '身份验证失败，请重新登录',
  [ERROR_TYPES.AUTHORIZATION_ERROR]: '权限不足，无法访问此资源',
  [ERROR_TYPES.NOT_FOUND_ERROR]: '请求的资源不存在',
  [ERROR_TYPES.DATABASE_ERROR]: '数据库操作失败',
  [ERROR_TYPES.NETWORK_ERROR]: '网络连接异常',
  [ERROR_TYPES.INTERNAL_ERROR]: '服务器内部错误'
};

class SecurityAwareError extends Error {
  constructor(type, message, internalDetails = null, statusCode = null) {
    super(message);
    this.name = 'SecurityAwareError';
    this.type = type;
    this.internalDetails = internalDetails;
    this.statusCode = statusCode || STATUS_CODES[type] || 500;
    this.isUserFacing = true;
    
    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SecurityAwareError);
    }
  }
}

/**
 * 创建安全的错误响应
 * @param {Error} error - 错误对象
 * @param {Object} req - 请求对象
 * @returns {Object} 安全的错误响应
 */
const createSecureErrorResponse = (error, req) => {
  // 记录详细的错误日志（包含敏感信息，仅用于内部日志）
  logger.error('[SECURE_ERROR] 详细错误信息:', {
    type: error.type || error.name,
    message: error.message,
    stack: error.stack,
    internalDetails: error.internalDetails,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null,
    timestamp: new Date().toISOString()
  });

  // 确定错误类型
  let errorType = ERROR_TYPES.INTERNAL_ERROR;
  let statusCode = 500;
  let userMessage = '服务器内部错误';

  if (error instanceof SecurityAwareError) {
    errorType = error.type;
    statusCode = error.statusCode;
    userMessage = error.message;
  } else if (error.name === 'ValidationError' || error.name === 'BadRequestError') {
    errorType = ERROR_TYPES.VALIDATION_ERROR;
    statusCode = 400;
    userMessage = USER_FRIENDLY_MESSAGES[ERROR_TYPES.VALIDATION_ERROR];
  } else if (error.name === 'UnauthorizedError') {
    errorType = ERROR_TYPES.AUTHENTICATION_ERROR;
    statusCode = 401;
    userMessage = USER_FRIENDLY_MESSAGES[ERROR_TYPES.AUTHENTICATION_ERROR];
  } else if (error.name === 'ForbiddenError') {
    errorType = ERROR_TYPES.AUTHORIZATION_ERROR;
    statusCode = 403;
    userMessage = USER_FRIENDLY_MESSAGES[ERROR_TYPES.AUTHORIZATION_ERROR];
  } else if (error.name === 'NotFoundError') {
    errorType = ERROR_TYPES.NOT_FOUND_ERROR;
    statusCode = 404;
    userMessage = USER_FRIENDLY_MESSAGES[ERROR_TYPES.NOT_FOUND_ERROR];
  } else if (error.code && error.code.startsWith('ECONN')) {
    errorType = ERROR_TYPES.NETWORK_ERROR;
    statusCode = 502;
    userMessage = USER_FRIENDLY_MESSAGES[ERROR_TYPES.NETWORK_ERROR];
  } else if (error.code && (error.code === 'EACCES' || error.code === 'EPERM')) {
    errorType = ERROR_TYPES.AUTHORIZATION_ERROR;
    statusCode = 403;
    userMessage = USER_FRIENDLY_MESSAGES[ERROR_TYPES.AUTHORIZATION_ERROR];
  }

  // 构建用户友好的响应
  const response = {
    success: false,
    message: userMessage,
    errorId: generateErrorId(),
    timestamp: new Date().toISOString()
  };

  // 在开发环境中提供更多调试信息
  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      type: errorType,
      originalMessage: error.message.substring(0, 200) // 限制长度
    };
    
    // 只在开发环境显示堆栈跟踪
    if (error.stack) {
      response.debug.stack = error.stack.split('\n').slice(0, 5).join('\n');
    }
  }

  return { response, statusCode };
};

/**
 * 生成错误ID用于追踪
 * @returns {string} 错误ID
 */
const generateErrorId = () => {
  return 'err_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

/**
 * 过滤敏感信息
 * @param {string} message - 错误消息
 * @returns {string} 过滤后的消息
 */
const filterSensitiveInfo = (message) => {
  if (!message || typeof message !== 'string') return message;
  
  // 使用现有的敏感数据过滤器
  return filterSensitive(message);
};

/**
 * 增强的全局错误处理中间件
 * @returns {Function} 错误处理中间件
 */
const enhancedGlobalErrorHandler = () => {
  return (err, req, res, next) => {
    try {
      // 如果响应已经发送，委托给默认的错误处理程序
      if (res.headersSent) {
        return next(err);
      }

      // 过滤错误消息中的敏感信息
      if (err.message) {
        err.message = filterSensitiveInfo(err.message);
      }

      // 创建安全的错误响应
      const { response, statusCode } = createSecureErrorResponse(err, req);

      // 发送响应
      res.status(statusCode).json(response);
    } catch (handlerError) {
      // 如果错误处理本身出错，发送最基本的错误响应
      logger.error('[SECURE_ERROR] 错误处理器本身出错:', handlerError);
      
      res.status(500).json({
        success: false,
        message: '服务器处理错误时发生异常',
        errorId: generateErrorId(),
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * 创建特定类型的错误
 * @param {string} type - 错误类型
 * @param {string} message - 错误消息
 * @param {Object} details - 详细信息
 * @param {number} statusCode - HTTP状态码
 * @returns {SecurityAwareError}
 */
const createError = (type, message, details = null, statusCode = null) => {
  return new SecurityAwareError(type, message, details, statusCode);
};

/**
 * 验证错误处理中间件
 * @param {Error} err - 错误对象
 * @returns {boolean} 是否为安全错误
 */
const isSecurityAwareError = (err) => {
  return err instanceof SecurityAwareError;
};

module.exports = {
  enhancedGlobalErrorHandler,
  createError,
  SecurityAwareError,
  isSecurityAwareError,
  ERROR_TYPES,
  STATUS_CODES,
  USER_FRIENDLY_MESSAGES
};