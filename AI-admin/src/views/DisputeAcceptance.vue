<template>
  <div class="dispute-acceptance-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>争议受理</span>
          <el-button type="primary" @click="handleCreate">新建争议</el-button>
        </div>
      </template>
      
      <!-- 争议统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">今日新增争议</div>
                <div class="stat-value">{{ stats.todayNew }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-warning">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">待处理争议</div>
                <div class="stat-value">{{ stats.pending }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><Check /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">已处理争议</div>
                <div class="stat-value">{{ stats.processed }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><TrendCharts /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">处理及时率</div>
                <div class="stat-value">{{ stats.timelyRate }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="争议编号">
            <el-input v-model="searchForm.disputeNo" placeholder="请输入争议编号" clearable />
          </el-form-item>
          
          <el-form-item label="申请人">
            <el-input v-model="searchForm.applicant" placeholder="请输入申请人" clearable />
          </el-form-item>
          
          <el-form-item label="争议类型">
            <el-select v-model="searchForm.type" placeholder="请选择争议类型" clearable>
              <el-option label="费用争议" value="fee" />
              <el-option label="服务争议" value="service" />
              <el-option label="系统争议" value="system" />
              <el-option label="其他争议" value="other" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="待受理" value="pending" />
              <el-option label="受理中" value="accepted" />
              <el-option label="已驳回" value="rejected" />
              <el-option label="已转交" value="transferred" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 争议列表 -->
      <el-table :data="disputeList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="disputeNo" label="争议编号" width="150" />
        <el-table-column prop="applicant" label="申请人" width="120" />
        <el-table-column prop="type" label="争议类型" width="100">
          <template #default="scope">
            {{ getDisputeTypeText(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="title" label="争议标题" />
        <el-table-column prop="submitTime" label="提交时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看详情</el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleAccept(scope.row)" 
              :disabled="scope.row.status !== 'pending'"
            >
              受理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 15, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新建/编辑争议对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="争议编号" prop="disputeNo">
          <el-input v-model="formData.disputeNo" placeholder="请输入争议编号" />
        </el-form-item>
        
        <el-form-item label="申请人" prop="applicant">
          <el-input v-model="formData.applicant" placeholder="请输入申请人" />
        </el-form-item>
        
        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="formData.contact" placeholder="请输入联系方式" />
        </el-form-item>
        
        <el-form-item label="争议类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择争议类型" style="width: 100%;">
            <el-option label="费用争议" value="fee" />
            <el-option label="服务争议" value="service" />
            <el-option label="系统争议" value="system" />
            <el-option label="其他争议" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="争议标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入争议标题" />
        </el-form-item>
        
        <el-form-item label="争议描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入争议详细描述" 
          />
        </el-form-item>
        
        <el-form-item label="相关附件">
          <el-upload
            class="upload-demo"
            action="/api/upload"
            :file-list="fileList"
            multiple
          >
            <el-button size="small" type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">只能上传jpg/png/pdf文件，且不超过5MB</div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="pending">待受理</el-radio>
            <el-radio label="accepted">受理中</el-radio>
            <el-radio label="rejected">已驳回</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 争议详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="争议详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="争议编号">{{ detailData.disputeNo }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detailData.applicant }}</el-descriptions-item>
        <el-descriptions-item label="联系方式">{{ detailData.contact }}</el-descriptions-item>
        <el-descriptions-item label="争议类型">{{ getDisputeTypeText(detailData.type) }}</el-descriptions-item>
        <el-descriptions-item label="争议标题" :span="2">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="争议描述" :span="2">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ detailData.submitTime }}</el-descriptions-item>
        <el-descriptions-item label="受理时间">{{ detailData.acceptTime || '未受理' }}</el-descriptions-item>
        <el-descriptions-item label="受理人">{{ detailData.acceptor || '未受理' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="相关附件" :span="2">
          <div v-if="detailData.attachments && detailData.attachments.length > 0">
            <el-link 
              v-for="(attachment, index) in detailData.attachments" 
              :key="index" 
              :href="attachment.url" 
              target="_blank" 
              style="margin-right: 10px;"
            >
              {{ attachment.name }}
            </el-link>
          </div>
          <div v-else>无附件</div>
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="handleTransferToArbitration(detailData)" 
            :disabled="detailData.status !== 'accepted'"
          >
            转交仲裁
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Warning, Check, TrendCharts } from '@element-plus/icons-vue'

// 导入统一验证规则库
import { commonRules, businessRules } from '@/utils/validationRules'
import { validateFile } from '@/utils/fileUploadValidator'// 响应式数据
const stats = ref({
  todayNew: 5,
  pending: 12,
  processed: 28,
  timelyRate: 92.5
})

const disputeList = ref([
  {
    id: 1,
    disputeNo: 'DIS20231101001',
    applicant: '张三',
    contact: '13800138000',
    type: 'fee',
    title: '费用计算错误争议',
    description: '本月水电费计算有误，多收了50元',
    submitTime: '2023-11-01 10:35:18',
    acceptTime: '2023-11-01 11:00:00',
    acceptor: '李四',
    status: 'accepted',
    attachments: [
      { name: '费用明细.pdf', url: '#' }
    ]
  },
  {
    id: 2,
    disputeNo: 'DIS20231101002',
    applicant: '王五',
    contact: '13900139000',
    type: 'service',
    title: '维修服务不及时',
    description: '报修已3天仍未处理',
    submitTime: '2023-11-01 09:45:33',
    acceptTime: '',
    acceptor: '',
    status: 'pending',
    attachments: []
  },
  {
    id: 3,
    disputeNo: 'DIS20231031001',
    applicant: '赵六',
    contact: '13700137000',
    type: 'system',
    title: '系统功能异常',
    description: '支付功能无法正常使用',
    submitTime: '2023-10-31 15:22:45',
    acceptTime: '2023-10-31 16:00:00',
    acceptor: '孙七',
    status: 'transferred',
    attachments: [
      { name: '截图1.png', url: '#' },
      { name: '截图2.png', url: '#' }
    ]
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

const searchForm = ref({
  disputeNo: '',
  applicant: '',
  type: '',
  status: '',
  dateRange: []
})

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const formData = ref({
  id: 0,
  disputeNo: '',
  applicant: '',
  contact: '',
  type: '',
  title: '',
  description: '',
  status: 'pending'
})

const detailData = ref({
  id: 0,
  disputeNo: '',
  applicant: '',
  contact: '',
  type: '',
  title: '',
  description: '',
  submitTime: '',
  acceptTime: '',
  acceptor: '',
  status: '',
  attachments: [] as any[]
})

const fileList = ref([])

const formRules = {
  disputeNo: businessRules.disputeNo,
  applicant: commonRules.name,
  contact: commonRules.phone,
  type: commonRules.select,
  title: commonRules.name,
  description: commonRules.description
}

const formRef = ref()
// 获取争议类型文本
const getDisputeTypeText = (type: string) => {
  switch (type) {
    case 'fee':
      return '费用争议'
    case 'service':
      return '服务争议'
    case 'system':
      return '系统争议'
    case 'other':
      return '其他争议'
    default:
      return '未知'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待受理'
    case 'accepted':
      return '受理中'
    case 'rejected':
      return '已驳回'
    case 'transferred':
      return '已转交'
    default:
      return '未知'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'accepted':
      return 'primary'
    case 'rejected':
      return 'danger'
    case 'transferred':
      return 'success'
    default:
      return 'info'
  }
}

// 新建争议
const handleCreate = () => {
  dialogTitle.value = '新建争议'
  isEdit.value = false
  formData.value = {
    id: 0,
    disputeNo: `DIS${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${(disputeList.value.length + 1).toString().padStart(3, '0')}`,
    applicant: '',
    contact: '',
    type: '',
    title: '',
    description: '',
    status: 'pending'
  }
  dialogVisible.value = true
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索争议:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    disputeNo: '',
    applicant: '',
    type: '',
    status: '',
    dateRange: []
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

// 受理争议
const handleAccept = (row: any) => {
  console.log('📋 受理争议:', row)
  ElMessage.success(`争议"${row.disputeNo}"已受理`)
  
  // 更新状态
  const index = disputeList.value.findIndex(item => item.id === row.id)
  if (index !== -1) {
    disputeList.value[index].status = 'accepted'
    disputeList.value[index].acceptTime = new Date().toLocaleString()
    disputeList.value[index].acceptor = '当前用户'
  }
}

// 转交仲裁
const handleTransferToArbitration = (row: any) => {
  ElMessageBox.confirm(
    `确定要将争议"${row.disputeNo}"转交给仲裁决策吗？`,
    '确认转交',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('⚖️ 转交仲裁:', row)
    ElMessage.success(`争议"${row.disputeNo}"已转交仲裁`)
    
    // 更新状态
    const index = disputeList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      disputeList.value[index].status = 'transferred'
    }
    
    detailDialogVisible.value = false
  }).catch(() => {
    // 用户取消操作
  })
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        console.log('✏️ 编辑争议:', formData.value)
        ElMessage.success('争议编辑成功')
      } else {
        console.log('➕ 新建争议:', formData.value)
        ElMessage.success('争议新建成功')
      }
      dialogVisible.value = false
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  console.log(`📈 每页显示 ${val} 条`)
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  console.log(`📄 当前页: ${val}`)
}

// 组件挂载
onMounted(() => {
  console.log('📋 争议受理页面加载完成')
})

/**
 * 争议受理页面
 * 处理用户提交的各类争议申请
 */
</script>

<style scoped>
.dispute-acceptance-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  margin-bottom: 0;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.bg-primary {
  background-color: #409EFF;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-success {
  background-color: #67C23A;
}

.bg-info {
  background-color: #909399;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.upload-demo {
  width: 100%;
}
</style>