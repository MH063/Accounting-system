/**
 * 文件清理服务
 * 自动清理过期的文件，释放存储空间
 */

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const logger = require('../config/logger');
const { storageManager } = require('./storageAdapter');
const { getStorageConfig } = require('../config/storage');

/**
 * 文件清理服务类
 */
class FileCleanupService {
  constructor() {
    this.config = getStorageConfig();
    this.isRunning = false;
    this.cleanupTask = null;
  }

  /**
   * 启动文件清理服务
   */
  start() {
    if (this.config.autoCleanup) {
      // 设置定时任务，每隔指定小时执行一次清理
      const cronExpression = `0 */${this.config.cleanupInterval} * * *`;
      
      this.cleanupTask = cron.schedule(cronExpression, async () => {
        if (!this.isRunning) {
          await this.performCleanup();
        }
      }, {
        scheduled: false
      });
      
      this.cleanupTask.start();
      
      logger.info('[CLEANUP] 文件清理服务已启动', {
        interval: `${this.config.cleanupInterval}小时`,
        retentionDays: `${this.config.retentionDays}天`
      });
      
      // 立即执行一次清理
      this.performCleanup();
    } else {
      logger.info('[CLEANUP] 文件清理服务已禁用');
    }
  }

  /**
   * 停止文件清理服务
   */
  stop() {
    if (this.cleanupTask) {
      this.cleanupTask.stop();
      this.cleanupTask = null;
      logger.info('[CLEANUP] 文件清理服务已停止');
    }
  }

  /**
   * 执行文件清理
   */
  async performCleanup() {
    if (this.isRunning) {
      logger.warn('[CLEANUP] 文件清理任务正在运行中，跳过本次执行');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      logger.info('[CLEANUP] 开始执行文件清理任务');
      
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.config.retentionDays);
      
      let deletedCount = 0;
      let freedSpace = 0;
      
      // 根据存储类型执行不同的清理策略
      if (this.config.type === 'local') {
        const result = await this.cleanupLocalFiles(retentionDate);
        deletedCount = result.deletedCount;
        freedSpace = result.freedSpace;
      } else {
        // 云存储清理逻辑
        const result = await this.cleanupCloudFiles(retentionDate);
        deletedCount = result.deletedCount;
        freedSpace = result.freedSpace;
      }
      
      const duration = Date.now() - startTime;
      
      logger.info('[CLEANUP] 文件清理任务完成', {
        deletedCount,
        freedSpace: `${(freedSpace / 1024 / 1024).toFixed(2)} MB`,
        duration: `${duration}ms`,
        retentionDate: retentionDate.toISOString()
      });
    } catch (error) {
      logger.error('[CLEANUP] 文件清理任务失败', { error: error.message });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 清理本地文件
   * @param {Date} retentionDate - 保留日期
   * @returns {Promise<Object>} 清理结果
   */
  async cleanupLocalFiles(retentionDate) {
    const uploadDir = path.join(__dirname, '../uploads');
    let deletedCount = 0;
    let freedSpace = 0;
    
    // 遍历所有子目录
    const subDirs = ['images', 'documents', 'videos', 'others'];
    
    for (const subDir of subDirs) {
      const dirPath = path.join(uploadDir, subDir);
      
      if (!fs.existsSync(dirPath)) {
        continue;
      }
      
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        // 跳过目录
        if (stats.isDirectory()) {
          continue;
        }
        
        // 检查文件是否过期
        if (stats.mtime < retentionDate) {
          try {
            const fileSize = stats.size;
            fs.unlinkSync(filePath);
            
            deletedCount++;
            freedSpace += fileSize;
            
            logger.debug(`[CLEANUP] 已删除过期文件: ${file}`, {
              path: filePath,
              size: `${(fileSize / 1024).toFixed(2)} KB`,
              modifiedTime: stats.mtime.toISOString()
            });
          } catch (error) {
            logger.error(`[CLEANUP] 删除文件失败: ${file}`, { 
              error: error.message,
              path: filePath
            });
          }
        }
      }
    }
    
    return { deletedCount, freedSpace };
  }

  /**
   * 清理云存储文件
   * @param {Date} retentionDate - 保留日期
   * @returns {Promise<Object>} 清理结果
   */
  async cleanupCloudFiles(retentionDate) {
    let deletedCount = 0;
    let freedSpace = 0;
    
    try {
      // 获取所有文件列表
      const subDirs = ['images', 'documents', 'videos', 'others'];
      
      for (const subDir of subDirs) {
        const files = await storageManager.listFiles(subDir);
        
        for (const file of files) {
          // 检查文件是否过期
          if (file.lastModified < retentionDate) {
            try {
              // 获取文件大小
              const fileInfo = await storageManager.getFileInfo(file.path);
              
              // 删除文件
              await storageManager.deleteFile(file.path);
              
              deletedCount++;
              freedSpace += fileInfo.size;
              
              logger.debug(`[CLEANUP] 已删除过期云文件: ${file.path}`, {
                size: `${(fileInfo.size / 1024).toFixed(2)} KB`,
                modifiedTime: file.lastModified.toISOString()
              });
            } catch (error) {
              logger.error(`[CLEANUP] 删除云文件失败: ${file.path}`, { 
                error: error.message
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error('[CLEANUP] 清理云文件失败', { error: error.message });
    }
    
    return { deletedCount, freedSpace };
  }

  /**
   * 手动执行文件清理
   * @param {Object} options - 清理选项
   * @returns {Promise<Object>} 清理结果
   */
  async manualCleanup(options = {}) {
    const retentionDays = options.retentionDays || this.config.retentionDays;
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);
    
    logger.info('[CLEANUP] 手动执行文件清理', {
      retentionDays,
      retentionDate: retentionDate.toISOString()
    });
    
    let result;
    
    if (this.config.type === 'local') {
      result = await this.cleanupLocalFiles(retentionDate);
    } else {
      result = await this.cleanupCloudFiles(retentionDate);
    }
    
    logger.info('[CLEANUP] 手动文件清理完成', {
      deletedCount: result.deletedCount,
      freedSpace: `${(result.freedSpace / 1024 / 1024).toFixed(2)} MB`
    });
    
    return result;
  }

  /**
   * 获取存储使用情况
   * @returns {Promise<Object>} 存储使用情况
   */
  async getStorageUsage() {
    try {
      const result = {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {
          images: { count: 0, size: 0 },
          documents: { count: 0, size: 0 },
          videos: { count: 0, size: 0 },
          others: { count: 0, size: 0 }
        },
        oldestFile: null,
        newestFile: null
      };
      
      if (this.config.type === 'local') {
        const uploadDir = path.join(__dirname, '../uploads');
        const subDirs = ['images', 'documents', 'videos', 'others'];
        
        for (const subDir of subDirs) {
          const dirPath = path.join(uploadDir, subDir);
          
          if (!fs.existsSync(dirPath)) {
            continue;
          }
          
          const files = fs.readdirSync(dirPath);
          
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            
            // 跳过目录
            if (stats.isDirectory()) {
              continue;
            }
            
            result.totalFiles++;
            result.totalSize += stats.size;
            result.fileTypes[subDir].count++;
            result.fileTypes[subDir].size += stats.size;
            
            // 更新最旧和最新文件
            if (!result.oldestFile || stats.mtime < result.oldestFile.mtime) {
              result.oldestFile = {
                path: file,
                mtime: stats.mtime,
                size: stats.size
              };
            }
            
            if (!result.newestFile || stats.mtime > result.newestFile.mtime) {
              result.newestFile = {
                path: file,
                mtime: stats.mtime,
                size: stats.size
              };
            }
          }
        }
      } else {
        // 云存储使用情况统计
        const subDirs = ['images', 'documents', 'videos', 'others'];
        
        for (const subDir of subDirs) {
          const files = await storageManager.listFiles(subDir);
          
          for (const file of files) {
            result.totalFiles++;
            result.totalSize += file.size;
            result.fileTypes[subDir].count++;
            result.fileTypes[subDir].size += file.size;
            
            // 更新最旧和最新文件
            if (!result.oldestFile || file.lastModified < result.oldestFile.mtime) {
              result.oldestFile = {
                path: file.path,
                mtime: file.lastModified,
                size: file.size
              };
            }
            
            if (!result.newestFile || file.lastModified > result.newestFile.mtime) {
              result.newestFile = {
                path: file.path,
                mtime: file.lastModified,
                size: file.size
              };
            }
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error('[CLEANUP] 获取存储使用情况失败', { error: error.message });
      throw error;
    }
  }
}

// 创建全局文件清理服务实例
const fileCleanupService = new FileCleanupService();

module.exports = {
  FileCleanupService,
  fileCleanupService
};