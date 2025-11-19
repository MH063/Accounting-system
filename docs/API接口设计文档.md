# 记账系统API接口设计文档

## 📋 文档说明
本文档定义了记账系统的完整API接口规范，包括认证、用户管理、寝室管理、费用管理、支付功能等核心模块的接口设计。

## 📖 目录

### 1. API设计规范
1.1 接口命名规范
1.2 请求响应格式
1.3 状态码定义
1.4 错误处理机制

### 2. 认证与授权
2.1 用户登录
2.2 Token管理
2.3 权限验证

### 3. 用户管理接口
3.1 用户注册
3.2 用户信息管理
3.3 用户权限管理

### 4. 寝室管理接口
4.1 寝室创建与设置
4.2 成员管理
4.3 邀请码管理

### 5. 费用管理接口
5.1 费用记录
5.2 费用审核
5.3 智能分摊

### 6. 支付功能接口
6.1 收款码管理
6.2 扫码支付
6.3 支付状态管理

### 7. 账单管理接口
7.1 账单生成
7.2 账单查询
7.3 支付记录

### 8. 统计分析接口
8.1 支出统计
8.2 趋势分析
8.3 数据导出

### 9. 系统管理接口
9.1 用户管理
9.2 系统配置
9.3 通知管理

---

## 1. API设计规范

### 1.1 接口命名规范
- **基础URL**: `https://api.example.com/v1`
- **HTTP方法**: GET(查询)、POST(创建)、PUT(更新)、DELETE(删除)
- **路径命名**: 使用小写字母和下划线，遵循RESTful风格
- **版本控制**: URL路径中包含版本号

### 1.2 请求响应格式
**请求格式**
```json
{
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {token}"
  }
}
```

**响应格式**
```json
{
  "success": true,
  "data": {
    // 具体数据内容
  },
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 1.3 状态码定义
- **200**: 请求成功
- **201**: 资源创建成功
- **400**: 请求参数错误
- **401**: 未授权访问
- **403**: 权限不足
- **404**: 资源不存在
- **409**: 资源冲突
- **500**: 服务器内部错误

### 1.4 错误处理机制
**错误响应格式**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "请求参数错误",
    "details": {
      "field": "username",
      "reason": "用户名不能为空"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 2. 认证与授权

### 2.1 用户登录
**接口**: `POST /v1/auth/login`

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "invitation_code": "1234" // 注册时必填
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "张三",
      "role": "normal_user",
      "room_id": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_here",
    "expires_in": 3600
  }
}
```

### 2.2 Token管理
**接口**: `POST /v1/auth/refresh`

**请求参数**:
```json
{
  "refresh_token": "refresh_token_here"
}
```

**接口**: `POST /v1/auth/logout`
**说明**: 用户登出，需要携带有效的Access Token

### 2.3 权限验证
**说明**: 所有需要认证的接口都需要在Header中携带有效的Authorization token

---

## 3. 用户管理接口

### 3.1 用户注册
**接口**: `POST /v1/users/register`

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "张三",
  "phone": "13800138000",
  "invitation_code": "1234",
  "room_id": 1
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "张三",
      "role": "normal_user",
      "room_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 3.2 用户信息管理
**接口**: `GET /v1/users/profile`
**说明**: 获取当前用户信息

**接口**: `PUT /v1/users/profile`
**请求参数**:
```json
{
  "username": "新用户名",
  "phone": "13800138001",
  "avatar": "https://example.com/avatar.jpg"
}
```

### 3.3 用户权限管理
**接口**: `GET /v1/users/permissions`
**说明**: 获取当前用户的权限列表

---

## 4. 寝室管理接口

### 4.1 寝室创建与设置
**接口**: `POST /v1/rooms`

**请求参数**:
```json
{
  "room_name": "A栋101寝室",
  "room_number": "A101",
  "building": "A栋",
  "floor": 1,
  "capacity": 4,
  "description": "四人间标准寝室"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "room": {
      "id": 1,
      "room_name": "A栋101寝室",
      "room_number": "A101",
      "building": "A栋",
      "floor": 1,
      "capacity": 4,
      "leader_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

**接口**: `GET /v1/rooms/{room_id}`
**说明**: 获取寝室详细信息

**接口**: `PUT /v1/rooms/{room_id}`
**说明**: 更新寝室信息

### 4.2 成员管理
**接口**: `GET /v1/rooms/{room_id}/members`
**说明**: 获取寝室成员列表

**响应数据**:
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 1,
        "username": "张三",
        "email": "zhang@example.com",
        "role": "leader",
        "status": "active",
        "joined_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

**接口**: `POST /v1/rooms/{room_id}/members`
**说明**: 添加成员到寝室

**接口**: `DELETE /v1/rooms/{room_id}/members/{user_id}`
**说明**: 从寝室中移除成员

### 4.3 邀请码管理
**接口**: `POST /v1/rooms/{room_id}/invitation-codes`

**请求参数**:
```json
{
  "max_uses": 1,
  "expires_at": "2024-01-31T23:59:59Z"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "invitation_code": {
      "code": "1234",
      "room_id": 1,
      "max_uses": 1,
      "used_count": 0,
      "expires_at": "2024-01-31T23:59:59Z",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

**接口**: `POST /v1/invitation-codes/validate`
**请求参数**:
```json
{
  "code": "1234"
}
```

---

## 5. 费用管理接口

### 5.1 费用记录
**接口**: `POST /v1/expenses`

**请求参数**:
```json
{
  "room_id": 1,
  "title": "电费缴费",
  "description": "2024年1月电费",
  "amount": 120.50,
  "expense_type": "utilities",
  "expense_date": "2024-01-15",
  "due_date": "2024-01-25",
  "created_by": 1
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "expense": {
      "id": 1,
      "room_id": 1,
      "title": "电费缴费",
      "description": "2024年1月电费",
      "amount": 120.50,
      "expense_type": "utilities",
      "expense_date": "2024-01-15",
      "due_date": "2024-01-25",
      "status": "pending_review",
      "created_by": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

**接口**: `GET /v1/expenses`
**查询参数**:
- `room_id`: 寝室ID
- `status`: 费用状态 (pending_review, approved, rejected)
- `expense_type`: 费用类型
- `start_date`: 开始日期
- `end_date`: 结束日期

### 5.2 费用审核
**接口**: `PUT /v1/expenses/{expense_id}/review`

**请求参数**:
```json
{
  "status": "approved",
  "reviewer_id": 2,
  "review_comment": "费用确认无误"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "expense": {
      "id": 1,
      "status": "approved",
      "reviewed_by": 2,
      "reviewed_at": "2024-01-02T00:00:00Z",
      "review_comment": "费用确认无误"
    }
  }
}
```

### 5.3 智能分摊
**接口**: `POST /v1/expenses/{expense_id}/calculate-splits`

**请求参数**:
```json
{
  "calculation_method": "smart", // basic, smart, custom
  "custom_splits": [
    {
      "user_id": 1,
      "percentage": 25.0
    }
  ],
  "exclude_users": [3], // 不参与分摊的用户ID列表
  "start_date": "2024-01-01", // 计算起始日期
  "end_date": "2024-01-31" // 计算结束日期
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "splits": [
      {
        "user_id": 1,
        "username": "张三",
        "amount": 30.13,
        "percentage": 25.0,
        "days_in_room": 31,
        "calculation_details": {
          "base_amount": 120.50,
          "adjustment_factor": 1.0,
          "final_amount": 30.13
        }
      }
    ],
    "total_amount": 120.50,
    "calculation_method": "smart",
    "calculated_at": "2024-01-01T00:00:00Z"
  }
}
```

**接口**: `PUT /v1/expenses/{expense_id}/splits`
**说明**: 确认并保存分摊结果

---

## 6. 支付功能接口

### 6.1 收款码管理
**接口**: `POST /v1/payment-codes`

**请求参数**:
```json
{
  "payment_type": "wechat", // wechat, alipay
  "qr_code_url": "https://example.com/qrcode.jpg",
  "is_active": true
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "payment_code": {
      "id": 1,
      "user_id": 2,
      "payment_type": "wechat",
      "qr_code_url": "https://example.com/qrcode.jpg",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

**接口**: `GET /v1/payment-codes/my`
**说明**: 获取当前用户的收款码列表

### 6.2 扫码支付
**接口**: `POST /v1/payments/confirm`

**请求参数**:
```json
{
  "expense_id": 1,
  "payer_id": 3,
  "amount": 30.13,
  "payment_method": "wechat",
  "payment_note": "扫码支付电费"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": 1,
      "expense_id": 1,
      "payer_id": 3,
      "receiver_id": 2,
      "amount": 30.13,
      "status": "pending_confirmation",
      "payment_method": "wechat",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "payment_code": {
      "qr_code_url": "https://example.com/qrcode.jpg",
      "receiver_name": "李四"
    }
  }
}
```

### 6.3 支付状态管理
**接口**: `PUT /v1/payments/{payment_id}/confirm`

**请求参数**:
```json
{
  "confirmer_id": 2,
  "confirmation_note": "已确认收到款项"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": 1,
      "status": "completed",
      "confirmed_at": "2024-01-02T00:00:00Z",
      "confirmed_by": 2
    }
  }
}
```

**接口**: `GET /v1/payments/my`
**说明**: 获取当前用户的支付记录

---

## 7. 账单管理接口

### 7.1 账单生成
**接口**: `POST /v1/bills/generate`

**请求参数**:
```json
{
  "room_id": 1,
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "include_expenses": [1, 2, 3]
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "bill": {
      "id": 1,
      "room_id": 1,
      "period_start": "2024-01-01",
      "period_end": "2024-01-31",
      "total_amount": 350.00,
      "status": "generated",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "breakdown": {
      "expenses": [
        {
          "expense_id": 1,
          "title": "电费",
          "amount": 120.50,
          "splits": [
            {
              "user_id": 1,
              "amount": 30.13
            }
          ]
        }
      ]
    }
  }
}
```

### 7.2 账单查询
**接口**: `GET /v1/bills`
**查询参数**:
- `room_id`: 寝室ID
- `status`: 账单状态
- `period_start`: 账单周期开始
- `period_end`: 账单周期结束

### 7.3 支付记录
**接口**: `GET /v1/bills/{bill_id}/payments`
**说明**: 获取账单相关的支付记录

---

## 8. 统计分析接口

### 8.1 支出统计
**接口**: `GET /v1/statistics/expenses`

**查询参数**:
- `room_id`: 寝室ID
- `period`: 统计周期 (daily, weekly, monthly, yearly)
- `start_date`: 开始日期
- `end_date`: 结束日期
- `group_by`: 分组方式 (type, user, month)

**响应数据**:
```json
{
  "success": true,
  "data": {
    "statistics": [
      {
        "period": "2024-01",
        "total_amount": 350.00,
        "expense_count": 5,
        "by_type": {
          "utilities": 120.50,
          "maintenance": 80.00,
          "supplies": 149.50
        },
        "by_user": {
          "1": 87.50,
          "2": 87.50,
          "3": 87.50,
          "4": 87.50
        }
      }
    ]
  }
}
```

### 8.2 趋势分析
**接口**: `GET /v1/statistics/trends`

**查询参数**:
- `room_id`: 寝室ID
- `metric`: 分析指标 (amount, count, per_capita)
- `period`: 时间周期
- `months`: 分析月数

### 8.3 数据导出
**接口**: `POST /v1/statistics/export`

**请求参数**:
```json
{
  "export_type": "expenses", // expenses, payments, bills
  "format": "csv", // csv, excel
  "room_id": 1,
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "download_url": "https://api.example.com/downloads/export_123.csv",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}
```

---

## 9. 系统管理接口

### 9.1 用户管理
**接口**: `GET /v1/admin/users`
**说明**: 系统管理员获取用户列表

**接口**: `PUT /v1/admin/users/{user_id}/role`
**请求参数**:
```json
{
  "role": "payment_collector",
  "room_id": 1
}
```

### 9.2 系统配置
**接口**: `GET /v1/admin/config`
**说明**: 获取系统配置信息

**接口**: `PUT /v1/admin/config`
**说明**: 更新系统配置

### 9.3 通知管理
**接口**: `POST /v1/notifications`
**说明**: 发送系统通知

**接口**: `GET /v1/notifications`
**说明**: 获取用户通知列表

---

## 10. 接口使用示例

### 10.1 完整支付流程示例
1. **用户登录**: `POST /v1/auth/login`
2. **创建费用**: `POST /v1/expenses`
3. **费用审核**: `PUT /v1/expenses/{id}/review`
4. **计算分摊**: `POST /v1/expenses/{id}/calculate-splits`
5. **确认分摊**: `PUT /v1/expenses/{id}/splits`
6. **确认支付**: `POST /v1/payments/confirm`
7. **收款确认**: `PUT /v1/payments/{id}/confirm`

### 10.2 错误处理示例
```json
// 权限不足
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSION",
    "message": "您没有权限执行此操作",
    "details": {
      "required_role": "room_leader",
      "current_role": "normal_user"
    }
  }
}

// 资源不存在
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定的费用记录不存在",
    "details": {
      "resource_type": "expense",
      "resource_id": "999"
    }
  }
}
```

---

*本文档定义了记账系统的完整API接口规范。开发团队应严格按照此规范进行接口开发和测试。如有疑问或需要修改，请联系后端开发负责人。*