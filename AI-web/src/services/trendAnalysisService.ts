import { request } from '@/utils/request'
import type { ApiResponse } from '@/types'

// 趋势分析数据接口
export interface TrendDataPoint {
  date: string
  value: number
}

// 趋势分析参数接口
export interface TrendAnalysisParams {
  startDate: string
  endDate: string
  type: 'expense' | 'income' | 'balance'
  granularity: 'day' | 'week' | 'month'
}

/**
 * 获取趋势分析数据
 * @param params 趋势分析参数
 * @returns 趋势数据点数组
 */
export const getTrendAnalysis = async (params: TrendAnalysisParams): Promise<ApiResponse<TrendDataPoint[]>> => {
  try {
    console.log('获取趋势分析数据:', params)
    
    // 构建查询参数
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value.toString())
    })
    
    // 调用真实API获取趋势分析数据
    const response = await request<ApiResponse<any>>(`/trend/analysis?${queryParams.toString()}`)
    
    // 正确处理响应数据
    const data = response.data?.trendData || response.data || []
    console.log('趋势分析API响应数据:', data)
    
    return {
      success: response.success,
      data: Array.isArray(data) ? data : [],
      message: response.message
    }
  } catch (error) {
    console.error('获取趋势分析数据失败:', error)
    return {
      success: false,
      data: [],
      message: '获取趋势分析数据失败'
    }
  }
}

/**
 * 获取预测数据
 * @param days 预测天数
 * @returns 预测数据点数组
 */
export const getPredictionData = async (days: number): Promise<ApiResponse<TrendDataPoint[]>> => {
  try {
    console.log('获取预测数据:', days)
    
    // 调用真实API获取预测数据
    const response = await request<ApiResponse<TrendDataPoint[]>>(`/trend/prediction?days=${days}`)
    
    // 直接返回预测数据数组
    return {
      success: response.success,
      data: response.data || [],
      message: response.message
    }
  } catch (error) {
    console.error('获取预测数据失败:', error)
    return {
      success: false,
      data: [],
      message: '获取预测数据失败'
    }
  }
}

export default {
  getTrendAnalysis,
  getPredictionData
}