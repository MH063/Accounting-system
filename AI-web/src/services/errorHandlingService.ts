import type { ApiResponse } from '@/types'
import { computed } from 'vue'

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  SYSTEM = 'system',
  BUSINESS = 'business',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

// 错误级别枚举
export enum ErrorLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 错误信息接口
export interface ErrorInfo {
  id: string
  type: ErrorType
  level: ErrorLevel
  message: string
  code?: string | number
  details?: Record<string, unknown>
  timestamp: Date
  stack?: string
  resolved: boolean
  userId?: string
  requestId?: string
  endpoint?: string
  method?: string
}

// 错误处理配置
export interface ErrorHandlingConfig {
  enableLogging: boolean
  enableNotification: boolean
  enableRetry: boolean
  maxRetries: number
  retryDelay: number
  errorTimeout: number
  enableErrorBoundary: boolean
  errorDisplayMode: 'toast' | 'modal' | 'inline' | 'silent'
}

// 错误处理回调
export type ErrorHandler = (error: ErrorInfo) => void | Promise<void>
export type ErrorFilter = (error: ErrorInfo) => boolean

/**
 * 错误处理服务
 */
class ErrorHandlingService {
  private errorQueue: ErrorInfo[] = []
  private errorHandlers: Map<ErrorType, ErrorHandler[]> = new Map()
  private errorFilters: ErrorFilter[] = []
  private config: ErrorHandlingConfig
  private errorStorageKey = 'app_error_history'
  
  constructor(config: ErrorHandlingConfig) {
    this.config = config
    this.initializeErrorHandlers()
    this.loadErrorHistory()
  }
  
  /**
   * 生成唯一错误ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 初始化错误处理器
   */
  private initializeErrorHandlers(): void {
    // 网络错误处理器
    this.registerErrorHandler(ErrorType.NETWORK, async (error: ErrorInfo) => {
      console.error('网络错误:', error.message)
      
      if (this.config.enableNotification && this.config.errorDisplayMode !== 'silent') {
        this.showErrorNotification('网络连接失败', '请检查网络连接后重试')
      }
    })
    
    // 权限错误处理器
    this.registerErrorHandler(ErrorType.PERMISSION, async (error: ErrorInfo) => {
      console.error('权限错误:', error.message)
      
      if (error.code === 401) {
        // 未授权，清除本地认证信息
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')
        
        if (this.config.enableNotification && this.config.errorDisplayMode !== 'silent') {
          this.showErrorNotification('登录已过期', '请重新登录')
          
          // 延迟跳转登录页
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        }
      }
    })
    
    // 验证错误处理器
    this.registerErrorHandler(ErrorType.VALIDATION, async (error: ErrorInfo) => {
      console.error('验证错误:', error.message)
      
      if (this.config.enableNotification && this.config.errorDisplayMode !== 'silent') {
        this.showErrorNotification('输入验证失败', error.message)
      }
    })
    
    // 系统错误处理器
    this.registerErrorHandler(ErrorType.SYSTEM, async (error: ErrorInfo) => {
      console.error('系统错误:', error.message)
      
      if (error.level === ErrorLevel.CRITICAL) {
        // 严重错误，记录到本地存储
        this.persistError(error)
        
        if (this.config.enableNotification && this.config.errorDisplayMode !== 'silent') {
          this.showErrorNotification('系统错误', '系统出现错误，请联系技术支持')
        }
      }
    })
    
    // 业务错误处理器
    this.registerErrorHandler(ErrorType.BUSINESS, async (error: ErrorInfo) => {
      console.error('业务错误:', error.message)
      
      if (this.config.enableNotification && this.config.errorDisplayMode !== 'silent') {
        this.showErrorNotification('操作失败', error.message)
      }
    })
    
    // 超时错误处理器
    this.registerErrorHandler(ErrorType.TIMEOUT, async (error: ErrorInfo) => {
      console.error('超时错误:', error.message)
      
      if (this.config.enableNotification && this.config.errorDisplayMode !== 'silent') {
        this.showErrorNotification('请求超时', '请求处理时间过长，请稍后重试')
      }
    })
  }
  
  /**
   * 注册错误处理器
   */
  registerErrorHandler(errorType: ErrorType, handler: ErrorHandler): void {
    if (!this.errorHandlers.has(errorType)) {
      this.errorHandlers.set(errorType, [])
    }
    this.errorHandlers.get(errorType)!.push(handler)
  }
  
  /**
   * 添加错误过滤器
   */
  addErrorFilter(filter: ErrorFilter): void {
    this.errorFilters.push(filter)
  }
  
  /**
   * 显示错误通知
   */
  private showErrorNotification(title: string, message: string): void {
    if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      })
    } else {
      // 使用console作为后备方案
      console.warn(`[错误通知] ${title}: ${message}`)
    }
  }
  
  /**
   * 创建错误信息
   */
  private createErrorInfo(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN,
    level: ErrorLevel = ErrorLevel.MEDIUM,
    additionalInfo: Partial<ErrorInfo> = {}
  ): ErrorInfo {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack
    
    return {
      id: this.generateErrorId(),
      type,
      level,
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date(),
      resolved: false,
      ...additionalInfo
    }
  }
  
  /**
   * 处理错误
   */
  async handleError(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN,
    level: ErrorLevel = ErrorLevel.MEDIUM,
    additionalInfo: Partial<ErrorInfo> = {}
  ): Promise<void> {
    const errorInfo = this.createErrorInfo(error, type, level, additionalInfo)
    
    // 应用错误过滤器
    const shouldProcess = this.errorFilters.every(filter => filter(errorInfo))
    if (!shouldProcess) {
      return
    }
    
    // 记录错误日志
    if (this.config.enableLogging) {
      this.logError(errorInfo)
    }
    
    // 添加到错误队列
    this.errorQueue.push(errorInfo)
    
    // 限制错误队列大小
    if (this.errorQueue.length > 100) {
      this.errorQueue = this.errorQueue.slice(-50) // 保留最近50个错误
    }
    
    // 执行对应的错误处理器
    const handlers = this.errorHandlers.get(type) || []
    for (const handler of handlers) {
      try {
        await handler(errorInfo)
      } catch (handlerError) {
        console.error('错误处理器执行失败:', handlerError)
      }
    }
    
    // 持久化错误（对于严重错误）
    if (level === ErrorLevel.HIGH || level === ErrorLevel.CRITICAL) {
      this.persistError(errorInfo)
    }
  }
  
  /**
   * 记录错误日志
   */
  private logError(errorInfo: ErrorInfo): void {
    const logEntry = {
      timestamp: errorInfo.timestamp.toISOString(),
      level: errorInfo.level,
      type: errorInfo.type,
      message: errorInfo.message,
      code: errorInfo.code,
      userId: errorInfo.userId,
      endpoint: errorInfo.endpoint,
      stack: errorInfo.stack
    }
    
    console.error('[错误日志]', JSON.stringify(logEntry, null, 2))
  }
  
  /**
   * 持久化错误
   */
  private persistError(errorInfo: ErrorInfo): void {
    try {
      const existingErrors = this.getPersistedErrors()
      existingErrors.push(errorInfo)
      
      // 限制存储的错误数量
      const maxErrors = 50
      const errorsToStore = existingErrors.slice(-maxErrors)
      
      localStorage.setItem(this.errorStorageKey, JSON.stringify(errorsToStore))
    } catch (error) {
      console.error('持久化错误失败:', error)
    }
  }
  
  /**
   * 获取持久化的错误
   */
  getPersistedErrors(): ErrorInfo[] {
    try {
      const stored = localStorage.getItem(this.errorStorageKey)
      if (stored) {
        const errors = JSON.parse(stored)
        return errors.map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp)
        }))
      }
    } catch (error) {
      console.error('获取持久化错误失败:', error)
    }
    return []
  }
  
  /**
   * 加载错误历史
   */
  private loadErrorHistory(): void {
    const persistedErrors = this.getPersistedErrors()
    this.errorQueue = persistedErrors.filter(error => !error.resolved)
  }
  
  /**
   * 获取错误队列
   */
  getErrorQueue(): ErrorInfo[] {
    return [...this.errorQueue]
  }
  
  /**
   * 清除错误队列
   */
  clearErrorQueue(): void {
    this.errorQueue = []
  }
  
  /**
   * 解决错误
   */
  resolveError(errorId: string): boolean {
    const error = this.errorQueue.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      return true
    }
    return false
  }
  
  /**
   * 批量解决错误
   */
  resolveErrors(errorIds: string[]): number {
    let resolvedCount = 0
    errorIds.forEach(errorId => {
      if (this.resolveError(errorId)) {
        resolvedCount++
      }
    })
    return resolvedCount
  }
  
  /**
   * 获取错误统计
   */
  getErrorStatistics() {
    const stats = {
      total: this.errorQueue.length,
      byType: {} as Record<ErrorType, number>,
      byLevel: {} as Record<ErrorLevel, number>,
      unresolved: this.errorQueue.filter(e => !e.resolved).length,
      resolved: this.errorQueue.filter(e => e.resolved).length
    }
    
    this.errorQueue.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1
    })
    
    return stats
  }
  
  /**
   * 销毁服务
   */
  destroy(): void {
    this.errorQueue = []
    this.errorHandlers.clear()
    this.errorFilters = []
  }
}

// 默认配置
const defaultErrorHandlingConfig: ErrorHandlingConfig = {
  enableLogging: true,
  enableNotification: true,
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  errorTimeout: 5000,
  enableErrorBoundary: true,
  errorDisplayMode: 'toast'
}

// 创建全局错误处理服务实例
export const errorHandlingService = new ErrorHandlingService(defaultErrorHandlingConfig)

/**
 * 错误处理工具函数
 */

/**
 * 处理API响应错误
 */
export const handleApiError = async (
  error: any,
  endpoint?: string,
  method?: string
): Promise<void> => {
  let errorType = ErrorType.UNKNOWN
  let errorLevel = ErrorLevel.MEDIUM
  let message = '未知错误'
  let code: string | number | undefined
  
  if (error.status) {
    // HTTP错误
    code = error.status
    
    switch (error.status) {
      case 400:
        errorType = ErrorType.VALIDATION
        errorLevel = ErrorLevel.LOW
        message = '请求参数错误'
        break
      case 401:
        errorType = ErrorType.PERMISSION
        errorLevel = ErrorLevel.MEDIUM
        message = '未授权访问'
        break
      case 403:
        errorType = ErrorType.PERMISSION
        errorLevel = ErrorLevel.MEDIUM
        message = '权限不足'
        break
      case 404:
        errorType = ErrorType.NETWORK
        errorLevel = ErrorLevel.LOW
        message = '资源不存在'
        break
      case 408:
      case 504:
        errorType = ErrorType.TIMEOUT
        errorLevel = ErrorLevel.MEDIUM
        message = '请求超时'
        break
      case 429:
        errorType = ErrorType.NETWORK
        errorLevel = ErrorLevel.LOW
        message = '请求过于频繁'
        break
      case 500:
      case 502:
      case 503:
        errorType = ErrorType.SYSTEM
        errorLevel = ErrorLevel.HIGH
        message = '服务器错误'
        break
      default:
        if (error.status >= 400 && error.status < 500) {
          errorType = ErrorType.BUSINESS
          errorLevel = ErrorLevel.LOW
          message = '客户端错误'
        } else if (error.status >= 500) {
          errorType = ErrorType.SYSTEM
          errorLevel = ErrorLevel.HIGH
          message = '服务器错误'
        }
    }
  } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    errorType = ErrorType.TIMEOUT
    errorLevel = ErrorLevel.MEDIUM
    message = '网络超时'
  } else if (error.message) {
    message = error.message
  }
  
  // 尝试从错误响应中获取更详细的信息
  if (error.response) {
    try {
      const errorData = await error.response.json()
      if (errorData.message) {
        message = errorData.message
      }
      if (errorData.code) {
        code = errorData.code
      }
    } catch {
      // 无法解析错误响应体
    }
  }
  
  await errorHandlingService.handleError(
    new Error(message),
    errorType,
    errorLevel,
    {
      code,
      endpoint,
      method,
      details: error
    }
  )
}

/**
 * 处理网络错误
 */
export const handleNetworkError = async (error: Error): Promise<void> => {
  await errorHandlingService.handleError(error, ErrorType.NETWORK, ErrorLevel.MEDIUM)
}

/**
 * 处理验证错误
 */
export const handleValidationError = async (message: string, details?: Record<string, unknown>): Promise<void> => {
  await errorHandlingService.handleError(new Error(message), ErrorType.VALIDATION, ErrorLevel.LOW, { details })
}

/**
 * 处理系统错误
 */
export const handleSystemError = async (error: Error, level: ErrorLevel = ErrorLevel.HIGH): Promise<void> => {
  await errorHandlingService.handleError(error, ErrorType.SYSTEM, level)
}

/**
 * 组合式API：使用错误处理
 */
export const useErrorHandling = () => {
  return {
    // 状态
    errorQueue: computed(() => errorHandlingService.getErrorQueue()),
    errorCount: computed(() => errorHandlingService.getErrorQueue().length),
    hasErrors: computed(() => errorHandlingService.getErrorQueue().length > 0),
    errorStatistics: computed(() => errorHandlingService.getErrorStatistics()),
    
    // 方法
    handleError: errorHandlingService.handleError.bind(errorHandlingService),
    handleApiError,
    handleNetworkError,
    handleValidationError,
    handleSystemError,
    resolveError: errorHandlingService.resolveError.bind(errorHandlingService),
    resolveErrors: errorHandlingService.resolveErrors.bind(errorHandlingService),
    clearErrors: errorHandlingService.clearErrorQueue.bind(errorHandlingService)
  }
}

// 导出类型和实例
export type { ErrorInfo, ErrorHandlingConfig, ErrorHandler, ErrorFilter }
export default errorHandlingService