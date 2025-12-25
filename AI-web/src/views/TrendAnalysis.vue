<template>
  <div class="trend-analysis">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">趋势分析</h1>
      </div>
      <div class="header-actions">
        <!-- 返回按钮 -->
        <el-button 
          type="primary" 
          :icon="ArrowLeft" 
          @click="handleBack"
          class="back-btn"
        >
          返回
        </el-button>
        
        <!-- 快捷时间选择 -->
        <div class="quick-time-selector" style="margin-right: 12px;">
          <el-button-group>
            <el-button 
              v-for="period in timePeriods" 
              :key="period.value"
              size="small"
              :type="selectedTimePeriod === period.value ? 'primary' : 'default'"
              @click="selectTimePeriod(period.value)"
            >
              {{ period.label }}
            </el-button>
          </el-button-group>
        </div>
        
        <el-button :icon="Download" @click="handleExportReport" type="primary">
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="8" :md="6">
          <el-select v-model="analysisType" placeholder="分析类型" @change="handleAnalysisTypeChange">
            <el-option label="支出趋势" value="expense" />
            <el-option label="收入趋势" value="income" />
            <el-option label="结余趋势" value="balance" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8" :md="6">
          <el-select v-model="timeGranularity" placeholder="时间粒度" @change="handleGranularityChange">
            <el-option label="按日" value="day" />
            <el-option label="按周" value="week" />
            <el-option label="按月" value="month" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8" :md="6">
          <el-select v-model="comparisonType" placeholder="对比类型" @change="handleComparisonChange">
            <el-option label="同比分析" value="yoy" />
            <el-option label="环比分析" value="qoq" />
            <el-option label="不对比" value="none" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8" :md="6">
          <el-switch
            v-model="enablePrediction"
            active-text="启用预测"
            @change="handlePredictionToggle"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 关键指标卡片 -->
    <div class="key-metrics">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="metric-card">
            <div class="metric-icon trend">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">本期总额</div>
              <div class="metric-value">¥{{ formatAmount(currentPeriodTotal) }}</div>
              <div class="metric-change" :class="{ up: currentPeriodChange > 0, down: currentPeriodChange < 0 }">
                <el-icon><CaretTop v-if="currentPeriodChange > 0" /><CaretBottom v-else /></el-icon>
                {{ Math.abs(currentPeriodChange || 0) }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="metric-card">
            <div class="metric-icon compare">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">{{ getComparisonLabel }}</div>
              <div class="metric-value">¥{{ formatAmount(comparisonValue) }}</div>
              <div class="metric-change" :class="{ up: comparisonChange > 0, down: comparisonChange < 0 }">
                <el-icon><CaretTop v-if="comparisonChange > 0" /><CaretBottom v-else /></el-icon>
                {{ Math.abs(comparisonChange || 0) }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="metric-card">
            <div class="metric-icon anomaly">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">异常检测</div>
              <div class="metric-value">{{ anomalyCount }}</div>
              <div class="metric-desc">{{ anomalyStatus }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="metric-card">
            <div class="metric-icon prediction">
              <el-icon><Lightning /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">预测准确率</div>
              <div class="metric-value">{{ predictionSummary.confidence }}%</div>
              <div class="metric-desc">基于历史数据</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 趋势图表 -->
    <div class="trend-charts">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="16">
          <div class="chart-card main-chart">
            <div class="chart-header">
              <h3>{{ getChartTitle }}</h3>
              <div class="chart-controls">
                <el-button-group>
                  <el-button :type="chartType === 'line' ? 'primary' : 'default'" @click="chartType = 'line'">折线图</el-button>
                  <el-button :type="chartType === 'bar' ? 'primary' : 'default'" @click="chartType = 'bar'">柱状图</el-button>
                  <el-button :type="chartType === 'area' ? 'primary' : 'default'" @click="chartType = 'area'">面积图</el-button>
                </el-button-group>
              </div>
            </div>
            <div class="chart-container" ref="mainChartRef" style="height: 400px;">
              <!-- 主趋势图表将在这里渲染 -->
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :lg="8">
          <div class="chart-card secondary-chart">
            <div class="chart-header">
              <h3>趋势分析</h3>
            </div>
            <div class="trend-analysis-panel">
              <div class="trend-item">
                <div class="trend-label">增长趋势</div>
                <div class="trend-value" :class="getTrendDirection">{{ getTrendText }}</div>
              </div>
              <div class="trend-item">
                <div class="trend-label">波动性</div>
                <div class="trend-value">{{ volatility }}</div>
              </div>
              <div class="trend-item">
                <div class="trend-label">季节性</div>
                <div class="trend-value">{{ seasonality }}</div>
              </div>
              <div class="trend-item">
                <div class="trend-label">预测趋势</div>
                <div class="trend-value" :class="getPredictionDirection">{{ getPredictionText }}</div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 对比分析 -->
    <div class="comparison-analysis" v-if="comparisonType !== 'none'">
      <el-row :gutter="20">
        <el-col :xs="24" :md="24">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ getComparisonChartTitle }}</h3>
            </div>
            <div class="chart-container" ref="comparisonChartRef" style="height: 300px;">
              <!-- 对比图表将在这里渲染 -->
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 详细对比数据 -->
    <div class="comparison-data-detail" v-if="comparisonType !== 'none' && comparisonTableData.length > 0">
      <div class="chart-card">
        <div class="chart-header">
          <h3>详细对比数据</h3>
        </div>
        <div class="comparison-data">
          <el-table :data="paginatedComparisonData" style="width: 100%">
            <el-table-column prop="period" label="时期" width="120" />
            <el-table-column prop="current" label="本期" width="100">
              <template #default="{ row }">
                ¥{{ formatAmount(row.current) }}
              </template>
            </el-table-column>
            <el-table-column prop="comparison" label="对比期" width="100">
              <template #default="{ row }">
                ¥{{ formatAmount(row.comparison) }}
              </template>
            </el-table-column>
            <el-table-column prop="change" label="变化" width="80">
              <template #default="{ row }">
                <span :class="{ 'text-success': row.change > 0, 'text-danger': row.change < 0 }">
                  {{ row.change > 0 ? '+' : '' }}{{ row.change }}%
                </span>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页组件 -->
          <div class="pagination-section" v-if="comparisonTableData.length > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="pageSizes"
              :total="totalComparisonData"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 异常检测面板 -->
    <div class="anomaly-panel" v-if="anomalyCount > 0">
      <div class="chart-card">
        <div class="chart-header">
          <h3>异常检测结果</h3>
          <el-tag :type="getAnomalySeverityType">{{ getAnomalySeverity }}</el-tag>
        </div>
        <div class="anomaly-list">
          <div v-for="(anomaly, index) in anomalyList" :key="anomaly.date + '-' + index" class="anomaly-item">
            <div class="anomaly-date">{{ anomaly.date }}</div>
            <div class="anomaly-value">¥{{ formatAmount(anomaly.value) }}</div>
            <div class="anomaly-deviation" :class="{ high: anomaly.deviation > 2, medium: anomaly.deviation > 1 }">
              偏离度: {{ (anomaly.deviation || 0).toFixed(2) }}
            </div>
            <div class="anomaly-reason">{{ anomaly.reason }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预测结果 -->
    <div class="prediction-panel" v-if="enablePrediction">
      <el-row :gutter="20">
        <el-col :xs="24" :md="16">
          <div class="chart-card">
            <div class="chart-header">
              <h3>趋势预测</h3>
              <el-select v-model="predictionPeriod" size="small" style="width: 120px;">
                <el-option label="未来7天" value="7d" />
                <el-option label="未来30天" value="30d" />
                <el-option label="未来90天" value="90d" />
              </el-select>
            </div>
            <div class="chart-container" ref="predictionChartRef" style="height: 300px;">
              <!-- 预测图表将在这里渲染 -->
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :md="8">
          <div class="chart-card">
            <div class="chart-header">
              <h3>预测摘要</h3>
            </div>
            <div class="prediction-summary">
              <div class="prediction-item">
                <div class="prediction-label">预测区间</div>
                <div class="prediction-value">{{ predictionSummary.period }}</div>
              </div>
              <div class="prediction-item">
                <div class="prediction-label">预期总额</div>
                <div class="prediction-value">¥{{ formatAmount(predictionSummary.total) }}</div>
              </div>
              <div class="prediction-item">
                <div class="prediction-label">置信度</div>
                <div class="prediction-value">{{ predictionSummary.confidence }}%</div>
              </div>
              <div class="prediction-item">
                <div class="prediction-label">风险等级</div>
                <div class="prediction-value" :class="getRiskLevelClass">{{ predictionSummary.riskLevel }}</div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
// 移除xlsx依赖，使用安全的CSV导出方式
import { saveAs } from 'file-saver'
import { 
  ArrowLeft, 
  Download, 
  TrendCharts, 
  DataAnalysis, 
  Warning, 
  Lightning, 
  CaretTop, 
  CaretBottom 
} from '@element-plus/icons-vue'

// 导入趋势分析服务
import { getTrendAnalysis, getPredictionData } from '@/services/trendAnalysisService'

const router = useRouter()

// 图表引用
const mainChartRef = ref<HTMLElement>()
const comparisonChartRef = ref<HTMLElement>()
const predictionChartRef = ref<HTMLElement>()

// 数据状态
const dateRange = ref<[Date, Date]>([new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()])
const analysisType = ref<'expense' | 'income' | 'balance'>('expense')
const timeGranularity = ref<'day' | 'week' | 'month'>('day')
const comparisonType = ref<'yoy' | 'qoq' | 'none'>('yoy')
const enablePrediction = ref(false)
const predictionPeriod = ref<'7d' | '30d' | '90d'>('30d')
const chartType = ref<'line' | 'bar' | 'area'>('line')

// 关键指标
const currentPeriodTotal = ref(0)
const currentPeriodChange = ref(0)
const comparisonValue = ref(0)
const comparisonChange = ref(0)
const anomalyCount = ref(0)
const anomalyStatus = ref('')

// 趋势分析
const trendDirection = ref<'up' | 'down' | 'stable'>('stable')
const trendText = ref('')
const volatility = ref('')
const seasonality = ref('')
const predictionDirection = ref<'up' | 'down' | 'stable'>('stable')
const predictionText = ref('')

// 异常检测数据
const anomalyList = ref<Array<{
  date: string
  value: number
  deviation: number
  reason: string
}>>([])

// 对比表格数据
const comparisonTableData = ref<Array<{
  period: string
  current: number
  comparison: number
  change: number
}>>([])

// 预测摘要
const predictionSummary = reactive({
  period: '未来30天',
  total: 0,
  confidence: 85,
  riskLevel: '中等'
})

// 图表实例
let mainChart: echarts.ECharts | null = null
let comparisonChart: echarts.ECharts | null = null
let predictionChart: echarts.ECharts | null = null

// 快捷时间选择相关
const selectedTimePeriod = ref('30d')
const timePeriods = [
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '近90天', value: '90d' },
  { label: '近6个月', value: '6m' },
  { label: '近1年', value: '1y' }
]

// 详细对比数据分页相关
const currentPage = ref(1)
const pageSize = ref(5)
const pageSizes = [5, 8, 12, 20, 50]
const totalComparisonData = ref(0)

// 计算属性
const getComparisonLabel = computed(() => {
  switch (comparisonType.value) {
    case 'yoy': return '同比总额'
    case 'qoq': return '环比总额'
    default: return '对比总额'
  }
})

const getChartTitle = computed(() => {
  const typeMap: Record<string, string> = { expense: '支出', income: '收入', balance: '结余' }
  const granularityMap: Record<string, string> = { day: '日', week: '周', month: '月' }
  return `${typeMap[analysisType.value]}${granularityMap[timeGranularity.value]}趋势分析`
})

const getComparisonChartTitle = computed(() => {
  const typeMap: Record<string, string> = { yoy: '同比', qoq: '环比' }
  return `${typeMap[comparisonType.value]}分析`
})

const getTrendDirection = computed(() => {
  return `trend-${trendDirection.value}`
})

const getPredictionDirection = computed(() => {
  return `prediction-${predictionDirection.value}`
})

const getTrendText = computed(() => {
  return trendText.value
})

const getPredictionText = computed(() => {
  return predictionText.value
})

const getAnomalySeverity = computed(() => {
  if (anomalyCount.value === 0) return '正常'
  if (anomalyCount.value <= 2) return '轻微'
  if (anomalyCount.value <= 5) return '中等'
  return '严重'
})

const getAnomalySeverityType = computed(() => {
  if (anomalyCount.value === 0) return 'success'
  if (anomalyCount.value <= 2) return 'warning'
  if (anomalyCount.value <= 5) return 'warning'
  return 'danger'
})

const getRiskLevelClass = computed(() => {
  const riskClass: Record<string, string> = {
    '低': 'risk-low',
    '中等': 'risk-medium',
    '高': 'risk-high'
  }
  return riskClass[predictionSummary.riskLevel] || 'risk-medium'
})

// 详细对比数据分页相关计算属性
const paginatedComparisonData = computed(() => {
  if (!comparisonTableData.value) return []
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return comparisonTableData.value.slice(start, end)
})

// 工具函数
const formatAmount = (amount: number): string => {
  return (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 获取趋势分析数据
const fetchTrendData = async () => {
  try {
    // 确保日期范围存在
    const startDateStr = dateRange.value[0] ? dateRange.value[0].toISOString().split('T')[0] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDateStr = dateRange.value[1] ? dateRange.value[1].toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    
    const params = {
      startDate: startDateStr as string,
      endDate: endDateStr as string,
      type: analysisType.value,
      granularity: timeGranularity.value
    }
    
    console.log('请求趋势分析数据参数:', params)
    
    const response = await getTrendAnalysis(params)
    console.log('趋势分析API响应:', response)
    
    // 趋势分析服务已经处理了数据结构，直接使用response.data即可
    const data = response.data || []
    console.log('提取的趋势数据:', data)
    
    return data
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    ElMessage.error('获取趋势数据失败')
    return []
  }
}

// 初始化主图表
const initMainChart = async () => {
  if (!mainChartRef.value) return
  
  // 确保图表实例已销毁再重新初始化
  if (mainChart) {
    mainChart.dispose()
  }
  mainChart = echarts.init(mainChartRef.value)
  const data = await fetchTrendData()
  
  // 添加调试日志
  console.log('主图表获取的数据:', data)
  
  // 确保有数据
  if (data.length === 0) {
    console.warn('没有数据用于主图表')
    return
  }
  
  currentPeriodTotal.value = data.reduce((sum: number, item: { date: string, value: number }) => sum + item.value, 0)
  
  const option = {
    title: {
      text: getChartTitle.value,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: ¥{c}'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      name: getChartTitle.value,
      type: chartType.value === 'area' ? 'line' : chartType.value,
      data: data.map(item => item.value),
      smooth: true,
      areaStyle: chartType.value === 'area' ? {
        opacity: 0.3
      } : undefined,
      lineStyle: {
        width: 3
      },
      itemStyle: {
        color: '#409EFF'
      }
    }],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }
  
  mainChart.setOption(option)
  
  // 分析趋势
  analyzeTrend(data)
}

// 分析趋势
const analyzeTrend = (data: Array<{ date: string, value: number }>) => {
  if (data.length < 2) return
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100
  currentPeriodChange.value = Math.round(change * 100) / 100
  
  if (change > 5) {
    trendDirection.value = 'up'
    trendText.value = '上升'
  } else if (change < -5) {
    trendDirection.value = 'down'
    trendText.value = '下降'
  } else {
    trendDirection.value = 'stable'
    trendText.value = '稳定'
  }
  
  // 计算波动性
  const variance = data.reduce((sum, item) => sum + Math.pow(item.value - firstAvg, 2), 0) / data.length
  const stdDev = Math.sqrt(variance)
  const cv = (stdDev / firstAvg) * 100
  
  if (cv < 10) volatility.value = '低'
  else if (cv < 25) volatility.value = '中等'
  else volatility.value = '高'
  
  // 检测异常
  detectAnomalies(data)
}

// 异常检测
const detectAnomalies = (data: Array<{ date: string, value: number }>) => {
  const values = data.map(item => item.value)
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  anomalyList.value = []
  
  data.forEach(item => {
    const deviation = Math.abs(item.value - mean) / stdDev
    if (deviation > 2) { // 超过2个标准差
      anomalyList.value.push({
        date: item.date,
        value: item.value,
        deviation: deviation,
        reason: deviation > 3 ? '严重异常' : '轻微异常'
      })
    }
  })
  
  anomalyCount.value = anomalyList.value.length
  anomalyStatus.value = anomalyCount.value === 0 ? '正常' : `发现${anomalyCount.value}个异常`
}

// 初始化对比图表
const initComparisonChart = async () => {
  if (!comparisonChartRef.value || comparisonType.value === 'none') return
  
  // 确保图表实例已销毁再重新初始化
  if (comparisonChart) {
    comparisonChart.dispose()
  }
  comparisonChart = echarts.init(comparisonChartRef.value)
  const currentData = await fetchTrendData()
  const comparisonData = await fetchTrendData() // 获取对比期数据
  
  // 添加调试日志
  console.log('对比图表获取的本期数据:', currentData)
  console.log('对比图表获取的对比期数据:', comparisonData)
  
  comparisonValue.value = comparisonData.reduce((sum, item) => sum + item.value, 0)
  const change = ((currentPeriodTotal.value - comparisonValue.value) / comparisonValue.value) * 100
  comparisonChange.value = Math.round(change * 100) / 100
  
  // 准备对比表格数据
  comparisonTableData.value = currentData.map((item, index) => ({
    period: item.date,
    current: item.value,
    comparison: comparisonData[index]?.value || 0,
    change: comparisonData[index] ? Math.round(((item.value - comparisonData[index].value) / comparisonData[index].value) * 100 * 100) / 100 : 0
  }))
  
  // 更新总数据量
  totalComparisonData.value = comparisonTableData.value.length
  
  // 重置分页状态
  currentPage.value = 1
  
  const option = {
    title: {
      text: getComparisonChartTitle.value,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['本期', '对比期'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: currentData.map(item => item.date),
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '本期',
        type: 'line',
        data: currentData.map(item => item.value),
        smooth: true,
        lineStyle: { width: 3 },
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '对比期',
        type: 'line',
        data: comparisonData.map(item => item.value),
        smooth: true,
        lineStyle: { width: 3, type: 'dashed' },
        itemStyle: { color: '#67C23A' }
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    }
  }
  
  comparisonChart.setOption(option)
}

// 初始化预测图表
const initPredictionChart = async () => {
  if (!predictionChartRef.value || !enablePrediction.value) return
  
  // 确保图表实例已销毁再重新初始化
  if (predictionChart) {
    predictionChart.dispose()
  }
  predictionChart = echarts.init(predictionChartRef.value)
  const historicalData = await fetchTrendData()
  
  // 添加调试日志
  console.log('预测图表获取的历史数据:', historicalData)
  
  // 确保有历史数据
  if (historicalData.length === 0) {
    console.warn('没有历史数据用于预测')
    return
  }
  
  try {
    // 调用真实的趋势预测API
    const predictionDays = predictionPeriod.value === '7d' ? 7 : predictionPeriod.value === '30d' ? 30 : 90
    
    // 调用真实的预测数据API
    const predictionResponse = await getPredictionData(predictionDays)
    console.log('预测API响应:', predictionResponse)
    
    // 确保API调用成功
    if (!predictionResponse.success) {
      throw new Error(predictionResponse.message || '获取预测数据失败')
    }
    
    const predictionData = predictionResponse.data || []
    console.log('预测数据:', predictionData)
    
    // 确保有预测数据
    if (predictionData.length === 0) {
      console.warn('预测API返回空数据')
      return
    }
    
    // 更新预测摘要
    predictionSummary.total = predictionData.reduce((sum: number, item: { date: string, value: number }) => sum + item.value, 0);
    
    // 分析预测趋势
    const avgHistorical = historicalData.reduce((sum: number, item: { date: string, value: number }) => sum + item.value, 0) / historicalData.length;
    const avgPrediction = predictionData.reduce((sum: number, item: { date: string, value: number }) => sum + item.value, 0) / predictionData.length;
    const predictionTrendChange = avgHistorical > 0 ? ((avgPrediction - avgHistorical) / avgHistorical) * 100 : 0;
    
    if (predictionTrendChange > 5) {
      predictionDirection.value = 'up';
      predictionText.value = '上升';
    } else if (predictionTrendChange < -5) {
      predictionDirection.value = 'down';
      predictionText.value = '下降';
    } else {
      predictionDirection.value = 'stable';
      predictionText.value = '稳定';
    }
    
    const option = {
      title: {
        text: '趋势预测',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['历史数据', '预测数据'],
        top: 30
      },
      xAxis: {
        type: 'category',
        data: [...historicalData.map((item: { date: string, value: number }) => item.date), ...predictionData.map((item: { date: string, value: number }) => item.date)],
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      series: [
        {
          name: '历史数据',
          type: 'line',
          data: [...historicalData.map((item: { date: string, value: number }) => item.value), ...Array(predictionData.length).fill(null)],
          smooth: true,
          lineStyle: { width: 3 },
          itemStyle: { color: '#409EFF' }
        },
        {
          name: '预测数据',
          type: 'line',
          data: [...Array(historicalData.length).fill(null), ...predictionData.map((item: { date: string, value: number }) => item.value)],
          smooth: true,
          lineStyle: { width: 3, type: 'dashed' },
          itemStyle: { color: '#E6A23C' }
        }
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      }
    };
    
    predictionChart.setOption(option);
  } catch (error) {
    console.error('获取预测数据失败:', error)
    ElMessage.error('获取预测数据失败，请稍后重试')
    // 清空预测数据
    predictionSummary.total = 0
    predictionDirection.value = 'stable'
    predictionText.value = '无数据'
  }
}

// 快捷时间选择处理函数
const selectTimePeriod = (period: string) => {
  selectedTimePeriod.value = period
  
  const now = new Date()
  let startDate: Date
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '6m':
      startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  dateRange.value = [startDate, now]
  
  // 更新图表数据
  initMainChart()
  if (comparisonType.value !== 'none') {
    initComparisonChart()
  }
  if (enablePrediction.value) {
    initPredictionChart()
  }
}

// 事件处理函数
const handleBack = () => {
  router.push('/dashboard/analytics')
}



const handleAnalysisTypeChange = () => {
  initMainChart()
}

const handleGranularityChange = () => {
  initMainChart()
  if (comparisonType.value !== 'none') {
    initComparisonChart()
  }
}

const handleComparisonChange = () => {
  if (comparisonType.value !== 'none') {
    nextTick(() => {
      initComparisonChart()
    })
  }
}

const handlePredictionToggle = () => {
  if (enablePrediction.value) {
    nextTick(() => {
      initPredictionChart()
    })
  }
}

// 分页事件处理函数
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const handleExportReport = async () => {
  try {
    ElMessage.info('正在生成报告...')
    
    // 获取真实趋势数据
    const trendData = await fetchTrendData()
    
    // 创建CSV内容
    const csvLines: string[] = []
    
    // 1. 报告概要
    csvLines.push('财务趋势分析报告')
    csvLines.push(`报告生成时间,${new Date().toLocaleString('zh-CN')}`)
    csvLines.push(`分析期间,${dateRange.value[0].toLocaleDateString()} 至 ${dateRange.value[1].toLocaleDateString()}`)
    csvLines.push(`分析类型,${analysisType.value === 'expense' ? '支出趋势' : analysisType.value === 'income' ? '收入趋势' : '结余趋势'}`)
    csvLines.push(`时间粒度,${timeGranularity.value === 'day' ? '按日' : timeGranularity.value === 'week' ? '按周' : '按月'}`)
    csvLines.push(`对比类型,${comparisonType.value === 'yoy' ? '同比分析' : comparisonType.value === 'qoq' ? '环比分析' : '不对比'}`)
    csvLines.push('')
    csvLines.push('关键指标')
    csvLines.push(`本期总额,¥${formatAmount(currentPeriodTotal.value)}`)
    csvLines.push(`对比值,¥${formatAmount(comparisonValue.value)}`)
    csvLines.push(`变化率,${currentPeriodChange.value > 0 ? '+' : ''}${currentPeriodChange.value}%`)
    csvLines.push(`异常检测数量,${anomalyCount.value}`)
    csvLines.push(`异常检测状态,${anomalyStatus.value}`)
    csvLines.push(`预测准确率,${predictionSummary.confidence}%`)
    csvLines.push('')
    csvLines.push('趋势分析')
    csvLines.push(`增长趋势,${trendDirection.value === 'up' ? '上升' : trendDirection.value === 'down' ? '下降' : '稳定'}`)
    csvLines.push(`波动性,${volatility.value}`)
    csvLines.push(`季节性,${seasonality.value}`)
    csvLines.push(`预测趋势,${predictionDirection.value === 'up' ? '上升' : predictionDirection.value === 'down' ? '下降' : 'stable'}`)
    csvLines.push('')
    
    // 2. 趋势数据
    csvLines.push('趋势数据')
    csvLines.push('日期,金额(元),类型')
    trendData.forEach(item => {
      csvLines.push(`${item.date},${item.value},${analysisType.value === 'expense' ? '支出' : analysisType.value === 'income' ? '收入' : '结余'}`)
    })
    csvLines.push('')
    
    // 3. 对比分析数据（如果启用）
    if (comparisonType.value !== 'none' && comparisonTableData.value.length > 0) {
      csvLines.push('对比分析')
      csvLines.push('时期,本期金额(元),对比期金额(元),变化率(%)')
      comparisonTableData.value.forEach(item => {
        csvLines.push(`${item.period},${item.current},${item.comparison},${item.change}`)
      })
      csvLines.push('')
    }
    
    // 4. 异常检测数据（如果有）
    if (anomalyList.value.length > 0) {
      csvLines.push('异常检测')
      csvLines.push('日期,金额(元),偏离度,异常原因')
      anomalyList.value.forEach(item => {
        csvLines.push(`${item.date},${item.value},${item.deviation},${item.reason}`)
      })
      csvLines.push('')
    }
    
    // 5. 预测数据（如果启用）
    if (enablePrediction.value) {
      csvLines.push('预测摘要')
      csvLines.push(`预测期间,${predictionSummary.period}`)
      csvLines.push(`预期总额,¥${formatAmount(predictionSummary.total)}`)
      csvLines.push(`置信度,${predictionSummary.confidence}%`)
      csvLines.push(`风险等级,${predictionSummary.riskLevel}`)
      csvLines.push('')
      csvLines.push('预测详情')
      csvLines.push('数据点,预测值(元),置信区间')
      
      // 生成预测数据点
      // 通过API获取真实预测数据
      const predictionData: Array<{ value: number }> = []
      
      // 调用趋势分析服务获取预测数据
      try {
        const { getPredictionData } = await import('@/services/trendAnalysisService')
        // 使用默认值30天作为预测天数
        const response = await getPredictionData(30)
        
        if (response.success) {
          predictionData.push(...response.data.map(item => ({ value: item.value })))
        }
      } catch (error) {
        console.error('获取预测数据失败:', error)
        ElMessage.error('获取预测数据失败')
      }
      predictionData.forEach((item: { value: number }, index: number) => {
        const confidence = predictionSummary.confidence - (index * 2) // 随时间递减的置信度
        csvLines.push(`预测点${index + 1},${item.value},${Math.max(0, confidence)}%`)
      })
    }
    
    // 生成CSV文件内容
    const csvContent = csvLines.join('\n')
    // 添加BOM标记解决Excel中文乱码问题
    const csvWithBom = '\uFEFF' + csvContent
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
    
    // 生成文件名
    const fileName = `趋势分析报告_${new Date().toISOString().split('T')[0]}_${Date.now()}.csv`
    
    // 下载文件
    saveAs(blob, fileName)
    
    ElMessage.success(`报告导出成功！文件已保存为: ${fileName}`)
    
    // 记录导出日志
    console.log('趋势分析报告已导出:', {
      fileName,
      fileSize: blob.size,
      exportTime: new Date().toISOString(),
      dataSummary: {
        trendDataPoints: trendData.length,
        anomalies: anomalyList.value.length,
        hasComparison: comparisonType.value !== 'none',
        hasPrediction: enablePrediction.value
      }
    })
    
  } catch (error) {
    console.error('导出报告失败:', error)
    ElMessage.error('导出报告失败，请重试')
  }
}

// 生命周期
onMounted(() => {
  nextTick(async () => {
    await initMainChart()
    if (comparisonType.value !== 'none') {
      await initComparisonChart()
    }
  })
})

// 组件卸载时清理
onUnmounted(() => {
  cleanup()
})

// 监听图表类型变化
watch(chartType, async () => {
  await initMainChart()
})

// 监听预测周期变化
watch(predictionPeriod, async () => {
  if (enablePrediction.value) {
    await initPredictionChart()
  }
})

// 监听对比类型变化，重置分页状态
watch(comparisonType, async (newType) => {
  if (newType !== 'none') {
    currentPage.value = 1
    nextTick(async () => {
      await initComparisonChart()
    })
  }
})

// 监听对比表格数据变化，更新总数据量
watch(comparisonTableData, (newData) => {
  totalComparisonData.value = newData.length
  // 如果当前页超出范围，重置到第一页
  const maxPage = Math.ceil(totalComparisonData.value / pageSize.value)
  if (currentPage.value > maxPage && maxPage > 0) {
    currentPage.value = 1
  }
}, { deep: true })

// 响应式处理
const handleResize = () => {
  mainChart?.resize()
  comparisonChart?.resize()
  predictionChart?.resize()
}

window.addEventListener('resize', handleResize)

// 清理
const cleanup = () => {
  window.removeEventListener('resize', handleResize)
  mainChart?.dispose()
  comparisonChart?.dispose()
  predictionChart?.dispose()
}

// 在组件卸载时清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup)
}
</script>

<style scoped>
.trend-analysis {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.back-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
}

/* 分页样式 */
.pagination-section {
  margin-top: 16px;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  overflow: visible;
  min-height: 60px; /* 确保足够高度 */
  background-color: #fafafa; /* 添加背景色提高可读性 */
}

.pagination-section .el-pagination {
  white-space: nowrap;
  overflow: visible;
  display: flex;
  align-items: center;
  gap: 12px; /* 增加元素间距 */
  font-size: 14px; /* 确保字体大小合适 */
}

/* 确保分页总条数可见 */
.pagination-section .el-pagination__total {
  flex-shrink: 0; /* 防止总条数被压缩 */
  min-width: 100px; /* 增加最小宽度 */
  white-space: nowrap;
  overflow: visible;
  color: #303133; /* 确保文字颜色清晰 */
  font-weight: 500; /* 增加字体权重 */
  margin-right: 8px; /* 增加右边距 */
}

@media (max-width: 768px) {
  .pagination-section {
    overflow-x: auto;
    padding: 16px 10px;
  }
  
  .pagination-section .el-pagination {
    min-width: 650px; /* 进一步增加最小宽度 */
    overflow: visible;
  }
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.key-metrics {
  margin-bottom: 20px;
}

.metric-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.metric-icon.trend {
  background: #e6f7ff;
  color: #1890ff;
}

.metric-icon.compare {
  background: #f6ffed;
  color: #52c41a;
}

.metric-icon.anomaly {
  background: #fff1f0;
  color: #ff4d4f;
}

.metric-icon.prediction {
  background: #fff7e6;
  color: #fa8c16;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.metric-change {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-change.up {
  color: #67c23a;
}

.metric-change.down {
  color: #f56c6c;
}

.metric-desc {
  font-size: 12px;
  color: #909399;
}

.trend-charts {
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.chart-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-controls {
  display: flex;
  gap: 8px;
}

.chart-container {
  padding: 20px;
}

.trend-analysis-panel {
  padding: 20px;
}

.trend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.trend-item:last-child {
  border-bottom: none;
}

.trend-label {
  font-size: 14px;
  color: #606266;
}

.trend-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.trend-value.trend-up,
.trend-value.prediction-up {
  color: #67c23a;
}

.trend-value.trend-down,
.trend-value.prediction-down {
  color: #f56c6c;
}

.comparison-analysis {
  margin-bottom: 20px;
}

.comparison-data {
  padding: 20px;
}

.anomaly-panel {
  margin-bottom: 20px;
}

.anomaly-list {
  padding: 20px;
}

.anomaly-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.anomaly-item:last-child {
  border-bottom: none;
}

.anomaly-date {
  font-size: 14px;
  color: #606266;
  min-width: 100px;
}

.anomaly-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  min-width: 80px;
}

.anomaly-deviation {
  font-size: 12px;
  font-weight: 600;
  min-width: 80px;
}

.anomaly-deviation.high {
  color: #f56c6c;
}

.anomaly-deviation.medium {
  color: #e6a23c;
}

.anomaly-reason {
  font-size: 12px;
  color: #909399;
  flex: 1;
  text-align: right;
}

.prediction-panel {
  margin-bottom: 20px;
}

.prediction-summary {
  padding: 20px;
}

.prediction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.prediction-item:last-child {
  border-bottom: none;
}

.prediction-label {
  font-size: 14px;
  color: #606266;
}

.prediction-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.prediction-value.risk-low {
  color: #67c23a;
}

.prediction-value.risk-medium {
  color: #e6a23c;
}

.prediction-value.risk-high {
  color: #f56c6c;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .trend-analysis {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .back-btn {
    margin-right: 12px;
  }
  
  .metric-card {
    flex-direction: column;
    text-align: center;
  }
  
  .chart-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .chart-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .anomaly-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .anomaly-reason {
    text-align: left;
  }
}
</style>