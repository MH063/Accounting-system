const axios = require('axios');

async function testDormleaderLogin() {
  try {
    console.log('开始测试寝室长账户登录API...');
    console.log('请求URL: http://localhost:4000/api/auth/login');
    
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      username: '寝室长',
      password: 'Dormleader123.'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ API请求成功!');
    console.log('响应状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));

    // 检查响应结构
    if (response.data.success) {
      console.log('\n🎉 登录成功!');
      console.log('Token:', response.data.data?.token ? '已生成' : '未生成');
      if (response.data.data?.user) {
        console.log('用户信息:', response.data.data.user.username);
        console.log('用户角色:', response.data.data.user.roles);
      }
    } else {
      console.log('\n❌ 登录失败:', response.data.message || '未知错误');
    }

  } catch (error) {
    console.log('\n❌ API请求失败!');
    
    if (error.response) {
      console.log('错误状态码:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('网络错误: 无法连接到服务器');
      console.log('请检查服务器是否在4000端口运行');
    } else {
      console.log('请求错误:', error.message);
    }
  }
}

// 运行测试
testDormleaderLogin();