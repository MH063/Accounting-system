const axios = require('axios');

async function run() {
  try {
    console.log('开始：登录并获取令牌与会话...');
    const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
      username: '寝室长',
      password: 'Dormleader123.'
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (!loginRes.data?.success) {
      console.log('登录失败:', loginRes.data);
      return;
    }

    const accessToken = loginRes.data.data?.tokens?.accessToken;
    const sessionToken = loginRes.data.data?.session?.sessionToken;
    console.log('获取到accessToken:', accessToken ? 'OK' : '缺失');
    console.log('获取到sessionToken:', sessionToken ? 'OK' : '缺失');

    if (!accessToken || !sessionToken) {
      console.log('登出测试无法继续：缺少accessToken或sessionToken');
      return;
    }

    console.log('\n开始：调用登出接口...');
    const logoutRes = await axios.post('http://localhost:4000/api/auth/logout', {
      sessionToken
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('登出响应状态码:', logoutRes.status);
    console.log('登出响应数据:', JSON.stringify(logoutRes.data, null, 2));

    if (logoutRes.data?.success) {
      console.log('\n✅ 登出成功，状态:', logoutRes.data.data?.status);
    } else {
      console.log('\n❌ 登出失败:', logoutRes.data?.message);
    }
  } catch (error) {
    console.log('\n❌ 测试失败');
    if (error.response) {
      console.log('错误状态码:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误信息:', error.message);
    }
  }
}

run();
