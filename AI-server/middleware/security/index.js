/**
 * 安全中间件索引文件
 * 导出所有安全相关的中间件
 */

const ipWhitelist = require('./ipWhitelist');
const securityHeaders = require('./securityHeaders');
const sqlInjectionProtection = require('./sqlInjectionProtection');
const xssProtectionModule = require('./xssProtection');
const csrfProtection = require('./csrfProtection');
const requestSizeLimit = require('./requestSizeLimit');
const strictRateLimit = require('./strictRateLimit');
const { securityAuditMiddleware } = require('./auditLogger');

module.exports = {
  ipWhitelist,
  securityHeaders,
  sqlInjectionProtection,
  xssProtection: xssProtectionModule.xssProtection, // 从对象中提取中间件函数
  csrfProtection,
  requestSizeLimit,
  strictRateLimit,
  securityAuditMiddleware,
  // 导出常量以防其他模块需要
  DANGEROUS_TAGS: xssProtectionModule.DANGEROUS_TAGS,
  DANGEROUS_ATTRS: xssProtectionModule.DANGEROUS_ATTRS,
  JAVASCRIPT_PROTOCOLS: xssProtectionModule.JAVASCRIPT_PROTOCOLS
};