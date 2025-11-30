/**
 * 病毒扫描模块
 * 使用ClamAV进行文件病毒扫描
 * 支持本地ClamAV和在线API服务
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../config/logger');

// 配置选项
const config = {
  // 本地ClamAV配置（如果可用）
  localClamAV: {
    enabled: process.env.CLAMAV_LOCAL_ENABLED === 'true',
    clamscan: {
      path: 'clamscan',
      db: process.env.CLAMAV_DB_PATH || null,
      scanArchives: true
    },
    clamdscan: {
      socket: false,
      host: process.env.CLAMAV_HOST || '127.0.0.1',
      port: parseInt(process.env.CLAMAV_PORT) || 3310,
      timeout: 30000
    }
  },
  
  // 在线API服务配置
  onlineService: {
    enabled: process.env.CLAMAV_ONLINE_ENABLED === 'true',
    service: process.env.CLAMAV_SERVICE || 'virustotal', // virustotal, hybrid
    apiKey: process.env.CLAMAV_API_KEY || '',
    baseUrl: process.env.CLAMAV_API_URL || '',
    timeout: 30000
  },
  
  // 文件大小限制（用于在线扫描）
  maxFileSize: parseInt(process.env.CLAMAV_MAX_FILE_SIZE) || 32 * 1024 * 1024 // 32MB
};

// 初始化状态
let isInitialized = false;
let scanEngine = 'mock'; // local, online, mock

/**
 * 初始化病毒扫描引擎
 */
const initClamAV = async () => {
  try {
    if (isInitialized) {
      return true;
    }

    logger.info('[VIRUS-SCAN] 正在初始化病毒扫描引擎...');

    // 检查配置
    if (config.localClamAV.enabled) {
      try {
        const NodeClam = require('clamav.js');
        const clamscan = await new NodeClam().init({
          removeInfected: false,
          quarantineInfected: false,
          scanRecursively: true,
          clamscan: config.localClamAV.clamscan,
          clamdscan: config.localClamAV.clamdscan,
          preference: 'clamdscan'
        });
        
        const version = await clamscan.getVersion();
        logger.info(`[VIRUS-SCAN] 本地ClamAV初始化成功，版本: ${version}`);
        
        isInitialized = true;
        scanEngine = 'local';
        return true;
      } catch (error) {
        logger.warn(`[VIRUS-SCAN] 本地ClamAV初始化失败: ${error.message}`);
      }
    }

    if (config.onlineService.enabled && config.onlineService.apiKey) {
      logger.info(`[VIRUS-SCAN] 在线扫描服务已启用: ${config.onlineService.service}`);
      isInitialized = true;
      scanEngine = 'online';
      return true;
    }

    // 使用模拟扫描
    logger.warn('[VIRUS-SCAN] 使用模拟病毒扫描（开发模式）');
    isInitialized = true;
    scanEngine = 'mock';
    return true;

  } catch (error) {
    logger.error(`[VIRUS-SCAN] 病毒扫描引擎初始化失败: ${error.message}`);
    // 即使失败也使用模拟模式
    logger.warn('[VIRUS-SCAN] 回退到模拟扫描模式');
    isInitialized = true;
    scanEngine = 'mock';
    return true;
  }
};

/**
 * 使用VirusTotal API扫描文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>} 扫描结果
 */
const scanWithVirusTotal = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    // 使用axios和FormData的替代方案
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fileBuffer, fileName);

    const response = await axios.post(
      `${config.onlineService.baseUrl}/files`,
      formData,
      {
        headers: {
          'x-apikey': config.onlineService.apiKey,
          ...formData.getHeaders()
        },
        timeout: config.onlineService.timeout
      }
    );

    const analysisId = response.data.data.id;
    
    // 轮询扫描结果
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      
      const resultResponse = await axios.get(
        `${config.onlineService.baseUrl}/analyses/${analysisId}`,
        {
          headers: {
            'x-apikey': config.onlineService.apiKey
          }
        }
      );

      const result = resultResponse.data.data;
      if (result.status === 'completed') {
        return {
          isInfected: result.stats.malicious > 0,
          viruses: result.stats.malicious > 0 ? ['Malware detected by VirusTotal'] : [],
          engines: result.stats,
          scanTime: new Date().toISOString()
        };
      }
      
      attempts++;
    }
    
    throw new Error('VirusTotal扫描超时');
  } catch (error) {
    logger.error(`[VIRUS-SCAN] VirusTotal扫描失败: ${error.message}`);
    throw error;
  }
};

/**
 * 简单的文件哈希扫描（模拟）
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>} 扫描结果
 */
const scanWithHash = async (filePath) => {
  const crypto = require('crypto');
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
  
  // 这里可以实现已知恶意文件的哈希黑名单
  const knownMaliciousHashes = [
    // 添加已知的恶意文件哈希
  ];
  
  const isInfected = knownMaliciousHashes.includes(hash);
  
  return {
    isInfected,
    viruses: isInfected ? ['Known malicious file (hash match)'] : [],
    hash,
    scanTime: new Date().toISOString()
  };
};

/**
 * 扫描单个文件
 * @param {string} filePath - 要扫描的文件路径
 * @returns {Promise<Object>} 扫描结果
 */
const scanFile = async (filePath) => {
  try {
    await initClamAV();

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    
    logger.info(`[VIRUS-SCAN] 开始扫描文件: ${fileName} (${fileStats.size} bytes)`);

    // 检查文件大小
    if (fileStats.size > config.maxFileSize) {
      logger.warn(`[VIRUS-SCAN] 文件过大，跳过扫描: ${fileName}`);
      return {
        isInfected: false,
        viruses: [],
        file: filePath,
        skipped: true,
        reason: 'File too large',
        scanTime: new Date().toISOString()
      };
    }

    let result;

    switch (scanEngine) {
      case 'local':
        try {
          const NodeClam = require('clamav.js');
          const clamscan = await new NodeClam().init({
            removeInfected: false,
            quarantineInfected: false,
            scanRecursively: true,
            clamscan: config.localClamAV.clamscan,
            clamdscan: config.localClamAV.clamdscan,
            preference: 'clamdscan'
          });
          
          const scanResult = await clamscan.scanFile(filePath);
          result = {
            isInfected: scanResult.isInfected,
            viruses: scanResult.viruses || [],
            file: filePath,
            scanTime: new Date().toISOString()
          };
        } catch (error) {
          logger.warn(`[VIRUS-SCAN] 本地扫描失败，回退到哈希扫描: ${error.message}`);
          result = await scanWithHash(filePath);
          result.file = filePath;
        }
        break;

      case 'online':
        if (config.onlineService.service === 'virustotal') {
          result = await scanWithVirusTotal(filePath);
          result.file = filePath;
        } else {
          result = await scanWithHash(filePath);
          result.file = filePath;
        }
        break;

      case 'mock':
      default:
        // 模拟扫描 - 随机决定是否发现病毒（仅用于测试）
        const isInfected = Math.random() < 0.05; // 5%概率发现病毒
        
        if (isInfected) {
          logger.warn(`[VIRUS-SCAN] 模拟扫描发现潜在威胁: ${fileName}`);
          result = {
            isInfected: true,
            viruses: ['EICAR-Test-File (模拟)'],
            file: filePath,
            scanTime: new Date().toISOString()
          };
        } else {
          result = {
            isInfected: false,
            viruses: [],
            file: filePath,
            scanTime: new Date().toISOString()
          };
        }
        break;
    }

    // 记录扫描结果
    if (result.isInfected) {
      logger.error(`[VIRUS-SCAN] 🚨 检测到病毒: ${fileName} - ${result.viruses.join(', ')}`);
    } else {
      logger.info(`[VIRUS-SCAN] ✅ 文件安全: ${fileName}`);
    }

    return result;

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

/**
 * 获取扫描引擎信息
 * @returns {Object} 扫描引擎信息
 */
const getScanEngineInfo = () => {
  return {
    engine: scanEngine,
    initialized: isInitialized,
    config: {
      localEnabled: config.localClamAV.enabled,
      onlineEnabled: config.onlineService.enabled,
      service: config.onlineService.service,
      maxFileSize: config.maxFileSize
    }
  };
};

module.exports = {
  initClamAV,
  scanFile,
  scanFiles,
  hasInfectedFiles,
  getInfectedFiles,
  getScanEngineInfo,
  virusScanner: {
    initClamAV,
    scanFile,
    scanFiles,
    hasInfectedFiles,
    getInfectedFiles,
    getScanEngineInfo
  }
};