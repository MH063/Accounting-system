#!/usr/bin/env node

/**
 * 数据库迁移执行脚本
 * 用于安全地执行两步验证相关的数据库结构变更
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 数据库连接配置
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  ssl: false
};

// 创建数据库连接池
const pool = new Pool(poolConfig);

// 读取迁移文件
const migrationFilePath = path.resolve(__dirname, '../migrations/add-two-factor-auth-tables.sql');
const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');

async function runMigration() {
  console.log('开始执行两步验证数据库迁移...');
  
  let client;
  try {
    // 获取数据库连接
    client = await pool.connect();
    console.log('数据库连接成功');
    
    // 开始事务
    await client.query('BEGIN');
    console.log('开始事务');
    
    // 执行迁移SQL
    console.log('正在执行迁移脚本...');
    const result = await client.query(migrationSql);
    console.log('迁移脚本执行完成');
    
    // 提交事务
    await client.query('COMMIT');
    console.log('事务提交成功');
    
    console.log('两步验证数据库迁移执行成功！');
    console.log('受影响的表:');
    console.log('- users 表添加了两步验证相关字段');
    console.log('- two_factor_codes 表已创建');
    console.log('- two_factor_auth 表已创建');
    
  } catch (error) {
    // 回滚事务
    if (client) {
      await client.query('ROLLBACK');
      console.log('事务已回滚');
    }
    
    console.error('数据库迁移执行失败:', error.message);
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

// 确认执行迁移
function confirmMigration() {
  console.log('=== 两步验证数据库迁移工具 ===');
  console.log('此脚本将对数据库进行以下变更:');
  console.log('1. 在 users 表中添加两步验证相关字段');
  console.log('2. 创建 two_factor_codes 表（存储验证码）');
  console.log('3. 创建 two_factor_auth 表（存储验证配置）');
  console.log('');
  console.log('请确认是否继续执行 (y/N): ');
  
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      const answer = chunk.trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        runMigration();
      } else {
        console.log('操作已取消');
        process.exit(0);
      }
    }
  });
}

// 如果直接运行此脚本，则执行确认流程
if (require.main === module) {
  confirmMigration();
}

module.exports = { runMigration };