<template>
  <div class="notification-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>通知管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreate">发送通知</el-button>
            <el-button @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索条件 -->
      <el-form :model="searchForm" label-width="80px" inline class="search-form">
        <el-form-item label="通知类型">
          <el-select v-model="searchForm.type" placeholder="请选择通知类型" clearable>
            <el-option label="系统通知" value="system" />
            <el-option label="公告" value="announcement" />
            <el-option label="提醒" value="reminder" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发送状态">
          <el-select v-model="searchForm.status" placeholder="请选择发送状态" clearable>
            <el-option label="已发送" value="sent" />
            <el-option label="草稿" value="draft" />
            <el-option label="发送失败" value="failed" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发送时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 通知列表 -->
      <el-table :data="notificationList" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="通知标题" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <el-link type="primary" @click="handleView(scope.row)">{{ scope.row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="通知类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">
              {{ getTypeText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="recipientCount" label="接收人数" width="100" />
        <el-table-column prop="status" label="发送状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sender" label="发送人" width="120" />
        <el-table-column prop="sendTime" label="发送时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleResend(scope.row)" 
              :disabled="scope.row.status === 'sent'"
            >
              重新发送
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 15, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 发送通知对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" @close="handleDialogClose">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="通知类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择通知类型" style="width: 100%;">
            <el-option label="系统通知" value="system" />
            <el-option label="公告" value="announcement" />
            <el-option label="提醒" value="reminder" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="通知标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入通知标题" />
        </el-form-item>
        
        <el-form-item label="通知内容" prop="content">
          <el-input 
            v-model="formData.content" 
            type="textarea" 
            :rows="6" 
            placeholder="请输入通知内容" 
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="接收对象" prop="recipients">
          <el-select 
            v-model="formData.recipients" 
            multiple 
            placeholder="请选择接收对象"
            style="width: 100%;"
          >
            <el-option label="所有用户" value="all" />
            <el-option label="管理员" value="admins" />
            <el-option label="普通用户" value="users" />
            <el-option label="VIP用户" value="vip" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发送方式">
          <el-checkbox-group v-model="formData.sendMethods">
            <el-checkbox label="email">邮件</el-checkbox>
            <el-checkbox label="sms">短信</el-checkbox>
            <el-checkbox label="in-app">站内信</el-checkbox>
            <el-checkbox label="push">推送通知</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="定时发送">
          <el-switch v-model="formData.scheduleEnabled" />
          <el-date-picker
            v-if="formData.scheduleEnabled"
            v-model="formData.scheduleTime"
            type="datetime"
            placeholder="选择发送时间"
            style="margin-left: 15px;"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">发送</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 通知详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="通知详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="通知ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="通知类型">
          <el-tag :type="getTypeTagType(detailData.type)">
            {{ getTypeText(detailData.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发送状态">
          <el-tag :type="getStatusTagType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="接收人数">{{ detailData.recipientCount }}人</el-descriptions-item>
        <el-descriptions-item label="发送人">{{ detailData.sender }}</el-descriptions-item>
        <el-descriptions-item label="发送时间">{{ detailData.sendTime }}</el-descriptions-item>
        <el-descriptions-item label="通知标题" :span="2">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="通知内容" :span="2">
          <div class="notification-content">{{ detailData.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="发送方式" :span="2">
          <el-tag 
            v-for="method in detailData.sendMethods" 
            :key="method" 
            style="margin-right: 10px;"
          >
            {{ getMethodText(method) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

const searchForm = reactive({
  type: '',
  status: '',
  dateRange: []
})

const formData = reactive({
  id: 0,
  type: 'system',
  title: '',
  content: '',
  recipients: [],
  sendMethods: ['in-app'],
  scheduleEnabled: false,
  scheduleTime: ''
})

const detailData = reactive({
  id: 0,
  type: 'system',
  title: '',
  content: '',
  recipientCount: 0,
  status: 'sent',
  sender: '',
  sendTime: '',
  sendMethods: []
})

const notificationList = ref([
  {
    id: 1,
    title: '系统维护通知',
    type: 'system',
    recipientCount: 1256,
    status: 'sent',
    sender: '系统管理员',
    sendTime: '2023-11-15 14:30:22'
  },
  {
    id: 2,
    title: '新功能上线公告',
    type: 'announcement',
    recipientCount: 2450,
    status: 'sent',
    sender: '产品运营部',
    sendTime: '2023-11-10 09:15:45'
  },
  {
    id: 3,
    title: '安全升级提醒',
    type: 'reminder',
    recipientCount: 892,
    status: 'failed',
    sender: '安全管理员',
    sendTime: '2023-11-05 16:22:18'
  }
])

const formRules = {
  type: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }],
  recipients: [{ required: true, message: '请选择接收对象', trigger: 'change' }]
}

// 获取通知类型文本
const getTypeText = (type: string) => {
  switch (type) {
    case 'system':
      return '系统通知'
    case 'announcement':
      return '公告'
    case 'reminder':
      return '提醒'
    default:
      return '未知'
  }
}

// 获取通知类型标签类型
const getTypeTagType = (type: string) => {
  switch (type) {
    case 'system':
      return 'primary'
    case 'announcement':
      return 'success'
    case 'reminder':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取发送状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'sent':
      return '已发送'
    case 'draft':
      return '草稿'
    case 'failed':
      return '发送失败'
    default:
      return '未知'
  }
}

// 获取发送状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'sent':
      return 'success'
    case 'draft':
      return ''
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取发送方式文本
const getMethodText = (method: string) => {
  switch (method) {
    case 'email':
      return '邮件'
    case 'sms':
      return '短信'
    case 'in-app':
      return '站内信'
    case 'push':
      return '推送通知'
    default:
      return '未知'
  }
}

// 处理分页变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  console.log(`每页 ${val} 条`)
  fetchData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  console.log(`当前页: ${val}`)
  fetchData()
}

// 获取数据
const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据刷新成功')
  }, 500)
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索通知:', searchForm)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.type = ''
  searchForm.status = ''
  searchForm.dateRange = []
  ElMessage.success('重置搜索条件')
}

// 刷新
const handleRefresh = () => {
  fetchData()
}

// 发送通知
const handleCreate = () => {
  dialogTitle.value = '发送通知'
  // 重置表单数据
  Object.assign(formData, {
    id: 0,
    type: 'system',
    title: '',
    content: '',
    recipients: [],
    sendMethods: ['in-app'],
    scheduleEnabled: false,
    scheduleTime: ''
  })
  dialogVisible.value = true
}

// 查看详情
const handleView = (row: any) => {
  Object.assign(detailData, {
    ...row,
    content: '这是一条系统维护通知，请各位用户注意备份重要数据。\n\n维护时间：2023年11月20日 00:00 - 06:00\n影响范围：部分功能暂时不可用\n感谢您的理解与配合！',
    sendMethods: ['email', 'in-app']
  })
  detailDialogVisible.value = true
}

// 重新发送
const handleResend = (row: any) => {
  ElMessageBox.confirm(
    `确定要重新发送通知"${row.title}"吗？`,
    '重新发送确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('重新发送通知:', row)
    ElMessage.success('重新发送成功')
  }).catch(() => {
    ElMessage.info('已取消重新发送')
  })
}

// 提交表单
const submitForm = () => {
  if (!formRef.value) return
  
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      submitLoading.value = true
      console.log('提交表单:', formData)
      
      setTimeout(() => {
        submitLoading.value = false
        dialogVisible.value = false
        ElMessage.success('通知发送成功')
        fetchData() // 刷新列表
      }, 1000)
    } else {
      ElMessage.error('请填写必填项')
    }
  })
}

// 对话框关闭回调
const handleDialogClose = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 组件挂载
onMounted(() => {
  fetchData()
  console.log('📢 通知管理页面加载完成')
})

/**
 * 通知管理页面
 * 支持发送、查看、重新发送系统通知等功能
 */
</script>

<style scoped>
.notification-management-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.notification-content {
  white-space: pre-line;
  line-height: 1.6;
}
</style>