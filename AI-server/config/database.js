/**
 * 简化版数据库配置模块 - 调试版本
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const { getSecureEnv, getSafeEnvDisplay } = require('../utils/secureEnv');

dotenv.config({ path: '.env' });

// 获取数据库配置
function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    console.log('使用 Zeabur 数据库配置');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  } else {
    console.log('⚠️ 使用单独的数据库配置（本地环境）');
    const config = {
      host: process.env.DB_HOST || '[DB_HOST]',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'postgres',
      ssl: false
    };
    
    // 打印配置以便调试（在开发环境）
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 数据库连接配置检查:');
      console.log('host:', getSafeEnvDisplay('DB_HOST'));
      console.log('port:', getSafeEnvDisplay('DB_PORT'));
      console.log('user:', getSafeEnvDisplay('DB_USER'));
      console.log('password:', getSafeEnvDisplay('DB_PASSWORD') ? '***已设置***' : '未设置');
      console.log('database:', getSafeEnvDisplay('DB_NAME'));
      console.log('SSL:', config.ssl ? '已启用' : '未启用');
    }
    
    return config;
  }
}

// 创建简化版连接池配置
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

// 简化的错误处理
pool.on('error', (err, client) => {
  console.error('[DB_POOL] 连接池错误:', err.message);
});

pool.on('connect', (client) => {
  console.log('[DB_POOL] 新连接已建立');
});

pool.on('acquire', (client) => {
  console.log('[DB_POOL] 连接已从池中获取');
});

pool.on('remove', (client) => {
  console.log('[DB_POOL] 连接已从池中移除');
});

// 简化版查询函数
const query = async (text, params = []) => {
  console.log(`[DB_QUERY] 执行查询: ${text.substring(0, 100)}...`);
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB_QUERY] 查询成功 (${duration}ms)`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[DB_QUERY] 查询失败 (${duration}ms):`, error.message);
    throw error;
  }
};

// 简化版测试连接函数
const testConnection = async () => {
  console.log('[DB_TEST] 开始测试连接...');
  try {
    const client = await pool.connect();
    console.log('[DB_TEST] 获得连接');
    
    await client.query('SELECT NOW()');
    console.log('[DB_TEST] 执行查询成功');
    
    client.release();
    console.log('[DB_TEST] 连接已释放');
    
    console.log('✅ 数据库连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
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
    console.error('获取数据库列表失败:', error);
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
const flushCache = () => {
  flush();
};

// 健康检查函数
const healthCheck = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    
    return {
      status: 'healthy',
      message: '数据库连接正常',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
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