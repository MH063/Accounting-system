/**
 * 测试中间件堆栈问题
 * 检查responseWrapper是否影响认证流程
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { responseWrapper } = require('./middleware/response');
const AuthController = require('./controllers/AuthController');

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

// 创建Express应用
const app = express();
app.use(express.json());

// 创建AuthController实例
const authController = new AuthController();

// 添加测试路由，不使用responseWrapper
app.post('/api/auth/login-test-no-wrapper', async (req, res, next) => {
  try {
    console.log('=== 测试不使用responseWrapper的登录 ===');
    const result = await authController.login(req, res, next);
    console.log('结果:', result ? '有返回值' : '无返回值');
  } catch (error) {
    console.log('错误:', error.message);
    next(error);
  }
});

// 添加测试路由，使用responseWrapper
app.post('/api/auth/login-test-with-wrapper', 
  responseWrapper(async (req, res, next) => {
    console.log('=== 测试使用responseWrapper的登录 ===');
    const result = await authController.login(req, res, next);
    console.log('结果:', result ? '有返回值' : '无返回值');
    return result;
  })
);

// 添加测试路由，简化版
app.post('/api/auth/login-test-simple', 
  responseWrapper(async (req, res, next) => {
    console.log('=== 测试简化版登录 ===');
    const { username, password } = req.body;
    
    // 直接调用UserService进行登录
    const UserService = require('./services/UserService');
    const userService = new UserService();
    
    const loginParams = {
      username: username,
      password: password,
      captchaCode: req.body.captchaCode,
      sessionId: req.body.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    console.log('登录参数:', loginParams);
    const result = await userService.login(loginParams);
    console.log('登录结果:', result);
    return result;
  })
);

const PORT = 4001;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`测试服务器启动在端口 ${PORT}`);
  
  // 测试三种不同的路由
  testLoginRoutes();
});

async function testLoginRoutes() {
  const testData = {
    username: "寝室长",
    password: "Dormleader123.",
    captchaCode: "1234",
    sessionId: "test-session-123"
  };
  
  console.log('\n=== 开始测试不同的登录路由 ===\n');
  
  const tests = [
    { name: '不使用responseWrapper', path: '/api/auth/login-test-no-wrapper' },
    { name: '使用responseWrapper', path: '/api/auth/login-test-with-wrapper' },
    { name: '简化版测试', path: '/api/auth/login-test-simple' }
  ];
  
  for (const test of tests) {
    console.log(`\n--- 测试 ${test.name} ---`);
    
    try {
      const result = await makeHttpRequest(`http://localhost:${PORT}${test.path}`, testData);
      console.log(`响应:`, JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log(`✅ ${test.name} 成功!`);
      } else {
        console.log(`❌ ${test.name} 失败: ${result.message}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name} 异常:`, error.message);
    }
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== 测试完成，关闭服务器 ===');
  server.close();
}