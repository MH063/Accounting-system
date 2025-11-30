/**
 * CORS管理路由
 * 提供CORS配置的动态管理功能
 */

const express = require('express');
const { getCorsInfo, updateWhitelist, addToWhitelist, removeFromWhitelist } = require('../middleware/corsConfig');
const { asyncHandler } = require('../middleware/errorHandler');
const { responseWrapper } = require('../middleware/response');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

/**
 * 获取当前CORS配置信息
 * GET /api/cors/info
 */
router.get('/info', authenticateToken, responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[CORS] 获取CORS配置信息', { user: req.user?.username });
  
  const corsInfo = getCorsInfo();
  
  return res.json({
    success: true,
    message: 'CORS配置信息获取成功',
    data: corsInfo
  });
})));

/**
 * 更新CORS白名单
 * PUT /api/cors/whitelist
 * Body: { whitelist: ["http://example.com", "https://app.example.com"] }
 */
router.put('/whitelist', authenticateToken, responseWrapper(asyncHandler(async (req, res) => {
  const { whitelist } = req.body;
  
  if (!Array.isArray(whitelist)) {
    return res.status(400).json({
      success: false,
      message: '白名单必须是数组格式'
    });
  }
  
  // 验证白名单格式
  const invalidOrigins = whitelist.filter(origin => {
    try {
      // 支持通配符和基本域名验证
      if (origin.includes('*')) {
        return false; // 通配符域名，跳过验证
      }
      
      // 基本格式验证
      return !origin.match(/^https?:\/\/([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+(:[0-9]+)?$/);
    } catch {
      return true;
    }
  });
  
  if (invalidOrigins.length > 0) {
    return res.status(400).json({
      success: false,
      message: `以下来源格式无效: ${invalidOrigins.join(', ')}`
    });
  }
  
  logger.info('[CORS] 更新白名单', { 
    user: req.user?.username,
    oldCount: getCorsInfo().whitelistCount,
    newCount: whitelist.length
  });
  
  updateWhitelist(whitelist);
  
  return res.json({
    success: true,
    message: 'CORS白名单更新成功',
    data: {
      whitelistCount: whitelist.length,
      whitelist: whitelist
    }
  });
})));

/**
 * 添加来源到白名单
 * POST /api/cors/whitelist/add
 * Body: { origin: "http://example.com" }
 */
router.post('/whitelist/add', authenticateToken, responseWrapper(asyncHandler(async (req, res) => {
  const { origin } = req.body;
  
  if (!origin || typeof origin !== 'string') {
    return res.status(400).json({
      success: false,
      message: '必须提供有效的来源地址'
    });
  }
  
  // 验证来源格式
  if (!origin.match(/^https?:\/\/([a-zA-Z0-9*-]+\.)*[a-zA-Z0-9*-]+(:[0-9]+)?$/)) {
    return res.status(400).json({
      success: false,
      message: '来源格式无效，应为 http(s)://domain.com 格式'
    });
  }
  
  logger.info('[CORS] 添加来源到白名单', { 
    user: req.user?.username,
    origin: origin
  });
  
  addToWhitelist(origin);
  
  return res.json({
    success: true,
    message: '来源已添加到白名单',
    data: { origin: origin }
  });
})));

/**
 * 从白名单中移除来源
 * DELETE /api/cors/whitelist/remove
 * Body: { origin: "http://example.com" }
 */
router.delete('/whitelist/remove', authenticateToken, responseWrapper(asyncHandler(async (req, res) => {
  const { origin } = req.body;
  
  if (!origin || typeof origin !== 'string') {
    return res.status(400).json({
      success: false,
      message: '必须提供有效的来源地址'
    });
  }
  
  logger.info('[CORS] 从白名单移除来源', { 
    user: req.user?.username,
    origin: origin
  });
  
  removeFromWhitelist(origin);
  
  return res.json({
    success: true,
    message: '来源已从白名单移除',
    data: { origin: origin }
  });
})));

/**
 * 测试CORS配置
 * POST /api/cors/test
 * Body: { origin: "http://example.com" }
 */
router.post('/test', authenticateToken, responseWrapper(asyncHandler(async (req, res) => {
  const { origin } = req.body;
  
  if (!origin || typeof origin !== 'string') {
    return res.status(400).json({
      success: false,
      message: '必须提供有效的来源地址'
    });
  }
  
  const { isOriginAllowed } = require('../middleware/corsConfig');
  const corsInfo = getCorsInfo();
  
  const isAllowed = isOriginAllowed(origin, corsInfo.whitelist);
  
  logger.info('[CORS] 测试来源访问权限', { 
    user: req.user?.username,
    origin: origin,
    allowed: isAllowed
  });
  
  return res.json({
    success: true,
    message: 'CORS测试完成',
    data: {
      origin: origin,
      allowed: isAllowed,
      environment: corsInfo.environment,
      allowAllInDev: corsInfo.allowAllInDev
    }
  });
})));

module.exports = router;