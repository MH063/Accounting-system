#!/usr/bin/env node

/**
 * 直接测试UserService.login方法
 */

const UserService = require('./services/UserService');

async function testUserServiceLogin() {
  console.log('🔍 测试UserService.login方法...\n');

  const userService = new UserService();

  const loginData = {
    username: '管理员',
    password: 'Admin123.',
    ip: '127.0.0.1',
    userAgent: 'Test Client'
  };

  try {
    console.log('📝 登录数据:');
    console.log(`   - 用户名: ${loginData.username}`);
    console.log(`   - 密码: ${loginData.password}`);
    console.log(`   - IP: ${loginData.ip}`);
    console.log(`   - UserAgent: ${loginData.userAgent}\n`);

    const result = await userService.login(loginData);

    console.log('✅ 登录成功!');
    console.log('📦 登录结果:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ 登录失败:');
    console.error('   错误消息:', error.message);
    console.error('   错误堆栈:', error.stack);
    
    // 尝试获取更详细的错误信息
    if (error.cause) {
      console.error('   错误原因:', error.cause);
    }
  }
}

testUserServiceLogin().catch(console.error);