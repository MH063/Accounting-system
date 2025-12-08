/**
 * 图表管理工具
 * 提供统一的图表初始化、更新和重绘保护功能
 */

import * as echarts from 'echarts'

// 图表配置类型
export interface ChartConfig {
  container: HTMLElement
  options: any
  theme?: string
}

// 图表管理器类
export class ChartManager {
  private chart: echarts.ECharts | null = null
  private container: HTMLElement
  private options: any
  private theme: string | undefined
  private lastRenderTime: number = 0
  private resizeObserver: ResizeObserver | null = null
  private mutationObserver: MutationObserver | null = null

  constructor(config: ChartConfig) {
    this.container = config.container
    this.options = config.options
    this.theme = config.theme
    
    // 初始化图表
    this.init()
    
    // 设置重绘保护
    this.setupRedrawProtection()
  }

  /**
   * 初始化图表
   */
  private init(): void {
    if (this.chart) {
      this.dispose()
    }
    
    this.chart = echarts.init(this.container, this.theme)
    this.render()
  }

  /**
   * 渲染图表
   */
  private render(): void {
    if (!this.chart) return
    
    // 记录渲染时间用于重绘保护
    const currentTime = Date.now()
    
    // 如果距离上次渲染不足100ms，则跳过渲染
    if (currentTime - this.lastRenderTime < 100) {
      console.warn('图表重绘过于频繁，已跳过本次渲染')
      return
    }
    
    this.chart.setOption(this.options, true)
    this.lastRenderTime = currentTime
  }

  /**
   * 更新图表数据
   * @param newOptions 新的图表配置
   */
  public update(newOptions: any): void {
    if (!this.chart) return
    
    this.options = { ...this.options, ...newOptions }
    this.render()
  }

  /**
   * 重置图表
   */
  public reset(): void {
    if (!this.chart) return
    
    this.chart.clear()
    this.render()
  }

  /**
   * 重置图表尺寸
   */
  public resize(): void {
    if (!this.chart) return
    
    this.chart.resize()
  }

  /**
   * 销毁图表
   */
  public dispose(): void {
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
    
    // 清理观察器
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
  }

  /**
   * 设置重绘保护机制
   */
  private setupRedrawProtection(): void {
    // 监听容器尺寸变化
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resize()
      })
      this.resizeObserver.observe(this.container)
    }
    
    // 监听容器DOM变化
    this.mutationObserver = new MutationObserver(() => {
      // 检查容器是否仍然在文档中
      if (!document.contains(this.container)) {
        this.dispose()
      }
    })
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  /**
   * 获取图表实例
   */
  public getInstance(): echarts.ECharts | null {
    return this.chart
  }
}

/**
 * 创建图表管理器工厂函数
 * @param config 图表配置
 * @returns 图表管理器实例
 */
export const createChartManager = (config: ChartConfig): ChartManager => {
  return new ChartManager(config)
}

/**
 * 批量创建图表管理器
 * @param configs 图表配置数组
 * @returns 图表管理器实例数组
 */
export const createChartManagers = (configs: ChartConfig[]): ChartManager[] => {
  return configs.map(config => new ChartManager(config))
}

export default {
  ChartManager,
  createChartManager,
  createChartManagers
}