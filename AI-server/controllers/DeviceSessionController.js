/**
 * 设备会话控制器
 * 处理用户登录设备会话的管理，包括获取会话列表和撤销会话
 */

const BaseController = require('./BaseController');
const UserService = require('../services/UserService');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../middleware/response');

class DeviceSessionController extends BaseController {
  constructor() {
    super();
    this.userService = new UserService();
  }

  /**
   * 获取当前用户的所有活跃设备会话
   * GET /api/device-sessions
   */
  async getSessions(req, res, next) {
    try {
      const userId = req.user.id;
      // 从 Authorization 头中获取当前 token
      const authHeader = req.headers['authorization'];
      const currentToken = authHeader && authHeader.split(' ')[1];
      
      logger.info('[DeviceSessionController] 获取设备会话列表', { userId });
      
      const sessions = await this.userService.getUserSessions(userId);
      
      // 处理会话数据，格式化输出
      const formattedSessions = sessions.map(session => ({
        id: session.id,
        deviceInfo: typeof session.device_info === 'string' ? JSON.parse(session.device_info) : session.device_info,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        status: session.status,
        expiresAt: session.expires_at ? (typeof session.expires_at === 'object' && session.expires_at.toISOString ? session.expires_at.toISOString() : session.expires_at.toString()) : null,
        createdAt: session.created_at ? (typeof session.created_at === 'object' && session.created_at.toISOString ? session.created_at.toISOString() : session.created_at.toString()) : new Date().toISOString(),
        lastAccessedAt: session.last_accessed_at ? (typeof session.last_accessed_at === 'object' && session.last_accessed_at.toISOString ? session.last_accessed_at.toISOString() : session.last_accessed_at.toString()) : new Date().toISOString(),
        isCurrent: currentToken === session.session_token,
        hasIpConflict: !!session.has_ip_conflict,
        deviceId: session.device_id
      }));

      return successResponse(res, {
        sessions: formattedSessions,
        count: formattedSessions.length
      }, '获取设备会话成功');
    } catch (error) {
      logger.error('[DeviceSessionController] 获取设备会话失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 撤销指定的设备会话
   * DELETE /api/device-sessions/:id
   */
  async revokeSession(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.id;
      
      logger.info('[DeviceSessionController] 撤销设备会话', { userId, sessionId });
      
      const success = await this.userService.revokeSession(userId, sessionId);
      
      if (!success) {
        return errorResponse(res, '无法撤销会话或会话不存在', 404);
      }

      return successResponse(res, null, '设备会话已撤销');
    } catch (error) {
      logger.error('[DeviceSessionController] 撤销设备会话失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 撤销除当前会话外的所有设备会话
   * DELETE /api/device-sessions/other
   */
  async revokeOtherSessions(req, res, next) {
    try {
      const userId = req.user.id;
      const authHeader = req.headers['authorization'];
      const currentToken = authHeader && authHeader.split(' ')[1];
      
      logger.info('[DeviceSessionController] 撤销其他设备会话', { userId });
      
      // 先获取所有会话，找到当前会话 ID
      const sessions = await this.userService.getUserSessions(userId);
      const currentSession = sessions.find(s => s.session_token === currentToken);
      const currentSessionId = currentSession ? currentSession.id : null;
      
      if (!currentSessionId) {
        return errorResponse(res, '找不到当前会话，无法撤销其他会话', 400);
      }
      
      const count = await this.userService.revokeOtherSessions(userId, currentSessionId);

      return successResponse(res, { revokedCount: count }, `已成功撤销 ${count} 个其他设备会话`);
    } catch (error) {
      logger.error('[DeviceSessionController] 撤销其他设备会话失败', { error: error.message });
      next(error);
    }
  }
}

module.exports = new DeviceSessionController();
