/**
 * 数据验证中间件
 * 基于Joi的数据验证、输入清理与规范化、输出数据脱敏
 */

const Joi = require('joi');
const logger = require('../config/logger');

/**
 * 数据验证中间件工厂函数
 * @param {Joi.Schema} schema - Joi验证模式
 * @param {Object} options - 验证选项
 * @returns {Function} Express中间件函数
 */
const validateData = (schema, options = {}) => {
  const {
    source = 'body', // 验证数据源: body, query, params
    stripUnknown = true, // 删除未知字段
    abortEarly = false, // 返回所有验证错误
    allowUnknown = false, // 允许未知字段
    convert = true, // 自动类型转换
    skipValidation = false // 跳过验证（用于调试）
  } = options;

  return async (req, res, next) => {
    try {
      // 如果跳过验证，直接通过
      if (skipValidation) {
        logger.debug('[DATA_VALIDATION] 跳过数据验证（调试模式）');
        return next();
      }

      // 获取要验证的数据
      const dataToValidate = req[source];
      
      if (!dataToValidate || typeof dataToValidate !== 'object') {
        logger.warn('[DATA_VALIDATION] 验证数据源无效', { source });
        return res.status(400).json({
          success: false,
          message: `验证数据源 ${source} 无效或不存在`
        });
      }

      // 执行验证
      const { error, value } = schema.validate(dataToValidate, {
        stripUnknown,
        abortEarly,
        allowUnknown,
        convert
      });

      if (error) {
        // 格式化验证错误
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          type: detail.type
        }));

        logger.warn('[DATA_VALIDATION] 数据验证失败', {
          url: req.originalUrl,
          method: req.method,
          errors: validationErrors,
          source
        });

        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validationErrors,
          errorCount: validationErrors.length
        });
      }

      // 记录验证成功日志
      logger.debug('[DATA_VALIDATION] 数据验证成功', {
        url: req.originalUrl,
        method: req.method,
        validatedFields: Object.keys(value),
        source
      });

      // 用验证后的数据替换原始数据
      req[source] = value;
      
      // 添加验证元数据
      req.validationMeta = {
        validatedAt: new Date().toISOString(),
        validatedSource: source,
        validatedFields: Object.keys(value),
        originalFields: Object.keys(dataToValidate)
      };

      next();
    } catch (error) {
      logger.error('[DATA_VALIDATION] 验证过程发生错误', error);
      return res.status(500).json({
        success: false,
        message: '数据验证过程发生错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * 输入清理与规范化中间件
 * 清理用户输入，防止XSS和其他注入攻击
 */
const sanitizeInput = (options = {}) => {
  const {
    removeXSS = true,
    normalizeWhitespace = true,
    trimStrings = true,
    removeNullBytes = true,
    maxStringLength = 10000,
    allowedTags = [], // 允许的HTML标签
    allowedAttributes = [] // 允许的HTML属性
  } = options;

  const cleanString = (str) => {
    if (typeof str !== 'string') return str;

    let cleaned = str;

    // 移除null字节
    if (removeNullBytes) {
      cleaned = cleaned.replace(/\0/g, '');
    }

    // 限制字符串长度
    if (cleaned.length > maxStringLength) {
      cleaned = cleaned.substring(0, maxStringLength);
      logger.warn('[SANITIZE] 字符串被截断', { 
        originalLength: str.length,
        maxLength: maxStringLength 
      });
    }

    // 移除XSS攻击代码
    if (removeXSS) {
      // 移除script标签
      cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // 移除javascript:协议
      cleaned = cleaned.replace(/javascript:/gi, '');
      
      // 移除事件处理器
      cleaned = cleaned.replace(/on\w+\s*=\s*["']?[^"'>\s]+/gi, '');
      
      // 移除data:协议
      cleaned = cleaned.replace(/data:text\/html/i, '');
      
      // 如果允许特定标签，进行白名单过滤
      if (allowedTags.length > 0) {
        const allowedTagsPattern = allowedTags.map(tag => `<${tag}[^>]*>|<\/${tag}>`).join('|');
        const regex = new RegExp(allowedTagsPattern, 'gi');
        cleaned = cleaned.replace(/<[^>]*>/g, (match) => {
          return regex.test(match) ? match : '';
        });
      } else {
        // 默认移除所有HTML标签
        cleaned = cleaned.replace(/<[^>]*>/g, '');
      }
    }

    // 规范化空白字符
    if (normalizeWhitespace) {
      cleaned = cleaned.replace(/\s+/g, ' ');
    }

    // 去除首尾空白
    if (trimStrings) {
      cleaned = cleaned.trim();
    }

    return cleaned;
  };

  const sanitizeObject = (obj, path = '') => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return cleanString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => 
        sanitizeObject(item, `${path}[${index}]`)
      );
    }

    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        try {
          sanitized[key] = sanitizeObject(value, currentPath);
        } catch (error) {
          logger.error('[SANITIZE] 清理字段失败', { 
            field: currentPath,
            error: error.message 
          });
          // 如果清理失败，使用原始值或空字符串
          sanitized[key] = typeof value === 'string' ? '' : value;
        }
      }
      return sanitized;
    }

    return obj;
  };

  return (req, res, next) => {
    try {
      // 清理请求体
      if (req.body && typeof req.body === 'object') {
        const originalBody = JSON.stringify(req.body).length;
        req.body = sanitizeObject(req.body, 'body');
        const cleanedBody = JSON.stringify(req.body).length;
        
        if (originalBody !== cleanedBody) {
          logger.info('[SANITIZE] 请求体已清理', {
            originalSize: originalBody,
            cleanedSize: cleanedBody,
            reduction: originalBody - cleanedBody
          });
        }
      }

      // 清理查询参数
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, 'query');
      }

      // 清理路径参数
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, 'params');
      }

      next();
    } catch (error) {
      logger.error('[SANITIZE] 输入清理过程发生错误', error);
      return res.status(500).json({
        success: false,
        message: '输入清理过程发生错误'
      });
    }
  };
};

/**
 * 输出数据脱敏中间件
 * 对响应数据进行脱敏处理，保护敏感信息
 */
const maskOutput = (options = {}) => {
  const {
    sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'ssn', 'phone', 'email'],
    maskPattern = '****',
    preserveLength = false,
    maskEmail = true,
    maskPhone = true,
    maskCreditCard = true,
    customMasks = {} // 自定义脱敏规则
  } = options;

  const maskString = (str, pattern = maskPattern) => {
    if (typeof str !== 'string') return str;
    
    if (preserveLength && str.length > 0) {
      return pattern.repeat(Math.ceil(str.length / pattern.length)).substring(0, str.length);
    }
    
    return pattern;
  };

  const maskEmailAddress = (email) => {
    if (typeof email !== 'string' || !email.includes('@')) return email;
    
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
      return `***@${domain}`;
    }
    
    const maskedLocal = localPart.substring(0, 2) + '***' + localPart.substring(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
  };

  const maskPhoneNumber = (phone) => {
    if (typeof phone !== 'string') return phone;
    
    // 移除非数字字符
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) return maskPattern;
    
    // 保留最后4位，其余用*代替
    const lastFour = digits.substring(digits.length - 4);
    const masked = '*'.repeat(digits.length - 4) + lastFour;
    
    // 重新格式化
    if (digits.length === 11) { // 中国大陆手机号
      return masked.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
    }
    
    return masked;
  };

  const maskCreditCardNumber = (cardNumber) => {
    if (typeof cardNumber !== 'string') return cardNumber;
    
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return maskPattern;
    
    // 保留前6位和后4位
    const firstSix = digits.substring(0, 6);
    const lastFour = digits.substring(digits.length - 4);
    const maskedMiddle = '*'.repeat(digits.length - 10);
    
    return `${firstSix}${maskedMiddle}${lastFour}`;
  };

  const shouldMaskField = (fieldName) => {
    const lowerFieldName = fieldName.toLowerCase();
    return sensitiveFields.some(sensitiveField => 
      lowerFieldName.includes(sensitiveField.toLowerCase())
    );
  };

  const applyCustomMasks = (fieldName, value) => {
    const lowerFieldName = fieldName.toLowerCase();
    for (const [pattern, masker] of Object.entries(customMasks)) {
      if (lowerFieldName.includes(pattern.toLowerCase())) {
        return typeof masker === 'function' ? masker(value) : maskString(value, masker);
      }
    }
    return null;
  };

  const maskObject = (obj, path = '') => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return maskString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => 
        maskObject(item, `${path}[${index}]`)
      );
    }

    if (typeof obj === 'object') {
      const masked = {};
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        try {
          // 应用自定义脱敏规则
          const customMasked = applyCustomMasks(key, value);
          if (customMasked !== null) {
            masked[key] = customMasked;
            continue;
          }

          // 检查是否需要脱敏
          if (shouldMaskField(key)) {
            if (options.maskEmail && key.toLowerCase().includes('email')) {
              masked[key] = maskEmailAddress(value);
            } else if (options.maskPhone && key.toLowerCase().includes('phone')) {
              masked[key] = maskPhoneNumber(value);
            } else if (options.maskCreditCard && key.toLowerCase().includes('credit')) {
              masked[key] = maskCreditCardNumber(value);
            } else {
              masked[key] = maskString(value);
            }
          } else {
            // 递归处理嵌套对象
            masked[key] = maskObject(value, currentPath);
          }
        } catch (error) {
          logger.error('[MASK] 脱敏字段失败', { 
            field: currentPath,
            error: error.message 
          });
          // 如果脱敏失败，使用默认脱敏
          masked[key] = maskString(String(value));
        }
      }
      return masked;
    }

    return obj;
  };

  return (req, res, next) => {
    // 保存原始的json方法
    const originalJson = res.json;
    
    // 重写json方法以应用脱敏
    res.json = function(body) {
      try {
        // 只对成功的响应进行脱敏
        if (body && body.success === true && body.data) {
          const maskedData = maskObject(body.data);
          
          // 记录脱敏日志
          const originalData = JSON.stringify(body.data).length;
          const maskedDataSize = JSON.stringify(maskedData).length;
          
          logger.debug('[MASK] 响应数据已脱敏', {
            originalSize: originalData,
            maskedSize: maskedDataSize,
            maskedFields: sensitiveFields
          });
          
          // 创建新的响应体
          const maskedBody = {
            ...body,
            data: maskedData,
            _meta: {
              ...body._meta,
              maskedAt: new Date().toISOString(),
              maskedFields: sensitiveFields
            }
          };
          
          return originalJson.call(this, maskedBody);
        }
        
        // 对非成功响应不进行处理
        return originalJson.call(this, body);
        
      } catch (error) {
        logger.error('[MASK] 响应脱敏过程发生错误', error);
        // 如果脱敏失败，返回原始响应
        return originalJson.call(this, body);
      }
    };
    
    next();
  };
};

/**
 * 常用Joi验证模式
 */
const commonSchemas = {
  // 用户注册验证模式
  userRegistration: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .required()
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名长度不能少于3个字符',
        'string.max': '用户名长度不能超过20个字符',
        'any.required': '用户名是必填项'
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱是必填项'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': '密码长度不能少于8个字符',
        'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
        'any.required': '密码是必填项'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': '两次输入的密码不一致',
        'any.required': '请确认密码'
      })
  }),

  // 用户登录验证模式
  userLogin: Joi.object({
    username: Joi.string().required().messages({
      'any.required': '用户名是必填项'
    }),
    password: Joi.string().required().messages({
      'any.required': '密码是必填项'
    }),
    rememberMe: Joi.boolean().optional()
  }),

  // 分页查询验证模式
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),

  // ID参数验证模式
  idParam: Joi.object({
    id: Joi.number().integer().min(1).required()
  }),

  // 搜索查询验证模式
  searchQuery: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    filters: Joi.object().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
  }),

  // 文件上传验证模式
  fileUpload: Joi.object({
    filename: Joi.string().max(255).required(),
    size: Joi.number().integer().max(10 * 1024 * 1024).required(), // 10MB
    mimetype: Joi.string().valid(
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ).required()
  })
};

/**
 * 组合验证中间件
 * 同时应用数据验证、输入清理和输出脱敏
 */
const comprehensiveValidation = (schema, options = {}) => {
  return [
    // 1. 输入清理
    sanitizeInput(options.sanitizeOptions),
    // 2. 数据验证
    validateData(schema, options.validationOptions),
    // 3. 输出脱敏
    maskOutput(options.maskOptions)
  ];
};

module.exports = {
  validateData,
  sanitizeInput,
  maskOutput,
  commonSchemas,
  comprehensiveValidation
};