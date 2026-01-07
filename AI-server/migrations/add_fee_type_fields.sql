-- 费用类型管理模块数据库迁移脚本
-- 执行时间: 2024-01-20
-- 用途: 为 expense_categories 表添加费用类型管理所需的新字段

-- ============================================================
-- 步骤1: 添加新字段
-- ============================================================

-- 检查字段是否存在，不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_categories'
        AND column_name = 'default_amount'
    ) THEN
        ALTER TABLE expense_categories
        ADD COLUMN default_amount DECIMAL(10, 2) DEFAULT 0.00;
        RAISE NOTICE '字段 default_amount 已添加';
    ELSE
        RAISE NOTICE '字段 default_amount 已存在，跳过';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_categories'
        AND column_name = 'billing_cycle'
    ) THEN
        ALTER TABLE expense_categories
        ADD COLUMN billing_cycle VARCHAR(20) DEFAULT 'one-time';
        RAISE NOTICE '字段 billing_cycle 已添加';
    ELSE
        RAISE NOTICE '字段 billing_cycle 已存在，跳过';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense_categories'
        AND column_name = 'allocation_rule'
    ) THEN
        ALTER TABLE expense_categories
        ADD COLUMN allocation_rule VARCHAR(20) DEFAULT 'none';
        RAISE NOTICE '字段 allocation_rule 已添加';
    ELSE
        RAISE NOTICE '字段 allocation_rule 已存在，跳过';
    END IF;
END $$;

-- ============================================================
-- 步骤2: 添加字段注释
-- ============================================================

COMMENT ON COLUMN expense_categories.default_amount IS '费用默认金额';
COMMENT ON COLUMN expense_categories.billing_cycle IS '计费周期: one-time/monthly/semester/yearly';
COMMENT ON COLUMN expense_categories.allocation_rule IS '分摊规则: average/dormitory/none';

-- ============================================================
-- 步骤3: 验证迁移结果
-- ============================================================

-- 查看表结构
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'expense_categories'
ORDER BY ordinal_position;

-- 查看新字段数据
SELECT id, category_code, category_name, default_amount, billing_cycle, allocation_rule
FROM expense_categories
LIMIT 10;

DO $$
BEGIN
    RAISE NOTICE '数据库迁移完成！';
END $$;
