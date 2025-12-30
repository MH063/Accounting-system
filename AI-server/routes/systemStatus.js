/**
 * 系统状态评估路由
 * 提供客户端、后端服务、数据库的实时健康状态评估API
 */

const express = require('express');
const router = express.Router();
const { responseWrapper } = require('../middleware/response');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const systemStatusService = require('../services/systemStatusService');
const logger = require('../config/logger');

/**
 * GET /api/status/overall
 * 综合评估系统整体状态
 * 返回所有组件的健康度评分和详细信息
 */
router.get('/overall', authenticateToken, authorizeAdmin, responseWrapper(async (req, res) => {
  logger.info('[SystemStatus] 综合状态评估请求');
  const result = await systemStatusService.evaluateOverallStatus();
  
  res.json({
    success: result.success,
    message: result.success ? '系统状态评估完成' : '系统状态评估失败',
    data: {
      overallStatus: result.overallStatus,
      overallStatusText: result.overallStatusText,
      overallHealthScore: result.overallHealthScore,
      components: result.components,
      summary: result.summary,
      evaluationTime: result['评估时间'],
      lastUpdate: result.lastUpdate,
      issues: result.issues,
      suggestions: result.suggestions
    }
  });
}));

/**
 * GET /api/status/client
 * 评估客户端状态
 * 评估指标：启动时间、运行稳定性、服务可用性
 */
router.get('/client', authenticateToken, authorizeAdmin, responseWrapper(async (req, res) => {
  logger.info('[SystemStatus] 客户端状态评估请求');
  const result = await systemStatusService.evaluateClientStatus();
  
  res.json({
    success: result.success,
    message: result.success ? '客户端状态评估完成' : '客户端状态评估失败',
    data: {
      status: result.status,
      statusText: result.statusText,
      healthScore: result.healthScore,
      metrics: result.metrics,
      evaluationTime: result['评估时间'],
      lastUpdate: result.lastUpdate,
      issues: result.issues,
      suggestions: result.suggestions
    }
  });
}));

/**
 * GET /api/status/metrics/history
 * 获取指定指标的历史趋势数据
 * 参数: type (指标类型), interval (时间范围, 默认24小时)
 */
router.get('/metrics/history', authenticateToken, authorizeAdmin, responseWrapper(async (req, res) => {
  const { type, interval } = req.query;
  if (!type) {
    return res.status(400).json({ success: false, message: '必须提供指标类型' });
  }

  logger.info(`[SystemStatus] 获取历史指标请求: ${type}, 范围: ${interval || '24h'}`);
  const history = await systemStatusService.getMetricsHistory(type, interval);
  
  res.json({
    success: true,
    data: history
  });
}));

/**
 * GET /api/status/backend
 * 评估后端服务状态
 * 评估指标：CPU使用率、内存使用率、事件循环延迟、堆内存
 */
router.get('/backend', authenticateToken, authorizeAdmin, responseWrapper(async (req, res) => {
  logger.info('[SystemStatus] 后端服务状态评估请求');
  const result = await systemStatusService.evaluateBackendStatus();
  
  res.json({
    success: result.success,
    message: result.success ? '后端服务状态评估完成' : '后端服务状态评估失败',
    data: {
      status: result.status,
      statusText: result.statusText,
      healthScore: result.healthScore,
      metrics: result.metrics,
      evaluationTime: result['评估时间'],
      lastUpdate: result.lastUpdate,
      issues: result.issues,
      suggestions: result.suggestions
    }
  });
}));

/**
 * GET /api/status/database
 * 评估数据库状态
 * 评估指标：连接池状态、查询延迟、慢查询、缓存命中率
 */
router.get('/database', authenticateToken, authorizeAdmin, responseWrapper(async (req, res) => {
  logger.info('[SystemStatus] 数据库状态评估请求');
  const result = await systemStatusService.evaluateDatabaseStatus();
  
  res.json({
    success: result.success,
    message: result.success ? '数据库状态评估完成' : '数据库状态评估失败',
    data: {
      status: result.status,
      statusText: result.statusText,
      healthScore: result.healthScore,
      metrics: result.metrics,
      evaluationTime: result['评估时间'],
      lastUpdate: result.lastUpdate,
      issues: result.issues,
      suggestions: result.suggestions
    }
  });
}));

/**
 * GET /api/status/health
 * 快速健康检查
 * 只返回基本健康状态，用于负载均衡器或监控探针
 */
router.get('/health', responseWrapper(async (req, res) => {
  const result = await systemStatusService.quickHealthCheck();
  
  const statusCode = result.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    success: result.status === 'healthy',
    status: result.status,
    timestamp: result.timestamp,
    database: result.database,
    ...(result.error && { error: result.error })
  });
}));

module.exports = router;
