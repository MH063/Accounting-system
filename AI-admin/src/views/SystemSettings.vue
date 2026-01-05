<template>
  <div class="system-settings-container" :class="{ 'is-mobile': isMobile }">
    <el-card>
      <template #header>
        <div class="card-header" :class="{ 'is-mobile': isMobile }">
          <span>系统设置</span>
          <el-button type="primary" @click="handleSave" :size="isMobile ? 'small' : 'default'">保存设置</el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" :class="{ 'mobile-tabs': isMobile }">
        <!-- 基本设置 -->
        <el-tab-pane label="基本设置" name="basic">
          <el-form 
            :model="basicForm" 
            :label-width="isMobile ? '80px' : '120px'" 
            :label-position="isMobile ? 'top' : 'right'"
            :style="!isMobile ? 'max-width: 600px;' : ''"
          >
            <el-form-item label="系统名称">
              <el-input v-model="basicForm.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            
            <el-form-item label="系统描述">
              <el-input 
                v-model="basicForm.systemDescription" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入系统描述" 
              />
            </el-form-item>
            
            <el-form-item label="系统Logo">
              <el-upload
                class="logo-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleLogoSuccess"
                :before-upload="beforeLogoUpload"
              >
                <img v-if="basicForm.logoUrl" :src="basicForm.logoUrl" class="logo" />
                <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="默认主题">
              <el-select v-model="basicForm.theme" placeholder="请选择默认主题" style="width: 100%">
                <el-option label="默认主题" value="default" />
                <el-option label="深色主题" value="dark" />
                <el-option label="浅色主题" value="light" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="系统语言">
              <el-select v-model="basicForm.language" placeholder="请选择系统语言" style="width: 100%">
                <el-option label="中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 支付设置 -->
        <el-tab-pane label="支付设置" name="payment">
          <el-form 
            :model="paymentForm" 
            :label-width="isMobile ? '100px' : '150px'"
            :label-position="isMobile ? 'top' : 'right'"
          >
            <el-form-item label="启用的支付方式">
              <el-checkbox-group v-model="paymentForm.enabledPayments">
                <el-checkbox v-for="payment in paymentMethods" :key="payment.value" :label="payment.value">
                  {{ payment.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-divider />
            
            <div v-for="payment in enabledPaymentMethods" :key="payment.value">
              <h3 :style="{ fontSize: isMobile ? '16px' : '18px' }">{{ payment.label }}配置</h3>
              
              <div v-if="payment.value === 'alipay'">
                <el-form-item :label="`${payment.label} AppID`">
                  <el-input 
                    v-model="paymentForm.config.alipay.appId" 
                    :placeholder="`请输入${payment.label} AppID`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item :label="`${payment.label} 商户号`">
                  <el-input 
                    v-model="paymentForm.config.alipay.merchantId" 
                    :placeholder="`请输入${payment.label}商户号`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item :label="`${payment.label} API密钥`">
                  <el-input 
                    v-model="paymentForm.config.alipay.apiKey" 
                    type="password" 
                    :placeholder="`请输入${payment.label} API密钥`" 
                    show-password 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item :label="`${payment.label} 状态`">
                  <el-switch 
                    v-model="paymentForm.config.alipay.enabled" 
                    active-text="启用" 
                    inactive-text="禁用" 
                  />
                </el-form-item>
              </div>
              
              <div v-else-if="payment.value === 'wechat'">
                <el-form-item :label="`${payment.label} AppID`">
                  <el-input 
                    v-model="paymentForm.config.wechat.appId" 
                    :placeholder="`请输入${payment.label} AppID`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item :label="`${payment.label} 商户号`">
                  <el-input 
                    v-model="paymentForm.config.wechat.merchantId" 
                    :placeholder="`请输入${payment.label}商户号`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item :label="`${payment.label} API密钥`">
                  <el-input 
                    v-model="paymentForm.config.wechat.apiKey" 
                    type="password" 
                    :placeholder="`请输入${payment.label} API密钥`" 
                    show-password 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item :label="`${payment.label} 状态`">
                  <el-switch 
                    v-model="paymentForm.config.wechat.enabled" 
                    active-text="启用" 
                    inactive-text="禁用" 
                  />
                </el-form-item>
              </div>
              
              <div v-else-if="payment.value === 'unionpay'">
                <el-form-item :label="`${payment.label} AppID`">
                  <el-input 
                    v-model="paymentForm.config.unionpay.appId" 
                    :placeholder="`请输入${payment.label} AppID`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item :label="`${payment.label} 商户号`">
                  <el-input 
                    v-model="paymentForm.config.unionpay.merchantId" 
                    :placeholder="`请输入${payment.label}商户号`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item :label="`${payment.label} API密钥`">
                  <el-input 
                    v-model="paymentForm.config.unionpay.apiKey" 
                    type="password" 
                    :placeholder="`请输入${payment.label} API密钥`" 
                    show-password 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item :label="`${payment.label} 状态`">
                  <el-switch 
                    v-model="paymentForm.config.unionpay.enabled" 
                    active-text="启用" 
                    inactive-text="禁用" 
                  />
                </el-form-item>
              </div>
              
              <el-divider />
            </div>
            
            <el-form-item label="默认支付方式">
              <el-select v-model="paymentForm.defaultPayment" placeholder="请选择默认支付方式" :style="{ width: isMobile ? '100%' : '300px' }">
                <el-option 
                  v-for="payment in enabledPaymentMethods" 
                  :key="payment.value" 
                  :label="payment.label" 
                  :value="payment.value" 
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 邮件设置 -->
        <el-tab-pane label="邮件设置" name="email">
          <el-form 
            :model="emailForm" 
            :label-width="isMobile ? '100px' : '120px'" 
            :label-position="isMobile ? 'top' : 'right'"
            :style="!isMobile ? 'max-width: 600px;' : ''"
          >
            <el-form-item label="SMTP服务器">
              <el-input v-model="emailForm.smtpServer" placeholder="请输入SMTP服务器地址" />
            </el-form-item>
            
            <el-form-item label="SMTP端口">
              <el-input-number v-model="emailForm.smtpPort" :min="1" :max="65535" style="width: 100%" />
            </el-form-item>
            
            <el-form-item label="邮箱账号">
              <el-input v-model="emailForm.emailAccount" placeholder="请输入邮箱账号" />
            </el-form-item>
            
            <el-form-item label="邮箱密码">
              <el-input 
                v-model="emailForm.emailPassword" 
                type="password" 
                placeholder="请输入邮箱密码" 
                show-password 
              />
            </el-form-item>
            
            <el-form-item label="发件人名称">
              <el-input v-model="emailForm.senderName" placeholder="请输入发件人名称" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="testEmailConnection" :style="{ width: isMobile ? '100%' : 'auto' }">测试连接</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 安全设置 -->
        <el-tab-pane label="安全设置" name="security">
          <el-form 
            :model="securityForm" 
            :label-width="isMobile ? '120px' : '150px'" 
            :label-position="isMobile ? 'top' : 'right'"
            :style="!isMobile ? 'max-width: 600px;' : ''"
          >
            <el-form-item label="密码强度要求">
              <el-select v-model="securityForm.passwordStrength" placeholder="请选择密码强度要求" style="width: 100%">
                <el-option label="低（至少6位）" value="low" />
                <el-option label="中（至少8位，包含数字和字母）" value="medium" />
                <el-option label="高（至少10位，包含数字、字母和特殊字符）" value="high" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="登录失败次数限制">
              <el-input-number v-model="securityForm.loginFailCount" :min="1" :max="10" style="width: calc(100% - 30px)" />
              <span class="form-tip" style="margin-left: 10px">次</span>
            </el-form-item>
            
            <el-form-item label="账户锁定时间">
              <el-input-number v-model="securityForm.lockTime" :min="1" :max="1440" style="width: calc(100% - 50px)" />
              <span class="form-tip" style="margin-left: 10px">分钟</span>
            </el-form-item>
            
            <el-form-item label="会话超时时间">
              <el-input-number v-model="securityForm.sessionTimeout" :min="1" :max="1440" style="width: calc(100% - 50px)" />
              <span class="form-tip" style="margin-left: 10px">分钟</span>
            </el-form-item>
            
            <el-form-item label="启用双因素认证">
              <el-switch v-model="securityForm.twoFactorAuth" />
            </el-form-item>
            
            <el-form-item label="IP访问限制">
              <el-switch v-model="securityForm.ipRestriction" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notification">
          <el-tabs v-model="notificationActiveTab" :class="{ 'mobile-tabs': isMobile }">
            <el-tab-pane label="通知规则" name="rules">
              <el-form 
                :model="notificationForm" 
                :label-width="isMobile ? '120px' : '150px'" 
                :label-position="isMobile ? 'top' : 'right'"
                :style="!isMobile ? 'max-width: 600px;' : ''"
              >
                <el-form-item label="系统通知方式">
                  <el-checkbox-group v-model="notificationForm.systemNotifications">
                    <el-checkbox label="email">邮件</el-checkbox>
                    <el-checkbox label="sms">短信</el-checkbox>
                    <el-checkbox label="wechat">微信</el-checkbox>
                    <el-checkbox label="dingtalk">钉钉</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                
                <el-form-item label="重要操作通知">
                  <el-switch v-model="notificationForm.importantOperationNotify" />
                </el-form-item>
                
                <el-form-item label="定时任务通知">
                  <el-switch v-model="notificationForm.scheduledTaskNotify" />
                </el-form-item>
                
                <el-form-item label="异常告警通知">
                  <el-switch v-model="notificationForm.alertNotify" />
                </el-form-item>
                
                <el-form-item label="通知接收人">
                  <el-select 
                    v-model="notificationForm.recipients" 
                    multiple 
                    placeholder="请选择通知接收人"
                    style="width: 100%;"
                  >
                    <el-option 
                      v-for="admin in adminList" 
                      :key="admin.id" 
                      :label="admin.name" 
                      :value="admin.id" 
                    />
                  </el-select>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="通知模板" name="templates">
              <div class="table-container mobile-scroll">
                <el-table :data="notificationTemplates" style="width: 100%" :size="isMobile ? 'small' : 'default'">
                  <el-table-column prop="name" label="模板名称" :width="isMobile ? 120 : 150" />
                  <el-table-column prop="type" label="通知类型" :width="isMobile ? 90 : 100" />
                  <el-table-column prop="content" label="模板内容" show-overflow-tooltip />
                  <el-table-column label="操作" :width="isMobile ? 70 : 150" fixed="right">
                    <template #default="scope">
                      <el-button :size="isMobile ? 'small' : 'default'" type="primary" link @click="handleEditTemplate(scope.row)">编辑</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              
              <el-button type="primary" @click="handleAddTemplate" style="margin-top: 20px;" :size="isMobile ? 'small' : 'default'" :style="{ width: isMobile ? '100%' : 'auto' }">新增模板</el-button>
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
        
        <!-- 系统信息 -->
        <el-tab-pane label="系统信息" name="systemInfo">
          <el-row :gutter="isMobile ? 10 : 20">
            <el-col :xs="24" :sm="12" style="margin-bottom: 20px;">
              <el-card shadow="hover">
                <template #header>
                  <span>系统基本信息</span>
                </template>
                <el-descriptions :column="1" border :size="isMobile ? 'small' : 'default'">
                  <el-descriptions-item label="系统名称">{{ systemInfo.name }}</el-descriptions-item>
                  <el-descriptions-item label="系统版本">{{ systemInfo.version }}</el-descriptions-item>
                  <el-descriptions-item label="运行环境">{{ systemInfo.environment }}</el-descriptions-item>
                  <el-descriptions-item label="启动时间">{{ systemInfo.startTime }}</el-descriptions-item>
                  <el-descriptions-item label="运行时长">{{ systemInfo.uptime }}</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
            
            <el-col :xs="24" :sm="12" style="margin-bottom: 20px;">
              <el-card shadow="hover">
                <template #header>
                  <span>服务状态</span>
                </template>
                <div class="table-container mobile-scroll">
                  <el-table :data="serviceStatus" style="width: 100%" :size="isMobile ? 'small' : 'default'">
                    <el-table-column prop="name" label="服务名称" />
                    <el-table-column prop="status" label="状态" :width="isMobile ? 70 : 100">
                      <template #default="scope">
                        <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'" size="small">
                          {{ scope.row.status }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="responseTime" label="响应时间" :width="isMobile ? 80 : 120" />
                  </el-table>
                </div>
                
                <el-button type="primary" @click="refreshServiceStatus" style="margin-top: 20px;" :size="isMobile ? 'small' : 'default'" :style="{ width: isMobile ? '100%' : 'auto' }">刷新状态</el-button>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>
        
        <!-- 业务规则 -->
        <el-tab-pane label="业务规则" name="businessRules">
          <el-form 
            :model="businessRulesForm" 
            :label-width="isMobile ? '120px' : '200px'"
            :label-position="isMobile ? 'top' : 'right'"
          >
            <el-form-item label="费用逾期宽限期">
              <el-input-number 
                v-model="businessRulesForm.overdueGracePeriod" 
                :min="0" 
                :max="30" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">天</span>
              <div class="form-tip">费用逾期后的宽限天数</div>
            </el-form-item>
            
            <el-form-item label="滞纳金计算方式">
              <el-select v-model="businessRulesForm.lateFeeCalculation" style="width: 100%">
                <el-option label="按日计算" value="daily" />
                <el-option label="按月计算" value="monthly" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="滞纳金比例">
              <el-input-number 
                v-model="businessRulesForm.lateFeeRate" 
                :min="0" 
                :max="100" 
                :precision="2" 
                :step="0.1" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">%</span>
              <div class="form-tip">每日或每月的滞纳金比例</div>
            </el-form-item>
            
            <el-form-item label="最大滞纳金上限">
              <el-input-number 
                v-model="businessRulesForm.maxLateFee" 
                :min="0" 
                :precision="2" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">元</span>
              <div class="form-tip">滞纳金的最大金额限制</div>
            </el-form-item>
            
            <el-form-item label="费用退款期限">
              <el-input-number 
                v-model="businessRulesForm.refundPeriod" 
                :min="1" 
                :max="365" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">天</span>
              <div class="form-tip">费用缴费后可申请退款的时间期限</div>
            </el-form-item>
            
            <el-form-item label="退款手续费比例">
              <el-input-number 
                v-model="businessRulesForm.refundFeeRate" 
                :min="0" 
                :max="100" 
                :precision="2" 
                :step="0.1" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">%</span>
              <div class="form-tip">退款时收取的手续费比例</div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 日志设置 -->
        <el-tab-pane label="日志设置" name="log">
          <el-form 
            :model="logForm" 
            :label-width="isMobile ? '120px' : '150px'" 
            :label-position="isMobile ? 'top' : 'right'"
            :style="!isMobile ? 'max-width: 600px;' : ''"
          >
            <el-form-item label="日志级别">
              <el-select v-model="logForm.level" placeholder="请选择日志级别" style="width: 100%">
                <el-option label="DEBUG" value="debug" />
                <el-option label="INFO" value="info" />
                <el-option label="WARN" value="warn" />
                <el-option label="ERROR" value="error" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="日志保留天数">
              <el-input-number 
                v-model="logForm.retentionDays" 
                :min="1" 
                :max="365" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">天</span>
            </el-form-item>
            
            <el-form-item label="日志文件大小限制">
              <el-input-number 
                v-model="logForm.maxFileSize" 
                :min="1" 
                :max="1024" 
                style="width: calc(100% - 40px)"
              /> 
              <span style="margin-left: 10px">MB</span>
            </el-form-item>
            
            <el-form-item label="启用日志轮转">
              <el-switch v-model="logForm.rotationEnabled" />
            </el-form-item>
            
            <el-form-item label="日志输出位置">
              <el-checkbox-group v-model="logForm.outputTargets">
                <el-checkbox label="file">文件</el-checkbox>
                <el-checkbox label="console">控制台</el-checkbox>
                <el-checkbox label="database">数据库</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 通知模板编辑对话框 -->
    <el-dialog 
      v-model="templateDialogVisible" 
      :title="templateDialogTitle" 
      :width="isMobile ? '95%' : '600px'"
      :fullscreen="isMobile"
    >
      <el-form :model="templateForm" :label-width="isMobile ? '80px' : '100px'" :label-position="isMobile ? 'top' : 'right'">
        <el-form-item label="模板名称">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        
        <el-form-item label="通知类型">
          <el-select v-model="templateForm.type" placeholder="请选择通知类型">
            <el-option label="邮件" value="email" />
            <el-option label="短信" value="sms" />
            <el-option label="微信" value="wechat" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="模板内容">
          <el-input 
            v-model="templateForm.content" 
            type="textarea" 
            :rows="6" 
            placeholder="请输入模板内容，支持变量替换" 
          />
        </el-form-item>
        
        <el-form-item label="可用变量">
          <div class="variables-list">
            <el-tag v-for="variable in templateVariables" :key="variable" style="margin: 5px;">
              {{ variable }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="templateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTemplate">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'
import { updateGlobalSystemConfig, getSystemConfig } from '@/utils/systemConfig'

// 响应式数据
const activeTab = ref('basic')
const notificationActiveTab = ref('rules')

const globalConfig = getSystemConfig()
const basicForm = ref({
  systemName: globalConfig.name || '记账管理系统',
  systemDescription: '基于Vue3的现代化管理平台',
  logoUrl: 'https://picsum.photos/seed/system-logo/100/100.jpg',
  theme: 'default',
  language: 'zh-CN'
})

const paymentForm = ref({
  enabledPayments: ['alipay', 'wechat'],
  defaultPayment: 'alipay',
  config: {
    alipay: {
      appId: 'your-alipay-appid-here',
      merchantId: 'your-alipay-merchant-id-here',
      apiKey: 'your-alipay-api-key-here',
      enabled: false
    },
    wechat: {
      appId: 'your-wechat-appid-here',
      merchantId: 'your-merchant-id-here',
      apiKey: 'your-wechat-api-key-here',
      enabled: false
    },
    unionpay: {
      appId: '',
      merchantId: '',
      apiKey: '',
      enabled: false
    }
  }
})

const emailForm = ref({
  smtpServer: 'smtp.example.com',
  smtpPort: 587,
  emailAccount: 'admin@example.com',
  emailPassword: '',
  senderName: '系统管理员'
})

const securityForm = ref({
  passwordStrength: 'medium',
  loginFailCount: 5,
  lockTime: 30,
  sessionTimeout: 120,
  twoFactorAuth: false,
  ipRestriction: false
})

const notificationForm = ref({
  systemNotifications: ['email'],
  importantOperationNotify: true,
  scheduledTaskNotify: true,
  alertNotify: true,
  recipients: []
})

const businessRulesForm = ref({
  overdueGracePeriod: 7,
  lateFeeCalculation: 'daily',
  lateFeeRate: 0.05,
  maxLateFee: 1000,
  refundPeriod: 30,
  refundFeeRate: 2
})

const logForm = ref({
  level: 'info',
  retentionDays: 30,
  maxFileSize: 100,
  rotationEnabled: true,
  outputTargets: ['file', 'console']
})

const adminList = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' }
])

const systemInfo = ref({
  name: globalConfig.name || '记账管理系统',
  version: globalConfig.version || '1.0.0',
  environment: globalConfig.environment === 'production' ? '生产环境' : globalConfig.environment === 'development' ? '开发环境' : '测试环境',
  startTime: '',
  uptime: ''
})

const serviceStatus = ref([
  { name: '用户服务', status: '正常', responseTime: '45ms' },
  { name: '费用服务', status: '正常', responseTime: '62ms' },
  { name: '支付服务', status: '正常', responseTime: '78ms' },
  { name: '通知服务', status: '正常', responseTime: '32ms' },
  { name: '数据库服务', status: '正常', responseTime: '15ms' }
])

const notificationTemplates = ref([
  { id: 1, name: '费用缴纳通知', type: 'email', content: '尊敬的{userName}，您有一笔{amount}元的{feeType}费用待缴纳，请在{dueDate}前完成支付。' },
  { id: 2, name: '逾期提醒', type: 'sms', content: '【AI管理系统】提醒：您的{feeType}费用已逾期{days}天，请尽快处理。' },
  { id: 3, name: '支付成功通知', type: 'wechat', content: '您已成功支付{amount}元{feeType}费用，支付时间为{payTime}。' }
])

const templateDialogVisible = ref(false)
const templateDialogTitle = ref('')
const isEditingTemplate = ref(false)
const currentTemplateId = ref(0)

const templateForm = ref({
  name: '',
  type: 'email',
  content: ''
})

const templateVariables = ref(['{userName}', '{amount}', '{feeType}', '{dueDate}', '{payTime}', '{days}'])

// 支付方式选项
const paymentMethods = ref([
  { value: 'alipay', label: '支付宝' },
  { value: 'wechat', label: '微信支付' },
  { value: 'unionpay', label: '银联支付' }
])

// 计算已启用的支付方式
const enabledPaymentMethods = computed(() => {
  return paymentMethods.value.filter(method => 
    paymentForm.value.enabledPayments.includes(method.value)
  )
})

// Logo上传成功处理
const handleLogoSuccess = (response: any, file: any) => {
  basicForm.value.logoUrl = URL.createObjectURL(file.raw)
  ElMessage.success('Logo上传成功')
}

// Logo上传前检查
const beforeLogoUpload = (file: any) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isJPG) {
    ElMessage.error('Logo图片只能是 JPG 或 PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('Logo图片大小不能超过 2MB!')
  }
  
  return isJPG && isLt2M
}

// 测试邮件连接
const testEmailConnection = () => {
  console.log('📧 测试邮件连接:', emailForm.value)
  ElMessage.info('邮件连接测试功能待实现')
}

// 保存设置
const handleSave = async () => {
  try {
    console.log('💾 保存系统设置:', {
      basic: basicForm.value,
      payment: paymentForm.value,
      email: emailForm.value,
      security: securityForm.value,
      notification: notificationForm.value,
      businessRules: businessRulesForm.value,
      log: logForm.value
    })
    
    // 构建配置对象
    const configs: Record<string, any> = {}
    configs['system.name'] = basicForm.value.systemName
    configs['system.environment'] = systemInfo.value.environment === '开发环境' ? 'development' : 
                                     systemInfo.value.environment === '测试环境' ? 'testing' : 'production'
    
    // 调用API保存配置
    const response = await userApi.setConfig({ configs })
    console.log('✅ 配置保存响应:', response)
    
    // 保存成功后刷新systemInfo
    await fetchSystemConfigForSettings()
    
    ElMessage.success('系统设置保存成功')
  } catch (error) {
    console.error('❌ 保存系统设置失败:', error)
    ElMessage.error('保存系统设置失败: ' + (error as Error).message)
  }
}

// 刷新服务状态
const refreshServiceStatus = () => {
  ElMessage.info('正在刷新服务状态...')
  // 模拟刷新过程
  setTimeout(() => {
    // 随机更新一些服务状态
    // 使用固定状态更新规则，实际应用中应通过API获取真实服务状态
    serviceStatus.value.forEach((service, index) => {
      if (index % 5 === 0) {
        service.status = '异常'
      } else {
        service.status = '正常'
      }
      service.responseTime = (index * 20 + 50) + 'ms'
    })
    ElMessage.success('服务状态刷新完成')
  }, 1000)
}

// 编辑通知模板
const handleEditTemplate = (row: any) => {
  templateDialogTitle.value = '编辑通知模板'
  isEditingTemplate.value = true
  currentTemplateId.value = row.id
  templateForm.value = { ...row }
  templateDialogVisible.value = true
}

// 新增通知模板
const handleAddTemplate = () => {
  templateDialogTitle.value = '新增通知模板'
  isEditingTemplate.value = false
  currentTemplateId.value = 0
  templateForm.value = {
    name: '',
    type: 'email',
    content: ''
  }
  templateDialogVisible.value = true
}

// 保存通知模板
const saveTemplate = () => {
  if (!templateForm.value.name || !templateForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  if (isEditingTemplate.value) {
    // 编辑模板
    const index = notificationTemplates.value.findIndex(t => t.id === currentTemplateId.value)
    if (index !== -1) {
      notificationTemplates.value[index] = { 
        ...notificationTemplates.value[index], 
        ...templateForm.value 
      }
    }
  } else {
    // 新增模板
    const newId = Math.max(...notificationTemplates.value.map(t => t.id)) + 1
    notificationTemplates.value.push({
      id: newId,
      ...templateForm.value
    })
  }
  
  templateDialogVisible.value = false
  ElMessage.success('模板保存成功')
}

// 从API获取系统配置并同步到systemInfo
const fetchSystemConfigForSettings = async () => {
  try {
    console.log('🔄 SystemSettings: 开始获取系统配置...')
    
    const response = await userApi.getSystemConfigs()
    console.log('📡 SystemSettings API响应:', response)
    
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构
    let data = response
    if (response && response.data && !response.configs) {
      data = response.data
    }
    
    if (data && data.configs) {
      const configs = data.configs
      
      const getConfigValue = (key1: string, key2: string) => {
        const item = configs[key1] || configs[key2]
        return item?.value !== undefined ? item.value : null
      }
      
      const name = getConfigValue('system.name', 'system_name') || '记账管理系统'
      const version = getConfigValue('system.version', 'system_version') || '1.0.0'
      const environment = getConfigValue('system.environment', 'system_environment') || '生产环境'
      const startTime = getConfigValue('system.deploy_time', 'system_deploy_time') || new Date().toLocaleString('zh-CN', { hour12: false })
      
      // 更新 systemInfo
      systemInfo.value = {
        name,
        version,
        environment,
        startTime,
        uptime: calculateUptime(startTime)
      }
      
      // 同时更新 basicForm 中的系统名称
      basicForm.value.systemName = name
      
      // 同步更新全局配置（用于所有页面显示）
      updateGlobalSystemConfig({ name, version, environment })
      
      console.log('✅ SystemSettings: 系统配置获取完成', { name, version, environment })
    }
  } catch (error) {
    console.error('❌ SystemSettings: 获取系统配置失败:', error)
  }
}

// 计算运行时长
const calculateUptime = (startTimeStr: string): string => {
  try {
    const startTime = new Date(startTimeStr)
    if (isNaN(startTime.getTime())) {
      return '未知'
    }
    const now = new Date()
    const diffMs = now.getTime() - startTime.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffDays}天${diffHours}小时${diffMinutes}分钟`
  } catch {
    return '未知'
  }
}

// 组件挂载
onMounted(async () => {
  console.log('⚙️ 系统设置页面加载完成')
  await fetchSystemConfigForSettings()
})

/**
 * 系统设置页面
 * 管理系统的基本配置、邮件设置、安全设置和通知设置
 */
</script>

<style scoped>
.system-settings-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-uploader .logo {
  width: 178px;
  height: 178px;
  display: block;
}

.logo-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.logo-uploader .el-upload:hover {
  border-color: #409EFF;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.variables-list {
  max-height: 100px;
  overflow-y: auto;
}
</style>