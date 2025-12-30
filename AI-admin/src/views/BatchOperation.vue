<template>
  <div class="batch-operation-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>批量操作</span>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button @click="loadUsers">刷新数据</el-button>
          </div>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="批量导入" name="import">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>用户数据导入</span>
                <el-button size="small" @click="downloadTemplate">下载模板</el-button>
              </div>
            </template>
            
            <el-alert
              title="导入说明"
              type="info"
              description="请按照指定格式准备Excel文件，支持.xls和.xlsx格式，文件大小不超过10MB"
              show-icon
              closable
              style="margin-bottom: 20px;"
            />
            
            <el-upload
              class="upload-demo"
              drag
              action="/api/users/import"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeUpload"
              accept=".xlsx,.xls"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  xls/xlsx files with a size less than 10MB
                </div>
              </template>
            </el-upload>
            
            <div style="margin-top: 20px;">
              <el-button type="primary" @click="submitImport" :disabled="!selectedFile" :loading="importing">
                {{ importing ? '导入中...' : '开始导入' }}
              </el-button>
              <el-button @click="clearFile" v-if="selectedFile">清除文件</el-button>
            </div>
            
            <!-- 导入结果 -->
            <div v-if="importResult" style="margin-top: 20px;">
              <el-card shadow="never">
                <template #header>
                  <span>导入结果</span>
                </template>
                
                <div class="import-result">
                  <div class="result-summary">
                    <el-tag type="success">成功: {{ importResult.successCount }}</el-tag>
                    <el-tag type="danger">失败: {{ importResult.failedCount }}</el-tag>
                    <el-tag type="warning">跳过: {{ importResult.skipCount }}</el-tag>
                  </div>
                  
                  <div v-if="importResult.errors && importResult.errors.length > 0" class="error-list">
                    <h4>错误详情</h4>
                    <el-table :data="importResult.errors" max-height="300">
                      <el-table-column prop="row" label="行号" width="80" />
                      <el-table-column prop="field" label="字段" width="120" />
                      <el-table-column prop="message" label="错误信息" />
                      <el-table-column prop="data" label="数据" />
                    </el-table>
                  </div>
                </div>
              </el-card>
            </div>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="批量导出" name="export">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>批量导出用户信息</span>
              </div>
            </template>
            
            <el-form :model="exportForm" label-width="120px">
              <el-form-item label="导出格式">
                <el-radio-group v-model="exportForm.format">
                  <el-radio label="excel">Excel (.xlsx)</el-radio>
                  <el-radio label="csv">CSV (.csv)</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="筛选条件">
                <div class="filter-group">
                  <el-input
                    v-model="exportForm.keyword"
                    placeholder="用户名/邮箱"
                    style="width: 200px; margin-right: 10px;"
                    clearable
                  />
                  <el-select v-model="exportForm.role" placeholder="角色" style="width: 120px; margin-right: 10px;" clearable>
                    <el-option label="管理员" value="admin" />
                    <el-option label="普通用户" value="user" />
                  </el-select>
                  <el-select v-model="exportForm.status" placeholder="状态" style="width: 120px;" clearable>
                    <el-option label="激活" value="active" />
                    <el-option label="禁用" value="inactive" />
                  </el-select>
                </div>
              </el-form-item>
              
              <el-form-item label="选择用户">
                <el-button @click="selectAllUsers" :disabled="usersList.length === 0">全选</el-button>
                <el-button @click="clearSelection" :disabled="selectedUsers.length === 0">清空</el-button>
                <span style="margin-left: 10px;">已选择: {{ selectedUsers.length }} / {{ usersList.length }}</span>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="exportUsers" :loading="exporting">
                  {{ exporting ? '导出中...' : '开始导出' }}
                </el-button>
              </el-form-item>
            </el-form>
            
            <el-table 
              :data="usersList" 
              style="width: 100%; margin-top: 20px;"
              @selection-change="handleUsersSelectionChange"
              v-loading="loadingUsers"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="role" label="角色">
                <template #default="scope">
                  <el-tag v-if="scope.row.role === 'admin'" type="success">管理员</el-tag>
                  <el-tag v-else>普通用户</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                    {{ scope.row.status === 'active' ? '激活' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="权限调整" name="permission">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>批量权限调整</span>
              </div>
            </template>
            
            <el-form :model="permissionForm" label-width="120px">
              <el-form-item label="选择用户">
                <el-button @click="selectAllForPermission" :disabled="usersList.length === 0">全选</el-button>
                <el-button @click="clearPermissionSelection" :disabled="selectedPermissionUsers.length === 0">清空</el-button>
                <span style="margin-left: 10px;">已选择: {{ selectedPermissionUsers.length }} / {{ usersList.length }}</span>
              </el-form-item>
              
              <el-form-item label="目标角色">
                <el-select v-model="permissionForm.role" placeholder="请选择角色">
                  <el-option label="管理员" value="admin" />
                  <el-option label="普通用户" value="user" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="confirmBatchPermission" :loading="updatingPermission">
                  {{ updatingPermission ? '更新中...' : '批量调整权限' }}
                </el-button>
              </el-form-item>
            </el-form>
            
            <el-table 
              :data="usersList" 
              style="width: 100%; margin-top: 20px;"
              @selection-change="handlePermissionSelectionChange"
              v-loading="loadingUsers"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="role" label="当前角色">
                <template #default="scope">
                  <el-tag v-if="scope.row.role === 'admin'" type="success">管理员</el-tag>
                  <el-tag v-else>普通用户</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="状态管理" name="status">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>批量状态管理</span>
              </div>
            </template>
            
            <el-form :model="statusForm" label-width="120px">
              <el-form-item label="选择用户">
                <el-button @click="selectAllForStatus" :disabled="usersList.length === 0">全选</el-button>
                <el-button @click="clearStatusSelection" :disabled="selectedStatusUsers.length === 0">清空</el-button>
                <span style="margin-left: 10px;">已选择: {{ selectedStatusUsers.length }} / {{ usersList.length }}</span>
              </el-form-item>
              
              <el-form-item label="目标状态">
                <el-radio-group v-model="statusForm.status">
                  <el-radio label="active">启用</el-radio>
                  <el-radio label="inactive">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="confirmBatchStatus" :loading="updatingStatus">
                  {{ updatingStatus ? '更新中...' : '批量更新状态' }}
                </el-button>
              </el-form-item>
            </el-form>
            
            <el-table 
              :data="usersList" 
              style="width: 100%; margin-top: 20px;"
              @selection-change="handleStatusSelectionChange"
              v-loading="loadingUsers"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="status" label="当前状态">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                    {{ scope.row.status === 'active' ? '激活' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="寝室分配" name="dormitory">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>批量分配寝室</span>
              </div>
            </template>
            
            <el-form :model="dormitoryForm" label-width="120px">
              <el-form-item label="选择用户">
                <el-button @click="selectAllForDormitory" :disabled="usersList.length === 0">全选</el-button>
                <el-button @click="clearDormitorySelection" :disabled="selectedDormitoryUsers.length === 0">清空</el-button>
                <span style="margin-left: 10px;">已选择: {{ selectedDormitoryUsers.length }} / {{ usersList.length }}</span>
              </el-form-item>
              
              <el-form-item label="楼栋">
                <el-select v-model="dormitoryForm.building" placeholder="请选择楼栋" @change="loadFloors">
                  <el-option label="A栋" value="A" />
                  <el-option label="B栋" value="B" />
                  <el-option label="C栋" value="C" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="楼层">
                <el-select v-model="dormitoryForm.floor" placeholder="请选择楼层" @change="loadRooms" :disabled="!dormitoryForm.building">
                  <el-option v-for="floor in floors" :key="floor" :label="`${floor}楼`" :value="floor" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="寝室号">
                <el-select v-model="dormitoryForm.roomNumber" placeholder="请选择寝室号" :disabled="!dormitoryForm.floor">
                  <el-option v-for="room in rooms" :key="room" :label="room" :value="room" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="床位号">
                <el-select v-model="dormitoryForm.bedNumber" placeholder="请选择床位号">
                  <el-option v-for="bed in beds" :key="bed" :label="bed" :value="bed" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="confirmBatchDormitory" :loading="updatingDormitory">
                  {{ updatingDormitory ? '分配中...' : '批量分配寝室' }}
                </el-button>
              </el-form-item>
            </el-form>
            
            <el-table 
              :data="usersList" 
              style="width: 100%; margin-top: 20px;"
              @selection-change="handleDormitorySelectionChange"
              v-loading="loadingUsers"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="dormitory" label="当前寝室">
                <template #default="scope">
                  {{ scope.row.dormitory || '未分配' }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { userApi, systemApi } from '../api/user'
import { validateFile } from '@/utils/fileUploadValidator'

// 路由相关
const router = useRouter()

// 响应式数据
const activeTab = ref('import')
const selectedFile = ref<File | null>(null)

// 导入相关
const importing = ref(false)
const importResult = ref<any>(null)

// 导出相关
const exporting = ref(false)
const exportForm = ref({
  format: 'excel',
  keyword: '',
  role: '',
  status: ''
})
const usersList = ref<any[]>([])
const selectedUsers = ref<any[]>([])
const loadingUsers = ref(false)

// 权限调整相关
const permissionForm = ref({
  role: ''
})
const selectedPermissionUsers = ref<any[]>([])
const updatingPermission = ref(false)

// 状态管理相关
const statusForm = ref({
  status: 'active'
})
const selectedStatusUsers = ref<any[]>([])
const updatingStatus = ref(false)

// 寝室分配相关
const dormitoryForm = ref({
  building: '',
  floor: '',
  roomNumber: '',
  bedNumber: ''
})
const selectedDormitoryUsers = ref<any[]>([])
const updatingDormitory = ref(false)
const floors = ref<number[]>([1, 2, 3, 4, 5, 6])
const rooms = ref<string[]>([])
const beds = ref<string[]>(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'])

// 加载用户列表
const loadUsers = async () => {
  try {
    loadingUsers.value = true
    console.log('🔄 加载用户列表...')
    
    const response = await userApi.getUsers({
      page: 1,
      pageSize: 1000 // 加载更多用户用于批量操作
    })
    console.log('✅ 用户列表响应:', response)
    
    // 处理后端返回的数据结构
    const usersData = response?.users || response || []
    usersList.value = usersData
    
  } catch (error: any) {
    console.error('❌ 加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
    usersList.value = []
  } finally {
    loadingUsers.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 文件上传前验证
const beforeUpload = (file: File) => {
  return validateFile(file, 'excel')
}

// 文件选择处理
const handleFileChange = (file: any) => {
  console.log('📁 选择文件:', file)
  selectedFile.value = file.raw
}

// 上传成功处理
const handleUploadSuccess = (response: any) => {
  console.log('✅ 文件上传成功:', response)
  ElMessage.success('文件上传成功')
  importResult.value = response
}

// 上传失败处理
const handleUploadError = (error: any) => {
  console.error('❌ 文件上传失败:', error)
  ElMessage.error('文件上传失败: ' + (error.message || '未知错误'))
}

// 清除文件
const clearFile = () => {
  selectedFile.value = null
  importResult.value = null
}

// 提交导入
const submitImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  
  try {
    importing.value = true
    console.log('📤 开始导入文件:', selectedFile.value.name)
    
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    const response = await userApi.importUsers(formData)
    console.log('✅ 导入响应:', response)
    
    // 处理导入结果
    const result = response || {}
    importResult.value = {
      successCount: result.successCount || 0,
      failedCount: result.failedCount || 0,
      skipCount: result.skipCount || 0,
      errors: result.errors || []
    }
    
    ElMessage.success(`导入完成! 成功: ${importResult.value.successCount}, 失败: ${importResult.value.failedCount}`)
    
    // 重新加载用户列表
    loadUsers()
    
  } catch (error: any) {
    console.error('❌ 导入失败:', error)
    ElMessage.error('导入失败: ' + (error.message || '未知错误'))
  } finally {
    importing.value = false
  }
}

// 下载模板
const downloadTemplate = async () => {
  try {
    console.log('📥 下载导入模板')
    
    const response = await systemApi.downloadTemplate('user')
    
    // 创建下载链接
    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `用户导入模板_${new Date().getTime()}.xlsx`
    link.click()
    
    // 清理URL对象
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('模板下载成功')
  } catch (error: any) {
    console.error('❌ 下载模板失败:', error)
    ElMessage.error('下载模板失败: ' + (error.message || '未知错误'))
  }
}

// 导出用户数据
const exportUsers = async () => {
  try {
    if (selectedUsers.value.length === 0) {
      ElMessage.warning('请至少选择一个用户')
      return
    }
    
    exporting.value = true
    const userIds = selectedUsers.value.map(user => user.id)
    
    console.log('📤 导出用户数据:', userIds)
    
    const params = {
      format: exportForm.value.format,
      userIds: userIds,
      ...exportForm.value
    }
    
    const response = await systemApi.exportUsers(params)
    
    // 创建下载链接
    const blob = new Blob([response], { 
      type: exportForm.value.format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        : 'text/csv'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `用户数据_${new Date().getTime()}.${exportForm.value.format === 'excel' ? 'xlsx' : 'csv'}`
    link.click()
    
    // 清理URL对象
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error: any) {
    console.error('❌ 导出失败:', error)
    ElMessage.error('导出失败: ' + (error.message || '未知错误'))
  } finally {
    exporting.value = false
  }
}

// 权限调整相关方法
const handlePermissionSelectionChange = (selection: any[]) => {
  selectedPermissionUsers.value = selection
}

const selectAllForPermission = () => {
  selectedPermissionUsers.value = [...usersList.value]
}

const clearPermissionSelection = () => {
  selectedPermissionUsers.value = []
}

const confirmBatchPermission = async () => {
  if (selectedPermissionUsers.value.length === 0) {
    ElMessage.warning('请至少选择一个用户')
    return
  }
  
  if (!permissionForm.value.role) {
    ElMessage.warning('请选择目标角色')
    return
  }
  
  try {
    updatingPermission.value = true
    const userIds = selectedPermissionUsers.value.map(user => user.id)
    
    console.log('🔄 批量调整权限:', userIds, permissionForm.value.role)
    
    await userApi.batchUpdateRoles(userIds, permissionForm.value.role)
    ElMessage.success(`成功为 ${selectedPermissionUsers.value.length} 个用户更新角色`)
    
    // 重新加载用户列表
    loadUsers()
    
  } catch (error: any) {
    console.error('❌ 批量权限调整失败:', error)
    ElMessage.error('批量权限调整失败: ' + (error.message || '未知错误'))
  } finally {
    updatingPermission.value = false
  }
}

// 状态管理相关方法
const handleStatusSelectionChange = (selection: any[]) => {
  selectedStatusUsers.value = selection
}

const selectAllForStatus = () => {
  selectedStatusUsers.value = [...usersList.value]
}

const clearStatusSelection = () => {
  selectedStatusUsers.value = []
}

const confirmBatchStatus = async () => {
  if (selectedStatusUsers.value.length === 0) {
    ElMessage.warning('请至少选择一个用户')
    return
  }
  
  try {
    updatingStatus.value = true
    const userIds = selectedStatusUsers.value.map(user => user.id)
    
    console.log('🔄 批量更新, statusForm.value状态:', userIds.status)
    
    if (statusForm.value.status === 'active') {
      await userApi.batchEnableUsers(userIds)
    } else {
      await userApi.batchDisableUsers(userIds)
    }
    
    ElMessage.success(`成功为 ${selectedStatusUsers.value.length} 个用户更新状态`)
    
    // 重新加载用户列表
    loadUsers()
    
  } catch (error: any) {
    console.error('❌ 批量状态更新失败:', error)
    ElMessage.error('批量状态更新失败: ' + (error.message || '未知错误'))
  } finally {
    updatingStatus.value = false
  }
}

// 寝室分配相关方法
const handleDormitorySelectionChange = (selection: any[]) => {
  selectedDormitoryUsers.value = selection
}

const selectAllForDormitory = () => {
  selectedDormitoryUsers.value = [...usersList.value]
}

const clearDormitorySelection = () => {
  selectedDormitoryUsers.value = []
}

const loadFloors = () => {
  dormitoryForm.value.floor = ''
  dormitoryForm.value.roomNumber = ''
  rooms.value = []
}

const loadRooms = () => {
  dormitoryForm.value.roomNumber = ''
  
  // 模拟房间数据
  if (dormitoryForm.value.building === 'A' && dormitoryForm.value.floor === 1) {
    rooms.value = ['101', '102', '103', '104', '105', '106']
  } else if (dormitoryForm.value.building === 'A' && dormitoryForm.value.floor === 2) {
    rooms.value = ['201', '202', '203', '204', '205', '206']
  } else if (dormitoryForm.value.building === 'B' && dormitoryForm.value.floor === 1) {
    rooms.value = ['101', '102', '103', '104', '105', '106']
  } else {
    rooms.value = []
  }
}

const confirmBatchDormitory = async () => {
  if (selectedDormitoryUsers.value.length === 0) {
    ElMessage.warning('请至少选择一个用户')
    return
  }
  
  if (!dormitoryForm.value.building || !dormitoryForm.value.floor || !dormitoryForm.value.roomNumber) {
    ElMessage.warning('请完整填写寝室信息')
    return
  }
  
  try {
    updatingDormitory.value = true
    const userIds = selectedDormitoryUsers.value.map(user => user.id)
    
    const dormitoryInfo = {
      building: dormitoryForm.value.building,
      floor: dormitoryForm.value.floor,
      roomNumber: dormitoryForm.value.roomNumber,
      bedNumber: dormitoryForm.value.bedNumber
    }
    
    console.log('🔄 批量分配寝室:', userIds, dormitoryInfo)
    
    await userApi.batchAssignDormitory(userIds, dormitoryInfo)
    ElMessage.success(`成功为 ${selectedDormitoryUsers.value.length} 个用户分配寝室`)
    
    // 重新加载用户列表
    loadUsers()
    
  } catch (error: any) {
    console.error('❌ 批量寝室分配失败:', error)
    ElMessage.error('批量寝室分配失败: ' + (error.message || '未知错误'))
  } finally {
    updatingDormitory.value = false
  }
}

// 导出相关选择方法
const handleUsersSelectionChange = (selection: any[]) => {
  selectedUsers.value = selection
}

const selectAllUsers = () => {
  selectedUsers.value = [...usersList.value]
}

const clearSelection = () => {
  selectedUsers.value = []
}

// 组件挂载时加载数据
onMounted(() => {
  console.log('📊 批量操作页面加载完成')
  loadUsers()
})

/**
 * 批量操作页面
 * 支持用户数据的批量导入、导出、权限调整、状态管理和寝室分配
 */
</script>

<style scoped>
.batch-operation-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-demo {
  width: 100%;
}
</style>