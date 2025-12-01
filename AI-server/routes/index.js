/**
 * 路由聚合模块
 * 统一导出所有路由，便于在应用中集中管理
 */

const authRoutes = require('./auth');
const dbRoutes = require('./db');
const uploadRoutes = require('./upload');
const dbHealthRoutes = require('./dbHealth');
const logManagementRoutes = require('./logManagement');
const cacheRoutes = require('./cache');
const enhancedCacheRoutes = require('./enhancedCache');
const healthRoutes = require('./health');
const virusScanRoutes = require('./virusScan');
const corsManagementRoutes = require('./corsManagement');
const monitorDashboardRoutes = require('./monitorDashboard');

module.exports = {
  authRoutes,
  dbRoutes,
  uploadRoutes,
  dbHealthRoutes,
  logManagementRoutes,
  cacheRoutes,
  enhancedCacheRoutes,
  healthRoutes,
  virusScanRoutes,
  corsManagementRoutes,
  monitorDashboardRoutes
};