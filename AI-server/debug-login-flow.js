/**
 * 登录流程调试脚本
 */

require('dotenv').config();
const UserService = require('./services/UserService');

async function debugLoginFlow() {
  console.log('=== 开始调试登录流程 ===\n');
  
  const userService = new UserService();
  
  // 模拟登录请求数据
  const loginData = {
    username: '寝室长',
    password: 'Dormleader123.',
    captchaCode: '1234',
    sessionId: 'test-session-123',
    ip: '127.0.0.1',
    userAgent: 'Debug-Client/1.0'
  };
  
  console.log('1. 登录请求数据:');
  console.log(JSON.stringify(loginData, null, 2));
  console.log();
  
  try {
    // 直接调用UserService.login并添加详细日志
    const result = await userService.login(loginData);
    
    console.log('2. 登录结果:');
    console.log('success:', result.success);
    console.log('message:', result.message);
    
    if (result.success) {
      console.log('✅ 登录成功！');
      console.log('用户信息:', {
        id: result.data.user.id,
        username: result.data.user.username,
        email: result.data.user.email
      });
    } else {
      console.log('❌ 登录失败:', result.message);
    }
    
  } catch (error) {
    console.log('2. 登录异常:');
    console.log('错误类型:', error.constructor.name);
    console.log('错误消息:', error.message);
    console.log('错误堆栈:', error.stack);
  }
  
  console.log('\n=== 调试完成 ===');
}

// 如果直接运行此脚本
if (require.main === module) {
  debugLoginFlow();
}

module.exports = { debugLoginFlow };