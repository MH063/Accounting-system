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
    real_name VARCHAR(100),
    phone VARCHAR(30),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    birthday DATE,
    id_card_number VARCHAR(18),
    avatar_url TEXT,
    
    -- 账户状态
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'pending', 'banned')),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 两步验证
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    two_factor_backup_codes JSONB,
    
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
    CONSTRAINT users_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT users_id_card_format CHECK (id_card_number IS NULL OR id_card_number ~* '^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$')
);

COMMENT ON TABLE users IS '用户基础信息表，存储所有用户的基本认证和资料信息';
COMMENT ON COLUMN users.id IS '用户唯一标识，主键';
COMMENT ON COLUMN users.username IS '用户名，唯一，用于登录';
COMMENT ON COLUMN users.email IS '邮箱地址，唯一，用于登录和通知';
COMMENT ON COLUMN users.password_hash IS '密码哈希值，使用bcrypt等安全算法';
COMMENT ON COLUMN users.nickname IS '用户昵称，用于显示';
COMMENT ON COLUMN users.real_name IS '用户真实姓名';
COMMENT ON COLUMN users.phone IS '手机号码，可选，用于验证';
COMMENT ON COLUMN users.gender IS '性别：male-男，female-女，other-其他';
COMMENT ON COLUMN users.birthday IS '生日';
COMMENT ON COLUMN users.id_card_number IS '身份证号码';
COMMENT ON COLUMN users.avatar_url IS '头像URL地址';
COMMENT ON COLUMN users.status IS '账户状态：active-活跃，inactive-未激活，pending-待审核，banned-已禁用';
COMMENT ON COLUMN users.email_verified IS '邮箱是否已验证';
COMMENT ON COLUMN users.phone_verified IS '手机是否已验证';
COMMENT ON COLUMN users.two_factor_enabled IS '是否启用两步验证';
COMMENT ON COLUMN users.two_factor_secret IS '两步验证密钥';
COMMENT ON COLUMN users.two_factor_backup_codes IS '两步验证备用码';
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

-- =====================================================
-- 2. 用户角色管理模块
-- ============================================================

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
    
    -- 检查约束
    CONSTRAINT user_roles_validity CHECK (expires_at IS NULL OR expires_at > assigned_at)
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
    
    -- 在线真实性检测相关字段
    online_score INTEGER DEFAULT 0,              -- 在线真实性得分 (0-100) 
    heartbeat_count INTEGER DEFAULT 0,           -- 有效心跳累计次数 
    interaction_count INTEGER DEFAULT 0,         -- 交互行为累计次数（点击、滚动等） 
    business_request_count INTEGER DEFAULT 0,    -- 有效业务请求累计次数 
    last_heartbeat_at TIMESTAMP WITH TIME ZONE,  -- 最后一次心跳时间 
    device_fingerprint VARCHAR(255),             -- 设备唯一指纹 
    behavior_data JSONB DEFAULT '{}'::jsonb,     -- 存储复杂的行为特征（如心跳间隔序列）
    client_metrics JSONB DEFAULT '{}'::jsonb,    -- 客户端性能指标 (FPS, 内存等)
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_user_sessions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 检查约束
    CONSTRAINT user_sessions_expires CHECK (expires_at > created_at)
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
COMMENT ON COLUMN user_sessions.online_score IS '在线真实性得分 (0-100)'; 
COMMENT ON COLUMN user_sessions.heartbeat_count IS '有效心跳累计次数'; 
COMMENT ON COLUMN user_sessions.interaction_count IS '交互行为累计次数'; 
COMMENT ON COLUMN user_sessions.business_request_count IS '有效业务请求累计次数'; 
COMMENT ON COLUMN user_sessions.last_heartbeat_at IS '最后一次心跳时间'; 
COMMENT ON COLUMN user_sessions.device_fingerprint IS '设备唯一指纹'; 
COMMENT ON COLUMN user_sessions.behavior_data IS '存储复杂的行为特征数据'; 
COMMENT ON COLUMN user_sessions.client_metrics IS '客户端上报的性能指标';
COMMENT ON COLUMN user_sessions.updated_at IS '记录更新时间'; 

-- 创建触发器以自动更新 updated_at 
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$ 
BEGIN 
    NEW.updated_at = NOW(); 
    RETURN NEW; 
END; 
$$ language 'plpgsql'; 

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 3. 宿舍管理模块
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
    
    -- 宿舍类型和配置
    type VARCHAR(20) NOT NULL DEFAULT 'standard'
        CHECK (type IN ('single', 'double', 'quad', 'apartment', 'standard')),
    area DECIMAL(8,2), -- 面积（平方米）
    gender_limit VARCHAR(10) CHECK (gender_limit IN ('male', 'female', 'mixed')),
    
    -- 费用配置
    monthly_rent DECIMAL(15,2) DEFAULT 0.00,
    deposit DECIMAL(15,2) DEFAULT 0.00,
    utility_included BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 联系方式
    contact_person VARCHAR(100),
    contact_phone VARCHAR(30),
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
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 检查约束
    CONSTRAINT dorms_occupancy_check CHECK (current_occupancy <= capacity),
    CONSTRAINT dorms_rent_positive CHECK (monthly_rent >= 0),
    CONSTRAINT dorms_deposit_positive CHECK (deposit >= 0),
    CONSTRAINT dorms_area_positive CHECK (area IS NULL OR area > 0),
    
    -- 外键约束
    CONSTRAINT fk_dorms_admin_id 
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
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
COMMENT ON COLUMN dorms.type IS '宿舍类型：single-单人间，double-双人间，quad-四人间，apartment-公寓，standard-标准间';
COMMENT ON COLUMN dorms.area IS '宿舍面积（平方米）';
COMMENT ON COLUMN dorms.gender_limit IS '性别限制：male-仅限男性，female-仅限女性，mixed-混合';
COMMENT ON COLUMN dorms.monthly_rent IS '月租金';
COMMENT ON COLUMN dorms.deposit IS '押金金额';
COMMENT ON COLUMN dorms.utility_included IS '水电网费是否包含在租金中';
COMMENT ON COLUMN dorms.contact_person IS '宿舍联系人';
COMMENT ON COLUMN dorms.contact_phone IS '联系电话';
COMMENT ON COLUMN dorms.contact_email IS '联系邮箱';
COMMENT ON COLUMN dorms.building IS '建筑物名称';
COMMENT ON COLUMN dorms.floor IS '楼层号';
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
    monthly_share DECIMAL(15,2) DEFAULT 0.00,
    deposit_paid DECIMAL(15,2) DEFAULT 0.00,
    last_payment_date DATE,
    
    -- 权限设置
    can_approve_expenses BOOLEAN NOT NULL DEFAULT FALSE,
    can_invite_members BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage_facilities BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 邀请信息
    invited_by BIGINT,
    invite_code VARCHAR(50) UNIQUE,
    invite_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 时间戳
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
    color_code VARCHAR(7), -- 十六进制颜色码
    icon_name VARCHAR(50),
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
    -- 费用信息
    title VARCHAR(200) NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'CNY',
    exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
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
    split_type VARCHAR(10) NOT NULL DEFAULT 'equal'
        CHECK (split_type IN ('equal', 'days', 'custom')),
    split_details JSONB, -- 自定义分摊详情
    
    -- 发票信息
    invoice_number VARCHAR(100),
    invoice_date DATE,
    vendor_name VARCHAR(200),
    vendor_tax_id VARCHAR(50),
    
    -- 标签和分类
    tags JSONB DEFAULT '[]',
    notes TEXT,
    
    -- 时间戳
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_expenses_category_id 
        FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_applicant_id 
        FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_dorm_id 
        FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_payer_id 
        FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_expenses_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
);

COMMENT ON TABLE expenses IS '费用记录表，存储所有费用申请和审批信息';
COMMENT ON COLUMN expenses.id IS '费用记录唯一标识';
COMMENT ON COLUMN expenses.title IS '费用标题';
COMMENT ON COLUMN expenses.amount IS '费用金额';
COMMENT ON COLUMN expenses.currency IS '货币类型，默认CNY（人民币）';
COMMENT ON COLUMN expenses.exchange_rate IS '汇率，默认为1';
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
COMMENT ON COLUMN expenses.split_type IS '分摊类型：equal-等额分摊，days-按天数分摊，custom-自定义比例分摊';
COMMENT ON COLUMN expenses.split_details IS '自定义分摊详情，JSON格式。对于按天数分摊，此字段为空；对于自定义比例分摊，包含用户ID和百分比的映射';
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
    split_amount DECIMAL(15,2) NOT NULL CHECK (split_amount >= 0),
    split_percentage DECIMAL(5,2) CHECK (split_percentage >= 0 AND split_percentage <= 100),
    
    -- 支付状态
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'overdue', 'waived')),
    paid_amount DECIMAL(15,2) DEFAULT 0.00 CHECK (paid_amount >= 0),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- 截止日期
    due_date DATE,
    
    -- 提醒信息    reminder_count INTEGER DEFAULT 0,
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
    
    -- 检查约束
    CONSTRAINT expense_splits_amount_check CHECK (paid_amount <= split_amount),
    CONSTRAINT chk_due_date_not_past CHECK (due_date IS NULL OR due_date >= CURRENT_DATE),
    
    -- 唯一约束
    CONSTRAINT uk_expense_user_split 
        UNIQUE (expense_id, user_id)
);

COMMENT ON TABLE expense_splits IS '费用分摊记录表，记录每个费用在成员间的分摊详情';
COMMENT ON COLUMN expense_splits.id IS '分摊记录唯一标识';
COMMENT ON COLUMN expense_splits.expense_id IS '费用ID，外键关联expenses表';
COMMENT ON COLUMN expense_splits.user_id IS '用户ID，外键关联users表';
COMMENT ON COLUMN expense_splits.dorm_id IS '宿舍ID，外键关联dorms表';
COMMENT ON COLUMN expense_splits.split_amount IS '分摊金额';
COMMENT ON COLUMN expense_splits.split_percentage IS '分摊百分比';
COMMENT ON COLUMN expense_splits.payment_status IS '支付状态：pending-待支付，paid-已支付，overdue-逾期，waived-已免除';
COMMENT ON COLUMN expense_splits.paid_amount IS '已支付金额';
COMMENT ON COLUMN expense_splits.paid_at IS '支付时间';
COMMENT ON COLUMN expense_splits.due_date IS '截止日期';
COMMENT ON COLUMN expense_splits.reminder_count IS '提醒次数';
COMMENT ON COLUMN expense_splits.last_reminder_at IS '最后提醒时间';

-- 5. 索引定义
-- ============================================================

-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- 角色表索引
CREATE INDEX idx_roles_role_name ON roles(role_name);

-- 用户角色关联表索引
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_user_role ON user_roles(user_id, role_id);

-- 用户会话表索引
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);

-- 宿舍表索引
CREATE INDEX idx_dorms_status ON dorms(status);
CREATE INDEX idx_dorms_admin_id ON dorms(admin_id);

-- 用户宿舍关联表索引
CREATE INDEX idx_user_dorms_user_id ON user_dorms(user_id);
CREATE INDEX idx_user_dorms_dorm_id ON user_dorms(dorm_id);
CREATE INDEX idx_user_dorms_status ON user_dorms(status);
CREATE INDEX idx_user_dorms_user_dorm ON user_dorms(user_id, dorm_id);

-- 费用类别表索引
CREATE INDEX idx_expense_categories_active ON expense_categories(is_active);

-- 费用记录表索引
CREATE INDEX idx_expenses_dorm_id ON expenses(dorm_id);
CREATE INDEX idx_expenses_applicant_id ON expenses(applicant_id);
CREATE INDEX idx_expenses_payer_id ON expenses(payer_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_approved_by ON expenses(approved_by);
CREATE INDEX idx_expenses_split_type ON expenses(split_type);

-- 费用分摊记录表索引
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX idx_expense_splits_dorm_id ON expense_splits(dorm_id);
CREATE INDEX idx_expense_splits_payment_status ON expense_splits(payment_status);
CREATE INDEX idx_expense_splits_expense_user ON expense_splits(expense_id, user_id);
CREATE INDEX idx_expense_splits_due_date ON expense_splits(due_date);
CREATE INDEX idx_expense_splits_status_due_date ON expense_splits(payment_status, due_date);
-- 触发器函数定义已在文档末尾统一添加

-- 7. 审计日志表
-- ============================================================-- 审计日志表
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id BIGINT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id BIGINT,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_audit_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
);

-- 系统通知表
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info'
        CHECK (type IN ('info', 'warning', 'error', 'success', 'system')),
    
    -- 接收者信息
    user_id BIGINT,
    dorm_id INTEGER,
    is_global BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 状态信息
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- 发送者信息
    sender_id BIGINT,
    
    -- 关联信息
    related_id BIGINT,
    related_table VARCHAR(50),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_notifications_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_dorm_id 
        FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_sender_id 
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
);

-- 报修申请表
CREATE TABLE maintenance_requests (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- 申请人信息
    requester_id BIGINT NOT NULL,
    dorm_id INTEGER NOT NULL,
    
    -- 报修类型
    type VARCHAR(30) NOT NULL DEFAULT 'other'
        CHECK (type IN ('plumbing', 'electrical', 'furniture', 'appliance', 'network', 'other')),
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
    
    -- 状态信息
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'rejected', 'cancelled')),
    
    -- 处理信息
    assigned_to BIGINT,
    assigned_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    rejection_reason TEXT,
    
    -- 评价信息
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_maintenance_requests_requester_id 
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_requests_dorm_id 
        FOREIGN KEY (dorm_id) REFERENCES dorms(id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_requests_assigned_to 
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
);

-- 费用报销表
CREATE TABLE expense_reimbursements (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'CNY',
    exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
    
    -- 申请人信息
    applicant_id BIGINT NOT NULL,
    
    -- 报销类型
    type VARCHAR(30) NOT NULL DEFAULT 'other'
        CHECK (type IN ('utilities', 'supplies', 'maintenance', 'activities', 'other')),
    
    -- 状态信息
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
    
    -- 审批信息
    approved_by BIGINT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    rejection_reason TEXT,
    
    -- 支付信息
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(20),
    payment_reference VARCHAR(100),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_expense_reimbursements_applicant_id 
        FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_reimbursements_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
);

-- 报销凭证表
CREATE TABLE reimbursement_receipts (
    id BIGSERIAL PRIMARY KEY,
    reimbursement_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    description TEXT,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_reimbursement_receipts_reimbursement_id 
        FOREIGN KEY (reimbursement_id) REFERENCES expense_reimbursements(id) ON DELETE CASCADE,
);

-- 审计日志表索引
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 系统通知表索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_dorm_id ON notifications(dorm_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- 报修申请表索引
CREATE INDEX idx_maintenance_requests_requester_id ON maintenance_requests(requester_id);
CREATE INDEX idx_maintenance_requests_dorm_id ON maintenance_requests(dorm_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_assigned_to ON maintenance_requests(assigned_to);
CREATE INDEX idx_maintenance_requests_created_at ON maintenance_requests(created_at);

-- 费用报销表索引
CREATE INDEX idx_expense_reimbursements_applicant_id ON expense_reimbursements(applicant_id);
CREATE INDEX idx_expense_reimbursements_status ON expense_reimbursements(status);
CREATE INDEX idx_expense_reimbursements_approved_by ON expense_reimbursements(approved_by);
CREATE INDEX idx_expense_reimbursements_created_at ON expense_reimbursements(created_at);

-- 报销凭证表索引
CREATE INDEX idx_reimbursement_receipts_reimbursement_id ON reimbursement_receipts(reimbursement_id);

COMMENT ON TABLE audit_logs IS '审计日志表，记录重要数据变更操作';
COMMENT ON COLUMN audit_logs.id IS '日志记录唯一标识';
COMMENT ON COLUMN audit_logs.table_name IS '操作的表名';
COMMENT ON COLUMN audit_logs.operation IS '操作类型：INSERT-插入，UPDATE-更新，DELETE-删除';
COMMENT ON COLUMN audit_logs.record_id IS '操作涉及的记录ID';
COMMENT ON COLUMN audit_logs.old_values IS '更新前的值（JSON格式）';
COMMENT ON COLUMN audit_logs.new_values IS '更新后的值（JSON格式）';
COMMENT ON COLUMN audit_logs.user_id IS '操作用户ID';
COMMENT ON COLUMN audit_logs.session_id IS '会话ID';
COMMENT ON COLUMN audit_logs.ip_address IS '操作用户IP地址';
COMMENT ON COLUMN audit_logs.user_agent IS '操作用户代理字符串';
COMMENT ON COLUMN audit_logs.created_at IS '日志创建时间';

-- 系统通知表注释
COMMENT ON TABLE notifications IS '系统通知表，存储各类通知消息';
COMMENT ON COLUMN notifications.id IS '通知唯一标识';
COMMENT ON COLUMN notifications.title IS '通知标题';
COMMENT ON COLUMN notifications.content IS '通知内容';
COMMENT ON COLUMN notifications.type IS '通知类型：info-信息，warning-警告，error-错误，success-成功，system-系统';
COMMENT ON COLUMN notifications.user_id IS '接收通知的用户ID';
COMMENT ON COLUMN notifications.dorm_id IS '接收通知的宿舍ID';
COMMENT ON COLUMN notifications.is_global IS '是否为全局通知';
COMMENT ON COLUMN notifications.is_read IS '是否已读';
COMMENT ON COLUMN notifications.read_at IS '阅读时间';
COMMENT ON COLUMN notifications.sender_id IS '发送者ID';
COMMENT ON COLUMN notifications.related_id IS '关联记录ID';
COMMENT ON COLUMN notifications.related_table IS '关联表名';
COMMENT ON COLUMN notifications.created_at IS '通知创建时间';
COMMENT ON COLUMN notifications.updated_at IS '通知更新时间';

-- 报修申请表注释
COMMENT ON TABLE maintenance_requests IS '报修申请表，记录宿舍维修申请';
COMMENT ON COLUMN maintenance_requests.id IS '报修申请唯一标识';
COMMENT ON COLUMN maintenance_requests.title IS '报修标题';
COMMENT ON COLUMN maintenance_requests.description IS '报修详细描述';
COMMENT ON COLUMN maintenance_requests.requester_id IS '申请人ID';
COMMENT ON COLUMN maintenance_requests.dorm_id IS '宿舍ID';
COMMENT ON COLUMN maintenance_requests.type IS '报修类型：plumbing-水管，electrical-电气，furniture-家具，appliance-电器，network-网络，other-其他';
COMMENT ON COLUMN maintenance_requests.urgency_level IS '紧急程度：low-低，normal-正常，high-高，urgent-紧急';
COMMENT ON COLUMN maintenance_requests.status IS '状态：pending-待处理，assigned-已分配，in_progress-处理中，completed-已完成，rejected-已拒绝，cancelled-已取消';
COMMENT ON COLUMN maintenance_requests.assigned_to IS '分配给的维修人员ID';
COMMENT ON COLUMN maintenance_requests.assigned_at IS '分配时间';
COMMENT ON COLUMN maintenance_requests.started_at IS '开始处理时间';
COMMENT ON COLUMN maintenance_requests.completed_at IS '完成时间';
COMMENT ON COLUMN maintenance_requests.completion_notes IS '完成备注';
COMMENT ON COLUMN maintenance_requests.rejection_reason IS '拒绝原因';
COMMENT ON COLUMN maintenance_requests.rating IS '评分（1-5分）';
COMMENT ON COLUMN maintenance_requests.feedback IS '反馈意见';
COMMENT ON COLUMN maintenance_requests.created_at IS '申请创建时间';
COMMENT ON COLUMN maintenance_requests.updated_at IS '申请更新时间';

-- 费用报销表注释
COMMENT ON TABLE expense_reimbursements IS '费用报销表，记录报销申请';
COMMENT ON COLUMN expense_reimbursements.id IS '报销申请唯一标识';
COMMENT ON COLUMN expense_reimbursements.title IS '报销标题';
COMMENT ON COLUMN expense_reimbursements.description IS '报销描述';
COMMENT ON COLUMN expense_reimbursements.amount IS '报销金额';
COMMENT ON COLUMN expense_reimbursements.currency IS '货币类型，默认CNY（人民币）';
COMMENT ON COLUMN expense_reimbursements.exchange_rate IS '汇率，默认为1';
COMMENT ON COLUMN expense_reimbursements.applicant_id IS '申请人ID';
COMMENT ON COLUMN expense_reimbursements.type IS '报销类型：utilities-水电费，supplies-用品，maintenance-维修，activities-活动，other-其他';
COMMENT ON COLUMN expense_reimbursements.status IS '状态：pending-待审批，approved-已批准，rejected-已拒绝，paid-已支付，cancelled-已取消';
COMMENT ON COLUMN expense_reimbursements.approved_by IS '审批人ID';
COMMENT ON COLUMN expense_reimbursements.approved_at IS '审批时间';
COMMENT ON COLUMN expense_reimbursements.approval_notes IS '审批备注';
COMMENT ON COLUMN expense_reimbursements.rejection_reason IS '拒绝原因';
COMMENT ON COLUMN expense_reimbursements.paid_at IS '支付时间';
COMMENT ON COLUMN expense_reimbursements.payment_method IS '支付方式';
COMMENT ON COLUMN expense_reimbursements.payment_reference IS '支付参考号';
COMMENT ON COLUMN expense_reimbursements.created_at IS '报销申请创建时间';
COMMENT ON COLUMN expense_reimbursements.updated_at IS '报销申请更新时间';

-- 报销凭证表注释
COMMENT ON TABLE reimbursement_receipts IS '报销凭证表，存储报销相关文件';
COMMENT ON COLUMN reimbursement_receipts.id IS '凭证唯一标识';
COMMENT ON COLUMN reimbursement_receipts.reimbursement_id IS '关联的报销申请ID';
COMMENT ON COLUMN reimbursement_receipts.file_name IS '文件名';
COMMENT ON COLUMN reimbursement_receipts.file_path IS '文件路径';
COMMENT ON COLUMN reimbursement_receipts.file_size IS '文件大小（字节）';
COMMENT ON COLUMN reimbursement_receipts.mime_type IS '文件MIME类型';
COMMENT ON COLUMN reimbursement_receipts.description IS '文件描述';
COMMENT ON COLUMN reimbursement_receipts.created_at IS '凭证上传时间';

-- ============================================================
-- 数据库建表脚本结束
-- ============================================================

-- ============================================================
-- 触发器定义
-- ============================================================

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 自动更新宿舍人数触发器函数
CREATE OR REPLACE FUNCTION update_dorm_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- 处理插入操作
    IF TG_OP = 'INSERT' THEN
        UPDATE dorms SET current_occupancy = current_occupancy + 1 
        WHERE id = NEW.dorm_id;
        RETURN NEW;
    
    -- 处理删除操作
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE dorms SET current_occupancy = current_occupancy - 1 
        WHERE id = OLD.dorm_id;
        RETURN OLD;
    
    -- 处理更新操作（宿舍ID变更）
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.dorm_id <> NEW.dorm_id THEN
            UPDATE dorms SET current_occupancy = current_occupancy - 1 
            WHERE id = OLD.dorm_id;
            UPDATE dorms SET current_occupancy = current_occupancy + 1 
            WHERE id = NEW.dorm_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 审计日志触发器函数
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id BIGINT;
    v_session_id VARCHAR(255);
    v_ip_address INET;
    v_user_agent TEXT;
BEGIN
    -- 尝试从应用上下文获取用户信息
    -- 这里假设应用会在触发器执行前设置这些变量
    v_user_id := current_setting('app.current_user_id', true)::BIGINT;
    v_session_id := current_setting('app.current_session_id', true);
    v_ip_address := current_setting('app.current_ip_address', true)::INET;
    v_user_agent := current_setting('app.current_user_agent', true);
    
    -- 处理不同的操作类型
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            table_name, 
            operation, 
            record_id, 
            new_values, 
            user_id, 
            session_id,
            ip_address, 
            user_agent
        ) VALUES (
            TG_TABLE_NAME, 
            TG_OP, 
            NEW.id, 
            row_to_json(NEW), 
            v_user_id, 
            v_session_id,
            v_ip_address, 
            v_user_agent
        );
        RETURN NEW;
    
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            table_name, 
            operation, 
            record_id, 
            old_values, 
            new_values, 
            user_id, 
            session_id,
            ip_address, 
            user_agent
        ) VALUES (
            TG_TABLE_NAME, 
            TG_OP, 
            NEW.id, 
            row_to_json(OLD), 
            row_to_json(NEW), 
            v_user_id, 
            v_session_id,
            v_ip_address, 
            v_user_agent
        );
        RETURN NEW;
    
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            table_name, 
            operation, 
            record_id, 
            old_values, 
            user_id, 
            session_id,
            ip_address, 
            user_agent
        ) VALUES (
            TG_TABLE_NAME, 
            TG_OP, 
            OLD.id, 
            row_to_json(OLD), 
            v_user_id, 
            v_session_id,
            v_ip_address, 
            v_user_agent
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 自动创建费用分摊记录触发器函数
CREATE OR REPLACE FUNCTION create_expense_splits()
RETURNS TRIGGER AS $$
DECLARE
    v_default_due_date DATE;
    v_split_type VARCHAR(10);
    v_split_details JSONB;
BEGIN
    -- 计算默认截止日期（费用日期+7天）
    v_default_due_date := NEW.expense_date + INTERVAL '7 days';
    
    -- 获取费用记录的分摊类型和分摊详情
    v_split_type := COALESCE(NEW.split_type, 'equal');
    v_split_details := COALESCE(NEW.split_details, '{}');
    
    -- 调用费用分摊计算存储过程，使用费用记录指定的分摊算法
    -- 支持三种分摊算法：equal(等额分摊)、days(按天数分摊)、custom(自定义比例分摊)
    PERFORM calculate_expense_split(NEW.id, v_split_type, v_split_details, v_default_due_date);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION create_expense_splits() IS '自动创建费用分摊记录触发器函数，根据费用记录的split_type字段自动选择分摊算法（equal/days/custom）';

-- 自动设置默认截止日期触发器函数
CREATE OR REPLACE FUNCTION set_default_due_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.due_date IS NULL THEN
        NEW.due_date := CURRENT_DATE + INTERVAL '7 days';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- 触发器绑定
-- ============================================================
-- 用户表更新时间戳触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 宿舍表更新时间戳触发器
CREATE TRIGGER update_dorms_updated_at BEFORE UPDATE ON dorms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 用户宿舍关系表更新时间戳触发器
CREATE TRIGGER update_user_dorms_updated_at BEFORE UPDATE ON user_dorms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 费用表更新时间戳触发器
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 费用分摊表更新时间戳触发器
CREATE TRIGGER update_expense_splits_updated_at BEFORE UPDATE ON expense_splits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 通知表更新时间戳触发器
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 报修申请表更新时间戳触发器
CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 费用报销表更新时间戳触发器
CREATE TRIGGER update_expense_reimbursements_updated_at BEFORE UPDATE ON expense_reimbursements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动更新宿舍人数触发器
CREATE TRIGGER update_dorm_occupancy_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_dorms
    FOR EACH ROW EXECUTE FUNCTION update_dorm_occupancy();

-- 审计日志触发器（仅对重要表启用）
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_dorms_trigger
    AFTER INSERT OR UPDATE OR DELETE ON dorms
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_expenses_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_expense_splits_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expense_splits
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_maintenance_requests_trigger
    AFTER INSERT OR UPDATE OR DELETE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_expense_reimbursements_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expense_reimbursements
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- 自动创建费用分摊记录触发器
CREATE TRIGGER create_expense_splits_trigger
    AFTER INSERT ON expenses
    FOR EACH ROW EXECUTE FUNCTION create_expense_splits();

-- 自动设置默认截止日期触发器
CREATE TRIGGER trigger_set_default_due_date 
    BEFORE INSERT ON expense_splits
    FOR EACH ROW 
    EXECUTE FUNCTION set_default_due_date();
-- ============================================================
-- 视图定义
-- ============================================================

-- 用户详细信息视图
CREATE VIEW user_details AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.nickname,
    u.real_name,
    u.phone,
    u.gender,
    u.birthday,
    u.avatar_url,
    u.status,
    u.email_verified,
    u.phone_verified,
    u.created_at,
    u.updated_at,
    r.role_name,
    r.role_display_name,
    d.dorm_name,
    d.dorm_code,
    d.building,
    d.room_number,
    ud.move_in_date,
    ud.move_out_date,
    ud.status AS dorm_status,
    ud.monthly_share,
    ud.deposit_paid,
    ud.last_payment_date
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_dorms ud ON u.id = ud.user_id AND ud.status = 'active'
LEFT JOIN dorms d ON ud.dorm_id = d.id
ORDER BY u.id;

-- 宿舍详细信息视图
CREATE VIEW dorm_details AS
SELECT 
    d.id,
    d.dorm_name,
    d.dorm_code,
    d.address,
    d.capacity,
    d.current_occupancy,
    d.description,
    d.status,
    d.type,
    d.area,
    d.gender_limit,
    d.monthly_rent,
    d.deposit,
    d.utility_included,
    d.building,
    d.floor,
    d.room_number,
    d.facilities,
    d.amenities,
    d.created_at,
    d.updated_at,
    -- 宿舍管理员信息
    admin.username AS admin_username,
    admin.nickname AS admin_nickname,
    -- 宿舍用户列表
    (
        SELECT json_agg(
            json_build_object(
                'user_id', u.id,
                'username', u.username,
                'nickname', u.nickname,
                'real_name', u.real_name,
                'phone', u.phone,
                'move_in_date', ud.move_in_date,
                'move_out_date', ud.move_out_date,
                'monthly_share', ud.monthly_share,
                'deposit_paid', ud.deposit_paid
            )
        )
        FROM user_dorms ud
        JOIN users u ON ud.user_id = u.id
        WHERE ud.dorm_id = d.id AND ud.status = 'active'
    ) AS current_users,
    -- 宿舍占用率
    CASE 
        WHEN d.capacity > 0 THEN ROUND(d.current_occupancy::NUMERIC / d.capacity * 100, 2)
        ELSE 0
    END AS occupancy_rate
FROM dorms d
LEFT JOIN users admin ON d.admin_id = admin.id
ORDER BY d.id;

-- 费用详细信息视图
CREATE VIEW expense_details AS
SELECT 
    e.id,
    e.title,
    e.amount,
    e.currency,
    e.exchange_rate,
    e.category_id,
    ec.category_name,
    e.payer_id,
    payer.username AS payer_username,
    payer.nickname AS payer_nickname,
    e.dorm_id,
    d.dorm_name,
    d.dorm_code,
    e.expense_date,
    e.description,
    e.payment_method,
    e.payment_reference,
    e.split_type,
    e.split_details,
    e.status,
    e.created_at,
    e.updated_at,
    -- 分摊信息汇总
    (
        SELECT json_agg(
            json_build_object(
                'split_id', es.id,
                'user_id', es.user_id,
                'username', u.username,
                'nickname', u.nickname,
                'split_amount', es.split_amount,
                'split_percentage', es.split_percentage,
                'payment_status', es.payment_status,
                'paid_amount', es.paid_amount,
                'paid_at', es.paid_at
            )
        )
        FROM expense_splits es
        JOIN users u ON es.user_id = u.id
        WHERE es.expense_id = e.id
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = u.id AND r.is_system_role = TRUE
          )
    ) AS splits,
    -- 分摊统计
    (
        SELECT COUNT(*)
        FROM expense_splits es
        WHERE es.expense_id = e.id
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = es.user_id AND r.is_system_role = TRUE
          )
    ) AS total_splits,
    (
        SELECT COUNT(*)
        FROM expense_splits es
        WHERE es.expense_id = e.id AND es.payment_status = 'paid'
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = es.user_id AND r.is_system_role = TRUE
          )
    ) AS paid_splits,
    (
        SELECT SUM(es.paid_amount)
        FROM expense_splits es
        WHERE es.expense_id = e.id
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = es.user_id AND r.is_system_role = TRUE
          )
    ) AS total_paid
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
LEFT JOIN users payer ON e.payer_id = payer.id
LEFT JOIN dorms d ON e.dorm_id = d.id
ORDER BY e.expense_date DESC, e.id DESC;

-- 未付款项视图
CREATE VIEW unpaid_expenses AS
SELECT 
    es.id AS split_id,
    es.expense_id,
    e.title,
    e.expense_date,
    es.user_id,
    u.username,
    u.nickname,
    d.dorm_name,
    d.dorm_code,
    ec.category_name,
    es.split_amount,
    es.split_percentage,
    es.payment_status,
    es.due_date,
    e.created_at AS expense_created_at,
    -- 逾期天数
    CASE 
        WHEN es.due_date < CURRENT_DATE AND es.payment_status = 'pending' 
        THEN CURRENT_DATE - es.due_date
        ELSE 0
    END AS overdue_days,
    -- 是否逾期
    CASE 
        WHEN es.due_date < CURRENT_DATE AND es.payment_status = 'pending' 
        THEN TRUE
        ELSE FALSE
    END AS is_overdue,
    -- 逾期等级分类
    CASE 
        WHEN es.due_date < CURRENT_DATE AND es.payment_status = 'pending' THEN
            CASE 
                WHEN CURRENT_DATE - es.due_date <= 3 THEN '轻微逾期'
                WHEN CURRENT_DATE - es.due_date <= 7 THEN '一般逾期'
                WHEN CURRENT_DATE - es.due_date <= 30 THEN '严重逾期'
                ELSE '极度逾期'
            END
        ELSE '未逾期'
    END AS overdue_level,
    -- 预计罚款金额（按每日0.5%计算，最高不超过本金的50%）
    CASE 
        WHEN es.due_date < CURRENT_DATE AND es.payment_status = 'pending' THEN
            LEAST(es.split_amount * 0.005 * (CURRENT_DATE - es.due_date), es.split_amount * 0.5)
        ELSE 0
    END AS estimated_penalty
FROM expense_splits es
JOIN expenses e ON es.expense_id = e.id
JOIN users u ON es.user_id = u.id
JOIN user_dorms ud ON u.id = ud.user_id AND ud.status = 'active'
JOIN dorms d ON ud.dorm_id = d.id
LEFT JOIN expense_categories ec ON e.category_id = ec.id
WHERE es.payment_status IN ('pending', 'overdue')
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = u.id AND r.is_system_role = TRUE
  )
ORDER BY es.due_date ASC, es.expense_id ASC;-- 月度费用统计视图
CREATE VIEW monthly_expense_stats AS
SELECT 
    TO_CHAR(e.expense_date, 'YYYY-MM') AS month,
    e.dorm_id,
    d.dorm_name,
    d.dorm_code,
    ec.category_name,
    COUNT(*) AS expense_count,
    SUM(e.amount) AS total_amount,
    AVG(e.amount) AS avg_amount,
    MIN(e.amount) AS min_amount,
    MAX(e.amount) AS max_amount
FROM expenses e
LEFT JOIN dorms d ON e.dorm_id = d.id
LEFT JOIN expense_categories ec ON e.category_id = ec.id
GROUP BY TO_CHAR(e.expense_date, 'YYYY-MM'), e.dorm_id, d.dorm_name, d.dorm_code, ec.category_name
ORDER BY month DESC, d.dorm_name, ec.category_name;

-- 用户费用统计视图
CREATE VIEW user_expense_stats AS
SELECT 
    es.user_id,
    u.username,
    u.nickname,
    d.dorm_name,
    d.dorm_code,
    TO_CHAR(e.expense_date, 'YYYY-MM') AS month,
    COUNT(*) AS expense_count,
    SUM(es.split_amount) AS total_amount,
    AVG(es.split_amount) AS avg_amount,
    SUM(CASE WHEN es.payment_status = 'paid' THEN es.paid_amount ELSE 0 END) AS paid_amount,
    SUM(CASE WHEN es.payment_status IN ('pending', 'overdue') THEN es.split_amount ELSE 0 END) AS unpaid_amount
FROM expense_splits es
JOIN expenses e ON es.expense_id = e.id
JOIN users u ON es.user_id = u.id
JOIN user_dorms ud ON u.id = ud.user_id AND ud.status = 'active'
JOIN dorms d ON ud.dorm_id = d.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = u.id AND r.is_system_role = TRUE
)
GROUP BY es.user_id, u.username, u.nickname, d.dorm_name, d.dorm_code, TO_CHAR(e.expense_date, 'YYYY-MM')
ORDER BY month DESC, d.dorm_name, u.username;

-- ============================================================
-- 存储过程定义
-- ============================================================

-- 费用分摊计算存储过程
CREATE OR REPLACE FUNCTION calculate_expense_split(
    p_expense_id BIGINT,
    p_split_type VARCHAR DEFAULT 'equal', -- equal, days, custom
    p_split_details JSONB DEFAULT '{}', -- 自定义分摊详情
    p_due_date DATE DEFAULT NULL  -- 截止日期
) RETURNS BOOLEAN AS $$
DECLARE
    v_dorm_id INTEGER;
    v_total_amount DECIMAL(15,2);
    v_user_count INTEGER;
    v_user_record RECORD;
    v_split_amount DECIMAL(15,2);
    v_split_percentage DECIMAL(5,2);
    v_total_days INTEGER := 0;
    v_user_days INTEGER;
BEGIN
    -- 获取费用记录信息
    SELECT dorm_id, amount INTO v_dorm_id, v_total_amount
    FROM expenses
    WHERE id = p_expense_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '费用记录不存在: %', p_expense_id;
        RETURN FALSE;
    END IF;
    
    -- 删除现有分摊记录
    DELETE FROM expense_splits WHERE expense_id = p_expense_id;
    
    -- 更新费用记录的分摊类型和分摊详情
    UPDATE expenses 
    SET split_type = p_split_type,
        split_details = CASE 
            WHEN p_split_type = 'custom' THEN p_split_details 
            ELSE NULL 
        END
    WHERE id = p_expense_id;
    
    -- 根据分摊类型处理
    IF p_split_type = 'equal' THEN
        -- 等额分摊：总金额平均分配给所有被选中的寝室成员
        SELECT COUNT(*) INTO v_user_count
        FROM user_dorms ud
        WHERE ud.dorm_id = v_dorm_id 
        AND ud.status = 'active'
        AND (ud.move_out_date IS NULL OR ud.move_out_date > CURRENT_DATE)
        AND NOT EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = ud.user_id AND r.is_system_role = TRUE
        );
        
        IF v_user_count = 0 THEN
            RAISE EXCEPTION '宿舍中没有活跃用户: %', v_dorm_id;
            RETURN FALSE;
        END IF;
        
        v_split_amount := v_total_amount / v_user_count;
        v_split_percentage := 100.0 / v_user_count;
        
        FOR v_user_record IN 
            SELECT ud.user_id 
            FROM user_dorms ud
            WHERE ud.dorm_id = v_dorm_id 
            AND ud.status = 'active'
            AND (ud.move_out_date IS NULL OR ud.move_out_date > CURRENT_DATE)
            AND NOT EXISTS (
                SELECT 1 FROM user_roles ur 
                JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = ud.user_id AND r.is_system_role = TRUE
            )
        LOOP
            INSERT INTO expense_splits (
                expense_id, 
                user_id, 
                split_amount, 
                split_percentage, 
                payment_status, 
                due_date,
                created_at
            ) VALUES (
                p_expense_id, 
                v_user_record.user_id, 
                v_split_amount, 
                v_split_percentage, 
                'pending', 
                COALESCE(p_due_date, CURRENT_DATE + INTERVAL '7 days'),
                NOW()
            );
        END LOOP;
    
    ELSIF p_split_type = 'days' THEN
        -- 按在寝室天数分摊：根据被选中成员在寝室的居住天数比例分摊
        -- 首先计算总天数
        FOR v_user_record IN 
            SELECT 
                ud.user_id,
                CASE 
                    WHEN ud.move_in_date IS NULL THEN 1
                    WHEN ud.move_in_date > CURRENT_DATE THEN 0
                    WHEN ud.move_out_date IS NULL THEN CURRENT_DATE - ud.move_in_date + 1
                    WHEN ud.move_out_date > CURRENT_DATE THEN CURRENT_DATE - ud.move_in_date + 1
                    ELSE ud.move_out_date - ud.move_in_date + 1
                END AS days_in_dorm
            FROM user_dorms ud
            WHERE ud.dorm_id = v_dorm_id 
            AND ud.status = 'active'
            AND (ud.move_out_date IS NULL OR ud.move_out_date > CURRENT_DATE)
            AND NOT EXISTS (
                SELECT 1 FROM user_roles ur 
                JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = ud.user_id AND r.is_system_role = TRUE
            )
        LOOP
            v_total_days := v_total_days + v_user_record.days_in_dorm;
        END LOOP;
        
        IF v_total_days = 0 THEN
            RAISE EXCEPTION '宿舍中没有有效的居住天数记录: %', v_dorm_id;
            RETURN FALSE;
        END IF;
        
        -- 根据天数比例分摊
        FOR v_user_record IN 
            SELECT 
                ud.user_id,
                CASE 
                    WHEN ud.move_in_date IS NULL THEN 1
                    WHEN ud.move_in_date > CURRENT_DATE THEN 0
                    WHEN ud.move_out_date IS NULL THEN CURRENT_DATE - ud.move_in_date + 1
                    WHEN ud.move_out_date > CURRENT_DATE THEN CURRENT_DATE - ud.move_in_date + 1
                    ELSE ud.move_out_date - ud.move_in_date + 1
                END AS days_in_dorm
            FROM user_dorms ud
            WHERE ud.dorm_id = v_dorm_id 
            AND ud.status = 'active'
            AND (ud.move_out_date IS NULL OR ud.move_out_date > CURRENT_DATE)
            AND NOT EXISTS (
                SELECT 1 FROM user_roles ur 
                JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = ud.user_id AND r.is_system_role = TRUE
            )
        LOOP
            v_user_days := v_user_record.days_in_dorm;
            v_split_percentage := (v_user_days::DECIMAL(15,2) / v_total_days::DECIMAL(15,2)) * 100.0;
            v_split_amount := v_total_amount * v_split_percentage / 100.0;
            
            INSERT INTO expense_splits (
                expense_id, 
                user_id, 
                split_amount, 
                split_percentage, 
                payment_status, 
                due_date,
                created_at
            ) VALUES (
                p_expense_id, 
                v_user_record.user_id, 
                v_split_amount, 
                v_split_percentage, 
                'pending', 
                COALESCE(p_due_date, CURRENT_DATE + INTERVAL '7 days'),
                NOW()
            );
        END LOOP;
    
    ELSIF p_split_type = 'custom' THEN
        -- 自定义比例：缴费人自定义每个被选中成员的分摊比例
        DECLARE
            v_total_percentage DECIMAL(5,2) := 0;
        BEGIN
            -- 验证百分比总和是否为100%
            FOR v_user_record IN 
                SELECT (value->>'percentage')::DECIMAL(5,2) AS percentage
                FROM jsonb_each_text(p_split_details)
            LOOP
                v_total_percentage := v_total_percentage + v_user_record.percentage;
            END LOOP;
            
            IF ABS(v_total_percentage - 100.0) > 0.01 THEN
                RAISE EXCEPTION '自定义分摊百分比总和必须等于100%%，当前总和为: %', v_total_percentage;
                RETURN FALSE;
            END IF;
            
            -- 按百分比分摊
            FOR v_user_record IN 
                SELECT key::BIGINT AS user_id, 
                       (value->>'percentage')::DECIMAL(5,2) AS percentage
                FROM jsonb_each_text(p_split_details)
            LOOP
                v_split_amount := v_total_amount * v_user_record.percentage / 100.0;
                
                INSERT INTO expense_splits (
                    expense_id, 
                    user_id, 
                    split_amount, 
                    split_percentage, 
                    payment_status, 
                    due_date,
                    created_at
                ) VALUES (
                    p_expense_id, 
                    v_user_record.user_id, 
                    v_split_amount, 
                    v_user_record.percentage, 
                    'pending', 
                    COALESCE(p_due_date, CURRENT_DATE + INTERVAL '7 days'),
                    NOW()
                );
            END LOOP;
        END;
    
    ELSE
        RAISE EXCEPTION '不支持的分摊类型: %。支持的类型包括: equal(等额分摊), days(按天数分摊), custom(自定义比例)', p_split_type;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_expense_split(BIGINT, VARCHAR, JSONB, DATE) IS '费用分摊计算存储过程，支持三种分摊算法：equal(等额分摊)、days(按天数分摊)、custom(自定义比例分摊)';

-- 月度账单生成存储过程
CREATE OR REPLACE FUNCTION generate_monthly_bill(
    p_dorm_id INTEGER,
    p_month VARCHAR, -- 格式: YYYY-MM
    p_include_unpaid BOOLEAN DEFAULT TRUE,
    p_include_paid BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_month_start DATE;
    v_month_end DATE;
    v_user_record RECORD;
    v_expense_record RECORD;
    v_user_bill JSONB;
    v_total_amount DECIMAL(15,2);
    v_paid_amount DECIMAL(15,2);
BEGIN
    -- 解析月份参数
    BEGIN
        v_month_start := TO_DATE(p_month || '-01', 'YYYY-MM-DD');
        v_month_end := (v_month_start + INTERVAL '1 month') - INTERVAL '1 day';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '无效的月份格式，请使用 YYYY-MM 格式';
    END;
    
    v_result := jsonb_build_object(
        'dorm_id', p_dorm_id,
        'month', p_month,
        'period_start', v_month_start,
        'period_end', v_month_end,
        'users', jsonb_build_array()
    );
    
    -- 获取宿舍内所有活跃用户
    FOR v_user_record IN 
        SELECT u.id, u.username, u.nickname, u.email, u.phone
        FROM users u
        JOIN user_dorms ud ON u.id = ud.user_id
        WHERE ud.dorm_id = p_dorm_id 
        AND ud.status = 'active'
        AND (ud.move_out_date IS NULL OR ud.move_out_date > v_month_start)
    LOOP
        v_user_bill := jsonb_build_object(
            'user_id', v_user_record.id,
            'username', v_user_record.username,
            'nickname', v_user_record.nickname,
            'email', v_user_record.email,
            'phone', v_user_record.phone,
            'expenses', jsonb_build_array(),
            'total_amount', 0,
            'paid_amount', 0,
            'unpaid_amount', 0
        );
        
        v_total_amount := 0;
        v_paid_amount := 0;
        
        -- 获取用户在该月的费用分摊
        FOR v_expense_record IN 
            SELECT 
                e.id,
                e.title,
                e.expense_date,
                ec.category_name,
                es.split_amount,
                es.payment_status,
                es.paid_amount
            FROM expense_splits es
            JOIN expenses e ON es.expense_id = e.id
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            WHERE es.user_id = v_user_record.id
            AND e.expense_date >= v_month_start
            AND e.expense_date <= v_month_end
            AND (
                (p_include_unpaid AND es.payment_status IN ('pending', 'overdue')) OR
                (p_include_paid AND es.payment_status = 'paid')
            )
            ORDER BY e.expense_date DESC
        LOOP
            v_user_bill := v_user_bill || 
                jsonb_build_object(
                    'expenses', v_user_bill->'expenses' || 
                        jsonb_build_array(
                            jsonb_build_object(
                                'expense_id', v_expense_record.id,
                                'title', v_expense_record.title,
                                'date', v_expense_record.expense_date,
                                'category', v_expense_record.category_name,
                                'amount', v_expense_record.split_amount,
                                'payment_status', v_expense_record.payment_status,
                                'paid_amount', v_expense_record.paid_amount
                            )
                        )
                );
            
            v_total_amount := v_total_amount + v_expense_record.split_amount;
            IF v_expense_record.payment_status = 'paid' THEN
                v_paid_amount := v_paid_amount + v_expense_record.paid_amount;
            END IF;
        END LOOP;
        
        v_user_bill := v_user_bill || 
            jsonb_build_object(
                'total_amount', v_total_amount,
                'paid_amount', v_paid_amount,
                'unpaid_amount', v_total_amount - v_paid_amount
            );
        
        v_result := v_result || 
            jsonb_build_object(
                'users', v_result->'users' || jsonb_build_array(v_user_bill)
            );
    END LOOP;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 数据清理存储过程
CREATE OR REPLACE FUNCTION cleanup_old_data(
    p_days_old INTEGER DEFAULT 90, -- 默认清理90天前的数据
    p_cleanup_sessions BOOLEAN DEFAULT TRUE,
    p_cleanup_logs BOOLEAN DEFAULT TRUE
) RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    v_cutoff_date := NOW() - (p_days_old || ' days')::INTERVAL;
    
    -- 清理过期会话
    IF p_cleanup_sessions THEN
        DELETE FROM user_sessions 
        WHERE expires_at < NOW();
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        RAISE NOTICE '已清理 % 条过期会话记录', v_deleted_count;
    END IF;
    
    -- 清理旧审计日志（保留重要表的操作日志）
    IF p_cleanup_logs THEN
        DELETE FROM audit_logs 
        WHERE created_at < v_cutoff_date
        AND table_name NOT IN ('users', 'expenses', 'expense_splits', 'dorms');
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        RAISE NOTICE '已清理 % 条旧审计日志记录', v_deleted_count;
    END IF;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 逾期费用提醒存储过程
CREATE OR REPLACE FUNCTION send_overdue_reminders()
RETURNS TABLE(
    notification_count INTEGER,
    reminder_count INTEGER
) AS $$
DECLARE
    v_overdue_record RECORD;
    v_notification_count INTEGER := 0;
    v_reminder_count INTEGER := 0;
    v_overdue_days INTEGER;
    v_notification_title VARCHAR(200);
    v_notification_content TEXT;
BEGIN
    -- 查找逾期超过3天且未发送过提醒（或上次提醒超过7天）的费用分摊记录
    FOR v_overdue_record IN
        SELECT 
            es.id AS split_id,
            es.user_id,
            es.dorm_id,
            es.expense_id,
            es.split_amount,
            es.due_date,
            es.reminder_count,
            es.last_reminder_at,
            e.title AS expense_title,
            u.username,
            u.email,
            d.dorm_name,
            EXTRACT(DAY FROM (NOW() - es.due_date)) AS overdue_days
        FROM expense_splits es
        JOIN expenses e ON es.expense_id = e.id
        JOIN users u ON es.user_id = u.id
        JOIN dorms d ON es.dorm_id = d.id
        WHERE es.payment_status = 'pending'
        AND es.due_date < CURRENT_DATE
        AND (
            es.last_reminder_at IS NULL 
            OR es.last_reminder_at < NOW() - INTERVAL '7 days'
        )
        ORDER BY es.due_date ASC
    LOOP
        v_overdue_days := v_overdue_record.overdue_days;
        
        -- 构建通知标题和内容
        v_notification_title := '费用逾期提醒：' || v_overdue_record.expense_title;
        v_notification_content := format(
            '尊敬的 %s，您好！\n\n您在宿舍【%s】的费用【%s】已逾期 %s 天，应付金额为 ￥%s。\n\n请尽快完成缴费，避免影响信用记录。\n\n截止日期：%s\n逾期天数：%s 天\n\n如有疑问，请联系宿舍管理员。',
            v_overdue_record.username,
            v_overdue_record.dorm_name,
            v_overdue_record.expense_title,
            v_overdue_days,
            v_overdue_record.split_amount,
            to_char(v_overdue_record.due_date, 'YYYY-MM-DD'),
            v_overdue_days
        );
        
        -- 创建通知记录
        INSERT INTO notifications (
            title,
            content,
            type,
            user_id,
            dorm_id,
            is_global,
            related_id,
            related_table
        ) VALUES (
            v_notification_title,
            v_notification_content,
            'warning',
            v_overdue_record.user_id,
            v_overdue_record.dorm_id,
            FALSE,
            v_overdue_record.split_id,
            'expense_splits'
        );
        
        v_notification_count := v_notification_count + 1;
        
        -- 更新费用分摊记录的提醒次数和时间，并将状态更新为逾期
        UPDATE expense_splits
        SET 
            reminder_count = COALESCE(reminder_count, 0) + 1,
            last_reminder_at = NOW(),
            payment_status = 'overdue',
            updated_at = NOW()
        WHERE id = v_overdue_record.split_id;
        
        v_reminder_count := v_reminder_count + 1;
    END LOOP;
    
    -- 返回处理结果
    RETURN QUERY SELECT v_notification_count, v_reminder_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION send_overdue_reminders() IS '逾期费用提醒存储过程，查找逾期超过3天且未发送过提醒的费用分摊记录，创建通知并更新提醒次数';

-- 6. 验证码和安全模块
-- ============================================================

-- 验证码表
CREATE TABLE captcha_codes (
    id BIGSERIAL PRIMARY KEY,
    captcha_id VARCHAR(100) NOT NULL UNIQUE,
    captcha_answer VARCHAR(10) NOT NULL,
    captcha_image BYTEA,
    image_format VARCHAR(10) DEFAULT 'png',
    ip_address INET NOT NULL,
    user_agent TEXT,
    usage_count INTEGER NOT NULL DEFAULT 0,
    max_usage INTEGER NOT NULL DEFAULT 3,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 检查约束
    CONSTRAINT captcha_expires_check CHECK (expires_at > created_at),
    CONSTRAINT captcha_usage_check CHECK (usage_count >= 0 AND usage_count <= max_usage)
);

COMMENT ON TABLE captcha_codes IS '验证码表，存储登录验证码信息';
COMMENT ON COLUMN captcha_codes.id IS '验证码记录唯一标识';
COMMENT ON COLUMN captcha_codes.captcha_id IS '验证码唯一标识';
COMMENT ON COLUMN captcha_codes.captcha_answer IS '验证码答案';
COMMENT ON COLUMN captcha_codes.captcha_image IS '验证码图片二进制数据';
COMMENT ON COLUMN captcha_codes.image_format IS '图片格式';
COMMENT ON COLUMN captcha_codes.ip_address IS '请求IP地址';
COMMENT ON COLUMN captcha_codes.user_agent IS '用户代理';
COMMENT ON COLUMN captcha_codes.usage_count IS '已使用次数';
COMMENT ON COLUMN captcha_codes.max_usage IS '最大使用次数';
COMMENT ON COLUMN captcha_codes.expires_at IS '过期时间';

-- 两步验证代码表
CREATE TABLE two_factor_codes (
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

-- 两步验证密钥表
CREATE TABLE two_factor_auth (
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

-- ============================================================
-- 3. 数据初始化脚本
-- ============================================================

-- 费用分摊算法使用说明:
-- 1. 等额分摊(equal): 总金额平均分配给所有被选中的寝室成员
--    示例: 100元费用，3个成员，每人分摊33.33元
--    使用方法: 创建费用时设置 split_type='equal' 或不设置(默认值)
--
-- 2. 按在寝室天数分摊(days): 根据被选中成员在寝室的居住天数比例分摊
--    示例: 100元费用，成员A住30天，成员B住20天，成员C住10天
--         总天数=60天，成员A分摊50元，成员B分摊33.33元，成员C分摊16.67元
--    使用方法: 创建费用时设置 split_type='days'，split_details 为空
--
-- 3. 自定义比例分摊(custom): 缴费人自定义每个被选中成员的分摊比例
--    示例: 100元费用，成员A分摊40%，成员B分摊35%，成员C分摊25%
--         成员A分摊40元，成员B分摊35元，成员C分摊25元
--    使用方法: 创建费用时设置 split_type='custom'，
--              split_details='{"1": {"percentage": "40.00"}, "2": {"percentage": "35.00"}, "3": {"percentage": "25.00"}}'
--              注意：百分比总和必须等于100%
--
-- SQL使用示例:
-- 示例1: 创建等额分摊的费用记录
-- INSERT INTO expenses (dorm_id, category_id, applicant_id, amount, description, split_type) 
-- VALUES (1, 1, 1, 150.00, '电费', 'equal');
--
-- 示例2: 创建按天数分摊的费用记录
-- INSERT INTO expenses (dorm_id, category_id, applicant_id, amount, description, split_type) 
-- VALUES (1, 1, 1, 200.00, '月租', 'days');
--
-- 示例3: 创建自定义比例分摊的费用记录
-- INSERT INTO expenses (dorm_id, category_id, applicant_id, amount, description, split_type, split_details) 
-- VALUES (1, 1, 1, 300.00, '维修费', 'custom', '{"1": {"percentage": "50.00"}, "2": {"percentage": "30.00"}, "3": {"percentage": "20.00"}}');

-- 插入默认角色数据
INSERT INTO roles (role_name, role_display_name, description, permissions, is_system_role) VALUES
('system_admin', '系统管理员', '系统最高管理员，拥有最高权限，负责系统安全、架构管理、权限监督和系统维护', 
 '{"system_config": true, "user_management": true, "admin_supervision": true, "security_audit": true, "database_management": true}', 
 true),
('admin', '管理员', '业务运营管理员，负责用户管理、数据监控、内容管理、纠纷处理等业务层面的管理', 
 '{"user_management": true, "data_monitoring": true, "content_management": true, "dispute_resolution": true, "business_operations": true}', 
 true),
('dorm_leader', '宿舍长', '宿舍费用总负责人，管理宿舍日常费用和成员协调', 
 '{"dorm_creation": true, "member_invitation": true, "expense_creation": true, "expense_audit": true, "dorm_config": true}', 
 true),
('payer', '付款人', '负责费用收缴和支付的成员，确保费用收缴到位', 
 '{"payment_code_management": true, "payment_confirmation": true, "expense_audit": true, "bill_management": true}', 
 true),
('user', '普通用户', '普通宿舍成员，参与费用分摊和支付', 
 '{"view_bills": true, "pay_expenses": true, "expense_confirmation": true, "personal_settings": true}', 
 false);

-- 插入默认费用分类数据
INSERT INTO expense_categories (category_code, category_name, description, icon_name, color_code, is_active) VALUES
('utilities', '公用事业费', '水费、电费、网费等公用事业费用', 'utilities', '#FF6B6B', true),
('rent', '房租', '宿舍租金费用', 'home', '#4ECDC4', true),
('cleaning', '清洁用品', '清洁用品、消毒用品等', 'cleaning', '#45B7D1', true),
('maintenance', '维修费用', '设备维修、家具维修等', 'tools', '#96CEB4', true),
('supplies', '日用品', '纸巾、洗漱用品等日用品', 'shopping-cart', '#FECA57', true),
('food', '食品饮料', '集体购买的食品饮料', 'restaurant', '#FF9FF3', true),
('activities', '活动费用', '集体活动、聚餐等费用', 'party', '#54A0FF', true),
('insurance', '保险费用', '宿舍保险等', 'shield', '#5F27CD', true),
('other', '其他费用', '其他未分类费用', 'more-horizontal', '#00D2D3', true);

-- 插入示例用户数据（仅用于测试，生产环境应删除）
-- 注意：密码为哈希值，实际使用时需要重新计算
INSERT INTO users (username, email, password_hash, nickname, real_name, phone, status, email_verified) VALUES
('admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', '系统管理员', '13800000001', 'active', true),
('test_user', 'test@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '测试用户', '测试用户', '13800000002', 'active', true);

-- 为示例用户分配角色
INSERT INTO user_roles (user_id, role_id, assigned_by) 
SELECT u.id, r.id, 1 
FROM users u, roles r 
WHERE u.username = 'admin' AND r.role_name = 'system_admin';

INSERT INTO user_roles (user_id, role_id, assigned_by) 
SELECT u.id, r.id, 1 
FROM users u, roles r 
WHERE u.username = 'test_user' AND r.role_name = 'user';

-- 创建示例宿舍数据
INSERT INTO dorms (dorm_name, building, room_number, floor, capacity, monthly_rent, deposit, area, address, admin_id) VALUES
('A栋101', 'A栋', '101', 1, 4, 1200.00, 2400.00, 25.5, '学生宿舍A栋101室', 1),
('A栋102', 'A栋', '102', 1, 4, 1200.00, 2400.00, 25.5, '学生宿舍A栋102室', 1);-- 将测试用户添加到宿舍
INSERT INTO user_dorms (user_id, dorm_id, member_role, move_in_date, status) VALUES
(1, 1, 'admin', CURRENT_DATE, 'active'),
(2, 1, 'member', CURRENT_DATE, 'active');

-- 插入示例费用记录
INSERT INTO expenses (dorm_id, category_id, applicant_id, expense_date, amount, description, status) VALUES
(1, 1, 1, CURRENT_DATE - INTERVAL '7 days', 150.00, '电费', 'approved'),
(1, 4, 1, CURRENT_DATE - INTERVAL '3 days', 80.00, '门锁维修', 'approved');

-- ============================================================
-- 4. 数据库用户权限配置
-- ============================================================

-- 创建应用数据库用户
CREATE USER jzb_app_user WITH PASSWORD 'jzb_app_password_2024';
CREATE USER jzb_readonly_user WITH PASSWORD 'jzb_readonly_password_2024';

-- 授予应用用户权限
GRANT CONNECT ON DATABASE jzb_accounting TO jzb_app_user;
GRANT USAGE ON SCHEMA public TO jzb_app_user;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO jzb_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO jzb_app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO jzb_app_user;

-- 授予只读用户权限
GRANT CONNECT ON DATABASE jzb_accounting TO jzb_readonly_user;
GRANT USAGE ON SCHEMA public TO jzb_readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO jzb_readonly_user;

-- 设置默认权限（对新创建的对象）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO jzb_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO jzb_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO jzb_app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO jzb_readonly_user;

-- ============================================================
-- 5. 角色权限验证函数
-- ============================================================

-- 获取用户当前角色的函数（容错版本）
CREATE OR REPLACE FUNCTION get_user_current_role(p_user_id BIGINT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    v_user_id BIGINT := COALESCE(p_user_id, current_setting('app.current_user_id', TRUE)::BIGINT);
    v_role_name TEXT;
BEGIN
    -- 如果没有获取到用户ID，返回默认角色
    IF v_user_id IS NULL OR v_user_id = 0 THEN
        RETURN 'user';
    END IF;
    
    SELECT r.role_name INTO v_role_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = v_user_id 
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY r.is_system_role DESC, r.role_name
    LIMIT 1;
    
    RETURN COALESCE(v_role_name, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否有特定权限的函数（容错版本）
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id BIGINT DEFAULT NULL, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id BIGINT := COALESCE(p_user_id, current_setting('app.current_user_id', TRUE)::BIGINT);
    v_has_permission BOOLEAN := FALSE;
BEGIN
    -- 如果没有用户ID，默认为无权限
    IF v_user_id IS NULL OR v_user_id = 0 THEN
        RETURN FALSE;
    END IF;
    
    SELECT EXISTS(
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = v_user_id 
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        AND r.permissions ? p_permission
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户所有角色列表的函数
CREATE OR REPLACE FUNCTION get_user_all_roles(p_user_id BIGINT)
RETURNS TABLE(role_name TEXT, role_display_name TEXT, permissions JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT r.role_name::TEXT, r.role_display_name::TEXT, r.permissions
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id 
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. 数据库安全配置（基于角色权限）
-- ============================================================

-- 启用行级安全策略（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dorms ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE dorms ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_reimbursements ENABLE ROW LEVEL SECURITY;

-- 用户表权限策略
CREATE POLICY users_policy ON users FOR ALL USING (
    -- 获取当前用户ID，容错处理
    COALESCE(current_setting('app.current_user_id', TRUE)::BIGINT, 0) > 0 AND (
        -- 系统管理员可以看到所有用户
        get_user_current_role() = 'system_admin'
        OR
        -- 用户只能查看自己的信息
        id = current_setting('app.current_user_id', TRUE)::BIGINT
        OR
        -- 管理员可以看到所有用户
        get_user_current_role() = 'admin'
    )
);

-- 会话表权限策略
CREATE POLICY user_sessions_policy ON user_sessions FOR ALL USING (
    COALESCE(current_setting('app.current_user_id', TRUE)::BIGINT, 0) > 0 AND (
        user_id = current_setting('app.current_user_id', TRUE)::BIGINT
        OR
        get_user_current_role() = 'system_admin'
        OR
        get_user_current_role() = 'admin'
    )
);

-- 角色表权限策略（只有系统管理员和管理员可以管理）
CREATE POLICY roles_policy ON roles FOR ALL USING (
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'system_admin'
    OR
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'admin'
);

-- 宿舍表权限策略
CREATE POLICY dorms_policy ON dorms FOR ALL USING (
    -- 系统管理员可以看到所有宿舍
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'system_admin'
    OR
    -- 管理员可以看到所有宿舍
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'admin'
    OR
    -- 寝室长可以管理自己负责的宿舍
    admin_id = current_setting('app.current_user_id', TRUE)::BIGINT
    OR
    -- 普通用户可以看到自己所属的宿舍
    id IN (
        SELECT dorm_id FROM user_dorms 
        WHERE user_id = current_setting('app.current_user_id', TRUE)::BIGINT 
        AND status = 'active'
    )
);

-- 用户宿舍关系表权限策略
CREATE POLICY user_dorms_policy ON user_dorms FOR ALL USING (
    -- 系统管理员可以管理所有关系
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'system_admin'
    OR
    -- 管理员可以管理所有关系
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'admin'
    OR
    -- 寝室长可以管理自己宿舍的成员
    dorm_id IN (
        SELECT id FROM dorms 
        WHERE admin_id = current_setting('app.current_user_id', TRUE)::BIGINT
    )
    OR
    -- 用户只能查看自己的关系
    user_id = current_setting('app.current_user_id', TRUE)::BIGINT
);

-- 费用表权限策略
CREATE POLICY expenses_policy ON expenses FOR ALL USING (
    -- 系统管理员可以查看所有费用
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'system_admin'
    OR
    -- 管理员可以查看所有费用
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'admin'
    OR
    -- 寝室长可以管理自己宿舍的费用
    dorm_id IN (
        SELECT id FROM dorms 
        WHERE admin_id = current_setting('app.current_user_id', TRUE)::BIGINT
    )
    OR
    -- 缴费人可以查看相关费用
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'payer'
    OR
    -- 普通用户可以查看自己宿舍的费用
    dorm_id IN (
        SELECT dorm_id FROM user_dorms 
        WHERE user_id = current_setting('app.current_user_id', TRUE)::BIGINT 
        AND status = 'active'
    )
);

-- 费用分摊表权限策略
CREATE POLICY expense_splits_policy ON expense_splits FOR ALL USING (
    -- 系统管理员可以查看所有分摊
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'system_admin'
    OR
    -- 管理员可以查看所有分摊
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'admin'
    OR
    -- 寝室长可以查看自己宿舍的分摊
    dorm_id IN (
        SELECT id FROM dorms 
        WHERE admin_id = current_setting('app.current_user_id', TRUE)::BIGINT
    )
    OR
    -- 缴费人可以查看相关分摊
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'payer'
    OR
    -- 用户只能查看自己的分摊
    user_id = current_setting('app.current_user_id', TRUE)::BIGINT
);

-- 费用分类表权限策略（所有人可以查看，管理员可以修改）
CREATE POLICY expense_categories_policy ON expense_categories FOR ALL USING (
    is_active = TRUE
    OR
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'system_admin'
    OR
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'admin'
);

-- 通知表权限策略
CREATE POLICY notifications_policy ON notifications FOR ALL USING (
    user_id = current_setting('app.current_user_id', TRUE)::BIGINT
    OR
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'system_admin'
    OR
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'admin'
    OR
    dorm_id IN (
        SELECT id FROM dorms 
        WHERE admin_id = current_setting('app.current_user_id', TRUE)::BIGINT
    )
);

-- 报修申请表权限策略
CREATE POLICY maintenance_requests_policy ON maintenance_requests FOR ALL USING (
    requester_id = current_setting('app.current_user_id', TRUE)::BIGINT
    OR
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'system_admin'
    OR
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'admin'
    OR
    assigned_to = current_setting('app.current_user_id', TRUE)::BIGINT
    OR
    dorm_id IN (
        SELECT id FROM dorms 
        WHERE admin_id = current_setting('app.current_user_id', TRUE)::BIGINT
    )
);

-- 费用报销表权限策略
CREATE POLICY expense_reimbursements_policy ON expense_reimbursements FOR ALL USING (
    applicant_id = current_setting('app.current_user_id', TRUE)::BIGINT
    OR
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'system_admin'
    OR
    get_user_current_role(current_setting('app.current_user_id', TRUE)::BIGINT) = 'admin'
    OR
    approved_by = current_setting('app.current_user_id', TRUE)::BIGINT
);

-- ============================================================
-- 7. 角色权限初始化与验证
-- ============================================================

-- 权限系统测试函数
CREATE OR REPLACE FUNCTION test_user_permissions(p_user_id BIGINT)
RETURNS TABLE(
    test_description TEXT,
    test_result BOOLEAN,
    additional_info TEXT
) AS $$
BEGIN
    -- 测试1: 检查用户是否存在
    RETURN QUERY
    SELECT 
        'User existence check'::TEXT,
        EXISTS(SELECT 1 FROM users WHERE id = p_user_id AND status = 'active')::BOOLEAN,
        'User ID: ' || p_user_id::TEXT || ', Status: ' || (SELECT status FROM users WHERE id = p_user_id)::TEXT;
    
    -- 测试2: 检查用户角色
    RETURN QUERY
    SELECT 
        'User role check'::TEXT,
        (get_user_current_role(p_user_id) IS NOT NULL)::BOOLEAN,
        'Current role: ' || get_user_current_role(p_user_id);
    
    -- 测试3: 检查会话上下文设置
    RETURN QUERY
    SELECT 
        'Session context test'::TEXT,
        (set_user_session_context(p_user_id))::BOOLEAN,
        'Context set successfully for user: ' || p_user_id::TEXT;
    
    -- 测试4: 模拟会话上下文后的权限
    RETURN QUERY
    SELECT 
        'Post-context permission test'::TEXT,
        (get_user_current_role() IS NOT NULL)::BOOLEAN,
        'Role with context: ' || get_user_current_role();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 安全的获取用户ID函数
CREATE OR REPLACE FUNCTION get_current_user_id_safe()
RETURNS BIGINT AS $$
DECLARE
    v_user_id BIGINT;
BEGIN
    -- 尝试从会话变量获取
    v_user_id := COALESCE(current_setting('app.current_user_id', TRUE)::BIGINT, 0);
    
    -- 如果会话变量不存在，抛出错误提示
    IF v_user_id IS NULL OR v_user_id = 0 THEN
        RAISE EXCEPTION '未设置用户会话上下文。请调用 set_user_session_context(user_id) 函数设置当前用户ID。';
    END IF;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建安全设置函数（用于应用层调用）
CREATE OR REPLACE FUNCTION set_user_session_context(p_user_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- 设置用户ID到会话变量
    PERFORM set_config('app.current_user_id', p_user_id::TEXT, TRUE);
    
    -- 验证用户存在且状态正常
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND status = 'active') THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 角色权限检查装饰器函数
CREATE OR REPLACE FUNCTION check_role_permission(p_required_role TEXT, p_user_id BIGINT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id BIGINT := COALESCE(p_user_id, current_setting('app.current_user_id', TRUE)::BIGINT);
    v_user_role TEXT;
BEGIN
    -- 获取用户当前角色
    SELECT get_user_current_role(v_user_id) INTO v_user_role;
    
    -- 角色等级检查
    CASE p_required_role
        WHEN 'system_admin' THEN
            RETURN v_user_role = 'system_admin';
        WHEN 'admin' THEN
            RETURN v_user_role IN ('system_admin', 'admin');
        WHEN 'dorm_leader' THEN
            RETURN v_user_role IN ('system_admin', 'admin', 'dorm_leader');
        WHEN 'payer' THEN
            RETURN v_user_role IN ('system_admin', 'admin', 'dorm_leader', 'payer');
        WHEN 'user' THEN
            RETURN v_user_role IN ('system_admin', 'admin', 'dorm_leader', 'payer', 'user');
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建权限验证视图
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    r.role_name,
    r.role_display_name,
    r.permissions,
    ur.is_active as role_active,
    ur.expires_at as role_expires_at,
    CASE 
        WHEN ur.expires_at IS NOT NULL AND ur.expires_at <= NOW() THEN FALSE
        ELSE TRUE 
    END as permission_valid
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.status = 'active';

COMMENT ON VIEW user_permissions_view IS '用户权限查看视图，显示当前有效角色和权限';

-- 为数据库用户设置权限（确保应用层可以访问RLS策略）
-- 注意：这些权限在应用层调用时会被RLS策略进一步控制
GRANT SELECT ON user_permissions_view TO jzb_app_user;
GRANT EXECUTE ON FUNCTION get_user_current_role(BIGINT) TO jzb_app_user;
GRANT EXECUTE ON FUNCTION user_has_permission(BIGINT, TEXT) TO jzb_app_user;
GRANT EXECUTE ON FUNCTION get_user_all_roles(BIGINT) TO jzb_app_user;
GRANT EXECUTE ON FUNCTION set_user_session_context(BIGINT) TO jzb_app_user;
GRANT EXECUTE ON FUNCTION check_role_permission(TEXT, BIGINT) TO jzb_app_user;

-- ============================================================
-- 8. 数据库性能优化配置
-- ============================================================

-- 设置数据库参数（可选，根据实际需求调整）
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET log_statement = 'all';
-- ALTER SYSTEM SET log_min_duration_statement = 1000;

-- 重建索引统计信息
ANALYZE;

-- 强制统计信息更新
VACUUM ANALYZE;

-- ============================================================
-- 7. 管理后台高级功能模块
-- ============================================================

-- 7.1 管理员操作日志表
CREATE TABLE admin_operationlogs (
    id BIGSERIAL PRIMARY KEY,
    
    -- 操作者信息
    operator_id BIGINT NOT NULL,
    operator_username VARCHAR(50) NOT NULL,
    operator_role VARCHAR(50) NOT NULL,
    operator_ip INET NOT NULL,
    operator_user_agent TEXT,
    
    -- 操作信息
    operation_type VARCHAR(50) NOT NULL 
        CHECK (operation_type IN (
            'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_STATUS_CHANGE',
            'DORM_CREATE', 'DORM_UPDATE', 'DORM_DELETE', 'DORM_ASSIGN',
            'EXPENSE_APPROVE', 'EXPENSE_REJECT', 'EXPENSE_DELETE',
            'SYSTEM_CONFIG_UPDATE', 'SYSTEM_BACKUP', 'SYSTEM_RESTORE',
            'ROLE_ASSIGN', 'ROLE_REVOKE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE',
            'DATA_EXPORT', 'DATA_IMPORT', 'BULK_OPERATION', 'SECURITY_ACTION',
            'MAINTENANCE_START', 'MAINTENANCE_END', 'EMERGENCY_LOCK', 'EMERGENCY_UNLOCK'
        )),
    
    operation_module VARCHAR(50) NOT NULL
        CHECK (operation_module IN (
            'USER_MANAGEMENT', 'DORM_MANAGEMENT', 'EXPENSE_MANAGEMENT',
            'SYSTEM_CONFIG', 'SYSTEM_MAINTENANCE', 'SECURITY_MANAGEMENT',
            'DATA_MANAGEMENT', 'REPORT_ANALYSIS', 'AUDIT_LOGS'
        )),
    
    -- 操作详情
    operation_description TEXT NOT NULL,
    operation_details JSONB,
    target_table VARCHAR(100),
    target_record_id BIGINT,
    
    -- 操作结果
    operation_status VARCHAR(20) NOT NULL DEFAULT 'success'
        CHECK (operation_status IN ('success', 'failed', 'partial')),
    error_message TEXT,
    execution_time_ms INTEGER,
    
    -- 安全相关
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    approval_required_by BIGINT,
    approval_status VARCHAR(20)
        CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approval_comment TEXT,
    
    -- 业务上下文
    business_context JSONB,
    session_id VARCHAR(255),
    
    -- 时间戳
    operation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_admin_operationlogs_operator_id 
        FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_operationlogs_approval_required_by 
        FOREIGN KEY (approval_required_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CONSTRAINT admin_operationlogs_execution_time_positive 
        CHECK (execution_time_ms IS NULL OR execution_time_ms >= 0),
    CONSTRAINT admin_operationlogs_target_check 
        CHECK ((target_table IS NULL AND target_record_id IS NULL) OR 
               (target_table IS NOT NULL AND target_record_id IS NOT NULL))
);

COMMENT ON TABLE admin_operationlogs IS '管理员操作日志表，记录所有管理员的关键操作行为';
COMMENT ON COLUMN admin_operationlogs.id IS '操作日志唯一标识';
COMMENT ON COLUMN admin_operationlogs.operator_id IS '操作者用户ID';
COMMENT ON COLUMN admin_operationlogs.operator_username IS '操作者用户名';
COMMENT ON COLUMN admin_operationlogs.operator_role IS '操作者角色';
COMMENT ON COLUMN admin_operationlogs.operator_ip IS '操作者IP地址';
COMMENT ON COLUMN admin_operationlogs.operator_user_agent IS '操作者用户代理';
COMMENT ON COLUMN admin_operationlogs.operation_type IS '操作类型：用户管理、宿舍管理、费用管理等';
COMMENT ON COLUMN admin_operationlogs.operation_module IS '操作模块：用户管理、宿舍管理、费用管理等';
COMMENT ON COLUMN admin_operationlogs.operation_description IS '操作描述';
COMMENT ON COLUMN admin_operationlogs.operation_details IS '操作详情，JSON格式存储操作的具体参数和结果';
COMMENT ON COLUMN admin_operationlogs.target_table IS '操作目标表名';
COMMENT ON COLUMN admin_operationlogs.target_record_id IS '操作目标记录ID';
COMMENT ON COLUMN admin_operationlogs.operation_status IS '操作状态：success-成功，failed-失败，partial-部分成功';
COMMENT ON COLUMN admin_operationlogs.error_message IS '错误信息';
COMMENT ON COLUMN admin_operationlogs.execution_time_ms IS '操作执行时间（毫秒）';
COMMENT ON COLUMN admin_operationlogs.requires_approval IS '是否需要审批';
COMMENT ON COLUMN admin_operationlogs.approval_required_by IS '需要审批的管理员ID';
COMMENT ON COLUMN admin_operationlogs.approval_status IS '审批状态：pending-待审批，approved-已通过，rejected-已拒绝';
COMMENT ON COLUMN admin_operationlogs.approval_comment IS '审批意见';
COMMENT ON COLUMN admin_operationlogs.business_context IS '业务上下文，JSON格式存储相关业务信息';
COMMENT ON COLUMN admin_operationlogs.session_id IS '操作会话ID';
COMMENT ON COLUMN admin_operationlogs.operation_timestamp IS '操作执行时间';

-- 7.2 数据备份记录表
CREATE TABLE admin_backup_records (
    id BIGSERIAL PRIMARY KEY,
    
    -- 备份基本信息
    backup_name VARCHAR(200) NOT NULL,
    backup_type VARCHAR(50) NOT NULL
        CHECK (backup_type IN (
            'FULL_DATABASE', 'PARTIAL_DATABASE', 'USER_DATA', 'DORM_DATA',
            'EXPENSE_DATA', 'CONFIG_DATA', 'LOGS_DATA', 'SYSTEM_DATA',
            'SCHEDULED_BACKUP', 'MANUAL_BACKUP', 'EMERGENCY_BACKUP'
        )),
    
    -- 备份范围
    backup_scope JSONB NOT NULL, -- 备份的表范围和条件
    backup_size_bytes BIGINT,
    backup_tables TEXT[],
    excluded_tables TEXT[],
    
    -- 备份存储信息
    storage_type VARCHAR(50) NOT NULL
        CHECK (storage_type IN ('LOCAL_DISK', 'NETWORK_STORAGE', 'CLOUD_STORAGE', 'MULTIPLE_COPIES')),
    storage_location TEXT NOT NULL,
    storage_url TEXT,
    storage_bucket VARCHAR(100),
    storage_path TEXT,
    
    -- 备份状态和进度
    backup_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (backup_status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_operation VARCHAR(100),
    
    -- 备份质量检查
    checksum VARCHAR(128), -- MD5或SHA256校验和
    checksum_algorithm VARCHAR(20) DEFAULT 'SHA256',
    verification_status VARCHAR(20)
        CHECK (verification_status IN ('pending', 'verified', 'failed', 'not_applicable')),
    verification_details TEXT,
    
    -- 压缩和加密
    is_compressed BOOLEAN NOT NULL DEFAULT TRUE,
    compression_algorithm VARCHAR(20) DEFAULT 'gzip',
    compression_ratio DECIMAL(5,2),
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    encryption_algorithm VARCHAR(50),
    encryption_key_id VARCHAR(100),
    
    -- 执行信息
    initiated_by BIGINT NOT NULL,
    initiated_username VARCHAR(50) NOT NULL,
    execution_duration_seconds INTEGER,
    backup_started_at TIMESTAMP WITH TIME ZONE,
    backup_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- 保留策略
    retention_days INTEGER NOT NULL DEFAULT 30,
    retention_policy JSONB,
    auto_delete_at TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 恢复信息
    can_restore BOOLEAN NOT NULL DEFAULT TRUE,
    restore_count INTEGER DEFAULT 0,
    last_restored_at TIMESTAMP WITH TIME ZONE,
    last_restored_by BIGINT,
    
    -- 元数据
    database_version VARCHAR(50),
    backup_tool_version VARCHAR(50),
    application_version VARCHAR(50),
    backup_metadata JSONB,
    
    -- 错误和警告
    error_messages JSONB,
    warning_messages JSONB,
    recommendations JSONB,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_admin_backup_records_initiated_by 
        FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_backup_records_last_restored_by 
        FOREIGN KEY (last_restored_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CONSTRAINT admin_backup_records_size_positive 
        CHECK (backup_size_bytes IS NULL OR backup_size_bytes >= 0),
    CONSTRAINT admin_backup_records_duration_positive 
        CHECK (execution_duration_seconds IS NULL OR execution_duration_seconds >= 0),
    CONSTRAINT admin_backup_records_retention_positive 
        CHECK (retention_days > 0),
    CONSTRAINT admin_backup_records_progress_valid 
        CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

COMMENT ON TABLE admin_backup_records IS '数据备份记录表，记录所有数据备份的相关信息';
COMMENT ON COLUMN admin_backup_records.id IS '备份记录唯一标识';
COMMENT ON COLUMN admin_backup_records.backup_name IS '备份名称';
COMMENT ON COLUMN admin_backup_records.backup_type IS '备份类型：完整数据库、部分数据库等';
COMMENT ON COLUMN admin_backup_records.backup_scope IS '备份范围，JSON格式定义具体备份的数据范围';
COMMENT ON COLUMN admin_backup_records.backup_size_bytes IS '备份文件大小（字节）';
COMMENT ON COLUMN admin_backup_records.backup_tables IS '备份的表列表';
COMMENT ON COLUMN admin_backup_records.excluded_tables IS '排除的表列表';
COMMENT ON COLUMN admin_backup_records.storage_type IS '存储类型：本地磁盘、网络存储、云存储等';
COMMENT ON COLUMN admin_backup_records.storage_location IS '存储位置描述';
COMMENT ON COLUMN admin_backup_records.storage_url IS '存储URL';
COMMENT ON COLUMN admin_backup_records.storage_bucket IS '存储桶名称';
COMMENT ON COLUMN admin_backup_records.storage_path IS '存储路径';
COMMENT ON COLUMN admin_backup_records.backup_status IS '备份状态：pending-待执行，in_progress-执行中，completed-已完成，failed-失败，cancelled-已取消';
COMMENT ON COLUMN admin_backup_records.progress_percentage IS '备份进度百分比';
COMMENT ON COLUMN admin_backup_records.current_operation IS '当前操作描述';
COMMENT ON COLUMN admin_backup_records.checksum IS '文件校验和';
COMMENT ON COLUMN admin_backup_records.checksum_algorithm IS '校验和算法';
COMMENT ON COLUMN admin_backup_records.verification_status IS '验证状态：pending-待验证，verified-已验证，failed-验证失败，not_applicable-不适用';
COMMENT ON COLUMN admin_backup_records.verification_details IS '验证详情';
COMMENT ON COLUMN admin_backup_records.is_compressed IS '是否压缩';
COMMENT ON COLUMN admin_backup_records.compression_algorithm IS '压缩算法';
COMMENT ON COLUMN admin_backup_records.compression_ratio IS '压缩比';
COMMENT ON COLUMN admin_backup_records.is_encrypted IS '是否加密';
COMMENT ON COLUMN admin_backup_records.encryption_algorithm IS '加密算法';
COMMENT ON COLUMN admin_backup_records.encryption_key_id IS '加密密钥ID';
COMMENT ON COLUMN admin_backup_records.initiated_by IS '备份发起人ID';
COMMENT ON COLUMN admin_backup_records.initiated_username IS '备份发起人用户名';
COMMENT ON COLUMN admin_backup_records.execution_duration_seconds IS '执行时长（秒）';
COMMENT ON COLUMN admin_backup_records.backup_started_at IS '备份开始时间';
COMMENT ON COLUMN admin_backup_records.backup_completed_at IS '备份完成时间';
COMMENT ON COLUMN admin_backup_records.retention_days IS '保留天数';
COMMENT ON COLUMN admin_backup_records.retention_policy IS '保留策略配置';
COMMENT ON COLUMN admin_backup_records.auto_delete_at IS '自动删除时间';
COMMENT ON COLUMN admin_backup_records.is_permanent IS '是否永久保存';
COMMENT ON COLUMN admin_backup_records.can_restore IS '是否可以恢复';
COMMENT ON COLUMN admin_backup_records.restore_count IS '恢复次数';
COMMENT ON COLUMN admin_backup_records.last_restored_at IS '最后恢复时间';
COMMENT ON COLUMN admin_backup_records.last_restored_by IS '最后恢复操作人';
COMMENT ON COLUMN admin_backup_records.database_version IS '数据库版本';
COMMENT ON COLUMN admin_backup_records.backup_tool_version IS '备份工具版本';
COMMENT ON COLUMN admin_backup_records.application_version IS '应用版本';
COMMENT ON COLUMN admin_backup_records.backup_metadata IS '备份元数据';
COMMENT ON COLUMN admin_backup_records.error_messages IS '错误信息数组';
COMMENT ON COLUMN admin_backup_records.warning_messages IS '警告信息数组';
COMMENT ON COLUMN admin_backup_records.recommendations IS '建议信息';

-- 7.3 系统配置管理表
CREATE TABLE admin_system_configs (
    id SERIAL PRIMARY KEY,
    
    -- 配置基本信息
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_category VARCHAR(50) NOT NULL
        CHECK (config_category IN (
            'SYSTEM_GENERAL', 'SECURITY_CONFIG', 'EMAIL_CONFIG', 'SMS_CONFIG',
            'FILE_STORAGE', 'CACHE_CONFIG', 'DATABASE_CONFIG', 'LOG_CONFIG',
            'PERFORMANCE_CONFIG', 'FEATURE_FLAGS', 'INTEGRATION_CONFIG',
            'BACKUP_CONFIG', 'MAINTENANCE_CONFIG', 'UI_CONFIG'
        )),
    
    -- 配置值
    config_value JSONB NOT NULL,
    default_value JSONB,
    data_type VARCHAR(20) NOT NULL
        CHECK (data_type IN ('string', 'integer', 'decimal', 'boolean', 'json', 'array')),
    
    -- 配置属性
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    is_system_config BOOLEAN NOT NULL DEFAULT FALSE,
    is_readonly BOOLEAN NOT NULL DEFAULT FALSE,
    requires_restart BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 验证规则
    validation_rules JSONB,
    min_value DECIMAL(15,6),
    max_value DECIMAL(15,6),
    allowed_values JSONB,
    regex_pattern VARCHAR(500),
    
    -- 配置描述
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    help_text TEXT,
    config_group VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    
    -- 环境配置
    environment VARCHAR(20) NOT NULL DEFAULT 'all'
        CHECK (environment IN ('development', 'staging', 'production', 'all')),
    
    -- 配置历史
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- 权限控制
    requires_permission VARCHAR(100),
    editable_by_roles TEXT[],
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by BIGINT,
    
    -- 外键约束
    CONSTRAINT fk_admin_system_configs_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CONSTRAINT admin_system_configs_sort_order_positive 
        CHECK (sort_order >= 0),
    CONSTRAINT admin_system_configs_version_positive 
        CHECK (version >= 1)
);

COMMENT ON TABLE admin_system_configs IS '系统配置管理表，管理系统的各种配置参数';
COMMENT ON COLUMN admin_system_configs.id IS '配置项唯一标识';
COMMENT ON COLUMN admin_system_configs.config_key IS '配置键名';
COMMENT ON COLUMN admin_system_configs.config_category IS '配置分类：系统通用、安全配置、邮件配置等';
COMMENT ON COLUMN admin_system_configs.config_value IS '配置值，JSON格式存储';
COMMENT ON COLUMN admin_system_configs.default_value IS '默认值';
COMMENT ON COLUMN admin_system_configs.data_type IS '数据类型：string-字符串，integer-整数，decimal-小数，boolean-布尔，json-对象，array-数组';
COMMENT ON COLUMN admin_system_configs.is_encrypted IS '是否加密存储';
COMMENT ON COLUMN admin_system_configs.is_sensitive IS '是否敏感信息';
COMMENT ON COLUMN admin_system_configs.is_system_config IS '是否为系统配置';
COMMENT ON COLUMN admin_system_configs.is_readonly IS '是否只读';
COMMENT ON COLUMN admin_system_configs.requires_restart IS '是否需要重启生效';
COMMENT ON COLUMN admin_system_configs.validation_rules IS '验证规则';
COMMENT ON COLUMN admin_system_configs.min_value IS '最小值';
COMMENT ON COLUMN admin_system_configs.max_value IS '最大值';
COMMENT ON COLUMN admin_system_configs.allowed_values IS '允许的值列表';
COMMENT ON COLUMN admin_system_configs.regex_pattern IS '正则表达式验证模式';
COMMENT ON COLUMN admin_system_configs.display_name IS '显示名称';
COMMENT ON COLUMN admin_system_configs.description IS '配置描述';
COMMENT ON COLUMN admin_system_configs.help_text IS '帮助文本';
COMMENT ON COLUMN admin_system_configs.config_group IS '配置分组';
COMMENT ON COLUMN admin_system_configs.sort_order IS '排序顺序';
COMMENT ON COLUMN admin_system_configs.environment IS '适用环境：development-开发，staging-测试，production-生产，all-全部';
COMMENT ON COLUMN admin_system_configs.version IS '配置版本号';
COMMENT ON COLUMN admin_system_configs.is_active IS '是否启用';
COMMENT ON COLUMN admin_system_configs.requires_permission IS '所需权限';
COMMENT ON COLUMN admin_system_configs.editable_by_roles IS '可编辑的角色列表';
COMMENT ON COLUMN admin_system_configs.updated_by IS '最后更新人';

-- 7.4 系统监控和性能统计表
CREATE TABLE admin_system_metrics (
    id BIGSERIAL PRIMARY KEY,
    
    -- 监控时间
    metric_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    collection_interval_seconds INTEGER NOT NULL DEFAULT 60,
    
    -- 系统指标
    metric_type VARCHAR(50) NOT NULL
        CHECK (metric_type IN (
            'CPU_USAGE', 'MEMORY_USAGE', 'DISK_USAGE', 'NETWORK_IO',
            'DATABASE_CONNECTIONS', 'DATABASE_SLOW_QUERIES', 'DATABASE_LOCKS',
            'API_RESPONSE_TIME', 'API_REQUEST_COUNT', 'API_ERROR_RATE',
            'CACHE_HIT_RATE', 'CACHE_MEMORY_USAGE', 'QUEUE_SIZE',
            'ACTIVE_USERS', 'ACTIVE_SESSIONS', 'ERROR_COUNT',
            'UPTIME', 'THREAD_COUNT', 'GC_STATS'
        )),
    
    -- 指标数据
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_unit VARCHAR(20),
    metric_tags JSONB,
    
    -- 性能指标
    percentile_50 DECIMAL(15,6),
    percentile_90 DECIMAL(15,6),
    percentile_95 DECIMAL(15,6),
    percentile_99 DECIMAL(15,6),
    min_value DECIMAL(15,6),
    max_value DECIMAL(15,6),
    avg_value DECIMAL(15,6),
    
    -- 状态信息
    status VARCHAR(20) DEFAULT 'normal'
        CHECK (status IN ('normal', 'warning', 'critical', 'unknown')),
    threshold_warning DECIMAL(15,6),
    threshold_critical DECIMAL(15,6),
    
    -- 上下文信息
    server_id VARCHAR(100),
    instance_id VARCHAR(100),
    environment VARCHAR(20),
    
    -- 元数据
    measurement_method VARCHAR(50),
    calculation_details JSONB,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 检查约束
    CONSTRAINT admin_system_metrics_interval_positive 
        CHECK (collection_interval_seconds > 0),
    CONSTRAINT admin_system_metrics_value_valid 
        CHECK (metric_value >= 0),
    CONSTRAINT admin_system_metrics_percentile_valid 
        CHECK (
            (percentile_50 IS NULL OR (percentile_50 >= 0 AND percentile_50 <= 100)) AND
            (percentile_90 IS NULL OR (percentile_90 >= 0 AND percentile_90 <= 100)) AND
            (percentile_95 IS NULL OR (percentile_95 >= 0 AND percentile_95 <= 100)) AND
            (percentile_99 IS NULL OR (percentile_99 >= 0 AND percentile_99 <= 100))
        )
);

COMMENT ON TABLE admin_system_metrics IS '系统监控和性能统计表，记录系统各种性能指标';
COMMENT ON COLUMN admin_system_metrics.id IS '指标记录唯一标识';
COMMENT ON COLUMN admin_system_metrics.metric_timestamp IS '指标采集时间';
COMMENT ON COLUMN admin_system_metrics.collection_interval_seconds IS '采集间隔（秒）';
COMMENT ON COLUMN admin_system_metrics.metric_type IS '指标类型：CPU使用率、内存使用率等';
COMMENT ON COLUMN admin_system_metrics.metric_name IS '指标名称';
COMMENT ON COLUMN admin_system_metrics.metric_value IS '指标值';
COMMENT ON COLUMN admin_system_metrics.metric_unit IS '指标单位';
COMMENT ON COLUMN admin_system_metrics.metric_tags IS '指标标签，JSON格式';
COMMENT ON COLUMN admin_system_metrics.percentile_50 IS '50分位数';
COMMENT ON COLUMN admin_system_metrics.percentile_90 IS '90分位数';
COMMENT ON COLUMN admin_system_metrics.percentile_95 IS '95分位数';
COMMENT ON COLUMN admin_system_metrics.percentile_99 IS '99分位数';
COMMENT ON COLUMN admin_system_metrics.min_value IS '最小值';
COMMENT ON COLUMN admin_system_metrics.max_value IS '最大值';
COMMENT ON COLUMN admin_system_metrics.avg_value IS '平均值';
COMMENT ON COLUMN admin_system_metrics.status IS '状态：normal-正常，warning-警告，critical-严重，unknown-未知';
COMMENT ON COLUMN admin_system_metrics.threshold_warning IS '警告阈值';
COMMENT ON COLUMN admin_system_metrics.threshold_critical IS '严重阈值';
COMMENT ON COLUMN admin_system_metrics.server_id IS '服务器ID';
COMMENT ON COLUMN admin_system_metrics.instance_id IS '实例ID';
COMMENT ON COLUMN admin_system_metrics.environment IS '环境类型';
COMMENT ON COLUMN admin_system_metrics.measurement_method IS '测量方法';
COMMENT ON COLUMN admin_system_metrics.calculation_details IS '计算详情';

-- 7.5 数据统计和分析表
CREATE TABLE admin_analytics_reports (
    id BIGSERIAL PRIMARY KEY,
    
    -- 报告基本信息
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL
        CHECK (report_type IN (
            'USER_ANALYTICS', 'DORM_ANALYTICS', 'EXPENSE_ANALYTICS',
            'FINANCIAL_REPORT', 'OPERATIONAL_REPORT', 'PERFORMANCE_REPORT',
            'USAGE_REPORT', 'TREND_ANALYSIS', 'CUSTOM_REPORT'
        )),
    
    -- 报告参数
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    report_frequency VARCHAR(20) NOT NULL DEFAULT 'on_demand'
        CHECK (report_frequency IN ('real_time', 'hourly', 'daily', 'weekly', 'monthly', 'on_demand')),
    
    -- 数据源和范围
    data_source_tables TEXT[] NOT NULL,
    filter_conditions JSONB,
    group_by_fields TEXT[],
    aggregation_functions JSONB,
    
    -- 报告内容
    report_data JSONB NOT NULL,
    summary_statistics JSONB,
    key_insights TEXT[],
    recommendations TEXT[],
    
    -- 报告格式
    report_format VARCHAR(20) NOT NULL DEFAULT 'json'
        CHECK (report_format IN ('json', 'csv', 'excel', 'pdf', 'html')),
    file_url TEXT,
    file_size_bytes BIGINT,
    
    -- 报告状态
    generation_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed', 'cancelled')),
    generation_progress INTEGER DEFAULT 0 CHECK (generation_progress >= 0 AND generation_progress <= 100),
    
    -- 执行信息
    generated_by BIGINT NOT NULL,
    generated_username VARCHAR(50) NOT NULL,
    generation_started_at TIMESTAMP WITH TIME ZONE,
    generation_completed_at TIMESTAMP WITH TIME ZONE,
    generation_duration_seconds INTEGER,
    
    -- 报告属性
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_config JSONB,
    auto_refresh BOOLEAN NOT NULL DEFAULT FALSE,
    refresh_interval_minutes INTEGER,
    
    -- 访问控制
    access_permissions JSONB,
    allowed_roles TEXT[],
    allowed_users BIGINT[],
    
    -- 报告元数据
    report_version INTEGER DEFAULT 1,
    template_used VARCHAR(100),
    custom_parameters JSONB,
    
    -- 导出和分享
    export_count INTEGER DEFAULT 0,
    last_exported_at TIMESTAMP WITH TIME ZONE,
    last_exported_by BIGINT,
    share_links JSONB,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_admin_analytics_reports_generated_by 
        FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_analytics_reports_last_exported_by 
        FOREIGN KEY (last_exported_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CONSTRAINT admin_analytics_reports_period_valid 
        CHECK (report_period_end >= report_period_start),
    CONSTRAINT admin_analytics_reports_size_positive 
        CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    CONSTRAINT admin_analytics_reports_duration_positive 
        CHECK (generation_duration_seconds IS NULL OR generation_duration_seconds >= 0)
);

COMMENT ON TABLE admin_analytics_reports IS '数据统计和分析表，为管理后台提供数据统计功能';
COMMENT ON COLUMN admin_analytics_reports.id IS '报告唯一标识';
COMMENT ON COLUMN admin_analytics_reports.report_name IS '报告名称';
COMMENT ON COLUMN admin_analytics_reports.report_type IS '报告类型：用户分析、宿舍分析、费用分析等';
COMMENT ON COLUMN admin_analytics_reports.report_period_start IS '报告开始日期';
COMMENT ON COLUMN admin_analytics_reports.report_period_end IS '报告结束日期';
COMMENT ON COLUMN admin_analytics_reports.report_frequency IS '报告频率：实时、每小时、每天、每周、每月、按需';
COMMENT ON COLUMN admin_analytics_reports.data_source_tables IS '数据源表列表';
COMMENT ON COLUMN admin_analytics_reports.filter_conditions IS '过滤条件';
COMMENT ON COLUMN admin_analytics_reports.group_by_fields IS '分组字段';
COMMENT ON COLUMN admin_analytics_reports.aggregation_functions IS '聚合函数配置';
COMMENT ON COLUMN admin_analytics_reports.report_data IS '报告数据，JSON格式存储';
COMMENT ON COLUMN admin_analytics_reports.summary_statistics IS '汇总统计信息';
COMMENT ON COLUMN admin_analytics_reports.key_insights IS '关键洞察';
COMMENT ON COLUMN admin_analytics_reports.recommendations IS '建议信息';
COMMENT ON COLUMN admin_analytics_reports.report_format IS '报告格式：JSON、CSV、Excel、PDF、HTML';
COMMENT ON COLUMN admin_analytics_reports.file_url IS '文件URL';
COMMENT ON COLUMN admin_analytics_reports.file_size_bytes IS '文件大小';
COMMENT ON COLUMN admin_analytics_reports.generation_status IS '生成状态：pending-待生成，generating-生成中，completed-已完成，failed-失败，cancelled-已取消';
COMMENT ON COLUMN admin_analytics_reports.generation_progress IS '生成进度百分比';
COMMENT ON COLUMN admin_analytics_reports.generated_by IS '生成人ID';
COMMENT ON COLUMN admin_analytics_reports.generated_username IS '生成人用户名';
COMMENT ON COLUMN admin_analytics_reports.generation_started_at IS '生成开始时间';
COMMENT ON COLUMN admin_analytics_reports.generation_completed_at IS '生成完成时间';
COMMENT ON COLUMN admin_analytics_reports.generation_duration_seconds IS '生成耗时（秒）';
COMMENT ON COLUMN admin_analytics_reports.is_public IS '是否公开';
COMMENT ON COLUMN admin_analytics_reports.is_scheduled IS '是否定时生成';
COMMENT ON COLUMN admin_analytics_reports.schedule_config IS '定时配置';
COMMENT ON COLUMN admin_analytics_reports.auto_refresh IS '是否自动刷新';
COMMENT ON COLUMN admin_analytics_reports.refresh_interval_minutes IS '刷新间隔（分钟）';
COMMENT ON COLUMN admin_analytics_reports.access_permissions IS '访问权限配置';
COMMENT ON COLUMN admin_analytics_reports.allowed_roles IS '允许的角色列表';
COMMENT ON COLUMN admin_analytics_reports.allowed_users IS '允许的用户列表';
COMMENT ON COLUMN admin_analytics_reports.report_version IS '报告版本';
COMMENT ON COLUMN admin_analytics_reports.template_used IS '使用的模板';
COMMENT ON COLUMN admin_analytics_reports.custom_parameters IS '自定义参数';
COMMENT ON COLUMN admin_analytics_reports.export_count IS '导出次数';
COMMENT ON COLUMN admin_analytics_reports.last_exported_at IS '最后导出时间';
COMMENT ON COLUMN admin_analytics_reports.last_exported_by IS '最后导出人';
COMMENT ON COLUMN admin_analytics_reports.share_links IS '分享链接';

-- ============================================================
-- 8. 创建索引以优化查询性能
-- ============================================================

-- 管理员操作日志索引
CREATE INDEX idx_admin_operationlogs_operator_timestamp ON admin_operationlogs(operator_id, operation_timestamp DESC);
CREATE INDEX idx_admin_operationlogs_type_timestamp ON admin_operationlogs(operation_type, operation_timestamp DESC);
CREATE INDEX idx_admin_operationlogs_module_timestamp ON admin_operationlogs(operation_module, operation_timestamp DESC);
CREATE INDEX idx_admin_operationlogs_target ON admin_operationlogs(target_table, target_record_id);
CREATE INDEX idx_admin_operationlogs_status_timestamp ON admin_operationlogs(operation_status, operation_timestamp DESC);
CREATE INDEX idx_admin_operationlogs_ip ON admin_operationlogs(operator_ip);

-- 数据备份记录索引
CREATE INDEX idx_admin_backup_records_status ON admin_backup_records(backup_status);
CREATE INDEX idx_admin_backup_records_type ON admin_backup_records(backup_type);
CREATE INDEX idx_admin_backup_records_initiated_by ON admin_backup_records(initiated_by);
CREATE INDEX idx_admin_backup_records_timestamp ON admin_backup_records(created_at DESC);
CREATE INDEX idx_admin_backup_records_retention ON admin_backup_records(auto_delete_at) WHERE auto_delete_at IS NOT NULL;
CREATE INDEX idx_admin_backup_records_restore ON admin_backup_records(can_restore, last_restored_at);

-- 系统配置索引
CREATE INDEX idx_admin_system_configs_category ON admin_system_configs(config_category);
CREATE INDEX idx_admin_system_configs_key ON admin_system_configs(config_key);
CREATE INDEX idx_admin_system_configs_active ON admin_system_configs(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_admin_system_configs_environment ON admin_system_configs(environment);
CREATE INDEX idx_admin_system_configs_updated_by ON admin_system_configs(updated_by);

-- 系统监控指标索引
CREATE INDEX idx_admin_system_metrics_type_timestamp ON admin_system_metrics(metric_type, metric_timestamp DESC);
CREATE INDEX idx_admin_system_metrics_timestamp ON admin_system_metrics(metric_timestamp DESC);
CREATE INDEX idx_admin_system_metrics_server ON admin_system_metrics(server_id, metric_timestamp DESC);
CREATE INDEX idx_admin_system_metrics_status ON admin_system_metrics(status, metric_timestamp DESC);
CREATE INDEX idx_admin_system_metrics_name ON admin_system_metrics(metric_name, metric_timestamp DESC);

-- 数据统计报告索引
CREATE INDEX idx_admin_analytics_reports_type ON admin_analytics_reports(report_type);
CREATE INDEX idx_admin_analytics_reports_period ON admin_analytics_reports(report_period_start, report_period_end);
CREATE INDEX idx_admin_analytics_reports_generated_by ON admin_analytics_reports(generated_by);
CREATE INDEX idx_admin_analytics_reports_status ON admin_analytics_reports(generation_status);
CREATE INDEX idx_admin_analytics_reports_created ON admin_analytics_reports(created_at DESC);

-- ============================================================
-- 9. 预算管理模块
-- ============================================================

-- 9.1 预算类别表
CREATE TABLE budget_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id BIGINT,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_budget_categories_parent_id 
        FOREIGN KEY (parent_id) REFERENCES budget_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_budget_categories_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_budget_categories_name_parent UNIQUE(name, parent_id)
);

COMMENT ON TABLE budget_categories IS '预算类别表，存储预算分类信息，支持多级分类';
COMMENT ON COLUMN budget_categories.id IS '预算类别唯一标识';
COMMENT ON COLUMN budget_categories.name IS '预算类别名称';
COMMENT ON COLUMN budget_categories.description IS '预算类别描述';
COMMENT ON COLUMN budget_categories.parent_id IS '父类别ID，支持多级分类';
COMMENT ON COLUMN budget_categories.level IS '类别层级，1-5级';
COMMENT ON COLUMN budget_categories.sort_order IS '排序顺序';
COMMENT ON COLUMN budget_categories.icon IS '类别图标';
COMMENT ON COLUMN budget_categories.color IS '类别颜色';
COMMENT ON COLUMN budget_categories.is_active IS '是否启用';
COMMENT ON COLUMN budget_categories.created_by IS '创建人ID';
COMMENT ON COLUMN budget_categories.created_at IS '创建时间';
COMMENT ON COLUMN budget_categories.updated_at IS '更新时间';

-- 9.2 预算表
CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id BIGINT NOT NULL,
    budget_type VARCHAR(50) NOT NULL
        CHECK (budget_type IN (
            'ANNUAL', 'QUARTERLY', 'MONTHLY', 'WEEKLY', 'DAILY', 'PROJECT', 'EVENT'
        )),
    budget_period_start DATE NOT NULL,
    budget_period_end DATE NOT NULL,
    budget_amount DECIMAL(15,2) NOT NULL CHECK (budget_amount > 0),
    used_amount DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (used_amount >= 0),
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (budget_amount - used_amount) STORED,
    usage_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN budget_amount > 0 THEN (used_amount / budget_amount * 100) ELSE 0 END
    ) STORED,
    warning_threshold DECIMAL(5,2) NOT NULL DEFAULT 80 CHECK (warning_threshold > 0 AND warning_threshold <= 100),
    critical_threshold DECIMAL(5,2) NOT NULL DEFAULT 95 CHECK (critical_threshold > 0 AND critical_threshold <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    can_exceed BOOLEAN NOT NULL DEFAULT FALSE,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    renew_days_before INTEGER,
    approved_by BIGINT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_comment TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_budgets_category_id 
        FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_budgets_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_budgets_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 检查约束
    CONSTRAINT budgets_period_valid CHECK (budget_period_end >= budget_period_start),
    CONSTRAINT budgets_threshold_valid CHECK (critical_threshold >= warning_threshold)
);

COMMENT ON TABLE budgets IS '预算表，存储各类预算信息，支持多维度预算管理';
COMMENT ON COLUMN budgets.id IS '预算唯一标识';
COMMENT ON COLUMN budgets.name IS '预算名称';
COMMENT ON COLUMN budgets.description IS '预算描述';
COMMENT ON COLUMN budgets.category_id IS '预算类别ID';
COMMENT ON COLUMN budgets.budget_type IS '预算类型：年度、季度、月度、周度、日度、项目、事件';
COMMENT ON COLUMN budgets.budget_period_start IS '预算期间开始日期';
COMMENT ON COLUMN budgets.budget_period_end IS '预算期间结束日期';
COMMENT ON COLUMN budgets.budget_amount IS '预算金额';
COMMENT ON COLUMN budgets.used_amount IS '已使用金额';
COMMENT ON COLUMN budgets.remaining_amount IS '剩余金额（计算字段）';
COMMENT ON COLUMN budgets.usage_percentage IS '使用百分比（计算字段）';
COMMENT ON COLUMN budgets.warning_threshold IS '预警阈值百分比';
COMMENT ON COLUMN budgets.critical_threshold IS '严重预警阈值百分比';
COMMENT ON COLUMN budgets.status IS '预算状态：active-激活，inactive-未激活，completed-已完成，cancelled-已取消';
COMMENT ON COLUMN budgets.is_public IS '是否公开';
COMMENT ON COLUMN budgets.can_exceed IS '是否允许超支';
COMMENT ON COLUMN budgets.auto_renew IS '是否自动续期';
COMMENT ON COLUMN budgets.renew_days_before IS '提前续期天数';
COMMENT ON COLUMN budgets.approved_by IS '审批人ID';
COMMENT ON COLUMN budgets.approved_at IS '审批时间';
COMMENT ON COLUMN budgets.approval_comment IS '审批意见';
COMMENT ON COLUMN budgets.created_by IS '创建人ID';
COMMENT ON COLUMN budgets.created_at IS '创建时间';
COMMENT ON COLUMN budgets.updated_at IS '更新时间';

-- 9.3 预算使用记录表
CREATE TABLE budget_usage_records (
    id BIGSERIAL PRIMARY KEY,
    budget_id BIGINT NOT NULL,
    expense_id BIGINT,
    usage_amount DECIMAL(15,2) NOT NULL CHECK (usage_amount > 0),
    usage_type VARCHAR(50) NOT NULL
        CHECK (usage_type IN (
            'EXPENSE', 'ADJUSTMENT', 'REFUND', 'TRANSFER_IN', 'TRANSFER_OUT', 'CORRECTION'
        )),
    usage_description TEXT,
    related_document_id BIGINT,
    related_document_type VARCHAR(50),
    usage_date DATE NOT NULL,
    recorded_by BIGINT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_budget_usage_records_budget_id 
        FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
    CONSTRAINT fk_budget_usage_records_expense_id 
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
    CONSTRAINT fk_budget_usage_records_recorded_by 
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE budget_usage_records IS '预算使用记录表，记录预算的每一笔使用情况';
COMMENT ON COLUMN budget_usage_records.id IS '使用记录唯一标识';
COMMENT ON COLUMN budget_usage_records.budget_id IS '预算ID';
COMMENT ON COLUMN budget_usage_records.expense_id IS '关联费用ID';
COMMENT ON COLUMN budget_usage_records.usage_amount IS '使用金额';
COMMENT ON COLUMN budget_usage_records.usage_type IS '使用类型：费用、调整、退款、转入、转出、更正';
COMMENT ON COLUMN budget_usage_records.usage_description IS '使用描述';
COMMENT ON COLUMN budget_usage_records.related_document_id IS '关联文档ID';
COMMENT ON COLUMN budget_usage_records.related_document_type IS '关联文档类型';
COMMENT ON COLUMN budget_usage_records.usage_date IS '使用日期';
COMMENT ON COLUMN budget_usage_records.recorded_by IS '记录人ID';
COMMENT ON COLUMN budget_usage_records.recorded_at IS '记录时间';

-- 9.4 预算预警记录表
CREATE TABLE budget_alerts (
    id BIGSERIAL PRIMARY KEY,
    budget_id BIGINT NOT NULL,
    alert_type VARCHAR(20) NOT NULL
        CHECK (alert_type IN ('warning', 'critical', 'exceeded')),
    alert_level VARCHAR(20) NOT NULL
        CHECK (alert_level IN ('info', 'warning', 'error', 'critical')),
    current_usage_percentage DECIMAL(5,2) NOT NULL,
    current_usage_amount DECIMAL(15,2) NOT NULL,
    budget_amount DECIMAL(15,2) NOT NULL,
    threshold_percentage DECIMAL(5,2) NOT NULL,
    alert_message TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by BIGINT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_comment TEXT,
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    notification_channels TEXT[],
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_budget_alerts_budget_id 
        FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
    CONSTRAINT fk_budget_alerts_resolved_by 
        FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE budget_alerts IS '预算预警记录表，记录预算预警信息';
COMMENT ON COLUMN budget_alerts.id IS '预警记录唯一标识';
COMMENT ON COLUMN budget_alerts.budget_id IS '预算ID';
COMMENT ON COLUMN budget_alerts.alert_type IS '预警类型：warning-预警，critical-严重预警，exceeded-超支';
COMMENT ON COLUMN budget_alerts.alert_level IS '预警级别：info-信息，warning-警告，error-错误，critical-严重';
COMMENT ON COLUMN budget_alerts.current_usage_percentage IS '当前使用百分比';
COMMENT ON COLUMN budget_alerts.current_usage_amount IS '当前使用金额';
COMMENT ON COLUMN budget_alerts.budget_amount IS '预算金额';
COMMENT ON COLUMN budget_alerts.threshold_percentage IS '阈值百分比';
COMMENT ON COLUMN budget_alerts.alert_message IS '预警消息';
COMMENT ON COLUMN budget_alerts.is_resolved IS '是否已解决';
COMMENT ON COLUMN budget_alerts.resolved_by IS '解决人ID';
COMMENT ON COLUMN budget_alerts.resolved_at IS '解决时间';
COMMENT ON COLUMN budget_alerts.resolution_comment IS '解决说明';
COMMENT ON COLUMN budget_alerts.notification_sent IS '是否已发送通知';
COMMENT ON COLUMN budget_alerts.notification_channels IS '通知渠道';
COMMENT ON COLUMN budget_alerts.notification_sent_at IS '通知发送时间';
COMMENT ON COLUMN budget_alerts.created_at IS '创建时间';

-- ============================================================
-- 10. 多级审批流程模块
-- ============================================================

-- 10.1 审批流程模板表
CREATE TABLE approval_workflow_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    workflow_type VARCHAR(50) NOT NULL
        CHECK (workflow_type IN (
            'EXPENSE_APPROVAL', 'BUDGET_APPROVAL', 'REIMBURSEMENT_APPROVAL', 
            'MAINTENANCE_APPROVAL', 'PURCHASE_APPROVAL', 'LEAVE_APPROVAL',
            'OVERTIME_APPROVAL', 'TRAVEL_APPROVAL', 'GENERAL_APPROVAL'
        )),
    department_id BIGINT,
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    conditions JSONB,
    timeout_hours INTEGER DEFAULT 72 CHECK (timeout_hours > 0),
    auto_approve_conditions JSONB,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_approval_workflow_templates_department_id 
        FOREIGN KEY (department_id) REFERENCES dorms(id) ON DELETE SET NULL,
    CONSTRAINT fk_approval_workflow_templates_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_approval_workflow_templates_name_type UNIQUE(name, workflow_type)
);

COMMENT ON TABLE approval_workflow_templates IS '审批流程模板表，存储各类审批流程模板';
COMMENT ON COLUMN approval_workflow_templates.id IS '审批流程模板唯一标识';
COMMENT ON COLUMN approval_workflow_templates.name IS '模板名称';
COMMENT ON COLUMN approval_workflow_templates.description IS '模板描述';
COMMENT ON COLUMN approval_workflow_templates.workflow_type IS '流程类型：费用审批、预算审批、报销审批等';
COMMENT ON COLUMN approval_workflow_templates.department_id IS '适用部门ID';
COMMENT ON COLUMN approval_workflow_templates.priority IS '优先级';
COMMENT ON COLUMN approval_workflow_templates.is_default IS '是否默认模板';
COMMENT ON COLUMN approval_workflow_templates.is_active IS '是否激活';
COMMENT ON COLUMN approval_workflow_templates.conditions IS '触发条件，JSON格式';
COMMENT ON COLUMN approval_workflow_templates.timeout_hours IS '超时时间（小时）';
COMMENT ON COLUMN approval_workflow_templates.auto_approve_conditions IS '自动审批条件，JSON格式';
COMMENT ON COLUMN approval_workflow_templates.created_by IS '创建人ID';
COMMENT ON COLUMN approval_workflow_templates.created_at IS '创建时间';
COMMENT ON COLUMN approval_workflow_templates.updated_at IS '更新时间';

-- 10.2 审批流程步骤表
CREATE TABLE approval_workflow_steps (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL CHECK (step_order > 0),
    step_type VARCHAR(50) NOT NULL
        CHECK (step_type IN (
            'APPROVAL', 'REVIEW', 'NOTIFICATION', 'CONDITIONAL', 'PARALLEL', 'SEQUENTIAL'
        )),
    approver_type VARCHAR(50) NOT NULL
        CHECK (approver_type IN (
            'SPECIFIC_USER', 'ROLE', 'DEPARTMENT_HEAD', 'POSITION', 'FORMULA', 'EXTERNAL'
        )),
    approver_config JSONB NOT NULL,
    approval_action VARCHAR(50) NOT NULL
        CHECK (approval_action IN (
            'APPROVE', 'REJECT', 'RETURN', 'DELEGATE', 'SKIP', 'ESCALATE'
        )),
    approval_conditions JSONB,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    can_delegate BOOLEAN NOT NULL DEFAULT TRUE,
    timeout_hours INTEGER DEFAULT 24 CHECK (timeout_hours > 0),
    escalation_config JSONB,
    notification_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_approval_workflow_steps_template_id 
        FOREIGN KEY (template_id) REFERENCES approval_workflow_templates(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_approval_workflow_steps_template_order UNIQUE(template_id, step_order)
);

COMMENT ON TABLE approval_workflow_steps IS '审批流程步骤表，存储审批流程的具体步骤';
COMMENT ON COLUMN approval_workflow_steps.id IS '审批流程步骤唯一标识';
COMMENT ON COLUMN approval_workflow_steps.template_id IS '审批流程模板ID';
COMMENT ON COLUMN approval_workflow_steps.step_name IS '步骤名称';
COMMENT ON COLUMN approval_workflow_steps.step_order IS '步骤顺序';
COMMENT ON COLUMN approval_workflow_steps.step_type IS '步骤类型：审批、审核、通知、条件、并行、串行';
COMMENT ON COLUMN approval_workflow_steps.approver_type IS '审批人类型：特定用户、角色、部门主管、职位、公式、外部';
COMMENT ON COLUMN approval_workflow_steps.approver_config IS '审批人配置，JSON格式';
COMMENT ON COLUMN approval_workflow_steps.approval_action IS '审批动作：批准、拒绝、退回、委托、跳过、升级';
COMMENT ON COLUMN approval_workflow_steps.approval_conditions IS '审批条件，JSON格式';
COMMENT ON COLUMN approval_workflow_steps.is_required IS '是否必需步骤';
COMMENT ON COLUMN approval_workflow_steps.can_delegate IS '是否可以委托';
COMMENT ON COLUMN approval_workflow_steps.timeout_hours IS '超时时间（小时）';
COMMENT ON COLUMN approval_workflow_steps.escalation_config IS '升级配置，JSON格式';
COMMENT ON COLUMN approval_workflow_steps.notification_config IS '通知配置，JSON格式';
COMMENT ON COLUMN approval_workflow_steps.created_at IS '创建时间';
COMMENT ON COLUMN approval_workflow_steps.updated_at IS '更新时间';

-- 10.3 审批流程实例表
CREATE TABLE approval_workflow_instances (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    instance_name VARCHAR(200) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    business_id BIGINT NOT NULL,
    business_title VARCHAR(500),
    business_description TEXT,
    initiator_id BIGINT NOT NULL,
    initiator_name VARCHAR(50) NOT NULL,
    current_step_id BIGINT,
    current_step_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending', 'in_progress', 'completed', 'rejected', 'cancelled', 'escalated', 'timeout'
        )),
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    total_steps INTEGER NOT NULL,
    completed_steps INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    timeout_at TIMESTAMP WITH TIME ZONE,
    business_data JSONB,
    context_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_approval_workflow_instances_template_id 
        FOREIGN KEY (template_id) REFERENCES approval_workflow_templates(id) ON DELETE RESTRICT,
    CONSTRAINT fk_approval_workflow_instances_current_step_id 
        FOREIGN KEY (current_step_id) REFERENCES approval_workflow_steps(id) ON DELETE SET NULL,
    CONSTRAINT fk_approval_workflow_instances_initiator_id 
        FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE approval_workflow_instances IS '审批流程实例表，存储具体的审批流程实例';
COMMENT ON COLUMN approval_workflow_instances.id IS '审批流程实例唯一标识';
COMMENT ON COLUMN approval_workflow_instances.template_id IS '审批流程模板ID';
COMMENT ON COLUMN approval_workflow_instances.instance_name IS '实例名称';
COMMENT ON COLUMN approval_workflow_instances.workflow_type IS '流程类型';
COMMENT ON COLUMN approval_workflow_instances.business_type IS '业务类型';
COMMENT ON COLUMN approval_workflow_instances.business_id IS '业务ID';
COMMENT ON COLUMN approval_workflow_instances.business_title IS '业务标题';
COMMENT ON COLUMN approval_workflow_instances.business_description IS '业务描述';
COMMENT ON COLUMN approval_workflow_instances.initiator_id IS '发起人ID';
COMMENT ON COLUMN approval_workflow_instances.initiator_name IS '发起人姓名';
COMMENT ON COLUMN approval_workflow_instances.current_step_id IS '当前步骤ID';
COMMENT ON COLUMN approval_workflow_instances.current_step_name IS '当前步骤名称';
COMMENT ON COLUMN approval_workflow_instances.status IS '状态：pending-待处理，in_progress-进行中，completed-已完成，rejected-已拒绝，cancelled-已取消，escalated-已升级，timeout-超时';
COMMENT ON COLUMN approval_workflow_instances.priority IS '优先级';
COMMENT ON COLUMN approval_workflow_instances.total_steps IS '总步骤数';
COMMENT ON COLUMN approval_workflow_instances.completed_steps IS '已完成步骤数';
COMMENT ON COLUMN approval_workflow_instances.started_at IS '开始时间';
COMMENT ON COLUMN approval_workflow_instances.completed_at IS '完成时间';
COMMENT ON COLUMN approval_workflow_instances.timeout_at IS '超时时间';
COMMENT ON COLUMN approval_workflow_instances.business_data IS '业务数据，JSON格式';
COMMENT ON COLUMN approval_workflow_instances.context_data IS '上下文数据，JSON格式';
COMMENT ON COLUMN approval_workflow_instances.created_at IS '创建时间';
COMMENT ON COLUMN approval_workflow_instances.updated_at IS '更新时间';

-- 10.4 审批记录表
CREATE TABLE approval_records (
    id BIGSERIAL PRIMARY KEY,
    instance_id BIGINT NOT NULL,
    step_id BIGINT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    approver_id BIGINT NOT NULL,
    approver_name VARCHAR(50) NOT NULL,
    approver_role VARCHAR(50),
    action VARCHAR(50) NOT NULL
        CHECK (action IN (
            'APPROVE', 'REJECT', 'RETURN', 'DELEGATE', 'SKIP', 'ESCALATE', 'COMMENT'
        )),
    decision VARCHAR(20) NOT NULL
        CHECK (decision IN ('approved', 'rejected', 'returned', 'delegated', 'skipped', 'escalated')),
    comments TEXT,
    attachments TEXT[],
    approval_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    delegated_to_id BIGINT,
    delegated_to_name VARCHAR(50),
    delegation_reason TEXT,
    next_step_id BIGINT,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_approval_records_instance_id 
        FOREIGN KEY (instance_id) REFERENCES approval_workflow_instances(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_records_step_id 
        FOREIGN KEY (step_id) REFERENCES approval_workflow_steps(id) ON DELETE RESTRICT,
    CONSTRAINT fk_approval_records_approver_id 
        FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_records_delegated_to_id 
        FOREIGN KEY (delegated_to_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_approval_records_next_step_id 
        FOREIGN KEY (next_step_id) REFERENCES approval_workflow_steps(id) ON DELETE SET NULL
);

COMMENT ON TABLE approval_records IS '审批记录表，存储每个审批步骤的审批记录';
COMMENT ON COLUMN approval_records.id IS '审批记录唯一标识';
COMMENT ON COLUMN approval_records.instance_id IS '审批流程实例ID';
COMMENT ON COLUMN approval_records.step_id IS '审批步骤ID';
COMMENT ON COLUMN approval_records.step_name IS '步骤名称';
COMMENT ON COLUMN approval_records.step_order IS '步骤顺序';
COMMENT ON COLUMN approval_records.approver_id IS '审批人ID';
COMMENT ON COLUMN approval_records.approver_name IS '审批人姓名';
COMMENT ON COLUMN approval_records.approver_role IS '审批人角色';
COMMENT ON COLUMN approval_records.action IS '审批动作：批准、拒绝、退回、委托、跳过、升级、评论';
COMMENT ON COLUMN approval_records.decision IS '审批决定：approved-批准，rejected-拒绝，returned-退回，delegated-委托，skipped-跳过，escalated-升级';
COMMENT ON COLUMN approval_records.comments IS '审批意见';
COMMENT ON COLUMN approval_records.attachments IS '附件列表';
COMMENT ON COLUMN approval_records.approval_time IS '审批时间';
COMMENT ON COLUMN approval_records.delegated_to_id IS '委托对象ID';
COMMENT ON COLUMN approval_records.delegated_to_name IS '委托对象姓名';
COMMENT ON COLUMN approval_records.delegation_reason IS '委托原因';
COMMENT ON COLUMN approval_records.next_step_id IS '下一步骤ID';
COMMENT ON COLUMN approval_records.is_final IS '是否最终决定';
COMMENT ON COLUMN approval_records.created_at IS '创建时间';

-- ============================================================
-- 11. 增强报表统计模块
-- ============================================================

-- 11.1 报表模板表
CREATE TABLE report_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL
        CHECK (report_type IN (
            'FINANCIAL_SUMMARY', 'EXPENSE_ANALYSIS', 'BUDGET_ANALYSIS', 'CASH_FLOW',
            'DEPARTMENT_ANALYSIS', 'PROJECT_ANALYSIS', 'TIME_SERIES', 'COMPARATIVE',
            'TREND_ANALYSIS', 'PERFORMANCE_METRICS', 'CUSTOM'
        )),
    category VARCHAR(50) NOT NULL
        CHECK (category IN (
            'FINANCIAL', 'OPERATIONAL', 'MANAGEMENT', 'COMPLIANCE', 'STRATEGIC', 'CUSTOM'
        )),
    template_type VARCHAR(50) NOT NULL
        CHECK (template_type IN ('SYSTEM', 'CUSTOM', 'THIRD_PARTY')),
    data_source JSONB NOT NULL,
    query_config JSONB NOT NULL,
    chart_config JSONB,
    layout_config JSONB,
    filter_config JSONB,
    parameter_config JSONB,
    export_formats TEXT[] DEFAULT ARRAY['PDF', 'EXCEL', 'CSV'],
    schedule_config JSONB,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    tags TEXT[],
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_report_templates_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_report_templates_name_version UNIQUE(name, version)
);

COMMENT ON TABLE report_templates IS '报表模板表，存储各类报表模板定义';
COMMENT ON COLUMN report_templates.id IS '报表模板唯一标识';
COMMENT ON COLUMN report_templates.name IS '模板名称';
COMMENT ON COLUMN report_templates.description IS '模板描述';
COMMENT ON COLUMN report_templates.report_type IS '报表类型：财务汇总、费用分析、预算分析、现金流等';
COMMENT ON COLUMN report_templates.category IS '报表分类：财务、运营、管理、合规、战略、自定义';
COMMENT ON COLUMN report_templates.template_type IS '模板类型：系统、自定义、第三方';
COMMENT ON COLUMN report_templates.data_source IS '数据源配置，JSON格式';
COMMENT ON COLUMN report_templates.query_config IS '查询配置，JSON格式';
COMMENT ON COLUMN report_templates.chart_config IS '图表配置，JSON格式';
COMMENT ON COLUMN report_templates.layout_config IS '布局配置，JSON格式';
COMMENT ON COLUMN report_templates.filter_config IS '过滤器配置，JSON格式';
COMMENT ON COLUMN report_templates.parameter_config IS '参数配置，JSON格式';
COMMENT ON COLUMN report_templates.export_formats IS '导出格式列表';
COMMENT ON COLUMN report_templates.schedule_config IS '调度配置，JSON格式';
COMMENT ON COLUMN report_templates.is_public IS '是否公开';
COMMENT ON COLUMN report_templates.is_active IS '是否激活';
COMMENT ON COLUMN report_templates.version IS '版本号';
COMMENT ON COLUMN report_templates.tags IS '标签列表';
COMMENT ON COLUMN report_templates.created_by IS '创建人ID';
COMMENT ON COLUMN report_templates.created_at IS '创建时间';
COMMENT ON COLUMN report_templates.updated_at IS '更新时间';

-- 11.2 报表实例表
CREATE TABLE report_instances (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    description TEXT,
    parameters JSONB,
    filters JSONB,
    data_query TEXT,
    report_data JSONB,
    chart_data JSONB,
    file_path TEXT,
    file_size BIGINT,
    file_format VARCHAR(20),
    generation_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed', 'cancelled')),
    generation_progress INTEGER DEFAULT 0 CHECK (generation_progress >= 0 AND generation_progress <= 100),
    generation_started_at TIMESTAMP WITH TIME ZONE,
    generation_completed_at TIMESTAMP WITH TIME ZONE,
    generation_duration_seconds INTEGER,
    error_message TEXT,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_config JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_report_instances_template_id 
        FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE RESTRICT,
    CONSTRAINT fk_report_instances_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 检查约束
    CONSTRAINT report_instances_duration_positive 
        CHECK (generation_duration_seconds IS NULL OR generation_duration_seconds >= 0)
);

COMMENT ON TABLE report_instances IS '报表实例表，存储生成的报表实例';
COMMENT ON COLUMN report_instances.id IS '报表实例唯一标识';
COMMENT ON COLUMN report_instances.template_id IS '报表模板ID';
COMMENT ON COLUMN report_instances.name IS '报表名称';
COMMENT ON COLUMN report_instances.report_type IS '报表类型';
COMMENT ON COLUMN report_instances.description IS '报表描述';
COMMENT ON COLUMN report_instances.parameters IS '报表参数，JSON格式';
COMMENT ON COLUMN report_instances.filters IS '过滤器，JSON格式';
COMMENT ON COLUMN report_instances.data_query IS '数据查询语句';
COMMENT ON COLUMN report_instances.report_data IS '报表数据，JSON格式';
COMMENT ON COLUMN report_instances.chart_data IS '图表数据，JSON格式';
COMMENT ON COLUMN report_instances.file_path IS '文件路径';
COMMENT ON COLUMN report_instances.file_size IS '文件大小';
COMMENT ON COLUMN report_instances.file_format IS '文件格式';
COMMENT ON COLUMN report_instances.generation_status IS '生成状态：pending-待生成，generating-生成中，completed-已完成，failed-失败，cancelled-已取消';
COMMENT ON COLUMN report_instances.generation_progress IS '生成进度百分比';
COMMENT ON COLUMN report_instances.generation_started_at IS '生成开始时间';
COMMENT ON COLUMN report_instances.generation_completed_at IS '生成完成时间';
COMMENT ON COLUMN report_instances.generation_duration_seconds IS '生成耗时（秒）';
COMMENT ON COLUMN report_instances.error_message IS '错误信息';
COMMENT ON COLUMN report_instances.view_count IS '查看次数';
COMMENT ON COLUMN report_instances.download_count IS '下载次数';
COMMENT ON COLUMN report_instances.last_viewed_at IS '最后查看时间';
COMMENT ON COLUMN report_instances.is_public IS '是否公开';
COMMENT ON COLUMN report_instances.is_scheduled IS '是否定时生成';
COMMENT ON COLUMN report_instances.schedule_config IS '调度配置，JSON格式';
COMMENT ON COLUMN report_instances.expires_at IS '过期时间';
COMMENT ON COLUMN report_instances.created_by IS '创建人ID';
COMMENT ON COLUMN report_instances.created_at IS '创建时间';
COMMENT ON COLUMN report_instances.updated_at IS '更新时间';

-- 11.3 数据视图表
CREATE TABLE data_views (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    view_type VARCHAR(50) NOT NULL
        CHECK (view_type IN (
            'TABLE', 'CHART', 'DASHBOARD', 'KPI', 'GAUGE', 'HEATMAP', 'TREEMAP', 'PIVOT'
        )),
    data_source JSONB NOT NULL,
    query_config JSONB NOT NULL,
    visualization_config JSONB NOT NULL,
    filter_config JSONB,
    refresh_config JSONB,
    access_config JSONB,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    refresh_interval INTEGER DEFAULT 0 CHECK (refresh_interval >= 0),
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_data_views_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE data_views IS '数据视图表，存储各类数据视图定义';
COMMENT ON COLUMN data_views.id IS '数据视图唯一标识';
COMMENT ON COLUMN data_views.name IS '视图名称';
COMMENT ON COLUMN data_views.description IS '视图描述';
COMMENT ON COLUMN data_views.view_type IS '视图类型：表格、图表、仪表板、KPI、仪表盘、热力图、树状图、透视表';
COMMENT ON COLUMN data_views.data_source IS '数据源配置，JSON格式';
COMMENT ON COLUMN data_views.query_config IS '查询配置，JSON格式';
COMMENT ON COLUMN data_views.visualization_config IS '可视化配置，JSON格式';
COMMENT ON COLUMN data_views.filter_config IS '过滤器配置，JSON格式';
COMMENT ON COLUMN data_views.refresh_config IS '刷新配置，JSON格式';
COMMENT ON COLUMN data_views.access_config IS '访问权限配置，JSON格式';
COMMENT ON COLUMN data_views.is_public IS '是否公开';
COMMENT ON COLUMN data_views.is_active IS '是否激活';
COMMENT ON COLUMN data_views.refresh_interval IS '刷新间隔（分钟）';
COMMENT ON COLUMN data_views.last_refreshed_at IS '最后刷新时间';
COMMENT ON COLUMN data_views.created_by IS '创建人ID';
COMMENT ON COLUMN data_views.created_at IS '创建时间';
COMMENT ON COLUMN data_views.updated_at IS '更新时间';

-- ============================================================
-- 12. 创建索引以优化查询性能
-- ============================================================

-- 预算管理模块索引
CREATE INDEX idx_budget_categories_parent_id ON budget_categories(parent_id);
CREATE INDEX idx_budget_categories_level ON budget_categories(level);
CREATE INDEX idx_budget_categories_active ON budget_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_budget_categories_created_by ON budget_categories(created_by);

CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_type_period ON budgets(budget_type, budget_period_start, budget_period_end);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_amounts ON budgets(budget_amount, used_amount);
CREATE INDEX idx_budgets_thresholds ON budgets(warning_threshold, critical_threshold);
CREATE INDEX idx_budgets_created_by ON budgets(created_by);
CREATE INDEX idx_budgets_approved_by ON budgets(approved_by);

CREATE INDEX idx_budget_usage_records_budget_id ON budget_usage_records(budget_id);
CREATE INDEX idx_budget_usage_records_expense_id ON budget_usage_records(expense_id);
CREATE INDEX idx_budget_usage_records_type_date ON budget_usage_records(usage_type, usage_date);
CREATE INDEX idx_budget_usage_records_recorded_by ON budget_usage_records(recorded_by);

CREATE INDEX idx_budget_alerts_budget_id ON budget_alerts(budget_id);
CREATE INDEX idx_budget_alerts_type ON budget_alerts(alert_type);
CREATE INDEX idx_budget_alerts_level ON budget_alerts(alert_level);
CREATE INDEX idx_budget_alerts_resolved ON budget_alerts(is_resolved);
CREATE INDEX idx_budget_alerts_created ON budget_alerts(created_at DESC);

-- 多级审批流程模块索引
CREATE INDEX idx_approval_workflow_templates_type ON approval_workflow_templates(workflow_type);
CREATE INDEX idx_approval_workflow_templates_department ON approval_workflow_templates(department_id);
CREATE INDEX idx_approval_workflow_templates_active ON approval_workflow_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_approval_workflow_templates_default ON approval_workflow_templates(is_default) WHERE is_default = TRUE;

CREATE INDEX idx_approval_workflow_steps_template_id ON approval_workflow_steps(template_id);
CREATE INDEX idx_approval_workflow_steps_type ON approval_workflow_steps(step_type);
CREATE INDEX idx_approval_workflow_steps_order ON approval_workflow_steps(template_id, step_order);

CREATE INDEX idx_approval_workflow_instances_template_id ON approval_workflow_instances(template_id);
CREATE INDEX idx_approval_workflow_instances_business ON approval_workflow_instances(business_type, business_id);
CREATE INDEX idx_approval_workflow_instances_status ON approval_workflow_instances(status);
CREATE INDEX idx_approval_workflow_instances_initiator ON approval_workflow_instances(initiator_id);
CREATE INDEX idx_approval_workflow_instances_current_step ON approval_workflow_instances(current_step_id);
CREATE INDEX idx_approval_workflow_instances_started ON approval_workflow_instances(started_at DESC);

CREATE INDEX idx_approval_records_instance_id ON approval_records(instance_id);
CREATE INDEX idx_approval_records_step_id ON approval_records(step_id);
CREATE INDEX idx_approval_records_approver ON approval_records(approver_id);
CREATE INDEX idx_approval_records_decision ON approval_records(decision);
CREATE INDEX idx_approval_records_approval_time ON approval_records(approval_time DESC);

-- 增强报表统计模块索引
CREATE INDEX idx_report_templates_type ON report_templates(report_type);
CREATE INDEX idx_report_templates_category ON report_templates(category);
CREATE INDEX idx_report_templates_active ON report_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_report_templates_public ON report_templates(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_report_templates_created_by ON report_templates(created_by);

CREATE INDEX idx_report_instances_template_id ON report_instances(template_id);
CREATE INDEX idx_report_instances_type ON report_instances(report_type);
CREATE INDEX idx_report_instances_status ON report_instances(generation_status);
CREATE INDEX idx_report_instances_created_by ON report_instances(created_by);
CREATE INDEX idx_report_instances_public ON report_instances(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_report_instances_scheduled ON report_instances(is_scheduled) WHERE is_scheduled = TRUE;
CREATE INDEX idx_report_instances_created ON report_instances(created_at DESC);

CREATE INDEX idx_data_views_type ON data_views(view_type);
CREATE INDEX idx_data_views_active ON data_views(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_data_views_public ON data_views(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_data_views_created_by ON data_views(created_by);
CREATE INDEX idx_data_views_refresh_interval ON data_views(refresh_interval) WHERE refresh_interval > 0;
CREATE INDEX idx_data_views_last_refreshed ON data_views(last_refreshed_at DESC);

-- ============================================================
-- 数据库创建完成
-- ============================================================