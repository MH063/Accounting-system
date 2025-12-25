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
    
    .swagger-ui {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    
    .swagger-ui .info {
      margin: 30px 0;
      padding: 25px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .swagger-ui .info .title {
      color: white !important;
      font-size: 28px !important;
      font-weight: 700 !important;
      margin-bottom: 10px;
    }
    
    .swagger-ui .info .description {
      color: rgba(255, 255, 255, 0.9) !important;
      font-size: 14px !important;
      line-height: 1.8;
    }
    
    .swagger-ui .info .description p {
      color: rgba(255, 255, 255, 0.9) !important;
    }
    
    .swagger-ui .scheme-container {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .swagger-ui .auth-container {
      background: linear-gradient(135deg, #fff9f0 0%, #ffe4c4 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
      border-left: 4px solid #f39c12;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .swagger-ui .opblock-tag {
      border-bottom: 2px solid linear-gradient(90deg, #667eea, #764ba2);
      font-weight: 700;
      font-size: 18px;
      color: #3b4151;
      padding: 15px 20px;
      background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%);
      border-radius: 8px 8px 0 0;
      margin-top: 20px;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .opblock-tag:hover {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .swagger-ui .opblock.opblock-post {
      border-color: #49cc90;
      background: rgba(73, 204, 144, 0.1);
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(73, 204, 144, 0.2);
      margin: 15px 0;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .opblock.opblock-post:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(73, 204, 144, 0.3);
    }
    
    .swagger-ui .opblock.opblock-get {
      border-color: #61affe;
      background: rgba(97, 175, 254, 0.1);
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(97, 175, 254, 0.2);
      margin: 15px 0;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .opblock.opblock-get:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(97, 175, 254, 0.3);
    }
    
    .swagger-ui .opblock.opblock-put {
      border-color: #fca130;
      background: rgba(252, 161, 48, 0.1);
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(252, 161, 48, 0.2);
      margin: 15px 0;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .opblock.opblock-put:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(252, 161, 48, 0.3);
    }
    
    .swagger-ui .opblock.opblock-delete {
      border-color: #f93e3e;
      background: rgba(249, 62, 62, 0.1);
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(249, 62, 62, 0.2);
      margin: 15px 0;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .opblock.opblock-delete:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 62, 62, 0.3);
    }
    
    .swagger-ui .opblock.opblock-patch {
      border-color: #50e3c2;
      background: rgba(80, 227, 194, 0.1);
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(80, 227, 194, 0.2);
      margin: 15px 0;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .opblock.opblock-patch:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(80, 227, 194, 0.3);
    }
    
    .swagger-ui .opblock .opblock-summary {
      padding: 15px 20px;
    }
    
    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 8px;
      font-weight: 600;
      min-width: 70px;
      text-align: center;
      padding: 6px 12px;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    
    .swagger-ui .opblock .opblock-summary-path {
      font-weight: 600;
      color: #3b4151;
    }
    
    .swagger-ui .opblock .opblock-summary-description {
      color: #6b6b6b;
    }
    
    .swagger-ui .tab {
      background: transparent;
      border: none;
      padding: 10px 20px;
      font-weight: 600;
      color: #666;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .tab li.active a {
      color: #667eea;
      border-bottom: 2px solid #667eea;
    }
    
    .swagger-ui .tab li a {
      color: #666;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .tab li a:hover {
      color: #667eea;
    }
    
    .swagger-ui .parameters-col_description input {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      padding: 10px 15px;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .parameters-col_description input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
      outline: none;
    }
    
    .swagger-ui .btn {
      border-radius: 8px;
      font-weight: 600;
      padding: 10px 20px;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .btn.execute {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .swagger-ui .btn.execute:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    
    .swagger-ui .btnAuthorize {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      border: none;
      border-radius: 8px;
      color: white;
      box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
    }
    
    .swagger-ui .btnAuthorize:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 87, 108, 0.5);
    }
    
    .swagger-ui .response-col_status {
      font-weight: 600;
      font-size: 14px;
    }
    
    .swagger-ui .response-col_description {
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin: 10px 0;
    }
    
    .swagger-ui .model-box {
      border-radius: 12px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 15px;
      margin: 10px 0;
    }
    
    .swagger-ui .model-title {
      color: #495057;
      font-weight: 600;
    }
    
    .swagger-ui .prop-type {
      color: #667eea;
    }
    
    .swagger-ui .prop-name {
      color: #49cc90;
      font-weight: 600;
    }
    
    .swagger-ui .response-controls {
      padding: 10px;
    }
    
    .swagger-ui .response-control-title {
      color: #6b6b6b;
      font-weight: 600;
    }
    
    .swagger-ui .curl-command {
      background: #1e1e1e;
      border-radius: 12px;
      padding: 15px;
      margin: 10px 0;
    }
    
    .swagger-ui .curl-command code {
      color: #9cdcfe;
      font-family: 'Consolas', 'Monaco', monospace;
    }
    
    .swagger-ui .scheme-wrapper {
      padding: 20px;
    }
    
    .swagger-ui .loading-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 30px;
      color: white;
    }
    
    .swagger-ui .loading-container .loading:after {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .swagger-ui .filter {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      padding: 10px 15px;
      width: 300px;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .filter:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
      outline: none;
    }
    
    .swagger-ui .info .contact {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .swagger-ui .info .contact a {
      color: #ffd700;
      text-decoration: none;
    }
    
    .swagger-ui .info .contact a:hover {
      text-decoration: underline;
    }
    
    .swagger-ui .info .license {
      margin-top: 10px;
    }
    
    .swagger-ui .info .license a {
      color: #ffd700;
      text-decoration: none;
    }
    
    .swagger-ui .info .license a:hover {
      text-decoration: underline;
    }
    
    .swagger-ui select {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      padding: 8px 15px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .swagger-ui select:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
      outline: none;
    }
    
    .swagger-ui textarea {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      padding: 10px 15px;
      font-family: 'Consolas', 'Monaco', monospace;
      transition: all 0.3s ease;
    }
    
    .swagger-ui textarea:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
      outline: none;
    }
    
    .swagger-ui .highlight-code {
      border-radius: 8px;
      background: #1e1e1e;
      padding: 15px;
    }
    
    .swagger-ui .highlight-code .token.comment {
      color: #6a9955;
    }
    
    .swagger-ui .highlight-code .token.keyword {
      color: #569cd6;
    }
    
    .swagger-ui .highlight-code .token.string {
      color: #ce9178;
    }
    
    .swagger-ui .highlight-code .token.number {
      color: #b5cea8;
    }
    
    .swagger-ui .server-list {
      margin: 20px 0;
    }
    
    .swagger-ui .server-list .server-item {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      padding: 15px 20px;
      margin: 10px 0;
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
    }
    
    .swagger-ui .server-list .server-item:hover {
      transform: translateX(5px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .swagger-ui .server-list .server-item .server-title {
      font-weight: 600;
      color: #3b4151;
    }
    
    .swagger-ui .server-list .server-item .server-description {
      color: #6b6b6b;
      font-size: 13px;
    }
    
    .swagger-ui .security-definition {
      background: linear-gradient(135deg, #fff9f0 0%, #ffe4c4 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 15px 0;
      border-left: 4px solid #f39c12;
    }
    
    .swagger-ui .security-definition .security-name {
      font-weight: 600;
      color: #3b4151;
    }
    
    .swagger-ui .security-definition .security-type {
      color: #6b6b6b;
      font-size: 13px;
    }
    
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    }
  `,
  customSiteTitle: '记账宝 API 文档',
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
    defaultModelExpandDepth: 3,
    validatorUrl: null,
    onComplete: function() {
      const script = document.createElement('script');
      script.src = '/api/docs/swagger-zh.js';
      script.async = true;
      document.head.appendChild(script);
    }
  },
  customfavIcon: '/favicon.ico',
  url: '/api/docs/json',
  explorer: true,
  customJs: '/api/docs/swagger-zh.js'
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
    
    '/api/auth/refresh-token': {
      post: {
        tags: ['Authentication'],
        summary: '安全刷新令牌',
        description: '使用刷新令牌获取新的访问令牌和刷新令牌（实现刷新令牌轮换）',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { 
                    type: 'string', 
                    description: '刷新令牌' 
                  }
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
                    success: { 
                      type: 'boolean', 
                      example: true,
                      description: '请求是否成功'
                    },
                    message: { 
                      type: 'string', 
                      example: '令牌刷新成功',
                      description: '响应消息'
                    },
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { 
                          type: 'string',
                          description: '新的访问令牌'
                        },
                        refreshToken: { 
                          type: 'string',
                          description: '新的刷新令牌'
                        },
                        expiresIn: { 
                          type: 'object',
                          properties: {
                            access: { 
                              type: 'string',
                              example: '15m',
                              description: '访问令牌过期时间'
                            },
                            refresh: { 
                              type: 'string',
                              example: '7d',
                              description: '刷新令牌过期时间'
                            }
                          },
                          description: '令牌过期时间配置'
                        },
                        refreshExpiresIn: { 
                          type: 'object',
                          properties: {
                            access: { 
                              type: 'string',
                              example: '15m',
                              description: '访问令牌过期时间'
                            },
                            refresh: { 
                              type: 'string',
                              example: '7d',
                              description: '刷新令牌过期时间'
                            }
                          },
                          description: '刷新令牌过期时间配置'
                        }
                      },
                      description: "/* 业务字段说明 */\n" +
                        "accessToken: \"新的访问令牌，用于API认证\",\n" +
                        "refreshToken: \"新的刷新令牌，用于获取新的访问令牌\",\n" +
                        "expiresIn: {\n" +
                        "  access: \"访问令牌过期时间，例如15分钟\",\n" +
                        "  refresh: \"刷新令牌过期时间，例如7天\"\n" +
                        "},\n" +
                        "refreshExpiresIn: {\n" +
                        "  access: \"访问令牌过期时间，例如15分钟\",\n" +
                        "  refresh: \"刷新令牌过期时间，例如7天\"\n" +
                        "}"
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: '请求参数错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { 
                      type: 'boolean', 
                      example: false,
                      description: '请求是否成功'
                    },
                    message: { 
                      type: 'string', 
                      example: '刷新令牌不能为空',
                      description: '错误消息'
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: '认证失败',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { 
                      type: 'boolean', 
                      example: false,
                      description: '请求是否成功'
                    },
                    message: { 
                      type: 'string', 
                      example: '无效的刷新令牌或会话已过期',
                      description: '错误消息'
                    }
                  }
                }
              }
            }
          }
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