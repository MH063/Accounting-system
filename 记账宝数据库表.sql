-- ============================================================
-- 记账宝系统数据库建表脚本
-- 版本: 1.0
-- 数据库: PostgreSQL 18
-- 创建日期: 2025-12-10
-- ============================================================

-- 1. 用户认证模块
-- ============================================================

-- 用户基础信息表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- 账户状态
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'pending', 'banned')),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 安全相关
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    password_changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 约束和注释
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_phone_format CHECK (phone ~* '^\+?[1-9]\d{1,14}$')
);

COMMENT ON TABLE users IS '用户基础信息表，存储所有用户的基本认证和资料信息';
COMMENT ON COLUMN users.id IS '用户唯一标识，主键';
COMMENT ON COLUMN users.username IS '用户名，唯一，用于登录';
COMMENT ON COLUMN users.email IS '邮箱地址，唯一，用于登录和通知';
COMMENT ON COLUMN users.password_hash IS '密码哈希值，使用bcrypt等安全算法';
COMMENT ON COLUMN users.nickname IS '用户昵称，用于显示';
COMMENT ON COLUMN users.phone IS '手机号码，可选，用于验证';
COMMENT ON COLUMN users.avatar_url IS '头像URL地址';
COMMENT ON COLUMN users.status IS '账户状态：active-活跃，inactive-未激活，pending-待审核，banned-已禁用';
COMMENT ON COLUMN users.email_verified IS '邮箱是否已验证';
COMMENT ON COLUMN users.phone_verified IS '手机是否已验证';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.last_login_ip IS '最后登录IP地址';
COMMENT ON COLUMN users.failed_login_attempts IS '连续登录失败次数';
COMMENT ON COLUMN users.locked_until IS '账户锁定到期时间';

-- 角色定义表
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS '角色定义表，定义系统中所有可用的角色';
COMMENT ON COLUMN roles.id IS '角色唯一标识，主键';
COMMENT ON COLUMN roles.role_name IS '角色名称标识';
COMMENT ON COLUMN roles.role_display_name IS '角色显示名称';
COMMENT ON COLUMN roles.description IS '角色描述信息';
COMMENT ON COLUMN roles.permissions IS '角色权限配置，JSON格式存储';
COMMENT ON COLUMN roles.is_system_role IS '是否为系统角色，系统角色不可删除';

-- 用户角色关联表
CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_by BIGINT,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- 外键约束
    CONSTRAINT fk_user_roles_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id 
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_roles_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 唯一约束
    CONSTRAINT uk_user_role 
        UNIQUE (user_id, role_id),
    
    -- 检查约束    CONSTRAINT user_roles_validity CHECK (expires_at IS NULL OR expires_at > assigned_at)
);

COMMENT ON TABLE user_roles IS '用户角色关联表，处理用户与角色的多对多关系';
COMMENT ON COLUMN user_roles.id IS '关联记录唯一标识';
COMMENT ON COLUMN user_roles.user_id IS '用户ID，外键关联users表';
COMMENT ON COLUMN user_roles.role_id IS '角色ID，外键关联roles表';
COMMENT ON COLUMN user_roles.assigned_by IS '分配角色的管理员ID';
COMMENT ON COLUMN user_roles.assigned_at IS '角色分配时间';
COMMENT ON COLUMN user_roles.expires_at IS '角色过期时间，NULL表示永不过期';
COMMENT ON COLUMN user_roles.is_active IS '是否有效，false表示已撤销';

-- 用户会话管理表
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address INET NOT NULL,
    user_agent TEXT,
    
    -- 会话状态
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 时间
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_user_sessions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 检查约束    CONSTRAINT user_sessions_expires CHECK (expires_at > created_at)
);

COMMENT ON TABLE user_sessions IS '用户会话管理表，管理用户登录会话和令牌';
COMMENT ON COLUMN user_sessions.id IS '会话唯一标识';
COMMENT ON COLUMN user_sessions.user_id IS '用户ID，外键关联users表';
COMMENT ON COLUMN user_sessions.session_token IS '访问令牌JWT';
COMMENT ON COLUMN user_sessions.refresh_token IS '刷新令牌';
COMMENT ON COLUMN user_sessions.device_info IS '设备信息，JSON格式存储';
COMMENT ON COLUMN user_sessions.ip_address IS '客户端IP地址';
COMMENT ON COLUMN user_sessions.user_agent IS '用户代理字符串';
COMMENT ON COLUMN user_sessions.status IS '会话状态：active-活跃，expired-已过期，revoked-已撤销';
COMMENT ON COLUMN user_sessions.expires_at IS '会话过期时间';
COMMENT ON COLUMN user_sessions.last_accessed_at IS '最后访问时间';

-- 2. 宿舍管理模块
-- ============================================================

-- 宿舍信息表
CREATE TABLE dorms (
    id SERIAL PRIMARY KEY,
    dorm_name VARCHAR(100) NOT NULL,
    dorm_code VARCHAR(20) UNIQUE,
    address TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    current_occupancy INTEGER NOT NULL DEFAULT 0 
        CHECK (current_occupancy >= 0 AND current_occupancy <= capacity),
    description TEXT,
    
    -- 宿舍状态
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'maintenance')),
    
    -- 费用配置
    monthly_rent DECIMAL(10,2) DEFAULT 0.00,
    deposit DECIMAL(10,2) DEFAULT 0.00,
    utility_included BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 联系方式
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    
    -- 位置信息
    building VARCHAR(50),
    floor INTEGER,
    room_number VARCHAR(20),
    
    -- 设施信息
    facilities JSONB DEFAULT '[]',
    amenities JSONB DEFAULT '[]',
    
    -- 管理员
    admin_id BIGINT,
    
    -- 时间信息
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 检查约束
    CONSTRAINT dorms_occupancy_check CHECK (current_occupancy <= capacity),
    CONSTRAINT dorms_rent_positive CHECK (monthly_rent >= 0),
    CONSTRAINT dorms_deposit_positive CHECK (deposit >= 0),
    
    -- 外键约束
    CONSTRAINT fk_dorms_admin_id 
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE dorms IS '宿舍信息表，存储所有宿舍的基本信息和配置';
COMMENT ON COLUMN dorms.id IS '宿舍唯一标识，主键';
COMMENT ON COLUMN dorms.dorm_name IS '宿舍名称';
COMMENT ON COLUMN dorms.dorm_code IS '宿舍编码，用于快速识别';
COMMENT ON COLUMN dorms.address IS '宿舍完整地址';
COMMENT ON COLUMN dorms.capacity IS '宿舍最大容量人数';
COMMENT ON COLUMN dorms.current_occupancy IS '当前入住人数';
COMMENT ON COLUMN dorms.description IS '宿舍描述信息';
COMMENT ON COLUMN dorms.status IS '宿舍状态：active-活跃，inactive-未激活，maintenance-维护中';
COMMENT ON COLUMN dorms.monthly_rent IS '月租金';
COMMENT ON COLUMN dorms.deposit IS '押金金额';
COMMENT ON COLUMN dorms.utility_included IS '水电网费是否包含在租金中';
COMMENT ON COLUMN dorms.contact_person IS '宿舍联系人';
COMMENT ON COLUMN dorms.contact_phone IS '联系电话';
COMMENT ON COLUMN dorms.contact_email IS '联系邮箱';
COMMENT ON COLUMN dorms.building IS '建筑物名称';
COMMENT ON COLUMN dorms.floor IS '楼层';
COMMENT ON COLUMN dorms.room_number IS '房间号';
COMMENT ON COLUMN dorms.facilities IS '设施列表，JSON数组格式';
COMMENT ON COLUMN dorms.amenities IS '便利设施列表，JSON数组格式';
COMMENT ON COLUMN dorms.admin_id IS '宿舍管理员ID';

-- 3. 成员管理模块
-- ============================================================

-- 用户宿舍关联表
CREATE TABLE user_dorms (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    dorm_id INTEGER NOT NULL,
    
    -- 成员信息
    member_role VARCHAR(20) NOT NULL DEFAULT 'member'
        CHECK (member_role IN ('admin', 'member', 'viewer')),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'pending')),
    
    -- 入住信息
    move_in_date DATE,
    move_out_date DATE,
    bed_number VARCHAR(10),
    room_number VARCHAR(20),
    
    -- 费用相关
    monthly_share DECIMAL(10,2) DEFAULT 0.00,
    deposit_paid DECIMAL(10,2) DEFAULT 0.00,
    last_payment_date DATE,
    
    -- 权限设置
    can_approve_expenses BOOLEAN NOT NULL DEFAULT FALSE,
    can_invite_members BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage_facilities BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 邀请信息
    invited_by BIGINT,
    invite_code VARCHAR(50) UNIQUE,
    invite_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 时间信息
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_user_dorms_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_dorms_dorm_id 
        FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_dorms_invited_by 
        FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CONSTRAINT user_dorms_dates_check 
        CHECK (move_out_date IS NULL OR move_in_date IS NULL OR move_out_date > move_in_date),
    CONSTRAINT user_dorms_share_positive CHECK (monthly_share >= 0),
    CONSTRAINT user_dorms_deposit_positive CHECK (deposit_paid >= 0),
    
    -- 唯一约束
    CONSTRAINT uk_user_dorm_active 
        UNIQUE (user_id, dorm_id) DEFERRABLE INITIALLY DEFERRED
);

COMMENT ON TABLE user_dorms IS '用户宿舍关联表，管理用户在宿舍中的成员关系';
COMMENT ON COLUMN user_dorms.id IS '关联记录唯一标识';
COMMENT ON COLUMN user_dorms.user_id IS '用户ID，外键关联users表';
COMMENT ON COLUMN user_dorms.dorm_id IS '宿舍ID，外键关联dorms表';
COMMENT ON COLUMN user_dorms.member_role IS '成员角色：admin-管理员，member-普通成员，viewer-查看者';
COMMENT ON COLUMN user_dorms.status IS '成员状态：active-活跃，inactive-已搬离，pending-待确认';
COMMENT ON COLUMN user_dorms.move_in_date IS '入住日期';
COMMENT ON COLUMN user_dorms.move_out_date IS '搬离日期';
COMMENT ON COLUMN user_dorms.bed_number IS '床位号';
COMMENT ON COLUMN user_dorms.room_number IS '房间号';
COMMENT ON COLUMN user_dorms.monthly_share IS '每月分摊费用';
COMMENT ON COLUMN user_dorms.deposit_paid IS '已缴押金';
COMMENT ON COLUMN user_dorms.last_payment_date IS '最后缴费日期';
COMMENT ON COLUMN user_dorms.can_approve_expenses IS '是否有权审批费用';
COMMENT ON COLUMN user_dorms.can_invite_members IS '是否有权邀请新成员';
COMMENT ON COLUMN user_dorms.can_manage_facilities IS '是否有权管理设施';
COMMENT ON COLUMN user_dorms.invited_by IS '邀请人用户ID';
COMMENT ON COLUMN user_dorms.invite_code IS '邀请码';
COMMENT ON COLUMN user_dorms.invite_expires_at IS '邀请码过期时间';

-- 4. 费用管理模块
-- ============================================================

-- 费用类别表
CREATE TABLE expense_categories (
    id SERIAL PRIMARY KEY,
    category_code VARCHAR(50) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    color_code VARCHAR(7), -- 十六进制颜色代码    icon_name VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE expense_categories IS '费用类别表，定义所有可用的费用分类';
COMMENT ON COLUMN expense_categories.id IS '类别唯一标识';
COMMENT ON COLUMN expense_categories.category_code IS '类别代码：accommodation-住宿费，utilities-水电网费，maintenance-维修费，cleaning-清洁费，other-其他';
COMMENT ON COLUMN expense_categories.category_name IS '类别显示名称';
COMMENT ON COLUMN expense_categories.description IS '类别描述';
COMMENT ON COLUMN expense_categories.color_code IS '前端显示颜色';
COMMENT ON COLUMN expense_categories.icon_name IS '图标名称';
COMMENT ON COLUMN expense_categories.is_active IS '是否启用';
COMMENT ON COLUMN expense_categories.sort_order IS '排序顺序';

-- 费用记录表
CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    category_id INTEGER NOT NULL,
    
    -- 详细信息
    description TEXT NOT NULL,
    receipt_url TEXT,
    receipt_filename VARCHAR(255),
    receipt_size BIGINT,
    receipt_mime_type VARCHAR(100),
    
    -- 申请信息
    applicant_id BIGINT NOT NULL,
    dorm_id INTEGER NOT NULL,
    payer_id BIGINT,
    
    -- 审批流程
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    priority VARCHAR(10) NOT NULL DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- 审批信息
    approved_by BIGINT,
    approved_at TIMESTAMP WITH TIME ZONE,
    review_comment TEXT,
    rejection_reason TEXT,
    
    -- 紧急情况
    is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
    urgent_reason TEXT,
    
    -- 付款信息
    payment_method VARCHAR(50),
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    -- 分摊信息
    split_equally BOOLEAN NOT NULL DEFAULT TRUE,
    split_details JSONB, -- 自定义分摊详情    
    -- 发票信息
    invoice_number VARCHAR(100),
    invoice_date DATE,
    vendor_name VARCHAR(200),
    vendor_tax_id VARCHAR(50),
    
    -- 标签和分类
    tags JSONB DEFAULT '[]',
    notes TEXT,
    
    -- 时间信息
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_expenses_category_id 
        FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_applicant_id 
        FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_dorm_id 
        FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_payer_id 
        FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_expenses_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE expenses IS '费用记录表，存储所有费用申请和审批信息';
COMMENT ON COLUMN expenses.id IS '费用记录唯一标识';
COMMENT ON COLUMN expenses.title IS '费用标题';
COMMENT ON COLUMN expenses.amount IS '费用金额';
COMMENT ON COLUMN expenses.category_id IS '费用类别ID，外键关联expense_categories表';
COMMENT ON COLUMN expenses.description IS '费用详细描述';
COMMENT ON COLUMN expenses.receipt_url IS '票据文件URL';
COMMENT ON COLUMN expenses.receipt_filename IS '票据文件名';
COMMENT ON COLUMN expenses.receipt_size IS '票据文件大小';
COMMENT ON COLUMN expenses.receipt_mime_type IS '票据文件类型';
COMMENT ON COLUMN expenses.applicant_id IS '申请人用户ID';
COMMENT ON COLUMN expenses.dorm_id IS '宿舍ID';
COMMENT ON COLUMN expenses.payer_id IS '实际支付人用户ID';
COMMENT ON COLUMN expenses.status IS '状态：pending-待审批，approved-已通过，rejected-已拒绝，cancelled-已取消';
COMMENT ON COLUMN expenses.priority IS '优先级：low-低，normal-普通，high-高，urgent-紧急';
COMMENT ON COLUMN expenses.approved_by IS '审批人用户ID';
COMMENT ON COLUMN expenses.approved_at IS '审批时间';
COMMENT ON COLUMN expenses.review_comment IS '审批意见';
COMMENT ON COLUMN expenses.rejection_reason IS '拒绝原因';
COMMENT ON COLUMN expenses.is_urgent IS '是否紧急费用';
COMMENT ON COLUMN expenses.urgent_reason IS '紧急原因说明';
COMMENT ON COLUMN expenses.payment_method IS '支付方式';
COMMENT ON COLUMN expenses.payment_date IS '支付日期';
COMMENT ON COLUMN expenses.payment_reference IS '支付参考号';
COMMENT ON COLUMN expenses.split_equally IS '是否平均分摊';
COMMENT ON COLUMN expenses.split_details IS '自定义分摊详情，JSON格式';
COMMENT ON COLUMN expenses.invoice_number IS '发票号码';
COMMENT ON COLUMN expenses.invoice_date IS '发票日期';
COMMENT ON COLUMN expenses.vendor_name IS '供应商名称';
COMMENT ON COLUMN expenses.vendor_tax_id IS '供应商税号';
COMMENT ON COLUMN expenses.tags IS '费用标签，JSON数组';
COMMENT ON COLUMN expenses.notes IS '备注信息';
COMMENT ON COLUMN expenses.expense_date IS '费用发生日期';

-- 费用分摊记录表
CREATE TABLE expense_splits (
    id BIGSERIAL PRIMARY KEY,
    expense_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    dorm_id INTEGER NOT NULL,
    
    -- 分摊信息
    split_amount DECIMAL(10,2) NOT NULL CHECK (split_amount >= 0),
    split_percentage DECIMAL(5,2) CHECK (split_percentage >= 0 AND split_percentage <= 100),
    
    -- 支付状态
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'overdue', 'waived')),
    paid_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (paid_amount >= 0),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- 提醒信息
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMP WITH TIME ZONE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_expense_splits_expense_id 
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_splits_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_splits_dorm_id 
        FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_expense_splits_expense_user 
        UNIQUE (expense_id, user_id),
    
    -- 检查约束
    CONSTRAINT expense_splits_amount_check 
        CHECK (paid_amount <= split_amount),
    CONSTRAINT expense_splits_percentage_check 
        CHECK (split_percentage IS NULL OR split_amount IS NULL OR 
               (split_percentage >= 0 AND split_percentage <= 100))
);

COMMENT ON TABLE expense_splits IS '费用分摊记录表，记录每个用户在每笔费用中的分摊金额和支付状态';
COMMENT ON COLUMN expense_splits.id IS '分摊记录唯一标识';
COMMENT ON COLUMN expense_splits.expense_id IS '费用记录ID，外键关联expenses表';
COMMENT ON COLUMN expense_splits.user_id IS '用户ID，外键关联users表';
COMMENT ON COLUMN expense_splits.dorm_id IS '宿舍ID，外键关联dorms表';
COMMENT ON COLUMN expense_splits.split_amount IS '分摊金额';
COMMENT ON COLUMN expense_splits.split_percentage IS '分摊百分比，0-100之间';
COMMENT ON COLUMN expense_splits.payment_status IS '支付状态：pending-待支付，paid-已支付，overdue-逾期，waived-已免除';
COMMENT ON COLUMN expense_splits.paid_amount IS '已支付金额';
COMMENT ON COLUMN expense_splits.paid_at IS '支付时间';
COMMENT ON COLUMN expense_splits.reminder_count IS '提醒次数';
COMMENT ON COLUMN expense_splits.last_reminder_at IS '最后提醒时间';

-- 5. 安全验证模块
-- ============================================================

-- 验证码表
CREATE TABLE verification_codes (
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

COMMENT ON TABLE verification_codes IS '验证码表，存储各种用途的验证码';
COMMENT ON COLUMN verification_codes.email IS '邮箱地址';
COMMENT ON COLUMN verification_codes.phone IS '手机号码';
COMMENT ON COLUMN verification_codes.code IS '6位数字验证码';
COMMENT ON COLUMN verification_codes.code_type IS '验证码类型';
COMMENT ON COLUMN verification_codes.expires_at IS '过期时间';
COMMENT ON COLUMN verification_codes.used_at IS '使用时间';

-- 两步验证表
CREATE TABLE two_factor_auth (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    backup_codes JSONB DEFAULT '[]',
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_two_factor_auth_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_two_factor_auth_user 
        UNIQUE (user_id)
);

COMMENT ON TABLE two_factor_auth IS '两步验证表，存储用户的两步验证配置';
COMMENT ON COLUMN two_factor_auth.secret_key IS 'TOTP密钥';
COMMENT ON COLUMN two_factor_auth.backup_codes IS '备用码数量';
COMMENT ON COLUMN two_factor_auth.is_enabled IS '是否启用两步验证';

-- 6. 系统监控模块
-- ============================================================

-- 性能监控表
CREATE TABLE performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 检查约束
    CONSTRAINT performance_metrics_value_check CHECK (metric_value >= 0)
);

COMMENT ON TABLE performance_metrics IS '性能监控表，记录系统性能指标';
COMMENT ON COLUMN performance_metrics.metric_name IS '指标名称';
COMMENT ON COLUMN performance_metrics.metric_value IS '指标数值';
COMMENT ON COLUMN performance_metrics.metric_unit IS '单位';
COMMENT ON COLUMN performance_metrics.tags IS '标签';

-- 审计日志表
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_audit_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE audit_logs IS '审计日志表，记录系统操作日志';
COMMENT ON COLUMN audit_logs.action IS '操作动作';
COMMENT ON COLUMN audit_logs.resource_type IS '资源类型';
COMMENT ON COLUMN audit_logs.resource_id IS '资源ID';
COMMENT ON COLUMN audit_logs.old_values IS '变更前值';
COMMENT ON COLUMN audit_logs.new_values IS '变更后值';

-- 7. 触发器定义
-- ============================================================

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间戳触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dorms_updated_at 
    BEFORE UPDATE ON dorms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dorms_updated_at 
    BEFORE UPDATE ON user_dorms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at 
    BEFORE UPDATE ON expense_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_splits_updated_at 
    BEFORE UPDATE ON expense_splits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 视图定义
-- ============================================================

-- 用户详细信息视图
CREATE VIEW user_details AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.nickname,
    u.phone,
    u.avatar_url,
    u.status,
    u.email_verified,
    u.phone_verified,
    u.last_login_at,
    u.created_at,
    ARRAY_AGG(r.role_name) as roles,
    ARRAY_AGG(d.dorm_name) as dorm_names
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_dorms ud ON u.id = ud.user_id AND ud.status = 'active'
LEFT JOIN dorms d ON ud.dorm_id = d.id
GROUP BY u.id, u.username, u.email, u.nickname, u.phone, u.avatar_url, 
         u.status, u.email_verified, u.phone_verified, u.last_login_at, u.created_at;

-- 费用汇总视图
CREATE VIEW expense_summary AS
SELECT 
    e.id,
    e.title,
    e.amount,
    ec.category_name,
    e.status,
    e.expense_date,
    u.nickname as applicant_name,
    d.dorm_name,
    COUNT(es.id) as split_count,
    SUM(es.split_amount) as total_split_amount,
    SUM(es.paid_amount) as total_paid_amount,
    e.created_at
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
JOIN users u ON e.applicant_id = u.id
JOIN dorms d ON e.dorm_id = d.id
LEFT JOIN expense_splits es ON e.id = es.expense_id
GROUP BY e.id, e.title, e.amount, ec.category_name, e.status, 
         e.expense_date, u.nickname, d.dorm_name, e.created_at;

-- 9. 索引设计
-- ============================================================

-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 角色表索引
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, is_active);

-- 会话表索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- 宿舍表索引
CREATE INDEX idx_user_dorms_user_id ON user_dorms(user_id);
CREATE INDEX idx_user_dorms_dorm_id ON user_dorms(dorm_id);
CREATE INDEX idx_user_dorms_status ON user_dorms(status);

-- 费用表索引
CREATE INDEX idx_expenses_applicant_id ON expenses(applicant_id);
CREATE INDEX idx_expenses_dorm_id ON expenses(dorm_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);

-- 分摊表索引
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX idx_expense_splits_dorm_id ON expense_splits(dorm_id);
CREATE INDEX idx_expense_splits_payment_status ON expense_splits(payment_status);

-- 验证码表索引
CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);

-- 审计日志索引
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- 10. 系统维护函数
-- ============================================================

-- 清理过期验证码函数
CREATE OR REPLACE FUNCTION clean_expired_verification_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM verification_codes 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO audit_logs (action, resource_type, new_values)
    VALUES ('CLEAN_EXPIRED_CODES', 'verification_codes', 
            json_build_object('deleted_count', deleted_count));
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 预算管理模块
-- ================================================

-- 预算表
CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    dorm_id BIGINT NOT NULL,
    category_id BIGINT,
    budget_name VARCHAR(100) NOT NULL,
    budget_amount DECIMAL(10,2) NOT NULL CHECK (budget_amount > 0),
    spent_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (budget_amount - spent_amount) STORED,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL CHECK (period_end > period_start),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_budgets_dorm_id FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
    CONSTRAINT fk_budgets_category_id FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL,
    
    -- 检查约束
    CONSTRAINT budget_amount_check CHECK (budget_amount > 0),
    CONSTRAINT spent_amount_check CHECK (spent_amount >= 0),
    CONSTRAINT budget_period_check CHECK (period_end > period_start),
    
    -- 唯一约束
    CONSTRAINT uk_budgets_dorm_category_period UNIQUE (dorm_id, category_id, period_start, period_end)
);

-- 预算预警表
CREATE TABLE budget_alerts (
    id BIGSERIAL PRIMARY KEY,
    budget_id BIGINT NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('warning', 'critical', 'exceeded')),
    threshold_percentage DECIMAL(5,2) NOT NULL CHECK (threshold_percentage >= 0 AND threshold_percentage <= 100),
    is_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_budget_alerts_budget_id FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE
);

-- ================================================
-- 支付管理模块
-- ================================================

-- 支付记录表
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    expense_id BIGINT,
    user_id BIGINT NOT NULL,
    dorm_id BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'alipay', 'wechat', 'credit_card', 'debit_card', 'other')),
    payment_amount DECIMAL(10,2) NOT NULL CHECK (payment_amount > 0),
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_id VARCHAR(255),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    reference_number VARCHAR(100),
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_payments_expense_id FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_dorm_id FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
    
    -- 检查约束
    CONSTRAINT payment_amount_check CHECK (payment_amount > 0)
);

-- 支付方式配置表
CREATE TABLE payment_methods (
    id BIGSERIAL PRIMARY KEY,
    method_code VARCHAR(20) NOT NULL UNIQUE,
    method_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    icon_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ================================================
-- 通知管理模块
-- ================================================

-- 通知表
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    dorm_id BIGINT,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('expense_added', 'payment_reminder', 'budget_alert', 'system_announcement', 'budget_exceeded', 'split_updated')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    action_url TEXT,
    metadata JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_dorm_id FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE SET NULL
);

-- 通知设置表
CREATE TABLE notification_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    expense_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    budget_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    payment_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    system_announcements BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_notification_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================
-- 统计分析模块
-- ================================================

-- 统计汇总表
CREATE TABLE statistics_summary (
    id BIGSERIAL PRIMARY KEY,
    dorm_id BIGINT NOT NULL,
    summary_date DATE NOT NULL,
    total_expenses DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_expenses >= 0),
    total_payments DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_payments >= 0),
    pending_payments DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (pending_payments >= 0),
    expense_count INTEGER NOT NULL DEFAULT 0 CHECK (expense_count >= 0),
    payment_count INTEGER NOT NULL DEFAULT 0 CHECK (payment_count >= 0),
    active_users INTEGER NOT NULL DEFAULT 0 CHECK (active_users >= 0),
    average_expense DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN expense_count > 0 THEN total_expenses / expense_count 
            ELSE 0 
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_statistics_summary_dorm_id FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_statistics_summary_dorm_date UNIQUE (dorm_id, summary_date),
    
    -- 检查约束
    CONSTRAINT statistics_amounts_check CHECK (total_expenses >= 0 AND total_payments >= 0 AND pending_payments >= 0),
    CONSTRAINT statistics_counts_check CHECK (expense_count >= 0 AND payment_count >= 0 AND active_users >= 0)
);

-- 月度统计表
CREATE TABLE monthly_statistics (
    id BIGSERIAL PRIMARY KEY,
    dorm_id BIGINT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    total_expenses DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_expenses >= 0),
    total_payments DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_payments >= 0),
    expense_count INTEGER NOT NULL DEFAULT 0 CHECK (expense_count >= 0),
    payment_count INTEGER NOT NULL DEFAULT 0 CHECK (payment_count >= 0),
    avg_daily_expense DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN expense_count > 0 THEN total_expenses / 
                (CASE 
                    WHEN month IN (1,3,5,7,8,10,12) THEN 31
                    WHEN month IN (4,6,9,11) THEN 30
                    WHEN month = 2 AND (year % 4 = 0 AND (year % 100 != 0 OR year % 400 = 0)) THEN 29
                    ELSE 28
                END)
            ELSE 0
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_monthly_statistics_dorm_id FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_monthly_statistics_dorm_year_month UNIQUE (dorm_id, year, month),
    
    -- 检查约束
    CONSTRAINT monthly_amounts_check CHECK (total_expenses >= 0 AND total_payments >= 0),
    CONSTRAINT monthly_counts_check CHECK (expense_count >= 0 AND payment_count >= 0)
);

-- ================================================
-- 触发器函数：自动更新统计信息
-- ================================================

-- 预算触发器函数
CREATE OR REPLACE FUNCTION update_budget_spent_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- 当添加或更新费用时，更新预算的已花费金额
    IF TG_OP = 'INSERT' THEN
        IF NEW.category_id IS NOT NULL THEN
            UPDATE budgets 
            SET spent_amount = spent_amount + NEW.amount,
                updated_at = NOW()
            WHERE dorm_id = NEW.dorm_id 
                AND category_id = NEW.category_id 
                AND period_start <= NEW.expense_date 
                AND period_end >= NEW.expense_date
                AND is_active = TRUE;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 恢复旧的预算金额
        IF OLD.category_id IS NOT NULL THEN
            UPDATE budgets 
            SET spent_amount = spent_amount - OLD.amount,
                updated_at = NOW()
            WHERE dorm_id = OLD.dorm_id 
                AND category_id = OLD.category_id 
                AND period_start <= OLD.expense_date 
                AND period_end >= OLD.expense_date
                AND is_active = TRUE;
        END IF;
        
        -- 添加新的预算金额
        IF NEW.category_id IS NOT NULL THEN
            UPDATE budgets 
            SET spent_amount = spent_amount + NEW.amount,
                updated_at = NOW()
            WHERE dorm_id = NEW.dorm_id 
                AND category_id = NEW.category_id 
                AND period_start <= NEW.expense_date 
                AND period_end >= NEW.expense_date
                AND is_active = TRUE;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.category_id IS NOT NULL THEN
            UPDATE budgets 
            SET spent_amount = spent_amount - OLD.amount,
                updated_at = NOW()
            WHERE dorm_id = OLD.dorm_id 
                AND category_id = OLD.category_id 
                AND period_start <= OLD.expense_date 
                AND period_end >= OLD.expense_date
                AND is_active = TRUE;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 统计信息触发器函数
CREATE OR REPLACE FUNCTION update_daily_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新日统计
    IF TG_OP = 'INSERT' THEN
        INSERT INTO statistics_summary (dorm_id, summary_date, total_expenses, expense_count)
        VALUES (NEW.dorm_id, NEW.expense_date::date, NEW.amount, 1)
        ON CONFLICT (dorm_id, summary_date) 
        DO UPDATE SET 
            total_expenses = statistics_summary.total_expenses + NEW.amount,
            expense_count = statistics_summary.expense_count + 1,
            updated_at = NOW();
    ELSIF TG_OP = 'UPDATE' THEN
        -- 更新日统计- 先减去旧值，再加上新值
        UPDATE statistics_summary 
        SET total_expenses = total_expenses - OLD.amount + NEW.amount,
            expense_count = expense_count,
            updated_at = NOW()
        WHERE dorm_id = NEW.dorm_id AND summary_date = NEW.expense_date::date;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE statistics_summary 
        SET total_expenses = total_expenses - OLD.amount,
            expense_count = expense_count - 1,
            updated_at = NOW()
        WHERE dorm_id = OLD.dorm_id AND summary_date = OLD.expense_date::date;
    END IF;
    
    -- 更新月统计
    IF TG_OP = 'INSERT' THEN
        INSERT INTO monthly_statistics (dorm_id, year, month, total_expenses, expense_count)
        VALUES (NEW.dorm_id, EXTRACT(YEAR FROM NEW.expense_date), EXTRACT(MONTH FROM NEW.expense_date), NEW.amount, 1)
        ON CONFLICT (dorm_id, year, month) 
        DO UPDATE SET 
            total_expenses = monthly_statistics.total_expenses + NEW.amount,
            expense_count = monthly_statistics.expense_count + 1,
            updated_at = NOW();
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE monthly_statistics 
        SET total_expenses = total_expenses - OLD.amount + NEW.amount,
            expense_count = expense_count,
            updated_at = NOW()
        WHERE dorm_id = NEW.dorm_id 
            AND year = EXTRACT(YEAR FROM NEW.expense_date)
            AND month = EXTRACT(MONTH FROM NEW.expense_date);
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE monthly_statistics 
        SET total_expenses = total_expenses - OLD.amount,
            expense_count = expense_count - 1,
            updated_at = NOW()
        WHERE dorm_id = OLD.dorm_id 
            AND year = EXTRACT(YEAR FROM OLD.expense_date)
            AND month = EXTRACT(MONTH FROM OLD.expense_date);
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 创建触发器
-- ================================================

-- 预算相关触发器
DROP TRIGGER IF EXISTS trigger_update_budget_spent_amount ON expenses;
CREATE TRIGGER trigger_update_budget_spent_amount
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_budget_spent_amount();

-- 统计信息触发器
DROP TRIGGER IF EXISTS trigger_update_daily_statistics ON expenses;
CREATE TRIGGER trigger_update_daily_statistics
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_daily_statistics();

-- 预算预警触发器函数
CREATE OR REPLACE FUNCTION check_budget_alerts()
RETURNS TRIGGER AS $$
DECLARE
    budget_record budgets%ROWTYPE;
    alert_percentage DECIMAL(5,2);
BEGIN
    -- 检查预算预警
    FOR budget_record IN 
        SELECT * FROM budgets 
        WHERE id = NEW.id AND is_active = TRUE
    LOOP
        alert_percentage := (budget_record.spent_amount / budget_record.budget_amount) * 100;
        
        -- 90%预警
        IF alert_percentage >= 90 AND alert_percentage < 100 THEN
            INSERT INTO budget_alerts (budget_id, alert_type, threshold_percentage, message)
            VALUES (budget_record.id, 'warning', 90, 
                format('预算 "%s" 已使用%s%%', budget_record.budget_name, alert_percentage::DECIMAL(5,2)));
        -- 100%预警
        ELSIF alert_percentage >= 100 THEN
            INSERT INTO budget_alerts (budget_id, alert_type, threshold_percentage, message)
            VALUES (budget_record.id, 'critical', 100, 
                format('预算 "%s" 已超过%s%%', budget_record.budget_name, (alert_percentage - 100)::DECIMAL(5,2)));
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_budget_alerts ON budgets;
CREATE TRIGGER trigger_check_budget_alerts
    AFTER UPDATE OF spent_amount ON budgets
    FOR EACH ROW EXECUTE FUNCTION check_budget_alerts();

-- ================================================
-- 创建索引
-- ================================================

-- 预算模块索引
CREATE INDEX idx_budgets_dorm_id ON budgets(dorm_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_period ON budgets(period_start, period_end);
CREATE INDEX idx_budgets_active ON budgets(is_active);

CREATE INDEX idx_budget_alerts_budget_id ON budget_alerts(budget_id);
CREATE INDEX idx_budget_alerts_triggered ON budget_alerts(is_triggered);

-- 支付管理模块索引
CREATE INDEX idx_payments_expense_id ON payments(expense_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_dorm_id ON payments(dorm_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_method ON payments(payment_method);

-- 通知管理模块索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_dorm_id ON notifications(dorm_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- 统计分析模块索引
CREATE INDEX idx_statistics_summary_dorm_date ON statistics_summary(dorm_id, summary_date);
CREATE INDEX idx_statistics_summary_date ON statistics_summary(summary_date);

CREATE INDEX idx_monthly_statistics_dorm_year_month ON monthly_statistics(dorm_id, year, month);
CREATE INDEX idx_monthly_statistics_year_month ON monthly_statistics(year, month);

-- 清理过期会话
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR status = 'expired';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 获取用户费用统计
CREATE OR REPLACE FUNCTION get_user_expense_stats(user_uuid BIGINT)
RETURNS TABLE(
    total_expenses DECIMAL(10,2),
    pending_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    overdue_amount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(es.split_amount), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN es.payment_status = 'pending' THEN es.split_amount - es.paid_amount END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN es.payment_status = 'paid' THEN es.paid_amount END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN es.payment_status = 'overdue' THEN es.split_amount - es.paid_amount END), 0) as overdue_amount
    FROM expense_splits es
    WHERE es.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 获取宿舍费用统计
CREATE OR REPLACE FUNCTION get_dorm_expense_stats(dorm_uuid INTEGER)
RETURNS TABLE(
    total_expenses DECIMAL(10,2),
    pending_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    member_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN e.status = 'pending' THEN e.amount END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN e.status = 'approved' THEN e.amount END), 0) as paid_amount,
        COUNT(DISTINCT ud.user_id) as member_count
    FROM dorms d
    LEFT JOIN expenses e ON d.id = e.dorm_id
    LEFT JOIN user_dorms ud ON d.id = ud.dorm_id AND ud.status = 'active'
    WHERE d.id = dorm_uuid
    GROUP BY d.id;
END;
$$ LANGUAGE plpgsql;

-- 11. 初始化数据
-- ============================================================

-- 插入基础角色
INSERT INTO roles (role_name, role_display_name, description, permissions, is_system_role) VALUES
('super_admin', '超级管理员', '系统超级管理员，拥有所有权限', '{"all": true}', true),
('admin', '管理员', '宿舍管理员，拥有管理权限', '{"users": ["read", "write"], "dorms": ["read", "write"], "expenses": ["read", "write", "approve"]}', true),
('member', '成员', '普通宿舍成员', '{"expenses": ["read", "write"], "profile": ["read", "write"]}', true),
('viewer', '查看者', '只能查看信息，无法修改', '{"expenses": ["read"], "profile": ["read"]}', true);

-- 插入基础费用类别
INSERT INTO expense_categories (category_code, category_name, description, color_code, icon_name, sort_order) VALUES
('accommodation', '住宿费', '房租、押金等住宿相关费用', '#FF6B6B', 'home', 1),
('utilities', '水电网费', '水费、电费、网费等公用事业费用', '#4ECDC4', 'zap', 2),
('maintenance', '维修费', '宿舍设施维修保养费用', '#45B7D1', 'wrench', 3),
('cleaning', '清洁费', '清洁用品和清洁服务费用', '#96CEB4', 'broom', 4),
('furniture', '家具费', '家具购买和维修费用', '#FFEAA7', 'chair', 5),
('security', '安保费', '门禁、安保等安全相关费用', '#DDA0DD', 'shield', 6),
('other', '其他费用', '其他杂项费用', '#BDC3C7', 'more-horizontal', 99);

-- 插入示例宿舍数据（可选）
-- INSERT INTO dorms (dorm_name, dorm_code, address, capacity, current_occupancy, monthly_rent, deposit, description) VALUES
-- ('阳光公寓A101', 'SUNNY-A101', '北京市朝阳区阳光路1号A101', 4, 3, 2500.00, 5000.00, '温馨舒适的四人间宿舍'),
-- ('海景公寓B205', 'SEA-B205', '上海市浦东新区海景路2号B205', 2, 2, 3200.00, 6000.00, '面朝大海的双人间宿舍');

-- 设置序列的当前值（如果需要）
SELECT setval('users_id_seq', 1000);
SELECT setval('roles_id_seq', 100);
SELECT setval('dorms_id_seq', 100);
SELECT setval('expense_categories_id_seq', 100);

-- 完成标记
DO $$
BEGIN
    RAISE NOTICE '记账宝数据库表结构创建完成！';
    RAISE NOTICE '已创建表: users, roles, user_roles, user_sessions, dorms, user_dorms, expense_categories, expenses, expense_splits, verification_codes, two_factor_auth, performance_metrics, audit_logs';
    RAISE NOTICE '已创建视图: user_details, expense_summary';
    RAISE NOTICE '已创建触发器: 更新时间戳触发器';
    RAISE NOTICE '已创建索引: 性能优化索引';
    RAISE NOTICE '已创建函数: 系统维护和统计函数';
    RAISE NOTICE '已插入初始化数据: 角色和费用类别';
END $$;
-- ============================================================

-- 验证码表
CREATE TABLE captcha_codes (
    id BIGSERIAL PRIMARY KEY,
    captcha_code VARCHAR(10) NOT NULL,
    image_data TEXT NOT NULL, -- base64编码的图片数据
    ip_address INET NOT NULL,
    session_id VARCHAR(255),
    
    -- 状态管理
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by BIGINT,
    
    -- 过期控制
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_captcha_codes_used_by 
        FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CONSTRAINT captcha_codes_expires CHECK (expires_at > created_at)
);

COMMENT ON TABLE captcha_codes IS '验证码表，存储图形验证码信息';
COMMENT ON COLUMN captcha_codes.id IS '验证码唯一标识';
COMMENT ON COLUMN captcha_codes.captcha_code IS '验证码答案';
COMMENT ON COLUMN captcha_codes.image_data IS '验证码图片数据，base64编码';
COMMENT ON COLUMN captcha_codes.ip_address IS '请求IP地址';
COMMENT ON COLUMN captcha_codes.session_id IS '会话标识';
COMMENT ON COLUMN captcha_codes.is_used IS '是否已使用';
COMMENT ON COLUMN captcha_codes.used_at IS '使用时间';
COMMENT ON COLUMN captcha_codes.used_by IS '使用用户ID';
COMMENT ON COLUMN captcha_codes.expires_at IS '过期时间';

-- 两步验证表
CREATE TABLE two_factor_codes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    code_type VARCHAR(20) NOT NULL 
        CHECK (code_type IN ('email', 'sms', 'totp')),
    code_hash VARCHAR(255) NOT NULL,
    code_length INTEGER NOT NULL DEFAULT 6,
    
    -- 使用状态
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- 验证限制
    verification_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    
    -- 过期控制
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_two_factor_codes_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 检查约束
    CONSTRAINT two_factor_codes_expires CHECK (expires_at > created_at),
    CONSTRAINT two_factor_codes_attempts CHECK (verification_attempts >= 0 AND max_attempts > 0)
);

COMMENT ON TABLE two_factor_codes IS '两步验证表，存储两步验证代码';
COMMENT ON COLUMN two_factor_codes.id IS '验证代码唯一标识';
COMMENT ON COLUMN two_factor_codes.user_id IS '用户ID';
COMMENT ON COLUMN two_factor_codes.code_type IS '验证类型：email-邮箱，sms-短信，totp-时间型动态码';
COMMENT ON COLUMN two_factor_codes.code_hash IS '验证码哈希值';
COMMENT ON COLUMN two_factor_codes.code_length IS '验证码长度';
COMMENT ON COLUMN two_factor_codes.is_used IS '是否已使用';
COMMENT ON COLUMN two_factor_codes.used_at IS '使用时间';
COMMENT ON COLUMN two_factor_codes.verification_attempts IS '验证尝试次数';
COMMENT ON COLUMN two_factor_codes.max_attempts IS '最大尝试次数';
COMMENT ON COLUMN two_factor_codes.expires_at IS '过期时间';

-- 6. 系统监控模块
-- ============================================================

-- 性能监控脚本
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
    query_text TEXT,
    total_calls BIGINT,
    total_time_ms DECIMAL,
    avg_time_ms DECIMAL,
    min_time_ms DECIMAL,
    max_time_ms DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        query,
        calls,
        total_time::DECIMAL,
        mean_time::DECIMAL,
        min_time::DECIMAL,
        max_time::DECIMAL
    FROM pg_stat_statements 
    WHERE mean_time >= min_duration_ms
    ORDER BY mean_time DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_slow_queries(INTEGER) IS '查询慢SQL语句，用于性能分析';

CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
    table_name TEXT,
    table_size TEXT,
    total_size TEXT,
    rows_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_database_size(current_database())) as total_size,
        n_tup_ins + n_tup_upd + n_tup_del as rows_count
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_table_sizes() IS '查询表大小统计信息';

CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE (
    total_connections INTEGER,
    active_connections INTEGER,
    idle_connections INTEGER,
    max_connections INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        setting::INTEGER as max_connections
    FROM pg_stat_activity
    GROUP BY setting;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_connection_stats() IS '查询数据库连接统计';

CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    usage_ratio DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        CASE 
            WHEN idx_scan = 0 THEN 0
            ELSE ROUND((idx_tup_read::DECIMAL / GREATEST(idx_scan, 1)), 4)
        END as usage_ratio
    FROM pg_stat_user_indexes
    ORDER BY usage_ratio ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_index_usage() IS '查询索引使用统计';

-- 监控视图
CREATE OR REPLACE VIEW system_health AS
SELECT 
    'database_uptime' as metric,
    EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time()))::BIGINT as value,
    'seconds' as unit,
    now() as timestamp
UNION ALL
SELECT 
    'total_connections',
    count(*)::BIGINT,
    'count',
    now()
FROM pg_stat_activity
UNION ALL
SELECT 
    'active_connections',
    count(*) FILTER (WHERE state = 'active')::BIGINT,
    'count',
    now()
FROM pg_stat_activity;

COMMENT ON VIEW system_health IS '系统健康状况监控视图';

-- 锁监控视图
CREATE OR REPLACE VIEW lock_monitor AS
SELECT 
    a.datname,
    l.relation::regclass,
    l.transactionid,
    l.mode,
    l.locktype,
    page,
    virtualxid,
    virtualtransaction,
    pid,
    a.usename,
    a.application_name,
    a.client_addr,
    a.client_port,
    a.query_start,
    a.query,
    state
FROM pg_stat_activity a
JOIN pg_locks l ON l.pid = a.pid
WHERE NOT a.query LIKE '%FROM pg_locks%'
ORDER BY relation::regclass;

COMMENT ON VIEW lock_monitor IS '数据库锁监控视图';

-- 长期事务监控
CREATE OR REPLACE VIEW long_transactions AS
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    now() - query_start as duration,
    query
FROM pg_stat_activity
WHERE state != 'idle' 
  AND query_start < now() - interval '10 minutes'
ORDER BY query_start;

COMMENT ON VIEW long_transactions IS '长时间运行的事务监控视图';

-- 表膨胀监控
CREATE OR REPLACE VIEW table_bloat AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as actual_data_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as bloat_size,
    ROUND(
        (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename))::DECIMAL 
        / GREATEST(pg_relation_size(schemaname||'.'||tablename), 1) * 100, 2
    ) as bloat_percentage
FROM pg_stat_user_tables
WHERE pg_total_relation_size(schemaname||'.'||tablename) > pg_relation_size(schemaname||'.'||tablename)
ORDER BY bloat_percentage DESC;

COMMENT ON VIEW table_bloat IS '表膨胀监控视图';

-- 7. 审计日志模块
-- ============================================================
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    severity VARCHAR(20) NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- 执行结果
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_audit_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE audit_logs IS '审计日志表，记录系统关键操作日志';
COMMENT ON COLUMN audit_logs.id IS '日志唯一标识';
COMMENT ON COLUMN audit_logs.user_id IS '操作用户ID';
COMMENT ON COLUMN audit_logs.action IS '操作类型，如login、create、update、delete';
COMMENT ON COLUMN audit_logs.resource_type IS '资源类型，如user、expense、dorm';
COMMENT ON COLUMN audit_logs.resource_id IS '资源ID';
COMMENT ON COLUMN audit_logs.old_values IS '操作前的数据，JSON格式';
COMMENT ON COLUMN audit_logs.new_values IS '操作后的数据，JSON格式';
COMMENT ON COLUMN audit_logs.ip_address IS '客户端IP地址';
COMMENT ON COLUMN audit_logs.user_agent IS '用户代理';
COMMENT ON COLUMN audit_logs.session_id IS '会话标识';
COMMENT ON COLUMN audit_logs.severity IS '日志级别';
COMMENT ON COLUMN audit_logs.success IS '操作是否成功';
COMMENT ON COLUMN audit_logs.error_message IS '错误信息';

-- 8. 触发器定义
-- ============================================================

-- 审计日志触发器函数
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            old_values,
            ip_address,
            user_agent
        ) VALUES (
            current_setting('app.user_id', TRUE)::BIGINT,
            TG_OP,
            TG_TABLE_NAME,
            OLD.id::VARCHAR,
            to_jsonb(OLD),
            current_setting('app.client_ip', TRUE)::INET,
            current_setting('app.user_agent', TRUE)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            old_values,
            new_values,
            ip_address,
            user_agent
        ) VALUES (
            current_setting('app.user_id', TRUE)::BIGINT,
            TG_OP,
            TG_TABLE_NAME,
            NEW.id::VARCHAR,
            to_jsonb(OLD),
            to_jsonb(NEW),
            current_setting('app.client_ip', TRUE)::INET,
            current_setting('app.user_agent', TRUE)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            new_values,
            ip_address,
            user_agent
        ) VALUES (
            current_setting('app.user_id', TRUE)::BIGINT,
            TG_OP,
            TG_TABLE_NAME,
            NEW.id::VARCHAR,
            to_jsonb(NEW),
            current_setting('app.client_ip', TRUE)::INET,
            current_setting('app.user_agent', TRUE)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_audit_event() IS '审计日志记录触发器函数';

-- 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS '自动更新updated_at字段的触发器函数';

-- 费用支付状态更新触发器
CREATE OR REPLACE FUNCTION update_expense_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(10,2);
    expense_amount DECIMAL(10,2);
BEGIN
    -- 获取费用总额
    SELECT amount INTO expense_amount
    FROM expenses
    WHERE id = NEW.expense_id;
    
    -- 计算该费用下所有分摊记录的已支付总额
    SELECT COALESCE(SUM(paid_amount), 0) INTO total_paid
    FROM expense_splits
    WHERE expense_id = NEW.expense_id;
    
    -- 如果所有分摊记录都已支付，则更新费用记录状态
    IF total_paid >= expense_amount THEN
        UPDATE expenses
        SET status = 'paid',
            payment_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = NEW.expense_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_expense_payment_status() IS '更新费用支付状态的触发器函数';

-- 用户信用分更新触发器
CREATE OR REPLACE FUNCTION update_user_credit_score()
RETURNS TRIGGER AS $$
BEGIN
    -- 这里可以实现用户信用分计算逻辑
    -- 例如：按时缴费加分，逾期缴费减分
    -- 目前为示例实现
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_credit_score() IS '用户信用分更新触发器函数';

-- 9. 视图定义
-- ============================================================

-- 用户费用明细视图
CREATE OR REPLACE VIEW user_expense_details AS
SELECT 
    u.id as user_id,
    u.username,
    u.nickname,
    d.dorm_name,
    d.dorm_code,
    e.id as expense_id,
    e.title,
    e.amount,
    e.expense_date,
    e.status as expense_status,
    ec.category_name,
    es.split_amount,
    es.payment_status,
    es.paid_amount,
    es.paid_at,
    (es.split_amount - COALESCE(es.paid_amount, 0)) as pending_amount
FROM users u
JOIN user_dorms ud ON u.id = ud.user_id
JOIN dorms d ON ud.dorm_id = d.id
JOIN expense_splits es ON u.id = es.user_id
JOIN expenses e ON es.expense_id = e.id
JOIN expense_categories ec ON e.category_id = ec.id
WHERE ud.status = 'active'
ORDER BY e.expense_date DESC;

COMMENT ON VIEW user_expense_details IS '用户费用明细视图';

-- 宿舍费用月度统计视图
CREATE OR REPLACE VIEW dorm_monthly_expenses AS
SELECT 
    d.id as dorm_id,
    d.dorm_name,
    d.dorm_code,
    DATE_TRUNC('month', e.expense_date) as month,
    COUNT(e.id) as expense_count,
    SUM(e.amount) as total_amount,
    COUNT(e.id) FILTER (WHERE e.status = 'approved') as approved_count,
    SUM(e.amount) FILTER (WHERE e.status = 'approved') as approved_amount,
    COUNT(e.id) FILTER (WHERE e.status = 'pending') as pending_count,
    SUM(e.amount) FILTER (WHERE e.status = 'pending') as pending_amount
FROM dorms d
LEFT JOIN expenses e ON d.id = e.dorm_id
GROUP BY d.id, d.dorm_name, d.dorm_code, DATE_TRUNC('month', e.expense_date)
ORDER BY d.dorm_name, month DESC;

COMMENT ON VIEW dorm_monthly_expenses IS '宿舍费用月度统计视图';

-- 用户活跃度统计视图CREATE OR REPLACE FUNCTION get_user_activity_stats(
    p_user_id BIGINT DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    user_id BIGINT,
    username VARCHAR,
    total_expenses INTEGER,
    total_amount DECIMAL,
    approved_expenses INTEGER,
    pending_expenses INTEGER,
    avg_expense_amount DECIMAL,
    last_activity_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        COALESCE(e_stats.total_expenses, 0),
        COALESCE(e_stats.total_amount, 0),
        COALESCE(e_stats.approved_expenses, 0),
        COALESCE(e_stats.pending_expenses, 0),
        COALESCE(e_stats.avg_expense_amount, 0),
        COALESCE(e_stats.last_activity, NOW())
    FROM users u
    LEFT JOIN (
        SELECT 
            applicant_id,
            COUNT(*) as total_expenses,
            SUM(amount) as total_amount,
            COUNT(*) FILTER (WHERE status = 'approved') as approved_expenses,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_expenses,
            AVG(amount) as avg_expense_amount,
            MAX(created_at) as last_activity
        FROM expenses
        WHERE (p_user_id IS NULL OR applicant_id = p_user_id)
          AND created_at >= NOW() - INTERVAL '1 day' * p_days
        GROUP BY applicant_id
    ) e_stats ON u.id = e_stats.applicant_id
    WHERE (p_user_id IS NULL OR u.id = p_user_id)
      AND u.status = 'active';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_activity_stats(BIGINT, INTEGER) IS '用户活跃度统计函数';

-- 费用趋势分析视图
CREATE OR REPLACE FUNCTION analyze_expense_trends(
    p_dorm_id INTEGER DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_group_by VARCHAR(20) DEFAULT 'month'
)
RETURNS TABLE (
    period VARCHAR,
    dorm_name VARCHAR,
    expense_count BIGINT,
    total_amount DECIMAL,
    avg_amount DECIMAL,
    category_breakdown JSONB
) AS $$
DECLARE
    group_interval VARCHAR;
BEGIN
    -- 设置分组间隔
    CASE p_group_by
        WHEN 'day' THEN group_interval := 'day';
        WHEN 'week' THEN group_interval := 'week';
        WHEN 'month' THEN group_interval := 'month';
        WHEN 'quarter' THEN group_interval := 'quarter';
        WHEN 'year' THEN group_interval := 'year';
        ELSE group_interval := 'month';
    END CASE;
    
    RETURN QUERY
    WITH expense_trends AS (
        SELECT 
            DATE_TRUNC(group_interval, e.expense_date) as period,
            d.dorm_name,
            e.id,
            e.amount,
            ec.category_name,
            ROW_NUMBER() OVER (PARTITION BY DATE_TRUNC(group_interval, e.expense_date), d.id, ec.id ORDER BY e.created_at) as rn
        FROM expenses e
        JOIN dorms d ON e.dorm_id = d.id
        JOIN expense_categories ec ON e.category_id = ec.id
        WHERE (p_dorm_id IS NULL OR e.dorm_id = p_dorm_id)
          AND (p_start_date IS NULL OR e.expense_date >= p_start_date)
          AND (p_end_date IS NULL OR e.expense_date <= p_end_date)
          AND e.status = 'approved'
    ),
    category_summary AS (
        SELECT 
            period,
            dorm_name,
            jsonb_agg(
                jsonb_build_object(
                    'category_name', category_name,
                    'amount', amount
                )
            ) as category_breakdown
        FROM expense_trends
        GROUP BY period, dorm_name
    )
    SELECT 
        TO_CHAR(et.period, 'YYYY-MM-DD') as period,
        et.dorm_name,
        COUNT(et.id) as expense_count,
        SUM(et.amount) as total_amount,
        AVG(et.amount) as avg_amount,
        cs.category_breakdown
    FROM expense_trends et
    JOIN category_summary cs ON et.period = cs.period AND et.dorm_name = cs.dorm_name
    GROUP BY et.period, et.dorm_name, cs.category_breakdown
    ORDER BY et.period DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION analyze_expense_trends(INTEGER, DATE, DATE, VARCHAR) IS '费用趋势分析函数';

-- 10. 索引设计
-- ============================================================

-- 用户认证相关索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- 用户角色关联索引
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, is_active);

-- 用户会话索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);

-- 宿舍管理索引
CREATE INDEX idx_dorms_status ON dorms(status);
CREATE INDEX idx_dorms_admin_id ON dorms(admin_id);
CREATE INDEX idx_dorms_code ON dorms(dorm_code);

-- 用户宿舍关联索引
CREATE INDEX idx_user_dorms_user_id ON user_dorms(user_id);
CREATE INDEX idx_user_dorms_dorm_id ON user_dorms(dorm_id);
CREATE INDEX idx_user_dorms_status ON user_dorms(status);
CREATE INDEX idx_user_dorms_active ON user_dorms(user_id, dorm_id, status);

-- 费用管理索引
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_applicant_id ON expenses(applicant_id);
CREATE INDEX idx_expenses_dorm_id ON expenses(dorm_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_priority ON expenses(priority);
CREATE INDEX idx_expenses_amount ON expenses(amount);

-- 费用分摊索引
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX idx_expense_splits_payment_status ON expense_splits(payment_status);
CREATE INDEX idx_expense_splits_dorm_id ON expense_splits(dorm_id);

-- 安全验证索引
CREATE INDEX idx_captcha_codes_expires ON captcha_codes(expires_at);
CREATE INDEX idx_captcha_codes_ip ON captcha_codes(ip_address);
CREATE INDEX idx_two_factor_codes_user_id ON two_factor_codes(user_id);
CREATE INDEX idx_two_factor_codes_expires ON two_factor_codes(expires_at);

-- 审计日志索引
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- 复合索引优化
CREATE INDEX idx_expenses_dorm_status_date ON expenses(dorm_id, status, expense_date);
CREATE INDEX idx_expense_splits_user_status ON expense_splits(user_id, payment_status);
CREATE INDEX idx_user_dorms_dorm_status ON user_dorms(dorm_id, status);

-- 11. 触发器创建
-- ============================================================

-- 为主要表创建更新时间戳触发器
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_dorms_updated_at
    BEFORE UPDATE ON dorms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_dorms_updated_at
    BEFORE UPDATE ON user_dorms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_expense_splits_updated_at
    BEFORE UPDATE ON expense_splits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 审计日志触发器
CREATE TRIGGER trigger_users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER trigger_expenses_audit
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER trigger_expense_splits_audit
    AFTER INSERT OR UPDATE OR DELETE ON expense_splits
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_event();

-- 费用支付状态更新触发器
CREATE TRIGGER trigger_update_expense_payment_status
    AFTER INSERT OR UPDATE ON expense_splits
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_payment_status();

-- 12. 系统维护函数
-- ============================================================

-- 索引维护函数
CREATE OR REPLACE FUNCTION maintain_indexes()
RETURNS TEXT AS $$
DECLARE
    index_name TEXT;
    result TEXT := '';
BEGIN
    -- 重建所有索引
    FOR index_name IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
          AND indexname NOT LIKE '%_pkey'
    LOOP
        EXECUTE 'REINDEX INDEX ' || index_name;
        result := result || index_name || ' ';
    END LOOP;
    
    RETURN 'Reindexed indexes: ' || result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION maintain_indexes() IS '索引维护函数，重建所有索引';

-- 清理过期数据函数
CREATE OR REPLACE FUNCTION cleanup_old_data(
    retention_days INTEGER DEFAULT 90
)
RETURNS TEXT AS $$
DECLARE
    cutoff_date TIMESTAMP WITH TIME ZONE;
    result TEXT := '';
BEGIN
    cutoff_date := NOW() - INTERVAL '1 day' * retention_days;
    
    -- 清理过期的验证码
    DELETE FROM captcha_codes WHERE expires_at < cutoff_date;
    result := result || 'Cleaned expired captcha codes. ';
    
    -- 清理过期的两步验证代码
    DELETE FROM two_factor_codes WHERE expires_at < cutoff_date;
    result := result || 'Cleaned expired 2FA codes. ';
    
    -- 清理旧的审计日志
    DELETE FROM audit_logs WHERE created_at < cutoff_date;
    result := result || 'Cleaned old audit logs. ';
    
    -- 清理过期的会话    DELETE FROM user_sessions WHERE expires_at < cutoff_date OR status = 'expired';
    result := result || 'Cleaned expired sessions. ';
    
    RETURN 'Cleanup completed: ' || result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_data(INTEGER) IS '清理过期数据函数';

-- 统计信息更新函数
CREATE OR REPLACE FUNCTION update_statistics()
RETURNS TEXT AS $$
BEGIN
    -- 更新表统计信息
    ANALYZE;
    
    -- 更新查询规划器统计信息
    PERFORM pg_stat_reset();
    
    RETURN 'Statistics updated successfully';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_statistics() IS '更新数据库统计信息函数';

-- ============================================================
-- 脚本执行完成
-- ============================================================

-- 输出完成信息
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '记账宝系统数据库初始化完成！';
    RAISE NOTICE '数据库版本: PostgreSQL 18';
    RAISE NOTICE '执行时间: %', NOW();
    RAISE NOTICE '========================================';
END $$;
-- ============================================================
-- 数据库创建完成
-- ============================================================


-- 性能监控脚本
-- 1. 慢查询监控
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    rows BIGINT,
    last_executed TIMESTAMP
) AS $$
BEGIN
    -- 需要启用 pg_stat_statements 扩展
    RETURN QUERY
    SELECT 
        query::TEXT,
        calls,
        total_time,
        mean_time,
        rows,
        NOW() as last_executed
    FROM pg_stat_statements 
    WHERE mean_time * 1000 > min_duration_ms
    ORDER BY mean_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_slow_queries IS '获取执行时间超过指定阈值的慢查询';

-- 2. 表空间使用监控
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
    table_name VARCHAR,
    row_count BIGINT,
    total_size TEXT,
    table_size TEXT,
    index_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || tablename as table_name,
        n_live_tup::BIGINT as row_count,
        pg_size_pretty(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))) as total_size,
        pg_size_pretty(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))) as table_size,
        pg_size_pretty(pg_indexes_size(quote_ident(schemaname) || '.' || quote_ident(tablename))) as index_size
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 数据库连接监控
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE (
    state TEXT,
    count INTEGER,
    database_name NAME,
    user_name NAME,
    client_addr INET,
    query_start TIMESTAMP,
    query TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        state,
        COUNT(*) OVER (PARTITION BY state) as count,
        datname as database_name,
        usename as user_name,
        client_addr,
        query_start,
        query
    FROM pg_stat_activity 
    WHERE datname = current_database()
    ORDER BY state, query_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 索引使用情况监控
CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    last_vacuum TIMESTAMP,
    last_autovacuum TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || relname as table_name,
        indexrelname as index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        last_vacuum,
        last_autovacuum
    FROM pg_stat_user_indexes 
    JOIN pg_stat_user_tables ON pg_stat_user_indexes.relid = pg_stat_user_tables.relid
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




-- 创建监控视图
-- 1. 系统健康状态视图
CREATE VIEW system_health AS
SELECT 
    NOW() as check_time,
    (SELECT setting FROM pg_settings WHERE name = 'server_version') as postgres_version,
    (SELECT setting FROM pg_settings WHERE name = 'max_connections')::INTEGER as max_connections,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    (SELECT COUNT(*) FROM pg_stat_user_tables) as table_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as index_count;

-- 2. 锁监控视图
CREATE VIEW lock_monitor AS
SELECT 
    NOW() as check_time,
    locktype,
    mode,
    granted,
    pid,
    usename,
    application_name,
    client_addr,
    query_start,
    query
FROM pg_locks l
LEFT JOIN pg_stat_activity a ON l.pid = a.pid
WHERE a.datname = current_database()
ORDER BY query_start DESC;

-- 3. 长期运行事务监控
CREATE VIEW long_running_transactions AS
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    xact_start,
    NOW() - xact_start as duration,
    state,
    query
FROM pg_stat_activity
WHERE datname = current_database() 
    AND xact_start IS NOT NULL 
    AND state <> 'idle'
    AND NOW() - xact_start > interval '5 minutes'
ORDER BY duration DESC;

-- 4. 表膨胀监控
CREATE VIEW table_bloat AS
SELECT
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    ROUND((n_dead_tup::FLOAT / GREATEST(n_live_tup + n_dead_tup, 1) * 100), 2) as dead_tuple_percentage,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_tuple_percentage DESC;



-- 自动审计日志触发器


-- 审计日志触发器函数
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            table_name, record_id, operation, new_data, changed_by
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), 
            current_setting('app.user_id', TRUE)::BIGINT
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            table_name, record_id, operation, old_data, new_data, changed_by
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW),
            current_setting('app.user_id', TRUE)::BIGINT
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            table_name, record_id, operation, old_data, changed_by
        ) VALUES (
            TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD),
            current_setting('app.user_id', TRUE)::BIGINT
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 费用支付状态自动更新触发器
CREATE OR REPLACE FUNCTION update_expense_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_splits DECIMAL(10,2);
    paid_splits DECIMAL(10,2);
    expense_amount DECIMAL(10,2);
    new_payment_status VARCHAR(20);
BEGIN
    -- 获取费用总金额和分摊情况
    SELECT amount INTO expense_amount FROM expenses WHERE id = NEW.expense_id;
    
    SELECT 
        SUM(split_amount),
        SUM(paid_amount)
    INTO 
        total_splits,
        paid_splits
    FROM expense_splits 
    WHERE expense_id = NEW.expense_id;
    
    -- 确定新的支付状态
    IF paid_splits >= expense_amount THEN
        new_payment_status := 'fully_paid';
    ELSIF paid_splits > 0 THEN
        new_payment_status := 'partially_paid';
    ELSE
        new_payment_status := 'unpaid';
    END IF;
    
    -- 更新费用记录的支付状态（如果存在该字段）
    -- 注意：需要先在expenses表中添加payment_status字段
    -- ALTER TABLE expenses ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid';
    
    UPDATE expenses 
    SET payment_status = new_payment_status,
        updated_at = NOW()
    WHERE id = NEW.expense_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_expense_payment_status
    AFTER INSERT OR UPDATE ON expense_splits
    FOR EACH ROW EXECUTE FUNCTION update_expense_payment_status();

-- 3. 用户信用评分触发器
CREATE OR REPLACE FUNCTION update_user_credit_score()
RETURNS TRIGGER AS $$
DECLARE
    overdue_count INTEGER;
    total_expenses DECIMAL(10,2);
    paid_on_time DECIMAL(10,2);
    credit_score INTEGER;
BEGIN
    -- 计算逾期付款次数
    SELECT COUNT(*) INTO overdue_count
    FROM expense_splits 
    WHERE user_id = NEW.user_id 
        AND payment_status = 'overdue'
        AND paid_at IS NULL;
    
    -- 计算总费用和按时支付金额
    SELECT 
        COALESCE(SUM(split_amount), 0),
        COALESCE(SUM(CASE 
            WHEN paid_at <= (created_at + INTERVAL '30 days') 
            THEN split_amount ELSE 0 
        END), 0)
    INTO 
        total_expenses,
        paid_on_time
    FROM expense_splits 
    WHERE user_id = NEW.user_id;
    
    -- 计算信用评分（简化版本）
    IF total_expenses > 0 THEN
        credit_score := LEAST(100, GREATEST(0, 
            ROUND((paid_on_time / total_expenses) * 100 - (overdue_count * 10))
        ));
    ELSE
        credit_score := 100; -- 新用户默认满分
    END IF;
    
    -- 更新用户信用评分（需要先在users表添加credit_score字段）
    -- ALTER TABLE users ADD COLUMN credit_score INTEGER DEFAULT 100;
    
    UPDATE users 
    SET credit_score = credit_score,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_user_credit_score
    AFTER INSERT OR UPDATE ON expense_splits
    FOR EACH ROW EXECUTE FUNCTION update_user_credit_score();



    -- 1. 用户费用明细视图
CREATE VIEW user_expense_details AS
SELECT 
    u.id as user_id,
    u.username,
    u.nickname,
    d.dorm_name,
    es.expense_id,
    e.title,
    e.amount as total_amount,
    es.split_amount as user_share,
    es.paid_amount,
    es.payment_status,
    e.expense_date,
    ec.category_name,
    e.status as expense_status,
    CASE 
        WHEN es.paid_amount >= es.split_amount THEN '已结清'
        WHEN es.paid_amount > 0 THEN '部分支付'
        WHEN es.payment_status = 'overdue' THEN '逾期'
        ELSE '待支付'
    END as payment_display_status
FROM users u
JOIN expense_splits es ON u.id = es.user_id
JOIN expenses e ON es.expense_id = e.id
JOIN dorms d ON e.dorm_id = d.id
JOIN expense_categories ec ON e.category_id = ec.id
WHERE u.status = 'active';

COMMENT ON VIEW user_expense_details IS '用户费用明细视图，显示每个用户的费用分摊详情';

-- 2. 宿舍费用月度统计视图
CREATE VIEW dorm_monthly_expenses AS
SELECT 
    d.id as dorm_id,
    d.dorm_name,
    DATE_TRUNC('month', e.expense_date) as month,
    ec.category_name,
    COUNT(e.id) as expense_count,
    SUM(e.amount) as total_amount,
    AVG(e.amount) as average_amount,
    MIN(e.amount) as min_amount,
    MAX(e.amount) as max_amount,
    SUM(CASE WHEN e.status = 'approved' THEN e.amount ELSE 0 END) as approved_amount,
    SUM(CASE WHEN e.status = 'pending' THEN e.amount ELSE 0 END) as pending_amount
FROM dorms d
LEFT JOIN expenses e ON d.id = e.dorm_id
LEFT JOIN expense_categories ec ON e.category_id = ec.id
GROUP BY d.id, d.dorm_name, DATE_TRUNC('month', e.expense_date), ec.category_name
ORDER BY d.dorm_name, month DESC, ec.category_name;

-- 3. 用户活跃度统计函数
CREATE OR REPLACE FUNCTION get_user_activity_stats(
    p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    user_id BIGINT,
    username VARCHAR,
    login_count INTEGER,
    last_login TIMESTAMP,
    expense_created_count INTEGER,
    expense_approved_count INTEGER,
    expense_amount DECIMAL(10,2),
    payment_count INTEGER,
    payment_amount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        COALESCE(login_stats.login_count, 0) as login_count,
        login_stats.last_login,
        COALESCE(expense_stats.created_count, 0) as expense_created_count,
        COALESCE(expense_stats.approved_count, 0) as expense_approved_count,
        COALESCE(expense_stats.total_amount, 0) as expense_amount,
        COALESCE(payment_stats.payment_count, 0) as payment_count,
        COALESCE(payment_stats.payment_amount, 0) as payment_amount
    FROM users u
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) as login_count,
            MAX(last_accessed_at) as last_login
        FROM user_sessions
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY user_id
    ) login_stats ON u.id = login_stats.user_id
    LEFT JOIN (
        SELECT 
            applicant_id as user_id,
            COUNT(*) as created_count,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
            SUM(amount) as total_amount
        FROM expenses
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY applicant_id
    ) expense_stats ON u.id = expense_stats.user_id
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) as payment_count,
            SUM(paid_amount) as payment_amount
        FROM expense_splits
        WHERE paid_at BETWEEN p_start_date AND p_end_date
        GROUP BY user_id
    ) payment_stats ON u.id = payment_stats.user_id
    WHERE u.status = 'active'
    ORDER BY login_count DESC, expense_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 费用趋势分析函数
CREATE OR REPLACE FUNCTION analyze_expense_trends(
    p_dorm_id INTEGER DEFAULT NULL,
    p_category_id INTEGER DEFAULT NULL,
    p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
    period DATE,
    category_name VARCHAR,
    expense_count INTEGER,
    total_amount DECIMAL(10,2),
    avg_amount DECIMAL(10,2),
    month_over_month_change DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_stats AS (
        SELECT 
            DATE_TRUNC('month', expense_date) as month_start,
            ec.category_name,
            COUNT(*) as expense_count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount
        FROM expenses e
        JOIN expense_categories ec ON e.category_id = ec.id
        WHERE 
            (p_dorm_id IS NULL OR e.dorm_id = p_dorm_id)
            AND (p_category_id IS NULL OR e.category_id = p_category_id)
            AND e.expense_date >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)
            AND e.status = 'approved'
        GROUP BY DATE_TRUNC('month', expense_date), ec.category_name
    )
    SELECT 
        month_start::DATE as period,
        category_name,
        expense_count,
        total_amount,
        avg_amount,
        ROUND(
            ((total_amount - LAG(total_amount) OVER (PARTITION BY category_name ORDER BY month_start))   
            / NULLIF(LAG(total_amount) OVER (PARTITION BY category_name ORDER BY month_start), 0)) * 100, 2) as month_over_month_change
    FROM monthly_stats
    ORDER BY category_name, month_start DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



