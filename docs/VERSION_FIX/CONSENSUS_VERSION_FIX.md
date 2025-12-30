# CONSENSUS_VERSION_FIX

## 任务目标
解决首页概览中后端服务版本号和数据库状态详情显示为空的问题。

## 技术方案
### 1. 后端接口调整 (`SystemStatusService.js`)
- **`evaluateBackendStatus`**:
  - 确保 `metrics` 包含 `version` (string), `apiResponseTime` (number), `qps` (number), `uptime` (number), `uptimeFormatted` (string)。
- **`evaluateDatabaseStatus`**:
  - 扁平化关键指标到 `metrics` 根部：
    - `version`: 数据库版本
    - `activeConnections`: 当前连接数
    - `maxConnections`: 最大连接数 (从 `layers.connection.details` 提取)
    - `cacheHitRate`: 缓存命中率 (从 `layers.performance.details` 提取)
    - `slowQueries`: 慢查询数 (从 `layers.performance.details` 提取)

### 2. 前端逻辑核查 (`Home.vue`)
- 确认 `refreshSystemStatusOverview` 函数中的数据赋值逻辑。
- 确保 `backendStats` 和 `databaseStats` 的 `ref` 对象被正确更新。
- 检查是否存在 Rule 5 导致的路径访问错误（即 `response.data.data` 与 `response.data` 的混淆）。

## 验收标准
1. **首页概览卡片**: 后端版本号显示 "1.0.0" 或 package.json 中的版本。
2. **数据库详情标签页**: 
   - “版本”字段显示 PostgreSQL 版本号。
   - “当前连接数”显示实际数值。
   - “最大连接数”显示实际数值（通常为 100）。
   - “缓存命中率”显示实际百分比。

## 约束条件
- 不修改数据库表结构。
- 遵循 Rule 5 处理双层嵌套结构。
- 关键位置打印日志。
- 不使用模拟数据。
