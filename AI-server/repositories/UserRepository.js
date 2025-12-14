/**
 * 用户数据访问层（Repository）
 * 处理用户相关的数据库操作
 */

const BaseRepository = require('./BaseRepository');
const UserModel = require('../models/UserModel');
const logger = require('../config/logger');

class UserRepository extends BaseRepository {
  constructor() {
    super('users', UserModel);
    
    // 定义可搜索字段
    this.searchableFields = ['username', 'email'];
  }

  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @returns {Promise<UserModel|null>} 用户模型实例
   */
  async findByUsername(username) {
    try {
      const result = await this.findOne({ username });
      return result;
    } catch (error) {
      logger.error('[UserRepository] 根据用户名查询失败', { error: error.message, username });
      throw error;
    }
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 邮箱地址
   * @returns {Promise<UserModel|null>} 用户模型实例
   */
  async findByEmail(email) {
    try {
      const result = await this.findOne({ email });
      return result;
    } catch (error) {
      logger.error('[UserRepository] 根据邮箱查询失败', { error: error.message, email });
      throw error;
    }
  }

  /**
   * 检查用户名是否已存在
   * @param {string} username - 用户名
   * @param {number} excludeId - 要排除的用户ID（更新时用到）
   * @returns {Promise<boolean>} 是否已存在
   */
  async isUsernameExists(username, excludeId = null) {
    try {
      let queryText = 'SELECT COUNT(*) as count FROM users WHERE username = $1';
      let params = [username];

      if (excludeId) {
        queryText += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await this.executeQuery(queryText, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error('[UserRepository] 检查用户名存在性失败', { error: error.message, username });
      throw error;
    }
  }

  /**
   * 检查邮箱是否已存在
   * @param {string} email - 邮箱地址
   * @param {number} excludeId - 要排除的用户ID（更新时用到）
   * @returns {Promise<boolean>} 是否已存在
   */
  async isEmailExists(email, excludeId = null) {
    try {
      let queryText = 'SELECT COUNT(*) as count FROM users WHERE email = $1';
      let params = [email];

      if (excludeId) {
        queryText += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await this.executeQuery(queryText, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error('[UserRepository] 检查邮箱存在性失败', { error: error.message, email });
      throw error;
    }
  }

  /**
   * 检查用户名或邮箱是否已存在
   * @param {string} username - 用户名
   * @param {string} email - 邮箱地址
   * @param {number} excludeId - 要排除的用户ID
   * @returns {Promise<Object>} 检查结果
   */
  async checkUserExists(username, email, excludeId = null) {
    try {
      let queryText = 'SELECT id, username, email FROM users WHERE username = $1 OR email = $2';
      let params = [username, email];

      if (excludeId) {
        queryText += ' AND id != $3';
        params.push(excludeId);
      }

      const result = await this.executeQuery(queryText, params);
      
      const exists = result.rows.length > 0;
      const existingUser = result.rows[0];
      
      let conflictField = null;
      if (exists) {
        if (existingUser.username === username) {
          conflictField = 'username';
        } else if (existingUser.email === email) {
          conflictField = 'email';
        }
      }

      return {
        exists,
        conflictField,
        existingUser: existingUser ? UserModel.fromDatabase(existingUser) : null
      };
    } catch (error) {
      logger.error('[UserRepository] 检查用户存在性失败', { 
        error: error.message, 
        username, 
        email 
      });
      throw error;
    }
  }

  /**
   * 更新用户密码
   * @param {number} userId - 用户ID
   * @param {string} newPasswordHash - 新密码哈希
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updatePassword(userId, newPasswordHash) {
    try {
      const result = await this.update(userId, {
        password_hash: newPasswordHash
      });

      if (result) {
        logger.info('[UserRepository] 用户密码更新成功', { userId });
      } else {
        logger.warn('[UserRepository] 用户密码更新失败: 用户不存在', { userId });
      }

      return !!result;
    } catch (error) {
      logger.error('[UserRepository] 更新用户密码失败', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 更新用户最后登录时间和IP地址
   * @param {number} userId - 用户ID
   * @param {string} ip - IP地址
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateLastLogin(userId, ip = null) {
    try {
      const queryText = 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, last_login_ip = $2 WHERE id = $1';
      const result = await this.executeQuery(queryText, [userId, ip]);
      
      const success = result.rowCount > 0;
      
      if (success) {
        logger.info('[UserRepository] 用户最后登录时间和IP更新成功', { userId, ip });
      }

      return success;
    } catch (error) {
      logger.error('[UserRepository] 更新用户最后登录时间和IP失败', { error: error.message, userId, ip });
      throw error;
    }
  }

  /**
   * 增加登录失败次数
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否更新成功
   */
  async incrementLoginAttempts(userId) {
    try {
      const queryText = `
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE 
              WHEN failed_login_attempts + 1 >= 5 THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes'
              ELSE locked_until
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING failed_login_attempts, locked_until
      `;
      
      const result = await this.executeQuery(queryText, [userId]);
      
      if (result.rows.length > 0) {
        const { failed_login_attempts, locked_until } = result.rows[0];
        logger.info('[UserRepository] 用户登录失败次数更新', { 
          userId, 
          loginAttempts: failed_login_attempts,
          lockedUntil: locked_until 
        });
        return {
          success: true,
          loginAttempts: parseInt(failed_login_attempts),
          lockedUntil: locked_until
        };
      }

      return { success: false };
    } catch (error) {
      logger.error('[UserRepository] 增加登录失败次数失败', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 重置登录失败次数
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否更新成功
   */
  async resetLoginAttempts(userId) {
    try {
      const queryText = `
        UPDATE users 
        SET failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      
      const result = await this.executeQuery(queryText, [userId]);
      
      const success = result.rowCount > 0;
      
      if (success) {
        logger.info('[UserRepository] 用户登录失败次数重置成功', { userId });
      }

      return success;
    } catch (error) {
      logger.error('[UserRepository] 重置登录失败次数失败', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 检查用户是否被锁定
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 锁定状态
   */
  async checkUserLocked(userId) {
    try {
      const queryText = `
        SELECT failed_login_attempts, locked_until, status
        FROM users 
        WHERE id = $1
      `;
      
      const result = await this.executeQuery(queryText, [userId]);
      
      if (result.rows.length === 0) {
        return { locked: false, reason: '用户不存在' };
      }

      const user = result.rows[0];
      const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
      
      return {
        locked: isLocked,
        lockedUntil: user.locked_until,
        loginAttempts: parseInt(user.failed_login_attempts) || 0,
        isActive: user.status === 'active',
        reason: isLocked ? '登录失败次数过多' : (user.status === 'active' ? null : '用户未激活')
      };
    } catch (error) {
      logger.error('[UserRepository] 检查用户锁定状态失败', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 手动锁定用户
   * @param {number} userId - 用户ID
   * @param {string} reason - 锁定原因
   * @param {number} durationMinutes - 锁定时长（分钟）
   * @returns {Promise<boolean>} 是否更新成功
   */
  async lockUser(userId, reason = 'Manual lock', durationMinutes = 1440) {
    try {
      const queryText = `
        UPDATE users 
        SET locked_until = CURRENT_TIMESTAMP + INTERVAL '${durationMinutes} minutes',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING locked_until
      `;
      
      const result = await this.executeQuery(queryText, [userId]);
      
      if (result.rows.length > 0) {
        logger.warn('[UserRepository] 用户被锁定', { 
          userId, 
          reason, 
          durationMinutes,
          lockedUntil: result.rows[0].locked_until 
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('[UserRepository] 锁定用户失败', { error: error.message, userId, reason });
      throw error;
    }
  }

  /**
   * 手动解锁用户
   * @param {number} userId - 用户ID
   * @param {string} reason - 解锁原因
   * @returns {Promise<boolean>} 是否更新成功
   */
  async unlockUser(userId, reason = 'Manual unlock') {
    try {
      const queryText = `
        UPDATE users 
        SET failed_login_attempts = 0,
            locked_until = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      
      const result = await this.executeQuery(queryText, [userId]);
      
      const success = result.rowCount > 0;
      
      if (success) {
        logger.info('[UserRepository] 用户被解锁', { userId, reason });
      }

      return success;
    } catch (error) {
      logger.error('[UserRepository] 解锁用户失败', { error: error.message, userId, reason });
      throw error;
    }
  }

  /**
   * 获取活跃用户列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 用户列表和分页信息
   */
  async getActiveUsers(options = {}) {
    try {
      const { page = 1, limit = 10, sort = 'last_login', order = 'DESC' } = options;
      
      const offset = (page - 1) * limit;
      
      // 获取总数
      const countQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
      const countResult = await this.executeQuery(countQuery);
      const total = parseInt(countResult.rows[0].total);

      // 获取活跃用户列表
      const queryText = `
        SELECT * FROM users 
        WHERE is_active = true 
        ORDER BY ${sort} ${order}
        LIMIT $1 OFFSET $2
      `;
      
      const result = await this.executeQuery(queryText, [limit, offset]);
      
      const users = result.rows.map(row => UserModel.fromDatabase(row));

      return {
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('[UserRepository] 获取活跃用户列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 执行原始查询（内部方法）
   * @param {string} queryText - SQL查询语句
   * @param {Array} params - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async executeQuery(queryText, params = []) {
    try {
      const { query } = require('../config/database');
      return await query(queryText, params);
    } catch (error) {
      logger.error('[UserRepository] 数据库查询失败', { 
        error: error.message, 
        query: queryText,
        params 
      });
      throw error;
    }
  }

  /**
   * 批量创建用户（用于数据导入）
   * @param {Array} usersData - 用户数据数组
   * @returns {Promise<Object>} 创建结果
   */
  async batchCreate(usersData) {
    try {
      const client = await this.getClient();
      
      try {
        await client.query('BEGIN');
        
        const createdUsers = [];
        const errors = [];
        
        for (let i = 0; i < usersData.length; i++) {
          const userData = usersData[i];
          
          try {
            // 验证数据
            const user = UserModel.create(userData);
            const validation = user.validate();
            
            if (!validation.isValid) {
              errors.push({
                index: i,
                username: userData.username,
                errors: validation.errors
              });
              continue;
            }
            
            // 检查是否已存在
            const exists = await this.checkUserExists(user.username, user.email);
            if (exists.exists) {
              errors.push({
                index: i,
                username: userData.username,
                errors: ['用户名或邮箱已存在']
              });
              continue;
            }
            
            // 创建用户
            const createdUser = await this.create(user.toDatabaseFormat());
            createdUsers.push(createdUser);
            
          } catch (error) {
            errors.push({
              index: i,
              username: userData.username,
              errors: [error.message]
            });
          }
        }
        
        await client.query('COMMIT');
        
        logger.info('[UserRepository] 批量创建用户完成', {
          total: usersData.length,
          success: createdUsers.length,
          errors: errors.length
        });
        
        return {
          success: createdUsers.length,
          errors: errors.length,
          createdUsers,
          errors
        };
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('[UserRepository] 批量创建用户失败', { error: error.message });
      throw error;
    }
  }
}

module.exports = UserRepository;