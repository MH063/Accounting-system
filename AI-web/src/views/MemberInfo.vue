<template>
  <div class="member-info">
    <div class="page-header">
      <h1>成员信息</h1>
      <div class="header-actions">
        <el-button 
          v-if="!isEditing" 
          type="primary" 
          @click="startEdit"
          :loading="loading"
        >
          <el-icon><Edit /></el-icon>
          编辑信息
        </el-button>
        <el-button 
          v-if="isEditing" 
          @click="cancelEdit"
        >
          取消
        </el-button>
        <el-button 
          v-if="isEditing" 
          type="primary" 
          @click="saveMemberInfo"
          :loading="saving"
        >
          <el-icon><Check /></el-icon>
          保存
        </el-button>
        <el-button 
          type="primary" 
          :icon="ArrowLeft" 
          @click="router.push('/dashboard/member')"
          class="back-btn"
        >
          返回
        </el-button>
      </div>
    </div>

    <div class="content-section">
      <el-row :gutter="20">
        <!-- 成员基本信息卡片 -->
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>基本信息</span>
                <!-- 联系信息快捷操作 -->
                <div class="contact-actions" v-if="!isEditing">
                  <el-button size="small" @click="callPhone" circle>
                    <el-icon><Phone /></el-icon>
                  </el-button>
                  <el-button size="small" @click="sendEmail" circle>
                    <el-icon><Message /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>

            <div v-if="!isEditing" class="info-display">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="姓名">
                  <div class="info-value">{{ currentMember.name }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="联系电话">
                  <div class="info-value">{{ currentMember.phone }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="邮箱">
                  <div class="info-value">{{ currentMember.email || '未设置' }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="房间号">
                  <el-tag size="small">{{ currentMember.room }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="成员角色">
                  <el-tag :type="currentMember.role === 'admin' ? 'danger' : 'info'" size="small">
                    {{ currentMember.role === 'admin' ? '管理员' : '普通成员' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="getStatusType(currentMember.status)" size="small">
                    {{ getStatusText(currentMember.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="加入日期">
                  <div class="info-value">{{ currentMember.joinDate }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">
                  <div class="info-value">{{ currentMember.remark || '无备注' }}</div>
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div v-else class="info-edit">
              <el-form 
                ref="memberFormRef"
                :model="editForm"
                :rules="memberRules"
                label-width="120px"
              >
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="姓名" prop="name">
                      <el-input 
                        v-model="editForm.name" 
                        placeholder="请输入姓名"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="联系电话" prop="phone">
                      <el-input 
                        v-model="editForm.phone" 
                        placeholder="请输入联系电话"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="邮箱" prop="email">
                      <el-input 
                        v-model="editForm.email" 
                        placeholder="请输入邮箱"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="房间号" prop="room">
                      <el-select 
                        v-model="editForm.room" 
                        placeholder="请选择房间"
                        clearable
                      >
                        <el-option label="A-101" value="A-101" />
                        <el-option label="A-102" value="A-102" />
                        <el-option label="A-103" value="A-103" />
                        <el-option label="A-104" value="A-104" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="成员角色" prop="role">
                      <el-radio-group v-model="editForm.role">
                        <el-radio value="member">普通成员</el-radio>
                        <el-radio value="admin">管理员</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="状态" prop="status">
                      <el-select 
                        v-model="editForm.status" 
                        placeholder="请选择状态"
                      >
                        <el-option label="在宿舍" value="active" />
                        <el-option label="外出" value="away" />
                        <el-option label="离校" value="inactive" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="备注" prop="remark">
                      <el-input 
                        v-model="editForm.remark" 
                        type="textarea" 
                        placeholder="请输入备注信息"
                        :rows="3"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </el-card>
        </el-col>

        <!-- 费用贡献统计卡片 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>费用贡献统计</span>
              </div>
            </template>
            <div class="financial-section">
              <div class="financial-grid">
                <div class="financial-item">
                  <div class="financial-label">总贡献</div>
                  <div class="financial-value">￥{{ financialStats.totalContribution }}</div>
                </div>
                <div class="financial-item">
                  <div class="financial-label">本月分摊</div>
                  <div class="financial-value">￥{{ financialStats.monthlyShare }}</div>
                </div>
                <div class="financial-item">
                  <div class="financial-label">待缴费用</div>
                  <div class="financial-value pending">￥{{ financialStats.pendingAmount }}</div>
                </div>
                <div class="financial-item">
                  <div class="financial-label">已缴费用</div>
                  <div class="financial-value paid">￥{{ financialStats.paidAmount }}</div>
                </div>
              </div>
              <div class="contribution-chart">
                <div class="chart-title">近6个月贡献趋势</div>
                <div class="chart-bars">
                  <div 
                    v-for="(month, index) in financialStats.contributionTrend" 
                    :key="index"
                    class="chart-bar"
                    :style="{ height: (month.amount / financialStats.maxAmount * 80) + 'px' }"
                  >
                    <div class="bar-value">￥{{ month.amount }}</div>
                    <div class="bar-label">{{ month.month }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 活跃度分析卡片 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>活跃度分析</span>
              </div>
            </template>
            <div class="activity-section">
              <div class="activity-metrics">
                <div class="activity-item">
                  <div class="activity-header">
                    <el-icon class="activity-icon"><Timer /></el-icon>
                    <span>在线时长</span>
                  </div>
                  <div class="activity-value">{{ activityStats.onlineTime }}小时</div>
                  <div class="activity-trend" :class="activityStats.onlineTimeTrend">
                    {{ activityStats.onlineTimeTrend === 'up' ? '↗' : '↘' }} {{ Math.abs(activityStats.onlineTimeChange) }}%
                  </div>
                </div>
                <div class="activity-item">
                  <div class="activity-header">
                    <el-icon class="activity-icon"><ChatDotRound /></el-icon>
                    <span>互动次数</span>
                  </div>
                  <div class="activity-value">{{ activityStats.interactionCount }}次</div>
                  <div class="activity-trend" :class="activityStats.interactionTrend">
                    {{ activityStats.interactionTrend === 'up' ? '↗' : '↘' }} {{ Math.abs(activityStats.interactionChange) }}%
                  </div>
                </div>
                <div class="activity-item">
                  <div class="activity-header">
                    <el-icon class="activity-icon"><Clock /></el-icon>
                    <span>最后活跃</span>
                  </div>
                  <div class="activity-value">{{ activityStats.lastActive }}</div>
                  <div class="activity-trend" :class="activityStats.activeStatus">
                    <el-icon><CircleCheck /></el-icon>
                    {{ activityStats.activeStatus === 'active' ? '活跃' : '不活跃' }}
                  </div>
                </div>
              </div>
              
              <!-- 活跃度时间线 -->
              <div class="activity-timeline">
                <div class="timeline-title">最近活动记录</div>
                <div class="timeline-items">
                  <div 
                    v-for="activity in activityStats.recentActivities" 
                    :key="activity.id"
                    class="timeline-item"
                  >
                    <div class="timeline-dot" :class="activity.type"></div>
                    <div class="timeline-content">
                      <div class="timeline-action">{{ activity.action }}</div>
                      <div class="timeline-time">{{ activity.time }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, 
  Edit, 
  Check, 
  Phone,
  Message,
  CopyDocument,
  Timer,
  Clock,
  CircleCheck,
  ChatDotRound
} from '@element-plus/icons-vue'
import dormService from '@/services/dormService'
import memberService from '@/services/memberService'

interface Member {
  id: number
  name: string
  phone: string
  email?: string
  room: string
  role: 'admin' | 'member'
  status: 'active' | 'away' | 'inactive'
  joinDate: string
  remark?: string
  avatar?: string
  shareAmount?: number
  completedTasks?: number
  totalTasks?: number
}

const router = useRouter()
const route = useRoute()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const isEditing = ref(false)


// 费用贡献统计数据 - 从API加载
const financialStats = ref({
  totalContribution: 0,
  monthlyShare: 0,
  pendingAmount: 0,
  paidAmount: 0,
  maxAmount: 100,
  contributionTrend: [] as Array<{ month: string; amount: number; }>
})

// 活跃度统计数据 - 从API加载
const activityStats = ref({
  onlineTime: 0,
  onlineTimeTrend: 'up',
  onlineTimeChange: 0,
  interactionCount: 0,
  interactionTrend: 'up',
  interactionChange: 0,
  lastActive: '',
  activeStatus: 'active',
  recentActivities: [] as Array<{ id: number; action: string; time: string; type: string; }>
})

// 加载财务统计数据
const loadFinancialStats = async () => {
  try {
    console.log('开始加载财务统计数据...')
    
    const response = await memberService.getMemberFinancialStats(memberId.value)
    
    if (response.success) {
      financialStats.value = response.data
    } else {
      console.error('加载财务统计数据失败:', response.message)
      financialStats.value = {
        totalContribution: 0,
        monthlyShare: 0,
        pendingAmount: 0,
        paidAmount: 0,
        maxAmount: 100,
        contributionTrend: []
      }
    }
    
    console.log('成功加载财务统计数据')
  } catch (error) {
    console.error('加载财务统计数据失败:', error)
    financialStats.value = {
      totalContribution: 0,
      monthlyShare: 0,
      pendingAmount: 0,
      paidAmount: 0,
      maxAmount: 100,
      contributionTrend: []
    }
  }
}

// 加载活跃度统计数据
const loadActivityStats = async () => {
  try {
    console.log('开始加载活跃度统计数据...')
    
    // 调用真实API获取活跃度统计数据
    const response = await memberService.getMemberActivityStats(memberId.value)
    
    if (response.success && response.data) {
      activityStats.value = response.data
    } else {
      throw new Error(response.message || '加载活跃度统计数据失败')
    }
    
    console.log('成功加载活跃度统计数据')
  } catch (error) {
    console.error('加载活跃度统计数据失败:', error)
    ElMessage.error('加载活跃度统计数据失败: ' + (error as Error).message)
    activityStats.value = {
      onlineTime: 0,
      onlineTimeTrend: 'up',
      onlineTimeChange: 0,
      interactionCount: 0,
      interactionTrend: 'up',
      interactionChange: 0,
      lastActive: '',
      activeStatus: 'active',
      recentActivities: []
    }
  }
}


// 表单引用
const memberFormRef = ref()

// 成员数据 - 从API加载
const currentMember = ref<Member>({
  id: 0,
  name: '',
  phone: '',
  email: '',
  room: '',
  role: 'member',
  status: 'active',
  joinDate: '',
  remark: '',
  shareAmount: 0,
  completedTasks: 0,
  totalTasks: 0
})

// 加载成员信息
const loadMemberInfo = async () => {
  try {
    loading.value = true
    console.log('开始加载成员信息，ID:', memberId.value)
    
    // 调用真实API获取成员信息
    try {
      const response = await memberService.getMemberById(memberId.value)
      if (response.success && response.data) {
        currentMember.value = response.data
      } else {
        throw new Error(response.message || '成员信息不存在')
      }
    } catch (error) {
      console.error('获取成员信息失败:', error)
      ElMessage.error('获取成员信息失败: ' + (error as Error).message)
      // 使用默认数据
      currentMember.value = {
        id: parseInt(memberId.value) || 0,
        name: '',
        phone: '',
        email: '',
        room: '',
        role: 'member',
        status: 'active',
        joinDate: '',
        remark: '',
        shareAmount: 0,
        completedTasks: 0,
        totalTasks: 0
      }
    }
    
    console.log('成功加载成员信息:', currentMember.value)
  } catch (error) {
    console.error('加载成员信息失败:', error)
    ElMessage.error('加载成员信息失败')
    // 加载失败时设置为空数据
    currentMember.value = {
      id: 0,
      name: '',
      phone: '',
      email: '',
      room: '',
      role: 'member',
      status: 'active',
      joinDate: '',
      remark: '',
      shareAmount: 0,
      completedTasks: 0,
      totalTasks: 0
    }
  } finally {
    loading.value = false
  }
}

// 编辑表单
const editForm = ref({
  name: '',
  phone: '',
  email: '',
  room: '',
  role: 'member',
  status: 'active',
  remark: ''
})

// 表单验证规则
const memberRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  room: [
    { required: true, message: '请选择房间', trigger: 'change' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 计算属性
const memberId = computed(() => {
  return route.params.id as string
})

// 方法已移动到前面定义

const startEdit = () => {
  isEditing.value = true
  // 复制当前成员信息到编辑表单
  editForm.value = {
    name: currentMember.value.name,
    phone: currentMember.value.phone,
    email: currentMember.value.email || '',
    room: currentMember.value.room,
    role: currentMember.value.role,
    status: currentMember.value.status,
    remark: currentMember.value.remark || ''
  }
}

const cancelEdit = () => {
  isEditing.value = false
  memberFormRef.value?.clearValidate()
}

const saveMemberInfo = async () => {
  if (!memberFormRef.value) return
  
  try {
    await memberFormRef.value.validate()
    saving.value = true
    console.log('开始保存成员信息:', editForm.value)
    
    const response = await memberService.updateMember(memberId.value, {
      name: editForm.value.name,
      phone: editForm.value.phone,
      email: editForm.value.email || undefined,
      room: editForm.value.room,
      role: editForm.value.role as 'admin' | 'member',
      status: editForm.value.status as 'active' | 'away' | 'inactive',
      remark: editForm.value.remark || undefined
    })
    
    if (response.success) {
      currentMember.value = { 
        ...currentMember.value, 
        name: editForm.value.name,
        phone: editForm.value.phone,
        email: editForm.value.email || undefined,
        room: editForm.value.room,
        role: editForm.value.role as 'admin' | 'member',
        status: editForm.value.status as 'active' | 'away' | 'inactive',
        remark: editForm.value.remark || undefined
      }
      ElMessage.success('成员信息保存成功')
    } else {
      throw new Error(response.message || '保存失败')
    }
    
    isEditing.value = false
    ElMessage.success('成员信息保存成功')
    console.log('成员信息保存成功')
    
  } catch (error) {
    console.error('保存成员信息失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}



const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'away': return 'warning'
    case 'inactive': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '在宿舍'
    case 'away': return '外出'
    case 'inactive': return '离校'
    default: return '未知'
  }
}

// 联系信息快捷操作
const callPhone = () => {
  if (currentMember.value.phone) {
    window.location.href = `tel:${currentMember.value.phone}`
    ElMessage.success(`正在拨打 ${currentMember.value.phone}`)
  } else {
    ElMessage.warning('该成员未设置电话号码')
  }
}

const sendEmail = () => {
  if (currentMember.value.email) {
    const subject = encodeURIComponent('宿舍管理通知')
    const body = encodeURIComponent('您好，这是来自宿舍管理系统的通知。')
    window.location.href = `mailto:${currentMember.value.email}?subject=${subject}&body=${body}`
    ElMessage.success(`正在打开邮件客户端`)
  } else {
    ElMessage.warning('该成员未设置邮箱地址')
  }
}

const copyStudentId = async () => {
  // 方法已移除
}



// 生命周期
onMounted(async () => {
  try {
    // 加载成员信息
    await loadMemberInfo()
    
    // 加载财务统计数据
    await loadFinancialStats()
    
    // 加载活跃度统计数据
    await loadActivityStats()
    
    console.log('MemberInfo 组件初始化完成')
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('初始化失败，请刷新页面重试')
  }
})
</script>

<style scoped>
.member-info {
  padding: 0;
  margin: 0;
  min-height: 100vh;
  background: #f5f7fa;
}

.content-section {
  margin-top: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.back-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
}

.content-section {
  margin-bottom: 20px;
}

/* 卡片样式 */

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 联系信息快捷操作 */
.contact-actions {
  display: flex;
  gap: 8px;
}

.contact-actions .el-button {
  border: none;
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
  transition: all 0.3s ease;
}

.contact-actions .el-button:hover {
  background: rgba(64, 158, 255, 0.2);
  transform: translateY(-1px);
}

.info-display {
  margin-bottom: 24px;
}

.info-value {
  font-weight: 500;
  color: #303133;
}

.info-edit {
  margin-bottom: 24px;
}

/* 费用贡献统计样式 */
.financial-section {
  margin-top: 24px;
  padding: 20px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #409EFF;
  border-radius: 2px;
}

.financial-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.financial-item {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
}

.financial-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.financial-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.financial-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.financial-value.pending {
  color: #E6A23C;
}

.financial-value.paid {
  color: #67C23A;
}

/* 贡献图表样式 */
.contribution-chart {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.chart-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
  text-align: center;
}

.chart-bars {
  display: flex;
  align-items: end;
  justify-content: space-around;
  height: 100px;
  padding: 0 10px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 60px;
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 4px;
}

.bar-label {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

/* 活跃度展示样式 */
.activity-section {
  margin-top: 24px;
  padding: 20px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.activity-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.activity-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
}

.activity-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.activity-icon {
  font-size: 16px;
  color: #409EFF;
}

.activity-header span {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.activity-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.activity-trend {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.activity-trend.up {
  color: #67C23A;
}

.activity-trend.down {
  color: #F56C6C;
}

.activity-trend.active {
  color: #409EFF;
}

.activity-trend.inactive {
  color: #909399;
}

/* 活跃度时间线样式 */
.activity-timeline {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.timeline-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
  font-weight: 500;
}

.timeline-items {
  position: relative;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  position: relative;
  z-index: 1;
}

.timeline-dot.login {
  background: #409EFF;
}

.timeline-dot.payment {
  background: #67C23A;
}

.timeline-dot.task {
  background: #E6A23C;
}

.timeline-dot.interaction {
  background: #909399;
}

.timeline-content {
  flex: 1;
}

.timeline-action {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
}

.timeline-item:not(:last-child) .timeline-dot::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 20px;
  background: #e4e7ed;
}


/* 成员头部 */
.member-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0; }
}

/* 成员信息 */
.member-info-section {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-id {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 12px 0;
  font-weight: 500;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tags-section .el-tag {
  border: none;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.tags-section .status-tag {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.tags-section .status-tag.el-tag--success {
  background: rgba(103, 194, 58, 0.3);
}

.tags-section .status-tag.el-tag--warning {
  background: rgba(255, 193, 7, 0.3);
}

.tags-section .status-tag.el-tag--info {
  background: rgba(144, 147, 153, 0.3);
}

/* 统计数据网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stats-grid-item {
  text-align: center;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stats-grid-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.stats-number {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}







@media (max-width: 768px) {
  .el-col {
    margin-bottom: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  /* 移动端优化 */
  .member-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  /* 财务统计响应式 */
  .financial-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .financial-item {
    padding: 12px;
  }
  
  .financial-value {
    font-size: 16px;
  }
  
  .contribution-chart {
    padding: 16px;
  }
  
  .chart-bars {
    height: 80px;
    padding: 0 5px;
  }
  
  .bar-value {
    font-size: 10px;
  }
  
  .bar-label {
    font-size: 9px;
  }
  
  /* 活跃度响应式 */
  .activity-metrics {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .activity-item {
    padding: 16px;
  }
  
  .activity-value {
    font-size: 18px;
  }
  
  .activity-timeline {
    padding: 16px;
  }
  
  .timeline-item {
    gap: 8px;
  }
  
  .timeline-action {
    font-size: 13px;
  }
  
  .timeline-time {
    font-size: 11px;
  }
  
  .stats-number {
    font-size: 20px;
  }
  
  .member-name {
    font-size: 18px;
  }
}
</style>