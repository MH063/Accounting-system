const axios = require('axios');

(async () => {
  try {
    console.log('=== 测试修复后的登录功能 ===\n');
    
    const API_BASE = 'http://10.26.120.9:4000';
    
    // 测试1: 直接API调用用户名登录
    console.log('1. 测试直接API调用用户名登录:');
    const usernameResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      username: '管理员',
      password: 'Admin123.',
      captchaCode: '1234',
      sessionId: 'test-session-123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestClient/1.0'
      }
    });
    
    console.log('用户名登录结果:', {
      success: usernameResponse.data.success,
      message: usernameResponse.data.message,
      user: usernameResponse.data.data?.user?.username,
      email: usernameResponse.data.data?.user?.email
    });
    
    if (usernameResponse.data.success) {
      console.log('✅ 用户名登录成功！');
    } else {
      console.log('❌ 用户名登录失败:', usernameResponse.data.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 测试2: 邮箱登录验证
    console.log('2. 测试邮箱登录验证:');
    const emailResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123.',
      captchaCode: '1234',
      sessionId: 'test-session-123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestClient/1.0'
      }
    });
    
    console.log('邮箱登录结果:', {
      success: emailResponse.data.success,
      message: emailResponse.data.message,
      user: emailResponse.data.data?.user?.username,
      email: emailResponse.data.data?.user?.email
    });
    
    if (emailResponse.data.success) {
      console.log('✅ 邮箱登录成功！');
    } else {
      console.log('❌ 邮箱登录失败:', emailResponse.data.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 测试3: 模拟前端修复后的逻辑
    console.log('3. 模拟前端修复后的智能识别逻辑:');
    const testInputs = [
      { input: '管理员', expected: 'username' },
      { input: 'admin@example.com', expected: 'email' },
      { input: 'user123', expected: 'username' },
      { input: 'test@company.com', expected: 'email' }
    ];
    
    for (const test of testInputs) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test.input);
      const actual = isEmail ? 'email' : 'username';
      const status = actual === test.expected ? '✅' : '❌';
      console.log(`${status} "${test.input}" -> ${actual} (期望: ${test.expected})`);
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
})();