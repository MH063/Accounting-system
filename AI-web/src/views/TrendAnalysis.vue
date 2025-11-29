<template>
  <div class="trend-analysis">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="handleBack" text />
        <h1 class="page-title">趋势分析</h1>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="default"
          @change="handleDateRangeChange"
        />
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
              <div class="metric-value">{{ predictionAccuracy }}%</div>
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
        <el-col :xs="24" :md="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ getComparisonChartTitle }}</h3>
            </div>
            <div class="chart-container" ref="comparisonChartRef" style="height: 300px;">
              <!-- 对比图表将在这里渲染 -->
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>详细对比数据</h3>
            </div>
            <div class="comparison-data">
              <el-table :data="comparisonTableData" style="width: 100%">
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
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 异常检测面板 -->
    <div class="anomaly-panel" v-if="anomalyCount > 0">
      <div class="chart-card">
        <div class="chart-header">
          <h3>异常检测结果</h3>
          <el-tag :type="getAnomalySeverityType">{{ getAnomalySeverity }}</el-tag>
        </div>
        <div class="anomaly-list">
          <div v-for="(anomaly, index) in anomalyList" :key="index" class="anomaly-item">
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

const router = useRouter()
const loading = ref(false)

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
const anomalyStatus = ref('正常')
const predictionAccuracy = ref(85)

// 趋势分析
const trendDirection = ref<'up' | 'down' | 'stable'>('stable')
const trendText = ref('稳定')
const volatility = ref('中等')
const seasonality = ref('明显')
const predictionDirection = ref<'up' | 'down' | 'stable'>('stable')
const predictionText = ref('稳定')

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

// 计算属性
const getComparisonLabel = computed(() => {
  switch (comparisonType.value) {
    case 'yoy': return '同比总额'
    case 'qoq': return '环比总额'
    default: return '对比总额'
  }
})

const getChartTitle = computed(() => {
  const typeMap = { expense: '支出', income: '收入', balance: '结余' }
  const granularityMap = { day: '日', week: '周', month: '月' }
  return `${typeMap[analysisType.value]}${granularityMap[timeGranularity.value]}趋势分析`
})

const getComparisonChartTitle = computed(() => {
  const typeMap = { yoy: '同比', qoq: '环比' }
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
  const riskClass = {
    '低': 'risk-low',
    '中等': 'risk-medium',
    '高': 'risk-high'
  }
  return riskClass[predictionSummary.riskLevel] || 'risk-medium'
})

// 工具函数
const formatAmount = (amount: number): string => {
  return (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 生成模拟数据
const generateMockData = () => {
  const data = []
  const startDate = dateRange.value[0]
  const endDate = dateRange.value[1]
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    // 模拟趋势数据，包含季节性波动
    const baseValue = 1000 + Math.sin(i * 0.1) * 200 // 基础趋势
    const seasonal = Math.sin(i * 0.02) * 300 // 季节性
    const random = (Math.random() - 0.5) * 400 // 随机波动
    const weekend = [0, 6].includes(date.getDay()) ? -200 : 0 // 周末效应
    
    const value = Math.max(0, baseValue + seasonal + random + weekend)
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value)
    })
  }
  
  return data
}

// 初始化主图表
const initMainChart = () => {
  if (!mainChartRef.value) return
  
  mainChart = echarts.init(mainChartRef.value)
  const data = generateMockData()
  
  currentPeriodTotal.value = data.reduce((sum, item) => sum + item.value, 0)
  
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
const initComparisonChart = () => {
  if (!comparisonChartRef.value || comparisonType.value === 'none') return
  
  comparisonChart = echarts.init(comparisonChartRef.value)
  const currentData = generateMockData()
  const comparisonData = generateMockData() // 模拟对比数据
  
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
const initPredictionChart = () => {
  if (!predictionChartRef.value || !enablePrediction.value) return
  
  predictionChart = echarts.init(predictionChartRef.value)
  const historicalData = generateMockData()
  
  // 生成预测数据
  const predictionDays = predictionPeriod.value === '7d' ? 7 : predictionPeriod.value === '30d' ? 30 : 90
  const lastDate = new Date(historicalData[historicalData.length - 1].date)
  const predictionData = []
  
  for (let i = 1; i <= predictionDays; i++) {
    const date = new Date(lastDate)
    date.setDate(date.getDate() + i)
    
    // 基于历史趋势生成预测数据
    const trend = historicalData.length > 1 ? 
      (historicalData[historicalData.length - 1].value - historicalData[0].value) / historicalData.length : 0
    
    const lastValue = historicalData[historicalData.length - 1].value
    const predictedValue = Math.max(0, lastValue + trend * i + (Math.random() - 0.5) * 200)
    
    predictionData.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(predictedValue)
    })
  }
  
  predictionSummary.total = predictionData.reduce((sum, item) => sum + item.value, 0)
  
  // 分析预测趋势
  const avgHistorical = historicalData.reduce((sum, item) => sum + item.value, 0) / historicalData.length
  const avgPrediction = predictionData.reduce((sum, item) => sum + item.value, 0) / predictionData.length
  const predictionTrendChange = ((avgPrediction - avgHistorical) / avgHistorical) * 100
  
  if (predictionTrendChange > 5) {
    predictionDirection.value = 'up'
    predictionText.value = '上升'
  } else if (predictionTrendChange < -5) {
    predictionDirection.value = 'down'
    predictionText.value = '下降'
  } else {
    predictionDirection.value = 'stable'
    predictionText.value = '稳定'
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
      data: [...historicalData.map(item => item.date), ...predictionData.map(item => item.date)],
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
        name: '历史数据',
        type: 'line',
        data: [...historicalData.map(item => item.value), ...Array(predictionDays).fill(null)],
        smooth: true,
        lineStyle: { width: 3 },
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '预测数据',
        type: 'line',
        data: [...Array(historicalData.length).fill(null), ...predictionData.map(item => item.value)],
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
  }
  
  predictionChart.setOption(option)
}

// 事件处理函数
const handleBack = () => {
  router.push('/dashboard')
}

const handleDateRangeChange = () => {
  initMainChart()
  if (comparisonType.value !== 'none') {
    initComparisonChart()
  }
  if (enablePrediction.value) {
    initPredictionChart()
  }
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

const handleExportReport = () => {
  // 生成趋势分析报告
  const reportData = {
    title: '财务趋势分析报告',
    dateRange: `${dateRange.value[0].toLocaleDateString()} 至 ${dateRange.value[1].toLocaleDateString()}`,
    analysisType: analysisType.value,
    currentPeriodTotal: currentPeriodTotal.value,
    currentPeriodChange: currentPeriodChange.value,
    trendDirection: trendDirection.value,
    volatility: volatility.value,
    anomalyCount: anomalyCount.value,
    predictionAccuracy: predictionAccuracy.value
  }
  
  ElMessage.success('趋势分析报告已生成')
  console.log('趋势分析报告:', reportData)
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initMainChart()
    if (comparisonType.value !== 'none') {
      initComparisonChart()
    }
  })
})

// 组件卸载时清理
onUnmounted(() => {
  cleanup()
})

// 监听图表类型变化
watch(chartType, () => {
  initMainChart()
})

// 监听预测周期变化
watch(predictionPeriod, () => {
  if (enablePrediction.value) {
    initPredictionChart()
  }
})

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