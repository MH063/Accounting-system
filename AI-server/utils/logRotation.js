/**
 * 日志轮转和清理服务
 * 提供自动日志轮转、压缩和清理功能
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const winston = require('winston');

// 创建一个简单的logger实例，专门用于日志轮转
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      )
    })
  ]
});

// 将回调函数转换为Promise
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);

/**
 * 日志轮转配置
 */
const LOG_CONFIG = {
  // 日志目录
  logDir: path.join(process.cwd(), 'logs'),
  // 日志文件轮转大小（字节）
  maxSize: process.env.LOG_MAX_SIZE ? parseInt(process.env.LOG_MAX_SIZE) : 10 * 1024 * 1024, // 默认10MB
  // 保留的日志文件数量
  maxFiles: process.env.LOG_MAX_FILES ? parseInt(process.env.LOG_MAX_FILES) : 30,
  // 压缩的日志文件数量
  maxCompressedFiles: process.env.LOG_MAX_COMPRESSED_FILES ? parseInt(process.env.LOG_MAX_COMPRESSED_FILES) : 100,
  // 日志文件类型和保留策略
  logTypes: {
    error: { maxSize: 5 * 1024 * 1024, maxFiles: 10, maxCompressedFiles: 50 }, // 5MB, 保留10个，压缩50个
    combined: { maxSize: 10 * 1024 * 1024, maxFiles: 10, maxCompressedFiles: 50 }, // 10MB, 保留10个，压缩50个
    audit: { maxSize: 20 * 1024 * 1024, maxFiles: 20, maxCompressedFiles: 100 }, // 20MB, 保留20个，压缩100个
    security: { maxSize: 20 * 1024 * 1024, maxFiles: 20, maxCompressedFiles: 100 }, // 20MB, 保留20个，压缩100个
    access: { maxSize: 50 * 1024 * 1024, maxFiles: 5, maxCompressedFiles: 30 } // 50MB, 保留5个，压缩30个
  },
  // 清理间隔（毫秒）
  cleanupInterval: process.env.LOG_CLEANUP_INTERVAL ? parseInt(process.env.LOG_CLEANUP_INTERVAL) : 24 * 60 * 60 * 1000, // 默认24小时
  // 压缩间隔（毫秒）
  compressionInterval: process.env.LOG_COMPRESSION_INTERVAL ? parseInt(process.env.LOG_COMPRESSION_INTERVAL) : 6 * 60 * 60 * 1000 // 默认6小时
};

/**
 * 确保日志目录存在
 */
const ensureLogDir = async () => {
  try {
    await stat(LOG_CONFIG.logDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      fs.mkdirSync(LOG_CONFIG.logDir, { recursive: true });
      logger.info(`[LOG_ROTATION] 创建日志目录: ${LOG_CONFIG.logDir}`);
    } else {
      throw error;
    }
  }
};

/**
 * 获取日志文件大小
 * @param {string} filePath - 文件路径
 * @returns {number} 文件大小（字节）
 */
const getFileSize = async (filePath) => {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return 0;
    }
    throw error;
  }
};

/**
 * 获取匹配的日志文件列表
 * @param {string} baseName - 基础文件名（不含扩展名）
 * @returns {Array} 文件列表
 */
const getLogFiles = async (baseName) => {
  try {
    const files = await readdir(LOG_CONFIG.logDir);
    return files
      .filter(file => file.startsWith(baseName))
      .map(file => path.join(LOG_CONFIG.logDir, file));
  } catch (error) {
    logger.error(`[LOG_ROTATION] 获取日志文件列表失败: ${error.message}`);
    return [];
  }
};

/**
 * 轮转日志文件
 * @param {string} logFile - 日志文件路径
 * @param {Object} config - 日志配置
 */
const rotateLogFile = async (logFile, config) => {
  try {
    const fileSize = await getFileSize(logFile);
    
    // 如果文件大小未超过限制，不需要轮转
    if (fileSize < config.maxSize) {
      return false;
    }
    
    const baseName = path.basename(logFile, '.log');
    const logFiles = await getLogFiles(baseName);
    
    // 获取现有轮转文件的编号
    const rotatedFiles = logFiles
      .filter(file => file !== logFile && !file.endsWith('.gz'))
      .map(file => {
        const match = file.match(new RegExp(`${baseName}-(\\d+)\\.log$`));
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0)
      .sort((a, b) => b - a);
    
    // 确定下一个轮转文件编号
    const nextNum = rotatedFiles.length > 0 ? rotatedFiles[0] + 1 : 1;
    
    // 如果轮转文件数量超过限制，删除最旧的文件
    if (nextNum > config.maxFiles) {
      const oldestFile = path.join(LOG_CONFIG.logDir, `${baseName}-${nextNum - config.maxFiles}.log`);
      try {
        await unlink(oldestFile);
        logger.info(`[LOG_ROTATION] 删除旧日志文件: ${oldestFile}`);
      } catch (error) {
        logger.error(`[LOG_ROTATION] 删除旧日志文件失败: ${error.message}`);
      }
    }
    
    // 重命名当前日志文件
    const rotatedFile = path.join(LOG_CONFIG.logDir, `${baseName}-${nextNum}.log`);
    await rename(logFile, rotatedFile);
    logger.info(`[LOG_ROTATION] 轮转日志文件: ${logFile} -> ${rotatedFile}`);
    
    return true;
  } catch (error) {
    logger.error(`[LOG_ROTATION] 轮转日志文件失败: ${error.message}`);
    return false;
  }
};

/**
 * 压缩日志文件
 * @param {string} logFile - 日志文件路径
 */
const compressLogFile = async (logFile) => {
  try {
    // 如果文件已经是压缩文件，跳过
    if (logFile.endsWith('.gz')) {
      return false;
    }
    
    // 如果文件是当前活跃的日志文件，跳过
    const baseName = path.basename(logFile, '.log');
    if (!logFile.includes(`${baseName}-`)) {
      return false;
    }
    
    // 读取原始文件内容
    const fileContent = fs.readFileSync(logFile);
    
    // 压缩内容
    const compressedContent = await gzip(fileContent);
    
    // 写入压缩文件
    const compressedFile = `${logFile}.gz`;
    fs.writeFileSync(compressedFile, compressedContent);
    
    // 删除原始文件
    await unlink(logFile);
    
    logger.info(`[LOG_ROTATION] 压缩日志文件: ${logFile} -> ${compressedFile}`);
    return true;
  } catch (error) {
    logger.error(`[LOG_ROTATION] 压缩日志文件失败: ${error.message}`);
    return false;
  }
};

/**
 * 清理旧的压缩日志文件
 * @param {string} baseName - 基础文件名
 * @param {Object} config - 日志配置
 */
const cleanupOldCompressedFiles = async (baseName, config) => {
  try {
    const compressedFiles = await getLogFiles(`${baseName}-`);
    
    // 只处理压缩文件
    const gzFiles = compressedFiles
      .filter(file => file.endsWith('.gz'))
      .sort((a, b) => {
        // 从文件名中提取时间戳或编号，按时间排序
        const aMatch = a.match(/-(\d+)\.log\.gz$/);
        const bMatch = b.match(/-(\d+)\.log\.gz$/);
        
        if (aMatch && bMatch) {
          return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        }
        
        return a.localeCompare(b);
      });
    
    // 如果压缩文件数量超过限制，删除最旧的文件
    if (gzFiles.length > config.maxCompressedFiles) {
      const filesToDelete = gzFiles.slice(0, gzFiles.length - config.maxCompressedFiles);
      
      for (const file of filesToDelete) {
        try {
          await unlink(file);
          logger.info(`[LOG_ROTATION] 删除旧压缩日志文件: ${file}`);
        } catch (error) {
          logger.error(`[LOG_ROTATION] 删除旧压缩日志文件失败: ${error.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`[LOG_ROTATION] 清理旧压缩日志文件失败: ${error.message}`);
  }
};

/**
 * 执行日志轮转和清理
 */
const performLogRotation = async () => {
  logger.info('[LOG_ROTATION] 开始执行日志轮转和清理');
  
  try {
    // 确保日志目录存在
    await ensureLogDir();
    
    // 处理每种类型的日志文件
    for (const [logType, config] of Object.entries(LOG_CONFIG.logTypes)) {
      const logFile = path.join(LOG_CONFIG.logDir, `${logType}.log`);
      
      // 检查文件是否存在
      try {
        await stat(logFile);
      } catch (error) {
        if (error.code === 'ENOENT') {
          continue; // 文件不存在，跳过
        }
        throw error;
      }
      
      // 轮转日志文件
      const rotated = await rotateLogFile(logFile, config);
      
      // 如果没有轮转，继续处理下一种类型
      if (!rotated) {
        continue;
      }
      
      // 清理旧的压缩文件
      await cleanupOldCompressedFiles(logType, config);
    }
    
    logger.info('[LOG_ROTATION] 日志轮转和清理完成');
  } catch (error) {
    logger.error(`[LOG_ROTATION] 日志轮转和清理失败: ${error.message}`);
  }
};

/**
 * 压缩旧的轮转日志文件
 */
const compressOldLogFiles = async () => {
  logger.info('[LOG_ROTATION] 开始压缩旧的轮转日志文件');
  
  try {
    // 确保日志目录存在
    await ensureLogDir();
    
    // 处理每种类型的日志文件
    for (const [logType, config] of Object.entries(LOG_CONFIG.logTypes)) {
      // 获取所有轮转文件（非压缩）
      const logFiles = await getLogFiles(`${logType}-`);
      const uncompressedFiles = logFiles.filter(file => !file.endsWith('.gz'));
      
      // 压缩所有轮转文件
      for (const file of uncompressedFiles) {
        await compressLogFile(file);
      }
      
      // 清理旧的压缩文件
      await cleanupOldCompressedFiles(logType, config);
    }
    
    logger.info('[LOG_ROTATION] 旧的轮转日志文件压缩完成');
  } catch (error) {
    logger.error(`[LOG_ROTATION] 压缩旧的轮转日志文件失败: ${error.message}`);
  }
};

/**
 * 获取日志统计信息
 * @returns {Object} 日志统计信息
 */
const getLogStats = async () => {
  try {
    const stats = {};
    
    // 确保日志目录存在
    await ensureLogDir();
    
    // 获取每种类型的日志统计
    for (const logType of Object.keys(LOG_CONFIG.logTypes)) {
      const logFile = path.join(LOG_CONFIG.logDir, `${logType}.log`);
      const logFiles = await getLogFiles(logType);
      
      let totalSize = 0;
      let fileCount = 0;
      let compressedSize = 0;
      let compressedCount = 0;
      
      // 计算文件大小和数量
      for (const file of logFiles) {
        try {
          const fileStat = await stat(file);
          totalSize += fileStat.size;
          fileCount++;
          
          if (file.endsWith('.gz')) {
            compressedSize += fileStat.size;
            compressedCount++;
          }
        } catch (error) {
          // 忽略文件不存在的错误
        }
      }
      
      stats[logType] = {
        currentFileSize: await getFileSize(logFile),
        totalSize,
        fileCount,
        compressedSize,
        compressedCount,
        uncompressedCount: fileCount - compressedCount
      };
    }
    
    return stats;
  } catch (error) {
    logger.error(`[LOG_ROTATION] 获取日志统计信息失败: ${error.message}`);
    return {};
  }
};

/**
 * 启动日志轮转和清理服务
 */
const startLogRotationService = () => {
  logger.info('[LOG_ROTATION] 启动日志轮转和清理服务');
  
  // 立即执行一次轮转和清理
  performLogRotation();
  
  // 设置定时任务，定期执行轮转和清理
  setInterval(performLogRotation, LOG_CONFIG.cleanupInterval);
  
  // 设置定时任务，定期压缩旧文件
  setInterval(compressOldLogFiles, LOG_CONFIG.compressionInterval);
  
  logger.info(`[LOG_ROTATION] 日志轮转服务已启动，清理间隔: ${LOG_CONFIG.cleanupInterval / 1000 / 60 / 60}小时，压缩间隔: ${LOG_CONFIG.compressionInterval / 1000 / 60 / 60}小时`);
};

module.exports = {
  performLogRotation,
  compressOldLogFiles,
  getLogStats,
  startLogRotationService,
  LOG_CONFIG
};