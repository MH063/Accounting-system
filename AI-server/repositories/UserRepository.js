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
  async usernameExists(username, excludeId = null) {
    try {
      const conditions = { username };
      if (excludeId) {
        conditions.id = { $ne: excludeId };
      }
      const user = await this.findOne(conditions);
      return !!user;
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
  async emailExists(email, excludeId = null) {
    try {
      const conditions = { email };
      if (excludeId) {
        conditions.id = { $ne: excludeId };
      }
      const user = await this.findOne(conditions);
      return !!user;
    } catch (error) {
      logger.error('[UserRepository] 检查邮箱存在性失败', { error: error.message, email });
      throw error;
    }
  }

  /**
   * 检查用户是否存在（通过用户名或邮箱）
   * @param {string} username - 用户名
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object>} 检查结果
   */
  async checkUserExists(username, email) {
    try {
      const { query } = require('../config/database');
      const result = await query(`
        SELECT 
          id,
          username,
          email,
          status,
          CASE 
            WHEN username = $1 THEN 'username'
            WHEN email = $2 THEN 'email'
            ELSE 'none'
          END as match_type
        FROM users 
        WHERE username = $1 OR email = $2
        LIMIT 1
      `, [username, email]);

      if (result.rows.length === 0) {
        return { exists: false };
      }

      const user = result.rows[0];
      return {
        exists: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          status: user.status
        },
        matchType: user.match_type
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
      const { query } = require('../config/database');
      const result = await query(`
        UPDATE users 
        SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newPasswordHash, userId]);

      if (result.rowCount === 0) {
        logger.warn('[UserRepository] 用户密码更新失败: 用户不存在', { userId });
        return false;
      }

      logger.info('[UserRepository] 用户密码更新成功', { userId });
      return true;
    } catch (error) {
      logger.error('[UserRepository] 更新用户密码失败', { error: error.message, userId });
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
      const { query } = require('../config/database');
      const result = await query(`
        SELECT 
          failed_login_attempts,
          locked_until,
          status
        FROM users 
        WHERE id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return { locked: false, reason: '用户不存在' };
      }

      const user = result.rows[0];
      const isLocked = user.locked_until && new Date(user.locked_until) > new Date();

      return {
        locked: isLocked,
        reason: isLocked ? '登录失败次数过多' : (user.status === 'active' ? null : '用户未激活'),
        lockedUntil: user.locked_until,
        failedAttempts: user.failed_login_attempts
      };
    } catch (error) {
      logger.error('[UserRepository] 检查用户锁定状态失败', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 锁定用户账户
   * @param {number} userId - 用户ID
   * @param {number} duration - 锁定时长（分钟）
   * @param {string} reason - 锁定原因
   * @returns {Promise<boolean>} 是否锁定成功
   */
  async lockUser(userId, duration = 30, reason = '登录失败次数过多') {
    try {
      const { query } = require('../config/database');
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + duration);

      const result = await query(`
        UPDATE users 
        SET locked_until = $1
        WHERE id = $2
      `, [lockedUntil, userId]);

      if (result.rowCount > 0) {
        logger.warn('[UserRepository] 用户被锁定', { 
          userId, 
          lockedUntil, 
          reason 
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('[UserRepository] 锁定用户失败', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 解锁用户账户
   * @param {number} userId - 用户ID
   * @param {string} reason - 解锁原因
   * @returns {Promise<boolean>} 是否解锁成功
   */
  async unlockUser(userId, reason = '管理员解锁') {
    try {
      const { query } = require('../config/database');
      const result = await query(`
        UPDATE users 
        SET failed_login_attempts = 0, locked_until = NULL
        WHERE id = $1
      `, [userId]);

      if (result.rowCount > 0) {
        logger.info('[UserRepository] 用户被解锁', { userId, reason });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('[UserRepository] 解锁用户失败', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 重置登录失败次数
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否重置成功
   */
  async resetLoginAttempts(userId) {
    try {
      const { query } = require('../config/database');
      const result = await query(`
        UPDATE users 
        SET failed_login_attempts = 0, locked_until = NULL
        WHERE id = $1
      `, [userId]);

      if (result.rowCount > 0) {
        logger.info('[UserRepository] 用户登录失败次数重置成功', { userId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('[UserRepository] 重置登录失败次数失败', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 增加登录失败次数
   * @param {number} userId - 用户ID
   * @param {number} maxAttempts - 最大失败次数
   * @returns {Promise<Object>} 操作结果
   */
  async increaseFailedAttempts(userId, maxAttempts = 5) {
    try {
      const { query } = require('../config/database');
      const result = await query(`
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1
        WHERE id = $1
        RETURNING failed_login_attempts
      `, [userId]);

      if (result.rows.length === 0) {
        return { success: false, attempts: 0 };
      }

      const attempts = result.rows[0].failed_login_attempts;
      
      // 如果达到最大失败次数，锁定账户
      if (attempts >= maxAttempts) {
        await this.lockUser(userId, 30, '登录失败次数过多');
        return { 
          success: true, 
          attempts, 
          locked: true,
          message: `登录失败次数过多，账户已被锁定30分钟`
        };
      }

      return { 
        success: true, 
        attempts, 
        locked: false,
        message: `登录失败，还剩 ${maxAttempts - attempts} 次机会`
      };
    } catch (error) {
      logger.error('[UserRepository] 增加登录失败次数失败', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 更新最后登录时间和IP
   * @param {number} userId - 用户ID
   * @param {string} ip - IP地址
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateLastLogin(userId, ip = null) {
    try {
      const { query } = require('../config/database');
      const result = await query(`
        UPDATE users 
        SET last_login_at = CURRENT_TIMESTAMP, last_login_ip = $1
        WHERE id = $2
      `, [ip, userId]);

      if (result.rowCount > 0) {
        logger.info('[UserRepository] 用户最后登录时间和IP更新成功', { userId, ip });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('[UserRepository] 更新最后登录信息失败', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 获取用户的角色信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 角色信息
   */
  async getUserRoles(userId) {
    try {
      const { query } = require('../config/database');
      const result = await query(`
        SELECT 
          r.role_name,
          r.role_display_name,
          r.permissions,
          r.is_system_role,
          ur.assigned_at,
          ur.expires_at,
          ur.is_active
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1 AND ur.is_active = true
        ORDER BY ur.assigned_at DESC
        LIMIT 1
      `, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const roleData = result.rows[0];
      return {
        role: roleData.role_name,
        displayName: roleData.role_display_name,
        permissions: roleData.permissions || [],
        isSystemRole: roleData.is_system_role,
        assignedAt: roleData.assigned_at,
        expiresAt: roleData.expires_at
      };
    } catch (error) {
      logger.error('[UserRepository] 获取用户角色失败', { 
        error: error.message, 
        userId 
      });
      throw error;
    }
  }

  /**
   * 根据ID查找用户（包含角色）
   * @param {number} userId - 用户ID
   * @returns {Promise<UserModel|null>} 用户模型实例
   */
  async findByIdWithRoles(userId) {
    try {
      const { query } = require('../config/database');
      const result = await query(`
        SELECT 
          u.*,
          r.role_name,
          r.role_display_name,
          r.permissions,
          r.is_system_role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1
        ORDER BY ur.assigned_at DESC
        LIMIT 1
      `, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const userData = result.rows[0];
      return UserModel.fromDatabase(userData);
    } catch (error) {
      logger.error('[UserRepository] 根据ID查找用户（包含角色）失败', { 
        error: error.message, 
        userId 
      });
      throw error;
    }
  }

  /**
   * 查找用户（包含角色），支持用户名、邮箱
   * @param {string} identifier - 用户名或邮箱
   * @returns {Promise<UserModel|null>} 用户模型实例
   */
  async findUserWithRoles(identifier) {
    try {
      const { query } = require('../config/database');
      const result = await query(`
        SELECT 
          u.*,
          r.role_name,
          r.role_display_name,
          r.permissions,
          r.is_system_role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE (u.username = $1 OR u.email = $1)
        ORDER BY ur.assigned_at DESC
        LIMIT 1
      `, [identifier]);

      if (result.rows.length === 0) {
        return null;
      }

      const userData = result.rows[0];
      return UserModel.fromDatabase(userData);
    } catch (error) {
      logger.error('[UserRepository] 查找用户（包含角色）失败', { 
        error: error.message, 
        identifier 
      });
      throw error;
    }
  }

  /**
   * 获取用户列表（分页）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 用户列表和分页信息
   */
  async getUserList(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      const filters = {};
      if (status) {
        filters.status = status;
      }

      const result = await this.findAll({
        page,
        limit,
        search,
        filters,
        sort: sortBy,
        order: sortOrder
      });

      return {
        users: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      logger.error('[UserRepository] 数据库查询失败', { 
        error: error.message, 
        options 
      });
      throw error;
    }
  }

  /**
   * 创建用户
   * @param {UserModel} user - 用户模型
   * @returns {Promise<UserModel>} 创建的用户
   */
  async createUser(user) {
    try {
      const result = await this.create(user.toDatabaseFormat());
      return result;
    } catch (error) {
      // 检查是否是唯一约束冲突
      if (error.code === '23505') {
        const field = error.detail.includes('username') ? 'username' : 'email';
        throw new Error(`用户${field === 'username' ? '名' : '邮箱'}已存在`);
      }
      
      logger.error('[UserRepository] 创建用户失败', { 
        error: error.message, 
        user: user.id 
      });
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateUser(userId, updates) {
    try {
      const result = await this.update(userId, updates);
      return result.rowCount > 0;
    } catch (error) {
      // 检查是否是唯一约束冲突
      if (error.code === '23505') {
        const field = error.detail.includes('username') ? 'username' : 'email';
        throw new Error(`用户${field === 'username' ? '名' : '邮箱'}已存在`);
      }
      
      logger.error('[UserRepository] 更新用户失败', { 
        error: error.message, 
        userId 
      });
      throw error;
    }
  }

  /**
   * 验证用户数据
   * @param {Object} userData - 用户数据
   * @param {boolean} isUpdate - 是否为更新操作
   * @returns {Object} 验证结果
   */
  validateUserData(userData, isUpdate = false) {
    const errors = [];

    // 用户名验证
    if (!isUpdate || userData.username !== undefined) {
      if (!userData.username || userData.username.trim().length < 3) {
        errors.push('用户名长度至少为3个字符');
      } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
        errors.push('用户名只能包含字母、数字和下划线');
      }
    }

    // 邮箱验证
    if (!isUpdate || userData.email !== undefined) {
      if (!userData.email) {
        errors.push('邮箱不能为空');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        errors.push('邮箱格式不正确');
      }
    }

    // 密码验证（仅在创建时）
    if (!isUpdate && !userData.password) {
      errors.push('密码不能为空');
    } else if (userData.password && userData.password.length < 6) {
      errors.push('密码长度至少为6个字符');
    }

    // 状态验证
    if (userData.status && !['active', 'inactive', 'pending', 'banned'].includes(userData.status)) {
      errors.push('无效的用户状态');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 检查用户名和邮箱的唯一性
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @param {number} excludeId - 排除的用户ID（更新时使用）
   * @returns {Promise<Object>} 检查结果
   */
  async checkUniqueness(username, email, excludeId = null) {
    try {
      const { query } = require('../config/database');
      const result = await query(`
        SELECT 
          id,
          username,
          email
        FROM users 
        WHERE (username = $1 OR email = $2) 
        ${excludeId ? `AND id != $3` : ''}
      `, excludeId ? [username, email, excludeId] : [username, email]);

      const conflicts = result.rows.reduce((acc, row) => {
        if (row.username === username) acc.push('username');
        if (row.email === email) acc.push('email');
        return acc;
      }, []);

      return {
        isUnique: conflicts.length === 0,
        conflicts,
        errors: conflicts.map(field => 
          field === 'username' ? '用户名已存在' : '邮箱已存在'
        )
      };
    } catch (error) {
      logger.error('[UserRepository] 检查唯一性失败', { 
        error: error.message, 
        username, 
        email 
      });
      throw error;
    }
  }
}

module.exports = UserRepository;