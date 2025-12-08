/**
 * 移动端适配和过渡动画工具
 * 提供移动端响应式设计和动画效果支持
 */

/**
 * 检测设备类型
 */
export const deviceDetection = {
  /**
   * 检测是否为移动设备
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },
  
  /**
   * 检测是否为平板设备
   */
  isTablet(): boolean {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent)
  },
  
  /**
   * 检测是否为桌面设备
   */
  isDesktop(): boolean {
    return !this.isMobile() && !this.isTablet()
  },
  
  /**
   * 获取屏幕尺寸分类
   */
  getScreenSize(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
    const width = window.innerWidth
    if (width < 576) return 'xs'
    if (width < 768) return 'sm'
    if (width < 992) return 'md'
    if (width < 1200) return 'lg'
    return 'xl'
  }
}

/**
 * 响应式断点配置
 */
export const breakpoints = {
  xs: 0,      // 超小屏
  sm: 576,    // 小屏
  md: 768,    // 中屏
  lg: 992,    // 大屏
  xl: 1200    // 超大屏
}

/**
 * CSS媒体查询工具
 */
export const mediaQuery = {
  /**
   * 生成媒体查询字符串
   * @param breakpoint 断点
   * @param direction 方向 'up' | 'down' | 'only'
   */
  generate(breakpoint: keyof typeof breakpoints, direction: 'up' | 'down' | 'only' = 'up'): string {
    const breakpointValue = breakpoints[breakpoint]
    
    switch (direction) {
      case 'up':
        return `(min-width: ${breakpointValue}px)`
      case 'down':
        // 找到下一个断点
        const breakpointKeys = Object.keys(breakpoints) as (keyof typeof breakpoints)[]
        const currentIndex = breakpointKeys.indexOf(breakpoint)
        if (currentIndex < breakpointKeys.length - 1) {
          const nextBreakpoint = breakpoints[breakpointKeys[currentIndex + 1]]
          return `(max-width: ${nextBreakpoint - 0.02}px)`
        }
        return `(max-width: ${breakpointValue}px)`
      case 'only':
        const onlyKeys = Object.keys(breakpoints) as (keyof typeof breakpoints)[]
        const onlyIndex = onlyKeys.indexOf(breakpoint)
        if (onlyIndex < onlyKeys.length - 1) {
          const nextOnlyBreakpoint = breakpoints[onlyKeys[onlyIndex + 1]]
          return `(min-width: ${breakpointValue}px) and (max-width: ${nextOnlyBreakpoint - 0.02}px)`
        }
        return `(min-width: ${breakpointValue}px)`
      default:
        return `(min-width: ${breakpointValue}px)`
    }
  },
  
  /**
   * 检查当前屏幕是否匹配断点
   * @param breakpoint 断点
   * @param direction 方向
   */
  matches(breakpoint: keyof typeof breakpoints, direction: 'up' | 'down' | 'only' = 'up'): boolean {
    const query = this.generate(breakpoint, direction)
    return window.matchMedia(query).matches
  }
}

/**
 * 过渡动画工具
 */
export const transitions = {
  /**
   * 淡入动画
   */
  fadeIn(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      element.style.opacity = '0'
      element.style.transition = `opacity ${duration}ms ease-in-out`
      
      requestAnimationFrame(() => {
        element.style.opacity = '1'
      })
      
      setTimeout(() => {
        resolve()
      }, duration)
    })
  },
  
  /**
   * 淡出动画
   */
  fadeOut(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      element.style.opacity = '1'
      element.style.transition = `opacity ${duration}ms ease-in-out`
      
      requestAnimationFrame(() => {
        element.style.opacity = '0'
      })
      
      setTimeout(() => {
        resolve()
      }, duration)
    })
  },
  
  /**
   * 滑动展开动画
   */
  slideDown(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      // 获取元素自然高度
      element.style.height = 'auto'
      const height = element.scrollHeight + 'px'
      element.style.height = '0px'
      element.style.overflow = 'hidden'
      element.style.transition = `height ${duration}ms ease-in-out`
      
      requestAnimationFrame(() => {
        element.style.height = height
      })
      
      setTimeout(() => {
        element.style.height = 'auto'
        element.style.overflow = ''
        resolve()
      }, duration)
    })
  },
  
  /**
   * 滑动收起动画
   */
  slideUp(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      element.style.height = element.scrollHeight + 'px'
      element.style.overflow = 'hidden'
      element.style.transition = `height ${duration}ms ease-in-out`
      
      requestAnimationFrame(() => {
        element.style.height = '0px'
      })
      
      setTimeout(() => {
        element.style.display = 'none'
        element.style.height = ''
        element.style.overflow = ''
        resolve()
      }, duration)
    })
  },
  
  /**
   * 缩放动画
   */
  scale(element: HTMLElement, scale: number, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      element.style.transform = 'scale(1)'
      element.style.transition = `transform ${duration}ms ease-in-out`
      
      requestAnimationFrame(() => {
        element.style.transform = `scale(${scale})`
      })
      
      setTimeout(() => {
        resolve()
      }, duration)
    })
  }
}

/**
 * 快捷键管理器
 */
export class ShortcutManager {
  private static instance: ShortcutManager
  private shortcuts: Map<string, Set<() => void>> = new Map()
  
  private constructor() {
    this.init()
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(): ShortcutManager {
    if (!ShortcutManager.instance) {
      ShortcutManager.instance = new ShortcutManager()
    }
    return ShortcutManager.instance
  }
  
  /**
   * 初始化快捷键监听
   */
  private init() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
  }
  
  /**
   * 处理键盘按下事件
   */
  private handleKeyDown(event: KeyboardEvent) {
    // 生成快捷键标识
    const key = this.generateKeyIdentifier(event)
    
    // 如果有注册的回调函数，则执行
    const callbacks = this.shortcuts.get(key)
    if (callbacks) {
      event.preventDefault()
      callbacks.forEach(callback => callback())
    }
  }
  
  /**
   * 生成快捷键标识
   */
  private generateKeyIdentifier(event: KeyboardEvent): string {
    const modifiers = []
    if (event.ctrlKey) modifiers.push('Ctrl')
    if (event.shiftKey) modifiers.push('Shift')
    if (event.altKey) modifiers.push('Alt')
    if (event.metaKey) modifiers.push('Meta')
    
    return [...modifiers, event.key].join('+')
  }
  
  /**
   * 注册快捷键
   * @param key 快捷键组合，如 'Ctrl+S'
   * @param callback 回调函数
   */
  register(key: string, callback: () => void) {
    if (!this.shortcuts.has(key)) {
      this.shortcuts.set(key, new Set())
    }
    this.shortcuts.get(key)?.add(callback)
  }
  
  /**
   * 注销快捷键
   * @param key 快捷键组合
   * @param callback 回调函数
   */
  unregister(key: string, callback: () => void) {
    const callbacks = this.shortcuts.get(key)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.shortcuts.delete(key)
      }
    }
  }
  
  /**
   * 注销所有快捷键
   */
  unregisterAll() {
    this.shortcuts.clear()
  }
}

/**
 * 移动端触摸手势识别
 */
export class TouchGestures {
  private startX = 0
  private startY = 0
  private startTime = 0
  private static readonly SWIPE_THRESHOLD = 50
  private static readonly SWIPE_TIMEOUT = 1000
  
  /**
   * 初始化手势识别
   * @param element 目标元素
   * @param callbacks 回调函数
   */
  init(
    element: HTMLElement, 
    callbacks: {
      onSwipeLeft?: () => void,
      onSwipeRight?: () => void,
      onSwipeUp?: () => void,
      onSwipeDown?: () => void,
      onTap?: () => void
    }
  ) {
    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true })
    element.addEventListener('touchend', this.handleTouchEnd.bind(this, callbacks), { passive: true })
  }
  
  private handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    this.startX = touch.clientX
    this.startY = touch.clientY
    this.startTime = Date.now()
  }
  
  private handleTouchEnd(
    callbacks: {
      onSwipeLeft?: () => void,
      onSwipeRight?: () => void,
      onSwipeUp?: () => void,
      onSwipeDown?: () => void,
      onTap?: () => void
    },
    event: TouchEvent
  ) {
    const touch = event.changedTouches[0]
    const endX = touch.clientX
    const endY = touch.clientY
    const endTime = Date.now()
    
    const deltaX = endX - this.startX
    const deltaY = endY - this.startY
    const deltaTime = endTime - this.startTime
    
    // 检查是否为点击
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      callbacks.onTap?.()
      return
    }
    
    // 检查是否为滑动
    if (deltaTime > TouchGestures.SWIPE_TIMEOUT) return
    
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    
    // 确保滑动距离足够
    if (absDeltaX < TouchGestures.SWIPE_THRESHOLD && absDeltaY < TouchGestures.SWIPE_THRESHOLD) return
    
    // 判断主要滑动方向
    if (absDeltaX > absDeltaY) {
      // 水平滑动
      if (deltaX > 0) {
        callbacks.onSwipeRight?.()
      } else {
        callbacks.onSwipeLeft?.()
      }
    } else {
      // 垂直滑动
      if (deltaY > 0) {
        callbacks.onSwipeDown?.()
      } else {
        callbacks.onSwipeUp?.()
      }
    }
  }
}

// 默认导出
export default {
  deviceDetection,
  breakpoints,
  mediaQuery,
  transitions,
  ShortcutManager,
  TouchGestures
}