/**
 * WebSocket 服务
 * 用于处理实时通知，如系统强制退出广播
 */

const WebSocket = require('ws');
const logger = require('../config/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  /**
   * 初始化 WebSocket 服务器
   * @param {Object} server HTTP 服务器实例
   */
  init(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      logger.info(`[WebSocket] 新连接: ${req.socket.remoteAddress}`);
      this.clients.add(ws);

      ws.on('close', () => {
        logger.info('[WebSocket] 连接关闭');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('[WebSocket] 错误:', error.message);
        this.clients.delete(ws);
      });

      // 接收心跳或其它消息
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (e) {
          // 忽略非 JSON 消息
        }
      });
    });

    logger.info('✅ WebSocket 服务器已初始化');
  }

  /**
   * 广播消息给所有连接的客户端
   * @param {Object} message 消息对象
   */
  broadcast(message) {
    if (!this.wss) return;

    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
    logger.info(`[WebSocket] 已广播消息: ${data}`);
  }

  /**
   * 广播强制退出消息
   */
  broadcastForceLogout() {
    this.broadcast({
      type: 'FORCE_LOGOUT',
      payload: {
        message: '后端服务正在重启或维护，系统将强制退出。请稍后重新登录。',
        timestamp: new Date().toISOString()
      }
    });
  }
}

module.exports = new WebSocketService();
