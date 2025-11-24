/**
 * 全局错误处理中间件
 * 统一处理应用程序中的错误，包含异常恢复和服务降级机制
 */

const logger = require('../config/logger');
const { pool } = require('../config/database');

/**
 * 404错误处理中间件
 */
const notFound = (req, res, next) => {
  const error = new Error(`未找到路径 - ${req.originalUrl}`);
  res.status(404);
  logger.api(`404 - 未找到路径: ${req.originalUrl}`, { method: req.method, ip: req.ip });
  next(error);
};

/**
 * 全局错误处理中间件
 * 包含智能错误分类、重试机制和服务降级
 */
const errorHandler = (err, req, res, next) => {
  // 如果响应状态码是200，设置为500
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errorType = 'UNKNOWN';
  let shouldRetry = false;
  let isRecoverable = false;

  // 数据库连接错误检测
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message.includes('ECONNREFUSED')) {
    errorType = 'DATABASE_CONNECTION';
    message = '数据库连接失败';
    statusCode = 503; // Service Unavailable
    shouldRetry = true;
    isRecoverable = true;
    logger.error('数据库连接错误', { error: err.message, url: req.originalUrl, ip: req.ip });
    
    // 尝试数据库连接重连
    try {
      pool.query('SELECT 1').then(() => {
        logger.info('数据库连接恢复');
      }).catch(() => {
        logger.error('数据库连接重连失败');
      });
    } catch (e) {
      logger.error('重连操作执行失败', { error: e.message });
    }
  }

  // Mongoose错误处理
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    errorType = 'INVALID_ID';
    message = '资源未找到';
    statusCode = 404;
  }

  // PostgreSQL错误处理
  if (err.code) {
    switch (err.code) {
      case '23505': // 唯一约束违反
        errorType = 'DUPLICATE_ENTRY';
        message = '数据已存在，违反唯一约束';
        statusCode = 409;
        break;
      case '23503': // 外键约束违反
        errorType = 'FOREIGN_KEY_VIOLATION';
        message = '关联数据不存在';
        statusCode = 400;
        break;
      case '23502': // 非空约束违反
        errorType = 'NOT_NULL_VIOLATION';
        message = '必填字段不能为空';
        statusCode = 400;
        break;
      case '23514': // 检查约束违反
        errorType = 'CHECK_VIOLATION';
        message = '数据不符合约束条件';
        statusCode = 400;
        break;
      case '08003': // 连接不存在
      case '08006': // 连接失败
        errorType = 'DATABASE_CONNECTION_LOST';
        message = '数据库连接丢失';
        statusCode = 503;
        shouldRetry = true;
        isRecoverable = true;
        break;
      case '08001': // 无法连接到服务器
        errorType = 'DATABASE_UNREACHABLE';
        message = '数据库服务器不可达';
        statusCode = 503;
        shouldRetry = true;
        isRecoverable = true;
        break;
      case '42P01': // 表不存在
        errorType = 'TABLE_NOT_FOUND';
        message = '数据表不存在';
        statusCode = 500;
        break;
      case '42703': // 列不存在
        errorType = 'COLUMN_NOT_FOUND';
        message = '数据列不存在';
        statusCode = 500;
        break;
      default:
        errorType = 'DATABASE_ERROR';
        message = '数据库操作失败';
        statusCode = 500;
        logger.error(`未处理的数据库错误`, { code: err.code, message: err.message, stack: err.stack });
    }
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    errorType = 'INVALID_TOKEN';
    message = '无效的令牌';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    errorType = 'TOKEN_EXPIRED';
    message = '令牌已过期';
    statusCode = 401;
  }

  // 文件上传错误处理
  if (err.code === 'LIMIT_FILE_SIZE') {
    errorType = 'FILE_SIZE_EXCEEDED';
    message = '文件大小超出限制';
    statusCode = 400;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    errorType = 'FILE_COUNT_EXCEEDED';
    message = '文件数量超出限制';
    statusCode = 400;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    errorType = 'UNEXPECTED_FILE_FIELD';
    message = '不支持的文件字段';
    statusCode = 400;
  }

  // 网络错误处理
  if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
    errorType = 'NETWORK_ERROR';
    message = '网络连接失败';
    statusCode = 502; // Bad Gateway
    shouldRetry = true;
    isRecoverable = true;
  }

  // 系统资源错误处理
  if (err.code === 'EMFILE' || err.code === 'ENFILE') {
    errorType = 'RESOURCE_EXHAUSTION';
    message = '系统资源不足';
    statusCode = 503;
    shouldRetry = true;
    isRecoverable = true;
    logger.error('系统资源不足', { code: err.code, message: err.message });
  }

  // JSON解析错误处理
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    errorType = 'INVALID_JSON';
    message = '请求数据格式无效';
    statusCode = 400;
  }

  // 默认错误类型
  if (errorType === 'UNKNOWN') {
    errorType = 'INTERNAL_ERROR';
    
    // 根据错误消息内容进行智能分类
    if (err.message.includes('timeout')) {
      errorType = 'TIMEOUT_ERROR';
      message = '请求超时';
      statusCode = 408;
      shouldRetry = true;
    } else if (err.message.includes('permission') || err.message.includes('access')) {
      errorType = 'PERMISSION_ERROR';
      message = '权限不足';
      statusCode = 403;
    } else if (err.message.includes('validation')) {
      errorType = 'VALIDATION_ERROR';
      message = '数据验证失败';
      statusCode = 400;
    }
  }

  // 构建错误日志信息
  const errorLog = {
    errorType,
    statusCode,
    message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    shouldRetry,
    isRecoverable,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // 根据错误类型选择日志级别
  if (isRecoverable) {
    logger.warn(`可恢复错误: ${message}`, errorLog);
  } else if (statusCode >= 500) {
    logger.error(`服务器错误: ${message}`, errorLog);
  } else if (statusCode >= 400) {
    logger.warn(`客户端错误: ${message}`, errorLog);
  } else {
    logger.info(`业务错误: ${message}`, errorLog);
  }

  // 返回错误响应
  const response = {
    success: false,
    message,
    error: {
      type: errorType,
      timestamp: new Date().toISOString()
    }
  };

  // 添加重试信息（仅对可恢复错误）
  if (shouldRetry && isRecoverable) {
    response.error.retryable = true;
    response.error.retryAfter = Math.min(Math.pow(2, (statusCode % 5)) * 1000, 30000); // 指数退避，最大30秒
  }

  // 开发环境下返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    response.error.details = {
      stack: err.stack,
      originalMessage: err.message,
      errorCode: err.code || null
    };
  }

  res.status(statusCode).json(response);
};

/**
 * 服务降级机制
 */
const createServiceDegradationHandler = () => {
  const fallbackData = {
    // 默认降级响应数据
    cache: {
      message: '服务降级中，缓存数据不可用',
      data: [],
      timestamp: new Date().toISOString()
    },
    database: {
      message: '数据库服务暂时不可用',
      data: null,
      timestamp: new Date().toISOString()
    },
    file: {
      message: '文件服务暂时不可用',
      data: { files: [], uploadPath: null },
      timestamp: new Date().toISOString()
    },
    external: {
      message: '外部服务暂时不可用',
      data: null,
      timestamp: new Date().toISOString()
    }
  };

  return (serviceType, req, res, next) => {
    return async (data = null) => {
      try {
        // 尝试正常处理
        return await data;
      } catch (error) {
        logger.warn(`服务降级: ${serviceType} 服务不可用`, {
          error: error.message,
          url: req.originalUrl,
          method: req.method,
          ip: req.ip
        });

        // 返回降级响应
        const fallbackResponse = {
          success: true,
          data: data || fallbackData[serviceType] || fallbackData.database,
          degraded: true,
          message: `${serviceType} 服务暂时不可用，已启用降级模式`,
          timestamp: new Date().toISOString()
        };

        res.status(206).json(fallbackResponse); // 206 Partial Content
      }
    };
  };
};

/**
 * 错误恢复策略
 */
const recoveryStrategies = {
  // 数据库连接恢复
  database: {
    maxRetries: 3,
    baseDelay: 1000, // 1秒
    exponentialBackoff: true,
    
    async retry(operation) {
      let lastError;
      
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          // 测试数据库连接
          await pool.query('SELECT 1');
          
          // 连接成功，执行原始操作
          return await operation();
        } catch (error) {
          lastError = error;
          logger.warn(`数据库重试第 ${attempt} 次失败`, { 
            error: error.message, 
            attempt,
            maxRetries: this.maxRetries
          });
          
          if (attempt < this.maxRetries) {
            // 计算延迟时间
            let delay = this.exponentialBackoff 
              ? this.baseDelay * Math.pow(2, attempt - 1)
              : this.baseDelay;
            
            // 添加随机抖动，避免雷鸣群体效应
            delay += Math.random() * 1000;
            
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // 所有重试都失败了
      throw lastError;
    }
  },
  
  // 文件操作恢复
  file: {
    maxRetries: 2,
    baseDelay: 500,
    
    async retry(operation) {
      let lastError;
      
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          
          // 如果是权限或磁盘空间错误，不进行重试
          if (error.code === 'EACCES' || error.code === 'ENOSPC') {
            break;
          }
          
          logger.warn(`文件操作重试第 ${attempt} 次失败`, { 
            error: error.message, 
            attempt,
            maxRetries: this.maxRetries
          });
          
          if (attempt < this.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, this.baseDelay * attempt));
          }
        }
      }
      
      throw lastError;
    }
  },
  
  // 网络请求恢复
  network: {
    maxRetries: 5,
    baseDelay: 2000,
    
    async retry(operation) {
      let lastError;
      
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          
          // 4xx错误不重试（客户端错误）
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            break;
          }
          
          logger.warn(`网络请求重试第 ${attempt} 次失败`, { 
            error: error.message, 
            attempt,
            status: error.response?.status,
            maxRetries: this.maxRetries
          });
          
          if (attempt < this.maxRetries) {
            // 指数退避算法
            const delay = this.baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      throw lastError;
    }
  }
};

/**
 * 重试装饰器
 * @param {string} strategy - 恢复策略名称
 * @param {Function} operation - 要重试的操作
 */
const withRetry = (strategy, operation) => {
  return async (...args) => {
    const retryStrategy = recoveryStrategies[strategy];
    if (!retryStrategy) {
      throw new Error(`未知的恢复策略: ${strategy}`);
    }
    
    return await retryStrategy.retry(async () => {
      return await operation(...args);
    });
  };
};

/**
 * 健康检查端点处理
 */
const healthCheckHandler = async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  };

  try {
    // 数据库健康检查
    try {
      await pool.query('SELECT 1');
      checks.checks.database = {
        status: 'healthy',
        responseTime: 'OK'
      };
    } catch (error) {
      checks.checks.database = {
        status: 'unhealthy',
        error: error.message
      };
      checks.status = 'unhealthy';
    }

    // 内存使用检查
    const memUsage = process.memoryUsage();
    checks.checks.memory = {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB阈值
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
    };

    if (memUsage.heapUsed > 500 * 1024 * 1024) {
      checks.status = 'degraded';
    }

    // 文件系统检查
    try {
      const fs = require('fs').promises;
      await fs.access('./uploads', fs.constants.W_OK);
      checks.checks.storage = {
        status: 'healthy',
        message: '文件系统可写'
      };
    } catch (error) {
      checks.checks.storage = {
        status: 'unhealthy',
        error: error.message
      };
      checks.status = 'unhealthy';
    }

    const statusCode = checks.status === 'healthy' ? 200 : 
                     checks.status === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json(checks);
  } catch (error) {
    logger.error('健康检查失败', { error: error.message });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: '健康检查过程中发生错误',
      checks: {
        system: {
          status: 'unhealthy',
          error: error.message
        }
      }
    });
  }
};

/**
 * 异步错误处理包装器
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  createServiceDegradationHandler,
  withRetry,
  recoveryStrategies,
  healthCheckHandler
};