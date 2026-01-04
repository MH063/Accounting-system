const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * 执行SQL文件中的所有SQL语句
 * @param {string} sqlFilePath - SQL文件路径
 */
async function executeSqlFile(sqlFilePath) {
    try {
        // 读取SQL文件内容
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // 按分号分割SQL语句，但要注意处理字符串中的分号
        const sqlStatements = sqlContent.split(/;(?=\s*$|\s*\n|\s*\r|\s*\r\n)/m).filter(statement => 
            statement.trim().length > 0 && !statement.trim().startsWith('--')
        );
        
        if (process.env.NODE_ENV !== 'production') {
            console.log(`📄 读取到 ${sqlStatements.length} 条SQL语句`);
        }
        
        // 执行每条SQL语句
        for (let i = 0; i < sqlStatements.length; i++) {
            const sql = sqlStatements[i].trim();
            if (sql) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`🔄 执行第 ${i + 1} 条SQL: ${sql.substring(0, 50)}${sql.length > 50 ? '...' : ''}`);
                }
                await query(sql);
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`✅ 第 ${i + 1} 条SQL执行成功`);
                }
            }
        }
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('🎉 所有SQL语句执行完成');
        }
        return true;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('❌ 执行SQL文件失败:', error.message);
        }
        return false;
    }
}

/**
 * 主函数
 */
async function main() {
    if (process.env.NODE_ENV !== 'production') {
        console.log('🚀 开始执行SQL脚本');
        console.log('=' . repeat(60));
    }
    
    const sqlFilePath = path.join(__dirname, 'create-contacts-table.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('❌ SQL文件不存在:', sqlFilePath);
        }
        process.exit(1);
    }
    
    const result = await executeSqlFile(sqlFilePath);
    
    if (process.env.NODE_ENV !== 'production') {
        console.log('=' . repeat(60));
        console.log(result ? '✅ SQL脚本执行成功' : '❌ SQL脚本执行失败');
    }
    
    process.exit(result ? 0 : 1);
}

main().catch(error => {
    if (process.env.NODE_ENV !== 'production') {
        console.error('❌ 主函数执行失败:', error);
    }
    process.exit(1);
});