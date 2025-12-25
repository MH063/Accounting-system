/**
 * 安全问题路由
 * 使用控制器层处理业务逻辑
 * 路由层 -> 控制器层 -> 数据访问层 -> 模型层
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandling');
const { responseWrapper } = require('../middleware/response');
const { strictRateLimit } = require('../middleware/security');
const SecurityQuestionController = require('../controllers/SecurityQuestionController');

const router = express.Router();
const securityQuestionController = SecurityQuestionController;

/**
 * 获取用户安全问题配置（用于验证，不返回答案）
 * GET /api/security-questions/config
 * 需要有效的JWT令牌才能访问
 */
router.get('/config', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await securityQuestionController.getSecurityQuestionConfig(req, res, next);
  }))
);

/**
 * 获取用户安全问题配置（包含答案，用于验证）
 * POST /api/security-questions/config-for-verification
 * 需要有效的JWT令牌才能访问
 */
router.post('/config-for-verification', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await securityQuestionController.getSecurityQuestionConfigForVerification(req, res, next);
  }))
);

/**
 * 保存用户安全问题配置
 * POST /api/security-questions/config
 * 需要有效的JWT令牌才能访问
 * 限制：每分钟最多3次设置尝试
 */
router.post('/config', 
  authenticateToken,
  strictRateLimit({ 
    windowMs: 60000, // 1分钟
    maxRequests: 3,  // 每分钟最多3次设置尝试
    skipSuccessfulRequests: true // 成功后不计入限制
  }),
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await securityQuestionController.saveSecurityQuestionConfig(req, res, next);
  }))
);

/**
 * 验证安全问题答案
 * POST /api/security-questions/verify
 * 需要有效的JWT令牌才能访问
 * 限制：每分钟最多10次验证尝试
 */
router.post('/verify', 
  authenticateToken,
  strictRateLimit({ 
    windowMs: 60000, // 1分钟
    maxRequests: 10, // 每分钟最多10次验证尝试
    skipSuccessfulRequests: false // 失败也计入限制
  }),
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await securityQuestionController.verifySecurityQuestionAnswers(req, res, next);
  }))
);

/**
 * 检查用户是否已设置安全问题
 * GET /api/security-questions/check
 * 需要有效的JWT令牌才能访问
 */
router.get('/check', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await securityQuestionController.checkSecurityQuestionsSetup(req, res, next);
  }))
);

/**
 * 删除用户安全问题配置
 * DELETE /api/security-questions/config
 * 需要有效的JWT令牌才能访问
 */
router.delete('/config', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await securityQuestionController.deleteSecurityQuestionConfig(req, res, next);
  }))
);

/**
 * 记录安全验证日志
 * POST /api/security-verification/log
 * 需要有效的JWT令牌才能访问
 */
router.post('/log', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await securityQuestionController.logSecurityVerification(req, res, next);
  }))
);

/**
 * 获取用户安全验证日志
 * GET /api/security-verification/logs
 * 需要有效的JWT令牌才能访问
 */
router.get('/logs', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await securityQuestionController.getSecurityVerificationLogs(req, res, next);
  }))
);

module.exports = router;
