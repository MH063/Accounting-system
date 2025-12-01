/**
 * 应用初始化模块
 * 负责应用的初始化配置和启动逻辑
 */

const dotenv = require('dotenv');
const express = require('express');
const helmet = require('helmet');
const { createCorsMiddleware } = require('../middleware/corsConfig');
const { initialize: initializeConfig, getSafeLogger, filterSensitive } = require('../config');
const { validateEnvConfig, getSafeEnvDisplay } = require('./secureEnv');
const { testConnection, getTables, getDatabases } = require('../config/database');
const { startScheduledTasks } = require('./scheduledTasks');
const logger = require('../config/logger');

/**
 * 初始化应用配置
 */
async function initializeApplication() {
  try {
    console.log('🚀 正在初始化应用配置...');
    
    // 加载环境变量
    dotenv.config({ path: '.env' });
    
    // 初始化配置模块（包含验证和过滤器）
    await initializeConfig();
    
    console.log('✅ 配置管理器初始化完成');
    
    // 获取安全日志记录器
    const safeLogger = getSafeLogger();
    
    // 记录环境变量验证结果
    const envValidation = validateEnvConfig();
    safeLogger.info('[SERVER] 环境变量验证结果', { 
      status: envValidation.status,
      warnings: envValidation.warnings,
      errors: envValidation.errors
    });
    
    // 使用安全日志记录器记录初始化信息
    safeLogger.info('[SERVER] 应用配置初始化成功', {
        nodeEnv: getSafeEnvDisplay('NODE_ENV'),
        port: getSafeEnvDisplay('PORT'),
        platform: process.env.ZEABUR ? 'Zeabur' : 'Local'
      });
    
  } catch (error) {
    console.error('❌ 配置初始化失败:', error);
    process.exit(1);
  }
}

/**
 * 数据库连接测试函数（安全版本）
 * 验证数据库连接是否正常，并查询数据库中的表
 */
async function testDatabaseConnection() {
  const safeLogger = getSafeLogger();
  
  try {
    safeLogger.info('[SERVER] 正在尝试连接数据库...');
    
    // 使用数据库配置中的测试连接函数
    const isConnected = await testConnection();
    
    if (!isConnected) {
      safeLogger.error('[SERVER] 数据库连接测试失败');
      return false;
    }
    
    safeLogger.info('[SERVER] 数据库连接成功', {
      dbUser: getSafeEnvDisplay('DB_USER'),
      dbHost: getSafeEnvDisplay('DB_HOST'),
      dbPort: getSafeEnvDisplay('DB_PORT'),
      dbName: getSafeEnvDisplay('DB_NAME') || '(未指定数据库)'
    });
    
    // 查询所有数据库
    try {
      const databases = await getDatabases();
      safeLogger.info('[SERVER] 可用数据库列表', {
        databases: databases.map(db => filterSensitive(db))
      });
    } catch (dbError) {
      safeLogger.warn('[SERVER] 查询数据库列表失败', {
        error: filterSensitive(dbError.message)
      });
    }
    
    // 如果指定了数据库，查询其中的表
    if (process.env.DB_NAME) {
      try {
        const tables = await getTables();
        
        if (tables.length > 0) {
          safeLogger.info('[SERVER] 数据库表信息', {
            database: filterSensitive(process.env.DB_NAME),
            tableCount: tables.length,
            tables: tables.map(table => filterSensitive(table))
          });
        } else {
          safeLogger.warn('[SERVER] 数据库中没有表', {
            database: filterSensitive(process.env.DB_NAME)
          });
        }
      } catch (err) {
        safeLogger.error('[SERVER] 查询数据库表失败', {
          database: filterSensitive(process.env.DB_NAME),
          error: filterSensitive(err.message)
        });
      }
    } else {
      safeLogger.warn('[SERVER] 未指定数据库名称');
    }
    
    return true;
  } catch (error) {
    safeLogger.error('[SERVER] 数据库连接失败', {
      error: filterSensitive(error.message)
    });
    return false;
  }
}

/**
 * 创建Express应用实例并配置基础中间件
 */
function createApp() {
  const app = express();
  
  // 安全头部设置
  app.use(helmet());
  
  // CORS配置 - 使用安全的CORS配置
  app.use(createCorsMiddleware());
  
  // 基础解析中间件
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  return app;
}

/**
 * 启动服务器
 */
async function startServer(app) {
  const safeLogger = getSafeLogger();
  const PORT = process.env.PORT || 3000;
  
  try {
    // 测试数据库连接 - 但不阻止服务器启动
    let dbConnected = false;
    try {
      dbConnected = await testDatabaseConnection();
    } catch (dbError) {
      safeLogger.warn('[SERVER] 数据库连接测试失败，但服务器将继续启动', {
        error: filterSensitive(dbError.message)
      });
    }
    
    // 如果数据库连接成功，启动定时任务
    if (dbConnected) {
      startScheduledTasks();
      safeLogger.info('[SERVER] 定时任务已启动');
    } else {
      safeLogger.warn('[SERVER] 数据库连接失败，定时任务未启动');
    }
    
    safeLogger.info('[SERVER] 启动API服务器');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      safeLogger.info('[SERVER] 服务器已启动', {
        port: PORT,
        apiDocs: `http://[SERVER_HOST]:${PORT}/`,
        dbTest: `http://[SERVER_HOST]:${PORT}/api/db-test`,
        tables: `http://[SERVER_HOST]:${PORT}/api/tables`,
        logs: `http://[SERVER_HOST]:${PORT}/api/logs`
      });
      
      if (!dbConnected) {
        safeLogger.warn('[SERVER] 注意：数据库连接失败，部分功能可能不可用');
      }
    });
    
    // 优雅关闭处理
    setupGracefulShutdown(server);
    
    return server;
  } catch (error) {
    safeLogger.error('[SERVER] 服务器启动失败', {
      error: filterSensitive(error.message)
    });
    process.exit(1);
  }
}

/**
 * 设置优雅关闭处理
 */
function setupGracefulShutdown(server) {
  const safeLogger = getSafeLogger();
  const { stopScheduledTasks } = require('./scheduledTasks');
  const { pool } = require('../config/database');
  
  const shutdown = () => {
    safeLogger.info('[SERVER] 正在关闭服务器...');
    stopScheduledTasks();
    
    server.close(() => {
      safeLogger.info('[SERVER] 服务器已关闭');
      pool.end(() => {
        safeLogger.info('[SERVER] 数据库连接池已关闭');
        process.exit(0);
      });
    });
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = {
  initializeApplication,
  createApp,
  startServer,
  testDatabaseConnection
};