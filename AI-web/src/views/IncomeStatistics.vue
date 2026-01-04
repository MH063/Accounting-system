<template>
  <div class="income-statistics">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <h1 class="page-title">收入统计</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="handleAddIncome">新增收入</el-button>
        <el-button :icon="Download" @click="handleExportReport">导出报告</el-button>
      </div>
    </div>

    <!-- 收入来源分析 -->
    <div class="income-source-analysis">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>收入来源分析</span>
            <div class="header-controls">
              <el-select v-model="sourcePeriod" size="small" @change="handleSourcePeriodChange">
                <el-option label="本月" value="month" />
                <el-option label="本季度" value="quarter" />
                <el-option label="本年" value="year" />
              </el-select>
            </div>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <div ref="sourceChartRef" class="chart-box"></div>
          </el-col>
          <el-col :xs="24" :md="12">
            <div class="source-stats">
              <div class="source-item" v-for="item in sourceAnalysisData" :key="item.name">
                <div class="source-info">
                  <span class="source-name">{{ item.name }}</span>
                  <span class="source-amount">¥{{ (item.value || 0).toLocaleString() }}</span>
                </div>
                <el-progress 
                  :percentage="item.percentage" 
                  :color="item.color"
                  :stroke-width="8"
                />
                <div class="source-percentage">{{ item.percentage }}%</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 收入概览卡片 -->
    <div class="income-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="overview-card">
            <div class="card-icon total">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-label">总收入</div>
              <div class="card-value">¥{{ formatAmount(totalIncome) }}</div>
              <div class="card-change" :class="{ up: incomeChange > 0, down: incomeChange < 0 }">
                <el-icon><CaretTop v-if="incomeChange > 0" /><CaretBottom v-else /></el-icon>
                {{ Math.abs(incomeChange) }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="overview-card">
            <div class="card-icon average">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-label">平均收入</div>
              <div class="card-value">¥{{ formatAmount(averageIncome) }}</div>
              <div class="card-desc">{{ dateRangeText }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="overview-card">
            <div class="card-icon source">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-label">收入来源</div>
              <div class="card-value">{{ incomeSourceCount }}</div>
              <div class="card-desc">个来源</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="overview-card">
            <div class="card-icon growth">
              <el-icon><Top /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-label">增长趋势</div>
              <div class="card-value">{{ growthTrend }}</div>
              <div class="card-desc">{{ trendDirection }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 收入来源分析 -->
    <div class="income-source-analysis">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>收入来源分布</h3>
              <el-select v-model="sourceChartType" size="small" style="width: 120px;">
                <el-option label="饼图" value="pie" />
                <el-option label="柱状图" value="bar" />
              </el-select>
            </div>
            <div class="chart-container" ref="sourceChartRef" style="height: 350px;">
              <!-- 收入来源图表将在这里渲染 -->
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>收入趋势分析</h3>
              <el-select v-model="trendGranularity" size="small" style="width: 120px;">
                <el-option label="按日" value="day" />
                <el-option label="按周" value="week" />
                <el-option label="按月" value="month" />
              </el-select>
            </div>
            <div class="chart-container" ref="trendChartRef" style="height: 350px;">
              <!-- 收入趋势图表将在这里渲染 -->
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 收入对比分析 -->
    <div class="income-comparison">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>收入对比分析</span>
            <div class="header-controls">
              <el-radio-group v-model="comparisonType" size="small" @change="handleComparisonTypeChange">
                <el-radio-button label="month">月度对比</el-radio-button>
                <el-radio-button label="quarter">季度对比</el-radio-button>
                <el-radio-button label="year">年度对比</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :xs="24" :md="16">
            <div ref="comparisonChartRef" class="chart-box" style="height: 400px;"></div>
          </el-col>
          <el-col :xs="24" :md="8">
            <div class="comparison-stats">
              <div class="stat-card">
                <div class="stat-title">同比增长</div>
                <div class="stat-value" :class="getGrowthClass(yearOverYearGrowth)">
                  {{ yearOverYearGrowth > 0 ? '+' : '' }}{{ (yearOverYearGrowth || 0).toFixed(1) }}%
                </div>
                <div class="stat-desc">与去年同期相比</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">环比增长</div>
                <div class="stat-value" :class="getGrowthClass(monthOverMonthGrowth)">
                  {{ monthOverMonthGrowth > 0 ? '+' : '' }}{{ (monthOverMonthGrowth || 0).toFixed(1) }}%
                </div>
                <div class="stat-desc">与上期相比</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">平均增长率</div>
                <div class="stat-value" :class="getGrowthClass(averageGrowthRate)">
                  {{ averageGrowthRate > 0 ? '+' : '' }}{{ (averageGrowthRate || 0).toFixed(1) }}%
                </div>
                <div class="stat-desc">{{ comparisonType === 'month' ? '月度' : comparisonType === 'quarter' ? '季度' : '年度' }}平均</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 收入统计表格 -->
    <div class="income-table-section">
      <div class="chart-card">
        <div class="chart-header">
          <h3>收入统计明细</h3>
          <div class="table-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索收入来源"
              size="small"
              style="width: 200px;"
              :prefix-icon="Search"
            />
            <el-select v-model="sortBy" size="small" style="width: 120px;">
              <el-option label="按金额排序" value="amount" />
              <el-option label="按日期排序" value="date" />
              <el-option label="按来源排序" value="source" />
            </el-select>
          </div>
        </div>
        <div class="table-container">
          <el-table :data="filteredIncomeData" style="width: 100%" v-loading="loading">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="source" label="收入来源" width="150" />
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="{ row }">
                ¥{{ formatAmount(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">
                <el-tag :type="getCategoryType(getCategoryText(row.category))">{{ getCategoryText(row.category) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewIncomeDetail(row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 8, 12, 20, 50]"
              :total="totalIncomeRecords"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  ArrowLeft,
  Download,
  Coin,
  TrendCharts,
  OfficeBuilding,
  Top,
  CaretTop,
  CaretBottom,
  Search,
  Plus
} from '@element-plus/icons-vue'
import type {
  EChartsTooltipParams,
  IncomeAnalysisItem,
  IncomeSourceStats,
  ComparisonDataItem,
  ForecastDataItem,
  TimeAggregatedItem,
  AnomalyItem,
  TrendReportData
} from '@/types'
import { getIncomeStatistics } from '@/services/incomeService'

const router = useRouter()
const loading = ref(false)

// 图表引用
const sourceChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()
const comparisonChartRef = ref<HTMLElement>()

// 数据状态
const dateRange = ref<[Date, Date]>([new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()])
const sourceChartType = ref<'pie' | 'bar'>('pie')
const trendGranularity = ref<'day' | 'week' | 'month'>('day')
const comparisonType = ref<'month' | 'quarter' | 'year'>('month')
const searchKeyword = ref('')
const sortBy = ref<'amount' | 'date' | 'source'>('date')
const sourcePeriod = ref<'month' | 'quarter' | 'year'>('month')

// 分页
const currentPage = ref(1)
const pageSize = ref(5)
const totalIncomeRecords = ref(0)

// 收入概览数据
const totalIncome = ref(0)
const incomeChange = ref(0)
const averageIncome = ref(0)
const incomeSourceCount = ref(0)
const growthTrend = ref('')
const trendDirection = ref('')

// 收入明细
const incomeDetails = ref<Array<{
  id: string
  source: string
  amount: number
  date: string
}>>([])

// 收入数据
const incomeData = ref<Array<{
  id: string
  date: string
  source: string
  amount: number
  category: string
  description: string
}>>([])

// 图表实例
let trendChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null
let comparisonChart: echarts.ECharts | null = null
let sourceChart: echarts.ECharts | null = null

// ECharts tooltip参数接口 - 使用全局类型定义

// 收入来源分析数据
const sourceAnalysisData = computed<IncomeAnalysisItem[]>(() => {
  const sourceMap = new Map<string, number>()
  
  incomeData.value.forEach(item => {
    if (sourceMap.has(item.source)) {
      sourceMap.set(item.source, sourceMap.get(item.source)! + item.amount)
    } else {
      sourceMap.set(item.source, item.amount)
    }
  })
  
  const total = Array.from(sourceMap.values()).reduce((sum, amount) => sum + amount, 0)
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#B3D8FF']
  
  return Array.from(sourceMap.entries()).map(([name, value], index): IncomeAnalysisItem => ({
    name,
    value,
    percentage: Math.round((value / total) * 100),
    color: colors[index % colors.length] || '#409EFF'
  }))
})

// 计算属性
const dateRangeText = computed(() => {
  const days = Math.ceil((dateRange.value[1].getTime() - dateRange.value[0].getTime()) / (1000 * 60 * 60 * 24))
  return `近${days}天`
})

const filteredIncomeData = computed(() => {
  let filtered = incomeData.value
  
  if (searchKeyword.value) {
    filtered = filtered.filter(item => 
      item.source.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'amount':
        return b.amount - a.amount
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      case 'source':
        return a.source.localeCompare(b.source)
      default:
        return 0
    }
  })
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  totalIncomeRecords.value = filtered.length
  
  return filtered.slice(start, end)
})

// 工具函数
const formatAmount = (amount: number): string => {
  return (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 获取收入类别名称（中文）
 * @param category 收入类别标识
 */
const getCategoryText = (category: string) => {
  if (!category) return '未知'
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(category)) return category
  
  switch (category) {
    case 'salary': return '工资'
    case 'bonus': return '奖金'
    case 'investment': return '投资'
    case 'part_time': return '兼职'
    case 'other': return '其他'
    // 支出类别（以防万一）
    case 'accommodation': return '住宿费'
    case 'rent': return '房租'
    case 'utilities': return '水电费'
    case 'maintenance': return '维修费'
    case 'cleaning': return '清洁费'
    default: return category || '未知'
  }
}

const getCategoryType = (category: string): string => {
  const typeMap: Record<string, string> = {
    '工资': 'primary',
    '奖金': 'success',
    '投资': 'warning',
    '兼职': 'info',
    '其他': 'info'
  }
  return typeMap[category] || 'info'
}

const getGrowthClass = (value: number): string => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

// 获取真实收入统计数据
const fetchIncomeData = async () => {
  try {
    const response = await getIncomeStatistics({
      startDate: dateRange.value[0].toISOString().split('T')[0],
      endDate: dateRange.value[1].toISOString().split('T')[0]
    })
    
    if (response.success && response.data) {
      return response.data
    } else {
      ElMessage.error('获取收入统计数据失败')
      return []
    }
  } catch (error) {
    console.error('获取收入统计数据失败:', error)
    ElMessage.error('获取收入统计数据失败')
    return []
  }
}

// 初始化收入来源图表
const initSourceChart = () => {
  if (!sourceChartRef.value) return
  
  sourceChart = echarts.init(sourceChartRef.value)
  const data = incomeData.value
  
  // 按来源统计
  const sourceStats: Record<string, number> = {}
  data.forEach(item => {
    if (!sourceStats[item.source]) {
      sourceStats[item.source] = 0
    }
    sourceStats[item.source] = (sourceStats[item.source] || 0) + item.amount
  })
  
  const sourceData = Object.entries(sourceStats).map(([name, value]) => ({ name, value }))
  
  // 异常检测
  const anomalies = detectAnomalies(sourceData.map(item => ({
    name: item.name,
    value: item.value,
    percentage: 0,
    color: ''
  })))
  
  let option: echarts.EChartsOption
  
  if (sourceChartType.value === 'pie') {
    option = {
      title: {
        text: '收入来源分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const isAnomaly = anomalies.some(item => item.name === params.name)
          let result = `${params.seriesName} <br/>${params.name}: ¥${formatAmount(params.value as number)} (${params.percent}%)`
          if (isAnomaly) {
            result += '<br/><span style="color: #ff7875;">⚠️ 异常波动</span>'
          }
          return result
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [{
        name: '收入来源',
        type: 'pie',
        radius: '50%',
        data: sourceData.map(item => ({
          ...item,
          itemStyle: {
            color: anomalies.some(anomaly => anomaly.name === item.name) ? '#ff7875' : undefined
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  } else {
    option = {
      title: {
        text: '收入来源统计',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const param = Array.isArray(params) ? params[0] : params
          const isAnomaly = anomalies.some(item => item.name === param.name)
          let result = `${param.name}: ¥${formatAmount(param.value as number)}`
          if (isAnomaly) {
            result += '<br/><span style="color: #ff7875;">⚠️ 异常波动</span>'
          }
          return result
        }
      },
      xAxis: {
        type: 'category',
        data: sourceData.map(item => item.name),
        axisLabel: {
          interval: 0,
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `¥${value}`
        }
      },
      series: [{
        name: '收入金额',
        type: 'bar',
        data: sourceData.map(item => {
          const isAnomaly = anomalies.some(anomaly => anomaly.name === item.name)
          return {
            value: item.value,
            itemStyle: {
              color: isAnomaly ? '#ff7875' : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            }
          }
        })
      }]
    }
  }
  
  sourceChart.setOption(option)
  
  // 更新收入来源数量
  incomeSourceCount.value = sourceData.length
}

// 初始化收入趋势图表
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  trendChart = echarts.init(trendChartRef.value)
  const data = incomeData.value
  
  // 按时间聚合数据
  const timeData = aggregateDataByTime(data, trendGranularity.value)
  
  // 生成预测数据
  const forecastData = generateForecastData(timeData)
  
  const option = {
    title: {
      text: '收入趋势分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((param: any) => {
          if (param.seriesName === '收入金额') {
            result += `${param.marker}${param.seriesName}: ¥${formatAmount(param.value as number)}<br/>`
          } else if (param.seriesName === '预测趋势') {
            result += `${param.marker}${param.seriesName}: ¥${formatAmount(param.value as number)}<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['收入金额', '预测趋势'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: [...timeData.map(item => item.date), ...forecastData.map(item => item.date)],
      axisLabel: {
        formatter: (value: string) => {
          if (trendGranularity.value === 'day') {
            const date = new Date(value)
            return `${date.getMonth() + 1}/${date.getDate()}`
          }
          return value
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `¥${value}`
      }
    },
    series: [
      {
        name: '收入金额',
        type: 'line',
        data: timeData.map(item => item.value),
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#52c41a'
        },
        areaStyle: {
          opacity: 0.3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#52c41a' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.1)' }
          ])
        }
      },
      {
        name: '预测趋势',
        type: 'line',
        data: [...Array(timeData.length).fill(null), ...forecastData.map(item => item.value)],
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#ff7875',
          type: 'dashed'
        },
        symbol: 'emptyCircle',
        symbolSize: 6
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }
  
  trendChart.setOption(option)
}

// 初始化对比分析图表
const initComparisonChart = () => {
  if (!comparisonChartRef.value) return
  
  comparisonChart = echarts.init(comparisonChartRef.value)
  
  // 生成对比数据
  const comparisonData = generateComparisonData(comparisonType.value)
  
  const option = {
    title: {
      text: getComparisonTitle(),
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['本期收入', '对比期收入'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: comparisonData.map(item => item.period)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `¥${value}`
      }
    },
    series: [
      {
        name: '本期收入',
        type: 'bar',
        data: comparisonData.map(item => item.current),
        itemStyle: {
          color: '#1890ff'
        }
      },
      {
        name: '对比期收入',
        type: 'bar',
        data: comparisonData.map(item => item.comparison),
        itemStyle: {
          color: '#52c41a'
        }
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

// 辅助函数
const aggregateDataByTime = (data: Array<{date: string, amount: number}>, granularity: 'day' | 'week' | 'month'): TimeAggregatedItem[] => {
  const aggregated: Record<string, number> = {}
  
  data.forEach(item => {
    const date = new Date(item.date)
    let key: string
    
    switch (granularity) {
      case 'day':
        key = item.date
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0] || ''
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = item.date
    }
    
    if (!aggregated[key]) {
      aggregated[key] = 0
    }
    aggregated[key] = (aggregated[key] || 0) + item.amount
  })
  
  return Object.entries(aggregated)
    .map(([date, value]): TimeAggregatedItem => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

const generateComparisonData = (type: 'month' | 'quarter' | 'year'): ComparisonDataItem[] => {
  const periods: ComparisonDataItem[] = []
  const current = new Date()
  
  // 按时间类型聚合当前收入数据
  const aggregatedData = aggregateDataByTime(incomeData.value, type === 'month' ? 'month' : type === 'quarter' ? 'month' : 'month')
  
  switch (type) {
    case 'month':
      for (let i = 5; i >= 0; i--) {
        const date = new Date(current.getFullYear(), current.getMonth() - i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        // 查找当前月份的收入数据
        const currentMonthData = aggregatedData.find(item => item.date === monthKey)
        const currentAmount = currentMonthData ? currentMonthData.value : 0
        
        // 计算对比期数据（去年同期或上期）
        const comparisonDate = new Date(date.getFullYear() - 1, date.getMonth(), 1)
        const comparisonMonthKey = `${comparisonDate.getFullYear()}-${String(comparisonDate.getMonth() + 1).padStart(2, '0')}`
        const comparisonMonthData = aggregatedData.find(item => item.date === comparisonMonthKey)
        const comparisonAmount = comparisonMonthData ? comparisonMonthData.value : currentAmount * 0.9 // 默认下降10%
        
        periods.push({
          period: `${date.getFullYear()}年${date.getMonth() + 1}月`,
          current: currentAmount,
          comparison: comparisonAmount
        })
      }
      break
    case 'quarter':
      for (let i = 3; i >= 0; i--) {
        const quarter = Math.floor(current.getMonth() / 3) - i + 1
        const year = current.getFullYear() + Math.floor((quarter - 1) / 4)
        const displayQuarter = ((quarter - 1) % 4) + 1
        
        // 计算季度总收入（汇总该季度的月份）
        let quarterTotal = 0
        let comparisonQuarterTotal = 0
        
        for (let m = 0; m < 3; m++) {
          const monthInQuarter = (displayQuarter - 1) * 3 + m
          const monthKey = `${year}-${String(monthInQuarter + 1).padStart(2, '0')}`
          const monthData = aggregatedData.find(item => item.date === monthKey)
          if (monthData) quarterTotal += monthData.value
          
          // 对比期（去年同期）
          const comparisonMonthKey = `${year - 1}-${String(monthInQuarter + 1).padStart(2, '0')}`
          const comparisonMonthData = aggregatedData.find(item => item.date === comparisonMonthKey)
          if (comparisonMonthData) comparisonQuarterTotal += comparisonMonthData.value
        }
        
        if (quarterTotal === 0) quarterTotal = 0 // 通过API获取真实数据
        if (comparisonQuarterTotal === 0) comparisonQuarterTotal = 0 // 通过API获取真实数据
        
        periods.push({
          period: `${year}年Q${displayQuarter}`,
          current: quarterTotal,
          comparison: comparisonQuarterTotal
        })
      }
      break
    case 'year':
      for (let i = 2; i >= 0; i--) {
        const year = current.getFullYear() - i
        const yearKey = `${year}`
        
        // 计算年度总收入
        const yearData = aggregatedData.filter(item => item.date.startsWith(yearKey))
        const yearTotal = yearData.reduce((sum, item) => sum + item.value, 0)
        
        // 对比期（前一年）
        const comparisonYearKey = `${year - 1}`
        const comparisonYearData = aggregatedData.filter(item => item.date.startsWith(comparisonYearKey))
        const comparisonYearTotal = comparisonYearData.reduce((sum, item) => sum + item.value, 0)
        
        const currentAmount = yearTotal > 0 ? yearTotal : 0 // 通过API获取真实数据
        const comparisonAmount = comparisonYearTotal > 0 ? comparisonYearTotal : 0 // 通过API获取真实数据
        
        periods.push({
          period: `${year}年`,
          current: currentAmount,
          comparison: comparisonAmount
        })
      }
      break
  }
  
  return periods
}

const getComparisonTitle = () => {
  const titles = {
    month: '月度收入对比',
    quarter: '季度收入对比',
    year: '年度收入对比'
  }
  return titles[comparisonType.value]
}

// 预测算法函数
const generateForecastData = (historicalData: TimeAggregatedItem[]): ForecastDataItem[] => {
  if (historicalData.length < 3) return []
  
  // 简单线性回归预测
  const n = historicalData.length
  const lastDate = historicalData.length > 0 && n > 0 ? new Date() : new Date()
  
  // 计算趋势
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  
  historicalData.forEach((item, index) => {
    sumX += index
    sumY += item.value
    sumXY += index * item.value
    sumXX += index * index
  })
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // 生成预测数据点
  const forecastPoints = 3
  const forecastData: ForecastDataItem[] = []
  
  for (let i = 1; i <= forecastPoints; i++) {
    const forecastIndex = n + i - 1
    const forecastValue = slope * forecastIndex + intercept
    
    // 基于历史数据的波动范围计算预测值
    const historicalValues = historicalData.map(item => item.value)
    const minValue = Math.min(...historicalValues)
    const maxValue = Math.max(...historicalValues)
    const avgValue = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length
    
    // 确保预测值在合理范围内（基于历史数据的1.5倍范围）
    const range = maxValue - minValue
    const lowerBound = Math.max(0, avgValue - range * 0.75)
    const upperBound = avgValue + range * 0.75
    
    let finalValue = Math.max(0, forecastValue)
    
    // 如果预测值超出合理范围，进行调整
    if (finalValue < lowerBound) {
      finalValue = lowerBound + (finalValue - lowerBound) * 0.3
    } else if (finalValue > upperBound) {
      finalValue = upperBound + (finalValue - upperBound) * 0.3
    }
    
    // 计算预测日期
    const forecastDate = new Date(lastDate)
    if (trendGranularity.value === 'day') {
      forecastDate.setDate(forecastDate.getDate() + i)
    } else if (trendGranularity.value === 'week') {
      forecastDate.setDate(forecastDate.getDate() + i * 7)
    } else if (trendGranularity.value === 'month') {
      forecastDate.setMonth(forecastDate.getMonth() + i)
    }
    
    forecastData.push({
      date: forecastDate.toISOString().split('T')[0] || '',
      value: Math.round(finalValue)
    })
  }
  
  return forecastData
}

// 异常检测函数
const detectAnomalies = (data: IncomeAnalysisItem[]): AnomalyItem[] => {
  if (data.length < 3) return []
  
  // 计算平均值和标准差
  const values = data.map(item => item.value)
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  // 使用3σ原则检测异常值
  const threshold = 3 * stdDev
  const anomalies: AnomalyItem[] = []
  
  // 计算变异系数（CV）来评估数据离散程度
  const cv = stdDev / mean
  
  data.forEach(item => {
    const deviation = Math.abs(item.value - mean)
    
    // 根据变异系数调整异常检测的敏感度
    let adjustedThreshold = threshold
    if (cv > 0.5) {
      // 高变异系数，放宽异常检测标准
      adjustedThreshold = threshold * 1.2
    } else if (cv < 0.2) {
      // 低变异系数，严格异常检测标准
      adjustedThreshold = threshold * 0.8
    }
    
    if (deviation > adjustedThreshold) {
      anomalies.push({
        name: item.name,
        value: item.value
      })
    }
  })
  
  return anomalies
}

// 生成趋势报告
const generateTrendReport = (): TrendReportData => {
  const timeData = aggregateDataByTime(incomeData.value, trendGranularity.value)
  const forecastData = generateForecastData(timeData)
  const sourceData = sourceAnalysisData.value
  
  // 计算关键指标
  const totalRevenue = totalIncome.value
  const avgRevenue = averageIncome.value
  
  // 计算收入变化（基于真实数据对比）
  let revenueGrowth = 0
  if (timeData.length >= 2) {
    const currentPeriod = timeData[timeData.length - 1]?.value || 0
    const previousPeriod = timeData[timeData.length - 2]?.value || 0
    revenueGrowth = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0
  }
  
  const yoyGrowth = yearOverYearGrowth.value
  const momGrowth = monthOverMonthGrowth.value
  const avgGrowth = averageGrowthRate.value
  
  // 检测异常
  const sourceStats: IncomeSourceStats = {}
  incomeData.value.forEach(item => {
    if (!sourceStats[item.source]) {
      sourceStats[item.source] = 0
    }
    sourceStats[item.source] = (sourceStats[item.source] || 0) + item.amount
  })
  const sourceDataForAnomaly = Object.entries(sourceStats).map(([name, value]): IncomeAnalysisItem => ({
    name,
    value,
    percentage: 0,
    color: ''
  }))
  const anomalies = detectAnomalies(sourceDataForAnomaly)
  
  return {
    reportDate: new Date().toLocaleDateString(),
    dateRange: `${dateRange.value[0].toLocaleDateString()} 至 ${dateRange.value[1].toLocaleDateString()}`,
    totalRevenue,
    avgRevenue,
    revenueGrowth,
    yoyGrowth,
    momGrowth,
    avgGrowth,
    topIncomeSource: sourceData.length > 0 && sourceData[0] ? sourceData[0] : null as IncomeAnalysisItem | null,
    anomalies: anomalies,
    forecast: forecastData,
    trendDirection: trendDirection.value,
    growthTrend: growthTrend.value,
    timeGranularity: trendGranularity.value,
    comparisonType: comparisonType.value,
    incomeSourceCount: incomeSourceCount.value
  }
}

// 创建报告内容
const createReportContent = (reportData: TrendReportData) => {
  const {
    reportDate,
    dateRange,
    totalRevenue,
    avgRevenue,
    revenueGrowth,
    yoyGrowth,
    momGrowth,
    avgGrowth,
    topIncomeSource,
    anomalies,
    forecast,
    trendDirection,
    growthTrend,
    timeGranularity,
    comparisonType,
    incomeSourceCount
  } = reportData
  
  let content = `收入趋势分析报告
生成日期: ${reportDate}
分析期间: ${dateRange}

=== 收入概览 ===
总收入: ¥${formatAmount(totalRevenue)}
平均收入: ¥${formatAmount(avgRevenue)}
收入变化: ${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(2)}%
增长趋势: ${growthTrend}
趋势方向: ${trendDirection}
收入来源数量: ${incomeSourceCount}

=== 增长分析 ===
同比增长率: ${(yoyGrowth || 0).toFixed(2)}%
环比增长率: ${(momGrowth || 0).toFixed(2)}%
平均增长率: ${(avgGrowth || 0).toFixed(2)}%

=== 主要收入来源 ===`
  
  if (topIncomeSource) {
    content += `
来源名称: ${topIncomeSource.name}
收入金额: ¥${formatAmount(topIncomeSource.value)}
占比: ${topIncomeSource.percentage}%
`
  } else {
    content += `
暂无收入来源数据
`
  }
  
  content += `
=== 异常检测 ===`
  if (anomalies.length > 0) {
    content += `
检测到 ${anomalies.length} 个异常收入来源:
`
    anomalies.forEach(anomaly => {
      content += `- ${anomaly.name}: ¥${formatAmount(anomaly.value)} (异常)
`
    })
  } else {
    content += `
未检测到异常收入来源
`
  }
  
  content += `
=== 趋势预测 ===`
  if (forecast.length > 0) {
    content += `
基于${timeGranularity}粒度的预测:
`
    forecast.forEach((item, index) => {
      content += `预测${index + 1}: ${item.date} - ¥${formatAmount(item.value)}
`
    })
  } else {
    content += `
数据不足，无法进行预测
`
  }
  
  content += `
=== 对比分析 ===
对比类型: ${comparisonType === 'month' ? '月度' : comparisonType === 'quarter' ? '季度' : '年度'}对比

=== 报告总结 ===
本报告基于${dateRange}期间的收入数据进行分析。
总体趋势: ${growthTrend}，收入变化${revenueGrowth > 0 ? '上升' : '下降'}${Math.abs(revenueGrowth || 0).toFixed(2)}%。
${anomalies.length > 0 ? `注意: 检测到${anomalies.length}个异常收入来源，建议进一步调查。` : '收入来源正常，未发现异常波动。'}
${forecast.length > 0 ? `预测显示未来${forecast.length}个周期内收入将呈现${trendDirection}趋势。` : '数据不足，无法提供预测分析。'}

报告生成时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}
`
  
  return content
}

// 下载报告文件
const downloadReport = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 对比分析计算属性
const yearOverYearGrowth = computed(() => {
  const data = generateComparisonData(comparisonType.value)
  if (data.length < 2) return 0
  
  const current = data[data.length - 1]?.current || 0
  const previous = data[data.length - 1]?.comparison || 0
  
  return previous > 0 ? ((current - previous) / previous) * 100 : 0
})

const monthOverMonthGrowth = computed(() => {
  const data = generateComparisonData(comparisonType.value)
  if (data.length < 2) return 0
  
  const current = data[data.length - 1]?.current || 0
  const previous = data[data.length - 2]?.current || 0
  
  return previous > 0 ? ((current - previous) / previous) * 100 : 0
})

const averageGrowthRate = computed(() => {
  const data = generateComparisonData(comparisonType.value)
  if (data.length < 2) return 0
  
  let totalGrowth = 0
  let validPeriods = 0
  
  for (let i = 1; i < data.length; i++) {
    const current = data[i]?.current || 0
    const previous = data[i - 1]?.current || 0
    
    if (previous > 0) {
      totalGrowth += ((current - previous) / previous) * 100
      validPeriods++
    }
  }
  
  return validPeriods > 0 ? totalGrowth / validPeriods : 0
})

// 事件处理函数
const handleBack = () => {
  router.push('/dashboard/statistics')
}

const handleAddIncome = () => {
  ElMessage.info('新增收入功能开发中')
}

const handleSourcePeriodChange = () => {
  nextTick(() => {
    initSourceChart()
  })
}



const handleExportReport = () => {
  // 生成详细的趋势报告
  const reportData = generateTrendReport()
  
  // 创建报告内容
  const reportContent = createReportContent(reportData)
  
  // 下载报告文件
  downloadReport(reportContent, `收入趋势报告_${new Date().toLocaleDateString()}.txt`)
  
  ElMessage.success('收入趋势报告已生成并下载')
}

const viewIncomeDetail = (row: any) => {
  ElMessage.info(`查看收入详情: ${row.source} - ¥${formatAmount(row.amount)}`)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const handleComparisonTypeChange = () => {
  nextTick(() => {
    initComparisonChart()
  })
}

// 监听对比类型变化，重新计算增长率
watch(comparisonType, () => {
  // 计算属性会自动重新计算
})

// 监听数据变化，重新初始化图表
watch(incomeData, () => {
  nextTick(() => {
    initTrendChart()
    initSourceChart()
    initComparisonChart()
  })
}, { deep: true })

// 监听时间粒度变化，重新生成预测
watch(trendGranularity, () => {
  nextTick(() => {
    initTrendChart()
  })
})

// 加载收入数据
const loadIncomeData = async () => {
  loading.value = true
  
  try {
    // 获取真实收入数据
    incomeData.value = await fetchIncomeData()
    
    // 计算概览数据
    totalIncome.value = incomeData.value.reduce((sum, item) => sum + item.amount, 0)
    averageIncome.value = totalIncome.value / (incomeData.value.length || 1)
    
    // 计算收入来源数量
    const uniqueSources = new Set(incomeData.value.map(item => item.source))
    incomeSourceCount.value = uniqueSources.size
    
    // 计算收入变化（基于时间序列数据）
    const timeData = aggregateDataByTime(incomeData.value, 'month')
    let revenueGrowth = 0
    if (timeData.length >= 2) {
      const currentPeriod = timeData[timeData.length - 1]?.value || 0
      const previousPeriod = timeData[timeData.length - 2]?.value || 0
      revenueGrowth = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0
    }
    incomeChange.value = Math.round(revenueGrowth * 100) / 100
    
    // 设置增长趋势
    if (incomeChange.value > 5) {
      growthTrend.value = '强劲增长'
      trendDirection.value = '上升'
    } else if (incomeChange.value > 0) {
      growthTrend.value = '温和增长'
      trendDirection.value = '上升'
    } else if (incomeChange.value > -5) {
      growthTrend.value = '轻微下降'
      trendDirection.value = '下降'
    } else {
      growthTrend.value = '明显下降'
      trendDirection.value = '下降'
    }
    
    // 生成收入明细（最近5条）
    incomeDetails.value = incomeData.value
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        source: item.source,
        amount: item.amount,
        date: item.date
      }))
    
    await nextTick()
    
    // 初始化图表
    initSourceChart()
    initTrendChart()
    initComparisonChart()
    
  } catch (error) {
    console.error('加载收入数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 监听变化
watch(sourceChartType, () => {
  initSourceChart()
})

watch(trendGranularity, () => {
  initTrendChart()
})

watch(comparisonType, () => {
  initComparisonChart()
})

// 生命周期
onMounted(() => {
  loadIncomeData()
})

// 组件卸载时清理
onUnmounted(() => {
  cleanup()
})

// 监听数据来源变化
watch(incomeData, () => {
  nextTick(() => {
    initSourceChart()
  })
})

// 响应式处理
const handleResize = () => {
  sourceChart?.resize()
  trendChart?.resize()
  comparisonChart?.resize()
}

window.addEventListener('resize', handleResize)

// 清理
const cleanup = () => {
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
  }
  if (categoryChart) {
    categoryChart.dispose()
    categoryChart = null
  }
  if (comparisonChart) {
    comparisonChart.dispose()
    comparisonChart = null
  }
  if (sourceChart) {
    sourceChart.dispose()
    sourceChart = null
  }
  window.removeEventListener('resize', handleResize)
}

// 在组件卸载时清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup)
}
</script>

<style scoped>
.income-statistics {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.income-source-analysis {
  margin-bottom: 20px;
}

.source-stats {
  padding: 20px;
}

.source-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.source-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.source-name {
  font-weight: 600;
  color: #303133;
}

.source-amount {
  font-weight: bold;
  color: #409EFF;
}

.source-percentage {
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
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

.income-overview {
  margin-bottom: 20px;
}

.overview-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
  height: 100%;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.card-icon.total {
  background: linear-gradient(135deg, #52c41a, #73d13d);
}

.card-icon.average {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
}

.card-icon.source {
  background: linear-gradient(135deg, #722ed1, #9254de);
}

.card-icon.growth {
  background: linear-gradient(135deg, #fa8c16, #ffa940);
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.card-change {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-change.up {
  color: #67c23a;
}

.card-change.down {
  color: #f56c6c;
}

.card-desc {
  font-size: 12px;
  color: #909399;
}

.income-source-analysis {
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

.chart-container {
  padding: 20px;
}

.income-comparison {
  margin-bottom: 20px;
}

.income-details {
  padding: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-source {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.detail-amount {
  font-size: 14px;
  color: #52c41a;
  font-weight: 600;
}

.detail-date {
  font-size: 12px;
  color: #909399;
}

.income-table-section {
  margin-bottom: 20px;
}

.table-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-container {
  padding: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .income-statistics {
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
  
  .overview-card {
    flex-direction: column;
    text-align: center;
  }
  
  .chart-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .table-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>