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
    <el-dialog v-model="showLoginHistory" title="登录历史" width="800px">
      <div class="login-history-filters">
        <el-form :inline="true" :model="loginHistoryFilter" class="login-history-filter-form">
          <el-form-item label="搜索">
            <el-input 
              v-model="loginHistoryFilter.keyword" 
              placeholder="设备名/IP/位置" 
              size="small" 
              clearable
              @keyup.enter="filterLoginHistory"
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
          <span>总计 {{ filteredLoginHistory.length }} 条记录</span>
          <span v-if="hasLoginHistoryFilters" class="active-filter">已筛选</span>
          <span v-if="hasLoginHistorySort" class="active-filter">已排序</span>
        </div>
      </div>
      <div class="login-history-table">
        <el-table :data="filteredLoginHistory" style="width: 100%" max-height="400" @sort-change="(sort: { prop: string; order: string }) => handleLoginHistorySort(sort)">
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
            <el-table-column prop="ipAddress" label="IP地址" width="120" />
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
              @keyup.enter="filterDetailedLoginHistory"
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
          <span>总计 {{ filteredDetailedLoginHistory.length }} 条详细记录</span>
          <span v-if="hasDetailedLoginHistoryFilters" class="active-filter">已筛选</span>
          <span v-if="hasDetailedLoginHistorySort" class="active-filter">已排序</span>
        </div>
      </div>
      <div class="detailed-login-history-table">
        <el-table :data="filteredDetailedLoginHistory" style="width: 100%" max-height="400" @sort-change="(sort: { prop: string; order: string }) => handleDetailedLoginHistorySort(sort)">
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
      @close="cancelSessionTimeout"
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
          <el-button @click="cancelSessionTimeout">取消</el-button>
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
              <span>{{ new Date(scope.row.timestamp).toLocaleString() }}</span>
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import QRCode from 'qrcode'
import dataEncryptionManager from '@/services/dataEncryptionManager'
import { changePassword as changeUserPassword } from '@/services/authService'
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
  type ActiveDeviceSession
} from '@/services/loginDeviceLimitService'
import { 
  enableTwoFactor,
  disableTwoFactor,
  activateTwoFactor,
  getTwoFactorStatus,
  getTwoFactorConfig,
  verifyTwoFactorToken,
  regenerateBackupCodes as generateNewBackupCodes
} from '@/services/twoFactorService'
import {
  getSecurityQuestionConfig,
  saveSecurityQuestionConfig
} from '@/services/securityQuestionService'
import { 
  getSecurityOperationLogs, 
  logSecurityOperation,
  exportSecurityOperationLogs
} from '@/services/securityOperationLogService'
import { 
  performSecurityAssessment 
} from '@/services/securityAssessmentService'
import { 
  getSecurityAssessmentHistory
} from '@/services/securityAssessmentHistoryService'

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

// 当前激活的标签页
const activeTab = ref('account')

// 安全状态
const phoneVerified = ref(false)
const emailVerified = ref(false)
const twoFactorEnabled = ref(false)
const passwordStrength = ref('')
const loginProtection = ref(false) // 登录保护状态将通过初始化函数设置
const abnormalLoginAlert = ref(false) // 异常登录提醒状态将通过初始化函数设置
const fingerprintEnabled = ref(false)
const faceRecognitionEnabled = ref(false)
const loginRateLimit = ref(false)
const dataEncryptionEnabled = ref(false) // 默认不启用数据加密
const securityScore = ref(0)
const securityRiskLevel = ref('')
const biometricAvailable = ref(false)
const accountLocked = ref(false)
const remainingLockTime = ref(0)
const lockReason = ref('')

// 初始化数据加密状态
const initializeDataEncryptionStatus = (): void => {
  try {
    // 获取当前用户ID
    const userId = localStorage.getItem('userId') || 'default_user'
    
    // 检查是否启用了数据加密，如果没有设置则默认启用
    const encryptionEnabled = localStorage.getItem(`dataEncryptionEnabled_${userId}`) === 'true' || 
                          localStorage.getItem(`dataEncryptionEnabled_${userId}`) === null;
    
    // 如果是第一次运行或者没有明确禁用，则默认启用
    if (localStorage.getItem(`dataEncryptionEnabled_${userId}`) === null) {
      dataEncryptionEnabled.value = true;
      // 保存默认启用状态到localStorage
      localStorage.setItem(`dataEncryptionEnabled_${userId}`, 'true');
      
      // 启用数据加密管理器
      dataEncryptionManager.enableEncryption();
      
      // 如果还没有主密钥，则生成一个
      let masterKey = localStorage.getItem('master_encryption_key');
      if (!masterKey) {
        masterKey = 'user_master_key_' + userId + '_' + Date.now();
        localStorage.setItem('master_encryption_key', masterKey);
      }
      dataEncryptionManager.setMasterKey(masterKey);
    } else {
      dataEncryptionEnabled.value = encryptionEnabled;
      
      // 如果启用了加密，初始化数据加密管理器
      if (encryptionEnabled) {
        dataEncryptionManager.enableEncryption();
        
        // 加载主密钥
        const masterKey = localStorage.getItem('master_encryption_key');
        if (masterKey) {
          dataEncryptionManager.setMasterKey(masterKey);
        }
      }
    }
  } catch (error) {
    console.error('初始化数据加密状态失败:', error);
    // 出错时默认启用数据加密
    dataEncryptionEnabled.value = true;
  }
}

// 初始化登录保护和异常登录提醒状态
const initializeLoginProtectionStatus = (): void => {
  try {
    // 检查是否设置了登录保护，如果没有设置则默认启用
    const loginProtectionSetting = localStorage.getItem('loginProtectionEnabled');
    const abnormalLoginAlertSetting = localStorage.getItem('abnormalLoginAlert');
    
    // 如果是第一次运行或者没有明确设置，则默认启用
    if (loginProtectionSetting === null) {
      loginProtection.value = true;
      // 保存默认启用状态到localStorage
      localStorage.setItem('loginProtectionEnabled', 'true');
    } else {
      loginProtection.value = loginProtectionSetting === 'true';
    }
    
    // 异常登录提醒默认始终启用，如果未设置则默认启用
    if (abnormalLoginAlertSetting === null) {
      abnormalLoginAlert.value = true;
      // 保存默认启用状态到localStorage
      localStorage.setItem('abnormalLoginAlert', 'true');
    } else {
      abnormalLoginAlert.value = abnormalLoginAlertSetting === 'true';
    }
    
    // 注意：不要强制设置为true，应尊重用户的选择
    // 只有在初始化时（localStorage中没有设置）才使用默认值
  } catch (error) {
    console.error('初始化登录保护状态失败:', error);
    // 出错时默认启用登录保护和异常登录提醒
    loginProtection.value = true;
    abnormalLoginAlert.value = true;
  }
}

// 登录历史筛选
const loginHistoryFilter = reactive({
  keyword: '',
  dateRange: []
})

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
const twoFactorAccountId = ref('') // 实际应用中应从用户信息获取
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
const currentUserId = ref('default_user') // 实际应用中应从用户信息获取

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
  return originalSessionTimeoutSettings.timeout
})

// 登录频率限制状态
const rateLimitStatus = computed(() => {
  if (!loginRateLimit.value) {
    return '(已禁用)'
  }
  
  // 获取当前账户的登录尝试记录
  const accountId = 'default_user' // 实际应用中应从用户信息获取
  const attempts = getLoginAttempts(accountId)
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
const backupCodes = ref<string[]>([])

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
const initializeSecurityLogs = (): void => {
  try {
    const userId = localStorage.getItem('userId') || 'default_user'
    const logs = getSecurityOperationLogs(userId, 50)
    
    // 转换日志格式以适应现有UI
    securityLogs.value = logs.map(log => ({
      id: log.id,
      time: new Date(log.timestamp).toLocaleString(),
      action: log.description,
      ip: log.ip
    }))
  } catch (error) {
    console.error('初始化安全日志失败:', error)
  }
}

// 初始化安全评估历史记录
const initializeSecurityAssessmentHistory = (): void => {
  try {
    const userId = localStorage.getItem('userId') || 'default_user'
    const history = getSecurityAssessmentHistory(userId, 20)
    
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

// 执行安全评估
const performSecurityCheck = async (): Promise<void> => {  try {
    ElMessage.info('正在进行安全检查...')
    
    // 获取当前用户ID
    const userId = localStorage.getItem('userId') || 'default_user'
    
    // 执行安全评估
    const assessment = performSecurityAssessment(userId)
    
    // 更新安全评分和风险等级
    securityScore.value = assessment.overallScore
    securityRiskLevel.value = assessment.riskLevel === 'high' ? '高风险' : 
                            assessment.riskLevel === 'medium' ? '中风险' : '低风险'
    
    // 更新安全风险详情，只显示异常项目（评分低于80的因素）
    securityRisks.value = assessment.factors
      .filter(factor => factor.score < 80)
      .map(factor => ({
        title: factor.name,
        description: factor.description,
        solution: factor.recommendation
      }))    
    // 根据评估结果给出不同的提示
    if (assessment.riskLevel === 'high') {
      ElMessage.error(`安全检查完成，您的账户存在高风险，评分为 ${assessment.overallScore} 分，请立即处理安全隐患`)
    } else if (assessment.riskLevel === 'medium') {
      ElMessage.warning(`安全检查完成，您的账户存在中等风险，评分为 ${assessment.overallScore} 分，建议加强安全措施`)
    } else {
      ElMessage.success(`安全检查完成，您的账户很安全，评分为 ${assessment.overallScore} 分`)
    }
    
    // 记录安全操作日志
    logSecurityOperation({
      userId,
      operation: 'perform_security_check',
      description: `执行安全检查，评分: ${assessment.overallScore}，风险等级: ${assessment.riskLevel}`,
      ip: '127.0.0.1', // 实际应用中应获取真实IP
      userAgent: navigator.userAgent,
      status: 'success'
    });
    
    // 重新加载安全日志
    initializeSecurityLogs();
    
    // 根据项目规范，安全检查按钮仅触发检查任务启动，不应直接展示安全风险详情窗口
    // 详情查看应通过独立入口或后续操作实现，确保功能触发与结果展示分离
  } catch (error) {    console.error('安全检查失败:', error)
    ElMessage.error('安全检查失败，请稍后重试')
    
    // 记录安全操作日志
    const userId = localStorage.getItem('userId') || 'default_user';
    logSecurityOperation({
      userId,
      operation: 'perform_security_check_failed',
      description: '执行安全检查失败',
      ip: '127.0.0.1', // 实际应用中应获取真实IP
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
    const userId = localStorage.getItem('userId') || 'default_user'
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
    const userId = localStorage.getItem('userId') || 'default_user'
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
      
      // 记录安全操作日志
      const userId = localStorage.getItem('userId') || 'default_user'
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
      
      // 记录安全操作日志
      const userId = localStorage.getItem('userId') || 'default_user';
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
      ElMessage.error('验证码错误，请重新输入')
      
      // 记录安全操作日志
      const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user';
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

const completeTwoFactorSetup = (): void => {
  // 真正启用两步验证
  const twoFactorStatus = getTwoFactorStatus(twoFactorAccountId.value)
  if (twoFactorStatus.enabled) {
    twoFactorEnabled.value = true
    intendedTwoFactorState.value = true
    showTwoFactorSetupDialog.value = false
    twoFactorStep.value = 0
    ElMessage.success('两步验证已成功启用')
    
    // 记录安全操作日志
    const userId = localStorage.getItem('userId') || 'default_user'
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
  
  // 记录安全操作日志
  const userId = localStorage.getItem('userId') || 'default_user';
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
  
  // 记录安全操作日志
  const userId = localStorage.getItem('userId') || 'default_user';
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

const copySecretKey = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(twoFactorSecret.value)
    ElMessage.success('密钥已复制到剪贴板')
    
    // 记录安全操作日志
    const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user';
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

const toggleLoginProtection = (value: boolean): void => {
  if (value) {
    ElMessage.success('登录保护已开启')
  } else {
    ElMessage.warning('登录保护已关闭')
  }
  
  // 保存登录保护设置到localStorage
  localStorage.setItem('loginProtectionEnabled', value.toString());
  
  // 记录安全操作日志
  const userId = localStorage.getItem('userId') || 'default_user';
  logSecurityOperation({
    userId,
    operation: 'toggle_login_protection',
    description: value ? '启用登录保护' : '禁用登录保护',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
}

const toggleAbnormalLoginAlert = (value: boolean): void => {
  if (value) {
    ElMessage.success('异常登录提醒已开启')
  } else {
    ElMessage.warning('异常登录提醒已关闭')
  }
  
  // 保存异常登录提醒设置到localStorage
  localStorage.setItem('abnormalLoginAlert', value.toString());
  
  // 记录安全操作日志
  const userId = localStorage.getItem('userId') || 'default_user';
  logSecurityOperation({
    userId,
    operation: 'toggle_abnormal_login_alert',
    description: value ? '启用异常登录提醒' : '禁用异常登录提醒',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
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
      const userId = localStorage.getItem('userId') || 'default_user';
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
      const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user';
    
    if (value) {
      // 启用数据加密 - 默认状态，无需确认
      // 显示加载状态
      const loadingInstance = ElLoading.service({
        lock: true,
        text: '正在启用数据加密...',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      try {
        // 实际应用中，这里应该调用后端API来启用数据加密
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 保存加密状态到localStorage
        localStorage.setItem(`dataEncryptionEnabled_${userId}`, 'true');
        
        // 启用数据加密管理器
        dataEncryptionManager.enableEncryption();
        
        // 生成并保存主密钥（实际应用中应在后端生成并安全存储）
        const masterKey = 'user_master_key_' + userId + '_' + Date.now();
        localStorage.setItem('master_encryption_key', masterKey);
        dataEncryptionManager.setMasterKey(masterKey);
        
        // 更新本地状态
        dataEncryptionEnabled.value = true;
        
        ElMessage.success('数据加密已启用');
        
        // 记录安全操作日志
        logSecurityOperation({
          userId,
          operation: 'enable_data_encryption',
          description: '启用数据加密',
          ip: '127.0.0.1', // 实际应用中应获取真实IP
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
          // 移除模拟延迟 - 现在使用真实API调用
          
          // 删除加密状态
          localStorage.removeItem(`dataEncryptionEnabled_${userId}`);
          
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
  const userId = localStorage.getItem('userId') || 'default_user';
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
  const userId = localStorage.getItem('userId') || 'default_user';
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

const bindPhone = (): void => {
  if (!phoneForm.phone || !phoneForm.code) {
    ElMessage.error('请填写完整信息')
    return
  }
  phoneVerified.value = true
  ElMessage.success('手机绑定成功')
  showPhoneDialog.value = false
  
  // 记录安全操作日志
  const userId = localStorage.getItem('userId') || 'default_user';
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

const bindEmail = (): void => {
  if (!emailForm.email || !emailForm.code) {
    ElMessage.error('请填写完整信息')
    return
  }
  emailVerified.value = true
  ElMessage.success('邮箱绑定成功')
  showEmailDialog.value = false
  
  // 记录安全操作日志
  const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user';
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

const filteredLoginHistory = computed(() => {
  let filtered = [...loginHistory.value]
  
  // 关键词筛选
  if (loginHistoryFilter.keyword) {
    const keyword = loginHistoryFilter.keyword.toLowerCase()
    filtered = filtered.filter(record => 
      record.device.toLowerCase().includes(keyword) ||
      record.ip.toLowerCase().includes(keyword) ||
      record.location.toLowerCase().includes(keyword)
    )
  }
  
  // 日期范围筛选
  if (loginHistoryFilter.dateRange && loginHistoryFilter.dateRange.length === 2) {
    const startDate = loginHistoryFilter.dateRange[0] as unknown as string
    const endDate = loginHistoryFilter.dateRange[1] as unknown as string
    if (startDate && endDate) {
      filtered = filtered.filter(record => {
        const recordDate = record.time.split(' ')[0] // 提取日期部分
        if (recordDate) {
          return recordDate >= startDate && recordDate <= endDate
        }
        return false
      })
    }
  }
  
  // 排序
  if (loginHistorySort.prop && loginHistorySort.order) {
    filtered.sort((a, b) => {
      const prop = loginHistorySort.prop as keyof typeof a
      const order = loginHistorySort.order === 'ascending' ? 1 : -1
      
      // 处理时间字段的特殊排序
      if (prop === 'time') {
        return (new Date(a[prop]).getTime() - new Date(b[prop]).getTime()) * order
      }
      
      // 处理字符串字段的排序
      if (typeof a[prop] === 'string' && typeof b[prop] === 'string') {
        return a[prop].localeCompare(b[prop]) * order
      }
      
      // 默认排序
      return 0
    })
  }
  
  return filtered
})

const filterLoginHistory = (): void => {
  // 筛选逻辑已在computed属性中实现
  ElMessage.info('筛选条件已应用')
}

const resetLoginHistoryFilter = (): void => {
  loginHistoryFilter.keyword = ''
  loginHistoryFilter.dateRange = []
}

const hasLoginHistoryFilters = computed(() => {
  return loginHistoryFilter.keyword !== '' || 
         (loginHistoryFilter.dateRange && loginHistoryFilter.dateRange.length > 0)
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

const handleLoginHistorySort = (sort: { prop: string; order: string }): void => {
  loginHistorySort.prop = sort.prop
  loginHistorySort.order = sort.order
}

const filteredDetailedLoginHistory = computed(() => {
  let filtered = [...detailedLoginHistory.value]
  
  // 关键词筛选
  if (detailedLoginHistoryFilter.keyword) {
    const keyword = detailedLoginHistoryFilter.keyword.toLowerCase()
    filtered = filtered.filter(record => 
      record.device.toLowerCase().includes(keyword) ||
      record.ip.toLowerCase().includes(keyword) ||
      record.location.toLowerCase().includes(keyword) ||
      record.browser.toLowerCase().includes(keyword)
    )
  }
  
  // 日期范围筛选
  if (detailedLoginHistoryFilter.dateRange && detailedLoginHistoryFilter.dateRange.length === 2) {
    const startDate = detailedLoginHistoryFilter.dateRange[0] as unknown as string
    const endDate = detailedLoginHistoryFilter.dateRange[1] as unknown as string
    if (startDate && endDate) {
      filtered = filtered.filter(record => {
        const recordDate = record.time.split(' ')[0] // 提取日期部分
        if (recordDate) {
          return recordDate >= startDate && recordDate <= endDate
        }
        return false
      })
    }
  }
  
  // 状态筛选
  if (detailedLoginHistoryFilter.status) {
    filtered = filtered.filter(record => record.status === detailedLoginHistoryFilter.status)
  }
  
  // 排序
  if (detailedLoginHistorySort.prop && detailedLoginHistorySort.order) {
    filtered.sort((a, b) => {
      const prop = detailedLoginHistorySort.prop as keyof typeof a
      const order = detailedLoginHistorySort.order === 'ascending' ? 1 : -1
      
      // 处理时间字段的特殊排序
      if (prop === 'time') {
        return (new Date(a[prop]).getTime() - new Date(b[prop]).getTime()) * order
      }
      
      // 处理字符串字段的排序
      if (typeof a[prop] === 'string' && typeof b[prop] === 'string') {
        return a[prop].localeCompare(b[prop]) * order
      }
      
      // 默认排序
      return 0
    })
  }
  
  return filtered
})

const filterDetailedLoginHistory = (): void => {
  // 筛选逻辑已在computed属性中实现
  ElMessage.info('筛选条件已应用')
}

const resetDetailedLoginHistoryFilter = (): void => {
  detailedLoginHistoryFilter.keyword = ''
  detailedLoginHistoryFilter.dateRange = []
  detailedLoginHistoryFilter.status = ''
}

const hasDetailedLoginHistoryFilters = computed(() => {
  return detailedLoginHistoryFilter.keyword !== '' || 
         (detailedLoginHistoryFilter.dateRange && detailedLoginHistoryFilter.dateRange.length > 0) ||
         detailedLoginHistoryFilter.status !== ''
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

const refreshDeviceList = (): void => {
  // 模拟刷新设备列表
  ElMessage.info('设备列表已刷新')
  
  // 记录安全操作日志
  const userId = localStorage.getItem('userId') || 'default_user';
  logSecurityOperation({
    userId,
    operation: 'refresh_device_list',
    description: '刷新设备列表',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
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
    
    // 记录安全操作日志
    const userId = localStorage.getItem('userId') || 'default_user';
    logSecurityOperation({
      userId,
      operation: 'remove_all_devices',
      description: '移除所有非当前设备',
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
    
    // 记录安全操作日志
    const userId = localStorage.getItem('userId') || 'default_user';
    logSecurityOperation({
      userId,
      operation: 'remove_device',
      description: `移除设备 ID: ${deviceId}`,
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

const copyBackupCode = async (code: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('验证码已复制到剪贴板')
    
    // 记录安全操作日志
    const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user';
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
      
      // 记录安全操作日志
      const userId = localStorage.getItem('userId') || 'default_user';
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
    } catch (error) {
      console.error('重新生成备份验证码失败:', error)
      ElMessage.error('重新生成失败，请稍后重试')
      
      // 记录安全操作日志
      const userId = localStorage.getItem('userId') || 'default_user';
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
  }).catch(() => {
    // 取消操作
  })
}

const saveLoginLimit = (): void => {
  try {
    // 获取当前用户ID（实际应用中应从用户信息获取）
    const userId = 'current_user_id';
    
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

const saveSecurityQuestions = (): void => {
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

const saveLockoutSettings = (): void => {
  try {
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
    const userId = localStorage.getItem('userId') || 'default_user';
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
  const userId = localStorage.getItem('userId') || 'default_user';
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

// 取消会话超时设置
const cancelSessionTimeout = (): void => {
  // 恢复原始设置
  Object.assign(sessionTimeoutForm, originalSessionTimeoutSettings)
  showSessionTimeoutDialog.value = false
  ElMessage.info('已取消修改')
  
  // 记录安全操作日志
  const userId = localStorage.getItem('userId') || 'default_user';
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

const saveSessionTimeout = (): void => {
  // 保存会话超时设置
  ElMessage.success(`会话超时设置已保存：超时时长 ${sessionTimeoutForm.timeout} 分钟，提醒时间 ${sessionTimeoutForm.warningTime} 分钟`)
  showSessionTimeoutDialog.value = false
  
  // 更新原始设置为当前设置
  Object.assign(originalSessionTimeoutSettings, sessionTimeoutForm)
  
  // 实际应用中，这里应该调用后端API来保存会话超时设置
  // 例如：
  // api.updateSessionTimeoutSetting({
  //   timeout: sessionTimeoutForm.timeout,
  //   warningTime: sessionTimeoutForm.warningTime
  // })
  //   .then(() => {
  //     ElMessage.success('会话超时设置已保存')
  //   })
  //   .catch(error => {
  //     ElMessage.error('保存失败，请稍后重试')
  //   })
  
  // 记录安全操作日志
  const userId = localStorage.getItem('userId') || 'default_user';
  logSecurityOperation({
    userId,
    operation: 'save_session_timeout',
    description: `保存会话超时设置：超时时长 ${sessionTimeoutForm.timeout} 分钟，提醒时间 ${sessionTimeoutForm.warningTime} 分钟`,
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 重新加载安全日志
  initializeSecurityLogs();
}

const resetRateLimitCounter = (): void => {
  try {
    // 获取当前用户ID
    const accountId = localStorage.getItem('userId') || 'default_user'
    
    // 重置失败尝试计数器
    resetFailedAttempts(accountId)
    
    ElMessage.success('频率限制计数器已重置')
    
    // 记录安全操作日志
    const userId = localStorage.getItem('userId') || 'default_user';
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
    
    // 获取当前用户ID（模拟）
    const accountId = 'default_user'
    
    // 获取锁定时长配置
    const config = getSecurityConfig()
    const lockoutDuration = config.lockout.lockoutDuration
    
    // 手动锁定账户，使用配置的锁定时长
    serviceManuallyLockAccount(accountId, lockoutDuration)
    
    // 更新本地状态
    accountLocked.value = true
    remainingLockTime.value = lockoutDuration * 60 // 转换为秒
    
    ElMessage.success(`账户已手动锁定，锁定时长${lockoutDuration}分钟`)
    
    // 开始倒计时
    startLockCountdown()
    
    // 记录安全操作日志
    const userId = localStorage.getItem('userId') || 'default_user';
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
    const userId = localStorage.getItem('userId') || 'default_user'
    const blob = exportSecurityOperationLogs(userId)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `security-log-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
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
        const userId = localStorage.getItem('userId') || 'default_user';
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
        const userId = localStorage.getItem('userId') || 'default_user';
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
    const accountId = localStorage.getItem('userId') || 'default_user'
    
    // 解锁账户
    try {
      const { unlockAccountAPI } = await import('@/services/accountUnlockService')
      const response = await unlockAccountAPI(accountId)
      
      if (!response.success) {
        throw new Error(response.message || '解锁账户失败')
      }
      
      // 调用本地解锁函数更新UI状态
      unlockAccount(accountId)
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
    const userId = localStorage.getItem('userId') || 'default_user';
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
    
    // 更新锁定原因
    if (lockStatus.isLocked) {
      // 检查是否是手动锁定
      const manualLockStr = localStorage.getItem(`manualLock_${accountId}`)
      if (manualLockStr) {
        lockReason.value = '管理员手动锁定'
      } else {
        // 检查是否是失败尝试过多导致的锁定
        const attempts = getLoginAttempts(accountId)
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
  
  // 记录页面访问日志
  const userId = localStorage.getItem('userId') || 'default_user';
  logSecurityOperation({
    userId,
    operation: 'page_view',
    description: '访问安全设置页面',
    ip: '127.0.0.1', // 实际应用中应获取真实IP
    userAgent: navigator.userAgent,
    status: 'success'
  });
  
  // 初始化生物识别支持
  initializeBiometricSupport()
  // 初始化安全配置
  initializeSecurityConfig()
  // 启动锁定状态检查
  startLockStatusCheck()
  // 初始化登录设备限制配置
  initializeLoginDeviceLimitConfig()
  // 加载当前设备会话
  loadCurrentDeviceSessions()
  // 初始化数据加密状态
  initializeDataEncryptionStatus()
  // 初始化登录保护和异常登录提醒状态
  initializeLoginProtectionStatus()
  // 初始化安全日志
  initializeSecurityLogs()
  // 初始化安全评估历史记录
  initializeSecurityAssessmentHistory()
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
const loadCurrentDeviceSessions = (): void => {
  try {
    // 获取当前用户ID（实际应用中应从用户信息获取）
    const userId = currentUserId.value;
    
    // 清理过期会话
    cleanupExpiredSessions(userId);
    
    // 获取当前设备信息
    const userAgent = getUserAgent();
    const ipAddress = getClientIpAddress();
    
    // 记录当前设备会话（如果不存在）
    const currentSession = recordNewDeviceSession(userId, userAgent, ipAddress);
    currentDeviceId.value = currentSession.id;
    
    // 获取所有设备会话
    const sessions = getActiveDeviceSessions(userId);
    currentDeviceSessions.value = [...sessions];
    
    // 计算活跃设备数量
    activeDeviceCount.value = sessions.filter(session => session.isActive).length;
  } catch (error) {
    console.error('加载当前设备会话失败:', error);
  }
}

// 格式化日期时间
const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
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
  }).then(() => {
    try {
      // 获取当前用户ID（实际应用中应从用户信息获取）
      const userId = 'current_user_id';
      
      // 登出指定设备
      const success = logoutDevice(userId, deviceId);
      
      if (success) {
        ElMessage.success('设备已登出');
        // 重新加载设备列表
        loadCurrentDeviceSessions();
        
        // 记录安全操作日志
        logSecurityOperation({
          userId,
          operation: 'logout_device',
          description: '登出指定设备',
          ip: '127.0.0.1', // 实际应用中应获取真实IP
          userAgent: navigator.userAgent,
          status: 'success'
        });
        
        // 重新加载安全日志
        initializeSecurityLogs();
      } else {
        ElMessage.error('登出设备失败');
      }
    } catch (error) {
      console.error('登出设备失败:', error);
      ElMessage.error('登出设备失败');
    }
  }).catch(() => {
    // 取消操作
  });
}

// 处理登出所有设备
const handleLogoutAllDevices = (): void => {
  ElMessageBox.confirm('确定要登出所有设备吗？此操作将使您在所有设备上都需要重新登录。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    try {
      // 获取当前用户ID（实际应用中应从用户信息获取）
      const userId = 'current_user_id';
      
      // 登出所有设备
      logoutAllDevices(userId);
      
      ElMessage.success('所有设备已登出');
      // 重新加载设备列表
      loadCurrentDeviceSessions();
      
      // 记录安全操作日志
      logSecurityOperation({
        userId,
        operation: 'logout_all_devices',
        description: '登出所有设备',
        ip: '127.0.0.1', // 实际应用中应获取真实IP
        userAgent: navigator.userAgent,
        status: 'success'
      });
      
      // 重新加载安全日志
      initializeSecurityLogs();
    } catch (error) {
      console.error('登出所有设备失败:', error);
      ElMessage.error('登出所有设备失败');
    }
  }).catch(() => {
    // 取消操作
  });
}

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
  }}</style>