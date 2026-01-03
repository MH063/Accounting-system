<template>
  <div class="dormitory-info-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>寝室信息</span>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button type="primary" @click="editDormitory">编辑信息</el-button>
          </div>
        </div>
      </template>
      
      <div class="dormitory-info">
        <!-- 寝室基本信息 -->
        <el-descriptions title="寝室基本信息" :column="2" border>
          <el-descriptions-item label="寝室名称">
            {{ dormitory.name }}
          </el-descriptions-item>
          <el-descriptions-item label="寝室类型">
            <el-tag :type="getTypeTagType(dormitory.type)">
              {{ getTypeText(dormitory.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="楼栋">
            {{ dormitory.building }}
          </el-descriptions-item>
          <el-descriptions-item label="房间号">
            {{ dormitory.roomNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="容量">
            {{ dormitory.capacity }} 人
          </el-descriptions-item>
          <el-descriptions-item label="当前入住">
            {{ dormitory.currentOccupancy }} 人
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(dormitory.status)">
              {{ getStatusText(dormitory.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(dormitory.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 寝室描述 -->
        <div class="section">
          <h3>寝室描述</h3>
          <p class="description">{{ dormitory.description || '暂无描述' }}</p>
        </div>
        
        <!-- 成员数量统计 -->
        <div class="section">
          <h3>成员数量统计</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24" color="#409EFF"><User /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ dormitory.currentOccupancy }}</div>
                  <div class="stat-label">总成员数</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24" color="#67C23A"><User /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ leaderCount }}</div>
                  <div class="stat-label">寝室长</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24" color="#E6A23C"><User /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ memberCount }}</div>
                  <div class="stat-label">普通成员</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24" color="#F56C6C"><User /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ guestCount }}</div>
                  <div class="stat-label">访客</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <!-- 成员列表 -->
        <div class="section">
          <h3>寝室成员 ({{ dormitory.currentOccupancy }})</h3>
          <el-table :data="dormitory.members" style="width: 100%">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="role" label="角色">
              <template #default="{ row }">
                <el-tag :type="getRoleTagType(row.role)">
                  {{ getRoleText(row.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="joinDate" label="入住时间">
              <template #default="{ row }">
                {{ formatDate(row.joinDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="联系电话" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small" 
                  link
                  @click="viewMemberDetail(row)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 费用统计概览 -->
        <div class="section">
          <h3>费用统计概览</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24" color="#409EFF"><Wallet /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">¥{{ formatCurrency(expenseStats.total) }}</div>
                  <div class="stat-label">总费用</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24" color="#67C23A"><Wallet /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">¥{{ formatCurrency(expenseStats.paid) }}</div>
                  <div class="stat-label">已支付</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24" color="#E6A23C"><Wallet /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">¥{{ formatCurrency(expenseStats.pending) }}</div>
                  <div class="stat-label">待支付</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon size="24" color="#F56C6C"><Wallet /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">¥{{ formatCurrency(expenseStats.overdue) }}</div>
                  <div class="stat-label">已逾期</div>
                </div>
              </div>
            </el-col>
          </el-row>
          
          <div class="recent-expenses">
            <h4>近期费用</h4>
            <el-table :data="recentExpenses" style="width: 100%">
              <el-table-column prop="title" label="费用名称" />
              <el-table-column prop="amount" label="金额">
                <template #default="{ row }">
                  ¥{{ formatCurrency(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="date" label="日期">
                <template #default="{ row }">
                  {{ formatDate(row.date) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :type="getExpenseStatusType(row.status)">
                    {{ getExpenseStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        
        <!-- 权限相关的操作按钮 -->
        <div class="section">
          <h3>操作</h3>
          <div class="actions">
            <el-button 
              type="primary" 
              @click="addMember"
            >
              添加成员
            </el-button>
            <el-button 
              type="warning" 
              @click="modifyRules"
            >
              修改寝室规则
            </el-button>
            <el-button 
              type="danger" 
              @click="dissolveDormitory"
            >
              解散寝室
            </el-button>
          </div>
        </div>
        
        <!-- 寝室二维码分享 -->
        <div class="section">
          <h3>寝室二维码</h3>
          <div class="qr-code-section">
            <div class="qr-code-container">
              <img :src="qrCodeUrl" alt="寝室二维码" class="qr-code" />
              <p class="qr-tip">扫描二维码加入寝室</p>
              <el-button @click="downloadQRCode">下载二维码</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑寝室信息"
      width="600px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="100px"
      >
        <el-form-item label="寝室名称" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        
        <el-form-item label="寝室描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDormitory">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Wallet } from '@element-plus/icons-vue'
import { dormitoryApi } from '@/api/dormitory'

// 路由实例
const router = useRouter()
const route = useRoute()

// 响应式数据
const editDialogVisible = ref(false)
const editFormRef = ref()

const loading = ref(false)
const dormitory = ref({
  id: 0,
  name: '',
  type: '',
  building: '',
  roomNumber: '',
  capacity: 0,
  currentOccupancy: 0,
  status: '',
  description: '',
  createdAt: '',
  members: [] as any[]
})

const editForm = reactive({
  name: '',
  description: ''
})

const editFormRules = {
  name: [
    { required: true, message: '请输入寝室名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ]
}

const expenseStats = ref({
  total: 0,
  paid: 0,
  pending: 0,
  overdue: 0
})

const recentExpenses = ref([] as any[])

const qrCodeUrl = ref('https://picsum.photos/200/200')

// 计算属性
const leaderCount = computed(() => {
  return dormitory.value.members.filter(member => member.role === 'leader').length
})

const memberCount = computed(() => {
  return dormitory.value.members.filter(member => member.role === 'member').length
})

const guestCount = computed(() => {
  return dormitory.value.members.filter(member => member.role === 'guest').length
})

// 加载寝室数据
const loadDormitoryData = async () => {
  const id = Number(route.params.id)
  if (!id) return
  
  try {
    loading.value = true
    console.log('🔄 加载寝室详情:', id)
    const response = await dormitoryApi.getDormitoryDetail(id)
    console.log('✅ 寝室详情响应:', response)
    
    // 兼容双层数据结构 (规则 5)
    const data = response?.data?.dorm || response?.dorm || response?.data || response
    
    if (data) {
      dormitory.value = {
        id: data.id,
        name: data.dormName || data.dorm_name,
        type: data.type || 'male',
        building: data.building,
        roomNumber: data.roomNumber || data.room_number,
        capacity: data.capacity,
        currentOccupancy: data.currentOccupancy || 0,
        status: data.status,
        description: data.description,
        createdAt: data.createdAt || data.created_at,
        members: (data.currentUsers || []).map((m: any) => ({
          id: m.id,
          name: m.nickname || m.username,
          role: m.memberRole || 'member',
          joinDate: m.moveInDate || m.joinedAt,
          phone: m.phone || '-'
        }))
      }
      
      // 更新费用统计
      if (data.expenseStats) {
        expenseStats.value = {
          total: data.expenseStats.totalAmount || 0,
          paid: data.expenseStats.paidAmount || 0,
          pending: data.expenseStats.pendingAmount || 0,
          overdue: 0 // 后端暂未返回
        }
      }
    }
  } catch (error: any) {
    console.error('❌ 加载寝室详情失败:', error)
    ElMessage.error('加载寝室详情失败')
  } finally {
    loading.value = false
  }
}

// 方法
const goBack = () => {
  router.back()
}

const editDormitory = () => {
  editForm.name = dormitory.value.name
  editForm.description = dormitory.value.description
  editDialogVisible.value = true
}

const saveDormitory = async () => {
  editFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        await dormitoryApi.updateDormitory(dormitory.value.id, {
          dormName: editForm.name,
          description: editForm.description
        })
        ElMessage.success('寝室信息更新成功')
        editDialogVisible.value = false
        loadDormitoryData()
      } catch (error: any) {
        console.error('❌ 更新寝室信息失败:', error)
        ElMessage.error('更新寝室信息失败')
      }
    } else {
      ElMessage.warning('请填写完整的寝室信息')
    }
  })
}

const getTypeTagType = (type: string) => {
  switch (type) {
    case 'male': return 'primary'
    case 'female': return 'danger'
    case 'mixed': return 'warning'
    default: return 'info'
  }
}

const getTypeText = (type: string) => {
  switch (type) {
    case 'male': return '男生寝室'
    case 'female': return '女生寝室'
    case 'mixed': return '混合寝室'
    default: return '未知'
  }
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'normal': return 'success'
    case 'maintenance': return 'warning'
    case 'full': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'normal': return '正常'
    case 'maintenance': return '维修中'
    case 'full': return '已满'
    default: return '未知'
  }
}

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

const getExpenseStatusType = (status: string) => {
  switch (status) {
    case 'paid': return 'success'
    case 'pending': return 'warning'
    case 'overdue': return 'danger'
    default: return 'info'
  }
}

const getExpenseStatusText = (status: string) => {
  switch (status) {
    case 'paid': return '已支付'
    case 'pending': return '待支付'
    case 'overdue': return '已逾期'
    default: return '未知'
  }
}

const formatCurrency = (amount: number | string): string => {
  // 处理可能不是数字的值
  const num = typeof amount === 'number' ? amount : parseFloat(amount)
  
  // 如果转换失败，返回默认值
  if (isNaN(num)) {
    return '0.00'
  }
  
  return num.toFixed(2)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const viewMemberDetail = (member: any) => {
  router.push(`/member/detail/${member.id}`)
}

const addMember = () => {
  ElMessage.info('跳转到添加成员页面')
}

const modifyRules = () => {
  ElMessage.info('跳转到修改寝室规则页面')
}

const dissolveDormitory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要解散该寝室吗？此操作不可恢复！',
      '解散寝室',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用实际的解散确认接口 (物理删除)
    const dormId = Number(route.params.id)
    console.log('🗑️ 解散寝室:', dormId)
    await dormitoryApi.confirmDismiss(dormId)
    
    ElMessage.success('寝室已成功解散并永久删除')
    router.push('/dormitory/list')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 解散寝室失败:', error)
      ElMessage.error(error.response?.data?.message || '解散寝室失败')
    }
  }
}

const downloadQRCode = () => {
  ElMessage.success('二维码已下载')
}

// 组件挂载时的操作
onMounted(() => {
  console.log('🏠 寝室信息页面加载完成', route.params.id)
  loadDormitoryData()
})
</script>

<style scoped>
.dormitory-info-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dormitory-info {
  padding: 20px 0;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.description {
  color: #606266;
  line-height: 1.6;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.stat-icon {
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.recent-expenses {
  margin-top: 20px;
}

.recent-expenses h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.qr-code-section {
  display: flex;
  justify-content: center;
}

.qr-code-container {
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

.qr-tip {
  color: #606266;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .stat-card {
    padding: 15px;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>