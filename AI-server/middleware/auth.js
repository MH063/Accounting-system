/**
 * JWT认证中间件
 * 用于验证用户请求中的JWT令牌，支持：
 * - 密钥轮换
 * - 双令牌机制 (access/refresh)
 * - 令牌黑名单检查
 */

const tokenService = require('../services/TokenService');
const UserService = require('../services/UserService');
const logger = require('../config/logger');

const userService = new UserService();

/**
 * 验证JWT令牌的中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const authenticateToken = async (req, res, next) => {
  // 从请求头获取令牌
  const token = tokenService.extractTokenFromHeader(req);
  
  // 如果没有令牌，返回401未授权
  if (!token) {
    logger.security(req, 'JWT认证失败', { 
      reason: '缺少认证令牌',
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({
      success: false,
      code: tokenService.errorCodes.NO_TOKEN,
      message: '访问令牌缺失，请先登录'
    });
  }
  
  const result = await tokenService.verifyAccessToken(token);
  
  if (result.success) {
    const user = result.data;
    req.user = user;
    req.tokenInfo = {
      type: user.type,
      jti: user.jti || user.jwtid,
      isRevoked: false
    };
    logger.security(req, 'JWT认证成功', { 
      userId: user.id,
      tokenType: user.type,
      timestamp: new Date().toISOString()
    });

    // 增加业务请求计数（排除心跳请求，避免重复计数）
    if (!req.originalUrl.includes('/auth/heartbeat')) {
      setImmediate(() => {
        userService.incrementBusinessRequest(user.id, token)
          .catch(err => logger.debug('[AuthMiddleware] 增加业务请求计数失败', { 
            userId: user.id,
            error: err.message 
          }));
      });
    }

    next();
  } else {
    logger.security(req, 'JWT认证失败', { 
      reason: result.message,
      errorCode: result.code,
      timestamp: new Date().toISOString()
    });
    
    return res.status(401).json({
      success: false,
      code: result.code,
      message: result.message
    });
  }
};

/**
 * 生成JWT令牌对（双令牌机制）
 * @param {Object} payload - 要编码到令牌中的数据
 * @param {Object} options - 令牌选项
 * @returns {Object} 包含accessToken和refreshToken的对象
 */
const createTokenPair = (payload, options = {}) => {
  try {
    const tokenPair = generateTokenPair(payload);
    
    logger.security(null, 'JWT令牌对生成成功', { 
      userId: payload.userId || payload.id,
      accessTokenExpiry: getTokenExpiry('access'),
      refreshTokenExpiry: getTokenExpiry('refresh'),
      timestamp: new Date().toISOString()
    });
    
    return tokenPair;
  } catch (err) {
    logger.error('JWT令牌对生成失败:', err);
    throw new Error('令牌生成失败');
  }
};

/**
 * 获取令牌过期时间
 * @param {string} tokenType - 令牌类型 ('access' 或 'refresh')
 * @returns {number} 过期时间（秒）
 */
const getTokenExpirationTime = (tokenType) => {
  return getTokenExpiry(tokenType);
};

/**
 * 验证令牌是否支持刷新
 * @param {Object} user - 用户信息
 * @returns {boolean} 是否支持令牌刷新
 */
const canRefreshToken = (user) => {
  return user && user.type === 'refresh';
};

/**
 * 授权中间件 - 仅限管理员访问
 */
const authorizeAdmin = (req, res, next) => {
  // 检查用户是否存在
  if (!req.user) {
    logger.security(req, '授权失败', { 
      reason: '用户未认证',
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }
  
  // 兼容两种角色标识方式：
  // 1. role 字段：role === 'admin' 或 role 数组包含 'admin'
  // 2. isAdmin 字段：isAdmin === true
  const isAdminRole = req.user.role === 'admin' || 
    (Array.isArray(req.user.role) && req.user.role.includes('admin'));
  const isAdminFlag = req.user.isAdmin === true;
  
  if (isAdminRole || isAdminFlag) {
    next();
  } else {
    logger.security(req, '授权失败', { 
      reason: '需要管理员权限',
      userId: req.user?.id,
      role: req.user?.role,
      isAdmin: req.user?.isAdmin,
      timestamp: new Date().toISOString()
    });
    return res.status(403).json({
      success: false,
      message: '权限不足，需要管理员权限'
    });
  }
};

/**
 * 角色授权中间件
 * @param {string|string[]} roles - 允许访问的角色
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    const userRole = req.user?.role;
    const hasRole = Array.isArray(userRole) 
      ? userRole.some(r => allowedRoles.includes(r))
      : allowedRoles.includes(userRole);

    if (req.user && hasRole) {
      next();
    } else {
      logger.security(req, '授权失败', { 
        reason: `需要以下角色之一: ${allowedRoles.join(', ')}`,
        userId: req.user?.id,
        role: userRole
      });
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeAdmin,
  requireRole,
  generateTokenPair: createTokenPair,
  getTokenExpirationTime,
  canRefreshToken
};
