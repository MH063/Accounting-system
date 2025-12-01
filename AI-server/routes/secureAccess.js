/**
 * 安全访问控制路由示例
 * 演示如何使用增强的访问控制中间件
 */

const express = require('express');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');
const { 
  enhancedAuth, 
  resourceAccessControl, 
  ipAddressControl,
  timeBasedAccessControl,
  rateLimitAccessControl
} = require('../middleware/accessControl');
const logger = require('../config/logger');

const router = express.Router();

/**
 * 受保护的用户信息接口
 * 需要用户权限才能访问
 */
router.get('/user-info',
  enhancedAuth({ minLevel: 1 }), // 需要USER权限
  responseWrapper(asyncHandler(async (req, res) => {
    logger.info('[SECURE_ACCESS] 用户信息查询', { userId: req.user.id });
    
    return res.sendSuccess({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      permissionLevel: req.user.permissionLevel
    }, '用户信息获取成功');
  }))
);

/**
 * 管理员专用接口
 * 需要管理员权限才能访问
 */
router.get('/admin-panel',
  enhancedAuth({ minLevel: 3 }), // 需要ADMIN权限
  responseWrapper(asyncHandler(async (req, res) => {
    logger.info('[SECURE_ACCESS] 管理员面板访问', { userId: req.user.id });
    
    return res.sendSuccess({
      message: '欢迎访问管理员面板',
      adminId: req.user.id,
      permissions: ['user_management', 'system_config', 'logs_view']
    }, '管理员面板访问成功');
  }))
);

/**
 * 超级管理员专用接口
 * 需要超级管理员权限才能访问
 */
router.get('/super-admin-panel',
  enhancedAuth({ minLevel: 4 }), // 需要SUPER_ADMIN权限
  responseWrapper(asyncHandler(async (req, res) => {
    logger.info('[SECURE_ACCESS] 超级管理员面板访问', { userId: req.user.id });
    
    return res.sendSuccess({
      message: '欢迎访问超级管理员面板',
      superAdminId: req.user.id,
      permissions: ['system_control', 'user_promotion', 'config_management', 'security_audit']
    }, '超级管理员面板访问成功');
  }))
);

/**
 * 数据库访问接口
 * 需要特定资源权限
 */
router.get('/database-access',
  enhancedAuth(), // 基本认证
  resourceAccessControl('database', 'read'), // 需要数据库读取权限
  responseWrapper(asyncHandler(async (req, res) => {
    logger.info('[SECURE_ACCESS] 数据库访问', { userId: req.user.id });
    
    return res.sendSuccess({
      tables: ['users', 'orders', 'products'],
      accessLevel: 'read_only'
    }, '数据库访问成功');
  }))
);

/**
 * 受IP限制的接口
 * 只允许特定IP访问
 */
router.get('/ip-restricted',
  ipAddressControl(['::1', '127.0.0.1', '::ffff:127.0.0.1']), // 只允许本地访问
  responseWrapper(asyncHandler(async (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    logger.info('[SECURE_ACCESS] IP受限接口访问', { clientIP });
    
    return res.sendSuccess({
      message: 'IP验证通过',
      clientIP: clientIP
    }, 'IP受限接口访问成功');
  }))
);

/**
 * 受时间限制的接口
 * 只在工作时间允许访问
 */
router.get('/time-restricted',
  timeBasedAccessControl({
    startTime: '09:00',
    endTime: '18:00',
    weekdays: [1, 2, 3, 4, 5] // 周一到周五
  }),
  responseWrapper(asyncHandler(async (req, res) => {
    const now = new Date();
    logger.info('[SECURE_ACCESS] 时间受限接口访问', { 
      currentTime: now.toISOString(),
      hour: now.getHours()
    });
    
    return res.sendSuccess({
      message: '时间验证通过',
      currentTime: now.toISOString()
    }, '时间受限接口访问成功');
  }))
);

/**
 * 速率限制接口
 * 限制访问频率
 */
router.get('/rate-limited',
  rateLimitAccessControl({
    maxRequests: 5, // 每分钟最多5次请求
    windowMs: 60000 // 1分钟窗口
  }),
  responseWrapper(asyncHandler(async (req, res) => {
    logger.info('[SECURE_ACCESS] 速率限制接口访问');
    
    return res.sendSuccess({
      message: '速率限制验证通过',
      timestamp: new Date().toISOString()
    }, '速率限制接口访问成功');
  }))
);

/**
 * 复合权限验证接口
 * 需要多种权限同时满足
 */
router.get('/complex-access',
  enhancedAuth({ 
    minLevel: 2, // 需要MODERATOR权限
    permissions: ['users.read', 'database.read'] // 需要特定权限
  }),
  ipAddressControl(['::1', '127.0.0.1']), // 本地访问限制
  timeBasedAccessControl({
    startTime: '08:00',
    endTime: '20:00'
  }), // 时间限制
  responseWrapper(asyncHandler(async (req, res) => {
    logger.info('[SECURE_ACCESS] 复合权限接口访问', { userId: req.user.id });
    
    return res.sendSuccess({
      message: '复合权限验证通过',
      userId: req.user.id,
      permissionLevel: req.user.permissionLevel,
      permissions: req.user.permissions || []
    }, '复合权限接口访问成功');
  }))
);

module.exports = router;