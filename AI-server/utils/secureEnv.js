/**
 * 安全环境变量管理器
 * 防止敏感信息在日志和响应中泄露
 */

const crypto = require('crypto');

// 敏感环境变量列表
const SENSITIVE_ENV_VARS = [
  'DB_PASSWORD', 'JWT_SECRET', 'JWT_FALLBACK_SECRET', 'SESSION_SECRET',
  'API_KEY', 'SECRET_KEY', 'PRIVATE_KEY', 'DATABASE_URL',
  'SMTP_PASSWORD', 'EMAIL_PASSWORD', 'REDIS_PASSWORD',
  'AWS_SECRET_ACCESS_KEY', 'AWS_ACCESS_KEY_ID',
  'GITHUB_TOKEN', 'GIT_TOKEN', 'DOCKER_PASSWORD'
];

// 环境变量缓存（加密存储）
const envCache = new Map();

/**
 * 加密敏感值
 * @param {string} value - 要加密的值
 * @returns {string} 加密后的值
 */
function encryptValue(value) {
  if (!value) return value;
  
  try {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.SESSION_SECRET || 'default-secret', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('加密失败:', error);
    return value;
  }
}

/**
 * 解密敏感值
 * @param {string} encryptedValue - 要解密的值
 * @returns {string} 解密后的值
 */
function decryptValue(encryptedValue) {
  if (!encryptedValue || !encryptedValue.includes(':')) return encryptedValue;
  
  try {
    const parts = encryptedValue.split(':');
    if (parts.length !== 3) return encryptedValue;
    
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.SESSION_SECRET || 'default-secret', 'salt', 32);
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('解密失败:', error);
    return encryptedValue;
  }
}

/**
 * 获取环境变量（安全版本）
 * @param {string} key - 环境变量名
 * @param {string} defaultValue - 默认值
 * @returns {string} 环境变量值
 */
function getSecureEnv(key, defaultValue = null) {
  const value = process.env[key];
  
  if (!value) return defaultValue;
  
  // 如果是敏感变量，从缓存中获取或加密存储
  if (isSensitiveEnvVar(key)) {
    if (envCache.has(key)) {
      return envCache.get(key);
    }
    
    // 存储原始值到缓存
    envCache.set(key, value);
    return value;
  }
  
  return value;
}

/**
 * 检查是否为敏感环境变量
 * @param {string} key - 环境变量名
 * @returns {boolean} 是否为敏感变量
 */
function isSensitiveEnvVar(key) {
  return SENSITIVE_ENV_VARS.some(sensitiveKey => 
    key.toUpperCase().includes(sensitiveKey.toUpperCase())
  );
}

/**
 * 安全地记录环境变量（不暴露敏感信息）
 * @param {string} key - 环境变量名
 * @returns {string} 安全的显示值
 */
function getSafeEnvDisplay(key) {
  const value = process.env[key];
  
  if (!value) return '未设置';
  
  if (isSensitiveEnvVar(key)) {
    const length = value.length;
    if (length <= 8) {
      return '***';
    }
    return value.substring(0, 2) + '***' + value.substring(length - 2);
  }
  
  return value;
}

/**
 * 清理对象中的敏感环境变量
 * @param {Object} obj - 要清理的对象
 * @returns {Object} 清理后的对象
 */
function sanitizeEnvObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveEnvVar(key)) {
      sanitized[key] = getSafeEnvDisplay(key);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * 验证环境变量配置
 * @returns {Object} 验证结果
 */
function validateEnvConfig() {
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
  const sensitiveVars = ['DB_PASSWORD', 'JWT_SECRET'];
  
  const missing = [];
  const warnings = [];
  const errors = [];
  
  // 检查必需变量
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  // 检查敏感变量
  sensitiveVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      errors.push(`${varName} 未设置，这将导致安全问题`);
    } else if (value.length < 16) {
      warnings.push(`${varName} 长度过短，建议使用更长的随机字符串`);
    }
  });
  
  // 检查开发环境的默认密钥
  if (process.env.NODE_ENV === 'development') {
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.includes('dev_jwt_secret')) {
      warnings.push('正在使用开发环境的默认JWT密钥，生产环境请更换');
    }
    
    const dbPassword = process.env.DB_PASSWORD;
    if (dbPassword && (dbPassword.includes('123456') || dbPassword.includes('password'))) {
      warnings.push('数据库密码过于简单，建议使用强密码');
    }
  }
  
  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    warnings,
    errors,
    status: errors.length > 0 ? 'ERROR' : 
            warnings.length > 0 ? 'WARNING' : 'OK'
  };
}

/**
 * 生成安全的随机密钥
 * @param {number} length - 密钥长度
 * @returns {string} 随机密钥
 */
function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 清除环境变量缓存
 */
function clearEnvCache() {
  envCache.clear();
}

module.exports = {
  getSecureEnv,
  getSafeEnvDisplay,
  isSensitiveEnvVar,
  sanitizeEnvObject,
  validateEnvConfig,
  generateSecureKey,
  clearEnvCache,
  SENSITIVE_ENV_VARS
};