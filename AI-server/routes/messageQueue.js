/**
 * 消息队列路由
 * 提供队列管理和监控功能
 */

const express = require('express');
const { 
  getAllQueues, 
  getQueueStatus, 
  getAllQueueStatus,
  getJobStats,
  cleanQueue,
  pauseQueue,
  resumeQueue,
  QUEUES 
} = require('../config/messageQueue');
const { EmailJobHelpers } = require('../jobs/emailJob');
const { DataProcessingJobProcessor } = require('../jobs/dataProcessingJob');
const { testRedisConnection } = require('../config/redis');
const { authenticateToken: authenticateJWT } = require('../middleware/auth');
const { PermissionChecker, PERMISSIONS } = require('../config/permissions');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

const router = express.Router();

/**
 * 获取队列总览
 * GET /api/queues/overview
 */
router.get('/overview', authenticateJWT, PermissionChecker.requirePermission(PERMISSIONS.SYSTEM_CONFIG), 
  responseWrapper(async (req, res) => {
    try {
      const queueStatus = await getAllQueueStatus();
      const redisStatus = await testRedisConnection();
      
      // 计算总体统计
      const totalStats = queueStatus.reduce((acc, queue) => {
        if (queue.status === 'active' && queue.counts) {
          acc.totalWaiting += queue.counts.waiting || 0;
          acc.totalActive += queue.counts.active || 0;
          acc.totalCompleted += queue.counts.completed || 0;
          acc.totalFailed += queue.counts.failed || 0;
          acc.healthyQueues++;
        } else {
          acc.unhealthyQueues++;
        }
        return acc;
      }, {
        totalWaiting: 0,
        totalActive: 0,
        totalCompleted: 0,
        totalFailed: 0,
        healthyQueues: 0,
        unhealthyQueues: 0
      });
      
      return res.json({
        success: true,
        data: {
          redis: redisStatus,
          queues: queueStatus,
          summary: totalStats,
          predefinedQueues: Object.values(QUEUES)
        }
      });
      
    } catch (error) {
      logger.error('获取队列总览失败', { error: error.message });
      throw error;
    }
  })
);

/**
 * 获取特定队列状态
 * GET /api/queues/:queueName/status
 */
router.get('/:queueName/status', authenticateJWT, PermissionChecker.requirePermission(PERMISSIONS.SYSTEM_CONFIG),
  responseWrapper(async (req, res) => {
    try {
      const { queueName } = req.params;
      const queueStatus = await getQueueStatus(queueName);
      const jobStats = await getJobStats(queueName);
      
      return res.json({
        success: true,
        data: {
          ...queueStatus,
          stats: jobStats.stats
        }
      });
      
    } catch (error) {
      logger.error(`获取队列状态失败: ${req.params.queueName}`, { error: error.message });
      throw error;
    }
  })
);

/**
 * 清理队列
 * POST /api/queues/:queueName/clean
 */
router.post('/:queueName/clean', authenticateJWT, PermissionChecker.requirePermission(PERMISSIONS.SYSTEM_CONFIG),
  responseWrapper(async (req, res) => {
    try {
      const { queueName } = req.params;
      const { gracePeriod = '24h' } = req.body;
      
      const graceMs = parseTimePeriod(gracePeriod);
      const cleaned = await cleanQueue(queueName, graceMs);
      
      logger.info('队列清理操作', {
        userId: req.user.id,
        queueName: queueName,
        gracePeriod: gracePeriod,
        cleaned: cleaned
      });
      
      return res.json({
        success: true,
        message: `队列 ${queueName} 清理完成`,
        data: {
          cleaned: cleaned,
          gracePeriod: gracePeriod
        }
      });
      
    } catch (error) {
      logger.error(`队列清理失败: ${req.params.queueName}`, { error: error.message });
      throw error;
    }
  })
);

/**
 * 暂停/恢复队列
 * POST /api/queues/:queueName/pause
 * POST /api/queues/:queueName/resume
 */
router.post('/:queueName/pause', authenticateJWT, PermissionChecker.requirePermission(PERMISSIONS.SYSTEM_CONFIG),
  responseWrapper(async (req, res) => {
    try {
      const { queueName } = req.params;
      await pauseQueue(queueName);
      
      logger.info('队列暂停操作', {
        userId: req.user.id,
        queueName: queueName
      });
      
      return res.json({
        success: true,
        message: `队列 ${queueName} 已暂停`
      });
      
    } catch (error) {
      logger.error(`队列暂停失败: ${req.params.queueName}`, { error: error.message });
      throw error;
    }
  })
);

router.post('/:queueName/resume', authenticateJWT, PermissionChecker.requirePermission(PERMISSIONS.SYSTEM_CONFIG),
  responseWrapper(async (req, res) => {
    try {
      const { queueName } = req.params;
      await resumeQueue(queueName);
      
      logger.info('队列恢复操作', {
        userId: req.user.id,
        queueName: queueName
      });
      
      return res.json({
        success: true,
        message: `队列 ${queueName} 已恢复`
      });
      
    } catch (error) {
      logger.error(`队列恢复失败: ${req.params.queueName}`, { error: error.message });
      throw error;
    }
  })
);

/**
 * 提交邮件作业
 * POST /api/queues/email
 */
router.post('/email', authenticateJWT, PermissionChecker.requirePermission(PERMISSIONS.ADMIN_USER),
  responseWrapper(async (req, res) => {
    try {
      const { emailData, templateData, batchData } = req.body;
      
      let result;
      
      if (templateData) {
        // 发送模板邮件
        result = await EmailJobHelpers.sendTemplateEmail({
          ...templateData,
          to: req.user.email // 发送到当前用户邮箱
        });
      } else if (emailData) {
        // 发送单封邮件
        result = await EmailJobHelpers.sendSingleEmail({
          ...emailData,
          from: emailData.from || `会计系统 <${process.env.SMTP_USER || 'noreply@accounting.com'}>`
        });
      } else if (batchData) {
        // 批量发送邮件
        result = await EmailJobHelpers.sendBatchEmails(batchData.emails, batchData.options);
      } else {
        return res.status(400).json({
          success: false,
          message: '请提供邮件数据'
        });
      }
      
      logger.info('邮件作业提交成功', {
        userId: req.user.id,
        jobId: result.jobId,
        type: templateData ? 'template' : emailData ? 'single' : 'batch'
      });
      
      return res.json({
        success: true,
        message: '邮件作业已提交到队列',
        data: result
      });
      
    } catch (error) {
      logger.error('邮件作业提交失败', { 
        userId: req.user.id, 
        error: error.message 
      });
      throw error;
    }
  })
);

/**
 * 提交数据分析作业
 * POST /api/queues/data-analysis
 */
router.post('/data-analysis', authenticateJWT, PermissionChecker.requirePermission(PERMISSIONS.DATA_READ),
  responseWrapper(async (req, res) => {
    try {
      const { analysisType, parameters } = req.body;
      const { getQueue, QUEUES } = require('../config/messageQueue');
      
      if (!analysisType) {
        return res.status(400).json({
          success: false,
          message: '请提供分析类型'
        });
      }
      
      const dataQueue = getQueue(QUEUES.DATA_PROCESSING);
      
      const job = await dataQueue.add('dataAnalysis', {
        analysisType,
        parameters,
        jobId: `analysis_${Date.now()}`,
        userId: req.user.id,
        submittedAt: new Date().toISOString()
      }, {
        priority: 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
      });
      
      logger.info('数据分析作业提交成功', {
        userId: req.user.id,
        jobId: job.id,
        analysisType: analysisType
      });
      
      return res.json({
        success: true,
        message: '数据分析作业已提交到队列',
        data: {
          jobId: job.id,
          analysisType: analysisType,
          status: 'queued'
        }
      });
      
    } catch (error) {
      logger.error('数据分析作业提交失败', { 
        userId: req.user.id, 
        error: error.message 
      });
      throw error;
    }
  })
);

/**
 * 提交数据导入作业
 * POST /api/queues/data-import
 */
router.post('/data-import', authenticateJWT, PermissionChecker.requirePermission(PERMISSIONS.DATA_WRITE),
  responseWrapper(async (req, res) => {
    try {
      const { importType, fileData, parameters } = req.body;
      const { getQueue, QUEUES } = require('../config/messageQueue');
      
      if (!importType || !fileData || !Array.isArray(fileData)) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的导入类型和文件数据'
        });
      }
      
      const dataQueue = getQueue(QUEUES.DATA_PROCESSING);
      
      const job = await dataQueue.add('dataImport', {
        importType,
        fileData,
        parameters,
        jobId: `import_${Date.now()}`,
        userId: req.user.id,
        submittedAt: new Date().toISOString()
      }, {
        priority: 5, // 导入作业优先级较高
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000
        },
        removeOnComplete: true,
        removeOnFail: false
      });
      
      logger.info('数据导入作业提交成功', {
        userId: req.user.id,
        jobId: job.id,
        importType: importType,
        recordCount: fileData.length
      });
      
      return res.json({
        success: true,
        message: '数据导入作业已提交到队列',
        data: {
          jobId: job.id,
          importType: importType,
          recordCount: fileData.length,
          status: 'queued'
        }
      });
      
    } catch (error) {
      logger.error('数据导入作业提交失败', { 
        userId: req.user.id, 
        error: error.message 
      });
      throw error;
    }
  })
);

/**
 * 获取作业状态
 * GET /api/queues/jobs/:jobId
 */
router.get('/jobs/:jobId', authenticateJWT, PermissionChecker.requirePermission(PERMISSIONS.SYSTEM_CONFIG),
  responseWrapper(async (req, res) => {
    try {
      const { jobId } = req.params;
      
      // 在所有队列中查找作业
      const queues = getAllQueues();
      let job = null;
      let queueName = null;
      
      for (const queue of queues) {
        try {
          job = await queue.getJob(jobId);
          if (job) {
            queueName = queue.name;
            break;
          }
        } catch (error) {
          // 继续在下一个队列中查找
        }
      }
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: '作业不存在'
        });
      }
      
      const jobData = {
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress(),
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        opts: job.opts,
        queueName: queueName,
        status: job.finishedOn ? (job.failedReason ? 'failed' : 'completed') : 
                job.processedOn ? 'active' : 'waiting'
      };
      
      return res.json({
        success: true,
        data: jobData
      });
      
    } catch (error) {
      logger.error(`获取作业状态失败: ${req.params.jobId}`, { error: error.message });
      throw error;
    }
  })
);

/**
 * 辅助函数：解析时间周期
 */
function parseTimePeriod(period) {
  const match = period.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('无效的时间周期格式，请使用如：30s, 5m, 2h, 1d');
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  
  return value * multipliers[unit];
}

module.exports = router;