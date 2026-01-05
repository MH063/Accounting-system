<template>
  <div class="articles-container">
    <el-card>
      <template #header>
        <div class="card-header" :class="{ 'is-mobile': isMobile }">
          <span>文章管理</span>
          <el-button type="primary" @click="handleAdd" :size="isMobile ? 'small' : 'default'">
            <el-icon v-if="isMobile"><Plus /></el-icon>{{ isMobile ? '' : '新增文章' }}
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" style="width: 100%" :size="isMobile ? 'small' : 'default'">
        <el-table-column prop="id" label="ID" width="80" v-if="!isMobile" />
        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column prop="author" label="作者" :width="isMobile ? 100 : 120" />
        <el-table-column prop="category" label="分类" width="120" v-if="!isMobile" />
        <el-table-column prop="views" label="浏览量" width="100" v-if="!isMobile" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已发布' ? 'success' : 'warning'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="isMobile ? 80 : 180" fixed="right">
          <template #default="scope">
            <template v-if="isMobile">
              <el-dropdown trigger="click">
                <el-button size="small" type="primary" link>
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleEdit(scope.row)">编辑</el-dropdown-item>
                    <el-dropdown-item @click="handleDelete(scope.row)" style="color: var(--el-color-danger)">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
            <template v-else>
              <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
            </template>
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
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :small="isMobile"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { More, Plus } from '@element-plus/icons-vue'

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
const pageSize = ref(10)
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

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header.is-mobile {
    padding: 5px 0;
  }
  
  :deep(.el-card__body) {
    padding: 10px;
  }
}
</style>