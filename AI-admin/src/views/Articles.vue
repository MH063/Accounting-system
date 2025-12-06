<template>
  <div class="articles-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文章管理</span>
          <el-button type="primary" @click="handleAdd">新增文章</el-button>
        </div>
      </template>
      
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author" label="作者" />
        <el-table-column prop="category" label="分类" />
        <el-table-column prop="views" label="浏览量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已发布' ? 'success' : 'warning'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 表格数据
const tableData = ref([
  {
    id: 1,
    title: 'Vue3开发指南',
    author: '张三',
    category: '前端开发',
    views: 1234,
    status: '已发布'
  },
  {
    id: 2,
    title: 'TypeScript入门教程',
    author: '李四',
    category: '编程语言',
    views: 856,
    status: '已发布'
  },
  {
    id: 3,
    title: 'Vite构建工具详解',
    author: '王五',
    category: '前端工具',
    views: 432,
    status: '草稿'
  }
])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(15)
const total = ref(100)

// 操作方法
const handleAdd = () => {
  ElMessage.success('新增文章功能待实现')
}

const handleEdit = (row: any) => {
  ElMessage.info(`编辑文章: ${row.title}`)
}

const handleDelete = (row: any) => {
  ElMessage.warning(`删除文章: ${row.title}`)
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
 * 文章管理页面
 * 展示文章列表和操作功能
 */
</script>

<style scoped>
.articles-container {
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