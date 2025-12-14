const http = require('http');

function testLoginAPI() {
  console.log('=== 直接HTTP请求测试登录API ===');
  
  // 创建请求数据
  const requestData = JSON.stringify({
    username: '寝室长',
    password: 'Dormleader123.'
  });
  
  // 请求选项
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestData)
    }
  };
  
  console.log('发送HTTP请求到:', `http://${options.hostname}:${options.port}${options.path}`);
  
  const req = http.request(options, (res) => {
    let responseData = '';
    
    console.log(`响应状态码: ${res.statusCode}`);
    console.log('响应头:', res.headers);
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('\n响应数据:');
      try {
        const parsed = JSON.parse(responseData);
        console.log(JSON.stringify(parsed, null, 2));
        
        if (parsed.success) {
          console.log('\n✅ 登录成功!');
        } else {
          console.log('\n❌ 登录失败:', parsed.message);
        }
      } catch (e) {
        console.log('响应数据解析失败:', responseData);
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('\n❌ 请求失败:', error.message);
  });
  
  req.write(requestData);
  req.end();
}

// 等待服务器启动完成
setTimeout(() => {
  testLoginAPI();
}, 2000);