-- 系统配置表
CREATE TABLE IF NOT EXISTS admin_system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(50) DEFAULT 'string',
    config_group VARCHAR(50) DEFAULT 'system',
    description VARCHAR(255),
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认系统配置
INSERT INTO admin_system_configs (config_key, config_value, config_type, config_group, description) VALUES
-- 系统基础配置
('system.name', 'AI记账管理系统', 'string', 'system', '系统名称'),
('system.version', '2.1.0', 'string', 'system', '系统版本号'),
('system.environment', 'development', 'string', 'system', '运行环境: development/production'),
('system.deploy_time', NOW()::text, 'datetime', 'system', '部署时间'),

-- 服务器配置
('server.host', '0.0.0.0', 'string', 'server', '服务器地址'),
('server.port', '4000', 'number', 'server', '服务端口号'),
('server.max_connections', '20', 'number', 'server', '数据库连接池最大连接数'),
('server.idle_timeout', '30000', 'number', 'server', '数据库连接空闲超时(ms)'),
('server.connection_timeout', '10000', 'number', 'server', '数据库连接超时(ms)'),

-- 会话配置
('session.timeout', '60', 'number', 'session', '会话超时时间(分钟)'),
('session.refresh_interval', '30', 'number', 'session', '令牌刷新间隔(天)'),
('session.max_sessions', '5', 'number', 'session', '单用户最大会话数'),

-- 安全配置
('security.jwt_secret', 'your-development-jwt-secret-key-minimum-32-characters', 'string', 'security', 'JWT密钥'),
('security.password_policy.min_length', '8', 'number', 'security', '密码最小长度'),
('security.password_policy.require_special', 'true', 'boolean', 'security', '是否需要特殊字符'),
('security.login.max_attempts', '5', 'number', 'security', '登录失败最大次数'),
('security.login.lockout_duration', '30', 'number', 'security', '锁定时间(分钟)'),
('security.2fa_required', 'false', 'boolean', 'security', '是否强制开启双因素认证'),

-- 日志配置
('log.level', 'info', 'string', 'log', '日志级别: debug/info/warn/error'),
('log.max_files', '30', 'number', 'log', '日志文件保留天数'),
('log.max_size', '100', 'number', 'log', '单个日志文件大小限制(MB)'),

-- 性能配置
('performance.cache_ttl', '3600', 'number', 'performance', '缓存过期时间(秒)'),
('performance.rate_limit', '100', 'number', 'performance', 'API速率限制(请求/分钟)'),
('performance.compression', 'true', 'boolean', 'performance', '是否启用响应压缩'),

-- 备份配置
('backup.enabled', 'true', 'boolean', 'backup', '是否启用自动备份'),
('backup.schedule', '0 2 * * *', 'string', 'backup', '备份计划(Cron表达式)'),
('backup.retention', '7', 'number', 'backup', '备份保留天数'),
('backup.type', 'full', 'string', 'backup', '备份类型: full/incremental'),

-- 通知配置
('notification.email_enabled', 'true', 'boolean', 'notification', '是否启用邮件通知'),
('notification.sms_enabled', 'false', 'boolean', 'notification', '是否启用短信通知'),
('notification.admin_email', 'admin@example.com', 'string', 'notification', '管理员邮箱'),

-- 客户端配置
('client.session_timeout', '30', 'number', 'client', '客户端会话超时(分钟)'),
('client.heartbeat_interval', '30', 'number', 'client', '客户端心跳间隔(秒)'),
('client.auto_reconnect', 'true', 'boolean', 'client', '是否自动重连'),

-- 功能开关
('feature.registration_enabled', 'true', 'boolean', 'feature', '是否允许新用户注册'),
('feature.password_reset_enabled', 'true', 'boolean', 'feature', '是否允许密码重置'),
('feature.audit_log_enabled', 'true', 'boolean', 'feature', '是否启用审计日志'),
('feature.maintenance_mode', 'false', 'boolean', 'feature', '是否开启维护模式')
ON CONFLICT (config_key) DO NOTHING;

-- 创建配置索引
CREATE INDEX IF NOT EXISTS idx_admin_system_configs_group ON admin_system_configs(config_group);
CREATE INDEX IF NOT EXISTS idx_admin_system_configs_key ON admin_system_configs(config_key);

-- 审计日志表增加配置变更记录
COMMENT ON TABLE admin_system_configs IS '系统配置表，存储所有可动态调整的系统参数';
COMMENT ON COLUMN admin_system_configs.config_value IS '配置值，存储为JSON字符串';
COMMENT ON COLUMN admin_system_configs.config_type IS '配置类型: string/number/boolean/datetime/json';
COMMENT ON COLUMN admin_system_configs.config_group IS '配置分组: system/server/session/security/log/performance/backup/notification/client/feature';
