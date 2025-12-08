import api from './index'

// 寝室相关API
export const dormitoryApi = {
  // 获取寝室列表
  getDormitoryList: (params?: { 
    page?: number; 
    pageSize?: number; 
    dormNumber?: string; 
    building?: string; 
    status?: string 
  }) => 
    api.get('/dormitories', { params }),
  
  // 获取寝室详情
  getDormitoryDetail: (id: number) => 
    api.get(`/dormitories/${id}`),
  
  // 创建新寝室
  createDormitory: (data: any) => 
    api.post('/dormitories', data),
  
  // 更新寝室信息
  updateDormitory: (id: number, data: any) => 
    api.put(`/dormitories/${id}`, data),
  
  // 删除寝室
  deleteDormitory: (id: number) => 
    api.delete(`/dormitories/${id}`),
  
  // 批量删除寝室
  batchDeleteDormitories: (ids: number[]) => 
    api.delete('/dormitories/batch', { data: { ids } }),
  
  // 更新寝室状态
  updateDormitoryStatus: (id: number, status: string) => 
    api.put(`/dormitories/${id}/status`, { status }),
  
  // 获取楼栋列表
  getBuildings: () => 
    api.get('/buildings'),
  
  // 获取寝室统计信息
  getDormitoryStats: () => 
    api.get('/dormitories/stats'),
  
  // 获取寝室入住情况
  getDormitoryOccupancy: (id: number) => 
    api.get(`/dormitories/${id}/occupancy`),
  
  // 获取寝室成员列表
  getDormitoryMembers: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/dormitories/${id}/members`, { params }),
  
  // 添加寝室成员
  addDormitoryMember: (id: number, userId: number) => 
    api.post(`/dormitories/${id}/members`, { userId }),
  
  // 移除寝室成员
  removeDormitoryMember: (id: number, userId: number) => 
    api.delete(`/dormitories/${id}/members/${userId}`),
  
  // 获取寝室费用统计
  getDormitoryFeeStats: (id: number) => 
    api.get(`/dormitories/${id}/fee-stats`),
  
  // 冻结寝室
  freezeDormitory: (id: number) => 
    api.post(`/dormitories/${id}/freeze`),
  
  // 解冻寝室
  unfreezeDormitory: (id: number) => 
    api.post(`/dormitories/${id}/unfreeze`),
  
  // 设置缴费人
  setPayer: (id: number, userId: number) => 
    api.post(`/dormitories/${id}/payer`, { userId }),
  
  // 获取缴费人
  getPayer: (id: number) => 
    api.get(`/dormitories/${id}/payer`),
  
  // 解散寝室
  dissolveDormitory: (id: number) => 
    api.post(`/dormitories/${id}/dissolve`),
  
  // 获取维修记录
  getMaintenanceRecords: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/dormitories/${id}/maintenance-records`, { params })
}