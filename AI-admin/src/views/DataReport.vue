<template>
  <div class="data-report-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据报表</span>
          <div>
            <el-select v-model="reportType" placeholder="请选择报表类型" @change="handleReportTypeChange" style="margin-right: 15px;">
              <el-option label="用户活跃度报表" value="userActivity" />
              <el-option label="收入统计报表" value="income" />
              <el-option label="操作日志报表" value="operationLog" />
              <el-option label="系统性能报表" value="systemPerformance" />
            </el-select>
            <el-date-picker
              v-model="timeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleTimeChange"
              style="margin-right: 15px;"
            />
            <el-button type="primary" @click="handleGenerate">生成报表</el-button>
            <el-button @click="handleAutoGenerate">自动计划</el-button>
            <el-button @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      
      <!-- 报表概览 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6" v-for="stat in reportStats" :key="stat.title">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon" :class="`bg-${stat.color}`">
                <el-icon size="24"><component :is="stat.icon" /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">{{ stat.title }}</div>
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-trend" :class="stat.trend > 0 ? 'trend-up' : 'trend-down'">
                  <el-icon v-if="stat.trend > 0"><Top /></el-icon>
                  <el-icon v-else><Bottom /></el-icon>
                  {{ Math.abs(stat.trend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 图表区域 -->
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>{{ chartTitle }}</span>
              </div>
            </template>
            <div ref="mainChartRef" style="height: 400px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>数据分布</span>
              </div>
            </template>
            <div ref="pieChartRef" style="height: 400px;"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 报表数据表格 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="table-header">
            <span>{{ tableTitle }}</span>
          </div>
        </template>
        <el-table :data="reportData" style="width: 100%" v-loading="loading">
          <el-table-column 
            v-for="column in tableColumns" 
            :key="column.prop" 
            :prop="column.prop" 
            :label="column.label" 
            :width="column.width"
          />
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 15, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Coin, Document, DataLine, Top, Bottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const reportType = ref('userActivity')
const timeRange = ref(['2023-10-01', '2023-10-31'])

const reportStats = ref([
  { title: '总用户数', value: 1245, trend: 2.5, color: 'primary', icon: 'User' },
  { title: '活跃用户', value: 842, trend: 5.2, color: 'success', icon: 'User' },
  { title: '总收入', value: '¥256,805', trend: -1.8, color: 'warning', icon: 'Coin' },
  { title: '平均响应时间', value: '128ms', trend: -3.5, color: 'info', icon: 'DataLine' },
  { title: '系统使用率', value: '85%', trend: 2.1, color: 'success', icon: 'DataLine' },
  { title: '报表生成数', value: 24, trend: 8.3, color: 'primary', icon: 'Document' }
])

const chartTitle = ref('用户活跃度趋势')
const tableTitle = ref('用户活跃度详情')

const tableColumns = ref([
  { prop: 'date', label: '日期', width: 120 },
  { prop: 'newUsers', label: '新增用户', width: 100 },
  { prop: 'activeUsers', label: '活跃用户', width: 100 },
  { prop: 'loginCount', label: '登录次数', width: 100 },
  { prop: 'avgSessionTime', label: '平均会话时长(分钟)', width: 150 },
  { prop: 'pageViews', label: '页面浏览量', width: 120 }
])

const reportData = ref([
  { date: '2023-10-01', newUsers: 25, activeUsers: 120, loginCount: 180, avgSessionTime: 15.2, pageViews: 1250 },
  { date: '2023-10-02', newUsers: 32, activeUsers: 135, loginCount: 210, avgSessionTime: 18.5, pageViews: 1420 },
  { date: '2023-10-03', newUsers: 28, activeUsers: 128, loginCount: 195, avgSessionTime: 16.8, pageViews: 1320 },
  { date: '2023-10-04', newUsers: 40, activeUsers: 152, loginCount: 240, avgSessionTime: 20.1, pageViews: 1650 },
  { date: '2023-10-05', newUsers: 35, activeUsers: 145, loginCount: 225, avgSessionTime: 19.3, pageViews: 1580 }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

// 图表引用
const mainChartRef = ref()
const pieChartRef = ref()

// 图表实例
let mainChart: echarts.ECharts
let pieChart: echarts.ECharts

// 初始化图表
const initCharts = () => {
  // 主图表
  mainChart = echarts.init(mainChartRef.value)
  mainChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['新增用户', '活跃用户', '登录次数']
    },
    xAxis: {
      type: 'category',
      data: ['10-01', '10-02', '10-03', '10-04', '10-05', '10-06', '10-07']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: [25, 32, 28, 40, 35, 30, 38]
      },
      {
        name: '活跃用户',
        type: 'line',
        data: [120, 135, 128, 152, 145, 138, 148]
      },
      {
        name: '登录次数',
        type: 'bar',
        data: [180, 210, 195, 240, 225, 205, 230]
      }
    ]
  })

  // 饼图
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: 'bottom'
    },
    series: [
      {
        name: '用户分布',
        type: 'pie',
        radius: ['40%', '70%'],
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
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 45, name: '新用户' },
          { value: 55, name: '老用户' }
        ]
      }
    ]
  })
}

// 报表类型变更
const handleReportTypeChange = () => {
  console.log('📊 报表类型变更:', reportType.value)
  
  // 根据报表类型更新界面元素
  switch (reportType.value) {
    case 'userActivity':
      chartTitle.value = '用户活跃度趋势'
      tableTitle.value = '用户活跃度详情'
      tableColumns.value = [
        { prop: 'date', label: '日期', width: 120 },
        { prop: 'newUsers', label: '新增用户', width: 100 },
        { prop: 'activeUsers', label: '活跃用户', width: 100 },
        { prop: 'loginCount', label: '登录次数', width: 100 },
        { prop: 'avgSessionTime', label: '平均会话时长(分钟)', width: 150 },
        { prop: 'pageViews', label: '页面浏览量', width: 120 }
      ]
      break
    case 'income':
      chartTitle.value = '收入统计趋势'
      tableTitle.value = '收入统计详情'
      tableColumns.value = [
        { prop: 'date', label: '日期', width: 120 },
        { prop: 'totalIncome', label: '总收入(元)', width: 120 },
        { prop: 'onlinePayment', label: '线上支付(元)', width: 120 },
        { prop: 'offlinePayment', label: '线下支付(元)', width: 120 },
        { prop: 'refundAmount', label: '退款金额(元)', width: 120 },
        { prop: 'netIncome', label: '净收入(元)', width: 120 }
      ]
      break
    case 'operationLog':
      chartTitle.value = '操作日志统计'
      tableTitle.value = '操作日志详情'
      tableColumns.value = [
        { prop: 'date', label: '日期', width: 120 },
        { prop: 'totalOperations', label: '总操作数', width: 100 },
        { prop: 'successOperations', label: '成功操作', width: 100 },
        { prop: 'failedOperations', label: '失败操作', width: 100 },
        { prop: 'userOperations', label: '用户操作', width: 100 },
        { prop: 'systemOperations', label: '系统操作', width: 100 }
      ]
      break
    case 'systemPerformance':
      chartTitle.value = '系统性能趋势'
      tableTitle.value = '系统性能详情'
      tableColumns.value = [
        { prop: 'date', label: '日期', width: 120 },
        { prop: 'avgResponseTime', label: '平均响应时间(ms)', width: 150 },
        { prop: 'maxResponseTime', label: '最大响应时间(ms)', width: 150 },
        { prop: 'errorRate', label: '错误率(%)', width: 100 },
        { prop: 'throughput', label: '吞吐量(QPS)', width: 120 },
        { prop: 'cpuUsage', label: 'CPU使用率(%)', width: 120 }
      ]
      break
  }
  
  ElMessage.info('报表类型已更新')
}

// 时间范围变更
const handleTimeChange = () => {
  console.log('🕒 时间范围变更:', timeRange.value)
  ElMessage.info('时间范围已更新')
}

// 生成报表
const handleGenerate = () => {
  console.log('📊 生成报表:', reportType.value, timeRange.value)
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    loading.value = false
    ElMessage.success('报表生成成功')
  }, 1000)
}

// 导出
const handleExport = () => {
  console.log('📤 导出报表数据')
  ElMessage.success('导出功能待实现')
}

// 自动计划生成
const handleAutoGenerate = () => {
  console.log('⏱️ 设置自动报表生成计划')
  ElMessage.info('自动报表生成功能待实现')
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  console.log(`📈 每页显示 ${val} 条`)
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  console.log(`📄 当前页: ${val}`)
}

// 窗口大小变更处理
const handleResize = () => {
  if (mainChart) mainChart.resize()
  if (pieChart) pieChart.resize()
}

// 组件挂载
onMounted(() => {
  console.log('📈 数据报表页面加载完成')
  initCharts()
  window.addEventListener('resize', handleResize)
})

// 组件卸载前
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (mainChart) mainChart.dispose()
  if (pieChart) pieChart.dispose()
})

/**
 * 数据报表页面
 * 提供多种类型的数据报表展示和分析功能
 */
</script>

<style scoped>
.data-report-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  margin-bottom: 0;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.bg-primary {
  background-color: #409EFF;
}

.bg-success {
  background-color: #67C23A;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-info {
  background-color: #909399;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.stat-trend {
  font-size: 12px;
  margin-top: 5px;
}

.trend-up {
  color: #67C23A;
}

.trend-down {
  color: #F56C6C;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>