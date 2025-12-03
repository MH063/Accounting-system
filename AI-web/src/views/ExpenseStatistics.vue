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
        <!-- 时间范围选择器 -->
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateRangeChange"
          style="width: 240px; margin-right: 12px;"
        />
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
              <el-select v-model="memberFilter" size="small" placeholder="选择成员" style="width: 120px;">
                <el-option label="全部成员" value="" />
                <el-option v-for="member in memberList" :key="member.id" :label="member.name" :value="member.id" />
              </el-select>
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
          <el-input
            v-model="searchKeyword"
            placeholder="搜索支出项目"
            :prefix-icon="Search"
            style="width: 200px; margin-right: 12px;"
            @input="handleSearch"
          />
          <el-button type="primary" :icon="Plus" @click="handleAddExpense">
            记一笔
          </el-button>
        </div>
      </div>
      
      <el-table
        :data="tableData"
        v-loading="loading"
        style="width: 100%"
        @row-click="handleRowClick"
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
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="amount" label="金额" width="120" sortable="custom">
          <template #default="{ row }">
            <span style="color: #f56c6c;">¥{{ formatAmount(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payer" label="支付人" width="120" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="text" size="small" @click.stop="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="text" size="small" style="color: #f56c6c;" @click.stop="handleDelete(row)">
              删除
            </el-button>
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
  Plus, 
  Search,
  Money,
  TrendCharts,
  Grid,
  Top,
  CaretTop,
  CaretBottom
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 路由
const router = useRouter()

// 类型定义
interface ExpenseItem {
  id: number
  date: string
  category: string
  description: string
  amount: number
  payer: string
}

interface CategoryDetail {
  category: string
  amount: number
  percentage: number
}

interface SortInfo {
  prop: string
  order: 'ascending' | 'descending'
}

interface Member {
  id: number
  name: string
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
const dateRange = ref<string[]>([])
const chartTimeRange = ref('30d')
const memberFilter = ref('')
const timeGranularity = ref('day')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)
const categoryDetailVisible = ref(false)

// 统计数据
const statistics = reactive({
  totalExpense: 15860.50,
  totalTrend: 12.5,
  dailyAverage: 528.68,
  categoryCount: 8,
  maxExpense: 2800.00,
  maxExpenseCategory: '餐饮'
})

// 表格数据
const tableData = ref<ExpenseItem[]>([
  {
    id: 1,
    date: '2024-01-15',
    category: '餐饮',
    description: '团队聚餐',
    amount: 580.00,
    payer: '张三'
  },
  {
    id: 2,
    date: '2024-01-14',
    category: '交通',
    description: '打车费用',
    amount: 45.80,
    payer: '李四'
  },
  {
    id: 3,
    date: '2024-01-13',
    category: '生活用品',
    description: '购买日用品',
    amount: 128.50,
    payer: '王五'
  }
])

// 成员列表
const memberList = ref<Member[]>([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' }
])

// 分类详情数据
const categoryDetailData = ref<CategoryDetail[]>([
  { category: '餐饮', amount: 6800.50, percentage: 42.9 },
  { category: '交通', amount: 2450.30, percentage: 15.5 },
  { category: '生活用品', amount: 1890.80, percentage: 11.9 },
  { category: '娱乐', amount: 1560.20, percentage: 9.8 },
  { category: '其他', amount: 3158.70, percentage: 19.9 }
])

// 计算属性
const dateRangeText = computed(() => {
  if (dateRange.value && dateRange.value.length === 2) {
    const days = Math.ceil((new Date(dateRange.value[1]) - new Date(dateRange.value[0])) / (1000 * 60 * 60 * 24))
    return `${days}天`
  }
  return '30天'
})

// 方法
const handleBack = () => {
  router.push('/dashboard/analytics')
}

// 时间范围变化处理
const handleDateRangeChange = () => {
  console.log('时间范围变化:', dateRange.value)
  loadExpenseData()
}

// 加载支出数据
const loadExpenseData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    console.log('加载支出数据，时间范围:', dateRange.value)
    // 这里应该调用实际的API获取数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据更新
    updateStatistics()
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateStatistics = () => {
  // 根据当前筛选条件计算统计数据
  console.log('更新统计数据')
}

// 格式化金额
const formatAmount = (amount: number) => {
  return (amount || 0).toFixed(2)
}

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

// 更新趋势图表
const updateTrendChart = () => {
  console.log('更新趋势图表，时间范围:', chartTimeRange.value)
  // 这里应该调用图表库更新图表
}

// 显示分类详情
const showCategoryDetail = () => {
  categoryDetailVisible.value = true
  loadCategoryDetail()
}

// 加载分类详情
const loadCategoryDetail = async () => {
  try {
    // 模拟API调用
    console.log('加载分类详情数据')
    // 这里应该调用实际的API获取分类详情数据
  } catch (error) {
    console.error('加载分类详情失败:', error)
  }
}

// 关闭分类详情
const closeCategoryDetail = () => {
  categoryDetailVisible.value = false
}

// 搜索处理
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value)
  currentPage.value = 1
  loadExpenseData()
}

// 表格排序处理
const handleSortChange = (sortInfo: SortInfo) => {
  console.log('表格排序:', sortInfo)
  loadExpenseData()
}

// 表格行点击处理
const handleRowClick = (row: ExpenseItem) => {
  console.log('点击行:', row)
  // 这里可以实现数据下钻功能
  router.push(`/dashboard/expense-detail/${row.id}`)
}

// 编辑支出
const handleEdit = (row: ExpenseItem) => {
  console.log('编辑支出:', row)
  router.push(`/dashboard/expense-edit/${row.id}`)
}

// 删除支出
const handleDelete = async (row: ExpenseItem) => {
  try {
    await ElMessageBox.confirm('确定要删除这条支出记录吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    console.log('删除支出:', row)
    ElMessage.success('删除成功')
    loadExpenseData()
  } catch (error) {
    console.log('取消删除')
  }
}

// 添加支出
const handleAddExpense = () => {
  router.push('/dashboard/expense-create')
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadExpenseData()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadExpenseData()
}

// 数据导出
const handleExport = async () => {
  try {
    loading.value = true
    console.log('导出支出数据')
    
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 这里应该调用实际的导出API
    const exportData = {
      dateRange: dateRange.value,
      statistics: statistics,
      detailData: tableData.value
    }
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `支出统计_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
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
  // 设置默认时间范围（近30天）
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  dateRange.value = [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  ]
  
  // 等待DOM更新后初始化图表
  nextTick(() => {
    initCharts()
  })
  
  loadExpenseData()
})

// 初始化所有图表
const initCharts = () => {
  initTrendChart()
  initCategoryChart()
  initMemberChart()
  initTimeChart()
}

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  trendChart.value = echarts.init(trendChartRef.value)
  
  // 模拟趋势数据
  const trendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return {
      date: date.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 500) + 200
    }
  })
  
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
  
  trendChart.value.setOption(option)
  
  // 响应式
  window.addEventListener('resize', () => {
    trendChart.value.resize()
  })
}

// 初始化分类饼图
const initCategoryChart = () => {
  if (!categoryChartRef.value) return
  
  categoryChart.value = echarts.init(categoryChartRef.value)
  
  // 模拟分类数据
  const categoryData = [
    { name: '餐饮', value: 6800.50 },
    { name: '交通', value: 2450.30 },
    { name: '生活用品', value: 1890.80 },
    { name: '娱乐', value: 1560.20 },
    { name: '其他', value: 3158.70 }
  ]
  
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
  
  categoryChart.value.setOption(option)
  
  // 响应式
  window.addEventListener('resize', () => {
    categoryChart.value.resize()
  })
}

// 初始化成员对比图
const initMemberChart = () => {
  if (!memberChartRef.value) return
  
  memberChart.value = echarts.init(memberChartRef.value)
  
  // 模拟成员数据
  const memberData = [
    { name: '张三', amount: 5200.30 },
    { name: '李四', amount: 3800.80 },
    { name: '王五', amount: 2456.40 },
    { name: '赵六', amount: 1890.00 }
  ]
  
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
  
  memberChart.value.setOption(option)
  
  // 响应式
  window.addEventListener('resize', () => {
    memberChart.value.resize()
  })
}

// 初始化时段分布图
const initTimeChart = () => {
  if (!timeChartRef.value) return
  
  timeChart.value = echarts.init(timeChartRef.value)
  
  // 模拟时段数据
  const timeData = [
    { period: '00-06', amount: 320 },
    { period: '06-12', amount: 1240 },
    { period: '12-18', amount: 2860 },
    { period: '18-24', amount: 2100 }
  ]
  
  const option = {
    title: {
      text: '支出时段分布',
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
      data: timeData.map(item => item.period)
    },
    yAxis: {
      type: 'value',
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
          colorStops: [
            { offset: 0, color: '#4facfe' },
            { offset: 1, color: '#00f2fe' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }
  
  timeChart.value.setOption(option)
  
  // 响应式
  window.addEventListener('resize', () => {
    timeChart.value.resize()
  })
}

// 监听筛选条件变化
watch([memberFilter, timeGranularity], () => {
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
  
  .header-actions .el-date-picker {
    flex: 1;
    margin-right: 8px !important;
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