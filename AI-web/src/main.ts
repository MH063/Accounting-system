import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import authStorageService from './services/authStorageService'

// 应用启动时检查并清理无效的认证数据
authStorageService.getAuthState()

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')