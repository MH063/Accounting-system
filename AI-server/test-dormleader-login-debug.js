/**
 * 测试寝室长账户登录功能（带调试信息）
 */

const axios = require('axios');

// 测试配置
const config = {
  baseURL: 'http://localhost:4000',
  timeout: 10000
};

// 寝室长账户信息
const dormLeaderCredentials = {
  email: 'dormleader@example.com',
  password: 'Dormleader123.'
};

async function testDormLeaderLoginWithDebug() {
  console.log('开始测试寝室长账户登录功能...');
  console.log('登录信息:', {
    email: dormLeaderCredentials.email,
    password: '[已隐藏]'
  });

  try {
    // 发送登录请求
    console.log('\n发送登录请求...');
    const response = await axios.post(`${config.baseURL}/api/auth/login`, dormLeaderCredentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('登录请求成功!');
    console.log('响应状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));

    // 验证响应结构
    if (response.data.success) {
      console.log('\n登录成功验证:');
      console.log('✓ success 字段为 true');
      
      if (response.data.data) {
        console.log('✓ 包含 data 字段');
        
        if (response.data.data.user) {
          console.log('✓ 包含用户信息');
          console.log('用户角色:', response.data.data.user.role);
          console.log('用户邮箱:', response.data.data.user.email);
          
          if (response.data.data.user.role === 'dorm_leader') {
            console.log('✓ 用户角色正确: dorm_leader');
          } else {
            console.log('✗ 用户角色错误，期望: dorm_leader，实际:', response.data.data.user.role);
          }
        } else {
          console.log('✗ 缺少用户信息');
        }
        
        if (response.data.data.tokens) {
          console.log('✓ 包含令牌对象');
          
          if (response.data.data.tokens.accessToken) {
            console.log('✓ 包含访问令牌');
          } else {
            console.log('✗ 缺少访问令牌');
          }
          
          if (response.data.data.tokens.refreshToken) {
            console.log('✓ 包含刷新令牌');
          } else {
            console.log('✗ 缺少刷新令牌');
          }
        } else {
          console.log('✗ 缺少令牌对象');
        }
      } else {
        console.log('✗ 缺少 data 字段');
      }
    } else {
      console.log('\n登录失败:');
      console.log('✗ success 字段为 false');
      console.log('错误信息:', response.data.message);
    }

  } catch (error) {
    console.error('\n登录请求失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('请求发送失败，服务器可能未启动');
      console.error('错误信息:', error.message);
    } else {
      console.error('请求配置错误:', error.message);
    }
  }
}

// 执行测试
testDormLeaderLoginWithDebug();