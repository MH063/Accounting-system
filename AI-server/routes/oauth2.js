/**
 * OAuth2.0 路由处理
 * 实现OAuth2.0标准的授权和令牌端点
 */

const express = require('express');
const { 
  clientManager, 
  tokenManager, 
  authenticateClient,
  generateAccessToken,
  generateRefreshToken,
  generateAuthorizationCode,
  validateAuthorizationCode,
  markAuthorizationCodeAsUsed,
  DEFAULT_CLIENT
} = require('../config/oauth2');
const { UserManager } = require('../config/permissions');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /api/oauth2/authorize
 * 授权端点 - 处理授权码授予流程
 */
router.get('/authorize', responseWrapper((req, res) => {
  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state
  } = req.query;

  // 验证必需参数
  if (!response_type || !client_id || !redirect_uri) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: '缺少必需参数'
    });
  }

  // 验证响应类型
  if (response_type !== 'code') {
    return res.status(400).json({
      error: 'unsupported_response_type',
      error_description: '不支持的响应类型'
    });
  }

  // 验证客户端
  const client = clientManager.getClient(client_id);
  if (!client) {
    return res.status(400).json({
      error: 'invalid_client',
      error_description: '无效的客户端'
    });
  }

  // 验证重定向URI
  if (!client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({
      error: 'invalid_redirect_uri',
      error_description: '无效的重定向URI'
    });
  }

  // 验证授权范围
  const requestedScopes = Array.isArray(scope) ? scope : [scope];
  const validScopes = requestedScopes.every(s => client.scopes.includes(s));
  
  if (!validScopes && requestedScopes.length > 0) {
    return res.status(400).json({
      error: 'invalid_scope',
      error_description: '无效的授权范围'
    });
  }

  // 返回授权页面（实际应用中这里应该渲染HTML让用户确认授权）
  const authPageHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>授权确认</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .client-info { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 3px; }
        .scopes { margin: 10px 0; }
        .buttons { text-align: center; margin-top: 20px; }
        .approve { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 3px; cursor: pointer; }
        .deny { background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 3px; cursor: pointer; }
        .approve:hover, .deny:hover { opacity: 0.8; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>授权确认</h2>
        <div class="client-info">
          <h3>客户端信息</h3>
          <p><strong>客户端名称:</strong> ${client.name}</p>
          <p><strong>客户端ID:</strong> ${client.id}</p>
        </div>
        <div class="scopes">
          <h3>请求的权限:</h3>
          <ul>
            ${requestedScopes.map(s => `<li>${getScopeDescription(s)}</li>`).join('')}
          </ul>
        </div>
        <p>您是否授权该客户端访问您的账户信息？</p>
        <div class="buttons">
          <button class="approve" onclick="authorize()">授权</button>
          <button class="deny" onclick="deny()">拒绝</button>
        </div>
      </div>
      
      <script>
        function authorize() {
          const url = new URL(window.location.href);
          url.searchParams.set('decision', 'approve');
          url.searchParams.set('state', '${state || ''}');
          window.location.href = url.toString();
        }
        
        function deny() {
          const url = new URL(window.location.href);
          url.searchParams.set('decision', 'deny');
          url.searchParams.set('state', '${state || ''}');
          window.location.href = url.toString();
        }
        
        // 检查是否已经做出决策
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('decision')) {
          if (urlParams.get('decision') === 'approve') {
            // 模拟用户点击授权（实际应用中需要用户登录验证）
            window.location.href = '/api/oauth2/authorize?${req._parsedUrl.query}&decision=approve';
          } else {
            window.location.href = '/api/oauth2/authorize?${req._parsedUrl.query}&decision=deny';
          }
        }
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(authPageHtml);
}));

/**
 * POST /api/oauth2/authorize
 * 处理授权决策
 */
router.post('/authorize', responseWrapper((req, res) => {
  const {
    decision,
    state,
    client_id,
    redirect_uri,
    scope,
    username,
    password
  } = req.body;

  // 验证客户端
  const client = clientManager.getClient(client_id);
  if (!client) {
    return res.status(400).json({
      error: 'invalid_client',
      error_description: '无效的客户端'
    });
  }

  // 实际应用中这里应该验证用户登录
  // 现在使用演示用户进行验证
  if (!username || !password) {
    return res.status(401).json({
      error: 'unauthorized',
      error_description: '用户认证失败'
    });
  }

  // 查找用户
  const user = UserManager.findUserByUsername(username);
  if (!user) {
    return res.status(401).json({
      error: 'unauthorized',
      error_description: '用户不存在'
    });
  }

  // 验证密码
  // 暂时跳过密码验证，实际应用中需要调用UserManager.verifyPassword
  // const isPasswordValid = await UserManager.verifyPassword(user.id, password);

  if (decision === 'approve') {
    // 生成授权码
    const authorizationCode = generateAuthorizationCode(
      user.id,
      client_id,
      redirect_uri,
      Array.isArray(scope) ? scope : [scope]
    );

    // 重定向到客户端的回调地址
    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set('code', authorizationCode);
    if (state) {
      callbackUrl.searchParams.set('state', state);
    }

    logger.info('OAuth2.0授权成功', {
      userId: user.id,
      clientId: client_id,
      scopes: scope
    });

    return res.redirect(callbackUrl.toString());
  } else {
    // 用户拒绝授权
    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set('error', 'access_denied');
    callbackUrl.searchParams.set('error_description', '用户拒绝了授权请求');
    if (state) {
      callbackUrl.searchParams.set('state', state);
    }

    logger.info('OAuth2.0授权被拒绝', {
      userId: user.id,
      clientId: client_id
    });

    return res.redirect(callbackUrl.toString());
  }
}));

/**
 * POST /api/oauth2/token
 * 令牌端点 - 获取访问令牌
 */
router.post('/token', authenticateClient, responseWrapper(async (req, res) => {
  const {
    grant_type,
    code,
    redirect_uri,
    refresh_token
  } = req.body;

  const client = req.client;

  // 验证授权码授权类型
  if (grant_type === 'authorization_code') {
    if (!code || !redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: '授权码和重定向URI都是必需的'
      });
    }

    // 验证授权码
    const authCode = validateAuthorizationCode(code);
    if (!authCode) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: '无效的授权码'
      });
    }

    // 验证重定向URI
    if (authCode.redirectUri !== redirect_uri) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: '重定向URI不匹配'
      });
    }

    // 验证客户端ID
    if (authCode.clientId !== client.id) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: '客户端ID不匹配'
      });
    }

    // 标记授权码为已使用
    markAuthorizationCodeAsUsed(code);

    // 生成访问令牌
    const accessToken = generateAccessToken({
      userId: authCode.userId,
      clientId: client.id,
      scope: authCode.scope
    });

    // 生成刷新令牌
    const refreshToken = generateRefreshToken({
      userId: authCode.userId,
      clientId: client.id,
      scope: authCode.scope
    });

    // 存储访问令牌
    tokenManager.storeAccessToken(accessToken, {
      userId: authCode.userId,
      clientId: client.id,
      scope: authCode.scope,
      expiresIn: 3600000 // 1小时
    });

    logger.info('OAuth2.0令牌生成成功', {
      userId: authCode.userId,
      clientId: client.id,
      grantType: 'authorization_code'
    });

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: authCode.scope.join(' ')
    });
  }

  // 验证刷新令牌授权类型
  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: '刷新令牌是必需的'
      });
    }

    const tokenData = tokenManager.refreshAccessToken(refresh_token);
    
    if (!tokenData) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: '无效的刷新令牌'
      });
    }

    logger.info('OAuth2.0令牌刷新成功', {
      grantType: 'refresh_token'
    });

    return res.json(tokenData);
  }

  // 客户端凭证授权类型
  if (grant_type === 'client_credentials') {
    // 生成客户端访问令牌
    const accessToken = generateAccessToken({
      clientId: client.id,
      scope: client.scopes
    });

    tokenManager.storeAccessToken(accessToken, {
      clientId: client.id,
      scope: client.scopes,
      expiresIn: 3600000
    });

    logger.info('OAuth2.0客户端令牌生成成功', {
      clientId: client.id
    });

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: client.scopes.join(' ')
    });
  }

  // 密码授权类型（已废弃，仅用于演示）
  if (grant_type === 'password') {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: '用户名和密码都是必需的'
      });
    }

    const user = UserManager.findUserByUsername(username);
    if (!user) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: '用户名或密码错误'
      });
    }

    // 生成令牌
    const accessToken = generateAccessToken({
      userId: user.id,
      clientId: client.id,
      scope: client.scopes
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      clientId: client.id,
      scope: client.scopes
    });

    tokenManager.storeAccessToken(accessToken, {
      userId: user.id,
      clientId: client.id,
      scope: client.scopes,
      expiresIn: 3600000
    });

    logger.info('OAuth2.0密码授权成功', {
      userId: user.id,
      clientId: client.id
    });

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: client.scopes.join(' ')
    });
  }

  // 不支持的授权类型
  return res.status(400).json({
    error: 'unsupported_grant_type',
    error_description: '不支持的授权类型'
  });
}));

/**
 * GET /api/oauth2/clients
 * 获取客户端列表
 */
router.get('/clients', responseWrapper((req, res) => {
  const clients = clientManager.getAllClients().map(client => ({
    id: client.id,
    name: client.name,
    redirectUris: client.redirectUris,
    grants: client.grants,
    scopes: client.scopes,
    createdAt: client.createdAt
  }));

  return res.json({
    success: true,
    data: { clients }
  });
}));

/**
 * POST /api/oauth2/clients
 * 创建新客户端
 */
router.post('/clients', responseWrapper((req, res) => {
  const { name, redirectUris, grants, scopes } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: '客户端名称是必需的'
    });
  }

  const client = clientManager.createClient({
    name,
    redirectUris: Array.isArray(redirectUris) ? redirectUris : [redirectUris],
    grants: Array.isArray(grants) ? grants : ['authorization_code'],
    scopes: Array.isArray(scopes) ? scopes : ['read']
  });

  logger.info('OAuth2.0客户端创建成功', {
    clientId: client.id,
    name: client.name
  });

  return res.status(201).json({
    success: true,
    data: {
      client: {
        id: client.id,
        name: client.name,
        secret: client.secret,
        redirectUris: client.redirectUris,
        grants: client.grants,
        scopes: client.scopes,
        createdAt: client.createdAt
      }
    },
    message: '客户端创建成功，请妥善保存客户端密钥'
  });
}));

/**
 * DELETE /api/oauth2/clients/:clientId
 * 删除客户端
 */
router.delete('/clients/:clientId', responseWrapper((req, res) => {
  const { clientId } = req.params;

  const deleted = clientManager.deleteClient(clientId);
  
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: '客户端不存在'
    });
  }

  logger.info('OAuth2.0客户端删除成功', { clientId });

  return res.json({
    success: true,
    message: '客户端删除成功'
  });
}));

/**
 * GET /api/oauth2/info
 * 获取OAuth2.0服务器信息
 */
router.get('/info', responseWrapper((req, res) => {
  return res.json({
    success: true,
    data: {
      server: 'OAuth2.0 Authorization Server',
      version: '1.0.0',
      issuer: 'accounting-system',
      supportedGrantTypes: [
        'authorization_code',
        'refresh_token',
        'client_credentials'
      ],
      defaultClient: {
        id: DEFAULT_CLIENT.id,
        name: DEFAULT_CLIENT.name,
        redirectUris: DEFAULT_CLIENT.redirectUris
      }
    }
  });
}));

/**
 * 获取权限描述的辅助函数
 */
function getScopeDescription(scope) {
  const descriptions = {
    'read': '读取权限',
    'write': '写入权限',
    'admin': '管理员权限',
    'user:create': '创建用户',
    'user:read': '读取用户',
    'user:update': '更新用户',
    'user:delete': '删除用户'
  };
  
  return descriptions[scope] || scope;
}

module.exports = router;