# 客户端页面API接口清单

## 一、用户认证模块

### 1.1 登录相关接口

#### 1.1.1 用户登录
- **接口地址**: `/api/auth/login`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "username": "string",     // 用户名，必填
  "password": "string",     // 密码，必填
  "captchaCode": "string",  // 验证码，可选（需要验证码时必填）
  "twoFactorCode": "string" // 两步验证代码，可选（启用两步验证时必填）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "token": "string",           // JWT访问令牌
    "refreshToken": "string",    // 刷新令牌
    "userInfo": {
      "id": "number",            // 用户ID
      "username": "string",      // 用户名
      "nickname": "string",      // 昵称
      "email": "string",         // 邮箱
      "avatar": "string",        // 头像URL
      "role": "string",          // 用户角色
      "dormId": "number",        // 宿舍ID
      "dormName": "string"       // 宿舍名称
    },
    "expiresIn": "number"        // 令牌有效期（秒）
  },
  "message": "登录成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 用户登录认证，支持用户名密码登录，可选验证码和两步验证功能

#### 1.1.2 用户退出登录
- **接口地址**: `/api/auth/logout`
- **请求方法**: `POST`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": null,
  "message": "退出登录成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 用户退出登录，清除会话信息

#### 1.1.3 获取验证码图片
- **接口地址**: `/api/auth/captcha`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "captchaId": "string",       // 验证码ID
    "captchaImage": "string",    // 验证码图片Base64编码
    "expireTime": "number"       // 过期时间（秒）
  },
  "message": "获取验证码成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取登录验证码图片，用于防止暴力破解

#### 1.1.4 刷新访问令牌
- **接口地址**: `/api/auth/refresh-token`
- **请求方法**: `POST`
- **安全策略**:
  1. **令牌有效期**: 访问令牌（Access Token）有效期为 2 小时，刷新令牌（Refresh Token）有效期为 14 天。
  2. **令牌轮转**: 每次刷新令牌时，都会生成新的刷新令牌，旧令牌将失效（TOKEN_REVOKED）。
  3. **预刷新机制**: 前端建议在访问令牌过期前 5 分钟自动触发刷新请求。
  4. **错误处理**: 
     - 如果令牌已过期，返回 401 错误码 `TOKEN_EXPIRED`。
     - 如果令牌已被撤销（由于轮转或安全原因），返回 401 错误码 `TOKEN_REVOKED`。
- **请求参数**:
```json
{
  "refreshToken": "string"  // 刷新令牌，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "accessToken": "string",   // 新的JWT访问令牌
    "refreshToken": "string",  // 新的刷新令牌（支持令牌轮转）
    "expiresIn": 7200,         // 令牌有效期（秒，当前配置为2小时）
    "refreshExpiresIn": 1209600 // 刷新令牌有效期（秒，当前配置为14天）
  },
  "message": "刷新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 使用刷新令牌获取新的访问令牌，实现无缝续期。

#### 1.1.5 两步验证
- **接口地址**: `/api/auth/verify-two-factor`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "username": "string",          // 用户名，必填
  "password": "string",          // 密码，必填
  "twoFactorCode": "string"      // 两步验证代码，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "verified": "boolean",       // 验证是否通过
    "message": "string"          // 验证结果消息
  },
  "message": "两步验证成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 处理两步验证流程，提高账户安全性

### 1.2 注册相关接口

#### 1.2.1 用户注册
- **接口地址**: `/api/auth/register`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "username": "string",           // 用户名，必填
  "email": "string",              // 邮箱，必填
  "password": "string",           // 密码，必填
  "confirmPassword": "string",    // 确认密码，必填
  "nickname": "string",           // 昵称，可选
  "inviteCode": "string"          // 邀请码，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "userId": "number",           // 注册成功的用户ID
    "username": "string",         // 用户名
    "email": "string",            // 邮箱
    "status": "string"            // 用户状态
  },
  "message": "注册成功，请查收邮件验证",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 用户注册新账户，支持邮箱验证流程

#### 1.2.2 发送邮箱验证码
- **接口地址**: `/api/auth/send-email-code`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "email": "string",              // 邮箱地址，必填
  "type": "string"                // 验证码类型，必填（register/reset/verify）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "sent": "boolean",            // 是否发送成功
    "message": "string"           // 发送结果消息
  },
  "message": "验证码发送成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 发送邮箱验证码，支持注册、找回密码等场景

#### 1.2.3 邮箱验证
- **接口地址**: `/api/auth/verify-email`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "email": "string",              // 邮箱地址，必填
  "code": "string"                // 验证码，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "verified": "boolean",        // 验证是否成功
    "message": "string"           // 验证结果消息
  },
  "message": "邮箱验证成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 验证邮箱验证码，完成邮箱验证流程

#### 1.2.4 重置密码
- **接口地址**: `/api/auth/reset-password`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "email": "string",              // 邮箱地址，必填
  "code": "string",               // 验证码，必填
  "newPassword": "string",        // 新密码，必填
  "confirmPassword": "string"     // 确认密码，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "reset": "boolean"            // 密码重置是否成功
  },
  "message": "密码重置成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 通过邮箱验证重置用户密码

## 二、宿舍管理模块

### 2.1 宿舍CRUD接口

#### 2.1.1 获取宿舍列表
- **接口地址**: `/api/dorms`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "page": "number",               // 页码，默认1，可选
  "size": "number",               // 每页数量，默认20，可选
  "search": "string",             // 搜索关键词，可选
  "status": "string"              // 宿舍状态，可选（active/inactive）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "dorms": [
      {
        "id": "number",           // 宿舍ID
        "dormName": "string",     // 宿舍名称
        "address": "string",      // 宿舍地址
        "capacity": "number",     // 容量人数
        "currentOccupancy": "number", // 当前入住人数
        "description": "string",  // 宿舍描述
        "status": "string",       // 状态（active/inactive）
        "createdAt": "string",    // 创建时间
        "updatedAt": "string"     // 更新时间
      }
    ],
    "total": "number",            // 总记录数
    "page": "number",             // 当前页码
    "size": "number",             // 每页数量
    "pages": "number"             // 总页数
  },
  "message": "获取宿舍列表成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取宿舍列表，支持分页和搜索功能

#### 2.1.2 创建宿舍
- **接口地址**: `/api/dorms`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "dormName": "string",           // 宿舍名称，必填
  "address": "string",            // 宿舍地址，必填
  "capacity": "number",           // 容量人数，必填
  "description": "string"         // 宿舍描述，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 宿舍ID
    "dormName": "string",         // 宿舍名称
    "address": "string",          // 宿舍地址
    "capacity": "number",         // 容量人数
    "description": "string"       // 宿舍描述
  },
  "message": "宿舍创建成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 创建新的宿舍信息

#### 2.1.3 获取宿舍详情
- **接口地址**: `/api/dorms/{id}`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 宿舍ID
    "dormName": "string",         // 宿舍名称
    "address": "string",          // 宿舍地址
    "capacity": "number",         // 容量人数
    "currentOccupancy": "number", // 当前入住人数
    "description": "string",      // 宿舍描述
    "status": "string",           // 状态
    "members": [                  // 宿舍成员列表
      {
        "id": "number",           // 成员ID
        "username": "string",     // 用户名
        "nickname": "string",     // 昵称
        "role": "string",         // 角色
        "joinDate": "string"      // 加入日期
      }
    ],
    "createdAt": "string",        // 创建时间
    "updatedAt": "string"         // 更新时间
  },
  "message": "获取宿舍详情成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取指定宿舍的详细信息和成员列表

#### 2.1.4 更新宿舍信息
- **接口地址**: `/api/dorms/{id}`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "dormName": "string",           // 宿舍名称，可选
  "address": "string",            // 宿舍地址，可选
  "capacity": "number",           // 容量人数，可选
  "description": "string"         // 宿舍描述，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 宿舍ID
    "dormName": "string",         // 宿舍名称
    "address": "string",          // 宿舍地址
    "capacity": "number",         // 容量人数
    "description": "string"       // 宿舍描述
  },
  "message": "宿舍信息更新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 更新指定宿舍的信息

#### 2.1.5 删除宿舍
- **接口地址**: `/api/dorms/{id}`
- **请求方法**: `DELETE`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": null,
  "message": "宿舍删除成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 删除指定的宿舍

## 三、成员管理模块

### 3.1 成员统计接口

#### 3.1.1 获取成员统计数据
- **接口地址**: `/api/members/stats`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "totalMembers": "number",       // 总成员数
    "activeMembers": "number",      // 活跃成员数
    "pendingMembers": "number",     // 待确认成员数
    "averageExpense": "number",     // 平均费用
    "adminsCount": "number",        // 管理员数量
    "roleDistribution": {           // 角色分布
      "admin": "number",            // 管理员数量
      "member": "number",           // 普通成员数量
      "viewer": "number"            // 查看者数量
    }
  },
  "message": "获取成员统计成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取成员统计数据，包括总数、活跃数、平均费用等

#### 3.1.2 获取最近活动
- **接口地址**: `/api/members/activities`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "limit": "number"                // 活动数量限制，默认10，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "number",           // 活动ID
        "type": "string",         // 活动类型（join/leave/update）
        "userId": "number",       // 用户ID
        "username": "string",     // 用户名
        "nickname": "string",     // 昵称
        "description": "string",  // 活动描述
        "timestamp": "string"     // 活动时间
      }
    ]
  },
  "message": "获取最近活动成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取宿舍成员最近的活动记录

### 3.2 成员管理接口

#### 3.2.1 获取成员列表
- **接口地址**: `/api/members`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "page": "number",               // 页码，默认1，可选
  "size": "number",               // 每页数量，默认20，可选
  "search": "string",             // 搜索关键词，可选
  "role": "string",               // 成员角色，可选（admin/member/viewer）
  "status": "string"              // 成员状态，可选（active/inactive/pending）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "number",           // 成员ID
        "username": "string",     // 用户名
        "nickname": "string",     // 昵称
        "email": "string",        // 邮箱
        "phone": "string",        // 电话
        "avatar": "string",       // 头像URL
        "role": "string",         // 角色（admin/member/viewer）
        "status": "string",       // 状态（active/inactive/pending）
        "joinDate": "string",     // 加入日期
        "lastActiveAt": "string", // 最后活跃时间
        "expenseCount": "number", // 费用记录数
        "totalExpense": "number"  // 总费用
      }
    ],
    "total": "number",            // 总记录数
    "page": "number",             // 当前页码
    "size": "number",             // 每页数量
    "pages": "number"             // 总页数
  },
  "message": "获取成员列表成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取宿舍成员列表，支持分页、搜索和筛选

#### 3.2.2 邀请成员
- **接口地址**: `/api/members/invite`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "email": "string",              // 被邀请人邮箱，必填
  "role": "string",               // 角色，必填（admin/member/viewer）
  "dormId": "number",             // 宿舍ID，必填
  "message": "string"             // 邀请消息，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "inviteId": "number",         // 邀请ID
    "inviteCode": "string",       // 邀请码
    "status": "string",           // 邀请状态
    "expiresAt": "string"         // 过期时间
  },
  "message": "邀请发送成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 邀请新成员加入宿舍

#### 3.2.3 更新成员角色
- **接口地址**: `/api/members/{id}/role`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "role": "string"                // 新角色，必填（admin/member/viewer）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "memberId": "number",         // 成员ID
    "newRole": "string",          // 新角色
    "updatedAt": "string"         // 更新时间
  },
  "message": "成员角色更新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 更新指定成员的角色权限

#### 3.2.4 更新成员状态
- **接口地址**: `/api/members/{id}/status`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "status": "string"              // 成员状态，必填（active/inactive/pending）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "memberId": "number",         // 成员ID
    "status": "string",           // 成员状态
    "updatedAt": "string"         // 更新时间
  },
  "message": "成员状态更新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 更新指定成员的状态

#### 3.2.5 删除成员
- **接口地址**: `/api/members/{id}`
- **请求方法**: `DELETE`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": null,
  "message": "成员删除成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 从宿舍中移除指定成员

### 3.3 成员快速统计接口

#### 3.3.1 获取快速统计数据
- **接口地址**: `/api/members/quick-stats`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "activeRate": "number",       // 活跃率（百分比）
    "adminCount": "number",       // 管理员数量
    "memberCount": "number",      // 普通成员数量
    "averageExpense": "number"    // 平均费用
  },
  "message": "获取快速统计成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取成员快速统计数据

## 四、费用管理模块

### 4.1 费用统计接口

#### 4.1.1 获取费用统计摘要
- **接口地址**: `/api/expenses/summary`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "totalExpenses": "number",     // 总费用
    "pendingExpenses": "number",   // 待审核费用
    "approvedExpenses": "number",  // 已通过费用
    "rejectedExpenses": "number",  // 已拒绝费用
    "monthlyExpenses": "number",   // 本月费用
    "categoryStats": [             // 分类统计
      {
        "category": "string",      // 费用类别
        "amount": "number",        // 金额
        "count": "number"          // 数量
      }
    ]
  },
  "message": "获取费用统计成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取费用统计数据摘要

#### 4.1.2 获取费用趋势数据
- **接口地址**: `/api/expenses/trend`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "period": "string"              // 时间周期，必填（month/year）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "trendData": [                // 趋势数据
      {
        "period": "string",       // 时间周期（2024-01）
        "amount": "number",       // 金额
        "count": "number"         // 数量
      }
    ],
    "totalAmount": "number",      // 总金额
    "growthRate": "number"        // 增长率
  },
  "message": "获取趋势数据成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取费用趋势分析数据

### 4.2 费用CRUD接口

#### 4.2.1 获取费用列表
- **接口地址**: `/api/expenses`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "page": "number",               // 页码，默认1，可选
  "size": "number",               // 每页数量，默认20，可选
  "search": "string",             // 搜索关键词，可选
  "status": "string",             // 状态，可选（pending/approved/rejected）
  "category": "string",           // 类别，可选（accommodation/utilities/maintenance/cleaning/other）
  "month": "string",              // 月份，可选（2024-01）
  "dormId": "number"              // 宿舍ID，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "number",           // 费用ID
        "title": "string",        // 费用标题
        "amount": "number",       // 费用金额
        "category": "string",     // 费用类别
        "description": "string",  // 费用描述
        "applicant": "string",    // 申请人
        "applicantId": "number",  // 申请人ID
        "status": "string",       // 状态（pending/approved/rejected）
        "isUrgent": "boolean",    // 是否紧急
        "receiptUrl": "string",   // 票据URL
        "date": "string",         // 申请日期
        "approvedAt": "string",   // 审核时间
        "approvedBy": "string",   // 审核人
        "reviewComment": "string" // 审核意见
      }
    ],
    "total": "number",            // 总记录数
    "page": "number",             // 当前页码
    "size": "number",             // 每页数量
    "pages": "number"             // 总页数
  },
  "message": "获取费用列表成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取费用列表，支持分页、搜索和筛选

#### 4.2.2 创建费用
- **接口地址**: `/api/expenses`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "title": "string",              // 费用标题，必填
  "amount": "number",             // 费用金额，必填
  "category": "string",           // 费用类别，必填（accommodation/utilities/maintenance/cleaning/other）
  "description": "string",        // 费用描述，必填
  "dormId": "number",             // 宿舍ID，必填
  "payerId": "number",            // 支付人ID，必填
  "receiptFile": "file",          // 票据文件，可选
  "isUrgent": "boolean"           // 是否紧急，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 费用ID
    "title": "string",            // 费用标题
    "amount": "number",           // 费用金额
    "category": "string",         // 费用类别
    "description": "string",      // 费用描述
    "status": "string",           // 状态
    "receiptUrl": "string"        // 票据URL
  },
  "message": "费用创建成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 创建新的费用记录

#### 4.2.3 获取费用详情
- **接口地址**: `/api/expenses/{id}`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 费用ID
    "title": "string",            // 费用标题
    "amount": "number",           // 费用金额
    "category": "string",         // 费用类别
    "description": "string",      // 费用描述
    "applicant": "string",        // 申请人
    "applicantId": "number",      // 申请人ID
    "status": "string",           // 状态
    "isUrgent": "boolean",        // 是否紧急
    "receiptUrl": "string",       // 票据URL
    "date": "string",             // 申请日期
    "approvedAt": "string",       // 审核时间
    "approvedBy": "string",       // 审核人
    "reviewComment": "string",    // 审核意见
    "dormName": "string"          // 宿舍名称
  },
  "message": "获取费用详情成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取指定费用的详细信息

#### 4.2.4 更新费用
- **接口地址**: `/api/expenses/{id}`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "title": "string",              // 费用标题，可选
  "amount": "number",             // 费用金额，可选
  "category": "string",           // 费用类别，可选
  "description": "string"         // 费用描述，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 费用ID
    "title": "string",            // 费用标题
    "amount": "number",           // 费用金额
    "category": "string",         // 费用类别
    "description": "string"       // 费用描述
  },
  "message": "费用更新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 更新指定费用的信息

#### 4.2.5 删除费用
- **接口地址**: `/api/expenses/{id}`
- **请求方法**: `DELETE`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": null,
  "message": "费用删除成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 删除指定的费用记录

### 4.3 费用审核接口

#### 4.3.1 获取待审核费用列表
- **接口地址**: `/api/expenses/pending`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "page": "number",               // 页码，默认1，可选
  "size": "number",               // 每页数量，默认20，可选
  "search": "string",             // 搜索关键词，可选
  "category": "string",           // 费用类别，可选
  "priority": "string",           // 优先级，可选（urgent/normal/low）
  "dateRange": "string"           // 日期范围，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "pendingExpenses": [
      {
        "id": "number",           // 费用ID
        "title": "string",        // 费用标题
        "amount": "number",       // 费用金额
        "category": "string",     // 费用类别
        "description": "string",  // 费用描述
        "applicant": "string",    // 申请人
        "applicantId": "number",  // 申请人ID
        "priority": "string",     // 优先级（urgent/normal/low）
        "date": "string",         // 申请日期
        "receiptUrl": "string",   // 票据URL
        "daysPending": "number"   // 待审核天数
      }
    ],
    "total": "number",            // 总记录数
    "page": "number",             // 当前页码
    "size": "number",             // 每页数量
    "pages": "number"             // 总页数
  },
  "message": "获取待审核费用列表成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取待审核的费用列表

#### 4.3.2 审核费用
- **接口地址**: `/api/expenses/{id}/review`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "status": "string",             // 审核状态，必填（approved/rejected）
  "comment": "string"             // 审核意见，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "expenseId": "number",        // 费用ID
    "status": "string",           // 审核状态
    "reviewedAt": "string",       // 审核时间
    "reviewedBy": "string",       // 审核人
    "comment": "string"           // 审核意见
  },
  "message": "费用审核成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 审核指定费用

#### 4.3.3 批量审核费用
- **接口地址**: `/api/expenses/batch-review`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "expenseIds": [                 // 费用ID数组，必填
    "number"
  ],
  "status": "string",             // 审核状态，必填（approved/rejected）
  "comment": "string"             // 审核意见，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "processedCount": "number",   // 已处理数量
    "successCount": "number",     // 成功数量
    "failedCount": "number",      // 失败数量
    "failedItems": [              // 失败项目
      {
        "expenseId": "number",    // 费用ID
        "error": "string"         // 错误信息
      }
    ],
    "reviewedAt": "string"        // 审核时间
  },
  "message": "批量审核完成",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 批量审核多个费用

#### 4.3.4 获取审核历史记录
- **接口地址**: `/api/expenses/review-history`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "page": "number",               // 页码，默认1，可选
  "size": "number",               // 每页数量，默认20，可选
  "startDate": "string",          // 开始日期，可选
  "endDate": "string",            // 结束日期，可选
  "status": "string"              // 审核状态，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "reviewHistory": [
      {
        "expenseId": "number",    // 费用ID
        "expenseTitle": "string", // 费用标题
        "amount": "number",       // 费用金额
        "reviewStatus": "string", // 审核状态
        "reviewedAt": "string",   // 审核时间
        "reviewedBy": "string",   // 审核人
        "comment": "string"       // 审核意见
      }
    ],
    "total": "number",            // 总记录数
    "page": "number",             // 当前页码
    "size": "number",             // 每页数量
    "pages": "number"             // 总页数
  },
  "message": "获取审核历史成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取费用审核历史记录

## 五、账单管理模块

### 5.1 账单统计接口

#### 5.1.1 获取账单统计摘要
- **接口地址**: `/api/bills/summary`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "totalBills": "number",       // 总账单数
    "unpaidBills": "number",      // 未付账单数
    "paidBills": "number",        // 已付账单数
    "overdueBills": "number",     // 逾期账单数
    "totalAmount": "number",      // 总金额
    "paidAmount": "number",       // 已付金额
    "unpaidAmount": "number",     // 未付金额
    "monthlyAmount": "number"     // 本月账单金额
  },
  "message": "获取账单统计成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取账单统计数据摘要

#### 5.1.2 获取账单趋势数据
- **接口地址**: `/api/bills/trend`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "period": "string"              // 时间周期，必填（month/year）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "trendData": [                // 趋势数据
      {
        "period": "string",       // 时间周期（2024-01）
        "billCount": "number",    // 账单数量
        "totalAmount": "number",  // 总金额
        "paidAmount": "number",   // 已付金额
        "unpaidAmount": "number"  // 未付金额
      }
    ],
    "averageAmount": "number",    // 平均金额
    "paymentRate": "number"       // 支付率
  },
  "message": "获取账单趋势成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取账单趋势分析数据

### 5.2 账单CRUD接口

#### 5.2.1 获取账单列表
- **接口地址**: `/api/bills`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "page": "number",               // 页码，默认1，可选
  "size": "number",               // 每页数量，默认20，可选
  "search": "string",             // 搜索关键词，可选
  "status": "string",             // 状态，可选（unpaid/paid/overdue/cancelled）
  "type": "string",               // 类型，可选（monthly/one-time/emergency）
  "month": "string",              // 月份，可选（2024-01）
  "dormId": "number"              // 宿舍ID，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "id": "number",           // 账单ID
        "title": "string",        // 账单标题
        "amount": "number",       // 账单金额
        "type": "string",         // 账单类型
        "description": "string",  // 账单描述
        "status": "string",       // 状态
        "dueDate": "string",      // 截止日期
        "createDate": "string",   // 创建日期
        "paidDate": "string",     // 支付日期
        "dormName": "string",     // 宿舍名称
        "expenseCount": "number", // 关联费用数
        "paymentMethod": "string" // 支付方式
      }
    ],
    "total": "number",            // 总记录数
    "page": "number",             // 当前页码
    "size": "number",             // 每页数量
    "pages": "number"             // 总页数
  },
  "message": "获取账单列表成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取账单列表，支持分页、搜索和筛选

#### 5.2.2 创建账单
- **接口地址**: `/api/bills`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "title": "string",              // 账单标题，必填
  "amount": "number",             // 账单金额，必填
  "type": "string",               // 账单类型，必填（monthly/one-time/emergency）
  "description": "string",        // 账单描述，必填
  "dormId": "number",             // 宿舍ID，必填
  "dueDate": "string",            // 截止日期，必填
  "expenseIds": [                 // 关联费用ID数组，可选
    "number"
  ]
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 账单ID
    "title": "string",            // 账单标题
    "amount": "number",           // 账单金额
    "type": "string",             // 账单类型
    "status": "string",           // 状态
    "dueDate": "string",          // 截止日期
    "expenseCount": "number"      // 关联费用数
  },
  "message": "账单创建成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 创建新的账单记录

#### 5.2.3 获取账单详情
- **接口地址**: `/api/bills/{id}`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 账单ID
    "title": "string",            // 账单标题
    "amount": "number",           // 账单金额
    "type": "string",             // 账单类型
    "description": "string",      // 账单描述
    "status": "string",           // 状态
    "dueDate": "string",          // 截止日期
    "createDate": "string",       // 创建日期
    "paidDate": "string",         // 支付日期
    "dormName": "string",         // 宿舍名称
    "expenseDetails": [           // 费用详情
      {
        "expenseId": "number",    // 费用ID
        "title": "string",        // 费用标题
        "amount": "number",       // 费用金额
        "category": "string"      // 费用类别
      }
    ],
    "paymentRecords": [           // 支付记录
      {
        "id": "number",           // 支付记录ID
        "amount": "number",       // 支付金额
        "method": "string",       // 支付方式
        "paidAt": "string",       // 支付时间
        "paidBy": "string"        // 支付人
      }
    ]
  },
  "message": "获取账单详情成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取指定账单的详细信息

#### 5.2.4 更新账单
- **接口地址**: `/api/bills/{id}`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "title": "string",              // 账单标题，可选
  "amount": "number",             // 账单金额，可选
  "type": "string",               // 账单类型，可选
  "description": "string",        // 账单描述，可选
  "dueDate": "string"             // 截止日期，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 账单ID
    "title": "string",            // 账单标题
    "amount": "number",           // 账单金额
    "type": "string",             // 账单类型
    "description": "string",      // 账单描述
    "dueDate": "string"           // 截止日期
  },
  "message": "账单更新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 更新指定账单的信息

#### 5.2.5 删除账单
- **接口地址**: `/api/bills/{id}`
- **请求方法**: `DELETE`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": null,
  "message": "账单删除成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 删除指定的账单记录

#### 5.2.6 生成账单
- **接口地址**: `/api/bills/generate`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "dormId": "number",             // 宿舍ID，必填
  "month": "string",              // 月份，必填（2024-01）
  "type": "string"                // 账单类型，必填（monthly/one-time/emergency）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "billId": "number",           // 生成的账单ID
    "title": "string",            // 账单标题
    "amount": "number",           // 账单金额
    "expenseCount": "number",     // 包含费用数
    "generatedAt": "string"       // 生成时间
  },
  "message": "账单生成成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 基于指定月份的费用数据生成账单

#### 5.2.7 导出账单
- **接口地址**: `/api/bills/{id}/export`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "downloadUrl": "string",      // 下载链接
    "fileName": "string",         // 文件名
    "expiresAt": "string"         // 链接过期时间
  },
  "message": "账单导出成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 导出指定账单为PDF或其他格式

## 六、支付管理模块

### 6.1 支付统计接口

#### 6.1.1 获取支付统计摘要
- **接口地址**: `/api/payments/summary`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "totalPayments": "number",     // 总支付数
    "totalAmount": "number",       // 总支付金额
    "monthlyPayments": "number",   // 本月支付数
    "monthlyAmount": "number",     // 本月支付金额
    "paymentMethods": [            // 支付方式统计
      {
        "method": "string",        // 支付方式
        "count": "number",         // 使用次数
        "amount": "number"         // 支付金额
      }
    ],
    "recentPayments": [            // 最近支付记录
      {
        "id": "number",           // 支付记录ID
        "amount": "number",       // 支付金额
        "method": "string",       // 支付方式
        "paidAt": "string",       // 支付时间
        "billTitle": "string"     // 关联账单标题
      }
    ]
  },
  "message": "获取支付统计成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取支付统计数据摘要

#### 6.1.2 获取支付趋势数据
- **接口地址**: `/api/payments/trend`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "period": "string"              // 时间周期，必填（week/month/year）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "trendData": [                // 趋势数据
      {
        "period": "string",       // 时间周期（2024-01）
        "amount": "number",       // 支付金额
        "count": "number",        // 支付次数
        "averageAmount": "number" // 平均金额
      }
    ],
    "totalAmount": "number",      // 总金额
    "growthRate": "number"        // 增长率
  },
  "message": "获取支付趋势成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取支付趋势分析数据

### 6.2 支付处理接口

#### 6.2.1 创建支付
- **接口地址**: `/api/payments`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "billId": "number",             // 账单ID，必填
  "amount": "number",             // 支付金额，必填
  "method": "string",             // 支付方式，必填（wechat/alipay/bank/credit）
  "payerId": "number",            // 支付人ID，必填
  "notes": "string"               // 备注，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "paymentId": "number",        // 支付记录ID
    "amount": "number",           // 支付金额
    "method": "string",           // 支付方式
    "status": "string",           // 支付状态
    "paidAt": "string",           // 支付时间
    "transactionId": "string"     // 交易ID
  },
  "message": "支付创建成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 创建新的支付记录

#### 6.2.2 确认支付
- **接口地址**: `/api/payments/{id}/confirm`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "transactionId": "string",      // 交易ID，必填
  "proof": "string"               // 支付凭证，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "paymentId": "number",        // 支付记录ID
    "status": "string",           // 支付状态
    "confirmedAt": "string",      // 确认时间
    "transactionId": "string"     // 交易ID
  },
  "message": "支付确认成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 确认支付完成

#### 6.2.3 获取支付列表
- **接口地址**: `/api/payments`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "page": "number",               // 页码，默认1，可选
  "size": "number",               // 每页数量，默认20，可选
  "search": "string",             // 搜索关键词，可选
  "status": "string",             // 状态，可选（pending/completed/failed/cancelled）
  "method": "string",             // 支付方式，可选（wechat/alipay/bank/credit）
  "startDate": "string",          // 开始日期，可选
  "endDate": "string",            // 结束日期，可选
  "dormId": "number"              // 宿舍ID，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "number",           // 支付记录ID
        "amount": "number",       // 支付金额
        "method": "string",       // 支付方式
        "status": "string",       // 支付状态
        "paidAt": "string",       // 支付时间
        "paidBy": "string",       // 支付人
        "payerId": "number",      // 支付人ID
        "billTitle": "string",    // 关联账单标题
        "billId": "number",       // 账单ID
        "notes": "string",        // 备注
        "transactionId": "string" // 交易ID
      }
    ],
    "total": "number",            // 总记录数
    "page": "number",             // 当前页码
    "size": "number",             // 每页数量
    "pages": "number"             // 总页数
  },
  "message": "获取支付列表成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取支付记录列表

#### 6.2.4 获取支付详情
- **接口地址**: `/api/payments/{id}`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 支付记录ID
    "amount": "number",           // 支付金额
    "method": "string",           // 支付方式
    "status": "string",           // 支付状态
    "paidAt": "string",           // 支付时间
    "paidBy": "string",           // 支付人
    "payerId": "number",          // 支付人ID
    "billTitle": "string",        // 关联账单标题
    "billId": "number",           // 账单ID
    "notes": "string",            // 备注
    "transactionId": "string",    // 交易ID
    "proofUrl": "string",         // 支付凭证URL
    "dormName": "string"          // 宿舍名称
  },
  "message": "获取支付详情成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取指定支付记录的详细信息

#### 6.2.5 取消支付
- **接口地址**: `/api/payments/{id}/cancel`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "reason": "string"              // 取消原因，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "paymentId": "number",        // 支付记录ID
    "status": "string",           // 支付状态
    "cancelledAt": "string",      // 取消时间
    "reason": "string"            // 取消原因
  },
  "message": "支付取消成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 取消指定的支付记录

### 6.3 费用分摊接口

#### 6.3.1 计算费用分摊
- **接口地址**: `/api/payments/calculate-split`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "expenseId": "number",          // 费用ID，必填
  "memberIds": [                  // 分摊成员ID数组，必填
    "number"
  ],
  "amount": "number",             // 总金额，必填
  "method": "string"              // 分摊方式，必填（equal/weight/proportion）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "totalAmount": "number",      // 总金额
    "method": "string",           // 分摊方式
    "splitDetails": [             // 分摊详情
      {
        "memberId": "number",     // 成员ID
        "memberName": "string",   // 成员姓名
        "amount": "number",       // 分摊金额
        "percentage": "number"    // 分摊比例
      }
    ],
    "calculatedAt": "string"      // 计算时间
  },
  "message": "费用分摊计算成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 计算费用的分摊方案

#### 6.3.2 批量支付
- **接口地址**: `/api/payments/batch`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "billIds": [                    // 账单ID数组，必填
    "number"
  ],
  "method": "string",             // 支付方式，必填（wechat/alipay/bank/credit）
  "payerId": "number",            // 支付人ID，必填
  "notes": "string"               // 备注，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "processedCount": "number",   // 已处理数量
    "successCount": "number",     // 成功数量
    "failedCount": "number",      // 失败数量
    "totalAmount": "number",      // 总支付金额
    "paymentIds": [               // 成功的支付记录ID
      "number"
    ],
    "failedItems": [              // 失败项目
      {
        "billId": "number",       // 账单ID
        "error": "string"         // 错误信息
      }
    ]
  },
  "message": "批量支付完成",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 批量支付多个账单

## 七、统计分析模块

### 7.1 概览统计接口

#### 7.1.1 获取仪表盘概览数据
- **接口地址**: `/api/statistics/dashboard`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "totalExpenses": "number",     // 总费用
    "totalBills": "number",        // 总账单数
    "paidBills": "number",         // 已付账单数
    "unpaidBills": "number",       // 未付账单数
    "monthlyExpense": "number",    // 本月费用
    "monthlyBudget": "number",     // 本月预算
    "budgetBalance": "number",     // 预算余额
    "overdueBills": "number",      // 逾期账单数
    "activeMembers": "number",     // 活跃成员数
    "recentActivities": [          // 最近活动
      {
        "type": "string",          // 活动类型
        "title": "string",         // 活动标题
        "amount": "number",        // 金额
        "timestamp": "string",     // 时间
        "user": "string"           // 用户
      }
    ],
    "categoryStats": [             // 类别统计
      {
        "category": "string",      // 类别
        "amount": "number",        // 金额
        "percentage": "number"     // 占比
      }
    ]
  },
  "message": "获取仪表盘数据成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取仪表盘概览数据

#### 7.1.2 获取智能提醒
- **接口地址**: `/api/statistics/alerts`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "number",           // 提醒ID
        "type": "string",         // 提醒类型（budget_overrun/bill_overdue/expense_pending）
        "title": "string",        // 提醒标题
        "message": "string",      // 提醒内容
        "severity": "string",     // 严重程度（high/medium/low）
        "isRead": "boolean",      // 是否已读
        "createdAt": "string",    // 创建时间
        "actionUrl": "string"     // 跳转链接
      }
    ],
    "unreadCount": "number"       // 未读数量
  },
  "message": "获取智能提醒成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取系统智能提醒

### 7.2 支出统计分析接口

#### 7.2.1 获取支出统计
- **接口地址**: `/api/statistics/expenses`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "period": "string",             // 时间周期，必填（week/month/year）
  "startDate": "string",          // 开始日期，可选
  "endDate": "string",            // 结束日期，可选
  "category": "string",           // 费用类别，可选
  "dormId": "number"              // 宿舍ID，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "totalAmount": "number",      // 总支出金额
    "transactionCount": "number", // 交易笔数
    "averageAmount": "number",    // 平均金额
    "periodComparison": [         // 期间对比
      {
        "period": "string",       // 期间
        "amount": "number",       // 金额
        "changeRate": "number"    // 变化率
      }
    ],
    "categoryBreakdown": [        // 类别分布
      {
        "category": "string",     // 类别
        "amount": "number",       // 金额
        "count": "number",        // 数量
        "percentage": "number"    // 占比
      }
    ],
    "dailyTrends": [              // 日趋势
      {
        "date": "string",         // 日期
        "amount": "number",       // 金额
        "count": "number"         // 数量
      }
    ]
  },
  "message": "获取支出统计成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取详细的支出统计数据

#### 7.2.2 获取趋势分析
- **接口地址**: `/api/statistics/trends`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "type": "string",               // 分析类型，必填（expense/bill/payment/budget）
  "period": "string",             // 时间周期，必填（month/quarter/year）
  "months": "number"              // 月数，可选（默认12）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "trendAnalysis": [
      {
        "period": "string",       // 时间期间
        "amount": "number",       // 金额
        "count": "number",        // 数量
        "growthRate": "number",   // 增长率
        "prediction": "number"    // 预测值
      }
    ],
    "summary": {
      "totalGrowth": "number",    // 总增长率
      "averageGrowth": "number",  // 平均增长率
      "peakPeriod": "string",     // 高峰期
      "lowestPeriod": "string"    // 低谷期
    },
    "predictions": [              // 未来预测
      {
        "period": "string",       // 预测期间
        "predictedAmount": "number" // 预测金额
      }
    ]
  },
  "message": "获取趋势分析成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取数据趋势分析和预测

### 7.3 预算管理统计接口

#### 7.3.1 获取预算概览
- **接口地址**: `/api/statistics/budget-overview`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "totalBudget": "number",      // 总预算
    "totalSpent": "number",       // 已支出
    "remainingBudget": "number",  // 剩余预算
    "budgetUtilization": "number", // 预算使用率
    "monthlyBudget": "number",    // 本月预算
    "monthlySpent": "number",     // 本月已支出
    "monthlyRemaining": "number", // 本月剩余
    "overBudgetAlerts": "number", // 超预算提醒数
    "categoryBudgets": [          // 分类预算
      {
        "category": "string",     // 类别
        "budget": "number",       // 预算金额
        "spent": "number",        // 已支出
        "remaining": "number",    // 剩余
        "utilization": "number"   // 使用率
      }
    ]
  },
  "message": "获取预算概览成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取预算使用情况概览

#### 7.3.2 获取预算执行进度
- **接口地址**: `/api/statistics/budget-progress`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "period": "string"              // 预算期间，必填（month/quarter/year）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "budgetPeriods": [            // 预算期间数据
      {
        "period": "string",       // 期间
        "budget": "number",       // 预算金额
        "spent": "number",        // 已支出
        "remaining": "number",    // 剩余
        "progress": "number",     // 执行进度（百分比）
        "status": "string"        // 状态（normal/warning/overrun）
      }
    ],
    "currentPeriod": {
      "period": "string",         // 当前期间
      "daysElapsed": "number",    // 已过天数
      "daysTotal": "number",      // 总天数
      "timeProgress": "number",   // 时间进度（百分比）
      "budgetProgress": "number"  // 预算进度（百分比）
    },
    "projections": {
      "projectedSpent": "number", // 预测支出
      "projectedRemaining": "number", // 预测剩余
      "riskLevel": "string"       // 风险等级（low/medium/high）
    }
  },
  "message": "获取预算进度成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取预算执行进度分析

## 八、预算管理模块

### 8.1 预算统计接口

#### 8.1.1 获取预算概览
- **接口地址**: `/api/budgets/overview`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "totalBudget": "number",      // 总预算金额
    "totalSpent": "number",       // 已支出金额
    "remainingBudget": "number",  // 剩余预算
    "budgetUtilization": "number", // 预算使用率（百分比）
    "monthlyBudget": "number",    // 本月预算
    "monthlySpent": "number",     // 本月已支出
    "monthlyRemaining": "number", // 本月剩余
    "overBudgetWarnings": "number", // 超预算警告数
    "categoryBudgets": [          // 分类预算概览
      {
        "category": "string",     // 费用类别
        "budget": "number",       // 预算金额
        "spent": "number",        // 已支出
        "remaining": "number",    // 剩余
        "utilization": "number",  // 使用率
        "status": "string"        // 状态（normal/warning/overrun）
      }
    ]
  },
  "message": "获取预算概览成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取预算概览信息

#### 8.1.2 获取预算执行进度
- **接口地址**: `/api/budgets/progress`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "period": "string"              // 预算期间，必填（month/quarter/year）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "currentPeriod": {
      "period": "string",         // 当前期间
      "totalBudget": "number",    // 总预算
      "totalSpent": "number",     // 已支出
      "remaining": "number",      // 剩余
      "progress": "number",       // 执行进度（百分比）
      "status": "string"          // 状态（normal/warning/overrun）
    },
    "progressDetails": [          // 进度详情
      {
        "category": "string",     // 费用类别
        "budget": "number",       // 预算金额
        "spent": "number",        // 已支出
        "progress": "number",     // 执行进度
        "dailyAverage": "number", // 日均支出
        "projectedTotal": "number", // 预测总支出
        "riskLevel": "string"     // 风险等级（low/medium/high）
      }
    ],
    "milestones": [               // 里程碑
      {
        "date": "string",         // 里程碑日期
        "expectedSpent": "number", // 预期支出
        "actualSpent": "number",  // 实际支出
        "variance": "number"      // 偏差
      }
    ]
  },
  "message": "获取预算进度成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取预算执行进度详情

#### 8.1.3 获取超支预警
- **接口地址**: `/api/budgets/alerts`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "number",           // 预警ID
        "category": "string",     // 费用类别
        "budget": "number",       // 预算金额
        "spent": "number",        // 已支出
        "overrun": "number",      // 超支金额
        "overrunRate": "number",  // 超支率
        "severity": "string",     // 严重程度（warning/critical）
        "createdAt": "string",    // 创建时间
        "suggestion": "string"    // 建议措施
      }
    ],
    "totalAlerts": "number"       // 总预警数
  },
  "message": "获取超支预警成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取预算超支预警信息

### 8.2 预算CRUD接口

#### 8.2.1 获取预算列表
- **接口地址**: `/api/budgets`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "page": "number",               // 页码，默认1，可选
  "size": "number",               // 每页数量，默认20，可选
  "period": "string",             // 预算期间，可选（month/quarter/year）
  "category": "string",           // 费用类别，可选
  "status": "string",             // 状态，可选（active/inactive）
  "dormId": "number"              // 宿舍ID，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "budgets": [
      {
        "id": "number",           // 预算ID
        "title": "string",        // 预算标题
        "category": "string",     // 费用类别
        "period": "string",       // 预算期间
        "budgetAmount": "number", // 预算金额
        "spentAmount": "number",  // 已支出
        "remainingAmount": "number", // 剩余金额
        "utilization": "number",  // 使用率
        "status": "string",       // 状态
        "startDate": "string",    // 开始日期
        "endDate": "string",      // 结束日期
        "createdAt": "string",    // 创建时间
        "updatedAt": "string",    // 更新时间
        "dormName": "string"      // 宿舍名称
      }
    ],
    "total": "number",            // 总记录数
    "page": "number",             // 当前页码
    "size": "number",             // 每页数量
    "pages": "number"             // 总页数
  },
  "message": "获取预算列表成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取预算列表，支持分页和筛选

#### 8.2.2 创建预算
- **接口地址**: `/api/budgets`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "title": "string",              // 预算标题，必填
  "category": "string",           // 费用类别，必填
  "period": "string",             // 预算期间，必填（month/quarter/year）
  "budgetAmount": "number",       // 预算金额，必填
  "dormId": "number",             // 宿舍ID，必填
  "startDate": "string",          // 开始日期，必填
  "endDate": "string",            // 结束日期，必填
  "description": "string"         // 描述，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 预算ID
    "title": "string",            // 预算标题
    "category": "string",         // 费用类别
    "period": "string",           // 预算期间
    "budgetAmount": "number",     // 预算金额
    "status": "string",           // 状态
    "startDate": "string",        // 开始日期
    "endDate": "string",          // 结束日期
    "createdAt": "string"         // 创建时间
  },
  "message": "预算创建成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 创建新的预算计划

#### 8.2.3 获取预算详情
- **接口地址**: `/api/budgets/{id}`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 预算ID
    "title": "string",            // 预算标题
    "category": "string",         // 费用类别
    "period": "string",           // 预算期间
    "budgetAmount": "number",     // 预算金额
    "spentAmount": "number",      // 已支出
    "remainingAmount": "number",  // 剩余金额
    "utilization": "number",      // 使用率
    "status": "string",           // 状态
    "startDate": "string",        // 开始日期
    "endDate": "string",          // 结束日期
    "description": "string",      // 描述
    "createdAt": "string",        // 创建时间
    "updatedAt": "string",        // 更新时间
    "dormName": "string",         // 宿舍名称
    "expenseBreakdown": [         // 费用明细
      {
        "expenseId": "number",    // 费用ID
        "title": "string",        // 费用标题
        "amount": "number",       // 费用金额
        "date": "string"          // 费用日期
      }
    ]
  },
  "message": "获取预算详情成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取指定预算的详细信息

#### 8.2.4 更新预算
- **接口地址**: `/api/budgets/{id}`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "title": "string",              // 预算标题，可选
  "budgetAmount": "number",       // 预算金额，可选
  "startDate": "string",          // 开始日期，可选
  "endDate": "string",            // 结束日期，可选
  "description": "string",        // 描述，可选
  "status": "string"              // 状态，可选（active/inactive）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 预算ID
    "title": "string",            // 预算标题
    "budgetAmount": "number",     // 预算金额
    "status": "string",           // 状态
    "startDate": "string",        // 开始日期
    "endDate": "string",          // 结束日期
    "updatedAt": "string"         // 更新时间
  },
  "message": "预算更新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 更新指定预算的信息

#### 8.2.5 删除预算
- **接口地址**: `/api/budgets/{id}`
- **请求方法**: `DELETE`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": null,
  "message": "预算删除成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 删除指定的预算计划

## 九、通知管理模块

### 9.1 通知统计接口

#### 9.1.1 获取通知统计
- **接口地址**: `/api/notifications/stats`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "total": "number",            // 总通知数
    "unread": "number",           // 未读通知数
    "read": "number",             // 已读通知数
    "categories": [               // 分类统计
      {
        "category": "string",     // 通知类别
        "count": "number",        // 数量
        "unreadCount": "number"   // 未读数量
      }
    ],
    "recentNotifications": [      // 最近通知
      {
        "id": "number",           // 通知ID
        "title": "string",        // 通知标题
        "category": "string",     // 通知类别
        "isRead": "boolean",      // 是否已读
        "createdAt": "string"     // 创建时间
      }
    ]
  },
  "message": "获取通知统计成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取通知统计数据

### 9.2 通知CRUD接口

#### 9.2.1 获取通知列表
- **接口地址**: `/api/notifications`
- **请求方法**: `GET`
- **请求参数**:
```json
{
  "page": "number",               // 页码，默认1，可选
  "size": "number",               // 每页数量，默认20，可选
  "category": "string",           // 通知类别，可选（system/expense/bill/payment/budget/security）
  "isRead": "boolean",            // 是否已读，可选
  "startDate": "string",          // 开始日期，可选
  "endDate": "string",            // 结束日期，可选
  "search": "string"              // 搜索关键词，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "number",           // 通知ID
        "title": "string",        // 通知标题
        "message": "string",      // 通知内容
        "category": "string",     // 通知类别
        "type": "string",         // 通知类型（info/warning/error/success）
        "isRead": "boolean",      // 是否已读
        "isImportant": "boolean", // 是否重要
        "createdAt": "string",    // 创建时间
        "readAt": "string",       // 读取时间
        "actionUrl": "string",    // 操作链接
        "relatedId": "number"     // 关联ID（如费用ID、账单ID等）
      }
    ],
    "total": "number",            // 总记录数
    "page": "number",             // 当前页码
    "size": "number",             // 每页数量
    "pages": "number"             // 总页数
  },
  "message": "获取通知列表成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取通知列表，支持分页、筛选和搜索

#### 9.2.2 标记通知为已读
- **接口地址**: `/api/notifications/{id}/read`
- **请求方法**: `POST`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "notificationId": "number",  // 通知ID
    "isRead": "boolean",         // 是否已读
    "readAt": "string"           // 读取时间
  },
  "message": "通知标记为已读",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 将指定通知标记为已读

#### 9.2.3 批量标记通知
- **接口地址**: `/api/notifications/batch-read`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "notificationIds": [           // 通知ID数组，必填
    "number"
  ],
  "action": "string"             // 操作类型，必填（read/unread/delete）
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "processedCount": "number",   // 已处理数量
    "successCount": "number",     // 成功数量
    "failedCount": "number",      // 失败数量
    "failedItems": [              // 失败项目
      {
        "notificationId": "number", // 通知ID
        "error": "string"         // 错误信息
      }
    ]
  },
  "message": "批量操作完成",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 批量处理通知（标记已读/未读/删除）

#### 9.2.4 全部标记为已读
- **接口地址**: `/api/notifications/mark-all-read`
- **请求方法**: `POST`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "markedCount": "number"      // 标记数量
  },
  "message": "所有通知已标记为已读",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 将所有通知标记为已读

#### 9.2.5 删除通知
- **接口地址**: `/api/notifications/{id}`
- **请求方法**: `DELETE`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": null,
  "message": "通知删除成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 删除指定通知

### 9.3 通知设置接口

#### 9.3.1 获取通知设置
- **接口地址**: `/api/notifications/settings`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "emailNotifications": {
      "enabled": "boolean",      // 邮件通知是否启用
      "categories": [            // 启用通知的类别
        "string"
      ]
    },
    "pushNotifications": {
      "enabled": "boolean",      // 推送通知是否启用
      "categories": [            // 启用通知的类别
        "string"
      ]
    },
    "quietHours": {              // 免打扰时间
      "enabled": "boolean",      // 是否启用
      "startTime": "string",     // 开始时间
      "endTime": "string"        // 结束时间
    },
    "urgentOnly": "boolean"      // 仅重要通知
  },
  "message": "获取通知设置成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取用户的通知设置

#### 9.3.2 更新通知设置
- **接口地址**: `/api/notifications/settings`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "emailNotifications": {
    "enabled": "boolean",        // 邮件通知是否启用
    "categories": [              // 启用通知的类别
      "string"
    ]
  },
  "pushNotifications": {
    "enabled": "boolean",        // 推送通知是否启用
    "categories": [              // 启用通知的类别
      "string"
    ]
  },
  "quietHours": {                // 免打扰时间
    "enabled": "boolean",        // 是否启用
    "startTime": "string",       // 开始时间
    "endTime": "string"          // 结束时间
  },
  "urgentOnly": "boolean"        // 仅重要通知
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "settings": {
      "emailNotifications": {
        "enabled": "boolean",    // 邮件通知是否启用
        "categories": [          // 启用通知的类别
          "string"
        ]
      },
      "pushNotifications": {
        "enabled": "boolean",    // 推送通知是否启用
        "categories": [          // 启用通知的类别
          "string"
        ]
      },
      "quietHours": {            // 免打扰时间
        "enabled": "boolean",    // 是否启用
        "startTime": "string",   // 开始时间
        "endTime": "string"      // 结束时间
      },
      "urgentOnly": "boolean"    // 仅重要通知
    },
    "updatedAt": "string"        // 更新时间
  },
  "message": "通知设置更新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 更新用户的通知设置

## 十、个人中心模块

### 10.1 用户信息接口

#### 10.1.1 获取用户信息
- **接口地址**: `/api/profile`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 用户ID
    "username": "string",         // 用户名
    "nickname": "string",         // 昵称
    "email": "string",            // 邮箱
    "phone": "string",            // 电话
    "avatar": "string",           // 头像URL
    "role": "string",             // 角色
    "status": "string",           // 状态
    "joinDate": "string",         // 加入日期
    "lastLoginAt": "string",      // 最后登录时间
    "preferences": {              // 用户偏好
      "theme": "string",          // 主题（light/dark）
      "language": "string",       // 语言
      "timezone": "string",       // 时区
      "dateFormat": "string",     // 日期格式
      "currency": "string"        // 货币
    },
    "dormInfo": {                 // 宿舍信息
      "dormId": "number",         // 宿舍ID
      "dormName": "string",       // 宿舍名称
      "roomNumber": "string",     // 房间号
      "memberSince": "string"     // 成为成员时间
    },
    "statistics": {               // 用户统计
      "totalExpenses": "number",  // 总费用数
      "totalPayments": "number",  // 总支付数
      "activeDays": "number"      // 活跃天数
    }
  },
  "message": "获取用户信息成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取当前用户的详细信息

#### 10.1.2 更新用户信息
- **接口地址**: `/api/profile`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "nickname": "string",           // 昵称，可选
  "phone": "string",              // 电话，可选
  "avatar": "file"                // 头像文件，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "id": "number",               // 用户ID
    "nickname": "string",         // 昵称
    "phone": "string",            // 电话
    "avatar": "string",           // 头像URL
    "updatedAt": "string"         // 更新时间
  },
  "message": "用户信息更新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 更新当前用户的基本信息

### 10.2 偏好设置接口

#### 10.2.1 获取偏好设置
- **接口地址**: `/api/profile/preferences`
- **请求方法**: `GET`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "theme": "string",            // 主题（light/dark/auto）
    "language": "string",         // 语言（zh-CN/en-US）
    "timezone": "string",         // 时区
    "dateFormat": "string",       // 日期格式
    "currency": "string",         // 货币
    "pageSize": "number",         // 默认页面大小
    "autoRefresh": "boolean",     // 自动刷新
    "refreshInterval": "number",  // 刷新间隔（秒）
    "notifications": {            // 通知设置
      "email": "boolean",         // 邮件通知
      "push": "boolean",          // 推送通知
      "browser": "boolean"        // 浏览器通知
    }
  },
  "message": "获取偏好设置成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取用户的偏好设置

#### 10.2.2 更新偏好设置
- **接口地址**: `/api/profile/preferences`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "theme": "string",              // 主题，可选
  "language": "string",           // 语言，可选
  "timezone": "string",           // 时区，可选
  "dateFormat": "string",         // 日期格式，可选
  "currency": "string",           // 货币，可选
  "pageSize": "number",           // 默认页面大小，可选
  "autoRefresh": "boolean",       // 自动刷新，可选
  "refreshInterval": "number",    // 刷新间隔，可选
  "notifications": {              // 通知设置，可选
    "email": "boolean",           // 邮件通知
    "push": "boolean",            // 推送通知
    "browser": "boolean"          // 浏览器通知
  }
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "preferences": {
      "theme": "string",          // 主题
      "language": "string",       // 语言
      "timezone": "string",       // 时区
      "dateFormat": "string",     // 日期格式
      "currency": "string",       // 货币
      "pageSize": "number",       // 默认页面大小
      "autoRefresh": "boolean",   // 自动刷新
      "refreshInterval": "number", // 刷新间隔
      "notifications": {          // 通知设置
        "email": "boolean",       // 邮件通知
        "push": "boolean",        // 推送通知
        "browser": "boolean"      // 浏览器通知
      }
    },
    "updatedAt": "string"         // 更新时间
  },
  "message": "偏好设置更新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 更新用户的偏好设置

### 10.3 安全设置接口

#### 10.3.1 修改密码
- **接口地址**: `/api/profile/password`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "currentPassword": "string",    // 当前密码，必填
  "newPassword": "string",        // 新密码，必填
  "confirmPassword": "string"     // 确认密码，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "updatedAt": "string"         // 更新时间
  },
  "message": "密码修改成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 修改用户登录密码

#### 10.3.2 更新邮箱
- **接口地址**: `/api/profile/email`
- **请求方法**: `PUT`
- **请求参数**:
```json
{
  "newEmail": "string",           // 新邮箱，必填
  "verificationCode": "string"    // 验证码，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "email": "string",            // 新邮箱
    "updatedAt": "string"         // 更新时间
  },
  "message": "邮箱更新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 更新用户邮箱地址

#### 10.3.3 绑定两步验证
- **接口地址**: `/api/profile/2fa/enable`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "method": "string",             // 验证方式，必填（sms/email/authenticator）
  "phone": "string",              // 手机号（SMS验证时必填）
  "verificationCode": "string"    // 验证码，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "enabled": "boolean",         // 是否启用
    "method": "string",           // 验证方式
    "backupCodes": [              // 备用码
      "string"
    ],
    "enabledAt": "string"         // 启用时间
  },
  "message": "两步验证绑定成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 启用两步验证功能

#### 10.3.4 取消两步验证
- **接口地址**: `/api/profile/2fa/disable`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "password": "string",           // 密码，必填
  "verificationCode": "string"    // 两步验证码，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "disabled": "boolean",        // 是否已禁用
    "disabledAt": "string"        // 禁用时间
  },
  "message": "两步验证已取消",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 取消两步验证功能

## 十一、登录认证模块

### 11.1 登录接口

#### 11.1.1 用户登录
- **接口地址**: `/api/auth/login`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "username": "string",           // 用户名或邮箱，必填
  "password": "string",           // 密码，必填
  "remember": "boolean",          // 记住登录，可选
  "captcha": "string"             // 验证码，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "number",             // 用户ID
      "username": "string",       // 用户名
      "nickname": "string",       // 昵称
      "email": "string",          // 邮箱
      "role": "string",           // 角色
      "avatar": "string"          // 头像URL
    },
    "tokens": {
      "accessToken": "string",    // 访问令牌
      "refreshToken": "string",   // 刷新令牌
      "expiresIn": "number"       // 过期时间（秒）
    },
    "loginAt": "string"           // 登录时间
  },
  "message": "登录成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 用户登录认证

#### 11.1.2 验证码登录
- **接口地址**: `/api/auth/login-sms`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "phone": "string",              // 手机号，必填
  "verificationCode": "string",   // 验证码，必填
  "remember": "boolean"           // 记住登录，可选
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "number",             // 用户ID
      "username": "string",       // 用户名
      "nickname": "string",       // 昵称
      "phone": "string",          // 手机号
      "role": "string",           // 角色
      "avatar": "string"          // 头像URL
    },
    "tokens": {
      "accessToken": "string",    // 访问令牌
      "refreshToken": "string",   // 刷新令牌
      "expiresIn": "number"       // 过期时间（秒）
    },
    "loginAt": "string"           // 登录时间
  },
  "message": "登录成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 使用手机验证码登录

### 11.2 登出接口

#### 11.2.1 用户登出
- **接口地址**: `/api/auth/logout`
- **请求方法**: `POST`
- **请求参数**:
```json
{}
```
- **返回结果**:
```json
{
  "success": true,
  "data": null,
  "message": "登出成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 用户登出，清除令牌

### 11.3 令牌管理接口

#### 11.3.1 刷新令牌
- **接口地址**: `/api/auth/refresh`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "refreshToken": "string"        // 刷新令牌，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "accessToken": "string",      // 新访问令牌
    "refreshToken": "string",     // 新刷新令牌
    "expiresIn": "number"         // 过期时间（秒）
  },
  "message": "令牌刷新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 使用刷新令牌获取新的访问令牌

#### 11.3.2 验证令牌
- **接口地址**: `/api/auth/verify`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "accessToken": "string"         // 访问令牌，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "valid": "boolean",           // 是否有效
    "userId": "number",           // 用户ID
    "username": "string",         // 用户名
    "role": "string",             // 角色
    "expiresAt": "string"         // 过期时间
  },
  "message": "令牌验证完成",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 验证访问令牌的有效性

## 接口设计规范

### 响应格式
所有接口统一使用以下响应格式：
```json
{
  "success": "boolean",      // 操作是否成功
  "data": "object|array",    // 响应数据
  "message": "string",       // 响应消息
  "timestamp": "string"      // 时间戳（ISO 8601格式）
}
```

### 错误处理
- HTTP状态码：
  - 200：成功
  - 400：请求参数错误
  - 401：未授权
  - 403：权限不足
  - 404：资源不存在
  - 500：服务器内部错误

- 错误响应格式：
```json
{
  "success": false,
  "data": null,
  "message": "错误描述",
  "timestamp": "2024-01-01T00:00:00Z",
  "error": {
    "code": "ERROR_CODE",
    "details": "详细错误信息"
  }
}
```

### 状态码说明
- **用户认证**：1-99
- **宿舍管理**：100-199
- **成员管理**：200-299
- **费用管理**：300-399
- **账单管理**：400-499
- **支付管理**：500-599
- **统计分析**：600-699
- **预算管理**：700-799
- **通知管理**：800-899
- **个人中心**：900-999

### 权限控制
- **admin**：管理员，拥有所有权限
- **member**：普通成员，可以创建费用、查看账单、进行支付
- **viewer**：观察者，只能查看数据，不能修改

### 分页参数
- `page`：页码，从1开始
- `size`：每页数量，默认20，最大100
- `pages`：总页数

### 时间格式
- 所有时间字段使用ISO 8601格式：`2024-01-01T00:00:00Z`
- 日期字段使用`YYYY-MM-DD`格式
- 月份字段使用`YYYY-MM`格式

### 金额字段
- 所有金额字段使用number类型，保留两位小数
- 货币单位默认为人民币（CNY）

### 枚举值说明
- **费用类别**：accommodation（住宿费）、utilities（水电费）、maintenance（维修费）、cleaning（清洁费）、other（其他）
- **支付方式**：wechat（微信）、alipay（支付宝）、bank（银行卡）、credit（信用卡）
- **通知类型**：info（信息）、warning（警告）、error（错误）、success（成功）
- **主题**：light（浅色）、dark（深色）、auto（自动）
- **状态**：active（活跃）、inactive（不活跃）、pending（待处理）、approved（已批准）、rejected（已拒绝）
      }
    ]
  },
  "message": "获取最近活动成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取宿舍成员最近的活动记录
```
### 2.1 获取宿舍列表接口

**接口地址**: `GET /api/dorms`

**功能描述**: 获取宿舍列表，支持分页、搜索和状态筛选

**请求参数**: 
```json
{
  "page": "number|required|false|页码，从1开始，默认为1",
  "size": "number|required|false|每页数量，默认为20，最大100",
  "search": "string|required|false|搜索关键词，可搜索宿舍名称或地址",
  "status": "string|required|false|宿舍状态筛选：active(活跃)、inactive(不活跃)"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "dorms": [
      {
        "id": "string|宿舍唯一标识",
        "dormName": "string|宿舍名称",
        "address": "string|宿舍地址",
        "capacity": "number|宿舍容量（最大入住人数）",
        "currentOccupancy": "number|当前入住人数",
        "status": "string|宿舍状态",
        "description": "string|宿舍描述",
        "createdAt": "string|创建时间（ISO 8601格式）",
        "updatedAt": "string|更新时间（ISO 8601格式）"
      }
    ],
    "pagination": {
      "page": "number|当前页码",
      "size": "number|每页数量",
      "total": "number|总记录数",
      "pages": "number|总页数"
    }
  },
  "message": "string"
}
```

### 2.2 创建宿舍接口

**接口地址**: `POST /api/dorms`

**功能描述**: 创建新的宿舍

**请求参数**: 
```json
{
  "dormName": "string|required|true|宿舍名称",
  "address": "string|required|true|宿舍地址",
  "capacity": "number|required|true|宿舍容量（必须大于0）",
  "description": "string|required|false|宿舍描述"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "dorm": {
      "id": "string|新创建宿舍的唯一标识",
      "dormName": "string|宿舍名称",
      "address": "string|宿舍地址", 
      "capacity": "number|宿舍容量",
      "currentOccupancy": "number|当前入住人数（新建为0）",
      "status": "string|宿舍状态（默认为active）",
      "description": "string|宿舍描述",
      "createdAt": "string|创建时间（ISO 8601格式）",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

### 2.3 获取宿舍详情接口

**接口地址**: `GET /api/dorms/{id}`

**功能描述**: 获取指定宿舍的详细信息

**路径参数**:
```json
{
  "id": "string|required|true|宿舍唯一标识"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "dorm": {
      "id": "string|宿舍唯一标识",
      "dormName": "string|宿舍名称",
      "address": "string|宿舍地址",
      "capacity": "number|宿舍容量",
      "currentOccupancy": "number|当前入住人数",
      "status": "string|宿舍状态",
      "description": "string|宿舍描述",
      "members": [
        {
          "id": "string|成员ID",
          "name": "string|成员姓名",
          "role": "string|成员角色",
          "joinDate": "string|加入时间"
        }
      ],
      "createdAt": "string|创建时间（ISO 8601格式）",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

### 2.4 更新宿舍信息接口

**接口地址**: `PUT /api/dorms/{id}`

**功能描述**: 更新指定宿舍的信息

**路径参数**:
```json
{
  "id": "string|required|true|宿舍唯一标识"
}
```

**请求参数**: 
```json
{
  "dormName": "string|required|false|宿舍名称",
  "address": "string|required|false|宿舍地址",
  "capacity": "number|required|false|宿舍容量（必须大于当前入住人数）",
  "description": "string|required|false|宿舍描述"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "dorm": {
      "id": "string|宿舍唯一标识",
      "dormName": "string|宿舍名称",
      "address": "string|宿舍地址",
      "capacity": "number|宿舍容量",
      "currentOccupancy": "number|当前入住人数",
      "status": "string|宿舍状态",
      "description": "string|宿舍描述",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

### 2.5 删除宿舍接口

**接口地址**: `DELETE /api/dorms/{id}`

**功能描述**: 删除指定宿舍（软删除）

**路径参数**:
```json
{
  "id": "string|required|true|宿舍唯一标识"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "deleted": "boolean|删除操作是否成功",
    "dormId": "string|被删除的宿舍ID"
  },
  "message": "string"
}
```

## 三、成员管理模块

### 3.1 成员统计接口

#### 3.1.1 获取成员统计数据接口

**接口地址**: `GET /api/members/stats`

**功能描述**: 获取宿舍成员统计数据

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "stats": {
      "totalMembers": "number|总成员数",
      "activeMembers": "number|活跃成员数",
      "pendingMembers": "number|待确认成员数",
      "averageExpense": "number|成员平均费用",
      "roleDistribution": {
        "admin": "number|管理员数量",
        "member": "number|普通成员数量",
        "viewer": "number|观察者数量"
      },
      "statusDistribution": {
        "active": "number|活跃状态成员数",
        "inactive": "number|不活跃状态成员数",
        "pending": "number|待处理状态成员数"
      }
    }
  },
  "message": "string"
}
```

#### 3.1.2 获取最近活动接口

**接口地址**: `GET /api/members/activities`

**功能描述**: 获取成员最近活动记录

**请求参数**: 
```json
{
  "limit": "number|required|false|返回记录数量限制，默认为10，最大50"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "activities": [
      {
        "id": "string|活动记录唯一标识",
        "memberId": "string|成员ID",
        "memberName": "string|成员姓名",
        "action": "string|活动类型：login(登录)、logout(登出)、expense_create(创建费用)、payment(支付)、profile_update(更新资料)",
        "description": "string|活动描述",
        "timestamp": "string|活动时间（ISO 8601格式）",
        "ipAddress": "string|IP地址",
        "deviceInfo": "string|设备信息"
      }
    ]
  },
  "message": "string"
}
```

### 3.2 成员管理接口

#### 3.2.1 获取成员列表接口

**接口地址**: `GET /api/members`

**功能描述**: 获取宿舍成员列表，支持分页、搜索、角色和状态筛选

**请求参数**: 
```json
{
  "page": "number|required|false|页码，从1开始，默认为1",
  "size": "number|required|false|每页数量，默认为20，最大100",
  "search": "string|required|false|搜索关键词，可搜索姓名或邮箱",
  "role": "string|required|false|角色筛选：admin(管理员)、member(普通成员)、viewer(观察者)",
  "status": "string|required|false|状态筛选：active(活跃)、inactive(不活跃)、pending(待确认)"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "members": [
      {
        "id": "string|成员唯一标识",
        "name": "string|成员姓名",
        "email": "string|成员邮箱",
        "phone": "string|成员电话",
        "role": "string|成员角色",
        "status": "string|成员状态",
        "avatar": "string|头像URL",
        "joinDate": "string|加入时间（ISO 8601格式）",
        "lastLogin": "string|最后登录时间（ISO 8601格式）",
        "dormId": "string|所属宿舍ID",
        "dormName": "string|所属宿舍名称"
      }
    ],
    "pagination": {
      "page": "number|当前页码",
      "size": "number|每页数量",
      "total": "number|总记录数",
      "pages": "number|总页数"
    }
  },
  "message": "string"
}
```

#### 3.2.2 邀请成员接口

**接口地址**: `POST /api/members/invite`

**功能描述**: 邀请新成员加入宿舍

**请求参数**: 
```json
{
  "email": "string|required|true|被邀请人邮箱",
  "role": "string|required|true|邀请角色：admin(管理员)、member(普通成员)、viewer(观察者)",
  "dormId": "string|required|true|宿舍ID",
  "message": "string|required|false|邀请留言"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "invitation": {
      "id": "string|邀请记录唯一标识",
      "email": "string|被邀请人邮箱",
      "role": "string|邀请角色",
      "dormId": "string|宿舍ID",
      "dormName": "string|宿舍名称",
      "inviteCode": "string|邀请码",
      "expireTime": "string|邀请码过期时间（ISO 8601格式）",
      "status": "string|邀请状态：pending(待确认)、accepted(已接受)、expired(已过期)、cancelled(已取消)",
      "createdAt": "string|创建时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

#### 3.2.3 更新成员角色接口

**接口地址**: `PUT /api/members/{id}/role`

**功能描述**: 更新指定成员的角色

**路径参数**:
```json
{
  "id": "string|required|true|成员唯一标识"
}
```

**请求参数**: 
```json
{
  "role": "string|required|true|新角色：admin(管理员)、member(普通成员)、viewer(观察者)",
  "reason": "string|required|false|角色变更原因"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "member": {
      "id": "string|成员唯一标识",
      "name": "string|成员姓名",
      "email": "string|成员邮箱",
      "role": "string|新角色",
      "status": "string|成员状态",
      "roleChangedAt": "string|角色变更时间（ISO 8601格式）",
      "changedBy": "string|操作人ID"
    }
  },
  "message": "string"
}
```

#### 3.2.4 更新成员状态接口

**接口地址**: `PUT /api/members/{id}/status`

**功能描述**: 更新指定成员的状态

**路径参数**:
```json
{
  "id": "string|required|true|成员唯一标识"
}
```

**请求参数**: 
```json
{
  "status": "string|required|true|新状态：active(活跃)、inactive(不活跃)",
  "reason": "string|required|false|状态变更原因"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "member": {
      "id": "string|成员唯一标识",
      "name": "string|成员姓名",
      "email": "string|成员邮箱",
      "role": "string|成员角色",
      "status": "string|新状态",
      "statusChangedAt": "string|状态变更时间（ISO 8601格式）",
      "changedBy": "string|操作人ID"
    }
  },
  "message": "string"
}
```

#### 3.2.5 删除成员接口

**接口地址**: `DELETE /api/members/{id}`

**功能描述**: 删除指定成员（软删除）

**路径参数**:
```json
{
  "id": "string|required|true|成员唯一标识"
}
```

**请求参数**: 
```json
{
  "reason": "string|required|false|删除原因",
  "notifyMember": "boolean|required|false|是否通知被删除成员，默认为true"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "deleted": "boolean|删除操作是否成功",
    "memberId": "string|被删除的成员ID",
    "memberName": "string|被删除的成员姓名",
    "deletionTime": "string|删除时间（ISO 8601格式）",
    "deletedBy": "string|操作人ID"
  },
  "message": "string"
}
```

### 3.3 成员快速统计接口

#### 3.3.1 获取快速统计数据接口

**接口地址**: `GET /api/members/quick-stats`

**功能描述**: 获取成员快速统计数据

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "quickStats": {
      "activeRate": "number|活跃率（百分比）",
      "adminCount": "number|管理员数量",
      "memberCount": "number|普通成员数量",
      "averageExpense": "number|成员平均费用",
      "newMembersThisMonth": "number|本月新成员数",
      "inactiveMembers": "number|不活跃成员数"
    }
  },
  "message": "string"
}
```

## 四、费用管理模块

### 4.1 费用统计接口

#### 4.1.1 获取费用统计摘要接口

**接口地址**: `GET /api/expenses/summary`

**功能描述**: 获取费用统计摘要数据

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "summary": {
      "totalExpenses": "number|总费用金额",
      "pendingExpenses": "number|待审核费用金额",
      "approvedExpenses": "number|已通过费用金额",
      "rejectedExpenses": "number|已拒绝费用金额",
      "thisMonthExpenses": "number|本月费用金额",
      "expenseCount": "number|费用记录总数",
      "categoryDistribution": {
        "accommodation": "number|住宿费金额",
        "utilities": "number|水电费金额", 
        "maintenance": "number|维修费金额",
        "cleaning": "number|清洁费金额",
        "other": "number|其他费用金额"
      }
    }
  },
  "message": "string"
}
```

#### 4.1.2 获取费用趋势数据接口

**接口地址**: `GET /api/expenses/trend`

**功能描述**: 获取费用趋势分析数据

**请求参数**: 
```json
{
  "period": "string|required|false|时间周期：month(月度)、year(年度)，默认为month",
  "months": "number|required|false|查看月份数，默认为6个月"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "trend": {
      "period": "string|时间周期",
      "data": [
        {
          "month": "string|月份（YYYY-MM格式）",
          "amount": "number|该月费用总额",
          "count": "number|该月费用记录数",
          "categoryBreakdown": {
            "accommodation": "number|住宿费",
            "utilities": "number|水电费",
            "maintenance": "number|维修费", 
            "cleaning": "number|清洁费",
            "other": "number|其他费用"
          }
        }
      ],
      "growthRate": "number|增长率（百分比）",
      "averageAmount": "number|平均费用"
    }
  },
  "message": "string"
}
```

### 4.2 费用CRUD接口

#### 4.2.1 获取费用列表接口

**接口地址**: `GET /api/expenses`

**功能描述**: 获取费用列表，支持分页、搜索、状态、类别、月份和宿舍筛选

**请求参数**: 
```json
{
  "page": "number|required|false|页码，从1开始，默认为1",
  "size": "number|required|false|每页数量，默认为20，最大100",
  "search": "string|required|false|搜索关键词，可搜索费用标题或描述",
  "status": "string|required|false|状态筛选：pending(待审核)、approved(已批准)、rejected(已拒绝)",
  "category": "string|required|false|费用类别：accommodation(住宿费)、utilities(水电费)、maintenance(维修费)、cleaning(清洁费)、other(其他)",
  "month": "string|required|false|月份筛选（YYYY-MM格式）",
  "dormId": "string|required|false|宿舍ID筛选"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "expenses": [
      {
        "id": "string|费用唯一标识",
        "title": "string|费用标题",
        "amount": "number|费用金额",
        "category": "string|费用类别",
        "status": "string|费用状态",
        "description": "string|费用描述",
        "receipt": "string|收据图片URL",
        "payerId": "string|支付人ID",
        "payerName": "string|支付人姓名",
        "dormId": "string|宿舍ID",
        "dormName": "string|宿舍名称",
        "approvedBy": "string|审核人ID",
        "approvedAt": "string|审核时间（ISO 8601格式）",
        "createdAt": "string|创建时间（ISO 8601格式）",
        "updatedAt": "string|更新时间（ISO 8601格式）"
      }
    ],
    "pagination": {
      "page": "number|当前页码",
      "size": "number|每页数量",
      "total": "number|总记录数",
      "pages": "number|总页数"
    }
  },
  "message": "string"
}
```

#### 4.2.2 创建费用接口

**接口地址**: `POST /api/expenses`

**功能描述**: 创建新的费用记录

**请求参数**: 
```json
{
  "title": "string|required|true|费用标题",
  "amount": "number|required|true|费用金额（必须大于0）",
  "category": "string|required|true|费用类别：accommodation(住宿费)、utilities(水电费)、maintenance(维修费)、cleaning(清洁费)、other(其他)",
  "description": "string|required|false|费用描述",
  "dormId": "string|required|true|宿舍ID",
  "payerId": "string|required|false|支付人ID，默认为当前用户",
  "expenseDate": "string|required|false|费用发生日期（YYYY-MM-DD格式），默认为今天",
  "receiptFile": "string|required|false|收据文件URL"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "expense": {
      "id": "string|新创建费用的唯一标识",
      "title": "string|费用标题",
      "amount": "number|费用金额",
      "category": "string|费用类别",
      "status": "string|费用状态（默认为pending）",
      "description": "string|费用描述",
      "receipt": "string|收据图片URL",
      "payerId": "string|支付人ID",
      "payerName": "string|支付人姓名",
      "dormId": "string|宿舍ID",
      "dormName": "string|宿舍名称",
      "createdAt": "string|创建时间（ISO 8601格式）",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

#### 4.2.3 获取费用详情接口

**接口地址**: `GET /api/expenses/{id}`

**功能描述**: 获取指定费用的详细信息

**路径参数**:
```json
{
  "id": "string|required|true|费用唯一标识"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "expense": {
      "id": "string|费用唯一标识",
      "title": "string|费用标题",
      "amount": "number|费用金额",
      "category": "string|费用类别",
      "status": "string|费用状态",
      "description": "string|费用描述",
      "receipt": "string|收据图片URL",
      "expenseDate": "string|费用发生日期（YYYY-MM-DD格式）",
      "payerId": "string|支付人ID",
      "payerName": "string|支付人姓名",
      "dormId": "string|宿舍ID",
      "dormName": "string|宿舍名称",
      "approvedBy": "string|审核人ID",
      "approvedByName": "string|审核人姓名",
      "approvedAt": "string|审核时间（ISO 8601格式）",
      "approvalComment": "string|审核意见",
      "createdAt": "string|创建时间（ISO 8601格式）",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

#### 4.2.4 更新费用接口

**接口地址**: `PUT /api/expenses/{id}`

**功能描述**: 更新指定费用的信息

**路径参数**:
```json
{
  "id": "string|required|true|费用唯一标识"
}
```

**请求参数**: 
```json
{
  "title": "string|required|false|费用标题",
  "amount": "number|required|false|费用金额（必须大于0）",
  "category": "string|required|false|费用类别：accommodation(住宿费)、utilities(水电费)、maintenance(维修费)、cleaning(清洁费)、other(其他)",
  "description": "string|required|false|费用描述",
  "expenseDate": "string|required|false|费用发生日期（YYYY-MM-DD格式）",
  "receiptFile": "string|required|false|收据文件URL"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "expense": {
      "id": "string|费用唯一标识",
      "title": "string|费用标题",
      "amount": "number|费用金额",
      "category": "string|费用类别",
      "status": "string|费用状态",
      "description": "string|费用描述",
      "receipt": "string|收据图片URL",
      "expenseDate": "string|费用发生日期（YYYY-MM-DD格式）",
      "payerId": "string|支付人ID",
      "payerName": "string|支付人姓名",
      "dormId": "string|宿舍ID",
      "dormName": "string|宿舍名称",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

#### 4.2.5 删除费用接口

**接口地址**: `DELETE /api/expenses/{id}`

**功能描述**: 删除指定费用（软删除）

**路径参数**:
```json
{
  "id": "string|required|true|费用唯一标识"
}
```

**请求参数**: 
```json
{
  "reason": "string|required|false|删除原因"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "deleted": "boolean|删除操作是否成功",
    "expenseId": "string|被删除的费用ID",
    "expenseTitle": "string|被删除的费用标题",
    "deletionTime": "string|删除时间（ISO 8601格式）",
    "deletedBy": "string|操作人ID"
  },
  "message": "string"
}
```

### 4.3 费用审核接口

#### 4.3.1 审核通过费用接口

**接口地址**: `POST /api/expenses/{id}/approve`

**功能描述**: 审核通过指定费用

**路径参数**:
```json
{
  "id": "string|required|true|费用唯一标识"
}
```

**请求参数**: 
```json
{
  "comment": "string|required|false|审核意见"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "expense": {
      "id": "string|费用唯一标识",
      "title": "string|费用标题",
      "amount": "number|费用金额",
      "status": "string|费用状态（approved）",
      "approvedBy": "string|审核人ID",
      "approvedByName": "string|审核人姓名",
      "approvedAt": "string|审核时间（ISO 8601格式）",
      "approvalComment": "string|审核意见"
    }
  },
  "message": "string"
}
```

#### 4.3.2 拒绝费用接口

**接口地址**: `POST /api/expenses/{id}/reject`

**功能描述**: 拒绝指定费用

**路径参数**:
```json
{
  "id": "string|required|true|费用唯一标识"
}
```

**请求参数**: 
```json
{
  "reason": "string|required|true|拒绝原因",
  "comment": "string|required|false|审核意见"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "expense": {
      "id": "string|费用唯一标识",
      "title": "string|费用标题",
      "amount": "number|费用金额",
      "status": "string|费用状态（rejected）",
      "approvedBy": "string|审核人ID",
      "approvedByName": "string|审核人姓名",
      "approvedAt": "string|审核时间（ISO 8601格式）",
      "rejectionReason": "string|拒绝原因",
      "approvalComment": "string|审核意见"
    }
  },
  "message": "string"
}
```

#### 4.3.3 批量审核通过接口

**接口地址**: `POST /api/expenses/batch-approve`

**功能描述**: 批量审核通过费用

**请求参数**: 
```json
{
  "expenseIds": "array|required|true|费用ID数组",
  "comment": "string|required|false|审核意见"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "approvedCount": "number|成功审核通过的数量",
    "failedCount": "number|审核失败的数量",
    "results": [
      {
        "expenseId": "string|费用ID",
        "success": "boolean|是否成功",
        "message": "string|结果信息"
      }
    ]
  },
  "message": "string"
}
```

#### 4.3.4 批量拒绝接口

**接口地址**: `POST /api/expenses/batch-reject`

**功能描述**: 批量拒绝费用

**请求参数**: 
```json
{
  "expenseIds": "array|required|true|费用ID数组",
  "reason": "string|required|true|拒绝原因",
  "comment": "string|required|false|审核意见"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "rejectedCount": "number|成功拒绝的数量",
    "failedCount": "number|拒绝失败的数量",
    "results": [
      {
        "expenseId": "string|费用ID",
        "success": "boolean|是否成功",
        "message": "string|结果信息"
      }
    ]
  },
  "message": "string"
}
```

#### 4.3.5 批量删除接口

**接口地址**: `POST /api/expenses/batch-delete`

**功能描述**: 批量删除费用

**请求参数**: 
```json
{
  "expenseIds": "array|required|true|费用ID数组",
  "reason": "string|required|false|删除原因"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "deletedCount": "number|成功删除的数量",
    "failedCount": "number|删除失败的数量",
    "results": [
      {
        "expenseId": "string|费用ID",
        "success": "boolean|是否成功",
        "message": "string|结果信息"
      }
    ]
  },
  "message": "string"
}
```

## 五、账单管理模块

### 5.1 账单类型管理接口

#### 5.1.1 获取账单类型列表接口

**接口地址**: `GET /api/bill-types`

**功能描述**: 获取系统支持的账单类型配置列表

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "billTypes": [
      {
        "id": "string|账单类型唯一标识",
        "name": "string|账单类型名称",
        "code": "string|账单类型代码",
        "description": "string|账单类型描述",
        "icon": "string|账单类型图标",
        "color": "string|账单类型颜色",
        "isActive": "boolean|是否启用",
        "sortOrder": "number|排序顺序"
      }
    ]
  },
  "message": "string"
}
```

### 5.2 账单周期管理接口

#### 5.2.1 获取账单周期列表接口

**接口地址**: `GET /api/bill-cycles`

**功能描述**: 获取账单周期配置数据

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "billCycles": [
      {
        "id": "string|周期配置唯一标识",
        "name": "string|周期名称",
        "code": "string|周期代码：weekly(周)、monthly(月)、quarterly(季)、yearly(年)",
        "interval": "number|周期间隔",
        "description": "string|周期描述",
        "isActive": "boolean|是否启用"
      }
    ]
  },
  "message": "string"
}
```

### 5.3 成员分配接口

#### 5.3.1 获取宿舍成员列表接口

**接口地址**: `GET /api/dorms/{dormId}/members`

**功能描述**: 获取指定宿舍的成员列表，用于账单分配

**路径参数**:
```json
{
  "dormId": "string|required|true|宿舍唯一标识"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "members": [
      {
        "id": "string|成员唯一标识",
        "name": "string|成员姓名",
        "email": "string|成员邮箱",
        "role": "string|成员角色：owner(房主)、member(成员)",
        "joinDate": "string|加入日期（ISO 8601格式）",
        "isActive": "boolean|是否活跃"
      }
    ]
  },
  "message": "string"
}
```

#### 5.3.2 计算费用分摊接口

**接口地址**: `POST /api/bills/calculate-split`

**功能描述**: 计算费用在成员间的分摊结果

**请求参数**: 
```json
{
  "totalAmount": "number|required|true|总费用金额（必须大于0）",
  "memberIds": "array|required|true|参与分摊的成员ID数组",
  "splitType": "string|required|true|分摊方式：equal(平均分摊)、proportional(按比例分摊)、custom(自定义分摊)",
  "weights": "array|required|false|权重数组（当splitType为proportional时必填）",
  "customAmounts": "array|required|false|自定义金额数组（当splitType为custom时必填）"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "splitResult": {
      "totalAmount": "number|总费用金额",
      "splitType": "string|分摊方式",
      "splitDetails": [
        {
          "memberId": "string|成员ID",
          "memberName": "string|成员姓名",
          "amount": "number|分摊金额",
          "percentage": "number|分摊比例（百分比）",
          "weight": "number|权重值"
        }
      ],
      "calculationTime": "string|计算时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

### 5.4 定时账单接口

#### 5.4.1 设置定时账单生成接口

**接口地址**: `POST /api/bills/schedule`

**功能描述**: 设置定时账单生成规则

**请求参数**: 
```json
{
  "billTemplate": {
    "title": "string|required|true|账单模板标题",
    "type": "string|required|true|账单类型",
    "category": "string|required|true|账单类别",
    "amount": "number|required|false|模板金额（固定金额模板时必填）",
    "description": "string|required|false|账单描述模板",
    "dormId": "string|required|true|宿舍ID"
  },
  "scheduleConfig": {
    "cycle": "string|required|true|生成周期：weekly(周)、monthly(月)、quarterly(季)、yearly(年)",
    "interval": "number|required|false|周期间隔，默认为1",
    "startDate": "string|required|true|开始日期（YYYY-MM-DD格式）",
    "endDate": "string|required|false|结束日期（YYYY-MM-DD格式）",
    "dueDays": "number|required|false|到期天数（账单生成后的付款期限）",
    "isActive": "boolean|required|false|是否启用，默认为true"
  }
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "schedule": {
      "id": "string|定时规则唯一标识",
      "billTemplate": "object|账单模板配置",
      "scheduleConfig": "object|定时配置",
      "nextRunTime": "string|下次执行时间（ISO 8601格式）",
      "status": "string|状态：active(启用)、paused(暂停)、expired(已过期)",
      "createdAt": "string|创建时间（ISO 8601格式）",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

#### 5.4.2 更新定时账单设置接口

**接口地址**: `PUT /api/bills/{id}/schedule`

**功能描述**: 更新指定定时账单生成规则

**路径参数**:
```json
{
  "id": "string|required|true|定时规则唯一标识"
}
```

**请求参数**: 
```json
{
  "scheduleConfig": {
    "cycle": "string|required|false|生成周期：weekly(周)、monthly(月)、quarterly(季)、yearly(年)",
    "interval": "number|required|false|周期间隔",
    "endDate": "string|required|false|结束日期（YYYY-MM-DD格式）",
    "dueDays": "number|required|false|到期天数",
    "isActive": "boolean|required|false|是否启用"
  }
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "schedule": {
      "id": "string|定时规则唯一标识",
      "scheduleConfig": "object|更新后的定时配置",
      "nextRunTime": "string|下次执行时间（ISO 8601格式）",
      "status": "string|状态：active(启用)、paused(暂停)、expired(已过期)",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

#### 5.4.3 删除定时账单设置接口

**接口地址**: `DELETE /api/bills/{id}/schedule`

**功能描述**: 删除指定定时账单生成规则

**路径参数**:
```json
{
  "id": "string|required|true|定时规则唯一标识"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "deleted": "boolean|删除操作是否成功",
    "scheduleId": "string|被删除的定时规则ID",
    "scheduleTitle": "string|被删除的定时规则标题",
    "deletionTime": "string|删除时间（ISO 8601格式）"
  },
  "message": "string"
}
```

### 5.5 账单CRUD接口

#### 5.5.1 获取账单列表接口

**接口地址**: `GET /api/bills`

**功能描述**: 获取账单列表，支持分页、搜索、状态、日期范围、类型和宿舍筛选

**请求参数**: 
```json
{
  "page": "number|required|false|页码，从1开始，默认为1",
  "size": "number|required|false|每页数量，默认为20，最大100",
  "search": "string|required|false|搜索关键词，可搜索账单标题或描述",
  "status": "string|required|false|状态筛选：pending(待支付)、paid(已支付)、overdue(已逾期)、cancelled(已取消)",
  "dateRange": "object|required|false|日期范围筛选",
  "type": "string|required|false|账单类型筛选",
  "dormId": "string|required|false|宿舍ID筛选"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "bills": [
      {
        "id": "string|账单唯一标识",
        "title": "string|账单标题",
        "type": "string|账单类型",
        "category": "string|账单类别",
        "amount": "number|账单金额",
        "status": "string|账单状态",
        "description": "string|账单描述",
        "dueDate": "string|到期日期（YYYY-MM-DD格式）",
        "dormId": "string|宿舍ID",
        "dormName": "string|宿舍名称",
        "creatorId": "string|创建人ID",
        "creatorName": "string|创建人姓名",
        "splitType": "string|分摊方式",
        "memberCount": "number|参与成员数",
        "createdAt": "string|创建时间（ISO 8601格式）",
        "updatedAt": "string|更新时间（ISO 8601格式）"
      }
    ],
    "pagination": {
      "page": "number|当前页码",
      "size": "number|每页数量",
      "total": "number|总记录数",
      "pages": "number|总页数"
    }
  },
  "message": "string"
}
```

#### 5.5.2 创建账单接口

**接口地址**: `POST /api/bills`

**功能描述**: 创建新的账单

**请求参数**: 
```json
{
  "title": "string|required|true|账单标题",
  "type": "string|required|true|账单类型",
  "category": "string|required|true|账单类别",
  "amount": "number|required|true|账单金额（必须大于0）",
  "description": "string|required|false|账单描述",
  "dueDate": "string|required|true|到期日期（YYYY-MM-DD格式）",
  "dormId": "string|required|true|宿舍ID",
  "memberIds": "array|required|true|参与成员ID数组",
  "splitConfig": {
    "type": "string|required|true|分摊方式：equal(平均分摊)、proportional(按比例分摊)、custom(自定义分摊)",
    "weights": "array|required|false|权重数组",
    "customAmounts": "array|required|false|自定义金额数组"
  }
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "bill": {
      "id": "string|新创建账单的独特标识",
      "title": "string|账单标题",
      "type": "string|账单类型",
      "category": "string|账单类别",
      "amount": "number|账单金额",
      "status": "string|账单状态（默认为pending）",
      "description": "string|账单描述",
      "dueDate": "string|到期日期（YYYY-MM-DD格式）",
      "dormId": "string|宿舍ID",
      "dormName": "string|宿舍名称",
      "creatorId": "string|创建人ID",
      "creatorName": "string|创建人姓名",
      "splitConfig": "object|分摊配置",
      "createdAt": "string|创建时间（ISO 8601格式）",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

#### 5.5.3 获取账单详情接口

**接口地址**: `GET /api/bills/{id}`

**功能描述**: 获取指定账单的详细信息

**路径参数**:
```json
{
  "id": "string|required|true|账单唯一标识"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "bill": {
      "id": "string|账单唯一标识",
      "title": "string|账单标题",
      "type": "string|账单类型",
      "category": "string|账单类别",
      "amount": "number|账单金额",
      "status": "string|账单状态",
      "description": "string|账单描述",
      "dueDate": "string|到期日期（YYYY-MM-DD格式）",
      "dormId": "string|宿舍ID",
      "dormName": "string|宿舍名称",
      "creatorId": "string|创建人ID",
      "creatorName": "string|创建人姓名",
      "splitConfig": "object|分摊配置",
      "splitDetails": [
        {
          "memberId": "string|成员ID",
          "memberName": "string|成员姓名",
          "amount": "number|分摊金额",
          "percentage": "number|分摊比例",
          "status": "string|支付状态：unpaid(未支付)、paid(已支付)、overdue(逾期)"
        }
      ],
      "createdAt": "string|创建时间（ISO 8601格式）",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

#### 5.5.4 更新账单接口

**接口地址**: `PUT /api/bills/{id}`

**功能描述**: 更新指定账单的信息

**路径参数**:
```json
{
  "id": "string|required|true|账单唯一标识"
}
```

**请求参数**: 
```json
{
  "title": "string|required|false|账单标题",
  "type": "string|required|false|账单类型",
  "category": "string|required|false|账单类别",
  "amount": "number|required|false|账单金额（必须大于0）",
  "description": "string|required|false|账单描述",
  "dueDate": "string|required|false|到期日期（YYYY-MM-DD格式）",
  "memberIds": "array|required|false|参与成员ID数组",
  "splitConfig": {
    "type": "string|required|false|分摊方式：equal(平均分摊)、proportional(按比例分摊)、custom(自定义分摊)",
    "weights": "array|required|false|权重数组",
    "customAmounts": "array|required|false|自定义金额数组"
  }
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "bill": {
      "id": "string|账单唯一标识",
      "title": "string|账单标题",
      "type": "string|账单类型",
      "category": "string|账单类别",
      "amount": "number|账单金额",
      "status": "string|账单状态",
      "description": "string|账单描述",
      "dueDate": "string|到期日期（YYYY-MM-DD格式）",
      "dormId": "string|宿舍ID",
      "dormName": "string|宿舍名称",
      "splitConfig": "object|分摊配置",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

#### 5.5.5 删除账单接口

**接口地址**: `DELETE /api/bills/{id}`

**功能描述**: 删除指定账单（软删除）

**路径参数**:
```json
{
  "id": "string|required|true|账单唯一标识"
}
```

**请求参数**: 
```json
{
  "reason": "string|required|false|删除原因"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "deleted": "boolean|删除操作是否成功",
    "billId": "string|被删除的账单ID",
    "billTitle": "string|被删除的账单标题",
    "deletionTime": "string|删除时间（ISO 8601格式）",
    "deletedBy": "string|操作人ID"
  },
  "message": "string"
}
```

### 5.6 账单操作接口

#### 5.6.1 复制账单接口

**接口地址**: `POST /api/bills/{id}/duplicate`

**功能描述**: 复制指定账单创建新账单

**路径参数**:
```json
{
  "id": "string|required|true|源账单唯一标识"
}
```

**请求参数**: 
```json
{
  "title": "string|required|false|新账单标题，默认为原标题+副本",
  "dueDate": "string|required|false|新账单到期日期，默认为原日期+1个月"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "duplicatedBill": {
      "id": "string|新创建账单的独特标识",
      "title": "string|账单标题",
      "type": "string|账单类型",
      "category": "string|账单类别",
      "amount": "number|账单金额",
      "status": "string|账单状态（默认为pending）",
      "description": "string|账单描述",
      "dueDate": "string|到期日期（YYYY-MM-DD格式）",
      "dormId": "string|宿舍ID",
      "dormName": "string|宿舍名称",
      "creatorId": "string|创建人ID",
      "creatorName": "string|创建人姓名",
      "splitConfig": "object|分摊配置",
      "createdAt": "string|创建时间（ISO 8601格式）",
      "updatedAt": "string|更新时间（ISO 8601格式）"
    },
    "sourceBillId": "string|源账单ID"
  },
  "message": "string"
}
```

#### 5.6.2 分享账单接口

**接口地址**: `POST /api/bills/{id}/share`

**功能描述**: 分享指定账单给其他用户

**路径参数**:
```json
{
  "id": "string|required|true|账单唯一标识"
}
```

**请求参数**: 
```json
{
  "shareType": "string|required|true|分享类型：link(链接)、email(邮箱)、system(系统内)",
  "targetUsers": "array|required|false|目标用户ID数组（当shareType为email或system时必填）",
  "permission": "string|required|false|权限：view(查看)、edit(编辑)，默认为view",
  "message": "string|required|false|分享消息"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "shareResult": {
      "billId": "string|账单ID",
      "shareType": "string|分享类型",
      "shareCode": "string|分享码（当shareType为link时返回）",
      "shareUrl": "string|分享链接（当shareType为link时返回）",
      "sharedWith": [
        {
          "userId": "string|用户ID",
          "userName": "string|用户姓名",
          "permission": "string|权限",
          "sharedAt": "string|分享时间（ISO 8601格式）"
        }
      ]
    }
  },
  "message": "string"
}
```

#### 5.6.3 导出账单PDF接口

**接口地址**: `GET /api/bills/{id}/export/pdf`

**功能描述**: 导出指定账单为PDF文件

**路径参数**:
```json
{
  "id": "string|required|true|账单唯一标识"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "exportResult": {
      "billId": "string|账单ID",
      "fileName": "string|文件名",
      "fileSize": "number|文件大小（字节）",
      "downloadUrl": "string|下载链接",
      "expiresAt": "string|链接过期时间（ISO 8601格式）",
      "exportedAt": "string|导出时间（ISO 8601格式）"
    }
  },
  "message": "string"
}
```

#### 5.6.4 批量删除账单接口

**接口地址**: `POST /api/bills/batch-delete`

**功能描述**: 批量删除账单

**请求参数**: 
```json
{
  "billIds": "array|required|true|账单ID数组",
  "reason": "string|required|false|删除原因"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "deletedCount": "number|成功删除的数量",
    "failedCount": "number|删除失败的数量",
    "results": [
      {
        "billId": "string|账单ID",
        "success": "boolean|是否成功",
        "message": "string|结果信息"
      }
    ]
  },
  "message": "string"
}
```

### 5.7 账单统计接口

#### 5.7.1 获取账单统计数据接口

**接口地址**: `GET /api/bills/stats`

**功能描述**: 获取账单统计数据

**请求参数**: 
```json
{
  "period": "string|required|false|统计周期：week(本周)、month(本月)、quarter(本季度)、year(今年)、all(全部)",
  "dormId": "string|required|false|宿舍ID筛选"
}
```

**响应数据结构**: 
```json
{
  "success": "boolean",
  "data": {
    "billStats": {
      "totalBills": "number|总账单数",
      "totalAmount": "number|总金额",
      "paidBills": "number|已支付账单数",
      "paidAmount": "number|已支付金额",
      "pendingBills": "number|待支付账单数",
      "pendingAmount": "number|待支付金额",
      "overdueBills": "number|逾期账单数",
      "overdueAmount": "number|逾期金额",
      "averageBillAmount": "number|平均账单金额",
      "categoryBreakdown": [
        {
          "category": "string|账单类别",
          "count": "number|账单数量",
          "amount": "number|类别金额",
          "percentage": "number|占比（百分比）"
        }
      ],
      "monthlyTrend": [
        {
          "month": "string|月份（YYYY-MM格式）",
          "billCount": "number|账单数量",
          "amount": "number|金额"
        }
      ]
    }
  },
  "message": "string"
}
```

## 六、支付管理模块

### 6.1 支付接口

#### 6.1.1 获取支付方式列表
- **接口地址：** GET /api/payment/methods
- **功能描述：** 获取当前系统支持的支付方式列表
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "paymentMethods": [
      {
        "id": "alipay", // 支付方式ID
        "name": "支付宝", // 支付方式名称
        "icon": "https://example.com/alipay.png", // 支付方式图标
        "enabled": true, // 是否启用
        "description": "使用支付宝进行支付" // 支付方式描述
      },
      {
        "id": "wechat",
        "name": "微信支付",
        "icon": "https://example.com/wechat.png",
        "enabled": true,
        "description": "使用微信支付进行支付"
      }
    ]
  }
}
```

#### 6.1.2 处理支付
- **接口地址：** POST /api/payment/process
- **功能描述：** 处理单笔账单支付
- **请求参数：**
```json
{
  "billId": 12345, // [必填] 账单ID，数字类型
  "paymentMethod": "alipay", // [必填] 支付方式，字符串类型，可选值：alipay/wechat/bank_transfer
  "amount": 150.50, // [必填] 支付金额，数字类型，大于0
  "remark": "费用报销支付" // [可选] 支付备注，字符串类型
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "paymentId": "PAY202312001", // 支付流水号
    "status": "success", // 支付状态：pending/success/failed
    "message": "支付成功", // 支付结果消息
    "transactionTime": "2023-12-01T10:30:00Z", // 支付时间
    "paymentMethod": "alipay" // 使用的支付方式
  }
}
```

#### 6.1.3 计算费用分摊
- **接口地址：** GET /api/payment/calculate
- **功能描述：** 计算总费用在指定成员间的分摊金额
- **请求参数：**
```json
{
  "totalAmount": 500.00, // [必填] 总费用金额，数字类型，大于0
  "memberIds": [1, 2, 3, 4], // [必填] 参与分摊的成员ID数组，数组类型
  "method": "equal", // [必填] 分摊方式，字符串类型，equal(平均分摊)/proportional(按比例分摊)
  "proportions": {} // [可选] 比例分摊时的权重配置，字典类型
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "totalAmount": 500.00, // 总费用金额
    "splitResults": [ // 分摊结果列表
      {
        "memberId": 1, // 成员ID
        "memberName": "张三", // 成员姓名
        "amount": 125.00, // 分摊金额
        "percentage": 25.0 // 分摊比例百分比
      },
      {
        "memberId": 2,
        "memberName": "李四",
        "amount": 125.00,
        "percentage": 25.0
      }
    ],
    "calculationMethod": "equal" // 计算方式
  }
}
```

#### 6.1.4 快速支付
- **接口地址：** POST /api/payment/quick-pay
- **功能描述：** 批量快速支付多笔账单
- **请求参数：**
```json
{
  "billIds": [123, 124, 125], // [必填] 账单ID数组，数组类型
  "paymentMethod": "alipay", // [必填] 支付方式，字符串类型
  "totalAmount": 300.00, // [必填] 总支付金额，数字类型
  "remark": "批量支付" // [可选] 支付备注，字符串类型
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "batchPaymentId": "BATCH202312001", // 批量支付批次号
    "totalAmount": 300.00, // 总支付金额
    "successCount": 3, // 成功支付账单数
    "failedCount": 0, // 失败支付账单数
    "paymentResults": [ // 支付结果详情
      {
        "billId": 123,
        "status": "success",
        "paymentId": "PAY202312001"
      }
    ],
    "processedAt": "2023-12-01T10:30:00Z" // 处理时间
  }
}
```

### 6.2 支付记录接口

#### 6.2.1 获取支付记录列表
- **接口地址：** GET /api/payment/records
- **功能描述：** 获取用户的支付记录列表，支持分页和筛选
- **请求参数：**
```json
{
  "page": 1, // [可选] 页码，数字类型，默认1
  "size": 20, // [可选] 每页数量，数字类型，默认20，最大100
  "dateRange": { // [可选] 日期范围，字典类型
    "start": "2023-11-01", // 开始日期，字符串类型
    "end": "2023-12-01" // 结束日期，字符串类型
  },
  "memberId": 1, // [可选] 成员ID，数字类型，用于筛选特定成员的记录
  "paymentMethod": "alipay", // [可选] 支付方式，字符串类型
  "status": "success", // [可选] 支付状态，字符串类型：pending/success/failed
  "minAmount": 10.00, // [可选] 最小金额，数字类型
  "maxAmount": 1000.00 // [可选] 最大金额，数字类型
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "records": [ // 支付记录列表
      {
        "id": "PAY202312001", // 支付记录ID
        "billId": 12345, // 关联账单ID
        "billTitle": "电费", // 账单标题
        "amount": 150.50, // 支付金额
        "paymentMethod": "alipay", // 支付方式
        "status": "success", // 支付状态
        "paymentTime": "2023-12-01T10:30:00Z", // 支付时间
        "memberName": "张三", // 支付人姓名
        "remark": "费用报销支付" // 支付备注
      }
    ],
    "pagination": { // 分页信息
      "page": 1, // 当前页码
      "size": 20, // 每页数量
      "total": 25, // 总记录数
      "totalPages": 2 // 总页数
    },
    "summary": { // 汇总信息
      "totalAmount": 3750.00, // 筛选条件下总金额
      "successCount": 20, // 成功支付数量
      "failedCount": 2, // 失败支付数量
      "pendingCount": 3 // 待处理数量
    }
  }
}
```

#### 6.2.2 获取支付记录详情
- **接口地址：** GET /api/payment/records/{id}
- **功能描述：** 获取指定支付记录的详细信息
- **请求参数：** 路径参数：id (支付记录ID)
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "paymentRecord": { // 支付记录详情
      "id": "PAY202312001", // 支付记录ID
      "billId": 12345, // 关联账单ID
      "billTitle": "电费", // 账单标题
      "amount": 150.50, // 支付金额
      "paymentMethod": "alipay", // 支付方式
      "status": "success", // 支付状态
      "paymentTime": "2023-12-01T10:30:00Z", // 支付时间
      "completionTime": "2023-12-01T10:30:15Z", // 完成时间
      "memberId": 1, // 支付人ID
      "memberName": "张三", // 支付人姓名
      "memberAvatar": "https://example.com/avatar1.jpg", // 支付人头像
      "transactionId": "TXN202312001", // 第三方交易流水号
      "remark": "费用报销支付", // 支付备注
      "failureReason": null, // 失败原因（如果有）
      "refundStatus": "none", // 退款状态：none/partial/full
      "refundAmount": 0.00, // 退款金额
      "createdAt": "2023-12-01T10:30:00Z", // 创建时间
      "updatedAt": "2023-12-01T10:30:15Z" // 更新时间
    }
  }
}
```

## 七、统计分析模块

### 7.1 统计概览接口

#### 7.1.1 获取统计概览
- **接口地址：** GET /api/statistics/overview
- **功能描述：** 获取宿舍财务系统的整体统计概览数据
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "overview": { // 概览数据
      "totalExpenses": 2580.50, // 总支出金额
      "totalBudget": 5000.00, // 总预算金额
      "budgetBalance": 2419.50, // 预算余额
      "budgetUtilizationRate": 51.61, // 预算使用率百分比
      "activeMembers": 8, // 活跃成员数
      "pendingBills": 3, // 待处理账单数
      "overdueBills": 1, // 逾期账单数
      "thisMonthExpenses": 850.30, // 本月支出
      "lastMonthExpenses": 920.15, // 上月支出
      "expenseGrowthRate": -7.59 // 支出增长率百分比
    },
    "trends": { // 趋势数据
      "monthlyExpenses": [ // 月度支出趋势
        {
          "month": "2023-06", // 月份
          "amount": 780.20 // 支出金额
        },
        {
          "month": "2023-07",
          "amount": 850.30
        }
      ],
      "categoryDistribution": [ // 分类分布
        {
          "category": "水电费", // 费用类别
          "amount": 320.50,
          "percentage": 37.7
        },
        {
          "category": "网费",
          "amount": 150.00,
          "percentage": 17.6
        }
      ]
    },
    "alerts": [ // 预警信息
      {
        "type": "budget_warning", // 预警类型
        "message": "预算使用率已达80%", // 预警消息
        "severity": "warning", // 严重程度：info/warning/error
        "timestamp": "2023-12-01T09:00:00Z" // 预警时间
      }
    ]
  }
}
```

#### 7.1.2 获取支出分类统计
- **接口地址：** GET /api/statistics/expense-category
- **功能描述：** 获取指定时间段内的支出分类统计数据
- **请求参数：**
```json
{
  "period": "month", // [必填] 统计周期，字符串类型，可选值：week/month/quarter/year
  "startDate": "2023-12-01", // [可选] 开始日期，字符串类型
  "endDate": "2023-12-31", // [可选] 结束日期，字符串类型
  "includeSubCategories": true // [可选] 是否包含子分类，布尔类型，默认true
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "period": "month", // 统计周期
    "totalAmount": 850.30, // 总支出金额
    "categoryStats": [ // 分类统计数据
      {
        "categoryId": 1, // 分类ID
        "categoryName": "水电费", // 分类名称
        "amount": 320.50, // 该分类支出金额
        "percentage": 37.7, // 占总支出百分比
        "transactionCount": 8, // 交易笔数
        "averageAmount": 40.06, // 平均单笔金额
        "subCategories": [ // 子分类统计（如果有）
          {
            "subCategoryId": 11,
            "subCategoryName": "电费",
            "amount": 200.50,
            "percentage": 62.6
          },
          {
            "subCategoryId": 12,
            "subCategoryName": "水费",
            "amount": 120.00,
            "percentage": 37.4
          }
        ]
      },
      {
        "categoryId": 2,
        "categoryName": "网费",
        "amount": 150.00,
        "percentage": 17.6,
        "transactionCount": 1,
        "averageAmount": 150.00,
        "subCategories": []
      }
    ],
    "comparison": { // 与上期对比
      "lastPeriodAmount": 920.15, // 上期支出
      "currentPeriodAmount": 850.30, // 本期支出
      "difference": -69.85, // 差额
      "changeRate": -7.59 // 变化率百分比
    }
  }
}
```

#### 7.1.3 获取趋势分析数据
- **接口地址：** GET /api/statistics/trend
- **功能描述：** 获取支出或收入的趋势分析数据
- **请求参数：**
```json
{
  "period": "month", // [必填] 时间周期，字符串类型，可选值：day/week/month/quarter/year
  "type": "expense", // [必填] 分析类型，字符串类型，可选值：expense/income/budget
  "startDate": "2023-06-01", // [必填] 开始日期，字符串类型
  "endDate": "2023-12-31", // [必填] 结束日期，字符串类型
  "categoryId": 1, // [可选] 分类ID，数字类型，用于筛选特定分类
  "granularity": "daily" // [可选] 数据粒度，字符串类型，可选值：hourly/daily/weekly/monthly
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "trendAnalysis": { // 趋势分析
      "type": "expense", // 分析类型
      "period": "month", // 时间周期
      "startDate": "2023-06-01", // 开始日期
      "endDate": "2023-12-31", // 结束日期
      "totalAmount": 4850.75, // 总金额
      "averageAmount": 692.96, // 平均金额
      "peakAmount": 1250.30, // 峰值金额
      "peakDate": "2023-08-15", // 峰值日期
      "trendDirection": "decreasing" // 趋势方向：increasing/decreasing/stable
    },
    "dataPoints": [ // 数据点列表
      {
        "date": "2023-06-01", // 日期
        "amount": 780.20, // 金额
        "transactionCount": 12, // 交易笔数
        "categoryBreakdown": { // 分类明细
          "水电费": 320.50,
          "网费": 150.00,
          "其他": 309.70
        }
      },
      {
        "date": "2023-07-01",
        "amount": 850.30,
        "transactionCount": 15,
        "categoryBreakdown": {
          "水电费": 380.20,
          "网费": 150.00,
          "其他": 320.10
        }
      }
    ],
    "predictions": [ // 趋势预测（基于历史数据）
      {
        "date": "2024-01-01", // 预测日期
        "predictedAmount": 920.45, // 预测金额
        "confidence": 0.85 // 预测置信度
      }
    ],
    "insights": [ // 数据洞察
      {
        "type": "seasonal_pattern", // 洞察类型
        "title": "夏季支出高峰", // 洞察标题
        "description": "7-8月通常是支出高峰期，主要由于水电费增加", // 洞察描述
        "impact": "moderate" // 影响程度：low/moderate/high
      }
    ]
  }
}
```

### 7.2 预算管理接口

#### 7.2.1 获取预算信息
- **接口地址：** GET /api/budget
- **功能描述：** 获取当前宿舍的预算设置信息
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "budgetInfo": { // 预算信息
      "totalBudget": 5000.00, // 总预算金额
      "monthlyBudget": 800.00, // 月度预算
      "quarterlyBudget": 2400.00, // 季度预算
      "yearlyBudget": 9600.00, // 年度预算
      "currency": "CNY", // 货币单位
      "budgetPeriod": "monthly", // 预算周期：weekly/monthly/quarterly/yearly
      "autoRenewal": true, // 是否自动续期
      "nextRenewalDate": "2024-01-01T00:00:00Z", // 下次续期日期
      "warningThresholds": { // 预警阈值
        "softWarning": 70, // 软预警阈值百分比
        "hardWarning": 85, // 硬预警阈值百分比
        "criticalWarning": 95 // 紧急预警阈值百分比
      }
    },
    "currentUsage": { // 当前使用情况
      "usedAmount": 2580.50, // 已使用金额
      "remainingAmount": 2419.50, // 剩余金额
      "usageRate": 51.61, // 使用率百分比
      "daysRemaining": 15, // 剩余天数
      "averageDailySpend": 172.03, // 日均支出
      "projectedMonthEnd": 5160.90 // 月末预测支出
    },
    "categoryBudgets": [ // 分类预算分配
      {
        "categoryId": 1,
        "categoryName": "水电费",
        "allocatedAmount": 300.00, // 分配金额
        "usedAmount": 320.50, // 已使用金额
        "remainingAmount": -20.50, // 剩余金额（负数表示超支）
        "usageRate": 106.83, // 使用率百分比
        "status": "over_budget" // 状态：normal/warning/over_budget
      },
      {
        "categoryId": 2,
        "categoryName": "网费",
        "allocatedAmount": 150.00,
        "usedAmount": 150.00,
        "remainingAmount": 0.00,
        "usageRate": 100.0,
        "status": "normal"
      }
    ]
  }
}
```

#### 7.2.2 更新预算设置
- **接口地址：** PUT /api/budget
- **功能描述：** 更新宿舍的预算设置信息
- **请求参数：**
```json
{
  "totalBudget": 6000.00, // [必填] 总预算金额，数字类型，大于0
  "monthlyBudget": 900.00, // [必填] 月度预算，数字类型，大于0
  "budgetPeriod": "monthly", // [必填] 预算周期，字符串类型，可选值：weekly/monthly/quarterly/yearly
  "currency": "CNY", // [必填] 货币单位，字符串类型，默认CNY
  "autoRenewal": true, // [可选] 是否自动续期，布尔类型，默认true
  "warningThresholds": { // [可选] 预警阈值配置，字典类型
    "softWarning": 75, // 软预警阈值，数字类型，0-100
    "hardWarning": 90, // 硬预警阈值，数字类型，0-100
    "criticalWarning": 98 // 紧急预警阈值，数字类型，0-100
  },
  "categoryBudgets": [ // [可选] 分类预算分配，数组类型
    {
      "categoryId": 1, // 分类ID，数字类型
      "allocatedAmount": 350.00 // 分配金额，数字类型，大于0
    }
  ]
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "预算设置更新成功", // 操作结果消息
    "updatedBudget": { // 更新后的预算信息
      "totalBudget": 6000.00,
      "monthlyBudget": 900.00,
      "budgetPeriod": "monthly",
      "currency": "CNY",
      "autoRenewal": true,
      "warningThresholds": {
        "softWarning": 75,
        "hardWarning": 90,
        "criticalWarning": 98
      },
      "updatedAt": "2023-12-01T10:30:00Z", // 更新时间
      "updatedBy": 1 // 更新人ID
    },
    "validationResults": { // 验证结果
      "totalAllocationValid": true, // 总分配是否有效
      "categoryAllocationsValid": true, // 分类分配是否有效
      "warnings": [] // 验证警告信息
    }
  }
}
```

## 八、系统配置模块

### 8.1 通用接口

#### 8.1.1 获取数据字典
- **接口地址：** GET /api/config/dictionary
- **功能描述：** 获取系统中配置的数据字典项
- **请求参数：**
```json
{
  "type": "expense_category", // [必填] 字典类型，字符串类型，可选值：expense_category/dorm_type/payment_method/bill_status/expense_status/user_role
  "includeDisabled": false // [可选] 是否包含已禁用的项，布尔类型，默认false
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "type": "expense_category", // 字典类型
    "dictionaryItems": [ // 字典项列表
      {
        "id": 1, // 字典项ID
        "code": "utilities", // 字典项代码
        "name": "水电费", // 字典项名称
        "description": "水电燃气等公共设施费用", // 字典项描述
        "icon": "https://picsum.photos/24/24?random=1", // 图标URL
        "color": "#1890FF", // 颜色代码
        "sortOrder": 1, // 排序顺序
        "enabled": true, // 是否启用
        "createdAt": "2023-01-01T00:00:00Z", // 创建时间
        "updatedAt": "2023-01-01T00:00:00Z" // 更新时间
      },
      {
        "id": 2,
        "code": "internet",
        "name": "网费",
        "description": "网络宽带费用",
        "icon": "https://picsum.photos/24/24?random=2",
        "color": "#52C41A",
        "sortOrder": 2,
        "enabled": true,
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "totalCount": 8, // 总数量
    "enabledCount": 7 // 启用数量
  }
}
```

#### 8.1.2 获取宿舍类型
- **接口地址：** GET /api/config/dorm-types
- **功能描述：** 获取系统中配置的宿舍类型列表
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "dormTypes": [ // 宿舍类型列表
      {
        "id": 1, // 宿舍类型ID
        "code": "standard", // 类型代码
        "name": "标准宿舍", // 类型名称
        "description": "4人间标准宿舍", // 类型描述
        "maxOccupants": 4, // 最大入住人数
        "roomSize": 25, // 房间面积（平方米）
        "facilities": [ // 设施列表
          {
            "id": 11,
            "name": "空调",
            "icon": "https://picsum.photos/16/16?random=11",
            "mandatory": true // 是否必需设施
          },
          {
            "id": 12,
            "name": "独立卫浴",
            "icon": "https://picsum.photos/16/16?random=12",
            "mandatory": true
          }
        ],
        "basePrice": 1200.00, // 基础价格（月租）
        "utilitiesIncluded": false, // 水电费是否包含在租金中
        "sortOrder": 1, // 排序顺序
        "enabled": true, // 是否启用
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "code": "deluxe",
        "name": "豪华宿舍",
        "description": "2人间豪华宿舍",
        "maxOccupants": 2,
        "roomSize": 35,
        "facilities": [
          {
            "id": 11,
            "name": "空调",
            "icon": "https://picsum.photos/16/16?random=11",
            "mandatory": true
          },
          {
            "id": 12,
            "name": "独立卫浴",
            "icon": "https://picsum.photos/16/16?random=12",
            "mandatory": true
          },
          {
            "id": 13,
            "name": "阳台",
            "icon": "https://picsum.photos/16/16?random=13",
            "mandatory": false
          }
        ],
        "basePrice": 2000.00,
        "utilitiesIncluded": true,
        "sortOrder": 2,
        "enabled": true,
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "totalCount": 3, // 总数量
    "statistics": { // 统计信息
      "averagePrice": 1600.00, // 平均价格
      "priceRange": { // 价格范围
        "min": 1200.00,
        "max": 2000.00
      },
      "occupancyDistribution": { // 入住人数分布
        "2": 1, // 2人间类型数量
        "4": 1, // 4人间类型数量
        "6": 1 // 6人间类型数量
      }
    }
  }
}
```

#### 8.1.3 获取费用类别
- **接口地址：** GET /api/config/expense-categories
- **功能描述：** 获取系统中配置的费用类别列表
- **请求参数：**
```json
{
  "includeSubCategories": true, // [可选] 是否包含子分类，布尔类型，默认true
  "status": "active", // [可选] 状态筛选，字符串类型，可选值：active/inactive/all，默认active
  "type": "expense" // [可选] 类型筛选，字符串类型，可选值：expense/income/all，默认expense
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "categories": [ // 费用类别列表
      {
        "id": 1, // 类别ID
        "code": "utilities", // 类别代码
        "name": "水电费", // 类别名称
        "description": "电费、水费、燃气费等公共设施费用", // 类别描述
        "icon": "https://picsum.photos/24/24?random=1", // 图标URL
        "color": "#1890FF", // 颜色代码
        "type": "expense", // 类型：expense/income
        "parentId": null, // 父类别ID，null表示顶级类别
        "subCategories": [ // 子分类列表
          {
            "id": 11,
            "code": "electricity",
            "name": "电费",
            "description": "电费支出",
            "icon": "https://picsum.photos/16/16?random=11",
            "color": "#1890FF",
            "type": "expense",
            "parentId": 1,
            "sortOrder": 1,
            "enabled": true,
            "transactionCount": 45, // 该分类的交易数量
            "totalAmount": 2580.50, // 该分类的总金额
            "lastTransactionDate": "2023-11-28T14:30:00Z", // 最后交易时间
            "createdAt": "2023-01-01T00:00:00Z",
            "updatedAt": "2023-01-01T00:00:00Z"
          },
          {
            "id": 12,
            "code": "water",
            "name": "水费",
            "description": "水费支出",
            "icon": "https://picsum.photos/16/16?random=12",
            "color": "#52C41A",
            "type": "expense",
            "parentId": 1,
            "sortOrder": 2,
            "enabled": true,
            "transactionCount": 12,
            "totalAmount": 890.25,
            "lastTransactionDate": "2023-11-25T09:15:00Z",
            "createdAt": "2023-01-01T00:00:00Z",
            "updatedAt": "2023-01-01T00:00:00Z"
          }
        ],
        "sortOrder": 1, // 排序顺序
        "enabled": true, // 是否启用
        "transactionCount": 57, // 该分类（含子分类）的交易数量
        "totalAmount": 3470.75, // 该分类（含子分类）的总金额
        "averageAmount": 60.89, // 平均交易金额
        "lastTransactionDate": "2023-11-28T14:30:00Z", // 最后交易时间
        "createdAt": "2023-01-01T00:00:00Z", // 创建时间
        "updatedAt": "2023-01-01T00:00:00Z" // 更新时间
      },
      {
        "id": 2,
        "code": "internet",
        "name": "网费",
        "description": "网络宽带费用",
        "icon": "https://picsum.photos/24/24?random=2",
        "color": "#722ED1",
        "type": "expense",
        "parentId": null,
        "subCategories": [],
        "sortOrder": 2,
        "enabled": true,
        "transactionCount": 6,
        "totalAmount": 900.00,
        "averageAmount": 150.00,
        "lastTransactionDate": "2023-11-20T10:00:00Z",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "statistics": { // 统计信息
      "totalCategories": 8, // 总分类数
      "enabledCategories": 7, // 启用分类数
      "totalTransactions": 158, // 总交易数
      "totalAmount": 8520.30, // 总金额
      "averageTransactionAmount": 53.93, // 平均交易金额
      "typeDistribution": { // 类型分布
        "expense": 6,
        "income": 2
      },
      "topCategories": [ // 交易量前5的分类
        {
          "categoryId": 1,
          "categoryName": "水电费",
          "transactionCount": 57,
          "totalAmount": 3470.75
        },
        {
          "categoryId": 3,
          "categoryName": "清洁费",
          "transactionCount": 35,
          "totalAmount": 1050.00
        }
      ]
    }
  }
}
```

## 九、文件上传模块

### 9.1 通用接口

#### 9.1.1 上传图片
- **接口地址：** POST /api/upload/image
- **功能描述：** 上传图片文件，支持多种图片格式
- **请求参数：**
```json
{
  "file": "binary", // [必填] 图片文件，支持格式：jpg/jpeg/png/gif/webp，最大大小10MB
  "category": "general", // [可选] 图片分类，字符串类型，可选值：general/expense/dormitory/avatar，默认general
  "watermark": false, // [可选] 是否添加水印，布尔类型，默认false
  "quality": 85 // [可选] 图片质量，数字类型，范围1-100，默认85
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "fileId": "img_20231201_001", // 文件ID
    "fileName": "expense_receipt_20231201.jpg", // 文件名
    "originalName": "receipt.jpg", // 原始文件名
    "fileUrl": "https://picsum.photos/800/600?random=1", // 文件访问URL
    "thumbnailUrl": "https://picsum.photos/200/150?random=1", // 缩略图URL
    "fileSize": 2048576, // 文件大小（字节）
    "mimeType": "image/jpeg", // MIME类型
    "width": 1920, // 图片宽度
    "height": 1440, // 图片高度
    "category": "expense", // 图片分类
    "uploadTime": "2023-12-01T10:30:00Z", // 上传时间
    "uploadBy": {
      "userId": 1001,
      "userName": "张三"
    },
    "metadata": { // 图片元数据
      "camera": "iPhone 13 Pro",
      "location": "宿舍楼A栋",
      "description": "12月份电费发票",
      "tags": ["电费", "发票", "12月"]
    },
    "processingStatus": "completed", // 处理状态：processing/completed/failed
    "compressed": true, // 是否已压缩
    "watermarked": false // 是否有水印
  }
}
```

#### 9.1.2 上传头像
- **接口地址：** POST /api/upload/avatar
- **功能描述：** 上传用户头像图片，自动裁剪为标准尺寸
- **请求参数：**
```json
{
  "file": "binary", // [必填] 头像文件，支持格式：jpg/jpeg/png，最大大小5MB
  "cropOptions": { // [可选] 裁剪选项
    "x": 100, // 裁剪起始X坐标
    "y": 100, // 裁剪起始Y坐标
    "width": 200, // 裁剪宽度
    "height": 200, // 裁剪高度
    "shape": "circle" // 裁剪形状：circle/square/round_rect，默认circle
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "fileId": "avatar_20231201_001", // 文件ID
    "fileName": "avatar_1001_20231201.jpg", // 文件名
    "originalName": "myphoto.jpg", // 原始文件名
    "fileUrl": "https://picsum.photos/200/200?random=1", // 头像URL
    "fileUrlLarge": "https://picsum.photos/400/400?random=1", // 大尺寸头像URL
    "fileUrlSmall": "https://picsum.photos/64/64?random=1", // 小尺寸头像URL
    "fileSize": 512000, // 文件大小（字节）
    "mimeType": "image/jpeg", // MIME类型
    "width": 200, // 图片宽度
    "height": 200, // 图片高度
    "shape": "circle", // 头像形状
    "uploadTime": "2023-12-01T10:30:00Z", // 上传时间
    "uploadBy": {
      "userId": 1001,
      "userName": "张三"
    },
    "cropInfo": { // 裁剪信息
      "originalWidth": 800, // 原始图片宽度
      "originalHeight": 600, // 原始图片高度
      "cropX": 100, // 裁剪起始X坐标
      "cropY": 100, // 裁剪起始Y坐标
      "cropWidth": 200, // 裁剪宽度
      "cropHeight": 200, // 裁剪高度
      "scaleRatio": 0.5 // 缩放比例
    },
    "processingStatus": "completed", // 处理状态
    "previousAvatar": { // 之前的头像信息
      "fileId": "avatar_20231115_003",
      "fileUrl": "https://picsum.photos/200/200?random=2"
    }
  }
}
```

#### 9.1.3 批量上传图片
- **接口地址：** POST /api/upload/batch
- **功能描述：** 批量上传多张图片，适用于费用凭证等场景
- **请求参数：**
```json
{
  "files": ["binary", "binary", "binary"], // [必填] 图片文件数组，最多10个文件
  "category": "expense", // [可选] 图片分类，默认general
  "description": "12月份费用凭证", // [可选] 批量上传描述
  "compress": true, // [可选] 是否压缩图片，布尔类型，默认true
  "watermark": false // [可选] 是否添加水印，布尔类型，默认false
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_20231201_001", // 批量上传ID
    "totalFiles": 3, // 总文件数
    "successfulUploads": 3, // 成功上传数
    "failedUploads": 0, // 失败上传数
    "uploadTime": "2023-12-01T10:30:00Z", // 上传时间
    "files": [ // 上传结果列表
      {
        "fileId": "img_20231201_001",
        "fileName": "receipt_1.jpg",
        "originalName": "invoice1.jpg",
        "fileUrl": "https://picsum.photos/800/600?random=1",
        "thumbnailUrl": "https://picsum.photos/200/150?random=1",
        "fileSize": 1536000,
        "uploadStatus": "success",
        "errorMessage": null
      },
      {
        "fileId": "img_20231201_002",
        "fileName": "receipt_2.jpg",
        "originalName": "invoice2.jpg",
        "fileUrl": "https://picsum.photos/800/600?random=2",
        "thumbnailUrl": "https://picsum.photos/200/150?random=2",
        "fileSize": 2048000,
        "uploadStatus": "success",
        "errorMessage": null
      },
      {
        "fileId": "img_20231201_003",
        "fileName": "receipt_3.jpg",
        "originalName": "invoice3.jpg",
        "fileUrl": "https://picsum.photos/800/600?random=3",
        "thumbnailUrl": "https://picsum.photos/200/150?random=3",
        "fileSize": 1024000,
        "uploadStatus": "success",
        "errorMessage": null
      }
    ],
    "failedFiles": [], // 失败的文件列表
    "totalSize": 4608000, // 总文件大小（字节）
    "averageSize": 1536000, // 平均文件大小（字节）
    "processingTime": 15.2 // 处理时间（秒）
  }
}
```

## 十、用户管理模块

### 10.1 个人资料接口

#### 10.1.1 获取当前用户信息
- **接口地址：** GET /api/profile
- **功能描述：** 获取当前登录用户的详细信息
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "userId": 1001, // 用户ID
    "userName": "zhangsan", // 用户名
    "realName": "张三", // 真实姓名
    "email": "zhangsan@example.com", // 邮箱
    "phone": "13800138001", // 手机号
    "avatarUrl": "https://picsum.photos/200/200?random=1", // 头像URL
    "role": "member", // 角色：admin/manager/member
    "status": "active", // 状态：active/inactive/suspended
    "department": "计算机学院", // 院系
    "grade": "2022级", // 年级
    "dormitoryId": 101, // 宿舍ID
    "dormitoryName": "宿舍楼A栋101室", // 宿舍名称
    "bedNumber": 1, // 床位号
    "joinDate": "2023-09-01T00:00:00Z", // 加入时间
    "lastLoginAt": "2023-12-01T08:30:00Z", // 最后登录时间
    "lastLoginIp": "192.168.1.100", // 最后登录IP
    "profile": { // 个人资料扩展信息
      "bio": "热爱学习，乐观开朗", // 个人简介
      "birthday": "2004-05-15", // 生日
      "gender": "male", // 性别：male/female/other
      "emergencyContact": { // 紧急联系人
        "name": "张父",
        "relationship": "父亲",
        "phone": "13900139001"
      },
      "preferences": { // 个人偏好
        "language": "zh-CN",
        "timezone": "Asia/Shanghai",
        "notificationSettings": {
          "email": true,
          "sms": true,
          "push": true
        }
      }
    },
    "statistics": { // 用户统计信息
      "totalExpenses": 28, // 总费用记录数
      "totalAmount": 1580.50, // 总费用金额
      "expenseCategories": 5, // 涉及的費用类别数
      "paymentRecords": 12, // 支付记录数
      "unpaidBills": 2, // 未支付账单数
      "averageMonthlyExpense": 395.13 // 月均支出
    },
    "createdAt": "2023-09-01T10:00:00Z",
    "updatedAt": "2023-12-01T08:30:00Z"
  }
}
```

#### 10.1.2 更新个人信息
- **接口地址：** PUT /api/profile
- **功能描述：** 更新当前用户的个人信息
- **请求参数：**
```json
{
  "realName": "张三", // [可选] 真实姓名，字符串类型，1-50字符
  "email": "zhangsan@example.com", // [可选] 邮箱，字符串类型，有效邮箱格式
  "phone": "13800138001", // [可选] 手机号，字符串类型，11位数字
  "department": "计算机学院", // [可选] 院系，字符串类型，1-100字符
  "grade": "2022级", // [可选] 年级，字符串类型，1-20字符
  "bio": "热爱学习，乐观开朗", // [可选] 个人简介，字符串类型，最多500字符
  "birthday": "2004-05-15", // [可选] 生日，字符串类型，YYYY-MM-DD格式
  "gender": "male", // [可选] 性别，字符串类型，可选值：male/female/other
  "emergencyContact": { // [可选] 紧急联系人
    "name": "张父", // [必填] 联系人姓名
    "relationship": "父亲", // [必填] 关系
    "phone": "13900139001" // [必填] 联系电话
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "个人信息更新成功", // 操作结果消息
    "updatedFields": [ // 更新成功的字段列表
      "realName",
      "email",
      "phone",
      "bio"
    ],
    "updatedAt": "2023-12-01T10:30:00Z", // 更新时间
    "userProfile": { // 更新后的用户信息
      "userId": 1001,
      "realName": "张三",
      "email": "zhangsan@example.com",
      "phone": "13800138001",
      "bio": "热爱学习，乐观开朗",
      "updatedAt": "2023-12-01T10:30:00Z"
    }
  }
}
```

#### 10.1.3 上传头像
- **接口地址：** POST /api/profile/upload-avatar
- **功能描述：** 上传并更新用户头像
- **请求参数：**
```json
{
  "avatarFile": "binary", // [必填] 头像文件，支持格式：jpg/jpeg/png，最大大小5MB
  "cropOptions": { // [可选] 裁剪选项
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 200,
    "shape": "circle"
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "头像上传成功", // 操作结果消息
    "avatarInfo": { // 头像信息
      "fileId": "avatar_20231201_001",
      "fileUrl": "https://picsum.photos/200/200?random=1",
      "fileUrlLarge": "https://picsum.photos/400/400?random=1",
      "fileUrlSmall": "https://picsum.photos/64/64?random=1",
      "fileSize": 512000,
      "uploadTime": "2023-12-01T10:30:00Z"
    },
    "previousAvatar": { // 之前的头像信息
      "fileId": "avatar_20231115_003",
      "fileUrl": "https://picsum.photos/200/200?random=2"
    }
  }
}
```

### 10.2 偏好设置接口

#### 10.2.1 获取用户偏好设置
- **接口地址：** GET /api/profile/preferences
- **功能描述：** 获取当前用户的偏好设置
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "preferences": { // 偏好设置
      "language": "zh-CN", // 语言偏好
      "theme": "light", // 主题偏好：light/dark/auto
      "timezone": "Asia/Shanghai", // 时区
      "dateFormat": "YYYY-MM-DD", // 日期格式
      "timeFormat": "24h", // 时间格式：12h/24h
      "currency": "CNY", // 货币类型
      "numberFormat": "zh-CN", // 数字格式
      "notificationSettings": { // 通知设置
        "email": { // 邮件通知
          "enabled": true,
          "types": ["expense_reminder", "bill_due", "budget_warning"]
        },
        "sms": { // 短信通知
          "enabled": true,
          "types": ["bill_due", "emergency"]
        },
        "push": { // 推送通知
          "enabled": true,
          "types": ["all"],
          "quietHours": { // 免打扰时段
            "enabled": true,
            "start": "22:00",
            "end": "08:00"
          }
        },
        "inApp": { // 应用内通知
          "enabled": true,
          "sound": true,
          "vibration": true
        }
      },
      "privacySettings": { // 隐私设置
        "profileVisibility": "dormitory", // 资料可见性：public/dormitory/private
        "showRealName": false, // 是否显示真实姓名
        "showExpenses": false, // 是否显示费用信息
        "dataSharing": false // 是否参与数据共享
      },
      "dashboardSettings": { // 仪表盘设置
        "defaultView": "overview", // 默认视图：overview/detailed
        "autoRefresh": true, // 自动刷新
        "refreshInterval": 300, // 刷新间隔（秒）
        "widgets": [ // 启用的组件
          {
            "id": "expense_summary",
            "enabled": true,
            "position": 1,
            "size": "medium"
          },
          {
            "id": "bill_reminder",
            "enabled": true,
            "position": 2,
            "size": "small"
          }
        ]
      },
      "expenseSettings": { // 费用相关设置
        "defaultCategory": "utilities", // 默认费用类别
        "autoApproveSmallExpenses": true, // 自动审批小额费用
        "smallExpenseThreshold": 50.00, // 小额费用阈值
        "requireReceiptForExpenses": true, // 费用是否需要凭证
        "receiptRequiredThreshold": 100.00 // 需要凭证的金额阈值
      }
    },
    "lastUpdated": "2023-12-01T10:30:00Z", // 最后更新时间
    "version": "1.2.0" // 设置版本
  }
}
```

#### 10.2.2 更新偏好设置
- **接口地址：** PUT /api/profile/preferences
- **功能描述：** 更新当前用户的偏好设置
- **请求参数：**
```json
{
  "language": "zh-CN", // [可选] 语言偏好，字符串类型
  "theme": "light", // [可选] 主题偏好，字符串类型，可选值：light/dark/auto
  "timezone": "Asia/Shanghai", // [可选] 时区，字符串类型
  "dateFormat": "YYYY-MM-DD", // [可选] 日期格式，字符串类型
  "timeFormat": "24h", // [可选] 时间格式，字符串类型，可选值：12h/24h
  "currency": "CNY", // [可选] 货币类型，字符串类型
  "numberFormat": "zh-CN", // [可选] 数字格式，字符串类型
  "notificationSettings": { // [可选] 通知设置
    "email": {
      "enabled": true,
      "types": ["expense_reminder", "bill_due"]
    },
    "sms": {
      "enabled": false
    },
    "push": {
      "enabled": true,
      "quietHours": {
        "enabled": true,
        "start": "22:00",
        "end": "08:00"
      }
    }
  },
  "privacySettings": { // [可选] 隐私设置
    "profileVisibility": "dormitory",
    "showRealName": false,
    "showExpenses": false
  },
  "dashboardSettings": { // [可选] 仪表盘设置
    "defaultView": "overview",
    "autoRefresh": true,
    "refreshInterval": 300
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "偏好设置更新成功", // 操作结果消息
    "updatedSections": [ // 更新的设置部分
      "notificationSettings",
      "theme",
      "language"
    ],
    "updatedAt": "2023-12-01T10:30:00Z", // 更新时间
    "preferences": { // 更新后的完整设置
      "language": "zh-CN",
      "theme": "light",
      "timezone": "Asia/Shanghai",
      "notificationSettings": {
        "email": {
          "enabled": true,
          "types": ["expense_reminder", "bill_due"]
        },
        "sms": {
          "enabled": false,
          "types": []
        },
        "push": {
          "enabled": true,
          "types": ["all"],
          "quietHours": {
            "enabled": true,
            "start": "22:00",
            "end": "08:00"
          }
        }
      }
    }
  }
}
```

### 10.3 安全设置接口

#### 10.3.1 修改密码
- **接口地址：** PUT /api/profile/password
- **功能描述：** 修改当前用户的登录密码
- **请求参数：**
```json
{
  "oldPassword": "oldPassword123", // [必填] 当前密码，字符串类型
  "newPassword": "newPassword456", // [必填] 新密码，字符串类型，8-20字符，包含字母和数字
  "confirmPassword": "newPassword456", // [必填] 确认密码，字符串类型，必须与新密码一致
  "forceLogout": true // [可选] 是否强制所有设备退出登录，布尔类型，默认true
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "密码修改成功", // 操作结果消息
    "passwordStrength": { // 新密码强度信息
      "score": 85, // 密码强度分数（0-100）
      "level": "strong", // 强度等级：weak/medium/strong/very_strong
      "feedback": ["密码长度足够", "包含大小写字母", "包含数字", "包含特殊字符"] // 强度反馈
    },
    "securityActions": [ // 安全相关操作
      {
        "action": "force_logout",
        "description": "已强制所有设备退出登录",
        "timestamp": "2023-12-01T10:30:00Z"
      },
      {
        "action": "session_refresh",
        "description": "已刷新当前会话",
        "timestamp": "2023-12-01T10:30:00Z"
      }
    ],
    "nextReviewDate": "2023-12-08T10:30:00Z", // 建议下次修改密码时间
    "passwordHistoryDays": 90 // 密码历史天数（不能使用近期密码）
  }
}
```

#### 10.3.2 启用两步验证
- **接口地址：** POST /api/profile/two-factor/enable
- **功能描述：** 为当前用户启用两步验证功能
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "两步验证已启用", // 操作结果消息
    "twoFactorInfo": { // 两步验证信息
      "enabled": true,
      "method": "totp", // 验证方法：totp/sms/email
      "provider": "Google Authenticator", // 提供商
      "setupDate": "2023-12-01T10:30:00Z", // 设置日期
      "lastUsed": null, // 最后使用时间
      "backupCodesCount": 8 // 备用验证码数量
    },
    "qrCode": { // 二维码信息
      "imageUrl": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth%3A%2F%2Ftotp%2FAccountingSystem%3Azhangsan%3Fsecret%3DJBSWY3DPEHPK3PXP%26issuer%3DAccountingSystem",
      "manualEntryKey": "JBSWY3DPEHPK3PXP", // 手动输入密钥
      "verificationUrl": "https://authenticator.actualapp.com/?label=AccountingSystem:zhangsan"
    },
    "backupCodes": [ // 备用验证码（只显示一次）
      "12345678",
      "87654321",
      "11223344",
      "44332211",
      "55667788",
      "88776655",
      "13579246",
      "86420975"
    ],
    "instructions": [ // 设置说明
      "下载Google Authenticator或类似应用",
      "扫描上方二维码或手动输入密钥",
      "输入当前验证码完成验证",
      "妥善保管备用验证码"
    ],
    "validityPeriod": 365 // 有效期（天）
  }
}
```

#### 10.3.3 禁用两步验证
- **接口地址：** POST /api/profile/two-factor/disable
- **功能描述：** 禁用当前用户的两步验证功能
- **请求参数：**
```json
{
  "password": "currentPassword123", // [必填] 当前密码，字符串类型
  "verificationCode": "123456", // [必填] 当前两步验证码，字符串类型
  "confirmDisable": true // [必填] 确认禁用，布尔类型
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "两步验证已禁用", // 操作结果消息
    "securityActions": [ // 安全相关操作
      {
        "action": "logout_all_sessions",
        "description": "已强制所有设备重新登录",
        "timestamp": "2023-12-01T10:30:00Z"
      },
      {
        "action": "clear_backup_codes",
        "description": "已清除所有备用验证码",
        "timestamp": "2023-12-01T10:30:00Z"
      }
    ],
    "riskAssessment": { // 安全风险评估
      "riskLevel": "medium", // 风险等级：low/medium/high
      "factors": [
        "账户不再受两步验证保护",
        "建议使用强密码",
        "建议启用其他安全措施"
      ],
      "recommendations": [
        "使用复杂密码",
        "定期更换密码",
        "开启登录通知"
      ]
    },
    "recoveryOptions": [ // 账户恢复选项
      "绑定手机号",
      "绑定邮箱",
      "设置安全问题"
    ]
  }
}
```

#### 10.3.4 获取登录会话列表
- **接口地址：** POST /api/profile/login-sessions
- **功能描述：** 获取当前用户的登录会话列表
- **请求参数：**
```json
{
  "page": 1, // [可选] 页码，数字类型，默认1
  "size": 10, // [可选] 每页数量，数字类型，默认10，最大50
  "includeExpired": false // [可选] 是否包含已过期会话，布尔类型，默认false
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "sessions": [ // 会话列表
      {
        "sessionId": "sess_20231201_001", // 会话ID
        "deviceId": "device_001", // 设备ID
        "deviceInfo": { // 设备信息
          "type": "desktop", // 设备类型：mobile/tablet/desktop
          "os": "Windows 10", // 操作系统
          "browser": "Chrome 119.0", // 浏览器
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "ip": "192.168.1.100", // IP地址
          "location": "北京市朝阳区", // 地理位置
          "isTrusted": true // 是否受信任设备
        },
        "loginTime": "2023-12-01T08:30:00Z", // 登录时间
        "lastActivity": "2023-12-01T10:25:00Z", // 最后活动时间
        "expiresAt": "2023-12-08T08:30:00Z", // 过期时间
        "isCurrent": true, // 是否为当前会话
        "status": "active", // 状态：active/expired/suspended
        "twoFactorUsed": true, // 是否使用了两步验证
        "loginMethod": "password", // 登录方式：password/social/biometric
        "duration": 6900, // 会话持续时间（秒）
        "activityCount": 45 // 活动次数
      },
      {
        "sessionId": "sess_20231130_002",
        "deviceInfo": {
          "type": "mobile",
          "os": "iOS 16.0",
          "browser": "Safari 16.0",
          "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
          "ip": "192.168.1.101",
          "location": "北京市朝阳区",
          "isTrusted": false
        },
        "loginTime": "2023-11-30T20:15:00Z",
        "lastActivity": "2023-11-30T23:45:00Z",
        "expiresAt": "2023-12-07T20:15:00Z",
        "isCurrent": false,
        "status": "active",
        "twoFactorUsed": true,
        "loginMethod": "password",
        "duration": 12600,
        "activityCount": 23
      }
    ],
    "statistics": { // 会话统计
      "totalSessions": 5, // 总会话数
      "activeSessions": 3, // 活跃会话数
      "expiredSessions": 2, // 过期会话数
      "trustedDevices": 2, // 受信任设备数
      "uniqueLocations": 2, // 登录地点数
      "currentLocation": "北京市朝阳区", // 当前地点
      "mostUsedDevice": "desktop", // 最常用设备类型
      "averageSessionDuration": 5400 // 平均会话时长（秒）
    },
    "pagination": { // 分页信息
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 5,
      "pageSize": 10
    }
  }
}
```

#### 10.3.5 退出指定设备
- **接口地址：** DELETE /api/profile/login-sessions/{sessionId}
- **功能描述：** 强制退出指定设备的登录会话
- **路径参数：**
```json
{
  "sessionId": "sess_20231130_002" // [必填] 会话ID，字符串类型
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "设备会话已强制退出", // 操作结果消息
    "terminatedSession": { // 被终止的会话信息
      "sessionId": "sess_20231130_002",
      "deviceInfo": {
        "type": "mobile",
        "os": "iOS 16.0",
        "browser": "Safari 16.0",
        "ip": "192.168.1.101"
      },
      "loginTime": "2023-11-30T20:15:00Z",
      "terminationTime": "2023-12-01T10:30:00Z",
      "reason": "user_initiated" // 终止原因：user_initiated/security_expired/inactivity
    },
    "remainingSessions": 4, // 剩余活跃会话数
    "securityActions": [ // 安全操作
      {
        "action": "notify_other_sessions",
        "description": "已通知其他设备",
        "timestamp": "2023-12-01T10:30:00Z"
      }
    ],
    "recommendations": [ // 安全建议
      "定期检查活跃会话",
      "及时退出不使用的设备",
      "启用两步验证增强安全性"
    ]
  }
}
```

## 十一、智能提醒模块

## 十一、智能提醒模块

### 11.1 智能提醒接口

#### 11.1.1 获取智能提醒列表
- **接口地址：** GET /api/smart-notifications
- **功能描述：** 获取用户的智能提醒列表，支持按优先级、类型和未读状态筛选
- **请求参数：**
```json
{
  "priority": "high", // [可选] 优先级筛选，字符串类型，可选值：low/medium/high/urgent
  "type": "budget_warning", // [可选] 提醒类型，字符串类型，可选值：expense_reminder/bill_due/budget_warning/dormitory_notice/security_alert
  "unread": true, // [可选] 是否只显示未读，字符串类型，可选值：true/false/all
  "page": 1, // [可选] 页码，数字类型，默认1
  "size": 20, // [可选] 每页数量，数字类型，默认20，最大100
  "dateRange": { // [可选] 时间范围
    "start": "2023-11-01",
    "end": "2023-12-01"
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "notifications": [ // 智能提醒列表
      {
        "id": "notif_20231201_001",
        "title": "预算超支预警", // 提醒标题
        "content": "本月电费预算已使用95%，剩余金额不足50元，建议及时调整用电计划", // 提醒内容
        "type": "budget_warning", // 提醒类型：expense_reminder/bill_due/budget_warning/dormitory_notice/security_alert
        "priority": "high", // 优先级：low/medium/high/urgent
        "category": "budget", // 分类：expense/bill/budget/dormitory/security/system
        "read": false, // 是否已读
        "archived": false, // 是否已归档
        "urgent": false, // 是否紧急
        "createdAt": "2023-12-01T09:30:00Z", // 创建时间
        "readAt": null, // 阅读时间
        "actionRequired": true, // 是否需要用户操作
        "actionUrl": "/dashboard/budget/101", // 操作链接
        "actionText": "查看预算详情", // 操作按钮文本
        "expirationTime": "2023-12-08T09:30:00Z", // 过期时间
        "relatedData": { // 相关数据
          "budgetId": 101,
          "budgetName": "2023年12月电费预算",
          "usedAmount": 950.00,
          "totalAmount": 1000.00,
          "usagePercentage": 95,
          "remainingAmount": 50.00,
          "dormitoryId": 101,
          "dormitoryName": "宿舍楼A栋101室"
        },
        "personalization": { // 个性化信息
          "userHabits": "用电量较大，建议注意节约用电",
          "suggestions": ["调整用电时间", "关闭不必要的电器"]
        },
        "deliveryStatus": { // 送达状态
          "inApp": true,
          "email": false,
          "sms": false,
          "push": true
        }
      },
      {
        "id": "notif_20231201_002",
        "title": "账单到期提醒",
        "content": "水费账单即将到期，请及时缴费以避免滞纳金",
        "type": "bill_due",
        "priority": "medium",
        "category": "bill",
        "read": false,
        "archived": false,
        "urgent": false,
        "createdAt": "2023-12-01T08:15:00Z",
        "readAt": null,
        "actionRequired": true,
        "actionUrl": "/bills/pending",
        "actionText": "立即缴费",
        "expirationTime": "2023-12-05T23:59:59Z",
        "relatedData": {
          "billId": 202312001,
          "billType": "水费",
          "amount": 85.50,
          "dueDate": "2023-12-05T23:59:59Z",
          "dormitoryId": 101
        },
        "personalization": {
          "userHabits": "通常在最后一天缴费",
          "suggestions": ["提前缴费避免忘记"]
        },
        "deliveryStatus": {
          "inApp": true,
          "email": true,
          "sms": false,
          "push": true
        }
      }
    ],
    "statistics": { // 提醒统计
      "totalCount": 15, // 总提醒数
      "unreadCount": 8, // 未读数
      "urgentCount": 2, // 紧急提醒数
      "byType": { // 按类型统计
        "budget_warning": 5,
        "bill_due": 4,
        "expense_reminder": 3,
        "dormitory_notice": 2,
        "security_alert": 1
      },
      "byPriority": { // 按优先级统计
        "urgent": 2,
        "high": 6,
        "medium": 5,
        "low": 2
      }
    },
    "pagination": { // 分页信息
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 15,
      "pageSize": 20
    },
    "filters": { // 当前应用的筛选条件
      "priority": "high",
      "type": "budget_warning",
      "unread": "true"
    }
  }
}
```

#### 11.1.2 处理提醒
- **接口地址：** POST /api/smart-notifications/{id}/handle
- **功能描述：** 处理指定的智能提醒，支持标记已读、归档、忽略等操作
- **路径参数：**
```json
{
  "id": "notif_20231201_001" // [必填] 提醒ID，字符串类型
}
```
- **请求参数：**
```json
{
  "action": "mark_read", // [必填] 操作类型，字符串类型，可选值：mark_read/mark_unread/archive/unarchive/ignore/delete/dismiss
  "comment": "已处理", // [可选] 处理备注，字符串类型
  "customAction": { // [可选] 自定义操作数据
    "actionType": "adjust_budget",
    "newAmount": 1200.00,
    "reason": "用电量增加"
  },
  "snooze": { // [可选] 延迟提醒设置
    "enabled": true,
    "duration": 24 // 延迟小时数
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "提醒处理成功", // 操作结果消息
    "action": "mark_read", // 执行的操作
    "notification": { // 处理后的提醒信息
      "id": "notif_20231201_001",
      "read": true,
      "readAt": "2023-12-01T10:30:00Z",
      "archived": false,
      "actionRequired": false,
      "status": "processed" // 状态：active/processed/archived/ignored/deleted
    },
    "userFeedback": { // 用户反馈
      "helpful": true, // 提醒是否有帮助
      "relevance": 5, // 相关性评分 1-5
      "frequency": "appropriate", // 频率评价：too_frequent/appropriate/too_sparse
      "comment": "提醒很及时，帮助我避免了预算超支"
    },
    "nextNotification": { // 下一个相关提醒
      "id": "notif_20231201_003",
      "scheduledTime": "2023-12-03T09:30:00Z",
      "type": "budget_warning",
      "title": "预算执行建议"
    }
  }
}
```

#### 11.1.3 生成智能提醒
- **接口地址：** POST /api/smart-notifications/generate
- **功能描述：** 根据特定条件生成智能提醒，支持手动触发和自动生成
- **请求参数：**
```json
{
  "triggerType": "budget_threshold", // [必填] 触发类型，字符串类型，可选值：budget_threshold/bill_due/expense_pattern/anomaly_detection/scheduled/maintenance
  "data": { // [必填] 触发数据
    "budgetId": 101,
    "currentUsage": 950.00,
    "totalAmount": 1000.00,
    "thresholdPercentage": 95,
    "dormitoryId": 101,
    "category": "electricity",
    "timeframe": "monthly"
  },
  "userId": 1001, // [可选] 目标用户ID，数字类型，默认当前用户
  "priority": "high", // [可选] 优先级，字符串类型，默认medium
  "customTemplate": { // [可选] 自定义模板
    "title": "预算使用情况提醒",
    "content": "您的{category}预算已使用{percentage}%",
    "variables": ["category", "percentage", "remaining"]
  },
  "schedule": { // [可选] 定时设置
    "immediate": true, // 是否立即发送
    "delay": 0, // 延迟发送（分钟）
    "recurring": { // 重复设置
      "enabled": false,
      "interval": "daily",
      "endDate": "2023-12-31T23:59:59Z"
    }
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "智能提醒生成成功", // 操作结果消息
    "generatedNotification": { // 生成的提醒信息
      "id": "notif_20231201_003",
      "title": "预算超支预警",
      "content": "本月电费预算已使用95%，剩余金额不足50元，建议及时调整用电计划",
      "type": "budget_warning",
      "priority": "high",
      "category": "budget",
      "createdAt": "2023-12-01T10:30:00Z",
      "actionRequired": true,
      "expirationTime": "2023-12-08T10:30:00Z"
    },
    "personalizationResult": { // 个性化结果
      "personalizedContent": "根据您的历史用电习惯，建议您在22:00后减少高功率电器使用",
      "suggestions": [
        "调整用电时间到低峰时段",
        "关闭待机状态的电器",
        "考虑更换节能电器"
      ],
      "predictedSavings": 80.00, // 预计节省金额
      "confidence": 0.85 // 预测置信度
    },
    "aiAnalysis": { // AI分析结果
      "pattern": "monthly_usage_spike",
      "confidence": 0.92,
      "factors": [
        "季节性用电增加",
        "新学期设备增多",
        "天气转冷制热需求"
      ],
      "recommendations": [
        "制定用电计划",
        "设置用电提醒",
        "考虑集体采购节能设备"
      ]
    },
    "deliveryPlan": { // 送达计划
      "channels": ["in_app", "email", "push"],
      "timing": "immediate",
      "followUp": {
        "enabled": true,
        "interval": "24h",
        "maxAttempts": 3
      }
    }
  }
}
```

### 11.2 仪表盘配置接口

#### 11.2.1 获取Widget配置
- **接口地址：** GET /api/dashboard/widgets
- **功能描述：** 获取当前用户的仪表盘Widget配置和布局信息
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "widgetConfig": { // Widget配置
      "version": "2.1.0", // 配置版本
      "layout": [ // 布局配置
        {
          "id": "expense_summary",
          "type": "chart",
          "position": {"x": 0, "y": 0, "w": 6, "h": 4},
          "title": "费用概览",
          "enabled": true,
          "config": {
            "chartType": "line",
            "timeRange": "30d",
            "showTrend": true,
            "groupBy": "category"
          }
        },
        {
          "id": "budget_status",
          "type": "metric",
          "position": {"x": 6, "y": 0, "w": 3, "h": 2},
          "title": "预算状态",
          "enabled": true,
          "config": {
            "showPercentage": true,
            "showAmount": true,
            "threshold": 80
          }
        },
        {
          "id": "recent_activities",
          "type": "list",
          "position": {"x": 0, "y": 4, "w": 4, "h": 3},
          "title": "最近活动",
          "enabled": true,
          "config": {
            "maxItems": 10,
            "showIcons": true,
            "filterByType": ["expense", "payment", "bill"]
          }
        },
        {
          "id": "bill_reminder",
          "type": "alert",
          "position": {"x": 4, "y": 4, "w": 5, "h": 3},
          "title": "账单提醒",
          "enabled": true,
          "config": {
            "showDue": true,
            "showOverdue": true,
            "maxAlerts": 5
          }
        }
      ],
      "theme": {
        "primary": "#3b82f6",
        "secondary": "#6b7280",
        "background": "#ffffff",
        "text": "#1f2937",
        "border": "#e5e7eb"
      },
      "responsive": { // 响应式配置
        "breakpoints": {
          "mobile": 768,
          "tablet": 1024,
          "desktop": 1280
        },
        "mobileLayout": "vertical",
        "tabletLayout": "mixed"
      }
    },
    "availableWidgets": [ // 可用Widget列表
      {
        "id": "expense_summary",
        "name": "费用概览",
        "description": "显示费用统计图表和趋势",
        "category": "analytics",
        "icon": "chart-line",
        "defaultConfig": {
          "chartType": "line",
          "timeRange": "30d"
        },
        "dataRequirements": ["expenses", "categories"],
        "minSize": {"w": 4, "h": 3},
        "maxSize": {"w": 12, "h": 8}
      },
      {
        "id": "budget_status",
        "name": "预算状态",
        "description": "显示预算使用情况和进度",
        "category": "budget",
        "icon": "progress-circle",
        "defaultConfig": {
          "showPercentage": true,
          "threshold": 80
        },
        "dataRequirements": ["budgets", "expenses"],
        "minSize": {"w": 3, "h": 2},
        "maxSize": {"w": 6, "h": 4}
      }
    ],
    "userPreferences": { // 用户偏好
      "autoRefresh": true,
      "refreshInterval": 300,
      "animationsEnabled": true,
      "compactMode": false,
      "showTooltips": true,
      "defaultTimeRange": "30d"
    }
  }
}
```

#### 11.2.2 更新Widget配置
- **接口地址：** PUT /api/dashboard/widgets
- **功能描述：** 更新用户的仪表盘Widget配置和布局设置
- **请求参数：**
```json
{
  "layout": [ // [必填] Widget布局配置
    {
      "id": "expense_summary",
      "position": {"x": 0, "y": 0, "w": 8, "h": 4},
      "enabled": true,
      "config": {
        "chartType": "bar",
        "timeRange": "7d",
        "showTrend": true
      }
    },
    {
      "id": "budget_status",
      "position": {"x": 8, "y": 0, "w": 4, "h": 2},
      "enabled": true,
      "config": {
        "showPercentage": true,
        "threshold": 90
      }
    }
  ],
  "theme": { // [可选] 主题配置
    "primary": "#10b981",
    "secondary": "#6366f1",
    "background": "#f9fafb"
  },
  "preferences": { // [可选] 用户偏好
    "autoRefresh": false,
    "refreshInterval": 600,
    "compactMode": true,
    "animationsEnabled": false
  },
  "responsive": { // [可选] 响应式配置
    "mobileLayout": "vertical",
    "tabletLayout": "horizontal"
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "仪表盘配置更新成功", // 操作结果消息
    "updatedConfig": { // 更新后的配置
      "version": "2.1.1",
      "layout": [
        {
          "id": "expense_summary",
          "position": {"x": 0, "y": 0, "w": 8, "h": 4},
          "enabled": true,
          "updatedAt": "2023-12-01T10:30:00Z"
        }
      ],
      "theme": {
        "primary": "#10b981",
        "updatedAt": "2023-12-01T10:30:00Z"
      }
    },
    "validationResults": { // 配置验证结果
      "valid": true,
      "warnings": [
        "预算状态Widget高度建议不小于2"
      ],
      "errors": []
    },
    "performanceImpact": { // 性能影响评估
      "estimatedLoadTime": "1.2s",
      "dataQueries": 8,
      "recommendations": [
        "考虑减少实时数据刷新频率",
        "优化图表渲染配置"
      ]
    },
    "previewUrl": "/dashboard/preview?version=2.1.1" // 预览链接
  }
}
```

#### 11.2.3 获取仪表盘统计数据
- **接口地址：** GET /api/dashboard/stats
- **功能描述：** 获取仪表盘的核心统计数据，包括宿舍、成员、支出和预算等关键指标
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "overview": { // 概览统计
      "dormitoryCount": 1, // 宿舍数量
      "memberCount": 4, // 成员数量
      "thisMonthExpense": 1580.50, // 本月支出
      "totalBudget": 2000.00, // 总预算
      "budgetUsageRate": 79.03, // 预算使用率(%)
      "pendingBills": 2, // 待支付账单数
      "overdueBills": 0, // 逾期账单数
      "avgExpensePerPerson": 395.13 // 人均支出
    },
    "expenseBreakdown": { // 支出分类统计
      "utilities": {
        "amount": 680.50,
        "percentage": 43.04,
        "count": 8,
        "trend": "increasing"
      },
      "maintenance": {
        "amount": 420.00,
        "percentage": 26.57,
        "count": 3,
        "trend": "stable"
      },
      "supplies": {
        "amount": 280.00,
        "percentage": 17.71,
        "count": 12,
        "trend": "decreasing"
      },
      "other": {
        "amount": 200.00,
        "percentage": 12.66,
        "count": 5,
        "trend": "stable"
      }
    },
    "budgetStatus": { // 预算状态
      "totalBudget": 2000.00,
      "usedAmount": 1580.50,
      "remainingAmount": 419.50,
      "usageRate": 79.03,
      "daysRemaining": 15,
      "avgDailySpend": 105.37,
      "projectedMonthEnd": 1825.50,
      "budgetVariance": -174.50,
      "riskLevel": "medium" // low/medium/high
    },
    "memberActivity": { // 成员活动统计
      "mostActive": {
        "userId": 1001,
        "userName": "张三",
        "expenseCount": 12,
        "totalAmount": 680.50
      },
      "leastActive": {
        "userId": 1004,
        "userName": "赵六",
        "expenseCount": 3,
        "totalAmount": 180.00
      },
      "recentJoins": [
        {
          "userId": 1005,
          "userName": "钱七",
          "joinDate": "2023-11-28T00:00:00Z"
        }
      ]
    },
    "alerts": [ // 重要提醒
      {
        "id": "alert_001",
        "type": "budget_warning",
        "severity": "medium",
        "title": "预算使用率超过75%",
        "message": "本月预算已使用79%，建议注意支出控制",
        "createdAt": "2023-12-01T09:00:00Z",
        "actionRequired": true
      },
      {
        "id": "alert_002",
        "type": "bill_reminder",
        "severity": "low",
        "title": "水费账单即将到期",
        "message": "水费账单将在3天后到期",
        "createdAt": "2023-12-01T08:30:00Z",
        "actionRequired": false
      }
    ],
    "comparisons": { // 同比数据
      "lastMonthExpense": 1420.30,
      "monthOverMonthChange": 11.28,
      "lastYearSameMonth": 1350.80,
      "yearOverYearChange": 17.01,
      "dormitoryAverage": 1450.25,
      "aboveAverage": 130.25
    },
    "lastUpdated": "2023-12-01T10:30:00Z", // 数据最后更新时间
    "dataFreshness": { // 数据新鲜度
      "realTime": ["active_sessions", "current_balance"],
      "hourly": ["expenses", "budget_status"],
      "daily": ["statistics", "trends"],
      "lastSync": "2023-12-01T10:25:00Z"
    }
  }
}
```

#### 11.2.4 获取最近活动
- **接口地址：** GET /api/dashboard/activities
- **功能描述：** 获取用户相关的最近活动记录，支持分页和类型筛选
- **请求参数：**
```json
{
  "limit": 20, // [可选] 限制数量，数字类型，默认20，最大100
  "type": ["expense", "payment", "budget"], // [可选] 活动类型筛选，数组类型
  "timeRange": "7d", // [可选] 时间范围，字符串类型，可选值：1d/7d/30d/90d/all
  "userId": 1001, // [可选] 指定用户ID，数字类型，默认当前用户
  "includeSystem": false // [可选] 是否包含系统活动，布尔类型，默认false
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "activities": [ // 最近活动列表
      {
        "id": "activity_20231201_001",
        "type": "expense", // 活动类型：expense/payment/budget/bill/user/dormitory/system
        "action": "created", // 操作类型：created/updated/deleted/approved/rejected/paid/overdue
        "title": "新增费用记录", // 活动标题
        "description": "张三创建了电费支出记录，金额150.00元", // 活动描述
        "user": { // 相关用户
          "userId": 1001,
          "userName": "张三",
          "avatarUrl": "https://picsum.photos/40/40?random=1"
        },
        "target": { // 目标对象
          "type": "expense",
          "id": "exp_20231201_001",
          "name": "电费",
          "amount": 150.00,
          "category": "utilities"
        },
        "timestamp": "2023-12-01T10:25:00Z", // 活动时间
        "location": { // 位置信息
          "dormitoryId": 101,
          "dormitoryName": "宿舍楼A栋101室",
          "room": "101"
        },
        "metadata": { // 元数据
          "category": "utilities",
          "amount": 150.00,
          "paymentMethod": "alipay",
          "receiptUrl": "https://picsum.photos/300/200?random=1",
          "approved": false
        },
        "impact": { // 影响分析
          "budgetImpact": -150.00,
          "monthlyTotal": 1580.50,
          "budgetUsageRate": 79.03
        },
        "notifications": { // 通知状态
          "inApp": true,
          "email": false,
          "sms": false
        }
      },
      {
        "id": "activity_20231201_002",
        "type": "payment",
        "action": "completed",
        "title": "支付完成",
        "description": "李四完成了水费账单支付，金额85.50元",
        "user": {
          "userId": 1002,
          "userName": "李四",
          "avatarUrl": "https://picsum.photos/40/40?random=2"
        },
        "target": {
          "type": "bill",
          "id": "bill_202312001",
          "name": "2023年12月水费",
          "amount": 85.50
        },
        "timestamp": "2023-12-01T09:15:00Z",
        "location": {
          "dormitoryId": 101,
          "dormitoryName": "宿舍楼A栋101室"
        },
        "metadata": {
          "paymentMethod": "wechat_pay",
          "transactionId": "wx_20231201001",
          "paymentTime": "2023-12-01T09:15:00Z"
        },
        "impact": {
          "pendingBills": 1,
          "overdueBills": 0,
          "paymentRate": 85.71
        },
        "notifications": {
          "inApp": true,
          "email": true,
          "sms": false
        }
      }
    ],
    "activitySummary": { // 活动统计摘要
      "total": 45, // 总活动数
      "byType": { // 按类型统计
        "expense": 18,
        "payment": 12,
        "budget": 8,
        "bill": 5,
        "user": 2
      },
      "byAction": { // 按操作统计
        "created": 20,
        "updated": 15,
        "completed": 8,
        "deleted": 2
      },
      "byUser": { // 按用户统计
        "1001": 12,
        "1002": 10,
        "1003": 8,
        "1004": 5
      },
      "peakActivity": { // 活动高峰
        "hour": 20,
        "count": 8,
        "period": "20:00-21:00"
      }
    },
    "filters": { // 当前筛选条件
      "type": ["expense", "payment", "budget"],
      "timeRange": "7d",
      "limit": 20
    },
    "hasMore": true, // 是否有更多数据
    "nextCursor": "cursor_20231201_002" // 下一页游标
  }
}
```

### 11.3 实时更新接口

#### 11.3.1 手动刷新数据
- **接口地址：** POST /api/dashboard/refresh
- **功能描述：** 手动触发仪表盘数据刷新，支持指定刷新范围和优先级
- **请求参数：**
```json
{
  "scope": "all", // [可选] 刷新范围，字符串类型，可选值：all/widgets/statistics/users
  "priority": "high", // [可选] 刷新优先级，字符串类型，可选值：low/normal/high/urgent
  "widgets": [ // [可选] 指定要刷新的Widget列表
    "expense_summary",
    "budget_status",
    "recent_activities"
  ],
  "forceUpdate": false, // [可选] 是否强制更新，忽略缓存，布尔类型，默认false
  "backgroundRefresh": false // [可选] 是否后台刷新，布尔类型，默认false
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "数据刷新请求已提交", // 操作结果消息
    "refreshId": "refresh_20231201_001", // 刷新任务ID
    "estimatedTime": 3.5, // 预计完成时间（秒）
    "refreshPlan": { // 刷新计划
      "scope": "all",
      "priority": "high",
      "estimatedDuration": 3.5,
      "dataSources": [
        {
          "source": "expenses",
          "estimatedTime": 1.2,
          "cacheHit": false
        },
        {
          "source": "budgets",
          "estimatedTime": 0.8,
          "cacheHit": true
        },
        {
          "source": "bills",
          "estimatedTime": 1.0,
          "cacheHit": false
        },
        {
          "source": "users",
          "estimatedTime": 0.5,
          "cacheHit": true
        }
      ]
    },
    "affectedWidgets": [ // 受影响的Widget
      {
        "id": "expense_summary",
        "refreshTime": "2023-12-01T10:30:05Z",
        "status": "pending"
      },
      {
        "id": "budget_status",
        "refreshTime": "2023-12-01T10:30:03Z",
        "status": "pending"
      }
    ],
    "performance": { // 性能信息
      "cacheUtilization": 65.2,
      "dataFreshness": "current",
      "networkRequests": 4,
      "estimatedBandwidth": "2.3MB"
    },
    "notifications": [ // 相关通知
      {
        "type": "info",
        "message": "正在刷新最新数据，请稍候...",
        "timestamp": "2023-12-01T10:30:00Z"
      }
    ]
  }
}
```

#### 11.3.2 设置自动刷新
- **接口地址：** PUT /api/dashboard/auto-refresh
- **功能描述：** 配置仪表盘自动刷新设置，包括启用状态、刷新间隔和条件
- **请求参数：**
```json
{
  "enabled": true, // [必填] 是否启用自动刷新，布尔类型
  "interval": 300, // [可选] 刷新间隔（秒），数字类型，可选值：60/300/600/1800/3600，默认300
  "conditions": { // [可选] 刷新条件
    "dataChange": true, // 数据变化时刷新
    "userActive": true, // 用户活跃时刷新
    "peakHours": { // 高峰期配置
      "enabled": true,
      "startHour": 8,
      "endHour": 22,
      "interval": 60
    },
    "lowActivity": { // 低活跃期配置
      "enabled": true,
      "startHour": 22,
      "endHour": 8,
      "interval": 1800
    }
  },
  "optimization": { // [可选] 优化设置
    "smartRefresh": true, // 智能刷新
    "predictiveLoading": true, // 预测性加载
    "bandwidthAware": true, // 带宽感知
    "batteryAware": true // 电量感知
  },
  "notifications": { // [可选] 通知设置
    "showRefreshIndicator": true,
    "notifyOnErrors": true,
    "summaryNotifications": false
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "自动刷新设置更新成功", // 操作结果消息
    "currentConfig": { // 当前配置
      "enabled": true,
      "interval": 300,
      "lastRefresh": "2023-12-01T10:25:00Z",
      "nextRefresh": "2023-12-01T10:30:00Z",
      "conditions": {
        "dataChange": true,
        "userActive": true,
        "peakHours": {
          "enabled": true,
          "startHour": 8,
          "endHour": 22,
          "currentInterval": 60
        }
      }
    },
    "schedule": { // 刷新计划
      "nextScheduled": "2023-12-01T10:30:00Z",
      "frequency": "every_5_minutes",
      "conditions": [
        "user_active",
        "peak_hours",
        "data_change"
      ]
    },
    "optimizationResult": { // 优化结果
      "estimatedBandwidth": "1.8MB/hour",
      "estimatedBatteryImpact": "low",
      "cacheEfficiency": 85.2,
      "refreshAccuracy": 92.1
    },
    "performanceImpact": { // 性能影响评估
      "positive": [
        "数据实时性提升",
        "用户体验改善",
        "决策时效性增强"
      ],
      "considerations": [
        "网络流量增加",
        "服务器负载提升",
        "客户端资源消耗"
      ]
    },
    "recommendations": [ // 建议
      "建议在网络状况良好时启用",
      "可根据使用习惯调整刷新间隔",
      "高峰期可适当缩短刷新间隔"
    ]
  }
}
```

## 十二、费用审核模块

### 12.1 审核流程接口

#### 12.1.1 获取待审核费用列表
- **接口地址：** GET /api/expense-review/pending
- **功能描述：** 获取需要审核的费用列表，支持分页和多种筛选条件
- **请求参数：**
```json
{
  "page": 1, // [可选] 页码，数字类型，默认1
  "size": 20, // [可选] 每页数量，数字类型，默认20，最大100
  "category": "utilities", // [可选] 费用类别筛选，字符串类型
  "amountRange": { // [可选] 金额范围筛选
    "min": 0,
    "max": 1000
  },
  "search": "电费", // [可选] 搜索关键词，字符串类型
  "priority": "high", // [可选] 优先级筛选，字符串类型，可选值：low/medium/high/urgent
  "dateRange": { // [可选] 申请日期范围
    "start": "2023-11-01",
    "end": "2023-12-01"
  },
  "status": "pending", // [可选] 审核状态，字符串类型，默认pending
  "department": "计算机科学学院", // [可选] 部门筛选，字符串类型
  "sortBy": "createdAt", // [可选] 排序字段，字符串类型，默认createdAt
  "sortOrder": "desc" // [可选] 排序方向，字符串类型，可选值：asc/desc，默认desc
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "expenses": [ // 待审核费用列表
      {
        "id": "exp_20231201_001",
        "title": "2023年12月电费", // 费用标题
        "description": "宿舍12月份电费支出", // 费用描述
        "amount": 150.00, // 费用金额
        "currency": "CNY", // 货币类型
        "category": "utilities", // 费用类别
        "subcategory": "electricity", // 子类别
        "status": "pending", // 状态：pending/approved/rejected/expired
        "priority": "high", // 优先级：low/medium/high/urgent
        "applicant": { // 申请人信息
          "userId": 1001,
          "userName": "张三",
          "avatarUrl": "https://picsum.photos/40/40?random=1",
          "email": "zhangsan@example.com",
          "role": "member",
          "department": "计算机科学学院",
          "roomNumber": "A栋101"
        },
        "receipt": { // 票据信息
          "url": "https://picsum.photos/300/200?random=1",
          "type": "image",
          "uploadedAt": "2023-12-01T09:45:00Z",
          "verified": true,
          "verificationScore": 95
        },
        "budget": { // 预算信息
          "categoryBudget": 200.00,
          "usedAmount": 180.00,
          "remainingAmount": 20.00,
          "budgetUtilizationRate": 90.0,
          "overBudget": true
        },
        "reviewHistory": [ // 审核历史
          {
            "reviewer": {
              "userId": 1002,
              "userName": "李四"
            },
            "action": "submitted",
            "comment": "提交审核",
            "timestamp": "2023-12-01T10:00:00Z"
          }
        ],
        "createdAt": "2023-12-01T10:00:00Z",
        "updatedAt": "2023-12-01T10:00:00Z",
        "expiresAt": "2023-12-08T23:59:59Z",
        "riskScore": 75, // 风险评分(0-100)
        "requiresSpecialApproval": true, // 是否需要特殊审批
        "complianceChecks": { // 合规性检查
          "documentationComplete": true,
          "budgetExceeded": true,
          "policyCompliant": true
        },
        "metadata": { // 元数据
          "paymentMethod": "alipay",
          "merchant": "国家电网",
          "invoiceNumber": "INV_20231201_001",
          "tags": ["电费", "冬季", "超预算"]
        }
      },
      {
        "id": "exp_20231201_002",
        "title": "维修工具采购",
        "description": "购买宿舍维修工具",
        "amount": 85.50,
        "currency": "CNY",
        "category": "maintenance",
        "subcategory": "tools",
        "status": "pending",
        "priority": "medium",
        "applicant": {
          "userId": 1003,
          "userName": "王五",
          "avatarUrl": "https://picsum.photos/40/40?random=3",
          "email": "wangwu@example.com",
          "role": "member",
          "department": "计算机科学学院",
          "roomNumber": "B栋202"
        },
        "receipt": {
          "url": "https://picsum.photos/300/200?random=2",
          "type": "image",
          "uploadedAt": "2023-12-01T11:20:00Z",
          "verified": true,
          "verificationScore": 88
        },
        "budget": {
          "categoryBudget": 150.00,
          "usedAmount": 45.50,
          "remainingAmount": 104.50,
          "budgetUtilizationRate": 30.3,
          "overBudget": false
        },
        "reviewHistory": [
          {
            "reviewer": {
              "userId": 1003,
              "userName": "王五"
            },
            "action": "submitted",
            "comment": "提交维修工具采购申请",
            "timestamp": "2023-12-01T11:30:00Z"
          }
        ],
        "createdAt": "2023-12-01T11:30:00Z",
        "updatedAt": "2023-12-01T11:30:00Z",
        "expiresAt": "2023-12-08T23:59:59Z",
        "riskScore": 25,
        "requiresSpecialApproval": false,
        "complianceChecks": {
          "documentationComplete": true,
          "budgetExceeded": false,
          "policyCompliant": true
        },
        "metadata": {
          "paymentMethod": "wechat_pay",
          "merchant": "五金商店",
          "invoiceNumber": "INV_20231201_002",
          "tags": ["维修", "工具", "正常预算"]
        }
      }
    ],
    "pagination": { // 分页信息
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 45,
      "pageSize": 20,
      "hasNext": true,
      "hasPrev": false
    },
    "statistics": { // 统计信息
      "totalPending": 45, // 总待审核数
      "totalAmount": 12580.50, // 总待审核金额
      "urgentCount": 8, // 紧急费用数
      "overBudgetCount": 12, // 超预算费用数
      "highRiskCount": 5, // 高风险费用数
      "averageAmount": 279.57, // 平均金额
      "byCategory": { // 按类别统计
        "utilities": 18,
        "maintenance": 15,
        "supplies": 12
      },
      "byPriority": { // 按优先级统计
        "urgent": 8,
        "high": 15,
        "medium": 18,
        "low": 4
      }
    },
    "filters": { // 当前筛选条件
      "status": "pending",
      "category": "utilities"
    }
  }
}
```

#### 12.1.2 获取费用审核详情
- **接口地址：** GET /api/expense-review/{id}
- **功能描述：** 获取指定费用审核的详细信息，包括完整的审核历史和建议
- **路径参数：**
```json
{
  "id": "exp_20231201_001" // [必填] 费用ID，字符串类型
}
```
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "expense": { // 费用详细信息
      "id": "exp_20231201_001",
      "title": "2023年12月电费",
      "description": "宿舍12月份电费支出",
      "amount": 150.00,
      "currency": "CNY",
      "category": "utilities",
      "subcategory": "electricity",
      "status": "pending",
      "priority": "high",
      "applicant": {
        "userId": 1001,
        "userName": "张三",
        "avatarUrl": "https://picsum.photos/40/40?random=1",
        "email": "zhangsan@example.com",
        "role": "member",
        "department": "计算机科学学院",
        "roomNumber": "A栋101",
        "joinDate": "2023-09-01T00:00:00Z",
        "totalExpenses": 15,
        "approvalRate": 85.7
      },
      "expenseDetails": { // 费用详情
        "date": "2023-12-01",
        "merchant": "国家电网",
        "paymentMethod": "alipay",
        "invoiceNumber": "INV_20231201_001",
        "location": "在线支付",
        "purpose": "生活必需",
        "urgency": "normal"
      },
      "receipt": { // 票据详情
        "url": "https://picsum.photos/600/400?random=1",
        "thumbnailUrl": "https://picsum.photos/300/200?random=1",
        "type": "image",
        "size": 1024576,
        "format": "JPEG",
        "uploadedAt": "2023-12-01T09:45:00Z",
        "verified": true,
        "verificationScore": 95,
        "verificationDetails": {
          "amountMatch": true,
          "merchantMatch": true,
          "dateMatch": true,
          "documentQuality": "high"
        },
        "ocrData": { // OCR识别结果
          "extractedAmount": "150.00",
          "extractedMerchant": "国家电网",
          "extractedDate": "2023-12-01",
          "confidence": 0.98
        }
      },
      "budgetAnalysis": { // 预算分析
        "categoryBudget": 200.00,
        "usedAmount": 180.00,
        "requestedAmount": 150.00,
        "remainingAmount": 20.00,
        "budgetUtilizationRate": 90.0,
        "overBudget": true,
        "projectedYearEndUsage": 2400.00,
        "recommendedAdjustment": 200.00,
        "budgetVariance": {
          "absolute": -50.00,
          "percentage": -25.0
        }
      },
      "complianceAnalysis": { // 合规性分析
        "policyCompliance": {
          "status": "compliant",
          "score": 85,
          "issues": [],
          "recommendations": []
        },
        "documentationCompliance": {
          "status": "compliant",
          "score": 95,
          "issues": [],
          "recommendations": []
        },
        "budgetCompliance": {
          "status": "non_compliant",
          "score": 60,
          "issues": ["超出预算限制"],
          "recommendations": ["申请预算调整", "寻找替代方案"]
        }
      },
      "riskAssessment": { // 风险评估
        "overallRisk": {
          "score": 75,
          "level": "medium",
          "trend": "increasing"
        },
        "riskFactors": [
          {
            "factor": "budget_overrun",
            "weight": 0.4,
            "score": 80,
            "description": "超出预算限制"
          },
          {
            "factor": "seasonal_variation",
            "weight": 0.3,
            "score": 70,
            "description": "季节性用电增加"
          },
          {
            "factor": "user_history",
            "weight": 0.2,
            "score": 60,
            "description": "用户历史记录良好"
          },
          {
            "factor": "documentation_quality",
            "weight": 0.1,
            "score": 95,
            "description": "文档质量优秀"
          }
        ],
        "mitigationStrategies": [
          "要求提供详细的用电计划",
          "建议调整后续月份预算",
          "加强用电监控"
        ]
      },
      "approvalWorkflow": { // 审批工作流
        "currentStep": 1,
        "totalSteps": 3,
        "requiredApprovals": 2,
        "completedApprovals": 0,
        "workflowDefinition": [
          {
            "step": 1,
            "approver": {
              "userId": 1002,
              "userName": "李四",
              "role": "admin"
            },
            "required": true,
            "conditions": {
              "amount_threshold": 100
            }
          },
          {
            "step": 2,
            "approver": {
              "userId": 1004,
              "userName": "赵六",
              "role": "super_admin"
            },
            "required": true,
            "conditions": {
              "budget_exceeded": true
            }
          },
          {
            "step": 3,
            "approver": {
              "userId": 1005,
              "userName": "钱七",
              "role": "finance"
            },
            "required": false,
            "conditions": {
              "amount_threshold": 500
            }
          }
        ]
      },
      "similarExpenses": [ // 相似费用参考
        {
          "id": "exp_20231101_001",
          "title": "2023年11月电费",
          "amount": 120.00,
          "date": "2023-11-01",
          "status": "approved",
          "reviewer": {
            "userId": 1002,
            "userName": "李四"
          },
          "decision": "approved",
          "reviewTime": "2小时"
        }
      ],
      "automatedChecks": { // 自动化检查
        "duplicateDetection": {
          "status": "passed",
          "similarExpenses": [],
          "confidence": 0.95
        },
        "amountValidation": {
          "status": "passed",
          "range": "normal",
          "deviation": 15.2
        },
        "categoryValidation": {
          "status": "passed",
          "expectedCategory": "utilities",
          "confidence": 0.99
        },
        "vendorVerification": {
          "status": "passed",
          "vendorType": "utility_company",
          "riskLevel": "low"
        }
      },
      "reviewHistory": [ // 审核历史
        {
          "reviewer": {
            "userId": 1001,
            "userName": "张三",
            "role": "member"
          },
          "action": "submitted",
          "comment": "提交电费报销申请",
          "timestamp": "2023-12-01T10:00:00Z",
          "metadata": {
            "ipAddress": "192.168.1.100",
            "userAgent": "Mozilla/5.0..."
          }
        },
        {
          "reviewer": {
            "userId": 1002,
            "userName": "李四",
            "role": "admin"
          },
          "action": "auto_assigned",
          "comment": "自动分配审核任务",
          "timestamp": "2023-12-01T10:05:00Z",
          "metadata": {
            "assignmentReason": "amount_threshold",
            "workloadBalance": true
          }
        }
      ],
      "comments": [ // 评论和讨论
        {
          "id": "comment_001",
          "user": {
            "userId": 1002,
            "userName": "李四",
            "avatarUrl": "https://picsum.photos/40/40?random=2"
          },
          "content": "请提供更详细的用电说明",
          "type": "question",
          "timestamp": "2023-12-01T14:30:00Z",
          "replies": [
            {
              "id": "reply_001",
              "user": {
                "userId": 1001,
                "userName": "张三"
              },
              "content": "冬天需要使用取暖设备，所以用电量增加",
              "timestamp": "2023-12-01T15:00:00Z"
            }
          ]
        }
      ],
      "createdAt": "2023-12-01T10:00:00Z",
      "updatedAt": "2023-12-01T15:00:00Z",
      "expiresAt": "2023-12-08T23:59:59Z",
      "estimatedProcessingTime": "2-3个工作日",
      "notifications": { // 通知设置
        "email": true,
        "inApp": true,
        "sms": false
      }
    },
    "userPermissions": { // 当前用户权限
      "canApprove": true,
      "canReject": true,
      "canRequestMoreInfo": true,
      "canEscalate": true,
      "canComment": true,
      "canViewHistory": true,
      "canExport": true
    },
    "recommendedActions": [ // 推荐操作
      {
        "action": "approve",
        "confidence": 0.75,
        "reason": "费用合理，文档完整",
        "conditions": ["要求提供用电计划"]
      },
      {
        "action": "request_info",
        "confidence": 0.25,
        "reason": "需要更多详细信息",
        "requiredInfo": ["详细用电设备清单"]
      }
    ]
  }
}
```

#### 12.1.3 审核通过
- **接口地址：** POST /api/expense-review/{id}/approve
- **功能描述：** 批准指定的费用审核请求
- **路径参数：**
```json
{
  "id": "exp_20231201_001" // [必填] 费用ID，字符串类型
}
```
- **请求参数：**
```json
{
  "comment": "同意申请，建议下次提前申请预算调整", // [可选] 审核意见，字符串类型
  "conditions": { // [可选] 批准条件
    "budgetAdjustmentRequired": true,
    "futureApprovalThreshold": 100.00,
    "documentationUpdate": false,
    "paymentMethodRestriction": false
  },
  "notificationSettings": { // [可选] 通知设置
    "informApplicant": true,
    "informNextApprover": true,
    "detailedReason": true
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "费用审核通过",
    "expense": {
      "id": "exp_20231201_001",
      "status": "approved",
      "approvedAt": "2023-12-01T16:30:00Z",
      "approver": {
        "userId": 1002,
        "userName": "李四",
        "role": "admin"
      },
      "comment": "同意申请，建议下次提前申请预算调整",
      "conditions": {
        "budgetAdjustmentRequired": true,
        "futureApprovalThreshold": 100.00
      }
    },
    "notificationsSent": [
      {
        "type": "in_app",
        "recipient": {
          "userId": 1001,
          "userName": "张三"
        },
        "message": "您的电费报销申请已通过审核",
        "sentAt": "2023-12-01T16:30:05Z"
      }
    ],
    "nextStep": {
      "required": false,
      "description": "无需进一步审核"
    }
  }
}
```

#### 12.1.4 审核拒绝
- **接口地址：** POST /api/expense-review/{id}/reject
- **功能描述：** 拒绝指定的费用审核请求
- **路径参数：**
```json
{
  "id": "exp_20231201_001" // [必填] 费用ID，字符串类型
}
```
- **请求参数：**
```json
{
  "reason": "insufficient_documentation", // [必填] 拒绝原因，字符串类型，可选值：insufficient_documentation/budget_constraints/policy_violation/duplicate_request/amount_unreasonable/other
  "comment": "缺少详细的用电说明和设备清单", // [可选] 拒绝说明，字符串类型
  "rejectionType": "hard_reject", // [可选] 拒绝类型，字符串类型，可选值：hard_reject/soft_reject，默认hard_reject
  "allowResubmission": true, // [可选] 是否允许重新提交，布尔类型，默认true
  "suggestions": [ // [可选] 改进建议，数组类型
    "提供详细的用电设备清单",
    "说明用电量增加的具体原因"
  ]
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "费用审核被拒绝",
    "expense": {
      "id": "exp_20231201_001",
      "status": "rejected",
      "rejectedAt": "2023-12-01T17:00:00Z",
      "rejector": {
        "userId": 1002,
        "userName": "李四",
        "role": "admin"
      },
      "reason": "insufficient_documentation",
      "rejectionType": "hard_reject",
      "comment": "缺少详细的用电说明和设备清单",
      "suggestions": [
        "提供详细的用电设备清单",
        "说明用电量增加的具体原因"
      ],
      "allowResubmission": true
    },
    "notificationsSent": [
      {
        "type": "in_app",
        "recipient": {
          "userId": 1001,
          "userName": "张三"
        },
        "message": "您的电费报销申请被拒绝，原因：文档不足",
        "sentAt": "2023-12-01T17:00:05Z"
      }
    ]
  }
}
```

#### 12.1.5 批量审核通过
- **接口地址：** POST /api/expense-review/batch-approve
- **功能描述：** 批量批准多个费用审核请求
- **请求参数：**
```json
{
  "expenseIds": ["exp_20231201_001", "exp_20231201_002"], // [必填] 费用ID列表，数组类型
  "comment": "批量批准低风险费用", // [可选] 审核意见，字符串类型
  "conditions": { // [可选] 批准条件
    "amountLimit": 200.00,
    "categoryFilter": ["utilities", "supplies"]
  },
  "dryRun": false // [可选] 试运行模式，布尔类型，默认false
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "批量审核完成",
    "summary": {
      "totalRequested": 2,
      "approved": 2,
      "rejected": 0,
      "skipped": 0,
      "totalAmount": 235.50
    },
    "results": [
      {
        "expenseId": "exp_20231201_001",
        "status": "approved",
        "message": "审核通过"
      },
      {
        "expenseId": "exp_20231201_002",
        "status": "approved",
        "message": "审核通过"
      }
    ],
    "processingTime": "0.5秒"
  }
}
```

#### 12.1.6 批量审核拒绝
- **接口地址：** POST /api/expense-review/batch-reject
- **功能描述：** 批量拒绝多个费用审核请求
- **请求参数：**
```json
{
  "expenseIds": ["exp_20231201_003", "exp_20231201_004"], // [必填] 费用ID列表，数组类型
  "reason": "budget_constraints", // [必填] 拒绝原因，字符串类型
  "comment": "超出预算限制，暂不批准", // [可选] 拒绝说明，字符串类型
  "rejectionType": "soft_reject", // [可选] 拒绝类型，字符串类型，默认hard_reject
  "allowResubmission": true // [可选] 是否允许重新提交，布尔类型，默认true
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "批量拒绝完成",
    "summary": {
      "totalRequested": 2,
      "approved": 0,
      "rejected": 2,
      "skipped": 0,
      "totalAmount": 450.00
    },
    "results": [
      {
        "expenseId": "exp_20231201_003",
        "status": "rejected",
        "reason": "budget_constraints",
        "message": "拒绝成功"
      },
      {
        "expenseId": "exp_20231201_004",
        "status": "rejected",
        "reason": "budget_constraints",
        "message": "拒绝成功"
      }
    ],
    "savings": {
      "amount": 450.00,
      "budgetUtilizationImproved": "2.3%"
    },
    "processingTime": "0.3秒"
  }
}
```

### 12.2 审核统计接口

#### 12.2.1 获取审核统计
- **接口地址：** GET /api/expense-review/stats
- **功能描述：** 获取费用审核的统计数据分析
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "overview": { // 总体概览
      "totalPending": 45, // 待审核总数
      "totalPendingAmount": 12580.50, // 待审核总金额
      "urgentCount": 8, // 紧急费用数
      "overBudgetCount": 12, // 超预算费用数
      "averageProcessingTime": "2.3天", // 平均处理时间
      "approvalRate": 82.1, // 批准率(%)
      "efficiency": {
        "averageReviewTime": "3.5小时",
        "queueLength": 12,
        "estimatedClearanceTime": "1.2天"
      }
    },
    "trends": { // 趋势分析
      "dailyVolume": [ // 每日申请量
        {
          "date": "2023-11-28",
          "pending": 8,
          "approved": 6,
          "rejected": 2
        },
        {
          "date": "2023-11-29",
          "pending": 12,
          "approved": 9,
          "rejected": 3
        },
        {
          "date": "2023-11-30",
          "pending": 15,
          "approved": 11,
          "rejected": 4
        }
      ],
      "categoryDistribution": { // 类别分布
        "utilities": {
          "count": 18,
          "percentage": 40.0,
          "totalAmount": 5680.50
        },
        "maintenance": {
          "count": 15,
          "percentage": 33.3,
          "totalAmount": 4250.00
        },
        "supplies": {
          "count": 12,
          "percentage": 26.7,
          "totalAmount": 2650.00
        }
      },
      "riskDistribution": { // 风险分布
        "low": {
          "count": 25,
          "percentage": 55.6
        },
        "medium": {
          "count": 15,
          "percentage": 33.3
        },
        "high": {
          "count": 5,
          "percentage": 11.1
        }
      }
    },
    "performance": { // 性能指标
      "reviewerWorkload": [ // 审核人工作量
        {
          "reviewer": {
            "userId": 1002,
            "userName": "李四"
          },
          "pendingCount": 15,
          "averageTime": "2.1天",
          "approvalRate": 85.0
        },
        {
          "reviewer": {
            "userId": 1004,
            "userName": "赵六"
          },
          "pendingCount": 8,
          "averageTime": "1.8天",
          "approvalRate": 90.0
        }
      ],
      "processingEfficiency": {
        "fastestReview": "0.5小时",
        "slowestReview": "2.5天",
        "medianReviewTime": "3.2小时",
        "queueUtilizationRate": 75.0
      }
    },
    "budgetImpact": { // 预算影响
      "totalBudget": 50000.00,
      "pendingRequestsAmount": 12580.50,
      "projectedUtilization": 87.2,
      "overBudgetRisk": {
        "categories": ["utilities"],
        "amount": 2560.50,
        "probability": 0.65
      },
      "recommendedActions": [
        {
          "action": "adjust_budget",
          "category": "utilities",
          "suggestedIncrease": 3000.00,
          "impact": "reduce_approval_delay"
        }
      ]
    },
    "recommendations": [ // 改进建议
      {
        "type": "process_optimization",
        "priority": "high",
        "title": "增加自动化审核",
        "description": "低风险费用可自动批准，减少人工审核工作量",
        "potentialSavings": "40%的审核时间"
      },
      {
        "type": "resource_allocation",
        "priority": "medium",
        "title": "平衡审核工作量",
        "description": "部分审核人工作量过重，建议重新分配",
        "potentialImpact": "提高25%的处理效率"
      }
    ]
  }
}
```

## 十三、预算管理模块

### 13.1 预算管理接口

#### 13.1.1 获取预算列表
- **接口地址：** GET /api/budgets
- **功能描述：** 获取用户预算列表，支持分页、搜索和分类筛选
- **请求参数：**
```json
{
  "page": 1, // [可选] 页码，数字类型，默认1
  "size": 20, // [可选] 每页数量，数字类型，默认20，最大100
  "search": "电费", // [可选] 搜索关键词，字符串类型
  "category": "utilities", // [可选] 预算类别筛选，字符串类型
  "status": "active", // [可选] 预算状态筛选，字符串类型，可选值：active/inactive/expired
  "period": "monthly", // [可选] 预算周期筛选，字符串类型，可选值：daily/weekly/monthly/quarterly/yearly
  "sortBy": "createdAt", // [可选] 排序字段，字符串类型，默认createdAt
  "sortOrder": "desc", // [可选] 排序方向，字符串类型，可选值：asc/desc，默认desc
  "includeExpired": false, // [可选] 是否包含已过期预算，布尔类型，默认false
  "amountRange": { // [可选] 金额范围筛选
    "min": 0,
    "max": 5000
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "budgets": [ // 预算列表
      {
        "id": "budget_20231201_001",
        "name": "2023年12月电费预算", // 预算名称
        "description": "宿舍12月份电费支出预算", // 预算描述
        "amount": 200.00, // 预算总金额
        "currency": "CNY", // 货币类型
        "category": "utilities", // 预算类别
        "subcategory": "electricity", // 子类别
        "period": "monthly", // 预算周期：daily/weekly/monthly/quarterly/yearly
        "startDate": "2023-12-01", // 开始日期
        "endDate": "2023-12-31", // 结束日期
        "status": "active", // 状态：active/inactive/expired
        "priority": "high", // 优先级：low/medium/high/critical
        "createdAt": "2023-11-25T10:00:00Z",
        "updatedAt": "2023-12-01T15:30:00Z",
        "spentAmount": 150.00, // 已使用金额
        "remainingAmount": 50.00, // 剩余金额
        "utilizationRate": 75.0, // 使用率(%)
        "expenses": [ // 相关支出
          {
            "id": "exp_20231201_001",
            "title": "2023年12月电费",
            "amount": 150.00,
            "status": "approved",
            "createdAt": "2023-12-01T09:45:00Z"
          }
        ],
        "alerts": [ // 预算提醒设置
          {
            "threshold": 80.0, // 提醒阈值(%)
            "enabled": true,
            "type": "warning"
          },
          {
            "threshold": 95.0,
            "enabled": true,
            "type": "critical"
          }
        ],
        "metadata": { // 元数据
          "autoRenewal": false,
          "owner": {
            "userId": 1001,
            "userName": "张三"
          },
          "tags": ["电费", "12月", "冬季"],
          "color": "#FF6B6B"
        }
      },
      {
        "id": "budget_20231201_002",
        "name": "维修工具采购预算",
        "description": "宿舍维修工具采购预算",
        "amount": 300.00,
        "currency": "CNY",
        "category": "maintenance",
        "subcategory": "tools",
        "period": "monthly",
        "startDate": "2023-12-01",
        "endDate": "2023-12-31",
        "status": "active",
        "priority": "medium",
        "createdAt": "2023-11-25T11:00:00Z",
        "updatedAt": "2023-12-01T16:00:00Z",
        "spentAmount": 85.50,
        "remainingAmount": 214.50,
        "utilizationRate": 28.5,
        "expenses": [
          {
            "id": "exp_20231201_002",
            "title": "维修工具采购",
            "amount": 85.50,
            "status": "pending",
            "createdAt": "2023-12-01T11:30:00Z"
          }
        ],
        "alerts": [
          {
            "threshold": 70.0,
            "enabled": true,
            "type": "warning"
          }
        ],
        "metadata": {
          "autoRenewal": true,
          "owner": {
            "userId": 1001,
            "userName": "张三"
          },
          "tags": ["维修", "工具", "采购"],
          "color": "#4ECDC4"
        }
      }
    ],
    "pagination": { // 分页信息
      "currentPage": 1,
      "totalPages": 2,
      "totalCount": 35,
      "pageSize": 20,
      "hasNext": true,
      "hasPrev": false
    },
    "statistics": { // 统计信息
      "totalBudgets": 35, // 总预算数
      "totalAmount": 25000.00, // 总预算金额
      "totalSpent": 15680.50, // 总已使用金额
      "totalRemaining": 9319.50, // 总剩余金额
      "averageUtilization": 62.7, // 平均使用率(%)
      "activeBudgets": 28, // 活跃预算数
      "expiredBudgets": 5, // 过期预算数
      "overBudgetCount": 3, // 超预算数
      "byCategory": { // 按类别统计
        "utilities": {
          "count": 15,
          "totalAmount": 8500.00,
          "totalSpent": 6120.50
        },
        "maintenance": {
          "count": 12,
          "totalAmount": 7200.00,
          "totalSpent": 4280.00
        },
        "supplies": {
          "count": 8,
          "totalAmount": 4800.00,
          "totalSpent": 3280.00
        }
      },
      "byStatus": { // 按状态统计
        "active": 28,
        "inactive": 2,
        "expired": 5
      }
    },
    "filters": { // 当前筛选条件
      "status": "active",
      "category": "utilities"
    }
  }
}
```

#### 13.1.2 创建预算
- **接口地址：** POST /api/budgets
- **功能描述：** 创建新的预算项目
- **请求参数：**
```json
{
  "name": "2024年1月电费预算", // [必填] 预算名称，字符串类型
  "amount": 250.00, // [必填] 预算金额，数字类型
  "currency": "CNY", // [可选] 货币类型，字符串类型，默认CNY
  "category": "utilities", // [必填] 预算类别，字符串类型
  "subcategory": "electricity", // [可选] 子类别，字符串类型
  "period": "monthly", // [必填] 预算周期，字符串类型，可选值：daily/weekly/monthly/quarterly/yearly
  "startDate": "2024-01-01", // [必填] 开始日期，字符串类型，ISO日期格式
  "endDate": "2024-01-31", // [必填] 结束日期，字符串类型，ISO日期格式
  "description": "2024年1月份电费支出预算", // [可选] 预算描述，字符串类型
  "priority": "high", // [可选] 优先级，字符串类型，可选值：low/medium/high/critical，默认medium
  "color": "#FF6B6B", // [可选] 预算颜色，字符串类型，默认随机
  "tags": ["电费", "2024年", "冬季"], // [可选] 标签，数组类型
  "autoRenewal": false, // [可选] 自动续期，布尔类型，默认false
  "alerts": [ // [可选] 预算提醒设置，数组类型
    {
      "threshold": 80.0, // 提醒阈值(%)
      "enabled": true,
      "type": "warning"
    },
    {
      "threshold": 95.0,
      "enabled": true,
      "type": "critical"
    }
  ],
  "metadata": { // [可选] 元数据，对象类型
    "department": "计算机科学学院",
    "project": "宿舍管理系统"
  }
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "预算创建成功",
    "budget": {
      "id": "budget_20240101_001",
      "name": "2024年1月电费预算",
      "description": "2024年1月份电费支出预算",
      "amount": 250.00,
      "currency": "CNY",
      "category": "utilities",
      "subcategory": "electricity",
      "period": "monthly",
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "status": "active",
      "priority": "high",
      "color": "#FF6B6B",
      "tags": ["电费", "2024年", "冬季"],
      "autoRenewal": false,
      "alerts": [
        {
          "threshold": 80.0,
          "enabled": true,
          "type": "warning"
        },
        {
          "threshold": 95.0,
          "enabled": true,
          "type": "critical"
        }
      ],
      "metadata": {
        "department": "计算机科学学院",
        "project": "宿舍管理系统"
      },
      "spentAmount": 0.00,
      "remainingAmount": 250.00,
      "utilizationRate": 0.0,
      "createdAt": "2024-01-01T09:00:00Z",
      "updatedAt": "2024-01-01T09:00:00Z",
      "creator": {
        "userId": 1001,
        "userName": "张三"
      },
      "approvalStatus": "approved",
      "approvalHistory": [
        {
          "action": "created",
          "user": {
            "userId": 1001,
            "userName": "张三"
          },
          "timestamp": "2024-01-01T09:00:00Z",
          "comment": "创建预算"
        }
      ]
    },
    "validation": {
      "isValid": true,
      "warnings": [],
      "recommendations": [
        "建议设置自动续期以避免预算过期",
        "考虑设置更详细的子类别分类"
      ]
    }
  }
}
```

#### 13.1.3 获取预算详情
- **接口地址：** GET /api/budgets/{id}
- **功能描述：** 获取指定预算的详细信息
- **路径参数：**
```json
{
  "id": "budget_20231201_001" // [必填] 预算ID，字符串类型
}
```
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "budget": { // 预算详细信息
      "id": "budget_20231201_001",
      "name": "2023年12月电费预算",
      "description": "宿舍12月份电费支出预算",
      "amount": 200.00,
      "currency": "CNY",
      "category": "utilities",
      "subcategory": "electricity",
      "period": "monthly",
      "startDate": "2023-12-01",
      "endDate": "2023-12-31",
      "status": "active",
      "priority": "high",
      "color": "#FF6B6B",
      "tags": ["电费", "12月", "冬季"],
      "autoRenewal": false,
      "createdAt": "2023-11-25T10:00:00Z",
      "updatedAt": "2023-12-01T15:30:00Z",
      "creator": {
        "userId": 1001,
        "userName": "张三",
        "email": "zhangsan@example.com",
        "role": "member",
        "department": "计算机科学学院"
      },
      "financial": { // 财务信息
        "spentAmount": 150.00, // 已使用金额
        "remainingAmount": 50.00, // 剩余金额
        "reservedAmount": 0.00, // 预留金额
        "committedAmount": 0.00, // 承诺金额
        "utilizationRate": 75.0, // 使用率(%)
        "variance": {
          "absolute": -50.00, // 绝对差异
          "percentage": -25.0 // 百分比差异
        },
        "projected": {
          "estimatedEndDateSpend": 180.00, // 预计到期支出
          "confidence": 0.85, // 预估置信度
          "risk": "low" // 风险等级：low/medium/high
        }
      },
      "alerts": [ // 预算提醒设置
        {
          "id": "alert_001",
          "threshold": 80.0,
          "enabled": true,
          "type": "warning",
          "triggered": false,
          "lastTriggeredAt": null
        },
        {
          "id": "alert_002",
          "threshold": 95.0,
          "enabled": true,
          "type": "critical",
          "triggered": false,
          "lastTriggeredAt": null
        }
      ],
      "expenses": [ // 相关支出
        {
          "id": "exp_20231201_001",
          "title": "2023年12月电费",
          "description": "宿舍12月份电费支出",
          "amount": 150.00,
          "currency": "CNY",
          "status": "approved",
          "category": "utilities",
          "subcategory": "electricity",
          "priority": "high",
          "merchant": "国家电网",
          "paymentMethod": "alipay",
          "receiptUrl": "https://picsum.photos/300/200?random=1",
          "createdAt": "2023-12-01T09:45:00Z",
          "approvedAt": "2023-12-01T10:30:00Z",
          "approvedBy": {
            "userId": 1002,
            "userName": "李四"
          },
          "reviewerComment": "电费支出合理，批准",
          "compliance": {
            "policyCompliant": true,
            "documentationComplete": true,
            "budgetCompliant": false
          }
        }
      ],
      "historicalData": [ // 历史数据
        {
          "period": "2023-11",
          "budgetAmount": 180.00,
          "spentAmount": 165.50,
          "utilizationRate": 91.9,
          "variance": {
            "absolute": -14.50,
            "percentage": -8.1
          }
        },
        {
          "period": "2023-10",
          "budgetAmount": 160.00,
          "spentAmount": 145.75,
          "utilizationRate": 91.1,
          "variance": {
            "absolute": -14.25,
            "percentage": -8.9
          }
        }
      ],
      "analytics": { // 分析数据
        "spendingTrend": {
          "direction": "increasing",
          "rate": 15.2, // 月环比增长(%)
          "volatility": "low"
        },
        "categoryComparison": {
          "vsOthers": {
            "aboveAverage": true,
            "percentileRank": 75.0
          }
        },
        "efficiency": {
          "budgetAccuracy": 85.0, // 预算准确性(%)
          "costControlEffectiveness": 90.0 // 成本控制效果(%)
        }
      },
      "notifications": { // 通知设置
        "email": true,
        "inApp": true,
        "sms": false,
        "frequency": "daily"
      },
      "approvals": { // 审批信息
        "status": "approved",
        "approvers": [
          {
            "userId": 1002,
            "userName": "李四",
            "role": "admin",
            "status": "approved",
            "timestamp": "2023-11-25T11:00:00Z",
            "comment": "预算设置合理，批准"
          }
        ],
        "requiredApprovals": 1,
        "completedApprovals": 1
      },
      "metadata": {
        "department": "计算机科学学院",
        "project": "宿舍管理系统",
        "costCenter": "CC001",
        "approvalWorkflow": "standard"
      }
    },
    "userPermissions": { // 当前用户权限
      "canView": true,
      "canEdit": true,
      "canDelete": true,
      "canExport": true,
      "canCreateExpense": true,
      "canManageAlerts": true,
      "canShare": false
    },
    "relatedBudgets": [ // 相关预算
      {
        "id": "budget_20231201_002",
        "name": "维修工具采购预算",
        "relationship": "sibling",
        "similarity": 0.3
      }
    ]
  }
}
```

#### 13.1.4 更新预算
- **接口地址：** PUT /api/budgets/{id}
- **功能描述：** 更新指定预算的信息
- **路径参数：**
```json
{
  "id": "budget_20231201_001" // [必填] 预算ID，字符串类型
}
```
- **请求参数：**
```json
{
  "name": "2023年12月电费预算（已调整）", // [可选] 预算名称，字符串类型
  "amount": 250.00, // [可选] 预算金额，数字类型
  "description": "宿舍12月份电费支出预算（已调整）", // [可选] 预算描述，字符串类型
  "priority": "critical", // [可选] 优先级，字符串类型
  "color": "#FF8A80", // [可选] 预算颜色，字符串类型
  "tags": ["电费", "12月", "冬季", "已调整"], // [可选] 标签，数组类型
  "autoRenewal": true, // [可选] 自动续期，布尔类型
  "alerts": [ // [可选] 预算提醒设置，数组类型
    {
      "id": "alert_001",
      "threshold": 70.0,
      "enabled": true,
      "type": "warning"
    },
    {
      "threshold": 90.0,
      "enabled": true,
      "type": "critical"
    }
  ],
  "endDate": "2023-12-31", // [可选] 结束日期，字符串类型
  "metadata": { // [可选] 元数据，对象类型
    "department": "计算机科学学院",
    "project": "宿舍管理系统",
    "lastAdjustmentReason": "冬季用电增加"
  },
  "adjustmentReason": "冬季用电增加，需要调整预算", // [必填] 调整原因，字符串类型
  "notifyStakeholders": true // [可选] 是否通知相关人员，布尔类型，默认true
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "预算更新成功",
    "budget": {
      "id": "budget_20231201_001",
      "name": "2023年12月电费预算（已调整）",
      "description": "宿舍12月份电费支出预算（已调整）",
      "amount": 250.00,
      "currency": "CNY",
      "category": "utilities",
      "subcategory": "electricity",
      "period": "monthly",
      "startDate": "2023-12-01",
      "endDate": "2023-12-31",
      "status": "active",
      "priority": "critical",
      "color": "#FF8A80",
      "tags": ["电费", "12月", "冬季", "已调整"],
      "autoRenewal": true,
      "alerts": [
        {
          "id": "alert_001",
          "threshold": 70.0,
          "enabled": true,
          "type": "warning"
        },
        {
          "threshold": 90.0,
          "enabled": true,
          "type": "critical"
        }
      ],
      "metadata": {
        "department": "计算机科学学院",
        "project": "宿舍管理系统",
        "lastAdjustmentReason": "冬季用电增加"
      },
      "spentAmount": 150.00,
      "remainingAmount": 100.00,
      "utilizationRate": 60.0,
      "createdAt": "2023-11-25T10:00:00Z",
      "updatedAt": "2023-12-01T16:00:00Z",
      "adjustmentHistory": [ // 调整历史
        {
          "id": "adjust_001",
          "field": "amount",
          "oldValue": 200.00,
          "newValue": 250.00,
          "reason": "冬季用电增加，需要调整预算",
          "timestamp": "2023-12-01T16:00:00Z",
          "adjustedBy": {
            "userId": 1001,
            "userName": "张三"
          }
        },
        {
          "field": "priority",
          "oldValue": "high",
          "newValue": "critical",
          "reason": "预算增加，优先级提升",
          "timestamp": "2023-12-01T16:00:00Z",
          "adjustedBy": {
            "userId": 1001,
            "userName": "张三"
          }
        }
      ]
    },
    "notificationsSent": [ // 发送的通知
      {
        "type": "in_app",
        "recipient": {
          "userId": 1002,
          "userName": "李四"
        },
        "message": "预算'2023年12月电费预算'已调整，金额从200.00增加到250.00",
        "sentAt": "2023-12-01T16:00:05Z"
      }
    ],
    "impact": { // 更新影响分析
      "financialImpact": {
        "totalBudgetIncrease": 50.00,
        "utilizationChange": {
          "before": 75.0,
          "after": 60.0,
          "change": -15.0
        },
        "approvalRequired": false,
        "reallocationNeeded": false
      },
      "alertsImpact": {
        "alertsTriggered": 0,
        "alertsToBeTriggered": [
          {
            "alertId": "alert_001",
            "threshold": 70.0,
            "currentUtilization": 60.0,
            "daysToTrigger": 3
          }
        ]
      },
      "relatedExpenses": {
        "affectedExpenses": 1,
        "needsReapproval": 0,
        "complianceStatus": "updated"
      }
    }
  }
}
```

#### 13.1.5 删除预算
- **接口地址：** DELETE /api/budgets/{id}
- **功能描述：** 删除指定的预算项目
- **路径参数：**
```json
{
  "id": "budget_20231201_001" // [必填] 预算ID，字符串类型
}
```
- **请求参数：** 无
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "预算删除成功",
    "deletedBudget": {
      "id": "budget_20231201_001",
      "name": "2023年12月电费预算",
      "amount": 200.00,
      "status": "deleted",
      "deletedAt": "2023-12-01T17:00:00Z",
      "deletedBy": {
        "userId": 1001,
        "userName": "张三"
      },
      "deletionReason": "预算周期结束"
    },
    "impact": { // 删除影响分析
      "relatedExpenses": {
        "count": 1,
        "status": "unlinked", // 未关联预算的费用
        "action": "费用将不再与预算关联"
      },
      "alerts": {
        "count": 2,
        "status": "cancelled",
        "message": "所有相关提醒已取消"
      },
      "notifications": {
        "count": 1,
        "sent": true,
        "message": "已通知相关人员"
      },
      "financial": {
        "totalBudgetAffected": 200.00,
        "spentAmount": 150.00,
        "unspentAmount": 50.00,
        "refundRequired": false
      }
    },
    "relatedData": { // 相关数据处理
      "expenses": [
        {
          "id": "exp_20231201_001",
          "title": "2023年12月电费",
          "action": "removed_budget_link",
          "newStatus": "unbudgeted"
        }
      ],
      "alerts": [
        {
          "id": "alert_001",
          "status": "cancelled"
        },
        {
          "id": "alert_002",
          "status": "cancelled"
        }
      ]
    },
    "recovery": { // 恢复选项
      "canRecover": true,
      "recoveryPeriod": "30天",
      "recoverEndpoint": "/api/budgets/recover/{id}",
      "recoverInstructions": "如需恢复此预算，请在30天内调用恢复接口"
    }
  }
}
```

### 13.2 预算监控接口

#### 13.2.1 获取预算概览
- **接口地址：** GET /api/budgets/overview
- **功能描述：** 获取预算总体概览信息
- **请求参数：**
```json
{
  "period": "current_month", // [可选] 时间周期，字符串类型，可选值：current_month/current_quarter/current_year/all_time，默认current_month
  "includeExpired": false, // [可选] 是否包含已过期预算，布尔类型，默认false
  "category": "all", // [可选] 类别筛选，字符串类型，默认all
  "currency": "CNY", // [可选] 货币类型，字符串类型，默认CNY
  "groupBy": "category" // [可选] 分组方式，字符串类型，可选值：category/period/status，默认category
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "overview": { // 总体概览
      "totalBudgets": 28, // 总预算数
      "totalBudgetAmount": 18500.00, // 总预算金额
      "totalSpentAmount": 11680.50, // 总已使用金额
      "totalRemainingAmount": 6819.50, // 总剩余金额
      "averageUtilizationRate": 63.1, // 平均使用率(%)
      "budgetHealthScore": 78.5, // 预算健康评分(0-100)
      "criticalBudgets": 3, // 关键预算数
      "overBudgetCount": 2, // 超预算数
      "expiringSoonCount": 5, // 即将过期预算数
      "lastUpdated": "2023-12-01T18:00:00Z"
    },
    "breakdown": { // 详细分解
      "byCategory": { // 按类别分解
        "utilities": {
          "budgetCount": 12,
          "totalBudget": 8500.00,
          "totalSpent": 6120.50,
          "totalRemaining": 2379.50,
          "utilizationRate": 72.0,
          "healthScore": 75.0,
          "status": "warning"
        },
        "maintenance": {
          "budgetCount": 8,
          "totalBudget": 5600.00,
          "totalSpent": 3180.00,
          "totalRemaining": 2420.00,
          "utilizationRate": 56.8,
          "healthScore": 82.0,
          "status": "good"
        },
        "supplies": {
          "budgetCount": 8,
          "totalBudget": 4400.00,
          "totalSpent": 2380.00,
          "totalRemaining": 2020.00,
          "utilizationRate": 54.1,
          "healthScore": 85.0,
          "status": "good"
        }
      },
      "byStatus": { // 按状态分解
        "active": {
          "count": 25,
          "totalBudget": 16200.00,
          "totalSpent": 9980.50,
          "utilizationRate": 61.6
        },
        "inactive": {
          "count": 2,
          "totalBudget": 800.00,
          "totalSpent": 200.00,
          "utilizationRate": 25.0
        },
        "expired": {
          "count": 1,
          "totalBudget": 1500.00,
          "totalSpent": 1500.00,
          "utilizationRate": 100.0
        }
      },
      "byPriority": { // 按优先级分解
        "critical": {
          "count": 3,
          "totalBudget": 4500.00,
          "totalSpent": 3980.50,
          "utilizationRate": 88.5,
          "status": "critical"
        },
        "high": {
          "count": 8,
          "totalBudget": 6800.00,
          "totalSpent": 4320.00,
          "utilizationRate": 63.5,
          "status": "warning"
        },
        "medium": {
          "count": 12,
          "totalBudget": 5200.00,
          "totalSpent": 2580.00,
          "utilizationRate": 49.6,
          "status": "good"
        },
        "low": {
          "count": 5,
          "totalBudget": 2000.00,
          "totalSpent": 800.00,
          "utilizationRate": 40.0,
          "status": "good"
        }
      }
    },
    "trends": { // 趋势分析
      "spendingVelocity": { // 支出速度
        "current": 387.68, // 当前日均支出
        "projected": 350.00, // 预计日均支出
        "vsBudget": -37.68, // 与预算对比
        "trend": "decreasing" // 趋势：increasing/decreasing/stable
      },
      "utilizationTrend": { // 使用率趋势
        "direction": "increasing",
        "rate": 2.3, // 月环比增长率(%)
        "volatility": "low"
      },
      "budgetAccuracy": { // 预算准确性
        "historicalAccuracy": 82.5,
        "predictionConfidence": 0.78,
        "accuracyTrend": "improving"
      }
    },
    "alerts": [ // 重要提醒
      {
        "type": "critical",
        "category": "utilities",
        "message": "电费预算使用率已达95%",
        "budgetId": "budget_20231201_001",
        "severity": "high",
        "actionRequired": true,
        "suggestedActions": [
          "增加预算金额",
          "控制后续支出",
          "审核当前费用"
        ]
      },
      {
        "type": "warning",
        "category": "maintenance",
        "message": "维护预算即将在7天内过期",
        "budgetId": "budget_20231201_002",
        "severity": "medium",
        "actionRequired": false,
        "suggestedActions": [
          "考虑续期预算",
          "检查未使用金额"
        ]
      }
    ],
    "recommendations": [ // 优化建议
      {
        "type": "budget_optimization",
        "priority": "high",
        "title": "优化电费预算分配",
        "description": "电费预算使用率过高，建议调整后续月份预算分配",
        "impact": "potential_savings",
        "potentialSavings": 500.00
      },
      {
        "type": "cost_control",
        "priority": "medium",
        "title": "加强支出监控",
        "description": "部分预算类别支出增长较快，建议加强监控",
        "impact": "cost_reduction",
        "estimatedImpact": 300.00
      }
    ]
  }
}
```

#### 13.2.2 获取预算执行进度
- **接口地址：** GET /api/budgets/progress
- **功能描述：** 获取预算执行进度详细数据
- **请求参数：**
```json
{
  "budgetIds": ["budget_20231201_001", "budget_20231201_002"], // [可选] 指定预算ID列表，数组类型
  "period": "current_month", // [可选] 时间周期，字符串类型，默认current_month
  "granularity": "daily", // [可选] 粒度，字符串类型，可选值：daily/weekly/monthly，默认daily
  "includeProjections": true, // [可选] 是否包含预测，布尔类型，默认true
  "includeHistory": true // [可选] 是否包含历史数据，布尔类型，默认true
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "progress": [ // 进度数据
      {
        "budgetId": "budget_20231201_001",
        "budgetName": "2023年12月电费预算",
        "category": "utilities",
        "period": "2023-12",
        "timeline": [ // 时间轴数据
          {
            "date": "2023-12-01",
            "budgetAmount": 6.45, // 当日预算(200/31)
            "actualSpend": 0.00, // 实际支出
            "cumulativeBudget": 6.45, // 累计预算
            "cumulativeSpend": 0.00, // 累计支出
            "variance": {
              "absolute": -6.45,
              "percentage": -100.0
            },
            "utilizationRate": 0.0
          },
          {
            "date": "2023-12-02",
            "budgetAmount": 6.45,
            "actualSpend": 0.00,
            "cumulativeBudget": 12.90,
            "cumulativeSpend": 0.00,
            "variance": {
              "absolute": -12.90,
              "percentage": -100.0
            },
            "utilizationRate": 0.0
          },
          {
            "date": "2023-12-03",
            "budgetAmount": 6.45,
            "actualSpend": 150.00,
            "cumulativeBudget": 19.35,
            "cumulativeSpend": 150.00,
            "variance": {
              "absolute": 130.65,
              "percentage": 675.2
            },
            "utilizationRate": 775.2
          }
        ],
        "milestones": [ // 里程碑
          {
            "date": "2023-12-01",
            "type": "budget_start",
            "description": "预算开始执行",
            "status": "completed"
          },
          {
            "date": "2023-12-10",
            "type": "threshold_50",
            "description": "预计达到50%使用率",
            "status": "projected",
            "confidence": 0.85
          },
          {
            "date": "2023-12-20",
            "type": "threshold_80",
            "description": "预计达到80%使用率",
            "status": "projected",
            "confidence": 0.75
          },
          {
            "date": "2023-12-31",
            "type": "budget_end",
            "description": "预算周期结束",
            "status": "scheduled",
            "confidence": 0.95
          }
        ],
        "currentStatus": {
          "progressPercentage": 3.0, // 当前进度(%)
          "timeElapsed": 3.0, // 已过时间(%)
          "budgetUtilized": 75.0, // 预算使用率(%)
          "onTrack": false, // 是否按计划进行
          "aheadBehind": "behind", // ahead/behind/on_track
          "daysRemaining": 28,
          "remainingBudget": 50.00,
          "recommendedDailySpend": 1.79 // 建议每日支出
        },
        "projections": { // 预测数据
          "endOfPeriodSpend": 185.50,
          "confidence": 0.78,
          "variance": {
            "absolute": -14.50,
            "percentage": -7.3
          },
          "riskFactors": [
            {
              "factor": "seasonal_increase",
              "impact": "medium",
              "probability": 0.65
            },
            {
              "factor": "equipment_maintenance",
              "impact": "low",
              "probability": 0.30
            }
          ]
        }
      },
      {
        "budgetId": "budget_20231201_002",
        "budgetName": "维修工具采购预算",
        "category": "maintenance",
        "period": "2023-12",
        "timeline": [
          {
            "date": "2023-12-01",
            "budgetAmount": 9.68,
            "actualSpend": 0.00,
            "cumulativeBudget": 9.68,
            "cumulativeSpend": 0.00,
            "variance": {
              "absolute": -9.68,
              "percentage": -100.0
            },
            "utilizationRate": 0.0
          },
          {
            "date": "2023-12-03",
            "budgetAmount": 9.68,
            "actualSpend": 85.50,
            "cumulativeBudget": 29.04,
            "cumulativeSpend": 85.50,
            "variance": {
              "absolute": 56.46,
              "percentage": 194.5
            },
            "utilizationRate": 294.5
          }
        ],
        "milestones": [
          {
            "date": "2023-12-01",
            "type": "budget_start",
            "description": "预算开始执行",
            "status": "completed"
          }
        ],
        "currentStatus": {
          "progressPercentage": 3.0,
          "timeElapsed": 3.0,
          "budgetUtilized": 28.5,
          "onTrack": true,
          "aheadBehind": "on_track",
          "daysRemaining": 28,
          "remainingBudget": 214.50,
          "recommendedDailySpend": 7.66
        },
        "projections": {
          "endOfPeriodSpend": 95.50,
          "confidence": 0.92,
          "variance": {
            "absolute": -204.50,
            "percentage": -68.2
          },
          "riskFactors": []
        }
      }
    ],
    "comparative": { // 对比分析
      "periodComparison": {
        "vsLastMonth": {
          "totalSpend": {
            "current": 150.00,
            "previous": 120.50,
            "change": 29.50,
            "changePercentage": 24.5
          },
          "utilizationRate": {
            "current": 75.0,
            "previous": 66.9,
            "change": 8.1
          }
        },
        "vsSamePeriodLastYear": {
          "totalSpend": {
            "current": 150.00,
            "previous": 135.25,
            "change": 14.75,
            "changePercentage": 10.9
          }
        }
      },
      "categoryComparison": {
        "utilities": {
          "vsAverage": {
            "utilizationRate": {
              "category": 75.0,
              "average": 62.3,
              "difference": 12.7
            }
          }
        }
      }
    },
    "alerts": [ // 进度相关提醒
      {
        "budgetId": "budget_20231201_001",
        "type": "spending_spike",
        "severity": "high",
        "message": "电费预算在预算周期开始时就出现大额支出",
        "date": "2023-12-03",
        "recommendedAction": "审查支出合理性"
      }
    ]
  }
}
```

#### 13.2.3 获取超支预警
- **接口地址：** GET /api/budgets/warnings
- **功能描述：** 获取预算超支预警信息
- **请求参数：**
```json
{
  "severity": "all", // [可选] 严重程度筛选，字符串类型，可选值：low/medium/high/critical/all，默认all
  "category": "all", // [可选] 类别筛选，字符串类型，默认all
  "status": "active", // [可选] 状态筛选，字符串类型，可选值：active/resolved/dismissed/all，默认active
  "includeResolved": false, // [可选] 是否包含已解决预警，布尔类型，默认false
  "timeRange": "current_month" // [可选] 时间范围，字符串类型，默认current_month
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "warnings": [ // 预警列表
      {
        "id": "warning_20231203_001",
        "budgetId": "budget_20231201_001",
        "budgetName": "2023年12月电费预算",
        "category": "utilities",
        "severity": "critical", // 严重程度：low/medium/high/critical
        "type": "over_budget", // 预警类型：over_budget/threshold_exceeded/budget_exhausted/ unusual_spending
        "title": "预算超支预警",
        "message": "电费预算使用率已达到95%，超出安全阈值",
        "status": "active", // 状态：active/resolved/dismissed
        "triggeredAt": "2023-12-03T10:30:00Z",
        "resolvedAt": null,
        "budgetDetails": {
          "totalBudget": 200.00,
          "currentSpend": 190.00,
          "remainingBudget": 10.00,
          "utilizationRate": 95.0,
          "threshold": 80.0
        },
        "impact": {
          "amountOver": 0.00, // 超支金额
          "percentageOver": 15.0, // 超支百分比
          "daysToExhaust": 2, // 预计多少天耗尽预算
          "financialRisk": "high"
        },
        "recommendations": [ // 建议措施
          {
            "action": "increase_budget",
            "description": "增加预算金额",
            "urgency": "high",
            "estimatedCost": 100.00,
            "impact": "prevent_budget_exhaustion"
          },
          {
            "action": "control_spending",
            "description": "严格控制后续支出",
            "urgency": "medium",
            "estimatedCost": 0.00,
            "impact": "extend_budget_lifecycle"
          }
        ],
        "relatedExpenses": [ // 相关支出
          {
            "id": "exp_20231201_001",
            "title": "2023年12月电费",
            "amount": 150.00,
            "status": "approved",
            "contributionToWarning": 75.0, // 对预警的贡献率(%)
            "approvalDate": "2023-12-01T10:30:00Z"
          },
          {
            "id": "exp_20231203_001",
            "title": "电费充值",
            "amount": 40.00,
            "status": "pending",
            "contributionToWarning": 20.0,
            "approvalDate": null
          }
        ],
        "escalation": {
          "autoEscalation": true,
          "escalatedTo": {
            "userId": 1002,
            "userName": "李四",
            "role": "admin"
          },
          "escalationLevel": 1,
          "escalationThreshold": 90.0
        },
        "notificationHistory": [ // 通知历史
          {
            "type": "email",
            "recipient": {
              "userId": 1001,
              "userName": "张三"
            },
            "sentAt": "2023-12-03T10:30:05Z",
            "status": "delivered"
          },
          {
            "type": "in_app",
            "recipient": {
              "userId": 1001,
              "userName": "张三"
            },
            "sentAt": "2023-12-03T10:30:03Z",
            "status": "delivered"
          }
        ]
      },
      {
        "id": "warning_20231203_002",
        "budgetId": "budget_20231201_003",
        "budgetName": "办公用品采购预算",
        "category": "supplies",
        "severity": "medium",
        "type": "threshold_exceeded",
        "title": "使用率预警",
        "message": "办公用品预算使用率已达到70%预警线",
        "status": "active",
        "triggeredAt": "2023-12-03T14:20:00Z",
        "resolvedAt": null,
        "budgetDetails": {
          "totalBudget": 500.00,
          "currentSpend": 350.00,
          "remainingBudget": 150.00,
          "utilizationRate": 70.0,
          "threshold": 70.0
        },
        "impact": {
          "amountOver": 0.00,
          "percentageOver": 0.0,
          "daysToExhaust": 15,
          "financialRisk": "medium"
        },
        "recommendations": [
          {
            "action": "monitor_spending",
            "description": "密切监控后续支出",
            "urgency": "low",
            "estimatedCost": 0.00,
            "impact": "prevent_over_budget"
          }
        ],
        "relatedExpenses": [],
        "escalation": {
          "autoEscalation": false,
          "escalatedTo": null,
          "escalationLevel": 0,
          "escalationThreshold": 85.0
        },
        "notificationHistory": []
      }
    ],
    "summary": { // 预警摘要
      "totalWarnings": 12,
      "bySeverity": {
        "critical": 2,
        "high": 4,
        "medium": 4,
        "low": 2
      },
      "byType": {
        "over_budget": 3,
        "threshold_exceeded": 6,
        "budget_exhausted": 1,
        "unusual_spending": 2
      },
      "byCategory": {
        "utilities": 5,
        "maintenance": 4,
        "supplies": 3
      },
      "statusDistribution": {
        "active": 8,
        "resolved": 3,
        "dismissed": 1
      },
      "financialImpact": {
        "totalAtRisk": 2850.00, // 面临风险的预算总额
        "overBudgetAmount": 450.00, // 超支金额
        "potentialSavings": 1200.00 // 潜在节约金额
      }
    },
    "trends": { // 预警趋势
      "dailyWarnings": [ // 每日预警数
        {
          "date": "2023-12-01",
          "new": 0,
          "resolved": 0,
          "active": 0
        },
        {
          "date": "2023-12-02",
          "new": 1,
          "resolved": 0,
          "active": 1
        },
        {
          "date": "2023-12-03",
          "new": 2,
          "resolved": 0,
          "active": 3
        }
      ],
      "severityTrend": "increasing",
      "resolutionRate": 75.0, // 解决率(%)
      "averageResolutionTime": "1.5天"
    },
    "recommendations": [ // 总体建议
      {
        "priority": "high",
        "category": "process_improvement",
        "title": "加强预警系统",
        "description": "建议增加更多预警阈值设置，减少超支风险",
        "estimatedImpact": "reduce_warnings_by_30%"
      },
      {
        "priority": "medium",
        "category": "budget_planning",
        "title": "优化预算分配",
        "description": "基于历史数据优化预算分配比例",
        "estimatedImpact": "improve_budget_accuracy_by_15%"
      }
    ]
  }
}
```

#### 13.2.4 获取预算建议
- **接口地址：** GET /api/budgets/advice
- **功能描述：** 获取基于数据分析的预算优化建议
- **请求参数：**
```json
{
  "category": "all", // [可选] 类别筛选，字符串类型，默认all
  "priority": "all", // [可选] 优先级筛选，字符串类型，可选值：low/medium/high/critical/all，默认all
  "type": "all", // [可选] 建议类型，字符串类型，可选值：optimization/cost_control/reallocation/new_budget/all，默认all
  "timeRange": "current_month", // [可选] 时间范围，字符串类型，默认current_month
  "includeProjections": true // [可选] 是否包含预测数据，布尔类型，默认true
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "advice": [ // 建议列表
      {
        "id": "advice_20231203_001",
        "type": "optimization", // 建议类型：optimization/cost_control/reallocation/new_budget
        "category": "utilities",
        "priority": "high", // 优先级：low/medium/high/critical
        "title": "优化电费预算分配",
        "description": "基于历史数据，电费预算使用率较高，建议调整预算分配策略",
        "currentSituation": {
          "budgetAmount": 200.00,
          "actualSpend": 190.00,
          "utilizationRate": 95.0,
          "trend": "increasing",
          "historicalAverage": 75.0
        },
        "recommendation": {
          "action": "increase_budget",
          "suggestedAmount": 250.00,
          "rationale": "冬季用电量增加，历史数据显示12月份电费平均比11月份高25%",
          "confidence": 0.85,
          "expectedOutcome": {
            "newUtilizationRate": 76.0,
            "riskReduction": "high",
            "costImpact": 50.00
          }
        },
        "alternatives": [ // 替代方案
          {
            "action": "implement_saving_measures",
            "description": "实施节能措施，减少用电量",
            "estimatedSavings": 30.00,
            "implementationEffort": "medium"
          },
          {
            "action": "delay_non_essential_expenses",
            "description": "延迟非必要支出",
            "estimatedSavings": 40.00,
            "implementationEffort": "low"
          }
        ],
        "implementation": { // 实施建议
          "steps": [
            "分析历史用电数据",
            "评估节能措施可行性",
            "制定预算调整方案",
            "提交预算修改申请"
          ],
          "timeline": "1-2周",
          "resources": ["数据分析工具", "节能设备评估"],
          "stakeholders": ["财务部门", "宿舍管理员"]
        },
        "impact": {
          "financial": {
            "cost": 50.00,
            "savings": 0.00,
            "roi": -1.0, // 投资回报率
            "paybackPeriod": "immediate"
          },
          "operational": {
            "riskReduction": "high",
            "processImprovement": "medium",
            "complianceImpact": "positive"
          }
        },
        "supportingData": { // 支持数据
          "historicalTrends": {
            "last3Months": [180.00, 165.50, 190.00],
            "growthRate": 14.8,
            "volatility": "low"
          },
          "comparativeAnalysis": {
            "vsAverage": "above",
            "vsSimilarBudgets": "higher",
            "percentileRank": 85.0
          },
          "seasonalFactors": {
            "winterAdjustment": 1.25,
            "holidayImpact": 1.10,
            "weatherCorrelation": 0.78
          }
        },
        "risks": [ // 风险评估
          {
            "risk": "budget_overrun",
            "probability": 0.15,
            "impact": "medium",
            "mitigation": "加强支出监控"
          }
        ],
        "createdAt": "2023-12-03T15:00:00Z",
        "expiresAt": "2023-12-10T23:59:59Z",
        "status": "active"
      },
      {
        "id": "advice_20231203_002",
        "type": "cost_control",
        "category": "maintenance",
        "priority": "medium",
        "title": "维修费用成本控制",
        "description": "维修预算使用率较低，建议优化成本控制策略",
        "currentSituation": {
          "budgetAmount": 300.00,
          "actualSpend": 85.50,
          "utilizationRate": 28.5,
          "trend": "stable",
          "historicalAverage": 65.0
        },
        "recommendation": {
          "action": "optimize_spending",
          "suggestedActions": ["建立维修供应商网络", "制定预防性维护计划"],
          "rationale": "当前维修支出低于预期，可用于优化供应商质量和预防性维护",
          "confidence": 0.72,
          "expectedOutcome": {
            "costReduction": 15.0,
            "qualityImprovement": "high",
            "efficiencyGain": "medium"
          }
        },
        "implementation": {
          "steps": [
            "评估当前维修供应商",
            "建立供应商评估体系",
            "制定预防性维护计划",
            "实施成本控制措施"
          ],
          "timeline": "2-3周",
          "resources": ["供应商评估工具", "维护管理系统"],
          "stakeholders": ["维修部门", "采购部门"]
        },
        "impact": {
          "financial": {
            "cost": 0.00,
            "savings": 45.00,
            "roi": 999.0,
            "paybackPeriod": "immediate"
          },
          "operational": {
            "riskReduction": "low",
            "processImprovement": "high",
            "complianceImpact": "neutral"
          }
        },
        "supportingData": {
          "efficiencyMetrics": {
            "costPerMaintenance": 85.50,
            "averageResponseTime": "2天",
            "qualityScore": 7.5
          }
        },
        "risks": [],
        "createdAt": "2023-12-03T15:30:00Z",
        "expiresAt": "2023-12-17T23:59:59Z",
        "status": "active"
      }
    ],
    "summary": { // 建议摘要
      "totalAdvice": 8,
      "byType": {
        "optimization": 3,
        "cost_control": 2,
        "reallocation": 2,
        "new_budget": 1
      },
      "byPriority": {
        "critical": 1,
        "high": 3,
        "medium": 3,
        "low": 1
      },
      "byCategory": {
        "utilities": 3,
        "maintenance": 2,
        "supplies": 2,
        "other": 1
      },
      "financialImpact": {
        "potentialSavings": 850.00, // 潜在节约
        "additionalInvestment": 150.00, // 额外投资
        "netBenefit": 700.00, // 净收益
        "roi": 4.67 // 投资回报率
      }
    },
    "trends": { // 趋势分析
      "adviceEffectiveness": {
        "implementationRate": 68.5,
        "successRate": 85.2,
        "averageImpact": "positive"
      },
      "categoryInsights": {
        "utilities": {
          "commonIssues": ["季节性波动", "使用率偏高"],
          "improvementAreas": ["预算准确性", "节能措施"]
        },
        "maintenance": {
          "commonIssues": ["支出不稳定", "供应商管理"],
          "improvementAreas": ["预防性维护", "成本控制"]
        }
      }
    },
    "predictions": { // 预测数据
      "upcomingTrends": [
        {
          "category": "utilities",
          "trend": "increasing",
          "expectedChange": 15.2,
          "timeframe": "next_month",
          "confidence": 0.78
        }
      ],
      "riskAreas": [
        {
          "category": "utilities",
          "riskLevel": "high",
          "primaryFactor": "seasonal_increase",
          "recommendedAction": "提前调整预算"
        }
      ]
    },
    "bestPractices": [ // 最佳实践建议
      {
        "category": "general",
        "title": "预算制定最佳实践",
        "practices": [
          "基于历史数据制定预算",
          "设置多个预警阈值",
          "定期回顾和调整预算",
          "建立预算执行监控机制"
        ]
      },
      {
        "category": "utilities",
        "title": "水电费预算管理",
        "practices": [
          "考虑季节性因素",
          "监控使用量变化",
          "实施节能措施",
          "建立供应商评估体系"
        ]
      }
    ]
  }
}
```

### 13.3 预算导入导出接口

#### 13.3.1 导出预算数据
- **接口地址：** GET /api/budgets/export
- **功能描述：** 导出预算数据到Excel文件
- **请求参数：**
```json
{
  "format": "excel", // [可选] 导出格式，字符串类型，可选值：excel/csv/json，默认excel
  "period": "current_month", // [可选] 时间周期，字符串类型，默认current_month
  "category": "all", // [可选] 类别筛选，字符串类型，默认all
  "includeHistory": false, // [可选] 是否包含历史数据，布尔类型，默认false
  "includeProjections": true, // [可选] 是否包含预测数据，布尔类型，默认true
  "language": "zh-CN", // [可选] 导出语言，字符串类型，可选值：zh-CN/en-US，默认zh-CN
  "template": "standard" // [可选] 模板类型，字符串类型，可选值：standard/detailed/summary，默认standard
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "预算数据导出成功",
    "export": {
      "fileId": "export_20231203_001",
      "fileName": "预算数据_2023年12月_20231203.xlsx",
      "fileSize": 2048576, // 文件大小（字节）
      "downloadUrl": "/api/budgets/export/download/export_20231203_001",
      "expiresAt": "2023-12-10T23:59:59Z",
      "format": "excel",
      "status": "ready",
      "createdAt": "2023-12-03T16:00:00Z"
    },
    "exportDetails": {
      "totalBudgets": 28,
      "totalRecords": 156,
      "period": "2023-12",
      "categories": ["utilities", "maintenance", "supplies"],
      "dataRange": {
        "startDate": "2023-12-01",
        "endDate": "2023-12-31"
      },
      "sections": [ // 导出的数据段
        {
          "name": "预算概览",
          "description": "所有预算的总体概览信息",
          "recordCount": 28
        },
        {
          "name": "支出详情",
          "description": "所有预算相关的支出记录",
          "recordCount": 45
        },
        {
          "name": "预算执行进度",
          "description": "预算执行的时间轴数据",
          "recordCount": 84
        }
      ],
      "includes": {
        "historicalData": false,
        "projections": true,
        "alerts": true,
        "recommendations": true,
        "attachments": false
      }
    },
    "filePreview": { // 文件预览信息
      "sheets": [
        {
          "name": "预算概览",
          "description": "预算总体情况",
          "columns": [
            "预算ID", "预算名称", "类别", "预算金额", "已使用", "剩余", "使用率", "状态"
          ],
          "sampleData": [
            {
              "预算ID": "budget_20231201_001",
              "预算名称": "2023年12月电费预算",
              "类别": "utilities",
              "预算金额": "200.00",
              "已使用": "150.00",
              "剩余": "50.00",
              "使用率": "75.0%",
              "状态": "active"
            }
          ]
        },
        {
          "name": "支出详情",
          "description": "预算相关支出记录",
          "columns": [
            "支出ID", "预算ID", "支出标题", "金额", "类别", "状态", "创建时间"
          ],
          "sampleData": [
            {
              "支出ID": "exp_20231201_001",
              "预算ID": "budget_20231201_001",
              "支出标题": "2023年12月电费",
              "金额": "150.00",
              "类别": "utilities",
              "状态": "approved",
              "创建时间": "2023-12-01 09:45:00"
            }
          ]
        }
      ]
    },
    "processingInfo": {
      "processingTime": "2.3秒",
      "recordProcessed": 156,
      "dataValidation": {
        "valid": 156,
        "invalid": 0,
        "warnings": 3
      },
      "compression": {
        "enabled": true,
        "compressionRatio": "35%",
        "originalSize": 3145728,
        "compressedSize": 2048576
      }
    }
  }
}
```

#### 13.3.2 导入预算数据
- **接口地址：** POST /api/budgets/import
- **功能描述：** 从Excel文件导入预算数据
- **请求参数：**
```json
{
  "file": "budget_template.xlsx", // [必填] 文件，文件类型
  "importMode": "create_new", // [可选] 导入模式，字符串类型，可选值：create_new/update_existing/merge，默认create_new
  "validation": "strict", // [可选] 验证级别，字符串类型，可选值：strict/lenient，默认strict
  "overwriteExisting": false, // [可选] 是否覆盖已存在数据，布尔类型，默认false
  "skipDuplicates": true, // [可选] 是否跳过重复数据，布尔类型，默认true
  "categoryMapping": { // [可选] 类别映射，映射类型
    "utilities": "utilities",
    "maintenance": "maintenance",
    "supplies": "supplies"
  },
  "dateFormat": "YYYY-MM-DD", // [可选] 日期格式，字符串类型，默认YYYY-MM-DD
  "currency": "CNY", // [可选] 货币类型，字符串类型，默认CNY
  "notifyOnCompletion": true // [可选] 完成后是否通知，布尔类型，默认true
}
```
- **响应数据：**
```json
{
  "success": true,
  "data": {
    "message": "预算数据导入成功",
    "import": {
      "importId": "import_20231203_001",
      "fileName": "budget_template.xlsx",
      "fileSize": 1024576,
      "status": "completed",
      "startedAt": "2023-12-03T16:30:00Z",
      "completedAt": "2023-12-03T16:32:15Z",
      "processingTime": "2分15秒"
    },
    "summary": { // 导入摘要
      "totalRows": 50,
      "processedRows": 48,
      "successfulRows": 45,
      "failedRows": 3,
      "skippedRows": 2,
      "createdBudgets": 20,
      "updatedBudgets": 25,
      "errors": 3
    },
    "results": { // 详细结果
      "byCategory": {
        "utilities": {
          "total": 15,
          "successful": 14,
          "failed": 1,
          "created": 6,
          "updated": 8
        },
        "maintenance": {
          "total": 18,
          "successful": 17,
          "failed": 1,
          "created": 8,
          "updated": 9
        },
        "supplies": {
          "total": 15,
          "successful": 14,
          "failed": 1,
          "created": 6,
          "updated": 8
        }
      },
      "byAction": {
        "created": 20,
        "updated": 25,
        "skipped": 2,
        "errors": 3
      }
    },
    "validation": { // 验证结果
      "dataQuality": {
        "overallScore": 92.5,
        "completeness": 95.0,
        "accuracy": 90.0,
        "consistency": 95.0,
        "timeliness": 90.0
      },
      "issues": [ // 发现的问题
        {
          "row": 12,
          "column": "amount",
          "type": "validation_error",
          "message": "预算金额格式不正确",
          "severity": "medium",
          "suggestedValue": "200.00"
        },
        {
          "row": 25,
          "column": "category",
          "type": "invalid_value",
          "message": "类别值不存在",
          "severity": "high",
          "suggestedValue": "utilities"
        },
        {
          "row": 38,
          "column": "endDate",
          "type": "date_error",
          "message": "结束日期早于开始日期",
          "severity": "high",
          "suggestedValue": "2023-12-31"
        }
      ],
      "warnings": [ // 警告信息
        {
          "row": 15,
          "type": "duplicate_budget",
          "message": "检测到重复的预算ID",
          "action": "已更新现有预算"
        },
        {
          "row": 33,
          "type": "unusual_amount",
          "message": "预算金额异常高",
          "action": "已标记需要审核"
        }
      ]
    },
    "financial": { // 财务影响
      "budgetImpact": {
        "totalNewBudget": 15000.00,
        "totalUpdatedBudget": 8500.00,
        "netBudgetChange": 15000.00
      },
      "varianceAnalysis": {
        "significantChanges": [
          {
            "budgetId": "budget_20231201_001",
            "oldAmount": 200.00,
            "newAmount": 250.00,
            "change": 50.00,
            "changePercentage": 25.0
          }
        ]
      }
    },
    "errors": [ // 错误详情
      {
        "row": 12,
        "error": "invalid_amount_format",
        "

## 十四、安全设置模块

### 14.1 密码安全接口

#### 14.1.1 修改登录密码
- **接口地址**：PUT /api/auth/password
- **功能描述**：用户修改登录密码，需要验证当前密码
- **请求参数**：
```json
{
  "oldPassword": "string, 必填, 当前密码",
  "newPassword": "string, 必填, 新密码（8-20位，包含大小写字母和数字）"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "密码修改成功",
    "timestamp": "2023-12-01T10:30:00Z"
  }
}
```

#### 14.1.2 获取密码强度
- **接口地址**：GET /api/auth/password-strength
- **功能描述**：检测密码强度等级和安全性建议
- **请求参数**：
```json
{
  "password": "string, 必填, 待检测的密码"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "strength": "string, 密码强度等级（weak/medium/strong/very_strong）",
    "score": "number, 强度评分（0-100）",
    "feedback": {
      "hasUpperCase": "boolean, 包含大写字母",
      "hasLowerCase": "boolean, 包含小写字母",
      "hasNumbers": "boolean, 包含数字",
      "hasSpecialChars": "boolean, 包含特殊字符",
      "minLength": "boolean, 满足最小长度要求",
      "commonPassword": "boolean, 是否为常见密码"
    },
    "suggestions": [
      "string, 改进建议1",
      "string, 改进建议2"
    ]
  }
}
```

### 14.2 两步验证接口

#### 14.2.1 启用两步验证
- **接口地址**：POST /api/auth/2fa/enable
- **功能描述**：为账户启用两步验证，返回二维码供扫描
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "qrCode": "string, 二维码Base64编码",
    "secret": "string, 验证密钥",
    "backupCodes": [
      "string, 备用验证码1",
      "string, 备用验证码2"
    ],
    "message": "请使用认证器应用扫描二维码并输入验证码确认"
  }
}
```

#### 14.2.2 禁用两步验证
- **接口地址**：POST /api/auth/2fa/disable
- **功能描述**：禁用账户的两步验证功能
- **请求参数**：
```json
{
  "password": "string, 必填, 用户密码",
  "code": "string, 必填, 当前两步验证码"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "两步验证已成功禁用",
    "disabledAt": "2023-12-01T10:30:00Z"
  }
}
```

#### 14.2.3 获取备用验证码
- **接口地址**：GET /api/auth/2fa/backup-codes
- **功能描述**：获取两步验证的备用验证码列表
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "backupCodes": [
      {
        "code": "string, 备用验证码",
        "used": "boolean, 是否已使用",
        "usedAt": "string, 使用时间（可选）"
      }
    ],
    "remainingCount": "number, 剩余可用验证码数量"
  }
}
```

#### 14.2.4 验证两步验证码
- **接口地址**：POST /api/auth/2fa/verify
- **功能描述**：验证两步验证码的正确性
- **请求参数**：
```json
{
  "code": "string, 必填, 两步验证码"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "valid": "boolean, 验证码是否有效",
    "message": "string, 验证结果描述",
    "remainingAttempts": "number, 剩余尝试次数（如果验证失败）"
  }
}
```

### 14.3 验证绑定接口

#### 14.3.1 绑定手机号
- **接口地址**：POST /api/auth/phone/bind
- **功能描述**：将手机号绑定到用户账户
- **请求参数**：
```json
{
  "phone": "string, 必填, 手机号码",
  "verificationCode": "string, 必填, 手机验证码"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "phone": "string, 已绑定的手机号",
    "boundAt": "string, 绑定时间",
    "message": "手机号绑定成功"
  }
}
```

#### 14.3.2 解绑手机号
- **接口地址**：POST /api/auth/phone/unbind
- **功能描述**：从用户账户解绑手机号
- **请求参数**：
```json
{
  "password": "string, 必填, 用户密码确认"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "手机号解绑成功",
    "unboundAt": "2023-12-01T10:30:00Z"
  }
}
```

#### 14.3.3 绑定邮箱
- **接口地址**：POST /api/auth/email/bind
- **功能描述**：将邮箱地址绑定到用户账户
- **请求参数**：
```json
{
  "email": "string, 必填, 邮箱地址",
  "verificationCode": "string, 必填, 邮箱验证码"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "email": "string, 已绑定的邮箱地址",
    "boundAt": "string, 绑定时间",
    "message": "邮箱绑定成功"
  }
}
```

#### 14.3.4 解绑邮箱
- **接口地址**：POST /api/auth/email/unbind
- **功能描述**：从用户账户解绑邮箱地址
- **请求参数**：
```json
{
  "password": "string, 必填, 用户密码确认"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "邮箱解绑成功",
    "unboundAt": "2023-12-01T10:30:00Z"
  }
}
```

### 14.4 生物识别接口

#### 14.4.1 启用/禁用指纹识别
- **接口地址**：POST /api/auth/biometric/fingerprint
- **功能描述**：启用或禁用指纹识别登录功能
- **请求参数**：
```json
{
  "enabled": "boolean, 必填, 是否启用指纹识别",
  "biometricData": "string, 可选, 指纹生物特征数据"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "enabled": "boolean, 当前启用状态",
    "message": "string, 操作结果描述",
    "deviceInfo": {
      "deviceId": "string, 设备标识",
      "deviceName": "string, 设备名称",
      "registeredAt": "string, 注册时间"
    }
  }
}
```

#### 14.4.2 启用/禁用面部识别
- **接口地址**：POST /api/auth/biometric/face
- **功能描述**：启用或禁用面部识别登录功能
- **请求参数**：
```json
{
  "enabled": "boolean, 必填, 是否启用面部识别",
  "biometricData": "string, 可选, 面部生物特征数据"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "enabled": "boolean, 当前启用状态",
    "message": "string, 操作结果描述",
    "deviceInfo": {
      "deviceId": "string, 设备标识",
      "deviceName": "string, 设备名称",
      "registeredAt": "string, 注册时间"
    }
  }
}
```

#### 14.4.3 检查设备生物识别支持
- **接口地址**：GET /api/auth/biometric/available
- **功能描述**：检查当前设备支持的生物识别方式
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "availableMethods": [
      {
        "type": "string, 识别方式（fingerprint/face/voice）",
        "supported": "boolean, 是否支持",
        "enabled": "boolean, 是否已启用"
      }
    ],
    "deviceInfo": {
      "platform": "string, 设备平台",
      "browser": "string, 浏览器信息"
    }
  }
}
```

### 14.5 登录管理接口

#### 14.5.1 获取登录设备列表
- **接口地址**：GET /api/auth/devices
- **功能描述**：获取用户所有登录设备列表
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "string, 设备唯一标识",
        "deviceName": "string, 设备名称",
        "deviceType": "string, 设备类型（desktop/mobile/tablet）",
        "browser": "string, 浏览器信息",
        "os": "string, 操作系统",
        "ipAddress": "string, IP地址",
        "location": "string, 登录地点",
        "lastActive": "string, 最后活跃时间",
        "isCurrentDevice": "boolean, 是否为当前设备"
      }
    ],
    "total": "number, 设备总数"
  }
}
```

#### 14.5.2 移除登录设备
- **接口地址**：DELETE /api/auth/devices/{id}
- **功能描述**：移除指定的登录设备
- **请求参数**：
  - 路径参数：id（string, 必填, 设备ID）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "设备移除成功",
    "removedDeviceId": "string, 被移除的设备ID"
  }
}
```

#### 14.5.3 获取登录记录
- **接口地址**：GET /api/auth/login-history
- **功能描述**：获取用户的登录历史记录
- **请求参数**：
```json
{
  "page": "number, 可选, 页码（默认1）",
  "size": "number, 可选, 每页数量（默认20）",
  "timeRange": "string, 可选, 时间范围（7d/30d/90d）"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "loginHistory": [
      {
        "id": "string, 记录ID",
        "timestamp": "string, 登录时间",
        "deviceInfo": {
          "deviceName": "string, 设备名称",
          "browser": "string, 浏览器",
          "os": "string, 操作系统"
        },
        "location": "string, 登录地点",
        "ipAddress": "string, IP地址",
        "success": "boolean, 是否登录成功"
      }
    ],
    "pagination": {
      "currentPage": "number, 当前页码",
      "totalPages": "number, 总页数",
      "totalCount": "number, 总记录数"
    }
  }
}
```

#### 14.5.4 登出所有设备
- **接口地址**：POST /api/auth/logout-all
- **功能描述**：登出除当前设备外的所有设备
- **请求参数**：
```json
{
  "password": "string, 必填, 用户密码确认"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "已成功登出所有其他设备",
    "loggedOutDevices": "number, 被登出的设备数量",
    "timestamp": "string, 操作时间"
  }
}
```

### 14.6 登录安全接口

#### 14.6.1 设置登录频率限制
- **接口地址**：PUT /api/auth/rate-limit
- **功能描述**：设置登录尝试频率限制
- **请求参数**：
```json
{
  "enabled": "boolean, 必填, 是否启用频率限制",
  "maxAttempts": "number, 可选, 最大尝试次数（默认5）",
  "timeWindow": "number, 可选, 时间窗口（分钟，默认15）"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "enabled": "boolean, 当前启用状态",
    "settings": {
      "maxAttempts": "number, 最大尝试次数",
      "timeWindow": "number, 时间窗口（分钟）"
    },
    "message": "频率限制设置已更新"
  }
}
```

#### 14.6.2 重置频率限制计数器
- **接口地址**：POST /api/auth/rate-limit/reset
- **功能描述**：重置登录频率限制计数器
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "频率限制计数器已重置",
    "resetAt": "2023-12-01T10:30:00Z"
  }
}
```

#### 14.6.3 获取账户状态
- **接口地址**：GET /api/auth/account-status
- **功能描述**：获取当前账户的安全状态信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "accountStatus": {
      "isActive": "boolean, 账户是否激活",
      "isLocked": "boolean, 账户是否锁定",
      "lockReason": "string, 锁定原因（可选）",
      "lockedUntil": "string, 锁定到期时间（可选）"
    },
    "securityStatus": {
      "hasPassword": "boolean, 是否设置密码",
      "twoFactorEnabled": "boolean, 是否启用两步验证",
      "phoneBound": "boolean, 是否绑定手机",
      "emailBound": "boolean, 是否绑定邮箱",
      "biometricEnabled": "boolean, 是否启用生物识别"
    },
    "loginStatus": {
      "lastLogin": "string, 最后登录时间",
      "failedAttempts": "number, 连续失败尝试次数",
      "rateLimitRemaining": "number, 剩余尝试次数"
    }
  }
}
```

#### 14.6.4 解锁账户
- **接口地址**：POST /api/auth/account/unlock
- **功能描述**：解锁被锁定的账户
- **请求参数**：
```json
{
  "password": "string, 必填, 用户密码"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "账户解锁成功",
    "unlockedAt": "2023-12-01T10:30:00Z",
    "accountStatus": "string, 账户状态（active）"
  }
}
```

## 十五、通知消息模块

### 15.1 消息接口

#### 15.1.1 获取通知列表
- **接口地址**：GET /api/notifications
- **功能描述**：获取用户通知列表，支持分页和筛选
- **请求参数**：
```json
{
  "page": "number, 可选, 页码（默认1）",
  "size": "number, 可选, 每页数量（默认20）",
  "type": "string, 可选, 通知类型（system/alert/info/reminder）",
  "read": "boolean, 可选, 已读状态",
  "category": "string, 可选, 通知分类"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "string, 通知唯一标识",
        "title": "string, 通知标题",
        "content": "string, 通知内容",
        "type": "string, 通知类型（system/alert/info/reminder）",
        "category": "string, 通知分类",
        "isRead": "boolean, 是否已读",
        "priority": "string, 优先级（low/normal/high/urgent）",
        "createdAt": "string, 创建时间",
        "readAt": "string, 阅读时间（可选）",
        "expiresAt": "string, 过期时间（可选）",
        "actionUrl": "string, 操作链接（可选）",
        "metadata": {
          "source": "string, 通知来源",
          "relatedId": "string, 相关业务ID（可选）"
        }
      }
    ],
    "pagination": {
      "currentPage": "number, 当前页码",
      "totalPages": "number, 总页数",
      "totalCount": "number, 总记录数",
      "pageSize": "number, 每页数量"
    }
  }
}
```

#### 15.1.2 获取通知详情
- **接口地址**：GET /api/notifications/{id}
- **功能描述**：获取指定通知的详细信息
- **请求参数**：
  - 路径参数：id（string, 必填, 通知ID）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "string, 通知唯一标识",
      "title": "string, 通知标题",
      "content": "string, 通知内容",
      "type": "string, 通知类型",
      "category": "string, 通知分类",
      "isRead": "boolean, 是否已读",
      "priority": "string, 优先级",
      "createdAt": "string, 创建时间",
      "readAt": "string, 阅读时间（可选）",
      "expiresAt": "string, 过期时间（可选）",
      "actionUrl": "string, 操作链接（可选）",
      "metadata": {
        "source": "string, 通知来源",
        "relatedId": "string, 相关业务ID（可选）"
      },
      "attachments": [
        {
          "id": "string, 附件ID",
          "name": "string, 附件名称",
          "url": "string, 附件URL",
          "type": "string, 附件类型",
          "size": "number, 附件大小"
        }
      ]
    }
  }
}
```

#### 15.1.3 标记通知为已读
- **接口地址**：PUT /api/notifications/{id}/read
- **功能描述**：将指定通知标记为已读状态
- **请求参数**：
  - 路径参数：id（string, 必填, 通知ID）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "通知已标记为已读",
    "notificationId": "string, 通知ID",
    "readAt": "2023-12-01T10:30:00Z"
  }
}
```

#### 15.1.4 标记所有通知为已读
- **接口地址**：POST /api/notifications/mark-all-read
- **功能描述**：将用户所有通知标记为已读状态
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "所有通知已标记为已读",
    "markedCount": "number, 标记的通知数量",
    "markedAt": "2023-12-01T10:30:00Z"
  }
}
```

#### 15.1.5 标记通知为未读
- **接口地址**：PUT /api/notifications/{id}/unread
- **功能描述**：将指定通知标记为未读状态
- **请求参数**：
  - 路径参数：id（string, 必填, 通知ID）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "通知已标记为未读",
    "notificationId": "string, 通知ID",
    "unreadAt": "2023-12-01T10:30:00Z"
  }
}
```

#### 15.1.6 批量标记已读
- **接口地址**：POST /api/notifications/batch/read
- **功能描述**：批量将指定通知标记为已读状态
- **请求参数**：
```json
{
  "notificationIds": "array, 必填, 通知ID列表"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量标记已读操作完成",
    "processedCount": "number, 成功处理的notification数量",
    "failedCount": "number, 失败的数量",
    "results": [
      {
        "notificationId": "string, 通知ID",
        "success": "boolean, 是否成功",
        "error": "string, 错误信息（如果失败）"
      }
    ]
  }
}
```

#### 15.1.7 批量标记未读
- **接口地址**：POST /api/notifications/batch/unread
- **功能描述**：批量将指定通知标记为未读状态
- **请求参数**：
```json
{
  "notificationIds": "array, 必填, 通知ID列表"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量标记未读操作完成",
    "processedCount": "number, 成功处理的notification数量",
    "failedCount": "number, 失败的数量",
    "results": [
      {
        "notificationId": "string, 通知ID",
        "success": "boolean, 是否成功",
        "error": "string, 错误信息（如果失败）"
      }
    ]
  }
}
```

#### 15.1.8 删除通知
- **接口地址**：DELETE /api/notifications/{id}
- **功能描述**：删除指定的通知
- **请求参数**：
  - 路径参数：id（string, 必填, 通知ID）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "通知删除成功",
    "deletedNotificationId": "string, 被删除的通知ID"
  }
}
```

#### 15.1.9 批量删除通知
- **接口地址**：POST /api/notifications/batch/delete
- **功能描述**：批量删除指定的通知
- **请求参数**：
```json
{
  "notificationIds": "array, 必填, 通知ID列表"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量删除操作完成",
    "deletedCount": "number, 成功删除的通知数量",
    "failedCount": "number, 删除失败的数量",
    "results": [
      {
        "notificationId": "string, 通知ID",
        "success": "boolean, 是否成功",
        "error": "string, 错误信息（如果失败）"
      }
    ]
  }
}
```

#### 15.1.10 发送通知
- **接口地址**：POST /api/notifications/send
- **功能描述**：发送通知给指定用户（管理员功能）
- **请求参数**：
```json
{
  "userId": "string, 必填, 接收用户ID",
  "title": "string, 必填, 通知标题",
  "content": "string, 必填, 通知内容",
  "type": "string, 必填, 通知类型（system/alert/info/reminder）",
  "category": "string, 可选, 通知分类",
  "priority": "string, 可选, 优先级（low/normal/high/urgent）",
  "expiresAt": "string, 可选, 过期时间",
  "actionUrl": "string, 可选, 操作链接"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "通知发送成功",
    "notificationId": "string, 生成的通知ID",
    "sentAt": "2023-12-01T10:30:00Z"
  }
}
```

#### 15.1.11 获取通知统计
- **接口地址**：GET /api/notifications/stats
- **功能描述**：获取用户通知统计数据
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "total": "number, 总通知数",
    "unread": "number, 未读通知数",
    "important": "number, 重要通知数",
    "today": "number, 今日通知数",
    "byType": {
      "system": "number, 系统通知数",
      "alert": "number, 警报通知数",
      "info": "number, 信息通知数",
      "reminder": "number, 提醒通知数"
    },
    "byCategory": {
      "budget": "number, 预算相关通知数",
      "payment": "number, 缴费相关通知数",
      "maintenance": "number, 维护相关通知数",
      "security": "number, 安全相关通知数"
    }
  }
}
```

#### 15.1.12 获取通知分类
- **接口地址**：GET /api/notifications/categories
- **功能描述**：获取所有可用的通知分类
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "string, 分类ID",
        "name": "string, 分类名称",
        "description": "string, 分类描述",
        "icon": "string, 分类图标",
        "color": "string, 分类颜色"
      }
    ],
    "types": [
      {
        "id": "string, 类型ID",
        "name": "string, 类型名称",
        "description": "string, 类型描述"
      }
    ]
  }
}
```

### 15.2 通知设置接口

#### 15.2.1 获取通知设置
- **接口地址**：GET /api/notifications/settings
- **功能描述**：获取用户的通知设置
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "settings": {
      "emailEnabled": "boolean, 是否启用邮件通知",
      "pushEnabled": "boolean, 是否启用推送通知",
      "smsEnabled": "boolean, 是否启用短信通知",
      "quietHours": {
        "enabled": "boolean, 是否启用免打扰时间",
        "startTime": "string, 开始时间（HH:mm）",
        "endTime": "string, 结束时间（HH:mm）",
        "timezone": "string, 时区"
      },
      "categorySettings": {
        "budget": {
          "email": "boolean, 预算相关邮件通知",
          "push": "boolean, 预算相关推送通知",
          "sms": "boolean, 预算相关短信通知"
        },
        "payment": {
          "email": "boolean, 缴费相关邮件通知",
          "push": "boolean, 缴费相关推送通知",
          "sms": "boolean, 缴费相关短信通知"
        },
        "maintenance": {
          "email": "boolean, 维护相关邮件通知",
          "push": "boolean, 维护相关推送通知",
          "sms": "boolean, 维护相关短信通知"
        },
        "security": {
          "email": "boolean, 安全相关邮件通知",
          "push": "boolean, 安全相关推送通知",
          "sms": "boolean, 安全相关短信通知"
        }
      },
      "priorityFilters": {
        "low": "boolean, 接收低优先级通知",
        "normal": "boolean, 接收普通优先级通知",
        "high": "boolean, 接收高优先级通知",
        "urgent": "boolean, 接收紧急通知"
      }
    }
  }
}
```

#### 15.2.2 更新通知设置
- **接口地址**：PUT /api/notifications/settings
- **功能描述**：更新用户的通知设置
- **请求参数**：
```json
{
  "emailEnabled": "boolean, 可选, 是否启用邮件通知",
  "pushEnabled": "boolean, 可选, 是否启用推送通知",
  "smsEnabled": "boolean, 可选, 是否启用短信通知",
  "quietHours": {
    "enabled": "boolean, 可选, 是否启用免打扰时间",
    "startTime": "string, 可选, 开始时间（HH:mm）",
    "endTime": "string, 可选, 结束时间（HH:mm）",
    "timezone": "string, 可选, 时区"
  },
  "categorySettings": {
    "budget": {
      "email": "boolean, 可选, 预算相关邮件通知",
      "push": "boolean, 可选, 预算相关推送通知",
      "sms": "boolean, 可选, 预算相关短信通知"
    },
    "payment": {
      "email": "boolean, 可选, 缴费相关邮件通知",
      "push": "boolean, 可选, 缴费相关推送通知",
      "sms": "boolean, 可选, 缴费相关短信通知"
    },
    "maintenance": {
      "email": "boolean, 可选, 维护相关邮件通知",
      "push": "boolean, 可选, 维护相关推送通知",
      "sms": "boolean, 可选, 维护相关短信通知"
    },
    "security": {
      "email": "boolean, 可选, 安全相关邮件通知",
      "push": "boolean, 可选, 安全相关推送通知",
      "sms": "boolean, 可选, 安全相关短信通知"
    }
  },
  "priorityFilters": {
    "low": "boolean, 可选, 接收低优先级通知",
    "normal": "boolean, 可选, 接收普通优先级通知",
    "high": "boolean, 可选, 接收高优先级通知",
    "urgent": "boolean, 可选, 接收紧急通知"
  }
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "通知设置更新成功",
    "updatedSettings": {
      "emailEnabled": "boolean, 更新后的邮件通知状态",
      "pushEnabled": "boolean, 更新后的推送通知状态",
      "smsEnabled": "boolean, 更新后的短信通知状态",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

## 十六、维护模式模块

### 16.1 维护控制接口

#### 16.1.1 启动维护模式
- **接口地址**：POST /api/maintenance/start
- **功能描述**：启动系统维护模式，限制用户访问
- **请求参数**：
```json
{
  "countdownMinutes": "number, 必填, 倒计时分钟数",
  "message": "string, 必填, 维护提示信息",
  "scheduledEndTime": "string, 可选, 预计结束时间",
  "affectedServices": "array, 可选, 受影响的服务列表"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "maintenanceId": "string, 维护会话ID",
    "status": "string, 维护状态（scheduled/active/completed）",
    "startTime": "2023-12-01T10:30:00Z",
    "scheduledEndTime": "2023-12-01T12:30:00Z",
    "countdownMinutes": "number, 倒计时分钟数",
    "message": "string, 维护提示信息",
    "affectedServices": [
      "string, 受影响的服务1",
      "string, 受影响的服务2"
    ],
    "messageToUsers": "string, 给用户的提示信息"
  }
}
```

#### 16.1.2 取消维护模式
- **接口地址**：POST /api/maintenance/cancel
- **功能描述**：取消当前维护模式，恢复正常服务
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "维护模式已取消",
    "cancelledAt": "2023-12-01T11:00:00Z",
    "originalScheduledEnd": "2023-12-01T12:30:00Z",
    "actualDuration": "number, 实际维护时长（分钟）"
  }
}
```

#### 16.1.3 获取维护状态
- **接口地址**：GET /api/maintenance/status
- **功能描述**：获取当前系统维护状态信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "isMaintenanceMode": "boolean, 是否处于维护模式",
    "maintenanceInfo": {
      "id": "string, 维护会话ID",
      "status": "string, 维护状态",
      "startTime": "string, 开始时间",
      "scheduledEndTime": "string, 预计结束时间",
      "actualEndTime": "string, 实际结束时间（可选）",
      "message": "string, 维护提示信息",
      "countdownMinutes": "number, 剩余分钟数",
      "affectedServices": [
        "string, 受影响的服务列表"
      ],
      "progress": {
        "percentage": "number, 完成百分比",
        "currentPhase": "string, 当前阶段",
        "nextMilestone": "string, 下一个里程碑"
      }
    },
    "systemStatus": {
      "overall": "string, 系统整体状态",
      "services": [
        {
          "name": "string, 服务名称",
          "status": "string, 服务状态",
          "availability": "string, 可用性"
        }
      ]
    }
  }
}
```

#### 16.1.4 获取剩余时间
- **接口地址**：GET /api/maintenance/remaining
- **功能描述**：获取维护模式剩余时间信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "remainingTime": {
      "minutes": "number, 剩余分钟数",
      "seconds": "number, 剩余秒数",
      "formatted": "string, 格式化时间（1小时30分钟）"
    },
    "endTime": "string, 预计结束时间",
    "progress": {
      "elapsedPercentage": "number, 已过时间百分比",
      "estimatedCompletion": "string, 预计完成时间"
    },
    "status": "string, 当前状态"
  }
}
```

### 16.2 维护配置接口

#### 16.2.1 获取维护配置
- **接口地址**：GET /api/maintenance/config
- **功能描述**：获取维护模式的配置信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "config": {
      "defaultCountdownMinutes": "number, 默认倒计时分钟数",
      "maxDurationMinutes": "number, 最大维护时长",
      "maintenanceMessage": "string, 默认维护消息",
      "allowedUsers": [
        {
          "id": "string, 用户ID",
          "role": "string, 用户角色",
          "canAccessDuringMaintenance": "boolean, 维护期间是否可访问"
        }
      ],
      "maintenanceSchedule": {
        "enabled": "boolean, 是否启用定时维护",
        "scheduledTime": "string, 定时维护时间（可选）",
        "frequency": "string, 维护频率（daily/weekly/monthly）"
      },
      "notificationSettings": {
        "preStartNotification": "number, 提前通知分钟数",
        "statusUpdateInterval": "number, 状态更新间隔（分钟）",
        "endNotification": "boolean, 是否发送结束通知"
      },
      "services": {
        "critical": "array, 关键服务列表",
        "nonCritical": "array, 非关键服务列表",
        "maintenanceAllowedServices": "array, 允许在维护期间使用的服务"
      }
    }
  }
}
```

#### 16.2.2 更新维护配置
- **接口地址**：PUT /api/maintenance/config
- **功能描述**：更新维护模式的配置信息
- **请求参数**：
```json
{
  "defaultCountdownMinutes": "number, 可选, 默认倒计时分钟数",
  "maxDurationMinutes": "number, 可选, 最大维护时长",
  "maintenanceMessage": "string, 可选, 默认维护消息",
  "maintenanceSchedule": {
    "enabled": "boolean, 可选, 是否启用定时维护",
    "scheduledTime": "string, 可选, 定时维护时间",
    "frequency": "string, 可选, 维护频率"
  },
  "notificationSettings": {
    "preStartNotification": "number, 可选, 提前通知分钟数",
    "statusUpdateInterval": "number, 可选, 状态更新间隔",
    "endNotification": "boolean, 可选, 是否发送结束通知"
  },
  "services": {
    "critical": "array, 可选, 关键服务列表",
    "nonCritical": "array, 可选, 非关键服务列表",
    "maintenanceAllowedServices": "array, 可选, 允许在维护期间使用的服务"
  }
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "维护配置更新成功",
    "updatedConfig": {
      "defaultCountdownMinutes": "number, 更新后的默认倒计时",
      "maxDurationMinutes": "number, 更新后的最大维护时长",
      "maintenanceMessage": "string, 更新后的默认消息",
      "updatedAt": "string, 更新时间"
    }
  }
}
```


### 17.12 报表统计接口

#### 17.12.1 获取用户统计报表
- **接口地址**：GET /api/admin/reports/user-statistics
- **功能描述**：获取用户统计报表数据
- **请求参数**：
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
  - `groupBy` (string, 可选): 分组方式(day/week/month)
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "report": {
      "summary": {
        "totalUsers": "number, 总用户数",
        "activeUsers": "number, 活跃用户数",
        "newUsers": "number, 新增用户数",
        "inactiveUsers": "number, 非活跃用户数"
      },
      "userGrowth": [
        {
          "period": "string, 时间段",
          "newUsers": "number, 新增用户数",
          "totalUsers": "number, 总用户数",
          "growthRate": "number, 增长率"
        }
      ],
      "userDistribution": {
        "byRole": [
          {
            "role": "string, 角色",
            "count": "number, 用户数",
            "percentage": "number, 占比"
          }
        ],
        "byStatus": [
          {
            "status": "string, 状态",
            "count": "number, 用户数",
            "percentage": "number, 占比"
          }
        ],
        "byDormitory": [
          {
            "dormitoryName": "string, 寝室名称",
            "userCount": "number, 用户数"
          }
        ]
      },
      "activityStats": {
        "dailyActiveUsers": "number, 日活跃用户",
        "weeklyActiveUsers": "number, 周活跃用户",
        "monthlyActiveUsers": "number, 月活跃用户",
        "averageSessionDuration": "number, 平均会话时长(分钟)"
      }
    }
  }
}
```

#### 17.12.2 获取费用统计报表
- **接口地址**：GET /api/admin/reports/expense-statistics
- **功能描述**：获取费用统计报表数据
- **请求参数**：
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
  - `groupBy` (string, 可选): 分组方式
  - `dormitoryId` (number, 可选): 寝室ID
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "report": {
      "summary": {
        "totalExpenses": "number, 总费用",
        "totalPaid": "number, 已支付费用",
        "totalPending": "number, 待支付费用",
        "totalOverdue": "number, 逾期费用",
        "averageExpense": "number, 平均费用"
      },
      "expenseTrend": [
        {
          "period": "string, 时间段",
          "totalAmount": "number, 总金额",
          "paidAmount": "number, 已支付金额",
          "pendingAmount": "number, 待支付金额",
          "expenseCount": "number, 费用笔数"
        }
      ],
      "expenseDistribution": {
        "byCategory": [
          {
            "category": "string, 费用类别",
            "amount": "number, 金额",
            "count": "number, 笔数",
            "percentage": "number, 占比"
          }
        ],
        "byStatus": [
          {
            "status": "string, 状态",
            "amount": "number, 金额",
            "count": "number, 笔数",
            "percentage": "number, 占比"
          }
        ],
        "byDormitory": [
          {
            "dormitoryName": "string, 寝室名称",
            "totalAmount": "number, 总金额",
            "paidAmount": "number, 已支付金额",
            "pendingAmount": "number, 待支付金额"
          }
        ]
      },
      "paymentStats": {
        "totalPayments": "number, 总支付笔数",
        "onTimePayments": "number, 准时支付笔数",
        "latePayments": "number, 逾期支付笔数",
        "paymentRate": "number, 支付率百分比"
      }
    }
  }
}
```

#### 17.12.3 获取寝室统计报表
- **接口地址**：GET /api/admin/reports/dormitory-statistics
- **功能描述**：获取寝室统计报表数据
- **请求参数**：
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
  - `buildingId` (number, 可选): 楼栋ID
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "report": {
      "summary": {
        "totalDormitories": "number, 总寝室数",
        "occupiedDormitories": "number, 已入住寝室数",
        "availableDormitories": "number, 可用寝室数",
        "totalCapacity": "number, 总容量",
        "currentOccupancy": "number, 当前入住人数",
        "occupancyRate": "number, 入住率百分比"
      },
      "dormitoryStats": [
        {
          "buildingName": "string, 楼栋名称",
          "dormitoryName": "string, 寝室名称",
          "capacity": "number, 容量",
          "currentOccupancy": "number, 当前入住人数",
          "occupancyRate": "number, 入住率",
          "status": "string, 状态",
          "monthlyExpenses": "number, 月度费用"
        }
      ],
      "occupancyTrend": [
        {
          "period": "string, 时间段",
          "totalOccupancy": "number, 总入住人数",
          "occupancyRate": "number, 入住率",
          "newOccupants": "number, 新入住人数",
          "vacated": "number, 退住人数"
        }
      ],
      "buildingDistribution": [
        {
          "buildingName": "string, 楼栋名称",
          "dormitoryCount": "number, 寝室数量",
          "totalCapacity": "number, 总容量",
          "currentOccupancy": "number, 当前入住人数",
          "occupancyRate": "number, 入住率"
        }
      ]
    }
  }
}
```

#### 17.12.4 获取系统使用统计报表
- **接口地址**：GET /api/admin/reports/system-usage
- **功能描述**：获取系统使用统计报表数据
- **请求参数**：
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "report": {
      "apiUsage": {
        "totalRequests": "number, 总请求数",
        "requestsByEndpoint": [
          {
            "endpoint": "string, 接口路径",
            "method": "string, 请求方法",
            "requestCount": "number, 请求数",
            "averageResponseTime": "number, 平均响应时间",
            "errorRate": "number, 错误率"
          }
        ],
        "requestsByUserAgent": [
          {
            "userAgent": "string, 用户代理",
            "requestCount": "number, 请求数",
            "percentage": "number, 占比"
          }
        ]
      },
      "userActivity": {
        "loginStats": {
          "totalLogins": "number, 总登录次数",
          "uniqueUsers": "number, 独立用户数",
          "failedLogins": "number, 失败登录次数",
          "averageSessionDuration": "number, 平均会话时长"
        },
        "peakUsage": {
          "peakConcurrentUsers": "number, 峰值并发用户数",
          "peakTime": "string, 峰值时间",
          "averageDailyUsers": "number, 平均日活跃用户数"
        }
      },
      "systemPerformance": {
        "averageResponseTime": "number, 平均响应时间",
        "uptimePercentage": "number, 正常运行时间百分比",
        "errorRate": "number, 错误率",
        "slowestEndpoints": [
          {
            "endpoint": "string, 接口路径",
            "averageResponseTime": "number, 平均响应时间",
            "maxResponseTime": "number, 最大响应时间"
          }
        ]
      }
    }
  }
}
```

#### 17.12.5 导出报表数据
- **接口地址**：POST /api/admin/reports/export
- **功能描述**：导出报表数据
- **请求参数**：
```json
{
  "reportType": "string, 必填, 报表类型",
  "startDate": "string, 可选, 开始日期",
  "endDate": "string, 可选, 结束日期",
  "format": "string, 可选, 导出格式(csv/excel/pdf)",
  "filters": "object, 可选, 筛选条件"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "exportTask": {
      "taskId": "string, 导出任务ID",
      "status": "string, 任务状态",
      "downloadUrl": "string, 可选, 下载链接",
      "estimatedCompletionTime": "string, 预计完成时间",
      "createdAt": "string, 创建时间"
    }
  }
}
```

---

## 总结

本API接口清单完整覆盖了管理端的所有功能模块，包括：

1. **用户管理接口**（12个）：用户CRUD、批量操作、密码重置、登录日志等
2. **寝室管理接口**（12个）：寝室CRUD、状态管理、成员管理、楼栋信息等
3. **费用管理接口**（11个）：费用记录管理、审核、统计、缴费记录等
4. **系统管理接口**（10个）：系统统计、日志、健康检查、配置管理等
5. **权限管理接口**（8个）：角色管理、权限分配、用户权限等
6. **系统通知接口**（10个）：通知管理、发送、模板、历史记录等
7. **客户端特性控制接口**（7个）：特性开关、使用统计、批量操作等
8. **管理员行为监控接口**（5个）：行为日志、高风险操作监控等
9. **管理员权限管理接口**（7个）：权限分配、角色权限、统计等
10. **数据备份与恢复接口**（8个）：备份任务、恢复任务、统计信息等
11. **系统监控接口**（7个）：性能监控、告警规则、趋势分析等
12. **报表统计接口**（5个）：用户、费用、寝室、系统使用等报表

总计92个RESTful风格的管理端接口，采用统一的响应格式和错误处理机制，支持分页、筛选、排序等常用功能，为管理端应用提供完整的数据支持。

## 17. 管理端接口

### 17.1 用户管理接口

#### 17.1.1 获取用户列表
- **接口地址**：GET /api/admin/users
- **功能描述**：获取管理端用户列表，支持分页和筛选
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
  - `keyword` (string, 可选): 搜索关键词（用户名、邮箱、手机号）
  - `role` (string, 可选): 用户角色筛选
  - `status` (string, 可选): 用户状态筛选（active/inactive）
  - `dormitory` (string, 可选): 寝室号筛选
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "number, 用户ID",
        "username": "string, 用户名",
        "email": "string, 邮箱地址",
        "phone": "string, 手机号",
        "role": "string, 用户角色",
        "status": "string, 用户状态",
        "dormitory": "string, 寝室号",
        "roomId": "number, 寝室ID",
        "lastLoginAt": "string, 最后登录时间",
        "createdAt": "string, 创建时间",
        "updatedAt": "string, 更新时间",
        "remark": "string, 备注信息"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.1.2 创建用户
- **接口地址**：POST /api/admin/users
- **功能描述**：创建新用户
- **请求参数**：
```json
{
  "username": "string, 必填, 用户名",
  "email": "string, 必填, 邮箱地址",
  "phone": "string, 可选, 手机号",
  "password": "string, 必填, 初始密码",
  "role": "string, 必填, 用户角色",
  "dormitory": "string, 可选, 寝室号",
  "status": "string, 可选, 用户状态(active/inactive)",
  "remark": "string, 可选, 备注信息"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "number, 用户ID",
      "username": "string, 用户名",
      "email": "string, 邮箱地址",
      "phone": "string, 手机号",
      "role": "string, 用户角色",
      "status": "string, 用户状态",
      "dormitory": "string, 寝室号",
      "createdAt": "string, 创建时间"
    }
  }
}
```

#### 17.1.3 获取用户详情
- **接口地址**：GET /api/admin/users/{userId}
- **功能描述**：获取指定用户的详细信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "number, 用户ID",
      "username": "string, 用户名",
      "email": "string, 邮箱地址",
      "phone": "string, 手机号",
      "role": "string, 用户角色",
      "status": "string, 用户状态",
      "dormitory": "string, 寝室号",
      "roomId": "number, 寝室ID",
      "avatar": "string, 头像URL",
      "lastLoginAt": "string, 最后登录时间",
      "lastLoginIp": "string, 最后登录IP",
      "loginCount": "number, 登录次数",
      "createdAt": "string, 创建时间",
      "updatedAt": "string, 更新时间",
      "remark": "string, 备注信息",
      "permissions": ["string, 权限列表"],
      "loginLogs": [
        {
          "loginAt": "string, 登录时间",
          "ip": "string, 登录IP",
          "userAgent": "string, 用户代理",
          "status": "string, 登录状态"
        }
      ],
      "paymentRecords": [
        {
          "id": "number, 支付记录ID",
          "amount": "number, 支付金额",
          "status": "string, 支付状态",
          "createdAt": "string, 创建时间"
        }
      ]
    }
  }
}
```

#### 17.1.4 更新用户
- **接口地址**：PUT /api/admin/users/{userId}
- **功能描述**：更新用户信息
- **请求参数**：
```json
{
  "username": "string, 可选, 用户名",
  "email": "string, 可选, 邮箱地址",
  "phone": "string, 可选, 手机号",
  "role": "string, 可选, 用户角色",
  "dormitory": "string, 可选, 寝室号",
  "status": "string, 可选, 用户状态",
  "remark": "string, 可选, 备注信息"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "number, 用户ID",
      "username": "string, 更新后的用户名",
      "email": "string, 更新后的邮箱",
      "phone": "string, 更新后的手机号",
      "role": "string, 更新后的角色",
      "status": "string, 更新后的状态",
      "dormitory": "string, 更新后的寝室号",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.1.5 删除用户
- **接口地址**：DELETE /api/admin/users/{userId}
- **功能描述**：删除指定用户
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "用户删除成功"
  }
}
```

#### 17.1.6 批量删除用户
- **接口地址**：DELETE /api/admin/users/batch
- **功能描述**：批量删除用户
- **请求参数**：
```json
{
  "userIds": "array, 必填, 要删除的用户ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量删除成功",
    "deletedCount": "number, 删除的用户数量"
  }
}
```

#### 17.1.7 批量启用用户
- **接口地址**：PUT /api/admin/users/batch/enable
- **功能描述**：批量启用用户
- **请求参数**：
```json
{
  "userIds": "array, 必填, 要启用的用户ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量启用成功",
    "enabledCount": "number, 启用的用户数量"
  }
}
```

#### 17.1.8 批量禁用用户
- **接口地址**：PUT /api/admin/users/batch/disable
- **功能描述**：批量禁用用户
- **请求参数**：
```json
{
  "userIds": "array, 必填, 要禁用的用户ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量禁用成功",
    "disabledCount": "number, 禁用的用户数量"
  }
}
```

#### 17.1.9 重置用户密码
- **接口地址**：PUT /api/admin/users/{userId}/password/reset
- **功能描述**：重置用户密码
- **请求参数**：
```json
{
  "newPassword": "string, 可选, 新密码，如果不提供则生成随机密码"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "密码重置成功",
    "newPassword": "string, 新密码"
  }
}
```

#### 17.1.10 获取用户登录日志
- **接口地址**：GET /api/admin/users/{userId}/login-logs
- **功能描述**：获取用户登录日志
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "loginLogs": [
      {
        "id": "number, 日志ID",
        "userId": "number, 用户ID",
        "username": "string, 用户名",
        "loginAt": "string, 登录时间",
        "ip": "string, 登录IP",
        "userAgent": "string, 用户代理",
        "status": "string, 登录状态(success/failed)",
        "errorReason": "string, 错误原因(可选)"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.1.11 批量导入用户
- **接口地址**：POST /api/admin/users/import
- **功能描述**：批量导入用户
- **请求参数**：FormData格式，包含文件
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "导入成功",
    "importedCount": "number, 导入的用户数量",
    "failedCount": "number, 导入失败的数量",
    "errors": [
      {
        "row": "number, 行号",
        "error": "string, 错误信息"
      }
    ]
  }
}
```

#### 17.1.12 批量导出用户
- **接口地址**：GET /api/admin/users/export
- **功能描述**：批量导出用户
- **请求参数**：
  - `format` (string, 可选): 导出格式，支持excel/csv
  - `keyword` (string, 可选): 搜索关键词
  - `role` (string, 可选): 用户角色筛选
  - `status` (string, 可选): 用户状态筛选
  - `dormitory` (string, 可选): 寝室号筛选
- **响应数据结构**：文件流下载

### 17.2 寝室管理接口

#### 17.2.1 获取寝室列表
- **接口地址**：GET /api/admin/dormitories
- **功能描述**：获取管理端寝室列表，支持分页和筛选
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
  - `dormNumber` (string, 可选): 寝室号筛选
  - `building` (string, 可选): 楼栋筛选
  - `status` (string, 可选): 状态筛选（normal/maintenance/full）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "dormitories": [
      {
        "id": "number, 寝室ID",
        "dormNumber": "string, 寝室号",
        "building": "string, 楼栋",
        "floor": "number, 楼层",
        "capacity": "number, 容量",
        "currentOccupancy": "number, 当前入住人数",
        "status": "string, 状态(normal/maintenance/full)",
        "description": "string, 描述信息",
        "leaderId": "number, 寝室长ID",
        "leaderName": "string, 寝室长姓名",
        "createdAt": "string, 创建时间",
        "updatedAt": "string, 更新时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.2.2 获取寝室统计信息
- **接口地址**：GET /api/admin/dormitories/stats
- **功能描述**：获取寝室统计信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": "number, 总寝室数",
      "normal": "number, 正常状态寝室数",
      "maintenance": "number, 维修中寝室数",
      "full": "number, 已满寝室数",
      "occupancyRate": "number, 整体入住率",
      "totalCapacity": "number, 总容量",
      "currentOccupancy": "number, 当前总入住人数"
    }
  }
}
```

#### 17.2.3 创建寝室
- **接口地址**：POST /api/admin/dormitories
- **功能描述**：创建新寝室
- **请求参数**：
```json
{
  "dormNumber": "string, 必填, 寝室号",
  "building": "string, 必填, 楼栋",
  "floor": "number, 可选, 楼层",
  "capacity": "number, 必填, 容量",
  "status": "string, 可选, 状态(normal/maintenance/full)",
  "description": "string, 可选, 描述信息"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "dormitory": {
      "id": "number, 寝室ID",
      "dormNumber": "string, 寝室号",
      "building": "string, 楼栋",
      "floor": "number, 楼层",
      "capacity": "number, 容量",
      "currentOccupancy": "number, 当前入住人数",
      "status": "string, 状态",
      "description": "string, 描述信息",
      "createdAt": "string, 创建时间"
    }
  }
}
```

#### 17.2.4 获取寝室详情
- **接口地址**：GET /api/admin/dormitories/{dormitoryId}
- **功能描述**：获取寝室详细信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "dormitory": {
      "id": "number, 寝室ID",
      "dormNumber": "string, 寝室号",
      "building": "string, 楼栋",
      "floor": "number, 楼层",
      "capacity": "number, 容量",
      "currentOccupancy": "number, 当前入住人数",
      "status": "string, 状态",
      "description": "string, 描述信息",
      "leaderId": "number, 寝室长ID",
      "leaderName": "string, 寝室长姓名",
      "members": [
        {
          "id": "number, 成员ID",
          "username": "string, 用户名",
          "email": "string, 邮箱",
          "role": "string, 角色",
          "joinedAt": "string, 加入时间",
          "status": "string, 状态"
        }
      ],
      "feeStats": {
        "totalExpense": "number, 总费用",
        "pendingExpense": "number, 待支付费用",
        "paidExpense": "number, 已支付费用"
      },
      "createdAt": "string, 创建时间",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.2.5 更新寝室信息
- **接口地址**：PUT /api/admin/dormitories/{dormitoryId}
- **功能描述**：更新寝室信息
- **请求参数**：
```json
{
  "dormNumber": "string, 可选, 寝室号",
  "building": "string, 可选, 楼栋",
  "floor": "number, 可选, 楼层",
  "capacity": "number, 可选, 容量",
  "status": "string, 可选, 状态",
  "description": "string, 可选, 描述信息"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "dormitory": {
      "id": "number, 寝室ID",
      "dormNumber": "string, 更新后的寝室号",
      "building": "string, 更新后的楼栋",
      "floor": "number, 更新后的楼层",
      "capacity": "number, 更新后的容量",
      "status": "string, 更新后的状态",
      "description": "string, 更新后的描述",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.2.6 删除寝室
- **接口地址**：DELETE /api/admin/dormitories/{dormitoryId}
- **功能描述**：删除寝室
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "寝室删除成功"
  }
}
```

#### 17.2.7 批量删除寝室
- **接口地址**：DELETE /api/admin/dormitories/batch
- **功能描述**：批量删除寝室
- **请求参数**：
```json
{
  "ids": "array, 必填, 要删除的寝室ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量删除成功",
    "deletedCount": "number, 删除的寝室数量"
  }
}
```

#### 17.2.8 更新寝室状态
- **接口地址**：PUT /api/admin/dormitories/{dormitoryId}/status
- **功能描述**：更新寝室状态
- **请求参数**：
```json
{
  "status": "string, 必填, 状态(normal/maintenance/full)"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "dormitory": {
      "id": "number, 寝室ID",
      "dormNumber": "string, 寝室号",
      "status": "string, 更新后的状态",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.2.9 获取楼栋列表
- **接口地址**：GET /api/admin/buildings
- **功能描述**：获取楼栋列表
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "buildings": [
      {
        "id": "number, 楼栋ID",
        "name": "string, 楼栋名称",
        "description": "string, 描述信息",
        "dormitoryCount": "number, 寝室数量",
        "totalCapacity": "number, 总容量",
        "currentOccupancy": "number, 当前入住人数"
      }
    ]
  }
}
```

#### 17.2.10 获取寝室成员列表
- **接口地址**：GET /api/admin/dormitories/{dormitoryId}/members
- **功能描述**：获取寝室成员列表
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "number, 成员ID",
        "username": "string, 用户名",
        "email": "string, 邮箱",
        "phone": "string, 手机号",
        "role": "string, 角色",
        "status": "string, 状态",
        "joinedAt": "string, 加入时间",
        "lastActiveAt": "string, 最后活跃时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.2.11 添加寝室成员
- **接口地址**：POST /api/admin/dormitories/{dormitoryId}/members
- **功能描述**：添加成员到寝室
- **请求参数**：
```json
{
  "userId": "number, 必填, 用户ID",
  "role": "string, 可选, 成员角色"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "成员添加成功",
    "member": {
      "id": "number, 成员ID",
      "username": "string, 用户名",
      "email": "string, 邮箱",
      "role": "string, 角色",
      "joinedAt": "string, 加入时间"
    }
  }
}
```

#### 17.2.12 移除寝室成员
- **接口地址**：DELETE /api/admin/dormitories/{dormitoryId}/members/{userId}
- **功能描述**：从寝室中移除成员
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "成员移除成功"
  }
}
```

### 17.3 费用管理接口

#### 17.3.1 获取费用记录列表
- **接口地址**：GET /api/admin/fees
- **功能描述**：获取管理端费用记录列表，支持分页和筛选
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
  - `status` (string, 可选): 状态筛选（pending/approved/rejected）
  - `category` (string, 可选): 费用类别筛选
  - `month` (string, 可选): 月份筛选（格式：YYYY-MM）
  - `keyword` (string, 可选): 搜索关键词
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "fees": [
      {
        "id": "number, 费用ID",
        "title": "string, 费用标题",
        "description": "string, 费用描述",
        "amount": "number, 费用金额",
        "category": "string, 费用类别",
        "status": "string, 状态(pending/approved/rejected)",
        "dormitoryId": "number, 寝室ID",
        "dormitoryNumber": "string, 寝室号",
        "createdBy": "string, 创建人",
        "createdAt": "string, 创建时间",
        "approvedBy": "string, 可选, 审核人",
        "approvedAt": "string, 可选, 审核时间",
        "rejectedReason": "string, 可选, 拒绝原因",
        "paymentDeadline": "string, 可选, 缴费截止日期"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.3.2 获取费用统计信息
- **接口地址**：GET /api/admin/fees/stats
- **功能描述**：获取费用统计信息
- **请求参数**：
  - `month` (string, 可选): 月份（格式：YYYY-MM）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalExpense": "number, 总费用",
      "pendingExpense": "number, 待审核费用",
      "approvedExpense": "number, 已通过费用",
      "rejectedExpense": "number, 已拒绝费用",
      "thisMonthExpense": "number, 本月费用",
      "totalCount": "number, 总记录数",
      "pendingCount": "number, 待审核记录数",
      "approvedCount": "number, 已通过记录数",
      "rejectedCount": "number, 已拒绝记录数"
    }
  }
}
```

#### 17.3.3 创建费用记录
- **接口地址**：POST /api/admin/fees
- **功能描述**：创建费用记录
- **请求参数**：
```json
{
  "title": "string, 必填, 费用标题",
  "description": "string, 可选, 费用描述",
  "amount": "number, 必填, 费用金额",
  "category": "string, 必填, 费用类别",
  "dormitoryId": "number, 可选, 寝室ID",
  "paymentDeadline": "string, 可选, 缴费截止日期"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "fee": {
      "id": "number, 费用ID",
      "title": "string, 费用标题",
      "description": "string, 费用描述",
      "amount": "number, 费用金额",
      "category": "string, 费用类别",
      "status": "string, 状态",
      "dormitoryId": "number, 寝室ID",
      "createdBy": "string, 创建人",
      "createdAt": "string, 创建时间",
      "paymentDeadline": "string, 缴费截止日期"
    }
  }
}
```

#### 17.3.4 获取费用详情
- **接口地址**：GET /api/admin/fees/{feeId}
- **功能描述**：获取费用详情
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "fee": {
      "id": "number, 费用ID",
      "title": "string, 费用标题",
      "description": "string, 费用描述",
      "amount": "number, 费用金额",
      "category": "string, 费用类别",
      "status": "string, 状态",
      "dormitoryId": "number, 寝室ID",
      "dormitoryNumber": "string, 寝室号",
      "createdBy": "string, 创建人",
      "createdAt": "string, 创建时间",
      "approvedBy": "string, 可选, 审核人",
      "approvedAt": "string, 可选, 审核时间",
      "rejectedReason": "string, 可选, 拒绝原因",
      "paymentDeadline": "string, 可选, 缴费截止日期",
      "paymentHistory": [
        {
          "id": "number, 缴费记录ID",
          "amount": "number, 缴费金额",
          "paidBy": "string, 缴费人",
          "paidAt": "string, 缴费时间",
          "paymentMethod": "string, 缴费方式"
        }
      ]
    }
  }
}
```

#### 17.3.5 更新费用记录
- **接口地址**：PUT /api/admin/fees/{feeId}
- **功能描述**：更新费用记录
- **请求参数**：
```json
{
  "title": "string, 可选, 费用标题",
  "description": "string, 可选, 费用描述",
  "amount": "number, 可选, 费用金额",
  "category": "string, 可选, 费用类别",
  "paymentDeadline": "string, 可选, 缴费截止日期"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "fee": {
      "id": "number, 费用ID",
      "title": "string, 更新后的标题",
      "description": "string, 更新后的描述",
      "amount": "number, 更新后的金额",
      "category": "string, 更新后的类别",
      "paymentDeadline": "string, 更新后的缴费截止日期",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.3.6 删除费用记录
- **接口地址**：DELETE /api/admin/fees/{feeId}
- **功能描述**：删除费用记录
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "费用记录删除成功"
  }
}
```

#### 17.3.7 批量审核费用
- **接口地址**：PUT /api/admin/fees/batch/approve
- **功能描述**：批量审核通过费用
- **请求参数**：
```json
{
  "ids": "array, 必填, 要审核的费用ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量审核通过成功",
    "approvedCount": "number, 审核通过的数量"
  }
}
```

#### 17.3.8 批量拒绝费用
- **接口地址**：PUT /api/admin/fees/batch/reject
- **功能描述**：批量拒绝费用
- **请求参数**：
```json
{
  "ids": "array, 必填, 要拒绝的费用ID数组",
  "reason": "string, 可选, 拒绝原因"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量拒绝成功",
    "rejectedCount": "number, 拒绝的数量"
  }
}
```

#### 17.3.9 批量删除费用
- **接口地址**：DELETE /api/admin/fees/batch
- **功能描述**：批量删除费用记录
- **请求参数**：
```json
{
  "ids": "array, 必填, 要删除的费用ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量删除成功",
    "deletedCount": "number, 删除的数量"
  }
}
```

#### 17.3.10 记录缴费
- **接口地址**：POST /api/admin/fees/{feeId}/payment
- **功能描述**：记录费用缴费
- **请求参数**：
```json
{
  "amount": "number, 必填, 缴费金额",
  "paymentMethod": "string, 可选, 缴费方式",
  "paidBy": "string, 可选, 缴费人"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "缴费记录成功",
    "payment": {
      "id": "number, 缴费记录ID",
      "feeId": "number, 费用ID",
      "amount": "number, 缴费金额",
      "paymentMethod": "string, 缴费方式",
      "paidBy": "string, 缴费人",
      "paidAt": "string, 缴费时间"
    }
  }
}
```

#### 17.3.11 获取缴费历史
- **接口地址**：GET /api/admin/fees/{feeId}/payments
- **功能描述**：获取费用缴费历史
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "number, 缴费记录ID",
        "amount": "number, 缴费金额",
        "paymentMethod": "string, 缴费方式",
        "paidBy": "string, 缴费人",
        "paidAt": "string, 缴费时间"
      }
    ]
  }
}
```

### 17.4 系统管理接口

#### 17.4.1 获取系统统计信息
- **接口地址**：GET /api/admin/system/stats
- **功能描述**：获取系统整体统计信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": "number, 总用户数",
      "activeUsers": "number, 活跃用户数",
      "totalDormitories": "number, 总寝室数",
      "occupiedDormitories": "number, 已入住寝室数",
      "totalFees": "number, 总费用记录数",
      "pendingFees": "number, 待审核费用数",
      "systemHealth": "string, 系统健康状态",
      "uptime": "number, 系统运行时间(秒)",
      "lastBackupAt": "string, 最后备份时间"
    }
  }
}
```

#### 17.4.2 获取系统日志
- **接口地址**：GET /api/admin/system/logs
- **功能描述**：获取系统日志
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为20
  - `level` (string, 可选): 日志级别筛选（info/warn/error）
  - `startDate` (string, 可选): 开始日期（格式：YYYY-MM-DD）
  - `endDate` (string, 可选): 结束日期（格式：YYYY-MM-DD）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "number, 日志ID",
        "level": "string, 日志级别",
        "message": "string, 日志消息",
        "context": "object, 日志上下文",
        "createdAt": "string, 创建时间",
        "userId": "number, 可选, 用户ID",
        "ip": "string, 可选, IP地址"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.4.3 获取系统健康状态
- **接口地址**：GET /api/admin/system/health
- **功能描述**：获取系统健康检查状态
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "health": {
      "status": "string, 健康状态(healthy/degraded/unhealthy)",
      "timestamp": "string, 检查时间",
      "checks": {
        "database": {
          "status": "string, 数据库状态",
          "responseTime": "number, 响应时间(ms)",
          "details": "object, 详细信息"
        },
        "redis": {
          "status": "string, Redis状态",
          "responseTime": "number, 响应时间(ms)",
          "details": "object, 详细信息"
        },
        "diskSpace": {
          "status": "string, 磁盘空间状态",
          "total": "number, 总空间",
          "free": "number, 可用空间",
          "used": "number, 已用空间"
        }
      }
    }
  }
}
```

#### 17.4.4 获取系统配置
- **接口地址**：GET /api/admin/system/config
- **功能描述**：获取系统配置信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "config": {
      "siteName": "string, 站点名称",
      "siteDescription": "string, 站点描述",
      "maintenanceMode": "boolean, 维护模式状态",
      "allowRegistration": "boolean, 是否允许注册",
      "maxUsers": "number, 最大用户数",
      "sessionTimeout": "number, 会话超时时间(秒)",
      "passwordPolicy": {
        "minLength": "number, 最小长度",
        "requireUppercase": "boolean, 需要大写字母",
        "requireLowercase": "boolean, 需要小写字母",
        "requireNumbers": "boolean, 需要数字",
        "requireSpecialChars": "boolean, 需要特殊字符"
      },
      "emailSettings": {
        "smtpHost": "string, SMTP主机",
        "smtpPort": "number, SMTP端口",
        "smtpSecure": "boolean, 是否使用SSL"
      }
    }
  }
}
```

#### 17.4.5 更新系统配置
- **接口地址**：PUT /api/admin/system/config
- **功能描述**：更新系统配置
- **请求参数**：
```json
{
  "siteName": "string, 可选, 站点名称",
  "siteDescription": "string, 可选, 站点描述",
  "maintenanceMode": "boolean, 可选, 维护模式状态",
  "allowRegistration": "boolean, 可选, 是否允许注册",
  "maxUsers": "number, 可选, 最大用户数",
  "sessionTimeout": "number, 可选, 会话超时时间",
  "passwordPolicy": "object, 可选, 密码策略",
  "emailSettings": "object, 可选, 邮件设置"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "config": {
      "siteName": "string, 更新后的站点名称",
      "siteDescription": "string, 更新后的站点描述",
      "maintenanceMode": "boolean, 更新后的维护模式状态",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.4.6 获取管理员操作日志
- **接口地址**：GET /api/admin/system/admin-logs
- **功能描述**：获取管理员操作日志
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为20
  - `adminId` (number, 可选): 管理员ID筛选
  - `action` (string, 可选): 操作类型筛选
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "number, 日志ID",
        "adminId": "number, 管理员ID",
        "adminName": "string, 管理员姓名",
        "action": "string, 操作类型",
        "resource": "string, 操作资源",
        "resourceId": "string, 资源ID",
        "details": "object, 操作详情",
        "ip": "string, IP地址",
        "userAgent": "string, 用户代理",
        "createdAt": "string, 创建时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.4.7 获取用户登录日志
- **接口地址**：GET /api/admin/system/login-logs
- **功能描述**：获取用户登录日志
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为20
  - `userId` (number, 可选): 用户ID筛选
  - `status` (string, 可选): 登录状态筛选（success/failed）
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "number, 日志ID",
        "userId": "number, 用户ID",
        "username": "string, 用户名",
        "email": "string, 邮箱",
        "loginTime": "string, 登录时间",
        "loginStatus": "string, 登录状态",
        "ip": "string, IP地址",
        "userAgent": "string, 用户代理",
        "location": "string, 登录位置"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.4.8 系统数据备份
- **接口地址**：POST /api/admin/system/backup
- **功能描述**：执行系统数据备份
- **请求参数**：
```json
{
  "backupType": "string, 可选, 备份类型(full/incremental)",
  "description": "string, 可选, 备份描述"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "backupId": "string, 备份ID",
    "backupPath": "string, 备份文件路径",
    "backupSize": "number, 备份大小",
    "createdAt": "string, 创建时间"
  }
}
```

#### 17.4.9 获取备份列表
- **接口地址**：GET /api/admin/system/backups
- **功能描述**：获取系统备份列表
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "backups": [
      {
        "id": "string, 备份ID",
        "backupType": "string, 备份类型",
        "description": "string, 备份描述",
        "backupSize": "number, 备份大小",
        "backupPath": "string, 备份路径",
        "status": "string, 备份状态",
        "createdAt": "string, 创建时间",
        "completedAt": "string, 完成时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.4.10 系统数据导出
- **接口地址**：POST /api/admin/system/export
- **功能描述**：导出系统数据
- **请求参数**：
```json
{
  "exportType": "string, 必填, 导出类型(users/dormitories/fees/logs)",
  "format": "string, 可选, 导出格式(excel/csv/json)",
  "dateRange": {
    "startDate": "string, 开始日期",
    "endDate": "string, 结束日期"
  },
  "filters": "object, 可选, 导出筛选条件"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "exportId": "string, 导出ID",
    "downloadUrl": "string, 下载链接",
    "fileSize": "number, 文件大小",
    "expiresAt": "string, 过期时间"
  }
}
```

### 17.5 权限管理接口

#### 17.5.1 获取角色列表
- **接口地址**：GET /api/admin/roles
- **功能描述**：获取系统角色列表
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "number, 角色ID",
        "name": "string, 角色名称",
        "description": "string, 角色描述",
        "permissions": [
          {
            "id": "number, 权限ID",
            "name": "string, 权限名称",
            "resource": "string, 权限资源",
            "action": "string, 权限操作"
          }
        ],
        "userCount": "number, 关联用户数",
        "createdAt": "string, 创建时间",
        "updatedAt": "string, 更新时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.5.2 创建角色
- **接口地址**：POST /api/admin/roles
- **功能描述**：创建新角色
- **请求参数**：
```json
{
  "name": "string, 必填, 角色名称",
  "description": "string, 可选, 角色描述",
  "permissions": "array, 可选, 权限ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "role": {
      "id": "number, 角色ID",
      "name": "string, 角色名称",
      "description": "string, 角色描述",
      "permissions": "array, 权限列表",
      "createdAt": "string, 创建时间"
    }
  }
}
```

#### 17.5.3 获取角色详情
- **接口地址**：GET /api/admin/roles/{roleId}
- **功能描述**：获取角色详细信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "role": {
      "id": "number, 角色ID",
      "name": "string, 角色名称",
      "description": "string, 角色描述",
      "permissions": [
        {
          "id": "number, 权限ID",
          "name": "string, 权限名称",
          "resource": "string, 权限资源",
          "action": "string, 权限操作",
          "description": "string, 权限描述"
        }
      ],
      "users": [
        {
          "id": "number, 用户ID",
          "username": "string, 用户名",
          "email": "string, 邮箱",
          "status": "string, 状态"
        }
      ],
      "createdAt": "string, 创建时间",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.5.4 更新角色信息
- **接口地址**：PUT /api/admin/roles/{roleId}
- **功能描述**：更新角色信息
- **请求参数**：
```json
{
  "name": "string, 可选, 角色名称",
  "description": "string, 可选, 角色描述",
  "permissions": "array, 可选, 权限ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "role": {
      "id": "number, 角色ID",
      "name": "string, 更新后的角色名称",
      "description": "string, 更新后的角色描述",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.5.5 删除角色
- **接口地址**：DELETE /api/admin/roles/{roleId}
- **功能描述**：删除角色
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "角色删除成功"
  }
}
```

#### 17.5.6 获取权限列表
- **接口地址**：GET /api/admin/permissions
- **功能描述**：获取系统权限列表
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "number, 权限ID",
        "name": "string, 权限名称",
        "resource": "string, 权限资源",
        "action": "string, 权限操作",
        "description": "string, 权限描述",
        "category": "string, 权限分类"
      }
    ]
  }
}
```

#### 17.5.7 分配用户角色
- **接口地址**：PUT /api/admin/users/{userId}/roles
- **功能描述**：为用户分配角色
- **请求参数**：
```json
{
  "roleIds": "array, 必填, 角色ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "角色分配成功",
    "userId": "number, 用户ID",
    "roles": "array, 分配的角色列表"
  }
}
```

#### 17.5.8 获取用户权限
- **接口地址**：GET /api/admin/users/{userId}/permissions
- **功能描述**：获取用户权限列表
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "number, 权限ID",
        "name": "string, 权限名称",
        "resource": "string, 权限资源",
        "action": "string, 权限操作",
        "grantedThrough": "string, 授权方式(direct/role)"
      }
    ]
  }
}
```

### 17.6 系统通知接口

#### 17.6.1 获取通知列表
- **接口地址**：GET /api/admin/notifications
- **功能描述**：获取系统通知列表
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
  - `status` (string, 可选): 状态筛选（draft/sent/cancelled）
  - `type` (string, 可选): 类型筛选（system/maintenance/fee/dormitory）
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "number, 通知ID",
        "title": "string, 通知标题",
        "content": "string, 通知内容",
        "type": "string, 通知类型",
        "status": "string, 通知状态",
        "priority": "string, 优先级",
        "targetType": "string, 目标类型(all/specific/role)",
        "targetIds": "array, 目标ID数组",
        "scheduledAt": "string, 可选, 计划发送时间",
        "sentAt": "string, 可选, 实际发送时间",
        "createdBy": "string, 创建人",
        "createdAt": "string, 创建时间",
        "updatedAt": "string, 更新时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.6.2 创建通知
- **接口地址**：POST /api/admin/notifications
- **功能描述**：创建系统通知
- **请求参数**：
```json
{
  "title": "string, 必填, 通知标题",
  "content": "string, 必填, 通知内容",
  "type": "string, 必填, 通知类型",
  "priority": "string, 可选, 优先级(normal/high/urgent)",
  "targetType": "string, 必填, 目标类型(all/specific/role)",
  "targetIds": "array, 可选, 目标ID数组",
  "scheduledAt": "string, 可选, 计划发送时间"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "number, 通知ID",
      "title": "string, 通知标题",
      "content": "string, 通知内容",
      "type": "string, 通知类型",
      "priority": "string, 优先级",
      "targetType": "string, 目标类型",
      "status": "string, 通知状态",
      "createdBy": "string, 创建人",
      "createdAt": "string, 创建时间"
    }
  }
}
```

#### 17.6.3 获取通知详情
- **接口地址**：GET /api/admin/notifications/{notificationId}
- **功能描述**：获取通知详细信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "number, 通知ID",
      "title": "string, 通知标题",
      "content": "string, 通知内容",
      "type": "string, 通知类型",
      "status": "string, 通知状态",
      "priority": "string, 优先级",
      "targetType": "string, 目标类型",
      "targetIds": "array, 目标ID数组",
      "targetUsers": [
        {
          "id": "number, 用户ID",
          "username": "string, 用户名",
          "email": "string, 邮箱"
        }
      ],
      "deliveryStats": {
        "totalRecipients": "number, 总接收人数",
        "deliveredCount": "number, 已送达人数",
        "readCount": "number, 已读人数"
      },
      "scheduledAt": "string, 计划发送时间",
      "sentAt": "string, 实际发送时间",
      "createdBy": "string, 创建人",
      "createdAt": "string, 创建时间",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.6.4 更新通知
- **接口地址**：PUT /api/admin/notifications/{notificationId}
- **功能描述**：更新通知信息
- **请求参数**：
```json
{
  "title": "string, 可选, 通知标题",
  "content": "string, 可选, 通知内容",
  "type": "string, 可选, 通知类型",
  "priority": "string, 可选, 优先级",
  "targetType": "string, 可选, 目标类型",
  "targetIds": "array, 可选, 目标ID数组",
  "scheduledAt": "string, 可选, 计划发送时间"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "number, 通知ID",
      "title": "string, 更新后的标题",
      "content": "string, 更新后的内容",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.6.5 删除通知
- **接口地址**：DELETE /api/admin/notifications/{notificationId}
- **功能描述**：删除通知
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "通知删除成功"
  }
}
```

#### 17.6.6 发送通知
- **接口地址**：POST /api/admin/notifications/{notificationId}/send
- **功能描述**：发送通知
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "通知发送成功",
    "sentAt": "string, 发送时间"
  }
}
```

#### 17.6.7 取消通知
- **接口地址**：POST /api/admin/notifications/{notificationId}/cancel
- **功能描述**：取消通知
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "通知取消成功",
    "cancelledAt": "string, 取消时间"
  }
}
```

#### 17.6.8 获取通知模板列表
- **接口地址**：GET /api/admin/notification-templates
- **功能描述**：获取通知模板列表
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "number, 模板ID",
        "name": "string, 模板名称",
        "type": "string, 模板类型",
        "titleTemplate": "string, 标题模板",
        "contentTemplate": "string, 内容模板",
        "variables": "array, 模板变量",
        "description": "string, 模板描述",
        "isActive": "boolean, 是否激活",
        "createdAt": "string, 创建时间"
      }
    ]
  }
}
```

#### 17.6.9 创建通知模板
- **接口地址**：POST /api/admin/notification-templates
- **功能描述**：创建通知模板
- **请求参数**：
```json
{
  "name": "string, 必填, 模板名称",
  "type": "string, 必填, 模板类型",
  "titleTemplate": "string, 必填, 标题模板",
  "contentTemplate": "string, 必填, 内容模板",
  "variables": "array, 可选, 模板变量",
  "description": "string, 可选, 模板描述"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "number, 模板ID",
      "name": "string, 模板名称",
      "type": "string, 模板类型",
      "titleTemplate": "string, 标题模板",
      "contentTemplate": "string, 内容模板",
      "createdAt": "string, 创建时间"
    }
  }
}
```

#### 17.6.10 获取通知发送记录
- **接口地址**：GET /api/admin/notifications/{notificationId}/delivery-records
- **功能描述**：获取通知发送记录
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为20
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "deliveryRecords": [
      {
        "id": "number, 发送记录ID",
        "userId": "number, 用户ID",
        "username": "string, 用户名",
        "email": "string, 用户邮箱",
        "deliveryStatus": "string, 发送状态",
        "readStatus": "boolean, 是否已读",
        "deliveredAt": "string, 发送时间",
        "readAt": "string, 可选, 阅读时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

### 17.7 客户端特性控制接口

#### 17.7.1 获取客户端特性配置
- **接口地址**：GET /api/admin/client-features
- **功能描述**：获取客户端特性配置列表
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
  - `featureType` (string, 可选): 特性类型筛选
  - `status` (string, 可选): 状态筛选（enabled/disabled）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "features": [
      {
        "id": "number, 特性ID",
        "name": "string, 特性名称",
        "key": "string, 特性键名",
        "description": "string, 特性描述",
        "featureType": "string, 特性类型",
        "defaultValue": "boolean/string/number, 默认值",
        "currentValue": "boolean/string/number, 当前值",
        "status": "string, 状态(enabled/disabled)",
        "rolloutPercentage": "number, 可选, 灰度发布百分比",
        "targetUsers": "array, 可选, 目标用户ID数组",
        "targetRoles": "array, 可选, 目标角色数组",
        "versionConstraints": "object, 可选, 版本约束",
        "updatedBy": "string, 更新人",
        "updatedAt": "string, 更新时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.7.2 创建客户端特性
- **接口地址**：POST /api/admin/client-features
- **功能描述**：创建客户端特性配置
- **请求参数**：
```json
{
  "name": "string, 必填, 特性名称",
  "key": "string, 必填, 特性键名",
  "description": "string, 可选, 特性描述",
  "featureType": "string, 必填, 特性类型",
  "defaultValue": "boolean/string/number, 必填, 默认值",
  "currentValue": "boolean/string/number, 可选, 当前值",
  "rolloutPercentage": "number, 可选, 灰度发布百分比",
  "targetUsers": "array, 可选, 目标用户ID数组",
  "targetRoles": "array, 可选, 目标角色数组",
  "versionConstraints": "object, 可选, 版本约束"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "feature": {
      "id": "number, 特性ID",
      "name": "string, 特性名称",
      "key": "string, 特性键名",
      "description": "string, 特性描述",
      "featureType": "string, 特性类型",
      "defaultValue": "boolean/string/number, 默认值",
      "currentValue": "boolean/string/number, 当前值",
      "status": "string, 状态",
      "createdBy": "string, 创建人",
      "createdAt": "string, 创建时间"
    }
  }
}
```

#### 17.7.3 更新客户端特性
- **接口地址**：PUT /api/admin/client-features/{featureId}
- **功能描述**：更新客户端特性配置
- **请求参数**：
```json
{
  "name": "string, 可选, 特性名称",
  "description": "string, 可选, 特性描述",
  "currentValue": "boolean/string/number, 可选, 当前值",
  "status": "string, 可选, 状态(enabled/disabled)",
  "rolloutPercentage": "number, 可选, 灰度发布百分比",
  "targetUsers": "array, 可选, 目标用户ID数组",
  "targetRoles": "array, 可选, 目标角色数组",
  "versionConstraints": "object, 可选, 版本约束"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "feature": {
      "id": "number, 特性ID",
      "name": "string, 特性名称",
      "key": "string, 特性键名",
      "description": "string, 更新后的描述",
      "currentValue": "boolean/string/number, 更新后的值",
      "status": "string, 更新后的状态",
      "updatedBy": "string, 更新人",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.7.4 删除客户端特性
- **接口地址**：DELETE /api/admin/client-features/{featureId}
- **功能描述**：删除客户端特性配置
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "客户端特性删除成功"
  }
}
```

#### 17.7.5 批量启用客户端特性
- **接口地址**：POST /api/admin/client-features/batch-enable
- **功能描述**：批量启用客户端特性
- **请求参数**：
```json
{
  "featureIds": "array, 必填, 特性ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量启用成功",
    "enabledCount": "number, 启用数量"
  }
}
```

#### 17.7.6 批量禁用客户端特性
- **接口地址**：POST /api/admin/client-features/batch-disable
- **功能描述**：批量禁用客户端特性
- **请求参数**：
```json
{
  "featureIds": "array, 必填, 特性ID数组"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量禁用成功",
    "disabledCount": "number, 禁用数量"
  }
}
```

#### 17.7.7 获取客户端特性使用统计
- **接口地址**：GET /api/admin/client-features/statistics
- **功能描述**：获取客户端特性使用统计信息
- **请求参数**：
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalFeatures": "number, 总特性数",
      "enabledFeatures": "number, 启用特性数",
      "disabledFeatures": "number, 禁用特性数",
      "featureUsage": [
        {
          "featureId": "number, 特性ID",
          "featureName": "string, 特性名称",
          "enabledCount": "number, 启用用户数",
          "disabledCount": "number, 禁用用户数",
          "usagePercentage": "number, 使用率百分比"
        }
      ],
      "recentChanges": [
        {
          "featureId": "number, 特性ID",
          "featureName": "string, 特性名称",
          "changeType": "string, 变更类型",
          "changedBy": "string, 变更人",
          "changedAt": "string, 变更时间"
        }
      ]
    }
  }
}
```

### 17.8 管理员行为监控接口

#### 17.8.1 获取管理员行为日志
- **接口地址**：GET /api/admin/admin-behavior-logs
- **功能描述**：获取管理员行为日志列表
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
  - `adminId` (number, 可选): 管理员ID筛选
  - `actionType` (string, 可选): 行为类型筛选
  - `resourceType` (string, 可选): 资源类型筛选
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
  - `status` (string, 可选): 状态筛选（success/failed）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "number, 日志ID",
        "adminId": "number, 管理员ID",
        "adminUsername": "string, 管理员用户名",
        "adminEmail": "string, 管理员邮箱",
        "actionType": "string, 行为类型",
        "resourceType": "string, 资源类型",
        "resourceId": "string, 可选, 资源ID",
        "resourceName": "string, 可选, 资源名称",
        "actionDescription": "string, 行为描述",
        "requestMethod": "string, 请求方法",
        "requestUrl": "string, 请求URL",
        "requestParams": "object, 请求参数",
        "responseStatus": "number, 响应状态码",
        "responseMessage": "string, 可选, 响应消息",
        "ipAddress": "string, IP地址",
        "userAgent": "string, 用户代理",
        "status": "string, 状态",
        "errorMessage": "string, 可选, 错误消息",
        "executionTime": "number, 执行时间(毫秒)",
        "createdAt": "string, 创建时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.8.2 获取管理员行为统计
- **接口地址**：GET /api/admin/admin-behavior-statistics
- **功能描述**：获取管理员行为统计信息
- **请求参数**：
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
  - `adminId` (number, 可选): 管理员ID
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalActions": "number, 总操作数",
      "successActions": "number, 成功操作数",
      "failedActions": "number, 失败操作数",
      "averageExecutionTime": "number, 平均执行时间",
      "actionTypeStats": [
        {
          "actionType": "string, 行为类型",
          "count": "number, 操作次数",
          "successRate": "number, 成功率"
        }
      ],
      "resourceTypeStats": [
        {
          "resourceType": "string, 资源类型",
          "count": "number, 操作次数",
          "successRate": "number, 成功率"
        }
      ],
      "topAdmins": [
        {
          "adminId": "number, 管理员ID",
          "username": "string, 用户名",
          "actionCount": "number, 操作次数",
          "successRate": "number, 成功率"
        }
      ],
      "recentActivities": [
        {
          "id": "number, 日志ID",
          "adminUsername": "string, 管理员用户名",
          "actionType": "string, 行为类型",
          "resourceType": "string, 资源类型",
          "actionDescription": "string, 行为描述",
          "status": "string, 状态",
          "createdAt": "string, 创建时间"
        }
      ]
    }
  }
}
```

#### 17.8.3 导出管理员行为日志
- **接口地址**：POST /api/admin/admin-behavior-logs/export
- **功能描述**：导出管理员行为日志
- **请求参数**：
```json
{
  "format": "string, 必填, 导出格式(csv/json)",
  "startDate": "string, 可选, 开始日期",
  "endDate": "string, 可选, 结束日期",
  "adminIds": "array, 可选, 管理员ID数组",
  "actionTypes": "array, 可选, 行为类型数组",
  "resourceTypes": "array, 可选, 资源类型数组",
  "status": "string, 可选, 状态筛选"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "downloadUrl": "string, 下载链接",
    "fileName": "string, 文件名",
    "recordCount": "number, 记录数量",
    "expiresAt": "string, 过期时间"
  }
}
```

#### 17.8.4 获取高风险操作列表
- **接口地址**：GET /api/admin/admin-high-risk-operations
- **功能描述**：获取高风险操作列表
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
  - `riskLevel` (string, 可选): 风险等级筛选（high/critical）
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
  - `adminId` (number, 可选): 管理员ID
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "operations": [
      {
        "id": "number, 操作ID",
        "adminId": "number, 管理员ID",
        "adminUsername": "string, 管理员用户名",
        "operationType": "string, 操作类型",
        "riskLevel": "string, 风险等级",
        "riskScore": "number, 风险评分",
        "operationDescription": "string, 操作描述",
        "resourceType": "string, 资源类型",
        "resourceId": "string, 资源ID",
        "resourceName": "string, 资源名称",
        "operationTime": "string, 操作时间",
        "ipAddress": "string, IP地址",
        "location": "string, 可选, 地理位置",
        "deviceInfo": "object, 设备信息",
        "suspiciousIndicators": "array, 可疑指标",
        "status": "string, 状态(pending/reviewed/resolved)",
        "reviewedBy": "string, 可选, 审核人",
        "reviewedAt": "string, 可选, 审核时间",
        "reviewNotes": "string, 可选, 审核备注"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.8.5 标记高风险操作状态
- **接口地址**：PUT /api/admin/admin-high-risk-operations/{operationId}/status
- **功能描述**：标记高风险操作状态
- **请求参数**：
```json
{
  "status": "string, 必填, 状态(pending/reviewed/resolved)",
  "reviewNotes": "string, 可选, 审核备注"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "状态更新成功",
    "operation": {
      "id": "number, 操作ID",
      "status": "string, 更新后的状态",
      "reviewedBy": "string, 审核人",
      "reviewedAt": "string, 审核时间",
      "reviewNotes": "string, 审核备注"
    }
  }
}
```

### 17.9 管理员权限管理接口

#### 17.9.1 获取管理员权限列表
- **接口地址**：GET /api/admin/admin-permissions
- **功能描述**：获取管理员权限列表
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
  - `adminId` (number, 可选): 管理员ID筛选
  - `permissionType` (string, 可选): 权限类型筛选
  - `resourceType` (string, 可选): 资源类型筛选
  - `status` (string, 可选): 状态筛选（active/inactive）
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "number, 权限ID",
        "adminId": "number, 管理员ID",
        "adminUsername": "string, 管理员用户名",
        "permissionType": "string, 权限类型",
        "resourceType": "string, 资源类型",
        "resourceId": "string, 可选, 资源ID",
        "resourceName": "string, 可选, 资源名称",
        "actions": "array, 允许的操作",
        "grantedBy": "string, 授权人",
        "grantedAt": "string, 授权时间",
        "expiresAt": "string, 可选, 过期时间",
        "status": "string, 状态",
        "description": "string, 权限描述"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.9.2 创建管理员权限
- **接口地址**：POST /api/admin/admin-permissions
- **功能描述**：为管理员创建权限
- **请求参数**：
```json
{
  "adminId": "number, 必填, 管理员ID",
  "permissionType": "string, 必填, 权限类型",
  "resourceType": "string, 必填, 资源类型",
  "resourceId": "string, 可选, 资源ID",
  "actions": "array, 必填, 允许的操作",
  "expiresAt": "string, 可选, 过期时间",
  "description": "string, 可选, 权限描述"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "permission": {
      "id": "number, 权限ID",
      "adminId": "number, 管理员ID",
      "adminUsername": "string, 管理员用户名",
      "permissionType": "string, 权限类型",
      "resourceType": "string, 资源类型",
      "actions": "array, 允许的操作",
      "grantedBy": "string, 授权人",
      "grantedAt": "string, 授权时间",
      "status": "string, 状态"
    }
  }
}
```

#### 17.9.3 更新管理员权限
- **接口地址**：PUT /api/admin/admin-permissions/{permissionId}
- **功能描述**：更新管理员权限
- **请求参数**：
```json
{
  "actions": "array, 可选, 允许的操作",
  "expiresAt": "string, 可选, 过期时间",
  "status": "string, 可选, 状态(active/inactive)",
  "description": "string, 可选, 权限描述"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "permission": {
      "id": "number, 权限ID",
      "actions": "array, 更新后的操作",
      "expiresAt": "string, 可选, 过期时间",
      "status": "string, 更新后的状态",
      "updatedBy": "string, 更新人",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.9.4 删除管理员权限
- **接口地址**：DELETE /api/admin/admin-permissions/{permissionId}
- **功能描述**：删除管理员权限
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "管理员权限删除成功"
  }
}
```

#### 17.9.5 批量分配管理员权限
- **接口地址**：POST /api/admin/admin-permissions/batch-assign
- **功能描述**：批量分配管理员权限
- **请求参数**：
```json
{
  "adminIds": "array, 必填, 管理员ID数组",
  "permissionType": "string, 必填, 权限类型",
  "resourceType": "string, 必填, 资源类型",
  "resourceId": "string, 可选, 资源ID",
  "actions": "array, 必填, 允许的操作",
  "expiresAt": "string, 可选, 过期时间",
  "description": "string, 可选, 权限描述"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量分配成功",
    "assignedCount": "number, 分配数量",
    "permissions": [
      {
        "id": "number, 权限ID",
        "adminId": "number, 管理员ID",
        "adminUsername": "string, 管理员用户名",
        "permissionType": "string, 权限类型",
        "resourceType": "string, 资源类型",
        "status": "string, 状态"
      }
    ]
  }
}
```

#### 17.9.6 批量撤销管理员权限
- **接口地址**：POST /api/admin/admin-permissions/batch-revoke
- **功能描述**：批量撤销管理员权限
- **请求参数**：
```json
{
  "permissionIds": "array, 必填, 权限ID数组",
  "reason": "string, 可选, 撤销原因"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "批量撤销成功",
    "revokedCount": "number, 撤销数量"
  }
}
```

#### 17.9.7 获取管理员权限统计
- **接口地址**：GET /api/admin/admin-permissions/statistics
- **功能描述**：获取管理员权限统计信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalPermissions": "number, 总权限数",
      "activePermissions": "number, 活跃权限数",
      "inactivePermissions": "number, 非活跃权限数",
      "permissionTypeStats": [
        {
          "permissionType": "string, 权限类型",
          "count": "number, 权限数量",
          "percentage": "number, 占比"
        }
      ],
      "resourceTypeStats": [
        {
          "resourceType": "string, 资源类型",
          "count": "number, 权限数量",
          "percentage": "number, 占比"
        }
      ],
      "recentGrants": [
        {
          "permissionId": "number, 权限ID",
          "adminUsername": "string, 管理员用户名",
          "permissionType": "string, 权限类型",
          "grantedBy": "string, 授权人",
          "grantedAt": "string, 授权时间"
        }
      ],
      "expiringSoon": [
        {
          "permissionId": "number, 权限ID",
          "adminUsername": "string, 管理员用户名",
          "permissionType": "string, 权限类型",
          "expiresAt": "string, 过期时间",
          "daysUntilExpiry": "number, 剩余天数"
        }
      ]
    }
  }
}
```

### 17.10 数据备份与恢复接口

#### 17.10.1 获取备份任务列表
- **接口地址**：GET /api/admin/backup-tasks
- **功能描述**：获取数据备份任务列表
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
  - `status` (string, 可选): 状态筛选（pending/running/success/failed）
  - `backupType` (string, 可选): 备份类型筛选（full/incremental）
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "number, 任务ID",
        "taskName": "string, 任务名称",
        "backupType": "string, 备份类型",
        "status": "string, 任务状态",
        "description": "string, 任务描述",
        "databaseName": "string, 数据库名称",
        "backupSize": "number, 备份文件大小(字节)",
        "backupPath": "string, 备份文件路径",
        "backupDuration": "number, 备份耗时(秒)",
        "scheduledAt": "string, 计划执行时间",
        "startedAt": "string, 开始执行时间",
        "completedAt": "string, 完成时间",
        "errorMessage": "string, 可选, 错误信息",
        "createdBy": "string, 创建人",
        "createdAt": "string, 创建时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.10.2 创建备份任务
- **接口地址**：POST /api/admin/backup-tasks
- **功能描述**：创建数据备份任务
- **请求参数**：
```json
{
  "taskName": "string, 必填, 任务名称",
  "backupType": "string, 必填, 备份类型(full/incremental)",
  "description": "string, 可选, 任务描述",
  "databaseName": "string, 可选, 数据库名称",
  "tables": "array, 可选, 指定备份的表",
  "scheduledAt": "string, 可选, 计划执行时间",
  "backupPath": "string, 可选, 备份路径",
  "compressionEnabled": "boolean, 可选, 是否启用压缩",
  "encryptionEnabled": "boolean, 可选, 是否启用加密"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "number, 任务ID",
      "taskName": "string, 任务名称",
      "backupType": "string, 备份类型",
      "status": "string, 任务状态",
      "description": "string, 任务描述",
      "scheduledAt": "string, 计划执行时间",
      "createdBy": "string, 创建人",
      "createdAt": "string, 创建时间"
    }
  }
}
```

#### 17.10.3 获取备份任务详情
- **接口地址**：GET /api/admin/backup-tasks/{taskId}
- **功能描述**：获取备份任务详细信息
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "number, 任务ID",
      "taskName": "string, 任务名称",
      "backupType": "string, 备份类型",
      "status": "string, 任务状态",
      "description": "string, 任务描述",
      "databaseName": "string, 数据库名称",
      "tables": "array, 备份的表",
      "backupSize": "number, 备份文件大小",
      "backupPath": "string, 备份文件路径",
      "backupDuration": "number, 备份耗时",
      "compressionEnabled": "boolean, 是否启用压缩",
      "encryptionEnabled": "boolean, 是否启用加密",
      "checksum": "string, 文件校验和",
      "scheduledAt": "string, 计划执行时间",
      "startedAt": "string, 开始执行时间",
      "completedAt": "string, 完成时间",
      "errorMessage": "string, 可选, 错误信息",
      "progress": "number, 任务进度(百分比)",
      "createdBy": "string, 创建人",
      "createdAt": "string, 创建时间",
      "updatedAt": "string, 更新时间"
    }
  }
}
```

#### 17.10.4 执行备份任务
- **接口地址**：POST /api/admin/backup-tasks/{taskId}/execute
- **功能描述**：立即执行备份任务
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "备份任务开始执行",
    "task": {
      "id": "number, 任务ID",
      "status": "string, 任务状态",
      "startedAt": "string, 开始时间"
    }
  }
}
```

#### 17.10.5 删除备份任务
- **接口地址**：DELETE /api/admin/backup-tasks/{taskId}
- **功能描述**：删除备份任务
- **请求参数**：无
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "message": "备份任务删除成功"
  }
}
```

#### 17.10.6 获取恢复任务列表
- **接口地址**：GET /api/admin/restore-tasks
- **功能描述**：获取数据恢复任务列表
- **请求参数**：
  - `page` (number, 可选): 页码，默认为1
  - `pageSize` (number, 可选): 每页数量，默认为10
  - `status` (string, 可选): 状态筛选
  - `backupTaskId` (number, 可选): 备份任务ID筛选
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "number, 任务ID",
        "taskName": "string, 任务名称",
        "backupTaskId": "number, 备份任务ID",
        "backupTaskName": "string, 备份任务名称",
        "status": "string, 任务状态",
        "description": "string, 任务描述",
        "restoreSize": "number, 恢复数据大小",
        "restoreDuration": "number, 恢复耗时",
        "targetDatabase": "string, 目标数据库",
        "restoreOptions": "object, 恢复选项",
        "startedAt": "string, 开始时间",
        "completedAt": "string, 完成时间",
        "errorMessage": "string, 可选, 错误信息",
        "createdBy": "string, 创建人",
        "createdAt": "string, 创建时间"
      }
    ],
    "total": "number, 总记录数",
    "page": "number, 当前页码",
    "pageSize": "number, 每页数量"
  }
}
```

#### 17.10.7 创建恢复任务
- **接口地址**：POST /api/admin/restore-tasks
- **功能描述**：创建数据恢复任务
- **请求参数**：
```json
{
  "taskName": "string, 必填, 任务名称",
  "backupTaskId": "number, 必填, 备份任务ID",
  "description": "string, 可选, 任务描述",
  "targetDatabase": "string, 可选, 目标数据库",
  "restoreOptions": "object, 可选, 恢复选项",
  "tables": "array, 可选, 指定恢复的表"
}
```
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "number, 任务ID",
      "taskName": "string, 任务名称",
      "backupTaskId": "number, 备份任务ID",
      "status": "string, 任务状态",
      "description": "string, 任务描述",
      "createdBy": "string, 创建人",
      "createdAt": "string, 创建时间"
    }
  }
}
```

#### 17.10.8 获取备份统计信息
- **接口地址**：GET /api/admin/backup-statistics
- **功能描述**：获取备份统计信息
- **请求参数**：
  - `startDate` (string, 可选): 开始日期
  - `endDate` (string, 可选): 结束日期
- **响应数据结构**：
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalBackupTasks": "number, 总备份任务数",
      "successfulBackups": "number, 成功备份数",
      "failedBackups": "number, 失败备份数",
      "totalBackupSize": "number, 总备份大小(字节)",
      "averageBackupDuration": "number, 平均备份耗时(秒)",
      "backupTypeStats": [
        {
          "backupType": "string, 备份类型",
          "count": "number, 任务数量",
          "totalSize": "number, 总大小"
        }
      ],
      "recentBackups": [
        {
          "taskId": "number, 任务ID",
          "taskName": "string, 任务名称",
          "status": "string, 任务状态",
          "backupSize": "number, 备份大小",
          "completedAt": "string, 完成时间"
        }
      ],
      "storageUsage": {
        "totalUsed": "number, 已使用存储空间",
        "availableSpace": "number, 可用存储空间",
        "usagePercentage": "number, 使用率百分比"
      }
    }
  }
}
```

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

## 十八、管理端认证模块

### 18.1 管理员登录

#### 18.1.1 管理员登录
- **接口地址**: `/api/admin/login`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "username": "string",     // 用户名，必填
  "password": "string"      // 密码，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "token": "string",           // JWT访问令牌
    "refreshToken": "string",    // 刷新令牌
    "userInfo": {
      "id": "number",            // 管理员ID
      "username": "string",      // 用户名
      "email": "string",         // 邮箱
      "role": "string",          // 角色
      "permissions": "array",    // 权限列表
      "adminLevel": "string"     // 管理员级别
    },
    "expiresIn": "number"        // 令牌有效期（秒）
  },
  "message": "登录成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 管理员登录认证，支持限流保护（每分钟最多5次尝试）

#### 18.1.2 管理员登出
- **接口地址**: `/api/admin/logout`
- **请求方法**: `POST`
- **请求头**: `Authorization: Bearer <token>`
- **请求参数**:
```json
{
  "refreshToken": "string"    // 刷新令牌，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": null,
  "message": "登出成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 管理员退出登录，清除会话信息

#### 18.1.3 获取管理员资料
- **接口地址**: `/api/admin/profile`
- **请求方法**: `GET`
- **请求头**: `Authorization: Bearer <token>`
- **请求参数**: 无
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "number",            // 管理员ID
      "username": "string",      // 用户名
      "email": "string",         // 邮箱
      "role": "string",          // 角色
      "permissions": "array",    // 权限列表
      "adminLevel": "string"     // 管理员级别
    }
  },
  "message": "获取管理员资料成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 获取当前登录管理员的详细资料

#### 18.1.4 刷新管理员令牌
- **接口地址**: `/api/admin/refresh-token`
- **请求方法**: `POST`
- **请求参数**:
```json
{
  "refreshToken": "string"    // 刷新令牌，必填
}
```
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "token": "string",           // 新的访问令牌
    "expiresIn": "number"        // 有效期（秒）
  },
  "message": "令牌刷新成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 使用刷新令牌获取新的访问令牌

#### 18.1.5 验证管理员令牌
- **接口地址**: `/api/admin/verify`
- **请求方法**: `GET`
- **请求头**: `Authorization: Bearer <token>`
- **请求参数**: 无
- **返回结果**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "number",            // 管理员ID
      "username": "string",      // 用户名
      "email": "string",         // 邮箱
      "role": "string",          // 角色
      "permissions": "array",    // 权限列表
      "adminLevel": "string"     // 管理员级别
    }
  },
  "message": "管理员令牌有效",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- **功能描述**: 验证管理员访问令牌的有效性

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