import api from './index'

// 灰度发布控制相关API
export const grayReleaseControlApi = {
  // 获取灰度策略列表
  getGrayReleaseStrategies: (params?: { 
    page?: number; 
    pageSize?: number; 
    keyword?: string; 
    status?: string;
    featureName?: string;
  }) => 
    api.get('/gray-release-strategies', { params }),
  
  // 获取灰度策略详情
  getGrayReleaseStrategyDetail: (id: number) => 
    api.get(`/gray-release-strategies/${id}`),
  
  // 创建灰度策略
  createGrayReleaseStrategy: (data: any) => 
    api.post('/gray-release-strategies', data),
  
  // 更新灰度策略
  updateGrayReleaseStrategy: (id: number, data: any) => 
    api.put(`/gray-release-strategies/${id}`, data),
  
  // 删除灰度策略
  deleteGrayReleaseStrategy: (id: number) => 
    api.delete(`/gray-release-strategies/${id}`),
  
  // 批量删除灰度策略
  batchDeleteGrayReleaseStrategies: (ids: number[]) => 
    api.delete('/gray-release-strategies/batch', { data: { ids } }),
  
  // 启动灰度策略
  startGrayReleaseStrategy: (id: number) => 
    api.post(`/gray-release-strategies/${id}/start`),
  
  // 暂停灰度策略
  pauseGrayReleaseStrategy: (id: number) => 
    api.post(`/gray-release-strategies/${id}/pause`),
  
  // 恢复灰度策略
  resumeGrayReleaseStrategy: (id: number) => 
    api.post(`/gray-release-strategies/${id}/resume`),
  
  // 获取灰度策略统计信息
  getGrayReleaseStrategyStats: () => 
    api.get('/gray-release-strategies/stats'),
  
  // 动态调整发布比例
  adjustReleasePercentage: (id: number, percentage: number) => 
    api.post(`/gray-release-strategies/${id}/adjust-percentage`, { percentage }),
  
  // 手动调整发布比例
  manualAdjustPercentage: (id: number, percentage: number) => 
    api.post(`/gray-release-strategies/${id}/manual-adjust`, { percentage }),
  
  // 触发自动回滚
  triggerAutoRollback: (id: number, reason: string) => 
    api.post(`/gray-release-strategies/${id}/auto-rollback`, { reason }),
  
  // 获取监控数据
  getMonitoringData: (id: number) => 
    api.get(`/gray-release-strategies/${id}/monitoring-data`),
  
  // 获取A/B测试数据
  getABTestData: (id: number) => 
    api.get(`/gray-release-strategies/${id}/ab-test-data`),
  
  // 获取多变量测试数据
  getMultivariateTestData: (id: number) => 
    api.get(`/gray-release-strategies/${id}/multivariate-test-data`),
  
  // 获取用户反馈数据
  getUserFeedback: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/gray-release-strategies/${id}/user-feedback`, { params }),
  
  // 获取反馈分类统计数据
  getFeedbackCategoryStats: (id: number) => 
    api.get(`/gray-release-strategies/${id}/feedback-category-stats`),
  
  // 获取情感分析数据
  getSentimentData: (id: number) => 
    api.get(`/gray-release-strategies/${id}/sentiment-data`),
  
  // 获取回滚历史记录
  getRollbackHistory: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/gray-release-strategies/${id}/rollback-history`, { params }),
  
  // 发送回滚通知
  sendRollbackNotification: (id: number, notificationData: any) => 
    api.post(`/gray-release-strategies/${id}/send-notification`, notificationData)
}