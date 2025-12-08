import api from './index'

// 管理员行为监督相关API
export const adminBehaviorApi = {
  // 获取管理员行为统计数据
  getBehaviorStats: () => 
    api.get('/admin-behavior/stats'),
  
  // 获取管理员行为列表
  getBehaviorList: (params?: { 
    page?: number; 
    pageSize?: number; 
    adminId?: number; 
    behaviorType?: string; 
    riskLevel?: string; 
    startTime?: string; 
    endTime?: string;
    keyword?: string;
  }) => 
    api.get('/admin-behavior/list', { params }),
  
  // 获取管理员行为详情
  getBehaviorDetail: (id: number) => 
    api.get(`/admin-behavior/${id}`),
  
  // 获取管理员列表
  getAdminList: () => 
    api.get('/admin-behavior/admins'),
  
  // 获取行为轨迹分析
  getBehaviorTrack: (adminId: number, params?: { 
    startTime?: string; 
    endTime?: string; 
  }) => 
    api.get(`/admin-behavior/track/${adminId}`, { params }),
  
  // 获取异常操作告警列表
  getAbnormalAlerts: (params?: { 
    page?: number; 
    pageSize?: number; 
    level?: string; 
    status?: string; 
  }) => 
    api.get('/admin-behavior/alerts', { params }),
  
  // 标记告警为已处理
  markAlertAsHandled: (alertId: number) => 
    api.put(`/admin-behavior/alerts/${alertId}/handle`),
  
  // 获取操作统计分析报告
  getOperationReport: (params?: { 
    type?: string; 
    startTime?: string; 
    endTime?: string; 
    adminId?: number;
  }) => 
    api.get('/admin-behavior/reports', { params }),
  
  // 导出监督记录
  exportBehaviorRecords: (params?: { 
    format?: 'excel' | 'csv';
    adminId?: number; 
    behaviorType?: string; 
    riskLevel?: string; 
    startTime?: string; 
    endTime?: string;
  }) => 
    api.get('/admin-behavior/export', { params, responseType: 'blob' }),
  
  // 封禁管理员
  blockAdmin: (adminId: number, reason?: string) => 
    api.put(`/admin-behavior/admins/${adminId}/block`, { reason }),
  
  // 解封管理员
  unblockAdmin: (adminId: number) => 
    api.put(`/admin-behavior/admins/${adminId}/unblock`),
  
  // 实时获取最新行为记录
  getLatestBehaviors: (limit?: number) => 
    api.get('/admin-behavior/latest', { params: { limit } }),
  
  // 获取管理员行为趋势数据
  getBehaviorTrend: (params?: { 
    type?: 'daily' | 'weekly' | 'monthly';
    startTime?: string; 
    endTime?: string; 
    adminId?: number;
  }) => 
    api.get('/admin-behavior/trend', { params })
}