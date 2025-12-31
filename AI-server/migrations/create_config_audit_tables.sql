-- 环境配置审计日志表
-- 创建时间: 2024-12-31
-- 用途: 记录系统配置变更和环境切换的审计日志

-- 配置审计日志表
CREATE TABLE IF NOT EXISTS admin_config_audit_logs (
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

-- 配置历史表
CREATE TABLE IF NOT EXISTS admin_config_history (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    config_version INTEGER NOT NULL DEFAULT 1,
    changed_by INTEGER,
    changed_by_username VARCHAR(100),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_config_audit_key ON admin_config_audit_logs(config_key);
CREATE INDEX IF NOT EXISTS idx_config_audit_user ON admin_config_audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_config_audit_time ON admin_config_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_config_history_key ON admin_config_history(config_key);
CREATE INDEX IF NOT EXISTS idx_config_history_time ON admin_config_history(created_at);

-- 添加表注释
COMMENT ON TABLE admin_config_audit_logs IS '配置审计日志表，记录所有配置变更操作';
COMMENT ON TABLE admin_config_history IS '配置历史表，保存配置的历史版本';
COMMENT ON COLUMN admin_config_audit_logs.config_key IS '配置键名';
COMMENT ON COLUMN admin_config_audit_logs.old_value IS '变更前的配置值(JSON格式)';
COMMENT ON COLUMN admin_config_audit_logs.new_value IS '变更后的配置值(JSON格式)';
COMMENT ON COLUMN admin_config_audit_logs.change_type IS '变更类型: update/delete/rollback/environment_switch';
COMMENT ON COLUMN admin_config_audit_logs.changed_by IS '变更操作人ID';
COMMENT ON COLUMN admin_config_audit_logs.changed_by_username IS '变更操作人用户名';
COMMENT ON COLUMN admin_config_audit_logs.ip_address IS '客户端IP地址';
COMMENT ON COLUMN admin_config_audit_logs.reason IS '变更原因';
COMMENT ON COLUMN admin_config_audit_logs.is_rollback IS '是否为回滚操作';
COMMENT ON COLUMN admin_config_history.config_version IS '配置版本号';

-- 初始化默认系统配置
-- 如果 admin_system_configs 表为空或缺少 system.environment 配置，则插入默认值
INSERT INTO admin_system_configs (config_key, config_value, data_type, config_group, config_category, display_name, description, is_system_config, is_active)
VALUES 
('system.environment', '"development"', 'string', 'system', 'SYSTEM_GENERAL', '运行环境', '系统运行的环境: development(开发)/testing(测试)/production(生产)', true, true)
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

SELECT '环境配置审计表创建完成!' AS status;
