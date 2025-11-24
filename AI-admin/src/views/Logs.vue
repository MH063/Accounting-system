<template>
  <div class="logs-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <div>
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button type="primary" @click="handleExport">导出日志</el-button>
          </div>
        </div>
      </template>
      
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="操作用户">
            <el-input v-model="searchForm.user" placeholder="请输入用户名" clearable />
          </el-form-item>
          <el-form-item label="操作类型">
            <el-select v-model="searchForm.type" placeholder="请选择操作类型" clearable>
              <el-option label="登录" value="login" />
              <el-option label="新增" value="add" />
              <el-option label="修改" value="edit" />
              <el-option label="删除" value="delete" />
              <el-option label="导出" value="export" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作时间">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user" label="操作用户" />
        <el-table-column prop="operation" label="操作类型" />
        <el-table-column prop="description" label="操作描述" />
        <el-table-column prop="ip" label="IP地址" />
        <el-table-column prop="createTime" label="操作时间" />
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button size="small" @click="handleDetail(scope.row)">详情</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 搜索表单
const searchForm = ref({
  user: '',
  type: '',
  dateRange: []
})

// 表格数据
const tableData = ref([
  {
    id: 1,
    user: '张三',
    operation: '登录',
    description: '用户登录系统',
    ip: '192.168.1.100',
    createTime: '2023-01-15 10:30:00'
  },
  {
    id: 2,
    user: '李四',
    operation: '新增',
    description: '新增用户数据',
    ip: '192.168.1.101',
    createTime: '2023-01-15 09:45:00'
  },
  {
    id: 3,
    user: '王五',
    operation: '修改',
    description: '修改系统配置',
    ip: '192.168.1.102',
    createTime: '2023-01-14 16:20:00'
  }
])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 操作方法
const handleRefresh = () => {
  ElMessage.success('日志已刷新')
}

const handleExport = () => {
  ElMessage.success('导出日志功能待实现')
}

const handleSearch = () => {
  ElMessage.success('查询功能待实现')
}

const handleReset = () => {
  searchForm.value = {
    user: '',
    type: '',
    dateRange: []
  }
  ElMessage.success('搜索条件已重置')
}

const handleDetail = (row: any) => {
  ElMessage.info(`查看日志详情: ${row.user} - ${row.operation}`)
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
 * 操作日志页面
 * 展示系统操作日志和查询功能
 */
</script>

<style scoped>
.logs-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>