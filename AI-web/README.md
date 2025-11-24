# AI Web

基于 Vue 3 + TypeScript + Vite 构建的前端项目

## 技术栈

- Vue 3 - 使用 Composition API
- TypeScript - 提供类型安全
- Vite - 快速的前端构建工具
- Vue Router 4 - 路由管理

## 项目结构

```
├── src/
│   ├── views/          # 页面组件
│   │   ├── Home.vue    # 首页
│   │   └── NotFound.vue # 404页面
│   ├── App.vue         # 根组件
│   ├── main.ts         # 应用入口
│   └── vite-env.d.ts   # 环境声明
├── index.html          # HTML模板
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript配置
├── tsconfig.node.json  # Node.js TypeScript配置
└── vite.config.ts      # Vite配置
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:8000 上运行

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 特性

- 响应式设计（PC端优化）
- TypeScript支持
- Vue 3 Composition API
- Vue Router 4路由管理
- 热更新开发环境