/**
 * 身份验证守卫
 * 提供路由级别的身份验证和权限检查
 */

import { Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import authStorageService from '@/services/authStorageService'
import authService from '@/services/authService'
import { validateUserToken } from '@/utils/tokenValidator'

// 路由守卫配置
export interface AuthGuardConfig {
  requireAuth?: boolean
  requiredRole?: string
  requiredPermissions?: string[]
  redirectTo?: string
}

/**
 * 创建身份验证守卫
 * @param router Vue Router实例
 */
export const createAuthGuard = (router: Router): void => {
  // 全局前置守卫
  router.beforeEach(async (to, from, next) => {
    // 获取路由元信息
    const meta = to.meta as any
    const config: AuthGuardConfig = {
      requireAuth: meta.requireAuth !== false, // 默认需要认证
      requiredRole: meta.requiredRole,
      requiredPermissions: meta.requiredPermissions,
      redirectTo: meta.redirectTo || '/login'
    }

    console.log(`路由守卫检查: ${to.path}`, config)

    // 如果路由不需要认证，直接通过
    if (!config.requireAuth) {
      next()
      return
    }

    try {
      // 检查本地认证状态
      const authState = authStorageService.getAuthState()
      
      // 如果本地未认证，重定向到登录页
      if (!authState.isAuthenticated) {
        console.log('用户未认证，重定向到登录页')
        ElMessage.warning('请先登录')
        next({
          path: config.redirectTo,
          query: { redirect: to.fullPath }
        })
        return
      }

      // 验证访问令牌
      const isTokenValid = await validateUserToken()
      if (!isTokenValid) {
        console.log('令牌验证失败，重定向到登录页')
        ElMessage.warning('登录已过期，请重新登录')
        next({
          path: config.redirectTo,
          query: { redirect: to.fullPath }
        })
        return
      }

      // 检查令牌是否过期
      if (authStorageService.isTokenExpired()) {
        console.log('令牌已过期，尝试刷新')
        
        try {
          // 尝试刷新令牌
          const refreshResult = await authService.refreshToken()
          
          if (!refreshResult.success) {
            console.log('令牌刷新失败，重定向到登录页')
            ElMessage.warning('登录已过期，请重新登录')
            next({
              path: config.redirectTo,
              query: { redirect: to.fullPath }
            })
            return
          }
          
          console.log('令牌刷新成功')
        } catch (error) {
          console.error('令牌刷新失败:', error)
          ElMessage.error('登录验证失败，请重新登录')
          next({
            path: config.redirectTo,
            query: { redirect: to.fullPath }
          })
          return
        }
      }

      // 检查会话是否过期
      if (authStorageService.isSessionExpired()) {
        console.log('会话已过期，重定向到登录页')
        ElMessage.warning('会话已过期，请重新登录')
        next({
          path: config.redirectTo,
          query: { redirect: to.fullPath }
        })
        return
      }

      // 检查角色权限
      if (config.requiredRole && !authStorageService.hasRole(config.requiredRole)) {
        console.log(`用户角色不符合要求，需要角色: ${config.requiredRole}`)
        ElMessage.error('您没有权限访问此页面')
        next('/403') // 权限不足页面
        return
      }

      // 检查具体权限
      if (config.requiredPermissions && config.requiredPermissions.length > 0) {
        const hasAllPermissions = config.requiredPermissions.every(permission =>
          authStorageService.hasPermission(permission)
        )

        if (!hasAllPermissions) {
          console.log(`用户权限不符合要求，需要权限: ${config.requiredPermissions.join(', ')}`)
          ElMessage.error('您没有权限访问此页面')
          next('/403') // 权限不足页面
          return
        }
      }

      // 所有检查通过，允许访问
      console.log('身份验证通过，允许访问')
      next()

    } catch (error) {
      console.error('身份验证守卫错误:', error)
      ElMessage.error('身份验证失败，请重新登录')
      next({
        path: config.redirectTo,
        query: { redirect: to.fullPath }
      })
    }
  })

  // 全局后置钩子
  router.afterEach((to, from) => {
    // 记录路由访问日志
    console.log(`路由访问: ${from.path} -> ${to.path}`)
    
    // 更新最后访问时间
    const authState = authStorageService.getAuthState()
    if (authState.isAuthenticated && authState.user) {
      try {
        authStorageService.updateUserInfo({
          last_login_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('更新最后访问时间失败:', error)
      }
    }
  })
}

/**
 * 检查用户是否有权限访问指定路由
 * @param to 目标路由
 * @returns 是否有权限
 */
export const checkRoutePermission = (to: any): boolean => {
  const meta = to.meta as any
  const config: AuthGuardConfig = {
    requireAuth: meta.requireAuth !== false,
    requiredRole: meta.requiredRole,
    requiredPermissions: meta.requiredPermissions
  }

  // 如果不需要认证，直接通过
  if (!config.requireAuth) {
    return true
  }

  // 检查认证状态
  if (!authStorageService.isAuthenticated()) {
    return false
  }

  // 检查角色权限
  if (config.requiredRole && !authStorageService.hasRole(config.requiredRole)) {
    return false
  }

  // 检查具体权限
  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    const hasAllPermissions = config.requiredPermissions.every(permission =>
      authStorageService.hasPermission(permission)
    )
    return hasAllPermissions
  }

  return true
}

/**
 * 获取用户可访问的路由列表
 * @param routes 路由配置
 * @returns 可访问的路由列表
 */
export const getAccessibleRoutes = (routes: any[]): any[] => {
  return routes.filter(route => {
    // 检查当前路由权限
    if (!checkRoutePermission(route)) {
      return false
    }

    // 递归检查子路由
    if (route.children && route.children.length > 0) {
      route.children = getAccessibleRoutes(route.children)
      // 如果所有子路由都不可访问，则当前路由也不可访问
      return route.children.length > 0
    }

    return true
  })
}

/**
 * 权限检查工具函数
 */
export const permissionUtils = {
  /**
   * 检查是否有管理员权限
   */
  isAdmin: (): boolean => {
    return authStorageService.hasRole('admin') || authStorageService.hasPermission('admin')
  },

  /**
   * 检查是否有用户管理权限
   */
  canManageUsers: (): boolean => {
    return authStorageService.hasPermission('user:manage') || permissionUtils.isAdmin()
  },

  /**
   * 检查是否有财务管理权限
   */
  canManageFinance: (): boolean => {
    return authStorageService.hasPermission('finance:manage') || permissionUtils.isAdmin()
  },

  /**
   * 检查是否有系统配置权限
   */
  canManageSystem: (): boolean => {
    return authStorageService.hasPermission('system:manage') || permissionUtils.isAdmin()
  },

  /**
   * 检查是否有数据查看权限
   */
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