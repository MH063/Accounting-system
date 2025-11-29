/**
 * 云存储适配器
 * 提供统一的文件存储接口，支持多种存储后端
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../config/logger');
const { getStorageConfig, validateStorageConfig, STORAGE_TYPES } = require('../config/storage');

/**
 * 存储适配器基类
 */
class BaseStorageAdapter {
  constructor(config) {
    this.config = config;
  }

  /**
   * 上传文件
   * @param {string} localPath - 本地文件路径
   * @param {string} remotePath - 远程文件路径
   * @param {Object} options - 上传选项
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(localPath, remotePath, options = {}) {
    throw new Error('uploadFile方法必须被子类实现');
  }

  /**
   * 下载文件
   * @param {string} remotePath - 远程文件路径
   * @param {string} localPath - 本地文件路径
   * @param {Object} options - 下载选项
   * @returns {Promise<Object>} 下载结果
   */
  async downloadFile(remotePath, localPath, options = {}) {
    throw new Error('downloadFile方法必须被子类实现');
  }

  /**
   * 删除文件
   * @param {string} remotePath - 远程文件路径
   * @param {Object} options - 删除选项
   * @returns {Promise<Object>} 删除结果
   */
  async deleteFile(remotePath, options = {}) {
    throw new Error('deleteFile方法必须被子类实现');
  }

  /**
   * 检查文件是否存在
   * @param {string} remotePath - 远程文件路径
   * @returns {Promise<boolean>} 是否存在
   */
  async fileExists(remotePath) {
    throw new Error('fileExists方法必须被子类实现');
  }

  /**
   * 获取文件信息
   * @param {string} remotePath - 远程文件路径
   * @returns {Promise<Object>} 文件信息
   */
  async getFileInfo(remotePath) {
    throw new Error('getFileInfo方法必须被子类实现');
  }

  /**
   * 获取文件访问URL
   * @param {string} remotePath - 远程文件路径
   * @param {number} expiration - URL过期时间（秒）
   * @returns {Promise<string>} 访问URL
   */
  async getFileUrl(remotePath, expiration = 3600) {
    throw new Error('getFileUrl方法必须被子类实现');
  }

  /**
   * 列出文件
   * @param {string} prefix - 文件路径前缀
   * @param {Object} options - 列出选项
   * @returns {Promise<Array>} 文件列表
   */
  async listFiles(prefix = '', options = {}) {
    throw new Error('listFiles方法必须被子类实现');
  }

  /**
   * 批量上传文件
   * @param {Array} files - 文件数组，每个元素包含 {localPath, remotePath, options}
   * @returns {Promise<Array>} 上传结果数组
   */
  async batchUploadFiles(files) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file.localPath, file.remotePath, file.options);
        results.push({
          file: file.remotePath,
          success: true,
          result
        });
      } catch (error) {
        logger.error(`[STORAGE] 批量上传失败: ${file.remotePath}`, { error: error.message });
        results.push({
          file: file.remotePath,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 批量删除文件
   * @param {Array} remotePaths - 远程文件路径数组
   * @returns {Promise<Array>} 删除结果数组
   */
  async batchDeleteFiles(remotePaths) {
    const results = [];
    
    for (const remotePath of remotePaths) {
      try {
        const result = await this.deleteFile(remotePath);
        results.push({
          file: remotePath,
          success: true,
          result
        });
      } catch (error) {
        logger.error(`[STORAGE] 批量删除失败: ${remotePath}`, { error: error.message });
        results.push({
          file: remotePath,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

/**
 * 本地存储适配器
 */
class LocalStorageAdapter extends BaseStorageAdapter {
  constructor(config) {
    super(config);
    this.basePath = config.local.basePath;
    this.baseUrl = config.local.baseUrl;
    
    // 确保基础目录存在
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async uploadFile(localPath, remotePath, options = {}) {
    try {
      const targetPath = path.join(this.basePath, remotePath);
      const targetDir = path.dirname(targetPath);
      
      // 确保目标目录存在
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // 复制文件
      fs.copyFileSync(localPath, targetPath);
      
      const stats = fs.statSync(targetPath);
      
      logger.info(`[STORAGE] 本地文件上传成功: ${remotePath}`, {
        size: stats.size,
        path: targetPath
      });
      
      return {
        success: true,
        path: targetPath,
        url: `${this.baseUrl}/${remotePath}`,
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      logger.error(`[STORAGE] 本地文件上传失败: ${remotePath}`, { error: error.message });
      throw error;
    }
  }

  async downloadFile(remotePath, localPath, options = {}) {
    try {
      const sourcePath = path.join(this.basePath, remotePath);
      
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`文件不存在: ${remotePath}`);
      }
      
      // 确保目标目录存在
      const targetDir = path.dirname(localPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // 复制文件
      fs.copyFileSync(sourcePath, localPath);
      
      const stats = fs.statSync(localPath);
      
      logger.info(`[STORAGE] 本地文件下载成功: ${remotePath}`, {
        size: stats.size,
        path: localPath
      });
      
      return {
        success: true,
        path: localPath,
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      logger.error(`[STORAGE] 本地文件下载失败: ${remotePath}`, { error: error.message });
      throw error;
    }
  }

  async deleteFile(remotePath, options = {}) {
    try {
      const targetPath = path.join(this.basePath, remotePath);
      
      if (!fs.existsSync(targetPath)) {
        throw new Error(`文件不存在: ${remotePath}`);
      }
      
      fs.unlinkSync(targetPath);
      
      logger.info(`[STORAGE] 本地文件删除成功: ${remotePath}`);
      
      return {
        success: true,
        path: remotePath
      };
    } catch (error) {
      logger.error(`[STORAGE] 本地文件删除失败: ${remotePath}`, { error: error.message });
      throw error;
    }
  }

  async fileExists(remotePath) {
    try {
      const targetPath = path.join(this.basePath, remotePath);
      return fs.existsSync(targetPath);
    } catch (error) {
      logger.error(`[STORAGE] 检查文件存在性失败: ${remotePath}`, { error: error.message });
      return false;
    }
  }

  async getFileInfo(remotePath) {
    try {
      const targetPath = path.join(this.basePath, remotePath);
      
      if (!fs.existsSync(targetPath)) {
        throw new Error(`文件不存在: ${remotePath}`);
      }
      
      const stats = fs.statSync(targetPath);
      const hash = this.calculateFileHash(targetPath);
      
      return {
        path: remotePath,
        size: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime,
        isDirectory: stats.isDirectory(),
        hash
      };
    } catch (error) {
      logger.error(`[STORAGE] 获取文件信息失败: ${remotePath}`, { error: error.message });
      throw error;
    }
  }

  async getFileUrl(remotePath, expiration = 3600) {
    // 本地存储不需要生成临时URL，直接返回固定URL
    return `${this.baseUrl}/${remotePath}`;
  }

  async listFiles(prefix = '', options = {}) {
    try {
      const dirPath = path.join(this.basePath, prefix);
      const files = [];
      
      if (!fs.existsSync(dirPath)) {
        return files;
      }
      
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const relativePath = path.join(prefix, item.name);
        const stats = fs.statSync(itemPath);
        
        files.push({
          path: relativePath,
          name: item.name,
          size: stats.size,
          lastModified: stats.mtime,
          isDirectory: item.isDirectory()
        });
      }
      
      return files;
    } catch (error) {
      logger.error(`[STORAGE] 列出文件失败: ${prefix}`, { error: error.message });
      throw error;
    }
  }

  /**
   * 计算文件哈希值
   * @param {string} filePath - 文件路径
   * @returns {string} 文件哈希值
   */
  calculateFileHash(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      return hashSum.digest('hex');
    } catch (error) {
      logger.error(`[STORAGE] 计算文件哈希失败: ${error.message}`);
      return null;
    }
  }
}

/**
 * AWS S3存储适配器
 */
class AwsS3StorageAdapter extends BaseStorageAdapter {
  constructor(config) {
    super(config);
    
    try {
      // 动态导入AWS SDK
      const AWS = require('aws-sdk');
      
      this.s3 = new AWS.S3({
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        region: config.aws.region,
        endpoint: config.aws.endpoint || undefined
      });
      
      this.bucket = config.aws.bucket;
    } catch (error) {
      logger.error('[STORAGE] AWS S3 SDK加载失败，请安装aws-sdk包', { error: error.message });
      throw new Error('AWS S3 SDK未安装，请运行: npm install aws-sdk');
    }
  }

  async uploadFile(localPath, remotePath, options = {}) {
    try {
      const fileContent = fs.readFileSync(localPath);
      
      const params = {
        Bucket: this.bucket,
        Key: remotePath,
        Body: fileContent,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata || {}
      };
      
      const result = await this.s3.upload(params).promise();
      
      logger.info(`[STORAGE] S3文件上传成功: ${remotePath}`, {
        bucket: this.bucket,
        location: result.Location,
        size: fileContent.length
      });
      
      return {
        success: true,
        path: remotePath,
        url: result.Location,
        size: fileContent.length,
        etag: result.ETag
      };
    } catch (error) {
      logger.error(`[STORAGE] S3文件上传失败: ${remotePath}`, { error: error.message });
      throw error;
    }
  }

  async downloadFile(remotePath, localPath, options = {}) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: remotePath
      };
      
      const result = await this.s3.getObject(params).promise();
      
      // 确保目标目录存在
      const targetDir = path.dirname(localPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      fs.writeFileSync(localPath, result.Body);
      
      logger.info(`[STORAGE] S3文件下载成功: ${remotePath}`, {
        bucket: this.bucket,
        path: localPath,
        size: result.Body.length
      });
      
      return {
        success: true,
        path: localPath,
        size: result.Body.length,
        lastModified: result.LastModified
      };
    } catch (error) {
      logger.error(`[STORAGE] S3文件下载失败: ${remotePath}`, { error: error.message });
      throw error;
    }
  }

  async deleteFile(remotePath, options = {}) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: remotePath
      };
      
      await this.s3.deleteObject(params).promise();
      
      logger.info(`[STORAGE] S3文件删除成功: ${remotePath}`, {
        bucket: this.bucket
      });
      
      return {
        success: true,
        path: remotePath
      };
    } catch (error) {
      logger.error(`[STORAGE] S3文件删除失败: ${remotePath}`, { error: error.message });
      throw error;
    }
  }

  async fileExists(remotePath) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: remotePath
      };
      
      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      logger.error(`[STORAGE] 检查S3文件存在性失败: ${remotePath}`, { error: error.message });
      return false;
    }
  }

  async getFileInfo(remotePath) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: remotePath
      };
      
      const result = await this.s3.headObject(params).promise();
      
      return {
        path: remotePath,
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        etag: result.ETag,
        metadata: result.Metadata
      };
    } catch (error) {
      logger.error(`[STORAGE] 获取S3文件信息失败: ${remotePath}`, { error: error.message });
      throw error;
    }
  }

  async getFileUrl(remotePath, expiration = 3600) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: remotePath,
        Expires: expiration
      };
      
      return this.s3.getSignedUrl('getObject', params);
    } catch (error) {
      logger.error(`[STORAGE] 获取S3文件URL失败: ${remotePath}`, { error: error.message });
      throw error;
    }
  }

  async listFiles(prefix = '', options = {}) {
    try {
      const params = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: options.maxKeys || 1000
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      
      const files = result.Contents.map(item => ({
        path: item.Key,
        name: path.basename(item.Key),
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag
      }));
      
      return files;
    } catch (error) {
      logger.error(`[STORAGE] 列出S3文件失败: ${prefix}`, { error: error.message });
      throw error;
    }
  }
}

/**
 * 存储适配器工厂
 */
class StorageAdapterFactory {
  /**
   * 创建存储适配器实例
   * @param {Object} config - 存储配置
   * @returns {BaseStorageAdapter} 存储适配器实例
   */
  static createAdapter(config) {
    if (!validateStorageConfig(config)) {
      throw new Error('存储配置无效');
    }
    
    switch (config.type) {
      case STORAGE_TYPES.LOCAL:
        return new LocalStorageAdapter(config);
      case STORAGE_TYPES.AWS_S3:
        return new AwsS3StorageAdapter(config);
      case STORAGE_TYPES.ALIYUN_OSS:
        // 阿里云OSS适配器实现类似AWS S3
        logger.warn('[STORAGE] 阿里云OSS适配器尚未实现，使用本地存储替代');
        return new LocalStorageAdapter(config);
      case STORAGE_TYPES.TENCENT_COS:
        // 腾讯云COS适配器实现类似AWS S3
        logger.warn('[STORAGE] 腾讯云COS适配器尚未实现，使用本地存储替代');
        return new LocalStorageAdapter(config);
      case STORAGE_TYPES.QINIU_KODO:
        // 七牛云Kodo适配器实现
        logger.warn('[STORAGE] 七牛云Kodo适配器尚未实现，使用本地存储替代');
        return new LocalStorageAdapter(config);
      default:
        logger.warn(`[STORAGE] 未知的存储类型: ${config.type}，使用本地存储替代`);
        return new LocalStorageAdapter(config);
    }
  }
}

/**
 * 存储管理器
 */
class StorageManager {
  constructor() {
    this.config = getStorageConfig();
    this.adapter = StorageAdapterFactory.createAdapter(this.config);
  }

  /**
   * 上传文件
   * @param {string} localPath - 本地文件路径
   * @param {string} remotePath - 远程文件路径（可选，默认使用本地文件名）
   * @param {Object} options - 上传选项
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(localPath, remotePath, options = {}) {
    if (!remotePath) {
      remotePath = path.basename(localPath);
    }
    
    return this.adapter.uploadFile(localPath, remotePath, options);
  }

  /**
   * 下载文件
   * @param {string} remotePath - 远程文件路径
   * @param {string} localPath - 本地文件路径（可选，默认使用远程文件名）
   * @param {Object} options - 下载选项
   * @returns {Promise<Object>} 下载结果
   */
  async downloadFile(remotePath, localPath, options = {}) {
    if (!localPath) {
      localPath = path.basename(remotePath);
    }
    
    return this.adapter.downloadFile(remotePath, localPath, options);
  }

  /**
   * 删除文件
   * @param {string} remotePath - 远程文件路径
   * @param {Object} options - 删除选项
   * @returns {Promise<Object>} 删除结果
   */
  async deleteFile(remotePath, options = {}) {
    return this.adapter.deleteFile(remotePath, options);
  }

  /**
   * 检查文件是否存在
   * @param {string} remotePath - 远程文件路径
   * @returns {Promise<boolean>} 是否存在
   */
  async fileExists(remotePath) {
    return this.adapter.fileExists(remotePath);
  }

  /**
   * 获取文件信息
   * @param {string} remotePath - 远程文件路径
   * @returns {Promise<Object>} 文件信息
   */
  async getFileInfo(remotePath) {
    return this.adapter.getFileInfo(remotePath);
  }

  /**
   * 获取文件访问URL
   * @param {string} remotePath - 远程文件路径
   * @param {number} expiration - URL过期时间（秒）
   * @returns {Promise<string>} 访问URL
   */
  async getFileUrl(remotePath, expiration = 3600) {
    return this.adapter.getFileUrl(remotePath, expiration);
  }

  /**
   * 列出文件
   * @param {string} prefix - 文件路径前缀
   * @param {Object} options - 列出选项
   * @returns {Promise<Array>} 文件列表
   */
  async listFiles(prefix = '', options = {}) {
    return this.adapter.listFiles(prefix, options);
  }

  /**
   * 批量上传文件
   * @param {Array} files - 文件数组，每个元素包含 {localPath, remotePath, options}
   * @returns {Promise<Array>} 上传结果数组
   */
  async batchUploadFiles(files) {
    return this.adapter.batchUploadFiles(files);
  }

  /**
   * 批量删除文件
   * @param {Array} remotePaths - 远程文件路径数组
   * @returns {Promise<Array>} 删除结果数组
   */
  async batchDeleteFiles(remotePaths) {
    return this.adapter.batchDeleteFiles(remotePaths);
  }

  /**
   * 获取当前存储类型
   * @returns {string} 存储类型
   */
  getStorageType() {
    return this.config.type;
  }
}

// 创建全局存储管理器实例
const storageManager = new StorageManager();

module.exports = {
  BaseStorageAdapter,
  LocalStorageAdapter,
  AwsS3StorageAdapter,
  StorageAdapterFactory,
  StorageManager,
  storageManager
};