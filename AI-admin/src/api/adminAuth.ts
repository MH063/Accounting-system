import api from './index'

// 管理员认证相关API
export const adminAuthApi = {
  // 管理员登录
  adminLogin: (data: { username: string; password: string }) =>
    api.post('/admin/login', data),
  
  // 管理员登出
  adminLogout: () =>
    api.post('/admin/logout'),
  
  // 获取管理员资料
  getAdminProfile: () =>
    api.get('/admin/profile'),
  
  // 刷新管理员令牌
  refreshAdminToken: (refreshToken?: string) => {
    const token = refreshToken || localStorage.getItem('adminRefreshToken')
    return api.post('/admin/refresh-token', { refreshToken: token })
  },
  
  // 验证管理员令牌
  verifyAdminToken: () =>
    api.get('/admin/verify'),
  
  // 管理员心跳上报
  heartbeat: (data?: any) =>
    api.post('/admin/heartbeat', data)
}

export default adminAuthApi