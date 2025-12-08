<template>
  <div class="maintenance-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统维护</span>
          <div class="header-actions">
            <el-button @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>
      
      <!-- 维护状态 -->
      <el-alert
        :title="maintenanceStatus.title"
        :type="maintenanceStatus.type"
        :description="maintenanceStatus.description"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      />
      
      <!-- 维护模式控制 -->
      <el-card shadow="never" style="margin-bottom: 20px;">
        <template #header>
          <div class="card-header">
            <span>维护模式控制</span>
          </div>
        </template>
        
        <div v-if="!isMaintenanceMode" class="maintenance-mode-control">
          <el-alert
            title="维护模式未启用"
            type="success"
            description="当前系统正常运行，客户端可正常使用所有功能。"
            show-icon
            style="margin-bottom: 20px;"
          />
          
          <el-form 
            :model="maintenanceModeForm" 
            :rules="maintenanceModeRules" 
            ref="maintenanceModeFormRef"
            label-width="120px"
          >
            <el-form-item label="倒计时时间" prop="countdownMinutes">
              <el-input-number 
                v-model="maintenanceModeForm.countdownMinutes" 
                :min="1" 
                :max="1440" 
              />
              <span class="form-tip">分钟（默认30分钟）</span>
            </el-form-item>
            
            <el-form-item label="维护消息" prop="message">
              <el-input 
                v-model="maintenanceModeForm.message" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入维护通知消息，将会显示给所有客户端用户"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="warning" 
                @click="enableMaintenanceMode"
                :loading="enablingMaintenance"
              >
                启用维护模式
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <div v-else class="maintenance-mode-active">
          <el-alert
            title="维护模式已启用"
            type="warning"
            :description="maintenanceModeDescription"
            show-icon
            style="margin-bottom: 20px;"
          />
          
          <el-descriptions :column="1" border>
            <el-descriptions-item label="启用时间">
              {{ formatDateTime(maintenanceModeInfo.startTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="预计生效时间">
              {{ formatDateTime(maintenanceModeInfo.effectiveTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="倒计时">
              <el-tag type="warning">{{ maintenanceCountdown }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="维护消息">
              {{ maintenanceModeInfo.message }}
            </el-descriptions-item>
          </el-descriptions>
          
          <div style="margin-top: 20px;">
            <el-button 
              type="danger" 
              @click="disableMaintenanceMode"
              :loading="disablingMaintenance"
            >
              立即取消维护模式
            </el-button>
          </div>
        </div>
      </el-card>
      
      <!-- 维护操作 -->
      <el-tabs v-model="activeTab">
        <!-- 系统信息 -->
        <el-tab-pane label="系统信息" name="info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="系统名称">{{ systemInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="系统版本">{{ systemInfo.version }}</el-descriptions-item>
            <el-descriptions-item label="运行环境">{{ systemInfo.environment }}</el-descriptions-item>
            <el-descriptions-item label="启动时间">{{ systemInfo.startTime }}</el-descriptions-item>
            <el-descriptions-item label="运行时长">{{ systemInfo.uptime }}</el-descriptions-item>
            <el-descriptions-item label="内存使用率">
              <el-progress :percentage="systemInfo.memoryUsage" :status="systemInfo.memoryUsage > 80 ? 'exception' : ''" />
            </el-descriptions-item>
            <el-descriptions-item label="CPU使用率">
              <el-progress :percentage="systemInfo.cpuUsage" :status="systemInfo.cpuUsage > 80 ? 'exception' : ''" />
            </el-descriptions-item>
            <el-descriptions-item label="磁盘使用率">
              <el-progress :percentage="systemInfo.diskUsage" :status="systemInfo.diskUsage > 90 ? 'exception' : ''" />
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <!-- 数据库备份恢复 -->
        <el-tab-pane label="数据库备份恢复" name="database">
          <div class="toolbar">
            <el-button type="primary" @click="handleCreateBackup">创建备份</el-button>
            <el-button @click="handleRefreshBackupList">刷新列表</el-button>
          </div>
          
          <el-table :data="backupList" border stripe style="width: 100%" v-loading="backupLoading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="备份名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column prop="size" label="文件大小" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getBackupStatusTag(scope.row.status)">
                  {{ getBackupStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220">
              <template #default="scope">
                <el-button size="small" @click="handleDownloadBackup(scope.row)">下载</el-button>
                <el-button size="small" type="success" @click="handleRestoreBackup(scope.row)">恢复</el-button>
                <el-button size="small" type="danger" @click="handleDeleteBackup(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="backupCurrentPage"
              v-model:page-size="backupPageSize"
              :page-sizes="[10, 15, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="backupTotal"
              @size-change="handleBackupSizeChange"
              @current-change="handleBackupCurrentChange"
            />
          </div>
        </el-tab-pane>
        
        <!-- 系统日志管理 -->
        <el-tab-pane label="系统日志管理" name="logs">
          <el-form :model="logSearchForm" inline class="search-form">
            <el-form-item label="日志类型">
              <el-select v-model="logSearchForm.type" placeholder="请选择日志类型" clearable>
                <el-option label="系统日志" value="system" />
                <el-option label="操作日志" value="operation" />
                <el-option label="错误日志" value="error" />
                <el-option label="访问日志" value="access" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="logSearchForm.dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearchLogs">查询</el-button>
              <el-button @click="handleResetLogSearch">重置</el-button>
            </el-form-item>
          </el-form>
          
          <div class="toolbar">
            <el-button type="primary" @click="handleCleanLogs">清理日志</el-button>
            <el-button @click="handleExportLogs">导出日志</el-button>
          </div>
          
          <el-table :data="logList" border stripe style="width: 100%" v-loading="logLoading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="getLogTypeTag(scope.row.type)">
                  {{ getLogTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="level" label="级别" width="100">
              <template #default="scope">
                <el-tag :type="getLogLevelTag(scope.row.level)">
                  {{ scope.row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="消息" min-width="200" show-overflow-tooltip />
            <el-table-column prop="createTime" label="时间" width="180" />
            <el-table-column prop="user" label="用户" width="120" />
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button size="small" @click="handleViewLogDetail(scope.row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="logCurrentPage"
              v-model:page-size="logPageSize"
              :page-sizes="[10, 15, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="logTotal"
              @size-change="handleLogSizeChange"
              @current-change="handleLogCurrentChange"
            />
          </div>
        </el-tab-pane>
        
        <!-- 系统版本更新 -->
        <el-tab-pane label="系统版本更新" name="version">
          <div class="version-info-card">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <span>当前版本信息</span>
                  <el-button type="primary" @click="handleCheckUpdate" :loading="checkingUpdate">检查更新</el-button>
                </div>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item label="版本号">{{ currentVersion.version }}</el-descriptions-item>
                <el-descriptions-item label="发布日期">{{ currentVersion.releaseDate }}</el-descriptions-item>
                <el-descriptions-item label="更新内容" :span="2">{{ currentVersion.description }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </div>
          
          <div class="toolbar" style="margin-top: 20px;">
            <span style="margin-right: 10px;">可用更新列表：</span>
          </div>
          
          <el-table :data="updateList" border stripe style="width: 100%" v-loading="updateLoading">
            <el-table-column prop="version" label="版本号" />
            <el-table-column prop="releaseDate" label="发布日期" width="180" />
            <el-table-column prop="description" label="更新内容" min-width="200" show-overflow-tooltip />
            <el-table-column prop="size" label="更新包大小" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getUpdateStatusTag(scope.row.status)">
                  {{ getUpdateStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="handleDownloadUpdate(scope.row)"
                  :disabled="scope.row.status === 'downloading' || scope.row.status === 'installing'"
                >
                  {{ scope.row.status === 'downloading' ? '下载中' : '下载' }}
                </el-button>
                <el-button 
                  size="small" 
                  type="success" 
                  @click="handleInstallUpdate(scope.row)"
                  :disabled="scope.row.status !== 'downloaded'"
                >
                  安装
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 数据清理和归档 -->
        <el-tab-pane label="数据清理和归档" name="data">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card shadow="never">
                <template #header>
                  <div class="card-header">
                    <span>数据统计</span>
                    <el-button @click="handleRefreshDataStats" :loading="dataStatsLoading">刷新</el-button>
                  </div>
                </template>
                
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="用户数据量">{{ dataStats.userCount }} 条</el-descriptions-item>
                  <el-descriptions-item label="操作记录量">{{ dataStats.operationCount }} 条</el-descriptions-item>
                  <el-descriptions-item label="日志记录量">{{ dataStats.logCount }} 条</el-descriptions-item>
                  <el-descriptions-item label="系统文件大小">{{ dataStats.fileSize }}</el-descriptions-item>
                  <el-descriptions-item label="数据库大小">{{ dataStats.dbSize }}</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
            
            <el-col :span="12">
              <el-card shadow="never">
                <template #header>
                  <span>数据清理</span>
                </template>
                
                <el-form :model="dataCleanForm" label-width="100px">
                  <el-form-item label="数据类型">
                    <el-checkbox-group v-model="dataCleanForm.types">
                      <el-checkbox label="logs">日志数据</el-checkbox>
                      <el-checkbox label="operations">操作记录</el-checkbox>
                      <el-checkbox label="temp">临时文件</el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>
                  
                  <el-form-item label="保留天数">
                    <el-input-number v-model="dataCleanForm.keepDays" :min="1" :max="365" />
                    <span class="form-tip">天</span>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button type="primary" @click="handleCleanData" :loading="cleaningData">清理数据</el-button>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
          </el-row>
          
          <el-card shadow="never" style="margin-top: 20px;">
            <template #header>
              <div class="card-header">
                <span>数据归档</span>
                <el-button type="primary" @click="handleCreateArchive">创建归档</el-button>
              </div>
            </template>
            
            <el-table :data="archiveList" border stripe style="width: 100%" v-loading="archiveLoading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="归档名称" />
              <el-table-column prop="description" label="描述" />
              <el-table-column prop="createTime" label="创建时间" width="180" />
              <el-table-column prop="size" label="文件大小" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getArchiveStatusTag(scope.row.status)">
                    {{ getArchiveStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button size="small" @click="handleDownloadArchive(scope.row)">下载</el-button>
                  <el-button size="small" type="success" @click="handleRestoreArchive(scope.row)">恢复</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteArchive(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>
        
        <!-- 系统健康检查 -->
        <el-tab-pane label="系统健康检查" name="health">
          <div class="toolbar">
            <el-button type="primary" @click="handlePerformHealthCheck" :loading="checkingHealth">执行健康检查</el-button>
            <el-button @click="handleRefreshHealthResults">刷新结果</el-button>
          </div>
          
          <el-row :gutter="20" style="margin-bottom: 20px;">
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon" :class="systemHealth.overallStatus === 'healthy' ? 'bg-success' : systemHealth.overallStatus === 'warning' ? 'bg-warning' : 'bg-danger'">
                    <el-icon size="24"><View /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-title">系统状态</div>
                    <div class="stat-value">{{ getHealthStatusText(systemHealth.overallStatus) }}</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon bg-primary">
                    <el-icon size="24"><Timer /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-title">响应时间</div>
                    <div class="stat-value">{{ systemHealth.responseTime }}ms</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon bg-success">
                    <el-icon size="24"><TrendCharts /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-title">可用性</div>
                    <div class="stat-value">{{ systemHealth.availability }}%</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon bg-info">
                    <el-icon size="24"><Warning /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-title">错误率</div>
                    <div class="stat-value">{{ systemHealth.errorRate }}%</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
          
          <el-table :data="healthResults" border stripe style="width: 100%" v-loading="healthResultsLoading">
            <el-table-column prop="checkTime" label="检查时间" width="180" />
            <el-table-column prop="category" label="检查类别" width="120">
              <template #default="scope">
                <el-tag :type="getHealthCategoryTag(scope.row.category)">
                  {{ getHealthCategoryText(scope.row.category) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="item" label="检查项目" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getHealthStatusTag(scope.row.status)">
                  {{ getHealthStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="消息" min-width="200" show-overflow-tooltip />
            <el-table-column prop="value" label="数值" width="120" />
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button size="small" @click="handleViewHealthDetail(scope.row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="healthCurrentPage"
              v-model:page-size="healthPageSize"
              :page-sizes="[10, 15, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="healthTotal"
              @size-change="handleHealthSizeChange"
              @current-change="handleHealthCurrentChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 日志详情对话框 -->
    <el-dialog v-model="logDetailDialogVisible" title="日志详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日志ID">{{ logDetailData.id }}</el-descriptions-item>
        <el-descriptions-item label="日志类型">
          <el-tag :type="getLogTypeTag(logDetailData.type)">
            {{ getLogTypeText(logDetailData.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="日志级别">
          <el-tag :type="getLogLevelTag(logDetailData.level)">
            {{ logDetailData.level }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ logDetailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ logDetailData.user }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ logDetailData.ip }}</el-descriptions-item>
        <el-descriptions-item label="消息内容" :span="2">{{ logDetailData.message }}</el-descriptions-item>
        <el-descriptions-item label="详细内容" :span="2">
          <pre>{{ logDetailData.content }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="logDetailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 创建归档对话框 -->
    <el-dialog v-model="archiveDialogVisible" title="创建数据归档" width="600px">
      <el-form :model="archiveForm" label-width="100px">
        <el-form-item label="归档名称" required>
          <el-input v-model="archiveForm.name" placeholder="请输入归档名称" />
        </el-form-item>
        
        <el-form-item label="归档描述">
          <el-input 
            v-model="archiveForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入归档描述"
          />
        </el-form-item>
        
        <el-form-item label="归档日期" required>
          <el-date-picker
            v-model="archiveForm.archiveDate"
            type="date"
            placeholder="选择归档日期"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="数据类型">
          <el-checkbox-group v-model="archiveForm.types">
            <el-checkbox label="logs">日志数据</el-checkbox>
            <el-checkbox label="operations">操作记录</el-checkbox>
            <el-checkbox label="users">用户数据</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="archiveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitArchiveForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 健康检查详情对话框 -->
    <el-dialog v-model="healthDetailDialogVisible" title="健康检查详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="检查ID">{{ healthDetailData.id }}</el-descriptions-item>
        <el-descriptions-item label="检查时间">{{ healthDetailData.checkTime }}</el-descriptions-item>
        <el-descriptions-item label="检查类别">
          <el-tag :type="getHealthCategoryTag(healthDetailData.category)">
            {{ getHealthCategoryText(healthDetailData.category) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="检查项目">{{ healthDetailData.item }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getHealthStatusTag(healthDetailData.status)">
            {{ getHealthStatusText(healthDetailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="数值">{{ healthDetailData.value }}</el-descriptions-item>
        <el-descriptions-item label="消息" :span="2">{{ healthDetailData.message }}</el-descriptions-item>
        <el-descriptions-item label="详细信息" :span="2">
          <pre>{{ healthDetailData.details }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="healthDetailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建备份对话框 -->
    <el-dialog 
      v-model="backupDialogVisible" 
      title="创建数据库备份" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="backupFormRef"
        :model="backupForm"
        :rules="backupRules"
        label-width="100px"
      >
        <el-form-item label="备份名称" prop="name">
          <el-input 
            v-model="backupForm.name" 
            placeholder="请输入备份名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="备份描述">
          <el-input 
            v-model="backupForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备份描述（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="backupDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitBackupForm"
            :loading="creatingBackup"
          >
            {{ creatingBackup ? '创建中...' : '确定创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  maintenanceApi, 
  databaseApi, 
  logApi, 
  versionApi, 
  dataApi, 
  healthApi 
} from '../api/maintenance'
import { systemApi } from '../api/user'

// 响应式数据
const activeTab = ref('info')
const maintenanceModeFormRef = ref()

const maintenanceStatus = ref({
  title: '系统运行正常',
  type: 'success',
  description: '当前系统运行稳定，无维护任务进行中。'
})

// 维护模式相关数据
const isMaintenanceMode = ref(false)
const enablingMaintenance = ref(false)
const disablingMaintenance = ref(false)
const maintenanceModeInfo = ref({
  startTime: '',
  effectiveTime: '',
  message: '系统将在30分钟后进行维护，请提前保存好您的数据。'
})

let countdownTimer: NodeJS.Timeout | null = null

const maintenanceModeForm = reactive({
  countdownMinutes: 30,
  message: '系统将在30分钟后进行维护，请提前保存好您的数据。'
})

const maintenanceModeRules = {
  countdownMinutes: [{ required: true, message: '请输入倒计时时间', trigger: 'change' }],
  message: [{ required: true, message: '请输入维护消息', trigger: 'blur' }]
}

const maintenanceModeDescription = computed(() => {
  return `系统将在 ${maintenanceCountdown.value} 后进入维护状态，届时客户端用户将收到提醒并无法使用系统。`
})

const maintenanceCountdown = computed(() => {
  if (!maintenanceModeInfo.value.effectiveTime) return ''
  
  const now = new Date().getTime()
  const effectiveTime = new Date(maintenanceModeInfo.value.effectiveTime).getTime()
  const remainingSeconds = Math.max(0, Math.floor((effectiveTime - now) / 1000))
  
  const hours = Math.floor(remainingSeconds / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
  const seconds = remainingSeconds % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟${seconds}秒`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`
  } else {
    return `${seconds}秒`
  }
})

const systemInfo = ref({
  name: 'AI管理系统',
  version: 'v2.1.0',
  environment: '生产环境',
  startTime: '2023-11-01 08:30:15',
  uptime: '15天 4小时 25分钟',
  memoryUsage: 65,
  cpuUsage: 32,
  diskUsage: 45
})

const scheduleList = ref([
  {
    id: 1,
    name: '每日日志清理',
    type: 'log',
    executeTime: '每天凌晨2:00',
    status: 'scheduled'
  },
  {
    id: 2,
    name: '每周数据库优化',
    type: 'database',
    executeTime: '每周日凌晨3:00',
    status: 'scheduled'
  },
  {
    id: 3,
    name: '每月数据备份',
    type: 'backup',
    executeTime: '每月1号凌晨1:00',
    status: 'executing'
  }
])

const logCleanForm = reactive({
  keepDays: 30,
  logTypes: ['system', 'operation', 'error']
})

const logCleanRecords = ref([
  {
    id: 1,
    cleanTime: '2023-11-15 02:05:23',
    cleanType: '系统日志清理',
    deletedCount: 12560,
    status: 'success'
  },
  {
    id: 2,
    cleanTime: '2023-11-14 02:03:45',
    cleanType: '操作日志清理',
    deletedCount: 8920,
    status: 'success'
  },
  {
    id: 3,
    cleanTime: '2023-11-13 02:07:12',
    cleanType: '错误日志清理',
    deletedCount: 156,
    status: 'success'
  }
])

const dbOperations = ref([
  {
    id: 1,
    name: '数据库备份',
    startTime: '2023-11-15 01:00:00',
    endTime: '2023-11-15 01:15:32',
    duration: '15分32秒',
    status: 'success'
  },
  {
    id: 2,
    name: '数据库优化',
    startTime: '2023-11-12 03:00:00',
    endTime: '2023-11-12 03:22:18',
    duration: '22分18秒',
    status: 'success'
  },
  {
    id: 3,
    name: '数据库检查',
    startTime: '2023-11-10 14:30:00',
    endTime: '2023-11-10 14:32:45',
    duration: '2分45秒',
    status: 'success'
  }
])

// 备份相关数据
const backupList = ref([
  {
    id: 1,
    name: '数据库完整备份_20231115',
    description: '每日完整数据库备份',
    createTime: '2023-11-15 01:00:00',
    size: '2.5GB',
    status: 'success'
  },
  {
    id: 2,
    name: '数据库增量备份_20231114',
    description: '每日增量数据库备份',
    createTime: '2023-11-14 01:00:00',
    size: '850MB',
    status: 'success'
  },
  {
    id: 3,
    name: '数据库完整备份_20231113',
    description: '每日完整数据库备份',
    createTime: '2023-11-13 01:00:00',
    size: '2.3GB',
    status: 'success'
  }
])

const backupLoading = ref(false)
const creatingBackup = ref(false)
const restoringBackup = ref(false)
const backupTotal = ref(0)
const backupCurrentPage = ref(1)
const backupPageSize = ref(15)
const backupDialogVisible = ref(false)
const backupForm = reactive({
  name: '',
  description: ''
})
const backupFormRef = ref()

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取维护计划类型文本
const getScheduleTypeText = (type: string) => {
  switch (type) {
    case 'log':
      return '日志清理'
    case 'database':
      return '数据库维护'
    case 'backup':
      return '数据备份'
    default:
      return '未知'
  }
}

// 获取维护计划类型标签
const getScheduleTypeTag = (type: string) => {
  switch (type) {
    case 'log':
      return 'primary'
    case 'database':
      return 'success'
    case 'backup':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取备份状态文本
const getBackupStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'running':
      return '进行中'
    case 'failed':
      return '失败'
    default:
      return '未知'
  }
}

// 获取备份状态标签
const getBackupStatusTag = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'running':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

// 创建备份对话框
const handleCreateBackup = () => {
  backupDialogVisible.value = true
}

// 提交备份表单
const submitBackupForm = async () => {
  if (!backupFormRef.value) return
  
  backupFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      creatingBackup.value = true
      try {
        const response = await databaseApi.createBackup({
          name: backupForm.name,
          description: backupForm.description
        })
        
        // 检查API响应结构
        if (response && response.data) {
          ElMessage.success('备份创建成功')
          backupDialogVisible.value = false
          backupForm.name = ''
          backupForm.description = ''
          await handleRefreshBackupList()
        } else {
          ElMessage.error('备份创建失败')
        }
      } catch (error) {
        ElMessage.error('备份创建失败')
        console.error('创建备份失败:', error)
      } finally {
        creatingBackup.value = false
      }
    } else {
      ElMessage.error('请填写正确的表单信息')
    }
  })
}

// 下载备份
const handleDownloadBackup = async (row: any) => {
  try {
    ElMessage.info('正在下载备份文件...')
    
    const response = await databaseApi.downloadBackup(row.id)
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${row.name}_${new Date().getTime()}.sql`
    document.body.appendChild(a)
    a.click()
    
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    ElMessage.success('下载已开始')
  } catch (error) {
    ElMessage.error('下载备份失败')
    console.error('下载备份失败:', error)
  }
}

// 恢复备份
const handleRestoreBackup = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要使用备份 "${row.name}" 恢复数据库吗？此操作将覆盖现有数据，且无法撤销！`,
      '危险操作确认',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'error',
        center: true
      }
    )
    
    restoringBackup.value = true
    const response = await databaseApi.restoreDatabase(row.id)
    
    // 检查API响应结构
    if (response && response.data) {
      ElMessage.success('数据库恢复成功，系统将在30秒后重启')
      
      // 30秒后刷新页面
      setTimeout(() => {
        window.location.reload()
      }, 30000)
    } else {
      ElMessage.error('恢复失败，请稍后重试')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('恢复失败，请稍后重试')
      console.error('恢复备份失败:', error)
    }
  } finally {
    restoringBackup.value = false
  }
}

// 删除备份
const handleDeleteBackup = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份 "${row.name}" 吗？此操作无法撤销！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await databaseApi.deleteBackup(row.id)
    
    // 检查API响应结构
    if (response && response.data) {
      ElMessage.success('备份已删除')
      await handleRefreshBackupList()
    } else {
      ElMessage.error('删除失败，请稍后重试')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请稍后重试')
      console.error('删除备份失败:', error)
    }
  }
}

// 备份列表分页大小变化
const handleBackupSizeChange = (size: number) => {
  backupPageSize.value = size
  fetchBackupList()
}

// 备份列表当前页变化
const handleBackupCurrentChange = (page: number) => {
  backupCurrentPage.value = page
  fetchBackupList()
}

// 获取备份列表
const fetchBackupList = async () => {
  backupLoading.value = true
  try {
    const params = {
      page: backupCurrentPage.value,
      pageSize: backupPageSize.value
    }
    const response = await databaseApi.getBackupList(params)
    
    // 检查API响应结构
    if (response && response.data && response.data.data) {
      backupList.value = response.data.data.list || []
      backupTotal.value = response.data.data.total || 0
    } else {
      backupList.value = []
      backupTotal.value = 0
    }
  } catch (error) {
    console.error('获取备份列表失败:', error)
    ElMessage.error('获取备份列表失败')
    backupList.value = []
    backupTotal.value = 0
  } finally {
    backupLoading.value = false
  }
}

// 备份表单验证规则
const backupRules = {
  name: [
    { required: true, message: '请输入备份名称', trigger: 'blur' }
  ]
}

// 获取维护计划状态文本
const getScheduleStatusText = (status: string) => {
  switch (status) {
    case 'scheduled':
      return '已计划'
    case 'executing':
      return '执行中'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    default:
      return '未知'
  }
}

// 获取维护计划状态标签
const getScheduleStatusTag = (status: string) => {
  switch (status) {
    case 'scheduled':
      return ''
    case 'executing':
      return 'warning'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'info'
    default:
      return 'info'
  }
}

// 获取清理状态文本
const getCleanStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'processing':
      return '处理中'
    default:
      return '未知'
  }
}

// 获取清理状态标签
const getCleanStatusTag = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'processing':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取数据库操作状态文本
const getDbOpStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'processing':
      return '处理中'
    default:
      return '未知'
  }
}

// 获取数据库操作状态标签
const getDbOpStatusTag = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'processing':
      return 'warning'
    default:
      return 'info'
  }
}

// 启用维护模式
const enableMaintenanceMode = () => {
  if (!maintenanceModeFormRef.value) return
  
  maintenanceModeFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      enablingMaintenance.value = true
      
      try {
        const response = await maintenanceApi.startMaintenance({
          countdownMinutes: maintenanceModeForm.countdownMinutes,
          message: maintenanceModeForm.message
        })
        
        // 检查API响应是否成功
        if (response && response.data) {
          // 获取最新的维护状态
          await fetchMaintenanceStatus()
          ElMessage.success('维护模式已启用')
        } else {
          ElMessage.error('启用维护模式失败')
        }
      } catch (error) {
        ElMessage.error('启用维护模式失败')
        console.error('启用维护模式失败:', error)
      } finally {
        enablingMaintenance.value = false
      }
    } else {
      ElMessage.error('请填写正确的表单信息')
    }
  })
}

// 禁用维护模式
const disableMaintenanceMode = () => {
  ElMessageBox.confirm(
    '确定要取消维护模式吗？这将立即恢复客户端服务。',
    '取消维护模式',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    disablingMaintenance.value = true
    
    try {
      const response = await maintenanceApi.cancelMaintenance()
      
      // 检查API响应是否成功
      if (response && response.data) {
        // 获取最新的维护状态
        await fetchMaintenanceStatus()
        ElMessage.success('维护模式已取消')
      } else {
        ElMessage.error('取消维护模式失败')
      }
    } catch (error) {
      ElMessage.error('取消维护模式失败')
      console.error('取消维护模式失败:', error)
    } finally {
      disablingMaintenance.value = false
    }
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 获取维护状态
const fetchMaintenanceStatus = async () => {
  try {
    const response = await maintenanceApi.getMaintenanceStatus()
    const status = response.data // 从响应中提取数据
    
    if (status && status.enabled) {
      isMaintenanceMode.value = true
      maintenanceModeInfo.value = {
        startTime: status.startTime,
        effectiveTime: status.effectiveTime,
        message: status.message
      }
    } else {
      isMaintenanceMode.value = false
      maintenanceModeInfo.value = {
        startTime: '',
        effectiveTime: '',
        message: '系统将在30分钟后进行维护，请提前保存好您的数据。'
      }
      
      // 清除定时器
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }
  } catch (error) {
    ElMessage.error('获取维护状态失败')
    console.error('获取维护状态失败:', error)
  }
}

// 启动倒计时
const startCountdown = () => {
  // 清除之前的定时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
  // 每秒更新倒计时
  countdownTimer = setInterval(() => {
    // 强制更新计算属性
    // Vue 会自动追踪依赖，不需要手动触发
  }, 1000)
}

// 刷新
const handleRefresh = async () => {
  ElMessage.info('正在刷新数据...')
  
  try {
    // 刷新当前标签页的数据
    if (activeTab.value === 'info') {
      // 系统信息标签页，刷新维护状态
      await fetchMaintenanceStatus()
    } else if (activeTab.value === 'database') {
      // 数据库标签页，刷新备份列表
      await handleRefreshBackupList()
    } else if (activeTab.value === 'logs') {
      // 日志标签页，刷新日志列表
      await handleRefreshLogList()
    } else if (activeTab.value === 'version') {
      // 版本更新标签页，刷新版本信息
      await handleRefreshVersionInfo()
    } else if (activeTab.value === 'data') {
      // 数据清理标签页，刷新数据统计
      await handleRefreshDataStats()
    } else if (activeTab.value === 'health') {
      // 健康检查标签页，刷新健康检查结果
      await handleRefreshHealthResults()
    }
    
    // 刷新维护模式状态（所有标签页都需要）
    await fetchMaintenanceStatus()
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    ElMessage.error('刷新失败，请稍后重试')
  }
}

// 刷新备份列表
const handleRefreshBackupList = async () => {
  await fetchBackupList()
}

// 刷新日志列表
const handleRefreshLogList = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    // 实际项目中这里会调用 API
    console.log('刷新日志列表')
  } catch (error) {
    ElMessage.error('刷新日志列表失败')
    console.error('刷新日志列表失败:', error)
  }
}

// 刷新版本信息
const handleRefreshVersionInfo = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    // 实际项目中这里会调用 API
    console.log('刷新版本信息')
  } catch (error) {
    ElMessage.error('刷新版本信息失败')
    console.error('刷新版本信息失败:', error)
  }
}

// 新增计划
const handleAddSchedule = () => {
  ElMessage.info('新增计划功能待实现')
}

// 编辑计划
const handleEditSchedule = (row: any) => {
  console.log('编辑计划:', row)
  ElMessage.info('编辑计划功能待实现')
}

// 删除计划
const handleDeleteSchedule = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除维护计划"${row.name}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('删除计划:', row)
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 系统健康检查相关状态
const checkingHealth = ref(false)
const healthResultsLoading = ref(false)
const healthResults = ref([])
const healthTotal = ref(0)
const healthCurrentPage = ref(1)
const healthPageSize = ref(15)
const healthDetailDialogVisible = ref(false)
const healthDetailData = ref({})
const systemHealth = ref({
  overallStatus: 'healthy',
  responseTime: 120,
  availability: 99.9,
  errorRate: 0.1
})

// 获取健康状态文本
const getHealthStatusText = (status: string) => {
  switch (status) {
    case 'healthy':
      return '健康'
    case 'warning':
      return '警告'
    case 'error':
      return '错误'
    case 'critical':
      return '严重'
    default:
      return '未知'
  }
}

// 获取健康状态标签
const getHealthStatusTag = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'danger'
    case 'critical':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取健康类别文本
const getHealthCategoryText = (category: string) => {
  switch (category) {
    case 'system':
      return '系统'
    case 'database':
      return '数据库'
    case 'network':
      return '网络'
    case 'storage':
      return '存储'
    case 'performance':
      return '性能'
    default:
      return '未知'
  }
}

// 获取健康类别标签
const getHealthCategoryTag = (category: string) => {
  switch (category) {
    case 'system':
      return 'primary'
    case 'database':
      return 'success'
    case 'network':
      return 'warning'
    case 'storage':
      return 'info'
    case 'performance':
      return 'danger'
    default:
      return 'info'
  }
}

// 执行健康检查
const handlePerformHealthCheck = async () => {
  checkingHealth.value = true
  try {
    const response = await healthApi.performHealthCheck()
    
    // 检查API响应结构
    if (response && response.data && response.data.data) {
      const healthData = response.data.data
      
      // 更新系统健康状态
      systemHealth.value = {
        overallStatus: healthData.overallStatus || 'healthy',
        responseTime: healthData.responseTime || 0,
        availability: healthData.availability || 0,
        errorRate: healthData.errorRate || 0
      }
      
      ElMessage.success('健康检查完成')
      // 刷新健康检查结果
      fetchHealthResults()
    } else {
      ElMessage.error('健康检查失败')
    }
  } catch (error) {
    console.error('执行健康检查失败:', error)
    ElMessage.error('执行健康检查失败')
  } finally {
    checkingHealth.value = false
  }
}

// 获取健康检查结果
const fetchHealthResults = async () => {
  healthResultsLoading.value = true
  try {
    const params = {
      page: healthCurrentPage.value,
      pageSize: healthPageSize.value
    }
    const response = await healthApi.getHealthResults(params)
    
    // 检查API响应结构
    if (response && response.data && response.data.data) {
      healthResults.value = response.data.data.list || []
      healthTotal.value = response.data.data.total || 0
    } else {
      healthResults.value = []
      healthTotal.value = 0
    }
  } catch (error) {
    console.error('获取健康检查结果失败:', error)
    ElMessage.error('获取健康检查结果失败')
    healthResults.value = []
    healthTotal.value = 0
  } finally {
    healthResultsLoading.value = false
  }
}

// 刷新健康检查结果
const handleRefreshHealthResults = () => {
  fetchHealthResults()
}

// 查看健康检查详情
const handleViewHealthDetail = (row: any) => {
  healthDetailData.value = { ...row }
  healthDetailDialogVisible.value = true
}

// 健康检查分页大小变化
const handleHealthSizeChange = (size: number) => {
  healthPageSize.value = size
  fetchHealthResults()
}

// 健康检查当前页变化
const handleHealthCurrentChange = (page: number) => {
  healthCurrentPage.value = page
  fetchHealthResults()
}

// 数据清理和归档相关状态
const dataStatsLoading = ref(false)
const dataStats = ref({
  userCount: 0,
  operationCount: 0,
  logCount: 0,
  fileSize: '0 MB',
  dbSize: '0 MB'
})
const dataCleanForm = reactive({
  types: ['logs'],
  keepDays: 30
})
const cleaningData = ref(false)
const archiveLoading = ref(false)
const archiveList = ref([])
const archiveDialogVisible = ref(false)
const archiveForm = reactive({
  name: '',
  description: '',
  archiveDate: '',
  types: ['logs']
})

// 获取归档状态文本
const getArchiveStatusText = (status: string) => {
  switch (status) {
    case 'creating':
      return '创建中'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    default:
      return '未知'
  }
}

// 获取归档状态标签
const getArchiveStatusTag = (status: string) => {
  switch (status) {
    case 'creating':
      return 'warning'
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取数据统计
const fetchDataStats = async () => {
  dataStatsLoading.value = true
  try {
    const response = await dataApi.getDataStatistics()
    
    // 检查API响应结构
    if (response && response.data && response.data.data) {
      dataStats.value = response.data.data
    }
  } catch (error) {
    console.error('获取数据统计失败:', error)
    ElMessage.error('获取数据统计失败')
  } finally {
    dataStatsLoading.value = false
  }
}

// 刷新数据统计
const handleRefreshDataStats = () => {
  fetchDataStats()
}

// 清理数据
const handleCleanData = async () => {
  if (dataCleanForm.types.length === 0) {
    ElMessage.warning('请选择要清理的数据类型')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要清理所选数据吗？此操作不可恢复，将删除 ${dataCleanForm.keepDays} 天前的数据。`,
      '清理确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    cleaningData.value = true
    
    const response = await dataApi.cleanData({
      types: dataCleanForm.types,
      keepDays: dataCleanForm.keepDays
    })
    
    // 检查API响应结构
    if (response && response.data) {
      ElMessage.success('数据清理完成')
      // 刷新数据统计
      fetchDataStats()
    } else {
      ElMessage.error('数据清理失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清理数据失败:', error)
      ElMessage.error('清理数据失败')
    }
  } finally {
    cleaningData.value = false
  }
}

// 获取归档列表
const fetchArchiveList = async () => {
  archiveLoading.value = true
  try {
    const response = await dataApi.getArchiveList()
    
    // 检查API响应结构
    if (response && response.data && response.data.data) {
      archiveList.value = response.data.data.list || []
    } else {
      archiveList.value = []
    }
  } catch (error) {
    console.error('获取归档列表失败:', error)
    ElMessage.error('获取归档列表失败')
    archiveList.value = []
  } finally {
    archiveLoading.value = false
  }
}

// 创建归档对话框
const handleCreateArchive = () => {
  // 设置默认归档日期为当前日期
  archiveForm.archiveDate = new Date().toISOString().slice(0, 10)
  archiveDialogVisible.value = true
}

// 提交归档表单
const submitArchiveForm = async () => {
  try {
    const response = await dataApi.archiveData({
      types: archiveForm.types,
      archiveDate: archiveForm.archiveDate
    })
    
    // 检查API响应结构
    if (response && response.data) {
      ElMessage.success('归档任务已创建')
      archiveDialogVisible.value = false
      // 刷新归档列表
      fetchArchiveList()
      // 刷新数据统计
      fetchDataStats()
    } else {
      ElMessage.error('创建归档失败')
    }
  } catch (error) {
    console.error('创建归档失败:', error)
    ElMessage.error('创建归档失败')
  }
}

// 下载归档
const handleDownloadArchive = async (row: any) => {
  try {
    ElMessage.info('正在下载归档文件...')
    
    const response = await dataApi.downloadArchive(row.id)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${row.name}.zip`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('归档文件下载成功')
  } catch (error) {
    console.error('下载归档失败:', error)
    ElMessage.error('下载归档失败')
  }
}

// 恢复归档
const handleRestoreArchive = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复归档 "${row.name}" 吗？此操作将覆盖当前数据。`,
      '恢复确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.info('正在恢复归档...')
    
    const response = await dataApi.restoreArchive(row.id)
    
    // 检查API响应结构
    if (response && response.data) {
      ElMessage.success('归档恢复完成')
      // 刷新数据统计
      fetchDataStats()
    } else {
      ElMessage.error('归档恢复失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复归档失败:', error)
      ElMessage.error('恢复归档失败')
    }
  }
}

// 删除归档
const handleDeleteArchive = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除归档 "${row.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await dataApi.deleteArchive(row.id)
    
    // 检查API响应结构
    if (response && response.data) {
      ElMessage.success('归档删除成功')
      // 刷新归档列表
      fetchArchiveList()
    } else {
      ElMessage.error('归档删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除归档失败:', error)
      ElMessage.error('删除归档失败')
    }
  }
}

// 系统版本更新管理相关状态
const checkingUpdate = ref(false)
const updateLoading = ref(false)
const currentVersion = ref({
  version: 'v2.1.0',
  releaseDate: '2023-11-01',
  description: '修复了若干问题并优化了用户体验'
})
const updateList = ref([])

// 获取更新状态文本
const getUpdateStatusText = (status: string) => {
  switch (status) {
    case 'available':
      return '可用'
    case 'downloading':
      return '下载中'
    case 'downloaded':
      return '已下载'
    case 'installing':
      return '安装中'
    case 'installed':
      return '已安装'
    default:
      return '未知'
  }
}

// 获取更新状态标签
const getUpdateStatusTag = (status: string) => {
  switch (status) {
    case 'available':
      return 'primary'
    case 'downloading':
      return 'warning'
    case 'downloaded':
      return 'success'
    case 'installing':
      return 'warning'
    case 'installed':
      return 'info'
    default:
      return 'info'
  }
}

// 获取当前版本信息
const fetchCurrentVersion = async () => {
  try {
    const response = await versionApi.getCurrentVersion()
    
    // 检查API响应结构
    if (response && response.data && response.data.data) {
      currentVersion.value = response.data.data
    }
  } catch (error) {
    console.error('获取当前版本信息失败:', error)
    // 使用默认值，不显示错误消息
  }
}

// 检查更新
const handleCheckUpdate = async () => {
  checkingUpdate.value = true
  try {
    const response = await versionApi.checkUpdate()
    
    // 检查API响应结构
    if (response && response.data && response.data.data) {
      const updates = response.data.data.updates || []
      
      if (updates.length > 0) {
        updateList.value = updates
        ElMessage.success(`发现 ${updates.length} 个可用更新`)
      } else {
        updateList.value = []
        ElMessage.info('当前已是最新版本')
      }
    } else {
      updateList.value = []
      ElMessage.info('当前已是最新版本')
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    ElMessage.error('检查更新失败')
    updateList.value = []
  } finally {
    checkingUpdate.value = false
  }
}

// 下载更新
const handleDownloadUpdate = async (row: any) => {
  try {
    // 更新状态为下载中
    const updateItem = updateList.value.find(item => item.version === row.version)
    if (updateItem) {
      updateItem.status = 'downloading'
    }
    
    ElMessage.info('开始下载更新包...')
    
    const response = await versionApi.downloadUpdate(row.version)
    
    // 检查API响应结构
    if (response && response.data) {
      if (updateItem) {
        updateItem.status = 'downloaded'
      }
      ElMessage.success('更新包下载完成')
    } else {
      if (updateItem) {
        updateItem.status = 'available'
      }
      ElMessage.error('更新包下载失败')
    }
  } catch (error) {
    console.error('下载更新失败:', error)
    ElMessage.error('下载更新失败')
    
    // 恢复状态
    const updateItem = updateList.value.find(item => item.version === row.version)
    if (updateItem) {
      updateItem.status = 'available'
    }
  }
}

// 安装更新
const handleInstallUpdate = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要安装版本 ${row.version} 吗？安装后系统将自动重启。`,
      '安装确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新状态为安装中
    const updateItem = updateList.value.find(item => item.version === row.version)
    if (updateItem) {
      updateItem.status = 'installing'
    }
    
    ElMessage.info('开始安装更新...')
    
    const response = await versionApi.installUpdate(row.version)
    
    // 检查API响应结构
    if (response && response.data) {
      ElMessage.success('更新安装成功，系统将在5秒后重启')
      
      // 模拟系统重启
      setTimeout(() => {
        ElMessage.info('系统正在重启...')
      }, 2000)
    } else {
      if (updateItem) {
        updateItem.status = 'downloaded'
      }
      ElMessage.error('更新安装失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('安装更新失败:', error)
      ElMessage.error('安装更新失败')
      
      // 恢复状态
      const updateItem = updateList.value.find(item => item.version === row.version)
      if (updateItem) {
        updateItem.status = 'downloaded'
      }
    }
  }
}

// 系统日志管理相关状态
const logLoading = ref(false)
const logList = ref([])
const logTotal = ref(0)
const logCurrentPage = ref(1)
const logPageSize = ref(15)
const logSearchForm = reactive({
  type: '',
  level: '',
  startTime: '',
  endTime: ''
})
const logDetailDialogVisible = ref(false)
const logDetailData = ref({})

// 获取日志类型文本
const getLogTypeText = (type: string) => {
  switch (type) {
    case 'system':
      return '系统日志'
    case 'operation':
      return '操作日志'
    case 'error':
      return '错误日志'
    case 'security':
      return '安全日志'
    default:
      return '未知'
  }
}

// 获取日志类型标签
const getLogTypeTag = (type: string) => {
  switch (type) {
    case 'system':
      return 'primary'
    case 'operation':
      return 'success'
    case 'error':
      return 'danger'
    case 'security':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取日志级别标签
const getLogLevelTag = (level: string) => {
  switch (level) {
    case 'DEBUG':
      return 'info'
    case 'INFO':
      return 'primary'
    case 'WARN':
      return 'warning'
    case 'ERROR':
      return 'danger'
    case 'FATAL':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取日志列表
const fetchLogList = async () => {
  logLoading.value = true
  try {
    const params = {
      type: logSearchForm.type,
      level: logSearchForm.level,
      startTime: logSearchForm.startTime,
      endTime: logSearchForm.endTime,
      page: logCurrentPage.value,
      pageSize: logPageSize.value
    }
    const response = await logApi.getLogList(params)
    
    // 检查API响应结构
    if (response && response.data && response.data.data) {
      logList.value = response.data.data.list || []
      logTotal.value = response.data.data.total || 0
    } else {
      logList.value = []
      logTotal.value = 0
    }
  } catch (error) {
    console.error('获取日志列表失败:', error)
    ElMessage.error('获取日志列表失败')
    logList.value = []
    logTotal.value = 0
  } finally {
    logLoading.value = false
  }
}

// 搜索日志
const handleSearchLog = () => {
  logCurrentPage.value = 1
  fetchLogList()
}

// 重置日志搜索
const handleResetLogSearch = () => {
  Object.assign(logSearchForm, {
    type: '',
    level: '',
    startTime: '',
    endTime: ''
  })
  logCurrentPage.value = 1
  fetchLogList()
}

// 查看日志详情
const handleViewLogDetail = (row: any) => {
  logDetailData.value = { ...row }
  logDetailDialogVisible.value = true
}

// 清理日志
const handleCleanLogs = () => {
  ElMessageBox.prompt('请输入要保留的天数', '清理日志', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入有效的天数',
    inputValue: '30'
  }).then(async ({ value }) => {
    try {
      ElMessage.info('正在清理日志...')
      const response = await logApi.cleanLogs({
        types: ['system', 'operation', 'error', 'security'],
        keepDays: parseInt(value)
      })
      
      if (response && response.data) {
        ElMessage.success('日志清理完成')
        fetchLogList()
      } else {
        ElMessage.error('日志清理失败')
      }
    } catch (error) {
      console.error('清理日志失败:', error)
      ElMessage.error('清理日志失败')
    }
  }).catch(() => {
    ElMessage.info('已取消清理')
  })
}

// 导出日志
const handleExportLogs = () => {
  ElMessageBox.confirm('确定要导出日志吗？这可能需要一些时间。', '导出日志', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      ElMessage.info('正在导出日志...')
      const response = await logApi.exportLogs({
        types: ['system', 'operation', 'error', 'security'],
        startTime: logSearchForm.startTime,
        endTime: logSearchForm.endTime
      })
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `logs_${new Date().toISOString().slice(0, 10)}.zip`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success('日志导出成功')
    } catch (error) {
      console.error('导出日志失败:', error)
      ElMessage.error('导出日志失败')
    }
  }).catch(() => {
    ElMessage.info('已取消导出')
  })
}

// 日志分页大小变化
const handleLogSizeChange = (size: number) => {
  logPageSize.value = size
  fetchLogList()
}

// 日志当前页变化
const handleLogCurrentChange = (page: number) => {
  logCurrentPage.value = page
  fetchLogList()
}

// 清理日志
const handleCleanLog = () => {
  console.log('清理日志:', logCleanForm)
  ElMessage.success('日志清理任务已启动')
}

// 分析日志
const handleAnalyzeLog = () => {
  ElMessage.info('日志分析功能待实现')
}

// 备份数据库
const handleBackupDatabase = () => {
  ElMessage.success('数据库备份任务已启动')
}

// 优化数据库
const handleOptimizeDatabase = async () => {
  ElMessageBox.confirm(
    '确定要优化数据库吗？这可能会暂时影响系统性能。',
    '优化确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      ElMessage.info('正在优化数据库...')
      // 调用API执行数据库优化
      await systemApi.optimizeDatabase()
      ElMessage.success('数据库优化完成')
    } catch (error) {
      console.error('❌ 数据库优化失败:', error)
      ElMessage.error('数据库优化失败: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消优化')
  })
}

// 检查数据库
const handleCheckDatabase = () => {
  ElMessage.success('数据库检查任务已启动')
}

// 查看数据库详情
const handleViewDbDetail = (row: any) => {
  console.log('查看数据库详情:', row)
  ElMessage.info('查看详情功能待实现')
}

// 组件挂载
onMounted(() => {
  console.log('🔧 系统维护页面加载完成')
  // 获取初始维护状态
  fetchMaintenanceStatus()
  // 获取日志列表
  fetchLogList()
  // 获取当前版本信息
  fetchCurrentVersion()
  // 获取数据统计
  fetchDataStats()
  // 获取归档列表
  fetchArchiveList()
  // 获取健康检查结果
  fetchHealthResults()
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})

/**
 * 系统维护页面
 * 提供系统信息查看、维护计划管理、日志清理、数据库维护等功能
 */
</script>

<style scoped>
.maintenance-container {
  width: 100%;
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

.toolbar {
  margin-bottom: 20px;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
}

.maintenance-mode-control,
.maintenance-mode-active {
  padding: 20px 0;
}
</style>