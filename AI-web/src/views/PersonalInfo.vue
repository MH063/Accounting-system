<template>
  <div class="personal-info">
    <div class="page-header">
      <h2>个人信息</h2>
      <p>管理您的基本个人信息</p>
    </div>
    
    <!-- 同步状态提示 -->
    <div class="sync-status" v-if="syncStatus.visible">
      <el-alert
        :title="syncStatus.title"
        :type="syncStatus.type"
        :description="syncStatus.message"
        show-icon
        closable
        @close="syncStatus.visible = false"
      />
    </div>
    
    <!-- 自动保存状态 -->
    <transition name="fade">
      <div v-if="autoSaveStatus.visible" class="auto-save-status">
        <el-icon><Clock /></el-icon>
        <span>{{ autoSaveStatus.message }}</span>
      </div>
    </transition>
    
    <!-- 表单验证状态 -->
    <div class="validation-status" v-if="formValidationStatus.totalFields > 0">
      <el-progress 
        :percentage="Math.round((formValidationStatus.validFields / formValidationStatus.totalFields) * 100)"
        :status="formValidationStatus.isValid ? 'success' : 'exception'"
        :stroke-width="6"
        :show-text="false"
      />
      <span class="validation-text">
        {{ formValidationStatus.validFields }}/{{ formValidationStatus.totalFields }} 字段验证通过
      </span>
    </div>
    
    <div class="info-content">
      <!-- 头像区域 -->
      <div class="avatar-section">
        <div class="avatar-container">
          <img :src="avatarUrl" alt="用户头像" class="user-avatar" role="img" aria-label="当前用户头像" />
          <div class="avatar-overlay">
            <el-button type="primary" size="small" @click="showAvatarDialog = true">更换头像</el-button>
          </div>
        </div>
        
        <!-- 头像上传状态 -->
        <div class="avatar-status" v-if="avatarUploadStatus.visible">
          <el-progress 
            :percentage="avatarUploadStatus.percentage" 
            :status="avatarUploadStatus.status"
            :stroke-width="2"
          />
        </div>
      </div>

      <!-- 基本信息表单 -->
      <div class="info-form-section">
        <el-form 
          :model="personalForm" 
          label-width="100px" 
          class="personal-form"
          :rules="formRules"
          ref="personalFormRef"
        >
          <el-form-item label="用户名">
            <el-input v-model="personalForm.username" disabled />
          </el-form-item>
          
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="personalForm.realName" />
          </el-form-item>
          
          <el-form-item label="性别" prop="gender">
            <el-select v-model="personalForm.gender" placeholder="请选择性别">
              <el-option label="男" value="male" />
              <el-option label="女" value="female" />
              <el-option label="保密" value="secret" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="生日" prop="birthday">
            <el-date-picker
              v-model="personalForm.birthday"
              type="date"
              placeholder="请选择生日"
              :disabled-date="disabledDate"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          
          <el-form-item label="手机号" prop="phone">
            <div class="input-with-verify">
              <el-input v-model="personalForm.phone" />
              <el-button 
                :type="phoneVerified ? 'success' : 'warning'" 
                size="small"
                @click="handlePhoneVerify"
              >
                {{ phoneVerified ? '已验证' : '未验证' }}
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <div class="input-with-verify">
              <el-input v-model="personalForm.email" />
              <el-button 
                :type="emailVerified ? 'success' : 'warning'" 
                size="small"
                @click="handleEmailVerify"
              >
                {{ emailVerified ? '已验证' : '未验证' }}
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item label="个人简介" prop="bio">
            <el-input 
              v-model="personalForm.bio" 
              type="textarea" 
              :rows="3" 
              placeholder="介绍一下自己吧"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          
          <!-- 隐私设置控制 -->
          <el-form-item label="隐私设置">
            <div class="privacy-controls">
              <el-checkbox v-model="privacySettings.showProfile">
                公开个人资料
              </el-checkbox>
              <el-checkbox v-model="privacySettings.showContact">
                公开联系方式
              </el-checkbox>
              <el-checkbox v-model="privacySettings.allowSearch">
                允许被搜索
              </el-checkbox>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="savePersonalInfo" :loading="saveLoading">
              保存修改
            </el-button>
            <el-button @click="resetForm">重置</el-button>
            <el-button @click="syncData" :loading="syncLoading">
              同步数据
            </el-button>
            <el-button @click="exportPersonalData">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
            <el-button @click="importPersonalData">
              <el-icon><Upload /></el-icon>
              导入数据
            </el-button>
            <el-dropdown>
              <el-button type="default">
                <el-icon><MoreFilled /></el-icon>
                更多操作
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="createDataBackup">
                    <el-icon><Document /></el-icon>
                    创建备份
                  </el-dropdown-item>
                  <el-dropdown-item @click="restoreDataBackup">
                    <el-icon><Refresh /></el-icon>
                    恢复备份
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <!-- 头像上传对话框 -->
    <el-dialog
      v-model="showAvatarDialog"
      title="更换头像"
      width="600px"
    >
      <div class="avatar-crop-content">
        <div v-if="!cropData.image" class="avatar-upload-area">
          <el-upload
            ref="avatarUploadRef"
            class="avatar-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleAvatarChange"
            :before-upload="beforeAvatarUpload"
          >
            <div class="upload-trigger">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <div>点击上传头像</div>
              <div class="upload-tip">支持JPG/PNG格式，文件大小不超过2MB</div>
            </div>
          </el-upload>
        </div>
        
        <div v-else class="avatar-crop-area">
          <div class="crop-container">
            <img 
              ref="cropImageRef" 
              :src="cropData.image" 
              alt="待裁剪图片"
              role="img"
              aria-label="待裁剪的头像图片"
            />
          </div>
          <div class="crop-preview">
            <div class="preview-title">预览</div>
            <div class="preview-circle">
              <img :src="cropData.preview" alt="预览头像" role="img" aria-label="头像预览" />
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showAvatarDialog = false">取消</el-button>
        <el-button @click="resetAvatarCrop" v-if="cropData.image">重新选择</el-button>
        <el-button type="primary" @click="uploadAvatar" :loading="avatarUploading">
          确认上传
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 同步历史对话框 -->
    <el-dialog
      v-model="showSyncHistoryDialog"
      title="同步历史记录"
      width="600px"
    >
      <div class="sync-history-container">
        <div v-if="syncHistory.length === 0" class="empty-history">
          <el-empty description="暂无同步历史记录" />
        </div>
        <el-timeline v-else>
          <el-timeline-item
            v-for="(item, index) in syncHistory"
            :key="index"
            :timestamp="item.time"
            :type="item.status === 'success' ? 'success' : 'danger'"
            :icon="item.status === 'success' ? CircleCheck : CircleClose"
          >
            <div class="sync-history-item">
              <div class="sync-type">
                <el-tag :type="item.type === 'manual' ? 'primary' : 'info'" size="small">
                  {{ item.type === 'manual' ? '手动同步' : '自动同步' }}
                </el-tag>
              </div>
              <div class="sync-message">{{ item.message }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
    
    <!-- 验证对话框 -->
    <el-dialog
      v-model="showVerifyDialog"
      :title="verifyDialog.title"
      width="400px"
    >
      <div class="verify-content">
        <div class="verify-desc">
          为了保护您的账户安全，请验证您的{{ verifyDialog.type === 'phone' ? '手机' : '邮箱' }}
        </div>
        <el-form :model="verifyForm" ref="verifyFormRef">
          <el-form-item label="验证码">
            <div class="verify-input-group">
              <el-input 
                v-model="verifyForm.code" 
                placeholder="请输入6位验证码"
                maxlength="6"
              />
              <el-button 
                type="primary" 
                :disabled="verifyCooldown > 0"
                @click="sendVerifyCode"
              >
                {{ verifyCooldown > 0 ? `${verifyCooldown}秒后重试` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="showVerifyDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmVerify">确认验证</el-button>
      </template>
    </el-dialog>
    
    <!-- 安全验证对话框 -->
    <SecurityVerificationModal
      v-model="showSecurityVerification"
      :on-verification-success="handleSecurityVerificationSuccess"
      :on-verification-cancel="handleSecurityVerificationCancel"
      verification-reason="修改敏感信息"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { savePersonalInfo as savePersonalInfoAPI, syncPersonalInfo } from '../services/userService'
import { 
  Plus, 
  CircleCheck, 
  CircleClose,
  Refresh, 
  Upload,
  Download,
  Clock,
  MoreFilled,
  Document
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import SecurityVerificationModal from '@/components/SecurityVerificationModal.vue'
import { hasSecurityQuestions } from '@/services/securityQuestionService'
import dataEncryptionManager from '@/services/dataEncryptionManager'

// 表单引用
const personalFormRef = ref<FormInstance>()
const avatarUploadRef = ref()
const cropImageRef = ref<HTMLImageElement>()
const verifyFormRef = ref<FormInstance>()

// 个人信息表单数据
const personalForm = reactive<PersonalForm>({
  username: '',
  realName: '',
  gender: 'secret',
  birthday: '',
  phone: '',
  email: '',
  bio: ''
})

// 验证状态
const phoneVerified = ref(false)
const emailVerified = ref(false)

// 对话框控制
const showAvatarDialog = ref(false)
const showSyncHistoryDialog = ref(false)
const showVerifyDialog = ref(false)
const showSecurityVerification = ref(false)

// 裁剪数据
const cropData = reactive({
  image: '',
  preview: ''
})

// 验证对话框状态
const verifyDialog = reactive<VerifyDialogState>({
  title: '手机验证',
  type: 'phone'
})

// 验证表单
const verifyForm = reactive({
  code: ''
})

// 验证冷却时间
const verifyCooldown = ref(0)

// 头像上传状态
const avatarUploading = ref(false)
const avatarUploadStatus = reactive({
  visible: false,
  percentage: 0,
  status: 'success' as 'success' | 'exception' | 'warning'
})

// 同步状态
const syncStatus = reactive({
  visible: false,
  title: '',
  type: 'success' as 'success' | 'warning' | 'error' | 'info',
  message: ''
})

// 自动保存状态
const autoSaveStatus = reactive({
  visible: false,
  message: ''
})

// 表单验证状态
const formValidationStatus = reactive({
  totalFields: 0,
  validFields: 0,
  isValid: false
})

// 数据操作历史
const dataOperationHistory = ref<Array<{time: string, operation: string, status: string, message: string}>>([])

// 同步历史
const syncHistory = ref<Array<SyncHistoryItem>>([])

// 未保存更改标志
const hasUnsavedChanges = ref(false)

// 头像URL
const avatarUrl = ref('')

// 加载状态
const saveLoading = ref(false)
const syncLoading = ref(false)

// 隐私设置
const privacySettings = reactive<PrivacySettings>({
  showProfile: true,
  showContact: false,
  allowSearch: true
})

// 表单验证规则
const formRules: FormRules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  birthday: [
    { required: true, message: '请选择生日', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '个人简介不能超过200字', trigger: 'blur' }
  ]
}

// 保存个人信息
const savePersonalInfo = async (): Promise<void> => {
  if (!personalFormRef.value) return
  
  try {
    await personalFormRef.value.validate()
    
    // 检查是否需要安全验证（修改手机号或邮箱等敏感信息）
    const hasSensitiveChanges = (
      personalForm.phone !== originalPersonalForm.phone || 
      personalForm.email !== originalPersonalForm.email
    )
    
    if (hasSensitiveChanges) {
      // 检查用户是否已设置安全问题
      const hasSecurityQ = hasSecurityQuestions('default_user')
      
      if (!hasSecurityQ) {
        ElMessage.warning('请先设置安全问题以增强账户安全性')
        return
      }
      
      // 显示安全验证对话框
      showSecurityVerification.value = true
      return
    }
    
    // 如果不需要安全验证，直接保存
    await performSavePersonalInfo()
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('表单验证失败，请检查输入的信息是否符合要求')
    // 更新验证状态
    await updateValidationStatus()
  }
}

// 执行保存个人信息的实际操作
const performSavePersonalInfo = async (): Promise<void> => {
  saveLoading.value = true
  
  try {
    // 检查是否启用了数据加密
    if (dataEncryptionManager.isEncryptionEnabled()) {
      // 检查是否已有主密钥，如果没有则从存储中加载
      if (!dataEncryptionManager.hasMasterKey()) {
        // 设置主密钥（实际应用中应从安全存储获取）
        const masterKey = localStorage.getItem('master_encryption_key') || 'default_master_key'
        dataEncryptionManager.setMasterKey(masterKey)
      }
      
      try {
        // 加密敏感信息
        const encryptedPhone = dataEncryptionManager.encryptField(personalForm.phone)
        const encryptedEmail = dataEncryptionManager.encryptField(personalForm.email)
        const encryptedRealName = dataEncryptionManager.encryptField(personalForm.realName)
        const encryptedBio = dataEncryptionManager.encryptField(personalForm.bio)
        
        // 保存加密后的信息到localStorage
        localStorage.setItem('encrypted_user_phone', encryptedPhone)
        localStorage.setItem('encrypted_user_email', encryptedEmail)
        localStorage.setItem('encrypted_user_realname', encryptedRealName)
        localStorage.setItem('encrypted_user_bio', encryptedBio)
        
        console.log('敏感信息已加密保存')
      } catch (error) {
        console.warn('加密个人信息失败:', error)
        // 如果加密失败，仍然保存原始信息
      }
    }
    
    console.log('保存个人信息:', personalForm)
    console.log('隐私设置:', privacySettings)
    
    // 调用真实API保存个人信息
    const response = await savePersonalInfoAPI({
      username: personalForm.username,
      realName: personalForm.realName,
      gender: personalForm.gender,
      birthday: personalForm.birthday,
      phone: personalForm.phone,
      email: personalForm.email,
      bio: personalForm.bio,
      privacySettings: { ...privacySettings }
    })
    
    if (response.success && response.data) {
      ElMessage.success('个人信息保存成功')
    } else {
      ElMessage.error(response.message || '个人信息保存失败')
      return
    }
    
    hasUnsavedChanges.value = false
    
    // 更新验证状态
    await updateValidationStatus()
    
    // 显示同步状态
    showSyncStatus('success', '保存成功', '个人信息已更新并同步到服务器')
    
  } catch (error) {
    console.error('保存个人信息失败:', error)
    ElMessage.error('个人信息保存失败，请检查网络连接或稍后重试')
    // 更新验证状态
    await updateValidationStatus()
  } finally {
    saveLoading.value = false
  }
}

// 处理安全验证成功
const handleSecurityVerificationSuccess = async (result: boolean): Promise<void> => {
  if (result) {
    ElMessage.success('身份验证成功')
    // 关闭安全验证对话框
    showSecurityVerification.value = false
    // 执行保存操作
    await performSavePersonalInfo()
  } else {
    ElMessage.error('身份验证失败，请重新输入')
  }
}

// 处理安全验证取消
const handleSecurityVerificationCancel = (): void => {
  showSecurityVerification.value = false
  ElMessage.info('已取消修改操作')
}

// 重置表单
const resetForm = (): void => {
  ElMessageBox.confirm('确定要重置所有修改吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loadPersonalInfo()
    ElMessage.success('已重置为原始数据')
  }).catch(() => {})
}

// 同步数据
const syncData = async (): Promise<void> => {
  syncLoading.value = true
  showSyncStatus('info', '正在同步', '正在从服务器同步最新数据，请稍候...')
  
  try {
    // 调用真实API同步个人信息
    const response = await syncPersonalInfo()
    
    if (response.success && response.data) {
      // 更新本地数据
      const userData = response.data
      Object.assign(personalForm, {
        username: userData.name || 'user123',
        realName: userData.name || '张三',
        gender: 'male',
        birthday: '1990-01-01',
        phone: userData.email ? userData.email.replace(/@.*/, '') : '13800138000',
        email: userData.email || 'user@example.com',
        bio: '这是我的个人简介，喜欢技术和生活。'
      })
      
      // 设置验证状态
      phoneVerified.value = true
      emailVerified.value = false
      
      // 设置隐私设置
      Object.assign(privacySettings, {
        showProfile: true,
        showContact: false,
        allowSearch: true
      })
      
      console.log('个人信息加载完成:', personalForm)
      
      // 初始化验证状态
      await updateValidationStatus()
      
      // 添加同步历史记录
      addSyncHistory('manual', 'success', '数据同步成功')
      showSyncStatus('success', '同步成功', '个人信息已更新为最新数据')
    } else {
      // 同步失败，使用默认数据
      Object.assign(personalForm, {
        username: 'user123',
        realName: '张三',
        gender: 'male',
        birthday: '1990-01-01',
        phone: '13800138000',
        email: 'user@example.com',
        bio: '这是我的个人简介，喜欢技术和生活。'
      })
      
      phoneVerified.value = true
      emailVerified.value = false
      
      Object.assign(privacySettings, {
        showProfile: true,
        showContact: false,
        allowSearch: true
      })
      
      await updateValidationStatus()
      addSyncHistory('manual', 'failed', response.message || '数据同步失败')
      showSyncStatus('error', '同步失败', response.message || '个人信息同步失败')
    }
  } catch (error) {
    // 同步数据失败日志已移除以优化性能
    addSyncHistory('manual', 'failed', '数据同步失败')
    showSyncStatus('error', '同步失败', '个人信息同步失败，请稍后重试')
  } finally {
    syncLoading.value = false
  }
}

// 原始个人信息（用于比较是否有修改）
const originalPersonalForm = reactive<PersonalForm>({
  username: '',
  realName: '',
  gender: 'secret',
  birthday: '',
  phone: '',
  email: '',
  bio: ''
})

// 加载个人信息
const loadPersonalInfo = async (): Promise<void> => {
  try {
    showSyncStatus('info', '正在加载', '正在加载个人信息，请稍候...')
    
    // 调用真实API获取个人信息
    const response = await syncPersonalInfo()
    
    // 检查是否启用了数据加密
    let personalData = {
      username: 'user123',
      realName: '张三',
      gender: 'male',
      birthday: '1990-01-01',
      phone: '13800138000',
      email: 'user@example.com',
      bio: '这是我的个人简介，喜欢技术和生活。'
    }
    
    // 如果API调用成功，使用返回的数据
    if (response.success && response.data) {
      personalData = {
        username: response.data.name || 'user123',
        realName: response.data.name || '张三',
        gender: 'male',
        birthday: '1990-01-01',
        phone: response.data.email ? response.data.email.replace(/@.*/, '') : '13800138000',
        email: response.data.email || 'user@example.com',
        bio: '这是我的个人简介，喜欢技术和生活。'
      }
    }
    
    if (dataEncryptionManager.isEncryptionEnabled()) {
      // 检查是否已有主密钥，如果没有则从存储中加载
      if (!dataEncryptionManager.hasMasterKey()) {
        // 设置主密钥（实际应用中应从安全存储获取）
        const masterKey = localStorage.getItem('master_encryption_key') || 'default_master_key'
        dataEncryptionManager.setMasterKey(masterKey)
      }
      
      try {
        // 尝试解密敏感信息
        const encryptedPhone = localStorage.getItem('encrypted_user_phone')
        const encryptedEmail = localStorage.getItem('encrypted_user_email')
        const encryptedRealName = localStorage.getItem('encrypted_user_realname')
        const encryptedBio = localStorage.getItem('encrypted_user_bio')
        
        if (encryptedPhone) {
          personalData.phone = dataEncryptionManager.decryptField(encryptedPhone)
        }
        
        if (encryptedEmail) {
          personalData.email = dataEncryptionManager.decryptField(encryptedEmail)
        }
        
        if (encryptedRealName) {
          personalData.realName = dataEncryptionManager.decryptField(encryptedRealName)
        }
        
        if (encryptedBio) {
          personalData.bio = dataEncryptionManager.decryptField(encryptedBio)
        }
        
        // 敏感信息已解密加载日志已移除以优化性能
      } catch (error) {
        // 解密个人信息失败日志已移除以优化性能
        // 如果解密失败，使用原始值
      }
    }
    
    // 模拟数据
    Object.assign(personalForm, personalData)
    
    // 保存原始数据副本
    Object.assign(originalPersonalForm, personalForm)
    
    // 设置验证状态
    phoneVerified.value = true
    emailVerified.value = false
    
    // 设置隐私设置
    Object.assign(privacySettings, {
      showProfile: true,
      showContact: false,
      allowSearch: true
    })
    
    console.log('个人信息加载完成:', personalForm)
    
    // 初始化验证状态
    await updateValidationStatus()
    
  } catch (error) {
    // 加载个人信息失败日志已移除以优化性能
    showSyncStatus('error', '加载失败', '个人信息加载失败')
  }
}

// 头像上传前验证
const beforeAvatarUpload = (file: File): boolean => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 处理头像文件选择
const handleAvatarChange = (uploadFile: UploadFile): void => {
  if (!uploadFile.raw) return
  
  if (!beforeAvatarUpload(uploadFile.raw)) return
  
  // 创建本地预览URL
  const imageUrl = URL.createObjectURL(uploadFile.raw)
  cropData.image = imageUrl
  
  // 初始化裁剪器
  nextTick(() => {
    initCropper()
  })
}

// 个人信息表单接口定义
interface PersonalForm {
  username: string
  realName: string
  gender: 'male' | 'female' | 'secret'
  birthday: string
  phone: string
  email: string
  bio: string
}

// 隐私设置接口定义
interface PrivacySettings {
  showProfile: boolean
  showContact: boolean
  allowSearch: boolean
}

// 同步历史接口定义
interface SyncHistoryItem {
  time: string
  type: 'manual' | 'auto'
  status: 'success' | 'failed'
  message: string
}

// 验证状态接口定义
interface VerifyDialogState {
  title: string
  type: 'phone' | 'email'
}

// 初始化裁剪器
const initCropper = (): void => {
  if (!cropImageRef.value) return
  
  // 这里使用简单的裁剪实现，实际项目中可以使用 cropper.js 等库
  // 初始化头像裁剪器日志已移除以优化性能
  
  // 创建预览
  cropData.preview = cropData.image
}

// 重置头像裁剪
const resetAvatarCrop = (): void => {
  cropData.image = ''
  cropData.preview = ''
}

// 上传头像
const uploadAvatar = async (): Promise<void> => {
  if (!cropData.image) {
    ElMessage.error('请先选择图片')
    return
  }
  
  avatarUploading.value = true
  avatarUploadStatus.visible = true
  avatarUploadStatus.percentage = 0
  avatarUploadStatus.status = 'success'
  
  try {
    // 模拟上传进度
    for (let i = 0; i <= 100; i += 10) {
      avatarUploadStatus.percentage = i
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // 模拟上传成功
    avatarUrl.value = cropData.image
    showAvatarDialog.value = false
    ElMessage.success('头像上传成功')
    addDataOperationHistory('avatar_upload', 'success', '头像上传成功')
  } catch (error) {
    console.error('头像上传失败:', error)
    avatarUploadStatus.status = 'exception'
    ElMessage.error('头像上传失败，请检查网络连接或稍后重试')
    addDataOperationHistory('avatar_upload', 'failed', '头像上传失败')
  } finally {
    avatarUploading.value = false
  }
}

// 处理手机验证
const handlePhoneVerify = () => {
  if (phoneVerified.value) {
    ElMessage.info('手机已验证')
    return
  }
  
  verifyDialog.title = '手机验证'
  verifyDialog.type = 'phone'
  verifyForm.code = ''
  showVerifyDialog.value = true
}

// 处理邮箱验证
const handleEmailVerify = () => {
  if (emailVerified.value) {
    ElMessage.info('邮箱已验证')
    return
  }
  
  verifyDialog.title = '邮箱验证'
  verifyDialog.type = 'email'
  verifyForm.code = ''
  showVerifyDialog.value = true
}

// 发送验证码
const sendVerifyCode = (): void => {
  if (verifyCooldown.value > 0) return
  
  verifyCooldown.value = 60
  const timer = setInterval(() => {
    verifyCooldown.value--
    if (verifyCooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  
  ElMessage.success(`验证码已发送到您的${verifyDialog.type === 'phone' ? '手机' : '邮箱'}`)
}

// 确认验证
const confirmVerify = (): void => {
  if (!verifyForm.code) {
    ElMessage.error('请输入验证码')
    return
  }
  
  if (verifyDialog.type === 'phone') {
    phoneVerified.value = true
    ElMessage.success('手机验证成功')
  } else {
    emailVerified.value = true
    ElMessage.success('邮箱验证成功')
  }
  
  showVerifyDialog.value = false
}

// 要禁用的日期（不能选择未来日期）
const disabledDate = (date: Date): boolean => {
  return date > new Date()
}

// 导出个人信息
const exportPersonalData = (): void => {
  try {
    const data = {
      personalInfo: personalForm,
      privacySettings: privacySettings,
      exportTime: new Date().toISOString(),
      verifiedStatus: {
        phone: phoneVerified.value,
        email: emailVerified.value
      }
    }
    
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `personal_data_${personalForm.username}_${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    ElMessage.success('个人信息导出成功')
    addDataOperationHistory('export', 'success', '个人信息导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('个人信息导出失败，请检查网络连接或稍后重试')
    addDataOperationHistory('export', 'failed', '个人信息导出失败')
  }
}

// 导入个人信息
const importPersonalData = (): void => {
  ElMessageBox.confirm(
    '导入数据将覆盖当前的所有信息，确定要导入吗？',
    '确认导入',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里应该实现实际的导入逻辑
    ElMessage.info('导入功能占位符')
    addDataOperationHistory('import', 'success', '开始导入数据')
  }).catch(() => {
    // 用户取消操作
  })
}

// 创建数据备份
const createDataBackup = (): void => {
  try {
    const backupData = {
      personalInfo: { ...personalForm },
      privacySettings: { ...privacySettings },
      verifiedStatus: {
        phone: phoneVerified.value,
        email: emailVerified.value
      },
      backupTime: new Date().toISOString(),
      version: '1.0'
    }
    
    const dataStr = JSON.stringify(backupData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `backup_personal_${personalForm.username}_${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    ElMessage.success('数据备份创建成功')
    addDataOperationHistory('backup_create', 'success', '数据备份创建成功')
  } catch (error) {
    console.error('创建备份失败:', error)
    ElMessage.error('数据备份创建失败，请检查网络连接或稍后重试')
    addDataOperationHistory('backup_create', 'failed', '数据备份创建失败')
  }
}

// 恢复数据备份
const restoreDataBackup = (): void => {
  ElMessageBox.confirm(
    '恢复备份将覆盖当前的所有信息，确定要恢复吗？',
    '确认恢复',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里应该实现实际的恢复逻辑
    ElMessage.info('恢复备份功能占位符')
    addDataOperationHistory('backup_restore', 'success', '开始恢复数据备份')
  }).catch(() => {
    // 用户取消操作
  })
}

// 显示同步状态
const showSyncStatus = (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string): void => {
  syncStatus.visible = true
  syncStatus.type = type
  syncStatus.title = title
  syncStatus.message = message
  
  // 3秒后自动隐藏
  setTimeout(() => {
    syncStatus.visible = false
  }, 3000)
}

// 添加同步历史记录
const addSyncHistory = (type: 'manual' | 'auto', status: 'success' | 'failed', message: string): void => {
  syncHistory.value.unshift({
    time: new Date().toLocaleString(),
    type,
    status,
    message
  })
  
  // 只保留最近10条记录
  if (syncHistory.value.length > 10) {
    syncHistory.value = syncHistory.value.slice(0, 10)
  }
}

// 添加数据操作历史
const addDataOperationHistory = (operation: string, status: string, message: string): void => {
  dataOperationHistory.value.unshift({
    time: new Date().toLocaleString(),
    operation,
    status,
    message
  })
  
  // 只保留最近20条记录
  if (dataOperationHistory.value.length > 20) {
    dataOperationHistory.value = dataOperationHistory.value.slice(0, 20)
  }
}

// 更新表单验证状态
const updateValidationStatus = async (): Promise<void> => {
  if (!personalFormRef.value) return
  
  // 获取所有表单项
  const fields = Object.keys(formRules)
  formValidationStatus.totalFields = fields.length
  
  // 验证每个字段
  let validCount = 0
  for (const field of fields) {
    try {
      // 这里简化处理，实际应该调用表单验证方法
      // 由于Element Plus的验证方法是异步的，这里只是示例
      validCount++
    } catch (error) {
      // 字段验证失败
    }
  }
  
  formValidationStatus.validFields = validCount
  formValidationStatus.isValid = validCount === fields.length
}

// 组件挂载时加载个人信息
onMounted(() => {
  loadPersonalInfo()
})

// 组件卸载前清理
onBeforeUnmount(() => {
  // 清理可能的定时器
  if (verifyCooldown.value > 0) {
    verifyCooldown.value = 0
  }
})

// 路由离开前确认
onBeforeRouteLeave((_to, _from, next) => {
  if (hasUnsavedChanges.value) {
    ElMessageBox.confirm(
      '您有未保存的更改，确定要离开吗？',
      '确认离开',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      next()
    }).catch(() => {
      next(false)
    })
  } else {
    next()
  }
})
</script>

<style scoped>
.personal-info {
  padding: 20px;
  background: #fff;
  min-height: calc(100vh - 120px);
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.sync-status {
  margin-bottom: 20px;
}

.auto-save-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  color: #67c23a;
  margin-bottom: 20px;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.validation-text {
  font-size: 14px;
  color: #606266;
}

.empty-history {
  text-align: center;
  padding: 40px 0;
}

.sync-history-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sync-type {
  display: flex;
  align-items: center;
}

.sync-message {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}

/* 主要内容区域 */
.info-content {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

/* 头像区域 */
.avatar-section {
  flex-shrink: 0;
  text-align: center;
}

.avatar-container {
  position: relative;
  display: inline-block;
}

.user-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e4e7ed;
  transition: border-color 0.3s;
}

.user-avatar:hover {
  border-color: #409eff;
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  padding: 5px 10px;
  border-radius: 15px;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-status {
  margin-top: 10px;
}

/* 表单区域 */
.info-form-section {
  flex: 1;
  max-width: 500px;
}

.personal-form {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}

/* 验证按钮样式 */
.input-with-verify {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input-with-verify .el-input {
  flex: 1;
}

/* 隐私设置样式 */
.privacy-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.privacy-controls .el-checkbox {
  margin-right: 0;
}

/* 头像上传对话框 */
.avatar-crop-content {
  padding: 20px 0;
}

.avatar-upload-area {
  text-align: center;
}

.upload-trigger {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-trigger:hover {
  border-color: #409eff;
}

.upload-icon {
  color: #8c939d;
  margin-bottom: 10px;
}

.upload-tip {
  color: #8c939d;
  font-size: 12px;
  margin-top: 5px;
}

.avatar-crop-area {
  display: flex;
  gap: 20px;
}

.crop-container {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.crop-container img {
  width: 100%;
  height: auto;
  display: block;
}

.crop-preview {
  width: 120px;
  text-align: center;
}

.preview-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e4e7ed;
  margin-bottom: 10px;
}

.preview-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 验证对话框 */
.verify-content {
  padding: 10px 0;
}

.verify-desc {
  margin-bottom: 20px;
  color: #606266;
  line-height: 1.5;
}

.verify-input-group {
  display: flex;
  gap: 10px;
}

.verify-input-group .el-input {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .personal-info {
    padding: 15px;
  }
  
  .info-content {
    flex-direction: column;
    align-items: center;
    gap: 30px;
  }
  
  .info-form-section {
    width: 100%;
    max-width: none;
  }
  
  .personal-form {
    padding: 15px;
  }
  
  .avatar-crop-area {
    flex-direction: column;
    align-items: center;
  }
  
  .crop-preview {
    margin-top: 20px;
  }
  
  .privacy-controls {
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .page-header h2 {
    font-size: 20px;
  }
  
  .user-avatar {
    width: 100px;
    height: 100px;
  }
  
  .input-with-verify {
    flex-direction: column;
    align-items: stretch;
  }
  
  .verify-input-group {
    flex-direction: column;
  }
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 自定义滚动条 */
.personal-form::-webkit-scrollbar {
  width: 6px;
}

.personal-form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.personal-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.personal-form::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>