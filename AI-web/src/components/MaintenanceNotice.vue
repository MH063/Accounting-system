<template>
  <div v-if="showNotice" class="maintenance-notice" :class="{ 'maintenance-active': isActive }">
    <div class="notice-content">
      <el-badge :value="timeLeft" class="maintenance-badge" type="danger">
        <el-icon class="warning-icon"><Warning /></el-icon>
      </el-badge>
      <div class="notice-text">
        <p class="main-message">{{ noticeMessage }}</p>
        <p class="sub-message" v-if="isActive">系统将在 {{ timeLeft }} 后暂停服务</p>
        <p class="sub-message" v-else>系统维护中，服务暂不可用</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Warning } from '@element-plus/icons-vue'
import { getMaintenanceStatus } from '@/services/maintenanceService'

// 响应式数据
const showNotice = ref(false)
const isActive = ref(false)  // true表示倒计时中，false表示已开始维护
const timeLeft = ref('')
const noticeMessage = ref('系统即将进入维护模式')

let countdownTimer: NodeJS.Timeout | null = null
let checkStatusTimer: NodeJS.Timeout | null = null

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`
  } else {
    return `${secs}秒`
  }
}

// 检查维护状态
const checkMaintenanceStatus = async () => {
  try {
    const status = await getMaintenanceStatus()
    
    if (status && status.enabled) {
      showNotice.value = true
      
      if (status.active) {
        // 已经在维护中
        isActive.value = false
        noticeMessage.value = status.message || '系统正在维护中'
        timeLeft.value = '维护中'
      } else {
        // 倒计时中
        isActive.value = true
        noticeMessage.value = status.message || '系统即将进入维护模式'
        
        // 计算剩余时间
        const now = new Date().getTime()
        const endTime = new Date(status.effectiveTime).getTime()
        const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000))
        
        timeLeft.value = formatTime(remainingSeconds)
        
        // 启动倒计时
        startCountdown(remainingSeconds)
      }
    } else {
      showNotice.value = false
      // 停止所有计时器
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }
  } catch (error) {
    console.error('检查维护状态失败:', error)
  }
}

// 启动倒计时
const startCountdown = (totalSeconds: number) => {
  // 清除之前的计时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
  let remainingSeconds = totalSeconds
  
  // 立即更新一次显示
  timeLeft.value = formatTime(remainingSeconds)
  
  countdownTimer = setInterval(() => {
    remainingSeconds--
    
    if (remainingSeconds <= 0) {
      // 倒计时结束
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
      
      // 切换到维护中状态
      isActive.value = false
      timeLeft.value = '维护中'
      noticeMessage.value = '系统正在维护中'
    } else {
      timeLeft.value = formatTime(remainingSeconds)
    }
  }, 1000)
}

// 组件挂载时
onMounted(() => {
  // 立即检查一次状态
  checkMaintenanceStatus()
  
  // 每30秒检查一次维护状态
  checkStatusTimer = setInterval(() => {
    checkMaintenanceStatus()
  }, 30000)
})

// 组件卸载时
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
  if (checkStatusTimer) {
    clearInterval(checkStatusTimer)
  }
})
</script>

<style scoped>
.maintenance-notice {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #fff6f6;
  border-bottom: 1px solid #ffcccc;
  padding: 10px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.maintenance-notice.maintenance-active {
  background-color: #fffbe6;
  border-bottom: 1px solid #ffe58f;
}

.notice-content {
  display: flex;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.warning-icon {
  font-size: 24px;
  color: #ff4d4f;
  margin-right: 10px;
}

.notice-text {
  flex: 1;
}

.main-message {
  font-weight: bold;
  color: #333;
  margin: 0;
  font-size: 14px;
}

.sub-message {
  color: #666;
  margin: 3px 0 0 0;
  font-size: 12px;
}

.maintenance-badge :deep(.el-badge__content) {
  background-color: #ff4d4f;
  border: none;
}

@media (max-width: 768px) {
  .maintenance-notice {
    padding: 8px 15px;
  }
  
  .notice-content {
    flex-direction: column;
    text-align: center;
  }
  
  .warning-icon {
    margin-right: 0;
    margin-bottom: 5px;
  }
}
</style>