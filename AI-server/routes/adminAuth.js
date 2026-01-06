/**
 * 管理端认证路由
 * 处理管理员登录、认证相关的HTTP请求
 */

const express = require('express');
const router = express.Router();
const AdminAuthController = require('../controllers/AdminAuthController');
const { adminAuthMiddleware } = require('../middlewares/adminAuthMiddleware');
const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

const adminAuthController = new AdminAuthController();

/**
 * 管理员登录限流配置
 * 限制每个IP每分钟最多5次登录尝试
 */
const adminLoginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 5, // 限制5次
  message: {
    success: false,
    message: '登录尝试过于频繁，请稍后再试',
    code: 'LOGIN_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security(req, '管理员登录被限流', { 
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      success: false,
      message: '登录尝试过于频繁，请1分钟后再试',
      code: 'LOGIN_RATE_LIMITED',
      retryAfter: 60
    });
  }
});

/**
 * @route   GET /api/admin/heartbeat
 * @desc    管理员心跳上报
 * @access  Public (无需认证)
 */
router.get('/heartbeat', (req, res, next) => {
  adminAuthController.heartbeat(req, res, next);
});

/**
 * @route   POST /api/admin/login
 * @desc    管理员登录
 * @access  Public
 * @body    {username, password}
 */
router.post('/login', adminLoginLimiter, (req, res, next) => {
  adminAuthController.adminLogin(req, res, next);
});

/**
 * @route   POST /api/admin/verify-2fa
 * @desc    验证双因素认证码
 * @access  Public
 */
router.post('/verify-2fa', adminLoginLimiter, (req, res, next) => {
  adminAuthController.verifyTwoFactor(req, res, next);
});

/**
 * @route   POST /api/admin/logout
 * @desc    管理员登出
 * @access  Private (需要管理员认证)
 * @body    {refreshToken}
 */
router.post('/logout', adminAuthMiddleware, (req, res, next) => {
  adminAuthController.adminLogout(req, res, next);
});

/**
 * @route   GET /api/admin/profile
 * @desc    获取管理员资料
 * @access  Private (需要管理员认证)
 */
router.get('/profile', adminAuthMiddleware, (req, res, next) => {
  adminAuthController.getAdminProfile(req, res, next);
});

/**
 * @route   POST /api/admin/refresh-token
 * @desc    刷新管理员访问令牌
 * @access  Private (需要刷新令牌)
 * @body    {refreshToken}
 */
router.post('/refresh-token', (req, res, next) => {
  adminAuthController.refreshAdminToken(req, res, next);
});

/**
 * @route   GET /api/admin/verify
 * @desc    验证管理员令牌有效性
 * @access  Private (需要管理员认证)
 */
router.get('/verify', adminAuthMiddleware, (req, res) => {
  logger.info('[AdminAuthRoutes] 管理员令牌验证成功', { 
    userId: req.user.id,
    username: req.user.username
  });
  
  res.json({
    success: true,
    message: '管理员令牌有效',
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        permissions: req.user.permissions,
        adminLevel: req.user.adminLevel
      }
    }
  });
});

/**
 * 路由错误处理中间件
 */
router.use((error, req, res, next) => {
  logger.error('[AdminAuthRoutes] 路由错误', { 
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      code: 'VALIDATION_ERROR',
      errors: error.errors
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: '未授权访问',
      code: 'UNAUTHORIZED'
    });
  }

  return res.status(500).json({
    success: false,
    message: '服务器内部错误',
    code: 'INTERNAL_ERROR'
  });
});

module.exports = router;