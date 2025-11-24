<template>
  <div class="register-container">
    <div class="register-wrapper">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-circle">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                <path d="M2 17L12 22L22 17"/>
                <path d="M2 12L12 17L22 12"/>
              </svg>
            </div>
            <h1 class="brand-title">智能记账</h1>
            <p class="brand-subtitle">轻松管理您的每一笔开支</p>
          </div>
          
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">👥</div>
              <div class="feature-text">
                <h4>室友共享</h4>
                <p>与室友共同管理生活费</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">💰</div>
              <div class="feature-text">
                <h4>智能记账</h4>
                <p>自动识别分类每一笔费用</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <div class="feature-text">
                <h4>数据分析</h4>
                <p>可视化了解消费趋势</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧注册表单区域 -->
      <div class="register-section">
        <div class="register-card">
          <div class="register-header">
            <h2 class="register-title">创建新账户</h2>
            <p class="register-subtitle">开始您的智能记账之旅</p>
          </div>

          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="rules"
            label-position="top"
            class="register-form"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="请输入用户名"
                prefix-icon="User"
                size="large"
                clearable
              />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="registerForm.email"
                placeholder="请输入邮箱地址"
                prefix-icon="Message"
                size="large"
                clearable
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                size="large"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                prefix-icon="Lock"
                size="large"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="register-button"
                :loading="loading"
                @click="handleRegister"
              >
                创建账户
              </el-button>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="default" 
                size="large" 
                class="login-link-button"
                @click="goToLogin"
              >
                已有账户？立即登录
              </el-button>
            </el-form-item>
            <el-form-item>
              <el-button 
                type="default" 
                size="large" 
                class="home-button"
                @click="goToHome"
              >
                返回主页
              </el-button>
            </el-form-item>
          </el-form>
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
const registerFormRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

/**
 * 自定义验证规则：确认密码验证
 */
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, message: '密码必须包含大小写字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

/**
 * 处理注册逻辑
 */
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      // 模拟注册请求
      setTimeout(() => {
        // 简单的模拟注册验证
        console.log('注册数据:', {
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })
        
        ElMessage.success('注册成功！请登录')
        
        // 跳转到登录页面
        router.push('/login')
        
        loading.value = false
      }, 1500)
    }
  })
}

/**
 * 跳转到登录页面
 */
const goToLogin = () => {
  router.push('/login')
}

/**
 * 跳转到主页
 */
const goToHome = () => {
  router.push('/')
}
</script>

<style scoped>
/* 样式 - 简洁双栏布局 */
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.register-wrapper {
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

.feature-text h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: white;
}

.feature-text p {
  font-size: 0.875rem;
  opacity: 0.8;
  margin: 0;
  color: white;
}

/* 右侧注册表单区域 */
.register-section {
  flex: 1;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: white;
}

.register-card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.register-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.register-form {
  width: 100%;
}

.register-form .el-form-item {
  margin-bottom: 1.5rem;
}

.register-form .el-form-item__label {
  font-weight: 600;
  color: #374151;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.register-form .el-input__wrapper {
  height: 48px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.register-form .el-input__wrapper:hover {
  border-color: #d1d5db;
  background: white;
}

.register-form .el-input__wrapper.is-focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.register-form .el-input__inner {
  height: 44px;
  font-size: 16px;
}

.register-button {
  width: 100% !important;
  height: 48px !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white !important;
}

.register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.register-button:active {
  transform: translateY(0);
}

.login-link-button {
  width: 100% !important;
  height: 48px !important;
  background: transparent !important;
  border: 2px solid #667eea !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #667eea !important;
  margin-top: 0.5rem !important;
}

.login-link-button:hover {
  background: #667eea !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.login-link-button:active {
  transform: translateY(0);
}

.home-button {
  width: 100% !important;
  height: 48px !important;
  background: transparent !important;
  border: 2px solid #6b7280 !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6b7280 !important;
  margin-top: 0.5rem !important;
}

.home-button:hover {
  background: #6b7280 !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(107, 114, 128, 0.3);
}

.home-button:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-wrapper {
    flex-direction: column;
    max-width: 400px;
    min-height: auto;
  }
  
  .brand-section {
    padding: 2rem;
    min-height: 200px;
  }
  
  .register-section {
    padding: 2rem;
  }
  
  .brand-title {
    font-size: 1.5rem;
  }
  
  .feature-list {
    gap: 1rem;
  }
  
  .feature-item {
    padding: 0.75rem;
  }
  
  .feature-icon {
    font-size: 1.25rem;
    width: 32px;
  }
}
</style>