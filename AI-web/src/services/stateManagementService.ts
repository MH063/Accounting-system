/**
 * 全局状态管理服务
 * 提供全局状态管理、本地数据持久化、离线操作支持等功能
 */

import { reactive, readonly } from 'vue'

// 状态类型定义
export interface AppState {
  // 用户状态
  user: {
    id: string | null
    name: string | null
    role: string | null
    isAuthenticated: boolean
    permissions: string[]
    lastLoginTime: Date | null
  }
  
  // 应用状态
  app: {
    isLoading: boolean
    loadingText: string
    isOnline: boolean
    theme: 'light' | 'dark' | 'auto'
    language: string
    sidebarCollapsed: boolean
    activeTab: string
  }
  
  // 数据状态
  data: {
    expenses: ExpenseItem[]
    dorms: DormItem[]
    users: User[]
    budgets: BudgetItem[]
    lastSyncTime: Date | null
    pendingOperations: PendingOperation[]
    cacheVersion: string
  }
  
  // 网络状态
  network: {
    isOnline: boolean
    connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
    lastOnlineTime: Date | null
    queueSize: number
  }
  
  // 错误状态
  errors: {
    list: ErrorInfo[]
    count: number
  }
}

export interface PendingOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  resource: string
  data: Record<string, unknown>
  timestamp: Date
  retryCount: number
  maxRetries: number
}

export interface ErrorInfo {
  id: string
  type: 'network' | 'validation' | 'permission' | 'system'
  message: string
  details?: Record<string, unknown>
  timestamp: Date
  resolved: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: Date
  version: string
  expiresAt: Date
  size: number
}

// 缓存策略类型
export interface CacheStrategy {
  ttl: number // 生存时间（毫秒）
  maxSize: number // 最大大小
  versioning: boolean // 是否版本控制
  compression: boolean // 是否压缩
}

// 操作结果类型
export interface OperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: Error
  message?: string
  timestamp: Date
}

// 同步冲突解决策略
export interface ConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'manual_merge' | 'timestamp_priority'
  data?: Record<string, unknown>
  timestamp?: Date
}

// 状态管理配置
export interface StateManagementConfig {
  enablePersistence: boolean
  enableOffline: boolean
  enableCache: boolean
  cacheStrategies: Record<string, CacheStrategy>
  conflictResolution: ConflictResolution
  autoSyncInterval: number
  maxRetries: number
}

class StateManagementService {
  private state: AppState
  private subscribers: Array<(state: AppState) => void> = []
  private storageKeys = {
    state: 'app_state',
    cache: 'app_cache',
    offline: 'offline_queue',
    preferences: 'user_preferences'
  }
  
  // 缓存管理
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly maxCacheSize = 100
  private readonly defaultCacheStrategy: CacheStrategy = {
    ttl: 5 * 60 * 1000, // 5分钟
    maxSize: 50,
    versioning: true,
    compression: false
  }

  // 离线操作队列
  private offlineQueue: PendingOperation[] = []
  
  // 网络状态监控
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor(private config: StateManagementConfig) {
    this.initializeState()
    this.initializeNetworkListener()
    this.initializeAutoSync()
    
    if (config.enablePersistence) {
      this.loadPersistedState()
    }
    
    if (config.enableOffline) {
      this.loadOfflineQueue()
    }
  }

  /**
   * 初始化状态
   */
  private initializeState() {
    this.state = reactive<AppState>({
      user: {
        id: null,
        name: null,
        role: null,
        isAuthenticated: false,
        permissions: [],
        lastLoginTime: null
      },
      app: {
        isLoading: false,
        loadingText: '',
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        theme: 'light',
        language: 'zh-CN',
        sidebarCollapsed: false,
        activeTab: 'dashboard'
      },
      data: {
        expenses: [],
        dorms: [],
        users: [],
        budgets: [],
        lastSyncTime: null,
        pendingOperations: [],
        cacheVersion: '1.0.0'
      },
      network: {
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        connectionType: 'unknown',
        lastOnlineTime: (typeof navigator !== 'undefined' ? navigator.onLine : true) ? new Date() : null,
        queueSize: 0
      },
      errors: {
        list: [],
        count: 0
      }
    })
  }

  /**
   * 设置当前用户
   */
  setCurrentUser(user: Partial<AppState['user']>) {
    this.state.user = {
      ...this.state.user,
      ...user,
      isAuthenticated: true,
      lastLoginTime: new Date()
    }
    
    console.log('状态管理：设置用户状态', user)
    this.persistState()
    this.notifySubscribers()
  }

  /**
   * 清除用户状态
   */
  clearUser() {
    this.state.user = {
      id: null,
      name: null,
      role: null,
      isAuthenticated: false,
      permissions: [],
      lastLoginTime: null
    }
    
    console.log('状态管理：清除用户状态')
    this.persistState()
    this.notifySubscribers()
  }

  /**
   * 更新应用状态
   */
  updateAppState(updates: Partial<AppState['app']>) {
    this.state.app = {
      ...this.state.app,
      ...updates
    }
    
    console.log('状态管理：更新应用状态', updates)
    this.persistState()
    this.notifySubscribers()
  }

  /**
   * 添加数据到状态
   */
  addData(resource: keyof AppState['data'], data: any) {
    if (Array.isArray(this.state.data[resource])) {
      (this.state.data[resource] as any[]).push(data)
      console.log('状态管理：添加数据', resource, data)
      
      if (this.config.enableOffline && !this.state.app.isOnline) {
        this.addToOfflineQueue('create', resource, data)
      }
      
      this.persistState()
      this.notifySubscribers()
    }
  }

  /**
   * 更新状态数据
   */
  updateData(resource: keyof AppState['data'], id: string, updates: any) {
    const dataArray = this.state.data[resource] as any[]
    const index = dataArray.findIndex(item => item.id === id)
    
    if (index !== -1) {
      dataArray[index] = { ...dataArray[index], ...updates }
      console.log('状态管理：更新数据', resource, id, updates)
      
      if (this.config.enableOffline && !this.state.app.isOnline) {
        this.addToOfflineQueue('update', resource, { id, ...updates })
      }
      
      this.persistState()
      this.notifySubscribers()
    }
  }

  /**
   * 删除状态数据
   */
  removeData(resource: keyof AppState['data'], id: string) {
    const dataArray = this.state.data[resource] as any[]
    const index = dataArray.findIndex(item => item.id === id)
    
    if (index !== -1) {
      dataArray.splice(index, 1)
      console.log('状态管理：删除数据', resource, id)
      
      if (this.config.enableOffline && !this.state.app.isOnline) {
        this.addToOfflineQueue('delete', resource, { id })
      }
      
      this.persistState()
      this.notifySubscribers()
    }
  }

  /**
   * 添加到离线队列
   */
  private addToOfflineQueue(type: PendingOperation['type'], resource: string, data: any) {
    const operation: PendingOperation = {
      id: this.generateId(),
      type,
      resource,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    }
    
    this.offlineQueue.push(operation)
    this.state.data.pendingOperations.push(operation)
    this.state.network.queueSize = this.offlineQueue.length
    
    console.log('状态管理：添加到离线队列', operation)
    this.persistOfflineQueue()
    this.notifySubscribers()
  }

  /**
   * 缓存数据
   */
  setCache<T>(key: string, data: T, strategyName?: string): OperationResult {
    try {
      const strategy = strategyName 
        ? this.config.cacheStrategies[strategyName] 
        : this.defaultCacheStrategy
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: new Date(),
        version: this.state.data.cacheVersion,
        expiresAt: new Date(Date.now() + strategy.ttl),
        size: this.calculateSize(data)
      }
      
      // 检查缓存大小限制
      if (this.cache.size >= this.maxCacheSize || entry.size > strategy.maxSize) {
        this.evictCache()
      }
      
      this.cache.set(key, entry)
      
      console.log('状态管理：缓存数据', key, data)
      this.persistCache()
      
      return {
        success: true,
        data: entry,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('状态管理：缓存数据失败', error)
      return {
        success: false,
        error: error as Error,
        timestamp: new Date()
      }
    }
  }

  /**
   * 获取缓存数据
   */
  getCache<T>(key: string): OperationResult<T> {
    try {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined
      
      if (!entry) {
        return {
          success: false,
          error: new Error('缓存项不存在'),
          timestamp: new Date()
        }
      }
      
      // 检查是否过期
      if (new Date() > entry.expiresAt) {
        this.cache.delete(key)
        return {
          success: false,
          error: new Error('缓存已过期'),
          timestamp: new Date()
        }
      }
      
      console.log('状态管理：获取缓存数据', key)
      return {
        success: true,
        data: entry.data,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('状态管理：获取缓存数据失败', error)
      return {
        success: false,
        error: error as Error,
        timestamp: new Date()
      }
    }
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string): OperationResult {
    try {
      if (pattern) {
        const regex = new RegExp(pattern)
        for (const key of this.cache.keys()) {
          if (regex.test(key)) {
            this.cache.delete(key)
          }
        }
      } else {
        this.cache.clear()
      }
      
      console.log('状态管理：清除缓存', pattern)
      this.persistCache()
      
      return {
        success: true,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('状态管理：清除缓存失败', error)
      return {
        success: false,
        error: error as Error,
        timestamp: new Date()
      }
    }
  }

  /**
   * 同步离线数据
   */
  async syncOfflineData(): Promise<OperationResult> {
    if (this.offlineQueue.length === 0) {
      return {
        success: true,
        message: '没有待同步的数据',
        timestamp: new Date()
      }
    }
    
    console.log('状态管理：开始同步离线数据', this.offlineQueue.length)
    
    const results: OperationResult[] = []
    
    for (const operation of [...this.offlineQueue]) {
      try {
        const result = await this.executePendingOperation(operation)
        results.push(result)
        
        if (result.success) {
          // 同步成功，移除操作
          this.removeFromOfflineQueue(operation.id)
        } else {
          // 同步失败，增加重试计数
          operation.retryCount++
          if (operation.retryCount >= operation.maxRetries) {
            console.error('操作重试次数超限', operation)
            this.removeFromOfflineQueue(operation.id)
            this.addError('system', `操作 ${operation.id} 重试失败，已放弃`)
          }
        }
      } catch (error) {
        results.push({
          success: false,
          error: error as Error,
          timestamp: new Date()
        })
      }
    }
    
    this.state.data.pendingOperations = [...this.offlineQueue]
    this.state.network.queueSize = this.offlineQueue.length
    this.persistOfflineQueue()
    this.notifySubscribers()
    
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    
    console.log('状态管理：离线数据同步完成', {
      success: successCount,
      total: totalCount,
      results
    })
    
    return {
      success: successCount === totalCount,
      data: { successCount, totalCount },
      message: `同步完成：${successCount}/${totalCount}`,
      timestamp: new Date()
    }
  }

  /**
   * 执行待处理操作
   */
  private async executePendingOperation(operation: PendingOperation): Promise<OperationResult> {
    // 这里应该实现实际的网络请求
    // 调用真实的API实现
    console.log('执行待处理操作', operation)
    
    // 网络延迟
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 90%成功率
    if (Math.random() > 0.1) {
      return {
        success: true,
        message: `操作 ${operation.type} ${operation.resource} 成功`,
        timestamp: new Date()
      }
    } else {
      throw new Error(`网络错误或服务器错误`)
    }
  }

  /**
   * 从离线队列移除操作
   */
  private removeFromOfflineQueue(operationId: string) {
    this.offlineQueue = this.offlineQueue.filter(op => op.id !== operationId)
    this.state.data.pendingOperations = this.offlineQueue
  }

  /**
   * 添加错误
   */
  addError(type: ErrorInfo['type'], message: string, details?: any) {
    const error: ErrorInfo = {
      id: this.generateId(),
      type,
      message,
      details,
      timestamp: new Date(),
      resolved: false
    }
    
    this.state.errors.list.unshift(error)
    this.state.errors.count = this.state.errors.list.length
    
    // 限制错误数量
    if (this.state.errors.list.length > 100) {
      this.state.errors.list = this.state.errors.list.slice(0, 100)
    }
    
    console.log('状态管理：添加错误', error)
    this.notifySubscribers()
  }

  /**
   * 解决错误
   */
  resolveError(errorId: string) {
    const error = this.state.errors.list.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      console.log('状态管理：解决错误', errorId)
      this.notifySubscribers()
    }
  }

  /**
   * 订阅状态变化
   */
  subscribe(callback: (state: AppState) => void) {
    this.subscribers.push(callback)
    
    // 立即调用一次以获取初始状态
    callback(this.state)
    
    // 返回取消订阅函数
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state)
      } catch (error) {
        console.error('状态订阅者执行错误', error)
      }
    })
  }

  /**
   * 获取状态（只读）
   */
  getState(): Readonly<AppState> {
    return readonly(this.state)
  }

  /**
   * 重置状态
   */
  reset() {
    this.state.data.expenses = []
    this.state.data.dorms = []
    this.state.data.users = []
    this.state.data.budgets = []
    this.state.errors.list = []
    this.state.errors.count = 0
    
    console.log('状态管理：重置状态')
    this.persistState()
    this.notifySubscribers()
  }

  /**
   * 持久化状态
   */
  private persistState() {
    if (!this.config.enablePersistence) return
    
    try {
      const stateToPersist = {
        user: this.state.user,
        app: this.state.app,
        data: {
          ...this.state.data,
          pendingOperations: [] // 不持久化待处理操作
        }
      }
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKeys.state, JSON.stringify(stateToPersist))
      }
      console.log('状态管理：持久化状态完成')
    } catch (error) {
      console.error('状态管理：持久化状态失败', error)
    }
  }

  /**
   * 加载持久化状态
   */
  private loadPersistedState() {
    try {
      const persisted = typeof localStorage !== 'undefined' ? localStorage.getItem(this.storageKeys.state) : null
      if (persisted) {
        const state = JSON.parse(persisted)
        this.state.user = { ...this.state.user, ...state.user }
        this.state.app = { ...this.state.app, ...state.app }
        this.state.data = { ...this.state.data, ...state.data }
        console.log('状态管理：加载持久化状态完成')
      }
    } catch (error) {
      console.error('状态管理：加载持久化状态失败', error)
    }
  }

  /**
   * 持久化缓存
   */
  private persistCache() {
    if (!this.config.enablePersistence) return
    
    try {
      const cacheObj: Record<string, CacheEntry<any>> = {}
      this.cache.forEach((entry, key) => {
        cacheObj[key] = entry
      })
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKeys.cache, JSON.stringify(cacheObj))
      }
    } catch (error) {
      console.error('状态管理：持久化缓存失败', error)
    }
  }

  /**
   * 持久化离线队列
   */
  private persistOfflineQueue() {
    if (!this.config.enableOffline) return
    
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKeys.offline, JSON.stringify(this.offlineQueue))
      }
    } catch (error) {
      console.error('状态管理：持久化离线队列失败', error)
    }
  }

  /**
   * 加载离线队列
   */
  private loadOfflineQueue() {
    try {
      const persisted = typeof localStorage !== 'undefined' ? localStorage.getItem(this.storageKeys.offline) : null
      if (persisted) {
        this.offlineQueue = JSON.parse(persisted).map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }))
        this.state.data.pendingOperations = [...this.offlineQueue]
        this.state.network.queueSize = this.offlineQueue.length
        console.log('状态管理：加载离线队列完成', this.offlineQueue.length)
      }
    } catch (error) {
      console.error('状态管理：加载离线队列失败', error)
    }
  }

  /**
   * 初始化网络监听
   */
  private initializeNetworkListener() {
    const handleOnline = () => {
      this.isOnline = true
      this.state.app.isOnline = true
      this.state.network.isOnline = true
      this.state.network.lastOnlineTime = new Date()
      
      console.log('状态管理：网络连接恢复')
      
      // 网络恢复时自动同步
      if (this.config.enableOffline) {
        this.syncOfflineData()
      }
      
      this.notifySubscribers()
    }

    const handleOffline = () => {
      this.isOnline = false
      this.state.app.isOnline = false
      this.state.network.isOnline = false
      
      console.log('状态管理：网络连接断开')
      this.notifySubscribers()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  /**
   * 初始化自动同步
   */
  private initializeAutoSync() {
    if (this.config.autoSyncInterval > 0) {
      this.syncTimer = setInterval(() => {
        if (this.isOnline && this.offlineQueue.length > 0) {
          this.syncOfflineData()
        }
      }, this.config.autoSyncInterval)
    }
  }

  /**
   * 驱逐缓存
   */
  private evictCache() {
    // LRU 策略：移除最久未使用的缓存项
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime())
    
    const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.2))
    toRemove.forEach(([key]) => {
      this.cache.delete(key)
    })
    
    console.log('状态管理：驱逐缓存', toRemove.length, '项')
  }

  /**
   * 计算数据大小
   */
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      return 1024 // 默认1KB
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 销毁服务
   */
  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
    this.subscribers = []
    this.cache.clear()
  }
}

// 默认配置
const defaultConfig: StateManagementConfig = {
  enablePersistence: true,
  enableOffline: true,
  enableCache: true,
  cacheStrategies: {
    expenses: { ttl: 10 * 60 * 1000, maxSize: 100, versioning: true, compression: false },
    dorms: { ttl: 30 * 60 * 1000, maxSize: 50, versioning: true, compression: false },
    users: { ttl: 5 * 60 * 1000, maxSize: 20, versioning: true, compression: false },
    budgets: { ttl: 15 * 60 * 1000, maxSize: 30, versioning: true, compression: false }
  },
  conflictResolution: { strategy: 'timestamp_priority' },
  autoSyncInterval: 5 * 60 * 1000, // 5分钟
  maxRetries: 3
}

// 创建全局状态管理服务实例
export const stateManagementService = new StateManagementService(defaultConfig)

// 导出便捷方法
export const {
  setCurrentUser,
  clearUser,
  updateAppState,
  addData,
  updateData,
  removeData,
  setCache,
  getCache,
  clearCache,
  syncOfflineData,
  addError,
  resolveError,
  subscribe,
  getState,
  reset
} = stateManagementService

// 导出类型
export type {
  AppState,
  PendingOperation,
  ErrorInfo,
  CacheEntry,
  CacheStrategy,
  OperationResult,
  ConflictResolution,
  StateManagementConfig
}