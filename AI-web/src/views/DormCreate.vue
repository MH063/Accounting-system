<template>
  <div class="dorm-create">
    <div class="page-header">
      <h1>创建宿舍</h1>
      <el-button 
        type="primary" 
        :icon="ArrowLeft" 
        @click="$router.back()"
        class="back-btn"
      >
        返回
      </el-button>
    </div>

    <!-- 步骤条 -->
    <el-steps :active="currentStep" align-center class="steps-container">
      <el-step title="基本信息" description="填写宿舍基本信息"></el-step>
      <el-step title="扩展信息" description="填写宿舍扩展信息（可选）"></el-step>
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
            <el-form-item label="宿舍编码" prop="dormNumber">
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

    <!-- 扩展信息表单 -->
    <el-card v-show="currentStep === 1" class="form-card">
      <template #header>
        <span class="step-title">扩展信息（可选）</span>
      </template>
      
      <el-form :model="extendedInfo" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="宿舍类型">
              <el-select v-model="extendedInfo.type" placeholder="请选择宿舍类型" style="width: 100%;">
                <el-option label="单人间" value="single"></el-option>
                <el-option label="双人间" value="double"></el-option>
                <el-option label="四人间" value="quad"></el-option>
                <el-option label="公寓" value="apartment"></el-option>
                <el-option label="标准间" value="standard"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="面积（平方米）">
              <el-input-number v-model="extendedInfo.area" :min="0" controls-position="right" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别限制">
              <el-select v-model="extendedInfo.genderLimit" placeholder="请选择性别限制" style="width: 100%;">
                <el-option label="男生" value="male"></el-option>
                <el-option label="女生" value="female"></el-option>
                <el-option label="混合" value="mixed"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="月租金">
              <el-input-number v-model="extendedInfo.monthlyRent" :min="0" controls-position="right" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="押金">
              <el-input-number v-model="extendedInfo.deposit" :min="0" controls-position="right" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="包含水电">
              <el-switch v-model="extendedInfo.utilityIncluded"></el-switch>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="楼层">
              <el-input-number v-model="extendedInfo.floor" :min="0" controls-position="right" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="联系人">
          <el-input v-model="extendedInfo.contactPerson" placeholder="请输入联系人"></el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="extendedInfo.contactPhone" placeholder="请输入联系电话"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱">
              <el-input v-model="extendedInfo.contactEmail" placeholder="请输入联系邮箱"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="设施列表">
          <el-select 
            v-model="extendedInfo.facilities" 
            multiple 
            filterable 
            allow-create 
            default-first-option
            placeholder="请选择或输入设施"
            style="width: 100%;">
            <el-option label="床" value="床"></el-option>
            <el-option label="书桌" value="书桌"></el-option>
            <el-option label="衣柜" value="衣柜"></el-option>
            <el-option label="椅子" value="椅子"></el-option>
            <el-option label="空调" value="空调"></el-option>
            <el-option label="暖气" value="暖气"></el-option>
            <el-option label="风扇" value="风扇"></el-option>
            <el-option label="灯具" value="灯具"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="便利设施">
          <el-select 
            v-model="extendedInfo.amenities" 
            multiple 
            filterable 
            allow-create 
            default-first-option
            placeholder="请选择或输入便利设施"
            style="width: 100%;">
            <el-option label="网络" value="网络"></el-option>
            <el-option label="洗衣机" value="洗衣机"></el-option>
            <el-option label="冰箱" value="冰箱"></el-option>
            <el-option label="微波炉" value="微波炉"></el-option>
            <el-option label="电热水壶" value="电热水壶"></el-option>
            <el-option label="吹风机" value="吹风机"></el-option>
            <el-option label="路由器" value="路由器"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input 
            v-model="extendedInfo.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入宿舍描述">
          </el-input>
        </el-form-item>

        <el-form-item label="管理员ID">
          <el-input-number v-model="extendedInfo.adminId" :min="1" controls-position="right" style="width: 100%;"></el-input-number>
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
        <el-descriptions title="宿舍基本信息确认" :column="2" border>
          <el-descriptions-item label="宿舍名称">{{ basicInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="宿舍编码">{{ basicInfo.dormNumber }}</el-descriptions-item>
          <el-descriptions-item label="详细地址">{{ basicInfo.address }}</el-descriptions-item>
          <el-descriptions-item label="容量">{{ basicInfo.maxMembers }}人</el-descriptions-item>
          <el-descriptions-item label="位置">{{ basicInfo.building }} - {{ basicInfo.roomNumber }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <el-descriptions title="宿舍扩展信息确认" :column="2" border>
          <el-descriptions-item label="宿舍类型">{{ extendedInfo.type || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="面积">{{ extendedInfo.area ? extendedInfo.area + ' 平方米' : '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="性别限制">{{ extendedInfo.genderLimit || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="月租金">{{ extendedInfo.monthlyRent ? '¥' + extendedInfo.monthlyRent : '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="押金">{{ extendedInfo.deposit ? '¥' + extendedInfo.deposit : '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="包含水电">{{ extendedInfo.utilityIncluded ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="楼层">{{ extendedInfo.floor || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ extendedInfo.contactPerson || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ extendedInfo.contactPhone || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="联系邮箱">{{ extendedInfo.contactEmail || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="设施列表">{{ extendedInfo.facilities.length > 0 ? extendedInfo.facilities.join(', ') : '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="便利设施">{{ extendedInfo.amenities.length > 0 ? extendedInfo.amenities.join(', ') : '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ extendedInfo.description || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="管理员ID">{{ extendedInfo.adminId || '未填写' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />



        <el-form-item>
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="success" @click="createDorm" :loading="creating">
            <el-icon><Check /></el-icon>
            确认创建宿舍
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
        <el-result icon="success" title="宿舍创建成功！">
          <template #sub-title>
            宿舍编号：{{ createdDormNumber }}
          </template>
        </el-result>
        
        <div class="next-steps">
          <h4>接下来您可以：</h4>
          <el-button-group>
            <el-button @click="goToDormManagement">宿舍管理</el-button>
            <el-button type="primary" @click="goToDormManagement">查看宿舍列表</el-button>
          </el-button-group>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ArrowLeft, Refresh, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import { dormService, CreateDormRequest } from '@/services/dormService'

// 步骤控制
const currentStep = ref(0)
const basicFormRef = ref<FormInstance>()
const router = useRouter()
const createdDormNumber = ref('')

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

// 扩展信息表单
const extendedInfo = reactive({
  dormCode: '',
  description: '',
  type: 'standard',
  area: undefined as number | undefined,
  genderLimit: 'mixed',
  monthlyRent: undefined as number | undefined,
  deposit: undefined as number | undefined,
  utilityIncluded: false,
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  floor: undefined as number | undefined,
  facilities: [] as string[],
  amenities: [] as string[],
  adminId: undefined as number | undefined
})

// 基本信息验证规则
const basicRules: FormRules = {
  name: [
    { required: true, message: '请输入寝室名称', trigger: 'blur' }
  ],
  dormNumber: [
    { required: true, message: '请生成宿舍编码', trigger: 'blur' }
  ],
  building: [
    { required: true, message: '请输入建筑栋数', trigger: 'blur' }
  ],
  roomNumber: [
    { required: true, message: '请输入房间号', trigger: 'blur' }
  ],
  maxMembers: [
    { required: true, message: '请选择最大人数', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

// 创建状态
const generatingId = ref(false)
const creating = ref(false)
const showSuccessDialog = ref(false)



// 下一步
const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证基本信息
    if (!basicFormRef.value) return
    await basicFormRef.value.validate((valid) => {
      if (valid) {
        currentStep.value = 1
      }
    })
  } else if (currentStep.value === 1) {
    currentStep.value = 2
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 生成宿舍编码
const generateDormId = () => {
  generatingId.value = true
  
  try {
    // 生成唯一的宿舍编码
    const prefix = basicInfo.building || 'DORM'
    const roomNum = basicInfo.roomNumber || Math.floor(Math.random() * 1000)
    const timestamp = Date.now().toString().slice(-6)
    
    basicInfo.dormNumber = `${prefix}-${roomNum}-${timestamp}`
    
    ElMessage.success('宿舍编码生成成功')
  } catch (error) {
    ElMessage.error('生成编码失败，请重试')
  } finally {
    generatingId.value = false
  }
}

// 创建寝室
const createDorm = async () => {
  creating.value = true
  
  try {
    // 构造符合API要求的宿舍数据
    const dormData: CreateDormRequest = {
      dormName: basicInfo.name,
      address: basicInfo.address,
      capacity: basicInfo.maxMembers,
      // 必填字段
      dormCode: extendedInfo.dormCode || undefined,
      description: extendedInfo.description || undefined,
      type: extendedInfo.type || undefined,
      area: extendedInfo.area,
      genderLimit: extendedInfo.genderLimit || undefined,
      monthlyRent: extendedInfo.monthlyRent,
      deposit: extendedInfo.deposit,
      utilityIncluded: extendedInfo.utilityIncluded,
      contactPerson: extendedInfo.contactPerson || undefined,
      contactPhone: extendedInfo.contactPhone || undefined,
      contactEmail: extendedInfo.contactEmail || undefined,
      building: basicInfo.building || undefined,
      floor: extendedInfo.floor,
      roomNumber: basicInfo.roomNumber || undefined,
      facilities: extendedInfo.facilities.length > 0 ? extendedInfo.facilities : undefined,
      amenities: extendedInfo.amenities.length > 0 ? extendedInfo.amenities : undefined,
      adminId: extendedInfo.adminId
    };
    
    // 调用真实API创建宿舍
    const response = await dormService.createNewDorm(dormData);
    
    if (response.success) {
      ElMessage.success('宿舍创建成功！');
      showSuccessDialog.value = true;
      createdDormNumber.value = response.data.dorm.dormCode || basicInfo.dormNumber;
    } else {
      ElMessage.error(response.message || '创建失败，请重试');
    }
  } catch (error: any) {
    console.error('创建宿舍失败:', error);
    ElMessage.error(error.message || '创建失败，请重试');
  } finally {
    creating.value = false;
  }
}

// 引导流程
const goToDormManagement = () => {
  showSuccessDialog.value = false
  // 跳转到寝室管理页面
  router.push('/dorm-management')
}

// 已移除不再需要的方法
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

.required-hint {
  position: absolute;
  top: 0;
  right: -10px;
  color: #f56c6c;
  font-weight: bold;
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