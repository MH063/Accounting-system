import api from './index'

// 维护模式相关API
export const maintenanceApi = {
  // 启动维护模式
  startMaintenance: (data: { countdownMinutes: number; message: string }) => 
    api.post('/maintenance/start', data),
  
  // 获取维护模式状态
  getMaintenanceStatus: () => 
    api.get('/maintenance/status'),
  
  // 取消维护模式
  cancelMaintenance: () => 
    api.post('/maintenance/cancel'),
  
  // 获取维护历史
  getMaintenanceHistory: (params?: { page?: number; pageSize?: number }) => 
    api.get('/maintenance/history', { params })
}

// 数据库备份恢复相关API
export const databaseApi = {
  // 创建数据库备份
  createBackup: (data: { name: string; description?: string }) => 
    api.post('/maintenance/database/backup', data),
  
  // 获取备份列表
  getBackupList: (params?: { page?: number; pageSize?: number }) => 
    api.get('/maintenance/database/backups', { params }),
  
  // 删除备份
  deleteBackup: (id: number) => 
    api.delete(`/maintenance/database/backups/${id}`),
  
  // 恢复数据库
  restoreDatabase: (id: number) => 
    api.post(`/maintenance/database/backups/${id}/restore`),
  
  // 下载备份文件
  downloadBackup: (id: number) => 
    api.get(`/maintenance/database/backups/${id}/download`, { responseType: 'blob' }),
  
  // 优化数据库
  optimizeDatabase: () => 
    api.post('/maintenance/database/optimize'),
  
  // 检查数据库
  checkDatabase: () => 
    api.post('/maintenance/database/check')
}

// 系统日志管理相关API
export const logApi = {
  // 获取日志列表
  getLogList: (params: { type: string; page?: number; pageSize?: number; startTime?: string; endTime?: string }) => 
    api.get('/maintenance/logs', { params }),
  
  // 清理日志
  cleanLogs: (data: { types: string[]; keepDays: number }) => 
    api.post('/maintenance/logs/clean', data),
  
  // 导出日志
  exportLogs: (data: { types: string[]; startTime?: string; endTime?: string }) => 
    api.post('/maintenance/logs/export', data, { responseType: 'blob' }),
  
  // 获取日志清理记录
  getCleanRecords: (params?: { page?: number; pageSize?: number }) => 
    api.get('/maintenance/logs/clean-records', { params })
}

// 系统版本更新相关API
export const versionApi = {
  // 获取当前版本信息
  getCurrentVersion: () => 
    api.get('/maintenance/version/current'),
  
  // 检查更新
  checkUpdate: () => 
    api.post('/maintenance/version/check'),
  
  // 获取可用更新列表
  getUpdateList: () => 
    api.get('/maintenance/version/updates'),
  
  // 下载更新
  downloadUpdate: (version: string) => 
    api.post(`/maintenance/version/download`, { version }),
  
  // 安装更新
  installUpdate: (version: string) => 
    api.post(`/maintenance/version/install`, { version }),
  
  // 获取更新历史
  getUpdateHistory: (params?: { page?: number; pageSize?: number }) => 
    api.get('/maintenance/version/history', { params })
}

// 数据清理和归档相关API
export const dataApi = {
  // 获取数据统计
  getDataStatistics: () => 
    api.get('/maintenance/data/statistics'),
  
  // 清理数据
  cleanData: (data: { types: string[]; keepDays: number }) => 
    api.post('/maintenance/data/clean', data),
  
  // 归档数据
  archiveData: (data: { types: string[]; archiveDate: string }) => 
    api.post('/maintenance/data/archive', data),
  
  // 获取归档列表
  getArchiveList: (params?: { page?: number; pageSize?: number }) => 
    api.get('/maintenance/data/archives', { params }),
  
  // 恢复归档数据
  restoreArchive: (id: number) => 
    api.post(`/maintenance/data/archives/${id}/restore`),
  
  // 下载归档文件
  downloadArchive: (id: number) => 
    api.get(`/maintenance/data/archives/${id}/download`, { responseType: 'blob' }),
  
  // 删除归档
  deleteArchive: (id: number) => 
    api.delete(`/maintenance/data/archives/${id}`)
}

// 系统健康检查相关API
export const healthApi = {
  // 执行健康检查
  performHealthCheck: () => 
    api.post('/maintenance/health/check'),
  
  // 获取健康检查结果
  getHealthResults: (params?: { page?: number; pageSize?: number }) => 
    api.get('/maintenance/health/results', { params }),
  
  // 获取系统监控数据
  getSystemMetrics: () => 
    api.get('/maintenance/health/metrics'),
  
  // 获取系统状态
  getSystemStatus: () => 
    api.get('/maintenance/health/status')
}