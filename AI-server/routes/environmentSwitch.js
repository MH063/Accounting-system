const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const environmentSwitchService = require('../services/environmentSwitchService');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const configAuditService = require('../services/configAuditService');

router.use(authenticateToken);

/**
 * 获取当前环境信息
 */
router.get('/environment/info', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    const currentEnv = environmentSwitchService.getCurrentEnvironment();
    const envInfo = environmentSwitchService.ENVIRONMENTS[currentEnv] || {
      name: '未知环境',
      description: '',
      features: []
    };

    res.json({
      success: true,
      data: {
        currentEnvironment: currentEnv,
        environmentDisplay: envInfo.name,
        environmentDescription: envInfo.description,
        environmentFeatures: envInfo.features,
        availableEnvironments: Object.keys(environmentSwitchService.ENVIRONMENTS),
        serverUptime: process.uptime(),
        nodeVersion: process.version,
        pid: process.pid
      }
    });
  } catch (error) {
    console.error('[Environment] 获取环境信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取环境信息失败',
      error: error.message
    });
  }
}));

/**
 * 获取可用环境列表
 */
router.get('/environment/list', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    const environments = Object.entries(environmentSwitchService.ENVIRONMENTS).map(([key, value]) => ({
      id: key,
      name: value.name,
      description: value.description,
      features: value.features
    }));

    res.json({
      success: true,
      data: {
        current: environmentSwitchService.getCurrentEnvironment(),
        environments
      }
    });
  } catch (error) {
    console.error('[Environment] 获取环境列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取环境列表失败',
      error: error.message
    });
  }
}));

/**
 * 执行环境切换
 */
router.post('/environment/switch', authorizeAdmin, [
  body('environment').isIn(['development', 'testing', 'production']).withMessage('无效的环境值'),
  body('reason').optional().isString().isLength({ max: 500 })
], responseWrapper(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array()
    });
  }

  try {
    const { environment: targetEnv, reason } = req.body;
    const userId = req.user?.id || 1;
    const username = req.user?.username || req.user?.name || '管理员';
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || '未知';

    console.log(`[Environment] 环境切换请求: ${username}(${userId}) -> ${targetEnv}`);
    console.log(`[Environment] IP地址: ${ipAddress}`);
    console.log(`[Environment] 原因: ${reason || '未提供'}`);

    // 执行环境切换
    const result = await environmentSwitchService.switchEnvironment(targetEnv, {
      username,
      reason: reason || '通过管理界面切换环境'
    });

    // 记录审计日志
    try {
      await configAuditService.logConfigChange({
        configKey: 'system.environment',
        oldValue: result.oldEnv,
        newValue: targetEnv,
        changeType: 'environment_switch',
        userId,
        username,
        ipAddress,
        userAgent: req.headers['user-agent'],
        reason: reason || '环境切换'
      });
    } catch (auditError) {
      console.error('[ConfigAudit] 记录环境切换审计日志失败:', auditError.message);
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message,
        error: '环境切换失败'
      });
    }

    // 先发送响应给前端，再执行重启
    res.json({
      success: true,
      data: {
        message: result.message,
        oldEnvironment: result.oldEnv,
        newEnvironment: result.newEnv,
        environmentInfo: environmentSwitchService.ENVIRONMENTS[result.newEnv],
        duration: result.duration,
        restartRequired: true,
        note: '服务正在重启中，请稍后刷新页面...'
      }
    });

    // 在后台执行重启操作
    setTimeout(async () => {
      try {
        console.log('[Environment] 开始后台重启服务...');
        
        // 关闭当前服务
        await environmentSwitchService.shutdownServer();
        
        // 延迟后启动新服务
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 启动服务
        await environmentSwitchService.startServer();
        
        console.log('[Environment] 服务重启完成');
      } catch (err) {
        console.error('[Environment] 后台重启失败:', err.message);
      }
    }, 1000);
  } catch (error) {
    console.error('[Environment] 环境切换失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '环境切换失败',
      error: '环境切换过程中发生错误'
    });
  }
}));

/**
 * 获取环境切换状态
 */
router.get('/environment/status', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    const currentEnv = environmentSwitchService.getCurrentEnvironment();
    const serverUptime = process.uptime();

    // 检查服务健康状态
    const healthCheck = await environmentSwitchService.checkHealth(5000);

    res.json({
      success: true,
      data: {
        currentEnvironment: currentEnv,
        environmentDisplay: environmentSwitchService.ENVIRONMENTS[currentEnv]?.name || currentEnv,
        serverUptime: serverUptime,
        serverUptimeFormatted: formatUptime(serverUptime),
        serviceHealthy: healthCheck.success,
        lastHealthCheck: healthCheck,
        note: serverUptime < 60 ? '服务刚刚重启' : '服务运行正常'
      }
    });
  } catch (error) {
    console.error('[Environment] 获取环境状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取环境状态失败',
      error: error.message
    });
  }
}));

/**
 * 格式化的运行时间
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (mins > 0) parts.push(`${mins}分钟`);
  parts.push(`${secs}秒`);

  return parts.join(' ');
}

module.exports = router;
