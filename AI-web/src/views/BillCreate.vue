<template>
  <div class="bill-create">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><DocumentAdd /></el-icon>
          {{ isEditMode ? '编辑账单' : '创建账单' }}
        </h1>
        <p class="page-subtitle">{{ isEditMode ? '修改账单信息' : '填写账单信息并分配给参与成员' }}</p>
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
      </div>
    </div>

    <!-- 表单内容 -->
    <div class="form-content">
      <el-form
        ref="billFormRef"
        :model="billForm"
        :rules="formRules"
        label-width="120px"
        class="bill-form"
      >
        <!-- 基本信息区域 -->
        <el-card class="form-section" shadow="never">
          <template #header>
            <div class="section-header">
              <span class="section-title">
                <el-icon><InfoFilled /></el-icon>
                基本信息
              </span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="账单标题" prop="title">
                <el-input
                  v-model="billForm.title"
                  placeholder="请输入账单标题"
                  :prefix-icon="Document"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="账单类型" prop="type">
                <el-select 
                  v-model="billForm.type" 
                  placeholder="选择账单类型"
                  style="width: 100%"
                >
                  <el-option
                    v-for="type in billTypes"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  >
                    <span style="display: flex; align-items: center;">
                      <el-icon style="margin-right: 8px;">
                        <component :is="type.icon" />
                      </el-icon>
                      {{ type.label }}
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="账单日期" prop="billDate">
                <el-date-picker
                  v-model="billForm.billDate"
                  type="date"
                  placeholder="选择账单日期"
                  style="width: 100%"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="付款期限" prop="dueDate">
                <el-date-picker
                  v-model="billForm.dueDate"
                  type="date"
                  placeholder="选择付款期限"
                  style="width: 100%"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="账单周期" prop="billCycle">
                <el-select 
                  v-model="billForm.billCycle" 
                  placeholder="选择账单周期"
                  style="width: 100%"
                  @change="handleBillCycleChange"
                >
                  <el-option
                    v-for="cycle in billCycles"
                    :key="cycle.value"
                    :label="cycle.label"
                    :value="cycle.value"
                  >
                    <span style="display: flex; align-items: center;">
                      <el-icon style="margin-right: 8px;">
                        <component :is="cycle.icon" />
                      </el-icon>
                      {{ cycle.label }}
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="账单描述" prop="description">
            <el-input
              v-model="billForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入账单描述（可选）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <!-- 总金额自动计算显示 -->
          <el-form-item label="总金额">
            <div class="total-amount-display">
              <span class="amount-label">当前总金额:</span>
              <span class="amount-value">{{ formatCurrency(totalAmount) }}</span>
            </div>
          </el-form-item>

          <!-- 定时生成设置 -->
          <el-form-item>
            <el-card class="schedule-settings" shadow="never">
              <template #header>
                <div class="section-header">
                  <span class="section-title">
                    <el-icon><Clock /></el-icon>
                    定时生成设置
                  </span>
                  <el-switch
                    v-model="billForm.schedule.enabled"
                    active-text="启用"
                    inactive-text="禁用"
                    @change="handleScheduleToggle"
                  />
                </div>
              </template>

              <div v-if="billForm.schedule.enabled" class="schedule-content">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="生成频率">
                      <el-select 
                        v-model="billForm.schedule.frequency" 
                        placeholder="选择生成频率"
                        style="width: 100%"
                        @change="handleFrequencyChange"
                      >
                        <el-option
                          v-for="freq in scheduleFrequencies"
                          :key="freq.value"
                          :label="freq.label"
                          :value="freq.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="生成时间">
                      <el-time-picker
                        v-model="billForm.schedule.time"
                        format="HH:mm"
                        value-format="HH:mm"
                        placeholder="选择生成时间"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20" v-if="billForm.schedule.frequency === 'weekly'">
                  <el-col :span="24">
                    <el-form-item label="生成日期">
                      <el-select 
                        v-model="billForm.schedule.dayOfWeek" 
                        placeholder="选择星期"
                        style="width: 200px"
                      >
                        <el-option
                          v-for="day in weekDays"
                          :key="day.value"
                          :label="day.label"
                          :value="day.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20" v-if="billForm.schedule.frequency === 'monthly'">
                  <el-col :span="24">
                    <el-form-item label="生成日期">
                      <el-select 
                        v-model="billForm.schedule.dayOfMonth" 
                        placeholder="选择日期"
                        style="width: 200px"
                      >
                        <el-option
                          v-for="day in monthDays"
                          :key="day.value"
                          :label="day.label"
                          :value="day.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="自动生成">
                      <el-switch
                        v-model="billForm.schedule.autoGenerate"
                        active-text="开启"
                        inactive-text="关闭"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="生成提醒">
                      <el-switch
                        v-model="billForm.schedule.notification"
                        active-text="开启"
                        inactive-text="关闭"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-alert
                  v-if="billForm.schedule.nextGeneration"
                  :title="`下次生成时间: ${billForm.schedule.nextGeneration}`"
                  type="info"
                  :closable="false"
                  style="margin-top: 16px;"
                />
              </div>

              <div v-else class="schedule-disabled">
                <el-empty description="定时生成已禁用">
                  <template #image>
                    <el-icon :size="60" color="#dcdfe6">
                      <Clock />
                    </el-icon>
                  </template>
                </el-empty>
              </div>
            </el-card>
          </el-form-item>
        </el-card>

        <!-- 参与成员区域 -->
        <el-card class="form-section" shadow="never">
          <template #header>
            <div class="section-header">
              <span class="section-title">
                <el-icon><User /></el-icon>
                参与成员
              </span>
              <el-button 
                type="primary" 
                size="small" 
                :icon="Plus"
                @click="handleAddMember"
                class="add-btn"
              >
                添加成员
              </el-button>
            </div>
          </template>

          <div v-if="billForm.participants.length === 0" class="empty-participants">
            <el-empty description="暂无参与成员，点击上方按钮添加">
              <template #image>
                <el-icon :size="60" color="#dcdfe6">
                  <UserFilled />
                </el-icon>
              </template>
            </el-empty>
          </div>

          <div v-else class="participants-list">
            <div 
              v-for="(participant, index) in billForm.participants" 
              :key="participant.id"
              class="participant-item"
            >
              <div class="participant-avatar">
                <el-avatar :src="getUserAvatar(participant.avatar, participant.email, participant.name)" :size="40">
                  {{ participant.name?.charAt(0) }}
                </el-avatar>
              </div>
              <div class="participant-info">
                <el-form-item
                  :prop="`participants.${index}.name`"
                  :rules="{ required: true, message: '请输入成员姓名', trigger: 'blur' }"
                >
                  <el-input
                    v-model="participant.name"
                    placeholder="成员姓名"
                    size="small"
                    style="width: 150px"
                  />
                </el-form-item>
                <el-input
                  v-model="participant.email"
                  placeholder="邮箱（可选）"
                  size="small"
                  style="width: 180px"
                />
              </div>
              <div class="participant-amount">
                <el-form-item
                  :prop="`participants.${index}.amount`"
                  :rules="amountRules"
                >
                  <div class="amount-adjustment">
                    <div class="amount-input-group">
                      <el-input-number
                        v-model="participant.amount"
                        :min="0"
                        :precision="2"
                        :step="10"
                        placeholder="分摊金额"
                        size="small"
                        style="width: 120px"
                        @change="handleAmountChange"
                      />
                      <div class="amount-percentage">
                        {{ getAmountPercentage(participant.amount) }}%
                      </div>
                    </div>
                    <div class="adjustment-controls">
                      <el-slider
                        v-model="participant.amount"
                        :min="0"
                        :max="Math.max(totalAmount, participant.amount)"
                        :step="totalAmount / 100"
                        show-stops
                        size="small"
                        style="width: 150px; margin: 0 8px;"
                        @change="handleAmountChange"
                      />
                      <div class="quick-adjust-buttons">
                        <el-button
                          type="text"
                          size="small"
                          @click="adjustAmount(index, 'equal')"
                          title="设置为平均分配"
                        >
                          平均
                        </el-button>
                        <el-button
                          type="text"
                          size="small"
                          @click="adjustAmount(index, 'proportional')"
                          title="按比例调整"
                        >
                          比例
                        </el-button>
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </div>
              <div class="participant-actions">
                <el-button 
                  type="text" 
                  :icon="Delete"
                  size="small"
                  @click="handleRemoveMember(index)"
                  class="delete-btn"
                />
              </div>
            </div>

            <!-- 分摊方式选择 -->
            <div class="split-method">
              <div class="split-method-header">
                <span class="split-label">分摊方式:</span>
                <el-radio-group v-model="splitMethod" @change="handleSplitMethodChange">
                  <el-radio value="manual">手动分配</el-radio>
                  <el-radio value="equal">平均分配</el-radio>
                  <el-radio value="proportional">按比例分配</el-radio>
                </el-radio-group>
              </div>
              <div class="split-hint" v-if="splitMethod === 'equal'">
                <el-button 
                  type="text" 
                  size="small" 
                  @click="handleEqualSplit"
                >
                  平均分配给所有成员
                </el-button>
              </div>
              <div class="split-hint" v-if="splitMethod === 'proportional'">
                <el-button 
                  type="text" 
                  size="small" 
                  @click="handleProportionalSplit"
                >
                  按比例重新分配
                </el-button>
              </div>
            </div>

            <!-- 金额分配统计 -->
            <div class="amount-summary">
              <div class="summary-item">
                <span class="summary-label">成员总数:</span>
                <span class="summary-value">{{ billForm.participants.length }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">已分配:</span>
                <span class="summary-value">{{ formatCurrency(allocatedAmount) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">剩余:</span>
                <span class="summary-value" :class="{ 'remaining-warning': remainingAmount !== 0 }">
                  {{ formatCurrency(remainingAmount) }}
                </span>
              </div>
            </div>

            <!-- 智能重分配区域 -->
            <div v-if="billForm.participants.length > 0" class="smart-distribution-section">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 14px; font-weight: 500; color: #303133;">智能调整</span>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="handleSmartDistribution"
                  class="smart-distribution-btn"
                >
                  <el-icon><Setting /></el-icon>
                  智能重分配
                </el-button>
              </div>
              <p style="font-size: 12px; color: #909399; margin: 0;">
                快速重新平衡所有成员的金额分配
              </p>
            </div>
          </div>
        </el-card>

        <!-- 费用明细区域 -->
        <el-card class="form-section" shadow="never">
          <template #header>
            <div class="section-header">
              <span class="section-title">
                <el-icon><List /></el-icon>
                费用明细
              </span>
              <el-button 
                type="primary" 
                size="small" 
                :icon="Plus"
                @click="handleAddExpense"
                class="add-btn"
              >
                添加费用
              </el-button>
            </div>
          </template>

          <div v-if="billForm.expenses.length === 0" class="empty-expenses">
            <el-empty description="暂无费用明细，点击上方按钮添加">
              <template #image>
                <el-icon :size="60" color="#dcdfe6">
                  <List />
                </el-icon>
              </template>
            </el-empty>
          </div>

          <div v-else class="expenses-table">
            <el-table :data="billForm.expenses" border style="width: 100%">
              <el-table-column label="费用名称" width="200">
                <template #default="{ row }">
                  <el-input
                    v-model="row.title"
                    placeholder="费用名称"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="费用类别" width="150">
                <template #default="{ row }">
                  <el-select 
                    v-model="row.category" 
                    placeholder="选择类别"
                    size="small"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="category in expenseCategories"
                      :key="category.value"
                      :label="category.label"
                      :value="category.value"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="金额" width="150">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.amount"
                    :min="0"
                    :precision="2"
                    :step="10"
                    placeholder="金额"
                    size="small"
                    style="width: 120px"
                    @change="handleAmountChange"
                  />
                </template>
              </el-table-column>
              <el-table-column label="日期" width="150">
                <template #default="{ row }">
                  <el-date-picker
                    v-model="row.date"
                    type="date"
                    placeholder="选择日期"
                    size="small"
                    style="width: 120px"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                  />
                </template>
              </el-table-column>
              <el-table-column label="描述" min-width="200">
                <template #default="{ row }">
                  <el-input
                    v-model="row.description"
                    placeholder="费用描述（可选）"
                    size="small"
                    maxlength="200"
                    show-word-limit
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" fixed="right">
                <template #default="{ $index }">
                  <el-button 
                    type="text" 
                    :icon="Delete"
                    size="small"
                    @click="handleRemoveExpense($index)"
                    class="delete-btn"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 费用汇总统计 -->
          <div v-if="billForm.expenses.length > 0" class="expense-summary">
            <div class="summary-tabs">
              <el-tabs v-model="expenseSummaryType" type="border-card">
                <el-tab-pane label="按类别汇总" name="category">
                  <div class="summary-content">
                    <div 
                      v-for="summary in expensesByCategory" 
                      :key="summary.category"
                      class="summary-item-row"
                    >
                      <span class="category-name">{{ summary.label }}</span>
                      <span class="category-amount">{{ formatCurrency(summary.total) }}</span>
                      <span class="category-count">{{ summary.count }}项</span>
                    </div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="按日期汇总" name="date">
                  <div class="summary-content">
                    <div 
                      v-for="summary in expensesByDate" 
                      :key="summary.date"
                      class="summary-item-row"
                    >
                      <span class="date-name">{{ summary.date }}</span>
                      <span class="date-amount">{{ formatCurrency(summary.total) }}</span>
                      <span class="date-count">{{ summary.count }}项</span>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
            
            <!-- 快速汇总信息 -->
            <div class="quick-summary">
              <div class="quick-summary-item">
                <span class="quick-label">总费用项数:</span>
                <span class="quick-value">{{ billForm.expenses.length }}</span>
              </div>
              <div class="quick-summary-item">
                <span class="quick-label">涉及类别:</span>
                <span class="quick-value">{{ Object.keys(expensesByCategory).length }}种</span>
              </div>
              <div class="quick-summary-item">
                <span class="quick-label">时间跨度:</span>
                <span class="quick-value">{{ expenseTimeRange }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button 
            size="large" 
            @click="$router.back()"
          >
            取消
          </el-button>
          <el-button 
            type="primary" 
            size="large" 
            :loading="submitLoading"
            @click="handleShowPreview"
          >
            预览账单
          </el-button>
        </div>
      </el-form>
    </div>
  </div>

  <!-- 账单预览对话框 -->
  <el-dialog
    v-model="showPreview"
    title="账单预览"
    width="90%"
    max-width="800px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-if="previewData.title" class="bill-preview">
      <!-- 账单基本信息 -->
      <div class="preview-section">
        <h3 class="preview-title">
          <el-icon><Document /></el-icon>
          {{ previewData.title }}
        </h3>
        <div class="preview-info">
          <div class="info-item">
            <span class="info-label">账单类型:</span>
            <span class="info-value">{{ getBillTypeLabel(previewData.type) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">账单周期:</span>
            <span class="info-value">{{ getBillCycleLabel(previewData.billCycle) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">账单日期:</span>
            <span class="info-value">{{ previewData.billDate }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">付款期限:</span>
            <span class="info-value">{{ previewData.dueDate }}</span>
          </div>
        </div>
      </div>

      <!-- 费用汇总 -->
      <div class="preview-section">
        <h4 class="preview-subtitle">
          <el-icon><List /></el-icon>
          费用汇总
        </h4>
        <div class="preview-stats">
          <div class="stat-item">
            <span class="stat-label">总金额:</span>
            <span class="stat-value">{{ formatCurrency(previewData.totalAmount) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">费用项数:</span>
            <span class="stat-value">{{ previewData.expenseSummary?.totalItems || 0 }}项</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">涉及类别:</span>
            <span class="stat-value">{{ previewData.expenseSummary?.categoriesCount || 0 }}种</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">时间跨度:</span>
            <span class="stat-value">{{ previewData.expenseSummary?.timeRange || '无' }}</span>
          </div>
        </div>
      </div>

      <!-- 参与成员 -->
      <div class="preview-section">
        <h4 class="preview-subtitle">
          <el-icon><UserFilled /></el-icon>
          参与成员 ({{ previewData.participantSummary?.totalParticipants || 0 }}人)
        </h4>
        <div class="preview-participants">
          <div 
            v-for="participant in previewData.participants" 
            :key="participant.id"
            class="participant-preview"
          >
            <div class="participant-info">
              <el-avatar :size="32" :src="getUserAvatar(participant.avatar, participant.email, participant.name)">
                {{ participant.name.charAt(0) }}
              </el-avatar>
              <span class="participant-name">{{ participant.name }}</span>
              <span class="participant-email">{{ participant.email }}</span>
            </div>
            <div class="participant-amount">
              {{ formatCurrency(participant.amount) }}
              <span class="amount-percentage">
                ({{ getAmountPercentage(participant.amount) }}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 费用明细 -->
      <div class="preview-section" v-if="previewData.expenses?.length > 0">
        <h4 class="preview-subtitle">
          <el-icon><Money /></el-icon>
          费用明细
        </h4>
        <div class="preview-expenses">
          <div 
            v-for="expense in previewData.expenses" 
            :key="expense.id"
            class="expense-preview"
          >
            <div class="expense-info">
              <span class="expense-title">{{ expense.title }}</span>
              <span class="expense-category">
                {{ getExpenseCategoryLabel(expense.category) }}
              </span>
              <span class="expense-date">{{ expense.date }}</span>
            </div>
            <div class="expense-amount">
              {{ formatCurrency(expense.amount) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 描述信息 -->
      <div class="preview-section" v-if="previewData.description">
        <h4 class="preview-subtitle">
          <el-icon><InfoFilled /></el-icon>
          账单描述
        </h4>
        <div class="preview-description">
          {{ previewData.description }}
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancelPreview">
          取消
        </el-button>
        <el-button 
          type="primary" 
          :loading="submitLoading"
          @click="handleConfirmSubmit"
        >
          确认创建
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  DocumentAdd, ArrowLeft, InfoFilled, Document, User, Plus, Delete, 
  UserFilled, List, Money, Calendar, Timer, Setting, Clock
} from '@element-plus/icons-vue'
import { billService } from '@/services/billService'
import { getFullAvatarUrl, getUserAvatar } from '@/services/userService'

// 定义组件接收的props
interface Props {
  id?: string
}

// 接收路由传递的props
const props = defineProps<Props>()

// 响应式数据
const router = useRouter()
const route = useRoute()
const billFormRef = ref()
const submitLoading = ref(false)
const splitMethod = ref('manual')
const expenseSummaryType = ref('category')
const showPreview = ref(false)
const previewData = ref({})

// 检查是否为编辑模式
const isEditMode = computed(() => !!props.id || !!route.params.id)
const billId = computed(() => props.id || route.params.id as string)

// 账单表单数据
const billForm = reactive({
  title: '',
  type: '',
  billCycle: '',
  description: '',
  billDate: '',
  dueDate: '',
  // 定时生成设置
  schedule: {
    enabled: false,
    frequency: 'monthly', // daily, weekly, monthly, yearly
    dayOfWeek: 1, // 0-6 (周日到周六)
    dayOfMonth: 1, // 1-31
    time: '09:00', // HH:mm格式
    timezone: 'Asia/Shanghai',
    autoGenerate: false,
    notification: true,
    lastGenerated: '',
    nextGeneration: ''
  },
  participants: [] as Array<{
    id: string
    name: string
    email: string
    amount: number
    avatar?: string
  }>,
  expenses: [] as Array<{
    id: string
    title: string
    category: string
    amount: number
    date: string
    description: string
  }>
})

// 账单类型选项
const billTypes = [
  { value: 'monthly', label: '月度账单', icon: Calendar },
  { value: 'temporary', label: '临时账单', icon: Document },
  { value: 'expense', label: '费用账单', icon: Money }
]

// 账单周期选项
const billCycles = [
  { value: 'once', label: '一次性', icon: Timer },
  { value: 'weekly', label: '每周', icon: Calendar },
  { value: 'monthly', label: '每月', icon: Calendar },
  { value: 'quarterly', label: '每季度', icon: Calendar },
  { value: 'yearly', label: '每年', icon: Calendar }
]

// 费用类别选项
const expenseCategories = [
  { value: 'rent', label: '房租' },
  { value: 'utilities', label: '水电费' },
  { value: 'maintenance', label: '维修费' },
  { value: 'cleaning', label: '清洁费' },
  { value: 'internet', label: '网费' },
  { value: 'other', label: '其他' }
]

// 定时生成频率选项
const scheduleFrequencies = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' }
]

// 星期选项
const weekDays = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' }
]

// 月份中的日期选项 (1-31)
const monthDays = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}日`
}))

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入账单标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择账单类型', trigger: 'change' }
  ],
  billCycle: [
    { required: true, message: '请选择账单周期', trigger: 'change' }
  ],
  billDate: [
    { required: true, message: '请选择账单日期', trigger: 'change' }
  ],
  dueDate: [
    { required: true, message: '请选择付款期限', trigger: 'change' }
  ]
}

// 金额验证规则
const amountRules = [
  { required: true, message: '请输入分摊金额', trigger: 'blur' },
  { type: 'number', min: 0, message: '金额不能为负数', trigger: 'blur' }
]

// 计算属性
const totalAmount = computed(() => {
  return billForm.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
})

const allocatedAmount = computed(() => {
  return billForm.participants.reduce((sum, participant) => sum + (participant.amount || 0), 0)
})

const remainingAmount = computed(() => {
  return totalAmount.value - allocatedAmount.value
})

// 费用汇总计算属性
const expensesByCategory = computed(() => {
  const categoryMap = new Map()
  
  billForm.expenses.forEach(expense => {
    if (!expense.category || expense.amount <= 0) return
    
    const existing = categoryMap.get(expense.category) || { 
      category: expense.category, 
      total: 0, 
      count: 0,
      label: (expenseCategories.find(c => c.value === expense.category)?.label) || expense.category
    }
    
    existing.total += expense.amount
    existing.count += 1
    categoryMap.set(expense.category, existing)
  })
  
  return Array.from(categoryMap.values())
})

const expensesByDate = computed(() => {
  const dateMap = new Map()
  
  billForm.expenses.forEach(expense => {
    if (!expense.date || expense.amount <= 0) return
    
    const existing = dateMap.get(expense.date) || { 
      date: expense.date, 
      total: 0, 
      count: 0
    }
    
    existing.total += expense.amount
    existing.count += 1
    dateMap.set(expense.date, existing)
  })
  
  // 按日期排序
  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
})

const expenseTimeRange = computed(() => {
  if (billForm.expenses.length === 0) return '无'
  
  const dates = billForm.expenses
    .filter(expense => expense.date)
    .map(expense => expense.date)
    .sort()
  
  if (dates.length === 0) return '无'
  if (dates.length === 1) return dates[0]
  
  const startDate = dates[0]
  const endDate = dates[dates.length - 1]
  
  if (startDate === endDate) return startDate
  
  return `${startDate} 至 ${endDate}`
})

/**
 * 获取金额百分比
 * @param amount 金额
 * @returns 百分比字符串
 */
const getAmountPercentage = (amount: number) => {
  if (totalAmount.value === 0) return '0'
  return ((amount / totalAmount.value) * 100).toFixed(1)
}

/**
 * 调整单个成员金额
 * @param index 成员索引
 * @param method 调整方式
 */
const adjustAmount = (index: number, method: string) => {
  if (billForm.participants.length === 0) return
  
  const participant = billForm.participants[index]
  const otherParticipants = billForm.participants.filter((_, i) => i !== index)
  const remainingTotal = totalAmount.value - participant.amount
  
  if (method === 'equal') {
    if (otherParticipants.length > 0) {
      const amountPerOther = remainingTotal / otherParticipants.length
      otherParticipants.forEach(p => p.amount = Math.round(amountPerOther * 100) / 100)
    }
    ElMessage.success('已设置为平均分配')
  } else if (method === 'proportional') {
    // 简单的按比例分配
    // 使用固定权重，实际应用中应通过API获取真实权重
    const weights = otherParticipants.map((_, index) => (index + 1) * 10)
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    
    otherParticipants.forEach((p, i) => {
      const proportion = weights[i] / totalWeight
      p.amount = Math.round(remainingTotal * proportion * 100) / 100
    })
    ElMessage.success('已按比例重新分配')
  }
  
  handleAmountChange()
}

/**
 * 智能重分配
 */
const handleSmartDistribution = () => {
  if (billForm.participants.length === 0) {
    ElMessage.warning('请先添加参与成员')
    return
  }
  
  if (totalAmount.value === 0) {
    ElMessage.warning('请先添加费用明细')
    return
  }
  
  // 显示分配方式选择对话框
  ElMessageBox.confirm(
    '选择智能分配方式：\n1. 平均分配 - 所有成员平均分摊\n2. 按权重分配 - 根据成员重要性分配\n3. 自定义分配 - 手动设置权重',
    '智能重分配',
    {
      confirmButtonText: '平均分配',
      cancelButtonText: '按权重分配',
      type: 'info',
      distinguishCancelAndClose: true
    }
  ).then(() => {
    handleEqualSplit()
    ElMessage.success('已执行平均分配')
  }).catch((action) => {
    if (action === 'cancel') {
      handleProportionalSplit()
      ElMessage.success('已执行按权重分配')
    }
  })
}

/**
 * 格式化货币
 * @param amount 金额
 * @returns 格式化后的货币字符串
 */
const formatCurrency = (amount: number) => {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
const generateId = () => {
  // 使用固定ID生成规则，实际应用中应通过API获取真实ID
  return Date.now().toString(36) + 'FIXEDID'
}

/**
 * 添加成员
 */
const handleAddMember = () => {
  const newParticipant = {
    id: generateId(),
    name: '',
    email: '',
    amount: 0,
    avatar: `https://picsum.photos/40/40?random=${Date.now()}`
  }
  billForm.participants.push(newParticipant)
}

/**
 * 移除成员
 * @param index 成员索引
 */
const handleRemoveMember = (index: number) => {
  billForm.participants.splice(index, 1)
}

/**
 * 添加费用
 */
const handleAddExpense = () => {
  const newExpense = {
    id: generateId(),
    title: '',
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  }
  billForm.expenses.push(newExpense)
}

/**
 * 移除费用
 * @param index 费用索引
 */
const handleRemoveExpense = (index: number) => {
  billForm.expenses.splice(index, 1)
}

/**
 * 金额变更处理
 */
const handleAmountChange = () => {
  // 如果是自动分配模式，重新计算分配
  if (splitMethod.value === 'equal' && billForm.participants.length > 0) {
    handleEqualSplit()
  } else if (splitMethod.value === 'proportional' && billForm.participants.length > 0) {
    handleProportionalSplit()
  }
}

/**
 * 处理账单周期变更
 * @param cycle 账单周期
 */
const handleBillCycleChange = (cycle: string) => {
  console.log('账单周期变更:', cycle)
  
  // 根据选择的周期自动调整日期
  const now = new Date()
  let nextDate = new Date()
  
  switch (cycle) {
    case 'weekly':
      nextDate.setDate(now.getDate() + 7)
      break
    case 'monthly':
      nextDate.setMonth(now.getMonth() + 1)
      break
    case 'quarterly':
      nextDate.setMonth(now.getMonth() + 3)
      break
    case 'yearly':
      nextDate.setFullYear(now.getFullYear() + 1)
      break
    case 'once':
    default:
      nextDate.setMonth(now.getMonth() + 1)
      break
  }
  
  // 自动设置付款期限
  billForm.dueDate = nextDate.toISOString().split('T')[0]
  
  // 如果是周期性账单，可以显示相关提示
  if (cycle !== 'once') {
    ElMessage.info('已选择周期性账单，请确保成员信息准确')
  }
}

/**
 * 处理分摊方式变更
 * @param method 分摊方式
 */
const handleSplitMethodChange = (method: string) => {
  if (method === 'equal') {
    handleEqualSplit()
  } else if (method === 'proportional') {
    handleProportionalSplit()
  }
}

/**
 * 平均分配
 */
const handleEqualSplit = () => {
  if (billForm.participants.length === 0) return
  
  const amountPerPerson = totalAmount.value / billForm.participants.length
  
  billForm.participants.forEach(participant => {
    participant.amount = Math.round(amountPerPerson * 100) / 100
  })
}

/**
 * 按比例分配
 */
const handleProportionalSplit = () => {
  if (billForm.participants.length === 0) return
  
  // 模拟按比例分配逻辑
  // 使用固定权重，实际应用中应通过API获取真实权重
  const weights = billForm.participants.map((_, index) => (index + 1) * 10)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  
  billForm.participants.forEach((participant, index) => {
    const proportion = weights[index] / totalWeight
    participant.amount = Math.round(totalAmount.value * proportion * 100) / 100
  })
}

/**
 * 验证表单
 */
const validateForm = async () => {
  try {
    // 基础验证
    await billFormRef.value.validate()
    
    // 自定义验证
    if (billForm.expenses.length === 0) {
      ElMessage.warning('请至少添加一个费用明细')
      return false
    }
    
    if (billForm.participants.length === 0) {
      ElMessage.warning('请至少添加一个参与成员')
      return false
    }
    
    // 验证费用明细
    const invalidExpense = billForm.expenses.find(expense => 
      !expense.title.trim() || 
      !expense.category || 
      expense.amount <= 0 ||
      !expense.date
    )
    
    if (invalidExpense) {
      ElMessage.warning('请完善所有费用明细信息')
      return false
    }
    
    // 验证参与成员
    const invalidParticipant = billForm.participants.find(participant => 
      !participant.name.trim() || participant.amount <= 0
    )
    
    if (invalidParticipant) {
      ElMessage.warning('请完善所有参与成员信息')
      return false
    }
    
    // 验证金额分配
    if (Math.abs(remainingAmount.value) > 0.01) {
      ElMessage.warning(`金额分配不匹配，剩余 ${formatCurrency(remainingAmount.value)}`)
      return false
    }
    
    // 验证日期逻辑
    if (billForm.billDate && billForm.dueDate && billForm.billDate > billForm.dueDate) {
      ElMessage.warning('付款期限不能早于账单日期')
      return false
    }
    
    return true
  } catch (error) {
    console.error('表单验证失败:', error)
    return false
  }
}

/**
 * 显示账单预览
 */
const handleShowPreview = async () => {
  const isValid = await validateForm()
  
  if (!isValid) return
  
  // 构建预览数据
  previewData.value = {
    ...billForm,
    totalAmount: totalAmount.value,
    previewAt: new Date().toISOString(),
    expenseSummary: {
      byCategory: expensesByCategory.value,
      byDate: expensesByDate.value,
      timeRange: expenseTimeRange.value,
      totalItems: billForm.expenses.length,
      categoriesCount: Object.keys(expensesByCategory.value).length
    },
    participantSummary: {
      totalParticipants: billForm.participants.length,
      allocatedAmount: allocatedAmount.value,
      remainingAmount: remainingAmount.value,
      distributionMethod: splitMethod.value
    }
  }
  
  showPreview.value = true
}

/**
 * 确认提交账单
 */
const handleConfirmSubmit = async () => {
  showPreview.value = false
  submitLoading.value = true
  
  try {
    // 构建提交数据
    const submitData = {
      ...previewData.value,
      submittedAt: new Date().toISOString()
    }
    
    console.log('提交账单数据:', submitData)
    
    if (isEditMode.value && billId.value) {
      // 编辑模式：更新账单
      await billService.updateBill(billId.value, submitData)
      ElMessage.success('账单更新成功！')
    } else {
      // 创建模式：创建账单
      await billService.createBill(submitData)
      ElMessage.success('账单创建成功！')
    }
    
    // 跳转到账单列表页
    router.push('/dashboard/bills')
    
  } catch (error) {
    console.error('提交账单失败:', error)
    ElMessage.error('提交账单失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

/**
 * 取消预览
 */
const handleCancelPreview = () => {
  showPreview.value = false
}

/**
 * 获取账单类型标签
 * @param type 账单类型值
 * @returns 账单类型标签
 */
const getBillTypeLabel = (type: string) => {
  const billType = billTypes.find(bt => bt.value === type)
  return billType?.label || type
}

/**
 * 获取账单周期标签
 * @param cycle 账单周期值
 * @returns 账单周期标签
 */
const getBillCycleLabel = (cycle: string) => {
  const billCycle = billCycles.find(bc => bc.value === cycle)
  return billCycle?.label || cycle
}

/**
 * 获取费用类别标签
 * @param category 费用类别值
 * @returns 费用类别标签
 */
const getExpenseCategoryLabel = (category: string) => {
  const expenseCategory = expenseCategories.find(ec => ec.value === category)
  return expenseCategory?.label || category
}

/**
 * 处理定时生成设置开关
 * @param enabled 是否启用
 */
const handleScheduleToggle = (enabled: boolean) => {
  console.log('定时生成设置:', enabled ? '启用' : '禁用')
  
  if (enabled) {
    // 启用时设置默认值
    if (!billForm.schedule.frequency) {
      billForm.schedule.frequency = 'monthly'
    }
    if (!billForm.schedule.time) {
      billForm.schedule.time = '09:00'
    }
    
    // 计算下次生成时间
    calculateNextGeneration()
    
    ElMessage.success('定时生成设置已启用')
  } else {
    ElMessage.info('定时生成设置已禁用')
  }
}

/**
 * 处理生成频率变更
 * @param frequency 生成频率
 */
const handleFrequencyChange = (frequency: string) => {
  console.log('生成频率变更:', frequency)
  
  // 根据频率设置默认值
  switch (frequency) {
    case 'daily':
      // 每日生成，不需要额外的日期设置
      break
    case 'weekly':
      // 每周生成，默认选择周一
      if (billForm.schedule.dayOfWeek === undefined) {
        billForm.schedule.dayOfWeek = 1
      }
      break
    case 'monthly':
      // 每月生成，默认选择1号
      if (billForm.schedule.dayOfMonth === undefined) {
        billForm.schedule.dayOfMonth = 1
      }
      break
    case 'yearly':
      // 每年生成，默认选择1月1号
      break
  }
  
  // 重新计算下次生成时间
  calculateNextGeneration()
}

/**
 * 计算下次生成时间
 */
const calculateNextGeneration = () => {
  if (!billForm.schedule.enabled) {
    billForm.schedule.nextGeneration = ''
    return
  }
  
  const now = new Date()
  const [hours, minutes] = billForm.schedule.time.split(':').map(Number)
  let nextGen = new Date(now)
  nextGen.setHours(hours, minutes, 0, 0)
  
  switch (billForm.schedule.frequency) {
    case 'daily':
      // 每日：如果是今天且时间已过，则明天，否则今天
      if (nextGen <= now) {
        nextGen.setDate(nextGen.getDate() + 1)
      }
      break
      
    case 'weekly':
      // 每周：计算到指定星期的时间
      const targetDay = billForm.schedule.dayOfWeek
      const currentDay = now.getDay()
      let daysToAdd = targetDay - currentDay
      
      if (daysToAdd <= 0) {
        daysToAdd += 7 // 下周
      }
      
      nextGen.setDate(now.getDate() + daysToAdd)
      break
      
    case 'monthly':
      // 每月：计算到指定日期的时间
      const targetDate = billForm.schedule.dayOfMonth
      const currentDate = now.getDate()
      
      if (currentDate <= targetDate) {
        // 本月
        nextGen.setDate(targetDate)
      } else {
        // 下月
        nextGen.setMonth(nextGen.getMonth() + 1)
        nextGen.setDate(targetDate)
      }
      break
      
    case 'yearly':
      // 每年：假设每年1月1号
      if (nextGen <= now || nextGen.getMonth() === 0 && nextGen.getDate() === 1) {
        nextGen.setFullYear(nextGen.getFullYear() + 1, 0, 1)
      }
      break
  }
  
  // 如果计算出的时间是过去时间，按频率向前推
  if (nextGen <= now) {
    switch (billForm.schedule.frequency) {
      case 'daily':
        nextGen.setDate(nextGen.getDate() + 1)
        break
      case 'weekly':
        nextGen.setDate(nextGen.getDate() + 7)
        break
      case 'monthly':
        nextGen.setMonth(nextGen.getMonth() + 1)
        break
      case 'yearly':
        nextGen.setFullYear(nextGen.getFullYear() + 1)
        break
    }
  }
  
  // 格式化为中文显示
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long'
  }
  
  billForm.schedule.nextGeneration = nextGen.toLocaleDateString('zh-CN', formatOptions)
}

// 初始化时设置默认日期
billForm.billDate = new Date().toISOString().split('T')[0]
billForm.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

// 组件挂载时的逻辑
onMounted(async () => {
  // 如果是编辑模式，加载账单数据
  if (isEditMode.value && billId.value) {
    console.log('[BillCreate] 编辑模式，加载账单数据:', billId.value)
    try {
      const response = await billService.getBillDetail(billId.value)
      console.log('[BillCreate] 获取账单详情成功:', response)
      
      // 处理后端返回的数据
      let billData;
      if (response && !response.success && !Array.isArray(response)) {
        // 后端直接返回了账单对象
        billData = response
      } else if (response && response.success) {
        // 标准格式 {success: true, data: {...}}
        billData = response.data
      } else {
        throw new Error('获取账单详情失败')
      }
      
      // 填充表单数据
      billForm.title = billData.title || ''
      billForm.type = billData.type || ''
      billForm.description = billData.description || ''
      billForm.billDate = billData.billDate || billData.date || ''
      billForm.dueDate = billData.dueDate || ''
      
      // 填充参与者和费用数据（如果有的话）
      if (billData.participants) {
        billForm.participants = billData.participants
      }
      if (billData.expenses) {
        billForm.expenses = billData.expenses
      }
      
      console.log('[BillCreate] 表单数据填充完成:', billForm)
    } catch (error) {
      console.error('[BillCreate] 加载账单数据失败:', error)
      ElMessage.error('加载账单数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }
})
</script>

<style scoped>
.bill-create {
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

/* 表单内容样式 */
.form-content {
  max-width: 1200px;
  margin: 0 auto;
}

.bill-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.add-btn {
  margin-left: auto;
}

/* 总金额显示 */
.total-amount-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #f0f9ff;
  border: 1px solid #e1f3fe;
  border-radius: 6px;
}

.amount-label {
  font-size: 14px;
  color: #606266;
}

.amount-value {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
}

/* 参与成员样式 */
.empty-participants {
  padding: 40px 0;
  text-align: center;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: #fafafa;
}

.participant-avatar {
  flex-shrink: 0;
}

.participant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.participant-amount {
  min-width: 120px;
}

.participant-actions {
  flex-shrink: 0;
}

.delete-btn {
  color: #f56c6c;
}

.delete-btn:hover {
  color: #f78989;
}

/* 分摊方式样式 */
.split-method {
  padding: 16px;
  background-color: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.split-method-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.split-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.split-hint {
  font-size: 12px;
  color: #909399;
}

/* 金额分配统计 */
.amount-summary {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #909399;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.remaining-warning {
  color: #e6a23c;
}

/* 费用明细样式 */
.empty-expenses {
  padding: 40px 0;
  text-align: center;
}

.expenses-table {
  overflow-x: auto;
}

/* 费用汇总样式 */
.expense-summary {
  margin-top: 20px;
}

.summary-tabs {
  margin-bottom: 16px;
}

.summary-tabs .el-tabs {
  border-radius: 6px;
  overflow: hidden;
}

.summary-content {
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.summary-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.summary-item-row:last-child {
  border-bottom: none;
}

.category-name, .date-name {
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.category-amount, .date-amount {
  font-weight: 600;
  color: #409eff;
  margin: 0 16px;
  min-width: 80px;
  text-align: right;
}

.category-count, .date-count {
  color: #909399;
  font-size: 12px;
  min-width: 40px;
  text-align: right;
}

/* 快速汇总样式 */
.quick-summary {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.quick-summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.quick-label {
  font-size: 12px;
  color: #909399;
}

.quick-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 操作按钮样式 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px 0;
}

.form-actions .el-button {
  min-width: 120px;
}

/* 表单项样式优化 */
.el-form-item {
  margin-bottom: 16px;
}

.el-table .el-input-number {
  width: 100% !important;
}

/* 手动调整样式 */
.amount-adjustment {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.amount-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-percentage {
  background: #f0f9ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  min-width: 45px;
  text-align: center;
}

.adjustment-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-adjust-buttons {
  display: flex;
  gap: 4px;
}

.quick-adjust-buttons .el-button {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  min-height: 20px;
  line-height: 1;
  border: none;
  background: transparent;
  color: #909399;
  transition: all 0.2s;
}

.quick-adjust-buttons .el-button:hover {
  background-color: #f0f9ff;
  color: #1890ff;
}

.quick-adjust-buttons .el-button.el-button--text:hover {
  color: #1890ff;
  background-color: #f0f9ff;
}

.smart-distribution-section {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.smart-distribution-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  color: white;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.smart-distribution-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  background: linear-gradient(45deg, #5a67d8, #6b46c1);
}

.smart-distribution-btn i {
  font-size: 14px;
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
  }
  
  .participants-list {
    gap: 12px;
  }
  
  .participant-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .participant-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }
  
  .amount-summary {
    flex-direction: column;
    gap: 12px;
  }
  
  .amount-adjustment {
    gap: 6px;
  }
  
  .adjustment-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
  
  .quick-adjust-buttons {
    justify-content: space-around;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
  
  .smart-distribution-section {
     padding: 12px;
   }
  }

  /* 预览对话框样式 */
  .bill-preview {
    max-height: 70vh;
    overflow-y: auto;
  }

  .preview-section {
    margin-bottom: 24px;
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
  }

  .preview-section:last-child {
    margin-bottom: 0;
  }

  .preview-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #409eff;
  }

  .preview-subtitle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 12px 0;
  }

  .preview-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .info-label {
    font-weight: 500;
    color: #606266;
    min-width: 80px;
  }

  .info-value {
    color: #303133;
  }

  .preview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
  }

  .stat-label {
    font-size: 12px;
    color: #909399;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #409eff;
  }

  .preview-participants {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .participant-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
  }

  .participant-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .participant-name {
    font-weight: 500;
    color: #303133;
  }

  .participant-email {
    font-size: 12px;
    color: #909399;
  }

  .participant-amount {
    font-weight: 600;
    color: #409eff;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .amount-percentage {
    font-size: 12px;
    color: #909399;
    font-weight: normal;
  }

  .preview-expenses {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .expense-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: white;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
  }

  .expense-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .expense-title {
    font-weight: 500;
    color: #303133;
  }

  .expense-category {
    font-size: 12px;
    color: #909399;
    background: #f0f9ff;
    padding: 2px 6px;
    border-radius: 10px;
  }

  .expense-date {
    font-size: 12px;
    color: #909399;
  }

  .expense-amount {
    font-weight: 600;
    color: #67c23a;
    min-width: 80px;
    text-align: right;
  }

  .preview-description {
    padding: 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    color: #606266;
    line-height: 1.6;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  /* 定时生成设置样式 */
  .schedule-settings {
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
  }

  .schedule-content {
    padding: 8px 0;
  }

  .schedule-disabled {
    padding: 20px 0;
    text-align: center;
  }

  .schedule-row {
    margin-bottom: 16px;
  }

  .schedule-row:last-child {
    margin-bottom: 0;
  }

  .frequency-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .frequency-option {
    padding: 8px 16px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
  }

  .frequency-option:hover {
    border-color: #409eff;
    color: #409eff;
  }

  .frequency-option.active {
    background: #409eff;
    border-color: #409eff;
    color: white;
  }

  .time-setting {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .next-generation-alert {
    margin-top: 16px;
    padding: 12px;
    background: #f0f9ff;
    border: 1px solid #b3d8ff;
    border-radius: 6px;
    color: #606266;
  }

  .next-generation-alert .el-alert__title {
    color: #409eff;
    font-weight: 500;
  }

  .schedule-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .schedule-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 6px;
    margin-top: 12px;
    font-size: 14px;
    color: #606266;
  }

  .schedule-icon {
    color: #409eff;
  }

  .schedule-description {
    color: #909399;
    font-size: 13px;
    line-height: 1.5;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .preview-info {
      grid-template-columns: 1fr;
    }
    
    .preview-stats {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .participant-preview,
    .expense-preview {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .participant-info {
      flex-wrap: wrap;
    }
    
    .expense-info {
      flex-wrap: wrap;
    }
  }
</style>