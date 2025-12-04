<template>
  <div class="error-boundary">
    <slot v-if="!hasError" />
    <div v-else class="error-container">
      <div class="error-content">
        <el-icon class="error-icon" :size="64"><Warning /></el-icon>
        <h3 class="error-title">页面渲染出错</h3>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="error-actions">
          <el-button type="primary" @click="resetError">重新加载</el-button>
          <el-button @click="goHome">返回首页</el-button>
        </div>
        <details v-if="showDetails" class="error-details">
          <summary>查看详细信息</summary>
          <pre class="error-stack">{{ errorStack }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'

const router = useRouter()

const hasError = ref(false)
const errorMessage = ref('')
const errorStack = ref('')
const showDetails = ref(false)

// 错误处理函数
const handleError = (error: Error, instance: any, info: string) => {
  console.error('ErrorBoundary捕获错误:', error)
  console.error('错误信息:', info)
  
  hasError.value = true
  errorMessage.value = error.message || '未知错误'
  errorStack.value = error.stack || ''
  
  // 记录错误日志
  logError(error, info)
  
  // 显示用户友好的错误消息
  ElMessage.error('页面渲染出错，请尝试刷新页面')
  
  return false // 阻止错误继续向上传播
}

// 记录错误日志
const logError = (error: Error, info: string) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    info: info,
    url: window.location.href,
    userAgent: navigator.userAgent
  }
  
  // 这里可以将错误日志发送到后端
  console.error('错误日志:', errorLog)
}

// 重置错误状态
const resetError = async () => {
  hasError.value = false
  errorMessage.value = ''
  errorStack.value = ''
  
  // 等待DOM更新完成
  await nextTick()
  
  // 重新加载当前路由
  router.replace({ path: '/redirect' + router.currentRoute.value.fullPath })
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 捕获子组件错误
onErrorCaptured((error, instance, info) => {
  return handleError(error, instance, info)
})
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 20px;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-icon {
  color: #f56c6c;
  margin-bottom: 16px;
}

.error-title {
  color: #303133;
  margin-bottom: 12px;
  font-size: 18px;
}

.error-message {
  color: #606266;
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.error-details {
  margin-top: 20px;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: #409eff;
  font-size: 12px;
  margin-bottom: 8px;
}

.error-stack {
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  color: #606266;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
</style>