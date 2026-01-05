<template>
  <div class="dormitory-detail-container">
    <!-- 没有ID时显示寝室选择列表 -->
    <div v-if="!dormitoryId">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>选择寝室查看详情</span>
          </div>
        </template>
        
        <div class="table-container">
          <el-table 
            :data="availableDormitories" 
            style="width: 100%" 
            v-loading="loading.students"
            class="dormitory-select-table"
          >
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="dormNumber" label="寝室号" :min-width="isMobile ? 80 : 100" />
            <el-table-column prop="building" label="楼栋" :min-width="isMobile ? 80 : 100" />
            <el-table-column prop="capacity" label="容量" width="60" v-if="!isMobile" />
            <el-table-column prop="currentOccupancy" label="入住" :width="isMobile ? 70 : 100">
              <template #default="scope">
                <span :class="scope.row.currentOccupancy >= scope.row.capacity ? 'text-danger' : 'text-success'">
                  {{ scope.row.currentOccupancy }}/{{ scope.row.capacity }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="scope">
                <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="120" v-if="!isMobile">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" :width="isMobile ? 80 : 120" fixed="right">
              <template #default="scope">
                <el-button :size="isMobile ? 'small' : 'default'" type="primary" link @click="selectDormitory(scope.row)">
                  {{ isMobile ? '详情' : '查看详情' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
    
    <!-- 有ID时显示具体寝室详情 -->
    <div v-else>
      <!-- 返回按钮 -->
      <div class="return-section" :style="{ marginBottom: isMobile ? '10px' : '20px' }">
        <el-button @click="returnToDormitoryList" type="default" plain :size="isMobile ? 'small' : 'default'">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
      
      <!-- 基本信息卡片 -->
      <el-card>
        <template #header>
          <div class="card-header">
            <span>寝室基本信息</span>
            <el-button type="primary" @click="editDialogVisible = true" :size="isMobile ? 'small' : 'default'">
              编辑信息
            </el-button>
          </div>
        </template>
        
        <el-row :gutter="isMobile ? 10 : 20">
          <el-col :xs="12" :sm="8">
            <div class="statistic-item">
              <div class="statistic-title">寝室号</div>
              <div class="statistic-value">{{ dormitoryInfo.dormNumber || '-' }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="8">
            <div class="statistic-item">
              <div class="statistic-title">楼栋</div>
              <div class="statistic-value">{{ dormitoryInfo.building || '-' }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="8">
            <div class="statistic-item">
              <div class="statistic-title">容量</div>
              <div class="statistic-value">{{ dormitoryInfo.capacity || 0 }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="8">
            <div class="statistic-item">
              <div class="statistic-title">当前入住</div>
              <div class="statistic-value">{{ dormitoryInfo.currentOccupancy || 0 }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="8">
            <div class="statistic-item">
              <div class="statistic-title">空床位</div>
              <div class="statistic-value">{{ (dormitoryInfo.capacity || 0) - (dormitoryInfo.currentOccupancy || 0) }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="8">
            <div class="statistic-item">
              <div class="statistic-title">状态</div>
              <el-tag :type="getStatusTagType(dormitoryInfo.status)" :size="isMobile ? 'small' : 'default'">
                {{ getStatusText(dormitoryInfo.status) }}
              </el-tag>
            </div>
          </el-col>
        </el-row>
        
        <el-divider />
        <div class="info-footer" :class="{ 'is-mobile': isMobile }">
          <div class="info-item">
            <strong>创建时间：</strong>{{ formatDate(dormitoryInfo.createdAt) }}
          </div>
          <div v-if="dormitoryInfo.description" class="info-item">
            <strong>描述：</strong>{{ dormitoryInfo.description }}
          </div>
        </div>
      </el-card>
      
      <!-- 成员信息卡片 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>寝室成员 ({{ students.length }})</span>
            <el-button type="primary" @click="openAddMemberDialog" :size="isMobile ? 'small' : 'default'">
              添加成员
            </el-button>
          </div>
        </template>
        
        <div class="table-container">
          <el-table :data="students" style="width: 100%" v-loading="loading.students">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="姓名" :min-width="100" />
            <el-table-column prop="phone" label="联系电话" :min-width="isMobile ? 120 : 150" v-if="!isMobile" />
            <el-table-column label="床位" :width="isMobile ? 80 : 120">
              <template #default="scope">
                <span>{{ isMobile ? '' : '床位 ' }}{{ scope.row.bedNumber }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" :width="isMobile ? 70 : 120" fixed="right">
              <template #default="scope">
                <el-button :size="isMobile ? 'small' : 'default'" @click="removeStudent(scope.row)" type="danger" link>
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div v-if="students.length === 0" style="text-align: center; padding: 40px;">
          <el-empty description="暂无成员" />
        </div>
      </el-card>
      
      <!-- 费用统计卡片 -->
      <el-row :gutter="isMobile ? 10 : 20" style="margin-top: 20px;">
        <el-col :xs="24" :sm="8" style="margin-bottom: 15px;">
          <el-card shadow="hover" :body-style="{ padding: isMobile ? '15px' : '20px' }">
            <el-statistic title="本月费用" :value="feeStats.totalAmount" prefix="¥" :value-style="{ fontSize: isMobile ? '22px' : '24px' }" />
            <div style="margin-top: 10px;">
              <el-tag :type="feeStats.status === 'paid' ? 'success' : (feeStats.status === 'overdue' ? 'danger' : 'warning')" :size="isMobile ? 'small' : 'default'">
                {{ getFeeStatusText(feeStats.status) }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" style="margin-bottom: 15px;">
          <el-card shadow="hover" :body-style="{ padding: isMobile ? '15px' : '20px' }">
            <el-statistic title="累计费用" :value="feeStats.totalCumulative" prefix="¥" :value-style="{ fontSize: isMobile ? '20px' : '24px' }" />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" style="margin-bottom: 15px;">
          <el-card shadow="hover" :body-style="{ padding: isMobile ? '15px' : '20px' }">
            <el-statistic title="未缴费" :value="feeStats.unpaid" prefix="¥" :value-style="{ color: feeStats.unpaid > 0 ? '#f56c6c' : '#67c23a', fontSize: isMobile ? '20px' : '24px' }" />
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 维修记录卡片 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>维修记录</span>
          </div>
        </template>
        
        <div class="maintenance-timeline-container" :class="{ 'is-mobile': isMobile }">
          <el-timeline>
            <el-timeline-item
              v-for="(record, index) in maintenanceRecords"
              :key="index"
              :timestamp="formatDate(record.date)"
              placement="top"
            >
              <el-card :body-style="{ padding: isMobile ? '12px' : '15px' }">
                <h4 style="margin: 0 0 8px 0; font-size: 16px;">{{ record.title }}</h4>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #606266;">{{ record.description }}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                  <span style="font-size: 12px; color: #909399;">维修人员: {{ record.maintainer }}</span>
                  <el-tag v-if="record.statusText" size="small" type="info">{{ record.statusText }}</el-tag>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="maintenanceRecords.length === 0" description="暂无维修记录" />
        </div>
      </el-card>
    </div>
    
    <!-- 编辑对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      title="编辑寝室信息" 
      :width="isMobile ? '95%' : '500px'"
      :fullscreen="isMobile"
    >
      <el-form 
        :model="editFormData" 
        :rules="editFormRules" 
        ref="editFormRef" 
        :label-width="isMobile ? '80px' : '100px'"
        :label-position="isMobile ? 'top' : 'left'"
      >
        <el-form-item label="寝室号" prop="dormNumber">
          <el-input v-model="editFormData.dormNumber" placeholder="请输入寝室号" />
        </el-form-item>
        
        <el-form-item label="楼栋" prop="building">
          <el-input v-model="editFormData.building" placeholder="请输入楼栋" />
        </el-form-item>
        
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="editFormData.capacity" :min="1" :max="20" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="editFormData.status" placeholder="请选择状态" :disabled="dormitoryInfo.status === 'deleted'" style="width: 100%">
            <el-option label="正常" value="active" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="冻结" value="inactive" />
            <el-option label="已删除" value="deleted" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="editFormData.description" type="textarea" placeholder="请输入描述" :rows="3" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm" :loading="loading.editForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加成员对话框 -->
    <el-dialog 
      v-model="addMemberDialogVisible" 
      title="添加寝室成员" 
      :width="isMobile ? '95%' : '600px'"
      :fullscreen="isMobile"
    >
      <el-form 
        :model="addMemberForm" 
        :label-width="isMobile ? '80px' : '80px'"
        :label-position="isMobile ? 'top' : 'left'"
      >
        <el-form-item label="选择用户">
          <el-select 
            v-model="addMemberForm.userId" 
            placeholder="请选择要添加的用户" 
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="`${user.name} (${user.id})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addMemberDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddMember" :loading="loading.addMember">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { dormitoryApi } from '../api/dormitory'
import { userApi } from '../api/user'

// 路由相关
const router = useRouter()
const route = useRoute()

// 响应式数据
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 从路由参数获取寝室ID
const dormitoryId = computed(() => {
  const id = route.params.id
  if (!id) return null
  const numId = Number(id)
  return isNaN(numId) ? null : numId
})

// 响应式数据
const dormitoryInfo = ref({
  id: 0,
  dormNumber: '',
  building: '',
  capacity: 4,
  currentOccupancy: 0,
  status: 'active',
  createdAt: '',
  description: ''
})

const students = ref<any[]>([])

const availableDormitories = ref<any[]>([])

const availableUsers = ref<any[]>([])

const feeStats = ref({
  totalAmount: 0,
  totalCumulative: 0,
  unpaid: 0,
  status: 'paid'
})

const maintenanceRecords = ref<any[]>([])

// 对话框状态
const editDialogVisible = ref(false)
const addMemberDialogVisible = ref(false)

// 编辑表单数据
const editFormData = ref({
  dormNumber: '',
  building: '',
  capacity: 4,
  status: 'active',
  description: ''
})

const addMemberForm = ref({
  userId: null
})

// 表单验证规则
const editFormRules = {
  dormNumber: [{ required: true, message: '请输入寝室号', trigger: 'blur' }],
  building: [{ required: true, message: '请输入楼栋', trigger: 'blur' }],
  capacity: [{ required: true, message: '请输入容量', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 加载状态
const loading = ref({
  students: false,
  editForm: false,
  addMember: false
})

// 组件挂载时加载数据
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  if (dormitoryId.value) {
    // 如果有ID，加载具体寝室详情
    loadDormitoryDetail()
  } else {
    // 如果没有ID，显示寝室列表选择
    loadDormitoryList()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 监听路由参数变化，当进入或返回页面时加载对应数据
watch(dormitoryId, (newId, oldId) => {
  if (newId && !oldId) {
    loadDormitoryDetail()
  } else if (!newId && oldId) {
    loadDormitoryList()
  }
})

// 监听 dormitoryInfo 变化，自动更新编辑表单数据
watch(dormitoryInfo, (newInfo) => {
  if (newInfo && newInfo.id) {
    editFormData.value = {
      dormNumber: newInfo.dormNumber || '',
      building: newInfo.building || '',
      capacity: newInfo.capacity || 4,
      status: (newInfo.status === 'normal' || !newInfo.status) ? 'active' : newInfo.status,
      description: newInfo.description || ''
    }
  }
}, { immediate: true })

// 数据加载函数
const loadDormitoryDetail = async () => {
  if (!dormitoryId.value) {
    ElMessage.warning('缺少寝室ID参数')
    return
  }
  
  try {
    const response = await dormitoryApi.getDormitoryDetail(dormitoryId.value)
    
    // 处理响应数据结构：后端返回 {success: true, data: {dorm: {...}}}，拦截器返回 data
    // 所以 response 就是 {dorm: {...}}
    const detailData = response?.dorm || response || {}
    
    // 更新 dormitoryInfo
    const newInfo = { 
      id: detailData.id || 0,
      dormNumber: detailData.dormNumber || detailData.dormName || detailData.dorm_name || '',
      building: detailData.building || '',
      capacity: detailData.capacity || 4,
      currentOccupancy: detailData.currentOccupancy || detailData.current_occupancy || 0,
      status: (detailData.status === 'normal' || !detailData.status) ? 'active' : detailData.status,
      createdAt: detailData.createdAt || detailData.created_at || new Date().toISOString(),
      description: detailData.description || ''
    }
    
    dormitoryInfo.value = newInfo
    
    await Promise.all([
      loadStudents(),
      loadFeeStats(),
      loadMaintenanceRecords(),
      loadAvailableUsers()
    ])
    
  } catch (error: any) {
    console.error('❌ 加载寝室详情失败:', error)
    ElMessage.error('加载寝室详情失败')
  }
}

const loadDormitoryList = async () => {
  try {
    const response = await dormitoryApi.getDormitoryList()
    const listData = response?.dorms || response || []
    availableDormitories.value = listData.map((dorm: any) => ({
      id: dorm.id,
      dormNumber: dorm.dormName || dorm.dormNumber || '',
      building: dorm.building || '',
      capacity: dorm.capacity || 0,
      currentOccupancy: dorm.currentOccupancy || 0,
      status: (dorm.status === 'normal' || !dorm.status) ? 'active' : dorm.status,
      createdAt: dorm.createdAt || dorm.created_at || new Date().toISOString(),
      description: dorm.description || ''
    }))
  } catch (error: any) {
    console.error('❌ 加载寝室列表失败:', error)
    ElMessage.error('加载寝室列表失败')
  }
}

const loadStudents = async () => {
  if (!dormitoryId.value) return
  
  try {
    loading.value.students = true
    const response = await dormitoryApi.getDormitoryMembers(dormitoryId.value)
    const membersData = response?.members || response || []
    students.value = membersData.map((member: any) => ({
      id: member.user_dorm_id || member.id,  // 使用 user_dorms 表的 ID
      userId: member.user_id,  // 保存用户 ID 备用
      name: member.nickname || member.username || member.realName || '未知',
      phone: member.phone || '',
      bedNumber: member.bedNumber || member.bed_number || 0,
      memberRole: member.memberRole || member.member_role || 'member',
      moveInDate: member.moveInDate || member.move_in_date || '',
      avatarUrl: member.avatarUrl || member.avatar_url || ''
    }))
  } catch (error: any) {
    console.error('❌ 加载寝室成员失败:', error)
    students.value = []
  } finally {
    loading.value.students = false
  }
}

const loadFeeStats = async () => {
  if (!dormitoryId.value) return
  
  try {
    const response = await dormitoryApi.getDormFeeSummary(dormitoryId.value)
    console.log('📊 费用统计原始数据:', response)
    const feeSummary = response?.feeSummary || response || {}
    feeStats.value = {
      totalAmount: feeSummary.monthlyTotal || 0,
      totalCumulative: feeSummary.totalExpenses || 0,
      unpaid: feeSummary.unpaid || 0,
      status: feeSummary.status || 'paid'
    }
  } catch (error: any) {
    console.error('❌ 加载费用统计失败:', error)
    feeStats.value = {
      totalAmount: 0,
      totalCumulative: 0,
      unpaid: 0,
      status: 'paid'
    }
  }
}

const loadMaintenanceRecords = async () => {
  if (!dormitoryId.value) return
  
  try {
    const response = await dormitoryApi.getDormMaintenanceRecords(dormitoryId.value, {
      page: 1,
      limit: 10
    })
    const recordsData = response?.records || response || []
    maintenanceRecords.value = recordsData.map((record: any) => ({
      id: record.id,
      date: record.completedAt || record.createdAt || new Date().toISOString(),
      title: record.title || '维修申请',
      description: record.description || '',
      maintainer: record.assignedTo || '待分配',
      type: record.type || '',
      status: record.status || '',
      statusText: record.statusText || ''
    }))
  } catch (error: any) {
    console.error('❌ 加载维修记录失败:', error)
    maintenanceRecords.value = []
  }
}

const loadAvailableUsers = async () => {
  if (!dormitoryId.value) return
  
  try {
    const response = await dormitoryApi.getAvailableUsers(dormitoryId.value, {
      limit: 50
    })
    const usersData = response?.users || response || []
    availableUsers.value = usersData.map((user: any) => ({
      id: user.id,
      name: user.nickname || user.realName || user.username || '未知'
    }))
  } catch (error: any) {
    console.error('❌ 加载可添加用户列表失败:', error)
    availableUsers.value = []
  }
}

// 返回寝室列表
const returnToDormitoryList = () => {
  router.push('/dormitory-detail')
}

// 选择寝室
const selectDormitory = (dormitory: any) => {
  router.push(`/dormitory-detail/${dormitory.id}`)
}

// 获取费用状态文本
const getFeeStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'paid': '已缴清',
    'partial': '部分缴纳',
    'unpaid': '未缴费',
    'overdue': '已逾期'
  }
  return statusMap[status] || '未知'
}

// 移除学生
const removeStudent = async (student: any) => {
  try {
    await ElMessageBox.confirm(`确定要将 ${student.name} 从寝室中移除吗？`, '确认移除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await dormitoryApi.removeDormitoryMember(student.id)
    
    ElMessage.success('移除成功')
    
    await Promise.all([
      loadStudents(),
      loadAvailableUsers(),
      loadDormitoryDetail()  // 重新加载宿舍详情，更新当前入住人数
    ])
    
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    console.error('❌ 移除学生失败:', error)
    ElMessage.error(error?.message || '移除失败')
  }
}

// 提交编辑表单
const submitEditForm = async () => {
  try {
    loading.value.editForm = true
    
    // 字段映射：将前端字段名映射到后端期望的字段名
    const updateData = {
      dormName: editFormData.value.dormNumber,  // dormNumber -> dormName
      building: editFormData.value.building,
      capacity: editFormData.value.capacity,
      status: editFormData.value.status,
      description: editFormData.value.description
    }
    
    await dormitoryApi.updateDormitory(dormitoryId.value, updateData)
    
    ElMessage.success('编辑成功')
    editDialogVisible.value = false
    
    // 重新加载数据
    loadDormitoryDetail()
    
  } catch (error: any) {
    console.error('❌ 编辑失败:', error)
    ElMessage.error('编辑失败')
  } finally {
    loading.value.editForm = false
  }
}

// 添加成员
const handleAddMember = async () => {
  if (!addMemberForm.value.userId) {
    ElMessage.warning('请选择要添加的用户')
    return
  }
  
  try {
    loading.value.addMember = true
    
    await dormitoryApi.addDormitoryMember(dormitoryId.value, addMemberForm.value.userId)
    
    ElMessage.success('添加成功')
    addMemberDialogVisible.value = false
    addMemberForm.value.userId = null
    
    await Promise.all([
      loadStudents(),
      loadAvailableUsers(),
      loadDormitoryDetail()  // 重新加载宿舍详情，更新当前入住人数和空床位
    ])
    
  } catch (error: any) {
    console.error('❌ 添加成员失败:', error)
    ElMessage.error(error?.message || '添加成员失败')
  } finally {
    loading.value.addMember = false
  }
}

// 打开添加成员对话框
const openAddMemberDialog = async () => {
  addMemberForm.value.userId = null
  addMemberDialogVisible.value = true
  await loadAvailableUsers()
}

// 工具函数
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    normal: 'success',
    maintenance: 'warning',
    inactive: 'danger',
    frozen: 'danger',
    deleted: 'info',
    dissolved: 'info',
    full: 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '正常',
    normal: '正常',
    maintenance: '维修中',
    inactive: '冻结',
    frozen: '冻结',
    deleted: '已删除',
    dissolved: '已解散',
    full: '已满'
  }
  return statusMap[status] || '未知'
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.dormitory-detail-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.return-section {
  margin-bottom: 20px;
}

.return-section .el-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.operations {
  padding: 10px 0;
}

.text-danger {
  color: #f56c6c;
}

.text-success {
  color: #67c23a;
}

.dormitory-select-table {
  cursor: pointer;
}

.dormitory-select-table .el-table__row:hover {
  background-color: #f5f7fa;
}

.floor-plan {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.bed-space {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  text-align: center;
}

.bed-number {
  font-weight: bold;
  margin-bottom: 10px;
}

.occupant, .vacant {
  margin-top: 10px;
}

.statistic-item {
  text-align: center;
  padding: 10px 0;
}

.statistic-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.statistic-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.info-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.info-footer.is-mobile {
  flex-direction: column;
  gap: 10px;
}

.info-item {
  font-size: 14px;
}

.maintenance-timeline-container.is-mobile {
  padding: 0 5px;
}

.maintenance-timeline-container.is-mobile :deep(.el-timeline-item__wrapper) {
  padding-left: 15px;
}

.maintenance-timeline-container.is-mobile :deep(.el-timeline-item__timestamp) {
  font-size: 12px;
  margin-bottom: 5px;
}

@media (max-width: 768px) {
  .dormitory-detail-container {
    padding: 10px;
  }
  
  .card-header {
    font-size: 14px;
  }
  
  .statistic-item {
    margin-bottom: 10px;
  }
  
  .statistic-title {
    font-size: 12px;
  }
  
  .statistic-value {
    font-size: 16px;
  }
}
</style>