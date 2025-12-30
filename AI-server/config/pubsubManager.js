/**
 * Redis发布订阅管理器
 * 用于管理Redis的发布订阅功能，支持客户端命令推送
 */

const { getRedisClient, isRedisAvailable } = require('./redis');
const logger = require('./logger');
const { createRestartCommand, validateRestartCommand, generateCommandId } = require('../services/commandSignatureService');

const PUBSUB_CHANNELS = {
  CLIENT_RESTART: 'jzb:client:restart',
  SYSTEM_NOTIFICATION: 'jzb:system:notification'
};

let subscriber = null;
let isSubscribing = false;
let pendingCommands = new Map();
const COMMAND_TTL = 60000;

function createSubscriber() {
  if (subscriber && subscriber.status === 'ready') {
    return subscriber;
  }

  const Redis = require('ioredis');
  
  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: 1,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: null,
    connectTimeout: 10000,
    commandTimeout: 5000,
    lazyConnect: false
  };

  subscriber = new Redis(config);

  subscriber.on('error', (error) => {
    logger.error('[Redis Pub/Sub] 订阅者连接错误:', error.message);
  });

  subscriber.on('close', () => {
    logger.warn('[Redis Pub/Sub] 订阅者连接已关闭');
    isSubscribing = false;
  });

  return subscriber;
}

function startSubscriber() {
  if (isSubscribing) {
    return;
  }

  const sub = createSubscriber();
  
  Promise.all([
    sub.subscribe(PUBSUB_CHANNELS.CLIENT_RESTART),
    sub.subscribe(PUBSUB_CHANNELS.SYSTEM_NOTIFICATION)
  ]).then(() => {
    isSubscribing = true;
    logger.info('[Redis Pub/Sub] 已订阅所有系统频道');
  }).catch(err => {
    logger.error('[Redis Pub/Sub] 订阅失败:', err);
  });

  sub.on('message', (channel, message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      if (channel === PUBSUB_CHANNELS.CLIENT_RESTART) {
        const commandId = `restart_${parsedMessage.timestamp}`;
        pendingCommands.set(commandId, {
          type: 'restart',
          ...parsedMessage,
          receivedAt: Date.now()
        });
        logger.info('[Redis Pub/Sub] 收到重启命令:', commandId);
      } else if (channel === PUBSUB_CHANNELS.SYSTEM_NOTIFICATION) {
        const commandId = `notification_${parsedMessage.timestamp}`;
        pendingCommands.set(commandId, {
          type: 'notification',
          ...parsedMessage,
          receivedAt: Date.now()
        });
        logger.info('[Redis Pub/Sub] 收到系统通知:', commandId);
      }

      cleanupExpiredCommands();
    } catch (error) {
      logger.error('[Redis Pub/Sub] 消息解析失败:', error);
    }
  });
}

function cleanupExpiredCommands() {
  const now = Date.now();
  for (const [id, command] of pendingCommands.entries()) {
    if (now - command.receivedAt > COMMAND_TTL) {
      pendingCommands.delete(id);
    }
  }
}

function getAllPendingCommands() {
  cleanupExpiredCommands();
  return Array.from(pendingCommands.values());
}

function consumeCommand(commandId) {
  if (pendingCommands.has(commandId)) {
    pendingCommands.delete(commandId);
    return true;
  }
  return false;
}

function hasPendingRestartCommand() {
  cleanupExpiredCommands();
  return pendingCommands.has('restart_command') || 
         Array.from(pendingCommands.values()).some(cmd => cmd.type === 'restart');
}

/**
 * 发布消息到指定频道
 * @param {string} channel 频道名称
 * @param {Object} message 消息内容
 */
async function publishMessage(channel, message) {
  try {
    if (!isRedisAvailable()) {
      logger.warn('[Redis Pub/Sub] Redis不可用，无法发布消息');
      return { success: false, error: 'Redis unavailable' };
    }

    const client = getRedisClient();
    const messageStr = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    });

    const subscriberCount = await client.publish(channel, messageStr);
    
    logger.info(`[Redis Pub/Sub] 消息已发布到频道 ${channel}`, {
      subscriberCount,
      messageType: message.type
    });

    return { success: true, subscriberCount };
  } catch (error) {
    logger.error('[Redis Pub/Sub] 消息发布失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 发布客户端重启命令
 * @param {Object} options 重启选项
 */
async function publishClientRestart(options = {}) {
  const command = options.command || {
    type: 'restart',
    action: options.action || 'refresh',
    reason: options.reason || 'admin_restart',
    initiatedBy: options.initiatedBy || 'admin',
    estimatedDowntime: options.estimatedDowntime || 30,
    timestamp: new Date().toISOString()
  };

  const message = {
    ...command,
    publishedAt: new Date().toISOString()
  };

  pendingCommands.set('restart_command', message);
  
  const result = await publishMessage(PUBSUB_CHANNELS.CLIENT_RESTART, message);
  
  return result;
}

/**
 * 发布系统通知
 * @param {Object} notification 通知内容
 */
async function publishSystemNotification(notification) {
  const message = {
    type: 'notification',
    ...notification,
    timestamp: new Date().toISOString()
  };

  return publishMessage(PUBSUB_CHANNELS.SYSTEM_NOTIFICATION, message);
}

/**
 * 订阅频道并设置消息处理器
 * @param {string} channel 频道名称
 * @param {Function} handler 消息处理函数
 */
async function subscribe(channel, handler) {
  try {
    if (!isRedisAvailable()) {
      logger.warn('[Redis Pub/Sub] Redis不可用，无法订阅');
      return { success: false, error: 'Redis unavailable' };
    }

    const sub = createSubscriber();
    
    await sub.subscribe(channel);
    
    sub.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const parsedMessage = JSON.parse(message);
          handler(parsedMessage);
        } catch (error) {
          logger.error('[Redis Pub/Sub] 消息解析失败:', error);
        }
      }
    });

    isSubscribing = true;
    logger.info(`[Redis Pub/Sub] 已订阅频道: ${channel}`);
    
    return { success: true };
  } catch (error) {
    logger.error('[Redis Pub/Sub] 订阅失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 获取订阅状态
 */
function getSubscriptionStatus() {
  return {
    isAvailable: isRedisAvailable(),
    isSubscribing,
    subscriberStatus: subscriber?.status || 'not_created',
    channels: Object.values(PUBSUB_CHANNELS),
    pendingCommandCount: pendingCommands.size,
    hasPendingRestart: hasPendingRestartCommand()
  };
}

module.exports = {
  PUBSUB_CHANNELS,
  publishMessage,
  publishClientRestart,
  publishSystemNotification,
  subscribe,
  createSubscriber,
  getSubscriptionStatus,
  getAllPendingCommands,
  consumeCommand,
  hasPendingRestartCommand,
  startSubscriber
};
