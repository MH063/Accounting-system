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

    <!-- 快速支付区域 -->
    <div class="quick-payment-section">
      <h2>快速支付</h2>
      <div class="quick-payment-cards">
        <div class="quick-pay-card" v-for="quickPay in quickPayments" :key="quickPay.id">
          <div class="card-header">
            <h3>{{ quickPay.title }}</h3>
            <span class="amount">¥{{ (quickPay.amount || 0).toFixed(2) }}</span>
          </div>
          <div class="card-body">
            <p>{{ quickPay.description }}</p>
            <div class="quick-actions">
              <el-button 
                type="primary" 
                @click="processQuickPayment(quickPay)"
                :loading="quickPay.processing"
              >
                立即支付
              </el-button>
              <el-button @click="viewPaymentDetail(quickPay)">详情</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付对话框 -->
    <el-dialog
      v-model="paymentDialogVisible"
      :title="`支付 - ${currentExpense?.name || ''}`"
      width="500px"
      @close="resetPaymentForm"
    >
      <el-form :model="paymentForm" label-width="120px">
        <el-form-item label="支付金额">
          <span class="payment-amount">¥{{ (paymentForm.amount || 0).toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="paymentForm.method" placeholder="选择支付方式">
            <el-option 
              v-for="method in availablePaymentMethods" 
              :key="method.value"
              :label="method.label"
              :value="method.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="paymentForm.remark" 
            placeholder="可选备注信息"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="paymentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmPayment" :loading="processing">
            确认支付
          </el-button>
        </span>
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
              v-for="member in members" 
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
  List, Grid, View, Plus, Tools, Download, Check
} from '@element-plus/icons-vue'
import { 
  confirmPayment as confirmPaymentApi
} from '../services/paymentService'
import type { PaymentMethod, PaymentRequest } from '../services/paymentService'

// 路由
const router = useRouter()

// 响应式数据
const paymentDialogVisible = ref(false)
const expenseDialogVisible = ref(false)
const processing = ref(false)
const saving = ref(false)

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

const members = ref<Member[]>([
  { name: '张三', phone: '138****1234', email: 'zhangsan@example.com' },
  { name: '李四', phone: '139****5678', email: 'lisi@example.com' },
  { name: '王五', phone: '136****9012', email: 'wangwu@example.com' },
  { name: '赵六', phone: '135****3456', email: 'zhaoliu@example.com' }
])

// 费用列表
interface Expense {
  id: number
  name: string
  description: string
  amount: number
  category: string
  payer: string
}

const expenses = ref<Expense[]>([
  {
    id: 1,
    name: '月度房租',
    description: '2024年11月房租费用',
    amount: 1600.00,
    category: 'rent',
    payer: '张三'
  },
  {
    id: 2,
    name: '水电费',
    description: '10月份水电费',
    amount: 280.50,
    category: 'utilities',
    payer: '李四'
  },
  {
    id: 3,
    name: '网费',
    description: '月度宽带费用',
    amount: 120.00,
    category: 'internet',
    payer: '王五'
  }
])

// 快速支付项目
interface QuickPayment {
  id: number
  title: string
  amount: number
  description: string
  processing: boolean
}

const quickPayments = ref<QuickPayment[]>([
  {
    id: 1,
    title: '今日分摊',
    amount: 0,
    description: '今日需要分摊的费用',
    processing: false
  },
  {
    id: 2,
    title: '代付服务',
    amount: 0,
    description: '为其他成员代付费用',
    processing: false
  },
  {
    id: 3,
    title: '批量支付',
    amount: 0,
    description: '一次性支付多笔费用',
    processing: false
  }
])

// 支付表单
interface PaymentForm {
  amount: number
  method: string
  remark: string
}

const paymentForm = reactive<PaymentForm>({
  amount: 0,
  method: 'wechat',
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

// 计算属性
interface SharingResult {
  name: string
  shouldPay: number
  paid: number
  pending: number
  status: 'pending' | 'completed'
}

const sharingResults = computed(() => {
  const results: SharingResult[] = []
  const perPerson = totalExpense.value / members.value.length
  
  for (const member of members.value) {
    const memberExpenses = expenses.value.filter(expense => expense.payer === member.name)
    const shouldPay = perPerson
    const paid = memberExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const pending = shouldPay - paid
    
    results.push({
      name: member.name,
      shouldPay,
      paid,
      pending: pending > 0 ? pending : 0,
      status: pending > 0 ? 'pending' : 'completed'
    })
  }
  
  return results
})

const totalExpense = computed(() => {
  return expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
})

const perPersonShare = computed(() => {
  return totalExpense.value / members.value.length
})

const totalPaid = computed(() => {
  return sharingResults.value.reduce((sum, result) => sum + result.paid, 0)
})

const totalPending = computed(() => {
  return sharingResults.value.reduce((sum, result) => sum + result.pending, 0)
})

// 方法
const selectPaymentMethod = (method: PaymentMethod & { fee: string; description: string }) => {
  if (method.status === 'available') {
    selectedMethod.value = method
    ElMessage.success(`已选择 ${method.name}`)
  }
}

const calculateSharing = () => {
  ElMessage.success('费用分摊计算完成')
}

const exportSharing = () => {
  ElMessage.info('导出功能开发中')
}

const addExpense = () => {
  expenseDialogVisible.value = true
}

const editExpense = (expense: Expense) => {
  Object.assign(expenseForm, expense)
  expenseDialogVisible.value = true
}

const deleteExpense = (expense: Expense) => {
  expenses.value = expenses.value.filter(item => item.id !== expense.id)
  ElMessage.success('费用删除成功')
}

const payForMember = (member: SharingResult) => {
  paymentForm.amount = member.pending
  currentExpense.value = member
  paymentDialogVisible.value = true
}



const viewPaymentDetail = (_quickPay: QuickPayment) => {
  ElMessage.info('支付详情查看功能开发中')
}

const confirmPayment = async () => {
  try {
    processing.value = true
    await confirmPaymentApi(`ORDER_${Date.now()}`, {
      amount: paymentForm.amount,
      method: paymentForm.method,
      remark: paymentForm.remark
    })
    ElMessage.success('支付成功')
    paymentDialogVisible.value = false
    resetPaymentForm()
  } catch (error) {
    ElMessage.error('支付失败')
  } finally {
    processing.value = false
  }
}

const saveExpense = () => {
  try {
    saving.value = true
    
    if (expenseForm.id) {
      // 编辑逻辑
      const index = expenses.value.findIndex(exp => exp.id === expenseForm.id)
      if (index !== -1) {
        // 创建一个新的对象，确保类型匹配
        const updatedExpense = {
          id: expenseForm.id,
          name: expenseForm.name,
          description: expenseForm.description,
          amount: expenseForm.amount,
          category: expenseForm.category,
          payer: expenseForm.payer
        }
        expenses.value[index] = updatedExpense
      }
      ElMessage.success('费用更新成功')
    } else {
      // 新增逻辑
      const newExpense = {
        id: Date.now(),
        name: expenseForm.name,
        description: expenseForm.description,
        amount: expenseForm.amount,
        category: expenseForm.category,
        payer: expenseForm.payer
      }
      expenses.value.push(newExpense)
      ElMessage.success('费用添加成功')
    }
    
    expenseDialogVisible.value = false
    resetExpenseForm()
  } catch (error) {
    ElMessage.error('保存失败')
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

// 生命周期
onMounted(() => {
  // 初始化快速支付金额
  quickPayments.value[0].amount = totalPending.value || 0
  quickPayments.value[1].amount = (totalPending.value || 0) * 0.5
  quickPayments.value[2].amount = totalExpense.value || 0
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
.cost-sharing-section,
.quick-payment-section {
  background: white;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.payment-methods-section h2,
.cost-sharing-section h2,
.quick-payment-section h2 {
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

.quick-payment-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.quick-pay-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  background: #f5f7fa;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.amount {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.card-body {
  padding: 20px;
}

.card-body p {
  margin: 0 0 15px 0;
  color: #606266;
}

.quick-actions {
  display: flex;
  gap: 10px;
}

.payment-amount {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}
</style>
