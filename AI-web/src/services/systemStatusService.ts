/**
 * 系统状态服务
 * 提供系统健康检查和状态监控功能
 */

// 系统状态类型定义
export interface SystemStatus {
  type: 'success' | 'warning' | 'danger' | 'info';
  text: string;
  uptime?: number; // 系统运行时间（秒）
  cpuUsage?: number; // CPU使用率（百分比）
  memoryUsage?: number; // 内存使用率（百分比）
  diskUsage?: number; // 磁盘使用率（百分比）
  lastCheckTime: Date; // 最后检查时间
}

// 系统健康检查响应类型
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    api: 'up' | 'down';
    frontend: 'up' | 'down';
  };
  metrics?: {
    uptime: number;
    cpu: number;
    memory: number;
    disk: number;
  };
}

/**
 * 模拟系统健康检查API调用
 * 在实际应用中，这应该替换为真实的API端点
 */
export const checkSystemHealth = async (): Promise<HealthCheckResponse> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 模拟不同的系统状态（在实际应用中，这应该来自真实的健康检查端点）
  const statuses: HealthCheckResponse[] = [
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        api: 'up',
        frontend: 'up'
      },
      metrics: {
        uptime: Math.floor(Math.random() * 1000000),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100
      }
    },
    {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        api: 'up',
        frontend: 'up'
      },
      metrics: {
        uptime: Math.floor(Math.random() * 1000000),
        cpu: 85 + Math.random() * 15,
        memory: 80 + Math.random() * 20,
        disk: 85 + Math.random() * 15
      }
    },
    {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'down',
        api: 'up',
        frontend: 'up'
      },
      metrics: {
        uptime: Math.floor(Math.random() * 1000000),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: 95 + Math.random() * 5
      }
    }
  ];
  
  // 随机返回一种状态（实际应用中应该根据真实的系统状态来决定）
  const randomIndex = Math.floor(Math.random() * statuses.length);
  
  // 使用非空断言操作符确保返回值不为undefined
  return statuses[randomIndex]!;
};

/**
 * 将健康检查响应转换为系统状态
 */
export const mapHealthToStatus = (health: HealthCheckResponse): SystemStatus => {
  const baseStatus = {
    lastCheckTime: new Date(health.timestamp),
    uptime: health.metrics?.uptime,
    cpuUsage: health.metrics?.cpu,
    memoryUsage: health.metrics?.memory,
    diskUsage: health.metrics?.disk
  };

  switch (health.status) {
    case 'healthy':
      return {
        type: 'success',
        text: '运行中',
        ...baseStatus
      };
    case 'degraded':
      return {
        type: 'warning',
        text: '性能下降',
        ...baseStatus
      };
    case 'unhealthy':
      return {
        type: 'danger',
        text: '服务异常',
        ...baseStatus
      };
    case 'maintenance':
      return {
        type: 'info',
        text: '维护中',
        ...baseStatus
      };
    default:
      return {
        type: 'info',
        text: '未知状态',
        ...baseStatus
      };
  }
};

/**
 * 获取系统状态
 */
export const getSystemStatus = async (): Promise<SystemStatus> => {
  try {
    const health = await checkSystemHealth();
    return mapHealthToStatus(health);
  } catch (error) {
    console.error('获取系统状态失败:', error);
    // 出错时返回默认状态
    return {
      type: 'danger',
      text: '检查失败',
      lastCheckTime: new Date()
    };
  }
};

/**
 * 格式化运行时间
 */
export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟`;
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
};

/**
 * 格式化百分比
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export default {
  getSystemStatus,
  formatUptime,
  formatPercentage
};