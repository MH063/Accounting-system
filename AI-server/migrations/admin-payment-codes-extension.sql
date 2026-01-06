-- 管理端收款码管理功能扩展SQL
-- 执行此脚本扩展 qr_codes 表和相关功能

-- 1. 为 qr_codes 表新增安全状态和审核状态字段
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS security_status VARCHAR(20) DEFAULT 'safe'
    CHECK (security_status IN ('safe', 'risk', 'abnormal'));

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS audit_status VARCHAR(20) DEFAULT 'pending'
    CHECK (audit_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS last_security_check_time TIMESTAMP WITH TIME ZONE;

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS last_security_check_result TEXT;

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS security_check_details JSONB DEFAULT '[]';

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS audit_comment TEXT;

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS audit_by BIGINT;

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS audit_time TIMESTAMP WITH TIME ZONE;

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS stop_reason TEXT;

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS stop_by BIGINT;

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS stop_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS last_used_time TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN qr_codes.security_status IS '安全状态：safe-安全，risk-风险，abnormal-异常';
COMMENT ON COLUMN qr_codes.audit_status IS '审核状态：pending-审核中，approved-已通过，rejected-已拒绝';
COMMENT ON COLUMN qr_codes.last_security_check_time IS '最后安全检查时间';
COMMENT ON COLUMN qr_codes.last_security_check_result IS '最后安全检查结果详情';
COMMENT ON COLUMN qr_codes.security_check_details IS '安全检查详情，JSON格式';
COMMENT ON COLUMN qr_codes.audit_comment IS '审核备注';
COMMENT ON COLUMN qr_codes.audit_by IS '审核人ID';
COMMENT ON COLUMN qr_codes.audit_time IS '审核时间';
COMMENT ON COLUMN qr_codes.stop_reason IS '停用原因';
COMMENT ON COLUMN qr_codes.stop_by IS '停用人ID';
COMMENT ON COLUMN qr_codes.stop_time IS '停用时间';
COMMENT ON COLUMN qr_codes.remark IS '备注';
COMMENT ON COLUMN qr_codes.last_used_time IS '最后使用时间';

-- 2. 更新 status 字段的 CHECK 约束，允许 stopped 状态
ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS qr_codes_status_check;

ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_status_check
    CHECK (status IN ('active', 'inactive', 'enabled', 'disabled', 'pending', 'stopped'));

-- 3. 新增索引
CREATE INDEX IF NOT EXISTS idx_qr_codes_security_status ON qr_codes(security_status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_audit_status ON qr_codes(audit_status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_last_security_check_time ON qr_codes(last_security_check_time DESC);

-- 4. 创建收款码使用统计视图
CREATE OR REPLACE VIEW qr_code_usage_statistics AS
SELECT
    q.id AS qr_code_id,
    q.name AS qr_code_name,
    q.platform,
    q.status,
    q.usage_count,
    COALESCE(SUM(qpr.amount), 0) AS total_amount,
    COUNT(qpr.id) AS payment_count,
    MAX(qpr.created_at) AS last_payment_time,
    COUNT(CASE WHEN qpr.status = 'success' THEN 1 END) AS success_count,
    COUNT(CASE WHEN qpr.status = 'pending' THEN 1 END) AS pending_count,
    COUNT(CASE WHEN qpr.status = 'failed' THEN 1 END) AS failed_count
FROM qr_codes q
LEFT JOIN qr_payment_records qpr ON q.id = qpr.qr_code_id
GROUP BY q.id, q.name, q.platform, q.status, q.usage_count;

COMMENT ON VIEW qr_code_usage_statistics IS '收款码使用统计视图';

-- 5. 创建安全检查历史表
CREATE TABLE IF NOT EXISTS qr_code_security_check_history (
    id BIGSERIAL PRIMARY KEY,
    qr_code_id BIGINT NOT NULL,
    check_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    result VARCHAR(20) NOT NULL CHECK (result IN ('safe', 'risk', 'abnormal')),
    risk_level VARCHAR(20),
    check_items INTEGER DEFAULT 0,
    issues_found INTEGER DEFAULT 0,
    details JSONB DEFAULT '[]',
    checked_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_security_check_qr_code_id
        FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE
);

COMMENT ON TABLE qr_code_security_check_history IS '收款码安全检查历史记录表';
COMMENT ON COLUMN qr_code_security_check_history.qr_code_id IS '收款码ID';
COMMENT ON COLUMN qr_code_security_check_history.result IS '检查结果：safe-安全，risk-风险，abnormal-异常';
COMMENT ON COLUMN qr_code_security_check_history.risk_level IS '风险等级：无/低/中等/高/严重';
COMMENT ON COLUMN qr_code_security_check_history.check_items IS '检查项目数';
COMMENT ON COLUMN qr_code_security_check_history.issues_found IS '发现问题数';
COMMENT ON COLUMN qr_code_security_check_history.details IS '检查详情，JSON数组格式';

CREATE INDEX IF NOT EXISTS idx_security_check_history_qr_code_id ON qr_code_security_check_history(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_security_check_history_check_time ON qr_code_security_check_history(check_time DESC);

-- 6. 创建收款码图片表（支持多张图片）
CREATE TABLE IF NOT EXISTS qr_code_images (
    id BIGSERIAL PRIMARY KEY,
    qr_code_id BIGINT NOT NULL,
    image_url TEXT NOT NULL,
    image_type VARCHAR(20) DEFAULT 'main' CHECK (image_type IN ('main', 'detail', 'additional')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_qr_code_images_qr_code_id
        FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE
);

COMMENT ON TABLE qr_code_images IS '收款码图片表，支持存储多张图片';
COMMENT ON COLUMN qr_code_images.qr_code_id IS '收款码ID';
COMMENT ON COLUMN qr_code_images.image_url IS '图片URL';
COMMENT ON COLUMN qr_code_images.image_type IS '图片类型：main-主图，detail-详情图，additional-附加图';
COMMENT ON COLUMN qr_code_images.sort_order IS '排序顺序';

CREATE INDEX IF NOT EXISTS idx_qr_code_images_qr_code_id ON qr_code_images(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_images_sort_order ON qr_code_images(qr_code_id, sort_order);

-- 7. 创建函数：更新最后使用时间
CREATE OR REPLACE FUNCTION update_qr_code_last_used_time()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE qr_codes
    SET last_used_time = NEW.created_at
    WHERE id = NEW.qr_code_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 为 qr_payment_records 创建触发器，在创建支付记录时更新时间
CREATE TRIGGER update_qr_code_on_payment
    AFTER INSERT ON qr_payment_records
    FOR EACH ROW
    EXECUTE FUNCTION update_qr_code_last_used_time();

-- 9. 更新现有数据的默认值
UPDATE qr_codes SET security_status = 'safe' WHERE security_status IS NULL;
UPDATE qr_codes SET audit_status = 'pending' WHERE audit_status IS NULL;

-- 10. 添加外键约束到审核人和停用人
ALTER TABLE qr_codes ADD CONSTRAINT fk_qr_codes_audit_by
    FOREIGN KEY (audit_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE qr_codes ADD CONSTRAINT fk_qr_codes_stop_by
    FOREIGN KEY (stop_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE qr_code_security_check_history ADD CONSTRAINT fk_security_check_checked_by
    FOREIGN KEY (checked_by) REFERENCES users(id) ON DELETE SET NULL;

-- 11. 创建索引用于常用查询
CREATE INDEX IF NOT EXISTS idx_qr_codes_platform_status ON qr_codes(platform, status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_security_audit_status ON qr_codes(security_status, audit_status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at_status ON qr_codes(created_at DESC, status);
