// 拦截bcrypt.compare调用
const bcrypt = require('bcryptjs');

const originalCompare = bcrypt.compare;
bcrypt.compare = function(password, hash, callback) {
  console.log('=== bcrypt.compare 被调用 ===');
  console.log('password:', password);
  console.log('password类型:', typeof password);
  console.log('password长度:', password ? password.length : 0);
  console.log('hash:', hash);
  console.log('hash类型:', typeof hash);
  console.log('hash长度:', hash ? hash.length : 0);
  console.log('hash存在:', !!hash);
  console.log('=== end bcrypt.compare ===\n');
  
  return originalCompare.apply(this, arguments);
};

// 然后加载UserService
const UserService = require('./services/UserService');

async function testDirectUserService() {
  console.log('=== 直接测试UserService.login ===');
  
  const userService = new UserService();
  
  try {
    console.log('\n调用 userService.login...');
    const result = await userService.login({
      username: '寝室长',
      password: 'Dormleader123.',
      ip: '127.0.0.1',
      userAgent: 'Test-Client/1.0'
    });
    
    console.log('\n✅ UserService.login调用成功!');
    console.log('返回结果:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 登录验证通过!');
    } else {
      console.log('\n❌ 登录验证失败:', result.message);
    }
    
  } catch (error) {
    console.log('\n❌ UserService.login调用失败!');
    console.log('错误信息:', error.message);
    console.log('错误堆栈:', error.stack);
  }
}

testDirectUserService().catch(console.error);