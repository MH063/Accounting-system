// 用户模块状态管理
import { Module } from 'vuex'
import { State } from '../index'

// 定义用户状态类型
export interface UserState {
  id: number | null
  name: string
  role: string
  permissions: string[]
  isLoggedIn: boolean
  avatar?: string
  email?: string
  loginTime?: number // 添加登录时间戳
  token?: string // 添加访问令牌
  refreshToken?: string // 添加刷新令牌
}

// 初始状态
const state: UserState = {
  id: null,
  name: '',
  role: '',
  permissions: [],
  isLoggedIn: false,
  avatar: '',
  email: '',
  loginTime: undefined,
  token: '',
  refreshToken: ''
}

// getters
const getters = {
  isLoggedIn: (state: UserState) => state.isLoggedIn,
  currentUser: (state: UserState) => state,
  userPermissions: (state: UserState) => state.permissions,
  hasPermission: (state: UserState) => (permission: string) => {
    return state.permissions.includes(permission)
  },
  isAdministrator: (state: UserState) => {
    return state.role === 'admin' || state.role === 'super_admin'
  }
}

// mutations
const mutations = {
  SET_USER(state: UserState, user: Partial<UserState>) {
    Object.assign(state, user)
    state.isLoggedIn = true
    state.loginTime = Date.now() // 设置登录时间戳
    
    // 如果包含令牌，保存到localStorage
    if (user.token) {
      localStorage.setItem('adminToken', user.token)
    }
    if (user.refreshToken) {
      localStorage.setItem('adminRefreshToken', user.refreshToken)
    }
  },
  
  CLEAR_USER(state: UserState) {
    state.id = null
    state.name = ''
    state.role = ''
    state.permissions = []
    state.isLoggedIn = false
    state.avatar = ''
    state.email = ''
    state.token = ''
    state.refreshToken = ''
    
    // 清除令牌
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRefreshToken')
  },
  
  UPDATE_USER_PERMISSIONS(state: UserState, permissions: string[]) {
    state.permissions = permissions
  },
  
  UPDATE_USER_PROFILE(state: UserState, profile: Partial<UserState>) {
    Object.assign(state, profile)
  }
}

// actions
const actions = {
  login({ commit }: { commit: Function }, user: UserState) {
    // 这里应该调用API进行登录验证
    commit('SET_USER', user)
    
    // 保存到localStorage
    localStorage.setItem('adminUser', JSON.stringify(user))
  },
  
  logout({ commit }: { commit: Function }) {
    commit('CLEAR_USER')
    
    // 清除localStorage
    localStorage.removeItem('adminUser')
  },
  
  updateUserPermissions({ commit }: { commit: Function }, permissions: string[]) {
    commit('UPDATE_USER_PERMISSIONS', permissions)
  },
  
  updateUserProfile({ commit }: { commit: Function }, profile: Partial<UserState>) {
    commit('UPDATE_USER_PROFILE', profile)
    
    // 更新localStorage
    const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
    const updatedUser = { ...currentUser, ...profile }
    localStorage.setItem('adminUser', JSON.stringify(updatedUser))
  }
}

// 导出用户模块
export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as Module<UserState, State>