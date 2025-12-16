import { ApiResponse } from '@/types'
import { validateAccessToken } from '@/services/authService'
import authStorageService from '@/services/authStorageService'
import router from '@/router'

/**
 * 验证用户访问令牌
 * @returns 验证结果
 */
export const validateUserToken = async (): Promise<boolean> => {
  try {
    // 从本地存储获取会话令牌
    const sessionInfo = authStorageService.getSessionInfo()
    const sessionToken = sessionInfo?.sessionToken
    
    // 如果没有会话令牌，直接返回false
    if (!sessionToken) {
      console.log('validateUserToken: 会话令牌不存在')
      redirectToLogin()
      return false
    }
    
    console.log('validateUserToken: 开始验证令牌', sessionToken)
    
    // 调用令牌验证服务
    const response: ApiResponse<any> = await validateAccessToken(sessionToken)
    
    console.log('validateUserToken: 令牌验证响应', response)
    
    // 处理验证结果
    if (response.success) {
      console.log('validateUserToken: 令牌验证成功')
      // 验证成功，更新本地存储的认证信息已在validateAccessToken中处理
      return true
    } else {
      console.log('validateUserToken: 令牌验证失败', response.message)
      // 验证失败，跳转到登录页面
      redirectToLogin()
      return false
    }
  } catch (error) {
    console.error('validateUserToken: 令牌验证异常', error)
    // 异常情况，跳转到登录页面
    redirectToLogin()
    return false
  }
}

/**
 * 重定向到登录页面
 */
const redirectToLogin = (): void => {
  // 清除本地存储的认证信息
  authStorageService.clearAuthData()
  
  // 跳转到登录页面
  if (typeof window !== 'undefined') {
    // 在浏览器环境中使用Vue Router
    router.push('/login')
  } else {
    // 在服务端或其他环境中使用window.location
    window.location.href = '/login'
  }
}

/**
 * 检查用户是否已认证
 * @returns 是否已认证
 */
export const isAuthenticated = (): boolean => {
  try {
    // 检查本地存储中是否存在认证信息
    const authState = authStorageService.getAuthState()
    return authState.isAuthenticated
  } catch (error) {
    console.error('检查认证状态失败:', error)
    return false
  }
}

export default {
  validateUserToken,
  isAuthenticated
}