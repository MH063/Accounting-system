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
    const response = await request<any>('/dashboard/statistics')
    
    // 处理双层嵌套的数据结构 (Rule 5)
    if (response.success && response.data) {
      const actualData = response.data.data || response.data
      
      // 从新的响应格式中提取需要的数据
      const statsData = {
        dormitoryCount: actualData.dormStats?.totalDorms || 0,
        memberCount: actualData.userStats?.totalUsers || 0,
        monthlyExpense: actualData.expenseStats?.totalMonthlyExpense || 0,
        totalBudget: actualData.expenseStats?.totalBudget || 0, // 从API获取总预算
        pendingPayments: actualData.expenseStats?.pendingPayments || 0,
        upcomingEvents: 0, // 新接口没有直接提供即将到来的事件数，暂时设为0
        unreadNotifications: actualData.notificationStats?.unreadNotifications || 0
      }
      
      return {
        success: true,
        data: statsData
      }
    }
    
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
      message: response.message || '获取仪表盘统计数据失败'
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
    
    // 调用仪表盘统计接口获取最近活动记录
    const response = await request<any>('/dashboard/statistics')
    
    if (response.success && response.data) {
      // 处理双层嵌套的数据结构 (Rule 5)
      const actualData = response.data.data || response.data
      
      // 从新的响应格式中提取最近费用记录和最近报修记录，并合并为活动历史
      const recentExpenses = actualData.recentExpenses || []
      const recentMaintenance = actualData.recentMaintenance || []
      
      // 转换费用记录为活动历史格式
      const expenseActivities: ActivityRecord[] = recentExpenses.map((expense: any, index: number) => ({
        id: `expense-${index}`,
        title: '费用记录',
        description: `${expense.description || '费用支出'} - ¥${expense.amount || 0}`,
        type: 'expense' as const,
        time: new Date(expense.createdAt || Date.now()),
        userId: expense.userId || 'system',
        userName: expense.userName || '系统'
      }))
      
      // 转换报修记录为活动历史格式
      const maintenanceActivities: ActivityRecord[] = recentMaintenance.map((maintenance: any, index: number) => ({
        id: `maintenance-${index}`,
        title: '报修记录',
        description: `${maintenance.description || '维修请求'} - ${maintenance.status || '待处理'}`,
        type: 'bill' as const,
        time: new Date(maintenance.createdAt || Date.now()),
        userId: maintenance.userId || 'system',
        userName: maintenance.userName || '系统'
      }))
      
      // 合并并排序活动记录
      const allActivities = [...expenseActivities, ...maintenanceActivities]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit)
      
      return {
        success: true,
        data: allActivities
      }
    }
    
    return {
      success: false,
      data: [],
      message: response.message || '获取活动历史记录失败'
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

// 智能提醒接口
export interface SmartReminder {
  id: number
  type: string
  title: string
  message: string
  priority: string
  businessId: number
  relatedData: any
  createdAt: string
}

// 智能提醒响应接口
export interface SmartRemindersResponse {
  total: number
  overdueExpenseSplits: SmartReminder[]
  upcomingExpenseSplits: SmartReminder[]
  pendingExpenses: SmartReminder[]
  urgentExpenses: SmartReminder[]
  maintenanceRequests: SmartReminder[]
  unreadNotifications: SmartReminder[]
  budgetWarnings: SmartReminder[]
  pendingApprovals: SmartReminder[]
  pendingMembers: SmartReminder[]
}

/**
 * 获取智能提醒列表
 * @returns 智能提醒列表数据
 */
export const getSmartReminders = async (): Promise<ApiResponse<SmartRemindersResponse>> => {
  try {
    console.log('获取智能提醒列表')
    
    // 调用真实API获取智能提醒数据
    const response = await request<any>('/smart-reminders')
    
    return response
  } catch (error) {
    console.error('获取智能提醒列表失败:', error)
    return {
      success: false,
      data: {
        total: 0,
        overdueExpenseSplits: [],
        upcomingExpenseSplits: [],
        pendingExpenses: [],
        urgentExpenses: [],
        maintenanceRequests: [],
        unreadNotifications: [],
        budgetWarnings: [],
        pendingApprovals: [],
        pendingMembers: []
      },
      message: '获取智能提醒列表失败'
    }
  }
}

// 导出默认实例
export default {
  getDashboardStats,
  getActivityHistory,
  getSmartReminders
}