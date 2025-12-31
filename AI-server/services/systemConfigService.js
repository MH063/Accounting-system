const { query } = require('../config/database');

const configCache = new Map();
const CACHE_TTL = 60000;

const DEFAULT_CONFIGS = [
  { key: 'system.name', value: 'AI记账管理系统', type: 'string', group: 'system', category: 'SYSTEM_GENERAL', displayName: '系统名称', desc: '系统的显示名称' },
  { key: 'system.version', value: '2.1.0', type: 'string', group: 'system', category: 'SYSTEM_GENERAL', displayName: '系统版本', desc: '当前系统版本号' },
  { key: 'system.environment', value: 'development', type: 'string', group: 'system', category: 'SYSTEM_GENERAL', displayName: '运行环境', desc: 'development/production' },
  { key: 'system.deploy_time', value: new Date().toISOString(), type: 'string', group: 'system', category: 'SYSTEM_GENERAL', displayName: '部署时间', desc: '系统部署时间' },
  { key: 'server.host', value: '0.0.0.0', type: 'string', group: 'server', category: 'SYSTEM_GENERAL', displayName: '服务器地址', desc: '服务器监听地址' },
  { key: 'server.port', value: 4000, type: 'integer', group: 'server', category: 'SYSTEM_GENERAL', displayName: '服务端口', desc: '服务器监听端口' },
  { key: 'server.max_connections', value: 20, type: 'integer', group: 'server', category: 'SYSTEM_GENERAL', displayName: '最大连接数', desc: '数据库最大连接数' },
  { key: 'database.host', value: 'localhost', type: 'string', group: 'database', category: 'DATABASE_CONFIG', displayName: '数据库地址', desc: '数据库服务器地址' },
  { key: 'cache.server', value: 'Redis localhost:6379', type: 'string', group: 'cache', category: 'CACHE_CONFIG', displayName: '缓存服务器', desc: '缓存服务器地址' },
  { key: 'session.timeout', value: 60, type: 'integer', group: 'session', category: 'SECURITY_CONFIG', displayName: '会话超时', desc: '会话超时时间(分钟)' },
  { key: 'session.refresh_interval', value: 30, type: 'integer', group: 'session', category: 'SECURITY_CONFIG', displayName: '令牌刷新间隔', desc: '令牌刷新间隔(天)' },
  { key: 'session.max_sessions', value: 5, type: 'integer', group: 'session', category: 'SECURITY_CONFIG', displayName: '最大会话数', desc: '单用户最大会话数' },
  { key: 'log.level', value: 'info', type: 'string', group: 'log', category: 'LOG_CONFIG', displayName: '日志级别', desc: 'debug/info/warn/error' },
  { key: 'backup.schedule', value: '每日凌晨2点', type: 'string', group: 'backup', category: 'BACKUP_CONFIG', displayName: '备份策略', desc: '系统数据备份计划' },
  { key: 'performance.cache_ttl', value: 3600, type: 'integer', group: 'performance', category: 'PERFORMANCE_CONFIG', displayName: '缓存过期时间', desc: '缓存过期时间(秒)' },
  { key: 'performance.rate_limit', value: 100, type: 'integer', group: 'performance', category: 'PERFORMANCE_CONFIG', displayName: 'API速率限制', desc: 'API速率限制(请求/分钟)' },
  { key: 'performance.compression', value: true, type: 'boolean', group: 'performance', category: 'PERFORMANCE_CONFIG', displayName: '启用压缩', desc: '是否启用响应压缩' },
  { key: 'security.ssl_certificate', value: '已启用', type: 'string', group: 'security', category: 'SECURITY_CONFIG', displayName: 'SSL证书', desc: 'SSL证书状态' },
  { key: 'security.encryption_algorithm', value: 'AES-256', type: 'string', group: 'security', category: 'SECURITY_CONFIG', displayName: '加密算法', desc: '数据加密算法' },
  { key: 'security.password_policy.min_length', value: 8, type: 'integer', group: 'security', category: 'SECURITY_CONFIG', displayName: '密码最小长度', desc: '用户密码的最短字符数' },
  { key: 'security.login.max_attempts', value: 5, type: 'integer', group: 'security', category: 'SECURITY_CONFIG', displayName: '登录失败次数', desc: '允许的最大登录尝试次数' },
  { key: 'security.login.lockout_duration', value: 30, type: 'integer', group: 'security', category: 'SECURITY_CONFIG', displayName: '锁定时间', desc: '账号锁定持续时间(分钟)' },
  { key: 'feature.registration_enabled', value: true, type: 'boolean', group: 'feature', category: 'FEATURE_FLAGS', displayName: '用户注册', desc: '是否允许新用户注册' },
  { key: 'feature.password_reset_enabled', value: true, type: 'boolean', group: 'feature', category: 'FEATURE_FLAGS', displayName: '密码重置', desc: '是否允许重置密码' },
  { key: 'feature.audit_log_enabled', value: true, type: 'boolean', group: 'feature', category: 'FEATURE_FLAGS', displayName: '审计日志', desc: '是否启用审计日志' },
  { key: 'feature.maintenance_mode', value: false, type: 'boolean', group: 'feature', category: 'FEATURE_FLAGS', displayName: '维护模式', desc: '是否开启维护模式' }
];

function getCacheKey(key) {
  return `config:${key}`;
}

function setCache(key, data) {
  configCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getCache(key) {
  const cached = configCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function invalidateCache(key) {
  configCache.delete(key);
  configCache.clear();
}

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
    case 'datetime':
      return value;
    default:
      return String(value);
  }
}

function formatValue(value, dataType) {
  if (value === null || value === undefined) return null;
  
  // 数据库中的 config_value 是 JSONB 类型，所有存储的值必须是合法的 JSON 格式
  // 即使是简单的字符串，也需要 JSON.stringify 包装（例如 "value" -> "\"value\""）
  try {
    // 如果是对象或数组，直接序列化
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // 对于基本类型，根据 dataType 处理
    switch (dataType) {
      case 'boolean':
        // 确保布尔值被正确序列化为 "true" 或 "false"
        const boolVal = value === 'true' || value === 'True' || value === true;
        return JSON.stringify(boolVal);
      case 'integer':
      case 'number':
      case 'decimal':
        // 确保数字被正确序列化
        const numVal = Number(value);
        return JSON.stringify(isNaN(numVal) ? 0 : numVal);
      case 'json':
      case 'object':
      case 'array':
        // 如果已经是字符串形式的 JSON，直接返回，否则序列化
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            return value;
          } catch (e) {
            return JSON.stringify(value);
          }
        }
        return JSON.stringify(value);
      default:
        // 默认作为字符串处理，必须经过 JSON.stringify 以满足 JSONB 要求
        return JSON.stringify(String(value));
    }
  } catch (error) {
    console.error(`Error formatting value for ${dataType}:`, error);
    return JSON.stringify(String(value));
  }
}

function inferGroup(key) {
  const prefix = key.split('.')[0];
  const groupMap = {
    'system': 'system',
    'server': 'server',
    'session': 'session',
    'security': 'security',
    'log': 'log',
    'performance': 'performance',
    'backup': 'backup',
    'notification': 'notification',
    'client': 'client',
    'feature': 'feature'
  };
  return groupMap[prefix] || 'system';
}

async function getAllConfigs(options = {}) {
  const { environment = 'all', activeOnly = true, group = null } = options;
  
  // 如果数据库中没有配置，自动初始化默认配置
  const countResult = await query('SELECT COUNT(*) FROM admin_system_configs');
  if (parseInt(countResult.rows[0].count) === 0) {
    console.log('Detected empty configuration, initializing defaults...');
    await initializeDefaultConfigs();
  }

  let sql = `
    SELECT id, config_key, config_value, data_type, display_name, description, 
           config_group, requires_restart, is_readonly, is_active, 
           requires_permission, editable_by_roles, environment, version
    FROM admin_system_configs 
    WHERE is_system_config = true
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (activeOnly) {
    sql += ` AND is_active = true`;
  }
  
  if (environment !== 'all') {
    sql += ` AND (environment = $${paramIndex} OR environment = 'all')`;
    params.push(environment);
    paramIndex++;
  }
  
  if (group) {
    sql += ` AND config_group = $${paramIndex}`;
    params.push(group);
    paramIndex++;
  }
  
  sql += ` ORDER BY sort_order, config_key`;
  
  const result = await query(sql, params);
  
  const configs = {};
  result.rows.forEach(row => {
    let value = parseValue(row.config_value, row.data_type);
    
    // 总是返回当前实际运行的环境变量
    if (row.config_key === 'system.environment') {
      value = process.env.NODE_ENV || 'development';
    }

    configs[row.config_key] = {
      value,
      displayName: row.display_name,
      description: row.description,
      group: row.config_group || inferGroup(row.config_key),
      requiresRestart: row.requires_restart,
      readonly: row.is_readonly,
      active: row.is_active,
      permission: row.requires_permission,
      editableRoles: row.editable_by_roles,
      environment: row.environment,
      version: row.version
    };
  });
  
  return configs;
}

async function getConfigsByGroup(group) {
  return getAllConfigs({ group, activeOnly: true });
}

async function getConfig(key) {
  const cacheKey = getCacheKey(key);
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  const result = await query(
    `SELECT id, config_key, config_value, data_type, display_name, description,
            config_group, requires_restart, is_readonly, is_active,
            requires_permission, editable_by_roles, environment, version
     FROM admin_system_configs 
     WHERE config_key = $1`,
    [key]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  
  let value = parseValue(row.config_value, row.data_type);
  // 总是返回当前实际运行的环境变量
  if (row.config_key === 'system.environment') {
    value = process.env.NODE_ENV || 'development';
  }

  const config = {
    key: row.config_key,
    value,
    displayName: row.display_name,
    description: row.description,
    group: row.config_group || inferGroup(row.config_key),
    requiresRestart: row.requires_restart,
    readonly: row.is_readonly,
    active: row.is_active,
    permission: row.requires_permission,
    editableRoles: row.editable_by_roles,
    environment: row.environment,
    version: row.version,
    dataType: row.data_type
  };
  
  setCache(cacheKey, config);
  return config;
}

async function setConfig(key, value, options = {}) {
  const { description, displayName, userId = null, requiresRestart = false, username = null, ipAddress = null, userAgent = null, reason = null } = options;
  
  let current = await getConfig(key);
  
  // 如果配置不存在，尝试从默认配置中恢复
  if (!current) {
    console.log(`Config ${key} not found, checking defaults...`);
    const defaultConfig = DEFAULT_CONFIGS.find(c => c.key === key);
    if (defaultConfig) {
      console.log(`Creating missing config ${key} from defaults...`);
      await query(
        `INSERT INTO admin_system_configs 
         (config_key, config_value, data_type, config_group, config_category, display_name, description, is_system_config, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, true)`,
        [
          defaultConfig.key, 
          JSON.stringify(value !== undefined ? value : defaultConfig.value), 
          defaultConfig.type, 
          defaultConfig.group, 
          defaultConfig.category || 'SYSTEM_GENERAL',
          displayName || defaultConfig.displayName, 
          description || defaultConfig.desc
        ]
      );
      current = await getConfig(key);
    }
  }

  if (!current) {
    throw new Error(`Configuration key not found: ${key}`);
  }
  
  const oldValue = current.value;
  const formattedValue = formatValue(value, current.dataType);
  const newVersion = (current.version || 0) + 1;
  
  await query(
    `UPDATE admin_system_configs 
     SET config_value = $1, 
         updated_at = CURRENT_TIMESTAMP,
         updated_by = $2,
         version = $3
     WHERE config_key = $4`,
    [formattedValue, userId, newVersion, key]
  );
  
  invalidateCache(key);
  
  try {
    const configAuditService = require('./configAuditService');
    await configAuditService.logConfigChange({
      configKey: key,
      oldValue,
      newValue: value,
      changeType: 'update',
      userId,
      username,
      ipAddress,
      userAgent,
      reason: reason || description || '配置更新'
    });
    
    await configAuditService.saveConfigHistory({
      configKey: key,
      configValue: value,
      configVersion: newVersion,
      userId,
      username,
      changeReason: reason || description || '配置更新'
    });
  } catch (auditError) {
    console.error('[ConfigAudit] Failed to log config change:', auditError.message);
  }
  
  return { key, value, version: newVersion, requiresRestart };
}

async function setConfigs(configMap, userId = null) {
  const results = [];
  const restartRequired = [];
  
  for (const [key, value] of Object.entries(configMap)) {
    try {
      const result = await setConfig(key, value, { userId });
      results.push({ key, success: true, version: result.version });
      
      if (result.requiresRestart) {
        restartRequired.push(key);
      }
    } catch (error) {
      results.push({ key, success: false, error: error.message });
    }
  }
  
  return { results, restartRequired };
}

async function deleteConfig(key) {
  const result = await query(
    `UPDATE admin_system_configs SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE config_key = $1`,
    [key]
  );
  
  invalidateCache(key);
  return result.rowCount > 0;
}

async function resetConfig(key, userId = null) {
  const result = await query(
    `SELECT default_value FROM admin_system_configs WHERE config_key = $1`,
    [key]
  );
  
  if (result.rows.length === 0 || !result.rows[0].default_value) {
    throw new Error(`No default value for config: ${key}`);
  }
  
  const defaultVal = result.rows[0].default_value;
  const current = await getConfig(key);
  
  await query(
    `UPDATE admin_system_configs 
     SET config_value = $1, 
         updated_at = CURRENT_TIMESTAMP,
         updated_by = $2,
         version = version + 1
     WHERE config_key = $3`,
    [JSON.stringify(defaultVal), userId, key]
  );
  
  invalidateCache(key);
  
  return { key, defaultValue: defaultVal };
}

async function getConfigGroups() {
  const result = await query(
    `SELECT DISTINCT config_group as "group" 
     FROM admin_system_configs 
     WHERE is_system_config = true AND is_active = true
     ORDER BY config_group`
  );
  
  const groups = result.rows.map(r => r.group).filter(g => g);
  return groups.length > 0 ? groups : ['system', 'server', 'session', 'security', 'log', 'performance', 'backup', 'notification', 'client', 'feature'];
}

async function getMetaInfo() {
  const result = await query(
    `SELECT config_key, display_name, description, requires_restart, is_readonly, config_group
     FROM admin_system_configs 
     WHERE is_system_config = true AND is_active = true
     ORDER BY config_group, sort_order`
  );
  
  return result.rows;
}

async function initializeDefaultConfigs() {
  for (const config of DEFAULT_CONFIGS) {
    try {
      const existing = await getConfig(config.key);
      if (!existing) {
        await query(
          `INSERT INTO admin_system_configs 
           (config_key, config_value, data_type, config_group, config_category, display_name, description, is_system_config, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, true)`,
          [config.key, JSON.stringify(config.value), config.type, config.group, config.category || 'SYSTEM_GENERAL', config.displayName, config.desc]
        );
        console.log(`Created default config: ${config.key}`);
      }
    } catch (error) {
      console.error(`Failed to create config ${config.key}:`, error.message);
    }
  }
}

module.exports = {
  getAllConfigs,
  getConfigsByGroup,
  getConfig,
  setConfig,
  setConfigs,
  deleteConfig,
  resetConfig,
  getConfigGroups,
  getMetaInfo,
  initializeDefaultConfigs
};
