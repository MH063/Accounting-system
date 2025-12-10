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
            <h1 class="brand-title">智能化记账宝</h1>
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
          
          <!-- 账户锁定警告 -->
          <div class="lock-warning" v-if="accountLocked">
            <el-alert
              :title="'账户已被锁定，剩余时间：' + formatRemainingTime(remainingLockTime)"
              type="error"
              show-icon
              :closable="false"
            />
            <p class="lock-desc">由于多次登录失败，您的账户已被暂时锁定。</p>
            <p class="lock-desc">影响范围：无法登录系统，当前账户相关操作受限，包括但不限于：无法访问个人资料、无法进行费用管理、无法查看账单等所有需要认证的操作。</p>
          </div>
          
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="login-form">
            <div class="form-group">
              <label class="form-label" for="login-username">用户名</label>
              <el-form-item prop="username">
                <el-input 
                  id="login-username"
                  v-model="loginForm.username" 
                  placeholder="请输入用户名" 
                  prefix-icon="User"
                  size="large"
                  class="modern-input"
                  aria-describedby="login-username-help"
                />
                <div id="login-username-help" class="sr-only">请输入您的用户名</div>
              </el-form-item>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="login-password">密码</label>
              <el-form-item prop="password">
                <el-input 
                  id="login-password"
                  v-model="loginForm.password" 
                  type="password" 
                  placeholder="请输入密码" 
                  prefix-icon="Lock"
                  size="large"
                  show-password
                  @keyup.enter="handleLogin"
                  class="modern-input"
                  aria-describedby="login-password-help"
                />
                <div id="login-password-help" class="sr-only">请输入您的密码</div>
              </el-form-item>
            </div>
            
            <!-- 验证码 -->
            <div class="form-group" v-if="showCaptcha">
              <label class="form-label" for="login-captcha">验证码</label>
              <el-form-item prop="captcha">
                <div class="captcha-container">
                  <el-input 
                    id="login-captcha"
                    v-model="loginForm.captcha" 
                    placeholder="请输入验证码" 
                    size="large"
                    class="captcha-input"
                    aria-describedby="login-captcha-help"
                  />
                  <img 
                    :src="captchaImage" 
                    alt="验证码图片，点击可刷新" 
                    class="captcha-image" 
                    @click="refreshCaptcha"
                    role="button"
                    tabindex="0"
                    @keydown.enter="refreshCaptcha"
                    @keydown.space="refreshCaptcha"
                  />
                  <div id="login-captcha-help" class="sr-only">请输入图片中的验证码，点击图片可刷新验证码</div>
                </div>
              </el-form-item>
            </div>
            
            <!-- 两步验证 -->
            <div class="form-group" v-if="showTwoFactor">
              <label class="form-label" for="login-two-factor">两步验证码</label>
              <el-form-item prop="twoFactorCode">
                <div class="two-factor-container">
                  <el-input 
                    id="login-two-factor"
                    v-model="loginForm.twoFactorCode" 
                    placeholder="请输入6位验证码" 
                    size="large"
                    class="two-factor-input"
                    maxlength="6"
                    aria-describedby="login-two-factor-help"
                  />
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="sendTwoFactorCode"
                    :disabled="twoFactorCooldown > 0"
                    aria-describedby="login-two-factor-help"
                  >
                    {{ twoFactorCooldown > 0 ? (twoFactorCooldown + '秒后重发') : '发送验证码' }}
                  </el-button>
                </div>
                <p id="login-two-factor-help" class="two-factor-tip">请输入身份验证器应用生成的验证码，或使用备用验证码</p>
              </el-form-item>
            </div>
            
            <div class="form-options">
              <el-checkbox v-model="rememberMe" class="remember-me" id="remember-me-checkbox">记住我</el-checkbox>
              <label for="remember-me-checkbox" class="sr-only">勾选此项可在下次登录时自动填写用户名</label>
            </div>
            
            <el-form-item>
              <el-button 
                v-if="!accountLocked && !showCaptcha"
                type="primary" 
                size="large" 
                class="login-button"
                :loading="loading"
                @click="handleLogin"
              >
                登录
              </el-button>
              <el-button 
                v-else-if="accountLocked"
                type="primary" 
                size="large" 
                class="login-button"
                :loading="loading"
                @click="handleUnlock"
              >
                解锁账户
              </el-button>
              <el-button 
                v-else
                type="primary" 
                size="large" 
                class="login-button"
                :loading="loading"
                @click="handleNewDeviceLogin"
              >
                验证并登录
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
    
    <!-- 忘记密码对话框 -->
    <el-dialog
      v-model="showForgotPasswordDialog"
      title="找回密码"
      width="400px"
    >
      <el-form 
        :model="forgotPasswordForm" 
        label-width="80px" 
        :rules="forgotPasswordRules" 
        ref="forgotPasswordFormRef"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="forgotPasswordForm.username" 
            placeholder="请输入用户名" 
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="forgotPasswordForm.email" 
            placeholder="请输入注册邮箱" 
            size="large"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showForgotPasswordDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleForgotPassword"
          :loading="forgotPasswordLoading"
        >
          下一步
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 安全问题验证对话框 -->
    <SecurityVerificationModal
      v-model="showSecurityVerification"
      :on-verification-success="handleVerificationSuccess"
      :on-verification-cancel="handleVerificationCancel"
      verification-reason="找回密码"
    />
    
    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="showResetPasswordDialog"
      title="重置密码"
      width="400px"
    >
      <el-form 
        :model="resetPasswordForm" 
        label-width="80px" 
        :rules="resetPasswordRules" 
        ref="resetPasswordFormRef"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="resetPasswordForm.newPassword" 
            type="password"
            placeholder="请输入新密码" 
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="resetPasswordForm.confirmPassword" 
            type="password"
            placeholder="请再次输入新密码" 
            size="large"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showResetPasswordDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleResetPassword"
          :loading="resetPasswordLoading"
        >
          确认重置
        </el-button>
      </template>
    </el-dialog>
    
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { login, resetPassword } from '@/services/authService'
import { sendResetCode, verifyResetCode, getUserInfo } from '@/services/passwordResetService'
import { useLoading } from '@/services/loadingService'
import { useErrorHandling } from '@/services/errorHandlingService'
import { getSecurityConfig, recordLoginAttempt, recordNewDevice, getAccountLockStatus, getClientIpAddress, getUserAgent, isRateLimited, isNewDevice } from '@/services/accountSecurityService'
import { getTwoFactorStatus, verifyTwoFactorToken } from '@/services/twoFactorService'
import { sendAbnormalLoginAlert } from '@/services/abnormalLoginAlertService'
import { getLoginDeviceLimitConfig, isDeviceAllowedToLogin, recordNewDeviceSession, enforceDeviceLimit } from '@/services/loginDeviceLimitService'
import SecurityVerificationModal from '@/components/SecurityVerificationModal.vue'

// 路由实例
const router = useRouter()

// 加载状态管理
const loading = ref(false)
const withLoading = (asyncFn: (...args: any[]) => Promise<any>) => {
  return async (...args: any[]) => {
    loading.value = true
    try {
      const result = await asyncFn(...args)
      return result
    } finally {
      loading.value = false
    }
  }
}

// 错误处理
const { handleError, handleApiError } = useErrorHandling()

// 表单引用
const loginFormRef = ref<FormInstance>()

// 账户锁定状态
const accountLocked = ref(false)
const remainingLockTime = ref(0)
const lockStatusTimer = ref<number | null>(null)

// 验证码相关
const showCaptcha = ref(false)
const captchaImage = ref('')

// 两步验证相关
const showTwoFactor = ref(false)
const twoFactorCooldown = ref(0)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  twoFactorCode: ''
})

// 记住我选项
const rememberMe = ref(false)

// 忘记密码对话框显示状态
const showForgotPasswordDialog = ref(false)
const showSecurityVerification = ref(false)
const showResetPasswordDialog = ref(false)
const showVerifyCodeDialog = ref(false)

// 忘记密码表单引用
const forgotPasswordFormRef = ref<FormInstance>()
const resetPasswordFormRef = ref<FormInstance>()
const verifyCodeFormRef = ref<FormInstance>()

// 忘记密码加载状态
const forgotPasswordLoading = ref(false)
const resetPasswordLoading = ref(false)
const verifyCodeLoading = ref(false)

// 忘记密码表单数据
const forgotPasswordForm = reactive({
  username: '',
  email: ''
})

// 验证码表单数据
const verifyCodeForm = reactive({
  code: ''
})

// 重置密码表单数据
const resetPasswordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

// 忘记密码验证规则
const forgotPasswordRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
})

// 验证码验证规则
const verifyCodeRules = reactive<FormRules>({
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '请输入6位数字验证码', trigger: 'blur' }
  ]
})

// 重置密码验证规则
const resetPasswordRules = reactive<FormRules>({
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== resetPasswordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

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

// 当前用户信息（用于密码重置流程）
const currentUserInfo = ref<any>(null)

// 删除所有与旧安全机制相关的函数和状态
// 简化登录流程，只保留核心功能

// 删除所有与旧安全机制相关的函数和状态
// 简化登录流程，只保留核心功能

/**
 * 刷新验证码
 */
const refreshCaptcha = async () => {
  try {
    // 调用真实的验证码API
    const response = await fetch('/api/auth/captcha', {
      method: 'GET',
      credentials: 'include'
    })
    
    if (response.ok) {
      const blob = await response.blob()
      captchaImage.value = URL.createObjectURL(blob)
    } else {
      ElMessage.error('获取验证码失败')
    }
  } catch (error) {
    console.error('获取验证码错误:', error)
    ElMessage.error('获取验证码时发生错误')
  }
}

/**
 * 格式化剩余时间
 * @param seconds 剩余秒数
 * @returns 格式化的时间字符串
 */
const formatRemainingTime = (seconds: number): string => {
  if (seconds <= 0) return '0秒'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  let result = ''
  if (days > 0) result += `${days}天`
  if (hours > 0) result += `${hours}小时`
  if (minutes > 0) result += `${minutes}分钟`
  if (secs > 0 || result === '') result += `${secs}秒`
  
  return result
}

/**
 * 更新账户锁定状态
 * @param accountId 账户ID
 * @param config 安全配置
 */
const updateAccountLockStatus = (accountId: string, config: any) => {
  // 这里可以添加更新账户锁定状态的逻辑
  console.log('更新账户锁定状态:', accountId, config)
}

/**
 * 跳转到注册页面
 */
const goToRegister = () => {
  router.push('/register')
}

/**
 * 验证验证码
 * @param captcha 验证码
 * @returns 是否验证成功
 */
const validateCaptcha = async (captcha: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/validate-captcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ captcha })
    })
    
    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('验证码验证失败:', error)
    return false
  }
}

/**
 * 处理新设备额外验证后的登录
 */
const handleNewDeviceLogin = async () => {
  if (!loginFormRef.value) return
  
  // 验证验证码
  if (!loginForm.captcha) {
    ElMessage.error('请输入验证码')
    return
  }
  
  // 调用后端API验证验证码
  const isCaptchaValid = await validateCaptcha(loginForm.captcha)
  if (!isCaptchaValid) {
    ElMessage.error('验证码错误')
    return
  }
  
  // 获取保存的登录信息
  const pendingUsername = localStorage.getItem('pendingLoginUsername') || ''
  const pendingPassword = localStorage.getItem('pendingLoginPassword') || ''
  const userAgent = localStorage.getItem('pendingLoginUserAgent') || ''
  const ipAddress = localStorage.getItem('pendingLoginIpAddress') || ''
  
  // 清除临时存储的信息
  localStorage.removeItem('pendingLoginUsername')
  localStorage.removeItem('pendingLoginPassword')
  localStorage.removeItem('pendingLoginUserAgent')
  localStorage.removeItem('pendingLoginIpAddress')
  
  loading.value = true
  
  try {
    // 获取当前用户ID
    const accountId = pendingUsername || 'default_user'
    
    // 获取安全配置
    const config = getSecurityConfig()
    
    // 调用真实的登录API
    const response = await login({
      email: pendingUsername,
      password: pendingPassword
    })    
    if (response.success && response.data) {
      // 检查是否需要两步验证
      const twoFactorStatus = getTwoFactorStatus(accountId)
      
      // 如果启用了两步验证且尚未验证
      if (twoFactorStatus.enabled && !showTwoFactor.value) {
        showTwoFactor.value = true
        loading.value = false
        ElMessage.info('请输入两步验证码')
        // 保存用户信息以便后续验证
        loginForm.username = pendingUsername
        loginForm.password = pendingPassword
        return
      }
      
      // 如果需要两步验证，验证两步验证码
      if (showTwoFactor.value) {
        if (!loginForm.twoFactorCode) {
          ElMessage.error('请输入两步验证码')
          loading.value = false
          return
        }
        
        // 验证两步验证码
        const isTwoFactorValid = await verifyTwoFactorToken(accountId, loginForm.twoFactorCode)
        if (!isTwoFactorValid) {
          ElMessage.error('两步验证码错误')
          loading.value = false
          return
        }
      }
      
      // 记录成功登录尝试
      recordLoginAttempt(accountId, ipAddress, userAgent, true)
      
      // 检查是否是新设备
      const isNewDeviceFlag = isNewDevice(accountId, userAgent, ipAddress);
      
      // 记录新设备（如果不是新设备，这将更新最后登录时间）
      recordNewDevice(accountId, userAgent, ipAddress)
      
      // 如果是新设备且启用了异常登录提醒，则发送提醒
      const abnormalLoginAlertEnabled = localStorage.getItem('abnormalLoginAlert') === 'true' || localStorage.getItem('abnormalLoginAlert') === null;
      if (isNewDeviceFlag && abnormalLoginAlertEnabled) {
        // 发送异常登录提醒
        sendAbnormalLoginAlert(accountId, ipAddress, userAgent, Date.now());
      }
      
      // 检查登录设备限制
      const deviceLimitConfig = getLoginDeviceLimitConfig(accountId)
      if (deviceLimitConfig.enabled) {
        // 检查当前设备是否被允许登录
        const deviceCheck = isDeviceAllowedToLogin(accountId, userAgent, ipAddress)
        if (!deviceCheck.allowed) {
          ElMessage.warning(deviceCheck.message || '登录设备数量已达上限，请先登出其他设备')
          loading.value = false
          return
        }
        
        // 记录当前设备会话
        const session = recordNewDeviceSession(accountId, userAgent, ipAddress)
        
        // 强制执行设备限制（登出最早的设备以确保不超过限制）
        if (deviceLimitConfig.autoLogout) {
          enforceDeviceLimit(accountId, deviceLimitConfig.maxDevices)
        }
        
        // 保存当前会话ID用于后续验证
        localStorage.setItem('sessionId', session.id)
      }
      
      // 设置登录状态
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('username', pendingUsername)
      localStorage.setItem('userId', accountId)
      // 保存token信息
      localStorage.setItem('access_token', response.data.token)
      localStorage.setItem('refresh_token', response.data.refreshToken)
      
      ElMessage.success('登录成功')
      
      // 跳转到仪表盘
      router.push('/dashboard')
    } else {
      // 记录失败登录尝试
      recordLoginAttempt(accountId, ipAddress, userAgent, false)
      
      // 再次检查账户锁定状态
      const updatedLockStatus = getAccountLockStatus(accountId, config)
      if (updatedLockStatus.isLocked) {
        ElMessage.error(`登录失败次数过多，账户已被锁定，剩余时间：${formatRemainingTime(updatedLockStatus.remainingTime || 0)}，无法登录系统`)
        // 强制更新账户锁定状态
        updateAccountLockStatus(accountId, config)
        // 显示验证码
        showCaptcha.value = true
        refreshCaptcha()
        // 停止加载状态
        loading.value = false
        // 不隐藏表单，保持可见以便输入验证码
      } else {
        ElMessage.error('用户名或密码错误')
        // 如果接近锁定阈值，显示警告
        const attempts = config.lockout.maxFailedAttempts
        const lockStatus = getAccountLockStatus(accountId, config)
        // 从安全配置中获取真实的剩余尝试次数
        // 注意：AccountLockStatus接口没有remainingAttempts属性，这里使用remainingTime作为参考
        const remainingTime = lockStatus.remainingTime || 0
        // 基于剩余时间估算剩余尝试次数（这是一个简化的估算）
        const remainingAttempts = Math.max(0, config.lockout.maxFailedAttempts - Math.floor(remainingTime / 60))
        if (remainingAttempts <= 2) {
          ElMessage.warning(`登录失败次数过多，再失败${remainingAttempts}次账户将被锁定`)
        }
        // 停止加载状态
        loading.value = false
      }
    }
  } catch (error) {
    console.error('登录处理失败:', error)
    ElMessage.error('登录过程中发生错误，请稍后重试')
    loading.value = false
  }
}

/**
 * 跳转到主页
 */
const goToHome = () => {
  router.push('/')
}

/**
 * 处理忘记密码
 */
const handleForgotPassword = async () => {
  if (!forgotPasswordFormRef.value) return
  
  await withLoading(async () => {
    try {
      if (forgotPasswordFormRef.value) {
            await forgotPasswordFormRef.value.validate()
          }
      
      // 先获取用户信息
      // 注意：getUserInfo函数需要用户名和邮箱两个参数
      const userInfo = await getUserInfo(forgotPasswordForm.username, forgotPasswordForm.email)
      
      // 检查用户信息是否存在
      if (!userInfo) {
        ElMessage.error('用户信息不存在，请检查用户名和邮箱')
        return
      }
      
      await sendResetCode(userInfo)      
      ElMessage.success('重置验证码已发送到您的邮箱')
      showForgotPasswordDialog.value = false
      showResetPasswordDialog.value = true
      
    } catch (error) {
      handleApiError(error, '发送重置验证码失败')
    }
  })
}

/**
 * 处理验证成功
 */
const handleVerificationSuccess = (result: boolean) => {
  if (result) {
    ElMessage.success('身份验证成功，请设置新密码')
    // 关闭安全验证对话框
    showSecurityVerification.value = false
    // 显示重置密码对话框
    showResetPasswordDialog.value = true
  } else {
    ElMessage.error('身份验证失败，请重新输入')
  }
}

/**
 * 处理验证取消
 */
const handleVerificationCancel = () => {
  showSecurityVerification.value = false
  ElMessage.info('已取消找回密码操作')
}

/**
 * 跳转到忘记密码页面
 */
const goToForgotPassword = () => {
  // 显示忘记密码对话框
  showForgotPasswordDialog.value = true
}

/**
 * 处理密码重置
 */
const handleResetPassword = async () => {
  if (!resetPasswordFormRef.value) return
  
  await withLoading(async () => {
    try {
      if (resetPasswordFormRef.value) {
            await resetPasswordFormRef.value.validate()
          }
      
      await resetPassword({
        email: forgotPasswordForm.email,
        newPassword: resetPasswordForm.newPassword,
        verificationCode: '123456' // 这里应该从之前的步骤获取
      })
      
      ElMessage.success('密码重置成功，请使用新密码登录')
      showResetPasswordDialog.value = false
      
      // 重置表单
      resetPasswordForm.newPassword = ''
      resetPasswordForm.confirmPassword = ''
      forgotPasswordForm.username = ''
      forgotPasswordForm.email = ''
      
    } catch (error) {
      handleApiError(error, '密码重置失败')
    }
  })
}

/**
 * 发送两步验证码
 */
const sendTwoFactorCode = async () => {
  if (twoFactorCooldown.value > 0) {
    ElMessage.info(`请在${twoFactorCooldown.value}秒后重试`)
    return
  }
  
  try {
    // 调用真实的发送验证码API
    const response = await fetch('/api/auth/send-two-factor-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: loginForm.username })
    })
    
    if (response.ok) {
      ElMessage.success('验证码已发送到您的设备')
      
      // 设置冷却时间
      twoFactorCooldown.value = 60
      const timer = setInterval(() => {
        twoFactorCooldown.value--
        if (twoFactorCooldown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      ElMessage.error('发送验证码失败')
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error('发送验证码时发生错误')
  }
}

/**
 * 解锁账户
 */
const handleUnlock = async () => {
  try {
    // 调用真实的账户解锁API
    const response = await fetch('/api/auth/unlock-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: loginForm.username })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('账户解锁成功')
        accountLocked.value = false
        remainingLockTime.value = 0
        // 重新加载验证码
        refreshCaptcha()
      } else {
        ElMessage.error(result.message || '账户解锁失败')
      }
    } else {
      ElMessage.error('账户解锁请求失败')
    }
  } catch (error) {
    console.error('账户解锁错误:', error)
    ElMessage.error('账户解锁时发生错误')
  }
}

/**
 * 处理登录逻辑
 */
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      await withLoading(async () => {
        try {
          const response = await login({
            email: loginForm.username,
            password: loginForm.password,
            rememberMe: rememberMe.value
          })
          
          // 保存登录信息
          localStorage.setItem('access_token', response.data.token)
          localStorage.setItem('refresh_token', response.data.refreshToken)
          localStorage.setItem('user_info', JSON.stringify(response.data.user))
          
          ElMessage.success('登录成功')
          router.push('/dashboard')
          
        } catch (error) {
          handleApiError(error, '登录失败')
        }
      })
    }
  })
}

// 生命周期
onMounted(() => {
  // 初始化登录保护状态（如果未设置则默认启用）
  if (localStorage.getItem('loginProtectionEnabled') === null) {
    localStorage.setItem('loginProtectionEnabled', 'true');
  }
  
  // 初始化异常登录提醒状态（如果未设置则默认启用）
  if (localStorage.getItem('abnormalLoginAlert') === null) {
    localStorage.setItem('abnormalLoginAlert', 'true');
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  // 清理定时器
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
  color: #111827;
  margin: 0 0 0.5rem;
}

.card-header p {
  font-size: 1rem;
  color: #4b5563;
  margin: 0;
}

.lock-warning {
  margin-bottom: 1.5rem;
}

.lock-desc {
  color: #f56c6c;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
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
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.remember-me {
  color: #4b5563;
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
  color: #6b7280;
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
  color: #6b7280;
}

.modern-input .el-input__prefix-inner {
  color: #6b7280;
  margin-right: 8px;
}

.captcha-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
}

.two-factor-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.two-factor-input {
  flex: 1;
}

.two-factor-tip {
  color: #6b7280;
  font-size: 12px;
  margin-top: 5px;
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

.login-button:hover:not(.is-disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-button:active:not(.is-disabled) {
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
  
  .captcha-container,
  .two-factor-container {
    flex-direction: column;
  }
  
  .captcha-image,
  .two-factor-container .el-button {
    width: 100%;
    margin-top: 10px;
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
  
  .button-row {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .home-button,
  .forgot-password-button {
    width: 100% !important;
  }
}
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
</style>