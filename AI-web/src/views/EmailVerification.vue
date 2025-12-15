<template>
  <div class="email-verification-container">
    <div class="verification-wrapper">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">
            <img src="https://picsum.photos/100/100" alt="Logo" class="logo-image">
          </div>
          <h1 class="brand-title">邮箱验证</h1>
          <p class="brand-description">请输入您收到的验证码完成邮箱验证</p>
        </div>
      </div>
      
      <!-- 右侧验证表单区域 -->
      <div class="verification-section">
        <div class="verification-card">
          <div class="verification-header">
            <h2 class="verification-title">邮箱验证</h2>
            <p class="verification-subtitle">我们已向您的邮箱发送了验证码</p>
          </div>

          <el-form
            ref="verificationFormRef"
            :model="verificationForm"
            :rules="rules"
            label-position="top"
            class="verification-form"
          >
            <!-- 邮箱输入框 -->
            <el-form-item label="邮箱地址" prop="email">
              <el-input
                id="email-address"
                v-model="verificationForm.email"
                placeholder="请输入邮箱地址"
                prefix-icon="Message"
                size="large"
                clearable
                aria-describedby="email-help"
              />
              <div id="email-help" class="sr-only">请输入有效的邮箱地址</div>
            </el-form-item>

            <!-- 发送验证码按钮 -->
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="send-code-button"
                :loading="sendLoading"
                :disabled="sendCooldown > 0"
                @click="sendVerificationCode"
              >
                {{ sendCooldown > 0 ? `重新发送 (${sendCooldown}s)` : '发送验证码' }}
              </el-button>
            </el-form-item>

            <el-form-item label="验证码" prop="code">
              <el-input
                id="verification-code"
                v-model="verificationForm.code"
                placeholder="请输入6位数字验证码"
                prefix-icon="Key"
                size="large"
                maxlength="6"
                clearable
                aria-describedby="verification-code-help"
                @input="handleCodeInput"
              />
              <div id="verification-code-help" class="sr-only">请输入您收到的6位数字验证码</div>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="verify-button"
                :loading="loading"
                @click="handleVerification"
              >
                验证邮箱
              </el-button>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="default" 
                size="large" 
                class="login-link-button"
                @click="goToLogin"
              >
                返回登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { withLoading } from '@/utils/loadingUtils'
import { handleApiError } from '@/utils/errorUtils'
import { request } from '@/utils/request'

// 路由实例
const router = useRouter()
const route = useRoute()

// 表单引用
const verificationFormRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)
const sendLoading = ref(false)

// 验证表单数据
const verificationForm = reactive({
  email: '',
  code: ''
})

// 倒计时
const sendCooldown = ref(0)
let countdownTimer: number | null = null

// 表单验证规则
const rules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  code: [
    { 
      required: true, 
      message: '请输入验证码', 
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
 * 处理验证码输入
 */
const handleCodeInput = (value: string) => {
  // 只保留数字
  verificationForm.code = value.replace(/\D/g, '')
}

/**
 * 开始倒计时
 */
const startCountdown = (seconds: number = 60) => {
  sendCooldown.value = seconds
  
  countdownTimer = window.setInterval(() => {
    sendCooldown.value--
    if (sendCooldown.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }
  }, 1000)
}

/**
 * 发送邮箱验证码
 */
const sendVerificationCode = async (): Promise<void> => {
  if (sendCooldown.value > 0) return
  
  // 验证邮箱地址
  if (!verificationForm.email) {
    ElMessage.error('请输入邮箱地址')
    return
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(verificationForm.email)) {
    ElMessage.error('请输入正确的邮箱地址')
    return
  }
  
  try {
    sendLoading.value = true
    // 调用发送邮箱验证码接口
    const response = await request<any>('/api/auth/send-email-code', {
      method: 'POST',
      body: JSON.stringify({ email: verificationForm.email })
    })
    
    if (response.success) {
      ElMessage.success('验证码已发送至您的邮箱')
      startCountdown()
    } else {
      ElMessage.error(response.message || '发送验证码失败')
    }
  } catch (error) {
    handleApiError(error, '发送验证码失败')
  } finally {
    sendLoading.value = false
  }
}

/**
 * 重新发送验证码（保持原有功能）
 */
const resendCode = async (): Promise<void> => {
  if (sendCooldown.value > 0) return
  
  try {
    await withLoading(async () => {
      // 调用重新发送验证码接口
      const response = await request<any>('/api/auth/resend-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email: verificationForm.email || 'user@example.com' })
      })
      
      if (response.success) {
        ElMessage.success('验证码已重新发送')
        startCountdown()
      } else {
        ElMessage.error(response.message || '发送验证码失败')
      }
    })
  } catch (error) {
    handleApiError(error, '发送验证码失败')
  }
}

/**
 * 处理邮箱验证
 */
const handleVerification = async (): Promise<void> => {
  if (!verificationFormRef.value) return
  
  await verificationFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await withLoading(async () => {
          // 调用邮箱验证接口
          const response = await request<any>('/api/auth/verify-email-code', {
            method: 'POST',
            body: JSON.stringify({
              email: verificationForm.email,
              code: verificationForm.code
            })
          })
          
          if (response.success) {
            ElMessage.success('邮箱验证成功')
            // 根据业务场景跳转到不同页面
            handleVerificationSuccess()
          } else {
            ElMessage.error(response.message || '验证码错误')
          }
        })
      } catch (error) {
        handleApiError(error, '验证失败')
      }
    }
  })
}

/**
 * 处理验证成功后的跳转逻辑
 */
const handleVerificationSuccess = (): void => {
  // 获取来源参数，决定跳转到哪个页面
  const source = route.query.source as string || 'register'
  
  switch (source) {
    case 'register':
      // 注册流程的邮箱验证，跳转到首页
      router.push('/')
      break
    case 'forgot-password':
      // 找回密码流程的邮箱验证，跳转到重置密码页面
      router.push('/reset-password')
      break
    case 'change-email':
      // 邮箱更换流程的验证，跳转到个人中心页面
      router.push('/personal-info')
      break
    default:
      // 默认跳转到首页
      router.push('/')
  }
}

/**
 * 跳转到首页
 */
const goToHome = (): void => {
  router.push('/')
}

/**
 * 组件挂载时初始化
 */
onMounted(() => {
  // 不再自动启动倒计时，等待用户点击发送验证码
  // 如果URL中有邮箱参数，自动填充
  const email = route.query.email as string || ''
  if (email) {
    verificationForm.email = email
  }
})

/**
 * 组件卸载时清理定时器
 */
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
/* 样式 - 简洁双栏布局 */
.email-verification-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.verification-wrapper {
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

.logo-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: -0.5px;
}

.brand-description {
  font-size: 1.1rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* 右侧验证区域 */
.verification-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.verification-card {
  width: 100%;
  max-width: 400px;
}

.verification-header {
  text-align: center;
  margin-bottom: 2rem;
}

.verification-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.verification-subtitle {
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
}

/* 表单样式 */
.verification-form {
  margin-top: 2rem;
}

.send-code-button {
  width: 100%;
  margin-bottom: 1rem;
}

.verify-button {
  width: 100%;
  margin-bottom: 1rem;
}

.login-link-button {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .verification-wrapper {
    flex-direction: column;
    margin: 1rem;
  }
  
  .brand-section {
    padding: 2rem 1rem;
  }
  
  .verification-section {
    padding: 2rem 1rem;
  }
  
  .brand-title {
    font-size: 2rem;
  }
  
  .verification-title {
    font-size: 1.5rem;
  }
}
</style>