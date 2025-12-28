import type { ApiResponse } from '@/types'
import dataEncryptionManager from './dataEncryptionManager'
// 导入请求函数
import { request, upload } from '@/utils/request'

// 用户信息接口
export interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string
  avatar_url?: string // 兼容后端字段名
  role: string
  permissions: string[]
  createdAt: string
  updatedAt: string
}

/**
 * 上传头像
 * @param file 头像文件
 * @returns 上传结果
 */
export const uploadAvatarAPI = async (file: File): Promise<ApiResponse<{avatar: string}>> => {
  try {
    console.log('调用上传头像API')
    // 后端要求字段名为 'avatar'
    const response = await upload<{avatar: string}>('/users/avatar', file, 'avatar')
    
    // 处理双层嵌套结构 (Rule 5)
    if (response && response.success) {
      const actualData = (response.data as any)?.data || response.data
      return {
        ...response,
        data: actualData
      }
    }
    
    return response
  } catch (error) {
    console.error('上传头像失败:', error)
    return {
      success: false,
      data: { avatar: '' },
      message: '上传头像失败',
      code: 500
    }
  }
}

/**
 * 获取完整的头像URL
 * @param avatarPath 头像路径或URL
 * @returns 完整的头像URL
 */
export const getFullAvatarUrl = (avatarPath: string | undefined): string => {
  if (!avatarPath || !avatarPath.trim()) return '';
  
  // 如果是完整URL或base64，直接返回
  if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  
  // 如果是相对路径，添加后端基础URL
  // 从 import.meta.env.VITE_API_BASE_URL 获取基础URL，或者使用默认值
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://10.111.53.9:4000/api';
  const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  
  // 确保路径以 / 开头
  const normalizedPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  
  return `${baseUrl}${normalizedPath}`;
}

/**
 * 获取默认头像地址
 * @param seed 用于生成随机图片的种子（如用户ID或邮箱）
 * @param size 图片尺寸
 * @returns 默认头像URL
 */
export const getDefaultAvatar = (seed: string = 'user', size: number = 200): string => {
  // 使用 DiceBear 生成更美观的头像，seed 确保同一个用户头像一致
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&size=${size}`
}

/**
 * 获取用户头像URL（带回退逻辑）
 * @param avatarPath 头像路径
 * @param email 用户邮箱
 * @param name 用户姓名/用户名
 * @returns 完整的头像URL或默认头像URL
 */
export const getUserAvatar = (avatarPath: string | undefined, email?: string, name?: string): string => {
  const fullUrl = getFullAvatarUrl(avatarPath);
  if (fullUrl) return fullUrl;
  
  // 使用 email 或 name 作为种子，确保一致性
  return getDefaultAvatar(email || name || 'user');
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
    
    // 处理双层嵌套的数据结构
    const responseData = response.data.data || response.data;
    
    // 如果启用了数据加密，尝试解密敏感信息
    if (dataEncryptionManager.isEncryptionEnabled() && responseData.user.name) {
      // 检查是否已有主密钥，如果没有则从存储中加载
      if (!dataEncryptionManager.hasMasterKey()) {
        // 设置主密钥（实际应用中应从安全存储获取）
        const masterKey = localStorage.getItem('master_encryption_key') || 'default_master_key'
        dataEncryptionManager.setMasterKey(masterKey)
      }
      
      try {
        // 解密用户姓名和邮箱（如果它们是加密的）
        responseData.user.name = dataEncryptionManager.decryptField(responseData.user.name)
        if (responseData.user.email) {
          responseData.user.email = dataEncryptionManager.decryptField(responseData.user.email)
        }
      } catch (error) {
        console.warn('解密用户信息失败:', error)
        // 如果解密失败，保持加密状态
      }
    }
    
    // 转换响应格式以匹配期望的UserInfo格式
    const result = {
      ...response,
      data: responseData.user
    }
    
    // 同步更新本地存储中的用户信息，确保全局一致性
    if (result.success && result.data) {
      localStorage.setItem('user_info', JSON.stringify(result.data))
      // 兼容某些地方直接使用 username 的情况
      if (result.data.username) {
        localStorage.setItem('username', result.data.username)
      }
    }
    
    return result
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
    const response = await request<ApiResponse<{user: UserInfo}>>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
    
    // 处理双层嵌套结构 (Rule 5)
    if (response && response.success) {
      const responseData = (response.data as any)?.data || response.data
      const actualUser = responseData.user || responseData
      
      const result = {
        ...response,
        data: actualUser
      }

      // 同步更新本地存储中的用户信息，确保全局一致性
      if (result.success && result.data) {
        localStorage.setItem('user_info', JSON.stringify(result.data))
        if (result.data.username) {
          localStorage.setItem('username', result.data.username)
        }
      }

      return result
    }
    
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
    
    // 处理双层嵌套的数据结构 (Rule 5)
    if (response.success && response.data) {
      const actualData = (response.data as any).data || response.data;
      return {
        ...response,
        data: actualData
      };
    }
    
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
    const response = await request<ApiResponse<{user: UserInfo}>>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(saveData)
    })
    
    // 处理双层嵌套结构 (Rule 5)
    if (response && response.success) {
      const responseData = (response.data as any)?.data || response.data
      const actualUser = responseData.user || responseData
      
      const result = {
        ...response,
        data: actualUser
      }

      // 同步更新本地存储中的用户信息，确保全局一致性
      if (result.success && result.data) {
        localStorage.setItem('user_info', JSON.stringify(result.data))
        if (result.data.username) {
          localStorage.setItem('username', result.data.username)
        }
      }

      return result
    }
    
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
    const response = await request<ApiResponse<{user: UserInfo}>>('/users/personal-info/sync', {
      method: 'POST'
    })
    
    // 处理双层嵌套结构 (Rule 5)
    if (response && response.success) {
      const responseData = (response.data as any)?.data || response.data
      const actualUser = responseData.user || responseData
      
      const result = {
        ...response,
        data: actualUser
      }

      // 同步更新本地存储中的用户信息，确保全局一致性
      if (result.success && result.data) {
        localStorage.setItem('user_info', JSON.stringify(result.data))
        if (result.data.username) {
          localStorage.setItem('username', result.data.username)
        }
      }

      return result
    }
    
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