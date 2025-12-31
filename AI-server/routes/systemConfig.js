const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const systemConfigService = require('../services/systemConfigService');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');

const SYSTEM_CONFIG = 'SYSTEM_CONFIG';

router.use(authenticateToken);

router.get('/config', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    const { environment, group, active } = req.query;
    const configs = await systemConfigService.getAllConfigs({
      environment: environment || 'all',
      activeOnly: active !== 'false',
      group: group || null
    });
    
    res.json({
      success: true,
      data: {
        configs,
        meta: {
          environment: environment || 'all',
          group: group || 'all',
          count: Object.keys(configs).length
        }
      }
    });
  } catch (error) {
    console.error('[systemConfig] Get all configs error:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message
    });
  }
}));

router.get('/config/groups', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    const groups = await systemConfigService.getConfigGroups();
    res.json({
      success: true,
      data: { groups }
    });
  } catch (error) {
    console.error('[systemConfig] Get config groups error:', error);
    res.status(500).json({
      success: false,
      message: '获取配置分组失败',
      error: error.message
    });
  }
}));

router.get('/config/meta', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    const meta = await systemConfigService.getMetaInfo();
    res.json({
      success: true,
      data: { meta }
    });
  } catch (error) {
    console.error('[systemConfig] Get meta info error:', error);
    res.status(500).json({
      success: false,
      message: '获取配置元信息失败',
      error: error.message
    });
  }
}));

router.get('/config/:key', authorizeAdmin, [
  body('key').isString().notEmpty()
], responseWrapper(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }
    
    const config = await systemConfigService.getConfig(req.params.key);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }
    
    res.json({
      success: true,
      data: { config }
    });
  } catch (error) {
    console.error('[systemConfig] Get config error:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message
    });
  }
}));

router.post('/config', authorizeAdmin, [
  body('key').isString().notEmpty(),
  body('value').exists()
], responseWrapper(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }
    
    const { key, value, description, displayName, requiresRestart } = req.body;
    const userId = req.user?.id;
    
    const result = await systemConfigService.setConfig(key, value, {
      description,
      displayName,
      userId,
      requiresRestart
    });
    
    res.json({
      success: true,
      data: {
        message: '配置更新成功',
        ...result
      }
    });
  } catch (error) {
    console.error('[systemConfig] Set config error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新配置失败'
    });
  }
}));

router.put('/config', authorizeAdmin, [
  body('configs').isObject()
], responseWrapper(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }
    
    const { configs } = req.body;
    const userId = req.user?.id;
    
    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'configs必须是对象类型'
      });
    }
    
    const result = await systemConfigService.setConfigs(configs, userId);
    
    res.json({
      success: true,
      data: {
        message: '批量配置更新完成',
        ...result
      }
    });
  } catch (error) {
    console.error('[systemConfig] Batch set configs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '批量更新配置失败'
    });
  }
}));

router.delete('/config/:key', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    const deleted = await systemConfigService.deleteConfig(req.params.key);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }
    
    res.json({
      success: true,
      data: { message: '配置已禁用' }
    });
  } catch (error) {
    console.error('[systemConfig] Delete config error:', error);
    res.status(500).json({
      success: false,
      message: '删除配置失败',
      error: error.message
    });
  }
}));

router.post('/config/:key/reset', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await systemConfigService.resetConfig(req.params.key, userId);
    
    res.json({
      success: true,
      data: {
        message: '配置已重置为默认值',
        ...result
      }
    });
  } catch (error) {
    console.error('[systemConfig] Reset config error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '重置配置失败'
    });
  }
}));

router.get('/config/:key/restart-required', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    const config = await systemConfigService.getConfig(req.params.key);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        key: req.params.key,
        requiresRestart: config.requiresRestart
      }
    });
  } catch (error) {
    console.error('[systemConfig] Check restart required error:', error);
    res.status(500).json({
      success: false,
      message: '检查重启要求失败',
      error: error.message
    });
  }
}));

router.post('/init-defaults', authorizeAdmin, responseWrapper(async (req, res) => {
  try {
    await systemConfigService.initializeDefaultConfigs();
    
    res.json({
      success: true,
      data: { message: '默认配置初始化完成' }
    });
  } catch (error) {
    console.error('[systemConfig] Initialize defaults error:', error);
    res.status(500).json({
      success: false,
      message: '初始化默认配置失败',
      error: error.message
    });
  }
}));

module.exports = router;
