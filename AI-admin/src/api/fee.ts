import api from './index'

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
    api.delete('/expenses/clear-all')
}

/**
 * 费用管理相关API接口
 * 提供费用记录的增删改查、批量操作和统计功能
 */