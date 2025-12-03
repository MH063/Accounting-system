/**
 * 数据加密和脱敏工具模块
 * 实现敏感数据的加密存储和日志脱敏功能
 */

const crypto = require('crypto');
const { logger } = require('../config/logger');

/**
 * AES-256-GCM 加密算法配置
 */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_DERIVATION_ITERATIONS = 100000;

/**
 * 生成密钥派生函数 (PBKDF2)
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, KEY_DERIVATION_ITERATIONS, 32, 'sha256');
}

/**
 * 加密数据
 */
function encrypt(text, password) {
  try {
    if (!text || !password) {
      throw new Error('文本和密码不能为空');
    }

    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12); // GCM模式推荐12字节IV
    const key = deriveKey(password, salt);
    
    const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, key);
    cipher.setAAD(Buffer.from('accounting-system', 'utf8')); // 附加认证数据
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: ENCRYPTION_ALGORITHM
    };
  } catch (error) {
    logger.error('[ENCRYPTION] 加密失败:', error);
    throw error;
  }
}

/**
 * 解密数据
 */
function decrypt(encryptedData, password) {
  try {
    if (!encryptedData || !password) {
      throw new Error('加密数据和密码不能为空');
    }

    const { encrypted, salt, iv, authTag } = encryptedData;
    
    const key = deriveKey(password, Buffer.from(salt, 'hex'));
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');
    
    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, key);
    decipher.setAAD(Buffer.from('accounting-system', 'utf8')); // 附加认证数据
    decipher.setAuthTag(authTagBuffer);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('[ENCRYPTION] 解密失败:', error);
    throw error;
  }
}

/**
 * 数据脱敏函数
 */
const DataMasking = {
  /**
   * 脱敏手机号
   */
  maskPhone(phone) {
    if (!phone || typeof phone !== 'string') return phone;
    const phoneRegex = /^(\d{3})\d{4}(\d{4})$/;
    return phone.replace(phoneRegex, '$1****$2');
  },

  /**
   * 脱敏身份证号
   */
  maskIdCard(idCard) {
    if (!idCard || typeof idCard !== 'string') return idCard;
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
  },

  /**
   * 脱敏银行卡号
   */
  maskBankCard(bankCard) {
    if (!bankCard || typeof bankCard !== 'string') return bankCard;
    return bankCard.replace(/(\d{4})\d{8,12}(\d{4})/, '$1**********$2');
  },

  /**
   * 脱敏邮箱
   */
  maskEmail(email) {
    if (!email || typeof email !== 'string') return email;
    const [username, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : username;
    
    return `${maskedUsername}@${domain}`;
  },

  /**
   * 脱敏IP地址
   */
  maskIPAddress(ip) {
    if (!ip || typeof ip !== 'string') return ip;
    
    // IPv4 脱敏
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Regex);
    if (match) {
      return `${match[1]}.${match[2]}.*.*`;
    }
    
    // IPv6 脱敏（简化）
    return ip.replace(/:([0-9a-fA-F]{4})/g, ':****');
  },

  /**
   * 脱敏用户姓名
   */
  maskName(name) {
    if (!name || typeof name !== 'string') return name;
    
    if (name.length === 1) {
      return name + '*';
    } else if (name.length === 2) {
      return name[0] + '*';
    } else {
      return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
    }
  },

  /**
   * 脱敏密码字段
   */
  maskPassword(password) {
    if (!password) return password;
    return '***';
  },

  /**
   * 脱敏Token
   */
  maskToken(token) {
    if (!token) return token;
    if (token.length > 10) {
      return token.substring(0, 6) + '*'.repeat(token.length - 10) + token.substring(token.length - 4);
    }
    return '*'.repeat(token.length);
  },

  /**
   * 通用对象脱敏
   */
  maskObject(obj, fields = []) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const masked = { ...obj };
    
    for (const field of fields) {
      if (masked[field]) {
        switch (field) {
          case 'phone':
          case 'mobile':
          case 'telephone':
            masked[field] = this.maskPhone(masked[field]);
            break;
          case 'idCard':
          case 'id_card':
            masked[field] = this.maskIdCard(masked[field]);
            break;
          case 'bankCard':
          case 'bank_card':
          case 'cardNumber':
            masked[field] = this.maskBankCard(masked[field]);
            break;
          case 'email':
            masked[field] = this.maskEmail(masked[field]);
            break;
          case 'ip':
          case 'ipAddress':
            masked[field] = this.maskIPAddress(masked[field]);
            break;
          case 'name':
          case 'realName':
            masked[field] = this.maskName(masked[field]);
            break;
          case 'password':
          case 'pwd':
            masked[field] = this.maskPassword(masked[field]);
            break;
          case 'token':
          case 'accessToken':
          case 'refreshToken':
            masked[field] = this.maskToken(masked[field]);
            break;
          default:
            // 对于未知字段，进行基本脱敏
            if (typeof masked[field] === 'string' && masked[field].length > 4) {
              masked[field] = masked[field].substring(0, 2) + '*'.repeat(masked[field].length - 4) + masked[field].substring(masked[field].length - 2);
            }
            break;
        }
      }
    }
    
    return masked;
  }
};

/**
 * 日志脱敏工具
 */
const LogMasking = {
  /**
   * 脱敏日志消息中的敏感信息
   */
  sanitizeLogMessage(message, context = {}) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    let sanitized = message;

    // 脱敏JSON数据中的敏感字段
    const sensitivePatterns = [
      /("password"\s*:\s*")[^"]*"/gi,
      /("pwd"\s*:\s*")[^"]*"/gi,
      /("token"\s*:\s*")[^"]*"/gi,
      /("accessToken"\s*:\s*")[^"]*"/gi,
      /("refreshToken"\s*:\s*")[^"]*"/gi,
      /("idCard"\s*:\s*")[^"]*"/gi,
      /("bankCard"\s*:\s*")[^"]*"/gi,
      /("phone"\s*:\s*")[^"]*"/gi,
      /("email"\s*:\s*")[^"]*"/gi
    ];

    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '$1***"');
    }

    // 脱敏URL中的敏感参数
    sanitized = sanitized.replace(/([?&])password=[^&]*/gi, '$1password=***');
    sanitized = sanitized.replace(/([?&])token=[^&]*/gi, '$1token=***');
    sanitized = sanitized.replace(/([?&])pwd=[^&]*/gi, '$1pwd=***');

    // 脱敏IP地址
    const ipRegex = /\b(\d{1,3}\.){3}\d{1,3}\b/g;
    sanitized = sanitized.replace(ipRegex, (match) => {
      return DataMasking.maskIPAddress(match);
    });

    // 如果有上下文，也进行脱敏
    if (context && typeof context === 'object') {
      const maskedContext = DataMasking.maskObject(context, [
        'password', 'pwd', 'token', 'accessToken', 'refreshToken',
        'idCard', 'bankCard', 'cardNumber', 'phone', 'mobile',
        'email', 'name', 'realName'
      ]);
      
      return {
        message: sanitized,
        context: maskedContext
      };
    }

    return sanitized;
  },

  /**
   * 创建脱敏后的错误日志
   */
  createSafeError(error, context = {}) {
    const sanitizedMessage = this.sanitizeLogMessage(error.message || 'Unknown error', context);
    const sanitizedStack = this.sanitizeLogMessage(error.stack || '', context);
    
    return {
      message: sanitizedMessage,
      stack: sanitizedStack,
      context: typeof context === 'object' 
        ? DataMasking.maskObject(context, [
          'password', 'pwd', 'token', 'accessToken', 'refreshToken',
          'idCard', 'bankCard', 'cardNumber', 'phone', 'mobile',
          'email', 'name', 'realName'
        ])
        : context
    };
  }
};

/**
 * 数据库字段加密装饰器
 */
function encryptField(password) {
  return {
    beforeSave: (model) => {
      for (const field in model) {
        if (model[field] && typeof model[field] === 'object') {
          continue;
        }
        
        // 对特定字段进行加密
        const encryptableFields = ['password', 'token', 'secret', 'privateKey', 'ssn', 'bankAccount'];
        
        if (encryptableFields.includes(field) && typeof model[field] === 'string' && model[field] !== '***') {
          try {
            const encrypted = encrypt(model[field], password);
            model[field] = JSON.stringify(encrypted);
          } catch (error) {
            logger.error(`[ENCRYPTION] 字段加密失败: ${field}`, error);
          }
        }
      }
      return model;
    },
    
    afterSave: (model) => {
      // 恢复原始值（如果在需要时）
      return model;
    }
  };
}

module.exports = {
  encrypt,
  decrypt,
  DataMasking,
  LogMasking,
  encryptField
};