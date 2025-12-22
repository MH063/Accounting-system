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
const multiLevelCacheRoutes = require('./multiLevelCache');
const healthRoutes = require('./health');
const virusScanRoutes = require('./virusScan');
const corsManagementRoutes = require('./corsManagement');
const monitorDashboardRoutes = require('./monitorDashboard');
const oauth2Routes = require('./oauth2');
const permissionRoutes = require('./permissions');
const apiDocsRoutes = require('./apiDocs');
const messageQueueRoutes = require('./messageQueue');
const clientFeatureRoutes = require('./clientFeatureRoutes');
const dormRoutes = require('./dorms');
const memberStatsRoutes = require('./memberStats');
const memberActivitiesRoutes = require('./memberActivities');
const membersRoutes = require('./members');
const expenseSummaryRoutes = require('./expenseSummary');
const expenseRoutes = require('./expenses');
const paymentRoutes = require('./payment');
const qrCodesRoutes = require('./qrCodes');

module.exports = {
  authRoutes,
  dbRoutes,
  uploadRoutes,
  dbHealthRoutes,
  logManagementRoutes,
  cacheRoutes,
  enhancedCacheRoutes,
  multiLevelCacheRoutes,
  healthRoutes,
  virusScanRoutes,
  corsManagementRoutes,
  monitorDashboardRoutes,
  oauth2Routes,
  permissionRoutes,
  apiDocsRoutes,
  messageQueueRoutes,
  clientFeatureRoutes,
  dormRoutes,
  memberStatsRoutes,
  memberActivitiesRoutes,
  membersRoutes,
  expenseSummaryRoutes,
  expenseRoutes,
  paymentRoutes,
  qrCodesRoutes
};