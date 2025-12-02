/**
 * Swagger API文档配置
 * 自动化生成API文档的配置和生成器
 */

const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const fs = require('fs').promises;

/**
 * Swagger配置选项
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '会计系统 API',
      version: '1.0.0',
      description: `
# 会计系统 API 文档

欢迎使用会计系统API！本系统提供了完整的会计数据管理功能。

## 主要功能
- 用户认证与授权 (JWT, OAuth2.0)
- 数据库管理 (MySQL)
- 文件上传与安全检查
- 多级缓存系统
- 日志管理
- 安全防护机制
- 实时监控
- 审计日志

## 认证方式
本API支持两种认证方式：

### JWT认证
在请求头中添加：
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

### OAuth2.0认证
请参考 \`/api/oauth2\` 相关端点获取访问令牌。

## 响应格式
所有API响应都遵循统一的格式：
\`\`\`json
{
  "success": true|false,
  "message": "响应消息",
  "data": {}|[]|null,
  "error": "错误信息（仅在失败时）"
}
\`\`\`

## 错误代码
- 200: 成功
- 400: 请求参数错误
- 401: 未认证
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误
      `,
      contact: {
        name: 'API支持',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:4000',
        description: '开发环境'
      },
      {
        url: process.env.PRODUCTION_API_URL || 'https://api.yourapp.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: '/api/oauth2/authorize',
              tokenUrl: '/api/oauth2/token',
              scopes: {}
            },
            clientCredentials: {
              tokenUrl: '/api/oauth2/token',
              scopes: {}
            }
          }
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: '错误信息'
            },
            error: {
              type: 'string',
              example: '详细错误信息'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: '操作成功'
            },
            data: {
              type: 'object',
              description: '响应数据'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '用户ID'
            },
            username: {
              type: 'string',
              description: '用户名'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱地址'
            },
            firstName: {
              type: 'string',
              description: '名'
            },
            lastName: {
              type: 'string',
              description: '姓'
            },
            isActive: {
              type: 'boolean',
              description: '是否激活'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: '用户名或邮箱'
            },
            password: {
              type: 'string',
              description: '密码'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: '登录成功'
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT访问令牌'
                },
                refreshToken: {
                  type: 'string',
                  description: '刷新令牌'
                },
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: '未授权访问',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '未授权访问',
                error: 'Invalid or missing authentication token'
              }
            }
          }
        },
        Forbidden: {
          description: '权限不足',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '权限不足',
                error: 'Insufficient permissions to access this resource'
              }
            }
          }
        },
        NotFound: {
          description: '资源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '资源不存在',
                error: 'The requested resource was not found'
              }
            }
          }
        },
        BadRequest: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '请求参数错误',
                error: 'Invalid request parameters'
              }
            }
          }
        },
        InternalServerError: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: '服务器内部错误',
                error: 'Internal server error occurred'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        oauth2: []
      }
    ]
  },
  apis: [
    // 自动扫描路由文件
    path.join(__dirname, '../routes/*.js'),
    // 包含注释的文件
    path.join(__dirname, '../controllers/*.js'),
    // 中间件文件
    path.join(__dirname, '../middleware/*.js')
  ]
};

/**
 * 初始化Swagger文档
 */
function initSwagger() {
  try {
    const swaggerSpec = swaggerJSDoc(swaggerOptions);
    return swaggerSpec;
  } catch (error) {
    console.error('初始化Swagger文档失败:', error.message);
    return null;
  }
}

/**
 * 验证API接口并生成文档
 */
async function validateAndGenerateDocs() {
  try {
    console.log('📝 正在验证API接口并生成文档...');
    
    const swaggerSpec = initSwagger();
    if (!swaggerSpec) {
      throw new Error('Swagger初始化失败');
    }

    // 验证必要字段
    const validation = validateSwaggerSpec(swaggerSpec);
    if (!validation.isValid) {
      console.warn('⚠️ 文档验证警告:', validation.warnings);
    }

    // 保存生成的文档
    const docsPath = path.join(__dirname, '../docs/api-documentation.json');
    await fs.writeFile(docsPath, JSON.stringify(swaggerSpec, null, 2));
    
    console.log('✅ API文档生成成功:', docsPath);
    return swaggerSpec;
  } catch (error) {
    console.error('❌ API文档生成失败:', error.message);
    throw error;
  }
}

/**
 * 验证Swagger规范
 */
function validateSwaggerSpec(spec) {
  const warnings = [];
  
  // 检查基本信息
  if (!spec.info || !spec.info.title) {
    warnings.push('缺少API标题');
  }
  
  if (!spec.info.version) {
    warnings.push('缺少API版本');
  }
  
  // 检查路径
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    warnings.push('没有定义任何API路径');
  } else {
    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, details]) => {
        if (!details.summary) {
          warnings.push(`路径 ${path} 的 ${method.toUpperCase()} 方法缺少摘要`);
        }
        if (!details.responses) {
          warnings.push(`路径 ${path} 的 ${method.toUpperCase()} 方法缺少响应定义`);
        }
      });
    });
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}

/**
 * 生成API统计信息
 */
function generateAPIDocumentationStats(swaggerSpec) {
  const stats = {
    totalPaths: 0,
    totalOperations: 0,
    operationsByMethod: {},
    securitySchemes: 0,
    schemas: 0,
    tags: []
  };

  if (!swaggerSpec.paths) {
    return stats;
  }

  stats.totalPaths = Object.keys(swaggerSpec.paths).length;
  
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
      }
    });
  });

  stats.operationsByMethod = methodCounts;
  
  if (swaggerSpec.components && swaggerSpec.components.securitySchemes) {
    stats.securitySchemes = Object.keys(swaggerSpec.components.securitySchemes).length;
  }
  
  if (swaggerSpec.components && swaggerSpec.components.schemas) {
    stats.schemas = Object.keys(swaggerSpec.components.schemas).length;
  }
  
  // 提取标签信息
  Object.values(swaggerSpec.paths).forEach(path => {
    Object.values(path).forEach(operation => {
      if (operation.tags) {
        operation.tags.forEach(tag => {
          if (!stats.tags.find(t => t.name === tag)) {
            stats.tags.push({ name: tag, count: 1 });
          } else {
            const existingTag = stats.tags.find(t => t.name === tag);
            existingTag.count++;
          }
        });
      }
    });
  });

  return stats;
}

/**
 * 创建文档目录
 */
async function createDocsDirectory() {
  const docsDir = path.join(__dirname, '../docs');
  try {
    await fs.access(docsDir);
  } catch {
    await fs.mkdir(docsDir, { recursive: true });
    console.log('📁 创建文档目录:', docsDir);
  }
}

module.exports = {
  initSwagger,
  validateAndGenerateDocs,
  generateAPIDocumentationStats,
  createDocsDirectory,
  swaggerOptions
};