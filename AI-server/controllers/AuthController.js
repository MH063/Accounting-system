/**
 * 用户认证控制器
 * 处理用户登录、注册、认证相关的业务逻辑
 */

const BaseController = require('./BaseController');
const UserService = require('../services/UserService');
const logger = require('../config/logger');
const { generateTokenPair, refreshAccessToken, revokeTokenPair } = require('../config/jwtManager');

class AuthController extends BaseController {
  constructor() {
    super();
    this.userService = new UserService();
  }

  /**
   * 用户登录
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { username, email, password, captchaCode, sessionId } = req.body;
      
      // 记录登录尝试
      logger.audit(req, '用户登录尝试', { 
        username,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      // 验证输入
      this.validateRequiredFields(req.body, ['password']);

      if ((!username || username.toString().trim().length === 0) &&
          (!email || email.toString().trim().length === 0)) {
        return this.sendError(res, '用户名或邮箱为必填项', 400);
      }

      // 调用服务层进行登录验证（包含登录失败限制和账户锁定功能）
      const loginResult = await this.userService.login({ 
        username, 
        email,
        password,
        captchaCode,
        sessionId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      if (!loginResult.success) {
        // 登录失败，记录安全日志
        logger.auth('登录失败', { username, reason: loginResult.message });
        logger.security(req, '登录尝试失败', { 
          username,
          reason: loginResult.message
        });
        
        // 根据失败原因返回不同的状态码
        const statusCode = loginResult.message.includes('锁定') ? 423 : 401;
        return this.sendError(res, loginResult.message, statusCode);
      }

      const { user, tokens, session } = loginResult.data;

      logger.auth('登录成功', { username, userId: user.id });
      logger.audit(req, '用户登录成功', { 
        username,
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      // 返回成功响应（包含双令牌和会话信息）
      return this.sendSuccess(res, {
        user: user,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshExpiresIn: tokens.refreshExpiresIn
        },
        session: session ? {
          sessionId: session.id,
          sessionToken: session.session_token,
          deviceInfo: session.device_info,
          expiresAt: session.expires_at
        } : null
      }, '登录成功');

    } catch (error) {
      logger.error('[AuthController] 登录失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 用户注册
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { username, email, password, nickname, phone, avatar_url } = req.body;
      
      // 记录注册尝试审计日志
      logger.audit(req, '用户注册尝试', {
        username,
        email,
        timestamp: new Date().toISOString()
      });

      // 验证必填字段
      try {
        this.validateRequiredFields(req.body, ['username', 'email', 'password']);
      } catch (validationError) {
        logger.audit(req, '用户注册验证失败', {
          error: validationError.message,
          timestamp: new Date().toISOString()
        });
        return this.sendError(res, validationError.message, 400);
      }

      // 创建用户
      const result = await this.userService.register({
        username,
        email,
        password,
        nickname,
        phone,
        avatar_url
      });
      
      const user = result.data;

      // 记录注册成功审计日志
      logger.audit(req, '用户注册成功', {
        userId: user.id,
        username: user.username,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      // 过滤敏感数据并返回
      const filteredUser = this.filterSensitiveData(user);
      return this.sendSuccess(res, filteredUser, '用户注册成功');

    } catch (error) {
      // 记录注册失败审计日志
      logger.audit(req, '用户注册失败', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      logger.error('用户注册失败', { error: error.message, stack: error.stack });
      
      // 处理特定的业务错误
      if (error.message.includes('已存在')) {
        return this.sendError(res, '用户名或邮箱已存在', 409);
      }
      
      // 其他错误传递给全局错误处理中间件
      return next(error);
    }
  }

  /**
   * 获取用户个人资料
   * GET /api/auth/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      // 记录用户信息访问尝试
      logger.audit(req, '用户信息访问', { 
        userId,
        timestamp: new Date().toISOString()
      });

      // 调用服务层获取用户信息
      const result = await this.userService.getProfile(userId);
      const user = result.data;
      
      if (!user) {
        return this.sendError(res, '用户不存在', 404);
      }

      // 返回用户信息（不包含敏感数据）
      return this.sendSuccess(res, {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      });

    } catch (error) {
      logger.error('[AuthController] 获取用户资料失败', { error: error.message });
      return this.sendError(res, '服务器内部错误', 500);
    }
  }

  /**
   * 更新用户个人资料
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      // 记录用户信息更新尝试
      logger.audit(req, '用户信息更新', { 
        userId,
        data: this.filterSensitiveData(updateData),
        timestamp: new Date().toISOString()
      });

      // 调用服务层更新用户信息
      const result = await this.userService.updateProfile(userId, updateData);
      const updatedUser = result.data;
      
      if (!updatedUser) {
        return this.sendError(res, '用户不存在', 404);
      }

      logger.auth('用户资料更新成功', { userId });
      
      // 返回更新后的用户信息
      return this.sendSuccess(res, {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at
        }
      }, '资料更新成功');

    } catch (error) {
      logger.error('[AuthController] 更新用户资料失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 修改密码
   * PUT /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      // 验证输入
      try {
        this.validateRequiredFields(req.body, ['currentPassword', 'newPassword']);
      } catch (validationError) {
        return this.sendError(res, validationError.message, 400);
      }

      // 记录密码修改尝试
      logger.audit(req, '用户密码修改', { 
        userId,
        timestamp: new Date().toISOString()
      });

      // 调用服务层修改密码
      const success = await this.userService.changePassword(userId, {
        currentPassword,
        newPassword
      });
      
      if (!success) {
        return this.sendError(res, '当前密码错误', 400);
      }

      logger.auth('密码修改成功', { userId });
      logger.audit(req, '用户密码修改成功', { 
        userId,
        timestamp: new Date().toISOString()
      });

      return this.sendSuccess(res, null, '密码修改成功');

    } catch (error) {
      logger.error('[AuthController] 密码修改失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 刷新访问令牌
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['refreshToken']);

      // 记录令牌刷新尝试
      logger.audit(req, '令牌刷新尝试', {
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // 调用服务层刷新令牌
      const result = await this.userService.refreshToken(refreshToken);
      
      if (!result.success) {
        logger.security(req, '令牌刷新失败', { 
          reason: result.message,
          userId: req.user?.id
        });
        return this.sendError(res, result.message, 401);
      }

      const { accessToken, refreshToken: newRefreshToken } = result.data;

      logger.auth('令牌刷新成功', { userId: req.user.id });

      return this.sendSuccess(res, {
        accessToken,
        refreshToken: newRefreshToken
      }, '令牌刷新成功');
    } catch (error) {
      logger.error('[AuthController] 刷新令牌失败', { error: error.message });
      
      // 处理刷新令牌相关的错误
      if (error.message.includes('刷新令牌已被撤销') ||
          error.message.includes('无效的刷新令牌') ||
          error.message.includes('会话已过期') ||
          error.message.includes('令牌已过期') ||
          error.message.includes('无效的刷新令牌类型')) {
        return this.sendError(res, error.message, 401);
      }
      
      // 其他错误传递给全局错误处理中间件
      next(error);
    }
  }

  /**
   * 安全刷新令牌接口（实现刷新令牌轮换）
   * POST /api/auth/refresh-token
   */
  async refreshSecureToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      // 验证输入
      if (!refreshToken) {
        return this.sendError(res, '刷新令牌不能为空', 400);
      }

      // 记录安全令牌刷新尝试
      logger.audit(req, '安全令牌刷新尝试', {
        timestamp: new Date().toISOString()
      });

      // 首先验证刷新令牌是否有效且未被撤销
      const { verifyTokenWithBlacklist } = require('../config/jwtManager');
      try {
        const decoded = await verifyTokenWithBlacklist(refreshToken);
        
        // 验证令牌类型
        if (decoded.type !== 'refresh') {
          return this.sendError(res, '无效的刷新令牌类型', 401);
        }
        
        logger.info('[AuthController] 刷新令牌验证通过', { userId: decoded.userId });
      } catch (tokenError) {
        logger.warn('[AuthController] 刷新令牌验证失败', { error: tokenError.message });
        
        if (tokenError.message === '令牌已被撤销') {
          return this.sendError(res, '刷新令牌已被撤销', 401);
        } else if (tokenError.name === 'TokenExpiredError') {
          return this.sendError(res, '刷新令牌已过期', 401);
        } else {
          return this.sendError(res, '无效的刷新令牌', 401);
        }
      }

      // 调用服务层安全刷新令牌
      const result = await this.userService.refreshSecureToken(refreshToken, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // 记录安全令牌刷新成功
      logger.auth('安全令牌刷新成功', { userId: result.data.userId });

      return this.sendSuccess(res, {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        expiresIn: result.data.expiresIn,
        refreshExpiresIn: result.data.refreshExpiresIn
      }, '令牌刷新成功');
    } catch (error) {
      logger.error('[AuthController] 安全刷新令牌失败', { error: error.message });
      
      // 根据错误类型返回合适的状态码
      const errorMessage = error.message;
      if (errorMessage.includes('无效的刷新令牌') || 
          errorMessage.includes('会话已过期') ||
          errorMessage.includes('用户不存在') ||
          // 处理可能的编码问题
          errorMessage.includes('鏃犳晥鐨勫埛鏂颁护鐗?') ||
          errorMessage.includes('浼氳瘽宸茶繃鏈?')) {
        return this.sendError(res, errorMessage, 401);
      }
      
      return this.sendError(res, '服务器内部错误', 500);
    }
  }

  /**
   * 用户登出
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      // 记录登出尝试
      logger.audit(req, '用户登出', { 
        userId: req.user.id,
        timestamp: new Date().toISOString()
      });

      // 获取请求参数
      const { sessionToken } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      // 验证必填字段
      if (!sessionToken) {
        return this.sendError(res, '会话令牌不能为空', 400);
      }

      // 调用服务层登出（更新会话状态并记录审计日志）
      const result = await this.userService.logout(userId, sessionToken, ipAddress, userAgent);
      
      if (!result.success) {
        return this.sendError(res, result.message || '登出失败', 400);
      }

      logger.auth('用户登出成功', { userId, sessionToken });

      return this.sendSuccess(res, {
        sessionToken: sessionToken,
        status: 'revoked'
      }, '登出成功');

    } catch (error) {
      logger.error('[AuthController] 登出失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 检查用户名是否可用
   * GET /api/auth/check-username/:username
   */
  async checkUsername(req, res) {
    try {
      const { username } = req.params;
      
      // 验证输入
      if (!username || username.trim().length === 0) {
        return this.sendError(res, '用户名不能为空', 400);
      }

      const isAvailable = await this.userService.checkUsernameAvailability(username.trim());
      
      return this.sendSuccess(res, {
        username,
        available: isAvailable
      });

    } catch (error) {
      logger.error('[AuthController] 检查用户名失败', { error: error.message });
      return this.sendError(res, error.message, 500);
    }
  }

  /**
   * 检查邮箱是否可用
   * GET /api/auth/check-email/:email
   */
  async checkEmail(req, res) {
    try {
      const { email } = req.params;
      
      // 验证输入
      if (!email || email.trim().length === 0) {
        return this.sendError(res, '邮箱不能为空', 400);
      }

      const isAvailable = await this.userService.checkEmailAvailability(email.trim());
      
      return this.sendSuccess(res, {
        email,
        available: isAvailable
      });

    } catch (error) {
      logger.error('[AuthController] 检查邮箱失败', { error: error.message });
      return this.sendError(res, error.message, 500);
    }
  }

  /**
   * 获取用户账户状态
   * GET /api/auth/account-status
   */
  async getAccountStatus(req, res, next) {
    try {
      const userId = req.user.id;
      
      const status = await this.userService.getAccountStatus(userId);
      
      return this.sendSuccess(res, {
        status: {
          isLocked: status.isLocked,
          lockUntil: status.lockUntil,
          loginAttempts: status.loginAttempts,
          lastLoginAt: status.lastLoginAt
        }
      });

    } catch (error) {
      logger.error('[AuthController] 获取账户状态失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 发送邮箱验证码
   * POST /api/auth/send-email-code
   */
  async sendEmailVerificationCode(req, res, next) {
    try {
      const { email } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['email']);

      // 记录发送验证码请求
      logger.audit(req, '发送邮箱验证码', { 
        email,
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.sendEmailVerificationCode(email);
      
      // 为安全考虑，即使失败也返回成功
      if (!result.success) {
        return this.sendSuccess(res, null, result.message);
      }

      logger.auth('邮箱验证码发送成功', { email });

      return this.sendSuccess(res, result.data, result.message);

    } catch (error) {
      logger.error('[AuthController] 发送邮箱验证码失败', { 
        error: error.message,
        email: req.body?.email 
      });
      next(error);
    }
  }

  /**
   * 验证邮箱
   * POST /api/auth/verify-email
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['token']);

      // 记录邮箱验证尝试
      logger.audit(req, '邮箱验证尝试', {
        token: token.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.verifyEmail(token);
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.auth('邮箱验证成功', { token: token.substring(0, 8) + '...' });

      return this.sendSuccess(res, null, result.message);

    } catch (error) {
      logger.error('[AuthController] 邮箱验证失败', { 
        error: error.message,
        token: req.body?.token?.substring(0, 8) + '...' 
      });
      next(error);
    }
  }

  /**
   * 验证邮箱验证码
   * POST /api/auth/verify-email-code
   */
  async verifyEmailCode(req, res, next) {
    try {
      const { email, code } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['email', 'code']);

      // 记录邮箱验证码验证尝试
      logger.audit(req, '邮箱验证码验证尝试', {
        email: email.substring(0, 3) + '***' + email.substring(email.length - 3),
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.verifyEmailCode(email, code);
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.auth('邮箱验证码验证成功', { 
        email: email.substring(0, 3) + '***' + email.substring(email.length - 3)
      });

      return this.sendSuccess(res, {
        email: email,
        verified: true
      }, result.message);

    } catch (error) {
      logger.error('[AuthController] 邮箱验证码验证失败', { 
        error: error.message,
        email: req.body?.email ? req.body.email.substring(0, 3) + '***' + req.body.email.substring(req.body.email.length - 3) : undefined
      });
      next(error);
    }
  }

  /**
   * 更新QQ号码
   * PUT /api/auth/qq-number
   */
  async updateQQNumber(req, res, next) {
    try {
      const userId = req.user.id;
      const { qqNumber } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['qqNumber']);

      // 记录QQ号码更新
      logger.audit(req, 'QQ号码更新', { 
        userId,
        qqNumber,
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.updateQQNumber(userId, qqNumber);
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.auth('QQ号码更新成功', { userId, qqNumber });

      return this.sendSuccess(res, result.data, result.message);

    } catch (error) {
      logger.error('[AuthController] 更新QQ号码失败', { 
        error: error.message,
        userId: req.user?.id 
      });
      next(error);
    }
  }

  /**
   * 验证QQ号
   * POST /api/auth/verify-qq
   */
  async verifyQQ(req, res, next) {
    try {
      const userId = req.user.id;
      const { verificationCode } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['verificationCode']);

      // 记录QQ验证尝试
      logger.audit(req, 'QQ验证尝试', { 
        userId,
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.verifyQQ(userId, verificationCode);
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.auth('QQ验证成功', { userId });

      return this.sendSuccess(res, null, result.message);

    } catch (error) {
      logger.error('[AuthController] QQ验证失败', { 
        error: error.message,
        userId: req.user?.id 
      });
      next(error);
    }
  }

  /**
   * 请求密码重置
   * POST /api/auth/request-password-reset
   */
  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['email']);

      // 记录密码重置请求
      logger.audit(req, '密码重置请求', { 
        email,
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.requestPasswordReset(email);
      
      // 为安全考虑，即使失败也返回成功
      if (!result.success) {
        return this.sendSuccess(res, null, result.message);
      }

      logger.auth('密码重置邮件发送', { email });

      return this.sendSuccess(res, result.data, result.message);

    } catch (error) {
      logger.error('[AuthController] 请求密码重置失败', { 
        error: error.message,
        email: req.body?.email 
      });
      // 为安全考虑，返回成功
      return this.sendSuccess(res, null, '如果该邮箱地址已注册，您将收到密码重置邮件');
    }
  }

  /**
   * 请求密码重置验证码
   * POST /api/auth/request-password-reset-code
   */
  async requestPasswordResetCode(req, res, next) {
    try {
      const { email } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['email']);

      // 记录密码重置验证码请求
      logger.audit(req, '请求密码重置验证码', { 
        email,
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.sendPasswordResetCode(email);
      
      // 为安全考虑，即使失败也返回成功
      if (!result.success) {
        return this.sendSuccess(res, null, result.message);
      }

      logger.auth('密码重置验证码发送', { email });

      return this.sendSuccess(res, result.data, result.message);

    } catch (error) {
      logger.error('[AuthController] 请求密码重置验证码失败', { 
        error: error.message,
        email: req.body?.email 
      });
      // 为安全考虑，返回成功
      return this.sendSuccess(res, null, '如果该邮箱地址已注册，您将收到密码重置验证码');
    }
  }

  /**
   * 重置密码
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['token', 'newPassword']);

      // 记录密码重置尝试
      logger.audit(req, '密码重置尝试', {
        token: token.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.resetPassword(token, newPassword);
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.auth('密码重置成功', { token: token.substring(0, 8) + '...' });

      return this.sendSuccess(res, null, result.message);

    } catch (error) {
      logger.error('[AuthController] 密码重置失败', { 
        error: error.message,
        token: req.body?.token?.substring(0, 8) + '...' 
      });
      next(error);
    }
  }

  /**
   * 验证密码重置验证码并重置密码
   * POST /api/auth/reset-password-with-code
   */
  async resetPasswordWithCode(req, res, next) {
    try {
      const { email, code, newPassword } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['email', 'code', 'newPassword']);

      // 记录密码重置尝试
      logger.audit(req, '使用验证码重置密码尝试', {
        email,
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.resetPasswordWithCode(email, code, newPassword);
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.auth('使用验证码密码重置成功', { email });

      return this.sendSuccess(res, null, result.message);

    } catch (error) {
      logger.error('[AuthController] 使用验证码重置密码失败', { 
        error: error.message,
        email: req.body?.email 
      });
      next(error);
    }
  }

  /**
   * 停用账户
   * POST /api/auth/deactivate
   */
  async deactivateAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { reason } = req.body;
      
      // 记录账户停用
      logger.audit(req, '账户停用请求', { 
        userId,
        reason,
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.deactivateAccount(userId, reason);
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.auth('账户停用成功', { userId, reason });

      return this.sendSuccess(res, null, result.message);

    } catch (error) {
      logger.error('[AuthController] 停用账户失败', { 
        error: error.message,
        userId: req.user?.id 
      });
      next(error);
    }
  }

  /**
   * 删除账户
   * DELETE /api/auth/account
   */
  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { password } = req.body;
      
      // 验证输入
      this.validateRequiredFields(req.body, ['password']);

      // 记录账户删除
      logger.audit(req, '账户删除请求', { 
        userId,
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.deleteAccount(userId, password);
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.auth('账户删除成功', { userId });

      return this.sendSuccess(res, null, result.message);

    } catch (error) {
      logger.error('[AuthController] 删除账户失败', { 
        error: error.message,
        userId: req.user?.id 
      });
      next(error);
    }
  }

  /**
   * 两步验证
   * POST /api/auth/two-factor/verify
   */
  async verifyTwoFactorCode(req, res, next) {
    try {
      const { userId, code, codeType } = req.body;
      
      // 记录两步验证尝试
      logger.audit(req, '两步验证尝试', { 
        userId,
        codeType,
        timestamp: new Date().toISOString()
      });

      // 验证输入
      this.validateRequiredFields(req.body, ['userId', 'code', 'codeType']);

      // 调用服务层进行两步验证
      const verificationResult = await this.userService.verifyTwoFactorCode({ 
        userId,
        code,
        codeType,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      if (!verificationResult.success) {
        // 验证失败，记录安全日志
        logger.auth('两步验证失败', { userId, reason: verificationResult.message });
        logger.security(req, '两步验证尝试失败', { 
          userId,
          reason: verificationResult.message
        });
        
        return this.sendError(res, verificationResult.message, 401);
      }

      const { user, tokens, session } = verificationResult.data;

      logger.auth('两步验证成功', { userId });
      logger.audit(req, '用户两步验证成功', { 
        userId,
        timestamp: new Date().toISOString()
      });

      // 返回成功响应（包含双令牌和会话信息）
      return this.sendSuccess(res, {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          phone: user.phone,
          avatar_url: user.avatar_url,
          status: user.status,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          last_login_at: user.last_login_at,
          created_at: user.created_at
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshExpiresIn: tokens.refreshExpiresIn
        },
        session: session ? {
          sessionId: session.id,
          sessionToken: session.session_token,
          deviceInfo: session.device_info,
          expiresAt: session.expires_at
        } : null
      }, '两步验证成功');

    } catch (error) {
      logger.error('[AuthController] 两步验证失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 启用两步验证
   * POST /api/auth/two-factor/enable
   */
  async enableTwoFactor(req, res, next) {
    try {
      const userId = req.user.id;
      const { code, codeType } = req.body;
      
      // 记录启用两步验证尝试
      logger.audit(req, '启用两步验证尝试', {
        userId,
        codeType,
        timestamp: new Date().toISOString()
      });

      // 验证输入
      this.validateRequiredFields(req.body, ['code', 'codeType']);

      // 调用服务层启用两步验证
      const result = await this.userService.enableTwoFactor(userId, {
        code,
        codeType
      });
      
      if (!result.success) {
        logger.audit(req, '启用两步验证失败', {
          userId,
          error: result.message,
          timestamp: new Date().toISOString()
        });
        return this.sendError(res, result.message, 400);
      }

      // 记录启用成功审计日志
      logger.audit(req, '启用两步验证成功', {
        userId,
        timestamp: new Date().toISOString()
      });

      return this.sendSuccess(res, result.data, '两步验证已启用');

    } catch (error) {
      // 记录启用失败审计日志
      logger.audit(req, '启用两步验证失败', {
        userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      logger.error('启用两步验证失败', { error: error.message, stack: error.stack });
      return next(error);
    }
  }

  /**
   * 禁用两步验证
   * POST /api/auth/two-factor/disable
   */
  async disableTwoFactor(req, res, next) {
    try {
      const userId = req.user.id;
      
      // 记录禁用两步验证尝试
      logger.audit(req, '禁用两步验证尝试', {
        userId,
        timestamp: new Date().toISOString()
      });

      // 调用服务层禁用两步验证
      const result = await this.userService.disableTwoFactor(userId);
      
      if (!result.success) {
        logger.audit(req, '禁用两步验证失败', {
          userId,
          error: result.message,
          timestamp: new Date().toISOString()
        });
        return this.sendError(res, result.message, 400);
      }

      // 记录禁用成功审计日志
      logger.audit(req, '禁用两步验证成功', {
        userId,
        timestamp: new Date().toISOString()
      });

      return this.sendSuccess(res, result.data, '两步验证已禁用');

    } catch (error) {
      // 记录禁用失败审计日志
      logger.audit(req, '禁用两步验证失败', {
        userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      logger.error('禁用两步验证失败', { error: error.message, stack: error.stack });
      return next(error);
    }
  }

  /**
   * 获取两步验证状态
   * GET /api/auth/two-factor/status
   */
  async getTwoFactorStatus(req, res, next) {
    try {
      const userId = req.user.id;
      
      // 记录获取两步验证状态尝试
      logger.audit(req, '获取两步验证状态', { 
        userId,
        timestamp: new Date().toISOString()
      });

      // 调用服务层获取两步验证状态
      const result = await this.userService.getTwoFactorStatus(userId);
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.audit(req, '获取两步验证状态成功', { 
        userId,
        timestamp: new Date().toISOString()
      });

      return this.sendSuccess(res, result.data, '获取两步验证状态成功');

    } catch (error) {
      logger.error('[AuthController] 获取两步验证状态失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 生成两步验证码
   * POST /api/auth/two-factor/generate
   */
  async generateTwoFactorCode(req, res, next) {
    try {
      const userId = req.user.id;
      const { codeType, target, channel } = req.body;
      
      // 记录生成两步验证码尝试
      logger.audit(req, '生成两步验证码', { 
        userId,
        codeType,
        target,
        channel,
        timestamp: new Date().toISOString()
      });

      // 验证输入
      this.validateRequiredFields(req.body, ['codeType']);

      // 调用服务层生成两步验证码
      const result = await this.userService.generateTwoFactorCode(userId, codeType, {
        target,
        channel,
        ip: req.ip
      });
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.audit(req, '生成两步验证码成功', { 
        userId,
        codeType,
        timestamp: new Date().toISOString()
      });

      // 不返回实际的验证码，只返回相关信息
      return this.sendSuccess(res, {
        codeId: result.data.codeId,
        codeType: result.data.codeType,
        channel: result.data.channel,
        target: result.data.target,
        expiresAt: result.data.expiresAt
      }, '验证码已生成并发送');

    } catch (error) {
      logger.error('[AuthController] 生成两步验证码失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 短信登录
   * POST /api/auth/sms-login
   */
  async smsLogin(req, res, next) {
    try {
      const { phone, code } = req.body;
      
      // 记录短信登录尝试
      logger.audit(req, '短信登录尝试', { 
        phone,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      // 验证输入
      this.validateRequiredFields(req.body, ['phone', 'code']);

      // 调用服务层进行短信登录验证
      const loginResult = await this.userService.smsLogin({ 
        phone,
        code,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      if (!loginResult.success) {
        // 登录失败，记录安全日志
        logger.auth('短信登录失败', { phone, reason: loginResult.message });
        logger.security(req, '短信登录尝试失败', { 
          phone,
          reason: loginResult.message
        });
        
        // 根据失败原因返回不同的状态码
        const statusCode = loginResult.message.includes('锁定') ? 423 : 401;
        return this.sendError(res, loginResult.message, statusCode);
      }

      const { user, tokens, session } = loginResult.data;

      logger.auth('短信登录成功', { phone, userId: user.id });
      logger.audit(req, '用户短信登录成功', { 
        phone,
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      // 返回成功响应（包含双令牌和会话信息）
      return this.sendSuccess(res, {
        user: user,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshExpiresIn: tokens.refreshExpiresIn
        },
        session: session ? {
          sessionId: session.id,
          sessionToken: session.session_token,
          deviceInfo: session.device_info,
          expiresAt: session.expires_at
        } : null
      }, '登录成功');

    } catch (error) {
      logger.error('[AuthController] 短信登录失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 验证访问令牌有效性
   * POST /api/auth/validate-token
   */
  async validateToken(req, res, next) {
    try {
      const { sessionToken } = req.body;
      
      // 记录令牌验证尝试
      logger.audit(req, '令牌验证尝试', { 
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      // 验证输入
      if (!sessionToken) {
        return this.sendError(res, '访问令牌为必填项', 400);
      }

      // 调用服务层进行令牌验证
      const validationResult = await this.userService.validateToken({ 
        sessionToken
      });
      
      if (!validationResult.success) {
        // 验证失败，记录安全日志
        logger.auth('令牌验证失败', { reason: validationResult.message });
        logger.security(req, '令牌验证尝试失败', { 
          reason: validationResult.message
        });
        
        // 根据失败原因返回不同的状态码
        const statusCode = validationResult.message.includes('过期') ? 401 : 401;
        return this.sendError(res, validationResult.message, statusCode);
      }

      const { user, session } = validationResult.data;

      logger.auth('令牌验证成功', { userId: user.id });
      logger.audit(req, '令牌验证成功', { 
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      // 返回成功响应（包含用户信息和会话状态）
      return this.sendSuccess(res, {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          status: user.status,
          twoFactorEnabled: user.two_factor_enabled,
          lockedUntil: user.locked_until
        },
        session: session ? {
          sessionId: session.id,
          status: session.status,
          expiresAt: session.expires_at,
          lastAccessedAt: session.last_accessed_at
        } : null
      }, '令牌验证成功');

    } catch (error) {
      logger.error('[AuthController] 令牌验证失败', { error: error.message });
      next(error);
    }
  }
}

module.exports = AuthController;
