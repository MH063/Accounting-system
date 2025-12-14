// 详细调试认证流程
const UserService = require('./services/UserService');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function debugAuthFlow() {
    console.log('=== 详细调试认证流程 ===\n');
    
    const userService = new UserService();
    
    // 准备测试参数
    const username = '寝室长';
    const password = 'Dormleader123.';
    const ip = '127.0.0.1';
    const userAgent = 'Debug-Script/1.0';
    
    console.log('1. 原始参数:');
    console.log('   username:', username);
    console.log('   password:', password);
    console.log('   password length:', password.length);
    console.log('   password bytes:', Buffer.from(password).toString('hex'));
    
    // 测试bcrypt.compare
    console.log('\n2. 测试bcrypt.compare:');
    try {
        // 先查找用户
        const user = await userService.findUserByUsernameOrEmail(username);
        if (!user) {
            console.log('   用户不存在');
            return;
        }
        
        console.log('   找到用户:', user.username);
        console.log('   存储的密码hash:', user.password);
        
        // 测试bcrypt.compare
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('   bcrypt.compare结果:', isPasswordValid);
        
        // 详细比较
        console.log('\n3. 详细密码比较:');
        console.log('   原始密码:', password);
        console.log('   密码charCodes:', password.split('').map(c => c.charCodeAt(0)));
        
        // 测试不同的hash
        const saltRounds = 12;
        const newHash = await bcrypt.hash(password, saltRounds);
        console.log('   新生成的hash:', newHash);
        console.log('   原hash:', user.password);
        console.log('   新hash长度:', newHash.length);
        console.log('   原hash长度:', user.password.length);
        
        // 比较两个hash
        const compareWithNewHash = await bcrypt.compare(password, newHash);
        console.log('   与新hash比较结果:', compareWithNewHash);
        
    } catch (error) {
        console.error('调试过程出错:', error.message);
        console.error(error.stack);
    }
    
    console.log('\n4. 直接调用UserService.login:');
    try {
        const result = await userService.login({
            username: username,
            password: password,
            ip: ip,
            userAgent: userAgent
        });
        console.log('   登录成功:', result.success);
    } catch (error) {
        console.error('   登录失败:', error.message);
    }
}

// 运行调试
debugAuthFlow().catch(console.error);