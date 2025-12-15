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

// 注册请求参数
export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
  nickname?: string  // 昵称（可选）
  phone?: string     // 手机号（可选）
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
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
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
    const response = await request<ApiResponse<RegisterResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData)
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

// 登出响应接口
export interface LogoutResponse {
  sessionToken: string
  status: string
}

/**
 * 用户登出
 * @returns 登出结果的API响应
 */
export const logout = async (): Promise<ApiResponse<LogoutResponse>> => {
  try {
    console.log('用户登出')
    
    // 获取sessionToken
    const sessionInfo = localStorage.getItem('session_info')
    let sessionToken = ''
    
    if (sessionInfo) {
      try {
        const sessionData = JSON.parse(sessionInfo)
        sessionToken = sessionData.sessionToken || ''
      } catch (error) {
        console.error('解析会话信息失败:', error)
      }
    }
    
    // 如果没有sessionToken，使用默认的空字符串
    const logoutData = {
      sessionToken: sessionToken
    }
    
    console.log('调用登出API，请求参数:', logoutData)
    
    // 调用真实API进行登出，路径为 /api/auth/logout
    const response = await request<ApiResponse<LogoutResponse>>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify(logoutData)
    })
    
    console.log('登出API返回响应:', response)
    
    // 清除本地存储的认证信息
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expires')
    localStorage.removeItem('user_info')
    localStorage.removeItem('session_info')
    
    return response
  } catch (error) {
    console.error('登出失败:', error)
    // 即使API调用失败，也要清除本地存储
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expires')
    localStorage.removeItem('user_info')
    localStorage.removeItem('session_info')
    
    return {
      success: true,
      data: { sessionToken: '', status: 'revoked' },
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
    const response = await request<ApiResponse<AuthUser>>('/auth/me')
    
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
    const response = await request<ApiResponse<RefreshTokenResponse>>('/api/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token })
    })
    
    // 更新本地存储的令牌信息
    if (response.success && response.data) {
      const responseData = response.data;
      localStorage.setItem('access_token', responseData.accessToken)
      localStorage.setItem('refresh_token', responseData.refreshToken)
      localStorage.setItem('token_expires', (Date.now() + responseData.expiresIn * 1000).toString())
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
    const response = await request<ApiResponse<null>>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(resetData)
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
    const response = await request<ApiResponse<null>>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(changeData)
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
 * 优先使用本地验证，避免不必要的 API 调用
 * @returns 检查结果
 */
export const validateToken = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('access_token')
    const expires = localStorage.getItem('token_expires')
    
    // 检查令牌是否存在
    if (!token) {
      console.log('validateToken: 令牌不存在')
      return false
    }
    
    // 如果没有过期时间，认为令牌有效（兼容旧数据）
    if (!expires) {
      console.log('validateToken: 无过期时间信息，认为有效')
      return true
    }
    
    const now = Date.now()
    const expiresTime = parseInt(expires)
    
    // 检查令牌是否过期
    if (now >= expiresTime) {
      console.log('validateToken: 令牌已过期，尝试刷新')
      // 如果令牌已过期，尝试刷新
      const refreshResult = await refreshToken()
      return refreshResult.success
    }
    
    console.log('validateToken: 令牌有效')
    // 令牌存在且未过期，直接返回 true
    return true
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

// 两步验证相关接口

// 两步验证请求参数
export interface TwoFactorVerifyRequest {
  userId: number
  code: string
  codeType: string  // 'totp', 'sms', 'email', 'backup'
}

// 两步验证响应
export interface TwoFactorVerifyResponse {
  verified: boolean
  token?: string
  sessionId?: string
  expiresAt?: string
}

// 两步验证状态响应
export interface TwoFactorStatusResponse {
  enabled: boolean
  totpEnabled: boolean
  smsEnabled: boolean
  emailEnabled: boolean
  backupCodesCount: number
  lastEnabledAt?: string
}

// 两步验证配置请求
export interface TwoFactorEnableRequest {
  method: string  // 'totp', 'sms', 'email'
  phone?: string
  email?: string
}

// 两步验证配置响应
export interface TwoFactorEnableResponse {
  qrCode?: string
  secret?: string
  backupCodes?: string[]
  method: string
  enabled: boolean
}

// 两步验证代码生成请求
export interface TwoFactorCodeGenerateRequest {
  userId: number
  method: string  // 'sms', 'email'
  phone?: string
  email?: string
}

// 两步验证代码生成响应
export interface TwoFactorCodeGenerateResponse {
  sent: boolean
  method: string
  expiresAt: string
  cooldown: number
}

/**
 * 验证两步验证码
 * @param verifyData 验证数据
 * @returns 验证结果的API响应
 */
export const verifyTwoFactor = async (verifyData: TwoFactorVerifyRequest): Promise<ApiResponse<TwoFactorVerifyResponse>> => {
  try {
    console.log('验证两步验证码:', { userId: verifyData.userId, codeType: verifyData.codeType })
    
    const response = await request<ApiResponse<TwoFactorVerifyResponse>>('/api/auth/two-factor/verify', {
      method: 'POST',
      body: JSON.stringify(verifyData)
    })
    
    console.log('两步验证API返回响应:', response)
    
    return response
  } catch (error) {
    console.error('两步验证失败:', error)
    return {
      success: false,
      data: { verified: false },
      message: '验证失败，请检查验证码后重试',
      code: 400
    }
  }
}

/**
 * 获取两步验证状态
 * @param userId 用户ID
 * @returns 状态查询结果的API响应
 */
export const getTwoFactorStatus = async (userId: number): Promise<ApiResponse<TwoFactorStatusResponse>> => {
  try {
    console.log('获取两步验证状态:', userId)
    
    // 确保能获取到刚保存的令牌
    const token = localStorage.getItem('access_token')
    console.log('当前访问令牌:', token ? token.slice(0, 20) + '...' : '未找到')
    
    const response = await request<ApiResponse<TwoFactorStatusResponse>>(`/api/auth/two-factor/status?userId=${userId}`, {
      method: 'GET'
    })
    
    console.log('两步验证状态API返回响应:', response)
    
    return response
  } catch (error) {
    console.error('获取两步验证状态失败:', error)
    return {
      success: false,
      data: { 
        enabled: false, 
        totpEnabled: false, 
        smsEnabled: false, 
        emailEnabled: false, 
        backupCodesCount: 0 
      },
      message: '获取状态失败',
      code: 400
    }
  }
}

/**
 * 启用两步验证
 * @param enableData 启用数据
 * @returns 启用结果的API响应
 */
export const enableTwoFactor = async (enableData: TwoFactorEnableRequest): Promise<ApiResponse<TwoFactorEnableResponse>> => {
  try {
    console.log('启用两步验证:', enableData)
    
    const response = await request<ApiResponse<TwoFactorEnableResponse>>('/api/auth/two-factor/enable', {
      method: 'POST',
      body: JSON.stringify(enableData)
    })
    
    console.log('启用两步验证API返回响应:', response)
    
    return response
  } catch (error) {
    console.error('启用两步验证失败:', error)
    return {
      success: false,
      data: { enabled: false, method: enableData.method },
      message: '启用两步验证失败',
      code: 400
    }
  }
}

/**
 * 禁用两步验证
 * @param method 验证方式
 * @returns 禁用结果的API响应
 */
export const disableTwoFactor = async (method: string): Promise<ApiResponse<{ disabled: boolean; method: string }>> => {
  try {
    console.log('禁用两步验证:', method)
    
    const response = await request<ApiResponse<{ disabled: boolean; method: string }>>('/api/auth/two-factor/disable', {
      method: 'POST',
      body: JSON.stringify({ method })
    })
    
    console.log('禁用两步验证API返回响应:', response)
    
    return response
  } catch (error) {
    console.error('禁用两步验证失败:', error)
    return {
      success: false,
      data: { disabled: false, method },
      message: '禁用两步验证失败',
      code: 400
    }
  }
}

/**
 * 生成两步验证验证码
 * @param generateData 生成数据
 * @returns 生成结果的API响应
 */
export const generateTwoFactorCode = async (generateData: TwoFactorCodeGenerateRequest): Promise<ApiResponse<TwoFactorCodeGenerateResponse>> => {
  try {
    console.log('生成两步验证验证码:', generateData)
    
    const response = await request<ApiResponse<TwoFactorCodeGenerateResponse>>('/api/auth/two-factor/generate', {
      method: 'POST',
      body: JSON.stringify(generateData)
    })
    
    console.log('生成验证码API返回响应:', response)
    
    return response
  } catch (error) {
    console.error('生成验证码失败:', error)
    return {
      success: false,
      data: { sent: false, method: generateData.method, expiresAt: '', cooldown: 0 },
      message: '生成验证码失败',
      code: 400
    }
  }
}

// 默认导出认证服务对象
export default {
  register,
  logout,
  getCurrentAuthUser,
  refreshToken,
  resetPassword,
  changePassword,
  validateToken,
  getLocalUserInfo,
  clearLocalAuth,
  verifyTwoFactor,
  getTwoFactorStatus,
  enableTwoFactor,
  disableTwoFactor,
  generateTwoFactorCode
}