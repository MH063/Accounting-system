<template>
  <div class="security-settings">
    <div class="page-header">
      <h2>安全设置</h2>
      <p>管理您的账户安全和登录设置</p>
    </div>
    
    <div class="settings-content">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 账户安全 -->
        <el-tab-pane label="账户安全" name="account">
          <div class="setting-section">
            <h3>密码安全</h3>
            <div class="setting-item">
              <span class="setting-label">登录密码</span>
              <div class="setting-control">
                <span class="setting-desc">建议您定期更换密码以保护账户安全</span>
                <el-button type="primary" @click="showPasswordDialog = true" size="default">修改密码</el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">密码强度</span>
              <div class="setting-control">
                <span class="setting-desc">当前密码强度：{{ passwordStrength }}</span>
                <div class="strength-indicator">
                  <div class="strength-bar" :class="strengthClass"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>两步验证</h3>
            <div class="setting-item">
              <span class="setting-label">手机验证</span>
              <div class="setting-control">
                <span class="setting-desc">{{ phoneVerified ? '已绑定手机：' + maskedPhone : '未绑定手机' }}</span>
                <el-button :type="phoneVerified ? 'default' : 'primary'" @click="showPhoneDialog = true" size="default">
                  {{ phoneVerified ? '更换' : '绑定' }}
                </el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">邮箱验证</span>
              <div class="setting-control">
                <span class="setting-desc">{{ emailVerified ? '已绑定邮箱：' + maskedEmail : '未绑定邮箱' }}</span>
                <el-button :type="emailVerified ? 'default' : 'primary'" @click="showEmailDialog = true" size="default">
                  {{ emailVerified ? '更换' : '绑定' }}
                </el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">两步验证</span>
              <div class="setting-control">
                <span class="setting-desc">{{ twoFactorEnabled ? '已开启' : '未开启' }}</span>
                <el-switch v-model="twoFactorEnabled" @change="toggleTwoFactor" size="default" />
              </div>
            </div>
            
            <div class="setting-item" v-if="twoFactorEnabled">
              <span class="setting-label">备用验证码</span>
              <div class="setting-control">
                <span class="setting-desc">{{ backupCodesCount }}个备用验证码可用</span>
                <el-button @click="showBackupCodesDialog = true" size="default">查看</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 登录管理 -->
        <el-tab-pane label="登录管理" name="login">
          <div class="setting-section">
            <h3>设备管理</h3>
            <div class="setting-item">
              <span class="setting-label">登录设备</span>
              <div class="setting-control">
                <span class="setting-desc">查看和管理您的登录设备</span>
                <el-button @click="showDeviceDialog = true" size="default">管理设备</el-button>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>登录记录</h3>
            <div class="setting-item">
              <span class="setting-label">最近登录</span>
              <div class="setting-control">
                <span class="setting-desc">查看最近30天的登录记录</span>
                <el-button @click="showLoginHistory = true" size="default">查看记录</el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">详细历史</span>
              <div class="setting-control">
                <span class="setting-desc">详细的登录记录和IP信息</span>
                <el-button @click="showDetailedLoginHistory = true" size="default">详细记录</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 账号保护 -->
        <el-tab-pane label="账号保护" name="protection">
          <div class="setting-section">
            <h3>安全保护</h3>
            <div class="setting-item">
              <span class="setting-label">登录保护</span>
              <div class="setting-control">
                <span class="setting-desc">在新设备登录时需要进行额外验证</span>
                <el-switch v-model="loginProtection" @change="toggleLoginProtection" size="default" />
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">异常登录提醒</span>
              <div class="setting-control">
                <span class="setting-desc">检测到异常登录时发送提醒通知</span>
                <el-switch v-model="abnormalLoginAlert" @change="toggleAbnormalLoginAlert" size="default" />
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>高级设置</h3>
            <div class="setting-item">
              <span class="setting-label">登录限制</span>
              <div class="setting-control">
                <span class="setting-desc">限制同一时间的登录设备数量</span>
                <el-button @click="showLoginLimitDialog = true" size="default">设置</el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">安全问题</span>
              <div class="setting-control">
                <span class="setting-desc">设置安全问题用于身份验证</span>
                <el-button @click="showSecurityQuestionDialog = true" size="default">设置</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 安全日志 -->
        <el-tab-pane label="安全日志" name="logs">
          <div class="setting-section">
            <h3>操作记录</h3>
            <div class="setting-item">
              <span class="setting-label">最近操作</span>
              <div class="setting-control">
                <span class="setting-desc">查看最近的安全相关操作</span>
                <el-button @click="showSecurityLog = true" size="default">查看日志</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 修改密码对话框 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-width="80px" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 绑定手机对话框 -->
    <el-dialog v-model="showPhoneDialog" title="绑定手机" width="400px">
      <el-form :model="phoneForm" label-width="80px">
        <el-form-item label="手机号">
          <el-input v-model="phoneForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="验证码">
          <div class="verify-code-group">
            <el-input v-model="phoneForm.code" placeholder="请输入验证码" />
            <el-button type="primary" :disabled="smsCooldown > 0" @click="sendPhoneCode">
              {{ smsCooldown > 0 ? `${smsCooldown}秒后重试` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPhoneDialog = false">取消</el-button>
        <el-button type="primary" @click="bindPhone">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 绑定邮箱对话框 -->
    <el-dialog v-model="showEmailDialog" title="绑定邮箱" width="400px">
      <el-form :model="emailForm" label-width="80px">
        <el-form-item label="邮箱">
          <el-input v-model="emailForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="验证码">
          <div class="verify-code-group">
            <el-input v-model="emailForm.code" placeholder="请输入验证码" />
            <el-button type="primary" :disabled="emailCooldown > 0" @click="sendEmailCode">
              {{ emailCooldown > 0 ? `${emailCooldown}秒后重试` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEmailDialog = false">取消</el-button>
        <el-button type="primary" @click="bindEmail">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 设备管理对话框 -->
    <el-dialog v-model="showDeviceDialog" title="设备管理" width="600px">
      <div class="device-list">
        <div class="device-item" v-for="device in loginDevices" :key="device.id">
          <div class="device-info">
            <div class="device-name">{{ device.name }}</div>
            <div class="device-time">{{ device.lastLogin }}</div>
            <div class="device-location">{{ device.location }}</div>
          </div>
          <div class="device-actions">
            <el-button type="danger" size="small" @click="removeDevice(device.id)">移除</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 登录历史对话框 -->
    <el-dialog v-model="showLoginHistory" title="登录历史" width="600px">
      <div class="login-history">
        <div class="login-item" v-for="record in loginHistory" :key="record.id">
          <div class="login-time">{{ record.time }}</div>
          <div class="login-device">{{ record.device }}</div>
          <div class="login-ip">IP: {{ record.ip }}</div>
          <div class="login-location">{{ record.location }}</div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 安全日志对话框 -->
    <el-dialog
      v-model="showSecurityLog"
      title="安全日志"
      width="600px"
    >
      <div class="log-container">
        <div class="log-item" v-for="log in securityLogs" :key="log.id">
          <div class="log-time">{{ log.time }}</div>
          <div class="log-action">{{ log.action }}</div>
          <div class="log-ip">IP: {{ log.ip }}</div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 备用验证码对话框 -->
    <el-dialog
      v-model="showBackupCodesDialog"
      title="备用验证码"
      width="500px"
    >
      <div class="backup-codes-container">
        <p class="backup-codes-desc">请妥善保存这些备用验证码，当无法接收短信或邮件时使用</p>
        <div class="backup-codes-grid">
          <div 
            class="backup-code-item" 
            v-for="(code, index) in backupCodes" 
            :key="index"
            @click="copyBackupCode(code)"
          >
            <span class="code-number">{{ index + 1 }}.</span>
            <span class="code-text">{{ code }}</span>
            <span class="copy-icon">📋</span>
          </div>
        </div>
        <div class="backup-codes-actions">
          <el-button @click="regenerateBackupCodes" type="primary">重新生成</el-button>
          <el-button @click="showBackupCodesDialog = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>
    
    <!-- 登录限制对话框 -->
    <el-dialog
      v-model="showLoginLimitDialog"
      title="登录限制设置"
      width="500px"
    >
      <el-form :model="loginLimitForm" label-width="120px">
        <el-form-item label="最大设备数">
          <el-input-number 
            v-model="loginLimitForm.maxDevices" 
            :min="1" 
            :max="10"
            controls-position="right"
          />
          <span class="form-desc">同时在线的最大设备数量</span>
        </el-form-item>
        <el-form-item label="自动登出">
          <el-switch v-model="loginLimitForm.autoLogout" />
          <span class="form-desc">超过设备限制时自动登出最早登录的设备</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLoginLimitDialog = false">取消</el-button>
          <el-button type="primary" @click="saveLoginLimit">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 安全问题对话框 -->
    <el-dialog
      v-model="showSecurityQuestionDialog"
      title="设置安全问题"
      width="600px"
    >
      <el-form :model="securityQuestionForm" label-width="120px">
        <el-form-item label="问题1">
          <el-select v-model="securityQuestionForm.question1" placeholder="选择安全问题">
            <el-option label="您的出生地是哪里？" value="birthplace" />
            <el-option label="您母亲的姓名是？" value="mother_name" />
            <el-option label="您的第一个宠物名字是？" value="first_pet" />
            <el-option label="您最喜欢的老师是？" value="favorite_teacher" />
            <el-option label="您的第一辆车是？" value="first_car" />
          </el-select>
        </el-form-item>
        <el-form-item label="答案1">
          <el-input v-model="securityQuestionForm.answer1" placeholder="请输入答案" />
        </el-form-item>
        
        <el-form-item label="问题2">
          <el-select v-model="securityQuestionForm.question2" placeholder="选择安全问题">
            <el-option label="您最喜欢的颜色是？" value="favorite_color" />
            <el-option label="您父亲的姓名是？" value="father_name" />
            <el-option label="您最好的朋友是？" value="best_friend" />
            <el-option label="您最喜欢的食物是？" value="favorite_food" />
            <el-option label="您的第一个工作是？" value="first_job" />
          </el-select>
        </el-form-item>
        <el-form-item label="答案2">
          <el-input v-model="securityQuestionForm.answer2" placeholder="请输入答案" />
        </el-form-item>
        
        <el-form-item label="问题3">
          <el-select v-model="securityQuestionForm.question3" placeholder="选择安全问题">
            <el-option label="您最喜欢的运动是？" value="favorite_sport" />
            <el-option label="您最难忘的旅行是？" value="memorable_trip" />
            <el-option label="您最喜欢的电影是？" value="favorite_movie" />
            <el-option label="您小时候的昵称是？" value="childhood_nickname" />
            <el-option label="您最喜欢的书籍是？" value="favorite_book" />
          </el-select>
        </el-form-item>
        <el-form-item label="答案3">
          <el-input v-model="securityQuestionForm.answer3" placeholder="请输入答案" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSecurityQuestionDialog = false">取消</el-button>
          <el-button type="primary" @click="saveSecurityQuestions">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 详细登录历史对话框 -->
    <el-dialog
      v-model="showDetailedLoginHistory"
      title="详细登录历史"
      width="700px"
    >
      <div class="detailed-login-history">
        <div class="login-history-item" v-for="history in detailedLoginHistory" :key="history.id">
          <div class="login-info">
            <div class="login-time">{{ history.time }}</div>
            <div class="login-device">{{ history.device }}</div>
            <div class="login-browser">{{ history.browser }}</div>
          </div>
          <div class="login-location">
            <div class="login-ip">IP: {{ history.ip }}</div>
            <div class="login-address">{{ history.location }}</div>
          </div>
          <div class="login-status">
            <el-tag :type="history.status === '成功' ? 'success' : 'danger'">
              {{ history.status }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 当前激活的标签页
const activeTab = ref('account')

// 安全状态
const phoneVerified = ref(true)
const emailVerified = ref(true)
const twoFactorEnabled = ref(false)
const passwordStrength = ref('强')
const loginProtection = ref(false)
const abnormalLoginAlert = ref(true)

// 对话框显示状态
const showPasswordDialog = ref(false)
const showPhoneDialog = ref(false)
const showEmailDialog = ref(false)
const showDeviceDialog = ref(false)
const showLoginHistory = ref(false)
const showSecurityLog = ref(false)
const showBackupCodesDialog = ref(false)
const showLoginLimitDialog = ref(false)
const showSecurityQuestionDialog = ref(false)
const showDetailedLoginHistory = ref(false)

// 表单数据
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const phoneForm = reactive({
  phone: '',
  code: ''
})

const emailForm = reactive({
  email: '',
  code: ''
})

const loginLimitForm = reactive({
  maxDevices: 3,
  autoLogout: true
})

const securityQuestionForm = reactive({
  question1: '',
  answer1: '',
  question2: '',
  answer2: '',
  question3: '',
  answer3: ''
})

// 密码验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性
const maskedPhone = computed(() => {
  return phoneVerified.value ? '138****8888' : ''
})

const maskedEmail = computed(() => {
  return emailVerified.value ? 'user@***.com' : ''
})

const strengthClass = computed(() => {
  switch (passwordStrength.value) {
    case '弱':
      return 'strength-weak'
    case '中':
      return 'strength-medium'
    case '强':
      return 'strength-strong'
    default:
      return 'strength-strong'
  }
})

const backupCodesCount = computed(() => {
  return backupCodes.value.length
})

// 模拟数据
const backupCodes = ref([
  '123456', '789012', '345678', '901234', '567890', '234567',
  '890123', '456789', '012345', '678901', '234567', '890123'
])

const loginDevices = ref([
  {
    id: 1,
    name: 'Chrome - Windows 10',
    lastLogin: '2024-01-15 14:30:25',
    location: '北京市'
  },
  {
    id: 2,
    name: 'Safari - iPhone',
    lastLogin: '2024-01-15 10:15:30',
    location: '上海市'
  },
  {
    id: 3,
    name: 'Firefox - macOS',
    lastLogin: '2024-01-14 18:45:12',
    location: '广州市'
  }
])

const loginHistory = ref([
  {
    id: 1,
    time: '2024-01-15 14:30:25',
    device: 'Chrome - Windows 10',
    ip: '192.168.1.100',
    location: '北京市'
  },
  {
    id: 2,
    time: '2024-01-15 10:15:30',
    device: 'Safari - iPhone',
    ip: '192.168.1.101',
    location: '上海市'
  },
  {
    id: 3,
    time: '2024-01-14 18:45:12',
    device: 'Firefox - macOS',
    ip: '192.168.1.102',
    location: '广州市'
  }
])

const securityLogs = ref([
  {
    id: 1,
    time: '2024-01-15 14:30:25',
    action: '登录成功',
    ip: '192.168.1.100'
  },
  {
    id: 2,
    time: '2024-01-15 10:15:30',
    action: '修改密码',
    ip: '192.168.1.101'
  },
  {
    id: 3,
    time: '2024-01-14 18:45:12',
    action: '绑定手机',
    ip: '192.168.1.102'
  }
])

const detailedLoginHistory = ref([
  {
    id: 1,
    time: '2024-01-15 14:30:25',
    device: 'Chrome - Windows 10',
    browser: 'Chrome 120.0',
    ip: '192.168.1.100',
    location: '北京市朝阳区',
    status: '成功'
  },
  {
    id: 2,
    time: '2024-01-15 10:15:30',
    device: 'Safari - iPhone',
    browser: 'Safari 17.1',
    ip: '192.168.1.101',
    location: '上海市浦东新区',
    status: '成功'
  },
  {
    id: 3,
    time: '2024-01-14 18:45:12',
    device: 'Firefox - macOS',
    browser: 'Firefox 121.0',
    ip: '192.168.1.102',
    location: '广州市天河区',
    status: '失败'
  }
])

// 倒计时
const smsCooldown = ref(0)
const emailCooldown = ref(0)

// 方法
const changePassword = () => {
  // 模拟密码修改
  ElMessage.success('密码修改成功')
  showPasswordDialog.value = false
  // 重置表单
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const toggleTwoFactor = (value: boolean) => {
  if (value) {
    ElMessage.success('两步验证已开启')
  } else {
    ElMessage.warning('两步验证已关闭')
  }
}

const toggleLoginProtection = (value: boolean) => {
  if (value) {
    ElMessage.success('登录保护已开启')
  } else {
    ElMessage.warning('登录保护已关闭')
  }
}

const toggleAbnormalLoginAlert = (value: boolean) => {
  if (value) {
    ElMessage.success('异常登录提醒已开启')
  } else {
    ElMessage.warning('异常登录提醒已关闭')
  }
}

const sendPhoneCode = () => {
  // 模拟发送验证码
  smsCooldown.value = 60
  const timer = setInterval(() => {
    smsCooldown.value--
    if (smsCooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  ElMessage.success('验证码已发送到您的手机')
}

const sendEmailCode = () => {
  // 模拟发送验证码
  emailCooldown.value = 60
  const timer = setInterval(() => {
    emailCooldown.value--
    if (emailCooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  ElMessage.success('验证码已发送到您的邮箱')
}

const bindPhone = () => {
  if (!phoneForm.phone || !phoneForm.code) {
    ElMessage.error('请填写完整信息')
    return
  }
  phoneVerified.value = true
  ElMessage.success('手机绑定成功')
  showPhoneDialog.value = false
}

const bindEmail = () => {
  if (!emailForm.email || !emailForm.code) {
    ElMessage.error('请填写完整信息')
    return
  }
  emailVerified.value = true
  ElMessage.success('邮箱绑定成功')
  showEmailDialog.value = false
}

const removeDevice = (deviceId: number) => {
  ElMessageBox.confirm('确定要移除该设备吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = loginDevices.value.findIndex(device => device.id === deviceId)
    if (index > -1) {
      loginDevices.value.splice(index, 1)
    }
    ElMessage.success('设备移除成功')
  }).catch(() => {
    // 取消操作
  })
}

const copyBackupCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('验证码已复制到剪贴板')
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = code
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('验证码已复制到剪贴板')
  }
}

const regenerateBackupCodes = () => {
  ElMessageBox.confirm('重新生成备用验证码将使之前的验证码失效，是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟重新生成验证码
    backupCodes.value = Array.from({ length: 12 }, (_, i) => 
      Math.floor(100000 + Math.random() * 900000).toString()
    )
    ElMessage.success('备用验证码已重新生成')
  }).catch(() => {
    // 取消操作
  })
}

const saveLoginLimit = () => {
  ElMessage.success('登录限制设置已保存')
  showLoginLimitDialog.value = false
}

const saveSecurityQuestions = () => {
  if (!securityQuestionForm.question1 || !securityQuestionForm.answer1 ||
      !securityQuestionForm.question2 || !securityQuestionForm.answer2 ||
      !securityQuestionForm.question3 || !securityQuestionForm.answer3) {
    ElMessage.error('请填写所有安全问题和答案')
    return
  }
  ElMessage.success('安全问题设置成功')
  showSecurityQuestionDialog.value = false
}

// 生命周期
onMounted(() => {
  // 模拟加载数据
  console.log('安全设置页面加载完成')
})
</script>

<style scoped>
.security-settings {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 500;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.settings-content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.settings-tabs {
  margin-bottom: 20px;
}

.setting-section {
  margin-bottom: 32px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  min-width: 120px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.setting-control {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-left: 24px;
}

.setting-desc {
  color: #909399;
  font-size: 13px;
  margin-right: 16px;
}

.strength-indicator {
  width: 100px;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
  margin-left: 8px;
}

.strength-bar {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.strength-weak {
  width: 33%;
  background: #f56c6c;
}

.strength-medium {
  width: 66%;
  background: #e6a23c;
}

.strength-strong {
  width: 100%;
  background: #67c23a;
}

.verify-code-group {
  display: flex;
  gap: 10px;
}

.verify-code-group .el-input {
  flex: 1;
}

.device-list {
  max-height: 400px;
  overflow-y: auto;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.device-item:last-child {
  border-bottom: none;
}

.device-info {
  flex: 1;
}

.device-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.device-time {
  color: #909399;
  font-size: 13px;
  margin-bottom: 2px;
}

.device-location {
  color: #909399;
  font-size: 13px;
}

.device-actions {
  margin-left: 16px;
}

.login-history {
  max-height: 400px;
  overflow-y: auto;
}

.login-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.login-item:last-child {
  border-bottom: none;
}

.login-time {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.login-device {
  color: #606266;
  margin-bottom: 2px;
}

.login-ip {
  color: #909399;
  font-size: 13px;
  margin-bottom: 2px;
}

.login-location {
  color: #909399;
  font-size: 13px;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
}

.log-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.log-action {
  color: #606266;
  margin-bottom: 2px;
}

.log-ip {
  color: #909399;
  font-size: 13px;
}

.backup-codes-container {
  padding: 20px 0;
}

.backup-codes-desc {
  color: #909399;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.backup-codes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.backup-code-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.backup-code-item:hover {
  background: #e6e8eb;
}

.code-number {
  color: #909399;
  font-size: 12px;
  margin-right: 8px;
  min-width: 20px;
}

.code-text {
  flex: 1;
  font-family: monospace;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.copy-icon {
  color: #409eff;
  font-size: 14px;
  margin-left: 8px;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.backup-code-item:hover .copy-icon {
  opacity: 1;
}

.backup-codes-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.form-desc {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.detailed-login-history {
  max-height: 500px;
  overflow-y: auto;
}

.login-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.login-history-item:last-child {
  border-bottom: none;
}

.login-info {
  flex: 1;
}

.login-time {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.login-device {
  color: #606266;
  margin-bottom: 2px;
}

.login-browser {
  color: #909399;
  font-size: 13px;
}

.login-location {
  text-align: center;
  margin: 0 16px;
}

.login-ip {
  color: #606266;
  margin-bottom: 2px;
}

.login-address {
  color: #909399;
  font-size: 13px;
}

.login-status {
  margin-left: 16px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .security-settings {
    padding: 16px;
  }
  
  .settings-content {
    padding: 16px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .setting-control {
    margin-left: 0;
    margin-top: 8px;
    width: 100%;
  }
  
  .setting-label {
    min-width: auto;
  }
  
  .backup-codes-grid {
    grid-template-columns: 1fr;
  }
  
  .login-history-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .login-location {
    margin: 8px 0;
    text-align: left;
  }
  
  .login-status {
    margin-left: 0;
    margin-top: 8px;
  }
  
  .device-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .device-actions {
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>