/**
 * 支出服务 - 提供支出相关的API调用
 */

import request from '@/utils/request'
import type { ApiResponse, ExpenseItem } from '@/types'

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

// 支付相关接口
export interface PaymentQRCode {
  id: number
  platform: string
  qrCodeUrl: string
  status: string
  isUserUploaded: boolean
  createdAt: string
  updatedAt: string
}

export interface ConfirmPaymentRequest {
  expenseId: number
  paymentMethod: string
  amount: number
  transactionId?: string
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
  const response = await request.get(`/expenses/statistics${queryString}`);
  return response;
}

/**
 * 删除支出记录
 */
export const deleteExpense = async (id: number): Promise<any> => {
  const response = await request.del(`/expenses/${id}`);
  return response;
}

/**
 * 获取支出趋势数据
 */
export const getExpenseTrend = async (timeRange: string): Promise<ExpenseTrendItem[]> => {
  const response = await request.get(`/expenses/trend?timeRange=${encodeURIComponent(timeRange)}`);
  return response.data;
}

/**
 * 获取支出分类数据
 */
export const getExpenseCategories = async (timeRange: string): Promise<ExpenseCategoryItem[]> => {
  const response = await request.get(`/expenses/categories?timeRange=${encodeURIComponent(timeRange)}`);
  return response.data;
}

/**
 * 获取成员支出数据
 */
export const getExpenseMembers = async (timeRange: string): Promise<ExpenseMemberItem[]> => {
  const response = await request.get(`/expenses/members?timeRange=${encodeURIComponent(timeRange)}`);
  return response.data;
}

/**
 * 获取时段支出数据
 */
export const getExpenseTimeDistribution = async (granularity: string, timeRange: string): Promise<ExpenseTimeItem[]> => {
  const response = await request.get(`/expenses/time-distribution?granularity=${encodeURIComponent(granularity)}&timeRange=${encodeURIComponent(timeRange)}`);
  return response.data;
}

/**
 * 根据ID获取支出记录详情
 */
export const getExpenseById = async (id: string): Promise<ApiResponse<ExpenseRecord>> => {
  try {
    const response = await request.get<ApiResponse<ExpenseRecord>>(`/expenses/${id}`);
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
    const response = await request.put<ApiResponse<ExpenseRecord>>(`/expenses/${id}`, data);
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
 * 创建费用
 */
export const createExpense = async (data: Partial<ExpenseRecord>): Promise<ApiResponse<ExpenseRecord>> => {
  try {
    const response = await request.post<ApiResponse<ExpenseRecord>>('/expenses', data);
    return response;
  } catch (error) {
    console.error('创建费用失败:', error);
    return {
      success: false,
      data: {} as ExpenseRecord,
      message: '创建费用失败'
    };
  }
}

/**
 * 保存草稿
 */
export const saveDraft = async (data: Partial<ExpenseRecord>): Promise<ApiResponse<ExpenseRecord>> => {
  try {
    const response = await request.post<ApiResponse<ExpenseRecord>>('/expenses/draft', data);
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
 * 审核费用
 */
export const reviewExpense = async (id: string, data: { status: string; comment?: string }): Promise<ApiResponse<any>> => {
  try {
    const response = await request.put<ApiResponse<any>>(`/expenses/${id}/review`, data);
    return response;
  } catch (error) {
    console.error('审核费用失败:', error);
    return {
      success: false,
      data: null,
      message: '审核费用失败'
    };
  }
}

/**
 * 文件上传
 */
export const uploadFile = async (formData: FormData): Promise<ApiResponse<{ fileUrl: string }>> => {
  try {
    const response = await request.post<ApiResponse<{ fileUrl: string }>>('/expenses/upload', formData);
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
    const response = await request.del<ApiResponse<boolean>>(`/expenses/files?fileUrl=${encodeURIComponent(fileUrl)}`);
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
 * 获取支出列表
 */
export const getExpenseList = async (params?: { [key: string]: any }): Promise<ApiResponse<ExpenseItem[]>> => {
  try {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await request.get<ApiResponse<ExpenseItem[]>>(`/expenses${queryString}`);
    // 确保返回的数据结构符合预期
    if (response.success && response.data) {
      // 处理后端返回的双层嵌套结构，可能是 { data: { items: [...] } } 或 { data: { data: [...] } } 或 { data: [...] }
      if (response.data.items) {
        // 如果是 { data: { items: [...] } } 格式，提取 items 作为 data
        return {
          ...response,
          data: response.data.items
        };
      } else if (Array.isArray(response.data)) {
        // 如果直接是数组，保持原样
        return response;
      } else if (response.data.data) {
        // 兼容 { data: { data: [...] } } 格式
        return {
          ...response,
          data: response.data.data
        };
      }
    }
    return response;
  } catch (error) {
    console.error('获取支出列表失败:', error);
    return {
      success: false,
      data: [],
      message: '获取支出列表失败'
    };
  }
}

/**
 * 批量审核通过费用
 */
export const batchApproveExpenses = async (ids: number[]): Promise<ApiResponse<any>> => {
  try {
    const response = await request.put<ApiResponse<any>>('/expenses/batch/approve', { ids });
    return response;
  } catch (error) {
    console.error('批量审核通过失败:', error);
    return {
      success: false,
      data: null,
      message: '批量审核通过失败'
    };
  }
}

/**
 * 批量拒绝费用
 */
export const batchRejectExpenses = async (ids: number[], comment?: string): Promise<ApiResponse<any>> => {
  try {
    const response = await request.put<ApiResponse<any>>('/expenses/batch/reject', { ids, comment });
    return response;
  } catch (error) {
    console.error('批量拒绝失败:', error);
    return {
      success: false,
      data: null,
      message: '批量拒绝失败'
    };
  }
}

/**
 * 批量删除费用
 */
export const batchDeleteExpenses = async (ids: number[]): Promise<ApiResponse<any>> => {
  try {
    const response = await request.del<ApiResponse<any>>('/expenses/batch', { data: { ids } });
    return response;
  } catch (error) {
    console.error('批量删除失败:', error);
    return {
      success: false,
      data: null,
      message: '批量删除失败'
    };
  }
}

/**
 * 导出费用数据
 */
export const exportExpenses = async (params?: { [key: string]: any }): Promise<ApiResponse<any>> => {
  try {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await request.get<ApiResponse<any>>(`/expenses/export${queryString}`);
    return response;
  } catch (error) {
    console.error('导出费用数据失败:', error);
    return {
      success: false,
      data: null,
      message: '导出费用数据失败'
    };
  }
}

/**
 * 获取收款码列表
 */
export const getQRCodes = async (params?: { [key: string]: any }): Promise<ApiResponse<PaymentQRCode[]>> => {
  try {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await request.get<ApiResponse<PaymentQRCode[]>>(`/qr-codes${queryString}`);
    // 确保返回的数据结构符合预期
    if (response.success && response.data && response.data.data) {
      return {
        ...response,
        data: response.data.data
      };
    }
    return response;
  } catch (error) {
    console.error('获取收款码失败:', error);
    return {
      success: false,
      data: [],
      message: '获取收款码失败'
    };
  }
}

/**
 * 确认支付
 */
export const confirmPayment = async (data: ConfirmPaymentRequest): Promise<ApiResponse<any>> => {
  try {
    const response = await request.post<ApiResponse<any>>('/payment/confirm', data);
    return response;
  } catch (error) {
    console.error('确认支付失败:', error);
    return {
      success: false,
      data: null,
      message: '确认支付失败'
    };
  }
}

/**
 * 获取待审核支出列表
 */
export const getPendingExpenses = async (params?: { [key: string]: any }): Promise<ApiResponse<ExpenseItem[]>> => {
  try {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await request.get<ApiResponse<ExpenseItem[]>>(`/expenses/pending${queryString}`);
    // 确保返回的数据结构符合预期
    if (response.success && response.data) {
      // 处理后端返回的双层嵌套结构，可能是 { data: { items: [...] } } 或 { data: [...] }
      if (response.data.items) {
        // 如果是 { data: { items: [...] } } 格式，提取 items 作为 data
        return {
          ...response,
          data: response.data.items
        };
      } else if (Array.isArray(response.data)) {
        // 如果直接是数组，保持原样
        return response;
      } else if (response.data.data) {
        // 兼容 { data: { data: [...] } } 格式
        return {
          ...response,
          data: response.data.data
        };
      }
    }
    return response;
  } catch (error) {
    console.error('获取待审核支出列表失败:', error);
    return {
      success: false,
      data: [],
      message: '获取待审核支出列表失败'
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
  createExpense,
  saveDraft,
  uploadFile,
  deleteFile,
  getExpenseList,
  getPendingExpenses,
  batchApproveExpenses,
  batchRejectExpenses,
  batchDeleteExpenses,
  exportExpenses,
  getQRCodes,
  confirmPayment,
  reviewExpense
}

export default expenseService