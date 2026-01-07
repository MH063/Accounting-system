import api from './index'

// 费用类型数据接口
export interface FeeType {
  id: number
  name: string
  code: string
  description: string
  defaultAmount: number
  billingCycle: 'one-time' | 'monthly' | 'semester' | 'yearly'
  allocationRule: 'average' | 'dormitory' | 'none'
  usageCount: number
  sortOrder: number
  status: 'enabled' | 'disabled'
  createTime: string
  updateTime: string
}

// 费用类型查询参数
export interface FeeTypeQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  billingCycle?: string
  allocationRule?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

// 费用相关API
export const feeApi = {
  // 获取费用记录列表
  getFeeRecordList: (params?: { 
    page?: number; 
    pageSize?: number; 
    studentName?: string; 
    feeType?: string; 
    status?: string;
    auditStatus?: string;
    dateRange?: string[];
  }) => 
    api.get('/fee-records', { params }),
  
  // 获取费用详情
  getFeeDetail: (id: number) => 
    api.get(`/fee-records/${id}`),
  
  // 创建新费用记录
  createFeeRecord: (data: any) => 
    api.post('/fee-records', data),
  
  // 更新费用记录
  updateFeeRecord: (id: number, data: any) => 
    api.put(`/fee-records/${id}`, data),
  
  // 删除费用记录
  deleteFeeRecord: (id: number) => 
    api.delete(`/fee-records/${id}`),
  
  // 批量审核费用记录
  batchAuditFeeRecords: (ids: number[], status: string) => 
    api.post('/fee-records/batch-audit', { ids, status }),
  
  // 批量更新费用状态
  batchUpdateFeeStatus: (ids: number[], status: string) => 
    api.post('/fee-records/batch-update-status', { ids, status }),
  
  // 获取费用统计
  getFeeStatistics: (params?: { 
    dateRange?: string[];
    feeType?: string;
  }) => 
    api.get('/fee-records/statistics', { params }),
  
  // 记录缴费
  recordPayment: (feeId: number, paymentData: any) => 
    api.post(`/fee-records/${feeId}/payment`, paymentData),
  
  // 获取缴费历史
  getPaymentHistory: (feeId: number) => 
    api.get(`/fee-records/${feeId}/payment-history`),
  
  // 获取待审核费用列表
  getPendingExpenses: (params?: any) => 
    api.get('/expenses/pending', { params }),
    
  // 费用管理相关API（使用expenses接口）
  getExpenseList: (params?: any) => 
    api.get('/expenses', { params }),
    
  getExpenseDetail: (id: number) => 
    api.get(`/expenses/${id}`),
    
  createExpense: (data: any) => 
    api.post('/expenses', data),
    
  updateExpense: (id: number, data: any) => 
    api.put(`/expenses/${id}`, data),
    
  deleteExpense: (id: number) => 
    api.delete(`/expenses/${id}`),
    
  batchApproveExpenses: (ids: number[]) => 
    api.put('/expenses/batch/approve', { ids }),
    
  batchRejectExpenses: (ids: number[], comment?: string) => 
    api.put('/expenses/batch/reject', { ids, comment }),
    
  batchDeleteExpenses: (ids: number[]) => 
    api.delete('/expenses/batch', { data: { ids } }),
    
  reviewExpense: (id: number, data: { status: string; comment?: string }) => 
    api.put(`/expenses/${id}/review`, data),
    
  exportExpenses: (params?: any) => 
    api.get('/expenses/export', { params }),
    
  getExpenseStatistics: (params?: any) => 
    api.get('/expenses/statistics', { params }),
    
  saveDraft: (data: any) => 
    api.post('/expenses/draft', data),
    
  clearAllExpenses: () => 
    api.delete('/expenses/clear-all'),

  // ==================== 费用类型管理API ====================

  // 获取费用类型列表
  getFeeTypeList: (params?: FeeTypeQueryParams) => 
    api.get<{
      list: FeeType[]
      pagination: {
        total: number
        page: number
        pageSize: number
        totalPages: number
      }
    }>('/fee-types', { params }),

  // 获取费用类型详情
  getFeeTypeDetail: (id: number) => 
    api.get<{
      feeType: FeeType
    }>(`/fee-types/${id}`),

  // 新增费用类型
  createFeeType: (data: Partial<FeeType>) => 
    api.post<{
      feeType: FeeType
    }>('/fee-types', data),

  // 编辑费用类型
  updateFeeType: (id: number, data: Partial<FeeType>) => 
    api.put<{
      feeType: FeeType
    }>(`/fee-types/${id}`, data),

  // 删除费用类型
  deleteFeeType: (id: number) => 
    api.delete(`/fee-types/${id}`),

  // 更新费用类型状态
  updateFeeTypeStatus: (id: number, status: 'enabled' | 'disabled') => 
    api.put<{
      feeType: FeeType
    }>(`/fee-types/${id}/status`, { status }),

  // 导入费用类型
  importFeeTypes: (file: File, options?: { overwrite?: boolean }) => {
    const formData = new FormData()
    formData.append('file', file)
    if (options?.overwrite) {
      formData.append('overwrite', 'true')
    }
    return api.post<{
      total: number
      success: number
      failed: number
      errors: Array<{ row: number; message: string }>
    }>('/fee-types/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 导出费用类型
  exportFeeTypes: (params?: { status?: string; search?: string }) => 
    api.get('/fee-types/export', { 
      params,
      responseType: 'blob'
    })
}

/**
 * 费用管理相关API接口
 * 提供费用记录的增删改查、批量操作和统计功能
 */