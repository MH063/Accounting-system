/**
 * 简化版数据库配置模块 - 调试版本
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

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
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'postgres',
      ssl: false
    };
    
    // 打印配置以便调试（在开发环境）
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 数据库连接配置检查:');
      console.log('host:', config.host);
      console.log('port:', config.port);
      console.log('user:', config.user);
      console.log('password:', config.password ? '***已设置***' : '未设置');
      console.log('database:', config.database);
      console.log('SSL:', config.ssl ? '已启用' : '未启用');
    }
    
    return config;
  }
}

// 创建简化版连接池配置
const poolConfig = {
  ...getDatabaseConfig(),
  // 连接池大小配置
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 5,
  min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 1,
  // 连接生命周期配置
  idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 30000,
  connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT ? parseInt(process.env.DB_CONNECTION_TIMEOUT) : 10000,
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

// 导出模块
module.exports = {
  pool,
  query,
  testConnection,
  getPoolStatus,
  getTables,
  getDatabases,
  poolConfig
};