const bcrypt = require('bcrypt');
const bcryptjs = require('bcryptjs');

async function testBcryptCompatibility() {
  console.log('=== 测试bcrypt包兼容性 ===\n');
  
  const testPassword = 'Dormleader123.';
  console.log('测试密码:', testPassword);
  
  // 1. 使用bcrypt包生成哈希
  console.log('\n1. 使用bcrypt包生成哈希:');
  const bcryptHash = await bcrypt.hash(testPassword, 10);
  console.log('bcrypt哈希:', bcryptHash);
  console.log('bcrypt哈希长度:', bcryptHash.length);
  
  // 2. 使用bcryptjs包生成哈希
  console.log('\n2. 使用bcryptjs包生成哈希:');
  const bcryptjsHash = await bcryptjs.hash(testPassword, 10);
  console.log('bcryptjs哈希:', bcryptjsHash);
  console.log('bcryptjs哈希长度:', bcryptjsHash.length);
  
  // 3. 交叉验证测试
  console.log('\n3. 交叉验证测试:');
  
  // bcrypt生成 + bcrypt验证
  const bcryptToBcrypt = await bcrypt.compare(testPassword, bcryptHash);
  console.log(`bcrypt生成 -> bcrypt验证: ${bcryptToBcrypt ? '✅ 匹配' : '❌ 不匹配'}`);
  
  // bcryptjs生成 + bcryptjs验证
  const bcryptjsToBcryptjs = await bcryptjs.compare(testPassword, bcryptjsHash);
  console.log(`bcryptjs生成 -> bcryptjs验证: ${bcryptjsToBcryptjs ? '✅ 匹配' : '❌ 不匹配'}`);
  
  // bcrypt生成 + bcryptjs验证 (这应该失败)
  const bcryptToBcryptjs = await bcryptjs.compare(testPassword, bcryptHash);
  console.log(`bcrypt生成 -> bcryptjs验证: ${bcryptToBcryptjs ? '✅ 匹配' : '❌ 不匹配'}`);
  
  // bcryptjs生成 + bcrypt验证 (这应该失败)
  const bcryptjsToBcrypt = await bcrypt.compare(testPassword, bcryptjsHash);
  console.log(`bcryptjs生成 -> bcrypt验证: ${bcryptjsToBcrypt ? '✅ 匹配' : '❌ 不匹配'}`);
  
  console.log('\n=== 结论 ===');
  console.log('bcrypt和bcryptjs是不同步的！');
  console.log('必须确保加密和验证使用同一个包！');
}

testBcryptCompatibility().catch(console.error);