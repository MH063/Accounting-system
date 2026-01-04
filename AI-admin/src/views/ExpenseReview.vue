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
          ref="multipleTableRef"
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
        
        <!-- 分页 -->
        <div class="pagination-container" v-if="total > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
        
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
              批量审核通过 ({{ selectedExpenses.length }})
            </el-button>
            <el-button 
              type="danger" 
              @click="batchReject"
              :loading="batchProcessing"
            >
              批量审核拒绝 ({{ selectedExpenses.length }})
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { feeApi } from '@/api/fee'

// 路由实例
const router = useRouter()
const route = useRoute()

// 从路由参数获取费用ID
const routeId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

// 表格实例引用
const multipleTableRef = ref()

// 监听路由 ID 变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    const id = Number(newId)
    const target = pendingExpenses.value.find(e => e.id === id)
    if (target) {
      reviewExpense(target)
    } else {
      loadSpecificExpense(id)
    }
  }
})

// 响应式数据 - 初始化为空数组，通过API获取真实数据
const pendingExpenses = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

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

// 获取待审核列表
const fetchPendingExpenses = async () => {
  loading.value = true
  console.log(`🔄 获取待审核费用列表 (第 ${currentPage.value} 页, 每页 ${pageSize.value} 条)...`)
  try {
    const response = await feeApi.getPendingExpenses({
      page: currentPage.value,
      size: pageSize.value
    })
    // 根据规则 5 和拦截器配置处理嵌套结构
    // 拦截器已处理外层 {success, data}，这里 response 为内层 data
    const data = response
    
    if (Array.isArray(data)) {
      pendingExpenses.value = data
      total.value = data.length // 如果后端没返回 total，回退到数组长度
      
      // 如果路由中有 ID，尝试自动打开对应的审核对话框
      if (routeId.value) {
        const target = pendingExpenses.value.find(e => e.id === routeId.value)
        if (target) {
          reviewExpense(target)
        } else {
          // 如果在待审核列表中找不到，可能已经审核过或者不存在，尝试直接获取详情
          loadSpecificExpense(routeId.value)
        }
      }
    } else if (data && typeof data === 'object') {
      // 兼容后端返回的分页或包装结构: { data, list, items, total, ... }
      const list = data.data || data.list || data.items
      if (Array.isArray(list)) {
        pendingExpenses.value = list
        total.value = data.total || list.length
        
        if (routeId.value) {
          const target = pendingExpenses.value.find(e => e.id === routeId.value)
          if (target) {
            reviewExpense(target)
          } else {
            loadSpecificExpense(routeId.value)
          }
        }
      } else {
        console.warn('⚠️ 获取待审核费用返回数据格式不正确:', data)
        pendingExpenses.value = []
        total.value = 0
      }
    } else {
      console.warn('⚠️ 获取待审核费用返回数据格式不正确:', data)
      pendingExpenses.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取待审核费用失败:', error)
    ElMessage.error('获取待审核费用失败')
  } finally {
    loading.value = false
  }
}

// 分页处理方法
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchPendingExpenses()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchPendingExpenses()
}

// 加载特定费用详情
const loadSpecificExpense = async (id: number) => {
  console.log(`🔄 加载特定费用详情: ${id}`)
  try {
    const response = await feeApi.getExpenseDetail(id)
    const data = response
    
    if (data) {
      // 如果状态不是待审核，提示用户
      if (data.status !== 'pending' && data.status !== 'waiting') {
        ElMessage.info(`该费用状态为 ${data.status}，无需审核`)
        return
      }
      reviewExpense(data)
    }
  } catch (error) {
    console.error('获取费用详情失败:', error)
  }
}

const handleSelectionChange = (selection: any[]) => {
  selectedExpenses.value = selection
}

const clearSelection = () => {
  if (multipleTableRef.value) {
    multipleTableRef.value.clearSelection()
  }
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
    const status = reviewResult.value === 'approved' ? 'approved' : 'rejected'
    const response = await feeApi.reviewExpense(currentExpense.value.id, {
      status,
      comment: rejectReason.value
    })
    
    // 根据规则 5 和拦截器配置处理嵌套结构
    // 拦截器已处理外层 {success, data}，这里 response 为内层 data
    const data = response
    
    // 拦截器已经处理了 success 检查，如果能执行到这里说明是成功的
    if (response) {
      // 从待审核列表中移除
      const index = pendingExpenses.value.findIndex(e => e.id === currentExpense.value.id)
      if (index !== -1) {
        pendingExpenses.value.splice(index, 1)
      }
      
      ElMessage.success(`费用审核已提交，结果：${reviewResult.value === 'approved' ? '审核通过' : '审核拒绝'}`)
      reviewDialogVisible.value = false
      
      // 如果是通过路由进入的，审核完后可以考虑返回
      if (routeId.value) {
        setTimeout(() => router.push('/expense-management'), 1500)
      }
    } else {
      ElMessage.error('审核提交失败')
    }
  } catch (error) {
    console.error('审核提交失败:', error)
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
    await ElMessageBox.confirm(`确定要批量审核通过这 ${selectedExpenses.value.length} 项费用吗？`, '批量审核', {
      type: 'warning'
    })
    
    batchProcessing.value = true
    const ids = selectedExpenses.value.map(e => e.id)
    const response = await feeApi.batchApproveExpenses(ids)
    
    // 拦截器已经处理了 success 检查
    if (response) {
      // 从待审核列表中移除
      selectedExpenses.value.forEach(expense => {
        const index = pendingExpenses.value.findIndex(e => e.id === expense.id)
        if (index !== -1) {
          pendingExpenses.value.splice(index, 1)
        }
      })
      
      ElMessage.success(`成功批量审核通过 ${selectedExpenses.value.length} 项费用`)
      selectedExpenses.value = []
      selectedExpenses.value = []
    } else {
      ElMessage.error('批量审核失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审核失败:', error)
      ElMessage.error('批量审核失败')
    }
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
    const { value: reason } = await ElMessageBox.prompt('请输入批量拒绝的原因', '批量拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '拒绝原因',
      inputValidator: (value) => {
        if (!value) return '拒绝原因不能为空'
        return true
      }
    })
    
    batchProcessing.value = true
    const ids = selectedExpenses.value.map(e => e.id)
    const response = await feeApi.batchRejectExpenses(ids, reason)
    
    // 拦截器已经处理了 success 检查
    if (response) {
      // 从待审核列表中移除
      selectedExpenses.value.forEach(expense => {
        const index = pendingExpenses.value.findIndex(e => e.id === expense.id)
        if (index !== -1) {
          pendingExpenses.value.splice(index, 1)
        }
      })
      
      ElMessage.success(`成功批量审核拒绝 ${selectedExpenses.value.length} 项费用`)
      selectedExpenses.value = []
    } else {
      ElMessage.error('批量拒绝失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量拒绝失败:', error)
      ElMessage.error('批量拒绝失败')
    }
  } finally {
    batchProcessing.value = false
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

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1048576).toFixed(2) + ' MB'
}

const getCategoryType = (category: string) => {
  if (!category) return 'info'
  
  switch (category) {
    case 'accommodation':
    case 'rent': 
      return 'primary'
    case 'utilities': 
      return 'success'
    case 'maintenance': 
      return 'warning'
    case 'cleaning': 
      return 'info'
    case 'food':
      return 'danger'
    case 'activities':
      return 'warning'
    case 'insurance':
      return 'success'
    case 'other': 
    case 'supplies':
      return 'info'
    default: return 'info'
  }
}

const getCategoryText = (category: string) => {
  if (!category) return '未知'
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(category)) return category
  
  switch (category) {
    case 'accommodation': return '住宿费'
    case 'utilities': return '水电费'
    case 'maintenance': return '维修费'
    case 'cleaning': return '清洁费'
    case 'rent': return '房租'
    case 'food': return '食品饮料'
    case 'supplies': return '日用品'
    case 'activities': return '活动费用'
    case 'insurance': return '保险费用'
    case 'other': return '其他'
    default: return category || '未知'
  }
}

const downloadAttachment = (attachment: any) => {
  ElMessage.info(`下载附件: ${attachment.name}`)
}

// 组件挂载时的操作
onMounted(async () => {
  console.log('🔍 费用审核页面加载完成')
  await fetchPendingExpenses()
  
  // 如果 URL 中有 ID，直接打开该费用的审核对话框
  if (route.params.id) {
    const id = Number(route.params.id)
    const target = pendingExpenses.value.find(e => e.id === id)
    if (target) {
      reviewExpense(target)
    } else {
      loadSpecificExpense(id)
    }
  }
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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