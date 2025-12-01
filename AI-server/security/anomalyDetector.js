/**
 * 异常访问检测和记录模块
 * 实时检测和记录异常访问模式
 */

const logger = require('../config/logger');
const { logAnomaly } = require('../middleware/security/auditLogger');

// 简单的内存存储（生产环境应使用Redis等缓存）
const anomalyStore = {
  loginAttempts: new Map(), // 记录登录尝试次数
  ipRequestCounts: new Map(), // 记录IP请求频率
  suspiciousPatterns: new Map(), // 记录可疑模式
  lastRequests: new Map() // 记录最后的请求时间
};

/**
 * 清理过期的统计数据
 */
const cleanupExpiredData = () => {
  const now = Date.now();
  const expiryTime = 60 * 60 * 1000; // 1小时过期
  
  // 清理登录尝试记录
  for (const [key, data] of anomalyStore.loginAttempts.entries()) {
    if (now - data.timestamp > expiryTime) {
      anomalyStore.loginAttempts.delete(key);
    }
  }
  
  // 清理IP请求记录
  for (const [key, data] of anomalyStore.ipRequestCounts.entries()) {
    if (now - data.timestamp > expiryTime) {
      anomalyStore.ipRequestCounts.delete(key);
    }
  }
}

/**
 * 检测频繁登录失败
 * @param {Object} req - 请求对象
 * @returns {boolean} 是否检测到频繁登录失败
 */
const detectFrequentLoginFailures = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const username = req.body?.username || 'unknown';
  const key = `${ip}:${username}`;
  
  const now = Date.now();
  const existingData = anomalyStore.loginAttempts.get(key);
  
  if (!existingData) {
    anomalyStore.loginAttempts.set(key, {
      count: 1,
      timestamp: now,
      lastFailedAttempts: []
    });
    return false;
  }
  
  // 清理过期的失败记录
  const recentFailures = existingData.lastFailedAttempts.filter(
    time => now - time < 15 * 60 * 1000 // 15分钟内
  );
  
  // 添加当前失败时间
  recentFailures.push(now);
  
  // 如果15分钟内失败超过5次，记录异常
  if (recentFailures.length > 5) {
    logAnomaly(req, 'FREQUENT_FAILED_LOGIN', {
      ip,
      username,
      failureCount: recentFailures.length,
      timeWindow: '15分钟',
      reason: '15分钟内登录失败超过5次'
    });
    
    // 重置计数器
    existingData.lastFailedAttempts = [];
    return true;
  }
  
  // 更新数据
  existingData.lastFailedAttempts = recentFailures;
  existingData.timestamp = now;
  
  return false;
};

/**
 * 检测IP请求频率异常
 * @param {Object} req - 请求对象
 * @returns {boolean} 是否检测到请求频率异常
 */
const detectUnusualRequestFrequency = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const key = ip;
  
  const existingData = anomalyStore.ipRequestCounts.get(key);
  
  if (!existingData) {
    anomalyStore.ipRequestCounts.set(key, {
      count: 1,
      timestamp: now,
      recentRequests: [now]
    });
    return false;
  }
  
  // 清理过期的请求记录（保留最近1分钟）
  const recentRequests = existingData.recentRequests.filter(
    time => now - time < 60 * 1000 // 1分钟内
  );
  
  // 添加当前请求时间
  recentRequests.push(now);
  
  // 如果1分钟内请求超过100次，记录异常
  if (recentRequests.length > 100) {
    logAnomaly(req, 'UNUSUAL_REQUEST_FREQUENCY', {
      ip,
      requestCount: recentRequests.length,
      timeWindow: '1分钟',
      reason: '1分钟内请求次数超过100次'
    });
    
    // 清理最近的请求记录，避免重复记录
    existingData.recentRequests = [];
    return true;
  }
  
  // 更新数据
  existingData.recentRequests = recentRequests;
  existingData.count++;
  existingData.timestamp = now;
  
  return false;
};

/**
 * 检测可疑的User-Agent
 * @param {Object} req - 请求对象
 * @returns {boolean} 是否检测到可疑的User-Agent
 */
const detectSuspiciousUserAgent = (req) => {
  const userAgent = req.get('User-Agent') || '';
  
  // 可疑的User-Agent模式
  const suspiciousPatterns = [
    /sqlmap/i,           // SQL注入工具
    /nikto/i,            // Web漏洞扫描器
    /nessus/i,           // 安全扫描器
    /acunetix/i,         // Web应用扫描器
    /burp/i,             // 代理工具
    /zap/i,              // OWASP ZAP
    /masscan/i,          // 端口扫描器
    /nmap/i,             // 网络扫描器
    /%27|%22|%3C|%3E/i,  // 明显的SQL注入尝试
    /union.*select/i,    // SQL注入尝试
    /<script|/i,         // XSS尝试
    /javascript:/i,      // JavaScript注入尝试
    /alert\(/i,          // XSS尝试
    /onerror=/i,         // XSS尝试
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious) {
    logAnomaly(req, 'SUSPICIOUS_USER_AGENT', {
      userAgent,
      reason: '检测到可疑的User-Agent模式'
    });
    return true;
  }
  
  return false;
};

/**
 * 检测路径遍历攻击
 * @param {Object} req - 请求对象
 * @returns {boolean} 是否检测到路径遍历攻击
 */
const detectPathTraversal = (req) => {
  const url = req.originalUrl || req.path;
  
  // 路径遍历攻击模式
  const traversalPatterns = [
    /\.\.\//,                    // ../ 模式
    /%2e%2e%2f/i,                // URL编码的 ../ 
    /%c0%af/i,                   // Unicode编码的 ../
    /\\\\/i,                     // Windows路径分隔符
    /~\//i,                      // 用户目录访问
    /\.\.\\/,                    // Windows ..\ 模式
  ];
  
  const isPathTraversal = traversalPatterns.some(pattern => pattern.test(url));
  
  if (isPathTraversal) {
    logAnomaly(req, 'PATH_TRAVERSAL_ATTEMPT', {
      url,
      reason: '检测到路径遍历攻击尝试'
    });
    return true;
  }
  
  return false;
};

/**
 * 检测暴力破解攻击
 * @param {Object} req - 请求对象
 * @returns {boolean} 是否检测到暴力破解攻击
 */
const detectBruteForceAttack = (req) => {
  const url = req.originalUrl || req.path;
  const body = req.body || {};
  
  // 检测暴力破解模式
  const bruteForcePatterns = [
    /^\/api\/auth\/login.*$/,  // 登录接口
    /^\/admin.*$/,            // 管理员接口
    /^\/login.*$/,            // 登录页面
  ];
  
  // 如果是登录相关接口
  const isLoginEndpoint = bruteForcePatterns.some(pattern => pattern.test(url));
  
  if (isLoginEndpoint) {
    // 检查是否有大量重复的登录尝试或非常规的密码尝试
    if (body.password && body.password.length > 50) {
      logAnomaly(req, 'BRUTE_FORCE_ATTACK', {
        url,
        passwordLength: body.password.length,
        reason: '检测到异常长度的密码尝试'
      });
      return true;
    }
    
    // 检查是否有SQL注入特征
    const injectionPatterns = [
      /('|(\\x27)|(\\x22)|(\\x23)|(\\x24))/i,
      /union.*select/i,
      /(select|insert|update|delete|drop|create|alter)/i,
      /(and|or)\s+[0-9]+.*[=><]/i
    ];
    
    const hasInjection = injectionPatterns.some(pattern => 
      JSON.stringify(body).toLowerCase().match(pattern)
    );
    
    if (hasInjection) {
      logAnomaly(req, 'SQL_INJECTION_ATTEMPT', {
        url,
        body: JSON.stringify(body).substring(0, 200),
        reason: '检测到SQL注入攻击尝试'
      });
      return true;
    }
  }
  
  return false;
};

/**
 * 检测异常访问模式的主要入口函数
 * @param {Object} req - 请求对象
 * @returns {Object} 检测结果
 */
const detectAnomalies = (req) => {
  try {
    // 清理过期的统计数据
    cleanupExpiredData();
    
    const anomalies = [];
    
    // 检测各种异常模式
    if (detectSuspiciousUserAgent(req)) {
      anomalies.push('SUSPICIOUS_USER_AGENT');
    }
    
    if (detectPathTraversal(req)) {
      anomalies.push('PATH_TRAVERSAL_ATTEMPT');
    }
    
    if (detectBruteForceAttack(req)) {
      anomalies.push('BRUTE_FORCE_ATTACK');
    }
    
    if (detectUnusualRequestFrequency(req)) {
      anomalies.push('UNUSUAL_REQUEST_FREQUENCY');
    }
    
    return {
      hasAnomalies: anomalies.length > 0,
      anomalyTypes: anomalies,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('异常检测过程发生错误:', error);
    return {
      hasAnomalies: false,
      anomalyTypes: [],
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * 检测登录失败频率（需要从登录控制器调用）
 * @param {Object} req - 请求对象
 * @returns {boolean} 是否检测到频繁登录失败
 */
const checkLoginFailureRate = (req) => {
  return detectFrequentLoginFailures(req);
};

/**
 * 获取异常统计数据
 * @returns {Object} 异常统计数据
 */
const getAnomalyStats = () => {
  const now = Date.now();
  
  return {
    timestamp: new Date().toISOString(),
    loginAttempts: anomalyStore.loginAttempts.size,
    ipRequestCounts: anomalyStore.ipRequestCounts.size,
    suspiciousPatterns: anomalyStore.suspiciousPatterns.size,
    dataRetention: {
      loginAttempts: Array.from(anomalyStore.loginAttempts.entries()).map(([key, data]) => ({
        key,
        count: data.count,
        lastActivity: new Date(data.timestamp).toISOString()
      })),
      requestFrequency: Array.from(anomalyStore.ipRequestCounts.entries()).map(([key, data]) => ({
        ip: key,
        count: data.count,
        lastActivity: new Date(data.timestamp).toISOString()
      }))
    }
  };
};

/**
 * 清除异常检测数据
 * @param {string} type - 要清除的数据类型
 */
const clearAnomalyData = (type) => {
  switch (type) {
    case 'loginAttempts':
      anomalyStore.loginAttempts.clear();
      break;
    case 'ipRequestCounts':
      anomalyStore.ipRequestCounts.clear();
      break;
    case 'suspiciousPatterns':
      anomalyStore.suspiciousPatterns.clear();
      break;
    case 'all':
      anomalyStore.loginAttempts.clear();
      anomalyStore.ipRequestCounts.clear();
      anomalyStore.suspiciousPatterns.clear();
      anomalyStore.lastRequests.clear();
      break;
    default:
      logger.warn('未知的异常数据类型:', type);
  }
  
  logger.info(`异常检测数据已清除: ${type}`);
};

module.exports = {
  detectAnomalies,
  checkLoginFailureRate,
  getAnomalyStats,
  clearAnomalyData,
  detectFrequentLoginFailures,
  detectUnusualRequestFrequency,
  detectSuspiciousUserAgent,
  detectPathTraversal,
  detectBruteForceAttack
};