/**
 * 管理端收款码管理API服务
 * 提供收款码管理相关的API调用接口
 */

import api from './index'

export interface PaymentCode {
  id: number
  name: string
  type: string
  account: string
  qrCodeUrls: string[]
  status: string
  securityStatus: string
  auditStatus: string
  usageCount: number
  lastUsedTime: string
  createTime: string
  updateTime: string
  remark: string
  merchantName: string
  merchantAccount: string
  platform: string
  userId: number
  userName: string
  lastCheckTime: string
  lastCheckResult: string
}

export interface PaginatedData<T> {
  records: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface PaymentCodeParams {
  page?: number
  size?: number
  name?: string
  type?: string
  status?: string
  securityStatus?: string
  auditStatus?: string
  startDate?: string
  endDate?: string
}

export interface CreatePaymentCodeData {
  name: string
  type: string
  account: string
  qrCodeUrls?: string[]
  status?: string
  remark?: string
  userId?: number
  merchantName?: string
}

export interface UpdatePaymentCodeData {
  name?: string
  type?: string
  account?: string
  qrCodeUrls?: string[]
  status?: string
  auditStatus?: string
  remark?: string
}

export interface SecurityCheckResult {
  checkTime: string
  result: string
  riskLevel: string
  checkItems: number
  issuesFound: number
  details: SecurityCheckDetail[]
}

export interface SecurityCheckDetail {
  item: string
  status: string
  description: string
}

export interface BatchSecurityCheckResult {
  totalCount: number
  successCount: number
  failCount: number
  results: {
    id: number
    securityStatus: string
    riskLevel: string
    issuesCount: number
    success: boolean
    error?: string
  }[]
}

export interface UsageStatistics {
  name: string
  summary: {
    totalPayments: number
    successPayments: number
    pendingPayments: number
    failedPayments: number
    successRate: number
    totalAmount: number
    avgAmount: number
    lastPaymentTime: string
  }
  dailyStats: {
    date: string
    count: number
    amount: number
  }[]
}

export interface OverallStatistics {
  total: number
  enabled: number
  disabled: number
  pending: number
  stopped: number
  safe: number
  risk: number
  abnormal: number
  approved: number
  rejected: number
  pendingAudit: number
  totalUsage: number
  todayUsage: number
}

export interface SecurityReport {
  currentStatus: string
  lastCheckTime: string
  history: {
    id: number
    checkTime: string
    result: string
    riskLevel: string
    checkItems: number
    issuesFound: number
    details: SecurityCheckDetail[]
    checkedBy: number
    createdAt: string
  }[]
}

const paymentCodeService = {
  getStatistics: (): Promise<ApiResponse<OverallStatistics>> => {
    return api.get('/admin/payment-codes/statistics')
  },

  getList: (params?: PaymentCodeParams): Promise<ApiResponse<PaginatedData<PaymentCode>>> => {
    return api.get('/admin/payment-codes', { params })
  },

  getById: (id: number): Promise<ApiResponse<PaymentCode>> => {
    return api.get(`/admin/payment-codes/${id}`)
  },

  create: (data: CreatePaymentCodeData): Promise<ApiResponse<{ id: number }>> => {
    return api.post('/admin/payment-codes', data)
  },

  update: (id: number, data: UpdatePaymentCodeData): Promise<ApiResponse<{ id: number }>> => {
    return api.put(`/admin/payment-codes/${id}`, data)
  },

  delete: (id: number): Promise<ApiResponse<{ id: number }>> => {
    return api.delete(`/admin/payment-codes/${id}`)
  },

  updateStatus: (id: number, data: { status: string; reason?: string }): Promise<ApiResponse<{ id: number; status: string }>> => {
    return api.put(`/admin/payment-codes/${id}/status`, data)
  },

  batchDelete: (ids: number[]): Promise<ApiResponse<{ deletedIds: number[]; deletedCount: number }>> => {
    return api.post('/admin/payment-codes/batch-delete', { ids })
  },

  batchDisable: (ids: number[], reason?: string): Promise<ApiResponse<{ disabledIds: number[]; disabledCount: number }>> => {
    return api.post('/admin/payment-codes/batch-disable', { ids, reason })
  },

  performSecurityCheck: (id: number): Promise<ApiResponse<SecurityCheckResult>> => {
    return api.post(`/admin/payment-codes/${id}/security-check`)
  },

  batchSecurityCheck: (ids: number[]): Promise<ApiResponse<BatchSecurityCheckResult>> => {
    return api.post('/admin/payment-codes/batch-security-check', { ids })
  },

  getSecurityReport: (id: number, limit?: number): Promise<ApiResponse<SecurityReport>> => {
    return api.get(`/admin/payment-codes/${id}/security-report`, { params: { limit } })
  },

  getUsageStatistics: (id: number, days?: number): Promise<ApiResponse<UsageStatistics>> => {
    return api.get(`/admin/payment-codes/${id}/usage-statistics`, { params: { days } })
  },

  uploadImage: async (file: File): Promise<ApiResponse<{ url: string; originalName: string }>> => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/admin/payment-codes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default paymentCodeService
