import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'

// 快速统计响应数据接口
export interface QuickStatsResponse {
  // 用户概况
  totalUsers: number              // 系统总用户数
  activeUsers: number             // 活跃用户数
  recentActiveUsers: number       // 最近30天活跃用户数

  // 宿舍成员统计
  usersInDorms: number            // 有宿舍的成员数
  dormsWithMembers: number        // 有成员的宿舍数
  avgMonthlyShare: number         // 平均月分摊费用

  // 费用统计
  usersWithExpenses: number       // 有费用记录的用户数
  totalSplitAmount: number        // 总分摊金额
  avgSplitAmount: number          // 平均分摊金额
  totalPaidAmount: number         // 总已支付金额
  totalUnpaidAmount: number       // 总未支付金额
  overdueExpenses: number         // 逾期费用数

  // 近期费用统计
  recentExpenseCount: number      // 最近30天费用数
  recentTotalAmount: number       // 最近30天总金额
  recentAvgAmount: number         // 最近30天平均金额

  // 宿舍统计
  totalDorms: number              // 总宿舍数
  avgDormCapacity: number         // 平均宿舍容量
  avgOccupancy: number            // 平均入住人数
  totalOccupancy: number          // 总入住人数

  // 比率指标
  activeRate: number              // 用户活跃率 (%)
  dormMemberRate: number          // 宿舍成员占比 (%)
  paymentRate: number             // 支付完成率 (%)
  occupancyRate: number           // 入住率 (%)
  unpaidRate: number              // 未支付率 (%)

  // 新增的风险预警指标
  highRiskDorms: number           // 高风险宿舍数
  longOverdueUsers: number        // 长期未支付用户数
  disputedExpenses: number        // 费用争议数
  pendingAppeals: number          // 待处理申诉数

  // 新增的增长洞察指标
  newMemberGrowthRate: number     // 新成员增长率 (%)
  expenseGrowthRate: number       // 费用增长率 (%)
  dormUtilizationRate: number     // 宿舍利用率 (%)
  userRetentionRate: number       // 用户留存率 (%)

  // 新增的运营健康度指标
  systemHealthScore: number       // 系统健康评分 (0-100)
  avgProcessingDays: number       // 平均费用处理时效 (天)
  userSatisfactionScore: number   // 用户满意度评分 (0-5)
  automationRate: number          // 自动化处理率 (%)
}

/**
 * 获取快速统计数据
 * @param userId 用户ID（可选，用于获取特定用户的统计信息）
 * @param startDate 开始时间（可选，格式 YYYY-MM-DD，需配合endDate使用）
 * @param endDate 结束时间（可选，格式 YYYY-MM-DD，需配合startDate使用）
 * @returns 快速统计数据
 */
export const getQuickStats = async (
  userId?: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<QuickStatsResponse>> => {
  try {
    console.log('获取快速统计数据:', { userId, startDate, endDate })
    
    // 构建查询参数
    const params = new URLSearchParams()
    if (userId) {
      params.append('userId', userId)
    }
    if (startDate && endDate) {
      params.append('startDate', startDate)
      params.append('endDate', endDate)
    }
    
    // 调用真实API获取快速统计数据
    const url = `/quick-stats${params.toString() ? `?${params.toString()}` : ''}`
    const response = await request<QuickStatsResponse>(url, {
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
    console.error('获取快速统计数据失败:', error)
    return {
      success: false,
      data: {
        // 用户概况
        totalUsers: 0,
        activeUsers: 0,
        recentActiveUsers: 0,

        // 宿舍成员统计
        usersInDorms: 0,
        dormsWithMembers: 0,
        avgMonthlyShare: 0,

        // 费用统计
        usersWithExpenses: 0,
        totalSplitAmount: 0,
        avgSplitAmount: 0,
        totalPaidAmount: 0,
        totalUnpaidAmount: 0,
        overdueExpenses: 0,

        // 近期费用统计
        recentExpenseCount: 0,
        recentTotalAmount: 0,
        recentAvgAmount: 0,

        // 宿舍统计
        totalDorms: 0,
        avgDormCapacity: 0,
        avgOccupancy: 0,
        totalOccupancy: 0,

        // 比率指标
        activeRate: 0,
        dormMemberRate: 0,
        paymentRate: 0,
        occupancyRate: 0,
        unpaidRate: 0,

        // 风险预警指标
        highRiskDorms: 0,
        longOverdueUsers: 0,
        disputedExpenses: 0,
        pendingAppeals: 0,

        // 增长洞察指标
        newMemberGrowthRate: 0,
        expenseGrowthRate: 0,
        dormUtilizationRate: 0,
        userRetentionRate: 0,

        // 运营健康度指标
        systemHealthScore: 0,
        avgProcessingDays: 0,
        userSatisfactionScore: 0,
        automationRate: 0
      },
      message: '获取快速统计数据失败'
    }
  }
}

// 导出默认实例
export default {
  getQuickStats
}