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
        <el-col :span="6">
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
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><DataLine /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">QPS</div>
                <div class="stat-value">{{ realtimeData.qps }}</div>
                <div class="stat-trend" :class="realtimeData.qpsTrend > 0 ? 'trend-up' : 'trend-down'">
                  <el-icon v-if="realtimeData.qpsTrend > 0"><Top /></el-icon>
                  <el-icon v-else><Bottom /></el-icon>
                  {{ Math.abs(realtimeData.qpsTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-warning">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">异常数量</div>
                <div class="stat-value">{{ realtimeData.exceptions }}</div>
                <div class="stat-trend" :class="realtimeData.exceptionsTrend > 0 ? 'trend-up' : 'trend-down'">
                  <el-icon v-if="realtimeData.exceptionsTrend > 0"><Top /></el-icon>
                  <el-icon v-else><Bottom /></el-icon>
                  {{ Math.abs(realtimeData.exceptionsTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><Coin /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">今日收入</div>
                <div class="stat-value">¥{{ realtimeData.todayIncome }}</div>
                <div class="stat-trend" :class="realtimeData.incomeTrend > 0 ? 'trend-up' : 'trend-down'">
                  <el-icon v-if="realtimeData.incomeTrend > 0"><Top /></el-icon>
                  <el-icon v-else><Bottom /></el-icon>
                  {{ Math.abs(realtimeData.incomeTrend) }}%
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
                <span>系统负载趋势</span>
              </div>
            </template>
            <div ref="loadChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>请求响应时间</span>
              </div>
            </template>
            <div ref="responseTimeChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>内存使用率</span>
              </div>
            </template>
            <div ref="memoryChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>CPU使用率</span>
              </div>
            </template>
            <div ref="cpuChartRef" style="height: 300px;"></div>
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { User, DataLine, Warning, Coin, Top, Bottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

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
  incomeTrend: 5.3
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

// 图表引用
const loadChartRef = ref()
const responseTimeChartRef = ref()
const memoryChartRef = ref()
const cpuChartRef = ref()
const logContainerRef = ref()

// 图表实例
let loadChart: echarts.ECharts
let responseTimeChart: echarts.ECharts
let memoryChart: echarts.ECharts
let cpuChart: echarts.ECharts

// 初始化图表
const initCharts = () => {
  // 系统负载趋势图
  loadChart = echarts.init(loadChartRef.value)
  loadChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value',
      name: '负载 (%)'
    },
    series: [{
      data: [30, 45, 60, 75, 65, 50, 40],
      type: 'line',
      smooth: true,
      areaStyle: {}
    }]
  })

  // 请求响应时间图
  responseTimeChart = echarts.init(responseTimeChartRef.value)
  responseTimeChart.setOption({
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

  // 内存使用率图
  memoryChart = echarts.init(memoryChartRef.value)
  memoryChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value',
      name: '使用率 (%)'
    },
    series: [{
      data: [45, 52, 60, 68, 72, 65, 58],
      type: 'line',
      smooth: true
    }]
  })

  // CPU使用率图
  cpuChart = echarts.init(cpuChartRef.value)
  cpuChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value',
      name: '使用率 (%)'
    },
    series: [{
      data: [25, 35, 45, 55, 60, 50, 40],
      type: 'line',
      smooth: true
    }]
  })
}

// 时间范围变更
const handleTimeChange = () => {
  console.log('🕒 时间范围变更:', timeRange.value)
  ElMessage.info('时间范围已更新')
}

// 刷新数据
const handleRefresh = () => {
  console.log('🔄 刷新实时数据')
  ElMessage.success('数据刷新成功')
}

// 日志级别变更
const handleLogLevelChange = () => {
  console.log('📝 日志级别变更:', logLevel.value)
  ElMessage.info('日志级别已更新')
}

// 滚动日志到底部
const scrollToBottom = () => {
  if (logContainerRef.value) {
    logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
  }
}

// 窗口大小变更处理
const handleResize = () => {
  if (loadChart) loadChart.resize()
  if (responseTimeChart) responseTimeChart.resize()
  if (memoryChart) memoryChart.resize()
  if (cpuChart) cpuChart.resize()
}

// 组件挂载
onMounted(() => {
  console.log('📊 实时监控仪表盘页面加载完成')
  initCharts()
  scrollToBottom()
  window.addEventListener('resize', handleResize)
})

// 组件卸载前
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (loadChart) loadChart.dispose()
  if (responseTimeChart) responseTimeChart.dispose()
  if (memoryChart) memoryChart.dispose()
  if (cpuChart) cpuChart.dispose()
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