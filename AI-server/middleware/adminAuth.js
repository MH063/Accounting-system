/**
 * 管理员权限认证中间件
 * 用于验证用户是否为系统管理员
 */

const logger = require('../config/logger');

/**
 * 验证用户是否为管理员
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      logger.warn('[AdminAuth] 未认证用户尝试访问管理员接口', {
        url: req.originalUrl,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const user = req.user;
    const isAdmin = user.isAdmin === true || 
                    user.role === 'admin' || 
                    user.role === 'system_admin' ||
                    (Array.isArray(user.role) && (user.role.includes('admin') || user.role.includes('system_admin')));

    if (!isAdmin) {
      logger.warn('[AdminAuth] 非管理员用户尝试访问管理员接口', {
        userId: user.id,
        username: user.username,
        role: user.role,
        url: req.originalUrl,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        message: '无权访问管理员接口'
      });
    }

    logger.debug('[AdminAuth] 管理员权限验证通过', {
      userId: user.id,
      username: user.username,
      url: req.originalUrl
    });

    next();
  } catch (error) {
    logger.error('[AdminAuth] 管理员权限验证失败:', error);
    return res.status(500).json({
      success: false,
      message: '权限验证失败'
    });
  }
};

module.exports = {
  requireAdmin
};
