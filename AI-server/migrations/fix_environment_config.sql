-- 修复：确保 system.environment 配置存在
UPDATE admin_system_configs 
SET config_value = '"development"'
WHERE config_key = 'system.environment';

-- 如果不存在则插入
INSERT INTO admin_system_configs (config_key, config_value, data_type, config_group, config_category, display_name, description, is_system_config, is_active)
SELECT 'system.environment', '"development"', 'string', 'system', 'SYSTEM_GENERAL', '运行环境', '系统运行的环境: development(开发)/testing(测试)/production(生产)', true, true
WHERE NOT EXISTS (SELECT 1 FROM admin_system_configs WHERE config_key = 'system.environment');

-- 确认配置
SELECT config_key, config_value FROM admin_system_configs WHERE config_key = 'system.environment';

-- 确认审计日志表
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'admin_config%';
