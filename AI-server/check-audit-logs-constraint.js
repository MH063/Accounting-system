const { Pool } = require('pg');
require('dotenv').config();

// 数据库配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'JZB'
});

async function checkAuditLogsConstraint() {
  console.log('🔍 检查 audit_logs 表的约束条件...\n');
  
  try {
    // 检查 audit_logs 表结构
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs' AND column_name = 'operation'
    `);
    
    console.log('📋 audit_logs.operation 字段信息:');
    console.log(tableStructure.rows);
    console.log('');
    
    // 检查 audit_logs 表的检查约束
    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(pg_constraint.oid) as constraint_def 
      FROM pg_constraint 
      INNER JOIN pg_class ON pg_constraint.conrelid = pg_class.oid 
      WHERE pg_class.relname = 'audit_logs' AND pg_constraint.contype = 'c'
    `);
    
    console.log('🔒 audit_logs 表的检查约束:');
    constraints.rows.forEach(row => {
      if (row.constraint_def.includes('operation')) {
        console.log(`   约束名称: ${row.conname}`);
        console.log(`   约束定义: ${row.constraint_def}`);
      }
    });
    
    // 检查 audit_logs 表的所有约束
    console.log('\n📋 audit_logs 表的所有约束:');
    constraints.rows.forEach(row => {
      console.log(`   约束名称: ${row.conname}`);
      console.log(`   约束定义: ${row.constraint_def}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkAuditLogsConstraint();