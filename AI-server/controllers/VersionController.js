/**
 * 版本控制器
 * 提供版本检查和更新功能
 */

const BaseController = require('./BaseController');
const { successResponse } = require('../middleware/response');
const versionManager = require('../config/versionManager');

class VersionController extends BaseController {
  constructor() {
    super();
    // 确保方法正确绑定到类实例
    this.getLatestVersion = this.getLatestVersion.bind(this);
    this.getVersionHistory = this.getVersionHistory.bind(this);
  }
  /**
   * 获取最新版本信息
   * GET /api/version/latest
   * 
   * 返回结果:
   * - 最新版本信息
   */
  async getLatestVersion(req, res, next) {
    try {
      const serverVersion = versionManager.getServerVersion();
      return successResponse(res, serverVersion, '获取最新版本信息成功');
    } catch (error) {
      logger.error('获取最新版本信息失败', { 
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }

  /**
   * 获取版本更新列表
   * GET /api/version/history
   * 
   * 返回结果:
   * - 版本更新历史列表
   */
  async getVersionHistory(req, res, next) {
    try {
      // 返回版本更新历史
      const versionHistory = [
        {
          version: '1.0.0',
          buildNumber: '2024.12.24.001',
          releaseDate: '2024-12-24',
          releaseNotes: '新增支付确认功能，优化系统性能，修复已知问题',
          type: 'feature'
        },
        {
          version: '0.9.0',
          buildNumber: '2024.12.01.001',
          releaseDate: '2024-12-01',
          releaseNotes: '初始版本发布，包含基本的财务管理功能',
          type: 'release'
        }
      ];

      return successResponse(res, { versions: versionHistory }, '获取版本历史成功');
    } catch (error) {
      logger.error('获取版本历史失败', { 
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }
}

module.exports = new VersionController();