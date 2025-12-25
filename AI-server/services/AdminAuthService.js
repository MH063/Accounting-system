/**
 * 管理员认证服务层
 * 处理管理员登录、认证相关的业务逻辑
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { generateTokenPair } = require('../config/jwtManager');
const UserRepository = require('../repositories/UserRepository');
const UserModel = require('../models/UserModel');

class AdminAuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.failedLoginAttempts = new Map(); // 登录失败记录
    this.maxFailedAttempts = 5; // 最大失败尝试次数
    this.lockoutDuration = 15 * 60 * 1000; // 锁定时间：15分钟
  }

  /**
   * 管理员登录验证
   * @param {Object} loginData - 登录数据
   * @param {string} loginData.username - 用户名
   * @param {string} loginData.password - 密码
   * @returns {Object} 登录结果
   */
  async adminLogin({ username, password }) {
    try {
      logger.info('[AdminAuthService] 管理员登录开始', { username });

      // 1. 检查账户是否被锁定
      const lockoutInfo = this.failedLoginAttempts.get(username);
      if (lockoutInfo && lockoutInfo.lockedUntil > Date.now()) {
        const remainingTime = Math.ceil((lockoutInfo.lockedUntil - Date.now()) / 1000);
        return {
          success: false,
          message: `账户已被锁定，请在 ${remainingTime} 秒后重试`
        };
      }

      // 2. 查找用户
      let user = await this.userRepository.findByUsername(username);
      if (!user) {
        user = await this.userRepository.findByEmail(username);
      }

      if (!user) {
        return this.handleFailedLogin(username, '用户不存在');
      }

      // 3. 检查是否为管理员角色
      const isAdminByUsername = username === 'admin' || username.includes('admin');
      const isAdminByStatus = user.role === 'admin';
      const isAdminByEmail = user.email === 'admin@example.com';
      
      // 只要满足任何一个管理员条件即可
      const isAdmin = isAdminByUsername || isAdminByStatus || isAdminByEmail;
      
      if (!isAdmin) {
        return this.handleFailedLogin(username, '权限不足，仅管理员可以登录');
      }

      // 4. 检查用户是否激活
      if (!user.isActive) {
        return this.handleFailedLogin(username, '账户未激活');
      }

      // 5. 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return this.handleFailedLogin(username, '密码错误');
      }

      // 6. 生成令牌对
      const tokens = generateTokenPair(user.id, {
        username: user.username,
        email: user.email,
        status: user.isActive ? 'active' : 'inactive',
        isAdmin: true
      });

      // 7. 更新最后登录时间
      await this.userRepository.updateLastLogin(user.id);

      // 8. 清除失败登录记录
      this.failedLoginAttempts.delete(username);

      logger.info('[AdminAuthService] 管理员登录成功', { 
        userId: user.id,
        username: user.username 
      });

      return {
        success: true,
        data: {
          user: user.toApiResponse(),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: 'Bearer',
          isAdmin: true
        },
        message: '管理员登录成功'
      };

    } catch (error) {
      logger.error('[AdminAuthService] 管理员登录失败', { 
        error: error.message,
        username 
      });
      return {
        success: false,
        message: '登录失败，请稍后重试'
      };
    }
  }

  /**
   * 处理登录失败
   * @param {string} username - 用户名
   * @param {string} reason - 失败原因
   * @returns {Object} 失败结果
   */
  async handleFailedLogin(username, reason) {
    try {
      // 记录失败次数
      const attempts = (this.failedLoginAttempts.get(username)?.attempts || 0) + 1;
      let lockedUntil = null;

      // 如果达到最大失败次数，锁定账户
      if (attempts >= this.maxFailedAttempts) {
        lockedUntil = Date.now() + this.lockoutDuration;
        this.failedLoginAttempts.set(username, {
          attempts,
          lockedUntil,
          lockedAt: Date.now()
        });

        logger.warn('[AdminAuthService] 管理员账户被锁定', { 
          username,
          attempts,
          reason 
        });
      } else {
        this.failedLoginAttempts.set(username, {
          attempts,
          lastAttempt: Date.now()
        });
      }

      // 记录安全事件
      logger.security('管理员登录失败', {
        username,
        reason,
        attempts,
        locked: lockedUntil !== null,
        lockedUntil
      });

      return {
        success: false,
        message: lockedUntil 
          ? `登录失败次数过多，账户已被锁定 ${this.lockoutDuration / 60000} 分钟`
          : `登录失败，还可尝试 ${this.maxFailedAttempts - attempts} 次`,
        locked: lockedUntil !== null,
        attempts
      };

    } catch (error) {
      logger.error('[AdminAuthService] 处理登录失败时出错', { 
        error: error.message,
        username,
        reason 
      });
      return {
        success: false,
        message: '登录失败，请稍后重试'
      };
    }
  }

  /**
   * 获取管理员资料
   * @param {number} userId - 用户ID
   * @returns {Object} 管理员资料
   */
  async getAdminProfile(userId) {
    try {
      logger.info('[AdminAuthService] 获取管理员资料', { userId });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: '用户不存在'
        };
      }

      // 检查是否为管理员
      const isAdmin = user.username === 'admin' || user.email === 'admin@example.com' || user.role === 'admin';
      if (!isAdmin) {
        return {
          success: false,
          message: '权限不足'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: '账户未激活'
        };
      }

      return {
        success: true,
        data: {
          ...user.toApiResponse(),
          isAdmin: true,
          adminLevel: user.role === 'admin' ? 'super_admin' : 'admin'
        },
        message: '获取管理员资料成功'
      };

    } catch (error) {
      logger.error('[AdminAuthService] 获取管理员资料失败', { 
        error: error.message,
        userId 
      });
      return {
        success: false,
        message: '获取管理员资料失败'
      };
    }
  }

  /**
   * 验证管理员权限
   * @param {number} userId - 用户ID
   * @param {string} permissionCode - 权限代码
   * @returns {boolean} 是否有权限
   */
  async validateAdminPermission(userId, permissionCode) {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return false;
      }

      // 检查是否为管理员
      const isAdmin = user.username === 'admin' || user.email === 'admin@example.com' || user.role === 'admin';
      if (!isAdmin) {
        return false;
      }

      // 管理员拥有所有权限
      if (isAdmin) {
        return true;
      }

      // 普通用户需要检查权限
      return user.permissions && user.permissions.includes(permissionCode);
    } catch (error) {
      logger.error('[AdminAuthService] 验证管理员权限失败', { 
        error: error.message,
        userId,
        permissionCode
      });
      return false;
    }
  }

  /**
   * 获取管理员权限列表
   * @param {number} userId - 用户ID
   * @returns {Array} 权限列表
   */
  async getAdminPermissions(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return [];
      }

      // 检查是否为管理员
      const isAdmin = user.username === 'admin' || user.email === 'admin@example.com' || user.role === 'admin';
      if (!isAdmin) {
        return [];
      }

      // 管理员返回所有可能的管理员权限
      return [
        'admin:read', 'admin:write', 'admin:delete',
        'user:read', 'user:write', 'user:delete',
        'system:read', 'system:write', 'system:delete',
        'reports:read', 'reports:write',
        'settings:read', 'settings:write'
      ];

    } catch (error) {
      logger.error('[AdminAuthService] 获取管理员权限列表失败', { 
        error: error.message,
        userId 
      });
      return [];
    }
  }
}

module.exports = AdminAuthService;