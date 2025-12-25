/**
 * JWT认证中间件
 * 用于验证用户请求中的JWT令牌，支持：
 * - 密钥轮换
 * - 双令牌机制 (access/refresh)
 * - 令牌黑名单检查
 */

const { 
  verifyToken, 
  verifyTokenWithBlacklist,
  generateTokenPair,
  getTokenExpiry 
} = require('../config/jwtManager');
const logger = require('../config/logger');

/**
 * 验证JWT令牌的中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const authenticateToken = async (req, res, next) => {
  // 从请求头获取令牌
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  // 如果没有令牌，返回401未授权
  if (!token) {
    logger.security(req, 'JWT认证失败', { 
      reason: '缺少认证令牌',
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失，请先登录'
    });
  }
  
  try {
    const payload = await verifyTokenWithBlacklist(token);
    const user = { ...payload, id: payload.userId || payload.id };
    req.user = user;
    req.tokenInfo = {
      type: payload.type,
      jti: payload.jti || payload.jwtid,
      isRevoked: false
    };
    logger.security(req, 'JWT认证成功', { 
      userId: user.id,
      tokenType: payload.type,
      timestamp: new Date().toISOString()
    });
    next();
  } catch (err) {
    let message = '令牌验证失败';
    let statusCode = 403;
    
    if (err.name === 'TokenExpiredError') {
      message = '令牌已过期';
    } else if (err.name === 'JsonWebTokenError') {
      message = '令牌格式错误';
    } else if (err.message === '没有可用的JWT密钥') {
      message = '服务器配置错误';
      statusCode = 500;
    }
    
    logger.security(req, 'JWT认证失败', { 
      reason: err.message,
      timestamp: new Date().toISOString()
    });
    
    return res.status(statusCode).json({
      success: false,
      message: message
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

module.exports = {
  authenticateToken,
  generateTokenPair: createTokenPair,
  getTokenExpirationTime,
  canRefreshToken
};
