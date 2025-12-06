<template>
  <div class="dormitory-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>寝室详情</span>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button type="primary" @click="handleEdit">编辑</el-button>
          </div>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="16">
          <el-descriptions title="基本信息" :column="2" border>
            <el-descriptions-item label="寝室号">{{ dormitoryInfo.dormNumber }}</el-descriptions-item>
            <el-descriptions-item label="楼栋">{{ dormitoryInfo.building }}</el-descriptions-item>
            <el-descriptions-item label="容量">{{ dormitoryInfo.capacity }}人</el-descriptions-item>
            <el-descriptions-item label="当前入住">{{ dormitoryInfo.currentOccupancy }}人</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTagType(dormitoryInfo.status)">
                {{ getStatusText(dormitoryInfo.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ dormitoryInfo.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ dormitoryInfo.description }}</el-descriptions-item>
          </el-descriptions>
          
          <el-divider />
          
          <el-descriptions title="入住学生" :column="1">
            <el-descriptions-item>
              <el-table :data="students" style="width: 100%">
                <el-table-column prop="id" label="学号" width="100" />
                <el-table-column prop="name" label="姓名" />
                <el-table-column prop="major" label="专业" />
                <el-table-column prop="phone" label="联系电话" />
                <el-table-column prop="checkInDate" label="入住日期" />
                <el-table-column label="操作" width="100">
                  <template #default="scope">
                    <el-button size="small" type="danger" @click="handleCheckOut(scope.row)">退宿</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
        
        <el-col :span="8">
          <el-card shadow="never">
            <template #header>
              <span>寝室平面图</span>
            </template>
            <div class="floor-plan">
              <div class="bed-space" v-for="i in dormitoryInfo.capacity" :key="i">
                <div class="bed-number">{{ i }}号床</div>
                <div class="occupant" v-if="i <= dormitoryInfo.currentOccupancy">
                  <el-tag type="success">已占用</el-tag>
                </div>
                <div class="vacant" v-else>
                  <el-tag type="info">空闲</el-tag>
                </div>
              </div>
            </div>
          </el-card>
          
          <el-card shadow="never" style="margin-top: 20px;">
            <template #header>
              <span>维修记录</span>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in maintenanceRecords"
                :key="index"
                :timestamp="record.date"
                placement="top"
              >
                <el-card>
                  <h4>{{ record.title }}</h4>
                  <p>{{ record.description }}</p>
                  <p>维修人员: {{ record.maintainer }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑寝室信息" width="500px">
      <el-form :model="editFormData" :rules="editFormRules" ref="editFormRef" label-width="100px">
        <el-form-item label="寝室号" prop="dormNumber">
          <el-input v-model="editFormData.dormNumber" placeholder="请输入寝室号" />
        </el-form-item>
        
        <el-form-item label="楼栋" prop="building">
          <el-input v-model="editFormData.building" placeholder="请输入楼栋" />
        </el-form-item>
        
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="editFormData.capacity" :min="1" :max="20" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="editFormData.status" placeholder="请选择状态">
            <el-option label="正常" value="normal" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="已满" value="full" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="editFormData.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 路由相关
const router = useRouter()

// 响应式数据
const dormitoryInfo = ref({
  id: 1,
  dormNumber: 'A101',
  building: 'A栋',
  capacity: 4,
  currentOccupancy: 3,
  status: 'normal',
  createdAt: '2023-01-01 10:00:00',
  description: '一楼朝南，采光良好'
})

const students = ref([
  {
    id: '2023001',
    name: '张三',
    major: '计算机科学与技术',
    phone: '13800138001',
    checkInDate: '2023-09-01'
  },
  {
    id: '2023002',
    name: '李四',
    major: '软件工程',
    phone: '13800138002',
    checkInDate: '2023-09-01'
  },
  {
    id: '2023003',
    name: '王五',
    major: '信息安全',
    phone: '13800138003',
    checkInDate: '2023-09-01'
  }
])

const maintenanceRecords = ref([
  {
    date: '2023-10-15',
    title: '更换灯管',
    description: '寝室照明灯管老化，更换新灯管',
    maintainer: '张师傅'
  },
  {
    date: '2023-08-20',
    title: '维修水龙头',
    description: '洗手间水龙头漏水，更换密封圈',
    maintainer: '李师傅'
  }
])

const editDialogVisible = ref(false)

const editFormData = ref({
  id: 1,
  dormNumber: 'A101',
  building: 'A栋',
  capacity: 4,
  currentOccupancy: 3,
  status: 'normal',
  createdAt: '2023-01-01 10:00:00',
  description: '一楼朝南，采光良好'
})

const editFormRules = {
  dormNumber: [{ required: true, message: '请输入寝室号', trigger: 'blur' }],
  building: [{ required: true, message: '请输入楼栋', trigger: 'blur' }],
  capacity: [{ required: true, message: '请输入容量', trigger: 'change' }]
}

const editFormRef = ref()

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'normal':
      return 'success'
    case 'maintenance':
      return 'warning'
    case 'full':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'normal':
      return '正常'
    case 'maintenance':
      return '维修中'
    case 'full':
      return '已满'
    default:
      return '未知'
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 编辑
const handleEdit = () => {
  editFormData.value = { ...dormitoryInfo.value }
  editDialogVisible.value = true
}

// 提交编辑表单
const submitEditForm = () => {
  editFormRef.value.validate((valid: boolean) => {
    if (valid) {
      dormitoryInfo.value = { ...editFormData.value }
      editDialogVisible.value = false
      ElMessage.success('寝室信息更新成功')
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
}

// 办理退宿
const handleCheckOut = async (student: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要为学生 "${student.name}" 办理退宿吗？`,
      '确认退宿',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🚪 办理退宿:', student)
    ElMessage.success(`学生 ${student.name} 退宿办理成功`)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 办理退宿失败:', error)
      ElMessage.error('办理退宿失败')
    }
  }
}

// 组件挂载
onMounted(() => {
  console.log('🏨 寝室详情页面加载完成')
})

/**
 * 寝室详情页面
 * 展示寝室的详细信息、入住学生和维修记录
 */
</script>

<style scoped>
.dormitory-detail-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.floor-plan {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.bed-space {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  text-align: center;
}

.bed-number {
  font-weight: bold;
  margin-bottom: 10px;
}

.occupant, .vacant {
  margin-top: 10px;
}
</style>