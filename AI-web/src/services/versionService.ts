/**
 * 版本服务
 * 提供版本检查和更新功能
 */

// 当前应用版本信息
export interface AppVersion {
  version: string;           // 版本号 (如: "1.0.0")
  buildNumber: string;       // 构建号 (如: "2024.01.01.001")
  releaseDate: string;       // 发布日期 (如: "2024-01-01")
  releaseNotes: string;      // 发布说明
  downloadUrl?: string;      // 下载地址
  checksum?: string;         // 校验和
}

// 版本检查响应
export interface VersionCheckResponse {
  hasUpdate: boolean;        // 是否有更新
  currentVersion: AppVersion; // 当前版本
  latestVersion?: AppVersion; // 最新版本（如果有更新）
  updateRequired: boolean;   // 是否强制更新
  updateMessage?: string;    // 更新消息
}

// 版本比较结果
export type VersionComparison = 'older' | 'same' | 'newer';

/**
 * 获取当前应用版本信息
 */
export const getCurrentVersion = (): AppVersion => {
  // 从环境变量或配置文件中获取版本信息
  // 这里使用硬编码的版本信息作为示例
  return {
    version: '1.0.0',
    buildNumber: '2024.01.01.001',
    releaseDate: '2024-01-01',
    releaseNotes: '首次发布版本',
    downloadUrl: 'https://example.com/download/latest',
    checksum: 'abc123def456'
  };
};

/**
 * 比较两个版本号
 * @param currentVersion 当前版本
 * @param targetVersion 目标版本
 * @returns 版本比较结果
 */
export const compareVersions = (currentVersion: string, targetVersion: string): VersionComparison => {
  // 简单的版本号比较实现
  // 实际项目中可能需要更复杂的版本号解析逻辑
  
  const currentParts = currentVersion.split('.').map(Number);
  const targetParts = targetVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, targetParts.length); i++) {
    const current = currentParts[i] || 0;
    const target = targetParts[i] || 0;
    
    if (current < target) {
      return 'older';
    } else if (current > target) {
      return 'newer';
    }
  }
  
  return 'same';
};

/**
 * 检查用户是否已忽略特定版本
 * @param version 要检查的版本号
 * @returns 如果用户已忽略该版本则返回true，否则返回false
 */
export const isVersionIgnored = (version: string): boolean => {
  if (typeof localStorage === 'undefined') return false;
  
  const ignoredVersion = localStorage.getItem('ignoredVersion');
  return ignoredVersion === version;
};

/**
 * 清除已忽略的版本信息
 */
export const clearIgnoredVersion = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('ignoredVersion');
  }
};

/**
 * 检查是否有新版本
 * API调用，在实际应用中应该连接到服务器获取最新版本信息
 */
export const checkForUpdates = async (): Promise<VersionCheckResponse> => {
  try {
    // 获取当前版本
    const currentVersion = getCurrentVersion();
    
    // 调用真实的API获取最新版本信息
    const response = await fetch('/version/latest', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`获取版本信息失败: ${response.status}`);
    }
    
    const latestVersion: AppVersion = await response.json();
    
    // 检查用户是否已忽略此版本
    if (isVersionIgnored(latestVersion.version)) {
      return {
        hasUpdate: false,
        currentVersion,
        updateRequired: false,
        updateMessage: '您当前使用的是最新版本（已忽略更新提醒）'
      };
    }
    
    // 比较版本
    const versionComparison = compareVersions(currentVersion.version, latestVersion.version);
    const hasUpdate = versionComparison === 'older';
    
    return {
      hasUpdate,
      currentVersion,
      latestVersion: hasUpdate ? latestVersion : undefined,
      updateRequired: false, // 根据业务需求设置是否强制更新
      updateMessage: hasUpdate 
        ? `发现新版本 ${latestVersion.version}，建议立即更新以获得更好的体验。` 
        : '您当前使用的是最新版本'
    };
  } catch (error) {
    console.error('检查更新失败:', error);
    throw new Error('检查更新失败，请稍后重试');
  }
};

/**
 * 下载更新
 * @param version 要下载的版本信息
 */
export const downloadUpdate = async (version: AppVersion): Promise<void> => {
  try {
    console.log(`开始下载版本 ${version.version}...`);
    
    // 调用真实的下载逻辑
    // 可能包括：
    // 1. 显示下载进度
    // 2. 验证文件完整性
    // 3. 触发安装流程
    
    // 检查downloadUrl是否存在
    if (!version.downloadUrl) {
      throw new Error('下载URL不存在');
    }
    
    try {
      const response = await fetch(version.downloadUrl, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }
      
      // 这里应该处理实际的文件下载和保存
      console.log('下载完成');
    } catch (error) {
      console.error('下载更新失败:', error);
      throw new Error('下载更新失败');
    }
  } catch (error) {
    console.error('下载更新失败:', error);
    throw new Error('下载更新失败');
  }
};

export default {
  getCurrentVersion,
  compareVersions,
  isVersionIgnored,
  clearIgnoredVersion,
  checkForUpdates,
  downloadUpdate
};