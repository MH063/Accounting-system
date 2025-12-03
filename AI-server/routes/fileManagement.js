const express = require('express');
const FileController = require('../controllers/FileController');
const { authenticate } = require('../middleware/auth');
const { PermissionChecker, PERMISSIONS } = require('../config/permissions');

const router = express.Router();
const fileController = new FileController();

/**
 * @swagger
 * tags:
 *   name: FileManagement
 *   description: 文件管理API
 */

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     tags: [FileManagement]
 *     summary: 上传文件
 *     description: 支持单文件和批量文件上传，支持图片自动优化
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 文件数组（最多10个）
 *               quality:
 *                 type: integer
 *                 description: 图片压缩质量（1-100）
 *                 default: 80
 *               format:
 *                 type: string
 *                 enum: [auto, jpeg, png, webp, avif]
 *                 description: 输出格式
 *                 default: auto
 *               tags:
 *                 type: string
 *                 description: 文件标签（JSON数组格式）
 *               metadata:
 *                 type: string
 *                 description: 文件元数据（JSON格式）
 *     responses:
 *       200:
 *         description: 上传成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
// 文件上传路由 - 真实实现
router.post('/upload', 
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.FILE_MANAGE),
  (req, res, next) => {
    // 使用fileController的multer中间件
    fileController.getUploadMiddleware()(req, res, next);
  },
  (req, res) => {
    // 调用fileController的uploadFiles方法
    fileController.uploadFiles(req, res);
  }
);

/**
 * @swagger
 * /api/files/{fileId}:
 *   get:
 *     tags: [FileManagement]
 *     summary: 获取文件信息
 *     parameters:
 *       - name: fileId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 文件ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 文件不存在
 */
router.get('/:fileId',
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.FILE_VIEW),
  fileController.getFileInfo.bind(fileController)
);

/**
 * @swagger
 * /api/files/{fileId}:
 *   delete:
 *     tags: [FileManagement]
 *     summary: 删除文件
 *     parameters:
 *       - name: fileId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 文件ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 文件不存在
 */
router.delete('/:fileId',
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.FILE_MANAGE),
  fileController.deleteFile.bind(fileController)
);

/**
 * @swagger
 * /api/files/batch-delete:
 *   post:
 *     tags: [FileManagement]
 *     summary: 批量删除文件
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 文件ID数组
 *     responses:
 *       200:
 *         description: 批量删除完成
 */
router.post('/batch-delete',
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.FILE_MANAGE),
  fileController.batchDeleteFiles.bind(fileController)
);

/**
 * @swagger
 * /api/files:
 *   get:
 *     tags: [FileManagement]
 *     summary: 列出文件
 *     parameters:
 *       - name: path
 *         in: query
 *         schema:
 *           type: string
 *         description: 文件路径
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 100
 *         description: 每页数量
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 偏移量
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - name: fileType
 *         in: query
 *         schema:
 *           type: string
 *         description: 文件类型过滤
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [name, size, lastModified]
 *           default: lastModified
 *         description: 排序字段
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/',
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.FILE_VIEW),
  fileController.listFiles.bind(fileController)
);

/**
 * @swagger
 * /api/files/stats:
 *   get:
 *     tags: [FileManagement]
 *     summary: 获取存储统计信息
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/stats',
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.FILE_VIEW),
  fileController.getStorageStats.bind(fileController)
);

/**
 * @swagger
 * /api/files/cleanup:
 *   post:
 *     tags: [FileManagement]
 *     summary: 清理临时文件
 *     responses:
 *       200:
 *         description: 清理完成
 */
router.post('/cleanup',
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.FILE_MANAGE),
  fileController.cleanupTempFiles.bind(fileController)
);

/**
 * @swagger
 * /api/files/types:
 *   get:
 *     tags: [FileManagement]
 *     summary: 获取支持的文件类型
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/types',
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.FILE_VIEW),
  fileController.getSupportedFileTypes.bind(fileController)
);

module.exports = router;