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
}

module.exports = UserService;