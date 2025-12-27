/**
 * 安全检查控制器
 * 提供用户账户安全状态实时检查API
 */

const { SecurityCheckService } = require('../services/securityCheckService');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');
const { pool } = require('../config/database');
const logger = require('../config/logger');

let securityCheckService = null;

/**
 * 获取安全检查服务实例
 */
const getSecurityCheckService = () => {
  if (!securityCheckService) {
    securityCheckService = new SecurityCheckService(pool);
  }
  return securityCheckService;
};

/**
 * 执行安全检查
 * POST /api/security/check
 */
const performSecurityCheck = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const context = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  };

  logger.info(`[SecurityCheck] 用户 ${userId} 发起实时安全评估请求`);

  const result = await getSecurityCheckService().performCheck(userId, context);

  if (result.success) {
    res.json({
      success: true,
      message: '实时安全评估完成',
      data: {
        overallScore: result.overallScore,
        riskLevel: result.riskLevel,
        riskLabel: result.riskLabel,
        checkTime: result.checkTime,
        duration: result.duration,
        factors: result.factors,
        weightExplanation: result.weightExplanation,
        summary: result.summary
      }
    });
  } else {
    res.status(500).json({
      success: false,
      message: '安全评估失败',
      error: result.error
    });
  }
}));

/**
 * 获取安全检查因子详情
 * GET /api/security/check/factors
 */
const getSecurityFactors = responseWrapper(asyncHandler(async (req, res, next) => {
  const { SECURITY_FACTORS } = require('../services/securityCheckService');

  const factors = Object.entries(SECURITY_FACTORS).map(([key, factor]) => ({
    id: key,
    name: factor.name,
    weight: factor.weight,
    maxScore: factor.maxScore,
    description: `${factor.weight}%权重，影响整体安全性`
  }));

  res.json({
    success: true,
    data: {
      factors,
      totalWeight: factors.reduce((sum, f) => sum + f.weight, 0)
    }
  });
}));

/**
 * 更新用户安全设置
 * PUT /api/security/settings
 */
const updateSecuritySettings = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const updateData = req.body;
  const UserService = require('../services/UserService');
  const userService = new UserService();

  logger.info(`[SecurityCheck] 用户 ${userId} 更新安全设置:`, updateData);

  const result = await userService.updateProfile(userId, updateData);

  if (result.success) {
    res.json({
      success: true,
      message: '安全设置更新成功',
      data: result.data
    });
  } else {
    res.status(400).json({
      success: false,
      message: '安全设置更新失败',
      error: result.message
    });
  }
}));

/**
 * 获取用户安全设置
 * GET /api/security/settings
 */
const getSecuritySettings = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const UserService = require('../services/UserService');
  const userService = new UserService();

  logger.info(`[SecurityCheck] 用户 ${userId} 获取安全设置`);

  const result = await userService.getProfile(userId);

  if (result.success) {
    const user = result.data;
    res.json({
      success: true,
      data: {
        login_protection_enabled: user.login_protection_enabled,
        email_alerts_enabled: user.email_alerts_enabled,
        sms_alerts_enabled: user.sms_alerts_enabled,
        session_timeout_minutes: user.session_timeout_minutes,
        session_timeout_warning_minutes: user.session_timeout_warning_minutes,
        biometric_enabled: user.biometric_enabled
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: '获取安全设置失败',
      error: result.message
    });
  }
}));

module.exports = {
  performSecurityCheck,
  getSecurityFactors,
  updateSecuritySettings,
  getSecuritySettings
};
