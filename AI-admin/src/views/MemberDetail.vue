<template>
  <div class="member-detail-container" :class="{ 'is-mobile': isMobile }">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成员详情</span>
          <div class="header-actions">
            <el-button @click="goBack" :size="isMobile ? 'small' : 'default'">返回</el-button>
            <el-button type="primary" @click="editMember" :size="isMobile ? 'small' : 'default'">编辑</el-button>
          </div>
        </div>
      </template>
      
      <div class="member-profile">
        <!-- 个人信息概览 -->
        <div class="profile-header">
          <el-avatar :src="member.avatar" class="member-avatar" :size="isMobile ? 64 : 80" />
          <div class="member-basic-info">
            <h2 class="member-name">{{ member.name }}</h2>
            <div class="member-tags">
              <el-tag :type="getRoleTagType(member.role)" size="small">
                {{ getRoleText(member.role) }}
              </el-tag>
              <el-tag :type="getStatusTagType(member.status)" size="small">
                {{ getStatusText(member.status) }}
              </el-tag>
            </div>
            <div class="member-meta">
              <span class="meta-item">
                <el-icon><HomeFilled /></el-icon>
                寝室: {{ member.dormitory }}
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                入住时间: {{ formatDate(member.joinDate) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 详细信息 -->
        <el-tabs v-model="activeTab" class="member-tabs">
          <el-tab-pane label="基本信息" name="basic">
            <div class="tab-content">
              <el-row :gutter="isMobile ? 0 : 20">
                <el-col :xs="24" :sm="12">
                  <div class="info-group">
                    <h3>联系信息</h3>
                    <div class="info-item">
                      <label>手机号:</label>
                      <div class="info-value">
                        <span>{{ member.phone || '未填写' }}</span>
                        <el-button 
                          v-if="member.phone" 
                          type="primary" 
                          link
                          @click="callPhone(member.phone)"
                        >
                          <el-icon><Phone /></el-icon>
                          拨打
                        </el-button>
                      </div>
                    </div>
                    <div class="info-item">
                      <label>邮箱:</label>
                      <div class="info-value">
                        <span>{{ member.email || '未填写' }}</span>
                        <el-button 
                          v-if="member.email" 
                          type="primary" 
                          link
                          @click="sendEmail(member.email)"
                        >
                          <el-icon><Message /></el-icon>
                          发邮件
                        </el-button>
                      </div>
                    </div>
                    <div class="info-item">
                      <label>紧急联系人:</label>
                      <div class="info-value">
                        <span>{{ member.emergencyContact?.name || '未填写' }}</span>
                        <span v-if="member.emergencyContact?.phone" class="sub-info">
                          ({{ member.emergencyContact.phone }})
                        </span>
                      </div>
                    </div>
                  </div>
                </el-col>
                
                <el-col :xs="24" :sm="12">
                  <div class="info-group">
                    <h3>个人资料</h3>
                    <div class="info-item">
                      <label>性别:</label>
                      <div class="info-value">
                        <span>{{ member.gender === 'male' ? '男' : '女' }}</span>
                      </div>
                    </div>
                    <div class="info-item">
                      <label>生日:</label>
                      <div class="info-value">
                        <span>{{ member.birthday ? formatDate(member.birthday) : '未填写' }}</span>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
              
              <div class="info-group">
                <h3>备注信息</h3>
                <div class="info-item bio-item">
                  <label>个人简介:</label>
                  <div class="info-value">
                    <span>{{ member.bio || '暂无个人简介' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="费用贡献" name="expenses">
            <div class="tab-content">
              <div class="expenses-summary">
                <el-row :gutter="isMobile ? 10 : 20">
                  <el-col :xs="12" :sm="6">
                    <div class="summary-card">
                      <div class="summary-title">总支出</div>
                      <div class="summary-value">¥{{ expensesSummary.total }}</div>
                    </div>
                  </el-col>
                  <el-col :xs="12" :sm="6">
                    <div class="summary-card">
                      <div class="summary-title">已支付</div>
                      <div class="summary-value">¥{{ expensesSummary.paid }}</div>
                    </div>
                  </el-col>
                  <el-col :xs="12" :sm="6">
                    <div class="summary-card">
                      <div class="summary-title">待支付</div>
                      <div class="summary-value">¥{{ expensesSummary.pending }}</div>
                    </div>
                  </el-col>
                  <el-col :xs="12" :sm="6">
                    <div class="summary-card">
                      <div class="summary-title">平均分摊</div>
                      <div class="summary-value">¥{{ expensesSummary.average }}</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
              
              <div class="expenses-chart">
                <h3>费用分布</h3>
                <div class="chart-container">
                  <div class="chart-placeholder">
                    <el-icon><PieChart /></el-icon>
                    <p>费用分布图表</p>
                  </div>
                </div>
              </div>
              
              <div class="recent-expenses">
                <h3>近期费用记录</h3>
                <div class="table-wrapper">
                  <el-table :data="recentExpenses" style="width: 100%" :size="isMobile ? 'small' : 'default'">
                    <el-table-column prop="title" label="费用名称" min-width="120" />
                    <el-table-column prop="amount" label="金额" width="100">
                      <template #default="{ row }">
                        ¥{{ row.amount }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="date" label="日期" width="110" v-if="!isMobile">
                      <template #default="{ row }">
                        {{ formatDate(row.date) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                      <template #default="{ row }">
                        <el-tag :type="getExpenseStatusType(row.status)" size="small">
                          {{ getExpenseStatusText(row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="活跃度" name="activity">
            <div class="tab-content">
              <div class="activity-summary">
                <el-row :gutter="isMobile ? 10 : 20">
                  <el-col :xs="12" :sm="8">
                    <div class="summary-card">
                      <div class="summary-title">本月活跃度</div>
                      <div class="summary-value">{{ activitySummary.monthly }}</div>
                    </div>
                  </el-col>
                  <el-col :xs="12" :sm="8">
                    <div class="summary-card">
                      <div class="summary-title">本周活跃度</div>
                      <div class="summary-value">{{ activitySummary.weekly }}</div>
                    </div>
                  </el-col>
                  <el-col :xs="24" :sm="8">
                    <div class="summary-card" :class="{ 'mt-10': isMobile }">
                      <div class="summary-title">总活跃度</div>
                      <div class="summary-value">{{ activitySummary.total }}</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
              
              <div class="activity-chart">
                <h3>活跃度趋势</h3>
                <div class="chart-container">
                  <div class="chart-placeholder">
                    <el-icon><DataLine /></el-icon>
                    <p>活跃度趋势图表</p>
                  </div>
                </div>
              </div>
              
              <div class="recent-activities">
                <h3>近期活动</h3>
                <el-timeline :reverse="false">
                  <el-timeline-item
                    v-for="activity in recentActivities"
                    :key="activity.id"
                    :timestamp="formatDateTime(activity.timestamp)"
                    placement="top"
                    size="small"
                  >
                    <el-card shadow="never">
                      <h4>{{ activity.title }}</h4>
                      <p>{{ activity.description }}</p>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑成员信息"
      :width="isMobile ? '95%' : '600px'"
      :fullscreen="isMobile"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        :label-width="isMobile ? '70px' : '100px'"
        :label-position="isMobile ? 'top' : 'left'"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        
        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="editForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="editForm.email" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="editForm.gender" placeholder="请选择性别" style="width: 100%">
                <el-option label="男" value="male" />
                <el-option label="女" value="female" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="editForm.role" placeholder="请选择角色" style="width: 100%">
                <el-option label="普通成员" value="member" />
                <el-option label="寝室长" value="leader" />
                <el-option label="访客" value="guest" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="editForm.bio"
            type="textarea"
            :rows="isMobile ? 2 : 3"
            placeholder="请输入个人简介"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMember">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  User, HomeFilled, Calendar, Phone, Message, 
  PieChart, DataLine 
} from '@element-plus/icons-vue'

// 路由实例
const router = useRouter()
const route = useRoute()

// 移动端适配
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 响应式数据
const activeTab = ref('basic')
const editDialogVisible = ref(false)
const editFormRef = ref()

const member = ref({
  id: 1,
  name: '张三',
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  role: 'leader',
  status: 'online',
  phone: '13800138001',
  email: 'zhangsan@example.com',
  dormitory: 'A栋101室',
  joinDate: '2023-09-01',
  gender: 'male',
  birthday: '2002-05-15',
  bio: '热爱编程和技术分享，喜欢篮球和音乐',
  emergencyContact: {
    name: '张父',
    phone: '13800138000'
  }
})

const editForm = reactive({
  name: '',
  phone: '',
  email: '',
  gender: '',
  role: '',
  bio: ''
})

const editFormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const expensesSummary = ref({
  total: 1200,
  paid: 950,
  pending: 250,
  average: 300
})

const recentExpenses = ref([
  {
    id: 1,
    title: '电费分摊',
    amount: 80,
    date: '2023-10-15',
    status: 'paid'
  },
  {
    id: 2,
    title: '水费分摊',
    amount: 30,
    date: '2023-10-10',
    status: 'paid'
  },
  {
    id: 3,
    title: '网费分摊',
    amount: 50,
    date: '2023-10-05',
    status: 'pending'
  }
])

const activitySummary = ref({
  monthly: 85,
  weekly: 25,
  total: 320
})

const recentActivities = ref([
  {
    id: 1,
    title: '提交电费费用',
    description: '提交了10月份电费分摊费用',
    timestamp: '2023-10-15T14:30:00Z'
  },
  {
    id: 2,
    title: '参与卫生检查',
    description: '参与了寝室卫生检查并获得优秀评价',
    timestamp: '2023-10-12T09:15:00Z'
  },
  {
    id: 3,
    title: '更新个人信息',
    description: '更新了个人联系方式信息',
    timestamp: '2023-10-10T16:45:00Z'
  }
])

// 方法
const goBack = () => {
  router.back()
}

const editMember = () => {
  // 初始化编辑表单
  editForm.name = member.value.name
  editForm.phone = member.value.phone
  editForm.email = member.value.email
  editForm.gender = member.value.gender
  editForm.role = member.value.role
  editForm.bio = member.value.bio
  
  editDialogVisible.value = true
}

const saveMember = () => {
  editFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 更新成员信息
      member.value.name = editForm.name
      member.value.phone = editForm.phone
      member.value.email = editForm.email
      member.value.gender = editForm.gender
      member.value.role = editForm.role
      member.value.bio = editForm.bio
      
      editDialogVisible.value = false
      ElMessage.success('成员信息更新成功')
    } else {
      ElMessage.warning('请填写完整的成员信息')
    }
  })
}

const callPhone = (phone: string) => {
  window.location.href = `tel:${phone}`
}

const sendEmail = (email: string) => {
  window.location.href = `mailto:${email}`
}

const getRoleTagType = (role: string) => {
  switch (role) {
    case 'leader': return 'primary'
    case 'member': return 'success'
    case 'guest': return 'warning'
    default: return 'info'
  }
}

const getRoleText = (role: string) => {
  switch (role) {
    case 'leader': return '寝室长'
    case 'member': return '成员'
    case 'guest': return '访客'
    default: return '未知'
  }
}

const getStatusTagType = (status: string) => {
  return status === 'online' ? 'success' : 'info'
}

const getStatusText = (status: string) => {
  return status === 'online' ? '在线' : '离线'
}

const getExpenseStatusType = (status: string) => {
  switch (status) {
    case 'paid': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'danger'
    default: return 'info'
  }
}

const getExpenseStatusText = (status: string) => {
  switch (status) {
    case 'paid': return '已支付'
    case 'pending': return '待支付'
    case 'rejected': return '已拒绝'
    default: return '未知'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 组件挂载时的操作
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  console.log('👤 成员详情页面加载完成', route.params.id)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.member-detail-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-profile {
  padding: 20px 0;
}

.profile-header {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.member-avatar {
  flex-shrink: 0;
}

.member-basic-info {
  flex: 1;
}

.member-name {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
}

.member-tags {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.member-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
}

.member-tabs {
  margin-top: 20px;
}

.tab-content {
  padding: 20px 0;
}

.info-group {
  margin-bottom: 30px;
}

.info-group h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.info-item {
  display: flex;
  margin-bottom: 15px;
  line-height: 1.5;
}

.info-item label {
  width: 100px;
  color: #909399;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.sub-info {
  color: #909399;
  font-size: 13px;
}

.bio-item {
  flex-direction: column;
}

.bio-item label {
  width: 100%;
  margin-bottom: 10px;
}

.expenses-summary,
.activity-summary {
  margin-bottom: 30px;
}

.summary-card {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.summary-title {
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.expenses-chart,
.activity-chart,
.recent-expenses,
.recent-activities {
  margin-bottom: 30px;
}

.expenses-chart h3,
.activity-chart h3,
.recent-expenses h3,
.recent-activities h3 {
  font-size: 16px;
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  background-color: #f5f7fa;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.table-wrapper {
  overflow-x: auto;
}

.mt-10 {
  margin-top: 10px;
}

/* 移动端适配样式 */
@media (max-width: 768px) {
  .member-detail-container {
    padding: 10px;
  }

  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 15px;
  }

  .member-tags {
    justify-content: center;
  }

  .member-meta {
    justify-content: center;
    gap: 15px;
  }

  .info-item {
    flex-direction: column;
  }

  .info-item label {
    width: 100%;
    margin-bottom: 5px;
  }

  .summary-card {
    padding: 15px 10px;
  }

  .summary-value {
    font-size: 16px;
  }

  .chart-container {
    height: 250px;
  }
}
</style>