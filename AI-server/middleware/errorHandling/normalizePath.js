/**
 * 路径规范化中间件
 * 确保所有请求路径都以斜杠结尾，便于路由匹配
 */

const logger = require('../../config/logger');

const normalizePath = () => {
  return (req, res, next) => {
    // 规范化路径：确保以斜杠结尾（除了根路径）
    if (req.path !== '/' && req.path.endsWith('/')) {
      const normalizedPath = req.path.slice(0, -1) || '/';
      logger.debug(`[NORMALIZE] 路径规范化: ${req.path} -> ${normalizedPath}`);
      req.originalPath = req.path;
      req.path = normalizedPath;
    }
    next();
  };
};

module.exports = normalizePath;