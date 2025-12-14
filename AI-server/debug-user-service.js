const UserService = require('./services/UserService');
const UserRepository = require('./repositories/UserRepository');
const UserModel = require('./models/UserModel');
const logger = require('./config/logger');

/**
 * 调试UserService和UserRepository的交互
 */
async function debugUserService() {
  try {
    console.log('开始调试UserService和UserRepository的交互...');
    
    // 创建UserRepository实例
    const userRepository = new UserRepository();
    
    // 测试1: 直接查询数据库
    console.log('\n测试1: 直接查询数据库');
    const dbUser = await userRepository.findByUsername('寝室长');
    console.log('数据库查询结果:', dbUser ? '找到用户' : '未找到用户');
    if (dbUser) {
      console.log('用户ID:', dbUser.id);
      console.log('用户名:', dbUser.username);
      console.log('邮箱:', dbUser.email);
      console.log('密码哈希存在:', !!dbUser.passwordHash);
      console.log('密码哈希长度:', dbUser.passwordHash ? dbUser.passwordHash.length : 0);
      console.log('用户状态:', dbUser.status);
    }
    
    // 测试2: 直接使用UserModel.fromDatabase
    console.log('\n测试2: 直接使用UserModel.fromDatabase');
    const { query } = require('./config/database');
    const result = await query('SELECT * FROM users WHERE username = $1 LIMIT 1', ['寝室长']);
    if (result.rows.length > 0) {
      const userModel = UserModel.fromDatabase(result.rows[0]);
      console.log('UserModel创建成功:', !!userModel);
      console.log('用户ID:', userModel.id);
      console.log('用户名:', userModel.username);
      console.log('邮箱:', userModel.email);
      console.log('密码哈希存在:', !!userModel.passwordHash);
      console.log('密码哈希长度:', userModel.passwordHash ? userModel.passwordHash.length : 0);
      console.log('用户状态:', userModel.status);
    }
    
    // 测试3: 使用UserService.login
    console.log('\n测试3: 使用UserService.login');
    const userService = new UserService();
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
      if (loginResult.success) {
        console.log('用户ID:', loginResult.data.user.id);
        console.log('用户名:', loginResult.data.user.username);
      } else {
        console.log('错误信息:', loginResult.message);
      }
    } catch (error) {
      console.error('登录异常:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('调试失败:', error);
    process.exit(1);
  }
}

// 执行调试
debugUserService();