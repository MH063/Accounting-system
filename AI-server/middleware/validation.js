/**
 * 参数验证中间件
 * 提供通用的参数验证功能，避免在各个路由中重复验证逻辑
 */

const logger = require('../config/logger');

/**
 * 验证请求中是否包含恶意内容
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const validateRequest = (req, res, next) => {
  // 检查请求体中的恶意内容
  const checkForMaliciousContent = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // 检查常见的XSS攻击模式
        if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value)) return true;
        if (/<img\b[^>]*\bsrc\b\s*=\s*["']javascript:/gi.test(value)) return true;
        if (/on\w+\s*=\s*["']?[^"'>\s]+/gi.test(value)) return true;
        if (/javascript:/gi.test(value)) return true;
        if (/data:text\/html/i.test(value)) return true;
      } else if (typeof value === 'object') {
        // 递归检查嵌套对象
        if (checkForMaliciousContent(value)) return true;
      }
    }
    return false;
  };

  // 检查请求体、查询参数和路径参数
  if (checkForMaliciousContent(req.body) || 
      checkForMaliciousContent(req.query) || 
      checkForMaliciousContent(req.params)) {
    logger.warn('[VALIDATION] 请求包含恶意内容', { 
      url: req.originalUrl,
      method: req.method 
    });
    return res.status(400).json({
      success: false,
      message: '请求包含恶意内容'
    });
  }

  next();
};

/**
 * 验证必需参数
 * @param {Array} requiredParams - 必需参数列表
 * @returns {Function} 中间件函数
 */
const validateRequiredParams = (requiredParams) => {
  return (req, res, next) => {
    const missingParams = [];
    
    for (const param of requiredParams) {
      if (!(param in req.body) && !(param in req.query) && !(param in req.params)) {
        missingParams.push(param);
      }
    }
    
    if (missingParams.length > 0) {
      const errorMessage = `缺少必需参数: ${missingParams.join(', ')}`;
      logger.warn('[VALIDATION] 参数验证失败', { 
        missingParams, 
        url: req.originalUrl,
        method: req.method 
      });
      
      return res.sendError(errorMessage, 400);
    }
    
    next();
  };
};

/**
 * 验证表名是否在白名单中
 * @param {Array} allowedTables - 允许的表名列表
 * @returns {Function} 中间件函数
 */
const validateTableName = (allowedTables) => {
  return (req, res, next) => {
    const tableName = req.query.table || req.body.table || req.params.table;
    
    // 基础验证：只允许字母、数字和下划线
    if (!tableName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      logger.warn('[VALIDATION] 表名格式无效', { 
        tableName,
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError('表名格式无效', 400);
    }
    
    // 检查是否在白名单中
    if (!allowedTables.includes(tableName)) {
      logger.warn('[VALIDATION] 表名不在白名单中', { 
        tableName,
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError(`表 "${tableName}" 不在允许查询的白名单中`, 403);
    }
    
    next();
  };
};

/**
 * 验证数字参数
 * @param {string} paramName - 参数名
 * @param {Object} options - 验证选项
 * @param {number} options.min - 最小值
 * @param {number} options.max - 最大值
 * @param {boolean} options.required - 是否必需
 * @returns {Function} 中间件函数
 */
const validateNumberParam = (paramName, options = {}) => {
  const { min, max, required = false } = options;
  
  return (req, res, next) => {
    const paramValue = req.query[paramName] || req.body[paramName] || req.params[paramName];
    
    // 如果参数不是必需的且未提供，则跳过验证
    if (!required && (paramValue === undefined || paramValue === null)) {
      return next();
    }
    
    // 如果参数是必需的但未提供
    if (required && (paramValue === undefined || paramValue === null)) {
      logger.warn('[VALIDATION] 缺少必需的数字参数', { 
        paramName,
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError(`缺少必需参数: ${paramName}`, 400);
    }
    
    const parsedValue = parseInt(paramValue, 10);
    
    // 检查是否为有效数字
    if (isNaN(parsedValue)) {
      logger.warn('[VALIDATION] 参数不是有效数字', { 
        paramName,
        paramValue,
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError(`${paramName} 参数必须是有效数字`, 400);
    }
    
    // 检查最小值
    if (min !== undefined && parsedValue < min) {
      logger.warn('[VALIDATION] 参数值小于最小值', { 
        paramName,
        paramValue: parsedValue,
        min,
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError(`${paramName} 参数不能小于 ${min}`, 400);
    }
    
    // 检查最大值
    if (max !== undefined && parsedValue > max) {
      logger.warn('[VALIDATION] 参数值大于最大值', { 
        paramName,
        paramValue: parsedValue,
        max,
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError(`${paramName} 参数不能大于 ${max}`, 400);
    }
    
    // 将解析后的值附加到请求对象中
    if (!req.parsedParams) {
      req.parsedParams = {};
    }
    req.parsedParams[paramName] = parsedValue;
    
    next();
  };
};

// 字符串参数验证中间件工厂函数
const validateStringParam = (paramName, { required = false, minLength, maxLength, pattern } = {}) => {
  
  return (req, res, next) => {
    const paramValue = req.query[paramName] || req.body[paramName] || req.params[paramName];
    
    // 如果参数不是必需的且未提供，则跳过验证
    if (!required && (paramValue === undefined || paramValue === null)) {
      return next();
    }
    
    // 如果参数是必需的但未提供
    if (required && (paramValue === undefined || paramValue === null)) {
      logger.warn('[VALIDATION] 缺少必需的字符串参数', { 
        paramName,
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError(`缺少必需参数: ${paramName}`, 400);
    }
    
    // 检查是否为字符串
    if (typeof paramValue !== 'string') {
      logger.warn('[VALIDATION] 参数不是字符串', { 
        paramName,
        paramValue,
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError(`${paramName} 参数必须是字符串`, 400);
    }
    
    // 检查最小长度
    if (minLength !== undefined && paramValue.length < minLength) {
      logger.warn('[VALIDATION] 参数长度小于最小值', { 
        paramName,
        paramValue,
        length: paramValue.length,
        minLength,
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError(`${paramName} 参数长度不能小于 ${minLength}`, 400);
    }
    
    // 检查最大长度
    if (maxLength !== undefined && paramValue.length > maxLength) {
      logger.warn('[VALIDATION] 参数长度大于最大值', { 
        paramName,
        paramValue,
        length: paramValue.length,
        maxLength,
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError(`${paramName} 参数长度不能大于 ${maxLength}`, 400);
    }
    
    // 检查正则表达式模式
    if (pattern && !pattern.test(paramValue)) {
      logger.warn('[VALIDATION] 参数不匹配正则表达式', { 
        paramName,
        paramValue,
        pattern: pattern.toString(),
        url: req.originalUrl,
        method: req.method 
      });
      return res.sendError(`${paramName} 参数格式不正确`, 400);
    }
    
    next();
  };
};

module.exports = {
  validateRequest,
  validateRequiredParams,
  validateTableName,
  validateNumberParam,
  validateStringParam
};