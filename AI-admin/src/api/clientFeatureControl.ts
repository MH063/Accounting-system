import api from './index'

// 客户端功能控制相关API
export const clientFeatureControlApi = {
  // 获取功能模块列表
  getFeatureModules: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) => 
    api.get('/client-features', { params }),
  
  // 获取功能模块详情
  getFeatureModuleDetail: (id: number) => 
    api.get(`/client-features/${id}`),
  
  // 创建功能模块
  createFeatureModule: (data: any) => 
    api.post('/client-features', data),
  
  // 更新功能模块
  updateFeatureModule: (id: number, data: any) => 
    api.put(`/client-features/${id}`, data),
  
  // 删除功能模块
  deleteFeatureModule: (id: number) => 
    api.delete(`/client-features/${id}`),
  
  // 批量删除功能模块
  batchDeleteFeatureModules: (ids: number[]) => 
    api.delete('/client-features/batch', { data: { ids } }),
  
  // 更新功能模块状态
  updateFeatureModuleStatus: (id: number, status: string) => 
    api.put(`/client-features/${id}/status`, { status }),
  
  // 获取功能模块统计信息
  getFeatureModuleStats: () => 
    api.get('/client-features/stats'),
  
  // 设置功能模块权限
  setFeatureModulePermissions: (id: number, permissions: any) => 
    api.put(`/client-features/${id}/permissions`, permissions),
  
  // 获取功能模块权限
  getFeatureModulePermissions: (id: number) => 
    api.get(`/client-features/${id}/permissions`),
  
  // 获取用户白名单
  getWhitelistUsers: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/client-features/${id}/whitelist-users`, { params }),
  
  // 添加用户到白名单
  addWhitelistUser: (id: number, userId: number) => 
    api.post(`/client-features/${id}/whitelist-users`, { userId }),
  
  // 从白名单移除用户
  removeWhitelistUser: (id: number, userId: number) => 
    api.delete(`/client-features/${id}/whitelist-users/${userId}`),
  
  // 获取IP白名单
  getWhitelistIPs: (id: number) => 
    api.get(`/client-features/${id}/whitelist-ips`),
  
  // 设置IP白名单
  setWhitelistIPs: (id: number, ips: string[]) => 
    api.put(`/client-features/${id}/whitelist-ips`, { ips }),
  
  // 获取功能依赖关系
  getFeatureDependencies: (id: number) => 
    api.get(`/client-features/${id}/dependencies`),
  
  // 设置功能依赖关系
  setFeatureDependencies: (id: number, dependencies: any) => 
    api.put(`/client-features/${id}/dependencies`, dependencies),
  
  // 获取功能切换历史
  getFeatureToggleHistory: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/client-features/${id}/toggle-history`, { params }),
  
  // 获取功能使用统计
  getFeatureUsageStats: (id: number, params?: { startDate?: string; endDate?: string }) => 
    api.get(`/client-features/${id}/usage-stats`, { params })
}