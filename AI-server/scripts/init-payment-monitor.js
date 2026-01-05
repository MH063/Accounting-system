/**
 * 数据库SQL执行脚本
 * 用于在线执行支付监控日志表的创建SQL
 */

const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

async function executeSQLFile() {
  try {
    logger.info('开始执行数据库SQL脚本...');

    const sqlFilePath = path.join(__dirname, '..', 'sql', 'create-payment-monitor-logs-table-simple.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    logger.info('读取SQL文件成功');

    const statements = sqlContent.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
          console.log('✅ 执行成功:', statement.substring(0, 50) + '...');
        } catch (err) {
          if (err.code !== '42P07' && err.code !== '42P01') {
            console.error('❌ 执行失败:', err.message);
          } else if (err.code === '42P07') {
            console.log('ℹ️ 表已存在:', statement.substring(0, 50) + '...');
          }
        }
      }
    }

    logger.info('数据库SQL脚本执行完成');

    const result = await query('SELECT COUNT(*) as count FROM payment_monitor_logs');
    console.log(`📊 payment_monitor_logs 表中现有 ${result.rows[0].count} 条记录`);

  } catch (error) {
    logger.error('执行SQL脚本失败:', error);
    process.exit(1);
  }
}

executeSQLFile().then(() => {
  console.log('🎉 数据库初始化完成！');
  process.exit(0);
}).catch(err => {
  console.error('💥 发生错误:', err);
  process.exit(1);
});
