#!/usr/bin/env node

/**
 * 检查并设置admin密码为Admin123.
 */

const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function checkAndSetAdminPassword() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 检查admin用户密码...\n');

    // 1. 查找admin用户
    const userQuery = 'SELECT id, username, password_hash FROM users WHERE username = $1';
    const userResult = await client.query(userQuery, ['admin']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ admin用户不存在');
      return;
    }

    const adminUser = userResult.rows[0];
    console.log('✅ 找到admin用户');
    console.log(`   - ID: ${adminUser.id}`);
    console.log(`   - 用户名: ${adminUser.username}`);
    console.log(`   - 当前密码哈希: ${adminUser.password_hash.substring(0, 20)}...`);

    // 2. 验证当前密码是否为Admin123.
    const testPassword = 'Admin123.';
    const isCurrentPassword = await bcrypt.compare(testPassword, adminUser.password_hash);
    
    console.log(`\n🔐 验证当前密码是否为"${testPassword}":`);
    if (isCurrentPassword) {
      console.log('✅ 当前密码已经是Admin123.');
      console.log('   这很奇怪，为什么登录会失败？让我们检查用户状态...');
      
      // 检查用户状态
      const statusQuery = 'SELECT status, email_verified, is_active FROM users WHERE id = $1';
      const statusResult = await client.query(statusQuery, [adminUser.id]);
      const status = statusResult.rows[0];
      
      console.log(`   - 状态: ${status.status}`);
      console.log(`   - 邮箱验证: ${status.email_verified}`);
      console.log(`   - 激活状态: ${status.is_active}`);
      
    } else {
      console.log('❌ 当前密码不是Admin123.，准备更新...');
      
      // 3. 生成新的密码哈希
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(testPassword, saltRounds);
      
      console.log(`\n🔑 生成新的密码哈希: ${newPasswordHash.substring(0, 20)}...`);
      
      // 4. 更新密码
      const updateQuery = 'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2';
      await client.query(updateQuery, [newPasswordHash, adminUser.id]);
      
      console.log('✅ 密码已更新为Admin123.');
      
      // 5. 验证新密码
      const verifyQuery = 'SELECT password_hash FROM users WHERE id = $1';
      const verifyResult = await client.query(verifyQuery, [adminUser.id]);
      const newHash = verifyResult.rows[0].password_hash;
      
      const isNewPasswordValid = await bcrypt.compare(testPassword, newHash);
      if (isNewPasswordValid) {
        console.log('✅ 新密码验证成功');
      } else {
        console.log('❌ 新密码验证失败');
      }
    }

    console.log('\n🎉 检查完成!');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('堆栈:', error.stack);
  } finally {
    client.release();
  }
}

// 运行
checkAndSetAdminPassword();