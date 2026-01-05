/**
 * 管理端支付监控API服务
 * 提供支付记录监控相关的API调用接口
 */

import api from './index'

/**
 * 支付记录监控相关类型定义
 */

/**
 * 异常信息
 */
export interface PaymentException {
  type: string
  description: string
  status: string
  handler: string
  handleTime: string
}

/**
 * 支付记录
 */
export interface PaymentRecord {
  id: number
  orderNo: string
  userName: string
  amount: number
  paymentMethod: string
  status: string
  createTime: string
  completeTime: string | null
  merchantOrderNo: string
  transactionNo: string | null
  remark: string
  exception: PaymentException | null
  isException: boolean
}

/**
 * 支付记录查询参数
 */
export interface PaymentRecordParams {
  orderNo?: string
  paymentMethod?: string
  status?: string
  startDate?: string
  endDate?: string
  dateRange?: string[]
  page?: number
  size?: number
}

/**
 * 监控统计数据
 */
export interface MonitorStats {
  todaySuccess: number
  todayFailed: number
  pendingExceptions: number
  todayAmount: number
}

/**
 * 支付状态统计数据（图表）
 */
export interface StatusChartData {
  data: {
    value: number
    name: string
    itemStyle: {
      color: string
    }
  }[]
}

/**
 * 支付方式分布数据（图表）
 */
export interface MethodChartData {
  categories: string[]
  data: number[]
}

/**
 * 支付成功率趋势数据（图表）
 */
export interface SuccessRateChartData {
  dates: string[]
  rates: number[]
}

/**
 * 支付时间分布数据（图表）
 */
export interface TimeDistributionChartData {
  timeSlots: string[]
  data: number[]
}

/**
 * 标记异常请求参数
 */
export interface MarkExceptionParams {
  type: 'timeout' | 'amount_mismatch' | 'duplicate' | 'complaint' | 'other'
  description?: string
}

/**
 * 处理异常请求参数
 */
export interface ProcessExceptionParams {
  notes?: string
}

/**
 * API响应结构
 */
interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

/**
 * 分页数据结构
 */
interface PaginatedData<T> {
  records: T[]
  total: number
  page: number
  size: number
  pages: number
}

/**
 * 管理端支付监控API服务
 */
export const paymentMonitorApi = {
  /**
   * 获取监控统计数据
   * GET /api/admin/payments/monitor/stats
   */
  getMonitorStats: async (): Promise<ApiResponse<MonitorStats>> => {
    console.log('[PaymentMonitorAPI] 获取监控统计数据')
    return api.get('/admin/payments/monitor/stats')
  },

  /**
   * 获取支付记录列表
   * GET /api/admin/payments/monitor/records
   */
  getPaymentRecords: async (params?: PaymentRecordParams): Promise<ApiResponse<PaginatedData<PaymentRecord>>> => {
    console.log('[PaymentMonitorAPI] 获取支付记录列表:', params)
    
    const requestParams = {
      ...params,
      startDate: params?.dateRange?.[0],
      endDate: params?.dateRange?.[1]
    }
    delete requestParams.dateRange
    
    return api.get('/admin/payments/monitor/records', { params: requestParams })
  },

  /**
   * 获取支付记录详情
   * GET /api/admin/payments/monitor/records/:id
   */
  getPaymentRecordDetail: async (id: number): Promise<ApiResponse<PaymentRecord>> => {
    console.log('[PaymentMonitorAPI] 获取支付记录详情:', id)
    return api.get(`/admin/payments/monitor/records/${id}`)
  },

  /**
   * 标记支付记录为异常
   * POST /api/admin/payments/monitor/records/:id/mark-exception
   */
  markException: async (id: number, data: MarkExceptionParams): Promise<ApiResponse<{ id: number; isException: boolean; exception: PaymentException }>> => {
    console.log('[PaymentMonitorAPI] 标记异常:', id, data)
    return api.post(`/admin/payments/monitor/records/${id}/mark-exception`, data)
  },

  /**
   * 处理异常记录
   * POST /api/admin/payments/monitor/records/:id/process-exception
   */
  processException: async (id: number, data?: ProcessExceptionParams): Promise<ApiResponse<{ id: number; isException: boolean; exception: PaymentException }>> => {
    console.log('[PaymentMonitorAPI] 处理异常:', id, data)
    return api.post(`/admin/payments/monitor/records/${id}/process-exception`, data || {})
  },

  /**
   * 取消异常标记
   * POST /api/admin/payments/monitor/records/:id/cancel-exception
   */
  cancelException: async (id: number, reason?: string): Promise<ApiResponse<{ id: number }>> => {
    console.log('[PaymentMonitorAPI] 取消异常标记:', id, reason)
    return api.post(`/admin/payments/monitor/records/${id}/cancel-exception`, { reason })
  },

  /**
   * 获取支付状态统计图表数据
   * GET /api/admin/payments/monitor/charts/status
   */
  getStatusChartData: async (): Promise<ApiResponse<StatusChartData>> => {
    console.log('[PaymentMonitorAPI] 获取支付状态统计图表数据')
    return api.get('/admin/payments/monitor/charts/status')
  },

  /**
   * 获取支付方式分布图表数据
   * GET /api/admin/payments/monitor/charts/methods
   */
  getMethodChartData: async (): Promise<ApiResponse<MethodChartData>> => {
    console.log('[PaymentMonitorAPI] 获取支付方式分布图表数据')
    return api.get('/admin/payments/monitor/charts/methods')
  },

  /**
   * 获取支付成功率趋势图表数据
   * GET /api/admin/payments/monitor/charts/success-rate
   */
  getSuccessRateChartData: async (days?: number): Promise<ApiResponse<SuccessRateChartData>> => {
    console.log('[PaymentMonitorAPI] 获取支付成功率趋势图表数据:', days)
    return api.get('/admin/payments/monitor/charts/success-rate', { params: { days } })
  },

  /**
   * 获取支付时间分布图表数据
   * GET /api/admin/payments/monitor/charts/time-distribution
   */
  getTimeDistributionChartData: async (): Promise<ApiResponse<TimeDistributionChartData>> => {
    console.log('[PaymentMonitorAPI] 获取支付时间分布图表数据')
    return api.get('/admin/payments/monitor/charts/time-distribution')
  },

  /**
   * 导出支付记录
   * GET /api/admin/payments/monitor/export
   */
  exportPaymentRecords: async (params?: PaymentRecordParams): Promise<Blob> => {
    console.log('[PaymentMonitorAPI] 导出支付记录:', params)
    
    const requestParams = {
      ...params,
      startDate: params?.dateRange?.[0],
      endDate: params?.dateRange?.[1]
    }
    delete requestParams.dateRange
    delete requestParams.page
    delete requestParams.size
    
    const response = await api.get('/admin/payments/monitor/export', {
      params: requestParams,
      responseType: 'blob'
    })
    
    return response.data
  }
}

export default paymentMonitorApi
