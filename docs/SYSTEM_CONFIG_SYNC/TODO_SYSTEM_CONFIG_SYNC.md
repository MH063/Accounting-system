# TODO_SYSTEM_CONFIG_SYNC

## 待办事项清单

### 验证类待办

| 序号 | 待办事项 | 优先级 | 说明 | 状态 |
|-----|---------|-------|------|------|
| 1 | 验证首页显示系统名称 | 高 | 检查是否从数据库读取 | ⏳ 待验证 |
| 2 | 验证首页显示版本号 | 高 | 检查版本号是否正确 | ⏳ 待验证 |
| 3 | 验证首页显示运行环境 | 高 | 检查环境标识是否正确 | ⏳ 待验证 |
| 4 | 验证配置修改后自动刷新 | 高 | 修改名称后检查首页是否更新 | ⏳ 待验证 |
| 5 | 验证两页面显示一致性 | 中 | 对比Home和SystemSettings的显示 | ⏳ 待验证 |
| 6 | 检查控制台错误日志 | 中 | 确保无数据解析错误 | ⏳ 待验证 |

### 已完成项

| 序号 | 已完成事项 | 说明 |
|-----|-----------|------|
| A | Home.vue 代码修改 | 新增syncSystemInfoFromConfig同步函数、全局配置同步 |
| B | SystemSettings.vue 代码修改 | 新增配置获取函数、改造保存逻辑、全局配置同步 |
| C | SystemSettings.vue 保存配置 | 添加API调用和全局配置刷新 |
| D | Settings.vue 代码修改 | 添加全局配置同步 |
| E | Maintenance.vue 代码修改 | 从全局配置读取系统信息 |
| F | index.html 修改 | 添加window.SYSTEM_CONFIG全局对象和标题动态更新 |
| G | systemConfig.ts 新建 | 全局状态管理模块 |
| H | 6A工作流文档 | ALIGNMENT/CONSENSUS/DESIGN/TASK/ACCEPTANCE/FINAL文档 |

### 补充完善类待办

| 序号 | 待办事项 | 优先级 | 说明 | 状态 |
|-----|---------|-------|------|------|
| 7 | 补充单元测试 | 低 | 为核心函数添加测试用例 | ⏭️ 暂缓 |
| 8 | 完善类型定义 | 低 | 统一配置文件类型接口 | ⏭️ 暂缓 |

---

## 当前状态

### ✅ 已完成的代码修改

1. **systemConfig.ts** (新建)
   - 全局状态管理模块
   - 提供getSystemConfig、updateGlobalSystemConfig、resetSystemConfig函数
   - 管理页面标题动态更新

2. **index.html**
   - 添加window.SYSTEM_CONFIG全局对象
   - 实现浏览器标签页标题动态更新
   - 初始值：名称='AI记账管理系统'，版本='2.1.0'

3. **Home.vue** (第889-891行、第1418-1424行、第1437-1445行)
   - 导入updateGlobalSystemConfig函数
   - 在fetchSystemConfig中添加全局配置同步调用
   - 新增syncSystemInfoFromConfig函数

4. **SystemSettings.vue** (第522-524行、第700-717行、第825-828行、第789-856行)
   - 导入updateGlobalSystemConfig函数
   - 新增fetchSystemConfigForSettings函数
   - 新增calculateUptime辅助函数
   - 保存配置后同步全局配置

5. **Settings.vue** (第96-97行、第131-135行)
   - 导入updateGlobalSystemConfig函数
   - saveBasicSettings保存时同步全局配置

6. **Maintenance.vue** (第653-654行、第711-730行)
   - 导入getSystemConfig函数
   - systemInfo初始化为空，从全局配置同步
   - 新增syncSystemInfoFromGlobal函数

### 🔄 全局同步机制

当系统配置修改后：
1. 调用updateSystemConfig更新全局状态
2. 同步更新window.SYSTEM_CONFIG
3. 自动更新浏览器标签页标题
4. 所有页面通过getSystemConfig()读取最新值

### ⚠️ 待用户手动验证

由于数据库连接配置问题（password authentication failed），需要您手动通过浏览器验证功能。

---

## 操作指引

### 步骤一：启动服务

```powershell
# 启动后端服务（端口4000）- 确保服务正常运行
cd D:\Accounting-system\AI-server
npm start

# 前端服务已在运行（端口8100）
```

### 步骤二：访问验证

打开浏览器访问 http://localhost:8100/：

1. **检查首页显示**
   - 进入首页，查看系统配置区域
   - 记录系统名称、版本号、运行环境
   - 打开浏览器控制台（F12），检查日志输出

2. **检查系统设置页面**
   - 进入系统设置页面
   - 对比系统名称、版本号是否与首页一致

3. **测试配置修改**
   - 在系统设置页面修改系统名称
   - 点击"保存设置"按钮
   - 返回首页刷新页面（F5）
   - 验证是否显示新名称

### 步骤三：验证检查清单

| 检查项 | 结果 |
|-------|------|
| 首页显示系统名称 | ☐ |
| 首页显示版本号 | ☐ |
| 首页显示运行环境 | ☐ |
| 浏览器标签页标题更新 | ☐ |
| 控制台无错误日志 | ☐ |
| 系统设置页面可编辑名称 | ☐ |
| 保存后首页显示新名称 | ☐ |
| 保存后标签页标题更新 | ☐ |
| 两页面显示一致 | ☐ |
| 维护页面显示同步 | ☐ |

### 新增验证项

| 检查项 | 说明 |
|-------|------|
| window.SYSTEM_CONFIG更新 | 控制台输入`window.SYSTEM_CONFIG.name`应显示新名称 |
| 页面标题动态更新 | 修改名称后浏览器标签页标题应立即更新 |

---

## 预期行为

### 正常情况

- 首页应该显示数据库中的系统名称（如"AI记账管理系统"）
- 版本号应该显示"2.1.0"或数据库中配置的值
- 运行环境应该显示"development"或"production"

### 异常情况处理

如果出现以下情况，请检查：
- **配置显示为空**：检查API是否正常返回数据
- **控制台报错**：检查数据库连接和API认证
- **保存失败**：检查用户权限和API路径
