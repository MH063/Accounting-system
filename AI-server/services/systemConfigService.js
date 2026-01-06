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
  { key: 'session.timeout', value: 30, type: 'integer', group: 'session', category: 'SECURITY_CONFIG', displayName: '会话超时', desc: '会话超时时间(分钟)' },
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
  { key: 'security.password_policy.require_special', value: true, type: 'boolean', group: 'security', category: 'SECURITY_CONFIG', displayName: '要求特殊字符', desc: '密码是否必须包含特殊字符' },
  { key: 'security.password_policy.require_number', value: true, type: 'boolean', group: 'security', category: 'SECURITY_CONFIG', displayName: '要求数字', desc: '密码是否必须包含数字' },
  { key: 'security.password_policy.require_uppercase', value: false, type: 'boolean', group: 'security', category: 'SECURITY_CONFIG', displayName: '要求大写字母', desc: '密码是否必须包含大写字母' },
  { key: 'security.password_policy.history_limit', value: 5, type: 'integer', group: 'security', category: 'SECURITY_CONFIG', displayName: '密码历史限制', desc: '禁止重复最近几次使用的密码' },
  { key: 'security.password_policy.expiration_days', value: 90, type: 'integer', group: 'security', category: 'SECURITY_CONFIG', displayName: '密码有效期', desc: '用户密码的最长有效天数' },
  { key: 'security.login.max_attempts', value: 5, type: 'integer', group: 'security', category: 'SECURITY_CONFIG', displayName: '登录失败次数', desc: '允许的最大登录尝试次数' },
  { key: 'security.login.lockout_duration', value: 30, type: 'integer', group: 'security', category: 'SECURITY_CONFIG', displayName: '锁定时间', desc: '账号锁定持续时间(分钟)' },
  { key: 'security.login.reset_window', value: 30, type: 'integer', group: 'security', category: 'SECURITY_CONFIG', displayName: '失败计数重置窗口', desc: '失败计数自动清零的时间间隔(分钟)' },
  { key: 'security.2fa_required', value: false, type: 'boolean', group: 'security', category: 'SECURITY_CONFIG', displayName: '强制双重验证', desc: '是否强制所有管理员启用2FA' },
  { key: 'security.ip_control.enabled', value: false, type: 'boolean', group: 'security', category: 'SECURITY_CONFIG', displayName: '启用IP访问控制', desc: '是否开启基于IP的黑白名单控制' },
  { key: 'security.ip_control.mode', value: 'blacklist', type: 'string', group: 'security', category: 'SECURITY_CONFIG', displayName: 'IP控制模式', desc: 'IP控制的模式: whitelist(白名单)/blacklist(黑名单)' },
  { key: 'security.ip_control.whitelist', value: [], type: 'array', group: 'security', category: 'SECURITY_CONFIG', displayName: 'IP白名单', desc: '允许访问的IP列表' },
  { key: 'security.ip_control.blacklist', value: [], type: 'array', group: 'security', category: 'SECURITY_CONFIG', displayName: 'IP黑名单', desc: '禁止访问的IP列表' },
  { key: 'security.session.idle_timeout', value: 30, type: 'integer', group: 'security', category: 'SECURITY_CONFIG', displayName: '空闲超时', desc: '用户无操作自动登出的时长(分钟)' },
  { key: 'feature.registration_enabled', value: true, type: 'boolean', group: 'feature', category: 'FEATURE_FLAGS', displayName: '用户注册', desc: '是否允许新用户注册' },
  { key: 'feature.password_reset_enabled', value: true, type: 'boolean', group: 'feature', category: 'FEATURE_FLAGS', displayName: '密码重置', desc: '是否允许重置密码' },
  { key: 'feature.audit_log_enabled', value: true, type: 'boolean', group: 'feature', category: 'FEATURE_FLAGS', displayName: '审计日志', desc: '是否启用审计日志' },
  { key: 'feature.maintenance_mode', value: false, type: 'boolean', group: 'feature', category: 'FEATURE_FLAGS', displayName: '维护模式', desc: '是否开启维护模式' },
  
  // 支付配置
  { key: 'payment.enabled_methods', value: ['alipay', 'wechat'], type: 'array', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '启用支付方式', desc: '启用的支付渠道列表' },
  { key: 'payment.default_method', value: 'alipay', type: 'string', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '默认支付方式', desc: '默认选中的支付方式' },
  { key: 'payment.alipay.appId', value: '', type: 'string', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '支付宝AppID', desc: '支付宝应用ID' },
  { key: 'payment.alipay.merchantId', value: '', type: 'string', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '支付宝商户号', desc: '支付宝商户ID' },
  { key: 'payment.alipay.apiKey', value: '', type: 'string', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '支付宝密钥', desc: '支付宝API密钥' },
  { key: 'payment.alipay.enabled', value: false, type: 'boolean', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '启用支付宝', desc: '是否启用支付宝' },
  { key: 'payment.wechat.appId', value: '', type: 'string', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '微信AppID', desc: '微信应用ID' },
  { key: 'payment.wechat.merchantId', value: '', type: 'string', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '微信商户号', desc: '微信商户ID' },
  { key: 'payment.wechat.apiKey', value: '', type: 'string', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '微信密钥', desc: '微信API密钥' },
  { key: 'payment.wechat.enabled', value: false, type: 'boolean', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '启用微信支付', desc: '是否启用微信支付' },
  { key: 'payment.unionpay.appId', value: '', type: 'string', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '银联AppID', desc: '银联应用ID' },
  { key: 'payment.unionpay.merchantId', value: '', type: 'string', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '银联商户号', desc: '银联商户ID' },
  { key: 'payment.unionpay.apiKey', value: '', type: 'string', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '银联密钥', desc: '银联API密钥' },
  { key: 'payment.unionpay.enabled', value: false, type: 'boolean', group: 'payment', category: 'INTEGRATION_CONFIG', displayName: '启用银联支付', desc: '是否启用银联支付' },

  // 通知配置
  { key: 'notification.smtp_server', value: '', type: 'string', group: 'notification', category: 'EMAIL_CONFIG', displayName: 'SMTP服务器', desc: '邮件发送服务器地址' },
  { key: 'notification.smtp_port', value: 587, type: 'integer', group: 'notification', category: 'EMAIL_CONFIG', displayName: 'SMTP端口', desc: '邮件发送服务器端口' },
  { key: 'notification.email_account', value: '', type: 'string', group: 'notification', category: 'EMAIL_CONFIG', displayName: '发送邮箱', desc: '系统发送邮件的邮箱账号' },
  { key: 'notification.email_password', value: '', type: 'string', group: 'notification', category: 'EMAIL_CONFIG', displayName: '邮箱密码', desc: '系统发送邮件的密码或授权码' },
  { key: 'notification.sender_name', value: '系统管理员', type: 'string', group: 'notification', category: 'EMAIL_CONFIG', displayName: '发送人名称', desc: '邮件发送显示名称' },
  { key: 'notification.smtp_secure', value: true, type: 'boolean', group: 'notification', category: 'EMAIL_CONFIG', displayName: 'SSL/TLS', desc: '是否启用安全连接' },
  { key: 'notification.email_enabled', value: true, type: 'boolean', group: 'notification', category: 'EMAIL_CONFIG', displayName: '启用邮件通知', desc: '是否开启邮件通知渠道' },
  { key: 'notification.important_operation_notify', value: true, type: 'boolean', group: 'notification', category: 'EMAIL_CONFIG', displayName: '重要操作通知', desc: '关键操作是否发送通知' },
  { key: 'notification.scheduled_task_notify', value: true, type: 'boolean', group: 'notification', category: 'EMAIL_CONFIG', displayName: '定时任务通知', desc: '定时任务执行结果通知' },
  { key: 'notification.alert_notify', value: true, type: 'boolean', group: 'notification', category: 'EMAIL_CONFIG', displayName: '告警通知', desc: '系统异常告警通知' },

  // 业务规则
  { key: 'business.overdue_grace_period', value: 7, type: 'integer', group: 'business', category: 'SYSTEM_GENERAL', displayName: '逾期宽限期', desc: '费用逾期宽限天数' },
  { key: 'business.late_fee_calculation', value: 'daily', type: 'string', group: 'business', category: 'SYSTEM_GENERAL', displayName: '滞纳金计算方式', desc: 'daily-按日计算, monthly-按月计算, once-单次收取' },
  { key: 'business.late_fee_rate', value: 0.0005, type: 'decimal', group: 'business', category: 'SYSTEM_GENERAL', displayName: '滞纳金率', desc: '每日滞纳金比例' },
  { key: 'business.max_late_fee', value: 100, type: 'decimal', group: 'business', category: 'SYSTEM_GENERAL', displayName: '最高滞纳金', desc: '单次收取的最高滞纳金限额' },
  { key: 'business.refund_period', value: 7, type: 'integer', group: 'business', category: 'SYSTEM_GENERAL', displayName: '退款期限', desc: '允许申请退款的天数' },
  { key: 'business.refund_fee_rate', value: 0.02, type: 'decimal', group: 'business', category: 'SYSTEM_GENERAL', displayName: '退款手续费率', desc: '退款时收取的服务费比例' },

  // 日志相关
  { key: 'log.rotation_enabled', value: true, type: 'boolean', group: 'log', category: 'LOG_CONFIG', displayName: '日志轮转', desc: '是否启用日志自动轮转' },
  { key: 'log.output_targets', value: ['file', 'console'], type: 'array', group: 'log', category: 'LOG_CONFIG', displayName: '日志输出目标', desc: '日志记录的目标(file/console/database)' },
  { key: 'log.level', value: 'info', type: 'string', group: 'log', category: 'LOG_CONFIG', displayName: '日志级别', desc: '系统运行时的日志记录级别(debug/info/warn/error)' },
  { key: 'log.max_files', value: 30, type: 'integer', group: 'log', category: 'LOG_CONFIG', displayName: '日志保留天数', desc: '日志文件在磁盘上保留的最大天数' },
  { key: 'log.max_size', value: 100, type: 'integer', group: 'log', category: 'LOG_CONFIG', displayName: '日志文件大小限制', desc: '单个日志文件的最大容量(MB)' },
  
  // UI 和显示配置
  { key: 'system.theme', value: 'light', type: 'string', group: 'system', category: 'UI_CONFIG', displayName: '系统主题', desc: '系统显示主题: light/dark' },
  { key: 'system.language', value: 'zh-CN', type: 'string', group: 'system', category: 'UI_CONFIG', displayName: '系统语言', desc: '系统界面显示语言' },
  { key: 'system.layout', value: 'side', type: 'string', group: 'system', category: 'UI_CONFIG', displayName: '系统布局', desc: '系统导航菜单布局方式' },
  { key: 'system.show_breadcrumb', value: true, type: 'boolean', group: 'system', category: 'UI_CONFIG', displayName: '显示面包屑', desc: '是否在页面顶部显示面包屑导航' },
  { key: 'system.fixed_header', value: true, type: 'boolean', group: 'system', category: 'UI_CONFIG', displayName: '固定顶栏', desc: '是否固定页面顶部栏' }
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
    case 'array':
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
    'payment': 'payment',
    'business': 'business',
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

async function getConfig(key, options = {}) {
  const { client = null } = options;
  const db = client || { query };

  const cacheKey = getCacheKey(key);
  // 如果是在事务中，跳过缓存，确保读取最新数据
  if (!client) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }
  
  const result = await db.query(
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

  // 只有非事务查询才更新缓存
  if (!client) {
    setCache(cacheKey, config);
  }

  return config;
}

/**
 * 获取安全相关配置
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 安全配置对象
 */
async function getSecurityConfigs(options = {}) {
  const configs = await getAllConfigs({ group: 'security', ...options });
  const security = {
    loginFailCount: 5,
    lockTime: 30,
    resetWindow: 30,
    sessionTimeout: 30,
    idleTimeout: 30,
    minLength: 8,
    requireSpecial: true,
    requireNumber: true,
    requireUppercase: false,
    historyLimit: 5,
    expirationDays: 90,
    twoFactorAuth: false,
    ipControlEnabled: false,
    ipControlMode: 'blacklist',
    ipWhitelist: [],
    ipBlacklist: []
  };

  for (const [key, config] of Object.entries(configs)) {
    const value = config.value;
    if (key === 'security.login.max_attempts') security.loginFailCount = parseInt(value) || 5;
    else if (key === 'security.login.lockout_duration') security.lockTime = parseInt(value) || 30;
    else if (key === 'security.login.reset_window') security.resetWindow = parseInt(value) || 30;
    else if (key === 'session.timeout') security.sessionTimeout = parseInt(value) || 60;
    else if (key === 'security.session.idle_timeout') security.idleTimeout = parseInt(value) || 120;
    else if (key === 'security.password_policy.min_length') security.minLength = parseInt(value) || 8;
    else if (key === 'security.password_policy.require_special') security.requireSpecial = Boolean(value);
    else if (key === 'security.password_policy.require_number') security.requireNumber = Boolean(value);
    else if (key === 'security.password_policy.require_uppercase') security.requireUppercase = Boolean(value);
    else if (key === 'security.password_policy.history_limit') security.historyLimit = parseInt(value) || 5;
    else if (key === 'security.password_policy.expiration_days') security.expirationDays = parseInt(value) || 90;
    else if (key === 'security.2fa_required') security.twoFactorAuth = Boolean(value);
    else if (key === 'security.ip_control.enabled') security.ipControlEnabled = Boolean(value);
    else if (key === 'security.ip_control.mode') security.ipControlMode = value || 'blacklist';
    else if (key === 'security.ip_control.whitelist') security.ipWhitelist = Array.isArray(value) ? value : [];
    else if (key === 'security.ip_control.blacklist') security.ipBlacklist = Array.isArray(value) ? value : [];
  }

  return security;
}

/**
 * 验证配置值的合法性 (Rule 18: 多层验证机制)
 * @param {string} key 配置键
 * @param {any} value 配置值
 * @param {string} type 配置类型
 */
function validateConfigValue(key, value, type) {
  // 1. 基本类型检查
  if (type === 'integer' || type === 'number') {
    if (isNaN(Number(value))) {
      throw new Error(`配置项 ${key} 必须是数字类型`);
    }
  }

  // 2. 特定安全配置校验
  if (key === 'security.login.max_attempts') {
    const val = parseInt(value);
    if (val < 1 || val > 20) throw new Error('登录失败锁定次数必须在 1-20 之间');
  }

  if (key === 'security.login.lockout_duration') {
    const val = parseInt(value);
    if (val < 1) throw new Error('账号锁定时间不能小于 1 分钟');
  }

  if (key === 'security.session.idle_timeout') {
    const val = parseInt(value);
    if (val < 5 || val > 1440) throw new Error('会话超时时间必须在 5-1440 分钟之间');
  }

  if (key === 'security.password_policy.min_length') {
    const val = parseInt(value);
    if (val < 6 || val > 32) throw new Error('密码最小长度必须在 6-32 之间');
  }

  if (key.includes('ip_control')) {
    if (!Array.isArray(value)) {
      throw new Error(`IP控制列表 ${key} 必须是数组格式`);
    }
    // 简单的 IP 格式校验
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    value.forEach(ip => {
      if (!ipRegex.test(ip) && ip !== '*' && ip !== 'localhost') {
        throw new Error(`无效的 IP 地址格式: ${ip}`);
      }
    });
  }
}

/**
 * 设置配置项
 * @param {string} key 配置键
 * @param {any} value 配置值
 * @param {Object} options 选项
 */
async function setConfig(key, value, options = {}) {
  const { 
    description, 
    displayName, 
    userId = null, 
    requiresRestart = false, 
    username = null, 
    ipAddress = null, 
    userAgent = null, 
    reason = null, 
    client = null // 支持外部传入数据库客户端（用于事务）
  } = options;
  
  const db = client || { query: require('../config/database').query };
  
  let current = await getConfig(key, { client });
  
  // 如果配置不存在，尝试从默认配置中恢复，或者动态创建
  if (!current) {
    console.log(`Config ${key} not found, checking defaults or creating dynamic config...`);
    const defaultConfig = DEFAULT_CONFIGS.find(c => c.key === key);
    
    if (defaultConfig) {
      console.log(`Creating missing config ${key} from defaults...`);
      await db.query(
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
    } else {
      // 动态创建新配置项 (Rule: 允许前端扩展配置而不崩溃)
      console.log(`Creating new dynamic config ${key}...`);
      const inferredType = typeof value === 'number' ? 'integer' : 
                          typeof value === 'boolean' ? 'boolean' : 
                          Array.isArray(value) ? 'array' : 'string';
      const inferredGroup = inferGroup(key);
      
      await db.query(
        `INSERT INTO admin_system_configs 
         (config_key, config_value, data_type, config_group, config_category, display_name, description, is_system_config, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false, true)`,
        [
          key, 
          JSON.stringify(value), 
          inferredType, 
          inferredGroup, 
          'SYSTEM_GENERAL',
          displayName || key, 
          description || `动态创建的配置项: ${key}`
        ]
      );
    }
    current = await getConfig(key, { client });
  }

  if (!current) {
    throw new Error(`Failed to create or find configuration key: ${key}`);
  }

  // 验证值合法性
  validateConfigValue(key, value, current.dataType);
  
  const oldValue = current.value;
  const formattedValue = formatValue(value, current.dataType);
  const newVersion = (current.version || 0) + 1;
  
  await db.query(
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
      reason: reason || description || '配置更新',
      configVersion: newVersion, // 传入新版本号
      client: client // 审计日志也支持事务
    });
    
    await configAuditService.saveConfigHistory({
      configKey: key,
      configValue: value,
      configVersion: newVersion,
      userId,
      username,
      changeReason: reason || description || '配置更新',
      client: client // 历史记录也支持事务
    });
  } catch (auditError) {
    console.error('[ConfigAudit] Failed to log config change:', auditError.message);
  }
  
  return { key, value, version: newVersion, requiresRestart };
}

/**
 * 事务性批量更新配置
 * @param {Object} configMap 配置映射 { key: value }
 * @param {Object} options 选项
 */
async function setConfigsTransactional(configMap, options = {}) {
  const { userId, username, role, ipAddress, userAgent, reason } = options;
  const { pool } = require('../config/database');
  const client = await pool.connect();
  
  const results = [];
  const restartRequired = [];
  
  try {
    await client.query('BEGIN');
    
    for (const [key, value] of Object.entries(configMap)) {
      const result = await setConfig(key, value, {
        userId,
        username,
        ipAddress,
        userAgent,
        reason: reason || '批量配置更新',
        client
      });
      
      results.push({ key, success: true, version: result.version });
      if (result.requiresRestart) {
        restartRequired.push(key);
      }
    }
    
    // 记录配置变更审计日志 (Rule 18: 记录敏感操作)
    // 放在 COMMIT 之前，确保审计日志与配置变更原子性
    const auditQuery = `
      INSERT INTO admin_operationlogs (
        operator_id, operator_username, operator_role, operator_ip, operator_user_agent,
        operation_type, operation_module, operation_description, operation_details, 
        operation_status, operation_timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `;

    // 处理 IP 地址，确保兼容 PostgreSQL 的 INET 类型
    let cleanIp = ipAddress || '127.0.0.1';
    if (cleanIp.includes('::ffff:')) {
      cleanIp = cleanIp.replace('::ffff:', '');
    }

    await client.query(auditQuery, [
      userId || 0,
      username || 'system',
      role || 'admin',
      cleanIp,
      userAgent || 'system',
      'SYSTEM_CONFIG_UPDATE', // 必须是 Schema 约束中的值
      'SYSTEM_CONFIG',        // 必须是 Schema 约束中的值
      `批量更新系统配置: ${Object.keys(configMap).join(', ')}`,
      JSON.stringify({ configs: configMap, reason: reason }),
      'success'
    ]);

    await client.query('COMMIT');
    
    // 触发实时同步通知 (WebSocket) - 放在事务提交后
    try {
      const websocketService = require('./websocketService');
      websocketService.broadcast({
        type: 'CONFIG_UPDATED',
        payload: {
          keys: Object.keys(configMap),
          timestamp: new Date().toISOString(),
          reason: reason || '配置已更新'
        }
      });
    } catch (wsError) {
      console.warn('[SystemConfig] Failed to broadcast config update:', wsError.message);
    }
    
    // 触发服务刷新逻辑（如果是邮件配置）
    const hasEmailConfig = Object.keys(configMap).some(key => key.startsWith('notification.'));
    if (hasEmailConfig) {
      try {
        const emailJob = require('../jobs/emailJob');
        // 异步刷新，不阻塞主流程，确保高可用
        emailJob.createEmailTransporter(true).catch(err => {
          console.error('[EmailJob] Failed to refresh transporter after config update:', err);
        });
      } catch (err) {
        console.warn('[EmailJob] Email module not available for refresh');
      }
    }

    return { success: true, results, restartRequired };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[SystemConfig] Transactional update failed, rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
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
  getSecurityConfigs,
  setConfig,
  setConfigs,
  setConfigsTransactional,
  deleteConfig,
  resetConfig,
  getConfigGroups,
  getMetaInfo,
  initializeDefaultConfigs
};
