<template>
  <div class="dorm-info">
  <!-- 页面头部 -->
  <div class="page-header">
    <div class="header-left">
      <h1 class="page-title">寝室信息</h1>
    </div>
    <div class="header-actions">
      <el-button 
        type="primary" 
        :icon="ArrowLeft" 
        @click="handleBack"
        class="back-btn"
      >
        返回
      </el-button>
      <el-button @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
  </div>

    <!-- 主要内容区域 -->
    <div class="content-wrapper">
      <el-row :gutter="20">
        <!-- 左侧：寝室基本信息 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <el-card class="info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">基本信息</span>
                <div class="header-buttons">
                  <el-button v-if="userPermissions.canEdit" @click="editMode = !editMode" :type="editMode ? 'warning' : 'primary'">
                    <el-icon><Edit /></el-icon>
                    {{ editMode ? '取消编辑' : '编辑信息' }}
                  </el-button>
                  <el-button v-if="userPermissions.canShare" @click="showShareDialog = true" type="success">
                    <el-icon><Share /></el-icon>
                    分享
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 编辑模式 -->
            <div v-if="editMode" class="edit-form">
              <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="寝室名称" prop="name">
                      <el-input v-model="editForm.name" placeholder="请输入寝室名称"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="寝室编号" prop="dormNumber">
                      <el-input v-model="editForm.dormNumber" readonly></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="建筑栋数" prop="building">
                      <el-input v-model="editForm.building" placeholder="例如：A栋"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="房间号" prop="roomNumber">
                      <el-input v-model="editForm.roomNumber" placeholder="例如：101"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="最大人数" prop="maxMembers">
                      <el-input-number v-model="editForm.maxMembers" :min="1" :max="12" style="width: 100%;"></el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="寝室类型" prop="genderType">
                      <el-select v-model="editForm.genderType" style="width: 100%;">
                        <el-option label="男生寝室" value="male"></el-option>
                        <el-option label="女生寝室" value="female"></el-option>
                        <el-option label="混合寝室" value="mixed"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="详细地址" prop="address">
                  <el-input v-model="editForm.address" placeholder="请输入详细地址"></el-input>
                </el-form-item>

                <el-form-item label="寝室描述" prop="description">
                  <el-input 
                    v-model="editForm.description" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入寝室描述">
                  </el-input>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="saveEdit" :loading="saving">保存更改</el-button>
                  <el-button @click="cancelEdit">取消</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 显示模式 -->
            <div v-else class="info-display">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="寝室编号">{{ dormData.dormNumber }}</el-descriptions-item>
                <el-descriptions-item label="寝室名称">{{ dormData.name }}</el-descriptions-item>
                <el-descriptions-item label="位置">{{ dormData.building }} - {{ dormData.roomNumber }}</el-descriptions-item>
                <el-descriptions-item label="寝室类型">
                  <el-tag :type="getGenderTypeColor(dormData.genderType)">
                    {{ getGenderTypeText(dormData.genderType) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="最大人数">{{ dormData.maxMembers }}人</el-descriptions-item>
                <el-descriptions-item label="当前人数">
                  <el-tag type="info">{{ dormData.currentMembers }}人</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="详细地址" :span="2">{{ dormData.address }}</el-descriptions-item>
                <el-descriptions-item label="创建时间" :span="2">{{ formatDate(dormData.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="寝室描述" :span="2">
                  <span v-if="dormData.description">{{ dormData.description }}</span>
                  <span v-else class="no-description">暂无描述</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-card>

          <!-- 成员管理区域 -->
          <el-card class="members-card" shadow="hover" v-if="userPermissions.canManageMembers">
            <template #header>
              <div class="card-header">
                <span class="card-title">成员管理</span>
                <el-button @click="showAddMemberDialog = true" type="primary" size="small">
                  <el-icon><UserFilled /></el-icon>
                  添加成员
                </el-button>
              </div>
            </template>

            <div class="members-section">
              <!-- 成员统计 -->
              <div class="member-stats">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-number">{{ dormData.currentMembers }}</div>
                      <div class="stat-label">当前成员</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-number">{{ dormData.maxMembers }}</div>
                      <div class="stat-label">最大容量</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-number">{{ getCapacityPercentage() }}%</div>
                      <div class="stat-label">使用率</div>
                    </div>
                  </el-col>
                </el-row>
              </div>

              <!-- 容量进度条 -->
              <div class="capacity-bar">
                <el-progress 
                  :percentage="getCapacityPercentage()" 
                  :status="getCapacityStatus()"
                  :stroke-width="10"
                  :text-inside="true">
                </el-progress>
              </div>

              <!-- 成员列表 -->
              <div class="members-list">
                <el-table :data="membersData" v-loading="loadingMembers" style="width: 100%">
                  <el-table-column prop="name" label="姓名" width="120">
                    <template #default="{ row }">
                      <div class="member-info">
                        <el-avatar :size="32">{{ row.name.charAt(0) }}</el-avatar>
                        <span>{{ row.name }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="role" label="角色" width="100">
                    <template #default="{ row }">
                      <el-tag :type="getRoleTagType(row.role)" size="small">{{ getRoleText(row.role) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="joinDate" label="加入时间">
                    <template #default="{ row }">{{ formatDate(row.joinDate) }}</template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="80">
                    <template #default="{ row }">
                      <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                        {{ row.status === 'active' ? '活跃' : '非活跃' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="120" v-if="userPermissions.canManageMembers">
                    <template #default="{ row }">
                      <el-button type="danger" size="small" @click="removeMember(row.id)">移除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：统计概览和操作 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <!-- 费用统计概览 -->
          <el-card class="stats-card" shadow="hover">
            <template #header>
              <span class="card-title">费用统计</span>
            </template>

            <div class="expense-stats">
              <div class="stat-item-monthly">
                <div class="stat-icon">
                  <el-icon><Money /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">￥{{ expenseStats.totalThisMonth.toFixed(2) }}</div>
                  <div class="stat-label">本月总支出</div>
                </div>
              </div>

              <el-divider />

              <div class="expense-breakdown">
                <h4>支出分类</h4>
                <div class="expense-item" v-for="category in expenseCategories" :key="category.name">
                  <div class="expense-header">
                    <span class="expense-name">{{ category.name }}</span>
                    <span class="expense-amount">￥{{ category.amount.toFixed(2) }}</span>
                  </div>
                  <el-progress 
                    :percentage="(category.amount / expenseStats.totalThisMonth * 100)" 
                    :stroke-width="6"
                    :show-text="false">
                  </el-progress>
                </div>
              </div>

              <el-divider />

              <div class="expense-actions">
                <el-button type="primary" size="small" @click="$router.push('/dashboard/expense')">
                  <el-icon><Document /></el-icon>
                  查看详情
                </el-button>
                <el-button type="success" size="small" @click="showAddExpenseDialog = true">
                  <el-icon><Plus /></el-icon>
                  添加费用
                </el-button>
              </div>
            </div>
          </el-card>



          <!-- 最近的动态 -->
          <el-card class="activity-card" shadow="hover">
            <template #header>
              <span class="card-title">最近动态</span>
            </template>

            <div class="activity-list">
              <div class="activity-item" v-for="activity in recentActivities" :key="activity.id">
                <div class="activity-avatar">
                  <el-avatar :size="32">{{ activity.user.charAt(0) }}</el-avatar>
                </div>
                <div class="activity-content">
                  <div class="activity-text">{{ activity.description }}</div>
                  <div class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</div>
                </div>
              </div>
              
              <div v-if="recentActivities.length === 0" class="no-activity">
                暂无动态
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分享对话框 -->
    <el-dialog v-model="showShareDialog" title="分享寝室" width="400px">
      <div class="share-content">
        <div class="qr-code" v-if="dormData.dormNumber">
          <div class="qr-placeholder">
            <el-icon size="60"><Grid /></el-icon>
            <p>寝室二维码</p>
            <p class="dorm-number">{{ dormData.dormNumber }}</p>
          </div>
        </div>
        
        <div class="share-info">
          <h4>寝室信息</h4>
          <p><strong>名称：</strong>{{ dormData.name }}</p>
          <p><strong>位置：</strong>{{ dormData.building }} - {{ dormData.roomNumber }}</p>
          <p><strong>人数：</strong>{{ dormData.currentMembers }}/{{ dormData.maxMembers }}</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button type="primary" @click="copyShareInfo">复制信息</el-button>
      </template>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog v-model="showAddMemberDialog" title="添加成员" width="500px">
      <el-form :model="addMemberForm" label-width="80px">
        <el-form-item label="成员姓名">
          <el-input v-model="addMemberForm.name" placeholder="请输入成员姓名"></el-input>
        </el-form-item>
        <el-form-item label="成员角色">
          <el-select v-model="addMemberForm.role" style="width: 100%;">
            <el-option label="普通成员" value="member"></el-option>
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="财务" value="treasurer"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddMemberDialog = false">取消</el-button>
        <el-button type="primary" @click="addMember">添加</el-button>
      </template>
    </el-dialog>

    <!-- 添加费用对话框 -->
    <el-dialog v-model="showAddExpenseDialog" title="添加费用" width="500px">
      <el-form :model="addExpenseForm" label-width="80px">
        <el-form-item label="费用名称">
          <el-input v-model="addExpenseForm.title" placeholder="请输入费用名称"></el-input>
        </el-form-item>
        <el-form-item label="费用金额">
          <el-input-number v-model="addExpenseForm.amount" :min="0" :precision="2" style="width: 100%;"></el-input-number>
        </el-form-item>
        <el-form-item label="费用类型">
          <el-select v-model="addExpenseForm.category" style="width: 100%;">
            <el-option label="生活费" value="living"></el-option>
            <el-option label="电费" value="electricity"></el-option>
            <el-option label="水费" value="water"></el-option>
            <el-option label="网费" value="internet"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="费用描述">
          <el-input v-model="addExpenseForm.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddExpenseDialog = false">取消</el-button>
        <el-button type="primary" @click="addExpense">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { 
  ArrowLeft, Refresh, Edit, Share, UserFilled, Money, Document, 
  Plus, Grid
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'



// 响应式数据
const editMode = ref(false)
const loadingMembers = ref(false)
const saving = ref(false)
const showShareDialog = ref(false)
const showAddMemberDialog = ref(false)
const showAddExpenseDialog = ref(false)
const editFormRef = ref<FormInstance>()

// 模拟用户权限数据
const userPermissions = reactive({
  canEdit: true,
  canShare: true,
  canManageMembers: true,
  canManageExpenses: true,
  canManageBills: true,
  canManageSettings: true,
  canViewStatistics: true
})



// 模拟寝室数据
const dormData = reactive({
  dormNumber: 'A101-101-2024012401',
  name: 'A101寝室',
  building: 'A栋',
  roomNumber: '101',
  maxMembers: 6,
  currentMembers: 4,
  genderType: 'male',
  address: '北京市海淀区XX大学A栋101室',
  description: '这是一个温馨和谐的男生寝室，大家相处融洽，共同维护良好的生活环境。',
  createTime: '2024-01-15T08:00:00Z'
})

// 编辑表单数据
const editForm = reactive({
  name: '',
  dormNumber: '',
  building: '',
  roomNumber: '',
  maxMembers: 6,
  genderType: 'male',
  address: '',
  description: ''
})

// 编辑表单验证规则
const editRules: FormRules = {
  name: [
    { required: true, message: '请输入寝室名称', trigger: 'blur' }
  ],
  building: [
    { required: true, message: '请输入建筑栋数', trigger: 'blur' }
  ],
  roomNumber: [
    { required: true, message: '请输入房间号', trigger: 'blur' }
  ],
  maxMembers: [
    { required: true, message: '请选择最大人数', trigger: 'change' }
  ],
  genderType: [
    { required: true, message: '请选择寝室类型', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

// 成员数据
const membersData = ref([
  { id: 1, name: '张三', role: 'admin', joinDate: '2024-01-15', status: 'active' },
  { id: 2, name: '李四', role: 'treasurer', joinDate: '2024-01-20', status: 'active' },
  { id: 3, name: '王五', role: 'member', joinDate: '2024-02-01', status: 'active' },
  { id: 4, name: '赵六', role: 'member', joinDate: '2024-02-10', status: 'active' }
])

// 添加成员表单
const addMemberForm = reactive({
  name: '',
  role: 'member'
})

// 费用统计数据
const expenseStats = reactive({
  totalThisMonth: 1256.50,
  totalLastMonth: 1180.30,
  pendingBills: 3
})

// 费用分类数据
const expenseCategories = ref([
  { name: '生活费', amount: 680.00 },
  { name: '电费', amount: 180.50 },
  { name: '水费', amount: 120.00 },
  { name: '网费', amount: 150.00 },
  { name: '其他', amount: 126.00 }
])

// 添加费用表单
const addExpenseForm = reactive({
  title: '',
  amount: 0,
  category: 'living',
  description: ''
})

// 最近动态数据
const recentActivities = ref([
  {
    id: 1,
    user: '张三',
    description: '添加了新费用：水费50元',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
  },
  {
    id: 2,
    user: '李四',
    description: '更新了寝室信息',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5小时前
  },
  {
    id: 3,
    user: '王五',
    description: '加入寝室',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1天前
  }
])

// 计算属性和工具方法
const getCapacityPercentage = () => {
  return Math.round((dormData.currentMembers / dormData.maxMembers) * 100)
}

const getCapacityStatus = () => {
  const percentage = getCapacityPercentage()
  if (percentage >= 90) return 'exception'
  if (percentage >= 70) return 'warning'
  return 'success'
}

const getGenderTypeColor = (type: string) => {
  const colors = {
    male: 'primary',
    female: 'danger',
    mixed: 'warning'
  }
  return colors[type as keyof typeof colors] || 'info'
}

const getGenderTypeText = (type: string) => {
  const texts = {
    male: '男生寝室',
    female: '女生寝室',
    mixed: '混合寝室'
  }
  return texts[type as keyof typeof texts] || '未知类型'
}

const getRoleTagType = (role: string) => {
  const types = {
    admin: 'danger',
    treasurer: 'warning',
    member: 'info'
  }
  return types[role as keyof typeof types] || 'info'
}

const getRoleText = (role: string) => {
  const texts = {
    admin: '管理员',
    treasurer: '财务',
    member: '成员'
  }
  return texts[role as keyof typeof texts] || '未知'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

// 事件处理方法
const refreshData = async () => {
  try {
    // 模拟数据刷新
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新失败，请重试')
  }
}

const editFormInit = () => {
  Object.assign(editForm, {
    name: dormData.name,
    dormNumber: dormData.dormNumber,
    building: dormData.building,
    roomNumber: dormData.roomNumber,
    maxMembers: dormData.maxMembers,
    genderType: dormData.genderType,
    address: dormData.address,
    description: dormData.description
  })
}

const saveEdit = async () => {
  if (!editFormRef.value) return
  
  saving.value = true
  try {
    await editFormRef.value.validate()
    
    // 模拟保存API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 更新数据
    Object.assign(dormData, {
      name: editForm.name,
      building: editForm.building,
      roomNumber: editForm.roomNumber,
      maxMembers: editForm.maxMembers,
      genderType: editForm.genderType,
      address: editForm.address,
      description: editForm.description
    })
    
    editMode.value = false
    ElMessage.success('保存成功')
    
  } catch (error) {
    ElMessage.error('保存失败，请检查表单信息')
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  editMode.value = false
  editFormInit()
}

const addMember = () => {
  if (!addMemberForm.name.trim()) {
    ElMessage.warning('请输入成员姓名')
    return
  }
  
  const newMember = {
    id: Date.now(),
    name: addMemberForm.name.trim(),
    role: addMemberForm.role,
    joinDate: new Date().toISOString(),
    status: 'active'
  }
  
  membersData.value.push(newMember)
  dormData.currentMembers++
  
  addMemberForm.name = ''
  addMemberForm.role = 'member'
  showAddMemberDialog.value = false
  
  ElMessage.success('成员添加成功')
}

const removeMember = async (memberId: number) => {
  try {
    await ElMessageBox.confirm('确定要移除这个成员吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = membersData.value.findIndex(m => m.id === memberId)
    if (index > -1) {
      membersData.value.splice(index, 1)
      dormData.currentMembers--
      ElMessage.success('成员移除成功')
    }
  } catch {
    // 用户取消
  }
}

const addExpense = () => {
  if (!addExpenseForm.title.trim() || addExpenseForm.amount <= 0) {
    ElMessage.warning('请填写完整的费用信息')
    return
  }
  
  const categoryMap: Record<string, string> = {
    living: '生活费',
    electricity: '电费',
    water: '水费',
    internet: '网费',
    other: '其他'
  }
  
  const newExpense = {
    name: categoryMap[addExpenseForm.category],
    amount: addExpenseForm.amount
  }
  
  const categoryIndex = expenseCategories.value.findIndex(c => c.name === newExpense.name)
  if (categoryIndex > -1) {
    expenseCategories.value[categoryIndex].amount += newExpense.amount
  } else {
    expenseCategories.value.push(newExpense)
  }
  
  expenseStats.totalThisMonth += newExpense.amount
  
  addExpenseForm.title = ''
  addExpenseForm.amount = 0
  addExpenseForm.category = 'living'
  addExpenseForm.description = ''
  showAddExpenseDialog.value = false
  
  ElMessage.success('费用添加成功')
}

const copyShareInfo = () => {
  const shareText = `寝室信息：
名称：${dormData.name}
编号：${dormData.dormNumber}
位置：${dormData.building} - ${dormData.roomNumber}
人数：${dormData.currentMembers}/${dormData.maxMembers}
地址：${dormData.address}`
  
  navigator.clipboard.writeText(shareText).then(() => {
    ElMessage.success('分享信息已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const handleBack = () => {
  window.history.back()
}

// 生命周期
onMounted(() => {
  editFormInit()
})

// 监听编辑模式变化
watch(editMode, (newValue) => {
  if (newValue) {
    editFormInit()
  }
})
</script>

<style scoped>
.dorm-info {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

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

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
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

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.info-card,
.members-card,
.stats-card,
.actions-card,
.activity-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.edit-form {
  padding: 10px 0;
}

.info-display {
  padding: 10px 0;
}

.no-description {
  color: #909399;
  font-style: italic;
}

.members-section {
  padding: 10px 0;
}

.member-stats {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.capacity-bar {
  margin: 20px 0;
}

.members-list {
  margin-top: 20px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expense-stats {
  padding: 10px 0;
}

.stat-item-monthly {
  display: flex;
  align-items: center;
  padding: 20px 0;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.expense-breakdown h4 {
  margin: 15px 0 10px 0;
  color: #303133;
}

.expense-item {
  margin-bottom: 15px;
}

.expense-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.expense-name {
  color: #303133;
  font-weight: 500;
}

.expense-amount {
  color: #606266;
  font-weight: 500;
}

.expense-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 15px;
}



.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #303133;
  margin-bottom: 4px;
}

.activity-time {
  color: #909399;
  font-size: 12px;
}

.no-activity {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.share-content {
  text-align: center;
}

.qr-code {
  margin-bottom: 20px;
}

.qr-placeholder {
  padding: 40px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 2px dashed #c0c4cc;
}

.qr-placeholder p {
  margin: 10px 0;
  color: #606266;
}

.dorm-number {
  font-weight: bold;
  color: #303133;
  font-size: 16px;
}

.share-info {
  text-align: left;
}

.share-info h4 {
  margin-bottom: 10px;
  color: #303133;
}

.share-info p {
  margin-bottom: 5px;
  color: #606266;
}

@media (max-width: 768px) {
  .dorm-info {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .header-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>