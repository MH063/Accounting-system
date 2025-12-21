/**
 * 主服务器文件
 * 基于Node.js + Express + PostgreSQL + JWT的后台API服务
 */

const express = require('express');
const { createCorsMiddleware } = require('./middleware/corsConfig');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { pool, testConnection, getTables, getDatabases } = require('./config/database');
const logger = require('./config/logger');
const { notFound } = require('./middleware/errorHandling');
const { errorHandler } = require('./middleware/errorHandling');
const { defaultRateLimiter } = require('./middleware/rateLimiter');
const { responseWrapper } = require('./middleware/response');
const { requestLogger } = require('./middleware/requestLogger');
const { ipWhitelist, strictRateLimit, securityHeaders, sqlInjectionProtection, requestSizeLimit } = require('./middleware/security');
// 直接从xssProtection.js导入以绕过索引问题
const { xssProtection: xssProtectionMiddleware } = require('./middleware/security/xssProtection');
// 导入csrfProtection
const { csrfProtection: csrfProtectionMiddleware } = require('./middleware/security/csrfProtection');
// 导入信息泄露防护中间件
const { infoLeakProtection, errorLeakProtection, sanitizeRequestData } = require('./middleware/infoLeakProtection');
// 导入安全环境变量管理
const { validateEnvConfig, getSafeEnvDisplay } = require('./utils/secureEnv');
const { startScheduledTasks } = require('./utils/scheduledTasks');
const { cacheMiddleware } = require('./middleware/apiCache');
const { initSwaggerMiddleware } = require('./middleware/swagger');
const authRoutes = require('./routes/auth');
const dbRoutes = require('./routes/db');
const uploadRoutes = require('./routes/upload');
const memberStatsRoutes = require('./routes/memberStats');
const memberActivitiesRoutes = require('./routes/memberActivities');
const membersRoutes = require('./routes/members');

// 加载环境变量
// 在 Zeabur 环境中，环境变量会自动设置
dotenv.config({ path: '.env' });

// 设置Node.js字符编码
process.env.NODE_OPTIONS = '--icu-data-dir=node_modules/full-icu';

// 验证环境变量配置
const envValidation = validateEnvConfig();
if (envValidation.status !== 'OK') {
  console.log('环境变量验证结果:', envValidation.status);
  if (envValidation.warnings.length > 0) {
    console.warn('⚠️  警告:', envValidation.warnings);
  }
  if (envValidation.errors.length > 0) {
    console.error('❌ 错误:', envValidation.errors);
  }
  if (envValidation.missing.length > 0) {
    console.error('❌ 缺失的必需变量:', envValidation.missing);
  }
}



// 创建Express应用
const app = express();

// 安全头部设置 - 使用更完善的Helmet配置
app.use(helmet({
  // 内容安全策略
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http://[SERVER_HOST]"],
      connectSrc: ["'self'", "https://api.github.com", "https://api.pixabay.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      childSrc: ["'none'"]
    },
  },
  // 阻止页面被嵌入iframe
  frameguard: { action: 'deny' },
  // 隐藏X-Powered-By头
  hidePoweredBy: true,
  // 防止MIME类型嗅探
  noSniff: true,
  // 启用XSS过滤
  xssFilter: true,
  // 禁用IE8的DNS预取
  ieNoOpen: true,
  // 不显示P3P头
  noP3P: true,
  // 严格传输安全
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS配置 - 使用安全的CORS配置
app.use(createCorsMiddleware());

// 中间件配置
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 设置字符编码为UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 静态文件服务 - 用于提供HTML测试页面等静态资源
// 重要：静态文件中间件必须放在所有路由之前，确保静态文件优先级最高
app.use(express.static('public'));
app.use(express.static(__dirname));
app.use('/test-page', express.static(__dirname));

// 信息泄露防护中间件 - 必须在静态文件服务之后，其他中间件之前
app.use(infoLeakProtection()); // 防护响应信息泄露

// 安全防护中间件 - 在速率限制之前应用
app.use(securityHeaders()); // 请求头安全检查
app.use(sqlInjectionProtection()); // SQL注入防护
app.use(xssProtectionMiddleware); // XSS防护
app.use(requestSizeLimit('10mb')); // 请求大小限制 - 调整为10mb以匹配express.json限制

// 应用速率限制中间件
app.use(defaultRateLimiter);

// 请求日志中间件
app.use(requestLogger);

// CSRF保护中间件 - 仅对API请求生效
app.use(csrfProtectionMiddleware());

// ===================== 版本化路由系统集成 =====================
// 导入版本化路由组件
const { apiVersionManager } = require('./config/apiVersionManager');
const { routeConfigManager } = require('./config/routeConfigManager');
const { versionedRoutingMiddleware } = require('./config/versionedRoutingMiddleware');

// 添加版本化路由中间件 - 在静态文件服务之后，API路由之前
app.use('/api', versionedRoutingMiddleware.getRouter());

// ===================== 版本化API路由配置 =====================
// 在版本化系统中注册现有路由，保持向后兼容

// 版本管理API
app.use('/api/system', apiVersionManager.getRouter());

// 路由配置管理API
app.use('/api/system', routeConfigManager.getRouter());

// 向后兼容：现有路由保持不变，但增加版本支持
// 这些路由将通过版本化中间件自动支持版本识别
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/adminAuth')); // 管理端认证路由
app.use('/api/db', dbRoutes);
app.use('/api/db', require('./routes/dbHealth'));
app.use('/api/upload', uploadRoutes);

// 注册版本化用户管理路由示例
app.use('/api/users', require('./routes/versioned-users'));

// 现有用户路由（向后兼容）
app.use('/api/users', require('./routes/users'));

app.use('/api/logs', require('./routes/logs'));
app.use('/api/logs', require('./routes/logManagement'));
app.use('/api/cache', require('./routes/cache'));
app.use('/api/cache', require('./routes/enhancedCache'));
app.use('/api/cache', require('./routes/multiLevelCache'));
app.use('/api/oauth2', require('./routes/oauth2'));
app.use('/api/permissions', require('./routes/permissions'));
// API文档路由
app.use('/api/docs', require('./routes/apiDocs'));
app.use('/api/queues', require('./routes/messageQueue'));

// 仪表盘路由
app.use('/api/dashboard', require('./routes/dashboard'));

// 智能提醒路由
app.use('/api', require('./routes/smartReminders'));

// 客户端功能控制路由
app.use('/api/dorms', require('./routes/dorms'));
app.use('/api/member-stats', require('./routes/memberStats'));
app.use('/api/member-activities', require('./routes/memberActivities'));
app.use('/api/members', require('./routes/members'));
app.use('/api/quick-stats', require('./routes/quickStats'));

// 初始化Swagger中间件（在路由注册后）
initSwaggerMiddleware(app);
app.use('/api/health', require('./routes/health'));
app.use('/api/virus-scan', require('./routes/virusScan'));
app.use('/api/cors', require('./routes/corsManagement'));
app.use('/api/audit', require('./routes/audit'));

// 费用摘要路由
app.use('/api/expense-summary', require('./routes/expenseSummary'));

// 费用管理路由
app.use('/api/expenses', require('./routes/expenses'));

// 支付相关路由
app.use('/api/payment', require('./routes/payment'));

// 服务器端口
// 优先使用环境变量PORT（例如在Zeabur等平台上通常为3000）
// 本地开发默认使用4000端口，以匹配测试脚本和文档
const PORT = process.env.PORT || 4000;

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
      console.log('❌ 数据库连接测试失败');
      return false;
    }
    
    console.log(`连接信息: [USER]@[HOST]:[PORT]/[DATABASE]`); // 不显示实际的连接信息
    console.log(`数据库用户: ${getSafeEnvDisplay('DB_USER')}`);
    console.log(`数据库主机: ${getSafeEnvDisplay('DB_HOST')}`);
    console.log(`数据库端口: ${getSafeEnvDisplay('DB_PORT')}`);
    console.log(`数据库名称: ${getSafeEnvDisplay('DB_NAME')}`);
    
    // 查询所有数据库
    try {
      const databases = await getDatabases();
      console.log('\n📋 可用数据库列表:');
      databases.forEach(db => {
        console.log(`  - ${db}`);
      });
    } catch (dbError) {
      console.warn('⚠️ 查询数据库列表失败:', dbError.message);
    }
    
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
app.get('/', responseWrapper((req, res) => {
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
  try {
    // 使用数据库配置中的测试连接函数
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        message: '数据库连接测试失败',
        error: '数据库服务不可用'
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
          host: '[REDACTED]', // 不暴露数据库主机信息
          port: '[REDACTED]', // 不暴露数据库端口信息
          user: '[REDACTED]', // 不暴露数据库用户信息
          database: '[REDACTED]' // 不暴露数据库名称
        }
      }
    });
  } catch (error) {
    console.error('数据库测试路由错误:', error);
    return res.status(503).json({
      success: false,
      message: '数据库服务暂时不可用',
      error: error.message
    });
  }
}));

/**
 * API路由：获取数据库表列表
 * GET /api/tables
 */
app.get('/api/tables', responseWrapper(async (req, res) => {
  try {
    if (!process.env.DB_NAME) {
      return res.status(400).json({
        success: false,
        message: '未指定数据库名称，无法查询表'
      });
    }
    
    // 先测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        message: '数据库连接失败，无法查询表列表',
        error: '数据库服务不可用'
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
  } catch (error) {
    console.error('获取表列表路由错误:', error);
    return res.status(503).json({
      success: false,
      message: '数据库服务暂时不可用',
      error: error.message
    });
  }
}));

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接 - 但不阻止服务器启动
    let dbConnected = false;
    try {
      dbConnected = await testDatabaseConnection();
    } catch (dbError) {
      logger.warn('⚠️ 数据库连接测试失败，但服务器将继续启动:', dbError.message);
    }
    
    // 如果数据库连接成功，启动定时任务
    if (dbConnected) {
      startScheduledTasks();
      logger.info('✅ 定时任务已启动');
    } else {
      logger.warn('⚠️ 数据库连接失败，定时任务未启动');
    }
    
    logger.info('\n🚀 启动API服务器...');
    
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`✅ 服务器已启动，端口: ${PORT}`);
      logger.info(`📝 API文档: http://[SERVER_HOST]:${PORT}/`);
      logger.info(`🔧 数据库测试: http://[SERVER_HOST]:${PORT}/api/db-test`);
      logger.info(`📊 表列表查询: http://[SERVER_HOST]:${PORT}/api/tables`);
      logger.info(`📋 日志管理: http://[SERVER_HOST]:${PORT}/api/logs`);
      
      if (!dbConnected) {
        logger.warn('⚠️ 注意：数据库连接失败，部分功能可能不可用');
      }
    });
    
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

// 错误处理中间件 - 使用统一的错误处理系统
app.use(errorLeakProtection()); // 防止错误信息泄露
app.use(notFound());

// 全局异步错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  logger.error('未处理的Promise拒绝', { 
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
  // 这里可以添加告警机制，比如发送邮件或通知
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  logger.error('未捕获的异常', { 
    error: error.message,
    stack: error.stack,
    name: error.name
  });
  
  // 给服务器一些时间来处理当前请求
  setTimeout(() => {
    console.log('正在优雅关闭服务器...');
    process.exit(1);
  }, 1000);
});

// 全局异步错误处理包装器 - 用于捕获路由中的异步错误
const wrapAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('路由异步错误:', error);
      logger.error('路由异步错误', {
        error: error.message,
        stack: error.stack,
        route: req.originalUrl,
        method: req.method,
        ip: req.ip
      });
      next(error);
    });
  };
};

// 重新包装所有异步路由处理函数
const originalAppGet = app.get.bind(app);
const originalAppPost = app.post.bind(app);
const originalAppPut = app.put.bind(app);
const originalAppDelete = app.delete.bind(app);

app.get = function(path, ...handlers) {
  const wrappedHandlers = handlers.map(handler => {
    if (typeof handler === 'function' && handler.constructor.name === 'AsyncFunction') {
      return wrapAsync(handler);
    }
    return handler;
  });
  return originalAppGet(path, ...wrappedHandlers);
};

app.post = function(path, ...handlers) {
  const wrappedHandlers = handlers.map(handler => {
    if (typeof handler === 'function' && handler.constructor.name === 'AsyncFunction') {
      return wrapAsync(handler);
    }
    return handler;
  });
  return originalAppPost(path, ...wrappedHandlers);
};

app.put = function(path, ...handlers) {
  const wrappedHandlers = handlers.map(handler => {
    if (typeof handler === 'function' && handler.constructor.name === 'AsyncFunction') {
      return wrapAsync(handler);
    }
    return handler;
  });
  return originalAppPut(path, ...wrappedHandlers);
};

app.delete = function(path, ...handlers) {
  const wrappedHandlers = handlers.map(handler => {
    if (typeof handler === 'function' && handler.constructor.name === 'AsyncFunction') {
      return wrapAsync(handler);
    }
    return handler;
  });
  return originalAppDelete(path, ...wrappedHandlers);
};

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
