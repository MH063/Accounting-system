<template>
  <div class="users-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <div>
            <el-button type="primary" @click="handleAdd">新增用户</el-button>
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
      
      <!-- 搜索和筛选 -->
      <el-form :model="searchForm" label-width="80px" inline class="search-form">
        <el-form-item label="关键字">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索用户名称或邮箱"
            style="width: 200px;"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择角色" clearable style="width: 120px;">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option label="激活" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="寝室">
          <el-input
            v-model="searchForm.dormitory"
            placeholder="请输入寝室号"
            style="width: 120px;"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 批量操作 -->
      <div class="batch-actions" style="margin-bottom: 10px;">
        <el-button type="primary" :disabled="selectedUsers.length === 0" @click="handleBatchEnable">
          批量启用
        </el-button>
        <el-button type="warning" :disabled="selectedUsers.length === 0" @click="handleBatchDisable">
          批量禁用
        </el-button>
        <el-button type="danger" :disabled="selectedUsers.length === 0" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>
      
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        v-loading="loading"
        :empty-text="loading ? '加载中...' : '暂无数据'"
        @selection-change="handleSelectionChange"
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
        <el-table-column prop="dormitory" label="寝室号" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录时间">
          <template #default="scope">
            {{ formatDate(scope.row.lastLoginTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi, systemApi } from '../api/user'
import { useRouter } from 'vue-router'

// 路由器实例
const router = useRouter()

// 响应式数据
const tableData = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15)
const total = ref(0)
const selectedUsers = ref<any[]>([])

// 搜索表单
const searchForm = ref({
  keyword: '',
  role: '',
  status: '',
  dormitory: ''
})

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

// 加载用户列表
const loadUsers = async () => {
  try {
    loading.value = true
    console.log('🔄 开始加载用户列表...', {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    })
    
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    }
    
    const response = await userApi.getUsers(params)
    console.log('✅ 用户列表响应:', response)
    
    // 处理后端返回的数据结构
    const usersData = response?.data?.users || response?.data || []
    const totalCount = response?.data?.total || response?.data?.count || usersData.length
    
    tableData.value = usersData
    total.value = totalCount
    
  } catch (error: any) {
    console.error('❌ 加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败，请检查网络连接')
    
    // 使用空数组作为默认值
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 搜索用户
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
  loadUsers()
}

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    keyword: '',
    role: '',
    status: '',
    dormitory: ''
  }
  currentPage.value = 1
  loadUsers()
}

// 操作方法
const handleAdd = () => {
  ElMessage.info('新增用户功能待实现')
}

const handleView = (row: any) => {
  router.push(`/user-detail/${row.id}`)
}

const handleEdit = (row: any) => {
  router.push(`/user-detail/${row.id}`)
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🔄 删除用户:', row.id)
    await userApi.deleteUser(row.id)
    ElMessage.success('用户删除成功')
    
    // 重新加载用户列表
    loadUsers()
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除用户失败:', error)
      ElMessage.error('删除用户失败')
    }
  }
}

// 批量操作
const handleSelectionChange = (selection: any[]) => {
  selectedUsers.value = selection
}

const handleBatchEnable = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请至少选择一个用户')
    return
  }
  
  try {
    const userIds = selectedUsers.value.map(user => user.id)
    console.log('🔄 批量启用用户:', userIds)
    
    // 调用实际的批量启用API
    await userApi.batchEnableUsers(userIds)
    ElMessage.success(`成功启用 ${selectedUsers.value.length} 个用户`)
    selectedUsers.value = []
    loadUsers()
  } catch (error: any) {
    console.error('❌ 批量启用用户失败:', error)
    ElMessage.error('批量启用用户失败')
  }
}

const handleBatchDisable = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请至少选择一个用户')
    return
  }
  
  try {
    const userIds = selectedUsers.value.map(user => user.id)
    console.log('🔄 批量禁用用户:', userIds)
    
    // 调用实际的批量禁用API
    await userApi.batchDisableUsers(userIds)
    ElMessage.success(`成功禁用 ${selectedUsers.value.length} 个用户`)
    selectedUsers.value = []
    loadUsers()
  } catch (error: any) {
    console.error('❌ 批量禁用用户失败:', error)
    ElMessage.error('批量禁用用户失败')
  }
}

const handleBatchDelete = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请至少选择一个用户')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量删除这 ${selectedUsers.value.length} 个用户吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const userIds = selectedUsers.value.map(user => user.id)
    console.log('🗑️ 批量删除用户:', userIds)
    
    // 调用实际的批量删除API
    await userApi.batchDeleteUsers(userIds)
    ElMessage.success(`成功删除 ${selectedUsers.value.length} 个用户`)
    selectedUsers.value = []
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 批量删除用户失败:', error)
      ElMessage.error('批量删除用户失败')
    }
  }
}

// 数据导出
const handleExportCommand = async (command: 'excel' | 'csv') => {
  try {
    ElMessage.info(`正在导出${command === 'excel' ? 'Excel' : 'CSV'}文件...`)
    
    // 调用导出API
    const response = await systemApi.exportUsers({
      format: command,
      ...searchForm.value
    })
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: command === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `用户数据_${new Date().getTime()}.${command === 'excel' ? 'xlsx' : 'csv'}`
    link.click()
    
    // 清理URL对象
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error: any) {
    console.error('❌ 导出失败:', error)
    ElMessage.error('导出失败: ' + (error.message || '未知错误'))
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
  loadUsers()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadUsers()
}

// 监听搜索关键词变化
watch(() => searchForm.value.keyword, (newValue) => {
  // 如果清空搜索，自动刷新列表
  if (!newValue) {
    currentPage.value = 1
    loadUsers()
  }
})

// 组件挂载时加载数据
onMounted(() => {
  console.log('👥 用户管理页面加载完成')
  loadUsers()
})

/**
 * 用户管理页面
 * 展示用户列表和操作功能
 */
</script>

<style scoped>
.users-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.batch-actions {
  margin-bottom: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>