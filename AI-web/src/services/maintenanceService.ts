import type { ApiResponse } from '@/types'
// 导入请求函数
import { request } from '@/utils/request'

/**
 * 维护模式服务
 * 提供维护模式状态检查和相关功能
 */

// 维护模式状态类型定义
export interface MaintenanceStatus {
  enabled: boolean;        // 是否启用了维护模式
  active: boolean;         // 是否正在维护中
  startTime: string;       // 维护开始时间
  effectiveTime: string;   // 维护生效时间
  message: string;         // 维护消息
  countdownMinutes: number; // 倒计时分钟数
}

/**
 * 获取维护模式状态
 * 暂时禁用，等待后端接口完成
 */
export const getMaintenanceStatus = async (): Promise<MaintenanceStatus | null> => {
  try {
    console.log('获取维护模式状态 - 暂时禁用，等待后端接口')
    
    // 暂时返回null，不发起API请求
    // 等后端接口完成后启用以下代码：
    // const response = await request<MaintenanceStatus>('/maintenance/status')
    // return response
    
    return null
  } catch (error) {
    console.error('获取维护状态失败:', error)
    return null
  }
}

/**
 * 启动维护模式
 * @param countdownMinutes 倒计时分钟数
 * @param message 维护消息
 */
export const startMaintenance = async (
  countdownMinutes: number, 
  message: string
): Promise<boolean> => {
  try {
    console.log('启动维护模式:', countdownMinutes, message)
    
    // 调用真实API启动维护模式
    const response = await request<{ success: boolean }>('/maintenance/start', {
      method: 'POST',
      data: { countdownMinutes, message }
    })
    
    return response.success
  } catch (error) {
    console.error('启动维护模式失败:', error)
    return false
  }
}

/**
 * 取消维护模式
 */
export const cancelMaintenance = async (): Promise<boolean> => {
  try {
    console.log('取消维护模式')
    
    // 调用真实API取消维护模式
    const response = await request<{ success: boolean }>('/maintenance/cancel', {
      method: 'POST'
    })
    
    return response.success
  } catch (error) {
    console.error('取消维护模式失败:', error)
    return false
  }
}

/**
 * 获取维护历史记录
 */
export const getMaintenanceHistory = async (): Promise<any[]> => {
  try {
    console.log('获取维护历史记录')
    
    // 调用真实API获取维护历史
    const response = await request<any[]>('/maintenance/history')
    
    return response
  } catch (error) {
    console.error('获取维护历史失败:', error)
    return []
  }
}

// 默认导出服务对象
export default {
  getMaintenanceStatus,
  startMaintenance,
  cancelMaintenance,
  getMaintenanceHistory
}