/**
 * CORS配置模块
 * 提供更安全的跨域请求处理
 */

const cors = require('cors');
const logger = require('../config/logger');

/**
 * 验证来源是否在白名单中
 * @param {string} origin - 请求来源
 * @param {Array<string>} whitelist - 白名单数组
 * @returns {boolean} 是否允许
 */
const isOriginAllowed = (origin, whitelist) => {
  // 如果没有来源（如移动应用或curl请求），根据配置决定是否允许
  if (!origin) {
    return process.env.ALLOW_REQUESTS_WITHOUT_ORIGIN === 'true';
  }
  
  // 检查是否在白名单中
  return whitelist.some(allowedOrigin => {
    // 支持通配符域名
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(origin);
    }
    
    // 精确匹配
    return allowedOrigin.toLowerCase() === origin.toLowerCase();
  });
};

/**
 * 解析CORS白名单配置
 * @returns {Array<string>} 白名单数组
 */
const parseCorsWhitelist = () => {
  const whitelistStr = process.env.CORS_WHITELIST || '';
  
  if (!whitelistStr) {
    // 默认白名单
    return [
      'http://localhost:4000',
      'http://localhost:8000',
      'http://localhost:8100',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:8000',
      'http://127.0.0.1:8100',
      'http://172.25.37.9:4000',
      'http://172.25.37.9:8000',
      'http://172.25.37.9:8100'
    ];
  }
  
  // 解析逗号分隔的白名单
  return whitelistStr
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
};

/**
 * 获取CORS配置选项
 * @returns {Object} CORS配置选项
 */
const getCorsOptions = () => {
  const whitelist = parseCorsWhitelist();
  
  return {
    origin: function (origin, callback) {
      // 开发环境允许所有来源
      if (process.env.NODE_ENV === 'development' && process.env.ALLOW_ALL_ORIGINS_IN_DEV === 'true') {
        logger.debug(`[CORS] 开发环境允许来源: ${origin || '无来源'}`);
        return callback(null, true);
      }
      
      // 检查来源是否允许
      if (isOriginAllowed(origin, whitelist)) {
        logger.debug(`[CORS] 允许来源: ${origin || '无来源'}`);
        return callback(null, true);
      }
      
      // 记录被拒绝的来源
      logger.warn(`[CORS] 拒绝来源: ${origin || '无来源'}`);
      
      // 返回错误信息
      const error = new Error('不允许的跨域请求来源');
      error.status = 403;
      return callback(error, false);
    },
    credentials: true, // 允许发送cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // 允许的HTTP方法
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Accept-Language',
      'Content-Language',
      'Cache-Control',
      'X-API-Key',
      'X-Request-ID'
    ], // 允许的请求头
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Size',
      'X-Current-Page',
      'X-Total-Pages',
      'X-Request-ID'
    ], // 暴露的响应头
    maxAge: 86400, // 预检请求缓存时间（24小时）
    preflightContinue: false, // 是否将预检请求传递给下一个处理程序
    optionsSuccessStatus: 204 // 预检请求成功的状态码
  };
};

/**
 * 创建CORS中间件
 * @returns {Function} CORS中间件函数
 */
const createCorsMiddleware = () => {
  const corsOptions = getCorsOptions();
  return cors(corsOptions);
};

/**
 * 动态更新CORS白名单
 * @param {Array<string>} newWhitelist - 新的白名单
 */
const updateWhitelist = (newWhitelist) => {
  if (!Array.isArray(newWhitelist)) {
    throw new Error('白名单必须是数组');
  }
  
  // 更新环境变量
  process.env.CORS_WHITELIST = newWhitelist.join(',');
  
  logger.info(`[CORS] 白名单已更新，包含 ${newWhitelist.length} 个来源`);
};

/**
 * 添加来源到白名单
 * @param {string} origin - 要添加的来源
 */
const addToWhitelist = (origin) => {
  const currentWhitelist = parseCorsWhitelist();
  
  if (!currentWhitelist.includes(origin)) {
    currentWhitelist.push(origin);
    updateWhitelist(currentWhitelist);
    logger.info(`[CORS] 已添加来源到白名单: ${origin}`);
  }
};

/**
 * 从白名单中移除来源
 * @param {string} origin - 要移除的来源
 */
const removeFromWhitelist = (origin) => {
  const currentWhitelist = parseCorsWhitelist();
  const index = currentWhitelist.indexOf(origin);
  
  if (index > -1) {
    currentWhitelist.splice(index, 1);
    updateWhitelist(currentWhitelist);
    logger.info(`[CORS] 已从白名单中移除来源: ${origin}`);
  }
};

/**
 * 获取当前CORS配置信息
 * @returns {Object} 配置信息
 */
const getCorsInfo = () => {
  const whitelist = parseCorsWhitelist();
  
  return {
    environment: process.env.NODE_ENV,
    whitelistCount: whitelist.length,
    whitelist: whitelist,
    allowAllInDev: process.env.ALLOW_ALL_ORIGINS_IN_DEV === 'true',
    allowRequestsWithoutOrigin: process.env.ALLOW_REQUESTS_WITHOUT_ORIGIN === 'true',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    maxAge: 86400
  };
};

module.exports = {
  createCorsMiddleware,
  getCorsOptions,
  updateWhitelist,
  addToWhitelist,
  removeFromWhitelist,
  getCorsInfo,
  isOriginAllowed,
  parseCorsWhitelist
};