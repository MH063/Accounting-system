<template>
  <div class="dormitory-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>寝室列表</span>
          <div>
            <el-button type="primary" @click="goToCreateDormitory">新增寝室</el-button>
            <el-dropdown @command="handleExportCommand">
              <el-button>
                导出数据<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="excel">导出Excel</el-dropdown-item>
                  <el-dropdown-item command="csv">导出CSV</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>
      
      <!-- 统计概览 -->
      <el-row :gutter="20" class="stats-container">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="30" color="#409EFF"><House /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">总寝室数</div>
              <div class="stat-value">{{ stats.total }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="30" color="#67C23A"><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">正常状态</div>
              <div class="stat-value">{{ stats.normal }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="30" color="#E6A23C"><Tools /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">维修中</div>
              <div class="stat-value">{{ stats.maintenance }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="30" color="#F56C6C"><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">已满状态</div>
              <div class="stat-value">{{ stats.full }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="寝室号">
            <el-input v-model="searchForm.dormNumber" placeholder="请输入寝室号" clearable />
          </el-form-item>
          
          <el-form-item label="楼栋">
            <el-select v-model="searchForm.building" placeholder="请选择楼栋" clearable style="width: 200px;">
              <el-option v-for="building in buildings" :key="building" :label="building" :value="building" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="正常" value="normal" />
              <el-option label="维修中" value="maintenance" />
              <el-option label="已满" value="full" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 批量操作 -->
      <div class="batch-actions" style="margin-bottom: 10px;">
        <el-button type="success" :disabled="selectedDormitories.length === 0" @click="handleBatchNormal">
          批量正常
        </el-button>
        <el-button type="warning" :disabled="selectedDormitories.length === 0" @click="handleBatchMaintenance">
          批量维修
        </el-button>
        <el-button type="danger" :disabled="selectedDormitories.length === 0" @click="handleBatchFull">
          批量满员
        </el-button>
        <el-button type="danger" :disabled="selectedDormitories.length === 0" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>
      
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="dormNumber" label="寝室号" />
        <el-table-column prop="building" label="楼栋" />
        <el-table-column prop="capacity" label="容量" />
        <el-table-column prop="currentOccupancy" label="当前入住人数">
          <template #default="scope">
            <span :class="scope.row.currentOccupancy >= scope.row.capacity ? 'text-danger' : 'text-success'">
              {{ scope.row.currentOccupancy }} / {{ scope.row.capacity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="warning" @click="handleStatus(scope.row)" v-if="scope.row.status !== 'maintenance'">维修</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="寝室号" prop="dormNumber">
          <el-input v-model="formData.dormNumber" placeholder="请输入寝室号" />
        </el-form-item>
        
        <el-form-item label="楼栋" prop="building">
          <el-input v-model="formData.building" placeholder="请输入楼栋" />
        </el-form-item>
        
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="formData.capacity" :min="1" :max="20" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="正常" value="normal" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="已满" value="full" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { dormitoryApi } from '../api/dormitory'
import { House, Check, Tools, Warning } from '@element-plus/icons-vue'

// 导入统一验证规则库
import { commonRules } from '@/utils/validationRules'// 路由器实例
const router = useRouter()

// 响应式数据
const tableData = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedDormitories = ref<any[]>([])

// 统计信息
const stats = ref({
  total: 0,
  normal: 0,
  maintenance: 0,
  full: 0
})

// 楼栋列表
const buildings = ref<string[]>(['A栋', 'B栋', 'C栋', 'D栋'])

const searchForm = ref({
  dormNumber: '',
  building: '',
  status: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const formData = ref({
  id: 0,
  dormNumber: '',
  building: '',
  capacity: 4,
  status: 'normal',
  description: ''
})

const formRules = {
  dormNumber: commonRules.name,
  building: commonRules.name,
  capacity: commonRules.integer
}

const formRef = ref()// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'normal':
      return 'success'
    case 'maintenance':
      return 'warning'
    case 'full':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'normal':
      return '正常'
    case 'maintenance':
      return '维修中'
    case 'full':
      return '已满'
    default:
      return '未知'
  }
}

// 加载寝室列表
const loadDormitoryList = async () => {
  try {
    loading.value = true
    console.log('🔄 加载寝室列表...', {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    })
    
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    }
    
    const response = await dormitoryApi.getDormitoryList(params)
    console.log('✅ 寝室列表响应:', response)
    
    // 处理后端返回的数据结构 (符合规则 5: response.data.data.xxx)
    // 此时 response 已经是拦截器返回的 response.data
    const innerData = response?.data || response
    const dormitoryData = innerData?.items || (Array.isArray(innerData) ? innerData : [])
    const totalCount = innerData?.total || innerData?.count || (Array.isArray(innerData) ? innerData.length : 0)
    
    tableData.value = dormitoryData
    total.value = totalCount
    
    // 更新统计信息
    updateStats(dormitoryData)
    
  } catch (error: any) {
    console.error('❌ 加载寝室列表失败:', error)
    ElMessage.error('加载寝室列表失败，请检查网络连接')
    
    // 使用空数组作为默认值
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 更新统计信息
const updateStats = (data: any[]) => {
  const total = data.length
  const normal = data.filter(item => item.status === 'normal').length
  const maintenance = data.filter(item => item.status === 'maintenance').length
  const full = data.filter(item => item.status === 'full').length
  
  stats.value = { total, normal, maintenance, full }
}

// 加载楼栋列表
const loadBuildings = async () => {
  try {
    const response = await dormitoryApi.getBuildings()
    console.log('✅ 楼栋列表响应:', response)
    
    // 处理后端返回的数据结构 (符合规则 5: response.data.data.xxx)
    const buildingsData = response?.data || response || []
    buildings.value = Array.isArray(buildingsData) ? buildingsData : []
    
  } catch (error: any) {
    console.error('❌ 加载楼栋列表失败:', error)
    // 使用默认楼栋列表
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
  loadDormitoryList()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    dormNumber: '',
    building: '',
    status: ''
  }
  currentPage.value = 1
  loadDormitoryList()
}

// 查看详情
const handleView = (row: any) => {
  router.push(`/dormitory-detail/${row.id}`)
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑寝室'
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除寝室 "${row.dormNumber}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🗑️ 删除寝室:', row.id)
    await dormitoryApi.deleteDormitory(row.id)
    ElMessage.success('寝室删除成功')
    
    // 重新加载寝室列表
    loadDormitoryList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除寝室失败:', error)
      ElMessage.error('删除寝室失败')
    }
  }
}

// 状态管理
const handleStatus = async (row: any) => {
  try {
    const newStatus = row.status === 'normal' ? 'maintenance' : 'normal'
    const statusText = newStatus === 'maintenance' ? '维修' : '恢复'
    
    await ElMessageBox.confirm(
      `确定要${statusText}寝室 "${row.dormNumber}" 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🔄 更新寝室状态:', row.id, newStatus)
    await dormitoryApi.updateDormitoryStatus(row.id, newStatus)
    ElMessage.success(`寝室${statusText}成功`)
    
    // 重新加载寝室列表
    loadDormitoryList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 更新寝室状态失败:', error)
      ElMessage.error('更新寝室状态失败')
    }
  }
}

// 批量操作
const handleSelectionChange = (selection: any[]) => {
  selectedDormitories.value = selection
}

const handleBatchNormal = async () => {
  if (selectedDormitories.value.length === 0) {
    ElMessage.warning('请至少选择一个寝室')
    return
  }
  
  try {
    const ids = selectedDormitories.value.map(item => item.id)
    console.log('🔄 批量设置正常状态:', ids)
    
    for (const id of ids) {
      await dormitoryApi.updateDormitoryStatus(id, 'normal')
    }
    
    ElMessage.success(`成功设置 ${selectedDormitories.value.length} 个寝室为正常状态`)
    selectedDormitories.value = []
    loadDormitoryList()
  } catch (error: any) {
    console.error('❌ 批量设置正常状态失败:', error)
    ElMessage.error('批量设置正常状态失败')
  }
}

const handleBatchMaintenance = async () => {
  if (selectedDormitories.value.length === 0) {
    ElMessage.warning('请至少选择一个寝室')
    return
  }
  
  try {
    const ids = selectedDormitories.value.map(item => item.id)
    console.log('🔄 批量设置维修状态:', ids)
    
    for (const id of ids) {
      await dormitoryApi.updateDormitoryStatus(id, 'maintenance')
    }
    
    ElMessage.success(`成功设置 ${selectedDormitories.value.length} 个寝室为维修状态`)
    selectedDormitories.value = []
    loadDormitoryList()
  } catch (error: any) {
    console.error('❌ 批量设置维修状态失败:', error)
    ElMessage.error('批量设置维修状态失败')
  }
}

const handleBatchFull = async () => {
  if (selectedDormitories.value.length === 0) {
    ElMessage.warning('请至少选择一个寝室')
    return
  }
  
  try {
    const ids = selectedDormitories.value.map(item => item.id)
    console.log('🔄 批量设置满员状态:', ids)
    
    for (const id of ids) {
      await dormitoryApi.updateDormitoryStatus(id, 'full')
    }
    
    ElMessage.success(`成功设置 ${selectedDormitories.value.length} 个寝室为满员状态`)
    selectedDormitories.value = []
    loadDormitoryList()
  } catch (error: any) {
    console.error('❌ 批量设置满员状态失败:', error)
    ElMessage.error('批量设置满员状态失败')
  }
}

const handleBatchDelete = async () => {
  if (selectedDormitories.value.length === 0) {
    ElMessage.warning('请至少选择一个寝室')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量删除这 ${selectedDormitories.value.length} 个寝室吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedDormitories.value.map(item => item.id)
    console.log('🗑️ 批量删除寝室:', ids)
    
    await dormitoryApi.batchDeleteDormitories(ids)
    ElMessage.success(`成功删除 ${selectedDormitories.value.length} 个寝室`)
    selectedDormitories.value = []
    loadDormitoryList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 批量删除寝室失败:', error)
      ElMessage.error('批量删除寝室失败')
    }
  }
}

// 跳转到创建寝室页面
const goToCreateDormitory = () => {
  router.push('/dormitory/create')
}

// 提交表单
const submitForm = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (isEdit.value) {
          console.log('✏️ 编辑寝室:', formData.value)
          await dormitoryApi.updateDormitory(formData.value.id, formData.value)
          ElMessage.success('寝室编辑成功')
        } else {
          console.log('➕ 新增寝室:', formData.value)
          await dormitoryApi.createDormitory(formData.value)
          ElMessage.success('寝室新增成功')
        }
        dialogVisible.value = false
        loadDormitoryList()
      } catch (error: any) {
        console.error('❌ 提交表单失败:', error)
        ElMessage.error('提交失败')
      }
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
}

// 数据导出
const handleExportCommand = async (command: 'excel' | 'csv') => {
  try {
    ElMessage.info(`正在导出${command === 'excel' ? 'Excel' : 'CSV'}文件...`)
    
    // 这里应该调用实际的导出API
    // 由于没有对应的API，暂时模拟
    const response = {
      data: '模拟的Excel/CSV数据',
      headers: {
        'content-disposition': `attachment; filename="dormitories_${new Date().getTime()}.${command === 'excel' ? 'xlsx' : 'csv'}"`
      }
    }
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: command === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `寝室数据_${new Date().getTime()}.${command === 'excel' ? 'xlsx' : 'csv'}`
    link.click()
    
    // 清理URL对象
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error: any) {
    console.error('❌ 导出失败:', error)
    ElMessage.error('导出失败: ' + (error.message || '未知错误'))
  }
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
  console.log('🏠 寝室列表页面加载完成')
})

/**
 * 寝室列表页面
 * 展示寝室信息列表和操作功能
 */
</script>

<style scoped>
.dormitory-list-container {
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
</style>