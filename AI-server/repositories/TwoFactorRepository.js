/**
 * 两步验证数据访问层
 * 处理两步验证相关的数据库操作
 */

const BaseRepository = require('./BaseRepository');
const { query } = require('../config/database');
const logger = require('../config/logger');

class TwoFactorRepository extends BaseRepository {
  constructor() {
    super('two_factor_codes');
  }

  /**
   * 创建两步验证配置
   * @param {Object} authData - 两步验证配置数据
   * @returns {Promise<Object>} 创建结果
   */
  async createTwoFactorAuth(authData) {
    try {
      const queryText = `
        INSERT INTO two_factor_auth (
          user_id, secret_key, backup_codes, is_enabled
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, secret_key, backup_codes, is_enabled,
                  last_used_at, created_at, updated_at
      `;
      
      const values = [
        authData.userId,
        authData.secretKey,
        JSON.stringify(authData.backupCodes || []),
        authData.isEnabled || false
      ];
      
      const result = await query(queryText, values);
      
      if (result.rows.length > 0) {
        logger.info('[TwoFactorRepository] 两步验证配置创建成功', { 
          userId: authData.userId,
          authId: result.rows[0].id
        });
        return result.rows[0];
      }
      
      throw new Error('创建两步验证配置失败');
    } catch (error) {
      logger.error('[TwoFactorRepository] 创建两步验证配置失败', { 
        error: error.message,
        userId: authData.userId
      });
      throw error;
    }
  }

  /**
   * 获取用户两步验证配置
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 两步验证配置
   */
  async getTwoFactorAuthByUserId(userId) {
    try {
      const queryText = `
        SELECT id, user_id, secret_key, backup_codes, is_enabled,
               last_used_at, created_at, updated_at
        FROM two_factor_auth 
        WHERE user_id = $1
      `;
      
      const result = await query(queryText, [userId]);
      
      if (result.rows.length > 0) {
        const auth = result.rows[0];
        return {
          id: auth.id,
          userId: auth.user_id,
          secretKey: auth.secret_key,
          backupCodes: auth.backup_codes,
          isEnabled: auth.is_enabled,
          lastUsedAt: auth.last_used_at,
          createdAt: auth.created_at,
          updatedAt: auth.updated_at
        };
      }
      
      return null;
    } catch (error) {
      logger.error('[TwoFactorRepository] 获取两步验证配置失败', { 
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * 更新两步验证配置
   * @param {number} authId - 两步验证配置ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateTwoFactorAuth(authId, updateData) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (updateData.secretKey !== undefined) {
        updates.push(`secret_key = $${paramIndex++}`);
        values.push(updateData.secretKey);
      }
      
      if (updateData.backupCodes !== undefined) {
        updates.push(`backup_codes = $${paramIndex++}`);
        values.push(JSON.stringify(updateData.backupCodes));
      }
      
      if (updateData.isEnabled !== undefined) {
        updates.push(`is_enabled = $${paramIndex++}`);
        values.push(updateData.isEnabled);
      }
      
      if (updateData.lastUsedAt !== undefined) {
        updates.push(`last_used_at = $${paramIndex++}`);
        values.push(updateData.lastUsedAt);
      }
      
      if (updates.length === 0) {
        throw new Error('没有提供任何更新字段');
      }
      
      values.push(authId);
      
      const queryText = `
        UPDATE two_factor_auth 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, user_id, secret_key, backup_codes, is_enabled,
                  last_used_at, created_at, updated_at
      `;
      
      const result = await query(queryText, values);
      
      if (result.rows.length > 0) {
        logger.info('[TwoFactorRepository] 两步验证配置更新成功', { 
          authId,
          updates: Object.keys(updateData)
        });
        return result.rows[0];
      }
      
      throw new Error('两步验证配置不存在');
    } catch (error) {
      logger.error('[TwoFactorRepository] 更新两步验证配置失败', { 
        error: error.message,
        authId
      });
      throw error;
    }
  }

  /**
   * 删除两步验证配置
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteTwoFactorAuth(userId) {
    try {
      const queryText = `
        DELETE FROM two_factor_auth 
        WHERE user_id = $1
        RETURNING id
      `;
      
      const result = await query(queryText, [userId]);
      
      const success = result.rowCount > 0;
      
      if (success) {
        logger.info('[TwoFactorRepository] 两步验证配置删除成功', { userId });
      }
      
      return success;
    } catch (error) {
      logger.error('[TwoFactorRepository] 删除两步验证配置失败', { 
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * 增加验证失败次数
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async incrementVerificationAttempts(userId) {
    try {
      const queryText = `
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1
        WHERE id = $1
        RETURNING id, failed_login_attempts
      `;
      
      const result = await query(queryText, [userId]);
      
      if (result.rows.length > 0) {
        logger.warn('[TwoFactorRepository] 验证失败次数增加', { 
          userId,
          failedAttempts: result.rows[0].failed_login_attempts
        });
        return result.rows[0];
      }
      
      throw new Error('用户不存在');
    } catch (error) {
      logger.error('[TwoFactorRepository] 增加验证失败次数失败', { 
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * 重置验证失败次数
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async resetVerificationAttempts(userId) {
    try {
      const queryText = `
        UPDATE users 
        SET failed_login_attempts = 0,
            locked_until = NULL
        WHERE id = $1
        RETURNING id, failed_login_attempts
      `;
      
      const result = await query(queryText, [userId]);
      
      if (result.rows.length > 0) {
        logger.info('[TwoFactorRepository] 验证失败次数重置', { userId });
        return result.rows[0];
      }
      
      throw new Error('用户不存在');
    } catch (error) {
      logger.error('[TwoFactorRepository] 重置验证失败次数失败', { 
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * 检查用户是否被锁定
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 锁定状态
   */
  async checkUserLockStatus(userId) {
    try {
      const queryText = `
        SELECT id, failed_login_attempts, locked_until
        FROM users 
        WHERE id = $1
      `;
      
      const result = await query(queryText, [userId]);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
        
        return {
          userId: user.id,
          failedAttempts: user.failed_login_attempts,
          lockedUntil: user.locked_until,
          isLocked
        };
      }
      
      throw new Error('用户不存在');
    } catch (error) {
      logger.error('[TwoFactorRepository] 检查用户锁定状态失败', { 
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * 创建两步验证代码记录
   * @param {Object} codeData - 验证码数据
   * @returns {Promise<Object>} 创建结果
   */
  async createTwoFactorCode(codeData) {
    try {
      const queryText = `
        INSERT INTO two_factor_codes (
          user_id, code, code_type, channel, target, 
          ip_address, max_attempts, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id, code, code_type, channel, target, 
                  ip_address, attempts, max_attempts, is_used, 
                  used_at, expires_at, created_at
      `;
      
      const values = [
        codeData.userId,
        codeData.code,
        codeData.codeType,
        codeData.channel,
        codeData.target,
        codeData.ipAddress,
        codeData.maxAttempts || 3,
        codeData.expiresAt
      ];
      
      const result = await query(queryText, values);
      
      if (result.rows.length > 0) {
        logger.info('[TwoFactorRepository] 两步验证代码创建成功', { 
          userId: codeData.userId,
          codeId: result.rows[0].id
        });
        return result.rows[0];
      }
      
      throw new Error('创建两步验证代码失败');
    } catch (error) {
      logger.error('[TwoFactorRepository] 创建两步验证代码失败', { 
        error: error.message,
        userId: codeData.userId
      });
      throw error;
    }
  }

  /**
   * 验证两步验证码
   * @param {Object} verificationData - 验证数据
   * @returns {Promise<Object>} 验证结果
   */
  async verifyTwoFactorCode(verificationData) {
    try {
      // 确定验证码类型
      let verificationCodeType;
      switch (verificationData.codeType) {
        case 'login':
          verificationCodeType = 'login';
          break;
        case 'register':
          verificationCodeType = 'email_verification';
          break;
        case 'reset':
          verificationCodeType = 'password_reset';
          break;
        case 'verify':
          verificationCodeType = 'email_verification';
          break;
        case 'enable':
          verificationCodeType = 'email_verification';
          break;
        default:
          verificationCodeType = 'email_verification';
      }
      
      const queryText = `
        SELECT id, email, code, code_type as codeType, expires_at as expiresAt, used_at as usedAt
        FROM verification_codes 
        WHERE email = $1 AND code = $2 AND code_type = $3
          AND used_at IS NULL 
          AND expires_at > NOW()
      `;
      
      // 使用邮箱而不是用户ID
      const values = [
        verificationData.email || '', // 邮箱
        verificationData.code,
        verificationCodeType
      ];
      
      const result = await query(queryText, values); // 直接使用导入的query函数
      
      if (result.rows.length > 0) {
        logger.info('[TwoFactorRepository] 两步验证码验证成功', { 
          email: verificationData.email,
          codeId: result.rows[0].id
        });
        return result.rows[0];
      }
      
      logger.warn('[TwoFactorRepository] 两步验证码验证失败', { 
        email: verificationData.email
      });
      return null;
    } catch (error) {
      logger.error('[TwoFactorRepository] 验证两步验证码失败', { 
        error: error.message,
        email: verificationData.email
      });
      throw error;
    }
  }

  /**
   * 标记验证码为已使用
   * @param {number} codeId - 验证码ID
   * @returns {Promise<boolean>} 更新结果
   */
  async markCodeAsUsed(codeId) {
    try {
      const queryText = `
        UPDATE verification_codes 
        SET used_at = NOW()
        WHERE id = $1 AND used_at IS NULL
        RETURNING id
      `;
      
      const result = await query(queryText, [codeId]); // 直接使用导入的query函数
      
      const success = result.rowCount > 0;
      
      if (success) {
        logger.info('[TwoFactorRepository] 验证码标记为已使用', { codeId });
      }
      
      return success;
    } catch (error) {
      logger.error('[TwoFactorRepository] 标记验证码为已使用失败', { 
        error: error.message,
        codeId
      });
      throw error;
    }
  }

  /**
   * 增加验证尝试次数
   * @param {number} codeId - 验证码ID
   * @returns {Promise<boolean>} 更新结果
   */
  async incrementAttempts(codeId) {
    // verification_codes 表不再使用 attempts 字段，此方法保留为空实现以保持接口兼容性
    logger.warn('[TwoFactorRepository] incrementAttempts 方法已弃用，verification_codes 表不使用 attempts 字段');
    return true;
  }

  /**
   * 获取用户最近的两步验证记录
   * @param {string} email - 用户邮箱
   * @param {string} codeType - 验证码类型
   * @returns {Promise<Object>} 验证记录
   */
  async getLatestTwoFactorCode(email, codeType) {
    try {
      // 映射验证码类型
      let verificationCodeType;
      switch (codeType) {
        case 'login':
          verificationCodeType = 'login';
          break;
        case 'register':
          verificationCodeType = 'email_verification';
          break;
        case 'reset':
          verificationCodeType = 'password_reset';
          break;
        case 'verify':
          verificationCodeType = 'email_verification';
          break;
        case 'enable':
          verificationCodeType = 'email_verification';
          break;
        default:
          verificationCodeType = 'email_verification';
      }
      
      const queryText = `
        SELECT id, email, code, code_type as codeType, expires_at as expiresAt, used_at as usedAt
        FROM verification_codes 
        WHERE email = $1 AND code_type = $2
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const values = [email, verificationCodeType];
      
      const result = await query(queryText, values); // 直接使用导入的query函数
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      logger.error('[TwoFactorRepository] 获取最近两步验证记录失败', { 
        error: error.message,
        email,
        codeType
      });
      throw error;
    }
  }

  /**
   * 清理过期的两步验证码
   * @returns {Promise<number>} 清理的记录数
   */
  async cleanupExpiredCodes() {
    try {
      const queryText = `
        DELETE FROM verification_codes 
        WHERE expires_at < NOW() - INTERVAL '1 day'
      `;
      
      const result = await query(queryText, []); // 直接使用导入的query函数
      
      logger.info('[TwoFactorRepository] 清理过期两步验证码', { 
        deletedCount: result.rowCount
      });
      
      return result.rowCount;
    } catch (error) {
      logger.error('[TwoFactorRepository] 清理过期两步验证码失败', { 
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = TwoFactorRepository;