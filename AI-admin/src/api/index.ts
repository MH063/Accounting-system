import axios from 'axios'
import { ElMessage } from 'element-plus'
import { adminAuthApi } from './adminAuth'

// 创建axios实例
const api = axios.create({
  baseURL: `http://${window.location.hostname}:4000/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  async (config) => {
    console.log('🚀 API请求:', config.method?.toUpperCase(), config.url)
    
    // 直接从 localStorage 获取管理员令牌
    const adminToken = localStorage.getItem('adminToken')
    
    // 检查是否需要认证的接口（admin相关接口需要认证）
    const isAdminApi = config.url?.includes('/admin/') || config.url?.includes('/system/')
    
    // 关键位置打印日志 (规则 7)
    console.log('[API Interceptor] Token检查', {
      url: config.url,
      hasToken: !!adminToken,
      isAdminApi,
      tokenPreview: adminToken ? `${adminToken.substring(0, 30)}...` : 'null'
    })
    
    if (adminToken) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${adminToken}`
      console.log('[API Interceptor] Authorization头已设置:', config.headers.Authorization?.substring(0, 30) + '...')
    } else if (isAdminApi) {
      // 只在需要认证的管理接口缺失token时警告
      console.warn('[API Interceptor] adminToken不存在，可能导致401错误')
    }
    
    return config
  },
  (error) => {
    console.error('❌ API请求错误:', error)
    return Promise.reject(error)
  }
)

// 令牌刷新状态
let isRefreshing = false
let requestsQueue: any[] = []
let lastRefreshTime = 0
const REFRESH_COOLDOWN = 5000 // 5秒冷却时间
const ADMIN_REFRESH_LOCK_KEY = 'admin_auth_refresh_lock'
const LOCK_TIMEOUT = 10000 // 10秒锁超时

/**
 * 处理等待队列中的请求
 * @param token 访问令牌
 */
const processQueue = (token: string | null = null) => {
  requestsQueue.forEach((callback) => callback(token))
  requestsQueue = []
}

/**
 * 获取跨标签页刷新锁
 */
const getRefreshLock = () => {
  const lock = localStorage.getItem(ADMIN_REFRESH_LOCK_KEY)
  const now = Date.now()
  if (lock) {
    const { timestamp } = JSON.parse(lock)
    if (now - timestamp < LOCK_TIMEOUT) {
      return false // 锁已被持有且未超时
    }
  }
  localStorage.setItem(ADMIN_REFRESH_LOCK_KEY, JSON.stringify({ timestamp: now, tabId: Math.random().toString(36).substring(2) }))
  return true
}

/**
 * 释放跨标签页刷新锁
 */
const releaseRefreshLock = () => {
  localStorage.removeItem(ADMIN_REFRESH_LOCK_KEY)
}

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('✅ API响应:', response.config.url, response.status)
    
    // 统一处理后端返回的数据结构 {success: true, data: {xxx: []}}
    // 根据用户规则 5：后端返回的数据结构是 {success: true, data: {xxx: []}} 
    // 但前端代码有可能直接访问 response.data.xxx 。实际上应该访问 response.data.data.xxx
    
    const resData = response.data
    
    if (resData && typeof resData === 'object') {
      // 如果包含 success 字段，说明是标准的后端返回结构
      if (resData.hasOwnProperty('success')) {
        if (resData.success === true) {
          // 关键位置打印日志方便调试 (规则 7)
          console.log(`✅ [API Success] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            hasData: !!resData.data,
            timestamp: new Date().toISOString()
          })
          
          // 返回 resData.data，这样在组件中访问 res.xxx 就相当于访问了原始的 response.data.data.xxx
          // 如果 resData.data 不存在，则返回整个 resData 
          return resData.data !== undefined ? resData.data : resData
        } else {
          // 业务逻辑错误
          const errorMsg = resData.message || '请求失败'
          console.error(`❌ [API Business Error] ${response.config.url}:`, errorMsg)
          
          // 如果是 401 错误，不在这里报错，交给错误处理拦截器处理令牌刷新
          if (response.status !== 401) {
            ElMessage.error(errorMsg)
          }
          return Promise.reject(new Error(errorMsg))
        }
      }
    }
    
    return resData
  },
  async (error) => {
    // 处理后端服务异常退出的情况 (Network Error)
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.warn('🚨 检测到后端服务不可用 (网络错误)')
      
      // 如果是在登录后的状态，且不是心跳接口报错，则提示并退出
      const adminToken = localStorage.getItem('adminToken')
      if (adminToken && !error.config?.url?.includes('/heartbeat')) {
        // 记录强制退出日志
        console.log('[LOG] 强制退出日志: 后端服务不可用 (网络错误)', {
          time: new Date().toISOString(),
          url: error.config?.url
        })

        ElMessage.error('后端服务异常，系统将强制退出。')
        
        // 清除 Token 并重定向
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    }

    const { config, response } = error
    if (!config || !response) return Promise.reject(error)

    const url = config.url || ''
    const isRefreshTokenRequest = url.includes('/admin/refresh-token')

    console.error('❌ API响应错误:', url, response.status, error.message)
    
    // 处理401未授权错误 - 尝试刷新令牌
    if (response.status === 401 && !config._retry && !isRefreshTokenRequest) {
      // 检查冷却时间
      const now = Date.now()
      if (now - lastRefreshTime < REFRESH_COOLDOWN) {
        console.log('⏳ 令牌刚刚刷新过，直接使用最新令牌重试')
        const token = localStorage.getItem('adminToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          return api.request(config)
        }
      }

      // 如果正在刷新，将请求加入队列
      if (isRefreshing) {
        console.log('⏳ 正在刷新令牌中，将请求加入等待队列:', url)
        return new Promise((resolve) => {
          requestsQueue.push((token: string | null) => {
            if (token) {
              config.headers.Authorization = `Bearer ${token}`
              resolve(api.request(config))
            } else {
              resolve(Promise.reject(error))
            }
          })
        })
      }

      // 尝试获取全局刷新锁（跨标签页）
      if (!getRefreshLock()) {
        console.log('⏳ 其他标签页正在刷新，加入本页等待队列并轮询')
        isRefreshing = true
        return new Promise((resolve) => {
          let retryCount = 0
          const maxRetries = 20 // 最多等待10秒
          const interval = setInterval(() => {
            retryCount++
            const token = localStorage.getItem('adminToken')
            const lock = localStorage.getItem(ADMIN_REFRESH_LOCK_KEY)
            
            // 如果锁被释放了，或者token变了，说明刷新完成
            if (!lock || retryCount > maxRetries) {
              clearInterval(interval)
              isRefreshing = false
              if (token) {
                config.headers.Authorization = `Bearer ${token}`
                processQueue(token)
                resolve(api.request(config))
              } else {
                processQueue(null)
                resolve(Promise.reject(error))
              }
            }
          }, 500)
        })
      }

      config._retry = true
      isRefreshing = true
      
      try {
        const refreshToken = localStorage.getItem('adminRefreshToken')
        if (refreshToken) {
          console.log('🔄 尝试刷新管理员令牌...')
          const refreshRes = await axios.post(`http://${window.location.hostname}:4000/api/admin/refresh-token`, { 
            refreshToken 
          }).catch(err => err.response)
          
          const data = refreshRes?.data
          
          // 处理 409 并发刷新冲突
          if (refreshRes?.status === 409 || data?.code === 'CONCURRENT_REFRESH') {
            console.log('🔄 检测到并发刷新(409)，尝试使用返回的新令牌')
            const tokens = data?.data?.tokens || data?.data
            if (tokens?.accessToken) {
              const { accessToken, refreshToken: newRefreshToken } = tokens
              localStorage.setItem('adminToken', accessToken)
              if (newRefreshToken) {
                localStorage.setItem('adminRefreshToken', newRefreshToken)
              }
              config.headers.Authorization = `Bearer ${accessToken}`
              lastRefreshTime = Date.now()
              processQueue(accessToken)
              isRefreshing = false
              releaseRefreshLock()
              return api.request(config)
            }
          }

          if (data && data.success) {
            const tokens = data.data?.tokens || data.data
            if (tokens?.accessToken) {
              const { accessToken, refreshToken: newRefreshToken } = tokens
              console.log('✅ 令牌刷新成功，重试原请求')
              
              localStorage.setItem('adminToken', accessToken)
              if (newRefreshToken) {
                localStorage.setItem('adminRefreshToken', newRefreshToken)
              }
              
              config.headers.Authorization = `Bearer ${accessToken}`
              lastRefreshTime = Date.now()
              processQueue(accessToken)
              isRefreshing = false
              releaseRefreshLock()
              return api.request(config)
            }
          }
          throw new Error(data?.message || '刷新失败')
        } else {
          throw new Error('无刷新令牌')
        }
      } catch (refreshError: any) {
        console.error('❌ 令牌刷新失败，清理会话并跳转', refreshError.message)
        processQueue(null)
        isRefreshing = false
        releaseRefreshLock()
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminRefreshToken')
        localStorage.removeItem('adminUser')
        
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?reason=expired'
        }

        const authError = new Error(response.data?.message || '登录已过期，请重新登录')
        ;(authError as any).name = 'UnauthorizedError'
        ;(authError as any).code = 'TOKEN_EXPIRED'
        return Promise.reject(authError)
      }
    }
    
    // 处理400错误，保持原始错误信息
    if (response.status === 400) {
      const badRequestError = new Error(response.data?.message || '请求参数错误')
      ;(badRequestError as any).name = 'BadRequestError'
      ;(badRequestError as any).code = 'BAD_REQUEST'
      ;(badRequestError as any).response = response
      return Promise.reject(badRequestError)
    }
    
    return Promise.reject(error)
  }
)

export default api

// 通用API方法
export const apiRequest = {
  get: (url: string, params?: any) => api.get(url, { params }),
  post: (url: string, data?: any) => api.post(url, data),
  put: (url: string, data?: any) => api.put(url, data),
  delete: (url: string) => api.delete(url)
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}
