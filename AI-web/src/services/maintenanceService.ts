/**
 * 维护模式服务
 * 提供维护模式状态检查和相关功能
 */

// 维护模式状态类型定义
export interface MaintenanceStatus {
  enabled: boolean;        // 是否启用了维护模式
  active: boolean;         // 是否正在维护中
  startTime: string;       // 维护开始时间
  effectiveTime: string;   // 维护生效时间
  message: string;         // 维护消息
  countdownMinutes: number; // 倒计时分钟数
}

// 模拟维护状态存储
let maintenanceStatus: MaintenanceStatus | null = null

/**
 * 获取维护模式状态
 */
export const getMaintenanceStatus = async (): Promise<MaintenanceStatus | null> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 返回当前维护状态
  return maintenanceStatus
}

/**
 * 启动维护模式
 * @param countdownMinutes 倒计时分钟数
 * @param message 维护消息
 */
export const startMaintenance = async (
  countdownMinutes: number, 
  message: string
): Promise<boolean> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const now = new Date()
  const effectiveTime = new Date(now.getTime() + countdownMinutes * 60 * 1000)
  
  // 设置维护状态
  maintenanceStatus = {
    enabled: true,
    active: false,  // 初始为倒计时状态
    startTime: now.toISOString(),
    effectiveTime: effectiveTime.toISOString(),
    message,
    countdownMinutes
  }
  
  // 倒计时结束后真正激活维护模式
  setTimeout(() => {
    if (maintenanceStatus) {
      maintenanceStatus.active = true
    }
  }, countdownMinutes * 60 * 1000)
  
  return true
}

/**
 * 取消维护模式
 */
export const cancelMaintenance = async (): Promise<boolean> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 取消维护状态
  maintenanceStatus = null
  
  return true
}

/**
 * 获取维护历史记录
 */
export const getMaintenanceHistory = async (): Promise<any[]> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 返回模拟的历史记录
  return [
    {
      id: 1,
      startTime: '2023-11-15T02:00:00Z',
      endTime: '2023-11-15T02:30:00Z',
      message: '系统例行维护',
      status: 'completed'
    },
    {
      id: 2,
      startTime: '2023-11-01T03:00:00Z',
      endTime: '2023-11-01T04:15:00Z',
      message: '数据库优化维护',
      status: 'completed'
    }
  ]
}

// 默认导出服务对象
export default {
  getMaintenanceStatus,
  startMaintenance,
  cancelMaintenance,
  getMaintenanceHistory
}