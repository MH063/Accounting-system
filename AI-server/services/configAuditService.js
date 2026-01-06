const { query } = require('../config/database');

const CONFIG_AUDIT_LOG_TABLE = 'admin_config_audit_logs';
const CONFIG_HISTORY_TABLE = 'admin_config_history';

const ENVIRONMENT_VALUES = ['development', 'testing', 'production'];

function parseValue(value, dataType) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  
  switch (dataType) {
    case 'integer':
      const intNum = parseInt(value, 10);
      return isNaN(intNum) ? value : intNum;
    case 'number':
    case 'decimal':
      const num = Number(value);
      return isNaN(num) ? value : num;
    case 'boolean':
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === 'True' || value === true;
    case 'json':
    case 'object':
      if (typeof value === 'object') return value;
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        return value;
      }
    default:
      return String(value);
  }
}

async function initializeAuditTables() {
  const createAuditLogTableSQL = `
    CREATE TABLE IF NOT EXISTS ${CONFIG_AUDIT_LOG_TABLE} (
      id SERIAL PRIMARY KEY,
      config_key VARCHAR(100) NOT NULL,
      old_value TEXT,
      new_value TEXT,
      change_type VARCHAR(20) NOT NULL DEFAULT 'update',
      changed_by INTEGER,
      changed_by_username VARCHAR(100),
      ip_address VARCHAR(45),
      user_agent TEXT,
      reason TEXT,
      is_rollback BOOLEAN DEFAULT FALSE,
      rollback_from_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  const createConfigHistoryTableSQL = `
    CREATE TABLE IF NOT EXISTS ${CONFIG_HISTORY_TABLE} (
      id SERIAL PRIMARY KEY,
      config_key VARCHAR(100) NOT NULL,
      config_value TEXT NOT NULL,
      config_version INTEGER NOT NULL DEFAULT 1,
      changed_by INTEGER,
      changed_by_username VARCHAR(100),
      change_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  const createIndexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_config_audit_key ON ${CONFIG_AUDIT_LOG_TABLE}(config_key);
    CREATE INDEX IF NOT EXISTS idx_config_audit_user ON ${CONFIG_AUDIT_LOG_TABLE}(changed_by);
    CREATE INDEX IF NOT EXISTS idx_config_audit_time ON ${CONFIG_AUDIT_LOG_TABLE}(created_at);
    CREATE INDEX IF NOT EXISTS idx_config_history_key ON ${CONFIG_HISTORY_TABLE}(config_key);
    CREATE INDEX IF NOT EXISTS idx_config_history_time ON ${CONFIG_HISTORY_TABLE}(created_at);
  `;
  
  try {
    await query(createAuditLogTableSQL);
    await query(createConfigHistoryTableSQL);
    await query(createIndexesSQL);
    console.log('[ConfigAudit] 审计日志表初始化完成');
  } catch (error) {
    console.error('[ConfigAudit] 初始化审计日志表失败:', error.message);
    throw error;
  }
}

async function logConfigChange(options) {
  const {
    configKey,
    oldValue,
    newValue,
    changeType,
    userId,
    username,
    ipAddress,
    userAgent,
    reason,
    isRollback = false,
    rollbackFromId = null,
    configVersion = null, // 新增版本号支持
    client = null // 支持外部传入数据库客户端
  } = options;
  
  const db = client || { query: require('../config/database').query };
  
  try {
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [CONFIG_AUDIT_LOG_TABLE]);
    
    if (!tableCheck.rows[0].exists) {
      console.log(`[ConfigAudit] 表 ${CONFIG_AUDIT_LOG_TABLE} 不存在，跳过日志记录`);
      return null;
    }
  } catch (checkError) {
    console.log(`[ConfigAudit] 无法检查表是否存在，跳过日志记录`);
    return null;
  }
  
  const sql = `
    INSERT INTO ${CONFIG_AUDIT_LOG_TABLE}
    (config_key, old_value, new_value, change_type, changed_by, changed_by_username, 
     ip_address, user_agent, reason, is_rollback, rollback_from_id, config_version)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `;
  
  const params = [
    configKey,
    oldValue !== undefined ? JSON.stringify(oldValue) : null,
    newValue !== undefined ? JSON.stringify(newValue) : null,
    changeType,
    userId,
    username,
    ipAddress,
    userAgent,
    reason,
    isRollback,
    rollbackFromId,
    configVersion
  ];
  
  try {
    const result = await db.query(sql, params);
    return result.rows[0].id;
  } catch (error) {
    console.error('[ConfigAudit] 记录配置变更日志失败:', error.message);
    throw error;
  }
}

async function saveConfigHistory(options) {
  const {
    configKey,
    configValue,
    configVersion,
    userId,
    username,
    changeReason,
    client = null // 支持外部传入数据库客户端
  } = options;
  
  const db = client || { query: require('../config/database').query };
  
  try {
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [CONFIG_HISTORY_TABLE]);
    
    if (!tableCheck.rows[0].exists) {
      console.log(`[ConfigAudit] 表 ${CONFIG_HISTORY_TABLE} 不存在，跳过历史记录`);
      return null;
    }
  } catch (checkError) {
    console.log(`[ConfigAudit] 无法检查历史表是否存在，跳过历史记录`);
    return null;
  }
  
  const sql = `
    INSERT INTO ${CONFIG_HISTORY_TABLE}
    (config_key, config_value, config_version, changed_by, changed_by_username, change_reason)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;
  
  const params = [
    configKey,
    typeof configValue === 'string' ? configValue : JSON.stringify(configValue),
    configVersion,
    userId,
    username,
    changeReason
  ];
  
  try {
    const result = await db.query(sql, params);
    return result.rows[0].id;
  } catch (error) {
    console.error('[ConfigAudit] 保存配置历史失败:', error.message);
    throw error;
  }
}

async function getAuditLogs(options = {}) {
  const { configKey, userId, startDate, endDate, page = 1, pageSize = 50 } = options;
  
  let sql = `
    SELECT id, config_key, old_value, new_value, change_type, 
           changed_by, changed_by_username, ip_address, user_agent, 
           reason, is_rollback, rollback_from_id, created_at
    FROM ${CONFIG_AUDIT_LOG_TABLE}
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (configKey) {
    sql += ` AND config_key = $${paramIndex}`;
    params.push(configKey);
    paramIndex++;
  }
  
  if (userId) {
    sql += ` AND changed_by = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }
  
  if (startDate) {
    sql += ` AND created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }
  
  if (endDate) {
    sql += ` AND created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }
  
  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pageSize, (page - 1) * pageSize);
  
  const result = await query(sql, params);
  
  const countSql = `
    SELECT COUNT(*) as total
    FROM ${CONFIG_AUDIT_LOG_TABLE}
    WHERE 1=1
    ${configKey ? ` AND config_key = $1` : ''}
    ${userId ? ` AND changed_by = ${configKey ? '$2' : '$1'}` : ''}
    ${startDate ? ` AND created_at >= ${configKey ? (userId ? '$3' : '$2') : (userId ? '$2' : '$1')}` : ''}
    ${endDate ? ` AND created_at <= ${configKey ? (userId ? (startDate ? '$4' : '$3') : (startDate ? '$3' : '$2')) : (userId ? (startDate ? '$3' : '$2') : (startDate ? '$2' : '$1'))}` : ''}
  `;
  
  const countResult = await query(countSql, params.slice(0, paramIndex - 2));
  
  return {
    logs: result.rows.map(row => ({
      id: row.id,
      configKey: row.config_key,
      oldValue: parseValue(row.old_value, 'json'),
      newValue: parseValue(row.new_value, 'json'),
      changeType: row.change_type,
      changedBy: row.changed_by,
      changedByUsername: row.changed_by_username,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      reason: row.reason,
      isRollback: row.is_rollback,
      rollbackFromId: row.rollback_from_id,
      createdAt: row.created_at
    })),
    total: parseInt(countResult.rows[0].total),
    page,
    pageSize
  };
}

async function getConfigHistory(configKey, limit = 20) {
  const sql = `
    SELECT id, config_key, config_value, config_version, 
           changed_by, changed_by_username, change_reason, created_at
    FROM ${CONFIG_HISTORY_TABLE}
    WHERE config_key = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;
  
  const result = await query(sql, [configKey, limit]);
  
  return result.rows.map(row => ({
    id: row.id,
    configKey: row.config_key,
    configValue: parseValue(row.config_value, 'json'),
    configVersion: row.config_version,
    changedBy: row.changed_by,
    changedByUsername: row.changed_by_username,
    changeReason: row.change_reason,
    createdAt: row.created_at
  }));
}

async function rollbackConfig(configKey, targetVersion, userId, username, reason, ipAddress, userAgent) {
  const historySql = `
    SELECT id, config_value, config_version, changed_by, changed_by_username, change_reason, created_at
    FROM ${CONFIG_HISTORY_TABLE}
    WHERE config_key = $1 AND config_version = $2
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  const historyResult = await query(historySql, [configKey, targetVersion]);
  
  if (historyResult.rows.length === 0) {
    throw new Error(`找不到配置版本 ${targetVersion} 的历史记录`);
  }
  
  const targetHistory = historyResult.rows[0];
  
  const systemConfigService = require('../services/systemConfigService');
  const currentConfig = await systemConfigService.getConfig(configKey);
  
  if (!currentConfig) {
    throw new Error(`配置 ${configKey} 不存在`);
  }
  
  await systemConfigService.setConfig(configKey, targetHistory.config_value, {
    userId,
    description: `回滚到版本 ${targetVersion}`
  });
  
  const auditLogId = await logConfigChange({
    configKey,
    oldValue: currentConfig.value,
    newValue: targetHistory.config_value,
    changeType: 'rollback',
    userId,
    username,
    ipAddress,
    userAgent,
    reason: reason || `回滚到版本 ${targetVersion}`,
    isRollback: true
  });
  
  return {
    success: true,
    configKey,
    rolledBackToVersion: targetVersion,
    auditLogId
  };
}

async function getEnvironmentStatus() {
  const systemConfigService = require('../services/systemConfigService');
  
  const currentEnv = await systemConfigService.getConfig('system.environment');
  const version = await systemConfigService.getConfig('system.version');
  const deployTime = await systemConfigService.getConfig('system.deploy_time');
  
  return {
    currentEnvironment: currentEnv?.value || 'development',
    environmentDisplay: {
      development: '开发环境',
      testing: '测试环境',
      production: '生产环境'
    }[currentEnv?.value || 'development'] || '未知环境',
    version: version?.value || 'unknown',
    deployTime: deployTime?.value || null,
    availableEnvironments: ENVIRONMENT_VALUES,
    lastUpdate: new Date().toISOString()
  };
}

async function switchEnvironment(newEnvironment, userId, username, reason, ipAddress, userAgent) {
  if (!ENVIRONMENT_VALUES.includes(newEnvironment)) {
    throw new Error(`无效的环境值: ${newEnvironment}。可选值: ${ENVIRONMENT_VALUES.join(', ')}`);
  }
  
  const systemConfigService = require('../services/systemConfigService');
  const currentConfig = await systemConfigService.getConfig('system.environment');
  
  if (!currentConfig) {
    throw new Error('system.environment 配置不存在');
  }
  
  const oldEnvironment = currentConfig.value;
  
  if (oldEnvironment === newEnvironment) {
    return {
      success: true,
      message: '环境未变更，已经是 ' + newEnvironment + ' 环境',
      oldEnvironment,
      newEnvironment
    };
  }
  
  await systemConfigService.setConfig('system.environment', newEnvironment, {
    userId,
    description: reason || `环境切换: ${oldEnvironment} -> ${newEnvironment}`
  });
  
  await logConfigChange({
    configKey: 'system.environment',
    oldValue: oldEnvironment,
    newValue: newEnvironment,
    changeType: 'environment_switch',
    userId,
    username,
    ipAddress,
    userAgent,
    reason: reason || `环境切换: ${oldEnvironment} -> ${newEnvironment}`
  });
  
  console.log(`[ConfigAudit] 环境切换: ${oldEnvironment} -> ${newEnvironment}, 操作人: ${username}`);
  
  return {
    success: true,
    message: `环境切换成功: ${oldEnvironment} -> ${newEnvironment}`,
    oldEnvironment,
    newEnvironment,
    effectiveTime: new Date().toISOString()
  };
}

module.exports = {
  initializeAuditTables,
  logConfigChange,
  saveConfigHistory,
  getAuditLogs,
  getConfigHistory,
  rollbackConfig,
  getEnvironmentStatus,
  switchEnvironment,
  CONFIG_AUDIT_LOG_TABLE,
  CONFIG_HISTORY_TABLE
};
