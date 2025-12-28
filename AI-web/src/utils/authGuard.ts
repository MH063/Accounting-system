import { Router } from 'vue-router'
import authStorageService from '@/services/authStorageService'
import { validateUserToken } from '@/utils/tokenValidator'
import { refreshAccessToken, waitForRefresh, getIsRefreshing } from '@/utils/request'

export interface AuthGuardConfig {
  requireAuth?: boolean
  requiredRole?: string
  requiredPermissions?: string[]
  redirectTo?: string
}

export const createAuthGuard = (router: Router): void => {
  router.beforeEach(async (to, from, next) => {
    const meta = to.meta as any
    const config: AuthGuardConfig = {
      requireAuth: meta.requireAuth !== false,
      requiredRole: meta.requiredRole,
      requiredPermissions: meta.requiredPermissions,
      redirectTo: meta.redirectTo || '/login'
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[AuthGuard] 路由守卫检查: ${to.path}`)
    }

    if (!config.requireAuth) {
      next()
      return
    }

    try {
      const authState = authStorageService.getAuthState()

      if (process.env.NODE_ENV === 'development') {
        console.log(`[AuthGuard] 认证状态: isAuthenticated=${authState.isAuthenticated}`)
      }

      if (!authState.isAuthenticated) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthGuard] 用户未认证，重定向到登录页')
        }
        next({
          path: config.redirectTo,
          query: { redirect: to.fullPath, reason: 'not_authenticated' }
        })
        return
      }

      if (getIsRefreshing()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthGuard] 当前正在刷新令牌，等待刷新完成...')
        }
        await waitForRefresh()
      }

      const isTokenValid = await validateUserToken()
      if (!isTokenValid) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthGuard] 令牌验证失败，重定向到登录页')
        }
        next({
          path: config.redirectTo,
          query: { redirect: to.fullPath, reason: 'token_invalid' }
        })
        return
      }

      if (authStorageService.isSessionExpired()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthGuard] 会话已过期，重定向到登录页')
        }
        next({
          path: config.redirectTo,
          query: { redirect: to.fullPath, reason: 'session_expired' }
        })
        return
      }

      if (config.requiredRole && !authStorageService.hasRole(config.requiredRole)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AuthGuard] 用户角色不符合要求，需要角色: ${config.requiredRole}`)
        }
        next('/403')
        return
      }

      if (config.requiredPermissions && config.requiredPermissions.length > 0) {
        const hasAllPermissions = config.requiredPermissions.every(permission =>
          authStorageService.hasPermission(permission)
        )

        if (!hasAllPermissions) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[AuthGuard] 用户权限不符合要求，需要权限: ${config.requiredPermissions.join(', ')}`)
          }
          next('/403')
          return
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthGuard] 身份验证通过，允许访问')
      }
      next()

    } catch (error) {
      console.error('[AuthGuard] 身份验证守卫错误:', error)
      next({
        path: config.redirectTo,
        query: { redirect: to.fullPath, reason: 'auth_error' }
      })
    }
  })

  router.afterEach((to, from) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AuthGuard] 路由访问: ${from.path} -> ${to.path}`)
    }

    if (to.path === '/login' || to.meta.requireAuth === false) {
      return
    }

    const authState = authStorageService.getAuthState()
    if (authState.isAuthenticated && authState.user) {
      try {
        authStorageService.updateUserInfo({
          last_login_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('[AuthGuard] 更新最后访问时间失败:', error)
      }
    }
  })
}

export const checkRoutePermission = (to: any): boolean => {
  const meta = to.meta as any
  const config: AuthGuardConfig = {
    requireAuth: meta.requireAuth !== false,
    requiredRole: meta.requiredRole,
    requiredPermissions: meta.requiredPermissions
  }

  if (!config.requireAuth) {
    return true
  }

  if (!authStorageService.isAuthenticated()) {
    return false
  }

  if (config.requiredRole && !authStorageService.hasRole(config.requiredRole)) {
    return false
  }

  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    const hasAllPermissions = config.requiredPermissions.every(permission =>
      authStorageService.hasPermission(permission)
    )
    return hasAllPermissions
  }

  return true
}

export const getAccessibleRoutes = (routes: any[]): any[] => {
  return routes.filter(route => {
    if (!checkRoutePermission(route)) {
      return false
    }

    if (route.children && route.children.length > 0) {
      route.children = getAccessibleRoutes(route.children)
      return route.children.length > 0
    }

    return true
  })
}

export const permissionUtils = {
  isAdmin: (): boolean => {
    return authStorageService.hasRole('admin') || authStorageService.hasPermission('admin')
  },

  canManageUsers: (): boolean => {
    return authStorageService.hasPermission('user:manage') || permissionUtils.isAdmin()
  },

  canManageFinance: (): boolean => {
    return authStorageService.hasPermission('finance:manage') || permissionUtils.isAdmin()
  },

  canManageSystem: (): boolean => {
    return authStorageService.hasPermission('system:manage') || permissionUtils.isAdmin()
  },

  canViewData: (): boolean => {
    return authStorageService.hasPermission('data:view') || 
           authStorageService.hasPermission('finance:manage') ||
           permissionUtils.isAdmin()
  }
}

export default {
  createAuthGuard,
  checkRoutePermission,
  getAccessibleRoutes,
  permissionUtils
}
