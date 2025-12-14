/**
 * 详细追踪UserService登录过程中的bcrypt调用
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const UserService = require('./services/UserService');
const UserRepository = require('./repositories/UserRepository');
const UserModel = require('./models/UserModel');
const logger = require('./config/logger');

// 拦截bcrypt.compare调用
const originalCompare = bcrypt.compare;
bcrypt.compare = function(password, hash, callback) {
  console.log('=== bcrypt.compare 调用 ===');
  console.log('password:', password);
  console.log('hash:', hash);
  console.log('hash类型:', typeof hash);
  console.log('hash长度:', hash ? hash.length : 'null');
  console.log('hash存在:', !!hash);
  console.log('=== end bcrypt.compare ===\n');
  
  return originalCompare.apply(this, arguments);
};

async function traceBcryptComparison() {
  console.log('=== 开始追踪bcrypt.compare调用 ===\n');
  
  try {
    // 直接查询用户数据并查看UserModel映射
    const userRepository = new UserRepository();
    console.log('1. 从数据库查询用户...');
    const dbUser = await userRepository.findByUsername('寝室长');
    
    if (dbUser) {
      console.log('2. UserModel映射后的用户数据:');
      console.log('  原始密码哈希:', dbUser.passwordHash);
      console.log('  密码哈希类型:', typeof dbUser.passwordHash);
      console.log('  密码哈希长度:', dbUser.passwordHash ? dbUser.passwordHash.length : 'null');
      console.log('  密码哈希存在:', !!dbUser.passwordHash);
      console.log();
      
      // 现在调用UserService.login
      console.log('3. 调用UserService.login...');
      const userService = new UserService();
      
      const loginData = {
        username: '寝室长',
        password: 'Dormleader123.',
        captchaCode: '1234',
        sessionId: 'test-session-123',
        ip: '127.0.0.1',
        userAgent: 'Trace-Client/1.0'
      };
      
      try {
        const result = await userService.login(loginData);
        console.log('4. UserService.login结果:', result);
      } catch (error) {
        console.log('4. UserService.login异常:', error.message);
        console.log('异常堆栈:', error.stack);
      }
    }
    
  } catch (error) {
    console.error('追踪过程中出错:', error.message);
  }
  
  console.log('\n=== bcrypt调用追踪完成 ===');
}

// 运行追踪
traceBcryptComparison().catch(console.error);