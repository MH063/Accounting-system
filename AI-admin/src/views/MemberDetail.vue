<template>
  <div class="member-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成员详情</span>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button type="primary" @click="editMember">编辑</el-button>
          </div>
        </div>
      </template>
      
      <div class="member-profile">
        <!-- 个人信息概览 -->
        <div class="profile-header">
          <el-avatar :src="member.avatar" class="member-avatar" :size="80" />
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
                <el-icon><User /></el-icon>
                学号: {{ member.studentId }}
              </span>
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
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="info-group">
                    <h3>联系信息</h3>
                    <div class="info-item">
                      <label>手机号:</label>
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
                    <div class="info-item">
                      <label>邮箱:</label>
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
                    <div class="info-item">
                      <label>紧急联系人:</label>
                      <span>{{ member.emergencyContact?.name || '未填写' }}</span>
                      <span v-if="member.emergencyContact?.phone">
                        ({{ member.emergencyContact.phone }})
                      </span>
                    </div>
                  </div>
                </el-col>
                
                <el-col :span="12">
                  <div class="info-group">
                    <h3>个人资料</h3>
                    <div class="info-item">
                      <label>性别:</label>
                      <span>{{ member.gender === 'male' ? '男' : '女' }}</span>
                    </div>
                    <div class="info-item">
                      <label>生日:</label>
                      <span>{{ member.birthday ? formatDate(member.birthday) : '未填写' }}</span>
                    </div>
                    <div class="info-item">
                      <label>专业:</label>
                      <span>{{ member.major || '未填写' }}</span>
                    </div>
                    <div class="info-item">
                      <label>年级:</label>
                      <span>{{ member.grade || '未填写' }}</span>
                    </div>
                  </div>
                </el-col>
              </el-row>
              
              <div class="info-group">
                <h3>备注信息</h3>
                <div class="info-item">
                  <label>个人简介:</label>
                  <span>{{ member.bio || '暂无个人简介' }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="费用贡献" name="expenses">
            <div class="tab-content">
              <div class="expenses-summary">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <div class="summary-card">
                      <div class="summary-title">总支出</div>
                      <div class="summary-value">¥{{ expensesSummary.total }}</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="summary-card">
                      <div class="summary-title">已支付</div>
                      <div class="summary-value">¥{{ expensesSummary.paid }}</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="summary-card">
                      <div class="summary-title">待支付</div>
                      <div class="summary-value">¥{{ expensesSummary.pending }}</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
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
                  <!-- 这里应该是一个图表组件，暂时用占位符表示 -->
                  <div class="chart-placeholder">
                    <el-icon><PieChart /></el-icon>
                    <p>费用分布图表</p>
                  </div>
                </div>
              </div>
              
              <div class="recent-expenses">
                <h3>近期费用记录</h3>
                <el-table :data="recentExpenses" style="width: 100%">
                  <el-table-column prop="title" label="费用名称" />
                  <el-table-column prop="amount" label="金额">
                    <template #default="{ row }">
                      ¥{{ row.amount }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="date" label="日期">
                    <template #default="{ row }">
                      {{ formatDate(row.date) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态">
                    <template #default="{ row }">
                      <el-tag :type="getExpenseStatusType(row.status)">
                        {{ getExpenseStatusText(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="活跃度" name="activity">
            <div class="tab-content">
              <div class="activity-summary">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <div class="summary-card">
                      <div class="summary-title">本月活跃度</div>
                      <div class="summary-value">{{ activitySummary.monthly }}</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="summary-card">
                      <div class="summary-title">本周活跃度</div>
                      <div class="summary-value">{{ activitySummary.weekly }}</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="summary-card">
                      <div class="summary-title">总活跃度</div>
                      <div class="summary-value">{{ activitySummary.total }}</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
              
              <div class="activity-chart">
                <h3>活跃度趋势</h3>
                <div class="chart-container">
                  <!-- 这里应该是一个图表组件，暂时用占位符表示 -->
                  <div class="chart-placeholder">
                    <el-icon><DataLine /></el-icon>
                    <p>活跃度趋势图表</p>
                  </div>
                </div>
              </div>
              
              <div class="recent-activities">
                <h3>近期活动</h3>
                <el-timeline>
                  <el-timeline-item
                    v-for="activity in recentActivities"
                    :key="activity.id"
                    :timestamp="formatDateTime(activity.timestamp)"
                    placement="top"
                  >
                    <el-card>
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
      width="600px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="editForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号" prop="studentId">
              <el-input v-model="editForm.studentId" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="editForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="editForm.email" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="editForm.gender" placeholder="请选择性别">
                <el-option label="男" value="male" />
                <el-option label="女" value="female" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="editForm.role" placeholder="请选择角色">
                <el-option label="普通成员" value="member" />
                <el-option label="寝室长" value="leader" />
                <el-option label="访客" value="guest" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="专业" prop="major">
          <el-input v-model="editForm.major" />
        </el-form-item>
        
        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="editForm.bio"
            type="textarea"
            :rows="3"
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  User, HomeFilled, Calendar, Phone, Message, 
  PieChart, DataLine 
} from '@element-plus/icons-vue'

// 路由实例
const router = useRouter()
const route = useRoute()

// 响应式数据
const activeTab = ref('basic')
const editDialogVisible = ref(false)
const editFormRef = ref()

const member = ref({
  id: 1,
  name: '张三',
  studentId: '2021001',
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  role: 'leader',
  status: 'online',
  phone: '13800138001',
  email: 'zhangsan@example.com',
  dormitory: 'A栋101室',
  joinDate: '2023-09-01',
  gender: 'male',
  birthday: '2002-05-15',
  major: '计算机科学与技术',
  grade: '大三',
  bio: '热爱编程和技术分享，喜欢篮球和音乐',
  emergencyContact: {
    name: '张父',
    phone: '13800138000'
  }
})

const editForm = reactive({
  name: '',
  studentId: '',
  phone: '',
  email: '',
  gender: '',
  role: '',
  major: '',
  bio: ''
})

const editFormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  phone: [{ required: false, message: '请输入手机号', trigger: 'blur' }],
  email: [{ required: false, message: '请输入邮箱', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  major: [{ required: false, message: '请输入专业', trigger: 'blur' }]
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
  editForm.studentId = member.value.studentId
  editForm.phone = member.value.phone
  editForm.email = member.value.email
  editForm.gender = member.value.gender
  editForm.role = member.value.role
  editForm.major = member.value.major
  editForm.bio = member.value.bio
  
  editDialogVisible.value = true
}

const saveMember = () => {
  editFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 更新成员信息
      member.value.name = editForm.name
      member.value.studentId = editForm.studentId
      member.value.phone = editForm.phone
      member.value.email = editForm.email
      member.value.gender = editForm.gender
      member.value.role = editForm.role
      member.value.major = editForm.major
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
  console.log('👤 成员详情页面加载完成', route.params.id)
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

.tab-content {
  padding: 20px 0;
}

.info-group {
  margin-bottom: 20px;
}

.info-group h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px 0;
}

.info-item label {
  width: 100px;
  font-weight: 600;
  color: #606266;
}

.info-item span {
  flex: 1;
}

.expenses-summary,
.activity-summary {
  margin-bottom: 30px;
}

.summary-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.summary-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.chart-container {
  margin: 20px 0;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #909399;
}

.chart-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.recent-expenses,
.recent-activities {
  margin-top: 30px;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .member-meta {
    justify-content: center;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-item label {
    width: auto;
    margin-bottom: 5px;
  }
}
</style>