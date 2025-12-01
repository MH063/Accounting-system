/**
 * 零信任安全示例路由
 * 演示如何使用零信任访问控制中间件
 */

const express = require('express');
const router = express.Router();
const { zeroTrustAccessControl, dynamicAccessControl, appSegmentation, dataSegmentation } = require('../middleware');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

/**
 * 示例1: 基本的零信任访问控制
 * 需要"user:read"权限才能访问
 */
router.get('/basic', 
  zeroTrustAccessControl(['user:read']), 
  responseWrapper((req, res) => {
    return res.sendSuccess({
      message: '零信任访问控制示例 - 基本权限验证通过',
      user: req.user,
      accessContext: req.accessContext
    }, '访问成功');
  })
);

/**
 * 示例2: 强制多因素认证的访问控制
 * 需要"user:read"权限并且用户必须启用MFA
 */
router.get('/mfa-required', 
  zeroTrustAccessControl(['user:read'], { enforceMFA: true }), 
  responseWrapper((req, res) => {
    return res.sendSuccess({
      message: '零信任访问控制示例 - MFA验证通过',
      user: req.user,
      accessContext: req.accessContext
    }, '访问成功');
  })
);

/**
 * 示例3: 应用微隔离 - 财务模块访问
 * 需要财务模块的读取权限
 */
router.get('/financial-module', 
  zeroTrustAccessControl(['financial:read'], { 
    moduleName: 'financial',
    action: 'read'
  }), 
  responseWrapper((req, res) => {
    return res.sendSuccess({
      message: '零信任访问控制示例 - 财务模块访问通过',
      user: req.user,
      accessContext: req.accessContext,
      module: 'financial'
    }, '访问成功');
  })
);

/**
 * 示例4: 应用微隔离 - 用户管理模块访问
 * 需要用户管理模块的写入权限
 */
router.post('/user-management', 
  zeroTrustAccessControl(['user-management:write'], { 
    moduleName: 'user-management',
    action: 'write'
  }), 
  responseWrapper((req, res) => {
    return res.sendSuccess({
      message: '零信任访问控制示例 - 用户管理模块写入通过',
      user: req.user,
      accessContext: req.accessContext,
      module: 'user-management'
    }, '操作成功');
  })
);

/**
 * 示例5: 动态访问控制
 * 根据用户行为动态调整安全策略
 */
router.get('/dynamic', 
  dynamicAccessControl({ riskThreshold: 0.5 }),
  responseWrapper((req, res) => {
    return res.sendSuccess({
      message: '零信任访问控制示例 - 动态访问控制通过',
      user: req.user,
      accessContext: req.accessContext
    }, '访问成功');
  })
);

/**
 * 示例6: 数据微隔离 - 敏感数据访问
 * 展示如何过滤敏感数据
 */
router.get('/sensitive-data', 
  zeroTrustAccessControl(['sensitive:read'], { 
    moduleName: 'sensitive-data',
    action: 'read'
  }),
  responseWrapper((req, res) => {
    // 模拟敏感数据
    const sensitiveData = {
      id: 1,
      username: 'john_doe',
      password: 'super_secret_password',
      ssn: '123-45-6789',
      creditCard: '4111-1111-1111-1111',
      salary: 75000,
      normalField: '普通数据'
    };

    // 根据用户角色过滤敏感数据
    const userRole = req.user?.role || 'guest';
    const filteredData = dataSegmentation.filterSensitiveData(sensitiveData, userRole);

    return res.sendSuccess({
      message: '零信任访问控制示例 - 敏感数据访问通过',
      user: req.user,
      accessContext: req.accessContext,
      data: filteredData
    }, '数据获取成功');
  })
);

/**
 * 示例7: 网络微隔离测试
 * 需要特定的服务间连接权限
 */
router.get('/network-segmentation', 
  zeroTrustAccessControl(['network:internal'], {
    moduleName: 'network',
    action: 'read'
  }),
  responseWrapper((req, res) => {
    return res.sendSuccess({
      message: '零信任访问控制示例 - 网络微隔离通过',
      user: req.user,
      accessContext: req.accessContext,
      serviceInfo: {
        sourceService: req.headers['x-service-name'] || 'external',
        targetService: process.env.SERVICE_NAME || 'api-server',
        protocol: req.protocol
      }
    }, '访问成功');
  })
);

module.exports = router;