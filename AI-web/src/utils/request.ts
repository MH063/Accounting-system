import type { ApiResponse } from '@/types'

// 请求配置接口
export interface RequestConfig extends RequestInit {
  timeout?: number
  retry?: number
  retryDelay?: number
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

// 基础URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

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
    }
    
    // 处理请求体
    if (mergedConfig.data && !mergedConfig.body) {
      if (mergedConfig.data instanceof FormData) {
        mergedConfig.body = mergedConfig.data
        // 移除Content-Type头，让浏览器自动设置
        delete (mergedConfig.headers as any)['Content-Type']
      } else {
        mergedConfig.body = JSON.stringify(mergedConfig.data)
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
      try {
        const errorData = await processedResponse.json()
        errorMessage = errorData.message || errorData.error || `HTTP ${processedResponse.status}`
      } catch {
        errorMessage = `HTTP ${processedResponse.status}: ${processedResponse.statusText}`
      }
      
      const error = new Error(errorMessage)
      ;(error as any).status = processedResponse.status
      ;(error as any).response = processedResponse
      
      throw await handleResponseError(error)
    }
    
    // 解析响应数据
    const contentType = processedResponse.headers.get('content-type')
    let data: T
    
    if (contentType && contentType.includes('application/json')) {
      data = await processedResponse.json()
    } else if (contentType && contentType.includes('text/')) {
      data = await processedResponse.text() as unknown as T
    } else {
      data = await processedResponse.blob() as unknown as T
    }
    
    console.log(`响应: ${config.method || 'GET'} ${fullUrl} - 成功`)
    
    return data
  } catch (error) {
    console.error(`请求失败: ${config.method || 'GET'} ${url}`, error)
    throw await handleResponseError(error as Error)
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
  return request<T>(url, { ...config, method: 'POST', data })
}

/**
 * PUT请求快捷方法
 */
export const put = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> => {
  return request<T>(url, { ...config, method: 'PUT', data })
}

/**
 * DELETE请求快捷方法
 */
export const del = <T = any>(url: string, config?: RequestConfig): Promise<T> => {
  return request<T>(url, { ...config, method: 'DELETE' })
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
  })
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