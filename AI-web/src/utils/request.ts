import type { ApiResponse } from '@/types'

// 请求配置接口
export interface RequestConfig extends RequestInit {
  timeout?: number
  retry?: number
  retryDelay?: number
  data?: any
}

// 请求拦截器
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  onRequestError?: (error: Error) => Promise<Error>
}

// 响应拦截器
export interface ResponseInterceptor {
  onResponse?: (response: Response) => Response | Promise<Response>
  onResponseError?: (error: Error) => Promise<Error>
}

// 默认配置
const defaultConfig: RequestConfig = {
  method: 'GET',
  timeout: 30000, // 30秒超时
  retry: 3, // 重试3次
  retryDelay: 1000, // 重试延迟1秒
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// 请求拦截器列表
const requestInterceptors: RequestInterceptor[] = []
const responseInterceptors: ResponseInterceptor[] = []

// 基础URL - 添加/api前缀
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.111.53.9:4000/api'

/**
 * 添加请求拦截器
 */
export const addRequestInterceptor = (interceptor: RequestInterceptor): void => {
  requestInterceptors.push(interceptor)
}

/**
 * 添加响应拦截器
 */
export const addResponseInterceptor = (interceptor: ResponseInterceptor): void => {
  responseInterceptors.push(interceptor)
}

/**
 * 获取认证令牌
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token')
}

/**
 * 获取刷新令牌
 */
const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token')
}

// 多标签页同步机制
const authChannel = typeof window !== 'undefined' ? new BroadcastChannel('auth_channel') : null

/**
 * 发送令牌更新消息给其他标签页
 */
const notifyTokenUpdate = (accessToken: string, refreshToken?: string) => {
  if (authChannel) {
    authChannel.postMessage({
      type: 'TOKEN_UPDATE',
      accessToken,
      refreshToken
    })
  }
}

/**
 * 监听其他标签页的令牌更新消息
 */
if (authChannel) {
  authChannel.onmessage = (event) => {
    if (event.data.type === 'TOKEN_UPDATE') {
      const { accessToken, refreshToken } = event.data
      console.log('接收到其他标签页的令牌更新消息')
      // 更新本地存储，但不再次通知，避免无限循环
      localStorage.setItem('access_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }
      // 更新过期时间
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]))
        if (payload && typeof payload.exp === 'number') {
          localStorage.setItem('token_expires', (payload.exp * 1000).toString())
        }
      } catch (e) {
        console.warn('同步解析令牌过期时间失败:', e)
      }
    } else if (event.data.type === 'LOGOUT') {
      console.log('接收到其他标签页的登出消息')
      clearAuthToken()
      window.location.href = '/login'
    }
  }
}

/**
 * 保存认证令牌
 */
const saveAuthToken = (accessToken: string, refreshToken?: string): void => {
  localStorage.setItem('access_token', accessToken)
  
  // 解析并保存过期时间
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    if (payload && typeof payload.exp === 'number') {
      localStorage.setItem('token_expires', (payload.exp * 1000).toString())
    } else {
      console.warn('令牌负载中缺少有效过期时间:', payload)
    }
  } catch (e) {
    console.warn('解析令牌过期时间失败:', e)
  }

  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken)
    try {
      const payload = JSON.parse(atob(refreshToken.split('.')[1]))
      if (payload && typeof payload.exp === 'number') {
        localStorage.setItem('refresh_token_expires', (payload.exp * 1000).toString())
      }
    } catch (e) {
      console.warn('解析刷新令牌过期时间失败:', e)
    }
  }

  // 通知其他标签页
  notifyTokenUpdate(accessToken, refreshToken)
}

// 时间同步状态
let serverTimeOffset = 0 // 服务器时间 - 客户端时间

/**
 * 同步服务器时间
 */
const syncServerTime = async () => {
  try {
    const startTime = Date.now()
    const response = await fetch(`${BASE_URL}/system/time`)
    const endTime = Date.now()
    
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data.timestamp) {
        // 计算往返延迟的一半作为网络传输补偿
        const latency = (endTime - startTime) / 2
        const serverTimestamp = result.data.timestamp
        serverTimeOffset = serverTimestamp - (endTime - latency)
        console.log(`服务器时间同步成功，偏移量: ${serverTimeOffset}ms`)
      }
    }
  } catch (error) {
    console.warn('服务器时间同步失败:', error)
  }
}

/**
 * 获取当前的服务器校准时间
 */
export const getServerTime = (): number => {
  return Date.now() + serverTimeOffset
}

// 初始同步
syncServerTime()
// 每30分钟自动校准一次
setInterval(syncServerTime, 30 * 60 * 1000)

/**
 * 检查令牌是否即将过期（提前5分钟，基于校准后的时间）
 */
export const isTokenExpiringSoon = (): boolean => {
  const expires = localStorage.getItem('token_expires')
  if (!expires || expires === 'NaN') return false
  
  const expiryTime = parseInt(expires)
  if (isNaN(expiryTime)) return false
  
  const currentServerTime = getServerTime()
  const fiveMinutes = 5 * 60 * 1000
  
  // 使用校准后的服务器时间进行判断
  return expiryTime - currentServerTime < fiveMinutes
}

/**
 * 获取令牌剩余秒数（基于校准后的时间）
 */
export const getTokenRemainingTime = (): number => {
  const expires = localStorage.getItem('token_expires')
  if (!expires || expires === 'NaN') return 0
  
  const expiryTime = parseInt(expires)
  if (isNaN(expiryTime)) return 0
  
  const currentServerTime = getServerTime()
  return Math.max(0, Math.floor((expiryTime - currentServerTime) / 1000))
}

/**
 * 清除认证令牌
 */
const clearAuthToken = (): void => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

/**
 * 清除所有认证信息并跳转到登录页
 */
const clearAuthAndRedirect = (): void => {
  console.log('清除所有认证信息并跳转到登录页...')
  
  // 清除所有认证相关的本地存储项
  const keysToRemove = [
    'access_token',
    'refresh_token',
    'token_expires',
    'refresh_token_expires',
    'isAuthenticated',
    'user_info',
    'userId',
    'username',
    'email',
    'nickname',
    'avatar_url',
    'status',
    'sessionId',
    'sessionToken',
    'sessionExpires',
    'userRole',
    'userPermissions'
  ]
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
  })
  
  // 清除sessionStorage中的信息
  sessionStorage.clear()
  
  // 跳转到登录页
  if (typeof window !== 'undefined') {
    window.location.href = '/login?reason=token_expired'
  }
}

/**
 * 检查响应是否是令牌过期错误
 */
const isTokenExpiredError = (error: any): boolean => {
  // 检查HTTP状态码
  if (error.response && error.response.status === 401) {
    console.log('检测到401错误，可能是令牌过期')
    
    // 检查错误信息，支持多种格式
    try {
      const errorData = error.response.data
      console.log('错误数据:', errorData)
      
      // 检查常见的令牌过期错误信息
      const errorMessages = [
        '访问令牌已过期',
        'token_expired',
        'TOKEN_EXPIRED',
        '令牌过期',
        'expired_token',
        '授权过期',
        'authorization expired',
        'invalid token',
        '身份验证已过期'
      ]
      
      // 检查是否包含特定的错误代码
      if (errorData && (errorData.code === 'TOKEN_EXPIRED' || errorData.errorCode === 'TOKEN_EXPIRED')) {
        console.log('检测到标准化令牌过期错误代码: TOKEN_EXPIRED')
        return true
      }
      
      // 检查errorData中的各个字段
      let errorText = ''
      try {
        errorText = errorData ? JSON.stringify(errorData).toLowerCase() : ''
      } catch (e) {
        errorText = String(errorData).toLowerCase()
      }
      for (const msg of errorMessages) {
        if (errorText.includes(msg.toLowerCase())) {
          console.log(`检测到令牌过期错误: ${msg}`)
          return true
        }
      }
      
      // 检查原始错误信息
      if (error.message && errorMessages.some(msg => {
        try {
          return error.message.toLowerCase().includes(msg.toLowerCase())
        } catch (e) {
          return false
        }
      })) {
        console.log(`从错误消息中检测到令牌过期: ${error.message}`)
        return true
      }
      
      // 对于所有401错误，默认认为是令牌过期
      console.log('401错误，但未检测到具体的令牌过期信息，默认按令牌过期处理')
      return true
    } catch (e) {
      console.error('解析错误数据失败:', e)
      // 解析失败时，401错误默认按令牌过期处理
      return true
    }
  }
  return false
}

// 令牌刷新锁与排队机制
let isRefreshing = false
let requestsQueue: Array<(token: string) => void> = []
let lastRefreshTime = 0 // 上次成功刷新的时间
const REFRESH_COOLDOWN = 5000 // 5秒内不重复刷新

/**
 * 检查是否正在刷新令牌
 */
export const getIsRefreshing = (): boolean => isRefreshing

/**
 * 完成刷新流程，处理等待队列
 */
const finishRefresh = (token: string = '') => {
  isRefreshing = false
  if (token) {
    lastRefreshTime = Date.now()
  }
  if (requestsQueue.length > 0) {
    console.log(`处理刷新等待队列，长度: ${requestsQueue.length}`)
    requestsQueue.forEach(callback => callback(token))
    requestsQueue = []
  }
}

/**
 * 等待刷新完成
 * 如果当前正在刷新或有全局锁，则等待完成；否则立即返回
 */
export const waitForRefresh = async (retryCount = 0): Promise<void> => {
  if (retryCount > 3) {
    console.warn('waitForRefresh: 超过最大重试次数')
    return
  }

  if (isRefreshing) {
    return new Promise((resolve) => {
      requestsQueue.push(() => resolve())
    })
  }

  const { isLocked: hasGlobalLock, lockData } = checkGlobalRefreshLock()
  if (hasGlobalLock && lockData) {
    console.log('waitForRefresh: 检测到全局刷新锁，开始等待同步...')
    const elapsed = Date.now() - lockData.timestamp
    if (elapsed < GLOBAL_REFRESH_LOCK_TIMEOUT) {
      isRefreshing = true
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('waitForRefresh: 等待全局刷新锁超时')
          isRefreshing = false
          resolve()
        }, Math.max(500, GLOBAL_REFRESH_LOCK_TIMEOUT - elapsed))

        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'TOKEN_UPDATE') {
            clearTimeout(timeout)
            if (authChannel) {
              authChannel.removeEventListener('message', handleMessage as any)
            }
            isRefreshing = false
            resolve()
          }
        }

        if (authChannel) {
          authChannel.addEventListener('message', handleMessage as any)
        } else {
          const checkInterval = setInterval(() => {
            const { isLocked } = checkGlobalRefreshLock()
            if (!isLocked) {
              clearInterval(checkInterval)
              clearTimeout(timeout)
              isRefreshing = false
              resolve()
            }
          }, 200)
        }
      })
    }
  }

  return Promise.resolve()
}

// 跨标签页刷新锁键名
const GLOBAL_REFRESH_LOCK_KEY = 'auth_refresh_lock'
const GLOBAL_REFRESH_LOCK_TIMEOUT = 60000 // 60秒超时，防止死锁（需小于后端宽限期）
const STALE_LOCK_THRESHOLD = 10000 // 10秒认为锁已过期

/**
 * 页面初始化时清理过期的全局刷新锁
 * 解决页面刷新后锁状态不一致的问题
 */
const initializeAuthState = (): void => {
  const lock = localStorage.getItem(GLOBAL_REFRESH_LOCK_KEY)
  if (lock) {
    try {
      const { timestamp } = JSON.parse(lock)
      const elapsed = Date.now() - timestamp
      if (elapsed > STALE_LOCK_THRESHOLD) {
        console.log('检测到过期的全局刷新锁，清理中...', `经过时间: ${elapsed}ms`)
        localStorage.removeItem(GLOBAL_REFRESH_LOCK_KEY)
      } else if (elapsed > GLOBAL_REFRESH_LOCK_TIMEOUT) {
        console.log('检测到超时的全局刷新锁，清理中...', `经过时间: ${elapsed}ms`)
        localStorage.removeItem(GLOBAL_REFRESH_LOCK_KEY)
      } else {
        console.log('存在活跃的全局刷新锁，可能其他标签页正在刷新令牌')
      }
    } catch (e) {
      console.warn('解析全局刷新锁失败，清理中...')
      localStorage.removeItem(GLOBAL_REFRESH_LOCK_KEY)
    }
  }

  const tokenExpires = localStorage.getItem('token_expires')
  if (tokenExpires) {
    const expiryTime = parseInt(tokenExpires)
    const remaining = expiryTime - Date.now()
    if (remaining < 0) {
      console.log('检测到已过期的访问令牌，尝试刷新...')
      refreshAccessToken().catch(() => {})
    } else if (remaining < 5 * 60 * 1000) {
      console.log('访问令牌即将过期，延迟后刷新...')
      setTimeout(() => {
        refreshAccessToken().catch(() => {})
      }, 1000)
    }
  }
}

/**
 * 检查全局刷新锁
 */
const checkGlobalRefreshLock = (): { isLocked: boolean; lockData: any } => {
  const lock = localStorage.getItem(GLOBAL_REFRESH_LOCK_KEY)
  if (!lock) return { isLocked: false, lockData: null }

  try {
    const lockData = JSON.parse(lock)
    const elapsed = Date.now() - lockData.timestamp

    if (elapsed > GLOBAL_REFRESH_LOCK_TIMEOUT) {
      console.log(`全局刷新锁已超时 ${elapsed}ms，清理并视为未锁定`)
      localStorage.removeItem(GLOBAL_REFRESH_LOCK_KEY)
      return { isLocked: false, lockData: null }
    }

    return { isLocked: true, lockData }
  } catch (e) {
    localStorage.removeItem(GLOBAL_REFRESH_LOCK_KEY)
    return { isLocked: false, lockData: null }
  }
}

/**
 * 设置全局刷新锁
 */
const setGlobalRefreshLock = (): string | null => {
  const { isLocked, lockData } = checkGlobalRefreshLock()
  if (isLocked) {
    const elapsed = Date.now() - lockData.timestamp
    if (elapsed < GLOBAL_REFRESH_LOCK_TIMEOUT) {
      console.log('全局刷新锁已被其他标签页持有，跳过设置')
      return null
    }
  }

  const tabId = Math.random().toString(36).substring(2, 15)
  localStorage.setItem(GLOBAL_REFRESH_LOCK_KEY, JSON.stringify({
    timestamp: Date.now(),
    tabId
  }))
  return tabId
}

/**
 * 清除全局刷新锁
 */
const clearGlobalRefreshLock = (): void => {
  localStorage.removeItem(GLOBAL_REFRESH_LOCK_KEY)
}

// 监听 storage 事件，同步标签页之间的状态
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === GLOBAL_REFRESH_LOCK_KEY) {
      console.log('检测到全局刷新锁变化:', event.newValue)
      const { isLocked } = checkGlobalRefreshLock()
      if (!isLocked && isRefreshing) {
        console.log('其他标签页释放了刷新锁，但本页仍在刷新中，继续等待...')
      }
    }

    if (event.key === 'access_token' && event.newValue) {
      console.log('检测到访问令牌更新')
    }
  })
}

// 页面初始化时执行状态检查
if (typeof window !== 'undefined') {
  setTimeout(initializeAuthState, 0)
}

/**
 * 刷新访问令牌
 */
export const refreshAccessToken = async (retryCount = 0): Promise<boolean> => {
  // 限制递归/重试深度
  if (retryCount > 3) {
    console.error('刷新令牌重试次数过多，停止重试')
    return false
  }

  // 检查冷却时间
  const now = Date.now()
  if (now - lastRefreshTime < REFRESH_COOLDOWN) {
    console.log('令牌刚刚刷新过，跳过本次刷新请求')
    return true
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    console.error('刷新令牌不存在')
    return false
  }

  if (isRefreshing) {
    console.log('本标签页正在刷新中，加入等待队列')
    return new Promise((resolve) => {
      requestsQueue.push((token: string) => {
        resolve(!!token)
      })
    })
  }

  const { isLocked: hasGlobalLock, lockData } = checkGlobalRefreshLock()

  if (hasGlobalLock && lockData) {
    console.log('检测到其他标签页正在刷新，本页等待同步消息...')
    isRefreshing = true

    return new Promise((resolve) => {
      const startTime = Date.now()
      const pollInterval = 500
      const maxWaitTime = GLOBAL_REFRESH_LOCK_TIMEOUT

      const checkAndResolve = (accessToken: string | null): boolean => {
        if (accessToken) {
          finishRefresh(accessToken)
          return true
        }
        return false
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'TOKEN_UPDATE') {
          const { accessToken } = event.data
          console.log('收到跨标签页令牌更新消息，结束等待')
          clearTimeout(timeout)
          if (authChannel) {
            authChannel.removeEventListener('message', handleMessage as any)
          }
          finishRefresh(accessToken)
          resolve(true)
        }
      }

      const timeout = setTimeout(async () => {
        console.warn('等待其他标签页刷新令牌超时')
        if (authChannel) {
          authChannel.removeEventListener('message', handleMessage as any)
        }

        const currentLock = localStorage.getItem(GLOBAL_REFRESH_LOCK_KEY)
        if (currentLock) {
          try {
            const lockDataInner = JSON.parse(currentLock)
            if (lockDataInner.tabId) {
              isRefreshing = false
              // 延迟重试，避免紧凑循环
              await new Promise(r => setTimeout(r, 1000))
              return resolve(refreshAccessToken(retryCount + 1))
            }
          } catch (e) {}
        }

        const latestAccessToken = getAuthToken()
        if (checkAndResolve(latestAccessToken)) {
          resolve(true)
        } else {
          isRefreshing = false
          resolve(false)
        }
      }, Math.max(1000, maxWaitTime - (Date.now() - startTime)))

      if (authChannel) {
        authChannel.addEventListener('message', handleMessage as any)
      } else {
        const checkInterval = setInterval(async () => {
          const elapsed = Date.now() - startTime
          if (elapsed >= maxWaitTime) {
            clearInterval(checkInterval)
            return
          }

          const currentLock = localStorage.getItem(GLOBAL_REFRESH_LOCK_KEY)
          if (!currentLock) {
            clearInterval(checkInterval)
            clearTimeout(timeout)

            const latestAccessToken = getAuthToken()
            if (checkAndResolve(latestAccessToken)) {
              resolve(true)
            } else {
              isRefreshing = false
              // 延迟重试
              await new Promise(r => setTimeout(r, 500))
              resolve(refreshAccessToken(retryCount + 1))
            }
          }
        }, pollInterval)
      }
    })
  }

  isRefreshing = true
  const myTabId = setGlobalRefreshLock()

  if (!myTabId) {
    console.log('获取全局锁失败，可能发生竞争，稍后重试')
    isRefreshing = false
    await new Promise(r => setTimeout(r, 500))
    return refreshAccessToken(retryCount + 1)
  }

  console.log('开始刷新访问令牌 (持有全局锁)...')

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      if (response.status === 409 || errorData.code === 'CONCURRENT_REFRESH') {
        console.log('检测到后端返回并发刷新冲突(409)，处理中...')

        await new Promise(resolve => setTimeout(resolve, 300))

        const latestAccessToken = getAuthToken()
        if (latestAccessToken) {
          console.log('使用本地最新的令牌')
          finishRefresh(latestAccessToken)
          clearGlobalRefreshLock()
          return true
        }

        if (errorData.data && errorData.data.accessToken) {
          console.log('使用后端返回的最新令牌')
          const { accessToken, refreshToken: newRefreshToken } = errorData.data
          saveAuthToken(accessToken, newRefreshToken || refreshToken)
          finishRefresh(accessToken)
          clearGlobalRefreshLock()
          return true
        }

        console.warn('并发刷新冲突但无有效令牌，返回失败')
        finishRefresh('')
        clearGlobalRefreshLock()
        return false
      }

      console.error('刷新令牌接口请求失败:', response.status, errorData)
      throw new Error('刷新令牌请求失败')
    }

    const data = await response.json()
    if (data.success && data.data) {
      const { accessToken, refreshToken: newRefreshToken } = data.data
      saveAuthToken(accessToken, newRefreshToken || refreshToken)
      console.log('令牌刷新成功')

      finishRefresh(accessToken)
      clearGlobalRefreshLock()
      return true
    }

    throw new Error(data.message || '刷新令牌失败')
  } catch (error) {
    console.error('刷新访问令牌出错:', error)
    finishRefresh('')
    clearAuthToken()
    clearGlobalRefreshLock()
    return false
  } finally {
    isRefreshing = false
  }
}

/**
 * 处理请求拦截器
 */
const applyRequestInterceptors = async (config: RequestConfig): Promise<RequestConfig> => {
  let processedConfig = { ...config }
  
  for (const interceptor of requestInterceptors) {
    if (interceptor.onRequest) {
      processedConfig = await interceptor.onRequest(processedConfig)
    }
  }
  
  return processedConfig
}

/**
 * 处理响应拦截器
 */
const applyResponseInterceptors = async (response: Response): Promise<Response> => {
  let processedResponse = response
  
  for (const interceptor of responseInterceptors) {
    if (interceptor.onResponse) {
      processedResponse = await interceptor.onResponse(processedResponse)
    }
  }
  
  return processedResponse
}

/**
 * 处理响应错误
 */
const handleResponseError = async (error: Error): Promise<Error> => {
  let processedError = error
  
  for (const interceptor of responseInterceptors) {
    if (interceptor.onResponseError) {
      processedError = await interceptor.onResponseError(processedError)
    }
  }
  
  return processedError
}

/**
 * 延迟函数
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试机制
 */
const retryRequest = async (
  url: string,
  config: RequestConfig,
  retryCount: number
): Promise<Response> => {
  try {
    const response = await fetch(url, config)
    return response
  } catch (error) {
    if (retryCount > 0) {
      console.log(`请求失败，${config.retryDelay}ms后重试，剩余重试次数：${retryCount}`)
      await delay(config.retryDelay || 1000)
      return retryRequest(url, config, retryCount - 1)
    }
    throw error
  }
}

/**
 * 统一的请求函数
 */
export async function request<T = any>(
  url: string,
  config: RequestConfig = {}
): Promise<T> {
  let retryCount = 0
  const maxRetryCount = 1 // 最多重试1次（用于令牌刷新）
  
  // 避免对刷新令牌接口本身进行重试，防止循环调用
  const isRefreshTokenRequest = url.includes('/auth/refresh-token')
  
  let refreshRetryCount = 0
  const maxRefreshRetry = 2

  while (refreshRetryCount < maxRefreshRetry) {
    try {
      // 合并配置
      const mergedConfig: RequestConfig = {
        ...defaultConfig,
        ...config
      }
      
      // 构建完整URL
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
      
  // 令牌预检测：如果即将过期且不是刷新令牌请求，则先刷新
  if (!isRefreshTokenRequest && isTokenExpiringSoon()) {
    console.log('检测到令牌即将过期，执行预刷新...')
    refreshRetryCount++
    if (refreshRetryCount >= maxRefreshRetry) {
      console.warn('预刷新重试次数过多，停止预刷新尝试')
    } else {
      const refreshSuccess = await refreshAccessToken()
      if (!refreshSuccess) {
        console.warn('预刷新令牌失败，尝试继续请求或跳转登录')
        // 如果刷新失败且没有访问令牌，可能需要跳转
        if (!getAuthToken()) {
          clearAuthAndRedirect()
          return null as unknown as T
        }
      }
    }
  }
  
  // 添加认证令牌
  const token = getAuthToken()
  if (token) {
    mergedConfig.headers = {
      ...mergedConfig.headers,
      'Authorization': `Bearer ${token}`
    }
  } else {
    // 对于登录和注册等不需要认证的接口，不显示警告
    const noAuthEndpoints = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/refresh-token', '/auth/refresh']
    const isNoAuthEndpoint = noAuthEndpoints.some(endpoint => url.includes(endpoint))
    
    if (!isNoAuthEndpoint) {
      console.warn('警告: 请求未携带认证令牌', fullUrl)
    }
  }
      
      // 处理请求体
      if ((mergedConfig as any).data && !mergedConfig.body) {
        if ((mergedConfig as any).data instanceof FormData) {
          mergedConfig.body = (mergedConfig as any).data
          // 移除Content-Type头，让浏览器自动设置
          delete (mergedConfig.headers as any)['Content-Type']
        } else {
          mergedConfig.body = JSON.stringify((mergedConfig as any).data)
        }
      }
      
      // 应用请求拦截器
      const processedConfig = await applyRequestInterceptors(mergedConfig)
      
      console.log(`请求: ${config.method || 'GET'} ${fullUrl}`)
      
      // 发送请求（带重试机制）
      const response = await retryRequest(
        fullUrl,
        processedConfig,
        processedConfig.retry || 0
      )
      
      // 应用响应拦截器
      const processedResponse = await applyResponseInterceptors(response)
      
      // 处理响应
      if (!processedResponse.ok) {
        let errorMessage = '请求失败'
        let errorData = null
        try {
          errorData = await processedResponse.json()
          errorMessage = errorData.message || errorData.error || `HTTP ${processedResponse.status}`
        } catch {
          errorMessage = `HTTP ${processedResponse.status}: ${processedResponse.statusText}`
        }
        
        // 特殊处理401错误
        if (processedResponse.status === 401) {
          const noAuthEndpoints = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/refresh-token', '/auth/refresh']
          const isNoAuthEndpoint = noAuthEndpoints.some(endpoint => url.includes(endpoint))
          
          if (isNoAuthEndpoint) {
            console.log('[request] 非认证接口401错误，保持原始错误信息:', errorMessage)
          } else {
            console.log('[request] 检测到401未授权错误，清除认证信息并跳转到登录页')
            clearAuthAndRedirect()
            return
          }
        }
        
        const error = new Error(errorMessage)
        ;(error as any).status = processedResponse.status
        ;(error as any).response = processedResponse
        ;(error as any).errorData = errorData
        
        throw await handleResponseError(error)
      }
      
      // 解析响应数据
      const contentType = processedResponse.headers.get('content-type')
      let data: T
      
      if (contentType && contentType.includes('application/json')) {
        // 尝试解析JSON响应，如果失败则返回默认响应结构
        try {
          data = await processedResponse.json()
        } catch (parseError) {
          console.warn('JSON解析失败，返回默认响应结构:', parseError)
          // 返回默认的成功响应结构
          data = {
            success: true,
            message: '请求成功但无数据返回',
            data: null
          } as unknown as T
        }
      } else if (contentType && contentType.includes('text/')) {
        data = await processedResponse.text() as unknown as T
      } else {
        data = await processedResponse.blob() as unknown as T
      }
      
      console.log(`响应: ${config.method || 'GET'} ${fullUrl} - 成功`)
      
      return data
    } catch (error: any) {
      console.error(`请求失败: ${config.method || 'GET'} ${url}`, error)
      
      // 检查是否是令牌过期错误，并且没有超过重试次数，并且不是刷新令牌请求本身
      const noAuthEndpoints = ['/auth/login', '/auth/register', '/auth/reset-password']
      const isNoAuthEndpoint = noAuthEndpoints.some(endpoint => url.includes(endpoint))

      if (!isNoAuthEndpoint && !isRefreshTokenRequest && isTokenExpiredError(error)) {
        console.log('检测到令牌过期，尝试刷新令牌...')
        refreshRetryCount++
        
        if (refreshRetryCount >= maxRefreshRetry) {
          console.error('达到最大刷新重试次数，跳转登录')
          clearAuthAndRedirect()
          return null as unknown as T
        }

        // 尝试刷新令牌
        const refreshSuccess = await refreshAccessToken()
        if (refreshSuccess) {
          console.log('令牌刷新成功，重试请求...')
          // 清除缓存的token，重新获取最新的token
          delete config.headers?.Authorization
          continue // 重试请求
        } else {
          console.log('刷新令牌失败，无法重试请求')
          // 清除认证信息并跳转到登录页
          clearAuthAndRedirect()
          return null as unknown as T
        }
      }
      
      // 不是令牌过期错误或刷新失败，抛出错误
      throw await handleResponseError(error)
    }
  }
  
  // 如果跳出了循环且没有返回，说明重试多次依然失败
  throw new Error('请求失败: 令牌刷新多次仍无效')
}

/**
 * GET请求快捷方法
 */
export const get = <T = any>(url: string, config?: RequestConfig): Promise<T> => {
  return request<T>(url, { ...config, method: 'GET' })
}

/**
 * POST请求快捷方法
 */
export const post = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> => {
  return request<T>(url, { ...config, method: 'POST', data: data } as any)
}

/**
 * PUT请求快捷方法
 */
export const put = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> => {
  return request<T>(url, { ...config, method: 'PUT', data: data } as any)
}

/**
 * DELETE请求快捷方法
 */
export const del = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> => {
  return request<T>(url, { ...config, method: 'DELETE', data: data } as any)
}

/**
 * 上传文件
 */
export const upload = <T = any>(
  url: string,
  file: File | Blob,
  fieldName: string = 'file',
  data?: Record<string, any>,
  config?: RequestConfig
): Promise<T> => {
  const formData = new FormData()
  formData.append(fieldName, file)
  
  if (data) {
    Object.keys(data).forEach(key => {
      formData.append(key, data[key])
    })
  }
  
  return request<T>(url, {
    ...config,
    method: 'POST',
    data: formData
  } as any)
}

// 添加默认的请求拦截器
addRequestInterceptor({
  onRequest: async (config) => {
    // 添加请求时间戳
    const timestamp = Date.now()
    ;(config as any)._timestamp = timestamp
    
    return config
  }
})

// 添加默认的响应拦截器
addResponseInterceptor({
  onResponse: async (response) => {
    // 计算请求耗时
    const config = (response as any)._timestamp
      ? { _timestamp: (response as any)._timestamp }
      : {}
    
    const duration = config._timestamp ? Date.now() - config._timestamp : 0
    
    if (duration > 5000) {
      console.warn(`请求耗时过长: ${duration}ms`)
    }
    
    return response
  }
})

// 导出类型和工具函数
export default {
  request,
  get,
  post,
  put,
  del,
  upload,
  addRequestInterceptor,
  addResponseInterceptor,
  BASE_URL
}