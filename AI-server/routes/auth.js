/**
 * 用户相关路由示例
 * 包含登录、注册和受保护路由的示例
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const logger = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const { responseWrapper } = require('../middleware/response');
const { strictRateLimit } = require('../middleware/security');

const router = express.Router();

/**
 * 用户登录路由
 * POST /api/auth/login
 */
router.post('/login', strictRateLimit({ 
  windowMs: 60000, // 1分钟
  maxRequests: 5,  // 每分钟最多5次登录尝试
  skipSuccessfulRequests: true // 成功后不计入限制
}), responseWrapper(asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  // 记录登录尝试
  logger.audit(req, '用户登录尝试', { 
    username,
    timestamp: new Date().toISOString()
  });
  
  // 验证输入
  if (!username || !password) {
    logger.auth('登录失败: 用户名或密码为空', { username });
    logger.security(req, '登录尝试失败: 凭据不完整', { 
      username,
      reason: '用户名或密码为空'
    });
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }
  
  // 查询用户
  const result = await query(
    'SELECT id, username, email, password_hash FROM users WHERE username = $1',
    [username]
  );
  
  if (result.rows.length === 0) {
    logger.auth('登录失败: 用户不存在', { username });
    logger.security(req, '登录尝试失败: 用户不存在', { 
      username,
      reason: '用户不存在'
    });
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
  
  const user = result.rows[0];
  
  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    logger.auth('登录失败: 密码错误', { username, userId: user.id });
    logger.security(req, '登录尝试失败: 密码错误', { 
      username,
      userId: user.id,
      reason: '密码错误'
    });
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
  
  // 生成JWT令牌
  const token = generateToken({ id: user.id, username: user.username });
  
  logger.auth('登录成功', { username, userId: user.id });
  logger.audit(req, '用户登录成功', { 
    username,
    userId: user.id,
    timestamp: new Date().toISOString()
  });
  
  // 返回成功响应
  return res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }
  });
})));

/**
 * 用户注册路由
 * POST /api/auth/register
 */
router.post('/register', strictRateLimit({ 
  windowMs: 60000, // 1分钟
  maxRequests: 3,  // 每分钟最多3次注册尝试
  skipSuccessfulRequests: true // 成功后不计入限制
}), responseWrapper(asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  
  // 记录注册尝试
  logger.audit(req, '用户注册尝试', { 
    username,
    email,
    timestamp: new Date().toISOString()
  });
  
  // 验证输入
  if (!username || !email || !password) {
    logger.auth('注册失败: 用户名、邮箱或密码为空', { username, email });
    logger.security(req, '注册尝试失败: 凭据不完整', { 
      username,
      email,
      reason: '用户名、邮箱或密码为空'
    });
    return res.status(400).json({
      success: false,
      message: '用户名、邮箱和密码不能为空'
    });
  }
  
  // 检查用户是否已存在
  const existingUser = await query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );
  
  if (existingUser.rows.length > 0) {
    logger.auth('注册失败: 用户名或邮箱已存在', { username, email });
    logger.security(req, '注册尝试失败: 用户名或邮箱已存在', { 
      username,
      email,
      reason: '用户名或邮箱已存在'
    });
    return res.status(409).json({
      success: false,
      message: '用户名或邮箱已存在'
    });
  }
  
  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 插入用户
  const result = await query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
    [username, email, hashedPassword]
  );
  
  logger.auth('注册成功', { username, email, userId: result.rows[0].id });
  logger.audit(req, '用户注册成功', { 
    username,
    email,
    userId: result.rows[0].id,
    timestamp: new Date().toISOString()
  });
  
  // 返回成功响应
  return res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user: result.rows[0]
    }
  });
})));

/**
 * 受保护的路由示例
 * GET /api/auth/profile
 * 需要有效的JWT令牌才能访问
 */
router.get('/profile', authenticateToken, responseWrapper(asyncHandler(async (req, res) => {
  // 记录用户信息访问尝试
  logger.audit(req, '用户信息访问', { 
    userId: req.user.id,
    timestamp: new Date().toISOString()
  });
  
  // 从数据库获取用户信息
  const result = await query(
    'SELECT id, username, email, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  
  if (result.rows.length === 0) {
    logger.auth('获取用户信息失败: 用户不存在', { userId: req.user.id });
    logger.security(req, '用户信息访问失败: 用户不存在', { 
      userId: req.user.id,
      reason: '用户不存在'
    });
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }
  
  logger.auth('获取用户信息成功', { userId: req.user.id });
  logger.audit(req, '用户信息访问成功', { 
    userId: req.user.id,
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '获取用户信息成功',
    data: {
      user: result.rows[0]
    }
  });
})));

module.exports = router;