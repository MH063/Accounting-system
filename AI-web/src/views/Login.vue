<template>
  <div class="login-container">
    <div class="login-wrapper">
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

      <!-- 右侧登录表单区域 -->
      <div class="login-section">
        <div class="login-card">
          <div class="login-header">
            <h2 class="login-title">欢迎回来</h2>
            <p class="login-subtitle">登录到您的账户</p>
          </div>

          <!-- 登录方式切换标签 -->
          <div class="login-mode-tabs">
            <el-tabs v-model="activeLoginMode" class="login-tabs">
              <!-- 传统登录 -->
              <el-tab-pane label="账号登录" name="traditional">
                <el-form
                  ref="loginFormRef"
                  :model="loginForm"
                  :rules="rules"
                  label-position="top"
                  class="login-form"
                >
                  <el-form-item label="用户名/邮箱" prop="username">
                    <el-input
                      id="login-username"
                      v-model="loginForm.username"
                      placeholder="请输入用户名或邮箱地址"
                      prefix-icon="User"
                      size="large"
                      clearable
                      aria-describedby="login-username-help"
                    />
                    <div id="login-username-help" class="sr-only">请输入您的用户名或邮箱地址</div>
                  </el-form-item>

                  <el-form-item label="密码" prop="password">
                    <el-input
                      id="login-password"
                      v-model="loginForm.password"
                      type="password"
                      placeholder="请输入密码"
                      prefix-icon="Lock"
                      size="large"
                      show-password
                      clearable
                      @keyup.enter="handleLogin"
                      aria-describedby="login-password-help"
                    />
                    <div id="login-password-help" class="sr-only">请输入您的密码</div>
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
              </el-tab-pane>

              <!-- 短信登录 -->
              <el-tab-pane label="短信登录" name="sms">
                <el-form
                  ref="smsLoginFormRef"
                  :model="smsLoginForm"
                  :rules="smsLoginRules"
                  label-position="top"
                  class="login-form"
                >
                  <el-form-item label="手机号" prop="phone">
                    <el-input
                      id="login-phone"
                      v-model="smsLoginForm.phone"
                      placeholder="请输入手机号"
                      prefix-icon="Iphone"
                      size="large"
                      clearable
                      aria-describedby="login-phone-help"
                    />
                    <div id="login-phone-help" class="sr-only">请输入您的手机号</div>
                  </el-form-item>

                  <el-form-item label="验证码" prop="code">
                    <div class="sms-code-input-group">
                      <el-input
                        id="login-sms-code"
                        v-model="smsLoginForm.code"
                        placeholder="请输入短信验证码"
                        prefix-icon="Key"
                        size="large"
                        maxlength="6"
                        @input="handleSmsCodeInput"
                        aria-describedby="login-sms-code-help"
                      />
                      <el-button 
                        type="primary" 
                        size="large" 
                        class="send-code-button"
                        disabled
                      >
                        获取验证码（暂未开发）
                      </el-button>
                    </div>
                    <div id="login-sms-code-help" class="sr-only">请输入您收到的短信验证码</div>
                  </el-form-item>

                  <el-form-item>
                    <el-button 
                      type="primary" 
                      size="large" 
                      class="login-button"
                      :loading="loading"
                      @click="handleSmsLogin"
                    >
                      登录
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>
            </el-tabs>
          </div>

          <el-form
            label-position="top"
            class="login-form"
          >
            <el-form-item>
              <el-button 
                type="default" 
                size="large" 
                class="register-link-button"
                @click="goToRegister"
              >
                立即注册
              </el-button>
            </el-form-item>
            
            <el-form-item>
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
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import authService from '@/services/authService'
import authStorageService from '@/services/authStorageService'
import loginValidator from '@/utils/loginValidator'
import { withLoading } from '@/utils/loadingUtils'
import { handleApiError } from '@/utils/errorUtils'
import { request } from '@/utils/request'

// 路由实例
const router = useRouter()

// 表单引用
const loginFormRef = ref<FormInstance>()
const smsLoginFormRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)

// 登录模式（传统登录 vs 短信登录）
const activeLoginMode = ref('traditional')

// 传统登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 短信登录表单数据
const smsLoginForm = reactive({
  phone: '',
  code: ''
})

// 短信验证码倒计时（暂未开发）
const smsCooldown = ref(0)
let smsTimer: number | null = null

// 表单验证规则
const rules = reactive<FormRules>({
  username: [
    { 
      required: true, 
      validator: (rule, value, callback) => {
        if (!value || value.trim() === '') {
          callback(new Error('请输入用户名或邮箱'))
          return
        }
        
        // 使用增强的验证器
        const validation = loginValidator.validateUsernameOrEmail(value)
        if (!validation.isValid) {
          callback(new Error(validation.errors[0]))
          return
        }
        
        // 显示警告信息（如果有）
        if (validation.warnings.length > 0) {
          console.warn('用户名/邮箱验证警告:', validation.warnings)
        }
        
        callback()
      }, 
      trigger: 'blur'
    }
  ],
  password: [
    { 
      required: true, 
      validator: (rule, value, callback) => {
        if (!value || value.trim() === '') {
          callback(new Error('请输入密码'))
          return
        }
        
        // 使用增强的验证器
        const validation = loginValidator.validatePassword(value)
        if (!validation.isValid) {
          callback(new Error(validation.errors[0]))
          return
        }
        
        // 显示警告信息（如果有）
        if (validation.warnings.length > 0) {
          console.warn('密码验证警告:', validation.warnings)
        }
        
        callback()
      }, 
      trigger: 'blur'
    }
  ]
})

// 短信登录表单验证规则
const smsLoginRules = reactive<FormRules>({
  phone: [
    { 
      required: true, 
      message: '请输入手机号', 
      trigger: 'blur' 
    },
    { 
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: 'blur'
    }
  ],
  code: [
    { 
      required: true, 
      message: '请输入短信验证码', 
      trigger: 'blur' 
    },
    { 
      pattern: /^\d{6}$/,
      message: '验证码应为6位数字',
      trigger: 'blur'
    }
  ]
})

/**
 * 处理登录逻辑
 */
const handleLogin = async (): Promise<void> => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await withLoading(async () => {
          // 安全性检查
          const securityCheck = loginValidator.checkInputSecurity(loginForm)
          if (!securityCheck.isSafe) {
            ElMessage.error('输入包含不安全内容，请检查后重试')
            console.error('安全检查失败:', securityCheck.threats)
            return
          }
          
          // 使用增强的验证器进行完整验证
          const validation = loginValidator.validateLoginForm(loginForm)
          if (!validation.isValid) {
            ElMessage.error(validation.errors[0])
            return
          }
          
          // 格式化登录数据
          const loginData = loginValidator.formatLoginData(loginForm)
          
          console.log('用户登录请求:', loginData)
          
          const response = await authService.login(loginData)
          
          console.log('登录成功:', response)
          
          // 检查响应是否成功
          if (!response.success) {
            ElMessage.error(response.message || '登录失败，请检查用户名和密码')
            return
          }
          
          // 验证身份验证状态
          const authState = authStorageService.getAuthState()
          if (!authState.isAuthenticated) {
            ElMessage.error('身份验证失败，请重新登录')
            return
          }
          
          // 显示登录成功信息
          const userInfo = authState.user
          if (userInfo) {
            ElMessage.success(`欢迎回来，${userInfo.nickname || userInfo.username}！`)
          } else {
            ElMessage.success('登录成功！')
          }
          
          // 跳转到仪表盘
          router.push('/dashboard')
        })
      } catch (error) {
        // 增强错误处理
        console.error('登录失败:', error)
        
        // 根据错误类型提供不同的提示
        if (error && typeof error === 'object') {
          const errorObj = error as any
          if (errorObj.message) {
            if (errorObj.message.includes('用户名或密码错误')) {
              ElMessage.error('用户名或密码错误，请检查后重试')
            } else if (errorObj.message.includes('账户已锁定')) {
              ElMessage.error('账户已被锁定，请联系管理员')
            } else if (errorObj.message.includes('验证码')) {
              ElMessage.error('需要验证码，请刷新页面重试')
            } else {
              ElMessage.error(errorObj.message)
            }
          } else {
            ElMessage.error('登录失败，请稍后重试')
          }
        } else {
          ElMessage.error('登录失败，请检查网络连接')
        }
        
        handleApiError(error, '登录失败')
      }
    }
  })
}

/**
 * 处理短信验证码输入（只允许数字）
 */
const handleSmsCodeInput = (value: string) => {
  smsLoginForm.code = value.replace(/\D/g, '')
}

/**
 * 发送短信验证码（暂未开发）
 */
const sendSmsCode = async () => {
  ElMessage.info('获取验证码功能暂未开发')
}

/**
 * 开始短信验证码倒计时（暂未开发）
 */
const startSmsCountdown = (seconds: number = 60) => {
  // 功能暂未开发
  console.log('短信验证码倒计时功能暂未开发');
}

/**
 * 处理短信登录逻辑
 */
const handleSmsLogin = async (): Promise<void> => {
  if (!smsLoginFormRef.value) return
  
  await smsLoginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await withLoading(async () => {
          console.log('短信登录请求:', smsLoginForm)
          
          // 调用短信登录接口
          const response = await request<any>('/auth/sms-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              phone: smsLoginForm.phone,
              code: smsLoginForm.code 
            })
          })
          
          if (response.success) {
            console.log('短信登录成功:', response)
            
            // 正确处理双层嵌套结构: {success: true, data: {data: {user, tokens}, message}}
            const actualData = response.data?.data || response.data;
            
            // 保存认证信息
            if (actualData?.tokens?.accessToken) {
              localStorage.setItem('access_token', actualData.tokens.accessToken)
              localStorage.setItem('refresh_token', actualData.tokens.refreshToken)
              localStorage.setItem('token_expires', (Date.now() + actualData.tokens.expiresIn * 1000).toString())
              localStorage.setItem('isAuthenticated', 'true')
              
              // 保存用户信息
              if (actualData.user) {
                localStorage.setItem('user_info', JSON.stringify(actualData.user))
              }
              
              // 保存会话信息
              if (actualData.session) {
                localStorage.setItem('session_id', actualData.session.sessionId)
              }
            }
            
            // 显示登录成功信息
            ElMessage.success('登录成功！')
            
            // 跳转到仪表盘
            router.push('/dashboard')
          } else {
            ElMessage.error(response.message || '登录失败，请检查验证码')
          }
        })
      } catch (error) {
        console.error('短信登录失败:', error)
        ElMessage.error('登录失败，请检查网络连接')
        handleApiError(error, '登录失败')
      }
    }
  })
}

/**
 * 跳转到注册页面
 */
const goToRegister = (): void => {
  router.push('/register')
}

/**
 * 跳转到主页
 */
const goToHome = (): void => {
  router.push('/')
}

/**
 * 跳转到忘记密码页面
 */
const goToForgotPassword = (): void => {
  router.push('/reset-password')
}

/**
 * 组件卸载时清理定时器
 */
onUnmounted(() => {
  if (smsTimer) {
    clearInterval(smsTimer)
  }
})
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

/* 右侧登录表单区域 */
.login-section {
  flex: 1;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: white;
}

.login-card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: 1rem;
}

.login-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.login-subtitle {
  font-size: 1rem;
  color: #4b5563;
  margin: 0;
}

/* 登录方式切换标签 */
.login-mode-tabs {
  margin-bottom: 1.5rem;
}

.login-tabs {
  width: 100%;
}

.login-tabs .el-tabs__header {
  margin-bottom: 2rem;
}

.login-tabs .el-tabs__nav-wrap::after {
  display: none;
}

.login-tabs .el-tabs__item {
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
  padding: 0 1rem;
}

.login-tabs .el-tabs__item.is-active {
  color: #667eea;
}

.login-tabs .el-tabs__active-bar {
  background-color: #667eea;
}

/* 短信验证码输入组 */
.sms-code-input-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.sms-code-input-group .el-input {
  flex: 1;
}

.send-code-button {
  height: 48px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.login-form {
  width: 100%;
}

.login-form .el-form-item {
  margin-bottom: 1.5rem;
}

.login-form .el-form-item__label {
  font-weight: 600;
  color: #1f2937;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.login-form .el-input__wrapper {
  height: 48px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.login-form .el-input__wrapper:hover {
  border-color: #d1d5db;
  background: white;
}

.login-form .el-input__wrapper.is-focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.login-form .el-input__inner {
  border: none;
  background: transparent;
  font-size: 1rem;
}

.login-form .el-input__inner::placeholder {
  color: #9ca3af;
}

.login-button {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

.register-link-button,
.home-button,
.forgot-password-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
  background: white;
  color: #4b5563;
}

.register-link-button:hover,
.home-button:hover,
.forgot-password-button:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f8faff;
}

.register-link-button:active,
.home-button:active,
.forgot-password-button:active {
  transform: translateY(1px);
}

/* 按钮行布局 */
.button-row {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.button-row .home-button,
.button-row .forgot-password-button {
  flex: 1;
}

/* 无障碍支持 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
    max-width: 400px;
  }
  
  .brand-section {
    min-height: 300px;
    padding: 2rem;
  }
  
  .login-section {
    padding: 2rem;
  }
  
  .brand-title {
    font-size: 1.5rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
  
  .button-row {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  /* 移动端短信验证码输入组调整 */
  .sms-code-input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .send-code-button {
    height: 48px;
  }
}
</style>