const http = require('http');

// 测试数据
const testData = {
  username: 'testuser_' + Date.now(),
  email: 'testuser' + Date.now() + '@example.com',
  password: 'TestPassword123!'
};

const data = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('🧪 测试注册接口...');
console.log('📤 发送数据:', JSON.stringify(testData, null, 2));
console.log('📊 数据长度:', Buffer.byteLength(data), '字节');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('📥 响应状态:', res.statusCode);
    console.log('📊 Content-Length 头部:', res.headers['content-length']);
    
    try {
      const response = JSON.parse(responseData);
      console.log('📋 响应内容:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('✅ 注册成功!');
        if (response.data && response.data.user) {
          console.log('👤 创建的用户:', {
            id: response.data.user.id,
            username: response.data.user.username,
            email: response.data.user.email
          });
        }
      } else {
        console.log('❌ 注册失败:', response.message);
        if (response.errors) {
          console.log('🔍 错误详情:', response.errors);
        }
      }
    } catch (error) {
      console.log('❌ 解析响应失败:', error.message);
      console.log('📄 原始响应:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ 请求失败:', error.message);
});

req.write(data);
req.end();