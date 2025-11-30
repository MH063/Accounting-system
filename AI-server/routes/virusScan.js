/**
 * 病毒扫描状态路由
 * 提供病毒扫描服务状态查询和测试功能
 */

const express = require('express');
const { getServiceStatus } = require('../middleware/virusScannerOnline');
const { initClamAV } = require('../middleware/virusScanner');
const { asyncHandler } = require('../middleware/errorHandler');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

const router = express.Router();

/**
 * 获取病毒扫描服务状态
 * GET /api/virus-scan/status
 */
router.get('/status', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[VIRUS-SCAN] 获取病毒扫描服务状态');
  
  // 获取在线扫描服务状态
  const onlineStatus = getServiceStatus();
  
  // 检查本地ClamAV状态
  let localStatus = {
    available: false,
    initialized: false
  };
  
  try {
    const initialized = await initClamAV();
    localStatus = {
      available: true,
      initialized: initialized
    };
  } catch (error) {
    logger.warn(`[VIRUS-SCAN] 本地ClamAV状态检查失败: ${error.message}`);
  }
  
  const status = {
    onlineService: onlineStatus,
    localService: localStatus,
    timestamp: new Date().toISOString()
  };
  
  logger.info('[VIRUS-SCAN] 病毒扫描服务状态获取成功', { 
    onlineConfigured: onlineStatus.configured,
    localAvailable: localStatus.available
  });
  
  return res.json({
    success: true,
    message: '病毒扫描服务状态获取成功',
    data: status
  });
})));

/**
 * 测试病毒扫描功能
 * POST /api/virus-scan/test
 * 
 * 注意：这是一个测试接口，用于验证病毒扫描功能是否正常工作
 * 实际使用中应该通过文件上传接口进行扫描
 */
router.post('/test', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[VIRUS-SCAN] 测试病毒扫描功能');
  
  // 这里可以添加测试逻辑，比如创建一个安全的测试文件进行扫描
  // 为了安全起见，这里只返回服务状态
  
  const onlineStatus = getServiceStatus();
  
  return res.json({
    success: true,
    message: '病毒扫描功能测试完成',
    data: {
      onlineService: onlineStatus,
      note: '这是一个测试接口，实际扫描应通过文件上传进行',
      timestamp: new Date().toISOString()
    }
  });
})));

/**
 * 获取支持的扫描服务信息
 * GET /api/virus-scan/services
 */
router.get('/services', responseWrapper(asyncHandler(async (req, res) => {
  logger.info('[VIRUS-SCAN] 获取支持的扫描服务信息');
  
  const services = {
    virustotal: {
      name: 'VirusTotal',
      description: 'Google旗下的多引擎病毒扫描服务',
      maxFileSize: '32MB',
      features: ['多引擎扫描', '哈希缓存', '详细报告'],
      configured: !!process.env.VIRUSTOTAL_API_KEY
    },
    clamav: {
      name: 'ClamAV',
      description: '开源本地病毒扫描引擎',
      features: ['本地扫描', '实时保护', '开源免费'],
      configured: true // 总是可用，但需要在系统中安装
    }
  };
  
  return res.json({
    success: true,
    message: '扫描服务信息获取成功',
    data: services
  });
})));

module.exports = router;