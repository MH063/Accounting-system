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
  refreshAdminToken: () =>
    api.post('/admin/refresh-token'),
  
  // 验证管理员令牌
  verifyAdminToken: () =>
    api.get('/admin/verify')
}

export default adminAuthApi