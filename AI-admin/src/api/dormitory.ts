import api from './index'

/**
 * 寝室相关 API
 * 对接后端 /api/dorms 路径下的接口
 */
export const dormitoryApi = {
  /**
   * 获取寝室列表
   * @param params 分页和筛选参数
   */
  getDormitoryList: (params?: { 
    page?: number; 
    pageSize?: number; 
    dormNumber?: string; 
    building?: string; 
    status?: string 
  }) => 
    api.get('/dorms', { params }),
  
  /**
   * 获取寝室详情
   * @param id 寝室 ID
   */
  getDormitoryDetail: (id: number) => 
    api.get(`/dorms/${id}`),
  
  /**
   * 创建新寝室
   * @param data 寝室数据
   */
  createDormitory: (data: any) => 
    api.post('/dorms', data),
  
  /**
   * 更新寝室信息
   * @param id 寝室 ID
   * @param data 寝室数据
   */
  updateDormitory: (id: number, data: any) => 
    api.put(`/dorms/${id}`, data),
  
  /**
   * 更新寝室状态
   * @param id 寝室 ID
   * @param status 新状态
   */
  updateDormitoryStatus: (id: number, status: string) => 
    api.patch(`/dorms/${id}/status`, { status }),
  
  /**
   * 删除寝室
   * @param id 寝室 ID
   */
  deleteDormitory: (id: number) => 
    api.delete(`/dorms/${id}`),
  
  /**
   * 批量删除寝室
   * @param ids 寝室 ID 数组
   */
  batchDeleteDormitories: (ids: number[]) => 
    api.post('/dorms/batch-delete', { ids }),
  
  /**
   * 批量更新寝室状态
   * @param ids 寝室 ID 数组
   * @param status 新状态
   */
  batchUpdateDormitoryStatus: (ids: number[], status: string) => 
    api.post('/dorms/batch-update-status', { ids, status }),
  
  /**
   * 获取楼栋列表
   */
  getBuildings: () => 
    api.get('/dorms/buildings'),
  
  /**
   * 获取寝室统计信息
   */
  getDormitoryStats: () => 
    api.get('/dorms/stats'),
  
  /**
   * 获取寝室成员列表
   * @param id 寝室 ID
   */
  getDormitoryMembers: (id: number) => 
    api.get(`/dorms/${id}/members`),
  
  /**
   * 添加寝室成员
   * @param id 寝室 ID
   * @param userId 用户 ID
   */
  addDormitoryMember: (id: number, userId: number) => 
    api.post(`/dorms/${id}/members`, { userId }),
  
  /**
   * 移除寝室成员
   * @param userDormId 用户寝室关系 ID
   */
  removeDormitoryMember: (userDormId: number) => 
    api.delete(`/dorms/members/${userDormId}`),
  
  /**
   * 更新寝室成员角色
   * @param userDormId 用户寝室关系 ID
   * @param roleData 角色数据
   */
  updateMemberRole: (userDormId: number, roleData: { memberRole: string }) => 
    api.put(`/dorms/members/${userDormId}/role`, roleData),

  /**
   * 获取寝室设置
   * @param id 寝室 ID
   */
  getDormSettings: (id: number) => 
    api.get(`/dorms/${id}/settings`),

  /**
   * 更新寝室设置
   * @param id 寝室 ID
   * @param settings 设置数据
   */
  updateDormSettings: (id: number, settings: any) => 
    api.put(`/dorms/${id}/settings/update`, settings),

  /**
   * 获取寝室变更历史
   * @param id 寝室 ID
   */
  getDormHistory: (id: number, params?: { page?: number; limit?: number }) => 
    api.get(`/dorms/${id}/history`, { params }),

  /**
   * 开始解散流程
   * @param id 寝室 ID
   */
  startDismissProcess: (id: number) => 
    api.post(`/dorms/${id}/dismiss/start`),

  /**
   * 确认解散
   * @param id 寝室 ID
   */
  confirmDismiss: (id: number) => 
    api.post(`/dorms/${id}/dismiss/confirm`),

  /**
   * 取消解散
   * @param id 寝室 ID
   */
  cancelDismiss: (id: number) => 
    api.post(`/dorms/${id}/dismiss/cancel`),

  /**
   * 获取待结算费用
   * @param id 寝室 ID
   */
  getPendingFees: (id: number) => 
    api.get(`/dorms/${id}/pending-fees`),

  /**
   * 获取可添加用户列表
   * @param id 寝室 ID
   * @param params 查询参数
   */
  getAvailableUsers: (id: number, params?: { search?: string; limit?: number; offset?: number }) => 
    api.get(`/dorms/${id}/available-users`, { params }),

  /**
   * 获取宿舍费用统计摘要
   * @param id 寝室 ID
   */
  getDormFeeSummary: (id: number) => 
    api.get(`/dorms/${id}/fee-summary`),

  /**
   * 获取宿舍维修记录
   * @param id 寝室 ID
   * @param params 查询参数
   */
  getDormMaintenanceRecords: (id: number, params?: { page?: number; limit?: number; status?: string }) => 
    api.get(`/dorms/${id}/maintenance`, { params })
}