const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function debugLoginResponse() {
  console.log('🔍 调试登录响应数据结构\n');

  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: '管理员',
      password: 'Admin123.'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log('完整响应:');
    console.log(JSON.stringify(loginResponse.data, null, 2));

    console.log('\n响应字段检查:');
    console.log('success:', loginResponse.data.success);
    console.log('data:', loginResponse.data.data);
    console.log('user:', loginResponse.data.data?.user);
    console.log('accessToken:', loginResponse.data.data?.accessToken);
    console.log('refreshToken:', loginResponse.data.data?.refreshToken);
    console.log('user.roles:', loginResponse.data.data?.user?.roles);

  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    if (error.response) {
      console.log('错误响应:', error.response.data);
    }
  }
}

debugLoginResponse().catch(console.error);