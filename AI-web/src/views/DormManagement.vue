<template>
  <div class="dorm-management">
    <div class="page-header">
      <h1>宿舍管理</h1>
      <el-button type="primary" @click="$router.push('/dashboard/dorm/create')">
        <el-icon><Plus /></el-icon>
        创建宿舍
      </el-button>
    </div>

    <el-table :data="dormList" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="宿舍名称" />
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="memberCount" label="成员数" width="100">
        <template #default="scope">
          <el-tag type="success">{{ scope.row.memberCount }}人</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
            {{ scope.row.status === 'active' ? '活跃' : '非活跃' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="viewDorm(scope.row)">查看</el-button>
          <el-button size="small" type="primary" @click="editDorm(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const dormList = ref([
  {
    id: 1,
    name: '宿舍A101',
    address: '学生公寓A栋101室',
    memberCount: 4,
    status: 'active'
  },
  {
    id: 2,
    name: '宿舍B205',
    address: '学生公寓B栋205室',
    memberCount: 3,
    status: 'active'
  }
])

const viewDorm = (dorm: any) => {
  console.log('查看宿舍:', dorm)
  // 跳转到详情页
}

const editDorm = (dorm: any) => {
  console.log('编辑宿舍:', dorm)
  // 跳转到编辑页
}
</script>

<style scoped>
.dorm-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  color: #303133;
  margin: 0;
}
</style>