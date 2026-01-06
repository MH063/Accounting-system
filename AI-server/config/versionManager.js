/**
 * 统一版本管理器
 * 提供从项目根目录 version.json 文件动态获取版本信息的功能
 * 支持 AI-web、AI-server、AI-admin 三个项目的版本管理
 */

const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

const PROJECT_PATHS = {
  web: path.join(__dirname, '../../AI-web/version.json'),
  server: path.join(__dirname, '../../AI-server/version.json'),
  admin: path.join(__dirname, '../../AI-admin/public/version.json')
};

const DEFAULT_VERSION_INFO = {
  version: '1.0.0',
  name: '记账管理系统',
  buildTime: new Date().toISOString()
};

const versionCache = new Map();

function parseVersionFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`版本文件不存在: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data.version) {
      throw new Error('版本文件中缺少 version 字段');
    }

    return {
      version: data.version,
      name: data.name || DEFAULT_VERSION_INFO.name,
      buildTime: data.buildTime || new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`版本文件 JSON 格式错误: ${filePath}`);
    }
    throw error;
  }
}

function getVersionFromFile(projectKey) {
  const filePath = PROJECT_PATHS[projectKey];

  if (!filePath) {
    throw new Error(`无效的项目标识: ${projectKey}`);
  }

  try {
    const versionInfo = parseVersionFile(filePath);
    versionCache.set(projectKey, versionInfo);
    return versionInfo;
  } catch (error) {
    logger.warn(`[VersionManager] 获取 ${projectKey} 版本信息失败: ${error.message}`);
    return { ...DEFAULT_VERSION_INFO, name: getProjectName(projectKey) };
  }
}

function getProjectName(projectKey) {
  const projectNames = {
    web: '记账管理系统客户端',
    server: '记账管理系统服务端',
    admin: '记账管理系统管理端'
  };
  return projectNames[projectKey] || '记账管理系统';
}

const versionManager = {
  /**
   * 获取指定项目的版本信息
   * @param {string} projectKey - 项目标识 (web, server, admin)
   * @returns {Object} 版本信息对象 { version, name, buildTime }
   */
  getVersion(projectKey) {
    return getVersionFromFile(projectKey);
  },

  /**
   * 获取指定项目的版本号
   * @param {string} projectKey - 项目标识 (web, server, admin)
   * @returns {string} 版本号字符串
   */
  getVersionNumber(projectKey) {
    return getVersionFromFile(projectKey).version;
  },

  /**
   * 获取客户端版本信息
   * @returns {Object} 版本信息对象
   */
  getWebVersion() {
    return getVersionFromFile('web');
  },

  /**
   * 获取服务端版本信息
   * @returns {Object} 版本信息对象
   */
  getServerVersion() {
    return getVersionFromFile('server');
  },

  /**
   * 获取管理端版本信息
   * @returns {Object} 版本信息对象
   */
  getAdminVersion() {
    return getVersionFromFile('admin');
  },

  /**
   * 刷新指定项目的版本缓存
   * @param {string} projectKey - 项目标识 (web, server, admin)
   * @returns {Object} 最新的版本信息对象
   */
  refreshVersion(projectKey) {
    versionCache.delete(projectKey);
    return getVersionFromFile(projectKey);
  },

  /**
   * 刷新所有项目的版本缓存
   * @returns {Object} 所有项目的版本信息
   */
  refreshAllVersions() {
    versionCache.clear();
    return {
      web: getVersionFromFile('web'),
      server: getVersionFromFile('server'),
      admin: getVersionFromFile('admin')
    };
  },

  /**
   * 获取所有项目的版本信息（包含缓存）
   * @returns {Object} 所有项目的版本信息
   */
  getAllVersions() {
    return {
      web: getVersionFromFile('web'),
      server: getVersionFromFile('server'),
      admin: getVersionFromFile('admin')
    };
  },

  /**
   * 验证版本文件配置
   * @param {string} projectKey - 项目标识 (web, server, admin)
   * @returns {Object} 验证结果 { valid, message, versionInfo }
   */
  validateVersionFile(projectKey) {
    const filePath = PROJECT_PATHS[projectKey];

    try {
      const versionInfo = parseVersionFile(filePath);
      return {
        valid: true,
        message: '版本文件配置正确',
        versionInfo
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message,
        versionInfo: { ...DEFAULT_VERSION_INFO, name: getProjectName(projectKey) }
      };
    }
  },

  /**
   * 检查是否需要更新版本文件
   * @param {string} projectKey - 项目标识
   * @param {string} expectedVersion - 期望的版本号
   * @returns {boolean} 是否需要更新
   */
  isVersionUpdated(projectKey, expectedVersion) {
    const currentVersion = getVersionFromFile(projectKey).version;
    return currentVersion !== expectedVersion;
  }
};

module.exports = versionManager;
