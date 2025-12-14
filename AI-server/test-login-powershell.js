const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * 使用PowerShell的Invoke-WebRequest测试API登录
 */
async function testLoginWithPowerShell() {
  try {
    console.log('使用PowerShell测试寝室长账户API登录...');
    
    const psCommand = `Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username": "寝室长", "password": "Dormleader123.", "captchaCode": "1234", "sessionId": "test-session-123"}' | ConvertTo-Json`;
    
    console.log('执行命令:', psCommand);
    
    const { stdout, stderr } = await execPromise(`powershell -Command "${psCommand}"`);
    
    console.log('响应数据:');
    console.log(stdout);
    
    if (stderr) {
      console.error('错误信息:');
      console.error(stderr);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

// 执行测试
testLoginWithPowerShell();