# ALIGNMENT_VERSION_FIX

## 项目背景
用户反馈在后台管理系统的首页概览中，后端服务详情的版本号不显示，且数据库状态详情（版本、连接数等）也不显示。

## 需求理解
1. **后端服务版本号**: 首页概览中的“后端服务详情”标签页下，版本号字段为空。
2. **数据库状态详情**: 首页概览中的“数据库详情”标签页下，版本、当前连接数、最大连接数、缓存命中率等字段显示异常或为空。

## 现状分析
1. **后端 API 响应**:
   - `/api/status/backend`: 返回 `metrics.version`，值为 "1.0.0"。
   - `/api/status/database`: 返回 `metrics.version`，值为 "PostgreSQL 18.1"。但 `maxConnections`、`cacheHitRate`、`slowQueries` 等指标嵌套在 `metrics.layers` 下的深层结构中。
2. **前端代码 (`Home.vue`)**:
   - 后端服务: 绑定到 `backendStats.version`。逻辑中尝试从 `backendData.metrics.version` 或 `backendData.version` 获取。
   - 数据库: 绑定到 `databaseStats.version`、`databaseStats.maxConnections` 等。逻辑中尝试从 `databaseData.metrics` 的顶级属性获取。
3. **问题根源**:
   - **数据结构不匹配**: 数据库的关键指标（最大连接数、命中率等）在后端响应中嵌套太深，前端无法通过 `metrics.maxConnections` 直接获取。
   - **规则 5 处理**: 前端 `Home.vue` 中对 `data` 的处理可能存在与 Rule 5（双层嵌套）不完全一致的地方，或者后端返回的结构在某些情况下导致了解析失败。

## 解决方案
1. **后端优化 (`SystemStatusService.js`)**:
   - 在 `evaluateBackendStatus` 和 `evaluateDatabaseStatus` 中，将关键指标（版本、最大连接数、缓存命中率、慢查询数等）提升到 `metrics` 对象的顶级属性中，以方便前端直接访问。
   - 确保 `backendVersion` 和 `dbVersion` 始终正确返回。
2. **前端核查 (`Home.vue`)**:
   - 检查数据绑定和解析逻辑，确保能够正确处理后端返回的结构。
   - 针对 Rule 5 进行防御性编码，确保无论是 `data.data` 还是 `data` 都能正确解析。

## 验收标准
1. **后端服务详情**: 版本号正确显示（如 "1.0.0"）。
2. **数据库状态详情**: 
   - 版本正确显示（如 "PostgreSQL 18.1"）。
   - 当前连接数、最大连接数正确显示。
   - 缓存命中率正确显示。
3. **日志验证**: 控制台无数据解析相关的错误日志。
