#!/usr/bin/env node

/**
 * 生成安全密钥脚本
 * 用于生成JWT密钥、会话密钥等安全密钥
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('开始生成安全密钥...\n');

// 生成指定长度的十六进制字符串
function generateHexKey(length) {
  return crypto.randomBytes(length).toString('hex');
}

// 生成指定长度的Base64字符串
function generateBase64Key(length) {
  return crypto.randomBytes(length).toString('base64');
}

// 生成JWT密钥（256字节）
const jwtSecret = generateHexKey(256);
console.log('JWT密钥 (256字节):');
console.log(jwtSecret);
console.log('');

// 生成会话密钥（256字节）
const sessionSecret = generateHexKey(256);
console.log('会话密钥 (256字节):');
console.log(sessionSecret);
console.log('');

// 生成数据库密码（32字节）
const dbPassword = generateBase64Key(32);
console.log('数据库密码 (32字节):');
console.log(dbPassword);
console.log('');

// 创建安全的.env文件内容
const envContent = `# 安全环境变量配置
# 注意：在生产环境中，这些值应该从安全的密钥管理服务中获取

# 应用环境
NODE_ENV=production

# JWT密钥配置（256位随机字符串）
JWT_SECRET=${jwtSecret}
JWT_FALLBACK_SECRET=${generateHexKey(256)}
JWT_EXPIRES_IN=24h
JWT_ROTATION_INTERVAL=30

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=accounting_system
DB_USER=accounting_user
DB_PASSWORD=${dbPassword}
DB_SSL=true

# 会话密钥（256位随机字符串）
SESSION_SECRET=${sessionSecret}

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# 安全配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

// 保存到.env.secure文件
const envFilePath = path.join(__dirname, '../.env.secure');
fs.writeFileSync(envFilePath, envContent);

console.log(`✅ 安全密钥已生成并保存到: ${envFilePath}`);
console.log('');
console.log('⚠️  重要提醒:');
console.log('1. 请将.env.secure文件重命名为.env并在生产环境中使用');
console.log('2. 确保.env文件不在版本控制系统中（已添加到.gitignore）');
console.log('3. 在生产环境中，建议使用密钥管理服务而不是.env文件');
console.log('4. 定期轮换密钥以提高安全性');