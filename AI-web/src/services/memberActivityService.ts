import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'
import { ElMessage } from 'element-plus'

// 成员活动类型
export type ActivityType = 'expense' | 'payment' | 'maintenance' | 'member_change'

// 用户信息接口
export interface User {
  id: number
  name: string
  avatar?: string
}

// 宿舍信息接口
export interface Dorm {
  id: number
  name: string
  building: string
  roomNumber: string
}

// 成员活动接口
export interface MemberActivity {
  activityType: ActivityType
  activityId: number
  activityTime: string
  activityTitle: string
  detail: string
  amount?: number
  status?: string
  user: User
  dorm: Dorm
  category?: string
}

// 分页信息接口
export interface Pagination {
  currentPage: number
  pageSize: number
  total: number
  totalPages: number
}

// 成员活动响应接口
export interface MemberActivitiesResponse {
  activities: MemberActivity[]
  pagination: Pagination
}

/**
 * 获取成员活动列表
 * @param page 页码
 * @param limit 每页数量
 * @param dormIds 宿舍ID列表
 * @returns 成员活动列表
 */
export const getMemberActivities = async (
  page: number = 1,
  limit: number = 20,
  dormIds?: string
): Promise<ApiResponse<MemberActivitiesResponse>> => {
  try {
    console.log('获取成员活动列表:', { page, limit, dormIds })
    
    // 构建查询参数
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    // 如果有宿舍筛选条件，则添加
    if (dormIds) {
      params.append('dormIds', dormIds)
    }
    
    // 调用真实API获取成员活动列表
    const url = `/member-activities?${params.toString()}`
    const response = await request<MemberActivitiesResponse>(url, {
      method: 'GET'
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    return {
      success: response.success,
      data: actualData,
      message: response.message
    }
  } catch (error: any) {
    console.error('获取成员活动列表失败:', error)
    return {
      success: false,
      data: {
        activities: [],
        pagination: {
          currentPage: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0
        }
      },
      message: '获取成员活动列表失败'
    }
  }
}

// 导出默认实例
export default {
  getMemberActivities
}