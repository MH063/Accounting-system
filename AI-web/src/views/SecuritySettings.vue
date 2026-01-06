<template>
  <div class="security-settings">
    <div class="page-header">
      <h2>安全设置</h2>
      <p>管理您的账户安全和登录设置</p>
    </div>
    
    <div class="settings-content">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 账户安全 -->
        <el-tab-pane label="账户安全" name="account">
          <div class="setting-section">
            <h3>密码安全</h3>
            <div class="setting-item">
              <span class="setting-label">登录密码</span>
              <div class="setting-control">
                <span class="setting-desc">建议您定期更换密码以保护账户安全</span>
                <el-button type="primary" @click="showPasswordDialog = true" size="default">修改密码</el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">密码强度</span>
              <div class="setting-control">
                <span class="setting-desc">当前密码强度：{{ passwordStrength }}</span>
                <div class="strength-indicator">
                  <div class="strength-bar" :class="strengthClass"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>两步验证</h3>
            <div class="setting-item">
              <span class="setting-label">两步验证</span>
              <div class="setting-control">
                <span class="setting-desc">{{ twoFactorEnabled ? '已开启' : '未开启' }}</span>
                <el-switch v-model="intendedTwoFactorState" @change="(val: boolean) => toggleTwoFactor(val)" size="default" :loading="twoFactorLoading" />
              </div>
            </div>
            
            <div class="setting-item" v-if="twoFactorEnabled">
              <span class="setting-label">备用验证码</span>
              <div class="setting-control">
                <span class="setting-desc">{{ backupCodesCount }}个备用验证码可用</span>
                <el-button @click="showBackupCodesDialog = true" size="default">查看</el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">手机验证</span>
              <div class="setting-control">
                <span class="setting-desc">{{ phoneVerified ? '已绑定手机：' + maskedPhone : '未绑定手机' }}</span>
                <el-button :type="phoneVerified ? 'default' : 'primary'" @click="showPhoneDialog = true" size="default">
                  {{ phoneVerified ? '更换' : '绑定' }}
                </el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">邮箱验证</span>
              <div class="setting-control">
                <span class="setting-desc">{{ emailVerified ? '已绑定邮箱：' + maskedEmail : '未绑定邮箱' }}</span>
                <el-button :type="emailVerified ? 'default' : 'primary'" @click="showEmailDialog = true" size="default">
                  {{ emailVerified ? '更换' : '绑定' }}
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 生物识别认证 -->
          <div class="setting-section">
            <h3>生物识别认证</h3>
            <div class="setting-item">
              <span class="setting-label">指纹识别</span>
              <div class="setting-control">
                <span class="setting-desc">{{ fingerprintEnabled ? '已启用' : '未启用' }}</span>
                <el-switch 
                  v-model="fingerprintEnabled" 
                  @change="(val: boolean) => toggleBiometric('fingerprint', val)" 
                  size="default" 
                  :loading="biometricLoading.fingerprint"
                  :disabled="!biometricAvailable"
                />
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">面部识别</span>
              <div class="setting-control">
                <span class="setting-desc">{{ faceRecognitionEnabled ? '已启用' : '未启用' }}</span>
                <el-switch 
                  v-model="faceRecognitionEnabled" 
                  @change="(val: boolean) => toggleBiometric('face', val)" 
                  size="default" 
                  :loading="biometricLoading.face"
                  :disabled="!biometricAvailable"
                />
              </div>
            </div>
            
            <div class="setting-item" v-if="!biometricAvailable">
              <span class="setting-label">设备支持</span>
              <div class="setting-control">
                <span class="setting-desc" style="color: #f56c6c;">当前设备不支持生物识别功能</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 登录管理 -->
        <el-tab-pane label="登录管理" name="login">
          <div class="setting-section">
            <h3>设备管理</h3>
            <div class="setting-item">
              <span class="setting-label">登录设备</span>
              <div class="setting-control">
                <span class="setting-desc">查看和管理您的登录设备</span>
                <el-button @click="showDeviceDialog = true" size="default">管理设备</el-button>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>登录记录</h3>
            <div class="setting-item">
              <span class="setting-label">最近登录</span>
              <div class="setting-control">
                <span class="setting-desc">查看最近30天的登录记录</span>
                <el-button @click="showLoginHistory = true" size="default">查看记录</el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">详细历史</span>
              <div class="setting-control">
                <span class="setting-desc">详细的登录记录和IP信息</span>
                <el-button @click="showDetailedLoginHistory = true" size="default">详细记录</el-button>
              </div>
            </div>
          </div>
          
          <!-- 登录安全 -->
          <div class="setting-section">
            <h3>登录安全</h3>
            <div class="setting-item">
              <span class="setting-label">登录频率限制</span>
              <div class="setting-control">
                <span class="setting-desc">防止暴力破解攻击 {{ rateLimitStatus }}</span>
                <el-switch 
                  v-model="loginRateLimit" 
                  @change="(val: boolean) => toggleLoginRateLimit(val)" 
                  size="default" 
                  :loading="rateLimitLoading"
                />
              </div>
            </div>
            <div class="setting-item" v-if="loginRateLimit">
              <span class="setting-label">频率限制详情</span>
              <div class="setting-control">
                <span class="setting-desc">{{ rateLimitDetails }}</span>
                <el-button @click="resetRateLimitCounter" size="default" type="warning">重置计数器</el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">失败尝试锁定</span>
              <div class="setting-control">
                <span class="setting-desc">连续失败{{ maxFailedAttempts }}次后锁定账户</span>
                <el-button @click="showLockoutSettings = true" size="default">设置</el-button>
              </div>
            </div>
            
            <!-- 新增：账户状态 -->
            <div class="setting-item">
              <span class="setting-label">账户状态</span>
              <div class="setting-control">
                <div class="account-status">
                  <el-tag :type="accountLocked ? 'danger' : 'success'" size="default">
                    {{ accountLocked ? '已锁定' : '正常' }}
                  </el-tag>
                  <span v-if="accountLocked" class="status-normal">账户因安全原因被锁定</span>
                  <span v-else class="status-normal">账户可正常使用</span>
                </div>
                <el-button 
                  v-if="accountLocked" 
                  @click="unlockCurrentUserAccount" 
                  type="danger" 
                  size="default"
                  :loading="unlockLoading"
                >
                  解锁账户
                </el-button>
              </div>
            </div>
            
            <!-- 锁定状态 -->
            <div class="setting-item">
              <span class="setting-label">锁定状态</span>
              <div class="setting-control">
                <div class="lock-status-info">
                  <div class="lock-status-row">
                    <span class="lock-status-label">状态:</span>
                    <el-tag :type="accountLocked ? 'danger' : 'success'" size="small">
                      {{ accountLocked ? '已锁定' : '正常' }}
                    </el-tag>
                  </div>
                  <div v-if="accountLocked" class="lock-status-row">
                    <span class="lock-status-label">剩余时间:</span>
                    <span class="lock-timer">{{ formatRemainingTime(remainingLockTime) }}</span>
                  </div>
                  <div class="lock-status-row">
                    <span class="lock-status-label">锁定规则:</span>
                    <span>连续失败{{ maxFailedAttempts }}次后锁定{{ lockoutSettings.lockoutDuration }}分钟</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 锁定详情 -->
            <div class="setting-item" v-if="accountLocked">
              <span class="setting-label">锁定详情</span>
              <div class="setting-control">
                <div class="lock-details-info">
                  <div class="lock-detail-row">
                    <span class="lock-detail-label">锁定原因:</span>
                    <span>{{ lockReason !== '账户正常' ? lockReason : '安全策略锁定' }}</span>
                  </div>
                  <div class="lock-detail-row">
                    <span class="lock-detail-label">影响范围:</span>
                    <span>无法登录系统，当前账户相关操作受限，包括但不限于：无法访问个人资料、无法进行费用管理、无法查看账单等所有需要认证的操作</span>
                  </div>
                  <div class="lock-detail-row">
                    <span class="lock-detail-label">解除方式:</span>
                    <span>等待锁定时间结束或管理员手动解锁</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 账户状态说明 -->
            <div class="setting-item" v-else>
              <span class="setting-label">账户状态</span>
              <div class="setting-control">
                <div class="account-status-info">
                  <span class="status-text">账户当前可正常使用，未受到任何安全限制</span>
                </div>
              </div>
            </div>
            
            <!-- 手动操作 -->
            <div class="setting-item">
              <span class="setting-label">手动操作</span>
              <div class="setting-control">
                <el-button 
                  v-if="!accountLocked" 
                  type="warning" 
                  @click="manuallyLockAccount"
                  :loading="lockOperationLoading"
                  size="default"
                >
                  手动锁定
                </el-button>
                <el-button 
                  v-else 
                  type="success" 
                  @click="unlockCurrentUserAccount"
                  :loading="unlockLoading"
                  size="default"
                >
                  解锁账户
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 账号保护 -->
        <el-tab-pane label="账号保护" name="protection">
          <div class="setting-section">
            <h3>安全保护</h3>
            <div class="setting-item">
              <span class="setting-label">登录保护</span>
              <div class="setting-control">
                <span class="setting-desc">在新设备登录时需要进行额外验证</span>
                <el-switch v-model="loginProtection" @change="toggleLoginProtection" size="default" />
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">异常登录提醒</span>
              <div class="setting-control">
                <span class="setting-desc">检测到异常登录时发送提醒通知</span>
                <el-switch v-model="abnormalLoginAlert" @change="toggleAbnormalLoginAlert" size="default" />
              </div>
            </div>
            
            <!-- 会话令牌状态 -->
            <div class="setting-item">
              <span class="setting-label">当前会话状态</span>
              <div class="setting-control">
                <div class="token-status-info">
                  <span class="setting-desc">会话剩余有效期：</span>
                  <el-tag :type="tokenStatusType" size="small" effect="plain" class="remaining-time-tag">
                    {{ formattedRemainingTime }}
                  </el-tag>
                  <span v-if="tokenReminderMessage" :class="['token-reminder', tokenStatusType]">
                    {{ tokenReminderMessage }}
                  </span>
                </div>
                <el-button 
                  type="primary" 
                  size="default" 
                  link 
                  @click="manualRefreshToken" 
                  :loading="refreshingToken"
                >
                  手动刷新
                </el-button>
              </div>
            </div>
            
            <!-- 客户端安全检测 -->
            <div class="setting-item">
              <span class="setting-label">客户端检测</span>
              <div class="setting-control">
                <div class="client-security-info">
                  <div class="client-info-grid">
                    <div class="info-cell">
                      <span class="info-label">浏览器:</span>
                      <span class="info-value">{{ clientInfo.browser }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="info-label">操作系统:</span>
                      <span class="info-value">{{ clientInfo.os }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="info-label">IP 地址:</span>
                      <span class="info-value">{{ clientInfo.ip }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="info-label">语言/时区:</span>
                      <span class="info-value">{{ clientInfo.language }} / {{ clientInfo.timezone }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="info-label">安全环境:</span>
                      <el-tag :type="clientInfo.isSecure ? 'success' : 'danger'" size="small">
                        {{ clientInfo.isSecure ? '加密连接 (HTTPS)' : '非加密连接' }}
                      </el-tag>
                    </div>
                  </div>
                  
                  <!-- 安全提醒列表 -->
                  <div class="security-reminders-list" v-if="securityReminders.length > 0">
                    <div 
                      v-for="(reminder, index) in securityReminders" 
                      :key="index" 
                      :class="['security-reminder-item', reminder.type]"
                    >
                      <el-icon><component :is="reminder.icon" /></el-icon>
                      <span class="reminder-text">{{ reminder.message }}</span>
                    </div>
                  </div>
                </div>
                <el-button size="default" @click="initializeClientInfo">重新检测</el-button>
              </div>
            </div>

            <!-- 会话管理 -->
            <div class="setting-item">
              <span class="setting-label">自动登出</span>
              <div class="setting-control">
                <span class="setting-desc">无操作{{ sessionTimeout }}分钟后自动登出</span>
                <el-button @click="openSessionTimeoutDialog" size="default">设置</el-button>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>高级设置</h3>
            <div class="setting-item">
              <span class="setting-label">登录限制</span>
              <div class="setting-control">
                <span class="setting-desc">限制同一时间的登录设备数量</span>
                <el-button @click="showLoginLimitDialog = true" size="default">设置</el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">安全问题</span>
              <div class="setting-control">
                <span class="setting-desc">设置安全问题用于身份验证</span>
                <el-button @click="showSecurityQuestionDialog = true" size="default">设置</el-button>
              </div>
            </div>
            
            <!-- 数据加密 -->
            <div class="setting-item">
              <span class="setting-label">数据加密</span>
              <div class="setting-control">
                <span class="setting-desc">{{ dataEncryptionEnabled ? '已启用端到端加密' : '未启用端到端加密' }}</span>
                <el-switch v-model="dataEncryptionEnabled" @change="toggleDataEncryption" size="default" />
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 安全日志 -->
        <el-tab-pane label="安全日志" name="logs">
          <div class="setting-section">
            <h3>操作记录</h3>
            <div class="setting-item">
              <span class="setting-label">最近操作</span>
              <div class="setting-control">
                <span class="setting-desc">查看最近的安全相关操作</span>
                <el-button @click="openSecurityLog" size="default">查看日志</el-button>
              </div>
            </div>
            
            <!-- 导出日志 -->
            <div class="setting-item">
              <span class="setting-label">导出日志</span>
              <div class="setting-control">
                <span class="setting-desc">导出安全日志用于审计</span>
                <el-button @click="exportSecurityLog" size="default">导出</el-button>
              </div>
            </div>
          </div>
          
          <!-- 安全评估 -->
            <div class="setting-section">
            <h3>安全评估</h3>
            <div class="setting-item">
              <span class="setting-label">安全评分</span>
              <div class="setting-control">
                <span class="setting-desc">您的账户安全评分为 {{ securityScore }} 分</span>
                <el-button @click="performSecurityCheck" size="default">安全检查</el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">风险提醒</span>
              <div class="setting-control">
                <span class="setting-desc">{{ securityRiskLevel }}</span>
                <el-button type="warning" @click="showRiskDetails = true" size="default" v-if="securityRiskLevel !== '低风险'">查看详情</el-button>
              </div>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">历史记录</span>
              <div class="setting-control">
                <span class="setting-desc">查看安全评估历史记录</span>
                <el-button @click="showSecurityAssessmentHistory = true" size="default">查看历史</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 修改密码对话框 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="500px">
      <el-form :model="passwordForm" label-width="80px" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password @input="updatePasswordStrength" placeholder="请输入新密码" />
          <div class="password-strength-indicator" v-if="passwordForm.newPassword">
            <div class="strength-label">密码强度：</div>
            <div class="strength-bar-container">
              <div 
                class="strength-bar" 
                :class="{
                  'strength-weak': calculatedStrength.level === '弱',
                  'strength-medium': calculatedStrength.level === '中',
                  'strength-strong': calculatedStrength.level === '强'
                }"
                :style="{ width: calculatedStrength.score * 33.33 + '%' }"
              ></div>
            </div>
            <div class="strength-text" :class="'text-' + calculatedStrength.level.toLowerCase()">
              {{ calculatedStrength.level }}
            </div>
          </div>
          
          <!-- 密码要求检查 -->
          <div class="password-requirements" v-if="passwordForm.newPassword">
            <div class="requirements-title">密码要求检查：</div>
            <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.minLength }">
              <span class="requirement-icon">{{ calculatedStrength.requirements.minLength ? '✓' : '○' }}</span>
              <span class="requirement-text">至少8个字符</span>
            </div>
            <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.lowercase }">
              <span class="requirement-icon">{{ calculatedStrength.requirements.lowercase ? '✓' : '○' }}</span>
              <span class="requirement-text">小写字母（a-z）</span>
            </div>
            <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.uppercase }">
              <span class="requirement-icon">{{ calculatedStrength.requirements.uppercase ? '✓' : '○' }}</span>
              <span class="requirement-text">大写字母（A-Z）</span>
            </div>
            <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.number }">
              <span class="requirement-icon">{{ calculatedStrength.requirements.number ? '✓' : '○' }}</span>
              <span class="requirement-text">数字（0-9）</span>
            </div>
            <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.special }">
              <span class="requirement-icon">{{ calculatedStrength.requirements.special ? '✓' : '○' }}</span>
              <span class="requirement-text">特殊字符（中文：，。！？、；：「」『』（）【】《》〈〉——…·· 英文：!@#$%^&*()_+-=[]{}|;:'",.&lt;&gt;?/`~）</span>
            </div>
            <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.noConsecutive }">
              <span class="requirement-icon">{{ calculatedStrength.requirements.noConsecutive ? '✓' : '○' }}</span>
              <span class="requirement-text">连续出现的字符不超过两个</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword" :disabled="!isPasswordValid">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 绑定手机对话框 -->
    <el-dialog v-model="showPhoneDialog" title="绑定手机" width="400px">
      <el-form :model="phoneForm" label-width="80px">
        <el-form-item label="手机号">
          <el-input v-model="phoneForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="验证码">
          <div class="verify-code-group">
            <el-input v-model="phoneForm.code" placeholder="请输入验证码" />
            <el-button type="primary" :disabled="smsCooldown > 0" @click="sendPhoneCode">
              {{ smsCooldown > 0 ? `${smsCooldown}秒后重试` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPhoneDialog = false">取消</el-button>
        <el-button type="primary" @click="bindPhone">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 绑定邮箱对话框 -->
    <el-dialog v-model="showEmailDialog" title="绑定邮箱" width="400px">
      <el-form :model="emailForm" label-width="80px">
        <el-form-item label="邮箱">
          <el-input v-model="emailForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="验证码">
          <div class="verify-code-group">
            <el-input v-model="emailForm.code" placeholder="请输入验证码" />
            <el-button type="primary" :disabled="emailCooldown > 0" @click="sendEmailCode">
              {{ emailCooldown > 0 ? `${emailCooldown}秒后重试` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEmailDialog = false">取消</el-button>
        <el-button type="primary" @click="bindEmail">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 设备管理对话框 -->
    <el-dialog v-model="showDeviceDialog" title="设备管理" width="700px">
      <div class="device-management-header">
        <el-button type="primary" @click="refreshDeviceList" size="small">刷新列表</el-button>
        <el-button type="danger" @click="removeAllDevices" size="small">移除所有设备</el-button>
      </div>
      <div class="device-list">
        <div class="device-item" v-for="device in loginDevices" :key="device.id">
          <div class="device-info">
            <div class="device-name">
              {{ device.name }}
              <el-tag v-if="device.sessionCount > 1" size="small" type="info" class="session-count-tag">
                {{ device.sessionCount }} 个会话
              </el-tag>
            </div>
            <div class="device-time">最后登录: {{ device.lastLogin }}</div>
            <div class="device-location">位置: {{ device.location }}</div>
            <div class="device-ip" v-if="device.ip">IP: {{ device.ip }}</div>
            <div class="device-conflict-warning" v-if="device.hasIpConflict">
              <el-tag type="warning" size="small" effect="dark">
                <el-icon><Warning /></el-icon> IP 冲突：其他用户正使用此 IP
              </el-tag>
            </div>
            <div class="device-status" :class="device.current ? 'current' : 'other'">
              {{ device.current ? '当前设备' : '其他设备' }}
            </div>
          </div>
          <div class="device-actions">
            <el-button 
              v-if="!device.current" 
              type="danger" 
              size="small" 
              @click="removeDevice(device)"
            >
              移除
            </el-button>
            <el-button 
              v-else 
              type="success" 
              size="small" 
              disabled
            >
              当前使用
            </el-button>
          </div>
        </div>
      </div>
      <div class="device-summary">
        <span>共 {{ loginDevices.length }} 个设备，其中 {{ currentDeviceCount }} 个当前设备</span>
      </div>
    </el-dialog>
    
    <!-- 登录历史对话框 -->
    <el-dialog v-model="showLoginHistory" title="登录历史" width="800px">
      <div class="login-history-filters">
        <el-form :inline="true" :model="loginHistoryFilter" class="login-history-filter-form">
          <el-form-item label="搜索">
            <el-input 
              v-model="loginHistoryFilter.keyword" 
              placeholder="设备名/IP/位置" 
              size="small" 
              clearable
              @keydown.enter.prevent="filterLoginHistory"
            />
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="loginHistoryFilter.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="filterLoginHistory" size="small">搜索</el-button>
            <el-button @click="resetLoginHistoryFilter" size="small">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="login-history-header">
        <div class="login-history-controls">
          <el-button type="primary" @click="exportLoginHistory" size="small">导出记录</el-button>
          <el-button @click="clearLoginHistory" size="small">清空记录</el-button>
          <el-button v-if="hasLoginHistoryFilters || hasLoginHistorySort" @click="clearAllLoginHistoryFilters" size="small" type="warning">清除筛选和排序</el-button>
        </div>
        <div class="login-history-stats">
          <span>总计 {{ loginHistoryPagination.total }} 条记录</span>
          <span v-if="hasLoginHistoryFilters" class="active-filter">已筛选</span>
          <span v-if="hasLoginHistorySort" class="active-filter">已排序</span>
        </div>
      </div>
      <div class="login-history-table">
        <el-table 
          v-loading="loginHistoryLoading"
          :data="loginHistory" 
          style="width: 100%" 
          max-height="400" 
          @sort-change="(sort: { prop: string; order: string }) => handleLoginHistorySort(sort)"
        >
          <el-table-column prop="time" label="登录时间" width="180" sortable>
            <template #default="scope">
              <span class="login-time">{{ scope.row.time }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="device" label="设备信息" width="180" sortable>
            <template #default="scope">
              <span class="login-device">{{ scope.row.device }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP地址" width="150" sortable>
            <template #default="scope">
              <span class="login-ip">{{ scope.row.ip }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置" sortable>
            <template #default="scope">
              <span class="login-location">{{ scope.row.location }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button type="danger" size="small" @click="deleteLoginRecord(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container" style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <el-pagination
            v-model:current-page="loginHistoryPagination.currentPage"
            v-model:page-size="loginHistoryPagination.pageSize"
            :total="loginHistoryPagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchLoginHistoryData"
            @current-change="handleLoginHistoryPageChange"
            small
          />
        </div>
      </div>
    </el-dialog>
    
    <!-- 安全日志对话框 -->
    <el-dialog
      v-model="showSecurityLog"
      title="安全日志"
      width="600px"
    >
      <div class="log-container">
        <div v-if="securityLogs.length === 0" class="no-logs">
          暂无安全日志
        </div>
        <div class="log-item" v-for="log in securityLogs" :key="log.id" v-else>
          <div class="log-time">{{ log.time }}</div>
          <div class="log-action">{{ log.action }}</div>
          <div class="log-ip">IP: {{ log.ip }}</div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 备用验证码对话框 -->
    <el-dialog
      v-model="showBackupCodesDialog"
      title="备用验证码"
      width="500px"
    >
      <div class="backup-codes-container">
        <p class="backup-codes-desc">请妥善保存这些备用验证码，当无法接收短信或邮件时使用</p>
        <div class="backup-codes-grid">
          <div 
            class="backup-code-item" 
            v-for="(code, index) in backupCodes" 
            :key="index"
            @click="copyBackupCode(code)"
          >
            <span class="code-number">{{ index + 1 }}.</span>
            <span class="code-text">{{ code }}</span>
            <span class="copy-icon">📋</span>
          </div>
        </div>
        <div class="backup-codes-actions">
          <el-button @click="regenerateBackupCodes" type="primary">重新生成</el-button>
          <el-button @click="showBackupCodesDialog = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>
    
    <!-- 登录限制对话框 -->
    <el-dialog
      v-model="showLoginLimitDialog"
      title="登录限制设置"
      width="600px"
    >
      <el-form :model="loginLimitForm" label-width="120px">
        <el-form-item label="启用设备限制">
          <el-switch v-model="loginLimitForm.enabled" />
          <span class="form-desc">启用后可以限制同时登录的设备数量</span>
        </el-form-item>
        <el-form-item label="最大设备数" v-if="loginLimitForm.enabled">
          <el-input-number 
            v-model="loginLimitForm.maxDevices" 
            :min="1" 
            :max="10"
            controls-position="right"
          />
          <span class="form-desc">同时在线的最大设备数量</span>
        </el-form-item>
        <el-form-item label="自动登出" v-if="loginLimitForm.enabled">
          <el-switch v-model="loginLimitForm.autoLogout" />
          <span class="form-desc">超过设备限制时自动登出最早登录的设备</span>
        </el-form-item>
        
        <el-divider v-if="loginLimitForm.enabled" />
        
        <!-- 当前登录设备信息 -->
        <div v-if="loginLimitForm.enabled" class="current-devices-info">
          <h4>当前登录设备</h4>
          <p>当前活跃设备数量：{{ activeDeviceCount }} / {{ loginLimitForm.maxDevices }}</p>
          
          <el-table :data="currentDeviceSessions" style="width: 100%" size="small">
            <el-table-column prop="userAgent" label="设备信息" show-overflow-tooltip>
              <template #default="scope">
                {{ getDeviceDisplayName(scope.row.userAgent) }}
              </template>
            </el-table-column>
            <el-table-column prop="ipAddress" label="IP地址" width="120">
              <template #default="scope">
                {{ scope.row.ipAddress }}
                <el-tooltip v-if="scope.row.hasIpConflict" content="检测到其他用户正在使用此 IP 登录" placement="top">
                  <el-icon class="conflict-icon" color="#E6A23C"><WarningFilled /></el-icon>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="loginTime" label="登录时间" width="160">
              <template #default="scope">
                {{ formatDateTime(scope.row.loginTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="isActive" label="状态" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.isActive ? 'success' : 'danger'" size="small">
                  {{ scope.row.isActive ? '活跃' : '已登出' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button 
                  v-if="scope.row.isActive && scope.row.id !== currentDeviceId" 
                  type="danger" 
                  size="small" 
                  @click="handleLogoutDevice(scope.row.id)"
                >
                  登出
                </el-button>
                <el-tag v-else-if="scope.row.id === currentDeviceId" type="info" size="small">当前设备</el-tag>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="device-actions" v-if="currentDeviceSessions.length > 0">
            <el-button type="danger" size="small" @click="handleLogoutAllDevices">登出所有设备</el-button>
          </div>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLoginLimitDialog = false">取消</el-button>
          <el-button type="primary" @click="saveLoginLimit">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 安全问题对话框 -->
    <el-dialog
      v-model="showSecurityQuestionDialog"
      title="设置安全问题"
      width="600px"
    >
      <el-form :model="securityQuestionForm" label-width="120px">
        <el-form-item label="问题1">
          <el-select v-model="securityQuestionForm.question1" placeholder="选择安全问题">
            <el-option label="您的出生地是哪里？" value="birthplace" />
            <el-option label="您母亲的姓名是？" value="mother_name" />
            <el-option label="您的第一个宠物名字是？" value="first_pet" />
            <el-option label="您最喜欢的老师是？" value="favorite_teacher" />
            <el-option label="您的第一辆车是？" value="first_car" />
          </el-select>
        </el-form-item>
        <el-form-item label="答案1">
          <el-input v-model="securityQuestionForm.answer1" placeholder="请输入答案" />
        </el-form-item>
        
        <el-form-item label="问题2">
          <el-select v-model="securityQuestionForm.question2" placeholder="选择安全问题">
            <el-option label="您最喜欢的颜色是？" value="favorite_color" />
            <el-option label="您父亲的姓名是？" value="father_name" />
            <el-option label="您最好的朋友是？" value="best_friend" />
            <el-option label="您最喜欢的食物是？" value="favorite_food" />
            <el-option label="您的第一个工作是？" value="first_job" />
          </el-select>
        </el-form-item>
        <el-form-item label="答案2">
          <el-input v-model="securityQuestionForm.answer2" placeholder="请输入答案" />
        </el-form-item>
        
        <el-form-item label="问题3">
          <el-select v-model="securityQuestionForm.question3" placeholder="选择安全问题">
            <el-option label="您最喜欢的运动是？" value="favorite_sport" />
            <el-option label="您最难忘的旅行是？" value="memorable_trip" />
            <el-option label="您最喜欢的电影是？" value="favorite_movie" />
            <el-option label="您小时候的昵称是？" value="childhood_nickname" />
            <el-option label="您最喜欢的书籍是？" value="favorite_book" />
          </el-select>
        </el-form-item>
        <el-form-item label="答案3">
          <el-input v-model="securityQuestionForm.answer3" placeholder="请输入答案" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSecurityQuestionDialog = false">取消</el-button>
          <el-button type="primary" @click="saveSecurityQuestions">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 详细登录历史对话框 -->
    <el-dialog
      v-model="showDetailedLoginHistory"
      title="详细登录历史"
      width="900px"
    >
      <div class="detailed-login-history-filters">
        <el-form :inline="true" :model="detailedLoginHistoryFilter" class="detailed-login-history-filter-form">
          <el-form-item label="搜索">
            <el-input 
              v-model="detailedLoginHistoryFilter.keyword" 
              placeholder="设备名/IP/位置/浏览器" 
              size="small" 
              clearable
              @keydown.enter.prevent="filterDetailedLoginHistory"
            />
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="detailedLoginHistoryFilter.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="detailedLoginHistoryFilter.status" size="small" clearable placeholder="请选择">
              <el-option label="全部" value=""></el-option>
              <el-option label="成功" value="成功"></el-option>
              <el-option label="失败" value="失败"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="filterDetailedLoginHistory" size="small">搜索</el-button>
            <el-button @click="resetDetailedLoginHistoryFilter" size="small">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="detailed-login-history-header">
        <div class="detailed-login-controls">
          <el-button type="primary" @click="exportDetailedLoginHistory" size="small">导出详细记录</el-button>
          <el-button @click="clearDetailedLoginHistory" size="small">清空详细记录</el-button>
          <el-button v-if="hasDetailedLoginHistoryFilters || hasDetailedLoginHistorySort" @click="clearAllDetailedLoginHistoryFilters" size="small" type="warning">清除筛选和排序</el-button>
        </div>
        <div class="detailed-login-stats">
          <span>总计 {{ detailedLoginHistoryPagination.total }} 条详细记录</span>
          <span v-if="hasDetailedLoginHistoryFilters" class="active-filter">已筛选</span>
          <span v-if="hasDetailedLoginHistorySort" class="active-filter">已排序</span>
        </div>
      </div>
      <div class="detailed-login-history-table">
        <el-table 
          v-loading="detailedLoginHistoryLoading"
          :data="detailedLoginHistory" 
          style="width: 100%" 
          max-height="400" 
          @sort-change="(sort: { prop: string; order: string }) => handleDetailedLoginHistorySort(sort)"
        >
          <el-table-column prop="time" label="登录时间" width="180" sortable>
            <template #default="scope">
              <span class="login-time">{{ scope.row.time }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="device" label="设备信息" width="150" sortable>
            <template #default="scope">
              <span class="login-device">{{ scope.row.device }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="browser" label="浏览器" width="150" sortable>
            <template #default="scope">
              <span class="login-browser">{{ scope.row.browser }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP地址" width="150" sortable>
            <template #default="scope">
              <span class="login-ip">{{ scope.row.ip }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置" width="120" sortable>
            <template #default="scope">
              <span class="login-address">{{ scope.row.location }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80" sortable>
            <template #default="scope">
              <el-tag :type="scope.row.status === '成功' ? 'success' : 'danger'">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button type="danger" size="small" @click="deleteDetailedLoginRecord(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container" style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <el-pagination
            v-model:current-page="detailedLoginHistoryPagination.currentPage"
            v-model:page-size="detailedLoginHistoryPagination.pageSize"
            :total="detailedLoginHistoryPagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchDetailedLoginHistoryData"
            @current-change="handleDetailedLoginHistoryPageChange"
            small
          />
        </div>
      </div>
    </el-dialog>
    
    <!-- 锁定设置对话框 -->
    <el-dialog
      v-model="showLockoutSettings"
      title="账户锁定设置"
      width="500px"
    >
      <el-form :model="lockoutSettings" label-width="120px">
        <el-form-item label="最大失败次数">
          <el-input-number 
            v-model="lockoutSettings.maxFailedAttempts" 
            :min="1" 
            :max="10"
            controls-position="right"
          />
          <span class="form-desc">连续失败多少次后锁定账户</span>
        </el-form-item>
        <el-form-item label="锁定时长">
          <el-input-number 
            v-model="lockoutSettings.lockoutDuration" 
            :min="1" 
            :max="1440"
            controls-position="right"
          />
          <span class="form-desc">锁定时长（分钟）</span>
        </el-form-item>
        <el-form-item label="重置计数器">
          <el-switch v-model="lockoutSettings.resetCounter" />
          <span class="form-desc">成功登录后重置失败计数器</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelLockoutSettings">取消</el-button>
          <el-button type="primary" @click="saveLockoutSettings">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 会话超时对话框 -->
    <el-dialog
      v-model="showSessionTimeoutDialog"
      title="会话超时设置"
      width="500px"
    >
      <div class="session-timeout-validation" v-if="showSessionTimeoutDialog">
        <el-alert
          :title="realTimeValidation.message"
          :type="realTimeValidation.type"
          :closable="false"
          show-icon
          class="validation-alert"
        />
      </div>

      <el-form :model="sessionTimeoutForm" label-width="120px" class="session-timeout-form">
        <el-form-item label="超时时长">
          <el-slider 
            v-model="sessionTimeoutForm.timeout" 
            :min="1" 
            :max="120" 
            show-input 
            :show-input-controls="false"
          />
          <span class="form-desc">无操作多少分钟后自动登出（1-120分钟）</span>
        </el-form-item>
        <el-form-item label="提醒时间">
          <el-input-number 
            v-model="sessionTimeoutForm.warningTime" 
            :min="1" 
            :max="120"
            controls-position="right"
          />
          <span class="form-desc">登出前提前多少分钟提醒（建议 1-10 分钟）</span>
        </el-form-item>
        
        <div class="validation-footer-info" v-if="realTimeValidation.adjusted">
          <el-icon class="info-icon"><WarningFilled /></el-icon>
          <span>系统将自动采用毫秒级精度 ({{ (sessionTimeoutForm.timeout * 60 * 1000).toLocaleString() }}ms) 存储</span>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelSessionTimeout">取消</el-button>
          <el-button type="primary" @click="saveSessionTimeout">保存设置</el-button>
        </span>
      </template>
    </el-dialog>
    

    
    <!-- 风险详情对话框 -->
    <el-dialog
      v-model="showRiskDetails"
      title="安全风险详情"
      width="600px"
    >
      <div class="risk-details">
        <el-alert 
          :title="securityRiskLevel" 
          :type="securityRiskLevel === '高风险' ? 'error' : securityRiskLevel === '中风险' ? 'warning' : 'info'" 
          show-icon
          :closable="false"
        />
        
        <div class="risk-item" v-for="(risk, index) in securityRisks" :key="index">
          <div class="risk-title">{{ risk.title }}</div>
          <div class="risk-desc">{{ risk.description }}</div>
          <div class="risk-solution">
            <strong>建议:</strong> {{ risk.solution }}
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 安全评估历史记录对话框 -->
    <el-dialog
      v-model="showSecurityAssessmentHistory"
      title="安全评估历史记录"
      width="800px"
    >
      <div class="security-assessment-history">
        <el-table :data="securityAssessmentHistory" style="width: 100%" max-height="400">
          <el-table-column prop="timestamp" label="评估时间" width="180">
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.timestamp) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="overallScore" label="评分" width="80" sortable>
            <template #default="scope">
              <el-tag :type="getScoreTagType(scope.row.overallScore)">
                {{ scope.row.overallScore }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="riskLevel" label="风险等级" width="100" sortable>
            <template #default="scope">
              <el-tag :type="getRiskLevelTagType(scope.row.riskLevel)">
                {{ getRiskLevelText(scope.row.riskLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="关键因素" show-overflow-tooltip>
            <template #default="scope">
              <div class="factors-list">
                <div
                  v-for="(factor, index) in getLowScoreFactors(scope.row.factors)" 
                  :key="index" 
                  :class="['factor-item', factor.score < 60 ? 'factor-danger' : 'factor-warning']"
                >
                  <span class="factor-name">{{ factor.name }}:</span>
                  <span class="factor-score">{{ factor.score }}</span>
                </div>
              </div>
            </template>
          </el-table-column>        </el-table>
        <div class="history-summary" v-if="securityAssessmentHistory.length > 0">
          <p>共 {{ securityAssessmentHistory.length }} 条评估记录</p>
        </div>
        <div class="no-history" v-else>
          <p>暂无安全评估历史记录</p>
        </div>
      </div>
    </el-dialog>
    
    <!-- 两步验证设置对话框 -->
    <el-dialog
      v-model="showTwoFactorSetupDialog"
      title="设置两步验证"
      width="500px"
      @close="handleTwoFactorDialogClose"
    >
      <div class="two-factor-setup">
        <el-steps :active="twoFactorStep" finish-status="success" simple>
          <el-step title="启用两步验证" />
          <el-step title="备份验证码" />
        </el-steps>
        
        <div v-if="twoFactorStep === 0" class="setup-step">
          <p class="setup-desc">请使用身份验证器应用扫描下方二维码或手动输入密钥：</p>
          
          <div class="qr-code-container">
            <img 
              :src="twoFactorQrCode" 
              alt="两步验证二维码" 
              class="qr-code-image"
              v-if="twoFactorQrCode && twoFactorQrCode.length > 0"
            />
            <div v-else class="qr-placeholder">
              <div class="qr-content">
                <div class="qr-logo">🔒</div>
                <div class="qr-text">生成中...</div>
              </div>
            </div>
          </div>
          
          <div class="secret-key">
            <span class="key-label">密钥：</span>
            <span class="key-value">{{ twoFactorSecret }}</span>
            <el-button 
              size="small" 
              @click="copySecretKey"
              class="copy-button"
            >
              复制
            </el-button>
          </div>
          
          <div class="verification-input">
            <el-input 
              v-model="twoFactorCode" 
              placeholder="请输入6位验证码" 
              maxlength="6"
              @input="validateTwoFactorCode"
            />
            <p class="verification-tip">请输入身份验证器应用生成的6位验证码以完成设置</p>
          </div>
        </div>
        
        <div v-if="twoFactorStep === 1" class="setup-step">
          <p class="setup-desc">请妥善保存以下备用验证码，当您无法使用身份验证器时可以使用它们登录：</p>
          
          <div class="backup-codes-display">
            <div 
              class="backup-code-item" 
              v-for="(code, index) in newBackupCodes" 
              :key="index"
            >
              <span class="code-number">{{ index + 1 }}.</span>
              <span class="code-text">{{ code }}</span>
            </div>
          </div>

          <div class="backup-codes-actions-inline">
            <el-button size="small" type="primary" plain @click="downloadNewBackupCodes">下载备用码</el-button>
            <el-button size="small" type="info" plain @click="copyAllNewBackupCodes">复制所有</el-button>
          </div>
          
          <el-alert 
            title="重要提醒" 
            type="warning" 
            description="请立即保存这些备用验证码，一旦离开此页面将无法再次查看。" 
            show-icon
            :closable="false"
          />
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelTwoFactorSetup">取消</el-button>
          <el-button 
            v-if="twoFactorStep === 0" 
            type="primary" 
            @click="verifyTwoFactorCode"
            :disabled="!isTwoFactorCodeValid"
          >
            验证并继续
          </el-button>
          <el-button 
            v-if="twoFactorStep === 1" 
            type="primary" 
            @click="completeTwoFactorSetup"
          >
            完成设置
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Warning, WarningFilled, Checked, Mouse, Operation } from '@element-plus/icons-vue'
import { useAutoLogout, type AutoLogoutConfig } from '@/composables/useAutoLogout'
import QRCode from 'qrcode'
import dataEncryptionManager from '@/services/dataEncryptionManager'
import { changePassword as changeUserPassword, generateTotpSecret, verifyTotpCode, enableTotpAuth, disableTotpAuth, checkTotpStatus, regenerateBackupCodes as apiRegenerateBackupCodes } from '@/services/authService'
import { validateUserToken } from '@/utils/tokenValidator'
import { hasSpecialChars, hasDangerousSqlChars, hasDangerousXssChars, getSpecialChars } from '@/utils/specialCharDetector'
import { 
  checkBiometricSupport,
  enableBiometric,
  disableBiometric,
  type BiometricType
} from '@/services/biometricService'
import { 
  getSecurityConfig,
  saveSecurityConfig,
  getAccountLockStatus,
  unlockAccount,
  getLoginAttempts,
  resetFailedAttempts,
  manuallyLockAccount as serviceManuallyLockAccount
} from '@/services/accountSecurityService'
import {
  getLoginDeviceLimitConfig,
  saveLoginDeviceLimitConfig,
  getActiveDeviceSessions,
  saveActiveDeviceSessions,
  recordNewDeviceSession,
  logoutDevice,
  logoutAllDevices,
  cleanupExpiredSessions,
  getUserAgent,
  getClientIpAddress,
  getBackendDeviceSessionsAPI,
  revokeBackendDeviceSessionAPI,
  revokeOtherBackendDeviceSessionsAPI,
  type ActiveDeviceSession
} from '@/services/loginDeviceLimitService'
import { 
  getSecurityQuestionConfig,
  saveSecurityQuestionConfig
} from '@/services/securityQuestionService'
import { 
  getSecurityOperationLogs, 
  logSecurityOperation,
  exportSecurityOperationLogs
} from '@/services/securityOperationLogService'
import { updateSecuritySettings, getSecuritySettings } from '@/services/securityService'
import { 
  performSecurityAssessment 
} from '@/services/securityAssessmentService'
import { 
  getSecurityAssessmentHistory,
  logSecurityAssessment
} from '@/services/securityAssessmentHistoryService'
import { getAccountStatusAPI } from '@/services/accountUnlockService'
import { getTokenRemainingTime } from '@/utils/request'

// 占位函数：发送短信验证码
const sendSmsCode = async (data: { phone: string; type: string }): Promise<void> => {
  console.log('发送短信验证码:', data)
  // TODO: 对接真实API
  return Promise.resolve()
}

// 占位函数：发送邮箱验证码
const sendEmailVerificationCode = async (data: { email: string; type: string }): Promise<void> => {
  console.log('发送邮箱验证码:', data)
  // TODO: 对接真实API
  return Promise.resolve()
}

const router = useRouter()

// 当前激活的标签页
const activeTab = ref('account')

// 安全状态
const phoneVerified = ref(false)
const emailVerified = ref(false)
const twoFactorEnabled = ref(false)
const intendedTwoFactorState = ref(false)
const originalTwoFactorState = ref(false)
const backupCodes = ref<string[]>([])
const backupCodesCount = ref(0)

// 监听备用码数组变化，自动更新计数
watch(backupCodes, (newCodes) => {
  backupCodesCount.value = newCodes.length
}, { immediate: true })

const passwordStrength = ref('')
const loginProtection = ref(false) // 登录保护状态将通过初始化函数设置
const abnormalLoginAlert = ref(false) // 异常登录提醒状态将通过初始化函数设置
const fingerprintEnabled = ref(false)
const faceRecognitionEnabled = ref(false)
const loginRateLimit = ref(false)
const dataEncryptionEnabled = ref(false) // 默认不启用数据加密
const securityScore = ref(0)
const securityRiskLevel = ref('')

// 令牌与会话状态
const tokenRemainingSeconds = ref(getTokenRemainingTime())
let tokenTimer: any = null

const formattedRemainingTime = computed(() => {
  if (tokenRemainingSeconds.value === null || tokenRemainingSeconds.value === undefined || isNaN(tokenRemainingSeconds.value)) {
    return '0分00秒'
  }
  const minutes = Math.floor(tokenRemainingSeconds.value / 60)
  const seconds = tokenRemainingSeconds.value % 60
  return `${minutes}分${seconds.toString().padStart(2, '0')}秒`
})

const tokenStatusType = computed(() => {
  if (tokenRemainingSeconds.value > 15 * 60) return 'success' // 大于15分钟
  if (tokenRemainingSeconds.value > 5 * 60) return 'warning'  // 大于5分钟
  return 'danger'                                           // 小于5分钟
})

const tokenReminderMessage = computed(() => {
  if (tokenRemainingSeconds.value <= 0) return '令牌已过期，请重新登录'
  if (tokenRemainingSeconds.value <= 5 * 60) return '令牌即将过期，建议立即刷新'
  if (tokenRemainingSeconds.value <= 15 * 60) return '令牌剩余时间较短，建议刷新'
  return ''
})

const startTokenTimer = () => {
  stopTokenTimer()
  tokenTimer = setInterval(() => {
    tokenRemainingSeconds.value = getTokenRemainingTime()
  }, 1000)
}

const stopTokenTimer = () => {
  if (tokenTimer) {
    clearInterval(tokenTimer)
    tokenTimer = null
  }
}

// 刷新令牌操作
const refreshingToken = ref(false)
const manualRefreshToken = async () => {
  if (refreshingToken.value) return
  
  refreshingToken.value = true
  try {
    const { refreshAccessToken } = await import('@/utils/request')
    // 使用统一的刷新令牌函数，它带有并发锁和广播同步功能
    const success = await refreshAccessToken()
    
    if (success) {
      ElMessage.success('令牌刷新成功')
      tokenRemainingSeconds.value = getTokenRemainingTime()
    } else {
      ElMessage.error('令牌刷新失败，请重新登录')
    }
  } catch (error: any) {
    console.error('手动刷新令牌失败:', error)
    const errorMsg = error.message || '刷新失败，请稍后重试'
    ElMessage.error(errorMsg)
  } finally {
    refreshingToken.value = false
  }
}
const biometricAvailable = ref(false)
const accountLocked = ref(false)
const remainingLockTime = ref(0)
const lockReason = ref('')

// 客户端信息
const clientInfo = reactive({
  browser: '正在检测...',
  os: '正在检测...',
  ip: '正在检测...',
  language: '正在检测...',
  timezone: '正在检测...',
  isSecure: true,
  lastCheck: new Date().toLocaleString('zh-CN', { hour12: false })
})

// 解析 User Agent 获取浏览器和操作系统
const parseUserAgent = () => {
  const ua = navigator.userAgent
  let browser = '未知浏览器'
  let os = '未知操作系统'

  // 检测浏览器
  if (ua.indexOf('Chrome') > -1) {
    if (ua.indexOf('Edg') > -1) browser = 'Microsoft Edge'
    else browser = 'Google Chrome'
  }
  else if (ua.indexOf('Firefox') > -1) browser = 'Mozilla Firefox'
  else if (ua.indexOf('Safari') > -1) browser = 'Apple Safari'
  else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) browser = 'Internet Explorer'

  // 检测操作系统
  if (ua.indexOf('Win') > -1) os = 'Windows'
  else if (ua.indexOf('Mac') > -1) os = 'macOS'
  else if (ua.indexOf('Linux') > -1) os = 'Linux'
  else if (ua.indexOf('Android') > -1) os = 'Android'
  else if (ua.indexOf('like Mac') > -1) os = 'iOS'

  clientInfo.browser = browser
  clientInfo.os = os
  clientInfo.isSecure = window.isSecureContext
  clientInfo.language = navigator.language
  clientInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
}

// 安全提醒
const securityReminders = computed(() => {
  const reminders = []
  
  // 1. 安全连接检查
  if (!clientInfo.isSecure) {
    reminders.push({
      type: 'danger',
      icon: 'Warning',
      message: '当前连接不安全：您正在通过非加密连接访问，建议使用 HTTPS 以保护数据安全。'
    })
  }
  
  // 2. 浏览器兼容性/安全性检查
  const ua = navigator.userAgent
  if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) {
    reminders.push({
      type: 'warning',
      icon: 'CircleCloseFilled',
      message: '浏览器版本过旧：检测到您正在使用 Internet Explorer，为了更好的安全性和体验，建议更换为现代浏览器（如 Chrome、Edge 或 Firefox）。'
    })
  }
  
  // 3. 地理位置/时区不一致检查 (启发式)
  const isChineseLanguage = clientInfo.language.toLowerCase().startsWith('zh')
  const isChineseTimezone = clientInfo.timezone.includes('Shanghai') || 
                            clientInfo.timezone.includes('Hong_Kong') || 
                            clientInfo.timezone.includes('Taipei') ||
                            clientInfo.timezone.includes('Urumqi')
  if (isChineseLanguage && !isChineseTimezone && !clientInfo.timezone.includes('UTC')) {
    reminders.push({
      type: 'info',
      icon: 'Location',
      message: '时区偏移提醒：您的浏览器语言为中文，但当前时区设置为 ' + clientInfo.timezone + '，请确保这符合您的预期。'
    })
  }
  
  return reminders
})

// 初始化客户端信息
const initializeClientInfo = async () => {
  parseUserAgent()
  try {
    const { getClientIpAddress } = await import('@/services/authService')
    const response = await getClientIpAddress()
    if (response.success && response.data) {
      clientInfo.ip = response.data.ip || '未知IP'
      // 同时更新用于日志记录的变量
      clientIpAddress.value = clientInfo.ip
    }
  } catch (error) {
    console.error('获取客户端IP失败:', error)
    clientInfo.ip = '获取失败'
    clientIpAddress.value = '获取失败'
  }
}

// 初始化数据加密状态
const initializeDataEncryptionStatus = async (): Promise<void> => {
  try {
    // 获取当前用户ID
    const userId = currentUserId.value
    
    // 检查是否已有加密状态
    const storedStatus = localStorage.getItem(`dataEncryptionEnabled_${userId}`)
    
    // 如果没有设置过，则默认启用数据加密
    if (storedStatus === null) {
      console.log('[DataEncryption] 首次访问，默认启用数据加密')
      
      // 设置为启用状态
      dataEncryptionEnabled.value = true
      localStorage.setItem(`dataEncryptionEnabled_${userId}`, 'true')
      
      // 调用后端API初始化加密服务
      try {
        const { initializeKeyManagement, getKeyStatus } = await import('@/services/keyManagementService')
        const { initializeEncryption } = await import('@/services/dataEncryptionService')
        
        // 初始化密钥管理（如果还没有密钥会自动生成）
        await initializeKeyManagement()
        
        // 初始化数据加密服务
        await initializeEncryption()
        
        // 启用数据加密管理器
        dataEncryptionManager.enableEncryption()
        
        console.log('[DataEncryption] 数据加密已自动启用')
      } catch (apiError) {
        console.error('[DataEncryption] 自动启用失败:', apiError)
      }
    } else {
      // 根据存储的状态恢复
      dataEncryptionEnabled.value = storedStatus === 'true'
      
      // 如果已启用，启用数据加密管理器
      if (dataEncryptionEnabled.value) {
        dataEncryptionManager.enableEncryption()
        
        // 检查是否有主密钥
        const masterKey = localStorage.getItem('master_encryption_key')
        if (masterKey) {
          dataEncryptionManager.setMasterKey(masterKey)
        }
      }
    }
    
    console.log('[DataEncryption] 加密状态:', dataEncryptionEnabled.value)
  } catch (error) {
    console.error('初始化数据加密状态失败:', error)
  }
}

// 初始化登录保护和异常登录提醒状态
const initializeLoginProtectionStatus = async (): Promise<void> => {
  try {
    // 优先从后端获取
    const response = await getSecuritySettings();
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data;
    
    if (response.success && actualData) {
      console.log('从后端获取安全设置成功:', actualData);
      loginProtection.value = !!actualData.login_protection_enabled;
      abnormalLoginAlert.value = !!actualData.email_alerts_enabled;
      
      // 同步会话超时设置
      if (actualData.session_timeout_minutes !== undefined) {
        originalSessionTimeoutSettings.timeout = actualData.session_timeout_minutes;
        sessionTimeoutForm.timeout = actualData.session_timeout_minutes;
      }
      if (actualData.session_timeout_warning_minutes !== undefined) {
        originalSessionTimeoutSettings.warningTime = actualData.session_timeout_warning_minutes;
        sessionTimeoutForm.warningTime = actualData.session_timeout_warning_minutes;
      }
      
      // 同步到全局自动登出单例
      updateAutoLogoutConfig({
        enabled: true,
        timeoutMinutes: sessionTimeoutForm.timeout,
        warningMinutes: sessionTimeoutForm.warningTime
      })
      activateAutoLogout()
      
      // 同步到 localStorage
      localStorage.setItem('loginProtectionEnabled', String(loginProtection.value));
      localStorage.setItem('abnormalLoginAlert', String(abnormalLoginAlert.value));
      return;
    }
    
    // 如果后端获取失败，则回退到 localStorage
    const loginProtectionSetting = localStorage.getItem('loginProtectionEnabled');
    const abnormalLoginAlertSetting = localStorage.getItem('abnormalLoginAlert');
    
    if (loginProtectionSetting === null) {
      loginProtection.value = true;
      localStorage.setItem('loginProtectionEnabled', 'true');
    } else {
      loginProtection.value = loginProtectionSetting === 'true';
    }
    
    if (abnormalLoginAlertSetting === null) {
      abnormalLoginAlert.value = true;
      localStorage.setItem('abnormalLoginAlert', 'true');
    } else {
      abnormalLoginAlert.value = abnormalLoginAlertSetting === 'true';
    }
  } catch (error) {
    console.error('初始化登录保护状态失败:', error);
    loginProtection.value = true;
    abnormalLoginAlert.value = true;
  }
}

// 登录历史筛选
const loginHistoryFilter = reactive({
  keyword: '',
  dateRange: []
})

// 登录历史分页
const loginHistoryPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const loginHistoryLoading = ref(false)
const loginHistoryAutoRefreshTimer = ref<number | null>(null)

// 登录历史排序
const loginHistorySort = reactive({
  prop: '',
  order: ''
})

// 详细登录历史筛选
const detailedLoginHistoryFilter = reactive({
  keyword: '',
  dateRange: [],
  status: ''
})

// 详细登录历史分页
const detailedLoginHistoryPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const detailedLoginHistoryLoading = ref(false)
const detailedLoginHistoryAutoRefreshTimer = ref<number | null>(null)

// 详细登录历史排序
const detailedLoginHistorySort = reactive({
  prop: '',
  order: ''
})

// 加载状态
const biometricLoading = reactive({
  fingerprint: false,
  face: false
})
const rateLimitLoading = ref(false)
const unlockLoading = ref(false)
const twoFactorLoading = ref(false)
const lockOperationLoading = ref(false)

// 两步验证相关状态
const showTwoFactorSetupDialog = ref(false)
const twoFactorStep = ref(0)
const twoFactorSecret = ref('')
const twoFactorQrCode = ref('')
const twoFactorCode = ref('')
const isTwoFactorCodeValid = ref(false)
const newBackupCodes = ref<string[]>([])

// 定时器
const lockStatusTimer = ref<number | null>(null)

// 对话框显示状态
const showPasswordDialog = ref(false)
const showPhoneDialog = ref(false)
const showEmailDialog = ref(false)
const showDeviceDialog = ref(false)
const deviceMonitorTimer = ref<number | null>(null)

// 监听设备管理对话框状态，开启/关闭实时监控
watch(showDeviceDialog, (val) => {
  if (val) {
    // 开启实时监控，每30秒刷新一次设备列表
    deviceMonitorTimer.value = window.setInterval(() => {
      refreshDeviceList()
    }, 30000)
  } else {
    // 关闭实时监控
    if (deviceMonitorTimer.value) {
      clearInterval(deviceMonitorTimer.value)
      deviceMonitorTimer.value = null
    }
  }
})
const showLoginHistory = ref(false)
const showSecurityLog = ref(false)
const showBackupCodesDialog = ref(false)
const showLoginLimitDialog = ref(false)
const showSecurityQuestionDialog = ref(false)
const showDetailedLoginHistory = ref(false)
const showLockoutSettings = ref(false)
const showSecurityAssessmentHistory = ref(false)

// 监听锁定设置对话框的显示状态
watch(showLockoutSettings, (newVal: boolean) => {
  if (newVal) {
    // 打开对话框时，加载最新的配置
    const config = getSecurityConfig()
    Object.assign(lockoutSettings, config.lockout)
    // 保存原始设置用于取消操作
    Object.assign(originalLockoutSettings, config.lockout)
  }
})
const showSessionTimeoutDialog = ref(false)

// 监听会话超时设置对话框的显示状态
watch(showSessionTimeoutDialog, (newVal: boolean) => {
  if (newVal) {
    // 打开对话框时，加载当前设置作为原始设置用于取消操作
    Object.assign(originalSessionTimeoutSettings, sessionTimeoutForm)
  }
})

// 监听登录限制对话框的显示状态
watch(showLoginLimitDialog, (newVal: boolean) => {
  if (newVal) {
    // 打开对话框时，加载最新的配置和设备信息
    initializeLoginDeviceLimitConfig()
    loadCurrentDeviceSessions()
  }
})

// 监听安全问题对话框的显示状态
watch(showSecurityQuestionDialog, (newVal: boolean) => {
  if (newVal) {
    // 打开对话框时，加载已保存的安全问题
    loadSecurityQuestions()
  }
})

const showRiskDetails = ref(false)

// 客户端IP地址
const clientIpAddress = ref('127.0.0.1')

// 加载安全问题
const loadSecurityQuestions = (): void => {
  try {
    const userId = currentUserId.value
    const config = getSecurityQuestionConfig(userId)
    
    // 更新表单数据
    securityQuestionForm.question1 = config.question1
    securityQuestionForm.answer1 = config.answer1
    securityQuestionForm.question2 = config.question2
    securityQuestionForm.answer2 = config.answer2
    securityQuestionForm.question3 = config.question3
    securityQuestionForm.answer3 = config.answer3
  } catch (error) {
    console.error('加载安全问题失败:', error)
    ElMessage.error('加载安全问题失败')
  }
}

// 表单数据
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const phoneForm = reactive({
  phone: '',
  code: ''
})

const emailForm = reactive({
  email: '',
  code: ''
})

const loginLimitForm = reactive({
  maxDevices: 3,
  autoLogout: true,
  enabled: true
})

// 当前登录设备信息
const currentDeviceSessions = ref<ActiveDeviceSession[]>([])
const activeDeviceCount = ref(0)
const currentDeviceId = ref('')

// 当前用户ID
const currentUserId = ref(localStorage.getItem('userId') || 'default_user') // 从本地存储获取用户ID

const securityQuestionForm = reactive({
  question1: '',
  answer1: '',
  question2: '',
  answer2: '',
  question3: '',
  answer3: ''
})

const lockoutSettings = reactive({
  maxFailedAttempts: 5,
  lockoutDuration: 30,
  resetCounter: true
})

// 用于存储原始锁定设置，用于取消操作时恢复
const originalLockoutSettings = reactive({
  maxFailedAttempts: 5,
  lockoutDuration: 30,
  resetCounter: true
})

const sessionTimeoutForm = reactive({
  timeout: 30,
  warningTime: 5
})

// 会话超时实时验证
const realTimeValidation = computed(() => {
  const timeout = sessionTimeoutForm.timeout
  const warning = sessionTimeoutForm.warningTime
  
  if (warning > timeout) {
    const adjustedWarning = Number((timeout * 0.9).toFixed(2))
    return {
      isValid: false,
      adjusted: true,
      message: `提醒时长(${warning}min)大于超时时长(${timeout}min)，保存时将自动调整为 ${adjustedWarning}min (90%)`,
      type: 'warning' as const
    }
  }
  
  if (warning === timeout) {
    return {
      isValid: true,
      adjusted: false,
      message: '验证通过：提醒时长等于超时时长 (100%)',
      type: 'success' as const
    }
  }

  const ratio = ((warning / timeout) * 100).toFixed(0)
  return {
    isValid: true,
    adjusted: false,
    message: `验证通过：设置符合安全规则 (提醒时间占比: ${ratio}%)`,
    type: 'success' as const
  }
})

// 用于存储原始会话超时设置，用于取消操作时恢复
const originalSessionTimeoutSettings = reactive({
  timeout: 30,
  warningTime: 5
})

// 密码验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' },
    {
      validator: (_rule: Record<string, unknown>, value: string, callback: (error?: string | Error) => void) => {
        // 检查密码强度
        const strength = calculatePasswordStrength(value);
        const satisfiedCount = Object.values(strength.requirements).filter(Boolean).length;
        
        if (satisfiedCount < 3) {
          callback(new Error('密码必须满足至少3项要求'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: Record<string, unknown>, value: string, callback: (error?: string | Error) => void) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性
const maskedPhone = computed(() => {
  return phoneVerified.value ? '138****8888' : ''
})

const maskedEmail = computed(() => {
  return emailVerified.value ? 'user@***.com' : ''
})

// 特殊字符定义（支持中英文输入状态下的所有常用特殊符号）
const SPECIAL_CHARS = {
  // 中文标点符号
  chinese: '，。！？、；：「」『』（）【】《》〈〉——…··',
  // 英文标点符号
  english: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~',
  // 组合正则表达式
  get regex() {
    return new RegExp(`[${this.chinese}${this.english}]`)
  }
}

// 计算密码强度
const calculatePasswordStrength = (password: string): { level: string; score: number; requirements: Record<string, boolean>, specialChars: string[] } => {
  const specialCharsRegex = SPECIAL_CHARS.regex
  const detectedSpecialChars = getSpecialChars(password)
  
  const requirements = {
    minLength: password.length >= 8,  // 至少8个字符
    lowercase: /[a-z]/.test(password),  // 小写字母
    uppercase: /[A-Z]/.test(password),  // 大写字母
    number: /\d/.test(password),       // 数字
    special: detectedSpecialChars.length > 0,  // 特殊字符（支持中英文）
    noConsecutive: !/(.)\1{2,}/.test(password)  // 不超过两个连续相同字符
  };
  
  // 计算满足的条件数量
  const satisfiedCount = Object.values(requirements).filter(Boolean).length;
  
  // 根据满足的条件数量确定强度等级
  let level = '弱';
  let score = 0;
  
  if (satisfiedCount >= 5) {
    level = '强';
    score = 3;
  } else if (satisfiedCount >= 3) {
    level = '中';
    score = 2;
  } else {
    score = 1;
  }
  
  return { level, score, requirements, specialChars: detectedSpecialChars };
}

const calculatedStrength = computed(() => {
  return calculatePasswordStrength(passwordForm.newPassword)
})

const isPasswordValid = computed(() => {
  const requirements = calculatedStrength.value.requirements
  return requirements.minLength && 
         requirements.lowercase && 
         requirements.uppercase && 
         requirements.number && 
         requirements.special
})

const strengthClass = computed(() => {
  switch (passwordStrength.value) {
    case '弱':
      return 'strength-weak'
    case '中':
      return 'strength-medium'
    case '强':
      return 'strength-strong'
    default:
      return 'strength-strong'
  }
})

const maxFailedAttempts = computed(() => {
  return lockoutSettings.maxFailedAttempts
})

const sessionTimeout = computed(() => {
  return originalSessionTimeoutSettings.timeout
})

// 使用全局自动登出 Composable
const {
  config: autoLogoutConfig,
  showWarning: globalShowWarning,
  remainingSeconds: globalRemainingSeconds,
  updateConfig: updateAutoLogoutConfig,
  getConfig: getAutoLogoutConfig,
  activate: activateAutoLogout
} = useAutoLogout()

// 从全局配置初始化表单
const initializeFromGlobalConfig = () => {
  const config = getAutoLogoutConfig()
  sessionTimeoutForm.timeout = config.timeoutMinutes
  sessionTimeoutForm.warningTime = config.warningMinutes
  originalSessionTimeoutSettings.timeout = config.timeoutMinutes
  originalSessionTimeoutSettings.warningTime = config.warningMinutes
}

// 登录频率限制状态
const rateLimitStatus = computed(() => {
  if (!loginRateLimit.value) {
    return '(已禁用)'
  }
  
  // 获取当前账户的登录尝试记录
  const userId = currentUserId.value
  const attempts = getLoginAttempts(userId)
  const config = getSecurityConfig()
  
  if (config.rateLimit.enabled) {
    const timeWindow = config.rateLimit.timeWindow * 60 * 1000 // 转换为毫秒
    const cutoffTime = Date.now() - timeWindow
    
    // 计算时间窗口内的失败尝试次数
    const recentFailures = attempts.filter((attempt: any) => 
      !attempt.success && 
      attempt.timestamp > cutoffTime
    )
    
    return `(当前失败次数: ${recentFailures.length}/${config.rateLimit.maxAttempts})`
  }
  
  return ''
})

// 登录频率限制详情
const rateLimitDetails = computed(() => {
  const config = getSecurityConfig()
  if (config.rateLimit.enabled) {
    return `最多允许${config.rateLimit.maxAttempts}次失败尝试，时间窗口${config.rateLimit.timeWindow}分钟`
  }
  return '频率限制已禁用'
})

// 移除模拟数据 - 现在使用真实API数据
const loginDevices = ref<any[]>([])

const loginHistory = ref<any[]>([])

// 安全日志接口
interface SecurityLog {
  id: string;
  time: string;
  action: string;
  ip: string;
}

const securityLogs = ref<SecurityLog[]>([])

// 初始化安全日志
const initializeSecurityLogs = async (): Promise<void> => {
  try {
    const userId = currentUserId.value
    const response = await getSecurityOperationLogs({ userId, limit: 50 })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    const logs = actualData?.logs || []
    
    // 转换日志格式以适应现有UI
    if (Array.isArray(logs)) {
      securityLogs.value = logs.map((log: any) => ({
        id: log.id,
        time: formatDateTime(log.timestamp),
        action: log.description || log.action || '安全操作',
        ip: log.sourceIp || log.ip || '未知'
      }))
    }
  } catch (error) {
    console.error('初始化安全日志失败:', error)
  }
}

// 获取登录历史数据
const fetchLoginHistoryData = async (): Promise<void> => {
  loginHistoryLoading.value = true
  try {
    const userId = currentUserId.value
    const response = await getSecurityOperationLogs({
      userId,
      type: 'login_success', // 仅获取登录成功的日志
      limit: loginHistoryPagination.pageSize,
      offset: (loginHistoryPagination.currentPage - 1) * loginHistoryPagination.pageSize,
      startDate: loginHistoryFilter.dateRange && loginHistoryFilter.dateRange.length === 2 ? loginHistoryFilter.dateRange[0] : undefined,
      endDate: loginHistoryFilter.dateRange && loginHistoryFilter.dateRange.length === 2 ? loginHistoryFilter.dateRange[1] : undefined
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    if (response.success && actualData) {
      const logs = actualData.logs || []
      // 转换后端数据格式以适应前端 UI
      loginHistory.value = logs.map((log: any) => ({
        id: log.id,
        time: formatDateTime(log.timestamp),
        device: getDeviceDisplayName(log.userAgent),
        ip: log.sourceIp,
        location: log.resource || '未知',
        status: log.outcome === 'success' ? '成功' : '失败'
      }))
      loginHistoryPagination.total = actualData.total || 0
    } else {
      ElMessage.error(response.message || '获取登录历史失败')
    }
  } catch (error) {
    console.error('获取登录历史失败:', error)
    ElMessage.error('获取登录历史异常，请稍后重试')
  } finally {
    loginHistoryLoading.value = false
  }
}

// 获取详细登录历史数据
const fetchDetailedLoginHistoryData = async (): Promise<void> => {
  detailedLoginHistoryLoading.value = true
  try {
    const userId = currentUserId.value
    const response = await getSecurityOperationLogs({
      userId,
      type: 'login_success',
      limit: detailedLoginHistoryPagination.pageSize,
      offset: (detailedLoginHistoryPagination.currentPage - 1) * detailedLoginHistoryPagination.pageSize,
      startDate: detailedLoginHistoryFilter.dateRange && detailedLoginHistoryFilter.dateRange.length === 2 ? detailedLoginHistoryFilter.dateRange[0] : undefined,
      endDate: detailedLoginHistoryFilter.dateRange && detailedLoginHistoryFilter.dateRange.length === 2 ? detailedLoginHistoryFilter.dateRange[1] : undefined
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    if (response.success && actualData) {
      const logs = actualData.logs || []
      detailedLoginHistory.value = logs.map((log: any) => ({
        id: log.id,
        time: formatDateTime(log.timestamp),
        device: getDeviceDisplayName(log.userAgent),
        browser: log.userAgent.split(' ')[0] || '未知',
        ip: log.sourceIp,
        location: log.resource || '未知',
        status: log.outcome === 'success' ? '成功' : '失败'
      }))
      detailedLoginHistoryPagination.total = actualData.total || 0
    } else {
      ElMessage.error(response.message || '获取详细登录历史失败')
    }
  } catch (error) {
    console.error('获取详细登录历史失败:', error)
    ElMessage.error('获取详细登录历史异常，请稍后重试')
  } finally {
    detailedLoginHistoryLoading.value = false
  }
}

// 处理登录历史页码变化
const handleLoginHistoryPageChange = (page: number): void => {
  loginHistoryPagination.currentPage = page
  fetchLoginHistoryData()
}

// 处理详细登录历史页码变化
const handleDetailedLoginHistoryPageChange = (page: number): void => {
  detailedLoginHistoryPagination.currentPage = page
  fetchDetailedLoginHistoryData()
}

// 启动登录历史自动刷新
const startLoginHistoryAutoRefresh = (): void => {
  stopLoginHistoryAutoRefresh()
  // 每5分钟刷新一次 (300000ms)
  loginHistoryAutoRefreshTimer.value = window.setInterval(() => {
    if (showLoginHistory.value) {
      fetchLoginHistoryData()
    }
    if (showDetailedLoginHistory.value) {
      fetchDetailedLoginHistoryData()
    }
  }, 300000)
}

// 停止登录历史自动刷新
const stopLoginHistoryAutoRefresh = (): void => {
  if (loginHistoryAutoRefreshTimer.value) {
    clearInterval(loginHistoryAutoRefreshTimer.value)
    loginHistoryAutoRefreshTimer.value = null
  }
}

// 初始化安全评估历史记录
const initializeSecurityAssessmentHistory = (): void => {
  try {
    const userId = currentUserId.value
    const history = getSecurityAssessmentHistory(userId, 10)
    
    // 转换历史记录格式以适应现有UI
    securityAssessmentHistory.value = history.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      overallScore: record.overallScore,
      riskLevel: record.riskLevel,
      factors: record.factors
    }))
  } catch (error) {
    console.error('初始化安全评估历史记录失败:', error)
  }
}

const detailedLoginHistory = ref<any[]>([])

// 安全风险项接口
interface SecurityRisk {
  title: string;
  description: string;
  solution: string;
}

// 安全风险评估
const securityRisks = ref<SecurityRisk[]>([])

// 安全评估历史记录接口
interface SecurityAssessmentHistory {
  id: string;
  timestamp: number;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    name: string;
    score: number;
    description: string;
  }[];
}

// 安全评估历史记录
const securityAssessmentHistory = ref<SecurityAssessmentHistory[]>([])

// 获取评分标签类型
const getScoreTagType = (score: number): 'success' | 'warning' | 'danger' | '' => {
  if (score >= 90) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
}

// 获取风险等级标签类型
const getRiskLevelTagType = (riskLevel: 'low' | 'medium' | 'high'): 'success' | 'warning' | 'danger' | '' => {
  switch (riskLevel) {
    case 'low': return 'success'
    case 'medium': return 'warning'
    case 'high': return 'danger'
    default: return ''
  }
}

// 获取风险等级文本
const getRiskLevelText = (riskLevel: 'low' | 'medium' | 'high'): string => {
  switch (riskLevel) {
    case 'low': return '低风险'
    case 'medium': return '中风险'
    case 'high': return '高风险'
    default: return '未知'
  }
}

// 获取低分因素
const getLowScoreFactors = (factors: { name: string; score: number; description: string }[]): { name: string; score: number; description: string }[] => {
  return factors.filter(factor => factor.score < 80)
}

// 执行安全评估（调用后端真实API）
const performSecurityCheck = async (): Promise<void> => {
  try {
    ElMessage.info('正在进行安全检查...')
    
    // 调用后端真实API
    const { performSecurityCheck: backendCheck, getRiskLevelType } = await import('@/services/backendSecurityCheckService')
    const result = await backendCheck()
    
    if (!result.success) {
      throw new Error(result.error || '安全检查失败')
    }
    
    const data = result.data!
    
    // 更新安全评分和风险等级
    securityScore.value = data.overallScore
    securityRiskLevel.value = data.riskLabel
    
    // 更新安全风险详情
    securityRisks.value = (data.factors || [])
      .filter(f => f.score < 80)
      .map(f => ({
        title: f.name,
        description: f.basis || f.description,
        solution: f.recommendation
      }))
    
    // 根据评估结果给出不同的提示
    if (data.riskLevel === 'high') {
      ElMessage.error(`安全检查完成，您的账户存在高风险，评分为 ${data.overallScore} 分，请立即处理安全隐患`)
    } else if (data.riskLevel === 'medium') {
      ElMessage.warning(`安全检查完成，您的账户存在中等风险，评分为 ${data.overallScore} 分，建议加强安全措施`)
    } else {
      ElMessage.success(`安全检查完成，您的账户很安全，评分为 ${data.overallScore} 分`)
    }
    
    // 记录安全评估历史
    logSecurityAssessment({
      userId: currentUserId.value,
      overallScore: data.overallScore,
      riskLevel: data.riskLevel as 'low' | 'medium' | 'high',
      factors: (data.factors || []).map(f => ({
        name: f.name,
        score: f.score,
        description: f.basis || f.description
      }))
    })
    
    // 重新加载评估历史
    initializeSecurityAssessmentHistory()
    
    // 记录安全操作日志
    const userId = currentUserId.value
    logSecurityOperation({
      userId,
      operation: 'perform_security_check',
      description: `执行安全检查，评分: ${data.overallScore}，风险等级: ${data.riskLevel}`,
      ip: clientIpAddress.value,
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
    
  } catch (error: any) {
    console.error('安全检查失败:', error)
    ElMessage.error(error.message || '安全检查失败，请稍后重试')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'perform_security_check_failed',
      description: '执行安全检查失败',
      ip: clientIpAddress.value,
      userAgent: navigator.userAgent,
      status: 'failed',
      details: { error: (error as Error).message }
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  }
}

// 倒计时
const smsCooldown = ref(0)
const emailCooldown = ref(0)

// 方法
const updatePasswordStrength = (): void => {
  // 实时更新密码强度，这里不需要做任何事情，因为computed属性会自动更新
}

// 打开安全日志对话框
const openSecurityLog = (): void => {
  // 初始化安全日志
  initializeSecurityLogs()
  // 显示对话框
  showSecurityLog.value = true
}

const changePassword = async (): Promise<void> => {
  try {
    // 验证用户令牌
    const isTokenValid = await validateUserToken()
    if (!isTokenValid) {
      console.log('令牌验证失败')
      return
    }
    // 调用真实API接口修改密码
    await changeUserPassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    })
    
    ElMessage.success('密码修改成功')
    
    // 更新密码强度
    const strength = calculatePasswordStrength(passwordForm.newPassword)
    passwordStrength.value = strength.level
    
    showPasswordDialog.value = false
    // 重置表单
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    // 记录安全操作日志
    const userId = currentUserId.value
    logSecurityOperation({
      userId,
      operation: 'change_password',
      description: '修改登录密码',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    })
    
    // 重新加载安全日志
    initializeSecurityLogs()
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error('密码修改失败，请检查当前密码是否正确')
    
    // 记录安全操作日志
    const userId = currentUserId.value
    logSecurityOperation({
      userId,
      operation: 'change_password_failed',
      description: '修改登录密码失败',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'failed',
      details: { error: (error as Error).message }
    })
  }
}

const toggleTwoFactor = async (value: boolean): Promise<void> => {
  try {
    twoFactorLoading.value = true
    
    if (value) {
      // 保存原始状态
      originalTwoFactorState.value = twoFactorEnabled.value
      
      // 总是生成TOTP密钥和二维码
      const result = await generateTotpSecret()
      
      console.log('generateTotpSecret完整返回:', JSON.stringify(result, null, 2))
      console.log('result.data类型:', typeof result.data)
      console.log('result.data内容:', result.data)
      
      if (result.success && result.data) {
        // 关键点：处理双层 data 结构 (Rule 5)
        // 更加健壮的解析逻辑
        let actualData = result.data;
        if (actualData && actualData.data && typeof actualData.data === 'object' && !Array.isArray(actualData.data)) {
          actualData = actualData.data;
        }
        
        console.log('解析后的两步验证数据:', actualData)
        
        twoFactorSecret.value = actualData.secret || ''
        newBackupCodes.value = actualData.backupCodes || []
        twoFactorStep.value = 0
        twoFactorCode.value = ''
        isTwoFactorCodeValid.value = false
        twoFactorQrCode.value = ''
        
        const qrCode = actualData.qrCode
        console.log('后端返回的原始 qrCode 预览:', qrCode ? (typeof qrCode === 'string' ? qrCode.substring(0, 50) + '...' : '非字符串类型') : 'null')
        
        if (qrCode && typeof qrCode === 'string') {
          // 彻底修复：智能补全 Data URI 前缀，避免重复添加
          if (qrCode.startsWith('data:')) {
            // 已经是完整的 Data URI
            twoFactorQrCode.value = qrCode
          } else if (qrCode.startsWith('image/')) {
            // 只有媒体类型，补全 data:
            twoFactorQrCode.value = 'data:' + qrCode
          } else if (qrCode.includes('base64,')) {
            // 包含 base64 标记但没有 data:，补全 data:
            twoFactorQrCode.value = 'data:' + qrCode
          } else {
            // 假设是纯 Base64 字符串
            twoFactorQrCode.value = 'data:image/png;base64,' + qrCode
          }
          console.log('处理后的 twoFactorQrCode 预览:', twoFactorQrCode.value.substring(0, 50) + '...')
        } else if (actualData.secret) {
          // 后端未返回二维码但返回了密钥，前端尝试本地生成
          console.log('后端未返回有效二维码，前端尝试本地生成...')
          const appName = actualData.appName || 'AccountingSystem'
          const username = actualData.username || localStorage.getItem('username') || 'user'
          const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(username)}?secret=${actualData.secret}&issuer=${encodeURIComponent(appName)}`
          try {
            twoFactorQrCode.value = await QRCode.toDataURL(otpauthUrl, {
              width: 256,
              margin: 2
            })
            console.log('前端本地生成二维码成功')
          } catch (err) {
            console.error('前端本地生成二维码失败:', err)
            ElMessage.error('二维码加载失败，请使用密钥手动添加')
          }
        } else {
          console.error('qrCode 为空且没有密钥！')
          ElMessage.error('获取两步验证信息失败，请重试')
        }
        
        twoFactorEnabled.value = false
        showTwoFactorSetupDialog.value = true
      } else {
        console.error('生成TOTP密钥失败:', result)
        ElMessage.error(result.message || '生成密钥失败')
        intendedTwoFactorState.value = false
      }
    } else {
      // 禁用两步验证 - 需要验证码确认
      try {
        const { value: code } = await ElMessageBox.prompt('请输入6位动态验证码或备用码以禁用两步验证', '确认禁用', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          inputType: 'text',
          inputPattern: /^[a-zA-Z0-9]{6,10}$/, // 允许6位纯数字TOTP或8-10位字母数字备用码
          inputErrorMessage: '请输入有效的验证码或备用码'
        })
        
        const response = await disableTotpAuth(code)
        
        if (response.success) {
      twoFactorEnabled.value = false
      intendedTwoFactorState.value = false
      originalTwoFactorState.value = false
      backupCodesCount.value = 0
      ElMessage.success('两步验证已关闭')
          
          // 记录安全操作日志
          const userId = currentUserId.value
          logSecurityOperation({
            userId,
            operation: 'disable_two_factor',
            description: '关闭两步验证',
            ip: '127.0.0.1', // 实际应用中应获取真实IP
            userAgent: navigator.userAgent,
            status: 'success'
          })
          
          // 重新加载安全日志
          initializeSecurityLogs()
        } else {
          ElMessage.error(response.message || '禁用失败')
          intendedTwoFactorState.value = true
        }
      } catch (error) {
        // 用户取消操作
        intendedTwoFactorState.value = true
      }
    }
  } catch (error) {
    console.error('切换两步验证失败:', error)
    ElMessage.error('操作失败，请稍后重试')
    // 回滚状态
    twoFactorEnabled.value = !value
    intendedTwoFactorState.value = !value
  } finally {
    twoFactorLoading.value = false
  }
}

const validateTwoFactorCode = (): void => {
  // 简单验证6位数字
  isTwoFactorCodeValid.value = /^\d{6}$/.test(twoFactorCode.value)
}

const verifyTwoFactorCode = async (): Promise<void> => {
  if (!isTwoFactorCodeValid.value) {
    ElMessage.error('请输入有效的6位验证码')
    return
  }
  
  try {
    // 验证TOTP代码，传递 secret 参数用于启用过程中的验证
    const response = await verifyTotpCode({ 
      code: twoFactorCode.value,
      secret: twoFactorSecret.value 
    })
    
    // 关键点：处理双层 data 结构 (Rule 5)
    const actualData = response.data?.data || response.data;
    
    if (response.success && actualData?.verified) {
      // 验证通过，进入下一步
      twoFactorStep.value = 1
      ElMessage.success('验证通过')
      
      // 记录安全操作日志
      const userId = currentUserId.value;
      logSecurityOperation({
        userId,
        operation: 'verify_two_factor_code_success',
        description: '两步验证验证码验证通过',
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'success'
      });
      
      // 重新加载安全日志
      initializeSecurityLogs();
    } else {
      ElMessage.error(response.message || '验证码错误，请重新输入')
      
      // 记录安全操作日志
      const userId = currentUserId.value;
      logSecurityOperation({
        userId,
        operation: 'verify_two_factor_code_failed',
        description: '两步验证验证码验证失败',
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'failed'
      });
      
      // 重新加载安全日志
      initializeSecurityLogs();
    }
  } catch (error) {
    console.error('验证两步验证码失败:', error)
    ElMessage.error('验证失败，请稍后重试')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'verify_two_factor_code_error',
      description: '两步验证验证码验证出现错误',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'failed',
      details: { error: (error as Error).message }
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  }
}

const completeTwoFactorSetup = async (): Promise<void> => {
  try {
    // 启用两步验证
    const response = await enableTotpAuth({
      secret: twoFactorSecret.value,
      code: twoFactorCode.value,
      backupCodes: newBackupCodes.value
    })
    
    // 关键点：处理双层 data 结构 (Rule 5)
    const actualData = response.data?.data || response.data;
    
    if (response.success && actualData?.enabled) {
      twoFactorEnabled.value = true
      intendedTwoFactorState.value = true
      originalTwoFactorState.value = true
      showTwoFactorSetupDialog.value = false
      twoFactorStep.value = 0
      backupCodesCount.value = newBackupCodes.value.length
      ElMessage.success('两步验证已成功启用')
      
      // 记录安全操作日志
      const userId = currentUserId.value
      logSecurityOperation({
        userId,
        operation: 'enable_two_factor',
        description: '启用两步验证',
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'success'
      })
      
      // 重新加载安全日志
      initializeSecurityLogs()
    } else {
      ElMessage.error(response.message || '两步验证设置未完成，请先验证验证码')
    }
  } catch (error) {
    console.error('完成两步验证设置失败:', error)
    ElMessage.error('设置失败，请稍后重试')
  }
}

const cancelTwoFactorSetup = async (): Promise<void> => {
  console.log('[SecuritySettings] 用户取消两步验证设置，回滚前状态:', {
    intended: intendedTwoFactorState.value,
    current: twoFactorEnabled.value,
    original: originalTwoFactorState.value
  })
  
  showTwoFactorSetupDialog.value = false
  twoFactorStep.value = 0
  
  // 立即强制回滚状态，确保 UI 响应
  intendedTwoFactorState.value = originalTwoFactorState.value
  twoFactorEnabled.value = originalTwoFactorState.value
  
  console.log('[SecuritySettings] 状态已立即回滚:', {
    intended: intendedTwoFactorState.value,
    current: twoFactorEnabled.value
  })
  
  try {
    // 异步检查后端状态以确保同步
    const statusResponse = await checkTotpStatus()
    const actualData = statusResponse.data?.data || statusResponse.data;
    
    if (statusResponse.success && actualData) {
      twoFactorEnabled.value = !!actualData.enabled
      intendedTwoFactorState.value = !!actualData.enabled
      originalTwoFactorState.value = !!actualData.enabled
      backupCodesCount.value = actualData.backupCodesCount || 0
    }
  } catch (error) {
    console.error('检查两步验证状态失败:', error)
  }
  
  // 记录安全操作日志
  const userId = currentUserId.value;
  logSecurityOperation({
    userId,
    operation: 'cancel_two_factor_setup',
    description: '取消两步验证设置',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
}

const handleTwoFactorDialogClose = async (): Promise<void> => {
  console.log('[SecuritySettings] 两步验证对话框关闭，执行状态检查/回滚...')
  
  // 重置步骤
  twoFactorStep.value = 0
  
  // 立即回滚状态
  intendedTwoFactorState.value = originalTwoFactorState.value
  twoFactorEnabled.value = originalTwoFactorState.value
  
  console.log('[SecuritySettings] 状态已重置为原始值:', originalTwoFactorState.value)
  
  try {
    const statusResponse = await checkTotpStatus()
    const actualData = statusResponse.data?.data || statusResponse.data;
    
    if (statusResponse.success && actualData) {
      twoFactorEnabled.value = !!actualData.enabled
      intendedTwoFactorState.value = !!actualData.enabled
      originalTwoFactorState.value = !!actualData.enabled
    }
  } catch (error) {
    console.error('检查两步验证状态失败:', error)
  }
  
  // 记录安全操作日志
  const userId = currentUserId.value;
  logSecurityOperation({
    userId,
    operation: 'handle_two_factor_dialog_close',
    description: '关闭两步验证对话框',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
}

/**
 * 复制所有备用验证码
 */
const copyAllNewBackupCodes = async (): Promise<void> => {
  try {
    const codesText = newBackupCodes.value.join('\n')
    await navigator.clipboard.writeText(codesText)
    ElMessage.success('所有备用验证码已复制到剪贴板')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'copy_all_backup_codes',
      description: '复制所有备用验证码',
      ip: '127.0.0.1',
      userAgent: navigator.userAgent,
      status: 'success'
    });
    initializeSecurityLogs();
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

/**
 * 下载备用验证码
 */
const downloadNewBackupCodes = (): void => {
  try {
    const codesText = `两步验证备用验证码 (生成时间: ${new Date().toLocaleString('zh-CN', { hour12: false })})\n\n` + 
                     newBackupCodes.value.map((code, index) => `${index + 1}. ${code}`).join('\n') + 
                     '\n\n请妥善保管这些验证码。每个验证码只能使用一次。'
    
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'backup-codes.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('备用验证码已下载')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'download_backup_codes',
      description: '下载备用验证码文件',
      ip: '127.0.0.1',
      userAgent: navigator.userAgent,
      status: 'success'
    });
    initializeSecurityLogs();
  } catch (err) {
    ElMessage.error('下载失败')
  }
}

const copySecretKey = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(twoFactorSecret.value)
    ElMessage.success('密钥已复制到剪贴板')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'copy_secret_key',
      description: '复制两步验证密钥',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = twoFactorSecret.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('密钥已复制到剪贴板')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'copy_secret_key_fallback',
      description: '复制两步验证密钥（降级方案）',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  }
}

const toggleLoginProtection = async (value: boolean): Promise<void> => {
  try {
    // 调用后端 API 更新设置
    const response = await updateSecuritySettings({
      login_protection_enabled: value
    });

    if (response.success) {
      if (value) {
        ElMessage.success('登录保护已开启');
      } else {
        ElMessage.warning('登录保护已关闭');
      }
      
      // 保存登录保护设置到localStorage
      localStorage.setItem('loginProtectionEnabled', value.toString());

      // 记录安全操作日志
      const userId = currentUserId.value;
      await logSecurityOperation({
        userId,
        operation: 'toggle_login_protection',
        description: value ? '启用登录保护' : '禁用登录保护',
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'success'
      });

      // 重新加载安全日志
      await initializeSecurityLogs();
      
      // 触发安全检查以更新分数
      await performSecurityCheck();
    } else {
      ElMessage.error('更新安全设置失败');
      // 恢复开关状态
      loginProtection.value = !value;
    }
  } catch (error) {
    console.error('切换登录保护失败:', error);
    ElMessage.error('操作失败，请重试');
    // 恢复开关状态
    loginProtection.value = !value;
  }
}

const toggleAbnormalLoginAlert = async (value: boolean): Promise<void> => {
  try {
    // 调用后端 API 更新设置
    const response = await updateSecuritySettings({
      email_alerts_enabled: value,
      sms_alerts_enabled: value
    });

    if (response.success) {
      if (value) {
        ElMessage.success('异常登录提醒已开启');
      } else {
        ElMessage.warning('异常登录提醒已关闭');
      }
      
      // 保存异常登录提醒设置到localStorage
      localStorage.setItem('abnormalLoginAlert', value.toString());

      // 记录安全操作日志
      const userId = currentUserId.value;
      await logSecurityOperation({
        userId,
        operation: 'toggle_abnormal_login_alert',
        description: value ? '启用异常登录提醒' : '禁用异常登录提醒',
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'success'
      });

      // 重新加载安全日志
      await initializeSecurityLogs();
      
      // 触发安全检查以更新分数
      await performSecurityCheck();
    } else {
      ElMessage.error('更新提醒设置失败');
      // 恢复开关状态
      abnormalLoginAlert.value = !value;
    }
  } catch (error) {
    console.error('切换异常登录提醒失败:', error);
    ElMessage.error('操作失败，请重试');
    // 恢复开关状态
    abnormalLoginAlert.value = !value;
  }
}

const toggleLoginRateLimit = async (value: boolean): Promise<void> => {
  try {
    rateLimitLoading.value = true
    
    // 获取当前配置
    const config = getSecurityConfig()
    config.rateLimit.enabled = value
    
    // 保存配置
    saveSecurityConfig(config)
    
    // 更新本地状态
    loginRateLimit.value = value
    
    if (value) {
      ElMessage.success('登录频率限制已启用')
      
      // 记录安全操作日志
      const userId = currentUserId.value;
      logSecurityOperation({
        userId,
        operation: 'enable_login_rate_limit',
        description: '启用登录频率限制',
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'success'
      });
      
      // 重新加载安全日志
      initializeSecurityLogs();
    } else {
      ElMessage.warning('登录频率限制已禁用')
      
      // 记录安全操作日志
      const userId = currentUserId.value;
      logSecurityOperation({
        userId,
        operation: 'disable_login_rate_limit',
        description: '禁用登录频率限制',
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'success'
      });
      
      // 重新加载安全日志
      initializeSecurityLogs();
    }
  } catch (error) {
    console.error('切换登录频率限制失败:', error)
    ElMessage.error('操作失败，请稍后重试')
    // 回滚状态
    loginRateLimit.value = !value
  } finally {
    rateLimitLoading.value = false
  }
}

const toggleDataEncryption = async (value: boolean): Promise<void> => {
  try {
    // 获取当前用户ID
    const userId = currentUserId.value;
    
    if (value) {
      // 启用数据加密 - 默认状态，无需确认
      // 显示加载状态
      const loadingInstance = ElLoading.service({
        lock: true,
        text: '正在启用数据加密...',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      try {
        // 初始化密钥管理服务
        const { initializeKeyManagement, generateMasterKey, registerHardwareBinding, getKeyStatus } = await import('@/services/keyManagementService')
        const { initializeEncryption } = await import('@/services/dataEncryptionService')
        
        // 初始化密钥管理（包含密钥生成和硬件绑定）
        await initializeKeyManagement()
        
        // 初始化数据加密服务
        await initializeEncryption()
        
        // 获取密钥状态
        const status = await getKeyStatus()
        
        // 保存加密状态到localStorage
        localStorage.setItem(`dataEncryptionEnabled_${userId}`, 'true');
        
        // 启用数据加密管理器
        dataEncryptionManager.enableEncryption();
        
        // 更新本地状态
        dataEncryptionEnabled.value = true;
        
        ElMessage.success('数据加密已启用');
        
        // 记录安全操作日志
        logSecurityOperation({
          userId,
          operation: 'enable_data_encryption',
          description: '启用数据加密',
          ip: clientIpAddress.value || '127.0.0.1',
          userAgent: navigator.userAgent,
          status: 'success'
        });
        
        // 重新加载安全日志
        initializeSecurityLogs();
      } catch (error) {
        console.error('启用数据加密失败:', error);
        ElMessage.error('启用数据加密失败，请稍后重试');
        // 回滚状态
        dataEncryptionEnabled.value = false;
      } finally {
        loadingInstance.close();
      }
    } else {
      // 禁用数据加密 - 需要用户确认
      ElMessageBox.confirm(
        '禁用端到端加密后，您的敏感数据将以明文形式存储，这会显著降低安全性。强烈建议保持启用状态。确定要禁用吗？',
        '确认禁用数据加密',
        {
          confirmButtonText: '确定禁用',
          cancelButtonText: '保持启用',
          type: 'warning'
        }
      ).then(async () => {
        // 显示加载状态
        const loadingInstance = ElLoading.service({
          lock: true,
          text: '正在禁用数据加密...',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        try {
          // 删除加密状态
          localStorage.removeItem(`dataEncryptionEnabled_${userId}`);
          localStorage.removeItem('master_key_id');
          localStorage.removeItem('master_key_version');
          
          // 禁用数据加密管理器
          dataEncryptionManager.disableEncryption();
          
          // 删除主密钥
          localStorage.removeItem('master_encryption_key');
          
          // 更新本地状态
          dataEncryptionEnabled.value = false;
          
          ElMessage.warning('数据加密已禁用');
          
          // 记录安全操作日志
          logSecurityOperation({
            userId,
            operation: 'disable_data_encryption',
            description: '禁用数据加密',
            ip: '127.0.0.1', // 实际应用中应获取真实IP
            userAgent: navigator.userAgent,
            status: 'success'
          });
          
          // 重新加载安全日志
          initializeSecurityLogs();
        } catch (error) {
          console.error('禁用数据加密失败:', error);
          ElMessage.error('禁用数据加密失败，请稍后重试');
          // 回滚状态
          dataEncryptionEnabled.value = true;
        } finally {
          loadingInstance.close();
        }
      }).catch(() => {
        // 用户取消操作，保持启用状态
        dataEncryptionEnabled.value = true;
      });
    }
  } catch (error) {
    console.error('切换数据加密设置失败:', error);
    ElMessage.error('操作失败，请稍后重试');
    // 回滚状态
    dataEncryptionEnabled.value = !value;
  }
}

const sendPhoneCode = async (): Promise<void> => {
  try {
    // 调用真实API接口发送短信验证码
    await sendSmsCode({
      phone: phoneForm.phone,
      type: 'phone_binding'
    })
    
    smsCooldown.value = 60
    const timer = setInterval(() => {
      smsCooldown.value--
      if (smsCooldown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
    ElMessage.success('验证码已发送')
  } catch (error) {
    ElMessage.error('发送验证码失败，请稍后重试')
    throw error
  }
  
  // 记录安全操作日志
  const userId = currentUserId.value;
  logSecurityOperation({
    userId,
    operation: 'send_phone_code',
    description: '发送手机验证码',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
}

const sendEmailCode = async (): Promise<void> => {
  try {
    // 调用真实API接口发送邮箱验证码
    await sendEmailVerificationCode({
      email: emailForm.email,
      type: 'email_binding'
    })
    
    emailCooldown.value = 60
    const timer = setInterval(() => {
      emailCooldown.value--
      if (emailCooldown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
    ElMessage.success('验证码已发送')
  } catch (error) {
    ElMessage.error('发送验证码失败，请稍后重试')
    throw error
  }
  
  // 记录安全操作日志
  const userId = currentUserId.value;
  logSecurityOperation({
    userId,
    operation: 'send_email_code',
    description: '发送邮箱验证码',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
}

const bindPhone = async (): Promise<void> => {
  // 验证用户令牌
  const isTokenValid = await validateUserToken()
  if (!isTokenValid) {
    console.log('令牌验证失败')
    return
  }
  
  if (!phoneForm.phone || !phoneForm.code) {
    ElMessage.error('请填写完整信息')
    return
  }
  phoneVerified.value = true
  ElMessage.success('手机绑定成功')
  showPhoneDialog.value = false
  
  // 记录安全操作日志
  const userId = currentUserId.value;
  logSecurityOperation({
    userId,
    operation: 'bind_phone',
    description: '绑定手机号码',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
}

const bindEmail = async (): Promise<void> => {
  // 验证用户令牌
  const isTokenValid = await validateUserToken()
  if (!isTokenValid) {
    console.log('令牌验证失败')
    return
  }
  
  if (!emailForm.email || !emailForm.code) {
    ElMessage.error('请填写完整信息')
    return
  }
  emailVerified.value = true
  ElMessage.success('邮箱绑定成功')
  showEmailDialog.value = false
  
  // 记录安全操作日志
  const userId = currentUserId.value;
  logSecurityOperation({
    userId,
    operation: 'bind_email',
    description: '绑定邮箱地址',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
}

const exportLoginHistory = (): void => {
  try {
    // 准备CSV数据
    // 添加BOM以支持UTF-8编码，解决Excel打开乱码问题
    const csvHeader = '\uFEFF';
    const csvContent = [
      ['登录时间', '设备信息', 'IP地址', '地理位置'],
      ...loginHistory.value.map(record => [
        record.time,
        record.device,
        record.ip,
        record.location
      ])
    ]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // 创建Blob对象
    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `login-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success('登录历史已导出');

    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'export_login_history',
      description: '导出登录历史记录',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });

    // 重新加载安全日志
    initializeSecurityLogs();
  } catch (error) {
    console.error('导出登录历史失败:', error);
    ElMessage.error('导出失败，请稍后重试');
  }
}

const clearLoginHistory = (): void => {
  ElMessageBox.confirm('确定要清空所有登录历史记录吗？', '提示', {    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loginHistory.value = []
    ElMessage.success('登录历史已清空')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'clear_login_history',
      description: '清空登录历史记录',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  }).catch(() => {
    // 取消操作
  })
}

const deleteLoginRecord = (recordId: number): void => {
  ElMessageBox.confirm('确定要删除这条登录记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = loginHistory.value.findIndex(record => record.id === recordId)
    if (index > -1) {
      loginHistory.value.splice(index, 1)
    }
    ElMessage.success('登录记录已删除')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'delete_login_record',
      description: `删除登录记录 ID: ${recordId}`,
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  }).catch(() => {
    // 取消操作
  })
}

const exportDetailedLoginHistory = (): void => {
  try {
    // 准备CSV数据
    // 添加BOM以支持UTF-8编码，解决Excel打开乱码问题
    const csvHeader = '\uFEFF';
    const csvContent = [
      ['登录时间', '设备信息', '浏览器', 'IP地址', '地理位置', '登录状态'],
      ...detailedLoginHistory.value.map(record => [
        record.time,
        record.device,
        record.browser,
        record.ip,
        record.location,
        record.status
      ])
    ]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // 创建Blob对象
    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `detailed-login-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success('详细登录历史已导出');

    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'export_detailed_login_history',
      description: '导出详细登录历史记录',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });

    // 重新加载安全日志
    initializeSecurityLogs();
  } catch (error) {
    console.error('导出详细登录历史失败:', error);
    ElMessage.error('导出失败，请稍后重试');
  }
}
const clearDetailedLoginHistory = (): void => {
  ElMessageBox.confirm('确定要清空所有详细登录历史记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    detailedLoginHistory.value = []
    ElMessage.success('详细登录历史已清空')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'clear_detailed_login_history',
      description: '清空详细登录历史记录',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  }).catch(() => {
    // 取消操作
  })
}

const deleteDetailedLoginRecord = (recordId: number): void => {
  ElMessageBox.confirm('确定要删除这条详细登录记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = detailedLoginHistory.value.findIndex(record => record.id === recordId)
    if (index > -1) {
      detailedLoginHistory.value.splice(index, 1)
    }
    ElMessage.success('详细登录记录已删除')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'delete_detailed_login_record',
      description: `删除详细登录记录 ID: ${recordId}`,
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  }).catch(() => {
    // 取消操作
  })
}

const currentDeviceCount = computed(() => {
  return loginDevices.value.filter(device => device.current).length
})

/**
 * 筛选登录历史
 * 重新加载第一页数据
 */
const filterLoginHistory = (): void => {
  loginHistoryPagination.currentPage = 1
  fetchLoginHistoryData()
  ElMessage.success('筛选条件已应用')
}

/**
 * 重置登录历史筛选
 * 清空筛选条件并重新加载
 */
const resetLoginHistoryFilter = (): void => {
  loginHistoryFilter.keyword = ''
  loginHistoryFilter.dateRange = []
  loginHistoryPagination.currentPage = 1
  fetchLoginHistoryData()
}

const hasLoginHistoryFilters = computed(() => {
  return loginHistoryFilter.keyword !== '' || (loginHistoryFilter.dateRange && loginHistoryFilter.dateRange.length > 0)
})

const hasLoginHistorySort = computed(() => {
  return loginHistorySort.prop !== '' && loginHistorySort.order !== ''
})

const clearAllLoginHistoryFilters = (): void => {
  resetLoginHistoryFilter()
  loginHistorySort.prop = ''
  loginHistorySort.order = ''
  ElMessage.info('已清除所有筛选和排序')
}

// 详细登录历史筛选
const filterDetailedLoginHistory = (): void => {
  detailedLoginHistoryPagination.currentPage = 1
  fetchDetailedLoginHistoryData()
  ElMessage.success('筛选条件已应用')
}

// 重置详细登录历史筛选
const resetDetailedLoginHistoryFilter = (): void => {
  detailedLoginHistoryFilter.keyword = ''
  detailedLoginHistoryFilter.dateRange = []
  detailedLoginHistoryFilter.status = ''
  detailedLoginHistoryPagination.currentPage = 1
  fetchDetailedLoginHistoryData()
}

const hasDetailedLoginHistoryFilters = computed(() => {
  return detailedLoginHistoryFilter.keyword !== '' || (detailedLoginHistoryFilter.dateRange && detailedLoginHistoryFilter.dateRange.length > 0) || detailedLoginHistoryFilter.status !== ''
})

const hasDetailedLoginHistorySort = computed(() => {
  return detailedLoginHistorySort.prop !== '' && detailedLoginHistorySort.order !== ''
})

const clearAllDetailedLoginHistoryFilters = (): void => {
  resetDetailedLoginHistoryFilter()
  detailedLoginHistorySort.prop = ''
  detailedLoginHistorySort.order = ''
  ElMessage.info('已清除所有筛选和排序')
}

const handleDetailedLoginHistorySort = (sort: { prop: string; order: string }): void => {
  detailedLoginHistorySort.prop = sort.prop
  detailedLoginHistorySort.order = sort.order
}

const handleLoginHistorySort = (sort: { prop: string; order: string }): void => {
  loginHistorySort.prop = sort.prop
  loginHistorySort.order = sort.order
}

const refreshDeviceList = async (): Promise<void> => {
  try {
    const loading = ElLoading.service({
      lock: true,
      text: '正在刷新设备列表...',
      background: 'rgba(0, 0, 0, 0.7)'
    });
    
    await loadCurrentDeviceSessions();
    
    loading.close();
    ElMessage.success('设备列表已刷新');
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'refresh_device_list',
      description: '刷新设备列表',
      ip: clientIpAddress.value || '127.0.0.1',
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  } catch (error) {
    console.error('刷新设备列表失败:', error);
    ElMessage.error('刷新设备列表失败');
  }
}

const removeAllDevices = (): void => {
  ElMessageBox.confirm('确定要注销除当前设备外的所有设备吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const loading = ElLoading.service({
        lock: true,
        text: '正在注销设备...',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      const response = await revokeOtherBackendDeviceSessionsAPI();
      
      if (response.success) {
        // 同时清理本地
        const userId = currentUserId.value;
        logoutAllDevices(userId);
        
        await loadCurrentDeviceSessions();
        loading.close();
        ElMessage.success('其他设备已成功注销');
        
        // 记录安全操作日志
        logSecurityOperation({
          userId,
          operation: 'remove_all_devices',
          description: '注销所有非当前设备',
          ip: clientIpAddress.value || '127.0.0.1',
          userAgent: navigator.userAgent,
          status: 'success'
        });
        
        // 重新加载安全日志
        initializeSecurityLogs();
      } else {
        loading.close();
        ElMessage.error('注销设备失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('注销设备失败:', error);
      ElMessage.error('注销设备失败');
    }
  }).catch(() => {
    // 取消操作
  })
}

const removeDevice = (device: any): void => {
  const deviceId = typeof device === 'object' ? device.id : device;
  const sessionsToRemove = device.sessions || [{ id: deviceId }];
  
  ElMessageBox.confirm('确定要注销该设备吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const loading = ElLoading.service({
        lock: true,
        text: '正在注销设备...',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      const userId = currentUserId.value;
      let anySuccess = false;
      
      // 遍历并注销该设备下的所有会话
      for (const session of sessionsToRemove) {
        const response = await revokeBackendDeviceSessionAPI(session.id);
        if (response.success) {
          anySuccess = true;
          // 同时清理本地
          logoutDevice(userId, String(session.id));
        }
      }
      
      if (anySuccess) {
        await loadCurrentDeviceSessions();
        loading.close();
        ElMessage.success('设备已成功注销');
        
        // 记录安全操作日志
        logSecurityOperation({
          userId,
          operation: 'remove_device',
          description: `注销设备 IP: ${device.ip || deviceId}`,
          ip: clientIpAddress.value || '127.0.0.1',
          userAgent: navigator.userAgent,
          status: 'success'
        });
        
        // 重新加载安全日志
        initializeSecurityLogs();
      } else {
        loading.close();
        ElMessage.error('注销设备失败');
      }
    } catch (error) {
      console.error('注销设备失败:', error);
      ElMessage.error('注销设备失败');
    }
  }).catch(() => {
    // 取消操作
  })
}

const copyBackupCode = async (code: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('验证码已复制到剪贴板')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'copy_backup_code',
      description: '复制备用验证码',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = code
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('验证码已复制到剪贴板')
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'copy_backup_code_fallback',
      description: '复制备用验证码（降级方案）',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  }
}

const regenerateBackupCodes = async (): Promise<void> => {
  try {
    const { value: code } = await ElMessageBox.prompt('请输入6位动态验证码或备用码以重新生成备用验证码', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'text',
      inputPattern: /^[a-zA-Z0-9]{6,10}$/,
      inputErrorMessage: '请输入有效的验证码或备用码'
    })
    
    // 重新生成备份验证码
    const response = await apiRegenerateBackupCodes(code)
    
    // 关键点：处理双层 data 结构 (Rule 5)
    const actualData = response.data?.data || response.data;
    
    if (response.success && actualData?.backupCodes) {
      backupCodes.value = actualData.backupCodes
      backupCodesCount.value = actualData.backupCodes.length
      ElMessage.success('备用验证码已重新生成')
      
      // 记录安全操作日志
      const userId = currentUserId.value;
      logSecurityOperation({
        userId,
        operation: 'regenerate_backup_codes',
        description: '重新生成备用验证码',
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'success'
      });
      
      // 重新加载安全日志
      initializeSecurityLogs();
    } else {
      ElMessage.error(response.message || '重新生成失败，请稍后重试')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重新生成备份验证码失败:', error)
      ElMessage.error('重新生成失败，请稍后重试')
      
      // 记录安全操作日志
      const userId = currentUserId.value;
      logSecurityOperation({
        userId,
        operation: 'regenerate_backup_codes_failed',
        description: '重新生成备用验证码失败',
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'failed',
        details: { error: (error as Error).message }
      });
      
      // 重新加载安全日志
      initializeSecurityLogs();
    }
  }
}

const saveLoginLimit = async (): Promise<void> => {
  try {
    // 验证用户令牌
    const isTokenValid = await validateUserToken()
    if (!isTokenValid) {
      console.log('令牌验证失败')
      return
    }
    // 获取当前用户ID
    const userId = currentUserId.value
    
    // 保存登录限制配置
    const config = {
      maxDevices: loginLimitForm.maxDevices,
      autoLogout: loginLimitForm.autoLogout,
      enabled: loginLimitForm.enabled
    };
    
    saveLoginDeviceLimitConfig(userId, config);
    
    // 如果启用了设备限制，检查当前设备数量
    if (config.enabled) {
      // 更新设备列表
      loadCurrentDeviceSessions();
      
      // 如果当前活跃设备数量超过限制，执行自动登出逻辑
      if (config.autoLogout) {
        const sessions = getActiveDeviceSessions(userId);
        const activeSessions = sessions.filter(session => session.isActive);
        
        if (activeSessions.length > config.maxDevices) {
          // 按登录时间排序，最早的在前
          const sortedSessions = [...activeSessions].sort((a, b) => a.loginTime - b.loginTime);
          
          // 标记最早的设备为非活跃（移除模拟登出逻辑）
          const sessionToLogout = sortedSessions[0];
          if (sessionToLogout) {
            sessionToLogout.isActive = false;
            
            // 更新sessions数组中的对应项
            const indexToLogout = sessions.findIndex(s => s.id === sessionToLogout.id);
            if (indexToLogout >= 0) {
              sessions[indexToLogout] = sessionToLogout;
            }
            
            // 保存更新后的会话列表
            saveActiveDeviceSessions(userId, sessions);
            
            ElMessage.warning(`已自动登出最早登录的设备，因为超过最大设备数量限制(${config.maxDevices}台)`);
          }
        }
      }
    }
    
    ElMessage.success(`登录限制设置已保存：${config.enabled ? '已启用' : '已禁用'}设备限制，${config.enabled ? `最大设备数 ${config.maxDevices}，${config.autoLogout ? '启用' : '禁用'}自动登出` : ''}`);
    showLoginLimitDialog.value = false;
    
    // 记录安全操作日志
    logSecurityOperation({
      userId,
      operation: 'save_login_device_limit',
      description: `保存登录设备限制设置：${config.enabled ? '已启用' : '已禁用'}设备限制，${config.enabled ? `最大设备数 ${config.maxDevices}，${config.autoLogout ? '启用' : '禁用'}自动登出` : ''}`,
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  } catch (error) {
    console.error('保存登录限制设置失败:', error);
    ElMessage.error('保存失败，请稍后重试');
  }
}

const saveSecurityQuestions = async (): Promise<void> => {
  // 验证用户令牌
  const isTokenValid = await validateUserToken()
  if (!isTokenValid) {
    console.log('令牌验证失败')
    return
  }
  
  if (!securityQuestionForm.question1 || !securityQuestionForm.answer1 ||
      !securityQuestionForm.question2 || !securityQuestionForm.answer2 ||
      !securityQuestionForm.question3 || !securityQuestionForm.answer3) {
    ElMessage.error('请填写所有安全问题和答案')
    return
  }
  
  try {
    const userId = currentUserId.value
    saveSecurityQuestionConfig(userId, {...securityQuestionForm})
    ElMessage.success('安全问题设置成功')
    showSecurityQuestionDialog.value = false
      
    // 记录安全操作日志
    logSecurityOperation({
      userId,
      operation: 'set_security_questions',
      description: '设置安全问题',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
      
    // 重新加载安全日志
    initializeSecurityLogs();
  } catch (error) {
    console.error('保存安全问题失败:', error)
    ElMessage.error('保存安全问题失败')
  }
}

const saveLockoutSettings = async (): Promise<void> => {
  try {
    // 验证用户令牌
    const isTokenValid = await validateUserToken()
    if (!isTokenValid) {
      console.log('令牌验证失败')
      return
    }
    // 获取当前配置
    const config = getSecurityConfig()
    config.lockout = { ...lockoutSettings }
    
    // 保存配置
    saveSecurityConfig(config)
    
    ElMessage.success('账户锁定设置已保存')
    showLockoutSettings.value = false
    
    // 重新检查账户锁定状态以应用新设置
    checkAccountLockStatus()
    
    // 记录安全操作日志
    const userId = currentUserId.value;
    logSecurityOperation({
      userId,
      operation: 'save_lockout_settings',
      description: '保存账户锁定设置',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  } catch (error) {
    console.error('保存账户锁定设置失败:', error)
    ElMessage.error('保存失败，请稍后重试')
  }
}

const cancelLockoutSettings = (): void => {
  // 恢复原始设置
  Object.assign(lockoutSettings, originalLockoutSettings)
  showLockoutSettings.value = false
  ElMessage.info('已取消修改')
  
  // 记录安全操作日志
  const userId = currentUserId.value;
  logSecurityOperation({
    userId,
    operation: 'cancel_lockout_settings',
    description: '取消账户锁定设置修改',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
}

// 打开会话超时设置
const openSessionTimeoutDialog = (): void => {
  initializeFromGlobalConfig()
  showSessionTimeoutDialog.value = true
}

// 取消会话超时设置
const cancelSessionTimeout = (): void => {
  // 恢复原始设置
  Object.assign(sessionTimeoutForm, originalSessionTimeoutSettings)
  showSessionTimeoutDialog.value = false
  ElMessage.info('已取消修改')
  
  // 记录安全操作日志
  const userId = currentUserId.value;
  logSecurityOperation({
    userId,
    operation: 'cancel_session_timeout',
    description: '取消会话超时设置修改',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
}

const saveSessionTimeout = async (): Promise<void> => {
  // 验证用户令牌
  const isTokenValid = await validateUserToken()
  if (!isTokenValid) {
    console.log('令牌验证失败')
    return
  }

  try {
    const loading = ElLoading.service({
      lock: true,
      text: '正在保存设置...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    const response = await updateSecuritySettings({
      session_timeout_minutes: sessionTimeoutForm.timeout,
      session_timeout_warning_minutes: sessionTimeoutForm.warningTime
    })

    loading.close()

    if (response.success) {
      // 从后端返回的数据中获取实际生效的值（可能已被后端自动调整）
      const { effectiveTimeout, effectiveWarning, sessionTimeoutAdjusted } = response.data.validation || {}
      
      const finalTimeout = effectiveTimeout !== undefined ? effectiveTimeout : sessionTimeoutForm.timeout
      const finalWarning = effectiveWarning !== undefined ? effectiveWarning : sessionTimeoutForm.warningTime
      
      if (sessionTimeoutAdjusted) {
        ElMessage.warning({
          message: `设置已保存，但根据安全规则已自动调整：超时时长 ${finalTimeout} 分钟，提醒时间 ${finalWarning} 分钟`,
          duration: 5000
        })
      } else {
        ElMessage.success(`会话超时设置已保存：超时时长 ${finalTimeout} 分钟，提醒时间 ${finalWarning} 分钟`)
      }
      
      showSessionTimeoutDialog.value = false
      
      // 更新本地表单和原始设置为实际生效的值
      sessionTimeoutForm.timeout = finalTimeout
      sessionTimeoutForm.warningTime = finalWarning
      Object.assign(originalSessionTimeoutSettings, sessionTimeoutForm)
      
      // 更新全局自动登出配置（使用毫秒精度）
      updateAutoLogoutConfig({
        enabled: true,
        timeoutMinutes: finalTimeout,
        warningMinutes: finalWarning
      })
      
      // 激活全局自动登出机制
      activateAutoLogout()

      // 记录安全操作日志
      const userId = currentUserId.value;
      logSecurityOperation({
        userId,
        operation: 'UPDATE',
        description: `保存会话超时设置：超时时长 ${sessionTimeoutForm.timeout} 分钟，提醒时间 ${sessionTimeoutForm.warningTime} 分钟`,
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'success',
        action: 'UPDATE_SESSION_TIMEOUT'
      });
      
      // 重新加载安全日志
      initializeSecurityLogs();
    } else {
      ElMessage.error(response.message || '保存失败，请稍后重试')
    }
  } catch (error) {
    console.error('保存会话超时设置失败:', error)
    ElMessage.error('保存失败，请稍后重试')
  }
}

const resetRateLimitCounter = (): void => {
  try {
    // 获取当前用户ID
    const userId = currentUserId.value
    
    // 重置失败尝试计数器
    resetFailedAttempts(userId)
    
    ElMessage.success('频率限制计数器已重置')
    
    // 记录安全操作日志
    logSecurityOperation({
      userId,
      operation: 'reset_rate_limit_counter',
      description: '重置登录频率限制计数器',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  } catch (error) {
    console.error('重置频率限制计数器失败:', error)
    ElMessage.error('重置失败，请稍后重试')
  }
}

const manuallyLockAccount = async (): Promise<void> => {
  try {
    lockOperationLoading.value = true
    
    // 获取当前用户ID
    const userId = currentUserId.value
    
    // 获取锁定时长配置
    const config = getSecurityConfig()
    const lockoutDuration = config.lockout.lockoutDuration
    
    // 手动锁定账户，使用配置的锁定时长
    try {
      const { lockAccountAPI } = await import('@/services/accountUnlockService')
      const response = await lockAccountAPI(userId, lockoutDuration)
      
      if (!response.success) {
        throw new Error(response.message || '调用锁定接口失败')
      }
      
      // 同时更新本地状态作为备份
      serviceManuallyLockAccount(userId, lockoutDuration)
      
      // 更新本地状态
      accountLocked.value = true
      remainingLockTime.value = lockoutDuration * 60 // 转换为秒
      
      ElMessage.success(`账户已手动锁定，锁定时长${lockoutDuration}分钟`)
      
      // 开始倒计时
      startLockCountdown()
      
      // 记录安全操作日志
      logSecurityOperation({
        userId,
        operation: 'manually_lock_account',
        description: `手动锁定账户，锁定时长${lockoutDuration}分钟`,
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'success'
      });
      
      // 重新加载安全日志
      initializeSecurityLogs();
    } catch (apiError) {
      console.error('调用锁定API失败:', apiError)
      // 如果API失败，我们仍然允许本地锁定作为一种安全降级措施
      serviceManuallyLockAccount(userId, lockoutDuration)
      accountLocked.value = true
      remainingLockTime.value = lockoutDuration * 60
      ElMessage.warning(`本地锁定成功，但云端同步失败: ${apiError instanceof Error ? apiError.message : '未知错误'}`)
      startLockCountdown()
    }
  } catch (error) {
    console.error('手动锁定账户失败:', error)
    ElMessage.error('锁定失败，请稍后重试')
  } finally {
    lockOperationLoading.value = false
  }
}

// 开始锁定倒计时
const startLockCountdown = (): void => {
  if (lockStatusTimer.value) {
    clearInterval(lockStatusTimer.value)
  }
  
  lockStatusTimer.value = window.setInterval(() => {
    if (remainingLockTime.value > 0) {
      remainingLockTime.value--
    } else {
      // 锁定时间结束
      accountLocked.value = false
      if (lockStatusTimer.value) {
        clearInterval(lockStatusTimer.value)
        lockStatusTimer.value = null
      }
    }
  }, 1000)
}

const exportSecurityLog = (): void => {
  try {
    const userId = currentUserId.value
    const logData = exportSecurityOperationLogs(userId)
    
    // 确保数据存在且为字符串
    if (!logData) {
      ElMessage.error('没有可导出的日志数据')
      return
    }
    
    // 确保是字符串格式
    const csvContent = typeof logData === 'string' ? logData : JSON.stringify(logData)
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // 检查Blob是否创建成功
    if (!blob || blob.size === 0) {
      ElMessage.error('生成文件失败')
      return
    }
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `security-log-${new Date().toISOString().split('T')[0]}.csv`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 延迟释放URL
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
    
    ElMessage.success('安全日志导出成功')
  } catch (error) {
    console.error('导出安全日志失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

// 删除旧的performSecurityCheck函数，将在上面定义新的实现

// 生物识别功能切换
const toggleBiometric = async (type: BiometricType, enabled: boolean): Promise<void> => {
  try {
    biometricLoading[type] = true
    
    if (enabled) {
      // 启用生物识别
      const result = await enableBiometric(type)
      
      if (result.success) {
        ElMessage.success(result.message)
        // 更新本地状态
        if (type === 'fingerprint') {
          fingerprintEnabled.value = true
        } else {
          faceRecognitionEnabled.value = true
        }
        
        // 记录安全操作日志
        const userId = currentUserId.value;
        logSecurityOperation({
          userId,
          operation: 'enable_biometric',
          description: type === 'fingerprint' ? '启用指纹识别' : '启用人脸识别',
          ip: '127.0.0.1', // 实际应用中应获取真实IP
          userAgent: navigator.userAgent,
          status: 'success'
        });
        
        // 重新加载安全日志
        initializeSecurityLogs();
      } else {
        // 启用失败，回滚开关状态
        ElMessage.error(result.message)
        if (type === 'fingerprint') {
          fingerprintEnabled.value = false
        } else {
          faceRecognitionEnabled.value = false
        }
      }
    } else {
      // 禁用生物识别
      const result = disableBiometric(type)
      
      if (result.success) {
        ElMessage.success(result.message)
        // 更新本地状态
        if (type === 'fingerprint') {
          fingerprintEnabled.value = false
        } else {
          faceRecognitionEnabled.value = false
        }
        
        // 记录安全操作日志
        const userId = currentUserId.value;
        logSecurityOperation({
          userId,
          operation: 'disable_biometric',
          description: type === 'fingerprint' ? '禁用指纹识别' : '禁用人脸识别',
          ip: '127.0.0.1', // 实际应用中应获取真实IP
          userAgent: navigator.userAgent,
          status: 'success'
        });
        
        // 重新加载安全日志
        initializeSecurityLogs();
      } else {
        // 禁用失败，回滚开关状态
        ElMessage.error(result.message)
        if (type === 'fingerprint') {
          fingerprintEnabled.value = true
        } else {
          faceRecognitionEnabled.value = true
        }
      }
    }
  } catch (error) {
    console.error('生物识别切换错误:', error)
    ElMessage.error('操作失败，请稍后重试')
    // 回滚开关状态
    if (type === 'fingerprint') {
      fingerprintEnabled.value = !enabled
    } else {
      faceRecognitionEnabled.value = !enabled
    }
  } finally {
    biometricLoading[type] = false
  }
}

// 解锁当前用户账户
const unlockCurrentUserAccount = async (): Promise<void> => {
  try {
    unlockLoading.value = true
    
    // 获取当前用户ID
    const userId = currentUserId.value
    
    // 解锁账户
    try {
      const { unlockAccountAPI } = await import('@/services/accountUnlockService')
      const response = await unlockAccountAPI(userId)
      
      if (!response.success) {
        throw new Error(response.message || '解锁账户失败')
      }
      
      // 调用本地解锁函数更新UI状态
      unlockAccount(userId)
    } catch (error) {
      console.error('解锁账户失败:', error)
      ElMessage.error('解锁账户失败: ' + (error as Error).message)
      return
    }
    
    // 更新本地状态
    accountLocked.value = false
    remainingLockTime.value = 0
    
    ElMessage.success('账户已解锁')
    
    // 记录安全操作日志
    logSecurityOperation({
      userId,
      operation: 'unlock_account',
      description: '解锁账户',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
  } catch (error) {
    console.error('解锁账户失败:', error)
    ElMessage.error('解锁失败，请稍后重试')
  } finally {
    unlockLoading.value = false
  }
}

// 格式化剩余时间
const formatRemainingTime = (seconds: number): string => {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds <= 0) {
    return '0秒'
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  } else {
    return `${remainingSeconds}秒`
  }
}

// 同步账户锁定状态与后端
const syncAccountLockStatusWithBackend = async (): Promise<void> => {
  try {
    const userId = currentUserId.value
    console.log(`[SecuritySettings] 开始同步账户锁定状态, userId: ${userId}`)
    const response = await getAccountStatusAPI(userId)
    
    // 处理双层嵌套结构: response.data.data.status 或 response.data.status
    if (response.success && response.data) {
      const actualData = response.data.data || response.data
      
      if (actualData && actualData.status) {
        const serverStatus = actualData.status
        console.log('[SecuritySettings] 获取到服务器状态:', serverStatus)
        
        // 如果服务器说没锁定，但本地有锁定记录，则清除本地锁定记录
        if (!serverStatus.isLocked) {
          const manualLockStr = localStorage.getItem(`manualLock_${userId}`)
          const attempts = getLoginAttempts(userId)
          const localLockStatus = getAccountLockStatus(userId, getSecurityConfig())
          
          if (manualLockStr || (attempts && attempts.length > 0) || localLockStatus.isLocked) {
            console.log('[SecuritySettings] 检测到服务器已解锁，正在清除本地锁定状态...')
            localStorage.removeItem(`manualLock_${userId}`)
            unlockAccount(userId) // 清除本地 manualLock
            resetFailedAttempts(userId) // 重置本地失败计数
            
            accountLocked.value = false
            remainingLockTime.value = 0
            lockReason.value = '账户正常'
            console.log('[SecuritySettings] 本地锁定状态已清除')
          }
        } else {
          // 服务器说锁定了，更新本地状态
          accountLocked.value = true
          remainingLockTime.value = serverStatus.remainingTime || 0
          
          // 更新锁定原因
          if (serverStatus.failedLoginAttempts >= lockoutSettings.maxFailedAttempts) {
            lockReason.value = `连续${serverStatus.failedLoginAttempts}次登录失败`
          } else {
            lockReason.value = '安全策略锁定'
          }
          console.log(`[SecuritySettings] 服务器状态为已锁定, 剩余时间: ${remainingLockTime.value}s`)
        }
      }
    }
  } catch (error) {
    console.error('[SecuritySettings] 同步账户锁定状态失败:', error)
  }
}

// 检查账户锁定状态
const checkAccountLockStatus = (): void => {
  try {
    // 获取当前用户ID
    const userId = currentUserId.value
    
    // 获取安全配置
    const config = getSecurityConfig()
    
    // 获取账户锁定状态 (从本地存储)
    const lockStatus = getAccountLockStatus(userId, config)
    
    // 更新本地状态
    accountLocked.value = lockStatus.isLocked
    remainingLockTime.value = lockStatus.remainingTime || 0
    
    // 更新锁定原因
    if (lockStatus.isLocked) {
      // 检查是否是手动锁定
      const manualLockStr = localStorage.getItem(`manualLock_${userId}`)
      if (manualLockStr) {
        lockReason.value = '管理员手动锁定'
      } else {
        // 检查是否是失败尝试过多导致的锁定
        const attempts = getLoginAttempts(userId)
        if (config.lockout.maxFailedAttempts > 0) {
          const recentAttempts = [...attempts].reverse()
          let consecutiveFailures = 0
          
          for (const attempt of recentAttempts) {
            if (attempt.success) {
              break
            }
            consecutiveFailures++
          }
          
          if (consecutiveFailures >= config.lockout.maxFailedAttempts) {
            lockReason.value = `连续${consecutiveFailures}次登录失败`
          } else {
            lockReason.value = '安全策略锁定'
          }
        } else {
          lockReason.value = '安全策略锁定'
        }
      }
    } else {
      lockReason.value = '账户正常'
    }
  } catch (error) {
    console.error('检查账户锁定状态失败:', error)
  }
}

// 初始化生物识别支持检查
const initializeBiometricSupport = async (): Promise<void> => {
  try {
    const support = await checkBiometricSupport()
    biometricAvailable.value = support.biometricAvailable
    fingerprintEnabled.value = support.fingerprintEnabled
    faceRecognitionEnabled.value = support.faceRecognitionEnabled
  } catch (error) {
    console.error('初始化生物识别支持检查失败:', error)
    biometricAvailable.value = false
    fingerprintEnabled.value = false
    faceRecognitionEnabled.value = false
  }
}

// 同步两步验证状态
const syncTwoFactorStatus = async (): Promise<void> => {
  try {
    console.log('[SecuritySettings] 开始从后端同步两步验证状态...')
    const statusResponse = await checkTotpStatus()
    
    // 关键点：处理双层 data 结构 (Rule 5)
    const actualData = statusResponse.data?.data || statusResponse.data;
    
    if (statusResponse.success && actualData) {
      console.log('[SecuritySettings] 获取到两步验证状态:', actualData.enabled ? '开启' : '关闭')
      twoFactorEnabled.value = !!actualData.enabled
      intendedTwoFactorState.value = !!actualData.enabled
      originalTwoFactorState.value = !!actualData.enabled
      backupCodesCount.value = actualData.backupCodesCount || 0
    }
  } catch (error) {
    console.error('[SecuritySettings] 同步两步验证状态失败:', error)
  }
}

// 初始化安全配置
const initializeSecurityConfig = (): void => {
  try {
    // 获取安全配置
    const config = getSecurityConfig()
    
    // 更新本地状态
    loginRateLimit.value = config.rateLimit.enabled
    Object.assign(lockoutSettings, config.lockout)
    
    // 注意：两步验证状态现在通过 syncTwoFactorStatus 从后端同步，不再这里硬编码
  } catch (error) {
    console.error('初始化安全配置失败:', error)
  }
}

// 启动锁定状态定时检查
const startLockStatusCheck = (): void => {
  // 立即检查一次
  checkAccountLockStatus()
  // 立即与后端同步一次
  syncAccountLockStatusWithBackend()
  
  // 每秒检查一次本地锁定状态（用于更新倒计时）
  lockStatusTimer.value = window.setInterval(() => {
    checkAccountLockStatus()
    
    // 每30秒与后端同步一次状态
    const seconds = Math.floor(Date.now() / 1000)
    if (seconds % 30 === 0) {
      syncAccountLockStatusWithBackend()
    }
  }, 1000) as unknown as number
}

// 停止锁定状态定时检查
const stopLockStatusCheck = (): void => {
  if (lockStatusTimer.value) {
    clearInterval(lockStatusTimer.value)
    lockStatusTimer.value = null
  }
}

// 生命周期
onMounted(async () => {
  // 开始令牌计时器
  startTokenTimer()
  
  // 模拟加载数据
  console.log('安全设置页面加载完成')
  
  // 验证用户令牌
  try {
    const isTokenValid = await validateUserToken()
    if (!isTokenValid) {
      console.log('令牌验证失败')
      // 令牌验证失败的处理已经在validateUserToken中处理
      return
    }
  } catch (error) {
    console.error('令牌验证异常:', error)
  }
  
  // 初始化客户端检测信息
  await initializeClientInfo()
  
  // 记录页面访问日志
  const userId = currentUserId.value;
  await logSecurityOperation({
    userId,
    operation: 'page_view',
    description: '访问安全设置页面',
    ip: clientIpAddress.value,
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 初始化生物识别支持
  await initializeBiometricSupport()
  // 同步两步验证状态
  await syncTwoFactorStatus()
  // 初始化安全配置
  initializeSecurityConfig()
  // 启动锁定状态检查
  startLockStatusCheck()
  // 初始化登录设备限制配置
  initializeLoginDeviceLimitConfig()
  // 加载当前设备会话
  await loadCurrentDeviceSessions()
  // 初始化数据加密状态（自动启用）
  await initializeDataEncryptionStatus()
  // 初始化登录保护和异常登录提醒状态
  await initializeLoginProtectionStatus()
  // 初始化安全日志
  await initializeSecurityLogs()
  // 初始化安全评估历史记录
  initializeSecurityAssessmentHistory()
  
  // 启动登录历史自动刷新
  startLoginHistoryAutoRefresh()
})

// 初始化登录设备限制配置
const initializeLoginDeviceLimitConfig = (): void => {
  try {
    // 获取当前用户ID（实际应用中应从用户信息获取）
    const userId = currentUserId.value;
    const config = getLoginDeviceLimitConfig(userId);
    
    // 更新表单数据
    loginLimitForm.maxDevices = config.maxDevices;
    loginLimitForm.autoLogout = config.autoLogout;
    loginLimitForm.enabled = config.enabled;
  } catch (error) {
    console.error('初始化登录设备限制配置失败:', error);
  }
}

// 加载当前设备会话
const loadCurrentDeviceSessions = async (): Promise<void> => {
  try {
    // 获取当前用户ID
    const userId = currentUserId.value;
    
    console.log('开始加载设备会话，用户ID:', userId);
    
    // 优先从后端获取
    const response = await getBackendDeviceSessionsAPI();
    
    // 处理双层嵌套结构: response.data.data.sessions 或 response.data.sessions (Rule 5)
    const actualData = response.data?.data || response.data;
    
    if (response.success && actualData && actualData.sessions) {
      console.log('从后端加载设备会话成功:', actualData.sessions);
      
      // 转换后端数据格式以匹配前端显示需求
      const sessions = actualData.sessions.map((session: any) => {
        // 提取时间值并转换为时间戳
        const getTimestamp = (value: any): number => {
          if (!value) return Date.now()
          if (typeof value === 'number') return value
          if (typeof value === 'string') return new Date(value).getTime()
          if (value instanceof Date) return value.getTime()
          if (value.getTime) return value.getTime()
          return Date.now()
        }
        
        return {
          id: String(session.id),
          userId: session.userId || userId,
          loginTime: getTimestamp(session.loginTime || session.createdAt),
          lastActiveTime: getTimestamp(session.lastActiveTime || session.lastAccessedAt),
          userAgent: session.userAgent || 'Unknown Agent',
          ipAddress: session.ipAddress || '0.0.0.0',
          isActive: session.status === 'active' || (session as any).isActive === true,
          deviceInfo: session.deviceInfo || {},
          isCurrent: session.isCurrent || false,
          hasIpConflict: session.hasIpConflict || false,
          deviceId: session.deviceId
        }
      });
      
      currentDeviceSessions.value = sessions;
      activeDeviceCount.value = actualData.count || sessions.length;
      
      // 同步更新 loginDevices 以兼容不同的对话框，并按 IP 归类设备
      const devicesByIp: Record<string, any> = {};
      sessions.forEach(s => {
        const ip = s.ipAddress || '0.0.0.0';
        if (!devicesByIp[ip]) {
          devicesByIp[ip] = {
            id: s.id, // 使用最新会话的 ID 作为设备 ID
            name: getDeviceDisplayName(s.userAgent),
            lastLogin: formatDateTime(s.loginTime as number),
            location: (s.deviceInfo as any)?.location || '未知地点',
            ip: ip,
            current: s.isCurrent,
            hasIpConflict: s.hasIpConflict,
            sessionCount: 1,
            sessions: [s]
          };
        } else {
          devicesByIp[ip].sessionCount++;
          devicesByIp[ip].sessions.push(s);
          // 如果组内有任何一个是当前设备，则标记为当前设备
          if (s.isCurrent) devicesByIp[ip].current = true;
          // 如果组内有任何一个有冲突，则标记为有冲突
          if (s.hasIpConflict) devicesByIp[ip].hasIpConflict = true;
          // 更新最后登录时间为最新的
          const currentLastLogin = new Date(devicesByIp[ip].lastLogin).getTime();
          const sessionLogin = new Date(s.loginTime).getTime();
          if (sessionLogin > currentLastLogin) {
            devicesByIp[ip].lastLogin = formatDateTime(s.loginTime as number);
          }
        }
      });
      
      loginDevices.value = Object.values(devicesByIp);
      
      // 寻找当前设备ID
      const current = sessions.find(s => s.isCurrent);
      if (current) {
        currentDeviceId.value = String(current.id);
      }
    } else {
      console.warn('后端获取设备会话失败或为空，尝试本地存储:', response.message);
      // 后端失败时退回到本地存储（保持向后兼容）
      cleanupExpiredSessions(userId);
      const userAgent = getUserAgent();
      const ipAddress = getClientIpAddress();
      const currentSession = recordNewDeviceSession(userId, userAgent, ipAddress);
      currentDeviceId.value = currentSession.id;
      const sessions = getActiveDeviceSessions(userId);
      currentDeviceSessions.value = [...sessions];
      activeDeviceCount.value = sessions.filter(session => session.isActive).length;
      
      // 同步更新 loginDevices
      loginDevices.value = sessions.map(s => ({
        id: s.id,
        name: getDeviceDisplayName(s.userAgent),
        lastLogin: formatDateTime(s.loginTime as number),
        location: '未知地点',
        ip: s.ipAddress,
        current: String(s.id) === currentDeviceId.value
      }));
    }
  } catch (error) {
    console.error('加载当前设备会话异常:', error);
  }
}

// 格式化日期时间 - 增强版
const formatDateTime = (timestamp: number | string | undefined | null): string => {
  try {
    // 处理 null、undefined 和空字符串
    if (timestamp === undefined || timestamp === null || timestamp === '') {
      return '-'
    }
    
    // 处理数字时间戳
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return '-'
      }
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    // 处理字符串时间（ISO格式、时间戳字符串等）
    if (typeof timestamp === 'string') {
      // 尝试解析字符串时间
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        console.warn('[formatDateTime] 无法解析时间字符串:', timestamp)
        return '-'
      }
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    // 处理对象时间（如 Date 对象）
    if (typeof timestamp === 'object' && timestamp instanceof Date) {
      return timestamp.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    // 处理有 toISOString 方法的对象（如 PostgreSQL 时间戳对象）
    if (typeof timestamp === 'object' && timestamp.toISOString) {
      const date = new Date(timestamp.toISOString())
      if (isNaN(date.getTime())) {
        return '-'
      }
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    // 其他情况
    console.warn('[formatDateTime] 未知时间格式:', typeof timestamp, timestamp)
    return '-'
    
  } catch (error) {
    console.error('[formatDateTime] 格式化时间时发生错误:', error, timestamp)
    return '-'
  }
}

// 获取设备显示名称
const getDeviceDisplayName = (userAgent: string): string => {
  // 简单解析用户代理字符串，提取浏览器和操作系统信息
  let browserName = '未知浏览器';
  let osName = '未知系统';
  
  // 检测浏览器
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browserName = 'Opera';
  }
  
  // 检测操作系统
  if (userAgent.includes('Windows')) {
    osName = 'Windows';
  } else if (userAgent.includes('Mac')) {
    osName = 'macOS';
  } else if (userAgent.includes('Linux')) {
    osName = 'Linux';
  } else if (userAgent.includes('Android')) {
    osName = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    osName = 'iOS';
  }
  
  return `${browserName} / ${osName}`;
}

// 处理登出指定设备
const handleLogoutDevice = (deviceId: string): void => {
  ElMessageBox.confirm('确定要登出此设备吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 获取当前用户ID
      const userId = currentUserId.value
      
      console.log('开始注销设备:', deviceId);
      
      // 优先调用后端API
      const response = await revokeBackendDeviceSessionAPI(deviceId);
      
      if (response.success) {
        ElMessage.success('设备已成功注销');
        
        // 同时清理本地（如果存在）
        logoutDevice(userId, deviceId);
        
        // 重新加载设备列表
        await loadCurrentDeviceSessions();
        
        // 记录安全操作日志
        logSecurityOperation({
          userId,
          operation: 'logout_device',
          description: `注销设备: ${deviceId}`,
          ip: clientIpAddress.value || '127.0.0.1',
          userAgent: navigator.userAgent,
          status: 'success'
        });
        
        // 重新加载安全日志
        initializeSecurityLogs();
      } else {
        // 如果后端 API 不存在或失败，尝试本地操作
        console.warn('后端注销失败，尝试本地注销:', response.message);
        const success = logoutDevice(userId, deviceId);
        
        if (success) {
          ElMessage.success('设备已从本地注销');
          await loadCurrentDeviceSessions();
          
          logSecurityOperation({
            userId,
            operation: 'logout_device',
            description: `本地注销设备: ${deviceId}`,
            ip: clientIpAddress.value || '127.0.0.1',
            userAgent: navigator.userAgent,
            status: 'success'
          });
        } else {
          ElMessage.error('注销设备失败: ' + (response.message || '未知错误'));
        }
      }
    } catch (error) {
      console.error('注销设备失败:', error);
      ElMessage.error('注销设备失败');
    }
  }).catch(() => {
    // 取消操作
  });
}

// 处理登出所有设备
const handleLogoutAllDevices = (): void => {
  ElMessageBox.confirm('确定要注销其他所有设备吗？此操作将使您在其他设备上都需要重新登录。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 获取当前用户ID
      const userId = currentUserId.value
      
      console.log('开始注销所有其他设备');
      
      // 调用后端API撤销其他会话
      const response = await revokeOtherBackendDeviceSessionsAPI();
      
      if (response.success) {
        ElMessage.success('其他设备已成功注销');
        
        // 同时清理本地
        logoutAllDevices(userId);
        
        // 重新加载设备列表
        await loadCurrentDeviceSessions();
        
        // 记录安全操作日志
        logSecurityOperation({
          userId,
          operation: 'logout_all_devices',
          description: '注销除当前设备外的所有设备',
          ip: clientIpAddress.value || '127.0.0.1',
          userAgent: navigator.userAgent,
          status: 'success'
        });
        
        // 重新加载安全日志
        initializeSecurityLogs();
      } else {
        console.warn('后端注销所有设备失败，尝试本地注销:', response.message);
        logoutAllDevices(userId);
        ElMessage.success('所有其他设备已从本地注销');
        await loadCurrentDeviceSessions();
      }
    } catch (error) {
      console.error('注销所有设备失败:', error);
      ElMessage.error('注销所有设备失败');
    }
  }).catch(() => {
    // 取消操作
  });
}

// 监听登录历史对话框状态
watch(showLoginHistory, (val) => {
  if (val) {
    fetchLoginHistoryData()
  }
})

// 监听详细登录历史对话框状态
watch(showDetailedLoginHistory, (val) => {
  if (val) {
    fetchDetailedLoginHistoryData()
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopTokenTimer()
  stopLockStatusCheck()
  stopLoginHistoryAutoRefresh()
})
</script>

<style scoped>
.session-timeout-validation {
  margin-bottom: 20px;
}

.validation-alert {
  border-radius: 8px;
}

.session-timeout-form {
  padding: 10px 0;
}

.validation-footer-info {
  margin-top: 15px;
  padding: 10px;
  background-color: #f0f9eb;
  border-left: 4px solid #67c23a;
  color: #606266;
  font-size: 13px;
  display: flex;
  align-items: center;
}

.info-icon {
  margin-right: 8px;
  color: #67c23a;
  font-size: 16px;
}

.form-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: block;
}
.backup-codes-actions-inline {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 15px 0;
}

.security-settings {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 500;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.settings-content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.settings-tabs {
  margin-bottom: 20px;
}

.setting-section {
  margin-bottom: 32px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  min-width: 120px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.setting-control {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: 24px;
}

.token-status-info {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.remaining-time-tag {
  font-family: monospace;
  font-weight: bold;
  min-width: 80px;
  text-align: center;
}

.setting-desc {
  color: #909399;
  font-size: 13px;
  margin-right: 16px;
}

.strength-indicator {
  width: 100px;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
  margin-left: 8px;
}

.strength-bar {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.strength-weak {
  width: 33%;
  background: #f56c6c;
}

.strength-medium {
  width: 66%;
  background: #e6a23c;
}

.strength-strong {
  width: 100%;
  background: #67c23a;
}

.verify-code-group {
  display: flex;
  gap: 10px;
}

.verify-code-group .el-input {
  flex: 1;
}

.device-list {
  max-height: 400px;
  overflow-y: auto;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.device-item:last-child {
  border-bottom: none;
}

.session-count-tag {
  margin-left: 8px;
  font-weight: normal;
}

.device-conflict-warning {
  margin-top: 4px;
}

.conflict-icon {
  margin-left: 4px;
  vertical-align: middle;
  cursor: help;
}

.device-info {
  flex: 1;
}

.device-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.device-time {
  color: #909399;
  font-size: 13px;
  margin-bottom: 2px;
}

.device-location {
  color: #909399;
  font-size: 13px;
  margin-bottom: 2px;
}

.device-ip {
  color: #909399;
  font-size: 13px;
  margin-bottom: 2px;
}

.device-status {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.device-status.current {
  background-color: #f0f9ff;
  color: #409eff;
  border: 1px solid #409eff;
}

.device-status.other {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #dcdfe6;
}

.device-management-header {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 16px;
}

.device-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.device-actions {
  margin-left: 16px;
}

.login-history-filters {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.login-history-filters .el-form-item {
  margin-bottom: 12px;
}

.login-history-filter-form .el-form-item {
  margin-right: 12px;
  margin-bottom: 0;
}

.login-history-filter-form .el-form-item__label {
  font-size: 14px;
}

.login-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.login-history-header .active-filter {
  background-color: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.login-history-controls {
  display: flex;
  gap: 12px;
}

.login-history-stats {
  color: #909399;
  font-size: 14px;
}

.login-history-table {
  margin-top: 16px;
}

.login-history {
  max-height: 400px;
  overflow-y: auto;
}

.login-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.login-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.login-history-controls {
  display: flex;
  gap: 12px;
}

.login-history-stats {
  color: #909399;
  font-size: 14px;
}

.login-item:last-child {
  border-bottom: none;
}

.login-time {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.login-device {
  color: #606266;
  margin-bottom: 2px;
}

.login-ip {
  color: #909399;
  font-size: 13px;
  margin-bottom: 2px;
}

.login-location {
  color: #909399;
  font-size: 13px;
  margin-bottom: 2px;
}

.login-actions {
  margin-top: 8px;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
}

.log-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.log-action {
  color: #606266;
  margin-bottom: 2px;
}

.log-ip {
  color: #909399;
  font-size: 13px;
}

.backup-codes-container {
  padding: 20px 0;
}

.backup-codes-desc {
  color: #909399;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.backup-codes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.backup-code-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.backup-code-item:hover {
  background: #e6e8eb;
}

.code-number {
  color: #909399;
  font-size: 12px;
  margin-right: 8px;
  min-width: 20px;
}

.code-text {
  flex: 1;
  font-family: monospace;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.copy-icon {
  color: #409eff;
  font-size: 14px;
  margin-left: 8px;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.backup-code-item:hover .copy-icon {
  opacity: 1;
}

.backup-codes-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.form-desc {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.detailed-login-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detailed-login-history-header .active-filter {
  background-color: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.detailed-login-controls {
  display: flex;
  gap: 12px;
}

.detailed-login-stats {
  color: #909399;
  font-size: 14px;
}

.detailed-login-history {
  max-height: 500px;
  overflow-y: auto;
}

.login-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.login-history-item:last-child {
  border-bottom: none;
}

.login-info {
  flex: 1;
}

.login-time {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.login-device {
  color: #606266;
  margin-bottom: 2px;
}

.login-browser {
  color: #909399;
  font-size: 13px;
}

.login-location {
  text-align: center;
  margin: 0 16px;
}

.login-ip {
  color: #606266;
  margin-bottom: 2px;
}

.login-address {
  color: #909399;
  font-size: 13px;
}

.login-status {
  margin-left: 16px;
}

.risk-details {
  padding: 20px 0;
}

.risk-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.risk-item:last-child {
  border-bottom: none;
}

.risk-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.risk-desc {
  color: #606266;
  margin-bottom: 8px;
  font-size: 14px;
}

.risk-solution {
  color: #409eff;
  font-size: 13px;
}

/* 两步验证设置样式 */
.two-factor-setup {
  padding: 20px 0;
}

.setup-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  display: block;
}

.qr-placeholder {
  width: 150px;
  height: 150px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-content {
  text-align: center;
}

.qr-logo {
  font-size: 32px;
  margin-bottom: 8px;
}

.qr-text {
  color: #909399;
  font-size: 14px;
}

.secret-key {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.key-label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
}

.key-value {
  flex: 1;
  font-family: monospace;
  font-size: 16px;
  color: #303133;
  word-break: break-all;
}

.copy-button {
  margin-left: 8px;
}

.verification-input {
  margin-top: 20px;
}

.verification-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.backup-codes-display {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.backup-codes-display .backup-code-item {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.backup-codes-display .code-number {
  color: #909399;
  font-size: 12px;
  margin-right: 8px;
  min-width: 20px;
}

.backup-codes-display .code-text {
  flex: 1;
  font-family: monospace;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.setup-step {
  min-height: 300px;
}

/* 密码强度指示器 */
.password-strength-indicator {
  display: flex;
  align-items: center;
  margin-top: 8px;
  gap: 12px;
}

.strength-label {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.strength-bar-container {
  flex: 1;
  height: 6px;
  background-color: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 3px;
}

.strength-bar.strength-weak {
  background-color: #f56c6c;
}

.strength-bar.strength-medium {
  background-color: #e6a23c;
}

.strength-bar.strength-strong {
  background-color: #67c23a;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  min-width: 24px;
  text-align: right;
}

.strength-text.text-弱 {
  color: #f56c6c;
}

.strength-text.text-中 {
  color: #e6a23c;
}

.strength-text.text-强 {
  color: #67c23a;
}

/* 密码要求检查 */
.password-requirements {
  margin-top: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.password-requirements .requirements-title {
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
  font-size: 14px;
}

/* 账户状态 */
.account-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lock-timer {
  font-weight: 500;
  font-size: 14px;
}

.status-normal {
  color: #67c23a;
  font-size: 14px;
}

/* 锁定状态信息 */
.lock-status-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lock-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lock-status-label {
  font-weight: 500;
  color: #606266;
  min-width: 60px;
}

.lock-status-info .el-tag {
  align-self: flex-start;
}

.lock-status-info .lock-timer {
  font-size: 12px;
  color: #f56c6c;
  font-weight: 500;
}

/* 锁定详情信息 */
.lock-details-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lock-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.lock-detail-label {
  font-weight: 500;
  color: #606266;
  min-width: 70px;
  font-size: 13px;
}

/* 账户状态信息 */
.account-status-info {
  display: flex;
  align-items: center;
}

.status-text {
  color: #67c23a;
  font-size: 13px;
}

/* 锁定状态信息 */
.lock-status-info {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}

.lock-status-info span {
  display: block;
  margin-bottom: 4px;
}

.lock-status-info span:last-child {
  margin-bottom: 0;
}

.requirement-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.requirement-item:last-child {
  margin-bottom: 0;
}

.requirement-item.met {
  color: #67c23a;
}

.requirement-icon {
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  margin-right: 8px;
  font-weight: bold;
}

.requirement-text {
  flex: 1;
}

/* 会话安全提醒弹窗增强样式 */
.security-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
  pointer-events: auto;
}

.security-modal-container {
  width: 90%;
  max-width: 420px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: modal-zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.security-modal-content {
  display: flex;
  flex-direction: column;
}

.security-modal-header {
  padding: 24px 24px 16px;
  text-align: center;
  border-bottom: 1px solid #f0f2f5;
}

.security-shield-icon {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 12px;
}

.security-modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}

.security-modal-body {
  padding: 32px 24px;
}

.inactivity-warning-content {
  text-align: center;
}

.inactivity-warning-content .warning-icon {
  font-size: 42px;
  color: #e6a23c;
  margin-bottom: 20px;
}

.inactivity-warning-content p {
  margin: 10px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.inactivity-warning-content .countdown-time {
  color: #f56c6c;
  font-weight: 700;
  font-size: 24px;
  margin: 0 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.security-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #dcdfe6, transparent);
  margin: 24px 0;
}

.activity-hint {
  color: #909399 !important;
  font-size: 14px !important;
  font-weight: 400 !important;
}

.activity-methods {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
}

.activity-methods span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
  background-color: #f4f4f5;
  padding: 6px 12px;
  border-radius: 20px;
}

.security-modal-footer {
  padding: 16px 24px 24px;
  text-align: center;
}

.security-confirm-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  letter-spacing: 1px;
  transition: all 0.2s;
}

.security-confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

/* 动画效果 */
@keyframes modal-zoom-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.security-fade-enter-active,
.security-fade-leave-active {
  transition: opacity 0.3s ease;
}

.security-fade-enter-from,
.security-fade-leave-to {
  opacity: 0;
}

/* 无操作警告对话框 (旧样式清理) */
.inactivity-warning-content {
  text-align: center;
  padding: 0;
}

/* 响应式布局增强 */
@media (max-width: 480px) {
  .security-modal-container {
    width: 95%;
    max-width: none;
    margin: 0 10px;
  }
  
  .activity-methods {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .security-settings {
    padding: 16px;
  }
  
  .settings-content {
    padding: 16px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .setting-control {
    margin-left: 0;
    margin-top: 8px;
    width: 100%;
  }
  
  .setting-label {
    min-width: auto;
  }
  
  .backup-codes-grid {
    grid-template-columns: 1fr;
  }
  
  .login-history-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .login-location {
    margin: 8px 0;
    text-align: left;
  }
  
  .login-status {
    margin-left: 0;
    margin-top: 8px;
  }
  
  .device-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .device-actions {
    margin-left: 0;
    margin-top: 8px;
  }
  
  .backup-codes-display {
    grid-template-columns: 1fr;
  }
}

/* 登录设备限制相关样式 */
.current-devices-info {
  margin-top: 16px;
}

.current-devices-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.current-devices-info p {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #606266;
}

.device-actions {
  margin-top: 12px;
  text-align: right;
}

.form-desc {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

/* 安全评估历史记录样式 */
.factors-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}.factor-item {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.2;
}

.factor-danger {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

.factor-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #f5dab1;
}

.factor-name {
  margin-right: 4px;
  font-weight: 500;
}

.factor-score {
  font-weight: bold;
}
/* 响应式安全评估历史记录 */
@media (max-width: 768px) {
  .factors-list {
    gap: 4px;
  }
  
  .factor-item {
    font-size: 11px;
    padding: 1px 4px;
  }
}

/* 客户端安全检测样式 */
.client-security-info {
  width: 100%;
}

.client-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.info-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  color: #909399;
  font-size: 13px;
  white-space: nowrap;
}

.info-value {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

.security-reminders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.security-reminder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
}

.security-reminder-item.danger {
  background-color: #fef0f0;
  color: #f56c6c;
  border-left: 4px solid #f56c6c;
}

.security-reminder-item.warning {
  background-color: #fdf6ec;
  color: #e6a23c;
  border-left: 4px solid #e6a23c;
}

.security-reminder-item.info {
  background-color: #f0f9eb;
  color: #67c23a;
  border-left: 4px solid #67c23a;
}

.reminder-text {
  flex: 1;
}
</style>