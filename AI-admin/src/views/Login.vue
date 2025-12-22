<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>管理系统登录</h2>
        <p>欢迎使用记账管理系统</p>
      </div>
      
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名" 
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import store from '@/store'
import { adminAuthApi } from '@/api/adminAuth'

// 路由和状态管理实例
const router = useRouter()

// 响应式数据
const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rememberMe = ref(true)

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      
      try {
        // 调用管理员登录API
        console.log('正在调用管理员登录接口...', { username: loginForm.username })
        
        const response = await adminAuthApi.adminLogin({
          username: loginForm.username,
          password: loginForm.password
        })
        
        console.log('管理员登录接口响应:', response)
        
        // 检查响应数据结构
        if (response && response.user && response.tokens) {
          const adminData = response
          
          // 构建管理员用户数据
          const userData = {
            id: adminData.id || adminData.userId,
            name: adminData.username || adminData.name || loginForm.username,
            role: 'admin',
            permissions: adminData.permissions || ['*'],
            avatar: adminData.avatar || '',
            email: adminData.email || `${loginForm.username}@example.com`,
            loginTime: Date.now(),
            token: adminData.tokens.accessToken,
            refreshToken: adminData.tokens.refreshToken
          }
          
          console.log('管理员登录成功，用户数据:', userData)
          
          // 调用Vuex的login action
          store.dispatch('user/login', userData)
          
          // 如果选择了记住我，保存用户名
          if (rememberMe.value) {
            localStorage.setItem('savedUsername', loginForm.username)
          } else {
            localStorage.removeItem('savedUsername')
          }
          
          ElMessage.success('管理员登录成功')
          
          // 跳转到首页
          router.push('/')
        } else {
          throw new Error(response?.message || '登录失败')
        }
      } catch (error: any) {
        console.error('管理员登录失败:', error)
        
        // 处理不同类型的错误
        let errorMessage = '登录失败'
        if (error.response) {
          // 服务器响应错误
          const errorData = error.response.data
          if (errorData && errorData.message) {
            errorMessage = errorData.message
          } else if (error.response.status === 401) {
            errorMessage = '用户名或密码错误'
          } else if (error.response.status === 403) {
            errorMessage = '权限不足或账户被锁定'
          } else if (error.response.status === 429) {
            errorMessage = '登录尝试过于频繁，请稍后再试'
          } else {
            errorMessage = `登录失败 (${error.response.status})`
          }
        } else if (error.request) {
          // 网络错误
          errorMessage = '网络连接失败，请检查服务器状态'
        } else {
          // 其他错误
          errorMessage = error.message || '登录失败'
        }
        
        ElMessage.error(errorMessage)
      } finally {
        loading.value = false
      }
    } else {
      console.log('表单验证失败')
      return false
    }
  })
}

// 页面加载时检查是否记住用户
onMounted(() => {
  const savedUsername = localStorage.getItem('savedUsername')
  if (savedUsername) {
    loginForm.username = savedUsername
    rememberMe.value = true
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px 30px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
  margin-top: 20px;
}
</style>