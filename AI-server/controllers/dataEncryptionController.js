/**
 * 数据加密控制器
 * 提供用户数据加密/解密的API接口
 */

const { DataEncryptionService } = require('../services/dataEncryptionService');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');
const { pool } = require('../config/database');

let dataEncryptionService = null;

/**
 * 初始化数据加密服务
 */
const initializeDataEncryption = () => {
  if (!dataEncryptionService) {
    dataEncryptionService = new DataEncryptionService(pool);
  }
  return dataEncryptionService.initializeTable();
};

/**
 * 获取数据加密服务实例
 */
const getDataEncryptionService = () => {
  if (!dataEncryptionService) {
    dataEncryptionService = new DataEncryptionService(pool);
  }
  return dataEncryptionService;
};

/**
 * 加密并保存数据
 * POST /api/encryption/data
 */
const encryptData = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const { dataType, dataId, data, metadata } = req.body;

  if (!dataType || !data) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数: dataType 和 data'
    });
  }

  // 获取用户的主密钥
  const { keyManagementService } = require('../services/keyManagementService');
  const masterKeyResult = await keyManagementService.getLatestMasterKey(userId);
  
  if (!masterKeyResult.success || !masterKeyResult.key) {
    return res.status(400).json({
      success: false,
      message: '无法获取用户主密钥，请先生成密钥'
    });
  }

  const result = await getDataEncryptionService().encryptAndSave(
    userId, dataType, dataId || 'default', data, masterKeyResult.key, metadata
  );

  if (result.success) {
    res.json({
      success: true,
      message: '数据加密保存成功',
      data: { dataHash: result.dataHash }
    });
  } else {
    res.status(500).json({
      success: false,
      message: '数据加密保存失败',
      error: result.error
    });
  }
}));

/**
 * 解密并读取数据
 * GET /api/encryption/data/:dataType
 */
const decryptData = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const { dataType } = req.params;
  const { dataId } = req.query;

  if (!dataType) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数: dataType'
    });
  }

  // 获取用户的主密钥
  const { keyManagementService } = require('../services/keyManagementService');
  const masterKeyResult = await keyManagementService.getLatestMasterKey(userId);
  
  if (!masterKeyResult.success || !masterKeyResult.key) {
    return res.status(400).json({
      success: false,
      message: '无法获取用户主密钥'
    });
  }

  const result = await getDataEncryptionService().decryptAndRead(
    userId, dataType, dataId, masterKeyResult.key
  );

  if (result.success) {
    res.json({
      success: true,
      data: {
        content: result.data,
        metadata: result.metadata,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: result.error || '未找到加密数据'
    });
  }
}));

/**
 * 批量解密数据
 * GET /api/encryption/data/:dataType/batch
 */
const decryptBatch = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const { dataType } = req.params;

  if (!dataType) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数: dataType'
    });
  }

  // 获取用户的主密钥
  const { keyManagementService } = require('../services/keyManagementService');
  const masterKeyResult = await keyManagementService.getLatestMasterKey(userId);
  
  if (!masterKeyResult.success || !masterKeyResult.key) {
    return res.status(400).json({
      success: false,
      message: '无法获取用户主密钥'
    });
  }

  const result = await getDataEncryptionService().decryptBatch(
    userId, dataType, masterKeyResult.key
  );

  if (result.success) {
    res.json({
      success: true,
      data: result.data
    });
  } else {
    res.status(500).json({
      success: false,
      message: '批量解密数据失败',
      error: result.error
    });
  }
}));

/**
 * 删除加密数据
 * DELETE /api/encryption/data/:dataType/:dataId
 */
const deleteEncryptedData = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const { dataType, dataId } = req.params;

  const result = await getDataEncryptionService().delete(userId, dataType, dataId);

  if (result.success) {
    res.json({
      success: true,
      message: result.deleted ? '数据已删除' : '数据不存在'
    });
  } else {
    res.status(500).json({
      success: false,
      message: '删除数据失败',
      error: result.error
    });
  }
}));

/**
 * 获取加密数据统计
 * GET /api/encryption/stats
 */
const getEncryptionStats = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);

  const result = await getDataEncryptionService().getStats(userId);

  if (result.success) {
    res.json({
      success: true,
      data: result.stats
    });
  } else {
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: result.error
    });
  }
}));

module.exports = {
  initializeDataEncryption,
  encryptData,
  decryptData,
  decryptBatch,
  deleteEncryptedData,
  getEncryptionStats
};
