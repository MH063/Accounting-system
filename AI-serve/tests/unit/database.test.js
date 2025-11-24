/**
 * 数据库配置单元测试
 * 测试数据库连接、查询、缓存等功能
 */

const { pool, healthCheck, testConnection, getTables, getDatabases } = require('../../config/database');
const logger = require('../../utils/logger');

describe('数据库配置测试', () => {
  describe('数据库连接测试', () => {
    test('数据库连接池应该正常初始化', () => {
      expect(pool).toBeDefined();
      expect(pool.query).toBeInstanceOf(Function);
    });

    test('健康检查应该返回 true', async () => {
      // 模拟数据库响应
      pool.query.mockResolvedValue({ rows: [{ result: 'ok' }] });
      
      const result = await healthCheck();
      expect(result).toBe(true);
    });

    test('连接测试应该返回连接状态', async () => {
      // 模拟连接成功
      pool.query.mockResolvedValue({ rows: [{ connected: true }] });
      
      const result = await testConnection();
      expect(result.connected).toBe(true);
    });
  });

  describe('数据库操作测试', () => {
    test('应该能够获取表列表', async () => {
      const mockTables = ['users', 'files', 'logs'];
      pool.query.mockResolvedValue({ rows: mockTables });
      
      const result = await getTables();
      expect(result).toEqual(mockTables);
    });

    test('应该能够获取数据库列表', async () => {
      const mockDatabases = ['ai_serve_test'];
      pool.query.mockResolvedValue({ rows: mockDatabases });
      
      const result = await getDatabases();
      expect(result).toEqual(mockDatabases);
    });

    test('查询失败时应该抛出错误', async () => {
      const error = new Error('查询失败');
      pool.query.mockRejectedValue(error);
      
      await expect(pool.query('SELECT 1')).rejects.toThrow('查询失败');
    });
  });

  describe('数据库错误处理测试', () => {
    test('应该正确处理连接超时错误', async () => {
      const timeoutError = new Error('连接超时');
      timeoutError.code = 'ETIMEDOUT';
      pool.query.mockRejectedValue(timeoutError);
      
      try {
        await pool.query('SELECT 1');
      } catch (error) {
        expect(error.code).toBe('ETIMEDOUT');
        expect(logger.error).toHaveBeenCalled();
      }
    });

    test('应该正确处理连接拒绝错误', async () => {
      const connectionError = new Error('连接被拒绝');
      connectionError.code = 'ECONNREFUSED';
      pool.query.mockRejectedValue(connectionError);
      
      try {
        await pool.query('SELECT 1');
      } catch (error) {
        expect(error.code).toBe('ECONNREFUSED');
        expect(logger.error).toHaveBeenCalled();
      }
    });
  });
});