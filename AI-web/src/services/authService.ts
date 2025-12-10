import type { ApiResponse } from '@/types'
// 导入请求函数
import { request } from '@/utils/request'

// 用户认证信息接口
export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  permissions: string[]
  createdAt: string
  updatedAt: string
}

// 登录请求参数
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
  deviceInfo?: {
    deviceId: string
    deviceName: string
    platform: string
    browser: string
  }
}

// 登录响应
export interface LoginResponse {
  token: string
  refreshToken: string
  expiresIn: number
  user: AuthUser
}

// 注册请求参数
export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
  verificationCode?: string
  inviteCode?: string
}

// 注册响应
export interface RegisterResponse {
  user: AuthUser
  token: string
  refreshToken: string
}

// 重置密码请求
export interface ResetPasswordRequest {
  email: string
  newPassword: string
  verificationCode: string
}

// 修改密码请求
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// 刷新令牌请求
export interface RefreshTokenRequest {
  refreshToken: string
}

// 刷新令牌响应
export interface RefreshTokenResponse {
  token: string
  refreshToken: string
  expiresIn: number
}

/**
 * 用户登录
 * @param loginData 登录数据
 * @returns 登录结果的API响应
 */
export const login = async (loginData: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  try {
    console.log('用户登录:', loginData.email)
    
    // 调用真实API进行登录
    const response = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      data: loginData
    })
    
    // 登录成功后保存令牌到本地存储
    if (response.success && response.data) {
      localStorage.setItem('access_token', response.data.token)
      localStorage.setItem('refresh_token', response.data.refreshToken)
      localStorage.setItem('token_expires', (Date.now() + response.data.expiresIn * 1000).toString())
      localStorage.setItem('user_info', JSON.stringify(response.data.user))
    }
    
    return response
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      data: {} as LoginResponse,
      message: '登录失败，请检查用户名和密码',
      code: 401
    }
  }
}

/**
 * 用户注册
 * @param registerData 注册数据
 * @returns 注册结果的API响应
 */
export const register = async (registerData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
  try {
    console.log('用户注册:', registerData.email)
    
    // 调用真实API进行注册
    const response = await request<RegisterResponse>('/auth/register', {
      method: 'POST',
      data: registerData
    })
    
    // 注册成功后保存令牌到本地存储
    if (response.success && response.data) {
      localStorage.setItem('access_token', response.data.token)
      localStorage.setItem('refresh_token', response.data.refreshToken)
      localStorage.setItem('token_expires', (Date.now() + 24 * 60 * 60 * 1000).toString()) // 默认24小时
      localStorage.setItem('user_info', JSON.stringify(response.data.user))
    }
    
    return response
  } catch (error) {
    console.error('注册失败:', error)
    return {
      success: false,
      data: {} as RegisterResponse,
      message: '注册失败，请检查输入信息',
      code: 400
    }
  }
}

/**
 * 用户登出
 * @returns 登出结果的API响应
 */
export const logout = async (): Promise<ApiResponse<null>> => {
  try {
    console.log('用户登出')
    
    // 调用真实API进行登出
    const response = await request<null>('/auth/logout', {
      method: 'POST'
    })
    
    // 清除本地存储的认证信息
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expires')
    localStorage.removeItem('user_info')
    
    return response
  } catch (error) {
    console.error('登出失败:', error)
    // 即使API调用失败，也要清除本地存储
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expires')
    localStorage.removeItem('user_info')
    
    return {
      success: true,
      data: null,
      message: '登出成功'
    }
  }
}

/**
 * 获取当前用户信息
 * @returns 用户信息的API响应
 */
export const getCurrentAuthUser = async (): Promise<ApiResponse<AuthUser>> => {
  try {
    console.log('获取当前用户信息')
    
    // 调用真实API获取当前用户信息
    const response = await request<AuthUser>('/auth/me')
    
    // 更新本地存储的用户信息
    if (response.success && response.data) {
      localStorage.setItem('user_info', JSON.stringify(response.data))
    }
    
    return response
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      success: false,
      data: {} as AuthUser,
      message: '获取用户信息失败',
      code: 401
    }
  }
}

/**
 * 刷新访问令牌
 * @param refreshTokenData 刷新令牌数据
 * @returns 刷新结果的API响应
 */
export const refreshToken = async (refreshTokenData?: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> => {
  try {
    console.log('刷新访问令牌')
    
    // 如果没有提供刷新令牌，从本地存储获取
    const token = refreshTokenData?.refreshToken || localStorage.getItem('refresh_token')
    
    if (!token) {
      return {
        success: false,
        data: {} as RefreshTokenResponse,
        message: '刷新令牌不存在',
        code: 401
      }
    }
    
    // 调用真实API刷新令牌
    const response = await request<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
      data: { refreshToken: token }
    })
    
    // 更新本地存储的令牌信息
    if (response.success && response.data) {
      localStorage.setItem('access_token', response.data.token)
      localStorage.setItem('refresh_token', response.data.refreshToken)
      localStorage.setItem('token_expires', (Date.now() + response.data.expiresIn * 1000).toString())
    }
    
    return response
  } catch (error) {
    console.error('刷新令牌失败:', error)
    return {
      success: false,
      data: {} as RefreshTokenResponse,
      message: '刷新令牌失败',
      code: 401
    }
  }
}

/**
 * 重置密码
 * @param resetData 重置密码数据
 * @returns 重置结果的API响应
 */
export const resetPassword = async (resetData: ResetPasswordRequest): Promise<ApiResponse<null>> => {
  try {
    console.log('重置密码:', resetData.email)
    
    // 调用真实API重置密码
    const response = await request<null>('/auth/reset-password', {
      method: 'POST',
      data: resetData
    })
    
    return response
  } catch (error) {
    console.error('重置密码失败:', error)
    return {
      success: false,
      data: null,
      message: '重置密码失败',
      code: 400
    }
  }
}

/**
 * 修改密码
 * @param changeData 修改密码数据
 * @returns 修改结果的API响应
 */
export const changePassword = async (changeData: ChangePasswordRequest): Promise<ApiResponse<null>> => {
  try {
    console.log('修改密码')
    
    // 调用真实API修改密码
    const response = await request<null>('/auth/change-password', {
      method: 'POST',
      data: changeData
    })
    
    return response
  } catch (error) {
    console.error('修改密码失败:', error)
    return {
      success: false,
      data: null,
      message: '修改密码失败',
      code: 400
    }
  }
}

/**
 * 检查令牌是否有效
 * @returns 检查结果
 */
export const validateToken = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('access_token')
    const expires = localStorage.getItem('token_expires')
    
    // 检查令牌是否存在且未过期
    if (!token || !expires) {
      return false
    }
    
    const now = Date.now()
    const expiresTime = parseInt(expires)
    
    // 如果令牌已过期，尝试刷新
    if (now >= expiresTime) {
      const refreshResult = await refreshToken()
      return refreshResult.success
    }
    
    // 调用真实API验证令牌
    const response = await request<{ valid: boolean }>('/auth/validate')
    
    return response.valid
  } catch (error) {
    console.error('验证令牌失败:', error)
    return false
  }
}

/**
 * 获取本地存储的用户信息
 * @returns 用户信息或null
 */
export const getLocalUserInfo = (): AuthUser | null => {
  try {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      return JSON.parse(userInfo)
    }
    return null
  } catch (error) {
    console.error('获取本地用户信息失败:', error)
    return null
  }
}

/**
 * 清除本地认证信息
 */
export const clearLocalAuth = (): void => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('token_expires')
  localStorage.removeItem('user_info')
}

// 默认导出认证服务对象
export default {
  login,
  register,
  logout,
  getCurrentAuthUser,
  refreshToken,
  resetPassword,
  changePassword,
  validateToken,
  getLocalUserInfo,
  clearLocalAuth
}