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
                <span class="setting-desc">防止暴力破解攻击</span>
                <el-switch 
                  v-model="loginRateLimit" 
                  @change="(val: boolean) => toggleLoginRateLimit(val)" 
                  size="default" 
                  :loading="rateLimitLoading"
                />
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
                <span class="setting-desc" :style="{ color: accountLocked ? '#f56c6c' : '#67c23a' }">
                  {{ accountLocked ? `已锁定 (${formatRemainingTime(remainingLockTime)})` : '正常' }}
                </span>
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
            
            <!-- 会话管理 -->
            <div class="setting-item">
              <span class="setting-label">自动登出</span>
              <div class="setting-control">
                <span class="setting-desc">无操作{{ sessionTimeout }}分钟后自动登出</span>
                <el-button @click="showSessionTimeoutDialog = true" size="default">设置</el-button>
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
                <el-button @click="showSecurityLog = true" size="default">查看日志</el-button>
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
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 修改密码对话框 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-width="80px" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password @input="updatePasswordStrength" />
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
              <span class="requirement-text">特殊字符（例如 !@#$%^&*）</span>
            </div>
            <div class="requirement-item" :class="{ 'met': calculatedStrength.requirements.noConsecutive }">
              <span class="requirement-icon">{{ calculatedStrength.requirements.noConsecutive ? '✓' : '○' }}</span>
              <span class="requirement-text">连续出现的字符不超过两个</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确定</el-button>
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
            <div class="device-name">{{ device.name }}</div>
            <div class="device-time">最后登录: {{ device.lastLogin }}</div>
            <div class="device-location">位置: {{ device.location }}</div>
            <div class="device-ip" v-if="device.ip">IP: {{ device.ip }}</div>
            <div class="device-status" :class="device.current ? 'current' : 'other'">
              {{ device.current ? '当前设备' : '其他设备' }}
            </div>
          </div>
          <div class="device-actions">
            <el-button 
              v-if="!device.current" 
              type="danger" 
              size="small" 
              @click="removeDevice(device.id)"
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
    <el-dialog v-model="showLoginHistory" title="登录历史" width="700px">
      <div class="login-history-header">
        <div class="login-history-controls">
          <el-button type="primary" @click="exportLoginHistory" size="small">导出记录</el-button>
          <el-button @click="clearLoginHistory" size="small">清空记录</el-button>
        </div>
        <div class="login-history-stats">
          <span>总计 {{ loginHistory.length }} 条记录</span>
        </div>
      </div>
      <div class="login-history">
        <div class="login-item" v-for="record in loginHistory" :key="record.id">
          <div class="login-time">{{ record.time }}</div>
          <div class="login-device">{{ record.device }}</div>
          <div class="login-ip">IP: {{ record.ip }}</div>
          <div class="login-location">{{ record.location }}</div>
          <div class="login-actions">
            <el-button type="danger" size="small" @click="deleteLoginRecord(record.id)">删除</el-button>
          </div>
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
        <div class="log-item" v-for="log in securityLogs" :key="log.id">
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
      width="500px"
    >
      <el-form :model="loginLimitForm" label-width="120px">
        <el-form-item label="最大设备数">
          <el-input-number 
            v-model="loginLimitForm.maxDevices" 
            :min="1" 
            :max="10"
            controls-position="right"
          />
          <span class="form-desc">同时在线的最大设备数量</span>
        </el-form-item>
        <el-form-item label="自动登出">
          <el-switch v-model="loginLimitForm.autoLogout" />
          <span class="form-desc">超过设备限制时自动登出最早登录的设备</span>
        </el-form-item>
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
      width="800px"
    >
      <div class="detailed-login-history-header">
        <div class="detailed-login-controls">
          <el-button type="primary" @click="exportDetailedLoginHistory" size="small">导出详细记录</el-button>
          <el-button @click="clearDetailedLoginHistory" size="small">清空详细记录</el-button>
        </div>
        <div class="detailed-login-stats">
          <span>总计 {{ detailedLoginHistory.length }} 条详细记录</span>
        </div>
      </div>
      <div class="detailed-login-history">
        <div class="login-history-item" v-for="history in detailedLoginHistory" :key="history.id">
          <div class="login-info">
            <div class="login-time">{{ history.time }}</div>
            <div class="login-device">{{ history.device }}</div>
            <div class="login-browser">{{ history.browser }}</div>
          </div>
          <div class="login-location">
            <div class="login-ip">IP: {{ history.ip }}</div>
            <div class="login-address">{{ history.location }}</div>
          </div>
          <div class="login-status">
            <el-tag :type="history.status === '成功' ? 'success' : 'danger'">
              {{ history.status }}
            </el-tag>
          </div>
          <div class="login-actions">
            <el-button type="danger" size="small" @click="deleteDetailedLoginRecord(history.id)">删除</el-button>
          </div>
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
          <el-button @click="showLockoutSettings = false">取消</el-button>
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
      <el-form :model="sessionTimeoutForm" label-width="120px">
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
            :max="10"
            controls-position="right"
          />
          <span class="form-desc">登出前提前多少分钟提醒（1-10分钟）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSessionTimeoutDialog = false">取消</el-button>
          <el-button type="primary" @click="saveSessionTimeout">保存</el-button>
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
              v-if="twoFactorQrCode && twoFactorQrCode.startsWith('data:image')"
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import QRCode from 'qrcode'
import { 
  checkBiometricSupport,
  enableBiometric,
  disableBiometric,
  isBiometricEnabled,
  type BiometricType
} from '@/services/biometricService'
import { 
  getSecurityConfig,
  saveSecurityConfig,
  getAccountLockStatus,
  unlockAccount,
  type SecurityConfig
} from '@/services/accountSecurityService'
import { 
  enableTwoFactor,
  disableTwoFactor,
  activateTwoFactor,
  getTwoFactorStatus,
  getTwoFactorConfig,
  saveTwoFactorConfig,
  verifyTwoFactorToken,
  hexToBase32,
  regenerateBackupCodes as generateNewBackupCodes
} from '@/services/twoFactorService'

// 当前激活的标签页
const activeTab = ref('account')

// 安全状态
const phoneVerified = ref(true)
const emailVerified = ref(true)
const twoFactorEnabled = ref(false)
const passwordStrength = ref('强')
const loginProtection = ref(false)
const abnormalLoginAlert = ref(true)
const fingerprintEnabled = ref(false)
const faceRecognitionEnabled = ref(false)
const loginRateLimit = ref(true)
const dataEncryptionEnabled = ref(false)
const securityScore = ref(85)
const securityRiskLevel = ref('低风险')
const biometricAvailable = ref(false)
const accountLocked = ref(false)
const remainingLockTime = ref(0)

// 加载状态
const biometricLoading = reactive({
  fingerprint: false,
  face: false
})
const rateLimitLoading = ref(false)
const unlockLoading = ref(false)
const twoFactorLoading = ref(false)

// 两步验证相关状态
const showTwoFactorSetupDialog = ref(false)
const twoFactorStep = ref(0)
const twoFactorSecret = ref('')
const twoFactorQrCode = ref('')
const twoFactorCode = ref('')
const isTwoFactorCodeValid = ref(false)
const newBackupCodes = ref<string[]>([])
const twoFactorAccountId = ref('default_user') // 实际应用中应从用户信息获取
// 用于跟踪用户真实意图的临时变量
const intendedTwoFactorState = ref(false)
// 保存原始状态，用于在取消操作时恢复
const originalTwoFactorState = ref(false)

// 定时器
const lockStatusTimer = ref<number | null>(null)

// 对话框显示状态
const showPasswordDialog = ref(false)
const showPhoneDialog = ref(false)
const showEmailDialog = ref(false)
const showDeviceDialog = ref(false)
const showLoginHistory = ref(false)
const showSecurityLog = ref(false)
const showBackupCodesDialog = ref(false)
const showLoginLimitDialog = ref(false)
const showSecurityQuestionDialog = ref(false)
const showDetailedLoginHistory = ref(false)
const showLockoutSettings = ref(false)
const showSessionTimeoutDialog = ref(false)
const showRiskDetails = ref(false)

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
  autoLogout: true
})

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

const sessionTimeoutForm = reactive({
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

// 计算密码强度
const calculatePasswordStrength = (password: string): { level: string; score: number; requirements: Record<string, boolean> } => {
  const requirements = {
    minLength: password.length >= 8,  // 至少8个字符
    lowercase: /[a-z]/.test(password),  // 小写字母
    uppercase: /[A-Z]/.test(password),  // 大写字母
    number: /\d/.test(password),       // 数字
    special: /[^A-Za-z0-9]/.test(password),  // 特殊字符
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
  
  return { level, score, requirements };
}

const calculatedStrength = computed(() => {
  return calculatePasswordStrength(passwordForm.newPassword)
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

const backupCodesCount = computed(() => {
  return backupCodes.value.length
})

const maxFailedAttempts = computed(() => {
  return lockoutSettings.maxFailedAttempts
})

const sessionTimeout = computed(() => {
  return sessionTimeoutForm.timeout
})

// 模拟数据
const backupCodes = ref([
  '123456', '789012', '345678', '901234', '567890', '234567',
  '890123', '456789', '012345', '678901', '234567', '890123'
])

const loginDevices = ref([
  {
    id: 1,
    name: 'Chrome - Windows 10',
    lastLogin: '2024-01-15 14:30:25',
    location: '北京市',
    ip: '192.168.1.100',
    current: true
  },
  {
    id: 2,
    name: 'Safari - iPhone',
    lastLogin: '2024-01-15 10:15:30',
    location: '上海市',
    ip: '192.168.1.101',
    current: false
  },
  {
    id: 3,
    name: 'Firefox - macOS',
    lastLogin: '2024-01-14 18:45:12',
    location: '广州市',
    ip: '192.168.1.102',
    current: false
  }
])

const loginHistory = ref([
  {
    id: 1,
    time: '2024-01-15 14:30:25',
    device: 'Chrome - Windows 10',
    ip: '192.168.1.100',
    location: '北京市'
  },
  {
    id: 2,
    time: '2024-01-15 10:15:30',
    device: 'Safari - iPhone',
    ip: '192.168.1.101',
    location: '上海市'
  },
  {
    id: 3,
    time: '2024-01-14 18:45:12',
    device: 'Firefox - macOS',
    ip: '192.168.1.102',
    location: '广州市'
  }
])

const securityLogs = ref([
  {
    id: 1,
    time: '2024-01-15 14:30:25',
    action: '登录成功',
    ip: '192.168.1.100'
  },
  {
    id: 2,
    time: '2024-01-15 10:15:30',
    action: '修改密码',
    ip: '192.168.1.101'
  },
  {
    id: 3,
    time: '2024-01-14 18:45:12',
    action: '绑定手机',
    ip: '192.168.1.102'
  }
])

const detailedLoginHistory = ref([
  {
    id: 1,
    time: '2024-01-15 14:30:25',
    device: 'Chrome - Windows 10',
    browser: 'Chrome 120.0',
    ip: '192.168.1.100',
    location: '北京市朝阳区',
    status: '成功'
  },
  {
    id: 2,
    time: '2024-01-15 10:15:30',
    device: 'Safari - iPhone',
    browser: 'Safari 17.1',
    ip: '192.168.1.101',
    location: '上海市浦东新区',
    status: '成功'
  },
  {
    id: 3,
    time: '2024-01-14 18:45:12',
    device: 'Firefox - macOS',
    browser: 'Firefox 121.0',
    ip: '192.168.1.102',
    location: '广州市天河区',
    status: '失败'
  }
])

const securityRisks = ref([
  {
    title: '密码强度不足',
    description: '您的密码强度为中等，建议使用更复杂的密码',
    solution: '使用包含大小写字母、数字和特殊字符的密码，长度不少于12位'
  },
  {
    title: '未启用数据加密',
    description: '您的敏感数据未启用端到端加密',
    solution: '在账号保护设置中启用数据加密功能'
  }
])

// 倒计时
const smsCooldown = ref(0)
const emailCooldown = ref(0)

// 方法
const updatePasswordStrength = (): void => {
  // 实时更新密码强度，这里不需要做任何事情，因为computed属性会自动更新
}

const changePassword = (): void => {
  // 模拟密码修改
  ElMessage.success('密码修改成功')
  
  // 更新密码强度
  const strength = calculatePasswordStrength(passwordForm.newPassword)
  passwordStrength.value = strength.level
  
  showPasswordDialog.value = false
  // 重置表单
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const toggleTwoFactor = async (value: boolean): Promise<void> => {
  try {
    twoFactorLoading.value = true
    
    if (value) {
      // 保存原始状态
      originalTwoFactorState.value = twoFactorEnabled.value
      
      // 检查是否已有有效的两步验证配置
      const twoFactorStatus = getTwoFactorStatus(twoFactorAccountId.value)
      
      if (twoFactorStatus.enabled) {
        // 如果已有有效的两步验证配置，直接进入验证码验证步骤
        const config = getTwoFactorConfig(twoFactorAccountId.value)
        if (config) {
          twoFactorSecret.value = config.secret
          newBackupCodes.value = config.backupCodes
          twoFactorStep.value = 0
          twoFactorCode.value = ''
          isTwoFactorCodeValid.value = false
          
          // 不需要生成二维码，直接显示验证码输入界面
          twoFactorQrCode.value = '' // 清空二维码
          twoFactorEnabled.value = false // 临时设为false，验证通过后再设为true
          showTwoFactorSetupDialog.value = true
        }
      } else {
        // 如果没有有效的两步验证配置，初始化新的设置
        const result = enableTwoFactor(twoFactorAccountId.value)
        twoFactorSecret.value = result.secret
        newBackupCodes.value = result.backupCodes
        twoFactorStep.value = 0
        twoFactorCode.value = ''
        isTwoFactorCodeValid.value = false
        twoFactorQrCode.value = '' // 先清空，避免显示旧数据
        
        // 生成二维码
        // 密钥已经是Base32格式，直接使用
        const totpUrl = `otpauth://totp/AccountingSystem:${twoFactorAccountId.value}?secret=${result.secret}&issuer=AccountingSystem`
        
        // 使用Promise确保异步操作正确完成
        QRCode.toDataURL(totpUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 256
        }).then((url: string) => {
          twoFactorQrCode.value = url
          console.log('二维码生成成功')
        }).catch((error: Error) => {
          console.error('生成二维码失败:', error)
          ElMessage.warning('二维码生成失败，请使用密钥手动添加')
          twoFactorQrCode.value = ''
        })
        
        // 注意：此时不立即启用两步验证，需要用户完成验证码验证后才真正启用
        // 先将开关状态设为false，等用户完成设置后再设为true
        twoFactorEnabled.value = false
        showTwoFactorSetupDialog.value = true
      }
    } else {
      // 禁用两步验证
      disableTwoFactor(twoFactorAccountId.value)
      twoFactorEnabled.value = false
      intendedTwoFactorState.value = false
      ElMessage.success('两步验证已关闭')
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
    // 验证TOTP代码
    const isValid = await verifyTwoFactorToken(twoFactorAccountId.value, twoFactorCode.value)
    
    if (isValid) {
      // 验证通过，激活两步验证
      activateTwoFactor(twoFactorAccountId.value)
      
      // 更新状态
      twoFactorStep.value = 1
      twoFactorEnabled.value = true
      intendedTwoFactorState.value = true
      ElMessage.success('验证通过')
    } else {
      ElMessage.error('验证码错误，请重新输入')
    }
  } catch (error) {
    console.error('验证两步验证码失败:', error)
    ElMessage.error('验证失败，请稍后重试')
  }
}

const completeTwoFactorSetup = (): void => {
  // 真正启用两步验证
  const twoFactorStatus = getTwoFactorStatus(twoFactorAccountId.value)
  if (twoFactorStatus.enabled) {
    twoFactorEnabled.value = true
    intendedTwoFactorState.value = true
    showTwoFactorSetupDialog.value = false
    twoFactorStep.value = 0
    ElMessage.success('两步验证已成功启用')
  } else {
    ElMessage.error('两步验证设置未完成，请先验证验证码')
  }
}

const cancelTwoFactorSetup = (): void => {
  showTwoFactorSetupDialog.value = false
  twoFactorStep.value = 0
  
  // 检查用户是否已完成两步验证设置
  const twoFactorStatus = getTwoFactorStatus(twoFactorAccountId.value)
  
  // 只有在真正完成设置的情况下才保持开启状态
  if (twoFactorStatus.enabled) {
    // 已完成设置，保持开关开启状态
    twoFactorEnabled.value = true
    intendedTwoFactorState.value = true
  } else {
    // 未完成设置，回滚到原始状态
    twoFactorEnabled.value = originalTwoFactorState.value
    intendedTwoFactorState.value = originalTwoFactorState.value
    // 不再清理配置，保留已有的配置以便下次使用
  }
}

const handleTwoFactorDialogClose = (): void => {
  // 检查用户是否已完成两步验证设置
  const twoFactorStatus = getTwoFactorStatus(twoFactorAccountId.value)
  
  // 只有在真正完成设置的情况下才保持开启状态
  if (twoFactorStatus.enabled) {
    // 已完成设置，保持开关开启状态
    twoFactorEnabled.value = true
    intendedTwoFactorState.value = true
  } else {
    // 未完成设置，回滚到原始状态
    twoFactorEnabled.value = originalTwoFactorState.value
    intendedTwoFactorState.value = originalTwoFactorState.value
    // 不再清理配置，保留已有的配置以便下次使用
  }
  
  // 重置步骤
  twoFactorStep.value = 0
}

const copySecretKey = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(twoFactorSecret.value)
    ElMessage.success('密钥已复制到剪贴板')
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = twoFactorSecret.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('密钥已复制到剪贴板')
  }
}

const toggleLoginProtection = (value: boolean): void => {
  if (value) {
    ElMessage.success('登录保护已开启')
  } else {
    ElMessage.warning('登录保护已关闭')
  }
}

const toggleAbnormalLoginAlert = (value: boolean): void => {
  if (value) {
    ElMessage.success('异常登录提醒已开启')
  } else {
    ElMessage.warning('异常登录提醒已关闭')
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
    } else {
      ElMessage.warning('登录频率限制已禁用')
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

const toggleDataEncryption = (value: boolean): void => {
  if (value) {
    ElMessage.success('数据加密已启用')
  } else {
    ElMessage.warning('数据加密已禁用')
  }
}

const sendPhoneCode = (): void => {
  // 模拟发送验证码
  smsCooldown.value = 60
  const timer = setInterval(() => {
    smsCooldown.value--
    if (smsCooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  ElMessage.success('验证码已发送到您的手机')
}

const sendEmailCode = (): void => {
  // 模拟发送验证码
  emailCooldown.value = 60
  const timer = setInterval(() => {
    emailCooldown.value--
    if (emailCooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  ElMessage.success('验证码已发送到您的邮箱')
}

const bindPhone = (): void => {
  if (!phoneForm.phone || !phoneForm.code) {
    ElMessage.error('请填写完整信息')
    return
  }
  phoneVerified.value = true
  ElMessage.success('手机绑定成功')
  showPhoneDialog.value = false
}

const bindEmail = (): void => {
  if (!emailForm.email || !emailForm.code) {
    ElMessage.error('请填写完整信息')
    return
  }
  emailVerified.value = true
  ElMessage.success('邮箱绑定成功')
  showEmailDialog.value = false
}

const exportLoginHistory = (): void => {
  // 模拟导出登录历史
  ElMessage.success('登录历史已导出')
}

const clearLoginHistory = (): void => {
  ElMessageBox.confirm('确定要清空所有登录历史记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loginHistory.value = []
    ElMessage.success('登录历史已清空')
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
  }).catch(() => {
    // 取消操作
  })
}

const exportDetailedLoginHistory = (): void => {
  // 模拟导出详细登录历史
  ElMessage.success('详细登录历史已导出')
}

const clearDetailedLoginHistory = (): void => {
  ElMessageBox.confirm('确定要清空所有详细登录历史记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    detailedLoginHistory.value = []
    ElMessage.success('详细登录历史已清空')
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
  }).catch(() => {
    // 取消操作
  })
}

const currentDeviceCount = computed(() => {
  return loginDevices.value.filter(device => device.current).length
})

const refreshDeviceList = (): void => {
  // 模拟刷新设备列表
  ElMessage.info('设备列表已刷新')
}

const removeAllDevices = (): void => {
  ElMessageBox.confirm('确定要移除所有非当前设备吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 只移除非当前设备
    loginDevices.value = loginDevices.value.filter(device => device.current)
    ElMessage.success('非当前设备已移除')
  }).catch(() => {
    // 取消操作
  })
}

const removeDevice = (deviceId: number): void => {
  ElMessageBox.confirm('确定要移除该设备吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = loginDevices.value.findIndex(device => device.id === deviceId)
    if (index > -1) {
      loginDevices.value.splice(index, 1)
    }
    ElMessage.success('设备移除成功')
  }).catch(() => {
    // 取消操作
  })
}

const copyBackupCode = async (code: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('验证码已复制到剪贴板')
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = code
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success('验证码已复制到剪贴板')
  }
}

const regenerateBackupCodes = (): void => {
  ElMessageBox.confirm('重新生成备用验证码将使之前的验证码失效，是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 重新生成备份验证码
    try {
      const newCodes = generateNewBackupCodes(twoFactorAccountId.value)
      backupCodes.value = newCodes
      ElMessage.success('备用验证码已重新生成')
    } catch (error) {
      console.error('重新生成备份验证码失败:', error)
      ElMessage.error('重新生成失败，请稍后重试')
    }
  }).catch(() => {
    // 取消操作
  })
}

const saveLoginLimit = (): void => {
  ElMessage.success('登录限制设置已保存')
  showLoginLimitDialog.value = false
}

const saveSecurityQuestions = (): void => {
  if (!securityQuestionForm.question1 || !securityQuestionForm.answer1 ||
      !securityQuestionForm.question2 || !securityQuestionForm.answer2 ||
      !securityQuestionForm.question3 || !securityQuestionForm.answer3) {
    ElMessage.error('请填写所有安全问题和答案')
    return
  }
  ElMessage.success('安全问题设置成功')
  showSecurityQuestionDialog.value = false
}

const saveLockoutSettings = (): void => {
  try {
    // 获取当前配置
    const config = getSecurityConfig()
    config.lockout = { ...lockoutSettings }
    
    // 保存配置
    saveSecurityConfig(config)
    
    ElMessage.success('账户锁定设置已保存')
    showLockoutSettings.value = false
  } catch (error) {
    console.error('保存账户锁定设置失败:', error)
    ElMessage.error('保存失败，请稍后重试')
  }
}

const saveSessionTimeout = (): void => {
  ElMessage.success('会话超时设置已保存')
  showSessionTimeoutDialog.value = false
}

const exportSecurityLog = (): void => {
  ElMessage.success('安全日志导出成功')
}

const performSecurityCheck = (): void => {
  ElMessage.info('正在进行安全检查...')
  // 模拟安全检查过程
  setTimeout(() => {
    securityScore.value = Math.floor(80 + Math.random() * 20)
    securityRiskLevel.value = securityScore.value > 90 ? '低风险' : securityScore.value > 70 ? '中风险' : '高风险'
    ElMessage.success('安全检查完成')
  }, 1500)
}

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
    
    // 获取当前用户ID（模拟）
    const accountId = 'default_user'
    
    // 解锁账户
    unlockAccount(accountId)
    
    // 更新本地状态
    accountLocked.value = false
    remainingLockTime.value = 0
    
    ElMessage.success('账户已解锁')
  } catch (error) {
    console.error('解锁账户失败:', error)
    ElMessage.error('解锁失败，请稍后重试')
  } finally {
    unlockLoading.value = false
  }
}

// 格式化剩余时间
const formatRemainingTime = (seconds: number): string => {
  if (seconds <= 0) return '0秒'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  } else {
    return `${remainingSeconds}秒`
  }
}

// 检查账户锁定状态
const checkAccountLockStatus = (): void => {
  try {
    // 获取当前用户ID（模拟）
    const accountId = 'default_user'
    
    // 获取安全配置
    const config = getSecurityConfig()
    
    // 获取账户锁定状态
    const lockStatus = getAccountLockStatus(accountId, config)
    
    // 更新本地状态
    accountLocked.value = lockStatus.isLocked
    remainingLockTime.value = lockStatus.remainingTime || 0
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

// 初始化安全配置
const initializeSecurityConfig = (): void => {
  try {
    // 获取安全配置
    const config = getSecurityConfig()
    
    // 更新本地状态
    loginRateLimit.value = config.rateLimit.enabled
    Object.assign(lockoutSettings, config.lockout)
    
    // 初始化两步验证状态为关闭（系统默认要求）
    twoFactorEnabled.value = false
    // 同步设置意图状态
    intendedTwoFactorState.value = false
  } catch (error) {
    console.error('初始化安全配置失败:', error)
  }
}

// 启动锁定状态定时检查
const startLockStatusCheck = (): void => {
  // 立即检查一次
  checkAccountLockStatus()
  
  // 每秒检查一次锁定状态
  lockStatusTimer.value = window.setInterval(() => {
    checkAccountLockStatus()
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
onMounted(() => {
  // 模拟加载数据
  console.log('安全设置页面加载完成')
  // 初始化生物识别支持
  initializeBiometricSupport()
  // 初始化安全配置
  initializeSecurityConfig()
  // 启动锁定状态检查
  startLockStatusCheck()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopLockStatusCheck()
})
</script>

<style scoped>
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
  justify-content: space-between;
  margin-left: 24px;
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
</style>