<template>
  <div class="reset-password-container">
    <div class="reset-wrapper">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">
            <img src="https://picsum.photos/100/100" alt="Logo" class="logo-image">
          </div>
          <h1 class="brand-title">重置密码</h1>
          <p class="brand-description">请输入新密码和验证码完成密码重置</p>
        </div>
      </div>
      
      <!-- 右侧重置表单区域 -->
      <div class="reset-section">
        <div class="reset-card">
          <div class="reset-header">
            <h2 class="reset-title">重置密码</h2>
            <p class="reset-subtitle">请设置新的登录密码</p>
          </div>

          <el-form
            ref="resetFormRef"
            :model="resetForm"
            :rules="rules"
            label-position="top"
            class="reset-form"
          >
            <!-- 邮箱地址 -->
            <el-form-item label="邮箱地址" prop="email">
              <el-input
                id="email"
                v-model="resetForm.email"
                placeholder="请输入注册邮箱"
                prefix-icon="Message"
                size="large"
                clearable
                aria-describedby="email-help"
                :disabled="isEmailDisabled"
              />
              <div id="email-help" class="sr-only">请输入您注册时使用的邮箱地址</div>
            </el-form-item>

            <!-- 验证码 -->
            <el-form-item label="验证码" prop="code">
              <div class="code-input-group">
                <el-input
                  id="verification-code"
                  v-model="resetForm.code"
                  placeholder="请输入6位数字验证码"
                  prefix-icon="Key"
                  size="large"
                  maxlength="6"
                  clearable
                  aria-describedby="code-help"
                  @input="handleCodeInput"
                />
                <el-button 
                  type="primary" 
                  size="large" 
                  class="send-code-button"
                  :loading="sendLoading"
                  :disabled="sendCooldown > 0 || !resetForm.email"
                  @click="sendVerificationCode"
                >
                  {{ sendCooldown > 0 ? `重新发送 (${sendCooldown}s)` : '发送验证码' }}
                </el-button>
              </div>
              <div id="code-help" class="sr-only">请输入您收到的6位数字验证码</div>
            </el-form-item>

            <!-- 新密码 -->
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                id="new-password"
                v-model="resetForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                prefix-icon="Lock"
                size="large"
                show-password
                aria-describedby="password-help"
              />
              <div id="password-help" class="sr-only">请输入至少8位包含大小写字母、数字和特殊字符的新密码</div>
              
              <!-- 密码强度指示器 -->
              <div class="password-strength-indicator" v-if="resetForm.newPassword">
                <div class="strength-label">密码强度：</div>
                <div class="strength-bar-container">
                  <div 
                    class="strength-bar" 
                    :class="{
                      'strength-weak': calculatedStrength.level === '弱',
                      'strength-medium': calculatedStrength.level === '中',
                      'strength-strong': calculatedStrength.level === '强'
                    }"
                    :style="{ width: calculatedStrength.score * 33.33 + '%' }"
                  ></div>
                </div>
                <div class="strength-text">{{ calculatedStrength.level }}</div>
              </div>
              
              <!-- 密码要求检查 -->
              <div class="password-requirements" v-if="resetForm.newPassword">
                <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.minLength }">
                  <span class="requirement-icon">{{ calculatedStrength.requirements.minLength ? '✓' : '○' }}</span>
                  <span class="requirement-text">至少8个字符</span>
                </div>
                <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.lowercase }">
                  <span class="requirement-icon">{{ calculatedStrength.requirements.lowercase ? '✓' : '○' }}</span>
                  <span class="requirement-text">小写字母（a-z）</span>
                </div>
                <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.uppercase }">
                  <span class="requirement-icon">{{ calculatedStrength.requirements.uppercase ? '✓' : '○' }}</span>
                  <span class="requirement-text">大写字母（A-Z）</span>
                </div>
                <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.number }">
                  <span class="requirement-icon">{{ calculatedStrength.requirements.number ? '✓' : '○' }}</span>
                  <span class="requirement-text">数字（0-9）</span>
                </div>
                <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.special }">
                  <span class="requirement-icon">{{ calculatedStrength.requirements.special ? '✓' : '○' }}</span>
                  <span class="requirement-text">特殊字符（例如 !@#$%^&*）</span>
                </div>
              </div>
            </el-form-item>

            <!-- 确认密码 -->
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                id="confirm-password"
                v-model="resetForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                prefix-icon="Lock"
                size="large"
                show-password
                aria-describedby="confirm-password-help"
              />
              <div id="confirm-password-help" class="sr-only">请再次输入新密码以确认</div>
            </el-form-item>

            <!-- 重置按钮 -->
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="reset-button"
                :loading="loading"
                @click="handleResetPassword"
              >
                重置密码
              </el-button>
            </el-form-item>

            <!-- 返回登录链接 -->
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
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { request } from '@/utils/request'
import { handleApiError } from '@/utils/errorUtils'

// 路由实例
const router = useRouter()

// 表单引用
const resetFormRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)
const sendLoading = ref(false)

// 重置表单数据
const resetForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// 倒计时
const sendCooldown = ref(0)
let countdownTimer: number | null = null

// 邮箱是否禁用（如果从邮箱验证页面跳转过来）
const isEmailDisabled = ref(false)

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
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
        if (value !== resetForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

/**
 * 计算密码强度
 */
const calculatePasswordStrength = (password: string) => {
  const requirements = {
    minLength: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
  
  const satisfiedCount = Object.values(requirements).filter(Boolean).length
  
  // 根据满足的条件数量确定强度等级
  let level = '弱'
  let score = 0
  
  if (satisfiedCount >= 5) {
    level = '强'
    score = 3
  } else if (satisfiedCount >= 3) {
    level = '中'
    score = 2
  } else {
    score = 1
  }
  
  return { level, score, requirements }
}

const calculatedStrength = computed(() => {
  return calculatePasswordStrength(resetForm.newPassword)
})

/**
 * 处理验证码输入（只允许数字）
 */
const handleCodeInput = (value: string) => {
  resetForm.code = value.replace(/\D/g, '')
}

/**
 * 开始倒计时
 */
const startCountdown = (seconds: number = 60) => {
  sendCooldown.value = seconds
  
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
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
 * 发送验证码
 */
const sendVerificationCode = async () => {
  if (sendCooldown.value > 0) return
  
  // 验证邮箱地址
  if (!resetForm.email) {
    ElMessage.error('请输入邮箱地址')
    return
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(resetForm.email)) {
    ElMessage.error('请输入正确的邮箱地址')
    return
  }
  
  try {
    sendLoading.value = true
    
    // 调用请求密码重置验证码接口
    const response = await request<any>('/api/auth/request-password-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email: resetForm.email })
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
 * 处理密码重置
 */
const handleResetPassword = async () => {
  if (!resetFormRef.value) return
  
  await resetFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        
        // 调用重置密码接口
        const response = await request<any>('/api/auth/reset-password-with-code', {
          method: 'POST',
          body: JSON.stringify({
            email: resetForm.email,
            code: resetForm.code,
            newPassword: resetForm.newPassword
          })
        })
        
        if (response.success) {
          ElMessage.success('密码重置成功，请使用新密码登录')
          // 重置成功后跳转到登录页面
          setTimeout(() => {
            router.push('/login')
          }, 1500)
        } else {
          ElMessage.error(response.message || '密码重置失败')
        }
      } catch (error) {
        handleApiError(error, '密码重置失败')
      } finally {
        loading.value = false
      }
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
 * 组件挂载时初始化
 */
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
/* 样式 - 简洁双栏布局 */
.reset-password-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.reset-wrapper {
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

/* 右侧重置区域 */
.reset-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.reset-card {
  width: 100%;
  max-width: 400px;
}

.reset-header {
  text-align: center;
  margin-bottom: 2rem;
}

.reset-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.reset-subtitle {
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
}

/* 表单样式 */
.reset-form {
  margin-top: 2rem;
}

.code-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.code-input-group .el-input {
  flex: 1;
}

.send-code-button {
  white-space: nowrap;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 8px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white !important;
  padding: 8px 16px !important;
  height: 40px !important;
  min-width: 120px !important;
}

.send-code-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.send-code-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-code-button:disabled {
  background: #cccccc !important;
  cursor: not-allowed;
  opacity: 0.6;
}

.reset-button {
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
  margin-bottom: 1rem !important;
}

.reset-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.reset-button:active {
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
}

.login-link-button:hover {
  background: #667eea !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.login-link-button:active {
  transform: translateY(0);
}

/* 密码强度指示器 */
.password-strength-indicator {
  display: flex;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
}

.strength-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.strength-bar-container {
  flex: 1;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.strength-bar.strength-weak {
  background: #f44336;
  width: 33.33%;
}

.strength-bar.strength-medium {
  background: #ff9800;
  width: 66.66%;
}

.strength-bar.strength-strong {
  background: #4caf50;
  width: 100%;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* 密码要求检查 */
.password-requirements {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
}

.requirement-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.requirement-item:last-child {
  margin-bottom: 0;
}

.requirement-item.met {
  color: #4caf50;
}

.requirement-icon {
  margin-right: 6px;
  font-weight: bold;
}

.requirement-text {
  color: #666;
}

.requirement-item.met .requirement-text {
  color: #4caf50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reset-wrapper {
    flex-direction: column;
    margin: 1rem;
  }
  
  .brand-section {
    padding: 2rem 1rem;
  }
  
  .reset-section {
    padding: 2rem 1rem;
  }
  
  .brand-title {
    font-size: 2rem;
  }
  
  .reset-title {
    font-size: 1.5rem;
  }
  
  .code-input-group {
    flex-direction: column;
  }
  
  .send-code-button {
    width: 100% !important;
    min-width: auto !important;
  }
}
</style>