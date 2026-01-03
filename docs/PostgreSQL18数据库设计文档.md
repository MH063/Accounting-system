# 会计管理系统数据库设计文档
## 基于PostgreSQL 18语言规范

### 文档信息
- **版本**: 1.0
- **创建日期**: 2024-01-01
- **数据库版本**: PostgreSQL 18
- **项目名称**: 会计管理系统
- **作者**: 数据库设计团队

---

## 1. 数据库设计概述

### 1.1 设计原则
- 严格遵循PostgreSQL 18语言规范
- 支持所有API接口功能需求
- 确保数据完整性和一致性
- 优化查询性能
- 支持水平扩展

### 1.2 核心模块
1. **用户认证模块** - 处理用户登录、注册、权限管理
2. **宿舍管理模块** - 管理宿舍信息和配置
3. **成员管理模块** - 管理宿舍成员关系
4. **费用管理模块** - 处理费用申请、审批、统计

---

## 2. 数据库对象定义

### 2.1 用户认证模块数据表

#### 2.1.1 用户基础信息表 (users)

```sql
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

-- 用户表注释
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
```

#### 2.1.2 角色定义表 (roles)

```sql
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

-- 角色表注释
COMMENT ON TABLE roles IS '角色定义表，定义系统中所有可用的角色';
COMMENT ON COLUMN roles.id IS '角色唯一标识，主键';
COMMENT ON COLUMN roles.role_name IS '角色名称标识';
COMMENT ON COLUMN roles.role_display_name IS '角色显示名称';
COMMENT ON COLUMN roles.description IS '角色描述信息';
COMMENT ON COLUMN roles.permissions IS '角色权限配置，JSON格式存储';
COMMENT ON COLUMN roles.is_system_role IS '是否为系统角色，系统角色不可删除';
```

#### 2.1.3 用户角色关联表 (user_roles)

```sql
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

-- 用户角色关联表注释
COMMENT ON TABLE user_roles IS '用户角色关联表，处理用户与角色的多对多关系';
COMMENT ON COLUMN user_roles.id IS '关联记录唯一标识';
COMMENT ON COLUMN user_roles.user_id IS '用户ID，外键关联users表';
COMMENT ON COLUMN user_roles.role_id IS '角色ID，外键关联roles表';
COMMENT ON COLUMN user_roles.assigned_by IS '分配角色的管理员ID';
COMMENT ON COLUMN user_roles.assigned_at IS '角色分配时间';
COMMENT ON COLUMN user_roles.expires_at IS '角色过期时间，NULL表示永不过期';
COMMENT ON COLUMN user_roles.is_active IS '是否有效，false表示已撤销';
```

#### 2.1.4 会话管理表 (user_sessions)

```sql
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
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_user_sessions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 检查约束
    CONSTRAINT user_sessions_expires CHECK (expires_at > created_at)
);

-- 会话管理表注释
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
```

### 2.2 宿舍管理模块数据表

#### 2.2.1 宿舍信息表 (dorms)

```sql
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
    
    -- 时间戳
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

-- 宿舍信息表注释
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
COMMENT ON COLUMN dorms.floor IS '楼层号';
COMMENT ON COLUMN dorms.room_number IS '房间号';
COMMENT ON COLUMN dorms.facilities IS '设施列表，JSON数组格式';
COMMENT ON COLUMN dorms.amenities IS '便利设施列表，JSON数组格式';
COMMENT ON COLUMN dorms.admin_id IS '宿舍管理员ID';
```

### 2.3 成员管理模块数据表

#### 2.3.1 用户宿舍关联表 (user_dorms)

```sql
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

-- 用户宿舍关联表注释
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
```

### 2.4 费用管理模块数据表

#### 2.4.1 费用类别表 (expense_categories)

```sql
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

-- 费用类别表注释
COMMENT ON TABLE expense_categories IS '费用类别表，定义所有可用的费用分类';
COMMENT ON COLUMN expense_categories.id IS '类别唯一标识';
COMMENT ON COLUMN expense_categories.category_code IS '类别代码：accommodation-住宿费，utilities-水电网费，maintenance-维修费，cleaning-清洁费，other-其他';
COMMENT ON COLUMN expense_categories.category_name IS '类别显示名称';
COMMENT ON COLUMN expense_categories.description IS '类别描述';
COMMENT ON COLUMN expense '前端显示颜色';
COMMENT ON COLUMN expense_categories.icon_name IS '图标名称';
_categories.color_code IS_categories.is_active IS '是否启用';
COMMENT ON COLUMN expenseCOMMENT ON COLUMN expense_categories.sort_order IS '排序顺序';
```

#### 2.4.2 费用记录表 (expenses)

```sql
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
    
    -- 时间戳
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

-- 费用记录表注释
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
```

#### 2.4.3 费用分摊记录表 (expense_splits)

```sql
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
    
    -- 检查约束
    CONSTRAINT expense_splits_amount_check CHECK (paid_amount <= split_amount),
    
    -- 唯一约束
    CONSTRAINT uk_expense_user_split 
        UNIQUE (expense_id, user_id)
);

-- 费用分摊记录表注释
COMMENT ON TABLE expense_splits IS '费用分摊记录表，记录每个用户应承担的费用分摊';
COMMENT ON COLUMN expense_splits.id IS '分摊记录唯一标识';
COMMENT ON COLUMN expense_splits.expense_id IS '费用记录ID';
COMMENT ON COLUMN expense_splits.user_id IS '用户ID';
COMMENT ON COLUMN expense_splits.dorm_id IS '宿舍ID';
COMMENT ON COLUMN expense_splits.split_amount IS '应分摊金额';
COMMENT ON COLUMN expense_splits.split_percentage IS '分摊百分比';
COMMENT ON COLUMN expense_splits.payment_status IS '支付状态：pending-待支付，paid-已支付，overdue-逾期，waived-免除';
COMMENT ON COLUMN expense_splits.paid_amount IS '已支付金额';
COMMENT ON COLUMN expense_splits.paid_at IS '支付时间';
COMMENT ON COLUMN expense_splits.reminder_count IS '催缴次数';
COMMENT ON COLUMN expense_splits.last_reminder_at IS '最后催缴时间';
```

### 2.5 验证码和安全模块数据表

#### 2.5.1 验证码表 (captcha_codes)

```sql
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

-- 验证码表注释
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
```

#### 2.5.2 两步验证表 (two_factor_codes)

```sql
-- 两步验证表
CREATE TABLE two_factor_codes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    code VARCHAR(10) NOT NULL,
    code_type VARCHAR(20) NOT NULL DEFAULT 'login'
        CHECK (code_type IN ('login', 'register', 'reset', 'verify')),
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

-- 两步验证表注释
COMMENT ON TABLE two_factor_codes IS '两步验证表，存储邮箱和手机验证码信息';
COMMENT ON COLUMN two_factor_codes.id IS '验证记录唯一标识';
COMMENT ON COLUMN two_factor_codes.user_id IS '用户ID';
COMMENT ON COLUMN two_factor_codes.code IS '验证码';
COMMENT ON COLUMN two_factor_codes.code_type IS '验证码类型：login-登录，register-注册，reset-重置，verify-验证';
COMMENT ON COLUMN two_factor_codes.channel IS '发送渠道：email-邮箱，sms-短信，authenticator-验证器';
COMMENT ON COLUMN two_factor_codes.target IS '目标地址（邮箱或手机号）';
COMMENT ON COLUMN two_factor_codes.ip_address IS '请求IP地址';
COMMENT ON COLUMN two_factor_codes.attempts IS '尝试次数';
COMMENT ON COLUMN two_factor_codes.max_attempts IS '最大尝试次数';
COMMENT ON COLUMN two_factor_codes.is_used IS '是否已使用';
COMMENT ON COLUMN two_factor_codes.used_at IS '使用时间';
COMMENT ON COLUMN two_factor_codes.expires_at IS '过期时间';
```

---

## 3. 数据库索引设计

### 3.1 用户认证相关索引

```sql
-- 用户表索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 组合索引用于登录查询优化
CREATE INDEX idx_users_login ON users(username, status) WHERE status = 'active';

-- 角色表索引
CREATE INDEX idx_roles_role_name ON roles(role_name);
CREATE INDEX idx_roles_is_system ON roles(is_system_role);

-- 用户角色关联表索引
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- 会话表索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_refresh ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);
```

### 3.2 宿舍管理相关索引

```sql
-- 宿舍表索引
CREATE INDEX idx_dorms_dorm_name ON dorms(dorm_name);
CREATE INDEX idx_dorms_dorm_code ON dorms(dorm_code);
CREATE INDEX idx_dorms_status ON dorms(status);
CREATE INDEX idx_dorms_capacity ON dorms(capacity);
CREATE INDEX idx_dorms_admin_id ON dorms(admin_id);
CREATE INDEX idx_dorms_created_at ON dorms(created_at);

-- 组合索引用于宿舍搜索
CREATE INDEX idx_dorms_search ON dorms(dorm_name, status) WHERE status = 'active';

-- 用户宿舍关联表索引
CREATE INDEX idx_user_dorms_user_id ON user_dorms(user_id);
CREATE INDEX idx_user_dorms_dorm_id ON user_dorms(dorm_id);
CREATE INDEX idx_user_dorms_status ON user_dorms(status);
CREATE INDEX idx_user_dorms_role ON user_dorms(member_role);
CREATE INDEX idx_user_dorms_move_in ON user_dorms(move_in_date);
CREATE INDEX idx_user_dorms_invite_code ON user_dorms(invite_code);

-- 组合索引用于活跃成员查询
CREATE INDEX idx_user_dorms_active ON user_dorms(dorm_id, status) WHERE status = 'active';
```

### 3.3 费用管理相关索引

```sql
-- 费用类别表索引
CREATE INDEX idx_expense_categories_code ON expense_categories(category_code);
CREATE INDEX idx_expense_categories_active ON expense_categories(is_active);
CREATE INDEX idx_expense_categories_sort ON expense_categories(sort_order);

-- 费用记录表索引
CREATE INDEX idx_expenses_applicant_id ON expenses(applicant_id);
CREATE INDEX idx_expenses_dorm_id ON expenses(dorm_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_priority ON expenses(priority);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_amount ON expenses(amount);
CREATE INDEX idx_expenses_urgent ON expenses(is_urgent) WHERE is_urgent = TRUE;
CREATE INDEX idx_expenses_approved_by ON expenses(approved_by);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);

-- 组合索引用于费用查询优化
CREATE INDEX idx_expenses_dorm_status ON expenses(dorm_id, status);
CREATE INDEX idx_expenses_dorm_date ON expenses(dorm_id, expense_date);
CREATE INDEX idx_expenses_applicant_status ON expenses(applicant_id, status);
CREATE INDEX idx_expenses_category_status ON expenses(category_id, status);

-- 费用分摊表索引
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX idx_expense_splits_dorm_id ON expense_splits(dorm_id);
CREATE INDEX idx_expense_splits_payment_status ON expense_splits(payment_status);
CREATE INDEX idx_expense_splits_paid_at ON expense_splits(paid_at);

-- 组合索引用于分摊查询优化
CREATE INDEX idx_expense_splits_user_status ON expense_splits(user_id, payment_status);
```

### 3.4 安全和验证相关索引

```sql
-- 验证码表索引
CREATE INDEX idx_captcha_codes_id ON captcha_codes(captcha_id);
CREATE INDEX idx_captcha_codes_expires ON captcha_codes(expires_at);
CREATE INDEX idx_captcha_codes_ip ON captcha_codes(ip_address);

-- 两步验证表索引
CREATE INDEX idx_two_factor_user_id ON two_factor_codes(user_id);
CREATE INDEX idx_two_factor_code ON two_factor_codes(code);
CREATE INDEX idx_two_factor_target ON two_factor_codes(target);
CREATE INDEX idx_two_factor_expires ON two_factor_codes(expires_at);
CREATE INDEX idx_two_factor_used ON two_factor_codes(is_used) WHERE is_used = FALSE;

-- 组合索引用于验证查询优化
CREATE INDEX idx_two_factor_lookup ON two_factor_codes(user_id, code_type, is_used) WHERE is_used = FALSE;
```

---

## 4. 视图和函数设计

### 4.1 费用统计视图

```sql
-- 费用统计视图
CREATE VIEW expense_statistics AS
SELECT 
    d.id as dorm_id,
    d.dorm_name,
    COUNT(e.id) as total_expenses,
    COUNT(CASE WHEN e.status = 'pending' THEN 1 END) as pending_expenses,
    COUNT(CASE WHEN e.status = 'approved' THEN 1 END) as approved_expenses,
    COUNT(CASE WHEN e.status = 'rejected' THEN 1 END) as rejected_expenses,
    SUM(CASE WHEN e.status = 'approved' THEN e.amount ELSE 0 END) as total_amount,
    SUM(CASE WHEN e.expense_date >= date_trunc('month', CURRENT_DATE) AND e.status = 'approved' 
        THEN e.amount ELSE 0 END) as monthly_amount,
    AVG(CASE WHEN e.status = 'approved' THEN e.amount ELSE NULL END) as average_amount
FROM dorms d
LEFT JOIN expenses e ON d.id = e.dorm_id
GROUP BY d.id, d.dorm_name;

COMMENT ON VIEW expense_statistics IS '费用统计视图，提供宿舍费用汇总信息';
```

### 4.2 成员统计视图

```sql
-- 成员统计视图
CREATE VIEW member_statistics AS
SELECT 
    d.id as dorm_id,
    d.dorm_name,
    COUNT(ud.id) as total_members,
    COUNT(CASE WHEN ud.status = 'active' THEN 1 END) as active_members,
    COUNT(CASE WHEN ud.status = 'pending' THEN 1 END) as pending_members,
    COUNT(CASE WHEN ud.member_role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN ud.member_role = 'member' THEN 1 END) as member_count,
    COUNT(CASE WHEN ud.member_role = 'viewer' THEN 1 END) as viewer_count,
    AVG(ud.monthly_share) as average_expense
FROM dorms d
LEFT JOIN user_dorms ud ON d.id = ud.dorm_id
GROUP BY d.id, d.dorm_name;

COMMENT ON VIEW member_statistics IS '成员统计视图，提供宿舍成员汇总信息';
```

### 4.3 用户登录历史函数

```sql
-- 获取用户登录历史函数
CREATE OR REPLACE FUNCTION get_user_login_history(
    p_user_id BIGINT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    login_time TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    device_info JSONB,
    user_agent TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.last_accessed_at as login_time,
        us.ip_address,
        us.device_info,
        us.user_agent
    FROM user_sessions us
    WHERE us.user_id = p_user_id
    ORDER BY us.last_accessed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_login_history IS '获取用户登录历史记录';
```

---

## 5. 触发器和数据完整性

### 5.1 自动更新触发器

```sql
-- 自动更新updated_at字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为相关表创建触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dorms_updated_at 
    BEFORE UPDATE ON dorms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dorms_updated_at 
    BEFORE UPDATE ON user_dorms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_splits_updated_at 
    BEFORE UPDATE ON expense_splits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 宿舍入住人数自动更新触发器

```sql
-- 宿舍入住人数自动更新触发器函数
CREATE OR REPLACE FUNCTION update_dorm_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'active' THEN
            UPDATE dorms 
            SET current_occupancy = current_occupancy + 1 
            WHERE id = NEW.dorm_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE dorms 
            SET current_occupancy = current_occupancy + 1 
            WHERE id = NEW.dorm_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE dorms 
            SET current_occupancy = current_occupancy - 1 
            WHERE id = NEW.dorm_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'active' THEN
            UPDATE dorms 
            SET current_occupancy = current_occupancy - 1 
            WHERE id = OLD.dorm_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_dorm_occupancy
    AFTER INSERT OR UPDATE OR DELETE ON user_dorms
    FOR EACH ROW EXECUTE FUNCTION update_dorm_occupancy();
```

### 5.3 费用审批自动分摊触发器

```sql
-- 费用审批通过时自动创建分摊记录
CREATE OR REPLACE FUNCTION create_expense_splits_on_approval()
RETURNS TRIGGER AS $$
DECLARE
    dorm_member RECORD;
    split_amount DECIMAL(10,2);
    member_count INTEGER;
BEGIN
    -- 只有当状态从未审批变为已审批时才触发
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        -- 获取宿舍当前活跃成员数量
        SELECT COUNT(*) INTO member_count
        FROM user_dorms 
        WHERE dorm_id = NEW.dorm_id AND status = 'active';
        
        -- 为每个活跃成员创建分摊记录
        IF member_count > 0 THEN
            split_amount := NEW.amount / member_count;
            
            FOR dorm_member IN 
                SELECT user_id 
                FROM user_dorms 
                WHERE dorm_id = NEW.dorm_id AND status = 'active'
            LOOP
                INSERT INTO expense_splits (
                    expense_id, user_id, dorm_id, split_amount, split_percentage
                ) VALUES (
                    NEW.id, dorm_member.user_id, NEW.dorm_id, 
                    split_amount, (100.0 / member_count)
                );
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_create_expense_splits
    AFTER UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION create_expense_splits_on_approval();
```

---

## 6. 数据初始化脚本

### 6.1 基础数据插入

```sql
-- 插入默认角色数据
INSERT INTO roles (role_name, role_display_name, description, permissions, is_system_role) VALUES
('system_admin', '系统管理员', '系统最高管理员，拥有最高权限', '{"all": true}', true),
('admin', '管理员', '业务运营管理员', '{"users": ["read", "write", "delete"], "dorms": ["read", "write", "delete"], "expenses": ["read", "approve"]}', true),
('dorm_leader', '宿舍长', '宿舍费用负责人', '{"dorms": ["read", "write"], "expenses": ["read", "create", "approve"]}', false),
('payer', '付款人', '负责费用支付', '{"expenses": ["read", "pay"], "payments": ["create"]}', false),
('user', '普通用户', '基础成员权限', '{"expenses": ["read", "create"], "profile": ["read", "write"]}', false);

-- 插入费用类别数据
INSERT INTO expense_categories (category_code, category_name, description, color_code, icon_name, sort_order) VALUES
('accommodation', '住宿费', '房租、物业费等住宿相关费用', '#FF6B6B', 'home', 1),
('utilities', '水电网费', '水费、电费、网费等公用事业费用', '#4ECDC4', 'zap', 2),
('maintenance', '维修费', '设备维修、家具维修等费用', '#45B7D1', 'tool', 3),
('cleaning', '清洁费', '清洁用品、清洁服务等费用', '#96CEB4', 'broom', 4),
('other', '其他费用', '其他杂项费用', '#FFEAA7', 'more-horizontal', 5);

-- 创建管理员用户（密码: admin123，需要后续修改）
INSERT INTO users (username, email, password_hash, nickname, status, email_verified) VALUES
('admin', 'admin@example.com', '$2b$10$rOzK9Y8hO7L6P5M6N4K3O2P1Q0R9S8T7U6V5W4X3Y2Z1a0b1c2d3e4', '系统管理员', 'active', true);

-- 为管理员分配系统管理员角色
INSERT INTO user_roles (user_id, role_id, assigned_by) 
SELECT u.id, r.id, u.id 
FROM users u, roles r 
WHERE u.username = 'admin' AND r.role_name = 'system_admin';

-- 创建示例宿舍
INSERT INTO dorms (dorm_name, dorm_code, address, capacity, admin_id) VALUES
('学生公寓A栋101', 'A101', '大学路1号A栋101室', 4, 1),
('学生公寓A栋102', 'A102', '大学路1号A栋102室', 4, 1),
('学生公寓B栋201', 'B201', '大学路1号B栋201室', 6, 1);

COMMENT ON TABLE users IS '系统已创建默认管理员账户，用户名: admin，密码: admin123（请及时修改）';
```

---

## 7. API接口与数据库映射关系

### 7.1 用户认证模块映射

| API接口 | 数据库表/字段 | 说明 |
|---------|---------------|------|
| `/api/auth/login` | users(username, password_hash) | 验证用户凭据 |
| `/api/auth/logout` | user_sessions(session_token) | 撤销用户会话 |
| `/api/auth/captcha` | captcha_codes(captcha_id, captcha_image) | 生成验证码 |
| `/api/auth/register` | users(username, email, password_hash) | 创建新用户 |
| `/api/auth/refresh` | user_sessions(refresh_token, expires_at) | 刷新访问令牌 |

### 7.2 宿舍管理模块映射

| API接口 | 数据库表/字段 | 说明 |
|---------|---------------|------|
| `/api/dorms` (GET) | dorms(*), member_statistics | 获取宿舍列表和统计 |
| `/api/dorms` (POST) | dorms(dorm_name, address, capacity) | 创建新宿舍 |
| `/api/dorms/{id}` (GET) | dorms(*), user_dorms(*) | 获取宿舍详情和成员 |
| `/api/dorms/{id}` (PUT) | dorms(*), updated_at | 更新宿舍信息 |
| `/api/dorms/{id}` (DELETE) | dorms(*), user_dorms | 删除宿舍 |

### 7.3 成员管理模块映射

| API接口 | 数据库表/字段 | 说明 |
|---------|---------------|------|
| `/api/members/stats` | member_statistics, user_dorms | 获取成员统计 |
| `/api/members` (GET) | user_dorms(*), users(*), roles(*) | 获取成员列表 |
| `/api/members/invite` | user_dorms(invite_code, invited_by) | 邀请新成员 |
| `/api/members/{id}/role` | user_dorms(member_role) | 更新成员角色 |
| `/api/members/{id}/status` | user_dorms(status) | 更新成员状态 |
| `/api/members/{id}` (DELETE) | user_dorms(*), dorms(current_occupancy) | 删除成员 |

### 7.4 费用管理模块映射

| API接口 | 数据库表/字段 | 说明 |
|---------|---------------|------|
| `/api/expenses/summary` | expense_statistics, expenses | 获取费用统计 |
| `/api/expenses` (GET) | expenses(*), users(*), expense_categories(*) | 获取费用列表 |
| `/api/expenses` (POST) | expenses(*), expense_splits | 创建费用记录 |
| `/api/expenses/{id}` (GET) | expenses(*), expense_splits(*), users(*) | 获取费用详情 |
| `/api/expenses/{id}` (PUT) | expenses(*), expense_splits | 更新费用记录 |
| `/api/expenses/{id}/approve` | expenses(status, approved_by, approved_at) | 审批费用 |
| `/api/expenses/{id}/reject` | expenses(status, rejection_reason) | 拒绝费用 |
| `/api/expenses/{id}/pay` | expense_splits(payment_status, paid_amount, paid_at) | 标记已支付 |

---

## 8. 性能优化建议

### 8.1 查询优化
1. **使用覆盖索引**：为常用查询字段创建复合索引
2. **分区表设计**：对于大数据量的expenses表，可按时间分区
3. **物化视图**：对复杂的统计查询使用物化视图
4. **连接优化**：使用适当的连接类型和连接顺序

### 8.2 缓存策略
1. **Redis缓存**：缓存用户会话、权限信息、统计数据
2. **应用层缓存**：缓存费用类别、角色权限等相对静态数据
3. **数据库查询缓存**：启用PostgreSQL查询缓存

### 8.3 监控和维护
1. **慢查询监控**：定期检查并优化慢查询
2. **索引维护**：定期重建碎片化索引
3. **统计信息更新**：定期更新表统计信息
4. **数据清理**：定期清理过期的验证码、会话等数据

---

## 9. 安全考虑

### 9.1 数据安全
1. **密码加密**：使用bcrypt等安全哈希算法
2. **SQL注入防护**：使用参数化查询
3. **数据脱敏**：敏感信息如手机号、邮箱进行脱敏显示
4. **访问控制**：基于角色的权限控制（RBAC）

### 9.2 审计日志
1. **操作日志**：记录所有关键操作的审计日志
2. **登录日志**：记录用户登录历史和异常登录
3. **数据变更**：记录重要数据的变更历史

### 9.3 数据备份
1. **定期备份**：设置自动备份策略
2. **增量备份**：结合全量和增量备份
3. **备份验证**：定期验证备份数据的完整性

---

## 10. 部署和迁移

### 10.1 数据库迁移
```sql
-- 创建数据库
CREATE DATABASE accounting_system;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 运行所有DDL脚本
\i /path/to/create_tables.sql
\i /path/to/create_indexes.sql
\i /path/to/create_views.sql
\i /path/to/create_functions.sql
\i /path/to/create_triggers.sql
\i /path/to/insert_initial_data.sql
```

### 10.2 环境配置
```sql
-- 开发环境配置
SET timezone = 'Asia/Shanghai';
SET log_statement = 'all';
SET log_min_duration_statement = 1000;

-- 生产环境配置
SET timezone = 'Asia/Shanghai';
SET shared_preload_libraries = 'pg_stat_statements';
SET pg_stat_statements.track = all;
```

---

## 附录

### A. 常用查询示例
### B. 故障排除指南
### C. 性能调优参数
### D. 监控指标说明

---

**文档版本历史**
- v1.0 (2024-01-01) - 初始版本，完整数据库设计