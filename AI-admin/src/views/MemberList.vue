<template>
  <div class="member-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成员列表</span>
          <div>
            <el-button type="primary" @click="handleInvite">邀请成员</el-button>
            <el-button @click="refreshMembers">刷新</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索成员姓名或联系方式"
          clearable
          @keyup.enter="handleSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="roleFilter"
          placeholder="角色筛选"
          clearable
          class="filter-select"
        >
          <el-option label="全部角色" value="" />
          <el-option label="寝室长" value="leader" />
          <el-option label="普通成员" value="member" />
          <el-option label="访客" value="guest" />
        </el-select>
        
        <el-select
          v-model="statusFilter"
          placeholder="状态筛选"
          clearable
          class="filter-select"
        >
          <el-option label="全部状态" value="" />
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
        </el-select>
        
        <el-button @click="resetFilters">重置</el-button>
      </div>
      
      <!-- 成员卡片列表 -->
      <div class="members-grid">
        <el-card 
          v-for="member in filteredMembers" 
          :key="member.id"
          class="member-card"
          :class="{ 'online': member.status === 'online' }"
        >
          <div class="member-header">
            <el-avatar :src="member.avatar" class="member-avatar" />
            <div class="member-info">
              <div class="member-name">
                {{ member.name }}
                <el-tag 
                  :type="getRoleTagType(member.role)" 
                  size="small"
                  class="role-tag"
                >
                  {{ getRoleText(member.role) }}
                </el-tag>
              </div>
            </div>
            <div class="member-status">
              <el-tag :type="getStatusTagType(member.status)">
                <el-icon v-if="member.status === 'online'"><CircleCheck /></el-icon>
                {{ getStatusText(member.status) }}
              </el-tag>
            </div>
          </div>
          
          <div class="member-details">
            <div class="detail-item">
              <el-icon><Phone /></el-icon>
              <span>{{ member.phone || '未填写' }}</span>
            </div>
            <div class="detail-item">
              <el-icon><Message /></el-icon>
              <span>{{ member.email || '未填写' }}</span>
            </div>
            <div class="detail-item">
              <el-icon><HomeFilled /></el-icon>
              <span>{{ member.dormitory || '未分配' }}</span>
            </div>
          </div>
          
          <div class="member-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewMemberDetails(member)"
            >
              查看详情
            </el-button>
            <el-button 
              v-if="member.role !== 'leader'" 
              type="warning" 
              size="small" 
              @click="setAsLeader(member)"
            >
              设为寝室长
            </el-button>
            <el-dropdown @command="handleMemberAction">
              <el-button size="small">
                更多操作
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{action: 'message', member}">
                    <el-icon><ChatDotRound /></el-icon>
                    发送消息
                  </el-dropdown-item>
                  <el-dropdown-item :command="{action: 'edit', member}">
                    <el-icon><Edit /></el-icon>
                    编辑信息
                  </el-dropdown-item>
                  <el-dropdown-item :command="{action: 'remove', member}" divided>
                    <el-icon><Remove /></el-icon>
                    移除成员
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-card>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredMembers.length === 0" class="empty-state">
        <el-empty description="暂无成员数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Phone, Message, HomeFilled, CircleCheck, 
  ChatDotRound, Edit, Remove, ArrowDown 
} from '@element-plus/icons-vue'

// 路由实例
const router = useRouter()

// 响应式数据
const members = ref([
  {
    id: 1,
    name: '张三',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    role: 'leader',
    status: 'online',
    phone: '13800138001',
    email: 'zhangsan@example.com',
    dormitory: 'A栋101室',
    joinDate: '2023-09-01'
  },
  {
    id: 2,
    name: '李四',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    role: 'member',
    status: 'offline',
    phone: '13800138002',
    email: 'lisi@example.com',
    dormitory: 'A栋101室',
    joinDate: '2023-09-05'
  },
  {
    id: 3,
    name: '王五',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    role: 'member',
    status: 'online',
    phone: '13800138003',
    email: 'wangwu@example.com',
    dormitory: 'A栋101室',
    joinDate: '2023-09-10'
  }
])

const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')

// 计算属性 - 过滤后的成员列表
const filteredMembers = computed(() => {
  let result = members.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(member => 
      member.name.toLowerCase().includes(query) ||
      (member.phone && member.phone.includes(query)) ||
      (member.email && member.email.toLowerCase().includes(query))
    )
  }
  
  // 角色过滤
  if (roleFilter.value) {
    result = result.filter(member => member.role === roleFilter.value)
  }
  
  // 状态过滤
  if (statusFilter.value) {
    result = result.filter(member => member.status === statusFilter.value)
  }
  
  return result
})

// 方法
const getRoleTagType = (role: string) => {
  switch (role) {
    case 'leader': return 'primary'
    case 'member': return 'success'
    case 'guest': return 'warning'
    default: return 'info'
  }
}

const getRoleText = (role: string) => {
  switch (role) {
    case 'leader': return '寝室长'
    case 'member': return '成员'
    case 'guest': return '访客'
    default: return '未知'
  }
}

const getStatusTagType = (status: string) => {
  return status === 'online' ? 'success' : 'info'
}

const getStatusText = (status: string) => {
  return status === 'online' ? '在线' : '离线'
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中实现
}

const resetFilters = () => {
  searchQuery.value = ''
  roleFilter.value = ''
  statusFilter.value = ''
}

const refreshMembers = () => {
  // 模拟刷新数据
  ElMessage.success('成员列表已刷新')
}

const handleInvite = () => {
  router.push('/member/invite')
}

const viewMemberDetails = (member: any) => {
  router.push(`/member/detail/${member.id}`)
}

const setAsLeader = async (member: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要将 ${member.name} 设为寝室长吗？`,
      '设为寝室长',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新成员角色
    const leader = members.value.find(m => m.role === 'leader')
    if (leader) {
      leader.role = 'member'
    }
    
    member.role = 'leader'
    ElMessage.success(`${member.name} 已设为寝室长`)
  } catch {
    // 用户取消操作
  }
}

const handleMemberAction = async (command: any) => {
  const { action, member } = command
  
  switch (action) {
    case 'message':
      ElMessage.info(`发送消息给 ${member.name}`)
      break
    case 'edit':
      ElMessage.info(`编辑 ${member.name} 的信息`)
      break
    case 'remove':
      try {
        await ElMessageBox.confirm(
          `确定要移除成员 ${member.name} 吗？`,
          '移除成员',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        // 从列表中移除成员
        const index = members.value.findIndex(m => m.id === member.id)
        if (index !== -1) {
          members.value.splice(index, 1)
          ElMessage.success(`${member.name} 已被移除`)
        }
      } catch {
        // 用户取消操作
      }
      break
  }
}

// 组件挂载时启动定时器模拟在线状态更新
let statusUpdateTimer: any = null

onMounted(() => {
  // 模拟定期更新成员在线状态
  statusUpdateTimer = setInterval(() => {
    members.value.forEach(member => {
      // 随机更新部分成员的状态
      if (Math.random() > 0.7) {
        member.status = member.status === 'online' ? 'offline' : 'online'
      }
    })
  }, 10000) // 每10秒更新一次
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (statusUpdateTimer) {
    clearInterval(statusUpdateTimer)
  }
})
</script>

<style scoped>
.member-list-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  width: 120px;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.member-card {
  transition: all 0.3s ease;
}

.member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.member-card.online {
  border-color: #67c23a;
}

.member-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.member-avatar {
  width: 50px;
  height: 50px;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-tag {
  height: 20px;
  line-height: 18px;
}

.member-id {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.member-status {
  display: flex;
  align-items: center;
}

.member-details {
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.member-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .members-grid {
    grid-template-columns: 1fr;
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>