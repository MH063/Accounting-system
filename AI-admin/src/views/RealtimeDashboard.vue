<template>
  <div class="realtime-dashboard-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>实时监控仪表盘</span>
          <div>
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="handleTimeChange"
              style="margin-right: 15px;"
            />
            <el-button type="primary" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>
      
      <!-- 实时数据概览 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">在线用户数</div>
                <div class="stat-value">{{ realtimeData.onlineUsers }}</div>
                <div class="stat-trend" :class="realtimeData.onlineUsersTrend > 0 ? 'trend-up' : 'trend-down'">
                  <el-icon v-if="realtimeData.onlineUsersTrend > 0"><Top /></el-icon>
                  <el-icon v-else><Bottom /></el-icon>
                  {{ Math.abs(realtimeData.onlineUsersTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><DataLine /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">活跃用户数</div>
                <div class="stat-value">{{ realtimeData.activeUsers }}</div>
                <div class="stat-trend trend-up">
                  <el-icon><Top /></el-icon>
                  3.2%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">新增用户</div>
                <div class="stat-value">{{ realtimeData.newUserCount }}</div>
                <div class="stat-trend trend-up">
                  <el-icon><Top /></el-icon>
                  5.1%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-warning">
                <el-icon size="24"><Coin /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">费用交易数</div>
                <div class="stat-value">{{ realtimeData.feeTransactions }}</div>
                <div class="stat-trend trend-up">
                  <el-icon><Top /></el-icon>
                  8.7%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><Coin /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">费用金额</div>
                <div class="stat-value">¥{{ realtimeData.feeAmount.toFixed(0) }}</div>
                <div class="stat-trend trend-up">
                  <el-icon><Top /></el-icon>
                  12.3%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-danger">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">告警数量</div>
                <div class="stat-value">{{ realtimeData.alertCount }}</div>
                <div class="stat-trend trend-down">
                  <el-icon><Bottom /></el-icon>
                  25.0%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 图表区域 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>用户活跃度趋势</span>
              </div>
            </template>
            <div ref="userActivityChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>费用数据趋势</span>
              </div>
            </template>
            <div ref="feeDataChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>性能指标趋势</span>
              </div>
            </template>
            <div ref="performanceChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>业务指标监控</span>
              </div>
            </template>
            <div ref="businessChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 实时日志 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="log-header">
            <span>实时日志</span>
            <el-select v-model="logLevel" placeholder="日志级别" size="small" @change="handleLogLevelChange">
              <el-option label="全部" value="" />
              <el-option label="INFO" value="info" />
              <el-option label="WARN" value="warn" />
              <el-option label="ERROR" value="error" />
            </el-select>
          </div>
        </template>
        <div class="log-container" ref="logContainerRef">
          <div 
            v-for="(log, index) in logList" 
            :key="index" 
            class="log-item"
            :class="`log-${log.level}`"
          >
            <span class="log-time">[{{ log.time }}]</span>
            <span class="log-level">[{{ log.level.toUpperCase() }}]</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 实时告警 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="alert-header">
            <span>实时告警</span>
            <el-badge :value="alertList.filter(a => a.status === 'active').length" type="danger">
              <el-button size="small" @click="handleClearAlerts">清除已读</el-button>
            </el-badge>
          </div>
        </template>
        <el-table :data="alertList" style="width: 100%">
          <el-table-column prop="time" label="告警时间" width="180"></el-table-column>
          <el-table-column prop="level" label="级别" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.level === 'high' ? 'danger' : scope.row.level === 'medium' ? 'warning' : 'info'">
                {{ scope.row.level === 'high' ? '高' : scope.row.level === 'medium' ? '中' : '低' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="告警内容"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'active' ? 'danger' : 'success'">
                {{ scope.row.status === 'active' ? '未处理' : '已处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" type="primary" @click="handleAcknowledgeAlert(scope.row)" :disabled="scope.row.status !== 'active'">确认</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { User, DataLine, Warning, Coin, Top, Bottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { systemApi } from '../api/user'

// 响应式数据
const timeRange = ref(['2023-11-01 00:00:00', '2023-11-01 23:59:59'])
const logLevel = ref('')

const realtimeData = ref({
  onlineUsers: 1245,
  onlineUsersTrend: 2.5,
  qps: 128,
  qpsTrend: -1.2,
  exceptions: 3,
  exceptionsTrend: -15.8,
  todayIncome: 25680.50,
  incomeTrend: 5.3,
  activeUsers: 3420,
  newUserCount: 45,
  feeTransactions: 128,
  feeAmount: 32450.80,
  responseTime: 120,
  throughput: 128,
  businessVolume: 865,
  alertCount: 2
})

const logList = ref([
  { time: '2023-11-01 10:30:25', level: 'info', message: '用户张三登录系统' },
  { time: '2023-11-01 10:31:12', level: 'info', message: '支付订单PAY202311010001处理成功' },
  { time: '2023-11-01 10:32:45', level: 'warn', message: '系统负载达到85%，请注意' },
  { time: '2023-11-01 10:33:22', level: 'info', message: '数据备份任务开始执行' },
  { time: '2023-11-01 10:35:18', level: 'error', message: '数据库连接超时，已自动重连' },
  { time: '2023-11-01 10:36:05', level: 'info', message: '用户李四查询寝室信息' },
  { time: '2023-11-01 10:37:33', level: 'info', message: '费用类型管理模块更新成功' }
])

const alertList = ref([
  { id: 1, time: '2023-11-01 10:35:18', level: 'high', message: '数据库连接超时，已自动重连', status: 'active' },
  { id: 2, time: '2023-11-01 10:32:45', level: 'medium', message: '系统负载达到85%，请注意', status: 'active' },
  { id: 3, time: '2023-11-01 10:25:33', level: 'low', message: '用户登录失败次数较多', status: 'acknowledged' },
  { id: 4, time: '2023-11-01 10:15:22', level: 'high', message: '支付模块响应超时', status: 'resolved' }
])

// 图表引用
const userActivityChartRef = ref()
const feeDataChartRef = ref()
const performanceChartRef = ref()
const businessChartRef = ref()
const logContainerRef = ref()

// 图表实例
let userActivityChart: echarts.ECharts
let feeDataChart: echarts.ECharts
let performanceChart: echarts.ECharts
let businessChart: echarts.ECharts

// 初始化图表
const initCharts = async () => {
  try {
    // 获取图表数据
    const response = await systemApi.getSystemStats()
    const data = response.data || response
    
    let loadChartData = [30, 45, 60, 75, 65, 50, 40]
    let responseTimeData = [120, 150, 180, 200, 170, 140, 130]
    let memoryData = [45, 52, 60, 68, 72, 65, 58]
    let cpuData = [25, 35, 45, 55, 60, 50, 40]
    
    // 如果API返回了图表数据，则使用真实数据
    if (data && data.charts) {
      if (data.charts.loadChart) loadChartData = data.charts.loadChart
      if (data.charts.responseTimeChart) responseTimeData = data.charts.responseTimeChart
      if (data.charts.memoryChart) memoryData = data.charts.memoryChart
      if (data.charts.cpuChart) cpuData = data.charts.cpuChart
    }
    
    // 用户活跃度趋势图
    userActivityChart = echarts.init(userActivityChartRef.value)
    userActivityChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value',
        name: '活跃用户数'
      },
      series: [{
        data: [1200, 1500, 1800, 2100, 1900, 1600, 1300],
        type: 'line',
        smooth: true,
        areaStyle: {}
      }]
    })

    // 费用数据趋势图
    feeDataChart = echarts.init(feeDataChartRef.value)
    feeDataChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value',
        name: '费用金额 (元)'
      },
      series: [{
        data: [25000, 32000, 28000, 45000, 38000, 31000, 29000],
        type: 'line',
        smooth: true
      }]
    })

    // 性能指标趋势图
    performanceChart = echarts.init(performanceChartRef.value)
    performanceChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value',
        name: '响应时间 (ms)'
      },
      series: [{
        data: [120, 150, 180, 200, 170, 140, 130],
        type: 'line',
        smooth: true
      }]
    })

    // 业务指标监控图
    businessChart = echarts.init(businessChartRef.value)
    businessChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value',
        name: '业务量'
      },
      series: [{
        data: [800, 1200, 1500, 1800, 1600, 1300, 1000],
        type: 'line',
        smooth: true
      }]
    })
  } catch (error) {
    console.error('❌ 初始化图表数据失败:', error)
    ElMessage.error('初始化图表数据失败: ' + (error as Error).message)
    
    // 出错时使用默认数据
    // 用户活跃度趋势图
    userActivityChart = echarts.init(userActivityChartRef.value)
    userActivityChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value',
        name: '活跃用户数'
      },
      series: [{
        data: [1200, 1500, 1800, 2100, 1900, 1600, 1300],
        type: 'line',
        smooth: true,
        areaStyle: {}
      }]
    })

    // 费用数据趋势图
    feeDataChart = echarts.init(feeDataChartRef.value)
    feeDataChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value',
        name: '费用金额 (元)'
      },
      series: [{
        data: [25000, 32000, 28000, 45000, 38000, 31000, 29000],
        type: 'line',
        smooth: true
      }]
    })

    // 性能指标趋势图
    performanceChart = echarts.init(performanceChartRef.value)
    performanceChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value',
        name: '响应时间 (ms)'
      },
      series: [{
        data: [120, 150, 180, 200, 170, 140, 130],
        type: 'line',
        smooth: true
      }]
    })

    // 业务指标监控图
    businessChart = echarts.init(businessChartRef.value)
    businessChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value',
        name: '业务量'
      },
      series: [{
        data: [800, 1200, 1500, 1800, 1600, 1300, 1000],
        type: 'line',
        smooth: true
      }]
    })
  }
}

// 时间范围变更
const handleTimeChange = () => {
  console.log('🕒 时间范围变更:', timeRange.value)
  ElMessage.info('时间范围已更新')
}

// 刷新数据
const handleRefresh = async () => {
  ElMessage.info('正在刷新实时数据...')
  try {
    // 调用API获取真实的实时数据
    const response = await systemApi.getSystemStats()
    const data = response.data || response
    
    // 更新实时数据
    if (data && data.realtimeData) {
      realtimeData.value.onlineUsers = data.realtimeData.onlineUsers || realtimeData.value.onlineUsers
      realtimeData.value.qps = data.realtimeData.qps || realtimeData.value.qps
      realtimeData.value.exceptions = data.realtimeData.exceptions || realtimeData.value.exceptions
      realtimeData.value.todayIncome = data.realtimeData.todayIncome || realtimeData.value.todayIncome
      realtimeData.value.activeUsers = data.realtimeData.activeUsers || realtimeData.value.activeUsers
      realtimeData.value.newUserCount = data.realtimeData.newUserCount || realtimeData.value.newUserCount
      realtimeData.value.feeTransactions = data.realtimeData.feeTransactions || realtimeData.value.feeTransactions
      realtimeData.value.feeAmount = data.realtimeData.feeAmount || realtimeData.value.feeAmount
      realtimeData.value.responseTime = data.realtimeData.responseTime || realtimeData.value.responseTime
      realtimeData.value.throughput = data.realtimeData.throughput || realtimeData.value.throughput
      realtimeData.value.businessVolume = data.realtimeData.businessVolume || realtimeData.value.businessVolume
      realtimeData.value.alertCount = data.realtimeData.alertCount || realtimeData.value.alertCount
      
      // 更新趋势数据
      if (data.realtimeData.trends) {
        realtimeData.value.onlineUsersTrend = data.realtimeData.trends.onlineUsersTrend || realtimeData.value.onlineUsersTrend
        realtimeData.value.qpsTrend = data.realtimeData.trends.qpsTrend || realtimeData.value.qpsTrend
        realtimeData.value.exceptionsTrend = data.realtimeData.trends.exceptionsTrend || realtimeData.value.exceptionsTrend
        realtimeData.value.incomeTrend = data.realtimeData.trends.incomeTrend || realtimeData.value.incomeTrend
      }
    } else {
      ElMessage.warning('暂无实时数据')
    }
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('❌ 刷新实时数据失败:', error)
    ElMessage.error('刷新实时数据失败: ' + (error as Error).message)
  }
}

// 日志级别变更
const handleLogLevelChange = async () => {
  console.log('📝 日志级别变更:', logLevel.value)
  ElMessage.info('正在获取日志数据...')
  
  try {
    // 调用API获取日志数据
    const response = await systemApi.getLogs({ level: logLevel.value })
    const logs = response.data || response
    
    // 更新日志列表
    if (Array.isArray(logs)) {
      logList.value = logs.map(log => ({
        time: log.time || new Date().toLocaleString(),
        level: log.level || 'info',
        message: log.message || ''
      }))
    } else {
      ElMessage.warning('暂无日志数据')
    }
    
    ElMessage.success('日志数据获取成功')
    scrollToBottom()
  } catch (error) {
    console.error('❌ 获取日志数据失败:', error)
    ElMessage.error('获取日志数据失败: ' + (error as Error).message)
  }
}

// 滚动日志到底部
const scrollToBottom = () => {
  if (logContainerRef.value) {
    logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
  }
}

// 清除已读告警
const handleClearAlerts = () => {
  alertList.value = alertList.value.filter(alert => alert.status === 'active')
  ElMessage.success('已清除已读告警')
}

// 确认告警
const handleAcknowledgeAlert = (alert: any) => {
  const index = alertList.value.findIndex(item => item.id === alert.id)
  if (index !== -1) {
    alertList.value[index].status = 'acknowledged'
    ElMessage.success('告警已确认')
  }
}

// 窗口大小变更处理
const handleResize = () => {
  if (userActivityChart) userActivityChart.resize()
  if (feeDataChart) feeDataChart.resize()
  if (performanceChart) performanceChart.resize()
  if (businessChart) businessChart.resize()
}

// 组件挂载
onMounted(async () => {
  console.log('📊 实时监控仪表盘页面加载完成')
  await initCharts()
  scrollToBottom()
  window.addEventListener('resize', handleResize)
  
  // 初始加载实时数据
  await handleRefresh()
  
  // 初始加载日志数据
  await handleLogLevelChange()
})

// 组件卸载前
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (userActivityChart) userActivityChart.dispose()
  if (feeDataChart) feeDataChart.dispose()
  if (performanceChart) performanceChart.dispose()
  if (businessChart) businessChart.dispose()
})

/**
 * 实时监控仪表盘页面
 * 展示系统实时运行状态和关键指标
 */
</script>

<style scoped>
.realtime-dashboard-container {
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

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-header {
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

.bg-success {
  background-color: #67C23A;
}

.bg-primary {
  background-color: #409EFF;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-info {
  background-color: #909399;
}

.bg-danger {
  background-color: #F56C6C;
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

.log-container {
  height: 200px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.log-item {
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 5px;
  padding: 2px 5px;
  border-radius: 3px;
}

.log-info {
  background-color: #ecf5ff;
  color: #409eff;
}

.log-warn {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.log-error {
  background-color: #fef0f0;
  color: #f56c6c;
}

.log-time {
  color: #909399;
  margin-right: 10px;
}

.log-level {
  font-weight: bold;
  margin-right: 10px;
}
</style>