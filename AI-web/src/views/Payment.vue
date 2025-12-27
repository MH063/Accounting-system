<template>
  <div class="payment">
    <!-- 页面头部 -->
    <div class="payment-header">
      <div class="header-title">
        <h1>智能支付中心</h1>
        <span class="subtitle">支持多种支付方式的智能分摊系统</span>
      </div>
      <div class="header-actions">
        <el-button @click="openPaymentRecords" :icon="List">支付记录</el-button>
        <el-button @click="openPaymentQRCode" :icon="Grid">收款码</el-button>
        <el-button @click="openPaymentScan" :icon="View">扫码支付</el-button>
        <el-button @click="openPaymentConfirm" type="primary" :icon="Check">支付确认</el-button>
      </div>
    </div>

    <!-- 支付方式选择区域 -->
    <div class="payment-methods-section">
      <h2>选择支付方式</h2>
      <div class="payment-methods-grid">
        <div 
          v-for="method in paymentMethods" 
          :key="method.id"
          class="payment-method-card"
          :class="{ active: selectedMethod.id === method.id }"
          @click="selectPaymentMethod(method)"
        >
          <div class="method-icon">
            <img :src="method.icon" :alt="method.name" />
          </div>
          <div class="method-info">
            <h3>{{ method.name }}</h3>
            <p>{{ method.description }}</p>
            <span class="method-fee">手续费: {{ method.fee }}</span>
          </div>
          <div class="method-status">
            <el-tag :type="method.status === 'available' ? 'success' : 'info'">
              {{ method.status === 'available' ? '可用' : '维护中' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 费用分摊计算区域 -->
    <div class="cost-sharing-section">
      <div class="section-header">
        <h2>费用分摊计算</h2>
        <div class="section-actions">
          <el-button @click="addExpense" :icon="Plus">添加费用</el-button>
          <el-button @click="calculateSharing" :icon="Tools">重新计算</el-button>
          <el-button @click="exportSharing" :icon="Download">导出结果</el-button>
        </div>
      </div>

      <!-- 费用列表 -->
      <div class="expenses-list">
        <div v-for="expense in expenses" :key="expense.id" class="expense-item">
          <div class="expense-info">
            <h4>{{ expense.name }}</h4>
            <p>{{ expense.description }}</p>
            <span class="expense-category">{{ expense.category }}</span>
          </div>
          <div class="expense-amount">
            <span class="amount">¥{{ expense.amount.toFixed(2) }}</span>
            <span class="payer">支付人: {{ expense.payer }}</span>
          </div>
          <div class="expense-actions">
            <el-button size="small" @click="editExpense(expense)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteExpense(expense)">删除</el-button>
          </div>
        </div>
      </div>

      <!-- 分摊结果 -->
      <div class="sharing-results">
        <h3>分摊结果</h3>
        <div class="sharing-table">
          <table>
            <thead>
              <tr>
                <th>成员</th>
                <th>应支付</th>
                <th>已支付</th>
                <th>待支付</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in sharingResults" :key="member.name">
                <td>{{ member.name }}</td>
                <td>¥{{ member.shouldPay.toFixed(2) }}</td>
                <td>¥{{ member.paid.toFixed(2) }}</td>
                <td>¥{{ member.pending.toFixed(2) }}</td>
                <td>
                  <el-tag :type="getStatusType(member.status)">
                    {{ getStatusText(member.status) }}
                  </el-tag>
                </td>
                <td>
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="payForMember(member)"
                    :disabled="member.pending === 0"
                  >
                    代为支付
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分摊统计 -->
        <div class="sharing-summary">
          <div class="summary-item">
            <span class="label">总费用</span>
            <span class="value">¥{{ (totalExpense || 0).toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">人均分摊</span>
            <span class="value">¥{{ (perPersonShare || 0).toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">已支付</span>
            <span class="value">¥{{ (totalPaid || 0).toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">待支付</span>
            <span class="value">¥{{ (totalPending || 0).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付对话框 -->
    <el-dialog
      v-model="paymentDialogVisible"
      title="费用支付"
      width="500px"
      @close="resetPaymentForm"
    >
      <div v-if="currentExpense" class="payment-dialog">
        <!-- 费用信息 -->
        <div class="expense-info">
          <h3>{{ currentExpense.name }}</h3>
          <p class="expense-description">代为支付其他成员的费用</p>
          <p class="expense-amount">金额：<strong>¥{{ (paymentForm.amount || 0).toFixed(2) }}</strong></p>
        </div>
        
        <!-- 支付方式选择 -->
        <div v-if="!showQRCode" class="payment-methods">
          <h4>选择支付方式</h4>
          <div class="method-options">
            <el-radio-group v-model="paymentForm.method" @change="handlePaymentMethodChange">
              <el-radio label="alipay" size="large" tabindex="0" @keydown.enter="$event.target.click()" @keydown.space="$event.target.click()">
                <div class="method-option">
                  <el-icon><CreditCard /></el-icon>
                  <span>支付宝</span>
                </div>
              </el-radio>
              <el-radio label="wechat" size="large" tabindex="0" @keydown.enter="$event.target.click()" @keydown.space="$event.target.click()">
                <div class="method-option">
                  <el-icon><ChatLineRound /></el-icon>
                  <span>微信支付</span>
                </div>
              </el-radio>
              <el-radio label="bank" size="large" tabindex="0" @keydown.enter="$event.target.click()" @keydown.space="$event.target.click()">
                <div class="method-option">
                  <el-icon><Postcard /></el-icon>
                  <span>银行卡转账</span>
                </div>
              </el-radio>
              <el-radio label="cash" size="large" tabindex="0" @keydown.enter="$event.target.click()" @keydown.space="$event.target.click()">
                <div class="method-option">
                  <el-icon><Money /></el-icon>
                  <span>现金支付</span>
                </div>
              </el-radio>
            </el-radio-group>
          </div>
        </div>
        
        <!-- 收款码展示 -->
        <div v-if="showQRCode" class="qr-code-section">
          <h4>请扫描下方二维码完成支付</h4>
          <div class="qr-code-container">
            <img :src="qrCodeUrl" alt="收款码" class="qr-code-image" />
            <p class="qr-code-tip">扫描二维码完成支付</p>
          </div>
          <div class="payment-status">
            <el-icon class="success-icon"><SuccessFilled /></el-icon>
            <p>支付成功！</p>
          </div>
        </div>
      </div>
      
      <!-- 对话框底部按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="paymentDialogVisible = false">取消</el-button>
          <el-button 
            v-if="!showQRCode" 
            type="primary" 
            @click="confirmPayment"
            :disabled="!isPaymentMethodValid"
            :loading="processing"
          >
            确认支付
          </el-button>
          <div v-else>
            <el-button @click="showQRCode = false">返回</el-button>
            <el-button 
              type="success" 
              @click="paymentDialogVisible = false"
            >
              完成
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 添加费用对话框 -->
    <el-dialog
      v-model="expenseDialogVisible"
      title="添加费用"
      width="600px"
      @close="resetExpenseForm"
    >
      <el-form :model="expenseForm" :rules="expenseRules" ref="expenseFormRef" label-width="100px">
        <el-form-item label="费用名称" prop="name">
          <el-input v-model="expenseForm.name" placeholder="请输入费用名称" />
        </el-form-item>
        <el-form-item label="费用描述" prop="description">
          <el-input v-model="expenseForm.description" placeholder="请输入费用描述" />
        </el-form-item>
        <el-form-item label="费用金额" prop="amount">
          <el-input-number 
            v-model="expenseForm.amount" 
            :min="0.01" 
            :precision="2" 
            style="width: 100%" 
          />
        </el-form-item>
        <el-form-item label="费用类别" prop="category">
          <el-select v-model="expenseForm.category" placeholder="选择费用类别">
            <el-option label="房租" value="rent" />
            <el-option label="水电费" value="utilities" />
            <el-option label="网费" value="internet" />
            <el-option label="物业费" value="property" />
            <el-option label="维修费" value="maintenance" />
            <el-option label="清洁费" value="cleaning" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付人" prop="payer">
          <el-select v-model="expenseForm.payer" placeholder="选择支付人">
            <el-option 
              v-for="member in members.filter(m => m.name)" 
              :key="member.name"
              :label="member.name"
              :value="member.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="expenseDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveExpense" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  List, Grid, View, Plus, Tools, Download, Check,
  CreditCard, ChatLineRound, Postcard, Money, SuccessFilled
} from '@element-plus/icons-vue'
import { 
  confirmPayment as confirmPaymentApi,
  getQRCodes,
  calculateSharing as calculateSharingApi
} from '../services/paymentService'
import { 
  deleteExpense as deleteExpenseApi, 
  updateExpense as updateExpenseApi, 
  createExpense as createExpenseApi,
  getExpenseList
} from '../services/expenseService'
import { getMembers } from '../services/memberService'

// 路由
const router = useRouter()

// 响应式数据
const paymentDialogVisible = ref(false)
const expenseDialogVisible = ref(false)
const processing = ref(false)
const saving = ref(false)
const detailDialogVisible = ref(false)
const showQRCode = ref(false)
const qrCodeUrl = ref('')
const expenseFormRef = ref()

// 当前选中的支付方式
const selectedMethod = ref<PaymentMethod & { fee: string; description: string }>({
  id: 'wechat',
  name: '微信支付',
  description: '快速便捷的移动支付',
  icon: 'https://picsum.photos/40/40?random=1',
  fee: '0%',
  status: 'available',
  type: 'digital',
  isDefault: true
})

// 支付方式列表
const paymentMethods = ref<Array<PaymentMethod & { fee: string; description: string }>>([
  {
    id: 'wechat',
    name: '微信支付',
    description: '快速便捷的移动支付',
    icon: 'https://picsum.photos/40/40?random=2',
    fee: '0%',
    status: 'available',
    type: 'digital',
    isDefault: true
  },
  {
    id: 'alipay',
    name: '支付宝',
    description: '安全可靠的在线支付',
    icon: 'https://picsum.photos/40/40?random=3',
    fee: '0%',
    status: 'available',
    type: 'digital',
    isDefault: false
  },
  {
    id: 'bank',
    name: '银行卡',
    description: '支持主流银行卡支付',
    icon: 'https://picsum.photos/40/40?random=4',
    fee: '0.1%',
    status: 'available',
    type: 'bank',
    isDefault: false
  },
  {
    id: 'balance',
    name: '账户余额',
    description: '使用账户余额支付',
    icon: 'https://picsum.photos/40/40?random=5',
    fee: '0%',
    status: 'available',
    type: 'digital',
    isDefault: false
  }
])

// PaymentMethod 类型定义
interface PaymentMethod {
  id: string
  name: string
  description?: string
  icon?: string
  fee?: string
  status: string
  type: string
  isDefault?: boolean
}

// 可用支付方式（用于对话框）
const availablePaymentMethods = ref([
  { label: '微信支付', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '银行卡', value: 'bank' },
  { label: '账户余额', value: 'balance' }
])

// 宿舍成员
interface Member {
  name: string
  phone: string
  email: string
}

// 成员列表 - 初始为空，将从后端API获取
const members = ref<Member[]>([])

/**
 * 从后端获取成员列表
 */
const fetchMembers = async () => {
  try {
    const response = await getMembers({ limit: 100 })
    
    if (response.success && response.data && response.data.members) {
      members.value = response.data.members
        .map(member => ({
          name: member.name || member.nickname || '',
          phone: member.phone || '未提供',
          email: member.email || '未提供'
        }))
        .filter(member => member.name)
      
      await calculateSharing()
    } else {
      ElMessage.error(response.message || '获取成员列表失败')
    }
  } catch (error) {
    console.error('获取成员列表失败:', error)
    ElMessage.error('获取成员列表失败，请稍后重试')
  }
}

// 费用列表
interface Expense {
  id: number
  name: string
  description: string
  amount: number
  category: string
  payer: string
}

// 费用列表 - 初始为空，将从后端API获取
const expenses = ref<Expense[]>([])

/**
 * 从后端获取费用列表
 */
const fetchExpenses = async () => {
  try {
    const response = await getExpenseList()
    
    if (response.success && response.data) {
      // 将后端返回的数据转换为前端需要的格式
      // 确保amount是数字类型，避免toFixed错误
      expenses.value = response.data.map(item => ({
        id: item.id,
        name: item.title, // 后端返回的是title，前端需要的是name
        description: item.description || '',
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount,
        category: item.category,
        payer: item.payer || item.applicant // 如果没有payer字段，使用applicant
    }))
    
    // 获取费用数据后重新计算分摊结果
    await calculateSharing()
  } else {
      ElMessage.error(response.message || '获取费用列表失败')
    }
  } catch (error) {
    console.error('获取费用列表失败:', error)
    ElMessage.error('获取费用列表失败，请稍后重试')
  }
}

// 支付表单
interface PaymentForm {
  amount: number
  method: string
  remark: string
}

const paymentForm = reactive<PaymentForm>({
  amount: 0,
  method: '',
  remark: ''
})

// 费用表单
interface ExpenseForm {
  id: number | undefined
  name: string
  description: string
  amount: number
  category: string
  payer: string
}

const expenseForm = reactive<ExpenseForm>({
  id: undefined,
  name: '',
  description: '',
  amount: 0,
  category: 'other',
  payer: ''
})

// 表单验证规则
const expenseRules = {
  name: [{ required: true, message: '请输入费用名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入费用描述', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入费用金额', trigger: 'blur' }],
  category: [{ required: true, message: '请选择费用类别', trigger: 'change' }],
  payer: [{ required: true, message: '请选择支付人', trigger: 'change' }]
}

// 状态变量 - 改为 ref 以支持 API 更新
interface SharingResult {
  name: string
  shouldPay: number
  paid: number
  pending: number
  status: 'pending' | 'completed'
}

const sharingResults = ref<SharingResult[]>([])
const totalExpense = ref(0)
const perPersonShare = ref(0)
const totalPaid = ref(0)
const totalPending = ref(0)

// 方法
const selectPaymentMethod = (method: PaymentMethod & { fee: string; description: string }) => {
  if (method.status === 'available') {
    selectedMethod.value = method
    ElMessage.success(`已选择 ${method.name}`)
  }
}

const calculateSharing = async () => {
  try {
    // 检查用户是否已认证
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) {
      ElMessage.error('请先登录后再进行费用分摊计算')
      // 跳转到登录页面
      router.push('/login')
      return
    }
    
    // 检查是否有费用和成员数据
    if (expenses.value.length === 0) {
      ElMessage.warning('请先添加费用后再进行分摊计算')
      return
    }
    
    if (members.value.length === 0) {
      ElMessage.warning('请先添加成员后再进行分摊计算')
      return
    }
    
    // 显示计算中状态
    ElMessage.info('正在计算费用分摊...')
    
    // 调用真实API计算费用分摊
    const response = await calculateSharingApi({
      expenses: expenses.value,
      members: members.value
    })
    
    if (response.success && response.data) {
      // 更新分摊结果
      sharingResults.value = response.data.sharingResults || []
      totalExpense.value = response.data.totalExpense || 0
      perPersonShare.value = response.data.perPersonShare || 0
      totalPaid.value = response.data.totalPaid || 0
      totalPending.value = response.data.totalPending || 0
      
      ElMessage.success('费用分摊计算完成')
    } else {
      ElMessage.error('费用分摊计算失败：' + (response.message || '请重试'))
    }
  } catch (error: any) {
    console.error('费用分摊计算失败:', error)
    
    // 提供更具体的错误信息
    if (error.message && error.message.includes('身份验证')) {
      ElMessage.error(error.message)
      // 跳转到登录页面
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else if (error.message && error.message.includes('请先登录')) {
      ElMessage.error(error.message)
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      ElMessage.error(error.message || '费用分摊计算失败，请稍后重试')
    }
  }
}

const exportSharing = () => {
  try {
    // 构建导出数据
    const exportData = {
      basic: {
        exportTime: new Date().toLocaleString('zh-CN'),
        totalExpense: totalExpense.value,
        perPersonShare: perPersonShare.value,
        totalPaid: totalPaid.value,
        totalPending: totalPending.value,
        memberCount: sharingResults.value.length
      },
      expenses: expenses.value.map(expense => ({
        id: expense.id,
        name: expense.name,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        payer: expense.payer,
        percentage: ((expense.amount / (totalExpense.value || 1)) * 100).toFixed(2) + '%'
      })),
      sharingResults: sharingResults.value.map(member => ({
        name: member.name,
        shouldPay: member.shouldPay.toFixed(2),
        paid: member.paid.toFixed(2),
        pending: member.pending.toFixed(2),
        status: getStatusText(member.status),
        statusType: member.status,
        completionRate: ((member.paid / (member.shouldPay || 1)) * 100).toFixed(2) + '%'
      }))
    }

    // 生成CSV格式数据
    const csvContent = generateCSV(exportData)
    
    // 添加BOM标记解决Excel中文乱码问题
    const csvWithBom = '\uFEFF' + csvContent
    
    // 创建下载链接
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `费用分摊结果_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      ElMessage.success('导出成功！文件已下载')
    } else {
      ElMessage.error('您的浏览器不支持文件下载')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const generateCSV = (data: any) => {
  const lines = []
  
  // 添加基本信息头部
  lines.push('=== 费用分摊计算结果 ===')
  lines.push(`导出时间,${data.basic.exportTime}`)
  lines.push(`总费用,¥${data.basic.totalExpense.toFixed(2)}`)
  lines.push(`人均分摊,¥${data.basic.perPersonShare.toFixed(2)}`)
  lines.push(`已支付金额,¥${data.basic.totalPaid.toFixed(2)}`)
  lines.push(`待支付金额,¥${data.basic.totalPending.toFixed(2)}`)
  lines.push(`参与人数,${data.basic.memberCount}人`)
  lines.push('')
  
  // 添加费用明细
  lines.push('=== 费用明细 ===')
  lines.push('费用名称,描述,类别,金额,支付人,占总费用比例')
  data.expenses.forEach((expense: any) => {
    lines.push(`${expense.name},${expense.description},${expense.category},¥${expense.amount.toFixed(2)},${expense.payer},${expense.percentage}`)
  })
  lines.push('')
  
  // 添加分摊结果
  lines.push('=== 分摊结果 ===')
  lines.push('成员姓名,应支付金额,已支付金额,待支付金额,支付状态,完成率')
  data.sharingResults.forEach((member: any) => {
    lines.push(`${member.name},¥${member.shouldPay},¥${member.paid},¥${member.pending},${member.status},${member.completionRate}`)
  })
  lines.push('')
  
  // 添加统计信息
  lines.push('=== 统计信息 ===')
  lines.push(`待支付成员数,${data.sharingResults.filter((m: any) => m.statusType === 'pending').length}`)
  lines.push(`已付清成员数,${data.sharingResults.filter((m: any) => m.statusType === 'completed').length}`)
  lines.push(`部分支付成员数,${data.sharingResults.filter((m: any) => m.statusType === 'partial').length}`)
  
  return lines.join('\n')
}

const addExpense = () => {
  expenseDialogVisible.value = true
}

const editExpense = (expense: Expense) => {
  Object.assign(expenseForm, expense)
  expenseDialogVisible.value = true
}

/**
 * 删除费用项
 * 调用后端API真实删除数据
 */
const deleteExpense = async (expense: Expense) => {
  try {
    // 调用后端API删除费用
    const response = await deleteExpenseApi(expense.id)
    
    if (response.success) {
      ElMessage.success('费用删除成功')
      
      // 重新获取费用列表
      await fetchExpenses()
    } else {
      ElMessage.error(response.message || '删除费用失败')
    }
  } catch (error) {
    console.error('删除费用失败:', error)
    ElMessage.error('删除费用失败，请稍后重试')
  }
}

const payForMember = (member: SharingResult) => {
  paymentForm.amount = member.pending
  paymentForm.method = ''
  isPaymentMethodValid.value = false
  currentExpense.value = member
  paymentDialogVisible.value = true
}

// 处理支付方式选择
const handlePaymentMethodChange = async (method: string) => {
  paymentForm.method = method
  isPaymentMethodValid.value = false
  
  // 现金支付不需要检查收款码
  if (method === 'cash') {
    isPaymentMethodValid.value = true
    return
  }
  
  // 获取最新的收款码数据
  try {
    const qrResponse = await getQRCodes()
    if (qrResponse.success && qrResponse.data) {
      // 根据支付方式检查收款码状态
      const platformMap: Record<string, string> = {
        'alipay': 'alipay',
        'wechat': 'wechat',
        'bank': 'unionpay'
      }
      
      const platform = platformMap[method]
      
      // 查找启用的收款码
      const activeQRCode = qrResponse.data.find(qr => 
        qr.platform === platform && qr.status === 'active' && qr.isUserUploaded
      )
      
      // 如果找到了启用的收款码，不显示任何提示
      if (activeQRCode) {
        // 不需要提示，收款码正常
        isPaymentMethodValid.value = true
        return
      }
      
      // 查找禁用的收款码
      const disabledQRCode = qrResponse.data.find(qr => 
        qr.platform === platform && qr.status === 'inactive' && qr.isUserUploaded
      )
      
      // 如果找到了禁用的收款码，提示用户
      if (disabledQRCode) {
        ElMessage.warning(`该支付方式的收款码已被停用或禁用，请联系管理员`)
        return
      }
      
      // 如果完全没有找到对应平台的收款码
      ElMessage.warning(`未找到对应的收款码，请联系管理员`)
    }
  } catch (error) {
    console.error('获取收款码信息失败:', error)
  }
}

const confirmPayment = async () => {
  if (!paymentForm.method) {
    ElMessage.warning('请选择支付方式')
    return
  }
  
  try {
    processing.value = true
    
    // 特殊处理现金支付
    if (paymentForm.method === 'cash') {
      // 现金支付直接完成，不需要显示二维码
      ElMessage.success('现金支付已完成')
      paymentDialogVisible.value = false
      resetPaymentForm()
      return
    }
    
    // 获取对应的收款码
    const qrResponse = await getQRCodes()
    if (qrResponse.success && qrResponse.data) {
      // 根据支付方式筛选收款码
      const platformMap: Record<string, string> = {
        'alipay': 'alipay',
        'wechat': 'wechat',
        'bank': 'unionpay'
      }
      
      const platform = platformMap[paymentForm.method]
      // 首先查找启用的收款码
      let matchingQRCode = qrResponse.data.find(qr => 
        qr.platform === platform && qr.status === 'active' && qr.isUserUploaded
      )
      
      // 如果找到了启用的收款码，直接使用
      if (matchingQRCode && matchingQRCode.qrCodeUrl) {
        qrCodeUrl.value = matchingQRCode.qrCodeUrl
        showQRCode.value = true
      } 
      // 如果没有找到启用的收款码，则查找禁用的收款码
      else {
        const disabledQRCode = qrResponse.data.find(qr => 
          qr.platform === platform && qr.status === 'inactive' && qr.isUserUploaded
        )
        
        // 如果找到了禁用的收款码，提示用户
        if (disabledQRCode) {
          ElMessage.warning(`该支付方式的收款码已被停用或禁用，请联系管理员`)
          // 不显示二维码，保持showQRCode为false
          return
        } 
        // 如果完全没有找到对应平台的收款码
        else {
          ElMessage.warning(`未找到对应的收款码，请联系管理员`)
          // 不显示二维码，保持showQRCode为false
          return
        }
      }
    } else {
      ElMessage.error('获取收款码失败')
    }
  } catch (error) {
    console.error('获取收款码过程中出现错误:', error)
    ElMessage.error('获取收款码过程中出现错误')
  } finally {
    processing.value = false
  }
}

/**
 * 保存费用（新增或编辑）
 * 调用后端API真实保存数据
 */
const saveExpense = async () => {
  try {
    saving.value = true
    
    if (expenseForm.id) {
      // 编辑逻辑 - 调用后端API更新费用
      const updateData = {
        title: expenseForm.name, // 后端期望的字段名是title
        description: expenseForm.description,
        amount: expenseForm.amount,
        category: expenseForm.category
      }
      
      const response = await updateExpenseApi(expenseForm.id.toString(), updateData)
      
      if (response.success) {
        ElMessage.success('费用更新成功')
        
        // 重新获取费用列表
        await fetchExpenses()
      } else {
        ElMessage.error(response.message || '更新费用失败')
        return
      }
    } else {
      // 新增逻辑 - 调用后端API创建费用
      const createData = {
        title: expenseForm.name, // 后端期望的字段名是title
        description: expenseForm.description,
        amount: expenseForm.amount,
        category: expenseForm.category,
        date: new Date().toISOString().split('T')[0] // 使用当前日期
      }
      
      const response = await createExpenseApi(createData)
      
      if (response.success) {
        ElMessage.success('费用添加成功')
        
        // 重新获取费用列表
        await fetchExpenses()
      } else {
        ElMessage.error(response.message || '添加费用失败')
        return
      }
    }
    
    expenseDialogVisible.value = false
    resetExpenseForm()
  } catch (error) {
    console.error('保存费用失败:', error)
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

const resetPaymentForm = () => {
  Object.assign(paymentForm, {
    amount: 0,
    method: 'wechat',
    remark: ''
  })
  showQRCode.value = false
  qrCodeUrl.value = ''
}

const resetExpenseForm = () => {
  Object.assign(expenseForm, {
    name: '',
    description: '',
    amount: 0,
    category: 'other',
    payer: ''
  })
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    completed: 'success',
    overdue: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待支付',
    completed: '已完成',
    overdue: '已逾期'
  }
  return textMap[status] || '未知'
}

// 导航方法
const openPaymentRecords = () => {
  router.push('/dashboard/payment-records')
}

const openPaymentQRCode = () => {
  router.push('/dashboard/qrcode')
}

const openPaymentScan = () => {
  router.push('/dashboard/payment-scan')
}

const openPaymentConfirm = () => {
  router.push('/dashboard/payment-confirm')
}

// 当前正在支付的记录
const currentExpense = ref<SharingResult | null>(null)

// 支付方式有效性状态
const isPaymentMethodValid = ref(false)

// 生命周期
onMounted(() => {
  // 页面加载时检查用户认证状态
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
  if (!token) {
    ElMessage.error('请先登录后再访问支付页面')
    router.push('/login')
    return
  }
  
  // 页面加载时获取数据
  fetchExpenses()
  fetchMembers()
})
</script>

<style scoped>
.payment {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-title h1 {
  margin: 0;
  color: #303133;
}

.subtitle {
  color: #909399;
  font-size: 14px;
  margin-left: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.payment-methods-section,
.cost-sharing-section {
  background: white;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.payment-methods-section h2,
.cost-sharing-section h2 {
  margin: 0;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  color: #303133;
}

.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  padding: 20px;
}

.payment-method-card {
  border: 2px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 15px;
}

.payment-method-card:hover {
  border-color: #409eff;
}

.payment-method-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.method-icon img {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}

.method-info {
  flex: 1;
}

.method-info h3 {
  margin: 0 0 5px 0;
  color: #303133;
}

.method-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.method-fee {
  color: #909399;
  font-size: 12px;
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
  border: none;
  padding: 0;
}

.section-actions {
  display: flex;
  gap: 10px;
}

.expenses-list {
  padding: 20px;
}

.expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 10px;
}

.expense-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.expense-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.expense-category {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.expense-amount {
  text-align: center;
}

.amount {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.payer {
  font-size: 14px;
  color: #909399;
}

.expense-actions {
  display: flex;
  gap: 5px;
}

.sharing-results {
  padding: 20px;
  border-top: 1px solid #ebeef5;
}

.sharing-results h3 {
  margin-bottom: 15px;
  color: #303133;
}

.sharing-table table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.sharing-table th,
.sharing-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.sharing-table th {
  background: #f5f7fa;
  color: #303133;
  font-weight: 500;
}

.sharing-summary {
  display: flex;
  gap: 20px;
  justify-content: flex-end;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.summary-item {
  text-align: center;
}

.summary-item .label {
  display: block;
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.summary-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.payment-amount {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.detail-amount {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.payment-breakdown,
.sharing-breakdown {
  margin-top: 20px;
}

.payment-breakdown h4,
.sharing-breakdown h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.breakdown-content {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.breakdown-item:last-child {
  border-bottom: none;
}

.breakdown-item .label {
  color: #606266;
  font-size: 14px;
}

.breakdown-item .value {
  font-weight: bold;
  color: #303133;
  font-size: 14px;
}

.member-list {
  max-height: 300px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fafafa;
}

.member-item:last-child {
  margin-bottom: 0;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-name {
  font-weight: 500;
  color: #303133;
}

.member-amounts {
  display: flex;
  gap: 15px;
}

.amount-item {
  font-size: 12px;
  color: #606266;
}

.amount-item.pending {
  color: #e6a23c;
  font-weight: 500;
}

/* 支付对话框样式 */
.payment-dialog {
  padding: 20px 0;
}

.expense-info {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.expense-info h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #303133;
}

.expense-description {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.expense-amount {
  margin: 0;
  font-size: 18px;
  color: #f56c6c;
}

.expense-amount strong {
  font-size: 24px;
  font-weight: 700;
}

.payment-methods h4,
.qr-code-section h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #303133;
  text-align: center;
}

.method-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.method-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #303133;
}

.method-option .el-icon {
  font-size: 20px;
}

.qr-code-container {
  text-align: center;
  margin: 24px 0;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  display: block;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
}

.qr-code-tip {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.payment-status {
  text-align: center;
  margin-top: 24px;
}

.payment-status .success-icon {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 16px;
}

.payment-status p {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #67c23a;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}


</style>
