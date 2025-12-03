const LocalStorageAdapter = require('../storageAdapters/localStorage');
const FileOptimizer = require('./fileOptimizer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class FileManager {
  constructor() {
    this.storage = new LocalStorageAdapter();
    this.optimizer = new FileOptimizer();
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedExtensions = [
      // 图片文件
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico',
      // 文档文件
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf',
      // 压缩文件
      '.zip', '.rar', '.7z', '.tar', '.gz',
      // 音频文件
      '.mp3', '.wav', '.flac', '.aac', '.ogg',
      // 视频文件
      '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm',
      // 其他
      '.json', '.xml', '.csv', '.sql'
    ];
  }

  /**
   * 验证文件
   * @param {Object} file - 文件对象
   * @returns {Object} 验证结果
   */
  validateFile(file) {
    const errors = [];

    // 检查文件大小
    if (file.size > this.maxFileSize) {
      errors.push(`文件大小超过限制 (${this.maxFileSize / 1024 / 1024}MB)`);
    }

    // 检查文件扩展名
    const ext = path.extname(file.originalname || file.name || '').toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      errors.push(`不支持的文件类型: ${ext}`);
    }

    // 检查文件名是否安全
    const filename = file.originalname || file.name || '';
    if (!this.isValidFilename(filename)) {
      errors.push('文件名包含非法字符');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 检查文件名是否安全
   * @param {string} filename - 文件名
   * @returns {boolean} 是否安全
   */
  isValidFilename(filename) {
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    return !invalidChars.test(filename) && filename.length > 0 && filename.length < 255;
  }

  /**
   * 上传文件
   * @param {Object} file - 文件对象
   * @param {Object} options - 上传选项
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(file, options = {}) {
    try {
      // 验证文件
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(`文件验证失败: ${validation.errors.join(', ')}`);
      }

      // 生成唯一文件名
      const ext = path.extname(file.originalname || file.name);
      const uniqueName = `${uuidv4()}${ext}`;
      const relativePath = options.path ? `${options.path}/${uniqueName}` : uniqueName;

      // 上传到存储
      const uploadResult = await this.storage.uploadFile(file, relativePath);

      let optimizationResult = null;

      // 如果是图片文件，进行优化
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      if (imageExtensions.includes(ext.toLowerCase())) {
        try {
          optimizationResult = await this.optimizer.smartCompress(
            file.path || file.tempFilePath,
            {
              quality: options.quality || 80,
              format: options.format || 'auto'
            }
          );
        } catch (error) {
          console.warn('[FILE-MANAGER] 图片优化失败，继续上传原文件:', error.message);
        }
      }

      // 生成文件信息
      const fileInfo = {
        id: uuidv4(),
        originalName: file.originalname || file.name,
        filename: uniqueName,
        path: relativePath,
        size: file.size,
        mimeType: file.mimetype || file.type,
        extension: ext.toLowerCase(),
        uploadedAt: new Date().toISOString(),
        uploadedBy: options.uploadedBy,
        tags: options.tags || [],
        metadata: options.metadata || {},
        optimized: !!optimizationResult,
        optimizationDetails: optimizationResult
      };

      console.log('[FILE-MANAGER] 文件上传成功:', fileInfo);
      return {
        success: true,
        data: {
          file: fileInfo,
          storage: uploadResult,
          optimization: optimizationResult
        }
      };

    } catch (error) {
      console.error('[FILE-MANAGER] 文件上传失败:', error);
      throw error;
    }
  }

  /**
   * 批量上传文件
   * @param {Array} files - 文件数组
   * @param {Object} options - 上传选项
   * @returns {Promise<Array>} 上传结果数组
   */
  async batchUploadFiles(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, options);
        results.push({
          file: file.originalname || file.name,
          success: true,
          result
        });
      } catch (error) {
        console.error(`[FILE-MANAGER] 批量上传失败 - ${file.originalname || file.name}:`, error);
        results.push({
          file: file.originalname || file.name,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 获取文件信息
   * @param {string} fileId - 文件ID
   * @returns {Promise<Object>} 文件信息
   */
  async getFileInfo(fileId) {
    try {
      const files = await this.storage.listFiles();
      const file = files.find(f => f.key.includes(fileId) || f.metadata?.id === fileId);
      
      if (!file) {
        throw new Error('文件不存在');
      }

      return {
        success: true,
        data: file
      };
    } catch (error) {
      console.error('[FILE-MANAGER] 获取文件信息失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param {string} fileId - 文件ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteFile(fileId) {
    try {
      const files = await this.storage.listFiles();
      const file = files.find(f => f.key.includes(fileId) || f.metadata?.id === fileId);
      
      if (!file) {
        throw new Error('文件不存在');
      }

      await this.storage.deleteFile(file.key);

      return {
        success: true,
        message: '文件删除成功',
        data: {
          fileId,
          deletedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[FILE-MANAGER] 删除文件失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除文件
   * @param {Array} fileIds - 文件ID数组
   * @returns {Promise<Array>} 删除结果数组
   */
  async batchDeleteFiles(fileIds) {
    const results = [];
    
    for (const fileId of fileIds) {
      try {
        const result = await this.deleteFile(fileId);
        results.push({
          fileId,
          success: true,
          result
        });
      } catch (error) {
        console.error(`[FILE-MANAGER] 批量删除失败 - ${fileId}:`, error);
        results.push({
          fileId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 列出文件
   * @param {Object} options - 列出选项
   * @returns {Promise<Object>} 文件列表
   */
  async listFiles(options = {}) {
    try {
      const {
        path: searchPath = '',
        limit = 100,
        offset = 0,
        search = '',
        fileType = '',
        sortBy = 'lastModified',
        sortOrder = 'desc'
      } = options;

      let files = await this.storage.listFiles(searchPath, { includeMetadata: true });

      // 搜索过滤
      if (search) {
        files = files.filter(f => 
          f.key.toLowerCase().includes(search.toLowerCase()) ||
          (f.metadata?.originalName?.toLowerCase().includes(search.toLowerCase()))
        );
      }

      // 文件类型过滤
      if (fileType) {
        files = files.filter(f => f.extension === fileType);
      }

      // 排序
      files.sort((a, b) => {
        let aVal, bVal;
        
        switch (sortBy) {
          case 'size':
            aVal = a.size || 0;
            bVal = b.size || 0;
            break;
          case 'name':
            aVal = a.key.toLowerCase();
            bVal = b.key.toLowerCase();
            break;
          case 'lastModified':
          default:
            aVal = new Date(a.lastModified || 0).getTime();
            bVal = new Date(b.lastModified || 0).getTime();
            break;
        }

        if (sortOrder === 'desc') {
          return bVal - aVal;
        }
        return aVal - bVal;
      });

      // 分页
      const total = files.length;
      const paginatedFiles = files.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          files: paginatedFiles,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          }
        }
      };
    } catch (error) {
      console.error('[FILE-MANAGER] 列出文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStorageStats() {
    try {
      const stats = await this.storage.getStorageStats();
      const optimizerStats = this.optimizer.getCacheStats();

      return {
        success: true,
        data: {
          storage: stats,
          optimizer: optimizerStats,
          summary: {
            totalFiles: stats.totalFiles,
            totalSizeFormatted: this.formatBytes(stats.totalSize),
            totalSizeBytes: stats.totalSize,
            fileTypes: Object.keys(stats.fileTypes).length,
            lastActivity: stats.lastModified?.timestamp
          }
        }
      };
    } catch (error) {
      console.error('[FILE-MANAGER] 获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 清理临时文件
   * @returns {Promise<Object>} 清理结果
   */
  async cleanupTempFiles() {
    try {
      const result = await this.storage.cleanupOrphanedFiles();
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('[FILE-MANAGER] 清理临时文件失败:', error);
      throw error;
    }
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取支持的文件类型
   * @returns {Object} 支持的文件类型
   */
  getSupportedFileTypes() {
    return {
      images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'],
      documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'],
      archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
      audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
      video: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
      other: ['.json', '.xml', '.csv', '.sql']
    };
  }
}

module.exports = FileManager;