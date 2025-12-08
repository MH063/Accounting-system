import { AdminAccount, PermissionRole } from '@/api/adminPermission'

/**
 * 权限控制工具类
 * 提供更精细化的权限控制功能
 */

// 当前用户信息（从本地存储获取）
const getCurrentUser = (): AdminAccount | null => {
  const userStr = localStorage.getItem('adminUser')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch (e) {
      console.error('解析当前用户信息失败:', e)
      return null
    }
  }
  return null
}

// 获取当前用户的角色
const getCurrentUserRoles = (): string[] => {
  const user = getCurrentUser()
  return user?.roleNames || []
}

// 获取当前用户的权限列表
const getCurrentUserPermissions = (): string[] => {
  const user = getCurrentUser()
  if (!user) return []
  
  // 合并所有角色的权限
  const permissions: string[] = []
  // 这里需要从后端获取角色对应的权限，暂时模拟
  return permissions
}

/**
 * 检查用户是否具有指定权限
 * @param permission 权限标识符
 * @returns boolean 是否具有权限
 */
export const hasPermission = (permission: string): boolean => {
  // 如果没有登录用户，返回false
  const user = getCurrentUser()
  if (!user) return false
  
  // 超级管理员拥有所有权限
  if (user.roleNames.includes('超级管理员')) {
    return true
  }
  
  // 获取用户权限列表并检查
  const userPermissions = getCurrentUserPermissions()
  return userPermissions.includes(permission)
}

/**
 * 检查用户是否具有指定角色
 * @param role 角色名称
 * @returns boolean 是否具有角色
 */
export const hasRole = (role: string): boolean => {
  const userRoles = getCurrentUserRoles()
  return userRoles.includes(role)
}

/**
 * 检查用户是否具有任意指定权限
 * @param permissions 权限标识符数组
 * @returns boolean 是否具有任一权限
 */
export const hasAnyPermission = (permissions: string[]): boolean => {
  return permissions.some(permission => hasPermission(permission))
}

/**
 * 检查用户是否具有所有指定权限
 * @param permissions 权限标识符数组
 * @returns boolean 是否具有所有权限
 */
export const hasAllPermissions = (permissions: string[]): boolean => {
  return permissions.every(permission => hasPermission(permission))
}

/**
 * 检查用户是否具有任意指定角色
 * @param roles 角色名称数组
 * @returns boolean 是否具有任一角色
 */
export const hasAnyRole = (roles: string[]): boolean => {
  return roles.some(role => hasRole(role))
}

/**
 * 检查用户是否具有所有指定角色
 * @param roles 角色名称数组
 * @returns boolean 是否具有所有角色
 */
export const hasAllRoles = (roles: string[]): boolean => {
  return roles.every(role => hasRole(role))
}

/**
 * 功能级别权限验证装饰器
 * @param permission 权限标识符
 */
export const requirePermission = (permission: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      if (!hasPermission(permission)) {
        console.warn(`用户缺少权限: ${permission}`)
        throw new Error(`缺少必要权限: ${permission}`)
      }
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

/**
 * 功能级别权限验证高阶组件
 * @param permission 权限标识符
 * @param component 组件
 */
export const withPermission = (permission: string, component: any) => {
  return {
    setup(props: any, ctx: any) {
      if (!hasPermission(permission)) {
        // 返回空组件或提示组件
        return () => null
      }
      return component.setup(props, ctx)
    }
  }
}

/**
 * 权限继承机制
 * 根据用户角色自动继承权限
 */
export const getInheritedPermissions = (roles: PermissionRole[]): Record<string, string[]> => {
  const permissionMap: Record<string, string[]> = {}
  
  roles.forEach(role => {
    // 根据角色代码确定继承关系
    switch (role.code) {
      case 'super_admin':
        // 超级管理员继承所有权限
        permissionMap[role.code] = ['*']
        break
      case 'admin':
        // 管理员继承大部分权限
        permissionMap[role.code] = [
          'user_management.*',
          'dormitory_management.*',
          'fee_management.*',
          'system_management.view'
        ]
        break
      case 'operator':
        // 操作员继承基本操作权限
        permissionMap[role.code] = [
          'user_management.view',
          'user_management.edit',
          'dormitory_management.view',
          'fee_management.view'
        ]
        break
      default:
        // 默认只继承查看权限
        permissionMap[role.code] = [
          'user_management.view',
          'dormitory_management.view',
          'fee_management.view'
        ]
    }
  })
  
  return permissionMap
}

/**
 * 权限检查结果类型
 */
export interface PermissionCheckResult {
  allowed: boolean
  missingPermissions?: string[]
  missingRoles?: string[]
}

/**
 * 综合权限检查
 * @param requiredPermissions 需要的权限
 * @param requiredRoles 需要的角色
 * @returns PermissionCheckResult 检查结果
 */
export const checkPermissions = (
  requiredPermissions: string[] = [], 
  requiredRoles: string[] = []
): PermissionCheckResult => {
  const result: PermissionCheckResult = {
    allowed: true
  }
  
  // 检查权限
  if (requiredPermissions.length > 0) {
    const missingPermissions = requiredPermissions.filter(p => !hasPermission(p))
    if (missingPermissions.length > 0) {
      result.allowed = false
      result.missingPermissions = missingPermissions
    }
  }
  
  // 检查角色
  if (requiredRoles.length > 0) {
    const missingRoles = requiredRoles.filter(r => !hasRole(r))
    if (missingRoles.length > 0) {
      result.allowed = false
      result.missingRoles = missingRoles
    }
  }
  
  return result
}

// 默认导出权限控制对象
export default {
  hasPermission,
  hasRole,
  hasAnyPermission,
  hasAllPermissions,
  hasAnyRole,
  hasAllRoles,
  requirePermission,
  withPermission,
  getInheritedPermissions,
  checkPermissions
}