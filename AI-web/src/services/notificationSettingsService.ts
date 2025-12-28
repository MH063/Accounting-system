import { get, put } from '@/utils/request'

/**
 * 通知设置接口
 */
export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  smsNotifications: boolean
  systemNotifications: boolean
  billReminder: boolean
  reminderTime: string
  categories: {
    [key: string]: {
      enabled: boolean
      email: boolean
      push: boolean
    }
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

/**
 * API响应包装器
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

/**
 * 获取通知设置
 * @returns 通知设置
 */
export const getNotificationSettings = async (): Promise<ApiResponse<NotificationSettings>> => {
  try {
    console.log('获取通知设置')
    
    const response = await get<NotificationSettings>(
      '/notifications/settings'
    )
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    console.log('通知设置获取成功:', actualData)
    return {
      success: true,
      data: actualData
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

/**
 * 保存通知设置
 * @param settings 通知设置
 * @returns 保存结果
 */
export const saveNotificationSettings = async (
  settings: NotificationSettings
): Promise<ApiResponse<{ message: string }>> => {
  try {
    console.log('保存通知设置:', settings)
    
    const response = await put<{ success: boolean; data: { message: string } }>(
      '/notifications/settings',
      settings
    )
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    console.log('通知设置保存成功')
    return {
      success: true,
      data: actualData
    }
  } catch (error) {
    console.error('保存通知设置失败:', error)
    return {
      success: false,
      data: { message: '保存失败' },
      message: '保存通知设置失败: ' + (error as Error).message
    }
  }
}

export default {
  getNotificationSettings,
  saveNotificationSettings
}
