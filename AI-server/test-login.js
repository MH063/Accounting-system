const http = require('http');

const postData = JSON.stringify({
  username: '寝室长',
  password: 'Dormleader123.',
  captchaCode: '1234',
  sessionId: 'test-session-123'
});

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
    } catch (e) {
      console.error('解析响应失败:', e.message);
      console.log('原始响应:', rawData);
    }
  });
});

req.on('error', (e) => {
  console.error(`请求遇到问题: ${e.message}`);
});

// 写入数据到请求主体
req.write(postData);
req.end();