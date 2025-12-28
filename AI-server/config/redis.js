/**
 * Redis连接配置
 * 支持集群模式和单机模式
 */

const Redis = require('ioredis');
const logger = require('./logger');

// Redis配置
const REDIS_CONFIG = {
  // 单机Redis配置
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  
  // 连接池配置
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  
  // 连接超时配置
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // 自动重连配置
  lazyConnect: false,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  },
  
  // Keepalive配置
  keepAlive: 30000
};

// Redis集群配置（如果使用集群）
const CLUSTER_CONFIG = {
  host: REDIS_CONFIG.host,
  port: REDIS_CONFIG.port,
  password: REDIS_CONFIG.password,
  db: REDIS_CONFIG.db,
  maxRetriesPerRequest: 3
};

// Redis连接实例
let redisClient = null;
let isCluster = false;
let redisAvailable = false;

/**
 * 检查Redis是否可用
 */
function isRedisAvailable() {
  return redisAvailable && redisClient && redisClient.status === 'ready';
}

/**
 * 创建Redis连接
 */
function createRedisConnection() {
  try {
    // 如果配置了集群节点，使用集群模式
    if (process.env.REDIS_CLUSTER_NODES) {
      isCluster = true;
      const clusterNodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
        const [host, port] = node.trim().split(':');
        return { host, port: parseInt(port) || 6379 };
      });
      
      redisClient = new Redis.Cluster(clusterNodes, {
        redisOptions: {
          password: REDIS_CONFIG.password,
          db: REDIS_CONFIG.db,
          maxRetriesPerRequest: 3
        },
        dnsLookup: (address, callback) => callback(null, address),
        scaleReads: 'master',
        maxRetriesPerRequest: 3
      });
      
      logger.info('Redis集群连接已创建', { 
        nodes: clusterNodes.length 
      });
    } else {
      // 单机模式
      isCluster = false;
      redisClient = new Redis({
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
        password: REDIS_CONFIG.password,
        db: REDIS_CONFIG.db,
        ...REDIS_CONFIG
      });
      
      logger.info('Redis单机连接已创建', { 
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
        db: REDIS_CONFIG.db
      });
    }
    
    // 事件监听
    redisClient.on('connect', () => {
      logger.info('Redis连接已建立');
    });
    
    redisClient.on('ready', () => {
      redisAvailable = true;
      logger.info('Redis连接就绪');
    });
    
    redisClient.on('error', (error) => {
      redisAvailable = false;
      
      const isConnectionError = error.message.includes('ECONNREFUSED') || 
                               error.message.includes('NR_CLOSED') || 
                               error.message.includes('CONNECTION_BROKEN');
      
      const now = Date.now();
      const lastLog = redisClient.lastErrorLogTime || 0;
      const LOG_INTERVAL = 60000; // 60秒内只打印一次

      if (isConnectionError) {
        if (now - lastLog > LOG_INTERVAL) {
          logger.warn('Redis服务不可用，系统已自动切换至降级模式。', { error: error.message });
          redisClient.lastErrorLogTime = now;
        }
      } else {
        if (now - lastLog > LOG_INTERVAL) {
          logger.error('Redis运行时错误', { error: error.message });
          redisClient.lastErrorLogTime = now;
        }
      }
    });
    
    redisClient.on('close', () => {
      redisAvailable = false;
      const now = Date.now();
      const lastCloseLog = redisClient.lastCloseLogTime || 0;
      if (now - lastCloseLog > 60000) {
        logger.warn('Redis连接已关闭');
        redisClient.lastCloseLogTime = now;
      }
    });
    
    redisClient.on('reconnecting', (delay, attempt) => {
      // 限制重连日志输出频率
      if (attempt % 10 === 1) {
        logger.info('Redis重连中', { delay, attempt });
      }
    });
    
    return redisClient;
  } catch (error) {
    redisAvailable = false;
    logger.error('Redis连接创建失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取Redis客户端实例
 */
function getRedisClient() {
  if (!redisClient) {
    createRedisConnection();
  }
  return redisClient;
}

/**
 * 测试Redis连接
 */
async function testRedisConnection() {
  try {
    const client = getRedisClient();
    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;
    
    logger.info('Redis连接测试成功', { latency });
    return {
      success: true,
      latency,
      isCluster,
      config: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
        db: REDIS_CONFIG.db
      }
    };
  } catch (error) {
    logger.error('Redis连接测试失败', { error: error.message });
    return {
      success: false,
      error: error.message,
      isCluster,
      config: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
        db: REDIS_CONFIG.db
      }
    };
  }
}

/**
 * 关闭Redis连接
 */
async function closeRedisConnection() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis连接已关闭');
    } catch (error) {
      logger.error('关闭Redis连接时出错', { error: error.message });
    } finally {
      redisClient = null;
    }
  }
}

/**
 * 健康检查
 */
async function healthCheck() {
  try {
    const client = getRedisClient();
    const info = await client.info();
    const ping = await client.ping();
    
    return {
      status: 'healthy',
      ping,
      info: {
        redis_version: info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown',
        used_memory_human: info.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'unknown',
        connected_clients: info.match(/connected_clients:([^\r\n]+)/)?.[1] || 'unknown'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// 优雅关闭处理
process.on('SIGINT', async () => {
  logger.info('接收到关闭信号，正在关闭Redis连接...');
  await closeRedisConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('接收到终止信号，正在关闭Redis连接...');
  await closeRedisConnection();
  process.exit(0);
});

// 创建默认连接
createRedisConnection();

module.exports = {
  getRedisClient,
  createRedisConnection,
  testRedisConnection,
  closeRedisConnection,
  healthCheck,
  isRedisAvailable,
  REDIS_CONFIG,
  isCluster
};