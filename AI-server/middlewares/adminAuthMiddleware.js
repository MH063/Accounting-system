/**
 * 管理员权限认证中间件
 * 用于验证管理员身份和权限
 */

const tokenService = require('../services/TokenService');
const logger = require('../config/logger');

/**
 * 管理员认证中间件 - 验证管理员身份
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取令牌
    const token = tokenService.extractTokenFromHeader(req);
    
    if (!token) {
      logger.security(req, '管理员认证失败', { 
        reason: '缺少认证令牌',
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({
        success: false,
        message: '缺少认证令牌',
        code: tokenService.errorCodes.NO_TOKEN
      });
    }

    // 验证令牌
    const result = await tokenService.verifyAccessToken(token);
    
    if (!result.success) {
      logger.security(req, '管理员认证失败', { 
        reason: result.message,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({
        success: false,
        message: result.message,
        code: result.code
      });
    }

    const decoded = result.data;
    // 验证用户是否为管理员
    if (!decoded.role || !decoded.role.includes('admin')) {
      logger.security(req, '管理员认证失败', { 
        reason: '用户不是管理员',
        userId: decoded.userId,
        role: decoded.role,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限',
        code: 'NOT_ADMIN'
      });
    }

    // 验证用户状态
    if (decoded.status !== 'active') {
      logger.security(req, '管理员认证失败', { 
        reason: '账户状态异常',
        userId: decoded.userId,
        status: decoded.status,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: '账户已被禁用或状态异常',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 将解码后的用户信息保存到请求对象中
    req.admin = decoded;
    req.user = decoded; // 兼容普通用户认证逻辑

    next();
  } catch (error) {
    logger.error('管理员认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器认证过程出错',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

/**
 * 超级管理员权限中间件 - 仅超级管理员可访问
 */
const superAdminAuthMiddleware = async (req, res, next) => {
  try {
    // 首先通过管理员认证
    await new Promise((resolve, reject) => {
      adminAuthMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 验证是否为系统管理员
    if (req.user.adminLevel !== 'system_admin') {
      logger.security(req, '系统管理员权限验证失败', { 
        reason: '用户不是系统管理员',
        userId: req.user.id,
        adminLevel: req.user.adminLevel,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({
        success: false,
        message: '需要系统管理员权限',
        code: 'NOT_SYSTEM_ADMIN'
      });
    }

    logger.info('[SystemAdminAuthMiddleware] 系统管理员权限验证成功', { 
      userId: req.user.id,
      username: req.user.username
    });

    next();

  } catch (error) {
    logger.error('[SystemAdminAuthMiddleware] 系统管理员权限验证处理失败', { 
      error: error.message
    });
    return res.status(403).json({
      success: false,
      message: '权限验证失败',
      code: 'PERMISSION_DENIED'
    });
  }
};

/**
 * 权限检查中间件 - 检查具体权限
 */
const permissionMiddleware = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // 首先通过管理员认证
      await new Promise((resolve, reject) => {
        adminAuthMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // 检查是否有指定权限
      const userPermissions = req.user.permissions || [];
      const hasPermission = userPermissions.includes(requiredPermission) || 
                           userPermissions.includes('all') || // 拥有所有权限
                           req.user.adminLevel === 'system_admin'; // 系统管理员拥有所有权限

      if (!hasPermission) {
        logger.security(req, '权限检查失败', { 
          reason: '缺少必要权限',
          userId: req.user.id,
          requiredPermission,
          userPermissions,
          timestamp: new Date().toISOString()
        });
        return res.status(403).json({
          success: false,
          message: `缺少权限: ${requiredPermission}`,
          code: 'PERMISSION_DENIED',
          requiredPermission
        });
      }

      logger.info('[PermissionMiddleware] 权限检查通过', { 
        userId: req.user.id,
        requiredPermission
      });

      next();

    } catch (error) {
      logger.error('[PermissionMiddleware] 权限检查处理失败', { 
        error: error.message,
        requiredPermission
      });
      return res.status(403).json({
        success: false,
        message: '权限验证失败',
        code: 'PERMISSION_CHECK_FAILED'
      });
    }
  };
};

/**
 * 多权限检查中间件 - 检查多个权限中的任意一个
 */
const multiPermissionMiddleware = (requiredPermissions, requireAll = false) => {
  return async (req, res, next) => {
    try {
      // 首先通过管理员认证
      await new Promise((resolve, reject) => {
        adminAuthMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const userPermissions = req.user.permissions || [];
      
      // 系统管理员拥有所有权限
      if (req.user.adminLevel === 'system_admin') {
        logger.info('[MultiPermissionMiddleware] 系统管理员，权限检查通过', { 
          userId: req.user.id
        });
        return next();
      }

      let hasRequiredPermission = false;

      if (requireAll) {
        // 需要所有权限
        hasRequiredPermission = requiredPermissions.every(permission => 
          userPermissions.includes(permission) || userPermissions.includes('all')
        );
      } else {
        // 需要任意一个权限
        hasRequiredPermission = requiredPermissions.some(permission => 
          userPermissions.includes(permission) || userPermissions.includes('all')
        );
      }

      if (!hasRequiredPermission) {
        logger.security(req, '多权限检查失败', { 
          reason: '缺少必要权限',
          userId: req.user.id,
          requiredPermissions,
          userPermissions,
          requireAll,
          timestamp: new Date().toISOString()
        });
        return res.status(403).json({
          success: false,
          message: requireAll ? 
            `缺少权限，需要所有权限: ${requiredPermissions.join(', ')}` :
            `缺少权限，需要任意一个权限: ${requiredPermissions.join(', ')}`,
          code: 'PERMISSION_DENIED',
          requiredPermissions
        });
      }

      logger.info('[MultiPermissionMiddleware] 多权限检查通过', { 
        userId: req.user.id,
        requiredPermissions,
        requireAll
      });

      next();

    } catch (error) {
      logger.error('[MultiPermissionMiddleware] 多权限检查处理失败', { 
        error: error.message,
        requiredPermissions
      });
      return res.status(403).json({
        success: false,
        message: '权限验证失败',
        code: 'PERMISSION_CHECK_FAILED'
      });
    }
  };
};

module.exports = {
  adminAuthMiddleware,
  superAdminAuthMiddleware,
  permissionMiddleware,
  multiPermissionMiddleware
};