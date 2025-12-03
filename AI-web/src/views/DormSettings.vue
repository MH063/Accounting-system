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
              <el-input 
                v-model="basicForm.dormName" 
                placeholder="请输入寝室名称"
                maxlength="20"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="寝室类型">
              <el-select v-model="basicForm.dormType" placeholder="选择寝室类型">
                <el-option label="标准四人间" value="standard_4" />
                <el-option label="标准六人间" value="standard_6" />
                <el-option label="豪华双人间" value="luxury_2" />
                <el-option label="单人间" value="single" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="开门时间">
              <el-time-picker 
                v-model="basicForm.openTime" 
                format="HH:mm"
                placeholder="选择开门时间"
              />
            </el-form-item>
            
            <el-form-item label="关门时间">
              <el-time-picker 
                v-model="basicForm.closeTime" 
                format="HH:mm"
                placeholder="选择关门时间"
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
                  placeholder="开始时间"
                />
                <span class="time-separator">至</span>
                <el-time-picker 
                  v-model="notificationForm.quietEnd" 
                  format="HH:mm"
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
                :page-sizes="[5, 10, 20, 50, 100]"
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
import { dormService } from '@/services/dormService'
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
  cancel: false
})

// 寝室成员
const dormMembers = ref<DormMember[]>([
  { id: '1', name: '张三', weight: 1.0 },
  { id: '2', name: '李四', weight: 1.0 },
  { id: '3', name: '王五', weight: 1.0 }
])

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

const historyRecords = ref<HistoryRecord[]>([
  {
    id: '1',
    timestamp: '2024-01-15 14:30:00',
    type: 'basic',
    operator: '张三',
    description: '修改了寝室名称为"温馨小屋"',
    changes: [
      { field: '寝室名称', oldValue: '101号寝室', newValue: '温馨小屋' }
    ]
  }
])

// 计算属性
const canStartDismiss = computed(() => {
  return dismissStatus.value.type === 'success'
})

const canConfirmDismiss = computed(() => {
  return dismissSteps.value.active === 1
})

const canCancelDismiss = computed(() => {
  return dismissSteps.value.active > 0 && dismissSteps.value.active < 4
})

const hasPendingFees = computed(() => {
  return pendingFees.value.length > 0
})

const pendingFees = ref<PendingFee[]>([
  { member: '张三', item: '电费', amount: 45.50, status: 'pending' },
  { member: '李四', item: '水费', amount: 23.80, status: 'pending' },
  { member: '王五', item: '网费', amount: 50.00, status: 'paid' }
])

// 方法
const loadDormSettings = async () => {
  try {
    const response = await dormService.getDormSettings(dormId.value)
    if (response.success && response.data) {
      const settings = response.data
      // 加载基本信息
      if (settings.basic) {
        basicForm.value = { ...basicForm.value, ...settings.basic }
      }
      // 加载通知设置
      if (settings.notifications) {
        notificationForm.value.methods = settings.notifications.methods || ['push']
      }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
    ElMessage.error('加载设置失败')
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
      // 记录历史
      addHistoryRecord('basic', '修改基本信息', [
        { field: '寝室名称', oldValue: '原名称', newValue: basicForm.value.dormName }
      ])
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
      addHistoryRecord('billing', '修改费用分摊规则', [])
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
      addHistoryRecord('notification', '修改通知偏好', [])
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
    // 模拟开始解散流程
    await new Promise(resolve => setTimeout(resolve, 1000))
    dismissStatus.value = {
      type: 'warning',
      text: '解散流程中',
      description: '正在处理解散相关事务'
    }
    dismissSteps.value.active = 1
    ElMessage.success('开始解散流程')
    addHistoryRecord('other', '开始寝室解散流程', [])
  } catch (error) {
    ElMessage.error('启动解散流程失败')
  } finally {
    processing.value.dismiss = false
  }
}

const confirmDismiss = async () => {
  processing.value.confirm = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    dismissSteps.value.active = 4
    dismissStatus.value = {
      type: 'danger',
      text: '已解散',
      description: '寝室已正式解散'
    }
    ElMessage.success('寝室解散完成')
    addHistoryRecord('other', '完成寝室解散', [])
  } catch (error) {
    ElMessage.error('确认解散失败')
  } finally {
    processing.value.confirm = false
  }
}

const cancelDismiss = async () => {
  processing.value.cancel = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    dismissStatus.value = {
      type: 'success',
      text: '正常运营',
      description: '寝室运行状态正常'
    }
    dismissSteps.value.active = 0
    ElMessage.success('已取消解散流程')
  } catch (error) {
    ElMessage.error('取消解散失败')
  } finally {
    processing.value.cancel = false
  }
}

// 历史记录相关
const addHistoryRecord = (type: string, description: string, changes: HistoryChange[]) => {
  const newRecord: HistoryRecord = {
    id: Date.now().toString(),
    timestamp: new Date().toLocaleString('zh-CN'),
    type: type as 'basic' | 'billing' | 'notification' | 'other',
    operator: '当前用户',
    description,
    changes
  }
  historyRecords.value.unshift(newRecord)
}

const getHistoryTypeColor = (type: string) => {
  const colors = {
    basic: 'primary',
    billing: 'success',
    notification: 'warning',
    other: 'info'
  }
  return colors[type as keyof typeof colors] || 'info'
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

const loadHistory = () => {
  // 模拟加载历史记录
  console.log('加载历史记录', historyFilters.value)
}

const resetHistoryFilters = () => {
  historyFilters.value = {
    type: '',
    dateRange: []
  }
  loadHistory()
}

// 生命周期
onMounted(() => {
  loadDormSettings()
  console.log('寝室设置页面已加载，寝室ID:', dormId.value)
})
</script>

<style scoped>
.dorm-settings {
  padding: 20px;
}
</style>