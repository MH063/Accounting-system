/**
 * 直接查询并验证寝室长的密码哈希
 */

require('dotenv').config();
const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

async function verifyDormLeaderPassword() {
  try {
    const client = await pool.connect();
    
    console.log('=== 寝室长密码哈希验证 ===\n');
    
    // 直接查询寝室长用户
    const result = await client.query('SELECT * FROM users WHERE username = $1', ['寝室长']);
    
    if (result.rows.length === 0) {
      console.log('❌ 未找到寝室长用户');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ 找到寝室长用户');
    console.log('用户信息:');
    console.log(`  ID: ${user.id}`);
    console.log(`  用户名: ${user.username}`);
    console.log(`  邮箱: ${user.email}`);
    console.log(`  密码哈希: ${user.password_hash}`);
    console.log(`  哈希长度: ${user.password_hash.length}`);
    console.log();
    
    // 测试密码验证
    const testPassword = 'Dormleader123.';
    console.log(`验证密码 "${testPassword}":`);
    
    try {
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log(`  验证结果: ${isValid ? '✅ 密码正确' : '❌ 密码错误'}`);
      
      // 如果密码错误，尝试其他可能的密码
      if (!isValid) {
        console.log('\n尝试其他可能的密码:');
        const possiblePasswords = [
          'Dormleader123.',
          'Dormleader123',
          'dormleader123.',
          'dormleader123',
          '123456',
          'password',
          'Password123.',
          'dorm_leader123'
        ];
        
        for (const pwd of possiblePasswords) {
          try {
            const valid = await bcrypt.compare(pwd, user.password_hash);
            console.log(`  "${pwd}": ${valid ? '✅ 匹配' : '❌ 不匹配'}`);
          } catch (err) {
            console.log(`  "${pwd}": 验证出错 - ${err.message}`);
          }
        }
      }
      
    } catch (err) {
      console.log(`  验证出错: ${err.message}`);
    }
    
    client.release();
  } catch (error) {
    console.error('❌ 查询过程中出错:', error.message);
  } finally {
    await pool.end();
  }
}

verifyDormLeaderPassword().catch(console.error);