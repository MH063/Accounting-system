import express from 'express';
import { 
  clientFeaturePermission,
  newFeaturePermission,
  grayReleasePermission
} from '../middleware/permissionMiddleware';

const router = express.Router();

// 客户端功能控制相关路由
router.get('/client-features', clientFeaturePermission, (req, res) => {
  // 获取功能模块列表
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: '用户管理',
        icon: 'User',
        description: '管理用户信息、权限分配等',
        enabled: true,
        status: 'normal',
        usageCount: 1256,
        hasRollback: false
      },
      {
        id: 2,
        name: '寝室管理',
        icon: 'House',
        description: '管理寝室分配、入住情况等',
        enabled: true,
        status: 'normal',
        usageCount: 892,
        hasRollback: true
      },
      {
        id: 3,
        name: '费用管理',
        icon: 'Coin',
        description: '管理各类费用的收取、统计等',
        enabled: true,
        status: 'warning',
        usageCount: 2103,
        hasRollback: true
      },
      {
        id: 4,
        name: '支付管理',
        icon: 'CreditCard',
        description: '处理支付流程、对账等',
        enabled: true,
        status: 'normal',
        usageCount: 1756,
        hasRollback: false
      },
      {
        id: 5,
        name: '系统配置',
        icon: 'Tools',
        description: '系统参数设置、基础配置等',
        enabled: true,
        status: 'normal',
        usageCount: 423,
        hasRollback: false
      },
      {
        id: 6,
        name: '客户端功能',
        icon: 'Phone',
        description: '移动端功能控制、版本管理等',
        enabled: true,
        status: 'normal',
        usageCount: 3456,
        hasRollback: true
      },
      {
        id: 7,
        name: '数据监控',
        icon: 'Monitor',
        description: '实时监控系统运行状态',
        enabled: false,
        status: 'error',
        usageCount: 0,
        hasRollback: false
      },
      {
        id: 8,
        name: '行为分析',
        icon: 'TrendCharts',
        description: '分析用户行为模式',
        enabled: true,
        status: 'normal',
        usageCount: 789,
        hasRollback: false
      }
    ]
  });
});

router.get('/client-features/:id', clientFeaturePermission, (req, res) => {
  // 获取功能模块详情
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      name: '用户管理',
      icon: 'User',
      description: '管理用户信息、权限分配等',
      enabled: true,
      status: 'normal',
      usageCount: 1256,
      hasRollback: false,
      createdAt: '2023-01-15T10:30:00Z',
      updatedAt: '2023-10-20T14:45:00Z'
    }
  });
});

router.post('/client-features', clientFeaturePermission, (req, res) => {
  // 创建功能模块
  res.json({
    success: true,
    data: {
      id: 9,
      ...req.body
    }
  });
});

router.put('/client-features/:id', clientFeaturePermission, (req, res) => {
  // 更新功能模块
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      ...req.body
    }
  });
});

router.delete('/client-features/:id', clientFeaturePermission, (req, res) => {
  // 删除功能模块
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id
    }
  });
});

router.delete('/client-features/batch', clientFeaturePermission, (req, res) => {
  // 批量删除功能模块
  res.json({
    success: true,
    data: {
      deletedIds: req.body.ids
    }
  });
});

router.put('/client-features/:id/status', clientFeaturePermission, (req, res) => {
  // 更新功能模块状态
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      status: req.body.status
    }
  });
});

router.get('/client-features/stats', clientFeaturePermission, (req, res) => {
  // 获取功能模块统计信息
  res.json({
    success: true,
    data: {
      enabledCount: 6,
      disabledCount: 2,
      warningCount: 1,
      errorCount: 1,
      totalCount: 8
    }
  });
});

router.get('/client-features/:id/permissions', clientFeaturePermission, (req, res) => {
  // 获取功能模块权限
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      featureId: id,
      allowedRoles: [1, 2],
      whitelistUsers: [101, 102, 103],
      whitelistIPs: ['192.168.1.100', '192.168.1.101']
    }
  });
});

router.put('/client-features/:id/permissions', clientFeaturePermission, (req, res) => {
  // 设置功能模块权限
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      featureId: id,
      ...req.body
    }
  });
});

router.get('/client-features/:id/whitelist-users', clientFeaturePermission, (req, res) => {
  // 获取用户白名单
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: [
      { id: 101, name: '张三', email: 'zhangsan@example.com' },
      { id: 102, name: '李四', email: 'lisi@example.com' },
      { id: 103, name: '王五', email: 'wangwu@example.com' }
    ]
  });
});

router.post('/client-features/:id/whitelist-users', clientFeaturePermission, (req, res) => {
  // 添加用户到白名单
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      featureId: id,
      userId: req.body.userId
    }
  });
});

router.delete('/client-features/:id/whitelist-users/:userId', clientFeaturePermission, (req, res) => {
  // 从白名单移除用户
  const id = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  res.json({
    success: true,
    data: {
      featureId: id,
      userId
    }
  });
});

router.get('/client-features/:id/whitelist-ips', clientFeaturePermission, (req, res) => {
  // 获取IP白名单
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: ['192.168.1.100', '192.168.1.101', '10.0.0.50']
  });
});

router.put('/client-features/:id/whitelist-ips', clientFeaturePermission, (req, res) => {
  // 设置IP白名单
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      featureId: id,
      ips: req.body.ips
    }
  });
});

router.get('/client-features/:id/dependencies', clientFeaturePermission, (req, res) => {
  // 获取功能依赖关系
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      featureId: id,
      dependencies: [1, 2],
      conflicts: [7]
    }
  });
});

router.put('/client-features/:id/dependencies', clientFeaturePermission, (req, res) => {
  // 设置功能依赖关系
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      featureId: id,
      ...req.body
    }
  });
});

router.get('/client-features/:id/toggle-history', clientFeaturePermission, (req, res) => {
  // 获取功能切换历史
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: [
      {
        id: 1,
        featureId: id,
        time: '2023-10-15T14:30:25Z',
        operator: '管理员',
        action: 'enable',
        reason: '新功能上线',
        version: 'v1.2.0'
      },
      {
        id: 2,
        featureId: id,
        time: '2023-10-10T09:15:42Z',
        operator: '系统',
        action: 'disable',
        reason: '功能异常，自动禁用',
        version: 'v1.1.5'
      }
    ]
  });
});

router.get('/client-features/:id/usage-stats', clientFeaturePermission, (req, res) => {
  // 获取功能使用统计
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      featureId: id,
      usageData: [
        { date: '2023-10-15', count: 120 },
        { date: '2023-10-16', count: 132 },
        { date: '2023-10-17', count: 101 },
        { date: '2023-10-18', count: 134 },
        { date: '2023-10-19', count: 90 },
        { date: '2023-10-20', count: 230 },
        { date: '2023-10-21', count: 210 }
      ]
    }
  });
});

// 新功能发布相关路由
router.get('/new-features', newFeaturePermission, (req, res) => {
  // 获取新功能列表
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: '智能推荐系统',
        description: '基于用户行为的智能功能推荐',
        version: 'v2.0.0',
        targetUsers: 'all',
        releaseStrategy: 'gray',
        status: 'published',
        compatibilityCheck: true,
        hotUpdateSupport: true,
        createdAt: '2023-10-01T09:00:00Z'
      },
      {
        id: 2,
        name: '语音助手',
        description: '新增语音交互功能',
        version: 'v1.5.0',
        targetUsers: 'beta',
        releaseStrategy: 'abtest',
        status: 'draft',
        compatibilityCheck: true,
        hotUpdateSupport: false,
        createdAt: '2023-10-10T14:30:00Z'
      }
    ]
  });
});

router.get('/new-features/:id', newFeaturePermission, (req, res) => {
  // 获取新功能详情
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      name: '智能推荐系统',
      description: '基于用户行为的智能功能推荐',
      version: 'v2.0.0',
      targetUsers: 'all',
      releaseStrategy: 'gray',
      status: 'published',
      compatibilityCheck: true,
      hotUpdateSupport: true,
      createdAt: '2023-10-01T09:00:00Z',
      updatedAt: '2023-10-15T16:45:00Z'
    }
  });
});

router.post('/new-features', newFeaturePermission, (req, res) => {
  // 创建新功能
  res.json({
    success: true,
    data: {
      id: 3,
      ...req.body,
      status: 'draft',
      createdAt: new Date().toISOString()
    }
  });
});

router.put('/new-features/:id', newFeaturePermission, (req, res) => {
  // 更新新功能
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      ...req.body,
      updatedAt: new Date().toISOString()
    }
  });
});

router.delete('/new-features/:id', newFeaturePermission, (req, res) => {
  // 删除新功能
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id
    }
  });
});

router.delete('/new-features/batch', newFeaturePermission, (req, res) => {
  // 批量删除新功能
  res.json({
    success: true,
    data: {
      deletedIds: req.body.ids
    }
  });
});

router.post('/new-features/:id/publish', newFeaturePermission, (req, res) => {
  // 发布新功能
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      status: 'published',
      publishedAt: new Date().toISOString()
    }
  });
});

router.post('/new-features/:id/rollback', newFeaturePermission, (req, res) => {
  // 回滚新功能
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      status: 'failed',
      rollbackReason: req.body.reason,
      rolledBackAt: new Date().toISOString()
    }
  });
});

router.get('/new-features/:id/publish-progress', newFeaturePermission, (req, res) => {
  // 获取新功能发布进度
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      progress: 75,
      currentStage: '灰度发布中',
      estimatedCompletion: '2023-10-25T10:00:00Z'
    }
  });
});

router.get('/new-features/stats', newFeaturePermission, (req, res) => {
  // 获取新功能统计信息
  res.json({
    success: true,
    data: {
      draftCount: 1,
      publishedCount: 1,
      pausedCount: 0,
      failedCount: 0,
      totalCount: 2
    }
  });
});

router.post('/new-features/:id/compatibility-check', newFeaturePermission, (req, res) => {
  // 执行兼容性检查
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      compatibilityResult: 'pass',
      checkDetails: '所有兼容性检查通过',
      checkedAt: new Date().toISOString()
    }
  });
});

router.get('/new-features/:id/compatibility-result', newFeaturePermission, (req, res) => {
  // 获取兼容性检查结果
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      compatibilityResult: 'pass',
      checkDetails: '所有兼容性检查通过',
      checkedAt: '2023-10-15T09:30:00Z'
    }
  });
});

// 灰度发布控制相关路由
router.get('/gray-release-strategies', grayReleasePermission, (req, res) => {
  // 获取灰度策略列表
  res.json({
    success: true,
    data: [
      {
        id: 1,
        featureId: 1,
        featureName: '智能推荐系统',
        description: '智能推荐功能的灰度发布策略',
        initialPercentage: 10,
        currentPercentage: 45,
        targetPercentage: 100,
        status: 'running',
        autoScale: true,
        autoRollback: true,
        monitorThreshold: '95%',
        createdAt: '2023-10-01T10:00:00Z'
      }
    ]
  });
});

router.get('/gray-release-strategies/:id', grayReleasePermission, (req, res) => {
  // 获取灰度策略详情
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      featureId: 1,
      featureName: '智能推荐系统',
      description: '智能推荐功能的灰度发布策略',
      initialPercentage: 10,
      currentPercentage: 45,
      targetPercentage: 100,
      status: 'running',
      autoScale: true,
      autoRollback: true,
      monitorThreshold: '95%',
      createdAt: '2023-10-01T10:00:00Z',
      updatedAt: '2023-10-20T15:30:00Z'
    }
  });
});

router.post('/gray-release-strategies', grayReleasePermission, (req, res) => {
  // 创建灰度策略
  res.json({
    success: true,
    data: {
      id: 2,
      ...req.body,
      status: 'draft',
      currentPercentage: req.body.initialPercentage,
      createdAt: new Date().toISOString()
    }
  });
});

router.put('/gray-release-strategies/:id', grayReleasePermission, (req, res) => {
  // 更新灰度策略
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      ...req.body,
      updatedAt: new Date().toISOString()
    }
  });
});

router.delete('/gray-release-strategies/:id', grayReleasePermission, (req, res) => {
  // 删除灰度策略
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id
    }
  });
});

router.delete('/gray-release-strategies/batch', grayReleasePermission, (req, res) => {
  // 批量删除灰度策略
  res.json({
    success: true,
    data: {
      deletedIds: req.body.ids
    }
  });
});

router.post('/gray-release-strategies/:id/start', grayReleasePermission, (req, res) => {
  // 启动灰度策略
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      status: 'running',
      startedAt: new Date().toISOString()
    }
  });
});

router.post('/gray-release-strategies/:id/pause', grayReleasePermission, (req, res) => {
  // 暂停灰度策略
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      status: 'paused',
      pausedAt: new Date().toISOString()
    }
  });
});

router.post('/gray-release-strategies/:id/resume', grayReleasePermission, (req, res) => {
  // 恢复灰度策略
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      status: 'running',
      resumedAt: new Date().toISOString()
    }
  });
});

router.get('/gray-release-strategies/stats', grayReleasePermission, (req, res) => {
  // 获取灰度策略统计信息
  res.json({
    success: true,
    data: {
      draftCount: 0,
      runningCount: 1,
      pausedCount: 0,
      completedCount: 0,
      failedCount: 0,
      totalCount: 1
    }
  });
});

router.post('/gray-release-strategies/:id/adjust-percentage', grayReleasePermission, (req, res) => {
  // 动态调整发布比例
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      currentPercentage: req.body.percentage,
      adjustedAt: new Date().toISOString()
    }
  });
});

router.post('/gray-release-strategies/:id/manual-adjust', grayReleasePermission, (req, res) => {
  // 手动调整发布比例
  const id = parseInt(req.params.id);
  res.json({
    success: true,
    data: {
      id,
      currentPercentage: req.body.percentage,
      manuallyAdjustedAt: new Date().toISOString()
    }
  });
});

export default router;