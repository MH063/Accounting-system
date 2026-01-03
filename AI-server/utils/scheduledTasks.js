const cron = require('node-cron');
const { logManager } = require('./logManager');
const { logger } = require('../config/logger');
const databaseOptimizer = require('./databaseOptimizer');
const systemStatusService = require('../services/systemStatusService');
const auditCleanupService = require('../services/auditCleanupService');

/**
 * 审计日志自动清理任务
 * 每天凌晨2点执行，处理无效请求记录、过期普通日志并进行备份
 */
const auditCleanupTask = cron.schedule('0 2 * * *', async () => {
  logger.info('[CRON] 开始执行审计日志自动清理任务');
  
  try {
    const result = await auditCleanupService.performCleanup();
    
    if (!result.success) {
      logger.error(`[CRON] 审计日志清理任务失败: ${result.errors.join(', ')}`);
    } else {
      logger.info(`[CRON] 审计日志清理任务完成: 备份 ${result.backedUpCount} 条, 清理 ${result.cleanedCount} 条, 物理删除 ${result.physicalDeletedCount} 条`);
    }
  } catch (error) {
    logger.error(`[CRON] 审计日志清理任务异常: ${error.message}`);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Shanghai'
});

/**
 * 系统指标记录任务
 * 每分钟执行一次，记录在线人数等关键指标
 */
const systemMetricsTask = cron.schedule('* * * * *', async () => {
  try {
    // 1. 获取客户端在线人数指标
    const onlineData = await systemStatusService.getRealOnlineUserCount();
    await systemStatusService.recordMetric(
      'ACTIVE_USERS', 
      'Real-time Online Users', 
      onlineData.total, 
      'count'
    );

    // 2. 获取后端响应时间指标
    const backendData = await systemStatusService.evaluateBackendStatus();
    if (backendData.success) {
      await systemStatusService.recordMetric(
        'API_RESPONSE_TIME',
        'API Average Response Time',
        backendData.metrics.apiResponseTime,
        'ms'
      );
    }

    // 3. 获取数据库连接指标
    const dbData = await systemStatusService.evaluateDatabaseStatus();
    if (dbData.success) {
      await systemStatusService.recordMetric(
        'DATABASE_CONNECTIONS',
        'Database Active Connections',
        dbData.metrics.activeConnections,
        'count'
      );
    }

    logger.debug('[CRON] 系统多维度指标记录成功');
  } catch (error) {
    logger.error(`[CRON] 系统指标记录异常: ${error.message}`);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Shanghai'
});

/**
 * 数据库健康检查任务
 * 每10分钟执行一次，监控连接池、慢查询和回滚率
 */
const dbHealthCheckTask = cron.schedule('*/10 * * * *', async () => {
  logger.info('[CRON] 开始执行数据库健康检查');
  
  try {
    const result = await databaseOptimizer.checkHealthAndAlert();
    if (result.status !== 'HEALTHY') {
      logger.warn(`[CRON] 数据库健康检查提醒: 状态为 ${result.status}，发现 ${result.alerts.length} 个潜在问题`);
    } else {
      logger.info('[CRON] 数据库健康检查完成，系统运行良好');
    }
  } catch (error) {
    logger.error(`[CRON] 数据库健康检查异常: ${error.message}`);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Shanghai'
});

/**
 * 日志清理任务
 * 每天凌晨2点执行，清理90天前的日志文件
 */
const logCleanupTask = cron.schedule('0 2 * * *', () => {
  logger.info('[CRON] 开始执行日志清理任务');
  
  try {
    const result = logManager.cleanupOldLogs(90);
    
    if (result.error) {
      logger.error(`[CRON] 日志清理任务失败: ${result.error}`);
    } else {
      logger.info(`[CRON] 日志清理任务完成: 删除了 ${result.deletedCount} 个文件，释放了 ${result.deletedSize} 空间`);
    }
  } catch (error) {
    logger.error(`[CRON] 日志清理任务异常: ${error.message}`);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Shanghai'
});

/**
 * 启动所有定时任务
 */
function startScheduledTasks() {
  logCleanupTask.start();
  dbHealthCheckTask.start();
  systemMetricsTask.start();
  auditCleanupTask.start();
  logger.info('[CRON] 所有定时任务已启动');
}

/**
 * 停止所有定时任务
 */
function stopScheduledTasks() {
  logCleanupTask.stop();
  dbHealthCheckTask.stop();
  systemMetricsTask.stop();
  auditCleanupTask.stop();
  logger.info('[CRON] 所有定时任务已停止');
}

module.exports = {
  logCleanupTask,
  auditCleanupTask,
  startScheduledTasks,
  stopScheduledTasks
};