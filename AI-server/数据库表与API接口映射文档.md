# 记账宝系统 - 数据库表与API接口映射文档

本文档详细描述了记账宝系统中数据库表与API接口之间的映射关系。

## 1. 用户管理模块

### 1.1 表结构

| 表名 | 描述 | 关键字段 |
|------|------|----------|
| users | 用户基础信息表 | id, username, email, password_hash, status, created_at, updated_at, last_login |
| user_profiles | 用户详细资料表 | user_id, full_name, phone, avatar_url, gender, birthday |
| user_settings | 用户设置表 | user_id, setting_key, setting_value |
| roles | 角色表 | id, role_name, description |
| role_permissions | 角色权限关联表 | role_id, permission_id |
| permissions | 权限表 | id, permission_name, description |
| user_roles | 用户角色关联表 | user_id, role_id, is_active, expires_at |
| user_tokens | 用户令牌表 | user_id, token, type, expires_at |

### 1.2 API接口

| 接口路径 | 方法 | 功能 | 主要数据表 | 权限要求 |
|---------|------|------|------------|----------|
| /api/users | GET | 获取用户列表 | users, user_roles, roles | 需要认证 |
| /api/users/:userId | GET | 获取指定用户信息 | users, user_profiles, user_roles, roles | 用户本人或管理员 |
| /api/users | POST | 创建新用户 | users, user_roles, roles | 管理员权限 |
| /api/users/:userId | PUT | 更新用户信息 | users, user_profiles | 用户本人或管理员 |
| /api/users/:userId | DELETE | 删除用户 | users, user_profiles, user_roles | 管理员权限 |
| /api/auth/login | POST | 用户登录 | users, user_tokens | 公开 |
| /api/auth/logout | POST | 用户登出 | user_tokens | 需要认证 |
| /api/auth/register | POST | 用户注册 | users, user_profiles, user_roles | 公开 |

## 2. 宿舍与房间管理模块

### 2.1 表结构

| 表名 | 描述 | 关键字段 |
|------|------|----------|
| rooms | 房间表 | id, name, building, floor, room_number, capacity, description, created_at |
| room_members | 房间成员表 | room_id, user_id, role, join_date, status |
| room_invitations | 房间邀请表 | room_id, inviter_id, invite_code, expires_at, status |

### 2.2 API接口

| 接口路径 | 方法 | 功能 | 主要数据表 | 权限要求 |
|---------|------|------|------------|----------|
| /api/rooms | GET | 获取房间列表 | rooms, room_members, users | 需要认证 |
| /api/rooms/:roomId | GET | 获取房间详情 | rooms, room_members, users | 房间成员或管理员 |
| /api/rooms | POST | 创建房间 | rooms, room_members | 需要认证 |
| /api/rooms/:roomId | PUT | 更新房间信息 | rooms | 房间创建者或管理员 |
| /api/rooms/:roomId | DELETE | 删除房间 | rooms, room_members | 房间创建者或管理员 |
| /api/rooms/:roomId/members | GET | 获取房间成员 | room_members, users | 房间成员或管理员 |
| /api/rooms/:roomId/members/:userId | POST | 添加房间成员 | room_members | 房间管理员 |
| /api/rooms/:roomId/members/:userId | DELETE | 移除房间成员 | room_members | 房间管理员或本人 |
| /api/rooms/:roomId/invite | POST | 生成房间邀请码 | room_invitations | 房间管理员 |

## 3. 账单与费用管理模块

### 3.1 表结构

| 表名 | 描述 | 关键字段 |
|------|------|----------|
| expenses | 费用记录表 | id, room_id, user_id, amount, category_id, description, payment_date, receipt_url, created_at |
| expense_categories | 费用分类表 | id, name, description, icon, color |
| expense_tags | 费用标签表 | id, expense_id, tag |
| expense_splits | 费用分摊表 | expense_id, user_id, amount |
| payment_transfers | 支付转账记录表 | id, from_user_id, to_user_id, amount, expense_id, status, created_at |
| expense_statistics | 费用统计表 | user_id, room_id, month, year, total_amount, total_count, category_breakdown |
| historical_expense_stats | 历史费用统计表 | user_id, room_id, date, amount |
| expense_types | 费用类型表 | id, name, description |
| special_payment_rules | 特殊支付规则表 | id, room_id, description, rule_config |

### 3.2 API接口

| 接口路径 | 方法 | 功能 | 主要数据表 | 权限要求 |
|---------|------|------|------------|----------|
| /api/expenses | GET | 获取费用列表 | expenses, expense_categories, expense_splits, users | 需要认证 |
| /api/expenses/:expenseId | GET | 获取费用详情 | expenses, expense_categories, expense_splits, users | 需要认证 |
| /api/expenses | POST | 创建费用记录 | expenses, expense_splits | 需要认证 |
| /api/expenses/:expenseId | PUT | 更新费用记录 | expenses, expense_splits | 费用创建者或房间管理员 |
| /api/expenses/:expenseId | DELETE | 删除费用记录 | expenses, expense_splits | 费用创建者或房间管理员 |
| /api/expenses/summary | GET | 获取费用汇总统计 | expense_statistics, historical_expense_stats | 需要认证 |
| /api/expenses/categories | GET | 获取费用分类 | expense_categories | 需要认证 |
| /api/expenses/tags | GET | 获取费用标签 | expense_tags | 需要认证 |
| /api/transfers | GET | 获取转账记录 | payment_transfers, users | 需要认证 |
| /api/transfers | POST | 创建转账记录 | payment_transfers | 需要认证 |
| /api/transfers/:transferId | PUT | 更新转账状态 | payment_transfers | 发起方或接收方 |

## 4. 支付与收据管理模块

### 4.1 表结构

| 表名 | 描述 | 关键字段 |
|------|------|----------|
| qr_codes | 二维码表 | id, type, reference_id, data_url, expires_at, created_at |
| qr_payment_records | 二维码支付记录表 | id, qr_code_id, payer_id, amount, status, paid_at |
| user_payment_preferences | 用户支付偏好表 | user_id, preferred_method, default_split_method |

### 4.2 API接口

| 接口路径 | 方法 | 功能 | 主要数据表 | 权限要求 |
|---------|------|------|------------|----------|
| /api/qr-codes | POST | 生成支付二维码 | qr_codes, expenses | 需要认证 |
| /api/qr-codes/:qrCodeId/scan | POST | 扫描支付二维码 | qr_codes, qr_payment_records | 需要认证 |
| /api/qr-codes/:qrCodeId/status | GET | 查询支付状态 | qr_codes, qr_payment_records | 需要认证 |
| /api/payment/preferences | GET | 获取支付偏好 | user_payment_preferences | 需要认证 |
| /api/payment/preferences | PUT | 更新支付偏好 | user_payment_preferences | 需要认证 |

## 5. 系统管理与配置模块

### 5.1 表结构

| 表名 | 描述 | 关键字段 |
|------|------|----------|
| system_configs | 系统配置表 | id, config_key, config_value, description |
| feature_flags | 功能特性开关表 | id, flag_key, is_enabled, description |
| notifications | 通知表 | id, user_id, title, content, type, is_read, created_at |
| user_activity_logs | 用户活动日志表 | id, user_id, action, details, ip_address, created_at |
| system_performance_metrics | 系统性能指标表 | id, metric_name, metric_value, recorded_at |
| system_resource_usage | 系统资源使用表 | id, resource_type, usage_percentage, recorded_at |

### 5.2 API接口

| 接口路径 | 方法 | 功能 | 主要数据表 | 权限要求 |
|---------|------|------|------------|----------|
| /api/admin/system/configs | GET | 获取系统配置 | system_configs | 管理员权限 |
| /api/admin/system/configs/:configKey | PUT | 更新系统配置 | system_configs | 管理员权限 |
| /api/admin/feature-flags | GET | 获取功能开关 | feature_flags | 管理员权限 |
| /api/admin/feature-flags/:flagKey | PUT | 更新功能开关 | feature_flags | 管理员权限 |
| /api/notifications | GET | 获取通知列表 | notifications | 需要认证 |
| /api/notifications/:notificationId | PUT | 标记通知已读 | notifications | 需要认证 |
| /api/admin/logs/activity | GET | 获取活动日志 | user_activity_logs | 管理员权限 |
| /api/admin/metrics/performance | GET | 获取性能指标 | system_performance_metrics | 管理员权限 |
| /api/admin/metrics/resources | GET | 获取资源使用情况 | system_resource_usage | 管理员权限 |

## 6. 管理后台高级功能模块

### 6.1 表结构

| 表名 | 描述 | 关键字段 |
|------|------|----------|
| admin_operationlogs | 管理员操作日志表 | id, operator_id, operation_type, operation_module, operation_description, operation_status, operation_timestamp |
| admin_backup_records | 数据备份记录表 | id, backup_name, backup_type, backup_status, initiated_by, created_at |
| admin_system_configs | 系统配置管理表 | id, config_key, config_category, config_value, is_active, updated_by |
| admin_system_metrics | 系统监控和性能统计表 | id, metric_type, metric_name, metric_value, metric_timestamp |
| admin_analytics_reports | 数据统计和分析表 | id, report_name, report_type, report_data, generated_by, created_at |

### 6.2 API接口

| 接口路径 | 方法 | 功能 | 主要数据表 | 权限要求 |
|---------|------|------|------------|----------|
| /api/admin/operation-logs | GET | 获取操作日志 | admin_operationlogs | 管理员权限 |
| /api/admin/backup-records | GET | 获取备份记录 | admin_backup_records | 管理员权限 |
| /api/admin/backup-records | POST | 创建备份任务 | admin_backup_records | 管理员权限 |
| /api/admin/backup-records/:backupId/restore | POST | 执行数据恢复 | admin_backup_records | 管理员权限 |
| /api/admin/system-configs | GET | 获取系统配置 | admin_system_configs | 管理员权限 |
| /api/admin/system-configs | PUT | 更新系统配置 | admin_system_configs | 管理员权限 |
| /api/admin/metrics | GET | 获取系统指标 | admin_system_metrics | 管理员权限 |
| /api/admin/analytics/reports | GET | 获取分析报告 | admin_analytics_reports | 管理员权限 |
| /api/admin/analytics/reports | POST | 创建分析报告 | admin_analytics_reports | 管理员权限 |
| /api/admin/analytics/reports/:reportId | GET | 获取报告详情 | admin_analytics_reports | 管理员权限 |

## 7. 文件上传与管理模块

### 7.1 表结构

| 表名 | 描述 | 关键字段 |
|------|------|----------|
| documents | 文档表 | id, user_id, name, file_path, file_type, file_size, created_at |
| document_types | 文档类型表 | id, type_name, allowed_extensions, max_size |

### 7.2 API接口

| 接口路径 | 方法 | 功能 | 主要数据表 | 权限要求 |
|---------|------|------|------------|----------|
| /api/upload | POST | 上传文件 | documents | 需要认证 |
| /api/documents | GET | 获取文档列表 | documents | 需要认证 |
| /api/documents/:documentId | GET | 获取文档详情 | documents | 文档拥有者或管理员 |
| /api/documents/:documentId | DELETE | 删除文档 | documents | 文档拥有者或管理员 |
| /api/documents/types | GET | 获取文档类型 | document_types | 需要认证 |

## 8. 权限矩阵

| 角色 | 用户管理 | 房间管理 | 费用管理 | 支付管理 | 系统配置 | 管理后台 |
|------|---------|---------|---------|---------|---------|---------|
| system_admin | 全部 | 全部 | 全部 | 全部 | 全部 | 全部 |
| admin | 查看/创建/编辑 | 查看/创建/编辑 | 查看/创建/编辑 | 查看/创建/编辑 | 查看 | 全部 |
| dorm_leader | 查看 | 查看/创建/编辑 | 查看/创建/编辑 | 查看/创建/编辑 | 无 | 无 |
| payer | 查看 | 查看 | 查看/创建/编辑 | 查看/创建/编辑 | 无 | 无 |
| regular_user | 查看 | 查看 | 查看 | 查看/创建/编辑 | 无 | 无 |

## 9. 数据流转图

```
用户操作 -> API接口 -> 服务层 -> 数据访问层 -> 数据库表
     ^                                            |
     |                                            v
前端界面 <- 响应数据 <- 控制器层 <- 业务逻辑层 <- 查询结果
```

## 10. 注意事项

1. 所有涉及用户身份验证的接口都需要通过JWT token进行验证
2. 权限控制按照角色进行，需要在接口处理逻辑中验证用户角色
3. 对于敏感操作（如删除、修改关键配置等），需要记录操作日志
4. 数据备份任务应由系统自动定期执行，管理员也可以手动触发
5. 系统性能监控指标应定期收集并存储，用于系统优化
6. 所有API接口应遵循统一的响应格式：`{success: boolean, message: string, data: object}`
7. 错误处理应使用HTTP状态码与业务错误码相结合的方式
8. 对于大数据量的查询接口，应实现分页功能以提高性能