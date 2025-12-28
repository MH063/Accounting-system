import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'

// 成员统计摘要接口
export interface MemberStatsSummary {
  // 成员概况
  totalUsers: number                 // 系统总用户数
  activeUsers: number               // 活跃用户数（最近30天登录）
  usersInDorms: number            // 有宿舍的成员数

  // 费用统计
  usersWithExpenses: number   // 有费用记录的用户数
  totalSplitAmount: number   // 总分摊金额
  avgSplitAmount: number       // 平均分摊金额
  totalPaidAmount: number     // 已支付总金额

  // 宿舍统计
  totalDorms: number                 // 总宿舍数
  avgDormCapacity: number     // 平均宿舍容量
  avgCurrentOccupancy: number // 平均当前入住人数
  avgMembersPerDorm: number    // 平均每宿舍人数

  // 时间趋势
  recentTotalExpenses: number // 最近30天总费用
  recentExpenseCount: number     // 最近30天费用记录数

  // 衍生指标
  activeRate: number               // 活跃率（%）
  dormMemberRate: number      // 宿舍成员占比（%）
  paymentRate: number              // 支付率（%）
}

// 月度趋势数据接口
export interface MonthlyTrendItem {
  month: string                     // 月份
  newMembers: number               // 新增成员数
  activeMembers: number            // 活跃成员数
  dormMembers: number             // 宿舍成员数
  expenseMembers: number          // 有费用的成员数
  totalExpenses: number          // 总费用
  avgExpensePerMember: number   // 人均费用
}

// 成员统计响应接口
export interface MemberStatsResponse {
  summary: MemberStatsSummary
  monthlyTrends: MonthlyTrendItem[]
}

/**
 * 获取成员统计数据
 * @param startDate 开始日期 (可选)
 * @param endDate 结束日期 (可选)
 * @returns 成员统计数据
 */
export const getMemberStats = async (
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<MemberStatsResponse>> => {
  try {
    console.log('获取成员统计数据:', { startDate, endDate })
    
    // 构建查询参数
    const params = new URLSearchParams()
    if (startDate) {
      params.append('startDate', startDate)
    }
    if (endDate) {
      params.append('endDate', endDate)
    }
    
    // 调用真实API获取成员统计数据
    const url = `/member-stats${params.toString() ? `?${params.toString()}` : ''}`
    const response = await request<MemberStatsResponse>(url, {
      method: 'GET'
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    return {
      success: response.success,
      data: actualData,
      message: response.message
    }
  } catch (error) {
    console.error('获取成员统计数据失败:', error)
    return {
      success: false,
      data: {
        summary: {
          totalUsers: 0,
          activeUsers: 0,
          usersInDorms: 0,
          usersWithExpenses: 0,
          totalSplitAmount: 0,
          avgSplitAmount: 0,
          totalPaidAmount: 0,
          totalDorms: 0,
          avgDormCapacity: 0,
          avgCurrentOccupancy: 0,
          avgMembersPerDorm: 0,
          recentTotalExpenses: 0,
          recentExpenseCount: 0,
          activeRate: 0,
          dormMemberRate: 0,
          paymentRate: 0
        },
        monthlyTrends: []
      },
      message: '获取成员统计数据失败'
    }
  }
}

// 导出默认实例
export default {
  getMemberStats
}