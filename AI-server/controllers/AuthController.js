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
      const { username, email, password } = req.body;
      
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
        password
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
  async getProfile(req, res, next) {
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
      next(error);
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
      next(error);
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
   * 发送邮箱验证邮件
   * POST /api/auth/send-email-verification
   */
  async sendEmailVerification(req, res, next) {
    try {
      const userId = req.user.id;
      
      // 记录邮箱验证请求
      logger.audit(req, '发送邮箱验证邮件', { 
        userId,
        timestamp: new Date().toISOString()
      });

      const result = await this.userService.sendEmailVerification(userId);
      
      if (!result.success) {
        return this.sendError(res, result.message, 400);
      }

      logger.auth('邮箱验证邮件发送成功', { userId });

      return this.sendSuccess(res, result.data, result.message);

    } catch (error) {
      logger.error('[AuthController] 发送邮箱验证邮件失败', { 
        error: error.message,
        userId: req.user?.id 
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
}

module.exports = AuthController;
