# Zeabur 部署优化的 Dockerfile
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建阶段
FROM node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ai-serve -u 1001

# 只复制生产依赖和必要的文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./
COPY --from=builder /app/config ./config
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/package.json ./

# 创建必要目录
RUN mkdir -p logs coverage uploads && \
    chown -R ai-serve:nodejs /app

# 切换到非 root 用户
USER ai-serve

# 暴露端口 (Zeabur 默认使用 3000)
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "try { require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1)) } catch(e) { process.exit(1) }"

# 启动应用
CMD ["node", "server.js"]

# 镜像标签
LABEL version="1.0.0" \
      description="AI Serve - Node.js API Server" \
      maintainer="ai-serve@example.com"