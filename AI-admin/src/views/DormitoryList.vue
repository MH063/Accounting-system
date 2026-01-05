<template>
  <div class="dormitory-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>寝室列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="goToCreateDormitory" :icon="Plus">
              {{ isMobile ? '' : '新增寝室' }}
            </el-button>
            <el-dropdown @command="handleExportCommand">
              <el-button :icon="Download">
                {{ isMobile ? '导出' : '导出数据' }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
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
      <el-row :gutter="isMobile ? 10 : 20" class="stats-container">
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon :size="isMobile ? 24 : 30" color="#409EFF"><House /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">总寝室</div>
              <div class="stat-value">{{ stats.total }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon :size="isMobile ? 24 : 30" color="#67C23A"><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">正常</div>
              <div class="stat-value">{{ stats.normal }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon :size="isMobile ? 24 : 30" color="#E6A23C"><Tools /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">维修中</div>
              <div class="stat-value">{{ stats.maintenance }}</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon :size="isMobile ? 24 : 30" color="#F56C6C"><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">已满</div>
              <div class="stat-value">{{ stats.full }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
      
      <!-- 搜索和筛选 -->
      <el-form :model="searchForm" :label-width="isMobile ? '80px' : '80px'" :inline="!isMobile" class="search-bar responsive-search-form">
        <el-row :gutter="isMobile ? 10 : 20">
          <el-col :xs="24" :sm="6">
            <el-form-item label="寝室号">
              <el-input v-model="searchForm.dormNumber" placeholder="请输入寝室号" clearable style="width: 100%" />
            </el-form-item>
          </el-col>
          
          <template v-if="!isMobile || showMoreFilters">
            <el-col :xs="12" :sm="6">
              <el-form-item label="楼栋">
                <el-select v-model="searchForm.building" placeholder="请选择楼栋" clearable style="width: 100%">
                  <el-option v-for="building in buildings" :key="building" :label="building" :value="building" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :xs="12" :sm="6">
              <el-form-item label="状态">
                <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 100%">
                  <el-option label="正常" value="normal" />
                  <el-option label="维修中" value="maintenance" />
                  <el-option label="已满" value="full" />
                </el-select>
              </el-form-item>
            </el-col>
          </template>
          
          <el-col :xs="24" :sm="6" class="search-buttons">
            <div class="search-actions">
              <el-button type="primary" @click="handleSearch" :icon="Search" :class="{ 'flex-1': isMobile }">查询</el-button>
              <el-button @click="handleReset" :icon="Refresh" :class="{ 'flex-1': isMobile }">重置</el-button>
              <el-button 
                v-if="isMobile" 
                type="primary" 
                link 
                @click="showMoreFilters = !showMoreFilters"
              >
                {{ showMoreFilters ? '收起' : '更多' }}
                <el-icon class="el-icon--right">
                  <component :is="showMoreFilters ? 'ArrowUp' : 'ArrowDown'" />
                </el-icon>
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
      
      <!-- 批量操作 -->
      <div class="batch-actions" :class="{ 'is-mobile': isMobile }">
        <el-button-group>
          <el-button type="success" :disabled="selectedDormitories.length === 0" @click="handleBatchNormal">
            {{ isMobile ? '正常' : '批量正常' }}
          </el-button>
          <el-button type="warning" :disabled="selectedDormitories.length === 0" @click="handleBatchMaintenance">
            {{ isMobile ? '维修' : '批量维修' }}
          </el-button>
          <el-button type="danger" :disabled="selectedDormitories.length === 0" @click="handleBatchFull">
            {{ isMobile ? '满员' : '批量满员' }}
          </el-button>
          <el-button type="danger" :disabled="selectedDormitories.length === 0" @click="handleBatchDelete">
            {{ isMobile ? '删除' : '批量删除' }}
          </el-button>
        </el-button-group>
      </div>
      
      <div class="table-wrapper">
        <el-table 
          :data="tableData" 
          style="width: 100%" 
          v-loading="loading"
          :size="isMobile ? 'small' : 'default'"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="id" label="ID" width="70" v-if="!isMobile" />
          <el-table-column prop="dormNumber" label="寝室号" min-width="90" />
          <el-table-column prop="building" label="楼栋" width="90" />
          <el-table-column prop="capacity" label="容量" width="70" v-if="!isMobile" />
          <el-table-column prop="currentOccupancy" label="入住" width="100">
            <template #default="scope">
              <span :class="scope.row.currentOccupancy >= scope.row.capacity ? 'text-danger' : 'text-success'">
                {{ scope.row.currentOccupancy }} / {{ scope.row.capacity }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" min-width="160" v-if="!isMobile">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" :width="isMobile ? 140 : 200" fixed="right">
            <template #default="scope">
              <el-button size="small" link type="primary" @click="handleView(scope.row)">
                {{ isMobile ? '看' : '查看' }}
              </el-button>
              <el-button size="small" link type="primary" @click="handleEdit(scope.row)">
                {{ isMobile ? '改' : '编辑' }}
              </el-button>
              <el-button size="small" link type="warning" @click="handleStatus(scope.row)" v-if="scope.row.status !== 'maintenance'">
                {{ isMobile ? '修' : '维修' }}
              </el-button>
              <el-button size="small" link type="danger" @click="handleDelete(scope.row)">
                {{ isMobile ? '删' : '删除' }}
              </el-button>
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
          :pager-count="isMobile ? 5 : 7"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" :width="isMobile ? '95%' : '500px'" :fullscreen="isMobile">
      <el-form 
        :model="formData" 
        :rules="formRules" 
        ref="formRef" 
        :label-width="isMobile ? '80px' : '100px'"
        :label-position="isMobile ? 'top' : 'left'"
      >
        <el-form-item label="寝室号" prop="dormNumber">
          <el-input v-model="formData.dormNumber" placeholder="请输入寝室号" />
        </el-form-item>
        <el-form-item label="寝室编码" prop="dormCode">
          <el-input v-model="formData.dormCode" placeholder="请输入寝室编码" />
        </el-form-item>
        <el-form-item label="楼栋" prop="building">
          <el-input v-model="formData.building" placeholder="请输入楼栋" />
        </el-form-item>
        
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="formData.capacity" :min="1" :max="20" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="正常" value="normal" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="已满" value="full" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" :rows="3" />
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
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { dormitoryApi } from '../api/dormitory'
import { House, Check, Tools, Warning, Plus, Download, ArrowDown, ArrowUp, Search, Refresh } from '@element-plus/icons-vue'

// 移动端检测
const isMobile = ref(false)
const showMoreFilters = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 导入统一验证规则库
import { commonRules } from '@/utils/validationRules'

// 路由器实例
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
const buildings = ref<string[]>([])

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
  dormCode: '',
  building: '',
  capacity: 4,
  status: 'normal',
  description: ''
})

const formRules = {
  dormNumber: [{ required: true, message: '请输入寝室号', trigger: 'blur' }],
  dormCode: [{ required: true, message: '请输入寝室编码', trigger: 'blur' }],
  building: [{ required: true, message: '请输入楼栋', trigger: 'blur' }],
  capacity: [{ required: true, message: '请输入容量', trigger: 'blur' }]
}

const formRef = ref()

/**
 * 格式化日期
 */
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
      limit: pageSize.value, // 后端使用的是 limit
      search: searchForm.value.dormNumber, // 映射搜索字段
      building: searchForm.value.building,
      status: searchForm.value.status
    }
    
    const response = await dormitoryApi.getDormitoryList(params)
    console.log('✅ 寝室列表响应:', response)
    
    // 处理后端返回的数据结构 (符合规则 5: response.data.data.xxx)
    // 根据拦截器配置，这里 response 已经是后端返回的 response.data.data
    const innerData = response?.data || response
    const dormitoryData = innerData?.dorms || (Array.isArray(innerData) ? innerData : [])
    const paginationInfo = innerData?.pagination
    const totalCount = paginationInfo?.total || (Array.isArray(innerData) ? innerData.length : 0)
    
    tableData.value = dormitoryData
    total.value = totalCount
    
  } catch (error: any) {
    console.error('❌ 加载寝室列表失败:', error)
    ElMessage.error('加载寝室列表失败，请检查网络连接')
    
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 加载统计信息
const loadDormitoryStats = async () => {
  try {
    const response = await dormitoryApi.getDormitoryStats()
    console.log('✅ 统计信息响应:', response)
    
    // 统一处理后端返回的数据结构 (符合规则 5: response.data.data.xxx)
    // 根据拦截器配置，这里 response 应该是后端返回的 response.data.data
    const statsData = response?.data || response
    
    if (statsData) {
      // 兼容两种结构：扁平结构 { total, normal, ... } 和 嵌套结构 { totalCount, statusCounts: { normal, ... } }
      stats.value = {
        total: statsData.total !== undefined ? statsData.total : (statsData.totalCount || 0),
        normal: statsData.normal !== undefined ? statsData.normal : (statsData.statusCounts?.normal || 0),
        maintenance: statsData.maintenance !== undefined ? statsData.maintenance : (statsData.statusCounts?.maintenance || 0),
        full: statsData.full !== undefined ? statsData.full : (statsData.statusCounts?.full || 0)
      }
      console.log('📊 页面更新后的统计数据:', stats.value)
    }
  } catch (error: any) {
    console.error('❌ 加载统计信息失败:', error)
  }
}

// 加载楼栋列表
const loadBuildings = async () => {
  try {
    const response = await dormitoryApi.getBuildings()
    console.log('✅ 楼栋列表响应:', response)
    
    const buildingsData = response?.data || response || []
    buildings.value = Array.isArray(buildingsData) ? buildingsData : []
    
  } catch (error: any) {
    console.error('❌ 加载楼栋列表失败:', error)
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
  formData.value = { 
    id: row.id,
    dormNumber: row.dormNumber,
    dormCode: row.dormCode || row.dormNumber, // 如果没有编码，默认使用寝室号
    building: row.building,
    capacity: row.capacity,
    status: row.status,
    description: row.description || ''
  }
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
    
    // 重新加载寝室列表和统计信息
    loadDormitoryList()
    loadDormitoryStats()
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
    
    // 重新加载数据
    loadDormitoryList()
    loadDormitoryStats()
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
    
    await dormitoryApi.batchUpdateDormitoryStatus(ids, 'normal')
    
    ElMessage.success(`成功设置 ${selectedDormitories.value.length} 个寝室为正常状态`)
    selectedDormitories.value = []
    loadDormitoryList()
    loadDormitoryStats()
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
    
    await dormitoryApi.batchUpdateDormitoryStatus(ids, 'maintenance')
    
    ElMessage.success(`成功设置 ${selectedDormitories.value.length} 个寝室为维修状态`)
    selectedDormitories.value = []
    loadDormitoryList()
    loadDormitoryStats()
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
    
    await dormitoryApi.batchUpdateDormitoryStatus(ids, 'full')
    
    ElMessage.success(`成功设置 ${selectedDormitories.value.length} 个寝室为满员状态`)
    selectedDormitories.value = []
    loadDormitoryList()
    loadDormitoryStats()
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
    loadDormitoryStats()
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
        loadDormitoryStats()
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
  loadDormitoryList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadDormitoryList()
}

// 组件挂载
onMounted(() => {
  console.log('🏠 寝室列表页面加载完成')
  loadDormitoryList()
  loadBuildings()
  loadDormitoryStats()
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

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  margin-right: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

/* 搜索表单自适应 */
.search-bar {
  margin-bottom: 20px;
}

.search-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.search-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.flex-1 {
  flex: 1;
}

/* 批量操作按钮组 */
.batch-actions {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.batch-actions.is-mobile {
  justify-content: space-between;
}

.batch-actions.is-mobile :deep(.el-button-group) {
  display: flex;
  width: 100%;
}

.batch-actions.is-mobile :deep(.el-button) {
  flex: 1;
  padding: 8px 4px;
  font-size: 12px;
}

/* 表格容器，支持横向滚动 */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.text-success {
  color: #67C23A;
}

.text-danger {
  color: #F56C6C;
}

/* 响应式搜索表单 */
.responsive-search-form :deep(.el-form-item) {
  margin-bottom: 15px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .card-header {
    font-size: 14px;
  }
  
  .header-actions {
    display: flex;
    gap: 5px;
  }
  
  :deep(.el-card__header) {
    padding: 10px 15px;
  }
  
  :deep(.el-card__body) {
    padding: 15px 10px;
  }

  .stat-card {
    padding: 10px;
    margin-bottom: 10px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    margin-right: 10px;
  }

  .stat-title {
    font-size: 12px;
  }

  .stat-value {
    font-size: 16px;
  }

  .search-buttons {
    margin-top: 10px;
    justify-content: center;
    width: 100%;
  }

  .search-actions {
    justify-content: space-between;
  }
}
</style>