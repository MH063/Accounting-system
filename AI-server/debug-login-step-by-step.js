#!/usr/bin/env node

/**
 * 详细调试登录过程
 */

const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function debugLoginProcess() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 详细调试登录过程...\n');

    const loginIdentifier = '管理员';
    const loginPassword = 'Admin123.';

    console.log('📝 登录信息:');
    console.log(`   - 登录标识符: "${loginIdentifier}"`);
    console.log(`   - 密码: "${loginPassword}"\n`);

    // 1. 模拟UserRepository的findUserWithRoles方法
    console.log('1️⃣ 查找用户（包含角色信息）...');
    
    const findUserQuery = `
      SELECT 
        u.id, u.username, u.email, u.password_hash, u.nickname, u.real_name,
        u.phone, u.gender, u.status, u.email_verified, u.phone_verified,
        u.last_login_at, u.last_login_ip, u.password_changed_at,
        u.failed_login_attempts, u.locked_until, u.created_at, u.updated_at,
        u.two_factor_enabled,
        r.role_name, r.role_display_name, r.description as role_description, r.permissions
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE (u.username = $1 OR u.email = $1)
      LIMIT 1
    `;
    
    const userResult = await client.query(findUserQuery, [loginIdentifier]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ 用户不存在');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ 找到用户:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - 用户名: ${user.username}`);
    console.log(`   - 邮箱: ${user.email}`);
    console.log(`   - 状态: ${user.status}`);
    console.log(`   - 邮箱验证: ${user.email_verified}`);
    console.log(`   - 锁定时间: ${user.locked_until || '无'}`);
    console.log(`   - 登录失败次数: ${user.failed_login_attempts}`);
    console.log(`   - 角色: ${user.role_name} (${user.role_display_name})`);
    console.log(`   - 密码哈希: ${user.password_hash.substring(0, 20)}...`);

    // 2. 检查用户状态
    console.log('\n2️⃣ 检查用户状态...');
    
    if (user.status !== 'active') {
      console.log(`❌ 用户状态不是active，当前状态: ${user.status}`);
      return;
    } else {
      console.log('✅ 用户状态正常');
    }

    // 3. 检查锁定状态
    console.log('\n3️⃣ 检查锁定状态...');
    
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      console.log(`❌ 账户已被锁定，锁定到: ${user.lockedUntil}`);
      return;
    } else {
      console.log('✅ 账户未被锁定');
    }

    // 4. 验证密码
    console.log('\n4️⃣ 验证密码...');
    console.log(`   - 输入密码: "${loginPassword}"`);
    console.log(`   - 数据库哈希: ${user.password_hash}`);
    
    const isPasswordValid = await bcrypt.compare(loginPassword, user.password_hash);
    console.log(`   - 密码验证结果: ${isPasswordValid ? '✅ 正确' : '❌ 错误'}`);
    
    if (!isPasswordValid) {
      console.log('❌ 密码验证失败');
      return;
    }

    // 5. 检查权限信息
    console.log('\n5️⃣ 检查权限信息...');
    console.log(`   - 角色: ${user.role_name}`);
    console.log(`   - 角色显示名: ${user.role_display_name}`);
    console.log(`   - 角色描述: ${user.role_description}`);
    console.log(`   - 权限: ${JSON.stringify(user.permissions, null, 2)}`);

    // 6. 模拟完整的登录响应数据
    console.log('\n6️⃣ 模拟登录响应数据...');
    
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      real_name: user.real_name,
      phone: user.phone,
      gender: user.gender,
      status: user.status,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      role: user.role_name,
      permissions: user.permissions || [],
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at
    };

    console.log('✅ 用户响应数据:');
    console.log(JSON.stringify(userResponse, null, 2));

    console.log('\n🎉 登录调试完成 - 所有检查都通过了！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('堆栈:', error.stack);
  } finally {
    client.release();
  }
}

// 运行
debugLoginProcess();