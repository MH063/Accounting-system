<template>
  <div class="member-invite-container" :class="{ 'is-mobile': isMobile }">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>邀请成员</span>
          <el-button @click="goBack" :size="isMobile ? 'small' : 'default'">返回</el-button>
        </div>
      </template>
      
      <el-steps 
        :active="currentStep" 
        finish-status="success" 
        align-center 
        :direction="isMobile ? 'vertical' : 'horizontal'"
        :class="{ 'mobile-steps': isMobile }"
      >
        <el-step title="填写邀请信息" />
        <el-step title="生成邀请码" />
        <el-step title="分享邀请链接" />
      </el-steps>
      
      <div class="step-content">
        <!-- 第一步：填写邀请信息 -->
        <div v-if="currentStep === 0" class="step-panel">
          <el-form
            ref="inviteFormRef"
            :model="inviteForm"
            :rules="inviteFormRules"
            :label-width="isMobile ? '80px' : '120px'"
            :label-position="isMobile ? 'top' : 'left'"
            class="invite-form"
          >
            <el-form-item label="邀请说明" prop="description">
              <el-input
                v-model="inviteForm.description"
                type="textarea"
                :rows="isMobile ? 2 : 3"
                placeholder="请输入邀请说明（可选）"
              />
            </el-form-item>
            
            <el-form-item label="有效期" prop="expiry">
              <el-select v-model="inviteForm.expiry" placeholder="请选择有效期" style="width: 100%">
                <el-option label="1小时" value="1h" />
                <el-option label="1天" value="1d" />
                <el-option label="7天" value="7d" />
                <el-option label="30天" value="30d" />
                <el-option label="永久有效" value="forever" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="最大使用次数" prop="maxUses">
              <el-input-number
                v-model="inviteForm.maxUses"
                :min="1"
                :max="100"
                style="width: 100%"
                placeholder="请输入最大使用次数"
              />
            </el-form-item>
            
            <el-form-item label="邀请角色" prop="role">
              <el-select v-model="inviteForm.role" placeholder="请选择邀请角色" style="width: 100%">
                <el-option label="普通成员" value="member" />
                <el-option label="访客" value="guest" />
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-checkbox v-model="inviteForm.sendNotification">
                邀请成功后发送通知
              </el-checkbox>
            </el-form-item>
          </el-form>
          
          <div class="step-actions">
            <el-button type="primary" @click="nextStep" :size="isMobile ? 'large' : 'default'" :style="{ width: isMobile ? '100%' : 'auto' }">下一步</el-button>
          </div>
        </div>
        
        <!-- 第二步：生成邀请码 -->
        <div v-else-if="currentStep === 1" class="step-panel">
          <div class="invite-code-section">
            <div class="code-display">
              <div class="code-label">邀请码</div>
              <div class="code-value">{{ inviteCode }}</div>
              <el-button 
                type="primary" 
                @click="copyInviteCode"
                class="copy-button"
                :size="isMobile ? 'default' : 'default'"
              >
                复制邀请码
              </el-button>
            </div>
            
            <div class="code-info">
              <div class="info-item">
                <span class="info-label">有效期：</span>
                <span>{{ getExpiryText(inviteForm.expiry) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">最大使用次数：</span>
                <span>{{ inviteForm.maxUses }}次</span>
              </div>
              <div class="info-item">
                <span class="info-label">已使用次数：</span>
                <span>{{ usedCount }}次</span>
              </div>
              <div class="info-item">
                <span class="info-label">邀请角色：</span>
                <span>{{ getRoleText(inviteForm.role) }}</span>
              </div>
            </div>
            
            <div class="code-actions" :class="{ 'is-mobile': isMobile }">
              <el-button @click="refreshInviteCode" :style="{ flex: isMobile ? 1 : 'none' }">刷新邀请码</el-button>
              <el-button type="primary" @click="nextStep" :style="{ flex: isMobile ? 1 : 'none' }">下一步</el-button>
            </div>
          </div>
        </div>
        
        <!-- 第三步：分享邀请链接 -->
        <div v-else class="step-panel">
          <div class="share-section">
            <div class="link-display">
              <div class="link-label">邀请链接</div>
              <el-input
                v-model="inviteLink"
                readonly
                class="link-input"
              >
                <template #append>
                  <el-button @click="copyInviteLink">复制</el-button>
                </template>
              </el-input>
            </div>
            
            <div class="share-options">
              <div class="share-title">分享到</div>
              <div class="share-buttons">
                <el-button 
                  v-for="option in shareOptions" 
                  :key="option.name"
                  :type="option.type"
                  @click="shareTo(option.name)"
                  class="share-button"
                >
                  <el-icon><component :is="option.icon" /></el-icon>
                  {{ isMobile && option.name === 'copy' ? '复制' : option.label }}
                </el-button>
              </div>
            </div>
            
            <div class="qr-code-section">
              <div class="qr-title">二维码邀请</div>
              <div class="qr-container">
                <img :src="qrCodeUrl" alt="邀请二维码" class="qr-code" />
                <el-button @click="downloadQRCode">下载二维码</el-button>
              </div>
            </div>
            
            <div class="step-actions" :class="{ 'is-mobile': isMobile }">
              <el-button @click="prevStep" :style="{ flex: isMobile ? 1 : 'none' }">上一步</el-button>
              <el-button type="primary" @click="finishInvite" :style="{ flex: isMobile ? 1 : 'none' }">完成</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 已邀请成员列表 -->
    <el-card class="invited-members-card">
      <template #header>
        <span>已邀请成员</span>
      </template>
      
      <el-table :data="invitedMembers" style="width: 100%" :size="isMobile ? 'small' : 'default'">
        <el-table-column prop="name" label="姓名" min-width="80" />
        <el-table-column prop="email" label="邮箱" min-width="120" v-if="!isMobile" />
        <el-table-column prop="inviteTime" label="时间" min-width="100">
          <template #default="{ row }">
            {{ isMobile ? formatDateShort(row.inviteTime) : formatDate(row.inviteTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getInvitationStatusType(row.status)" size="small">
              {{ getInvitationStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="isMobile ? 80 : 120" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'pending'" 
              type="primary" 
              link
              size="small"
              @click="resendInvitation(row)"
            >
              {{ isMobile ? '重发' : '重新发送' }}
            </el-button>
            <el-button 
              v-if="row.status === 'accepted'" 
              type="success" 
              link
              size="small"
              @click="viewMemberDetails(row)"
            >
              {{ isMobile ? '详情' : '查看详情' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="invitation-stats" :class="{ 'is-mobile': isMobile }">
        <div class="stat-item">
          <span class="stat-label">总数：</span>
          <span class="stat-value">{{ invitationStats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已接受：</span>
          <span class="stat-value">{{ invitationStats.accepted }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">待接受：</span>
          <span class="stat-value">{{ invitationStats.pending }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已过期：</span>
          <span class="stat-value">{{ invitationStats.expired }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Share, Link, CopyDocument, Refresh, Download, 
  ChatDotRound, Message, ChatLineSquare, User 
} from '@element-plus/icons-vue'

// 移动端检测
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  console.log('👥 成员邀请页面加载完成')
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 路由实例
const router = useRouter()

// 响应式数据
const currentStep = ref(0)
const inviteFormRef = ref()

const inviteForm = reactive({
  description: '欢迎加入我们的寝室！',
  expiry: '7d',
  maxUses: 10,
  role: 'member',
  sendNotification: true
})

const inviteFormRules = {
  expiry: [{ required: true, message: '请选择有效期', trigger: 'change' }],
  maxUses: [{ required: true, message: '请输入最大使用次数', trigger: 'blur' }],
  role: [{ required: true, message: '请选择邀请角色', trigger: 'change' }]
}

const inviteCode = ref('ABC123XYZ789')
const usedCount = ref(3)

const inviteLink = computed(() => {
  return `https://dormsystem.com/invite/${inviteCode.value}`
})

const qrCodeUrl = ref('https://via.placeholder.com/200x200?text=邀请二维码')

const shareOptions = [
  { name: 'wechat', label: '微信', icon: ChatDotRound, type: 'success' },
  { name: 'qq', label: 'QQ', icon: Message, type: 'primary' },
  { name: 'weibo', label: '微博', icon: ChatLineSquare, type: '' },
  { name: 'copy', label: '复制链接', icon: CopyDocument, type: 'info' }
]

const invitedMembers = ref([
  {
    id: 1,
    name: '赵六',
    email: 'zhaoliu@example.com',
    inviteTime: '2023-10-15T10:30:00Z',
    status: 'accepted'
  },
  {
    id: 2,
    name: '钱七',
    email: 'qianqi@example.com',
    inviteTime: '2023-10-16T14:20:00Z',
    status: 'pending'
  },
  {
    id: 3,
    name: '孙八',
    email: 'sunba@example.com',
    inviteTime: '2023-10-10T09:15:00Z',
    status: 'expired'
  }
])

const invitationStats = ref({
  total: 15,
  accepted: 12,
  pending: 2,
  expired: 1
})

// 方法
const nextStep = () => {
  if (currentStep.value < 2) {
    if (currentStep.value === 0) {
      // 验证表单
      inviteFormRef.value?.validate((valid: boolean) => {
        if (valid) {
          currentStep.value++
        } else {
          ElMessage.warning('请填写完整的邀请信息')
        }
      })
    } else {
      currentStep.value++
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const goBack = () => {
  router.back()
}

const copyInviteCode = () => {
  navigator.clipboard.writeText(inviteCode.value)
  ElMessage.success('邀请码已复制到剪贴板')
}

const refreshInviteCode = () => {
  // 生成新的邀请码
  inviteCode.value = Math.random().toString(36).substring(2, 10).toUpperCase()
  ElMessage.success('邀请码已刷新')
}

const copyInviteLink = () => {
  navigator.clipboard.writeText(inviteLink.value)
  ElMessage.success('邀请链接已复制到剪贴板')
}

const shareTo = (platform: string) => {
  switch (platform) {
    case 'wechat':
      ElMessage.info('分享到微信')
      break
    case 'qq':
      ElMessage.info('分享到QQ')
      break
    case 'weibo':
      ElMessage.info('分享到微博')
      break
    case 'copy':
      copyInviteLink()
      break
    default:
      ElMessage.warning('未知的分享平台')
  }
}

const downloadQRCode = () => {
  // 模拟下载二维码
  ElMessage.success('二维码已下载')
}

const finishInvite = () => {
  ElMessage.success('邀请创建成功')
  router.push('/member/list')
}

const getExpiryText = (expiry: string) => {
  const map: Record<string, string> = {
    '1h': '1小时',
    '1d': '1天',
    '7d': '7天',
    '30d': '30天',
    'forever': '永久有效'
  }
  return map[expiry] || '未知'
}

const getRoleText = (role: string) => {
  return role === 'member' ? '普通成员' : '访客'
}

const getInvitationStatusType = (status: string) => {
  switch (status) {
    case 'accepted': return 'success'
    case 'pending': return 'warning'
    case 'expired': return 'danger'
    default: return 'info'
  }
}

const getInvitationStatusText = (status: string) => {
  switch (status) {
    case 'accepted': return '已接受'
    case 'pending': return '待接受'
    case 'expired': return '已过期'
    default: return '未知'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
}

const resendInvitation = (member: any) => {
  ElMessage.info(`已重新发送邀请给 ${member.name}`)
}

const viewMemberDetails = (member: any) => {
  router.push(`/member/detail/${member.id}`)
}
</script>

<style scoped>
.member-invite-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-content {
  margin-top: 30px;
}

.step-panel {
  padding: 20px 0;
}

.invite-form {
  max-width: 500px;
  margin: 0 auto;
}

.step-actions {
  text-align: center;
  margin-top: 30px;
}

.invite-code-section {
  text-align: center;
}

.code-display {
  margin-bottom: 30px;
}

.code-label {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.code-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
  letter-spacing: 2px;
  margin-bottom: 20px;
}

.copy-button {
  margin-top: 10px;
}

.code-info {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  text-align: left;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
}

.code-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.share-section {
  max-width: 600px;
  margin: 0 auto;
}

.link-display {
  margin-bottom: 30px;
}

.link-label {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.link-input {
  width: 100%;
}

.share-options {
  margin-bottom: 30px;
}

.share-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  text-align: left;
}

.share-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.share-button {
  flex: 1;
  min-width: 100px;
}

.qr-code-section {
  margin-bottom: 30px;
}

.qr-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  text-align: left;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.qr-code {
  width: 200px;
  height: 200px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.invited-members-card {
  margin-top: 20px;
}

.invitation-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-weight: 600;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

@media (max-width: 768px) {
  .member-invite-container {
    padding: 10px;
  }

  .step-content {
    margin-top: 15px;
  }

  .step-panel {
    padding: 10px 0;
  }

  .mobile-steps {
    height: 180px;
    margin-bottom: 20px;
  }

  .code-value {
    font-size: 20px;
  }

  .code-actions.is-mobile {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }

  .step-actions.is-mobile {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }

  .share-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .share-button {
    width: 100%;
    margin: 0 !important;
  }
  
  .invitation-stats.is-mobile {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat-item {
    text-align: left;
    background: #fff;
    padding: 8px;
    border-radius: 4px;
  }
}
</style>