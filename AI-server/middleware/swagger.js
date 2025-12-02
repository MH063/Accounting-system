/**
 * Swagger文档中间件
 * 集成Swagger UI到Express应用
 */

const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const { initSwagger, createDocsDirectory } = require('../config/swagger');
const logger = require('../config/logger');

/**
 * Swagger中间件配置选项
 */
const swaggerMiddlewareOptions = {
  customCss: `
    .swagger-ui .topbar { 
      display: none; 
    }
    .swagger-ui .info {
      margin: 20px 0;
    }
    .swagger-ui .scheme-container {
      background: #f7f7f7;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
    }
    .swagger-ui .auth-container {
      background: #f7f7f7;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
    }
    .swagger-ui .opblock-tag {
      border-bottom: 1px solid #d3dce6;
      font-weight: bold;
      font-size: 16px;
      color: #3b4151;
    }
    .swagger-ui .opblock.opblock-post {
      border-color: #49cc90;
      background: rgba(73, 204, 144, 0.1);
    }
    .swagger-ui .opblock.opblock-get {
      border-color: #61affe;
      background: rgba(97, 175, 254, 0.1);
    }
    .swagger-ui .opblock.opblock-put {
      border-color: #fca130;
      background: rgba(252, 161, 48, 0.1);
    }
    .swagger-ui .opblock.opblock-delete {
      border-color: #f93e3e;
      background: rgba(249, 62, 62, 0.1);
    }
  `,
  customSiteTitle: '会计系统 API 文档',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    syntaxHighlight: {
      activate: true,
      theme: 'monokai'
    },
    operationsSorter: 'alpha',
    tagsSorter: 'alpha',
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 3
  },
  customfavIcon: '/favicon.ico',
  url: '/api/docs/json', // 默认JSON文档路径
  explorer: true
};

/**
 * 初始化Swagger中间件
 */
function initSwaggerMiddleware(app) {
  try {
    // 创建文档目录
    createDocsDirectory().catch(error => {
      logger.warn('文档目录创建失败:', error.message);
    });

    // 获取Swagger规范
    const swaggerSpec = initSwagger();
    if (!swaggerSpec) {
      logger.warn('Swagger规范初始化失败，跳过Swagger中间件');
      return;
    }

    // 不再直接注册Swagger UI，让路由文件处理
    // app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerMiddlewareOptions));
    
    // 为根路径创建重定向到文档
    app.get('/docs', (req, res) => {
      res.redirect('/api/docs');
    });

    logger.info('✅ Swagger文档中间件初始化成功');
    logger.info('📖 API文档访问地址: http://localhost:4000/api/docs');
    
    return swaggerSpec;
  } catch (error) {
    logger.error('Swagger中间件初始化失败:', error);
    return null;
  }
}

/**
 * 验证Swagger规范的完整性
 */
function validateSwaggerSpec(swaggerSpec) {
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
    } else {
      logger.info(`📋 检测到 ${pathCount} 个API路径`);
    }
  }

  // 检查安全配置
  if (!swaggerSpec.components || !swaggerSpec.components.securitySchemes) {
    validationResult.warnings.push('没有配置安全方案');
  } else {
    logger.info('🔐 检测到安全方案配置');
  }

  // 检查组件定义
  if (!swaggerSpec.components || !swaggerSpec.components.schemas) {
    validationResult.warnings.push('没有定义数据模型');
  } else {
    const schemaCount = Object.keys(swaggerSpec.components.schemas).length;
    logger.info(`📊 检测到 ${schemaCount} 个数据模型`);
  }

  return validationResult;
}

/**
 * 生成API端点统计
 */
function generateEndpointStatistics(swaggerSpec) {
  if (!swaggerSpec.paths) {
    return {
      totalPaths: 0,
      totalOperations: 0,
      operationsByMethod: {},
      operationsByTag: {}
    };
  }

  const stats = {
    totalPaths: Object.keys(swaggerSpec.paths).length,
    totalOperations: 0,
    operationsByMethod: {},
    operationsByTag: {}
  };

  const methodCounts = {
    get: 0,
    post: 0,
    put: 0,
    delete: 0,
    patch: 0,
    options: 0,
    head: 0
  };

  Object.values(swaggerSpec.paths).forEach(path => {
    Object.keys(path).forEach(method => {
      if (methodCounts.hasOwnProperty(method)) {
        methodCounts[method]++;
        stats.totalOperations++;

        // 按标签统计
        const operation = path[method];
        if (operation.tags) {
          operation.tags.forEach(tag => {
            if (!stats.operationsByTag[tag]) {
              stats.operationsByTag[tag] = { count: 0, methods: {} };
            }
            stats.operationsByTag[tag].count++;
            if (!stats.operationsByTag[tag].methods[method]) {
              stats.operationsByTag[tag].methods[method] = 0;
            }
            stats.operationsByTag[tag].methods[method]++;
          });
        }
      }
    });
  });

  stats.operationsByMethod = methodCounts;

  return stats;
}

/**
 * 动态生成API路径文档
 */
function generateAPIPaths() {
  const paths = {
    // 认证相关API
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: '用户登录',
        description: '使用用户名/邮箱和密码进行登录，返回JWT令牌',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', description: '用户名或邮箱' },
                  password: { type: 'string', description: '密码' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '登录成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '400': { $ref: '#/components/responses/BadRequest' }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: '用户登出',
        description: '使当前JWT令牌失效',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '登出成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: '刷新令牌',
        description: '使用刷新令牌获取新的访问令牌',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', description: '刷新令牌' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '令牌刷新成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string' },
                        refreshToken: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },

    // 数据库相关API
    '/api/db/tables': {
      get: {
        tags: ['Database'],
        summary: '获取数据库表列表',
        description: '返回当前数据库中的所有表',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '成功获取表列表',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        tables: { type: 'array', items: { type: 'string' } },
                        count: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '503': {
            description: '数据库服务不可用'
          }
        }
      }
    },

    // 健康检查API
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: '系统健康检查',
        description: '检查系统各组件的健康状态',
        responses: {
          '200': {
            description: '系统健康',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        timestamp: { type: 'string', format: 'date-time' },
                        services: {
                          type: 'object',
                          additionalProperties: { type: 'string' }
                        },
                        uptime: { type: 'number' },
                        memory: {
                          type: 'object',
                          properties: {
                            used: { type: 'number' },
                            total: { type: 'number' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // 缓存管理API
    '/api/cache/stats': {
      get: {
        tags: ['Cache'],
        summary: '获取缓存统计',
        description: '获取多级缓存系统的统计信息',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '成功获取缓存统计',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        l1Cache: { $ref: '#/components/schemas/CacheStats' },
                        l2Cache: { $ref: '#/components/schemas/CacheStats' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  return paths;
}

module.exports = {
  initSwaggerMiddleware,
  validateSwaggerSpec,
  generateEndpointStatistics,
  generateAPIPaths,
  swaggerMiddlewareOptions
};