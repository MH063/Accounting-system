import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 角色权限映射
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'system_admin': [
    'manage_users',
    'manage_dormitories',
    'manage_fees',
    'manage_payments',
    'manage_system_config',
    'manage_client_features',
    'manage_new_features',
    'manage_gray_release',
    'view_reports',
    'view_analytics',
    'export_data'
  ],
  'admin': [
    'manage_users',
    'manage_dormitories',
    'manage_fees',
    'manage_payments',
    'manage_client_features',
    'view_reports',
    'view_analytics'
  ],
  'dorm_leader': [
    'manage_dormitories',
    'manage_fees',
    'manage_payments',
    'view_reports'
  ],
  'payer': [
    'manage_payments',
    'view_reports'
  ],
  'user': [
    'view_reports'
  ]
};

// 功能模块权限映射
const FEATURE_PERMISSIONS: Record<string, string[]> = {
  'user_management': ['manage_users'],
  'dormitory_management': ['manage_dormitories'],
  'fee_management': ['manage_fees'],
  'payment_management': ['manage_payments'],
  'system_config': ['manage_system_config'],
  'client_feature_control': ['manage_client_features'],
  'new_feature_release': ['manage_new_features'],
  'gray_release_control': ['manage_gray_release']
};

// 权限控制中间件
export const permissionMiddleware = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 从请求头获取token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: '未提供访问令牌'
        });
      }

      const token = authHeader.substring(7);
      
      // 验证JWT token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      
      // 将用户信息附加到请求对象
      (req as any).user = decoded;
      
      // 检查用户角色是否具有所需权限
      const userRole = decoded.role;
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];
      
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: '权限不足，无法执行此操作'
        });
      }
      
      // 如果需要检查特定功能模块权限
      if (req.params.featureId) {
        // 这里可以根据需要添加更细粒度的权限检查
        // 例如检查用户是否有权访问特定的功能模块
      }
      
      next();
    } catch (error) {
      console.error('权限验证错误:', error);
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
  };
};

// 客户端功能控制权限中间件
export const clientFeaturePermission = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供访问令牌'
      });
    }

    const token = authHeader.substring(7);
    
    // 验证JWT token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // 将用户信息附加到请求对象
    (req as any).user = decoded;
    
    // 检查用户是否具有客户端功能控制权限
    const userRole = decoded.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (!userPermissions.includes('manage_client_features')) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法访问客户端功能控制'
      });
    }
    
    next();
  } catch (error) {
    console.error('客户端功能权限验证错误:', error);
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌'
    });
  }
};

// 新功能发布权限中间件
export const newFeaturePermission = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供访问令牌'
      });
    }

    const token = authHeader.substring(7);
    
    // 验证JWT token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // 将用户信息附加到请求对象
    (req as any).user = decoded;
    
    // 检查用户是否具有新功能发布权限
    const userRole = decoded.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (!userPermissions.includes('manage_new_features')) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法访问新功能发布'
      });
    }
    
    next();
  } catch (error) {
    console.error('新功能发布权限验证错误:', error);
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌'
    });
  }
};

// 灰度发布控制权限中间件
export const grayReleasePermission = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供访问令牌'
      });
    }

    const token = authHeader.substring(7);
    
    // 验证JWT token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // 将用户信息附加到请求对象
    (req as any).user = decoded;
    
    // 检查用户是否具有灰度发布控制权限
    const userRole = decoded.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (!userPermissions.includes('manage_gray_release')) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法访问灰度发布控制'
      });
    }
    
    next();
  } catch (error) {
    console.error('灰度发布权限验证错误:', error);
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌'
    });
  }
};

// 检查用户是否具有特定功能模块的访问权限
export const checkFeatureAccess = (featureName: string, userId: number) => {
  // 这里应该查询数据库检查用户是否有权访问特定功能
  // 为简化起见，这里返回true，实际应用中应实现具体的权限检查逻辑
  
  // 示例实现：
  // 1. 查询用户的白名单设置
  // 2. 检查功能是否对所有用户开放
  // 3. 检查用户的角色权限
  // 4. 检查IP白名单等
  
  return true;
};

// 检查用户是否在白名单中
export const checkUserWhitelist = (featureId: number, userId: number) => {
  // 这里应该查询数据库检查用户是否在功能的白名单中
  // 为简化起见，这里返回true，实际应用中应实现具体的白名单检查逻辑
  
  return true;
};

// 检查IP是否在白名单中
export const checkIPWhitelist = (featureId: number, ipAddress: string) => {
  // 这里应该查询数据库检查IP是否在功能的白名单中
  // 为简化起见，这里返回true，实际应用中应实现具体的IP白名单检查逻辑
  
  return true;
};

export default {
  permissionMiddleware,
  clientFeaturePermission,
  newFeaturePermission,
  grayReleasePermission,
  checkFeatureAccess,
  checkUserWhitelist,
  checkIPWhitelist
};
