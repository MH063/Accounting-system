<template>
  <div class="expense-statistics">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">支出统计</h1>
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
        <div class="quick-time-selector">
          <el-button-group style="margin-right: 12px;">
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
        
        <!-- 导出按钮 -->
        <el-button type="primary" :icon="Download" @click="handleExport">
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="statistics-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">总支出</div>
              <div class="stat-value">¥{{ formatAmount(statistics.totalExpense) }}</div>
              <div class="stat-trend" :class="{ up: statistics.totalTrend > 0, down: statistics.totalTrend < 0 }">
                <el-icon><CaretTop v-if="statistics.totalTrend > 0" /><CaretBottom v-else /></el-icon>
                {{ Math.abs(statistics.totalTrend || 0) }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6">
          <div class="stat-card">
            <div class="stat-icon average">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">日均支出</div>
              <div class="stat-value">¥{{ formatAmount(statistics.dailyAverage) }}</div>
              <div class="stat-desc">{{ dateRangeText }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6">
          <div class="stat-card">
            <div class="stat-icon category">
              <el-icon><Grid /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">支出类别</div>
              <div class="stat-value">{{ statistics.categoryCount }}</div>
              <div class="stat-desc">个分类</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6">
          <div class="stat-card">
            <div class="stat-icon max">
              <el-icon><Top /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">单笔最高</div>
              <div class="stat-value">¥{{ formatAmount(statistics.maxExpense) }}</div>
              <div class="stat-desc">{{ statistics.maxExpenseCategory }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 支出趋势图 -->
        <el-col :xs="24" :sm="24" :md="16">
          <div class="chart-card">
            <div class="chart-header">
              <h3>支出趋势分析</h3>
              <el-radio-group v-model="chartTimeRange" size="small" @change="updateTrendChart">
                <el-radio-button label="7d">近7天</el-radio-button>
                <el-radio-button label="30d">近30天</el-radio-button>
                <el-radio-button label="90d">近90天</el-radio-button>
              </el-radio-group>
            </div>
            <div class="chart-container" ref="trendChartRef" style="height: 300px;"></div>
          </div>
        </el-col>
        <!-- 分类占比图 -->
        <el-col :xs="24" :sm="24" :md="8">
          <div class="chart-card">
            <div class="chart-header">
              <h3>支出分类占比</h3>
              <el-button type="text" size="small" @click="showCategoryDetail">详情</el-button>
            </div>
            <div class="chart-container" ref="categoryChartRef" style="height: 300px;"></div>
          </div>
        </el-col>
      </el-row>
      
      <!-- 多维度分析图表 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :xs="24" :sm="24" :md="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>成员支出对比</h3>
            </div>
            <div class="chart-container" ref="memberChartRef" style="height: 250px;"></div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>时段支出分布</h3>
              <el-select v-model="timeGranularity" size="small" style="width: 100px;">
                <el-option label="按小时" value="hour" />
                <el-option label="按天" value="day" />
                <el-option label="按周" value="week" />
              </el-select>
            </div>
            <div class="chart-container" ref="timeChartRef" style="height: 250px;"></div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 详细数据表格 -->
    <div class="detail-data">
      <div class="table-header">
        <h3>支出明细</h3>
        <div class="table-actions">
          <div class="search-container">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索支出项目 (支持描述、分类、支付人)"
              :prefix-icon="Search"
              clearable
              style="width: 280px; margin-right: 12px;"
              @input="handleSearch"
              @clear="clearSearch"
            />
            <span class="search-hint" v-if="searchKeyword">
              找到 {{ filteredTableData.length }} 条记录
            </span>
          </div>
        </div>
      </div>
      
      <!-- 搜索结果提示 -->
      <div v-if="searchKeyword && filteredTableData.length === 0" class="no-search-results">
        <el-icon><Search /></el-icon>
        <p>没有找到匹配的支出记录</p>
        <p>请尝试其他关键词或清除搜索条件</p>
      </div>
      
      <el-table
        v-else
        :data="paginatedTableData"
        v-loading="loading"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="date" label="日期" width="120" sortable="custom" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)" size="small">
              {{ row.category }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" width="200" show-overflow-tooltip />
        <el-table-column prop="amount" label="金额" width="120" sortable="custom">
          <template #default="{ row }">
            <span style="color: #f56c6c;">¥{{ formatAmount(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payer" label="支付人" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="small" 
                link
                @click.stop="handleEdit(row)"
                class="edit-btn"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                link
                @click.stop="handleDelete(row)"
                class="delete-btn"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 8, 12, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 分类详情弹窗 -->
    <el-dialog
      v-model="categoryDetailVisible"
      title="分类支出详情"
      width="600px"
      @close="closeCategoryDetail"
    >
      <div class="category-detail-content">
        <el-table :data="categoryDetailData" style="width: 100%">
          <el-table-column prop="category" label="分类" />
          <el-table-column prop="amount" label="金额">
            <template #default="{ row }">
              ¥{{ formatAmount(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="percentage" label="占比">
            <template #default="{ row }">
              {{ row.percentage }}%
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, 
  Download, 
  Search,
  Money,
  TrendCharts,
  Grid,
  Top,
  CaretTop,
  CaretBottom,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { expenseService, deleteExpense } from '@/services/expenseService'
import type { 
  ExpenseStatistics, 
  ExpenseTrendItem, 
  ExpenseCategoryItem, 
  ExpenseMemberItem, 
  ExpenseTimeItem,
  ExpenseDetailItem,
  ExpenseFilter
} from '@/services/expenseService'

// 路由
const router = useRouter()

// 类型定义 - 使用服务中定义的类型
interface SortInfo {
  prop: string
  order: 'ascending' | 'descending'
}

// 响应式数据
const loading = ref(false)

// 图表引用
const trendChartRef = ref<HTMLElement>()
const categoryChartRef = ref<HTMLElement>()
const memberChartRef = ref<HTMLElement>()
const timeChartRef = ref<HTMLElement>()

// 图表实例
const trendChart = ref<any>(null)
const categoryChart = ref<any>(null)
const memberChart = ref<any>(null)
const timeChart = ref<any>(null)

const selectedTimePeriod = ref('30d')
const chartTimeRange = ref('30d')
const timeGranularity = ref('day')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)
const categoryDetailVisible = ref(false)

// 时间周期选项
const timePeriods = [
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '近90天', value: '90d' },
  { label: '近6个月', value: '6m' },
  { label: '近1年', value: '1y' }
]

// 统计数据
const statistics = ref<ExpenseStatistics>({
  totalExpense: 0,
  dailyAverage: 0,
  categoryCount: 0,
  maxExpense: 0,
  maxExpenseCategory: ''
})

// 表格数据
const tableData = ref<ExpenseDetailItem[]>([])

// 成员列表
const memberList = ref<{id: number, name: string}[]>([])

// 分类详情数据
const categoryDetailData = ref<{category: string, amount: number, percentage: number}[]>([])
const categoryDetailVisible = ref(false)
const currentCategory = ref('')
const categoryDetailLoading = ref(false)

// 计算属性
const dateRangeText = computed(() => {
  // 基于当前选择的时间周期显示天数
  const periodDays: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '6m': 180,
    '1y': 365
  }
  const days = periodDays[selectedTimePeriod.value] || 30
  return `${days}天`
})

// 搜索过滤后的表格数据
const filteredTableData = computed(() => {
  if (!searchKeyword.value.trim()) {
    return tableData.value
  }
  
  const keyword = searchKeyword.value.trim().toLowerCase()
  return tableData.value.filter(item => {
    return (
      item.description.toLowerCase().includes(keyword) ||
      item.category.toLowerCase().includes(keyword) ||
      item.payer.toLowerCase().includes(keyword) ||
      item.amount.toString().includes(keyword) ||
      item.date.includes(keyword)
    )
  })
})

// 分页后的表格数据
const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTableData.value.slice(start, end)
})

/**
 * 更新总数（用于分页）
 */
const updateTotal = () => {
  // 重新加载数据，让后端处理搜索和分页
  loadExpenseData()
}

// 方法
const handleBack = () => {
  router.push('/dashboard/analytics')
}



/**
 * 选择快捷时间周期
 */
const selectTimePeriod = (period: string) => {
  selectedTimePeriod.value = period
  
  console.log('选择快捷时间周期:', period)
  currentPage.value = 1
  loadExpenseData() // 重新加载数据以更新所有图表和统计
}

// 加载支出数据
const loadExpenseData = async () => {
  loading.value = true
  try {
    console.log('开始加载支出统计数据...')
    
    // 构建筛选参数
    const filter: ExpenseFilter = {
      startDate: timeRange.value[0],
      endDate: timeRange.value[1],
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    // 如果有搜索关键词，添加到筛选条件
    if (searchKeyword.value) {
      filter.keyword = searchKeyword.value
    }
    
    // 调用真实API获取支出统计数据
    const response = await expenseService.getExpenseStatistics(filter)
    
    if (response.success && response.data) {
      console.log('支出统计数据加载成功:', response.data)
      
      // 使用真实数据更新统计
      const stats = response.data.statistics || {}
      const trendData = response.data.trendData || []
      const categoryData = response.data.categoryData || []
      const memberData = response.data.memberData || []
      const timeData = response.data.timeData || []
      const detailData = response.data.detailData || []
      
      // 更新统计数据
      statistics.totalExpense = stats.totalExpense || 0
      statistics.dailyAverage = stats.dailyAverage || 0
      statistics.categoryCount = stats.categoryCount || 0
      statistics.maxExpense = stats.maxExpense || 0
      statistics.maxExpenseCategory = stats.maxExpenseCategory || ''
      
      // 更新表格数据
      tableData.value = detailData
      total.value = response.data.total || 0
      
      // 更新图表数据
      if (trendData.length && trendChart.value) {
        updateTrendChartWithRealData(trendData)
      }
      if (categoryData.length && categoryChart.value) {
        updateCategoryChartWithRealData(categoryData)
      }
      if (memberData.length && memberChart.value) {
        updateMemberChartWithRealData(memberData)
      }
      if (timeData.length && timeChart.value) {
        updateTimeChartWithRealData(timeData)
      }
      
      console.log('支出统计数据处理完成')
    } else {
      console.error('获取支出统计数据失败:', response.message)
      ElMessage.error(response.message || '获取支出统计数据失败')
    }
  } catch (error) {
    console.error('加载支出统计数据失败:', error)
    ElMessage.error('加载支出统计数据失败')
  } finally {
    loading.value = false
  }
}

// 移除模拟数据相关的函数，图表更新现在由loadExpenseData处理

// 获取分类标签类型
const getCategoryType = (category: string) => {
  const types: Record<string, string> = {
    '餐饮': 'danger',
    '交通': 'primary',
    '生活用品': 'success',
    '娱乐': 'warning',
    '其他': 'info'
  }
  return types[category] || 'info'
}

// 格式化金额
const formatAmount = (amount: number) => {
  return (amount || 0).toFixed(2)
}

// 更新趋势图表（并同步更新相关图表）
const updateTrendChart = () => {
  console.log('支出趋势分析时间筛选变化:', chartTimeRange.value)
  
  // 同步更新selectedTimePeriod以保持一致性
  selectedTimePeriod.value = chartTimeRange.value
  
  // 更新趋势图表
  if (trendChart.value) {
    updateTrendChartOnly()
  }
  
  // 同步更新其他相关图表
  if (categoryChart.value) {
    updateCategoryChart()
  }
  
  if (memberChart.value) {
    updateMemberChart()
  }
  
  if (timeChart.value) {
    updateTimeChart()
  }
  
  console.log('完成趋势分析模块图表更新')
}

// 使用真实数据更新趋势图表
const updateTrendChartWithRealData = (trendData: any[]) => {
  if (!trendChart.value) return
  
  console.log('使用真实数据更新趋势图表，数据条数:', trendData.length)
  
  const option = {
    title: {
      text: '支出趋势分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `${data.axisValue}<br/>支出: ¥${data.value}`
      }
    },
    xAxis: {
      type: 'category',
      data: trendData.map(item => item.date.substring(5))
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      data: trendData.map(item => item.amount),
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#409EFF'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ]
        }
      }
    }]
  }
  
  trendChart.value.setOption(option, true)
}

// 使用真实数据更新分类图表
const updateCategoryChartWithRealData = (categoryData: any[]) => {
  if (!categoryChart.value) return
  
  console.log('使用真实数据更新分类图表，数据条数:', categoryData.length)
  
  // 同时更新分类详情数据
  updateCategoryDetail(categoryData)
  
  const option = {
    title: {
      text: '支出分类占比',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [{
      name: '支出分类',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: categoryData,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    }]
  }
  
  categoryChart.value.setOption(option, true)
}

// 更新分类详情数据
const updateCategoryDetail = (categoryData: any[]) => {
  const totalAmount = categoryData.reduce((sum, item) => sum + item.value, 0)
  const updatedDetailData = categoryData.map(item => ({
    category: item.name,
    amount: item.value,
    percentage: ((item.value / totalAmount) * 100).toFixed(1)
  }))
  
  categoryDetailData.value = updatedDetailData
  console.log('更新分类详情数据:', updatedDetailData)
}

// 使用真实数据更新成员图表
const updateMemberChartWithRealData = (memberData: any[]) => {
  if (!memberChart.value) return
  
  console.log('使用真实数据更新成员图表，数据条数:', memberData.length)
  
  const option = {
    title: {
      text: '成员支出对比',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: memberData.map(item => item.name)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      data: memberData.map(item => item.amount),
      type: 'bar',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }
  
  memberChart.value.setOption(option, true)
}

// 使用真实数据更新时段图表
const updateTimeChartWithRealData = (timeData: any[]) => {
  if (!timeChart.value) return
  
  console.log('使用真实数据更新时段图表，数据条数:', timeData.length)
  
  // 根据时间粒度设置不同的标题和样式
  let chartTitle = '支出时段分布'
  let xAxisLabel = ''
  let colorScheme = []
  
  switch (timeGranularity.value) {
    case 'hour':
      chartTitle = '按小时支出分布'
      xAxisLabel = '时段'
      colorScheme = [
        { offset: 0, color: '#4facfe' },
        { offset: 1, color: '#00f2fe' }
      ]
      break
    case 'day':
      chartTitle = '按天支出分布'
      xAxisLabel = '星期'
      colorScheme = [
        { offset: 0, color: '#43e97b' },
        { offset: 1, color: '#38f9d7' }
      ]
      break
    case 'week':
      chartTitle = '按周支出分布'
      xAxisLabel = '周次'
      colorScheme = [
        { offset: 0, color: '#fa709a' },
        { offset: 1, color: '#fee140' }
      ]
      break
    default:
      chartTitle = '支出时段分布'
      xAxisLabel = '时段'
      colorScheme = [
        { offset: 0, color: '#4facfe' },
        { offset: 1, color: '#00f2fe' }
      ]
  }
  
  const option = {
    title: {
      text: chartTitle,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>支出金额: ¥${data.value}`
      }
    },
    xAxis: {
      type: 'category',
      data: timeData.map(item => item.period),
      name: xAxisLabel,
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        rotate: timeData.length > 7 ? 45 : 0 // 如果项目过多，倾斜标签
      }
    },
    yAxis: {
      type: 'value',
      name: '支出金额(¥)',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      data: timeData.map(item => item.amount),
      type: 'bar',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: colorScheme
        },
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.3)'
        }
      }
    }],
    grid: {
      left: '3%',
      right: '4%',
      bottom: timeData.length > 7 ? '15%' : '3%',
      containLabel: true
    }
  }
  
  timeChart.value.setOption(option, true)
  
  console.log(`更新${timeGranularity.value}时段图表，数据点: ${timeData.length}个`)
}

/**
 * 显示分类详情
 */
const showCategoryDetail = (category: string) => {
  currentCategory.value = category
  categoryDetailVisible.value = true
  loadCategoryDetail(category)
}

/**
 * 加载分类详情数据
 */
const loadCategoryDetail = async (category: string) => {
  try {
    categoryDetailLoading.value = true
    
    console.log('加载分类详情:', category)
    
    // 调用真实的API接口获取分类详情数据
    const response = await getExpenseCategoryDetail(category)
    categoryDetailData.value = response.data
    
  } catch (error) {
    console.error('加载分类详情失败:', error)
    ElMessage.error('加载分类详情失败')
  } finally {
    categoryDetailLoading.value = false
  }
}

// 关闭分类详情
const closeCategoryDetail = () => {
  categoryDetailVisible.value = false
}

// 搜索处理（带防抖功能）
const handleSearch = () => {
  // 清除之前的定时器
  if (handleSearch.timer) {
    clearTimeout(handleSearch.timer)
  }
  
  // 设置新的定时器
  handleSearch.timer = setTimeout(() => {
    console.log('搜索关键词:', searchKeyword.value)
    currentPage.value = 1
    updateTotal()
  }, 300)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  updateTotal()
  console.log('清除搜索')
}

// 表格排序处理
const handleSortChange = (sortInfo: SortInfo) => {
  console.log('表格排序:', sortInfo)
  loadExpenseData()
}

/**
 * 编辑支出
 */
const handleEdit = (row: ExpenseDetailItem) => {
  console.log('编辑支出:', row)
  
  // 将当前行的数据传递给编辑页面
  const data = encodeURIComponent(JSON.stringify(row))
  router.push({
    path: `/dashboard/expense/edit/${row.id}`,
    query: { data: data }
  })
}

/**
 * 删除支出
 */
const handleDelete = async (row: ExpenseDetailItem) => {
  try {
    // 显示确认对话框
    const result = await ElMessageBox.confirm(
      `确定要删除这条支出记录吗？
支出项目：${row.description}
支出金额：¥${row.amount}
支出日期：${row.date}
      
删除后将无法恢复，请谨慎操作！`, 
      '确认删除', 
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        distinguishCancelAndClose: true
      }
    )
    
    console.log('删除支出:', row)
    
    // 显示加载状态
    const loadingMessage = ElMessage({
      message: '正在删除...',
      type: 'info',
      duration: 0
    })
    
    try {
      // 调用真实的删除API
      await deleteExpense(row.id)
      
      // 从本地数据中删除该项
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        tableData.value.splice(index, 1)
        
        // 更新总数
        updateTotal()
        
        // 重新加载数据以更新图表
        await loadExpenseData()
        
        console.log('删除成功，更新本地数据')
        ElMessage.success('删除成功')
      } else {
        throw new Error('未找到要删除的记录')
      }
      
    } catch (error) {
      console.error('删除失败:', error)
      throw error
    } finally {
      // 关闭加载提示
      ElMessage.closeAll()
    }
    
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') {
      console.log('取消删除')
      ElMessage.info('已取消删除')
    } else {
      console.error('删除失败:', error)
      ElMessage.error(`删除失败: ${error.message || '未知错误'}`)
    }
  }
}



// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  updateTotal() // 更新总数
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  // 不需要重新加载数据，只需要更新分页显示
}

/**
 * 数据导出
 */
const handleExport = async () => {
  try {
    loading.value = true
    console.log('导出支出数据')
    
    // 构建导出数据
    const exportData = {
      timePeriod: selectedTimePeriod.value,
      statistics: statistics.value,
      detailData: tableData.value,
      exportTime: new Date().toISOString()
    }
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `支出统计_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    // 清理URL对象
    setTimeout(() => URL.revokeObjectURL(url), 100)
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('数据导出失败')
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  // 等待DOM更新后初始化图表
  nextTick(() => {
    initCharts()
  })
  
  // 设置初始总数
  updateTotal()
  
  loadExpenseData()
})

// 初始化所有图表
const initCharts = () => {
  if (!trendChartRef.value || !categoryChartRef.value || !memberChartRef.value || !timeChartRef.value) return
  
  // 初始化图表实例
  trendChart.value = echarts.init(trendChartRef.value)
  categoryChart.value = echarts.init(categoryChartRef.value)
  memberChart.value = echarts.init(memberChartRef.value)
  timeChart.value = echarts.init(timeChartRef.value)
  
  // 初始化响应式
  const handleResize = () => {
    trendChart.value?.resize()
    categoryChart.value?.resize()
    memberChart.value?.resize()
    timeChart.value?.resize()
  }
  
  window.addEventListener('resize', handleResize)
  
  // 初始化图表数据 - 现在由loadExpenseData处理
  // updateAllCharts() // 注释掉，避免重复初始化
}

// 移除所有模拟数据相关函数 - 现在使用真实API数据

// 监听筛选条件变化
watch([timeGranularity], () => {
  console.log('时段粒度变化:', timeGranularity.value)
  // 重新加载数据以更新时段图表
  loadExpenseData()
})
</script>

<style scoped>
.expense-statistics {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.statistics-overview {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.average {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-icon.category {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-icon.max {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.up {
  color: #67c23a;
}

.stat-trend.down {
  color: #f56c6c;
}

.stat-desc {
  font-size: 12px;
  color: #c0c4cc;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 4px;
  color: #909399;
  font-size: 14px;
}

.detail-data {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.category-detail-content {
  padding: 20px 0;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.el-button.edit-btn,
.el-button.delete-btn {
  min-width: 45px;
  height: 24px;
  padding: 3px 6px;
  font-size: 11px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.el-button.edit-btn:hover,
.el-button.delete-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.el-button .el-icon {
  font-size: 12px;
}

/* 搜索功能样式 */
.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-hint {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

/* 搜索高亮样式 */
.search-highlight {
  background-color: #fff3cd;
  padding: 2px 4px;
  border-radius: 2px;
}

/* 无搜索结果样式 */
.no-search-results {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.no-search-results .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .el-button.edit-btn,
  .el-button.delete-btn {
    min-width: auto;
    height: 20px;
    padding: 2px 4px;
    font-size: 10px;
  }
  
  .el-button .el-icon {
    font-size: 10px;
  }
  
  .search-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .search-hint {
    font-size: 11px;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .action-buttons {
    gap: 4px;
    padding: 0 2px;
  }
  
  .action-buttons .el-button {
    padding: 2px 4px;
    font-size: 10px;
    min-width: 35px;
    height: 20px;
  }
  
  .action-buttons .el-button .el-icon {
    font-size: 10px;
    margin-right: 1px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .expense-statistics {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  

  
  .stat-card {
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .table-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .table-actions .el-input {
    flex: 1;
    margin-right: 8px !important;
  }
}
</style>