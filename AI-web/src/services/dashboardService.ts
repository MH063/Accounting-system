import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'

// 仪表盘统计数据接口
export interface DashboardStats {
  dormitoryCount: number
  memberCount: number
  monthlyExpense: number
  totalBudget: number
  pendingPayments: number
  upcomingEvents: number
  unreadNotifications: number
}

// 活动历史记录接口
export interface ActivityRecord {
  id: number
  title: string
  description: string
  type: 'payment' | 'expense' | 'member' | 'setting' | 'bill'
  time: Date
  userId: string
  userName: string
}

/**
 * 获取仪表盘统计数据
 * @returns 仪表盘统计数据
 */
export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  try {
    console.log('获取仪表盘统计数据')
    
    // 调用真实API获取仪表盘统计数据
    const response = await request<DashboardStats>('/dashboard/stats')
    
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error)
    return {
      success: false,
      data: {
        dormitoryCount: 0,
        memberCount: 0,
        monthlyExpense: 0,
        totalBudget: 0,
        pendingPayments: 0,
        upcomingEvents: 0,
        unreadNotifications: 0
      },
      message: '获取仪表盘统计数据失败'
    }
  }
}

/**
 * 获取活动历史记录
 * @param limit 返回记录数量限制
 * @returns 活动历史记录列表
 */
export const getActivityHistory = async (limit: number = 10): Promise<ApiResponse<ActivityRecord[]>> => {
  try {
    console.log('获取活动历史记录')
    
    // 调用真实API获取活动历史记录
    const response = await request<ActivityRecord[]>(`/dashboard/activity-history?limit=${limit}`)
    
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('获取活动历史记录失败:', error)
    return {
      success: false,
      data: [],
      message: '获取活动历史记录失败'
    }
  }
}

// 导出默认实例
export default {
  getDashboardStats,
  getActivityHistory
}