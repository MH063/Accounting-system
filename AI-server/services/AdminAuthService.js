/**
 * 管理员认证服务层
 * 处理管理员登录、认证相关的业务逻辑
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { generateTokenPair } = require('../config/jwtManager');
const { ROLES, PERMISSIONS } = require('../config/permissions');
const UserRepository = require('../repositories/UserRepository');
const TwoFactorRepository = require('../repositories/TwoFactorRepository');
const UserModel = require('../models/UserModel');
const systemConfigService = require('./systemConfigService');
const PasswordService = require('./PasswordService');

class AdminAuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.twoFactorRepository = new TwoFactorRepository();
  }

  /**
   * 检查是否具有管理员访问权限
   * @param {Object} user - 用户对象
   * @param {Object} userWithRoles - 包含角色的用户对象
   * @returns {boolean}
   */
  checkAdminAccess(user, userWithRoles) {
    if (!user) return false;
    
    const adminRoles = ['admin', 'system_admin'];
    
    // 检查 role 字段 (可能是字符串或数组)
    const roles = [];
    if (user.role) {
      if (Array.isArray(user.role)) roles.push(...user.role);
      else roles.push(user.role);
    }
    if (userWithRoles && userWithRoles.role) {
      if (Array.isArray(userWithRoles.role)) roles.push(...userWithRoles.role);
      else roles.push(userWithRoles.role);
    }
    
    const hasAdminRole = roles.some(role => adminRoles.includes(role));
    const isAdminByUsername = user.username === 'admin' || user.username === 'system_admin';
    const isAdminByEmail = user.email === 'admin@example.com';
    
    return hasAdminRole || isAdminByUsername || isAdminByEmail;
  }

  /**
   * 管理员登录验证
   * @param {string} username - 用户名/邮箱
   * @param {string} password - 密码
   * @param {string} ip - IP地址
   * @param {string} userAgent - 用户代理
   * @returns {Object} 登录结果
   */
  async login(username, password, ip = 'unknown', userAgent = 'unknown') {
    try {
      logger.info('[AdminAuthService] 管理员登录开始', { username });

      // 1. 验证输入
      if (!username || !password) {
        return { success: false, message: '用户名和密码不能为空' };
      }

      // 2. 查找用户 (支持用户名或邮箱登录)
      let user = await this.userRepository.findByUsername(username);
      if (!user && username.includes('@')) {
        user = await this.userRepository.findByEmail(username);
      }

      if (!user) {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 3. 检查账户是否被锁定
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        const remainingTime = Math.ceil((new Date(user.lockedUntil) - new Date()) / 1000);
        const remainingMinutes = Math.ceil(remainingTime / 60);
        return {
          success: false,
          message: `账户已被锁定，请在 ${remainingMinutes} 分钟后重试`,
          locked: true,
          lockedUntil: user.lockedUntil
        };
      }

      // 4. 检查是否为管理员角色
      const userWithRoles = await this.userRepository.findUserWithRoles(username);
      const isAdmin = this.checkAdminAccess(user, userWithRoles);
      
      if (!isAdmin) {
        return this.handleFailedLogin(user.id, username, '权限不足，仅管理员可以登录', ip, userAgent);
      }

      // 5. 检查用户是否激活
      if (!user.isActive) {
        return this.handleFailedLogin(user.id, username, '账户未激活', ip, userAgent);
      }

      // 6. 验证密码 (支持 PBKDF2 和旧的 bcrypt)
      const isPasswordValid = await PasswordService.verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return this.handleFailedLogin(user.id, username, '密码错误', ip, userAgent);
      }

      // 5.1 检查密码是否过期
      const isExpired = await PasswordService.isPasswordExpired(user.passwordChangedAt);
      if (isExpired) {
        logger.info('[AdminAuthService] 管理员密码已过期', { userId: user.id });
        return {
          success: true,
          data: {
            mustChangePassword: true,
            user: user.toApiResponse()
          },
          message: '您的密码已过期，请修改密码后重新登录'
        };
      }

      // 5.2 检查是否启用了双因素认证 (2FA)
      const securityConfig = await systemConfigService.getSecurityConfigs();
      if (securityConfig.twoFactorEnabled) {
        // 检查用户是否已绑定 2FA
        const twoFactor = await this.twoFactorRepository.getTwoFactorAuthByUserId(user.id);
        if (twoFactor && twoFactor.isEnabled) {
          logger.info('[AdminAuthService] 需要双因素认证', { userId: user.id });
          return {
            success: true,
            data: {
              requireTwoFactor: true,
              userId: user.id,
              username: user.username
            },
            message: '请输入双因素认证码'
          };
        }
      }

      // 6. 生成令牌对
      const tokens = generateTokenPair(user.id, {
        username: user.username,
        email: user.email,
        status: user.isActive ? 'active' : 'inactive',
        role: userWithRoles?.role || user.role || 'admin',
        permissions: userWithRoles?.permissions || user.permissions || ROLES.ADMIN.permissions,
        isAdmin: true
      });

      // 7. 更新最后登录时间
      await this.userRepository.updateLastLogin(user.id);

      // 8. 清除失败登录记录
      await this.userRepository.resetLoginAttempts(user.id);

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
   * 处理管理员登录
   */
  async login(username, password, ip = 'unknown', userAgent = 'unknown') {
    // ... 原有逻辑已经在 login 中处理了 2FA 跳转
  }

  /**
   * 验证双因素认证码
   * @param {number} userId - 用户ID
   * @param {string} code - 认证码
   * @param {string} ip - IP地址
   * @param {string} userAgent - 用户代理
   * @returns {Object} 验证结果
   */
  async verifyTwoFactor(userId, code, ip = 'unknown', userAgent = 'unknown') {
    try {
      logger.info('[AdminAuthService] 开始验证 2FA', { userId });

      // 1. 获取用户
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { success: false, message: '用户不存在' };
      }

      // 2. 获取 2FA 密钥
      const twoFactor = await this.twoFactorRepository.getTwoFactorAuthByUserId(userId);
      if (!twoFactor || !twoFactor.isEnabled) {
        return { success: false, message: '未启用双因素认证' };
      }

      // 3. 验证 TOTP 码
      const TotpService = require('./TotpService');
      const isValid = TotpService.verifyToken(twoFactor.secretKey, code);

      if (!isValid) {
        // 记录失败日志 (可选)
        return { success: false, message: '验证码不正确或已过期' };
      }

      // 4. 验证通过，生成令牌对
      const userWithRoles = await this.userRepository.findUserWithRoles(user.username);
      const tokens = generateTokenPair(user.id, {
        username: user.username,
        email: user.email,
        status: user.isActive ? 'active' : 'inactive',
        role: userWithRoles?.role || user.role || 'admin',
        permissions: userWithRoles?.permissions || user.permissions || ROLES.ADMIN.permissions,
        isAdmin: true
      });

      // 5. 更新最后登录时间
      await this.userRepository.updateLastLogin(user.id);

      logger.info('[AdminAuthService] 2FA 验证成功', { userId });

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
        message: '验证成功'
      };
    } catch (error) {
      logger.error('[AdminAuthService] 2FA 验证失败', { error: error.message, userId });
      return { success: false, message: '验证失败，请稍后重试' };
    }
  }

  /**
   * 处理登录失败

   * @param {number} userId - 用户ID
   * @param {string} username - 用户名
   * @param {string} reason - 失败原因
   * @param {string} ip - IP地址
   * @param {string} userAgent - 用户代理
   * @returns {Object} 失败结果
   */
  async handleFailedLogin(userId, username, reason, ip = 'unknown', userAgent = 'unknown') {
    try {
      // 获取系统安全配置
      const securityConfig = await systemConfigService.getSecurityConfigs();
      const { loginFailCount, lockTime, resetWindow } = securityConfig;

      // 增加失败次数并检查锁定
      const result = await this.userRepository.increaseFailedAttempts(userId, ip, userAgent, loginFailCount, lockTime, resetWindow);

      // 记录安全事件
      logger.warn('[AdminAuthService] 管理员登录失败', {
        userId,
        username,
        reason,
        attempts: result.attempts,
        locked: result.locked
      });

      return {
        success: false,
        message: result.message || reason,
        locked: result.locked,
        attempts: result.attempts
      };
    } catch (error) {
      logger.error('[AdminAuthService] 处理登录失败出错', { error: error.message, userId, username });
      return {
        success: false,
        message: '登录失败'
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
      const userWithRoles = await this.userRepository.findUserWithRoles(user.email);
      const isAdmin = this.checkAdminAccess(user, userWithRoles);
      
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
          adminLevel: isAdmin ? 'system_admin' : 'admin'
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
      const userWithRoles = await this.userRepository.findUserWithRoles(user.email);
      const isAdmin = this.checkAdminAccess(user, userWithRoles);
      
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
      const userWithRoles = await this.userRepository.findUserWithRoles(user.email);
      const isAdmin = this.checkAdminAccess(user, userWithRoles);
      
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