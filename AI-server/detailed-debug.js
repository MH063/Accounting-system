/**
 * 详细调试脚本，逐步检查服务器启动的每个环节
 */

require('dotenv').config({ path: '.env' });

console.log('🔍 详细服务器启动调试...\n');

// 检查环境变量
function checkEnvironment() {
  console.log('1️⃣ 检查环境变量:');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   PORT:', process.env.PORT);
  console.log('   DB_HOST:', process.env.DB_HOST);
  console.log('   DB_PORT:', process.env.DB_PORT);
  console.log('   DB_USER:', process.env.DB_USER);
  console.log('   DB_NAME:', process.env.DB_NAME);
  console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***已设置***' : '❌ 未设置');
}

// 检查模块导入
async function checkModules() {
  console.log('\n2️⃣ 检查模块导入:');
  
  try {
    const express = require('express');
    console.log('   ✅ Express:', express.version || '导入成功');
  } catch (e) {
    console.log('   ❌ Express导入失败:', e.message);
    return false;
  }
  
  try {
    const cors = require('cors');
    console.log('   ✅ CORS: 导入成功');
  } catch (e) {
    console.log('   ❌ CORS导入失败:', e.message);
    return false;
  }
  
  try {
    const helmet = require('helmet');
    console.log('   ✅ Helmet: 导入成功');
  } catch (e) {
    console.log('   ❌ Helmet导入失败:', e.message);
    return false;
  }
  
  try {
    const { testConnection } = require('./config/database');
    console.log('   ✅ 数据库模块: 导入成功');
    return { testConnection };
  } catch (e) {
    console.log('   ❌ 数据库模块导入失败:', e.message);
    return false;
  }
}

// 检查数据库连接
async function checkDatabase(testConnection) {
  console.log('\n3️⃣ 检查数据库连接:');
  
  try {
    console.log('   正在测试连接...');
    const result = await testConnection();
    console.log('   数据库连接结果:', result ? '✅ 成功' : '❌ 失败');
    return result;
  } catch (e) {
    console.log('   ❌ 数据库连接测试出错:', e.message);
    return false;
  }
}

// 检查定时任务
function checkScheduledTasks() {
  console.log('\n4️⃣ 检查定时任务:');
  
  try {
    const { startScheduledTasks } = require('./utils/scheduledTasks');
    console.log('   ✅ 定时任务模块: 导入成功');
    
    try {
      startScheduledTasks();
      console.log('   ✅ 定时任务: 启动成功');
      return true;
    } catch (e) {
      console.log('   ⚠️ 定时任务启动失败:', e.message);
      return false;
    }
  } catch (e) {
    console.log('   ❌ 定时任务模块导入失败:', e.message);
    return false;
  }
}

// 尝试创建服务器
async function createServer(testConnection) {
  console.log('\n5️⃣ 尝试创建服务器:');
  
  try {
    const express = require('express');
    const app = express();
    
    // 基础中间件
    const helmet = require('helmet');
    const cors = require('cors');
    
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    
    // 基础路由
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', time: new Date() });
    });
    
    // 数据库测试路由
    app.get('/api/test', async (req, res) => {
      try {
        const connected = await testConnection();
        res.json({ connected });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });
    
    console.log('   ✅ Express应用创建成功');
    return app;
  } catch (e) {
    console.log('   ❌ 服务器创建失败:', e.message);
    return false;
  }
}

// 尝试启动服务器
async function startServer(app) {
  console.log('\n6️⃣ 尝试启动服务器:');
  
  try {
    const PORT = process.env.PORT || 4000;
    
    const server = app.listen(PORT, () => {
      console.log(`   ✅ 服务器监听成功: http://localhost:${PORT}`);
      console.log(`   ✅ 健康检查: http://localhost:${PORT}/health`);
      console.log(`   ✅ 数据库测试: http://localhost:${PORT}/api/test`);
    });
    
    server.on('error', (error) => {
      console.log('   ❌ 服务器启动错误:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.log('   💡 端口已被占用，请检查是否已有服务在运行');
      }
    });
    
    // 测试服务器响应
    setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:${PORT}/health`);
        const data = await response.json();
        console.log('   ✅ 服务器响应测试:', data);
      } catch (e) {
        console.log('   ❌ 服务器响应测试失败:', e.message);
      }
    }, 1000);
    
    return server;
  } catch (e) {
    console.log('   ❌ 服务器启动失败:', e.message);
    return false;
  }
}

// 主调试函数
async function runDebug() {
  try {
    checkEnvironment();
    
    const modules = await checkModules();
    if (!modules) {
      console.log('\n❌ 模块导入失败，调试终止');
      return;
    }
    
    const { testConnection } = modules;
    
    const dbConnected = await checkDatabase(testConnection);
    
    const tasksStarted = checkScheduledTasks();
    
    const app = await createServer(testConnection);
    if (!app) {
      console.log('\n❌ 服务器创建失败，调试终止');
      return;
    }
    
    const server = await startServer(app);
    if (!server) {
      console.log('\n❌ 服务器启动失败，调试终止');
      return;
    }
    
    console.log('\n🎉 所有检查完成！');
    
    // 等待用户按键退出
    setTimeout(() => {
      console.log('\n按任意键退出...');
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', () => {
        console.log('\n正在关闭服务器...');
        server.close(() => {
          console.log('服务器已关闭');
          process.exit(0);
        });
      });
    }, 2000);
    
  } catch (error) {
    console.error('\n❌ 调试过程出现错误:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行调试
runDebug();