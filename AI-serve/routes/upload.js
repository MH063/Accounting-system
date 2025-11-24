/**
 * 文件上传路由
 * 处理文件上传相关功能
 */

const express = require('express');
const path = require('path');
const { uploadSingle, uploadMultiple, getFileInfo, getFilesInfo } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');
const { responseWrapper } = require('../middleware/response');
const { strictRateLimit } = require('../middleware/security');
const logger = require('../config/logger');

const router = express.Router();

// 设置静态文件服务
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * 单文件上传
 * POST /api/upload/single
 */
router.post('/single', strictRateLimit({ 
  windowMs: 60000, // 1分钟
  maxRequests: 3,  // 每分钟最多3次
  skipSuccessfulRequests: true 
}), uploadSingle('file', { enable: true }), responseWrapper(asyncHandler(async (req, res) => {
  // 记录文件上传尝试
  logger.audit(req, '单文件上传尝试', { 
    timestamp: new Date().toISOString()
  });
  
  if (!req.file) {
    logger.info('单文件上传失败: 没有文件被上传');
    logger.security(req, '单文件上传失败: 没有文件被上传', { 
      reason: '请求中缺少文件'
    });
    return res.status(400).json({
      success: false,
      message: '没有文件被上传'
    });
  }

  const fileInfo = getFileInfo(req.file);
  
  // 添加压缩信息到响应
  const response = {
    ...fileInfo,
    compressed: req.file.compressed || false,
    compressionResult: req.file.compressionResult || null
  };
  
  logger.info('单文件上传成功', { 
    filename: fileInfo.filename, 
    size: fileInfo.size,
    mimetype: fileInfo.mimetype,
    hash: fileInfo.hash,
    compressed: response.compressed
  });
  
  logger.audit(req, '单文件上传成功', { 
    filename: fileInfo.filename,
    size: fileInfo.size,
    mimetype: fileInfo.mimetype,
    hash: fileInfo.hash,
    compressed: response.compressed,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: '文件上传成功',
    data: {
      file: response
    }
  });
})));

/**
 * 单文件上传（无压缩）
 * POST /api/upload/single/no-compress
 */
router.post('/single/no-compress', strictRateLimit({ 
  windowMs: 60000, // 1分钟
  maxRequests: 3,  // 每分钟最多3次
  skipSuccessfulRequests: true 
}), uploadSingle('file', { enable: false }), responseWrapper(asyncHandler(async (req, res) => {
  // 记录文件上传尝试
  logger.audit(req, '单文件上传尝试（无压缩）', { 
    timestamp: new Date().toISOString()
  });
  
  if (!req.file) {
    logger.api('单文件上传失败: 没有文件被上传');
    logger.security(req, '单文件上传失败: 没有文件被上传', { 
      reason: '请求中缺少文件'
    });
    return res.status(400).json({
      success: false,
      message: '没有文件被上传'
    });
  }

  const fileInfo = getFileInfo(req.file);
  
  logger.info('单文件上传成功（无压缩）', { 
    filename: fileInfo.filename, 
    size: fileInfo.size,
    mimetype: fileInfo.mimetype,
    hash: fileInfo.hash
  });
  
  logger.audit(req, '单文件上传成功（无压缩）', { 
    filename: fileInfo.filename,
    size: fileInfo.size,
    mimetype: fileInfo.mimetype,
    hash: fileInfo.hash,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: '文件上传成功',
    data: {
      file: fileInfo
    }
  });
})));

/**
 * 多文件上传
 * POST /api/upload/multiple
 */
router.post('/multiple', uploadMultiple('files', 5, { enable: true }), responseWrapper(asyncHandler(async (req, res) => {
  // 记录多文件上传尝试
  logger.audit(req, '多文件上传尝试', { 
    timestamp: new Date().toISOString()
  });
  
  if (!req.files || req.files.length === 0) {
    logger.info('多文件上传失败: 没有文件被上传');
    logger.security(req, '多文件上传失败: 没有文件被上传', { 
      reason: '请求中缺少文件'
    });
    return res.status(400).json({
      success: false,
      message: '没有文件被上传'
    });
  }

  const filesInfo = getFilesInfo(req.files);
  const totalSize = filesInfo.reduce((sum, file) => sum + file.size, 0);
  
  // 添加压缩信息到响应
  const filesWithCompressionInfo = req.files.map(file => {
    const fileInfo = getFileInfo(file);
    return {
      ...fileInfo,
      compressed: file.compressed || false,
      compressionResult: file.compressionResult || null
    };
  });
  
  logger.info('多文件上传成功', { 
    count: filesInfo.length,
    totalSize
  });
  
  logger.audit(req, '多文件上传成功', { 
    count: filesInfo.length,
    totalSize,
    files: filesWithCompressionInfo.map(file => ({
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      hash: file.hash,
      compressed: file.compressed
    })),
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: '文件上传成功',
    data: {
      files: filesWithCompressionInfo,
      count: filesInfo.length
    }
  });
})));

/**
 * 多文件上传（无压缩）
 * POST /api/upload/multiple/no-compress
 */
router.post('/multiple/no-compress', uploadMultiple('files', 5, { enable: false }), responseWrapper(asyncHandler(async (req, res) => {
  // 记录多文件上传尝试
  logger.audit(req, '多文件上传尝试（无压缩）', { 
    timestamp: new Date().toISOString()
  });
  
  if (!req.files || req.files.length === 0) {
    logger.api('多文件上传失败: 没有文件被上传');
    logger.security(req, '多文件上传失败: 没有文件被上传', { 
      reason: '请求中缺少文件'
    });
    return res.status(400).json({
      success: false,
      message: '没有文件被上传'
    });
  }

  const filesInfo = getFilesInfo(req.files);
  const totalSize = filesInfo.reduce((sum, file) => sum + file.size, 0);
  
  logger.info('多文件上传成功（无压缩）', { 
    count: filesInfo.length,
    totalSize
  });
  
  logger.audit(req, '多文件上传成功（无压缩）', { 
    count: filesInfo.length,
    totalSize,
    files: filesInfo.map(file => ({
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      hash: file.hash
    })),
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: '文件上传成功',
    data: {
      files: filesInfo,
      count: filesInfo.length
    }
  });
})));

/**
 * 获取文件信息
 * GET /api/upload/info/:filename
 */
router.get('/info/:filename', responseWrapper(asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  // 记录文件信息查询尝试
  logger.audit(req, '文件信息查询尝试', { 
    filename,
    timestamp: new Date().toISOString()
  });
  
  // 这里可以实现从数据库获取文件信息的逻辑
  // 目前返回基本信息
  logger.audit(req, '文件信息查询成功', { 
    filename,
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '获取文件信息成功',
    data: {
      filename,
      url: `/uploads/${filename}`
    }
  });
})));

module.exports = router;