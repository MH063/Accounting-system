/**
 * SQL注入防护中间件
 * 使用白名单验证和参数化查询机制防止SQL注入攻击
 */

const logger = require('../../config/logger');

// 排除SQL注入检查的路径
const EXCLUDED_PATHS = ['/api/docs', '/docs', '/api/client/restart', '/api/client/disconnect'];

// 允许的字符模式（白名单）
const ALLOWED_PATTERNS = {
  // 数字
  NUMBER: /^\d+$/,
  // 字母数字和下划线
  ALPHANUMERIC: /^[a-zA-Z0-9_]+$/,
  // 安全的标识符
  IDENTIFIER: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  // 安全的搜索词
  SEARCH_TERM: /^[a-zA-Z0-9\u4e00-\u9fa5 _\-.,!?]*$/
};

// 危险的SQL关键字
const DANGEROUS_KEYWORDS = [
  'union', 'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter', 
  'exec', 'execute', 'script', 'truncate', 'shutdown', 'kill', 'grant', 'revoke',
  'declare', 'cast', 'convert', 'waitfor', 'delay', 'benchmark', 'sleep', 'extractvalue', 'updatexml'
];

// 危险的操作符
const DANGEROUS_OPERATORS = [
  '--', ';', '/*', '*/', '@@', 'char', 'nchar', 'varchar', 'nvarchar',
  'concat', 'group_concat', 'information_schema', 'table_schema', 'load_file'
];

const sqlInjectionProtection = () => {
  /**
   * 检查值是否包含SQL注入风险
   * @param {*} value - 要检查的值
   * @param {string} fieldName - 字段名（用于白名单验证）
   * @returns {boolean} 是否存在风险
   */
  const checkValue = (value, fieldName = '') => {
    // 跳过对某些字段的严格检查（这些字段通常是安全的用户输入）
    const SKIP_STRICT_CHECK_FIELDS = [
      'userAgent', 'user_agent', 'User-Agent', 
      'description', 'message', 'content', 'notes',
      'password', 'newPassword', 'currentPassword', 'confirmPassword',
      'answer', 'securityAnswer',
      'secret', 'backupCode', 'backupCodes',
      'operation', 'action', 'type', 'outcome', 'status',
      // 支付相关配置字段
      'appId', 'merchantId', 'apiKey', 'privateKey', 'publicKey', 
      'cert', 'certificate', 'apiV3Key', 'partnerId', 'mchId', 
      'serialNo', 'notifyUrl', 'returnUrl',
      'private_key', 'public_key', 'api_key', 'mch_id', 'partner_id',
      'alipayPublicKey', 'merchantPrivateKey', 'wechatPayKey', 'key'
    ];
    if (fieldName && SKIP_STRICT_CHECK_FIELDS.some(field => fieldName.includes(field))) {
      return false;
    }
    
    if (typeof value === 'string') {
      // 转换为小写进行检查
      const lowerValue = value.toLowerCase();
      
      // 检查危险关键字
      for (const keyword of DANGEROUS_KEYWORDS) {
        if (lowerValue.includes(keyword)) {
          logger.warn(`[SECURITY] 检测到危险SQL关键字: ${keyword}, 值=${value.substring(0, 100)}`);
          return true;
        }
      }
      
      // 检查危险操作符
      for (const operator of DANGEROUS_OPERATORS) {
        if (lowerValue.includes(operator)) {
          logger.warn(`[SECURITY] 检测到危险SQL操作符: ${operator}, 值=${value.substring(0, 100)}`);
          return true;
        }
      }
      
      // 检查特殊字符
      const specialChars = ['\x00', '\x1a', '\\', "'", '"', '`'];
      for (const char of specialChars) {
        if (value.includes(char)) {
          logger.warn(`[SECURITY] 检测到危险字符: ${char}, 值=${value.substring(0, 100)}`);
          return true;
        }
      }
      
      // 根据字段名应用白名单验证
      if (fieldName) {
        // 表名验证
        if (fieldName.includes('table') || fieldName.includes('Table')) {
          if (!ALLOWED_PATTERNS.IDENTIFIER.test(value)) {
            logger.warn(`[SECURITY] 表名不符合白名单规则: ${value}`);
            return true;
          }
        }
        
        // ID验证
        if (fieldName.includes('id') || fieldName.includes('Id')) {
          if (!ALLOWED_PATTERNS.NUMBER.test(value)) {
            logger.warn(`[SECURITY] ID字段不符合白名单规则: ${value}`);
            return true;
          }
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // 递归检查对象属性
      for (const key in value) {
        if (checkValue(value[key], key)) {
          return true;
        }
      }
    } else if (Array.isArray(value)) {
      // 检查数组元素
      for (const item of value) {
        if (checkValue(item)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  return (req, res, next) => {
    // 检查是否在排除名单中
    if (EXCLUDED_PATHS.some(path => req.path.startsWith(path))) {
      return next();
    }

    try {
      // 检查查询参数
      if (checkValue(req.query)) {
        logger.security(req, 'SQL注入防护触发 - 查询参数', { 
          path: req.path,
          query: JSON.stringify(req.query).substring(0, 200)
        });
        
        return res.status(400).json({
          success: false,
          message: '请求参数包含不安全内容'
        });
      }
      
      // 检查请求体
      if (checkValue(req.body)) {
        logger.security(req, 'SQL注入防护触发 - 请求体', { 
          path: req.path,
          body: JSON.stringify(req.body).substring(0, 200)
        });
        
        return res.status(400).json({
          success: false,
          message: '请求体包含不安全内容'
        });
      }
      
      // 检查路径参数
      if (checkValue(req.params)) {
        logger.security(req, 'SQL注入防护触发 - 路径参数', { 
          path: req.path,
          params: JSON.stringify(req.params).substring(0, 200)
        });
        
        return res.status(400).json({
          success: false,
          message: '路径参数包含不安全内容'
        });
      }
      
      next();
    } catch (error) {
      logger.error('[SECURITY] SQL注入防护检查失败:', error);
      // 出错时保守处理，阻止请求
      return res.status(400).json({
        success: false,
        message: '安全检查失败'
      });
    }
  };
};

module.exports = sqlInjectionProtection;

// 导出常量供其他模块使用
module.exports.ALLOWED_PATTERNS = ALLOWED_PATTERNS;
module.exports.DANGEROUS_KEYWORDS = DANGEROUS_KEYWORDS;
module.exports.DANGEROUS_OPERATORS = DANGEROUS_OPERATORS;