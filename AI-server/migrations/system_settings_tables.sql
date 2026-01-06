-- 系统设置功能数据库迁移脚本
-- 创建时间: 2026-01-06
-- 用途: 为系统设置页面创建通知模板等附加表

-- 检查并创建通知模板表
CREATE TABLE IF NOT EXISTS admin_notification_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'wechat', 'dingtalk')),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建通知模板表索引
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON admin_notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON admin_notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_created_by ON admin_notification_templates(created_by);

-- 添加表注释
COMMENT ON TABLE admin_notification_templates IS '通知模板表，存储系统通知模板定义';
COMMENT ON COLUMN admin_notification_templates.name IS '模板名称';
COMMENT ON COLUMN admin_notification_templates.type IS '通知类型: email/sms/wechat/dingtalk';
COMMENT ON COLUMN admin_notification_templates.content IS '模板内容，支持变量替换';
COMMENT ON COLUMN admin_notification_templates.variables IS '模板中的变量列表(JSON数组格式)';
COMMENT ON COLUMN admin_notification_templates.is_active IS '是否启用';

-- 检查并创建支付配置表
CREATE TABLE IF NOT EXISTS admin_payment_configs (
    id SERIAL PRIMARY KEY,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('alipay', 'wechat', 'unionpay')),
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) DEFAULT 'string',
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(payment_method, config_key)
);

-- 创建支付配置表索引
CREATE INDEX IF NOT EXISTS idx_payment_configs_method ON admin_payment_configs(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_configs_active ON admin_payment_configs(is_active);

-- 添加表注释
COMMENT ON TABLE admin_payment_configs IS '支付方式配置表，存储各支付方式的配置信息';
COMMENT ON COLUMN admin_payment_configs.payment_method IS '支付方式: alipay/wechat/unionpay';
COMMENT ON COLUMN admin_payment_configs.config_key IS '配置键名';
COMMENT ON COLUMN admin_payment_configs.config_value IS '配置值(JSON格式)';
COMMENT ON COLUMN admin_payment_configs.config_type IS '配置类型: string/number/boolean';
COMMENT ON COLUMN admin_payment_configs.is_encrypted IS '是否加密存储';

-- 检查并创建邮件配置表
CREATE TABLE IF NOT EXISTS admin_email_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) DEFAULT 'string',
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建邮件配置表索引
CREATE INDEX IF NOT EXISTS idx_email_configs_active ON admin_email_configs(is_active);

-- 添加表注释
COMMENT ON TABLE admin_email_configs IS '邮件服务配置表，存储SMTP邮件服务器配置';

-- 检查并创建业务规则配置表
CREATE TABLE IF NOT EXISTS admin_business_rules (
    id SERIAL PRIMARY KEY,
    rule_key VARCHAR(100) UNIQUE NOT NULL,
    rule_value TEXT NOT NULL,
    rule_type VARCHAR(20) DEFAULT 'string',
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建业务规则表索引
CREATE INDEX IF NOT EXISTS idx_business_rules_active ON admin_business_rules(is_active);

-- 添加表注释
COMMENT ON TABLE admin_business_rules IS '业务规则配置表，存储费用计算、退款等业务规则';

-- 初始化默认业务规则
INSERT INTO admin_business_rules (rule_key, rule_value, rule_type, description) VALUES
('overdue_grace_period', '7', 'number', '费用逾期宽限期(天)'),
('late_fee_calculation', 'daily', 'string', '滞纳金计算方式: daily/monthly'),
('late_fee_rate', '0.05', 'number', '滞纳金比例'),
('max_late_fee', '1000', 'number', '最大滞纳金上限(元)'),
('refund_period', '30', 'number', '费用退款期限(天)'),
('refund_fee_rate', '2', 'number', '退款手续费比例(%)')
ON CONFLICT (rule_key) DO NOTHING;

-- 初始化默认通知模板
INSERT INTO admin_notification_templates (name, type, content, variables, is_active) VALUES
('费用缴纳通知', 'email', '尊敬的{userName}，您有一笔{amount}元的{feeType}费用待缴纳，请在{dueDate}前完成支付。', '["{userName}", "{amount}", "{feeType}", "{dueDate}"]', true),
('逾期提醒', 'sms', '【AI管理系统】提醒：您的{feeType}费用已逾期{days}天，请尽快处理。', '["{feeType}", "{days}"]', true),
('支付成功通知', 'wechat', '您已成功支付{amount}元{feeType}费用，支付时间为{payTime}。', '["{amount}", "{feeType}", "{payTime}"]', true)
ON CONFLICT DO NOTHING;

-- 初始化默认邮件配置
INSERT INTO admin_email_configs (config_key, config_value, config_type) VALUES
('smtp_server', 'smtp.example.com', 'string'),
('smtp_port', '587', 'number'),
('email_account', 'admin@example.com', 'string'),
('sender_name', '系统管理员', 'string'),
('smtp_secure', 'true', 'boolean')
ON CONFLICT (config_key) DO NOTHING;

-- 初始化默认支付配置
INSERT INTO admin_payment_configs (payment_method, config_key, config_value, config_type) VALUES
('alipay', 'appId', '', 'string'),
('alipay', 'merchantId', '', 'string'),
('alipay', 'enabled', 'false', 'boolean'),
('wechat', 'appId', '', 'string'),
('wechat', 'merchantId', '', 'string'),
('wechat', 'enabled', 'false', 'boolean'),
('unionpay', 'appId', '', 'string'),
('unionpay', 'merchantId', '', 'string'),
('unionpay', 'enabled', 'false', 'boolean')
ON CONFLICT (payment_method, config_key) DO NOTHING;

SELECT '系统设置相关表创建完成!' AS status;
