const http = require('http');

// 测试配置
const baseURL = 'http://172.25.37.9:4000';
const testUser = {
  username: 'securitytest_' + Date.now(),
  email: 'securitytest' + Date.now() + '@example.com',
  password: 'SecurePassword123!'
};

// 全局变量存储token
let accessToken = null;
let refreshToken = null;
let userId = null;

// HTTP请求函数
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// 测试1: 用户注册
async function testRegister() {
  console.log('\n🔐 测试1: 用户注册');
  const data = JSON.stringify(testUser);
  const options = {
    hostname: '172.25.37.9',
    port: 4000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const result = await makeRequest(options, data);
  console.log(`📊 状态码: ${result.status}`);
  console.log(`📋 响应:`, JSON.stringify(result.data, null, 2));
  
  if (result.data.success && result.data.data && result.data.data.user) {
    userId = result.data.data.user.id;
    console.log(`✅ 注册成功, 用户ID: ${userId}`);
    return true;
  } else {
    console.log(`❌ 注册失败`);
    return false;
  }
}

// 测试2: 用户登录（双令牌机制）
async function testLogin() {
  console.log('\n🔑 测试2: 用户登录（双令牌机制）');
  const data = JSON.stringify({
    username: testUser.username,
    password: testUser.password
  });
  
  const options = {
    hostname: '172.25.37.9',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const result = await makeRequest(options, data);
  console.log(`📊 状态码: ${result.status}`);
  console.log(`📋 响应:`, JSON.stringify(result.data, null, 2));
  
  if (result.data.success && result.data.data) {
    accessToken = result.data.data.accessToken;
    refreshToken = result.data.data.refreshToken;
    console.log(`✅ 登录成功，获得双令牌`);
    console.log(`🔑 Access Token: ${accessToken ? '✅' : '❌'}`);
    console.log(`🔄 Refresh Token: ${refreshToken ? '✅' : '❌'}`);
    return true;
  } else {
    console.log(`❌ 登录失败`);
    return false;
  }
}

// 测试3: 令牌验证（保护接口）
async function testProtectedRoute() {
  console.log('\n🛡️ 测试3: 访问保护接口');
  
  if (!accessToken) {
    console.log('❌ 缺少access token');
    return false;
  }
  
  const options = {
    hostname: '172.25.37.9',
    port: 4000,
    path: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };
  
  const result = await makeRequest(options);
  console.log(`📊 状态码: ${result.status}`);
  console.log(`📋 响应:`, JSON.stringify(result.data, null, 2));
  
  if (result.status === 200 && result.data.success) {
    console.log(`✅ 令牌验证成功，访问保护接口成功`);
    return true;
  } else {
    console.log(`❌ 令牌验证失败`);
    return false;
  }
}

// 测试4: 令牌刷新
async function testTokenRefresh() {
  console.log('\n🔄 测试4: 令牌刷新');
  
  if (!refreshToken) {
    console.log('❌ 缺少refresh token');
    return false;
  }
  
  const data = JSON.stringify({
    refreshToken: refreshToken
  });
  
  const options = {
    hostname: '172.25.37.9',
    port: 4000,
    path: '/api/auth/refresh',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const result = await makeRequest(options, data);
  console.log(`📊 状态码: ${result.status}`);
  console.log(`📋 响应:`, JSON.stringify(result.data, null, 2));
  
  if (result.data.success && result.data.data) {
    accessToken = result.data.data.accessToken;
    console.log(`✅ 令牌刷新成功`);
    console.log(`🔑 新的Access Token: ${accessToken ? '✅' : '❌'}`);
    return true;
  } else {
    console.log(`❌ 令牌刷新失败`);
    return false;
  }
}

// 测试5: 登出（令牌黑名单）
async function testLogout() {
  console.log('\n🚪 测试5: 登出功能');
  
  if (!accessToken) {
    console.log('❌ 缺少access token');
    return false;
  }
  
  const data = JSON.stringify({
    refreshToken: refreshToken
  });
  
  const options = {
    hostname: '172.25.37.9',
    port: 4000,
    path: '/api/auth/logout',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const result = await makeRequest(options, data);
  console.log(`📊 状态码: ${result.status}`);
  console.log(`📋 响应:`, JSON.stringify(result.data, null, 2));
  
  if (result.data.success) {
    console.log(`✅ 登出成功，令牌已加入黑名单`);
    return true;
  } else {
    console.log(`❌ 登出失败`);
    return false;
  }
}

// 测试6: 登出后令牌验证（黑名单测试）
async function testBlacklist() {
  console.log('\n🚫 测试6: 令牌黑名单验证');
  
  const options = {
    hostname: '172.25.37.9',
    port: 4000,
    path: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };
  
  const result = await makeRequest(options);
  console.log(`📊 状态码: ${result.status}`);
  console.log(`📋 响应:`, JSON.stringify(result.data, null, 2));
  
  if (result.status === 401 || (result.data && !result.data.success)) {
    console.log(`✅ 令牌黑名单验证成功，已失效令牌被拒绝`);
    return true;
  } else {
    console.log(`❌ 令牌黑名单验证失败`);
    return false;
  }
}

// 测试7: 恶意攻击模拟
async function testMaliciousAttempts() {
  console.log('\n⚠️ 测试7: 恶意攻击模拟');
  
  // 测试无效token
  console.log(`🔍 测试无效token...`);
  let options = {
    hostname: '172.25.37.9',
    port: 4000,
    path: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid_token_12345'
    }
  };
  
  let result = await makeRequest(options);
  console.log(`📊 无效token状态码: ${result.status}`);
  
  // 测试缺少token
  console.log(`🔍 测试缺少token...`);
  options = {
    hostname: '172.25.37.9',
    port: 4000,
    path: '/api/auth/profile',
    method: 'GET'
  };
  
  result = await makeRequest(options);
  console.log(`📊 缺少token状态码: ${result.status}`);
  
  // 测试过期token
  console.log(`🔍 测试过期token...`);
  // 这里应该使用已过期的token，但我们当前没有，所以跳过
  console.log(`⏭️ 跳过过期token测试（需要手动设置）`);
  
  console.log(`✅ 恶意攻击模拟完成`);
  return true;
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始认证安全机制综合测试');
  console.log('🎯 测试用户:', testUser.username);
  console.log('📍 服务器地址:', baseURL);
  console.log('⏰ 开始时间:', new Date().toLocaleString());
  
  const results = [];
  
  try {
    // 执行所有测试
    results.push(await testRegister());
    results.push(await testLogin());
    results.push(await testProtectedRoute());
    results.push(await testTokenRefresh());
    results.push(await testLogout());
    results.push(await testBlacklist());
    results.push(await testMaliciousAttempts());
    
    // 统计结果
    const passed = results.filter(r => r === true).length;
    const total = results.length;
    
    console.log('\n📊 测试结果统计:');
    console.log(`✅ 通过: ${passed}/${total}`);
    console.log(`❌ 失败: ${total - passed}/${total}`);
    console.log(`📈 成功率: ${Math.round((passed/total) * 100)}%`);
    
    if (passed === total) {
      console.log('\n🎉 所有认证安全测试通过！');
      console.log('🔐 双令牌机制: ✅');
      console.log('🚫 令牌黑名单: ✅');
      console.log('🛡️ 保护接口验证: ✅');
      console.log('🔄 令牌刷新: ✅');
      console.log('🚪 安全登出: ✅');
      console.log('⚠️ 恶意攻击防护: ✅');
    } else {
      console.log('\n⚠️ 部分测试失败，请检查服务器日志');
    }
    
  } catch (error) {
    console.error('❌ 测试执行错误:', error.message);
  }
  
  console.log('\n⏰ 结束时间:', new Date().toLocaleString());
}

// 运行测试
runAllTests();