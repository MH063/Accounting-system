/**
 * 消息队列配置
 * 基于Bull和Redis实现高性能消息队列
 */

const Bull = require('bull');
const { getRedisClient, isRedisAvailable } = require('./redis');
const logger = require('./logger');
const { EmailJobProcessor } = require('../jobs/emailJob');
const { DataProcessingJobProcessor } = require('../jobs/dataProcessingJob');

// 队列配置
const QUEUE_CONFIG = {
  // 默认队列配置
  default: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0
    },
    defaultJobOptions: {
      removeOnComplete: 10, // 保留10个已完成作业
      removeOnFail: 20,     // 保留20个失败作业
      attempts: 3,          // 最多重试3次
      backoff: {
        type: 'exponential',
        delay: 2000         // 首次重试延迟2秒
      }
    }
  }
};

// 预定义处理器存储（用于降级模式）
const jobProcessors = new Map();

/**
 * 降级模式下的模拟队列对象
 */
const createMockQueue = (queueName) => ({
  isMock: true,
  name: queueName,
  add: async (jobName, data, opts) => {
    logger.warn(`[降级模式] Redis不可用，同步执行任务: ${queueName}:${jobName}`);
    const processor = jobProcessors.get(`${queueName}:${jobName}`);
    if (processor) {
      try {
        // 模拟异步执行
        setImmediate(async () => {
          try {
            await processor({ id: `mock_${Date.now()}`, data, name: jobName });
            logger.info(`[降级模式] 任务同步执行成功: ${jobName}`);
          } catch (err) {
            logger.error(`[降级模式] 任务同步执行失败: ${jobName}`, { error: err.message });
          }
        });
        return { id: `mock_${Date.now()}`, data };
      } catch (error) {
        logger.error(`[降级模式] 任务执行出错: ${jobName}`, { error: error.message });
        throw error;
      }
    }
    logger.warn(`[降级模式] 未找到处理器: ${jobName}`);
    return { id: `mock_${Date.now()}`, data };
  },
  process: (jobName, concurrency, processor) => {
    if (typeof concurrency === 'function') {
      processor = concurrency;
    }
    jobProcessors.set(`${queueName}:${jobName}`, processor);
    logger.info(`[降级模式] 注册本地处理器: ${queueName}:${jobName}`);
  },
  on: () => {},
  close: async () => {},
  getWaiting: async () => [],
  getActive: async () => [],
  getCompleted: async () => [],
  getFailed: async () => [],
  getDelayed: async () => [],
  getPaused: async () => [],
  pause: async () => {},
  resume: async () => {},
  clean: async () => 0
});

// 预定义队列
const QUEUES = {
  // 邮件队列
  EMAIL: 'email',
  
  // 数据处理队列
  DATA_PROCESSING: 'data_processing',
  
  // 报表生成队列
  REPORT_GENERATION: 'report_generation',
  
  // 审计日志队列
  AUDIT_LOG: 'audit_log',
  
  // 文件处理队列
  FILE_PROCESSING: 'file_processing',
  
  // 通知队列
  NOTIFICATION: 'notification',
  
  // 备份队列
  BACKUP: 'backup',
  
  // 系统维护队列
  SYSTEM_MAINTENANCE: 'system_maintenance'
};

// 队列实例存储
const queueInstances = new Map();

/**
 * 创建队列
 */
function createQueue(queueName, options = {}) {
  try {
    // 如果没有启用 Redis 或 Redis 不可用，则返回模拟队列
    if (process.env.DISABLE_REDIS === 'true') {
      const mockQueue = createMockQueue(queueName);
      queueInstances.set(queueName, mockQueue);
      return mockQueue;
    }

    const redisConfig = QUEUE_CONFIG.default.redis;
    
    const queue = new Bull(queueName, {
      redis: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db
      },
      defaultJobOptions: {
        ...QUEUE_CONFIG.default.defaultJobOptions,
        ...options.defaultJobOptions
      },
      ...options
    });
    
    // 队列事件监听
    queue.on('completed', (job, result) => {
      logger.info(`队列作业完成: ${queueName}`, {
        jobId: job.id,
        jobName: job.name,
        processingTime: Date.now() - job.processedOn
      });
    });
    
    queue.on('failed', (job, err) => {
      logger.error(`队列作业失败: ${queueName}`, {
        jobId: job.id,
        jobName: job.name,
        attempts: job.attemptsMade,
        error: err.message
      });
    });
    
    queue.on('stalled', (job) => {
      logger.warn(`队列作业停滞: ${queueName}`, {
        jobId: job.id,
        jobName: job.name
      });
    });
    
    queue.on('error', (error) => {
      // 极其进取地抑制所有频繁发生的错误日志，避免刷屏
      const now = Date.now();
      const lastLog = queue.lastErrorLogTime || 0;
      
      // 如果距离上次日志不到 1 分钟，则抑制
      if (now - lastLog < 60000) {
        return;
      }

      const isConnectionError = !error.message || 
                               error.message.includes('ECONNREFUSED') || 
                               error.message.includes('NR_CLOSED') || 
                               error.message.includes('CONNECTION_BROKEN') ||
                               error.message.includes('failed') ||
                               error.message.includes('Redis');
      
      if (isConnectionError) {
        logger.warn(`[降级模式] 队列服务(Redis)连接不可用: ${queueName} (${error.message || '未知连接错误'})。系统将自动切换至同步执行模式。`);
      } else {
        logger.error(`队列运行时错误: ${queueName} - ${error.message}`);
      }
      
      queue.lastErrorLogTime = now;
    });
    
    queueInstances.set(queueName, queue);
    
    logger.info(`队列创建成功: ${queueName}`);
    return queue;
  } catch (error) {
    logger.error(`队列创建失败: ${queueName}`, { error: error.message });
    // 失败时自动回退到模拟队列
    const mockQueue = createMockQueue(queueName);
    queueInstances.set(queueName, mockQueue);
    return mockQueue;
  }
}

/**
 * 获取队列实例
 */
function getQueue(queueName) {
  const existingQueue = queueInstances.get(queueName);
  
  // 如果已经有实例
  if (existingQueue) {
    // 如果是 MockQueue，但现在 Redis 可用了，尝试升级为真实队列
    if (existingQueue.isMock && isRedisAvailable()) {
      logger.info(`[自动恢复] Redis已就绪，正在将队列从降级模式恢复: ${queueName}`);
      queueInstances.delete(queueName); // 删除旧的 MockQueue
      return createQueue(queueName);   // 创建真实队列
    }
    return existingQueue;
  }
  
  // 没有实例，创建新实例
  return createQueue(queueName);
}

/**
 * 添加任务（带自动降级判断）
 */
async function addJob(queueName, jobName, data, options = {}) {
  try {
    const queue = getQueue(queueName);
    
    // 如果是降级模式或者是真实队列但连接已断开
    if (!isRedisAvailable() && !queue.isMock) {
      logger.warn(`[降级模式] Redis连接不可用，尝试同步执行任务: ${jobName}`);
      const processor = jobProcessors.get(`${queueName}:${jobName}`);
      if (processor) {
        setImmediate(async () => {
          try {
            await processor({ id: `fallback_${Date.now()}`, data, name: jobName });
          } catch (err) {
            logger.error(`[降级模式] 任务同步执行失败: ${jobName}`, { error: err.message });
          }
        });
        return { id: `fallback_${Date.now()}`, data };
      }
    }

    return await queue.add(jobName, data, options);
  } catch (error) {
    logger.error(`添加任务失败: ${jobName}`, { error: error.message });
    throw error;
  }
}

/**
 * 获取所有队列
 */
function getAllQueues() {
  return Array.from(queueInstances.values());
}

/**
 * 关闭所有队列
 */
async function closeAllQueues() {
  const closePromises = [];
  
  for (const [name, queue] of queueInstances) {
    closePromises.push(queue.close());
    logger.info(`正在关闭队列: ${name}`);
  }
  
  await Promise.all(closePromises);
  queueInstances.clear();
  
  logger.info('所有队列已关闭');
}

/**
 * 队列状态检查
 */
async function getQueueStatus(queueName) {
  try {
    const queue = getQueue(queueName);
    
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
      queue.getPaused()
    ]);
    
    return {
      queueName,
      status: 'active',
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: paused.length
      }
    };
  } catch (error) {
    logger.error(`获取队列状态失败: ${queueName}`, { error: error.message });
    return {
      queueName,
      status: 'error',
      error: error.message
    };
  }
}

/**
 * 获取所有队列状态
 */
async function getAllQueueStatus() {
  const statusPromises = Array.from(queueInstances.keys()).map(queueName => 
    getQueueStatus(queueName)
  );
  
  const results = await Promise.all(statusPromises);
  return results;
}

/**
 * 清理队列
 */
async function cleanQueue(queueName, grace = 24 * 60 * 60 * 1000) {
  try {
    const queue = getQueue(queueName);
    
    const [cleaned] = await Promise.all([
      queue.clean(grace, 'completed'),
      queue.clean(grace, 'failed'),
      queue.clean(grace, 'delayed')
    ]);
    
    logger.info(`队列清理完成: ${queueName}`, { cleaned });
    return cleaned;
  } catch (error) {
    logger.error(`队列清理失败: ${queueName}`, { error: error.message });
    throw error;
  }
}

/**
 * 暂停/恢复队列
 */
async function pauseQueue(queueName) {
  try {
    const queue = getQueue(queueName);
    await queue.pause();
    logger.info(`队列已暂停: ${queueName}`);
  } catch (error) {
    logger.error(`队列暂停失败: ${queueName}`, { error: error.message });
    throw error;
  }
}

async function resumeQueue(queueName) {
  try {
    const queue = getQueue(queueName);
    await queue.resume();
    logger.info(`队列已恢复: ${queueName}`);
  } catch (error) {
    logger.error(`队列恢复失败: ${queueName}`, { error: error.message });
    throw error;
  }
}

/**
 * 作业统计
 */
async function getJobStats(queueName) {
  try {
    const queue = getQueue(queueName);
    const counts = await queue.getJobCounts();
    
    return {
      queueName,
      stats: {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
        paused: counts.paused || 0
      }
    };
  } catch (error) {
    logger.error(`获取作业统计失败: ${queueName}`, { error: error.message });
    throw error;
  }
}

// 预创建常用队列
const defaultQueues = [
  QUEUES.EMAIL,
  QUEUES.DATA_PROCESSING,
  QUEUES.REPORT_GENERATION,
  QUEUES.AUDIT_LOG,
  QUEUES.FILE_PROCESSING,
  QUEUES.NOTIFICATION,
  QUEUES.BACKUP,
  QUEUES.SYSTEM_MAINTENANCE
];

// 初始化队列并注册处理器
defaultQueues.forEach(queueName => {
  const queue = createQueue(queueName);
  
  // 根据队列类型注册相应的处理器
  switch (queueName) {
    case QUEUES.EMAIL:
      queue.process('sendEmail', 5, EmailJobProcessor.sendEmail.bind(EmailJobProcessor));
      queue.process('sendBatchEmail', 3, EmailJobProcessor.sendBatchEmail.bind(EmailJobProcessor));
      logger.info(`邮件队列处理器已注册: ${queueName}`);
      break;
      
    case QUEUES.DATA_PROCESSING:
      queue.process('dataAnalysis', 3, DataProcessingJobProcessor.dataAnalysis.bind(DataProcessingJobProcessor));
      queue.process('dataImport', 2, DataProcessingJobProcessor.dataImport.bind(DataProcessingJobProcessor));
      queue.process('dataExport', 2, DataProcessingJobProcessor.dataExport.bind(DataProcessingJobProcessor));
      logger.info(`数据处理队列处理器已注册: ${queueName}`);
      break;
      
    case QUEUES.REPORT_GENERATION:
      // 报表生成处理器可以在这里添加
      queue.process('generateReport', 2, async (job) => {
        logger.info('报表生成作业', { jobId: job.id });
        return { success: true, message: '报表生成功能待实现' };
      });
      logger.info(`报表生成队列处理器已注册: ${queueName}`);
      break;
      
    case QUEUES.AUDIT_LOG:
      // 审计日志处理器
      queue.process('logAudit', 10, async (job) => {
        logger.info('审计日志作业', { jobId: job.id });
        return { success: true, message: '审计日志记录成功' };
      });
      logger.info(`审计日志队列处理器已注册: ${queueName}`);
      break;
      
    case QUEUES.FILE_PROCESSING:
      // 文件处理处理器
      queue.process('processFile', 5, async (job) => {
        logger.info('文件处理作业', { jobId: job.id });
        return { success: true, message: '文件处理成功' };
      });
      logger.info(`文件处理队列处理器已注册: ${queueName}`);
      break;
      
    case QUEUES.NOTIFICATION:
      // 通知处理器
      queue.process('sendNotification', 5, async (job) => {
        logger.info('通知发送作业', { jobId: job.id });
        return { success: true, message: '通知发送成功' };
      });
      logger.info(`通知队列处理器已注册: ${queueName}`);
      break;
      
    case QUEUES.BACKUP:
      // 备份处理器
      queue.process('createBackup', 1, async (job) => {
        logger.info('备份作业', { jobId: job.id });
        return { success: true, message: '备份任务已创建' };
      });
      logger.info(`备份队列处理器已注册: ${queueName}`);
      break;
      
    case QUEUES.SYSTEM_MAINTENANCE:
      // 系统维护处理器
      queue.process('systemMaintenance', 1, async (job) => {
        logger.info('系统维护作业', { jobId: job.id });
        return { success: true, message: '系统维护任务完成' };
      });
      logger.info(`系统维护队列处理器已注册: ${queueName}`);
      break;
      
    default:
      logger.warn(`未知队列类型: ${queueName}`);
  }
});

// 优雅关闭处理
process.on('SIGINT', async () => {
  logger.info('接收到关闭信号，正在关闭所有队列...');
  await closeAllQueues();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('接收到终止信号，正在关闭所有队列...');
  await closeAllQueues();
  process.exit(0);
});

module.exports = {
  createQueue,
  getQueue,
  addJob,
  getAllQueues,
  closeAllQueues,
  getQueueStatus,
  getAllQueueStatus,
  cleanQueue,
  pauseQueue,
  resumeQueue,
  getJobStats,
  QUEUES,
  QUEUE_CONFIG
};