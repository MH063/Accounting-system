/**
 * 路由级别调试脚本
 * 直接在路由处理中添加详细调试信息
 */

require('dotenv').config();
const express = require('express');
const http = require('http');

// 创建Express应用
const app = express();
app.use(express.json());

// 引入必要的模块
const UserService = require('./services/UserService');
const logger = require('./config/logger');

// 创建UserService实例
const userService = new UserService();

// 登录路由 - 带详细调试
app.post('/api/auth/debug-login', async (req, res, next) => {
  console.log('\n=== 路由级别调试开始 ===');
  
  // 1. 打印原始请求信息
  console.log('1. 请求信息:');
  console.log('  - 方法:', req.method);
  console.log('  - 路径:', req.path);
  console.log('  - IP:', req.ip);
  console.log('  - User-Agent:', req.get('User-Agent'));
  console.log('  - Content-Type:', req.get('Content-Type'));
  
  // 2. 打印请求体
  console.log('2. 原始请求体:');
  console.log('  ', JSON.stringify(req.body, null, 2));
  
  // 3. 打印解析后的数据类型
  console.log('3. 请求体数据类型:');
  console.log('  - req.body类型:', typeof req.body);
  console.log('  - req.body是否为对象:', req.body && typeof req.body === 'object');
  console.log('  - req.body是否有username:', req.body && 'username' in req.body);
  console.log('  - req.body是否有password:', req.body && 'password' in req.body);
  
  // 4. 检查参数值
  if (req.body) {
    console.log('4. 参数值检查:');
    console.log('  - username:', JSON.stringify(req.body.username));
    console.log('  - password:', JSON.stringify(req.body.password));
    console.log('  - username长度:', req.body.username ? req.body.username.length : 'undefined');
    console.log('  - password长度:', req.body.password ? req.body.password.length : 'undefined');
    
    // 字节长度检查
    if (req.body.username) {
      const usernameBuffer = Buffer.from(req.body.username, 'utf8');
      console.log('  - username字节长度:', usernameBuffer.length);
      console.log('  - username十六进制:', usernameBuffer.toString('hex').substring(0, 50) + '...');
    }
    
    if (req.body.password) {
      const passwordBuffer = Buffer.from(req.body.password, 'utf8');
      console.log('  - password字节长度:', passwordBuffer.length);
      console.log('  - password十六进制:', passwordBuffer.toString('hex').substring(0, 50) + '...');
    }
  }
  
  // 5. 验证必需字段
  console.log('5. 验证必需字段:');
  const requiredFields = ['username', 'password'];
  const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].toString().trim() === '');
  
  if (missingFields.length > 0) {
    console.log('  ❌ 缺少必需字段:', missingFields.join(', '));
    return res.status(400).json({
      success: false,
      message: `缺少必需字段: ${missingFields.join(', ')}`
    });
  } else {
    console.log('  ✅ 必需字段验证通过');
  }
  
  try {
    // 6. 调用UserService
    console.log('6. 调用UserService.login...');
    
    const loginParams = {
      username: req.body.username,
      password: req.body.password,
      captchaCode: req.body.captchaCode,
      sessionId: req.body.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    console.log('7. 传递给UserService的参数:');
    console.log('  ', JSON.stringify(loginParams, null, 2));
    
    const result = await userService.login(loginParams);
    
    console.log('8. UserService调用结果:');
    console.log('  - success:', result.success);
    console.log('  - hasData:', !!result.data);
    console.log('  - data.user:', result.data?.user?.username);
    
    if (result.success) {
      console.log('✅ 登录成功!');
      return res.json({
        success: true,
        message: '登录成功',
        data: result.data
      });
    } else {
      console.log('❌ 登录失败:', result.message);
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }
    
  } catch (error) {
    console.log('8. UserService调用异常:');
    console.log('  - 错误类型:', error.constructor.name);
    console.log('  - 错误消息:', error.message);
    console.log('  - 错误堆栈:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});

const PORT = 4002;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`\n调试服务器启动在端口 ${PORT}`);
  console.log('测试地址: http://localhost:' + PORT + '/api/auth/debug-login');
  
  // 等待一秒后开始测试
  setTimeout(testDebugRoute, 1000);
});

async function testDebugRoute() {
  console.log('\n=== 开始测试调试路由 ===');
  
  const testData = {
    username: "寝室长",
    password: "Dormleader123.",
    captchaCode: "1234",
    sessionId: "test-session-123"
  };
  
  try {
    const result = await makeHttpRequest(`http://localhost:${PORT}/api/auth/debug-login`, testData);
    console.log('\n=== 响应结果 ===');
    console.log('状态码:', result.status);
    console.log('响应数据:', JSON.stringify(result.data, null, 2));
    
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }
  
  console.log('\n=== 测试完成，关闭服务器 ===');
  server.close();
}

// HTTP请求辅助函数
function makeHttpRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      }
    };

    const postData = JSON.stringify(data);
    options.headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request(options, (res) => {
      let rawData = '';
      res.setEncoding('utf8');
      
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          reject(new Error('Failed to parse response: ' + e.message));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}