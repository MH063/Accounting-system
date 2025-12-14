const UserRepository = require('./repositories/UserRepository');

async function testUserRepository() {
  try {
    console.log('测试用户仓库...');
    
    const userRepo = new UserRepository();
    
    // 测试根据用户名查找
    console.log('\n查找用户名: 管理员');
    const userByUsername = await userRepo.findByUsername('管理员');
    console.log('查找结果:', userByUsername ? '找到用户' : '未找到用户');
    if (userByUsername) {
      console.log('用户ID:', userByUsername.id);
      console.log('用户名:', userByUsername.username);
      console.log('邮箱:', userByUsername.email);
      console.log('密码哈希存在:', !!userByUsername.passwordHash);
    }
    
    // 测试根据邮箱查找
    console.log('\n查找邮箱: admin@example.com');
    const userByEmail = await userRepo.findByEmail('admin@example.com');
    console.log('查找结果:', userByEmail ? '找到用户' : '未找到用户');
    if (userByEmail) {
      console.log('用户ID:', userByEmail.id);
      console.log('用户名:', userByEmail.username);
      console.log('邮箱:', userByEmail.email);
      console.log('密码哈希存在:', !!userByEmail.passwordHash);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testUserRepository();