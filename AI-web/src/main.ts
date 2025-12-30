import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import authStorageService from './services/authStorageService'
import { startCommandPolling, checkAutoRefresh, stopCommandPolling } from './composables/useClientCommandHandler'

// 应用启动时检查并清理无效的认证数据
authStorageService.getAuthState()

// 检查是否需要自动刷新
checkAutoRefresh()

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')

// 用户登录后开始轮询命令
const originalPush = router.push.bind(router)
router.push = (to: any) => {
  const result = originalPush(to)
  checkAutoRefresh()
  return result
}

// 页面可见性变化时检查
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkAutoRefresh()
  }
})

// 用户登录后开始轮询
const checkAndStartPolling = () => {
  const token = localStorage.getItem('access_token')
  if (token) {
    startCommandPolling()
  }
}

// 延迟启动，等待认证初始化完成
setTimeout(checkAndStartPolling, 1000)