// 拦截bcrypt.compare调用 - 用于监控API级别
const bcrypt = require('bcryptjs');

const originalCompare = bcrypt.compare;
bcrypt.compare = function(password, hash, callback) {
  console.log('=== bcrypt.compare API级别调用 ===');
  console.log('password:', password);
  console.log('password类型:', typeof password);
  console.log('password长度:', password ? password.length : 0);
  console.log('hash:', hash);
  console.log('hash类型:', typeof hash);
  console.log('hash长度:', hash ? hash.length : 0);
  console.log('hash存在:', !!hash);
  
  // 添加调用栈信息
  const stack = new Error().stack;
  const lines = stack.split('\n');
  const relevantLines = lines.slice(2, 8); // 获取调用栈的关键部分
  console.log('调用栈:');
  relevantLines.forEach((line, index) => {
    console.log(`  ${index + 1}. ${line.trim()}`);
  });
  console.log('=== end bcrypt.compare ===\n');
  
  return originalCompare.apply(this, arguments);
};

const axios = require('axios');

async function testApiWithBcryptMonitoring() {
  console.log('=== 使用bcrypt监控测试API ===');
  
  try {
    console.log('\n发送API请求...');
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

  } catch (error) {
    console.log('\n❌ API请求失败!');
    
    if (error.response) {
      console.log('错误状态码:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('网络错误: 无法连接到服务器');
    } else {
      console.log('请求错误:', error.message);
    }
  }
}

testApiWithBcryptMonitoring().catch(console.error);