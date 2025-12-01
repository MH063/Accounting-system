/**
 * 简化配置管理器
 * 提供轻量级的配置管理功能
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * 简化配置管理器类
 */
class SimpleConfigManager {
  constructor(configPath = null) {
    this.config = {};
    this.configPath = configPath || path.join(process.cwd(), 'config.json');
    this.isInitialized = false;
  }

  /**
   * 初始化配置管理器
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn('[SIMPLE_CONFIG] 配置管理器已经初始化');
      return { success: true };
    }

    try {
      logger.info('[SIMPLE_CONFIG] 初始化配置管理器...');
      
      // 加载配置
      await this.loadConfig();
      
      this.isInitialized = true;
      logger.info('[SIMPLE_CONFIG] 配置管理器初始化完成');
      
      return { success: true };
    } catch (error) {
      logger.error('[SIMPLE_CONFIG] 配置管理器初始化失败:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * 加载配置
   */
  async loadConfig() {
    // 从环境变量加载基础配置
    this.config = this.loadFromEnvironment();
    
    // 尝试从配置文件加载
    try {
      const fileConfig = await this.loadFromFile();
      this.config = { ...this.config, ...fileConfig };
    } catch (error) {
      logger.debug('[SIMPLE_CONFIG] 无法加载配置文件:', error.message);
    }
  }

  /**
   * 从环境变量加载配置
   */
  loadFromEnvironment() {
    return {
      // 应用配置
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT) || 4000,
      
      // JWT配置
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
      
      // 数据库配置
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_PORT: parseInt(process.env.DB_PORT) || 5432,
      DB_NAME: process.env.DB_NAME || 'postgres',
      DB_USER: process.env.DB_USER || 'postgres',
      DB_PASSWORD: process.env.DB_PASSWORD,
      
      // 文件上传配置
      UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
      MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
      
      // 日志配置
      LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    };
  }

  /**
   * 从文件加载配置
   */
  async loadFromFile() {
    try {
      const configFile = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configFile);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 配置文件不存在，创建默认配置文件
        await this.createDefaultConfig();
        return {};
      }
      throw error;
    }
  }

  /**
   * 创建默认配置文件
   */
  async createDefaultConfig() {
    const defaultConfig = {
      app: {
        name: 'AI Server',
        version: '1.0.0',
        port: 4000
      },
      database: {
        host: 'localhost',
        port: 5432,
        name: 'postgres',
        user: 'postgres'
      },
      jwt: {
        expiresIn: '24h'
      },
      upload: {
        dir: './uploads',
        maxSize: 5242880
      }
    };

    try {
      await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2));
      logger.info('[SIMPLE_CONFIG] 创建默认配置文件:', this.configPath);
    } catch (error) {
      logger.warn('[SIMPLE_CONFIG] 无法创建默认配置文件:', error.message);
    }
  }

  /**
   * 获取配置值
   */
  get(key, defaultValue = null) {
    // 支持点号分隔的嵌套键
    if (key.includes('.')) {
      return this.getNestedValue(key, defaultValue);
    }
    
    return this.config.hasOwnProperty(key) ? this.config[key] : defaultValue;
  }

  /**
   * 获取嵌套值
   */
  getNestedValue(keyPath, defaultValue = null) {
    const keys = keyPath.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && value.hasOwnProperty(key)) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * 设置配置值
   */
  set(key, value) {
    this.config[key] = value;
    return { success: true };
  }

  /**
   * 获取所有配置
   */
  getAll() {
    // 返回配置的副本，防止外部修改
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * 重新加载配置
   */
  async reload() {
    try {
      await this.loadConfig();
      logger.info('[SIMPLE_CONFIG] 配置重新加载完成');
      return { success: true };
    } catch (error) {
      logger.error('[SIMPLE_CONFIG] 重新加载配置失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 保存配置到文件
   */
  async save() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      logger.info('[SIMPLE_CONFIG] 配置保存完成');
      return { success: true };
    } catch (error) {
      logger.error('[SIMPLE_CONFIG] 保存配置失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    // 简单配置管理器不需要特殊清理
    logger.info('[SIMPLE_CONFIG] 配置管理器资源清理完成');
  }

  /**
   * 获取配置状态
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      configPath: this.configPath,
      configKeys: Object.keys(this.config),
      configCount: Object.keys(this.config).length
    };
  }
}

// 创建单例实例
const simpleConfigManager = new SimpleConfigManager();

/**
 * 初始化配置管理器
 */
async function initializeSimpleConfig(configPath = null) {
  if (configPath) {
    simpleConfigManager.configPath = configPath;
  }
  return await simpleConfigManager.initialize();
}

/**
 * 获取配置值
 */
function getConfig(key, defaultValue = null) {
  return simpleConfigManager.get(key, defaultValue);
}

/**
 * 设置配置值
 */
function setConfig(key, value) {
  return simpleConfigManager.set(key, value);
}

/**
 * 获取所有配置
 */
function getAllConfig() {
  return simpleConfigManager.getAll();
}

/**
 * 重新加载配置
 */
async function reloadConfig() {
  return await simpleConfigManager.reload();
}

/**
 * 保存配置
 */
async function saveConfig() {
  return await simpleConfigManager.save();
}

/**
 * 获取配置状态
 */
function getConfigStatus() {
  return simpleConfigManager.getStatus();
}

module.exports = {
  SimpleConfigManager,
  simpleConfigManager,
  initializeSimpleConfig,
  getConfig,
  setConfig,
  getAllConfig,
  reloadConfig,
  saveConfig,
  getConfigStatus
};