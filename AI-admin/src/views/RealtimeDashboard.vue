<template>
  <div class="realtime-dashboard-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="header-section">
          <h2>实时监控仪表盘</h2>
          <el-tag type="success" effect="dark">
            <el-icon><Refresh /></el-icon> 实时更新中
          </el-tag>
        </div>
      </el-col>
    </el-row>

    <!-- 实时状态概览 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6" v-for="item in realtimeStats" :key="item.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="stat-footer">
              <span class="trend" :class="item.trend >= 0 ? 'up' : 'down'">
                <el-icon><component :is="item.trend >= 0 ? 'Top' : 'Bottom'" /></el-icon>
                {{ Math.abs(item.trend) }}%
              </span>
              <span class="label">较上小时</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 实时流量图表 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>实时流量监控 (每 5 秒更新)</span>
            </div>
          </template>
          <div ref="trafficChartRef" style="height: 400px;"></div>
        </el-card>
      </el-col>

      <!-- 系统负载 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统负载</span>
            </div>
          </template>
          <div ref="loadChartRef" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 实时日志流 -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>实时系统日志</span>
              <el-button type="primary" size="small" plain @click="logs = []">清空日志</el-button>
            </div>
          </template>
          <div class="log-stream">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <span class="log-time">[{{ log.time }}]</span>
              <el-tag :type="log.type" size="small" class="log-tag">{{ log.level }}</el-tag>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive } from 'vue'
import { Refresh, Top, Bottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 图表引用
const trafficChartRef = ref()
const loadChartRef = ref()

// 状态数据
const realtimeStats = ref([
  { title: '当前在线用户', value: '128', color: '#409EFF', trend: 5.2 },
  { title: '每秒请求数 (QPS)', value: '45', color: '#67C23A', trend: -2.1 },
  { title: '平均响应耗时', value: '124ms', color: '#E6A23C', trend: -1.5 },
  { title: '错误率', value: '0.02%', color: '#F56C6C', trend: 0.1 }
])

// 日志数据
const logs = ref([
  { time: new Date().toLocaleTimeString(), level: 'INFO', type: 'info', message: '系统启动成功' },
  { time: new Date().toLocaleTimeString(), level: 'INFO', type: 'info', message: '连接到 Redis 服务器' },
  { time: new Date().toLocaleTimeString(), level: 'WARN', type: 'warning', message: '检测到异常登录尝试' }
])

// 定时器
let timer: any = null
let trafficChart: any = null
let loadChart: any = null

// 初始化图表
const initCharts = () => {
  if (trafficChartRef.value) {
    trafficChart = echarts.init(trafficChartRef.value)
    const option = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: Array.from({ length: 20 }, (_, i) => `${i}s前`)
      },
      yAxis: { type: 'value' },
      series: [{
        name: '流量',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: Array.from({ length: 20 }, () => Math.floor(Math.random() * 100))
      }]
    }
    trafficChart.setOption(option)
  }

  if (loadChartRef.value) {
    loadChart = echarts.init(loadChartRef.value)
    const option = {
      tooltip: { formatter: '{a} <br/>{b} : {c}%' },
      series: [{
        name: 'CPU使用率',
        type: 'gauge',
        detail: { formatter: '{value}%' },
        data: [{ value: 45, name: 'CPU' }]
      }]
    }
    loadChart.setOption(option)
  }
}

// 模拟数据更新
const updateData = () => {
  // 更新统计卡片
  realtimeStats.value[0].value = (parseInt(realtimeStats.value[0].value) + Math.floor(Math.random() * 5 - 2)).toString()
  
  // 更新图表
  if (trafficChart) {
    const option = trafficChart.getOption()
    const data = option.series[0].data as number[]
    data.shift()
    data.push(Math.floor(Math.random() * 100))
    trafficChart.setOption({ series: [{ data }] })
  }

  if (loadChart) {
    loadChart.setOption({
      series: [{ data: [{ value: Math.floor(Math.random() * 30 + 30), name: 'CPU' }] }]
    })
  }

  // 添加模拟日志
  const messages = [
    '用户 1024 登录系统',
    '数据同步完成',
    '清理缓存文件 128MB',
    '备份数据库成功',
    'API 响应延迟增加'
  ]
  const levels = ['INFO', 'INFO', 'WARN', 'INFO', 'ERROR']
  const types = ['info', 'info', 'warning', 'info', 'danger']
  const idx = Math.floor(Math.random() * messages.length)
  
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    level: levels[idx],
    type: types[idx] as any,
    message: messages[idx]
  })
  if (logs.value.length > 50) logs.value.pop()
}

onMounted(() => {
  initCharts()
  timer = setInterval(updateData, 5000)
  window.addEventListener('resize', () => {
    trafficChart?.resize()
    loadChart?.resize()
  })
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  trafficChart?.dispose()
  loadChart?.dispose()
})
</script>

<style scoped>
.realtime-dashboard-container {
  padding: 10px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}

.stat-footer {
  font-size: 12px;
  color: #909399;
}

.trend {
  margin-right: 5px;
  font-weight: bold;
}

.trend.up { color: #F56C6C; }
.trend.down { color: #67C23A; }

.log-stream {
  height: 200px;
  overflow-y: auto;
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 10px;
  font-family: monospace;
  border-radius: 4px;
}

.log-item {
  margin-bottom: 5px;
  font-size: 12px;
}

.log-time {
  color: #569cd6;
  margin-right: 10px;
}

.log-tag {
  margin-right: 10px;
}

.log-message {
  color: #ce9178;
}
</style>
