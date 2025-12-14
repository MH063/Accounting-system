/**
 * 检查所有用户的密码哈希状态
 */

require('dotenv').config();
const { pool } = require('./config/database');

async function checkUserPasswords() {
  try {
    const client = await pool.connect();
    
    // 查询所有用户及其密码哈希状态
    const result = await client.query(`
      SELECT id, username, email, password_hash, 
             CASE 
               WHEN password_hash IS NULL THEN 'NULL'
               WHEN password_hash = '' THEN 'EMPTY'
               ELSE 'HAS_VALUE'
             END as password_status,
             LENGTH(password_hash) as hash_length
      FROM users 
      ORDER BY id
    `);
    
    console.log('=== 用户密码哈希状态检查 ===\n');
    
    if (result.rows.length === 0) {
      console.log('❌ 数据库中没有找到用户记录');
    } else {
      console.log(`✅ 找到 ${result.rows.length} 个用户记录\n`);
      
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. 用户ID: ${user.id}`);
        console.log(`   用户名: ${user.username}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   密码状态: ${user.password_status}`);
        console.log(`   哈希长度: ${user.hash_length}`);
        console.log();
      });
    }
    
    client.release();
  } catch (error) {
    console.error('❌ 检查用户密码哈希时出错:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserPasswords().catch(console.error);