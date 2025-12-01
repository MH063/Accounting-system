/**
 * 基本功能测试
 * 用于验证Express基本功能
 */

const express = require('express');
const request = require('supertest');

describe('基本功能测试', () => {
  test('Express应该能处理基本请求', async () => {
    const app = express();
    
    app.get('/', (req, res) => {
      res.status(200).json({ message: 'Hello World' });
    });
    
    const response = await request(app)
      .get('/')
      .expect(200);
      
    expect(response.body.message).toBe('Hello World');
  });
});