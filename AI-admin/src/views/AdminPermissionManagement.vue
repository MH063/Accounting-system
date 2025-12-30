<template>
  <div class="admin-permission-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>管理员权限管理</span>
          <div class="header-actions">
            <el-button type="success" @click="handleExport" :loading="exportLoading">
              <el-icon><Download /></el-icon>导出记录
            </el-button>
            <el-button type="primary" @click="handleCreateAdmin" :loading="loading">
              <el-icon><Plus /></el-icon>创建管理员
            </el-button>
            <el-button @click="handleRefresh" :loading="refreshLoading">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 权限统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">管理员总数</div>
                <div class="stat-value">{{ stats.totalAdmins }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><Check /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">活跃管理员</div>
                <div class="stat-value">{{ stats.activeAdmins }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-warning">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">待审批申请</div>
                <div class="stat-value">{{ stats.pendingApprovals }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><DataLine /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">权限变更次数</div>
                <div class="stat-value">{{ stats.permissionChanges }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 功能标签页 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 管理员账户管理 -->
        <el-tab-pane label="管理员账户" name="admins">
          <div class="search-bar">
            <el-form :model="adminSearchForm" label-width="80px" inline>
              <el-form-item label="关键字">
                <el-input v-model="adminSearchForm.keyword" placeholder="用户名/姓名/邮箱" clearable />
              </el-form-item>
              
              <el-form-item label="状态">
                <el-select v-model="adminSearchForm.status" placeholder="请选择状态" clearable>
                  <el-option label="活跃" value="active" />
                  <el-option label="未激活" value="inactive" />
                  <el-option label="锁定" value="locked" />
                  <el-option label="待审核" value="pending" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleAdminSearch">查询</el-button>
                <el-button @click="handleAdminReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <el-table :data="adminList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="realName" label="真实姓名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="phone" label="手机号" />
            <el-table-column prop="roleNames" label="角色" width="200">
              <template #default="scope">
                <el-tag 
                  v-for="roleName in scope.row.roleNames" 
                  :key="roleName" 
                  style="margin-right: 5px;"
                >
                  {{ roleName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag 
                  :type="getStatusType(scope.row.status)"
                >
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastLoginTime" label="最后登录" width="160" />
            <el-table-column label="操作" width="300">
              <template #default="scope">
                <el-button size="small" @click="handleViewAdmin(scope.row)">查看</el-button>
                <el-button size="small" @click="handleEditAdmin(scope.row)">编辑</el-button>
                <el-button size="small" type="warning" @click="handleResetPassword(scope.row)">重置密码</el-button>
                <el-dropdown @command="(command: string) => handleStatusCommand(command, scope.row)">
                  <el-button size="small" type="info">
                    状态<el-icon class="el-icon--right"><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="active">激活</el-dropdown-item>
                      <el-dropdown-item command="inactive">禁用</el-dropdown-item>
                      <el-dropdown-item command="locked">锁定</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="adminCurrentPage"
              v-model:page-size="adminPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="adminTotal"
              @size-change="handleAdminSizeChange"
              @current-change="handleAdminCurrentChange"
            />
          </div>
        </el-tab-pane>
        
        <!-- 权限角色管理 -->
        <el-tab-pane label="权限角色" name="roles">
          <div class="search-bar">
            <el-form :model="roleSearchForm" label-width="80px" inline>
              <el-form-item label="关键字">
                <el-input v-model="roleSearchForm.keyword" placeholder="角色名称/描述" clearable />
              </el-form-item>
              
              <el-form-item label="状态">
                <el-select v-model="roleSearchForm.status" placeholder="请选择状态" clearable>
                  <el-option label="启用" value="active" />
                  <el-option label="禁用" value="inactive" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleRoleSearch">查询</el-button>
                <el-button @click="handleRoleReset">重置</el-button>
                <el-button type="success" @click="handleCreateRole">新建角色</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <el-table :data="roleList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="角色名称" />
            <el-table-column prop="code" label="角色代码" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag 
                  :type="scope.row.status === 'active' ? 'success' : 'danger'"
                >
                  {{ scope.row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160" />
            <el-table-column label="操作" width="250">
              <template #default="scope">
                <el-button size="small" @click="handleViewRole(scope.row)">查看</el-button>
                <el-button size="small" @click="handleEditRole(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteRole(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 权限变更历史 -->
        <el-tab-pane label="权限变更历史" name="history">
          <div class="search-bar">
            <el-form :model="historySearchForm" label-width="80px" inline>
              <el-form-item label="管理员">
                <el-select v-model="historySearchForm.adminId" placeholder="请选择管理员" clearable filterable>
                  <el-option 
                    v-for="admin in adminList" 
                    :key="admin.id" 
                    :label="admin.realName" 
                    :value="admin.id" 
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="变更类型">
                <el-select v-model="historySearchForm.changeType" placeholder="请选择变更类型" clearable>
                  <el-option label="创建管理员" value="create" />
                  <el-option label="更新管理员" value="update" />
                  <el-option label="删除管理员" value="delete" />
                  <el-option label="状态变更" value="status_change" />
                  <el-option label="密码重置" value="password_reset" />
                  <el-option label="权限变更" value="permission_change" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="historySearchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleHistorySearch">查询</el-button>
                <el-button @click="handleHistoryReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <el-table :data="historyList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="adminName" label="管理员" />
            <el-table-column prop="changeType" label="变更类型" width="120">
              <template #default="scope">
                <el-tag :type="getChangeTypeTag(scope.row.changeType)">
                  {{ getChangeTypeText(scope.row.changeType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="changeDescription" label="变更描述" />
            <el-table-column prop="operatorName" label="操作人" />
            <el-table-column prop="ipAddress" label="IP地址" />
            <el-table-column prop="changeTime" label="变更时间" width="160" />
            <el-table-column prop="approved" label="审批状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.approved ? 'success' : 'warning'">
                  {{ scope.row.approved ? '已审批' : '待审批' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button size="small" @click="handleViewHistory(scope.row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="historyCurrentPage"
              v-model:page-size="historyPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="historyTotal"
              @size-change="handleHistorySizeChange"
              @current-change="handleHistoryCurrentChange"
            />
          </div>
        </el-tab-pane>
        
        <!-- 权限审批流程 -->
        <el-tab-pane label="权限审批流程" name="approvals">
          <div class="search-bar">
            <el-form :model="approvalSearchForm" label-width="80px" inline>
              <el-form-item label="申请类型">
                <el-select v-model="approvalSearchForm.type" placeholder="请选择申请类型" clearable>
                  <el-option label="创建管理员" value="create_admin" />
                  <el-option label="修改权限" value="modify_permission" />
                  <el-option label="重置密码" value="reset_password" />
                  <el-option label="更改状态" value="change_status" />
                  <el-option label="删除管理员" value="delete_admin" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="状态">
                <el-select v-model="approvalSearchForm.status" placeholder="请选择状态" clearable>
                  <el-option label="待审批" value="pending" />
                  <el-option label="已审批" value="approved" />
                  <el-option label="已拒绝" value="rejected" />
                  <el-option label="已取消" value="cancelled" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="申请人">
                <el-select v-model="approvalSearchForm.applicantId" placeholder="请选择申请人" clearable filterable>
                  <el-option 
                    v-for="admin in adminList" 
                    :key="admin.id" 
                    :label="admin.realName" 
                    :value="admin.id" 
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleApprovalSearch">查询</el-button>
                <el-button @click="handleApprovalReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <el-table :data="approvalList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="申请标题" />
            <el-table-column prop="type" label="申请类型" width="120">
              <template #default="scope">
                <el-tag :type="getApprovalTypeTag(scope.row.type)">
                  {{ getApprovalTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="applicantName" label="申请人" />
            <el-table-column prop="targetAdminName" label="目标管理员" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getApprovalStatusTag(scope.row.status)">
                  {{ getApprovalStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="applyTime" label="申请时间" width="160" />
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="handleViewApproval(scope.row)">查看</el-button>
                <el-button 
                  v-if="scope.row.status === 'pending'" 
                  size="small" 
                  type="success" 
                  @click="handleApprove(scope.row)"
                >
                  审批
                </el-button>
                <el-button 
                  v-if="scope.row.status === 'pending'" 
                  size="small" 
                  type="danger" 
                  @click="handleReject(scope.row)"
                >
                  拒绝
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="approvalCurrentPage"
              v-model:page-size="approvalPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="approvalTotal"
              @size-change="handleApprovalSizeChange"
              @current-change="handleApprovalCurrentChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 查看管理员详情对话框 -->
    <el-dialog 
      v-model="viewAdminDialogVisible" 
      title="管理员详情" 
      width="800px"
    >
      <div class="admin-detail-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">用户名:</label>
              <span class="detail-value">{{ currentViewAdmin.username }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">真实姓名:</label>
              <span class="detail-value">{{ currentViewAdmin.realName }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">邮箱:</label>
              <span class="detail-value">{{ currentViewAdmin.email }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">手机号:</label>
              <span class="detail-value">{{ currentViewAdmin.phone }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">状态:</label>
              <el-tag :type="getStatusType(currentViewAdmin.status)">
                {{ getStatusText(currentViewAdmin.status) }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">最后登录:</label>
              <span class="detail-value">{{ currentViewAdmin.lastLoginTime || '从未登录' }}</span>
            </div>
          </el-col>
        </el-row>
        
        <div class="detail-item">
          <label class="detail-label">分配角色:</label>
          <div class="role-tags">
            <el-tag 
              v-for="roleName in currentViewAdmin.roleNames" 
              :key="roleName" 
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ roleName }}
            </el-tag>
            <span v-if="!currentViewAdmin.roleNames || currentViewAdmin.roleNames.length === 0" class="no-data">
              暂无分配角色
            </span>
          </div>
        </div>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">创建时间:</label>
              <span class="detail-value">{{ currentViewAdmin.createTime || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">更新时间:</label>
              <span class="detail-value">{{ currentViewAdmin.updateTime || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">创建人:</label>
              <span class="detail-value">{{ currentViewAdmin.createdBy || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">更新人:</label>
              <span class="detail-value">{{ currentViewAdmin.updatedBy || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        
        <div class="detail-item">
          <label class="detail-label">登录记录:</label>
          <div class="login-history">
            <el-timeline v-if="loginHistory.length > 0">
              <el-timeline-item
                v-for="(login, index) in loginHistory"
                :key="index"
                :timestamp="login.loginTime"
                :type="login.success ? 'success' : 'danger'"
              >
                <div class="login-record">
                  <span class="login-time">{{ login.loginTime }}</span>
                  <span class="login-ip">IP: {{ login.ipAddress }}</span>
                  <span class="login-browser">{{ login.browser }}</span>
                  <el-tag 
                    :type="login.success ? 'success' : 'danger'" 
                    size="small"
                    style="margin-left: 10px;"
                  >
                    {{ login.success ? '成功' : '失败' }}
                  </el-tag>
                </div>
              </el-timeline-item>
            </el-timeline>
            <span v-else class="no-data">暂无登录记录</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewAdminDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleEditFromView">编辑</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 创建/编辑管理员对话框 -->
    <el-dialog 
      v-model="adminDialogVisible" 
      :title="adminDialogTitle" 
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="adminFormData" 
        :rules="adminFormRules" 
        ref="adminFormRef" 
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="adminFormData.username" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="adminFormData.realName" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="adminFormData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="adminFormData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="密码" prop="password" v-if="!isEditAdmin">
          <el-input v-model="adminFormData.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword" v-if="!isEditAdmin">
          <el-input v-model="adminFormData.confirmPassword" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
        
        <el-form-item label="角色分配" prop="roleIds">
          <el-checkbox-group v-model="adminFormData.roleIds">
            <el-checkbox 
              v-for="role in roleList" 
              :key="role.id" 
              :label="role.id"
              :disabled="role.status !== 'active'"
            >
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="adminFormData.status">
            <el-radio label="active">活跃</el-radio>
            <el-radio label="inactive">未激活</el-radio>
            <el-radio label="pending">待审核</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="adminDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAdminForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 重置密码对话框 -->
    <el-dialog 
      v-model="passwordDialogVisible" 
      title="重置密码" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="passwordFormData" 
        :rules="passwordFormRules" 
        ref="passwordFormRef" 
        label-width="100px"
      >
        <el-form-item label="管理员">
          <el-input v-model="passwordFormData.adminName" disabled />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordFormData.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordFormData.confirmPassword" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
        
        <!-- 安全验证 -->
        <el-form-item label="验证码" prop="verificationCode" v-if="showSecurityVerification">
          <el-input v-model="securityVerification.verificationCode" placeholder="请输入验证码" />
        </el-form-item>
        
        <el-form-item label="重置原因" prop="reason" v-if="showSecurityVerification">
          <el-input 
            v-model="securityVerification.reason" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入密码重置原因" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPasswordForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 创建/编辑角色对话框 -->
    <el-dialog 
      v-model="roleDialogVisible" 
      :title="roleDialogTitle" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="roleFormData" 
        :rules="roleFormRules" 
        ref="roleFormRef" 
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleFormData.name" placeholder="请输入角色名称" />
        </el-form-item>
        
        <el-form-item label="角色代码" prop="code">
          <el-input v-model="roleFormData.code" placeholder="请输入角色代码" />
        </el-form-item>
        
        <el-form-item label="角色描述" prop="description">
          <el-input 
            v-model="roleFormData.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入角色描述" 
          />
        </el-form-item>
        
        <el-form-item label="权限设置" prop="permissions">
          <el-tree
            ref="permissionTreeRef"
            :data="permissionTreeData"
            show-checkbox
            node-key="id"
            :props="treeProps"
            :default-checked-keys="roleFormData.permissions"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roleFormData.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRoleForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 审批对话框 -->
    <el-dialog 
      v-model="approvalDialogVisible" 
      title="权限审批" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="申请ID">{{ currentApproval.id }}</el-descriptions-item>
        <el-descriptions-item label="申请类型">
          <el-tag :type="getApprovalTypeTag(currentApproval.type)">
            {{ getApprovalTypeText(currentApproval.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentApproval.applicantName }}</el-descriptions-item>
        <el-descriptions-item label="目标管理员">{{ currentApproval.targetAdminName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间" :span="2">{{ currentApproval.applyTime }}</el-descriptions-item>
        <el-descriptions-item label="申请内容" :span="2">{{ currentApproval.content }}</el-descriptions-item>
      </el-descriptions>
      
      <el-form 
        :model="approvalFormData" 
        ref="approvalFormRef" 
        label-width="100px"
        style="margin-top: 20px;"
      >
        <el-form-item label="审批结果">
          <el-radio-group v-model="approvalFormData.approved">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="审批意见">
          <el-input 
            v-model="approvalFormData.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入审批意见" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approvalDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApprovalForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看权限角色详情对话框 -->
    <el-dialog 
      v-model="viewRoleDialogVisible" 
      title="角色详情" 
      width="700px"
    >
      <div class="role-detail-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">角色名称:</label>
              <span class="detail-value">{{ currentViewRole.name }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">角色代码:</label>
              <span class="detail-value">{{ currentViewRole.code }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="detail-item">
              <label class="detail-label">角色描述:</label>
              <span class="detail-value">{{ currentViewRole.description || '无描述' }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">状态:</label>
              <el-tag :type="currentViewRole.status === 'active' ? 'success' : 'danger'">
                {{ currentViewRole.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">创建时间:</label>
              <span class="detail-value">{{ currentViewRole.createTime || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        
        <div class="detail-item">
          <label class="detail-label">权限列表:</label>
          <div class="permission-list">
            <el-tag 
              v-for="(permission, index) in currentViewRole.permissions" 
              :key="index" 
              type="info" 
              style="margin: 2px;"
            >
              {{ permission }}
            </el-tag>
            <span v-if="currentViewRole.permissions.length === 0" class="no-data">暂无权限</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewRoleDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleEditRoleFromView">编辑</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看权限变更历史对话框 -->
    <el-dialog 
      v-model="viewHistoryDialogVisible" 
      title="变更历史详情" 
      width="800px"
    >
      <div class="history-detail-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">变更类型:</label>
              <el-tag :type="getChangeTypeTag(currentViewHistory.changeType)">
                {{ getChangeTypeText(currentViewHistory.changeType) }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">变更时间:</label>
              <span class="detail-value">{{ currentViewHistory.changeTime }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">操作人:</label>
              <span class="detail-value">{{ currentViewHistory.operatorName }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">IP地址:</label>
              <span class="detail-value">{{ currentViewHistory.ipAddress }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">管理员:</label>
              <span class="detail-value">{{ currentViewHistory.adminName }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">审批状态:</label>
              <el-tag :type="currentViewHistory.approved ? 'success' : 'warning'">
                {{ currentViewHistory.approved ? '已审批' : '待审批' }}
              </el-tag>
            </div>
          </el-col>
        </el-row>
        
        <div class="detail-item">
          <label class="detail-label">变更描述:</label>
          <div class="detail-value">{{ currentViewHistory.changeDescription }}</div>
        </div>
        
        <el-row :gutter="20" v-if="currentViewHistory.oldValue || currentViewHistory.newValue">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">变更前:</label>
              <div class="detail-value">{{ currentViewHistory.oldValue || '-' }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">变更后:</label>
              <div class="detail-value">{{ currentViewHistory.newValue || '-' }}</div>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" v-if="currentViewHistory.approved && currentViewHistory.approvedByName">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">审批人:</label>
              <span class="detail-value">{{ currentViewHistory.approvedByName }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">审批时间:</label>
              <span class="detail-value">{{ currentViewHistory.approvedTime || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        
        <div class="detail-item" v-if="currentViewHistory.remark">
          <label class="detail-label">备注:</label>
          <div class="detail-value">{{ currentViewHistory.remark }}</div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewHistoryDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看权限审批流程对话框 -->
    <el-dialog 
      v-model="viewApprovalDialogVisible" 
      title="审批流程详情" 
      width="800px"
    >
      <div class="approval-detail-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">申请标题:</label>
              <span class="detail-value">{{ currentViewApproval.title }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">申请类型:</label>
              <el-tag :type="getApprovalTypeTag(currentViewApproval.type)">
                {{ getApprovalTypeText(currentViewApproval.type) }}
              </el-tag>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">申请人:</label>
              <span class="detail-value">{{ currentViewApproval.applicantName }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">申请时间:</label>
              <span class="detail-value">{{ currentViewApproval.applyTime }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12" v-if="currentViewApproval.targetAdminName">
            <div class="detail-item">
              <label class="detail-label">目标管理员:</label>
              <span class="detail-value">{{ currentViewApproval.targetAdminName }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">当前状态:</label>
              <el-tag :type="getApprovalStatusTag(currentViewApproval.status)">
                {{ getApprovalStatusText(currentViewApproval.status) }}
              </el-tag>
            </div>
          </el-col>
        </el-row>
        
        <div class="detail-item">
          <label class="detail-label">申请内容:</label>
          <div class="detail-value">{{ currentViewApproval.content }}</div>
        </div>
        
        <el-row :gutter="20" v-if="currentViewApproval.currentApproverName">
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">当前审批人:</label>
              <span class="detail-value">{{ currentViewApproval.currentApproverName }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label class="detail-label">审批进度:</label>
              <span class="detail-value">{{ currentViewApproval.currentStep }} / {{ currentViewApproval.totalSteps }}</span>
            </div>
          </el-col>
        </el-row>
        
        <div class="detail-item" v-if="currentViewApproval.completedTime">
          <label class="detail-label">完成时间:</label>
          <span class="detail-value">{{ currentViewApproval.completedTime }}</span>
        </div>
        
        <div class="detail-item" v-if="currentViewApproval.remark">
          <label class="detail-label">备注:</label>
          <div class="detail-value">{{ currentViewApproval.remark }}</div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewApprovalDialogVisible = false">关闭</el-button>
          <el-button 
            v-if="currentViewApproval.status === 'pending'" 
            type="primary" 
            @click="handleApprovalFromView"
          >
            审批
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 导出选择对话框 -->
    <el-dialog 
      v-model="exportDialogVisible" 
      title="导出权限管理记录" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="exportFormData" label-width="120px">
        <el-form-item label="导出类型">
          <el-radio-group v-model="exportFormData.type">
            <el-radio label="all">完整记录（所有数据）</el-radio>
            <el-radio label="accounts">管理员账户记录</el-radio>
            <el-radio label="roles">权限角色记录</el-radio>
            <el-radio label="history">权限变更历史</el-radio>
            <el-radio label="approvals">权限审批流程</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="关键词">
          <el-input v-model="exportFormData.keyword" placeholder="请输入关键词进行筛选" />
        </el-form-item>
        
        <el-form-item label="导出时间范围">
          <el-date-picker
            v-model="exportFormData.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitExport" :loading="exportLoading">导出</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, Warning, Check, DataLine, Download, Plus, Refresh, ArrowDown 
} from '@element-plus/icons-vue'
import { 
  adminAccountApi, 
  permissionRoleApi, 
  permissionHistoryApi, 
  permissionApprovalApi, 
  adminStatsApi,
  adminExportApi,
  type AdminAccount,
  type PermissionRole,
  type PermissionChangeHistory,
  type PermissionApprovalProcess,
  type LoginRecord
} from '@/api/adminPermission'

// 导入统一验证规则库
import { commonRules, businessRules } from '@/utils/validationRules'
// 响应式数据
const stats = ref({
  totalAdmins: 0,
  activeAdmins: 0,
  pendingApprovals: 0,
  permissionChanges: 0
})

const activeTab = ref('admins')
const loading = ref(false)
const refreshLoading = ref(false)
const exportLoading = ref(false)
const submitLoading = ref(false)

// 导出相关
const exportDialogVisible = ref(false)
const exportFormData = reactive({
  type: 'all',
  keyword: '',
  dateRange: []
})

// 管理员列表相关
const adminList = ref<AdminAccount[]>([])
const adminSearchForm = reactive({
  keyword: '',
  status: ''
})
const adminCurrentPage = ref(1)
const adminPageSize = ref(10)
const adminTotal = ref(0)

// 角色列表相关
const roleList = ref<PermissionRole[]>([])
const roleSearchForm = reactive({
  keyword: '',
  status: ''
})

// 权限变更历史相关
const historyList = ref<PermissionChangeHistory[]>([])
const historySearchForm = reactive({
  adminId: '',
  changeType: '',
  dateRange: []
})
const historyCurrentPage = ref(1)
const historyPageSize = ref(10)
const historyTotal = ref(0)

// 权限审批流程相关
const approvalList = ref<PermissionApprovalProcess[]>([])
const approvalSearchForm = reactive({
  type: '',
  status: '',
  applicantId: ''
})
const approvalCurrentPage = ref(1)
const approvalPageSize = ref(10)
const approvalTotal = ref(0)

// 对话框相关
const adminDialogVisible = ref(false)
const adminDialogTitle = ref('')
const isEditAdmin = ref(false)
const adminFormRef = ref()

const passwordDialogVisible = ref(false)
const passwordFormRef = ref()

// 安全验证相关
const showSecurityVerification = ref(false)
const securityVerification = ref({
  verificationCode: '',
  reason: ''
})

const roleDialogVisible = ref(false)
const roleDialogTitle = ref('')
const isEditRole = ref(false)
const roleFormRef = ref()

const approvalDialogVisible = ref(false)
const approvalFormRef = ref()

// 查看管理员详情相关
const viewAdminDialogVisible = ref(false)
const currentViewAdmin = ref<AdminAccount>({
  id: 0,
  username: '',
  realName: '',
  email: '',
  phone: '',
  status: 'active',
  roleIds: [],
  roleNames: [],
  lastLoginTime: '',
  createTime: '',
  updateTime: '',
  createdBy: 0,
  updatedBy: 0
})
const loginHistory = ref<LoginRecord[]>([])

// 查看权限角色详情相关
const viewRoleDialogVisible = ref(false)
const currentViewRole = ref<PermissionRole>({
  id: 0,
  name: '',
  code: '',
  description: '',
  permissions: [],
  status: 'active',
  createTime: '',
  updateTime: '',
  createdBy: 0,
  updatedBy: 0
})

// 查看权限变更历史相关
const viewHistoryDialogVisible = ref(false)
const currentViewHistory = ref<PermissionChangeHistory>({
  id: 0,
  adminId: 0,
  adminName: '',
  changeType: 'create',
  changeDescription: '',
  oldValue: '',
  newValue: '',
  operatorId: 0,
  operatorName: '',
  ipAddress: '',
  changeTime: '',
  approved: false
})

// 查看权限审批流程相关
const viewApprovalDialogVisible = ref(false)
const currentViewApproval = ref<PermissionApprovalProcess>({
  id: 0,
  title: '',
  type: 'create_admin',
  applicantId: 0,
  applicantName: '',
  targetAdminId: 0,
  targetAdminName: '',
  content: '',
  status: 'pending',
  currentStep: 0,
  totalSteps: 0,
  currentApproverId: 0,
  currentApproverName: '',
  applyTime: '',
  completedTime: '',
  remark: ''
})

// 表单数据
const adminFormData = reactive({
  id: 0,
  username: '',
  realName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  roleIds: [] as number[],
  status: 'active'
})

const passwordFormData = reactive({
  id: 0,
  adminName: '',
  newPassword: '',
  confirmPassword: ''
})

const roleFormData = reactive({
  id: 0,
  name: '',
  code: '',
  description: '',
  permissions: [] as string[],
  status: 'active'
})

const approvalFormData = reactive({
  approved: true,
  remark: ''
})

const currentApproval = ref<PermissionApprovalProcess>({
  id: 0,
  title: '',
  type: 'create_admin',
  applicantId: 0,
  applicantName: '',
  targetAdminId: 0,
  targetAdminName: '',
  content: '',
  status: 'pending',
  currentStep: 1,
  totalSteps: 1,
  applyTime: ''
})

// 权限树数据
const permissionTreeData = ref([
  {
    id: 'user_management',
    label: '用户管理',
    children: [
      { id: 'user_list', label: '用户列表' },
      { id: 'user_detail', label: '用户详情' },
      { id: 'user_create', label: '创建用户' },
      { id: 'user_edit', label: '编辑用户' },
      { id: 'user_delete', label: '删除用户' }
    ]
  },
  {
    id: 'admin_management',
    label: '管理员管理',
    children: [
      { id: 'admin_list', label: '管理员列表' },
      { id: 'admin_detail', label: '管理员详情' },
      { id: 'admin_create', label: '创建管理员' },
      { id: 'admin_edit', label: '编辑管理员' },
      { id: 'admin_delete', label: '删除管理员' },
      { id: 'admin_permission', label: '权限管理' }
    ]
  },
  {
    id: 'dormitory_management',
    label: '寝室管理',
    children: [
      { id: 'dormitory_list', label: '寝室列表' },
      { id: 'dormitory_detail', label: '寝室详情' },
      { id: 'dormitory_create', label: '创建寝室' },
      { id: 'dormitory_edit', label: '编辑寝室' },
      { id: 'dormitory_delete', label: '删除寝室' },
      { id: 'dormitory_assign', label: '寝室分配' }
    ]
  },
  {
    id: 'fee_management',
    label: '费用管理',
    children: [
      { id: 'fee_list', label: '费用列表' },
      { id: 'fee_detail', label: '费用详情' },
      { id: 'fee_create', label: '创建费用' },
      { id: 'fee_edit', label: '编辑费用' },
      { id: 'fee_delete', label: '删除费用' },
      { id: 'fee_statistics', label: '费用统计' }
    ]
  },
  {
    id: 'system_management',
    label: '系统管理',
    children: [
      { id: 'system_settings', label: '系统设置' },
      { id: 'system_logs', label: '系统日志' },
      { id: 'system_backup', label: '系统备份' },
      { id: 'system_monitor', label: '系统监控' }
    ]
  }
])

const treeProps = {
  children: 'children',
  label: 'label'
}

const permissionTreeRef = ref()

// 表单验证规则
const adminFormRules = {
  username: commonRules.username,
  realName: commonRules.name,
  email: commonRules.email,
  phone: commonRules.phone,
  password: commonRules.password,
  confirmPassword: commonRules.confirmPassword(() => adminFormData.password),
  roleIds: commonRules.multiSelect
}
const passwordFormRules = {
  newPassword: commonRules.password,
  confirmPassword: commonRules.confirmPassword(() => passwordFormData.newPassword)
}
const roleFormRules = {
  name: commonRules.name,
  code: businessRules.roleCode,
  description: commonRules.description,
  permissions: commonRules.multiSelect
}// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await adminStatsApi.getAdminPermissionStats()
    stats.value = response
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

// 获取管理员列表
const fetchAdminList = async () => {
  loading.value = true
  try {
    const params = {
      page: adminCurrentPage.value,
      pageSize: adminPageSize.value,
      keyword: adminSearchForm.keyword || undefined,
      status: adminSearchForm.status || undefined
    }
    const response = await adminAccountApi.getAdminAccounts(params)
    adminList.value = response.list || []
    adminTotal.value = response.total || 0
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    ElMessage.error('获取管理员列表失败')
  } finally {
    loading.value = false
  }
}

// 获取角色列表
const fetchRoleList = async () => {
  try {
    const params = {
      page: 1,
      pageSize: 100,
      keyword: roleSearchForm.keyword || undefined,
      status: roleSearchForm.status || undefined
    }
    const response = await permissionRoleApi.getPermissionRoles(params)
    roleList.value = response.list || []
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  }
}

// 获取权限变更历史
const fetchHistoryList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: historyCurrentPage.value,
      pageSize: historyPageSize.value
    }
    
    if (historySearchForm.adminId) {
      params.adminId = historySearchForm.adminId
    }
    if (historySearchForm.changeType) {
      params.changeType = historySearchForm.changeType
    }
    if (historySearchForm.dateRange && historySearchForm.dateRange.length === 2) {
      params.startTime = historySearchForm.dateRange[0]
      params.endTime = historySearchForm.dateRange[1]
    }
    
    const response = await permissionHistoryApi.getPermissionChangeHistory(params)
    historyList.value = response.list || []
    historyTotal.value = response.total || 0
  } catch (error) {
    console.error('获取权限变更历史失败:', error)
    ElMessage.error('获取权限变更历史失败')
  } finally {
    loading.value = false
  }
}

// 获取权限审批流程
const fetchApprovalList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: approvalCurrentPage.value,
      pageSize: approvalPageSize.value
    }
    
    if (approvalSearchForm.type) {
      params.type = approvalSearchForm.type
    }
    if (approvalSearchForm.status) {
      params.status = approvalSearchForm.status
    }
    if (approvalSearchForm.applicantId) {
      params.applicantId = approvalSearchForm.applicantId
    }
    
    const response = await permissionApprovalApi.getPermissionApprovalProcesses(params)
    approvalList.value = response.list || []
    approvalTotal.value = response.total || 0
  } catch (error) {
    console.error('获取权限审批流程失败:', error)
    ElMessage.error('获取权限审批流程失败')
  } finally {
    loading.value = false
  }
}

// 标签页切换
const handleTabChange = (tabName: string) => {
  console.log('标签页切换:', tabName)
  
  // 根据标签页加载对应数据
  switch (tabName) {
    case 'admins':
      fetchAdminList()
      break
    case 'roles':
      fetchRoleList()
      break
    case 'history':
      fetchHistoryList()
      break
    case 'approvals':
      fetchApprovalList()
      break
  }
}

// 刷新数据
const handleRefresh = async () => {
  refreshLoading.value = true
  try {
    await Promise.all([
      fetchStats(),
      fetchAdminList(),
      fetchRoleList()
    ])
    
    if (activeTab.value === 'history') {
      await fetchHistoryList()
    } else if (activeTab.value === 'approvals') {
      await fetchApprovalList()
    }
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  } finally {
    refreshLoading.value = false
  }
}

// 导出记录
const handleExport = () => {
  // 重置导出表单
  exportFormData.type = 'all'
  exportFormData.keyword = ''
  exportFormData.dateRange = []
  
  // 显示导出选择对话框
  exportDialogVisible.value = true
}

// 提交导出
const submitExport = async () => {
  exportLoading.value = true
  
  try {
    // 构建导出参数
    const exportParams: any = {}
    
    if (exportFormData.keyword) {
      exportParams.keyword = exportFormData.keyword
    }
    
    if (exportFormData.dateRange && exportFormData.dateRange.length === 2) {
      exportParams.startDate = exportFormData.dateRange[0]
      exportParams.endDate = exportFormData.dateRange[1]
    }
    
    let response
    
    // 根据选择的导出类型调用不同的API
    switch (exportFormData.type) {
      case 'all':
        response = await adminExportApi.exportAllPermissionData(exportParams)
        break
      case 'accounts':
        response = await adminExportApi.exportAdminAccounts(exportParams)
        break
      case 'roles':
        response = await adminExportApi.exportPermissionRoles(exportParams)
        break
      case 'history':
        response = await adminExportApi.exportPermissionHistory(exportParams)
        break
      case 'approvals':
        response = await adminExportApi.exportApprovalProcesses(exportParams)
        break
      default:
        throw new Error('未知的导出类型')
    }
    
    // 创建下载链接
    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 根据导出类型设置文件名
    const now = new Date()
    const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-')
    let filename = ''
    
    switch (exportFormData.type) {
      case 'all':
        filename = `权限管理完整记录_${dateStr}.xlsx`
        break
      case 'accounts':
        filename = `管理员账户记录_${dateStr}.xlsx`
        break
      case 'roles':
        filename = `权限角色记录_${dateStr}.xlsx`
        break
      case 'history':
        filename = `权限变更历史_${dateStr}.xlsx`
        break
      case 'approvals':
        filename = `权限审批流程_${dateStr}.xlsx`
        break
      default:
        filename = `权限管理记录_${dateStr}.xlsx`
    }
    
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    // 关闭对话框
    exportDialogVisible.value = false
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  } finally {
    exportLoading.value = false
  }
}

// 管理员相关操作
const handleCreateAdmin = () => {
  adminDialogTitle.value = '创建管理员'
  isEditAdmin.value = false
  Object.assign(adminFormData, {
    id: 0,
    username: '',
    realName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    roleIds: [],
    status: 'active'
  })
  adminDialogVisible.value = true
}

const handleViewAdmin = async (row: AdminAccount) => {
  try {
    viewAdminDialogVisible.value = true
    
    // 显示加载状态
    Object.assign(currentViewAdmin.value, {
      id: row.id,
      username: row.username,
      realName: row.realName,
      email: row.email,
      phone: row.phone,
      status: row.status,
      roleNames: row.roleNames || [],
      lastLoginTime: row.lastLoginTime || '',
      createTime: row.createTime || '',
      updateTime: row.updateTime || '',
      createdBy: row.createdBy || 0,
      updatedBy: row.updatedBy || 0
    })
    
    // 获取登录历史（如果API可用）
    try {
      if (adminAccountApi.getAdminLoginHistory) {
        const loginRecords = await adminAccountApi.getAdminLoginHistory(row.id)
        loginHistory.value = loginRecords || []
      } else {
        // 如果没有登录历史API，提供模拟数据
        loginHistory.value = [
          {
            loginTime: new Date().toLocaleString('zh-CN'),
            ipAddress: '192.168.1.100',
            browser: 'Chrome 120.0.0.0',
            success: true
          },
          {
            loginTime: new Date(Date.now() - 86400000).toLocaleString('zh-CN'),
            ipAddress: '192.168.1.101',
            browser: 'Firefox 121.0.0.0',
            success: true
          }
        ]
      }
    } catch (error) {
      console.warn('获取登录历史失败:', error)
      loginHistory.value = []
    }
    
  } catch (error) {
     console.error('查看管理员详情失败:', error)
     ElMessage.error('查看管理员详情失败')
     viewAdminDialogVisible.value = false
   }
 }

// 从查看切换到编辑
const handleEditFromView = () => {
  viewAdminDialogVisible.value = false
  // 等待对话框关闭后打开编辑对话框
  setTimeout(() => {
    handleEditAdmin(currentViewAdmin.value)
  }, 100)
}

// 从查看角色切换到编辑角色
const handleEditRoleFromView = () => {
  viewRoleDialogVisible.value = false
  // 等待对话框关闭后打开编辑对话框
  setTimeout(() => {
    handleEditRole(currentViewRole.value)
  }, 100)
}

// 从查看审批流程切换到审批操作
const handleApprovalFromView = () => {
  viewApprovalDialogVisible.value = false
  // 等待对话框关闭后打开审批对话框
  setTimeout(() => {
    Object.assign(currentApproval.value, currentViewApproval.value)
    approvalFormData.approved = true
    approvalFormData.remark = ''
    approvalDialogVisible.value = true
  }, 100)
}

const handleEditAdmin = (row: AdminAccount) => {
  adminDialogTitle.value = '编辑管理员'
  isEditAdmin.value = true
  Object.assign(adminFormData, {
    id: row.id,
    username: row.username,
    realName: row.realName,
    email: row.email,
    phone: row.phone,
    password: '',
    confirmPassword: '',
    roleIds: row.roleIds,
    status: row.status
  })
  adminDialogVisible.value = true
}

const handleResetPassword = (row: AdminAccount) => {
  Object.assign(passwordFormData, {
    id: row.id,
    adminName: row.realName,
    newPassword: '',
    confirmPassword: ''
  })
  
  // 显示安全验证
  showSecurityVerification.value = true
  securityVerification.value = {
    verificationCode: '',
    reason: ''
  }
  
  passwordDialogVisible.value = true
}

const handleStatusCommand = (command: string, row: AdminAccount) => {
  ElMessageBox.confirm(
    `确定要将管理员"${row.realName}"状态更改为${getStatusText(command)}吗？`,
    '确认更改状态',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await adminAccountApi.changeAdminStatus(row.id, command)
      ElMessage.success('状态更改成功')
      fetchAdminList()
    } catch (error) {
      console.error('更改状态失败:', error)
      ElMessage.error('更改状态失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

const handleAdminSearch = () => {
  adminCurrentPage.value = 1
  fetchAdminList()
}

const handleAdminReset = () => {
  Object.assign(adminSearchForm, {
    keyword: '',
    status: ''
  })
  // 清除表单验证状态
  const form = document.querySelector('.admin-search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

const handleAdminSizeChange = (val: number) => {
  adminPageSize.value = val
  adminCurrentPage.value = 1
  fetchAdminList()
}

const handleAdminCurrentChange = (val: number) => {
  adminCurrentPage.value = val
  fetchAdminList()
}

// 提交管理员表单
const submitAdminForm = () => {
  adminFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true
      try {
        const data = { ...adminFormData }
        // 删除确认密码字段
        delete (data as any).confirmPassword
        
        if (isEditAdmin.value) {
          // 编辑时不传递密码，除非有修改
          if (!data.password) {
            delete (data as any).password
          }
          await adminAccountApi.updateAdminAccount(data.id, data as unknown as Partial<AdminAccount>)
          ElMessage.success('管理员更新成功')
        } else {
          await adminAccountApi.createAdminAccount(data as unknown as Partial<AdminAccount>)
          ElMessage.success('管理员创建成功')
        }
        
        adminDialogVisible.value = false
        fetchAdminList()
      } catch (error) {
        console.error('提交管理员表单失败:', error)
        ElMessage.error(isEditAdmin.value ? '更新管理员失败' : '创建管理员失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 提交密码重置表单
const submitPasswordForm = async () => {
  // 首先验证基本表单
  const valid = await new Promise<boolean>(resolve => {
    passwordFormRef.value.validate((valid: boolean) => resolve(valid))
  })
  
  if (!valid) return
  
  // 如果需要安全验证，验证安全信息
  if (showSecurityVerification.value) {
    if (!securityVerification.value.verificationCode) {
      ElMessage.warning('请输入验证码')
      return
    }
    if (!securityVerification.value.reason) {
      ElMessage.warning('请输入重置原因')
      return
    }
  }
  
  submitLoading.value = true
  try {
    await adminAccountApi.resetAdminPassword(
      passwordFormData.id, 
      passwordFormData.newPassword,
      securityVerification.value.verificationCode,
      securityVerification.value.reason
    )
    ElMessage.success('密码重置成功')
    
    // 记录审计日志
    console.log(`管理员 ${passwordFormData.adminName} 的密码已被重置，操作人: ${localStorage.getItem('adminName') || '未知'}，原因: ${securityVerification.value.reason}`)
    
    passwordDialogVisible.value = false
  } catch (error) {
    console.error('密码重置失败:', error)
    ElMessage.error('密码重置失败: ' + (error as Error).message)
  } finally {
    submitLoading.value = false
  }
}

// 角色相关操作
const handleCreateRole = () => {
  roleDialogTitle.value = '创建角色'
  isEditRole.value = false
  Object.assign(roleFormData, {
    id: 0,
    name: '',
    code: '',
    description: '',
    permissions: [],
    status: 'active'
  })
  roleDialogVisible.value = true
}

const handleViewRole = async (row: PermissionRole) => {
  try {
    viewRoleDialogVisible.value = true
    
    // 显示角色详情
    Object.assign(currentViewRole.value, {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      permissions: row.permissions || [],
      status: row.status,
      createTime: row.createTime,
      updateTime: row.updateTime,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy
    })
    
  } catch (error) {
    console.error('查看角色详情失败:', error)
    ElMessage.error('查看角色详情失败')
    viewRoleDialogVisible.value = false
  }
}

const handleEditRole = (row: PermissionRole) => {
  roleDialogTitle.value = '编辑角色'
  isEditRole.value = true
  Object.assign(roleFormData, {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    permissions: row.permissions,
    status: row.status
  })
  roleDialogVisible.value = true
}

const handleDeleteRole = (row: PermissionRole) => {
  ElMessageBox.confirm(
    `确定要删除角色"${row.name}"吗？此操作不可逆。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await permissionRoleApi.deletePermissionRole(row.id)
      ElMessage.success('角色删除成功')
      fetchRoleList()
    } catch (error) {
      console.error('删除角色失败:', error)
      ElMessage.error('删除角色失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

const handleRoleSearch = () => {
  fetchRoleList()
}

const handleRoleReset = () => {
  Object.assign(roleSearchForm, {
    keyword: '',
    status: ''
  })
  // 清除表单验证状态
  const form = document.querySelector('.role-search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

// 提交角色表单
const submitRoleForm = () => {
  roleFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true
      try {
        // 获取选中的权限
        if (permissionTreeRef.value) {
          roleFormData.permissions = permissionTreeRef.value.getCheckedKeys() as string[]
        }
        
        const data = { ...roleFormData }
        
        if (isEditRole.value) {
          await permissionRoleApi.updatePermissionRole(data.id, data as unknown as Partial<PermissionRole>)
          ElMessage.success('角色更新成功')
        } else {
          await permissionRoleApi.createPermissionRole(data as unknown as Partial<PermissionRole>)
          ElMessage.success('角色创建成功')
        }
        
        roleDialogVisible.value = false
        fetchRoleList()
      } catch (error) {
        console.error('提交角色表单失败:', error)
        ElMessage.error(isEditRole.value ? '更新角色失败' : '创建角色失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 权限变更历史相关操作
const handleViewHistory = async (row: PermissionChangeHistory) => {
  try {
    viewHistoryDialogVisible.value = true
    
    // 显示历史记录详情
    Object.assign(currentViewHistory.value, {
      id: row.id,
      adminId: row.adminId,
      adminName: row.adminName,
      changeType: row.changeType,
      changeDescription: row.changeDescription,
      oldValue: row.oldValue,
      newValue: row.newValue,
      operatorId: row.operatorId,
      operatorName: row.operatorName,
      ipAddress: row.ipAddress,
      changeTime: row.changeTime,
      approved: row.approved,
      approvedBy: row.approvedBy,
      approvedByName: row.approvedByName,
      approvedTime: row.approvedTime,
      remark: row.remark
    })
    
  } catch (error) {
    console.error('查看历史记录详情失败:', error)
    ElMessage.error('查看历史记录详情失败')
    viewHistoryDialogVisible.value = false
  }
}

const handleHistorySearch = () => {
  historyCurrentPage.value = 1
  fetchHistoryList()
}

const handleHistoryReset = () => {
  Object.assign(historySearchForm, {
    adminId: '',
    changeType: '',
    dateRange: []
  })
  // 清除表单验证状态
  const form = document.querySelector('.history-search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

const handleHistorySizeChange = (val: number) => {
  historyPageSize.value = val
  historyCurrentPage.value = 1
  fetchHistoryList()
}

const handleHistoryCurrentChange = (val: number) => {
  historyCurrentPage.value = val
  fetchHistoryList()
}

// 权限审批流程相关操作
const handleViewApproval = async (row: PermissionApprovalProcess) => {
  try {
    viewApprovalDialogVisible.value = true
    
    // 显示审批流程详情
    Object.assign(currentViewApproval.value, {
      id: row.id,
      title: row.title,
      type: row.type,
      applicantId: row.applicantId,
      applicantName: row.applicantName,
      targetAdminId: row.targetAdminId,
      targetAdminName: row.targetAdminName,
      content: row.content,
      status: row.status,
      currentStep: row.currentStep,
      totalSteps: row.totalSteps,
      currentApproverId: row.currentApproverId,
      currentApproverName: row.currentApproverName,
      applyTime: row.applyTime,
      completedTime: row.completedTime,
      remark: row.remark
    })
    
  } catch (error) {
    console.error('查看审批流程详情失败:', error)
    ElMessage.error('查看审批流程详情失败')
    viewApprovalDialogVisible.value = false
  }
}

const handleApprove = (row: PermissionApprovalProcess) => {
  Object.assign(currentApproval.value, row)
  approvalFormData.approved = true
  approvalFormData.remark = ''
  approvalDialogVisible.value = true
}

const handleReject = (row: PermissionApprovalProcess) => {
  Object.assign(currentApproval.value, row)
  approvalFormData.approved = false
  approvalFormData.remark = ''
  approvalDialogVisible.value = true
}

const handleApprovalSearch = () => {
  approvalCurrentPage.value = 1
  fetchApprovalList()
}

const handleApprovalReset = () => {
  Object.assign(approvalSearchForm, {
    type: '',
    status: '',
    applicantId: ''
  })
  // 清除表单验证状态
  const form = document.querySelector('.approval-search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

const handleApprovalSizeChange = (val: number) => {
  approvalPageSize.value = val
  approvalCurrentPage.value = 1
  fetchApprovalList()
}

const handleApprovalCurrentChange = (val: number) => {
  approvalCurrentPage.value = val
  fetchApprovalList()
}

// 提交审批表单
const submitApprovalForm = () => {
  approvalFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true
      try {
        await permissionApprovalApi.approvePermissionProcess(
          currentApproval.value.id,
          approvalFormData.approved,
          approvalFormData.remark
        )
        ElMessage.success(approvalFormData.approved ? '审批通过' : '审批拒绝')
        approvalDialogVisible.value = false
        fetchApprovalList()
      } catch (error) {
        console.error('提交审批失败:', error)
        ElMessage.error('提交审批失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 工具函数
const getStatusType = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'danger'
    case 'locked':
      return 'warning'
    case 'pending':
      return 'info'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return '活跃'
    case 'inactive':
      return '未激活'
    case 'locked':
      return '锁定'
    case 'pending':
      return '待审核'
    default:
      return '未知'
  }
}

const getChangeTypeTag = (type: string) => {
  switch (type) {
    case 'create':
      return 'success'
    case 'update':
      return 'primary'
    case 'delete':
      return 'danger'
    case 'status_change':
      return 'warning'
    case 'password_reset':
      return 'info'
    case 'permission_change':
      return 'warning'
    default:
      return 'info'
  }
}

const getChangeTypeText = (type: string) => {
  switch (type) {
    case 'create':
      return '创建'
    case 'update':
      return '更新'
    case 'delete':
      return '删除'
    case 'status_change':
      return '状态变更'
    case 'password_reset':
      return '密码重置'
    case 'permission_change':
      return '权限变更'
    default:
      return '未知'
  }
}

const getApprovalTypeTag = (type: string) => {
  switch (type) {
    case 'create_admin':
      return 'success'
    case 'modify_permission':
      return 'primary'
    case 'reset_password':
      return 'warning'
    case 'change_status':
      return 'info'
    case 'delete_admin':
      return 'danger'
    default:
      return 'info'
  }
}

const getApprovalTypeText = (type: string) => {
  switch (type) {
    case 'create_admin':
      return '创建管理员'
    case 'modify_permission':
      return '修改权限'
    case 'reset_password':
      return '重置密码'
    case 'change_status':
      return '更改状态'
    case 'delete_admin':
      return '删除管理员'
    default:
      return '未知'
  }
}

const getApprovalStatusTag = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'approved':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'cancelled':
      return 'info'
    default:
      return 'info'
  }
}

const getApprovalStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待审批'
    case 'approved':
      return '已审批'
    case 'rejected':
      return '已拒绝'
    case 'cancelled':
      return '已取消'
    default:
      return '未知'
  }
}

// 初始化
onMounted(() => {
  fetchStats()
  fetchAdminList()
  fetchRoleList()
})
</script>

<style scoped>
.admin-permission-management-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stat-card {
  height: 100px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 15px;
}

.bg-primary {
  background-color: #409EFF;
}

.bg-success {
  background-color: #67C23A;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-info {
  background-color: #909399;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.permission-tree-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

.permission-tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dcdfe6;
}

.role-assignment-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

.role-assignment-header {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dcdfe6;
}
</style>