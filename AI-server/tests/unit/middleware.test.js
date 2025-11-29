/**
 * 中间件单元测试
 * 测试所有中间件的功能和错误处理
 */

const { errorHandler, notFound, asyncHandler, withRetry, healthCheckHandler } = require('../../middleware/errorHandler');
const { authenticateToken } = require('../../middleware/auth');
const { validateFileUpload } = require('../../middleware/upload');
const { validateRequest } = require('../../middleware/validation');
const logger = require('../../utils/logger');

describe('中间件测试', () => {
  describe('错误处理中间件测试', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {},
        params: {},
        query: {},
        files: []
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('notFound 中间件应该返回 404 错误', () => {
      notFound(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '请求的资源不存在'
        },
        timestamp: expect.any(String)
      });
    });

    test('errorHandler 中间件应该处理验证错误', () => {
      const validationError = new Error('验证失败');
      validationError.name = 'ValidationError';

      errorHandler(validationError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '验证失败',
          details: expect.any(String)
        },
        timestamp: expect.any(String)
      });
    });

    test('errorHandler 中间件应该处理数据库错误', () => {
      const dbError = new Error('数据库连接失败');
      dbError.code = 'ECONNREFUSED';

      errorHandler(dbError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '数据库连接失败',
          isRecoverable: true
        },
        timestamp: expect.any(String)
      });
    });

    test('asyncHandler 应该包装异步函数', async () => {
      const asyncFn = asyncHandler(async (req, res, next) => {
        return 'success';
      });

      const result = await asyncFn(req, res, next);
      expect(result).toBe('success');
    });

    test('asyncHandler 应该处理异步错误', async () => {
      const asyncFn = asyncHandler(async () => {
        throw new Error('异步错误');
      });

      await asyncFn(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('withRetry 装饰器应该实现重试机制', async () => {
      let callCount = 0;
      const failingFunction = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('临时错误');
        }
        return '成功';
      };

      const wrappedFunction = withRetry(failingFunction, { 
        maxRetries: 3, 
        delay: 100 
      });

      const result = await wrappedFunction();
      expect(result).toBe('成功');
      expect(callCount).toBe(3);
    });

    test('healthCheckHandler 应该返回健康状态', () => {
      req.app = {
        get: jest.fn((name) => name === 'env' ? 'test' : '4001')
      };

      healthCheckHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        timestamp: expect.any(String),
        status: 'healthy',
        checks: {
          database: { status: 'healthy' },
          memory: { status: 'healthy' },
          storage: { status: 'healthy' }
        }
      });
    });
  });

  describe('认证中间件测试', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {},
        body: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('应该拒绝无效的 JWT token', () => {
      req.headers.authorization = 'Bearer invalid_token';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '访问令牌无效'
        }
      });
    });

    test('应该拒绝缺失的 Authorization header', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: '缺少访问令牌'
        }
      });
    });
  });

  describe('文件上传验证中间件测试', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        files: [],
        body: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('应该拒绝超大文件', () => {
      req.files = [{
        size: 6 * 1024 * 1024, // 6MB 文件
        mimetype: 'image/jpeg',
        originalname: 'test.jpg'
      }];

      validateFileUpload(req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: '文件大小超过限制 (最大 5MB)'
        }
      });
    });

    test('应该拒绝不支持的文件类型', () => {
      req.files = [{
        size: 1024, // 1KB 文件
        mimetype: 'text/plain', // 不支持的类型
        originalname: 'test.txt'
      }];

      validateFileUpload(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: '不支持的文件类型，仅允许 JPEG、PNG、GIF'
        }
      });
    });

    test('应该接受有效文件', () => {
      req.files = [{
        size: 1024, // 1KB 文件
        mimetype: 'image/jpeg',
        originalname: 'test.jpg'
      }];

      validateFileUpload(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});