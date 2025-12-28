const cron = require('node-cron');
const { logManager } = require('./logManager');
const { logger } = require('../config/logger');
const databaseOptimizer = require('./databaseOptimizer');

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
  logger.info('[CRON] 所有定时任务已启动');
}

/**
 * 停止所有定时任务
 */
function stopScheduledTasks() {
  logCleanupTask.stop();
  dbHealthCheckTask.stop();
  logger.info('[CRON] 所有定时任务已停止');
}

module.exports = {
  logCleanupTask,
  startScheduledTasks,
  stopScheduledTasks
};