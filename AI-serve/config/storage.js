/**
 * 云存储配置
 * 支持多种云存储服务提供商
 */

const logger = require('../config/logger');

// 云存储类型枚举
const STORAGE_TYPES = {
  LOCAL: 'local',      // 本地存储
  AWS_S3: 'aws_s3',    // AWS S3
  ALIYUN_OSS: 'aliyun_oss', // 阿里云OSS
  TENCENT_COS: 'tencent_cos', // 腾讯云COS
  QINIU_KODO: 'qiniu_kodo'   // 七牛云Kodo
};

// 默认配置
const DEFAULT_CONFIG = {
  // 当前使用的存储类型
  type: process.env.STORAGE_TYPE || STORAGE_TYPES.LOCAL,
  
  // 文件保留策略（天）
  retentionDays: process.env.FILE_RETENTION_DAYS || 30,
  
  // 是否启用自动清理
  autoCleanup: process.env.ENABLE_AUTO_CLEANUP === 'true',
  
  // 清理间隔（小时）
  cleanupInterval: process.env.CLEANUP_INTERVAL_HOURS || 24,
  
  // 是否启用CDN加速
  enableCdn: process.env.ENABLE_CDN === 'true',
  
  // CDN域名
  cdnDomain: process.env.CDN_DOMAIN || '',
  
  // 是否启用文件去重
  enableDeduplication: process.env.ENABLE_DEDUPLICATION === 'true',
  
  // 文件访问URL过期时间（秒）
  urlExpiration: process.env.FILE_URL_EXPIRATION || 3600
};

// AWS S3配置
const AWS_S3_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET || '',
  endpoint: process.env.AWS_S3_ENDPOINT || ''
};

// 阿里云OSS配置
const ALIYUN_OSS_CONFIG = {
  region: process.env.ALIYUN_OSS_REGION || '',
  accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.ALIYUN_OSS_BUCKET || '',
  endpoint: process.env.ALIYUN_OSS_ENDPOINT || ''
};

// 腾讯云COS配置
const TENCENT_COS_CONFIG = {
  secretId: process.env.TENCENT_COS_SECRET_ID || '',
  secretKey: process.env.TENCENT_COS_SECRET_KEY || '',
  region: process.env.TENCENT_COS_REGION || '',
  bucket: process.env.TENCENT_COS_BUCKET || '',
  domain: process.env.TENCENT_COS_DOMAIN || ''
};

// 七牛云Kodo配置
const QINIU_KODO_CONFIG = {
  accessKey: process.env.QINIU_ACCESS_KEY || '',
  secretKey: process.env.QINIU_SECRET_KEY || '',
  bucket: process.env.QINIU_BUCKET || '',
  domain: process.env.QINIU_DOMAIN || ''
};

/**
 * 获取当前存储配置
 * @returns {Object} 存储配置
 */
const getStorageConfig = () => {
  const config = { ...DEFAULT_CONFIG };
  
  switch (config.type) {
    case STORAGE_TYPES.AWS_S3:
      config.aws = { ...AWS_S3_CONFIG };
      break;
    case STORAGE_TYPES.ALIYUN_OSS:
      config.aliyun = { ...ALIYUN_OSS_CONFIG };
      break;
    case STORAGE_TYPES.TENCENT_COS:
      config.tencent = { ...TENCENT_COS_CONFIG };
      break;
    case STORAGE_TYPES.QINIU_KODO:
      config.qiniu = { ...QINIU_KODO_CONFIG };
      break;
    case STORAGE_TYPES.LOCAL:
    default:
      config.local = {
        basePath: process.env.LOCAL_STORAGE_PATH || './uploads',
        baseUrl: process.env.LOCAL_STORAGE_URL || '/uploads'
      };
      break;
  }
  
  return config;
};

/**
 * 验证存储配置是否有效
 * @param {Object} config - 存储配置
 * @returns {boolean} 是否有效
 */
const validateStorageConfig = (config) => {
  if (!config || !config.type) {
    logger.error('[STORAGE] 存储配置无效: 缺少存储类型');
    return false;
  }
  
  switch (config.type) {
    case STORAGE_TYPES.AWS_S3:
      if (!config.aws.accessKeyId || !config.aws.secretAccessKey || !config.aws.bucket) {
        logger.error('[STORAGE] AWS S3配置无效: 缺少必要的认证信息或存储桶名称');
        return false;
      }
      break;
    case STORAGE_TYPES.ALIYUN_OSS:
      if (!config.aliyun.accessKeyId || !config.aliyun.accessKeySecret || !config.aliyun.bucket) {
        logger.error('[STORAGE] 阿里云OSS配置无效: 缺少必要的认证信息或存储桶名称');
        return false;
      }
      break;
    case STORAGE_TYPES.TENCENT_COS:
      if (!config.tencent.secretId || !config.tencent.secretKey || !config.tencent.bucket) {
        logger.error('[STORAGE] 腾讯云COS配置无效: 缺少必要的认证信息或存储桶名称');
        return false;
      }
      break;
    case STORAGE_TYPES.QINIU_KODO:
      if (!config.qiniu.accessKey || !config.qiniu.secretKey || !config.qiniu.bucket) {
        logger.error('[STORAGE] 七牛云Kodo配置无效: 缺少必要的认证信息或存储桶名称');
        return false;
      }
      break;
    case STORAGE_TYPES.LOCAL:
    default:
      if (!config.local.basePath) {
        logger.error('[STORAGE] 本地存储配置无效: 缺少存储路径');
        return false;
      }
      break;
  }
  
  return true;
};

module.exports = {
  STORAGE_TYPES,
  getStorageConfig,
  validateStorageConfig,
  DEFAULT_CONFIG,
  AWS_S3_CONFIG,
  ALIYUN_OSS_CONFIG,
  TENCENT_COS_CONFIG,
  QINIU_KODO_CONFIG
};