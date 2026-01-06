/**
 * 配置管理中心
 * 统一管理系统的所有配置，包括环境变量、数据库配置、缓存配置等
 */

const dotenv = require('dotenv');
const logger = require('./logger');
const { getSecureEnv, getSafeEnvDisplay, validateEnvConfig } = require('../utils/secureEnv');
const versionManager = require('./versionManager');

// 加载环境变量
dotenv.config({ path: '.env' });

/**
 * 配置管理器类
 */
class ConfigManager {
  constructor() {
    // 验证环境变量配置
    this.validateEnvironment();
    
    // 初始化配置
    this.config = {
      // 服务器配置
      server: this.getServerConfig(),
      
      // 数据库配置
      database: this.getDatabaseConfig(),
      
      // 缓存配置
      cache: this.getCacheConfig(),
      
      // 安全配置
      security: this.getSecurityConfig(),
      
      // 日志配置
      logging: this.getLoggingConfig(),
      
      // Redis配置
      redis: this.getRedisConfig(),
      
      // JWT配置
      jwt: this.getJwtConfig()
    };
  }

  /**
   * 验证环境变量配置
   */
  validateEnvironment() {
    const validationResult = validateEnvConfig();
    
    if (validationResult.status === 'ERROR') {
      logger.error('[CONFIG] 环境变量配置验证失败:', validationResult.errors);
      // 开发环境下允许继续运行，仅记录错误
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('环境变量配置验证失败');
      }
      logger.warn('[CONFIG] 开发环境继续运行，但请修复上述错误');
    } else if (validationResult.status === 'WARNING') {
      logger.warn('[CONFIG] 环境变量配置警告:', validationResult.warnings);
    }
    
    logger.info('[CONFIG] 环境变量配置验证通过');
  }

  /**
   * 获取服务器配置
   * @returns {Object} 服务器配置
   */
  getServerConfig() {
    const serverVersion = versionManager.getServerVersion();
    return {
      port: parseInt(getSecureEnv('PORT')) || 3000,
      host: getSecureEnv('HOST') || '0.0.0.0',
      environment: getSecureEnv('NODE_ENV') || 'development',
      appName: getSecureEnv('APP_NAME') || 'AI-Server',
      version: serverVersion.version
    };
  }

  /**
   * 获取数据库配置
   * @returns {Object} 数据库配置
   */
  getDatabaseConfig() {
    return {
      host: getSecureEnv('DB_HOST') || 'localhost',
      port: parseInt(getSecureEnv('DB_PORT')) || 5432,
      user: getSecureEnv('DB_USER') || 'postgres',
      password: getSecureEnv('DB_PASSWORD') || '',
      database: getSecureEnv('DB_NAME') || 'postgres',
      ssl: getSecureEnv('DB_SSL') === 'true',
      pool: {
        max: parseInt(getSecureEnv('DB_POOL_MAX')) || 20,
        min: parseInt(getSecureEnv('DB_POOL_MIN')) || 2,
        idleTimeoutMillis: parseInt(getSecureEnv('DB_IDLE_TIMEOUT')) || 30000,
        connectionTimeoutMillis: parseInt(getSecureEnv('DB_CONNECTION_TIMEOUT')) || 10000
      }
    };
  }

  /**
   * 获取缓存配置
   * @returns {Object} 缓存配置
   */
  getCacheConfig() {
    return {
      defaultAdapter: getSecureEnv('CACHE_DEFAULT_ADAPTER') || 'memory',
      memory: {
        maxKeys: parseInt(getSecureEnv('CACHE_MEMORY_MAX_KEYS')) || 10000,
        maxSize: parseInt(getSecureEnv('CACHE_MEMORY_MAX_SIZE')) || 50 * 1024 * 1024
      },
      redis: {
        maxKeys: parseInt(getSecureEnv('CACHE_REDIS_MAX_KEYS')) || 100000,
        maxSize: parseInt(getSecureEnv('CACHE_REDIS_MAX_SIZE')) || 500 * 1024 * 1024
      },
      warmup: {
        enabled: getSecureEnv('CACHE_WARMUP_ENABLED') === 'true',
        strategies: getSecureEnv('CACHE_WARMUP_STRATEGIES') ? 
                   getSecureEnv('CACHE_WARMUP_STRATEGIES').split(',') : 
                   ['popular', 'recent'],
        interval: parseInt(getSecureEnv('CACHE_WARMUP_INTERVAL')) || 300000,
        maxItems: parseInt(getSecureEnv('CACHE_WARMUP_MAX_ITEMS')) || 100
      }
    };
  }

  /**
   * 获取安全配置
   * @returns {Object} 安全配置
   */
  getSecurityConfig() {
    return {
      sessionSecret: getSecureEnv('SESSION_SECRET'),
      encryptionKey: getSecureEnv('ENCRYPTION_KEY') || getSecureEnv('SESSION_SECRET'),
      rateLimit: {
        windowMs: parseInt(getSecureEnv('RATE_LIMIT_WINDOW_MS')) || 60000,
        maxRequests: parseInt(getSecureEnv('RATE_LIMIT_MAX_REQUESTS')) || 100
      },
      cors: {
        origin: getSecureEnv('CORS_ORIGIN') || '*',
        credentials: getSecureEnv('CORS_CREDENTIALS') === 'true'
      }
    };
  }

  /**
   * 获取日志配置
   * @returns {Object} 日志配置
   */
  getLoggingConfig() {
    return {
      level: getSecureEnv('LOG_LEVEL') || 'info',
      rotation: {
        interval: parseInt(getSecureEnv('LOG_ROTATION_INTERVAL')) || 24 * 60 * 60 * 1000,
        compressionEnabled: getSecureEnv('LOG_COMPRESSION_ENABLED') === 'true',
        maxAge: parseInt(getSecureEnv('LOG_MAX_AGE')) || 30 * 24 * 60 * 60 * 1000
      }
    };
  }

  /**
   * 获取Redis配置
   * @returns {Object} Redis配置
   */
  getRedisConfig() {
    return {
      host: getSecureEnv('REDIS_HOST') || '127.0.0.1',
      port: parseInt(getSecureEnv('REDIS_PORT')) || 6379,
      password: getSecureEnv('REDIS_PASSWORD') || undefined,
      db: parseInt(getSecureEnv('REDIS_DB')) || 0
    };
  }

  /**
   * 获取JWT配置
   * @returns {Object} JWT配置
   */
  getJwtConfig() {
    return {
      secret: getSecureEnv('JWT_SECRET'),
      fallbackSecret: getSecureEnv('JWT_FALLBACK_SECRET') || 'fallback-jwt-secret',
      expiresIn: getSecureEnv('JWT_EXPIRES_IN') || '24h',
      refreshExpiresIn: getSecureEnv('JWT_REFRESH_EXPIRES_IN') || '7d',
      rotation: {
        intervalHours: parseInt(getSecureEnv('JWT_KEY_ROTATION_HOURS')) || 
                      (parseInt(getSecureEnv('JWT_KEY_ROTATION_DAYS')) || 30) * 24,
        gracePeriodHours: parseInt(getSecureEnv('JWT_KEY_GRACE_PERIOD_HOURS')) || 24,
        maxOldKeys: parseInt(getSecureEnv('JWT_MAX_OLD_KEYS')) || 3
      }
    };
  }

  /**
   * 获取配置值
   * @param {string} key - 配置键，使用点号分隔（如 'server.port'）
   * @param {*} defaultValue - 默认值
   * @returns {*} 配置值
   */
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * 设置配置值
   * @param {string} key - 配置键，使用点号分隔（如 'server.port'）
   * @param {*} value - 配置值
   */
  set(key, value) {
    const keys = key.split('.');
    let config = this.config;
    
    // 导航到倒数第二个键
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in config)) {
        config[keys[i]] = {};
      }
      config = config[keys[i]];
    }
    
    // 设置最后一个键的值
    config[keys[keys.length - 1]] = value;
    
    logger.debug(`[CONFIG] 配置已更新: ${key} = ${JSON.stringify(value)}`);
  }

  /**
   * 获取所有配置
   * @returns {Object} 所有配置
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * 重新加载配置
   */
  reload() {
    logger.info('[CONFIG] 重新加载配置');
    this.validateEnvironment();
    
    this.config.server = this.getServerConfig();
    this.config.database = this.getDatabaseConfig();
    this.config.cache = this.getCacheConfig();
    this.config.security = this.getSecurityConfig();
    this.config.logging = this.getLoggingConfig();
    this.config.redis = this.getRedisConfig();
    this.config.jwt = this.getJwtConfig();
    
    logger.info('[CONFIG] 配置重新加载完成');
  }

  /**
   * 获取安全显示的配置（隐藏敏感信息）
   * @returns {Object} 安全显示的配置
   */
  getSafeConfig() {
    const safeConfig = { ...this.config };
    
    // 隐藏敏感信息
    if (safeConfig.database && safeConfig.database.password) {
      safeConfig.database.password = '[REDACTED]';
    }
    
    if (safeConfig.redis && safeConfig.redis.password) {
      safeConfig.redis.password = '[REDACTED]';
    }
    
    if (safeConfig.security) {
      if (safeConfig.security.sessionSecret) {
        safeConfig.security.sessionSecret = '[REDACTED]';
      }
      if (safeConfig.security.encryptionKey) {
        safeConfig.security.encryptionKey = '[REDACTED]';
      }
    }
    
    if (safeConfig.jwt) {
      if (safeConfig.jwt.secret) {
        safeConfig.jwt.secret = '[REDACTED]';
      }
      if (safeConfig.jwt.fallbackSecret) {
        safeConfig.jwt.fallbackSecret = '[REDACTED]';
      }
    }
    
    return safeConfig;
  }
}

// 创建配置管理器实例
const configManager = new ConfigManager();

// 导出配置管理器
module.exports = {
  configManager,
  // 便捷方法
  get: (key, defaultValue) => configManager.get(key, defaultValue),
  set: (key, value) => configManager.set(key, value),
  getAll: () => configManager.getAll(),
  reload: () => configManager.reload(),
  getSafeConfig: () => configManager.getSafeConfig()
};