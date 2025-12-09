# 客户端页面API接口清单

## 一、用户认证模块

### 1.1 登录相关接口
- **POST /api/auth/login** - 用户登录
  - 参数：username, password, captchaCode, twoFactorCode
  - 返回：登录成功/失败信息，token

- **POST /api/auth/logout** - 用户退出登录
  - 参数：token
  - 返回：退出成功/失败信息

- **GET /api/auth/captcha** - 获取验证码图片
  - 返回：验证码图片数据

- **POST /api/auth/verify-two-factor** - 两步验证
  - 参数：username, password, twoFactorCode
  - 返回：验证结果

### 1.2 注册相关接口
- **POST /api/auth/register** - 用户注册
  - 参数：username, email, password, confirmPassword
  - 返回：注册成功/失败信息

- **POST /api/auth/send-email-code** - 发送邮箱验证码
  - 参数：email
  - 返回：发送成功/失败信息

- **POST /api/auth/verify-email** - 邮箱验证
  - 参数：email, code
  - 返回：验证结果

## 二、宿舍管理模块

### 2.1 宿舍CRUD接口
- **GET /api/dorms** - 获取宿舍列表
  - 参数：page, size, search, status
  - 返回：宿舍列表数据

- **POST /api/dorms** - 创建宿舍
  - 参数：dormName, address, capacity, description
  - 返回：创建成功/失败信息

- **GET /api/dorms/{id}** - 获取宿舍详情
  - 返回：宿舍详细信息

- **PUT /api/dorms/{id}** - 更新宿舍信息
  - 参数：dormName, address, capacity, description
  - 返回：更新成功/失败信息

- **DELETE /api/dorms/{id}** - 删除宿舍
  - 返回：删除成功/失败信息

## 三、成员管理模块

### 3.1 成员统计接口
- **GET /api/members/stats** - 获取成员统计数据
  - 返回：总成员数、活跃成员、待确认、平均费用数据

- **GET /api/members/activities** - 获取最近活动
  - 参数：limit
  - 返回：最近活动列表

### 3.2 成员管理接口
- **GET /api/members** - 获取成员列表
  - 参数：page, size, search, role, status
  - 返回：成员列表数据

- **POST /api/members/invite** - 邀请成员
  - 参数：email, role, dormId
  - 返回：邀请成功/失败信息

- **PUT /api/members/{id}/role** - 更新成员角色
  - 参数：role
  - 返回：更新成功/失败信息

- **PUT /api/members/{id}/status** - 更新成员状态
  - 参数：status
  - 返回：更新成功/失败信息

- **DELETE /api/members/{id}** - 删除成员
  - 返回：删除成功/失败信息

### 3.3 成员快速统计接口
- **GET /api/members/quick-stats** - 获取快速统计数据
  - 返回：活跃率、管理员数量、普通成员数量、平均费用

## 四、费用管理模块

### 4.1 费用统计接口
- **GET /api/expenses/summary** - 获取费用统计摘要
  - 返回：总费用、待审核、已通过、本月费用数据

- **GET /api/expenses/trend** - 获取费用趋势数据
  - 参数：period（month/year）
  - 返回：趋势数据

### 4.2 费用CRUD接口
- **GET /api/expenses** - 获取费用列表
  - 参数：page, size, search, status, category, month, dormId
  - 返回：费用列表数据

- **POST /api/expenses** - 创建费用
  - 参数：title, amount, category, description, dormId, payerId
  - 返回：创建成功/失败信息

- **GET /api/expenses/{id}** - 获取费用详情
  - 返回：费用详细信息

- **PUT /api/expenses/{id}** - 更新费用
  - 参数：title, amount, category, description
  - 返回：更新成功/失败信息

- **DELETE /api/expenses/{id}** - 删除费用
  - 返回：删除成功/失败信息

### 4.3 费用审核接口
- **POST /api/expenses/{id}/approve** - 审核通过费用
  - 参数：comment
  - 返回：审核成功/失败信息

- **POST /api/expenses/{id}/reject** - 拒绝费用
  - 参数：reason
  - 返回：审核成功/失败信息

- **POST /api/expenses/batch-approve** - 批量审核通过
  - 参数：expenseIds, comment
  - 返回：批量审核结果

- **POST /api/expenses/batch-reject** - 批量拒绝
  - 参数：expenseIds, reason
  - 返回：批量审核结果

- **POST /api/expenses/batch-delete** - 批量删除
  - 参数：expenseIds
  - 返回：批量删除结果

## 五、账单管理模块

### 5.1 账单类型管理接口
- **GET /api/bill-types** - 获取账单类型列表
  - 返回：账单类型配置数据

### 5.2 账单周期管理接口
- **GET /api/bill-cycles** - 获取账单周期列表
  - 返回：账单周期配置数据

### 5.3 成员分配接口
- **GET /api/dorms/{dormId}/members** - 获取宿舍成员列表
  - 返回：宿舍成员数据

- **POST /api/bills/calculate-split** - 计算费用分摊
  - 参数：totalAmount, memberIds, splitType
  - 返回：分摊结果

### 5.4 定时账单接口
- **POST /api/bills/schedule** - 设置定时账单生成
  - 参数：billTemplate, scheduleConfig
  - 返回：设置成功/失败信息

- **PUT /api/bills/{id}/schedule** - 更新定时账单设置
  - 参数：scheduleConfig
  - 返回：更新成功/失败信息

- **DELETE /api/bills/{id}/schedule** - 删除定时账单设置
  - 返回：删除成功/失败信息

### 5.5 账单CRUD接口
- **GET /api/bills** - 获取账单列表
  - 参数：page, size, search, status, dateRange, type, dormId
  - 返回：账单列表数据

- **POST /api/bills** - 创建账单
  - 参数：title, type, amount, description, dueDate, memberIds, splitConfig
  - 返回：创建成功/失败信息

- **GET /api/bills/{id}** - 获取账单详情
  - 返回：账单详细信息

- **PUT /api/bills/{id}** - 更新账单
  - 参数：title, type, amount, description, dueDate, memberIds
  - 返回：更新成功/失败信息

- **DELETE /api/bills/{id}** - 删除账单
  - 返回：删除成功/失败信息

### 5.6 账单操作接口
- **POST /api/bills/{id}/duplicate** - 复制账单
  - 返回：复制结果

- **POST /api/bills/{id}/share** - 分享账单
  - 参数：shareType, targetUsers
  - 返回：分享结果

- **GET /api/bills/{id}/export/pdf** - 导出账单PDF
  - 返回：PDF文件

- **POST /api/bills/batch-delete** - 批量删除账单
  - 参数：billIds
  - 返回：批量删除结果

### 5.7 账单统计接口
- **GET /api/bills/stats** - 获取账单统计数据
  - 返回：账单统计信息

## 六、支付管理模块

### 6.1 支付接口
- **GET /api/payment/methods** - 获取支付方式列表
  - 返回：可用支付方式

- **POST /api/payment/process** - 处理支付
  - 参数：billId, paymentMethod, amount
  - 返回：支付结果

- **GET /api/payment/calculate** - 计算费用分摊
  - 参数：totalAmount, memberIds
  - 返回：分摊结果

- **POST /api/payment/quick-pay** - 快速支付
  - 参数：billIds, paymentMethod
  - 返回：支付结果

### 6.2 支付记录接口
- **GET /api/payment/records** - 获取支付记录
  - 参数：page, size, dateRange, memberId
  - 返回：支付记录列表

- **GET /api/payment/records/{id}** - 获取支付记录详情
  - 返回：支付记录详细信息

## 七、统计分析模块

### 7.1 统计概览接口
- **GET /api/statistics/overview** - 获取统计概览
  - 返回：总支出、预算余额、支出趋势、活跃用户数据

- **GET /api/statistics/expense-category** - 获取支出分类统计
  - 参数：period
  - 返回：分类统计数据

- **GET /api/statistics/trend** - 获取趋势分析数据
  - 参数：period, type
  - 返回：趋势数据

### 7.2 预算管理接口
- **GET /api/budget** - 获取预算信息
  - 返回：预算数据

- **PUT /api/budget** - 更新预算
  - 参数：totalBudget, monthlyBudget
  - 返回：更新成功/失败信息

## 八、系统配置模块

### 8.1 通用接口
- **GET /api/config/dictionary** - 获取数据字典
  - 参数：type
  - 返回：字典数据

- **GET /api/config/dorm-types** - 获取宿舍类型
  - 返回：宿舍类型列表

- **GET /api/config/expense-categories** - 获取费用类别
  - 返回：费用类别列表

## 九、文件上传模块

### 9.1 文件相关接口
- **POST /api/upload/image** - 上传图片
  - 参数：file
  - 返回：图片URL

- **POST /api/upload/avatar** - 上传头像
  - 参数：file
  - 返回：头像URL

## 十、用户管理模块

### 10.1 个人资料接口
- **GET /api/profile** - 获取当前用户信息
  - 返回：用户详细信息

- **PUT /api/profile** - 更新个人信息
  - 参数：name, email, phone, avatar
  - 返回：更新成功/失败信息

- **POST /api/profile/upload-avatar** - 上传头像
  - 参数：avatarFile
  - 返回：头像URL

### 10.2 偏好设置接口
- **GET /api/profile/preferences** - 获取用户偏好设置
  - 返回：偏好设置数据

- **PUT /api/profile/preferences** - 更新偏好设置
  - 参数：language, theme, notifications, timezone
  - 返回：更新成功/失败信息

### 10.3 安全设置接口
- **PUT /api/profile/password** - 修改密码
  - 参数：oldPassword, newPassword, confirmPassword
  - 返回：修改成功/失败信息

- **POST /api/profile/two-factor/enable** - 启用两步验证
  - 返回：设置信息

- **POST /api/profile/two-factor/disable** - 禁用两步验证
  - 参数：password
  - 返回：操作结果

- **POST /api/profile/login-sessions** - 获取登录会话列表
  - 返回：登录会话数据

- **DELETE /api/profile/login-sessions/{sessionId}** - 退出指定设备
  - 返回：操作结果

## 十一、智能提醒模块

### 11.1 智能提醒接口
- **GET /api/smart-notifications** - 获取智能提醒列表
  - 参数：priority, type, unread
  - 返回：智能提醒列表

- **POST /api/smart-notifications/{id}/handle** - 处理提醒
  - 参数：action
  - 返回：处理结果

- **POST /api/smart-notifications/generate** - 生成智能提醒
  - 参数：triggerType, data
  - 返回：生成结果

### 11.2 仪表盘配置接口
- **GET /api/dashboard/widgets** - 获取Widget配置
  - 返回：用户Widget配置

- **PUT /api/dashboard/widgets** - 更新Widget配置
  - 参数：enabledWidgets, layout, autoRefresh
  - 返回：更新结果

- **GET /api/dashboard/stats** - 获取仪表盘统计数据
  - 返回：宿舍数量、成员数量、本月支出、总预算

- **GET /api/dashboard/activities** - 获取最近活动
  - 参数：limit
  - 返回：最近活动列表

### 11.3 实时更新接口
- **POST /api/dashboard/refresh** - 手动刷新数据
  - 返回：刷新结果

- **PUT /api/dashboard/auto-refresh** - 设置自动刷新
  - 参数：enabled, interval
  - 返回：设置结果

## 十二、费用审核模块

### 12.1 审核流程接口
- **GET /api/expense-review/pending** - 获取待审核费用列表
  - 参数：page, size, category, amountRange, search
  - 返回：待审核费用列表

- **GET /api/expense-review/{id}** - 获取费用审核详情
  - 返回：费用详细信息

- **POST /api/expense-review/{id}/approve** - 审核通过
  - 参数：comment
  - 返回：审核结果

- **POST /api/expense-review/{id}/reject** - 审核拒绝
  - 参数：reason
  - 返回：审核结果

- **POST /api/expense-review/batch-approve** - 批量审核通过
  - 参数：expenseIds, comment
  - 返回：批量审核结果

- **POST /api/expense-review/batch-reject** - 批量审核拒绝
  - 参数：expenseIds, reason
  - 返回：批量审核结果

### 12.2 审核统计接口
- **GET /api/expense-review/stats** - 获取审核统计
  - 返回：待审核总数、待审核总金额、紧急费用数

## 十三、预算管理模块

### 13.1 预算管理接口
- **GET /api/budgets** - 获取预算列表
  - 参数：page, size, search, category
  - 返回：预算列表

- **POST /api/budgets** - 创建预算
  - 参数：name, amount, category, period, description
  - 返回：创建结果

- **GET /api/budgets/{id}** - 获取预算详情
  - 返回：预算详细信息

- **PUT /api/budgets/{id}** - 更新预算
  - 参数：name, amount, category, description
  - 返回：更新结果

- **DELETE /api/budgets/{id}** - 删除预算
  - 返回：删除结果

### 13.2 预算监控接口
- **GET /api/budgets/overview** - 获取预算概览
  - 返回：总预算、已使用、剩余、使用率

- **GET /api/budgets/progress** - 获取预算执行进度
  - 返回：进度数据

- **GET /api/budgets/warnings** - 获取超支预警
  - 返回：超支项目列表

- **GET /api/budgets/advice** - 获取预算建议
  - 返回：预算建议列表

### 13.3 预算导入导出接口
- **GET /api/budgets/export** - 导出预算数据
  - 返回：Excel文件

- **POST /api/budgets/import** - 导入预算数据
  - 参数：file
  - 返回：导入结果

## 十四、安全设置模块

### 14.1 密码安全接口
- **PUT /api/auth/password** - 修改登录密码
  - 参数：oldPassword, newPassword
  - 返回：修改结果

- **GET /api/auth/password-strength** - 获取密码强度
  - 参数：password
  - 返回：密码强度评级

### 14.2 两步验证接口
- **POST /api/auth/2fa/enable** - 启用两步验证
  - 返回：启用结果和二维码

- **POST /api/auth/2fa/disable** - 禁用两步验证
  - 参数：password, code
  - 返回：禁用结果

- **GET /api/auth/2fa/backup-codes** - 获取备用验证码
  - 返回：备用验证码列表

- **POST /api/auth/2fa/verify** - 验证两步验证码
  - 参数：code
  - 返回：验证结果

### 14.3 验证绑定接口
- **POST /api/auth/phone/bind** - 绑定手机号
  - 参数：phone, verificationCode
  - 返回：绑定结果

- **POST /api/auth/phone/unbind** - 解绑手机号
  - 参数：password
  - 返回：解绑结果

- **POST /api/auth/email/bind** - 绑定邮箱
  - 参数：email, verificationCode
  - 返回：绑定结果

- **POST /api/auth/email/unbind** - 解绑邮箱
  - 参数：password
  - 返回：解绑结果

### 14.4 生物识别接口
- **POST /api/auth/biometric/fingerprint** - 启用/禁用指纹识别
  - 参数：enabled, biometricData
  - 返回：操作结果

- **POST /api/auth/biometric/face** - 启用/禁用面部识别
  - 参数：enabled, biometricData
  - 返回：操作结果

- **GET /api/auth/biometric/available** - 检查设备生物识别支持
  - 返回：支持的生物识别方式

### 14.5 登录管理接口
- **GET /api/auth/devices** - 获取登录设备列表
  - 返回：设备列表

- **DELETE /api/auth/devices/{id}** - 移除登录设备
  - 返回：移除结果

- **GET /api/auth/login-history** - 获取登录记录
  - 参数：page, size, timeRange
  - 返回：登录记录列表

- **POST /api/auth/logout-all** - 登出所有设备
  - 参数：password
  - 返回：登出结果

### 14.6 登录安全接口
- **PUT /api/auth/rate-limit** - 设置登录频率限制
  - 参数：enabled, maxAttempts, timeWindow
  - 返回：设置结果

- **POST /api/auth/rate-limit/reset** - 重置频率限制计数器
  - 返回：重置结果

- **GET /api/auth/account-status** - 获取账户状态
  - 返回：账户状态信息

- **POST /api/auth/account/unlock** - 解锁账户
  - 参数：password
  - 返回：解锁结果

## 十五、通知消息模块

### 15.1 消息接口
- **GET /api/notifications** - 获取通知列表
  - 参数：page, size, type, read, category
  - 返回：通知列表

- **GET /api/notifications/{id}** - 获取通知详情
  - 返回：通知详细信息

- **PUT /api/notifications/{id}/read** - 标记通知为已读
  - 返回：操作成功/失败信息

- **POST /api/notifications/mark-all-read** - 标记所有通知为已读
  - 返回：操作成功/失败信息

- **PUT /api/notifications/{id}/unread** - 标记通知为未读
  - 返回：操作成功/失败信息

- **POST /api/notifications/batch/read** - 批量标记已读
  - 参数：notificationIds
  - 返回：批量操作结果

- **POST /api/notifications/batch/unread** - 批量标记未读
  - 参数：notificationIds
  - 返回：批量操作结果

- **DELETE /api/notifications/{id}** - 删除通知
  - 返回：删除成功/失败信息

- **POST /api/notifications/batch/delete** - 批量删除通知
  - 参数：notificationIds
  - 返回：批量删除结果

- **POST /api/notifications/send** - 发送通知
  - 参数：userId, title, content, type, category
  - 返回：发送结果

- **GET /api/notifications/stats** - 获取通知统计
  - 返回：总通知数、未读数、重要通知数、今日通知数

- **GET /api/notifications/categories** - 获取通知分类
  - 返回：分类列表

### 15.2 通知设置接口
- **GET /api/notifications/settings** - 获取通知设置
  - 返回：用户通知设置

- **PUT /api/notifications/settings** - 更新通知设置
  - 参数：emailEnabled, pushEnabled, categorySettings
  - 返回：更新结果

## 十六、维护模式模块

### 16.1 维护控制接口
- **POST /api/maintenance/start** - 启动维护模式
  - 参数：countdownMinutes, message
  - 返回：启动结果

- **POST /api/maintenance/cancel** - 取消维护模式
  - 返回：取消结果

- **GET /api/maintenance/status** - 获取维护状态
  - 返回：维护模式状态信息

- **GET /api/maintenance/remaining** - 获取剩余时间
  - 返回：剩余维护时间

### 16.2 维护配置接口
- **GET /api/maintenance/config** - 获取维护配置
  - 返回：维护模式配置

- **PUT /api/maintenance/config** - 更新维护配置
  - 参数：message, duration, enabled
  - 返回：更新结果

---

## 接口设计规范

### 响应格式
所有API接口统一返回格式：
```json
{
  "success": true,
  "data": {
    // 实际数据
  },
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 错误处理
```json
{
  "success": false,
  "data": null,
  "message": "错误信息",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 状态码规范
- 200: 操作成功
- 400: 请求参数错误
- 401: 未授权
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

### 权限控制
- 系统管理员：拥有所有权限
- 管理员：拥有管理端所有权限，无客户端操作权限
- 寝室长：可管理宿舍成员和费用，无系统配置权限
- 缴费人：可查看和支付账单，无管理权限
- 普通用户：基础查看权限