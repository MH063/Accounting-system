import { ApiResponse } from '@/types'
import { validateAccessToken } from '@/services/authService'
import authStorageService from '@/services/authStorageService'
import router from '@/router'
import { waitForRefresh } from './request'

/**
 * 验证用户访问令牌
 * @returns 验证结果
 */
export const validateUserToken = async (): Promise<boolean> => {
  try {
    await waitForRefresh()

    const tokenInfo = authStorageService.getTokenInfo()
    const accessToken = tokenInfo?.accessToken || localStorage.getItem('access_token')
    
    if (!accessToken) {
      console.log('validateUserToken: 访问令牌不存在')
      redirectToLogin()
      return false
    }
    
    console.log('validateUserToken: 开始验证令牌')
    
    const response: ApiResponse<any> = await validateAccessToken(accessToken)
    
    console.log('validateUserToken: 令牌验证响应', response)
    
    if (response.success) {
      console.log('validateUserToken: 令牌验证成功')
      return true
    } else {
      console.log('validateUserToken: 令牌验证失败', response.message)
      redirectToLogin()
      return false
    }
  } catch (error) {
    console.error('validateUserToken: 令牌验证异常', error)
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