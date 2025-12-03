/**
 * 增强的缓存管理路由
 * 提供全面的缓存管理和统计功能，包括API缓存和数据库缓存
 */

const express = require('express');
const { getCacheStats, resetCacheStats, flushCache } = require('../config/database');
const { 
  getStats: getApiCacheStats, 
  resetStats: resetApiCacheStats, 
  flush: flushApiCache,
  invalidateByPattern
} = require('../middleware/apiCache');
const { asyncHandler } = require('../middleware/errorHandling');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

const router = express.Router();

/**
 * 获取所有缓存统计信息
 * GET /api/cache/stats
 */
router.get('/stats', responseWrapper(asyncHandler(async (req, res) => {
  // 记录缓存统计查询尝试
  logger.audit(req, '缓存统计查询尝试', { 
    timestamp: new Date().toISOString()
  });
  
  // 获取数据库缓存统计
  const dbCacheStats = getCacheStats();
  
  // 获取API缓存统计
  const apiCacheStats = getApiCacheStats();
  
  // 计算总体统计
  const totalStats = {
    db: dbCacheStats,
    api: apiCacheStats,
    combined: {
      hits: dbCacheStats.hits + apiCacheStats.hits,
      misses: dbCacheStats.misses + apiCacheStats.misses,
      sets: dbCacheStats.sets + apiCacheStats.sets,
      deletes: dbCacheStats.deletes + apiCacheStats.deletes,
      errors: (dbCacheStats.errors || 0) + (apiCacheStats.errors || 0),
      hitRate: ((dbCacheStats.hits + apiCacheStats.hits) / 
                ((dbCacheStats.hits + apiCacheStats.hits) + (dbCacheStats.misses + apiCacheStats.misses)) * 100) || 0
    }
  };
  
  logger.audit(req, '缓存统计查询成功', { 
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '获取缓存统计信息成功',
    data: {
      stats: totalStats
    }
  });
})));

/**
 * 获取数据库缓存统计信息
 * GET /api/cache/stats/db
 */
router.get('/stats/db', responseWrapper(asyncHandler(async (req, res) => {
  // 记录数据库缓存统计查询尝试
  logger.audit(req, '数据库缓存统计查询尝试', { 
    timestamp: new Date().toISOString()
  });
  
  const stats = getCacheStats();
  
  logger.audit(req, '数据库缓存统计查询成功', { 
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '获取数据库缓存统计信息成功',
    data: {
      stats
    }
  });
})));

/**
 * 获取API缓存统计信息
 * GET /api/cache/stats/api
 */
router.get('/stats/api', responseWrapper(asyncHandler(async (req, res) => {
  // 记录API缓存统计查询尝试
  logger.audit(req, 'API缓存统计查询尝试', { 
    timestamp: new Date().toISOString()
  });
  
  const stats = getApiCacheStats();
  
  logger.audit(req, 'API缓存统计查询成功', { 
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '获取API缓存统计信息成功',
    data: {
      stats
    }
  });
})));

/**
 * 重置所有缓存统计
 * POST /api/cache/reset-stats
 */
router.post('/reset-stats', responseWrapper(asyncHandler(async (req, res) => {
  // 记录缓存统计重置尝试
  logger.audit(req, '缓存统计重置尝试', { 
    timestamp: new Date().toISOString()
  });
  
  // 重置数据库缓存统计
  resetCacheStats();
  
  // 重置API缓存统计
  resetApiCacheStats();
  
  logger.audit(req, '缓存统计重置成功', { 
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '所有缓存统计重置成功'
  });
})));

/**
 * 重置数据库缓存统计
 * POST /api/cache/reset-stats/db
 */
router.post('/reset-stats/db', responseWrapper(asyncHandler(async (req, res) => {
  // 记录数据库缓存统计重置尝试
  logger.audit(req, '数据库缓存统计重置尝试', { 
    timestamp: new Date().toISOString()
  });
  
  resetCacheStats();
  
  logger.audit(req, '数据库缓存统计重置成功', { 
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '数据库缓存统计重置成功'
  });
})));

/**
 * 重置API缓存统计
 * POST /api/cache/reset-stats/api
 */
router.post('/reset-stats/api', responseWrapper(asyncHandler(async (req, res) => {
  // 记录API缓存统计重置尝试
  logger.audit(req, 'API缓存统计重置尝试', { 
    timestamp: new Date().toISOString()
  });
  
  resetApiCacheStats();
  
  logger.audit(req, 'API缓存统计重置成功', { 
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: 'API缓存统计重置成功'
  });
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
  
  // 清空数据库缓存
  flushCache();
  
  // 清空API缓存
  flushApiCache();
  
  logger.audit(req, '缓存清空成功', { 
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '所有缓存已清空'
  });
})));

/**
 * 清空数据库缓存
 * POST /api/cache/flush/db
 */
router.post('/flush/db', responseWrapper(asyncHandler(async (req, res) => {
  // 记录数据库缓存清空尝试
  logger.audit(req, '数据库缓存清空尝试', { 
    timestamp: new Date().toISOString()
  });
  
  flushCache();
  
  logger.audit(req, '数据库缓存清空成功', { 
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '数据库缓存已清空'
  });
})));

/**
 * 清空API缓存
 * POST /api/cache/flush/api
 */
router.post('/flush/api', responseWrapper(asyncHandler(async (req, res) => {
  // 记录API缓存清空尝试
  logger.audit(req, 'API缓存清空尝试', { 
    timestamp: new Date().toISOString()
  });
  
  flushApiCache();
  
  logger.audit(req, 'API缓存清空成功', { 
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: 'API缓存已清空'
  });
})));

/**
 * 根据模式清除API缓存
 * POST /api/cache/invalidate
 */
router.post('/invalidate', responseWrapper(asyncHandler(async (req, res) => {
  const { pattern } = req.body;
  
  if (!pattern) {
    return res.status(400).json({
      success: false,
      message: '请提供要清除的缓存模式'
    });
  }
  
  // 记录缓存模式清除尝试
  logger.audit(req, '缓存模式清除尝试', { 
    pattern,
    timestamp: new Date().toISOString()
  });
  
  const invalidatedCount = invalidateByPattern(pattern);
  
  logger.audit(req, '缓存模式清除成功', { 
    pattern,
    invalidatedCount,
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: `已清除 ${invalidatedCount} 个匹配模式 "${pattern}" 的缓存项`,
    data: {
      pattern,
      invalidatedCount
    }
  });
})));

/**
 * 获取增强缓存统计信息
 * GET /api/cache/enhanced-stats
 */
router.get('/enhanced-stats', responseWrapper(asyncHandler(async (req, res) => {
  // 记录增强缓存统计查询尝试
  logger.audit(req, '增强缓存统计查询尝试', { 
    timestamp: new Date().toISOString()
  });
  
  // 获取数据库缓存统计
  const dbCacheStats = getCacheStats();
  
  // 获取API缓存统计
  const apiCacheStats = getApiCacheStats();
  
  // 计算总体统计
  const totalStats = {
    db: dbCacheStats,
    api: apiCacheStats,
    combined: {
      hits: dbCacheStats.hits + apiCacheStats.hits,
      misses: dbCacheStats.misses + apiCacheStats.misses,
      sets: dbCacheStats.sets + apiCacheStats.sets,
      deletes: dbCacheStats.deletes + apiCacheStats.deletes,
      errors: (dbCacheStats.errors || 0) + (apiCacheStats.errors || 0),
      hitRate: ((dbCacheStats.hits + apiCacheStats.hits) / 
                ((dbCacheStats.hits + apiCacheStats.hits) + (dbCacheStats.misses + apiCacheStats.misses)) * 100) || 0
    },
    performance: {
      avgResponseTime: 0, // 可以添加响应时间统计
      totalRequests: dbCacheStats.hits + dbCacheStats.misses + apiCacheStats.hits + apiCacheStats.misses,
      cacheEfficiency: ((dbCacheStats.hits + apiCacheStats.hits) / 
                       ((dbCacheStats.hits + apiCacheStats.hits) + (dbCacheStats.misses + apiCacheStats.misses)) * 100) || 0
    }
  };
  
  logger.audit(req, '增强缓存统计查询成功', { 
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '获取增强缓存统计信息成功',
    data: {
      stats: totalStats
    }
  });
})));

/**
 * 获取缓存健康状态
 * GET /api/cache/health
 */
router.get('/health', responseWrapper(asyncHandler(async (req, res) => {
  // 获取数据库缓存统计
  const dbCacheStats = getCacheStats();
  
  // 获取API缓存统计
  const apiCacheStats = getApiCacheStats();
  
  // 计算健康状态
  const healthStatus = {
    overall: 'healthy',
    database: {
      status: dbCacheStats.errors > 0 ? 'warning' : 'healthy',
      errors: dbCacheStats.errors || 0,
      hitRate: dbCacheStats.hitRate || 0
    },
    api: {
      status: apiCacheStats.errors > 0 ? 'warning' : 'healthy',
      errors: apiCacheStats.errors || 0,
      hitRate: apiCacheStats.hitRate || 0
    }
  };
  
  // 如果任一缓存有错误，整体状态设为警告
  if (healthStatus.database.status === 'warning' || healthStatus.api.status === 'warning') {
    healthStatus.overall = 'warning';
  }
  
  // 如果命中率过低，设为警告
  const combinedHitRate = ((dbCacheStats.hits + apiCacheStats.hits) / 
                          ((dbCacheStats.hits + apiCacheStats.hits) + (dbCacheStats.misses + apiCacheStats.misses)) * 100) || 0;
  
  if (combinedHitRate < 10 && (dbCacheStats.hits + apiCacheStats.hits) > 100) {
    healthStatus.overall = 'warning';
    healthStatus.lowHitRate = true;
  }
  
  return res.json({
    success: true,
    message: '获取缓存健康状态成功',
    data: {
      health: healthStatus,
      combinedHitRate
    }
  });
})));

module.exports = router;