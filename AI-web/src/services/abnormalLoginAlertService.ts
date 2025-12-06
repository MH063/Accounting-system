import { notificationService } from './notificationService';

/**
 * 发送异常登录提醒通知
 * @param accountId 账户ID
 * @param ipAddress IP地址
 * @param userAgent 用户代理
 * @param loginTime 登录时间
 */
export const sendAbnormalLoginAlert = async (
  accountId: string,
  ipAddress: string,
  userAgent: string,
  loginTime: number
): Promise<void> => {
  try {
    // 解析用户代理信息以获取设备和浏览器信息
    const deviceInfo = parseUserAgent(userAgent);
    
    // 构造通知内容
    const notification = {
      title: '异常登录提醒',
      message: `检测到您的账户在 ${new Date(loginTime).toLocaleString()} 从 ${ipAddress} (${deviceInfo.browser} on ${deviceInfo.device}) 登录。如果不是您本人操作，请立即修改密码。`,
      type: 'security',
      isRead: false,
      isImportant: true,
      actionText: '查看登录历史',
      actionPath: '/security/settings#login-history'
    };
    
    // 添加通知到通知服务
    notificationService.addNotification(notification);
    
    console.log('异常登录提醒已发送:', notification);
  } catch (error) {
    console.error('发送异常登录提醒失败:', error);
  }
};

/**
 * 解析用户代理字符串获取设备和浏览器信息
 * @param userAgent 用户代理字符串
 * @returns 设备和浏览器信息
 */
const parseUserAgent = (userAgent: string): { device: string; browser: string } => {
  // 简化的用户代理解析
  let device = '未知设备';
  let browser = '未知浏览器';
  
  // 设备类型检测
  if (/mobile|android|iphone|ipod|ipad/i.test(userAgent)) {
    device = '移动设备';
  } else if (/tablet|ipad/i.test(userAgent)) {
    device = '平板设备';
  } else {
    device = '桌面设备';
  }
  
  // 浏览器检测
  if (/chrome/i.test(userAgent) && !/edge|opr/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/edge/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/opr/i.test(userAgent)) {
    browser = 'Opera';
  } else if (/msie|trident/i.test(userAgent)) {
    browser = 'Internet Explorer';
  }
  
  return { device, browser };
};

export default {
  sendAbnormalLoginAlert
};