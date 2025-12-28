import { ApiResponse } from '@/types'
import { validateAccessToken } from '@/services/authService'
import authStorageService from '@/services/authStorageService'
import router from '@/router'
import { waitForRefresh, isTokenExpiringSoon, refreshAccessToken } from './request'

/**
 * 验证用户访问令牌
 * @returns 验证结果
 */
export const validateUserToken = async (): Promise<boolean> => {
  try {
    // 1. 首先等待可能正在进行的刷新流程
    await waitForRefresh()

    const tokenInfo = authStorageService.getTokenInfo()
    let accessToken = tokenInfo?.accessToken || localStorage.getItem('access_token')
    
    if (!accessToken) {
      console.log('validateUserToken: 访问令牌不存在')
      redirectToLogin()
      return false
    }

    // 2. 检查令牌是否已过期或即将过期
    const tokenExpires = localStorage.getItem('token_expires')
    const now = Date.now()
    const isExpired = tokenExpires ? parseInt(tokenExpires) <= now : false
    
    if (isExpired || isTokenExpiringSoon()) {
      console.log('validateUserToken: 令牌已过期或即将过期，触发主动刷新')
      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        console.log('validateUserToken: 令牌刷新失败')
        redirectToLogin()
        return false
      }
      // 获取刷新后的新令牌
      accessToken = localStorage.getItem('access_token') || ''
    }
    
    console.log('validateUserToken: 开始验证令牌')
    
    const response: ApiResponse<any> = await validateAccessToken(accessToken)
    
    console.log('validateUserToken: 令牌验证响应', response)
    
    if (response.success) {
      console.log('validateUserToken: 令牌验证成功')
      return true
    } else {
      console.log('validateUserToken: 令牌验证失败', response.message)
      // 如果验证失败是由于令牌过期，再次尝试刷新（双重保障）
      if (response.message?.includes('过期') || response.code === 401) {
        console.log('validateUserToken: 验证失败显示过期，最后尝试刷新一次')
        const secondRefreshed = await refreshAccessToken()
        if (secondRefreshed) {
          return true
        }
      }
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