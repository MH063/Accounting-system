const { query } = require('./config/database');

async function createPaymentLogsTable() {
  try {
    console.log('开始创建支付日志表...');
    
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS payment_logs (
          id SERIAL PRIMARY KEY,
          expense_id BIGINT REFERENCES expenses(id),
          payment_method VARCHAR(50),
          amount NUMERIC(15, 2),
          transaction_id VARCHAR(100),
          status VARCHAR(20) DEFAULT 'success',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await query(createTableSql);
    console.log('支付日志表创建成功');
    
    // 添加索引
    const createIndexesSql = [
      `CREATE INDEX IF NOT EXISTS idx_payment_logs_expense_id ON payment_logs(expense_id);`,
      `CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON payment_logs(transaction_id);`,
      `CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);`
    ];
    
    for (const sql of createIndexesSql) {
      await query(sql);
    }
    
    console.log('支付日志表索引创建成功');
    return true;
  } catch (error) {
    console.error('创建支付日志表失败:', error.message);
    return false;
  }
}

// 执行创建表操作
createPaymentLogsTable().then(success => {
  process.exit(success ? 0 : 1);
});
