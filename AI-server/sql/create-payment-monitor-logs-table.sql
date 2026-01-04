-- 支付监控日志表
-- 用于存储支付记录监控的完整信息，支持异常标记和处理功能

CREATE TABLE IF NOT EXISTS payment_monitor_logs (
    id SERIAL PRIMARY KEY,
    
    -- 订单信息
    order_no VARCHAR(100) UNIQUE NOT NULL,
    merchant_order_no VARCHAR(100),
    transaction_id VARCHAR(100),
    
    -- 用户信息
    user_id BIGINT NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    
    -- 支付信息
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'unknown'
        CHECK (payment_method IN ('alipay', 'wechat', 'bank', 'cash', 'unknown')),
    
    -- 状态信息
    status VARCHAR(20) NOT NULL DEFAULT 'processing'
        CHECK (status IN ('success', 'failed', 'processing', 'refunded', 'pending')),
    
    -- 关联信息
    expense_id BIGINT,
    expense_title VARCHAR(200),
    
    -- 时间信息
    create_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    complete_time TIMESTAMP WITH TIME ZONE,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- 备注
    remark TEXT,
    
    -- 异常标记信息
    is_exception BOOLEAN NOT NULL DEFAULT FALSE,
    exception_type VARCHAR(50),
    exception_description TEXT,
    exception_status VARCHAR(20) DEFAULT 'pending'
        CHECK (exception_status IN ('pending', 'processing', 'processed', 'ignored')),
    exception_handler VARCHAR(100),
    exception_handle_time TIMESTAMP WITH TIME ZONE,
    exception_marked_at TIMESTAMP WITH TIME ZONE,
    exception_marked_by BIGINT,
    
    -- 审核信息
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_payment_monitor_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_monitor_logs_expense_id 
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
    CONSTRAINT fk_payment_monitor_logs_exception_handler 
        FOREIGN KEY (exception_handler) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_payment_monitor_logs_exception_marker 
        FOREIGN KEY (exception_marked_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_payment_monitor_logs_reviewer 
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 支付监控日志表索引
CREATE INDEX IF NOT EXISTS idx_payment_monitor_logs_user_id ON payment_monitor_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_monitor_logs_order_no ON payment_monitor_logs(order_no);
CREATE INDEX IF NOT EXISTS idx_payment_monitor_logs_status ON payment_monitor_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_monitor_logs_payment_method ON payment_monitor_logs(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_monitor_logs_create_time ON payment_monitor_logs(create_time);
CREATE INDEX IF NOT EXISTS idx_payment_monitor_logs_expense_date ON payment_monitor_logs(expense_date);
CREATE INDEX IF NOT EXISTS idx_payment_monitor_logs_is_exception ON payment_monitor_logs(is_exception);
CREATE INDEX IF NOT EXISTS idx_payment_monitor_logs_exception_status ON payment_monitor_logs(exception_status);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_payment_monitor_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_monitor_logs_updated ON payment_monitor_logs;
CREATE TRIGGER trg_payment_monitor_logs_updated
    BEFORE UPDATE ON payment_monitor_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_monitor_logs_timestamp();

-- 插入初始测试数据
INSERT INTO payment_monitor_logs (
    order_no, merchant_order_no, transaction_id, user_id, user_name,
    amount, payment_method, status, expense_title, create_time, complete_time,
    remark, is_exception
) VALUES
(
    'PAY202310150001', 'M202310150001', 'T202310150001ALI',
    1, '张三',
    1200.00, 'alipay', 'success', '住宿费',
    '2023-10-15 10:30:25', '2023-10-15 10:30:30',
    '住宿费', FALSE
),
(
    'PAY202310150002', 'M202310150002', NULL,
    2, '李四',
    150.50, 'wechat', 'failed', '水电费',
    '2023-10-15 11:15:42', NULL,
    '水电费', TRUE
),
(
    'PAY202310150003', 'M202310150003', NULL,
    3, '王五',
    80.00, 'bank', 'processing', '网费',
    '2023-10-15 14:22:18', NULL,
    '网费', FALSE
),
(
    'PAY202310150004', 'M202310150004', 'T202310150004ALI',
    4, '赵六',
    500.00, 'alipay', 'success', '餐费',
    '2023-10-15 15:30:10', '2023-10-15 15:30:15',
    '餐费', FALSE
),
(
    'PAY202310150005', 'M202310150005', NULL,
    5, '钱七',
    2000.00, 'bank', 'refunded', '押金',
    '2023-10-15 16:00:00', '2023-10-15 16:30:00',
    '押金退还', FALSE
);

COMMENT ON TABLE payment_monitor_logs IS '支付监控日志表，记录所有支付记录及异常处理信息';
COMMENT ON COLUMN payment_monitor_logs.order_no IS '系统订单号';
COMMENT ON COLUMN payment_monitor_logs.merchant_order_no IS '商户订单号';
COMMENT ON COLUMN payment_monitor_logs.transaction_id IS '支付流水号';
COMMENT ON COLUMN payment_monitor_logs.is_exception IS '是否标记为异常';
COMMENT ON COLUMN payment_monitor_logs.exception_type IS '异常类型：timeout/amount_mismatch/duplicate/complaint/other';
COMMENT ON COLUMN payment_monitor_logs.exception_status IS '异常处理状态：pending/processing/processed/ignored';
