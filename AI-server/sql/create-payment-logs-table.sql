-- 创建支付日志表
CREATE TABLE IF NOT EXISTS payment_logs (
    id SERIAL PRIMARY KEY,
    expense_id BIGINT REFERENCES expenses(id),
    payment_method VARCHAR(50),
    amount NUMERIC(15, 2),
    transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_payment_logs_expense_id ON payment_logs(expense_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON payment_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);
