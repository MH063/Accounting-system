/**
 * 简化配置模块入口文件
 * 提供轻量级的配置管理接口
 */

const { 
  initializeSimpleConfig, 
  getConfig, 
  setConfig, 
  getAllConfig, 
  reloadConfig, 
  saveConfig, 
  getConfigStatus 
} = require('./simpleConfigManager');

const { 
  validateRequiredConfig, 
  validateAllConfig, 
  generateConfigSummary 
} = require('./simpleConfigValidator');

const logger = require('./logger');

/**
 * 简化配置模块类
 */
class SimpleConfigModule {
  constructor() {
    this.initialized = false;
  }

  /**
   * 初始化配置模块
   */
  async initialize(options = {}) {
    if (this.initialized) {
      logger.warn('[SIMPLE_CONFIG] 配置模块已经初始化');
      return { success: true };
    }

    try {
      logger.info('[SIMPLE_CONFIG] 开始初始化配置模块...');
      
      // 初始化配置管理器
      const result = await initializeSimpleConfig(options.configPath);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // 验证必需配置
      const config = getAllConfig();
      const validation = validateRequiredConfig(config);
      
      if (!validation.success) {
        throw new Error(`必需配置验证失败: ${validation.errors.join(', ')}`);
      }
      
      this.initialized = true;
      logger.info('[SIMPLE_CONFIG] 配置模块初始化完成');
      
      return { success: true };
    } catch (error) {
      logger.error('[SIMPLE_CONFIG] 配置模块初始化失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取配置
   */
  get(key, defaultValue = null) {
    this.ensureInitialized();
    return getConfig(key, defaultValue);
  }

  /**
   * 设置配置
   */
  set(key, value) {
    this.ensureInitialized();
    return setConfig(key, value);
  }

  /**
   * 获取所有配置
   */
  getAll() {
    this.ensureInitialized();
    return getAllConfig();
  }

  /**
   * 获取配置摘要
   */
  getSummary() {
    this.ensureInitialized();
    const config = getAllConfig();
    return generateConfigSummary(config);
  }

  /**
   * 获取配置状态
   */
  getStatus() {
    return getConfigStatus();
  }

  /**
   * 验证配置
   */
  validate() {
    this.ensureInitialized();
    const config = getAllConfig();
    return validateAllConfig(config);
  }

  /**
   * 重新加载配置
   */
  async reload() {
    this.ensureInitialized();
    return await reloadConfig();
  }

  /**
   * 保存配置
   */
  async save() {
    this.ensureInitialized();
    return await saveConfig();
  }

  /**
   * 确保已初始化
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('配置模块未初始化，请先调用 initialize() 方法');
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    if (!this.initialized) {
      return { success: true };
    }

    try {
      logger.info('[SIMPLE_CONFIG] 清理配置模块资源...');
      // 这里可以添加特定的清理逻辑
      this.initialized = false;
      logger.info('[SIMPLE_CONFIG] 配置模块清理完成');
      return { success: true };
    } catch (error) {
      logger.error('[SIMPLE_CONFIG] 配置模块清理失败:', error);
      return { success: false, error: error.message };
    }
  }
}

// 创建单例实例
const simpleConfigModule = new SimpleConfigModule();

/**
 * 初始化配置模块
 */
async function initialize(options = {}) {
  return await simpleConfigModule.initialize(options);
}

/**
 * 获取配置
 */
function get(key, defaultValue = null) {
  return simpleConfigModule.get(key, defaultValue);
}

/**
 * 设置配置
 */
function set(key, value) {
  return simpleConfigModule.set(key, value);
}

/**
 * 获取所有配置
 */
function getAll() {
  return simpleConfigModule.getAll();
}

/**
 * 获取配置摘要
 */
function getSummary() {
  return simpleConfigModule.getSummary();
}

/**
 * 获取配置状态
 */
function getStatus() {
  return simpleConfigModule.getStatus();
}

/**
 * 验证配置
 */
function validate() {
  return simpleConfigModule.validate();
}

/**
 * 重新加载配置
 */
async function reload() {
  return await simpleConfigModule.reload();
}

/**
 * 保存配置
 */
async function save() {
  return await simpleConfigModule.save();
}

/**
 * 清理配置模块
 */
async function cleanup() {
  return await simpleConfigModule.cleanup();
}

// 导出所有功能
module.exports = {
  // 主要功能
  initialize,
  get,
  set,
  getAll,
  getSummary,
  getStatus,
  validate,
  reload,
  save,
  cleanup,
  
  // 类定义
  SimpleConfigModule,
  
  // 工具函数
  validateRequiredConfig,
  validateAllConfig,
  generateConfigSummary
};