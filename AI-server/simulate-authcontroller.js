// 完整模拟AuthController的登录流程
const bcrypt = require('bcryptjs');

// 拦截bcrypt.compare调用
const originalCompare = bcrypt.compare;
bcrypt.compare = function(password, hash, callback) {
  console.log('=== bcrypt.compare 在AuthController模拟中被调用 ===');
  console.log('password:', password);
  console.log('password类型:', typeof password);
  console.log('password长度:', password ? password.length : 0);
  console.log('password第一个字符:', password ? password[0] : 'null');
  console.log('password最后一个字符:', password ? password[password.length - 1] : 'null');
  console.log('hash:', hash);
  console.log('hash类型:', typeof hash);
  console.log('hash长度:', hash ? hash.length : 0);
  console.log('hash存在:', !!hash);
  
  // 添加调用栈信息
  const stack = new Error().stack;
  const lines = stack.split('\n');
  const relevantLines = lines.slice(2, 8);
  console.log('调用栈:');
  relevantLines.forEach((line, index) => {
    console.log(`  ${index + 1}. ${line.trim()}`);
  });
  console.log('=== end bcrypt.compare ===\n');
  
  return originalCompare.apply(this, arguments);
};

// 加载UserService
const UserService = require('./services/UserService');

// 模拟request对象
const mockRequest = {
  body: {
    username: '寝室长',
    password: 'Dormleader123.'
  },
  ip: '127.0.0.1',
  get: function(header) {
    if (header.toLowerCase() === 'user-agent') {
      return 'Test-Simulator/1.0';
    }
    return null;
  }
};

// 模拟response对象
const mockResponse = {
  statusCode: null,
  responseData: null,
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.responseData = data;
    console.log('响应状态码:', this.statusCode);
    console.log('响应数据:', JSON.stringify(data, null, 2));
    return this;
  }
};

async function simulateAuthControllerLogin() {
  console.log('=== 完整模拟AuthController登录流程 ===');
  
  const userService = new UserService();
  
  try {
    const { username, password, captchaCode, sessionId } = mockRequest.body;
    
    console.log('请求参数:');
    console.log('  username:', username);
    console.log('  password:', password);
    console.log('  password长度:', password ? password.length : 0);
    console.log('  captchaCode:', captchaCode);
    console.log('  sessionId:', sessionId);
    console.log('  ip:', mockRequest.ip);
    console.log('  userAgent:', mockRequest.get('User-Agent'));
    
    // 验证必填字段
    console.log('\n验证必填字段...');
    if (!password) {
      console.log('❌ 密码为空');
      return;
    }
    if (!username) {
      console.log('❌ 用户名为空');
      return;
    }
    console.log('✅ 必填字段验证通过');
    
    // 调用UserService.login（完全模拟AuthController的调用方式）
    console.log('\n调用userService.login...');
    const loginResult = await userService.login({ 
      username, 
      password,
      captchaCode,
      sessionId,
      ip: mockRequest.ip,
      userAgent: mockRequest.get('User-Agent')
    });
    
    console.log('\nUserService.login返回结果:');
    console.log('success:', loginResult.success);
    console.log('message:', loginResult.message);
    
    if (loginResult.success) {
      console.log('\n🎉 模拟AuthController登录成功!');
      const { user, tokens, session } = loginResult.data;
      console.log('用户信息:', user.username);
      console.log('访问令牌:', tokens.accessToken ? '已生成' : '未生成');
    } else {
      console.log('\n❌ 模拟AuthController登录失败:', loginResult.message);
    }
    
  } catch (error) {
    console.log('\n❌ AuthController模拟登录异常!');
    console.log('错误信息:', error.message);
    console.log('错误堆栈:', error.stack);
  }
}

simulateAuthControllerLogin().catch(console.error);