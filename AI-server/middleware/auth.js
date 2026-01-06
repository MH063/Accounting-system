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
  // 从请求头或查询参数获取令牌 (支持 SSE)
  const authHeader = req.headers.authorization || req.headers.Authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // 如果请求头没有，尝试从查询参数获取 (针对 EventSource/SSE)
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }
  
  // 关键位置打印日志 (规则 7)
  logger.debug('[AuthMiddleware] 令牌提取详情', {
    url: req.originalUrl,
    method: req.method,
    hasAuthHeader: !!req.headers.authorization || !!req.headers.Authorization,
    hasQueryToken: !!(req.query && req.query.token),
    tokenExtracted: !!token,
    tokenSource: authHeader ? 'header' : (req.query?.token ? 'query' : 'none'),
    headers: {
      authorization: req.headers.authorization ? '存在' : '缺失',
      origin: req.headers.origin
    }
  });

  // 如果没有令牌，返回401未授权
  if (!token) {
    logger.security(req, 'JWT认证失败', { 
      reason: '缺少认证令牌',
      timestamp: new Date().toISOString(),
      attemptFrom: req.ip,
      userAgent: req.headers['user-agent']
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

    logger.info('[AuthMiddleware] Token验证成功，用户信息详情', {
      userId: user.id,
      username: user.username,
      role: user.role,
      roleType: typeof user.role,
      isArray: Array.isArray(user.role),
      isAdmin: user.isAdmin,
      email: user.email,
      allKeys: Object.keys(user)
    });

    req.user = user;
    req.tokenInfo = {
      type: user.type,
      jti: user.jti || user.jwtid,
      isRevoked: false
    };

    // 验证会话有效性（包含过期和空闲超时检查）
    const sessionValidation = await userService.validateSession(user.id, token);
    if (!sessionValidation.success) {
      logger.security(req, '会话验证失败', { 
        userId: user.id, 
        reason: sessionValidation.message,
        code: sessionValidation.code 
      });
      return res.status(401).json({
        success: false,
        code: sessionValidation.code,
        message: sessionValidation.message
      });
    }

    logger.security(req, 'JWT认证成功', {
      userId: user.id,
      tokenType: user.type,
      userRole: user.role,
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
  
  // 兼容多种角色标识方式：
  // 1. role 字段：包含 'admin' 或 'system_admin'
  // 2. isAdmin 字段：isAdmin === true
  // 注意：旧令牌中的 'super_admin' 将自动转换为 'system_admin'
  const hasAdminRole = (role) => {
    if (Array.isArray(role)) {
      const normalizedRoles = role.map(r => r === 'super_admin' ? 'system_admin' : r);
      return normalizedRoles.some(r => r === 'admin' || r === 'system_admin');
    }
    const normalizedRole = role === 'super_admin' ? 'system_admin' : role;
    return normalizedRole === 'admin' || normalizedRole === 'system_admin';
  };
  
  const isAdminRole = hasAdminRole(req.user.role);
  const isAdminFlag = req.user.isAdmin === true;
  
  // 关键位置打印日志 (规则 7)
  logger.debug('[AuthMiddleware] 管理员权限检查', {
    userId: req.user.id,
    role: req.user.role,
    isAdmin: req.user.isAdmin,
    isAdminRole,
    isAdminFlag,
    match: isAdminRole || isAdminFlag
  });
  
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
