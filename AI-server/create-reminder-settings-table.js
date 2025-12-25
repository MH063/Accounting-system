const { query } = require('./config/database');

async function createReminderSettingsTable() {
  try {
    console.log('开始创建提醒设置表...');
    
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS reminder_settings (
          id SERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          enabled BOOLEAN DEFAULT false,
          methods TEXT[] DEFAULT ARRAY['email', 'sms'],
          interval_minutes INTEGER DEFAULT 60,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await query(createTableSql);
    console.log('提醒设置表创建成功');
    
    // 添加索引
    const createIndexSql = `CREATE INDEX IF NOT EXISTS idx_reminder_settings_user_id ON reminder_settings(user_id);`;
    await query(createIndexSql);
    
    console.log('提醒设置表索引创建成功');
    return true;
  } catch (error) {
    console.error('创建提醒设置表失败:', error.message);
    return false;
  }
}

// 执行创建表操作
createReminderSettingsTable().then(success => {
  process.exit(success ? 0 : 1);
});
