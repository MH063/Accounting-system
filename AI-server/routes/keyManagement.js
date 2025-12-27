/**
 * 密钥管理路由
 * 提供密钥管理API接口
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const keyManagementController = require('../controllers/keyManagementController');

const router = express.Router();

/**
 * 初始化密钥管理（应用启动时调用）
 * 注意：此接口需要在应用启动时手动调用，或在数据库初始化时调用
 */
router.post('/initialize', async (req, res, next) => {
  try {
    await keyManagementController.initializeKeyManagement();
    res.json({ success: true, message: '密钥管理初始化成功' });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取密钥状态
 * GET /api/keys/status
 */
router.get('/status', 
  authenticateToken, 
  keyManagementController.getKeyStatus
);

/**
 * 生成主密钥
 * POST /api/keys/generate
 */
router.post('/generate', 
  authenticateToken, 
  keyManagementController.generateMasterKey
);

/**
 * 验证密钥
 * POST /api/keys/verify
 */
router.post('/verify', 
  authenticateToken, 
  keyManagementController.verifyKey
);

/**
 * 轮换密钥
 * POST /api/keys/rotate
 */
router.post('/rotate', 
  authenticateToken, 
  keyManagementController.rotateKey
);

/**
 * 获取审计日志
 * GET /api/keys/audit
 */
router.get('/audit', 
  authenticateToken, 
  keyManagementController.getAuditLogs
);

// 硬件绑定相关路由
/**
 * 注册硬件绑定
 * POST /api/keys/hardware/register
 */
router.post('/hardware/register', 
  authenticateToken, 
  keyManagementController.registerHardware
);

/**
 * 验证硬件绑定
 * POST /api/keys/hardware/verify
 */
router.post('/hardware/verify', 
  authenticateToken, 
  keyManagementController.verifyHardware
);

/**
 * 获取可信设备列表
 * GET /api/keys/hardware/devices
 */
router.get('/hardware/devices', 
  authenticateToken, 
  keyManagementController.getTrustedDevices
);

/**
 * 撤销设备绑定
 * DELETE /api/keys/hardware/devices/:fingerprint
 */
router.delete('/hardware/devices/:fingerprint', 
  authenticateToken, 
  keyManagementController.revokeDevice
);

module.exports = router;
