/**
 * JWT认证中间件
 * 用于验证用户请求中的JWT令牌，支持密钥轮换
 */

const { generateToken, verifyToken } = require('../config/jwtManager');
const logger = require('../config/logger');

/**
 * 验证JWT令牌的中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const authenticateToken = (req, res, next) => {
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
    // 使用密钥管理器验证令牌（支持密钥轮换）
    const user = verifyToken(token);
    
    // 将用户信息添加到请求对象
    req.user = user;
    
    logger.security(req, 'JWT认证成功', { 
      userId: user.id || user.userId,
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
 * 生成JWT令牌
 * @param {Object} payload - 要编码到令牌中的数据
 * @param {Object} options - 令牌选项
 * @returns {string} JWT令牌
 */
const createToken = (payload, options = {}) => {
  try {
    const token = generateToken(payload, options);
    
    logger.security(null, 'JWT令牌生成成功', { 
      userId: payload.id || payload.userId,
      expiresIn: options.expiresIn || process.env.JWT_EXPIRES_IN || '24h',
      timestamp: new Date().toISOString()
    });
    
    return token;
  } catch (err) {
    logger.error('JWT令牌生成失败:', err);
    throw new Error('令牌生成失败');
  }
};

module.exports = {
  authenticateToken,
  generateToken: createToken
};