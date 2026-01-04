<template>
  <div class="expense-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费用详情</span>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button 
              v-if="expense.status === 'pending'" 
              type="warning" 
              @click="reviewExpense"
            >
              审核费用
            </el-button>
            <el-button 
              v-else-if="expense.status === 'approved'" 
              type="success" 
              @click="payExpense"
            >
              支付费用
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="expense-detail">
        <!-- 费用基本信息 -->
        <el-descriptions title="费用基本信息" :column="2" border>
          <el-descriptions-item label="费用标题">
            {{ expense.title }}
          </el-descriptions-item>
          <el-descriptions-item label="费用类别">
            <el-tag :type="getCategoryType(expense.category)">
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
          <el-descriptions-item label="申请时间">
            {{ formatDateTime(expense.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(expense.status)">
              <el-icon :size="12" style="margin-right: 4px; vertical-align: text-top;">
                <component :is="getStatusIcon(expense.status)" />
              </el-icon>
              {{ getStatusText(expense.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核人" v-if="expense.reviewer">
            {{ expense.reviewer }}
          </el-descriptions-item>
          <el-descriptions-item label="审核时间" v-if="expense.reviewDate">
            {{ formatDateTime(expense.reviewDate) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 费用说明 -->
        <div class="section">
          <h3>费用说明</h3>
          <p class="description">{{ expense.description }}</p>
        </div>
        
        <!-- 参与成员分摊详情 -->
        <div class="section">
          <h3>参与成员分摊详情</h3>
          <el-table :data="expense.participants" style="width: 100%">
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
            <el-table-column prop="status" label="支付状态">
              <template #default="{ row }">
                <el-tag :type="getPaymentStatusType(row.paymentStatus)">
                  {{ getPaymentStatusText(row.paymentStatus) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 状态流转历史 -->
        <div class="section">
          <h3>状态流转历史</h3>
          <el-timeline>
            <el-timeline-item
              v-for="history in statusHistory"
              :key="history.id"
              :timestamp="formatDateTime(history.timestamp)"
              placement="top"
              :type="getTimelineType(history.status)"
            >
              <el-card>
                <h4>{{ getStatusText(history.status) }}</h4>
                <p v-if="history.comment">{{ history.comment }}</p>
                <p>操作人: {{ history.operator }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
        
        <!-- 附件 -->
        <div class="section" v-if="expense.attachments && expense.attachments.length > 0">
          <h3>附件</h3>
          <div class="attachments">
            <el-card 
              v-for="attachment in expense.attachments" 
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
        
        <!-- 评论和讨论 -->
        <div class="section">
          <h3>评论和讨论</h3>
          <div class="comments">
            <div 
              v-for="comment in comments" 
              :key="comment.id"
              class="comment"
            >
              <div class="comment-header">
                <el-avatar :src="comment.avatar" size="small" />
                <div class="comment-user">{{ comment.user }}</div>
                <div class="comment-time">{{ formatDateTime(comment.time) }}</div>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </div>
            
            <div class="comment-input">
              <el-input
                v-model="newComment"
                type="textarea"
                :rows="3"
                placeholder="请输入您的评论..."
              />
              <div class="comment-actions">
                <el-button type="primary" @click="addComment">发表评论</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Document, Clock, CircleCheck, Close 
} from '@element-plus/icons-vue'

// 路由实例
const router = useRouter()
const route = useRoute()

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
    case 'other': return 'info'
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
  console.log('📄 费用详情页面加载完成', route.params.id)
})
</script>

<style scoped>
.expense-detail-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expense-detail {
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

.amount {
  font-size: 18px;
  font-weight: 700;
  color: #f56c6c;
}

.description {
  color: #606266;
  line-height: 1.6;
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

.comments {
  padding: 15px 0;
}

.comment {
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.comment-user {
  font-weight: 600;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  color: #606266;
  line-height: 1.5;
}

.comment-input {
  margin-top: 20px;
}

.comment-actions {
  margin-top: 10px;
  text-align: right;
}

@media (max-width: 768px) {
  .attachments {
    grid-template-columns: 1fr;
  }
}
</style>