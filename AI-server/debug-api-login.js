const UserService = require('./services/UserService');
const logger = require('./config/logger');

/**
 * 详细调试API登录问题
 */
async function debugApiLogin() {
  try {
    console.log('开始详细调试API登录问题...');
    
    // 创建UserService实例
    const userService = new UserService();
    
    // 测试登录数据
    const loginData = {
      username: '寝室长',
      password: 'Dormleader123.',
      captchaCode: '1234',
      sessionId: 'test-session-123',
      ip: '127.0.0.1',
      userAgent: 'Test-Agent'
    };
    
    console.log('登录数据:', JSON.stringify(loginData, null, 2));
    
    // 步骤1: 检查用户是否存在
    console.log('\n步骤1: 检查用户是否存在');
    const userRepository = userService.userRepository;
    const user = await userRepository.findByUsername(loginData.username);
    console.log('查询结果:', user ? '找到用户' : '未找到用户');
    
    if (user) {
      console.log('用户详情:');
      console.log('- ID:', user.id);
      console.log('- 用户名:', user.username);
      console.log('- 邮箱:', user.email);
      console.log('- 密码哈希存在:', !!user.passwordHash);
      console.log('- 密码哈希长度:', user.passwordHash ? user.passwordHash.length : 0);
      console.log('- 用户状态:', user.status);
      console.log('- 锁定状态:', user.lockedUntil);
      console.log('- 失败次数:', user.failedLoginAttempts);
      
      // 步骤2: 检查密码
      console.log('\n步骤2: 验证密码');
      const bcrypt = require('bcrypt');
      console.log('输入密码:', loginData.password);
      console.log('数据库密码哈希:', user.passwordHash);
      
      try {
        const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
        console.log('密码验证结果:', isPasswordValid ? '正确' : '错误');
        
        if (!isPasswordValid) {
          console.log('尝试手动验证密码...');
          // 尝试重新计算哈希
          const testHash = await bcrypt.hash(loginData.password, 10);
          console.log('测试哈希:', testHash);
        }
      } catch (passwordError) {
        console.error('密码验证异常:', passwordError.message);
      }
      
      // 步骤3: 检查验证码
      console.log('\n步骤3: 验证验证码');
      const captchaValid = await userService.validateCaptcha(loginData.captchaCode, loginData.sessionId, loginData.ip);
      console.log('验证码验证结果:', captchaValid ? '有效' : '无效');
      
      // 步骤4: 尝试完整登录
      console.log('\n步骤4: 尝试完整登录');
      try {
        const loginResult = await userService.login(loginData);
        console.log('登录结果:', loginResult.success ? '成功' : '失败');
        if (loginResult.success) {
          console.log('✅ 登录成功!');
          console.log('用户ID:', loginResult.data.user.id);
          console.log('用户名:', loginResult.data.user.username);
        } else {
          console.log('❌ 登录失败:', loginResult.message);
        }
      } catch (loginError) {
        console.error('登录异常:', loginError.message);
        console.error('错误堆栈:', loginError.stack);
      }
    } else {
      console.log('❌ 用户不存在');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('调试失败:', error);
    process.exit(1);
  }
}

// 执行调试
debugApiLogin();