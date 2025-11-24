<template>
  <div class="dorm-create">
    <div class="page-header">
      <h1>创建宿舍</h1>
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <el-card class="form-card">
      <el-form :model="dormForm" :rules="rules" ref="dormFormRef" label-width="120px">
        <el-form-item label="宿舍名称" prop="name">
          <el-input v-model="dormForm.name" placeholder="请输入宿舍名称"></el-input>
        </el-form-item>

        <el-form-item label="宿舍地址" prop="address">
          <el-input v-model="dormForm.address" placeholder="请输入宿舍地址"></el-input>
        </el-form-item>

        <el-form-item label="最大人数" prop="maxMembers">
          <el-select v-model="dormForm.maxMembers" placeholder="请选择最大人数">
            <el-option label="2人间" :value="2"></el-option>
            <el-option label="4人间" :value="4"></el-option>
            <el-option label="6人间" :value="6"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="宿舍类型" prop="type">
          <el-radio-group v-model="dormForm.type">
            <el-radio label="standard">标准宿舍</el-radio>
            <el-radio label="premium">豪华宿舍</el-radio>
            <el-radio label="budget">经济宿舍</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="宿舍描述" prop="description">
          <el-input 
            v-model="dormForm.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入宿舍描述">
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="createDorm">创建宿舍</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

const dormFormRef = ref<FormInstance>()

const dormForm = reactive({
  name: '',
  address: '',
  maxMembers: 4,
  type: 'standard',
  description: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入宿舍名称', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入宿舍地址', trigger: 'blur' }
  ],
  maxMembers: [
    { required: true, message: '请选择最大人数', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择宿舍类型', trigger: 'change' }
  ]
}

const createDorm = async () => {
  if (!dormFormRef.value) return
  
  await dormFormRef.value.validate((valid) => {
    if (valid) {
      console.log('创建宿舍:', dormForm)
      // 这里调用创建宿舍的API
      // 成功后跳转到宿舍列表页
    }
  })
}

const resetForm = () => {
  Object.assign(dormForm, {
    name: '',
    address: '',
    maxMembers: 4,
    type: 'standard',
    description: ''
  })
}
</script>

<style scoped>
.dorm-create {
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

.form-card {
  max-width: 600px;
}
</style>