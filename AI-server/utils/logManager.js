const fs = require('fs');
const path = require('path');
const { logger } = require('../config/logger');

/**
 * 日志管理器
 * 提供日志格式标准化、检索和清理功能
 */
class LogManager {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 获取日志文件列表
   * @returns {Array} 日志文件列表
   */
  getLogFiles() {
    try {
      return fs.readdirSync(this.logDir).filter(file => file.endsWith('.log'));
    } catch (error) {
      logger.error(`[LOG_MANAGER] 获取日志文件列表失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 搜索日志
   * @param {Object} options - 搜索选项
   * @param {string} options.level - 日志级别 (info, warn, error, debug, audit, security)
   * @param {string} options.keyword - 关键词
   * @param {string} options.startDate - 开始日期 (YYYY-MM-DD)
   * @param {string} options.endDate - 结束日期 (YYYY-MM-DD)
   * @param {number} options.limit - 返回结果数量限制
   * @returns {Array} 匹配的日志条目
   */
  searchLogs(options = {}) {
    const {
      level = null,
      keyword = null,
      startDate = null,
      endDate = null,
      limit = 100
    } = options;

    try {
      const logFiles = this.getLogFiles();
      const results = [];

      // 解析日期
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999); // 包含整天

      // 按时间倒序处理日志文件
      logFiles.sort().reverse();

      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 处理多行JSON对象
        // 将内容分割为可能的日志条目
        const possibleLogs = [];
        let currentLog = '';
        let braceCount = 0;
        let inJson = false;
        
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 检查是否是JSON对象的开始
          if (trimmedLine.startsWith('{') && !inJson) {
            inJson = true;
            currentLog = line;
            braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
          } 
          // 如果已经在JSON对象中
          else if (inJson) {
            currentLog += '\n' + line;
            braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
          }
          // 检查是否是普通日志行（非JSON）
          else if (trimmedLine && !trimmedLine.startsWith('{')) {
            possibleLogs.push(line);
          }
          
          // 如果JSON对象结束
          if (inJson && braceCount === 0) {
            possibleLogs.push(currentLog);
            inJson = false;
            currentLog = '';
          }
        }
        
        // 处理可能的日志条目
        for (const logLine of possibleLogs) {
          if (!logLine.trim()) continue;
          
          try {
            const logEntry = this.parseLogLine(logLine);
            if (!logEntry) continue;

            // 级别过滤
            if (level && logEntry.level !== level) continue;

            // 关键词过滤 - 在原始行和解析后的消息中搜索
            if (keyword) {
              const searchInOriginal = logLine.includes(keyword);
              const searchInParsed = logEntry.message && logEntry.message.includes(keyword);
              if (!searchInOriginal && !searchInParsed) continue;
            }

            // 日期范围过滤
            if (start && logEntry.timestamp < start) continue;
            if (end && logEntry.timestamp > end) continue;

            results.push({
              file,
              line: logLine,
              parsed: logEntry
            });

            // 限制结果数量
            if (results.length >= limit) break;
          } catch (parseError) {
            // 忽略解析失败的行
          }
        }

        if (results.length >= limit) break;
      }

      return results;
    } catch (error) {
      logger.error(`[LOG_MANAGER] 搜索日志失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 解析日志行
   * @param {string} line - 日志行
   * @returns {Object|null} 解析后的日志对象
   */
  parseLogLine(line) {
    try {
      // 1. 尝试解析标准JSON格式
      try {
        const logEntry = JSON.parse(line);
        if (logEntry.timestamp && logEntry.level) {
          return {
            timestamp: new Date(logEntry.timestamp),
            level: logEntry.level,
            message: logEntry.message || '',
            meta: { ...logEntry, timestamp: undefined, level: undefined, message: undefined }
          };
        }
      } catch (e) {
        // 继续尝试其他格式
      }

      // 2. 尝试解析多行JSON格式（处理键名无引号的JavaScript对象）
      try {
        // 首先将多行合并为单行
        const singleLine = line.replace(/\n/g, ' ').trim();
        
        // 处理键名无引号的JavaScript对象格式
        const jsObjectStr = singleLine.replace(/(\w+):/g, '"$1":');
        const logEntry = JSON.parse(jsObjectStr);
        if (logEntry.timestamp && logEntry.level) {
          return {
            timestamp: new Date(logEntry.timestamp),
            level: logEntry.level,
            message: logEntry.message || '',
            meta: { ...logEntry, timestamp: undefined, level: undefined, message: undefined }
          };
        }
      } catch (e) {
        // 继续尝试其他格式
      }

      // 3. 尝试从包含JavaScript对象格式的行中提取JSON
      if (line.includes('service:') || line.includes('level:') || line.includes('message:')) {
        try {
          // 提取对象部分
          const objectMatch = line.match(/\{[^}]*\}/);
          if (objectMatch) {
            let objStr = objectMatch[0];
            // 处理多行对象
            objStr = objStr.replace(/\n/g, ' ');
            // 处理键名无引号
            objStr = objStr.replace(/(\w+):/g, '"$1":');
            
            const logEntry = JSON.parse(objStr);
            if (logEntry.timestamp && logEntry.level) {
              return {
                timestamp: new Date(logEntry.timestamp),
                level: logEntry.level,
                message: logEntry.message || '',
                meta: { ...logEntry, timestamp: undefined, level: undefined, message: undefined }
              };
            }
          }
        } catch (e) {
          // 继续尝试其他格式
        }
      }

      // 4. 尝试解析其他格式
      // 例如: "2025-11-19 20:54:18 [info]: 这是一条测试信息日志"
      const timestampRegex = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+\[(\w+)\]:\s*(.+)$/;
      const match = line.match(timestampRegex);
      if (match) {
        const [, timestamp, level, message] = match;
        return {
          timestamp: new Date(timestamp),
          level: level.toLowerCase(),
          message,
          meta: {}
        };
      }

      // 5. 尝试从日志行中提取时间戳
      const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
      if (timestampMatch) {
        const timestamp = new Date(timestampMatch[1]);
        // 尝试提取日志级别
        const levelMatch = line.match(/\[(\w+)\]/i);
        const level = levelMatch ? levelMatch[1].toLowerCase() : 'info';
        
        return {
          timestamp,
          level,
          message: line,
          meta: {}
        };
      }

      // 如果无法解析，返回null
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 清理旧日志文件
   * @param {number} days - 保留天数，默认90天
   * @returns {Object} 清理结果
   */
  cleanupOldLogs(days = 90) {
    try {
      const logFiles = this.getLogFiles();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let deletedCount = 0;
      let deletedSize = 0;

      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          deletedSize += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info(`[LOG_MANAGER] 已删除旧日志文件: ${file}`);
        }
      }

      return {
        deletedCount,
        deletedSize: this.formatBytes(deletedSize),
        retentionDays: days
      };
    } catch (error) {
      logger.error(`[LOG_MANAGER] 清理旧日志失败: ${error.message}`);
      return {
        error: error.message
      };
    }
  }

  /**
   * 格式化字节数
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的字符串
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取日志统计信息
   * @returns {Object} 日志统计信息
   */
  getLogStats() {
    try {
      const logFiles = this.getLogFiles();
      let totalSize = 0;
      let totalCount = 0;
      const levelCounts = {
        info: 0,
        warn: 0,
        error: 0,
        debug: 0,
        audit: 0,
        security: 0
      };

      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        totalCount += lines.length;

        for (const line of lines) {
          const logEntry = this.parseLogLine(line);
          if (logEntry && levelCounts.hasOwnProperty(logEntry.level)) {
            levelCounts[logEntry.level]++;
          }
        }
      }

      return {
        fileCount: logFiles.length,
        totalSize: this.formatBytes(totalSize),
        totalEntries: totalCount,
        levelCounts
      };
    } catch (error) {
      logger.error(`[LOG_MANAGER] 获取日志统计失败: ${error.message}`);
      return {
        error: error.message
      };
    }
  }
}

// 创建单例实例
const logManager = new LogManager();

module.exports = {
  logManager,
  LogManager
};