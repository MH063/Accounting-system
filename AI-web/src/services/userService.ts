import type { ApiResponse } from '@/types'
import dataEncryptionManager from './dataEncryptionManager'
// 导入请求函数
import { request } from '@/utils/request'

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
    console.log('调用获取当前用户信息API')
    
    // 调用真实API获取当前用户信息
    const response = await request<{user: UserInfo}>('/auth/profile')
    
    // 如果启用了数据加密，尝试解密敏感信息
    if (dataEncryptionManager.isEncryptionEnabled() && response.data.user.name) {
      // 检查是否已有主密钥，如果没有则从存储中加载
      if (!dataEncryptionManager.hasMasterKey()) {
        // 设置主密钥（实际应用中应从安全存储获取）
        const masterKey = localStorage.getItem('master_encryption_key') || 'default_master_key'
        dataEncryptionManager.setMasterKey(masterKey)
      }
      
      try {
        // 解密用户姓名和邮箱（如果它们是加密的）
        response.data.user.name = dataEncryptionManager.decryptField(response.data.user.name)
        if (response.data.user.email) {
          response.data.user.email = dataEncryptionManager.decryptField(response.data.user.email)
        }
      } catch (error) {
        console.warn('解密用户信息失败:', error)
        // 如果解密失败，保持加密状态
      }
    }
    
    // 转换响应格式以匹配期望的UserInfo格式
    return {
      ...response,
      data: response.data.user
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
    
    // 准备要更新的数据
    let updateData = { ...userData }
    
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
          updateData.name = dataEncryptionManager.encryptField(userData.name)
        }
        
        if (userData.email) {
          updateData.email = dataEncryptionManager.encryptField(userData.email)
        }
      } catch (error) {
        console.warn('加密用户信息失败:', error)
        // 如果加密失败，仍然使用原始值
        updateData = userData
      }
    }
    
    // 调用真实API更新用户信息
    const response = await request<UserInfo>('/users/current', {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
    
    return response
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
    
    // 构建查询参数
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('size', size.toString())
    
    // 调用真实API获取用户列表
    const response = await request<{
      records: UserInfo[]
      total: number
      page: number
      size: number
      pages: number
    }>(`/users?${params.toString()}`)
    
    return response
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return {
      success: false,
      data: {
        records: [],
        total: 0,
        page,
        size,
        pages: 0
      },
      message: '获取用户列表失败',
      code: 500
    }
  }
}

/**
 * 保存个人信息
 * @param personalData 个人数据
 * @returns 保存结果的API响应
 */
export const savePersonalInfo = async (personalData: {
  username: string
  realName: string
  gender: 'male' | 'female' | 'secret'
  birthday: string
  phone: string
  email: string
  bio: string
  privacySettings?: {
    showProfile: boolean
    showContact: boolean
    allowSearch: boolean
  }
}): Promise<ApiResponse<UserInfo>> => {
  try {
    console.log('调用保存个人信息API:', personalData)
    
    // 准备要保存的数据
    let saveData = { ...personalData }
    
    // 如果启用了数据加密，加密敏感信息
    if (dataEncryptionManager.isEncryptionEnabled() && (personalData.realName || personalData.phone || personalData.email)) {
      // 检查是否已有主密钥，如果没有则从存储中加载
      if (!dataEncryptionManager.hasMasterKey()) {
        // 设置主密钥（实际应用中应从安全存储获取）
        const masterKey = localStorage.getItem('master_encryption_key') || 'default_master_key'
        dataEncryptionManager.setMasterKey(masterKey)
      }
      
      try {
        // 加密用户姓名、手机和邮箱
        if (personalData.realName) {
          saveData.realName = dataEncryptionManager.encryptField(personalData.realName)
        }
        
        if (personalData.phone) {
          saveData.phone = dataEncryptionManager.encryptField(personalData.phone)
        }
        
        if (personalData.email) {
          saveData.email = dataEncryptionManager.encryptField(personalData.email)
        }
      } catch (error) {
        console.warn('加密个人信息失败:', error)
        // 如果加密失败，仍然使用原始值
        saveData = personalData
      }
    }
    
    // 调用真实API保存个人信息
    const response = await request<UserInfo>('/users/personal-info', {
      method: 'POST',
      body: JSON.stringify(saveData)
    })
    
    return response
  } catch (error) {
    console.error('保存个人信息失败:', error)
    return {
      success: false,
      data: {} as UserInfo,
      message: '保存个人信息失败',
      code: 500
    }
  }
}

/**
 * 同步个人信息
 * @returns 同步结果的API响应
 */
export const syncPersonalInfo = async (): Promise<ApiResponse<UserInfo>> => {
  try {
    console.log('调用同步个人信息API')
    
    // 调用真实API同步个人信息
    const response = await request<UserInfo>('/users/personal-info/sync', {
      method: 'POST'
    })
    
    return response
  } catch (error) {
    console.error('同步个人信息失败:', error)
    return {
      success: false,
      data: {} as UserInfo,
      message: '同步个人信息失败',
      code: 500
    }
  }
}