#!/usr/bin/env node

/**
 * 环境变量安全检查脚本
 * 检查.env文件是否存在以及是否包含不安全的默认值
 */

const fs = require('fs');
const path = require('path');

console.log('开始检查环境变量安全性...\n');

// 检查.env文件是否存在
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('✅ .env文件不存在，这是推荐的安全配置');
  process.exit(0);
}

console.log('⚠️  发现.env文件，检查是否存在不安全的默认值...\n');

// 读取.env文件内容
const envContent = fs.readFileSync(envPath, 'utf8');

// 不安全的默认值模式
const unsafePatterns = [
  { pattern: /JWT_SECRET\s*=\s*your-super-secret/, message: 'JWT_SECRET使用了不安全的默认值' },
  { pattern: /DB_PASSWORD\s*=\s*your-super-secret/, message: 'DB_PASSWORD使用了不安全的默认值' },
  { pattern: /SESSION_SECRET\s*=\s*your-super-secret/, message: 'SESSION_SECRET使用了不安全的默认值' },
  { pattern: /dev_jwt_secret_key/, message: '检测到开发环境密钥' },
  { pattern: /password123/, message: '检测到弱密码' },
  { pattern: /admin123/, message: '检测到弱管理员密码' }
];

let hasIssues = false;

// 检查不安全的模式
for (const { pattern, message } of unsafePatterns) {
  if (pattern.test(envContent)) {
    console.log(`❌ ${message}`);
    hasIssues = true;
  }
}

// 检查密钥长度
const jwtSecretMatch = envContent.match(/JWT_SECRET\s*=\s*(.+)/);
if (jwtSecretMatch) {
  const jwtSecret = jwtSecretMatch[1].trim();
  if (jwtSecret.length < 32) {
    console.log(`❌ JWT_SECRET长度不足（当前: ${jwtSecret.length} 字符，建议至少: 32 字符）`);
    hasIssues = true;
  }
}

const sessionSecretMatch = envContent.match(/SESSION_SECRET\s*=\s*(.+)/);
if (sessionSecretMatch) {
  const sessionSecret = sessionSecretMatch[1].trim();
  if (sessionSecret.length < 32) {
    console.log(`❌ SESSION_SECRET长度不足（当前: ${sessionSecret.length} 字符，建议至少: 32 字符）`);
    hasIssues = true;
  }
}

if (hasIssues) {
  console.log('\n❌ 发现安全问题，请更新.env文件中的敏感信息');
  console.log('建议:');
  console.log('1. 使用密码管理器生成强随机密钥');
  console.log('2. 在生产环境中使用密钥管理服务');
  console.log('3. 删除或重命名.env文件，使用环境变量代替');
  process.exit(1);
} else {
  console.log('✅ .env文件中的密钥看起来是安全的');
  console.log('注意: 在生产环境中仍然建议使用密钥管理服务而不是.env文件');
}