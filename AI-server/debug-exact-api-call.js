/**
 * 精确模拟API调用调试脚本
 * 模拟AuthController的调用方式
 */

require('dotenv').config();
const http = require('http');
const UserService = require('./services/UserService');
const logger = require('./config/logger');

// 创建UserService实例
const userService = new UserService();

async function simulateApiCall() {
  console.log('=== 开始精确模拟API调用调试 ===\n');
  
  // 模拟AuthController中接收到的请求数据
  const mockRequestData = {
    username: "寝室长",
    password: "Dormleader123.",
    captchaCode: "1234", 
    sessionId: "test-session-123"
  };
  
  console.log('步骤1: 模拟AuthController中的validateRequiredFields验证');
  try {
    // 模拟validateRequiredFields
    const requiredFields = ['username', 'password'];
    const missingFields = requiredFields.filter(field => !mockRequestData[field] || mockRequestData[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      console.log('❌ 缺少必需字段:', missingFields.join(', '));
      return;
    } else {
      console.log('✅ 必需字段验证通过');
    }
  } catch (error) {
    console.log('❌ 字段验证失败:', error.message);
    return;
  }
  
  console.log('\n步骤2: 模拟AuthController调用UserService.login');
  
  // 模拟req.ip和req.get('User-Agent')
  const mockReq = {
    ip: '127.0.0.1',
    get: (header) => {
      if (header === 'User-Agent') return 'Test-Agent/1.0';
      return null;
    }
  };
  
  const loginParams = {
    username: mockRequestData.username,
    password: mockRequestData.password,
    captchaCode: mockRequestData.captchaCode,
    sessionId: mockRequestData.sessionId,
    ip: mockReq.ip,
    userAgent: mockReq.get('User-Agent')
  };
  
  console.log('调用参数:', JSON.stringify(loginParams, null, 2));
  
  try {
    console.log('\n步骤3: 调用userService.login...');
    const loginResult = await userService.login(loginParams);
    
    console.log('\n✅ 登录调用成功!');
    console.log('登录结果结构:', {
      success: loginResult.success,
      hasData: !!loginResult.data,
      hasUser: loginResult.data ? !!loginResult.data.user : false,
      hasTokens: loginResult.data ? !!loginResult.data.tokens : false
    });
    
    if (loginResult.success) {
      console.log('用户信息:', loginResult.data.user?.username);
      console.log('访问令牌前20位:', loginResult.data.tokens?.accessToken?.substring(0, 20) + '...');
    }
    
  } catch (error) {
    console.log('\n❌ 登录调用失败!');
    console.log('错误信息:', error.message);
    console.log('错误堆栈:', error.stack);
    
    // 检查是否是密码验证问题
    if (error.message.includes('用户名或密码错误')) {
      console.log('\n🔍 密码验证问题排查:');
      
      // 直接测试密码验证
      console.log('1. 重新查找用户...');
      const userRepository = userService.userRepository;
      const user = await userRepository.findByUsername(mockRequestData.username);
      
      if (user) {
        console.log('✅ 用户存在:', user.username);
        console.log('2. 手动验证密码...');
        const bcrypt = require('bcrypt');
        
        try {
          const isValid = await bcrypt.compare(mockRequestData.password, user.passwordHash);
          console.log('密码验证结果:', isValid ? '✅ 正确' : '❌ 错误');
          
          if (!isValid) {
            console.log('3. 检查密码哈希...');
            console.log('数据库哈希:', user.passwordHash);
            console.log('输入密码:', mockRequestData.password);
            
            // 尝试重新哈希输入密码
            const testHash = await bcrypt.hash(mockRequestData.password, 10);
            console.log('重新哈希结果:', testHash);
          }
        } catch (passwordError) {
          console.log('密码验证异常:', passwordError.message);
        }
      } else {
        console.log('❌ 用户不存在');
      }
    }
  }
  
  console.log('\n=== 调试完成 ===');
}

simulateApiCall().catch(console.error);