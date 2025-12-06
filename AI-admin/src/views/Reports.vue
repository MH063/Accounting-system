<template>
  <div class="reports-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报表管理</span>
          <el-button type="primary" @click="handleGenerate">生成报表</el-button>
        </div>
      </template>
      
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="报表名称" />
        <el-table-column prop="type" label="报表类型" />
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" @click="handleDownload(scope.row)">下载</el-button>
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
    name: '用户统计报表',
    type: '用户报表',
    createTime: '2023-01-01 10:00:00',
    status: '已完成'
  },
  {
    id: 2,
    name: '访问量月报',
    type: '流量报表',
    createTime: '2023-01-02 10:00:00',
    status: '处理中'
  },
  {
    id: 3,
    name: '销售数据分析',
    type: '业务报表',
    createTime: '2023-01-03 10:00:00',
    status: '已完成'
  }
])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(15)
const total = ref(100)

// 操作方法
const handleGenerate = () => {
  ElMessage.success('生成报表功能待实现')
}

const handleView = (row: any) => {
  ElMessage.info(`查看报表: ${row.name}`)
}

const handleDownload = (row: any) => {
  ElMessage.info(`下载报表: ${row.name}`)
}

const handleDelete = (row: any) => {
  ElMessage.warning(`删除报表: ${row.name}`)
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  ElMessage.info(`每页显示 ${val} 条`)
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  ElMessage.info(`当前页: ${val}`)
}

// 获取状态对应的标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case '已完成':
      return 'success'
    case '处理中':
      return 'warning'
    case '失败':
      return 'danger'
    default:
      return 'info'
  }
}

/**
 * 报表管理页面
 * 展示报表列表和操作功能
 */
</script>

<style scoped>
.reports-container {
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