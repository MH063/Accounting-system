/**
 * 主服务器文件
 * 基于Node.js + Express + PostgreSQL + JWT的后台API服务
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { pool, testConnection, getTables, getDatabases } = require('./config/database');
const logger = require('./config/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { defaultRateLimiter } = require('./middleware/rateLimiter');
const { responseWrapper } = require('./middleware/response');
const { requestLogger } = require('./middleware/requestLogger');
const { ipWhitelist, strictRateLimit, securityHeaders, sqlInjectionProtection, requestSizeLimit } = require('./middleware/security');
const { startScheduledTasks } = require('./utils/scheduledTasks');
const { cacheMiddleware } = require('./middleware/apiCache');
const authRoutes = require('./routes/auth');
const dbRoutes = require('./routes/db');
const uploadRoutes = require('./routes/upload');

// 加载环境变量
// 在 Zeabur 环境中，环境变量会自动设置
dotenv.config({ path: '.env' });

// 打印环境变量以便调试
console.log('🔍 环境检查:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('平台:', process.env.ZEABUR ? 'Zeabur' : 'Local');

// 数据库配置检查
console.log('\n💾 数据库配置:');
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL: 已设置 (Zeabur 数据库)');
  console.log('解析的连接信息:', {
    host: process.env.DATABASE_URL.split('@')[1]?.split(':')[0] || 'localhost',
    port: process.env.DATABASE_URL.split(':')[2]?.split('/')[0] || '5432',
    database: process.env.DATABASE_URL.split('/').pop() || 'unknown'
  });
} else {
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***已设置***' : '未设置');
  console.log('DB_NAME:', process.env.DB_NAME || '(未设置)');
}

// 创建Express应用
const app = express();

// 安全头部设置
app.use(helmet());

// CORS配置 - 允许所有来源
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 中间件配置
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 安全防护中间件 - 在速率限制之前应用
app.use(securityHeaders()); // 请求头安全检查
app.use(sqlInjectionProtection()); // SQL注入防护
app.use(requestSizeLimit('5mb')); // 请求大小限制

// 应用速率限制中间件
app.use(defaultRateLimiter);

// 请求日志中间件
app.use(requestLogger);

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/db', require('./routes/dbHealth'));
app.use('/api/upload', uploadRoutes);
app.use('/api/logs', require('./routes/logs'));
app.use('/api/logs', require('./routes/logManagement'));
app.use('/api/cache', require('./routes/cache'));
app.use('/api/cache', require('./routes/enhancedCache'));
app.use('/api/security', require('./routes/security'));
app.use('/api/health', require('./routes/health'));

// 服务器端口 - Zeabur 默认使用 3000
const PORT = process.env.PORT || 3000;

/**
 * 数据库连接测试函数
 * 验证数据库连接是否正常，并查询数据库中的表
 */
async function testDatabaseConnection() {
  try {
    console.log('正在尝试连接数据库...');
    
    // 使用数据库配置中的测试连接函数
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return false;
    }
    
    console.log(`连接信息: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME || '(未指定数据库)'}`);
    
    // 查询所有数据库
    const databases = await getDatabases();
    console.log('\n📋 可用数据库列表:');
    databases.forEach(db => {
      console.log(`  - ${db}`);
    });
    
    // 如果指定了数据库，查询其中的表
    if (process.env.DB_NAME) {
      try {
        const tables = await getTables();
        
        if (tables.length > 0) {
          console.log(`\n📊 数据库 "${process.env.DB_NAME}" 中的表:`);
          tables.forEach(table => {
            console.log(`  - ${table}`);
          });
        } else {
          console.log(`\n⚠️ 数据库 "${process.env.DB_NAME}" 中没有表`);
        }
      } catch (err) {
        console.error(`查询数据库 "${process.env.DB_NAME}" 中的表时出错:`, err.message);
      }
    } else {
      console.log('\n⚠️ 未指定数据库名称，请在.env文件中设置DB_NAME');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 基本路由
app.get('/', cacheMiddleware.short(), responseWrapper((req, res) => {
  return res.json({
    success: true,
    message: 'API服务运行正常',
    version: '1.0.0'
  });
}));

/**
 * API路由：测试数据库连接
 * GET /api/db-test
 */
app.get('/api/db-test', responseWrapper(async (req, res) => {
  // 使用数据库配置中的测试连接函数
  const isConnected = await testConnection();
  
  if (!isConnected) {
    return res.status(500).json({
      success: false,
      message: '数据库连接测试失败'
    });
  }
  
  // 执行简单查询获取当前时间
  const result = await pool.query('SELECT NOW() as current_time');
  
  return res.json({
    success: true,
    message: '数据库连接测试成功',
    data: {
      currentTime: result.rows[0].current_time,
      databaseInfo: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        database: process.env.DB_NAME || '(未指定)'
      }
    }
  });
}));

/**
 * API路由：获取数据库表列表
 * GET /api/tables
 */
app.get('/api/tables', responseWrapper(async (req, res) => {
  if (!process.env.DB_NAME) {
    return res.status(400).json({
      success: false,
      message: '未指定数据库名称，无法查询表'
    });
  }
  
  // 使用数据库配置中的获取表函数
  const tables = await getTables();
  
  return res.json({
    success: true,
    message: '获取数据库表列表成功',
    data: {
      tables,
      count: tables.length
    }
  });
}));

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      // 启动定时任务
      startScheduledTasks();
      
      logger.info('\n🚀 启动API服务器...');
      
      app.listen(PORT, () => {
        logger.info(`✅ 服务器已启动，端口: ${PORT}`);
        logger.info(`📝 API文档: http://localhost:${PORT}/`);
        logger.info(`🔧 数据库测试: http://localhost:${PORT}/api/db-test`);
        logger.info(`📊 表列表查询: http://localhost:${PORT}/api/tables`);
        logger.info(`📋 日志管理: http://localhost:${PORT}/api/logs`);
      });
    } else {
      logger.error('\n❌ 数据库连接失败，服务器启动中止');
      process.exit(1);
    }
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n收到SIGINT信号，正在关闭服务器...');
  const { stopScheduledTasks } = require('./utils/scheduledTasks');
  stopScheduledTasks();
  pool.end(() => {
    console.log('数据库连接池已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n收到SIGTERM信号，正在关闭服务器...');
  const { stopScheduledTasks } = require('./utils/scheduledTasks');
  stopScheduledTasks();
  pool.end(() => {
    console.log('数据库连接池已关闭');
    process.exit(0);
  });
});