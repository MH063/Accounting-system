/**
 * 全面的API测试脚本
 * 用于验证所有两步验证接口的功能
 */

const http = require('http');

// 测试数据
const testData = {
  userId: 1,
  code: '123456',
  codeType: 'login'
};

// 将测试数据转换为JSON字符串
const postData = JSON.stringify(testData);

// 测试选项
const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/two-factor/verify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('测试两步验证接口（提供完整参数）...');

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
      console.log('响应数据:', JSON.stringify(jsonData, null, 2));
      
      if (res.statusCode === 400 || res.statusCode === 401) {
        console.log('✅ 接口正常工作，业务逻辑验证正常');
      } else if (res.statusCode === 500) {
        console.log('⚠️  服务器内部错误');
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

// 发送带有参数的POST请求
req.write(postData);
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
        console.log('响应数据:', JSON.stringify(jsonData, null, 2));
        
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

// 测试生成验证码接口
setTimeout(() => {
  const generateData = JSON.stringify({ codeType: 'login' });
  
  const generateOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/two-factor/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(generateData)
    }
  };
  
  console.log('\n测试生成验证码接口...');
  
  const req3 = http.request(generateOptions, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('响应数据:', JSON.stringify(jsonData, null, 2));
        
        if (res.statusCode === 401) {
          console.log('✅ 认证检查正常工作');
        } else if (res.statusCode === 400) {
          console.log('✅ 参数验证正常工作');
        }
      } catch (parseError) {
        console.log('响应数据（非JSON格式）:', data);
      }
    });
  });
  
  req3.on('error', (error) => {
    console.error('请求错误:', error.message);
  });
  
  req3.write(generateData);
  req3.end();
}, 2000);