-- 两步验证数据库迁移脚本
-- 此脚本用于在线上数据库中添加两步验证相关的表结构

-- 添加两步验证相关字段到 users 表
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS two_factor_backup_codes JSONB;

-- 添加字段注释
COMMENT ON COLUMN users.two_factor_enabled IS '是否启用两步验证';
COMMENT ON COLUMN users.two_factor_secret IS '两步验证密钥';
COMMENT ON COLUMN users.two_factor_backup_codes IS '两步验证备用码';

-- 创建两步验证代码表
CREATE TABLE IF NOT EXISTS two_factor_codes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    code VARCHAR(10) NOT NULL,
    code_type VARCHAR(20) NOT NULL DEFAULT 'login'
        CHECK (code_type IN ('login', 'register', 'reset', 'verify', 'enable')),
    channel VARCHAR(20) NOT NULL DEFAULT 'email'
        CHECK (channel IN ('email', 'sms', 'authenticator')),
    target VARCHAR(255) NOT NULL, -- 邮箱或手机号
    ip_address INET NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_two_factor_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 检查约束
    CONSTRAINT two_factor_expires_check CHECK (expires_at > created_at),
    CONSTRAINT two_factor_attempts_check CHECK (attempts >= 0 AND attempts <= max_attempts)
);

-- 创建两步验证密钥表
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    backup_codes JSONB DEFAULT '[]',
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_two_factor_auth_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_two_factor_auth_user 
        UNIQUE (user_id)
);

-- 添加表注释
COMMENT ON TABLE two_factor_codes IS '两步验证表，存储邮箱和手机验证码信息';
COMMENT ON COLUMN two_factor_codes.id IS '验证记录唯一标识';
COMMENT ON COLUMN two_factor_codes.user_id IS '用户ID';
COMMENT ON COLUMN two_factor_codes.code IS '验证码';
COMMENT ON COLUMN two_factor_codes.code_type IS '验证码类型：login-登录，register-注册，reset-重置，verify-验证，enable-启用';
COMMENT ON COLUMN two_factor_codes.channel IS '发送渠道：email-邮箱，sms-短信，authenticator-验证器';
COMMENT ON COLUMN two_factor_codes.target IS '目标地址（邮箱或手机号）';
COMMENT ON COLUMN two_factor_codes.ip_address IS '请求IP地址';
COMMENT ON COLUMN two_factor_codes.attempts IS '尝试次数';
COMMENT ON COLUMN two_factor_codes.max_attempts IS '最大尝试次数';
COMMENT ON COLUMN two_factor_codes.is_used IS '是否已使用';
COMMENT ON COLUMN two_factor_codes.used_at IS '使用时间';
COMMENT ON COLUMN two_factor_codes.expires_at IS '过期时间';

-- 两步验证密钥表注释
COMMENT ON TABLE two_factor_auth IS '两步验证表，存储用户的两步验证配置';
COMMENT ON COLUMN two_factor_auth.id IS '两步验证配置唯一标识';
COMMENT ON COLUMN two_factor_auth.user_id IS '用户ID';
COMMENT ON COLUMN two_factor_auth.secret_key IS 'TOTP密钥';
COMMENT ON COLUMN two_factor_auth.backup_codes IS '备用码';
COMMENT ON COLUMN two_factor_auth.is_enabled IS '是否启用两步验证';
COMMENT ON COLUMN two_factor_auth.last_used_at IS '最后使用时间';
COMMENT ON COLUMN two_factor_auth.created_at IS '创建时间';
COMMENT ON COLUMN two_factor_auth.updated_at IS '更新时间';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_user_id ON two_factor_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_code ON two_factor_codes(code);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_expires ON two_factor_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_used ON two_factor_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 two_factor_auth 表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_two_factor_auth_updated_at ON two_factor_auth;
CREATE TRIGGER update_two_factor_auth_updated_at 
    BEFORE UPDATE ON two_factor_auth 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 验证表结构是否正确创建
SELECT 'Migration completed successfully' as message;