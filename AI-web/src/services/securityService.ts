import { request } from '@/utils/request';
import type { ApiResponse } from '@/types';

/**
 * 更新用户安全设置
 * @param settings 安全设置数据
 * @returns API响应
 */
export const updateSecuritySettings = async (settings: {
  login_protection_enabled?: boolean;
  email_alerts_enabled?: boolean;
  sms_alerts_enabled?: boolean;
  session_timeout_minutes?: number;
  session_timeout_warning_minutes?: number;
  biometric_enabled?: boolean;
}): Promise<ApiResponse<any>> => {
  return request<ApiResponse<any>>('/security/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
};

/**
 * 获取用户安全设置
 * @returns API响应
 */
export const getSecuritySettings = async (): Promise<ApiResponse<{
  login_protection_enabled: boolean;
  email_alerts_enabled: boolean;
  sms_alerts_enabled: boolean;
  session_timeout_minutes: number;
  session_timeout_warning_minutes: number;
  biometric_enabled: boolean;
}>> => {
  return request<ApiResponse<any>>('/security/settings', {
    method: 'GET'
  });
};
