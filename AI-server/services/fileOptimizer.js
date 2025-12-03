const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { createWorker } = require('sharp');

class FileOptimizer {
  constructor() {
    this.worker = null;
    this.initialized = false;
    this.cache = new Map();
    this.maxCacheSize = 100; // 最大缓存项数
  }

  /**
   * 初始化优化器
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.worker = createWorker({
        memory: 512, // 512MB内存限制
        maxQueue: 10, // 最大队列长度
      });
      
      this.initialized = true;
      console.log('[FILE-OPTIMIZER] 图片优化器初始化成功');
    } catch (error) {
      console.error('[FILE-OPTIMIZER] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 优化图片文件
   * @param {string} inputPath - 输入文件路径
   * @param {Object} options - 优化选项
   * @returns {Promise<Object>} 优化结果
   */
  async optimizeImage(inputPath, options = {}) {
    await this.initialize();
    
    const {
      format = 'jpeg',
      quality = 80,
      width = null,
      height = null,
      progressive = true,
      lossless = false,
      overwrite = false
    } = options;

    // 检查缓存
    const cacheKey = `${inputPath}_${format}_${quality}_${width}_${height}`;
    if (this.cache.has(cacheKey) && !overwrite) {
      return this.cache.get(cacheKey);
    }

    try {
      let pipeline = sharp(inputPath);

      // 调整尺寸
      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // 设置格式和质量
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({
            quality,
            progressive,
            mozjpeg: true
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            quality,
            progressive,
            compressionLevel: lossless ? 0 : 6
          });
          break;
        case 'webp':
          pipeline = pipeline.webp({
            quality,
            lossless
          });
          break;
        case 'avif':
          pipeline = pipeline.avif({
            quality,
            lossless
          });
          break;
        default:
          throw new Error(`不支持的图片格式: ${format}`);
      }

      const outputPath = this.generateOutputPath(inputPath, format);
      const optimizedBuffer = await pipeline.toBuffer();
      
      // 保存优化后的文件
      await fs.writeFile(outputPath, optimizedBuffer);

      // 获取文件信息
      const stats = await fs.stat(outputPath);
      const originalStats = await fs.stat(inputPath);

      const result = {
        originalPath: inputPath,
        optimizedPath: outputPath,
        originalSize: originalStats.size,
        optimizedSize: stats.size,
        compressionRatio: ((originalStats.size - stats.size) / originalStats.size * 100).toFixed(2),
        format,
        width,
        height,
        timestamp: new Date().toISOString()
      };

      // 添加到缓存
      this.addToCache(cacheKey, result);

      console.log('[FILE-OPTIMIZER] 图片优化完成:', result);
      return result;

    } catch (error) {
      console.error('[FILE-OPTIMIZER] 图片优化失败:', error);
      throw error;
    }
  }

  /**
   * 批量优化图片
   * @param {Array} files - 文件路径数组
   * @param {Object} options - 优化选项
   * @returns {Promise<Array>} 优化结果数组
   */
  async batchOptimizeImages(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.optimizeImage(file, options);
        results.push({
          file,
          success: true,
          result
        });
      } catch (error) {
        console.error(`[FILE-OPTIMIZER] 批量优化失败 - ${file}:`, error);
        results.push({
          file,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 智能压缩 - 根据文件大小自动选择最优压缩策略
   * @param {string} inputPath - 输入文件路径
   * @param {Object} options - 基础选项
   * @returns {Promise<Object>} 优化结果
   */
  async smartCompress(inputPath, options = {}) {
    const stats = await fs.stat(inputPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    let compressionOptions = { ...options };
    
    // 根据文件大小调整压缩策略
    if (fileSizeMB > 5) { // 大文件
      compressionOptions.quality = Math.min(options.quality || 80, 70);
      compressionOptions.progressive = true;
    } else if (fileSizeMB < 0.5) { // 小文件
      compressionOptions.quality = Math.min(options.quality || 80, 90);
      compressionOptions.lossless = true;
    }

    // 智能格式选择
    const ext = path.extname(inputPath).toLowerCase();
    if (!options.format) {
      if (ext === '.png') {
        compressionOptions.format = 'webp'; // PNG转换为WebP通常更小
      } else if (ext === '.jpg' || ext === '.jpeg') {
        compressionOptions.format = 'avif'; // JPEG转换为AVIF压缩率更高
      }
    }

    return this.optimizeImage(inputPath, compressionOptions);
  }

  /**
   * 生成输出路径
   * @param {string} inputPath - 输入路径
   * @param {string} format - 输出格式
   * @returns {string} 输出路径
   */
  generateOutputPath(inputPath, format) {
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const basename = path.basename(inputPath, ext);
    return path.join(dir, `${basename}_optimized.${format}`);
  }

  /**
   * 添加到缓存
   * @param {string} key - 缓存键
   * @param {Object} value - 缓存值
   */
  addToCache(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * 获取缓存统计
   * @returns {Object} 缓存统计信息
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.cacheHitRate || 0
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('[FILE-OPTIMIZER] 缓存已清理');
  }

  /**
   * 终止优化器
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.initialized = false;
      console.log('[FILE-OPTIMIZER] 优化器已终止');
    }
  }
}

module.exports = FileOptimizer;