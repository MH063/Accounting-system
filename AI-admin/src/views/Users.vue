<template>
  <div class=\"users-container\">
    <el-card>
      <template #header>
        <div class=\"card-header\">
          <span>用户管理</span>
          <el-button type=\"primary\" @click=\"handleAdd\">新增用户</el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class=\"search-bar\">
        <el-input
          v-model=\"searchKeyword\"
          placeholder=\"搜索用户名称或邮箱\"
          style=\"width: 300px;\"
          clearable
          @keyup.enter=\"handleSearch\"
        >
          <template #append>
            <el-button @click=\"handleSearch\">搜索</el-button>
          </template>
        </el-input>
      </div>
      
      <el-table 
        :data=\"tableData\" 
        style=\"width: 100%\" 
        v-loading=\"loading\"
        :empty-text=\"loading ? '加载中...' : '暂无数据'\"
      >
        <el-table-column prop=\"id\" label=\"ID\" width=\"80\" />
        <el-table-column prop=\"username\" label=\"用户名\" />
        <el-table-column prop=\"email\" label=\"邮箱\" />
        <el-table-column prop=\"role\" label=\"角色\" />
        <el-table-column prop=\"status\" label=\"状态\">
          <template #default=\"scope\">
            <el-tag :type=\"scope.row.status === 'active' ? 'success' : 'danger'\">
              {{ scope.row.status === 'active' ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop=\"createdAt\" label=\"创建时间\">
          <template #default=\"scope\">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label=\"操作\" width=\"180\">
          <template #default=\"scope\">
            <el-button size=\"small\" @click=\"handleEdit(scope.row)\">编辑</el-button>
            <el-button size=\"small\" type=\"danger\" @click=\"handleDelete(scope.row)\">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class=\"pagination-container\">
        <el-pagination
          v-model:current-page=\"currentPage\"
          v-model:page-size=\"pageSize\"
          :page-sizes=\"[10, 20, 50, 100]\"
          layout=\"total, sizes, prev, pager, next, jumper\"
          :total=\"total\"
          @size-change=\"handleSizeChange\"
          @current-change=\"handleCurrentChange\"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang=\"ts\">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi } from '../api/user'

// 响应式数据
const tableData = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')

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
      keyword: searchKeyword.value
    })
    
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined
    }
    
    const response = await userApi.getUsers(params)
    console.log('✅ 用户列表响应:', response)
    
    // 处理后端返回的数据结构
    const usersData = response?.users || response?.data || response || []
    const totalCount = response?.total || response?.count || usersData.length
    
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

// 操作方法
const handleAdd = () => {
  ElMessage.info('新增用户功能待实现')
}

const handleEdit = (row: any) => {
  ElMessage.info(编辑用户: )
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      确定要删除用户 \"\" 吗？,
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
watch(searchKeyword, (newValue) => {
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

.search-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-start;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
