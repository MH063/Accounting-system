<template>
  <div class="fee-type-management-container" :class="{ 'is-mobile': isMobile }">
    <el-card>
      <template #header>
        <div class="card-header" :class="{ 'is-mobile': isMobile }">
          <span class="title">费用类型管理</span>
          <div class="header-actions">
            <el-button @click="handleImport">{{ isMobile ? '导入' : '导入' }}</el-button>
            <el-button @click="handleExport">{{ isMobile ? '导出' : '导出' }}</el-button>
            <el-button type="primary" @click="handleAdd">{{ isMobile ? '新增' : '新增费用类型' }}</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar" :class="{ 'is-mobile': isMobile }">
        <el-form :model="searchForm" :label-width="isMobile ? '70px' : '100px'" :inline="!isMobile" class="responsive-form">
          <el-row :gutter="isMobile ? 0 : 20">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="名称">
                <el-input v-model="searchForm.name" placeholder="请输入名称" clearable style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="状态">
                <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 100%">
                  <el-option label="启用" value="enabled" />
                  <el-option label="禁用" value="disabled" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="8">
              <el-form-item class="form-buttons">
                <el-button type="primary" @click="handleSearch">查询</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      
      <!-- 费用类型表格 -->
      <div class="table-container mobile-scroll">
        <el-table 
          :data="tableData" 
          style="width: 100%" 
          v-loading="loading"
          @sort-change="handleSortChange"
          :size="isMobile ? 'small' : 'default'"
        >
          <el-table-column prop="id" label="ID" width="70" sortable="custom" v-if="!isMobile" />
          <el-table-column prop="name" label="名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="code" label="编码" min-width="120" v-if="!isMobile" />
          <el-table-column prop="defaultAmount" label="默认金额" width="100" sortable="custom">
            <template #default="scope">
              ¥{{ scope.row.defaultAmount }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="140">
            <template #default="scope">
              <div class="status-cell">
                <el-switch
                  v-model="scope.row.status"
                  active-value="enabled"
                  inactive-value="disabled"
                  @change="handleStatusChange(scope.row)"
                  size="small"
                />
                <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'" size="small" style="margin-left: 8px;">
                  {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" :width="isMobile ? 120 : 250" fixed="right">
            <template #default="scope">
              <template v-if="isMobile">
                <el-dropdown trigger="click">
                  <el-button type="primary" size="small" text>
                    操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleView(scope.row)">查看</el-dropdown-item>
                      <el-dropdown-item @click="handleEdit(scope.row)">编辑</el-dropdown-item>
                      <el-dropdown-item @click="handleAnalyze(scope.row)">统计</el-dropdown-item>
                      <el-dropdown-item divided @click="handleDelete(scope.row)" style="color: #f56c6c">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
              <template v-else>
                <el-button size="small" @click="handleView(scope.row)" text>查看</el-button>
                <el-button size="small" @click="handleEdit(scope.row)" text>编辑</el-button>
                <el-button size="small" type="primary" @click="handleAnalyze(scope.row)" text>统计</el-button>
                <el-button size="small" type="danger" @click="handleDelete(scope.row)" text>删除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :total="total"
          :small="isMobile"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      :width="isMobile ? '95%' : '700px'"
      :fullscreen="isMobile"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" :label-width="isMobile ? '80px' : '120px'">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入费用类型名称" />
        </el-form-item>
        
        <el-form-item label="编码" prop="code">
          <el-input v-model="formData.code" placeholder="编码将根据名称自动生成" :disabled="isEdit" readonly>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="默认金额" prop="defaultAmount">
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
        
        <el-form-item label="分摊规则" prop="allocationRule">
          <el-select v-model="formData.allocationRule" placeholder="请选择默认分摊规则" style="width: 100%;">
            <el-option label="按人平均分摊" value="average" />
            <el-option label="按寝室分摊" value="dormitory" />
            <el-option label="不分摊" value="none" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排序" prop="sortOrder">
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
    <el-dialog 
      v-model="detailDialogVisible" 
      title="费用类型详情" 
      :width="isMobile ? '95%' : '700px'"
      :fullscreen="isMobile"
    >
      <el-descriptions :column="isMobile ? 1 : 2" border>
        <el-descriptions-item label="名称">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="编码">{{ detailData.code }}</el-descriptions-item>
        <el-descriptions-item label="默认金额">{{ detailData.defaultAmount }} 元</el-descriptions-item>
        <el-descriptions-item label="计费周期">{{ getBillingCycleText(detailData.billingCycle) }}</el-descriptions-item>
        <el-descriptions-item label="分摊规则">{{ getAllocationRuleText(detailData.allocationRule) }}</el-descriptions-item>
        <el-descriptions-item label="显示顺序">{{ detailData.sortOrder }}</el-descriptions-item>
        <el-descriptions-item label="使用次数">{{ detailData.usageCount }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 'enabled' ? 'success' : 'danger'">
            {{ detailData.status === 'enabled' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="isMobile ? 1 : 2">{{ detailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="isMobile ? 1 : 2">{{ detailData.description }}</el-descriptions-item>
      </el-descriptions>
      
      <!-- 使用统计图表 -->
      <el-divider />
      <h3>使用统计</h3>
      <div ref="usageChartRef" :style="{ height: isMobile ? '250px' : '300px' }"></div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导入对话框 -->
    <el-dialog 
      v-model="importDialogVisible" 
      title="导入费用类型" 
      :width="isMobile ? '95%' : '500px'"
    >
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
import { ref, onMounted, onUnmounted, nextTick, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, ArrowDown, Lock } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { feeApi, type FeeType, type FeeTypeQueryParams } from '@/api/fee'

// 导入统一验证规则库
import { commonRules, businessRules } from '@/utils/validationRules'

// 响应式布局
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 图表引用
const usageChartRef = ref()

// 图表实例
let usageChart: any = null

// 响应式数据
const tableData = ref<FeeType[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const searchForm = ref({
  name: '',
  status: ''
})

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const importDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const fileList = ref<any[]>([])
const selectedFile = ref<File | null>(null)
const sortParams = ref({
  prop: '',
  order: ''
})

const formData = ref<Partial<FeeType>>({
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

const detailData = ref<Partial<FeeType>>({
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

const generateCodeFromName = (name: string): string => {
  if (!name || !name.trim()) return ''
  
  const trimmedName = name.trim()
  
  const pinyinMap: Record<string, string> = {
    '一': 'yi', '二': 'er', '三': 'san', '四': 'si', '五': 'wu', '六': 'liu', '七': 'qi', '八': 'ba', '九': 'jiu', '十': 'shi',
    '电': 'dian', '水': 'shui', '煤': 'mei', '气': 'qi', '费': 'fei', '租': 'zu', '金': 'jin', '物': 'wu',
    '业': 'ye', '管': 'guan', '理': 'li', '费': 'fei', '暖': 'nuan', '通': 'tong', '网': 'wang',
    '寝': 'qin', '室': 'shi', '公': 'gong', '共': 'gong', '卫': 'wei', '生': 'sheng',
    '维': 'wei', '护': 'hu', '维': 'wei', '修': 'xiu', '清': 'qing', '洁': 'jie',
    '洗': 'xi', '衣': 'yi', '热': 're', '水': 'shui', '冷': 'leng', '气': 'qi',
    '空': 'kong', '调': 'tiao', '电': 'dian', '话': 'hua', '设': 'she', '备': 'bei'
  }
  
  let code = ''
  for (const char of trimmedName) {
    if (pinyinMap[char]) {
      code += pinyinMap[char]
    } else if (/[a-zA-Z]/.test(char)) {
      code += char.toLowerCase()
    } else if (/[0-9]/.test(char)) {
      code += char
    } else if (/[\u4e00-\u9fa5]/.test(char)) {
      code += 'x'
    } else {
      code += '_'
    }
  }
  
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase()
  return `FEE_${code.toUpperCase()}_${timestamp}`
}

watch(() => formData.value.name, (newName, oldName) => {
  if (!isEdit.value && newName && newName !== oldName) {
    formData.value.code = generateCodeFromName(newName)
    console.log('📝 自动生成编码:', formData.value.code)
  }
}, { immediate: false })

// 加载费用类型列表
const loadFeeTypes = async () => {
  loading.value = true
  try {
    const params: FeeTypeQueryParams = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchForm.value.name || undefined,
      status: searchForm.value.status || undefined
    }
    const response = await feeApi.getFeeTypeList(params)
    tableData.value = response.list
    total.value = response.pagination.total
  } catch (error: any) {
    console.error('加载费用类型列表失败:', error)
    ElMessage.error(error.message || '加载费用类型列表失败')
  } finally {
    loading.value = false
  }
}

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
    case 'none':
      return '不分摊'
    default:
      return '未知'
  }
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索费用类型:', searchForm.value)
  currentPage.value = 1
  loadFeeTypes()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    name: '',
    status: ''
  }
  currentPage.value = 1
  loadFeeTypes()
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = async (row: FeeType) => {
  loading.value = true
  try {
    const response = await feeApi.getFeeTypeDetail(row.id)
    detailData.value = response.feeType
    detailDialogVisible.value = true
    nextTick(() => {
      initUsageChart()
    })
  } catch (error: any) {
    console.error('获取费用类型详情失败:', error)
    ElMessage.error(error.message || '获取费用类型详情失败')
  } finally {
    loading.value = false
  }
}

// 初始化使用统计图表
const initUsageChart = () => {
  if (usageChartRef.value) {
    // 检查是否已存在实例，如果存在则销毁
    if (usageChart) {
      usageChart.dispose()
      usageChart = null
    }
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
  formData.value = {
    id: 0,
    name: '',
    code: '',
    description: '',
    defaultAmount: 0,
    billingCycle: 'one-time',
    allocationRule: 'average',
    sortOrder: tableData.value.length > 0 ? Math.max(...tableData.value.map(item => item.sortOrder || 0)) + 1 : 1,
    status: 'enabled'
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: FeeType) => {
  dialogTitle.value = '编辑费用类型'
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: FeeType) => {
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
    
    loading.value = true
    await feeApi.deleteFeeType(row.id)
    ElMessage.success('费用类型删除成功')
    loadFeeTypes()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除费用类型失败:', error)
      ElMessage.error(error.message || '删除费用类型失败')
    }
  } finally {
    loading.value = false
  }
}

// 状态变更
const handleStatusChange = async (row: FeeType) => {
  try {
    await feeApi.updateFeeTypeStatus(row.id, row.status)
    ElMessage.success(`费用类型"${row.name}"状态已更新`)
    loadFeeTypes()
  } catch (error: any) {
    console.error('更新状态失败:', error)
    row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
    ElMessage.error(error.message || '更新状态失败')
  }
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
const handleAnalyze = (row: FeeType) => {
  handleView(row)
}

// 提交表单
const submitForm = async () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        // 转换数据格式：将驼峰命名转换为下划线命名（后端期望的格式）
        const transformData = {
          name: String(formData.value.name || '').trim(),
          code: String(formData.value.code || '').trim(),
          description: String(formData.value.description || '').trim(),
          default_amount: Number(formData.value.defaultAmount) || 0,
          billing_cycle: formData.value.billingCycle || 'one-time',
          allocation_rule: formData.value.allocationRule || 'none',
          sort_order: Number(formData.value.sortOrder) || 0,
          status: formData.value.status || 'enabled'
        }
        
        console.log('📤 提交数据:', JSON.stringify(transformData))
        
        if (isEdit.value) {
          await feeApi.updateFeeType(formData.value.id!, transformData)
          ElMessage.success('费用类型编辑成功')
        } else {
          await feeApi.createFeeType(transformData)
          ElMessage.success('费用类型新增成功')
        }
        dialogVisible.value = false
        loadFeeTypes()
      } catch (error: any) {
        console.error('保存费用类型失败:', error)
        ElMessage.error(error.message || '保存费用类型失败')
      } finally {
        loading.value = false
      }
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  loadFeeTypes()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadFeeTypes()
}

// 导入
const handleImport = () => {
  fileList.value = []
  selectedFile.value = null
  importDialogVisible.value = true
}

// 导出
const handleExport = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要导出所有费用类型数据吗？',
      '导出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    const response = await feeApi.exportFeeTypes({
      status: searchForm.value.status || undefined,
      search: searchForm.value.name || undefined
    })
    
    const blob = response.data
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fee-types-${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('费用类型数据导出成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('导出失败:', error)
      ElMessage.error(error.message || '导出费用类型数据失败')
    }
  } finally {
    loading.value = false
  }
}

// 文件变化处理
const handleFileChange = (file: any) => {
  console.log('📁 文件变化:', file)
  selectedFile.value = file.raw
}

// 提交导入
const submitImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  
  loading.value = true
  try {
    await feeApi.importFeeTypes(selectedFile.value)
    ElMessage.success('费用类型数据导入成功')
    importDialogVisible.value = false
    loadFeeTypes()
  } catch (error: any) {
    console.error('导入失败:', error)
    ElMessage.error(error.message || '导入费用类型数据失败')
  } finally {
    loading.value = false
  }
}

// 组件挂载
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
  loadFeeTypes()
  console.log('💰 费用类型管理页面加载完成')
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (usageChart) {
    usageChart.dispose()
    usageChart = null
  }
})

// 统一处理窗口大小变化
const handleResize = () => {
  checkMobile()
  if (usageChart) {
    usageChart.resize()
  }
}

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

/* 响应式样式 */
.card-header.is-mobile {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.card-header.is-mobile .header-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.card-header.is-mobile .header-actions .el-button {
  flex: 1;
  margin-left: 0;
  margin-right: 8px;
}

.card-header.is-mobile .header-actions .el-button:last-child {
  margin-right: 0;
}

.search-bar.is-mobile {
  margin-bottom: 15px;
}

.responsive-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.is-mobile .form-buttons {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.is-mobile .form-buttons .el-button {
  flex: 1;
}

.mobile-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.status-cell {
  display: flex;
  align-items: center;
}

:deep(.el-dialog.is-fullscreen) {
  display: flex;
  flex-direction: column;
}

:deep(.el-dialog.is-fullscreen .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

@media (max-width: 768px) {
  .el-descriptions {
    padding: 0;
  }
}
</style>