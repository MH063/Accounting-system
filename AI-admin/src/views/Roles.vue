<template>
  <div class="roles-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleAdd" :size="isMobile ? 'small' : 'default'">新增角色</el-button>
        </div>
      </template>
      
      <el-table :data="tableData" style="width: 100%" :size="isMobile ? 'small' : 'default'">
        <el-table-column prop="id" label="ID" width="80" v-if="!isMobile" />
        <el-table-column prop="name" label="角色名称" :min-width="120" />
        <el-table-column prop="description" label="描述" min-width="150" v-if="!isMobile" />
        <el-table-column prop="createTime" label="创建时间" width="180" v-if="!isMobile" />
        <el-table-column label="操作" :width="isMobile ? 120 : 180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :layout="isMobile ? 'total, prev, next' : 'total, sizes, prev, pager, next, jumper'"
          :total="total"
          :small="isMobile"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const isMobile = ref(false)
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

// 表格数据
const tableData = ref([
  {
    id: 1,
    name: '超级管理员',
    description: '拥有系统所有权限',
    createTime: '2023-01-01 10:00:00'
  },
  {
    id: 2,
    name: '管理员',
    description: '拥有大部分管理权限',
    createTime: '2023-01-02 10:00:00'
  },
  {
    id: 3,
    name: '普通用户',
    description: '基本使用权限',
    createTime: '2023-01-03 10:00:00'
  }
])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 操作方法
const handleAdd = () => {
  ElMessage.success('新增角色功能待实现')
}

const handleEdit = (row: any) => {
  ElMessage.info(`编辑角色: ${row.name}`)
}

const handleDelete = (row: any) => {
  ElMessage.warning(`删除角色: ${row.name}`)
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  ElMessage.info(`每页显示 ${val} 条`)
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  ElMessage.info(`当前页: ${val}`)
}

/**
 * 角色管理页面
 * 展示角色列表和操作功能
 */
</script>

<style scoped>
.roles-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>