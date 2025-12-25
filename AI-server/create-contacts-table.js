const { query } = require('./config/database');

/**
 * 直接执行创建contacts表的SQL语句
 */
async function createContactsTable() {
    try {
        console.log('🚀 开始创建contacts表');
        
        // 直接执行创建表的SQL语句
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(20),
                company VARCHAR(255),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER NOT NULL,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );
        `;
        
        await query(createTableSql);
        console.log('✅ contacts表创建成功');
        
        // 创建索引
        console.log('🔄 开始创建索引');
        
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);',
            'CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);',
            'CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);',
            'CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);'
        ];
        
        for (const indexSql of indexes) {
            await query(indexSql);
        }
        
        console.log('✅ 索引创建成功');
        return true;
    } catch (error) {
        console.error('❌ 创建contacts表失败:', error.message);
        return false;
    }
}

// 执行创建表函数
createContactsTable()
    .then(result => process.exit(result ? 0 : 1))
    .catch(error => {
        console.error('❌ 执行失败:', error);
        process.exit(1);
    });