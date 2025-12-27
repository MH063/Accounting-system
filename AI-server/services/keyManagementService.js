/**
 * 密钥管理服务
 * 提供企业级密钥管理功能，包括密钥生成、存储、验证、轮换和硬件绑定
 */

const crypto = require('crypto');
const logger = require('../config/logger');

// 密钥存储表名
const KEY_STORE_TABLE = 'encryption_keys';
const HARDWARE_BINDINGS_TABLE = 'hardware_bindings';
const KEY_AUDIT_LOG_TABLE = 'key_audit_logs';

/**
 * 生成安全的随机密钥
 * @param {number} length - 密钥长度（字节）
 * @returns {string} Base64编码的密钥
 */
const generateSecureKey = (length = 32) => {
  return crypto.randomBytes(length).toString('base64');
};

/**
 * 生成密钥ID
 * @returns {string} 唯一密钥ID
 */
const generateKeyId = () => {
  return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * 计算数据指纹（用于硬件绑定）
 * @param {Object} hardwareInfo - 硬件信息
 * @returns {string} 设备指纹
 */
const computeDeviceFingerprint = (hardwareInfo) => {
  const {
    userAgent,
    platform,
    cores,
    memory,
    screenResolution,
    timezone,
    language,
    plugins,
    canvasFingerprint,
    webglFingerprint
  } = hardwareInfo;

  const fingerprintData = JSON.stringify({
    userAgent,
    platform,
    cores,
    memory,
    screenResolution,
    timezone,
    language,
    plugins: plugins?.slice(0, 5), // 只保留前5个插件
    canvasHash: canvasFingerprint?.hash,
    webglHash: webglFingerprint?.hash
  });

  return crypto.createHash('sha256').update(fingerprintData).digest('hex');
};

/**
 * 密钥管理类
 */
class KeyManagementService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * 初始化密钥管理表
   */
  async initializeTables() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 创建密钥存储表
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${KEY_STORE_TABLE} (
          id VARCHAR(64) PRIMARY KEY,
          user_id BIGINT NOT NULL,
          key_type VARCHAR(32) NOT NULL DEFAULT 'master',
          encrypted_key TEXT NOT NULL,
          key_version INTEGER NOT NULL DEFAULT 1,
          status VARCHAR(16) NOT NULL DEFAULT 'active',
          hardware_fingerprint VARCHAR(64),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_used_at TIMESTAMP,
          expires_at TIMESTAMP,
          previous_key_id VARCHAR(64),
          rotation_count INTEGER DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          CONSTRAINT unique_user_key UNIQUE (user_id, key_type, key_version)
        )
      `);

      // 创建硬件绑定表
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${HARDWARE_BINDINGS_TABLE} (
          id SERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          device_fingerprint VARCHAR(64) NOT NULL,
          device_name VARCHAR(128),
          browser_info TEXT,
          screen_info VARCHAR(32),
          timezone VARCHAR(64),
          language VARCHAR(16),
          first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          trust_score DECIMAL(3,2) DEFAULT 1.00,
          is_active BOOLEAN DEFAULT true,
          CONSTRAINT unique_device UNIQUE (user_id, device_fingerprint)
        )
      `);

      // 创建密钥审计日志表
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${KEY_AUDIT_LOG_TABLE} (
          id SERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          key_id VARCHAR(64),
          action VARCHAR(32) NOT NULL,
          ip_address INET,
          user_agent TEXT,
          device_fingerprint VARCHAR(64),
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建索引
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_key_store_user 
        ON ${KEY_STORE_TABLE}(user_id, key_type)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_hardware_bindings_user 
        ON ${HARDWARE_BINDINGS_TABLE}(user_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_key_audit_user 
        ON ${KEY_AUDIT_LOG_TABLE}(user_id, created_at)
      `);

      await client.query('COMMIT');
      logger.info('[KeyManagement] 密钥管理表初始化完成');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[KeyManagement] 初始化表失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 为用户生成主密钥
   * @param {number} userId - 用户ID
   * @param {Object} hardwareInfo - 硬件信息
   * @returns {Object} 密钥信息
   */
  async generateMasterKey(userId, hardwareInfo = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const keyId = generateKeyId();
      const deviceFingerprint = hardwareInfo ? computeDeviceFingerprint(hardwareInfo) : null;

      // 生成加密的密钥
      const masterKey = generateSecureKey(64);
      
      // 使用主密码派生密钥（实际应用中主密码来自用户）
      const encryptionKey = crypto.pbkdf2Sync(
        masterKey,
        userId.toString(),
        100000,
        64,
        'sha512'
      );

      const encryptedKey = encryptionKey.toString('base64');

      // 存储密钥
      await client.query(`
        INSERT INTO ${KEY_STORE_TABLE}
        (id, user_id, key_type, encrypted_key, hardware_fingerprint, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [keyId, userId, 'master', encryptedKey, deviceFingerprint, JSON.stringify({
        algorithm: 'PBKDF2-SHA512',
        iterations: 100000,
        keyLength: 64,
        createdBy: 'system'
      })]);

      // 记录审计日志
      await client.query(`
        INSERT INTO ${KEY_AUDIT_LOG_TABLE}
        (user_id, key_id, action, device_fingerprint, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, keyId, 'key_generated', deviceFingerprint, 
          hardwareInfo.ipAddress, hardwareInfo.userAgent]);

      await client.query('COMMIT');

      logger.info(`[KeyManagement] 为用户 ${userId} 生成主密钥: ${keyId}`);

      // 返回加密后的密钥给前端（前端使用此密钥作为主密钥）
      return {
        keyId,
        encryptedKey: masterKey, // 返回原始密钥（前端会再次加密存储）
        keyVersion: 1,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[KeyManagement] 生成主密钥失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 验证用户密钥
   * @param {number} userId - 用户ID
   * @param {string} keyProof - 密钥证明
   * @param {Object} hardwareInfo - 硬件信息
   * @returns {Object} 验证结果
   */
  async verifyKey(userId, keyProof, hardwareInfo = {}) {
    try {
      const client = await this.pool.connect();
      
      try {
        // 获取用户当前活跃的主密钥
        const result = await client.query(`
          SELECT id, encrypted_key, key_version, hardware_fingerprint, rotation_count
          FROM ${KEY_STORE_TABLE}
          WHERE user_id = $1 AND key_type = 'master' AND status = 'active'
          ORDER BY key_version DESC
          LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) {
          await this.logAudit(userId, null, 'key_verification_failed', 
            computeDeviceFingerprint(hardwareInfo), hardwareInfo.ipAddress, hardwareInfo.userAgent, false, 'No active key found');
          return { success: false, error: 'No active key found' };
        }

        const keyRecord = result.rows[0];

        // 验证密钥证明
        const keyHash = crypto.createHash('sha256')
          .update(keyProof + userId.toString())
          .digest('hex');

        const storedHash = crypto.createHash('sha256')
          .update(keyRecord.encrypted_key + userId.toString())
          .digest('hex');

        const isValid = keyHash === storedHash;

        // 记录审计日志
        await this.logAudit(userId, keyRecord.id, 'key_verification', 
          computeDeviceFingerprint(hardwareInfo), hardwareInfo.ipAddress, hardwareInfo.userAgent, isValid);

        // 更新最后使用时间
        if (isValid) {
          await client.query(`
            UPDATE ${KEY_STORE_TABLE}
            SET last_used_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [keyRecord.id]);
        }

        return {
          success: isValid,
          keyVersion: keyRecord.key_version,
          keyId: keyRecord.id,
          rotationCount: keyRecord.rotation_count
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('[KeyManagement] 密钥验证失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 轮换用户密钥
   * @param {number} userId - 用户ID
   * @param {string} reason - 轮换原因
   * @returns {Object} 新密钥信息
   */
  async rotateKey(userId, reason = 'scheduled') {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 获取当前密钥
      const currentResult = await client.query(`
        SELECT id, key_version FROM ${KEY_STORE_TABLE}
        WHERE user_id = $1 AND key_type = 'master' AND status = 'active'
        ORDER BY key_version DESC
        LIMIT 1
      `, [userId]);

      if (currentResult.rows.length === 0) {
        throw new Error('No active key found to rotate');
      }

      const currentKey = currentResult.rows[0];
      const newKeyVersion = currentKey.key_version + 1;

      // 生成新密钥
      const newKeyId = generateKeyId();
      const newKey = generateSecureKey(64);

      // 加密新密钥（使用旧密钥加密）
      const encryptionKey = crypto.pbkdf2Sync(
        currentKey.id,
        userId.toString(),
        100000,
        64,
        'sha512'
      );
      const encryptedNewKey = encryptionKey.toString('base64');

      // 将旧密钥标记为轮换
      await client.query(`
        UPDATE ${KEY_STORE_TABLE}
        SET status = 'rotated', previous_key_id = $1
        WHERE id = $2
      `, [newKeyId, currentKey.id]);

      // 存储新密钥
      await client.query(`
        INSERT INTO ${KEY_STORE_TABLE}
        (id, user_id, key_type, encrypted_key, key_version, status, previous_key_id, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [newKeyId, userId, 'master', encryptedNewKey, newKeyVersion, 'active', currentKey.id, 
          JSON.stringify({ rotationReason: reason })]);

      // 记录审计日志
      await this.logAudit(userId, newKeyId, 'key_rotated', null, null, null, true, reason);

      await client.query('COMMIT');

      logger.info(`[KeyManagement] 用户 ${userId} 密钥已轮换: ${currentKey.key_version} -> ${newKeyVersion}`);

      return {
        keyId: newKeyId,
        keyVersion: newKeyVersion,
        previousKeyId: currentKey.id,
        encryptedKey: newKey
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[KeyManagement] 密钥轮换失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取用户最新的主密钥
   * 注意：此方法返回加密后的密钥，需要前端使用派生密钥解密
   * @param {number} userId - 用户ID
   * @returns {Object} 密钥信息
   */
  async getLatestMasterKey(userId) {
    try {
      const result = await this.pool.query(`
        SELECT id, encrypted_key, key_version, hardware_fingerprint
        FROM ${KEY_STORE_TABLE}
        WHERE user_id = $1 AND key_type = 'master' AND status = 'active'
        ORDER BY key_version DESC
        LIMIT 1
      `, [userId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'No active key found', key: null };
      }

      const keyRecord = result.rows[0];
      
      return {
        success: true,
        key: keyRecord.encrypted_key,
        keyId: keyRecord.id,
        keyVersion: keyRecord.key_version
      };
    } catch (error) {
      logger.error('[KeyManagement] 获取主密钥失败:', error);
      return { success: false, error: error.message, key: null };
    }
  }

  /**
   * 注册硬件绑定
   * @param {number} userId - 用户ID
   * @param {Object} hardwareInfo - 硬件信息
   * @returns {Object} 绑定结果
   */
  async registerHardwareBinding(userId, hardwareInfo) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const deviceFingerprint = computeDeviceFingerprint(hardwareInfo);

      // 检查是否已存在绑定
      const existingResult = await client.query(`
        SELECT id, trust_score, last_seen FROM ${HARDWARE_BINDINGS_TABLE}
        WHERE user_id = $1 AND device_fingerprint = $2
      `, [userId, deviceFingerprint]);

      let binding;
      if (existingResult.rows.length > 0) {
        // 更新现有绑定
        binding = existingResult.rows[0];
        await client.query(`
          UPDATE ${HARDWARE_BINDINGS_TABLE}
          SET last_seen = CURRENT_TIMESTAMP,
              trust_score = LEAST(trust_score + 0.05, 1.00),
              is_active = true
          WHERE id = $1
        `, [binding.id]);
      } else {
        // 创建新绑定
        const insertResult = await client.query(`
          INSERT INTO ${HARDWARE_BINDINGS_TABLE}
          (user_id, device_fingerprint, device_name, browser_info, screen_info, 
           timezone, language, trust_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [userId, deviceFingerprint, hardwareInfo.deviceName, hardwareInfo.userAgent,
            hardwareInfo.screenResolution, hardwareInfo.timezone, hardwareInfo.language, 0.80]);

        binding = insertResult.rows[0];
      }

      await client.query('COMMIT');

      logger.info(`[KeyManagement] 用户 ${userId} 硬件绑定已更新: ${deviceFingerprint}`);

      return {
        success: true,
        deviceFingerprint,
        trustScore: binding.trust_score,
        isNewBinding: existingResult.rows.length === 0
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[KeyManagement] 硬件绑定注册失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 验证硬件绑定
   * @param {number} userId - 用户ID
   * @param {Object} hardwareInfo - 硬件信息
   * @returns {Object} 验证结果
   */
  async verifyHardwareBinding(userId, hardwareInfo) {
    try {
      const client = await this.pool.connect();
      
      try {
        const deviceFingerprint = computeDeviceFingerprint(hardwareInfo);

        const result = await client.query(`
          SELECT id, trust_score, is_active, first_seen, last_seen
          FROM ${HARDWARE_BINDINGS_TABLE}
          WHERE user_id = $1 AND device_fingerprint = $2
        `, [userId, deviceFingerprint]);

        if (result.rows.length === 0) {
          return {
            success: false,
            reason: 'unknown_device',
            message: '此设备未注册，请先在可信设备中绑定'
          };
        }

        const binding = result.rows[0];

        if (!binding.is_active) {
          return {
            success: false,
            reason: 'device_disabled',
            message: '此设备已被禁用，请联系管理员'
          };
        }

        // 检查设备信任度
        if (binding.trust_score < 0.5) {
          return {
            success: false,
            reason: 'low_trust',
            message: '设备信任度较低，请提高设备信任度或使用已验证的设备登录'
          };
        }

        // 更新最后使用时间
        await client.query(`
          UPDATE ${HARDWARE_BINDINGS_TABLE}
          SET last_seen = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [binding.id]);

        return {
          success: true,
          deviceFingerprint,
          trustScore: binding.trust_score,
          deviceAge: new Date() - new Date(binding.first_seen)
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('[KeyManagement] 硬件绑定验证失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取用户的可信设备列表
   * @param {number} userId - 用户ID
   * @returns {Array} 可信设备列表
   */
  async getTrustedDevices(userId) {
    try {
      const result = await client.query(`
        SELECT 
          id,
          device_name,
          browser_info,
          screen_info,
          timezone,
          language,
          first_seen,
          last_seen,
          trust_score,
          is_active
        FROM ${HARDWARE_BINDINGS_TABLE}
        WHERE user_id = $1 AND is_active = true
        ORDER BY last_seen DESC
      `, [userId]);

      return result.rows;
    } catch (error) {
      logger.error('[KeyManagement] 获取可信设备列表失败:', error);
      throw error;
    }
  }

  /**
   * 撤销设备绑定
   * @param {number} userId - 用户ID
   * @param {string} deviceFingerprint - 设备指纹
   * @returns {Object} 撤销结果
   */
  async revokeDeviceBinding(userId, deviceFingerprint) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        UPDATE ${HARDWARE_BINDINGS_TABLE}
        SET is_active = false
        WHERE user_id = $1 AND device_fingerprint = $2
        RETURNING id
      `, [userId, deviceFingerprint]);

      if (result.rows.length === 0) {
        throw new Error('Device binding not found');
      }

      // 记录审计日志
      await this.logAudit(userId, null, 'device_revoked', deviceFingerprint, null, null, true);

      await client.query('COMMIT');

      logger.info(`[KeyManagement] 用户 ${userId} 设备绑定已撤销: ${deviceFingerprint}`);

      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[KeyManagement] 撤销设备绑定失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 记录审计日志
   */
  async logAudit(userId, keyId, action, deviceFingerprint, ipAddress, userAgent, success = true, errorMessage = null) {
    try {
      await this.pool.query(`
        INSERT INTO ${KEY_AUDIT_LOG_TABLE}
        (user_id, key_id, action, device_fingerprint, ip_address, user_agent, success, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, keyId, action, deviceFingerprint, ipAddress, userAgent, success, errorMessage]);
    } catch (error) {
      logger.error('[KeyManagement] 记录审计日志失败:', error);
    }
  }

  /**
   * 获取密钥审计日志
   * @param {number} userId - 用户ID
   * @param {number} limit - 返回数量限制
   * @returns {Array} 审计日志
   */
  async getAuditLogs(userId, limit = 100) {
    try {
      const result = await this.pool.query(`
        SELECT id, key_id, action, ip_address, device_fingerprint, 
               success, error_message, created_at
        FROM ${KEY_AUDIT_LOG_TABLE}
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows;
    } catch (error) {
      logger.error('[KeyManagement] 获取审计日志失败:', error);
      throw error;
    }
  }
}

module.exports = {
  KeyManagementService,
  generateSecureKey,
  generateKeyId,
  computeDeviceFingerprint
};
