import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import authStorageService from '@/services/authStorageService'

export interface AutoLogoutConfig {
  enabled: boolean
  timeoutMinutes: number
  warningMinutes: number
  timeoutMs: number      // 毫秒精度存储
  warningMs: number      // 毫秒精度存储
  lastValidation?: {
    isValid: boolean
    adjusted: boolean
    message: string
    timestamp: number
  }
}

const DEFAULT_CONFIG: AutoLogoutConfig = {
  enabled: true,
  timeoutMinutes: 30,
  warningMinutes: 2,
  timeoutMs: 30 * 60 * 1000,
  warningMs: 2 * 60 * 1000
}

const CONFIG_KEY = 'auto_logout_config'

const config = ref<AutoLogoutConfig>({ ...DEFAULT_CONFIG })
const isInitialized = ref(false)
const isActive = ref(false)
const showWarning = ref(false)
const remainingSeconds = ref(0)
const lastActivityTime = ref(Date.now())
const isOnline = ref(navigator.onLine)
const warningSessionId = ref<number>(0)

let router: any = null
let inactivityTimer: number | null = null
let warningTimer: number | null = null
let heartbeatTimer: number | null = null
let countdownTimer: number | null = null
let isListenersSetup = false

const timeoutMs = computed(() => config.value.timeoutMs)
const warningMs = computed(() => config.value.warningMs)
const warningThresholdMs = computed(() => config.value.timeoutMs - config.value.warningMs)

const loadConfig = (): AutoLogoutConfig => {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const timeoutMinutes = Math.max(1, Math.min(120, parsed.timeoutMinutes ?? DEFAULT_CONFIG.timeoutMinutes))
      let warningMinutes = parsed.warningMinutes ?? DEFAULT_CONFIG.warningMinutes
      
      let adjusted = false
      let message = '验证通过'
      const originalWarning = warningMinutes

      // 1. 验证超时时长 ≥ 提醒时长
      if (warningMinutes > timeoutMinutes) {
        // 2. 自动调整为超时时长的90%
        warningMinutes = Number((timeoutMinutes * 0.9).toFixed(2))
        adjusted = true
        message = `提醒时长(${originalWarning}min)大于超时时长(${timeoutMinutes}min)，已自动调整为${warningMinutes}min (90%)`
        
        // 5. 系统日志记录自动调整事件
        logActivity(`[自动调整] 原始输入: ${originalWarning}min, 调整后: ${warningMinutes}min, 时间戳: ${Date.now()}, 原因: 提醒时长超过超时时长`)
      }

      return {
        enabled: parsed.enabled ?? DEFAULT_CONFIG.enabled,
        timeoutMinutes,
        warningMinutes,
        timeoutMs: timeoutMinutes * 60 * 1000,
        warningMs: warningMinutes * 60 * 1000,
        lastValidation: {
          isValid: !adjusted,
          adjusted,
          message,
          timestamp: Date.now()
        }
      }
    }
  } catch (error) {
    console.error('[AutoLogout] 加载配置失败:', error)
  }
  return { ...DEFAULT_CONFIG }
}

const saveConfig = (newConfig: AutoLogoutConfig): void => {
  try {
    const timeoutMinutes = newConfig.timeoutMinutes
    let warningMinutes = newConfig.warningMinutes
    
    let adjusted = false
    let message = '验证通过'
    const originalWarning = warningMinutes

    // 强制校验：超时时长必须始终大于或等于提醒时长
    if (warningMinutes > timeoutMinutes) {
      warningMinutes = Number((timeoutMinutes * 0.9).toFixed(2))
      adjusted = true
      message = `提醒时长(${originalWarning}min)大于超时时长(${timeoutMinutes}min)，已自动调整为${warningMinutes}min`
      
      logActivity(`[自动保存调整] 原始值: ${originalWarning}min, 调整值: ${warningMinutes}min, 时间戳: ${Date.now()}`)
    }

    const finalConfig: AutoLogoutConfig = {
      ...newConfig,
      warningMinutes,
      timeoutMs: timeoutMinutes * 60 * 1000,
      warningMs: warningMinutes * 60 * 1000,
      lastValidation: {
        isValid: !adjusted,
        adjusted,
        message,
        timestamp: Date.now()
      }
    }
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify(finalConfig))
    config.value = finalConfig
  } catch (error) {
    console.error('[AutoLogout] 保存配置失败:', error)
  }
}

const updateConfig = (updates: Partial<AutoLogoutConfig>): void => {
  const newConfig = { ...config.value, ...updates }
  saveConfig(newConfig)
}

const getConfig = (): AutoLogoutConfig => config.value

const isAuthenticated = (): boolean => {
  const authState = authStorageService.getAuthState()
  // 移除对令牌过期的直接检查，允许通过刷新令牌维持会话。
  // 只有当会话完全过期或未认证时才认为已登出。
  return authState.isAuthenticated && !authStorageService.isSessionExpired()
}

const logActivity = (action: string): void => {
  if (process.env.NODE_ENV === 'development') {
    const now = new Date().toLocaleTimeString()
    console.log(`[AutoLogout] ${now} - ${action}`)
  }
}

const clearWarningTimers = (): void => {
  if (warningTimer) {
    clearTimeout(warningTimer)
    warningTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const clearAllTimers = (): void => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
  clearWarningTimers()
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

const performAutoLogout = (): void => {
  clearAllTimers()
  const currentSessionId = warningSessionId.value + 1
  warningSessionId.value = currentSessionId
  showWarning.value = false

  logActivity('执行自动登出')

  if (isAuthenticated()) {
    authStorageService.clearAuthData()
    ElMessage.warning('由于长时间无操作，您已自动登出')
  }

  if (router) {
    router.push('/login?reason=inactivity_timeout')
  } else if (typeof window !== 'undefined') {
    window.location.href = '/login?reason=inactivity_timeout'
  }
}

const startWarningPhase = (sessionId: number): void => {
  const now = Date.now()
  const idleTime = now - lastActivityTime.value

  if (showWarning.value) {
    const existingSessionId = warningSessionId.value
    logActivity(`警告对话框已显示中 (会话ID: ${existingSessionId}), 忽略新请求 (会话ID: ${sessionId})`)
    return
  }

  if (idleTime < warningThresholdMs.value - 100) {
    logActivity(`未达到警告阈值 (空闲${idleTime}ms < ${warningThresholdMs.value}ms), 忽略`)
    return
  }

  if (!config.value.enabled || config.value.timeoutMinutes <= 0) {
    config.value = loadConfig()
  }

  const remainingTime = Math.max(0, timeoutMs.value - idleTime)

  warningSessionId.value = sessionId
  remainingSeconds.value = Math.ceil(remainingTime / 1000)
  showWarning.value = true

  logActivity(`触发警告对话框 (会话ID: ${sessionId}, 剩余${remainingSeconds.value}秒, 空闲${idleTime}ms)`)

  clearInterval(countdownTimer)
  countdownTimer = window.setInterval(() => {
    if (!showWarning.value || warningSessionId.value !== sessionId) {
      clearInterval(countdownTimer!)
      countdownTimer = null
      return
    }

    remainingSeconds.value--

    if (remainingSeconds.value <= 0) {
      clearInterval(countdownTimer!)
      countdownTimer = null

      logActivity(`倒计时结束，执行自动登出 (会话ID: ${sessionId})`)

      if (warningSessionId.value === sessionId) {
        performAutoLogout()
      }
    }
  }, 1000)
}

const resetTimer = (): void => {
  if (!config.value.enabled || !isAuthenticated()) {
    return
  }

  const now = Date.now()
  lastActivityTime.value = now

  if (showWarning.value) {
    const currentSessionId = warningSessionId.value + 1
    warningSessionId.value = currentSessionId
    showWarning.value = false
    clearWarningTimers()
  }

  clearAllTimers()

  if (timeoutMs.value <= 0) {
    return
  }

  const sessionId = Date.now()

  if (warningMs.value > 0 && warningMs.value < timeoutMs.value) {
    warningTimer = window.setTimeout(() => {
      if (!isAuthenticated()) {
        return
      }

      const currentIdleTime = Date.now() - lastActivityTime.value
      if (currentIdleTime >= warningThresholdMs.value - 100) {
        startWarningPhase(sessionId)
      }
    }, warningThresholdMs.value)
  }

  inactivityTimer = window.setTimeout(() => {
    if (!isAuthenticated()) {
      return
    }

    const currentIdleTime = Date.now() - lastActivityTime.value
    if (currentIdleTime >= timeoutMs.value - 100) {
      logActivity(`空闲超时，执行自动登出 (会话ID: ${sessionId})`)
      performAutoLogout()
    } else {
      resetTimer()
    }
  }, timeoutMs.value)
}

const startHeartbeat = (): void => {
  let heartbeatCount = 0

  heartbeatTimer = window.setInterval(() => {
    if (!config.value.enabled || config.value.timeoutMinutes <= 0) {
      config.value = loadConfig()
    }

    if (!config.value.enabled || !isAuthenticated()) {
      return
    }

    const now = Date.now()
    const idleTime = now - lastActivityTime.value

    if (idleTime >= timeoutMs.value) {
      logActivity('心跳检测发现已超时')
      performAutoLogout()
      return
    }

    if (warningMs.value > 0 && idleTime >= warningThresholdMs.value && !showWarning.value) {
      logActivity('心跳检测补发警告对话框')
      const sessionId = Date.now() + '_heartbeat_' + (++heartbeatCount)
      startWarningPhase(sessionId)
    }
  }, 10000)
}

const handleUserActivity = (eventOrManual?: any): void => {
  // 只在页面处于可见状态（在该系统页面内）时才采集行为
  if (isOnline.value && document.visibilityState === 'visible' && document.hasFocus()) {
    if (showWarning.value && eventOrManual !== true) {
      logActivity('检测到活动，自动保持会话活跃')
    }
    resetTimer()
  }
}

const handleVisibilityChange = (): void => {
  if (document.visibilityState === 'visible') {
    logActivity('页面恢复可见')
    const now = Date.now()
    const idleTime = now - lastActivityTime.value

    if (idleTime >= timeoutMs.value) {
      performAutoLogout()
    } else {
      resetTimer()
    }
  } else {
    logActivity('页面切换至后台')
  }
}

const handleNetworkChange = (): void => {
  isOnline.value = navigator.onLine
  if (isOnline.value) {
    logActivity('网络已恢复')
    resetTimer()
  } else {
    logActivity('网络已断开')
    ElMessage.warning('网络连接已断开，自动登出计时器已暂停')
  }
}

const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
  if (showWarning.value) {
    event.preventDefault()
    event.returnValue = '系统即将自动登出，确定要离开吗？'
    return event.returnValue
  }
}

const setupEventListeners = (): void => {
  if (isListenersSetup) {
    return
  }

  window.addEventListener('mousemove', handleUserActivity, { passive: true })
  window.addEventListener('keydown', handleUserActivity, { passive: true })
  window.addEventListener('click', handleUserActivity, { passive: true })
  window.addEventListener('scroll', handleUserActivity, { passive: true })
  window.addEventListener('touchstart', handleUserActivity, { passive: true })
  window.addEventListener('touchmove', handleUserActivity, { passive: true })
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('online', handleNetworkChange)
  window.addEventListener('offline', handleNetworkChange)
  window.addEventListener('beforeunload', handleBeforeUnload)

  isListenersSetup = true
  logActivity('事件监听器已设置')
}

const removeEventListeners = (): void => {
  window.removeEventListener('mousemove', handleUserActivity)
  window.removeEventListener('keydown', handleUserActivity)
  window.removeEventListener('click', handleUserActivity)
  window.removeEventListener('scroll', handleUserActivity)
  window.removeEventListener('touchstart', handleUserActivity)
  window.removeEventListener('touchmove', handleUserActivity)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('online', handleNetworkChange)
  window.removeEventListener('offline', handleNetworkChange)
  window.removeEventListener('beforeunload', handleBeforeUnload)

  isListenersSetup = false
  logActivity('事件监听器已移除')
}

const initialize = (newRouter?: any): void => {
  if (isInitialized.value) {
    return
  }

  if (newRouter) {
    router = newRouter
  }

  config.value = loadConfig()
  lastActivityTime.value = Date.now()

  setupEventListeners()

  if (isAuthenticated() && config.value.enabled) {
    resetTimer()
    startHeartbeat()
    isActive.value = true
    logActivity('自动登出机制已启动')
  }

  isInitialized.value = true
}

const shutdown = (): void => {
  clearAllTimers()
  isActive.value = false
  isInitialized.value = false
  logActivity('自动登出机制已停止')
}

const activate = (newRouter?: any): void => {
  if (newRouter) {
    router = newRouter
  }

  if (!isInitialized.value) {
    initialize(newRouter)
  } else if (isAuthenticated() && config.value.enabled) {
    resetTimer()
    startHeartbeat()
    isActive.value = true
    logActivity('自动登出机制已激活')
  }
}

const deactivate = (): void => {
  clearAllTimers()
  isActive.value = false
  logActivity('自动登出机制已停用')
}

const keepSessionAlive = (): void => {
  logActivity('用户选择保持会话活跃')
  handleUserActivity(true)
}

const setRouter = (newRouter: any): void => {
  router = newRouter
}

export function useAutoLogout() {
  return {
    config: computed(() => config.value),
    isActive: computed(() => isActive.value),
    showWarning: computed(() => showWarning.value),
    remainingSeconds: computed(() => remainingSeconds.value),
    warningSessionId: computed(() => warningSessionId.value),
    isOnline: computed(() => isOnline.value),

    initialize,
    shutdown,
    activate,
    deactivate,
    updateConfig,
    getConfig,
    keepSessionAlive,
    handleUserActivity,
    setRouter
  }
}

export default useAutoLogout
