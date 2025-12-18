<template>
  <div class="member-management">
    <div class="page-header">
      <h1>成员管理</h1>
      <div class="header-actions">
        <el-button 
          type="primary" 
          @click="router.push('/dashboard/member/list')"
          :loading="loading"
        >
          <el-icon><List /></el-icon>
          成员列表 ({{ stats.summary.totalUsers }})
        </el-button>
        <el-button 
          @click="router.push('/dashboard/member/invite')"
          type="success"
        >
          <el-icon><UserFilled /></el-icon>
          邀请成员
        </el-button>
        <el-button 
          @click="refreshData"
          type="info"
          :loading="loading"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="content-section">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-section">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background: #409EFF">
                <el-icon :size="24" color="white">
                  <User />
                </el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats.summary.totalUsers }}</h3>
                <p>总成员数</p>
                <span class="stat-trend up">
                  +0%
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background: #67C23A">
                <el-icon :size="24" color="white">
                  <UserFilled />
                </el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats.summary.activeUsers }}</h3>
                <p>活跃成员</p>
                <span class="stat-trend up">
                  +0%
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background: #E6A23C">
                <el-icon :size="24" color="white">
                  <House />
                </el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats.summary.usersInDorms }}</h3>
                <p>宿舍成员</p>
                <span class="stat-trend up">
                  +0%
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background: #F56C6C">
                <el-icon :size="24" color="white">
                  <Money />
                </el-icon>
              </div>
              <div class="stat-info">
                <h3>¥{{ formatAmount(stats.summary.avgSplitAmount) }}</h3>
                <p>平均费用</p>
                <span class="stat-trend up">
                  +0%
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 时间范围选择和趋势图 -->
      <el-row :gutter="20" class="trend-section">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>成员统计趋势</span>
                <div class="trend-controls">
                  <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    @change="handleDateRangeChange"
                    style="width: 260px; margin-right: 12px;"
                  />
                </div>
              </div>
            </template>
            <div class="trend-chart" ref="trendChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 详细统计 -->
      <el-row :gutter="20" class="details-section">
        <el-col :span="8">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>费用统计</span>
              </div>
            </template>
            <div class="detail-content">
              <div class="detail-item">
                <span class="label">有费用记录用户:</span>
                <span class="value">{{ stats.summary.usersWithExpenses }}</span>
              </div>
              <div class="detail-item">
                <span class="label">总分摊金额:</span>
                <span class="value">¥{{ formatAmount(stats.summary.totalSplitAmount) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">已支付总金额:</span>
                <span class="value">¥{{ formatAmount(stats.summary.totalPaidAmount) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>宿舍统计</span>
              </div>
            </template>
            <div class="detail-content">
              <div class="detail-item">
                <span class="label">总宿舍数:</span>
                <span class="value">{{ stats.summary.totalDorms }}</span>
              </div>
              <div class="detail-item">
                <span class="label">平均宿舍容量:</span>
                <span class="value">{{ stats.summary.avgDormCapacity }}</span>
              </div>
              <div class="detail-item">
                <span class="label">平均每宿舍人数:</span>
                <span class="value">{{ stats.summary.avgMembersPerDorm }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>衍生指标</span>
              </div>
            </template>
            <div class="detail-content">
              <div class="detail-item">
                <span class="label">活跃率:</span>
                <span class="value">{{ formatPercentage(stats.summary.activeRate) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">宿舍成员占比:</span>
                <span class="value">{{ formatPercentage(stats.summary.dormMemberRate) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">支付率:</span>
                <span class="value">{{ formatPercentage(stats.summary.paymentRate) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 快速统计 -->
      <el-row :gutter="20" class="quick-stats-section">
        <el-col :span="24">
          <el-card class="quick-stats">
            <template #header>
              <div class="card-header">
                <span>快速统计</span>
              </div>
            </template>
            
            <div class="quick-stats-content">
              <div class="quick-stat-item">
                <div class="progress-circle">
                  <el-progress 
                    type="circle" 
                    :percentage="Math.round(stats.summary.activeRate)" 
                    :width="80"
                    :stroke-width="6"
                  />
                  <span class="progress-text">活跃率</span>
                </div>
              </div>
              
              <div class="stats-breakdown">
                <div class="breakdown-item">
                  <span class="label">管理员</span>
                  <span class="value">{{ adminCount }}</span>
                </div>
                <div class="breakdown-item">
                  <span class="label">普通成员</span>
                  <span class="value">{{ memberCount }}</span>
                </div>
                <div class="breakdown-item">
                  <span class="label">平均费用</span>
                  <span class="value">¥{{ formatAmount(stats.summary.avgSplitAmount) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 成员活动记录 -->
      <el-row :gutter="20" class="activity-section">
        <el-col :span="24">
          <el-card class="activity-card">
            <template #header>
              <div class="card-header">
                <span>成员活动记录</span>
                <div class="header-actions">
                  <el-select
                    v-model="selectedDormIds"
                    multiple
                    placeholder="选择宿舍"
                    clearable
                    @change="handleDormFilterChange"
                    style="width: 200px; margin-right: 12px;"
                  >
                    <el-option
                      v-for="dorm in dormOptions"
                      :key="dorm.id"
                      :label="dorm.name"
                      :value="dorm.id"
                    />
                  </el-select>
                  <el-button type="primary" @click="refreshActivities" :icon="Refresh" circle />
                </div>
              </div>
            </template>
            


            <el-table
              :data="activities"
              v-loading="activityLoading"
              element-loading-text="加载中..."
              stripe
              style="width: 100%"
              row-key="activityId"
            >
              <el-table-column prop="activityTime" label="活动时间" width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.activityTime) }}
                </template>
              </el-table-column>
              
              <el-table-column prop="activityTitle" label="活动标题" min-width="150" />
              
              <el-table-column prop="detail" label="详情" min-width="200" />
              
              <el-table-column prop="user.name" label="操作人" width="120" />
              
              <el-table-column prop="dorm.name" label="宿舍" width="150" />
              
              <el-table-column prop="amount" label="金额" width="100">
                <template #default="scope">
                  <span v-if="scope.row.amount">¥{{ scope.row.amount.toFixed(2) }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getStatusTagType(scope.row.status)">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column prop="activityType" label="类型" width="120">
                <template #default="scope">
                  <el-tag :type="getActivityTypeTagType(scope.row.activityType)">
                    {{ getActivityTypeText(scope.row.activityType) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="activityPagination.currentPage"
                v-model:page-size="activityPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="activityPagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleActivitySizeChange"
                @current-change="handleActivityCurrentChange"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  List, 
  UserFilled,
  User,
  House,
  Money,
  Refresh
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getMemberStats } from '@/services/memberStatisticsService'
import { getMemberActivities } from '@/services/memberActivityService'
import { dormService } from '@/services/dormService'
import type { MemberActivity, Pagination } from '@/services/memberActivityService'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)
const trendChartRef = ref<HTMLElement>()
const trendChart = ref<any>(null)

// 成员活动相关状态
const activityLoading = ref(false)
const activities = ref<MemberActivity[]>([])
const activityPagination = ref<Pagination>({
  currentPage: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 宿舍筛选相关
const dormOptions = ref<{ id: number; name: string }[]>([])
const selectedDormIds = ref<number[]>([])

// 统计数据
interface MemberStatsSummary {
  totalUsers: number
  activeUsers: number
  usersInDorms: number
  usersWithExpenses: number
  totalSplitAmount: number
  avgSplitAmount: number
  totalPaidAmount: number
  totalDorms: number
  avgDormCapacity: number
  avgCurrentOccupancy: number
  avgMembersPerDorm: number
  recentTotalExpenses: number
  recentExpenseCount: number
  activeRate: number
  dormMemberRate: number
  paymentRate: number
}

interface MonthlyTrendItem {
  month: string
  newMembers: number
  activeMembers: number
  dormMembers: number
  expenseMembers: number
  totalExpenses: number
  avgExpensePerMember: number
}

interface MemberStatsResponse {
  summary: MemberStatsSummary
  monthlyTrends: MonthlyTrendItem[]
}

const stats = ref<MemberStatsResponse>({
  summary: {
    totalUsers: 0,
    activeUsers: 0,
    usersInDorms: 0,
    usersWithExpenses: 0,
    totalSplitAmount: 0,
    avgSplitAmount: 0,
    totalPaidAmount: 0,
    totalDorms: 0,
    avgDormCapacity: 0,
    avgCurrentOccupancy: 0,
    avgMembersPerDorm: 0,
    recentTotalExpenses: 0,
    recentExpenseCount: 0,
    activeRate: 0,
    dormMemberRate: 0,
    paymentRate: 0
  },
  monthlyTrends: []
})

// 计算属性
const totalMembers = computed(() => stats.value.summary.totalUsers)
const adminCount = computed(() => 2)
const memberCount = computed(() => totalMembers.value - adminCount.value)

// 方法
const loadData = async () => {
  loading.value = true
  try {
    console.log('加载成员统计数据...')
    
    // 调用API获取成员统计数据
    const response = await getMemberStats(
      dateRange.value ? dateRange.value[0] : undefined,
      dateRange.value ? dateRange.value[1] : undefined
    )
    
    if (response.success && response.data) {
      console.log('成员统计数据加载成功:', response.data)
      stats.value = response.data
      
      // 更新图表
      nextTick(() => {
        if (trendChart.value) {
          updateTrendChart()
        }
      })
      
      ElMessage.success('数据加载成功')
    } else {
      console.error('获取成员统计数据失败:', response.message)
      ElMessage.error(response.message || '获取成员统计数据失败')
    }
  } catch (error) {
    console.error('加载成员统计数据失败:', error)
    ElMessage.error('加载成员统计数据失败')
  } finally {
    loading.value = false
  }
}

/**
 * 加载成员活动数据
 */
const loadActivities = async () => {
  try {
    activityLoading.value = true
    
    // 构造宿舍ID字符串
    const dormIds = selectedDormIds.value.length > 0 
      ? selectedDormIds.value.join(',') 
      : undefined
    
    const response = await getMemberActivities(
      activityPagination.value.currentPage,
      activityPagination.value.pageSize,
      dormIds
    )
    
    if (response.success && response.data) {
      activities.value = response.data.activities
      activityPagination.value = response.data.pagination
    } else {
      throw new Error(response.message || '获取成员活动数据失败')
    }
  } catch (error) {
    console.error('加载成员活动数据失败:', error)
    ElMessage.error('加载成员活动数据失败: ' + (error as Error).message)
    activities.value = []
  } finally {
    activityLoading.value = false
  }
}

/**
 * 处理宿舍筛选变化
 */
const handleDormFilterChange = () => {
  // 重置到第一页并重新加载数据
  activityPagination.value.currentPage = 1
  loadActivities()
}

/**
 * 处理活动分页大小变化
 */
const handleActivitySizeChange = (size: number) => {
  activityPagination.value.pageSize = size
  activityPagination.value.currentPage = 1
  loadActivities()
}

/**
 * 处理活动当前页变化
 */
const handleActivityCurrentChange = (page: number) => {
  activityPagination.value.currentPage = page
  loadActivities()
}

/**
 * 刷新活动数据
 */
const refreshActivities = () => {
  loadActivities()
}

/**
 * 加载宿舍选项
 */
const loadDormOptions = async () => {
  try {
    const response = await dormService.getDormitories()
    if (response.success && response.data) {
      dormOptions.value = response.data.map(dorm => ({
        id: dorm.id,
        name: `${dorm.building}${dorm.roomNumber}`
      }))
    }
  } catch (error) {
    console.error('加载宿舍选项失败:', error)
    ElMessage.error('加载宿舍选项失败')
  }
}

/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 获取状态标签类型
 */
const getStatusTagType = (status?: string) => {
  if (!status) return 'info'
  
  const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    'approved': 'success',
    'pending': 'warning',
    'rejected': 'danger',
    'completed': 'success',
    'processing': 'warning'
  }
  
  return statusMap[status] || 'info'
}

/**
 * 获取状态文本
 */
const getStatusText = (status?: string) => {
  if (!status) return '-'
  
  const statusMap: Record<string, string> = {
    'approved': '已批准',
    'pending': '待处理',
    'rejected': '已拒绝',
    'completed': '已完成',
    'processing': '处理中'
  }
  
  return statusMap[status] || status
}

/**
 * 获取活动类型标签类型
 */
const getActivityTypeTagType = (type: string) => {
  const typeMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    'expense': 'warning',
    'payment': 'success',
    'maintenance': 'info',
    'member_change': 'info'  // 'primary' 不是有效的 Element Plus tag 类型
  }
  
  return typeMap[type] || 'info'
}

/**
 * 获取活动类型文本
 */
const getActivityTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'expense': '费用申请',
    'payment': '费用支付',
    'maintenance': '报修处理',
    'member_change': '成员变动'
  }
  
  return typeMap[type] || type
}

const handleDateRangeChange = () => {
  console.log('日期范围变化:', dateRange.value)
  loadData()
}

const refreshData = () => {
  loadData()
}



const formatAmount = (amount: number) => {
  return (amount || 0).toFixed(2)
}

const formatPercentage = (rate: number) => {
  return `${(rate || 0).toFixed(1)}%`
}

/**
 * 更新趋势图表
 */
const updateTrendChart = () => {
  if (!trendChart.value || !stats.value.monthlyTrends.length) return
  
  console.log('更新趋势图表，数据条数:', stats.value.monthlyTrends.length)
  
  // 准备图表数据
  const months = stats.value.monthlyTrends.map(item => {
    // 格式化月份显示
    const date = new Date(item.month)
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
  })
  
  const newMembers = stats.value.monthlyTrends.map(item => item.newMembers)
  const activeMembers = stats.value.monthlyTrends.map(item => item.activeMembers)
  const expenseMembers = stats.value.monthlyTrends.map(item => item.expenseMembers)
  
  const option = {
    title: {
      text: '月度趋势分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['新增成员', '活跃成员', '有费用成员'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增成员',
        type: 'line',
        data: newMembers,
        smooth: true,
        lineStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '活跃成员',
        type: 'line',
        data: activeMembers,
        smooth: true,
        lineStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '有费用成员',
        type: 'line',
        data: expenseMembers,
        smooth: true,
        lineStyle: {
          color: '#E6A23C'
        }
      }
    ]
  }
  
  trendChart.value.setOption(option, true)
}

onMounted(() => {
  // 初始化图表
  nextTick(() => {
    if (trendChartRef.value) {
      trendChart.value = echarts.init(trendChartRef.value)
      
      // 响应式处理
      const handleResize = () => {
        trendChart.value?.resize()
      }
      
      window.addEventListener('resize', handleResize)
    }
  })
  
  // 加载初始数据
  loadData()
  
  // 加载宿舍选项和活动数据
  loadDormOptions()
  loadActivities()
})
</script>

<style scoped>
.member-management {
  padding: 20px;
  margin: 0;
  min-height: 100vh;
  background: #f5f7fa;
}

.content-section {
  margin-top: 20px;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info h3 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-info p {
  margin: 0 0 4px 0;
  color: #606266;
  font-size: 14px;
}

.stat-trend {
  font-size: 12px;
  font-weight: 600;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.trend-section {
  margin-bottom: 20px;
}

.trend-controls {
  display: flex;
  align-items: center;
}

.details-section {
  margin-bottom: 20px;
}

.detail-content {
  padding: 10px 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #eee;
}

.detail-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.detail-item .label {
  color: #909399;
}

.detail-item .value {
  font-weight: 500;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-stats-content {
  text-align: center;
}

.progress-circle {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #303133;
  font-size: 12px;
  font-weight: 600;
}

.stats-breakdown {
  text-align: left;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.breakdown-item:last-child {
  border-bottom: none;
}

.breakdown-item .label {
  color: #606266;
  font-size: 13px;
}

.breakdown-item .value {
  color: #303133;
  font-weight: 600;
  font-size: 13px;
}



.header-actions {
  display: flex;
  gap: 12px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.trend-chart {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 4px;
  color: #909399;
  font-size: 14px;
}

.activity-section {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .stats-section .el-col {
    margin-bottom: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .trend-controls {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}
</style>