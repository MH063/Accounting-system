<template>
  <div class="expense-detail-container" :class="{ 'is-mobile': isMobile }">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <span>费用详情</span>
            <el-tag :type="getStatusType(expense.status)" size="small" round>
              {{ getStatusText(expense.status) }}
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button @click="goBack" :size="isMobile ? 'small' : 'default'">返回</el-button>
            <el-button 
              v-if="expense.status === 'pending'" 
              type="warning" 
              @click="reviewExpense"
              :size="isMobile ? 'small' : 'default'"
            >
              审核
            </el-button>
            <el-button 
              v-if="expense.status === 'approved'" 
              type="success" 
              @click="payExpense"
              :size="isMobile ? 'small' : 'default'"
            >
              支付
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="expense-detail-body">
        <!-- 费用基本信息 -->
        <el-descriptions 
          title="费用基本信息" 
          :column="isMobile ? 1 : 2" 
          border
          size="small"
        >
          <el-descriptions-item label="费用标题" :span="isMobile ? 1 : 2">
            {{ expense.title }}
          </el-descriptions-item>
          <el-descriptions-item label="费用类别">
            <el-tag :type="getCategoryType(expense.category)" size="small">
              {{ getCategoryText(expense.category) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="费用金额">
            <span class="amount">¥{{ formatCurrency(expense.amount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="费用日期">
            {{ formatDate(expense.date) }}
          </el-descriptions-item>
          <el-descriptions-item label="申请人">
            {{ expense.applicant }}
          </el-descriptions-item>
          <el-descriptions-item label="申请时间" :span="isMobile ? 1 : 2">
            {{ formatDateTime(expense.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(expense.status)" size="small">
              <el-icon :size="12" style="margin-right: 4px; vertical-align: middle;">
                <component :is="getStatusIcon(expense.status)" />
              </el-icon>
              {{ getStatusText(expense.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核人" v-if="expense.reviewer">
            {{ expense.reviewer }}
          </el-descriptions-item>
          <el-descriptions-item label="审核时间" v-if="expense.reviewDate" :span="isMobile ? 1 : 2">
            {{ formatDateTime(expense.reviewDate) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 费用说明 -->
        <div class="section">
          <h3 class="section-title">费用说明</h3>
          <div class="description-box">{{ expense.description || '无详细说明' }}</div>
        </div>
        
        <!-- 参与成员分摊详情 -->
        <div class="section">
          <h3 class="section-title">分摊详情</h3>
          <div class="table-responsive-container">
            <el-table :data="expense.participants" style="width: 100%" size="small" border stripe>
              <el-table-column prop="name" label="成员" min-width="90" />
              <el-table-column prop="amount" label="分摊金额" width="100" align="right">
                <template #default="{ row }">
                  ¥{{ formatCurrency(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="percentage" label="比例" width="70" align="center">
                <template #default="{ row }">
                  {{ row.percentage }}%
                </template>
              </el-table-column>
              <el-table-column prop="status" label="支付状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getPaymentStatusType(row.paymentStatus)" size="small">
                    {{ getPaymentStatusText(row.paymentStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        
        <!-- 状态流转历史 -->
        <div class="section">
          <h3 class="section-title">状态流转历史</h3>
          <div class="timeline-container">
            <el-timeline>
              <el-timeline-item
                v-for="history in statusHistory"
                :key="history.id"
                :timestamp="formatDateTime(history.timestamp)"
                placement="top"
                :type="getTimelineType(history.status)"
                size="normal"
              >
                <el-card shadow="never" class="history-card">
                  <div class="history-header">
                    <span class="history-status">{{ getStatusText(history.status) }}</span>
                    <span class="history-operator">操作人: {{ history.operator }}</span>
                  </div>
                  <p v-if="history.comment" class="history-comment">{{ history.comment }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
        
        <!-- 附件 -->
        <div class="section" v-if="expense.attachments && expense.attachments.length > 0">
          <h3 class="section-title">附件 ({{ expense.attachments.length }})</h3>
          <div class="attachments-grid">
            <div 
              v-for="attachment in expense.attachments" 
              :key="attachment.id"
              class="attachment-item"
              @click="downloadAttachment(attachment)"
            >
              <el-icon class="attachment-icon"><Document /></el-icon>
              <div class="attachment-info">
                <div class="attachment-name">{{ attachment.name }}</div>
                <div class="attachment-size">{{ formatFileSize(attachment.size) }}</div>
              </div>
              <el-button type="primary" link size="small">下载</el-button>
            </div>
          </div>
        </div>
        
        <!-- 评论和讨论 -->
        <div class="section">
          <h3 class="section-title">讨论 ({{ comments.length }})</h3>
          <div class="comments-section">
            <div 
              v-for="comment in comments" 
              :key="comment.id"
              class="comment-item"
            >
              <div class="comment-header">
                <el-avatar :src="comment.avatar" :size="isMobile ? 24 : 32" />
                <div class="comment-meta">
                  <span class="comment-user">{{ comment.user }}</span>
                  <span class="comment-time">{{ formatDateTime(comment.time) }}</span>
                </div>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </div>
            
            <div class="comment-input-area">
              <el-input
                v-model="newComment"
                type="textarea"
                :rows="isMobile ? 2 : 3"
                placeholder="请输入您的评论..."
                class="comment-textarea"
              />
              <div class="comment-submit">
                <el-button type="primary" @click="addComment" :size="isMobile ? 'small' : 'default'">发表评论</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Document, Clock, CircleCheck, Close 
} from '@element-plus/icons-vue'

// 路由实例
const router = useRouter()
const route = useRoute()

// 移动端适配
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 响应式数据
const newComment = ref('')

const expense = ref({
  id: 1,
  title: '10月份电费分摊',
  description: '10月份宿舍电费分摊费用，共使用300度电，单价0.8元/度',
  amount: 240,
  category: 'utilities',
  applicant: '张三',
  date: '2023-10-15',
  status: 'approved',
  reviewer: '李四',
  reviewDate: '2023-10-16T10:30:00Z',
  reviewComment: '费用合理，同意通过',
  createdAt: '2023-10-15T09:15:00Z',
  participants: [
    { id: 1, name: '张三', amount: 60, percentage: 25, paymentStatus: 'paid' },
    { id: 2, name: '李四', amount: 60, percentage: 25, paymentStatus: 'paid' },
    { id: 3, name: '王五', amount: 60, percentage: 25, paymentStatus: 'pending' },
    { id: 4, name: '赵六', amount: 60, percentage: 25, paymentStatus: 'pending' }
  ],
  attachments: [
    { id: 1, name: '电费账单.pdf', size: 102400 },
    { id: 2, name: '用电明细.xlsx', size: 51200 }
  ]
})

const statusHistory = ref([
  {
    id: 1,
    status: 'pending',
    timestamp: '2023-10-15T09:15:00Z',
    operator: '张三',
    comment: '提交费用申请'
  },
  {
    id: 2,
    status: 'approved',
    timestamp: '2023-10-16T10:30:00Z',
    operator: '李四',
    comment: '费用合理，同意通过'
  }
])

const comments = ref([
  {
    id: 1,
    user: '李四',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    content: '请提供详细的用电明细，以便核实费用',
    time: '2023-10-15T10:00:00Z'
  },
  {
    id: 2,
    user: '张三',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    content: '已上传用电明细，请查收',
    time: '2023-10-15T11:30:00Z'
  }
])

// 方法
const goBack = () => {
  router.back()
}

const reviewExpense = () => {
  router.push(`/expense/review/${expense.value.id}`)
}

const payExpense = () => {
  ElMessage.info('跳转到支付页面')
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

const getStatusType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    case 'draft': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    case 'draft': return '草稿'
    default: return '未知'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return Clock
    case 'approved': return CircleCheck
    case 'rejected': return Close
    default: return CircleCheck
  }
}

const getCategoryType = (category: string) => {
  switch (category) {
    case 'accommodation': return 'primary'
    case 'utilities': return 'success'
    case 'maintenance': return 'warning'
    case 'cleaning': return 'info'
    case 'activities': return 'danger'
    case 'supplies': return 'success'
    case 'food': return 'warning'
    case 'insurance': return 'primary'
    case 'rent': return 'info'
    case 'other': return 'info'
    default: return 'info'
  }
}

const getCategoryText = (category: string) => {
  if (!category) return '未知'
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(category)) return category

  switch (category) {
    case 'accommodation': return '住宿费'
    case 'rent': return '房租'
    case 'deposit': return '押金'
    case 'management_fee': return '管理费'
    case 'utilities': return '水电费'
    case 'water_fee': return '水费'
    case 'electricity_fee': return '电费'
    case 'gas_fee': return '燃气费'
    case 'internet_fee': return '网费'
    case 'tv_fee': return '电视费'
    case 'maintenance': return '维修费'
    case 'equipment_repair': return '设备维修'
    case 'furniture_repair': return '家具维修'
    case 'appliance_repair': return '电器维修'
    case 'cleaning': return '清洁费'
    case 'daily_cleaning': return '日常清洁'
    case 'pest_control': return '杀虫除害'
    case 'activities': return '活动费用'
    case 'supplies': return '日用品'
    case 'food': return '食品饮料'
    case 'insurance': return '保险费用'
    case 'other': return '其他'
    default: return category || '未知'
  }
}

const getPaymentStatusType = (status: string) => {
  switch (status) {
    case 'paid': return 'success'
    case 'pending': return 'warning'
    case 'overdue': return 'danger'
    default: return 'info'
  }
}

const getPaymentStatusText = (status: string) => {
  switch (status) {
    case 'paid': return '已支付'
    case 'pending': return '待支付'
    case 'overdue': return '已逾期'
    default: return '未知'
  }
}

const getTimelineType = (status: string) => {
  switch (status) {
    case 'pending': return 'primary'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'info'
  }
}

const downloadAttachment = (attachment: any) => {
  ElMessage.info(`下载附件: ${attachment.name}`)
}

const addComment = () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  // 添加新评论
  comments.value.push({
    id: comments.value.length + 1,
    user: '当前用户',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    content: newComment.value,
    time: new Date().toISOString()
  })
  
  // 清空输入框
  newComment.value = ''
  ElMessage.success('评论发表成功')
}

// 组件挂载时的操作
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  console.log('📄 费用详情页面加载完成', route.params.id)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.expense-detail-container {
  padding: 20px;
  min-height: calc(100vh - 120px);
  background-color: #f0f2f5;
}

.expense-detail-container.is-mobile {
  padding: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.expense-detail-body {
  padding: 0;
}

.amount {
  font-size: 16px;
  font-weight: 700;
  color: #f56c6c;
}

.section {
  margin-top: 25px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.description-box {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  border: 1px solid #ebeef5;
}

.table-responsive-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.timeline-container {
  padding: 10px 5px;
}

.history-card {
  border: 1px solid #ebeef5;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-status {
  font-weight: 600;
  color: #303133;
}

.history-operator {
  font-size: 12px;
  color: #909399;
}

.history-comment {
  font-size: 13px;
  color: #606266;
  margin: 0;
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.attachment-item:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
}

.attachment-icon {
  font-size: 28px;
  color: #409eff;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-size {
  font-size: 12px;
  color: #909399;
}

.comments-section {
  padding: 10px 0;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.comment-meta {
  display: flex;
  flex-direction: column;
}

.comment-user {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  padding-left: 44px;
}

.comment-input-area {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.comment-submit {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .expense-detail-container {
    padding: 0;
  }
  
  .expense-detail-container :deep(.el-card) {
    border: none;
    border-radius: 0;
  }
  
  .expense-detail-container :deep(.el-card__header) {
    padding: 12px 15px;
    position: sticky;
    top: 0;
    z-index: 10;
    background: #fff;
  }
  
  .expense-detail-container :deep(.el-card__body) {
    padding: 15px;
  }
  
  .attachments-grid {
    grid-template-columns: 1fr;
  }
  
  .comment-content {
    padding-left: 36px;
  }
}
</style>