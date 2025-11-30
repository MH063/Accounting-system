// Vue模块类型声明

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.svg'
declare module '*.ico'

declare module '*.css'
declare module '*.scss'
declare module '*.sass'
declare module '*.less'

declare module '*.json' {
  const value: Record<string, unknown>
  export default value
}

// 全局属性声明
interface Window {
  toggleNavIndicator?: () => void
  ethereum?: {
    isMetaMask?: boolean
    request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>
    on: (event: string, callback: (...args: unknown[]) => void) => void
    removeListener: (event: string, callback: (...args: unknown[]) => void) => void
  }
  webkit?: Record<string, unknown>
  mozIndexedDB?: IDBFactory
  webkitIndexedDB?: IDBFactory
  msIndexedDB?: IDBFactory
}

// Element Plus全局属性
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $message: typeof import('element-plus')['ElMessage']
    $notify: typeof import('element-plus')['ElNotification']
    $msgbox: typeof import('element-plus')['ElMessageBox']
    $alert: typeof import('element-plus')['ElMessageBox']['alert']
    $confirm: typeof import('element-plus')['ElMessageBox']['confirm']
    $prompt: typeof import('element-plus')['ElMessageBox']['prompt']
    $loading: typeof import('element-plus')['ElLoadingService']
  }
}

// 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_BUILD_TIME: string
  readonly MODE: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 网络连接类型
type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'unknown'
type EffectiveConnectionType = '4g' | '3g' | '2g' | 'slow-2g'

interface Navigator {
  connection?: {
    effectiveType: EffectiveConnectionType
    type: ConnectionType
    downlink: number
    rtt: number
    saveData: boolean
    addEventListener: (type: string, listener: EventListener) => void
    removeEventListener: (type: string, listener: EventListener) => void
  }
}

// 性能条目类型
type PerformanceEntryType = 'navigation' | 'resource' | 'paint' | 'measure' | 'mark' | 'longtask'

interface PerformanceObserverInit {
  entryTypes?: PerformanceEntryType[]
  type?: PerformanceEntryType
  buffered?: boolean
}

// 自定义事件类型
interface CustomEvent<T = unknown> extends Event {
  detail: T
}

declare global {
  interface Document {
    documentMode?: unknown
  }
  
  interface HTMLElement {
    webkitRequestFullscreen?: () => void
    msRequestFullscreen?: () => void
    mozRequestFullScreen?: () => void
  }
  
  interface Element {
    webkitRequestFullscreen?: () => void
    msRequestFullscreen?: () => void
    mozRequestFullScreen?: () => void
  }
}

export {}