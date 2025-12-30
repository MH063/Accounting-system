# DESIGN_VERSION_FIX

## 架构设计

### 数据流向
1. **后端服务**: `SystemStatusService` 获取进程、内存、CPU 及 API 统计信息 -> 封装成 `metrics` 对象（扁平化关键字段） -> `systemStatus` 路由返回。
2. **数据库服务**: `SystemStatusService` 执行 SQL 查询（版本、连接数、命中率等） -> 封装成 `metrics` 对象（扁平化关键字段） -> `systemStatus` 路由返回。
3. **前端展示**: `Home.vue` 调用 `systemApi` -> Axios 拦截器解包 `data` -> `refreshSystemStatusOverview` 更新本地 `ref` -> 模板自动渲染。

### 接口契约更新 (逻辑上)

#### `/api/status/backend` 响应结构
```json
{
  "success": true,
  "data": {
    "status": "...",
    "metrics": {
      "version": "1.0.0",
      "apiResponseTime": 123,
      "qps": 1.5,
      "uptime": 3600,
      "uptimeFormatted": "1小时",
      "layers": { ... }
    }
  }
}
```

#### `/api/status/database` 响应结构
```json
{
  "success": true,
  "data": {
    "status": "...",
    "metrics": {
      "version": "PostgreSQL 18.1",
      "activeConnections": 5,
      "maxConnections": 100,
      "cacheHitRate": 99.5,
      "slowQueries": 0,
      "layers": { ... }
    }
  }
}
```

### 核心组件
- **`SystemStatusService`**: 负责聚合底层监控数据并按照扁平化契约格式化。
- **`Home.vue`**: 负责订阅数据变更并分发到子组件。

## 异常处理
- 如果获取版本失败，返回 "Unknown"。
- 如果指标不可用，返回 0 或默认值，确保前端不崩。
