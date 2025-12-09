import api from './index'

// 新功能发布相关API
export const newFeatureReleaseApi = {
  // 获取新功能列表
  getNewFeatures: (params?: { 
    page?: number; 
    pageSize?: number; 
    keyword?: string; 
    status?: string;
    targetUsers?: string;
    releaseStrategy?: string;
  }) => 
    api.get('/new-features', { params }),
  
  // 获取新功能详情
  getNewFeatureDetail: (id: number) => 
    api.get(`/new-features/${id}`),
  
  // 创建新功能
  createNewFeature: (data: any) => 
    api.post('/new-features', data),
  
  // 更新新功能
  updateNewFeature: (id: number, data: any) => 
    api.put(`/new-features/${id}`, data),
  
  // 删除新功能
  deleteNewFeature: (id: number) => 
    api.delete(`/new-features/${id}`),
  
  // 批量删除新功能
  batchDeleteNewFeatures: (ids: number[]) => 
    api.delete('/new-features/batch', { data: { ids } }),
  
  // 发布新功能
  publishNewFeature: (id: number, publishData?: any) => 
    api.post(`/new-features/${id}/publish`, publishData),
  
  // 回滚新功能
  rollbackNewFeature: (id: number, rollbackData: { reason: string }) => 
    api.post(`/new-features/${id}/rollback`, rollbackData),
  
  // 获取新功能发布进度
  getPublishProgress: (id: number) => 
    api.get(`/new-features/${id}/publish-progress`),
  
  // 获取新功能统计信息
  getNewFeatureStats: () => 
    api.get('/new-features/stats'),
  
  // 执行兼容性检查
  checkCompatibility: (id: number, checkData?: any) => 
    api.post(`/new-features/${id}/compatibility-check`, checkData),
  
  // 获取兼容性检查结果
  getCompatibilityResult: (id: number) => 
    api.get(`/new-features/${id}/compatibility-result`),
  
  // 上传热更新包
  uploadHotUpdatePackage: (id: number, formData: FormData) => 
    api.post(`/new-features/${id}/hot-update-package`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  // 获取热更新包列表
  getHotUpdatePackages: (id: number) => 
    api.get(`/new-features/${id}/hot-update-packages`),
  
  // 删除热更新包
  deleteHotUpdatePackage: (id: number, packageId: number) => 
    api.delete(`/new-features/${id}/hot-update-packages/${packageId}`),
  
  // 下载热更新包
  downloadHotUpdatePackage: (id: number, packageId: number) => 
    api.get(`/new-features/${id}/hot-update-packages/${packageId}/download`, {
      responseType: 'blob'
    }),
  
  // 获取发布活动历史
  getPublishActivities: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/new-features/${id}/publish-activities`, { params }),
  
  // 获取回滚记录
  getRollbackHistory: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/new-features/${id}/rollback-history`, { params })
}