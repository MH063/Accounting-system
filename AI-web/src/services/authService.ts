import type { ApiResponse } from '@/types'
// 导入请求函数
import { request } from '@/utils/request'
// 导入身份验证存储服务
import authStorageService from './authStorageService'


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
      // 处理双层嵌套结构 (Rule 5)
      const actualData = (response.data as any).data || response.data;
      
      if (actualData.token) {
        localStorage.setItem('access_token', actualData.token)
        localStorage.setItem('refresh_token', actualData.refreshToken)
        
        // 尝试解析令牌过期时间，否则默认24小时
        let tokenExpires = Date.now() + 24 * 60 * 60 * 1000
        try {
          const payload = JSON.parse(atob(actualData.token.split('.')[1]))
          if (payload && typeof payload.exp === 'number') {
            tokenExpires = payload.exp * 1000
          }
        } catch (e) {
          console.warn('解析注册令牌过期时间失败:', e)
        }
        
        localStorage.setItem('token_expires', tokenExpires.toString())
        localStorage.setItem('user_info', JSON.stringify(actualData.user))
      }
      
      // 返回处理后的数据以符合接口期望
      return {
        ...response,
        data: actualData
      };
    }
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

// 登录用户信息接口
export interface UserInfo {
  id: number
  username: string
  email: string
  nickname: string
  phone: string
  avatar_url: string
  status: string
  email_verified: boolean
  phone_verified: boolean
  last_login_at: string
  created_at: string
}

// 登录令牌信息接口
export interface TokenInfo {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
}

// 登录会话信息接口
export interface SessionInfo {
  sessionId: number
  sessionToken: string
  deviceInfo: object
  expiresAt: string
}

// 登录响应数据接口
export interface LoginData {
  user: UserInfo
  tokens: TokenInfo
  session: SessionInfo
}

// 登录请求接口
export interface LoginRequest {
  username?: string     // 用户名（与email二选一，必填）
  email?: string        // 邮箱（与username二选一，必填）
  password: string      // 密码（必填）
  captchaCode?: string  // 验证码（可选）
  sessionId?: string    // 会话ID（可选）
}

// 登录响应接口
export interface LoginResponse {
  success: boolean
  message: string
  data: LoginData
}

// 登出响应接口
export interface LogoutResponse {
  sessionToken: string
  status: string
}

// 令牌验证请求接口
export interface ValidateTokenRequest {
  sessionToken: string
}

// 令牌验证用户信息接口
export interface ValidateTokenUser {
  id: string
  username: string
  email: string
  nickname: string
  status: string
  twoFactorEnabled: boolean
  lockedUntil: string | null
}

// 令牌验证会话信息接口
export interface ValidateTokenSession {
  sessionId: string
  status: string
  expiresAt: string
  lastAccessedAt: string
}

// 令牌验证响应数据接口
export interface ValidateTokenData {
  user: ValidateTokenUser
  session: ValidateTokenSession
}

// 令牌验证响应接口
export interface ValidateTokenResponse {
  success: boolean
  message: string
  data: ValidateTokenData
}

/**
 * 用户登录
 * @param loginData 登录数据
 * @returns 登录结果的API响应
 */
export const login = async (loginData: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  try {
    console.log('用户登录:', loginData.username || loginData.email)
    
    // 调用真实API进行登录
    const response = await request<ApiResponse<LoginResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData)
    })
    
    console.log('登录API返回响应:', response)
    
    // 登录成功后保存令牌到本地存储
    if (response.success && response.data) {
      // 处理双层嵌套结构 (Rule 5)
      const actualData = (response.data as any).data || response.data;
      
      // 使用身份验证存储服务保存完整的认证信息
      authStorageService.saveAuthData({
        user: actualData.user,
        tokens: actualData.tokens,
        session: actualData.session
      })
      
      console.log('登录成功，已保存认证信息')
      
      // 返回处理后的数据以符合接口期望
      return {
        ...response,
        data: actualData
      };
    }
    
    return response;
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
 * 用户登出
 * @returns 登出结果的API响应
 */
/**
 * 验证访问令牌
 * @param sessionToken 会话令牌
 * @returns 验证结果的API响应
 */
export const validateAccessToken = async (sessionToken: string): Promise<ApiResponse<ValidateTokenResponse>> => {
  try {
    console.log('验证访问令牌')
    
    // 调用真实API验证令牌
    const response = await request<ApiResponse<ValidateTokenResponse>>('/auth/validate-token', {
      method: 'POST',
      body: JSON.stringify({ sessionToken })
    })
    
    console.log('令牌验证API返回响应:', response)
    
    // 验证成功后更新本地存储的认证信息
    if (response.success && response.data) {
      // 处理双层嵌套结构 (Rule 5)
      const actualData = (response.data as any).data || response.data;
      
      // 确保actualData存在并且包含必要的属性
      if (actualData && typeof actualData === 'object') {
        const { user, session } = actualData;
        
        // 更新用户信息
        if (user) {
          authStorageService.saveUserInfo({
            id: user.id,
            username: user.username,
            email: user.email,
            nickname: user.nickname,
            status: user.status,
            // 其他必要字段可以按需补充
          })
        }
        
        // 更新会话信息
        if (session) {
          authStorageService.saveSessionInfo({
            sessionId: session.sessionId,
            sessionToken: session.sessionToken || sessionToken,
            expiresAt: session.expiresAt
          })
        }
        
        console.log('令牌验证成功，已更新认证信息')
      }

      // 返回处理后的数据以符合接口期望
      return {
        ...response,
        data: actualData
      };
    }
    
    return response
  } catch (error) {
    console.error('令牌验证失败:', error)
    return {
      success: false,
      data: {} as ValidateTokenResponse,
      message: '令牌验证失败',
      code: 401
    }
  }
}

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
    const response = await request<ApiResponse<LogoutResponse>>('/auth/logout', {
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
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response.data as any)?.data || response.data;
    
    // 更新本地存储的用户信息
    if (response.success && actualData) {
      localStorage.setItem('user_info', JSON.stringify(actualData))
    }
    
    return {
      ...response,
      data: actualData
    }
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
    const response = await request<ApiResponse<RefreshTokenResponse>>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token })
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response.data as any)?.data || response.data;
    
    // 更新本地存储的令牌信息
    if (response.success && actualData) {
      localStorage.setItem('access_token', actualData.accessToken)
      localStorage.setItem('refresh_token', actualData.refreshToken)
      localStorage.setItem('token_expires', (Date.now() + actualData.expiresIn * 1000).toString())
    }
    
    return {
      ...response,
      data: actualData
    }
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
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response.data as any)?.data || response.data;
    
    return {
      ...response,
      data: actualData
    }
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
    
    const response = await request<ApiResponse<null>>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(changeData)
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response.data as any)?.data || response.data;
    
    return {
      ...response,
      data: actualData
    }
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

// TOTP两步验证相关接口

// TOTP密钥生成响应
export interface TotpSecretResponse {
  secret: string
  qrCode: string
  backupCodes: string[]
  appName: string
  username: string
}

// TOTP验证请求
export interface TotpVerifyRequest {
  code: string
  secret?: string
}

// TOTP验证响应
export interface TotpVerifyResponse {
  verified: boolean
  token?: string
}

// TOTP状态响应
export interface TotpStatusResponse {
  enabled: boolean
  hasBackupCodes: boolean
}

// TOTP启用请求
export interface TotpEnableRequest {
  secret: string
  code: string
  backupCodes: string[]
}

// TOTP启用响应
export interface TotpEnableResponse {
  enabled: boolean
  message: string
}

// 备份代码重新生成响应
export interface BackupCodesRegenerateResponse {
  backupCodes: string[]
  message: string
}

/**
 * 生成TOTP两步验证密钥
 * @returns TOTP密钥生成结果的API响应
 */
export const generateTotpSecret = async (): Promise<ApiResponse<TotpSecretResponse>> => {
  try {
    console.log('生成TOTP密钥请求开始')
    
    const response = await request<ApiResponse<TotpSecretResponse>>('/auth/totp/generate', {
      method: 'POST'
    })
    
    console.log('生成TOTP密钥API完整响应:', JSON.stringify(response, null, 2))
    
    if (response && response.success && response.data) {
      // 更加健壮的解析逻辑，兼容处理双层嵌套 (Rule 5)
      let data = response.data;
      if (data && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        data = data.data;
      }
      
      console.log('服务层解析后的TOTP数据:', data)
      if (!data.qrCode && !data.secret) {
        console.warn('后端响应数据不完整，缺少 qrCode 或 secret 字段')
      }
      
      return {
        ...response,
        data
      }
    }
    
    return response
  } catch (error) {
    console.error('生成TOTP密钥失败:', error)
    return {
      success: false,
      data: {} as TotpSecretResponse,
      message: '生成密钥失败',
      code: 400
    }
  }
}

/**
 * 验证TOTP两步验证码
 * @param verifyData 验证数据
 * @returns 验证结果的API响应
 */
export const verifyTotpCode = async (verifyData: TotpVerifyRequest): Promise<ApiResponse<TotpVerifyResponse>> => {
  try {
    console.log('验证TOTP两步验证码')
    
    const response = await request<ApiResponse<TotpVerifyResponse>>('/auth/totp/verify', {
      method: 'POST',
      body: JSON.stringify(verifyData)
    })
    
    console.log('验证TOTP验证码API返回响应:', response)
    
    // 关键点：处理双层 data 结构 (Rule 5)
    if (response.data && response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      return {
        ...response,
        data: response.data.data
      }
    }
    
    return response
  } catch (error) {
    console.error('验证TOTP验证码失败:', error)
    return {
      success: false,
      data: { verified: false },
      message: '验证码验证失败',
      code: 400
    }
  }
}

/**
 * 启用TOTP两步验证
 * @param enableData 启用数据
 * @returns 启用结果的API响应
 */
export const enableTotpAuth = async (enableData: TotpEnableRequest): Promise<ApiResponse<TotpEnableResponse>> => {
  try {
    console.log('启用TOTP两步验证')
    
    const response = await request<ApiResponse<TotpEnableResponse>>('/auth/totp/enable', {
      method: 'POST',
      body: JSON.stringify(enableData)
    })
    
    console.log('启用TOTP两步验证API返回响应:', response)
    
    // 关键点：处理双层 data 结构 (Rule 5)
    if (response.data && response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      return {
        ...response,
        data: response.data.data
      }
    }
    
    return response
  } catch (error) {
    console.error('启用TOTP两步验证失败:', error)
    return {
      success: false,
      data: { enabled: false, message: '启用失败' },
      message: '启用两步验证失败',
      code: 400
    }
  }
}

/**
 * 禁用TOTP两步验证
 * @param code 6位验证码或备用码
 * @returns 禁用结果的API响应
 */
export const disableTotpAuth = async (code: string): Promise<ApiResponse<{ disabled: boolean; message: string }>> => {
  try {
    console.log('禁用TOTP两步验证')
    
    const response = await request<ApiResponse<{ disabled: boolean; message: string }>>('/auth/totp/disable', {
      method: 'POST',
      body: JSON.stringify({ code })
    })
    
    console.log('禁用TOTP两步验证API返回响应:', response)
    
    // 关键点：处理双层 data 结构 (Rule 5)
    if (response.data && response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      return {
        ...response,
        data: response.data.data
      }
    }
    
    return response
  } catch (error) {
    console.error('禁用TOTP两步验证失败:', error)
    return {
      success: false,
      data: { disabled: false, message: '禁用失败' },
      message: '禁用两步验证失败',
      code: 400
    }
  }
}

/**
 * 检查TOTP两步验证状态
 * @returns 状态查询结果的API响应
 */
export const checkTotpStatus = async (): Promise<ApiResponse<TotpStatusResponse>> => {
  try {
    console.log('检查TOTP两步验证状态')
    
    const response = await request<ApiResponse<TotpStatusResponse>>('/auth/totp/status', {
      method: 'GET'
    })
    
    console.log('检查TOTP状态API完整响应:', JSON.stringify(response, null, 2))
    
    if (response && response.success && response.data) {
      console.log('TOTP状态数据内容:', response.data)
      
      // 关键点：处理双层 data 结构 (Rule 5)
      if (response.data && response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
        return {
          ...response,
          data: response.data.data
        }
      }
    } else {
      console.warn('TOTP状态检查返回异常结构:', response)
    }
    
    return response
  } catch (error) {
    console.error('检查TOTP状态失败:', error)
    return {
      success: false,
      data: { enabled: false, hasBackupCodes: false },
      message: '检查状态失败',
      code: 400
    }
  }
}

/**
 * 重新生成备份代码
 * @param password 用户密码
 * @returns 生成结果的API响应
 */
export const regenerateBackupCodes = async (password: string): Promise<ApiResponse<BackupCodesRegenerateResponse>> => {
  try {
    console.log('重新生成备份代码')
    
    const response = await request<ApiResponse<BackupCodesRegenerateResponse>>('/auth/totp/backup-codes/regenerate', {
      method: 'POST',
      body: JSON.stringify({ password })
    })
    
    console.log('重新生成备份代码API返回响应:', response)
    
    // 关键点：处理双层 data 结构 (Rule 5)
    if (response.data && response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      return {
        ...response,
        data: response.data.data
      }
    }
    
    return response
  } catch (error) {
    console.error('重新生成备份代码失败:', error)
    return {
      success: false,
      data: { backupCodes: [], message: '生成失败' },
      message: '重新生成备份代码失败',
      code: 400
    }
  }
}

// 两步验证相关接口（保留原有接口以兼容现有代码）

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
    
    const response = await request<ApiResponse<TwoFactorVerifyResponse>>('/auth/two-factor/verify', {
      method: 'POST',
      body: JSON.stringify(verifyData)
    })
    
    console.log('两步验证API返回响应:', response)
    
    // 关键点：处理双层 data 结构 (Rule 5)
    if (response.data && response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      return {
        ...response,
        data: response.data.data
      }
    }
    
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
    
    const response = await request<ApiResponse<TwoFactorStatusResponse>>(`/auth/two-factor/status?userId=${userId}`, {
      method: 'GET'
    })
    
    console.log('两步验证状态API返回响应:', response)
    
    // 关键点：处理双层 data 结构 (Rule 5)
    if (response.data && response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      return {
        ...response,
        data: response.data.data
      }
    }
    
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
    
    const response = await request<ApiResponse<TwoFactorEnableResponse>>('/auth/two-factor/enable', {
      method: 'POST',
      body: JSON.stringify(enableData)
    })
    
    console.log('启用两步验证API返回响应:', response)
    
    // 关键点：处理双层 data 结构 (Rule 5)
    if (response.data && response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      return {
        ...response,
        data: response.data.data
      }
    }
    
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
    
    const response = await request<ApiResponse<{ disabled: boolean; method: string }>>('/auth/two-factor/disable', {
      method: 'POST',
      body: JSON.stringify({ method })
    })
    
    console.log('禁用两步验证API返回响应:', response)
    
    // 关键点：处理双层 data 结构 (Rule 5)
    if (response.data && response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      return {
        ...response,
        data: response.data.data
      }
    }
    
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
    
    const response = await request<ApiResponse<TwoFactorCodeGenerateResponse>>('/auth/two-factor/generate', {
      method: 'POST',
      body: JSON.stringify(generateData)
    })
    
    console.log('生成验证码API返回响应:', response)
    
    // 关键点：处理双层 data 结构 (Rule 5)
    if (response.data && response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      return {
        ...response,
        data: response.data.data
      }
    }
    
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

/**
 * 获取客户端IP地址
 * @returns 客户端IP地址的API响应
 */
export const getClientIpAddress = async (): Promise<ApiResponse<{ ip: string }>> => {
  try {
    console.log('获取客户端IP地址')
    
    const response = await request<ApiResponse<{ ip: string }>>('/auth/client-ip', {
      method: 'GET'
    })
    
    console.log('获取客户端IP地址API返回响应:', response)
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response.data as any)?.data || response.data;
    
    return {
      ...response,
      data: actualData
    }
  } catch (error) {
    console.error('获取客户端IP地址失败:', error)
    return {
      success: false,
      data: { ip: '0.0.0.0' },
      message: '获取客户端IP地址失败',
      code: 400
    }
  }
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
  validateAccessToken,
  getLocalUserInfo,
  clearLocalAuth,
  verifyTwoFactor,
  getTwoFactorStatus,
  enableTwoFactor,
  disableTwoFactor,
  generateTwoFactorCode,
  getClientIpAddress
}