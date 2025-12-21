# 实现expense页面API接口和前后端对接

## 1. 分析页面功能和数据交互需求

### 前端功能分析

* 费用管理页面：显示费用列表、统计摘要、搜索筛选

* 支持创建、审核、支付、删除费用

* 支持表格视图和卡片视图切换

* 支持批量操作

* 支持导出功能

* 支付功能：支持多种支付方式，显示收款码

### 数据交互需求

* 获取费用列表数据

* 获取费用统计摘要

* 创建新费用

* 获取费用详情

* 审核费用（通过/拒绝）

* 支付费用

* 删除费用

* 批量操作（审核通过/拒绝/删除）

* 导出费用数据

* 获取收款码列表

## 2. 设计API接口规范

### 2.1 费用列表接口

* **接口名称**：获取费用列表

* **请求方法**：GET

* **URL路径**：/api/expenses

* **请求参数**：

  * page: 页码

  * pageSize: 每页条数

  * search: 搜索关键词

  * status: 状态筛选（pending/approved/rejected）

  * category: 类别筛选

  * month: 月份筛选

* **响应格式**：

  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": 1,
          "title": "水电费",
          "description": "本月水电费",
          "amount": 100.00,
          "category": "utilities",
          "applicant": "张三",
          "date": "2023-10-01",
          "status": "pending",
          "reviewer": null,
          "reviewDate": null,
          "reviewComment": null,
          "attachments": [],
          "createdAt": "2023-10-01T10:00:00Z"
        }
      ],
      "total": 100
    }
  }
  ```

### 2.2 费用详情接口

* **接口名称**：获取费用详情

* **请求方法**：GET

* **URL路径**：/api/expenses/:id

* **响应格式**：

  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "title": "水电费",
      "description": "本月水电费",
      "amount": 100.00,
      "category": "utilities",
      "applicant": "张三",
      "date": "2023-10-01",
      "status": "pending",
      "reviewer": null,
      "reviewDate": null,
      "reviewComment": null,
      "attachments": [],
      "createdAt": "2023-10-01T10:00:00Z"
    }
  }
  ```

### 2.3 创建费用接口

* **接口名称**：创建新费用

* **请求方法**：POST

* **URL路径**：/api/expenses

* **请求参数**：

  ```json
  {
    "title": "水电费",
    "description": "本月水电费",
    "amount": 100.00,
    "category": "utilities",
    "date": "2023-10-01"
  }
  ```

* **响应格式**：

  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "title": "水电费",
      "description": "本月水电费",
      "amount": 100.00,
      "category": "utilities",
      "applicant": "张三",
      "date": "2023-10-01",
      "status": "pending",
      "createdAt": "2023-10-01T10:00:00Z"
    }
  }
  ```

### 2.4 审核费用接口

* **接口名称**：审核费用

* **请求方法**：PUT

* **URL路径**：/api/expenses/:id/review

* **请求参数**：

  ```json
  {
    "status": "approved",
    "comment": "审核通过"
  }
  ```

* **响应格式**：

  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "title": "水电费",
      "status": "approved",
      "reviewer": "李四",
      "reviewDate": "2023-10-02T10:00:00Z",
      "reviewComment": "审核通过"
    }
  }
  ```

### 2.5 支付费用接口

* **接口名称**：支付费用

* **请求方法**：PUT

* **URL路径**：/api/expenses/:id/pay

* **请求参数**：

  ```json
  {
    "paymentMethod": "alipay",
    "amount": 100.00
  }
  ```

* **响应格式**：

  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "status": "paid",
      "paymentMethod": "alipay",
      "paymentDate": "2023-10-03T10:00:00Z"
    }
  }
  ```

### 2.6 删除费用接口

* **接口名称**：删除费用

* **请求方法**：DELETE

* **URL路径**：/api/expenses/:id

* **响应格式**：

  ```json
  {
    "success": true,
    "message": "费用删除成功"
  }
  ```

### 2.7 批量审核通过接口

* **接口名称**：批量审核通过费用

* **请求方法**：PUT

* **URL路径**：/api/expenses/batch/approve

* **请求参数**：

  ```json
  {
    "ids": [1, 2, 3]
  }
  ```

* **响应格式**：

  ```json
  {
    "success": true,
    "data": {
      "affectedIds": [1, 2, 3],
      "message": "批量审核通过成功"
    }
  }
  ```

### 2.8 批量拒绝接口

* **接口名称**：批量拒绝费用

* **请求方法**：PUT

* **URL路径**：/api/expenses/batch/reject

* **请求参数**：

  ```json
  {
    "ids": [1, 2, 3],
    "comment": "批量拒绝"
  }
  ```

* **响应格式**：

  ```json
  {
    "success": true,
    "data": {
      "affectedIds": [1, 2, 3],
      "message": "批量拒绝成功"
    }
  }
  ```

### 2.9 批量删除接口

* **接口名称**：批量删除费用

* **请求方法**：DELETE

* **URL路径**：/api/expenses/batch

* **请求参数**：

  ```json
  {
    "ids": [1, 2, 3]
  }
  ```

* **响应格式**：

  ```json
  {
    "success": true,
    "data": {
      "affectedIds": [1, 2, 3],
      "message": "批量删除成功"
    }
  }
  ```

### 2.10 导出费用接口

* **接口名称**：导出费用数据

* **请求方法**：GET

* **URL路径**：/api/expenses/export

* **请求参数**：

  * format: 导出格式（csv/xlsx）

  * status: 状态筛选

  * category: 类别筛选

  * startDate: 开始日期

  * endDate: 结束日期

* **响应格式**：文件流

### 2.11 获取收款码接口

* **接口名称**：获取收款码列表

* **请求方法**：GET

* **URL路径**：/api/payment/qrcodes

* **响应格式**：

  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "platform": "alipay",
        "qrCodeUrl": "https://example.com/alipay-qr.jpg",
        "status": "active",
        "isUserUploaded": true
      }
    ]
  }
  ```

## 3. 实现步骤

### 3.1 后端实现

1. 创建ExpenseController.js，实现费用的CRUD操作
2. 创建PaymentController.js，实现支付相关功能
3. 创建路由文件routes/expenses.js，配置费用相关路由
4. 创建路由文件routes/payment.js，配置支付相关路由
5. 实现数据模型和数据库操作
6. 添加验证和错误处理

### 3.2 前端实现

1. 完善expenseService.js，添加缺失的API调用方法
2. 修改ExpenseManagement.vue，实现与后端API的对接
3. 添加加载状态和错误提示
4. 测试所有功能

## 4. 测试计划

1. 测试费用列表获取
2. 测试费用创建
3. 测试费用审核
4. 测试费用支付
5. 测试费用删除
6. 测试批量操作
7. 测试导出功能
8. 测试收款码获取

## 5. 预期结果

* 前端页面能够正确显示费用数据

* 所有操作能够正常与后端交互

* 加载状态和错误提示正常显示

* 支付功能正常工作，收款码正确显示

* 批量操作和导出功能正常

## 6.  测试账户

用户名: 管理员

* 登录邮箱: <admin@example.com>
* 密码: Admin123.
* 角色: admin

#

