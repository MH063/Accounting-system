#!/usr/bin/env node

/**
 * 验证两步验证数据库迁移结果的脚本
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 数据库连接配置
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'JZB',
  ssl: false
};

// 创建数据库连接池
const pool = new Pool(poolConfig);

async function verifyMigration() {
  console.log('开始验证两步验证数据库迁移结果...');
  
  let client;
  try {
    // 获取数据库连接
    client = await pool.connect();
    console.log('数据库连接成功');
    
    // 1. 验证 users 表是否添加了新字段
    console.log('\n1. 验证 users 表的两步验证字段...');
    const usersColumnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name LIKE '%two_factor%'
      ORDER BY column_name
    `;
    const usersColumnsResult = await client.query(usersColumnsQuery);
    
    if (usersColumnsResult.rows.length > 0) {
      console.log('✓ users 表两步验证字段验证通过:');
      usersColumnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('✗ users 表未找到两步验证相关字段');
    }
    
    // 2. 验证 two_factor_codes 表是否存在
    console.log('\n2. 验证 two_factor_codes 表是否存在...');
    const codesTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'two_factor_codes'
    `;
    const codesTableResult = await client.query(codesTableQuery);
    
    if (codesTableResult.rows.length > 0) {
      console.log('✓ two_factor_codes 表已成功创建');
    } else {
      console.log('✗ two_factor_codes 表未找到');
    }
    
    // 3. 验证 two_factor_auth 表是否存在
    console.log('\n3. 验证 two_factor_auth 表是否存在...');
    const authTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'two_factor_auth'
    `;
    const authTableResult = await client.query(authTableQuery);
    
    if (authTableResult.rows.length > 0) {
      console.log('✓ two_factor_auth 表已成功创建');
    } else {
      console.log('✗ two_factor_auth 表未找到');
    }
    
    // 4. 显示新表的结构
    if (codesTableResult.rows.length > 0) {
      console.log('\n4. two_factor_codes 表结构:');
      const codesStructureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'two_factor_codes'
        ORDER BY ordinal_position
      `;
      const codesStructureResult = await client.query(codesStructureQuery);
      codesStructureResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }
    
    if (authTableResult.rows.length > 0) {
      console.log('\n5. two_factor_auth 表结构:');
      const authStructureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'two_factor_auth'
        ORDER BY ordinal_position
      `;
      const authStructureResult = await client.query(authStructureQuery);
      authStructureResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }
    
    console.log('\n数据库迁移验证完成！');
    
  } catch (error) {
    console.error('验证过程中出现错误:', error.message);
    process.exit(1);
  } finally {
    // 释放数据库连接
    if (client) {
      client.release();
    }
    
    // 关闭连接池
    await pool.end();
  }
}

// 执行验证
verifyMigration();