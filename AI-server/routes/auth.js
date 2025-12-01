/**
 * 用户认证路由
 * 使用控制器层处理业务逻辑
 * 路由层 -> 控制器层 -> 服务层 -> 数据访问层 -> 模型层
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { responseWrapper } = require('../middleware/response');
const { strictRateLimit } = require('../middleware/security');
const AuthController = require('../controllers/AuthController');

const router = express.Router();
const authController = new AuthController();

/**
 * 用户登录路由
 * POST /api/auth/login
 * 限制：每分钟最多5次登录尝试
 */
router.post('/login', 
  strictRateLimit({ 
    windowMs: 60000, // 1分钟
    maxRequests: 5,  // 每分钟最多5次登录尝试
    skipSuccessfulRequests: true // 成功后不计入限制
  }), 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.login(req, res);
  }))
);

/**
 * 用户注册路由
 * POST /api/auth/register
 * 限制：每分钟最多3次注册尝试
 */
router.post('/register', 
  strictRateLimit({ 
    windowMs: 60000, // 1分钟
    maxRequests: 3,  // 每分钟最多3次注册尝试
    skipSuccessfulRequests: true // 成功后不计入限制
  }), 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.register(req, res, next);
  }))
);

/**
 * 获取用户资料路由
 * GET /api/auth/profile
 * 需要有效的JWT令牌才能访问
 */
router.get('/profile', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.getProfile(req, res);
  }))
);

/**
 * 更新用户资料路由
 * PUT /api/auth/profile
 * 需要有效的JWT令牌才能访问
 */
router.put('/profile', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.updateProfile(req, res);
  }))
);

/**
 * 修改密码路由
 * POST /api/auth/change-password
 * 需要有效的JWT令牌才能访问
 */
router.post('/change-password', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.changePassword(req, res);
  }))
);

/**
 * 刷新令牌路由
 * POST /api/auth/refresh
 * 需要有效的JWT令牌才能访问
 */
router.post('/refresh', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.refreshToken(req, res);
  }))
);

/**
 * 用户登出路由
 * POST /api/auth/logout
 * 需要有效的JWT令牌才能访问
 */
router.post('/logout', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.logout(req, res);
  }))
);

/**
 * 检查用户名是否可用
 * GET /api/auth/check-username/:username
 */
router.get('/check-username/:username', 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.checkUsername(req, res);
  }))
);

/**
 * 检查邮箱是否可用
 * GET /api/auth/check-email/:email
 */
router.get('/check-email/:email', 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.checkEmail(req, res);
  }))
);

/**
 * 获取用户账户状态
 * GET /api/auth/account-status
 * 需要有效的JWT令牌才能访问
 */
router.get('/account-status', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.getAccountStatus(req, res);
  }))
);

/**
 * 获取活跃用户列表（管理员功能）
 * GET /api/auth/active-users
 * 需要管理员权限
 */
router.get('/active-users', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.getActiveUsers(req, res);
  }))
);

/**
 * 批量创建用户（管理员功能）
 * POST /api/auth/batch-create
 * 需要管理员权限
 */
router.post('/batch-create', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.batchCreateUsers(req, res);
  }))
);

/**
 * 批量删除用户（管理员功能）
 * DELETE /api/auth/batch-delete
 * 需要管理员权限
 */
router.delete('/batch-delete', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.batchDeleteUsers(req, res);
  }))
);

/**
 * 获取用户统计信息（管理员功能）
 * GET /api/auth/statistics
 * 需要管理员权限
 */
router.get('/statistics', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.getStatistics(req, res);
  }))
);

/**
 * 导出用户数据（管理员功能）
 * GET /api/auth/export
 * 需要管理员权限
 */
router.get('/export', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.exportUsers(req, res);
  }))
);

/**
 * 导入用户数据（管理员功能）
 * POST /api/auth/import
 * 需要管理员权限
 */
router.post('/import', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.importUsers(req, res);
  }))
);

module.exports = router;