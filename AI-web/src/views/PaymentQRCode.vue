<template>
  <div class="payment-qr-code">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-title">
        <h1>收款码管理</h1>
        <span class="qr-count">共 {{ qrCodes.length }} 个收款码</span>
      </div>
      <div class="header-actions">
        <el-button @click="goBack" :icon="ArrowLeft">
          返回
        </el-button>

        <el-button type="success" @click="openUploadDialog" :icon="Upload">
          上传收款码
        </el-button>
        <el-button @click="openSecurityCheck" :icon="Lock">安全检测</el-button>
        <el-button @click="openStatisticsDialog" :icon="DataAnalysis">收款统计</el-button>
      </div>
    </div>



    <!-- 收款码列表 -->
    <div class="qr-codes-section">
      <div class="section-header">
        <h2>收款码列表</h2>
        <div class="section-actions">
          <el-button @click="openReminderDialog" :icon="Timer">收款提醒</el-button>
          <el-select v-model="filterPlatform" placeholder="支付平台" style="width: 120px" @change="filterQRCodes">
            <el-option label="全部平台" value="all" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="银联支付" value="unionpay" />
          </el-select>
          <el-select v-model="filterStatus" placeholder="状态筛选" style="width: 120px" @change="filterQRCodes">
            <el-option label="全部" value="all" />
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
          <el-select v-model="sortBy" placeholder="排序方式" style="width: 120px" @change="sortQRCodes">
            <el-option label="创建时间" value="createdAt" />
            <el-option label="使用次数" value="usageCount" />
          </el-select>
        </div>
      </div>

      <div class="qr-codes-grid">
        <div v-for="qr in filteredQRCodes" :key="qr.id" class="qr-card">
          <div class="qr-card-header">
            <div class="qr-info">
              <h3>{{ qr.name }}</h3>
              <el-tag size="small" :type="qr.platform === 'alipay' ? 'primary' : qr.platform === 'wechat' ? 'success' : 'warning'">
                {{ getQRPlatformText(qr.platform) }}
              </el-tag>
            </div>
            <div class="qr-status">
              <el-tag :type="qr.status === 'active' ? 'success' : 'info'">
                {{ qr.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </div>
          
          <div class="qr-code-display">
            <img :src="getImageUrl(qr.qrCodeUrl)" :alt="qr.name" class="qr-image" />
          </div>
          
          <div class="qr-details">
            <div class="qr-stats">
              <span>使用次数: {{ qr.usageCount }}</span>
            </div>
          </div>
          
          <div class="qr-actions">
            <el-button 
              size="small" 
              :type="qr.status === 'active' ? 'warning' : 'success'"
              @click="toggleQRCodeStatus(qr)"
            >
              {{ qr.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteQRCode(qr)">删除</el-button>
          </div>
        </div>
      </div>
    </div>



    <!-- 收款统计对话框 -->
    <el-dialog v-model="statisticsDialogVisible" title="收款统计" width="800px">
      <div class="statistics-content">
        <div class="chart-container">
          <h3>收入趋势图</h3>
          <div class="mock-chart">
            <div class="chart-bar" v-for="(data, index) in incomeTrend" :key="index">
              <div class="bar" :style="{ height: data.amount + 'px' }"></div>
              <span class="bar-label">{{ data.month }}</span>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <h3>支付方式分布</h3>
          <div class="method-distribution">
            <div class="method-item" v-for="method in methodDistribution" :key="method.name">
              <span class="method-name">{{ method.name }}</span>
              <span class="method-amount">¥{{ method.amount.toFixed(2) }}</span>
              <span class="method-percentage">{{ method.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 安全检测对话框 -->
    <el-dialog 
      v-model="securityDialogVisible" 
      :title="`安全检测报告 (${securityCheckResult?.lastCheckTime ? formatLocalDate(securityCheckResult.lastCheckTime) : ''})`" 
      width="700px"
      :loading="securityCheckLoading"
    >
      <div class="security-check">
        <div class="check-summary">
          <div class="summary-header">
            <h3>检测摘要</h3>
            <el-button size="small" @click="openSecurityCheck" :loading="securityCheckLoading">
              重新检测
            </el-button>
          </div>
        </div>
        
        <div class="check-item" :class="securityChecks.qrCodeStatus">
          <el-icon><Check v-if="securityChecks.qrCodeStatus === 'success'" /><Close v-else /></el-icon>
          <span>收款码状态检查</span>
          <span class="check-status">{{ securityChecks.qrCodeStatus === 'success' ? '正常' : securityChecks.qrCodeStatus === 'warning' ? '警告' : '错误' }}</span>
        </div>
        <div class="check-item" :class="securityChecks.usageAnalysis">
          <el-icon><Check v-if="securityChecks.usageAnalysis === 'success'" /><Close v-else /></el-icon>
          <span>使用频率分析</span>
          <span class="check-status">{{ securityChecks.usageAnalysis === 'success' ? '正常' : securityChecks.usageAnalysis === 'warning' ? '警告' : '错误' }}</span>
        </div>

        <div class="check-item" :class="securityChecks.permissions">
          <el-icon><Check v-if="securityChecks.permissions === 'success'" /><Close v-else /></el-icon>
          <span>权限检查</span>
          <span class="check-status">{{ securityChecks.permissions === 'success' ? '正常' : securityChecks.permissions === 'warning' ? '警告' : '错误' }}</span>
        </div>
        
        <!-- 问题列表 -->
        <div v-if="securityCheckResult?.issues && securityCheckResult.issues.length > 0" class="issues-section">
          <h4>发现的问题</h4>
          <ul class="issues-list">
            <li v-for="(issue, index) in securityCheckResult.issues" :key="index" class="issue-item">
              <el-icon class="issue-icon"><Warning /></el-icon>
              <span>{{ issue }}</span>
            </li>
          </ul>
        </div>
        
        <!-- 建议列表 -->
        <div v-if="securityCheckResult?.recommendations && securityCheckResult.recommendations.length > 0" class="recommendations-section">
          <h4>改进建议</h4>
          <ul class="recommendations-list">
            <li v-for="(recommendation, index) in securityCheckResult.recommendations" :key="index" class="recommendation-item">
              <el-icon class="recommendation-icon"><Star /></el-icon>
              <span>{{ recommendation }}</span>
            </li>
          </ul>
        </div>
        
        <!-- 检测历史 -->
        <div v-if="securityCheckHistory.length > 0" class="history-section">
          <h4>检测历史</h4>
          <div class="history-timeline">
            <div 
              v-for="history in securityCheckHistory.slice(0, 5)" 
              :key="history.id" 
              class="history-item"
            >
              <div class="history-time">{{ formatLocalDate(history.checkTime) }}</div>
              <div class="history-status" :class="history.status">
                <el-icon><Check v-if="history.status === 'success'" /><Warning v-else-if="history.status === 'warning'" /><Close v-else /></el-icon>
                {{ history.issueCount === 0 ? '正常' : `发现 ${history.issueCount} 个问题` }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="securityDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 收款提醒设置对话框 -->
    <el-dialog v-model="reminderDialogVisible" title="收款提醒设置" width="500px">
      <el-form :model="reminderForm" label-width="120px">
        <el-form-item label="启用提醒">
          <el-switch v-model="reminderForm.enabled" />
        </el-form-item>
        <el-form-item label="提醒方式">
          <el-checkbox-group v-model="reminderForm.methods">
            <el-checkbox label="email">邮件</el-checkbox>
            <el-checkbox label="sms">短信</el-checkbox>
            <el-checkbox label="push">推送</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="提醒间隔(分钟)">
          <el-input-number v-model="reminderForm.intervalMinutes" :min="5" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reminderDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveReminderSettings">保存设置</el-button>
        </span>
      </template>
    </el-dialog>



    <!-- 上传收款码对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传收款码" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="选择图片" required>
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :before-upload="handleFileUpload"
            :show-file-list="false"
            accept="image/*"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽图片到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传图片文件，且不超过 2MB
              </div>
            </template>
          </el-upload>
          <div v-if="uploadForm.file" class="upload-file-info">
            <el-icon><Document /></el-icon>
            <span>{{ uploadForm.file.name }}</span>
            <el-button type="text" @click="uploadForm.file = null">移除</el-button>
          </div>
        </el-form-item>
        <el-form-item label="支付平台" required>
          <el-select v-model="uploadForm.platform" placeholder="请选择支付平台" style="width: 100%">
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="银联支付" value="unionpay" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" placeholder="请输入描述信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUploadQRCode">上传</el-button>
        </span>
      </template>
    </el-dialog>


  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft,
  Lock,
  DataAnalysis,
  Timer,
  Check,
  Warning,
  Star,
  Close,
  Upload,
  UploadFilled,
  Document
} from '@element-plus/icons-vue'
import { 
  getQRCodes as getQRCodesApi,
  deleteQRCode as deleteQRCodeApi,
  performSecurityCheck,
  getSecurityCheckHistory,
  type SecurityCheckResult
} from '../services/paymentService'

import { formatLocalDate } from '@/utils/timeUtils'

// 收款码接口定义
interface QRCode {
  id: number
  name: string
  type: 'fixed' | 'custom' | 'dynamic'
  amount?: number
  description: string
  status: 'active' | 'inactive'
  usageLimit?: number
  usageCount: number
  createdAt: string
  updatedAt: string
  tags: string[]
  backgroundColor?: string
  qrCodeUrl?: string
  currency?: string
  merchantName?: string
  merchantAccount?: string
  isDefault?: boolean
  // 新增支付平台字段
  platform: 'alipay' | 'wechat' | 'unionpay'
  isUserUploaded: boolean
}

// 收入趋势数据接口定义
interface IncomeTrendItem {
  month: string
  amount: number
}

// 支付方式分布数据接口定义
interface MethodDistributionItem {
  name: string
  amount: number
  percentage: number
}

// 安全检测结果接口定义
interface SecurityChecks {
  qrCodeStatus: 'success' | 'warning' | 'error'
  usageAnalysis: 'success' | 'warning' | 'error'
  permissions: 'success' | 'warning' | 'error'
}

// 提醒设置接口定义
interface ReminderSettings {
  enabled: boolean
  methods: string[]
  intervalMinutes: number
}

// 响应式数据
const qrCodes = ref<QRCode[]>([])
const loading = ref(false)
const filterStatus = ref('all')
const filterPlatform = ref('all')
const filterType = ref('all') // 'all', 'uploaded', 'system'

// 安全检测相关数据
const securityCheckLoading = ref(false)
const securityCheckResult = ref<SecurityCheckResult | null>(null)
const securityCheckHistory = ref<any[]>([])



// 统计相关数据
// 加载统计数据
const loadStatistics = async () => {
  try {
    const { getPaymentStatistics } = await import('../services/paymentService')
    const response = await getPaymentStatistics()
    
    if (response.success && response.data) {
      statistics.totalIncome = response.data.totalIncome || 0
      statistics.totalIncome = response.data.totalIncome || 0
      statistics.totalTransactions = response.data.totalTransactions || 0
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const filteredQRCodes = computed(() => {
  let filtered = qrCodes.value
  
  // 状态筛选
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(qr => qr.status === filterStatus.value)
  }
  
  // 平台筛选
  if (filterPlatform.value !== 'all') {
    filtered = filtered.filter(qr => qr.platform === filterPlatform.value)
  }
  
  // 上传类型筛选
  if (filterType.value !== 'all') {
    if (filterType.value === 'uploaded') {
      filtered = filtered.filter(qr => qr.isUserUploaded === true)
    } else if (filterType.value === 'system') {
      filtered = filtered.filter(qr => qr.isUserUploaded === false)
    }
  }
  
  // 排序
  if (sortBy.value === 'createdAt') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sortBy.value === 'usageCount') {
    filtered.sort((a, b) => b.usageCount - a.usageCount)
  }
  
  return filtered
})

// 统计数据
const statistics = reactive({
  totalIncome: 0,
  todayIncome: 0,
  totalTransactions: 0
})

// 统计数据
const incomeTrend = ref<IncomeTrendItem[]>([])

const methodDistribution = ref<MethodDistributionItem[]>([])

// 安全检测结果
const securityChecks = ref<SecurityChecks>({
  qrCodeStatus: 'success',
  usageAnalysis: 'success',
  permissions: 'success'
})

// 加载安全检测数据
const loadSecurityData = async () => {
  try {
    const qrCodeIds = qrCodes.value.map(qr => qr.id)
    const response = await performSecurityCheck(qrCodeIds)
    
    if (response.success && response.data) {
      securityCheckResult.value = response.data
      
      // 更新显示的检测结果
      securityChecks.value = {
        qrCodeStatus: response.data.qrCodeStatus,
        usageAnalysis: response.data.usageAnalysis,
        permissions: response.data.permissions
      }
      
      // 获取安全检测历史
      const historyResponse = await getSecurityCheckHistory(30)
      if (historyResponse.success) {
        securityCheckHistory.value = historyResponse.data
      }
    }
  } catch (error) {
    console.error('加载安全检测数据失败:', error)
  }
}

// 提醒设置
const reminderForm = ref<ReminderSettings>({
  enabled: false,
  methods: [],
  intervalMinutes: 30
})

// 加载提醒设置
const loadReminderSettings = async () => {
  try {
    // 调用获取提醒设置的API
    const { getReminderSettings: getReminderSettingsApi } = await import('../services/paymentService')
    const response = await getReminderSettingsApi()
    
    if (response.success && response.data) {
      // 处理双层嵌套结构 (Rule 5)
      const actualData = (response.data as any)?.data || response.data
      reminderForm.value = {
        enabled: actualData.enabled ?? false,
        methods: actualData.methods ?? [],
        intervalMinutes: actualData.intervalMinutes ?? 30
      }
      console.log('提醒设置加载成功:', reminderForm.value)
    }
  } catch (error) {
    console.error('加载提醒设置失败:', error)
    ElMessage.error('加载提醒设置失败')
  }
}

const sortBy = ref('')
const statisticsDialogVisible = ref(false)
const securityDialogVisible = ref(false)
const reminderDialogVisible = ref(false)

// 计算属性已在上面定义

// 路由
const router = useRouter()

// 方法
const goBack = (): void => {
  router.push('/dashboard/payment')
}

const getQRCodesList = async (): Promise<void> => {
  try {
    loading.value = true
    const response = await getQRCodesApi()
    qrCodes.value = response.data.records || []
  } catch (error) {
    console.error('获取收款码列表失败:', error)
    ElMessage.error('获取收款码列表失败')
  } finally {
    loading.value = false
  }
}



const getQRPlatformText = (platform: 'alipay' | 'wechat' | 'unionpay'): string => {
  const platformMap: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    unionpay: '银联支付'
  }
  return platformMap[platform] || platform
}

// 获取完整的图片URL
const getImageUrl = (url?: string): string => {
  if (!url) return ''
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 拼接后端服务器地址
  const baseURL = 'http://10.111.53.9:4000'
  return `${baseURL}${url}`
}

const openReminderDialog = (): void => {
  reminderDialogVisible.value = true
}

const openStatisticsDialog = async (): Promise<void> => {
  try {
    // 加载收入趋势数据
    const { getIncomeTrend } = await import('../services/paymentService')
    const trendResponse = await getIncomeTrend()
    if (trendResponse.success && trendResponse.data) {
      incomeTrend.value = trendResponse.data.data || []
    }
    
    // 加载支付方式分布数据
    const { getPaymentMethodDistribution } = await import('../services/paymentService')
    const methodResponse = await getPaymentMethodDistribution()
    if (methodResponse.success && methodResponse.data) {
      methodDistribution.value = methodResponse.data.data || []
    }
    
    statisticsDialogVisible.value = true
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  }
}

const openSecurityCheck = async (): Promise<void> => {
  try {
    securityCheckLoading.value = true
    ElMessage.info('正在执行安全检测...')
    
    // 调用真实的安全检测API
    const qrCodeIds = qrCodes.value.map(qr => qr.id)
    const response = await performSecurityCheck(qrCodeIds)
    
    if (response.success) {
      securityCheckResult.value = response.data
      
      // 更新显示的检测结果
      securityChecks.value = {
        qrCodeStatus: response.data.qrCodeStatus,
        usageAnalysis: response.data.usageAnalysis,
        permissions: response.data.permissions
      }
      
      // 获取安全检测历史
      const historyResponse = await getSecurityCheckHistory(30)
      if (historyResponse.success) {
        securityCheckHistory.value = historyResponse.data
      }
      
      securityDialogVisible.value = true
      
      // 显示检测摘要
      const issueCount = response.data.issues?.length || 0
      if (issueCount === 0) {
        ElMessage.success('安全检测完成，未发现安全问题')
      } else if (issueCount <= 2) {
        ElMessage.warning(`安全检测完成，发现 ${issueCount} 个问题，建议关注`)
      } else {
        ElMessage.error(`安全检测完成，发现 ${issueCount} 个问题，需要立即处理`)
      }
    } else {
      ElMessage.error('安全检测失败，请稍后重试')
    }
  } catch (error) {
    console.error('安全检测错误:', error)
    ElMessage.error('安全检测过程中发生错误')
  } finally {
    securityCheckLoading.value = false
  }
}

const toggleQRCodeStatus = async (qr: QRCode): Promise<void> => {
  try {
    const newStatus: 'active' | 'inactive' = qr.status === 'active' ? 'inactive' : 'active'
    qr.status = newStatus
    // 更新本地数据
    const index = qrCodes.value.findIndex(item => item.id === qr.id)
    if (index !== -1 && qrCodes.value[index]) {
      qrCodes.value[index].status = newStatus
      qrCodes.value[index].updatedAt = new Date().toISOString()
    }
    ElMessage.success(`收款码已${newStatus === 'active' ? '启用' : '禁用'}`)
  } catch (error) {
    console.error('状态切换错误:', error)
    ElMessage.error('状态切换失败')
  }
}

const deleteQRCode = async (qr: QRCode): Promise<void> => {
  try {
    // 添加确认对话框
    const confirmResult = await ElMessageBox.confirm(
      `确定要删除收款码 "${qr.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (confirmResult === 'confirm') {
      await deleteQRCodeApi(qr.id)
      qrCodes.value = qrCodes.value.filter(item => item.id !== qr.id)
      ElMessage.success('收款码删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除错误:', error)
      ElMessage.error('删除失败')
    }
  }
}

const filterQRCodes = (): void => {
  // 筛选逻辑已在 computed 中实现
}

const sortQRCodes = (): void => {
  // 排序逻辑已在 computed 中实现
}

const saveReminderSettings = async (): Promise<void> => {
  try {
    // 这里应该调用保存提醒设置的API
    // const response = await saveReminderSettingsApi(reminderForm.value)
    // if (response.success) {
    //   ElMessage.success('提醒设置已保存')
    //   reminderDialogVisible.value = false
    // }
    
    // 调用保存提醒设置的API
    const { saveReminderSettings: saveReminderSettingsApi } = await import('../services/paymentService')
    const response = await saveReminderSettingsApi(reminderForm.value)
    if (response.success) {
      ElMessage.success('提醒设置已保存')
      reminderDialogVisible.value = false
    }
  } catch (error) {
    console.error('保存提醒设置失败:', error)
    ElMessage.error('保存提醒设置失败')
  }
}

const uploadForm = reactive({
  file: null as File | null,
  description: '',
  platform: 'alipay' as 'alipay' | 'wechat' | 'unionpay'
})

const uploadDialogVisible = ref(false)

const openUploadDialog = (): void => {
  uploadDialogVisible.value = true
}

const handleFileUpload = (file: File): boolean => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  uploadForm.file = file
  // 返回false阻止el-upload的自动上传，我们在handleUploadQRCode中手动上传
  return false
}

const handleUploadQRCode = async (): Promise<void> => {
  if (!uploadForm.file) {
    ElMessage.error('请选择要上传的图片')
    return
  }

  if (!uploadForm.platform) {
    ElMessage.error('请选择支付平台')
    return
  }

  try {
    ElMessage.info('正在上传收款码图片...')

    // 调用专门的上传API
    const { uploadQRCodeImage } = await import('../services/paymentService')
    const response = await uploadQRCodeImage({
      file: uploadForm.file,
      platform: uploadForm.platform,
      description: uploadForm.description
    })

    if (response.success) {
      ElMessage.success(response.message || '收款码上传成功')
      uploadDialogVisible.value = false

      // 重置表单
      Object.assign(uploadForm, {
        file: null,
        description: '',
        platform: 'alipay'
      })

      // 更新列表以显示新上传的收款码
      await getQRCodesList()
      
      console.log('新上传的收款码数据:', response.data)
    }
  } catch (error) {
    console.error('上传收款码失败:', error)
    ElMessage.error('上传收款码失败')
  }
}

// 生命周期
onMounted(async () => {
  await getQRCodesList()
  await loadReminderSettings()
  // 暂时不加载安全检测数据，改为手动触发或按需加载
  // await loadSecurityData()
})
</script>

<style scoped>
.payment-qr-code {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-title h1 {
  margin: 0;
  color: #303133;
}

.qr-count {
  color: #909399;
  font-size: 14px;
  margin-left: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.today {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.transactions {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.qr-codes-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h2 {
  margin: 0;
  color: #303133;
}

.section-actions {
  display: flex;
  gap: 10px;
}

.qr-codes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.qr-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  transition: box-shadow 0.3s;
}

.qr-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.qr-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.qr-info h3 {
  margin: 0;
  color: #303133;
}

.qr-type {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 5px;
}

.qr-type.fixed {
  background: #ecf5ff;
  color: #409eff;
}

.qr-type.custom {
  background: #f0f9ff;
  color: #87ceeb;
}

.qr-type.dynamic {
  background: #f0f9ff;
  color: #98fb98;
}

.qr-code-display {
  text-align: center;
  margin-bottom: 15px;
}

.qr-image {
  width: 150px;
  height: 150px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.qr-details {
  margin-bottom: 15px;
}

.qr-amount {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.qr-stats {
  color: #909399;
  font-size: 14px;
  margin-bottom: 5px;
}

.qr-description {
  color: #606266;
  font-size: 14px;
}

.qr-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-input {
  width: 100px;
}

.add-tag {
  height: 32px;
  line-height: 30px;
}

.statistics-content {
  padding: 20px 0;
}

.chart-container {
  margin-bottom: 30px;
}

.chart-container h3 {
  margin-bottom: 15px;
  color: #303133;
}

.mock-chart {
  display: flex;
  align-items: end;
  height: 150px;
  gap: 10px;
  padding: 0 20px;
  border-left: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, #409eff, #66b1ff);
  border-radius: 4px 4px 0 0;
  min-height: 10px;
}

.bar-label {
  font-size: 12px;
  color: #909399;
}

.method-distribution {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.method-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.method-name {
  font-weight: 500;
  color: #303133;
}

.method-amount {
  color: #409eff;
  font-weight: 500;
}

.method-percentage {
  color: #909399;
  font-size: 14px;
}

.security-check {
  padding: 20px 0;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 6px;
  border-left: 4px solid;
}

.check-item.success {
  background: #f0f9ff;
  border-left-color: #67c23a;
  color: #67c23a;
}

.check-item.error {
  background: #fef0f0;
  border-left-color: #f56c6c;
  color: #f56c6c;
}

.check-status {
  margin-left: auto;
  font-size: 14px;
}

.qr-reminder-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 10px;
}

.qr-reminder-item .reminder-actions {
  margin-left: auto;
  font-size: 14px;
}

.upload-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.upload-file-info .el-icon {
  color: #409eff;
}

.upload-demo {
  width: 100%;
}
</style>
