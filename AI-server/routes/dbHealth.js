/**
 * 数据库健康检查路由
 * 提供数据库连接状态和性能指标
 */

const express = require('express');
const { healthCheck, getPoolStatus, getCacheStats } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

const router = express.Router();

/**
 * 获取数据库健康状态
 * GET /api/db/health
 */
router.get('/health', responseWrapper(asyncHandler(async (req, res) => {
  // 记录健康检查尝试
  logger.audit(req, '数据库健康检查尝试', { 
    timestamp: new Date().toISOString()
  });
  
  // 获取数据库健康状态
  const dbHealth = await healthCheck();
  
  // 获取连接池状态
  const poolStatus = getPoolStatus();
  
  // 获取缓存统计
  const cacheStats = getCacheStats();
  
  // 计算健康评分
  let healthScore = 100;
  let status = 'healthy';
  
  // 根据数据库状态调整评分
  if (dbHealth.database === 'unhealthy') {
    healthScore -= 50;
    status = 'unhealthy';
  } else if (dbHealth.responseTime > 1000) {
    healthScore -= 20;
    status = 'degraded';
  }
  
  // 根据连接池状态调整评分
  const poolUtilization = (poolStatus.totalCount - poolStatus.idleCount) / poolStatus.totalCount;
  if (poolUtilization > 0.9) {
    healthScore -= 15;
    if (status === 'healthy') status = 'degraded';
  }
  
  if (poolStatus.waitingCount > 5) {
    healthScore -= 25;
    if (status === 'healthy') status = 'degraded';
  }
  
  // 根据缓存命中率调整评分
  if (cacheStats.hitRate < 30 && (cacheStats.hits + cacheStats.misses) > 100) {
    healthScore -= 10;
  }
  
  // 确定最终状态
  if (healthScore < 50) {
    status = 'unhealthy';
  } else if (healthScore < 80) {
    status = 'degraded';
  }
  
  const healthData = {
    status,
    score: Math.max(0, healthScore),
    database: dbHealth,
    pool: {
      ...poolStatus,
      utilization: poolUtilization * 100
    },
    cache: cacheStats,
    timestamp: new Date().toISOString()
  };
  
  logger.audit(req, '数据库健康检查完成', { 
    status,
    score: healthData.score,
    timestamp: new Date().toISOString()
  });
  
  // 根据健康状态设置HTTP状态码
  const httpStatus = status === 'healthy' ? 200 : 
                    status === 'degraded' ? 200 : 503;
  
  return res.status(httpStatus).json({
    success: true,
    message: `数据库状态: ${status}`,
    data: {
      health: healthData
    }
  });
})));

/**
 * 获取数据库连接池状态
 * GET /api/db/pool-status
 */
router.get('/pool-status', responseWrapper(asyncHandler(async (req, res) => {
  // 记录连接池状态查询尝试
  logger.audit(req, '数据库连接池状态查询尝试', { 
    timestamp: new Date().toISOString()
  });
  
  const poolStatus = getPoolStatus();
  
  // 计算连接池利用率
  const utilization = poolStatus.totalCount > 0 ? 
    ((poolStatus.totalCount - poolStatus.idleCount) / poolStatus.totalCount * 100).toFixed(2) : 0;
  
  // 计算连接池效率评分
  let efficiencyScore = 100;
  if (utilization > 90) efficiencyScore -= 20;
  if (poolStatus.waitingCount > 0) efficiencyScore -= 30;
  if (poolStatus.totalCount === 0) efficiencyScore = 0;
  
  logger.audit(req, '数据库连接池状态查询成功', { 
    totalConnections: poolStatus.totalCount,
    idleConnections: poolStatus.idleCount,
    waitingRequests: poolStatus.waitingCount,
    utilization: `${utilization}%`,
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '获取数据库连接池状态成功',
    data: {
      pool: {
        ...poolStatus,
        utilization: parseFloat(utilization),
        efficiencyScore
      }
    }
  });
})));

module.exports = router;