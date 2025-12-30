/**
 * API文档路由
 * 提供Swagger UI界面和API文档生成功能
 */

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { 
  initSwagger, 
  validateAndGenerateDocs, 
  generateAPIDocumentationStats,
  createDocsDirectory 
} = require('../config/swagger');
const { responseWrapper } = require('../middleware/response');
const { authenticateJWT } = require('../config/permissions');
const logger = require('../config/logger');
const { swaggerMiddlewareOptions } = require('../middleware/swagger');

const router = express.Router();

/**
 * 获取当前服务器的协议和主机
 */
function getServerBaseUrl(req) {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:4000';
  return `${protocol}://${host}`;
}

/**
 * 静态资源路由 - 提供Swagger UI的CSS、JS等静态文件
 * 必须放在HTML页面路由之前
 */
router.use('/', swaggerUi.serve);

/**
 * GET /api/docs
 * 提供Swagger UI界面
 */
router.get('/', responseWrapper(async (req, res) => {
  try {
    // 初始化Swagger文档
    const swaggerSpec = initSwagger();
    if (!swaggerSpec) {
      return res.status(500).json({
        success: false,
        message: 'Swagger文档初始化失败',
        error: 'Unable to initialize Swagger documentation'
      });
    }

    // 覆盖全局JSON响应设置，确保返回HTML页面
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    // 确保swagger-ui使用正确的协议（HTTP而非HTTPS）
    const serverUrl = getServerBaseUrl(req);
    
    // 使用middleware中定义的Swagger UI选项，并覆盖url确保使用HTTP
    const customOptions = {
      ...swaggerMiddlewareOptions,
      swaggerOptions: {
        ...swaggerMiddlewareOptions.swaggerOptions,
        url: `${serverUrl}/api/docs/json`
      },
      customJs: `${serverUrl}/api/docs/swagger-zh.js`
    };
    
    swaggerUi.setup(swaggerSpec, customOptions)(req, res);
  } catch (error) {
    logger.error('Swagger UI路由错误:', error);
    return res.status(500).json({
      success: false,
      message: '文档页面生成失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/docs/swagger-zh.js
 * 提供Swagger UI中文翻译脚本
 */
router.get('/swagger-zh.js', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const jsPath = path.join(__dirname, '../public/swagger-zh.js');
  
  try {
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(jsContent);
  } catch (error) {
    logger.error('加载中文翻译脚本失败:', error);
    res.status(404).send('Translation script not found');
  }
});

/**
 * GET /api/docs.json
 * 返回OpenAPI 3.0规范的JSON文档
 */
router.get('/json', authenticateJWT, responseWrapper(async (req, res) => {
  try {
    const swaggerSpec = initSwagger();
    if (!swaggerSpec) {
      return res.status(500).json({
        success: false,
        message: 'Swagger文档初始化失败'
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  } catch (error) {
    logger.error('API文档JSON路由错误:', error);
    return res.status(500).json({
      success: false,
      message: '文档生成失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/docs/yaml
 * 返回OpenAPI 3.0规范的YAML文档
 */
router.get('/yaml', authenticateJWT, responseWrapper(async (req, res) => {
  try {
    const swaggerSpec = initSwagger();
    if (!swaggerSpec) {
      return res.status(500).json({
        success: false,
        message: 'Swagger文档初始化失败'
      });
    }

    const yaml = require('yaml');
    const yamlString = yaml.stringify(swaggerSpec);

    res.setHeader('Content-Type', 'application/x-yaml');
    res.send(yamlString);
  } catch (error) {
    logger.error('API文档YAML路由错误:', error);
    return res.status(500).json({
      success: false,
      message: 'YAML文档生成失败',
      error: error.message
    });
  }
}));

/**
 * POST /api/docs/generate
 * 重新生成API文档
 */
router.post('/generate', authenticateJWT, responseWrapper(async (req, res) => {
  try {
    // 检查权限 - 需要管理员权限
    const { PermissionChecker, PERMISSIONS } = require('../config/permissions');
    
    if (!PermissionChecker.hasPermission(req.user.id, PERMISSIONS.SYSTEM_CONFIG)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        error: '需要系统配置权限'
      });
    }

    // 创建文档目录
    await createDocsDirectory();

    // 验证并生成文档
    const swaggerSpec = await validateAndGenerateDocs();

    // 生成统计信息
    const stats = generateAPIDocumentationStats(swaggerSpec);

    logger.info('API文档重新生成', {
      userId: req.user.id,
      username: req.user.username,
      stats: stats
    });

    return res.json({
      success: true,
      message: 'API文档生成成功',
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('文档生成路由错误:', error);
    return res.status(500).json({
      success: false,
      message: '文档生成失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/docs/stats
 * 获取API文档统计信息
 */
router.get('/stats', authenticateJWT, responseWrapper(async (req, res) => {
  try {
    const swaggerSpec = initSwagger();
    if (!swaggerSpec) {
      return res.status(500).json({
        success: false,
        message: 'Swagger文档初始化失败'
      });
    }

    const stats = generateAPIDocumentationStats(swaggerSpec);

    return res.json({
      success: true,
      data: {
        stats,
        generatedAt: new Date().toISOString(),
        openapiVersion: swaggerSpec.openapi || '3.0.0'
      }
    });
  } catch (error) {
    logger.error('文档统计路由错误:', error);
    return res.status(500).json({
      success: false,
      message: '统计信息获取失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/docs/validate
 * 验证API文档的完整性
 */
router.get('/validate', responseWrapper(async (req, res) => {
  try {
    const swaggerSpec = initSwagger();
    if (!swaggerSpec) {
      return res.status(500).json({
        success: false,
        message: 'Swagger文档初始化失败'
      });
    }

    // 简单的文档验证
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // 检查基本结构
    if (!swaggerSpec.info) {
      validationResult.errors.push('缺少info字段');
      validationResult.isValid = false;
    }

    if (!swaggerSpec.paths) {
      validationResult.warnings.push('没有定义API路径');
    } else {
      const pathCount = Object.keys(swaggerSpec.paths).length;
      if (pathCount === 0) {
        validationResult.warnings.push('API路径数量为0');
      }
    }

    // 检查安全配置
    if (!swaggerSpec.components || !swaggerSpec.components.securitySchemes) {
      validationResult.warnings.push('没有配置安全方案');
    }

    // 检查组件定义
    if (!swaggerSpec.components || !swaggerSpec.components.schemas) {
      validationResult.warnings.push('没有定义数据模型');
    }

    return res.json({
      success: true,
      data: {
        validation: validationResult,
        swaggerSpec: {
          info: swaggerSpec.info,
          pathCount: swaggerSpec.paths ? Object.keys(swaggerSpec.paths).length : 0,
          componentCount: swaggerSpec.components ? Object.keys(swaggerSpec.components).length : 0
        }
      }
    });
  } catch (error) {
    logger.error('文档验证路由错误:', error);
    return res.status(500).json({
      success: false,
      message: '文档验证失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/docs/download
 * 下载API文档（支持格式选择）
 */
router.get('/download', authenticateJWT, responseWrapper(async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    if (!['json', 'yaml'].includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: '不支持的格式',
        error: '仅支持json和yaml格式'
      });
    }

    const swaggerSpec = initSwagger();
    if (!swaggerSpec) {
      return res.status(500).json({
        success: false,
        message: 'Swagger文档初始化失败'
      });
    }

    let content, contentType, filename;

    if (format.toLowerCase() === 'json') {
      content = JSON.stringify(swaggerSpec, null, 2);
      contentType = 'application/json';
      filename = 'api-documentation.json';
    } else {
      const yaml = require('yaml');
      content = yaml.stringify(swaggerSpec);
      contentType = 'application/x-yaml';
      filename = 'api-documentation.yaml';
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(content);

    logger.info('API文档下载', {
      userId: req.user.id,
      format: format.toLowerCase(),
      filename: filename
    });
  } catch (error) {
    logger.error('文档下载路由错误:', error);
    return res.status(500).json({
      success: false,
      message: '文档下载失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/docs/endpoints
 * 获取所有API端点列表
 */
router.get('/endpoints', authenticateJWT, responseWrapper(async (req, res) => {
  try {
    const swaggerSpec = initSwagger();
    if (!swaggerSpec) {
      return res.status(500).json({
        success: false,
        message: 'Swagger文档初始化失败'
      });
    }

    const endpoints = [];
    
    if (swaggerSpec.paths) {
      Object.entries(swaggerSpec.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, details]) => {
          if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
            endpoints.push({
              path,
              method: method.toUpperCase(),
              summary: details.summary || 'No summary',
              description: details.description || '',
              tags: details.tags || ['Untagged'],
              parameters: details.parameters || [],
              responses: details.responses ? Object.keys(details.responses) : [],
              security: details.security || []
            });
          }
        });
      });
    }

    // 按标签分组
    const endpointsByTag = {};
    endpoints.forEach(endpoint => {
      endpoint.tags.forEach(tag => {
        if (!endpointsByTag[tag]) {
          endpointsByTag[tag] = [];
        }
        endpointsByTag[tag].push(endpoint);
      });
    });

    return res.json({
      success: true,
      data: {
        endpoints,
        endpointsByTag,
        totalEndpoints: endpoints.length,
        totalPaths: Object.keys(swaggerSpec.paths || {}).length
      }
    });
  } catch (error) {
    logger.error('端点列表路由错误:', error);
    return res.status(500).json({
      success: false,
      message: '端点列表获取失败',
      error: error.message
    });
  }
}));

module.exports = router;