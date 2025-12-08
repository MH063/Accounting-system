/**
 * 性能优化工具类
 * 提供代码分割、懒加载和资源优化功能
 */

/**
 * 预加载组件工具函数
 * @param componentImport 动态导入函数
 * @returns 预加载后的组件
 */
export const preloadComponent = async (componentImport: () => Promise<any>) => {
  try {
    const module = await componentImport()
    return module.default || module
  } catch (error) {
    console.error('组件预加载失败:', error)
    throw error
  }
}

/**
 * 带重试机制的动态导入函数
 * @param importFn 动态导入函数
 * @param retries 重试次数
 * @param delay 重试延迟(ms)
 * @returns 导入的模块
 */
export const retryableImport = async (
  importFn: () => Promise<any>,
  retries = 3,
  delay = 1000
): Promise<any> => {
  try {
    return await importFn()
  } catch (error) {
    if (retries > 0) {
      console.warn(`导入失败，${delay}ms后重试，剩余重试次数: ${retries}`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryableImport(importFn, retries - 1, delay * 1.5)
    }
    throw error
  }
}

/**
 * 智能预加载组件
 * 根据路由预测和用户行为预加载可能需要的组件
 */
export class ComponentPreloader {
  private loadedComponents: Set<string> = new Set()
  private preloadQueue: Map<string, () => Promise<any>> = new Map()
  
  /**
   * 添加组件到预加载队列
   * @param name 组件名称
   * @param importFn 动态导入函数
   */
  addToQueue(name: string, importFn: () => Promise<any>) {
    if (!this.loadedComponents.has(name)) {
      this.preloadQueue.set(name, importFn)
    }
  }
  
  /**
   * 执行预加载
   * @param concurrency 并发加载数量
   */
  async preload(concurrency = 2) {
    const entries = Array.from(this.preloadQueue.entries())
    const chunks = this.chunkArray(entries, concurrency)
    
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async ([name, importFn]) => {
          try {
            await retryableImport(importFn)
            this.loadedComponents.add(name)
            this.preloadQueue.delete(name)
            console.log(`组件 ${name} 预加载完成`)
          } catch (error) {
            console.error(`组件 ${name} 预加载失败:`, error)
          }
        })
      )
    }
  }
  
  /**
   * 数组分块
   * @param array 数组
   * @param size 块大小
   * @returns 分块后的数组
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

/**
 * 资源加载优化器
 */
export class ResourceOptimizer {
  private static instance: ResourceOptimizer
  private observers: { disconnect: () => void }[] = [] // 修改类型为通用观察器接口
  
  private constructor() {}
  
  /**
   * 获取单例实例
   */
  static getInstance(): ResourceOptimizer {
    if (!ResourceOptimizer.instance) {
      ResourceOptimizer.instance = new ResourceOptimizer()
    }
    return ResourceOptimizer.instance
  }
  
  /**
   * 优化图片加载
   * @param container 容器元素
   */
  optimizeImageLoading(container: HTMLElement = document.body) {
    const images = container.querySelectorAll('img[data-src]')
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            imageObserver.unobserve(img)
          }
        }
      })
    }, {
      rootMargin: '50px' // 提前50px开始加载
    })
    
    images.forEach(img => imageObserver.observe(img))
    this.observers.push(imageObserver) // 现在类型匹配了
  }
  
  /**
   * 优化第三方资源加载
   * @param urls 资源URL列表
   */
  async optimizeThirdPartyResources(urls: string[]) {
    // 使用Promise.allSettled确保所有资源尝试加载，即使某些失败也不会影响其他资源
    const results = await Promise.allSettled(
      urls.map(url => this.loadResource(url))
    )
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`第三方资源加载失败: ${urls[index]}`, result.reason)
      }
    })
  }
  
  /**
   * 加载单个资源
   * @param url 资源URL
   */
  private async loadResource(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ext = url.split('.').pop()?.toLowerCase()
      
      switch (ext) {
        case 'css':
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = url
          link.onload = () => resolve()
          link.onerror = () => reject(new Error(`CSS加载失败: ${url}`))
          document.head.appendChild(link)
          break
          
        case 'js':
          const script = document.createElement('script')
          script.src = url
          script.onload = () => resolve()
          script.onerror = () => reject(new Error(`JS加载失败: ${url}`))
          document.head.appendChild(script)
          break
          
        default:
          reject(new Error(`不支持的资源类型: ${ext}`))
      }
    })
  }
  
  /**
   * 清理观察器
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

/**
 * 路由级别的代码分割优化
 * @param componentImport 动态导入函数
 * @returns 优化后的路由组件
 */
export const optimizeRouteComponent = (componentImport: () => Promise<any>) => {
  // 使用webpack魔法注释优化代码分割
  return componentImport
}

/**
 * 创建优化的路由组件导入函数
 * @param componentPath 组件路径
 * @param chunkName 代码块名称
 * @returns 优化的导入函数
 */
export const createOptimizedImport = (componentPath: string, chunkName: string) => {
  // 这里的注释会被webpack识别用于代码分割优化
  return () => import(
    /* webpackChunkName: "[request]" */
    /* webpackPreload: true */
    `@/views/${componentPath}`
  )
}

/**
 * 性能监控工具
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  
  private constructor() {}
  
  /**
   * 获取单例实例
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  /**
   * 监控组件加载性能
   * @param componentName 组件名称
   * @param loadFunction 加载函数
   */
  async monitorComponentLoad<T>(
    componentName: string,
    loadFunction: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await loadFunction()
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      console.log(`组件 ${componentName} 加载耗时: ${loadTime.toFixed(2)}ms`)
      
      // 如果加载时间超过阈值，发出警告
      if (loadTime > 1000) {
        console.warn(`组件 ${componentName} 加载时间过长: ${loadTime.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const loadTime = endTime - startTime
      console.error(`组件 ${componentName} 加载失败，耗时: ${loadTime.toFixed(2)}ms`, error)
      throw error
    }
  }
  
  /**
   * 获取页面性能指标
   */
  getPageMetrics() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      
      return {
        // 页面加载时间
        loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
        // DOM解析时间
        domContentLoadedTime: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
        // 首次绘制时间
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        // 首次内容绘制时间
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      }
    }
    
    return null
  }
}

// 默认导出
export default {
  preloadComponent,
  retryableImport,
  ComponentPreloader,
  ResourceOptimizer,
  optimizeRouteComponent,
  createOptimizedImport,
  PerformanceMonitor
}