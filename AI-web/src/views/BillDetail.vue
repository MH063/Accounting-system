<template>
  <div class="bill-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Document /></el-icon>
          账单详情
        </h1>
        <p class="page-subtitle">查看账单详细信息和付款状态</p>
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
          v-if="canEditBill"
          type="warning" 
          :icon="Edit"
          @click="handleEdit"
          class="edit-btn"
        >
          编辑账单
        </el-button>
        <el-button 
          v-if="canProcessPayment"
          type="success" 
          :icon="Money"
          @click="handleProcessPayment"
          class="payment-btn"
        >
          处理付款
        </el-button>
        <el-button 
          :icon="Download"
          @click="handleExportPDF"
          class="export-btn"
        >
          导出PDF
        </el-button>
        <el-dropdown @command="handleCommand">
          <el-button :icon="MoreFilled" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="duplicate">
                <el-icon><CopyDocument /></el-icon>
                复制账单
              </el-dropdown-item>
              <el-dropdown-item command="share">
                <el-icon><Share /></el-icon>
                分享账单
              </el-dropdown-item>
              <el-dropdown-item command="print">
                <el-icon><Printer /></el-icon>
                打印账单
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided>
                <el-icon><Delete /></el-icon>
                删除账单
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 账单详情内容 -->
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
              :type="getStatusType(billData?.status)" 
              size="large"
              class="status-tag"
            >
              {{ getStatusText(billData?.status) }}
            </el-tag>
          </div>
        </template>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">账单标题</div>
            <div class="info-value">{{ billData?.title || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">账单类型</div>
            <div class="info-value">
              <el-tag :type="getTypeTagType(billData?.type)" size="small">
                {{ getTypeText(billData?.type) }}
              </el-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">账单金额</div>
            <div class="info-value amount">{{ formatCurrency(billData?.totalAmount || 0) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">账单日期</div>
            <div class="info-value">{{ formatDate(billData?.billDate) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">付款期限</div>
            <div class="info-value">
              <span :class="{ 'overdue-text': isOverdue }">
                {{ formatDate(billData?.dueDate) }}
              </span>
              <el-tag 
                v-if="isOverdue" 
                type="danger" 
                size="small" 
                class="overdue-tag"
              >
                已逾期
              </el-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">负责人</div>
            <div class="info-value">{{ billData?.payerName || '-' }}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">账单描述</div>
            <div class="info-value description">{{ billData?.description || '-' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 付款信息卡片 -->
      <el-card class="info-card payment-info">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Money /></el-icon>
              付款信息
            </span>
            <div class="payment-stats">
              <span class="payment-rate">
                付款进度: {{ getPaymentProgress(billData) }}%
              </span>
            </div>
          </div>
        </template>

        <div class="payment-overview">
          <div class="payment-amounts">
            <div class="amount-item paid">
              <div class="amount-label">已付金额</div>
              <div class="amount-value">{{ formatCurrency(billData?.paidAmount || 0) }}</div>
            </div>
            <div class="amount-item unpaid">
              <div class="amount-label">待付金额</div>
              <div class="amount-value">{{ formatCurrency(getUnpaidAmount(billData)) }}</div>
            </div>
            <div class="amount-item total">
              <div class="amount-label">总金额</div>
              <div class="amount-value">{{ formatCurrency(billData?.totalAmount || 0) }}</div>
            </div>
          </div>

          <div class="payment-progress">
            <el-progress 
              :percentage="getPaymentProgress(billData)" 
              :color="getProgressColor(billData)"
              :stroke-width="10"
            />
          </div>

          <!-- 付款记录列表 -->
          <div class="payment-records" v-if="billData?.paymentRecords?.length">
            <h4 class="section-title">付款记录</h4>
            <div class="records-list">
              <div 
                v-for="record in billData.paymentRecords" 
                :key="record.id"
                class="record-item"
              >
                <div class="record-info">
                  <div class="record-amount">{{ formatCurrency(record.amount) }}</div>
                  <div class="record-date">{{ formatDateTime(record.paymentDate) }}</div>
                </div>
                <div class="record-payer">{{ record.payerName }}</div>
                <div class="record-method">
                  <el-tag size="small">{{ getPaymentMethodText(record.method) }}</el-tag>
                </div>
                <div class="record-note" v-if="record.note">{{ record.note }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 参与成员卡片 -->
      <el-card class="info-card members-info">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><User /></el-icon>
              参与成员 ({{ billData?.participants?.length || 0 }})
            </span>
            <el-button 
              v-if="canManageParticipants"
              type="primary" 
              size="small" 
              :icon="Plus"
              @click="handleAddParticipant"
            >
              添加成员
            </el-button>
          </div>
        </template>

        <div class="members-grid" v-if="billData?.participants?.length">
          <div 
            v-for="member in billData.participants" 
            :key="member.id"
            class="member-item"
          >
            <div class="member-avatar">
              <el-avatar :src="member.avatar" :size="40">
                {{ member.name?.charAt(0) }}
              </el-avatar>
            </div>
            <div class="member-info">
              <div class="member-name">{{ member.name }}</div>
              <div class="member-amount">{{ formatCurrency(member.amount) }}</div>
              <div class="member-status">
                <el-tag 
                  :type="getPaymentStatusType(member.paymentStatus)" 
                  size="small"
                >
                  {{ getPaymentStatusText(member.paymentStatus) }}
                </el-tag>
              </div>
            </div>
            <div class="member-actions" v-if="canManageParticipants">
              <el-button 
                type="text" 
                :icon="Edit" 
                size="small"
                @click="handleEditMember(member.id)"
              />
              <el-button 
                type="text" 
                :icon="Delete" 
                size="small"
                @click="handleRemoveMember(member.id)"
              />
            </div>
          </div>
        </div>
        <div v-else class="empty-members">
          <el-empty description="暂无参与成员" />
        </div>
      </el-card>

      <!-- 费用明细卡片 -->
      <el-card class="info-card expense-details">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><List /></el-icon>
              费用明细
            </span>
            <el-button 
              v-if="canAddExpenses"
              type="primary" 
              size="small" 
              :icon="Plus"
              @click="handleAddExpense"
            >
              添加费用
            </el-button>
          </div>
        </template>

        <div class="expense-list" v-if="billData?.expenses?.length">
          <div 
            v-for="expense in billData.expenses" 
            :key="expense.id"
            class="expense-item"
          >
            <div class="expense-info">
              <div class="expense-title">{{ expense.title }}</div>
              <div class="expense-category">
                <el-tag :type="getCategoryType(expense.category)" size="small">
                  {{ getCategoryText(expense.category) }}
                </el-tag>
              </div>
            </div>
            <div class="expense-amount">{{ formatCurrency(expense.amount) }}</div>
            <div class="expense-date">{{ formatDate(expense.date) }}</div>
            <div class="expense-actions">
              <el-button 
                type="text" 
                :icon="View" 
                size="small"
                @click="handleViewExpense(expense.id)"
              />
            </div>
          </div>
        </div>
        <div v-else class="empty-expenses">
          <el-empty description="暂无费用明细" />
        </div>
      </el-card>

      <!-- 账单历史卡片 -->
      <el-card class="info-card history-info">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Clock /></el-icon>
              账单历史
            </span>
          </div>
        </template>

        <div class="history-timeline" v-if="billData?.history?.length">
          <el-timeline>
            <el-timeline-item
              v-for="history in billData.history"
              :key="history.id"
              :timestamp="formatDateTime(history.timestamp)"
              :type="getHistoryType(history.action)"
              :icon="getHistoryIcon(history.action)"
            >
              <div class="history-content">
                <div class="history-action">{{ getHistoryActionText(history.action) }}</div>
                <div class="history-operator">操作人: {{ history.operator }}</div>
                <div class="history-description" v-if="history.description">
                  {{ history.description }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
        <div v-else class="empty-history">
          <el-empty description="暂无操作历史" />
        </div>
      </el-card>

      <!-- 相关附件卡片 -->
      <el-card class="info-card attachments-info" v-if="billData?.attachments?.length">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Paperclip /></el-icon>
              相关附件
            </span>
            <el-button 
              v-if="canUploadAttachments"
              type="primary" 
              size="small" 
              :icon="Upload"
              @click="handleUploadAttachment"
            >
              上传附件
            </el-button>
          </div>
        </template>

        <div class="attachments-grid">
          <div 
            v-for="attachment in billData.attachments" 
            :key="attachment.id"
            class="attachment-item"
            @click="handlePreviewAttachment(attachment)"
          >
            <div class="attachment-preview">
              <el-icon class="file-icon"><Document /></el-icon>
            </div>
            <div class="attachment-info">
              <div class="attachment-name">{{ attachment.name }}</div>
              <div class="attachment-size">{{ formatFileSize(attachment.size) }}</div>
            </div>
            <div class="attachment-actions">
              <el-button 
                type="text" 
                :icon="Download" 
                size="small"
                @click.stop="handleDownloadAttachment(attachment)"
              />
            </div>
          </div>
        </div>
      </el-card>

      <!-- 账单构成分析卡片 -->
      <el-card class="info-card analysis-info">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><DataAnalysis /></el-icon>
              账单构成分析
            </span>
          </div>
        </template>

        <div class="analysis-content">
          <!-- 饼图展示费用构成 -->
          <div class="chart-container">
            <div ref="chartRef" class="chart-wrapper"></div>
          </div>
          
          <!-- 费用分类统计 -->
          <div class="category-stats">
            <div 
              v-for="category in categoryStats" 
              :key="category.name"
              class="category-item"
            >
              <div class="category-info">
                <el-tag :type="getCategoryType(category.name)" size="small">
                  {{ getCategoryText(category.name) }}
                </el-tag>
                <span class="category-count">{{ category.count }}项</span>
              </div>
              <div class="category-amount">{{ formatCurrency(category.amount) }}</div>
              <div class="category-percent">{{ category.percent }}%</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 成员应付明细卡片 -->
      <el-card class="info-card member-details-info">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><User /></el-icon>
              成员应付明细
            </span>
          </div>
        </template>

        <div class="member-details-content">
          <el-table 
            :data="billData?.participants" 
            style="width: 100%"
            v-if="billData?.participants?.length"
          >
            <el-table-column prop="name" label="成员姓名" width="120">
              <template #default="{ row }">
                <div class="member-info-cell">
                  <el-avatar :src="row.avatar" :size="32" class="member-avatar">
                    {{ row.name?.charAt(0) }}
                  </el-avatar>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="应付金额" width="120" align="right">
              <template #default="{ row }">
                <span class="amount-text">{{ formatCurrency(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="付款状态" width="120">
              <template #default="{ row }">
                <el-tag 
                  :type="getPaymentStatusType(row.paymentStatus)" 
                  size="small"
                >
                  {{ getPaymentStatusText(row.paymentStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="付款进度" width="150">
              <template #default="{ row }">
                <el-progress 
                  :percentage="getMemberPaymentProgress(row)" 
                  :color="getMemberProgressColor(row)"
                  :show-text="false"
                  :stroke-width="6"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="Money"
                  @click="handleMemberPayment(row)"
                  :disabled="row.paymentStatus === 'paid'"
                >
                  付款
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-members">
            <el-empty description="暂无成员信息" />
          </div>
        </div>
      </el-card>

      <!-- 支付进度跟踪卡片 -->
      <el-card class="info-card payment-tracking-info">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><TrendCharts /></el-icon>
              支付进度跟踪
            </span>
          </div>
        </template>

        <div class="payment-tracking-content">
          <div class="payment-summary">
            <div class="summary-item">
              <div class="summary-label">总金额</div>
              <div class="summary-value">{{ formatCurrency(billData?.totalAmount || 0) }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">已付金额</div>
              <div class="summary-value">{{ formatCurrency(billData?.paidAmount || 0) }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">待付金额</div>
              <div class="summary-value">{{ formatCurrency(getUnpaidAmount(billData)) }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">付款进度</div>
              <div class="summary-value">{{ getPaymentProgress(billData) }}%</div>
            </div>
          </div>
          
          <div class="payment-progress-chart">
            <div class="chart-title">付款进度</div>
            <el-progress 
              :percentage="getPaymentProgress(billData)" 
              :color="getProgressColor(billData)"
              :stroke-width="20"
              striped
              striped-flow
            />
          </div>
          
          <div class="payment-timeline" v-if="billData?.paymentRecords?.length">
            <div class="timeline-title">付款记录</div>
            <el-timeline>
              <el-timeline-item
                v-for="record in billData.paymentRecords"
                :key="record.id"
                :timestamp="formatDateTime(record.paymentDate)"
                placement="top"
              >
                <el-card>
                  <div class="payment-record">
                    <div class="record-amount">{{ formatCurrency(record.amount) }}</div>
                    <div class="record-payer">付款人: {{ record.payerName }}</div>
                    <div class="record-method">付款方式: {{ getPaymentMethodText(record.method) }}</div>
                    <div class="record-note" v-if="record.note">备注: {{ record.note }}</div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
          <div v-else class="empty-payments">
            <el-empty description="暂无付款记录" />
          </div>
        </div>
      </el-card>

      <!-- 历史版本对比卡片 -->
      <el-card class="info-card version-comparison-info">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><ScaleToOriginal /></el-icon>
              历史版本对比
            </span>
            <div class="version-controls">
              <el-select 
                v-model="selectedVersionA" 
                placeholder="选择版本A" 
                size="small"
                @change="handleVersionChange"
              >
                <el-option
                  v-for="version in billVersions"
                  :key="version.id"
                  :label="`版本 ${version.version} (${formatDateTime(version.createTime)})`"
                  :value="version.id"
                />
              </el-select>
              <span class="version-separator">对比</span>
              <el-select 
                v-model="selectedVersionB" 
                placeholder="选择版本B" 
                size="small"
                @change="handleVersionChange"
              >
                <el-option
                  v-for="version in billVersions"
                  :key="version.id"
                  :label="`版本 ${version.version} (${formatDateTime(version.createTime)})`"
                  :value="version.id"
                />
              </el-select>
              <el-button 
                type="primary" 
                size="small" 
                @click="compareVersions"
                :disabled="!selectedVersionA || !selectedVersionB"
              >
                对比
              </el-button>
            </div>
          </div>
        </template>

        <div class="version-comparison-content" v-loading="comparing">
          <div v-if="versionComparison" class="comparison-result">
            <!-- 基本信息对比 -->
            <div class="comparison-section">
              <h4 class="section-title">基本信息对比</h4>
              <div class="comparison-grid">
                <div class="comparison-row">
                  <div class="field-label">账单标题</div>
                  <div class="field-value version-a" :class="{ 'changed': versionComparison.basicInfo.title.changed }">
                    {{ versionComparison.basicInfo.title.a }}
                  </div>
                  <div class="field-value version-b" :class="{ 'changed': versionComparison.basicInfo.title.changed }">
                    {{ versionComparison.basicInfo.title.b }}
                  </div>
                </div>
                <div class="comparison-row">
                  <div class="field-label">账单金额</div>
                  <div class="field-value version-a" :class="{ 'changed': versionComparison.basicInfo.totalAmount.changed }">
                    {{ formatCurrency(versionComparison.basicInfo.totalAmount.a) }}
                  </div>
                  <div class="field-value version-b" :class="{ 'changed': versionComparison.basicInfo.totalAmount.changed }">
                    {{ formatCurrency(versionComparison.basicInfo.totalAmount.b) }}
                  </div>
                </div>
                <div class="comparison-row">
                  <div class="field-label">账单描述</div>
                  <div class="field-value version-a" :class="{ 'changed': versionComparison.basicInfo.description.changed }">
                    {{ versionComparison.basicInfo.description.a || '-' }}
                  </div>
                  <div class="field-value version-b" :class="{ 'changed': versionComparison.basicInfo.description.changed }">
                    {{ versionComparison.basicInfo.description.b || '-' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 费用明细对比 -->
            <div class="comparison-section">
              <h4 class="section-title">费用明细对比</h4>
              <el-table 
                :data="versionComparison.expenses" 
                style="width: 100%"
                :row-class-name="tableRowClassName"
              >
                <el-table-column prop="title" label="费用项目" width="150">
                  <template #default="{ row }">
                    <span :class="{ 'deleted': row.status === 'removed', 'added': row.status === 'added' }">
                      {{ row.title }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="版本A" width="120" align="right">
                  <template #default="{ row }">
                    <span v-if="row.a" :class="{ 'deleted': row.status === 'removed' }">
                      {{ formatCurrency(row.a.amount) }}
                    </span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="版本B" width="120" align="right">
                  <template #default="{ row }">
                    <span v-if="row.b" :class="{ 'added': row.status === 'added' }">
                      {{ formatCurrency(row.b.amount) }}
                    </span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="变化" width="100">
                  <template #default="{ row }">
                    <span v-if="row.status === 'added'" class="status-added">新增</span>
                    <span v-else-if="row.status === 'removed'" class="status-removed">删除</span>
                    <span v-else-if="row.changed" class="status-changed">修改</span>
                    <span v-else class="status-unchanged">无变化</span>
                  </template>
                </el-table-column>
                <el-table-column label="差异金额" align="right">
                  <template #default="{ row }">
                    <span v-if="row.diff !== 0" :class="{ 'positive': row.diff > 0, 'negative': row.diff < 0 }">
                      {{ formatCurrency(Math.abs(row.diff)) }}
                    </span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 总结信息 -->
            <div class="comparison-summary">
              <div class="summary-item">
                <div class="summary-label">新增费用项</div>
                <div class="summary-value">{{ versionComparison.summary.addedCount }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">删除费用项</div>
                <div class="summary-value">{{ versionComparison.summary.removedCount }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">修改费用项</div>
                <div class="summary-value">{{ versionComparison.summary.changedCount }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">总金额差异</div>
                <div class="summary-value" :class="{ 'positive': versionComparison.summary.totalDiff > 0, 'negative': versionComparison.summary.totalDiff < 0 }">
                  {{ formatCurrency(Math.abs(versionComparison.summary.totalDiff)) }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-comparison">
            <el-empty description="请选择两个版本进行对比" />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, shallowRef, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { 
  Document, ArrowLeft, Edit, Money, Download, MoreFilled, CopyDocument, Share,
  Printer, Delete, User, Plus, List, Clock, View, Upload, Paperclip, DataAnalysis, ScaleToOriginal
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 定义账单数据接口
interface PaymentRecord {
  id: string
  amount: number
  paymentDate: string
  payerName: string
  method: string
  note: string
}

interface Participant {
  id: string
  name: string
  amount: number
  paymentStatus: string
  avatar: string
}

interface Expense {
  id: string
  title: string
  category: string
  amount: number
  date: string
}

interface History {
  id: string
  action: string
  timestamp: string
  operator: string
  description: string
}



interface BillData {
  id: string
  title: string
  type: string
  status: string
  totalAmount: number
  paidAmount: number
  billDate: string
  dueDate: string
  payerName: string
  description: string
  paymentRecords: PaymentRecord[]
  participants: Participant[]
  expenses: Expense[]
  history: History[]

}

// 定义账单版本接口
interface BillVersion {
  id: string
  version: number
  createTime: string
  title: string
  totalAmount: number
  description: string
}

// 定义版本对比结果接口
interface VersionComparison {
  basicInfo: {
    title: {
      a: string
      b: string
      changed: boolean
    }
    totalAmount: {
      a: number
      b: number
      changed: boolean
    }
    description: {
      a: string
      b: string
      changed: boolean
    }
  }
  expenses: Array<{
    id: string
    title: string
    a?: {
      amount: number
      category: string
    }
    b?: {
      amount: number
      category: string
    }
    changed: boolean
    diff: number
    status: 'added' | 'removed' | 'unchanged' | 'modified'
  }>
  summary: {
    addedCount: number
    removedCount: number
    changedCount: number
    totalDiff: number
  }
}

// 响应式数据
const route = useRoute()
const router = useRouter()
const billId = route.params.id as string
const loading = ref(false)
const billData = ref<BillData | null>(null)
const chartRef = shallowRef<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// 历史版本对比相关数据
const selectedVersionA = ref('')
const selectedVersionB = ref('')
const billVersions = ref<BillVersion[]>([])
const versionComparison = ref<VersionComparison | null>(null)
const comparing = ref(false)

// 计算属性
const isOverdue = computed(() => {
  if (!billData.value?.dueDate) return false
  return new Date(billData.value.dueDate) < new Date()
})

const canEditBill = computed(() => {
  // 根据用户权限判断是否可以编辑账单
  return true // 模拟权限
})

const canProcessPayment = computed(() => {
  // 根据账单状态判断是否可以处理付款
  return billData.value?.status !== 'paid'
})

const canManageParticipants = computed(() => {
  // 根据用户权限判断是否可以管理成员
  return true // 模拟权限
})

const canAddExpenses = computed(() => {
  // 根据用户权限判断是否可以添加费用
  return true // 模拟权限
})

const canUploadAttachments = computed(() => {
  // 根据用户权限判断是否可以上传附件
  return true // 模拟权限
})

// 费用分类统计
const categoryStats = computed(() => {
  if (!billData.value?.expenses) return []
  
  // 按分类统计费用
  const statsMap: Record<string, { count: number; amount: number }> = {}
  
  billData.value.expenses.forEach(expense => {
    if (!statsMap[expense.category]) {
      statsMap[expense.category] = { count: 0, amount: 0 }
    }
    statsMap[expense.category].count += 1
    statsMap[expense.category].amount += expense.amount
  })
  
  // 转换为数组并计算百分比
  const totalAmount = billData.value.totalAmount || 0
  return Object.entries(statsMap).map(([category, data]) => ({
    name: category,
    count: data.count,
    amount: data.amount,
    percent: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0
  }))
})

/**
 * 获取状态标签类型
 * @param status 账单状态
 * @returns 状态对应的标签类型
 */
const getStatusType = (status: BillData['status'] | undefined) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    partial: 'primary',
    overdue: 'danger'
  }
  return (status && typeMap[status]) || 'info'
}

/**
 * 获取状态文本
 * @param status 账单状态
 * @returns 状态对应的文本
 */
const getStatusText = (status: BillData['status'] | undefined) => {
  const textMap: Record<string, string> = {
    pending: '待付款',
    paid: '已付款',
    partial: '部分付款',
    overdue: '已逾期'
  }
  return (status && textMap[status]) || '未知'
}

/**
 * 获取类型标签类型
 * @param type 账单类型
 * @returns 类型对应的标签类型
 */
const getTypeTagType = (type: BillData['type'] | undefined) => {
  const typeMap: Record<string, string> = {
    monthly: 'primary',
    temporary: 'warning',
    expense: 'success'
  }
  return (type && typeMap[type]) || 'info'
}

/**
 * 获取类型文本
 * @param type 账单类型
 * @returns 类型对应的文本
 */
const getTypeText = (type: BillData['type'] | undefined) => {
  const textMap: Record<string, string> = {
    monthly: '月度账单',
    temporary: '临时账单',
    expense: '费用账单'
  }
  return (type && textMap[type]) || '未知'
}

/**
 * 获取付款状态标签类型
 * @param status 付款状态
 * @returns 状态对应的标签类型
 */
const getPaymentStatusType = (status: Participant['paymentStatus'] | undefined) => {
  const typeMap: Record<string, string> = {
    paid: 'success',
    pending: 'warning',
    overdue: 'danger'
  }
  return (status && typeMap[status]) || 'info'
}

/**
 * 获取付款状态文本
 * @param status 付款状态
 * @returns 状态对应的文本
 */
const getPaymentStatusText = (status: Participant['paymentStatus'] | undefined) => {
  const textMap: Record<string, string> = {
    paid: '已付款',
    pending: '待付款',
    overdue: '已逾期'
  }
  return (status && textMap[status]) || '未知'
}

/**
 * 获取费用类别标签类型
 * @param category 费用类别
 * @returns 类别对应的标签类型
 */
const getCategoryType = (category: Expense['category'] | undefined) => {
  const typeMap: Record<string, string> = {
    rent: 'primary',
    utilities: 'success',
    maintenance: 'warning',
    cleaning: 'info',
    other: 'danger'
  }
  return (category && typeMap[category]) || 'info'
}

/**
 * 获取费用类别文本
 * @param category 费用类别
 * @returns 类别对应的文本
 */
const getCategoryText = (category: Expense['category'] | undefined) => {
  const textMap: Record<string, string> = {
    rent: '房租',
    utilities: '水电费',
    maintenance: '维修费',
    cleaning: '清洁费',
    other: '其他'
  }
  return (category && textMap[category]) || '未知'
}

/**
 * 获取历史操作类型
 * @param action 历史操作
 * @returns 操作对应的类型
 */
const getHistoryType = (action: History['action'] | undefined) => {
  const typeMap: Record<string, string> = {
    create: 'primary',
    update: 'warning',
    payment: 'success',
    delete: 'danger'
  }
  return (action && typeMap[action]) || 'info'
}

/**
 * 获取历史操作图标
 * @param action 历史操作
 * @returns 操作对应的图标
 */
const getHistoryIcon = (action: History['action'] | undefined) => {
  const iconMap: Record<string, Component> = {
    create: Plus,
    update: Edit,
    payment: Money,
    delete: Delete
  }
  return (action && iconMap[action]) || Clock
}

/**
 * 获取历史操作文本
 * @param action 历史操作
 * @returns 操作对应的文本
 */
const getHistoryActionText = (action: History['action'] | undefined) => {
  const textMap: Record<string, string> = {
    create: '创建账单',
    update: '更新账单',
    payment: '处理付款',
    delete: '删除账单'
  }
  return (action && textMap[action]) || '未知操作'
}

/**
 * 格式化货币
 * @param amount 金额
 * @returns 格式化后的货币字符串
 */
const formatCurrency = (amount: number) => {
  return `¥${(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

/**
 * 格式化日期
 * @param date 日期
 * @returns 格式化后的日期字符串
 */
const formatDate = (date: string | Date | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

/**
 * 格式化日期时间
 * @param dateTime 日期时间
 * @returns 格式化后的日期时间字符串
 */
const formatDateTime = (dateTime: string | Date | undefined) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN')
}

/**
 * 格式化文件大小
 * @param size 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
const formatFileSize = (size: number) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let fileSize = size
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024
    unitIndex++
  }
  
  return `${(fileSize || 0).toFixed(1)} ${units[unitIndex]}`
}

/**
 * 计算付款进度
 * @param bill 账单对象
 * @returns 进度百分比
 */
const getPaymentProgress = (bill: BillData | null) => {
  if (!bill?.totalAmount) return 0
  return Math.round(((bill.paidAmount || 0) / bill.totalAmount) * 100)
}

/**
 * 计算未付金额
 * @param bill 账单对象
 * @returns 未付金额
 */
const getUnpaidAmount = (bill: BillData | null) => {
  if (!bill?.totalAmount) return 0
  return Math.max(0, bill.totalAmount - (bill.paidAmount || 0))
}

/**
 * 获取进度条颜色
 * @param bill 账单对象
 * @returns 进度条颜色
 */
const getProgressColor = (bill: BillData | null) => {
  if (bill?.status === 'paid') return '#67c23a'
  if (bill?.status === 'overdue') return '#f56c6c'
  if (bill?.status === 'partial') return '#e6a23c'
  return '#909399'
}

/**
 * 获取付款方式文本
 * @param method 付款方式
 * @returns 付款方式对应的文本
 */
const getPaymentMethodText = (method: PaymentRecord['method'] | undefined) => {
  const textMap: Record<string, string> = {
    cash: '现金',
    transfer: '转账',
    alipay: '支付宝',
    wechat: '微信支付',
    bank_card: '银行卡'
  }
  return (method && textMap[method]) || '未知'
}

/**
 * 计算成员付款进度
 * @param member 成员对象
 * @returns 进度百分比
 */
const getMemberPaymentProgress = (member: Participant) => {
  if (!member.amount) return 0
  // 这里简化处理，实际应该根据付款记录计算
  return member.paymentStatus === 'paid' ? 100 : member.paymentStatus === 'partial' ? 50 : 0
}

/**
 * 获取成员进度条颜色
 * @param member 成员对象
 * @returns 进度条颜色
 */
const getMemberProgressColor = (member: Participant) => {
  if (member.paymentStatus === 'paid') return '#67c23a'
  if (member.paymentStatus === 'overdue') return '#f56c6c'
  if (member.paymentStatus === 'pending') return '#e6a23c'
  return '#909399'
}

/**
 * 处理成员付款
 * @param member 成员对象
 */
const handleMemberPayment = (member: Participant) => {
  ElMessage.success(`处理成员 ${member.name} 的付款`)
  // 实际应该跳转到付款页面或弹出付款对话框
}

/**
 * 处理版本选择变化
 */
const handleVersionChange = () => {
  // 版本选择变化处理逻辑
}

/**
 * 对比版本
 */
const compareVersions = async () => {
  if (!selectedVersionA.value || !selectedVersionB.value) {
    ElMessage.warning('请选择两个版本进行对比')
    return
  }
  
  comparing.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟对比结果
    versionComparison.value = {
      basicInfo: {
        title: {
          a: '2024年2月宿舍费用账单',
          b: '2024年2月宿舍费用账单(更新)',
          changed: true
        },
        totalAmount: {
          a: 1580.00,
          b: 1680.00,
          changed: true
        },
        description: {
          a: '包含2月份房租、水电费、网费等各项费用',
          b: '包含2月份房租、水电费、网费等各项费用(更新)',
          changed: true
        }
      },
      expenses: [
        {
          id: '1',
          title: '房租',
          a: { amount: 1200.00, category: 'rent' },
          b: { amount: 1200.00, category: 'rent' },
          changed: false,
          diff: 0,
          status: 'unchanged'
        },
        {
          id: '2',
          title: '水电费',
          a: { amount: 280.00, category: 'utilities' },
          b: { amount: 380.00, category: 'utilities' },
          changed: true,
          diff: 100.00,
          status: 'modified'
        },
        {
          id: '3',
          title: '网费',
          a: { amount: 100.00, category: 'utilities' },
          b: undefined,
          changed: true,
          diff: -100.00,
          status: 'removed'
        },
        {
          id: '4',
          title: '清洁费',
          a: undefined,
          b: { amount: 100.00, category: 'cleaning' },
          changed: true,
          diff: 100.00,
          status: 'added'
        }
      ],
      summary: {
        addedCount: 1,
        removedCount: 1,
        changedCount: 2,
        totalDiff: 100.00
      }
    }
  } catch (error) {
    console.error('版本对比失败:', error)
    ElMessage.error('版本对比失败')
  } finally {
    comparing.value = false
  }
}

/**
 * 表格行类名
 * @param param 表格行参数
 * @returns 行类名
 */
const tableRowClassName = ({ row }: { row: { status?: string } }) => {
  if (row.status === 'added') {
    return 'row-added'
  } else if (row.status === 'removed') {
    return 'row-removed'
  }
  return ''
}

/**
 * 加载账单详情
 */
const loadBillDetail = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟账单详情数据
    billData.value = {
      id: billId,
      title: '2024年2月宿舍费用账单',
      type: 'monthly',
      status: 'partial',
      totalAmount: 1580.00,
      paidAmount: 900.00,
      billDate: '2024-02-28',
      dueDate: '2024-03-15',
      payerName: '张三',
      description: '包含2月份房租、水电费、网费等各项费用',
      paymentRecords: [
        {
          id: '1',
          amount: 500.00,
          paymentDate: '2024-02-15',
          payerName: '张三',
          method: 'alipay',
          note: '部分付款'
        },
        {
          id: '2',
          amount: 400.00,
          paymentDate: '2024-02-20',
          payerName: '李四',
          method: 'wechat',
          note: '转账付款'
        }
      ],
      participants: [
        {
          id: '1',
          name: '张三',
          amount: 395.00,
          paymentStatus: 'paid',
          avatar: 'https://picsum.photos/40/40?random=1'
        },
        {
          id: '2',
          name: '李四',
          amount: 395.00,
          paymentStatus: 'paid',
          avatar: 'https://picsum.photos/40/40?random=2'
        },
        {
          id: '3',
          name: '王五',
          amount: 395.00,
          paymentStatus: 'pending',
          avatar: 'https://picsum.photos/40/40?random=3'
        },
        {
          id: '4',
          name: '赵六',
          amount: 395.00,
          paymentStatus: 'pending',
          avatar: 'https://picsum.photos/40/40?random=4'
        }
      ],
      expenses: [
        {
          id: '1',
          title: '房租',
          category: 'rent',
          amount: 1200.00,
          date: '2024-02-01'
        },
        {
          id: '2',
          title: '水电费',
          category: 'utilities',
          amount: 280.00,
          date: '2024-02-28'
        },
        {
          id: '3',
          title: '网费',
          category: 'utilities',
          amount: 100.00,
          date: '2024-02-01'
        }
      ],
      history: [
        {
          id: '1',
          action: 'create',
          timestamp: '2024-02-28T10:00:00',
          operator: '张三',
          description: '创建账单'
        },
        {
          id: '2',
          action: 'payment',
          timestamp: '2024-02-15T14:30:00',
          operator: '张三',
          description: '支付500元'
        },
        {
          id: '3',
          action: 'payment',
          timestamp: '2024-02-20T16:45:00',
          operator: '李四',
          description: '支付400元'
        },
        {
          id: '4',
          action: 'update',
          timestamp: '2024-02-25T09:15:00',
          operator: '管理员',
          description: '更新账单信息'
        }
      ],
      attachments: [
        {
          id: '1',
          name: '费用清单.pdf',
          size: 1024000,
          url: '#'
        },
        {
          id: '2',
          name: '付款凭证.jpg',
          size: 512000,
          url: '#'
        }
      ]
    }
    
    // 模拟账单版本数据
    billVersions.value = [
      {
        id: 'v1',
        version: 1,
        createTime: '2024-02-28T10:00:00',
        title: '2024年2月宿舍费用账单',
        totalAmount: 1580.00,
        description: '包含2月份房租、水电费、网费等各项费用'
      },
      {
        id: 'v2',
        version: 2,
        createTime: '2024-02-25T09:15:00',
        title: '2024年2月宿舍费用账单(更新)',
        totalAmount: 1680.00,
        description: '包含2月份房租、水电费、网费等各项费用(更新)'
      }
    ]
  } catch (error) {
    console.error('加载账单详情失败:', error)
    ElMessage.error('加载账单详情失败')
  } finally {
    loading.value = false
  }
}

/**
 * 编辑账单
 */
const handleEdit = () => {
  router.push(`/dashboard/bill/edit/${billId}`)
}

/**
 * 处理付款
 */
const handleProcessPayment = () => {
  router.push(`/dashboard/payment?billId=${billId}`)
}

/**
 * 导出PDF
 */
const handleExportPDF = () => {
  ElMessage.success('导出PDF功能开发中')
}

/**
 * 下拉菜单命令处理
 */
const handleCommand = async (command: string) => {
  switch (command) {
    case 'duplicate':
      ElMessage.success('复制账单功能开发中')
      break
    case 'share':
      ElMessage.success('分享功能开发中')
      break
    case 'print':
      ElMessage.success('打印功能开发中')
      break
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除这个账单吗？', '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        ElMessage.success('账单删除成功')
        router.push('/dashboard/bills')
      } catch {
        // 用户取消删除
      }
      break
  }
}

/**
 * 添加成员
 */
const handleAddParticipant = () => {
  ElMessage.success('添加成员功能开发中')
}

/**
 * 编辑成员
 */
const handleEditMember = () => {
  ElMessage.success('编辑成员功能开发中')
}

/**
 * 移除成员
 */
const handleRemoveMember = async () => {
  try {
    await ElMessageBox.confirm('确定要移除这个成员吗？', '移除确认', {
      confirmButtonText: '确定移除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('成员移除成功')
  } catch {
    // 用户取消移除
  }
}

/**
 * 添加费用
 */
const handleAddExpense = () => {
  ElMessage.success('添加费用功能开发中')
}

/**
 * 查看费用详情
 */
const handleViewExpense = (expenseId: string) => {
  router.push(`/dashboard/expense/detail/${expenseId}`)
}

/**
 * 上传附件
 */
const handleUploadAttachment = () => {
  ElMessage.success('上传附件功能开发中')
}

/**
 * 预览附件
 */
const handlePreviewAttachment = () => {
  ElMessage.success('预览附件功能开发中')
}

/**
 * 下载附件
 */
const handleDownloadAttachment = () => {
  ElMessage.success('下载附件功能开发中')
}

// 组件挂载时加载数据
onMounted(() => {
  loadBillDetail()
  
  // 初始化图表
  nextTick(() => {
    if (chartRef.value) {
      chartInstance = echarts.init(chartRef.value)
      updateChart()
    }
  })
})

// 监听账单数据变化，更新图表
watch(() => billData.value, () => {
  if (chartInstance && billData.value) {
    updateChart()
  }
})

// 更新图表
const updateChart = () => {
  if (!chartInstance || !billData.value?.expenses) return
  
  // 按分类统计费用
  const categoryData: Record<string, number> = {}
  billData.value.expenses.forEach(expense => {
    if (!categoryData[expense.category]) {
      categoryData[expense.category] = 0
    }
    categoryData[expense.category] += expense.amount
  })
  
  // 转换为图表数据
  const chartData = Object.entries(categoryData).map(([category, amount]) => ({
    name: getCategoryText(category),
    value: amount
  }))
  
  // 配置图表选项
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '费用构成',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData
      }
    ]
  }
  
  // 设置图表选项
  chartInstance.setOption(option, true)
}
</script>

<style scoped>
.bill-detail {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
}

/* 页面头部样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left .page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.title-icon {
  color: #409eff;
}

.page-subtitle {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 内容区域样式 */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  font-weight: 600;
  color: #303133;
}

/* 基本信息样式 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
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
}

.info-value.amount {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

.info-value.description {
  line-height: 1.6;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.overdue-text {
  color: #f56c6c;
}

.overdue-tag {
  margin-left: 8px;
}

/* 付款信息样式 */
.payment-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.payment-amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.amount-item {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.amount-item.paid {
  background-color: #f0f9ff;
  border-color: #e1f3fe;
}

.amount-item.unpaid {
  background-color: #fef0f0;
  border-color: #fde2e2;
}

.amount-item.total {
  background-color: #f8f9fa;
  border-color: #e9ecef;
}

.amount-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.amount-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.payment-stats {
  font-size: 14px;
  color: #606266;
}

.payment-rate {
  font-weight: 600;
  color: #409eff;
}

.payment-progress {
  margin: 16px 0;
}

.payment-records {
  margin-top: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fafafa;
}

.record-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.record-amount {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.record-date {
  font-size: 14px;
  color: #909399;
}

.record-payer {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.record-method {
  margin-left: auto;
}

.record-note {
  margin-left: 16px;
  font-size: 12px;
  color: #c0c4cc;
}

/* 成员信息样式 */
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: white;
  transition: all 0.3s ease;
}

.member-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.member-avatar {
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.member-amount {
  font-size: 14px;
  color: #409eff;
  font-weight: 600;
  margin-bottom: 4px;
}

.member-status {
  font-size: 12px;
}

.member-actions {
  display: flex;
  gap: 4px;
}

.empty-members,
.empty-expenses {
  padding: 40px 0;
  text-align: center;
}

/* 费用明细样式 */
.expense-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.expense-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: white;
  transition: all 0.3s ease;
}

.expense-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.expense-info {
  flex: 1;
}

.expense-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.expense-category {
  font-size: 12px;
}

.expense-amount {
  font-size: 16px;
  font-weight: 700;
  color: #409eff;
  min-width: 80px;
  text-align: right;
}

.expense-date {
  font-size: 14px;
  color: #909399;
  min-width: 100px;
  text-align: center;
}

.expense-actions {
  flex-shrink: 0;
}

/* 历史记录样式 */
.history-timeline {
  padding-left: 20px;
}

.history-content {
  padding-bottom: 16px;
}

.history-action {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.history-operator {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.history-description {
  font-size: 14px;
  color: #909399;
}

.empty-history {
  padding: 40px 0;
  text-align: center;
}

/* 附件样式 */
.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.attachment-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.attachment-preview {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-icon {
  font-size: 20px;
  color: #909399;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-size {
  font-size: 12px;
  color: #909399;
}

.attachment-actions {
  flex-shrink: 0;
}

/* 加载状态 */
.loading-section {
  padding: 20px;
}

/* 历史版本对比样式 */
.version-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version-separator {
  color: #909399;
  font-size: 14px;
}

.version-comparison-content {
  padding: 20px 0;
}

.comparison-section {
  margin-bottom: 30px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 120px 1fr 1fr;
  gap: 16px;
}

.comparison-row {
  display: contents;
}

.comparison-row .field-label {
  font-weight: 500;
  color: #606266;
  align-self: center;
}

.comparison-row .field-value {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.comparison-row .field-value.version-a {
  background-color: #f0f9ff;
  border-color: #e1f3fe;
}

.comparison-row .field-value.version-b {
  background-color: #f0f9ff;
  border-color: #e1f3fe;
}

.comparison-row .field-value.changed {
  background-color: #fff1f0;
  border-color: #fed8d6;
}

.comparison-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.summary-value.positive {
  color: #67c23a;
}

.summary-value.negative {
  color: #f56c6c;
}

.status-added {
  color: #67c23a;
  font-weight: 500;
}

.status-removed {
  color: #f56c6c;
  font-weight: 500;
}

.status-changed {
  color: #e6a23c;
  font-weight: 500;
}

.status-unchanged {
  color: #909399;
}

.row-added {
  background-color: #f0f9ff;
}

.row-removed {
  background-color: #fef0f0;
}

.empty-comparison {
  padding: 40px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .payment-amounts {
    grid-template-columns: 1fr;
  }
  
  .members-grid {
    grid-template-columns: 1fr;
  }
  
  .expense-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .attachments-grid {
    grid-template-columns: 1fr;
  }
}
</style>