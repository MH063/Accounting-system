require('dotenv').config({ path: './AI-server/.env' });
const { pool } = require('./AI-server/config/database');

(async () => {
  try {
    console.log('正在查询数据库用户列表...');
    console.log('数据库配置:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    
    const result = await pool.query('SELECT id, username, email, status, password_hash IS NOT NULL as has_password FROM users');
    console.log('数据库用户列表:');
    console.table(result.rows);
    console.log(`总共有 ${result.rows.length} 个用户`);
  } catch (error) {
    console.error('查询失败:', error.message);
    console.error('错误详情:', error.stack);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();