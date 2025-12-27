/**
 * 数据加密路由
 * 提供用户数据加密/解密的API接口
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const dataEncryptionController = require('../controllers/dataEncryptionController');

const router = express.Router();

/**
 * 初始化数据加密（应用启动时调用）
 * POST /api/encryption/initialize
 */
router.post('/initialize', async (req, res, next) => {
  try {
    await dataEncryptionController.initializeDataEncryption();
    res.json({ success: true, message: '数据加密服务初始化成功' });
  } catch (error) {
    next(error);
  }
});

/**
 * 加密并保存数据
 * POST /api/encryption/data
 */
router.post('/data', 
  authenticateToken, 
  dataEncryptionController.encryptData
);

/**
 * 解密并读取数据
 * GET /api/encryption/data/:dataType
 */
router.get('/data/:dataType', 
  authenticateToken, 
  dataEncryptionController.decryptData
);

/**
 * 批量解密数据
 * GET /api/encryption/data/:dataType/batch
 */
router.get('/data/:dataType/batch', 
  authenticateToken, 
  dataEncryptionController.decryptBatch
);

/**
 * 删除加密数据
 * DELETE /api/encryption/data/:dataType/:dataId
 */
router.delete('/data/:dataType/:dataId', 
  authenticateToken, 
  dataEncryptionController.deleteEncryptedData
);

/**
 * 获取加密数据统计
 * GET /api/encryption/stats
 */
router.get('/stats', 
  authenticateToken, 
  dataEncryptionController.getEncryptionStats
);

module.exports = router;
