/**
 * 实时监控仪表板路由
 * 提供实时安全监控和警报功能
 */

const express = require('express');
const router = express.Router();
const { responseWrapper } = require('../middleware/response');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { realTimeMonitor, getAlertStats, getUserAlertHistory } = require('../middleware/security/behaviorAnalysisMiddleware');
const { securityAuditor } = require('../utils/securityAudit');
const { penTester } = require('../utils/penetrationTesting');
const logger = require('../config/logger');

/**
 * 获取实时监控概览
 * 管理员专用
 */
router.get('/overview', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper((req, res) => {
    try {
      // 获取警报统计信息
      const alertStats = getAlertStats();
      
      // 获取系统状态
      const systemStatus = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version
      };
      
      // 获取安全审计状态
      const auditReport = securityAuditor.getLatestAuditReport();
      
      // 获取渗透测试状态
      const penTestReport = penTester.getLatestPenTestReport();
      
      const overview = {
        timestamp: new Date().toISOString(),
        alerts: alertStats,
        system: systemStatus,
        security: {
          audit: {
            lastRun: auditReport?.timestamp || null,
            summary: auditReport?.summary || null
          },
          penetrationTest: {
            lastRun: penTestReport?.timestamp || null,
            summary: penTestReport?.summary || null
          }
        }
      };
      
      return res.sendSuccess({
        message: '实时监控概览获取成功',
        overview
      }, '获取成功');
    } catch (error) {
      logger.error('[MONITOR_DASHBOARD] 获取监控概览失败:', error);
      return res.sendError('获取监控概览失败', 500);
    }
  })
);

/**
 * 获取最近的警报列表
 * 管理员专用
 */
router.get('/recent-alerts', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper((req, res) => {
    try {
      // 获取最近的警报（最多50个）
      const recentAlerts = realTimeMonitor.alerts
        .slice(-50)
        .reverse();
      
      return res.sendSuccess({
        message: '最近警报列表获取成功',
        alerts: recentAlerts,
        count: recentAlerts.length
      }, '获取成功');
    } catch (error) {
      logger.error('[MONITOR_DASHBOARD] 获取最近警报列表失败:', error);
      return res.sendError('获取最近警报列表失败', 500);
    }
  })
);

/**
 * 获取特定用户的详细警报历史
 * 管理员专用
 */
router.get('/user-alerts/:userId', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper((req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 20 } = req.query;
      
      const alertHistory = getUserAlertHistory(userId, parseInt(limit));
      
      return res.sendSuccess({
        message: '用户警报历史获取成功',
        userId,
        alerts: alertHistory,
        count: alertHistory.length
      }, '获取成功');
    } catch (error) {
      logger.error('[MONITOR_DASHBOARD] 获取用户警报历史失败:', error);
      return res.sendError('获取用户警报历史失败', 500);
    }
  })
);

/**
 * 按严重性级别获取警报统计
 * 管理员专用
 */
router.get('/alerts-by-severity', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper((req, res) => {
    try {
      const alertStats = getAlertStats();
      
      return res.sendSuccess({
        message: '按严重性级别统计的警报获取成功',
        severityStats: alertStats.severityCounts
      }, '获取成功');
    } catch (error) {
      logger.error('[MONITOR_DASHBOARD] 获取严重性统计失败:', error);
      return res.sendError('获取严重性统计失败', 500);
    }
  })
);

/**
 * 获取高风险用户列表
 * 管理员专用
 */
router.get('/high-risk-users', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper((req, res) => {
    try {
      // 获取警报统计
      const alertStats = getAlertStats();
      
      // 转换用户警报计数为数组并排序
      const userAlertArray = Object.entries(alertStats.userAlertCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // 获取前20个高风险用户
      
      return res.sendSuccess({
        message: '高风险用户列表获取成功',
        highRiskUsers: userAlertArray
      }, '获取成功');
    } catch (error) {
      logger.error('[MONITOR_DASHBOARD] 获取高风险用户列表失败:', error);
      return res.sendError('获取高风险用户列表失败', 500);
    }
  })
);

/**
 * 手动触发安全警报测试
 * 管理员专用
 */
router.post('/test-alert', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper((req, res) => {
    try {
      const { userId, severity = 'MEDIUM' } = req.body;
      
      // 构造测试事件
      const testEvent = {
        userId: userId || req.user.id,
        action: 'TEST',
        resource: '/api/monitor/test-alert',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || '',
        timestamp: Date.now()
      };
      
      // 构造测试检测结果
      const testDetectionResult = {
        isAnomaly: true,
        score: severity === 'CRITICAL' ? 0.95 : 
               severity === 'HIGH' ? 0.8 : 
               severity === 'MEDIUM' ? 0.6 : 0.3,
        reasons: ['手动测试警报'],
        severity: severity
      };
      
      // 触发测试警报
      const alert = {
        id: `test_alert_${Date.now()}`,
        timestamp: Date.now(),
        userId: testEvent.userId,
        event: testEvent,
        detectionResult: testDetectionResult,
        severity: severity
      };
      
      // 记录测试警报
      realTimeMonitor.alerts.push(alert);
      
      // 发送测试警报
      logger.warn(`[TEST_ALERT] ${severity} 级别测试警报`, {
        alertId: alert.id,
        userId: testEvent.userId,
        score: testDetectionResult.score,
        reasons: testDetectionResult.reasons
      });
      
      return res.sendSuccess({
        message: '测试警报触发成功',
        alertId: alert.id
      }, '测试完成');
    } catch (error) {
      logger.error('[MONITOR_DASHBOARD] 触发测试警报失败:', error);
      return res.sendError('触发测试警报失败', 500);
    }
  })
);

/**
 * 清除警报历史
 * 管理员专用
 */
router.delete('/clear-alerts', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper((req, res) => {
    try {
      const alertCount = realTimeMonitor.alerts.length;
      
      // 清除警报历史
      realTimeMonitor.alerts = [];
      
      // 重置用户警报计数器
      realTimeMonitor.userAlertCounts.clear();
      
      logger.info('[MONITOR_DASHBOARD] 警报历史已清除', {
        clearedAlerts: alertCount
      });
      
      return res.sendSuccess({
        message: '警报历史清除成功',
        clearedAlerts: alertCount
      }, '清除完成');
    } catch (error) {
      logger.error('[MONITOR_DASHBOARD] 清除警报历史失败:', error);
      return res.sendError('清除警报历史失败', 500);
    }
  })
);

module.exports = router;