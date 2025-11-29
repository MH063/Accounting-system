/**
 * 用户体验优化服务
 * 提供加载状态管理、错误边界处理、网络状态检测、性能监控、无障碍访问支持
 */

import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

// 加载状态类型
export interface LoadingState {
  id: string
  name: string
  isLoading: boolean
  progress: number
  message: string
  startTime: Date | null
  endTime: Date | null
  duration: number
  type: 'page' | 'component' | 'operation' | 'api'
  metadata?: Record<string, any>
}

// 性能监控类型
export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: Date
  category: 'navigation' | 'resource' | 'paint' | 'longtask' | 'custom'
  details?: Record<string, any>
}

// 性能监控配置
export interface PerformanceConfig {
  enableNavigationTiming: boolean
  enableResourceTiming: boolean
  enableLongTasks: boolean
  enablePaintMetrics: boolean
  enableCustomMetrics: boolean
  sampleRate: number // 采样率 0-1
  reportEndpoint?: string
  batchSize: number
  flushInterval: number
}

// 网络状态类型
export interface NetworkState {
  isOnline: boolean
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  downlink: number // Mbps
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g'
  rtt: number // 毫秒
  saveData: boolean
  lastOnlineTime: Date | null
  lastOfflineTime: Date | null
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

// 无障碍支持配置
export interface AccessibilityConfig {
  enableHighContrast: boolean
  enableReducedMotion: boolean
  enableScreenReaderSupport: boolean
  enableKeyboardNavigation: boolean
  focusOutlineStyle: 'default' | 'enhanced' | 'minimal'
  announcePageChanges: boolean
  enableColorBlindSupport: boolean
}

// 错误边界配置
export interface ErrorBoundaryConfig {
  enableGlobalErrorHandler: boolean
  enableComponentErrorBoundary: boolean
  enableNetworkErrorRecovery: boolean
  enablePermissionErrorHandling: boolean
  maxErrorHistory: number
  errorReportingEndpoint?: string
  enableUserFeedback: boolean
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  reducedMotion: boolean
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large'
  soundEnabled: boolean
  animationEnabled: boolean
  keyboardNavigation: boolean
  screenReaderOptimized: boolean
}

/**
 * 用户体验优化服务类
 */
class UXOptimizationService {
  private loadingStates = reactive<Map<string, LoadingState>>(new Map())
  private performanceMetrics = reactive<PerformanceMetric[]>([])
  private networkState = reactive<NetworkState>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    downlink: 0,
    effectiveType: '4g',
    rtt: 0,
    saveData: false,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    lastOfflineTime: navigator.onLine ? null : new Date(),
    connectionQuality: 'good'
  })
  
  private performanceConfig: PerformanceConfig
  private accessibilityConfig: AccessibilityConfig
  private errorBoundaryConfig: ErrorBoundaryConfig
  private userPreferences: UserPreferences
  
  // 事件监听器
  private eventListeners = new Map<string, Set<Function>>()
  
  // 性能监控
  private performanceObserver: PerformanceObserver | null = null
  private networkMonitorInterval: NodeJS.Timeout | null = null
  
  // 错误历史
  private errorHistory: Array<{
    error: Error
    timestamp: Date
    context: Record<string, any>
    resolved: boolean
  }> = []

  constructor(
    performanceConfig: PerformanceConfig,
    accessibilityConfig: AccessibilityConfig,
    errorBoundaryConfig: ErrorBoundaryConfig,
    userPreferences: UserPreferences
  ) {
    this.performanceConfig = performanceConfig
    this.accessibilityConfig = accessibilityConfig
    this.errorBoundaryConfig = errorBoundaryConfig
    this.userPreferences = userPreferences
    
    this.initializeNetworkMonitoring()
    this.initializePerformanceMonitoring()
    this.initializeAccessibilityFeatures()
    this.loadUserPreferences()
    
    console.log('UX优化服务：初始化完成')
  }

  /**
   * 加载状态管理
   */
  
  /**
   * 开始加载
   */
  startLoading(params: {
    id: string
    name: string
    type: LoadingState['type']
    message?: string
    metadata?: Record<string, any>
  }): void {
    const loadingState: LoadingState = {
      id: params.id,
      name: params.name,
      isLoading: true,
      progress: 0,
      message: params.message || '正在加载...',
      startTime: new Date(),
      endTime: null,
      duration: 0,
      type: params.type,
      metadata: params.metadata
    }
    
    this.loadingStates.set(params.id, loadingState)
    this.emit('loadingStart', loadingState)
    
    console.log('UX优化：开始加载', params.name, params.id)
  }

  /**
   * 更新加载进度
   */
  updateLoading(id: string, progress: number, message?: string): void {
    const state = this.loadingStates.get(id)
    if (state && state.isLoading) {
      state.progress = Math.max(0, Math.min(100, progress))
      if (message) {
        state.message = message
      }
      this.emit('loadingUpdate', state)
    }
  }

  /**
   * 完成加载
   */
  finishLoading(id: string, success: boolean = true, message?: string): void {
    const state = this.loadingStates.get(id)
    if (state && state.isLoading) {
      state.isLoading = false
      state.progress = 100
      state.endTime = new Date()
      state.duration = state.endTime.getTime() - (state.startTime?.getTime() || 0)
      
      if (success) {
        state.message = message || '加载完成'
        console.log('UX优化：加载完成', state.name, state.duration + 'ms')
      } else {
        state.message = message || '加载失败'
        console.warn('UX优化：加载失败', state.name, state.duration + 'ms')
      }
      
      this.emit('loadingFinish', state)
      
      // 1秒后移除状态
      setTimeout(() => {
        this.loadingStates.delete(id)
      }, 1000)
    }
  }

  /**
   * 获取所有加载状态
   */
  getAllLoadingStates(): LoadingState[] {
    return Array.from(this.loadingStates.values())
  }

  /**
   * 检查是否有加载中的操作
   */
  hasAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(state => state.isLoading)
  }

  /**
   * 网络状态监测
   */
  
  /**
   * 初始化网络监控
   */
  private initializeNetworkMonitoring(): void {
    // 监听在线/离线事件
    const handleOnline = () => {
      this.updateNetworkState({
        isOnline: true,
        lastOnlineTime: new Date()
      })
      this.emit('networkChange', this.networkState)
      ElMessage.success('网络连接已恢复')
    }

    const handleOffline = () => {
      this.updateNetworkState({
        isOnline: false,
        lastOfflineTime: new Date()
      })
      this.emit('networkChange', this.networkState)
      ElMessage.warning('网络连接已断开，您仍可以继续使用离线功能')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 使用 Network Information API 获取详细信息
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const updateConnectionInfo = () => {
        this.updateNetworkState({
          connectionType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        })
      }
      
      updateConnectionInfo()
      connection.addEventListener('change', updateConnectionInfo)
    }

    // 定期检查网络质量
    this.startNetworkQualityMonitoring()
  }

  /**
   * 开始网络质量监控
   */
  private startNetworkQualityMonitoring(): void {
    this.networkMonitorInterval = setInterval(async () => {
      if (this.networkState.isOnline) {
        const quality = await this.measureNetworkQuality()
        this.updateNetworkState({
          connectionQuality: quality
        })
      }
    }, 30000) // 每30秒检查一次
  }

  /**
   * 测量网络质量
   */
  private async measureNetworkQuality(): Promise<NetworkState['connectionQuality']> {
    try {
      const startTime = performance.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      // 发送一个小请求来测试延迟
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      })
      
      clearTimeout(timeoutId)
      const endTime = performance.now()
      const latency = endTime - startTime
      
      if (response.ok) {
        if (latency < 100) return 'excellent'
        if (latency < 300) return 'good'
        if (latency < 1000) return 'fair'
        return 'poor'
      }
      
      return 'fair'
    } catch (error) {
      return 'poor'
    }
  }

  /**
   * 更新网络状态
   */
  private updateNetworkState(updates: Partial<NetworkState>): void {
    Object.assign(this.networkState, updates)
    console.log('UX优化：网络状态更新', this.networkState)
  }

  /**
   * 性能监控
   */
  
  /**
   * 初始化性能监控
   */
  private initializePerformanceMonitoring(): void {
    if (!this.performanceConfig.enableCustomMetrics) return

    try {
      // 使用 PerformanceObserver 监控各种性能指标
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordPerformanceEntry(entry)
        })
      })

      // 监控导航计时
      if (this.performanceConfig.enableNavigationTiming) {
        this.performanceObserver.observe({ entryTypes: ['navigation'] })
      }

      // 监控资源计时
      if (this.performanceConfig.enableResourceTiming) {
        this.performanceObserver.observe({ entryTypes: ['resource'] })
      }

      // 监控绘制计时
      if (this.performanceConfig.enablePaintMetrics) {
        this.performanceObserver.observe({ entryTypes: ['paint'] })
      }

      // 监控长任务
      if (this.performanceConfig.enableLongTasks) {
        this.performanceObserver.observe({ entryTypes: ['longtask'] })
      }
    } catch (error) {
      console.warn('UX优化：性能监控初始化失败', error)
    }
  }

  /**
   * 记录性能条目
   */
  private recordPerformanceEntry(entry: PerformanceEntry): void {
    if (Math.random() > this.performanceConfig.sampleRate) return

    const metric: PerformanceMetric = {
      id: this.generateId(),
      name: entry.name,
      value: entry.duration || (entry as any).transferSize || 0,
      unit: this.getMetricUnit(entry),
      timestamp: new Date(),
      category: this.getMetricCategory(entry),
      details: {
        entryType: entry.entryType,
        startTime: entry.startTime,
        ...this.extractEntryDetails(entry)
      }
    }

    this.performanceMetrics.push(metric)
    
    // 限制性能指标数量
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-500)
    }

    this.emit('performanceMetric', metric)
    console.log('UX优化：记录性能指标', metric)
  }

  /**
   * 自定义性能测量
   */
  measureCustom(name: string, fn: () => any): any {
    const startTime = performance.now()
    
    try {
      const result = fn()
      
      // 如果是 Promise，等待其完成
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          this.recordCustomMetric(name, performance.now() - startTime)
        })
      } else {
        this.recordCustomMetric(name, performance.now() - startTime)
        return result
      }
    } catch (error) {
      this.recordCustomMetric(name, performance.now() - startTime, error)
      throw error
    }
  }

  /**
   * 记录自定义指标
   */
  private recordCustomMetric(name: string, duration: number, error?: Error): void {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      name,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      category: 'custom',
      details: {
        error: error ? error.message : null,
        success: !error
      }
    }

    this.performanceMetrics.push(metric)
    this.emit('performanceMetric', metric)
    
    if (error) {
      console.warn('UX优化：自定义指标测量出错', name, error)
    } else {
      console.log('UX优化：自定义指标', name, duration + 'ms')
    }
  }

  /**
   * 无障碍访问支持
   */
  
  /**
   * 初始化无障碍功能
   */
  private initializeAccessibilityFeatures(): void {
    if (this.accessibilityConfig.enableHighContrast) {
      this.applyHighContrast()
    }

    if (this.accessibilityConfig.enableReducedMotion) {
      this.applyReducedMotion()
    }

    if (this.accessibilityConfig.enableKeyboardNavigation) {
      this.setupKeyboardNavigation()
    }

    if (this.accessibilityConfig.enableScreenReaderSupport) {
      this.setupScreenReaderSupport()
    }

    // 应用用户偏好设置
    this.applyUserPreferences()
  }

  /**
   * 应用高对比度模式
   */
  private applyHighContrast(): void {
    const style = document.createElement('style')
    style.id = 'high-contrast-style'
    style.textContent = `
      /* 高对比度样式 */
      :root {
        --el-color-primary: #0066cc;
        --el-color-success: #00aa00;
        --el-color-warning: #ff8800;
        --el-color-danger: #cc0000;
        --el-text-color-primary: #000000;
        --el-text-color-secondary: #333333;
        --el-border-color: #000000;
        --el-fill-color-light: #f0f0f0;
      }
      
      .high-contrast {
        filter: contrast(150%);
      }
    `
    
    document.head.appendChild(style)
    document.documentElement.classList.add('high-contrast')
  }

  /**
   * 应用减少动画模式
   */
  private applyReducedMotion(): void {
    const style = document.createElement('style')
    style.id = 'reduced-motion-style'
    style.textContent = `
      /* 减少动画样式 */
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `
    
    document.head.appendChild(style)
  }

  /**
   * 设置键盘导航
   */
  private setupKeyboardNavigation(): void {
    // 添加键盘快捷键支持
    document.addEventListener('keydown', (event) => {
      // Alt + 数字键切换标签页
      if (event.altKey && event.key >= '1' && event.key <= '9') {
        event.preventDefault()
        const tabIndex = parseInt(event.key) - 1
        this.switchToTab(tabIndex)
      }
      
      // Escape 键关闭弹窗
      if (event.key === 'Escape') {
        this.handleEscapeKey()
      }
    })
  }

  /**
   * 设置屏幕阅读器支持
   */
  private setupScreenReaderSupport(): void {
    // 创建屏幕阅读器公告区域
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.setAttribute('class', 'sr-only')
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    document.body.appendChild(announcer)

    // 监听路由变化并公告
    this.on('pageChange', (newPage: string) => {
      if (this.accessibilityConfig.announcePageChanges) {
        this.announce(`已切换到${newPage}页面`)
      }
    })
  }

  /**
   * 公告消息（供屏幕阅读器读取）
   */
  announce(message: string): void {
    const announcer = document.querySelector('.sr-only')
    if (announcer) {
      announcer.textContent = message
      
      // 清空消息以支持重复公告
      setTimeout(() => {
        announcer.textContent = ''
      }, 1000)
    }
  }

  /**
   * 错误边界处理
   */
  
  /**
   * 全局错误处理
   */
  setupGlobalErrorHandler(): void {
    if (!this.errorBoundaryConfig.enableGlobalErrorHandler) return

    // 捕获未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        type: 'unhandledrejection',
        context: event
      })
    })

    // 捕获全局 JavaScript 错误
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })
  }

  /**
   * 处理错误
   */
  handleError(error: Error, context: Record<string, any> = {}): void {
    const errorInfo = {
      error,
      timestamp: new Date(),
      context,
      resolved: false
    }

    this.errorHistory.push(errorInfo)
    
    // 限制错误历史数量
    if (this.errorHistory.length > this.errorBoundaryConfig.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.errorBoundaryConfig.maxErrorHistory)
    }

    this.emit('error', errorInfo)
    console.error('UX优化：捕获错误', error, context)

    // 根据错误类型处理
    if (context.type === 'network') {
      this.handleNetworkError(error, context)
    } else if (context.type === 'permission') {
      this.handlePermissionError(error, context)
    } else {
      this.showGenericError(error)
    }
  }

  /**
   * 处理网络错误
   */
  private handleNetworkError(error: Error, context: any): void {
    if (!this.errorBoundaryConfig.enableNetworkErrorRecovery) return

    ElMessage.error({
      message: '网络连接出现问题，正在尝试重试...',
      duration: 5000
    })

    // 实现重试逻辑
    this.retryOperation(context.operation, context.retryCount || 0)
  }

  /**
   * 处理权限错误
   */
  private handlePermissionError(error: Error, context: any): void {
    ElMessage.warning({
      message: '权限不足，无法执行此操作',
      duration: 3000
    })

    this.announce('权限不足，操作被拒绝')
  }

  /**
   * 显示通用错误
   */
  private showGenericError(error: Error): void {
    ElNotification.error({
      title: '操作失败',
      message: error.message || '发生未知错误，请稍后重试',
      duration: 5000
    })
  }

  /**
   * 重试操作
   */
  private async retryOperation(operation: Function, retryCount: number): Promise<void> {
    const maxRetries = 3
    
    if (retryCount < maxRetries) {
      setTimeout(async () => {
        try {
          await operation()
        } catch (error) {
          this.retryOperation(operation, retryCount + 1)
        }
      }, Math.pow(2, retryCount) * 1000) // 指数退避
    }
  }

  /**
   * 应用用户偏好设置
   */
  private applyUserPreferences(): void {
    // 应用主题
    if (this.userPreferences.theme !== 'auto') {
      document.documentElement.setAttribute('data-theme', this.userPreferences.theme)
    }

    // 应用字体大小
    document.documentElement.setAttribute('data-font-size', this.userPreferences.fontSize)

    // 应用高对比度
    if (this.userPreferences.highContrast) {
      document.documentElement.classList.add('high-contrast')
    }

    // 应用减少动画
    if (this.userPreferences.reducedMotion) {
      document.documentElement.classList.add('reduced-motion')
    }
  }

  /**
   * 加载用户偏好
   */
  private loadUserPreferences(): void {
    try {
      const saved = localStorage.getItem('ux_preferences')
      if (saved) {
        Object.assign(this.userPreferences, JSON.parse(saved))
      }
    } catch (error) {
      console.warn('UX优化：加载用户偏好失败', error)
    }
  }

  /**
   * 保存用户偏好
   */
  saveUserPreferences(): void {
    try {
      localStorage.setItem('ux_preferences', JSON.stringify(this.userPreferences))
    } catch (error) {
      console.warn('UX优化：保存用户偏好失败', error)
    }
  }

  /**
   * 事件系统
   */
  
  /**
   * 订阅事件
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  /**
   * 取消订阅事件
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('UX优化：事件处理器执行错误', event, error)
        }
      })
    }
  }

  /**
   * 工具方法
   */
  
  /**
   * 获取性能指标
   */
  getPerformanceMetrics(category?: string): PerformanceMetric[] {
    if (category) {
      return this.performanceMetrics.filter(m => m.category === category)
    }
    return [...this.performanceMetrics]
  }

  /**
   * 获取网络状态
   */
  getNetworkState(): Readonly<NetworkState> {
    return { ...this.networkState }
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(): typeof this.errorHistory {
    return [...this.errorHistory]
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取性能指标单位
   */
  private getMetricUnit(entry: PerformanceEntry): string {
    if (entry.entryType === 'navigation' || entry.entryType === 'paint') {
      return 'ms'
    }
    if (entry.entryType === 'resource') {
      return 'bytes'
    }
    if (entry.entryType === 'longtask') {
      return 'ms'
    }
    return 'count'
  }

  /**
   * 获取性能指标类别
   */
  private getMetricCategory(entry: PerformanceEntry): PerformanceMetric['category'] {
    switch (entry.entryType) {
      case 'navigation':
        return 'navigation'
      case 'resource':
        return 'resource'
      case 'paint':
        return 'paint'
      case 'longtask':
        return 'longtask'
      default:
        return 'custom'
    }
  }

  /**
   * 提取性能条目详情
   */
  private extractEntryDetails(entry: PerformanceEntry): Record<string, any> {
    const details: Record<string, any> = {}

    if (entry.entryType === 'navigation') {
      const nav = entry as PerformanceNavigationTiming
      Object.assign(details, {
        domainLookupTime: nav.domainLookupEnd - nav.domainLookupStart,
        connectTime: nav.connectEnd - nav.connectStart,
        requestTime: nav.responseStart - nav.requestStart,
        responseTime: nav.responseEnd - nav.responseStart,
        domProcessingTime: nav.domComplete - nav.domLoading
      })
    }

    if (entry.entryType === 'resource') {
      const resource = entry as PerformanceResourceTiming
      Object.assign(details, {
        transferSize: resource.transferSize,
        encodedBodySize: resource.encodedBodySize,
        decodedBodySize: resource.decodedBodySize,
        initiatorType: resource.initiatorType
      })
    }

    return details
  }

  /**
   * 切换到指定标签页
   */
  private switchToTab(index: number): void {
    const tabs = document.querySelectorAll('.el-tabs__item, [role="tab"]')
    if (tabs[index]) {
      (tabs[index] as HTMLElement).click()
      this.announce(`切换到第${index + 1}个标签页`)
    }
  }

  /**
   * 处理 Escape 键
   */
  private handleEscapeKey(): void {
    // 关闭弹窗
    const dialogs = document.querySelectorAll('.el-dialog')
    for (const dialog of dialogs) {
      const isVisible = (dialog as HTMLElement).style.display !== 'none'
      if (isVisible) {
        const closeButton = dialog.querySelector('.el-dialog__headerbtn')
        if (closeButton) {
          (closeButton as HTMLElement).click()
          break
        }
      }
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
    
    if (this.networkMonitorInterval) {
      clearInterval(this.networkMonitorInterval)
    }
    
    this.eventListeners.clear()
    this.loadingStates.clear()
  }
}

// 默认配置
const defaultPerformanceConfig: PerformanceConfig = {
  enableNavigationTiming: true,
  enableResourceTiming: true,
  enableLongTasks: true,
  enablePaintMetrics: true,
  enableCustomMetrics: true,
  sampleRate: 0.1,
  batchSize: 10,
  flushInterval: 5000
}

const defaultAccessibilityConfig: AccessibilityConfig = {
  enableHighContrast: false,
  enableReducedMotion: false,
  enableScreenReaderSupport: true,
  enableKeyboardNavigation: true,
  focusOutlineStyle: 'enhanced',
  announcePageChanges: true,
  enableColorBlindSupport: false
}

const defaultErrorBoundaryConfig: ErrorBoundaryConfig = {
  enableGlobalErrorHandler: true,
  enableComponentErrorBoundary: true,
  enableNetworkErrorRecovery: true,
  enablePermissionErrorHandling: true,
  maxErrorHistory: 100,
  enableUserFeedback: true
}

const defaultUserPreferences: UserPreferences = {
  theme: 'light',
  language: 'zh-CN',
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  soundEnabled: true,
  animationEnabled: true,
  keyboardNavigation: true,
  screenReaderOptimized: false
}

// 创建全局UX优化服务实例
export const uxOptimizationService = new UXOptimizationService(
  defaultPerformanceConfig,
  defaultAccessibilityConfig,
  defaultErrorBoundaryConfig,
  defaultUserPreferences
)

// 导出便捷方法
export const {
  startLoading,
  updateLoading,
  finishLoading,
  getAllLoadingStates,
  hasAnyLoading,
  measureCustom,
  getPerformanceMetrics,
  getNetworkState,
  getErrorHistory,
  announce,
  handleError,
  setupGlobalErrorHandler,
  on,
  off,
  saveUserPreferences
} = uxOptimizationService

// 导出类型
export type {
  LoadingState,
  PerformanceMetric,
  PerformanceConfig,
  NetworkState,
  AccessibilityConfig,
  ErrorBoundaryConfig,
  UserPreferences
}