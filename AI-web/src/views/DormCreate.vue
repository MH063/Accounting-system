<template>
  <div class="dorm-create">
    <div class="page-header">
      <h1>创建寝室</h1>
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <!-- 步骤条 -->
    <el-steps :active="currentStep" align-center class="steps-container">
      <el-step title="基本信息" description="填写寝室基本信息"></el-step>
      <el-step title="类型选择" description="选择寝室类型和规则"></el-step>
      <el-step title="确认创建" description="确认信息并创建"></el-step>
    </el-steps>

    <!-- 第一步：基本信息 -->
    <el-card v-show="currentStep === 0" class="form-card">
      <template #header>
        <span class="step-title">寝室基本信息</span>
      </template>
      
      <el-form :model="basicInfo" :rules="basicRules" ref="basicFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="寝室名称" prop="name">
              <el-input v-model="basicInfo.name" placeholder="例如：A101寝室"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="寝室编号" prop="dormNumber">
              <el-input v-model="basicInfo.dormNumber" placeholder="系统生成" readonly>
                <template #append>
                  <el-button @click="generateDormId" :loading="generatingId">
                    <el-icon><Refresh /></el-icon>
                    生成
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="建筑栋数" prop="building">
              <el-input v-model="basicInfo.building" placeholder="例如：A栋"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房间号" prop="roomNumber">
              <el-input v-model="basicInfo.roomNumber" placeholder="例如：101"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最大人数" prop="maxMembers">
              <el-select v-model="basicInfo.maxMembers" placeholder="请选择最大人数" style="width: 100%;">
                <el-option label="2人间" :value="2"></el-option>
                <el-option label="4人间" :value="4"></el-option>
                <el-option label="6人间" :value="6"></el-option>
                <el-option label="8人间" :value="8"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前人数" prop="currentMembers">
              <el-input-number v-model="basicInfo.currentMembers" :min="0" :max="basicInfo.maxMembers" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细地址" prop="address">
          <el-input v-model="basicInfo.address" placeholder="请输入详细地址"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 第二步：类型选择和规则 -->
    <el-card v-show="currentStep === 1" class="form-card">
      <template #header>
        <span class="step-title">寝室类型和规则</span>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="寝室类型" prop="genderType">
          <el-radio-group v-model="typeInfo.genderType" @change="onGenderTypeChange">
            <el-radio label="male">
              <el-icon><User /></el-icon>
              男生寝室
            </el-radio>
            <el-radio label="female">
              <el-icon><UserFilled /></el-icon>
              女生寝室
            </el-radio>
            <el-radio label="mixed">
              <el-icon><Avatar /></el-icon>
              混合寝室
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="房间配置" prop="roomConfig">
          <el-radio-group v-model="typeInfo.roomConfig">
            <el-radio label="standard">标准配置</el-radio>
            <el-radio label="premium">豪华配置</el-radio>
            <el-radio label="budget">经济配置</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="规则模板" prop="ruleTemplate">
          <el-select v-model="typeInfo.ruleTemplate" placeholder="选择规则模板" style="width: 100%;" @change="onRuleTemplateChange">
            <el-option 
              v-for="template in ruleTemplates" 
              :key="template.id" 
              :label="template.name" 
              :value="template.id">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>{{ template.name }}</span>
                <el-tag size="small">{{ template.category }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 规则预览 -->
        <el-form-item v-if="selectedRuleTemplate">
          <div class="rule-preview">
            <h4>{{ selectedRuleTemplate.name }}</h4>
            <p class="rule-description">{{ selectedRuleTemplate.description }}</p>
            <el-divider />
            <div class="rule-list">
              <div v-for="(rule, index) in selectedRuleTemplate.rules" :key="index" class="rule-item">
                <el-checkbox v-model="rule.enabled" disabled>{{ rule.title }}</el-checkbox>
                <p class="rule-content">{{ rule.content }}</p>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="自定义规则">
          <el-input 
            v-model="typeInfo.customRules" 
            type="textarea" 
            :rows="3" 
            placeholder="添加自定义规则（可选）">
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 第三步：确认创建 -->
    <el-card v-show="currentStep === 2" class="form-card">
      <template #header>
        <span class="step-title">确认创建</span>
      </template>
      
      <div class="confirmation-section">
        <el-descriptions title="寝室信息确认" :column="2" border>
          <el-descriptions-item label="寝室编号">{{ basicInfo.dormNumber }}</el-descriptions-item>
          <el-descriptions-item label="寝室名称">{{ basicInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ basicInfo.building }} - {{ basicInfo.roomNumber }}</el-descriptions-item>
          <el-descriptions-item label="人数配置">{{ basicInfo.currentMembers }}/{{ basicInfo.maxMembers }}</el-descriptions-item>
          <el-descriptions-item label="寝室类型">{{ genderTypeText }}</el-descriptions-item>
          <el-descriptions-item label="房间配置">{{ roomConfigText }}</el-descriptions-item>
          <el-descriptions-item label="详细地址" :span="2">{{ basicInfo.address }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <div v-if="selectedRuleTemplate" class="rule-confirmation">
          <h4>应用规则：{{ selectedRuleTemplate.name }}</h4>
          <el-checkbox-group v-model="confirmedRules">
            <el-checkbox 
              v-for="rule in selectedRuleTemplate.rules" 
              :key="rule.title"
              :label="rule.title">
              {{ rule.title }}
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <el-form-item>
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="success" @click="createDorm" :loading="creating">
            <el-icon><Check /></el-icon>
            确认创建寝室
          </el-button>
        </el-form-item>
      </div>
    </el-card>

    <!-- 创建成功对话框 -->
    <el-dialog 
      v-model="showSuccessDialog" 
      title="创建成功" 
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false">
      <div class="success-content">
        <el-result icon="success" title="寝室创建成功！">
          <template #sub-title>
            寝室编号：{{ createdDormNumber }}
          </template>
        </el-result>
        
        <div class="next-steps">
          <h4>接下来您可以：</h4>
          <el-button-group>
            <el-button @click="goToDormManagement">管理寝室</el-button>
            <el-button type="primary" @click="addMembers">邀请成员</el-button>
            <el-button @click="setBudget">设置预算</el-button>
          </el-button-group>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ArrowLeft, Refresh, User, UserFilled, Avatar, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 步骤控制
const currentStep = ref(0)
const basicFormRef = ref<FormInstance>()

// 基本信息表单
const basicInfo = reactive({
  name: '',
  dormNumber: '',
  building: '',
  roomNumber: '',
  maxMembers: 4,
  currentMembers: 0,
  address: ''
})

// 类型和规则信息
const typeInfo = reactive({
  genderType: 'male',
  roomConfig: 'standard',
  ruleTemplate: '',
  customRules: ''
})

// 基本信息验证规则
const basicRules: FormRules = {
  name: [
    { required: true, message: '请输入寝室名称', trigger: 'blur' }
  ],
  building: [
    { required: true, message: '请输入建筑栋数', trigger: 'blur' }
  ],
  roomNumber: [
    { required: true, message: '请输入房间号', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

// 规则模板数据
const ruleTemplates = ref([
  {
    id: 'standard-male',
    name: '标准男生寝室规则',
    category: '男生寝室',
    description: '适用于男生寝室的基本管理规则',
    rules: [
      { title: '卫生值日制度', content: '每周轮流值日，保持寝室整洁', enabled: true },
      { title: '作息时间规定', content: '晚上11点前熄灯，保持安静', enabled: true },
      { title: '访客管理制度', content: '非本寝室人员需登记方可进入', enabled: true },
      { title: '安全用电规定', content: '禁止使用大功率电器，注意用电安全', enabled: true }
    ]
  },
  {
    id: 'standard-female',
    name: '标准女生寝室规则',
    category: '女生寝室',
    description: '适用于女生寝室的基本管理规则',
    rules: [
      { title: '卫生清洁制度', content: '每日轮流打扫，保持环境整洁', enabled: true },
      { title: '作息时间规定', content: '晚上10:30前熄灯，保持安静环境', enabled: true },
      { title: '安全管理制度', content: '进出锁门，注意人身安全', enabled: true },
      { title: '物品摆放规范', content: '个人物品摆放整齐，公共区域共享使用', enabled: true }
    ]
  },
  {
    id: 'mixed-dorm',
    name: '混合寝室规则',
    category: '混合寝室',
    description: '适用于男女生混合寝室的管理规则',
    rules: [
      { title: '共同维护制度', content: '男女共同维护寝室和谐环境', enabled: true },
      { title: '隐私保护规定', content: '尊重彼此隐私，保持适当距离', enabled: true },
      { title: '访客时间规定', content: '访客时间限定在白天，非紧急情况避免夜晚打扰', enabled: true },
      { title: '卫生责任分工', content: '明确分工，共同承担卫生责任', enabled: true }
    ]
  }
])

// 选中的规则模板
const selectedRuleTemplate = computed(() => {
  return ruleTemplates.value.find(template => template.id === typeInfo.ruleTemplate)
})

// 确认的规则
const confirmedRules = ref<string[]>([])

// 创建状态
const generatingId = ref(false)
const creating = ref(false)
const showSuccessDialog = ref(false)
const createdDormNumber = ref('')

// 计算属性
const genderTypeText = computed(() => {
  const types = {
    male: '男生寝室',
    female: '女生寝室',
    mixed: '混合寝室'
  }
  return types[typeInfo.genderType as keyof typeof types] || ''
})

const roomConfigText = computed(() => {
  const configs = {
    standard: '标准配置',
    premium: '豪华配置',
    budget: '经济配置'
  }
  return configs[typeInfo.roomConfig as keyof typeof configs] || ''
})

// 生成寝室编号
const generateDormId = async () => {
  generatingId.value = true
  try {
    // 模拟API调用生成唯一编号
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const prefix = basicInfo.building || 'BUILD'
    const roomNum = basicInfo.roomNumber || Math.floor(Math.random() * 999) + 1
    const timestamp = Date.now().toString().slice(-4)
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    
    basicInfo.dormNumber = `${prefix}-${roomNum}-${timestamp}${random}`
    
    ElMessage.success('寝室编号生成成功')
  } catch (error) {
    ElMessage.error('生成编号失败，请重试')
  } finally {
    generatingId.value = false
  }
}

// 性别类型变更处理
const onGenderTypeChange = (value: string) => {
  // 根据性别类型过滤规则模板
  typeInfo.ruleTemplate = ''
  typeInfo.customRules = ''
}

// 规则模板变更处理
const onRuleTemplateChange = (templateId: string) => {
  const template = ruleTemplates.value.find(t => t.id === templateId)
  if (template) {
    confirmedRules.value = template.rules.filter(r => r.enabled).map(r => r.title)
  }
}

// 下一步
const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证基本信息
    if (!basicFormRef.value) return
    await basicFormRef.value.validate((valid) => {
      if (valid) {
        if (!basicInfo.dormNumber) {
          ElMessage.warning('请先生成寝室编号')
          return
        }
        currentStep.value = 1
      }
    })
  } else if (currentStep.value === 1) {
    if (!typeInfo.ruleTemplate) {
      ElMessage.warning('请选择规则模板')
      return
    }
    currentStep.value = 2
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 创建寝室
const createDorm = async () => {
  creating.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    createdDormNumber.value = basicInfo.dormNumber
    
    ElMessage.success('寝室创建成功！')
    showSuccessDialog.value = true
    
  } catch (error) {
    ElMessage.error('创建失败，请重试')
  } finally {
    creating.value = false
  }
}

// 引导流程
const goToDormManagement = () => {
  showSuccessDialog.value = false
  // 跳转到寝室管理页面
  window.location.href = '/dashboard/dormitory'
}

const addMembers = () => {
  showSuccessDialog.value = false
  // 跳转到成员管理页面
  window.location.href = '/dashboard/members'
}

const setBudget = () => {
  showSuccessDialog.value = false
  // 跳转到费用管理页面
  window.location.href = '/dashboard/expenses'
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
  margin-bottom: 30px;
}

.page-header h1 {
  color: #303133;
  margin: 0;
}

.steps-container {
  margin-bottom: 30px;
}

.form-card {
  max-width: 800px;
  margin: 0 auto;
}

.step-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.rule-preview {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.rule-preview h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.rule-description {
  color: #606266;
  margin-bottom: 20px;
}

.rule-list {
  max-height: 200px;
  overflow-y: auto;
}

.rule-item {
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.rule-item .el-checkbox {
  font-weight: bold;
}

.rule-content {
  margin: 5px 0 0 20px;
  color: #606266;
  font-size: 14px;
}

.confirmation-section {
  padding: 20px 0;
}

.rule-confirmation {
  margin: 20px 0;
  padding: 20px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #e0f2fe;
}

.rule-confirmation h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.success-content {
  text-align: center;
}

.next-steps {
  margin-top: 30px;
}

.next-steps h4 {
  margin-bottom: 15px;
  color: #303133;
}

.el-button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
}

@media (max-width: 768px) {
  .dorm-create {
    padding: 10px;
  }
  
  .form-card {
    margin: 0;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .el-row {
    flex-direction: column;
  }
  
  .el-col {
    width: 100% !important;
  }
}
</style>