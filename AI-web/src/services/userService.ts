import type { ApiResponse } from '@/types'

// 用户信息接口
export interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  permissions: string[]
  createdAt: string
  updatedAt: string
}

/**
 * 获取当前用户信息
 * @returns 用户信息的API响应
 */
export const getCurrentUser = async (): Promise<ApiResponse<UserInfo>> => {
  try {
    // 模拟API调用，实际项目中这里应该是真实的API请求
    console.log('调用获取当前用户信息API')
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟从localStorage获取用户信息（实际项目中应该从后端API获取）
    let username = '管理员'
    if (typeof window !== 'undefined' && window.localStorage) {
      username = window.localStorage.getItem('username') || '管理员'
    }
    
    const mockUserInfo: UserInfo = {
      id: '1',
      name: username,
      email: 'admin@example.com',
      avatar: 'https://picsum.photos/200/200?random=1',
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
    
    return {
      success: true,
      data: mockUserInfo,
      message: '获取用户信息成功'
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      success: false,
      data: {} as UserInfo,
      message: '获取用户信息失败',
      code: 500
    }
  }
}

/**
 * 更新用户信息
 * @param userData 用户数据
 * @returns 更新结果的API响应
 */
export const updateUser = async (userData: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> => {
  try {
    console.log('调用更新用户信息API:', userData)
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟更新成功
    const updatedUser: UserInfo = {
      id: '1',
      name: userData.name || '管理员',
      email: userData.email || 'admin@example.com',
      avatar: userData.avatar || 'https://picsum.photos/200/200?random=1',
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    }
    
    return {
      success: true,
      data: updatedUser,
      message: '更新用户信息成功'
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return {
      success: false,
      data: {} as UserInfo,
      message: '更新用户信息失败',
      code: 500
    }
  }
}

/**
 * 获取用户列表（管理员功能）
 * @param page 页码
 * @param size 每页大小
 * @returns 用户列表的API响应
 */
export const getUserList = async (page: number = 1, size: number = 10): Promise<ApiResponse<{
  records: UserInfo[]
  total: number
  page: number
  size: number
  pages: number
}>> => {
  try {
    console.log(`调用获取用户列表API: page=${page}, size=${size}`)
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // 模拟用户列表数据
    const mockUsers: UserInfo[] = Array.from({ length: size }, (_, index) => ({
      id: `${page * size + index + 1}`,
      name: `用户${page * size + index + 1}`,
      email: `user${page * size + index + 1}@example.com`,
      avatar: `https://picsum.photos/200/200?random=${page * size + index + 1}`,
      role: index % 3 === 0 ? 'admin' : 'user',
      permissions: index % 3 === 0 ? ['read', 'write', 'delete'] : ['read'],
      createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    return {
      success: true,
      data: {
        records: mockUsers,
        total: 100,
        page,
        size,
        pages: Math.ceil(100 / size)
      },
      message: '获取用户列表成功'
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return {
      success: false,
      data: { records: [], total: 0, page: 1, size: 10, pages: 0 },
      message: '获取用户列表失败',
      code: 500
    }
  }
}