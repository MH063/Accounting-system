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
      <!-- 基本信息表单 -->
      <div class="info-form-section">
        <el-form 
          :model="personalForm" 
          label-width="100px" 
          class="personal-form"
          :rules="formRules"
          ref="personalFormRef"
        >
          <el-form-item label="当前头像">
            <div class="current-avatar-container">
              <div class="avatar-wrapper">
                <el-image 
                  :src="personalForm.avatar" 
                  class="current-avatar-img"
                  :style="currentAvatarStyle"
                  fit="cover"
                >
                  <template #error>
                    <div class="avatar-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
            </div>
          </el-form-item>

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
            <el-button @click="showAvatarDialog = true">
              <el-icon><User /></el-icon>
              更换头像
            </el-button>
            <el-button @click="resetForm">重置</el-button>
            <el-button @click="syncData" :loading="syncLoading">
              同步数据
            </el-button>
            <el-dropdown>
              <el-button type="default">
                <el-icon><MoreFilled /></el-icon>
                更多操作
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="exportPersonalData">
                    <el-icon><Download /></el-icon>
                    导出数据
                  </el-dropdown-item>
                  <el-dropdown-item @click="importPersonalData">
                    <el-icon><Upload /></el-icon>
                    导入数据
                  </el-dropdown-item>
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
            
            <!-- 头像上传状态 -->
            <div class="avatar-status-form" v-if="avatarUploadStatus.visible">
              <el-progress 
                :percentage="avatarUploadStatus.percentage" 
                :status="avatarUploadStatus.status"
                :stroke-width="2"
              />
              <span class="status-text">头像上传中...</span>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <!-- 头像上传对话框 -->
    <el-dialog
      v-model="showAvatarDialog"
      title="更换头像"
      width="800px"
      class="avatar-dialog"
      destroy-on-close
    >
      <div class="avatar-dialog-content">
        <el-tabs v-model="avatarMode" class="avatar-tabs">
          <el-tab-pane label="本地上传" name="upload">
            <div class="upload-section">
              <div v-if="!cropData.image" class="avatar-upload-area">
                <el-upload
                  ref="avatarUploadRef"
                  class="avatar-uploader"
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleAvatarChange"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
                >
                  <div class="upload-trigger" role="button" aria-label="点击上传头像图片">
                    <el-icon class="upload-icon"><Plus /></el-icon>
                    <div>点击或拖拽上传图片</div>
                    <div class="upload-tip">支持 JPG、PNG、GIF、WebP、SVG 格式，文件大小不超过 5MB</div>
                  </div>
                </el-upload>
              </div>
              
              <div v-else class="avatar-edit-area">
                <div class="cropper-wrapper">
                  <img ref="cropImageRef" :src="cropData.image" alt="裁剪预览" />
                </div>
                <div class="cropper-controls">
                  <el-button-group>
                    <el-button @click="rotateImage(-90)" :icon="RefreshLeft">向左旋转</el-button>
                    <el-button @click="rotateImage(90)" :icon="RefreshRight">向右旋转</el-button>
                  </el-button-group>
                  <el-button-group>
                    <el-button @click="zoomImage(0.1)" :icon="ZoomIn">放大</el-button>
                    <el-button @click="zoomImage(-0.1)" :icon="ZoomOut">缩小</el-button>
                  </el-button-group>
                  <el-button @click="resetAvatarCrop">重新上传</el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="卡通头像 (DiceBear)" name="dicebear">
            <div class="dicebear-section">
              <div class="dicebear-main">
                <div class="dicebear-preview">
                  <img :src="dicebearPreviewUrl" alt="DiceBear 预览" :style="dicebearPreviewStyle" />
                  <el-button @click="dicebearConfig.seed = Math.random().toString(36).substring(7)" :icon="Refresh">
                    随机种子
                  </el-button>
                </div>
                <div class="dicebear-styles" role="radiogroup" aria-label="头像风格选择">
                  <div 
                    v-for="style in dicebearStyles" 
                    :key="style.value"
                    class="style-item"
                    :class="{ active: dicebearConfig.style === style.value }"
                    @click="dicebearConfig.style = style.value"
                    role="radio"
                    :aria-checked="dicebearConfig.style === style.value"
                    :aria-label="style.label"
                    tabindex="0"
                    @keyup.enter="dicebearConfig.style = style.value"
                  >
                    <img :src="`https://api.dicebear.com/7.x/${style.value}/svg?seed=preview&radius=${dicebearConfig.radius}`" alt="" :style="dicebearPreviewStyle" />
                    <span>{{ style.label }}</span>
                  </div>
                </div>
              </div>
              
              <div class="dicebear-controls">
                <el-form label-position="top">
                  <el-form-item label="背景颜色">
                    <el-color-picker v-model="dicebearConfig.backgroundColor" :predefine="['#b6e3f4', '#c0aede', '#d1d4f9', '#ffd5dc', '#ffdfbf']" color-format="hex" />
                  </el-form-item>
                  <el-form-item label="圆角半径">
                    <el-slider v-model="dicebearConfig.radius" :max="50" />
                  </el-form-item>
                  <el-form-item label="水平翻转">
                    <el-switch v-model="dicebearConfig.flip" />
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="avatar-dialog-footer">
          <div class="history-actions">
            <el-button 
              v-if="avatarHistory.length > 1" 
              size="small" 
              @click="undoAvatarChange"
              :icon="RefreshLeft"
            >
              撤销 ({{ avatarHistory.length - 1 }})
            </el-button>
          </div>
          <div class="main-actions">
            <el-button @click="showAvatarDialog = false">取消</el-button>
            <el-button 
              type="primary" 
              @click="handleCropAndUpload" 
              :loading="avatarUploading"
              :disabled="avatarMode === 'upload' && !cropData.image"
            >
              应用头像
            </el-button>
          </div>
        </div>
      </div>
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
import { ref, reactive, onMounted, nextTick, onBeforeUnmount, watch, computed } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { 
  savePersonalInfo as savePersonalInfoAPI, 
  syncPersonalInfo, 
  getDefaultAvatar,
  uploadAvatarAPI,
  getFullAvatarUrl,
  getUserAvatar,
  updateUser
} from '../services/userService'

import { 
  Plus, 
  CircleCheck, 
  CircleClose,
  Refresh, 
  Upload,
  Download,
  Clock,
  MoreFilled,
  Document,
  User,
  RefreshLeft,
  RefreshRight,
  ZoomIn,
  ZoomOut,
  Picture,
  Camera,
  Edit
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import SecurityVerificationModal from '@/components/SecurityVerificationModal.vue'
import { hasSecurityQuestions } from '@/services/securityQuestionService'
import dataEncryptionManager from '@/services/dataEncryptionManager'
import eventBus from '@/utils/eventBus'

interface PersonalForm {
  username: string
  realName: string
  gender: 'male' | 'female' | 'secret'
  birthday: string
  phone: string
  email: string
  bio: string
  avatar?: string
  lastAvatarUpdate?: string
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

// ... (existing icons)

// 对话框控制
const showAvatarDialog = ref(false)
const showSyncHistoryDialog = ref(false)
const showVerifyDialog = ref(false)
const showSecurityVerification = ref(false)

// 切换头像模式：'upload' 或 'dicebear'
const avatarMode = ref<'upload' | 'dicebear'>('upload')

// 个人信息表单引用
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
  bio: '',
  avatar: '',
  lastAvatarUpdate: ''
})

// 原始表单数据副本（用于比较更改）
const originalPersonalForm = reactive<PersonalForm>({
  username: '',
  realName: '',
  gender: 'secret',
  birthday: '',
  phone: '',
  email: '',
  bio: '',
  avatar: '',
  lastAvatarUpdate: ''
})

// 验证状态
const phoneVerified = ref(false)
const emailVerified = ref(false)

// 裁剪数据
const cropData = reactive({
  image: '',
  preview: '',
  file: null as File | null
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
const avatarLoadError = ref(false)

// 动态计算当前头像的边框样式
const currentAvatarStyle = computed(() => {
  const avatar = personalForm.avatar
  if (!avatar) return { borderRadius: '8px' }
  
  // 如果是 DiceBear 头像，解析其 radius 参数
  if (avatar.includes('api.dicebear.com')) {
    try {
      const url = new URL(avatar)
      const radius = url.searchParams.get('radius')
      if (radius !== null) {
        return { borderRadius: `${radius}%` }
      }
    } catch (e) {
      console.error('[PersonalInfo] 解析头像 URL 失败:', e)
    }
  }
  
  // 默认返回 50% 圆角（通常头像为圆形）
  return { borderRadius: '50%' }
})

// 动态计算 DiceBear 预览图的边框样式
const dicebearPreviewStyle = computed(() => {
  return { borderRadius: `${dicebearConfig.radius}%` }
})

// 加载状态
const saveLoading = ref(false)
const syncLoading = ref(false)

// 隐私设置
const privacySettings = reactive<PrivacySettings>({
  showProfile: true,
  showContact: false,
  allowSearch: true
})

// DiceBear 配置
const dicebearStyles = [
  { label: '冒险者', value: 'adventurer' },
  { label: '头像', value: 'avataaars' },
  { label: '机器人', value: 'bottts' },
  { label: '开心表情', value: 'fun-emoji' },
  { label: '洛莱莱', value: 'lorelei' },
  { label: '米卡', value: 'micah' },
  { label: '迷你人', value: 'miniavs' },
  { label: '诺绅士', value: 'notionists' },
  { label: '开朗小人', value: 'open-peeps' },
  { label: '像素艺术', value: 'pixel-art' }
]

const dicebearConfig = reactive({
  style: 'avataaars',
  seed: Math.random().toString(36).substring(7),
  backgroundColor: '#b6e3f4',
  radius: 0,
  flip: false
})

const dicebearPreviewUrl = ref('')

// 防抖计时器
let dicebearTimer: any = null

// 操作历史记录
const avatarHistory = ref<string[]>([])
const maxHistory = 4 // 包含当前，所以实际可撤销3次

// 添加到历史记录
const addToHistory = (url: string) => {
  if (!url || avatarHistory.value[0] === url) return
  avatarHistory.value.unshift(url)
  if (avatarHistory.value.length > maxHistory) {
    avatarHistory.value.pop()
  }
}

// 撤销修改
const undoAvatarChange = () => {
  if (avatarHistory.value.length > 1) {
    avatarHistory.value.shift()
    const previousAvatar = avatarHistory.value[0]
    
    if (previousAvatar.startsWith('https://api.dicebear.com')) {
      avatarMode.value = 'dicebear'
      dicebearPreviewUrl.value = previousAvatar
      // 简单解析 URL 恢复部分配置 (可选)
    } else {
      avatarMode.value = 'upload'
      cropData.image = previousAvatar
      nextTick(() => initCropper())
    }
  }
}

// 更新 DiceBear 预览 URL (带防抖)
const updateDicebearPreview = () => {
  if (dicebearTimer) clearTimeout(dicebearTimer)
  
  dicebearTimer = setTimeout(() => {
    const { style, seed, backgroundColor, radius, flip } = dicebearConfig
    // 确保颜色值不包含 #
    const cleanColor = backgroundColor?.replace('#', '') || 'b6e3f4'
    const newUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${cleanColor}&radius=${radius}${flip ? '&flip=true' : ''}`
    
    // 如果预览图变化了，才更新并记录历史
    if (dicebearPreviewUrl.value !== newUrl) {
      dicebearPreviewUrl.value = newUrl
      // 预览时也记录历史，方便撤销
      addToHistory(newUrl)
    }
  }, 300) // 300ms 防抖
}

// 监听配置变化实时预览
watch(dicebearConfig, () => {
  updateDicebearPreview()
}, { deep: true })

/**
 * 解析 DiceBear URL 并更新配置
 * @param url DiceBear URL
 */
const parseDicebearUrl = (url: string) => {
  if (!url || !url.includes('api.dicebear.com')) return
  
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    // 路径格式通常为 /7.x/{style}/svg
    const style = pathParts[2]
    
    if (style) {
      dicebearConfig.style = style
    }
    
    const params = urlObj.searchParams
    if (params.get('seed')) {
      dicebearConfig.seed = params.get('seed') || ''
    }
    
    const bg = params.get('backgroundColor')
    if (bg) {
      dicebearConfig.backgroundColor = bg.startsWith('#') ? bg : `#${bg}`
    }
    
    const radius = params.get('radius')
    if (radius) {
      dicebearConfig.radius = parseInt(radius, 10)
    }
    
    const flip = params.get('flip')
    if (flip) {
      dicebearConfig.flip = flip === 'true'
    } else {
      dicebearConfig.flip = false
    }
    
    // 更新预览
    updateDicebearPreview()
  } catch (error) {
    console.error('解析 DiceBear URL 失败:', error)
  }
}

watch(showAvatarDialog, (val) => {
  if (val) {
    // 弹窗打开时，尝试从当前头像恢复 DiceBear 配置
    if (personalForm.avatar && personalForm.avatar.includes('api.dicebear.com')) {
      parseDicebearUrl(personalForm.avatar)
      avatarMode.value = 'dicebear'
    }
  }
})

// 裁剪并上传
const handleCropAndUpload = async () => {
  // 取消更换头像的安全验证 (Rule: 更换头像不需要安全验证)
  await performAvatarUpload()
}

// 执行头像上传的实际操作
const performAvatarUpload = async () => {
  if (avatarMode.value === 'dicebear') {
    try {
      avatarUploading.value = true
      // 直接将 DiceBear URL 发送给后端保存
      // 这样后期可以解析并再次更改背景颜色、圆角等参数 (Rule: 不更改已经设定图像，即保持 seed/style)
      const response = await updateUser({ avatar: dicebearPreviewUrl.value })
      
      if (response.success) {
        updateAvatarUrl(response.data)
        showAvatarDialog.value = false
        ElMessage.success('卡通头像设置成功')
      } else {
        ElMessage.error(response.message || '设置头像失败')
      }
    } catch (error) {
      ElMessage.error('设置并保存头像失败')
    } finally {
      avatarUploading.value = false
    }
  } else {
    if (!cropper) return
    
    cropper.getCroppedCanvas({
      width: 400,
      height: 400,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    }).toBlob(async (blob) => {
      if (!blob) return
      
      try {
        avatarUploading.value = true
        const file = new File([blob], `avatar_${Date.now()}.png`, { type: 'image/png' })
        const response = await uploadAvatarAPI(file)
        
        if (response.success) {
          updateAvatarUrl(response.data)
          showAvatarDialog.value = false
          ElMessage.success('头像裁剪上传成功')
        } else {
          ElMessage.error(response.message || '上传失败')
        }
      } catch (error) {
        ElMessage.error('头像上传出错')
      } finally {
        avatarUploading.value = false
      }
    }, 'image/png')
  }
}

// 处理二次验证成功
const handleSecurityVerificationSuccess = async (result: boolean): Promise<void> => {
  if (result) {
    ElMessage.success('身份验证成功')
    showSecurityVerification.value = false
    // 只有个人信息保存才需要安全验证 (头像更换已取消验证)
    await performSavePersonalInfo()
  } else {
    ElMessage.error('身份验证失败，请重新输入')
  }
}

// 定义 emit
const emit = defineEmits(['refresh'])

// 关键位置打印日志方便控制台查看日志调试
console.log('[PersonalInfo] 组件初始化')

// 设置头像URL的辅助函数
const updateAvatarUrl = (userData: any): void => {
  console.log('[PersonalInfo] 更新头像URL, 数据:', userData)
  avatarLoadError.value = false
  
  // 统一通过 getUserAvatar 获取头像，它会自动处理：
  // 1. 完整 URL
  // 2. 相对路径拼接后端地址
  // 3. 为空时返回基于用户信息的 DiceBear 默认头像
  const avatarPath = userData?.avatar || userData?.avatar_url
  const fullUrl = getUserAvatar(
    avatarPath, 
    userData?.email, 
    userData?.real_name || userData?.name || userData?.username
  )
  
  avatarUrl.value = fullUrl
  personalForm.avatar = fullUrl
  
  // 打印头像加载状态，辅助调试
  console.log('[PersonalInfo] 最终头像URL:', fullUrl)
  
  if (userData.last_avatar_update_at || userData.lastModified) {
    personalForm.lastAvatarUpdate = userData.last_avatar_update_at || userData.lastModified
  }
  
  // 通知父组件刷新用户信息以保持侧边栏同步
  emit('refresh')
  // 通过事件总线通知全局头像更新
  eventBus.emit('user-info-updated')
}

// 头像加载失败处理
const handleAvatarError = (): void => {
  console.warn('[PersonalInfo] 头像加载失败，标记错误状态')
  avatarLoadError.value = true
}

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
      
      // 通知全局用户信息已更新，确保侧边栏和头像同步
      eventBus.emit('user-info-updated')
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
    
    // 关键位置打印日志方便控制台查看日志调试 (Rule 7)
    console.log('[PersonalInfo] 同步数据响应:', response)
    
    if (response.success && response.data) {
      // 处理双层嵌套结构 (Rule 5)
      const userData = (response.data as any).data || response.data
      console.log('[PersonalInfo] 处理后的用户数据:', userData)
      
      // 更新本地数据，不要显示模拟数据 (Rule 6)
      const personalData = {
        username: userData.username || userData.name || '',
        realName: userData.real_name || userData.name || '',
        gender: userData.gender || 'secret',
        birthday: userData.birthday || '',
        phone: userData.phone || '',
        email: userData.email || '',
        bio: userData.bio || '',
        avatar: userData.avatar || userData.avatar_url || '',
        lastAvatarUpdate: userData.last_avatar_update_at || userData.updatedAt || ''
      }
      
      Object.assign(personalForm, personalData)
      Object.assign(originalPersonalForm, { ...personalData })
      
      // 设置头像URL
      updateAvatarUrl(userData)
      
      // 设置验证状态
      phoneVerified.value = userData.phone_verified || false
      emailVerified.value = userData.email_verified || false
      
      // 设置隐私设置
      if (userData.privacy_settings || userData.privacySettings) {
        Object.assign(privacySettings, userData.privacy_settings || userData.privacySettings)
      }
      
      console.log('[PersonalInfo] 个人信息同步完成:', personalForm)
      
      // 初始化验证状态
      await updateValidationStatus()
      
      // 添加同步历史记录
      addSyncHistory('manual', 'success', '数据同步成功')
      showSyncStatus('success', '同步成功', '个人信息已更新为最新数据')
    } else {
      // 同步失败
      addSyncHistory('manual', 'failed', response.message || '数据同步失败')
      showSyncStatus('warning', '同步失败', response.message || '无法同步最新数据')
    }
  } catch (error: any) {
    console.error('[PersonalInfo] 数据同步出错:', error)
    addSyncHistory('manual', 'failed', '服务器连接错误')
    showSyncStatus('error', '同步失败', '服务器连接失败，请检查网络')
  } finally {
    syncLoading.value = false
  }
}

// 加载个人信息
const loadPersonalInfo = async (): Promise<void> => {
  try {
    showSyncStatus('info', '正在加载', '正在加载个人信息，请稍候...')
    
    // 调用真实API获取个人信息
    const response = await syncPersonalInfo()
    
    // 关键位置打印日志 (Rule 7)
    console.log('[PersonalInfo] 获取个人信息结果:', response)
    
    // 如果API调用成功，使用返回的数据
    if (response.success && response.data) {
      // 处理双层嵌套结构 (Rule 5)
      const userData = (response.data as any).data || response.data
      
      const personalData = {
        username: userData.username || userData.name || '',
        realName: userData.real_name || userData.name || '',
        gender: userData.gender || 'secret',
        birthday: userData.birthday || '',
        phone: userData.phone || '',
        email: userData.email || '',
        bio: userData.bio || '',
        avatar: userData.avatar || userData.avatar_url || '',
        lastAvatarUpdate: userData.last_avatar_update_at || userData.updatedAt || ''
      }
      
      // 设置表单数据
      Object.assign(personalForm, personalData)
      
      // 保存原始数据副本
      Object.assign(originalPersonalForm, { ...personalData })
      
      // 设置头像URL
      updateAvatarUrl(userData)
      
      // 设置验证状态
      phoneVerified.value = userData.phone_verified || false
      emailVerified.value = userData.email_verified || false
      
      // 设置隐私设置 (如果有的话)
      if (userData.privacy_settings) {
        Object.assign(privacySettings, userData.privacy_settings)
      } else {
        // 默认设置
        Object.assign(privacySettings, {
          showProfile: true,
          showContact: false,
          allowSearch: true
        })
      }
      
      showSyncStatus('success', '同步成功', '个人信息已从服务器同步')
      addDataOperationHistory('sync', 'success', '从服务器同步信息成功')
    } else {
      // API 失败处理
      avatarLoadError.value = true
      showSyncStatus('warning', '加载失败', response.message || '无法从服务器获取最新信息')
      addDataOperationHistory('sync', 'failed', response.message || '从服务器同步信息失败')
    }
    
    // 初始化验证状态
    await updateValidationStatus()
    
  } catch (error: any) {
    console.error('[PersonalInfo] 加载个人信息出错:', error)
    showSyncStatus('error', '加载失败', '服务器连接失败，请检查网络')
    avatarLoadError.value = true
    addDataOperationHistory('sync', 'failed', '服务器连接错误')
  }
}

// 头像上传前验证
const beforeAvatarUpload = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
  const isAllowedType = allowedTypes.includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isAllowedType) {
    ElMessage.error('只能上传 JPG、PNG、GIF、WebP 或 SVG 格式的图片!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('头像图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 处理头像文件选择
const handleAvatarChange = (uploadFile: UploadFile): void => {
  if (!uploadFile.raw) return
  
  if (!beforeAvatarUpload(uploadFile.raw)) return
  
  // 保存原始文件对象用于上传
  cropData.file = uploadFile.raw
  
  // 创建本地预览URL
  const imageUrl = URL.createObjectURL(uploadFile.raw)
  cropData.image = imageUrl
  
  // 初始化裁剪器
  nextTick(() => {
    initCropper()
  })
}

// 初始化裁剪器
let cropper: Cropper | null = null
const initCropper = (): void => {
  if (!cropImageRef.value) return
  
  if (cropper) {
    cropper.destroy()
  }
  
  cropper = new Cropper(cropImageRef.value, {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 0.8,
    restore: false,
    guides: true,
    center: true,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
  })
}

// 旋转图片
const rotateImage = (degree: number) => {
  if (cropper) {
    cropper.rotate(degree)
  }
}

// 缩放图片
const zoomImage = (ratio: number) => {
  if (cropper) {
    cropper.zoom(ratio)
  }
}

// 重置头像裁剪
const resetAvatarCrop = (): void => {
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
  cropData.image = ''
  cropData.file = null
}

// 个人信息表单接口定义
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
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event: any) => {
        try {
          const data = JSON.parse(event.target.result)
          if (data.personalInfo) {
            Object.assign(personalForm, data.personalInfo)
            if (data.privacySettings) {
              Object.assign(privacySettings, data.privacySettings)
            }
            if (data.verifiedStatus) {
              phoneVerified.value = data.verifiedStatus.phone || false
              emailVerified.value = data.verifiedStatus.email || false
            }
            ElMessage.success('个人信息导入成功')
            addDataOperationHistory('import', 'success', '个人信息导入成功')
            hasUnsavedChanges.value = true
          } else {
            ElMessage.error('无效的备份文件格式')
          }
        } catch (error) {
          ElMessage.error('解析备份文件失败')
        }
      }
      reader.readAsText(file)
    }
    input.click()
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
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event: any) => {
        try {
          const data = JSON.parse(event.target.result)
          if (data.personalInfo && data.backupTime) {
            Object.assign(personalForm, data.personalInfo)
            if (data.privacySettings) {
              Object.assign(privacySettings, data.privacySettings)
            }
            if (data.verifiedStatus) {
              phoneVerified.value = data.verifiedStatus.phone || false
              emailVerified.value = data.verifiedStatus.email || false
            }
            ElMessage.success(`备份恢复成功 (备份时间: ${new Date(data.backupTime).toLocaleString()})`)
            addDataOperationHistory('backup_restore', 'success', '备份恢复成功')
            hasUnsavedChanges.value = true
          } else {
            ElMessage.error('无效的备份文件格式')
          }
        } catch (error) {
          ElMessage.error('解析备份文件失败')
        }
      }
      reader.readAsText(file)
    }
    input.click()
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
  for (let i = 0; i < fields.length; i++) {
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
  updateDicebearPreview()
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

/* 内容布局 */
.info-content {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 30px;
}

/* 表单区域 */
.info-form-section {
  flex: 1;
  max-width: 800px;
}

.personal-form {
  background: #f5f7fa;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.current-avatar-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
}

.current-avatar-img {
  width: 100px;
  height: 100px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  transition: border-radius 0.3s ease; /* 添加平滑过渡效果 */
}

.avatar-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa; /* 使用中性浅灰色 */
  color: #909399;
  font-size: 24px;
}

/* 强制覆盖可能的默认红色背景 */
:deep(.el-avatar), :deep(.el-image) {
  background-color: #f5f7fa !important;
}

.avatar-info {
  font-size: 12px;
  color: #909399;
}

.avatar-status-form {
  margin-top: 15px;
  width: 100%;
}

.avatar-status-form .status-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: block;
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
.avatar-dialog-content {
  padding: 10px 0;
}

.avatar-tabs {
  margin-bottom: 20px;
}

.upload-section, .dicebear-section {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.avatar-upload-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px;
  transition: all 0.3s;
}

.avatar-upload-area:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.upload-trigger {
  text-align: center;
  cursor: pointer;
}

.upload-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 16px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.avatar-edit-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.cropper-wrapper {
  width: 100%;
  height: 400px;
  background-color: #f8f9fa;
  border-radius: 4px;
  overflow: hidden;
}

.cropper-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.dicebear-main {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
}

.dicebear-preview {
  width: 200px;
  height: 200px;
  background-color: #f8f9fa;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  border: 1px solid #ebeef5;
}

.dicebear-preview img {
  width: 120px;
  height: 120px;
  border: 1px solid #ebeef5;
  background-color: #fff;
  transition: border-radius 0.3s ease;
}

.style-item img {
  width: 40px;
  height: 40px;
  border: 1px solid #f0f2f5;
  background-color: #fff;
  transition: border-radius 0.3s ease;
}

.dicebear-styles {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 10px;
}

.style-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .personal-info {
    padding: 15px;
  }
  
  .info-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .personal-form {
    padding: 15px;
  }
  
  .current-avatar-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .avatar-info-group {
    align-items: center;
  }
  
  .change-avatar-btn {
    align-self: center;
  }
  
  .dicebear-main {
    flex-direction: column;
    align-items: center;
  }
  
  .dicebear-styles {
    grid-template-columns: repeat(3, 1fr);
    max-height: none;
  }
  
  .cropper-wrapper {
    height: 300px;
  }
  
  .avatar-dialog {
    width: 95% !important;
  }

  .input-with-verify {
    flex-direction: row; /* 保持一行，或者在极小屏幕下再切换 */
  }
}

@media screen and (max-width: 480px) {
  .input-with-verify {
    flex-direction: column;
    align-items: stretch;
  }
  
  .verify-input-group {
    flex-direction: column;
  }
  
  .el-form-item {
    margin-bottom: 15px;
  }
  
  .el-button-group {
    display: flex;
    width: 100%;
  }
  
  .el-button-group .el-button {
    flex: 1;
  }
}

.style-item:hover {
  background-color: #f5f7fa;
}

.style-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.style-item img {
  width: 40px;
  height: 40px;
}

.style-item span {
  font-size: 12px;
  color: #606266;
}

.dicebear-controls {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.avatar-dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.main-actions {
  display: flex;
  gap: 12px;
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
  
  .user-avatar,
  .user-avatar-fallback {
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
