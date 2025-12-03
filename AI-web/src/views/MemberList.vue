<template>
  <div class="member-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>成员列表</h1>
          <div class="stats-summary">
            <span class="stat-item">
              总计 {{ filteredMembers.length }} 名成员
            </span>
            <span class="stat-item online">
              在线 {{ onlineMembers.length }} 人
            </span>
          </div>
        </div>
        <div class="header-actions">
          <el-button 
            type="primary" 
            :icon="ArrowLeft" 
            @click="$router.push('/dashboard/members')"
            class="back-btn"
          >
            返回
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="content-section">
      <el-card>
        <div class="search-bar">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-input
                v-model="searchQuery"
                placeholder="搜索成员姓名或学号"
                :prefix-icon="Search"
                clearable
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              />
            </el-col>
            <el-col :span="4">
              <el-select v-model="statusFilter" placeholder="筛选状态" clearable @change="handleSearch">
                <el-option label="全部状态" value="" />
                <el-option label="在线" value="online" />
                <el-option label="在宿舍" value="active" />
                <el-option label="外出" value="away" />
                <el-option label="离校" value="inactive" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="roleFilter" placeholder="筛选角色" clearable @change="handleSearch">
                <el-option label="全部角色" value="" />
                <el-option label="寝室长" value="dorm_leader" />
                <el-option label="管理员" value="admin" />
                <el-option label="普通成员" value="member" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="roomFilter" placeholder="筛选房间" clearable @change="handleSearch">
                <el-option label="全部房间" value="" />
                <el-option label="A-101" value="A-101" />
                <el-option label="A-102" value="A-102" />
                <el-option label="A-103" value="A-103" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-button type="primary" @click="handleSearch" class="search-btn">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleReset" class="reset-btn">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-col>
          </el-row>
        </div>

        <!-- 成员卡片列表 -->
        <div class="member-cards-container" v-loading="loading">
          <div v-if="filteredMembers.length === 0" class="empty-state">
            <el-empty description="暂无符合条件的成员" />
          </div>
          <div v-else class="member-cards-grid">
            <div 
              v-for="member in paginatedMembers" 
              :key="member.id"
              class="member-card"
              :class="getMemberCardClass(member)"
              @contextmenu.prevent="showContextMenu($event, member)"
              @touchstart="handleTouchStart($event, member)"
              @touchend="handleTouchEnd($event, member)"
            >
              <!-- 在线状态指示器 -->
              <div class="status-indicator" :class="member.onlineStatus"></div>
              
              <!-- 成员卡片头部 -->
              <div class="member-card-header">
                <div class="avatar-container">
                  <el-avatar 
                    :size="50" 
                    :src="member.avatar || 'https://picsum.photos/50/50?random=' + member.id"
                    class="member-avatar"
                  >
                    {{ member.name.charAt(0) }}
                  </el-avatar>
                  <div class="online-badge" v-if="member.onlineStatus === 'online'">
                    <el-icon><CircleCheck /></el-icon>
                  </div>
                </div>
                <div class="member-basic-info">
                  <div class="member-name">
                    {{ member.name }}
                    <el-tag 
                      v-if="member.role === 'dorm_leader'" 
                      size="small" 
                      type="warning" 
                      class="role-tag"
                    >
                      寝室长
                    </el-tag>
                    <el-tag 
                      v-else-if="member.role === 'admin'" 
                      size="small" 
                      type="danger" 
                      class="role-tag"
                    >
                      管理员
                    </el-tag>
                  </div>
                  <div class="member-id">{{ member.studentId }}</div>
                  <div class="room-info">
                    <el-icon><House /></el-icon>
                    {{ member.room }}
                  </div>
                </div>
              </div>

              <!-- 成员卡片主体 -->
              <div class="member-card-body">
                <div class="info-row">
                  <span class="label">状态:</span>
                  <el-tag :type="getStatusType(member.status)" size="small" class="status-tag">
                    <el-icon v-if="member.status === 'online'"><CircleCheck /></el-icon>
                    <el-icon v-else-if="member.status === 'away'"><Clock /></el-icon>
                    <el-icon v-else-if="member.status === 'inactive'"><CircleClose /></el-icon>
                    {{ getStatusText(member.status) }}
                  </el-tag>
                </div>
                <div class="info-row">
                  <span class="label">电话:</span>
                  <span class="value">{{ member.phone }}</span>
                </div>
                <div class="info-row">
                  <span class="label">加入:</span>
                  <span class="value">{{ member.joinDate }}</span>
                </div>
                <div class="info-row" v-if="member.lastActive">
                  <span class="label">最后活动:</span>
                  <span class="value">{{ formatLastActive(member.lastActive) }}</span>
                </div>
                <div class="info-row" v-if="member.lastMessage">
                  <span class="label">最近消息:</span>
                  <span class="value message-preview">{{ truncateMessage(member.lastMessage) }}</span>
                </div>
              </div>

              <!-- 成员卡片底部操作 -->
              <div class="member-card-footer">
                <div class="quick-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    circle 
                    @click.stop="handleQuickView(member)"
                    title="快速查看"
                  >
                    <el-icon><View /></el-icon>
                  </el-button>
                  <el-button 
                    type="success" 
                    size="small" 
                    circle 
                    @click.stop="handleQuickMessage(member)"
                    title="发送消息"
                  >
                    <el-icon><ChatDotRound /></el-icon>
                  </el-button>

                  <el-button 
                    v-if="canDeleteMember(member)"
                    type="danger" 
                    size="small" 
                    circle 
                    @click.stop="handleQuickDelete(member)"
                    title="删除成员"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 8, 12, 20, 50]"
            :total="filteredMembers.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 长按菜单 -->
    <el-contextmenu ref="contextmenuRef" :before="beforeContextMenu">
      <el-contextmenu-item @click="handleContextView">查看详情</el-contextmenu-item>
      <el-contextmenu-item @click="handleContextEdit" v-if="canEditMember">编辑成员</el-contextmenu-item>
      <el-contextmenu-item @click="handleContextMessage">发送消息</el-contextmenu-item>
      <el-contextmenu-item @click="handleContextStatus">更改状态</el-contextmenu-item>
      <el-contextmenu-divider />
      <el-contextmenu-item @click="handleContextDelete" v-if="canDeleteMember" class="danger-item">
        删除成员
      </el-contextmenu-item>
    </el-contextmenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Search, ArrowLeft, Refresh, CircleCheck, Clock, CircleClose, 
  House, View, ChatDotRound, Delete 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 类型定义
interface Member {
  id: number
  studentId: string
  name: string
  room: string
  role: 'dorm_leader' | 'admin' | 'member'
  status: 'online' | 'active' | 'away' | 'inactive'
  joinDate: string
  phone: string
  avatar?: string
  onlineStatus: 'online' | 'offline' | 'away'
  lastActive?: string
  lastMessage?: string
}

const router = useRouter()

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const roleFilter = ref('')
const roomFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const currentUserRole = ref<'dorm_leader' | 'admin' | 'member'>('admin')
const selectedMember = ref<Member | null>(null)
const touchStartTime = ref(0)
const contextmenuRef = ref()

// 成员数据 - 增强版
const members = ref<Member[]>([
  {
    id: 1,
    studentId: '2021010101',
    name: '张三',
    room: 'A-101',
    role: 'dorm_leader',
    status: 'online',
    joinDate: '2024-09-01',
    phone: '13812345678',
    onlineStatus: 'online',
    lastActive: new Date().toISOString()
  },
  {
    id: 2,
    studentId: '2021010102',
    name: '李四',
    room: 'A-101',
    role: 'admin',
    status: 'active',
    joinDate: '2024-09-01',
    phone: '13912345678',
    onlineStatus: 'online',
    lastActive: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 3,
    studentId: '2021010103',
    name: '王五',
    room: 'A-102',
    role: 'member',
    status: 'away',
    joinDate: '2024-09-15',
    phone: '13712345678',
    onlineStatus: 'away',
    lastActive: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 4,
    studentId: '2021010104',
    name: '赵六',
    room: 'A-102',
    role: 'member',
    status: 'inactive',
    joinDate: '2024-10-01',
    phone: '13612345678',
    onlineStatus: 'offline',
    lastActive: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 5,
    studentId: '2021010105',
    name: '钱七',
    room: 'A-101',
    role: 'member',
    status: 'active',
    joinDate: '2024-09-10',
    phone: '13512345678',
    onlineStatus: 'online',
    lastActive: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 6,
    studentId: '2021010106',
    name: '孙八',
    room: 'A-103',
    role: 'member',
    status: 'away',
    joinDate: '2024-09-20',
    phone: '13412345678',
    onlineStatus: 'away',
    lastActive: new Date(Date.now() - 7200000).toISOString()
  }
])

// 计算属性
const filteredMembers = computed(() => {
  return members.value.filter(member => {
    const matchesSearch = !searchQuery.value || 
      member.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      member.studentId.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = !statusFilter.value || member.status === statusFilter.value
    const matchesRole = !roleFilter.value || member.role === roleFilter.value
    const matchesRoom = !roomFilter.value || member.room === roomFilter.value
    
    return matchesSearch && matchesStatus && matchesRole && matchesRoom
  })
})

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredMembers.value.slice(start, end)
})

const onlineMembers = computed(() => {
  return members.value.filter(member => member.onlineStatus === 'online')
})

const canEditMember = computed(() => {
  return currentUserRole.value === 'admin' || currentUserRole.value === 'dorm_leader'
})

const canDeleteMember = computed(() => {
  return (member: Member) => {
    if (currentUserRole.value === 'admin') return true
    if (currentUserRole.value === 'dorm_leader' && member.role !== 'admin') return true
    return false
  }
})

// 工具方法
const formatLastActive = (lastActive: string) => {
  const now = new Date()
  const last = new Date(lastActive)
  const diff = now.getTime() - last.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

const getMemberCardClass = (member: Member) => {
  return {
    'member-card-online': member.onlineStatus === 'online',
    'member-card-away': member.onlineStatus === 'away',
    'member-card-offline': member.onlineStatus === 'offline',
    'member-card-inactive': member.status === 'inactive'
  }
}

// 基础方法
const handleSearch = () => {
  currentPage.value = 1
  // 这里可以添加实际的搜索逻辑
}

const handleReset = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  roleFilter.value = ''
  roomFilter.value = ''
  currentPage.value = 1
  handleSearch()
}

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
}

// 卡片操作方法
const handleViewInfo = (member: Member) => {
  router.push(`/dashboard/member/info/${member.id}`)
}

const handleQuickView = (member: Member) => {
  ElMessage.info(`查看 ${member.name} 的详细信息`)
  handleViewInfo(member)
}

const handleQuickMessage = async (member: Member) => {
  try {
    await ElMessageBox.prompt(
      `请输入要发送给 ${member.name} 的消息内容`,
      '发送消息',
      {
        confirmButtonText: '发送',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入消息内容...',
        inputRows: 3,
        inputMaxlength: 200,
        showWordLimit: true,
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            const message = instance.inputValue?.trim()
            if (!message) {
              ElMessage.warning('消息内容不能为空')
              return
            }
            if (message.length > 200) {
              ElMessage.warning('消息内容不能超过200字符')
              return
            }
            // 发送消息
            sendMessageToMember(member, message)
            done()
          } else {
            done()
          }
        }
      }
    )
  } catch {
    // 用户取消
  }
}

const sendMessageToMember = (member: Member, message: string) => {
  // 模拟消息发送过程
  ElMessage.info('正在发送消息...')
  
  setTimeout(() => {
    // 模拟消息发送成功
    member.lastMessage = message
    ElMessage.success(`消息已发送给 ${member.name}`)
    
    // 如果成员在线，可以模拟实时显示
    if (member.onlineStatus === 'online') {
      ElMessage.info(`${member.name} 已查看消息`)
    }
  }, 1000)
}



const handleQuickDelete = async (member: Member) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除成员 ${member.name} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await handleDeleteMember(member)
  } catch {
    // 用户取消
  }
}

const handleDeleteMember = async (member: Member) => {
  const index = members.value.findIndex(m => m.id === member.id)
  if (index > -1) {
    members.value.splice(index, 1)
    ElMessage.success(`成员 ${member.name} 已删除`)
  }
}

// 长按菜单支持
const handleTouchStart = () => {
  touchStartTime.value = Date.now()
}

const handleTouchEnd = () => {
  const touchDuration = Date.now() - touchStartTime.value
  if (touchDuration > 500) {
    showContextMenu()
  }
}

const showContextMenu = () => {
  // 这里可以实现右键菜单显示逻辑
  ElMessage.info(`显示操作菜单`)
}

const beforeContextMenu = () => {
  return selectedMember.value !== null
}

const truncateMessage = (message: string, maxLength: number = 25): string => {
  if (!message) return ''
  return message.length > maxLength ? message.substring(0, maxLength) + '...' : message
}

// 长按菜单操作
const handleContextView = () => {
  if (selectedMember.value) {
    handleViewInfo(selectedMember.value)
  }
}

const handleContextEdit = () => {
  if (selectedMember.value) {
    ElMessage.info(`编辑 ${selectedMember.value.name} 的信息`)
  }
}

const handleContextMessage = () => {
  if (selectedMember.value) {
    handleQuickMessage(selectedMember.value)
  }
}

const handleContextStatus = () => {
  if (selectedMember.value) {
    ElMessage.info(`更改 ${selectedMember.value.name} 的状态`)
  }
}

const handleContextDelete = async () => {
  if (selectedMember.value) {
    await handleQuickDelete(selectedMember.value)
  }
}

// 状态工具方法
const getStatusType = (status: string) => {
  switch (status) {
    case 'online': return 'success'
    case 'active': return 'success'
    case 'away': return 'warning'
    case 'inactive': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'online': return '在线'
    case 'active': return '在宿舍'
    case 'away': return '外出'
    case 'inactive': return '离校'
    default: return '未知'
  }
}

// 生命周期
onMounted(() => {
  loading.value = true
  // 模拟加载
  setTimeout(() => {
    loading.value = false
  }, 800)
  
  // 模拟实时状态更新
  const statusInterval = setInterval(() => {
    members.value.forEach(member => {
      if (Math.random() > 0.95) {
        const statuses = ['online', 'away', 'offline'] as const
        member.onlineStatus = statuses[Math.floor(Math.random() * statuses.length)]
      }
    })
  }, 30000)
  
  onUnmounted(() => {
    clearInterval(statusInterval)
  })
})
</script>

<style scoped>
/* 页面容器 */
.page-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 180px);
}

/* 统计摘要区 */
.summary-section {
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border-radius: 10px;
  border-left: 4px solid #409eff;
}

.summary-item.online {
  border-left-color: #67c23a;
  background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);
}

.summary-item.total {
  border-left-color: #e6a23c;
  background: linear-gradient(135deg, #fff8e6 0%, #fef3cd 100%);
}

.summary-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.summary-text {
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

/* 搜索筛选区 */
.operations-section {
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.operations-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.operations-row .el-input,
.operations-row .el-select {
  width: 180px;
}

.operations-row .search-input {
  width: 280px;
}

.reset-button {
  background: linear-gradient(135deg, #909399 0%, #82868b 100%);
  border: none;
  color: white;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(144, 147, 153, 0.3);
}

.reset-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.4);
}

/* 成员卡片容器 */
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

/* 页面头部样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.stats-summary {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.stat-item {
  font-size: 14px;
  color: #606266;
  padding: 4px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.stat-item.online {
  color: #67c23a;
  background: #f0f9ff;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.back-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
}

/* 搜索区域样式 */
.content-section {
  margin-bottom: 20px;
}

.search-bar {
  padding: 20px 0;
}

.search-btn {
  margin-right: 8px;
}

.reset-btn {
  margin-left: 8px;
}

/* 成员卡片样式 */
.member-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  overflow: hidden;
}

.member-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px 0 rgba(0, 0, 0, 0.12);
}

/* 卡片状态指示器 */
.member-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #909399 0%, #a6a9ad 100%);
}

.member-card-online::before {
  background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
}

.member-card-away::before {
  background: linear-gradient(90deg, #e6a23c 0%, #ebb563 100%);
}

.member-card-offline::before {
  background: linear-gradient(90deg, #909399 0%, #a6a9ad 100%);
}

.member-card-inactive {
  opacity: 0.7;
}

.member-card-inactive::before {
  background: linear-gradient(90deg, #f56c6c 0%, #f78989 100%);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.member-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e4e7ed;
}

.member-avatar.online {
  border-color: #67c23a;
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.2);
}

.member-avatar.away {
  border-color: #e6a23c;
  box-shadow: 0 0 0 3px rgba(230, 162, 60, 0.2);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

.online-indicator.online {
  background: #67c23a;
}

.online-indicator.away {
  background: #e6a23c;
}

.online-indicator.offline {
  background: #909399;
}

/* 成员基本信息 */
.member-basic {
  flex: 1;
}

.member-name {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.member-id {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
}

.member-room {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
  background: #f4f4f5;
  padding: 4px 8px;
  border-radius: 6px;
}

/* 角色和状态标签 */
.role-status-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.status-tag {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.role-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-tag.dorm_leader {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  color: white;
}

.role-tag.admin {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  color: white;
}

.role-tag.member {
  background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
  color: white;
}

/* 在线状态信息 */
.online-info {
  font-size: 12px;
  color: #909399;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 成员信息行 */
.member-info {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 14px;
}

.label {
  color: #909399;
  font-weight: 500;
}

.value {
  color: #303133;
  font-weight: 500;
}

.message-preview {
  color: #409eff;
  font-size: 13px;
  font-style: italic;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 快速操作按钮 */
.quick-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.quick-action-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.quick-action-btn.view {
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #b3d8ff;
}

.quick-action-btn.view:hover {
  background: #409eff;
  color: white;
  transform: translateY(-1px);
}

.quick-action-btn.edit {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #f5dab1;
}

.quick-action-btn.edit:hover {
  background: #e6a23c;
  color: white;
  transform: translateY(-1px);
}

.quick-action-btn.delete {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

.quick-action-btn.delete:hover {
  background: #f56c6c;
  color: white;
  transform: translateY(-1px);
}

/* 分页区域 */
.pagination-section {
  margin-top: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #909399;
  margin: 0;
}

/* 长按提示 */
.long-press-hint {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 11px;
  color: #c0c4cc;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.member-card:hover .long-press-hint {
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .members-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }
  
  .summary-section,
  .operations-section {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .members-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .member-card {
    padding: 20px;
  }
  
  .card-header {
    gap: 12px;
  }
  
  .member-avatar {
    width: 50px;
    height: 50px;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .operations-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .operations-row .el-input,
  .operations-row .el-select,
  .operations-row .search-input {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .summary-item {
    padding: 12px;
  }
  
  .member-basic {
    min-width: 0;
  }
  
  .member-name {
    font-size: 16px;
  }
  
  .role-status-tags {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>