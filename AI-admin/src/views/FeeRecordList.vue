<template>
  <div class="fee-record-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费用记录列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleAdd">
              <el-icon v-if="isMobile"><Plus /></el-icon>
              <span v-if="!isMobile">新增费用记录</span>
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" :label-width="isMobile ? '80px' : '80px'" :inline="!isMobile" class="responsive-search-form">
          <el-row :gutter="isMobile ? 10 : 20">
            <el-col :xs="24" :sm="6">
              <el-form-item label="学生姓名">
                <el-input v-model="searchForm.studentName" placeholder="请输入姓名" clearable />
              </el-form-item>
            </el-col>
            
            <template v-if="!isMobile || showMoreFilters">
              <el-col :xs="12" :sm="6">
                <el-form-item label="费用类型">
                  <el-select v-model="searchForm.feeType" placeholder="类型" clearable style="width: 100%;">
                    <el-option label="住宿费" value="accommodation" />
                    <el-option label="水电费" value="utilities" />
                    <el-option label="网费" value="internet" />
                    <el-option label="维修费" value="maintenance" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>
              </el-col>
              
              <el-col :xs="12" :sm="6">
                <el-form-item label="缴费状态">
                  <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 100%;">
                    <el-option label="已缴费" value="paid" />
                    <el-option label="未缴费" value="unpaid" />
                    <el-option label="待审核" value="pending" />
                  </el-select>
                </el-form-item>
              </el-col>
              
              <el-col :xs="24" :sm="6" v-if="!isMobile">
                <el-form-item label="时间范围">
                  <el-date-picker
                    v-model="searchForm.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始"
                    end-placeholder="结束"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%;"
                  />
                </el-form-item>
              </el-col>
            </template>
            
            <el-col :xs="24" :sm="6" class="search-btn-col">
              <div class="search-actions">
                <el-button type="primary" @click="handleSearch" :icon="Search" :class="{ 'flex-1': isMobile }">
                  {{ isMobile ? '查询' : '查询' }}
                </el-button>
                <el-button @click="handleReset" :icon="Refresh" :class="{ 'flex-1': isMobile }">
                  {{ isMobile ? '重置' : '重置' }}
                </el-button>
                <el-button 
                  v-if="isMobile" 
                  type="primary" 
                  link 
                  @click="showMoreFilters = !showMoreFilters"
                >
                  {{ showMoreFilters ? '收起' : '更多' }}
                  <el-icon class="el-icon--right">
                    <component :is="showMoreFilters ? 'ArrowUp' : 'ArrowDown'" />
                  </el-icon>
                </el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
      
      <!-- 费用统计汇总 -->
      <div class="fee-stats-container">
        <el-row :gutter="isMobile ? 10 : 20">
          <el-col :xs="12" :sm="6">
            <el-card class="stats-card" shadow="hover">
              <el-statistic title="总费用" :value="feeStats.totalAmount" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-card class="stats-card" shadow="hover">
              <el-statistic title="已缴费" :value="feeStats.paidAmount" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="6" :class="{ 'mt-10': isMobile }">
            <el-card class="stats-card" shadow="hover">
              <el-statistic title="待缴费" :value="feeStats.unpaidAmount" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="6" :class="{ 'mt-10': isMobile }">
            <el-card class="stats-card" shadow="hover">
              <el-statistic title="待审核" :value="feeStats.pendingCount" suffix="条" />
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 批量操作区域 -->
      <div class="batch-operations" :class="{ 'mobile-batch': isMobile }">
        <el-button-group :class="{ 'w-100': isMobile }">
          <el-button 
            type="primary" 
            size="small"
            :disabled="selectedRows.length === 0"
            @click="batchApprove"
          >
            {{ isMobile ? '审核' : '批量审核' }}
          </el-button>
          <el-button 
            type="success" 
            size="small"
            :disabled="selectedRows.length === 0"
            @click="batchMarkPaid"
          >
            {{ isMobile ? '缴费' : '批量已缴' }}
          </el-button>
        </el-button-group>
        <span class="selection-info" v-if="selectedRows.length > 0">
          已选 {{ selectedRows.length }}
        </span>
      </div>
      
      <div class="table-container scrollbar-hide">
        <el-table 
          :data="tableData" 
          style="width: 100%" 
          v-loading="loading"
          @selection-change="handleSelectionChange"
          :size="isMobile ? 'small' : 'default'"
        >
          <el-table-column type="selection" width="40" fixed />
          <el-table-column prop="studentName" label="姓名" min-width="90" fixed />
          <el-table-column prop="feeType" label="类型" min-width="90">
            <template #default="scope">
              {{ getFeeTypeText(scope.row.feeType) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" min-width="90" />
          <el-table-column prop="status" label="状态" min-width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" :width="isMobile ? 120 : 180" fixed="right">
            <template #default="scope">
              <el-button size="small" link type="primary" @click="handleView(scope.row)">
                {{ isMobile ? '看' : '查看' }}
              </el-button>
              <el-button size="small" link type="primary" @click="handleEdit(scope.row)">
                {{ isMobile ? '改' : '编辑' }}
              </el-button>
              <el-button size="small" link type="danger" @click="handleDelete(scope.row)">
                {{ isMobile ? '删' : '删除' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :pager-count="isMobile ? 5 : 7"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      :width="isMobile ? '95%' : '600px'"
      :fullscreen="isMobile"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" :label-width="isMobile ? '80px' : '100px'">
        <el-form-item label="学生姓名" prop="studentName">
          <el-input v-model="formData.studentName" placeholder="请输入学生姓名" />
        </el-form-item>
        
        <el-row :gutter="isMobile ? 10 : 20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="费用类型" prop="feeType">
              <el-select v-model="formData.feeType" placeholder="请选择" style="width: 100%;">
                <el-option label="住宿费" value="accommodation" />
                <el-option label="水电费" value="utilities" />
                <el-option label="网费" value="internet" />
                <el-option label="维修费" value="maintenance" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12">
            <el-form-item label="金额(元)" prop="amount">
              <el-input-number v-model="formData.amount" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="isMobile ? 10 : 20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="应缴日期" prop="dueDate">
              <el-date-picker
                v-model="formData.dueDate"
                type="date"
                placeholder="请选择"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12">
            <el-form-item label="缴费状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择" style="width: 100%;">
                <el-option label="已缴费" value="paid" />
                <el-option label="未缴费" value="unpaid" />
                <el-option label="待审核" value="pending" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="缴费日期">
          <el-date-picker
            v-model="formData.paymentDate"
            type="date"
            placeholder="请选择"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, ArrowDown, ArrowUp } from '@element-plus/icons-vue'

// 导入统一验证规则库
import { commonRules } from '@/utils/validationRules'

// 移动端适配
const isMobile = ref(false)
const showMoreFilters = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 路由相关
const router = useRouter()

// 响应式数据
const tableData = ref([
  {
    id: 1,
    studentName: '张三',
    feeType: 'accommodation',
    amount: 1200.00,
    dueDate: '2023-09-30',
    paymentDate: '2023-09-25',
    status: 'paid',
    auditStatus: 'approved',
    remark: '按时缴费'
  },
  {
    id: 2,
    studentName: '李四',
    feeType: 'utilities',
    amount: 150.50,
    dueDate: '2023-10-15',
    paymentDate: null,
    status: 'unpaid',
    auditStatus: 'pending',
    remark: ''
  },
  {
    id: 3,
    studentName: '王五',
    feeType: 'internet',
    amount: 80.00,
    dueDate: '2023-10-10',
    paymentDate: '2023-10-08',
    status: 'paid',
    auditStatus: 'approved',
    remark: '提前缴费'
  },
  {
    id: 4,
    studentName: '赵六',
    feeType: 'accommodation',
    amount: 1200.00,
    dueDate: '2023-10-20',
    paymentDate: null,
    status: 'unpaid',
    auditStatus: 'rejected',
    remark: '申请被拒绝'
  }
])

// 费用统计数据
const feeStats = ref({
  totalAmount: 2630.50,
  paidAmount: 1280.00,
  unpaidAmount: 1350.50,
  pendingCount: 1
})

// 选中的行数据
const selectedRows = ref<any[]>([])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10) // 按照分页设置规范，默认值为10
const total = ref(100)

const searchForm = ref({
  studentName: '',
  feeType: '',
  status: '',
  auditStatus: '',
  dateRange: []
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const formData = ref({
  id: 0,
  studentName: '',
  feeType: '',
  amount: 0,
  dueDate: '',
  paymentDate: '',
  status: 'unpaid',
  auditStatus: 'pending',
  remark: ''
})

const formRules = {
  studentName: commonRules.name,
  feeType: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  dueDate: [{ required: true, message: '请选择应缴日期', trigger: 'change' }],
  status: [{ required: true, message: '请选择缴费状态', trigger: 'change' }]
}

const formRef = ref()

// 获取费用类型文本
const getFeeTypeText = (type: string) => {
  switch (type) {
    case 'accommodation':
      return '住宿费'
    case 'utilities':
      return '水电费'
    case 'internet':
      return '网费'
    case 'maintenance':
      return '维修费'
    case 'cleaning':
      return '清洁费'
    case 'rent':
      return '房租'
    case 'activities':
      return '活动费用'
    case 'supplies':
      return '日用品'
    case 'food':
      return '食品饮料'
    case 'insurance':
      return '保险费用'
    case 'other':
      return '其他'
    default:
      return type || '未知'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'paid':
    case 'approved':
      return 'success'
    case 'unpaid':
    case 'rejected':
      return 'danger'
    case 'partial':
    case 'pending':
      return 'warning'
    case 'draft':
      return 'info'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return '已缴费'
    case 'unpaid':
      return '未缴费'
    case 'partial':
      return '部分缴费'
    case 'pending':
      return '待审核'
    case 'approved':
      return '审核通过'
    case 'rejected':
      return '审核拒绝'
    case 'draft':
      return '草稿'
    default:
      return status || '未知'
  }
}

// 获取审核状态标签类型
const getAuditStatusTagType = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'danger'
    case 'draft':
      return 'info'
    default:
      return 'info'
  }
}

// 获取审核状态文本
const getAuditStatusText = (status: string) => {
  switch (status) {
    case 'approved':
      return '审核通过'
    case 'pending':
      return '待审核'
    case 'rejected':
      return '审核拒绝'
    case 'draft':
      return '草稿'
    default:
      return status || '未知'
  }
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索费用记录:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    studentName: '',
    feeType: '',
    status: '',
    auditStatus: '',
    dateRange: []
  }
  // 清除表单验证状态
  const form = document.querySelector('.search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

// 查看详情
const handleView = (row: any) => {
  console.log('👁️ 查看费用详情:', row)
  router.push(`/fee-detail/${row.id}`)
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增费用记录'
  isEdit.value = false
  formData.value = {
    id: 0,
    studentName: '',
    feeType: '',
    amount: 0,
    dueDate: '',
    paymentDate: '',
    status: 'unpaid',
    auditStatus: 'pending',
    remark: ''
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑费用记录'
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除费用记录 "${row.studentName} - ${getFeeTypeText(row.feeType)}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🗑️ 删除费用记录:', row.id)
    ElMessage.success('费用记录删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除费用记录失败:', error)
      ElMessage.error('删除费用记录失败')
    }
  }
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        console.log('✏️ 编辑费用记录:', formData.value)
        ElMessage.success('费用记录编辑成功')
      } else {
        console.log('➕ 新增费用记录:', formData.value)
        ElMessage.success('费用记录新增成功')
      }
      dialogVisible.value = false
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  console.log(`📈 每页显示 ${val} 条`)
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  console.log(`📄 当前页: ${val}`)
}

// 表格选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
  console.log('📋 表格选择变化:', selection)
}

// 批量审核通过
const batchApprove = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要审核通过选中的 ${selectedRows.value.length} 条费用记录吗？`,
      '批量审核通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('✅ 批量审核通过:', selectedRows.value)
    
    // 更新表格中的审核状态
    selectedRows.value.forEach(row => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        tableData.value[index].auditStatus = 'approved'
      }
    })
    
    // 清空选择
    selectedRows.value = []
    
    // 更新统计
    updateFeeStats()
    
    ElMessage.success('批量审核通过成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 批量审核通过失败:', error)
      ElMessage.error('批量审核通过失败')
    }
  }
}

// 批量审核拒绝
const batchReject = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要审核拒绝选中的 ${selectedRows.value.length} 条费用记录吗？`,
      '批量审核拒绝',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('❌ 批量审核拒绝:', selectedRows.value)
    
    // 更新表格中的审核状态
    selectedRows.value.forEach(row => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        tableData.value[index].auditStatus = 'rejected'
      }
    })
    
    // 清空选择
    selectedRows.value = []
    
    // 更新统计
    updateFeeStats()
    
    ElMessage.success('批量审核拒绝成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 批量审核拒绝失败:', error)
      ElMessage.error('批量审核拒绝失败')
    }
  }
}

// 批量标记已缴费
const batchMarkPaid = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedRows.value.length} 条费用记录标记为已缴费吗？`,
      '批量标记已缴费',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('💰 批量标记已缴费:', selectedRows.value)
    
    // 更新表格中的缴费状态
    selectedRows.value.forEach(row => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        tableData.value[index].status = 'paid'
        tableData.value[index].paymentDate = new Date().toISOString().split('T')[0]
      }
    })
    
    // 清空选择
    selectedRows.value = []
    
    // 更新统计
    updateFeeStats()
    
    ElMessage.success('批量标记已缴费成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 批量标记已缴费失败:', error)
      ElMessage.error('批量标记已缴费失败')
    }
  }
}

// 更新费用统计
const updateFeeStats = () => {
  const totalAmount = tableData.value.reduce((sum, item) => sum + item.amount, 0)
  const paidAmount = tableData.value
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + item.amount, 0)
  const unpaidAmount = totalAmount - paidAmount
  const pendingCount = tableData.value.filter(item => item.auditStatus === 'pending').length
  
  feeStats.value = {
    totalAmount,
    paidAmount,
    unpaidAmount,
    pendingCount
  }
  
  console.log('📊 更新费用统计:', feeStats.value)
}

// 组件挂载
onMounted(() => {
  console.log('💰 费用记录列表页面加载完成')
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // 初始化统计数据
  updateFeeStats()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

/**
 * 费用记录列表页面
 * 展示费用记录信息列表和操作功能
 */
</script>

<style scoped>
.fee-record-list-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
}

.search-actions {
  display: flex;
  gap: 10px;
}

.fee-stats-container {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.batch-operations {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.selection-info {
  margin-left: 10px;
  color: #606266;
  font-size: 14px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.mt-10 {
  margin-top: 10px;
}

.w-100 {
  width: 100%;
}

.flex-1 {
  flex: 1;
}

.table-container {
  margin-top: 10px;
  overflow-x: auto;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: row;
    align-items: center;
  }
  
  .search-actions {
    margin-top: 10px;
    width: 100%;
  }
  
  .mobile-batch {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .mobile-batch .selection-info {
    margin-left: 0;
    margin-top: 5px;
  }
}
</style>