const express = require('express');
const TaskController = require('../controllers/TaskController');
const { requirePermission } = require('../config/permissions');

const router = express.Router();

/**
 * @swagger
 * /api/tasks/status:
 *   get:
 *     summary: 获取定时任务状态
 *     tags: [任务管理]
 *     responses:
 *       200:
 *         description: 任务状态获取成功
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: object
 *                   description: 各任务状态
 *                 stats:
 *                   type: object
 *                   description: 执行统计
 *                 totalTasks:
 *                   type: number
 *       500:
 *         description: 获取状态失败
 */
router.get('/status', requirePermission('manage_tasks'), TaskController.getTaskStatus);

/**
 * @swagger
 * /api/tasks/history:
 *   get:
 *     summary: 获取任务执行历史
 *     tags: [任务管理]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: 返回记录数量限制
 *       - in: query
 *         name: taskName
 *         schema:
 *           type: string
 *         description: 特定任务名称过滤
 *     responses:
 *       200:
 *         description: 历史记录获取成功
 */
router.get('/history', requirePermission('view_tasks'), TaskController.getTaskHistory);

/**
 * @swagger
 * /api/tasks/available:
 *   get:
 *     summary: 获取可用任务列表
 *     tags: [任务管理]
 *     responses:
 *       200:
 *         description: 可用任务列表
 */
router.get('/available', requirePermission('view_tasks'), TaskController.getAvailableTasks);

/**
 * @swagger
 * /api/tasks/stats:
 *   get:
 *     summary: 获取任务执行统计
 *     tags: [任务管理]
 *     responses:
 *       200:
 *         description: 任务统计信息
 */
router.get('/stats', requirePermission('view_tasks'), TaskController.getTaskStats);

/**
 * @swagger
 * /api/tasks/start-all:
 *   post:
 *     summary: 启动所有定时任务
 *     tags: [任务管理]
 *     responses:
 *       200:
 *         description: 所有任务已启动
 */
router.post('/start-all', requirePermission('manage_tasks'), TaskController.startAllTasks);

/**
 * @swagger
 * /api/tasks/stop-all:
 *   post:
 *     summary: 停止所有定时任务
 *     tags: [任务管理]
 *     responses:
 *       200:
 *         description: 所有任务已停止
 */
router.post('/stop-all', requirePermission('manage_tasks'), TaskController.stopAllTasks);

/**
 * @swagger
 * /api/tasks/start/{taskName}:
 *   post:
 *     summary: 启动指定任务
 *     tags: [任务管理]
 *     parameters:
 *       - in: path
 *         name: taskName
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务名称
 *     responses:
 *       200:
 *         description: 任务已启动
 *       400:
 *         description: 任务名称无效
 *       500:
 *         description: 启动失败
 */
router.post('/start/:taskName', requirePermission('manage_tasks'), TaskController.startSpecificTask);

/**
 * @swagger
 * /api/tasks/stop/{taskName}:
 *   post:
 *     summary: 停止指定任务
 *     tags: [任务管理]
 *     parameters:
 *       - in: path
 *         name: taskName
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务名称
 *     responses:
 *       200:
 *         description: 任务已停止
 *       400:
 *         description: 任务名称无效
 *       500:
 *         description: 停止失败
 */
router.post('/stop/:taskName', requirePermission('manage_tasks'), TaskController.stopSpecificTask);

/**
 * @swagger
 * /api/tasks/restart/{taskName}:
 *   post:
 *     summary: 重启指定任务
 *     tags: [任务管理]
 *     parameters:
 *       - in: path
 *         name: taskName
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务名称
 *     responses:
 *       200:
 *         description: 任务已重启
 *       400:
 *         description: 任务名称无效
 *       500:
 *         description: 重启失败
 */
router.post('/restart/:taskName', requirePermission('manage_tasks'), TaskController.restartSpecificTask);

/**
 * @swagger
 * /api/tasks/execute/{taskName}:
 *   post:
 *     summary: 手动执行指定任务
 *     tags: [任务管理]
 *     parameters:
 *       - in: path
 *         name: taskName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [logCleanup, databaseBackup, queueCleanup, fileOptimization, healthCheck]
 *         description: 任务名称
 *     responses:
 *       200:
 *         description: 任务执行完成
 *       400:
 *         description: 任务名称无效
 *       500:
 *         description: 执行失败
 */
router.post('/execute/:taskName', requirePermission('execute_tasks'), TaskController.executeSpecificTask);

module.exports = router;