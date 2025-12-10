/**
 * 用户服务层
 * 处理用户相关的业务逻辑
 */

const BaseService = require('./BaseService');
const UserRepository = require('../repositories/UserRepository');
const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { 
  generateTokenPair, 
  refreshAccessToken, 
  revokeTokenPair 
} = require('../config/jwtManager');
const { User, Admin, Role, Permission } = require('../models');
const AdminAuthService = require('./AdminAuthService');

class UserService extends BaseService {
  constructor() {
    super(new UserRepository());
    this.userRepository = new UserRepository();
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    try {
      logger.info('[UserService] 用户注册开始', { 
        username: userData.username,
        email: userData.email 
      });

      // 验证必填字段
      if (!userData.username || !userData.email || !userData.password) {
        throw new Error('用户名、邮箱和密码为必填项');
      }

      // 验证邮箱格式
      if (!this.isValidEmail(userData.email)) {
        throw new Error('邮箱格式不正确');
      }

      // 检查用户名和邮箱是否已存在
      const exists = await this.userRepository.checkUserExists(
        userData.username,
        userData.email
      );

      if (exists.exists) {
        const conflictField = exists.conflictField;
        const conflictValue = conflictField === 'username' ? userData.username : userData.email;
        throw new Error(`${conflictField === 'username' ? '用户名' : '邮箱'} '${conflictValue}' 已被使用`);
      }

      // 创建用户模型
      const user = UserModel.create({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name || userData.username,
        phone: userData.phone || null,
        role: 'user', // 默认角色
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      // 验证数据
      const validation = user.validate();
      if (!validation.isValid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
      }

      // 加密密码
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);
      
      // 设置密码哈希
      user.setPasswordHash(passwordHash);

      // 创建用户
      const createdUser = await this.userRepository.create(user.toDatabaseFormat());

      logger.info('[UserService] 用户注册成功', { 
        userId: createdUser.id,
        username: createdUser.username 
      });

      return {
        success: true,
        data: createdUser.toApiResponse(),
        message: '用户注册成功'
      };

    } catch (error) {
      logger.error('[UserService] 用户注册失败', { 
        error: error.message,
        username: userData.username,
        email: userData.email 
      });
      throw error;
    }
  }

  /**
   * 用户登录
   * @param {Object} loginData - 登录数据
   * @returns {Promise<Object>} 登录结果
   */
  async login(loginData) {
    try {
      logger.info('[UserService] 用户登录开始', { 
        username: loginData.username || loginData.email 
      });

      const { username, email, password } = loginData;

      // 验证必填字段
      if (!password) {
        throw new Error('密码为必填项');
      }

      if (!username && !email) {
        throw new Error('用户名或邮箱为必填项');
      }

      // 查找用户
      let user;
      if (email) {
        user = await this.userRepository.findByEmail(email);
      } else {
        user = await this.userRepository.findByUsername(username);
      }

      if (!user) {
        logger.warn('[UserService] 用户登录失败: 用户不存在', { 
          username: username || email 
        });
        throw new Error('用户名或密码错误');
      }

      // 检查用户是否激活
      if (!user.is_active) {
        logger.warn('[UserService] 用户登录失败: 用户未激活', { 
          userId: user.id,
          username: user.username 
        });
        throw new Error('账户未激活，请联系管理员');
      }

      // 检查用户是否被锁定
      const lockStatus = await this.userRepository.checkUserLocked(user.id);
      
      if (lockStatus.locked) {
        logger.warn('[UserService] 用户登录失败: 账户已被锁定', { 
          userId: user.id,
          username: user.username,
          lockedUntil: lockStatus.lockedUntil 
        });
        throw new Error(`账户已被锁定，锁定原因: ${lockStatus.reason || '登录失败次数过多'}，请稍后再试`);
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        // 记录登录失败
        await this.handleLoginFailure(user.id, username || email);
        
        logger.warn('[UserService] 用户登录失败: 密码错误', { 
          userId: user.id,
          username: user.username 
        });
        throw new Error('用户名或密码错误');
      }

      // 密码正确，重置登录失败次数
      await this.userRepository.resetLoginAttempts(user.id);
      
      // 更新最后登录时间
      await this.userRepository.updateLastLogin(user.id);

      // 生成JWT双令牌
      const tokenPair = generateTokenPair(user.id, {
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      });

      logger.info('[UserService] 用户登录成功', { 
        userId: user.id,
        username: user.username 
      });

      return {
        success: true,
        data: {
          user: user.toApiResponse(),
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          expiresIn: tokenPair.expiresIn,
          tokenType: 'Bearer',
          tokenPairId: tokenPair.tokenPairId
        },
        message: '登录成功'
      };

    } catch (error) {
      logger.error('[UserService] 用户登录失败', { 
        error: error.message,
        username: loginData.username || loginData.email 
      });
      throw error;
    }
  }

  /**
   * 处理登录失败
   * @param {number} userId - 用户ID
   * @param {string} identifier - 用户标识符
   */
  async handleLoginFailure(userId, identifier) {
    try {
      const result = await this.userRepository.incrementLoginAttempts(userId);
      
      if (result.success) {
        const { loginAttempts, lockedUntil } = result;
        
        if (lockedUntil && new Date(lockedUntil) > new Date()) {
          logger.warn('[UserService] 账户被锁定', { 
            userId, 
            identifier,
            loginAttempts,
            lockedUntil 
          });
          
          // 记录安全事件
          logger.warn('[UserService] 安全事件: 多次登录失败导致账户锁定', {
            event: 'ACCOUNT_LOCKED',
            userId,
            identifier,
            loginAttempts,
            lockedUntil,
            timestamp: new Date().toISOString()
          });
        } else {
          logger.warn('[UserService] 登录失败次数增加', { 
            userId, 
            identifier,
            loginAttempts 
          });
        }
      }
    } catch (error) {
      logger.error('[UserService] 处理登录失败时出错', { 
        error: error.message,
        userId,
        identifier 
      });
    }
  }

  /**
   * 用户登出
   * @param {number} userId - 用户ID
   * @param {string} accessToken - 访问令牌
   * @param {string} refreshToken - 刷新令牌
   * @returns {Promise<Object>} 登出结果
   */
  async logout(userId, accessToken, refreshToken) {
    try {
      logger.info('[UserService] 用户登出', { userId });

      // 撤销令牌
      const revokeResults = revokeTokenPair(accessToken, refreshToken, 'logout');

      // 记录安全事件
      if (revokeResults.accessToken || revokeResults.refreshToken) {
        logger.info('[UserService] 用户登出成功，令牌已撤销', { 
          userId,
          accessTokenRevoked: revokeResults.accessToken,
          refreshTokenRevoked: revokeResults.refreshToken 
        });

        // 记录安全事件
        logger.info('[UserService] 安全事件: 用户正常登出', {
          event: 'USER_LOGOUT',
          userId,
          revokedTokens: {
            accessToken: revokeResults.accessToken,
            refreshToken: revokeResults.refreshToken
          },
          timestamp: new Date().toISOString()
        });
      } else {
        logger.warn('[UserService] 用户登出时撤销令牌失败', { userId });
      }

      return {
        success: true,
        message: '登出成功'
      };

    } catch (error) {
      logger.error('[UserService] 用户登出失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 刷新访问令牌
   * @param {string} refreshToken - 刷新令牌
   * @param {Object} userInfo - 用户信息
   * @returns {Promise<Object>} 刷新结果
   */
  async refreshToken(refreshToken, userInfo = {}) {
    try {
      logger.info('[UserService] 刷新访问令牌');

      // 使用JWT管理器刷新令牌
      const newTokens = refreshAccessToken(refreshToken, userInfo);

      logger.info('[UserService] 访问令牌刷新成功');

      return {
        success: true,
        data: {
          accessToken: newTokens.accessToken,
          expiresIn: newTokens.expiresIn,
          tokenType: 'Bearer'
        },
        message: '令牌刷新成功'
      };

    } catch (error) {
      logger.error('[UserService] 刷新访问令牌失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 解锁用户账户
   * @param {number} userId - 用户ID
   * @param {string} reason - 解锁原因
   * @returns {Promise<Object>} 解锁结果
   */
  async unlockUser(userId, reason = 'Admin unlock') {
    try {
      logger.info('[UserService] 解锁用户账户', { userId, reason });

      const success = await this.userRepository.unlockUser(userId, reason);

      if (success) {
        logger.info('[UserService] 用户账户解锁成功', { userId, reason });
        
        // 记录安全事件
        logger.info('[UserService] 安全事件: 用户账户被解锁', {
          event: 'ACCOUNT_UNLOCKED',
          userId,
          reason,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          message: '用户账户解锁成功'
        };
      } else {
        throw new Error('解锁用户账户失败');
      }

    } catch (error) {
      logger.error('[UserService] 解锁用户账户失败', { 
        error: error.message,
        userId,
        reason 
      });
      throw error;
    }
  }

  /**
   * 锁定用户账户
   * @param {number} userId - 用户ID
   * @param {string} reason - 锁定原因
   * @param {number} durationMinutes - 锁定时长（分钟）
   * @returns {Promise<Object>} 锁定结果
   */
  async lockUser(userId, reason = 'Admin lock', durationMinutes = 1440) {
    try {
      logger.info('[UserService] 锁定用户账户', { userId, reason, durationMinutes });

      const success = await this.userRepository.lockUser(userId, reason, durationMinutes);

      if (success) {
        logger.info('[UserService] 用户账户锁定成功', { userId, reason, durationMinutes });
        
        // 记录安全事件
        logger.warn('[UserService] 安全事件: 用户账户被锁定', {
          event: 'ACCOUNT_LOCKED_ADMIN',
          userId,
          reason,
          durationMinutes,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          message: '用户账户锁定成功'
        };
      } else {
        throw new Error('锁定用户账户失败');
      }

    } catch (error) {
      logger.error('[UserService] 锁定用户账户失败', { 
        error: error.message,
        userId,
        reason,
        durationMinutes 
      });
      throw error;
    }
  }

  /**
   * 获取用户账户状态
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 账户状态
   */
  async getAccountStatus(userId) {
    try {
      logger.info('[UserService] 获取用户账户状态', { userId });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      const lockStatus = await this.userRepository.checkUserLocked(userId);

      return {
        success: true,
        data: {
          userId: user.id,
          username: user.username,
          email: user.email,
          isActive: user.is_active,
          loginAttempts: lockStatus.loginAttempts,
          locked: lockStatus.locked,
          lockedUntil: lockStatus.lockedUntil,
          lockReason: lockStatus.reason,
          lastLogin: user.last_login,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        message: '获取账户状态成功'
      };

    } catch (error) {
      logger.error('[UserService] 获取用户账户状态失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 获取用户资料
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户资料
   */
  async getProfile(userId) {
    try {
      logger.info('[UserService] 获取用户资料', { userId });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        logger.warn('[UserService] 获取用户资料失败: 用户不存在', { userId });
        throw new Error('用户不存在');
      }

      if (!user.is_active) {
        logger.warn('[UserService] 获取用户资料失败: 用户未激活', { userId });
        throw new Error('用户未激活');
      }

      logger.info('[UserService] 获取用户资料成功', { 
        userId,
        username: user.username 
      });

      return {
        success: true,
        data: user.toApiResponse(),
        message: '获取用户资料成功'
      };

    } catch (error) {
      logger.error('[UserService] 获取用户资料失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 更新用户资料
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateProfile(userId, updateData) {
    try {
      logger.info('[UserService] 更新用户资料', { 
        userId,
        data: this.sanitizeLogData(updateData) 
      });

      // 查找用户
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        logger.warn('[UserService] 更新用户资料失败: 用户不存在', { userId });
        throw new Error('用户不存在');
      }

      if (!user.is_active) {
        logger.warn('[UserService] 更新用户资料失败: 用户未激活', { userId });
        throw new Error('用户未激活');
      }

      // 验证更新数据
      const allowedFields = ['full_name', 'phone', 'avatar', 'bio'];
      const filteredData = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      if (Object.keys(filteredData).length === 0) {
        throw new Error('没有有效的更新数据');
      }

      // 检查用户名是否已存在（如果更新了用户名）
      if (updateData.username && updateData.username !== user.username) {
        const usernameExists = await this.userRepository.isUsernameExists(updateData.username, userId);
        if (usernameExists) {
          throw new Error(`用户名 '${updateData.username}' 已被使用`);
        }
        filteredData.username = updateData.username;
      }

      // 检查邮箱是否已存在（如果更新了邮箱）
      if (updateData.email && updateData.email !== user.email) {
        if (!this.isValidEmail(updateData.email)) {
          throw new Error('邮箱格式不正确');
        }
        
        const emailExists = await this.userRepository.isEmailExists(updateData.email, userId);
        if (emailExists) {
          throw new Error(`邮箱 '${updateData.email}' 已被使用`);
        }
        filteredData.email = updateData.email;
      }

      // 更新用户
      filteredData.updated_at = new Date();
      const updatedUser = await this.userRepository.update(userId, filteredData);

      logger.info('[UserService] 更新用户资料成功', { 
        userId,
        username: updatedUser.username 
      });

      return {
        success: true,
        data: updatedUser.toApiResponse(),
        message: '用户资料更新成功'
      };

    } catch (error) {
      logger.error('[UserService] 更新用户资料失败', { 
        error: error.message,
        userId,
        data: this.sanitizeLogData(updateData) 
      });
      throw error;
    }
  }

  /**
   * 修改密码
   * @param {number} userId - 用户ID
   * @param {Object} passwordData - 密码数据
   * @returns {Promise<Object>} 修改结果
   */
  async changePassword(userId, passwordData) {
    try {
      logger.info('[UserService] 修改密码', { userId });

      const { currentPassword, newPassword } = passwordData;

      // 验证必填字段
      if (!currentPassword || !newPassword) {
        throw new Error('当前密码和新密码为必填项');
      }

      // 验证新密码强度
      if (!this.isValidPassword(newPassword)) {
        throw new Error('新密码不符合安全要求（至少8位，包含大小写字母、数字和特殊字符）');
      }

      // 查找用户
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        logger.warn('[UserService] 修改密码失败: 用户不存在', { userId });
        throw new Error('用户不存在');
      }

      if (!user.is_active) {
        logger.warn('[UserService] 修改密码失败: 用户未激活', { userId });
        throw new Error('用户未激活');
      }

      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isCurrentPasswordValid) {
        logger.warn('[UserService] 修改密码失败: 当前密码错误', { userId });
        throw new Error('当前密码错误');
      }

      // 加密新密码
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // 更新密码
      const success = await this.userRepository.updatePassword(userId, newPasswordHash);

      if (!success) {
        throw new Error('密码更新失败');
      }

      logger.info('[UserService] 修改密码成功', { userId });

      return {
        success: true,
        message: '密码修改成功'
      };

    } catch (error) {
      logger.error('[UserService] 修改密码失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {boolean} 是否有效
   */
  isValidPassword(password) {
    // 至少8位，包含大小写字母、数字和特殊字符
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * 生成JWT令牌
   * @param {UserModel} user - 用户模型
   * @returns {string} JWT令牌
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');
  }

  /**
   * 清理日志数据（移除敏感信息）
   * @param {Object} data - 原始数据
   * @returns {Object} 清理后的数据
   */
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    
    // 移除敏感字段
    const sensitiveFields = [
      'password', 'password_hash', 'passwordHash', 'pwd',
      'currentPassword', 'newPassword',
      'token', 'access_token', 'refresh_token',
      'secret', 'private_key', 'api_key', 'apiKey'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field] !== undefined) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * 验证创建数据
   * @param {Object} data - 待验证的数据
   * @returns {Promise<Object>} 验证结果
   */
  async validateData(data) {
    const errors = [];

    // 验证必填字段
    if (!data.username) {
      errors.push('用户名为必填项');
    }
    if (!data.email) {
      errors.push('邮箱为必填项');
    }
    if (!data.password) {
      errors.push('密码为必填项');
    }

    // 验证用户名格式
    if (data.username && !/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) {
      errors.push('用户名必须是3-20位的字母、数字或下划线');
    }

    // 验证邮箱格式
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('邮箱格式不正确');
    }

    // 验证密码强度
    if (data.password && !this.isValidPassword(data.password)) {
      errors.push('密码不符合安全要求（至少8位，包含大小写字母、数字和特殊字符）');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证更新数据
   * @param {Object} data - 待验证的数据
   * @param {Object} existing - 现有记录
   * @returns {Promise<Object>} 验证结果
   */
  async validateUpdateData(data, existing) {
    const errors = [];

    // 验证邮箱格式（如果提供）
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('邮箱格式不正确');
    }

    // 验证用户名格式（如果提供）
    if (data.username && !/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) {
      errors.push('用户名必须是3-20位的字母、数字或下划线');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 发送邮箱验证邮件
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 发送结果
   */
  async sendEmailVerification(userId) {
    try {
      logger.info('[UserService] 发送邮箱验证邮件', { userId });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      if (user.emailVerified) {
        return {
          success: true,
          message: '邮箱已验证'
        };
      }

      // 生成验证令牌
      const crypto = require('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时过期

      // 保存验证令牌
      await this.userRepository.update(userId, {
        verification_token: verificationToken,
        verification_token_expires: expires
      });

      // 发送邮件（这里模拟发送，实际项目中需要集成邮件服务）
      logger.info('[UserService] 邮箱验证邮件已发送', { 
        userId, 
        email: user.email,
        token: verificationToken 
      });

      return {
        success: true,
        message: '验证邮件已发送，请检查您的邮箱',
        data: {
          verificationToken, // 开发环境返回token，生产环境应该移除
          expiresIn: 24 * 60 * 60 // 24小时
        }
      };

    } catch (error) {
      logger.error('[UserService] 发送邮箱验证邮件失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 验证邮箱
   * @param {string} token - 验证令牌
   * @returns {Promise<Object>} 验证结果
   */
  async verifyEmail(token) {
    try {
      logger.info('[UserService] 验证邮箱', { token: token.substring(0, 8) + '...' });

      const user = await this.userRepository.findByVerificationToken(token);
      
      if (!user) {
        throw new Error('无效的验证令牌');
      }

      // 检查令牌是否过期
      if (!user.isEmailVerificationTokenValid()) {
        throw new Error('验证令牌已过期，请重新发送验证邮件');
      }

      // 验证邮箱
      await this.userRepository.update(user.id, {
        email_verified: true,
        verification_token: null,
        verification_token_expires: null
      });

      logger.info('[UserService] 邮箱验证成功', { userId: user.id });

      return {
        success: true,
        message: '邮箱验证成功'
      };

    } catch (error) {
      logger.error('[UserService] 邮箱验证失败', { 
        error: error.message,
        token: token.substring(0, 8) + '...' 
      });
      throw error;
    }
  }

  /**
   * 更新QQ号码
   * @param {number} userId - 用户ID
   * @param {string} qqNumber - QQ号码
   * @returns {Promise<Object>} 更新结果
   */
  async updateQQNumber(userId, qqNumber) {
    try {
      logger.info('[UserService] 更新QQ号码', { userId, qqNumber });

      // 验证QQ号码格式
      if (!/^\d{5,15}$/.test(qqNumber)) {
        throw new Error('QQ号码格式不正确');
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查QQ号码是否已被使用
      const existingUser = await this.userRepository.findByQQNumber(qqNumber);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('该QQ号码已被其他账户使用');
      }

      // 更新QQ号码
      await this.userRepository.update(userId, {
        qq_number: qqNumber,
        qq_verified: false // 重置验证状态
      });

      logger.info('[UserService] QQ号码更新成功', { userId, qqNumber });

      return {
        success: true,
        message: 'QQ号码更新成功，需要验证',
        data: {
          qq_number: qqNumber,
          qq_verified: false
        }
      };

    } catch (error) {
      logger.error('[UserService] 更新QQ号码失败', { 
        error: error.message,
        userId,
        qqNumber 
      });
      throw error;
    }
  }

  /**
   * 验证QQ号
   * @param {number} userId - 用户ID
   * @param {string} verificationCode - 验证代码
   * @returns {Promise<Object>} 验证结果
   */
  async verifyQQ(userId, verificationCode) {
    try {
      logger.info('[UserService] 验证QQ号', { userId });

      // 实际项目中，这里需要验证腾讯QQ API或短信验证
      // 这里简单模拟验证过程
      const isValidCode = verificationCode === process.env.QQ_VERIFICATION_CODE; // 模拟验证码

      if (!isValidCode) {
        throw new Error('验证代码错误');
      }

      // 验证成功
      await this.userRepository.update(userId, {
        qq_verified: true
      });

      logger.info('[UserService] QQ验证成功', { userId });

      return {
        success: true,
        message: 'QQ验证成功'
      };

    } catch (error) {
      logger.error('[UserService] QQ验证失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 请求密码重置
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object>} 请求结果
   */
  async requestPasswordReset(email) {
    try {
      logger.info('[UserService] 请求密码重置', { email });

      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        // 为安全考虑，即使用户不存在也返回成功
        return {
          success: true,
          message: '如果该邮箱地址已注册，您将收到密码重置邮件'
        };
      }

      // 生成重置令牌
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2小时过期

      // 保存重置令牌
      await this.userRepository.update(user.id, {
        reset_token: resetToken,
        reset_token_expires: expires
      });

      // 发送重置邮件（模拟）
      logger.info('[UserService] 密码重置邮件已发送', { 
        userId: user.id,
        email: user.email,
        token: resetToken 
      });

      return {
        success: true,
        message: '如果该邮箱地址已注册，您将收到密码重置邮件',
        data: {
          resetToken, // 开发环境返回token
          expiresIn: 2 * 60 * 60 // 2小时
        }
      };

    } catch (error) {
      logger.error('[UserService] 请求密码重置失败', { 
        error: error.message,
        email 
      });
      throw error;
    }
  }

  /**
   * 重置密码
   * @param {string} token - 重置令牌
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} 重置结果
   */
  async resetPassword(token, newPassword) {
    try {
      logger.info('[UserService] 重置密码', { token: token.substring(0, 8) + '...' });

      const user = await this.userRepository.findByResetToken(token);
      
      if (!user) {
        throw new Error('无效的重置令牌');
      }

      // 检查令牌是否过期
      if (!user.isPasswordResetTokenValid()) {
        throw new Error('重置令牌已过期，请重新请求密码重置');
      }

      // 验证新密码强度
      if (!this.isValidPassword(newPassword)) {
        throw new Error('新密码不符合安全要求（至少8位，包含大小写字母、数字和特殊字符）');
      }

      // 加密新密码
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // 更新密码并清除重置令牌
      await this.userRepository.update(user.id, {
        password_hash: newPasswordHash,
        reset_token: null,
        reset_token_expires: null
      });

      logger.info('[UserService] 密码重置成功', { userId: user.id });

      return {
        success: true,
        message: '密码重置成功，请使用新密码登录'
      };

    } catch (error) {
      logger.error('[UserService] 密码重置失败', { 
        error: error.message,
        token: token.substring(0, 8) + '...' 
      });
      throw error;
    }
  }

  /**
   * 停用账户
   * @param {number} userId - 用户ID
   * @param {string} reason - 停用原因
   * @returns {Promise<Object>} 停用结果
   */
  async deactivateAccount(userId, reason = '用户主动停用') {
    try {
      logger.info('[UserService] 停用账户', { userId, reason });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      if (!user.is_active) {
        return {
          success: true,
          message: '账户已是停用状态'
        };
      }

      // 停用账户
      await this.userRepository.update(userId, {
        is_active: false
      });

      // 撤销用户的所有令牌
      await revokeTokenPair(userId);

      logger.info('[UserService] 账户停用成功', { userId, reason });

      return {
        success: true,
        message: '账户已停用'
      };

    } catch (error) {
      logger.error('[UserService] 停用账户失败', { 
        error: error.message,
        userId,
        reason 
      });
      throw error;
    }
  }

  /**
   * 删除账户（软删除）
   * @param {number} userId - 用户ID
   * @param {string} password - 确认密码
   * @returns {Promise<Object>} 删除结果
   */
  async deleteAccount(userId, password) {
    try {
      logger.info('[UserService] 删除账户', { userId });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        throw new Error('密码错误');
      }

      // 软删除：标记为已删除而不是真正删除
      const deleteReason = `账户被用户删除于 ${new Date().toISOString()}`;
      
      await this.userRepository.update(userId, {
        username: `deleted_${userId}_${Date.now()}`,
        email: `deleted_${userId}_${Date.now()}@deleted.com`,
        password_hash: null,
        is_active: false,
        deleted_at: new Date(),
        delete_reason: deleteReason
      });

      // 撤销用户的所有令牌
      await revokeTokenPair(userId);

      logger.info('[UserService] 账户删除成功', { userId });

      return {
        success: true,
        message: '账户已删除'
      };

    } catch (error) {
      logger.error('[UserService] 删除账户失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 检查用户名是否可用
   * @param {string} username - 用户名
   * @param {number} excludeUserId - 排除的用户ID
   * @returns {Promise<Object>} 检查结果
   */
  async checkUsernameAvailability(username, excludeUserId = null) {
    try {
      const exists = await this.userRepository.isUsernameExists(username, excludeUserId);
      
      return {
        success: true,
        data: {
          available: !exists
        },
        message: exists ? '用户名已被使用' : '用户名可用'
      };

    } catch (error) {
      logger.error('[UserService] 检查用户名可用性失败', { 
        error: error.message,
        username 
      });
      throw error;
    }
  }

  /**
   * 检查邮箱是否可用
   * @param {string} email - 邮箱
   * @param {number} excludeUserId - 排除的用户ID
   * @returns {Promise<Object>} 检查结果
   */
  async checkEmailAvailability(email, excludeUserId = null) {
    try {
      const exists = await this.userRepository.isEmailExists(email, excludeUserId);
      
      return {
        success: true,
        data: {
          available: !exists
        },
        message: exists ? '邮箱已被使用' : '邮箱可用'
      };

    } catch (error) {
      logger.error('[UserService] 检查邮箱可用性失败', { 
        error: error.message,
        email 
      });
      throw error;
    }
  }

  /**
   * 管理员登录
   * @param {Object} loginData - 登录数据
   * @returns {Promise<Object>} 登录结果
   */
  async adminLogin(loginData) {
    try {
      // 创建管理员认证服务实例
      const adminAuthService = new AdminAuthService();
      
      // 调用管理员认证服务进行登录验证
      const result = await adminAuthService.adminLogin(loginData);
      
      return result;
    } catch (error) {
      logger.error('[UserService] 管理员登录失败', { 
        error: error.message,
        username: loginData.username
      });
      throw error;
    }
  }

  /**
   * 获取管理员资料
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 管理员资料
   */
  async getAdminProfile(userId) {
    try {
      // 创建管理员认证服务实例
      const adminAuthService = new AdminAuthService();
      
      // 调用管理员认证服务获取资料
      const adminProfile = await adminAuthService.getAdminProfile(userId);
      
      return adminProfile;
    } catch (error) {
      logger.error('[UserService] 获取管理员资料失败', { 
        error: error.message,
        userId
      });
      throw error;
    }
  }
}

module.exports = UserService;