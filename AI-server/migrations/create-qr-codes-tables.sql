-- 创建收款码相关表的迁移脚本

-- 1. 收款码表
CREATE TABLE qr_codes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'fixed'
        CHECK (type IN ('fixed', 'custom', 'dynamic')),
    amount DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'CNY',
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    qr_code_url TEXT NOT NULL,
    merchant_name VARCHAR(200),
    merchant_account VARCHAR(200),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    tags JSONB DEFAULT '[]',
    background_color VARCHAR(7),
    logo_url TEXT,
    platform VARCHAR(20) NOT NULL
        CHECK (platform IN ('alipay', 'wechat', 'unionpay')),
    is_user_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
    user_id BIGINT NOT NULL,
    
    -- 外键约束
    CONSTRAINT fk_qr_codes_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 检查约束
    CONSTRAINT qr_codes_amount_positive CHECK (amount >= 0),
    CONSTRAINT qr_codes_usage_count_positive CHECK (usage_count >= 0),
    CONSTRAINT qr_codes_usage_limit_positive CHECK (usage_limit IS NULL OR usage_limit > 0)
);

COMMENT ON TABLE qr_codes IS '收款码表，存储用户生成的各种收款二维码';
COMMENT ON COLUMN qr_codes.id IS '收款码唯一标识';
COMMENT ON COLUMN qr_codes.name IS '收款码名称';
COMMENT ON COLUMN qr_codes.type IS '收款码类型：fixed-固定金额，custom-自定义金额，dynamic-动态金额';
COMMENT ON COLUMN qr_codes.amount IS '固定金额（适用于fixed类型）';
COMMENT ON COLUMN qr_codes.currency IS '货币类型，默认CNY（人民币）';
COMMENT ON COLUMN qr_codes.description IS '收款码描述';
COMMENT ON COLUMN qr_codes.status IS '状态：active-激活，inactive-未激活';
COMMENT ON COLUMN qr_codes.usage_limit IS '使用次数限制';
COMMENT ON COLUMN qr_codes.usage_count IS '已使用次数';
COMMENT ON COLUMN qr_codes.created_at IS '创建时间';
COMMENT ON COLUMN qr_codes.updated_at IS '更新时间';
COMMENT ON COLUMN qr_codes.expires_at IS '过期时间';
COMMENT ON COLUMN qr_codes.qr_code_url IS '二维码图片URL';
COMMENT ON COLUMN qr_codes.merchant_name IS '商户名称';
COMMENT ON COLUMN qr_codes.merchant_account IS '商户账号';
COMMENT ON COLUMN qr_codes.is_default IS '是否为默认收款码';
COMMENT ON COLUMN qr_codes.tags IS '标签，JSON数组格式';
COMMENT ON COLUMN qr_codes.background_color IS '背景颜色';
COMMENT ON COLUMN qr_codes.logo_url IS 'Logo图片URL';
COMMENT ON COLUMN qr_codes.platform IS '支付平台：alipay-支付宝，wechat-微信，unionpay-银联';
COMMENT ON COLUMN qr_codes.is_user_uploaded IS '是否为用户上传的二维码';
COMMENT ON COLUMN qr_codes.user_id IS '用户ID，外键关联users表';

-- 2. 二维码支付记录表
CREATE TABLE qr_payment_records (
    id BIGSERIAL PRIMARY KEY,
    qr_code_id BIGINT NOT NULL,
    payer_id BIGINT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    transaction_id VARCHAR(100),
    payment_method VARCHAR(20)
        CHECK (payment_method IN ('alipay', 'wechat', 'unionpay', 'bank', 'cash')),
    expense_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_qr_payment_records_qr_code_id 
        FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_payment_records_payer_id 
        FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_payment_records_expense_id 
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
    
    -- 检查约束
    CONSTRAINT qr_payment_records_amount_positive CHECK (amount > 0)
);

COMMENT ON TABLE qr_payment_records IS '二维码支付记录表，记录通过收款码完成的支付';
COMMENT ON COLUMN qr_payment_records.id IS '支付记录唯一标识';
COMMENT ON COLUMN qr_payment_records.qr_code_id IS '收款码ID，外键关联qr_codes表';
COMMENT ON COLUMN qr_payment_records.payer_id IS '付款人ID，外键关联users表';
COMMENT ON COLUMN qr_payment_records.amount IS '支付金额';
COMMENT ON COLUMN qr_payment_records.status IS '支付状态：pending-待支付，success-支付成功，failed-支付失败，cancelled-已取消';
COMMENT ON COLUMN qr_payment_records.paid_at IS '支付完成时间';
COMMENT ON COLUMN qr_payment_records.transaction_id IS '交易ID';
COMMENT ON COLUMN qr_payment_records.payment_method IS '支付方式：alipay-支付宝，wechat-微信，unionpay-银联，bank-银行转账，cash-现金';
COMMENT ON COLUMN qr_payment_records.expense_id IS '关联的费用ID，外键关联expenses表';
COMMENT ON COLUMN qr_payment_records.created_at IS '创建时间';
COMMENT ON COLUMN qr_payment_records.updated_at IS '更新时间';

-- 3. 用户支付偏好表
CREATE TABLE user_payment_preferences (
    user_id BIGINT PRIMARY KEY,
    preferred_method VARCHAR(20) DEFAULT 'wechat'
        CHECK (preferred_method IN ('alipay', 'wechat', 'unionpay', 'bank', 'cash')),
    default_split_method VARCHAR(20) DEFAULT 'equal'
        CHECK (default_split_method IN ('equal', 'days', 'custom')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_user_payment_preferences_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE user_payment_preferences IS '用户支付偏好表，存储用户的支付偏好设置';
COMMENT ON COLUMN user_payment_preferences.user_id IS '用户ID，主键，外键关联users表';
COMMENT ON COLUMN user_payment_preferences.preferred_method IS '首选支付方式：alipay-支付宝，wechat-微信，unionpay-银联，bank-银行转账，cash-现金';
COMMENT ON COLUMN user_payment_preferences.default_split_method IS '默认分摊方式：equal-等额分摊，days-按天数分摊，custom-自定义比例分摊';
COMMENT ON COLUMN user_payment_preferences.created_at IS '创建时间';
COMMENT ON COLUMN user_payment_preferences.updated_at IS '更新时间';

-- 4. 创建索引
CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_platform ON qr_codes(platform);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_qr_codes_type ON qr_codes(type);
CREATE INDEX idx_qr_codes_is_default ON qr_codes(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_qr_codes_created_at ON qr_codes(created_at DESC);

CREATE INDEX idx_qr_payment_records_qr_code_id ON qr_payment_records(qr_code_id);
CREATE INDEX idx_qr_payment_records_payer_id ON qr_payment_records(payer_id);
CREATE INDEX idx_qr_payment_records_status ON qr_payment_records(status);
CREATE INDEX idx_qr_payment_records_expense_id ON qr_payment_records(expense_id);
CREATE INDEX idx_qr_payment_records_created_at ON qr_payment_records(created_at DESC);
CREATE INDEX idx_qr_payment_records_paid_at ON qr_payment_records(paid_at DESC);

CREATE INDEX idx_user_payment_preferences_preferred_method ON user_payment_preferences(preferred_method);

-- 5. 创建触发器函数用于自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 为表创建触发器
CREATE TRIGGER update_qr_codes_updated_at 
    BEFORE UPDATE ON qr_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_payment_records_updated_at 
    BEFORE UPDATE ON qr_payment_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_payment_preferences_updated_at 
    BEFORE UPDATE ON user_payment_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();