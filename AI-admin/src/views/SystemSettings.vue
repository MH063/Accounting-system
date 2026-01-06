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
            <el-form-item>
              <template #label>
                <span>系统名称</span>
                <el-tooltip content="管理后台显示的系统名称，会出现在标题栏和浏览器标签页" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input v-model="basicForm.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>系统描述</span>
                <el-tooltip content="关于本系统的简要介绍，用于 SEO 或登录页显示" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input 
                v-model="basicForm.systemDescription" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入系统描述" 
              />
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>系统Logo</span>
                <el-tooltip content="系统左上角显示的图标，建议比例 1:1，大小不超过 2MB" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
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
            
            <el-form-item>
              <template #label>
                <span>默认主题</span>
                <el-tooltip content="系统全局默认采用的色彩风格，用户可在个人中心自行覆盖" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-select v-model="basicForm.theme" placeholder="请选择默认主题" style="width: 100%">
                <el-option label="默认主题" value="default" />
                <el-option label="深色主题" value="dark" />
                <el-option label="浅色主题" value="light" />
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>系统语言</span>
                <el-tooltip content="系统默认的界面语言，支持国际化切换" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
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
                <el-form-item>
                  <template #label>
                    <span>{{ payment.label }} AppID</span>
                    <el-tooltip content="支付宝开放平台的应用唯一标识，用于接口调用授权" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-input 
                    v-model="paymentForm.config.alipay.appId" 
                    :placeholder="`请输入${payment.label} AppID`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span>{{ payment.label }} 商户号</span>
                    <el-tooltip content="支付宝商户编号，通常为 16 位数字" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-input 
                    v-model="paymentForm.config.alipay.merchantId" 
                    :placeholder="`请输入${payment.label}商户号`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span>{{ payment.label }} API密钥</span>
                    <el-tooltip content="支付宝接口调用凭证，支持 MD5 或 RSA2 签名方式的私钥/密钥" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
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
                <el-form-item>
                  <template #label>
                    <span>{{ payment.label }} AppID</span>
                    <el-tooltip content="微信公众平台或开放平台的应用 ID" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-input 
                    v-model="paymentForm.config.wechat.appId" 
                    :placeholder="`请输入${payment.label} AppID`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span>{{ payment.label }} 商户号</span>
                    <el-tooltip content="微信支付商户号（MCHID），在微信支付商户平台查看" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-input 
                    v-model="paymentForm.config.wechat.merchantId" 
                    :placeholder="`请输入${payment.label}商户号`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span>{{ payment.label }} API密钥</span>
                    <el-tooltip content="微信支付 API 密钥（V2 或 V3 密钥），用于生成签名和数据加密" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
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
                <el-form-item>
                  <template #label>
                    <span>{{ payment.label }} AppID</span>
                    <el-tooltip content="银联商户接入平台的应用标识" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-input 
                    v-model="paymentForm.config.unionpay.appId" 
                    :placeholder="`请输入${payment.label} AppID`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span>{{ payment.label }} 商户号</span>
                    <el-tooltip content="银联商户代码，用于识别交易商户身份" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-input 
                    v-model="paymentForm.config.unionpay.merchantId" 
                    :placeholder="`请输入${payment.label}商户号`" 
                    :style="{ width: isMobile ? '100%' : '300px' }"
                  />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span>{{ payment.label }} API密钥</span>
                    <el-tooltip content="银联接口调用所需的签名证书或密钥" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
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
            <el-form-item>
              <template #label>
                <span>SMTP服务器</span>
                <el-tooltip content="邮件发送服务器地址，如 smtp.qq.com 或 smtp.gmail.com" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input v-model="emailForm.smtpServer" placeholder="请输入SMTP服务器地址" />
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>SMTP端口</span>
                <el-tooltip content="常用端口：SSL加密通常用 465，TLS加密常用 587" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number v-model="emailForm.smtpPort" :min="1" :max="65535" style="width: 100%" />
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>邮箱账号</span>
                <el-tooltip content="用于发送通知邮件的系统邮箱地址" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input v-model="emailForm.emailAccount" placeholder="请输入邮箱账号" />
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>邮箱密码</span>
                <el-tooltip content="邮箱登录密码或第三方授权码（如QQ邮箱需使用授权码）" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input 
                v-model="emailForm.emailPassword" 
                type="password" 
                placeholder="请输入邮箱密码" 
                show-password 
              />
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>发件人名称</span>
                <el-tooltip content="用户收到邮件时显示的发件人姓名" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input v-model="emailForm.senderName" placeholder="请输入发件人名称" />
            </el-form-item>

            <el-form-item>
              <template #label>
                <span>启用 SSL/TLS</span>
                <el-tooltip content="端口 465 通常需要开启，587 通常不需要" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-switch v-model="emailForm.secureConnection" />
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
            <el-form-item>
              <template #label>
                <span>密码强度要求</span>
                <el-tooltip content="设置新密码时必须符合的最小复杂度标准，增强账户安全性" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-select v-model="securityForm.passwordStrength" placeholder="请选择密码强度要求" style="width: 100%">
                <el-option label="低（至少6位）" value="low" />
                <el-option label="中（至少8位，包含数字和字母）" value="medium" />
                <el-option label="高（至少10位，包含数字、字母和特殊字符）" value="high" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <template #label>
                <span>禁止重复最近密码</span>
                <el-tooltip content="用户修改密码时，不能与最近设置过的 N 次密码重复，防止循环使用简单密码" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number v-model="securityForm.passwordPolicy.historyLimit" :min="0" :max="10" style="width: calc(100% - 30px)" />
              <span class="form-tip" style="margin-left: 10px">次</span>
            </el-form-item>

            <el-form-item>
              <template #label>
                <span>密码有效期</span>
                <el-tooltip content="密码超过此天数后必须强制修改，定期更换密码可降低被破解风险" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number v-model="securityForm.passwordPolicy.expirationDays" :min="0" :max="365" style="width: calc(100% - 30px)" />
              <span class="form-tip" style="margin-left: 10px">天</span>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>登录失败次数限制</span>
                <el-tooltip content="连续登录失败达到此次数后，账户将被暂时锁定，防止暴力破解" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number v-model="securityForm.loginFailCount" :min="1" :max="10" style="width: calc(100% - 30px)" />
              <span class="form-tip" style="margin-left: 10px">次</span>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>账户锁定时间</span>
                <el-tooltip content="账户被锁定后，需要等待多久才能再次尝试登录" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number v-model="securityForm.lockTime" :min="1" :max="1440" style="width: calc(100% - 50px)" />
              <span class="form-tip" style="margin-left: 10px">分钟</span>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>会话超时时间</span>
                <el-tooltip content="用户在无操作达到此时间后，系统将强制登出，保护无人看管时的账户安全" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number v-model="securityForm.sessionTimeout" :min="1" :max="1440" style="width: calc(100% - 50px)" />
              <span class="form-tip" style="margin-left: 10px">分钟</span>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>启用双因素认证</span>
                <el-tooltip content="开启后，管理员登录除密码外还需输入动态验证码，提供双重安全保障" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-switch v-model="securityForm.twoFactorAuth" />
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>IP访问限制</span>
                <el-tooltip content="开启后将根据 IP 黑白名单过滤访问请求，增强后台安全性" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-switch v-model="securityForm.ipRestriction" />
            </el-form-item>

            <template v-if="securityForm.ipRestriction">
              <el-form-item>
                <template #label>
                  <span>访问控制模式</span>
                  <el-tooltip content="白名单模式仅允许列表中的 IP 访问；黑名单模式仅禁止列表中的 IP 访问" placement="top">
                    <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
                <el-radio-group v-model="securityForm.ipControlMode">
                  <el-radio label="whitelist">白名单模式</el-radio>
                  <el-radio label="blacklist">黑名单模式</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item v-if="securityForm.ipControlMode === 'whitelist'">
                <template #label>
                  <span>IP白名单</span>
                  <el-tooltip content="仅允许列表中的 IP 访问后台，支持 CIDR 格式（如 192.168.1.0/24）" placement="top">
                    <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
                <el-input
                  v-model="ipWhitelistText"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入允许访问的IP地址，多个地址用逗号或换行分隔"
                />
              </el-form-item>

              <el-form-item v-if="securityForm.ipControlMode === 'blacklist'">
                <template #label>
                  <span>IP黑名单</span>
                  <el-tooltip content="拒绝列表中的 IP 访问后台，其他 IP 均可访问" placement="top">
                    <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
                <el-input
                  v-model="ipBlacklistText"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入禁止访问的IP地址，多个地址用逗号或换行分隔"
                />
              </el-form-item>
            </template>

            <el-form-item>
              <el-button type="info" plain icon="List" @click="showAuditLogs">查看配置变更日志</el-button>
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
                <el-form-item>
                  <template #label>
                    <span>系统通知方式</span>
                    <el-tooltip content="系统发送通知时采用的媒介，可多选" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-checkbox-group v-model="notificationForm.systemNotifications">
                    <el-checkbox label="email">邮件</el-checkbox>
                    <el-checkbox label="sms">短信</el-checkbox>
                    <el-checkbox label="wechat">微信</el-checkbox>
                    <el-checkbox label="dingtalk">钉钉</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span>重要操作通知</span>
                    <el-tooltip content="当发生关键业务操作（如大额支付、权限变更）时，是否向管理员发送实时通知" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-switch v-model="notificationForm.importantOperationNotify" />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span>定时任务通知</span>
                    <el-tooltip content="系统定时任务（如费用结算、备份）完成或失败时，是否发送状态通知" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-switch v-model="notificationForm.scheduledTaskNotify" />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span>异常告警通知</span>
                    <el-tooltip content="当系统检测到安全威胁、资源不足或服务故障时，是否紧急通知相关负责人" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
                  <el-switch v-model="notificationForm.alertNotify" />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span>通知接收人</span>
                    <el-tooltip content="选择哪些管理员账号可以接收系统发出的各类通知消息" placement="top">
                      <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </template>
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
                <el-table 
                  :data="notificationTemplates" 
                  style="width: 100%" 
                  :size="isMobile ? 'small' : 'default'"
                  @selection-change="handleSelectionChange"
                >
                  <el-table-column type="selection" width="55" />
                  <el-table-column prop="name" label="模板名称" :width="isMobile ? 120 : 150" />
                  <el-table-column prop="type" label="通知类型" :width="isMobile ? 90 : 100" />
                  <el-table-column prop="content" label="模板内容" show-overflow-tooltip />
                  <el-table-column label="操作" :width="isMobile ? 100 : 150" fixed="right">
                    <template #default="scope">
                      <el-button :size="isMobile ? 'small' : 'default'" type="primary" link @click="handleEditTemplate(scope.row)">编辑</el-button>
                      <el-button :size="isMobile ? 'small' : 'default'" type="danger" link @click="handleDeleteTemplate(scope.row)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              
              <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <el-button type="primary" @click="handleAddTemplate" :size="isMobile ? 'small' : 'default'" :style="{ width: isMobile ? '100%' : 'auto' }">新增模板</el-button>
                <el-button 
                  type="danger" 
                  @click="handleBatchDeleteTemplates" 
                  :disabled="selectedTemplates.length === 0"
                  :size="isMobile ? 'small' : 'default'" 
                  :style="{ width: isMobile ? '100%' : 'auto' }"
                >批量删除</el-button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
        
        <!-- 系统信息 -->
        <el-tab-pane label="系统信息" name="systemInfo">
          <!-- 刷新控制栏 -->
          <div class="refresh-controls" style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <el-switch
                v-model="autoRefreshEnabled"
                active-text="自动刷新"
                @change="toggleAutoRefresh"
              />
              <el-select v-model="refreshInterval" size="small" style="width: 100px" :disabled="!autoRefreshEnabled">
                <el-option
                  v-for="item in refreshOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button 
                type="primary" 
                size="small" 
                :loading="isRefreshing" 
                @click="loadSystemInfo(false)"
              >
                手动刷新
              </el-button>
            </div>
            <div class="last-update" style="font-size: 13px; color: #909399;">
              最后更新时间: {{ lastUpdateTime || '未更新' }}
            </div>
          </div>

          <el-row :gutter="isMobile ? 10 : 20" v-loading="isRefreshing && !autoRefreshEnabled">
            <el-col :xs="24" :sm="12" style="margin-bottom: 20px;">
              <el-card shadow="hover">
                <template #header>
                  <span>系统基本信息</span>
                </template>
                <el-descriptions :column="1" border :size="isMobile ? 'small' : 'default'">
                  <el-descriptions-item>
                    <template #label>
                      <div class="cell-item">
                        系统名称
                        <el-tooltip content="当前运行的系统正式名称" placement="top">
                          <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </template>
                    {{ systemInfo.name }}
                  </el-descriptions-item>
                  <el-descriptions-item>
                    <template #label>
                      <div class="cell-item">
                        系统版本
                        <el-tooltip content="当前部署的软件版本号，用于版本追踪和问题排查" placement="top">
                          <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </template>
                    {{ systemInfo.version }}
                  </el-descriptions-item>
                  <el-descriptions-item>
                    <template #label>
                      <div class="cell-item">
                        运行环境
                        <el-tooltip content="标识当前是开发环境 (development)、测试环境 (test) 还是生产环境 (production)" placement="top">
                          <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </template>
                    {{ systemInfo.environment }}
                  </el-descriptions-item>
                  <el-descriptions-item>
                    <template #label>
                      <div class="cell-item">
                        后端服务启动时间
                        <el-tooltip content="后端 API 服务最后一次启动的确切时间点" placement="top">
                          <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </template>
                    {{ systemInfo.startTime }}
                  </el-descriptions-item>
                  <el-descriptions-item>
                    <template #label>
                      <div class="cell-item">
                        后端服务运行时长
                        <el-tooltip content="自上次启动以来，后端服务已连续运行的时间" placement="top">
                          <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                        </el-tooltip>
                      </div>
                    </template>
                    {{ systemInfo.uptime }}
                  </el-descriptions-item>
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
                        <el-tag 
                          :type="scope.row.status === '正常' ? 'success' : 'danger'" 
                          size="small"
                          effect="dark"
                          class="status-tag"
                        >
                          {{ scope.row.status }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="responseTime" label="响应时间" :width="isMobile ? 80 : 120">
                      <template #default="scope">
                        <span :style="{ color: scope.row.responseTime === 'timeout' ? '#F56C6C' : 'inherit' }">
                          {{ scope.row.responseTime }}
                        </span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                
                <div class="service-tip" style="margin-top: 15px; font-size: 12px; color: #909399;">
                  * 状态异常的服务将以红色警示，响应超时将显示为 timeout。
                </div>
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
            <el-form-item>
              <template #label>
                <span>费用逾期宽限期</span>
                <el-tooltip content="费用逾期后的宽限天数，在此期限内不计收滞纳金" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number 
                v-model="businessRulesForm.overdueGracePeriod" 
                :min="0" 
                :max="30" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">天</span>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>滞纳金计算方式</span>
                <el-tooltip content="规定滞纳金是按日累计还是按月固定比例计收" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-select v-model="businessRulesForm.lateFeeCalculation" style="width: 100%">
                <el-option label="按日计算" value="daily" />
                <el-option label="按月计算" value="monthly" />
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>滞纳金比例</span>
                <el-tooltip content="计算滞纳金时所采用的费率百分比" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number 
                v-model="businessRulesForm.lateFeeRate" 
                :min="0" 
                :max="100" 
                :precision="2" 
                :step="0.1" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">%</span>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>最大滞纳金上限</span>
                <el-tooltip content="滞纳金累计的最大上限金额，超过此金额后不再增加" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number 
                v-model="businessRulesForm.maxLateFee" 
                :min="0" 
                :precision="2" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">元</span>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>费用退款期限</span>
                <el-tooltip content="缴费成功后，允许申请退款的最长有效天数" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number 
                v-model="businessRulesForm.refundPeriod" 
                :min="1" 
                :max="365" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">天</span>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>退款手续费比例</span>
                <el-tooltip content="办理退款时从原金额中扣除的手续费百分比" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number 
                v-model="businessRulesForm.refundFeeRate" 
                :min="0" 
                :max="100" 
                :precision="2" 
                :step="0.1" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">%</span>
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
            <el-form-item>
              <template #label>
                <span>日志级别</span>
                <el-tooltip content="控制系统记录日志的详细程度，DEBUG 最详细，ERROR 仅记录错误" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-select v-model="logForm.level" placeholder="请选择日志级别" style="width: 100%">
                <el-option label="DEBUG" value="debug" />
                <el-option label="INFO" value="info" />
                <el-option label="WARN" value="warn" />
                <el-option label="ERROR" value="error" />
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>日志保留天数</span>
                <el-tooltip content="历史日志文件在系统中的存储时长，过期后将被自动清理" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number 
                v-model="logForm.retentionDays" 
                :min="1" 
                :max="365" 
                style="width: calc(100% - 30px)"
              /> 
              <span style="margin-left: 10px">天</span>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>日志文件大小限制</span>
                <el-tooltip content="单个日志文件的最大容量，达到上限后将触发轮转" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number 
                v-model="logForm.maxFileSize" 
                :min="1" 
                :max="1024" 
                style="width: calc(100% - 40px)"
              /> 
              <span style="margin-left: 10px">MB</span>
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>启用日志轮转</span>
                <el-tooltip content="开启后，当日志文件达到大小限制时，系统会自动创建新文件并对旧文件重命名存档" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-switch v-model="logForm.rotationEnabled" />
            </el-form-item>
            
            <el-form-item>
              <template #label>
                <span>日志输出位置</span>
                <el-tooltip content="选择日志记录的存储目的地，支持多选" placement="top">
                  <el-icon style="margin-left: 4px; vertical-align: middle;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
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
            ref="templateContentRef"
            v-model="templateForm.content" 
            type="textarea" 
            :rows="6" 
            placeholder="请输入模板内容，支持变量替换" 
          />
        </el-form-item>
        
        <el-form-item label="可用变量">
          <div class="variables-list">
            <el-tag 
              v-for="variable in templateVariables" 
              :key="variable" 
              style="margin: 5px; cursor: pointer;"
              @click="insertVariable(variable)"
            >
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

    <!-- 审计日志对话框 -->
    <el-dialog
      v-model="auditLogsDialogVisible"
      title="配置变更审计日志"
      :width="isMobile ? '95%' : '800px'"
      destroy-on-close
    >
      <div v-loading="auditLogsLoading">
        <el-table :data="auditLogs" border style="width: 100%" size="small">
          <el-table-column prop="createdAt" label="变更时间" width="160">
            <template #default="{ row }">
              {{ new Date(row.createdAt).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="configKey" label="配置项" width="180" />
          <el-table-column prop="changedByUsername" label="操作人" width="100" />
          <el-table-column label="变更内容">
            <template #default="{ row }">
              <div class="change-detail">
                <el-tag size="small" type="info">旧值: {{ formatConfigValue(row.oldValue) }}</el-tag>
                <el-icon style="margin: 0 5px"><ArrowRight /></el-icon>
                <el-tag size="small" type="success">新值: {{ formatConfigValue(row.newValue) }}</el-tag>
              </div>
              <div v-if="row.reason" class="change-reason">原因: {{ row.reason }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="warning" 
                link 
                size="small" 
                @click="handleRollback(row)"
              >
                回滚
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div style="margin-top: 20px; display: flex; justify-content: flex-end">
          <el-pagination
            v-model:current-page="auditLogsQuery.page"
            v-model:page-size="auditLogsQuery.pageSize"
            :total="auditLogsTotal"
            layout="total, prev, pager, next"
            @current-change="fetchAuditLogs"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 二次验证对话框 -->
    <el-dialog
      v-model="verifyDialogVisible"
      title="安全二次验证"
      width="400px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div style="margin-bottom: 20px;">
        <el-alert
          title="您正在修改系统安全设置，为了确保系统安全，请验证您的管理员密码。"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
      <el-form label-position="top">
        <el-form-item label="管理员密码">
          <el-input
            v-model="verifyPassword"
            type="password"
            placeholder="请输入管理员登录密码"
            show-password
            @keyup.enter="handleVerifyPassword"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="verifyDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            :loading="verifyLoading" 
            @click="handleVerifyPassword"
          >
            立即验证
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'
import { settingsApi } from '@/api/settings'
import { adminAuthApi } from '@/api/adminAuth'
import { updateGlobalSystemConfig, getSystemConfig } from '@/utils/systemConfig'
import { insertTextAtPosition } from '@/utils/templateUtils'

const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

const handleResize = () => {
}

const activeTab = ref('basic')
const notificationActiveTab = ref('rules')
const loading = ref(false)

// 审计日志相关
const auditLogsDialogVisible = ref(false)
const auditLogsLoading = ref(false)
const auditLogs = ref([])
const auditLogsTotal = ref(0)
const auditLogsQuery = ref({
  page: 1,
  pageSize: 10,
  configKey: ''
})

// 二次验证相关
const verifyDialogVisible = ref(false)
const verifyPassword = ref('')
const verifyLoading = ref(false)
const pendingAction = ref<(() => void) | null>(null)

// 自动刷新相关配置
const autoRefreshEnabled = ref(true)
const refreshInterval = ref(10) // 默认10秒
const lastUpdateTime = ref('')
const isRefreshing = ref(false)
let refreshTimer: any = null

// 刷新频率选项
const refreshOptions = [
  { label: '5秒', value: 5 },
  { label: '10秒', value: 10 },
  { label: '30秒', value: 30 },
  { label: '60秒', value: 60 }
]

// 切换自动刷新
function toggleAutoRefresh() {
  if (autoRefreshEnabled.value) {
    startRefreshTimer()
    console.log('⏰ [系统监控] 自动刷新已开启')
  } else {
    stopRefreshTimer()
    console.log('⏸️ [系统监控] 自动刷新已暂停')
  }
}

// 开始定时器
function startRefreshTimer() {
  stopRefreshTimer()
  if (autoRefreshEnabled.value) {
    refreshTimer = setInterval(() => {
      if (activeTab.value === 'systemInfo') {
        loadSystemInfo(true)
      }
    }, refreshInterval.value * 1000)
  }
}

// 停止定时器
function stopRefreshTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 监听刷新间隔变化
watch(refreshInterval, () => {
  if (autoRefreshEnabled.value) {
    startRefreshTimer()
  }
})

// 监听标签切换，仅在系统信息页面时刷新
watch(activeTab, (newTab) => {
  if (newTab === 'systemInfo' && autoRefreshEnabled.value) {
    startRefreshTimer()
  } else {
    stopRefreshTimer()
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
  loadAllSettings()
  startRefreshTimer()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  stopRefreshTimer()
})

const globalConfig = getSystemConfig()

// 表单数据定义
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
      appId: '',
      merchantId: '',
      apiKey: '',
      enabled: false
    },
    wechat: {
      appId: '',
      merchantId: '',
      apiKey: '',
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
  smtpServer: '',
  smtpPort: 587,
  emailAccount: '',
  emailPassword: '',
  senderName: '系统管理员',
  secureConnection: true
})

const securityForm = ref({
  passwordStrength: 'medium',
  loginFailCount: 5,
  lockTime: 30,
  sessionTimeout: 120,
  twoFactorAuth: false,
  ipRestriction: false,
  ipControlMode: 'blacklist',
  ipWhitelist: [] as string[],
  ipBlacklist: [] as string[],
  passwordPolicy: {
    minLength: 8,
    requireSpecial: true,
    requireNumber: true,
    requireUppercase: false,
    historyLimit: 5,
    expirationDays: 90
  }
})

// IP 列表转换逻辑
const ipWhitelistText = computed({
  get: () => securityForm.value.ipWhitelist.join('\n'),
  set: (val: string) => {
    securityForm.value.ipWhitelist = val.split(/[,\n]/).map(s => s.trim()).filter(s => s !== '')
  }
})

const ipBlacklistText = computed({
  get: () => securityForm.value.ipBlacklist.join('\n'),
  set: (val: string) => {
    securityForm.value.ipBlacklist = val.split(/[,\n]/).map(s => s.trim()).filter(s => s !== '')
  }
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

// 管理员列表，从后端API加载
const adminList = ref<Array<{id: number; name: string; email?: string; phone?: string; role: string}>>([])

const systemInfo = ref({
  name: globalConfig.name || '记账管理系统',
  version: globalConfig.version || '1.0.0',
  environment: globalConfig.environment === 'production' ? '生产环境' : globalConfig.environment === 'development' ? '开发环境' : '测试环境',
  startTime: '',
  uptime: ''
})

const serviceStatus = ref<Array<{name: string; status: string; responseTime: string}>>([
  { name: '用户服务', status: '正常', responseTime: '45ms' },
  { name: '费用服务', status: '正常', responseTime: '62ms' },
  { name: '支付服务', status: '正常', responseTime: '78ms' },
  { name: '通知服务', status: '正常', responseTime: '32ms' },
  { name: '数据库服务', status: '正常', responseTime: '15ms' }
])

const notificationTemplates = ref<Array<{id: number; name: string; type: string; content: string}>>([
  { id: 1, name: '费用缴纳通知', type: 'email', content: '尊敬的{userName}，您有一笔{amount}元的{feeType}费用待缴纳，请在{dueDate}前完成支付。' },
  { id: 2, name: '逾期提醒', type: 'sms', content: '【AI管理系统】提醒：您的{feeType}费用已逾期{days}天，请尽快处理。' },
  { id: 3, name: '支付成功通知', type: 'wechat', content: '您已成功支付{amount}元{feeType}费用，支付时间为{payTime}。' }
])

const templateDialogVisible = ref(false)
const templateDialogTitle = ref('')
const isEditingTemplate = ref(false)
const currentTemplateId = ref(0)
const templateContentRef = ref<any>(null)
const selectedTemplates = ref<any[]>([])

/**
 * 处理表格选择变化
 */
function handleSelectionChange(selection: any[]) {
  selectedTemplates.value = selection
}

const templateForm = ref({
  name: '',
  type: 'email',
  content: ''
})

const templateVariables = ref(['{userName}', '{amount}', '{feeType}', '{dueDate}', '{payTime}', '{days}'])

/**
 * 在通知模板内容中插入选定的变量
 * @param variable 要插入的变量名，如 {userName}
 */
function insertVariable(variable: string) {
  const input = templateContentRef.value?.$el.querySelector('textarea')
  if (!input) {
    // 如果没有找到 textarea，则直接追加到末尾
    templateForm.value.content += variable
    return
  }

  const start = input.selectionStart || 0
  const end = input.selectionEnd || 0
  const content = templateForm.value.content

  // 使用工具函数插入变量
  templateForm.value.content = insertTextAtPosition(content, variable, start, end)
  
  // 在 DOM 更新后重新聚焦并设置光标位置
  setTimeout(() => {
    input.focus()
    const newPos = start + variable.length
    input.setSelectionRange(newPos, newPos)
    
    // 关键位置打印日志方便调试
    console.log(`✅ 变量已插入: ${variable}, 新光标位置: ${newPos}`)
  }, 0)
}

const paymentMethods = ref([
  { value: 'alipay', label: '支付宝' },
  { value: 'wechat', label: '微信支付' },
  { value: 'unionpay', label: '银联支付' }
])

const enabledPaymentMethods = computed(() => {
  return paymentMethods.value.filter(method => 
    paymentForm.value.enabledPayments.includes(method.value)
  )
})

async function loadAllSettings() {
  loading.value = true
  try {
    await Promise.all([
      loadBasicSettings(),
      loadPaymentSettings(),
      loadEmailSettings(),
      loadSecuritySettings(),
      loadNotificationSettings(),
      loadBusinessRules(),
      loadLogSettings(),
      loadSystemInfo()
    ])
    console.log('✅ 所有设置加载完成')
  } catch (error) {
    console.error('❌ 加载设置失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadBasicSettings() {
  try {
    const response = await settingsApi.getConfigs('basic')
    const data = response.data?.data || response.data || response
    if (data.configs) {
      const configs = data.configs
      if (configs['system.name']) {
        basicForm.value.systemName = configs['system.name'].value || basicForm.value.systemName
      }
      if (configs['system.theme']) {
        basicForm.value.theme = configs['system.theme'].value || basicForm.value.theme
      }
      if (configs['system.language']) {
        basicForm.value.language = configs['system.language'].value || basicForm.value.language
      }
    }
    console.log('✅ 基本设置加载完成')
  } catch (error) {
    console.error('❌ 加载基本设置失败:', error)
  }
}

async function loadPaymentSettings() {
  try {
    const response = await settingsApi.getPaymentConfigs()
    const data = response.data?.data || response.data || response
    if (data) {
      if (data.enabledPayments) {
        paymentForm.value.enabledPayments = data.enabledPayments
      }
      if (data.defaultPayment) {
        paymentForm.value.defaultPayment = data.defaultPayment
      }
      if (data.configs) {
        paymentForm.value.config = data.configs
      }
    }
    console.log('✅ 支付设置加载完成')
  } catch (error) {
    console.error('❌ 加载支付设置失败:', error)
  }
}

async function loadEmailSettings() {
  try {
    const response = await settingsApi.getEmailConfig()
    const data = response.data?.data || response.data || response
    if (data) {
      emailForm.value.smtpServer = data.smtpServer || emailForm.value.smtpServer
      emailForm.value.smtpPort = data.smtpPort || emailForm.value.smtpPort
      emailForm.value.emailAccount = data.emailAccount || emailForm.value.emailAccount
      emailForm.value.senderName = data.senderName || emailForm.value.senderName
      emailForm.value.secureConnection = data.secureConnection ?? emailForm.value.secureConnection
    }
    console.log('✅ 邮件设置加载完成')
  } catch (error) {
    console.error('❌ 加载邮件设置失败:', error)
  }
}

async function loadSecuritySettings() {
  try {
    const response = await settingsApi.getSecurityConfig()
    const data = response.data?.data || response.data || response
    if (data) {
      securityForm.value.loginFailCount = data.loginFailCount ?? securityForm.value.loginFailCount
      securityForm.value.lockTime = data.lockTime ?? securityForm.value.lockTime
      securityForm.value.sessionTimeout = data.sessionTimeout ?? securityForm.value.sessionTimeout
      securityForm.value.twoFactorAuth = data.twoFactorAuth ?? securityForm.value.twoFactorAuth
      securityForm.value.ipRestriction = data.ipRestriction ?? securityForm.value.ipRestriction
      securityForm.value.ipControlMode = data.ipControlMode ?? securityForm.value.ipControlMode
      securityForm.value.ipWhitelist = data.ipWhitelist || []
      securityForm.value.ipBlacklist = data.ipBlacklist || []
      
      if (data.passwordPolicy) {
        securityForm.value.passwordPolicy = {
          ...securityForm.value.passwordPolicy,
          ...data.passwordPolicy
        }
        
        // 推断密码强度
        const policy = data.passwordPolicy
        if (policy.minLength >= 10 && policy.requireSpecial && policy.requireNumber) {
          securityForm.value.passwordStrength = 'high'
        } else if (policy.minLength >= 8 && policy.requireNumber) {
          securityForm.value.passwordStrength = 'medium'
        } else {
          securityForm.value.passwordStrength = 'low'
        }
      }
    }
    console.log('✅ 安全设置加载完成')
  } catch (error) {
    console.error('❌ 加载安全设置失败:', error)
  }
}

async function loadNotificationSettings() {
  try {
    const [rulesResponse, templatesResponse, recipientsResponse] = await Promise.all([
      settingsApi.getNotificationRules(),
      settingsApi.getNotificationTemplates(),
      settingsApi.getNotificationRecipients()
    ])

    const rulesData = rulesResponse.data?.data || rulesResponse.data || rulesResponse
    if (rulesData) {
      notificationForm.value.systemNotifications = rulesData.systemNotifications || notificationForm.value.systemNotifications
      notificationForm.value.importantOperationNotify = rulesData.importantOperationNotify ?? notificationForm.value.importantOperationNotify
      notificationForm.value.scheduledTaskNotify = rulesData.scheduledTaskNotify ?? notificationForm.value.scheduledTaskNotify
      notificationForm.value.alertNotify = rulesData.alertNotify ?? notificationForm.value.alertNotify
    }

    const templatesData = templatesResponse.data?.data || templatesResponse.data || templatesResponse
    if (templatesData && templatesData.templates) {
      notificationTemplates.value = templatesData.templates
      console.log('✅ 通知模板加载成功:', templatesData.templates.length, '个')
    } else {
      console.warn('⚠️ 通知模板数据格式异常:', templatesData)
      notificationTemplates.value = []
    }

    const recipientsData = recipientsResponse.data?.data || recipientsResponse.data || recipientsResponse
    if (recipientsData && recipientsData.recipients) {
      notificationForm.value.recipients = recipientsData.recipients.map((r: any) => r.id)
      adminList.value = recipientsData.recipients
      console.log('✅ 通知接收人加载成功:', recipientsData.recipients.length, '个')
    } else {
      console.warn('⚠️ 通知接收人数据格式异常:', recipientsData)
      adminList.value = []
      notificationForm.value.recipients = []
    }

    console.log('✅ 通知设置加载完成')
  } catch (error) {
    console.error('❌ 加载通知设置失败:', error)
    // 即使失败也设置默认值，避免页面崩溃
    notificationTemplates.value = []
    adminList.value = []
    notificationForm.value.recipients = []
  }
}

async function loadBusinessRules() {
  try {
    const response = await settingsApi.getBusinessRules()
    const data = response.data?.data || response.data || response
    if (data) {
      businessRulesForm.value.overdueGracePeriod = data.overdueGracePeriod ?? businessRulesForm.value.overdueGracePeriod
      businessRulesForm.value.lateFeeCalculation = data.lateFeeCalculation || businessRulesForm.value.lateFeeCalculation
      businessRulesForm.value.lateFeeRate = data.lateFeeRate ?? businessRulesForm.value.lateFeeRate
      businessRulesForm.value.maxLateFee = data.maxLateFee ?? businessRulesForm.value.maxLateFee
      businessRulesForm.value.refundPeriod = data.refundPeriod ?? businessRulesForm.value.refundPeriod
      businessRulesForm.value.refundFeeRate = data.refundFeeRate ?? businessRulesForm.value.refundFeeRate
    }
    console.log('✅ 业务规则加载完成')
  } catch (error) {
    console.error('❌ 加载业务规则失败:', error)
  }
}

async function loadLogSettings() {
  try {
    const response = await settingsApi.getLogConfig()
    const data = response.data?.data || response.data || response
    if (data) {
      logForm.value.level = data.level || logForm.value.level
      logForm.value.retentionDays = data.retentionDays ?? logForm.value.retentionDays
      logForm.value.maxFileSize = data.maxFileSize ?? logForm.value.maxFileSize
      logForm.value.rotationEnabled = data.rotationEnabled ?? logForm.value.rotationEnabled
      logForm.value.outputTargets = data.outputTargets || logForm.value.outputTargets
    }
    console.log('✅ 日志设置加载完成')
  } catch (error) {
    console.error('❌ 加载日志设置失败:', error)
  }
}

async function loadSystemInfo(isAuto = false) {
  try {
    if (!isAuto) isRefreshing.value = true
    const [infoResponse, statusResponse] = await Promise.all([
      settingsApi.getSystemInfo(),
      settingsApi.getServiceStatus()
    ])

    const infoData = infoResponse.data?.data || infoResponse.data || infoResponse
    if (infoData) {
      systemInfo.value.name = infoData.name || systemInfo.value.name
      systemInfo.value.version = infoData.version || systemInfo.value.version
      systemInfo.value.environment = infoData.environment || systemInfo.value.environment
      systemInfo.value.startTime = infoData.startTime || systemInfo.value.startTime
      systemInfo.value.uptime = infoData.uptime || systemInfo.value.uptime
      updateGlobalSystemConfig({
        name: systemInfo.value.name,
        version: systemInfo.value.version,
        environment: systemInfo.value.environment
      })
    }

    const statusData = statusResponse.data?.data || statusResponse.data || statusResponse
    if (statusData && statusData.services) {
      serviceStatus.value = statusData.services
    }

    lastUpdateTime.value = new Date().toLocaleTimeString()
    console.log(`✅ [${isAuto ? '自动' : '手动'}] 系统信息加载完成: ${lastUpdateTime.value}`)
  } catch (error) {
    console.error('❌ 加载系统信息失败:', error)
  } finally {
    if (!isAuto) isRefreshing.value = false
  }
}

function handleLogoSuccess(response: any, file: any) {
  basicForm.value.logoUrl = URL.createObjectURL(file.raw)
  ElMessage.success('Logo上传成功')
}

function beforeLogoUpload(file: any) {
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

async function testEmailConnection() {
  try {
    ElMessage.info('正在测试邮件连接...')
    await settingsApi.testEmailConfig({
      testEmail: emailForm.value.emailAccount,
      config: {
        smtpServer: emailForm.value.smtpServer,
        smtpPort: emailForm.value.smtpPort,
        emailAccount: emailForm.value.emailAccount,
        emailPassword: emailForm.value.emailPassword,
        senderName: emailForm.value.senderName,
        secureConnection: emailForm.value.secureConnection
      }
    })
    ElMessage.success('邮件测试发送成功，请检查收件箱')
  } catch (error: any) {
    console.error('邮件连接测试失败:', error)
    const errorMsg = error.response?.data?.message || error.message || '邮件连接测试失败'
    ElMessage.error(errorMsg)
  }
}

async function handleSave() {
  // 对安全设置变更进行二次确认 (Rule 18: 敏感操作二次确认)
  if (activeTab.value === 'security') {
    confirmSensitiveAction(() => {
      executeSave()
    })
  } else {
    executeSave()
  }
}

async function executeSave() {
  const sensitiveTabs = ['payment', 'security', 'email']
  
  if (sensitiveTabs.includes(activeTab.value)) {
    confirmSensitiveAction(async () => {
      await performSave()
    })
  } else {
    await performSave()
  }
}

async function performSave() {
  try {
    console.log('💾 保存系统设置...', activeTab.value)
    loading.value = true

    switch (activeTab.value) {
      case 'basic':
        await saveBasicSettings()
        break
      case 'payment':
        await savePaymentSettings()
        break
      case 'email':
        await saveEmailSettings()
        break
      case 'security':
        await saveSecuritySettings()
        break
      case 'notification':
        await saveNotificationSettings()
        break
      case 'businessRules':
        await saveBusinessRules()
        break
      case 'log':
        await saveLogSettings()
        break
      case 'systemInfo':
        // 系统信息通常是只读的，或者是刷新操作，这里可以不做任何事或者提示
        ElMessage.info('系统信息为只读页面')
        return
      default:
        console.warn('未知的设置标签页:', activeTab.value)
    }

    ElMessage.success('设置保存成功')
  } catch (error) {
    console.error('❌ 保存系统设置失败:', error)
    ElMessage.error('保存系统设置失败: ' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

async function saveBasicSettings() {
  await settingsApi.updateConfigs({
    configs: {
      'system.name': basicForm.value.systemName,
      'system.theme': basicForm.value.theme,
      'system.language': basicForm.value.language
    },
    reason: '更新系统基本设置'
  })
  await loadSystemInfo()
}

async function savePaymentSettings() {
  // 1. 保存通用支付配置
  await settingsApi.updateConfigs({
    configs: {
      'payment.enabled_methods': paymentForm.value.enabledPayments,
      'payment.default_method': paymentForm.value.defaultPayment
    },
    reason: '更新支付方式设置'
  })

  // 2. 保存各支付渠道配置
  const methods = ['alipay', 'wechat', 'unionpay']
  for (const method of methods) {
    // @ts-ignore
    const config = { ...paymentForm.value.config[method] }
    // 如果密钥为空，则不更新密钥，防止覆盖为控制
    if (!config.apiKey) {
      delete config.apiKey
    }
    await settingsApi.updatePaymentConfig(method, config)
  }
}

async function saveEmailSettings() {
  const config: any = {
    smtpServer: emailForm.value.smtpServer,
    smtpPort: emailForm.value.smtpPort,
    emailAccount: emailForm.value.emailAccount,
    senderName: emailForm.value.senderName,
    secureConnection: emailForm.value.secureConnection
  }
  
  // 只有当密码不为空时才更新
  if (emailForm.value.emailPassword) {
    config.emailPassword = emailForm.value.emailPassword
  }
  
  await settingsApi.updateEmailConfig(config)
}

async function saveSecuritySettings() {
  // 映射密码强度到具体策略
  const strength = securityForm.value.passwordStrength
  const policy = { ...securityForm.value.passwordPolicy }
  
  if (strength === 'low') {
    policy.minLength = 6
    policy.requireSpecial = false
    policy.requireNumber = false
  } else if (strength === 'medium') {
    policy.minLength = 8
    policy.requireSpecial = false
    policy.requireNumber = true
  } else if (strength === 'high') {
    policy.minLength = 10
    policy.requireSpecial = true
    policy.requireNumber = true
  }

  const config = {
    ...securityForm.value,
    passwordPolicy: policy
  }

  // 验证逻辑
  if (config.loginFailCount < 3) {
    ElMessage.warning('登录失败次数不能少于3次')
    return
  }
  if (config.lockTime > 1440) {
    ElMessage.warning('锁定时间不能超过24小时(1440分钟)')
    return
  }
  if (config.sessionTimeout < 5) {
    ElMessage.warning('会话超时时间不能少于5分钟')
    return
  }

  await settingsApi.updateSecurityConfig(config)
}

async function saveNotificationSettings() {
  // 保存规则
  await settingsApi.updateNotificationRules({
    systemNotifications: notificationForm.value.systemNotifications,
    importantOperationNotify: notificationForm.value.importantOperationNotify,
    scheduledTaskNotify: notificationForm.value.scheduledTaskNotify,
    alertNotify: notificationForm.value.alertNotify
  })
  
  // 保存接收人
  await settingsApi.updateNotificationRecipients({
    recipients: notificationForm.value.recipients
  })
}

async function saveBusinessRules() {
  await settingsApi.updateBusinessRules(businessRulesForm.value)
}

async function saveLogSettings() {
  await settingsApi.updateLogConfig(logForm.value)
}

async function refreshServiceStatus() {
  try {
    ElMessage.info('正在刷新服务状态...')
    const response = await settingsApi.getServiceStatus()
    const data = response.data?.data || response.data || response
    if (data && data.services) {
      serviceStatus.value = data.services
    }
    ElMessage.success('服务状态刷新完成')
  } catch (error) {
    console.error('❌ 刷新服务状态失败:', error)
    ElMessage.error('刷新服务状态失败')
  }
}

function handleEditTemplate(row: any) {
  templateDialogTitle.value = '编辑通知模板'
  isEditingTemplate.value = true
  currentTemplateId.value = row.id
  templateForm.value = { ...row }
  templateDialogVisible.value = true
}

function handleAddTemplate() {
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

function handleDeleteTemplate(row: any) {
  ElMessageBox.confirm(
    `确定要删除通知模板"${row.name}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    deleteTemplate(row.id)
  }).catch(() => {
    // 用户取消删除
  })
}

/**
 * 批量删除通知模板
 */
function handleBatchDeleteTemplates() {
  if (selectedTemplates.value.length === 0) {
    ElMessage.warning('请选择要删除的模板')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedTemplates.value.length} 个通知模板吗？此操作不可恢复。`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    confirmSensitiveAction(async () => {
      try {
        const ids = selectedTemplates.value.map(t => Number(t.id))
        console.log('🗑️ 准备批量删除通知模板 IDs:', ids)
        const response = await settingsApi.batchDeleteNotificationTemplates(ids)
        
        // 拦截器在 success: true 时直接返回了 res.data
        // 如果能执行到这里，说明请求是成功的
        ElMessage.success(response.message || '批量删除成功')
        
        // 更新本地数据
        notificationTemplates.value = notificationTemplates.value.filter(
          t => !ids.includes(Number(t.id))
        )
        selectedTemplates.value = []
        console.log(`✅ 成功批量删除 ${ids.length} 个模板:`, ids)
      } catch (error) {
        console.error('❌ 批量删除模板失败:', error)
        // 拦截器已经处理了 ElMessage.error，这里只需要打印日志
      }
    })
  }).catch(() => {
    // 用户取消
  })
}

async function saveTemplate() {
  if (!templateForm.value.name || !templateForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    if (isEditingTemplate.value) {
      await settingsApi.updateNotificationTemplate(currentTemplateId.value, templateForm.value)
      const index = notificationTemplates.value.findIndex(t => t.id === currentTemplateId.value)
      if (index !== -1) {
        notificationTemplates.value[index] = { 
          ...notificationTemplates.value[index], 
          ...templateForm.value 
        }
      }
    } else {
      const response = await settingsApi.createNotificationTemplate(templateForm.value)
      // 兼容处理拦截器返回的数据结构
      // 根据后端返回结构 {success: true, data: {message: '...', template: {id: 123}}}
      // 拦截器返回 response 为 res.data，即 {message: '...', template: {id: 123}}
      const newId = response?.template?.id || response?.id || response?.data?.id || Date.now()
      notificationTemplates.value.push({
        id: newId,
        ...templateForm.value
      })
    }
    templateDialogVisible.value = false
    ElMessage.success('模板保存成功')
  } catch (error) {
    console.error('❌ 保存模板失败:', error)
    ElMessage.error('保存模板失败')
  }
}

async function deleteTemplate(id: number) {
  confirmSensitiveAction(async () => {
    try {
      await settingsApi.deleteNotificationTemplate(id)
      notificationTemplates.value = notificationTemplates.value.filter(t => t.id !== id)
      ElMessage.success('模板删除成功')
    } catch (error) {
      console.error('❌ 删除模板失败:', error)
      ElMessage.error('删除模板失败')
    }
  })
}

/**
 * 显示审计日志对话框
 */
function showAuditLogs() {
  auditLogsDialogVisible.value = true
  auditLogsQuery.value.page = 1
  fetchAuditLogs()
}

/**
 * 分页切换处理
 */
function handleAuditLogPageChange(page: number) {
  auditLogsQuery.value.page = page
  fetchAuditLogs()
}

/**
 * 获取审计日志数据
 * @param page 可选的页码参数，用于分页切换时传入
 */
async function fetchAuditLogs(page?: number) {
  // 如果传入了页码，更新当前页
  if (page !== undefined) {
    auditLogsQuery.value.page = page
  }

  auditLogsLoading.value = true
  try {
    const response = await settingsApi.getAuditLogs({
      page: auditLogsQuery.value.page,
      pageSize: auditLogsQuery.value.pageSize,
      configKey: auditLogsQuery.value.configKey || undefined
    })

    // 处理后端返回的双层嵌套结构 {success: true, data: {data: [], total: 0}}
    const result = response.data?.data || response.data || {}
    auditLogs.value = result.logs || []
    auditLogsTotal.value = result.total || 0

    console.log(`✅ 获取审计日志成功: ${auditLogs.value.length} 条，当前第 ${auditLogsQuery.value.page} 页`)
  } catch (error) {
    console.error('❌ 获取审计日志失败:', error)
    ElMessage.error('获取审计日志失败')
  } finally {
    auditLogsLoading.value = false
  }
}

/**
 * 格式化配置值用于显示
 * @param value 配置值
 */
function formatConfigValue(value: any): string {
  if (value === null || value === undefined) return '无'
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

/**
 * 二次确认敏感操作
 * @param action 确认后要执行的回调函数
 */
function confirmSensitiveAction(action: () => void) {
  pendingAction.value = action
  verifyPassword.value = ''
  verifyDialogVisible.value = true
}

/**
 * 处理二次验证密码
 */
async function handleVerifyPassword() {
  if (!verifyPassword.value) {
    ElMessage.warning('请输入管理员密码')
    return
  }

  verifyLoading.value = true
  try {
    const response = await adminAuthApi.verifyPassword({
      password: verifyPassword.value
    })
    
    // 关键位置打印日志方便控制台查看日志调试 (Rule 7)
    console.log('🔐 二次验证响应:', response)
    
    // 兼容处理拦截器返回的数据结构
    const isSuccess = response === true || response?.success === true
    
    if (isSuccess) {
      ElMessage.success('身份验证成功')
      verifyDialogVisible.value = false
      
      // 执行待办操作
      if (pendingAction.value) {
        pendingAction.value()
        pendingAction.value = null
      }
    } else {
      ElMessage.error(response?.message || '密码验证失败')
    }
  } catch (error: any) {
    console.error('❌ 身份验证失败:', error)
    const errorMsg = error.response?.data?.message || '身份验证失败，请检查密码是否正确'
    ElMessage.error(errorMsg)
  } finally {
    verifyLoading.value = false
  }
}

/**
 * 处理配置回滚
 * @param row 审计日志行
 */
async function handleRollback(row: any) {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要将配置项 [${row.configKey}] 回滚到变更前的版本吗？\n回滚后值将恢复为: ${formatConfigValue(row.oldValue)}`,
      '确认回滚',
      {
        confirmButtonText: '立即回滚',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (confirmResult === 'confirm') {
      auditLogsLoading.value = true
      const response = await settingsApi.rollbackConfig({
        configKey: row.configKey,
        targetVersion: row.version - 1, // 假设版本号是递增的，回滚到上一个版本
        reason: `从变更日志回滚 (变更ID: ${row.id})`
      })

      // 兼容处理拦截器返回的数据结构
      const isSuccess = response === true || response?.success === true

      if (isSuccess) {
        ElMessage.success('配置回滚成功')
        fetchAuditLogs()
        // 重新加载所有设置以同步 UI
        loadAllSettings()
      } else {
        ElMessage.error(response?.message || '回滚失败')
      }
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 配置回滚失败:', error)
      ElMessage.error('配置回滚失败: ' + (error.response?.data?.message || error.message))
    }
  } finally {
    auditLogsLoading.value = false
  }
}
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