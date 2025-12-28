const FileManager = require('../services/fileManager');
const path = require('path');
const multer = require('multer');
const BaseController = require('./BaseController');
const { successResponse, errorResponse } = require('../middleware/response');

class FileController extends BaseController {
  constructor() {
    super();
    this.fileManager = new FileManager();
    this.setupMulter();
    
    // 确保方法正确绑定到类实例
    this.uploadFiles = this.uploadFiles.bind(this);
    this.getFileInfo = this.getFileInfo.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.listFiles = this.listFiles.bind(this);
    this.getStorageStats = this.getStorageStats.bind(this);
  }

  /**
   * 配置Multer中间件
   */
  setupMulter() {
    // 内存存储配置
    const storage = multer.memoryStorage();
    
    // 文件过滤器
    const fileFilter = (req, file, cb) => {
      const allowedTypes = [
        // 图片
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
        'image/svg+xml', 'image/bmp', 'image/x-icon',
        // 文档
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/rtf',
        // 压缩文件
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
        'application/x-tar', 'application/gzip',
        // 音频
        'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg',
        // 视频
        'video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm',
        // 其他
        'application/json', 'application/xml', 'text/csv', 'application/sql'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
      }
    };

    this.upload = multer({
      storage: storage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10 // 最多10个文件
      },
      fileFilter: fileFilter
    });
  }

  /**
   * 获取Multer配置（供路由使用）
   */
  getUploadMiddleware() {
    return (req, res, next) => {
      this.upload.array('files', 10)(req, res, next);
    };
  }

  /**
   * 文件上传
   */
  async uploadFiles(req, res) {
    try {
      console.log('[FILE-CONTROLLER] 开始处理文件上传');
      
      const files = req.files;
      if (!files || files.length === 0) {
        return errorResponse(res, '没有找到上传的文件', 400);
      }

      const options = {
        quality: parseInt(req.body.quality) || 80,
        format: req.body.format || 'auto',
        uploadedBy: req.user?.id || req.body.uploadedBy,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {}
      };

      // 单文件上传
      if (files.length === 1) {
        const result = await this.fileManager.uploadFile(files[0], options);
        if (!result.success) {
          return errorResponse(res, result.message || '文件上传失败', 400);
        }
        return successResponse(res, { file: result.data }, result.message || '文件上传成功');
      }

      // 批量上传
      const results = await this.fileManager.batchUploadFiles(files, options);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return successResponse(res, {
        results,
        stats: {
          total: results.length,
          success: successCount,
          failure: failureCount
        }
      }, `文件上传完成: 成功 ${successCount} 个, 失败 ${failureCount} 个`);
    } catch (error) {
      console.error('[FILE-CONTROLLER] 文件上传失败:', error);
      return errorResponse(res, '文件上传失败', 500, error.message);
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(req, res) {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return errorResponse(res, '缺少文件ID参数', 400);
      }

      const result = await this.fileManager.getFileInfo(fileId);
      return successResponse(res, result.data, result.message || '获取文件信息成功');

    } catch (error) {
      console.error('[FILE-CONTROLLER] 获取文件信息失败:', error);
      
      const status = error.message === '文件不存在' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(req, res) {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return errorResponse(res, '缺少文件ID参数', 400);
      }

      const result = await this.fileManager.deleteFile(fileId);
      return successResponse(res, result.data, result.message || '文件删除成功');

    } catch (error) {
      console.error('[FILE-CONTROLLER] 删除文件失败:', error);
      
      const status = error.message === '文件不存在' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  /**
   * 批量删除文件
   */
  async batchDeleteFiles(req, res) {
    try {
      const { fileIds } = req.body;
      
      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return errorResponse(res, '缺少文件ID数组参数', 400);
      }

      const results = await this.fileManager.batchDeleteFiles(fileIds);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return successResponse(res, {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results: results
      }, `删除完成: ${successCount}个成功, ${failureCount}个失败`);

    } catch (error) {
      console.error('[FILE-CONTROLLER] 批量删除文件失败:', error);
      return errorResponse(res, '批量删除文件失败', 500, error.message);
    }
  }

  /**
   * 列出文件
   */
  async listFiles(req, res) {
    try {
      const options = {
        path: req.query.path || '',
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0,
        search: req.query.search || '',
        fileType: req.query.fileType || '',
        sortBy: req.query.sortBy || 'lastModified',
        sortOrder: req.query.sortOrder || 'desc'
      };

      // 验证排序参数
      const allowedSortBy = ['name', 'size', 'lastModified'];
      const allowedSortOrder = ['asc', 'desc'];
      
      if (!allowedSortBy.includes(options.sortBy)) {
        options.sortBy = 'lastModified';
      }
      
      if (!allowedSortOrder.includes(options.sortOrder)) {
        options.sortOrder = 'desc';
      }

      const result = await this.fileManager.listFiles(options);
      return successResponse(res, result.data, result.message || '获取文件列表成功');

    } catch (error) {
      console.error('[FILE-CONTROLLER] 列出文件失败:', error);
      return errorResponse(res, '列出文件失败', 500, error.message);
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(req, res) {
    try {
      const result = await this.fileManager.getStorageStats();
      return successResponse(res, result.data, result.message || '获取存储统计成功');

    } catch (error) {
      console.error('[FILE-CONTROLLER] 获取存储统计失败:', error);
      return errorResponse(res, '获取存储统计失败', 500, error.message);
    }
  }

  /**
   * 清理临时文件
   */
  async cleanupTempFiles(req, res) {
    try {
      const result = await this.fileManager.cleanupTempFiles();
      return successResponse(res, result.data, result.message || '清理临时文件成功');

    } catch (error) {
      console.error('[FILE-CONTROLLER] 清理临时文件失败:', error);
      return errorResponse(res, '清理临时文件失败', 500, error.message);
    }
  }

  /**
   * 获取支持的文件类型
   */
  async getSupportedFileTypes(req, res) {
    try {
      const fileTypes = this.fileManager.getSupportedFileTypes();
      return successResponse(res, fileTypes);

    } catch (error) {
      console.error('[FILE-CONTROLLER] 获取支持的文件类型失败:', error);
      return errorResponse(res, '获取支持的文件类型失败', 500, error.message);
    }
  }
}

module.exports = FileController;