/**
 * 收入统计服务 - 提供收入统计相关的API调用
 */

import { request } from '@/utils/request'
import type { ApiResponse } from '@/types'
// 收入统计相关类型定义
export interface IncomeRecord {
  id: string
  source: string
  amount: number
  category: string
  date: string
  description: string
  status: 'confirmed' | 'pending' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface IncomeStatistics {
  totalIncome: number
  dailyAverage: number
  categoryCount: number
  maxIncome: number
  maxIncomeSource: string
}

export interface IncomeTrendItem {
  date: string
  amount: number
}

export interface IncomeCategoryItem {
  name: string
  value: number
}

export interface IncomeSourceItem {
  name: string
  amount: number
}

export interface IncomeFilter {
  startDate?: string
  endDate?: string
  category?: string
  source?: string
  keyword?: string
  page?: number
  pageSize?: number
}
/**
 * 获取收入统计数据
 */
export const getIncomeStatistics = async (filter: IncomeFilter): Promise<ApiResponse<IncomeRecord[]>> => {
  try {
    console.log('获取收入统计数据:', filter)
    
    // 构建查询参数
    const params = new URLSearchParams()
    if (filter.startDate) params.append('startDate', filter.startDate)
    if (filter.endDate) params.append('endDate', filter.endDate)
    if (filter.category) params.append('category', filter.category)
    if (filter.source) params.append('source', filter.source)
    if (filter.keyword) params.append('keyword', filter.keyword)
    if (filter.page) params.append('page', filter.page.toString())
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString())
    
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const response = await request<IncomeRecord[]>(`/income/statistics${queryString}`)    
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('获取收入统计数据失败:', error)
    return {
      success: false,
      data: [],
      message: '获取收入统计数据失败'
    }
  }
}

/**
 * 获取收入趋势数据
 */
export const getIncomeTrend = async (timeRange: string): Promise<IncomeTrendItem[]> => {
  try {
    const response = await request<IncomeTrendItem[]>(`/income/trend?timeRange=${encodeURIComponent(timeRange)}`)
    return response
  } catch (error) {
    console.error('获取收入趋势数据失败:', error)
    return []
  }
}

/**
 * 获取收入分类数据
 */
export const getIncomeCategories = async (timeRange: string): Promise<IncomeCategoryItem[]> => {
  try {
    const response = await request<IncomeCategoryItem[]>(`/income/categories?timeRange=${encodeURIComponent(timeRange)}`)
    return response
  } catch (error) {
    console.error('获取收入分类数据失败:', error)
    return []
  }
}

/**
 * 获取收入来源数据
 */
export const getIncomeSources = async (timeRange: string): Promise<IncomeSourceItem[]> => {
  try {
    const response = await request<IncomeSourceItem[]>(`/income/sources?timeRange=${encodeURIComponent(timeRange)}`)
    return response
  } catch (error) {
    console.error('获取收入来源数据失败:', error)
    return []
  }
}

/**
 * 导出收入统计数据
 */
export const exportIncomeData = async (filter: IncomeFilter, format: 'csv' | 'excel' = 'excel'): Promise<ApiResponse<{ downloadUrl: string }>> => {
  try {
    console.log('导出收入统计数据:', filter, format)
    
    // 构建查询参数
    const params = new URLSearchParams()
    params.append('format', format)
    
    if (filter.startDate) params.append('startDate', filter.startDate)
    if (filter.endDate) params.append('endDate', filter.endDate)
    if (filter.category) params.append('category', filter.category)
    if (filter.source) params.append('source', filter.source)
    if (filter.keyword) params.append('keyword', filter.keyword)
    
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const response = await request<{ downloadUrl: string }>(`/income/export${queryString}`)
    
    // 如果API返回了下载链接，自动触发下载
    if (response.downloadUrl) {
      const link = document.createElement('a')
      link.href = response.downloadUrl
      link.download = `收入统计_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('导出收入统计数据失败:', error)
    return {
      success: false,
      data: { downloadUrl: '' },
      message: '导出收入统计数据失败'
    }
  }
}

// 导出默认实例
export default {
  getIncomeStatistics,
  getIncomeTrend,
  getIncomeCategories,
  getIncomeSources,
  exportIncomeData
}