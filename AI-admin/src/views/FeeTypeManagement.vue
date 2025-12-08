<template>
  <div class="fee-type-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费用类型管理</span>
          <div>
            <el-button @click="handleImport">导入</el-button>
            <el-button @click="handleExport">导出</el-button>
            <el-button type="primary" @click="handleAdd">新增费用类型</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="费用类型名称">
            <el-input v-model="searchForm.name" placeholder="请输入费用类型名称" clearable />
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 费用类型表格 -->
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="80" sortable="custom" />
        <el-table-column prop="name" label="费用类型名称" />
        <el-table-column prop="code" label="费用类型编码" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="defaultAmount" label="默认金额(元)" sortable="custom" />
        <el-table-column prop="billingCycle" label="计费周期">
          <template #default="scope">
            {{ getBillingCycleText(scope.row.billingCycle) }}
          </template>
        </el-table-column>
        <el-table-column prop="allocationRule" label="默认分摊规则">
          <template #default="scope">
            {{ getAllocationRuleText(scope.row.allocationRule) }}
          </template>
        </el-table-column>
        <el-table-column prop="usageCount" label="使用次数" sortable="custom" />
        <el-table-column prop="sortOrder" label="显示顺序" width="120">
          <template #default="scope">
            <el-input-number 
              v-model="scope.row.sortOrder" 
              :min="1" 
              :max="999" 
              size="small" 
              @change="handleSortOrderChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="enabled"
              inactive-value="disabled"
              @change="handleStatusChange(scope.row)"
            />
            <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'" style="margin-left: 10px;">
              {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="primary" @click="handleAnalyze(scope.row)">统计</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
    
    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="费用类型名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入费用类型名称" />
        </el-form-item>
        
        <el-form-item label="费用类型编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入费用类型编码" />
        </el-form-item>
        
        <el-form-item label="默认金额(元)" prop="defaultAmount">
          <el-input-number 
            v-model="formData.defaultAmount" 
            :min="0" 
            :precision="2" 
            :step="100" 
            controls-position="right" 
            style="width: 100%;" 
          />
        </el-form-item>
        
        <el-form-item label="计费周期" prop="billingCycle">
          <el-select v-model="formData.billingCycle" placeholder="请选择计费周期" style="width: 100%;">
            <el-option label="一次性" value="one-time" />
            <el-option label="每月" value="monthly" />
            <el-option label="每学期" value="semester" />
            <el-option label="每年" value="yearly" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="默认分摊规则" prop="allocationRule">
          <el-select v-model="formData.allocationRule" placeholder="请选择默认分摊规则" style="width: 100%;">
            <el-option label="按人平均分摊" value="average" />
            <el-option label="按寝室分摊" value="dormitory" />
            <el-option label="按专业分摊" value="major" />
            <el-option label="不分摊" value="none" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="显示顺序" prop="sortOrder">
          <el-input-number 
            v-model="formData.sortOrder" 
            :min="1" 
            :max="999" 
            controls-position="right" 
            style="width: 100%;" 
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="enabled">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入描述" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="费用类型详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="费用类型名称">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="费用类型编码">{{ detailData.code }}</el-descriptions-item>
        <el-descriptions-item label="默认金额">{{ detailData.defaultAmount }} 元</el-descriptions-item>
        <el-descriptions-item label="计费周期">{{ getBillingCycleText(detailData.billingCycle) }}</el-descriptions-item>
        <el-descriptions-item label="默认分摊规则">{{ getAllocationRuleText(detailData.allocationRule) }}</el-descriptions-item>
        <el-descriptions-item label="显示顺序">{{ detailData.sortOrder }}</el-descriptions-item>
        <el-descriptions-item label="使用次数">{{ detailData.usageCount }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 'enabled' ? 'success' : 'danger'">
            {{ detailData.status === 'enabled' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ detailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detailData.description }}</el-descriptions-item>
      </el-descriptions>
      
      <!-- 使用统计图表 -->
      <el-divider />
      <h3>使用统计</h3>
      <div ref="usageChartRef" style="height: 300px;"></div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入费用类型" width="500px">
      <el-upload
        class="upload-demo"
        drag
        action="/api/fee-types/import"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持.xlsx格式的文件，文件大小不超过10MB
          </div>
        </template>
      </el-upload>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitImport">确定导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 导入统一验证规则库
import { commonRules, businessRules } from '@/utils/validationRules'

// 图表引用
const usageChartRef = ref()

// 图表实例
let usageChart: any = null

// 响应式数据
const tableData = ref([
  {
    id: 1,
    name: '住宿费',
    code: 'ACCOMMODATION',
    description: '学生住宿费用',
    defaultAmount: 1200.00,
    billingCycle: 'semester',
    allocationRule: 'dormitory',
    usageCount: 1256,
    sortOrder: 1,
    status: 'enabled',
    createTime: '2023-01-01 10:00:00'
  },
  {
    id: 2,
    name: '水电费',
    code: 'UTILITIES',
    description: '宿舍水电费用',
    defaultAmount: 100.00,
    billingCycle: 'monthly',
    allocationRule: 'average',
    usageCount: 2450,
    sortOrder: 2,
    status: 'enabled',
    createTime: '2023-01-02 10:00:00'
  },
  {
    id: 3,
    name: '网费',
    code: 'INTERNET',
    description: '校园网络使用费用',
    defaultAmount: 50.00,
    billingCycle: 'monthly',
    allocationRule: 'none',
    usageCount: 1876,
    sortOrder: 3,
    status: 'enabled',
    createTime: '2023-01-03 10:00:00'
  },
  {
    id: 4,
    name: '教材费',
    code: 'TEXTBOOK',
    description: '教材购买费用',
    defaultAmount: 800.00,
    billingCycle: 'semester',
    allocationRule: 'major',
    usageCount: 980,
    sortOrder: 4,
    status: 'disabled',
    createTime: '2023-01-04 10:00:00'
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

const searchForm = ref({
  name: '',
  status: ''
})

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const importDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const fileList = ref([])
const sortParams = ref({
  prop: '',
  order: ''
})

const formData = ref({
  id: 0,
  name: '',
  code: '',
  description: '',
  defaultAmount: 0,
  billingCycle: 'one-time',
  allocationRule: 'average',
  sortOrder: 1,
  status: 'enabled'
})

const detailData = ref({
  id: 0,
  name: '',
  code: '',
  description: '',
  defaultAmount: 0,
  billingCycle: 'one-time',
  allocationRule: 'average',
  usageCount: 0,
  sortOrder: 1,
  status: 'enabled',
  createTime: ''
})

const formRules = {
  name: commonRules.name,
  code: businessRules.feeTypeCode,
  defaultAmount: commonRules.amount,
  billingCycle: commonRules.select,
  allocationRule: commonRules.select,
  sortOrder: commonRules.integer
}

const formRef = ref()

// 获取计费周期文本
const getBillingCycleText = (cycle: string) => {
  switch (cycle) {
    case 'one-time':
      return '一次性'
    case 'monthly':
      return '每月'
    case 'semester':
      return '每学期'
    case 'yearly':
      return '每年'
    default:
      return '未知'
  }
}

// 获取分摊规则文本
const getAllocationRuleText = (rule: string) => {
  switch (rule) {
    case 'average':
      return '按人平均分摊'
    case 'dormitory':
      return '按寝室分摊'
    case 'major':
      return '按专业分摊'
    case 'none':
      return '不分摊'
    default:
      return '未知'
  }
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索费用类型:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    name: '',
    status: ''
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
  // 初始化使用统计图表
  nextTick(() => {
    initUsageChart()
  })
}

// 初始化使用统计图表
const initUsageChart = () => {
  if (usageChartRef.value) {
    usageChart = echarts.init(usageChartRef.value)
    renderUsageChart()
  }
}

// 渲染使用统计图表
const renderUsageChart = () => {
  if (!usageChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['使用次数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '使用次数',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210, 150, 180, 190, 210, 230],
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(64, 158, 255, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(64, 158, 255, 0.1)'
            }
          ])
        }
      }
    ]
  }
  
  usageChart.setOption(option)
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增费用类型'
  isEdit.value = false
  // 设置默认显示顺序为当前最大值+1
  const maxSortOrder = Math.max(...tableData.value.map(item => item.sortOrder), 0)
  formData.value = {
    id: 0,
    name: '',
    code: '',
    description: '',
    defaultAmount: 0,
    billingCycle: 'one-time',
    allocationRule: 'average',
    sortOrder: maxSortOrder + 1,
    status: 'enabled'
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑费用类型'
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除费用类型 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🗑️ 删除费用类型:', row.id)
    ElMessage.success('费用类型删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除费用类型失败:', error)
      ElMessage.error('删除费用类型失败')
    }
  }
}

// 状态变更
const handleStatusChange = (row: any) => {
  console.log('🔄 费用类型状态变更:', row)
  ElMessage.success(`费用类型"${row.name}"状态已更新`)
}

// 显示顺序变更
const handleSortOrderChange = (row: any) => {
  console.log('🔄 费用类型显示顺序变更:', row)
  ElMessage.success(`费用类型"${row.name}"显示顺序已更新`)
}

// 排序变更
const handleSortChange = (sortInfo: any) => {
  sortParams.value.prop = sortInfo.prop
  sortParams.value.order = sortInfo.order
  console.log('📊 表格排序变更:', sortInfo)
  ElMessage.info('排序功能待实现')
}

// 统计分析
const handleAnalyze = (row: any) => {
  handleView(row)
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        console.log('✏️ 编辑费用类型:', formData.value)
        ElMessage.success('费用类型编辑成功')
      } else {
        console.log('➕ 新增费用类型:', formData.value)
        ElMessage.success('费用类型新增成功')
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

// 导入
const handleImport = () => {
  fileList.value = []
  importDialogVisible.value = true
}

// 导出
const handleExport = () => {
  ElMessageBox.confirm(
    '确定要导出所有费用类型数据吗？',
    '导出确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('📤 导出费用类型数据')
    ElMessage.success('费用类型数据导出成功')
  }).catch(() => {
    // 取消导出
  })
}

// 文件变化处理
const handleFileChange = (file: any, fileList: any) => {
  console.log('📁 文件变化:', file, fileList)
}

// 提交导入
const submitImport = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  
  console.log('📥 导入费用类型数据')
  ElMessage.success('费用类型数据导入成功')
  importDialogVisible.value = false
}

// 组件挂载
onMounted(() => {
  console.log('💰 费用类型管理页面加载完成')
})

// 监听窗口大小变化，重新渲染图表
window.addEventListener('resize', () => {
  if (usageChart) {
    usageChart.resize()
  }
})

/**
 * 费用类型管理页面
 * 管理系统中的各种费用类型
 */
</script>

<style scoped>
.fee-type-management-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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