// 应用模块状态管理
import { Module } from 'vuex'
import { State } from '../index'

// 定义应用状态类型
export interface AppState {
  pageTitle: string
  error: string | null
  loading: boolean
  breadcrumbs: Array<{ path: string; name: string }>
  tabs: Array<{ id: string; title: string; path: string }>
  activeTabId: string | null
}

// 初始状态
const state: AppState = {
  pageTitle: 'AI管理系统',
  error: null,
  loading: false,
  breadcrumbs: [],
  tabs: [],
  activeTabId: null
}

// getters
const getters = {
  pageTitle: (state: AppState) => state.pageTitle,
  appError: (state: AppState) => state.error,
  isLoading: (state: AppState) => state.loading,
  breadcrumbs: (state: AppState) => state.breadcrumbs,
  tabs: (state: AppState) => state.tabs,
  activeTab: (state: AppState) => {
    if (!state.activeTabId) return null
    return state.tabs.find(tab => tab.id === state.activeTabId)
  }
}

// mutations
const mutations = {
  SET_PAGE_TITLE(state: AppState, title: string) {
    state.pageTitle = title
  },
  
  SET_ERROR(state: AppState, error: string | null) {
    state.error = error
  },
  
  SET_LOADING(state: AppState, loading: boolean) {
    state.loading = loading
  },
  
  SET_BREADCRUMBS(state: AppState, breadcrumbs: Array<{ path: string; name: string }>) {
    state.breadcrumbs = breadcrumbs
  },
  
  ADD_TAB(state: AppState, tab: { id: string; title: string; path: string }) {
    // 检查标签页是否已存在
    const existingTab = state.tabs.find(t => t.id === tab.id)
    if (!existingTab) {
      state.tabs.push(tab)
    }
    state.activeTabId = tab.id
  },
  
  REMOVE_TAB(state: AppState, tabId: string) {
    state.tabs = state.tabs.filter(tab => tab.id !== tabId)
    
    // 如果删除的是当前激活的标签页，激活下一个或上一个标签页
    if (state.activeTabId === tabId) {
      const tabIndex = state.tabs.findIndex(tab => tab.id === tabId)
      if (tabIndex > 0) {
        state.activeTabId = state.tabs[tabIndex - 1].id
      } else if (state.tabs.length > 0) {
        state.activeTabId = state.tabs[0].id
      } else {
        state.activeTabId = null
      }
    }
  },
  
  SET_ACTIVE_TAB(state: AppState, tabId: string) {
    state.activeTabId = tabId
  },
  
  CLEAR_ALL_TABS(state: AppState) {
    state.tabs = []
    state.activeTabId = null
  }
}

// actions
const actions = {
  setPageTitle({ commit }: { commit: Function }, title: string) {
    commit('SET_PAGE_TITLE', title)
  },
  
  setError({ commit }: { commit: Function }, error: string | null) {
    commit('SET_ERROR', error)
  },
  
  setLoading({ commit }: { commit: Function }, loading: boolean) {
    commit('SET_LOADING', loading)
  },
  
  setBreadcrumbs({ commit }: { commit: Function }, breadcrumbs: Array<{ path: string; name: string }>) {
    commit('SET_BREADCRUMBS', breadcrumbs)
  },
  
  addTab({ commit }: { commit: Function }, tab: { id: string; title: string; path: string }) {
    commit('ADD_TAB', tab)
  },
  
  removeTab({ commit }: { commit: Function }, tabId: string) {
    commit('REMOVE_TAB', tabId)
  },
  
  setActiveTab({ commit }: { commit: Function }, tabId: string) {
    commit('SET_ACTIVE_TAB', tabId)
  },
  
  clearAllTabs({ commit }: { commit: Function }) {
    commit('CLEAR_ALL_TABS')
  }
}

// 导出应用模块
export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as Module<AppState, State>