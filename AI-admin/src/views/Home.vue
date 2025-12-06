<template>
  <div class="home">
    <div class="dashboard">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">用户总数</div>
                <div class="stat-value">{{ userStats.total || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon size="24"><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">文章总数</div>
                <div class="stat-value">{{ systemStats.articles || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon size="24"><View /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">访问总量</div>
                <div class="stat-value">{{ systemStats.visits || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon size="24"><ChatLineSquare /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">消息总数</div>
                <div class="stat-value">{{ systemStats.messages || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>数据统计</span>
              </div>
            </template>
            <div id="chart" style="height: 300px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>系统日志</span>
                <el-button size="small" @click="refreshLogs">刷新</el-button>
              </div>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(activity, index) in activities"
                :key="index"
                :timestamp="activity.timestamp"
              >
                {{ activity.content }}
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { User, Document, View, ChatLineSquare } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { userApi, systemApi } from '../api/user'

// 响应式数据
const userStats = ref<any>({})
const systemStats = ref<any>({})
const activities = ref<any[]>([])

// 加载统计数据
const loadStats = async () => {
  try {
    console.log('🔄 开始加载统计数据...')
    
    // 获取用户统计
    const userStatsData = await userApi.getUserStats()
    console.log('✅ 用户统计数据:', userStatsData)
    userStats.value = userStatsData || {}
    
    // 获取系统统计
    const systemStatsData = await systemApi.getSystemStats()
    console.log('✅ 系统统计数据:', systemStatsData)
    systemStats.value = systemStatsData || {}
    
  } catch (error: any) {
    console.error('❌ 加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败，请检查网络连接')
    
    // 使用默认数据
    userStats.value = { total: 0 }
    systemStats.value = { articles: 0, visits: 0, messages: 0 }
  }
}

// 加载系统日志
const loadLogs = async () => {
  try {
    console.log('🔄 开始加载系统日志...')
    const logsData = await systemApi.getLogs({ pageSize: 5 })
    console.log('✅ 日志数据:', logsData)
    
    activities.value = Array.isArray(logsData) ? logsData.map((log: any) => ({
      content: log.message || log.content || '系统日志',
      timestamp: log.createdAt || log.timestamp || new Date().toLocaleString()
    })) : [];
    
  } catch (error: any) {
    console.error('❌ 加载日志失败:', error)
    
    // 使用默认活动数据
    activities.value = [
      {
        content: '系统启动成功',
        timestamp: new Date().toLocaleString()
      },
      {
        content: 'API服务正常运行',
        timestamp: new Date(Date.now() - 60000).toLocaleString()
      }
    ]
  }
}

// 刷新日志
const refreshLogs = () => {
  loadLogs()
}

// 初始化图表
onMounted(() => {
  console.log('🏠 首页组件加载完成，开始初始化...')
  
  // 加载数据
  loadStats()
  loadLogs()
  
  // 初始化图表（使用模拟数据）
  setTimeout(() => {
    const chartDom = document.getElementById('chart')
    if (chartDom) {
      const myChart = echarts.init(chartDom)
      const option = {
        title: {
          text: '月度访问量统计'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['访问量', '用户量']
        },
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月', '6月']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '访问量',
            data: [820, 932, 901, 934, 1290, 1330],
            type: 'line'
          },
          {
            name: '用户量',
            data: [620, 732, 701, 734, 1090, 1130],
            type: 'line'
          }
        ]
      }
      myChart.setOption(option)
    }
  }, 500)
})

/**
 * 首页组件
 * 展示系统概览信息和数据统计
 */
</script>

<style scoped>
.home {
  width: 100%;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
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
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
