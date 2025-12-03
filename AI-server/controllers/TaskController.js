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
      
      res.status(200).json({
        success: true,
        data: status
      });
      
      logger.info('获取定时任务状态成功', { taskCount: status.totalTasks });
    } catch (error) {
      logger.error('获取定时任务状态失败', error);
      res.status(500).json({
        success: false,
        message: '获取任务状态失败',
        error: error.message
      });
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
      
      res.status(200).json({
        success: true,
        data: {
          history,
          total: history.length,
          filter: taskName || 'all'
        }
      });
      
      logger.info('获取任务历史成功', { limit, taskName, recordCount: history.length });
    } catch (error) {
      logger.error('获取任务历史失败', error);
      res.status(500).json({
        success: false,
        message: '获取任务历史失败',
        error: error.message
      });
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
      
      res.status(200).json({
        success: true,
        message: '所有定时任务已启动',
        data: status
      });
      
      logger.info('启动所有定时任务成功');
    } catch (error) {
      logger.error('启动所有定时任务失败', error);
      res.status(500).json({
        success: false,
        message: '启动任务失败',
        error: error.message
      });
    }
  }

  /**
   * 停止所有定时任务
   * @route POST /api/tasks/stop-all
   */
  static async stopAllTasks(req, res) {
    try {
      stopScheduledTasks();
      
      res.status(200).json({
        success: true,
        message: '所有定时任务已停止'
      });
      
      logger.info('停止所有定时任务成功');
    } catch (error) {
      logger.error('停止所有定时任务失败', error);
      res.status(500).json({
        success: false,
        message: '停止任务失败',
        error: error.message
      });
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
        return res.status(400).json({
          success: false,
          message: '任务名称不能为空'
        });
      }
      
      startTask(taskName);
      
      const status = getTaskStatus();
      
      res.status(200).json({
        success: true,
        message: `任务 ${taskName} 已启动`,
        data: {
          taskName,
          status: status.tasks[taskName]
        }
      });
      
      logger.info(`启动定时任务成功: ${taskName}`);
    } catch (error) {
      logger.error(`启动定时任务失败: ${req.params.taskName}`, error);
      res.status(500).json({
        success: false,
        message: '启动任务失败',
        error: error.message
      });
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
        return res.status(400).json({
          success: false,
          message: '任务名称不能为空'
        });
      }
      
      stopTask(taskName);
      
      res.status(200).json({
        success: true,
        message: `任务 ${taskName} 已停止`,
        data: {
          taskName,
          status: {
            running: false,
            scheduled: true
          }
        }
      });
      
      logger.info(`停止定时任务成功: ${taskName}`);
    } catch (error) {
      logger.error(`停止定时任务失败: ${req.params.taskName}`, error);
      res.status(500).json({
        success: false,
        message: '停止任务失败',
        error: error.message
      });
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
        return res.status(400).json({
          success: false,
          message: '任务名称不能为空'
        });
      }
      
      restartTask(taskName);
      
      const status = getTaskStatus();
      
      res.status(200).json({
        success: true,
        message: `任务 ${taskName} 已重启`,
        data: {
          taskName,
          status: status.tasks[taskName]
        }
      });
      
      logger.info(`重启定时任务成功: ${taskName}`);
    } catch (error) {
      logger.error(`重启定时任务失败: ${req.params.taskName}`, error);
      res.status(500).json({
        success: false,
        message: '重启任务失败',
        error: error.message
      });
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
        return res.status(400).json({
          success: false,
          message: '任务名称不能为空'
        });
      }
      
      // 验证任务名称
      const validTasks = ['logCleanup', 'databaseBackup', 'queueCleanup', 'fileOptimization', 'healthCheck'];
      if (!validTasks.includes(taskName)) {
        return res.status(400).json({
          success: false,
          message: `无效的任务名称。有效任务: ${validTasks.join(', ')}`
        });
      }
      
      const result = await executeTaskManually(taskName);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          taskName,
          executedAt: result.timestamp
        }
      });
      
      logger.info(`手动执行定时任务成功: ${taskName}`);
    } catch (error) {
      logger.error(`手动执行定时任务失败: ${req.params.taskName}`, error);
      res.status(500).json({
        success: false,
        message: '执行任务失败',
        error: error.message
      });
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
          description: '系统健康检查任务 - 每5分钟执行系统健康检查',
          schedule: '*/5 * * * *',
          category: 'monitoring'
        }
      ];
      
      res.status(200).json({
        success: true,
        data: {
          tasks: availableTasks,
          total: availableTasks.length
        }
      });
      
      logger.info('获取可用任务列表成功', { taskCount: availableTasks.length });
    } catch (error) {
      logger.error('获取可用任务列表失败', error);
      res.status(500).json({
        success: false,
        message: '获取任务列表失败',
        error: error.message
      });
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
        
        // 计算平均执行时长
        taskStats.avgDuration = (taskStats.avgDuration * (taskStats.total - 1) + record.duration) / taskStats.total;
      }
      
      res.status(200).json({
        success: true,
        data: {
          overall: status.stats,
          breakdown: stats
        }
      });
      
      logger.info('获取任务统计信息成功');
    } catch (error) {
      logger.error('获取任务统计信息失败', error);
      res.status(500).json({
        success: false,
        message: '获取任务统计失败',
        error: error.message
      });
    }
  }
}

module.exports = TaskController;