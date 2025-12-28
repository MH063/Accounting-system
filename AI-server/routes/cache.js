/**
 * 缓存管理路由
 * 提供缓存管理和统计功能
 */

const express = require('express');
const { getCacheStats, resetCacheStats, flushCache } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandling');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

const { sendSuccess } = require('../middleware/response');

const router = express.Router();

/**
 * 获取缓存统计信息
 * GET /api/cache/stats
 */
router.get('/stats', responseWrapper(asyncHandler(async (req, res) => {
  // 记录缓存统计查询尝试
  logger.audit(req, '缓存统计查询尝试', { 
    timestamp: new Date().toISOString()
  });
  
  const stats = getCacheStats();
  
  logger.audit(req, '缓存统计查询成功', { 
    timestamp: new Date().toISOString()
  });
  
  return sendSuccess(res, { stats }, '获取缓存统计信息成功');
})));

/**
 * 重置缓存统计
 * POST /api/cache/reset-stats
 */
router.post('/reset-stats', responseWrapper(asyncHandler(async (req, res) => {
  // 记录缓存统计重置尝试
  logger.audit(req, '缓存统计重置尝试', { 
    timestamp: new Date().toISOString()
  });
  
  resetCacheStats();
  
  logger.audit(req, '缓存统计重置成功', { 
    timestamp: new Date().toISOString()
  });
  
  return sendSuccess(res, null, '缓存统计重置成功');
})));

/**
 * 清空所有缓存
 * POST /api/cache/flush
 */
router.post('/flush', responseWrapper(asyncHandler(async (req, res) => {
  // 记录缓存清空尝试
  logger.audit(req, '缓存清空尝试', { 
    timestamp: new Date().toISOString()
  });
  
  await flushCache();
  
  logger.audit(req, '缓存清空成功', { 
    timestamp: new Date().toISOString()
  });
  
  return sendSuccess(res, null, '所有缓存已清空');
})));

module.exports = router;