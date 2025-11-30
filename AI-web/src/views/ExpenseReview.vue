<template>
  <div class="expense-review">
    <!-- 列表视图 -->
    <div v-if="currentView === 'list'">
      <!-- 视图切换栏 -->
      <div class="view-tabs">
        <el-card class="tab-card">
          <div class="tab-header">
            <div class="tab-title">
              <el-icon class="tab-icon"><List /></el-icon>
              待审核费用列表
            </div>
            <div class="stats-summary">
              <el-statistic title="待审核总数" :value="pendingExpenses.length" />
              <el-statistic title="待审核总金额" :value="pendingTotalAmount" prefix="¥" :precision="2" />
              <el-statistic title="紧急费用" :value="urgentCount" />
            </div>
          </div>
          
          <!-- 搜索和筛选 -->
          <div class="search-section">
            <div class="search-bar">
              <el-input
                v-model="searchQuery"
                placeholder="搜索费用标题、申请人或描述..."
                :prefix-icon="Search"
                style="width: 300px"
                clearable
              />
              <el-select
                v-model="categoryFilter"
                placeholder="费用类别"
                style="width: 120px; margin-left: 12px"
                clearable
              >
                <el-option label="住宿费" value="accommodation" />
                <el-option label="水电费" value="utilities" />
                <el-option label="维修费" value="maintenance" />
                <el-option label="清洁费" value="cleaning" />
                <el-option label="其他" value="other" />
              </el-select>
              <el-select
                v-model="amountFilter"
                placeholder="金额范围"
                style="width: 120px; margin-left: 12px"
                clearable
              >
                <el-option label="≤¥100" value="small" />
                <el-option label="¥100-500" value="medium" />
                <el-option label="¥500-1000" value="large" />
                <el-option label=">¥1000" value="huge" />
              </el-select>
              <el-button 
                type="primary" 
                :icon="Refresh"
                @click="handleSearch"
                style="margin-left: 12px"
              >
                搜索
              </el-button>
              <el-button 
                :icon="Refresh"
                @click="resetFilters"
                style="margin-left: 8px"
              >
                重置
              </el-button>
            </div>
            
            <!-- 批量操作 -->
            <div class="batch-actions">
              <div class="selection-info">
                已选择 {{ selectedExpenses.length }} 条
                <el-link 
                  type="primary" 
                  @click="clearSelection"
                  v-if="selectedExpenses.length > 0"
                  style="margin-left: 8px"
                >
                  清除选择
                </el-link>
              </div>
              <div class="batch-buttons">
                <el-button 
                  type="success"
                  :icon="Check"
                  :disabled="selectedExpenses.length === 0"
                  @click="handleBatchApprove"
                  :loading="batchProcessing"
                >
                  批量通过 ({{ selectedExpenses.length }})
                </el-button>
                <el-button 
                  type="warning"
                  :icon="Close"
                  :disabled="selectedExpenses.length === 0"
                  @click="handleBatchReject"
                  :loading="batchProcessing"
                >
                  批量拒绝 ({{ selectedExpenses.length }})
                </el-button>
                <el-tag 
                  type="info" 
                  v-if="selectedTotalAmount > 0"
                  style="margin-left: 12px"
                >
                  选中总金额：¥{{ (selectedTotalAmount || 0).toFixed(2) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 费用列表 -->
      <div class="expense-list">
        <el-table
          v-loading="loading"
          :data="filteredPendingExpenses"
          @selection-change="handleSelectionChange"
          @select-all="handleSelectAll"
          stripe
          style="width: 100%"
          class="expense-table"
          :row-class-name="getRowClassName"
          row-key="id"
        >
          <el-table-column type="selection" width="55" :reserve-selection="true" @select="handleRowSelect" @select-all="handleSelectAll" />
          
          <el-table-column label="费用信息" min-width="200">
            <template #default="{ row }">
              <div class="expense-info-cell">
                <div class="expense-title">
                  <el-icon 
                    v-if="row.isUrgent" 
                    class="urgent-icon"
                    :icon="WarningFilled"
                    color="#f56c6c"
                  />
                  {{ row.title }}
                </div>
                <div class="expense-desc">{{ truncateText(row.description, 50) }}</div>
                <div class="expense-meta">
                  <el-tag size="small" :type="getCategoryType(row.category)">
                    {{ getCategoryText(row.category) }}
                  </el-tag>
                  <span class="applicant-name">{{ row.applicant }}</span>
                  <span class="apply-date">{{ formatDate(row.date) }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="费用金额" width="120" align="center">
            <template #default="{ row }">
              <div class="amount-cell">
                <span class="amount-value">¥{{ (row.amount || 0).toFixed(2) }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="申请人" width="150">
            <template #default="{ row }">
              <div class="applicant-cell">
                <el-avatar size="small" class="applicant-avatar">
                  {{ getInitials(row.applicant) }}
                </el-avatar>
                <div class="applicant-details">
                  <div class="applicant-name">{{ row.applicant }}</div>
                  <div class="applicant-contact">{{ row.phone }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="申请日期" width="120" align="center">
            <template #default="{ row }">
              <span class="apply-date">{{ formatDate(row.date) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="280" align="center" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="small"
                  :icon="EditPen"
                  @click.stop="handleReview(row)"
                  v-if="row.status === 'pending'"
                >
                  审核
                </el-button>
                <el-button 
                  type="success" 
                  size="small"
                  :icon="Check"
                  @click.stop="handleQuickApproveSingle(row)"
                  :disabled="row.status !== 'pending'"
                >
                  快速通过
                </el-button>
                <el-button 
                  type="warning" 
                  size="small"
                  :icon="Close"
                  @click.stop="handleQuickRejectSingle(row)"
                  :disabled="row.status !== 'pending'"
                >
                  快速拒绝
                </el-button>
                <el-button 
                  type="info" 
                  size="small"
                  :icon="Refresh"
                  @click.stop="handleResubmit(row)"
                  v-if="row.status === 'rejected' && canResubmitExpense(row.id)"
                >
                  重新提交
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 批量驳回对话框 -->
      <el-dialog
        v-model="batchRejectVisible"
        title="批量驳回原因选择"
        width="500px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <div class="batch-reject-dialog-content">
          <div class="form-item">
            <label class="form-label">
              <span class="required">*</span>
              驳回原因：
            </label>
            <el-select
              v-model="batchRejectForm.reason"
              placeholder="请选择驳回原因"
              style="width: 100%;"
            >
              <el-option label="材料不完整" value="incomplete_materials"></el-option>
              <el-option label="费用金额异常" value="amount_issue"></el-option>
              <el-option label="预算超支" value="budget_exceeded"></el-option>
              <el-option label="费用用途不明确" value="unclear_purpose"></el-option>
              <el-option label="时间不符合要求" value="timing_issue"></el-option>
              <el-option label="其他原因" value="other"></el-option>
              <el-option label="自定义原因" value="custom"></el-option>
            </el-select>
          </div>
          
          <div class="form-item" v-if="batchRejectForm.reason === 'custom'">
            <label class="form-label">
              <span class="required">*</span>
              自定义原因：
            </label>
            <el-input
              v-model="batchRejectForm.customReason"
              type="textarea"
              :rows="3"
              placeholder="请输入驳回原因"
              style="width: 100%;"
              maxlength="200"
              show-word-limit
            ></el-input>
          </div>
          
          <div class="selection-summary">
            将拒绝 {{ selectedExpenses.length }} 条费用申请
          </div>
        </div>
        
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="batchRejectVisible = false" :disabled="batchProcessing">
              取消
            </el-button>
            <el-button 
              type="warning" 
              @click="confirmBatchReject"
              :loading="batchProcessing"
              :disabled="!canSubmitBatchReject"
            >
              确认驳回
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 重新提交对话框 -->
      <el-dialog
        v-model="resubmissionVisible"
        title="重新提交费用申请"
        width="600px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <div class="resubmission-dialog-content">
          <div class="expense-info" v-if="selectedExpense">
            <el-alert
              title="重新提交提醒"
              type="info"
              :closable="false"
              show-icon
            >
              您可以补充缺失材料或更新内容后重新提交申请
            </el-alert>
            
            <div class="expense-summary">
              <h4>原费用信息</h4>
              <p><strong>标题：</strong>{{ selectedExpense.title }}</p>
              <p><strong>申请人：</strong>{{ selectedExpense.applicant }}</p>
              <p><strong>金额：</strong>¥{{ (selectedExpense.amount || 0).toFixed(2) }}</p>
            </div>
          </div>
          
          <div class="form-item">
            <label class="form-label">
              <span class="required">*</span>
              补充材料：
            </label>
            <el-input
              v-model="resubmissionForm.additionalMaterials"
              type="textarea"
              :rows="3"
              placeholder="请详细说明补充的材料内容..."
              style="width: 100%;"
              maxlength="300"
              show-word-limit
            ></el-input>
          </div>
          
          <div class="form-item">
            <label class="form-label">
              <span class="required">*</span>
              更新说明：
            </label>
            <el-input
              v-model="resubmissionForm.updatedDescription"
              type="textarea"
              :rows="3"
              placeholder="请说明对原申请内容的修改或补充..."
              style="width: 100%;"
              maxlength="300"
              show-word-limit
            ></el-input>
          </div>
          
          <div class="form-item">
            <label class="form-label">
              补充信息：
            </label>
            <el-input
              v-model="resubmissionForm.supplementaryInfo"
              type="textarea"
              :rows="2"
              placeholder="其他需要说明的信息..."
              style="width: 100%;"
              maxlength="200"
              show-word-limit
            ></el-input>
          </div>
        </div>
        
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="resubmissionVisible = false">
              取消
            </el-button>
            <el-button 
              type="primary" 
              @click="confirmResubmission"
              :disabled="!canResubmit"
            >
              确认重新提交
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>

    <!-- 审核详情视图 -->
    <div v-else-if="currentView === 'review'" class="review-detail">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <el-button 
            type="primary" 
            :icon="ArrowLeft" 
            @click="currentView = 'list'"
            class="back-btn"
          >
            返回列表
          </el-button>
          <h1 class="page-title">
            <el-icon class="title-icon"><CircleCheck /></el-icon>
            费用审核详情
          </h1>
        </div>
        <div class="header-actions">
          <el-button 
            type="info" 
            :icon="View"
            @click="handlePreview"
            class="preview-btn"
          >
            预览
          </el-button>
          <el-button 
            type="success" 
            :icon="Check"
            @click="handleQuickApprove"
            :loading="submitting"
            class="quick-approve-btn"
          >
            快速通过
          </el-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-section">
        <el-skeleton :rows="8" animated />
      </div>

      <!-- 审核内容 -->
      <div v-else class="review-content">
        <!-- 费用信息卡片 -->
        <el-card class="info-card expense-info">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Document /></el-icon>
                费用信息
              </span>
              <el-tag 
                :type="getStatusType(selectedExpense?.status)" 
                size="large"
                class="status-tag"
              >
                {{ getStatusText(selectedExpense?.status) }}
              </el-tag>
            </div>
          </template>

          <div class="expense-summary">
            <div class="expense-amount">
              <span class="amount-label">申请费用</span>
              <span class="amount-value">{{ formatCurrency(selectedExpense?.amount || 0) }}</span>
            </div>
            <div class="expense-meta">
              <div class="meta-item">
                <span class="meta-label">申请人：</span>
                <span class="meta-value">{{ selectedExpense?.applicant || '-' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">申请日期：</span>
                <span class="meta-value">{{ formatDate(selectedExpense?.date) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">紧急程度：</span>
                <el-tag :type="selectedExpense?.isUrgent ? 'danger' : 'info'" size="small">
                  {{ selectedExpense?.isUrgent ? '紧急' : '普通' }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="expense-details">
            <h3 class="section-title">
              <el-icon><InfoFilled /></el-icon>
              费用详情
            </h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">费用标题</div>
                <div class="detail-value">{{ selectedExpense?.title || '-' }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">费用类别</div>
                <div class="detail-value">
                  <el-tag :type="getCategoryType(selectedExpense?.category)" size="small">
                    {{ getCategoryText(selectedExpense?.category) }}
                  </el-tag>
                </div>
              </div>
              <div class="detail-item full-width">
                <div class="detail-label">费用描述</div>
                <div class="detail-value description">{{ selectedExpense?.description || '-' }}</div>
              </div>
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

          <div class="applicant-summary">
            <div class="applicant-avatar">
              <div class="avatar-placeholder">
                {{ getInitials(selectedExpense?.applicant) }}
              </div>
            </div>
            <div class="applicant-details">
              <div class="applicant-name">{{ selectedExpense?.applicant || '-' }}</div>
              <div class="applicant-contact">
                {{ selectedExpense?.phone || '-' }} | {{ selectedExpense?.department || '-' }}
              </div>
              <div class="applicant-position">{{ selectedExpense?.position || '-' }}</div>
            </div>
          </div>
        </el-card>

        <!-- 审核操作卡片 -->
        <el-card class="info-card review-action">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><EditPen /></el-icon>
                审核操作
              </span>
            </div>
          </template>

          <div class="review-form">
            <!-- 审核状态选择 -->
            <div class="form-section">
              <div class="form-label">
                <span class="required">*</span>
                审核结论
              </div>
              <div class="status-options">
                <el-radio-group v-model="reviewForm.status" @change="handleStatusChange">
                  <el-radio value="approved" size="large" class="status-radio approved">
                    <div class="radio-content">
                      <el-icon><CircleCheck /></el-icon>
                      <span>通过</span>
                    </div>
                  </el-radio>
                  <el-radio value="rejected" size="large" class="status-radio rejected">
                    <div class="radio-content">
                      <el-icon><CircleClose /></el-icon>
                      <span>拒绝</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </div>
            </div>

            <!-- 驳回原因选择器（仅拒绝时显示） -->
            <div v-if="reviewForm.status === 'rejected'" class="form-section">
              <div class="form-label">
                <span class="required">*</span>
                驳回原因
              </div>
              <div class="reject-reasons">
                <el-select
                  v-model="reviewForm.rejectReason"
                  placeholder="请选择驳回原因"
                  class="reject-reason-select"
                  @change="handleRejectReasonChange"
                >
                  <el-option 
                    v-for="reason in getRejectReasons()" 
                    :key="reason.value"
                    :label="reason.label"
                    :value="reason.value"
                  />
                </el-select>
                
                <!-- 自定义驳回原因 -->
                <el-input
                  v-if="reviewForm.rejectReason === 'custom'"
                  v-model="reviewForm.customRejectReason"
                  type="textarea"
                  :rows="2"
                  placeholder="请详细说明驳回原因..."
                  class="custom-reason-input"
                  maxlength="200"
                  show-word-limit
                />
              </div>
            </div>

            <!-- 审核建议 -->
            <div class="form-section">
              <div class="form-label">
                审核建议
              </div>
              <el-input
                v-model="reviewForm.suggestion"
                type="textarea"
                :rows="3"
                placeholder="请输入审核建议..."
                class="suggestion-input"
                maxlength="200"
                show-word-limit
              />
            </div>

            <!-- 快速模板 -->
            <div class="form-section" v-if="reviewForm.status">
              <div class="form-label">快速模板</div>
              <div class="template-buttons">
                <el-button 
                  v-for="template in getQuickTemplates()" 
                  :key="template.key"
                  size="small"
                  @click="applyTemplate(template.content)"
                  class="template-btn"
                >
                  {{ template.key }}
                </el-button>
              </div>
            </div>

            <!-- 审核备注 -->
            <div class="form-section">
              <div class="form-label">
                <span class="required">*</span>
                审核备注
              </div>
              <el-input
                v-model="reviewForm.comment"
                type="textarea"
                :rows="4"
                placeholder="请详细说明审核意见..."
                class="comment-input"
                maxlength="500"
                show-word-limit
              />
            </div>

            <!-- 操作按钮 -->
            <div class="form-actions">
              <el-button 
                size="large"
                @click="handleSaveDraft"
                :loading="saving"
                class="draft-btn"
              >
                <el-icon><DocumentCopy /></el-icon>
                保存草稿
              </el-button>
              <el-button 
                size="large"
                type="danger"
                @click="handleReject"
                :loading="submitting"
                :disabled="!canSubmit"
                class="reject-btn"
              >
                <el-icon><CircleClose /></el-icon>
                拒绝申请
              </el-button>
              <el-button 
                size="large"
                type="success"
                @click="handleApprove"
                :loading="submitting"
                :disabled="!canSubmit"
                class="approve-btn"
              >
                <el-icon><CircleCheck /></el-icon>
                通过审核
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 审核记录追踪卡片 -->
        <el-card class="info-card review-history" v-if="selectedExpense?.reviewHistory?.length > 0">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Clock /></el-icon>
                审核记录追踪
              </span>
              <el-tag size="small" type="info">
                共 {{ selectedExpense.reviewHistory.length }} 条记录
              </el-tag>
            </div>
          </template>

          <div class="timeline">
            <div 
              v-for="(history, index) in selectedExpense.reviewHistory" 
              :key="history.time + '-' + index"
              class="timeline-item"
              :class="getHistoryItemClass(history)"
            >
              <div class="timeline-marker" :class="history.status"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-title">{{ history.action }}</span>
                  <span class="timeline-time">{{ formatDateTime(history.time) }}</span>
                </div>
                <div class="timeline-description">
                  {{ history.reviewer }} 
                  <span v-if="history.status === 'approved'" class="status-approved">通过</span>
                  <span v-else-if="history.status === 'rejected'" class="status-rejected">拒绝</span>
                  了申请
                </div>
                <div class="timeline-comment" v-if="history.comment">
                  <el-icon class="comment-icon"><ChatDotRound /></el-icon>
                  "{{ history.comment }}"
                </div>
                <div class="timeline-meta">
                  <el-icon class="meta-icon"><User /></el-icon>
                  <span class="operator">{{ history.reviewer }}</span>
                  <el-icon class="meta-icon"><Clock /></el-icon>
                  <span class="time">{{ formatDateTime(history.time) }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 附件列表卡片 -->
        <el-card class="info-card attachments-list" v-if="selectedExpense?.attachments?.length > 0">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Paperclip /></el-icon>
                附件列表
              </span>
            </div>
          </template>

          <div class="attachments-grid">
            <div 
              v-for="(attachment, index) in selectedExpense.attachments" 
              :key="attachment + '-' + index"
              class="attachment-item"
              @click="handlePreviewAttachment(attachment)"
            >
              <el-icon class="attachment-icon"><Document /></el-icon>
              <div class="attachment-info">
                <div class="attachment-name">{{ getFileName(attachment) }}</div>
                <div class="attachment-size">{{ getRandomFileSize() }}</div>
              </div>
              <div class="attachment-actions">
                <el-button 
                  type="primary" 
                  :icon="View" 
                  size="small"
                  circle
                  @click.stop="handlePreviewAttachment(attachment)"
                />
                <el-button 
                  type="success" 
                  :icon="Download" 
                  size="small"
                  circle
                  @click.stop="handleDownloadAttachment(attachment)"
                />
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, CircleCheck, Clock, Check, Document, User, EditPen,
  InfoFilled, CircleClose, DocumentCopy, Paperclip, View, Download,
  Search, Refresh, List, WarningFilled, ChatDotRound, Close
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 路由
const route = useRoute()
const router = useRouter()

// 接口定义
interface ReviewHistoryItem {
  action: string
  reviewer: string
  status: 'submitted' | 'approved' | 'rejected' | 'resubmitted'
  time: string
  comment?: string
  suggestion?: string
  rejectReason?: string
  customReason?: string
}

interface ExpenseItem {
  id: number
  title: string
  description: string
  amount: number
  category: 'accommodation' | 'utilities' | 'maintenance' | 'cleaning' | 'other'
  applicant: string
  phone: string
  department: string
  position: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
  isUrgent: boolean
  attachments: string[]
  reviewHistory: ReviewHistoryItem[]
  createdAt: string
  updatedAt: string
  reviewer?: string
  reviewDate?: string
  reviewComment?: string
  isResubmitted?: boolean
  resubmissionCount?: number
  originalRejectId?: number
  originalId?: number
}

interface RejectionNotification {
  id: number
  expenseId: number
  expenseTitle: string
  applicant: string
  reason: string
  customReason?: string
  suggestion: string
  status: 'rejected'
  rejectedAt: string
  reviewer: string
  isRead: boolean
  canResubmit: boolean
  resubmissionCount: number
  originalRejectDate?: string
  originalRejectComment?: string
}

// 重新提交表单接口
interface ResubmissionForm {
  additionalMaterials: string
  updatedDescription: string
  supplementaryInfo: string
}

// 审核表单接口
interface ReviewForm {
  status: '' | 'approved' | 'rejected'
  suggestion: string
  comment: string
  isUrgent: boolean
  rejectReason: string
  customRejectReason: string
}

interface BatchRejectForm {
  reason: string
  customReason: string
  suggestion: string
}

// 数据状态
const loading = ref<boolean>(true)
const submitting = ref<boolean>(false)
const saving = ref<boolean>(false)
const batchProcessing = ref<boolean>(false)
const expenseData = ref<ExpenseItem | null>(null)

// 视图管理
const currentView = ref<'list' | 'review'>('list')
const selectedExpense = ref<ExpenseItem | null>(null)

// 表单数据
const reviewForm = ref<{
  status: '' | 'approved' | 'rejected'
  suggestion: string
  comment: string
  isUrgent: boolean
  rejectReason: string
  customRejectReason: string
}>({
  status: '',
  suggestion: '',
  comment: '',
  isUrgent: false,
  rejectReason: '',
  customRejectReason: ''
})

// 搜索和筛选
const searchQuery = ref<string>('')
const categoryFilter = ref<string>('')
const amountFilter = ref<string>('')

// 选择管理
const selectedExpenses = ref<ExpenseItem[]>([])

// 通知系统相关状态
const notificationSystem = ref({
  rejectedNotifications: [] as RejectionNotification[], // 存储被拒绝费用的通知
  resubmittedExpenses: [] as ExpenseItem[] // 存储重新提交的费用
})

// 重新提交相关状态
const resubmissionVisible = ref<boolean>(false)
const resubmissionForm = reactive<ResubmissionForm>({
  additionalMaterials: '',
  updatedDescription: '',
  supplementaryInfo: ''
})

// 重新提交验证计算属性
const canResubmit = computed((): boolean => {
  return resubmissionForm.additionalMaterials.trim().length > 0 && 
         resubmissionForm.updatedDescription.trim().length > 0
})

// 费用数据
const pendingExpenses = ref<ExpenseItem[]>([
  {
    id: 1,
    title: '宿舍水电费',
    description: '2024年12月份水电费缴纳，包含电费120.50元和水费36.00元',
    amount: 156.50,
    category: 'utilities',
    applicant: '张三',
    phone: '13800138001',
    department: '学生处',
    position: '宿舍管理员',
    date: '2024-12-15',
    status: 'pending',
    isUrgent: false,
    attachments: ['水电费发票.jpg', '缴费凭证.pdf', '预算说明.xlsx'],
    reviewHistory: [
      {
        action: '费用申请',
        reviewer: '张三',
        status: 'submitted',
        comment: '',
        time: '2024-12-15T10:30:00'
      }
    ],
    createdAt: '2024-12-15T10:30:00',
    updatedAt: '2024-12-16T14:20:00'
  },
  {
    id: 2,
    title: '办公室清洁费',
    description: '年终大扫除清洁用品采购及清洁服务费',
    amount: 850.00,
    category: 'cleaning',
    applicant: '李四',
    phone: '13900139002',
    department: '行政部',
    position: '行政专员',
    date: '2024-12-18',
    status: 'pending',
    isUrgent: true,
    attachments: ['清洁用品清单.pdf', '服务合同.pdf'],
    reviewHistory: [
      {
        action: '费用申请',
        reviewer: '李四',
        status: 'submitted',
        comment: '',
        time: '2024-12-18T09:15:00'
      }
    ],
    createdAt: '2024-12-18T09:15:00',
    updatedAt: '2024-12-18T09:15:00'
  },
  {
    id: 3,
    title: '会议室设备维修',
    description: '投影仪灯泡更换及音响设备检修费用',
    amount: 320.00,
    category: 'maintenance',
    applicant: '王五',
    phone: '13700137003',
    department: '技术部',
    position: '技术支持',
    date: '2024-12-20',
    status: 'pending',
    isUrgent: false,
    attachments: ['维修报价单.pdf', '设备检测报告.pdf'],
    reviewHistory: [
      {
        action: '费用申请',
        reviewer: '王五',
        status: 'submitted',
        comment: '',
        time: '2024-12-20T14:20:00'
      }
    ],
    createdAt: '2024-12-20T14:20:00',
    updatedAt: '2024-12-20T14:20:00'
  },
  {
    id: 4,
    title: '员工宿舍床位费',
    description: '新员工入职宿舍床位费用及押金',
    amount: 450.00,
    category: 'accommodation',
    applicant: '赵六',
    phone: '13600136004',
    department: '人事部',
    position: '人事专员',
    date: '2024-12-21',
    status: 'pending',
    isUrgent: false,
    attachments: ['宿舍管理协议.pdf', '缴费凭证.jpg'],
    reviewHistory: [
      {
        action: '费用申请',
        reviewer: '赵六',
        status: 'submitted',
        comment: '',
        time: '2024-12-21T10:45:00'
      }
    ],
    createdAt: '2024-12-21T10:45:00',
    updatedAt: '2024-12-21T10:45:00'
  },
  {
    id: 5,
    title: '节日活动用品',
    description: '春节活动装饰用品及礼品采购费用',
    amount: 1280.00,
    category: 'other',
    applicant: '钱七',
    phone: '13500135005',
    department: '市场部',
    position: '活动专员',
    date: '2024-12-22',
    status: 'pending',
    isUrgent: false,
    attachments: ['活动方案.pdf', '采购清单.xlsx', '预算表.pdf'],
    reviewHistory: [
      {
        action: '费用申请',
        reviewer: '钱七',
        status: 'submitted',
        comment: '',
        time: '2024-12-22T16:30:00'
      }
    ],
    createdAt: '2024-12-22T16:30:00',
    updatedAt: '2024-12-22T16:30:00'
  }
])

// 计算属性
const canSubmit = computed(() => {
  if (reviewForm.value.status === 'rejected') {
    return reviewForm.value.status && 
           reviewForm.value.comment.trim().length > 0 && 
           (reviewForm.value.rejectReason || reviewForm.value.customRejectReason.trim().length > 0)
  }
  return reviewForm.value.status && reviewForm.value.comment.trim().length > 0
})

// 审核状态管理：确保已通过审核的费用不会再次进入审核流程
const filteredPendingExpenses = computed(() => {
  let filtered = [...pendingExpenses.value]

  // 只显示待审核的费用，排除已通过和已拒绝的费用
  filtered = filtered.filter(expense => expense.status === 'pending')

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(expense => 
      expense.title.toLowerCase().includes(query) ||
      expense.applicant.toLowerCase().includes(query) ||
      expense.description.toLowerCase().includes(query)
    )
  }

  // 类别过滤
  if (categoryFilter.value) {
    filtered = filtered.filter(expense => expense.category === categoryFilter.value)
  }

  // 金额过滤
  if (amountFilter.value) {
    filtered = filtered.filter(expense => {
      switch (amountFilter.value) {
        case 'small': return expense.amount <= 100
        case 'medium': return expense.amount > 100 && expense.amount <= 500
        case 'large': return expense.amount > 500 && expense.amount <= 1000
        case 'huge': return expense.amount > 1000
        default: return true
      }
    })
  }

  return filtered
})

const pendingTotalAmount = computed(() => {
  return filteredPendingExpenses.value.reduce((total, expense) => total + expense.amount, 0)
})

const selectedTotalAmount = computed(() => {
  return selectedExpenses.value.reduce((total, expense) => total + expense.amount, 0)
})

const urgentCount = computed(() => {
  return filteredPendingExpenses.value.filter(expense => expense.isUrgent).length
})

// 生命周期
onMounted(() => {
  loadExpenseData()
})

// 方法
const loadExpenseData = (): void => {
  loading.value = true
  
  // 模拟API调用
  setTimeout(() => {
    // 如果有传入ID，使用该ID的数据；否则使用第一个
    const expenseId = route.query.id
    if (expenseId) {
      selectedExpense.value = pendingExpenses.value.find(expense => expense.id == expenseId) || pendingExpenses.value[0]
    } else {
      selectedExpense.value = pendingExpenses.value[0]
    }
    expenseData.value = selectedExpense.value
    loading.value = false
  }, 800)
}

// 费用列表相关方法
const handleSearch = (): void => {
  console.log('搜索条件:', searchQuery.value, categoryFilter.value, amountFilter.value)
}

const resetFilters = (): void => {
  searchQuery.value = ''
  categoryFilter.value = ''
  amountFilter.value = ''
}

const handleRowSelect = (selection: ExpenseItem[], row: ExpenseItem): void => {
  console.log('行选择:', row.title, '已', selection.includes(row) ? '选中' : '取消选择')
}

const handleSelectionChange = (selection: ExpenseItem[]): void => {
  selectedExpenses.value = selection
  console.log('选择变化:', selectedExpenses.value.length, '条记录')
}

const clearSelection = (): void => {
  selectedExpenses.value = []
}

// 审核拒绝通知系统
const sendRejectionNotification = (expense: ExpenseItem, reason: string, suggestion: string, customReason?: string): void => {
  const notification = {
    id: Date.now(),
    expenseId: expense.id,
    expenseTitle: expense.title,
    applicant: expense.applicant,
    reason: reason,
    customReason: customReason || '',
    suggestion: suggestion,
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    reviewer: expense.reviewer || '当前用户',
    isRead: false,
    canResubmit: true,
    resubmissionCount: 0,
    originalRejectDate: expense.reviewDate,
    originalRejectComment: expense.reviewComment
  }
  
  // 将通知添加到系统
  notificationSystem.value.rejectedNotifications.push(notification)
}



// 审核拒绝通知系统
const sendRejectionNotification = (expense: ExpenseItem, reason: string, suggestion: string, customReason?: string): RejectionNotification => {
  const notification = {
    id: Date.now(),
    expenseId: expense.id,
    expenseTitle: expense.title,
    applicant: expense.applicant,
    reason: reason,
    customReason: customReason || '',
    suggestion: suggestion,
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    reviewer: expense.reviewer || '当前用户',
    isRead: false,
    canResubmit: true,
    resubmissionCount: 0,
    originalRejectDate: expense.reviewDate,
    originalRejectComment: expense.reviewComment
  }
  
  // 将通知添加到系统
  notificationSystem.value.rejectedNotifications.push(notification)
  
  // 模拟发送通知给申请人
  console.log('通知已发送:', notification)
  ElMessage.success(`已向 ${expense.applicant} 发送拒绝通知`)
  
  return notification
}

// 检查费用是否可以被重新提交
const canResubmitExpense = (expenseId: number): boolean => {
  const notification = notificationSystem.value.rejectedNotifications.find(n => n.expenseId === expenseId)
  return notification && notification.canResubmit && notification.resubmissionCount < 3 // 最多重新提交3次
}

// 处理重新提交
const handleResubmit = (expense: ExpenseItem): void => {
  if (!canResubmitExpense(expense.id)) {
    ElMessage.warning('该费用已达到最大重新提交次数或不支持重新提交')
    return
  }
  
  selectedExpense.value = expense
  resubmissionVisible.value = true
}

// 确认重新提交
const confirmResubmission = async (): Promise<void> => {
  if (!selectedExpense.value) return
  
  // 更新费用状态为重新提交
  selectedExpense.value.status = 'pending'
  selectedExpense.value.isResubmitted = true
  selectedExpense.value.resubmissionCount = (selectedExpense.value.resubmissionCount || 0) + 1
  selectedExpense.value.originalRejectId = selectedExpense.value.id
  
  // 添加重新提交的审核历史
  if (!selectedExpense.value.reviewHistory) {
    selectedExpense.value.reviewHistory = []
  }
  
  selectedExpense.value.reviewHistory.push({
    action: '重新提交',
    reviewer: selectedExpense.value.applicant,
    status: 'resubmitted',
    comment: `补充材料：${resubmissionForm.additionalMaterials}`,
    time: new Date().toISOString(),
    suggestion: `更新说明：${resubmissionForm.updatedDescription}`
  })
  
  // 更新通知状态
  const notification = notificationSystem.value.rejectedNotifications.find(n => n.expenseId === selectedExpense.value.id)
  if (notification) {
    notification.resubmissionCount++
    notification.canResubmit = notification.resubmissionCount < 3
  }
  
  // 将重新提交的费用添加到待审核列表
  pendingExpenses.value.push({
    ...selectedExpense.value,
    id: Date.now(), // 重新分配ID
    originalId: selectedExpense.value.id
  })
  
  ElMessage.success('费用已重新提交，等待审核')
  resubmissionVisible.value = false
  
  // 重置表单
  resubmissionForm.additionalMaterials = ''
  resubmissionForm.updatedDescription = ''
  resubmissionForm.supplementaryInfo = ''
}

const handleReview = (expense: ExpenseItem): void => {
  selectedExpense.value = expense
  currentView.value = 'review'
}

const handleQuickApproveSingle = async (expense: ExpenseItem): Promise<void> => {
  if (expense.status !== 'pending') {
    ElMessage.warning('该费用申请已处理')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要快速通过"${expense.title}"吗？`,
      '快速通过确认',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success'
      }
    )

    // 快速通过操作
    await performQuickApproval(expense)
    ElMessage.success('费用申请已快速通过！')

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('快速通过操作失败')
    }
  }
}

const handleQuickRejectSingle = async (expense: ExpenseItem): Promise<void> => {
  if (expense.status !== 'pending') {
    ElMessage.warning('该费用申请已处理')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要拒绝"${expense.title}"吗？`,
      '快速拒绝确认',
      {
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 快速拒绝操作
    expense.status = 'rejected'
    expense.reviewer = '当前用户'
    expense.reviewDate = new Date().toISOString().split('T')[0]
    
    if (!expense.reviewHistory) {
      expense.reviewHistory = []
    }
    
    expense.reviewHistory.push({
      action: '快速拒绝',
      status: 'rejected',
      reviewer: '当前用户',
      time: new Date().toISOString(),
      comment: '快速拒绝操作',
      suggestion: '经审核，该费用申请不符合相关标准，拒绝通过。'
    })

    ElMessage.success('费用申请已拒绝！')

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('快速拒绝操作失败')
    }
  }
}

// 批量审核方法
const handleBatchApprove = async (): Promise<void> => {
  if (selectedExpenses.value.length === 0) {
    ElMessage.warning('请先选择要审核的费用')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量通过选中的 ${selectedExpenses.value.length} 条费用申请吗？`,
      '批量通过确认',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success'
      }
    )

    batchProcessing.value = true
    
    // 批量处理
    for (const expense of selectedExpenses.value) {
      await performQuickApproval(expense)
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    ElMessage.success(`成功批量通过 ${selectedExpenses.value.length} 条费用申请！`)
    selectedExpenses.value = []

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量通过操作失败')
    }
  } finally {
    batchProcessing.value = false
  }
}

// 批量驳回相关状态和逻辑
const batchRejectVisible = ref(false)
const batchRejectForm = reactive<BatchRejectForm>({
  reason: '',
  customReason: '',
  suggestion: ''
})

// 批量驳回表单验证
const canSubmitBatchReject = computed(() => {
  if (!batchRejectForm.reason) return false
  if (batchRejectForm.reason === 'custom' && !batchRejectForm.customReason.trim()) return false
  return true
})

const handleBatchReject = async (): Promise<void> => {
  if (selectedExpenses.value.length === 0) {
    ElMessage.warning('请先选择要审核的费用')
    return
  }

  // 重置表单
  batchRejectForm.reason = ''
  batchRejectForm.customReason = ''
  batchRejectForm.suggestion = ''

  // 显示驳回原因选择对话框
  batchRejectVisible.value = true
}

const confirmBatchReject = async (): Promise<void> => {
  if (!canSubmitBatchReject.value) {
    ElMessage.warning('请完善驳回信息')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量驳回选中的 ${selectedExpenses.value.length} 条费用申请吗？`,
      '批量驳回确认',
      {
        confirmButtonText: '确认驳回',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    batchProcessing.value = true
    batchRejectVisible.value = false

    try {
      // 生成驳回建议
      const reasonMap: { [key: string]: string } = {
        incomplete_materials: '材料不完整，请补充完整后重新申请。',
        amount_issue: '费用金额存在异常，请核实后重新申请。',
        budget_exceeded: '费用超出预算，请重新规划后申请。',
        unclear_purpose: '费用用途不明确，请详细说明具体用途。',
        timing_issue: '申请时间不符合要求，请按期申请。',
        other: '该申请不符合相关标准，请重新准备。',
        custom: batchRejectForm.customReason
      }
      
      batchRejectForm.suggestion = reasonMap[batchRejectForm.reason] || '该申请不符合相关标准，请重新准备。'

      // 批量处理
      for (const expense of selectedExpenses.value) {
        await performBatchReject(expense, batchRejectForm)
        // 模拟处理延迟
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      ElMessage.success(`成功批量拒绝 ${selectedExpenses.value.length} 条费用申请！`)
      selectedExpenses.value = []

    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('批量拒绝操作失败')
      }
    } finally {
      batchProcessing.value = false
    }

  } catch {
    // 用户取消
  }
}

const performBatchReject = async (expense: ExpenseItem, rejectForm: BatchRejectForm): Promise<void> => {
  // 更新费用状态
  expense.status = 'rejected'
  expense.reviewer = '当前用户'
  expense.reviewDate = new Date().toISOString().split('T')[0]
  expense.reviewComment = `批量拒绝操作 - 驳回原因：${rejectForm.reason}`
  
  if (!expense.reviewHistory) {
    expense.reviewHistory = []
  }
  
  // 驳回原因标签接口定义
  interface RejectReasonLabels {
    incomplete_materials: string
    amount_issue: string
    budget_exceeded: string
    unclear_purpose: string
    timing_issue: string
    other: string
    custom: string
  }

  // 获取原因标签
  const reasonLabels: RejectReasonLabels = {
    incomplete_materials: '材料不完整',
    amount_issue: '费用金额异常',
    budget_exceeded: '预算超支',
    unclear_purpose: '费用用途不明确',
    timing_issue: '时间不符合要求',
    other: '其他原因',
    custom: '自定义原因'
  }
  
  const reasonLabel = reasonLabels[rejectForm.reason] || '其他原因'
  const suggestion = rejectForm.suggestion || '请按照审核要求补充或修正相关材料'
  
  expense.reviewHistory.push({
    action: '批量拒绝',
    status: 'rejected',
    reviewer: '当前用户',
    time: new Date().toISOString(),
    comment: `批量拒绝操作 - 驳回原因：${reasonLabel}`,
    suggestion: rejectForm.suggestion,
    rejectReason: rejectForm.reason,
    customReason: rejectForm.customReason
  })
  
  // 自动发送拒绝通知
  sendRejectionNotification(expense, reasonLabel, suggestion, rejectForm.customReason)
  
  // 从待审核列表中移除已拒绝的费用
  pendingExpenses.value = pendingExpenses.value.filter(item => item.id !== expense.id)

  // 自动发送拒绝通知给申请人
  sendRejectionNotification(
    expense,
    reasonLabel,
    suggestion,
    rejectForm.customReason
  )

  // 从待审核列表中移除已拒绝的费用，确保不会再次进入审核流程
  pendingExpenses.value = pendingExpenses.value.filter(p => p.id !== expense.id)
}

const performQuickApproval = async (expense: ExpenseItem): Promise<void> => {
  expense.status = 'approved'
  expense.reviewer = '当前用户'
  expense.reviewDate = new Date().toISOString().split('T')[0]
  
  if (!expense.reviewHistory) {
    expense.reviewHistory = []
  }
  
  expense.reviewHistory.push({
    action: '快速通过',
    status: 'approved',
    reviewer: '当前用户',
    time: new Date().toISOString(),
    comment: `${expense.applicant}的费用申请快速通过。`,
    suggestion: getQuickApprovalSuggestion(expense)
  })
}

// 驳回原因相关方法
const getRejectReasons = (): { label: string; value: string }[] => {
  return [
    { label: '材料不完整', value: 'incomplete_materials' },
    { label: '费用金额异常', value: 'amount_issue' },
    { label: '预算超支', value: 'budget_exceeded' },
    { label: '费用用途不明确', value: 'unclear_purpose' },
    { label: '时间不符合要求', value: 'timing_issue' },
    { label: '其他原因', value: 'other' },
    { label: '自定义原因', value: 'custom' }
  ]
}

const handleRejectReasonChange = (reason: string): void => {
  if (reason !== 'custom') {
    reviewForm.value.customRejectReason = ''
    // 自动生成建议
    const reasonMap: { [key: string]: string } = {
      incomplete_materials: '材料不完整，请补充完整后重新申请。',
      amount_issue: '费用金额存在异常，请核实后重新申请。',
      budget_exceeded: '费用超出预算，请重新规划后申请。',
      unclear_purpose: '费用用途不明确，请详细说明具体用途。',
      timing_issue: '申请时间不符合要求，请按期申请。',
      other: '该申请不符合相关标准，请重新准备。'
    }
    reviewForm.value.suggestion = reasonMap[reason] || '该申请不符合相关标准，请重新准备。'
  }
}

// 审核建议相关方法
const getQuickApprovalSuggestion = (expense: ExpenseItem): string => {
  const amount = expense.amount
  const category = expense.category
  const isUrgent = expense.isUrgent

  if (amount <= 100) {
    return '费用金额较小，符合报销标准，同意通过。'
  } else if (amount <= 500) {
    return '费用金额合理，支出符合相关规定，同意通过。'
  } else if (amount <= 1000) {
    if (category === 'utilities') {
      return '水电费支出合理，符合预算安排，同意通过。'
    } else if (category === 'supplies') {
      return '办公用品采购合理，价格适中，同意通过。'
    } else {
      return '费用申请材料齐全，符合报销标准，同意通过。'
    }
  } else {
    if (isUrgent) {
      return '紧急费用处理及时，支出必要，同意通过。建议加强后续预算管理。'
    } else {
      return '大额费用申请理由充分，支出合理，同意通过。'
    }
  }
}

// 审核历史项接口
interface ReviewHistoryItem {
  action: string
  reviewer: string
  status: 'submitted' | 'approved' | 'rejected'
  time: string
  comment?: string
  suggestion?: string
}

// 费用项接口定义
interface ExpenseItem {
  id: number
  title: string
  description: string
  amount: number
  category: 'accommodation' | 'utilities' | 'maintenance' | 'cleaning' | 'other'
  applicant: string
  phone: string
  department: string
  position: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
  isUrgent: boolean
  attachments: string[]
  reviewHistory: ReviewHistoryItem[]
  createdAt: string
  updatedAt: string
  reviewer?: string
  reviewDate?: string
  reviewComment?: string
  reviewSuggestion?: string
}

// 批量驳回表单接口定义
interface BatchRejectForm {
  reason: string
  customReason: string
  suggestion: string
}

// 重新提交表单接口定义
interface ResubmissionForm {
  additionalMaterials: string
  updatedDescription: string
  supplementaryInfo: string
}

// 审核表单接口定义
interface ReviewForm {
  status: 'approved' | 'rejected' | ''
  comment: string
  suggestion: string
  rejectReason: string
  customRejectReason: string
}

// 审核记录追踪相关方法
const getHistoryItemClass = (history: ReviewHistoryItem): string => {
  return `history-${history.status}`
}

// 工具方法
const formatCurrency = (amount: number): string => {
  return `¥${(amount || 0).toFixed(2)}`
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const truncateText = (text: string, length: number): string => {
  if (!text) return '-'
  return text.length > length ? text.substring(0, length) + '...' : text
}

// 原有方法
const getStatusType = (status?: string): string => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status?: string): string => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return '未知'
  }
}

const getCategoryType = (category?: string): string => {
  switch (category) {
    case 'accommodation': return ''
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

const getInitials = (name?: string): string => {
  if (!name) return '-'
  return name.slice(0, 2).toUpperCase()
}

const getFileName = (filePath: string): string => {
  return filePath.split('/').pop() || filePath
}

const getRandomFileSize = (): string => {
  const sizes = ['125KB', '256KB', '512KB', '1.2MB', '2.4MB']
  return sizes[Math.floor(Math.random() * sizes.length)]
}

const getRowClassName = ({ row }: { row: ExpenseItem }): string => {
  return row.isUrgent ? 'urgent-row' : ''
}

const handleStatusChange = (status: 'approved' | 'rejected' | string): void => {
  if (status === 'approved') {
    reviewForm.value.suggestion = '经审核，该费用申请符合相关规定，同意通过。'
  } else if (status === 'rejected') {
    reviewForm.value.suggestion = '经审核，该费用申请存在以下问题，不予通过：'
  }
}

const getQuickTemplates = (): { key: string; content: string }[] => {
  if (reviewForm.value.status === 'approved') {
    return [
      { key: '标准通过', content: '经审核，该费用申请材料齐全，符合报销标准，同意通过。' },
      { key: '金额合理', content: '费用金额合理，支出符合预算安排，同意报销。' },
      { key: '手续完整', content: '申请手续完整，附件齐全，同意通过审核。' }
    ]
  } else if (reviewForm.value.status === 'rejected') {
    return [
      { key: '材料不全', content: '缺少必要的附件材料，请补充完整后重新申请。' },
      { key: '金额异常', content: '费用金额超出预算或市场价格偏高，请重新核实。' },
      { key: '用途不明', content: '费用用途描述不清楚，请详细说明具体用途。' }
    ]
  }
  return []
}

const applyTemplate = (content: string): void => {
  reviewForm.value.suggestion = content
}

const handleSaveDraft = async (): Promise<void> => {
  saving.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('草稿保存成功')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const handleApprove = async (): Promise<void> => {
  if (!canSubmit.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要通过此费用申请吗？',
      '确认通过',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    submitting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage.success('费用申请已通过审核')
    router.push('/dashboard/expense-management')
  } catch {
    // 用户取消
  } finally {
    submitting.value = false
  }
}

const handleReject = async (): Promise<void> => {
  if (!canSubmit.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要拒绝此费用申请吗？',
      '确认拒绝',
      {
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    submitting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage.success('费用申请已拒绝')
    router.push('/dashboard/expense-management')
  } catch {
    // 用户取消
  } finally {
    submitting.value = false
  }
}

const handleQuickApprove = async (): Promise<void> => {
  // 数据验证
  if (!selectedExpense.value) {
    ElMessage.error('费用数据不存在，无法进行快速通过')
    return
  }

  if (selectedExpense.value.status !== 'pending') {
    ElMessage.warning('该费用申请已处理，无法重复操作')
    return
  }

  try {
    // 设置快速通过状态
    reviewForm.value.status = 'approved'
    
    // 根据费用类型和金额自动选择合适的审核建议
    const suggestion = getQuickApprovalSuggestion(selectedExpense.value)
    reviewForm.value.suggestion = suggestion
    
    // 自动生成审核备注
    reviewForm.value.comment = generateQuickApprovalComment(selectedExpense.value)

    // 显示确认对话框
    await ElMessageBox.confirm(
      `确定要对"${selectedExpense.value.title}"执行快速通过吗？
      
      审核结论：通过
      审核建议：${suggestion}
      
      此操作将直接完成审核流程，是否继续？`,
      '快速通过确认',
      {
        confirmButtonText: '确认快速通过',
        cancelButtonText: '取消',
        type: 'success',
        dangerouslyUseHTMLString: true,
        center: true
      }
    )

    // 开始提交审核
    await submitQuickApproval()

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('快速通过操作失败，请重试')
      console.error('Quick approve error:', error)
    }
  }
}

// 生成快速通过的备注内容
const generateQuickApprovalComment = (expense: ExpenseItem): string => {
  const amount = expense.amount
  const applicant = expense.applicant || '申请人'
  const isUrgent = expense.isUrgent

  let comment = `${applicant}的费用申请`
  
  if (isUrgent) {
    comment += '（紧急），'
  } else {
    comment += '，'
  }

  if (amount <= 100) {
    comment += '金额较小，审核通过。'
  } else if (amount <= 500) {
    comment += '金额合理，审核通过。'
  } else if (amount <= 1000) {
    comment += '金额较大但合理，审核通过。'
  } else {
    comment += '大额费用但符合规定，审核通过。'
  }

  return comment
}

// 执行快速通过提交
const submitQuickApproval = async (): Promise<void> => {
  submitting.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 更新本地数据状态
    if (selectedExpense.value) {
      selectedExpense.value.status = 'approved'
      selectedExpense.value.reviewer = '当前用户' // 实际应该从用户信息获取
      selectedExpense.value.reviewDate = new Date().toISOString().split('T')[0]
      
      // 添加审核历史记录
      if (!selectedExpense.value.reviewHistory) {
        selectedExpense.value.reviewHistory = []
      }
      
      selectedExpense.value.reviewHistory.push({
        action: '快速通过',
        status: 'approved',
        reviewer: '当前用户',
        time: new Date().toISOString(),
        comment: reviewForm.value.comment,
        suggestion: reviewForm.value.suggestion
      })
    }
    
    ElMessage.success('费用申请已快速通过审核！')
    
    // 延迟跳转到费用管理页面
    setTimeout(() => {
      router.push('/dashboard/expense-management')
    }, 1500)
    
  } catch (error) {
    throw new Error('提交审核失败')
  } finally {
    submitting.value = false
  }
}

const handlePreview = (): void => {
  if (!selectedExpense.value) {
    ElMessage.error('费用数据不存在')
    return
  }
  
  // 生成预览HTML内容（简化版本）
  ElMessage.info('预览功能正在开发中...')
}

const handlePreviewAttachment = (attachment: string): void => {
  ElMessage.info(`预览附件：${attachment}`)
}

const handleDownloadAttachment = (attachment: string): void => {
  ElMessage.success(`开始下载：${attachment}`)
}
</script>

<style scoped>
/* 页面容器 */
.expense-review {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 180px);
}

/* 视图切换栏 */
.view-tabs {
  margin-bottom: 24px;
}

.tab-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  border: none;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.tab-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.tab-icon {
  color: #409eff;
  font-size: 24px;
}

.stats-summary {
  display: flex;
  gap: 40px;
}

/* 搜索和筛选 */
.search-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-top: 16px;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selection-info {
  color: #606266;
  font-size: 14px;
}

.batch-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 费用列表 */
.expense-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.expense-table {
  border-radius: 12px;
}

/* 费用信息单元格 */
.expense-info-cell {
  padding: 8px 0;
}

.expense-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.urgent-icon {
  color: #f56c6c;
}

.expense-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
  line-height: 1.4;
}

.expense-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.applicant-name {
  font-size: 12px;
  color: #606266;
}

.apply-date {
  font-size: 12px;
  color: #909399;
}

/* 金额单元格 */
.amount-cell {
  text-align: center;
}

.amount-value {
  font-weight: 600;
  color: #f56c6c;
  font-size: 16px;
}

/* 申请人单元格 */
.applicant-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.applicant-avatar {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.applicant-details {
  flex: 1;
  min-width: 0;
}

.applicant-details .applicant-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.applicant-details .applicant-contact {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 审核详情页面 */
.review-detail {
  max-width: 1200px;
  margin: 0 auto;
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
  color: #67c23a;
  font-size: 32px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.quick-approve-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}

.preview-btn {
  border: 2px solid #409eff;
  color: #409eff;
  background: transparent;
}

/* 加载状态 */
.loading-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

/* 审核内容 */
.review-content {
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

/* 费用信息 */
.expense-summary {
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 2px solid #409eff20;
}

.expense-amount {
  text-align: center;
  margin-bottom: 16px;
}

.amount-label {
  display: block;
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.amount-value {
  display: block;
  font-size: 36px;
  font-weight: 700;
  color: #f56c6c;
  text-shadow: 0 2px 4px rgba(245, 108, 108, 0.1);
}

.expense-meta {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.meta-item {
  text-align: center;
}

.meta-label {
  display: block;
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.meta-value {
  display: block;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

/* 费用详情 */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  padding: 20px 0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.detail-value {
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.detail-value.description {
  font-weight: 500;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

/* 申请人信息 */
.applicant-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
}

.applicant-avatar {
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.applicant-details {
  flex: 1;
}

.applicant-name {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.applicant-contact {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.applicant-position {
  font-size: 16px;
  color: #409eff;
  font-weight: 600;
}

/* 审核表单 */
.review-form {
  padding: 20px 0;
}

.form-section {
  margin-bottom: 32px;
}

.form-label {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.required {
  color: #f56c6c;
}

.status-options {
  margin-bottom: 16px;
}

.status-radio {
  margin-right: 32px;
  margin-bottom: 16px;
}

.radio-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.status-radio.approved .radio-content {
  color: #67c23a;
}

.status-radio.rejected .radio-content {
  color: #f56c6c;
}

.template-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.template-btn {
  border-radius: 20px;
  padding: 8px 16px;
  transition: all 0.3s;
}

.template-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.suggestion-input,
.comment-input {
  border-radius: 8px;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}

.approve-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}

.reject-btn {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}

.draft-btn {
  border: 2px solid #909399;
  color: #606266;
  background: transparent;
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

.timeline-marker.approved {
  background: #67c23a;
}

.timeline-marker.rejected {
  background: #f56c6c;
}

.timeline-marker.submitted {
  background: #409eff;
}

.timeline-content {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
}

.timeline-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.status-approved {
  color: #67c23a;
  font-weight: 600;
}

.status-rejected {
  color: #f56c6c;
  font-weight: 600;
}

.timeline-comment {
  font-size: 14px;
  color: #606266;
  font-style: italic;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

/* 附件列表 */
.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  flex-shrink: 0;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-size {
  font-size: 12px;
  color: #909399;
}

.attachment-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .expense-review {
    padding: 16px;
  }
  
  .tab-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .stats-summary {
    gap: 20px;
  }
  
  .search-bar {
    flex-wrap: wrap;
  }
  
  .batch-actions {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
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
  
  .expense-meta {
    flex-direction: column;
    gap: 12px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .applicant-summary {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .attachments-grid {
    grid-template-columns: 1fr;
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
  
  .action-buttons {
    justify-content: center;
  }
}

/* 批量驳回对话框样式 */
.batch-reject-dialog-content {
  padding: 20px 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.required {
  color: #f56c6c;
  margin-right: 4px;
}

.selection-summary {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #d1ecf1;
  border-radius: 6px;
  color: #0c5460;
  font-size: 14px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
