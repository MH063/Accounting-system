/**
 * 用户认证路由
 * 使用控制器层处理业务逻辑
 * 路由层 -> 控制器层 -> 服务层 -> 数据访问层 -> 模型层
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandling');
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
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.login(req, res, next);
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
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.updateProfile(req, res, next);
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
 * 只验证刷新令牌，不需要访问令牌
 */
router.post('/refresh', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.refreshToken(req, res, next);
  }))
);

/**
 * 安全刷新令牌路由（实现刷新令牌轮换）
 * POST /api/auth/refresh-token
 */
router.post('/refresh-token', 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.refreshSecureToken(req, res);
  }))
);

/**
 * 用户登出路由
 * POST /api/auth/logout
 */
router.post('/logout', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.logout(req, res, next);
  }))
);

/**
 * 短信登录路由
 * POST /api/auth/sms-login
 */
router.post('/sms-login', 
  strictRateLimit({ 
    windowMs: 60000, // 1分钟
    maxRequests: 5,  // 每分钟最多5次登录尝试
    skipSuccessfulRequests: true // 成功后不计入限制
  }), 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.smsLogin(req, res, next);
  }))
);

/**
 * 两步验证路由
 * POST /api/auth/two-factor/verify
 */
router.post('/two-factor/verify', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.verifyTwoFactorCode(req, res, next);
  }))
);

/**
 * 启用两步验证路由
 * POST /api/auth/two-factor/enable
 * 需要有效的JWT令牌才能访问
 */
router.post('/two-factor/enable', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.enableTwoFactor(req, res, next);
  }))
);

/**
 * 禁用两步验证路由
 * POST /api/auth/two-factor/disable
 * 需要有效的JWT令牌才能访问
 */
router.post('/two-factor/disable', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.disableTwoFactor(req, res, next);
  }))
);

/**
 * 获取两步验证状态路由
 * GET /api/auth/two-factor/status
 * 需要有效的JWT令牌才能访问
 */
router.get('/two-factor/status', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.getTwoFactorStatus(req, res, next);
  }))
);

/**
 * 生成两步验证码路由
 * POST /api/auth/two-factor/generate
 * 需要有效的JWT令牌才能访问
 */
router.post('/two-factor/generate', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.generateTwoFactorCode(req, res, next);
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

/**
 * 验证邮箱验证码路由
 * POST /api/auth/verify-email-code
 */
router.post('/verify-email-code', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.verifyEmailCode(req, res, next);
  }))
);

/**
 * 发送邮箱验证码路由
 * POST /api/auth/send-email-code
 */
router.post('/send-email-code', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.sendEmailVerificationCode(req, res, next);
  }))
);

/**
 * 验证邮箱
 * POST /api/auth/verify-email
 */
router.post('/verify-email', 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.verifyEmail(req, res);
  }))
);

/**
 * 更新QQ号码
 * PUT /api/auth/qq-number
 * 需要有效的JWT令牌才能访问
 */
router.put('/qq-number', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.updateQQNumber(req, res);
  }))
);

/**
 * 验证QQ号
 * POST /api/auth/verify-qq
 * 需要有效的JWT令牌才能访问
 */
router.post('/verify-qq', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.verifyQQ(req, res);
  }))
);

/**
 * 请求密码重置
 * POST /api/auth/request-password-reset
 */
router.post('/request-password-reset', 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.requestPasswordReset(req, res);
  }))
);

/**
 * 请求密码重置验证码
 * POST /api/auth/request-password-reset-code
 */
router.post('/request-password-reset-code', 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.requestPasswordResetCode(req, res);
  }))
);

/**
 * 重置密码
 * POST /api/auth/reset-password
 */
router.post('/reset-password', 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.resetPassword(req, res);
  }))
);

/**
 * 验证密码重置验证码并重置密码
 * POST /api/auth/reset-password-with-code
 */
router.post('/reset-password-with-code', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.resetPasswordWithCode(req, res, next);
  }))
);

/**
 * 停用账户
 * POST /api/auth/deactivate
 * 需要有效的JWT令牌才能访问
 */
router.post('/deactivate', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.deactivateAccount(req, res);
  }))
);

/**
 * 删除账户
 * DELETE /api/auth/account
 * 需要有效的JWT令牌才能访问
 */
router.delete('/account', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.deleteAccount(req, res);
  }))
);

/**
 * 验证令牌路由
 * POST /api/auth/validate-token
 */
router.post('/validate-token', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.validateToken(req, res, next);
  }))
);

/**
 * 重新生成备份验证码路由
 * POST /api/auth/two-factor/backup-codes/regenerate
 * 需要有效的JWT令牌才能访问
 */
router.post('/two-factor/backup-codes/regenerate', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.regenerateBackupCodes(req, res, next);
  }))
);

/**
 * 获取客户端IP地址路由
 * GET /api/auth/client-ip
 * 用于前端获取真实IP地址用于安全日志记录
 */
router.get('/client-ip', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.getClientIp(req, res, next);
  }))
);

/**
 * 生成TOTP密钥路由
 * POST /api/auth/totp/generate
 * 需要有效的JWT令牌才能访问
 */
router.post('/totp/generate', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.generateTotpSecret(req, res, next);
  }))
);

/**
 * 启用TOTP两步验证路由
 * POST /api/auth/totp/enable
 * 需要有效的JWT令牌才能访问
 */
router.post('/totp/enable', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.enableTotpAuth(req, res, next);
  }))
);

/**
 * 禁用TOTP两步验证路由
 * POST /api/auth/totp/disable
 * 需要有效的JWT令牌才能访问
 */
router.post('/totp/disable', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.disableTotpAuth(req, res, next);
  }))
);

/**
 * 验证TOTP两步验证码路由
 * POST /api/auth/totp/verify
 * 需要有效的JWT令牌才能访问
 */
router.post('/totp/verify', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.verifyTotpCode(req, res, next);
  }))
);

/**
 * 获取TOTP状态路由
 * GET /api/auth/totp/status
 * 需要有效的JWT令牌才能访问
 */
router.get('/totp/status', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await authController.getTotpStatus(req, res, next);
  }))
);

module.exports = router;
