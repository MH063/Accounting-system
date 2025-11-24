/**
 * JWT认证中间件
 * 用于验证用户请求中的JWT令牌
 */

const jwt = require('jsonwebtoken');

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
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失，请先登录'
    });
  }
  
  // 验证令牌
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '令牌无效或已过期'
      });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    next();
  });
};

/**
 * 生成JWT令牌
 * @param {Object} payload - 要编码到令牌中的数据
 * @returns {string} JWT令牌
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

module.exports = {
  authenticateToken,
  generateToken
};