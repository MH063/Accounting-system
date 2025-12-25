<template>
  <div class="statistics">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">统计分析</h1>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="statistics-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="overview-card">
            <div class="card-icon expense">
              <el-icon><Money /></el-icon>
            </div>
            <div class="card-content">
              <h3>总支出</h3>
              <p class="amount">¥{{ statistics.totalExpense?.toFixed(2) || '0.00' }}</p>
              <p class="subtitle">本月支出统计</p>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="overview-card">
            <div class="card-icon budget">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="card-content">
              <h3>预算余额</h3>
              <p class="amount">¥{{ statistics.budgetBalance?.toFixed(2) || '0.00' }}</p>
              <p class="subtitle">剩余预算金额</p>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="overview-card">
            <div class="card-icon trend">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="card-content">
              <h3>支出趋势</h3>
              <p class="amount" :class="getTrendClass()">{{ getTrendText() }}</p>
              <p class="subtitle">相比上月</p>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="overview-card">
            <div class="card-icon members">
              <el-icon><User /></el-icon>
            </div>
            <div class="card-content">
              <h3>活跃用户</h3>
              <p class="amount">{{ statistics.activeUsers || 0 }}</p>
              <p class="subtitle">本月活跃用户</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 功能模块导航 -->
    <div class="module-navigation">
      <h2 class="section-title">数据分析</h2>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <div class="nav-card" @click="goToExpenseStatistics">
            <div class="nav-icon expense-stat">
              <el-icon><PieChart /></el-icon>
            </div>
            <div class="nav-content">
              <h3>支出统计</h3>
              <p>查看详细的支出分类统计和分析</p>
              <el-button type="primary" text>
                查看详情 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="nav-card" @click="goToTrendAnalysis">
            <div class="nav-icon trend-analysis">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="nav-content">
              <h3>趋势分析</h3>
              <p>分析支出趋势和变化规律</p>
              <el-button type="primary" text>
                查看详情 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="nav-card" @click="goToBudgetManagement">
            <div class="nav-icon budget-manage">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="nav-content">
              <h3>预算管理</h3>
              <p>设置和管理预算，控制支出</p>
              <el-button type="primary" text>
                查看详情 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Money,
  Wallet,
  TrendCharts,
  User,
  PieChart
} from '@element-plus/icons-vue'

// 定义统计数据接口
interface StatisticsData {
  totalExpense?: number
  budgetBalance?: number
  expenseTrend?: number
  activeUsers?: number
}

// 路由
const router = useRouter()

// 统计数据状态
const statistics = ref<StatisticsData>({})

// 获取趋势文本
const getTrendText = () => {
  const trend = statistics.value.expenseTrend
  if (trend === undefined) return '持平'
  if (trend > 0) return `+${trend}%`
  if (trend < 0) return `${trend}%`
  return '持平'
}

// 获取趋势样式类
const getTrendClass = () => {
  const trend = statistics.value.expenseTrend
  if (trend === undefined) return ''
  if (trend > 0) return 'trend-up'
  if (trend < 0) return 'trend-down'
  return ''
}

// 基础HTTP请求函数
const request = async <T = unknown>(url: string, options: RequestInit = {}): Promise<any> => {
  // 获取API基础URL，确保符合 rule #14 (不使用 localhost/127.0.0.1)
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.111.53.9:4000/api'
  
  // 获取访问令牌
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    // 使用完整URL构建请求
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
    console.log(`发送请求到: ${fullUrl}`, config);
    
    const response = await fetch(fullUrl, config)
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API请求失败 (${response.status}):`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`请求成功:`, data);
    return data
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    console.log('获取统计数据')
    // 调用后端API获取统计数据
    const response = await request('/dashboard/statistics')
    // 处理双层嵌套的数据结构
    if (response.success && response.data) {
      // 映射后端数据结构到前端期望的结构
      statistics.value = {
        totalExpense: response.data.expenseStats?.totalMonthlyExpense || 0,
        budgetBalance: response.data.expenseStats?.budgetBalance || 0,
        expenseTrend: response.data.expenseStats?.expenseTrend || 0,
        activeUsers: response.data.userStats?.activeUsers || 0
      }
      console.log('统计数据更新成功:', statistics.value)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 页面挂载时获取数据
onMounted(() => {
  fetchStatistics()
})

const goToExpenseStatistics = () => {
  router.push('/dashboard/expense-statistics')
}

const goToTrendAnalysis = () => {
  router.push('/dashboard/trend-analysis')
}

const goToBudgetManagement = () => {
  router.push('/dashboard/budget')
}

</script>

<style scoped>
.statistics {
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

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.statistics-overview {
  margin-bottom: 30px;
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

.card-icon.expense {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.card-icon.budget {
  background: linear-gradient(135deg, #4834d4, #686de0);
}

.card-icon.trend {
  background: linear-gradient(135deg, #00d2d3, #54a0ff);
}

.card-icon.members {
  background: linear-gradient(135deg, #5f27cd, #a55eea);
}

.card-content h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}

.card-content .amount {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.card-content .subtitle {
  margin: 0;
  font-size: 12px;
  color: #c0c4cc;
}

.card-content .amount.trend-up {
  color: #f56c6c;
}

.card-content .amount.trend-down {
  color: #67c23a;
}

.module-navigation {
  margin-bottom: 30px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.nav-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 100%;
}

.nav-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}

.nav-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  margin-bottom: 16px;
}

.nav-icon.expense-stat {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.nav-icon.trend-analysis {
  background: linear-gradient(135deg, #00d2d3, #54a0ff);
}

.nav-icon.budget-manage {
  background: linear-gradient(135deg, #4834d4, #686de0);
}

.nav-content h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.nav-content p {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .statistics {
    padding: 10px;
  }
  
  .page-header {
    padding: 12px 15px;
  }
  
  .overview-card,
  .nav-card {
    padding: 16px;
  }
}
</style>