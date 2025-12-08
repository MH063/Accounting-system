import api from './index'

// 操作审计记录接口类型定义
export interface AuditRecord {
  id: number
  user: string
  operationType: 'create' | 'update' | 'delete' | 'query' | 'export' | 'login' | 'logout'
  module: 'user' | 'dormitory' | 'fee' | 'payment' | 'system'
  description: string
  ipAddress: string
  browser: string
  os: string
  operateTime: string
  result: 'success' | 'fail'
  duration: number
  requestParams?: string
  responseResult?: string
}

// 异常行为记录接口类型定义
export interface AbnormalBehavior {
  id: number
  user: string
  behaviorType: 'frequent_login' | 'abnormal_export' | 'sensitive_operation' | 'mass_operation'
  description: string
  operateTime: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

// 操作链追踪记录接口类型定义
export interface OperationTrace {
  sequence: number
  time: string
  operation: string
  ip: string
  result: 'success' | 'fail'
}

// 审计统计接口类型定义
export interface AuditStats {
  todayOperations: number
  activeUsers: number
  abnormalOperations: number
  coverageRate: number
}

// 操作审计API
export const operationAuditApi = {
  // 获取操作审计记录列表
  getAuditRecords: (params?: { 
    page?: number; 
    pageSize?: number; 
    user?: string; 
    operationType?: string; 
    module?: string;
    startTime?: string;
    endTime?: string;
  }) => 
    api.get('/operation-audit/records', { params }),
  
  // 获取操作审计统计信息
  getAuditStats: () => 
    api.get('/operation-audit/stats'),
  
  // 获取异常行为记录
  getAbnormalBehaviors: (params?: { 
    page?: number; 
    pageSize?: number; 
    user?: string; 
    behaviorType?: string;
    riskLevel?: string;
  }) => 
    api.get('/operation-audit/abnormal-behaviors', { params }),
  
  // 获取操作链追踪记录
  getOperationTraces: (operationId: number) => 
    api.get(`/operation-audit/traces/${operationId}`),
  
  // 导出审计数据
  exportAuditData: (params?: {
    user?: string;
    operationType?: string;
    module?: string;
    startTime?: string;
    endTime?: string;
    format?: 'excel' | 'csv' | 'json';
  }) => 
    api.get('/operation-audit/export', { params, responseType: 'blob' }),
  
  // 重放操作
  replayOperation: (operationId: number) => 
    api.post(`/operation-audit/replay/${operationId}`),
  
  // 获取操作详情
  getAuditRecordDetail: (id: number) => 
    api.get(`/operation-audit/records/${id}`)
}