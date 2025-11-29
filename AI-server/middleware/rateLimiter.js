/**
 * API速率限制中间件
 * 根据环境配置不同的速率限制策略
 */

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * 创建速率限制中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Express中间件
 */
const createRateLimiter = (options = {}) => {
  // 从环境变量获取配置
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  // 开发和测试环境完全不限制请求
  if (isDevelopment || isTest) {
    logger.info(`[RATE_LIMIT] 当前环境: ${process.env.NODE_ENV}，不应用速率限制策略`);
    
    // 返回一个直接调用next()的中间件，不进行任何限制
    return (req, res, next) => {
      next();
    };
  }
  
  // 生产环境应用严格的速率限制
  logger.info(`[RATE_LIMIT] 当前环境: ${process.env.NODE_ENV}，应用严格的速率限制策略`);
  
  return rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10, // 每分钟最多10次请求
    message: {
      success: false,
      message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true, // 返回速率限制信息在 `RateLimit-*` headers
    legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // 是否跳过成功的请求
    skipFailedRequests: false, // 是否跳过失败的请求
    handler: (req, res) => {
      logger.warn(`[RATE_LIMIT] 速率限制触发: IP=${req.ip}, 路径=${req.path}, User-Agent=${req.get('User-Agent')}`);
      res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试'
      });
    }
  });
};

// 创建默认的速率限制中间件
const defaultRateLimiter = createRateLimiter();

module.exports = {
  createRateLimiter,
  defaultRateLimiter
};