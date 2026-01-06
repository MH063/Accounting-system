<template>
  <div class="users-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleAdd" :icon="Plus">
              {{ isMobile ? '' : '新增用户' }}
            </el-button>
            <el-dropdown @command="handleExportCommand">
              <el-button :icon="isMobile ? '' : 'Download'">
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
      
      <!-- 搜索和筛选 -->
      <div class="search-section">
        <el-form :model="searchForm" inline class="search-form">
          <div class="search-row">
            <el-form-item label="关键字" class="keyword-item">
              <el-input
                v-model="searchForm.keyword"
                placeholder="搜索用户名/邮箱/手机号"
                clearable
                @keyup.enter="handleSearch"
                class="keyword-input"
              />
            </el-form-item>

            <el-form-item label="角色">
              <el-select v-model="searchForm.role" placeholder="角色" clearable class="filter-item">
                <el-option label="管理员" value="admin" />
                <el-option label="普通用户" value="user" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="状态" clearable class="filter-item">
                <el-option label="激活" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="寝室" v-if="!isMobile || showMoreFilters">
              <el-input
                v-model="searchForm.dormitory"
                placeholder="请输入寝室号"
                clearable
                class="filter-item dormitory-input"
              />
            </el-form-item>

            <div class="action-buttons">
              <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
              <el-button @click="handleReset" :icon="Refresh">重置</el-button>
              <el-button 
                v-if="isMobile" 
                type="primary" 
                link 
                @click="showMoreFilters = !showMoreFilters"
                class="more-btn"
              >
                {{ showMoreFilters ? '收起' : '更多' }}
                <el-icon class="el-icon--right">
                  <component :is="showMoreFilters ? 'ArrowUp' : 'ArrowDown'" />
                </el-icon>
              </el-button>
            </div>
          </div>
        </el-form>
      </div>
      
      <!-- 批量操作 -->
      <div class="batch-actions" :class="{ 'is-mobile': isMobile }">
        <el-button type="primary" :disabled="selectedUsers.length === 0" @click="handleBatchEnable">
          {{ isMobile ? '启用' : '批量启用' }}
        </el-button>
        <el-button type="warning" :disabled="selectedUsers.length === 0" @click="handleBatchDisable">
          {{ isMobile ? '禁用' : '批量禁用' }}
        </el-button>
        <el-button type="danger" :disabled="selectedUsers.length === 0" @click="handleBatchDelete">
          {{ isMobile ? '删除' : '批量删除' }}
        </el-button>
      </div>
      
      <div class="table-wrapper">
        <el-table 
          :data="tableData" 
          style="width: 100%" 
          v-loading="loading"
          :size="isMobile ? 'small' : 'default'"
          :empty-text="loading ? '加载中...' : '暂无数据'"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" header-align="center" />
          <el-table-column prop="id" label="ID" width="80" v-if="!isMobile" align="center" header-align="center" />
          <el-table-column prop="username" label="用户名" width="150" show-overflow-tooltip align="center" header-align="center" />
          <el-table-column prop="email" label="邮箱" width="250" v-if="!isMobile" show-overflow-tooltip align="center" header-align="center" />
          <el-table-column prop="role" label="角色" width="140" align="center" header-align="center">
            <template #default="scope">
              <el-tag 
                :type="scope.row.role === 'admin' ? 'danger' : 'info'" 
                effect="light"
                round
                class="role-tag"
              >
                <el-icon v-if="scope.row.role === 'admin'"><Avatar /></el-icon>
                <el-icon v-else><User /></el-icon>
                {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="dormitory" label="寝室" width="120" align="center" header-align="center">
            <template #default="scope">
              <span class="dormitory-text">{{ scope.row.dormitory || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120" align="center" header-align="center">
            <template #default="scope">
              <el-tag 
                :type="scope.row.status === 'active' ? 'success' : 'info'" 
                size="small"
                effect="dark"
                class="status-tag"
              >
                <span class="dot" :class="scope.row.status"></span>
                {{ scope.row.status === 'active' ? '激活' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" :width="isMobile ? 120 : 260" fixed="right" align="center" header-align="center">
            <template #default="scope">
              <div class="table-operations">
                <el-button size="small" link type="primary" @click="handleView(scope.row)" :icon="View" class="op-btn">
                  {{ isMobile ? '' : '查看' }}
                </el-button>
                <el-button size="small" link type="primary" @click="handleEdit(scope.row)" :icon="Edit" class="op-btn">
                  {{ isMobile ? '' : '编辑' }}
                </el-button>
                <el-button size="small" link type="danger" @click="handleDelete(scope.row)" :icon="Delete" class="op-btn">
                  {{ isMobile ? '' : '删除' }}
                </el-button>
              </div>
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

    <!-- 新增用户对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增用户"
      :width="isMobile ? '95%' : '600px'"
      :fullscreen="isMobile"
      :close-on-click-modal="false"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        :label-width="isMobile ? '80px' : '100px'"
        :label-position="isMobile ? 'top' : 'left'"
        v-loading="addLoading"
      >
        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="addForm.username" placeholder="请输入用户名" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="addForm.email" placeholder="请输入邮箱地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="addForm.phone" placeholder="请输入手机号" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="addForm.role" placeholder="请选择角色" style="width: 100%;">
                <el-option label="管理员" value="admin" />
                <el-option label="普通用户" value="user" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="初始密码" prop="password">
              <el-input
                v-model="addForm.password"
                type="password"
                placeholder="请输入初始密码"
                show-password
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="addForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                show-password
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="寝室号" prop="dormitory">
              <el-input v-model="addForm.dormitory" placeholder="请输入寝室号（可选）" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="addForm.status" placeholder="请选择状态" style="width: 100%;">
                <el-option label="激活" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注信息" prop="remark">
          <el-input
            v-model="addForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelAdd">取消</el-button>
          <el-button type="primary" @click="handleSubmitAdd" :loading="addLoading">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { userApi, systemApi } from '@/api/user'
import { Search, Refresh, Plus, View, Edit, Delete, Download, ArrowDown, ArrowUp } from '@element-plus/icons-vue'

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

// 导入分页管理工具
import { createPaginationManager } from '@/utils/paginationHelper'

// 路由器实例
const router = useRouter()

// 创建分页管理器
const { paginationState, dataList, loadData, handleSizeChange: pagerHandleSizeChange, handleCurrentChange: pagerHandleCurrentChange, refresh } = createPaginationManager<any>(
  async (params) => {
    console.log('📡 [Users View] 发送获取用户列表请求:', params)
    const response = await userApi.getUsers(params)
    console.log('👥 [Users View] 获取用户列表原始响应:', response)
    
    // 根据规则 5 和拦截器逻辑，response 应该是 resData.data
    // 我们预期的结构是 { users: [], total: number }
    
    let usersData: any[] = []
      let totalCount = 0
      
      if (response && typeof response === 'object') {
      // 兼容多种返回结构
      usersData = response.users || response.data?.users || (Array.isArray(response) ? response : [])
      totalCount = response.total || response.count || response.data?.total || (Array.isArray(usersData) ? usersData.length : 0)
    }

    usersData = usersData.map((u: any) => {
        // 辅助函数：判断是否为有效值（排除空对象）
        const getValid = (v: any) => {
          if (v === null || v === undefined || v === '') return null;
          if (typeof v === 'object' && !(v instanceof Date) && Object.keys(v).length === 0) return null;
          return v;
        };

        const item = {
          ...u,
          // 极致兜底映射
          createdAt: getValid(u.createdAt) || getValid(u.created_at) || getValid(u.createdTime) || null,
          lastLoginTime: getValid(u.lastLoginTime) || getValid(u.last_login_at) || getValid(u.lastLogin) || null
        };
        
        return item;
      });
    
    return {
      data: usersData,
      total: totalCount
    }
  }
)

// 响应式数据
const tableData = dataList
const loading = computed(() => paginationState.value.loading)
const currentPage = computed({
  get: () => paginationState.value.currentPage,
  set: (val) => {
    paginationState.value.currentPage = val
  }
})
const pageSize = computed({
  get: () => paginationState.value.pageSize,
  set: (val) => {
    paginationState.value.pageSize = val
  }
})
const total = computed(() => paginationState.value.total)
const selectedUsers = ref<any[]>([])

// 搜索表单
const searchForm = ref({
  keyword: '',
  role: '',
  status: '',
  dormitory: ''
})

// 新增用户相关
const addDialogVisible = ref(false)
const addLoading = ref(false)
const addFormRef = ref()
const addForm = ref({
  username: '',
  email: '',
  phone: '',
  role: '',
  password: '123456',
  confirmPassword: '123456',
  dormitory: '',
  status: 'active',
  remark: ''
})

// 新增用户表单验证规则
const addFormRules = {
  username: commonRules.username,
  email: commonRules.email,
  phone: commonRules.phone,
  role: commonRules.role,
  password: commonRules.password,
  confirmPassword: commonRules.confirmPassword(() => addForm.value.password),
  status: commonRules.status
}

// 格式化日期 (V6 - 终极修复版)
const formatDate = (val: any) => {
  // 1. 立即处理空值
  if (val === null || val === undefined || val === '') {
    return '-'
  }

  // 2. 尝试解析
  let date: Date | null = null

  try {
    if (val instanceof Date) {
      date = val
    } else if (typeof val === 'string') {
      // 移除可能存在的空白字符
      const cleanStr = val.trim()
      if (!cleanStr) return '-'
      date = new Date(cleanStr)
      
      // 如果解析失败，尝试手动解析 ISO 格式 (YYYY-MM-DDTHH:mm:ss...)
      if (isNaN(date.getTime()) && cleanStr.includes('T')) {
        const parts = cleanStr.split(/[T.+]/)
        if (parts.length >= 2) {
          const dateParts = parts[0].split('-')
          const timeParts = parts[1].split(':')
          if (dateParts.length === 3 && timeParts.length >= 2) {
            date = new Date(
              parseInt(dateParts[0]),
              parseInt(dateParts[1]) - 1,
              parseInt(dateParts[2]),
              parseInt(timeParts[0]),
              parseInt(timeParts[1]),
              timeParts[2] ? parseInt(timeParts[2]) : 0
            )
          }
        }
      }
    } else if (typeof val === 'number') {
      date = new Date(val)
    } else if (typeof val === 'object') {
      // 处理可能的 Proxy 或包装对象
      const realVal = val.value || val.timestamp || val.time || (typeof val.valueOf === 'function' ? val.valueOf() : null)
      if (realVal) {
        date = new Date(realVal)
      }
    }
  } catch (e) {
    // 解析失败静默处理
  }

  // 3. 最终校验
  if (!date || isNaN(date.getTime())) {
    // 如果解析彻底失败，但原始值是字符串且包含日期特征，尝试简单截取
    if (typeof val === 'string' && val.includes('-')) {
      return val.replace('T', ' ').split('.')[0]
    }
    return '-'
  }

  // 4. 格式化输出 (YYYY-MM-DD HH:mm:ss)
  try {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
  } catch (e) {
    return typeof val === 'string' ? val : '-'
  }
}

// 加载用户列表
const loadUsers = async (useCache = true) => {
  const params = {
    ...searchForm.value
  }
  
  if (!useCache) {
    return refresh(params)
  }
  
  const result = await loadData(params, useCache)
  
  if (dataList.value.length > 0) {
    const firstUser = dataList.value[0]
    console.log('🔍 [Users View] 第一条用户数据详细检查:', {
      id: firstUser.id,
      username: firstUser.username,
      // 检查字段名是否存在，是否拼写错误
      createdAt: firstUser.createdAt,
      lastLoginTime: firstUser.lastLoginTime,
      // 检查原始字段名（防止映射失败）
      created_at: firstUser.created_at,
      last_login_at: firstUser.last_login_at,
      // 检查所有键
      allKeys: Object.keys(firstUser)
    })
  }
  
  return result
}

// 搜索用户
const handleSearch = async () => {
  currentPage.value = 1 // 重置到第一页
  await loadUsers(false)
}

// 重置搜索
const handleReset = async () => {
  searchForm.value = {
    keyword: '',
    role: '',
    status: '',
    dormitory: ''
  }
  currentPage.value = 1
  await loadUsers(false)
}

// 操作方法
const handleAdd = () => {
  addDialogVisible.value = true
  resetAddForm()
}

const resetAddForm = () => {
  addForm.value = {
    username: '',
    email: '',
    phone: '',
    role: '',
    password: '123456',
    confirmPassword: '123456',
    dormitory: '',
    status: 'active',
    remark: ''
  }
  if (addFormRef.value) {
    addFormRef.value.clearValidate()
  }
}

const handleCancelAdd = () => {
  addDialogVisible.value = false
  resetAddForm()
}

const handleSubmitAdd = async () => {
  if (!addFormRef.value) return
  
  try {
    await addFormRef.value.validate()
    addLoading.value = true
    
    console.log('🔄 创建用户:', addForm.value)
    
    // 准备提交数据
    const submitData = {
      username: addForm.value.username,
      email: addForm.value.email,
      phone: addForm.value.phone,
      role: addForm.value.role,
      password: addForm.value.password,
      dormitory: addForm.value.dormitory,
      status: addForm.value.status,
      remark: addForm.value.remark
    }
    
    const response = await userApi.createUser(submitData)
    console.log('✅ 用户创建成功:', response)
    
    // 检查API响应结构
    if (response) {
      ElMessage.success('用户创建成功')
      addDialogVisible.value = false
      resetAddForm()
      
      // 刷新用户列表
      await loadUsers(false)
    } else {
      ElMessage.error('创建用户失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 创建用户失败:', error)
      ElMessage.error('创建用户失败')
    }
  } finally {
    addLoading.value = false
  }
}

const handleView = (row: any) => {
  router.push(`/user-detail/${row.id}`)
}

const handleEdit = (row: any) => {
  router.push({
    path: `/user-detail/${row.id}`,
    query: { mode: 'edit' }
  })
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
    await loadUsers(false)
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除用户失败:', error)
      const errorMsg = error.response?.data?.message || '删除用户失败'
      ElMessage.error(errorMsg)
    }
  }
}

// 批量操作
const handleSelectionChange = (selection: any[]) => {
  selectedUsers.value = selection
}

const handleBatchEnable = async () => {
  if (selectedUsers.value.length === 0) return
  
  try {
    const ids = selectedUsers.value.map(u => u.id)
    await userApi.batchEnableUsers(ids)
    
    ElMessage.success('用户启用成功')
    // 刷新用户列表
    await loadUsers(false)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 批量启用失败:', error)
    }
  }
}

const handleBatchDisable = async () => {
  if (selectedUsers.value.length === 0) return
  
  try {
    const ids = selectedUsers.value.map(u => u.id)
    await userApi.batchDisableUsers(ids)
    
    ElMessage.success('用户禁用成功')
    // 刷新用户列表
    await loadUsers(false)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 批量禁用失败:', error)
    }
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
    await loadUsers(false)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 批量删除用户失败:', error)
      // 如果拦截器已经处理过错误（通过 Promise.reject(new Error(msg))），
      // 则 error.message 就是错误消息。如果是网络错误，则可能有 error.response
      const errorMsg = error.message || '批量删除操作失败'
      // 避免重复显示相同消息 (拦截器可能已经显示过一次)
      // 但为了稳妥，如果不是 cancel，我们至少记录日志
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
    const blob = new Blob([response], { type: command === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' })
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
  // 强制不使用缓存加载第一次数据，确保看到真实的数据库数据
  loadUsers(false)
})

/**
 * 用户管理页面
 * 展示用户列表和操作功能
 */
</script>

<style scoped>
/* 页面整体容器 */
.users-container {
  width: 100%;
  padding: 0;
}

:deep(.el-card) {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.card-header span {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  position: relative;
  padding-left: 12px;
}

.card-header span::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: var(--el-color-primary);
  border-radius: 2px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions .el-button {
  box-shadow: 0 2px 6px 0 rgba(var(--el-color-primary-rgb), 0.2);
  transition: all 0.3s;
}

.header-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px 0 rgba(var(--el-color-primary-rgb), 0.3);
}

/* 搜索表单优化 */
.search-section {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.search-section:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.search-form {
  margin-bottom: 0;
}

.search-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.keyword-item {
  margin-bottom: 0 !important;
}

/* 搜索框、下拉框背景与边框强化 */
.keyword-input :deep(.el-input__wrapper),
.filter-item :deep(.el-select__wrapper),
.filter-item :deep(.el-input__wrapper),
.dormitory-input :deep(.el-input__wrapper) {
  background-color: #ffffff !important;
  border: 1px solid #dcdfe6 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.keyword-input :deep(.el-input__inner),
.filter-item :deep(.el-input__inner),
.filter-item :deep(.el-select__selected-item),
.dormitory-input :deep(.el-input__inner) {
  color: #303133 !important;
  text-align: center !important; /* 文字水平居中 */
}

.keyword-input :deep(.el-input__inner::placeholder),
.filter-item :deep(.el-input__inner::placeholder),
.filter-item :deep(.el-select__placeholder),
.dormitory-input :deep(.el-input__inner::placeholder) {
  color: #909399 !important;
  text-align: center !important; /* 占位符文字水平居中 */
}

.keyword-input :deep(.el-input__wrapper):hover,
.filter-item :deep(.el-select__wrapper):hover,
.filter-item :deep(.el-input__wrapper):hover,
.dormitory-input :deep(.el-input__wrapper):hover {
  border-color: #c0c4cc !important;
}

.keyword-input :deep(.el-input__wrapper.is-focus),
.filter-item :deep(.el-select__wrapper.is-focused),
.filter-item :deep(.el-input__wrapper.is-focus),
.dormitory-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary) !important;
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.1) !important;
}

.keyword-input {
  width: 260px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.filter-item {
  width: 130px;
}

.dormitory-input {
  width: 150px;
}

.more-btn {
  margin-left: 0;
  font-weight: 500;
}

:deep(.el-form-item) {
  margin-bottom: 0 !important;
  margin-right: 0 !important;
  display: flex;
  align-items: center;
}

/* 统一搜索框、下拉框和按钮的高度 */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-button) {
  height: 36px !important;
  box-sizing: border-box !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.el-select__wrapper) {
  padding: 0 12px !important;
  display: flex !important;
  justify-content: center !important; /* 下拉框内容容器居中 */
}

:deep(.el-select__placeholder) {
  text-align: center !important;
  width: 100% !important;
}

:deep(.el-select__selected-item) {
  text-align: center !important;
  justify-content: center !important;
  width: 100% !important;
}

:deep(.el-form-item__content) {
  display: flex !important;
  align-items: center !important;
  line-height: 1 !important;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #606266;
  padding-right: 12px;
  width: 80px; /* 固定宽度以确保中心对齐 */
  display: inline-flex;
  justify-content: center; /* 中心对齐 */
  align-items: center;
  text-align: center;
  height: 36px !important; /* 与输入框高度一致 */
  line-height: 36px !important;
}

/* 针对两字和三字标签的特殊处理，确保中心点一致 */
:deep(.el-form-item__label) {
  letter-spacing: 0;
  white-space: nowrap;
}

/* 表格美化 */
.table-wrapper {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f2f5;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.el-table) {
  --el-table-header-bg-color: #f8f9fa;
  --el-table-row-hover-bg-color: #f5f7fa;
}

:deep(.el-table__header-wrapper th) {
  font-weight: 700;
  color: #303133;
  height: 50px;
}

/* 表头标签中心点对齐优化 */
:deep(.el-table__header .cell) {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 3em; /* 基于三字宽度计算 */
}

:deep(.el-table__row) {
  height: 60px;
  transition: background-color 0.3s;
}

.role-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  font-weight: 500;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border: none;
  font-weight: 600;
  border-radius: 20px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.dot.active {
  background-color: #fff;
  box-shadow: 0 0 4px #fff;
}

.dormitory-text {
  color: #606266;
  font-weight: 500;
}

.table-operations {
  display: flex;
  justify-content: center; /* 确保操作按钮组整体居中 */
  align-items: center;
  gap: 16px; /* 增加间距使布局更舒展 */
  width: 100%;
}

.op-btn {
  margin: 0 !important; /* 覆盖Element Plus默认边距 */
  padding: 4px 8px !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.op-btn:hover {
  transform: scale(1.05);
}

/* 调试辅助线 (生产环境请注释掉) 
:deep(.el-form-item__label),
:deep(.el-table__header .cell) {
  background: rgba(64, 158, 255, 0.1);
  position: relative;
}
:deep(.el-form-item__label)::after,
:deep(.el-table__header .cell)::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 0, 0, 0.5);
  z-index: 10;
}
*/

/* 批量操作按钮组 */
.batch-actions {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.batch-actions .el-button {
  border-radius: 8px;
  font-weight: 500;
}

/* 分页美化 */
.pagination-container {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination) {
  --el-pagination-button-bg-color: #f4f4f5;
  --el-pagination-hover-color: var(--el-color-primary);
}

:deep(.el-pagination.is-background .el-pager li:not(.is-active)) {
  background-color: #f4f4f5;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  box-shadow: 0 2px 8px 0 rgba(var(--el-color-primary-rgb), 0.3);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: row;
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

  .search-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .keyword-item {
    width: 100%;
  }

  .keyword-input {
    width: 100% !important;
  }

  .action-buttons {
    width: 100%;
    margin-left: 0;
    justify-content: space-between;
  }

  .action-buttons :deep(.el-button) {
    flex: 1;
  }

  .table-operations {
    gap: 8px !important; /* 移动端减小按钮间距 */
  }

  .filter-item {
    flex: 1;
    min-width: calc(50% - 8px);
  }

  .dormitory-input {
    min-width: 100%;
  }

  .more-btn {
    width: 100%;
    justify-content: center;
    margin-top: 4px;
  }

  :deep(.el-form-item__label) {
    display: none; /* 移动端隐藏标签节省空间 */
  }
}
</style>