#!/usr/bin/env node

/**
 * 根据实际表结构创建admin用户
 */

const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 检查现有用户...\n');

    // 1. 查看现有用户
    const usersQuery = 'SELECT id, username, email, status, email_verified FROM users ORDER BY id';
    const usersResult = await client.query(usersQuery);
    
    console.log('📋 现有用户列表:');
    if (usersResult.rows.length === 0) {
      console.log('   数据库中没有任何用户');
    } else {
      usersResult.rows.forEach(user => {
        console.log(`   - ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}, 状态: ${user.status}, 邮箱验证: ${user.email_verified}`);
      });
    }

    // 2. 检查是否有admin角色
    console.log('\n🔍 检查角色...\n');
    const rolesQuery = 'SELECT id, role_name, role_display_name, description, is_system_role FROM roles ORDER BY id';
    const rolesResult = await client.query(rolesQuery);
    
    console.log('📋 角色列表:');
    if (rolesResult.rows.length === 0) {
      console.log('   数据库中没有角色，需要先创建角色');
    } else {
      rolesResult.rows.forEach(role => {
        console.log(`   - ID: ${role.id}, 角色名: ${role.role_name}, 显示名: ${role.role_display_name}, 描述: ${role.description || '无'}, 系统角色: ${role.is_system_role}`);
      });
    }

    // 3. 查找或创建admin角色
    let adminRoleId;
    const adminRoleResult = rolesResult.rows.find(role => role.role_name === 'admin');
    
    if (adminRoleResult) {
      adminRoleId = adminRoleResult.id;
      console.log(`✅ 找到admin角色，ID: ${adminRoleId}`);
    } else {
      console.log('❌ 没有找到admin角色，创建中...');
      const insertRoleQuery = `
        INSERT INTO roles (role_name, role_display_name, description, permissions, is_system_role, created_at, updated_at) 
        VALUES ('admin', '系统管理员', '系统管理员角色', '{"admin": true, "manage_users": true, "system_settings": true}', true, NOW(), NOW()) 
        RETURNING id, role_name, role_display_name
      `;
      const newRoleResult = await client.query(insertRoleQuery);
      adminRoleId = newRoleResult.rows[0].id;
      console.log(`✅ 创建admin角色成功，ID: ${adminRoleId}, 角色名: ${newRoleResult.rows[0].role_name}`);
    }

    // 4. 创建admin用户
    console.log('\n🔐 创建admin用户...\n');
    
    const adminPassword = 'Admin123.';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    
    const insertUserQuery = `
      INSERT INTO users (
        username, email, password_hash, nickname, real_name, 
        status, email_verified, password_changed_at,
        created_at, updated_at
      ) VALUES (
        'admin', 'admin@example.com', $1, 'Admin', '系统管理员',
        'active', true, NOW(),
        NOW(), NOW()
      ) RETURNING id, username, email, status, email_verified
    `;
    
    const userResult = await client.query(insertUserQuery, [passwordHash]);
    const adminUser = userResult.rows[0];
    
    console.log(`✅ 创建admin用户成功:`);
    console.log(`   - ID: ${adminUser.id}`);
    console.log(`   - 用户名: ${adminUser.username}`);
    console.log(`   - 邮箱: ${adminUser.email}`);
    console.log(`   - 状态: ${adminUser.status}`);
    console.log(`   - 邮箱验证: ${adminUser.email_verified}`);
    console.log(`   - 密码: ${adminPassword}`);

    // 5. 为admin用户分配admin角色
    console.log('\n🎭 分配角色...\n');
    const assignRoleQuery = `
      INSERT INTO user_roles (user_id, role_id, assigned_at, is_active) 
      VALUES ($1, $2, NOW(), true)
    `;
    await client.query(assignRoleQuery, [adminUser.id, adminRoleId]);
    console.log('✅ 角色分配成功');

    // 6. 验证创建结果
    console.log('\n🔍 验证创建结果...\n');
    const verifyQuery = `
      SELECT 
        u.id, u.username, u.email, u.status, u.email_verified,
        r.role_name, r.role_display_name, r.description, r.permissions
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.username = 'admin'
    `;
    const verifyResult = await client.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      const admin = verifyResult.rows[0];
      console.log('✅ admin用户验证成功:');
      console.log(`   - ID: ${admin.id}`);
      console.log(`   - 用户名: ${admin.username}`);
      console.log(`   - 邮箱: ${admin.email}`);
      console.log(`   - 状态: ${admin.status}`);
      console.log(`   - 邮箱验证: ${admin.email_verified}`);
      console.log(`   - 角色: ${admin.role_name} (${admin.role_display_name})`);
      console.log(`   - 描述: ${admin.description}`);
      console.log(`   - 权限: ${JSON.stringify(admin.permissions, null, 2)}`);
      
      // 验证密码
      const passwordCheck = await bcrypt.compare(adminPassword, passwordHash);
      console.log(`   - 密码验证: ${passwordCheck ? '✅ 正确' : '❌ 错误'}`);
      
    } else {
      console.log('❌ admin用户验证失败');
    }

    console.log('\n🎉 admin用户创建完成!');
    console.log(`📝 登录信息: 用户名=admin, 密码=${adminPassword}`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('堆栈:', error.stack);
  } finally {
    client.release();
  }
}

// 运行
createAdminUser();