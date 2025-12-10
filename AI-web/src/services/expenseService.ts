/**
 * 支出服务 - 提供支出相关的API调用
 */

import request from '@/utils/request'
import type { ApiResponse } from '@/types'

// 支出统计相关接口
export interface ExpenseStatistics {
  totalExpense: number
  dailyAverage: number
  categoryCount: number
  maxExpense: number
  maxExpenseCategory: string
}

export interface ExpenseTrendItem {
  date: string
  amount: number
}

export interface ExpenseCategoryItem {
  name: string
  value: number
}

export interface ExpenseMemberItem {
  name: string
  amount: number
}

export interface ExpenseTimeItem {
  period: string
  amount: number
}

export interface ExpenseDetailItem {
  id: number
  date: string
  category: string
  description: string
  amount: number
  payer: string
}

export interface ExpenseRecord {
  id: string
  title: string
  category: string
  amount: number
  date: string
  description: string
  applicant: string
  phone: string
  department: string
  position: string
  attachments?: any[]
  status: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseStatisticsResponse {
  success: boolean
  data: {
    statistics: ExpenseStatistics
    trendData: ExpenseTrendItem[]
    categoryData: ExpenseCategoryItem[]
    memberData: ExpenseMemberItem[]
    timeData: ExpenseTimeItem[]
    detailData: ExpenseDetailItem[]
    total: number
  }
}

export interface ExpenseFilter {
  startDate?: string
  endDate?: string
  category?: string
  payer?: string
  keyword?: string
  page?: number
  pageSize?: number
}

/**
 * 获取支出统计数据
 */
export const getExpenseStatistics = async (filter: ExpenseFilter): Promise<ExpenseStatisticsResponse> => {
  // 构建查询参数
  const params = new URLSearchParams();
  if (filter.startDate) params.append('startDate', filter.startDate);
  if (filter.endDate) params.append('endDate', filter.endDate);
  if (filter.category) params.append('category', filter.category);
  if (filter.payer) params.append('payer', filter.payer);
  if (filter.keyword) params.append('keyword', filter.keyword);
  if (filter.page) params.append('page', filter.page.toString());
  if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await request.get(`/api/expenses/statistics${queryString}`);
  return response;
}

/**
 * 删除支出记录
 */
export const deleteExpense = async (id: number): Promise<any> => {
  const response = await request.del(`/api/expenses/${id}`);
  return response;
}

/**
 * 获取支出趋势数据
 */
export const getExpenseTrend = async (timeRange: string): Promise<ExpenseTrendItem[]> => {
  const response = await request.get(`/api/expenses/trend?timeRange=${encodeURIComponent(timeRange)}`);
  return response.data;
}

/**
 * 获取支出分类数据
 */
export const getExpenseCategories = async (timeRange: string): Promise<ExpenseCategoryItem[]> => {
  const response = await request.get(`/api/expenses/categories?timeRange=${encodeURIComponent(timeRange)}`);
  return response.data;
}

/**
 * 获取成员支出数据
 */
export const getExpenseMembers = async (timeRange: string): Promise<ExpenseMemberItem[]> => {
  const response = await request.get(`/api/expenses/members?timeRange=${encodeURIComponent(timeRange)}`);
  return response.data;
}

/**
 * 获取时段支出数据
 */
export const getExpenseTimeDistribution = async (granularity: string, timeRange: string): Promise<ExpenseTimeItem[]> => {
  const response = await request.get(`/api/expenses/time-distribution?granularity=${encodeURIComponent(granularity)}&timeRange=${encodeURIComponent(timeRange)}`);
  return response.data;
}

/**
 * 根据ID获取支出记录详情
 */
export const getExpenseById = async (id: string): Promise<ApiResponse<ExpenseRecord>> => {
  try {
    const response = await request.get<ApiResponse<ExpenseRecord>>(`/api/expenses/${id}`);
    return response;
  } catch (error) {
    console.error('获取支出记录详情失败:', error);
    return {
      success: false,
      data: {} as ExpenseRecord,
      message: '获取支出记录详情失败'
    };
  }
}

/**
 * 更新支出记录
 */
export const updateExpense = async (id: string, data: Partial<ExpenseRecord>): Promise<ApiResponse<ExpenseRecord>> => {
  try {
    const response = await request.put<ApiResponse<ExpenseRecord>>(`/api/expenses/${id}`, data);
    return response;
  } catch (error) {
    console.error('更新支出记录失败:', error);
    return {
      success: false,
      data: {} as ExpenseRecord,
      message: '更新支出记录失败'
    };
  }
}

/**
 * 保存草稿
 */
export const saveDraft = async (data: Partial<ExpenseRecord>): Promise<ApiResponse<ExpenseRecord>> => {
  try {
    const response = await request.post<ApiResponse<ExpenseRecord>>('/api/expenses/draft', data);
    return response;
  } catch (error) {
    console.error('保存草稿失败:', error);
    return {
      success: false,
      data: {} as ExpenseRecord,
      message: '保存草稿失败'
    };
  }
}

/**
 * 文件上传
 */
export const uploadFile = async (formData: FormData): Promise<ApiResponse<{ fileUrl: string }>> => {
  try {
    const response = await request.post<ApiResponse<{ fileUrl: string }>>('/api/expenses/upload', formData);
    return response;
  } catch (error) {
    console.error('文件上传失败:', error);
    return {
      success: false,
      data: { fileUrl: '' },
      message: '文件上传失败'
    };
  }
}

/**
 * 删除文件
 */
export const deleteFile = async (fileUrl: string): Promise<ApiResponse<boolean>> => {
  try {
    const response = await request.del<ApiResponse<boolean>>(`/api/expenses/files?fileUrl=${encodeURIComponent(fileUrl)}`);
    return response;
  } catch (error) {
    console.error('文件删除失败:', error);
    return {
      success: false,
      data: false,
      message: '文件删除失败'
    };
  }
}

/**
 * 支出服务导出
 */
export const expenseService = {
  getExpenseStatistics,
  deleteExpense,
  getExpenseTrend,
  getExpenseCategories,
  getExpenseMembers,
  getExpenseTimeDistribution,
  getExpenseById,
  updateExpense,
  saveDraft,
  uploadFile,
  deleteFile
}

export default expenseService