/**
 * 敏感数据过滤器
 * 用于过滤日志和错误消息中的敏感信息
 */

// 敏感数据模式列表
const SENSITIVE_PATTERNS = [
  // 密码相关
  { pattern: /password["\s:=]+([^\s"',}]+)/gi, replacement: 'password=***FILTERED***' },
  { pattern: /pwd["\s:=]+([^\s"',}]+)/gi, replacement: 'pwd=***FILTERED***' },
  { pattern: /passwd["\s:=]+([^\s"',}]+)/gi, replacement: 'passwd=***FILTERED***' },
  
  // JWT Token
  { pattern: /bearer\s+([a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+)/gi, replacement: 'bearer ***FILTERED***' },
  { pattern: /token["\s:=]+([a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+)/gi, replacement: 'token=***FILTERED***' },
  
  // API密钥
  { pattern: /api[_-]?key["\s:=]+([a-zA-Z0-9\-_]{20,})/gi, replacement: 'api_key=***FILTERED***' },
  { pattern: /secret[_-]?key["\s:=]+([a-zA-Z0-9\-_]{20,})/gi, replacement: 'secret_key=***FILTERED***' },
  
  // 数据库连接字符串
  { pattern: /postgres:\/\/[^:]+:[^@]+@[^\/]+/gi, replacement: 'postgres://***:***@***' },
  { pattern: /mysql:\/\/[^:]+:[^@]+@[^\/]+/gi, replacement: 'mysql://***:***@***' },
  { pattern: /mongodb:\/\/[^:]+:[^@]+@[^\/]+/gi, replacement: 'mongodb://***:***@***' },
  
  // 邮箱地址（部分遮蔽）
  { pattern: /([a-zA-Z0-9._-]{3})[a-zA-Z0-9._-]*@([a-zA-Z0-9.-]+)/g, replacement: '$1***@$2' },
  
  // 信用卡号
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '****-****-****-****' },
  
  // 身份证号（中国）
  { pattern: /\b\d{17}[\dXx]\b/g, replacement: '******************' },
  
  // 电话号码（部分遮蔽）
  { pattern: /\b1[3-9]\d{9}\b/g, replacement: (match) => match.substring(0, 3) + '****' + match.substring(7) },
  
  // IP地址（部分遮蔽）
  { pattern: /\b(\d{1,3}\.)(\d{1,3}\.)(\d{1,3}\.)(\d{1,3})\b/g, replacement: '$1$2***.$4' },
  
  // 会话ID
  { pattern: /session[_-]?id["\s:=]+([a-zA-Z0-9\-_]{20,})/gi, replacement: 'session_id=***FILTERED***' },
  
  // 访问令牌
  { pattern: /access[_-]?token["\s:=]+([a-zA-Z0-9\-_]{20,})/gi, replacement: 'access_token=***FILTERED***' },
  { pattern: /refresh[_-]?token["\s:=]+([a-zA-Z0-9\-_]{20,})/gi, replacement: 'refresh_token=***FILTERED***' }
];

/**
 * 过滤敏感数据
 * @param {string|Object} data - 要过滤的数据
 * @returns {string|Object} 过滤后的数据
 */
const filterSensitive = (data) => {
  if (!data) return data;

  // 如果是对象，转换为JSON字符串后过滤
  if (typeof data === 'object') {
    try {
      const jsonStr = JSON.stringify(data);
      const filtered = filterSensitiveString(jsonStr);
      return JSON.parse(filtered);
    } catch (error) {
      // 如果无法解析，直接返回原数据
      return data;
    }
  }

  // 如果是字符串，直接过滤
  if (typeof data === 'string') {
    return filterSensitiveString(data);
  }

  return data;
};

/**
 * 过滤字符串中的敏感数据
 * @param {string} str - 要过滤的字符串
 * @returns {string} 过滤后的字符串
 */
const filterSensitiveString = (str) => {
  if (!str || typeof str !== 'string') return str;

  let filtered = str;
  
  // 应用所有过滤模式
  SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
    filtered = filtered.replace(pattern, replacement);
  });

  return filtered;
};

/**
 * 过滤对象中的敏感字段
 * @param {Object} obj - 要过滤的对象
 * @param {Array<string>} sensitiveFields - 敏感字段列表
 * @returns {Object} 过滤后的对象
 */
const filterSensitiveFields = (obj, sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'sessionId']) => {
  if (!obj || typeof obj !== 'object') return obj;

  const filtered = { ...obj };

  sensitiveFields.forEach(field => {
    if (field in filtered) {
      filtered[field] = '***FILTERED***';
    }
  });

  // 递归处理嵌套对象
  Object.keys(filtered).forEach(key => {
    if (typeof filtered[key] === 'object' && filtered[key] !== null) {
      filtered[key] = filterSensitiveFields(filtered[key], sensitiveFields);
    }
  });

  return filtered;
};

/**
 * 检查字符串是否包含敏感数据
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否包含敏感数据
 */
const containsSensitiveData = (str) => {
  if (!str || typeof str !== 'string') return false;

  return SENSITIVE_PATTERNS.some(({ pattern }) => pattern.test(str));
};

module.exports = {
  filterSensitive,
  filterSensitiveString,
  filterSensitiveFields,
  containsSensitiveData,
  SENSITIVE_PATTERNS
};
