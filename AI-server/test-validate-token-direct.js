const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:4000';

async function testValidateTokenDirect() {
  console.log('🔍 直接测试验证令牌接口...\n');
  
  let accessToken = null;
  
  try {
    // 1. 使用传统登录方式获取访问令牌
    console.log('1️⃣ 使用传统登录方式获取访问令牌...');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: '寝室长',
      password: 'Dormleader123.'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('   ✅ 登录成功!');
    accessToken = loginResponse.data.data.tokens.accessToken;
    const sessionToken = loginResponse.data.data.session.sessionToken;
    console.log('   获取到访问令牌:', accessToken.substring(0, 20) + '...');
    console.log('   获取到会话令牌:', sessionToken.substring(0, 20) + '...');
    console.log('');
    
    // 2. 使用获取到的会话令牌测试验证接口
    console.log('2️⃣ 发送令牌验证请求...');
    console.log('   请求地址:', `${BASE_URL}/api/auth/validate-token`);
    console.log('');
    
    const validateResponse = await axios.post(`${BASE_URL}/api/auth/validate-token`, {
      sessionToken: sessionToken
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ 令牌验证请求成功!');
    console.log('   状态码:', validateResponse.status);
    console.log('   响应数据:');
    console.log(JSON.stringify(validateResponse.data, null, 2));
    
    // 3. 测试无效令牌的情况
    console.log('\n3️⃣ 测试无效令牌的情况...');
    try {
      await axios.post(`${BASE_URL}/api/auth/validate-token`, {
        sessionToken: 'invalid_token_example'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      console.log('❌ 应该返回错误但没有返回');
    } catch (invalidTokenError) {
      if (invalidTokenError.response) {
        console.log('✅ 正确处理了无效令牌的请求');
        console.log('  状态码:', invalidTokenError.response.status);
        console.log('  错误信息:', invalidTokenError.response.data.message);
      } else {
        console.log('❌ 请求失败但不是预期的令牌验证错误');
      }
    }
    
    // 4. 测试缺少参数的情况
    console.log('\n4️⃣ 测试缺少参数的情况...');
    try {
      await axios.post(`${BASE_URL}/api/auth/validate-token`, {
        // 缺少 sessionToken 参数
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      console.log('❌ 应该返回错误但没有返回');
    } catch (paramError) {
      if (paramError.response) {
        console.log('✅ 正确处理了缺少参数的请求');
        console.log('  状态码:', paramError.response.status);
        console.log('  错误信息:', paramError.response.data.message);
      } else {
        console.log('❌ 请求失败但不是预期的参数验证错误');
      }
    }
    
  } catch (error) {
    console.log('❌ 测试过程中发生错误:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('  无法连接到服务器，请确保服务器正在运行');
      console.log('  请运行: npm start 或 node server.js');
    } else if (error.response) {
      console.log('  服务器响应错误:');
      console.log('  状态码:', error.response.status);
      console.log('  响应数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('  错误信息:', error.message);
    }
  }
  
  console.log('\n🎉 直接令牌验证接口测试完成!');
}

testValidateTokenDirect();