/**
 * 简化配置验证器
 * 提供基本的配置验证功能
 */

const logger = require('./logger');

/**
 * 基本配置验证规则
 */
const BASIC_CONFIG_RULES = {
  // 必需的配置项
  required: [
    'JWT_SECRET',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ],
  
  // 配置项类型和验证规则
  validations: {
    PORT: {
      type: 'number',
      min: 1024,
      max: 65535
    },
    DB_PORT: {
      type: 'number',
      min: 1,
      max: 65535
    },
    JWT_SECRET: {
      type: 'string',
      minLength: 32
    },
    MAX_FILE_SIZE: {
      type: 'number',
      min: 1024,
      max: 1073741824
    }
  }
};

/**
 * 验证必需配置
 */
function validateRequiredConfig(config) {
  const errors = [];
  const missing = [];
  
  for (const key of BASIC_CONFIG_RULES.required) {
    if (!config[key] || config[key] === '') {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    errors.push(`缺少必需的配置项: ${missing.join(', ')}`);
  }
  
  return {
    success: missing.length === 0,
    missing,
    errors
  };
}

/**
 * 验证配置值
 */
function validateConfigValue(key, value) {
  const rule = BASIC_CONFIG_RULES.validations[key];
  if (!rule) {
    return { valid: true }; // 没有验证规则的配置项视为有效
  }
  
  const errors = [];
  
  // 类型验证
  if (rule.type) {
    const valueType = typeof value;
    if (valueType !== rule.type) {
      errors.push(`${key}: 类型错误，期望 ${rule.type}，实际 ${valueType}`);
    }
  }
  
  // 数字验证
  if (rule.type === 'number' && typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`${key}: 数值过小，最小值 ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`${key}: 数值过大，最大值 ${rule.max}`);
    }
  }
  
  // 字符串验证
  if (rule.type === 'string' && typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${key}: 字符串长度不足，最小长度 ${rule.minLength}`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${key}: 字符串长度超出，最大长度 ${rule.maxLength}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证所有配置
 */
function validateAllConfig(config) {
  const errors = [];
  
  // 验证必需配置
  const requiredValidation = validateRequiredConfig(config);
  if (!requiredValidation.success) {
    errors.push(...requiredValidation.errors);
  }
  
  // 验证各个配置项
  for (const [key, value] of Object.entries(config)) {
    const validation = validateConfigValue(key, value);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    report: {
      totalErrors: errors.length,
      errors
    }
  };
}

/**
 * 生成配置摘要（隐藏敏感信息）
 */
function generateConfigSummary(config) {
  const sensitiveKeys = [
    'JWT_SECRET',
    'DB_PASSWORD',
    'VIRUSTOTAL_API_KEY',
    'SMTP_PASS',
    'AWS_SECRET_ACCESS_KEY',
    'REDIS_PASSWORD'
  ];
  
  const summary = {};
  
  for (const [key, value] of Object.entries(config)) {
    if (sensitiveKeys.includes(key)) {
      summary[key] = value ? '******' : null;
    } else if (typeof value === 'string' && value.length > 50) {
      summary[key] = value.substring(0, 50) + '...';
    } else {
      summary[key] = value;
    }
  }
  
  return summary;
}

module.exports = {
  BASIC_CONFIG_RULES,
  validateRequiredConfig,
  validateConfigValue,
  validateAllConfig,
  generateConfigSummary
};