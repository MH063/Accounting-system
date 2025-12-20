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
            @click="$router.push('/dashboard/member')"
            class="back-btn"
          >
            返回
          </el-button>
        </div>
      </div>
    </div>

    <!-- 待审核成员区域 -->
    <div class="content-section" v-if="pendingMembers.length > 0">
      <el-card class="pending-members-card">
        <template #header>
          <div class="card-header">
            <span>待审核成员</span>
            <el-tag type="warning">{{ pendingMembers.length }} 人待审核</el-tag>
          </div>
        </template>
        
        <div class="pending-members-list">
          <div 
            v-for="member in pendingMembers" 
            :key="member.id"
            class="pending-member-item"
          >
            <div class="member-info">
              <el-avatar 
                :size="40" 
                :src="member.avatar || 'https://picsum.photos/40/40?random=' + member.id"
                class="member-avatar"
              >
                {{ member.name.charAt(0) }}
              </el-avatar>
              <div class="member-details">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-student-id">{{ member.studentId }}</div>
              </div>
            </div>
            
            <div class="member-actions">
              <el-button 
                type="success" 
                size="small" 
                @click="approveMember(member)"
              >
                <el-icon><Check /></el-icon>
                通过
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="rejectMember(member)"
              >
                <el-icon><Close /></el-icon>
                拒绝
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
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
                <el-option label="查看者" value="viewer" />
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
              v-for="member in filteredMembers" 
              :key="member.id"
              class="member-card"
              :class="getMemberCardClass(member)"
              @contextmenu.prevent="(event) => { selectedMember.value = member; showContextMenu(); }"
              @touchstart="(event) => handleTouchStart(event, member)"
              @touchend="(event) => handleTouchEnd(event, member)"
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
                    <el-tag 
                      v-else-if="member.role === 'viewer'" 
                      size="small" 
                      type="info" 
                      class="role-tag"
                    >
                      查看者
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
                    v-if="canUpdateRole(member)"
                    type="warning" 
                    size="small" 
                    circle 
                    @click.stop="handleUpdateRole(member)"
                    title="更新角色"
                  >
                    <el-icon><User /></el-icon>
                  </el-button>
                  
                  <el-button 
                    type="info" 
                    size="small" 
                    circle 
                    @click.stop="handleUpdateStatus(member)"
                    title="更新状态"
                  >
                    <el-icon><Setting /></el-icon>
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
            :total="totalMembers"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
    
    <!-- 角色更新对话框 -->
    <el-dialog
      v-model="roleUpdateDialogVisible"
      title="更新成员角色"
      width="400px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedMemberForRoleUpdate" class="role-update-content">
        <div class="member-info">
          <el-avatar 
            :size="50" 
            :src="selectedMemberForRoleUpdate.avatar || 'https://picsum.photos/50/50?random=' + selectedMemberForRoleUpdate.id"
          >
            {{ selectedMemberForRoleUpdate.name.charAt(0) }}
          </el-avatar>
          <div class="member-details">
            <div class="member-name">{{ selectedMemberForRoleUpdate.name }}</div>
            <div class="member-id">{{ selectedMemberForRoleUpdate.studentId }}</div>
            <div class="current-role">
              当前角色: <el-tag :type="getRoleTagType(selectedMemberForRoleUpdate.role)">
                {{ getRoleText(selectedMemberForRoleUpdate.role) }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <div class="role-selection">
          <el-form label-width="80px">
            <el-form-item label="新角色">
              <el-select v-model="newRole" placeholder="请选择角色" style="width: 100%">
                <el-option label="管理员" value="admin" />
                <el-option label="普通成员" value="member" />
                <el-option label="查看者" value="viewer" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleUpdateDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmUpdateRole"
            :loading="roleUpdateLoading"
          >
            确认更新
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 状态更新对话框 -->
    <el-dialog
      v-model="statusUpdateDialogVisible"
      title="更新成员状态"
      width="400px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedMemberForStatusUpdate" class="status-update-content">
        <div class="member-info">
          <el-avatar 
            :size="50" 
            :src="selectedMemberForStatusUpdate.avatar || 'https://picsum.photos/50/50?random=' + selectedMemberForStatusUpdate.id"
          >
            {{ selectedMemberForStatusUpdate.name.charAt(0) }}
          </el-avatar>
          <div class="member-details">
            <div class="member-name">{{ selectedMemberForStatusUpdate.name }}</div>
            <div class="member-id">{{ selectedMemberForStatusUpdate.studentId }}</div>
            <div class="current-status">
              当前状态: <el-tag :type="getStatusType(selectedMemberForStatusUpdate.status)">
                {{ getStatusText(selectedMemberForStatusUpdate.status) }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <div class="status-selection">
          <el-form label-width="80px">
            <el-form-item label="新状态">
              <el-select v-model="newStatus" placeholder="请选择状态" style="width: 100%">
                <el-option label="活跃" value="active" />
                <el-option label="已搬离" value="inactive" />
                <el-option label="待确认" value="pending" />
              </el-select>
            </el-form-item>
            
            <!-- 搬离日期 (仅当状态为inactive时显示 -->
            <el-form-item 
              v-if="newStatus === 'inactive'" 
              label="搬离日期"
            >
              <el-date-picker
                v-model="moveOutDate"
                type="date"
                placeholder="选择搬离日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            
            <!-- 入住日期 (仅当状态为active时显示 -->
            <el-form-item 
              v-if="newStatus === 'active'" 
              label="入住日期"
            >
              <el-date-picker
                v-model="moveInDate"
                type="date"
                placeholder="选择入住日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            
            <!-- 未结费用处理 -->
            <el-form-item label="未结费用">
              <el-radio-group v-model="handleUnpaidExpenses">
                <el-radio label="waive">免除</el-radio>
                <el-radio label="keep">保持</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <!-- 通知用户 -->
            <el-form-item label="通知用户">
              <el-switch v-model="notifyUser" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusUpdateDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmUpdateStatus"
            :loading="statusUpdateLoading"
          >
            确认更新
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Search, ArrowLeft, Refresh, CircleCheck, Clock, CircleClose, 
  House, View, ChatDotRound, Delete, Check, Close, User, Setting
} from '@element-plus/icons-vue'
import { getCurrentUser } from '@/services/userService'
import dormService from '@/services/dormService'
import memberService, { deleteDormMember } from '@/services/memberService'
import type { UserInfo } from '@/services/userService'
import type { DormInfo } from '@/services/dormService'
import { ElMessage, ElMessageBox } from 'element-plus'
// 类型定义
interface Member {
  id: number
  studentId: string
  name: string
  room: string
  role: 'dorm_leader' | 'admin' | 'member' | 'viewer'
  status: 'online' | 'active' | 'away' | 'inactive'
  joinDate: string
  phone: string
  avatar?: string
  onlineStatus: 'online' | 'offline' | 'away'
  lastActive?: string
  lastMessage?: string
  // 新增字段：是否为待审核成员
  isPending?: boolean
  // 新增字段：申请加入的房间
  appliedRoom?: string
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
const totalMembers = ref(0) // 总成员数
const currentUserRole = ref<'dorm_leader' | 'admin' | 'member'>('admin')
const currentUserRoom = ref<string>('') // 当前用户的寝室
const selectedMember = ref<Member | null>(null)
const touchStartTime = ref(0)

// 获取当前用户和寝室信息
const loadCurrentUserAndDorm = async () => {
  try {
    // 获取当前用户信息
    const userResponse = await getCurrentUser()
    console.log('用户信息:', userResponse)
    if (userResponse.success && userResponse.data) {
      // 设置当前用户角色
      currentUserRole.value = userResponse.data.role || 'member'
      
      // 获取用户所在的寝室
      // 使用当前用户的实际ID来查询寝室信息
      const dormResponse = await dormService.getCurrentUserDorm(userResponse.data.id)
      console.log('寝室信息:', dormResponse)
      if (dormResponse.success && dormResponse.data) {
        const dormInfo = dormResponse.data as DormInfo
        // 设置当前用户的寝室号（格式：楼栋-房间号）
        currentUserRoom.value = `${dormInfo.building}-${dormInfo.dormNumber}`
        console.log('设置寝室号:', currentUserRoom.value)
      } else {
        // 如果找不到寝室信息，不使用默认值，保持为空
        currentUserRoom.value = ''
        console.log('未找到寝室信息，不设置默认值')
      }
    }
  } catch (error) {
    console.error('加载用户和寝室信息失败:', error)
    // 出错时不使用默认值，保持为空
    currentUserRoom.value = ''
    console.log('加载用户和寝室信息失败，不设置默认值')
  }
}

// 成员数据 - 从API加载
const members = ref<Member[]>([])

// 角色更新相关状态
const roleUpdateDialogVisible = ref(false)
const selectedMemberForRoleUpdate = ref<Member | null>(null)
const newRole = ref<'admin' | 'member' | 'viewer'>('member')
const roleUpdateLoading = ref(false)

// 状态更新相关状态
const statusUpdateDialogVisible = ref(false)
const selectedMemberForStatusUpdate = ref<Member | null>(null)
const newStatus = ref<'active' | 'inactive' | 'pending'>('active')
const moveOutDate = ref<string | null>(null)
const moveInDate = ref<string | null>(null)
const handleUnpaidExpenses = ref<'waive' | 'keep'>('waive')
const notifyUser = ref<boolean>(true)
const statusUpdateLoading = ref(false)
// 加载成员列表
const loadMembers = async () => {
  try {
    loading.value = true
    console.log('开始加载成员列表...')
    
    // 调试：查看currentUserRoom的值
    console.log('currentUserRoom:', currentUserRoom.value)
    
    // 提取宿舍ID，仅当currentUserRoom不为空时
    let dormId: number | undefined = undefined
    if (currentUserRoom.value) {
      // 调试：查看currentUserRoom提取宿舍ID的过程
      const roomParts = currentUserRoom.value.split('-');
      console.log('roomParts:', roomParts);
      const dormIdStr = roomParts[1];
      console.log('dormIdStr:', dormIdStr);
      dormId = parseInt(dormIdStr) || undefined;
      console.log('dormId:', dormId);
    }
    
    const response = await memberService.getMembers({
      page: currentPage.value,
      limit: pageSize.value,
      dormId: dormId, // 从房间号提取宿舍ID
      search: searchQuery.value || undefined,
      role: roleFilter.value || undefined
    })
    
    if (response.success) {
      // 调试：查看实际返回的数据结构
      console.log('API返回的原始数据:', response.data)
      
      // 检查数据结构
      if (!response.data) {
        console.error('API返回的数据结构不正确，缺少data字段')
        ElMessage.error('数据加载失败：返回的数据结构不正确')
        members.value = []
        return
      }
      
      // 检查是否有members字段，如果没有则使用空数据
      const membersData = response.data.members || []
      
      // 转换新接口返回的数据格式为当前组件使用的格式
      const convertedMembers = membersData.map(member => ({
        id: member.userId,
        studentId: member.username,
        name: member.realName || member.nickname || member.username,
        room: member.dorm ? `${member.dorm.building || ''}-${member.dorm.roomNumber || ''}` : '未分配',
        role: member.membership ? (member.membership.role === 'admin' ? 'admin' : 
              member.membership.role === 'dorm_leader' ? 'dorm_leader' : 
              member.membership.role === 'viewer' ? 'viewer' : 'member') : 'member',
        status: member.userStatus as 'online' | 'active' | 'away' | 'inactive',
        joinDate: member.membership ? member.membership.joinedAt : '',
        phone: member.phone,
        avatar: member.avatarUrl,
        onlineStatus: member.userStatus === 'active' ? 'online' : 'offline'
      }))
      
      members.value = convertedMembers
      
      // 更新分页信息
      if (response.data.pagination) {
        totalMembers.value = response.data.pagination.total
      } else {
        // 如果没有分页信息，使用成员数量作为总数
        totalMembers.value = convertedMembers.length
      }
    } else {
      ElMessage.error(response.message || '加载成员列表失败')
      members.value = []
    }
    
    console.log(`成功加载 ${members.value.length} 个成员`)
  } catch (error) {
    console.error('加载成员列表失败:', error)
    ElMessage.error('加载成员列表失败')
    members.value = []
  } finally {
    loading.value = false
  }
}

// 加载待审核成员
const loadPendingMembers = async () => {
  try {
    console.log('开始加载待审核成员...')
    
    const response = await memberService.getPendingMembers(currentUserRoom.value)
    
    if (response.success) {
      // 检查数据结构
      if (!response.data) {
        console.error('API返回的数据结构不正确，缺少data字段')
        ElMessage.error('待审核成员数据加载失败：返回的数据结构不正确')
        return
      }
      
      // 将待审核成员添加到成员列表中
      members.value = [...members.value, ...response.data.map(member => ({
        ...member,
        isPending: true
      }))]
    } else {
      ElMessage.error(response.message || '加载待审核成员失败')
    }
    
    console.log('成功加载待审核成员')
  } catch (error) {
    console.error('加载待审核成员失败:', error)
  }
}

// 计算属性
const filteredMembers = computed(() => {
  // 过滤掉待审核成员，只显示正式成员
  return members.value.filter(member => {
    // 排除待审核成员
    if (member.isPending) return false
    
    const matchesSearch = !searchQuery.value || 
      member.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      member.studentId.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = !statusFilter.value || member.status === statusFilter.value
    const matchesRole = !roleFilter.value || member.role === roleFilter.value
    const matchesRoom = !roomFilter.value || member.room === roomFilter.value
    
    return matchesSearch && matchesStatus && matchesRole && matchesRoom
  })
})

// 待审核成员计算属性 - 只显示与当前寝室有关的申请
const pendingMembers = computed(() => {
  return members.value.filter(member => member.isPending && member.appliedRoom === currentUserRoom.value)
})

// 由于使用后端分页，直接返回所有成员
const paginatedMembers = computed(() => {
  return members.value
  // 如果需要前端分页，可以取消下面的注释
  // const start = (currentPage.value - 1) * pageSize.value
  // const end = start + pageSize.value
  // return filteredMembers.value.slice(start, end)
})

const onlineMembers = computed(() => {
  return members.value.filter(member => member.onlineStatus === 'online')
})

const canEditMember = computed(() => {
  return currentUserRole.value === 'admin' || currentUserRole.value === 'dorm_leader'
})

const canDeleteMember = computed(() => {
  return (member: Member) => {
    if (member.isPending) return false // 待审核成员不能删除
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
  // 实际的搜索逻辑 - 重新加载数据
  loadMembers()
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
  // 重新加载数据
  loadMembers()
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
  // 重新加载数据
  loadMembers()
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
        inputPlaceholder: '请输入消息内容..',
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

const sendMessageToMember = async (member: Member, message: string) => {
  try {
    ElMessage.info('正在发送消息...')
    console.log(`发送消息给 ${member.name}: ${message}`)
    
    const response = await memberService.sendMessage({
      memberId: member.id,
      message: message,
      timestamp: new Date().toISOString()
    })
    
    if (response.success) {
      // 更新本地消息记录
      member.lastMessage = message
      ElMessage.success(`消息已发送给 ${member.name}`)
      console.log(`消息发送成功: ${member.name}`)
    } else {
      ElMessage.error(response.message || '发送消息失败')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请重试')
  }
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

/**
 * 判断是否可以更新成员角色
 */
const canUpdateRole = (member: Member) => {
  // 管理员可以更新所有成员的角色
  if (currentUserRole.value === 'admin') return true
  // 寝室长可以更新普通成员和查看者的角色，但不能更新管理员的角色
  if (currentUserRole.value === 'dorm_leader' && member.role !== 'admin') return true
  return false
}

/**
 * 处理更新成员角色
 */
const handleUpdateRole = (member: Member) => {
  selectedMemberForRoleUpdate.value = member
  // 设置当前角色为默认值
  newRole.value = member.role === 'admin' ? 'admin' : 
                  member.role === 'dorm_leader' ? 'admin' : 
                  member.role === 'member' ? 'member' : 
                  member.role === 'viewer' ? 'viewer' : 'member'
  roleUpdateDialogVisible.value = true
}

/**
 * 处理更新成员状态
 */
const handleUpdateStatus = (member: Member) => {
  selectedMemberForStatusUpdate.value = member
  // 设置当前状态为默认值
  newStatus.value = member.status === 'active' ? 'active' :
                   member.status === 'inactive' ? 'inactive' :
                   'pending'
  // 重置其他字段
  moveOutDate.value = null
  moveInDate.value = null
  handleUnpaidExpenses.value = 'waive'
  notifyUser.value = true
  statusUpdateDialogVisible.value = true
}

/**
 * 确认更新成员角色
 */
const confirmUpdateRole = async () => {
  if (!selectedMemberForRoleUpdate.value) return
  
  try {
    roleUpdateLoading.value = true
    
    // 调用API更新成员角色
    const response = await memberService.updateMemberRole(
      selectedMemberForRoleUpdate.value.id,
      {
        memberRole: newRole.value,
        updatePermissions: true,
        notifyUser: true
      }
    )
    
    if (response.success) {
      ElMessage.success('成员角色更新成功')
      roleUpdateDialogVisible.value = false
      
      // 更新本地数据以反映角色变更
      if (selectedMemberForRoleUpdate.value) {
        const index = members.value.findIndex(m => m.id === selectedMemberForRoleUpdate.value!.id)
        if (index > -1) {
          members.value[index].role = newRole.value
        }
      }
      
      // 刷新成员列表
      await loadMembers()
    } else {
      ElMessage.error(response.message || '更新成员角色失败')
    }
  } catch (error) {
    console.error('更新成员角色失败:', error)
    ElMessage.error('更新成员角色失败')
  } finally {
    roleUpdateLoading.value = false
  }
}

/**
 * 确认更新成员状态
 */
const confirmUpdateStatus = async () => {
  if (!selectedMemberForStatusUpdate.value) return
  
  try {
    statusUpdateLoading.value = true
    
    // 构造状态更新数据
    const statusData: any = {
      status: newStatus.value,
      notifyUser: notifyUser.value
    }
    
    // 根据新状态添加相应的日期字段
    if (newStatus.value === 'inactive' && moveOutDate.value) {
      statusData.moveOutDate = moveOutDate.value
    }
    
    if (newStatus.value === 'active' && moveInDate.value) {
      statusData.moveInDate = moveInDate.value
    }
    
    // 添加未结费用处理选项
    statusData.handleUnpaidExpenses = handleUnpaidExpenses.value
    
    // 调用API更新成员状态
    const response = await memberService.updateMemberStatus(
      selectedMemberForStatusUpdate.value.id,
      statusData
    )
    
    if (response.success) {
      ElMessage.success('成员状态更新成功')
      statusUpdateDialogVisible.value = false
      
      // 更新本地数据以反映状态变更
      if (selectedMemberForStatusUpdate.value) {
        const index = members.value.findIndex(m => m.id === selectedMemberForStatusUpdate.value!.id)
        if (index > -1) {
          members.value[index].status = newStatus.value
        }
      }
      
      // 刷新成员列表
      await loadMembers()
    } else {
      ElMessage.error(response.message || '更新成员状态失败')
    }
  } catch (error) {
    console.error('更新成员状态失败:', error)
    ElMessage.error('更新成员状态失败')
  } finally {
    statusUpdateLoading.value = false
  }
}

const handleDeleteMember = async (member: Member) => {
  // 注意：这里需要传入用户宿舍关联记录ID，而不是用户ID
  // 由于现有数据结构中没有userDormId，我们假设member.id就是关联记录ID
  // 在实际应用中，可能需要从member.membership.id获取正确的关联记录ID
  const userDormId = member.id;
  
  const response = await deleteDormMember(userDormId, {
    deleteType: 'logical',
    handleUnpaidExpenses: 'waive',
    refundDeposit: false,
    notifyUser: true
  })
  
  if (response.success) {
    const index = members.value.findIndex(m => m.id === member.id)
    if (index > -1) {
      members.value.splice(index, 1)
      ElMessage.success(`成员 ${member.name} 已删除`)
      
      // 重新加载成员列表以确保数据一致性
      await loadMembers()
    }
  } else {
    ElMessage.error(response.message || '删除成员失败')
  }
}

// 长按菜单支持
const handleTouchStart = (event: TouchEvent, member: Member) => {
  touchStartTime.value = Date.now()
  selectedMember.value = member
}

const handleTouchEnd = (event: TouchEvent, member: Member) => {
  const touchDuration = Date.now() - touchStartTime.value
  if (touchDuration > 500) {
    showContextMenu()
  }
}

const showContextMenu = () => {
  // 这里可以实现右键菜单显示逻辑
  ElMessage.info(`显示操作菜单`)
}

const truncateMessage = (message: string, maxLength: number = 25): string => {
  if (!message) return ''
  return message.length > maxLength ? message.substring(0, maxLength) + '...' : message
}


// 待审核成员操作方法
const approveMember = async (member: Member) => {
  try {
    await ElMessageBox.confirm(
      `确定要通过 ${member.name} 的加入申请吗？`,
      '审核通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success',
      }
    )
    
    const response = await memberService.approveMember(member.id)
    
    if (response.success) {
      // 执行审核通过操作
      const index = members.value.findIndex(m => m.id === member.id)
      if (index > -1) {
        // 更新成员信息
        members.value[index] = {
          ...members.value[index],
          isPending: false,
          room: member.appliedRoom || 'A-101', // 分配到申请的房间
          joinDate: new Date().toISOString().split('T')[0] || '', // 设置加入日期
          status: 'active',
          onlineStatus: 'online'
        }
        
        ElMessage.success(`${member.name} 已成功加入寝室`)
        
        // 可以在这里添加通知或其他后续操作
      }
    } else {
      ElMessage.error(response.message || '审核通过失败')
    }
  } catch {
    // 用户取消
  }
}

const rejectMember = async (member: Member) => {
  try {
    await ElMessageBox.confirm(
      `确定要拒绝 ${member.name} 的加入申请吗？`,
      '拒绝申请',
      {
        confirmButtonText: '确定拒绝',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const response = await memberService.rejectMember(member.id)
    
    if (response.success) {
      // 执行拒绝操作
      const index = members.value.findIndex(m => m.id === member.id)
      if (index > -1) {
        members.value.splice(index, 1)
        ElMessage.success(`已拒绝 ${member.name} 的加入申请`)
      }
    } else {
      ElMessage.error(response.message || '拒绝申请失败')
    }
  } catch {
    // 用户取消
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

/**
 * 获取角色标签类型
 */
const getRoleTagType = (role: string) => {
  switch (role) {
    case 'admin': return 'danger'
    case 'dorm_leader': return 'warning'
    case 'member': return 'primary'
    case 'viewer': return 'info'
    default: return 'info'
  }
}

/**
 * 获取角色文本
 */
const getRoleText = (role: string) => {
  switch (role) {
    case 'admin': return '管理员'
    case 'dorm_leader': return '寝室长'
    case 'member': return '普通成员'
    case 'viewer': return '查看者'
    default: return '未知'
  }
}

// 生命周期
onMounted(async () => {
  try {
    console.log('开始初始化MemberList组件')
    // 加载当前用户和寝室信息
    await loadCurrentUserAndDorm()
    console.log('currentUserRoom值:', currentUserRoom.value)
    
    // 加载成员列表
    await loadMembers()
    
    // 加载待审核成员
    await loadPendingMembers()
    
    console.log('MemberList 组件初始化完成')
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('初始化失败，请刷新页面重试')
  }
})
</script>

<style scoped>
/* 页面容器 */
.page-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 180px);
}

/* 统计摘要框 */
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

/* 成员信息卡 */
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

/* 待审核成员区域 */
.pending-members-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pending-members-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pending-member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  transition: all 0.3s ease;
}

.pending-member-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-details {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.member-student-id {
  font-size: 12px;
  color: #909399;
}

.member-actions {
  display: flex;
  gap: 8px;
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

/* 角色更新对话框样式 */
.role-update-content {
  padding: 10px 0;
}

.role-update-content .member-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.role-update-content .member-details {
  flex: 1;
}

.role-update-content .member-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.role-update-content .member-id {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.role-update-content .current-role {
  font-size: 14px;
  color: #606266;
}

.role-update-content .role-selection {
  margin-top: 16px;
}

/* 状态更新对话框样式 */
.status-update-content {
  padding: 10px 0;
}

.status-update-content .member-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.status-update-content .member-details {
  flex: 1;
}

.status-update-content .member-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.status-update-content .member-id {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.status-update-content .current-status {
  font-size: 14px;
  color: #606266;
}

.status-update-content .status-selection {
  margin-top: 16px;
}
</style>
