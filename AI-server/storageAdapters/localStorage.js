/**
 * 本地存储适配器
 * 提供本地文件系统的存储功能
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class LocalStorageAdapter {
  constructor() {
    this.basePath = path.join(__dirname, '..', 'storage', 'uploads');
    this.ensureBaseDirectory();
  }

  /**
   * 确保基础目录存在
   */
  async ensureBaseDirectory() {
    try {
      await fs.access(this.basePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(this.basePath, { recursive: true });
        console.log('[LOCAL-STORAGE] 基础存储目录已创建:', this.basePath);
      } else {
        throw error;
      }
    }
  }

  /**
   * 上传文件
   * @param {Object} file - 文件对象
   * @param {string} relativePath - 相对路径
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(file, relativePath) {
    try {
      // 生成绝对路径
      const absolutePath = path.join(this.basePath, relativePath);
      
      // 确保目录存在
      const directory = path.dirname(absolutePath);
      await fs.mkdir(directory, { recursive: true });

      // 获取文件内容
      const fileContent = file.buffer || await this.readFileContent(file);
      
      // 写入文件
      await fs.writeFile(absolutePath, fileContent);

      // 生成文件信息
      const stats = await fs.stat(absolutePath);
      const fileInfo = {
        key: relativePath,
        path: absolutePath,
        size: stats.size,
        mimeType: file.mimetype || file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        id: uuidv4(),
        metadata: {
          originalName: file.originalname || file.name,
          encoding: file.encoding || 'utf-8'
        }
      };

      console.log('[LOCAL-STORAGE] 文件上传成功:', fileInfo);
      return fileInfo;

    } catch (error) {
      console.error('[LOCAL-STORAGE] 文件上传失败:', error);
      throw error;
    }
  }

  /**
   * 读取文件内容
   * @param {Object} file - 文件对象
   * @returns {Promise<Buffer>} 文件内容
   */
  async readFileContent(file) {
    if (file.buffer) {
      return file.buffer;
    }
    
    if (file.path) {
      return await fs.readFile(file.path);
    }
    
    if (file.stream) {
      const chunks = [];
      for await (const chunk of file.stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    }
    
    throw new Error('无法读取文件内容');
  }

  /**
   * 下载文件
   * @param {string} key - 文件键
   * @returns {Promise<Buffer>} 文件内容
   */
  async downloadFile(key) {
    try {
      const filePath = path.join(this.basePath, key);
      const content = await fs.readFile(filePath);
      
      console.log('[LOCAL-STORAGE] 文件下载成功:', key);
      return content;
      
    } catch (error) {
      console.error('[LOCAL-STORAGE] 文件下载失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param {string} key - 文件键
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteFile(key) {
    try {
      const filePath = path.join(this.basePath, key);
      await fs.unlink(filePath);
      
      console.log('[LOCAL-STORAGE] 文件删除成功:', key);
      return true;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn('[LOCAL-STORAGE] 文件不存在:', key);
        return true; // 文件不存在也视为删除成功
      }
      console.error('[LOCAL-STORAGE] 文件删除失败:', error);
      throw error;
    }
  }

  /**
   * 列出文件
   * @param {string} prefix - 前缀过滤
   * @returns {Promise<Array>} 文件列表
   */
  async listFiles(prefix = '') {
    try {
      const files = await this.listFilesRecursive(this.basePath, prefix);
      
      console.log(`[LOCAL-STORAGE] 文件列表获取成功 (${files.length} 个文件)`);
      return files;
      
    } catch (error) {
      console.error('[LOCAL-STORAGE] 获取文件列表失败:', error);
      throw error;
    }
  }

  /**
   * 递归列出文件
   * @param {string} dir - 目录路径
   * @param {string} prefix - 前缀
   * @returns {Promise<Array>} 文件列表
   */
  async listFilesRecursive(dir, prefix = '') {
    const files = [];
    
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.relative(this.basePath, fullPath);
        
        if (prefix && !relativePath.startsWith(prefix)) {
          continue;
        }
        
        if (item.isDirectory()) {
          const subFiles = await this.listFilesRecursive(fullPath, prefix);
          files.push(...subFiles);
        } else {
          const stats = await fs.stat(fullPath);
          files.push({
            key: relativePath,
            path: fullPath,
            size: stats.size,
            mimeType: this.getMimeType(item.name),
            uploadedAt: stats.birthtime.toISOString(),
            metadata: {
              originalName: item.name
            }
          });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    return files;
  }

  /**
   * 获取文件MIME类型
   * @param {string} filename - 文件名
   * @returns {string} MIME类型
   */
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
      '.zip': 'application/zip',
      '.rar': 'application/vnd.rar',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.csv': 'text/csv',
      '.sql': 'application/sql'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * 检查文件是否存在
   * @param {string} key - 文件键
   * @returns {Promise<boolean>} 是否存在
   */
  async fileExists(key) {
    try {
      const filePath = path.join(this.basePath, key);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取文件大小
   * @param {string} key - 文件键
   * @returns {Promise<number>} 文件大小
   */
  async getFileSize(key) {
    try {
      const filePath = path.join(this.basePath, key);
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      throw new Error(`无法获取文件大小: ${error.message}`);
    }
  }

  /**
   * 清理过期文件
   * @param {number} maxAge - 最大年龄（毫秒）
   * @returns {Promise<number>} 清理的文件数量
   */
  async cleanupExpiredFiles(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30天
    try {
      const files = await this.listFiles();
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const fileTime = new Date(file.uploadedAt).getTime();
        if (now - fileTime > maxAge) {
          try {
            await this.deleteFile(file.key);
            cleanedCount++;
          } catch (error) {
            console.warn(`[LOCAL-STORAGE] 清理文件失败: ${file.key}`, error.message);
          }
        }
      }

      console.log(`[LOCAL-STORAGE] 清理完成，删除了 ${cleanedCount} 个过期文件`);
      return cleanedCount;

    } catch (error) {
      console.error('[LOCAL-STORAGE] 清理过期文件失败:', error);
      throw error;
    }
  }
}

module.exports = LocalStorageAdapter;