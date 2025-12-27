/**
 * 数据加密服务
 * 提供后端数据加密功能，支持用户敏感数据的加密存储和解密读取
 */

const crypto = require('crypto');
const logger = require('../config/logger');

// 加密配置
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltLength: 32
};

/**
 * 生成加密密钥
 * @param {string} masterKey - 主密钥
 * @param {string} salt - 盐值
 * @returns {Buffer} 加密密钥
 */
const deriveEncryptionKey = (masterKey, salt) => {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, ENCRYPTION_CONFIG.keyLength, 'sha512');
};

/**
 * 生成随机盐值
 * @returns {string} Base64编码的盐值
 */
const generateSalt = () => {
  return crypto.randomBytes(ENCRYPTION_CONFIG.saltLength).toString('base64');
};

/**
 * 加密数据
 * @param {Object} data - 要加密的数据
 * @param {string} masterKey - 主密钥
 * @returns {Object} 加密结果
 */
const encryptData = (data, masterKey) => {
  try {
    const salt = generateSalt();
    const key = deriveEncryptionKey(masterKey, salt);
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
    
    const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);
    
    const jsonData = JSON.stringify(data);
    const encrypted = Buffer.concat([
      cipher.update(jsonData, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    // 返回加密数据（包含盐值、IV和标签）
    const result = {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      salt: salt,
      tag: tag.toString('base64'),
      algorithm: ENCRYPTION_CONFIG.algorithm,
      timestamp: new Date().toISOString()
    };
    
    return { success: true, data: result };
  } catch (error) {
    logger.error('[EncryptionService] 数据加密失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 解密数据
 * @param {Object} encryptedData - 加密的数据对象
 * @param {string} masterKey - 主密钥
 * @returns {Object} 解密结果
 */
const decryptData = (encryptedData, masterKey) => {
  try {
    const { encrypted, iv, salt, tag, algorithm } = encryptedData;
    
    if (!encrypted || !iv || !salt || !tag) {
      throw new Error('加密数据格式不完整');
    }
    
    const key = deriveEncryptionKey(masterKey, salt);
    const ivBuffer = Buffer.from(iv, 'base64');
    const tagBuffer = Buffer.from(tag, 'base64');
    const encryptedBuffer = Buffer.from(encrypted, 'base64');
    
    const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
    decipher.setAuthTag(tagBuffer);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]);
    
    const jsonData = decrypted.toString('utf8');
    const data = JSON.parse(jsonData);
    
    return { success: true, data };
  } catch (error) {
    logger.error('[EncryptionService] 数据解密失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 计算数据哈希
 * @param {any} data - 数据
 * @returns {string} SHA256哈希
 */
const computeHash = (data) => {
  const jsonData = JSON.stringify(data);
  return crypto.createHash('sha256').update(jsonData).digest('hex');
};

/**
 * 验证数据完整性
 * @param {Object} data - 原始数据
 * @param {string} storedHash - 存储的哈希值
 * @returns {boolean} 是否完整
 */
const verifyIntegrity = (data, storedHash) => {
  const computedHash = computeHash(data);
  return computedHash === storedHash;
};

class DataEncryptionService {
  constructor(pool) {
    this.pool = pool;
    this.tableName = 'encrypted_user_data';
  }

  /**
   * 初始化加密数据表
   */
  async initializeTable() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id SERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          data_type VARCHAR(64) NOT NULL,
          data_id VARCHAR(128),
          encrypted_data TEXT NOT NULL,
          data_hash VARCHAR(64),
          master_key_version INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB DEFAULT '{}',
          CONSTRAINT unique_data_record UNIQUE (user_id, data_type, data_id)
        )
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_encrypted_data_user 
        ON ${this.tableName}(user_id, data_type)
      `);
      
      await client.query('COMMIT');
      logger.info('[DataEncryption] 加密数据表初始化完成');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[DataEncryption] 初始化加密数据表失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 加密并保存用户数据
   * @param {number} userId - 用户ID
   * @param {string} dataType - 数据类型
   * @param {string} dataId - 数据ID
   * @param {Object} data - 要加密的数据
   * @param {string} masterKey - 主密钥
   * @param {Object} metadata - 元数据
   */
  async encryptAndSave(userId, dataType, dataId, data, masterKey, metadata = {}) {
    try {
      // 加密数据
      const encryptResult = encryptData(data, masterKey);
      if (!encryptResult.success) {
        throw new Error(encryptResult.error);
      }
      
      // 计算数据哈希
      const dataHash = computeHash(data);
      
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        
        // 检查是否已存在记录
        const existing = await client.query(`
          SELECT id FROM ${this.tableName}
          WHERE user_id = $1 AND data_type = $2 AND data_id = $3
        `, [userId, dataType, dataId]);
        
        if (existing.rows.length > 0) {
          // 更新现有记录
          await client.query(`
            UPDATE ${this.tableName}
            SET encrypted_data = $1,
                data_hash = $2,
                updated_at = CURRENT_TIMESTAMP,
                metadata = $3
            WHERE id = $4
          `, [
            JSON.stringify(encryptResult.data),
            dataHash,
            JSON.stringify(metadata),
            existing.rows[0].id
          ]);
        } else {
          // 插入新记录
          await client.query(`
            INSERT INTO ${this.tableName}
            (user_id, data_type, data_id, encrypted_data, data_hash, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            userId, dataType, dataId,
            JSON.stringify(encryptResult.data),
            dataHash,
            JSON.stringify(metadata)
          ]);
        }
        
        await client.query('COMMIT');
        
        logger.info(`[DataEncryption] 用户 ${userId} 的 ${dataType} 数据已加密保存`);
        
        return { success: true, dataHash };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('[DataEncryption] 加密保存数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 解密并读取用户数据
   * @param {number} userId - 用户ID
   * @param {string} dataType - 数据类型
   * @param {string} dataId - 数据ID（可选）
   * @param {string} masterKey - 主密钥
   * @returns {Object} 解密后的数据
   */
  async decryptAndRead(userId, dataType, dataId, masterKey) {
    try {
      const client = await this.pool.connect();
      
      try {
        let query = `
          SELECT encrypted_data, data_hash, metadata, created_at, updated_at
          FROM ${this.tableName}
          WHERE user_id = $1 AND data_type = $2
        `;
        const params = [userId, dataType];
        
        if (dataId) {
          query += ' AND data_id = $3';
          params.push(dataId);
        }
        
        query += ' ORDER BY updated_at DESC LIMIT 1';
        
        const result = await client.query(query, params);
        
        if (result.rows.length === 0) {
          return { success: false, error: '未找到加密数据', data: null };
        }
        
        const record = result.rows[0];
        const encryptedData = typeof record.encrypted_data === 'string' 
          ? JSON.parse(record.encrypted_data) 
          : record.encrypted_data;
        
        // 解密数据
        const decryptResult = decryptData(encryptedData, masterKey);
        if (!decryptResult.success) {
          throw new Error(decryptResult.error);
        }
        
        // 验证数据完整性
        if (record.data_hash && !verifyIntegrity(decryptResult.data, record.data_hash)) {
          logger.warn(`[DataEncryption] 用户 ${userId} 的 ${dataType} 数据完整性验证失败`);
        }
        
        return {
          success: true,
          data: decryptResult.data,
          metadata: record.metadata,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('[DataEncryption] 解密读取数据失败:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  /**
   * 批量解密用户数据
   * @param {number} userId - 用户ID
   * @param {string} dataType - 数据类型
   * @param {string} masterKey - 主密钥
   * @returns {Array} 解密后的数据列表
   */
  async decryptBatch(userId, dataType, masterKey) {
    try {
      const client = await this.pool.connect();
      
      try {
        const result = await client.query(`
          SELECT data_id, encrypted_data, data_hash, metadata, created_at, updated_at
          FROM ${this.tableName}
          WHERE user_id = $1 AND data_type = $2
          ORDER BY updated_at DESC
        `, [userId, dataType]);
        
        const decryptedData = [];
        
        for (const record of result.rows) {
          try {
            const encryptedData = typeof record.encrypted_data === 'string'
              ? JSON.parse(record.encrypted_data)
              : record.encrypted_data;
            
            const decryptResult = decryptData(encryptedData, masterKey);
            
            if (decryptResult.success) {
              decryptedData.push({
                id: record.data_id,
                data: decryptResult.data,
                metadata: record.metadata,
                createdAt: record.created_at,
                updatedAt: record.updated_at
              });
            }
          } catch (err) {
            logger.warn(`[DataEncryption] 解密单条数据失败:`, err);
          }
        }
        
        return { success: true, data: decryptedData };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('[DataEncryption] 批量解密数据失败:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * 删除加密数据
   * @param {number} userId - 用户ID
   * @param {string} dataType - 数据类型
   * @param {string} dataId - 数据ID
   */
  async delete(userId, dataType, dataId) {
    try {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        const result = await client.query(`
          DELETE FROM ${this.tableName}
          WHERE user_id = $1 AND data_type = $2 AND data_id = $3
          RETURNING id
        `, [userId, dataType, dataId]);
        
        await client.query('COMMIT');
        
        logger.info(`[DataEncryption] 用户 ${userId} 的 ${dataType}/${dataId} 数据已删除`);
        
        return { success: true, deleted: result.rows.length > 0 };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('[DataEncryption] 删除加密数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取加密数据统计
   * @param {number} userId - 用户ID
   */
  async getStats(userId) {
    try {
      const result = await this.pool.query(`
        SELECT data_type, COUNT(*) as count
        FROM ${this.tableName}
        WHERE user_id = $1
        GROUP BY data_type
      `, [userId]);
      
      const stats = {};
      for (const row of result.rows) {
        stats[row.data_type] = parseInt(row.count);
      }
      
      return { success: true, stats };
    } catch (error) {
      logger.error('[DataEncryption] 获取加密数据统计失败:', error);
      return { success: false, error: error.message, stats: {} };
    }
  }
}

module.exports = {
  DataEncryptionService,
  encryptData,
  decryptData,
  generateSalt,
  computeHash,
  verifyIntegrity,
  deriveEncryptionKey,
  ENCRYPTION_CONFIG
};
