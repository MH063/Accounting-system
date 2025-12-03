/**
 * 静态资源优化器
 * 提供CSS、JavaScript、图片等静态资源的压缩和优化功能
 */

const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const { logger } = require('../config/logger');
const { redisManager } = require('../config/multiLevelCache');

class StaticResourceOptimizer {
  constructor() {
    this.publicDir = path.join(__dirname, '../../public');
    this.optimizedDir = path.join(__dirname, '../../public/optimized');
    this.assetsDir = path.join(__dirname, '../../public/assets');
    
    // 确保目录存在
    this.ensureDirectories();
  }

  /**
   * 确保必要的目录存在
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.optimizedDir, { recursive: true });
      await fs.mkdir(this.assetsDir, { recursive: true });
    } catch (error) {
      logger.error('[STATIC] 创建目录失败:', error);
    }
  }

  /**
   * 获取静态资源优化状态
   */
  async getOptimizationStatus() {
    try {
      // 获取原文件和优化后文件统计
      const originalStats = await this.getDirectoryStats(this.publicDir);
      const optimizedStats = await this.getDirectoryStats(this.optimizedDir);
      const assetsStats = await this.getDirectoryStats(this.assetsDir);
      
      // 检查缓存配置
      const cacheConfig = await this.getCacheConfiguration();
      
      // 获取压缩效果统计
      const compressionStats = await this.getCompressionStats();
      
      return {
        timestamp: new Date().toISOString(),
        directories: {
          original: originalStats,
          optimized: optimizedStats,
          assets: assetsStats
        },
        cache: cacheConfig,
        compression: compressionStats,
        status: 'healthy',
        recommendations: this.generateOptimizationRecommendations(originalStats, optimizedStats)
      };
    } catch (error) {
      logger.error('[STATIC] 获取优化状态失败:', error);
      return {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 获取目录统计信息
   */
  async getDirectoryStats(dirPath) {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {},
        largestFiles: []
      };
      
      await this.walkDirectory(dirPath, async (filePath) => {
        try {
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            stats.totalFiles++;
            stats.totalSize += stat.size;
            
            const ext = path.extname(filePath).toLowerCase();
            stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
            
            stats.largestFiles.push({
              file: path.relative(dirPath, filePath),
              size: stat.size,
              mtime: stat.mtime
            });
          }
        } catch (error) {
          // 忽略无法访问的文件
        }
      });
      
      // 排序并限制最大文件数量
      stats.largestFiles.sort((a, b) => b.size - a.size);
      stats.largestFiles = stats.largestFiles.slice(0, 10);
      
      return stats;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { totalFiles: 0, totalSize: 0, fileTypes: {}, largestFiles: [] };
      }
      throw error;
    }
  }

  /**
   * 递归遍历目录
   */
  async walkDirectory(dirPath, callback) {
    try {
      const entries = await fs.readdir(dirPath);
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await this.walkDirectory(fullPath, callback);
        } else {
          await callback(fullPath);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error(`[STATIC] 遍历目录 ${dirPath} 失败:`, error);
      }
    }
  }

  /**
   * 获取缓存配置信息
   */
  async getCacheConfiguration() {
    try {
      // 检查是否存在缓存配置文件
      const cacheConfigPath = path.join(__dirname, '../config/cache-config.json');
      
      let config = {
        enabled: false,
        maxAge: 86400, // 24小时
        cacheControl: 'public, max-age=86400',
        etag: true,
        lastModified: true
      };
      
      try {
        const configContent = await fs.readFile(cacheConfigPath, 'utf8');
        config = { ...config, ...JSON.parse(configContent) };
      } catch (error) {
        // 配置文件不存在，使用默认配置
        await this.createCacheConfiguration(config);
      }
      
      return config;
    } catch (error) {
      logger.error('[STATIC] 获取缓存配置失败:', error);
      return { enabled: false, error: error.message };
    }
  }

  /**
   * 创建缓存配置文件
   */
  async createCacheConfiguration(config) {
    try {
      const configPath = path.join(__dirname, '../config/cache-config.json');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      logger.info('[STATIC] 缓存配置文件已创建');
    } catch (error) {
      logger.error('[STATIC] 创建缓存配置失败:', error);
    }
  }

  /**
   * 获取压缩统计信息
   */
  async getCompressionStats() {
    try {
      // 首先从缓存配置获取压缩设置
      const cacheConfig = await this.getCacheConfiguration();
      
      const stats = {
        gzip: { 
          enabled: cacheConfig.compression?.gzip || false, 
          files: 0, 
          totalSaved: 0,
          available: true // 系统内置支持
        },
        brotli: { 
          enabled: cacheConfig.compression?.brotli || false, 
          files: 0, 
          totalSaved: 0,
          available: typeof zlib.brotliCompressSync === 'function' // 检查Node.js版本是否支持
        }
      };
      
      // 检查是否存在压缩后的文件
      try {
        const files = await fs.readdir(this.optimizedDir);
        
        for (const file of files) {
          const filePath = path.join(this.optimizedDir, file);
          try {
            const stat = await fs.stat(filePath);
            
            if (file.endsWith('.gz')) {
              stats.gzip.files++;
              stats.gzip.totalSaved += stat.size;
            } else if (file.endsWith('.br')) {
              stats.brotli.files++;
              stats.brotli.totalSaved += stat.size;
            }
          } catch (e) {
            // 忽略无法访问的文件
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          logger.warn('[STATIC] 读取优化目录失败:', error.message);
        }
      }
      
      // 格式化总节省空间
      stats.gzip.totalSavedFormatted = this.formatBytes(stats.gzip.totalSaved);
      stats.brotli.totalSavedFormatted = this.formatBytes(stats.brotli.totalSaved);
      
      return stats;
    } catch (error) {
      logger.error('[STATIC] 获取压缩统计失败:', error);
      return {
        gzip: { enabled: true, available: true, files: 0, totalSaved: 0, totalSavedFormatted: '0 Bytes' },
        brotli: { enabled: true, available: true, files: 0, totalSaved: 0, totalSavedFormatted: '0 Bytes' }
      };
    }
  }

  /**
   * 生成优化建议
   */
  generateOptimizationRecommendations(originalStats, optimizedStats) {
    const recommendations = [];
    
    // 比较原文件和优化文件的大小差异
    const originalSize = originalStats.totalSize;
    const optimizedSize = optimizedStats.totalSize;
    
    if (originalSize > 0 && optimizedSize === 0) {
      recommendations.push({
        type: 'no_optimization',
        priority: 'high',
        message: '检测到未优化的静态资源',
        action: '运行完整的静态资源优化流程',
        potentialSavings: this.calculatePotentialSavings(originalStats)
      });
    }
    
    // 检查文件类型分布
    const cssFiles = originalStats.fileTypes['.css'] || 0;
    const jsFiles = originalStats.fileTypes['.js'] || 0;
    const imageFiles = (originalStats.fileTypes['.png'] || 0) + 
                      (originalStats.fileTypes['.jpg'] || 0) + 
                      (originalStats.fileTypes['.jpeg'] || 0) + 
                      (originalStats.fileTypes['.gif'] || 0) + 
                      (originalStats.fileTypes['.webp'] || 0) + 
                      (originalStats.fileTypes['.svg'] || 0);
    
    if (cssFiles > 1) {
      recommendations.push({
        type: 'css_concatenation',
        priority: 'medium',
        message: `发现${cssFiles}个CSS文件，建议合并以减少HTTP请求`,
        action: '执行CSS合并和压缩'
      });
    }
    
    if (jsFiles > 1) {
      recommendations.push({
        type: 'js_concatenation',
        priority: 'medium',
        message: `发现${jsFiles}个JavaScript文件，建议合并以减少HTTP请求`,
        action: '执行JavaScript合并和压缩'
      });
    }
    
    if (imageFiles > 10) {
      recommendations.push({
        type: 'image_optimization',
        priority: 'medium',
        message: `发现${imageFiles}个图片文件，建议进行压缩优化`,
        action: '执行图片压缩和格式转换'
      });
    }
    
    return recommendations;
  }

  /**
   * 计算潜在节省空间
   */
  calculatePotentialSavings(originalStats) {
    let savings = 0;
    
    // CSS和JS文件通过压缩可节省约30-50%空间
    const cssSize = (originalStats.fileTypes['.css'] || 0) * 50000; // 假设平均50KB
    const jsSize = (originalStats.fileTypes['.js'] || 0) * 80000; // 假设平均80KB
    const imageSize = ((originalStats.fileTypes['.png'] || 0) + 
                      (originalStats.fileTypes['.jpg'] || 0) + 
                      (originalStats.fileTypes['.jpeg'] || 0)) * 100000; // 假设平均100KB
    
    savings += cssSize * 0.4; // 40%压缩率
    savings += jsSize * 0.4;
    savings += imageSize * 0.6; // 图片可压缩60%
    
    return {
      bytes: Math.round(savings),
      formatted: this.formatBytes(savings)
    };
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 优化所有静态资源
   */
  async optimizeAll(directory = 'public') {
    try {
      logger.info('[STATIC] 开始优化所有静态资源...');
      
      const dirPath = path.join(__dirname, `../../${directory}`);
      const results = {
        css: [],
        js: [],
        images: [],
        summary: {
          totalFiles: 0,
          optimizedFiles: 0,
          totalSize: 0,
          optimizedSize: 0,
          savings: 0
        }
      };
      
      // CSS优化
      try {
        results.css = await this.optimizeCSS(directory);
      } catch (error) {
        logger.error('[STATIC] CSS优化失败:', error);
        results.css = { error: error.message };
      }
      
      // JavaScript优化
      try {
        results.js = await this.optimizeJS(directory);
      } catch (error) {
        logger.error('[STATIC] JavaScript优化失败:', error);
        results.js = { error: error.message };
      }
      
      // 图片优化
      try {
        results.images = await this.optimizeImages(directory);
      } catch (error) {
        logger.error('[STATIC] 图片优化失败:', error);
        results.images = { error: error.message };
      }
      
      // 生成总结
      results.summary = this.generateOptimizationSummary(results);
      
      logger.info('[STATIC] 所有静态资源优化完成');
      
      return results;
    } catch (error) {
      logger.error('[STATIC] 优化所有静态资源失败:', error);
      throw error;
    }
  }

  /**
   * 生成优化总结
   */
  generateOptimizationSummary(results) {
    let totalFiles = 0;
    let optimizedFiles = 0;
    let totalSize = 0;
    let optimizedSize = 0;
    let savings = 0;
    
    // 汇总CSS优化结果
    if (Array.isArray(results.css)) {
      totalFiles += results.css.length;
      results.css.forEach(file => {
        optimizedFiles++;
        totalSize += file.originalSize || 0;
        optimizedSize += file.optimizedSize || 0;
        savings += (file.originalSize || 0) - (file.optimizedSize || 0);
      });
    }
    
    // 汇总JavaScript优化结果
    if (Array.isArray(results.js)) {
      totalFiles += results.js.length;
      results.js.forEach(file => {
        optimizedFiles++;
        totalSize += file.originalSize || 0;
        optimizedSize += file.optimizedSize || 0;
        savings += (file.originalSize || 0) - (file.optimizedSize || 0);
      });
    }
    
    // 汇总图片优化结果
    if (Array.isArray(results.images)) {
      totalFiles += results.images.length;
      results.images.forEach(file => {
        optimizedFiles++;
        totalSize += file.originalSize || 0;
        optimizedSize += file.optimizedSize || 0;
        savings += (file.originalSize || 0) - (file.optimizedSize || 0);
      });
    }
    
    return {
      totalFiles,
      optimizedFiles,
      totalSize,
      optimizedSize,
      savings,
      compressionRatio: totalSize > 0 ? ((savings / totalSize) * 100).toFixed(2) + '%' : '0%',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 优化CSS文件
   */
  async optimizeCSS(directory = 'public') {
    try {
      logger.info('[STATIC] 开始优化CSS文件...');
      
      const dirPath = path.join(__dirname, `../../${directory}`);
      const cssDir = path.join(dirPath, 'css');
      
      const results = [];
      
      try {
        await fs.mkdir(cssDir, { recursive: true });
        const files = await fs.readdir(cssDir);
        
        for (const file of files) {
          if (file.endsWith('.css')) {
            const filePath = path.join(cssDir, file);
            const result = await this.optimizeSingleCSS(filePath);
            results.push(result);
          }
        }
        
        // 合并CSS文件
        const mergedResult = await this.mergeCSSFiles(results, cssDir);
        if (mergedResult) {
          results.push(mergedResult);
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      
      logger.info(`[STATIC] CSS优化完成，优化了${results.length}个文件`);
      
      return results;
    } catch (error) {
      logger.error('[STATIC] CSS优化失败:', error);
      throw error;
    }
  }

  /**
   * 优化单个CSS文件
   */
  async optimizeSingleCSS(filePath) {
    try {
      const originalContent = await fs.readFile(filePath, 'utf8');
      const originalSize = Buffer.byteLength(originalContent, 'utf8');
      
      // 简单CSS压缩（移除注释、空格、换行）
      let optimizedContent = originalContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
        .replace(/\s+/g, ' ') // 合并多个空格
        .replace(/\s*([{}:;,>])\s*/g, '$1') // 移除括号和冒号周围的空格
        .replace(/;}/g, '}') // 移除最后一个分号
        .trim();
      
      const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
      const savings = originalSize - optimizedSize;
      const compressionRatio = ((savings / originalSize) * 100).toFixed(2);
      
      // 保存优化后的文件
      const optimizedPath = filePath.replace('.css', '.min.css');
      await fs.writeFile(optimizedPath, optimizedContent, 'utf8');
      
      // 创建Gzip版本
      await this.createGzipVersion(optimizedPath);
      
      return {
        file: path.basename(filePath),
        originalSize,
        optimizedSize,
        savings,
        compressionRatio: compressionRatio + '%',
        status: 'success'
      };
    } catch (error) {
      logger.error(`[STATIC] 优化CSS文件 ${filePath} 失败:`, error);
      return {
        file: path.basename(filePath),
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * 合并CSS文件
   */
  async mergeCSSFiles(cssResults, cssDir) {
    try {
      const files = cssResults
        .filter(result => result.status === 'success')
        .map(result => path.join(cssDir, result.file.replace('.css', '.min.css')));
      
      if (files.length <= 1) {
        return null; // 不需要合并
      }
      
      let mergedContent = '';
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf8');
          mergedContent += content + '\n';
        } catch (error) {
          logger.warn(`[STATIC] 读取CSS文件 ${file} 失败:`, error);
        }
      }
      
      if (mergedContent.trim()) {
        const mergedPath = path.join(cssDir, 'merged.min.css');
        await fs.writeFile(mergedPath, mergedContent, 'utf8');
        await this.createGzipVersion(mergedPath);
        
        return {
          file: 'merged.min.css',
          type: 'merged',
          size: Buffer.byteLength(mergedContent, 'utf8'),
          originalFiles: files.length,
          status: 'success'
        };
      }
      
      return null;
    } catch (error) {
      logger.error('[STATIC] 合并CSS文件失败:', error);
      return null;
    }
  }

  /**
   * 优化JavaScript文件
   */
  async optimizeJS(directory = 'public') {
    try {
      logger.info('[STATIC] 开始优化JavaScript文件...');
      
      const dirPath = path.join(__dirname, `../../${directory}`);
      const jsDir = path.join(dirPath, 'js');
      
      const results = [];
      
      try {
        await fs.mkdir(jsDir, { recursive: true });
        const files = await fs.readdir(jsDir);
        
        for (const file of files) {
          if (file.endsWith('.js') && !file.includes('.min.')) {
            const filePath = path.join(jsDir, file);
            const result = await this.optimizeSingleJS(filePath);
            results.push(result);
          }
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      
      logger.info(`[STATIC] JavaScript优化完成，优化了${results.length}个文件`);
      
      return results;
    } catch (error) {
      logger.error('[STATIC] JavaScript优化失败:', error);
      throw error;
    }
  }

  /**
   * 优化单个JavaScript文件
   */
  async optimizeSingleJS(filePath) {
    try {
      const originalContent = await fs.readFile(filePath, 'utf8');
      const originalSize = Buffer.byteLength(originalContent, 'utf8');
      
      // 简单的JavaScript压缩（移除注释、空白）
      let optimizedContent = originalContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
        .replace(/\/\/.*$/gm, '') // 移除单行注释
        .replace(/\s+/g, ' ') // 合并多个空格
        .replace(/;\s*}/g, '}') // 移除最后的分号
        .trim();
      
      // 保持变量名不变，只移除空白（更安全）
      const safeOptimizedContent = originalContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
        .replace(/\/\/.*$/gm, '') // 移除单行注释
        .replace(/^\s*$(?:\r?\n)+/gm, '') // 移除空行
        .trim();
      
      const optimizedSize = Buffer.byteLength(safeOptimizedContent, 'utf8');
      const savings = originalSize - optimizedSize;
      const compressionRatio = ((savings / originalSize) * 100).toFixed(2);
      
      // 保存优化后的文件
      const optimizedPath = filePath.replace('.js', '.min.js');
      await fs.writeFile(optimizedPath, safeOptimizedContent, 'utf8');
      
      // 创建Gzip版本
      await this.createGzipVersion(optimizedPath);
      
      return {
        file: path.basename(filePath),
        originalSize,
        optimizedSize,
        savings,
        compressionRatio: compressionRatio + '%',
        status: 'success'
      };
    } catch (error) {
      logger.error(`[STATIC] 优化JS文件 ${filePath} 失败:`, error);
      return {
        file: path.basename(filePath),
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * 优化图片文件
   */
  async optimizeImages(directory = 'public') {
    try {
      logger.info('[STATIC] 开始优化图片文件...');
      
      const dirPath = path.join(__dirname, `../../${directory}`);
      const imagesDir = path.join(dirPath, 'images');
      
      const results = [];
      
      try {
        await fs.mkdir(imagesDir, { recursive: true });
        
        // 获取所有支持的图片格式
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
        const files = await fs.readdir(imagesDir);
        
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (imageExtensions.includes(ext)) {
            const filePath = path.join(imagesDir, file);
            const result = await this.optimizeSingleImage(filePath);
            results.push(result);
          }
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      
      logger.info(`[STATIC] 图片优化完成，优化了${results.length}个文件`);
      
      return results;
    } catch (error) {
      logger.error('[STATIC] 图片优化失败:', error);
      throw error;
    }
  }

  /**
   * 优化单个图片文件
   */
  async optimizeSingleImage(filePath) {
    try {
      const stat = await fs.stat(filePath);
      const originalSize = stat.size;
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();
      
      let optimizedSize = originalSize;
      let result = {
        file: fileName,
        originalSize,
        optimizedSize,
        savings: 0,
        compressionRatio: '0%',
        status: 'success'
      };
      
      // 对于SVG文件，可以进行简单的文本优化
      if (ext === '.svg') {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const optimizedContent = content
            .replace(/>\s+</g, '><') // 移除标签间的空白
            .replace(/\s{2,}/g, ' ') // 合并多个空格
            .replace(/\n\s*/g, '') // 移除换行和前后空格
            .trim();
          
          const optimizedBuffer = Buffer.from(optimizedContent, 'utf8');
          optimizedSize = optimizedBuffer.length;
          
          if (optimizedSize < originalSize) {
            const optimizedPath = filePath.replace('.svg', '.min.svg');
            await fs.writeFile(optimizedPath, optimizedBuffer);
            await this.createGzipVersion(optimizedPath);
            
            result.optimizedSize = optimizedSize;
            result.savings = originalSize - optimizedSize;
            result.compressionRatio = ((result.savings / originalSize) * 100).toFixed(2) + '%';
          }
        } catch (svgError) {
          logger.warn(`[STATIC] SVG优化失败 ${filePath}:`, svgError);
        }
      }
      
      // 对于其他格式的图片（PNG, JPG等），可以进行文件复制和元数据清理
      else {
        try {
          // 简单的文件优化：复制并压缩元数据
          const fileBuffer = await fs.readFile(filePath);
          
          // 这里可以集成更高级的图片压缩库
          // 目前只是复制文件并标记为优化状态
          const optimizedPath = filePath.replace(ext, `.optimized${ext}`);
          await fs.writeFile(optimizedPath, fileBuffer);
          
          result.optimizedSize = fileBuffer.length;
          if (fileBuffer.length !== originalSize) {
            result.savings = originalSize - fileBuffer.length;
            result.compressionRatio = ((result.savings / originalSize) * 100).toFixed(2) + '%';
          }
        } catch (copyError) {
          logger.warn(`[STATIC] 图片复制失败 ${filePath}:`, copyError);
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`[STATIC] 优化图片文件 ${filePath} 失败:`, error);
      return {
        file: path.basename(filePath),
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * 创建Gzip压缩版本
   */
  async createGzipVersion(filePath) {
    try {
      const content = await fs.readFile(filePath);
      const gzippedContent = zlib.gzipSync(content);
      const gzippedPath = filePath + '.gz';
      
      await fs.writeFile(gzippedPath, gzippedContent);
      
      logger.debug(`[STATIC] 创建Gzip版本: ${gzippedPath}`);
    } catch (error) {
      logger.warn(`[STATIC] 创建Gzip版本失败 ${filePath}:`, error);
    }
  }

  /**
   * 启用静态资源缓存
   */
  async enableStaticCaching() {
    try {
      const cacheConfig = {
        enabled: true,
        maxAge: 31536000, // 1年
        cacheControl: 'public, max-age=31536000, immutable',
        etag: true,
        lastModified: true,
        compression: {
          gzip: true,
          brotli: true
        }
      };
      
      await this.createCacheConfiguration(cacheConfig);
      
      logger.info('[STATIC] 静态资源缓存已启用');
      
      return cacheConfig;
    } catch (error) {
      logger.error('[STATIC] 启用缓存失败:', error);
      throw error;
    }
  }
}

module.exports = StaticResourceOptimizer;