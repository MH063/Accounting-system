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

// 创建数据库连接池
const poolConfig = {
  ...dbConfig,
  // 连接池大小配置
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10, // 最大连接数，Zeabur 环境建议较小
  min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 2, // 最小连接数
  // 连接生命周期配置
  idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 30000, // 空闲连接超时时间，默认30秒
  connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT ? parseInt(process.env.DB_CONNECTION_TIMEOUT) : 10000, // 连接超时时间，默认10秒
  // 高级配置
  acquireTimeoutMillis: process.env.DB_ACQUIRE_TIMEOUT ? parseInt(process.env.DB_ACQUIRE_TIMEOUT) : 60000, // 获取连接超时时间，默认60秒
  // 连接验证配置
  allowExitOnIdle: false, // 不允许在空闲时退出进程
  keepAlive: true, // 启用TCP keep-alive
  keepAliveInitialDelayMillis: 10000, // keep-alive初始延迟，默认10秒
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

// 连接池事件监听
pool.on('connect', (client) => {
  console.log('[DB_POOL] 新连接已建立');
});

pool.on('acquire', (client) => {
  console.log('[DB_POOL] 连接已从池中获取');
});

pool.on('remove', (client) => {
  console.log('[DB_POOL] 连接已从池中移除');
});

pool.on('error', (err, client) => {
  console.error('[DB_POOL] 连接池发生错误:', err);
});

// 连接池状态监控
const getPoolStatus = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

// 定期记录连接池状态
setInterval(() => {
  const status = getPoolStatus();
  console.log('[DB_POOL] 连接池状态:', status);
}, 60000); // 每分钟记录一次

/**
 * 执行数据库查询的辅助函数
 * @param {string} text - SQL查询语句
 * @param {Array} params - 查询参数
 * @param {Object} options - 查询选项
 * @returns {Promise} 查询结果
 */
const query = async (text, params = [], options = {}) => {
  const start = Date.now();
  const { useCache = true, cacheTTL = 300 } = options;
  
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
    console.log('执行查询耗时:', duration, 'ms');
    
    // 如果是SELECT查询且启用了缓存，将结果存入缓存
    if (useCache && text.trim().toUpperCase().startsWith('SELECT')) {
      cache.set(text, params, res, cacheTTL);
    }
    
    return res;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
};

/**
 * 事务执行函数
 * @param {Function} callback - 事务回调函数，接收client作为参数
 * @returns {Promise} 事务结果
 */
const transaction = async (callback) => {
  const start = Date.now();
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

/**
 * 数据库健康检查
 * @returns {Promise<Object>} 健康状态信息
 */
const healthCheck = async () => {
  const start = Date.now();
  const status = {
    database: 'unknown',
    responseTime: 0,
    poolStatus: getPoolStatus(),
    error: null
  };
  
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    status.database = 'healthy';
    status.responseTime = Date.now() - start;
  } catch (error) {
    status.database = 'unhealthy';
    status.error = error.message;
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
  getTables,
  getDatabases,
  invalidateTableCache,
  getCacheStats,
  resetCacheStats,
  flushCache
};