<template>
  <div class="categories-container">
    <el-card>
      <template #header>
        <div class="card-header" :class="{ 'is-mobile': isMobile }">
          <span>分类管理</span>
          <el-button type="primary" @click="handleAdd" :size="isMobile ? 'small' : 'default'">
            <el-icon v-if="isMobile"><Plus /></el-icon>{{ isMobile ? '' : '新增分类' }}
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" style="width: 100%" :size="isMobile ? 'small' : 'default'">
        <el-table-column prop="id" label="ID" width="80" v-if="!isMobile" />
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="description" label="描述" v-if="!isMobile" />
        <el-table-column prop="articleCount" label="文章数量" width="120" />
        <el-table-column prop="createTime" label="创建时间" v-if="!isMobile" />
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

// 移动端适配逻辑
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
    name: '前端开发',
    description: '前端开发相关技术文章',
    articleCount: 25,
    createTime: '2023-01-01 10:00:00'
  },
  {
    id: 2,
    name: '后端开发',
    description: '后端开发相关技术文章',
    articleCount: 18,
    createTime: '2023-01-02 10:00:00'
  },
  {
    id: 3,
    name: '数据库',
    description: '数据库相关技术文章',
    articleCount: 12,
    createTime: '2023-01-03 10:00:00'
  }
])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 操作方法
const handleAdd = () => {
  ElMessage.success('新增分类功能待实现')
}

const handleEdit = (row: any) => {
  ElMessage.info(`编辑分类: ${row.name}`)
}

const handleDelete = (row: any) => {
  ElMessage.warning(`删除分类: ${row.name}`)
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
 * 分类管理页面
 * 展示分类列表和操作功能
 */
</script>

<style scoped>
.categories-container {
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