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
          成员列表 ({{ totalMembers }})
        </el-button>
        <el-button 
          @click="router.push('/dashboard/member/invite')"
          type="success"
        >
          <el-icon><UserFilled /></el-icon>
          邀请成员
        </el-button>
      </div>
    </div>

    <div class="content-section">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-section">
        <el-col :span="6" v-for="stat in memberStats" :key="stat.key">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" :style="{ background: stat.color }">
                <el-icon :size="24" color="white">
                  <component :is="stat.icon" />
                </el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stat.value }}</h3>
                <p>{{ stat.label }}</p>
                <span class="stat-trend" :class="stat.trend">
                  {{ stat.change > 0 ? '+' : '' }}{{ stat.change }}
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最近活动 -->
      <el-row :gutter="20" class="activity-section">
        <el-col :span="16">
          <el-card class="recent-activity">
            <template #header>
              <div class="card-header">
                <span>最近活动</span>
                <el-button size="small" @click="router.push('/dashboard/member/list')">
                  查看全部
                </el-button>
              </div>
            </template>
            
            <div class="activity-list">
              <div 
                v-for="activity in recentActivities" 
                :key="activity.id"
                class="activity-item"
              >
                <div class="activity-avatar">
                  <el-avatar :size="32">
                    {{ activity.member.charAt(0) }}
                  </el-avatar>
                </div>
                <div class="activity-content">
                  <p class="activity-desc">{{ activity.description }}</p>
                  <span class="activity-time">{{ formatTime(activity.time) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
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
                    :percentage="80" 
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
                  <span class="value">￥{{ averageCost }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  List, 
  UserFilled, 
  Phone, 
  ChatDotRound, 
  Setting,
  TrendCharts,
  Calendar,
  Money,
  Bell,
  Promotion
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const loading = ref(false)

// 统计数据
const memberStats = ref([
  {
    key: 'total',
    label: '总成员数',
    value: 12,
    change: 2,
    icon: 'UserFilled',
    color: '#409EFF'
  },
  {
    key: 'active',
    label: '活跃成员',
    value: 10,
    change: 1,
    icon: 'TrendCharts',
    color: '#67C23A'
  },
  {
    key: 'pending',
    label: '待确认',
    value: 1,
    change: -1,
    icon: 'Calendar',
    color: '#E6A23C'
  },
  {
    key: 'cost',
    label: '平均费用',
    value: 156,
    change: 12,
    icon: 'Money',
    color: '#F56C6C'
  }
])

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    member: '张三',
    description: '完成了费用分摊确认',
    time: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 2,
    member: '李四',
    description: '加入了宿舍群聊',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 3,
    member: '王五',
    description: '完成了今日清洁任务',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: 4,
    member: '赵六',
    description: '更新了个人资料',
    time: new Date(Date.now() - 6 * 60 * 60 * 1000)
  }
])



// 计算属性
const totalMembers = computed(() => memberStats.value[0].value)
const adminCount = computed(() => 2)
const memberCount = computed(() => totalMembers.value - adminCount.value)
const averageCost = computed(() => memberStats.value[3].value)

// 方法
const loadDashboardData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('加载成员管理仪表板数据')
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}



onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.member-management {
  padding: 0;
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

.activity-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-content {
  flex: 1;
}

.activity-desc {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 14px;
}

.activity-time {
  color: #909399;
  font-size: 12px;
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

@media (max-width: 768px) {
  .stats-section .el-col {
    margin-bottom: 16px;
  }
  
  .activity-section .el-col {
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
  

  
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}
</style>