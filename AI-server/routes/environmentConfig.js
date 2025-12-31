const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const configAuditService = require('../services/configAuditService');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');

router.use(authenticateToken);

router.get('/environment/status', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    const status = await configAuditService.getEnvironmentStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('[Environment] Get environment status error:', error);
    res.status(500).json({
      success: false,
      message: '获取环境状态失败',
      error: error.message
    });
  }
}));

router.post('/environment/switch', authorizeAdmin, [
  body('environment').isIn(['development', 'testing', 'production']).withMessage('环境值无效'),
  body('reason').optional().isString().isLength({ max: 500 })
], responseWrapper(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { environment, reason } = req.body;
    const userId = req.user?.id;
    const username = req.user?.username || req.user?.name || '未知用户';
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || '未知';
    const userAgent = req.headers['user-agent'] || '未知';

    console.log(`[Environment] 环境切换请求: ${username}(${userId}) -> ${environment}`);
    console.log(`[Environment] IP地址: ${ipAddress}`);
    console.log(`[Environment] User-Agent: ${userAgent}`);
    console.log(`[Environment] 原因: ${reason || '未提供'}`);

    const result = await configAuditService.switchEnvironment(
      environment,
      userId,
      username,
      reason,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      data: {
        message: result.message,
        oldEnvironment: result.oldEnvironment,
        newEnvironment: result.newEnvironment,
        effectiveTime: result.effectiveTime,
        note: '环境切换已生效，请刷新页面以应用新配置'
      }
    });
  } catch (error) {
    console.error('[Environment] Switch environment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '环境切换失败'
    });
  }
}));

router.get('/audit/logs', authorizeAdmin, [
  query('configKey').optional().isString(),
  query('userId').optional().isInt(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 })
], responseWrapper(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { configKey, userId, startDate, endDate, page, pageSize } = req.query;

    const result = await configAuditService.getAuditLogs({
      configKey,
      userId: userId ? parseInt(userId) : undefined,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 50
    });

    res.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: Math.ceil(result.total / result.pageSize)
      }
    });
  } catch (error) {
    console.error('[ConfigAudit] Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: '获取审计日志失败',
      error: error.message
    });
  }
}));

router.get('/audit/history/:configKey', authorizeAdmin, [
  query('limit').optional().isInt({ min: 1, max: 100 })
], responseWrapper(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { configKey } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const history = await configAuditService.getConfigHistory(configKey, limit);

    res.json({
      success: true,
      data: {
        configKey,
        history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('[ConfigAudit] Get config history error:', error);
    res.status(500).json({
      success: false,
      message: '获取配置历史失败',
      error: error.message
    });
  }
}));

router.post('/audit/rollback/:configKey', authorizeAdmin, [
  body('targetVersion').isInt({ min: 1 }).withMessage('目标版本号必须为正整数'),
  body('reason').optional().isString().isLength({ max: 500 })
], responseWrapper(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { configKey } = req.params;
    const { targetVersion, reason } = req.body;
    const userId = req.user?.id;
    const username = req.user?.username || req.user?.name || '未知用户';
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || '未知';
    const userAgent = req.headers['user-agent'] || '未知';

    const result = await configAuditService.rollbackConfig(
      configKey,
      targetVersion,
      userId,
      username,
      reason,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      data: {
        message: `配置 ${configKey} 已回滚到版本 ${targetVersion}`,
        ...result
      }
    });
  } catch (error) {
    console.error('[ConfigAudit] Rollback config error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '配置回滚失败'
    });
  }
}));

router.post('/audit/initialize', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    await configAuditService.initializeAuditTables();
    
    res.json({
      success: true,
      data: {
        message: '审计日志表初始化完成'
      }
    });
  } catch (error) {
    console.error('[ConfigAudit] Initialize audit tables error:', error);
    res.status(500).json({
      success: false,
      message: '初始化审计日志表失败',
      error: error.message
    });
  }
}));

module.exports = router;
