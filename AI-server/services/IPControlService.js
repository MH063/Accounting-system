/**
 * IP 访问控制服务
 * 处理 IP 黑白名单验证、规则管理及 CIDR 匹配
 */

const { pool } = require('../config/database');
const logger = require('../config/logger');
const systemConfigService = require('./systemConfigService');
const ipaddr = require('ipaddr.js');

class IPControlService {
  /**
   * 验证 IP 是否允许访问
   * @param {string} ip - 客户端 IP 地址
   * @returns {Promise<boolean>} 是否允许访问
   */
  async checkAccess(ip) {
    try {
      const config = await systemConfigService.getSecurityConfigs();
      
      // 如果未启用 IP 控制，则允许所有访问
      if (!config.ipControlEnabled) {
        return true;
      }

      const mode = config.ipControlMode; // 'whitelist' or 'blacklist'
      
      // 获取所有激活的 IP 规则
      const rules = await this.getActiveRules();
      
      if (rules.length === 0) {
        // 如果没有规则，白名单模式拒绝，黑名单模式允许
        return mode === 'blacklist';
      }

      // 检查当前 IP 是否匹配任何规则
      const matched = rules.some(rule => this.matchIP(ip, rule.ip_range));

      if (mode === 'whitelist') {
        // 白名单模式：匹配到则允许，未匹配到则拒绝
        return matched;
      } else {
        // 黑名单模式：匹配到则拒绝，未匹配到则允许
        return !matched;
      }
    } catch (error) {
      logger.error('[IPControlService] 检查 IP 访问失败', { error: error.message, ip });
      // 安全起见，出错时默认允许访问，防止系统锁定（除非是极端安全需求）
      return true;
    }
  }

  /**
   * 获取所有激活的 IP 规则
   */
  async getActiveRules() {
    try {
      const query = `
        SELECT ip_range, control_type, description 
        FROM security_ip_controls 
        WHERE is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('[IPControlService] 获取 IP 规则失败', { error: error.message });
      return [];
    }
  }

  /**
   * 检查 IP 是否匹配范围 (支持单个 IP 和 CIDR)
   * @param {string} ip - 待检查的 IP
   * @param {string} range - 规则中的 IP 范围
   */
  matchIP(ip, range) {
    try {
      // 处理 IPv6 映射的 IPv4
      if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
      }
      // range 可能是 CIDR 对象或字符串，这里处理字符串情况
      let rangeStr = typeof range === 'string' ? range : range.toString();
      if (rangeStr.startsWith('::ffff:')) {
        rangeStr = rangeStr.substring(7);
      }

      // 简单的字符串匹配
      if (ip === rangeStr) return true;

      // CIDR 匹配
      if (rangeStr.includes('/')) {
        const addr = ipaddr.parse(ip);
        const cidr = ipaddr.parseCIDR(rangeStr);
        return addr.match(cidr);
      }

      return false;
    } catch (error) {
      logger.debug('[IPControlService] IP 匹配出错', { ip, range, error: error.message });
      return false;
    }
  }

  /**
   * 添加 IP 规则
   */
  async addRule(ruleData) {
    const { ipRange, controlType, description, expiresAt, createdBy, groupName = 'default' } = ruleData;
    const query = `
      INSERT INTO security_ip_controls 
      (ip_range, control_type, description, expires_at, created_by, group_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [ipRange, controlType, description, expiresAt, createdBy, groupName]);
    return result.rows[0];
  }
}

module.exports = new IPControlService();
