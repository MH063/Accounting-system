<template>
  <div class="expense-review-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费用审核</span>
          <div>
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </template>
      
      <!-- 待审核费用列表 -->
      <div class="pending-expenses">
        <h3>待审核费用 ({{ pendingExpenses.length }})</h3>
        
        <el-table 
          :data="pendingExpenses" 
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="title" label="费用标题" min-width="150" />
          <el-table-column prop="applicant" label="申请人" width="100" />
          <el-table-column prop="amount" label="金额" width="100" align="right">
            <template #default="{ row }">
              ¥{{ formatCurrency(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="date" label="费用日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.date) }}
            </template>
          </el-table-column>
          <el-table-column prop="category" label="类别" width="100">
            <template #default="{ row }">
              <el-tag :type="getCategoryType(row.category)">
                {{ getCategoryText(row.category) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="reviewExpense(row)"
              >
                审核
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 批量操作 -->
        <div class="batch-actions" v-if="selectedExpenses.length > 0">
          <el-alert
            :title="`已选择 ${selectedExpenses.length} 项费用`"
            type="info"
            :closable="false"
            class="selection-alert"
          />
          <div class="batch-buttons">
            <el-button 
              type="success" 
              @click="batchApprove"
              :loading="batchProcessing"
            >
              批量通过 ({{ selectedExpenses.length }})
            </el-button>
            <el-button 
              type="danger" 
              @click="batchReject"
              :loading="batchProcessing"
            >
              批量拒绝 ({{ selectedExpenses.length }})
            </el-button>
            <el-button @click="clearSelection">取消选择</el-button>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 费用审核详情对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="费用审核"
      width="600px"
      :before-close="handleDialogClose"
    >
      <div v-if="currentExpense" class="review-dialog">
        <el-descriptions title="费用信息" :column="1" border>
          <el-descriptions-item label="费用标题">
            {{ currentExpense.title }}
          </el-descriptions-item>
          <el-descriptions-item label="费用类别">
            <el-tag :type="getCategoryType(currentExpense.category)">
              {{ getCategoryText(currentExpense.category) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="费用金额">
            <span class="amount">¥{{ formatCurrency(currentExpense.amount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="费用日期">
            {{ formatDate(currentExpense.date) }}
          </el-descriptions-item>
          <el-descriptions-item label="申请人">
            {{ currentExpense.applicant }}
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ formatDateTime(currentExpense.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="section">
          <h4>费用说明</h4>
          <p class="description">{{ currentExpense.description }}</p>
        </div>
        
        <div class="section">
          <h4>参与成员分摊</h4>
          <el-table :data="currentExpense.participants" style="width: 100%">
            <el-table-column prop="name" label="成员" />
            <el-table-column prop="amount" label="分摊金额">
              <template #default="{ row }">
                ¥{{ formatCurrency(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="percentage" label="分摊比例">
              <template #default="{ row }">
                {{ row.percentage }}%
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div class="section" v-if="currentExpense.attachments && currentExpense.attachments.length > 0">
          <h4>附件</h4>
          <div class="attachments">
            <el-card 
              v-for="attachment in currentExpense.attachments" 
              :key="attachment.id"
              class="attachment-card"
            >
              <div class="attachment-content">
                <el-icon class="attachment-icon"><Document /></el-icon>
                <div class="attachment-info">
                  <div class="attachment-name">{{ attachment.name }}</div>
                  <div class="attachment-size">{{ formatFileSize(attachment.size) }}</div>
                </div>
                <el-button 
                  type="primary" 
                  link
                  @click="downloadAttachment(attachment)"
                >
                  下载
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
        
        <div class="section">
          <h4>审核意见</h4>
          <el-radio-group v-model="reviewResult" class="review-result">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">拒绝</el-radio>
          </el-radio-group>
          
          <el-input
            v-if="reviewResult === 'rejected'"
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因"
            class="reject-reason"
          />
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitReview"
            :loading="submittingReview"
          >
            提交审核
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'

// 路由实例
const router = useRouter()

// 响应式数据
const pendingExpenses = ref([
  {
    id: 1,
    title: '10月份电费分摊',
    description: '10月份宿舍电费分摊费用，共使用300度电，单价0.8元/度',
    amount: 240,
    category: 'utilities',
    applicant: '张三',
    date: '2023-10-15',
    createdAt: '2023-10-15T09:15:00Z',
    participants: [
      { id: 1, name: '张三', amount: 60, percentage: 25 },
      { id: 2, name: '李四', amount: 60, percentage: 25 },
      { id: 3, name: '王五', amount: 60, percentage: 25 },
      { id: 4, name: '赵六', amount: 60, percentage: 25 }
    ],
    attachments: [
      { id: 1, name: '电费账单.pdf', size: 102400 },
      { id: 2, name: '用电明细.xlsx', size: 51200 }
    ]
  },
  {
    id: 2,
    title: '寝室清洁用品采购',
    description: '购买清洁用品：拖把、扫帚、清洁剂等',
    amount: 85,
    category: 'cleaning',
    applicant: '王五',
    date: '2023-10-10',
    createdAt: '2023-10-10T14:20:00Z',
    participants: [
      { id: 1, name: '张三', amount: 21.25, percentage: 25 },
      { id: 2, name: '李四', amount: 21.25, percentage: 25 },
      { id: 3, name: '王五', amount: 21.25, percentage: 25 },
      { id: 4, name: '赵六', amount: 21.25, percentage: 25 }
    ],
    attachments: []
  },
  {
    id: 3,
    title: '网费分摊',
    description: '10月份网费分摊',
    amount: 50,
    category: 'other',
    applicant: '赵六',
    date: '2023-10-05',
    createdAt: '2023-10-05T09:15:00Z',
    participants: [
      { id: 1, name: '张三', amount: 12.5, percentage: 25 },
      { id: 2, name: '李四', amount: 12.5, percentage: 25 },
      { id: 3, name: '王五', amount: 12.5, percentage: 25 },
      { id: 4, name: '赵六', amount: 12.5, percentage: 25 }
    ],
    attachments: []
  }
])

const selectedExpenses = ref<any[]>([])
const batchProcessing = ref(false)

const reviewDialogVisible = ref(false)
const currentExpense = ref<any>(null)
const reviewResult = ref('approved')
const rejectReason = ref('')
const submittingReview = ref(false)

// 方法
const goBack = () => {
  router.back()
}

const handleSelectionChange = (selection: any[]) => {
  selectedExpenses.value = selection
}

const clearSelection = () => {
  selectedExpenses.value = []
}

const reviewExpense = (expense: any) => {
  currentExpense.value = expense
  reviewResult.value = 'approved'
  rejectReason.value = ''
  reviewDialogVisible.value = true
}

const handleDialogClose = (done: () => void) => {
  ElMessageBox.confirm('确定要关闭审核对话框吗？未保存的更改将会丢失')
    .then(() => {
      done()
    })
    .catch(() => {
      // 用户取消关闭
    })
}

const submitReview = async () => {
  if (reviewResult.value === 'rejected' && !rejectReason.value.trim()) {
    ElMessage.warning('拒绝时必须填写拒绝原因')
    return
  }
  
  submittingReview.value = true
  
  try {
    // 模拟提交审核
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新费用状态
    const index = pendingExpenses.value.findIndex(e => e.id === currentExpense.value.id)
    if (index !== -1) {
      pendingExpenses.value.splice(index, 1)
    }
    
    ElMessage.success(`费用审核已提交，结果：${reviewResult.value === 'approved' ? '通过' : '拒绝'}`)
    reviewDialogVisible.value = false
  } catch (error) {
    ElMessage.error('审核提交失败')
  } finally {
    submittingReview.value = false
  }
}

const batchApprove = async () => {
  if (selectedExpenses.value.length === 0) {
    ElMessage.warning('请至少选择一项费用')
    return
  }
  
  try {
    batchProcessing.value = true
    
    // 模拟批量通过
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 从待审核列表中移除
    selectedExpenses.value.forEach(expense => {
      const index = pendingExpenses.value.findIndex(e => e.id === expense.id)
      if (index !== -1) {
        pendingExpenses.value.splice(index, 1)
      }
    })
    
    ElMessage.success(`批量审核通过 ${selectedExpenses.value.length} 项费用`)
    selectedExpenses.value = []
  } catch (error) {
    ElMessage.error('批量审核失败')
  } finally {
    batchProcessing.value = false
  }
}

const batchReject = async () => {
  if (selectedExpenses.value.length === 0) {
    ElMessage.warning('请至少选择一项费用')
    return
  }
  
  try {
    batchProcessing.value = true
    
    // 模拟批量拒绝
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 从待审核列表中移除
    selectedExpenses.value.forEach(expense => {
      const index = pendingExpenses.value.findIndex(e => e.id === expense.id)
      if (index !== -1) {
        pendingExpenses.value.splice(index, 1)
      }
    })
    
    ElMessage.success(`批量拒绝 ${selectedExpenses.value.length} 项费用`)
    selectedExpenses.value = []
  } catch (error) {
    ElMessage.error('批量拒绝失败')
  } finally {
    batchProcessing.value = false
  }
}

const formatCurrency = (amount: number): string => {
  return amount.toFixed(2)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1048576).toFixed(2) + ' MB'
}

const getCategoryType = (category: string) => {
  switch (category) {
    case 'accommodation': return 'primary'
    case 'utilities': return 'success'
    case 'maintenance': return 'warning'
    case 'cleaning': return 'info'
    case 'other': return ''
    default: return 'info'
  }
}

const getCategoryText = (category: string) => {
  switch (category) {
    case 'accommodation': return '住宿费'
    case 'utilities': return '水电费'
    case 'maintenance': return '维修费'
    case 'cleaning': return '清洁费'
    case 'other': return '其他'
    default: return '未知'
  }
}

const downloadAttachment = (attachment: any) => {
  ElMessage.info(`下载附件: ${attachment.name}`)
}

// 组件挂载时的操作
onMounted(() => {
  console.log('🔍 费用审核页面加载完成')
})
</script>

<style scoped>
.expense-review-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pending-expenses h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
}

.batch-actions {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.selection-alert {
  margin-bottom: 15px;
}

.batch-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.review-dialog {
  padding: 10px 0;
}

.amount {
  font-size: 18px;
  font-weight: 700;
  color: #f56c6c;
}

.section {
  margin: 20px 0;
}

.section h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
}

.description {
  color: #606266;
  line-height: 1.6;
}

.review-result {
  margin-bottom: 15px;
}

.reject-reason {
  margin-top: 10px;
}

.attachments {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.attachment-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.attachment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.attachment-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.attachment-icon {
  font-size: 32px;
  color: #409eff;
}

.attachment-info {
  flex: 1;
}

.attachment-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.attachment-size {
  font-size: 12px;
  color: #909399;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .attachments {
    grid-template-columns: 1fr;
  }
  
  .batch-buttons {
    flex-direction: column;
  }
}
</style>