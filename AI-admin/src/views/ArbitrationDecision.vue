<template>
  <div class="arbitration-decision-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>仲裁决策</span>
          <el-button type="primary" @click="handleRefresh">刷新</el-button>
        </div>
      </template>
      
      <!-- 仲裁统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">待仲裁争议</div>
                <div class="stat-value">{{ stats.pending }}</div>
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
                <div class="stat-title">仲裁中争议</div>
                <div class="stat-value">{{ stats.inProgress }}</div>
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
                <div class="stat-title">已裁决争议</div>
                <div class="stat-value">{{ stats.decided }}</div>
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
                <div class="stat-title">裁决准确率</div>
                <div class="stat-value">{{ stats.accuracyRate }}%</div>
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
          
          <el-form-item label="仲裁状态">
            <el-select v-model="searchForm.arbitrationStatus" placeholder="请选择仲裁状态" clearable>
              <el-option label="待仲裁" value="pending" />
              <el-option label="仲裁中" value="in-progress" />
              <el-option label="已裁决" value="decided" />
              <el-option label="已结案" value="closed" />
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
      
      <!-- 仲裁列表 -->
      <el-table :data="arbitrationList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="disputeNo" label="争议编号" width="150" />
        <el-table-column prop="applicant" label="申请人" width="120" />
        <el-table-column prop="type" label="争议类型" width="100">
          <template #default="scope">
            {{ getDisputeTypeText(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="title" label="争议标题" />
        <el-table-column prop="transferTime" label="转交时间" width="160" />
        <el-table-column prop="arbitrationStatus" label="仲裁状态" width="100">
          <template #default="scope">
            <el-tag :type="getArbitrationStatusTagType(scope.row.arbitrationStatus)">
              {{ getArbitrationStatusText(scope.row.arbitrationStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看详情</el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleArbitrate(scope.row)" 
              :disabled="scope.row.arbitrationStatus === 'decided' || scope.row.arbitrationStatus === 'closed'"
            >
              仲裁
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handleClose(scope.row)" 
              :disabled="scope.row.arbitrationStatus !== 'decided'"
            >
              结案
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
    
    <!-- 仲裁对话框 -->
    <el-dialog v-model="arbitrationDialogVisible" title="仲裁处理" width="700px">
      <el-form :model="arbitrationForm" :rules="arbitrationFormRules" ref="arbitrationFormRef" label-width="100px">
        <el-form-item label="争议编号">
          {{ arbitrationForm.disputeNo }}
        </el-form-item>
        
        <el-form-item label="申请人">
          {{ arbitrationForm.applicant }}
        </el-form-item>
        
        <el-form-item label="争议类型">
          {{ getDisputeTypeText(arbitrationForm.type) }}
        </el-form-item>
        
        <el-form-item label="争议标题">
          {{ arbitrationForm.title }}
        </el-form-item>
        
        <el-form-item label="争议描述">
          {{ arbitrationForm.description }}
        </el-form-item>
        
        <el-form-item label="相关附件">
          <div v-if="arbitrationForm.attachments && arbitrationForm.attachments.length > 0">
            <el-link 
              v-for="(attachment, index) in arbitrationForm.attachments" 
              :key="index" 
              :href="attachment.url" 
              target="_blank" 
              style="margin-right: 10px;"
            >
              {{ attachment.name }}
            </el-link>
          </div>
          <div v-else>无附件</div>
        </el-form-item>
        
        <el-divider />
        
        <el-form-item label="仲裁意见" prop="opinion">
          <el-input 
            v-model="arbitrationForm.opinion" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入仲裁意见" 
          />
        </el-form-item>
        
        <el-form-item label="裁决结果" prop="decision">
          <el-radio-group v-model="arbitrationForm.decision">
            <el-radio label="uphold">维持原决定</el-radio>
            <el-radio label="reverse">推翻原决定</el-radio>
            <el-radio label="compromise">折中处理</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="处理建议" prop="suggestion">
          <el-input 
            v-model="arbitrationForm.suggestion" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入处理建议" 
          />
        </el-form-item>
        
        <el-form-item label="仲裁状态">
          <el-radio-group v-model="arbitrationForm.arbitrationStatus">
            <el-radio label="in-progress">仲裁中</el-radio>
            <el-radio label="decided">已裁决</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="arbitrationDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitArbitration">确定</el-button>
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
        <el-descriptions-item label="受理时间">{{ detailData.acceptTime }}</el-descriptions-item>
        <el-descriptions-item label="受理人">{{ detailData.acceptor }}</el-descriptions-item>
        <el-descriptions-item label="转交时间">{{ detailData.transferTime }}</el-descriptions-item>
        <el-descriptions-item label="转交人">{{ detailData.transferor }}</el-descriptions-item>
        <el-descriptions-item label="仲裁状态">
          <el-tag :type="getArbitrationStatusTagType(detailData.arbitrationStatus)">
            {{ getArbitrationStatusText(detailData.arbitrationStatus) }}
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
        <el-descriptions-item label="仲裁意见" :span="2">{{ detailData.arbitrationOpinion || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="裁决结果" :span="2">{{ getDecisionText(detailData.decision) || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="处理建议" :span="2">{{ detailData.suggestion || '暂无' }}</el-descriptions-item>
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Warning, Check, TrendCharts } from '@element-plus/icons-vue'

// 响应式数据
const stats = ref({
  pending: 8,
  inProgress: 5,
  decided: 15,
  accuracyRate: 96.7
})

const arbitrationList = ref([
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
    transferTime: '2023-11-01 14:00:00',
    transferor: '王五',
    arbitrationStatus: 'in-progress',
    attachments: [
      { name: '费用明细.pdf', url: '#' }
    ],
    arbitrationOpinion: '经核查，费用计算确实存在误差',
    decision: 'reverse',
    suggestion: '退还多收的50元费用'
  },
  {
    id: 2,
    disputeNo: 'DIS20231031001',
    applicant: '赵六',
    contact: '13700137000',
    type: 'system',
    title: '系统功能异常',
    description: '支付功能无法正常使用',
    submitTime: '2023-10-31 15:22:45',
    acceptTime: '2023-10-31 16:00:00',
    acceptor: '孙七',
    transferTime: '2023-11-01 09:00:00',
    transferor: '周八',
    arbitrationStatus: 'pending',
    attachments: [
      { name: '截图1.png', url: '#' },
      { name: '截图2.png', url: '#' }
    ],
    arbitrationOpinion: '',
    decision: '',
    suggestion: ''
  },
  {
    id: 3,
    disputeNo: 'DIS20231030001',
    applicant: '钱九',
    contact: '13600136000',
    type: 'service',
    title: '维修服务不及时',
    description: '报修已5天仍未处理',
    submitTime: '2023-10-30 09:15:22',
    acceptTime: '2023-10-30 10:00:00',
    acceptor: '吴十',
    transferTime: '2023-10-31 14:00:00',
    transferor: '郑十一',
    arbitrationStatus: 'decided',
    attachments: [],
    arbitrationOpinion: '维修确实存在延误情况',
    decision: 'uphold',
    suggestion: '对相关责任人进行考核，并加强维修团队管理'
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
  arbitrationStatus: '',
  dateRange: []
})

const arbitrationDialogVisible = ref(false)
const detailDialogVisible = ref(false)

const arbitrationForm = ref({
  id: 0,
  disputeNo: '',
  applicant: '',
  type: '',
  title: '',
  description: '',
  attachments: [] as any[],
  opinion: '',
  decision: '',
  suggestion: '',
  arbitrationStatus: 'in-progress'
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
  transferTime: '',
  transferor: '',
  arbitrationStatus: '',
  attachments: [] as any[],
  arbitrationOpinion: '',
  decision: '',
  suggestion: ''
})

const arbitrationFormRules = {
  opinion: [{ required: true, message: '请输入仲裁意见', trigger: 'blur' }],
  decision: [{ required: true, message: '请选择裁决结果', trigger: 'change' }],
  suggestion: [{ required: true, message: '请输入处理建议', trigger: 'blur' }]
}

const arbitrationFormRef = ref()

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

// 获取仲裁状态文本
const getArbitrationStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待仲裁'
    case 'in-progress':
      return '仲裁中'
    case 'decided':
      return '已裁决'
    case 'closed':
      return '已结案'
    default:
      return '未知'
  }
}

// 获取仲裁状态标签类型
const getArbitrationStatusTagType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'in-progress':
      return 'primary'
    case 'decided':
      return 'success'
    case 'closed':
      return 'info'
    default:
      return 'info'
  }
}

// 获取裁决结果文本
const getDecisionText = (decision: string) => {
  switch (decision) {
    case 'uphold':
      return '维持原决定'
    case 'reverse':
      return '推翻原决定'
    case 'compromise':
      return '折中处理'
    default:
      return ''
  }
}

// 刷新
const handleRefresh = () => {
  console.log('🔄 刷新仲裁数据')
  ElMessage.success('数据刷新成功')
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索仲裁:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    disputeNo: '',
    applicant: '',
    type: '',
    arbitrationStatus: '',
    dateRange: []
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

// 仲裁处理
const handleArbitrate = (row: any) => {
  arbitrationForm.value = {
    id: row.id,
    disputeNo: row.disputeNo,
    applicant: row.applicant,
    type: row.type,
    title: row.title,
    description: row.description,
    attachments: row.attachments,
    opinion: row.arbitrationOpinion || '',
    decision: row.decision || '',
    suggestion: row.suggestion || '',
    arbitrationStatus: row.arbitrationStatus === 'pending' ? 'in-progress' : row.arbitrationStatus
  }
  arbitrationDialogVisible.value = true
}

// 结案处理
const handleClose = (row: any) => {
  console.log('🔒 结案处理:', row)
  ElMessage.success(`争议"${row.disputeNo}"已结案`)
  
  // 更新状态
  const index = arbitrationList.value.findIndex(item => item.id === row.id)
  if (index !== -1) {
    arbitrationList.value[index].arbitrationStatus = 'closed'
  }
}

// 提交仲裁
const submitArbitration = () => {
  arbitrationFormRef.value.validate((valid: boolean) => {
    if (valid) {
      console.log('⚖️ 提交仲裁:', arbitrationForm.value)
      ElMessage.success('仲裁处理成功')
      
      // 更新列表数据
      const index = arbitrationList.value.findIndex(item => item.id === arbitrationForm.value.id)
      if (index !== -1) {
        arbitrationList.value[index].arbitrationOpinion = arbitrationForm.value.opinion
        arbitrationList.value[index].decision = arbitrationForm.value.decision
        arbitrationList.value[index].suggestion = arbitrationForm.value.suggestion
        arbitrationList.value[index].arbitrationStatus = arbitrationForm.value.arbitrationStatus
      }
      
      arbitrationDialogVisible.value = false
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
  console.log('⚖️ 仲裁决策页面加载完成')
})

/**
 * 仲裁决策页面
 * 对争议进行仲裁处理和裁决
 */
</script>

<style scoped>
.arbitration-decision-container {
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
</style>