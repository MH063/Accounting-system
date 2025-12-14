const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * 使用curl测试API登录
 */
async function testLoginWithCurl() {
  try {
    console.log('使用curl测试寝室长账户API登录...');
    
    const curlCommand = `curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"username": "寝室长", "password": "Dormleader123.", "captchaCode": "1234", "sessionId": "test-session-123"}'`;
    
    console.log('执行命令:', curlCommand);
    
    const { stdout, stderr } = await execPromise(curlCommand);
    
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
testLoginWithCurl();