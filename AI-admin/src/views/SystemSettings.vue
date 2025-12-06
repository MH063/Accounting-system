<template>
  <div class="system-settings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
          <el-button type="primary" @click="handleSave">保存设置</el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 基本设置 -->
        <el-tab-pane label="基本设置" name="basic">
          <el-form :model="basicForm" label-width="120px" style="max-width: 600px;">
            <el-form-item label="系统名称">
              <el-input v-model="basicForm.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            
            <el-form-item label="系统描述">
              <el-input 
                v-model="basicForm.systemDescription" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入系统描述" 
              />
            </el-form-item>
            
            <el-form-item label="系统Logo">
              <el-upload
                class="logo-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleLogoSuccess"
                :before-upload="beforeLogoUpload"
              >
                <img v-if="basicForm.logoUrl" :src="basicForm.logoUrl" class="logo" />
                <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="默认主题">
              <el-select v-model="basicForm.theme" placeholder="请选择默认主题">
                <el-option label="默认主题" value="default" />
                <el-option label="深色主题" value="dark" />
                <el-option label="浅色主题" value="light" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="系统语言">
              <el-select v-model="basicForm.language" placeholder="请选择系统语言">
                <el-option label="中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 邮件设置 -->
        <el-tab-pane label="邮件设置" name="email">
          <el-form :model="emailForm" label-width="120px" style="max-width: 600px;">
            <el-form-item label="SMTP服务器">
              <el-input v-model="emailForm.smtpServer" placeholder="请输入SMTP服务器地址" />
            </el-form-item>
            
            <el-form-item label="SMTP端口">
              <el-input-number v-model="emailForm.smtpPort" :min="1" :max="65535" />
            </el-form-item>
            
            <el-form-item label="邮箱账号">
              <el-input v-model="emailForm.emailAccount" placeholder="请输入邮箱账号" />
            </el-form-item>
            
            <el-form-item label="邮箱密码">
              <el-input 
                v-model="emailForm.emailPassword" 
                type="password" 
                placeholder="请输入邮箱密码" 
                show-password 
              />
            </el-form-item>
            
            <el-form-item label="发件人名称">
              <el-input v-model="emailForm.senderName" placeholder="请输入发件人名称" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="testEmailConnection">测试连接</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 安全设置 -->
        <el-tab-pane label="安全设置" name="security">
          <el-form :model="securityForm" label-width="150px" style="max-width: 600px;">
            <el-form-item label="密码强度要求">
              <el-select v-model="securityForm.passwordStrength" placeholder="请选择密码强度要求">
                <el-option label="低（至少6位）" value="low" />
                <el-option label="中（至少8位，包含数字和字母）" value="medium" />
                <el-option label="高（至少10位，包含数字、字母和特殊字符）" value="high" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="登录失败次数限制">
              <el-input-number v-model="securityForm.loginFailCount" :min="1" :max="10" />
              <span class="form-tip">次</span>
            </el-form-item>
            
            <el-form-item label="账户锁定时间">
              <el-input-number v-model="securityForm.lockTime" :min="1" :max="1440" />
              <span class="form-tip">分钟</span>
            </el-form-item>
            
            <el-form-item label="会话超时时间">
              <el-input-number v-model="securityForm.sessionTimeout" :min="1" :max="1440" />
              <span class="form-tip">分钟</span>
            </el-form-item>
            
            <el-form-item label="启用双因素认证">
              <el-switch v-model="securityForm.twoFactorAuth" />
            </el-form-item>
            
            <el-form-item label="IP访问限制">
              <el-switch v-model="securityForm.ipRestriction" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notification">
          <el-form :model="notificationForm" label-width="150px" style="max-width: 600px;">
            <el-form-item label="系统通知方式">
              <el-checkbox-group v-model="notificationForm.systemNotifications">
                <el-checkbox label="email">邮件通知</el-checkbox>
                <el-checkbox label="sms">短信通知</el-checkbox>
                <el-checkbox label="wechat">微信通知</el-checkbox>
                <el-checkbox label="dingtalk">钉钉通知</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="重要操作通知">
              <el-switch v-model="notificationForm.importantOperationNotify" />
            </el-form-item>
            
            <el-form-item label="定时任务通知">
              <el-switch v-model="notificationForm.scheduledTaskNotify" />
            </el-form-item>
            
            <el-form-item label="异常告警通知">
              <el-switch v-model="notificationForm.alertNotify" />
            </el-form-item>
            
            <el-form-item label="通知接收人">
              <el-select 
                v-model="notificationForm.recipients" 
                multiple 
                placeholder="请选择通知接收人"
                style="width: 100%;"
              >
                <el-option 
                  v-for="admin in adminList" 
                  :key="admin.id" 
                  :label="admin.name" 
                  :value="admin.id" 
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref('basic')

const basicForm = ref({
  systemName: 'AI管理系统',
  systemDescription: '基于Vue3的现代化管理平台',
  logoUrl: 'https://picsum.photos/seed/system-logo/100/100.jpg',
  theme: 'default',
  language: 'zh-CN'
})

const emailForm = ref({
  smtpServer: 'smtp.example.com',
  smtpPort: 587,
  emailAccount: 'admin@example.com',
  emailPassword: '',
  senderName: '系统管理员'
})

const securityForm = ref({
  passwordStrength: 'medium',
  loginFailCount: 5,
  lockTime: 30,
  sessionTimeout: 120,
  twoFactorAuth: false,
  ipRestriction: false
})

const notificationForm = ref({
  systemNotifications: ['email'],
  importantOperationNotify: true,
  scheduledTaskNotify: true,
  alertNotify: true,
  recipients: []
})

const adminList = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' }
])

// Logo上传成功处理
const handleLogoSuccess = (response: any, file: any) => {
  basicForm.value.logoUrl = URL.createObjectURL(file.raw)
  ElMessage.success('Logo上传成功')
}

// Logo上传前检查
const beforeLogoUpload = (file: any) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isJPG) {
    ElMessage.error('Logo图片只能是 JPG 或 PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('Logo图片大小不能超过 2MB!')
  }
  
  return isJPG && isLt2M
}

// 测试邮件连接
const testEmailConnection = () => {
  console.log('📧 测试邮件连接:', emailForm.value)
  ElMessage.info('邮件连接测试功能待实现')
}

// 保存设置
const handleSave = () => {
  console.log('💾 保存系统设置:', {
    basic: basicForm.value,
    email: emailForm.value,
    security: securityForm.value,
    notification: notificationForm.value
  })
  ElMessage.success('系统设置保存成功')
}

// 组件挂载
onMounted(() => {
  console.log('⚙️ 系统设置页面加载完成')
})

/**
 * 系统设置页面
 * 管理系统的基本配置、邮件设置、安全设置和通知设置
 */
</script>

<style scoped>
.system-settings-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-uploader .logo {
  width: 178px;
  height: 178px;
  display: block;
}

.logo-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.logo-uploader .el-upload:hover {
  border-color: #409EFF;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
}
</style>