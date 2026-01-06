-- 1. 密码历史记录表
CREATE TABLE IF NOT EXISTS user_password_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_password_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON user_password_history(user_id);

-- 2. IP 访问控制表
CREATE TABLE IF NOT EXISTS security_ip_controls (
    id SERIAL PRIMARY KEY,
    ip_range INET NOT NULL, -- 支持 IPv4, IPv6 和 CIDR
    control_type VARCHAR(20) NOT NULL CHECK (control_type IN ('whitelist', 'blacklist')),
    group_name VARCHAR(100), -- 分组管理
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE, -- 支持临时规则
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by BIGINT,
    CONSTRAINT fk_ip_controls_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_ip_controls_range ON security_ip_controls USING gist (ip_range inet_ops);

-- 3. 登录失败详细日志（用于分级锁定和审计）
CREATE TABLE IF NOT EXISTS security_login_logs (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'locked')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_logs_username ON security_login_logs(username);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip ON security_login_logs(ip_address);

-- 4. 插入新增的安全配置项到系统配置表 (如果还不存在)
INSERT INTO admin_system_configs (config_key, config_value, config_type, config_group, description, display_name, config_category)
VALUES 
('security.password_policy.history_limit', '5', 'integer', 'security', '禁止重复最近几次使用的密码', '密码历史限制', 'SECURITY_CONFIG'),
('security.password_policy.expiration_days', '90', 'integer', 'security', '用户密码的最长有效天数', '密码有效期', 'SECURITY_CONFIG'),
('security.login.reset_window', '30', 'integer', 'security', '失败计数自动清零的时间间隔(分钟)', '失败计数重置窗口', 'SECURITY_CONFIG'),
('security.ip_control.enabled', 'false', 'boolean', 'security', '是否开启基于IP的黑白名单控制', '启用IP访问控制', 'SECURITY_CONFIG'),
('security.ip_control.mode', 'blacklist', 'string', 'security', 'IP控制的模式: whitelist(白名单)/blacklist(黑名单)', 'IP控制模式', 'SECURITY_CONFIG'),
('security.session.idle_timeout', '120', 'integer', 'security', '用户无操作自动登出的时长(分钟)', '空闲超时', 'SECURITY_CONFIG')
ON CONFLICT (config_key) DO NOTHING;
