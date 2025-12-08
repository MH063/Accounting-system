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
        
        <el-table 
          :data="availableDormitories" 
          style="width: 100%" 
          v-loading="loading.students"
          @row-click="selectDormitory"
          class="dormitory-select-table"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="dormNumber" label="寝室号" />
          <el-table-column prop="building" label="楼栋" />
          <el-table-column prop="capacity" label="容量" />
          <el-table-column prop="currentOccupancy" label="当前入住">
            <template #default="scope">
              <span :class="scope.row.currentOccupancy >= scope.row.capacity ? 'text-danger' : 'text-success'">
                {{ scope.row.currentOccupancy }} / {{ scope.row.capacity }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small" type="primary" @click="selectDormitory(scope.row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    
    <!-- 有ID时显示具体寝室详情 -->
    <div v-else>
      <!-- 返回按钮 -->
      <div class="return-section">
        <el-button @click="returnToDormitoryList" type="default" plain>
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
      
      <!-- 基本信息卡片 -->
      <el-card>
        <template #header>
          <div class="card-header">
            <span>寝室基本信息</span>
            <el-button type="primary" @click="editDialogVisible = true" size="small">
              编辑信息
            </el-button>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-statistic title="寝室号" :value="dormitoryInfo.dormNumber" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="楼栋" :value="dormitoryInfo.building" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="容量" :value="dormitoryInfo.capacity" />
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="8">
            <el-statistic title="当前入住" :value="dormitoryInfo.currentOccupancy" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="空床位" :value="dormitoryInfo.capacity - dormitoryInfo.currentOccupancy" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="状态">
              <el-tag :type="getStatusTagType(dormitoryInfo.status)">
                {{ getStatusText(dormitoryInfo.status) }}
              </el-tag>
            </el-statistic>
          </el-col>
        </el-row>
        
        <el-divider />
        <div>
          <strong>创建时间：</strong>{{ formatDate(dormitoryInfo.createdAt) }}
        </div>
        <div v-if="dormitoryInfo.description" style="margin-top: 10px;">
          <strong>描述：</strong>{{ dormitoryInfo.description }}
        </div>
      </el-card>
      
      <!-- 成员信息卡片 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>寝室成员 ({{ students.length }})</span>
            <el-button type="primary" @click="addMemberDialogVisible = true" size="small">
              添加成员
            </el-button>
          </div>
        </template>
        
        <el-table :data="students" style="width: 100%" v-loading="loading.students">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="studentId" label="学号" />
          <el-table-column prop="class" label="班级" />
          <el-table-column prop="phone" label="联系电话" />
          <el-table-column label="床位">
            <template #default="scope">
              <span>床位 {{ scope.row.bedNumber }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small" @click="removeStudent(scope.row)" type="danger">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div v-if="students.length === 0" style="text-align: center; padding: 40px;">
          <el-empty description="暂无成员" />
        </div>
      </el-card>
      
      <!-- 费用统计卡片 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="8">
          <el-card>
            <el-statistic title="本月费用" :value="feeStats.totalAmount" prefix="¥" />
            <div style="margin-top: 10px;">
              <el-tag :type="feeStats.status === 'paid' ? 'success' : 'warning'">
                {{ feeStats.status === 'paid' ? '已缴费' : '未缴费' }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <el-statistic title="累计费用" :value="feeStats.totalPaid" prefix="¥" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <el-statistic title="未缴费" :value="feeStats.unpaid" prefix="¥" />
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 维修记录卡片 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <span>维修记录</span>
        </template>
        
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in maintenanceRecords"
            :key="index"
            :timestamp="record.date"
            placement="top"
          >
            <el-card>
              <h4>{{ record.title }}</h4>
              <p>{{ record.description }}</p>
              <p>维修人员: {{ record.maintainer }}</p>
            </el-card>
          </el-timeline-item>
          <el-empty v-if="maintenanceRecords.length === 0" description="暂无维修记录" />
        </el-timeline>
      </el-card>
    </div>
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑寝室信息" width="500px">
      <el-form :model="editFormData" :rules="editFormRules" ref="editFormRef" label-width="100px">
        <el-form-item label="寝室号" prop="dormNumber">
          <el-input v-model="editFormData.dormNumber" placeholder="请输入寝室号" />
        </el-form-item>
        
        <el-form-item label="楼栋" prop="building">
          <el-input v-model="editFormData.building" placeholder="请输入楼栋" />
        </el-form-item>
        
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="editFormData.capacity" :min="1" :max="20" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="editFormData.status" placeholder="请选择状态" :disabled="dormitoryInfo.status === 'dissolved'">
            <el-option label="正常" value="normal" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="已满" value="full" />
            <el-option label="冻结" value="frozen" />
            <el-option label="已解散" value="dissolved" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="editFormData.description" type="textarea" placeholder="请输入描述" />
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
    <el-dialog v-model="addMemberDialogVisible" title="添加寝室成员" width="600px">
      <el-form :model="addMemberForm" label-width="80px">
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
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { dormitoryApi } from '../api/dormitory'
import { userApi } from '../api/user'

// 路由相关
const router = useRouter()
const route = useRoute()

// 从路由参数获取寝室ID
const dormitoryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

// 响应式数据
const dormitoryInfo = ref({
  id: 1,
  dormNumber: 'A101',
  building: 'A栋',
  capacity: 4,
  currentOccupancy: 3,
  status: 'normal',
  createdAt: '2023-01-01 10:00:00',
  description: '一楼朝南，采光良好'
})

const students = ref([
  { id: 1, name: '张三', studentId: '2021001', class: '计算机1班', phone: '13800138001', bedNumber: 1 },
  { id: 2, name: '李四', studentId: '2021002', class: '计算机1班', phone: '13800138002', bedNumber: 2 },
  { id: 3, name: '王五', studentId: '2021003', class: '计算机1班', phone: '13800138003', bedNumber: 3 }
])

const availableDormitories = ref([
  { id: 1, dormNumber: 'A101', building: 'A栋', capacity: 4, currentOccupancy: 3, status: 'normal', createdAt: '2023-01-01 10:00:00' },
  { id: 2, dormNumber: 'A102', building: 'A栋', capacity: 4, currentOccupancy: 2, status: 'normal', createdAt: '2023-01-01 10:00:00' },
  { id: 3, dormNumber: 'B201', building: 'B栋', capacity: 6, currentOccupancy: 5, status: 'normal', createdAt: '2023-01-01 10:00:00' }
])

const availableUsers = ref([
  { id: 4, name: '赵六', studentId: '2021004' },
  { id: 5, name: '钱七', studentId: '2021005' },
  { id: 6, name: '孙八', studentId: '2021006' }
])

const feeStats = ref({
  totalAmount: 1200,
  totalPaid: 3600,
  unpaid: 0,
  status: 'paid'
})

const maintenanceRecords = ref([
  {
    date: '2023-11-15',
    title: '水龙头维修',
    description: '更换损坏的水龙头',
    maintainer: '维修工张三'
  }
])

// 对话框状态
const editDialogVisible = ref(false)
const addMemberDialogVisible = ref(false)

// 编辑表单数据
const editFormData = ref({
  dormNumber: '',
  building: '',
  capacity: 4,
  status: 'normal',
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
  console.log('🏨 寝室详情页面加载完成', {
    hasId: !!dormitoryId.value,
    id: dormitoryId.value
  })
  
  if (dormitoryId.value) {
    // 如果有ID，加载具体寝室详情
    loadDormitoryDetail()
  } else {
    // 如果没有ID，显示寝室列表选择
    loadDormitoryList()
  }
})

// 数据加载函数
const loadDormitoryDetail = async () => {
  if (!dormitoryId.value) {
    ElMessage.warning('缺少寝室ID参数')
    return
  }
  
  try {
    console.log('🔄 加载寝室详情:', dormitoryId.value)
    const response = await dormitoryApi.getDormitoryDetail(dormitoryId.value)
    
    // 处理后端返回的数据结构
    const detailData = response?.data?.data || response?.data || {}
    dormitoryInfo.value = { ...detailData }
    
    // 加载相关数据
    await Promise.all([
      loadStudents(),
      loadFeeStats(),
      loadMaintenanceRecords()
    ])
    
  } catch (error: any) {
    console.error('❌ 加载寝室详情失败:', error)
    ElMessage.error('加载寝室详情失败')
  }
}

const loadDormitoryList = async () => {
  try {
    console.log('🔄 加载寝室列表')
    const response = await dormitoryApi.getDormitoryList()
    const listData = response?.data?.data || response?.data || []
    availableDormitories.value = listData
  } catch (error: any) {
    console.error('❌ 加载寝室列表失败:', error)
    ElMessage.error('加载寝室列表失败')
  }
}

const loadStudents = async () => {
  try {
    loading.value.students = true
    console.log('🔄 加载寝室成员')
    // 这里应该调用获取寝室成员的API
    // const response = await dormitoryApi.getDormitoryStudents(dormitoryId.value)
  } catch (error: any) {
    console.error('❌ 加载寝室成员失败:', error)
  } finally {
    loading.value.students = false
  }
}

const loadFeeStats = async () => {
  try {
    console.log('🔄 加载费用统计')
    // 这里应该调用获取费用统计的API
  } catch (error: any) {
    console.error('❌ 加载费用统计失败:', error)
  }
}

const loadMaintenanceRecords = async () => {
  try {
    console.log('🔄 加载维修记录')
    // 这里应该调用获取维修记录的API
  } catch (error: any) {
    console.error('❌ 加载维修记录失败:', error)
  }
}

// 返回寝室列表
const returnToDormitoryList = () => {
  console.log('⬅️ 返回寝室列表页面')
  router.push('/dormitory-detail')
}

// 选择寝室
const selectDormitory = (dormitory: any) => {
  console.log('🏠 选择寝室:', dormitory)
  router.push(`/dormitory-detail/${dormitory.id}`)
}

// 移除学生
const removeStudent = async (student: any) => {
  try {
    await ElMessageBox.confirm(`确定要将 ${student.name} 从寝室中移除吗？`, '确认移除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    console.log('🗑️ 移除学生:', student)
    ElMessage.success('移除成功')
    
  } catch {
    console.log('❌ 取消移除')
  }
}

// 提交编辑表单
const submitEditForm = async () => {
  try {
    loading.value.editForm = true
    console.log('📝 提交编辑表单:', editFormData.value)
    
    await dormitoryApi.updateDormitory(dormitoryId.value, editFormData.value)
    
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
    console.log('👥 添加成员:', addMemberForm.value)
    
    await dormitoryApi.addDormitoryMember(dormitoryId.value, addMemberForm.value.userId)
    
    ElMessage.success('添加成功')
    addMemberDialogVisible.value = false
    addMemberForm.value.userId = null
    
    // 重新加载成员列表
    loadStudents()
    
  } catch (error: any) {
    console.error('❌ 添加成员失败:', error)
    ElMessage.error('添加成员失败')
  } finally {
    loading.value.addMember = false
  }
}

// 工具函数
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    normal: 'success',
    maintenance: 'warning',
    full: 'info',
    frozen: 'danger',
    dissolved: 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    normal: '正常',
    maintenance: '维修中',
    full: '已满',
    frozen: '冻结',
    dissolved: '已解散'
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
</style>