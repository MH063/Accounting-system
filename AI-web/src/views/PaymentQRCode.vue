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
        <el-button type="primary" @click="openCreateDialog" :icon="Plus">
          创建收款码
        </el-button>
        <el-button @click="openSecurityCheck" :icon="Lock">安全检测</el-button>
        <el-button @click="openStatisticsDialog" :icon="DataAnalysis">收款统计</el-button>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon total">
          <DataAnalysis />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalIncome.toFixed(2) }}</div>
          <div class="stat-label">总收入 (¥)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon today">
          <Timer />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.todayIncome.toFixed(2) }}</div>
          <div class="stat-label">今日收入 (¥)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <Check />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ activeQRCodes }}</div>
          <div class="stat-label">活跃收款码</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon transactions">
          <List />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalTransactions }}</div>
          <div class="stat-label">交易次数</div>
        </div>
      </div>
    </div>

    <!-- 收款码列表 -->
    <div class="qr-codes-section">
      <div class="section-header">
        <h2>收款码列表</h2>
        <div class="section-actions">
          <el-select v-model="filterStatus" placeholder="状态筛选" style="width: 120px" @change="filterQRCodes">
            <el-option label="全部" value="all" />
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
          <el-select v-model="sortBy" placeholder="排序方式" style="width: 120px" @change="sortQRCodes">
            <el-option label="创建时间" value="createdAt" />
            <el-option label="使用次数" value="usageCount" />
            <el-option label="收款金额" value="totalAmount" />
          </el-select>
        </div>
      </div>

      <div class="qr-codes-grid">
        <div v-for="qr in filteredQRCodes" :key="qr.id" class="qr-card">
          <div class="qr-card-header">
            <div class="qr-info">
              <h3>{{ qr.name }}</h3>
              <span class="qr-type" :class="qr.type">{{ getQRTypeText(qr.type) }}</span>
            </div>
            <div class="qr-status">
              <el-tag :type="qr.status === 'active' ? 'success' : 'info'">
                {{ qr.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </div>
          
          <div class="qr-code-display">
            <img :src="qr.qrCodeUrl" :alt="qr.name" class="qr-image" />
          </div>
          
          <div class="qr-details">
            <div class="qr-amount">
              <span v-if="qr.type === 'fixed'">¥{{ qr.amount?.toFixed(2) }}</span>
              <span v-else>自定义金额</span>
            </div>
            <div class="qr-stats">
              <span>使用次数: {{ qr.usageCount }}</span>
              <span v-if="qr.usageLimit">限制: {{ qr.usageLimit }}</span>
            </div>
            <div class="qr-description">{{ qr.description }}</div>
          </div>
          
          <div class="qr-actions">
            <el-button size="small" @click="shareQRCode(qr)">分享</el-button>
            <el-button size="small" @click="downloadQRCode(qr)">下载</el-button>
            <el-button size="small" @click="customizeStyle(qr)">样式</el-button>
            <el-button size="small" @click="editQRCode(qr)">编辑</el-button>
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

    <!-- 创建/编辑收款码对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑收款码' : '创建收款码'"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="qrForm" :rules="qrRules" ref="qrFormRef" label-width="100px">
        <el-form-item label="收款码名称" prop="name">
          <el-input v-model="qrForm.name" placeholder="请输入收款码名称" />
        </el-form-item>
        <el-form-item label="收款码类型" prop="type">
          <el-select v-model="qrForm.type" placeholder="选择收款码类型" @change="onTypeChange">
            <el-option label="固定金额" value="fixed" />
            <el-option label="自定义金额" value="custom" />
            <el-option label="动态金额" value="dynamic" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="qrForm.type === 'fixed'" label="固定金额" prop="amount">
          <el-input-number v-model="qrForm.amount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="收款描述" prop="description">
          <el-input v-model="qrForm.description" placeholder="请输入收款描述" />
        </el-form-item>
        <el-form-item label="使用限制" prop="usageLimit">
          <el-input-number v-model="qrForm.usageLimit" :min="1" placeholder="不限制请留空" style="width: 100%" />
        </el-form-item>
        <el-form-item label="背景颜色" prop="backgroundColor">
          <el-color-picker v-model="qrForm.backgroundColor" />
        </el-form-item>
        <el-form-item label="标签">
          <el-tag
            v-for="tag in qrForm.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="inputVisible"
            ref="inputRef"
            v-model="inputValue"
            class="tag-input"
            @keyup.enter="handleInputConfirm"
            @blur="handleInputConfirm"
          />
          <el-button v-else class="add-tag" @click="showInput">+ 标签</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveQRCode" :loading="saving">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

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
    <el-dialog v-model="securityDialogVisible" title="安全检测" width="500px">
      <div class="security-check">
        <div class="check-item" :class="securityChecks.qrCodeStatus">
          <el-icon><Check v-if="securityChecks.qrCodeStatus === 'success'" /><Close v-else /></el-icon>
          <span>收款码状态检查</span>
          <span class="check-status">{{ securityChecks.qrCodeStatus === 'success' ? '正常' : '异常' }}</span>
        </div>
        <div class="check-item" :class="securityChecks.usageAnalysis">
          <el-icon><Check v-if="securityChecks.usageAnalysis === 'success'" /><Close v-else /></el-icon>
          <span>使用频率分析</span>
          <span class="check-status">{{ securityChecks.usageAnalysis === 'success' ? '正常' : '异常' }}</span>
        </div>
        <div class="check-item" :class="securityChecks.amountValidation">
          <el-icon><Check v-if="securityChecks.amountValidation === 'success'" /><Close v-else /></el-icon>
          <span>金额验证</span>
          <span class="check-status">{{ securityChecks.amountValidation === 'success' ? '正常' : '异常' }}</span>
        </div>
        <div class="check-item" :class="securityChecks.permissions">
          <el-icon><Check v-if="securityChecks.permissions === 'success'" /><Close v-else /></el-icon>
          <span>权限检查</span>
          <span class="check-status">{{ securityChecks.permissions === 'success' ? '正常' : '异常' }}</span>
        </div>
      </div>
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
        <el-form-item label="提醒金额阈值">
          <el-input-number v-model="reminderForm.amountThreshold" :min="0" style="width: 100%" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance } from 'element-plus'
import { 
  Plus, Lock, DataAnalysis, Timer, Check, List, Close, ArrowLeft
} from '@element-plus/icons-vue'
import { 
  getQRCodes, createQRCode, updateQRCode, deleteQRCode as deleteQRCodeApi,
  toggleQRCodeStatus as toggleQRCodeStatusApi, generateQRCodeImage, shareQRCode as shareQRCodeApi
} from '../services/paymentService'

// QRCode类型定义
interface QRCode {
  id: number
  name: string
  type: 'fixed' | 'custom' | 'dynamic'
  amount?: number
  currency: string
  description: string
  status: 'active' | 'inactive'
  usageLimit?: number
  usageCount: number
  createdAt: string
  updatedAt: string
  expiresAt?: string
  qrCodeUrl: string
  merchantName: string
  merchantAccount: string
  isDefault: boolean
  tags: string[]
  backgroundColor?: string
  logoUrl?: string
}

// 响应式数据
const qrCodes = ref<QRCode[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const statisticsDialogVisible = ref(false)
const securityDialogVisible = ref(false)
const reminderDialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const inputVisible = ref(false)
const inputValue = ref('')

// 表单数据
const qrForm = reactive({
  id: undefined as number | undefined,
  name: '',
  type: 'fixed' as 'fixed' | 'custom' | 'dynamic',
  amount: undefined as number | undefined,
  description: '',
  usageLimit: undefined as number | undefined,
  backgroundColor: '#ffffff',
  tags: [] as string[]
})

// 表单验证规则
const qrRules = {
  name: [{ required: true, message: '请输入收款码名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择收款码类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  description: [{ required: true, message: '请输入收款描述', trigger: 'blur' }]
}

// 筛选和排序
const filterStatus = ref('all')
const sortBy = ref('createdAt')

// 统计数据
const statistics = reactive({
  totalIncome: 15850.50,
  todayIncome: 320.00,
  totalTransactions: 89
})

// 统计数据
const incomeTrend = ref([
  { month: '10月', amount: 120 },
  { month: '11月', amount: 180 },
  { month: '12月', amount: 140 },
  { month: '1月', amount: 200 },
  { month: '2月', amount: 160 }
])

const methodDistribution = ref([
  { name: '微信支付', amount: 8950.30, percentage: 56.4 },
  { name: '支付宝', amount: 5230.80, percentage: 33.0 },
  { name: '银行卡', amount: 1669.40, percentage: 10.6 }
])

// 安全检测结果
const securityChecks = reactive({
  qrCodeStatus: 'success',
  usageAnalysis: 'success',
  amountValidation: 'success',
  permissions: 'success'
})

// 提醒设置
const reminderForm = reactive({
  enabled: true,
  methods: ['email', 'push'],
  amountThreshold: 100.00,
  intervalMinutes: 30
})

// 表单引用
const qrFormRef = ref<FormInstance>()
const inputRef = ref()

// 计算属性
const activeQRCodes = computed(() => {
  return qrCodes.value.filter(qr => qr.status === 'active').length
})

const filteredQRCodes = computed(() => {
  let filtered = qrCodes.value
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(qr => qr.status === filterStatus.value)
  }
  return filtered
})

// 路由
const router = useRouter()

// 方法
const goBack = () => {
  router.push('/dashboard/payment')
}

const getQRCodesList = async () => {
  try {
    loading.value = true
    const response = await getQRCodes()
    qrCodes.value = response.data || []
  } catch (error) {
    console.error('获取收款码列表失败:', error)
    ElMessage.error('获取收款码列表失败')
  } finally {
    loading.value = false
  }
}

const getQRTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    fixed: '固定金额',
    custom: '自定义金额',
    dynamic: '动态金额'
  }
  return typeMap[type] || type
}

const openCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const openStatisticsDialog = () => {
  statisticsDialogVisible.value = true
}

const openSecurityCheck = () => {
  // 模拟安全检测
  securityDialogVisible.value = true
}

const onTypeChange = (type: string) => {
  if (type !== 'fixed') {
    qrForm.amount = 0
  }
}

const saveQRCode = async () => {
  if (!qrFormRef.value) return
  
  await qrFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        saving.value = true
        
        // 准备数据
        const qrData = {
          name: qrForm.name,
          type: qrForm.type,
          amount: qrForm.type === 'fixed' ? (qrForm.amount || 0) : 0,
          currency: 'CNY',
          description: qrForm.description,
          status: 'active' as 'active' | 'inactive',
          usageLimit: qrForm.usageLimit || undefined,
          merchantName: '宿舍管理系统',
          merchantAccount: 'dorm_manager',
          isDefault: false,
          backgroundColor: qrForm.backgroundColor,
          tags: qrForm.tags
        }
        
        if (isEdit.value && qrForm.id) {
          // 更新收款码
          await updateQRCode(qrForm.id, qrData)
          ElMessage.success('收款码更新成功')
        } else {
          // 创建收款码
          await createQRCode(qrData)
          ElMessage.success('收款码创建成功')
        }
        
        dialogVisible.value = false
        resetForm()
        getQRCodesList()
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        saving.value = false
      }
    }
  })
}

const resetForm = () => {
  Object.assign(qrForm, {
    name: '',
    type: 'custom',
    amount: 0,
    description: '',
    usageLimit: null,
    backgroundColor: '#667eea',
    tags: []
  })
}

const shareQRCode = async (qr: any) => {
  try {
    await shareQRCodeApi(qr.id, 'copy')
    ElMessage.success('分享链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('分享失败')
  }
}

const downloadQRCode = async (qr: any) => {
  try {
    const response = await generateQRCodeImage(qr.id, { format: 'png', size: 300 })
    const link = document.createElement('a')
    link.href = response.data.downloadUrl
    link.download = `${qr.name}.png`
    link.click()
    ElMessage.success('收款码下载成功')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

const customizeStyle = (qr: any) => {
  ElMessage.info('样式定制功能开发中')
}

const editQRCode = (qr: any) => {
  isEdit.value = true
  Object.assign(qrForm, qr)
  dialogVisible.value = true
}

const toggleQRCodeStatus = async (qr: any) => {
  try {
    const newStatus = qr.status === 'active' ? 'inactive' : 'active'
    await toggleQRCodeStatusApi(qr.id, newStatus)
    qr.status = newStatus
    ElMessage.success(`收款码已${newStatus === 'active' ? '启用' : '禁用'}`)
  } catch (error) {
    ElMessage.error('状态切换失败')
  }
}

const deleteQRCode = async (qr: any) => {
  try {
    await deleteQRCodeApi(qr.id)
    qrCodes.value = qrCodes.value.filter(item => item.id !== qr.id)
    ElMessage.success('收款码删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const filterQRCodes = () => {
  // 筛选逻辑已在 computed 中实现
}

const sortQRCodes = () => {
  // 排序逻辑已在 computed 中实现
}

const removeTag = (tag: string) => {
  qrForm.tags = qrForm.tags.filter(t => t !== tag)
}

const showInput = () => {
  inputVisible.value = true
}

const handleInputConfirm = () => {
  if (inputValue.value && !qrForm.tags.includes(inputValue.value)) {
    qrForm.tags.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

const saveReminderSettings = () => {
  ElMessage.success('提醒设置已保存')
  reminderDialogVisible.value = false
}

// 生命周期
onMounted(() => {
  getQRCodesList()
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
</style>
