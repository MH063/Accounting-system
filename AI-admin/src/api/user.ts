import api from './index'

// 用户相关API
export const userApi = {
  // 获取用户列表
  getUsers: (params?: { page?: number; pageSize?: number; keyword?: string; role?: string; status?: string; dormitory?: string }) => 
    api.get('/users', { params }),
  
  // 获取用户详情
  getUserById: (id: number) => 
    api.get(`/users/${id}`),
  
  // 创建用户
  createUser: (data: any) => 
    api.post('/users', data),
  
  // 更新用户
  updateUser: (id: number, data: any) => 
    api.put(`/users/${id}`, data),
  
  // 删除用户
  deleteUser: (id: number) => 
    api.delete(`/users/${id}`),
  
  // 批量删除用户
  batchDeleteUsers: (userIds: number[]) => 
    api.delete('/users/batch', { data: { userIds } }),
  
  // 批量启用用户
  batchEnableUsers: (userIds: number[]) => 
    api.put('/users/batch/enable', { userIds }),
  
  // 批量禁用用户
  batchDisableUsers: (userIds: number[]) => 
    api.put('/users/batch/disable', { userIds }),
  
  // 重置用户密码
  resetUserPassword: (id: number, newPassword?: string) => 
    api.put(`/users/${id}/password/reset`, { newPassword }),
  
  // 获取用户登录日志
  getUserLoginLogs: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/users/${id}/login-logs`, { params }),
  
  // 获取用户权限角色
  getUserRoles: (id: number) => 
    api.get(`/users/${id}/roles`),
  
  // 更新用户权限角色
  updateUserRoles: (id: number, roleIds: number[]) => 
    api.put(`/users/${id}/roles`, { roleIds }),
  
  // 获取用户所属寝室信息
  getUserDormitory: (id: number) => 
    api.get(`/users/${id}/dormitory`),
  
  // 获取用户支付记录
  getUserPaymentRecords: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/users/${id}/payments`, { params }),
  
  // 用户登录验证（如果需要）
  login: (data: { username: string; password: string }) => 
    api.post('/auth/login', data),
  
  // 获取用户统计信息
  getUserStats: () => 
    api.get('/users/stats'),
  
  // 批量导入用户
  importUsers: (formData: FormData) => 
    api.post('/users/import', formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    }),
  
  // 批量更新用户角色
  batchUpdateRoles: (userIds: number[], role: string) => 
    api.put('/users/batch/roles', { userIds, role }),
  
  // 批量分配寝室
  batchAssignDormitory: (userIds: number[], dormitoryInfo: any) => 
    api.put('/users/batch/dormitory', { userIds, dormitoryInfo })
}

// 系统相关API
export const systemApi = {
  // 获取系统统计信息
  getSystemStats: () => 
    api.get('/stats'),
  
  // 获取系统日志
  getLogs: (params?: { page?: number; pageSize?: number; level?: string }) => 
    api.get('/logs', { params }),
  
  // 执行系统健康检查
  healthCheck: () => 
    api.post('/health/check'),  
  // 获取数据库表信息
  getTables: () => 
    api.get('/tables'),
  
  // 客户端相关操作
  restartClient: () => 
    api.post('/client/restart'),
  
  getClientConfig: () => 
    api.get('/client/config'),
  
  updateClient: () => 
    api.post('/client/update'),
  
  // 后端相关操作
  restartBackend: () => 
    api.post('/backend/restart'),
  
  getBackendConfig: () => 
    api.get('/backend/config'),
  
  updateBackend: () => 
    api.post('/backend/update'),
  
  // 数据库相关操作
  backupDatabase: () => 
    api.post('/database/backup'),
  
  optimizeDatabase: () => 
    api.post('/database/optimize'),
  
  repairDatabase: () => 
    api.post('/database/repair'),
  
  // 告警信息相关操作
  exportAlerts: () => 
    api.get('/alerts/export'),
  
  clearAlerts: () => 
    api.delete('/alerts'),
  
  // 检查网络状态
  checkNetworkStatus: () => 
    api.get('/network/status'),
  
  // 导出用户数据
  exportUsers: (params?: { format: 'excel' | 'csv', keyword?: string, role?: string, status?: string, dormitory?: string }) => 
    api.get('/users/export', { params, responseType: 'blob' }),
  
  // 下载模板文件
  downloadTemplate: (type: string) => 
    api.get(`/templates/${type}`, { responseType: 'blob' })
}