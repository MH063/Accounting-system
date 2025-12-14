const http = require('http');

/**
 * 使用标准HTTP模块测试API登录
 */
async function testLoginWithHttp() {
  try {
    console.log('使用HTTP模块测试寝室长账户API登录...');
    
    // 构建请求数据
    const postData = JSON.stringify({
      username: "寝室长",
      password: "Dormleader123.",
      captchaCode: "1234",
      sessionId: "test-session-123"
    });

    console.log('请求数据:', postData);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Test-Client/1.0'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      console.log(`响应头: ${JSON.stringify(res.headers, null, 2)}`);
      
      res.setEncoding('utf8');
      let rawData = '';
      
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      
      res.on('end', () => {
        console.log('原始响应:', rawData);
        
        try {
          const parsedData = JSON.parse(rawData);
          console.log('解析后响应:', JSON.stringify(parsedData, null, 2));
          
          if (parsedData.success) {
            console.log('✅ 登录成功!');
            console.log('用户信息:', parsedData.data?.user);
            console.log('访问令牌:', parsedData.data?.tokens?.accessToken?.substring(0, 20) + '...');
          } else {
            console.log('❌ 登录失败:', parsedData.error?.message || parsedData.message);
          }
        } catch (e) {
          console.error('解析响应失败:', e.message);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`请求错误: ${e.message}`);
    });

    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

// 执行测试
testLoginWithHttp();