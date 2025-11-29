/**
 * 安全防护测试路由
 * 用于测试各种安全防护机制
 */

const express = require('express');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { ipWhitelist, strictRateLimit, securityHeaders, sqlInjectionProtection, requestSizeLimit } = require('../middleware/security');

const router = express.Router();

/**
 * 速率限制测试
 * GET /api/security/test/rate-limit
 */
router.get('/test/rate-limit', strictRateLimit({ 
  windowMs: 60000,
  maxRequests: 3,
  skipSuccessfulRequests: false
}), responseWrapper(asyncHandler(async (req, res) => {
  return res.json({
    success: true,
    message: '速率限制测试接口',
    timestamp: new Date().toISOString()
  });
})));

/**
 * SQL注入防护测试
 * GET /api/security/test/sql-injection?search=' OR 1=1--
 */
router.get('/test/sql-injection', sqlInjectionProtection(), responseWrapper(asyncHandler(async (req, res) => {
  return res.json({
    success: true,
    message: 'SQL注入防护测试接口',
    query: req.query
  });
})));

/**
 * 请求大小限制测试
 * POST /api/security/test/request-size
 */
router.post('/test/request-size', requestSizeLimit('1mb'), responseWrapper(asyncHandler(async (req, res) => {
  return res.json({
    success: true,
    message: '请求大小限制测试接口',
    bodySize: JSON.stringify(req.body).length
  });
})));

/**
 * IP白名单测试
 * GET /api/security/test/ip-whitelist
 */
router.get('/test/ip-whitelist', ipWhitelist(['127.0.0.1', '::1', '192.168.1.1']), responseWrapper(asyncHandler(async (req, res) => {
  return res.json({
    success: true,
    message: 'IP白名单测试接口',
    clientIp: req.ip,
    timestamp: new Date().toISOString()
  });
})));

/**
 * 安全配置信息获取
 * GET /api/security/config
 */
router.get('/config', responseWrapper(asyncHandler(async (req, res) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  return res.json({
    success: true,
    message: '安全配置信息',
    data: {
      environment: process.env.NODE_ENV,
      rateLimiting: {
        enabled: !isDevelopment && !isTest,
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10
      },
      securityHeaders: {
        enabled: true,
        features: [
          'User-Agent检查',
          'Referer检查',
          '可疑模式检测'
        ]
      },
      sqlInjectionProtection: {
        enabled: true,
        features: [
          'SQL关键字检测',
          '特殊字符检测',
          '参数结构检查'
        ]
      },
      requestSizeLimit: {
        enabled: true,
        maxSize: '5mb'
      },
      strictRateLimit: {
        enabled: true,
        defaultMaxRequests: 3,
        sensitiveEndpoints: [
          '/api/auth/login',
          '/api/auth/register',
          '/api/upload/*'
        ]
      }
    }
  });
})));

module.exports = router;