import { apiRequest } from './index'

// 通知类型定义
export interface SystemNotification {
  id: number
  title: string
  content: string
  type: 'system' | 'announcement' | 'reminder' | 'urgent'
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  senderId: number
  senderName: string
  recipientGroups: string[]
  recipientCount: number
  sendMethods: ('email' | 'sms' | 'in-app' | 'push')[]
  sendTime?: string
  scheduledTime?: string
  createTime: string
  updateTime: string
  templateId?: number
  templateName?: string
  readCount?: number
  clickCount?: number
}

// 通知模板类型定义
export interface NotificationTemplate {
  id: number
  name: string
  title: string
  content: string
  type: 'system' | 'announcement' | 'reminder' | 'urgent'
  variables: string[]
  isActive: boolean
  createTime: string
  updateTime: string
  createdBy: number
  updatedBy: number
  usageCount: number
}

// 发送历史记录类型定义
export interface NotificationHistory {
  id: number
  notificationId: number
  notificationTitle: string
  type: string
  senderName: string
  recipientGroup: string
  recipientCount: number
  sendMethod: string
  status: 'pending' | 'sending' | 'sent' | 'failed'
  sendTime: string
  readCount: number
  clickCount: number
  errorReason?: string
}

// 通知效果统计类型定义
export interface NotificationStats {
  totalSent: number
  totalRead: number
  totalClick: number
  readRate: number
  clickRate: number
  typeStats: {
    [key: string]: {
      sent: number
      read: number
      click: number
      readRate: number
      clickRate: number
    }
  }
  methodStats: {
    [key: string]: {
      sent: number
      read: number
      click: number
      readRate: number
      clickRate: number
    }
  }
  dailyStats: Array<{
    date: string
    sent: number
    read: number
    click: number
  }>
  monthlyStats: Array<{
    month: string
    sent: number
    read: number
    click: number
  }>
}

// 用户群体类型定义
export interface UserGroup {
  id: number
  name: string
  description: string
  userCount: number
  criteria: {
    userType?: string[]
    registerDateRange?: string[]
    lastActiveDateRange?: string[]
    tags?: string[]
    customFilters?: string[]
  }
  isActive: boolean
  createTime: string
  updateTime: string
  createdBy: number
  updatedBy: number
}

// 定时任务类型定义
export interface ScheduledTask {
  id: number
  name: string
  notificationId: number
  notificationTitle: string
  scheduledTime: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  recipientGroups: string[]
  sendMethods: string[]
  retryCount: number
  maxRetries: number
  createTime: string
  updateTime: string
  createdBy: number
  runTime?: string
  errorReason?: string
}

// 系统通知API
export const systemNotificationApi = {
  // 获取系统通知列表
  getSystemNotifications: (params?: { 
    page?: number; 
    pageSize?: number; 
    keyword?: string; 
    type?: string; 
    status?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiRequest.get('/system/notifications', params)
  },
  
  // 获取系统通知详情
  getSystemNotificationDetail: (id: number) => {
    return apiRequest.get(`/system/notifications/${id}`)
  },
  
  // 创建系统通知
  createSystemNotification: (data: Partial<SystemNotification>) => {
    return apiRequest.post('/system/notifications', data)
  },
  
  // 更新系统通知
  updateSystemNotification: (id: number, data: Partial<SystemNotification>) => {
    return apiRequest.put(`/system/notifications/${id}`, data)
  },
  
  // 删除系统通知
  deleteSystemNotification: (id: number) => {
    return apiRequest.delete(`/system/notifications/${id}`)
  },
  
  // 发送系统通知
  sendSystemNotification: (id: number) => {
    return apiRequest.post(`/system/notifications/${id}/send`)
  },
  
  // 取消发送系统通知
  cancelSystemNotification: (id: number) => {
    return apiRequest.post(`/system/notifications/${id}/cancel`)
  },
  
  // 重新发送系统通知
  resendSystemNotification: (id: number) => {
    return apiRequest.post(`/system/notifications/${id}/resend`)
  },
  
  // 预览系统通知
  previewSystemNotification: (data: Partial<SystemNotification>) => {
    return apiRequest.post('/system/notifications/preview', data)
  },
  
  // 导出系统通知记录
  exportSystemNotifications: (params?: {
    keyword?: string; 
    type?: string; 
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiRequest.get('/system/notifications/export', { 
      params, 
      responseType: 'blob' 
    })
  }
}

// 通知模板API
export const notificationTemplateApi = {
  // 获取通知模板列表
  getNotificationTemplates: (params?: { 
    page?: number; 
    pageSize?: number; 
    keyword?: string; 
    type?: string; 
    isActive?: boolean;
  }) => {
    return apiRequest.get('/system/notification-templates', params)
  },
  
  // 获取通知模板详情
  getNotificationTemplateDetail: (id: number) => {
    return apiRequest.get(`/system/notification-templates/${id}`)
  },
  
  // 创建通知模板
  createNotificationTemplate: (data: Partial<NotificationTemplate>) => {
    return apiRequest.post('/system/notification-templates', data)
  },
  
  // 更新通知模板
  updateNotificationTemplate: (id: number, data: Partial<NotificationTemplate>) => {
    return apiRequest.put(`/system/notification-templates/${id}`, data)
  },
  
  // 删除通知模板
  deleteNotificationTemplate: (id: number) => {
    return apiRequest.delete(`/system/notification-templates/${id}`)
  },
  
  // 启用/禁用通知模板
  toggleNotificationTemplate: (id: number, isActive: boolean) => {
    return apiRequest.put(`/system/notification-templates/${id}/toggle`, { isActive })
  },
  
  // 预览通知模板
  previewNotificationTemplate: (id: number, variables: { [key: string]: string }) => {
    return apiRequest.post(`/system/notification-templates/${id}/preview`, { variables })
  }
}

// 发送历史记录API
export const notificationHistoryApi = {
  // 获取发送历史记录
  getNotificationHistories: (params?: { 
    page?: number; 
    pageSize?: number; 
    keyword?: string; 
    type?: string; 
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiRequest.get('/system/notification-histories', params)
  },
  
  // 获取发送历史详情
  getNotificationHistoryDetail: (id: number) => {
    return apiRequest.get(`/system/notification-histories/${id}`)
  },
  
  // 导出发送历史记录
  exportNotificationHistories: (params?: {
    keyword?: string; 
    type?: string; 
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiRequest.get('/system/notification-histories/export', params)
  }
}

// 通知效果统计API
export const notificationStatsApi = {
  // 获取通知效果统计
  getNotificationStats: (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    method?: string;
  }) => {
    return apiRequest.get('/system/notification-stats', params)
  },
  
  // 获取通知详细统计
  getNotificationDetailStats: (id: number) => {
    return apiRequest.get(`/system/notifications/${id}/stats`)
  },
  
  // 获取通知阅读记录
  getNotificationReadRecords: (id: number, params?: {
    page?: number;
    pageSize?: number;
  }) => {
    return apiRequest.get(`/system/notifications/${id}/read-records`, params)
  },
  
  // 获取通知点击记录
  getNotificationClickRecords: (id: number, params?: {
    page?: number;
    pageSize?: number;
  }) => {
    return apiRequest.get(`/system/notifications/${id}/click-records`, params)
  }
}

// 用户群体API
export const userGroupApi = {
  // 获取用户群体列表
  getUserGroups: (params?: { 
    page?: number; 
    pageSize?: number; 
    keyword?: string; 
    isActive?: boolean;
  }) => {
    return apiRequest.get('/system/user-groups', params)
  },
  
  // 获取用户群体详情
  getUserGroupDetail: (id: number) => {
    return apiRequest.get(`/system/user-groups/${id}`)
  },
  
  // 创建用户群体
  createUserGroup: (data: Partial<UserGroup>) => {
    return apiRequest.post('/system/user-groups', data)
  },
  
  // 更新用户群体
  updateUserGroup: (id: number, data: Partial<UserGroup>) => {
    return apiRequest.put(`/system/user-groups/${id}`, data)
  },
  
  // 删除用户群体
  deleteUserGroup: (id: number) => {
    return apiRequest.delete(`/system/user-groups/${id}`)
  },
  
  // 启用/禁用用户群体
  toggleUserGroup: (id: number, isActive: boolean) => {
    return apiRequest.put(`/system/user-groups/${id}/toggle`, { isActive })
  },
  
  // 获取用户群体用户数量
  getUserGroupUserCount: (id: number) => {
    return apiRequest.get(`/system/user-groups/${id}/user-count`)
  },
  
  // 预览用户群体用户列表
  previewUserGroupUsers: (id: number, params?: {
    page?: number;
    pageSize?: number;
  }) => {
    return apiRequest.get(`/system/user-groups/${id}/preview-users`, params)
  }
}

// 定时任务API
export const scheduledTaskApi = {
  // 获取定时任务列表
  getScheduledTasks: (params?: { 
    page?: number; 
    pageSize?: number; 
    keyword?: string; 
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiRequest.get('/system/scheduled-tasks', params)
  },
  
  // 获取定时任务详情
  getScheduledTaskDetail: (id: number) => {
    return apiRequest.get(`/system/scheduled-tasks/${id}`)
  },
  
  // 创建定时任务
  createScheduledTask: (data: Partial<ScheduledTask>) => {
    return apiRequest.post('/system/scheduled-tasks', data)
  },
  
  // 更新定时任务
  updateScheduledTask: (id: number, data: Partial<ScheduledTask>) => {
    return apiRequest.put(`/system/scheduled-tasks/${id}`, data)
  },
  
  // 删除定时任务
  deleteScheduledTask: (id: number) => {
    return apiRequest.delete(`/system/scheduled-tasks/${id}`)
  },
  
  // 取消定时任务
  cancelScheduledTask: (id: number) => {
    return apiRequest.post(`/system/scheduled-tasks/${id}/cancel`)
  },
  
  // 立即执行定时任务
  executeScheduledTask: (id: number) => {
    return apiRequest.post(`/system/scheduled-tasks/${id}/execute`)
  },
  
  // 重试失败的定时任务
  retryScheduledTask: (id: number) => {
    return apiRequest.post(`/system/scheduled-tasks/${id}/retry`)
  }
}