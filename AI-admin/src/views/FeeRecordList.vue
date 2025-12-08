<template>
  <div class="fee-record-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费用记录列表</span>
          <el-button type="primary" @click="handleAdd">新增费用记录</el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="学生姓名">
            <el-input v-model="searchForm.studentName" placeholder="请输入学生姓名" clearable />
          </el-form-item>
          
          <el-form-item label="费用类型">
            <el-select v-model="searchForm.feeType" placeholder="请选择费用类型" clearable>
              <el-option label="住宿费" value="accommodation" />
              <el-option label="水电费" value="utilities" />
              <el-option label="网费" value="internet" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="缴费状态">
            <el-select v-model="searchForm.status" placeholder="请选择缴费状态" clearable>
              <el-option label="已缴费" value="paid" />
              <el-option label="未缴费" value="unpaid" />
              <el-option label="部分缴费" value="partial" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="审核状态">
            <el-select v-model="searchForm.auditStatus" placeholder="请选择审核状态" clearable>
              <el-option label="待审核" value="pending" />
              <el-option label="已审核" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 费用统计汇总 -->
      <div class="fee-stats-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stats-card">
              <el-statistic title="总费用金额" :value="feeStats.totalAmount" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stats-card">
              <el-statistic title="已缴费金额" :value="feeStats.paidAmount" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stats-card">
              <el-statistic title="待缴费金额" :value="feeStats.unpaidAmount" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stats-card">
              <el-statistic title="待审核记录" :value="feeStats.pendingCount" suffix="条" />
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 批量操作区域 -->
      <div class="batch-operations">
        <el-button 
          type="primary" 
          :disabled="selectedRows.length === 0"
          @click="batchApprove"
        >
          批量审核通过
        </el-button>
        <el-button 
          type="warning" 
          :disabled="selectedRows.length === 0"
          @click="batchReject"
        >
          批量审核拒绝
        </el-button>
        <el-button 
          type="success" 
          :disabled="selectedRows.length === 0"
          @click="batchMarkPaid"
        >
          批量标记已缴费
        </el-button>
        <span class="selection-info" v-if="selectedRows.length > 0">
          已选择 {{ selectedRows.length }} 条记录
        </span>
      </div>
      
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="studentName" label="学生姓名" />
        <el-table-column prop="studentId" label="学号" />
        <el-table-column prop="feeType" label="费用类型">
          <template #default="scope">
            {{ getFeeTypeText(scope.row.feeType) }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" />
        <el-table-column prop="dueDate" label="应缴日期" />
        <el-table-column prop="paymentDate" label="缴费日期" />
        <el-table-column prop="status" label="缴费状态">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditStatus" label="审核状态">
          <template #default="scope">
            <el-tag :type="getAuditStatusTagType(scope.row.auditStatus)">
              {{ getAuditStatusText(scope.row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 15, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学生姓名" prop="studentName">
              <el-input v-model="formData.studentName" placeholder="请输入学生姓名" />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="学号" prop="studentId">
              <el-input v-model="formData.studentId" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="费用类型" prop="feeType">
              <el-select v-model="formData.feeType" placeholder="请选择费用类型" style="width: 100%;">
                <el-option label="住宿费" value="accommodation" />
                <el-option label="水电费" value="utilities" />
                <el-option label="网费" value="internet" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="金额(元)" prop="amount">
              <el-input-number v-model="formData.amount" :min="0" :precision="2" :step="100" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="应缴日期" prop="dueDate">
              <el-date-picker
                v-model="formData.dueDate"
                type="date"
                placeholder="请选择应缴日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="缴费状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择缴费状态" style="width: 100%;">
                <el-option label="已缴费" value="paid" />
                <el-option label="未缴费" value="unpaid" />
                <el-option label="部分缴费" value="partial" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="缴费日期">
          <el-date-picker
            v-model="formData.paymentDate"
            type="date"
            placeholder="请选择缴费日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 路由相关
const router = useRouter()

// 响应式数据
const tableData = ref([
  {
    id: 1,
    studentName: '张三',
    studentId: '2023001',
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
    studentId: '2023002',
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
    studentId: '2023003',
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
    studentId: '2023004',
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
const selectedRows = ref([])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
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
  studentId: '',
  feeType: '',
  amount: 0,
  dueDate: '',
  paymentDate: '',
  status: 'unpaid',
  remark: ''
})

const formRules = {
  studentName: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  feeType: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  dueDate: [{ required: true, message: '请选择应缴日期', trigger: 'change' }]
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
    case 'other':
      return '其他'
    default:
      return '未知'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'paid':
      return 'success'
    case 'unpaid':
      return 'danger'
    case 'partial':
      return 'warning'
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
    default:
      return '未知'
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
    default:
      return 'info'
  }
}

// 获取审核状态文本
const getAuditStatusText = (status: string) => {
  switch (status) {
    case 'approved':
      return '已审核'
    case 'pending':
      return '待审核'
    case 'rejected':
      return '已拒绝'
    default:
      return '未知'
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
  ElMessage.success('重置搜索条件')
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
    studentId: '',
    feeType: '',
    amount: 0,
    dueDate: '',
    paymentDate: '',
    status: 'unpaid',
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
  
  // 初始化统计数据
  updateFeeStats()
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
</style>