-- ============================================================
-- 安全问题验证模块数据库表结构
-- 版本: 1.0
-- 数据库: PostgreSQL 18
-- 创建日期: 2025-12-24
-- ============================================================

-- 1. 安全问题配置表
-- ============================================================

CREATE TABLE security_questions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    
    -- 三个安全问题及答案（加密存储）
    question1 VARCHAR(50) NOT NULL,
    answer1_hash VARCHAR(255) NOT NULL,
    question2 VARCHAR(50) NOT NULL,
    answer2_hash VARCHAR(255) NOT NULL,
    question3 VARCHAR(50) NOT NULL,
    answer3_hash VARCHAR(255) NOT NULL,
    
    -- 状态信息
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- 外键约束
    CONSTRAINT fk_security_questions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_security_questions_user_id UNIQUE (user_id),
    
    -- 检查约束
    CONSTRAINT security_questions_valid_check CHECK (
        question1 != question2 AND 
        question1 != question3 AND 
        question2 != question3
    )
);

COMMENT ON TABLE security_questions IS '用户安全问题配置表，存储用户的安全问题和加密答案';
COMMENT ON COLUMN security_questions.id IS '记录唯一标识';
COMMENT ON COLUMN security_questions.user_id IS '用户ID，外键关联users表';
COMMENT ON COLUMN security_questions.question1 IS '第一个安全问题标识';
COMMENT ON COLUMN security_questions.answer1_hash IS '第一个问题答案的哈希值';
COMMENT ON COLUMN security_questions.question2 IS '第二个安全问题标识';
COMMENT ON COLUMN security_questions.answer2_hash IS '第二个问题答案的哈希值';
COMMENT ON COLUMN security_questions.question3 IS '第三个安全问题标识';
COMMENT ON COLUMN security_questions.answer3_hash IS '第三个问题答案的哈希值';
COMMENT ON COLUMN security_questions.is_enabled IS '是否启用安全问题验证';
COMMENT ON COLUMN security_questions.is_verified IS '是否已通过验证';
COMMENT ON COLUMN security_questions.created_at IS '创建时间';
COMMENT ON COLUMN security_questions.updated_at IS '更新时间';
COMMENT ON COLUMN security_questions.last_verified_at IS '最后验证时间';

-- 2. 安全验证日志表
-- ============================================================

CREATE TABLE security_verification_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    
    -- 验证信息
    operation VARCHAR(100) NOT NULL,
    verification_type VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    reason TEXT,
    
    -- 请求信息
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- 地理位置信息
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_security_verification_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE security_verification_logs IS '安全验证日志表，记录所有安全验证操作';
COMMENT ON COLUMN security_verification_logs.id IS '日志记录唯一标识';
COMMENT ON COLUMN security_verification_logs.user_id IS '用户ID，外键关联users表';
COMMENT ON COLUMN security_verification_logs.operation IS '操作类型';
COMMENT ON COLUMN security_verification_logs.verification_type IS '验证类型：security_question_verification等';
COMMENT ON COLUMN security_verification_logs.success IS '验证是否成功';
COMMENT ON COLUMN security_verification_logs.reason IS '验证原因';
COMMENT ON COLUMN security_verification_logs.ip_address IS '客户端IP地址';
COMMENT ON COLUMN security_verification_logs.user_agent IS '用户代理字符串';
COMMENT ON COLUMN security_verification_logs.device_info IS '设备信息';
COMMENT ON COLUMN security_verification_logs.country IS '国家';
COMMENT ON COLUMN security_verification_logs.region IS '地区';
COMMENT ON COLUMN security_verification_logs.city IS '城市';
COMMENT ON COLUMN security_verification_logs.created_at IS '验证时间';

-- 3. 创建索引以提高查询性能
-- ============================================================

-- 安全问题配置表索引
CREATE INDEX idx_security_questions_user_id ON security_questions(user_id);
CREATE INDEX idx_security_questions_is_enabled ON security_questions(is_enabled);
CREATE INDEX idx_security_questions_is_verified ON security_questions(is_verified);

-- 安全验证日志表索引
CREATE INDEX idx_security_verification_logs_user_id ON security_verification_logs(user_id);
CREATE INDEX idx_security_verification_logs_operation ON security_verification_logs(operation);
CREATE INDEX idx_security_verification_logs_verification_type ON security_verification_logs(verification_type);
CREATE INDEX idx_security_verification_logs_success ON security_verification_logs(success);
CREATE INDEX idx_security_verification_logs_created_at ON security_verification_logs(created_at DESC);
CREATE INDEX idx_security_verification_logs_ip_address ON security_verification_logs(ip_address);

-- 4. 创建触发器自动更新 updated_at 字段
-- ============================================================

CREATE OR REPLACE FUNCTION update_security_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_security_questions_updated_at
    BEFORE UPDATE ON security_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_security_questions_updated_at();

-- 5. 创建视图用于查询统计信息
-- ============================================================

-- 用户验证统计视图
CREATE OR REPLACE VIEW user_verification_stats AS
SELECT 
    user_id,
    COUNT(*) AS total_verifications,
    COUNT(*) FILTER (WHERE success = TRUE) AS successful_verifications,
    COUNT(*) FILTER (WHERE success = FALSE) AS failed_verifications,
    COUNT(*) FILTER (WHERE success = FALSE) / NULLIF(COUNT(*), 0) * 100 AS failure_rate,
    MAX(created_at) AS last_verification_at,
    MIN(created_at) AS first_verification_at
FROM security_verification_logs
GROUP BY user_id;

COMMENT ON VIEW user_verification_stats IS '用户验证统计视图，提供每个用户的验证统计信息';

-- 6. 插入默认安全问题选项（可选）
-- ============================================================

-- 注意：这些是前端使用的标识，不是数据库存储的值
-- 前端可以使用这些标识来显示问题文本
-- 数据库只存储问题标识和答案哈希

-- 可用的问题标识列表（供前端参考）：
-- birthplace - 您的出生地是哪里？
-- mother_name - 您母亲的姓名是？
-- first_pet - 您的第一个宠物名字是？
-- favorite_teacher - 您最喜欢的老师是？
-- first_car - 您的第一辆车是？
-- favorite_color - 您最喜欢的颜色是？
-- father_name - 您父亲的姓名是？
-- best_friend - 您最好的朋友是？
-- favorite_food - 您最喜欢的食物是？
-- first_job - 您的第一个工作是？
-- favorite_sport - 您最喜欢的运动是？
-- memorable_trip - 您最难忘的旅行是？
-- favorite_movie - 您最喜欢的电影是？
-- childhood_nickname - 您小时候的昵称是？
-- favorite_book - 您最喜欢的书籍是？
