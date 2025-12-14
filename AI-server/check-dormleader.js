/**
 * 检查寝室长用户信息
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true'
});

async function checkUser() {
  try {
    const client = await pool.connect();
    
    // 查找寝室长用户
    const result = await client.query('SELECT * FROM users WHERE username = $1', ['寝室长']);
    
    console.log('=== 寝室长用户信息 ===');
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('用户ID:', user.id);
      console.log('用户名:', user.username);
      console.log('邮箱:', user.email);
      console.log('状态:', user.status);
      console.log('密码哈希存在:', !!user.password_hash);
      console.log('密码哈希长度:', user.password_hash ? user.password_hash.length : 'null');
      console.log('角色:', user.role);
      console.log('锁定状态:', user.locked_until);
      
      // 验证密码
      const bcrypt = require('bcrypt');
      const testPassword = 'Dormleader123.';
      if (user.password_hash) {
        const isValid = await bcrypt.compare(testPassword, user.password_hash);
        console.log('密码验证结果:', isValid);
        
        // 尝试其他可能的密码
        const possiblePasswords = [
          'Dormleader123.',
          'Dormleader123',
          'dormleader123.',
          'dormleader123'
        ];
        
        console.log('\n=== 密码测试结果 ===');
        for (const pwd of possiblePasswords) {
          const valid = await bcrypt.compare(pwd, user.password_hash);
          console.log(`密码 "${pwd}": ${valid ? '✅ 匹配' : '❌ 不匹配'}`);
        }
      }
    } else {
      console.log('用户不存在');
    }
    
    client.release();
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();