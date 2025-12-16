const UserRepository = require('./repositories/UserRepository');

async function testFindUserWithRoles() {
  const userRepository = new UserRepository();
  
  console.log('=== 直接测试 findUserWithRoles 方法 ===\n');
  
  // 测试缴费人用户
  console.log('测试缴费人用户:');
  try {
    const payerUser = await userRepository.findUserWithRoles('payer@example.com');
    console.log('查询结果:');
    console.log('用户ID:', payerUser ? payerUser.id : null);
    console.log('用户名:', payerUser ? payerUser.username : null);
    console.log('邮箱:', payerUser ? payerUser.email : null);
    console.log('角色:', payerUser ? payerUser.role : null);
    console.log('权限:', payerUser ? payerUser.permissions : null);
  } catch (error) {
    console.error('查询失败:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试寝室长用户
  console.log('测试寝室长用户:');
  try {
    const dormLeaderUser = await userRepository.findUserWithRoles('dormleader@example.com');
    console.log('查询结果:');
    console.log('用户ID:', dormLeaderUser ? dormLeaderUser.id : null);
    console.log('用户名:', dormLeaderUser ? dormLeaderUser.username : null);
    console.log('邮箱:', dormLeaderUser ? dormLeaderUser.email : null);
    console.log('角色:', dormLeaderUser ? dormLeaderUser.role : null);
    console.log('权限:', dormLeaderUser ? dormLeaderUser.permissions : null);
  } catch (error) {
    console.error('查询失败:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试管理员用户
  console.log('测试管理员用户:');
  try {
    const adminUser = await userRepository.findUserWithRoles('admin@example.com');
    console.log('查询结果:');
    console.log('用户ID:', adminUser ? adminUser.id : null);
    console.log('用户名:', adminUser ? adminUser.username : null);
    console.log('邮箱:', adminUser ? adminUser.email : null);
    console.log('角色:', adminUser ? adminUser.role : null);
    console.log('权限:', adminUser ? adminUser.permissions : null);
  } catch (error) {
    console.error('查询失败:', error.message);
  }
}

testFindUserWithRoles().catch(console.error);