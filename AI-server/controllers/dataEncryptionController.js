/**
 * 数据加密控制器
 * 提供用户数据加密/解密的API接口
 */

const { DataEncryptionService } = require('../services/dataEncryptionService');
const { responseWrapper, successResponse, errorResponse } = require('../middleware/response');
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
    return errorResponse(res, '缺少必要参数: dataType 和 data', 400);
  }

  // 获取用户的主密钥
  const { keyManagementService } = require('../services/keyManagementService');
  const masterKeyResult = await keyManagementService.getLatestMasterKey(userId);
  
  if (!masterKeyResult.success || !masterKeyResult.key) {
    return errorResponse(res, '无法获取用户主密钥，请先生成密钥', 400);
  }

  const result = await getDataEncryptionService().encryptAndSave(
    userId, dataType, dataId || 'default', data, masterKeyResult.key, metadata
  );

  if (result.success) {
    return successResponse(res, { dataHash: result.dataHash }, '数据加密保存成功');
  } else {
    return errorResponse(res, '数据加密保存失败', 500, result.error);
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
    return errorResponse(res, '缺少必要参数: dataType', 400);
  }

  // 获取用户的主密钥
  const { keyManagementService } = require('../services/keyManagementService');
  const masterKeyResult = await keyManagementService.getLatestMasterKey(userId);
  
  if (!masterKeyResult.success || !masterKeyResult.key) {
    return errorResponse(res, '无法获取用户主密钥，请先生成密钥', 400);
  }

  const result = await getDataEncryptionService().decryptAndRead(
    userId, dataType, dataId || 'default', masterKeyResult.key
  );

  if (result.success) {
    return successResponse(res, { 
      data: result.data,
      metadata: result.metadata,
      decryptedAt: result.decryptedAt
    }, '数据解密成功');
  } else {
    return errorResponse(res, '数据解密失败', 500, result.error);
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
    return errorResponse(res, '缺少必要参数: dataType', 400);
  }

  // 获取用户的主密钥
  const { keyManagementService } = require('../services/keyManagementService');
  const masterKeyResult = await keyManagementService.getLatestMasterKey(userId);
  
  if (!masterKeyResult.success || !masterKeyResult.key) {
    return errorResponse(res, '无法获取用户主密钥', 400);
  }

  const result = await getDataEncryptionService().decryptBatch(
    userId, dataType, masterKeyResult.key
  );

  if (result.success) {
    return successResponse(res, result.data, '批量解密成功');
  } else {
    return errorResponse(res, '批量解密数据失败', 500, result.error);
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
    return successResponse(res, null, result.deleted ? '数据已删除' : '数据不存在');
  } else {
    return errorResponse(res, '删除数据失败', 500, result.error);
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
    return successResponse(res, result.stats, '获取统计信息成功');
  } else {
    return errorResponse(res, '获取统计信息失败', 500, result.error);
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
