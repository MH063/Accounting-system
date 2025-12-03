const FileManager = require('../services/fileManager');
const path = require('path');
const multer = require('multer');

class FileController {
  constructor() {
    this.fileManager = new FileManager();
    this.setupMulter();
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
        return res.status(400).json({
          success: false,
          message: '没有找到上传的文件'
        });
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
        return res.status(200).json(result);
      }

      // 批量上传
      const results = await this.fileManager.batchUploadFiles(files, options);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return res.status(200).json({
        success: true,
        message: `上传完成: ${successCount}个成功, ${failureCount}个失败`,
        data: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          results: results
        }
      });

    } catch (error) {
      console.error('[FILE-CONTROLLER] 文件上传失败:', error);
      return res.status(500).json({
        success: false,
        message: '文件上传失败',
        error: error.message
      });
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(req, res) {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: '缺少文件ID参数'
        });
      }

      const result = await this.fileManager.getFileInfo(fileId);
      return res.status(200).json(result);

    } catch (error) {
      console.error('[FILE-CONTROLLER] 获取文件信息失败:', error);
      
      const status = error.message === '文件不存在' ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(req, res) {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: '缺少文件ID参数'
        });
      }

      const result = await this.fileManager.deleteFile(fileId);
      return res.status(200).json(result);

    } catch (error) {
      console.error('[FILE-CONTROLLER] 删除文件失败:', error);
      
      const status = error.message === '文件不存在' ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * 批量删除文件
   */
  async batchDeleteFiles(req, res) {
    try {
      const { fileIds } = req.body;
      
      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '缺少文件ID数组参数'
        });
      }

      const results = await this.fileManager.batchDeleteFiles(fileIds);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return res.status(200).json({
        success: true,
        message: `删除完成: ${successCount}个成功, ${failureCount}个失败`,
        data: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          results: results
        }
      });

    } catch (error) {
      console.error('[FILE-CONTROLLER] 批量删除文件失败:', error);
      return res.status(500).json({
        success: false,
        message: '批量删除文件失败',
        error: error.message
      });
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
      return res.status(200).json(result);

    } catch (error) {
      console.error('[FILE-CONTROLLER] 列出文件失败:', error);
      return res.status(500).json({
        success: false,
        message: '列出文件失败',
        error: error.message
      });
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(req, res) {
    try {
      const result = await this.fileManager.getStorageStats();
      return res.status(200).json(result);

    } catch (error) {
      console.error('[FILE-CONTROLLER] 获取存储统计失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取存储统计失败',
        error: error.message
      });
    }
  }

  /**
   * 清理临时文件
   */
  async cleanupTempFiles(req, res) {
    try {
      const result = await this.fileManager.cleanupTempFiles();
      return res.status(200).json(result);

    } catch (error) {
      console.error('[FILE-CONTROLLER] 清理临时文件失败:', error);
      return res.status(500).json({
        success: false,
        message: '清理临时文件失败',
        error: error.message
      });
    }
  }

  /**
   * 获取支持的文件类型
   */
  async getSupportedFileTypes(req, res) {
    try {
      const fileTypes = this.fileManager.getSupportedFileTypes();
      return res.status(200).json({
        success: true,
        data: fileTypes
      });

    } catch (error) {
      console.error('[FILE-CONTROLLER] 获取支持的文件类型失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取支持的文件类型失败',
        error: error.message
      });
    }
  }
}

module.exports = FileController;