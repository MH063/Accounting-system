import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'

// 预算项目接口
export interface BudgetItem {
  id: number
  name: string
  category: string
  amount: number
  used: number
  remaining: number
  utilization: number
  period: '月度' | '季度' | '年度'
  startDate: string
  endDate: string
  remark: string
  status?: 'normal' | 'warning' | 'danger'
}

// 预算历史数据接口
export interface BudgetHistoryData {
  months: string[]
  budgetData: number[]
  expenseData: number[]
}

/**
 * 获取预算列表
 * @param page 页码
 * @param size 每页大小
 * @param category 预算类别（可选）
 * @returns 预算列表的API响应
 */
export const getBudgetList = async (page: number = 1, size: number = 10, category?: string): Promise<ApiResponse<{
  records: BudgetItem[]
  total: number
  page: number
  size: number
  pages: number
}>> => {
  try {
    console.log(`调用获取预算列表API: page=${page}, size=${size}, category=${category}`)
    
    // 构建查询参数
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('size', size.toString())
    if (category) {
      params.append('category', category)
    }
    
    // 调用真实API获取预算列表
    const response = await request<{
      records: BudgetItem[]
      total: number
      page: number
      size: number
      pages: number
    }>(`/budgets?${params.toString()}`)
    
    return response
  } catch (error) {
    console.error('获取预算列表失败:', error)
    return {
      success: false,
      data: {
        records: [],
        total: 0,
        page,
        size,
        pages: 0
      },
      message: '获取预算列表失败',
      code: 500
    }
  }
}

/**
 * 创建预算
 * @param budgetData 预算数据
 * @returns 创建结果的API响应
 */
export const createBudget = async (budgetData: {
  name: string
  category: string
  amount: number
  period: 'monthly' | 'quarterly' | 'yearly'
  startDate: string
  endDate: string
  remark: string
}): Promise<ApiResponse<BudgetItem>> => {
  try {
    console.log('调用创建预算API:', budgetData)
    
    // 调用真实API创建预算
    const response = await request<BudgetItem>('/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData)
    })
    
    return response
  } catch (error) {
    console.error('创建预算失败:', error)
    return {
      success: false,
      data: {} as BudgetItem,
      message: '创建预算失败',
      code: 500
    }
  }
}

/**
 * 更新预算
 * @param budgetId 预算ID
 * @param budgetData 预算数据
 * @returns 更新结果的API响应
 */
export const updateBudget = async (budgetId: number, budgetData: {
  name: string
  category: string
  amount: number
  period: 'monthly' | 'quarterly' | 'yearly'
  startDate: string
  endDate: string
  remark: string
}): Promise<ApiResponse<BudgetItem>> => {
  try {
    console.log(`调用更新预算API: budgetId=${budgetId}`, budgetData)
    
    // 调用真实API更新预算
    const response = await request<BudgetItem>(`/budgets/${budgetId}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData)
    })
    
    return response
  } catch (error) {
    console.error('更新预算失败:', error)
    return {
      success: false,
      data: {} as BudgetItem,
      message: '更新预算失败',
      code: 500
    }
  }
}

/**
 * 删除预算
 * @param budgetId 预算ID
 * @returns 删除结果的API响应
 */
export const deleteBudget = async (budgetId: number): Promise<ApiResponse<void>> => {
  try {
    console.log(`调用删除预算API: budgetId=${budgetId}`)
    
    // 调用真实API删除预算
    const response = await request<void>(`/budgets/${budgetId}`, {
      method: 'DELETE'
    })
    
    return response
  } catch (error) {
    console.error('删除预算失败:', error)
    return {
      success: false,
      data: undefined,
      message: '删除预算失败',
      code: 500
    }
  }
}

/**
 * 获取预算历史数据
 * @param period 时间周期（3m: 近3个月, 6m: 近6个月, 12m: 近12个月）
 * @returns 预算历史数据的API响应
 */
export const getBudgetHistory = async (period: '3m' | '6m' | '12m'): Promise<ApiResponse<BudgetHistoryData>> => {
  try {
    console.log(`调用获取预算历史数据API: period=${period}`)
    
    // 调用真实API获取预算历史数据
    const response = await request<BudgetHistoryData>(`/budgets/history?period=${period}`)
    
    return response
  } catch (error) {
    console.error('获取预算历史数据失败:', error)
    return {
      success: false,
      data: {
        months: [],
        budgetData: [],
        expenseData: []
      },
      message: '获取预算历史数据失败',
      code: 500
    }
  }
}

/**
 * 检查预算预警
 * @param budgetId 预算ID（可选，不指定则检查所有预算）
 * @returns 预算预警信息的API响应
 */
export const checkBudgetAlerts = async (budgetId?: number): Promise<ApiResponse<{
  alerts: Array<{
    budgetId: number
    budgetName: string
    category: string
    utilization: number
    remaining: number
    alertLevel: 'warning' | 'danger'
    message: string
  }>
  totalAlerts: number
}>> => {
  try {
    console.log(`调用检查预算预警API: budgetId=${budgetId}`)
    
    // 构建请求路径
    let url = '/budgets/alerts'
    if (budgetId) {
      url = `/budgets/${budgetId}/alerts`
    }
    
    // 调用真实API检查预算预警
    const response = await request<{
      alerts: Array<{
        budgetId: number
        budgetName: string
        category: string
        utilization: number
        remaining: number
        alertLevel: 'warning' | 'danger'
        message: string
      }>
      totalAlerts: number
    }>(url)
    
    return response
  } catch (error) {
    console.error('检查预算预警失败:', error)
    return {
      success: false,
      data: {
        alerts: [],
        totalAlerts: 0
      },
      message: '检查预算预警失败',
      code: 500
    }
  }
}