/**
 * 管理员认证控制器
 * 处理管理员登录、认证相关的业务逻辑
 */

const BaseController = require('./BaseController');
const UserService = require('../services/UserService');
const logger = require('../config/logger');
const { generateTokenPair, refreshAccessToken, revokeTokenPair } = require('../config/jwtManager');

class AdminAuthController extends BaseController {
  constructor() {
    super();
    this.userService = new UserService();
  }

  /**
   * 管理员登录
   * POST /api/admin/login
   */
  async adminLogin(req, res, next) {
    try {
      const { username, password } = req.body;
      
      // 记录管理员登录尝试
      logger.audit(req, '管理员登录尝试', { 
        username,
        timestamp: new Date().toISOString(),
        loginType: 'admin'
      });

      // 验证输入
      this.validateRequiredFields(req.body, ['username', 'password']);

      // 调用服务层进行管理员登录验证
      const loginResult = await this.userService.adminLogin({ username, password });
      
      if (!loginResult.success) {
        // 登录失败，记录安全日志
        logger.auth('管理员登录失败', { username, reason: loginResult.message });
        logger.security(req, '管理员登录尝试失败', { 
          username,
          reason: loginResult.message,
          loginType: 'admin'
        });
        
        // 根据失败原因返回不同的状态码
        const statusCode = loginResult.message.includes('锁定') ? 423 : 
                          loginResult.message.includes('权限') ? 403 : 401;
        return this.sendError(res, loginResult.message, statusCode);
      }

      const { user, tokens } = loginResult.data;

      logger.auth('管理员登录成功', { username, userId: user.id, role: user.role });
      logger.audit(req, '管理员登录成功', { 
        username,
        userId: user.id,
        role: user.role,
        timestamp: new Date().toISOString()
      });

      // 返回成功响应（包含双令牌和管理员信息）
      return this.sendSuccess(res, {
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
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshExpiresIn: tokens.refreshExpiresIn,
          tokenType: 'Bearer'
        }
      }, '管理员登录成功');

    } catch (error) {
      logger.error('[AdminAuthController] 管理员登录失败', { error: error.message });
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

      // 撤销令牌
      if (refreshToken) {
        await revokeTokenPair(userId, refreshToken);
      }

      logger.auth('管理员登出成功', { userId });

      return this.sendSuccess(res, null, '管理员登出成功');

    } catch (error) {
      logger.error('[AdminAuthController] 管理员登出失败', { error: error.message });
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
        return this.sendError(res, '管理员信息不存在', 404);
      }

      logger.info('[AdminAuthController] 获取管理员资料成功', { userId });

      return this.sendSuccess(res, {
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
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return this.sendError(res, '刷新令牌不能为空', 400);
      }

      // 刷新令牌
      const newTokens = await refreshAccessToken(refreshToken);

      if (!newTokens) {
        return this.sendError(res, '无效的刷新令牌', 401);
      }

      logger.info('[AdminAuthController] 管理员令牌刷新成功');

      return this.sendSuccess(res, {
        tokens: newTokens
      }, '令牌刷新成功');

    } catch (error) {
      logger.error('[AdminAuthController] 管理员令牌刷新失败', { error: error.message });
      next(error);
    }
  }
}

module.exports = AdminAuthController;