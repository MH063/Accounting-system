<template>
  <div class="expense-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><View /></el-icon>
          费用详情
        </h1>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="ArrowLeft" 
          @click="$router.back()"
          class="back-btn"
        >
          返回
        </el-button>
        <el-button 
          v-if="canEditExpense"
          type="primary" 
          :icon="Edit"
          @click="handleEdit"
          class="edit-btn"
        >
          编辑
        </el-button>
        <el-button 
          v-if="canReviewExpense"
          type="warning" 
          :icon="DocumentChecked"
          @click="handleReview"
          class="review-btn"
        >
          审核
        </el-button>
        <el-button 
          v-if="canDeleteExpense"
          type="danger" 
          :icon="Delete"
          @click="handleDelete"
          class="delete-btn"
        >
          删除
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 费用详情内容 -->
    <div v-else class="detail-content">
      <!-- 基本信息卡片 -->
      <el-card class="info-card basic-info">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Document /></el-icon>
              基本信息
            </span>
            <el-tag 
              :type="getStatusType(expenseData?.status)" 
              size="large"
              class="status-tag"
            >
              {{ getStatusText(expenseData?.status) }}
            </el-tag>
          </div>
        </template>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">费用标题</div>
            <div class="info-value">{{ expenseData?.title || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">费用类别</div>
            <div class="info-value">
              <el-tag :type="getCategoryType(expenseData?.category)" size="small">
                {{ getCategoryText(expenseData?.category) }}
              </el-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">费用金额</div>
            <div class="info-value amount">{{ formatCurrency(expenseData?.amount || 0) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">费用日期</div>
            <div class="info-value">{{ formatDate(expenseData?.date) }}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">费用描述</div>
            <div class="info-value description">{{ expenseData?.description || '-' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 申请人信息卡片 -->
      <el-card class="info-card applicant-info">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><User /></el-icon>
              申请人信息
            </span>
          </div>
        </template>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">申请人姓名</div>
            <div class="info-value">{{ expenseData?.applicant || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">联系电话</div>
            <div class="info-value">{{ expenseData?.phone || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">所属部门</div>
            <div class="info-value">{{ expenseData?.department || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">职务</div>
            <div class="info-value">{{ expenseData?.position || '-' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 审核信息卡片 -->
      <el-card class="info-card review-info" v-if="expenseData?.status !== 'pending'">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><CircleCheck /></el-icon>
              审核信息
            </span>
          </div>
        </template>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">审核人</div>
            <div class="info-value">{{ expenseData?.reviewer || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">审核日期</div>
            <div class="info-value">{{ formatDate(expenseData?.reviewDate) }}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">审核意见</div>
            <div class="info-value description">{{ expenseData?.reviewComment || '-' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 附件信息卡片 -->
      <el-card class="info-card attachments-info" v-if="expenseData?.attachments && expenseData.attachments.length > 0 && canViewFinancialInfo">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Paperclip /></el-icon>
              附件信息
            </span>
            <el-button 
              v-if="canUploadAttachments"
              type="primary" 
              size="small" 
              :icon="Plus"
              @click="handleUploadAttachment"
            >
              上传附件
            </el-button>
          </div>
        </template>

        <div class="attachments-grid">
          <div 
            v-for="(attachment, index) in expenseData?.attachments" 
            :key="attachment.name + '-' + index"
            class="attachment-item"
            @click="handlePreviewAttachment(attachment)"
          >
            <el-icon class="attachment-icon"><Document /></el-icon>
            <span class="attachment-name">{{ getFileName(attachment) }}</span>
            <el-icon class="attachment-preview"><View /></el-icon>
          </div>
        </div>
      </el-card>

      <!-- 参与成员分摊详情卡片 -->
      <el-card class="info-card members-split" v-if="canViewFinancialInfo">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><User /></el-icon>
              参与成员分摊详情
            </span>
            <div class="split-summary">
              <span class="total-members">共 {{ expenseData?.participants?.length || 0 }} 人</span>
              <span class="split-type">{{ expenseData?.splitType === 'equal' ? '平均分摊' : '按比例分摊' }}</span>
            </div>
            <el-button 
              v-if="canManageParticipants"
              type="primary" 
              size="small" 
              :icon="Setting"
              @click="handleManageParticipants"
            >
              管理成员
            </el-button>
          </div>
        </template>

        <div class="participants-list">
          <div 
            v-for="(participant, index) in expenseData?.participants" 
            :key="participant.id || participant.name + '-' + index"
            class="participant-item"
          >
            <div class="participant-info">
              <div class="participant-avatar">
                <el-avatar :size="40" :src="getUserAvatar(participant.avatar, '', participant.name)">
                  {{ participant.name?.charAt(0) }}
                </el-avatar>
              </div>
              <div class="participant-details">
                <div class="participant-name">{{ participant.name }}</div>
                <div class="participant-role">{{ participant.role || '成员' }}</div>
              </div>
            </div>
            <div class="participant-amount">
              <div class="amount-value">{{ formatCurrency(participant.amount) }}</div>
              <div class="amount-percentage">{{ participant.percentage }}%</div>
            </div>
            <div class="participant-status">
              <el-tag 
                :type="participant.paid ? 'success' : 'warning'" 
                size="small"
              >
                {{ participant.paid ? '已支付' : '未支付' }}
              </el-tag>
              <el-button 
                v-if="canMarkAsPaid(participant)"
                type="text" 
                size="small" 
                @click="toggleParticipantPaymentStatus(participant)"
                :icon="participant.paid ? 'CircleCheck' : 'Clock'"
                class="payment-toggle-btn"
              >
                {{ participant.paid ? '取消标记' : '标为已支付' }}
              </el-button>
            </div>
          </div>
        </div>

        <div class="split-summary-footer">
          <div class="summary-item">
            <span class="label">总金额：</span>
            <span class="value">{{ formatCurrency(expenseData?.amount || 0) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">已支付：</span>
            <span class="value paid">{{ formatCurrency(getTotalPaid()) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">待支付：</span>
            <span class="value pending">{{ formatCurrency(getTotalPending()) }}</span>
          </div>
        </div>
      </el-card>

      <!-- 系统信息卡片 -->
      <el-card class="info-card system-info">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Clock /></el-icon>
              系统信息
            </span>
          </div>
        </template>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ formatDateTime(expenseData?.createdAt) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">最后更新时间</div>
            <div class="info-value">{{ formatDateTime(expenseData?.updatedAt) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">紧急程度</div>
            <div class="info-value">
              <el-tag :type="expenseData?.isUrgent ? 'danger' : 'info'" size="small">
                {{ expenseData?.isUrgent ? '紧急' : '普通' }}
              </el-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">费用编号</div>
            <div class="info-value">{{ expenseData?.id || '-' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 评论和讨论卡片 -->
      <el-card class="info-card comments-section">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><ChatDotRound /></el-icon>
              评论和讨论
            </span>
            <div class="comments-actions">
              <el-badge :value="unreadCommentsCount" :hidden="unreadCommentsCount === 0">
                <el-button 
                  type="text" 
                  size="small"
                  @click="markAllAsRead"
                  :disabled="unreadCommentsCount === 0"
                >
                  全部标为已读
                </el-button>
              </el-badge>
            </div>
          </div>
        </template>

        <div class="comments-container">
          <!-- 添加评论输入框 -->
          <div class="comment-input-section">
            <div class="comment-input-header">
              <el-avatar :size="32" :src="getUserAvatar(currentUser.avatar, '', currentUser.name)">
                {{ currentUser.name?.charAt(0) }}
              </el-avatar>
              <span class="comment-user-name">{{ currentUser.name }}</span>
            </div>
            <el-input
              v-model="newComment.content"
              type="textarea"
              :rows="3"
              placeholder="添加评论..."
              class="comment-textarea"
              maxlength="500"
              show-word-limit
            />
            <div class="comment-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="addComment"
                :disabled="!newComment.content.trim() || addingComment"
                :loading="addingComment"
              >
                {{ addingComment ? '发布中...' : '发布评论' }}
              </el-button>
              <el-button 
                size="small" 
                @click="clearCommentInput"
                :disabled="addingComment"
              >
                清空
              </el-button>
            </div>
          </div>

          <!-- 评论列表 -->
          <div class="comments-list">
            <div 
              v-for="comment in sortedComments" 
              :key="comment.id"
              class="comment-item"
              :class="{ 'unread': !comment.read }"
            >
              <div class="comment-avatar">
                <el-avatar :size="40" :src="getUserAvatar(comment.author.avatar, '', comment.author.name)">
                  {{ comment.author.name?.charAt(0) }}
                </el-avatar>
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <div class="comment-author-info">
                    <span class="author-name">{{ comment.author.name }}</span>
                    <span class="author-role">{{ comment.author.role }}</span>
                    <el-tag 
                      v-if="comment.author.id === expenseData?.applicant" 
                      type="primary" 
                      size="small"
                      class="applicant-tag"
                    >
                      申请人
                    </el-tag>
                  </div>
                  <div class="comment-time">
                    {{ formatCommentTime(comment.createdAt) }}
                    <el-button 
                      v-if="!comment.read && comment.author.id !== currentUser.id"
                      type="text" 
                      size="small" 
                      @click="markCommentAsRead(comment)"
                      class="mark-read-btn"
                    >
                      标为已读
                    </el-button>
                  </div>
                </div>
                <div class="comment-text">{{ comment.content }}</div>
                <div class="comment-footer">
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="toggleReply(comment)"
                    :icon="ChatDotSquare"
                  >
                    回复 ({{ comment.replies?.length || 0 }})
                  </el-button>
                  <el-button 
                    v-if="canEditComment(comment)"
                    type="text" 
                    size="small" 
                    @click="editComment(comment)"
                    :icon="Edit"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    v-if="canDeleteComment(comment)"
                    type="text" 
                    size="small" 
                    @click="deleteComment(comment)"
                    :icon="Delete"
                    class="delete-btn"
                  >
                    删除
                  </el-button>
                </div>

                <!-- 回复区域 -->
                <div v-if="comment.showReply" class="reply-section">
                  <div class="reply-input">
                    <el-input
                      v-model="comment.replyContent"
                      type="textarea"
                      :rows="2"
                      placeholder="添加回复..."
                      size="small"
                    />
                    <div class="reply-actions">
                      <el-button 
                        size="small" 
                        type="primary"
                        @click="addReply(comment)"
                        :disabled="!comment.replyContent?.trim()"
                      >
                        回复
                      </el-button>
                      <el-button 
                        size="small" 
                        @click="toggleReply(comment)"
                      >
                        取消
                      </el-button>
                    </div>
                  </div>

                  <!-- 回复列表 -->
                  <div v-if="comment.replies?.length > 0" class="replies-list">
                    <div 
                      v-for="reply in comment.replies" 
                      :key="reply.id"
                      class="reply-item"
                    >
                      <div class="reply-avatar">
                        <el-avatar :size="28" :src="getUserAvatar(reply.author.avatar, '', reply.author.name)">
                          {{ reply.author.name?.charAt(0) }}
                        </el-avatar>
                      </div>
                      <div class="reply-content">
                        <div class="reply-header">
                          <span class="reply-author-name">{{ reply.author.name }}</span>
                          <span class="reply-time">{{ formatCommentTime(reply.createdAt) }}</span>
                        </div>
                        <div class="reply-text">{{ reply.content }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="sortedComments.length === 0" class="empty-comments">
            <el-icon class="empty-icon"><ChatDotRound /></el-icon>
            <p class="empty-text">暂无评论，来发表第一条评论吧！</p>
          </div>
        </div>
      </el-card>

      <!-- 状态流转历史卡片 -->
      <el-card class="info-card status-history" v-if="statusHistory.length > 0">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Clock /></el-icon>
              状态流转历史
            </span>
            <div class="history-stats">
              <el-tag size="small" type="info">
                共 {{ statusHistory.length }} 条记录
              </el-tag>
              <el-button 
                type="text" 
                size="small" 
                @click="toggleHistoryDetails"
                :icon="showAllHistory ? 'ArrowUp' : 'ArrowDown'"
              >
                {{ showAllHistory ? '收起' : '展开' }}
              </el-button>
            </div>
          </div>
        </template>

        <div class="status-timeline">
          <div 
            v-for="(history, index) in displayedHistory" 
            :key="history.timestamp + '-' + index"
            class="timeline-item"
            :class="getTimelineItemClass(history)"
          >
            <div class="timeline-marker" :class="getMarkerClass(history)">
              <el-icon class="marker-icon">
                <component :is="getStatusIcon(history.status)" />
              </el-icon>
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-title">{{ getStatusTitle(history.status) }}</span>
                <span class="timeline-status">
                  <el-tag 
                    :type="getStatusTagType(history.status)" 
                    size="small"
                  >
                    {{ getStatusText(history.status) }}
                  </el-tag>
                </span>
              </div>
              <div class="timeline-description">
                <div class="description-main">
                  {{ history.description }}
                </div>
                <div v-if="history.details" class="description-details">
                  <el-collapse>
                    <el-collapse-item :title="'详细信息'" :name="index">
                      <div class="details-content">
                        <div v-for="(detail, detailKey) in history.details" :key="detailKey" class="detail-item">
                          <span class="detail-label">{{ detailKey }}:</span>
                          <span class="detail-value">{{ detail }}</span>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
              <div class="timeline-footer">
                <div class="timeline-info">
                  <el-icon class="info-icon"><User /></el-icon>
                  <span class="operator">{{ history.operator }}</span>
                  <el-icon class="info-icon"><Clock /></el-icon>
                  <span class="time">{{ formatDateTime(history.timestamp) }}</span>
                </div>
                <div v-if="history.ipAddress" class="timeline-meta">
                  <el-icon class="meta-icon"><Connection /></el-icon>
                  <span class="ip-address">{{ history.ipAddress }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="statusHistory.length === 0" class="empty-history">
            <el-icon class="empty-icon"><DocumentDelete /></el-icon>
            <p class="empty-text">暂无状态流转记录</p>
          </div>
        </div>
      </el-card>

      <!-- 操作记录卡片 -->
      <el-card class="info-card operation-log">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><List /></el-icon>
              操作记录
            </span>
            <div class="operation-summary">
              <el-tag size="small" type="primary">
                最近操作：{{ lastOperation }}
              </el-tag>
            </div>
          </div>
        </template>

        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-marker created"></div>
            <div class="timeline-content">
              <div class="timeline-title">费用创建</div>
              <div class="timeline-description">申请人 {{ expenseData?.applicant }} 创建了费用申请</div>
              <div class="timeline-time">{{ formatDateTime(expenseData?.createdAt) }}</div>
            </div>
          </div>
          <div 
            v-if="expenseData?.status !== 'pending'" 
            class="timeline-item"
          >
            <div class="timeline-marker" :class="expenseData?.status === 'approved' ? 'approved' : 'rejected'"></div>
            <div class="timeline-content">
              <div class="timeline-title">
                {{ expenseData?.status === 'approved' ? '审核通过' : '审核拒绝' }}
              </div>
              <div class="timeline-description">
                审核人 {{ expenseData?.reviewer }} 
                {{ expenseData?.status === 'approved' ? '通过了' : '拒绝了' }}费用申请
                <span v-if="expenseData?.reviewComment">，审核意见：{{ expenseData.reviewComment }}</span>
              </div>
              <div class="timeline-time">{{ formatDateTime(expenseData?.reviewDate) }}</div>
            </div>
          </div>
          <div 
            v-if="expenseData?.status === 'approved' && hasPaidParticipants" 
            class="timeline-item"
          >
            <div class="timeline-marker payment"></div>
            <div class="timeline-content">
              <div class="timeline-title">费用支付</div>
              <div class="timeline-description">
                部分成员已完成费用支付
                <span class="payment-summary">
                  (已支付：{{ paidAmount }}元，剩余：{{ pendingAmount }}元)
                </span>
              </div>
              <div class="timeline-time">{{ formatDateTime(lastPaymentDate) }}</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, View, Edit, Delete, Document, User, CircleCheck,
  Paperclip, Clock, List, DocumentChecked, ChatDotRound, ChatDotSquare,
  Plus, Setting, DocumentDelete, CircleClose, Connection
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ExpenseItem, Participant, User as UserType } from '@/types'
import { expenseService } from '@/services/expenseService'
import { getFullAvatarUrl, getUserAvatar } from '@/services/userService'

// 路由
const route = useRoute()
const router = useRouter()

// 数据状态
const loading = ref(true)
const expenseData = ref<ExpenseItem | null>(null)

// 当前用户信息
const currentUser = ref<UserType>({
  id: 1,
  name: '当前用户',
  role: 'system_admin', // admin | system_admin | dorm_leader | payer | user
  avatar: '',
  permissions: ['read', 'write', 'delete', 'review'] // 权限列表
})

// 评论相关状态
const comments = ref<Array<{id: number, content: string, author: UserType, createdAt: string, read?: boolean, showReply?: boolean, replyContent?: string, replies?: Array<{id: number, content: string, author: UserType, createdAt: string}>}>>([])
const newComment = ref({
  content: ''
})
const addingComment = ref(false)
const editingCommentId = ref<number | null>(null)

// 状态历史详情接口定义
interface StatusHistoryDetail {
  [key: string]: string | number | boolean
}

// 状态流转历史相关状态
const statusHistory = ref<Array<{status: string, description: string, operator: string, timestamp: string, ipAddress?: string, details?: StatusHistoryDetail}>>([])
const showAllHistory = ref(false)
const displayedHistory = computed(() => {
  if (showAllHistory.value) {
    return statusHistory.value
  }
  return statusHistory.value.slice(0, 3) // 默认显示最近3条记录
})

// 操作记录相关计算属性
const lastOperation = computed(() => {
  if (!expenseData.value) return '-'
  
  const operations = []
  if (expenseData.value.createdAt) {
    operations.push('创建')
  }
  if (expenseData.value.reviewDate) {
    operations.push(expenseData.value.status === 'approved' ? '审核通过' : '审核拒绝')
  }
  
  return operations[operations.length - 1] || '-'
})

const hasPaidParticipants = computed(() => {
  if (!expenseData.value?.participants) return false
  return expenseData.value.participants.some((p: Participant) => p.paid)
})

const paidAmount = computed(() => {
  if (!expenseData.value?.participants) return 0
  return expenseData.value.participants
    .filter((p: Participant) => p.paid)
    .reduce((sum: number, p: Participant) => sum + p.amount, 0)
})

const pendingAmount = computed(() => {
  if (!expenseData.value?.participants) return 0
  return expenseData.value.participants
    .filter((p: Participant) => !p.paid)
    .reduce((sum: number, p: Participant) => sum + p.amount, 0)
})

const lastPaymentDate = computed(() => {
  // 基于真实数据获取最近一次支付时间
  if (!expenseData.value?.participants) return null
  
  const paidParticipants = expenseData.value.participants.filter((p: Participant) => p.paid)
  if (paidParticipants.length === 0) return null
  
  // 获取已支付参与者的支付时间，按时间倒序排序
  const paymentDates = paidParticipants
    .filter(p => p.paidAt) // 确保有支付时间
    .map(p => new Date(p.paidAt!))
    .sort((a, b) => b.getTime() - a.getTime())
  
  // 返回最新的支付时间
  return paymentDates.length > 0 ? paymentDates[0].toISOString() : null
})

// 生命周期
onMounted(() => {
  loadExpenseDetail()
})

// 方法
const loadExpenseDetail = async () => {
  loading.value = true
  
  try {
    // 从API获取费用详情
    const response = await expenseService.getExpenseById(Number(route.params.id))
    if (response.success && response.data) {
      expenseData.value = response.data
      
      // 加载评论数据
      loadComments()
      // 加载状态流转历史
      loadStatusHistory()
    } else {
      ElMessage.error('获取费用详情失败')
    }
  } catch (error) {
    console.error('获取费用详情失败:', error)
    ElMessage.error('获取费用详情失败')
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `¥${num.toFixed(2)}`
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getStatusType = (status?: string): 'warning' | 'success' | 'danger' | 'info' => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    case 'draft': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status?: string): string => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    case 'draft': return '草稿'
    default: return '未知'
  }
}

const getCategoryType = (category?: string): 'success' | 'warning' | 'info' | 'danger' => {
  switch (category) {
    case 'accommodation': return 'info'
    case 'utilities': return 'success'
    case 'maintenance': return 'warning'
    case 'cleaning': return 'info'
    case 'other': return 'danger'
    default: return 'info'
  }
}

const getCategoryText = (category?: string): string => {
  switch (category) {
    case 'accommodation': return '住宿费'
    case 'utilities': return '水电费'
    case 'maintenance': return '维修费'
    case 'cleaning': return '清洁费'
    case 'other': return '其他'
    default: return '未知'
  }
}

const getFileName = (filePath: string): string => {
  return filePath.split('/').pop() || filePath
}

const handleEdit = () => {
  router.push(`/dashboard/expense/edit/${expenseData.value.id}`)
}

const handleReview = () => {
  router.push(`/dashboard/expense/review?id=${expenseData.value.id}`)
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除费用"${expenseData.value.title}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用API删除费用
    const response = await expenseService.deleteExpense(expenseData.value.id)
    console.log('删除费用成功:', response)
    if (response.success) {
      ElMessage.success('费用删除成功')
      // 重定向到列表页并刷新数据，而不是简单返回
      router.push({
        path: '/dashboard/expense',
        query: { refresh: 'true' }
      })
    } else {
      ElMessage.error(response.message || '删除费用失败')
    }
  } catch (error) {
    // 用户取消删除或API调用失败
    if (error !== 'cancel') {
      ElMessage.error('删除费用失败，请重试')
      console.error('删除费用失败:', error)
    }
  }
}

const getTotalPaid = (): number => {
  if (!expenseData.value?.participants) return 0
  return expenseData.value.participants
    .filter(p => p.paid)
    .reduce((sum, p) => sum + p.amount, 0)
}

const getTotalPending = (): number => {
  if (!expenseData.value?.participants) return 0
  return expenseData.value.participants
    .filter(p => !p.paid)
    .reduce((sum, p) => sum + p.amount, 0)
}

// 评论相关方法
const loadComments = async () => {
  try {
    // 从API获取评论数据
    // 暂时使用模拟数据，因为expenseService中没有getExpenseComments方法
    comments.value = []
  } catch (error) {
    console.error('获取评论数据失败:', error)
    ElMessage.error('获取评论数据失败')
    comments.value = []
  }
}

const addComment = async () => {
  if (!newComment.value.content.trim()) return
  
  addingComment.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const comment = {
      id: Date.now(),
      content: newComment.value.content.trim(),
      author: currentUser.value,
      createdAt: new Date().toISOString(),
      read: true,
      replies: []
    }
    
    comments.value.unshift(comment)
    newComment.value.content = ''
    
    ElMessage.success('评论发布成功')
  } catch (error) {
    ElMessage.error('评论发布失败，请重试')
  } finally {
    addingComment.value = false
  }
}

const deleteComment = async (comment: {id: number, content: string, author: UserType, createdAt: string, read?: boolean, showReply?: boolean, replyContent?: string, replies?: Array<{id: number, content: string, author: UserType, createdAt: string}>}) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条评论吗？',
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    comments.value = comments.value.filter(c => c.id !== comment.id)
    ElMessage.success('评论删除成功')
  } catch {
    // 用户取消删除
  }
}

const editComment = (comment: {id: number, content: string, author: UserType, createdAt: string, read?: boolean, showReply?: boolean, replyContent?: string, replies?: Array<{id: number, content: string, author: UserType, createdAt: string}>}) => {
  editingCommentId.value = comment.id
  newComment.value.content = comment.content
}

const canEditComment = (comment: {id: number, content: string, author: UserType, createdAt: string, read?: boolean, showReply?: boolean, replyContent?: string, replies?: Array<{id: number, content: string, author: UserType, createdAt: string}>}) => {
  return comment.author.id === currentUser.value.id
}

const canDeleteComment = (comment: {id: number, content: string, author: UserType, createdAt: string, read?: boolean, showReply?: boolean, replyContent?: string, replies?: Array<{id: number, content: string, author: UserType, createdAt: string}>}) => {
  return comment.author.id === currentUser.value.id || 
         currentUser.value.id === expenseData.value?.applicant
}

const toggleReply = (comment: {id: number, content: string, author: UserType, createdAt: string, read?: boolean, showReply?: boolean, replyContent?: string, replies?: Array<{id: number, content: string, author: UserType, createdAt: string}>}) => {
  comment.showReply = !comment.showReply
  if (!comment.showReply) {
    comment.replyContent = ''
  }
}

const addReply = async (comment: {id: number, content: string, author: UserType, createdAt: string, read?: boolean, showReply?: boolean, replyContent?: string, replies?: Array<{id: number, content: string, author: UserType, createdAt: string}>}) => {
  if (!comment.replyContent?.trim()) return
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const reply = {
      id: Date.now(),
      content: comment.replyContent.trim(),
      author: currentUser.value,
      createdAt: new Date().toISOString()
    }
    
    if (!comment.replies) {
      comment.replies = []
    }
    comment.replies.push(reply)
    comment.replyContent = ''
    comment.showReply = false
    
    ElMessage.success('回复发布成功')
  } catch (error) {
    ElMessage.error('回复发布失败，请重试')
  }
}

const markCommentAsRead = (comment: {id: number, content: string, author: UserType, createdAt: string, read?: boolean, showReply?: boolean, replyContent?: string, replies?: Array<{id: number, content: string, author: UserType, createdAt: string}>}) => {
  comment.read = true
}

const markAllAsRead = () => {
  comments.value.forEach(comment => {
    comment.read = true
  })
  ElMessage.success('所有评论已标为已读')
}

const clearCommentInput = () => {
  newComment.value.content = ''
  editingCommentId.value = null
}

// 计算属性
const sortedComments = computed(() => {
  return [...comments.value].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const unreadCommentsCount = computed(() => {
  return comments.value.filter(c => !c.read && c.author.id !== currentUser.value.id).length
})

const formatCommentTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 权限检查相关函数
const canEditExpense = computed(() => {
  if (!expenseData.value) return false
  
  // 系统管理员和超级管理员可以编辑所有费用
  if (['system_admin', 'admin'].includes(currentUser.value.role)) {
    return true
  }
  
  // 只有费用申请人可以编辑自己的费用，且费用状态为待审核
  const isApplicant = expenseData.value.applicant === currentUser.value.name ||
                      expenseData.value.applicantId === currentUser.value.id
  
  return isApplicant && expenseData.value.status === 'pending'
})

const canReviewExpense = computed(() => {
  if (!expenseData.value) return false
  
  // 只有状态为待审核的费用才能审核
  if (expenseData.value.status !== 'pending') return false
  
  // 系统管理员和管理员可以审核
  if (['system_admin', 'admin'].includes(currentUser.value.role)) {
    return true
  }
  
  // 宿舍长可以审核本寝室的费用
  if (currentUser.value.role === 'dorm_leader') {
    // 这里应该检查费用是否属于当前用户管理的宿舍
    // 暂时简化处理，假设都为 true
    return true
  }
  
  return false
})

const canDeleteExpense = computed(() => {
  if (!expenseData.value) return false
  
  // 系统管理员和超级管理员可以删除所有费用
  if (['system_admin', 'admin'].includes(currentUser.value.role)) {
    return true
  }
  
  // 只有费用申请人可以删除自己的费用，且费用状态为待审核
  const isApplicant = expenseData.value.applicant === currentUser.value.name ||
                      expenseData.value.applicantId === currentUser.value.id
  
  return isApplicant && expenseData.value.status === 'pending'
})

const canViewFinancialInfo = computed(() => {
  if (!expenseData.value) return false
  
  // 系统管理员、管理员和宿舍长可以查看财务信息
  return ['system_admin', 'admin', 'dorm_leader'].includes(currentUser.value.role) ||
         // 费用申请人可以查看自己费用的财务信息
         expenseData.value.applicant === currentUser.value.name ||
         expenseData.value.applicantId === currentUser.value.id
})

const canManageParticipants = computed(() => {
  if (!expenseData.value) return false
  
  // 只有费用申请人可以管理参与成员
  const isApplicant = expenseData.value.applicant === currentUser.value.name ||
                      expenseData.value.applicantId === currentUser.value.id
  
  // 只有待审核状态的费用才能修改分摊成员
  return isApplicant && expenseData.value.status === 'pending'
})

const canUploadAttachments = computed(() => {
  if (!expenseData.value) return false
  
  // 只有费用申请人可以上传附件
  const isApplicant = expenseData.value.applicant === currentUser.value.name ||
                      expenseData.value.applicantId === currentUser.value.id
  
  // 只有待审核和已通过状态的费用才能上传附件
  return isApplicant && ['pending', 'approved'].includes(expenseData.value.status)
})

const canMarkAsPaid = (participant: Participant): boolean => {
  // 只有费用申请人可以标记成员付款状态
  const isApplicant = expenseData.value?.applicant === currentUser.value.name ||
                      expenseData.value?.applicantId === currentUser.value.id
  
  return isApplicant && expenseData.value?.status === 'approved'
}



const showPermissionDeniedMessage = (action: string) => {
  ElMessage.warning(`您没有权限执行${action}操作`)
}

const logPermissionCheck = (action: string, result: boolean) => {
  console.log(`权限检查 - 操作: ${action}, 用户: ${currentUser.value.name}, 角色: ${currentUser.value.role}, 结果: ${result}`)
}

// 状态流转历史相关方法
const loadStatusHistory = async () => {
  try {
    // 从API获取状态流转历史
    // 暂时使用模拟数据，因为expenseService中没有getExpenseHistory方法
    statusHistory.value = []
  } catch (error) {
    console.error('获取状态流转历史失败:', error)
  }
}

const toggleHistoryDetails = () => {
  showAllHistory.value = !showAllHistory.value
}

// 状态流转历史辅助函数
const getTimelineItemClass = (history: any): string[] => {
  const classes: string[] = []
  
  switch (history.status) {
    case 'pending':
      classes.push('timeline-pending')
      break
    case 'approved':
      classes.push('timeline-approved')
      break
    case 'rejected':
      classes.push('timeline-rejected')
      break
    case 'payment_progress':
      classes.push('timeline-payment-progress')
      break
    case 'partially_paid':
      classes.push('timeline-partially-paid')
      break
    case 'fully_paid':
      classes.push('timeline-fully-paid')
      break
  }
  
  return classes
}

const getMarkerClass = (history: any): string[] => {
  const classes: string[] = ['timeline-marker']
  
  switch (history.status) {
    case 'pending':
      classes.push('pending-marker')
      break
    case 'approved':
      classes.push('approved-marker')
      break
    case 'rejected':
      classes.push('rejected-marker')
      break
    case 'payment_progress':
      classes.push('payment-progress-marker')
      break
    case 'partially_paid':
      classes.push('partially-paid-marker')
      break
    case 'fully_paid':
      classes.push('fully-paid-marker')
      break
  }
  
  return classes
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return Clock
    case 'approved': return CircleCheck
    case 'rejected': return CircleClose
    case 'payment_progress': return User
    case 'partially_paid': return CircleCheck
    case 'fully_paid': return CircleCheck
    default: return Clock
  }
}

const getStatusTitle = (status: string) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '审核通过'
    case 'rejected': return '审核拒绝'
    case 'payment_progress': return '费用分摊'
    case 'partially_paid': return '部分支付'
    case 'fully_paid': return '全部支付'
    default: return '未知状态'
  }
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    case 'payment_progress': return 'info'
    case 'partially_paid': return 'primary'
    case 'fully_paid': return 'success'
    default: return 'info'
  }
}



const handlePreviewAttachment = (attachment: string) => {
  ElMessage.info(`预览附件：${attachment}`)
}

// 权限控制相关的处理函数
const handleUploadAttachment = () => {
  if (!canUploadAttachments.value) {
    showPermissionDeniedMessage('上传附件')
    logPermissionCheck('上传附件', canUploadAttachments.value)
    return
  }
  
  // 实现上传附件逻辑
  ElMessage.info('打开文件上传对话框...')
  // 这里可以调用 Element Plus 的上传组件或文件选择器
}

const handleManageParticipants = () => {
  if (!canManageParticipants.value) {
    showPermissionDeniedMessage('管理成员')
    logPermissionCheck('管理成员', canManageParticipants.value)
    return
  }
  
  // 实现管理成员逻辑
  ElMessage.info('打开成员管理对话框...')
  // 这里可以打开成员管理的对话框或页面
}

const toggleParticipantPaymentStatus = (participant: Participant) => {
  if (!canMarkAsPaid(participant)) {
    showPermissionDeniedMessage('标记支付状态')
    logPermissionCheck('标记支付状态', canMarkAsPaid(participant))
    return
  }
  
  // 切换支付状态
  participant.paid = !participant.paid
  
  ElMessage.success(`已${participant.paid ? '标记' : '取消标记'}${participant.name}为${participant.paid ? '已支付' : '未支付'}`)
}
</script>

<style scoped>
/* 页面容器 */
.expense-detail {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 180px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  color: #409eff;
  font-size: 32px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.edit-btn {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.review-btn {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}

/* 加载状态 */
.loading-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

/* 详情内容 */
.detail-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

/* 信息卡片 */
.info-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-title .el-icon {
  color: #409eff;
}

.status-tag {
  font-size: 14px;
  padding: 8px 16px;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  padding: 20px 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.info-value.amount {
  color: #f56c6c;
  font-size: 18px;
  font-weight: 700;
}

.info-value.description {
  font-weight: 500;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

/* 附件网格 */
.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  padding: 20px 0;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.attachment-item:hover {
  border-color: #409eff;
  background-color: #f0f8ff;
  transform: translateY(-2px);
}

.attachment-icon {
  font-size: 24px;
  color: #909399;
}

.attachment-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.attachment-preview {
  font-size: 16px;
  color: #409eff;
}

/* 时间轴 */
.timeline {
  position: relative;
  padding: 20px 0;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
}

.timeline-item {
  position: relative;
  margin-bottom: 24px;
  padding-left: 60px;
}

.timeline-marker {
  position: absolute;
  left: 10px;
  top: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #e4e7ed;
}

.timeline-marker.created {
  background: #409eff;
}

.timeline-marker.approved {
  background: #67c23a;
}

.timeline-marker.rejected {
  background: #f56c6c;
}

.timeline-content {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.timeline-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.timeline-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
}

/* 参与成员分摊样式 */
.members-split .split-summary {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #606266;
}

.total-members {
  font-weight: 600;
  color: #409eff;
}

.split-type {
  background: #f0f9ff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #b3d8ff;
}

.participants-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.participant-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.participant-item:hover {
  border-color: #409eff;
  background-color: #f0f8ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.participant-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.participant-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.participant-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.participant-role {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

.participant-amount {
  text-align: right;
  margin-right: 16px;
}

.amount-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.amount-percentage {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.participant-status {
  flex-shrink: 0;
}

.split-summary-footer {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
  border-radius: 8px;
  margin-top: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-item .label {
  font-size: 14px;
  color: #606266;
}

.summary-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.summary-item .value.paid {
  color: #67c23a;
}

.summary-item .value.pending {
  color: #e6a23c;
}

/* Comments section styles (from replace block) */
.comments-card {
  margin-bottom: 20px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.comments-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.unread-badge {
  background: #f56c6c;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.add-comment-form {
  margin-bottom: 24px;
}

.comment-input-wrapper {
  position: relative;
}

.comment-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}

.comment-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.comment-input::placeholder {
  color: #c0c4cc;
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.comment-count {
  font-size: 12px;
  color: #909399;
}

.comment-buttons {
  display: flex;
  gap: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.2s;
}

.comment-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comment-item.unread {
  border-left: 4px solid #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.comment-author-info {
  display: flex;
  flex-direction: column;
}

.comment-author-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.comment-author-role {
  font-size: 12px;
  color: #909399;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-time {
  font-size: 12px;
  color: #c0c4cc;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
}

.comment-content {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.comment-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-buttons-group {
  display: flex;
  gap: 8px;
}

.reply-area {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.reply-input {
  width: 100%;
  min-height: 60px;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
}

.reply-input:focus {
  outline: none;
  border-color: #409eff;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.replies-list {
  margin-top: 12px;
  margin-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-item {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.reply-content {
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
}

.reply-author {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-comments {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 12px;
  color: #c0c4cc;
}

/* Responsive Design */
@media (max-width: 768px) {
  .participant-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .participant-info {
    flex: none;
  }

  .participant-amount {
    text-align: left;
    margin-right: 0;
  }

  .participant-status {
    align-self: flex-end;
  }

  .split-summary-footer {
    flex-direction: column;
    gap: 12px;
  }

  .comments-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .comment-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .comment-buttons {
    width: 100%;
    justify-content: flex-start;
  }

  .replies-list {
    margin-left: 8px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .expense-detail {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .header-actions .el-button {
    flex: 1;
    min-width: 120px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .attachments-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .participant-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .participant-info {
    flex: none;
  }
  
  .participant-amount {
    text-align: left;
    margin-right: 0;
  }
  
  .participant-status {
    align-self: flex-end;
  }
  
  .split-summary-footer {
    flex-direction: column;
    gap: 12px;
  }
  
  .timeline-item {
    padding-left: 50px;
  }
  
  .timeline::before {
    left: 15px;
  }
  
  .timeline-marker {
    left: 5px;
    width: 16px;
    height: 16px;
  }
}

/* 状态流转历史样式 */
.status-history {
  margin-bottom: 24px;
}

.status-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.status-history-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.history-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #606266;
}

.history-count {
  background: #f0f9ff;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #b3d8ff;
}

.history-count .number {
  font-weight: 700;
  color: #409eff;
}

.toggle-history-btn {
  padding: 6px 16px;
  font-size: 14px;
  border-radius: 20px;
  transition: all 0.3s;
}

.toggle-history-btn .el-icon {
  margin-left: 4px;
  transition: transform 0.3s;
}

.toggle-history-btn.expanded .el-icon {
  transform: rotate(180deg);
}

/* 状态时间轴增强样式 */
.status-timeline {
  position: relative;
  padding: 20px 0;
}

.status-timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #e4e7ed, #e4e7ed);
}

.status-timeline-item {
  position: relative;
  margin-bottom: 20px;
  padding-left: 60px;
}

.status-timeline-item:last-child {
  margin-bottom: 0;
}

.status-timeline-marker {
  position: absolute;
  left: 10px;
  top: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}

.status-timeline-marker.pending {
  background: #e6a23c;
  border-color: #e6a23c;
}

.status-timeline-marker.in-review {
  background: #409eff;
  border-color: #409eff;
}

.status-timeline-marker.approved {
  background: #67c23a;
  border-color: #67c23a;
}

.status-timeline-marker.rejected {
  background: #f56c6c;
  border-color: #f56c6c;
}

.status-timeline-marker.completed {
  background: #909399;
  border-color: #909399;
}

.status-timeline-content {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #e4e7ed;
  transition: all 0.3s ease;
}

.status-timeline-content:hover {
  background: #f5f7fa;
  border-left-color: #409eff;
}

.status-timeline-item.pending .status-timeline-content {
  border-left-color: #e6a23c;
}

.status-timeline-item.in-review .status-timeline-content {
  border-left-color: #409eff;
}

.status-timeline-item.approved .status-timeline-content {
  border-left-color: #67c23a;
}

.status-timeline-item.rejected .status-timeline-content {
  border-left-color: #f56c6c;
}

.status-timeline-item.completed .status-timeline-content {
  border-left-color: #909399;
}

.status-timeline-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-timeline-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.5;
}

.status-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.status-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.status-detail-label {
  color: #909399;
  font-weight: 500;
}

.status-detail-value {
  color: #606266;
  font-weight: 600;
}

.status-timeline-time {
  font-size: 12px;
  color: #c0c4cc;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.status-timeline-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: white;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #f0f8ff;
}

/* 空状态样式增强 */
.empty-history {
  text-align: center;
  padding: 40px 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 2px dashed #e4e7ed;
}

.empty-history-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.4;
  color: #c0c4cc;
}

.empty-history-text {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.empty-history-hint {
  font-size: 12px;
  color: #c0c4cc;
}

/* 操作记录增强样式 */
.operation-record {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.record-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.recent-operation-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.operation-timeline {
  position: relative;
}

.operation-timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #e4e7ed 0%, #67c23a 100%);
}

.operation-timeline-item {
  position: relative;
  padding-left: 60px;
  margin-bottom: 20px;
}

.operation-timeline-item:last-child {
  margin-bottom: 0;
}

.operation-timeline-marker {
  position: absolute;
  left: 10px;
  top: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}

.operation-timeline-marker.creation {
  background: #409eff;
  border-color: #409eff;
}

.operation-timeline-marker.approval {
  background: #67c23a;
  border-color: #67c23a;
}

.operation-timeline-marker.rejection {
  background: #f56c6c;
  border-color: #f56c6c;
}

.operation-timeline-marker.payment {
  background: #e6a23c;
  border-color: #e6a23c;
}

.operation-timeline-content {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.operation-timeline-item.approval .operation-timeline-content {
  border-left-color: #67c23a;
}

.operation-timeline-item.rejection .operation-timeline-content {
  border-left-color: #f56c6c;
}

.operation-timeline-item.payment .operation-timeline-content {
  border-left-color: #e6a23c;
}

.operation-timeline-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.operation-review-comment {
  background: #f0f9ff;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #409eff;
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
  font-style: italic;
}

.operation-review-comment::before {
  content: '💬 ';
  margin-right: 4px;
}

.operation-timeline-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}

.operation-payment-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.payment-participants-count {
  background: #f0f9ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #409eff;
  border: 1px solid #b3d8ff;
}
</style>