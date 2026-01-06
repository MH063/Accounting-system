/**
 * CDN管理器
 * 支持多种CDN提供商和配置管理
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');
const versionManager = require('../config/versionManager');

class CDNManager {
  constructor(config = {}) {
    this.config = {
      enabled: false,
      provider: 'cloudflare', // cloudflare, aws-cloudfront, alibaba-cdn
      apiKey: process.env.CDN_API_KEY || '',
      zoneId: process.env.CDN_ZONE_ID || '',
      domain: process.env.CDN_DOMAIN || '',
      baseUrl: process.env.CDN_BASE_URL || '',
      timeout: 30000,
      retries: 3,
      ...config
    };
    
    this.cache = new Map();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      purgeRequests: 0,
      uploadRequests: 0
    };
  }

  /**
   * 检查CDN是否启用
   */
  isEnabled() {
    return this.config.enabled && this.config.apiKey;
  }

  /**
   * 生成CDN URL
   * @param {string} relativePath - 相对路径
   * @param {boolean} useCacheBusting - 是否使用缓存破坏
   * @returns {string} CDN URL
   */
  generateCDNUrl(relativePath, useCacheBusting = true) {
    if (!this.isEnabled()) {
      return `/${relativePath}`;
    }

    const baseUrl = this.config.baseUrl || `https://${this.config.domain}`;
    let url = `${baseUrl}/${relativePath.replace(/^\//, '')}`;
    
    if (useCacheBusting) {
      const version = this.getVersion();
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}v=${version}`;
    }
    
    return url;
  }

  /**
   * 获取版本号用于缓存破坏
   */
  getVersion() {
    if (this.cache.has('version')) {
      return this.cache.get('version');
    }
    
    const serverVersion = versionManager.getServerVersion();
    const version = serverVersion.version;
    
    try {
      this.cache.set('version', version);
      return version;
    } catch (error) {
      logger.warn('无法获取版本号，使用默认版本:', error.message);
      return version;
    }
  }

  /**
   * 清除CDN缓存
   * @param {Array<string>} urls - 需要清除的URLs
   * @returns {Promise<Object>} 清除结果
   */
  async purgeCache(urls = []) {
    if (!this.isEnabled()) {
      return { success: false, message: 'CDN未启用' };
    }

    this.stats.purgeRequests++;
    
    try {
      switch (this.config.provider) {
        case 'cloudflare':
          return await this.purgeCloudflareCache(urls);
        case 'aws-cloudfront':
          return await this.purgeCloudFrontCache(urls);
        case 'alibaba-cdn':
          return await this.purgeAlibabaCDNCache(urls);
        default:
          throw new Error(`不支持的CDN提供商: ${this.config.provider}`);
      }
    } catch (error) {
      logger.error('CDN缓存清除失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * CloudFlare缓存清除
   */
  async purgeCloudflareCache(urls = []) {
    const endpoint = `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`;
    
    const payload = urls.length > 0 ? {
      files: urls
    } : {
      purge_everything: true
    };

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: this.config.timeout
    });

    if (response.data.success) {
      logger.info('CloudFlare缓存清除成功');
      return { success: true, message: 'CloudFlare缓存清除成功', data: response.data.result };
    } else {
      throw new Error(response.data.errors?.[0]?.message || 'CloudFlare API错误');
    }
  }

  /**
   * AWS CloudFront缓存清除
   */
  async purgeCloudFrontCache(urls = []) {
    // CloudFront需要通过Invalidation Distribution
    const endpoint = `https://cloudfront.amazonaws.com/2019-03-26/distribution/${this.config.distributionId}/invalidation`;
    
    const payload = {
      InvalidationBatch: {
        Paths: {
          Quantity: urls.length || 1,
          Items: urls.length > 0 ? urls : ['/*']
        },
        CallerReference: `purge-${Date.now()}`
      }
    };

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: this.config.timeout
    });

    if (response.status === 201) {
      logger.info('CloudFront缓存清除成功');
      return { success: true, message: 'CloudFront缓存清除成功', data: response.data };
    } else {
      throw new Error('CloudFront API错误');
    }
  }

  /**
   * 阿里云CDN缓存清除
   */
  async purgeAlibabaCDNCache(urls = []) {
    const endpoint = 'https://cdn.aliyuncs.com';
    
    const params = {
      'Action': 'DeleteCdnDomainConfig',
      'Version': '2018-05-10',
      'Format': 'JSON',
      'DomainName': this.config.domain
    };

    if (urls.length > 0) {
      params.FileList = JSON.stringify(urls);
    }

    const response = await axios.get(endpoint, {
      params,
      headers: {
        'Authorization': `Basic ${this.config.apiKey}`
      },
      timeout: this.config.timeout
    });

    if (response.data.Code) {
      throw new Error(`阿里云CDN API错误: ${response.data.Message}`);
    }

    logger.info('阿里云CDN缓存清除成功');
    return { success: true, message: '阿里云CDN缓存清除成功', data: response.data };
  }

  /**
   * 获取CDN统计信息
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(2) 
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      enabled: this.isEnabled(),
      provider: this.config.provider,
      domain: this.config.domain
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      purgeRequests: 0,
      uploadRequests: 0
    };
  }

  /**
   * 配置CDN设置
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    logger.info('CDN配置已更新:', { provider: this.config.provider, enabled: this.config.enabled });
    return { success: true, message: 'CDN配置更新成功' };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    if (!this.isEnabled()) {
      return { status: 'disabled', message: 'CDN未启用' };
    }

    try {
      // 测试CDN连接
      const testUrl = this.generateCDNUrl('test.jpg');
      const response = await axios.get(testUrl, { 
        timeout: 5000,
        validateStatus: () => true // 接受任何状态码
      });
      
      return {
        status: 'healthy',
        message: 'CDN连接正常',
        responseTime: response.headers['x-response-time'] || 'N/A',
        testUrl
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `CDN连接失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 获取CDN配置状态
   */
  getConfigStatus() {
    return {
      enabled: this.config.enabled,
      provider: this.config.provider,
      domain: this.config.domain,
      hasApiKey: !!this.config.apiKey,
      hasZoneId: !!this.config.zoneId,
      configured: this.isEnabled()
    };
  }

  /**
   * 获取CDN状态信息（性能概览需要）
   */
  async getStatus() {
    try {
      const stats = this.getStats();
      const health = await this.healthCheck();
      const config = this.getConfigStatus();

      return {
        status: 'active',
        hitRate: stats.hitRate,
        totalRequests: stats.totalRequests,
        cacheHits: stats.cacheHits,
        cacheMisses: stats.cacheMisses,
        provider: config.provider,
        domain: config.domain,
        enabled: config.enabled,
        health: health.status,
        healthMessage: health.message
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        provider: this.config.provider,
        domain: this.config.domain,
        enabled: this.config.enabled
      };
    }
  }
}

// 单例模式
let instance = null;

/**
 * 获取CDN管理器实例
 */
function getCDNManager(config = {}) {
  if (!instance) {
    instance = new CDNManager(config);
  }
  return instance;
}

module.exports = {
  CDNManager,
  getCDNManager
};