-- 邮箱验证表
-- 此脚本用于创建邮箱验证相关的表结构

-- 创建邮箱验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    code VARCHAR(10) NOT NULL,
    code_type VARCHAR(20) NOT NULL
        CHECK (code_type IN ('email_verification', 'phone_verification', 'password_reset', 'login')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- 检查约束
    CONSTRAINT verification_codes_expires CHECK (expires_at > created_at),
    CONSTRAINT verification_codes_format CHECK (code ~ '^\d{6}$')
);

-- 添加表注释
COMMENT ON TABLE verification_codes IS '验证码表，存储各种用途的验证码';
COMMENT ON COLUMN verification_codes.email IS '邮箱地址';
COMMENT ON COLUMN verification_codes.code IS '6位数字验证码';
COMMENT ON COLUMN verification_codes.code_type IS '验证码类型：email_verification-邮箱验证，phone_verification-手机验证，password_reset-密码重置，login-登录';
COMMENT ON COLUMN verification_codes.expires_at IS '过期时间';
COMMENT ON COLUMN verification_codes.used_at IS '使用时间';

-- 创建索引以提高查询性能
CREATE INDEX idx_verification_codes_email_code ON verification_codes(email, code);
CREATE INDEX idx_verification_codes_email_type ON verification_codes(email, code_type);
CREATE INDEX idx_verification_codes_unused ON verification_codes(email, code_type) WHERE used_at IS NULL;