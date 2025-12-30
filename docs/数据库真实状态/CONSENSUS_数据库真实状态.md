# CONSENSUS_数据库真实状态

## 明确的需求描述和验收标准
- 实现数据库状态详情中五个核心指标的真实数据采集。
- 验收标准见 ALIGNMENT 文档。

## 技术实现方案
### 后端 (AI-server)
- **Service**: `systemStatusService.js`
  - 优化 `assessDatabaseConnectionHealth`：
    - 当前连接数: `SELECT count(*) FROM pg_stat_activity`
    - 最大连接数: `SHOW max_connections`
  - 优化 `performPostgreSQLChecks`：
    - 缓存命中率: 查询 `pg_statio_user_tables`
    - 慢查询数: 优先查询 `pg_stat_statements`，若不存在则查询 `pg_stat_activity`
    - 表空间使用: 使用 `pg_size_pretty(pg_database_size(current_database()))`
- **Controller/Route**: 确保数据扁平化返回，避免 Rule 5 导致的嵌套问题。

### 前端 (AI-admin)
- **View**: `Home.vue`
  - 确保 `databaseStats` 对象字段与后端返回的 `metrics` 字段一一对应。

## 技术约束和集成方案
- 不引入新的 npm 包。
- 保持原有的 `responseWrapper` 结构。
- 关键查询位置添加 `logger.info` 记录。

## 确认所有不确定性已解决
- [x] 数据来源：PostgreSQL 系统视图。
- [x] 兼容性：处理 `pg_stat_statements` 扩展未安装的情况。
- [x] 数据格式：MB/GB 格式化由后端处理。
