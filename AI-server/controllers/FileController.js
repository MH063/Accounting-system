const FileManager = require('../services/fileManager');
const path = require('path');
const multer = require('multer');
const logger = require('../config/logger');
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
      logger.info('[FILE-CONTROLLER] 开始处理文件上传', {
        fileCount: req.files?.length,
        userId: req.user?.id
      });
      
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
      logger.error('[FILE-CONTROLLER] 文件上传失败', { error: error.message });
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
      logger.error('[FILE-CONTROLLER] 获取文件信息失败', { error: error.message });
      
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
      logger.error('[FILE-CONTROLLER] 删除文件失败', { error: error.message });
      
      const status = error.message === '文件不存在' ? 404 : 500;
      return errorResponse(res, error.message, status);
    }
  }

  async bulkDeleteFiles(req, res) {
    try {
      const { fileIds } = req.body;
      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return errorResponse(res, '请提供要删除的文件ID列表', 400);
      }

      const results = await Promise.all(fileIds.map(async (id) => {
        try {
          const result = await this.fileManager.deleteFile(id);
          return { id, success: result.success, message: result.message };
        } catch (err) {
          return { id, success: false, message: err.message };
        }
      }));

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return successResponse(res, results, `批量删除完成: 成功 ${successCount} 个, 失败 ${failureCount} 个`);
    } catch (error) {
      logger.error('[FILE-CONTROLLER] 批量删除文件失败', { error: error.message });
      return errorResponse(res, '批量删除文件失败', 500);
    }
  }

  /**
   * 列出文件
   */
  async listFiles(req, res) {
    try {
      const filters = {
        userId: req.query.userId || req.user?.id,
        type: req.query.type,
        tags: req.query.tags ? req.query.tags.split(',') : [],
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await this.fileManager.listFiles(filters);
      return successResponse(res, result.data, '获取文件列表成功');
    } catch (error) {
      logger.error('[FILE-CONTROLLER] 列出文件失败', { error: error.message });
      return errorResponse(res, '获取文件列表失败', 500);
    }
  }

  /**
   * 获取存储统计
   */
  async getStorageStats(req, res) {
    try {
      const userId = req.query.userId || req.user?.id;
      const result = await this.fileManager.getStorageStats(userId);
      return successResponse(res, result.data, '获取存储统计成功');
    } catch (error) {
      logger.error('[FILE-CONTROLLER] 获取存储统计失败', { error: error.message });
      return errorResponse(res, '获取存储统计失败', 500);
    }
  }

  /**
   * 清理临时文件
   */
  async cleanupTempFiles(req, res) {
    try {
      const maxAge = parseInt(req.query.maxAge) || (24 * 60 * 60 * 1000); // 默认24小时
      const result = await this.fileManager.cleanupTempFiles(maxAge);
      return successResponse(res, result.data, '临时文件清理成功');
    } catch (error) {
      logger.error('[FILE-CONTROLLER] 清理临时文件失败', { error: error.message });
      return errorResponse(res, '清理临时文件失败', 500);
    }
  }

  /**
   * 获取支持的文件类型
   */
  async getSupportedTypes(req, res) {
    try {
      const result = await this.fileManager.getSupportedTypes();
      return successResponse(res, result.data, '获取支持的文件类型成功');
    } catch (error) {
      logger.error('[FILE-CONTROLLER] 获取支持的文件类型失败', { error: error.message });
      return errorResponse(res, '获取支持的文件类型失败', 500);
    }
  }
}

module.exports = FileController;