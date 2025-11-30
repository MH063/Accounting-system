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
          <img :src="avatarUrl" alt="用户头像" class="user-avatar" />
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
            <el-radio-group v-model="personalForm.gender">
              <el-radio label="male">男</el-radio>
              <el-radio label="female">女</el-radio>
              <el-radio label="secret">保密</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="生日" prop="birthday">
            <el-date-picker 
              v-model="personalForm.birthday" 
              type="date" 
              placeholder="选择生日"
              :disabled-date="disabledDate"
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
                  <el-dropdown-item @click="clearDataBackup" divided>
            <el-icon><Delete /></el-icon>
            清除备份
          </el-dropdown-item>
          <el-dropdown-item @click="showSyncHistoryDialog = true">
            <el-icon><Clock /></el-icon>
            同步历史
          </el-dropdown-item>
          <el-dropdown-item @click="clearSyncHistory">
            <el-icon><Delete /></el-icon>
            清除历史
          </el-dropdown-item>
          <el-dropdown-item @click="showDataOperationHistoryDialog = true">
            <el-icon><Document /></el-icon>
            操作历史
          </el-dropdown-item>
          <el-dropdown-item @click="clearDataOperationHistory">
            <el-icon><Delete /></el-icon>
            清除操作历史
          </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <!-- 头像裁剪对话框 -->
    <el-dialog
      v-model="showAvatarDialog"
      title="更换头像"
      width="500px"
      @close="resetAvatarCrop"
    >
      <div class="avatar-crop-content">
        <div class="avatar-upload-area" v-if="!cropData.image">
          <el-upload
            ref="avatarUploadRef"
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :on-change="handleAvatarChange"
            accept="image/*"
            :auto-upload="false"
          >
            <div class="upload-trigger">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <span>点击上传头像</span>
              <span class="upload-tip">支持 JPG、PNG、GIF 格式，大小不超过 2MB</span>
            </div>
          </el-upload>
        </div>
        
        <div class="avatar-crop-area" v-else>
          <div class="crop-container">
            <img ref="cropImageRef" :src="cropData.image" alt="待裁剪头像" />
          </div>
          <div class="crop-preview">
            <div class="preview-circle">
              <img :src="cropData.preview" alt="预览" v-if="cropData.preview" />
            </div>
            <span>预览</span>
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
      <template #footer>
        <el-button @click="showSyncHistoryDialog = false">关闭</el-button>
        <el-button type="danger" @click="clearSyncHistory" v-if="syncHistory.length > 0">
          清除历史
        </el-button>
      </template>
    </el-dialog>

    <!-- 数据操作历史对话框 -->
    <el-dialog
      v-model="showDataOperationHistoryDialog"
      title="数据操作历史"
      width="700px"
    >
      <div class="sync-history-container">
        <div v-if="dataOperationHistory.length === 0" class="empty-history">
          <el-empty description="暂无数据操作历史" />
        </div>
        <el-timeline v-else>
          <el-timeline-item
            v-for="(item, index) in dataOperationHistory"
            :key="index"
            :timestamp="item.time"
            :type="item.status === 'success' ? 'success' : 'danger'"
            :icon="item.status === 'success' ? CircleCheck : CircleClose"
          >
            <div class="sync-history-item">
              <div class="sync-type">
                <el-tag :type="getOperationTypeColor(item.operation)" size="small">
                  {{ getOperationTypeText(item.operation) }}
                </el-tag>
              </div>
              <div class="sync-message">{{ item.message }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
      <template #footer>
        <el-button @click="showDataOperationHistoryDialog = false">关闭</el-button>
        <el-button type="danger" @click="clearDataOperationHistory" v-if="dataOperationHistory.length > 0">
          清除历史
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 验证对话框 -->
    <el-dialog
      v-model="showVerifyDialog"
      :title="verifyDialog.title"
      width="400px"
    >
      <div class="verify-content">
        <el-form :model="verifyForm" label-width="80px">
          <el-form-item label="验证码">
            <div class="verify-input-group">
              <el-input 
                v-model="verifyForm.code" 
                placeholder="请输入验证码"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
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

// 表单引用
const personalFormRef = ref<FormInstance>()
const avatarUploadRef = ref()
const cropImageRef = ref<HTMLImageElement>()

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

// 头像相关数据
const avatarUrl = ref('https://picsum.photos/200/200')
const showAvatarDialog = ref(false)
const avatarUploading = ref(false)
const avatarUploadStatus = reactive({
  visible: false,
  percentage: 0,
  status: 'success' as 'success' | 'exception'
})

// 裁剪器接口定义
interface CropperInstance {
  destroy(): void
  getCroppedCanvas(options?: CropperGetCroppedCanvasOptions): HTMLCanvasElement
  reset(): void
  rotate(degree: number): void
  scale(scaleX: number, scaleY?: number): void
  zoom(ratio: number): void
}

interface CropperGetCroppedCanvasOptions {
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  fillColor?: string
  imageSmoothingEnabled?: boolean
  imageSmoothingQuality?: 'low' | 'medium' | 'high'
}

// 裁剪相关数据
const cropData = reactive<{
  image: string
  preview: string
  cropper: CropperInstance | null
}>({
  image: '',
  preview: '',
  cropper: null
})

// 验证状态
const phoneVerified = ref(false)
const emailVerified = ref(false)
const showVerifyDialog = ref(false)
const verifyDialog = reactive<VerifyDialogState>({
  title: '',
  type: 'phone'
})

// 验证表单
const verifyForm = reactive<{
  code: string
}>({
  code: ''
})

// 验证冷却时间
const verifyCooldown = ref(0)

// 同步状态
const syncStatus = reactive({
  visible: false,
  title: '',
  message: '',
  type: 'success' as 'success' | 'warning' | 'error' | 'info'
})

// 自动保存状态
const autoSaveStatus = reactive({
  visible: false,
  message: '',
  type: 'info' as const
})

// 表单验证状态
const formValidationStatus = reactive({
  totalFields: 0,
  validFields: 0,
  invalidFields: 0,
  isValid: false
})

// 更新表单验证状态
const updateValidationStatus = async (): Promise<void> => {
  if (!personalFormRef.value) return
  
  try {
    await personalFormRef.value.validate()
    formValidationStatus.isValid = true
    formValidationStatus.validFields = Object.keys(personalForm).length
    formValidationStatus.invalidFields = 0
  } catch (error) {
    formValidationStatus.isValid = false
    formValidationStatus.invalidFields = 1 // 简化处理
    formValidationStatus.validFields = Object.keys(personalForm).length - 1
  }
  
  formValidationStatus.totalFields = Object.keys(personalForm).length
}

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
    saveLoading.value = true
    
    console.log('保存个人信息:', personalForm)
    console.log('隐私设置:', privacySettings)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('个人信息保存成功')
    hasUnsavedChanges.value = false
    
    // 更新验证状态
    await updateValidationStatus()
    
    // 显示同步状态
    showSyncStatus('success', '保存成功', '个人信息已更新并同步到服务器')
    
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('请检查输入的信息')
    // 更新验证状态
    await updateValidationStatus()
  } finally {
    saveLoading.value = false
  }
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
  showSyncStatus('info', '正在同步', '正在从服务器同步最新数据...')
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 重新加载数据
    await loadPersonalInfo()
    
    showSyncStatus('success', '同步成功', '数据已同步到最新版本')
    addSyncHistory('manual', 'success', '手动同步成功')
    
  } catch (error) {
    showSyncStatus('error', '同步失败', '数据同步失败，请稍后重试')
    addSyncHistory('manual', 'failed', '手动同步失败')
  } finally {
    syncLoading.value = false
  }
}

// 显示同步状态
// 同步状态类型定义
type SyncStatusType = 'success' | 'error' | 'warning' | 'info'

const showSyncStatus = (type: SyncStatusType, title: string, message: string): void => {
  syncStatus.visible = true
  syncStatus.type = type
  syncStatus.title = title
  syncStatus.message = message
  
  // 3秒后自动隐藏
  setTimeout(() => {
    syncStatus.visible = false
  }, 3000)
}

// 加载个人信息
const loadPersonalInfo = async (): Promise<void> => {
  console.log('开始加载个人信息...')
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    Object.assign(personalForm, {
      username: 'user123',
      realName: '张三',
      gender: 'male',
      birthday: '1990-01-01',
      phone: '13800138000',
      email: 'user@example.com',
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
    
  } catch (error) {
    console.error('加载个人信息失败:', error)
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
  console.log('初始化头像裁剪器')
  
  // 创建预览
  cropData.preview = cropData.image
}

// 重置头像裁剪
const resetAvatarCrop = (): void => {
  cropData.image = ''
  cropData.preview = ''
  if (cropData.cropper) {
    cropData.cropper.destroy()
    cropData.cropper = null
  }
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
    const interval = setInterval(() => {
      avatarUploadStatus.percentage += 10
      if (avatarUploadStatus.percentage >= 100) {
        clearInterval(interval)
        
        // 模拟上传完成
        avatarUrl.value = cropData.preview || cropData.image
        showAvatarDialog.value = false
        resetAvatarCrop()
        
        ElMessage.success('头像上传成功')
        avatarUploadStatus.visible = false
      }
    }, 200)
    
  } catch (error) {
    console.error('头像上传失败:', error)
    avatarUploadStatus.status = 'exception'
    ElMessage.error('头像上传失败')
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

// 禁用日期（不能选择未来日期）
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
    ElMessage.error('个人信息导出失败')
    addDataOperationHistory('export', 'failed', '个人信息导出失败')
  }
}

// 导入个人信息
const importPersonalData = (): void => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        ElMessageBox.confirm('导入数据将覆盖当前设置，是否继续？', '确认导入', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 导入个人信息
          if (data.personalInfo) {
            Object.assign(personalForm, data.personalInfo)
          }
          
          // 导入隐私设置
          if (data.privacySettings) {
            Object.assign(privacySettings, data.privacySettings)
          }
          
          // 导入验证状态
          if (data.verifiedStatus) {
            phoneVerified.value = data.verifiedStatus.phone || false
            emailVerified.value = data.verifiedStatus.email || false
          }
          
          ElMessage.success('个人信息导入成功')
          addDataOperationHistory('import', 'success', '个人信息导入成功')
          
          // 更新验证状态
          updateValidationStatus()
          
        }).catch(() => {
          addDataOperationHistory('import', 'failed', '用户取消导入操作')
        })
        
      } catch (error) {
        ElMessage.error('文件格式错误，请选择正确的JSON文件')
        addDataOperationHistory('import', 'failed', '文件格式错误，导入失败')
      }
    }
    
    reader.onerror = () => {
      ElMessage.error('文件读取失败')
      addDataOperationHistory('import', 'failed', '文件读取失败')
    }
    
    reader.readAsText(file)
  }
  
  input.click()
}

// 创建数据备份
const createDataBackup = (): void => {
  try {
    const backupData = {
      personalInfo: personalForm,
      privacySettings: privacySettings,
      verifiedStatus: {
        phone: phoneVerified.value,
        email: emailVerified.value
      },
      avatarUrl: avatarUrl.value,
      backupTime: new Date().toISOString(),
      version: '1.0'
    }
    
    // 保存到本地存储
    localStorage.setItem('personal_data_backup', JSON.stringify(backupData))
    ElMessage.success('数据备份已创建并保存到本地')
    addDataOperationHistory('backup', 'success', '数据备份创建成功')
  } catch (error) {
    console.error('备份失败:', error)
    ElMessage.error('数据备份创建失败')
    addDataOperationHistory('backup', 'failed', '数据备份创建失败')
  }
}

// 恢复数据备份
const restoreDataBackup = (): void => {
  const backupDataStr = localStorage.getItem('personal_data_backup')
  
  if (!backupDataStr) {
    ElMessage.warning('没有找到本地备份数据')
    addDataOperationHistory('restore', 'failed', '没有找到本地备份数据')
    return
  }
  
  try {
    const backupData = JSON.parse(backupDataStr)
    
    ElMessageBox.confirm(
      `发现备份数据（备份时间：${new Date(backupData.backupTime).toLocaleString()}），是否恢复？`,
      '恢复备份',
      {
        confirmButtonText: '恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      // 恢复个人信息
      if (backupData.personalInfo) {
        Object.assign(personalForm, backupData.personalInfo)
      }
      
      // 恢复隐私设置
      if (backupData.privacySettings) {
        Object.assign(privacySettings, backupData.privacySettings)
      }
      
      // 恢复验证状态
      if (backupData.verifiedStatus) {
        phoneVerified.value = backupData.verifiedStatus.phone || false
        emailVerified.value = backupData.verifiedStatus.email || false
      }
      
      // 恢复头像
      if (backupData.avatarUrl) {
        avatarUrl.value = backupData.avatarUrl
      }
      
      ElMessage.success('数据备份恢复成功')
      addDataOperationHistory('restore', 'success', '数据备份恢复成功')
      
      // 更新验证状态
      updateValidationStatus()
      
    }).catch(() => {
      addDataOperationHistory('restore', 'failed', '用户取消恢复操作')
    })
    
  } catch (error) {
    ElMessage.error('备份数据损坏，无法恢复')
    addDataOperationHistory('restore', 'failed', '备份数据损坏，无法恢复')
  }
}

// 清除本地备份
const clearDataBackup = (): void => {
  ElMessageBox.confirm('确定要清除本地备份数据吗？此操作不可恢复。', '清除备份', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('personal_data_backup')
    ElMessage.success('本地备份数据已清除')
  }).catch(() => {})
}

// 同步历史记录数据
const syncHistory = ref<SyncHistoryItem[]>([])

// 同步历史对话框状态
const showSyncHistoryDialog = ref(false)

// 获取操作类型的颜色
const getOperationTypeColor = (operation: string): string => {
  const colorMap: Record<string, string> = {
    'export': 'success',
    'import': 'primary',
    'backup': 'warning',
    'restore': 'info'
  }
  return colorMap[operation] || 'info'
}

// 获取操作类型的文本
const getOperationTypeText = (operation: string): string => {
  const textMap: Record<string, string> = {
    'export': '导出数据',
    'import': '导入数据',
    'backup': '备份数据',
    'restore': '恢复数据'
  }
  return textMap[operation] || '未知操作'
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
  
  // 保存到本地存储
  localStorage.setItem('sync_history', JSON.stringify(syncHistory.value))
}

// 加载同步历史
const loadSyncHistory = (): void => {
  const historyStr = localStorage.getItem('sync_history')
  if (historyStr) {
    try {
      syncHistory.value = JSON.parse(historyStr)
    } catch (error) {
      console.error('加载同步历史失败:', error)
    }
  }
}

// 清除同步历史
const clearSyncHistory = (): void => {
  ElMessageBox.confirm('确定要清除同步历史记录吗？', '清除历史', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    syncHistory.value = []
    localStorage.removeItem('sync_history')
    ElMessage.success('同步历史已清除')
  }).catch(() => {})
}

// 数据操作历史接口定义
interface DataOperationHistoryItem {
  time: string
  operation: 'export' | 'import' | 'backup' | 'restore'
  status: 'success' | 'failed'
  message: string
}

// 数据操作历史记录
const dataOperationHistory = ref<DataOperationHistoryItem[]>([])

// 添加数据操作历史记录
const addDataOperationHistory = (operation: 'export' | 'import' | 'backup' | 'restore', status: 'success' | 'failed', message: string): void => {
  dataOperationHistory.value.unshift({
    time: new Date().toLocaleString(),
    operation,
    status,
    message
  })
  
  // 只保留最近10条记录
  if (dataOperationHistory.value.length > 10) {
    dataOperationHistory.value = dataOperationHistory.value.slice(0, 10)
  }
  
  // 保存到本地存储
  localStorage.setItem('data_operation_history', JSON.stringify(dataOperationHistory.value))
}

// 加载数据操作历史
const loadDataOperationHistory = (): void => {
  const historyStr = localStorage.getItem('data_operation_history')
  if (historyStr) {
    try {
      dataOperationHistory.value = JSON.parse(historyStr)
    } catch (error) {
      console.error('加载数据操作历史失败:', error)
    }
  }
}

// 清除数据操作历史
const clearDataOperationHistory = (): void => {
  ElMessageBox.confirm(
    '确定要清除所有数据操作历史记录吗？此操作不可恢复。',
    '清除确认',
    {
      confirmButtonText: '确定清除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    dataOperationHistory.value = []
    localStorage.removeItem('data_operation_history')
    ElMessage.success('数据操作历史已清除')
  }).catch(() => {})
}

// 显示数据操作历史
const showDataOperationHistoryDialog = ref(false)

// 组件挂载时加载数据
onMounted(() => {
  loadPersonalInfo()
  loadSyncHistory()
  loadDataOperationHistory()
  
  // 启动自动保存定时器（每30秒检查一次）
  startAutoSave()
})

// 组件卸载时清理定时器
import { onUnmounted } from 'vue'

onUnmounted(() => {
  stopAutoSave()
})

// 自动保存相关
let autoSaveTimer: NodeJS.Timeout | null = null
let lastSavedData = ''

// 开始自动保存
const startAutoSave = (): void => {
  autoSaveTimer = setInterval(() => {
    checkAndAutoSave()
  }, 30000) // 30秒检查一次
}

// 停止自动保存
const stopAutoSave = (): void => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 检查并自动保存
const checkAndAutoSave = (): void => {
  const currentData = JSON.stringify({
    personalForm: personalForm,
    privacySettings: privacySettings
  })
  
  if (currentData !== lastSavedData && personalFormRef.value) {
    // 数据有变化且表单验证通过
    personalFormRef.value.validate((valid) => {
      if (valid) {
        // 执行自动保存（不显示提示）
        console.log('自动保存个人信息...')
        lastSavedData = currentData
        
        // 显示自动保存状态
        autoSaveStatus.visible = true
        autoSaveStatus.message = '正在自动保存...'
        autoSaveStatus.type = 'info'
        
        // 添加同步历史记录
        addSyncHistory('auto', 'success', '自动保存成功')
        
        // 2秒后隐藏状态
        setTimeout(() => {
          autoSaveStatus.visible = false
        }, 2000)
        
        // 可以在这里调用实际的API保存接口
        // savePersonalInfoToAPI(false) // false表示不显示提示
      }
    })
  }
}

// 监听数据变化
import { watch, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const hasUnsavedChanges = ref(false)

watch([personalForm, privacySettings], () => {
  // 数据变化时更新最后保存状态
  const currentData = JSON.stringify({
    personalForm: personalForm,
    privacySettings: privacySettings
  })
  
  if (currentData !== lastSavedData) {
    hasUnsavedChanges.value = true
    console.log('检测到数据变化，等待自动保存...')
  }
}, { deep: true })

// 页面离开提醒
onBeforeUnmount(() => {
  stopAutoSave()
})

// 路由离开守卫
onBeforeRouteLeave((_to, _from, next) => {
  if (hasUnsavedChanges.value) {
    ElMessageBox.confirm(
      '您有未保存的更改，是否保存后再离开？',
      '确认离开',
      {
        confirmButtonText: '保存并离开',
        cancelButtonText: '直接离开',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    ).then(() => {
      // 保存并离开
      savePersonalInfo().then(() => {
        next()
      }).catch(() => {
        next(false) // 保存失败，留在当前页面
      })
    }).catch((action) => {
      if (action === 'cancel') {
        next() // 直接离开
      } else {
        next(false) // 关闭弹窗，留在当前页面
      }
    })
  } else {
    next()
  }
})
</script>

<style scoped>
.personal-info {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
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

/* 同步状态样式 */
.sync-status {
  margin-bottom: 20px;
}

/* 自动保存状态样式 */
.auto-save-status {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #409eff;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  z-index: 2000;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 更多操作下拉菜单样式 */
.el-dropdown {
  margin-left: 8px;
}

/* 表单验证状态样式 */
.validation-status {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.validation-text {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

/* 同步历史样式 */
.sync-history-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
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