<template>
  <div class="settings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="基本设置" name="basic">
          <el-form :model="basicForm" label-width="120px">
            <el-form-item label="系统名称">
              <el-input v-model="basicForm.systemName" placeholder="请输入系统名称"></el-input>
            </el-form-item>
            <el-form-item label="系统描述">
              <el-input v-model="basicForm.systemDesc" type="textarea" rows="3" placeholder="请输入系统描述"></el-input>
            </el-form-item>
            <el-form-item label="系统Logo">
              <el-upload
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :auto-upload="false"
                :on-change="handleLogoChange"
              >
                <img v-if="basicForm.systemLogo" :src="basicForm.systemLogo" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="系统版本">
              <el-input v-model="basicForm.systemVersion" placeholder="请输入系统版本"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="邮件设置" name="email">
          <el-form :model="emailForm" label-width="120px">
            <el-form-item label="SMTP服务器">
              <el-input v-model="emailForm.smtpServer" placeholder="请输入SMTP服务器地址"></el-input>
            </el-form-item>
            <el-form-item label="SMTP端口">
              <el-input v-model="emailForm.smtpPort" placeholder="请输入SMTP端口"></el-input>
            </el-form-item>
            <el-form-item label="邮箱账号">
              <el-input v-model="emailForm.emailAccount" placeholder="请输入邮箱账号"></el-input>
            </el-form-item>
            <el-form-item label="邮箱密码">
              <el-input v-model="emailForm.emailPassword" type="password" placeholder="请输入邮箱密码"></el-input>
            </el-form-item>
            <el-form-item label="发件人名称">
              <el-input v-model="emailForm.senderName" placeholder="请输入发件人名称"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveEmailSettings">保存设置</el-button>
              <el-button @click="testEmail">测试邮件</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="安全设置" name="security">
          <el-form :model="securityForm" label-width="120px">
            <el-form-item label="密码强度">
              <el-select v-model="securityForm.passwordStrength" placeholder="请选择密码强度">
                <el-option label="低（6位以上）" value="low"></el-option>
                <el-option label="中（8位以上，包含数字和字母）" value="medium"></el-option>
                <el-option label="高（8位以上，包含数字、字母和特殊字符）" value="high"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="登录失败次数">
              <el-input-number v-model="securityForm.loginFailCount" :min="3" :max="10"></el-input-number>
            </el-form-item>
            <el-form-item label="账户锁定时间">
              <el-input-number v-model="securityForm.lockTime" :min="5" :max="60"></el-input-number>
              <span style="margin-left: 10px;">分钟</span>
            </el-form-item>
            <el-form-item label="会话超时">
              <el-input-number v-model="securityForm.sessionTimeout" :min="10" :max="1440"></el-input-number>
              <span style="margin-left: 10px;">分钟</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 当前激活的标签页
const activeTab = ref('basic')

// 基本设置表单
const basicForm = ref({
  systemName: 'AI管理系统',
  systemDesc: '基于Vue3的现代化管理平台',
  systemLogo: 'https://picsum.photos/seed/system-logo/100/100.jpg',
  systemVersion: 'v2.1.0'
})

// 邮件设置表单
const emailForm = ref({
  smtpServer: 'smtp.example.com',
  smtpPort: '587',
  emailAccount: 'admin@example.com',
  emailPassword: '',
  senderName: '系统管理员'
})

// 安全设置表单
const securityForm = ref({
  passwordStrength: 'medium',
  loginFailCount: 5,
  lockTime: 30,
  sessionTimeout: 120
})

// 操作方法
const saveBasicSettings = () => {
  ElMessage.success('基本设置保存成功')
}

const saveEmailSettings = () => {
  ElMessage.success('邮件设置保存成功')
}

const testEmail = () => {
  ElMessage.info('测试邮件功能待实现')
}

const saveSecuritySettings = () => {
  ElMessage.success('安全设置保存成功')
}

const handleLogoChange = (file: any) => {
  basicForm.value.systemLogo = URL.createObjectURL(file.raw)
  ElMessage.success('Logo上传成功')
}

/**
 * 系统设置页面
 * 包含基本设置、邮件设置和安全设置
 */
</script>

<style scoped>
.settings-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-uploader .avatar {
  width: 100px;
  height: 100px;
  display: block;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
}
</style>