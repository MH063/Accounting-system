import api from './index'

// 用户相关API
export const userApi = {
  // 获取用户列表
  getUsers: (params?: { page?: number; pageSize?: number; keyword?: string }) => 
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
  
  // 用户登录验证（如果需要）
  login: (data: { username: string; password: string }) => 
    api.post('/auth/login', data),
  
  // 获取用户统计信息
  getUserStats: () => 
    api.get('/users/stats')
}

// 系统相关API
export const systemApi = {
  // 获取系统统计信息
  getSystemStats: () => 
    api.get('/stats'),
  
  // 获取系统日志
  getLogs: (params?: { page?: number; pageSize?: number; level?: string }) => 
    api.get('/logs', { params }),
  
  // 获取数据库表信息
  getTables: () => 
    api.get('/tables')
}
