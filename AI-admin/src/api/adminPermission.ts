import apiRequest from './index'

// 管理员账户接口类型定义
export interface AdminAccount {
  id: number
  username: string
  email: string
  phone: string
  realName: string
  avatar?: string
  status: 'active' | 'inactive' | 'locked' | 'pending'
  roleIds: number[]
  roleNames: string[]
  lastLoginTime?: string
  lastLoginIp?: string
  createTime: string
  updateTime: string
  createdBy: number
  updatedBy: number
}

// 权限角色接口类型定义
export interface PermissionRole {
  id: number
  name: string
  code: string
  description: string
  permissions: string[]
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
  createdBy: number
  updatedBy: number
}

// 权限变更历史记录接口类型定义
export interface PermissionChangeHistory {
  id: number
  adminId: number
  adminName: string
  changeType: 'create' | 'update' | 'delete' | 'status_change' | 'password_reset' | 'permission_change'
  changeDescription: string
  oldValue?: string
  newValue?: string
  operatorId: number
  operatorName: string
  ipAddress: string
  changeTime: string
  approved: boolean
  approvedBy?: number
  approvedByName?: string
  approvedTime?: string
  remark?: string
}

// 登录记录接口类型定义
export interface LoginRecord {
  loginTime: string
  ipAddress: string
  browser: string
  success: boolean
}

// 权限审批流程接口类型定义
export interface PermissionApprovalProcess {
  id: number
  title: string
  type: 'create_admin' | 'modify_permission' | 'reset_password' | 'change_status' | 'delete_admin'
  applicantId: number
  applicantName: string
  targetAdminId?: number
  targetAdminName?: string
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  currentStep: number
  totalSteps: number
  currentApproverId?: number
  currentApproverName?: string
  applyTime: string
  completedTime?: string
  remark?: string
}

// 管理员账户API
export const adminAccountApi = {
  // 获取管理员账户列表
  getAdminAccounts: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) => {
    return apiRequest.get('/admin/accounts', { params })
  },
  
  // 获取管理员账户详情
  getAdminAccountDetail: (id: number) => {
    return apiRequest.get(`/admin/accounts/${id}`)
  },
  
  // 创建管理员账户
  createAdminAccount: (data: Partial<AdminAccount>) => {
    return apiRequest.post('/admin/accounts', data)
  },
  
  // 更新管理员账户
  updateAdminAccount: (id: number, data: Partial<AdminAccount>) => {
    return apiRequest.put(`/admin/accounts/${id}`, data)
  },
  
  // 删除管理员账户
  deleteAdminAccount: (id: number) => {
    return apiRequest.delete(`/admin/accounts/${id}`)
  },
  
  // 重置管理员密码
  resetAdminPassword: (id: number, newPassword: string, verificationCode?: string, reason?: string) => {
    return apiRequest.put(`/admin/accounts/${id}/password`, { newPassword, verificationCode, reason })
  },
  
  // 更改管理员状态
  changeAdminStatus: (id: number, status: string) => {
    return apiRequest.put(`/admin/accounts/${id}/status`, { status })
  },
  
  // 获取管理员权限变更历史
  getAdminPermissionHistory: (adminId: number, params?: { page?: number; pageSize?: number }) => {
    return apiRequest.get(`/admin/accounts/${adminId}/permission-history`, { params })
  },

  // 获取管理员登录历史
  getAdminLoginHistory: (adminId: number) => {
    return apiRequest.get(`/admin/accounts/${adminId}/login-history`)
  }
}

// 权限角色API
export const permissionRoleApi = {
  // 获取权限角色列表
  getPermissionRoles: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) => {
    return apiRequest.get('/admin/roles', { params })
  },
  
  // 获取权限角色详情
  getPermissionRoleDetail: (id: number) => {
    return apiRequest.get(`/admin/roles/${id}`)
  },
  
  // 创建权限角色
  createPermissionRole: (data: Partial<PermissionRole>) => {
    return apiRequest.post('/admin/roles', data)
  },
  
  // 更新权限角色
  updatePermissionRole: (id: number, data: Partial<PermissionRole>) => {
    return apiRequest.put(`/admin/roles/${id}`, data)
  },
  
  // 删除权限角色
  deletePermissionRole: (id: number) => {
    return apiRequest.delete(`/admin/roles/${id}`)
  },
  
  // 获取所有可用权限
  getAvailablePermissions: () => {
    return apiRequest.get('/admin/permissions')
  }
}

// 权限变更历史API
export const permissionHistoryApi = {
  // 获取权限变更历史列表
  getPermissionChangeHistory: (params?: { 
    page?: number; 
    pageSize?: number; 
    adminId?: number; 
    changeType?: string; 
    startTime?: string; 
    endTime?: string 
  }) => {
    return apiRequest.get('/admin/permission-history', { params })
  },
  
  // 获取权限变更历史详情
  getPermissionChangeHistoryDetail: (id: number) => {
    return apiRequest.get(`/admin/permission-history/${id}`)
  }
}

// 权限审批流程API
export const permissionApprovalApi = {
  // 获取权限审批流程列表
  getPermissionApprovalProcesses: (params?: { 
    page?: number; 
    pageSize?: number; 
    status?: string; 
    type?: string; 
    applicantId?: number 
  }) => {
    return apiRequest.get('/admin/approval-processes', { params })
  },
  
  // 获取权限审批流程详情
  getPermissionApprovalProcessDetail: (id: number) => {
    return apiRequest.get(`/admin/approval-processes/${id}`)
  },
  
  // 创建权限审批申请
  createPermissionApprovalProcess: (data: Partial<PermissionApprovalProcess>) => {
    return apiRequest.post('/admin/approval-processes', data)
  },
  
  // 审批权限申请
  approvePermissionProcess: (id: number, approved: boolean, remark?: string) => {
    return apiRequest.put(`/admin/approval-processes/${id}/approve`, { approved, remark })
  },
  
  // 取消权限申请
  cancelPermissionProcess: (id: number, remark?: string) => {
    return apiRequest.put(`/admin/approval-processes/${id}/cancel`, { remark })
  }
}

// 统计数据API
export const adminStatsApi = {
  // 获取管理员权限管理统计数据
  getAdminPermissionStats: () => {
    return apiRequest.get('/admin/permission-stats')
  }
}

// 导出API
export const adminExportApi = {
  // 导出管理员账户记录
  exportAdminAccounts: (params?: { 
    keyword?: string; 
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiRequest.get('/admin/accounts/export', { 
      params, 
      responseType: 'blob' 
    })
  },
  
  // 导出权限角色记录
  exportPermissionRoles: (params?: { 
    keyword?: string; 
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiRequest.get('/admin/roles/export', { 
      params, 
      responseType: 'blob' 
    })
  },
  
  // 导出权限变更历史
  exportPermissionHistory: (params?: { 
    adminId?: number; 
    changeType?: string;
    startTime?: string;
    endTime?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiRequest.get('/admin/permission-history/export', { 
      params, 
      responseType: 'blob' 
    })
  },
  
  // 导出权限审批流程
  exportApprovalProcesses: (params?: { 
    status?: string; 
    type?: string;
    applicantId?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    return apiRequest.get('/admin/approval-processes/export', { 
      params, 
      responseType: 'blob' 
    })
  },
  
  // 导出完整权限管理记录
  exportAllPermissionData: (params?: { 
    keyword?: string; 
    startDate?: string;
    endDate?: string;
  }) => {
    return apiRequest.get('/admin/export-all', { 
      params, 
      responseType: 'blob' 
    })
  }
}