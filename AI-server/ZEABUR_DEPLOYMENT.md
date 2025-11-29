# Zeabur 部署指南

本指南将帮助您将 AI Serve 应用部署到 Zeabur 平台。

## 📋 目录

- [准备工作](#准备工作)
- [数据库设置](#数据库设置)
- [部署步骤](#部署步骤)
- [环境配置](#环境配置)
- [监控和维护](#监控和维护)
- [常见问题](#常见问题)

## 准备工作

### 1. 注册 Zeabur 账户

访问 [Zeabur](https://zeabur.com) 并注册账户。

### 2. 安装 Zeabur CLI (可选)

```bash
npm install -g @zeabur/cli
```

### 3. 验证项目文件

确认以下文件已存在：
- `zeabur.json` - Zeabur 部署配置
- `Dockerfile` - 容器化配置  
- `.env.zeabur` - 环境变量模板
- `package.json` - 项目依赖和脚本

## 数据库设置

### 选项 1: 使用 Zeabur 托管数据库 (推荐)

1. 在 Zeabur 控制台中创建 PostgreSQL 数据库
2. 复制生成的 `DATABASE_URL`
3. 在应用环境变量中设置 `DATABASE_URL`

### 选项 2: 外部数据库

1. 创建外部 PostgreSQL 数据库 (如 Supabase、PlanetScale 等)
2. 获取数据库连接信息
3. 在环境变量中配置单独的数据库参数

## 部署步骤

### 方法 1: 通过 Zeabur 网站

1. **创建新项目**
   - 登录 Zeabur 控制台
   - 点击 "New Project"
   - 选择 "Deploy from Git Repository"

2. **连接代码仓库**
   - 连接 GitHub/GitLab 仓库
   - 选择 AI Serve 项目

3. **配置部署**
   ```json
   {
     "buildCommand": "npm ci",
     "startCommand": "node server.js",
     "installCommand": "npm ci --only=production",
     "healthCheckPath": "/api/health"
   }
   ```

4. **设置环境变量**
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgres://user:password@host:port/database
   JWT_SECRET=your-super-secret-key
   PORT=3000
   ```

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成

### 方法 2: 通过 Zeabur CLI

```bash
# 登录 Zeabur
zeabur login

# 部署项目
zeabur deploy

# 查看部署状态
zeabur status
```

### 方法 3: 通过 Git 集成

1. **推送代码到 Git 仓库**
   ```bash
   git add .
   git commit -m "Ready for Zeabur deployment"
   git push origin main
   ```

2. **配置自动部署**
   - 在 Zeabur 控制台启用 "Auto Deploy"
   - 设置分支为 `main`

## 环境配置

### 环境变量清单

在 Zeabur 控制台中设置以下环境变量：

#### 必需变量

```bash
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置（选择其中一种方式）
# 方式1: 使用 DATABASE_URL（推荐）
DATABASE_URL=postgres://username:password@host:5432/database

# 方式2: 单独配置数据库
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
```

#### 可选变量

```bash
# 文件上传配置
UPLOAD_DIR=/tmp/uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# 缓存配置
CACHE_TTL=300
CACHE_MAX_KEYS=1000

# 日志配置
LOG_LEVEL=info
LOG_MAX_SIZE=10m
LOG_MAX_FILES=7

# 安全配置
HELMET_ENABLED=true
CORS_ORIGIN=*
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# 监控配置
MONITORING_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
```

### 环境变量验证脚本

在 Zeabur 部署后，访问健康检查端点验证配置：

```bash
# 检查应用状态
curl https://your-app.zeabur.app/api/health

# 检查数据库连接
curl https://your-app.zeabur.app/api/health/performance
```

## 监控和维护

### 健康检查端点

- **基础健康检查**: `GET /api/health`
- **性能指标**: `GET /api/health/performance`
- **数据库状态**: `GET /api/health/performance` (包含数据库信息)

### 日志查看

```bash
# 查看应用日志
zeabur logs

# 实时查看日志
zeabur logs --follow
```

### 性能监控

Zeabur 提供内置的监控功能：

1. **监控面板**
   - CPU 使用率
   - 内存使用量
   - 网络流量
   - 请求响应时间

2. **告警设置**
   - 设置错误率告警
   - 设置响应时间告警
   - 设置资源使用告警

### 自动扩容

Zeabur 支持自动扩容配置：

```json
{
  "autoscaling": {
    "enabled": true,
    "minInstances": 1,
    "maxInstances": 10,
    "targetCpuUtilization": 70,
    "targetMemoryUtilization": 80
  }
}
```

## 常见问题

### 1. 部署失败

**问题**: 构建过程中出现错误

**解决方案**:
```bash
# 检查依赖版本兼容性
npm audit

# 清除缓存重新构建
npm ci --no-cache

# 检查 Dockerfile 语法
docker build --no-cache .
```

### 2. 数据库连接失败

**问题**: 应用启动后无法连接到数据库

**解决方案**:
```bash
# 检查 DATABASE_URL 格式
# 正确格式: postgres://username:password@host:port/database

# 测试数据库连接
node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL)"

# 检查数据库网络访问
ping your-db-host
```

### 3. 端口配置问题

**问题**: 服务无法访问或返回 502 错误

**解决方案**:
- 确保 `PORT` 环境变量设置为 `3000`
- 检查 `Dockerfile` 中的端口暴露设置
- 验证健康检查端点正常

### 4. 文件上传失败

**问题**: 文件上传功能无法使用

**解决方案**:
```bash
# 设置正确的上传目录
UPLOAD_DIR=/tmp/uploads

# 检查目录权限
ls -la /tmp/uploads

# 设置适当的文件大小限制
MAX_FILE_SIZE=5242880
```

### 5. 性能问题

**问题**: 应用响应慢或经常超时

**解决方案**:
- 增加数据库连接池大小
- 启用 Redis 缓存
- 优化数据库查询
- 使用 CDN 加速静态资源

### 6. 环境变量安全

**问题**: 敏感信息泄露风险

**解决方案**:
- 使用 Zeabur 的环境变量管理功能
- 定期轮换 JWT 密钥
- 使用强密码策略
- 启用 SSL/TLS 加密

### 调试命令

```bash
# 进入容器调试
zeabur shell

# 查看环境变量
env | grep -E "(DATABASE|JWT|PORT)"

# 测试数据库连接
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT NOW()', (err, res) => {
    if (err) console.error('Database connection failed:', err);
    else console.log('Database connected successfully');
    pool.end();
  });
"
```

## 备份和恢复

### 数据库备份

```bash
# 创建数据库备份
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
psql $DATABASE_URL < backup_file.sql
```

### 应用备份

```bash
# 导出环境变量
zeabur env list > env_backup.txt

# 导出部署配置
zeabur export > deployment_config.json
```

## 性能优化建议

### 1. 数据库优化
- 使用连接池
- 添加数据库索引
- 启用查询缓存
- 定期清理日志

### 2. 应用优化
- 启用 Gzip 压缩
- 使用 CDN
- 实现静态资源缓存
- 优化 API 响应格式

### 3. 监控优化
- 设置适当的告警阈值
- 监控关键业务指标
- 定期分析性能数据
- 及时处理告警事件

---

## 📞 支持

如需帮助，请：

1. 查看 [Zeabur 文档](https://docs.zeabur.com)
2. 联系 Zeabur 技术支持
3. 查看项目 Issues

**祝您部署成功！** 🎉