/**
 * Multer文件上传配置
 * 处理文件上传功能
 */

const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const logger = require('../config/logger');
const { scanFile, hasInfectedFiles } = require('./virusScanner');
const { compressImage, isImageFile, optimizeStoragePath } = require('../utils/fileOptimizer');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 允许的文件扩展名白名单
const allowedExtensions = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', // 图片
  '.pdf', '.doc', '.docx', '.txt', // 文档
  '.mp4', '.mpeg' // 视频
];

// 允许的文件类型
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'video/mp4',
  'video/mpeg'
];

// 文件内容签名（魔数）验证
const fileSignatures = {
  'image/jpeg': ['FF D8 FF'],
  'image/png': ['89 50 4E 47 0D 0A 1A 0A'],
  'image/gif': ['47 49 46 38 37 61', '47 49 46 38 39 61'],
  'image/webp': ['52 49 46 46'],
  'application/pdf': ['25 50 44 46'],
  'application/msword': ['D0 CF 11 E0'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['50 4B 03 04'],
  'text/plain': [], // 纯文本没有特定的魔数
  'video/mp4': ['66 74 79 70 69 73 6F 6D', '66 74 79 70 6D 70 34 32'],
  'video/mpeg': ['00 00 01 B3']
};

/**
 * 压缩上传的图片文件
 * @param {Object} file - 上传的文件对象
 * @param {Object} options - 压缩选项
 * @returns {Promise<Object>} 压缩结果
 */
const compressUploadedFile = async (file, options = {}) => {
  try {
    // 检查是否为图片文件
    const isImage = await isImageFile(file.path);
    if (!isImage) {
      return {
        success: false,
        reason: '不是图片文件，跳过压缩',
        originalFile: file
      };
    }
    
    // 创建压缩后的文件路径
    const dir = path.dirname(file.path);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const compressedFilename = `${name}-compressed-${Date.now()}${ext}`;
    const compressedPath = path.join(dir, compressedFilename);
    
    // 执行压缩
    const compressionResult = await compressImage(file.path, compressedPath, options);
    
    if (compressionResult.success) {
      // 获取压缩后文件信息
      const compressedStats = fs.statSync(compressedPath);
      
      // 创建压缩后的文件对象
      const compressedFile = {
        ...file,
        path: compressedPath,
        filename: compressedFilename,
        size: compressedStats.size,
        compressed: true,
        compressionRatio: compressionResult.compressionRatio,
        originalSize: compressionResult.inputSize,
        compressedSize: compressionResult.outputSize
      };
      
      logger.info(`[UPLOAD] 图片压缩成功: ${file.originalname}, 压缩率: ${compressionResult.compressionRatio}%`);
      
      return {
        success: true,
        originalFile: file,
        compressedFile,
        compressionResult
      };
    } else {
      // 压缩失败，返回原始文件
      logger.warn(`[UPLOAD] 图片压缩失败: ${file.originalname}, 原因: ${compressionResult.error}`);
      return {
        success: false,
        reason: compressionResult.error,
        originalFile: file
      };
    }
  } catch (error) {
    logger.error(`[UPLOAD] 文件压缩过程出错: ${error.message}`);
    return {
      success: false,
      reason: error.message,
      originalFile: file
    };
  }
};

/**
 * 验证文件内容签名
 * @param {string} filePath - 文件路径
 * @param {string} mimeType - 声明的MIME类型
 * @returns {boolean} 是否匹配
 */
const verifyFileSignature = (filePath, mimeType) => {
  try {
    // 对于纯文本文件，跳过签名验证
    if (mimeType === 'text/plain') {
      return true;
    }

    const signatures = fileSignatures[mimeType];
    if (!signatures || signatures.length === 0) {
      logger.warn(`[UPLOAD] 没有找到MIME类型 ${mimeType} 的签名验证规则`);
      return false;
    }

    const buffer = fs.readFileSync(filePath);
    const hex = buffer.slice(0, 16).toString('hex').match(/.{1,2}/g).join(' ').toUpperCase();

    // 检查是否匹配任一签名
    return signatures.some(signature => hex.startsWith(signature));
  } catch (error) {
    logger.error(`[UPLOAD] 文件签名验证失败: ${error.message}`);
    return false;
  }
};

/**
 * 计算文件哈希值
 * @param {string} filePath - 文件路径
 * @returns {string} 文件哈希值
 */
const calculateFileHash = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    logger.error(`[UPLOAD] 计算文件哈希失败: ${error.message}`);
    return null;
  }
};

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据文件类型创建不同的子目录
    let subDir = 'others';
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'videos';
    } else if (file.mimetype.includes('document') || 
               file.mimetype.includes('pdf') || 
               file.mimetype.includes('text')) {
      subDir = 'documents';
    }

    const targetDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件扩展名
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error(`不支持的文件扩展名: ${ext}`), false);
  }

  // 检查MIME类型
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }

  cb(null, true);
};

// 基础上传配置
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB，按照任务要求调整文件大小限制
    files: 5 // 最多5个文件
  }
});

// 增强的单文件上传中间件，包含内容验证、病毒扫描和文件压缩
const uploadSingle = (fieldName, compressOptions = {}) => (req, res, next) => {
  const singleUpload = upload.single(fieldName);
  
  singleUpload(req, res, async (err) => {
    if (err) {
      logger.error(`[UPLOAD] 单文件上传错误: ${err.message}`);
      return next(err);
    }
    
    // 如果有文件上传，进行内容验证和病毒扫描
    if (req.file) {
      try {
        // 文件签名验证
        const isValidSignature = verifyFileSignature(req.file.path, req.file.mimetype);
        if (!isValidSignature) {
          // 删除已上传的文件
          fs.unlinkSync(req.file.path);
          const error = new Error('文件内容与声明的类型不匹配');
          logger.error(`[UPLOAD] 文件内容验证失败: ${req.file.originalname}`);
          return next(error);
        }
        
        // 病毒扫描
        logger.info(`[UPLOAD] 开始病毒扫描: ${req.file.originalname}`);
        const scanResult = await scanFile(req.file.path);
        
        if (scanResult.isInfected) {
          // 删除感染病毒的文件
          fs.unlinkSync(req.file.path);
          const error = new Error(`文件包含病毒: ${scanResult.viruses.join(', ')}`);
          logger.error(`[UPLOAD] 病毒扫描失败: ${req.file.originalname} - ${scanResult.viruses.join(', ')}`);
          return next(error);
        }
        
        // 计算文件哈希
        const fileHash = calculateFileHash(req.file.path);
        if (fileHash) {
          req.file.hash = fileHash;
          logger.info(`[UPLOAD] 文件哈希计算成功: ${req.file.originalname}, 哈希: ${fileHash}`);
        }
        
        // 文件压缩（如果是图片且启用了压缩）
        if (compressOptions.enable !== false) {
          logger.info(`[UPLOAD] 开始文件压缩: ${req.file.originalname}`);
          const compressionResult = await compressUploadedFile(req.file, compressOptions);
          
          if (compressionResult.success) {
            // 压缩成功，使用压缩后的文件替换原始文件
            req.file = compressionResult.compressedFile;
            req.file.compressionResult = compressionResult.compressionResult;
            
            // 删除原始文件
            try {
              fs.unlinkSync(compressionResult.originalFile.path);
              logger.info(`[UPLOAD] 已删除原始文件: ${compressionResult.originalFile.originalname}`);
            } catch (unlinkError) {
              logger.error(`[UPLOAD] 删除原始文件失败: ${unlinkError.message}`);
            }
          } else {
            // 压缩失败，保留原始文件
            req.file.compressionResult = {
              success: false,
              reason: compressionResult.reason
            };
            logger.warn(`[UPLOAD] 文件压缩失败，保留原始文件: ${req.file.originalname}, 原因: ${compressionResult.reason}`);
          }
        }
        
        logger.info(`[UPLOAD] 文件验证、扫描和压缩完成: ${req.file.originalname}`);
      } catch (error) {
        // 如果发生错误，尝试删除已上传的文件
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            logger.error(`[UPLOAD] 删除文件失败: ${unlinkError.message}`);
          }
        }
        return next(error);
      }
    }
    
    next();
  });
};

// 增强的多文件上传中间件，包含内容验证、病毒扫描和文件压缩
const uploadMultiple = (fieldName, maxCount = 5, compressOptions = {}) => (req, res, next) => {
  const multipleUpload = upload.array(fieldName, maxCount);
  
  multipleUpload(req, res, async (err) => {
    if (err) {
      logger.error(`[UPLOAD] 多文件上传错误: ${err.message}`);
      return next(err);
    }
    
    // 如果有文件上传，进行内容验证和病毒扫描
    if (req.files && req.files.length > 0) {
      try {
        const invalidFiles = [];
        const scanResults = [];
        
        // 文件签名验证
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const isValidSignature = verifyFileSignature(file.path, file.mimetype);
          
          if (!isValidSignature) {
            // 记录无效文件
            invalidFiles.push({
              index: i,
              originalname: file.originalname,
              path: file.path,
              reason: '文件内容与声明的类型不匹配'
            });
          }
        }
        
        // 如果有无效文件，删除它们并返回错误
        if (invalidFiles.length > 0) {
          // 删除所有上传的文件
          req.files.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (error) {
              logger.error(`[UPLOAD] 删除文件失败: ${error.message}`);
            }
          });
          
          const invalidFileNames = invalidFiles.map(f => f.originalname).join(', ');
          const error = new Error(`以下文件内容与声明的类型不匹配: ${invalidFileNames}`);
          logger.error(`[UPLOAD] 多文件内容验证失败: ${invalidFileNames}`);
          return next(error);
        }
        
        // 病毒扫描
        logger.info(`[UPLOAD] 开始批量病毒扫描，共 ${req.files.length} 个文件`);
        for (const file of req.files) {
          try {
            const scanResult = await scanFile(file.path);
            scanResults.push({
              file: file.originalname,
              path: file.path,
              ...scanResult
            });
          } catch (scanError) {
            logger.error(`[UPLOAD] 病毒扫描出错: ${file.originalname} - ${scanError.message}`);
            scanResults.push({
              file: file.originalname,
              path: file.path,
              isInfected: true,
              viruses: ['扫描失败'],
              error: scanError.message
            });
          }
        }
        
        // 检查是否有感染病毒的文件
        if (hasInfectedFiles(scanResults)) {
          // 删除所有上传的文件
          req.files.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (error) {
              logger.error(`[UPLOAD] 删除文件失败: ${error.message}`);
            }
          });
          
          const infectedFiles = scanResults
            .filter(result => result.isInfected)
            .map(result => `${result.file}(${result.viruses.join(', ')})`)
            .join(', ');
            
          const error = new Error(`以下文件包含病毒或扫描失败: ${infectedFiles}`);
          logger.error(`[UPLOAD] 多文件病毒扫描失败: ${infectedFiles}`);
          return next(error);
        }
        
        // 计算文件哈希
        for (const file of req.files) {
          const fileHash = calculateFileHash(file.path);
          if (fileHash) {
            file.hash = fileHash;
          }
        }
        
        // 文件压缩（如果是图片且启用了压缩）
        if (compressOptions.enable !== false) {
          logger.info(`[UPLOAD] 开始批量文件压缩，共 ${req.files.length} 个文件`);
          const compressedFiles = [];
          const originalFiles = [];
          
          for (const file of req.files) {
            const compressionResult = await compressUploadedFile(file, compressOptions);
            
            if (compressionResult.success) {
              // 压缩成功
              compressedFiles.push(compressionResult.compressedFile);
              originalFiles.push(compressionResult.originalFile);
              
              // 添加压缩结果到文件对象
              compressionResult.compressedFile.compressionResult = compressionResult.compressionResult;
            } else {
              // 压缩失败，保留原始文件
              file.compressionResult = {
                success: false,
                reason: compressionResult.reason
              };
              compressedFiles.push(file);
            }
          }
          
          // 更新req.files为压缩后的文件
          req.files = compressedFiles;
          
          // 删除原始文件
          for (const originalFile of originalFiles) {
            try {
              fs.unlinkSync(originalFile.path);
              logger.info(`[UPLOAD] 已删除原始文件: ${originalFile.originalname}`);
            } catch (unlinkError) {
              logger.error(`[UPLOAD] 删除原始文件失败: ${unlinkError.message}`);
            }
          }
          
          logger.info(`[UPLOAD] 批量文件压缩完成`);
        }
        
        logger.info(`[UPLOAD] 多文件验证、扫描和压缩完成，共 ${req.files.length} 个文件`);
      } catch (error) {
        // 如果发生错误，尝试删除所有已上传的文件
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            if (file.path && fs.existsSync(file.path)) {
              try {
                fs.unlinkSync(file.path);
              } catch (unlinkError) {
                logger.error(`[UPLOAD] 删除文件失败: ${unlinkError.message}`);
              }
            }
          });
        }
        return next(error);
      }
    }
    
    next();
  });
};

// 获取文件信息的辅助函数
const getFileInfo = (file) => {
  if (!file) return null;
  
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path.replace(/\\/g, '/'), // 统一路径分隔符
    url: `/uploads/${file.filename}`,
    hash: file.hash || null // 添加文件哈希值
  };
};

// 获取多个文件信息的辅助函数
const getFilesInfo = (files) => {
  if (!files || !Array.isArray(files)) return [];
  return files.map(file => getFileInfo(file));
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  getFileInfo,
  getFilesInfo
};