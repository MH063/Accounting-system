import { ref, computed, type Ref } from 'vue'

// 加载状态管理器
class LoadingStateManager {
  private loadingStates: Ref<Set<string>> = ref(new Set())
  private loadingMessages: Ref<Map<string, string>> = ref(new Map())
  
  /**
   * 开始加载
   * @param key 加载标识
   * @param message 加载消息
   */
  startLoading(key: string, message: string = '加载中...'): void {
    this.loadingStates.value.add(key)
    this.loadingMessages.value.set(key, message)
  }
  
  /**
   * 结束加载
   * @param key 加载标识
   */
  stopLoading(key: string): void {
    this.loadingStates.value.delete(key)
    this.loadingMessages.value.delete(key)
  }
  
  /**
   * 检查是否正在加载
   * @param key 加载标识，如果不传则检查是否有任何加载
   */
  isLoading(key?: string): boolean {
    if (key) {
      return this.loadingStates.value.has(key)
    }
    return this.loadingStates.value.size > 0
  }
  
  /**
   * 获取加载消息
   * @param key 加载标识，如果不传则返回第一个加载消息
   */
  getLoadingMessage(key?: string): string {
    if (key) {
      return this.loadingMessages.value.get(key) || '加载中...'
    }
    
    const firstKey = this.loadingStates.value.values().next().value
    return firstKey ? this.loadingMessages.value.get(firstKey) || '加载中...' : ''
  }
  
  /**
   * 清除所有加载状态
   */
  clearAll(): void {
    this.loadingStates.value.clear()
    this.loadingMessages.value.clear()
  }
  
  /**
   * 获取当前加载状态（响应式）
   */
  get loadingState() {
    return computed(() => ({
      isLoading: this.isLoading(),
      loadingKeys: Array.from(this.loadingStates.value),
      loadingMessage: this.getLoadingMessage(),
      loadingCount: this.loadingStates.value.size
    }))
  }
}

// 创建全局加载状态管理器实例
export const loadingStateManager = new LoadingStateManager()

/**
 * 创建API调用的加载状态管理
 * @param apiKey API标识
 * @param message 加载消息
 */
export const createApiLoading = (apiKey: string, message: string = '加载中...') => {
  return {
    start: () => loadingStateManager.startLoading(apiKey, message),
    stop: () => loadingStateManager.stopLoading(apiKey),
    isLoading: () => loadingStateManager.isLoading(apiKey),
    getMessage: () => loadingStateManager.getLoadingMessage(apiKey)
  }
}

/**
 * 组合式API：使用加载状态
 */
export const useLoading = () => {
  return {
    // 状态
    isLoading: computed(() => loadingStateManager.isLoading()),
    loadingMessage: computed(() => loadingStateManager.getLoadingMessage()),
    loadingState: loadingStateManager.loadingState,
    
    // 方法
    startLoading: loadingStateManager.startLoading.bind(loadingStateManager),
    stopLoading: loadingStateManager.stopLoading.bind(loadingStateManager),
    clearAllLoading: loadingStateManager.clearAll.bind(loadingStateManager),
    isLoadingKey: loadingStateManager.isLoading.bind(loadingStateManager),
    getLoadingMessage: loadingStateManager.getLoadingMessage.bind(loadingStateManager)
  }
}

/**
 * 组合式API：使用API加载状态
 * @param apiKey API标识
 * @param message 加载消息
 */
export const useApiLoading = (apiKey: string, message: string = '加载中...') => {
  const apiLoading = createApiLoading(apiKey, message)
  
  return {
    // 状态
    isLoading: computed(() => apiLoading.isLoading()),
    loadingMessage: computed(() => apiLoading.getMessage()),
    
    // 方法
    startLoading: apiLoading.start,
    stopLoading: apiLoading.stop
  }
}

/**
 * 创建带加载状态的异步函数包装器
 * @param asyncFn 异步函数
 * @param loadingKey 加载标识
 * @param loadingMessage 加载消息
 */
export const withLoading = <T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  loadingKey: string,
  loadingMessage: string = '加载中...'
) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    loadingStateManager.startLoading(loadingKey, loadingMessage)
    
    try {
      const result = await asyncFn(...args)
      return result
    } finally {
      loadingStateManager.stopLoading(loadingKey)
    }
  }
}

/**
 * 批量管理多个API的加载状态
 * @param apiConfigs API配置数组
 */
export const createBatchLoading = (apiConfigs: Array<{ key: string; message?: string }>) => {
  return {
    startAll: () => {
      apiConfigs.forEach(config => {
        loadingStateManager.startLoading(config.key, config.message || '加载中...')
      })
    },
    
    stopAll: () => {
      apiConfigs.forEach(config => {
        loadingStateManager.stopLoading(config.key)
      })
    },
    
    start: (key: string) => {
      const config = apiConfigs.find(c => c.key === key)
      if (config) {
        loadingStateManager.startLoading(key, config.message || '加载中...')
      }
    },
    
    stop: (key: string) => {
      loadingStateManager.stopLoading(key)
    },
    
    isLoading: (key?: string) => {
      if (key) {
        return loadingStateManager.isLoading(key)
      }
      return apiConfigs.some(config => loadingStateManager.isLoading(config.key))
    }
  }
}

// 默认导出
export default {
  loadingStateManager,
  createApiLoading,
  useLoading,
  useApiLoading,
  withLoading,
  createBatchLoading
}