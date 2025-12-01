#!/usr/bin/env node

/**
 * 安全环境变量配置生成器
 * 自动生成安全的随机密钥和环境变量配置
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建读取接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 生成安全的随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
function generateSecureString(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 生成安全的JWT密钥
 * @returns {string} JWT密钥
 */
function generateJWTSecret() {
  return generateSecureString(64);
}

/**
 * 生成安全的数据库密码
 * @returns {string} 数据库密码
 */
function generateDBPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * 生成安全的会话密钥
 * @returns {string} 会话密钥
 */
function generateSessionSecret() {
  return generateSecureString(32);
}

/**
 * 创建开发环境配置
 */
function createDevelopmentEnv() {
  return `# 开发环境配置
NODE_ENV=development
PORT=4000

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=${generateDBPassword()}
DB_NAME=postgres

# JWT配置
JWT_SECRET=${generateJWTSecret()}
JWT_FALLBACK_SECRET=${generateJWTSecret()}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ROTATION_INTERVAL=2592000000

# CORS配置
CORS_WHITELIST=https://your-domain.com,https://app.your-domain.com

# 会话配置
SESSION_SECRET=${generateSessionSecret()}

# 安全配置
JWT_BLACKLIST_ENABLED=true
JWT_BLACKLIST_CHECK=true

# 日志配置
LOG_LEVEL=info
ENABLE_AUDIT_LOG=true
ENABLE_SECURITY_LOG=true

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,pdf,doc,docx

# 缓存配置
CACHE_ENABLED=true
CACHE_TTL=3600
`;
}

/**
 * 创建生产环境配置
 */
function createProductionEnv() {
  return `# 生产环境配置
NODE_ENV=production
PORT=4000

# 数据库配置（请根据实际情况修改）
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USER=your-production-db-user
DB_PASSWORD=${generateDBPassword()}
DB_NAME=your-production-db-name

# JWT配置
JWT_SECRET=${generateJWTSecret()}
JWT_FALLBACK_SECRET=${generateJWTSecret()}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ROTATION_INTERVAL=2592000000

# CORS配置（请根据实际域名修改）
CORS_WHITELIST=https://your-domain.com,https://www.your-domain.com

# 会话配置
SESSION_SECRET=${generateSessionSecret()}

# 安全配置
JWT_BLACKLIST_ENABLED=true
JWT_BLACKLIST_CHECK=true

# 日志配置
LOG_LEVEL=warn
ENABLE_AUDIT_LOG=true
ENABLE_SECURITY_LOG=true

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,pdf,doc,docx

# 缓存配置
CACHE_ENABLED=true
CACHE_TTL=3600

# 监控配置
ENABLE_MONITORING=true
ENABLE_METRICS=true
`;
}

/**
 * 创建环境变量模板
 */
function createEnvExample() {
  return `# 环境变量配置模板
NODE_ENV=development
PORT=4000

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-secure-password-here
DB_NAME=postgres

# JWT配置
JWT_SECRET=your-jwt-secret-here-minimum-32-characters
JWT_FALLBACK_SECRET=your-fallback-jwt-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ROTATION_INTERVAL=2592000000

# CORS配置
CORS_WHITELIST=https://your-domain.com,https://app.your-domain.com

# 会话配置
SESSION_SECRET=your-session-secret-here-minimum-32-characters

# 安全配置
JWT_BLACKLIST_ENABLED=true
JWT_BLACKLIST_CHECK=true

# 日志配置
LOG_LEVEL=info
ENABLE_AUDIT_LOG=true
ENABLE_SECURITY_LOG=true

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,pdf,doc,docx

# 缓存配置
CACHE_ENABLED=true
CACHE_TTL=3600

# 监控配置
ENABLE_MONITORING=true
ENABLE_METRICS=true
`;
}

/**
 * 安全提示信息
 */
function getSecurityTips() {
  return `
🛡️  安全提示：
1. 生成的密钥和密码都是随机生成的，请妥善保管
2. 生产环境请使用更强的密码和密钥
3. 定期更换JWT密钥和数据库密码
4. 不要将.env文件提交到版本控制系统
5. 使用HTTPS协议保护数据传输
6. 启用防火墙和访问控制
7. 定期备份数据库和重要配置

⚠️  重要提醒：
- 请立即修改生产环境的数据库连接信息
- 确保JWT密钥长度至少32个字符
- 启用所有安全日志记录功能
- 配置适当的CORS白名单
`;
}

/**
 * 主函数
 */
async function main() {
  console.log('🔐 安全环境变量配置生成器');
  console.log('=====================================\n');

  try {
    // 检查文件是否已存在
    const devEnvPath = '.env.development';
    const prodEnvPath = '.env.production';
    const examplePath = '.env.example';

    if (fs.existsSync(devEnvPath) || fs.existsSync(prodEnvPath)) {
      console.log('⚠️  警告：环境变量文件已存在');
      
      const answer = await new Promise((resolve) => {
        rl.question('是否覆盖现有文件？(y/N): ', (answer) => {
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });

      if (!answer) {
        console.log('❌ 操作已取消');
        rl.close();
        return;
      }
    }

    // 生成配置文件
    console.log('📝 正在生成配置文件...');

    // 开发环境配置
    fs.writeFileSync(devEnvPath, createDevelopmentEnv());
    console.log(`✅ 已生成: ${devEnvPath}`);

    // 生产环境配置
    fs.writeFileSync(prodEnvPath, createProductionEnv());
    console.log(`✅ 已生成: ${prodEnvPath}`);

    // 环境变量模板
    fs.writeFileSync(examplePath, createEnvExample());
    console.log(`✅ 已生成: ${examplePath}`);

    console.log('\n🎉 配置文件生成完成！');
    console.log(getSecurityTips());

    // 生成安全报告
    const reportPath = 'security-config-report.txt';
    const report = `安全环境变量配置生成报告
生成时间: ${new Date().toISOString()}

生成的文件:
- ${devEnvPath}
- ${prodEnvPath}
- ${examplePath}

重要提醒:
1. 请立即修改生产环境的数据库连接信息
2. 确保所有敏感信息都已正确配置
3. 定期更新密钥和密码
4. 启用所有安全功能

${getSecurityTips()}
`;

    fs.writeFileSync(reportPath, report);
    console.log(`\n📋 安全报告已生成: ${reportPath}`);

  } catch (error) {
    console.error('❌ 生成配置文件时出错:', error);
  } finally {
    rl.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  generateSecureString,
  generateJWTSecret,
  generateDBPassword,
  generateSessionSecret,
  createDevelopmentEnv,
  createProductionEnv,
  createEnvExample
};