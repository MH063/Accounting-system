const http = require('http');
const logger = require('./config/logger');

/**
 * 测试寝室长账户API登录
 */
async function testDormLeaderLogin() {
  try {
    console.log('开始测试寝室长账户API登录...');
    
    // 准备请求数据
    const postData = JSON.stringify({
      username: '寝室长',
      password: 'Dormleader123.',
      captchaCode: '1234',
      sessionId: 'test-session-123'
    });

    console.log('请求数据:', postData);

    // 发送HTTP请求
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      console.log(`响应头: ${JSON.stringify(res.headers)}`);
      
      res.setEncoding('utf8');
      let rawData = '';
      
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          console.log('响应数据:', JSON.stringify(parsedData, null, 2));
          
          if (parsedData.success) {
            console.log('✅ 登录成功!');
            console.log('用户信息:', parsedData.data.user);
            console.log('访问令牌:', parsedData.data.tokens.accessToken.substring(0, 20) + '...');
          } else {
            console.log('❌ 登录失败:', parsedData.message);
          }
        } catch (e) {
          console.error('解析响应失败:', e.message);
          console.log('原始响应:', rawData);
        }
        
        process.exit(0);
      });
    });

    req.on('error', (e) => {
      console.error(`请求遇到问题: ${e.message}`);
      process.exit(1);
    });

    // 写入数据到请求主体
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

// 执行测试
testDormLeaderLogin();