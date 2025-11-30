/**
 * JWT密钥管理器
 * 实现密钥轮换机制，增强安全性
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// JWT密钥配置
const JWT_CONFIG = {
  // 主密钥（从环境变量获取）
  primarySecret: process.env.JWT_SECRET,
  // 备用密钥（用于密钥轮换）
  fallbackSecret: process.env.JWT_FALLBACK_SECRET || process.env.JWT_SECRET,
  // 密钥轮换间隔（默认30天）
  rotationInterval: parseInt(process.env.JWT_ROTATION_INTERVAL) || 30 * 24 * 60 * 60 * 1000,
  // 令牌过期时间
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  // 密钥文件存储路径
  keyFilePath: process.env.JWT_KEY_FILE || path.join(__dirname, '../data/jwt-keys.json'),
  // 密钥算法
  algorithm: 'HS256'
};

/**
 * JWT密钥管理器类
 */
class JWTManager {
  constructor() {
    this.currentKeyId = null;
    this.keys = new Map();
    this.loadKeys();
  }

  /**
   * 生成新的密钥对
   */
  generateKeyPair() {
    const keyId = crypto.randomBytes(16).toString('hex');
    const secret = crypto.randomBytes(64).toString('hex');
    const createdAt = Date.now();
    const expiresAt = createdAt + JWT_CONFIG.rotationInterval;

    return {
      id: keyId,
      secret,
      createdAt,
      expiresAt,
      isActive: true
    };
  }

  /**
   * 加载密钥
   */
  loadKeys() {
    try {
      if (fs.existsSync(JWT_CONFIG.keyFilePath)) {
        const keyData = JSON.parse(fs.readFileSync(JWT_CONFIG.keyFilePath, 'utf8'));
        
        // 加载主密钥
        if (JWT_CONFIG.primarySecret) {
          this.keys.set('primary', {
            id: 'primary',
            secret: JWT_CONFIG.primarySecret,
            createdAt: Date.now(),
            expiresAt: Date.now() + JWT_CONFIG.rotationInterval,
            isActive: true
          });
        }

        // 加载备用密钥
        if (JWT_CONFIG.fallbackSecret && JWT_CONFIG.fallbackSecret !== JWT_CONFIG.primarySecret) {
          this.keys.set('fallback', {
            id: 'fallback',
            secret: JWT_CONFIG.fallbackSecret,
            createdAt: Date.now() - JWT_CONFIG.rotationInterval / 2,
            expiresAt: Date.now() + JWT_CONFIG.rotationInterval / 2,
            isActive: true
          });
        }

        // 加载历史密钥（用于验证旧令牌）
        if (keyData.keys && Array.isArray(keyData.keys)) {
          keyData.keys.forEach(key => {
            if (key.isActive || (key.expiresAt > Date.now())) {
              this.keys.set(key.id, key);
            }
          });
        }

        this.currentKeyId = keyData.currentKeyId || 'primary';
        
        logger.info('[JWT] 密钥加载成功', { 
          keyCount: this.keys.size,
          currentKeyId: this.currentKeyId 
        });
      } else {
        // 首次运行，生成初始密钥
        this.initializeKeys();
      }
    } catch (error) {
      logger.error('[JWT] 密钥加载失败:', error);
      this.initializeKeys();
    }
  }

  /**
   * 初始化密钥
   */
  initializeKeys() {
    // 主密钥
    if (JWT_CONFIG.primarySecret) {
      this.keys.set('primary', {
        id: 'primary',
        secret: JWT_CONFIG.primarySecret,
        createdAt: Date.now(),
        expiresAt: Date.now() + JWT_CONFIG.rotationInterval,
        isActive: true
      });
      this.currentKeyId = 'primary';
    }

    // 备用密钥
    if (JWT_CONFIG.fallbackSecret && JWT_CONFIG.fallbackSecret !== JWT_CONFIG.primarySecret) {
      this.keys.set('fallback', {
        id: 'fallback',
        secret: JWT_CONFIG.fallbackSecret,
        createdAt: Date.now() - JWT_CONFIG.rotationInterval / 2,
        expiresAt: Date.now() + JWT_CONFIG.rotationInterval / 2,
        isActive: true
      });
    }

    this.saveKeys();
  }

  /**
   * 保存密钥到文件
   */
  saveKeys() {
    try {
      const keyData = {
        currentKeyId: this.currentKeyId,
        keys: Array.from(this.keys.values()),
        lastUpdated: Date.now()
      };

      // 确保目录存在
      const dir = path.dirname(JWT_CONFIG.keyFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(JWT_CONFIG.keyFilePath, JSON.stringify(keyData, null, 2));
      logger.info('[JWT] 密钥保存成功');
    } catch (error) {
      logger.error('[JWT] 密钥保存失败:', error);
    }
  }

  /**
   * 获取当前活动的密钥
   */
  getCurrentKey() {
    const key = this.keys.get(this.currentKeyId);
    if (!key || !key.isActive || key.expiresAt <= Date.now()) {
      // 当前密钥已过期，轮换到新密钥
      this.rotateKey();
      return this.keys.get(this.currentKeyId);
    }
    return key;
  }

  /**
   * 获取用于验证的密钥（包括历史密钥）
   */
  getVerificationKeys() {
    const validKeys = [];
    
    // 优先使用当前密钥
    const currentKey = this.getCurrentKey();
    if (currentKey) {
      validKeys.push(currentKey);
    }

    // 添加其他活动的密钥
    for (const key of this.keys.values()) {
      if (key.isActive && key.expiresAt > Date.now() && key.id !== this.currentKeyId) {
        validKeys.push(key);
      }
    }

    return validKeys;
  }

  /**
   * 轮换密钥
   */
  rotateKey() {
    try {
      // 生成新密钥
      const newKey = this.generateKeyPair();
      
      // 标记旧密钥为非活动状态（但保留用于验证现有令牌）
      const currentKey = this.keys.get(this.currentKeyId);
      if (currentKey) {
        currentKey.isActive = false;
      }

      // 添加新密钥
      this.keys.set(newKey.id, newKey);
      this.currentKeyId = newKey.id;

      // 清理过期的密钥
      this.cleanupExpiredKeys();

      // 保存到文件
      this.saveKeys();

      logger.info('[JWT] 密钥轮换完成', { 
        newKeyId: newKey.id,
        oldKeyId: currentKey?.id 
      });

      return newKey;
    } catch (error) {
      logger.error('[JWT] 密钥轮换失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期的密钥
   */
  cleanupExpiredKeys() {
    const now = Date.now();
    const gracePeriod = 24 * 60 * 60 * 1000; // 24小时宽限期

    for (const [keyId, key] of this.keys.entries()) {
      if (key.expiresAt + gracePeriod < now && key.id !== this.currentKeyId) {
        this.keys.delete(keyId);
        logger.info(`[JWT] 清理过期密钥: ${keyId}`);
      }
    }
  }

  /**
   * 获取密钥状态信息
   */
  getKeyStatus() {
    const currentKey = this.getCurrentKey();
    const verificationKeys = this.getVerificationKeys();

    return {
      currentKeyId: this.currentKeyId,
      currentKey: currentKey ? {
        id: currentKey.id,
        createdAt: currentKey.createdAt,
        expiresAt: currentKey.expiresAt,
        daysUntilExpiration: Math.ceil((currentKey.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
      } : null,
      verificationKeyCount: verificationKeys.length,
      totalKeyCount: this.keys.size,
      rotationInterval: JWT_CONFIG.rotationInterval
    };
  }
}

// 创建单例实例
const jwtManager = new JWTManager();

/**
 * 生成JWT令牌
 */
function generateToken(payload, options = {}) {
  const currentKey = jwtManager.getCurrentKey();
  if (!currentKey) {
    throw new Error('没有可用的JWT密钥');
  }

  const tokenOptions = {
    expiresIn: options.expiresIn || JWT_CONFIG.expiresIn,
    issuer: options.issuer || 'ai-server',
    audience: options.audience || 'api-users',
    algorithm: JWT_CONFIG.algorithm,
    keyid: currentKey.id
  };

  return require('jsonwebtoken').sign(payload, currentKey.secret, tokenOptions);
}

/**
 * 验证JWT令牌
 */
function verifyToken(token) {
  const verificationKeys = jwtManager.getVerificationKeys();
  
  // 尝试使用每个密钥进行验证
  for (const key of verificationKeys) {
    try {
      return require('jsonwebtoken').verify(token, key.secret, {
        algorithms: [JWT_CONFIG.algorithm]
      });
    } catch (error) {
      // 如果是因为密钥不匹配，继续尝试下一个密钥
      if (error.name === 'JsonWebTokenError' && error.message.includes('invalid signature')) {
        continue;
      }
      // 其他错误（如过期）直接抛出
      throw error;
    }
  }
  
  throw new Error('无效的令牌签名');
}

/**
 * 手动轮换密钥（用于管理）
 */
function rotateKey() {
  return jwtManager.rotateKey();
}

/**
 * 获取密钥状态
 */
function getKeyStatus() {
  return jwtManager.getKeyStatus();
}

module.exports = {
  generateToken,
  verifyToken,
  rotateKey,
  getKeyStatus,
  JWTManager: jwtManager
};