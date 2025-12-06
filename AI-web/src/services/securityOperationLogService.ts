/**
 * 安全操作日志服务
 * 负责记录和管理用户的安全相关操作日志
 */

export interface SecurityOperationLog {
  id: string;
  userId: string;
  operation: string;
  description: string;
  ip: string;
  userAgent: string;
  timestamp: number;
  status: 'success' | 'failed';
  details?: Record<string, any>;
}

/**
 * 记录安全操作日志
 * @param log 日志条目
 */
export const logSecurityOperation = (log: Omit<SecurityOperationLog, 'id' | 'timestamp'>): void => {
  try {
    const logEntry: SecurityOperationLog = {
      ...log,
      id: generateId(),
      timestamp: Date.now()
    };

    // 获取现有的安全操作日志
    const logsStr = localStorage.getItem('security_operation_logs');
    let logs: SecurityOperationLog[] = [];
    if (logsStr) {
      logs = JSON.parse(logsStr);
    }

    // 添加新的日志条目
    logs.push(logEntry);

    // 只保留最近的500条日志
    if (logs.length > 500) {
      logs = logs.slice(-500);
    }

    // 保存日志
    localStorage.setItem('security_operation_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('记录安全操作日志失败:', error);
  }
};

/**
 * 获取安全操作日志
 * @param userId 用户ID
 * @param limit 返回条数限制
 * @returns 安全操作日志列表
 */
export const getSecurityOperationLogs = (userId: string, limit: number = 100): SecurityOperationLog[] => {
  try {
    const logsStr = localStorage.getItem('security_operation_logs');
    if (!logsStr) {
      return [];
    }

    const logs: SecurityOperationLog[] = JSON.parse(logsStr);
    
    // 过滤指定用户的安全操作日志
    const userLogs = logs.filter(log => log.userId === userId);
    
    // 按时间倒序排列并限制数量
    return userLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('获取安全操作日志失败:', error);
    return [];
  }
};

/**
 * 清除安全操作日志
 * @param userId 用户ID
 */
export const clearSecurityOperationLogs = (userId: string): void => {
  try {
    const logsStr = localStorage.getItem('security_operation_logs');
    if (!logsStr) {
      return;
    }

    let logs: SecurityOperationLog[] = JSON.parse(logsStr);
    
    // 过滤掉指定用户的日志
    logs = logs.filter(log => log.userId !== userId);
    
    // 保存日志
    localStorage.setItem('security_operation_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('清除安全操作日志失败:', error);
  }
};

/**
 * 导出安全操作日志
 * @param userId 用户ID
 * @returns 日志数据的Blob对象
 */
export const exportSecurityOperationLogs = (userId: string): Blob => {
  try {
    const logs = getSecurityOperationLogs(userId, 1000);
    // 添加BOM以支持UTF-8编码，解决Excel打开乱码问题
    const csvHeader = '\uFEFF';
    const csvContent = [
      ['时间', '操作', '描述', 'IP地址', '状态', '详细信息'],
      ...logs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.operation,
        log.description,
        log.ip,
        log.status === 'success' ? '成功' : '失败',
        log.details ? escapeCsvField(JSON.stringify(log.details)) : ''
      ])
    ]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
  } catch (error) {
    console.error('导出安全操作日志失败:', error);
    return new Blob([], { type: 'text/csv;charset=utf-8;' });
  }
};

/**
 * 转义CSV字段中的特殊字符
 * @param field 字段值
 * @returns 转义后的字段值
 */
const escapeCsvField = (field: string): string => {
  // 替换所有双引号为两个双引号
  return field.replace(/"/g, '""');
};

/**
 * 生成唯一ID
 * @returns 唯一ID
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export default {
  logSecurityOperation,
  getSecurityOperationLogs,
  clearSecurityOperationLogs,
  exportSecurityOperationLogs
};