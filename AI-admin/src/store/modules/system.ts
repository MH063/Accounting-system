// 系统模块状态管理
import { Module } from 'vuex'
import { State } from '../index'

// 定义系统状态类型
export interface SystemState {
  theme: 'light' | 'dark'
  language: string
  sidebarCollapsed: boolean
  notifications: any[]
  device: 'desktop' | 'tablet' | 'mobile'
  loading: boolean
}

// 初始状态
const state: SystemState = {
  theme: 'light',
  language: 'zh-CN',
  sidebarCollapsed: false,
  notifications: [],
  device: 'desktop',
  loading: false
}

// getters
const getters = {
  theme: (state: SystemState) => state.theme,
  language: (state: SystemState) => state.language,
  isSidebarCollapsed: (state: SystemState) => state.sidebarCollapsed,
  notifications: (state: SystemState) => state.notifications,
  device: (state: SystemState) => state.device,
  isLoading: (state: SystemState) => state.loading
}

// mutations
const mutations = {
  SET_THEME(state: SystemState, theme: 'light' | 'dark') {
    state.theme = theme
  },
  
  SET_LANGUAGE(state: SystemState, language: string) {
    state.language = language
  },
  
  TOGGLE_SIDEBAR(state: SystemState) {
    state.sidebarCollapsed = !state.sidebarCollapsed
  },
  
  COLLAPSE_SIDEBAR(state: SystemState, collapse: boolean) {
    state.sidebarCollapsed = collapse
  },
  
  ADD_NOTIFICATION(state: SystemState, notification: any) {
    state.notifications.push(notification)
  },
  
  REMOVE_NOTIFICATION(state: SystemState, id: number) {
    state.notifications = state.notifications.filter(n => n.id !== id)
  },
  
  CLEAR_NOTIFICATIONS(state: SystemState) {
    state.notifications = []
  },
  
  SET_DEVICE(state: SystemState, device: 'desktop' | 'tablet' | 'mobile') {
    state.device = device
  },
  
  SET_LOADING(state: SystemState, loading: boolean) {
    state.loading = loading
  }
}

// actions
const actions = {
  setTheme({ commit }: { commit: Function }, theme: 'light' | 'dark') {
    commit('SET_THEME', theme)
  },
  
  setLanguage({ commit }: { commit: Function }, language: string) {
    commit('SET_LANGUAGE', language)
  },
  
  toggleSidebar({ commit }: { commit: Function }) {
    commit('TOGGLE_SIDEBAR')
  },
  
  collapseSidebar({ commit }: { commit: Function }, collapse: boolean) {
    commit('COLLAPSE_SIDEBAR', collapse)
  },
  
  addNotification({ commit }: { commit: Function }, notification: any) {
    const notificationWithId = {
      ...notification,
      id: Date.now()
    }
    commit('ADD_NOTIFICATION', notificationWithId)
  },
  
  removeNotification({ commit }: { commit: Function }, id: number) {
    commit('REMOVE_NOTIFICATION', id)
  },
  
  clearNotifications({ commit }: { commit: Function }) {
    commit('CLEAR_NOTIFICATIONS')
  },
  
  setDevice({ commit }: { commit: Function }, device: 'desktop' | 'tablet' | 'mobile') {
    commit('SET_DEVICE', device)
  },
  
  setLoading({ commit }: { commit: Function }, loading: boolean) {
    commit('SET_LOADING', loading)
  }
}

// 导出系统模块
export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as Module<SystemState, State>