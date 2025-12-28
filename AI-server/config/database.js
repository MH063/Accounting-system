/**
 * 简化版数据库配置模块 - 调试版本
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const { getSecureEnv, getSafeEnvDisplay } = require('../utils/secureEnv');

dotenv.config({ path: '.env' });

// 获取数据库配置
function getDatabaseConfig() {
  // 直接使用.env文件中的本地数据库配置
  console.log('使用本地数据库配置');
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    ssl: false
  };
  
  // 打印配置以便调试（在开发环境）
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 数据库连接配置检查');
    console.log('host:', getSafeEnvDisplay('DB_HOST'));
    console.log('port:', getSafeEnvDisplay('DB_PORT'));
    console.log('user:', getSafeEnvDisplay('DB_USER'));
    console.log('password:', getSafeEnvDisplay('DB_PASSWORD') ? '***已设置**' : '未设置');
    console.log('database:', getSafeEnvDisplay('DB_NAME'));
    console.log('SSL:', config.ssl ? '已启用' : '未启用');
  }
  
  return config;
}

// 创建连接池时设置UTF-8编码
const poolConfig = {
  ...getDatabaseConfig(),
  // 连接池大小配置
  max: getSecureEnv('DB_POOL_MAX') ? parseInt(getSecureEnv('DB_POOL_MAX')) : 5,
  min: getSecureEnv('DB_POOL_MIN') ? parseInt(getSecureEnv('DB_POOL_MIN')) : 1,
  // 连接生命周期配置
  idleTimeoutMillis: getSecureEnv('DB_IDLE_TIMEOUT') ? parseInt(getSecureEnv('DB_IDLE_TIMEOUT')) : 30000,
  connectionTimeoutMillis: getSecureEnv('DB_CONNECTION_TIMEOUT') ? parseInt(getSecureEnv('DB_CONNECTION_TIMEOUT')) : 10000,
  // 连接验证
  allowExitOnIdle: false,
  keepAlive: true,
};

// 创建连接池
const pool = new Pool(poolConfig);

// 设置UTF-8字符编码
pool.on('connect', (client) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB_POOL] 新连接已建立');
  }
  // 设置UTF-8字符编码
  client.query('SET client_encoding TO UTF8;');
});

// 简化的错误处理 - 避免信息泄露
pool.on('error', (err, client) => {
  if (err.message.includes('ECONNRESET') || err.message.includes('socket hang up')) {
    // 忽略常见的空闲连接重置错误，不打印到错误控制台
    return;
  }
  console.error('[DB_POOL] 连接池错误:', err.message);
});

// 简化版查询函数 - 过滤敏感信息
const query = async (text, params = []) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB_QUERY] 执行查询: ...');
  }
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DB_QUERY] 查询成功 (${duration}ms)`);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[DB_QUERY] 查询失败 (${duration}ms)`);
    throw error;
  }
};

// 简化版测试连接函数 - 避免信息泄露
const testConnection = async () => {
  console.log('[DB_TEST] 开始测试连接...');
  let client;
  try {
    client = await pool.connect();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DB_TEST] 获得连接');
    }
    
    await client.query('SELECT NOW()');
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DB_TEST] 执行查询成功');
    }
    
    console.log('✅ 数据库连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  } finally {
    if (client) {
      client.release();
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DB_TEST] 连接已释放');
      }
    }
  }
};

// 获取连接池状态
const getPoolStatus = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

// 获取表列表
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

// 获取数据库列表
const getDatabases = async () => {
  try {
    const result = await query('SELECT datname FROM pg_database WHERE datistemplate = false');
    return result.rows.map(row => row.datname);
  } catch (error) {
    console.error('获取数据库列表失败', error);
    throw error;
  }
};

// 导入API缓存模块的函数
const { getStats, resetStats, flush } = require('../middleware/apiCache');

// 获取缓存统计信息
const getCacheStats = () => {
  return getStats();
};

// 重置缓存统计
const resetCacheStats = () => {
  resetStats();
};

// 清空所有缓存
const flushCache = async () => {
  await flush();
};

// 健康检查函数 - 过滤敏感信息
const healthCheck = async () => {
  let client;
  try {
    client = await pool.connect();
    const start = Date.now();
    const result = await client.query('SELECT NOW() as current_time');
    const responseTime = Date.now() - start;
    
    const poolStatus = getPoolStatus();
    
    return {
      status: 'healthy',
      message: '数据库连接正常',
      timestamp: result.rows[0].current_time instanceof Date ? result.rows[0].current_time.toISOString() : new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      poolSize: poolStatus.totalCount,
      availableConnections: poolStatus.idleCount,
      totalConnections: poolStatus.totalCount,
      waitingCount: poolStatus.waitingCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: '数据库连接失败',
      timestamp: new Date().toISOString(),
      responseTime: 0,
      errorCount: 1
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};

// 获取降级状态
const getDegradationStatus = () => {
  const poolStatus = getPoolStatus();
  const isDegraded = poolStatus.waitingCount > 0 || poolStatus.idleCount === 0;
  
  return {
    status: isDegraded ? 'degraded' : 'healthy',
    details: {
      ...poolStatus,
      message: isDegraded ? '连接池负载过高' : '系统运行正常'
    }
  };
};

// 导出模块
module.exports = {
  pool,
  query,
  testConnection,
  healthCheck,
  dbHealthCheck: healthCheck, // 为向后兼容提供别名
  getPoolStatus,
  getTables,
  getDatabases,
  poolConfig,
  getCacheStats,
  resetCacheStats,
  flushCache,
  getDegradationStatus
};
