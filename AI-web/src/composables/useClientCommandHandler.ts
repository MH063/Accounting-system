/**
 * 客户端命令处理器
 * 用于接收管理端的重启命令和系统通知
 */

import api from '@/utils/request';

interface Command {
  type: string;
  action?: string;
  reason?: string;
  initiatedBy?: string;
  estimatedDowntime?: number;
  timestamp: string;
  receivedAt?: number;
}

interface CommandsResponse {
  success: boolean;
  data: {
    hasCommands: boolean;
    restartRequired: boolean;
    notifications: Command[];
    timestamp: string;
  };
}

let isPolling = false;
let pollTimer: number | null = null;
const POLL_INTERVAL = 5000;

export function startCommandPolling(): void {
  if (isPolling) return;
  
  isPolling = true;
  console.log('[ClientCommand] 开始轮询命令...');
  checkCommands();
  
  pollTimer = window.setInterval(() => {
    checkCommands();
  }, POLL_INTERVAL) as unknown as number;
}

export function stopCommandPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  isPolling = false;
  console.log('[ClientCommand] 已停止轮询命令');
}

async function checkCommands(): Promise<void> {
  try {
    const response = await api.get<CommandsResponse>('/client/commands');
    
    if (response.data.success && response.data.data) {
      const { restartRequired, notifications } = response.data.data;
      
      if (restartRequired) {
        handleRestartCommand();
      }
      
      if (notifications && notifications.length > 0) {
        notifications.forEach(notification => {
          handleNotification(notification);
        });
      }
    }
  } catch (error) {
    console.error('[ClientCommand] 检查命令失败:', error);
  }
}

async function handleRestartCommand(): Promise<void> {
  try {
    const { ElMessageBox } = await import('element-plus');
    
    await ElMessageBox.confirm(
      '系统即将重启，请保存您的工作。页面将自动刷新。',
      '系统重启通知',
      {
        confirmButtonText: '确定',
        cancelButtonText: '刷新',
        type: 'warning',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        showClose: false
      }
    );
  } catch {
  }
  
  await performRefresh();
}

async function performRefresh(): Promise<void> {
  try {
    localStorage.setItem('client_last_refresh', Date.now().toString());
    window.location.reload();
  } catch (error) {
    console.error('[ClientCommand] 刷新页面失败:', error);
    window.location.reload();
  }
}

function handleNotification(notification: Command): void {
  try {
    const { ElMessage } = import('element-plus');
    console.log('[ClientCommand] 收到系统通知:', notification);
  } catch (error) {
    console.log('[ClientCommand] 收到系统通知:', notification);
  }
}

export function checkAutoRefresh(): void {
  try {
    const lastRefresh = localStorage.getItem('client_last_refresh');
    if (lastRefresh) {
      const lastRefreshTime = parseInt(lastRefresh);
      const now = Date.now();
      if (now - lastRefreshTime > 60000) {
        localStorage.removeItem('client_last_refresh');
        return;
      }
      localStorage.removeItem('client_last_refresh');
      window.location.reload();
    }
  } catch (error) {
    console.error('[ClientCommand] 自动刷新检查失败:', error);
  }
}

export function isCurrentlyPolling(): boolean {
  return isPolling;
}
