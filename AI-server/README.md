# AI Serve - 自动化测试和部署指南

## 🚀 项目概述

AI Serve 是一个基于 Node.js 的现代后端 API 服务器，具备完整的自动化测试和部署流程。

## 📋 目录

- [快速开始](#快速开始)
- [开发环境](#开发环境)
- [自动化测试](#自动化测试)
- [部署流程](#部署流程)
- [Docker 部署](#docker-部署)
- [监控和日志](#监控和日志)
- [环境配置](#环境配置)
- [故障排除](#故障排除)

## 快速开始

### 前置要求

- Node.js 20.x 或更高版本
- npm 或 yarn 包管理器
- PostgreSQL 12+ (数据库)
- Docker (可选，用于容器化部署)

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd ai-serve
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
# 复制环境配置文件
cp .env.example .env

# 根据需要修改 .env 文件中的配置
```

4. **启动服务**
```bash
# 开发环境
npm run dev

# 或使用自动化部署脚本
.\scripts\deploy.ps1 development
```

## 开发环境

### 环境变量配置

创建 `.env` 文件（从 `.env.example` 复制）：

```bash
# 应用配置
NODE_ENV=development
PORT=4000

# JWT 配置
JWT_SECRET=your-development-secret-key
JWT_EXPIRES_IN=24h

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_serve_dev
DB_USER=postgres
DB_PASSWORD=your-password

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif
```

### 开发命令

```bash
# 启动开发服务器（自动重启）
npm run dev

# 测试环境
npm run dev:test

# 生产环境预览
npm run dev:production
```

## 自动化测试

### 测试结构

```
tests/
├── setup.js              # 测试环境设置
├── unit/                 # 单元测试
│   ├── database.test.js
│   └── middleware.test.js
├── integration/          # 集成测试
│   └── api.test.js
└── api/                  # API 测试
```

### 测试命令

```bash
# 运行所有测试
npm test

# 监视模式（自动重新运行）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 仅运行单元测试
npm run test:unit

# 仅运行集成测试
npm run test:integration

# 仅运行 API 测试
npm run test:api
```

### 测试覆盖

- ✅ **单元测试**: 数据库配置、中间件功能
- ✅ **集成测试**: API 端点、错误处理
- ✅ **API 测试**: 完整请求响应流程
- ✅ **覆盖率报告**: 代码覆盖率统计

### 测试示例

```javascript
// 单元测试示例
describe('数据库配置测试', () => {
  test('数据库连接池应该正常初始化', () => {
    expect(pool).toBeDefined();
    expect(pool.query).toBeInstanceOf(Function);
  });
});

// API 测试示例
describe('健康检查 API', () => {
  test('GET /api/health 应该返回 200 状态', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'healthy');
  });
});
```

## 部署流程

### 自动化部署脚本

提供 PowerShell 和 Bash 两种部署脚本：

#### Windows (PowerShell)
```powershell
# 开发环境
.\scripts\deploy.ps1 development

# 测试环境  
.\scripts\deploy.ps1 test

# 生产环境
.\scripts\deploy.ps1 production
```

#### Linux/Mac (Bash)
```bash
# 开发环境
./scripts/deploy.sh development

# 测试环境
./scripts/deploy.sh test

# 生产环境
./scripts/deploy.sh production
```

### 部署流程

每个环境的部署流程包括：

1. **环境验证** - 检查环境参数和依赖
2. **依赖安装** - 安装项目依赖和测试依赖
3. **测试执行** - 运行完整的测试套件
4. **代码检查** - 执行代码质量检查（测试和生产环境）
5. **构建应用** - 构建生产版本
6. **部署服务** - Docker 部署或本地部署
7. **健康检查** - 验证服务状态和端到端测试

### 部署脚本特性

- ✅ **多环境支持**: development, test, production
- ✅ **依赖检查**: Node.js, npm, Docker
- ✅ **自动化测试**: 完整测试套件执行
- ✅ **健康检查**: 服务状态验证
- ✅ **错误处理**: 详细的错误日志和回滚
- ✅ **彩色输出**: 清晰的部署进度显示

## Docker 部署

### Docker Compose 服务栈

```yaml
services:
  ai-serve:          # 主应用服务
  postgres:          # PostgreSQL 数据库
  redis:             # Redis 缓存
  nginx:             # 负载均衡器 (生产环境)
  prometheus:        # 监控指标收集 (生产环境)
  grafana:           # 监控仪表板 (生产环境)
  elasticsearch:     # 日志聚合 (生产环境)
  kibana:            # 日志可视化 (生产环境)
```

### Docker 命令

```bash
# 构建镜像
npm run docker:build

# 运行容器
npm run docker:run

# 停止容器
npm run docker:stop

# 生产环境完整部署
docker-compose --profile production up -d
```

### 开发环境 Docker

```bash
# 启动开发环境（包括数据库和缓存）
docker-compose up -d

# 仅启动数据库和缓存
docker-compose up -d postgres redis
```

### 生产环境 Docker

```bash
# 启动完整生产环境栈
docker-compose --profile production up -d

# 查看所有服务状态
docker-compose ps

# 查看服务日志
docker-compose logs ai-serve
docker-compose logs postgres
```

## 监控和日志

### 健康检查端点

- **基础健康检查**: `GET /api/health`
- **性能指标**: `GET /api/health/performance`
- **错误测试**: `GET /api/health/test/errors/*`
- **重试机制测试**: `GET /api/health/test/retry`

### 监控服务（生产环境）

- **Grafana 监控面板**: http://[MONITORING_HOST]:3000
- **Prometheus 指标**: http://[MONITORING_HOST]:9090
- **Kibana 日志分析**: http://[MONITORING_HOST]:5601
- **Elasticsearch**: http://[MONITORING_HOST]:9200

### 日志管理

- **应用日志**: `logs/app-YYYY-MM-DD.log`
- **错误日志**: `logs/error-YYYY-MM-DD.log`
- **访问日志**: `logs/access-YYYY-MM-DD.log`
- **日志轮转**: 自动清理和归档

## 环境配置

### 环境文件结构

```
.env.example          # 环境配置模板
.env.development      # 开发环境配置
.env.test             # 测试环境配置
.env.production       # 生产环境配置
```

### 关键配置项

| 配置项 | 开发环境 | 测试环境 | 生产环境 |
|--------|----------|----------|----------|
| NODE_ENV | development | test | production |
| DB_NAME | ai_serve_dev | ai_serve_test | ai_serve |
| PORT | 4000 | 4001 | 4000 |
| LOG_LEVEL | debug | info | warn |
| RATE_LIMIT_MAX | 无限制 | 100 | 50 |

### 数据库配置

```bash
# 开发环境
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_serve_dev

# 生产环境
DB_HOST=postgres  # Docker 容器名
DB_PORT=5432
DB_NAME=ai_serve
```

## 故障排除

### 常见问题

#### 1. 端口占用
```bash
# 检查端口占用
netstat -ano | findstr :4000

# 清理端口占用
.\scripts\deploy.ps1 development  # 自动清理
```

#### 2. 数据库连接失败
```bash
# 检查数据库服务
pg_isready -h localhost -p 5432

# 检查连接配置
node -e "console.log(require('./config/database').healthCheck())"
```

#### 3. 测试失败
```bash
# 清除测试缓存
npm test -- --clearCache

# 仅运行失败的测试
npm test -- --testNamePattern="测试名称"
```

#### 4. Docker 部署问题
```bash
# 查看 Docker 日志
docker-compose logs ai-serve

# 重建容器
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 调试模式

```bash
# 启用详细日志
DEBUG=* npm run dev

# 启用数据库查询日志
DB_DEBUG=true npm run dev

# 启用性能监控
PERFORMANCE_MONITORING=true npm start
```

### 日志查看

```bash
# 实时查看应用日志
tail -f logs/app-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log

# 使用 Docker 查看日志
docker-compose logs -f ai-serve
```

### 健康检查故障排除

```bash
# 手动测试健康检查
curl -v http://[API_HOST]:4000/api/health

# 测试数据库连接
curl -v http://[API_HOST]:4000/api/health/performance

# 测试错误处理
curl -v http://[API_HOST]:4000/api/health/test/errors/validation
```

## 开发指南

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 RESTful API 设计原则
- 统一错误处理和响应格式
- 添加适当的日志记录

### 提交规范

```bash
# 提交前检查
npm run lint
npm test

# 提交信息格式
git commit -m "feat: 添加用户认证功能"
git commit -m "fix: 修复文件上传大小限制问题"
git commit -m "test: 增加 API 集成测试"
```

### 新功能开发

1. 创建功能分支
2. 编写单元测试
3. 实现功能代码
4. 运行完整测试套件
5. 更新文档
6. 提交代码审查

## 支持

如有问题或建议，请：

1. 查看本文档的故障排除部分
2. 检查 GitHub Issues
3. 联系开发团队

---

**版本**: 1.0.0  
**最后更新**: 2025-11-19  
**Node.js 版本要求**: 20.x+