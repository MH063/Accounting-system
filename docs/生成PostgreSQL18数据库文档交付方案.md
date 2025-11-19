## 目标
- 将“具体的语句”以可直接执行的SQL形式补充到现有 `docs/数据库设计文档.md` 中，新增“完整DDL脚本”与“RLS/分区/TTL”章节，满足客户端与管理端互通需求。

## 文档更新内容
- 扩展启用与类型定义：`pgcrypto`、`btree_gist`、`pg_stat_statements`、`pg_cron`、`user_type_enum`
- 通用函数：`set_updated_at()`、`notify_table_change()`、`app_current_user_id()`
- 表结构：`modules`、`users`、`roles`、`permissions`、`user_roles`、`role_permissions`、`api_inventory`、`client_data`（哈希分区）、`operation_logs`（TTL）、`schema_migrations`
- 约束/索引：唯一约束、组合索引、`GIN`与`EXCLUDE`约束、外键均`ON UPDATE CASCADE`
- 触发器：统一`updated_at`自动更新、事件通知`NOTIFY`
- RLS策略：`client_data`与`operation_logs`的访问控制策略
- 分区与TTL：`client_data`按`user_id`哈希8分区；`operation_logs`通过`pg_cron`每日清理
- 使用提示：连接后执行`SET app.user_id = '<uuid>'`以使RLS生效；Flyway迁移拆分建议

## 输出形式
- 以中文说明 + SQL代码块形式插入到现有文档末尾，不在SQL内添加注释；保留`COMMENT ON`作为元数据说明

## 实施步骤
1. 在 `docs/数据库设计文档.md` 末尾新增“完整DDL脚本”与“RLS/分区/TTL”两节
2. 粘贴全部SQL语句（可直接执行），确保语法与PostgreSQL 18兼容
3. 保存并准备后续Flyway拆分建议段落