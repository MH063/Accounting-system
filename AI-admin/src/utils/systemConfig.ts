import { reactive, readonly } from 'vue'

interface SystemConfigState {
  name: string
  version: string
  environment: string
  deployTime: string
  lastUpdate: number
}

const STORAGE_KEY = 'system_config'

function getFromStorage(): Partial<SystemConfigState> | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    }
  } catch (e) {
    console.warn('读取系统配置存储失败:', e)
  }
  return null
}

function saveToStorage(config: SystemConfigState) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        name: config.name,
        version: config.version,
        environment: config.environment
      }))
    }
  } catch (e) {
    console.warn('保存系统配置到存储失败:', e)
  }
}

function getInitialState(): SystemConfigState {
  const stored = getFromStorage()
  // 从version.json获取版本号
  let version = '1.0.0'
  
  try {
    // 在浏览器环境中尝试获取version.json
    if (typeof window !== 'undefined') {
      fetch('/version.json')
        .then(response => response.json())
        .then(data => {
          version = data.version || version
        })
        .catch()
    }
  } catch {}
  
  if (stored && stored.name) {
    return {
      name: stored.name,
      version: stored.version || version,
      environment: stored.environment || 'development',
      deployTime: new Date().toISOString(),
      lastUpdate: Date.now()
    }
  }
  return {
    name: '记账管理系统',
    version: version,
    environment: 'development',
    deployTime: new Date().toISOString(),
    lastUpdate: Date.now()
  }
}

const initialState = getInitialState()
const state = reactive<SystemConfigState>({ ...initialState })

export function getSystemConfig() {
  return readonly(state)
}

export function updateGlobalSystemConfig(config: Partial<SystemConfigState>) {
  Object.assign(state, config, { lastUpdate: Date.now() })
  console.log('🔄 全局系统配置已更新:', { name: state.name, version: state.version })
  
  // 同步保存到 localStorage
  saveToStorage(state)
  
  // 同步更新 window.SYSTEM_CONFIG
  if (typeof window !== 'undefined' && (window as any).SYSTEM_CONFIG) {
    const win = window as any
    if (config.name !== undefined) win.SYSTEM_CONFIG.name = config.name
    if (config.version !== undefined) win.SYSTEM_CONFIG.version = config.version
    if (config.environment !== undefined) win.SYSTEM_CONFIG.environment = config.environment
    win.SYSTEM_CONFIG.updateTitle()
  }
}

export function resetSystemConfig() {
  localStorage.removeItem(STORAGE_KEY)
  Object.assign(state, initialState, { lastUpdate: Date.now() })
}

export const SYSTEM_CONFIG_KEY = STORAGE_KEY
