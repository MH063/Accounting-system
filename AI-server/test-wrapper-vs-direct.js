/**
 * 测试responseWrapper中间件的影响
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { responseWrapper } = require('./middleware/response');
const { strictRateLimit } = require('./middleware/security');
const UserService = require('./services/UserService');

// 创建Express应用
const app = express();
app.use(express.json());

const userService = new UserService();

// 测试1: 直接调用UserService（无中间件）
app.post('/api/auth/test-direct', async (req, res) => {
  console.log('\n=== 直接调用测试 ===');
  console.log('请求体:', req.body);
  
  try {
    const result = await userService.login({
      username: req.body.username,
      password: req.body.password,
      captchaCode: req.body.captchaCode,
      sessionId: req.body.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log('结果:', result.success ? '成功' : '失败');
    res.json(result);
  } catch (error) {
    console.log('错误:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 测试2: 使用responseWrapper
app.post('/api/auth/test-wrapper', 
  responseWrapper(async (req, res) => {
    console.log('\n=== responseWrapper测试 ===');
    console.log('请求体:', req.body);
    
    const result = await userService.login({
      username: req.body.username,
      password: req.body.password,
      captchaCode: req.body.captchaCode,
      sessionId: req.body.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log('结果:', result.success ? '成功' : '失败');
    return result;
  })
);

// 测试3: 使用strictRateLimit + responseWrapper（模拟原始路由）
app.post('/api/auth/test-original', 
  strictRateLimit({ 
    windowMs: 60000,
    maxRequests: 5,
    skipSuccessfulRequests: true 
  }), 
  responseWrapper(async (req, res) => {
    console.log('\n=== 原始路由测试 ===');
    console.log('请求体:', req.body);
    
    const result = await userService.login({
      username: req.body.username,
      password: req.body.password,
      captchaCode: req.body.captchaCode,
      sessionId: req.body.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    console.log('结果:', result.success ? '成功' : '失败');
    return result;
  })
);

const PORT = 4003;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`\n测试服务器启动在端口 ${PORT}`);
  
  setTimeout(testAllRoutes, 1000);
});

async function testAllRoutes() {
  const testData = {
    username: "寝室长",
    password: "Dormleader123.",
    captchaCode: "1234",
    sessionId: "test-session-123"
  };
  
  const tests = [
    { name: '直接调用', path: '/api/auth/test-direct' },
    { name: 'responseWrapper', path: '/api/auth/test-wrapper' },
    { name: '原始路由模式', path: '/api/auth/test-original' }
  ];
  
  for (const test of tests) {
    console.log(`\n--- 测试 ${test.name} ---`);
    
    try {
      const result = await makeHttpRequest(`http://localhost:${PORT}${test.path}`, testData);
      console.log(`状态码: ${result.status}`);
      console.log(`结果: ${result.data.success ? '✅ 成功' : '❌ 失败'}`);
      
      if (!result.data.success) {
        console.log(`错误信息: ${result.data.error || result.data.message}`);
      }
      
    } catch (error) {
      console.log(`❌ 请求异常: ${error.message}`);
    }
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
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