/**
 * 数据库配置文件 - 支持 Zeabur 部署
 * 管理PostgreSQL数据库连接池
 */

// 确保环境变量已加载
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');
const cache = require('./cache');

/**
 * 解析 DATABASE_URL 或单独的数据库配置
 */
function getDatabaseConfig() {
  // 优先使用 Zeabur 提供的 DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('✅ 检测到 DATABASE_URL（Zeabur 环境）');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }

  // 回退到单独的数据库配置
  console.log('⚠️ 使用单独的数据库配置（本地环境）');
  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
}

// 获取数据库配置
const dbConfig = getDatabaseConfig();

// 创建数据库连接池 - 优化配置
const poolConfig = {
  ...dbConfig,
  // 连接池大小配置
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 20, // 最大连接数，增加默认值
  min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 5, // 最小连接数，增加默认值
  // 连接生命周期配置
  idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 60000, // 空闲连接超时时间，增加到60秒
  connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT ? parseInt(process.env.DB_CONNECTION_TIMEOUT) : 20000, // 连接超时时间，增加到20秒
  // 高级配置
  acquireTimeoutMillis: process.env.DB_ACQUIRE_TIMEOUT ? parseInt(process.env.DB_ACQUIRE_TIMEOUT) : 30000, // 获取连接超时时间，减少到30秒
  createTimeoutMillis: process.env.DB_CREATE_TIMEOUT ? parseInt(process.env.DB_CREATE_TIMEOUT) : 30000, // 创建连接超时时间
  destroyTimeoutMillis: process.env.DB_DESTROY_TIMEOUT ? parseInt(process.env.DB_DESTROY_TIMEOUT) : 5000, // 销毁连接超时时间
  reapIntervalMillis: process.env.DB_REAP_INTERVAL ? parseInt(process.env.DB_REAP_INTERVAL) : 1000, // 回收间隔
  createRetryIntervalMillis: process.env.DB_CREATE_RETRY_INTERVAL ? parseInt(process.env.DB_CREATE_RETRY_INTERVAL) : 200, // 重试间隔
  // 连接验证配置
  allowExitOnIdle: false, // 不允许在空闲时退出进程
  keepAlive: true, // 启用TCP keep-alive
  keepAliveInitialDelayMillis: process.env.DB_KEEP_ALIVE_DELAY ? parseInt(process.env.DB_KEEP_ALIVE_DELAY) : 10000, // keep-alive初始延迟
  // 连接验证
  verify: (client) => {
    return client.query('SELECT 1').then(() => true).catch(() => false);
  },
  // 应用名称
  application_name: process.env.APP_NAME || 'ai-serve'
};

// 打印配置以便调试（在开发环境）
if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 数据库连接配置检查:');
  console.log('host:', poolConfig.host || 'localhost');
  console.log('port:', poolConfig.port || 5432);
  console.log('user:', poolConfig.user || 'undefined');
  console.log('password:', poolConfig.password ? '***已设置***' : '未设置');
  console.log('database:', poolConfig.database || '(未设置)');
  console.log('SSL:', poolConfig.ssl ? '已启用' : '未启用');
}

const pool = new Pool(poolConfig);

// 连接池事件监听器配置
const poolEventConfig = {
  logConnections: process.env.DB_LOG_CONNECTIONS !== 'false',
  logAcquires: process.env.DB_LOG_ACQUIRES !== 'false',
  logRemovals: process.env.DB_LOG_REMOVALS !== 'false',
  enableErrorRecovery: process.env.DB_ENABLE_ERROR_RECOVERY !== 'false'
};

// 连接池错误统计
const poolErrorStats = {
  connectionErrors: 0,
  acquireErrors: 0,
  queryErrors: 0,
  lastErrorTime: null,
  errorThreshold: 5, // 错误阈值
  errorWindow: 300000 // 5分钟错误窗口
};

// 连接池事件监听 - 增强错误处理
pool.on('connect', (client) => {
  if (poolEventConfig.logConnections) {
    console.log('[DB_POOL] 新连接已建立');
  }
  
  // 为每个连接设置错误处理
  client.on('error', (err) => {
    console.error('[DB_CLIENT] 客户端连接错误:', err.message);
    poolErrorStats.connectionErrors++;
    poolErrorStats.lastErrorTime = new Date();
  });
  
  client.on('notice', (msg) => {
    if (msg.severity === 'WARNING') {
      console.warn('[DB_NOTICE] 数据库警告:', msg.message);
    }
  });
});

pool.on('acquire', (client) => {
  if (poolEventConfig.logAcquires) {
    console.log('[DB_POOL] 连接已从池中获取');
  }
  
  // 检查连接是否仍然有效
  if (!client || client.readyForQuery !== true) {
    console.warn('[DB_POOL] 获取到的连接可能已失效');
  }
});

pool.on('remove', (client) => {
  if (poolEventConfig.logRemovals) {
    console.log('[DB_POOL] 连接已从池中移除');
  }
});

pool.on('error', (err, client) => {
  console.error('[DB_POOL] 连接池发生错误:', err);
  poolErrorStats.connectionErrors++;
  poolErrorStats.lastErrorTime = new Date();
  
  // 错误恢复机制
  if (poolEventConfig.enableErrorRecovery) {
    handlePoolError(err);
  }
});

// 连接池错误处理函数
const handlePoolError = async (error) => {
  const now = new Date();
  const timeSinceLastError = poolErrorStats.lastErrorTime ? 
    now - poolErrorStats.lastErrorTime : Infinity;
  
  // 如果在错误窗口内错误次数过多，触发恢复机制
  if (timeSinceLastError < poolErrorStats.errorWindow && 
      poolErrorStats.connectionErrors >= poolErrorStats.errorThreshold) {
    console.error('[DB_POOL] 连接池错误频率过高，触发恢复机制');
    
    try {
      // 尝试重新连接
      await testConnection();
      console.log('[DB_POOL] 连接池恢复成功');
      
      // 重置错误统计
      poolErrorStats.connectionErrors = 0;
    } catch (reconnectError) {
      console.error('[DB_POOL] 连接池恢复失败:', reconnectError.message);
      
      // 如果恢复失败，考虑重启连接池
      if (poolErrorStats.connectionErrors >= poolErrorStats.errorThreshold * 2) {
        console.error('[DB_POOL] 错误次数过多，建议重启应用');
      }
    }
  }
};

// 连接池降级处理配置
const poolDegradationConfig = {
  enabled: process.env.DB_DEGRADATION_ENABLED !== 'false',
  maxQueueSize: parseInt(process.env.DB_MAX_QUEUE_SIZE) || 20,
  queueTimeout: parseInt(process.env.DB_QUEUE_TIMEOUT) || 30000,
  circuitBreakerEnabled: process.env.DB_CIRCUIT_BREAKER_ENABLED !== 'false',
  circuitBreakerThreshold: parseInt(process.env.DB_CIRCUIT_BREAKER_THRESHOLD) || 10,
  circuitBreakerTimeout: parseInt(process.env.DB_CIRCUIT_BREAKER_TIMEOUT) || 60000,
  fallbackEnabled: process.env.DB_FALLBACK_ENABLED !== 'false'
};

// 连接池状态跟踪
const poolState = {
  isDegraded: false,
  isCircuitBreakerOpen: false,
  circuitBreakerOpenedAt: null,
  queuedRequests: 0,
  rejectedRequests: 0,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0
};

// 熔断器状态
const circuitBreaker = {
  state: 'closed', // closed, open, half-open
  failures: 0,
  lastFailureTime: null,
  nextAttemptTime: null
};

// 优雅降级处理
const handlePoolExhaustion = async (operation) => {
  if (!poolDegradationConfig.enabled) {
    return await operation();
  }

  poolState.totalRequests++;

  // 检查熔断器状态
  if (circuitBreaker.state === 'open') {
    if (Date.now() < circuitBreaker.nextAttemptTime) {
      poolState.rejectedRequests++;
      throw new Error('数据库连接池熔断器开启，请求被拒绝');
    } else {
      // 尝试半开状态
      circuitBreaker.state = 'half-open';
      console.log('[DB_POOL] 熔断器进入半开状态');
    }
  }

  // 检查队列大小
  if (poolState.queuedRequests >= poolDegradationConfig.maxQueueSize) {
    poolState.rejectedRequests++;
    throw new Error('数据库连接池队列已满，请求被拒绝');
  }

  try {
    poolState.queuedRequests++;
    
    // 使用 Promise.race 实现超时控制
    const result = await Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('数据库操作超时')), 
        poolDegradationConfig.queueTimeout)
      )
    ]);

    poolState.successfulRequests++;
    poolState.queuedRequests--;

    // 重置熔断器
    if (circuitBreaker.state === 'half-open') {
      circuitBreaker.state = 'closed';
      circuitBreaker.failures = 0;
      console.log('[DB_POOL] 熔断器关闭，服务恢复正常');
    }

    return result;
  } catch (error) {
    poolState.failedRequests++;
    poolState.queuedRequests--;

    // 更新熔断器状态
    if (error.message.includes('连接') || error.message.includes('超时')) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailureTime = Date.now();

      if (circuitBreaker.failures >= poolDegradationConfig.circuitBreakerThreshold) {
        circuitBreaker.state = 'open';
        circuitBreaker.nextAttemptTime = Date.now() + poolDegradationConfig.circuitBreakerTimeout;
        console.error('[DB_POOL] 熔断器开启，数据库连接失败次数过多');
      }
    }

    throw error;
  }
};

// 获取降级状态
const getDegradationStatus = () => {
  const successRate = poolState.totalRequests > 0 ? 
    (poolState.successfulRequests / poolState.totalRequests * 100).toFixed(2) : 100;

  return {
    ...poolState,
    successRate: parseFloat(successRate),
    circuitBreaker: circuitBreaker,
    isHealthy: successRate > 80 && !poolState.isDegraded && circuitBreaker.state === 'closed',
    queueUtilization: (poolState.queuedRequests / poolDegradationConfig.maxQueueSize * 100).toFixed(2)
  };
};

// 重置降级状态
const resetDegradationStatus = () => {
  poolState.isDegraded = false;
  poolState.queuedRequests = 0;
  poolState.rejectedRequests = 0;
  poolState.totalRequests = 0;
  poolState.successfulRequests = 0;
  poolState.failedRequests = 0;
  
  circuitBreaker.state = 'closed';
  circuitBreaker.failures = 0;
  circuitBreaker.lastFailureTime = null;
  circuitBreaker.nextAttemptTime = null;
  
  console.log('[DB_POOL] 降级状态已重置');
};

// 连接池状态监控
const getPoolStatus = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

// 连接池监控配置
const poolMonitorConfig = {
  enabled: process.env.DB_POOL_MONITOR_ENABLED !== 'false',
  interval: parseInt(process.env.DB_POOL_MONITOR_INTERVAL) || 300000, // 默认5分钟
  logLevel: process.env.DB_POOL_LOG_LEVEL || 'info'
};

// 智能连接池状态监控
let poolMonitorInterval = null;

const startPoolMonitoring = () => {
  if (!poolMonitorConfig.enabled) {
    console.log('[DB_POOL] 连接池监控已禁用');
    return;
  }

  // 清除现有的监控定时器
  if (poolMonitorInterval) {
    clearInterval(poolMonitorInterval);
  }

  poolMonitorInterval = setInterval(() => {
    try {
      const status = getPoolStatus();
      const utilization = status.totalCount > 0 ? 
        ((status.totalCount - status.idleCount) / status.totalCount * 100).toFixed(2) : 0;
      
      // 根据连接池状态调整日志级别
      let logLevel = poolMonitorConfig.logLevel;
      if (status.waitingCount > 5 || utilization > 90) {
        logLevel = 'warn';
      }
      if (status.waitingCount > 10 || utilization > 95) {
        logLevel = 'error';
      }

      const logMessage = `[DB_POOL] 连接池状态监控 - 总计: ${status.totalCount}, 空闲: ${status.idleCount}, 等待: ${status.waitingCount}, 利用率: ${utilization}%`;
      
      // 根据日志级别输出
      switch (logLevel) {
        case 'error':
          console.error(logMessage);
          break;
        case 'warn':
          console.warn(logMessage);
          break;
        default:
          console.log(logMessage);
      }

      // 高负载时发送警告
      if (status.waitingCount > 5 || utilization > 90) {
        console.warn(`[DB_POOL] 警告: 连接池高负载 - 等待请求: ${status.waitingCount}, 利用率: ${utilization}%`);
      }
    } catch (error) {
      console.error('[DB_POOL] 连接池状态监控错误:', error);
    }
  }, poolMonitorConfig.interval);

  console.log(`[DB_POOL] 连接池监控已启动，间隔: ${poolMonitorConfig.interval}ms`);
};

const stopPoolMonitoring = () => {
  if (poolMonitorInterval) {
    clearInterval(poolMonitorInterval);
    poolMonitorInterval = null;
    console.log('[DB_POOL] 连接池监控已停止');
  }
};

// 启动监控
startPoolMonitoring();

/**
 * 执行数据库查询的辅助函数 - 支持降级处理
 * @param {string} text - SQL查询语句
 * @param {Array} params - 查询参数
 * @param {Object} options - 查询选项
 * @returns {Promise} 查询结果
 */
const query = async (text, params = [], options = {}) => {
  const start = Date.now();
  const { useCache = true, cacheTTL = 300, useDegradation = true } = options;
  
  // 包装查询操作以支持降级处理
  const queryOperation = async () => {
    try {
      // 如果启用缓存，先尝试从缓存获取结果
      if (useCache && text.trim().toUpperCase().startsWith('SELECT')) {
        const cachedResult = cache.get(text, params);
        if (cachedResult) {
          const duration = Date.now() - start;
          console.log(`[CACHE] 缓存查询成功 (${duration}ms)`);
          return cachedResult;
        }
      }
      
      // 执行数据库查询
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`[DB_QUERY] 查询成功 (${duration}ms): ${text.substring(0, 100)}...`);
      
      // 如果是SELECT查询且启用了缓存，将结果存入缓存
      if (useCache && text.trim().toUpperCase().startsWith('SELECT')) {
        cache.set(text, params, res, cacheTTL);
      }
      
      return res;
    } catch (error) {
      console.error(`[DB_QUERY] 查询失败: ${error.message}`);
      throw error;
    }
  };
  
  // 使用降级处理包装查询操作
  if (useDegradation && poolDegradationConfig.enabled) {
    return await handlePoolExhaustion(queryOperation);
  } else {
    return await queryOperation();
  }
};

/**
 * 事务执行函数 - 支持降级处理
 * @param {Function} callback - 事务回调函数，接收client作为参数
 * @param {Object} options - 事务选项
 * @returns {Promise} 事务结果
 */
const transaction = async (callback, options = {}) => {
  const { useDegradation = true, timeout = 30000 } = options;
  const start = Date.now();
  
  // 包装事务操作以支持降级处理
  const transactionOperation = async () => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      
      const duration = Date.now() - start;
      console.log(`[DB_TRANSACTION] 事务提交成功 (${duration}ms)`);
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      const duration = Date.now() - start;
      console.error(`[DB_TRANSACTION] 事务回滚 (${duration}ms):`, error.message);
      
      throw error;
    } finally {
      client.release();
    }
  };
  
  // 使用降级处理包装事务操作
  if (useDegradation && poolDegradationConfig.enabled) {
    return await handlePoolExhaustion(async () => {
      return await Promise.race([
        transactionOperation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('事务执行超时')), timeout)
        )
      ]);
    });
  } else {
    return await transactionOperation();
  }
};

/**
 * 获取连接池错误统计信息
 * @returns {Object} 错误统计信息
 */
const getPoolErrorStats = () => {
  return {
    totalErrors: poolErrorStats.connectionErrors + poolErrorStats.acquireErrors + poolErrorStats.queryErrors,
    connectionErrors: poolErrorStats.connectionErrors,
    acquireErrors: poolErrorStats.acquireErrors,
    queryErrors: poolErrorStats.queryErrors,
    lastError: poolErrorStats.lastErrorTime,
    errorRate: (poolErrorStats.connectionErrors + poolErrorStats.acquireErrors + poolErrorStats.queryErrors) / Math.max(1, poolState.totalRequests),
    isHealthy: poolErrorStats.connectionErrors < poolDegradationConfig.errorThreshold,
    timestamp: new Date().toISOString()
  };
};

/**
 * 数据库健康检查 - 增强版
 * @returns {Promise<Object>} 健康状态信息
 */
const healthCheck = async () => {
  const start = Date.now();
  const status = {
    database: 'unknown',
    responseTime: 0,
    poolStatus: getPoolStatus(),
    errorStats: getPoolErrorStats(),
    degradationStatus: getDegradationStatus(),
    poolConfig: {
      max: poolConfig.max,
      min: poolConfig.min,
      idleTimeout: poolConfig.idleTimeoutMillis,
      connectionTimeout: poolConfig.connectionTimeoutMillis
    },
    error: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    status.database = 'healthy';
    status.responseTime = Date.now() - start;
    
    // 根据各项指标判断整体健康状态
    if (status.degradationStatus.isHealthy && 
        status.errorStats.isHealthy && 
        status.poolStatus.waitingCount < 10) {
      status.overallStatus = 'healthy';
    } else if (status.degradationStatus.successRate > 50) {
      status.overallStatus = 'degraded';
    } else {
      status.overallStatus = 'unhealthy';
    }
    
  } catch (error) {
    status.database = 'unhealthy';
    status.error = error.message;
    status.overallStatus = 'unhealthy';
    console.error('[DB_HEALTH] 数据库健康检查失败:', error.message);
  }
  
  return status;
};

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接是否成功
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ 数据库连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
};

/**
 * 获取数据库中的所有表
 * @returns {Promise<Array>} 表名数组
 */
const getTables = async () => {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('获取数据库表列表失败:', error);
    throw error;
  }
};

/**
 * 获取数据库中的所有数据库
 * @returns {Promise<Array>} 数据库名数组
 */
const getDatabases = async () => {
  try {
    const result = await query('SELECT datname FROM pg_database WHERE datistemplate = false');
    return result.rows.map(row => row.datname);
  } catch (error) {
    console.error('获取数据库列表失败:', error);
    throw error;
  }
};

/**
 * 清除表相关的缓存
 * @param {string} tableName - 表名
 */
const invalidateTableCache = (tableName) => {
  return cache.invalidateTableCache(tableName);
};

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计信息
 */
const getCacheStats = () => {
  return cache.getStats();
};

/**
 * 重置缓存统计
 */
const resetCacheStats = () => {
  cache.resetStats();
};

/**
 * 清空所有缓存
 */
const flushCache = () => {
  cache.flush();
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  healthCheck,
  getPoolStatus,
  getPoolErrorStats,
  getDegradationStatus,
  resetDegradationStatus,
  getTables,
  getDatabases,
  invalidateTableCache,
  getCacheStats,
  resetCacheStats,
  flushCache,
  startPoolMonitoring,
  stopPoolMonitoring,
  handlePoolExhaustion,
  poolConfig,
  poolMonitorConfig,
  poolEventConfig,
  poolDegradationConfig
};