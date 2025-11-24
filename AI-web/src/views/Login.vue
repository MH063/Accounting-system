<template>
  <div class="login-container">
    <div class="login-wrapper">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-circle">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.09 8.26L19 7L17.74 12.9L24 14L17.74 15.1L19 21L13.09 19.74L12 26L10.91 19.74L5 21L6.26 15.1L0 14L6.26 12.9L5 7L10.91 8.26L12 2Z"/>
              </svg>
            </div>
            <h1 class="brand-title">智能化记账系统</h1>
            <p class="brand-subtitle">智能寝室生活管理，从这里开始</p>
          </div>
          
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <span>智能账单分类</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🤝</div>
              <span>室友共同记账</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📈</div>
              <span>消费数据分析</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧登录表单区域 -->
      <div class="login-section">
        <div class="login-card">
          <div class="card-header">
            <h2>欢迎回来</h2>
            <p>登录到您的账户</p>
          </div>
          
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="login-form">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <el-form-item prop="username">
                <el-input 
                  v-model="loginForm.username" 
                  placeholder="请输入用户名" 
                  prefix-icon="User"
                  size="large"
                  class="modern-input"
                />
              </el-form-item>
            </div>
            
            <div class="form-group">
              <label class="form-label">密码</label>
              <el-form-item prop="password">
                <el-input 
                  v-model="loginForm.password" 
                  type="password" 
                  placeholder="请输入密码" 
                  prefix-icon="Lock"
                  size="large"
                  show-password
                  @keyup.enter="handleLogin"
                  class="modern-input"
                />
              </el-form-item>
            </div>
            
            <div class="form-options">
              <el-checkbox v-model="rememberMe" class="remember-me">记住我</el-checkbox>
            </div>
            
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
            
            <div class="divider">
              <span>或</span>
            </div>
            
            <el-form-item>
              <el-button 
                type="default" 
                size="large" 
                class="register-button"
                @click="goToRegister"
              >
                立即注册
              </el-button>
            </el-form-item>
            
            <div class="button-row">
              <el-button 
                type="default" 
                size="large" 
                class="home-button"
                @click="goToHome"
              >
                返回主页
              </el-button>
              <el-button 
                type="default" 
                size="large" 
                class="forgot-password-button"
                @click="goToForgotPassword"
              >
                忘记密码
              </el-button>
            </div>
          </el-form>
          
          <div class="login-footer">
            <div class="test-account">
              <span class="label">测试账号：</span>
              <span class="account">admin</span>
              <span class="separator">/</span>
              <span class="account">123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

// 路由实例
const router = useRouter()

// 表单引用
const loginFormRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 记住我选项
const rememberMe = ref(false)

// 表单验证规则
const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
})

/**
 * 处理登录逻辑
 */
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      // 模拟登录请求
      setTimeout(() => {
        // 简单的模拟登录验证
        if (loginForm.username === 'admin' && loginForm.password === '123456') {
          // 设置登录状态
          localStorage.setItem('isAuthenticated', 'true')
          localStorage.setItem('username', loginForm.username)
          
          ElMessage.success('登录成功')
          
          // 跳转到仪表盘
          router.push('/dashboard')
        } else {
          ElMessage.error('用户名或密码错误')
        }
        
        loading.value = false
      }, 1000)
    }
  })
}

/**
 * 跳转到注册页面
 */
const goToRegister = () => {
  router.push('/register')
}

/**
 * 跳转到主页
 */
const goToHome = () => {
  router.push('/')
}

/**
 * 跳转到忘记密码页面
 */
const goToForgotPassword = () => {
  // 这里可以添加忘记密码页面的路由，暂时使用提示信息
  ElMessage.info('忘记密码功能正在开发中，请联系管理员重置密码')
}
</script>

<style scoped>
/* 样式 - 简洁双栏布局 */
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-wrapper {
  display: flex;
  max-width: 1000px;
  width: 100%;
  min-height: 600px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 左侧品牌区域 */
.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  opacity: 0.3;
}

.brand-content {
  position: relative;
  z-index: 2;
  color: white;
  text-align: center;
}

.brand-logo {
  margin-bottom: 3rem;
}

.logo-circle {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.logo-circle svg {
  width: 40px;
  height: 40px;
  color: white;
}

.brand-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1rem;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
  line-height: 1.5;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(10px);
}

.feature-icon {
  font-size: 1.5rem;
  width: 40px;
  text-align: center;
}

.feature-item span {
  font-size: 1rem;
  font-weight: 500;
}

/* 右侧登录区域 */
.login-section {
  flex: 1;
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.card-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.card-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem;
}

.card-header p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.login-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.remember-me {
  color: #6b7280;
  font-size: 14px;
}

.forgot-link {
  color: #667eea;
  font-size: 14px;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #764ba2;
}

.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
}

.divider span {
  position: relative;
  display: inline-block;
  padding: 0 1rem;
  background: white;
  color: #9ca3af;
  font-size: 14px;
}

.modern-input {
  width: 100%;
}

.modern-input .el-form-item {
  margin-bottom: 0;
}

.modern-input .el-input__wrapper {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
  transition: all 0.3s ease;
  height: 48px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.modern-input .el-input__wrapper:hover {
  border-color: #d1d5db;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.modern-input .el-input__wrapper.is-focus {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
}

.modern-input .el-input__inner {
  color: #1f2937;
  font-size: 16px;
}

.modern-input .el-input__inner::placeholder {
  color: #9ca3af;
}

.modern-input .el-input__prefix-inner {
  color: #9ca3af;
  margin-right: 8px;
}

.login-button {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white !important;
  margin-top: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

.register-button {
  width: 100% !important;
  height: 50px !important;
  background: transparent !important;
  border: 2px solid #667eea !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #667eea !important;
  margin-top: 0.5rem !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.register-button:hover {
  background: #667eea !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.register-button:active {
  transform: translateY(0);
}

.home-button {
  flex: 1;
  height: 50px !important;
  background: white !important;
  border: 2px solid #9ca3af !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6b7280 !important;
  margin-top: 0 !important;
  box-shadow: 0 4px 12px rgba(156, 163, 175, 0.1);
}

.home-button:hover {
  border-color: #6b7280 !important;
  color: #4b5563 !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(156, 163, 175, 0.15);
}

.home-button:active {
  transform: translateY(0);
}

.button-row {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  width: 100%;
}

.forgot-password-button {
  flex: 1;
  height: 50px !important;
  background: white !important;
  border: 2px solid #f59e0b !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #f59e0b !important;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
}

.forgot-password-button:hover {
  background: rgba(245, 158, 11, 0.05) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.15);
}

.forgot-password-button:active {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.test-account {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.test-account .label {
  color: #6b7280;
  font-size: 0.875rem;
}

.test-account .account {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.test-account .separator {
  color: #9ca3af;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .login-wrapper {
    max-width: 800px;
  }
  
  .brand-section {
    padding: 2rem;
  }
  
  .brand-title {
    font-size: 1.75rem;
  }
  
  .feature-list {
    gap: 1rem;
  }
  
  .feature-item {
    padding: 0.75rem;
  }
  
  .login-section {
    padding: 2rem;
  }
}

@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-wrapper {
    flex-direction: column;
    max-width: 500px;
  }
  
  .brand-section {
    padding: 2rem 1.5rem;
    min-height: 200px;
  }
  
  .brand-title {
    font-size: 1.5rem;
  }
  
  .feature-list {
    display: none;
  }
  
  .login-section {
    padding: 2rem 1.5rem;
  }
  
  .card-header h2 {
    font-size: 1.5rem;
  }
  
  .card-header {
    margin-bottom: 2rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 0.5rem;
  }
  
  .login-wrapper {
    border-radius: 12px;
  }
  
  .brand-section {
    padding: 1.5rem 1rem;
  }
  
  .brand-title {
    font-size: 1.25rem;
  }
  
  .login-section {
    padding: 1.5rem 1rem;
  }
  
  .logo-circle {
    width: 60px;
    height: 60px;
  }
  
  .logo-circle svg {
    width: 30px;
    height: 30px;
  }
}
</style>