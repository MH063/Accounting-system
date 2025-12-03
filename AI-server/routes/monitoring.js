/**
 * 监控和告警路由
 * 提供监控数据API和告警管理功能
 */

const express = require('express');
const router = express.Router();
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');
const logger = require('../config/logger');
const { getMetrics, resetMetrics } = require('../middleware/monitoring');
const { getTraces, getPerformanceStats } = require('../middleware/apm');

/**
 * 告警规则配置
 */
const alertRules = {
  high_cpu_usage: {
    name: 'CPU使用率过高',
    metric: 'cpu_usage',
    threshold: 80,
    duration: 5 * 60 * 1000, // 5分钟
    severity: 'warning',
    enabled: true
  },
  high_memory_usage: {
    name: '内存使用率过高',
    metric: 'memory_usage',
    threshold: 85,
    duration: 5 * 60 * 1000, // 5分钟
    severity: 'warning',
    enabled: true
  },
  high_error_rate: {
    name: '错误率过高',
    metric: 'error_rate',
    threshold: 10, // 10%
    duration: 10 * 60 * 1000, // 10分钟
    severity: 'critical',
    enabled: true
  },
  slow_requests: {
    name: '慢请求过多',
    metric: 'slow_requests',
    threshold: 20, // 超过2秒的请求超过20个
    duration: 5 * 60 * 1000, // 5分钟
    severity: 'warning',
    enabled: true
  },
  database_connection_failures: {
    name: '数据库连接失败',
    metric: 'database_health',
    threshold: 0, // 健康分数为0
    duration: 1 * 60 * 1000, // 1分钟
    severity: 'critical',
    enabled: true
  }
};

/**
 * 告警状态存储
 */
const alertStatus = {};

/**
 * 获取当前监控指标
 * GET /api/monitoring/metrics
 */
router.get('/metrics', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[MONITORING] 获取监控指标');
  
  try {
    const metrics = getMetrics();
    
    // 添加告警状态
    const alerts = checkAlerts(metrics);
    
    const result = {
      timestamp: new Date().toISOString(),
      metrics,
      alerts,
      rules: Object.keys(alertRules).length
    };
    
    logger.info('[MONITORING] 监控指标获取成功');
    
    return res.sendSuccess(result, '监控指标获取成功');
    
  } catch (error) {
    logger.error('[MONITORING] 监控指标获取失败', { error: error.message });
    
    return res.sendError('监控指标获取失败', error, 500);
  }
})));

/**
 * 获取性能跟踪数据
 * GET /api/monitoring/traces
 */
router.get('/traces', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[MONITORING] 获取性能跟踪数据');
  
  try {
    const {
      limit = 100,
      offset = 0,
      operation,
      status,
      min_duration,
      max_duration,
      start_time,
      end_time
    } = req.query;
    
    const traces = getTraces({
      limit: parseInt(limit),
      offset: parseInt(offset),
      operation,
      status,
      minDuration: min_duration ? parseInt(min_duration) : undefined,
      maxDuration: max_duration ? parseInt(max_duration) : undefined,
      startTime: start_time,
      endTime: end_time
    });
    
    logger.info('[MONITORING] 性能跟踪数据获取成功', { 
      count: traces.traces.length,
      total: traces.pagination.total 
    });
    
    return res.sendSuccess(traces, '性能跟踪数据获取成功');
    
  } catch (error) {
    logger.error('[MONITORING] 性能跟踪数据获取失败', { error: error.message });
    
    return res.sendError('性能跟踪数据获取失败', error, 500);
  }
})));

/**
 * 获取性能统计
 * GET /api/monitoring/performance-stats
 */
router.get('/performance-stats', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[MONITORING] 获取性能统计');
  
  try {
    const { time_range = '1h' } = req.query;
    
    const stats = getPerformanceStats(time_range);
    
    logger.info('[MONITORING] 性能统计获取成功', { time_range });
    
    return res.sendSuccess(stats, '性能统计获取成功');
    
  } catch (error) {
    logger.error('[MONITORING] 性能统计获取失败', { error: error.message });
    
    return res.sendError('性能统计获取失败', error, 500);
  }
})));

/**
 * 获取告警规则
 * GET /api/monitoring/alerts/rules
 */
router.get('/alerts/rules', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[MONITORING] 获取告警规则');
  
  try {
    const rules = Object.entries(alertRules).map(([id, rule]) => ({
      id,
      ...rule
    }));
    
    logger.info('[MONITORING] 告警规则获取成功', { count: rules.length });
    
    return res.sendSuccess({ rules }, '告警规则获取成功');
    
  } catch (error) {
    logger.error('[MONITORING] 告警规则获取失败', { error: error.message });
    
    return res.sendError('告警规则获取失败', error, 500);
  }
})));

/**
 * 获取当前告警状态
 * GET /api/monitoring/alerts/status
 */
router.get('/alerts/status', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[MONITORING] 获取告警状态');
  
  try {
    const metrics = getMetrics();
    const alerts = checkAlerts(metrics);
    
    const result = {
      timestamp: new Date().toISOString(),
      activeAlerts: alerts.filter(alert => alert.state === 'firing'),
      pendingAlerts: alerts.filter(alert => alert.state === 'pending'),
      resolvedAlerts: alerts.filter(alert => alert.state === 'resolved'),
      totalAlerts: alerts.length
    };
    
    logger.info('[MONITORING] 告警状态获取成功', { 
      active: result.activeAlerts.length,
      total: result.totalAlerts 
    });
    
    return res.sendSuccess(result, '告警状态获取成功');
    
  } catch (error) {
    logger.error('[MONITORING] 告警状态获取失败', { error: error.message });
    
    return res.sendError('告警状态获取失败', error, 500);
  }
})));

/**
 * 重置监控指标
 * POST /api/monitoring/reset
 */
router.post('/reset', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[MONITORING] 重置监控指标');
  
  try {
    resetMetrics();
    
    // 重置告警状态
    Object.keys(alertStatus).forEach(key => {
      delete alertStatus[key];
    });
    
    logger.info('[MONITORING] 监控指标已重置');
    
    return res.sendSuccess(null, '监控指标已重置');
    
  } catch (error) {
    logger.error('[MONITORING] 重置监控指标失败', { error: error.message });
    
    return res.sendError('重置监控指标失败', error, 500);
  }
})));

/**
 * 检查告警规则
 */
function checkAlerts(metrics) {
  const alerts = [];
  const now = Date.now();
  
  // 获取当前系统指标
  const systemMetrics = metrics.system;
  const requestMetrics = metrics.requests;
  const databaseMetrics = metrics.database;
  
  // 检查CPU使用率
  if (alertRules.high_cpu_usage.enabled && systemMetrics.current?.cpu) {
    const cpuUsage = systemMetrics.current.cpu.usage;
    const rule = alertRules.high_cpu_usage;
    
    if (cpuUsage > rule.threshold) {
      const alert = createAlert('high_cpu_usage', rule, {
        current: cpuUsage,
        threshold: rule.threshold,
        message: `CPU使用率 ${cpuUsage}% 超过阈值 ${rule.threshold}%`
      });
      alerts.push(alert);
    }
  }
  
  // 检查内存使用率
  if (alertRules.high_memory_usage.enabled && systemMetrics.current?.memory) {
    const memoryUsage = systemMetrics.current.memory.usage;
    const rule = alertRules.high_memory_usage;
    
    if (memoryUsage > rule.threshold) {
      const alert = createAlert('high_memory_usage', rule, {
        current: memoryUsage,
        threshold: rule.threshold,
        message: `内存使用率 ${memoryUsage}% 超过阈值 ${rule.threshold}%`
      });
      alerts.push(alert);
    }
  }
  
  // 检查错误率
  if (alertRules.high_error_rate.enabled && requestMetrics.total > 0) {
    const errorRate = (requestMetrics.error / requestMetrics.total) * 100;
    const rule = alertRules.high_error_rate;
    
    if (errorRate > rule.threshold) {
      const alert = createAlert('high_error_rate', rule, {
        current: errorRate,
        threshold: rule.threshold,
        message: `错误率 ${errorRate.toFixed(2)}% 超过阈值 ${rule.threshold}%`
      });
      alerts.push(alert);
    }
  }
  
  // 检查慢请求
  if (alertRules.slow_requests.enabled) {
    const slowRequests = requestMetrics.byStatus['timeout'] || 0;
    const rule = alertRules.slow_requests;
    
    if (slowRequests > rule.threshold) {
      const alert = createAlert('slow_requests', rule, {
        current: slowRequests,
        threshold: rule.threshold,
        message: `慢请求数量 ${slowRequests} 超过阈值 ${rule.threshold}`
      });
      alerts.push(alert);
    }
  }
  
  // 检查数据库健康
  if (alertRules.database_connection_failures.enabled && databaseMetrics) {
    const dbHealthScore = databaseMetrics.healthScore || 100;
    const rule = alertRules.database_connection_failures;
    
    if (dbHealthScore <= rule.threshold) {
      const alert = createAlert('database_connection_failures', rule, {
        current: dbHealthScore,
        threshold: rule.threshold,
        message: `数据库健康评分 ${dbHealthScore} 低于阈值 ${rule.threshold}`
      });
      alerts.push(alert);
    }
  }
  
  return alerts;
}

/**
 * 创建告警
 */
function createAlert(ruleId, rule, data) {
  const alertKey = `${ruleId}-${data.current}`;
  const now = Date.now();
  
  // 获取或创建告警状态
  if (!alertStatus[alertKey]) {
    alertStatus[alertKey] = {
      ruleId,
      state: 'pending',
      startsAt: now,
      lastEvaluation: now,
      count: 0
    };
  }
  
  const status = alertStatus[alertKey];
  status.lastEvaluation = now;
  status.count++;
  
  // 检查持续时间
  const duration = now - status.startsAt;
  if (duration >= rule.duration) {
    status.state = 'firing';
  }
  
  return {
    id: alertKey,
    ruleId,
    name: rule.name,
    severity: rule.severity,
    state: status.state,
    startsAt: new Date(status.startsAt).toISOString(),
    lastEvaluation: new Date(status.lastEvaluation).toISOString(),
    duration,
    data,
    count: status.count
  };
}

module.exports = router;