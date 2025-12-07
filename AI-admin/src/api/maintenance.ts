import api from './index'

// 维护模式相关API
export const maintenanceApi = {
  // 启动维护模式
  startMaintenance: (data: { duration: number; message: string }) => 
    api.post('/maintenance/start', data),
  
  // 获取维护模式状态
  getMaintenanceStatus: () => 
    api.get('/maintenance/status'),
  
  // 取消维护模式
  cancelMaintenance: () => 
    api.post('/maintenance/cancel'),
  
  // 获取维护历史
  getMaintenanceHistory: (params?: { page?: number; pageSize?: number }) => 
    api.get('/maintenance/history', { params })
}