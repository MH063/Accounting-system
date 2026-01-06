import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'

/**
 * WebSocket 客户端 Hook
 * 用于监听后端服务的实时通知，如强制退出广播
 */
export function useWebSocket() {
  const socket = ref<WebSocket | null>(null)
  const reconnectTimer = ref<number | null>(null)
  const isConnected = ref(false)

  /**
   * 初始化 WebSocket 连接
   */
  const initWebSocket = () => {
    // 如果已经连接或正在连接，则不重新初始化
    if (socket.value && (socket.value.readyState === WebSocket.OPEN || socket.value.readyState === WebSocket.CONNECTING)) {
      return
    }

    const wsUrl = `ws://${window.location.hostname}:4000/ws`
    console.log('🔌 正在连接 WebSocket:', wsUrl)

    try {
      socket.value = new WebSocket(wsUrl)

      socket.value.onopen = () => {
        console.log('✅ WebSocket 连接成功')
        isConnected.value = true
        if (reconnectTimer.value) {
          clearTimeout(reconnectTimer.value)
          reconnectTimer.value = null
        }
      }

      socket.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (e) {
          console.warn('⚠️ 收到非 JSON 格式消息:', event.data)
        }
      }

      socket.value.onclose = () => {
        console.warn('🔌 WebSocket 连接已关闭')
        isConnected.value = false
        // 尝试重连 (5秒后)
        reconnectTimer.value = window.setTimeout(initWebSocket, 5000)
      }

      socket.value.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error)
        socket.value?.close()
      }
    } catch (error) {
      console.error('❌ 初始化 WebSocket 失败:', error)
      reconnectTimer.value = window.setTimeout(initWebSocket, 5000)
    }
  }

  /**
   * 处理接收到的消息
   */
  const handleMessage = (data: any) => {
    console.log('📩 收到 WebSocket 消息:', data)

    if (data.type === 'FORCE_LOGOUT') {
      handleForceLogout(data.payload?.message)
    } else if (data.type === 'CONFIG_UPDATED') {
      handleConfigUpdate(data.payload)
    }
  }

  /**
   * 处理配置更新通知
   */
  const handleConfigUpdate = (payload: any) => {
    console.log('⚙️ 收到配置更新通知:', payload)
    
    // 如果包含安全配置，提示用户
    const hasSecurityConfig = payload.keys?.some((key: string) => key.startsWith('security.'))
    if (hasSecurityConfig) {
      ElMessage({
        message: '系统安全配置已由管理员更新，部分设置可能需要重新加载。',
        type: 'info',
        duration: 5000,
        showClose: true
      })
    }
  }

  /**
   * 处理强制退出逻辑
   */
  const handleForceLogout = (message: string) => {
    console.warn('🚨 触发强制退出逻辑')

    // 清除本地存储的 Token 和相关信息
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    
    // 停止心跳（由 App.vue 监听 isLoggedIn 变化自动处理，但这里为了安全也可以显式调用）
    
    // 记录强制退出日志
    const logoutLog = {
      time: new Date().toISOString(),
      reason: 'FORCE_LOGOUT',
      message: message
    }
    console.log('[LOG] 强制退出日志:', logoutLog)
    
    // 提示用户并重定向
    ElMessageBox.alert(message || '后端服务异常退出，系统将强制退出。', '系统通知', {
      confirmButtonText: '确定',
      type: 'warning',
      callback: () => {
        window.location.href = '/login'
      }
    })
    
    // 如果用户 5 秒内没点确定，也自动重定向
    setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }, 5000)
  }

  /**
   * 关闭 WebSocket 连接
   */
  const closeWebSocket = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }
  }

  onMounted(() => {
    // 只有在登录状态下才连接 WebSocket
    if (localStorage.getItem('adminToken')) {
      initWebSocket()
    }
  })

  onUnmounted(() => {
    closeWebSocket()
  })

  return {
    initWebSocket,
    closeWebSocket,
    isConnected
  }
}
