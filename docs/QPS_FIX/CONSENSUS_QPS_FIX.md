# CONSENSUS: 后端 QPS 显示修复

## 1. 明确的需求描述
修复前端首页 QPS 显示为 0 的问题。通过在后端 `SystemStatusService` 中增加 QPS 计算逻辑，并在 `evaluateBackendStatus` 接口中返回该数据。

## 2. 技术实现方案
- **组件**：`SystemStatusService` (AI-server)
- **依赖**：`performanceMonitor` (AI-server 中间件)
- **计算方法**：
    - `currentTotalRequests = performanceMonitor.getStats().summary.totalRequests`
    - `currentTime = Date.now()`
    - `deltaRequests = currentTotalRequests - lastTotalRequests`
    - `deltaTimeSeconds = (currentTime - lastCheckTime) / 1000`
    - `qps = deltaRequests / deltaTimeSeconds`
- **数据流**：
    1. 前端调用 `/status/backend`。
    2. `SystemStatusService` 调用 `evaluateBackendStatus`。
    3. `evaluateBackendStatus` 计算 QPS 并将其放入 `metrics` 对象。
    4. 接口返回 `metrics.qps`。
    5. 前端更新 `backendStats.qps`。

## 3. 技术约束和集成方案
- **实时性**：QPS 反映的是两次评估请求之间的瞬时平均值。
- **并发处理**：计算过程应保证原子性或使用简单的互斥逻辑（在 Node.js 单线程环境下，简单赋值即可）。
- **容错**：若为第一次计算或 `deltaTime` 为 0，QPS 应默认为 0。

## 4. 任务边界限制
- 仅修改 `SystemStatusService.js` 内部逻辑及返回结构。
- 确保不破坏原有的健康评分算法。

## 5. 验收标准
- 接口响应中 `data.metrics.qps` 字段存在且为数值。
- 前端页面成功显示 QPS。
- 经过 3 次 API 测试验证正确性。
