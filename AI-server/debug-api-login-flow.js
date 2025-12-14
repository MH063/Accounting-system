/**
 * 调试API级别的登录流程
 * 模拟完整的API请求流程，找出服务级别和API级别的差异
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const UserService = require('./services/UserService');
const UserRepository = require('./repositories/UserRepository');
const logger = require('./config/logger');

async function debugApiLoginFlow() {
  console.log('=== 开始调试API级别登录流程 ===\n');
  
  const userService = new UserService();
  
  // 模拟API请求的完整数据（从AuthController接收到的数据）
  const apiRequestData = {
    username: '寝室长',
    password: 'Dormleader123.',
    captchaCode: '1234',
    sessionId: 'test-session-123',
    ip: '127.0.0.1',
    userAgent: 'Debug-API-Client/1.0'
  };
  
  console.log('1. API请求数据:');
  console.log(JSON.stringify(apiRequestData, null, 2));
  console.log();
  
  try {
    // 步骤1：检查数据库中的用户数据
    console.log('=== 步骤1: 检查数据库中的用户数据 ===');
    const userRepository = new UserRepository();
    const dbUser = await userRepository.findByUsername('寝室长');
    
    if (dbUser) {
      console.log('✅ 用户在数据库中存在');
      console.log('用户信息:');
      console.log('  ID:', dbUser.id);
      console.log('  用户名:', dbUser.username);
      console.log('  邮箱:', dbUser.email);
      console.log('  密码哈希存在:', !!dbUser.password_hash);
      console.log('  密码哈希长度:', dbUser.password_hash ? dbUser.password_hash.length : 0);
      console.log('  状态:', dbUser.status);
      
      // 检查密码验证
      if (dbUser.password_hash) {
        const passwordMatch = await bcrypt.compare('Dormleader123.', dbUser.password_hash);
        console.log('  密码验证结果:', passwordMatch ? '✅ 匹配' : '❌ 不匹配');
      }
    } else {
      console.log('❌ 用户在数据库中不存在');
      return;
    }
    console.log();
    
    // 步骤2：模拟AuthController的数据处理
    console.log('=== 步骤2: 模拟AuthController的数据处理 ===');
    const { username, password, captchaCode, sessionId } = apiRequestData;
    
    console.log('从API请求中提取的数据:');
    console.log('  username:', username);
    console.log('  password: [HIDDEN]');
    console.log('  captchaCode:', captchaCode);
    console.log('  sessionId:', sessionId);
    console.log();
    
    // 步骤3：调用UserService.login并详细追踪
    console.log('=== 步骤3: 调用UserService.login ===');
    
    // 创建日志捕获器
    const originalLog = logger.info;
    const logs = [];
    logger.info = function(...args) {
      logs.push(args.join(' '));
      originalLog.apply(this, args);
    };
    
    try {
      const result = await userService.login(apiRequestData);
      
      // 恢复原始日志
      logger.info = originalLog;
      
      console.log('登录结果:');
      console.log('  success:', result.success);
      console.log('  message:', result.message);
      
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
      logger.info = originalLog;
      console.log('❌ 登录异常:');
      console.log('  错误类型:', error.constructor.name);
      console.log('  错误消息:', error.message);
      console.log('  错误堆栈:', error.stack);
    }
    
    console.log('\n=== 步骤4: 详细日志分析 ===');
    console.log('UserService执行过程中的日志:');
    logs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });
    
  } catch (error) {
    console.log('❌ 调试过程异常:');
    console.log('  错误类型:', error.constructor.name);
    console.log('  错误消息:', error.message);
    console.log('  错误堆栈:', error.stack);
  }
  
  console.log('\n=== API级别调试完成 ===');
}

// 运行调试
debugApiLoginFlow().catch(console.error);