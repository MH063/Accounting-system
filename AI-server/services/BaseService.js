/**
 * 服务层基类
 * 提供通用的业务逻辑处理和事务管理
 */

const logger = require('../config/logger');

class BaseService {
  constructor(repository) {
    this.repository = repository;
    this.logger = logger;
  }

  /**
   * 获取所有记录
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 记录列表和分页信息
   */
  async getAll(options = {}) {
    try {
      this.logger.info(`[${this.constructor.name}] 获取所有记录`, { options });
      
      const result = await this.repository.findAll(options);
      
      this.logger.info(`[${this.constructor.name}] 获取记录成功`, { 
        count: result.data?.length || 0,
        pagination: result.pagination 
      });
      
      return result;
    } catch (error) {
      this.logger.error(`[${this.constructor.name}] 获取所有记录失败`, { 
        error: error.message,
        options 
      });
      throw error;
    }
  }

  /**
   * 根据ID获取记录
   * @param {number|string} id - 记录ID
   * @returns {Promise<Object|null>} 记录数据
   */
  async getById(id) {
    try {
      this.logger.info(`[${this.constructor.name}] 根据ID获取记录`, { id });
      
      const record = await this.repository.findById(id);
      
      if (!record) {
        this.logger.warn(`[${this.constructor.name}] 记录不存在`, { id });
        return null;
      }
      
      this.logger.info(`[${this.constructor.name}] 获取记录成功`, { id });
      return record;
    } catch (error) {
      this.logger.error(`[${this.constructor.name}] 根据ID获取记录失败`, { 
        error: error.message,
        id 
      });
      throw error;
    }
  }

  /**
   * 创建新记录
   * @param {Object} data - 创建数据
   * @returns {Promise<Object>} 创建的记录
   */
  async create(data) {
    try {
      this.logger.info(`[${this.constructor.name}] 创建新记录`, { data: this.sanitizeLogData(data) });
      
      // 验证数据
      const validation = await this.validateData(data);
      if (!validation.isValid) {
        this.logger.warn(`[${this.constructor.name}] 数据验证失败`, { 
          errors: validation.errors 
        });
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
      }
      
      const record = await this.repository.create(data);
      
      this.logger.info(`[${this.constructor.name}] 创建记录成功`, { 
        id: record.id,
        record: this.sanitizeLogData(record) 
      });
      
      return record;
    } catch (error) {
      this.logger.error(`[${this.constructor.name}] 创建记录失败`, { 
        error: error.message,
        data: this.sanitizeLogData(data) 
      });
      throw error;
    }
  }

  /**
   * 更新记录
   * @param {number|string} id - 记录ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object|null>} 更新的记录
   */
  async update(id, data) {
    try {
      this.logger.info(`[${this.constructor.name}] 更新记录`, { 
        id,
        data: this.sanitizeLogData(data) 
      });
      
      // 检查记录是否存在
      const existing = await this.repository.findById(id);
      if (!existing) {
        this.logger.warn(`[${this.constructor.name}] 更新失败: 记录不存在`, { id });
        return null;
      }
      
      // 验证更新数据
      const validation = await this.validateUpdateData(data, existing);
      if (!validation.isValid) {
        this.logger.warn(`[${this.constructor.name}] 更新数据验证失败`, { 
          id,
          errors: validation.errors 
        });
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
      }
      
      const record = await this.repository.update(id, data);
      
      this.logger.info(`[${this.constructor.name}] 更新记录成功`, { 
        id,
        record: this.sanitizeLogData(record) 
      });
      
      return record;
    } catch (error) {
      this.logger.error(`[${this.constructor.name}] 更新记录失败`, { 
        error: error.message,
        id,
        data: this.sanitizeLogData(data) 
      });
      throw error;
    }
  }

  /**
   * 删除记录
   * @param {number|string} id - 记录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    try {
      this.logger.info(`[${this.constructor.name}] 删除记录`, { id });
      
      // 检查记录是否存在
      const existing = await this.repository.findById(id);
      if (!existing) {
        this.logger.warn(`[${this.constructor.name}] 删除失败: 记录不存在`, { id });
        return false;
      }
      
      // 执行删除前的业务逻辑
      await this.beforeDelete(id, existing);
      
      const success = await this.repository.delete(id);
      
      if (success) {
        this.logger.info(`[${this.constructor.name}] 删除记录成功`, { id });
        // 执行删除后的业务逻辑
        await this.afterDelete(id, existing);
      }
      
      return success;
    } catch (error) {
      this.logger.error(`[${this.constructor.name}] 删除记录失败`, { 
        error: error.message,
        id 
      });
      throw error;
    }
  }

  /**
   * 批量删除记录
   * @param {Array<number|string>} ids - 记录ID数组
   * @returns {Promise<Object>} 删除结果
   */
  async batchDelete(ids) {
    try {
      this.logger.info(`[${this.constructor.name}] 批量删除记录`, { 
        count: ids.length,
        ids 
      });
      
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      for (const id of ids) {
        try {
          const success = await this.delete(id);
          if (success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push({ id, error: '记录不存在' });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({ id, error: error.message });
        }
      }
      
      this.logger.info(`[${this.constructor.name}] 批量删除完成`, { results });
      return results;
    } catch (error) {
      this.logger.error(`[${this.constructor.name}] 批量删除失败`, { 
        error: error.message,
        ids 
      });
      throw error;
    }
  }

  /**
   * 验证创建数据
   * @param {Object} data - 待验证的数据
   * @returns {Promise<Object>} 验证结果
   */
  async validateData(data) {
    return {
      isValid: true,
      errors: []
    };
  }

  /**
   * 验证更新数据
   * @param {Object} data - 待验证的数据
   * @param {Object} existing - 现有记录
   * @returns {Promise<Object>} 验证结果
   */
  async validateUpdateData(data, existing) {
    return {
      isValid: true,
      errors: []
    };
  }

  /**
   * 删除前的业务逻辑
   * @param {number|string} id - 记录ID
   * @param {Object} existing - 现有记录
   */
  async beforeDelete(id, existing) {
    // 子类可以重写此方法
  }

  /**
   * 删除后的业务逻辑
   * @param {number|string} id - 记录ID
   * @param {Object} existing - 现有记录
   */
  async afterDelete(id, existing) {
    // 子类可以重写此方法
  }

  /**
   * 清理日志数据（移除敏感信息）
   * @param {Object} data - 原始数据
   * @returns {Object} 清理后的数据
   */
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    
    // 移除敏感字段
    const sensitiveFields = [
      'password', 'password_hash', 'passwordHash', 'pwd',
      'token', 'access_token', 'refresh_token',
      'secret', 'private_key', 'api_key', 'apiKey'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field] !== undefined) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * 执行事务操作
   * @param {Function} callback - 事务回调函数
   * @returns {Promise<any>} 事务结果
   */
  async transaction(callback) {
    const client = await this.repository.getClient();
    
    try {
      await client.query('BEGIN');
      this.logger.info(`[${this.constructor.name}] 开始事务`);
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      this.logger.info(`[${this.constructor.name}] 事务提交成功`);
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[${this.constructor.name}] 事务回滚`, { 
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取统计信息
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>} 统计结果
   */
  async getStatistics(options = {}) {
    try {
      this.logger.info(`[${this.constructor.name}] 获取统计信息`, { options });
      
      // 默认实现，子类可以重写
      const total = await this.repository.count();
      
      return {
        total,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`[${this.constructor.name}] 获取统计信息失败`, { 
        error: error.message,
        options 
      });
      throw error;
    }
  }

  /**
   * 导出数据
   * @param {Object} options - 导出选项
   * @returns {Promise<Object>} 导出结果
   */
  async exportData(options = {}) {
    try {
      this.logger.info(`[${this.constructor.name}] 导出数据`, { options });
      
      const { format = 'json', filters = {} } = options;
      
      // 获取所有数据
      const result = await this.getAll({ 
        limit: 10000, // 限制导出数量
        ...filters 
      });
      
      const data = result.data;
      
      this.logger.info(`[${this.constructor.name}] 数据导出成功`, { 
        count: data.length,
        format 
      });
      
      return {
        data,
        count: data.length,
        format,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`[${this.constructor.name}] 导出数据失败`, { 
        error: error.message,
        options 
      });
      throw error;
    }
  }

  /**
   * 导入数据
   * @param {Array} data - 要导入的数据
   * @param {Object} options - 导入选项
   * @returns {Promise<Object>} 导入结果
   */
  async importData(data, options = {}) {
    try {
      this.logger.info(`[${this.constructor.name}] 导入数据`, { 
        count: data.length,
        options 
      });
      
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      // 使用事务处理导入
      await this.transaction(async (client) => {
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          
          try {
            // 验证数据
            const validation = await this.validateData(item);
            if (!validation.isValid) {
              results.failed++;
              results.errors.push({
                index: i,
                data: this.sanitizeLogData(item),
                errors: validation.errors
              });
              continue;
            }
            
            // 创建记录
            await this.repository.create(item);
            results.success++;
            
          } catch (error) {
            results.failed++;
            results.errors.push({
              index: i,
              data: this.sanitizeLogData(item),
              error: error.message
            });
          }
        }
      });
      
      this.logger.info(`[${this.constructor.name}] 数据导入完成`, { results });
      return results;
      
    } catch (error) {
      this.logger.error(`[${this.constructor.name}] 导入数据失败`, { 
        error: error.message,
        count: data.length 
      });
      throw error;
    }
  }
}

module.exports = BaseService;