const UserService = require('./services/UserService');

async function testUserService() {
  try {
    console.log('测试用户服务...');
    
    const userService = new UserService();
    
    // 测试登录
    console.log('\n测试登录: 寝室长');
    try {
      const loginResult = await userService.login({
        username: '寝室长',
        password: 'Dormleader123.',
        captchaCode: '1234',
        sessionId: 'test-session-123',
        ip: '127.0.0.1',
        userAgent: 'Test-Agent'
      });
      
      console.log('登录结果:', loginResult.success ? '成功' : '失败');
      if (loginResult.success && loginResult.data && loginResult.data.user) {
        console.log('用户ID:', loginResult.data.user.id);
        console.log('用户名:', loginResult.data.user.username);
        console.log('访问令牌:', loginResult.data.tokens.accessToken.substring(0, 20) + '...');
      } else {
        console.log('错误信息:', loginResult.error ? loginResult.error.message : '未知错误');
      }
    } catch (error) {
      console.error('登录异常:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testUserService();