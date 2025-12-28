/**
 * 密钥管理控制器
 * 提供密钥生成、验证、轮换和硬件绑定的API接口
 */

const { KeyManagementService, computeDeviceFingerprint } = require('../services/keyManagementService');
const { responseWrapper, successResponse, errorResponse } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');
const { pool } = require('../config/database');

let keyManagementService = null;

/**
 * 初始化密钥管理服务
 */
const initializeKeyManagement = () => {
  if (!keyManagementService) {
    keyManagementService = new KeyManagementService(pool);
  }
  return keyManagementService.initializeTables();
};

/**
 * 获取密钥管理服务实例
 */
const getKeyManagementService = () => {
  if (!keyManagementService) {
    keyManagementService = new KeyManagementService(pool);
  }
  return keyManagementService;
};

/**
 * 生成主密钥
 * POST /api/keys/generate
 */
const generateMasterKey = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const { hardwareInfo } = req.body;

  // 从请求中提取硬件信息（如果未提供则从请求头推断）
  const enrichedHardwareInfo = {
    ...hardwareInfo,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  const result = await getKeyManagementService().generateMasterKey(userId, enrichedHardwareInfo);

  // 注册硬件绑定
  if (hardwareInfo) {
    await getKeyManagementService().registerHardwareBinding(userId, enrichedHardwareInfo);
  }

  return successResponse(res, result, '主密钥生成成功');
}));

/**
 * 验证密钥
 * POST /api/keys/verify
 */
const verifyKey = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const { keyProof, hardwareInfo } = req.body;

  const result = await getKeyManagementService().verifyKey(userId, keyProof, {
    ...hardwareInfo,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  if (result.success) {
    return successResponse(res, result, '密钥验证成功');
  } else {
    return errorResponse(res, '密钥验证失败', 401, result.error);
  }
}));

/**
 * 轮换密钥
 * POST /api/keys/rotate
 */
const rotateKey = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const { reason } = req.body;

  const result = await getKeyManagementService().rotateKey(userId, reason || 'manual');

  if (result.success) {
    return successResponse(res, result, '密钥轮换成功');
  } else {
    return errorResponse(res, '密钥轮换失败', 500, result.error);
  }
}));

/**
 * 获取密钥状态
 * GET /api/keys/status
 */
const getKeyStatus = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);

  // 获取当前密钥信息
  const result = await pool.query(`
    SELECT id, key_version, status, created_at, last_used_at, rotation_count
    FROM encryption_keys
    WHERE user_id = $1 AND key_type = 'master' AND status IN ('active', 'rotated')
    ORDER BY key_version DESC
    LIMIT 2
  `, [userId]);

  const activeKey = result.rows.find(r => r.status === 'active');
  const previousKey = result.rows.find(r => r.status === 'rotated');

  return successResponse(res, {
    hasActiveKey: !!activeKey,
    currentKey: activeKey ? {
      id: activeKey.id,
      version: activeKey.key_version,
      createdAt: activeKey.created_at,
      lastUsedAt: activeKey.last_used_at,
      rotationCount: activeKey.rotation_count
    } : null,
    previousKey: previousKey ? {
      id: previousKey.id,
      version: previousKey.key_version
    } : null
  }, '获取密钥状态成功');
}));

/**
 * 注册硬件绑定
 * POST /api/keys/hardware/register
 */
const registerHardware = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const { hardwareInfo } = req.body;

  const result = await getKeyManagementService().registerHardwareBinding(userId, {
    ...hardwareInfo,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  return successResponse(res, result, result.isNewBinding ? '设备注册成功' : '设备已更新');
}));

/**
 * 验证硬件绑定
 * POST /api/keys/hardware/verify
 */
const verifyHardware = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const { hardwareInfo } = req.body;

  const result = await getKeyManagementService().verifyHardwareBinding(userId, hardwareInfo);

  if (result.success) {
    return successResponse(res, result, '设备验证成功');
  } else {
    return errorResponse(res, result.message, 401, result.reason);
  }
}));

/**
 * 获取可信设备列表
 * GET /api/keys/hardware/devices
 */
const getTrustedDevices = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);

  const devices = await getKeyManagementService().getTrustedDevices(userId);

  return successResponse(res, devices.map(d => ({
    id: d.id,
    deviceName: d.device_name,
    browserInfo: d.browser_info,
    screenInfo: d.screen_info,
    timezone: d.timezone,
    firstSeen: d.first_seen,
    lastSeen: d.last_seen,
    trustScore: d.trust_score,
    isActive: d.is_active
  })), '获取可信设备列表成功');
}));

/**
 * 撤销设备绑定
 * DELETE /api/keys/hardware/devices/:fingerprint
 */
const revokeDevice = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const { fingerprint } = req.params;

  await getKeyManagementService().revokeDeviceBinding(userId, fingerprint);

  return successResponse(res, null, '设备已从可信列表中移除');
}));

/**
 * 获取主密钥详情 (敏感操作)
 * GET /api/keys/master/detail
 */
const getMasterKeyDetail = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);

  const result = await getKeyManagementService().getLatestMasterKey(userId);

  if (result.success) {
    return successResponse(res, {
      keyId: result.keyId,
      version: result.version,
      createdAt: result.createdAt,
      // 不返回实际密钥内容，仅返回元数据
      keyType: 'AES-256-GCM'
    }, '获取主密钥详情成功');
  } else {
    return errorResponse(res, '未找到主密钥', 404);
  }
}));

/**
 * 获取密钥审计日志
 * GET /api/keys/audit
 */
const getAuditLogs = responseWrapper(asyncHandler(async (req, res, next) => {
  const userId = BigInt(req.user.id);
  const limit = parseInt(req.query.limit) || 100;

  const logs = await getKeyManagementService().getAuditLogs(userId, limit);

  return successResponse(res, logs, '获取审计日志成功');
}));

module.exports = {
  initializeKeyManagement,
  generateMasterKey,
  verifyKey,
  rotateKey,
  getKeyStatus,
  registerHardware,
  verifyHardware,
  getTrustedDevices,
  revokeDevice,
  getMasterKeyDetail,
  getAuditLogs
};
