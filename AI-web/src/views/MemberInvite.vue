<template>
  <div class="member-invite">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="router.push('/dashboard/member/list')" style="margin-right: 20px;">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <h1>邀请成员</h1>
      </div>
      <div class="header-actions">
        <el-button @click="showStats = true">
          <el-icon><DataBoard /></el-icon>
          邀请统计
        </el-button>
        <el-button @click="showInvitedMembers = true">
          <el-icon><User /></el-icon>
          已邀请成员
        </el-button>
      </div>
    </div>

    <div class="content-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>邀请新成员</span>
          </div>
        </template>

        <!-- 邀请方式选择 -->
        <div class="invite-method">
          <el-radio-group v-model="inviteMethod" @change="handleMethodChange">
            <el-radio value="direct">直接邀请</el-radio>
            <el-radio value="code">邀请码邀请</el-radio>
            <el-radio value="link">分享链接邀请</el-radio>
          </el-radio-group>
        </div>

        <!-- 直接邀请表单 -->
        <div v-if="inviteMethod === 'direct'" class="direct-invite">
          <el-form 
            ref="directFormRef"
            :model="directForm"
            :rules="directRules"
            label-width="120px"
            class="invite-form"
          >
            <el-form-item label="姓名" prop="name">
              <el-input 
                v-model="directForm.name" 
                placeholder="请输入成员姓名"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="学号" prop="studentId">
              <el-input 
                v-model="directForm.studentId" 
                placeholder="请输入学号"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="联系电话" prop="phone">
              <el-input 
                v-model="directForm.phone" 
                placeholder="请输入联系电话"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="分配房间" prop="room">
              <el-select 
                v-model="directForm.room" 
                placeholder="请选择房间"
                clearable
              >
                <el-option label="A-101" value="A-101" />
                <el-option label="A-102" value="A-102" />
                <el-option label="A-103" value="A-103" />
                <el-option label="A-104" value="A-104" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="成员角色" prop="role">
              <el-radio-group v-model="directForm.role">
                <el-radio value="member">普通成员</el-radio>
                <el-radio value="admin">管理员</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="备注">
              <el-input 
                v-model="directForm.remark" 
                type="textarea" 
                placeholder="可选填写备注信息"
                :rows="3"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="handleDirectInvite" :loading="inviting">
                发送邀请
              </el-button>
              <el-button @click="resetDirectForm">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 邀请码邀请 -->
        <div v-if="inviteMethod === 'code'" class="code-invite">
          <div class="invite-code-section">
            <!-- 有效期设置 -->
            <div class="expiry-settings">
              <h4>邀请码有效期设置</h4>
              <el-radio-group v-model="codeExpireTime" @change="handleExpireTimeChange">
                <el-radio value="1">1小时</el-radio>
                <el-radio value="6">6小时</el-radio>
                <el-radio value="24" selected>24小时</el-radio>
                <el-radio value="72">3天</el-radio>
                <el-radio value="168">7天</el-radio>
              </el-radio-group>
            </div>
            
            <div class="code-display">
              <div class="code-card">
                <h3>邀请码</h3>
                <div class="code">{{ inviteCode }}</div>
                <div class="code-expiry">
                  <el-tag v-if="inviteCode" type="info" size="small">
                    有效期至：{{ formatExpireTime(codeExpireTime) }}
                  </el-tag>
                </div>
                <el-button type="primary" @click="copyInviteCode" :disabled="!inviteCode">
                  <el-icon><CopyDocument /></el-icon>
                  复制邀请码
                </el-button>
              </div>
            </div>
            
            <div class="code-info">
              <el-alert
                title="邀请码说明"
                type="info"
                :closable="false"
                show-icon
              >
                <template #default>
                  <p>• 邀请码有效期：{{ getExpireTimeText(codeExpireTime) }}</p>
                  <p>• 每个人只能使用一次</p>
                  <p>• 分享给需要邀请的成员</p>
                </template>
              </el-alert>
            </div>
            
            <div class="code-actions">
              <el-button @click="generateNewCode">
                <el-icon><Refresh /></el-icon>
                生成新邀请码
              </el-button>
              <el-button type="info" @click="viewInviteHistory">
                <el-icon><Clock /></el-icon>
                查看邀请历史
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分享链接邀请 -->
        <div v-if="inviteMethod === 'link'" class="link-invite">
          <div class="invite-link-section">
            <!-- 有效期设置 -->
            <div class="expiry-settings">
              <h4>邀请链接有效期设置</h4>
              <el-radio-group v-model="linkExpireTime" @change="handleLinkExpireTimeChange">
                <el-radio value="1">1小时</el-radio>
                <el-radio value="6">6小时</el-radio>
                <el-radio value="24">24小时</el-radio>
                <el-radio value="168" selected>7天</el-radio>
                <el-radio value="720">30天</el-radio>
              </el-radio-group>
            </div>
            
            <div class="link-display">
              <div class="link-card">
                <h3>邀请链接</h3>
                <div class="link-input">
                  <el-input 
                    v-model="inviteLink" 
                    readonly
                    :suffix-icon="Link"
                  />
                  <el-button type="primary" @click="copyInviteLink" :disabled="!inviteLink">
                    <el-icon><CopyDocument /></el-icon>
                    复制链接
                  </el-button>
                </div>
                <div class="link-expiry">
                  <el-tag v-if="inviteLink" type="info" size="small">
                    有效期至：{{ formatLinkExpireTime(linkExpireTime) }}
                  </el-tag>
                </div>
              </div>
            </div>
            
            <div class="share-options">
              <h4>分享方式</h4>
              <div class="share-buttons">
                <el-button @click="shareToWeChat">
                  <el-icon><ChatDotRound /></el-icon>
                  微信分享
                </el-button>
                <el-button @click="shareToQQ">
                  <el-icon><Message /></el-icon>
                  QQ分享
                </el-button>
                <el-button @click="shareByQRCode">
                  <el-icon><DataBoard /></el-icon>
                  生成二维码
                </el-button>
              </div>
            </div>
            
            <div class="link-info">
              <el-alert
                title="链接说明"
                type="info"
                :closable="false"
                show-icon
              >
                <template #default>
                  <p>• 链接有效期：{{ getLinkExpireTimeText(linkExpireTime) }}</p>
                  <p>• 任何人通过链接都可以加入</p>
                  <p>• 建议分享给信任的成员</p>
                </template>
              </el-alert>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 邀请历史对话框 -->
      <el-dialog 
        v-model="showInviteHistory"
        title="邀请历史"
        width="800px"
        :close-on-click-modal="false"
      >
        <el-table :data="inviteHistory" stripe>
          <el-table-column prop="type" label="邀请方式" width="120">
            <template #default="{ row }">
              {{ getInviteTypeText(row.type) }}
            </template>
          </el-table-column>
          
          <el-table-column label="详细信息" width="200">
            <template #default="{ row }">
              <div v-if="row.type === 'direct'">
                <div>{{ row.name }}</div>
                <div style="font-size: 12px; color: #909399;">学号：{{ row.studentId }}</div>
              </div>
              <div v-else-if="row.type === 'code'">
                <div>邀请码：{{ row.code }}</div>
              </div>
              <div v-else-if="row.type === 'link'">
                <div>链接：{{ row.link }}</div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusInfo(row.status).type" size="small">
                {{ getStatusInfo(row.status).text }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="time" label="时间" width="160" />
          
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button 
                v-if="row.type === 'code' && row.status === 'pending'"
                type="danger" 
                size="small" 
                @click="revokeInvite(row)"
              >
                撤回
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <template #footer>
          <el-button @click="showInviteHistory = false">关闭</el-button>
          <el-button type="primary" @click="exportInviteHistory">
            导出记录
          </el-button>
        </template>
      </el-dialog>

      <!-- 邀请统计对话框 -->
      <el-dialog 
        v-model="showStats"
        title="邀请统计"
        width="800px"
        :close-on-click-modal="false"
      >
        <div class="stats-container">
          <div class="stats-cards">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ inviteStats.totalInvites }}</div>
                <div class="stat-label">总邀请数</div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number success">{{ inviteStats.acceptedInvites }}</div>
                <div class="stat-label">成功邀请</div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number warning">{{ inviteStats.pendingInvites }}</div>
                <div class="stat-label">待处理</div>
              </div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number danger">{{ inviteStats.expiredInvites }}</div>
                <div class="stat-label">已过期</div>
              </div>
            </el-card>
          </div>
          
          <div class="success-rate">
            <h4>成功率</h4>
            <el-progress :percentage="inviteStats.successRate" :color="getProgressColor(inviteStats.successRate)" />
          </div>
          
          <div class="recent-activity">
            <h4>最近活动</h4>
            <el-timeline>
              <el-timeline-item 
                v-for="activity in inviteStats.recentActivity" 
                :key="activity.id"
                :timestamp="activity.time"
                :type="activity.type"
              >
                {{ activity.description }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
        
        <template #footer>
          <el-button @click="showStats = false">关闭</el-button>
          <el-button type="primary" @click="refreshStats">
            刷新统计
          </el-button>
        </template>
      </el-dialog>

      <!-- 已邀请成员列表对话框 -->
      <el-dialog 
        v-model="showInvitedMembers"
        title="已邀请成员"
        width="900px"
        :close-on-click-modal="false"
      >
        <div class="members-section">
          <div class="section-actions">
            <el-input 
              v-model="memberSearch"
              placeholder="搜索成员姓名或学号"
              style="width: 300px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button @click="refreshMemberList" style="margin-left: 10px;">
              <el-icon><Refresh /></el-icon>
              刷新列表
            </el-button>
          </div>
          
          <el-table 
            :data="filteredInvitedMembers" 
            stripe 
            style="width: 100%; margin-top: 20px;"
          >
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="studentId" label="学号" width="140" />
            <el-table-column prop="room" label="房间" width="100" />
            <el-table-column label="邀请方式" width="120">
              <template #default="{ row }">
                {{ getInviteMethodText(row.inviteMethod) }}
              </template>
            </el-table-column>
            <el-table-column prop="joinTime" label="加入时间" width="160" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                  {{ row.status === 'active' ? '活跃' : '非活跃' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewMemberInfo(row)">
                  查看详情
                </el-button>
                <el-button type="danger" size="small" @click="removeMember(row)">
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <template #footer>
          <el-button @click="showInvitedMembers = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, 
  CopyDocument, 
  Refresh, 
  Clock, 
  Link, 
  ChatDotRound, 
  Message,
  DataBoard,
  Search,
  User
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const inviteMethod = ref('direct')
const inviting = ref(false)
const showInviteHistory = ref(false)

// 直接邀请表单
const directFormRef = ref()
const directForm = ref({
  name: '',
  studentId: '',
  phone: '',
  room: '',
  role: 'member',
  remark: ''
})

// 表单验证规则
const directRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d{10}$/, message: '学号应为10位数字', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  room: [
    { required: true, message: '请选择房间', trigger: 'change' }
  ]
}

// 邀请码和链接
const inviteCode = ref('')
const inviteLink = ref('')

// 有效期设置
const codeExpireTime = ref('24') // 默认24小时
const linkExpireTime = ref('168') // 默认7天

// 统计相关
const showStats = ref(false)
const showInvitedMembers = ref(false)
const memberSearch = ref('')

// 计算属性：筛选已邀请成员
const filteredInvitedMembers = computed(() => {
  if (!memberSearch.value) {
    return invitedMembers.value
  }
  return invitedMembers.value.filter(member => 
    member.name.includes(memberSearch.value) || 
    member.studentId.includes(memberSearch.value)
  )
})

// 邀请统计数据
const inviteStats = ref({
  totalInvites: 0,
  acceptedInvites: 0,
  pendingInvites: 0,
  expiredInvites: 0,
  successRate: 0,
  recentActivity: []
})

// 邀请历史记录
const inviteHistory = ref([
  {
    id: 1,
    type: 'direct',
    name: '张三',
    studentId: '2021010101',
    status: 'accepted',
    time: '2024-12-19 14:30:00',
    expireTime: '2024-12-20 14:30:00'
  },
  {
    id: 2,
    type: 'code',
    code: '123456',
    status: 'used',
    time: '2024-12-19 10:15:00',
    expireTime: '2024-12-20 10:15:00',
    usedBy: '李四'
  },
  {
    id: 3,
    type: 'link',
    link: 'invite_abc123',
    status: 'pending',
    time: '2024-12-19 09:20:00',
    expireTime: '2024-12-26 09:20:00'
  }
])

// 已邀请成员列表
const invitedMembers = ref([
  {
    id: 1,
    name: '张三',
    studentId: '2021010101',
    joinTime: '2024-12-19 14:30:00',
    room: 'A-101',
    status: 'active',
    inviteMethod: 'direct'
  },
  {
    id: 2,
    name: '李四',
    studentId: '2021010102',
    joinTime: '2024-12-19 11:20:00',
    room: 'A-102',
    status: 'active',
    inviteMethod: 'code'
  }
])

// 方法
const handleMethodChange = () => {
  if (inviteMethod.value === 'code') {
    generateInviteCode()
  } else if (inviteMethod.value === 'link') {
    generateInviteLink()
  }
}

const handleDirectInvite = async () => {
  if (!directFormRef.value) return
  
  try {
    await directFormRef.value.validate()
    inviting.value = true
    
    // 模拟API调用
    setTimeout(() => {
      inviting.value = false
      ElMessage.success('邀请发送成功！')
      resetDirectForm()
    }, 2000)
    
  } catch (error) {
    ElMessage.error('请检查表单填写是否正确')
  }
}

const resetDirectForm = () => {
  directForm.value = {
    name: '',
    studentId: '',
    phone: '',
    room: '',
    role: 'member',
    remark: ''
  }
  directFormRef.value?.clearValidate()
}

const generateInviteCode = () => {
  // 生成6位数字邀请码
  inviteCode.value = Math.random().toString().slice(-6)
  ElMessage.success(`邀请码生成成功，有效期${getExpireTimeText(codeExpireTime.value)}`)
}

const generateInviteLink = () => {
  // 生成邀请链接
  const baseUrl = 'http://172.25.37.9:8001'
  const code = Math.random().toString().slice(-8)
  inviteLink.value = `${baseUrl}/register?invite=${code}&expire=${codeExpireTime.value}`
  ElMessage.success(`邀请链接生成成功，有效期${getLinkExpireTimeText(linkExpireTime.value)}`)
}

// 有效期处理方法
const getExpireTimeText = (hours: string) => {
  const hour = parseInt(hours)
  if (hour < 24) {
    return `${hour}小时`
  } else if (hour === 24) {
    return '24小时'
  } else {
    return `${Math.floor(hour / 24)}天`
  }
}

const getLinkExpireTimeText = (hours: string) => {
  const hour = parseInt(hours)
  if (hour < 24) {
    return `${hour}小时`
  } else if (hour === 24) {
    return '24小时'
  } else {
    return `${Math.floor(hour / 24)}天`
  }
}

const formatExpireTime = (hours: string) => {
  const now = new Date()
  const expire = new Date(now.getTime() + parseInt(hours) * 60 * 60 * 1000)
  return expire.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatLinkExpireTime = (hours: string) => {
  const now = new Date()
  const expire = new Date(now.getTime() + parseInt(hours) * 60 * 60 * 1000)
  return expire.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleExpireTimeChange = () => {
  generateInviteCode()
}

const handleLinkExpireTimeChange = () => {
  generateInviteLink()
}

// 统计相关方法
const refreshStats = () => {
  // 模拟统计数据计算
  const total = inviteHistory.value.length
  const accepted = inviteHistory.value.filter(item => item.status === 'accepted').length
  const pending = inviteHistory.value.filter(item => item.status === 'pending').length
  const expired = inviteHistory.value.filter(item => item.status === 'expired').length
  const successRate = total > 0 ? Math.round((accepted / total) * 100) : 0
  
  inviteStats.value = {
    totalInvites: total,
    acceptedInvites: accepted,
    pendingInvites: pending,
    expiredInvites: expired,
    successRate,
    recentActivity: [
      {
        id: 1,
        type: 'success',
        time: '2024-12-19 15:30:00',
        description: '张三接受了直接邀请'
      },
      {
        id: 2,
        type: 'warning',
        time: '2024-12-19 14:15:00',
        description: '李四使用了邀请码123456'
      }
    ]
  }
  ElMessage.success('统计数据已刷新')
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 60) return '#E6A23C'
  return '#F56C6C'
}

// 成员列表相关方法
const refreshMemberList = () => {
  ElMessage.success('成员列表已刷新')
}

const getInviteMethodText = (method: string) => {
  switch (method) {
    case 'direct': return '直接邀请'
    case 'code': return '邀请码'
    case 'link': return '分享链接'
    default: return '未知'
  }
}

interface Member {
  id: number
  name: string
  studentId: string
  phone: string
  room: string
  role: 'member' | 'admin'
  status: 'pending' | 'accepted' | 'rejected'
  inviteTime: string
  acceptTime?: string
}

const viewMemberInfo = (member: Member) => {
  ElMessage.info(`查看成员：${member.name}`)
}

const removeMember = (member: Member) => {
  ElMessageBox.confirm(
    `确定要移除成员"${member.name}"吗？`,
    '确认移除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = invitedMembers.value.findIndex(item => item.id === member.id)
    if (index > -1) {
      invitedMembers.value.splice(index, 1)
      ElMessage.success(`成员${member.name}已移除`)
    }
  }).catch(() => {
    ElMessage.info('已取消移除')
  })
}

const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    ElMessage.success('邀请码已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    ElMessage.success('邀请链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const generateNewCode = () => {
  generateInviteCode()
}

const viewInviteHistory = () => {
  // 显示邀请历史对话框
  showInviteHistory.value = true
}

interface InviteHistory {
  id: number
  type: 'direct' | 'code' | 'link'
  recipient: string
  status: 'pending' | 'accepted' | 'used' | 'expired'
  createTime: string
  expireTime?: string
  acceptTime?: string
}

const revokeInvite = (invite: InviteHistory) => {
  const index = inviteHistory.value.findIndex(item => item.id === invite.id)
  if (index > -1) {
    inviteHistory.value.splice(index, 1)
    ElMessage.success('邀请已撤回')
  }
}

const exportInviteHistory = () => {
  ElMessage.info('导出功能开发中...')
}

// 获取邀请类型的文本
const getInviteTypeText = (type: string) => {
  switch (type) {
    case 'direct': return '直接邀请'
    case 'code': return '邀请码'
    case 'link': return '分享链接'
    default: return '未知'
  }
}

// 获取状态的文本和类型
const getStatusInfo = (status: string) => {
  switch (status) {
    case 'accepted': return { text: '已接受', type: 'success' }
    case 'used': return { text: '已使用', type: 'warning' }
    case 'pending': return { text: '待处理', type: 'info' }
    case 'expired': return { text: '已过期', type: 'danger' }
    default: return { text: '未知', type: 'info' }
  }
}

const shareToWeChat = () => {
  ElMessage.info('微信分享功能开发中...')
}

const shareToQQ = () => {
  ElMessage.info('QQ分享功能开发中...')
}

const shareByQRCode = () => {
  ElMessage.info('二维码生成功能开发中...')
}

onMounted(() => {
  // 初始化邀请方式
  if (inviteMethod.value === 'code') {
    generateInviteCode()
  } else if (inviteMethod.value === 'link') {
    generateInviteLink()
  }
  
  // 初始化统计数据
  refreshStats()
})
</script>

<style scoped>
.member-invite {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.page-header h1 {
  color: #303133;
  margin: 0;
}

.content-section {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.invite-method {
  margin-bottom: 30px;
  text-align: center;
}

.expiry-settings {
  margin-bottom: 20px;
  text-align: center;
}

.expiry-settings h4 {
  margin: 0 0 15px 0;
  color: #606266;
}

.code-expiry,
.link-expiry {
  margin: 10px 0;
}

.direct-invite {
  max-width: 600px;
}

.invite-form {
  margin-top: 20px;
}

.code-invite,
.link-invite {
  margin-top: 20px;
}

.invite-code-section,
.invite-link-section {
  max-width: 500px;
}

.code-card,
.link-card {
  text-align: center;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.code-card h3,
.link-card h3 {
  margin: 0 0 20px 0;
  color: #303133;
}

.code {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin: 20px 0;
  letter-spacing: 4px;
}

.link-input {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.link-input .el-input {
  flex: 1;
}

.code-info,
.link-info {
  margin: 20px 0;
}

.code-info p,
.link-info p {
  margin: 5px 0;
}

.code-actions,
.share-options {
  text-align: center;
  margin-top: 20px;
}

/* 统计页面样式 */
.stats-container {
  padding: 20px 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-number.success {
  color: #67C23A;
}

.stat-number.warning {
  color: #E6A23C;
}

.stat-number.danger {
  color: #F56C6C;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.success-rate,
.recent-activity {
  margin-top: 30px;
}

.success-rate h4,
.recent-activity h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

/* 成员列表页面样式 */
.members-section {
  padding: 20px 0;
}

.section-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .section-actions {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .section-actions .el-input {
    width: 100% !important;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
}

.code-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.share-options h4 {
  margin: 0 0 15px 0;
  color: #606266;
}

.share-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .share-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .share-buttons .el-button {
    width: 200px;
  }
  
  .code-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .code-actions .el-button {
    width: 200px;
  }
}
</style>