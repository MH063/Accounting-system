/**
 * 简单的API测试脚本
 * 用于验证两步验证接口是否可以正常响应
 */

const http = require('http');

// 测试选项
const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/two-factor/verify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': 0
  }
};

console.log('测试两步验证接口...');

// 发送测试请求
const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('响应数据:', jsonData);
      
      if (res.statusCode === 500) {
        console.log('⚠️  服务器内部错误，可能是实现问题');
      } else if (res.statusCode === 400) {
        console.log('✅ 接口正常工作，参数验证正常');
      } else {
        console.log('ℹ️  接口可访问');
      }
    } catch (parseError) {
      console.log('响应数据（非JSON格式）:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error.message);
});

// 发送空的POST请求
req.end();

// 测试需要认证的接口
setTimeout(() => {
  const protectedOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/two-factor/status',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  console.log('\n测试需要认证的接口...');
  
  const req2 = http.request(protectedOptions, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('响应数据:', jsonData);
        
        if (res.statusCode === 401) {
          console.log('✅ 认证检查正常工作');
        }
      } catch (parseError) {
        console.log('响应数据（非JSON格式）:', data);
      }
    });
  });
  
  req2.on('error', (error) => {
    console.error('请求错误:', error.message);
  });
  
  req2.end();
}, 1000);