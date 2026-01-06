/**
 * 管理员认证控制器
 * 处理管理员登录、认证相关的业务逻辑
 */

const BaseController = require('./BaseController');
const UserService = require('../services/UserService');
const AdminAuthService = require('../services/AdminAuthService');
const logger = require('../config/logger');
const { generateTokenPair, refreshAccessToken, revokeTokenPair } = require('../config/jwtManager');
const { logSecurityEvent, SECURITY_EVENTS } = require('../middleware/securityAudit');
const { successResponse, errorResponse } = require('../middleware/response');

class AdminAuthController extends BaseController {
  constructor() {
    super();
    this.userService = new UserService();
    this.adminAuthService = new AdminAuthService();
    
    // 确保方法正确绑定到类实例
    this.adminLogin = this.adminLogin.bind(this);
    this.adminLogout = this.adminLogout.bind(this);
    this.getAdminProfile = this.getAdminProfile.bind(this);
    this.refreshAdminToken = this.refreshAdminToken.bind(this);
    this.heartbeat = this.heartbeat.bind(this);
    this.verifyTwoFactor = this.verifyTwoFactor.bind(this);
    this.verifyPassword = this.verifyPassword.bind(this);
  }

  /**
   * 管理员心跳
   * POST /api/admin/heartbeat
   */
  async heartbeat(req, res, next) {
    try {
      const userId = req.user?.id;
      const username = req.user?.username;
      
      // 从请求头中提取令牌
      const authHeader = req.headers.authorization || req.headers.Authorization;
      const sessionToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

      // 从请求体中提取交互和指标数据
      const { interactionCount, deviceFingerprint, metrics, behaviorData } = req.body;

      if (userId && sessionToken) {
        // 更新会话心跳
        const success = await this.userService.updateHeartbeat(userId, sessionToken, {
          clientType: 'admin',
          interactionCount,
          deviceFingerprint,
          metrics,
          behaviorData
        });

        logger.debug('[AdminAuthController] 管理员心跳', {
          userId,
          username,
          sessionUpdated: success,
          interactionCount,
          timestamp: new Date().toISOString()
        });

        return successResponse(res, {
          timestamp: new Date().toISOString(),
          status: 'active',
          authenticated: true,
          user: {
            id: userId,
            username: username
          }
        }, '心跳正常');
      }

      return successResponse(res, {
        timestamp: new Date().toISOString(),
        status: 'active',
        authenticated: false
      }, '心跳正常');
    } catch (error) {
      logger.error('[AdminAuthController] 管理员心跳失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 管理员登录
   * POST /api/admin/login
   */
  async adminLogin(req, res, next) {
    try {
      logger.info('收到管理员登录请求', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        identifier: req.body.username || req.body.email
      });
      
      const { username, email, password } = req.body;
      const loginIdentifier = username || email;
      
      // 记录管理员登录尝试
      logger.audit(req, '管理员登录尝试', { 
        identifier: loginIdentifier,
        timestamp: new Date().toISOString(),
        loginType: 'admin'
      });

      logger.debug('开始验证输入字段');
      // 验证输入
      if (!loginIdentifier) {
        throw new Error('缺少必需字段: username 或 email');
      }
      if (!password) {
        throw new Error('缺少必需字段: password');
      }

      logger.debug('输入验证通过');

      logger.debug('调用AdminAuthService进行登录验证');
      if (!this.adminAuthService) {
        logger.error('[AdminAuthController] adminAuthService 未初始化');
        return errorResponse(res, '登录服务未就绪', 500);
      }

      const loginResult = await this.adminAuthService.login(
        loginIdentifier,
        password,
        req.ip,
        req.get('User-Agent')
      );
      
      if (!loginResult) {
        logger.error('[AdminAuthController] AdminAuthService.login 返回了 undefined');
        return errorResponse(res, '登录服务响应异常', 500);
      }
      
      logger.debug('AdminAuthService返回结果', { 
        success: loginResult.success, 
        message: loginResult.message,
        hasData: !!loginResult.data 
      });

      if (!loginResult.success) {
        logger.warn('登录失败', { message: loginResult.message });
        // 登录失败，记录安全日志
        logger.auth('管理员登录失败', { username, reason: loginResult.message });
        logger.security(req, '管理员登录尝试失败', { 
          username,
          reason: loginResult.message,
          loginType: 'admin'
        });
        
        // 记录安全审计事件
        logSecurityEvent({
          type: SECURITY_EVENTS.LOGIN_FAILURE,
          userId: null,
          sourceIp: req.ip,
          userAgent: req.get('User-Agent'),
          resource: '/api/admin/login',
          action: 'admin_login',
          outcome: 'failure',
          severity: 'medium',
          data: { username, reason: loginResult.message, loginType: 'admin' }
        });
        
        // 根据失败原因返回不同的状态码
        const statusCode = loginResult.message.includes('锁定') ? 423 : 
                          loginResult.message.includes('权限') ? 403 : 401;
        return errorResponse(res, loginResult.message, statusCode);
      }

      // 检查是否需要双因素认证
      if (loginResult.data && loginResult.data.requireTwoFactor) {
        logger.info('[AdminAuthController] 管理员登录需要两步验证', { 
          userId: loginResult.data.userId,
          username: loginResult.data.username 
        });
        return successResponse(res, loginResult.data, loginResult.message);
      }

      // AdminAuthService返回的结构与UserService不同，需要适配
      if (!loginResult.data) {
        logger.error('[AdminAuthController] 登录成功但未返回数据', { loginResult });
        return errorResponse(res, '登录响应数据异常', 500);
      }
      
      const { user, accessToken, refreshToken, expiresIn, tokenType } = loginResult.data;

      // 创建用户会话(确保刷新令牌持久化到数据库，支持后续刷新)
      try {
        await this.userService.createUserSession(user.id, req.ip, req.get('User-Agent'), {
          accessToken,
          refreshToken,
          clientType: 'admin'
        });
        logger.info('[AdminAuthController] 管理员会话创建成功', { userId: user.id });
      } catch (sessionError) {
        logger.error('[AdminAuthController] 管理员会话创建失败', { 
          error: sessionError.message,
          userId: user.id 
        });
        // 会话创建失败不应中断登录流程，但会记录日志
      }

      logger.debug('登录成功，准备返回响应');
      logger.auth('管理员登录成功', { username: user.username, userId: user.id, role: user.role });
      logger.audit(req, '管理员登录成功', { 
        username: user.username,
        userId: user.id,
        role: user.role,
        timestamp: new Date().toISOString()
      });

      // 记录安全审计事件
      logSecurityEvent({
        type: SECURITY_EVENTS.LOGIN_SUCCESS,
        userId: user.id,
        sourceIp: req.ip,
        userAgent: req.get('User-Agent'),
        resource: '/api/admin/login',
        action: 'admin_login',
        outcome: 'success',
        severity: 'low',
        data: { username: user.username, role: user.role, loginType: 'admin' }
      });

      // 返回成功响应（包含双令牌和管理员信息）
      return successResponse(res, {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions || [],
          isAdmin: true,
          adminLevel: user.adminLevel || 'admin'
        },
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken,
          expiresIn: expiresIn,
          refreshExpiresIn: loginResult.data.refreshExpiresIn || 604800, // 默认7天
          tokenType: tokenType || 'Bearer'
        }
      }, '管理员登录成功');

    } catch (error) {
      logger.error('[AdminAuthController] 发生异常', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * 验证双因素认证码
   * POST /api/admin/verify-2fa
   */
  async verifyTwoFactor(req, res, next) {
    try {
      const { userId, code } = req.body;
      
      if (!userId || !code) {
        return errorResponse(res, '用户ID和验证码不能为空', 400);
      }

      const result = await this.adminAuthService.verifyTwoFactor(
        userId,
        code,
        req.ip,
        req.get('User-Agent')
      );

      if (!result) {
        logger.error('[AdminAuthController] verifyTwoFactor 返回了 undefined');
        return errorResponse(res, '验证服务异常', 500);
      }

      if (result.success) {
        // 记录成功的安全事件
        logger.audit(req, '管理员2FA验证成功', { userId });
        return successResponse(res, result.data, result.message);
      } else {
        // 记录失败的安全事件
        logger.warn('管理员2FA验证失败', { userId, reason: result.message });
        return errorResponse(res, result.message, 401);
      }
    } catch (error) {
      logger.error('[AdminAuthController] 2FA验证异常', { error: error.message });
      next(error);
    }
  }

  /**
   * 管理员登出
   * POST /api/admin/logout
   */
  async adminLogout(req, res, next) {
    try {
      const userId = req.user.id;
      const refreshToken = req.body.refreshToken;

      // 记录管理员登出
      logger.audit(req, '管理员登出', { 
        userId,
        timestamp: new Date().toISOString()
      });

      // 记录安全审计事件
      logSecurityEvent({
        type: SECURITY_EVENTS.LOGOUT,
        userId: userId,
        sourceIp: req.ip,
        userAgent: req.get('User-Agent'),
        resource: '/api/admin/logout',
        action: 'admin_logout',
        outcome: 'success',
        severity: 'low',
        data: { loginType: 'admin' }
      });

      // 撤销令牌
      const accessToken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
      if (refreshToken || accessToken) {
        await revokeTokenPair(accessToken, refreshToken, 'admin_logout');
      }

      logger.auth('管理员登出成功', { userId });

      return successResponse(res, null, '管理员登出成功');

    } catch (error) {
      logger.error('[AdminAuthController] 管理员登出失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 验证管理员密码 (用于敏感操作二次确认)
   * POST /api/admin/verify-password
   */
  async verifyPassword(req, res, next) {
    try {
      const { password } = req.body;
      // 兼容多种用户信息存储方式，优先使用 req.user.id，其次是 req.user.userId
      const userId = req.user?.id || req.user?.userId;

      if (!userId) {
        logger.warn('[AdminAuthController] 密码验证失败: 未获取到用户ID', { 
          user: req.user ? 'exists' : 'missing' 
        });
        return errorResponse(res, '用户未登录', 401);
      }

      if (!password) {
        return errorResponse(res, '请输入密码', 400);
      }

      const result = await this.adminAuthService.verifyPassword(userId, password);

      if (result.success) {
        logger.audit(req, '管理员敏感操作密码验证成功', { userId });
        return successResponse(res, null, '验证成功');
      } else {
        logger.warn('管理员敏感操作密码验证失败', { userId, reason: result.message });
        return errorResponse(res, result.message, 401);
      }
    } catch (error) {
      logger.error('[AdminAuthController] 密码验证异常', { 
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取管理员资料
   * GET /api/admin/profile
   */
  async getAdminProfile(req, res, next) {
    try {
      const userId = req.user.id;

      // 获取管理员详细信息
      const adminProfile = await this.userService.getAdminProfile(userId);
      
      if (!adminProfile) {
        return errorResponse(res, '管理员信息不存在', 404);
      }

      logger.info('[AdminAuthController] 获取管理员资料成功', { userId });

      return successResponse(res, {
        user: adminProfile
      });

    } catch (error) {
      logger.error('[AdminAuthController] 获取管理员资料失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 刷新管理员令牌
   * POST /api/admin/refresh-token
   */
  async refreshAdminToken(req, res, next) {
    const { refreshToken } = req.body;
    const ip = req.ip;
    const ua = req.get('User-Agent') || 'unknown';

    try {
      logger.info('收到令牌刷新请求', { ip, ua: ua.substring(0, 30) });
      
      if (!refreshToken) {
        logger.warn('刷新令牌为空');
        return errorResponse(res, '刷新令牌不能为空', 400);
      }

      // 使用UserService的refreshSecureToken方法处理安全令牌刷新
      const result = await this.userService.refreshSecureToken(refreshToken, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (!result) {
        logger.error('[AdminAuthController] refreshSecureToken 返回了 undefined');
        return errorResponse(res, '令牌刷新服务异常', 500);
      }

      if (!result.success) {
        return errorResponse(res, result.message || '令牌刷新失败', 401);
      }

      logger.info('[AdminAuthController] 管理员令牌刷新成功', { userId: result.data.userId });

      return successResponse(res, {
        tokens: {
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          expiresIn: result.data.expiresIn
        }
      }, '令牌刷新成功');

    } catch (error) {
      logger.error('[AdminAuthController] 管理员令牌刷新失败', { error: error.message });
      
      // 根据错误类型返回适当的HTTP状态码
      if (error.message.includes('无效的刷新令牌') || error.message.includes('会话已过期')) {
        return errorResponse(res, error.message, 401);
      } else if (error.code === 'CONCURRENT_REFRESH') {
        return errorResponse(res, error.message, 409);
      }
      
      next(error);
    }
  }
}

module.exports = AdminAuthController;