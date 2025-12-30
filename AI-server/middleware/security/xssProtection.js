/**
 * XSS防护中间件
 * 检测和清理潜在的跨站脚本攻击载荷
 * 注意：Swagger UI 页面（/api/docs）需要返回完整的HTML，不进行XSS清理
 */

const logger = require('../../config/logger');

// 排除XSS清理的路径
const EXCLUDED_PATHS = ['/api/docs', '/docs', '/api/client/restart', '/api/client/disconnect'];

// 危险的HTML标签
const DANGEROUS_TAGS = [
  'script', 'iframe', 'embed', 'object', 'applet', 'form', 'input',
  'button', 'select', 'textarea', 'meta', 'link', 'style', 'base',
  'head', 'html', 'body', 'frame', 'frameset', 'noscript', 'noembed'
];

// 危险的HTML属性
const DANGEROUS_ATTRS = [
  'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover',
  'onmousemove', 'onmouseout', 'onkeypress', 'onkeydown', 'onkeyup',
  'onload', 'onunload', 'onfocus', 'onblur', 'onchange', 'onsubmit',
  'onerror', 'onselect', 'onreset', 'onabort', 'onbeforeunload',
  'onhashchange', 'onmessage', 'onpopstate', 'onstorage', 'onpageshow',
  'onpagehide', 'onbeforeprint', 'onafterprint', 'onresize', 'onscroll',
  'onmousewheel', 'onwheel', 'oncontextmenu', 'ondrag', 'ondragstart',
  'ondragenter', 'ondragover', 'ondragleave', 'ondrop', 'ondragend',
  'onanimationstart', 'onanimationend', 'onanimationiteration', 'ontransitionend',
  'onpointerdown', 'onpointerup', 'onpointermove', 'onpointerenter',
  'onpointerleave', 'onpointercancel', 'onwheel', 'ontouchstart',
  'ontouchmove', 'ontouchend', 'ontouchcancel'
];

// JavaScript协议
const JAVASCRIPT_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

/**
 * 清理HTML内容，移除危险的标签和属性
 * @param {string} html - 待清理的HTML内容
 * @returns {string} 清理后的HTML内容
 */
const cleanHtml = (html) => {
  if (typeof html !== 'string') {
    return html;
  }

  // 移除危险的标签
  let cleaned = html;
  for (const tag of DANGEROUS_TAGS) {
    const tagRegex = new RegExp(`<\\/?${tag}[^>]*>`, 'gi');
    cleaned = cleaned.replace(tagRegex, '');
  }

  // 移除危险的HTML属性
  for (const attr of DANGEROUS_ATTRS) {
    const attrRegex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    cleaned = cleaned.replace(attrRegex, '');
    
    const attrRegexNoQuotes = new RegExp(`\\s${attr}\\s*=\\s*[^\\s>"']*`, 'gi');
    cleaned = cleaned.replace(attrRegexNoQuotes, '');
  }

  // 移除JavaScript协议
  for (const protocol of JAVASCRIPT_PROTOCOLS) {
    const protocolRegex = new RegExp(`${protocol}`, 'gi');
    cleaned = cleaned.replace(protocolRegex, '');
  }

  // 移除危险的JavaScript相关字符串
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gis,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gis,
    /<object[^>]*>.*?<\/object>/gis,
    /<embed[^>]*>/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi
  ];

  for (const pattern of dangerousPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned;
};

/**
 * 检查内容是否包含XSS载荷
 * @param {*} content - 待检查的内容
 * @param {string} fieldName - 字段名（用于日志记录）
 * @param {Object} req - Express请求对象
 * @returns {boolean} 是否包含XSS载荷
 */
const hasXssPayload = (content, fieldName = '', req = null) => {
  if (typeof content === 'string') {
    const hasHtmlTags = /<[^>]*>/.test(content);
    if (hasHtmlTags) {
      // 检查危险标签
      for (const tag of DANGEROUS_TAGS) {
        if (content.toLowerCase().includes(`<${tag}`)) {
          if (req) {
            logger.security(req, 'XSS防护触发', {
              field: fieldName,
              dangerousTag: tag,
              payload: content.substring(0, 200)
            });
          }
          return true;
        }
      }

      // 检查危险属性
      for (const attr of DANGEROUS_ATTRS) {
        if (content.toLowerCase().includes(attr)) {
          if (req) {
            logger.security(req, 'XSS防护触发', {
              field: fieldName,
              dangerousAttr: attr,
              payload: content.substring(0, 200)
            });
          }
          return true;
        }
      }

      // 检查JavaScript协议
      for (const protocol of JAVASCRIPT_PROTOCOLS) {
        if (content.toLowerCase().includes(protocol)) {
          if (req) {
            logger.security(req, 'XSS防护触发', {
              field: fieldName,
              dangerousProtocol: protocol,
              payload: content.substring(0, 200)
            });
          }
          return true;
        }
      }

      // 检查其他危险模式
      const dangerousPatterns = [
        /<script[^>]*>/i,
        /on\w+\s*=/i,
        /javascript:/i,
        /vbscript:/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
          if (req) {
            logger.security(req, 'XSS防护触发', {
              field: fieldName,
              dangerousPattern: pattern.toString(),
              payload: content.substring(0, 200)
            });
          }
          return true;
        }
      }
    }
  } else if (typeof content === 'object' && content !== null) {
    // 递归检查对象属性
    for (const key in content) {
      if (hasXssPayload(content[key], `${fieldName}.${key}`, req)) {
        return true;
      }
    }
  } else if (Array.isArray(content)) {
    // 检查数组元素
    for (let i = 0; i < content.length; i++) {
      if (hasXssPayload(content[i], `${fieldName}[${i}]`, req)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * 清理对象中的所有字符串值
 * @param {*} obj - 待清理的对象
 * @returns {*} 清理后的对象
 */
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return cleanHtml(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  } else if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
};

/**
 * XSS防护中间件
 * 返回Express中间件函数
 */
const xssProtectionMiddleware = (req, res, next) => {
  try {
    // 检查路径是否需要排除XSS清理（Swagger UI页面）
    const shouldExclude = EXCLUDED_PATHS.some(path => 
      req.path === path || req.path.startsWith(path + '/')
    );

    // 如果是Swagger UI页面，跳过XSS清理
    if (shouldExclude) {
      return next();
    }

    // 检查查询参数
    if (hasXssPayload(req.query, '', req)) {
      logger.security(req, 'XSS防护触发 - 查询参数', {
        path: req.path,
        query: JSON.stringify(req.query).substring(0, 200)
      });

      return res.status(400).json({
        success: false,
        message: '请求参数包含不安全内容'
      });
    }

    // 检查请求体
    if (hasXssPayload(req.body, '', req)) {
      logger.security(req, 'XSS防护触发 - 请求体', {
        path: req.path,
        body: JSON.stringify(req.body).substring(0, 200)
      });

      return res.status(400).json({
        success: false,
        message: '请求体包含不安全内容'
      });
    }

    // 清理请求参数（移除危险内容）
    if (req.query && Object.keys(req.query).length > 0) {
      req.query = sanitizeObject(req.query);
    }

    if (req.body && Object.keys(req.body).length > 0) {
      req.body = sanitizeObject(req.body);
    }

    // 拦截带有危险HTML的响应（为API响应添加额外的安全层）
    const originalJson = res.json;
    res.json = function(obj) {
      if (obj && typeof obj === 'object') {
        const sanitized = sanitizeObject(obj);
        return originalJson.call(this, sanitized);
      }
      return originalJson.call(this, obj);
    };

    // 拦截带有危险HTML的响应
    const originalSend = res.send;
    res.send = function(data) {
      if (typeof data === 'string' && data.includes('<')) {
        const sanitized = cleanHtml(data);
        logger.security(req, 'XSS防护清理响应内容', {
          path: req.path,
          originalLength: data.length,
          sanitizedLength: sanitized.length
        });
        data = sanitized;
      }
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('XSS防护中间件错误', {
      error: error.message,
      stack: error.stack,
      path: req.path
    });
    next();
  }
};

// 创建导出对象，包含中间件函数和常量
module.exports = {
  // 导出XSS防护中间件函数
  xssProtection: xssProtectionMiddleware,
  
  // 导出常量供其他模块使用
  DANGEROUS_TAGS: DANGEROUS_TAGS,
  DANGEROUS_ATTRS: DANGEROUS_ATTRS,
  JAVASCRIPT_PROTOCOLS: JAVASCRIPT_PROTOCOLS
};