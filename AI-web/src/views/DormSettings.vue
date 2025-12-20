<template>
  <div class="dorm-settings">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">寝室设置</h1>
          <p class="page-subtitle">管理寝室基本信息、规则和设置</p>
        </div>
        <div class="header-actions">
          <el-button @click="router.back()" type="default" :icon="ArrowLeft">
            返回
          </el-button>
        </div>
      </div>
    </div>

    <!-- 设置选项卡 -->
    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 基本信息 -->
      <el-tab-pane label="基本信息" name="basic">
        <div class="settings-section">
          <el-form :model="basicForm" label-width="120px" class="settings-form">
            <el-form-item label="寝室名称">
              <div class="text-display">{{ basicForm.dormName || '暂无名称' }}</div>
            </el-form-item>
            
            <el-form-item label="寝室类型">
              <div class="text-display">{{ getDormTypeText(basicForm.dormType) }}</div>
            </el-form-item>
            
            <el-form-item label="开门时间">
              <el-time-picker 
                v-model="basicForm.openTime" 
                format="HH:mm"
                placeholder="选择开门时间"
                value-format="HH:mm"
              />
            </el-form-item>
            
            <el-form-item label="关门时间">
              <el-time-picker 
                v-model="basicForm.closeTime" 
                format="HH:mm"
                placeholder="选择关门时间"
                value-format="HH:mm"
              />
            </el-form-item>
            
            <el-form-item label="最大访客数">
              <el-input-number 
                v-model="basicForm.maxVisitors" 
                :min="0" 
                :max="10"
                controls-position="right"
              />
            </el-form-item>
            
            <el-form-item label="访客时限">
              <div class="time-input-group">
                <el-input-number 
                  v-model="basicForm.visitTimeLimit" 
                  :min="1" 
                  :max="12"
                  controls-position="right"
                />
                <span class="unit">小时</span>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-checkbox v-model="basicForm.allowOvernightGuests">
                允许访客过夜
              </el-checkbox>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings" :loading="saving.basic">
                保存基本信息
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 费用分摊规则 -->
      <el-tab-pane label="费用分摊" name="billing">
        <div class="settings-section">
          <div class="section-header">
            <h3>费用分摊规则设置</h3>
            <p class="section-desc">配置各种费用的分摊方式和计算规则</p>
          </div>
          
          <el-form :model="billingForm" label-width="120px" class="settings-form">
            <el-form-item label="分摊方式">
              <el-radio-group v-model="billingForm.sharingType">
                <el-radio value="equal">平均分摊</el-radio>
                <el-radio value="area">按面积分摊</el-radio>
                <el-radio value="usage">按使用量分摊</el-radio>
                <el-radio value="custom">自定义权重</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <!-- 自定义权重设置 -->
            <el-form-item v-if="billingForm.sharingType === 'custom'" label="成员权重">
              <div class="member-weights">
                <div v-for="member in dormMembers" :key="member.id" class="weight-item">
                  <span>{{ member.name }}</span>
                  <el-input-number 
                    v-model="member.weight" 
                    :min="0.1" 
                    :max="10" 
                    :step="0.1"
                    :precision="2"
                  />
                </div>
              </div>
            </el-form-item>
            
            <!-- 水电费设置 -->
            <div class="fee-category">
              <h4>水电费设置</h4>
              <el-form-item label="水费计算">
                <el-radio-group v-model="billingForm.waterBillingType">
                  <el-radio value="equal">平均分摊</el-radio>
                  <el-radio value="usage">按使用量分摊</el-radio>
                  <el-radio value="per_person">按人数分摊</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="电费计算">
                <el-radio-group v-model="billingForm.electricityBillingType">
                  <el-radio value="equal">平均分摊</el-radio>
                  <el-radio value="usage">按使用量分摊</el-radio>
                  <el-radio value="per_person">按人数分摊</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            
            <!-- 网费设置 -->
            <div class="fee-category">
              <h4>网络费用</h4>
              <el-form-item label="网费分摊">
                <el-radio-group v-model="billingForm.internetBillingType">
                  <el-radio value="equal">平均分摊</el-radio>
                  <el-radio value="per_device">按设备数分摊</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>
            
            <!-- 公共物品费用 -->
            <div class="fee-category">
              <h4>公共物品费用</h4>
              <el-form-item label="费用项目">
                <div class="fee-items">
                  <div v-for="item in billingForm.publicItems" :key="item.id" class="fee-item">
                    <el-input v-model="item.name" placeholder="费用名称" />
                    <el-input-number 
                      v-model="item.amount" 
                      :min="0" 
                      :precision="2"
                      controls-position="right"
                    />
                    <el-button 
                      type="danger" 
                      :icon="Delete" 
                      size="small"
                      @click="removePublicItem(item.id)"
                    />
                  </div>
                </div>
                <el-button type="primary" :icon="Plus" @click="addPublicItem">
                  添加费用项目
                </el-button>
              </el-form-item>
            </div>
            
            <el-form-item>
              <el-button type="primary" @click="saveBillingSettings" :loading="saving.billing">
                保存费用设置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 通知偏好 -->
      <el-tab-pane label="通知偏好" name="notifications">
        <div class="settings-section">
          <div class="section-header">
            <h3>通知偏好设置</h3>
            <p class="section-desc">配置各种通知的接收方式和偏好</p>
          </div>
          
          <el-form :model="notificationForm" label-width="120px" class="settings-form">
            <!-- 通知方式 -->
            <el-form-item label="通知方式">
              <el-checkbox-group v-model="notificationForm.methods">
                <el-checkbox value="sms">短信通知</el-checkbox>
                <el-checkbox value="email">邮件通知</el-checkbox>
                <el-checkbox value="push">推送通知</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <!-- 免打扰时间 -->
            <el-form-item label="免打扰时间">
              <div class="quiet-time">
                <el-time-picker 
                  v-model="notificationForm.quietStart" 
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="开始时间"
                />
                <span class="time-separator">至</span>
                <el-time-picker 
                  v-model="notificationForm.quietEnd" 
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="结束时间"
                />
              </div>
            </el-form-item>
            
            <!-- 通知类型 -->
            <el-form-item label="通知类型">
              <div class="notification-types">
                <div v-for="category in notificationCategories" :key="category.key" class="notification-category">
                  <h4>{{ category.name }}</h4>
                  <div class="notification-items">
                    <div 
                      v-for="item in category.items" 
                      :key="item.key" 
                      class="notification-item"
                    >
                      <div class="item-info">
                        <span class="item-title">{{ item.title }}</span>
                        <span class="item-desc">{{ item.description }}</span>
                      </div>
                      <el-switch v-model="item.enabled" />
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings" :loading="saving.notification">
                保存通知设置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 寝室解散 -->
      <el-tab-pane label="寝室解散" name="dismiss">
        <div class="settings-section">
          <div class="section-header">
            <h3>寝室解散流程</h3>
            <p class="section-desc">处理寝室解散的相关事务</p>
          </div>
          
          <div class="dismiss-section">
            <!-- 解散状态 -->
            <div class="status-card">
              <h4>当前状态</h4>
              <div class="status-info">
                <el-tag :type="dismissStatus.type">{{ dismissStatus.text }}</el-tag>
                <p class="status-desc">{{ dismissStatus.description }}</p>
              </div>
            </div>
            
            <!-- 解散流程 -->
            <div class="dismiss-steps">
              <el-steps :active="dismissSteps.active" finish-status="success">
                <el-step title="确认解散" description="所有成员确认解散" />
                <el-step title="费用结算" description="处理未结费用" />
                <el-step title="物品清点" description="确认公共物品" />
                <el-step title="完成解散" description="正式解散寝室" />
              </el-steps>
            </div>
            
            <!-- 解散操作 -->
            <div class="dismiss-actions">
              <el-button 
                v-if="canStartDismiss" 
                type="warning" 
                @click="startDismissProcess"
                :loading="processing.dismiss"
              >
                开始解散流程
              </el-button>
              
              <el-button 
                v-if="canCompleteSettlement" 
                type="primary" 
                @click="completeSettlement"
                :loading="processing.settlement"
                :disabled="!canClickSettlementButton"
              >
                完成费用结算
              </el-button>
              
              <el-button 
                v-if="canCompleteInventory" 
                type="primary" 
                @click="completeInventory"
                :loading="processing.inventory"
              >
                完成物品清点
              </el-button>
              
              <el-button 
                v-if="canConfirmDismiss" 
                type="primary" 
                @click="confirmDismiss"
                :loading="processing.confirm"
              >
                确认解散
              </el-button>
              
              <el-button 
                v-if="canCancelDismiss" 
                type="default" 
                @click="cancelDismiss"
                :loading="processing.cancel"
              >
                取消解散
              </el-button>
            </div>
            
            <!-- 费用结算预览 -->
            <div v-if="hasPendingFees" class="settlement-preview">
              <h4>待结算费用</h4>
              <el-table :data="pendingFees" style="width: 100%">
                <el-table-column prop="member" label="成员" width="120" />
                <el-table-column prop="item" label="费用项目" />
                <el-table-column prop="amount" label="金额" width="100">
                  <template #default="{ row }">
                    ¥{{ row.amount.toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'pending' ? 'warning' : 'success'">
                      {{ row.status === 'pending' ? '待缴' : '已缴' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 变更历史 -->
      <el-tab-pane label="变更历史" name="history">
        <div class="settings-section">
          <div class="section-header">
            <h3>设置变更历史</h3>
            <p class="section-desc">查看和追踪所有设置变更记录</p>
          </div>
          
          <!-- 筛选器 -->
          <div class="history-filters">
            <el-form :inline="true" :model="historyFilters">
              <el-form-item label="变更类型">
                <el-select v-model="historyFilters.type" placeholder="选择变更类型">
                  <el-option label="全部" value="" />
                  <el-option label="基本信息" value="basic" />
                  <el-option label="费用设置" value="billing" />
                  <el-option label="通知设置" value="notification" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="historyFilters.dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="loadHistory">筛选</el-button>
                <el-button @click="resetHistoryFilters">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <!-- 历史记录列表 -->
          <div class="history-list">
            <el-timeline>
              <el-timeline-item
                v-for="record in historyRecords"
                :key="record.id"
                :timestamp="record.timestamp"
                :type="getHistoryTypeColor(record.type)"
                :hollow="true"
              >
                <div class="history-item">
                  <div class="history-header">
                    <span class="history-type">{{ getHistoryTypeText(record.type) }}</span>
                    <span class="history-operator">{{ record.operator }}</span>
                  </div>
                  <div class="history-content">
                    <p class="history-description">{{ record.description }}</p>
                    <div v-if="record.changes.length > 0" class="history-changes">
                      <details>
                        <summary>查看变更详情</summary>
                        <div class="change-details">
                          <div v-for="change in record.changes" :key="change.field" class="change-item">
                            <span class="change-field">{{ change.field }}:</span>
                            <span class="change-old">{{ change.oldValue }}</span>
                            <span class="change-arrow">→</span>
                            <span class="change-new">{{ change.newValue }}</span>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            
            <!-- 分页 -->
            <div class="pagination">
              <el-pagination
                v-model:current-page="historyPage.current"
                v-model:page-size="historyPage.size"
                :page-sizes="[5, 8, 12, 20, 50]"
                :total="historyPage.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadHistory"
                @current-change="loadHistory"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 全局保存提示 -->
    <el-backtop :right="60" :bottom="60" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Delete, Plus } from '@element-plus/icons-vue'
import dormService from '@/services/dormService'
import type { 
  DormBasicSettings, 
  DormBillingSettings, 
  DormNotificationSettings, 
  DormNotificationCategory,
  DormMember,
  HistoryRecord,
  HistoryChange,
  PendingFee
} from '@/types'

// 路由
const route = useRoute()
const router = useRouter()
const dormId = ref(route.params.id as string)

// 当前激活的选项卡
const activeTab = ref('basic')

// 表单数据
const basicForm = ref<DormBasicSettings>({
  dormName: '',
  dormType: 'standard_4',
  openTime: '06:00',
  closeTime: '23:00',
  maxVisitors: 3,
  visitTimeLimit: 4,
  allowOvernightGuests: false
})

const billingForm = ref<DormBillingSettings>({
  sharingType: 'equal',
  waterBillingType: 'equal',
  electricityBillingType: 'equal',
  internetBillingType: 'equal',
  publicItems: []
})

const notificationForm = ref<DormNotificationSettings>({
  methods: ['push'],
  quietStart: '22:00',
  quietEnd: '07:00',
  categories: [] as DormNotificationCategory[]
})

// 状态管理
const saving = ref({
  basic: false,
  billing: false,
  notification: false
})

const processing = ref({
  dismiss: false,
  confirm: false,
  cancel: false,
  settlement: false,
  inventory: false
})

// 寝室成员
const dormMembers = ref<DormMember[]>([])

// 通知类别
const notificationCategories = ref<DormNotificationCategory[]>([
  {
    key: 'system',
    name: '系统通知',
    items: [
      {
        key: 'maintenance',
        title: '系统维护',
        description: '接收系统维护通知',
        enabled: true
      },
      {
        key: 'policy_update',
        title: '政策更新',
        description: '接收规章制度更新通知',
        enabled: true
      }
    ]
  },
  {
    key: 'device',
    name: '设备通知',
    items: [
      {
        key: 'device_error',
        title: '设备故障',
        description: '设备出现故障时通知',
        enabled: true
      },
      {
        key: 'maintenance_due',
        title: '维护提醒',
        description: '定期维护时间提醒',
        enabled: false
      }
    ]
  }
])

// 解散相关
const dismissStatus = ref({
  type: 'success',
  text: '正常运营',
  description: '寝室运行状态正常'
})

const dismissSteps = ref({
  active: 0
})

// 历史记录
const historyFilters = ref({
  type: '',
  dateRange: []
})

const historyPage = ref({
  current: 1,
  size: 5,
  total: 0
})

const historyRecords = ref<HistoryRecord[]>([])

// 计算属性
const canStartDismiss = computed(() => {
  return dismissStatus.value.type === 'success'
})

const canConfirmDismiss = computed(() => {
  return dismissSteps.value.active === 3
})

const canCancelDismiss = computed(() => {
  return dismissSteps.value.active > 0
})

const canCompleteSettlement = computed(() => {
  return dismissSteps.value.active === 1
})

const canCompleteInventory = computed(() => {
  return dismissSteps.value.active === 2
})

const hasPendingFees = computed(() => {
  return pendingFees.value.length > 0
})

const canClickSettlementButton = computed(() => {
  // 只有在步骤1时才显示按钮
  if (dismissSteps.value.active !== 1) {
    return false
  }
  
  // 如果没有待结算费用，可以点击
  if (pendingFees.value.length === 0) {
    return true
  }
  
  // 检查是否所有待结算费用都已缴
  const allPaid = pendingFees.value.every(fee => fee.status === 'paid')
  return allPaid
})

const pendingFees = ref<PendingFee[]>([])

// 方法
const loadDormSettings = async () => {
  try {
    // 1. 获取寝室基本信息（包括名称）
    const detailResponse = await dormService.getDormitoryDetail(dormId.value)
    console.log('获取寝室基本信息响应:', detailResponse)
    if (detailResponse.success) {
      const dormDetail = detailResponse.data || {}
      // 更新寝室名称
      basicForm.value.dormName = dormDetail.name || dormDetail.dormName || ''
      basicForm.value.dormType = dormDetail.type || dormDetail.dormType || basicForm.value.dormType
      console.log('加载寝室基本信息成功:', { dormName: basicForm.value.dormName, dormType: basicForm.value.dormType })
    }
    
    // 2. 获取寝室设置
    const response = await dormService.getDormSettings(dormId.value)
    console.log('获取寝室设置响应:', response)
    if (response.success) {
      // 确保settings数据结构正确
      const settings = response.data || {}
      
      // 加载基本信息设置
      if (settings.basic) {
        basicForm.value = { ...basicForm.value, ...settings.basic }
        console.log('加载基本信息设置成功:', settings.basic)
      }
      // 加载通知设置
      if (settings.notifications) {
        notificationForm.value.methods = settings.notifications.methods || ['push']
        notificationForm.value.quietStart = settings.notifications.quietStart || '22:00'
        notificationForm.value.quietEnd = settings.notifications.quietEnd || '07:00'
        console.log('加载通知设置成功:', settings.notifications)
      }
      // 加载费用分摊设置
      if (settings.billing) {
        billingForm.value = { ...billingForm.value, ...settings.billing }
        // 确保publicItems是数组
        billingForm.value.publicItems = Array.isArray(billingForm.value.publicItems) ? billingForm.value.publicItems : []
        console.log('加载费用设置成功:', settings.billing)
      }
    } else {
      // 处理API返回的错误
      console.error('获取寝室设置失败:', response.message)
      ElMessage.error(response.message || '获取寝室设置失败')
    }
  } catch (error) {
    console.error('加载设置失败:', error)
    ElMessage.error('加载设置失败: ' + (error as Error).message)
  }
}

const saveBasicSettings = async () => {
  saving.value.basic = true
  try {
    const response = await dormService.updateDormSettings(dormId.value, {
      type: 'basic',
      data: basicForm.value
    })
    
    if (response.success) {
      ElMessage.success('基本信息保存成功')
      // 重新加载设置和历史记录
      await Promise.all([loadDormSettings(), loadHistory()])
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存基本信息失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value.basic = false
  }
}

const saveBillingSettings = async () => {
  saving.value.billing = true
  try {
    const response = await dormService.updateDormSettings(dormId.value, {
      type: 'billing',
      data: billingForm.value
    })
    
    if (response.success) {
      ElMessage.success('费用设置保存成功')
      // 重新加载设置和历史记录
      await Promise.all([loadDormSettings(), loadHistory()])
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存费用设置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value.billing = false
  }
}

const saveNotificationSettings = async () => {
  saving.value.notification = true
  try {
    const response = await dormService.updateDormSettings(dormId.value, {
      type: 'notification',
      data: notificationForm.value
    })
    
    if (response.success) {
      ElMessage.success('通知设置保存成功')
      // 重新加载设置和历史记录
      await Promise.all([loadDormSettings(), loadHistory()])
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存通知设置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value.notification = false
  }
}

// 费用项目管理
const addPublicItem = () => {
  const newItem = {
    id: Date.now().toString(),
    name: '',
    amount: 0
  }
  billingForm.value.publicItems.push(newItem)
}

const removePublicItem = (id: string) => {
  const index = billingForm.value.publicItems.findIndex(item => item.id === id)
  if (index > -1) {
    billingForm.value.publicItems.splice(index, 1)
  }
}

// 解散相关方法
const startDismissProcess = async () => {
  processing.value.dismiss = true
  try {
    const response = await dormService.startDismissProcess(dormId.value)
    if (response.success) {
      dismissStatus.value = {
        type: 'warning',
        text: '解散流程中',
        description: '正在处理解散相关事务'
      }
      dismissSteps.value.active = 1
      // 保存解散流程状态
      saveDismissFlowStatus()
      ElMessage.success('开始解散流程')
      await loadHistory()
      await loadDormStatus() // 刷新解散状态
    } else {
      ElMessage.error(response.message || '启动解散流程失败')
    }
  } catch (error) {
    console.error('启动解散流程失败:', error)
    ElMessage.error('启动解散流程失败')
  } finally {
    processing.value.dismiss = false
  }
}

const completeSettlement = async () => {
  processing.value.settlement = true
  try {
    // 这里可以添加调用费用结算API的逻辑
    console.log('完成费用结算')
    dismissSteps.value.active = 2
    // 保存解散流程状态
    saveDismissFlowStatus()
    ElMessage.success('费用结算完成，进入物品清点阶段')
    await loadHistory()
    await loadDormStatus() // 刷新解散状态
  } catch (error) {
    console.error('费用结算失败:', error)
    ElMessage.error('费用结算失败')
  } finally {
    processing.value.settlement = false
  }
}

const completeInventory = async () => {
  processing.value.inventory = true
  try {
    // 这里可以添加调用物品清点API的逻辑
    console.log('完成物品清点')
    dismissSteps.value.active = 3
    // 保存解散流程状态
    saveDismissFlowStatus()
    ElMessage.success('物品清点完成，准备确认解散')
    await loadHistory()
    await loadDormStatus() // 刷新解散状态
  } catch (error) {
    console.error('物品清点失败:', error)
    ElMessage.error('物品清点失败')
  } finally {
    processing.value.inventory = false
  }
}

const confirmDismiss = async () => {
  processing.value.confirm = true
  try {
    const response = await dormService.confirmDismiss(dormId.value)
    if (response.success) {
      dismissSteps.value.active = 4
      dismissStatus.value = {
        type: 'danger',
        text: '已解散',
        description: '寝室已正式解散'
      }
      // 保存解散流程状态
      saveDismissFlowStatus()
      ElMessage.success('寝室解散完成')
      await loadHistory()
      await loadDormStatus() // 刷新解散状态
    } else {
      ElMessage.error(response.message || '确认解散失败')
    }
  } catch (error) {
    console.error('确认解散失败:', error)
    ElMessage.error('确认解散失败')
  } finally {
    processing.value.confirm = false
  }
}

const cancelDismiss = async () => {
  processing.value.cancel = true
  try {
    console.log('取消解散操作开始，当前步骤:', dismissSteps.value.active)
    
    // 1. 先同步后端状态，确保本地状态与后端一致
    await syncBackendStatus()
    console.log('同步后端状态后，当前步骤:', dismissSteps.value.active)
    
    // 2. 如果已经到了第四步（已解散）或本地状态显示正常运营，直接更新本地状态
    if (dismissSteps.value.active === 4 || dismissStatus.value.type === 'success') {
      // 直接更新本地状态，不调用API
      dismissStatus.value = {
        type: 'success',
        text: '正常运营',
        description: '寝室运行状态正常'
      }
      dismissSteps.value.active = 0
      // 清除解散流程状态
      clearDismissFlowStatus()
      ElMessage.success('已取消解散流程')
      await loadHistory()
      await loadDormStatus() // 刷新解散状态
      return
    }
    
    // 3. 非第四步状态，且本地状态显示解散流程中，调用API取消解散
    console.log('调用API取消解散，寝室ID:', dormId.value)
    const response = await dormService.cancelDismiss(dormId.value)
    console.log('取消解散API响应:', response)
    
    if (response.success) {
      // API调用成功，更新本地状态
      dismissStatus.value = {
        type: 'success',
        text: '正常运营',
        description: '寝室运行状态正常'
      }
      dismissSteps.value.active = 0
      // 清除解散流程状态
      clearDismissFlowStatus()
      ElMessage.success('已取消解散流程')
      await loadHistory()
      await loadDormStatus() // 刷新解散状态
    } else {
      // API调用失败
      console.error('取消解散API失败:', response.message)
      ElMessage.error(response.message || '取消解散失败')
      
      // 再次同步后端状态，确保本地状态与后端一致
      await syncBackendStatus()
    }
  } catch (error: any) {
    console.error('取消解散失败:', error)
    
    // 处理不同的错误情况
    if (error.message === '只有正在解散中的宿舍才能取消解散') {
      // 后端返回该错误，说明后端认为宿舍不在解散流程中
      console.log('后端认为宿舍不在解散流程中，同步后端状态')
      // 同步后端状态，更新本地状态
      await syncBackendStatus()
      
      // 更新本地状态为正常运营
      dismissStatus.value = {
        type: 'success',
        text: '正常运营',
        description: '寝室运行状态正常'
      }
      dismissSteps.value.active = 0
      // 清除解散流程状态
      clearDismissFlowStatus()
      ElMessage.success('解散流程已结束，状态已恢复为正常运营')
      await loadHistory()
      await loadDormStatus() // 刷新解散状态
    } else {
      ElMessage.error('取消解散失败')
    }
  } finally {
    processing.value.cancel = false
  }
}

// 获取寝室类型文本
const getDormTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    standard_4: '标准四人间',
    standard_6: '标准六人间',
    luxury_2: '豪华双人间',
    single: '单人间'
  }
  return typeMap[type] || '未知类型'
}

// 历史记录相关
const loadHistory = async () => {
  try {
    const response = await dormService.getDormHistory(dormId.value, {
      ...historyFilters.value,
      current: historyPage.value.current,
      size: historyPage.value.size
    })
    
    if (response.success && response.data) {
      // 确保historyRecords始终是一个数组
      const records = response.data.records || response.data.data || response.data || []
      historyRecords.value = Array.isArray(records) ? records : []
      historyPage.value.total = response.data.total || historyRecords.value.length
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
    ElMessage.error('加载历史记录失败')
    // 发生错误时，确保historyRecords是一个数组，避免渲染错误
    historyRecords.value = []
  }
}

const resetHistoryFilters = () => {
  historyFilters.value = {
    type: '',
    dateRange: []
  }
  historyPage.value.current = 1
  loadHistory()
}

const getHistoryTypeColor = (type: string) => {
  const colors = {
    basic: 'primary',
    billing: 'success',
    notification: 'warning',
    other: 'info'
  }
  // 确保返回有效的颜色值，避免undefined
  const color = colors[type as keyof typeof colors] || 'info'
  return color as 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const getHistoryTypeText = (type: string) => {
  const texts = {
    basic: '基本信息',
    billing: '费用设置',
    notification: '通知设置',
    other: '其他'
  }
  return texts[type as keyof typeof texts] || '未知'
}

// 加载寝室成员列表
const loadDormMembers = async () => {
  try {
    const response = await dormService.getDormMembers(dormId.value)
    if (response.success) {
      // 确保response.data是数组，否则使用空数组
      const membersData = response.data.data || response.data || []
      const members = Array.isArray(membersData) ? membersData : []
      dormMembers.value = members.map((member: any) => ({
        id: member.id,
        name: member.name,
        weight: 1.0
      }))
    }
  } catch (error) {
    console.error('加载寝室成员列表失败:', error)
    ElMessage.error('加载寝室成员列表失败')
    // 发生错误时，确保dormMembers是一个数组
    dormMembers.value = []
  }
}

// 加载待结算费用
const loadPendingFees = async () => {
  try {
    const response = await dormService.getPendingFees(dormId.value)
    console.log('获取待结算费用响应:', response)
    console.log('完整响应数据:', JSON.stringify(response))
    if (response.success) {
      // 确保response.data是数组，否则检查是否有data.fees或其他可能的字段
      let feesData = response.data || []
      
      // 检查数据结构，处理不同格式的响应
      if (!Array.isArray(feesData)) {
        // 如果data是对象，检查是否包含fees、items等可能的数组字段
        if (feesData.fees && Array.isArray(feesData.fees)) {
          feesData = feesData.fees
        } else if (feesData.items && Array.isArray(feesData.items)) {
          feesData = feesData.items
        } else if (feesData.pendingFees && Array.isArray(feesData.pendingFees)) {
          feesData = feesData.pendingFees
        } else {
          // 如果找不到数组字段，尝试直接使用对象作为单个费用项
          feesData = [feesData]
        }
      }
      
      pendingFees.value = feesData
      console.log('加载待结算费用成功，共', pendingFees.value.length, '条记录')
      console.log('待结算费用数据:', pendingFees.value)
    } else {
      console.error('获取待结算费用失败:', response.message)
      ElMessage.error(response.message || '获取待结算费用失败')
      pendingFees.value = []
    }
  } catch (error) {
    console.error('加载待结算费用失败:', error)
    ElMessage.error('加载待结算费用失败')
    // 发生错误时，确保pendingFees是一个数组
    pendingFees.value = []
  }
}

// 新增：获取寝室解散状态
const loadDormStatus = async () => {
  try {
    console.log('获取寝室解散状态:', dormId.value)
    // 通过获取寝室详情来获取解散状态
    const response = await dormService.getDormitoryDetail(dormId.value)
    console.log('获取寝室详情响应:', response)
    if (response.success) {
      // 注意：后端返回的数据结构是双层嵌套的，需要访问 response.data.dorm
      const dormDetail = response.data.dorm || response.data.data || response.data
      console.log('获取寝室详情:', dormDetail)
      
      // 检查是否有本地存储的状态，如果有则优先使用
      const hasLocalStatus = localStorage.getItem(getDismissFlowStorageKey()) !== null
      if (hasLocalStatus) {
        console.log('已存在本地存储的解散状态，优先使用')
        return
      }
      
      // 没有本地存储的状态时，使用后端返回的状态
      if (dormDetail.dismissalRecord && dormDetail.dismissalRecord.status === 'pending') {
        dismissStatus.value = {
          type: 'warning',
          text: '解散流程中',
          description: '正在处理解散相关事务'
        }
        dismissSteps.value.active = 1
        // 保存初始状态
        saveDismissFlowStatus()
        console.log('更新解散状态为：解散流程中')
      } else if (dormDetail.status === 'inactive') {
        dismissStatus.value = {
          type: 'danger',
          text: '已解散',
          description: '寝室已正式解散'
        }
        dismissSteps.value.active = 4
        // 保存初始状态
        saveDismissFlowStatus()
        console.log('更新解散状态为：已解散')
      } else {
        // 只有当状态不是解散流程中或已解散时，才重置为正常状态
        dismissStatus.value = {
          type: 'success',
          text: '正常运营',
          description: '寝室运行状态正常'
        }
        dismissSteps.value.active = 0
        // 清除状态
        clearDismissFlowStatus()
        console.log('更新解散状态为：正常运营')
      }
    }
  } catch (error) {
    console.error('获取寝室解散状态失败:', error)
  }
}

// 状态持久化相关
const getDismissFlowStorageKey = () => {
  return `dorm_dismiss_flow_${dormId.value}`
}

// 保存解散流程状态
const saveDismissFlowStatus = () => {
  const status = {
    activeStep: dismissSteps.value.active,
    statusType: dismissStatus.value.type,
    statusText: dismissStatus.value.text,
    statusDescription: dismissStatus.value.description,
    timestamp: Date.now()
  }
  localStorage.setItem(getDismissFlowStorageKey(), JSON.stringify(status))
  console.log('保存解散流程状态:', status)
}

// 恢复解散流程状态
const restoreDismissFlowStatus = () => {
  const savedStatus = localStorage.getItem(getDismissFlowStorageKey())
  if (savedStatus) {
    try {
      const status = JSON.parse(savedStatus)
      console.log('恢复解散流程状态:', status)
      dismissSteps.value.active = status.activeStep
      dismissStatus.value = {
        type: status.statusType,
        text: status.statusText,
        description: status.statusDescription
      }
      return true
    } catch (error) {
      console.error('恢复解散流程状态失败:', error)
      // 清除无效的存储数据
      localStorage.removeItem(getDismissFlowStorageKey())
      return false
    }
  }
  return false
}

// 清除解散流程状态
const clearDismissFlowStatus = () => {
  localStorage.removeItem(getDismissFlowStorageKey())
  console.log('清除解散流程状态')
}

// 同步后端状态到本地
const syncBackendStatus = async () => {
  try {
    // 通过获取寝室详情来获取最新的解散状态
    const response = await dormService.getDormitoryDetail(dormId.value)
    console.log('同步后端状态:', response)
    if (response.success) {
      // 注意：后端返回的数据结构是双层嵌套的，需要访问 response.data.dorm
      const dormDetail = response.data.dorm || response.data.data || response.data
      console.log('获取寝室详情:', dormDetail)
      
      // 更新本地状态以匹配后端状态
      if (dormDetail.dismissalRecord && dormDetail.dismissalRecord.status === 'pending') {
        // 后端显示正在解散中，保持本地状态
        console.log('后端状态：正在解散中，保持本地状态')
      } else if (dormDetail.status === 'inactive') {
        // 后端显示已解散，更新本地状态到步骤4
        dismissStatus.value = {
          type: 'danger',
          text: '已解散',
          description: '寝室已正式解散'
        }
        dismissSteps.value.active = 4
        saveDismissFlowStatus()
        console.log('后端状态：已解散，更新本地状态到步骤4')
      } else {
        // 后端显示正常运营，清除本地状态
        dismissStatus.value = {
          type: 'success',
          text: '正常运营',
          description: '寝室运行状态正常'
        }
        dismissSteps.value.active = 0
        clearDismissFlowStatus()
        console.log('后端状态：正常运营，清除本地状态')
      }
    }
  } catch (error) {
    console.error('同步后端状态失败:', error)
  }
}

// 生命周期
onMounted(async () => {
  // 先恢复本地存储的状态
  restoreDismissFlowStatus()
  
  await Promise.all([
    loadDormSettings(),
    loadDormMembers(),
    loadHistory(),
    loadPendingFees(),
    loadDormStatus()
  ])
  
  // 同步后端状态，确保本地状态与后端一致
  await syncBackendStatus()
  
  console.log('寝室设置页面已加载，寝室ID:', dormId.value)
})
</script>

<style scoped>
.dorm-settings {
  padding: 20px;
}

.text-display {
  line-height: 32px; /* 与表单控件高度一致 */
  color: #303133;
  font-size: 14px;
}
</style>