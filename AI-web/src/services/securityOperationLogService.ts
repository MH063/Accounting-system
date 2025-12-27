import { request } from '@/utils/request';
import type { ApiResponse } from '@/types';

/**
 * 安全操作日志服务
 * 负责从后端获取和管理用户的安全相关操作日志
 */

export interface SecurityOperationLog {
  id: string;
  userId: string;
  type: string;
  timestamp: string;
  sourceIp: string;
  userAgent: string;
  resource: string;
  action: string;
  outcome: string;
  severity: string;
  data?: any;
}

export interface SecurityLogsResponse {
  logs: SecurityOperationLog[];
  total: number;
  hasMore: boolean;
}

/**
 * 从后端获取安全操作日志
 * @param params 查询参数
 * @returns 安全操作日志列表
 */
export const getSecurityOperationLogs = async (params: {
  userId?: string;
  type?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<SecurityLogsResponse>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.type) queryParams.append('type', params.type);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await request<ApiResponse<SecurityLogsResponse>>(`/security/audit-logs?${queryParams.toString()}`, {
      method: 'GET'
    });

    // 处理双层嵌套结构 (Rule 5)
    if (response.success && response.data) {
      const actualData = (response.data as any).data || response.data;
      return {
        ...response,
        data: actualData
      };
    }

    return response;
  } catch (error) {
    console.error('获取安全操作日志失败:', error);
    return {
      success: false,
      message: '获取安全操作日志失败',
      data: { logs: [], total: 0, hasMore: false }
    };
  }
};

/**
 * 记录安全操作日志到后端
 * @param eventData 事件数据
 */
export const logSecurityOperation = async (eventData: any): Promise<ApiResponse<any>> => {
  try {
    // 补全后端需要的字段 (type 和 outcome)
    const normalizedData = {
      ...eventData,
      type: eventData.type || eventData.operation || eventData.action || 'unknown_event',
      outcome: eventData.outcome || eventData.status || 'unknown'
    };

    const response = await request<ApiResponse<any>>('/security/log-event', {
      method: 'POST',
      data: normalizedData
    });
    
    // 处理双层嵌套结构 (Rule 5)
    if (response.success && response.data) {
      const actualData = (response.data as any).data || response.data;
      return {
        ...response,
        data: actualData
      };
    }
    
    return response;
  } catch (error) {
    console.error('记录安全操作日志失败:', error);
    return {
      success: false,
      message: '记录安全操作日志失败',
      data: null
    };
  }
};

/**
 * 导出安全操作日志
 * @param userId 用户ID
 * @returns 日志数据的Blob对象
 */
export const exportSecurityOperationLogs = async (userId: string): Promise<Blob> => {
  try {
    const response = await getSecurityOperationLogs({ userId, limit: 1000 });
    const logs = response.data?.logs || [];
    
    // 添加BOM以支持UTF-8编码，解决Excel打开乱码问题
    const csvHeader = '\uFEFF';
    const csvContent = [
      ['时间', '类型', 'IP地址', 'User-Agent', '资源', '操作', '结果', '严重程度'],
      ...logs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.type,
        log.sourceIp,
        log.userAgent,
        log.resource,
        log.action,
        log.outcome,
        log.severity
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

export default {
  getSecurityOperationLogs,
  logSecurityOperation,
  exportSecurityOperationLogs
};
