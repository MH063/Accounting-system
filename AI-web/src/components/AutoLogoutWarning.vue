<template>
  <Teleport to="body">
    <transition name="auto-logout-fade">
      <div 
        v-show="show" 
        class="auto-logout-overlay"
      >
        <div class="auto-logout-backdrop"></div>
        <div class="auto-logout-dialog">
          <div class="dialog-icon">
            <el-icon :size="48"><Warning /></el-icon>
          </div>
          
          <h2 class="dialog-title">会话安全提醒</h2>
          
          <p class="dialog-message">
            检测到您的账号已长时间处于空闲状态
          </p>
          
          <div class="countdown-container">
            <span class="countdown-label">系统将在</span>
            <span class="countdown-time">{{ formattedRemaining }}</span>
            <span class="countdown-label">后自动登出</span>
          </div>
          
          <div class="activity-hint">
            <p>请移动鼠标或按任意键继续使用，系统将自动保持会话活跃</p>
          </div>
          
          <p class="security-note">
            <el-icon><Lock /></el-icon>
            自动登出功能可保护您的账号安全
          </p>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { 
  Warning, 
  Lock
} from '@element-plus/icons-vue'

const props = defineProps<{
  show: boolean
  remainingSeconds: number
}>()

const emit = defineEmits<{
  (e: 'keep-alive'): void
}>()

const formattedRemaining = computed(() => {
  const minutes = Math.floor(props.remainingSeconds / 60)
  const seconds = props.remainingSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const handleKeepAlive = () => {
  emit('keep-alive')
}

onMounted(() => {
})

onUnmounted(() => {
})
</script>

<style scoped>
.auto-logout-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auto-logout-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  cursor: pointer;
}

.auto-logout-dialog {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 32px;
  width: 420px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  cursor: default;
}

.dialog-icon {
  color: #e6a23c;
  margin-bottom: 16px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.dialog-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.dialog-message {
  font-size: 14px;
  color: #606266;
  margin: 0 0 24px 0;
}

.countdown-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #fdf6ec 0%, #f5dab1 100%);
  border-radius: 12px;
}

.countdown-label {
  font-size: 14px;
  color: #606266;
}

.countdown-time {
  font-size: 36px;
  font-weight: 700;
  color: #e6a23c;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  min-width: 80px;
}

.activity-hint {
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.activity-hint p {
  font-size: 13px;
  color: #606266;
  margin: 0;
  line-height: 1.6;
}

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.security-note .el-icon {
  color: #67c23a;
}

/* Transition animations */
.auto-logout-fade-enter-active,
.auto-logout-fade-leave-active {
  transition: opacity 0.3s ease;
}

.auto-logout-fade-enter-from,
.auto-logout-fade-leave-to {
  opacity: 0;
}

.auto-logout-fade-enter-active .auto-logout-dialog,
.auto-logout-fade-leave-active .auto-logout-dialog {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.auto-logout-fade-enter-from .auto-logout-dialog,
.auto-logout-fade-leave-to .auto-logout-dialog {
  transform: scale(0.9);
  opacity: 0;
}
</style>
