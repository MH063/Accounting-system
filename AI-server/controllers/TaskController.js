const {
  startScheduledTasks,
  stopScheduledTasks,
  startTask,
  stopTask,
  restartTask,
  executeTaskManually,
  getTaskStatus,
  getTaskHistory
} = require('../utils/scheduledTasks');

const { logger } = require('../config/logger');
const { successResponse, errorResponse } = require('../middleware/response');

/**
 * 定时任务管理控制器
 */
class TaskController {
  /**
   * 获取所有定时任务状态
   * @route GET /api/tasks/status
   */
  static async getTaskStatus(req, res) {
    try {
      const status = getTaskStatus();
      
      return successResponse(res, status, '获取定时任务状态成功');
    } catch (error) {
      logger.error('获取定时任务状态失败', error);
      return errorResponse(res, '获取任务状态失败', 500);
    }
  }

  /**
   * 获取任务执行历史
   * @route GET /api/tasks/history
   */
  static async getTaskHistory(req, res) {
    try {
      const { limit = 100, taskName } = req.query;
      const history = getTaskHistory(parseInt(limit), taskName);
      
      return successResponse(res, {
        history,
        total: history.length,
        filter: taskName || 'all'
      }, '获取任务历史成功');
    } catch (error) {
      logger.error('获取任务历史失败', error);
      return errorResponse(res, '获取任务历史失败', 500);
    }
  }

  /**
   * 启动所有定时任务
   * @route POST /api/tasks/start-all
   */
  static async startAllTasks(req, res) {
    try {
      startScheduledTasks();
      
      const status = getTaskStatus();
      
      return successResponse(res, status, '所有定时任务已启动');
    } catch (error) {
      logger.error('启动所有定时任务失败', error);
      return errorResponse(res, '启动任务失败', 500);
    }
  }

  /**
   * 停止所有定时任务
   * @route POST /api/tasks/stop-all
   */
  static async stopAllTasks(req, res) {
    try {
      stopScheduledTasks();
      
      logger.info('停止所有定时任务成功');
      return successResponse(res, null, '所有定时任务已停止');
    } catch (error) {
      logger.error('停止所有定时任务失败', error);
      return errorResponse(res, '停止任务失败', 500);
    }
  }

  /**
   * 启动指定任务
   * @route POST /api/tasks/start/:taskName
   */
  static async startSpecificTask(req, res) {
    try {
      const { taskName } = req.params;
      
      if (!taskName) {
        return errorResponse(res, '任务名称不能为空', 400);
      }
      
      startTask(taskName);
      
      const status = getTaskStatus();
      
      logger.info(`启动定时任务成功: ${taskName}`);
      return successResponse(res, {
        taskName,
        status: status.tasks[taskName]
      }, `任务 ${taskName} 已启动`);
    } catch (error) {
      logger.error(`启动定时任务失败: ${req.params.taskName}`, error);
      return errorResponse(res, '启动任务失败', 500);
    }
  }

  /**
   * 停止指定任务
   * @route POST /api/tasks/stop/:taskName
   */
  static async stopSpecificTask(req, res) {
    try {
      const { taskName } = req.params;
      
      if (!taskName) {
        return errorResponse(res, '任务名称不能为空', 400);
      }
      
      stopTask(taskName);
      
      logger.info(`停止定时任务成功: ${taskName}`);
      return successResponse(res, {
        taskName,
        status: {
          running: false,
          scheduled: true
        }
      }, `任务 ${taskName} 已停止`);
    } catch (error) {
      logger.error(`停止定时任务失败: ${req.params.taskName}`, error);
      return errorResponse(res, '停止任务失败', 500);
    }
  }

  /**
   * 重启指定任务
   * @route POST /api/tasks/restart/:taskName
   */
  static async restartSpecificTask(req, res) {
    try {
      const { taskName } = req.params;
      
      if (!taskName) {
        return errorResponse(res, '任务名称不能为空', 400);
      }
      
      restartTask(taskName);
      
      const status = getTaskStatus();
      
      logger.info(`重启定时任务成功: ${taskName}`);
      return successResponse(res, {
        taskName,
        status: status.tasks[taskName]
      }, `任务 ${taskName} 已重启`);
    } catch (error) {
      logger.error(`重启定时任务失败: ${req.params.taskName}`, error);
      return errorResponse(res, '重启任务失败', 500);
    }
  }

  /**
   * 手动执行指定任务
   * @route POST /api/tasks/execute/:taskName
   */
  static async executeSpecificTask(req, res) {
    try {
      const { taskName } = req.params;
      
      if (!taskName) {
        return errorResponse(res, '任务名称不能为空', 400);
      }
      
      // 验证任务名称
      const validTasks = ['logCleanup', 'databaseBackup', 'queueCleanup', 'fileOptimization', 'healthCheck'];
      if (!validTasks.includes(taskName)) {
        return errorResponse(res, `无效的任务名称。有效任务: ${validTasks.join(', ')}`, 400);
      }
      
      const result = await executeTaskManually(taskName);
      
      logger.info(`手动执行任务请求已提交: ${taskName}`);
      return successResponse(res, {
        taskName,
        timestamp: new Date().toISOString()
      }, `任务 ${taskName} 已触发手动执行`);
    } catch (error) {
      logger.error(`手动执行任务失败: ${req.params.taskName}`, error);
      return errorResponse(res, '执行任务失败', 500);
    }
  }

  /**
   * 获取可用任务列表
   * @route GET /api/tasks/available
   */
  static async getAvailableTasks(req, res) {
    try {
      const availableTasks = [
        {
          name: 'logCleanup',
          description: '日志清理任务 - 每天凌晨2点执行，清理90天前的日志文件',
          schedule: '0 2 * * *',
          category: 'maintenance'
        },
        {
          name: 'databaseBackup',
          description: '数据库备份任务 - 每天凌晨3点执行数据库备份',
          schedule: '0 3 * * *',
          category: 'maintenance'
        },
        {
          name: 'queueCleanup',
          description: '队列清理任务 - 每小时执行，清理过期的队列数据',
          schedule: '0 * * * *',
          category: 'maintenance'
        },
        {
          name: 'fileOptimization',
          description: '文件存储优化任务 - 每天凌晨4点执行，优化文件存储',
          schedule: '0 4 * * *',
          category: 'maintenance'
        },
        {
          name: 'healthCheck',
          description: '系统健康检查任务 - 每10分钟执行系统健康检查',
          schedule: '*/10 * * * *',
          category: 'monitoring'
        }
      ];
      
      logger.info('获取可用任务列表成功', { taskCount: availableTasks.length });
      return successResponse(res, {
        tasks: availableTasks,
        total: availableTasks.length
      }, '获取可用任务列表成功');
    } catch (error) {
      logger.error('获取可用任务列表失败', error);
      return errorResponse(res, '获取任务列表失败', 500);
    }
  }

  /**
   * 获取任务执行统计
   * @route GET /api/tasks/stats
   */
  static async getTaskStats(req, res) {
    try {
      const status = getTaskStatus();
      const history = getTaskHistory(1000); // 获取所有历史记录
      
      // 计算统计信息
      const stats = {
        totalExecutions: status.stats.executed,
        successRate: status.stats.executed > 0 
          ? Math.round((status.stats.success / status.stats.executed) * 100) 
          : 0,
        taskBreakdown: {},
        recentPerformance: history.slice(-10).map(record => ({
          taskName: record.taskName,
          success: record.success,
          duration: record.duration,
          timestamp: record.timestamp
        }))
      };
      
      // 计算各任务的执行统计
      for (const record of history) {
        if (!stats.taskBreakdown[record.taskName]) {
          stats.taskBreakdown[record.taskName] = {
            total: 0,
            success: 0,
            failed: 0,
            avgDuration: 0
          };
        }
        
        const taskStats = stats.taskBreakdown[record.taskName];
        taskStats.total++;
        if (record.success) {
          taskStats.success++;
        } else {
          taskStats.failed++;
        }
        
        // 简单累加持续时间，稍后计算平均值
        taskStats.avgDuration += (record.duration || 0);
      }
      
      // 计算各任务平均持续时间
      for (const taskName in stats.taskBreakdown) {
        const taskStats = stats.taskBreakdown[taskName];
        if (taskStats.total > 0) {
          taskStats.avgDuration = Math.round(taskStats.avgDuration / taskStats.total);
        }
      }
      
      logger.info('获取定时任务统计成功');
      return successResponse(res, stats, '获取定时任务统计成功');
    } catch (error) {
      logger.error('获取定时任务统计失败', error);
      return errorResponse(res, '获取任务统计失败', 500);
    }
  }
}

module.exports = TaskController;