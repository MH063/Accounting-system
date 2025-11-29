/**
 * 文件压缩和优化模块
 * 提供图片压缩、文件归档等功能
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const archiver = require('archiver');
const logger = require('../config/logger');

/**
 * 图片压缩配置
 */
const imageCompressionConfig = {
  // JPEG压缩配置
  jpeg: {
    quality: 80, // 压缩质量 (0-100)
    progressive: true // 渐进式JPEG
  },
  // PNG压缩配置
  png: {
    compressionLevel: 8, // 压缩级别 (0-9)
    adaptiveFiltering: true // 自适应过滤
  },
  // WebP压缩配置
  webp: {
    quality: 80, // 压缩质量 (0-100)
    effort: 4 // 压缩努力程度 (0-6)
  },
  // 最大宽度，超过此宽度将等比缩放
  maxWidth: 1920,
  // 最大高度，超过此高度将等比缩放
  maxHeight: 1080
};

/**
 * 压缩图片
 * @param {string} inputPath - 输入图片路径
 * @param {string} outputPath - 输出图片路径
 * @param {Object} options - 压缩选项
 * @returns {Promise<Object>} 压缩结果
 */
const compressImage = async (inputPath, outputPath, options = {}) => {
  try {
    const startTime = Date.now();
    const inputStats = fs.statSync(inputPath);
    const inputSize = inputStats.size;
    
    // 获取图片信息
    const metadata = await sharp(inputPath).metadata();
    
    // 合并配置选项
    const config = {
      ...imageCompressionConfig,
      ...options
    };
    
    // 创建压缩管道
    let pipeline = sharp(inputPath);
    
    // 调整图片尺寸（如果需要）
    let needsResize = false;
    let width = metadata.width;
    let height = metadata.height;
    
    if (metadata.width > config.maxWidth) {
      width = config.maxWidth;
      height = Math.round(metadata.height * (config.maxWidth / metadata.width));
      needsResize = true;
    }
    
    if (height > config.maxHeight) {
      height = config.maxHeight;
      width = Math.round(metadata.width * (config.maxHeight / metadata.height));
      needsResize = true;
    }
    
    if (needsResize) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside', // 保持宽高比，完全包含在指定尺寸内
        withoutEnlargement: true // 不放大图片
      });
    }
    
    // 根据输出格式应用压缩
    const outputFormat = options.format || metadata.format;
    
    switch (outputFormat) {
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg(config.jpeg);
        break;
      case 'png':
        pipeline = pipeline.png(config.png);
        break;
      case 'webp':
        pipeline = pipeline.webp(config.webp);
        break;
      default:
        // 保持原始格式
        if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
          pipeline = pipeline.jpeg(config.jpeg);
        } else if (metadata.format === 'png') {
          pipeline = pipeline.png(config.png);
        }
    }
    
    // 执行压缩
    await pipeline.toFile(outputPath);
    
    // 获取压缩后文件大小
    const outputStats = fs.statSync(outputPath);
    const outputSize = outputStats.size;
    const compressionRatio = ((inputSize - outputSize) / inputSize * 100).toFixed(2);
    const duration = Date.now() - startTime;
    
    logger.info(`[COMPRESSION] 图片压缩完成: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`, {
      inputSize: `${(inputSize / 1024).toFixed(2)} KB`,
      outputSize: `${(outputSize / 1024).toFixed(2)} KB`,
      compressionRatio: `${compressionRatio}%`,
      duration: `${duration}ms`,
      originalFormat: metadata.format,
      outputFormat
    });
    
    return {
      success: true,
      inputSize,
      outputSize,
      compressionRatio: parseFloat(compressionRatio),
      duration,
      originalDimensions: { width: metadata.width, height: metadata.height },
      outputDimensions: needsResize ? { width, height } : { width: metadata.width, height: metadata.height }
    };
  } catch (error) {
    logger.error(`[COMPRESSION] 图片压缩失败: ${error.message}`, {
      inputPath,
      outputPath,
      error: error.message
    });
    
    // 如果压缩失败，尝试复制原始文件
    try {
      fs.copyFileSync(inputPath, outputPath);
      logger.info(`[COMPRESSION] 压缩失败，已复制原始文件: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
      
      const stats = fs.statSync(outputPath);
      return {
        success: false,
        error: error.message,
        inputSize: stats.size,
        outputSize: stats.size,
        compressionRatio: 0,
        fallback: true
      };
    } catch (copyError) {
      logger.error(`[COMPRESSION] 复制原始文件失败: ${copyError.message}`);
      throw new Error(`图片压缩和复制均失败: ${error.message}`);
    }
  }
};

/**
 * 批量压缩图片
 * @param {Array} files - 文件数组，每个元素包含 {inputPath, outputPath, options}
 * @returns {Promise<Array>} 压缩结果数组
 */
const batchCompressImages = async (files) => {
  const results = [];
  
  for (const file of files) {
    try {
      const result = await compressImage(file.inputPath, file.outputPath, file.options);
      results.push({
        file: path.basename(file.inputPath),
        ...result
      });
    } catch (error) {
      results.push({
        file: path.basename(file.inputPath),
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * 创建ZIP归档
 * @param {Array} files - 要归档的文件路径数组
 * @param {string} outputPath - 输出ZIP文件路径
 * @param {Object} options - 归档选项
 * @returns {Promise<Object>} 归档结果
 */
const createArchive = async (files, outputPath, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const startTime = Date.now();
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: {
          level: options.compressionLevel || 6 // 压缩级别 (0-9)
        }
      });
      
      // 监听归档完成事件
      output.on('close', () => {
        try {
          const stats = fs.statSync(outputPath);
          const duration = Date.now() - startTime;
          
          logger.info(`[ARCHIVE] 归档创建完成: ${path.basename(outputPath)}`, {
            totalFiles: files.length,
            archiveSize: `${(stats.size / 1024).toFixed(2)} KB`,
            duration: `${duration}ms`
          });
          
          resolve({
            success: true,
            outputPath,
            totalFiles: files.length,
            archiveSize: stats.size,
            duration
          });
        } catch (error) {
          reject(error);
        }
      });
      
      // 监听错误事件
      archive.on('error', (err) => {
        logger.error(`[ARCHIVE] 归档创建失败: ${err.message}`);
        reject(err);
      });
      
      // 连接输出流
      archive.pipe(output);
      
      // 添加文件到归档
      for (const filePath of files) {
        if (fs.existsSync(filePath)) {
          const fileName = path.basename(filePath);
          archive.file(filePath, { name: fileName });
        } else {
          logger.warn(`[ARCHIVE] 文件不存在，跳过: ${filePath}`);
        }
      }
      
      // 完成归档
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 获取图片元数据
 * @param {string} imagePath - 图片路径
 * @returns {Promise<Object>} 图片元数据
 */
const getImageMetadata = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    const stats = fs.statSync(imagePath);
    
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2)
    };
  } catch (error) {
    logger.error(`[METADATA] 获取图片元数据失败: ${error.message}`, {
      imagePath,
      error: error.message
    });
    throw error;
  }
};

/**
 * 检查文件是否为图片
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} 是否为图片
 */
const isImageFile = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return !!metadata.format;
  } catch (error) {
    return false;
  }
};

/**
 * 优化文件存储路径
 * @param {string} originalPath - 原始路径
 * @param {string} mimeType - MIME类型
 * @returns {string} 优化后的路径
 */
const optimizeStoragePath = (originalPath, mimeType) => {
  const dir = path.dirname(originalPath);
  const ext = path.extname(originalPath);
  const name = path.basename(originalPath, ext);
  
  // 根据MIME类型确定子目录
  let subDir = 'others';
  if (mimeType.startsWith('image/')) {
    subDir = 'images';
  } else if (mimeType.startsWith('video/')) {
    subDir = 'videos';
  } else if (mimeType.includes('document') || 
             mimeType.includes('pdf') || 
             mimeType.includes('text')) {
    subDir = 'documents';
  }
  
  // 创建优化后的路径
  const optimizedDir = path.join(dir, subDir);
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
  }
  
  return path.join(optimizedDir, `${name}${ext}`);
};

module.exports = {
  compressImage,
  batchCompressImages,
  createArchive,
  getImageMetadata,
  isImageFile,
  optimizeStoragePath,
  imageCompressionConfig
};