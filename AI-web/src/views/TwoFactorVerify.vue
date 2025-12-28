<template>
  <div class="two-factor-verify-container">
    <div class="verify-wrapper">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-circle">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.09 8.26L19 7L17.74 12.9L24 14L17.74 15.1L19 21L13.09 19.74L12 26L10.91 19.74L5 21L6.26 15.1L0 14L6.26 12.9L5 7L10.91 8.26L12 2Z"/>
              </svg>
            </div>
            <h1 class="brand-title">智能化记账宝</h1>
            <p class="brand-subtitle">双重验证，安全升级</p>
          </div>
          
          <div class="security-info">
            <div class="security-icon">🔒</div>
            <h3>两步验证</h3>
            <p>为了保护您的账户安全，我们需要验证您的身份</p>
            <ul class="verification-types">
              <li v-for="type in verificationTypes" :key="type" class="verification-type">
                <span class="type-icon">{{ getVerificationIcon(type) }}</span>
                <span>{{ getVerificationName(type) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- 右侧验证表单区域 -->
      <div class="verify-section">
        <div class="verify-card">
          <div class="card-header">
            <h2>两步验证</h2>
            <p>请输入您收到的验证码</p>
          </div>
          
          <!-- 用户信息显示 -->
          <div class="user-info" v-if="userInfo">
            <div class="user-avatar">
              <el-avatar 
                :size="60" 
                :src="getUserAvatar(userInfo.avatar_url, userInfo.email, userInfo.nickname || userInfo.username)"
              >
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
            <div class="user-details">
              <h4>{{ userInfo.nickname || userInfo.username }}</h4>
              <p>{{ maskEmail(userInfo.email) }}</p>
            </div>
          </div>
          
          <el-form :model="verifyForm" :rules="rules" ref="verifyFormRef" class="verify-form">
            <!-- 验证方式选择 -->
            <div class="verification-methods" v-if="availableMethods.length > 1">
              <label class="form-label">验证方式</label>
              <el-radio-group v-model="selectedMethod" class="method-group">
                <el-radio 
                  v-for="method in availableMethods" 
                  :key="method"
                  :label="method"
                  class="method-radio"
                >
                  <span class="method-content">
                    <span class="method-icon">{{ getVerificationIcon(method) }}</span>
                    <span class="method-text">{{ getVerificationName(method) }}</span>
                  </span>
                </el-radio>
              </el-radio-group>
            </div>
            
            <!-- 验证码输入 -->
            <div class="form-group">
              <label class="form-label" for="verify-code">
                {{ getVerificationName(selectedMethod) }}
              </label>
              <el-form-item prop="code">
                <el-input 
                  id="verify-code"
                  v-model="verifyForm.code" 
                  :placeholder="getCodePlaceholder(selectedMethod)"
                  size="large"
                  maxlength="8"
                  class="verify-input"
                  @input="handleCodeInput"
                >
                  <template #prefix>
                    <span class="input-icon">{{ getVerificationIcon(selectedMethod) }}</span>
                  </template>
                </el-input>
              </el-form-item>
            </div>
            
            <!-- 备用码选项 -->
            <div class="form-group" v-if="selectedMethod !== 'totp'">
              <el-checkbox v-model="useBackupCode" id="use-backup-code">
                使用备用验证码
              </el-checkbox>
            </div>
            
            <!-- 重新发送 -->
            <div class="resend-section" v-if="canResend">
              <el-button 
                type="text" 
                :disabled="resendCooldown > 0"
                @click="handleResend"
                class="resend-button"
              >
                {{ resendCooldown > 0 ? `重新发送 (${resendCooldown}s)` : '重新发送验证码' }}
              </el-button>
            </div>
            
            <!-- 错误提示 -->
            <div class="error-section" v-if="errorMessage">
              <el-alert
                :title="errorMessage"
                type="error"
                show-icon
                :closable="false"
              />
            </div>
            
            <!-- 验证按钮 -->
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                class="verify-button"
                :loading="loading"
                @click="handleVerify"
                :disabled="!verifyForm.code || verifyForm.code.length < 4"
              >
                验证并登录
              </el-button>
            </el-form-item>
            
            <!-- 返回登录 -->
            <div class="back-section">
              <el-button 
                type="text" 
                @click="handleBackToLogin"
                class="back-button"
              >
                ← 返回登录
              </el-button>
            </div>
          </el-form>
          
          <!-- 提示信息 -->
          <div class="tips-section">
            <div class="tip-item">
              <span class="tip-icon">💡</span>
              <span class="tip-text">验证码有效期为5分钟，请尽快输入</span>
            </div>
            <div class="tip-item" v-if="selectedMethod === 'totp'">
              <span class="tip-icon">📱</span>
              <span class="tip-text">请打开您的身份验证器应用查看动态验证码</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { verifyTwoFactor, generateTwoFactorCode, getTwoFactorStatus } from '@/services/authService'
import { getLocalUserInfo } from '@/services/authService'
import { User } from '@element-plus/icons-vue'
import { getUserAvatar } from '@/services/userService'

// 路由实例
const router = useRouter()

// 加载状态
const loading = ref(false)

// 表单引用
const verifyFormRef = ref<FormInstance>()

// 用户信息
const userInfo = ref<any>(null)

// 验证表单数据
const verifyForm = reactive({
  code: ''
})

// 验证方式
const selectedMethod = ref('totp')
const availableMethods = ref<string[]>(['totp', 'sms', 'email'])
const verificationTypes = ref<string[]>(['totp', 'sms', 'email'])

// 备用码选项
const useBackupCode = ref(false)

// 重新发送相关
const canResend = ref(true)
const resendCooldown = ref(0)
let resendTimer: number | null = null

// 错误信息
const errorMessage = ref('')

// 临时登录信息
const tempLoginInfo = ref<any>(null)

// 表单验证规则
const rules = reactive<FormRules>({
  code: [
    { 
      required: true, 
      message: '请输入验证码', 
      trigger: 'blur' 
    },
    { 
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请输入验证码'))
          return
        }
        
        // 根据验证方式验证验证码格式
        let pattern: RegExp
        let message: string
        
        if (useBackupCode.value) {
          // 备用码格式：8位字母数字组合
          pattern = /^[A-Za-z0-9]{8}$/
          message = '备用码格式不正确，应为8位字母数字组合'
        } else {
          switch (selectedMethod.value) {
            case 'totp':
              // TOTP验证码：6位数字
              pattern = /^\d{6}$/
              message = 'TOTP验证码应为6位数字'
              break
            case 'sms':
            case 'email':
              // 短信/邮箱验证码：6位数字
              pattern = /^\d{6}$/
              message = '验证码应为6位数字'
              break
            default:
              pattern = /^\d{4,8}$/
              message = '验证码格式不正确'
          }
        }
        
        if (!pattern.test(value)) {
          callback(new Error(message))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

/**
 * 获取验证方式图标
 */
const getVerificationIcon = (method: string): string => {
  const iconMap: Record<string, string> = {
    totp: '📱',
    sms: '💬',
    email: '📧',
    backup: '🔑'
  }
  return iconMap[method] || '🔐'
}

/**
 * 获取验证方式名称
 */
const getVerificationName = (method: string): string => {
  const nameMap: Record<string, string> = {
    totp: 'TOTP动态验证码',
    sms: '短信验证码',
    email: '邮箱验证码',
    backup: '备用验证码'
  }
  return nameMap[method] || '验证码'
}

/**
 * 获取验证码输入框提示
 */
const getCodePlaceholder = (method: string): string => {
  if (useBackupCode.value) {
    return '请输入8位备用验证码'
  }
  
  switch (method) {
    case 'totp':
      return '请输入6位TOTP验证码'
    case 'sms':
      return '请输入6位短信验证码'
    case 'email':
      return '请输入6位邮箱验证码'
    default:
      return '请输入验证码'
  }
}

/**
 * 掩码邮箱地址
 */
const maskEmail = (email: string): string => {
  if (!email) return ''
  const [username, domain] = email.split('@')
  if (!username || !domain) return email
  if (username.length <= 2) {
    return `${username[0]}*@${domain}`
  }
  return `${username.substring(0, 2)}${'*'.repeat(username.length - 2)}@${domain}`
}

/**
 * 处理验证码输入
 */
const handleCodeInput = (value: string) => {
  // 清除错误信息
  if (errorMessage.value) {
    errorMessage.value = ''
  }
  
  // 如果选择了备用码，自动转为大写
  if (useBackupCode.value) {
    verifyForm.code = value.toUpperCase()
  } else {
    // 其他情况只保留数字
    verifyForm.code = value.replace(/\D/g, '')
  }
}

/**
 * 开始重新发送倒计时
 */
const startResendCooldown = (seconds: number = 60) => {
  resendCooldown.value = seconds
  canResend.value = false
  
  resendTimer = window.setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      if (resendTimer) {
        clearInterval(resendTimer)
        resendTimer = null
      }
      canResend.value = true
    }
  }, 1000)
}

/**
 * 处理重新发送验证码
 */
const handleResend = async () => {
  if (!canResend.value) return
  
  loading.value = true
  try {
    // 获取临时登录信息
    const tempInfo = tempLoginInfo.value || JSON.parse(localStorage.getItem('temp_login_info') || '{}')
    
    if (!tempInfo.userId) {
      ElMessage.error('登录信息已过期，请重新登录')
      handleBackToLogin()
      return
    }
    
    // 调用生成验证码接口
    const response = await generateTwoFactorCode({
      userId: tempInfo.userId,
      method: selectedMethod.value
    })
    
    if (response.success) {
      ElMessage.success('验证码已重新发送')
      startResendCooldown()
    } else {
      ElMessage.error(response.message || '发送验证码失败')
    }
  } catch (error) {
    console.error('重新发送验证码失败:', error)
    ElMessage.error('发送验证码失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

/**
 * 处理验证码验证
 */
const handleVerify = async () => {
  if (!verifyFormRef.value) return
  
  try {
    // 表单验证
    await verifyFormRef.value.validate()
    
    loading.value = true
    errorMessage.value = ''
    
    // 获取临时登录信息
    const tempInfo = tempLoginInfo.value || JSON.parse(localStorage.getItem('temp_login_info') || '{}')
    
    if (!tempInfo.userId) {
      ElMessage.error('登录信息已过期，请重新登录')
      handleBackToLogin()
      return
    }
    
    // 调用验证接口
    const response = await verifyTwoFactor({
      userId: tempInfo.userId,
      code: verifyForm.code,
      codeType: useBackupCode.value ? 'backup' : selectedMethod.value
    })
    
    // 注意：后端返回双层嵌套结构 response.data.data.xxx
    const responseData = (response as any).data?.data || response.data;
    
    if (response.success && responseData?.verified) {
      // 验证成功，保存令牌
      if (responseData.token) {
        localStorage.setItem('access_token', responseData.token)
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userId', tempInfo.userId.toString())
      }
      
      // 清除临时登录信息
      localStorage.removeItem('temp_login_info')
      
      ElMessage.success('验证成功，正在跳转...')
      
      // 跳转到仪表盘
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } else {
      // 验证失败
      const errorMsg = response.message || '验证码错误，请重试'
      errorMessage.value = errorMsg
      
      if (errorMsg.includes('过期')) {
        ElMessage.warning('验证码已过期，请重新获取')
      } else if (errorMsg.includes('次数')) {
        ElMessage.warning('验证次数过多，请稍后再试')
      }
    }
  } catch (error) {
    console.error('验证失败:', error)
    errorMessage.value = '验证失败，请检查验证码后重试'
  } finally {
    loading.value = false
  }
}

/**
 * 返回登录页面
 */
const handleBackToLogin = () => {
  // 清除临时登录信息
  localStorage.removeItem('temp_login_info')
  router.push('/login')
}

/**
 * 初始化组件
 */
const initComponent = () => {
  // 获取用户信息
  userInfo.value = getLocalUserInfo()
  
  // 获取临时登录信息
  const tempInfo = localStorage.getItem('temp_login_info')
  if (tempInfo) {
    try {
      tempLoginInfo.value = JSON.parse(tempInfo)
    } catch (error) {
      console.error('解析临时登录信息失败:', error)
    }
  }
  
  // 如果没有临时登录信息，返回登录页
  if (!tempLoginInfo.value || !tempLoginInfo.value.userId) {
    ElMessage.error('登录信息已过期，请重新登录')
    handleBackToLogin()
    return
  }
  
  // 检查两步验证状态
  checkTwoFactorStatus()
}

/**
 * 检查两步验证状态
 */
const checkTwoFactorStatus = async () => {
  try {
    const tempInfo = tempLoginInfo.value
    if (!tempInfo?.userId) return
    
    const response = await getTwoFactorStatus(tempInfo.userId)
    if (response.success && response.data) {
      const status = response.data
      // 根据状态设置可用的验证方式
      availableMethods.value = []
      if (status.totpEnabled) availableMethods.value.push('totp')
      if (status.smsEnabled) availableMethods.value.push('sms')
      if (status.emailEnabled) availableMethods.value.push('email')
      
      // 默认选择第一个可用的验证方式
      if (availableMethods.value.length > 0) {
        selectedMethod.value = availableMethods.value[0] || 'totp'
      }
      
      // 检查是否可以重新发送（除了TOTP）
      canResend.value = selectedMethod.value !== 'totp'
    }
  } catch (error) {
    console.error('获取两步验证状态失败:', error)
  }
}

/**
 * 组件挂载
 */
onMounted(() => {
  initComponent()
})

/**
 * 组件卸载
 */
onUnmounted(() => {
  if (resendTimer) {
    clearInterval(resendTimer)
  }
})
</script>

<style scoped>
.two-factor-verify-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.verify-wrapper {
  display: flex;
  max-width: 1000px;
  width: 100%;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-content {
  text-align: center;
  max-width: 300px;
}

.brand-logo {
  margin-bottom: 40px;
}

.logo-circle {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 32px;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 10px;
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0 0 40px;
}

.security-info {
  text-align: left;
}

.security-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.security-info h3 {
  font-size: 24px;
  margin: 0 0 15px;
}

.security-info p {
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.6;
  margin: 0 0 30px;
}

.verification-types {
  list-style: none;
  padding: 0;
  margin: 0;
}

.verification-type {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
}

.type-icon {
  margin-right: 12px;
  font-size: 18px;
}

.verify-section {
  flex: 1;
  padding: 60px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.verify-card {
  width: 100%;
  max-width: 400px;
}

.card-header {
  text-align: center;
  margin-bottom: 40px;
}

.card-header h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 10px;
  color: #2d3748;
}

.card-header p {
  font-size: 16px;
  color: #718096;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  background: #f7fafc;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  border: 1px solid #e2e8f0;
}

.user-avatar {
  margin-right: 15px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-details h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px;
  color: #2d3748;
}

.user-details p {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.verify-input {
  width: 100%;
}

.input-icon {
  font-size: 18px;
}

.verification-methods {
  margin-bottom: 24px;
}

.method-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-radio {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.method-radio:hover {
  border-color: #667eea;
}

.method-radio.is-checked {
  border-color: #667eea;
  background: #f0f4ff;
}

.method-content {
  display: flex;
  align-items: center;
}

.method-icon {
  margin-right: 10px;
  font-size: 18px;
}

.method-text {
  font-size: 14px;
  font-weight: 500;
}

.resend-section {
  text-align: center;
  margin-bottom: 20px;
}

.resend-button {
  color: #667eea;
  font-size: 14px;
}

.resend-button:disabled {
  color: #a0aec0;
}

.error-section {
  margin-bottom: 20px;
}

.verify-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
}

.back-section {
  text-align: center;
  margin-top: 20px;
}

.back-button {
  color: #718096;
  font-size: 14px;
}

.tips-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.tip-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  color: #718096;
}

.tip-icon {
  margin-right: 10px;
  font-size: 16px;
}

.tip-text {
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .verify-wrapper {
    flex-direction: column;
  }
  
  .brand-section {
    padding: 40px 20px;
  }
  
  .verify-section {
    padding: 40px 20px;
  }
  
  .brand-content {
    max-width: 250px;
  }
  
  .method-group {
    gap: 8px;
  }
}
</style>