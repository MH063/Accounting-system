/**
 * 数据库表配置
 * 包含允许查询的表名白名单
 */

// 允许查询的表名白名单
const ALLOWED_TABLES = [
  'users', 'user_profiles', 'user_settings', 'roles', 'role_permissions',
  'permissions', 'user_roles', 'user_tokens', 'expense_splits', 'third_party_accounts',
  'rooms', 'room_members', 'room_invitations', 'bill_categories', 'bill_statistics',
  'expense_categories', 'expense_limits', 'historical_expense_stats', 'historical_reading_stats',
  'expenses', 'expense_statistics', 'expense_tags', 'payment_transfers', 'qr_codes',
  'qr_payment_records', 'user_payment_preferences', 'invite_codes', 'invite_code_usage',
  'activities', 'activity_participants', 'expense_types', 'special_payment_rules',
  'room_payment_rules', 'user_activity_logs', 'notifications', 'system_configs',
  'feature_flags', 'document_types', 'password_reset_tokens', 'user_activity_statistics',
  'abnormal_expense_stats', 'system_performance_metrics'
  'user_details', 'expense_details'
];

module.exports = {
  ALLOWED_TABLES
};