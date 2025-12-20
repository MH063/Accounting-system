-- 创建寝室设置表
CREATE TABLE IF NOT EXISTS dorm_settings (
    id SERIAL PRIMARY KEY,
    dorm_id INTEGER NOT NULL REFERENCES dorms(id) ON DELETE CASCADE,
    basic JSONB NOT NULL DEFAULT '{}',
    notifications JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_dorm_id UNIQUE (dorm_id)
);

-- 创建寝室解散流程表
CREATE TABLE IF NOT EXISTS dorm_dismissal (
    id SERIAL PRIMARY KEY,
    dorm_id INTEGER NOT NULL REFERENCES dorms(id) ON DELETE CASCADE,
    initiated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, cancelled
    reason TEXT,
    completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 为dorm_settings表添加索引
CREATE INDEX IF NOT EXISTS idx_dorm_settings_dorm_id ON dorm_settings(dorm_id);

-- 为dorm_dismissal表添加索引
CREATE INDEX IF NOT EXISTS idx_dorm_dismissal_dorm_id ON dorm_dismissal(dorm_id);
CREATE INDEX IF NOT EXISTS idx_dorm_dismissal_status ON dorm_dismissal(status);
-- 添加部分唯一索引，确保每个宿舍只能有一个待处理的解散流程
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_dorm_dismissal ON dorm_dismissal(dorm_id) WHERE (status = 'pending');
