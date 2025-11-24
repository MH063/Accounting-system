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
                <div class="stat-value">1,234</div>
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
                <div class="stat-value">567</div>
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
                <div class="stat-value">89,012</div>
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
                <div class="stat-value">3,456</div>
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
                <span>最新动态</span>
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

// 动态数据
const activities = ref([
  {
    content: '用户张三登录系统',
    timestamp: '2024-01-15 10:30:00'
  },
  {
    content: '发布了新文章《Vue3开发指南》',
    timestamp: '2024-01-15 09:45:00'
  },
  {
    content: '系统更新至v2.1.0版本',
    timestamp: '2024-01-14 16:20:00'
  },
  {
    content: '新增用户5名',
    timestamp: '2024-01-14 14:15:00'
  }
])

// 初始化图表
onMounted(() => {
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