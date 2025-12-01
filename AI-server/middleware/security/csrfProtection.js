/**
 * CSRF防护中间件
 * 仅对非API请求应用CSRF保护
 */

const crypto = require('crypto');
const logger = require('../../config/logger');

// CSRF token存储映射（内存存储，生产环境应使用Redis等持久化存储）
const csrfTokens = new Map();

/**
 * 生成CSRF token
 * @param {string} sessionId - 会话ID
 * @returns {string} CSRF token
 */
const generateCsrfToken = (sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (2 * 60 * 60 * 1000); // 2小时后过期
  
  // 存储token和过期时间
  csrfTokens.set(token, {
    sessionId,
    expiresAt
  });
  
  // 定期清理过期token（简单的垃圾回收机制）
  if (csrfTokens.size > 1000) {
    const now = Date.now();
    for (const [key, value] of csrfTokens.entries()) {
      if (value.expiresAt <= now) {
        csrfTokens.delete(key);
      }
    }
  }
  
  return token;
};

/**
 * 验证CSRF token
 * @param {string} token - CSRF token
 * @param {string} sessionId - 会话ID
 * @returns {boolean} 验证是否成功
 */
const validateCsrfToken = (token, sessionId) => {
  if (!token) {
    return false;
  }
  
  const tokenData = csrfTokens.get(token);
  if (!tokenData) {
    return false;
  }
  
  // 检查是否过期
  if (Date.now() > tokenData.expiresAt) {
    csrfTokens.delete(token);
    return false;
  }
  
  // 检查会话ID是否匹配
  if (tokenData.sessionId !== sessionId) {
    return false;
  }
  
  return true;
};

/**
 * 清理过期的CSRF token
 */
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (data.expiresAt <= now) {
      csrfTokens.delete(token);
    }
  }
};

// 每小时清理一次过期token
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

const csrfProtection = () => {
  return (req, res, next) => {
    try {
      // 检查是否为API请求
      if (req.path.startsWith('/api/')) {
        // API请求跳过CSRF检查
        return next();
      }
      
      // 检查请求方法
      const method = req.method.toUpperCase();
      const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);
      
      if (isSafeMethod) {
        // 安全方法可以执行，但在响应中设置CSRF token
        const sessionId = req.ip + (req.get('User-Agent') || '');
        const csrfToken = generateCsrfToken(sessionId);
        
        // 将CSRF token添加到响应头
        res.set('X-CSRF-Token', csrfToken);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        
        return next();
      }
      
      // 非安全方法需要CSRF token验证
      const sessionId = req.ip + (req.get('User-Agent') || '');
      const csrfToken = req.get('X-CSRF-Token') || req.body._csrf || req.query._csrf;
      
      if (!csrfToken) {
        logger.warn(`[CSRF] 缺少CSRF token: IP=${req.ip}, 路径=${req.path}, 方法=${method}`);
        return res.status(403).json({
          success: false,
          message: '缺少CSRF令牌，请刷新页面重试'
        });
      }
      
      // 验证CSRF token
      if (!validateCsrfToken(csrfToken, sessionId)) {
        logger.warn(`[CSRF] CSRF token验证失败: IP=${req.ip}, 路径=${req.path}, 方法=${method}`);
        return res.status(403).json({
          success: false,
          message: 'CSRF令牌无效，请刷新页面重试'
        });
      }
      
      // 验证成功后删除该token（一次性使用）
      csrfTokens.delete(csrfToken);
      
      // 添加安全头
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      next();
    } catch (error) {
      logger.error('[CSRF] CSRF保护检查失败:', error);
      // 出错时保守处理，阻止请求
      return res.status(403).json({
        success: false,
        message: '安全检查失败'
      });
    }
  };
};

/**
 * 创建CSRF token的独立函数，供前端使用
 * @param {Object} req - Express请求对象
 * @returns {string} CSRF token
 */
const createCsrfToken = (req) => {
  const sessionId = req.ip + (req.get('User-Agent') || '');
  return generateCsrfToken(sessionId);
};

/**
 * 获取CSRF配置信息
 * @returns {Object} 配置信息
 */
const getCsrfConfig = () => {
  return {
    enabled: true,
    methods: ['POST', 'PUT', 'DELETE', 'PATCH'],
    excludePaths: ['/api/'],
    tokenExpiration: 2 * 60 * 60 * 1000, // 2小时
    storageType: 'memory',
    activeTokens: csrfTokens.size,
    maxTokens: 1000
  };
};

module.exports = {
  csrfProtection,
  createCsrfToken,
  generateCsrfToken,
  validateCsrfToken,
  getCsrfConfig
};

// 导出内部函数供测试使用
module.exports._internal = {
  csrfTokens,
  generateCsrfToken,
  validateCsrfToken,
  cleanupExpiredTokens
};