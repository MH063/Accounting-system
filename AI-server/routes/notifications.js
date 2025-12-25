/**
 * 通知路由模块
 * 提供通知相关的API接口
 * 
 * 接口列表：
 * 1. GET    /api/notifications              - 获取通知列表
 * 2. GET    /api/notifications/unread-count - 获取未读通知数量
 * 3. GET    /api/notifications/settings    - 获取通知设置
 * 4. PUT    /api/notifications/read-all    - 标记所有通知为已读
 * 5. PUT    /api/notifications/unread-all  - 标记所有通知为未读
 * 6. PUT    /api/notifications/settings    - 保存通知设置
 * 7. PUT    /api/notifications/batch/read   - 批量标记已读
 * 8. PUT    /api/notifications/batch/unread - 批量标记未读
 * 9. DELETE /api/notifications/batch       - 批量删除通知
 * 10. GET   /api/notifications/:id         - 获取通知详情
 * 11. PUT   /api/notifications/:id/read    - 标记通知为已读
 * 12. PUT   /api/notifications/:id/unread  - 标记通知为未读
 * 13. DELETE /api/notifications/:id         - 删除通知
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const logger = require('../config/logger');
const { responseWrapper } = require('../middleware/response');

/**
 * 获取通知列表
 * GET /api/notifications
 * 
 * 请求参数：
 * - type: 通知类型筛选 (info, warning, error, success, system)
 * - isRead: 已读状态筛选 (true, false)
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认20
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: {
 *     notifications: [...],
 *     total: 100,
 *     page: 1,
 *     pageSize: 20
 *   }
 * }
 */
router.get('/', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始获取通知列表');
  
  const userId = req.user.userId;
  const { type, isRead, page = 1, pageSize = 20 } = req.query;
  
  const conditions = ['(user_id = $1 OR is_global = true)'];
  const params = [userId];
  let paramIndex = 2;
  
  if (type) {
    conditions.push(`type = $${paramIndex++}`);
    params.push(type);
  }
  
  if (isRead !== undefined) {
    conditions.push(`is_read = $${paramIndex++}`);
    params.push(isRead === 'true');
  }
  
  const whereClause = conditions.join(' AND ');
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM notifications
    WHERE ${whereClause}
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);
  
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const notificationsQuery = `
    SELECT 
      id,
      title,
      content,
      type,
      is_read,
      read_at,
      sender_id,
      related_id,
      related_table,
      created_at,
      updated_at,
      CASE 
        WHEN type IN ('error', 'warning') THEN true
        ELSE false
      END as is_important
    FROM notifications
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(parseInt(pageSize), offset);
  
  const notificationsResult = await query(notificationsQuery, params);
  
  console.log('通知列表获取完成，共', total, '条通知');
  
  return {
    notifications: notificationsResult.rows,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  };
}));

/**
 * 获取未读通知数量
 * GET /api/notifications/unread-count
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: { 
 *     unreadCount: 5,
 *     totalCount: 20
 *   }
 * }
 */
router.get('/unread-count', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始获取未读通知数量');
  
  const userId = req.user.userId;
  
  const unreadQuery = `
    SELECT COUNT(*) as unread_count
    FROM notifications
    WHERE is_read = false
      AND (user_id = $1 OR is_global = true)
  `;
  const unreadResult = await query(unreadQuery, [userId]);
  const unreadCount = parseInt(unreadResult.rows[0].unread_count);
  
  const totalQuery = `
    SELECT COUNT(*) as total_count
    FROM notifications
    WHERE (user_id = $1 OR is_global = true)
  `;
  const totalResult = await query(totalQuery, [userId]);
  const totalCount = parseInt(totalResult.rows[0].total_count);
  
  console.log('未读通知数量:', unreadCount, '，总通知数量:', totalCount);
  
  return {
    unreadCount,
    totalCount
  };
}));

/**
 * 获取通知设置
 * GET /api/notifications/settings
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: {
 *     emailNotifications: true,
 *     pushNotifications: true,
 *     soundEnabled: true,
 *     vibrationEnabled: true,
 *     smsNotifications: false,
 *     systemNotifications: true,
 *     billReminder: true,
 *     reminderTime: '09:00',
 *     categories: {
 *       expense: { enabled: true, email: true, push: true },
 *       bill: { enabled: true, email: true, push: true },
 *       member: { enabled: true, email: true, push: true },
 *       system: { enabled: true, email: true, push: true },
 *       warning: { enabled: true, email: true, push: true }
 *     },
 *     quietHours: {
 *       enabled: false,
 *       start: '22:00',
 *       end: '08:00'
 *     }
 *   }
 * }
 */
router.get('/settings', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始获取通知设置');
  
  const userId = req.user.userId;
  
  const settingsQuery = `
    SELECT 
      email_notifications,
      push_notifications,
      sound_enabled,
      vibration_enabled,
      sms_notifications,
      system_notifications,
      bill_reminder,
      reminder_time,
      notification_categories,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end
    FROM user_notification_settings
    WHERE user_id = $1
  `;
  const result = await query(settingsQuery, [userId]);
  
  if (result.rows.length === 0) {
    console.log('用户未设置通知偏好，返回默认设置');
    return {
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
      smsNotifications: false,
      systemNotifications: true,
      billReminder: true,
      reminderTime: '09:00',
      categories: {
        expense: { enabled: true, email: true, push: true },
        bill: { enabled: true, email: true, push: true },
        member: { enabled: true, email: true, push: true },
        system: { enabled: true, email: true, push: true },
        warning: { enabled: true, email: true, push: true }
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }
  
  const settings = result.rows[0];
  
  console.log('通知设置获取完成');
  
  return {
    emailNotifications: settings.email_notifications,
    pushNotifications: settings.push_notifications,
    soundEnabled: settings.sound_enabled,
    vibrationEnabled: settings.vibration_enabled,
    smsNotifications: settings.sms_notifications,
    systemNotifications: settings.system_notifications,
    billReminder: settings.bill_reminder,
    reminderTime: settings.reminder_time,
    categories: settings.notification_categories || {},
    quietHours: {
      enabled: settings.quiet_hours_enabled,
      start: settings.quiet_hours_start,
      end: settings.quiet_hours_end
    }
  };
}));

/**
 * 标记所有通知为已读
 * PUT /api/notifications/read-all
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: { 
 *     message: '所有通知已标记为已读',
 *     affectedCount: 10
 *   }
 * }
 */
router.put('/read-all', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始标记所有通知为已读');
  
  const userId = req.user.userId;
  
  const updateQuery = `
    UPDATE notifications
    SET is_read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE is_read = false
      AND (user_id = $1 OR is_global = true)
    RETURNING id
  `;
  const result = await query(updateQuery, [userId]);
  
  console.log('所有通知已标记为已读，影响行数:', result.rows.length);
  
  return {
    message: '所有通知已标记为已读',
    affectedCount: result.rows.length
  };
}));

/**
 * 标记所有通知为未读
 * PUT /api/notifications/unread-all
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: { 
 *     message: '所有通知已标记为未读',
 *     affectedCount: 10
 *   }
 * }
 */
router.put('/unread-all', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始标记所有通知为未读');
  
  const userId = req.user.userId;
  
  const updateQuery = `
    UPDATE notifications
    SET is_read = false,
        read_at = NULL,
        updated_at = NOW()
    WHERE is_read = true
      AND (user_id = $1 OR is_global = true)
    RETURNING id
  `;
  const result = await query(updateQuery, [userId]);
  
  console.log('所有通知已标记为未读，影响行数:', result.rows.length);
  
  return {
    message: '所有通知已标记为未读',
    affectedCount: result.rows.length
  };
}));

/**
 * 保存通知设置
 * PUT /api/notifications/settings
 * 
 * 请求体：
 * {
 *   emailNotifications: true,
 *   pushNotifications: true,
 *   soundEnabled: true,
 *   vibrationEnabled: true,
 *   smsNotifications: false,
 *   systemNotifications: true,
 *   billReminder: true,
 *   reminderTime: '09:00',
 *   categories: {
 *     expense: { enabled: true, email: true, push: true },
 *     bill: { enabled: true, email: true, push: true },
 *     member: { enabled: true, email: true, push: true },
 *     system: { enabled: true, email: true, push: true },
 *     warning: { enabled: true, email: true, push: true }
 *   },
 *   quietHours: {
 *     enabled: false,
 *     start: '22:00',
 *     end: '08:00'
 *   }
 * }
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: { message: '通知设置保存成功' }
 * }
 */
router.put('/settings', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始保存通知设置');
  
  const userId = req.user.userId;
  const {
    emailNotifications,
    pushNotifications,
    soundEnabled,
    vibrationEnabled,
    smsNotifications,
    systemNotifications,
    billReminder,
    reminderTime,
    categories,
    quietHours
  } = req.body;
  
  const checkQuery = `
    SELECT id FROM user_notification_settings
    WHERE user_id = $1
  `;
  const checkResult = await query(checkQuery, [userId]);
  
  if (checkResult.rows.length === 0) {
    const insertQuery = `
      INSERT INTO user_notification_settings (
        user_id,
        email_notifications,
        push_notifications,
        sound_enabled,
        vibration_enabled,
        sms_notifications,
        system_notifications,
        bill_reminder,
        reminder_time,
        notification_categories,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;
    await query(insertQuery, [
      userId,
      emailNotifications,
      pushNotifications,
      soundEnabled,
      vibrationEnabled,
      smsNotifications,
      systemNotifications,
      billReminder,
      reminderTime,
      JSON.stringify(categories),
      quietHours.enabled,
      quietHours.start,
      quietHours.end
    ]);
  } else {
    const updateQuery = `
      UPDATE user_notification_settings
      SET email_notifications = $2,
          push_notifications = $3,
          sound_enabled = $4,
          vibration_enabled = $5,
          sms_notifications = $6,
          system_notifications = $7,
          bill_reminder = $8,
          reminder_time = $9,
          notification_categories = $10,
          quiet_hours_enabled = $11,
          quiet_hours_start = $12,
          quiet_hours_end = $13,
          updated_at = NOW()
      WHERE user_id = $1
      RETURNING id
    `;
    await query(updateQuery, [
      userId,
      emailNotifications,
      pushNotifications,
      soundEnabled,
      vibrationEnabled,
      smsNotifications,
      systemNotifications,
      billReminder,
      reminderTime,
      JSON.stringify(categories),
      quietHours.enabled,
      quietHours.start,
      quietHours.end
    ]);
  }
  
  console.log('通知设置保存成功');
  
  return { message: '通知设置保存成功' };
}));

/**
 * 批量标记已读
 * PUT /api/notifications/batch/read
 * 
 * 请求体：
 * {
 *   ids: [1, 2, 3, ...]
 * }
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: { 
 *     message: '批量标记已读成功',
 *     affectedCount: 3
 *   }
 * }
 */
router.put('/batch/read', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始批量标记通知为已读');
  
  const userId = req.user.userId;
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new Error('请提供有效的通知ID列表');
  }
  
  const updateQuery = `
    UPDATE notifications
    SET is_read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = ANY($1)
      AND (user_id = $2 OR is_global = true)
    RETURNING id
  `;
  const result = await query(updateQuery, [ids, userId]);
  
  console.log('批量标记已读完成，影响行数:', result.rows.length);
  
  return {
    message: '批量标记已读成功',
    affectedCount: result.rows.length
  };
}));

/**
 * 批量标记未读
 * PUT /api/notifications/batch/unread
 * 
 * 请求体：
 * {
 *   ids: [1, 2, 3, ...]
 * }
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: { 
 *     message: '批量标记未读成功',
 *     affectedCount: 3
 *   }
 * }
 */
router.put('/batch/unread', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始批量标记通知为未读');
  
  const userId = req.user.userId;
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new Error('请提供有效的通知ID列表');
  }
  
  const updateQuery = `
    UPDATE notifications
    SET is_read = false,
        read_at = NULL,
        updated_at = NOW()
    WHERE id = ANY($1)
      AND (user_id = $2 OR is_global = true)
    RETURNING id
  `;
  const result = await query(updateQuery, [ids, userId]);
  
  console.log('批量标记未读完成，影响行数:', result.rows.length);
  
  return {
    message: '批量标记未读成功',
    affectedCount: result.rows.length
  };
}));

/**
 * 批量删除通知
 * DELETE /api/notifications/batch
 * 
 * 请求体：
 * {
 *   ids: [1, 2, 3, ...]
 * }
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: { 
 *     message: '批量删除成功',
 *     affectedCount: 3
 *   }
 * }
 */
router.delete('/batch', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始批量删除通知');
  
  const userId = req.user.userId;
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new Error('请提供有效的通知ID列表');
  }
  
  const deleteQuery = `
    DELETE FROM notifications
    WHERE id = ANY($1)
      AND (user_id = $2 OR is_global = true)
    RETURNING id
  `;
  const result = await query(deleteQuery, [ids, userId]);
  
  console.log('批量删除完成，影响行数:', result.rows.length);
  
  return {
    message: '批量删除成功',
    affectedCount: result.rows.length
  };
}));

/**
 * 获取通知详情
 * GET /api/notifications/:id
 * 
 * 路径参数：
 * - id: 通知ID
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: {
 *     id: 1,
 *     title: '通知标题',
 *     content: '通知内容',
 *     type: 'info',
 *     is_read: false,
 *     read_at: null,
 *     sender_id: null,
 *     related_id: null,
 *     related_table: null,
 *     created_at: '2024-01-01T00:00:00.000Z',
 *     updated_at: '2024-01-01T00:00:00.000Z',
 *     is_important: false
 *   }
 * }
 */
router.get('/:id', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始获取通知详情，通知ID:', req.params.id);
  
  const userId = req.user.userId;
  const notificationId = req.params.id;
  
  const checkQuery = `
    SELECT 
      id,
      title,
      content,
      type,
      is_read,
      read_at,
      sender_id,
      related_id,
      related_table,
      created_at,
      updated_at,
      CASE 
        WHEN type IN ('error', 'warning') THEN true
        ELSE false
      END as is_important
    FROM notifications
    WHERE id = $1 AND (user_id = $2 OR is_global = true)
  `;
  const checkResult = await query(checkQuery, [notificationId, userId]);
  
  if (checkResult.rows.length === 0) {
    logger.warn('通知不存在或无权访问', { notificationId, userId });
    throw new Error('通知不存在或无权访问');
  }
  
  console.log('通知详情获取成功，通知ID:', notificationId);
  
  return checkResult.rows[0];
}));

/**
 * 标记通知为已读
 * PUT /api/notifications/:id/read
 * 
 * 路径参数：
 * - id: 通知ID
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: { message: '通知已标记为已读' }
 * }
 */
router.put('/:id/read', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始标记通知为已读，通知ID:', req.params.id);
  
  const userId = req.user.userId;
  const notificationId = req.params.id;
  
  const checkQuery = `
    SELECT id FROM notifications
    WHERE id = $1 AND (user_id = $2 OR is_global = true)
  `;
  const checkResult = await query(checkQuery, [notificationId, userId]);
  
  if (checkResult.rows.length === 0) {
    logger.warn('通知不存在或无权访问', { notificationId, userId });
    throw new Error('通知不存在或无权访问');
  }
  
  const updateQuery = `
    UPDATE notifications
    SET is_read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    RETURNING id
  `;
  await query(updateQuery, [notificationId]);
  
  console.log('通知已标记为已读，通知ID:', notificationId);
  
  return { message: '通知已标记为已读' };
}));

/**
 * 标记通知为未读
 * PUT /api/notifications/:id/unread
 * 
 * 路径参数：
 * - id: 通知ID
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: { message: '通知已标记为未读' }
 * }
 */
router.put('/:id/unread', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始标记通知为未读，通知ID:', req.params.id);
  
  const userId = req.user.userId;
  const notificationId = req.params.id;
  
  const checkQuery = `
    SELECT id FROM notifications
    WHERE id = $1 AND (user_id = $2 OR is_global = true)
  `;
  const checkResult = await query(checkQuery, [notificationId, userId]);
  
  if (checkResult.rows.length === 0) {
    logger.warn('通知不存在或无权访问', { notificationId, userId });
    throw new Error('通知不存在或无权访问');
  }
  
  const updateQuery = `
    UPDATE notifications
    SET is_read = false,
        read_at = NULL,
        updated_at = NOW()
    WHERE id = $1
    RETURNING id
  `;
  await query(updateQuery, [notificationId]);
  
  console.log('通知已标记为未读，通知ID:', notificationId);
  
  return { message: '通知已标记为未读' };
}));

/**
 * 删除通知
 * DELETE /api/notifications/:id
 * 
 * 路径参数：
 * - id: 通知ID
 * 
 * 响应格式：
 * {
 *   success: true,
 *   data: { message: '通知已删除' }
 * }
 */
router.delete('/:id', authenticateToken, responseWrapper(async (req, res) => {
  console.log('开始删除通知，通知ID:', req.params.id);
  
  const userId = req.user.userId;
  const notificationId = req.params.id;
  
  const checkQuery = `
    SELECT id FROM notifications
    WHERE id = $1 AND (user_id = $2 OR is_global = true)
  `;
  const checkResult = await query(checkQuery, [notificationId, userId]);
  
  if (checkResult.rows.length === 0) {
    logger.warn('通知不存在或无权访问', { notificationId, userId });
    throw new Error('通知不存在或无权访问');
  }
  
  const deleteQuery = `
    DELETE FROM notifications
    WHERE id = $1
    RETURNING id
  `;
  await query(deleteQuery, [notificationId]);
  
  console.log('通知已删除，通知ID:', notificationId);
  
  return { message: '通知已删除' };
}));

module.exports = router;
