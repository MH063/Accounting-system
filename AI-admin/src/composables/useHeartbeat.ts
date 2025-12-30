import { ref, onMounted, onUnmounted } from 'vue'
import { adminAuthApi } from '@/api/adminAuth'

/**
 * 管理员心跳上报 Hook
 * 用于定期向服务器发送心跳，维持在线状态并更新审计日志
 */
export function useHeartbeat() {
  const heartbeatTimer = ref<number | null>(null)
  const isStarted = ref(false)

  /**
   * 发送单次心跳
   */
  const sendHeartbeat = async (retryCount = 0) => {
    try {
      // 直接从 localStorage 获取令牌
      const adminToken = localStorage.getItem('adminToken')
      const isLoggedIn = !!adminToken
      
      if (!isLoggedIn) {
        console.log('💓 心跳跳过: 未登录')
        stopHeartbeat()
        return
      }

      if (!adminToken) {
        if (retryCount < 3) {
          console.log(`💓 令牌缺失，${retryCount + 1}次重试中...`)
          setTimeout(() => sendHeartbeat(retryCount + 1), 1000)
          return
        }
        console.log('💓 心跳跳过: 令牌彻底缺失')
        stopHeartbeat()
        return
      }

      await adminAuthApi.heartbeat()
      console.log('💓 管理员心跳上报成功')
    } catch (error) {
      const axiosError = error as any
      const status = axiosError.response?.status
      const message = axiosError.response?.data?.message || axiosError.message

      console.warn('💔 管理员心跳上报失败:', message, `(${status})`)

      if (status === 401) {
        console.log('💔 心跳停止: 未授权 (401)')
        stopHeartbeat()
      } else if (status === 403) {
        const code = axiosError.response?.data?.code
        if (code === 'NO_TOKEN') {
          console.log('💔 心跳停止: 缺少认证令牌')
        } else {
          console.log('💔 心跳停止: 权限不足 (403)')
        }
        stopHeartbeat()
      }
    }
  }

  /**
   * 启动心跳定时器
   * @param interval 心跳间隔（毫秒），默认 30 秒
   */
  const startHeartbeat = (interval: number = 30000) => {
    if (isStarted.value) return

    console.log('🚀 启动管理员心跳上报定时器')
    isStarted.value = true
    
    // 立即发送一次心跳
    sendHeartbeat()
    
    // 设置定时器
    heartbeatTimer.value = window.setInterval(sendHeartbeat, interval)
  }

  /**
   * 停止心跳定时器
   */
  const stopHeartbeat = () => {
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value)
      heartbeatTimer.value = null
      isStarted.value = false
      console.log('🛑 停止管理员心跳上报定时器')
    }
  }

  // 组件卸载时自动停止心跳
  onUnmounted(() => {
    stopHeartbeat()
  })

  return {
    startHeartbeat,
    stopHeartbeat,
    isStarted
  }
}
