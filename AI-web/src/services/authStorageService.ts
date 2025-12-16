/**
 * 身份验证存储服务
 * 负责用户身份信息的存储、读取、验证和管理
 */

// 用户信息接口
export interface StoredUserInfo {
  id: string
  username: string
  email: string
  nickname: string
  avatar_url: string
  status: string
  email_verified: boolean
  phone_verified: boolean
  last_login_at: string
  created_at: string
  role?: string
  permissions?: string[]
}

// 令牌信息接口
export interface StoredTokenInfo {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
}

// 会话信息接口
export interface StoredSessionInfo {
  sessionId: string
  sessionToken: string
  expiresAt: string
}

// 完整身份验证状态接口
export interface AuthState {
  isAuthenticated: boolean
  user: StoredUserInfo | null
  tokens: StoredTokenInfo | null
  session: StoredSessionInfo | null
}

// 存储键名常量
const STORAGE_KEYS = {
  // 用户信息
  USER_INFO: 'user_info',
  USER_ID: 'userId',
  USERNAME: 'username',
  EMAIL: 'email',
  NICKNAME: 'nickname',
  AVATAR_URL: 'avatar_url',
  STATUS: 'status',
  IS_AUTHENTICATED: 'isAuthenticated',
  
  // 令牌信息
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRES: 'token_expires',
  REFRESH_TOKEN_EXPIRES: 'refresh_token_expires',
  
  // 会话信息
  SESSION_ID: 'sessionId',
  SESSION_TOKEN: 'sessionToken',
  SESSION_EXPIRES: 'sessionExpires',
  
  // 权限信息
  USER_ROLE: 'userRole',
  USER_PERMISSIONS: 'userPermissions'
} as const

/**
 * 身份验证存储服务类
 */
class AuthStorageService {
  /**
   * 保存完整的身份验证信息
   * @param authData 身份验证数据
   */
  saveAuthData(authData: {
    user: any
    tokens: any
    session: any
  }): void {
    try {
      // 保存用户信息
      this.saveUserInfo(authData.user)
      
      // 保存令牌信息
      this.saveTokenInfo(authData.tokens)
      
      // 保存会话信息
      this.saveSessionInfo(authData.session)
      
      // 设置认证状态
      localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true')
      
      console.log('身份验证信息已保存到本地存储')
    } catch (error) {
      console.error('保存身份验证信息失败:', error)
      throw new Error('保存身份验证信息失败')
    }
  }

  /**
   * 保存用户信息
   * @param user 用户信息
   */
  saveUserInfo(user: any): void {
    try {
      const userInfo: StoredUserInfo = {
        id: user.id?.toString() || '',
        username: user.username || '',
        email: user.email || '',
        nickname: user.nickname || '',
        avatar_url: user.avatar_url || '',
        status: user.status || 'active',
        email_verified: user.email_verified || false,
        phone_verified: user.phone_verified || false,
        last_login_at: user.last_login_at || new Date().toISOString(),
        created_at: user.created_at || new Date().toISOString(),
        role: user.role || 'user',
        permissions: user.permissions || []
      }
      
      // 保存用户信息到本地存储
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))
      localStorage.setItem(STORAGE_KEYS.USER_ID, userInfo.id)
      localStorage.setItem(STORAGE_KEYS.USERNAME, userInfo.username)
      localStorage.setItem(STORAGE_KEYS.EMAIL, userInfo.email)
      localStorage.setItem(STORAGE_KEYS.NICKNAME, userInfo.nickname)
      localStorage.setItem(STORAGE_KEYS.AVATAR_URL, userInfo.avatar_url)
      localStorage.setItem(STORAGE_KEYS.STATUS, userInfo.status)
      
      // 保存权限信息
      if (userInfo.role) {
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, userInfo.role)
      }
      if (userInfo.permissions) {
        localStorage.setItem(STORAGE_KEYS.USER_PERMISSIONS, JSON.stringify(userInfo.permissions))
      }
      
      console.log('用户信息已保存:', userInfo)
    } catch (error) {
      console.error('保存用户信息失败:', error)
      throw new Error('保存用户信息失败')
    }
  }

  /**
   * 保存令牌信息
   * @param tokens 令牌信息
   */
  saveTokenInfo(tokens: any): void {
    try {
      const tokenInfo: StoredTokenInfo = {
        accessToken: tokens.accessToken || '',
        refreshToken: tokens.refreshToken || '',
        expiresIn: tokens.expiresIn || 3600,
        refreshExpiresIn: tokens.refreshExpiresIn || 86400
      }
      
      const now = Date.now()
      
      // 保存令牌信息到本地存储
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenInfo.accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenInfo.refreshToken)
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, (now + tokenInfo.expiresIn * 1000).toString())
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES, (now + tokenInfo.refreshExpiresIn * 1000).toString())
      
      console.log('令牌信息已保存')
    } catch (error) {
      console.error('保存令牌信息失败:', error)
      throw new Error('保存令牌信息失败')
    }
  }

  /**
   * 保存会话信息
   * @param session 会话信息
   */
  saveSessionInfo(session: any): void {
    try {
      const sessionInfo: StoredSessionInfo = {
        sessionId: session.sessionId?.toString() || '',
        sessionToken: session.sessionToken || '',
        expiresAt: session.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      
      // 保存会话信息到本地存储
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionInfo.sessionId)
      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, sessionInfo.sessionToken)
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, sessionInfo.expiresAt)
      
      console.log('会话信息已保存')
    } catch (error) {
      console.error('保存会话信息失败:', error)
      throw new Error('保存会话信息失败')
    }
  }

  /**
   * 获取完整的身份验证状态
   * @returns 身份验证状态
   */
  getAuthState(): AuthState {
    try {
      const isAuthenticated = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true'
      const user = this.getUserInfo()
      const tokens = this.getTokenInfo()
      const session = this.getSessionInfo()
      
      return {
        isAuthenticated,
        user,
        tokens,
        session
      }
    } catch (error) {
      console.error('获取身份验证状态失败:', error)
      return {
        isAuthenticated: false,
        user: null,
        tokens: null,
        session: null
      }
    }
  }

  /**
   * 获取用户信息
   * @returns 用户信息
   */
  getUserInfo(): StoredUserInfo | null {
    try {
      const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO)
      if (!userInfoStr) return null
      
      return JSON.parse(userInfoStr) as StoredUserInfo
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  /**
   * 获取令牌信息
   * @returns 令牌信息
   */
  getTokenInfo(): StoredTokenInfo | null {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      const tokenExpires = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES)
      const refreshTokenExpires = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES)
      
      if (!accessToken || !refreshToken) return null
      
      return {
        accessToken,
        refreshToken,
        expiresIn: tokenExpires ? parseInt(tokenExpires) - Date.now() : 0,
        refreshExpiresIn: refreshTokenExpires ? parseInt(refreshTokenExpires) - Date.now() : 0
      }
    } catch (error) {
      console.error('获取令牌信息失败:', error)
      return null
    }
  }

  /**
   * 获取会话信息
   * @returns 会话信息
   */
  getSessionInfo(): StoredSessionInfo | null {
    try {
      const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID)
      const sessionToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
      const sessionExpires = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES)
      
      if (!sessionId || !sessionToken) return null
      
      return {
        sessionId,
        sessionToken,
        expiresAt: sessionExpires || ''
      }
    } catch (error) {
      console.error('获取会话信息失败:', error)
      return null
    }
  }

  /**
   * 获取访问令牌
   * @returns 访问令牌
   */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  }

  /**
   * 获取用户角色
   * @returns 用户角色
   */
  getUserRole(): string | null {
    return localStorage.getItem(STORAGE_KEYS.USER_ROLE) || this.getUserInfo()?.role || null
  }

  /**
   * 获取用户权限
   * @returns 用户权限列表
   */
  getUserPermissions(): string[] {
    try {
      const permissionsStr = localStorage.getItem(STORAGE_KEYS.USER_PERMISSIONS)
      if (permissionsStr) {
        return JSON.parse(permissionsStr) as string[]
      }
      return this.getUserInfo()?.permissions || []
    } catch (error) {
      console.error('获取用户权限失败:', error)
      return []
    }
  }

  /**
   * 检查令牌是否过期
   * @returns 是否过期
   */
  isTokenExpired(): boolean {
    try {
      const tokenExpires = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES)
      if (!tokenExpires) return true
      
      const expiresTime = parseInt(tokenExpires)
      const currentTime = Date.now()
      
      // 提前5分钟过期，避免令牌在请求过程中失效
      return currentTime >= (expiresTime - 5 * 60 * 1000)
    } catch (error) {
      console.error('检查令牌过期状态失败:', error)
      return true
    }
  }

  /**
   * 检查会话是否过期
   * @returns 是否过期
   */
  isSessionExpired(): boolean {
    try {
      const sessionExpires = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES)
      if (!sessionExpires) return true
      
      const expiresTime = new Date(sessionExpires).getTime()
      const currentTime = Date.now()
      
      return currentTime >= expiresTime
    } catch (error) {
      console.error('检查会话过期状态失败:', error)
      return true
    }
  }

  /**
   * 检查用户是否已认证
   * @returns 是否已认证
   */
  isAuthenticated(): boolean {
    try {
      const isAuthenticated = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true'
      const hasAccessToken = !!this.getAccessToken()
      const tokenNotExpired = !this.isTokenExpired()
      
      return isAuthenticated && hasAccessToken && tokenNotExpired
    } catch (error) {
      console.error('检查认证状态失败:', error)
      return false
    }
  }

  /**
   * 检查用户是否有指定权限
   * @param permission 权限名称
   * @returns 是否有权限
   */
  hasPermission(permission: string): boolean {
    try {
      const permissions = this.getUserPermissions()
      const role = this.getUserRole()
      
      // 管理员拥有所有权限
      if (role === 'admin') return true
      
      return permissions.includes(permission)
    } catch (error) {
      console.error('检查用户权限失败:', error)
      return false
    }
  }

  /**
   * 检查用户是否有指定角色
   * @param role 角色名称
   * @returns 是否有角色
   */
  hasRole(role: string): boolean {
    try {
      const userRole = this.getUserRole()
      return userRole === role
    } catch (error) {
      console.error('检查用户角色失败:', error)
      return false
    }
  }

  /**
   * 清除所有身份验证信息
   */
  clearAuthData(): void {
    try {
      // 清除所有存储的身份验证信息
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log('身份验证信息已清除')
    } catch (error) {
      console.error('清除身份验证信息失败:', error)
    }
  }

  /**
   * 更新用户信息
   * @param updates 更新的用户信息
   */
  updateUserInfo(updates: Partial<StoredUserInfo>): void {
    try {
      const currentInfo = this.getUserInfo()
      if (!currentInfo) return
      
      const updatedInfo = { ...currentInfo, ...updates }
      this.saveUserInfo(updatedInfo)
      
      console.log('用户信息已更新:', updatedInfo)
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw new Error('更新用户信息失败')
    }
  }
}

// 创建单例实例
const authStorageService = new AuthStorageService()

// 导出服务实例和接口
export default authStorageService
export { STORAGE_KEYS }
export type { StoredUserInfo, StoredTokenInfo, StoredSessionInfo, AuthState }