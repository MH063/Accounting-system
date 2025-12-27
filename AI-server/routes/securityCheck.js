/**
 * 安全检查路由
 * 提供用户账户安全状态实时检查API
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const securityCheckController = require('../controllers/securityCheckController');

const router = express.Router();

/**
 * 执行安全检查
 * POST /api/security/check
 */
router.post('/check', 
  authenticateToken, 
  securityCheckController.performSecurityCheck
);

/**
 * 获取安全检查因子详情
 * GET /api/security/check/factors
 */
router.get('/check/factors', 
  authenticateToken, 
  securityCheckController.getSecurityFactors
);

/**
 * 获取用户安全设置
 * GET /api/security/settings
 */
router.get('/settings',
  authenticateToken,
  securityCheckController.getSecuritySettings
);

/**
 * 更新用户安全设置
 * PUT /api/security/settings
 */
router.put('/settings',
  authenticateToken,
  securityCheckController.updateSecuritySettings
);

module.exports = router;
