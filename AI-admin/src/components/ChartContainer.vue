<template>
  <div class="chart-container" :style="{ height: containerHeight }">
    <div class="chart-header" v-if="showHeader">
      <div class="chart-title">{{ title }}</div>
      <div class="chart-actions">
        <slot name="actions"></slot>
        <el-dropdown v-if="showExport" @command="handleExport">
          <el-button size="small" type="primary">
            导出 <el-icon><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="png">PNG图片</el-dropdown-item>
              <el-dropdown-item command="jpg">JPG图片</el-dropdown-item>
              <el-dropdown-item command="svg">SVG矢量图</el-dropdown-item>
              <el-dropdown-item command="pdf">PDF文档</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button 
          v-if="showRefresh" 
          size="small" 
          @click="handleRefresh"
          :loading="refreshing"
        >
          {{ refreshing ? '刷新中...' : '刷新' }}
        </el-button>
        <el-button 
          v-if="showFullscreen" 
          size="small" 
          @click="toggleFullscreen"
        >
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </div>
    
    <div ref="chartWrapperRef" class="chart-wrapper" :style="{ height: chartHeight }">
      <div 
        ref="chartRef" 
        class="chart-content"
        :class="{ 'fullscreen-chart': isFullscreen }"
      ></div>
      
      <div v-if="loading" class="chart-loading">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="rect" style="width: 100%; height: 100%" />
          </template>
        </el-skeleton>
      </div>
      
      <div v-else-if="error" class="chart-error">
        <el-result icon="error" title="图表加载失败" :sub-title="error">
          <template #extra>
            <el-button type="primary" @click="handleRetry">重试</el-button>
          </template>
        </el-result>
      </div>
      
      <div v-else-if="noData" class="chart-no-data">
        <el-result icon="info" title="暂无数据">
          <template #extra>
            <el-button type="primary" @click="handleRetry">刷新</el-button>
          </template>
        </el-result>
      </div>
    </div>
    
    <div class="chart-footer" v-if="showFooter">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem, ElSkeleton, ElSkeletonItem, ElResult, ElIcon } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 定义属性
interface Props {
  // 基础属性
  title?: string
  options?: any
  loading?: boolean
  error?: string
  noData?: boolean
  
  // 容器属性
  height?: string
  showHeader?: boolean
  showFooter?: boolean
  
  // 功能属性
  showExport?: boolean
  showRefresh?: boolean
  showFullscreen?: boolean
  autoResize?: boolean
  
  // 图表属性
  theme?: string
}

// 默认属性值
const props = withDefaults(defineProps<Props>(), {
  title: '',
  options: () => ({}),
  loading: false,
  error: '',
  noData: false,
  height: '400px',
  showHeader: true,
  showFooter: false,
  showExport: true,
  showRefresh: true,
  showFullscreen: true,
  autoResize: true,
  theme: undefined
})

// 定义事件
const emit = defineEmits<{
  (e: 'export', type: 'png' | 'jpg' | 'svg' | 'pdf'): void
  (e: 'refresh'): void
  (e: 'retry'): void
  (e: 'chart-ready', chart: echarts.ECharts): void
}>()

// 响应式数据
const chartRef = ref<HTMLElement | null>(null)
const chartWrapperRef = ref<HTMLElement | null>(null)
const chartInstance = ref<echarts.ECharts | null>(null)
const isFullscreen = ref(false)
const refreshing = ref(false)
const resizeObserver = ref<ResizeObserver | null>(null)

// 计算属性
const containerHeight = computed(() => {
  return props.height
})

const chartHeight = computed(() => {
  if (!props.showHeader && !props.showFooter) {
    return '100%'
  }
  
  let height = parseInt(props.height)
  if (props.showHeader) height -= 50
  if (props.showFooter) height -= 40
  return `${height}px`
})

// 方法
const initChart = () => {
  if (!chartRef.value) return
  
  // 销毁已存在的图表实例
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  
  // 初始化新的图表实例
  chartInstance.value = echarts.init(chartRef.value, props.theme)
  
  // 设置图表选项
  if (props.options) {
    chartInstance.value.setOption(props.options)
  }
  
  // 发送图表就绪事件
  emit('chart-ready', chartInstance.value)
}

const resizeChart = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

const updateChart = (options: any) => {
  if (chartInstance.value && options) {
    chartInstance.value.setOption(options, true)
  }
}

const handleExport = (type: 'png' | 'jpg' | 'svg' | 'pdf') => {
  emit('export', type)
  
  if (!chartInstance.value) return
  
  switch (type) {
    case 'png':
    case 'jpg':
      const imgUrl = chartInstance.value.getDataURL({
        type,
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
      // 创建下载链接
      const link = document.createElement('a')
      link.download = `${props.title || 'chart'}.${type}`
      link.href = imgUrl
      link.click()
      break
    case 'svg':
      const svgData = chartInstance.value.renderToSVGString()
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      const svgUrl = URL.createObjectURL(blob)
      const svgLink = document.createElement('a')
      svgLink.download = `${props.title || 'chart'}.svg`
      svgLink.href = svgUrl
      svgLink.click()
      URL.revokeObjectURL(svgUrl)
      break
    case 'pdf':
      // PDF导出需要额外的库支持，这里只发送事件
      console.warn('PDF导出需要额外的库支持')
      break
  }
}

const handleRefresh = async () => {
  refreshing.value = true
  emit('refresh')
  // 模拟刷新延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  refreshing.value = false
}

const handleRetry = () => {
  emit('retry')
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    resizeChart()
  })
}

const exitFullscreen = () => {
  if (isFullscreen.value) {
    isFullscreen.value = false
    nextTick(() => {
      resizeChart()
    })
  }
}

// 监听属性变化
watch(() => props.options, (newOptions) => {
  updateChart(newOptions)
}, { deep: true })

watch(() => props.loading, (newLoading) => {
  if (!newLoading && chartInstance.value) {
    nextTick(() => {
      resizeChart()
    })
  }
})

// 生命周期钩子
onMounted(() => {
  initChart()
  
  // 添加窗口大小变化监听
  if (props.autoResize) {
    window.addEventListener('resize', resizeChart)
    
    // 使用 ResizeObserver 监听容器大小变化
    if (chartWrapperRef.value && window.ResizeObserver) {
      resizeObserver.value = new ResizeObserver(resizeChart)
      resizeObserver.value.observe(chartWrapperRef.value)
    }
  }
  
  // 添加ESC键退出全屏监听
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFullscreen.value) {
      exitFullscreen()
    }
  })
})

onUnmounted(() => {
  // 清理图表实例
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  
  // 移除事件监听
  if (props.autoResize) {
    window.removeEventListener('resize', resizeChart)
    
    if (resizeObserver.value) {
      resizeObserver.value.disconnect()
    }
  }
})

// 暴露方法给父组件
defineExpose({
  chartInstance,
  resizeChart,
  updateChart,
  initChart
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fff;
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.chart-actions {
  display: flex;
  gap: 10px;
}

.chart-wrapper {
  position: relative;
  width: 100%;
}

.chart-content {
  width: 100%;
  height: 100%;
}

.fullscreen-chart {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999;
  background-color: #fff;
}

.chart-loading,
.chart-error,
.chart-no-data {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 100;
}

.chart-footer {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .chart-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>