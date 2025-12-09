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
        // 模拟API调用
        // 实际项目中这里应该是调用后端登录接口
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟登录成功
        const userData = {
          id: 1,
          name: loginForm.username,
          role: 'admin',
          permissions: ['*'],
          avatar: '',
          email: `${loginForm.username}@example.com`,
          loginTime: Date.now() // 添加登录时间戳
        }
        
        // 调用Vuex的login action
        store.dispatch('user/login', userData)
        
        ElMessage.success('登录成功')
        
        // 跳转到首页
        router.push('/')
      } catch (error: any) {
        console.error('登录失败:', error)
        ElMessage.error('登录失败: ' + (error.response?.data?.message || error.message || '未知错误'))
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