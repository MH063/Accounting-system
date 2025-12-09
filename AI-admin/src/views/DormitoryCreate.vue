<template>
  <div class="dormitory-create-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>创建寝室</span>
          <div>
            <el-button @click="goBack">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="submitting">创建寝室</el-button>
          </div>
        </div>
      </template>
      
      <el-form
        ref="dormFormRef"
        :model="dormForm"
        :rules="dormFormRules"
        label-width="120px"
        class="dorm-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="寝室名称" prop="name">
              <el-input
                v-model="dormForm.name"
                placeholder="请输入寝室名称"
                maxlength="30"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="寝室类型" prop="type">
              <el-select
                v-model="dormForm.type"
                placeholder="请选择寝室类型"
                style="width: 100%"
              >
                <el-option label="男生寝室" value="male" />
                <el-option label="女生寝室" value="female" />
                <el-option label="混合寝室" value="mixed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="楼栋" prop="building">
              <el-input
                v-model="dormForm.building"
                placeholder="请输入楼栋"
                maxlength="20"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="房间号" prop="roomNumber">
              <el-input
                v-model="dormForm.roomNumber"
                placeholder="请输入房间号"
                maxlength="10"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="寝室容量" prop="capacity">
          <el-slider
            v-model="dormForm.capacity"
            :min="1"
            :max="20"
            show-input
            style="width: 300px"
          />
        </el-form-item>
        
        <el-form-item label="寝室规则" prop="rules">
          <el-select
            v-model="dormForm.rules"
            placeholder="请选择寝室规则模板"
            style="width: 100%"
          >
            <el-option label="标准规则" value="standard" />
            <el-option label="安静学习型" value="quiet" />
            <el-option label="活跃社交型" value="social" />
            <el-option label="自定义规则" value="custom" />
          </el-select>
        </el-form-item>
        
        <!-- 自定义规则 -->
        <div v-if="dormForm.rules === 'custom'" class="custom-rules-section">
          <el-form-item label="自定义规则">
            <el-input
              v-model="dormForm.customRules"
              type="textarea"
              :rows="4"
              placeholder="请输入自定义寝室规则，每行一条规则"
            />
          </el-form-item>
        </div>
        
        <el-form-item label="寝室描述" prop="description">
          <el-input
            v-model="dormForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入寝室描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="寝室成员" prop="members">
          <el-transfer
            v-model="dormForm.members"
            :data="availableMembers"
            :titles="['可选成员', '已选成员']"
            filterable
            filter-placeholder="请输入成员姓名"
          />
        </el-form-item>
        
        <el-form-item label="寝室长" prop="leader">
          <el-select
            v-model="dormForm.leader"
            placeholder="请选择寝室长"
            style="width: 100%"
          >
            <el-option
              v-for="member in selectedMembers"
              :key="member.key"
              :label="member.label"
              :value="member.key"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 创建前的规则确认 -->
    <el-dialog
      v-model="rulesDialogVisible"
      title="寝室规则确认"
      width="500px"
    >
      <div class="rules-confirmation">
        <h3>寝室规则</h3>
        <div class="rules-content">
          <ul>
            <li v-for="rule in selectedRules" :key="rule">{{ rule }}</li>
          </ul>
        </div>
        
        <el-checkbox v-model="agreeToRules">
          我已阅读并同意遵守以上寝室规则
        </el-checkbox>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="rulesDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmRules"
            :disabled="!agreeToRules"
          >
            确认并创建
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

// 路由实例
const router = useRouter()

// 响应式数据
const dormFormRef = ref()
const submitting = ref(false)

const dormForm = reactive({
  name: '',
  type: '',
  building: '',
  roomNumber: '',
  capacity: 4,
  rules: 'standard',
  customRules: '',
  description: '',
  members: [] as number[],
  leader: null as number | null
})

const dormFormRules = {
  name: [
    { required: true, message: '请输入寝室名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择寝室类型', trigger: 'change' }
  ],
  building: [
    { required: true, message: '请输入楼栋', trigger: 'blur' }
  ],
  roomNumber: [
    { required: true, message: '请输入房间号', trigger: 'blur' }
  ],
  capacity: [
    { required: true, message: '请选择寝室容量', trigger: 'change' }
  ],
  rules: [
    { required: true, message: '请选择寝室规则', trigger: 'change' }
  ],
  members: [
    { required: true, message: '请选择寝室成员', trigger: 'change' }
  ],
  leader: [
    { required: true, message: '请选择寝室长', trigger: 'change' }
  ]
}

// 可选成员数据
const availableMembers = ref([
  { key: 1, label: '张三' },
  { key: 2, label: '李四' },
  { key: 3, label: '王五' },
  { key: 4, label: '赵六' },
  { key: 5, label: '钱七' },
  { key: 6, label: '孙八' }
])

// 规则确认对话框
const rulesDialogVisible = ref(false)
const agreeToRules = ref(false)

// 计算属性
const selectedMembers = computed(() => {
  return availableMembers.value.filter(member => 
    dormForm.members.includes(member.key)
  )
})

const selectedRules = computed(() => {
  const ruleMap: Record<string, string[]> = {
    standard: [
      '保持寝室整洁',
      '按时作息，不影响他人休息',
      '节约用水用电',
      '禁止在寝室内吸烟',
      '来访客人需登记'
    ],
    quiet: [
      '晚上10点后保持安静',
      '禁止在寝室内大声喧哗',
      '学习时间保持安静环境',
      '电子设备请使用耳机',
      '保持寝室整洁'
    ],
    social: [
      '鼓励组织寝室活动',
      '欢迎朋友来访',
      '共同维护寝室氛围',
      '积极参与寝室文化建设',
      '保持基本整洁'
    ]
  }
  
  if (dormForm.rules === 'custom' && dormForm.customRules) {
    return dormForm.customRules.split('\n').filter(rule => rule.trim() !== '')
  }
  
  return ruleMap[dormForm.rules] || []
})

// 方法
const goBack = () => {
  router.back()
}

const submitForm = () => {
  dormFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 显示规则确认对话框
      rulesDialogVisible.value = true
      agreeToRules.value = false
    } else {
      ElMessage.warning('请填写完整的寝室信息')
    }
  })
}

const confirmRules = async () => {
  if (!agreeToRules.value) {
    ElMessage.warning('请先同意寝室规则')
    return
  }
  
  submitting.value = true
  
  try {
    // 模拟提交创建寝室
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('寝室创建成功')
    rulesDialogVisible.value = false
    router.push('/dormitory/list')
  } catch (error) {
    ElMessage.error('寝室创建失败')
  } finally {
    submitting.value = false
  }
}

// 组件挂载时的操作
onMounted(() => {
  console.log('🏠 寝室创建页面加载完成')
})
</script>

<style scoped>
.dormitory-create-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dorm-form {
  max-width: 800px;
  margin: 0 auto;
}

.custom-rules-section {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.rules-confirmation {
  padding: 20px 0;
}

.rules-content {
  margin: 15px 0;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.rules-content ul {
  padding-left: 20px;
  margin: 0;
}

.rules-content li {
  margin-bottom: 8px;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .dorm-form {
    max-width: 100%;
  }
}
</style>