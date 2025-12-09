# 记账管理系统

基于Node.js 20 + Vue3 + Vite + TypeScript的现代化管理平台

## 技术栈

- **前端框架**: Vue 3
- **开发语言**: TypeScript
- **构建工具**: Vite
- **路由管理**: Vue Router 4
- **Node.js版本**: 20.x

## 项目特点

- 响应式设计，适配PC端
- TypeScript支持，提供更好的类型检查
- 现代化的开发体验，快速的热重载
- 清晰的项目结构，易于维护和扩展

## 安装与运行

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

项目将在 http://localhost:8100 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
├── public/          # 静态资源
├── src/
│   ├── assets/     # 资源文件
│   ├── components/ # 公共组件
│   ├── views/      # 页面组件
│   ├── App.vue     # 根组件
│   ├── main.ts     # 入口文件
│   └── style.css   # 全局样式
├── index.html      # HTML模板
├── package.json    # 项目配置
├── tsconfig.json   # TypeScript配置
└── vite.config.ts  # Vite配置
```

## 开发指南

### 添加新页面

1. 在 `src/views/` 目录下创建新的Vue组件
2. 在 `src/main.ts` 中的路由配置中添加新的路由

### 添加新组件

1. 在 `src/components/` 目录下创建新的Vue组件
2. 在需要的页面中导入并使用

## 许可证

MIT