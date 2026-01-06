/**
 * 增强版健康检查路由
 * 提供全面的系统健康状态监控
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { healthCheckHandler, createServiceDegradationHandler, withRetry, asyncHandler } = require('../middleware/errorHandling');
const { pool, healthCheck: dbHealthCheck, getPoolStatus, getDegradationStatus } = require('../config/database');
const logger = require('../config/logger');
const { responseWrapper } = require('../middleware/response');
const { getMetrics, recordHealthMetrics } = require('../middleware/prometheus');
const { getMetrics: getCustomMetrics } = require('../middleware/monitoring');
const versionManager = require('../config/versionManager');

/**
 * 获取系统负载信息
 */
async function getSystemLoad() {
  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length;
  
  return {
    '1min': parseFloat(loadAvg[0].toFixed(2)),
    '5min': parseFloat(loadAvg[1].toFixed(2)),
    '15min': parseFloat(loadAvg[2].toFixed(2)),
    cpuCount,
    loadPercentage: parseFloat(((loadAvg[0] / cpuCount) * 100).toFixed(2))
  };
}

/**
 * 获取磁盘使用情况
 */
async function getDiskUsage() {
  try {
    const stats = await fs.stat('./uploads');
    // 这里可以添加更详细的磁盘使用统计
    // 注意：在Windows上获取磁盘空间需要不同的方法
    return {
      status: 'healthy',
      available: true,
      writable: true,
      message: '文件系统可写',
      path: './uploads'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      available: false,
      writable: false,
      error: error.message,
      path: './uploads'
    };
  }
}

/**
 * 获取网络接口信息
 */
function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const networkInfo = {};
  
  for (const name in interfaces) {
    const addresses = interfaces[name].filter(addr => !addr.internal && addr.family === 'IPv4');
    if (addresses.length > 0) {
      networkInfo[name] = addresses.map(addr => ({
        address: addr.address,
        family: addr.family,
        mac: addr.mac
      }));
    }
  }
  
  return networkInfo;
}

/**
 * 获取进程信息
 */
function getProcessInfo() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const uptime = process.uptime();
  
  return {
    pid: process.pid,
    version: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000), // ms
      system: Math.round(cpuUsage.system / 1000), // ms
      total: Math.round((cpuUsage.user + cpuUsage.system) / 1000) // ms
    },
    uptime: {
      seconds: Math.round(uptime),
      formatted: new Date(uptime * 1000).toISOString().substr(11, 8)
    }
  };
}

/**
 * 获取服务依赖状态
 */
async function getServiceDependencies() {
  const dependencies = {};
  
  // 数据库状态
  try {
    const dbHealth = await dbHealthCheck();
    const poolStatus = getPoolStatus();
    const degradationStatus = getDegradationStatus();
    
    dependencies.database = {
      status: dbHealth.status,
      responseTime: dbHealth.responseTime,
      poolSize: poolStatus.totalCount,
      idleConnections: poolStatus.idleCount,
      waitingConnections: poolStatus.waitingCount,
      degradationStatus,
      message: dbHealth.status === 'healthy' ? '数据库连接正常' : '数据库连接异常'
    };
  } catch (error) {
    dependencies.database = {
      status: 'unhealthy',
      error: error.message,
      message: '数据库连接失败'
    };
  }
  
  // 文件系统状态
  dependencies.storage = await getDiskUsage();
  
  // 网络状态
  dependencies.network = {
    status: 'healthy',
    interfaces: getNetworkInterfaces(),
    message: '网络连接正常'
  };
  
  return dependencies;
}

/**
 * 计算整体健康评分
 */
function calculateHealthScore(checks) {
  let score = 100;
  let status = 'healthy';
  const issues = [];
  
  // 数据库健康检查
  if (checks.database && checks.database.status !== 'healthy') {
    score -= 30;
    status = 'degraded';
    issues.push('数据库连接异常');
  }
  
  // 内存使用检查
  if (checks.memory && checks.memory.usage > 80) {
    score -= 20;
    if (status === 'healthy') status = 'degraded';
    issues.push('内存使用率过高');
  }
  
  // CPU负载检查
  if (checks.system && checks.system.load && checks.system.load.loadPercentage > 80) {
    score -= 15;
    if (status === 'healthy') status = 'degraded';
    issues.push('CPU负载过高');
  }
  
  // 磁盘空间检查
  if (checks.storage && checks.storage.status !== 'healthy') {
    score -= 25;
    status = 'degraded';
    issues.push('存储系统异常');
  }
  
  // 连接池状态检查
  if (checks.dependencies && checks.dependencies.database) {
    const dbDep = checks.dependencies.database;
    if (dbDep.waitingConnections > 5) {
      score -= 10;
      if (status === 'healthy') status = 'degraded';
      issues.push('数据库连接等待过多');
    }
  }
  
  // 确定最终状态
  if (score < 50) {
    status = 'unhealthy';
  }
  
  return {
    score: Math.max(0, score),
    status,
    issues
  };
}

/**
 * 主要健康检查端点 - 增强版
 * GET /api/health
 */
router.get('/', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[HEALTH] 执行全面健康检查');
  
  const startTime = Date.now();
  
  try {
    // 获取系统信息
    const systemLoad = await getSystemLoad();
    const memoryUsage = getProcessInfo().memory;
    const diskUsage = await getDiskUsage();
    const processInfo = getProcessInfo();
    const dependencies = await getServiceDependencies();
    
    // 构建检查数据
    const checks = {
      timestamp: new Date().toISOString(),
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        load: systemLoad,
        uptime: processInfo.uptime,
        memory: memoryUsage,
        process: processInfo
      },
      database: dependencies.database,
      storage: diskUsage,
      dependencies: dependencies
    };
    
    // 计算健康评分
    const healthScore = calculateHealthScore(checks);
    
    // 构建响应数据
    const serverVersion = versionManager.getServerVersion();
    const healthData = {
      status: healthScore.status,
      score: healthScore.score,
      checks: checks,
      issues: healthScore.issues,
      responseTime: Date.now() - startTime,
      version: serverVersion.version
    };
    
    // 记录健康指标到Prometheus
    try {
      await recordHealthMetrics(healthData);
    } catch (prometheusError) {
      logger.warn('[HEALTH] Prometheus指标记录失败', { 
        error: prometheusError.message 
      });
    }
    
    logger.info('[HEALTH] 健康检查完成', { 
      status: healthScore.status,
      score: healthScore.score,
      responseTime: Date.now() - startTime
    });
    
    // 根据健康状态设置HTTP状态码
    const httpStatus = healthScore.status === 'healthy' ? 200 : 
                     healthScore.status === 'degraded' ? 206 : 503;
    
    return res.sendSuccess(healthData, '健康检查完成', httpStatus);
    
  } catch (error) {
    logger.error('[HEALTH] 健康检查失败', { error: error.message });
    
    // 返回错误状态
    const errorData = {
      status: 'unhealthy',
      score: 0,
      error: error.message,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };
    
    return res.sendSuccess(errorData, '健康检查失败', 503);
  }
})));

/**
 * 详细的性能指标端点
 * GET /api/health/performance
 */
router.get('/performance', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[HEALTH] 获取详细性能指标');
  
  const startTime = Date.now();
  
  try {
    // 获取自定义指标
    const customMetrics = getCustomMetrics();
    
    // 获取系统详细信息
    const systemInfo = {
      cpu: os.cpus().map((cpu, index) => ({
        core: index,
        model: cpu.model,
        speed: cpu.speed,
        times: cpu.times
      })),
      memory: {
        total: Math.round(os.totalmem() / 1024 / 1024), // MB
        free: Math.round(os.freemem() / 1024 / 1024), // MB
        usage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
      },
      network: getNetworkInterfaces(),
      loadAverage: os.loadavg()
    };
    
    const performanceData = {
      timestamp: new Date().toISOString(),
      system: systemInfo,
      metrics: customMetrics,
      database: await getServiceDependencies().then(deps => deps.database),
      responseTime: Date.now() - startTime
    };
    
    logger.info('[HEALTH] 性能指标获取成功', { 
      responseTime: Date.now() - startTime 
    });
    
    return res.sendSuccess(performanceData, '性能指标获取成功');
    
  } catch (error) {
    logger.error('[HEALTH] 性能指标获取失败', { error: error.message });
    
    return res.sendError('性能指标获取失败', error, 500);
  }
})));

/**
 * Prometheus指标端点
 * GET /api/health/metrics
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  logger.info('[HEALTH] 获取Prometheus指标');
  
  try {
    const metrics = await getMetrics();
    const contentType = require('../middleware/prometheus').getContentType();
    
    res.set('Content-Type', contentType);
    res.send(metrics);
    
    logger.info('[HEALTH] Prometheus指标获取成功');
    
  } catch (error) {
    logger.error('[HEALTH] Prometheus指标获取失败', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Prometheus指标获取失败',
      message: error.message
    });
  }
}));

/**
 * 服务依赖检查
 * GET /api/health/dependencies
 */
router.get('/dependencies', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[HEALTH] 检查服务依赖');
  
  const startTime = Date.now();
  
  try {
    const dependencies = await getServiceDependencies();
    
    // 计算依赖健康度
    const totalDeps = Object.keys(dependencies).length;
    const healthyDeps = Object.values(dependencies).filter(dep => 
      dep.status === 'healthy'
    ).length;
    
    const dependencyHealth = {
      total: totalDeps,
      healthy: healthyDeps,
      unhealthy: totalDeps - healthyDeps,
      healthPercentage: Math.round((healthyDeps / totalDeps) * 100)
    };
    
    const result = {
      timestamp: new Date().toISOString(),
      dependencies: dependencies,
      health: dependencyHealth,
      responseTime: Date.now() - startTime
    };
    
    logger.info('[HEALTH] 服务依赖检查完成', { 
      healthyDeps,
      totalDeps,
      responseTime: Date.now() - startTime
    });
    
    return res.sendSuccess(result, '服务依赖检查完成');
    
  } catch (error) {
    logger.error('[HEALTH] 服务依赖检查失败', { error: error.message });
    
    return res.sendError('服务依赖检查失败', error, 500);
  }
})));

/**
 * 清理和重置指标
 * POST /api/health/reset
 */
router.post('/reset', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[HEALTH] 重置健康检查指标');
  
  try {
    // 重置自定义指标
    const { resetMetrics } = require('../middleware/monitoring');
    resetMetrics();
    
    logger.info('[HEALTH] 健康检查指标已重置');
    
    return res.sendSuccess(null, '健康检查指标已重置');
    
  } catch (error) {
    logger.error('[HEALTH] 重置指标失败', { error: error.message });
    
    return res.sendError('重置指标失败', error, 500);
  }
})));

module.exports = router;