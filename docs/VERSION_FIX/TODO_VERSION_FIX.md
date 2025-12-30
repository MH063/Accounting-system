# TODO_VERSION_FIX

## 待办事项
1. **权限验证**: 目前首页概览接口需要管理员权限。如果普通用户也需要查看基本状态，请调整 `systemStatus.js` 中的权限策略。
2. **版本号同步**: 建议在 CI/CD 流程中自动同步 `AI-admin` 和 `AI-server` 的版本号，或在发布时统一修改。
3. **性能监控**: 数据库缓存命中率和慢查询数是动态采集的，建议在高负载环境下验证其准确性。

## 操作指引
- 如需修改后端版本，请编辑 `AI-server/package.json`。
- 如需修改客户端版本，请编辑 `AI-admin/package.json`。
- 如需调整数据库监控阈值，请编辑 `AI-server/services/systemStatusService.js` 中的 `weights` 和 `thresholds`。
