import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://10.121.117.9:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ API请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('✅ API响应:', response.config.url, response.status)
    
    // 统一处理后端返回的数据结构 {success: true, data: {xxx: []}}
    if (response.data && typeof response.data === 'object') {
      // 如果是标准的成功响应结构
      if (response.data.hasOwnProperty('success')) {
        if (response.data.success === true) {
          // 成功时返回data字段
          return response.data.data || {}
        } else {
          // 失败时抛出错误
          return Promise.reject(new Error(response.data.message || '请求失败'))
        }
      }
      // 如果不是标准结构，直接返回数据
      return response.data
    }
    
    return response
  },
  (error) => {
    console.error('❌ API响应错误:', error.config?.url, error.response?.status, error.message)
    
    // 处理网络错误
    if (!error.response) {
      console.error('�� 网络连接失败，请检查后端服务是否启动')
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
