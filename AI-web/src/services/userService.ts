import type { ApiResponse } from '@/types'
import dataEncryptionManager from './dataEncryptionManager'

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
    
    // 检查是否启用了数据加密
    const userId = '1'
    let mockUserInfo: UserInfo = {
      id: userId,
      name: username,
      email: 'admin@example.com',
      avatar: 'https://picsum.photos/200/200?random=1',
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
    
    // 如果启用了数据加密，尝试解密敏感信息
    if (dataEncryptionManager.isEncryptionEnabled()) {
      // 检查是否已有主密钥，如果没有则从存储中加载
      if (!dataEncryptionManager.hasMasterKey()) {
        // 设置主密钥（实际应用中应从安全存储获取）
        const masterKey = localStorage.getItem('master_encryption_key') || 'default_master_key'
        dataEncryptionManager.setMasterKey(masterKey)
      }
      
      try {
        // 解密用户姓名和邮箱（如果它们是加密的）
        const encryptedName = localStorage.getItem(`encrypted_user_name_${userId}`)
        const encryptedEmail = localStorage.getItem(`encrypted_user_email_${userId}`)
        
        if (encryptedName) {
          mockUserInfo.name = dataEncryptionManager.decryptField(encryptedName)
        }
        
        if (encryptedEmail) {
          mockUserInfo.email = dataEncryptionManager.decryptField(encryptedEmail)
        }
      } catch (error) {
        console.warn('解密用户信息失败:', error)
        // 如果解密失败，使用原始值
      }
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
    
    // 获取当前用户ID
    const userId = '1'
    
    // 如果启用了数据加密，加密敏感信息
    if (dataEncryptionManager.isEncryptionEnabled() && (userData.name || userData.email)) {
      // 检查是否已有主密钥，如果没有则从存储中加载
      if (!dataEncryptionManager.hasMasterKey()) {
        // 设置主密钥（实际应用中应从安全存储获取）
        const masterKey = localStorage.getItem('master_encryption_key') || 'default_master_key'
        dataEncryptionManager.setMasterKey(masterKey)
      }
      
      try {
        // 加密用户姓名和邮箱
        if (userData.name) {
          const encryptedName = dataEncryptionManager.encryptField(userData.name)
          localStorage.setItem(`encrypted_user_name_${userId}`, encryptedName)
        }
        
        if (userData.email) {
          const encryptedEmail = dataEncryptionManager.encryptField(userData.email)
          localStorage.setItem(`encrypted_user_email_${userId}`, encryptedEmail)
        }
      } catch (error) {
        console.warn('加密用户信息失败:', error)
        // 如果加密失败，仍然使用原始值
      }
    }
    
    // 模拟更新成功
    const updatedUser: UserInfo = {
      id: userId,
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