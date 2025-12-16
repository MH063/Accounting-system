#!/usr/bin/env node

/**
 * 修复UserModel中password_hash到passwordHash的字段映射问题
 */

const UserModel = require('./models/UserModel');
const bcrypt = require('bcryptjs');

async function testFieldMapping() {
  console.log('🔍 测试UserModel字段映射...\n');

  // 模拟从数据库返回的记录
  const dbRecord = {
    id: 3,
    username: '管理员',
    email: 'admin@example.com',
    password_hash: '$2b$10$QHaqZEp0g6AxN9k/GD7O2ewPcmPW4Y9ZVu0BjXyeFgkcr2vQQ6o3e',
    nickname: '管理员',
    phone: null,
    status: 'active',
    email_verified: true,
    phone_verified: false,
    last_login_at: '2025-12-16T08:30:46.024Z',
    failed_login_attempts: 0,
    locked_until: null,
    created_at: '2025-12-11T13:55:54.616Z',
    updated_at: '2025-12-16T06:14:56.025Z',
    role_name: 'admin',
    role_display_name: '管理员',
    permissions: {
      "data_monitoring": true,
      "user_management": true,
      "content_management": true,
      "dispute_resolution": true,
      "business_operations": true
    }
  };

  console.log('📦 数据库记录:');
  console.log(`   - password_hash: ${dbRecord.password_hash.substring(0, 20)}...`);

  // 使用UserModel.fromDatabase创建模型
  const userModel = UserModel.fromDatabase(dbRecord);

  console.log('\n🏗️ UserModel实例:');
  console.log(`   - passwordHash: ${userModel.passwordHash ? userModel.passwordHash.substring(0, 20) + '...' : 'undefined/null'}`);
  console.log(`   - password_hash: ${userModel.password_hash ? userModel.password_hash.substring(0, 20) + '...' : 'undefined/null'}`);

  // 测试密码验证
  console.log('\n🔐 密码验证测试:');
  const testPassword = 'Admin123.';
  
  if (userModel.passwordHash) {
    const isValidWithPasswordHash = await bcrypt.compare(testPassword, userModel.passwordHash);
    console.log(`   - 使用passwordHash验证: ${isValidWithPasswordHash ? '✅ 成功' : '❌ 失败'}`);
  } else {
    console.log('   - 使用passwordHash验证: ❌ passwordHash为空');
  }

  if (userModel.password_hash) {
    const isValidWithPasswordHashField = await bcrypt.compare(testPassword, userModel.password_hash);
    console.log(`   - 使用password_hash验证: ${isValidWithPasswordHashField ? '✅ 成功' : '❌ 失败'}`);
  } else {
    console.log('   - 使用password_hash验证: ❌ password_hash为空');
  }

  console.log('\n📋 字段检查:');
  const fields = Object.getOwnPropertyNames(userModel);
  fields.forEach(field => {
    if (field.includes('password')) {
      console.log(`   - ${field}: ${userModel[field] ? '存在' : '不存在'}`);
    }
  });
}

testFieldMapping().catch(console.error);