/**
 * 逐步测试
 * 用于逐步添加中间件来定位问题
 */

const express = require('express');
const request = require('supertest');
const { responseWrapper } = require('../../middleware/response');

describe('逐步测试', () => {
  test('只添加基本路由应该正常工作', async () => {
    const app = express();
    
    app.get('/', responseWrapper((req, res) => {
      return res.sendSuccess({ message: 'Hello World' }, 'Success');
    }));
    
    const response = await request(app)
      .get('/')
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toBe('Hello World');
  });
  
  test('添加CORS中间件但允许所有来源', async () => {
    const app = express();
    // 直接设置环境变量来允许所有来源
    process.env.ALLOW_ALL_ORIGINS_IN_DEV = 'true';
    process.env.NODE_ENV = 'development';
    
    const { createCorsMiddleware } = require('../../middleware/corsConfig');
    
    app.use(createCorsMiddleware());
    
    app.get('/', responseWrapper((req, res) => {
      return res.sendSuccess({ message: 'Hello World' }, 'Success');
    }));
    
    const response = await request(app)
      .get('/')
      .expect(200);
      
    expect(response.body.success).toBe(true);
  });
});