const axios = require('axios');

const BASE_URL = 'http://10.26.120.9:4000';

async function testAuthenticationFlow() {
  console.log('🧪 测试完整认证流程\n');

  try {
    // 1. 测试登录
    console.log('1️⃣ 测试登录...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: '管理员',
      password: 'Admin123.'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!loginResponse.data.success) {
      console.log('❌ 登录失败:', loginResponse.data.message);
      return;
    }

    console.log('✅ 登录成功!');
    console.log('响应数据:');
    console.log(`  - 用户ID: ${loginResponse.data.data.user.id}`);
    console.log(`  - 用户名: ${loginResponse.data.data.user.username}`);
    console.log(`  - 角色: ${loginResponse.data.data.user.roles.map(r => r.name).join(', ')}`);
    console.log(`  - 访问令牌: ${loginResponse.data.data.accessToken.substring(0, 20)}...`);
    console.log(`  - 刷新令牌: ${loginResponse.data.data.refreshToken.substring(0, 20)}...`);

    const accessToken = loginResponse.data.data.accessToken;
    const refreshToken = loginResponse.data.data.refreshToken;

    // 2. 测试访问受保护的API - 获取用户信息
    console.log('\n2️⃣ 测试访问用户信息API...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (profileResponse.data.success) {
        console.log('✅ 获取用户信息成功!');
        console.log('用户信息:');
        console.log(`  - 用户名: ${profileResponse.data.data.username}`);
        console.log(`  - 邮箱: ${profileResponse.data.data.email}`);
        console.log(`  - 角色: ${profileResponse.data.data.roles.map(r => r.name).join(', ')}`);
      } else {
        console.log('❌ 获取用户信息失败:', profileResponse.data.message);
      }
    } catch (error) {
      console.log('❌ 获取用户信息请求失败:', error.response?.data?.message || error.message);
    }

    // 3. 测试刷新令牌
    console.log('\n3️⃣ 测试刷新令牌...');
    try {
      const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refreshToken: refreshToken
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (refreshResponse.data.success) {
        console.log('✅ 刷新令牌成功!');
        console.log(`新访问令牌: ${refreshResponse.data.data.accessToken.substring(0, 20)}...`);
        
        // 更新访问令牌用于后续测试
        const newAccessToken = refreshResponse.data.data.accessToken;
        
        // 4. 测试使用新令牌访问
        console.log('\n4️⃣ 测试使用新令牌访问...');
        const profileResponse2 = await axios.get(`${BASE_URL}/api/auth/profile`, {
          headers: { 
            'Authorization': `Bearer ${newAccessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (profileResponse2.data.success) {
          console.log('✅ 使用新令牌访问成功!');
        } else {
          console.log('❌ 使用新令牌访问失败:', profileResponse2.data.message);
        }
      } else {
        console.log('❌ 刷新令牌失败:', refreshResponse.data.message);
      }
    } catch (error) {
      console.log('❌ 刷新令牌请求失败:', error.response?.data?.message || error.message);
    }

    // 5. 测试登出
    console.log('\n5️⃣ 测试登出...');
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (logoutResponse.data.success) {
        console.log('✅ 登出成功!');
      } else {
        console.log('❌ 登出失败:', logoutResponse.data.message);
      }
    } catch (error) {
      console.log('❌ 登出请求失败:', error.response?.data?.message || error.message);
    }

    // 6. 测试登出后无法访问受保护资源
    console.log('\n6️⃣ 测试登出后无法访问受保护资源...');
    try {
      const profileResponse3 = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (profileResponse3.data.success) {
        console.log('⚠️  登出后仍能访问受保护资源（可能有问题）');
      } else {
        console.log('✅ 登出后正确拒绝访问受保护资源');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 登出后正确拒绝访问受保护资源 (401 Unauthorized)');
      } else {
        console.log('❌ 登出后访问测试失败:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 认证流程测试完成!');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 无法连接到服务器，请确保服务器正在运行 (http://localhost:4000)');
    } else if (error.response?.status === 500) {
      console.log('❌ 服务器内部错误，请检查服务器日志');
    } else {
      console.log('❌ 请求失败:', error.message);
    }
  }
}

// 运行测试
testAuthenticationFlow().catch(console.error);