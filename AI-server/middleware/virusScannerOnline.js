/**
 * 在线病毒扫描模块
 * 使用在线病毒扫描API进行文件病毒扫描
 * 提供完整的病毒扫描集成
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const crypto = require('crypto');
const logger = require('../config/logger');

// 病毒扫描服务配置
const VIRUS_SCAN_CONFIG = {
  // VirusTotal API配置
  virustotal: {
    apiKey: process.env.VIRUSTOTAL_API_KEY,
    baseUrl: 'https://www.virustotal.com/api/v3',
    timeout: 30000, // 30秒超时
    maxFileSize: 32 * 1024 * 1024, // 32MB文件大小限制
    rateLimit: {
      requests: 4, // 每分钟最多4个请求
      windowMs: 60000 // 1分钟时间窗口
    }
  },
  // 其他扫描服务可以在这里添加
  // metadefender: { ... },
  // hybridanalysis: { ... }
};

// 请求队列管理
class ScanQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.rateLimitResetTime = 0;
  }

  async add(filePath, service = 'virustotal') {
    return new Promise((resolve, reject) => {
      this.queue.push({
        filePath,
        service,
        resolve,
        reject,
        timestamp: Date.now()
      });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // 检查速率限制
      if (Date.now() < this.rateLimitResetTime) {
        const waitTime = this.rateLimitResetTime - Date.now();
        logger.info(`[VIRUS-SCAN] 达到速率限制，等待 ${waitTime}ms`);
        await this.sleep(waitTime);
      }

      const task = this.queue.shift();
      try {
        const result = await this.performScan(task.filePath, task.service);
        task.resolve(result);
      } catch (error) {
        // 如果是速率限制错误，重新加入队列
        if (error.status === 429) {
          this.rateLimitResetTime = Date.now() + 60000; // 1分钟后重试
          this.queue.unshift(task);
          logger.warn(`[VIRUS-SCAN] 速率限制，1分钟后重试`);
          break;
        } else {
          task.reject(error);
        }
      }

      // 添加小延迟避免过于频繁的请求
      await this.sleep(1000);
    }

    this.processing = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async performScan(filePath, service) {
    switch (service) {
      case 'virustotal':
        return await scanWithVirusTotal(filePath);
      default:
        throw new Error(`不支持的扫描服务: ${service}`);
    }
  }
}

// 创建全局扫描队列
const scanQueue = new ScanQueue();

/**
 * 使用VirusTotal API扫描文件
 * @param {string} filePath - 要扫描的文件路径
 * @returns {Promise<Object>} 扫描结果
 */
const scanWithVirusTotal = async (filePath) => {
  try {
    const config = VIRUS_SCAN_CONFIG.virustotal;
    
    // 检查API密钥
    if (!config.apiKey) {
      throw new Error('VirusTotal API密钥未配置');
    }

    // 检查文件大小
    const stats = fs.statSync(filePath);
    if (stats.size > config.maxFileSize) {
      throw new Error(`文件大小超过限制: ${stats.size} > ${config.maxFileSize}`);
    }

    // 首先检查文件是否已经扫描过（通过文件哈希）
    const fileHash = await calculateFileHash(filePath);
    logger.info(`[VIRUS-SCAN] 检查文件哈希: ${fileHash}`);

    try {
      const existingReport = await getVirusTotalReport(fileHash);
      if (existingReport) {
        logger.info(`[VIRUS-SCAN] 使用缓存的扫描结果: ${path.basename(filePath)}`);
        return existingReport;
      }
    } catch (error) {
      logger.warn(`[VIRUS-SCAN] 检查现有报告失败，将重新扫描: ${error.message}`);
    }

    // 上传文件进行扫描
    logger.info(`[VIRUS-SCAN] 上传文件到VirusTotal: ${path.basename(filePath)}`);
    const uploadResult = await uploadToVirusTotal(filePath);
    
    // 等待扫描完成并获取结果
    const scanResult = await waitForScanCompletion(uploadResult.data.id);
    
    logger.info(`[VIRUS-SCAN] VirusTotal扫描完成: ${path.basename(filePath)} - ${scanResult.isInfected ? '检测到威胁' : '文件安全'}`);
    
    return scanResult;
  } catch (error) {
    logger.error(`[VIRUS-SCAN] VirusTotal扫描失败: ${error.message}`);
    throw error;
  }
};

/**
 * 获取VirusTotal报告
 * @param {string} fileHash - 文件哈希
 * @returns {Promise<Object|null>} 扫描结果或null
 */
const getVirusTotalReport = async (fileHash) => {
  const config = VIRUS_SCAN_CONFIG.virustotal;
  
  try {
    const response = await axios.get(
      `${config.baseUrl}/files/${fileHash}`,
      {
        headers: {
          'x-apikey': config.apiKey,
          'Accept': 'application/json'
        },
        timeout: config.timeout
      }
    );

    if (response.data && response.data.data) {
      const attributes = response.data.data.attributes;
      const stats = attributes.last_analysis_stats;
      
      return {
        isInfected: stats.malicious > 0 || stats.suspicious > 0,
        viruses: extractThreatNames(attributes.last_analysis_results),
        scanCount: stats.harmless + stats.malicious + stats.suspicious + stats.undetected,
        maliciousCount: stats.malicious,
        suspiciousCount: stats.suspicious,
        scanTime: new Date(attributes.last_analysis_date * 1000).toISOString(),
        service: 'virustotal',
        cached: true
      };
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // 文件未找到，需要重新扫描
      return null;
    }
    throw error;
  }
  
  return null;
};

/**
 * 上传文件到VirusTotal
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>} 上传结果
 */
const uploadToVirusTotal = async (filePath) => {
  const config = VIRUS_SCAN_CONFIG.virustotal;
  
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  
  const response = await axios.post(
    `${config.baseUrl}/files`,
    form,
    {
      headers: {
        'x-apikey': config.apiKey,
        ...form.getHeaders()
      },
      timeout: config.timeout,
      maxContentLength: config.maxFileSize
    }
  );
  
  return response;
};

/**
 * 等待扫描完成
 * @param {string} analysisId - 分析ID
 * @returns {Promise<Object>} 扫描结果
 */
const waitForScanCompletion = async (analysisId) => {
  const config = VIRUS_SCAN_CONFIG.virustotal;
  const maxAttempts = 30; // 最多30次尝试
  const retryDelay = 5000; // 5秒重试间隔
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(
        `${config.baseUrl}/analyses/${analysisId}`,
        {
          headers: {
            'x-apikey': config.apiKey,
            'Accept': 'application/json'
          },
          timeout: config.timeout
        }
      );
      
      const analysis = response.data.data;
      const attributes = analysis.attributes;
      
      if (attributes.status === 'completed') {
        const stats = attributes.stats;
        
        return {
          isInfected: stats.malicious > 0 || stats.suspicious > 0,
          viruses: extractThreatNames(attributes.results),
          scanCount: stats.harmless + stats.malicious + stats.suspicious + stats.undetected,
          maliciousCount: stats.malicious,
          suspiciousCount: stats.suspicious,
          scanTime: new Date().toISOString(),
          service: 'virustotal',
          cached: false,
          attempts: attempt
        };
      } else if (attributes.status === 'queued' || attributes.status === 'in-progress') {
        logger.info(`[VIRUS-SCAN] 扫描进行中，第 ${attempt}/${maxAttempts} 次尝试`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        throw new Error(`扫描状态异常: ${attributes.status}`);
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`扫描超时，等待时间超过 ${maxAttempts * retryDelay / 1000} 秒`);
      }
      logger.warn(`[VIRUS-SCAN] 第 ${attempt} 次尝试失败: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw new Error('扫描超时');
};

/**
 * 提取威胁名称
 * @param {Object} results - 扫描结果
 * @returns {Array<string>} 威胁名称列表
 */
const extractThreatNames = (results) => {
  const threats = [];
  
  if (!results) return threats;
  
  Object.values(results).forEach(result => {
    if (result.category === 'malicious' || result.category === 'suspicious') {
      if (result.result) {
        threats.push(`${result.engine_name}: ${result.result}`);
      }
    }
  });
  
  return threats;
};

/**
 * 计算文件哈希
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 文件哈希
 */
const calculateFileHash = async (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

/**
 * 在线病毒扫描主函数
 * @param {string} filePath - 要扫描的文件路径
 * @param {Object} options - 扫描选项
 * @returns {Promise<Object>} 扫描结果
 */
const scanFileOnline = async (filePath, options = {}) => {
  try {
    logger.info(`[VIRUS-SCAN] 开始在线病毒扫描: ${path.basename(filePath)}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }
    
    // 使用队列进行扫描
    const result = await scanQueue.add(filePath, options.service || 'virustotal');
    
    return result;
  } catch (error) {
    logger.error(`[VIRUS-SCAN] 在线扫描失败: ${error.message}`);
    throw error;
  }
};

/**
 * 扫描多个文件
 * @param {Array<string>} filePaths - 要扫描的文件路径数组
 * @param {Object} options - 扫描选项
 * @returns {Promise<Array<Object>>} 扫描结果数组
 */
const scanFilesOnline = async (filePaths, options = {}) => {
  try {
    const results = [];
    
    // 并行扫描，但受速率限制
    for (const filePath of filePaths) {
      try {
        const result = await scanFileOnline(filePath, options);
        results.push(result);
      } catch (error) {
        logger.error(`[VIRUS-SCAN] 扫描文件失败: ${path.basename(filePath)} - ${error.message}`);
        results.push({
          file: filePath,
          isInfected: true,
          viruses: [`扫描失败: ${error.message}`],
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    logger.error(`[VIRUS-SCAN] 批量扫描失败: ${error.message}`);
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
    .map(result => result.file || result.filePath);
};

/**
 * 获取扫描服务状态
 * @returns {Object} 服务状态
 */
const getServiceStatus = () => {
  const config = VIRUS_SCAN_CONFIG.virustotal;
  
  return {
    service: 'virustotal',
    configured: !!config.apiKey,
    maxFileSize: config.maxFileSize,
    rateLimit: config.rateLimit,
    queueSize: scanQueue.queue.length,
    processing: scanQueue.processing
  };
};

module.exports = {
  scanFileOnline,
  scanFilesOnline,
  hasInfectedFiles,
  getInfectedFiles,
  getServiceStatus,
  VIRUS_SCAN_CONFIG
};