const { query } = require('./config/database');

async function checkUsers() {
  try {
    console.log('检查寝室长用户...');
    
    // 查找寝室长用户
    const result = await query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1 OR email = $2', 
      ['寝室长', 'dormleader@example.com']
    );
    
    console.log('寝室长用户查询结果:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // 检查所有用户
    console.log('\n检查所有用户...');
    const allUsers = await query('SELECT id, username, email, password_hash FROM users LIMIT 5');
    console.log('所有用户列表:');
    console.log(JSON.stringify(allUsers.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkUsers();