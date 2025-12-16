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
                id="register-username"
                v-model="registerForm.username"
                placeholder="请输入用户名"
                prefix-icon="User"
                size="large"
                clearable
                aria-describedby="register-username-help"
              />
              <div id="register-username-help" class="sr-only">请输入您的用户名，长度应在3到20个字符之间</div>
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input
                id="register-email"
                v-model="registerForm.email"
                placeholder="请输入邮箱地址"
                prefix-icon="Message"
                size="large"
                clearable
                aria-describedby="register-email-help"
              />
              <div id="register-email-help" class="sr-only">请输入有效的邮箱地址</div>
            </el-form-item>

            <!-- 新增昵称输入框 -->
            <el-form-item label="昵称（可选）" prop="nickname">
              <el-input
                id="register-nickname"
                v-model="registerForm.nickname"
                placeholder="请输入昵称"
                prefix-icon="User"
                size="large"
                clearable
                aria-describedby="register-nickname-help"
              />
              <div id="register-nickname-help" class="sr-only">请输入您的昵称（可选）</div>
            </el-form-item>

            <!-- 新增手机号输入框 -->
            <el-form-item label="手机号（可选）" prop="phone">
              <el-input
                id="register-phone"
                v-model="registerForm.phone"
                placeholder="请输入手机号"
                prefix-icon="Phone"
                size="large"
                clearable
                aria-describedby="register-phone-help"
              />
              <div id="register-phone-help" class="sr-only">请输入您的手机号（可选）</div>
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                id="register-password"
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                size="large"
                show-password
                clearable
                @input="updatePasswordStrength"
                aria-describedby="register-password-help register-password-requirements"
              />
              <div id="register-password-help" class="sr-only">请输入密码，至少8个字符，包含大小写字母、数字和特殊字符</div>
              <div class="password-strength-indicator" v-if="registerForm.password" role="status" aria-live="polite">
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
                <div class="strength-text" :class="'text-' + calculatedStrength.level.toLowerCase()">
                  {{ calculatedStrength.level }}
                </div>
              </div>
              
              <!-- 密码要求检查 -->
              <div id="register-password-requirements" class="password-requirements" v-if="registerForm.password">
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
                <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.noConsecutive }">
                  <span class="requirement-icon">{{ calculatedStrength.requirements.noConsecutive ? '✓' : '○' }}</span>
                  <span class="requirement-text">连续出现的字符不超过两个</span>
                </div>
              </div>
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                id="register-confirm-password"
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                prefix-icon="Lock"
                size="large"
                show-password
                clearable
                aria-describedby="register-confirm-password-help"
              />
              <div id="register-confirm-password-help" class="sr-only">请再次输入密码以确认</div>
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import authService from '@/services/authService'
import { withLoading } from '@/utils/loadingUtils'
import { handleApiError } from '@/utils/errorUtils'

// 表单验证已移除

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
  nickname: '',  // 新增昵称字段
  phone: '',     // 新增手机号字段
  password: '',
  confirmPassword: ''
})

// 密码强度计算函数
const calculatePasswordStrength = (password: string): { level: string; score: number; requirements: Record<string, boolean> } => {
  const requirements = {
    minLength: password.length >= 8,  // 至少8个字符
    lowercase: /[a-z]/.test(password),  // 小写字母
    uppercase: /[A-Z]/.test(password),  // 大写字母
    number: /\d/.test(password),       // 数字
    special: /[^A-Za-z0-9]/.test(password),  // 特殊字符
    noConsecutive: !/(.)\1{2,}/.test(password)  // 不超过两个连续相同字符
  };
  
  // 计算满足的条件数量
  const satisfiedCount = Object.values(requirements).filter(Boolean).length;
  
  // 根据满足的条件数量确定强度等级
  let level = '弱';
  let score = 0;
  
  if (satisfiedCount >= 5) {
    level = '强';
    score = 3;
  } else if (satisfiedCount >= 3) {
    level = '中';
    score = 2;
  } else {
    score = 1;
  }
  
  return { level, score, requirements };
};

/**
 * 自定义验证规则：确认密码验证
 */
const validateConfirmPassword = (_rule: any, value: string, callback: (error?: Error) => void): void => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 计算属性
const calculatedStrength = computed(() => {
  return calculatePasswordStrength(registerForm.password)
})

// 方法
const updatePasswordStrength = (): void => {
  // 实时更新密码强度，这里不需要做任何事情，因为computed属性会自动更新
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
  // 昵称验证规则（可选，所以不设置required）
  nickname: [
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  // 手机号验证规则（可选，但如果填写了就需要符合手机号格式）
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
        // 检查密码强度
        const strength = calculatePasswordStrength(value);
        const satisfiedCount = Object.values(strength.requirements).filter(Boolean).length;
        
        if (satisfiedCount < 3) {
          callback(new Error('密码必须满足至少3项要求'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

/**
 * 处理注册逻辑
 */
const handleRegister = async (): Promise<void> => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await withLoading(async () => {
          // 构造注册数据，只传递非空字段
          const registerData: any = {
            username: registerForm.username,
            email: registerForm.email,
            password: registerForm.password
          };
          
          // 如果昵称不为空，则添加到注册数据中
          if (registerForm.nickname.trim() !== '') {
            registerData.nickname = registerForm.nickname.trim();
          }
          
          // 如果手机号不为空，则添加到注册数据中
          if (registerForm.phone.trim() !== '') {
            registerData.phone = registerForm.phone.trim();
          }
          
          const response = await authService.register(registerData)
          
          console.log('注册成功:', response)
          ElMessage.success('注册成功！请登录')
          router.push('/login')
        })
      } catch (error) {
        handleApiError(error, '注册失败')
      }
    }
  })
}

/**
 * 跳转到登录页面
 */
const goToLogin = (): void => {
  router.push('/login')
}

/**
 * 跳转到主页
 */
const goToHome = (): void => {
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

/* 密码强度指示器 */
.password-strength-indicator {
  display: flex;
  align-items: center;
  margin-top: 8px;
  gap: 12px;
}

.strength-label {
  font-size: 12px;
  color: #4b5563;
  white-space: nowrap;
}

.strength-bar-container {
  flex: 1;
  height: 6px;
  background-color: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 3px;
}

.strength-bar.strength-weak {
  background-color: #f56c6c;
}

.strength-bar.strength-medium {
  background-color: #e6a23c;
}

.strength-bar.strength-strong {
  background-color: #67c23a;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  min-width: 24px;
  text-align: right;
}

.strength-text.text-弱 {
  color: #f56c6c;
}

.strength-text.text-中 {
  color: #e6a23c;
}

.strength-text.text-强 {
  color: #67c23a;
}

/* 密码要求检查 */
.password-requirements {
  margin-top: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.requirement-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #6b7280;
}

.requirement-item:last-child {
  margin-bottom: 0;
}

.requirement-item.met {
  color: #67c23a;
}

.requirement-icon {
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  margin-right: 8px;
  font-weight: bold;
}

.requirement-text {
  flex: 1;
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
  color: #4b5563;
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
  color: #1f2937;
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