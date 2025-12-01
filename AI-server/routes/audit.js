/**
 * 审计日志路由
 * 提供审计日志的查看、分析和报告功能
 */

const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/AuditController');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// 认证中间件 - 所有审计日志接口都需要认证
router.use(authenticateToken);

/**
 * 审计日志访问限制
 * 防止大量查询影响系统性能
 */
const auditQueryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 生成报告限制
 * 生成报告消耗较多资源，需要更严格的限制
 */
const reportGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每个IP最多10次报告生成
  message: {
    success: false,
    message: '报告生成过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * GET /api/audit/security
 * 获取安全审计日志
 */
router.get('/security', auditQueryLimiter, async (req, res) => {
  try {
    const auditController = new AuditController();
    await auditController.getSecurityLogs(req, res);
  } catch (error) {
    console.error('[AuditRoute] 获取安全审计日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取安全审计日志失败',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/operations
 * 获取操作审计日志
 */
router.get('/operations', auditQueryLimiter, async (req, res) => {
  try {
    const auditController = new AuditController();
    await auditController.getOperationLogs(req, res);
  } catch (error) {
    console.error('[AuditRoute] 获取操作审计日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取操作审计日志失败',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/login
 * 获取登录审计日志
 */
router.get('/login', auditQueryLimiter, async (req, res) => {
  try {
    const auditController = new AuditController();
    await auditController.getLoginLogs(req, res);
  } catch (error) {
    console.error('[AuditRoute] 获取登录审计日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取登录审计日志失败',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/anomaly
 * 获取异常审计日志
 */
router.get('/anomaly', auditQueryLimiter, async (req, res) => {
  try {
    const auditController = new AuditController();
    await auditController.getAnomalyLogs(req, res);
  } catch (error) {
    console.error('[AuditRoute] 获取异常审计日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取异常审计日志失败',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/stats
 * 获取审计日志统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    const auditController = new AuditController();
    await auditController.getAuditStats(req, res);
  } catch (error) {
    console.error('[AuditRoute] 获取审计统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取审计统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/report
 * 生成审计报告
 */
router.get('/report', reportGenerationLimiter, async (req, res) => {
  try {
    const auditController = new AuditController();
    await auditController.generateAuditReport(req, res);
  } catch (error) {
    console.error('[AuditRoute] 生成审计报告失败:', error);
    res.status(500).json({
      success: false,
      message: '生成审计报告失败',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/export
 * 导出审计日志数据
 */
router.get('/export', reportGenerationLimiter, async (req, res) => {
  try {
    const {
      startTime,
      endTime,
      type = 'all' // 'security', 'operations', 'login', 'anomaly', 'all'
    } = req.query;

    const auditController = new AuditController();
    let logs = [];

    // 根据类型获取相应的日志
    switch (type) {
      case 'security':
        logs = auditController.readLogFile(auditController.logFiles.security, 10000);
        break;
      case 'operations':
        logs = auditController.readLogFile(auditController.logFiles.operation, 10000);
        break;
      case 'login':
        logs = auditController.readLogFile(auditController.logFiles.login, 10000);
        break;
      case 'anomaly':
        logs = auditController.readLogFile(auditController.logFiles.anomaly, 10000);
        break;
      case 'all':
        // 获取所有类型的日志
        const securityLogs = auditController.readLogFile(auditController.logFiles.security, 10000);
        const operationLogs = auditController.readLogFile(auditController.logFiles.operation, 10000);
        const loginLogs = auditController.readLogFile(auditController.logFiles.login, 10000);
        const anomalyLogs = auditController.readLogFile(auditController.logFiles.anomaly, 10000);
        
        logs = [
          ...securityLogs.map(log => ({ ...log, logType: 'security' })),
          ...operationLogs.map(log => ({ ...log, logType: 'operation' })),
          ...loginLogs.map(log => ({ ...log, logType: 'login' })),
          ...anomalyLogs.map(log => ({ ...log, logType: 'anomaly' }))
        ];
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '无效的日志类型'
        });
    }

    // 时间范围过滤
    const filteredLogs = auditController.filterLogEntries(logs, { startTime, endTime });

    // 设置响应头，告知浏览器下载文件
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit-log-${type}-${Date.now()}.json"`);

    // 记录导出操作
    const logger = require('../config/logger');
    logger.audit(req, '审计日志导出', {
      type,
      exportCount: filteredLogs.length,
      timeRange: { startTime, endTime }
    });

    // 返回日志数据
    res.json({
      success: true,
      exportInfo: {
        type,
        startTime,
        endTime,
        exportedAt: new Date().toISOString(),
        recordCount: filteredLogs.length
      },
      logs: filteredLogs
    });

  } catch (error) {
    console.error('[AuditRoute] 导出审计日志失败:', error);
    res.status(500).json({
      success: false,
      message: '导出审计日志失败',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/realtime
 * 获取实时异常监控数据
 */
router.get('/realtime', async (req, res) => {
  try {
    const { getAnomalyStats } = require('../security/anomalyDetector');
    const stats = getAnomalyStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[AuditRoute] 获取实时监控数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取实时监控数据失败',
      error: error.message
    });
  }
});

/**
 * POST /api/audit/clear-data
 * 清除异常检测数据（管理员功能）
 */
router.post('/clear-data', async (req, res) => {
  try {
    const { type = 'all' } = req.body;

    // 权限检查（这里应该添加更严格的权限控制）
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，仅管理员可以清除异常检测数据'
      });
    }

    const { clearAnomalyData } = require('../security/anomalyDetector');
    clearAnomalyData(type);

    const logger = require('../config/logger');
    logger.audit(req, '清除异常检测数据', {
      clearedType: type,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `已清除 ${type} 类型的异常检测数据`
    });

  } catch (error) {
    console.error('[AuditRoute] 清除异常检测数据失败:', error);
    res.status(500).json({
      success: false,
      message: '清除异常检测数据失败',
      error: error.message
    });
  }
});

module.exports = router;