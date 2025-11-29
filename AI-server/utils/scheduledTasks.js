const cron = require('node-cron');
const { logManager } = require('./logManager');
const { logger } = require('../config/logger');

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
  logger.info('[CRON] 所有定时任务已启动');
}

/**
 * 停止所有定时任务
 */
function stopScheduledTasks() {
  logCleanupTask.stop();
  logger.info('[CRON] 所有定时任务已停止');
}

module.exports = {
  logCleanupTask,
  startScheduledTasks,
  stopScheduledTasks
};