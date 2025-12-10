import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'

// 成员信息接口
export interface Member {
  id: number
  studentId: string
  name: string
  phone: string
  email?: string
  room: string
  role: 'admin' | 'member'
  status: 'active' | 'away' | 'inactive'
  joinDate: string
  remark?: string
  avatar?: string
  shareAmount?: number
  completedTasks?: number
  totalTasks?: number
}

// 财务统计数据接口
export interface FinancialStats {
  totalContribution: number
  monthlyShare: number
  pendingAmount: number
  paidAmount: number
  maxAmount: number
  contributionTrend: Array<{
    month: string
    amount: number
  }>
}

// 活跃度统计数据接口
export interface ActivityStats {
  onlineTime: number
  onlineTimeTrend: 'up' | 'down'
  onlineTimeChange: number
  interactionCount: number
  interactionTrend: 'up' | 'down'
  interactionChange: number
  lastActive: string
  activeStatus: 'active' | 'inactive'
  recentActivities: Array<{
    id: number
    action: string
    time: string
    type: string
  }>
}

/**
 * 获取成员信息
 * @param memberId 成员ID
 * @returns 成员信息
 */
export const getMemberById = async (memberId: string): Promise<ApiResponse<Member>> => {
  try {
    console.log('获取成员信息:', memberId)
    
    // 调用真实API获取成员信息
    const response = await request<Member>(`/members/${memberId}`)
    
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('获取成员信息失败:', error)
    return {
      success: false,
      data: {} as Member,
      message: '获取成员信息失败'
    }
  }
}

/**
 * 更新成员信息
 * @param memberId 成员ID
 * @param memberData 成员数据
 * @returns 更新结果
 */
export const updateMember = async (memberId: string, memberData: Partial<Member>): Promise<ApiResponse<Member>> => {
  try {
    console.log('更新成员信息:', memberId, memberData)
    
    // 调用真实API更新成员信息
    const response = await request<Member>(`/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(memberData)
    })
    
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('更新成员信息失败:', error)
    return {
      success: false,
      data: {} as Member,
      message: '更新成员信息失败'
    }
  }
}

/**
 * 获取成员财务统计数据
 * @param memberId 成员ID
 * @returns 财务统计数据
 */
export const getMemberFinancialStats = async (memberId: string): Promise<ApiResponse<FinancialStats>> => {
  try {
    console.log('获取成员财务统计数据:', memberId)
    
    // 调用真实API获取财务统计数据
    const response = await request<FinancialStats>(`/members/${memberId}/financial-stats`)
    
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('获取成员财务统计数据失败:', error)
    return {
      success: false,
      data: {
        totalContribution: 0,
        monthlyShare: 0,
        pendingAmount: 0,
        paidAmount: 0,
        maxAmount: 100,
        contributionTrend: []
      },
      message: '获取成员财务统计数据失败'
    }
  }
}

/**
 * 获取成员活跃度统计数据
 * @param memberId 成员ID
 * @returns 活跃度统计数据
 */
export const getMemberActivityStats = async (memberId: string): Promise<ApiResponse<ActivityStats>> => {
  try {
    console.log('获取成员活跃度统计数据:', memberId)
    
    // 调用真实API获取活跃度统计数据
    const response = await request<ActivityStats>(`/members/${memberId}/activity-stats`)
    
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('获取成员活跃度统计数据失败:', error)
    return {
      success: false,
      data: {
        onlineTime: 0,
        onlineTimeTrend: 'up',
        onlineTimeChange: 0,
        interactionCount: 0,
        interactionTrend: 'up',
        interactionChange: 0,
        lastActive: '',
        activeStatus: 'active',
        recentActivities: []
      },
      message: '获取成员活跃度统计数据失败'
    }
  }
}

// 导出默认实例
export default {
  getMemberById,
  updateMember,
  getMemberFinancialStats,
  getMemberActivityStats
}