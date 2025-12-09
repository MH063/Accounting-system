# AI Web - 智能寝室记账系统

基于 Vue 3 + TypeScript + Vite 构建的现代化寝室财务管理平台，提供完整的费用管理、支付处理、统计分析等功能。

## 🚀 项目概览

这是一个专为寝室生活设计的智能化记账系统，支持多角色权限管理、实时数据同步、可视化统计分析等核心功能，让寝室财务管理变得简单、透明、高效。

## 🛠️ 技术栈

### 前端技术
- **Vue 3** - 渐进式JavaScript框架，采用Composition API
- **TypeScript** - 提供类型安全和更好的开发体验
- **Vite** - 快速的前端构建工具，支持热更新
- **Vue Router 4** - 官方路由管理器
- **Element Plus** - 基于Vue 3的组件库
- **ECharts** - 强大的数据可视化图表库

### 状态管理与工具
- **Vuex** - 状态管理模式 + 本地持久化(vuex-along)
- **Axios** - HTTP客户端，用于API通信
- **Mitt** - 轻量级事件总线

### 安全与权限
- **JWT** - JSON Web Token身份认证
- **CryptoJS** - 数据加密处理
- **bcryptjs** - 密码哈希处理

### 开发工具
- **PostCSS** - CSS后处理器
- **Autoprefixer** - 自动添加CSS前缀
- **cssnano** - CSS压缩优化

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── Breadcrumb.vue         # 面包屑导航组件
│   ├── ErrorBoundary.vue      # 错误边界组件
│   ├── Footer.vue             # 页脚组件
│   ├── Header.vue             # 头部导航组件
│   ├── MaintenanceNotice.vue  # 维护通知组件
│   ├── NotificationPopover.vue # 通知弹出组件
│   ├── SecurityVerificationModal.vue # 安全验证模态框
│   └── UserProfile.vue        # 用户资料组件
├── composables/         # 组合式函数
├── layouts/             # 布局组件
│   └── Layout.vue             # 主布局组件
├── middleware/          # 路由中间件
├── router/              # 路由配置
│   └── index.ts               # 路由定义和权限控制
├── services/            # 业务逻辑服务
│   ├── accountSecurityService.ts      # 账户安全服务
│   ├── abnormalLoginAlertService.ts   # 异常登录提醒服务
│   ├── biometricService.ts            # 生物识别服务
│   ├── dataEncryptionManager.ts       # 数据加密管理器
│   ├── dormService.ts                 # 寝室管理服务
│   ├── encryptionService.ts           # 加密服务
│   ├── layoutService.ts               # 布局服务
│   ├── loginDeviceLimitService.ts     # 登录设备限制服务
│   ├── maintenanceService.ts          # 维护服务
│   ├── notificationService.ts         # 通知服务
│   ├── passwordResetService.ts        # 密码重置服务
│   ├── paymentService.ts              # 支付服务
│   ├── searchService.ts               # 搜索服务
│   ├── securityAssessmentHistoryService.ts # 安全评估历史服务
│   ├── securityAssessmentService.ts   # 安全评估服务
│   ├── securityOperationLogService.ts # 安全操作日志服务
│   ├── securityQuestionService.ts     # 安全问题服务
│   ├── securityVerificationService.ts # 安全验证服务
│   ├── stateManagementService.ts      # 状态管理服务
│   ├── systemStatusService.ts         # 系统状态服务
│   ├── twoFactorService.ts            # 两步验证服务
│   ├── userService.ts                 # 用户服务
│   └── uxOptimizationService.ts       # UX优化服务
├── types/               # TypeScript类型定义
│   ├── global.d.ts            # 全局类型定义
│   └── index.ts               # 类型索引文件
├── utils/               # 工具函数
│   ├── messageUtils.ts        # 消息工具函数
│   └── timeUtils.ts           # 时间工具函数
├── views/               # 页面组件
│   ├── AboutSystem.vue        # 关于系统页面
│   ├── BillCreate.vue         # 创建账单页面
│   ├── BillDetail.vue         # 账单详情页面
│   ├── BillManagement.vue     # 账单管理页面
│   ├── BudgetManagement.vue   # 预算管理页面
│   ├── Dashboard.vue          # 仪表盘页面
│   ├── DormCreate.vue         # 创建寝室页面
│   ├── DormInfo.vue           # 寝室信息页面
│   ├── DormManagement.vue     # 寝室管理页面
│   ├── DormSettings.vue       # 寝室设置页面
│   ├── ExpenseCreate.vue      # 创建费用页面
│   ├── ExpenseDetail.vue      # 费用详情页面
│   ├── ExpenseEdit.vue        # 编辑费用页面
│   ├── ExpenseManagement.vue  # 费用管理页面
│   ├── ExpenseReview.vue      # 费用审核页面
│   ├── ExpenseStatistics.vue  # 费用统计页面
│   ├── HelpCenter.vue         # 帮助中心页面
│   ├── Home.vue               # 首页
│   ├── IncomeStatistics.vue   # 收入统计页面
│   ├── Login.vue              # 登录页面
│   ├── MaintenanceTest.vue    # 维护测试页面
│   ├── MemberInfo.vue         # 成员信息页面
│   ├── MemberInvite.vue       # 邀请成员页面
│   ├── MemberList.vue         # 成员列表页面
│   ├── MemberManagement.vue   # 成员管理页面
│   ├── NotFound.vue           # 404页面
│   ├── NotificationList.vue   # 通知列表页面
│   ├── Payment.vue            # 支付页面
│   ├── PaymentConfirm.vue     # 支付确认页面
│   ├── PaymentQRCode.vue      # 付款码页面
│   ├── PaymentRecords.vue     # 支付记录页面
│   ├── PaymentScan.vue        # 扫码支付页面
│   ├── PersonalInfo.vue       # 个人信息页面
│   ├── PreferenceSettings.vue # 偏好设置页面
│   ├── PrivacyPolicy.vue      # 隐私政策页面
│   ├── Profile.vue            # 个人资料页面
│   ├── Register.vue           # 注册页面
│   ├── SecurityQuestionDemo.vue      # 安全问题演示页面
│   ├── SecurityQuestionVerification.vue # 安全问题验证页面
│   ├── SecuritySettings.vue   # 安全设置页面
│   ├── Statistics.vue         # 统计分析页面
│   ├── TermsOfService.vue     # 服务条款页面
│   ├── TrendAnalysis.vue      # 趋势分析页面
│   └── UserAgreement.vue      # 用户协议页面
├── App.vue              # 根组件
├── main.ts              # 应用入口文件
└── vite-env.d.ts        # 环境声明文件
```

## ✨ 核心功能

### 🔐 用户认证与权限管理
- **多角色权限系统**：系统管理员、管理员、审核员、寝室长、普通成员、访客
- **精细化权限控制**：基于资源和操作的权限验证
- **JWT身份认证**：安全的用户身份验证机制
- **权限审计日志**：完整的权限操作记录

### 🏠 寝室管理
- **寝室信息管理**：创建、编辑、删除寝室信息
- **成员邀请系统**：通过邀请码添加寝室成员
- **寝室设置**：寝室规则、费用分摊设置
- **多寝室支持**：用户可参与多个寝室

### 💰 费用管理
- **费用记录**：创建、编辑、删除费用记录
- **费用分类**：支持自定义费用类型
- **费用审核**：审核员可审核费用申请
- **费用分摊**：自动计算成员分摊金额
- **费用统计**：多维度费用分析

### 📊 账单管理
- **账单生成**：基于费用记录自动生成账单
- **账单状态跟踪**：待支付、已支付、逾期状态
- **账单详情**：详细的费用明细和分摊信息
- **账单导出**：支持导出PDF格式账单

### 💳 支付功能
- **多种支付方式**：支持扫码支付、二维码支付
- **支付确认**：安全的支付验证流程
- **支付记录**：完整的支付历史记录
- **支付提醒**：自动发送支付通知

### 📈 统计分析
- **费用趋势分析**：时间维度的费用变化趋势
- **成员消费分析**：个人和群体消费统计
- **预算管理**：设置和跟踪预算执行情况
- **可视化图表**：丰富的图表展示形式

### 🔔 通知系统
- **实时通知**：费用变更、支付提醒等
- **通知中心**：集中管理所有通知
- **消息推送**：重要事项的及时推送

### 👤 个人中心
- **个人资料管理**：基本信息、头像设置
- **安全设置**：密码修改、双重认证
- **偏好设置**：个性化界面设置
- **操作历史**：个人操作记录查询

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
npm install
# 或使用 yarn
yarn install
```

### 开发环境启动
```bash
npm run dev
# 或使用 yarn
yarn dev
```

应用将在 `http://localhost:8000` 上运行，支持热更新。

### 构建生产版本
```bash
npm run build
# 或使用 yarn
yarn build
```

### 预览生产版本
```bash
npm run preview
# 或使用 yarn
yarn preview
```

## 🔧 配置说明

### 环境变量
项目支持通过环境变量进行配置，主要配置项包括：
- `VITE_API_BASE_URL` - API基础地址
- `VITE_APP_TITLE` - 应用标题
- `VITE_APP_VERSION` - 应用版本

### Vite配置
项目使用Vite作为构建工具，配置文件位于 `vite.config.ts`，主要配置包括：
- 开发服务器端口：8000
- 路径别名：`@` 指向 `src` 目录
- 支持TypeScript和Vue单文件组件

### 权限配置

- 角色权限映射
- 资源操作权限规则
- 动态权限变更

## 📱 响应式设计

项目采用移动优先的响应式设计策略：
- **PC端**：完整的侧边栏导航和功能展示
- **平板端**：优化的布局和交互体验
- **手机端**：简洁的底部导航和卡片式布局

## 🎨 UI/UX设计

### 设计原则
- **简洁直观**：清晰的视觉层次和操作流程
- **一致性**：统一的色彩、字体和交互规范
- **可访问性**：支持键盘导航和屏幕阅读器
- **性能优化**：懒加载、代码分割等优化手段

### 色彩系统
- 主色调：蓝色系 (#4f46e5, #06b6d4)
- 辅助色：绿色、橙色、红色用于状态表示
- 中性色：用于文本和背景

## 🔒 安全特性

### 前端安全
- **输入验证**：表单输入的客户端验证
- **XSS防护**：Vue模板自动转义
- **CSRF防护**：配合后端的CSRF令牌机制
- **敏感数据加密**：本地存储的敏感信息加密

### 权限安全
- **路由守卫**：基于权限的动态路由控制
- **组件级权限**：细粒度的组件显示控制
- **API权限验证**：每个API调用都进行权限检查
- **审计日志**：完整的操作记录和追踪

### 账户安全
- **密码强度检查**：强制使用强密码策略
- **登录失败限制**：防止暴力破解攻击
- **会话管理**：自动超时和会话清理
- **两步验证**：支持TOTP二次验证
- **设备管理**：登录设备限制和监控

## 📊 性能优化

### 代码优化
- **Tree Shaking**：移除未使用的代码
- **代码分割**：按需加载路由组件
- **图片优化**：支持WebP格式，图片懒加载
- **字体优化**：使用系统字体，减少字体加载

### 运行时优化
- **组件懒加载**：路由级别的代码分割
- **状态管理优化**：Vuex模块化和持久化策略
- **事件总线优化**：合理使用事件通信
- **内存泄漏防护**：组件销毁时的清理工作
- **虚拟滚动**：大数据列表的性能优化

## 🧪 测试策略

### 单元测试
- **组件测试**：Vue组件的功能测试
- **服务测试**：业务逻辑的正确性验证
- **工具函数测试**：纯函数的单元测试

### 集成测试
- **API集成测试**：前后端接口联调测试
- **路由测试**：页面导航和权限验证测试
- **用户流程测试**：核心业务流程的端到端测试

## 📚 开发文档

### 组件开发规范
- 使用Composition API编写组件
- 遵循统一的命名规范
- 完整的Props和Emits定义
- 详细的组件注释和使用说明

### 状态管理规范
- Vuex模块化设计
- 严格的mutation和action分离
- 异步操作的错误处理
- 状态持久化策略

### API调用规范
- 统一的请求封装
- 标准化的响应处理
- 错误处理和用户反馈
- 请求防抖和节流

## 🔧 部署指南

### 环境准备
1. 安装Node.js运行环境
2. 配置Web服务器（Nginx/Apache）
3. 准备域名和SSL证书

### 构建部署
1. 执行 `npm run build` 构建生产版本
2. 将 `dist` 目录部署到Web服务器
3. 配置服务器反向代理（如需要）
4. 设置环境变量和配置文件

### 性能监控
- 集成前端性能监控工具
- 设置错误收集和报警
- 定期性能评估和优化

## 🐛 已知问题

### 当前版本问题
1. **移动端适配**：部分复杂页面在小屏幕设备上显示需要优化
2. **性能问题**：大数据量图表渲染性能有待提升
3. **浏览器兼容**：部分新特性在旧版浏览器上需要polyfill

### 解决方案
- 持续优化响应式布局
- 实施虚拟滚动和分页加载
- 添加浏览器兼容性处理

## 📋 后续计划

### 短期目标（1-2个月）
- [x] 完善移动端适配和响应式设计
- [x] 优化大数据量下的性能表现
- [x] 增加更多图表类型和数据可视化选项
- [ ] 实现离线功能和数据缓存
- [ ] 增强安全功能，包括生物识别认证和高级加密

### 中期目标（3-6个月）
- [ ] 开发移动端APP（React Native/Flutter）
- [ ] 集成AI智能分析和预测功能，提供支出预测和预算建议
- [ ] 支持多语言和国际化
- [ ] 增加社交分享和协作功能
- [ ] 实现更精细的权限管理和审计功能

### 长期目标（6个月以上）
- [ ] 构建完整的生活服务平台，整合更多生活服务
- [ ] 集成IoT智能家居设备，实现自动化费用记录
- [ ] 开发企业版B2B解决方案，支持团队和企业管理
- [ ] 建立开发者生态系统，提供开放API和插件机制
- [ ] 实现区块链技术集成，确保数据不可篡改
## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 项目仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范
- 遵循 ESLint 配置
- 编写清晰的提交信息
- 添加必要的注释和文档
- 确保所有测试通过

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持与联系
如遇到问题或有建议，请通过以下方式联系我们：
- 📧 邮箱：support@aiweb.com
- 💬 社区论坛：[讨论区链接]
- 🐛 问题反馈：[GitHub Issues]

---

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**