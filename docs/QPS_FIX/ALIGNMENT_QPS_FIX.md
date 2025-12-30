# ALIGNMENT: 后端 QPS 显示修复

## 1. 原始需求
前端首页的“后端详情”面板中，QPS 指标目前显示为 0。需要实现后端的 QPS 计算逻辑，并通过 API 接口返回给前端。

## 2. 边界确认
- **任务范围**：
    - 修改 `AI-server/services/systemStatusService.js`，增加 QPS 计算逻辑。
    - 确保 `evaluateBackendStatus` 方法返回的 `metrics` 对象包含 `qps` 字段。
    - 前端 `AI-admin/src/views/Home.vue` 已经有对应的显示逻辑，只需确保数据结构一致。
- **非任务范围**：
    - 不涉及前端 UI 的重新设计。
    - 不涉及其他性能指标（如 CPU、内存）的计算逻辑修改（除非发现错误）。

## 3. 需求理解
- **现有逻辑**：
    - 后端使用 `PerformanceMonitor` 中间件记录请求。
    - `SystemStatusService` 定期评估系统状态，但目前只返回 `apiResponseTime` 等指标，缺失 `qps`。
- **改进方案**：
    - 在 `SystemStatusService` 中维护上次检查的请求总数和时间戳。
    - 计算两次检查之间的增量，从而得出平均 QPS。

## 4. 疑问澄清
- **QPS 计算周期**：建议使用 5 秒（即 `checkInterval`）作为计算周期，以提供平滑的实时数据。
- **数据结构**：前端代码 `backendStats.qps` 期望的是一个数值。后端应返回 `metrics.qps`。

## 5. 验收标准
- [ ] 后端 `/status/backend` 接口返回的数据中包含 `metrics.qps`。
- [ ] 前端“后端详情”面板中的 QPS 能够根据实际请求情况显示非 0 数值。
- [ ] 代码符合项目现有规范，且包含必要的注释。
