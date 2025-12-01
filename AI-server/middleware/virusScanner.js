/**
 * 病毒扫描模块
 * 使用ClamAV进行文件病毒扫描
 */

const NodeClam = require('clamav.js');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// 初始化ClamAV扫描引擎
let clamscan = null;
let isInitialized = false;

/**
 * 初始化ClamAV扫描引擎
 */
const initClamAV = async () => {
  try {
    // 检查是否已经初始化
    if (isInitialized && clamscan) {
      return true;
    }

    logger.info('[VIRUS-SCAN] 正在初始化ClamAV扫描引擎...');
    
    // 配置ClamAV选项
    const clamavConfig = {
      removeInfected: false, // 不自动删除感染文件，由我们手动处理
      quarantineInfected: false, // 不自动隔离感染文件
      scanLog: null, // 不使用额外的日志文件
      debugMode: false, // 不启用调试模式
      fileList: null, // 不扫描预定义文件列表
      scanRecursively: true, // 递归扫描
      clamscan: {
        path: 'clamscan', // 默认clamscan路径
        db: null, // 使用默认病毒数据库
        scanArchives: true, // 扫描压缩文件
        active: true // 启用扫描
      },
      clamdscan: {
        socket: false, // 不使用socket连接
        host: '[CLAMAV_HOST]', // ClamAV守护进程主机
        port: 3310, // ClamAV守护进程端口
        timeout: 30000, // 30秒超时
        localFallback: true // 如果clamdscan不可用，回退到clamscan
      },
      preference: 'clamdscan' // 优先使用clamdscan
    };

    // 创建ClamAV实例
    clamscan = await new NodeClam().init(clamavConfig);
    
    // 测试连接
    const version = await clamscan.getVersion();
    logger.info(`[VIRUS-SCAN] ClamAV初始化成功，版本: ${version}`);
    
    isInitialized = true;
    return true;
  } catch (error) {
    logger.error(`[VIRUS-SCAN] ClamAV初始化失败: ${error.message}`);
    
    // 在开发环境中，如果ClamAV不可用，我们使用模拟扫描
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[VIRUS-SCAN] 开发环境中ClamAV不可用，将使用模拟扫描');
      isInitialized = true;
      return true;
    }
    
    return false;
  }
};

/**
 * 扫描单个文件
 * @param {string} filePath - 要扫描的文件路径
 * @returns {Promise<Object>} 扫描结果
 */
const scanFile = async (filePath) => {
  try {
    // 确保ClamAV已初始化
    const isReady = await initClamAV();
    if (!isReady) {
      throw new Error('病毒扫描引擎初始化失败');
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    logger.info(`[VIRUS-SCAN] 开始扫描文件: ${path.basename(filePath)}`);
    
    // 在开发环境中使用模拟扫描
    if (process.env.NODE_ENV === 'development' && !clamscan) {
      logger.info(`[VIRUS-SCAN] 开发环境模拟扫描: ${path.basename(filePath)} - 安全`);
      return {
        isInfected: false,
        viruses: [],
        file: filePath,
        scanTime: new Date().toISOString()
      };
    }

    // 执行实际扫描
    const scanResult = await clamscan.scanFile(filePath);
    
    // 记录扫描结果
    if (scanResult.isInfected) {
      logger.error(`[VIRUS-SCAN] 检测到病毒: ${path.basename(filePath)} - ${scanResult.viruses.join(', ')}`);
    } else {
      logger.info(`[VIRUS-SCAN] 文件安全: ${path.basename(filePath)}`);
    }

    return {
      isInfected: scanResult.isInfected,
      viruses: scanResult.viruses || [],
      file: filePath,
      scanTime: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`[VIRUS-SCAN] 扫描文件失败: ${error.message}`);
    throw error;
  }
};

/**
 * 扫描多个文件
 * @param {Array<string>} filePaths - 要扫描的文件路径数组
 * @returns {Promise<Array<Object>>} 扫描结果数组
 */
const scanFiles = async (filePaths) => {
  try {
    const results = [];
    
    for (const filePath of filePaths) {
      const result = await scanFile(filePath);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    logger.error(`[VIRUS-SCAN] 批量扫描文件失败: ${error.message}`);
    throw error;
  }
};

/**
 * 检查是否有文件感染病毒
 * @param {Array<Object>} scanResults - 扫描结果数组
 * @returns {boolean} 是否有文件感染病毒
 */
const hasInfectedFiles = (scanResults) => {
  return scanResults.some(result => result.isInfected);
};

/**
 * 获取所有感染病毒的文件路径
 * @param {Array<Object>} scanResults - 扫描结果数组
 * @returns {Array<string>} 感染病毒的文件路径数组
 */
const getInfectedFiles = (scanResults) => {
  return scanResults
    .filter(result => result.isInfected)
    .map(result => result.file);
};

module.exports = {
  initClamAV,
  scanFile,
  scanFiles,
  hasInfectedFiles,
  getInfectedFiles
};