import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'

// 通知设置接口
export interface NotificationSettings {
  systemNotifications: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  billReminder: boolean
  reminderTime: string // ISO格式时间字符串
  categories: {
    [key: string]: {
      enabled: boolean
      email: boolean
      push: boolean
    }
  }
  quietHours: {
    enabled: boolean
    start: string // HH:mm格式
    end: string // HH:mm格式
  }
}

/**
 * 保存通知设置
 * @param settings 通知设置
 * @returns 保存结果
 */
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<ApiResponse<boolean>> => {
  try {
    console.log('保存通知设置:', settings)
    
    // 调用真实API保存通知设置
    const response = await request<boolean>('/notifications/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
    
    return {
      success: true,
      data: response,
      message: '通知设置保存成功'
    }
  } catch (error) {
    console.error('保存通知设置失败:', error)
    return {
      success: false,
      data: false,
      message: '保存通知设置失败: ' + (error as Error).message
    }
  }
}

/**
 * 获取通知设置
 * @returns 通知设置
 */
export const getNotificationSettings = async (): Promise<ApiResponse<NotificationSettings>> => {
  try {
    console.log('获取通知设置')
    
    // 调用真实API获取通知设置
    const response = await request<NotificationSettings>('/notifications/settings')
    
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('获取通知设置失败:', error)
    return {
      success: false,
      data: {} as NotificationSettings,
      message: '获取通知设置失败: ' + (error as Error).message
    }
  }
}

// 导出默认实例
export default {
  saveNotificationSettings,
  getNotificationSettings
}