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

/**
 * 保存认证令牌
 */
const saveAuthToken = (accessToken: string, refreshToken?: string): void => {
  localStorage.setItem('access_token', accessToken)
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken)
  }
}

/**
 * 清除认证令牌
 */
const clearAuthToken = (): void => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
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
        'invalid token'
      ]
      
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

/**
 * 刷新访问令牌
 */
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      console.error('刷新令牌不存在')
      return false
    }
    
    console.log('调用刷新令牌接口')
    
    // 使用封装的request函数调用刷新令牌接口，避免循环依赖
    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ refreshToken })
    })
    
    console.log('刷新令牌接口响应状态:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('刷新令牌接口响应数据:', data)
      
      if (data.success && data.data) {
        // 保存新的令牌
        saveAuthToken(data.data.accessToken, data.data.refreshToken || refreshToken)
        console.log('令牌刷新成功')
        return true
      } else {
        console.error('刷新令牌接口返回失败:', data.message)
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('刷新令牌接口请求失败:', response.status, errorData)
    }
  } catch (error) {
    console.error('刷新令牌请求失败:', error)
  }
  
  // 刷新失败，清除令牌
  clearAuthToken()
  console.log('刷新令牌失败，已清除令牌')
  return false
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
  
  while (true) {
    try {
      // 合并配置
      const mergedConfig: RequestConfig = {
        ...defaultConfig,
        ...config
      }
      
      // 构建完整URL
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
      
      // 添加认证令牌
      const token = getAuthToken()
      if (token) {
        mergedConfig.headers = {
          ...mergedConfig.headers,
          'Authorization': `Bearer ${token}`
        }
      } else {
        // 对于登录和注册等不需要认证的接口，不显示警告
        const noAuthEndpoints = ['/auth/login', '/auth/register', '/auth/reset-password']
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
          const noAuthEndpoints = ['/auth/login', '/auth/register', '/auth/reset-password']
          const isNoAuthEndpoint = noAuthEndpoints.some(endpoint => url.includes(endpoint))
          
          if (isNoAuthEndpoint) {
            console.log('登录/注册接口401错误，保持原始错误信息:', errorMessage)
          } else {
            console.log('检测到401未授权错误，可能需要重新登录')
            errorMessage = '身份验证已过期，请重新登录'
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

      if (!isNoAuthEndpoint && !isRefreshTokenRequest && retryCount < maxRetryCount && isTokenExpiredError(error)) {
        console.log('检测到令牌过期，尝试刷新令牌...')
        retryCount++
        
        // 尝试刷新令牌
        const refreshSuccess = await refreshAccessToken()
        if (refreshSuccess) {
          console.log('令牌刷新成功，重试请求...')
          // 清除缓存的token，重新获取最新的token
          delete config.headers?.Authorization
          continue // 重试请求
        } else {
          console.log('刷新令牌失败，无法重试请求')
        }
      }
      
      // 不是令牌过期错误或刷新失败，抛出错误
      throw await handleResponseError(error)
    }
  }
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
  file: File,
  data?: Record<string, any>,
  config?: RequestConfig
): Promise<T> => {
  const formData = new FormData()
  formData.append('file', file)
  
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