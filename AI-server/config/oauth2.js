/**
 * OAuth2.0 认证系统配置
 * 实现OAuth2.0标准的认证授权流程
 */

const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../config/logger');

// OAuth2.0客户端配置
const OAUTH_CLIENTS = new Map();

// 默认客户端（用于演示）
const DEFAULT_CLIENT = {
  id: 'default-client',
  name: 'Default Client',
  secret: crypto.randomBytes(32).toString('hex'),
  redirectUris: ['http://localhost:3000/callback'],
  grants: ['authorization_code', 'password', 'client_credentials', 'refresh_token'],
  scopes: ['read', 'write', 'admin'],
  createdAt: new Date()
};

// 内存存储的访问令牌
const ACCESS_TOKENS = new Map();
// 刷新令牌存储
const REFRESH_TOKENS = new Map();
// 授权码存储
const AUTHORIZATION_CODES = new Map();

/**
 * 客户端认证中间件
 */
function authenticateClient(req, res, next) {
  const clientId = req.body.client_id || req.query.client_id;
  const clientSecret = req.body.client_secret || req.query.client_secret;

  if (!clientId || !clientSecret) {
    return res.status(400).json({
      error: 'invalid_client',
      error_description: '客户端ID和客户端密钥都是必需的'
    });
  }

  const client = OAUTH_CLIENTS.get(clientId);
  if (!client || client.secret !== clientSecret) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: '无效的客户端ID或客户端密钥'
    });
  }

  req.client = client;
  next();
}

/**
 * 生成访问令牌
 */
function generateAccessToken(payload, expiresIn = '1h') {
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
    expiresIn,
    issuer: 'accounting-system',
    audience: 'api-users'
  });
  return token;
}

/**
 * 生成刷新令牌
 */
function generateRefreshToken(payload) {
  const token = uuidv4();
  const refreshData = {
    ...payload,
    token,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天
  };
  
  REFRESH_TOKENS.set(token, refreshData);
  return token;
}

/**
 * 生成授权码
 */
function generateAuthorizationCode(userId, clientId, redirectUri, scope) {
  const code = uuidv4().replace(/-/g, '');
  const authCode = {
    code,
    userId,
    clientId,
    redirectUri,
    scope: Array.isArray(scope) ? scope : [scope],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分钟
    used: false
  };
  
  AUTHORIZATION_CODES.set(code, authCode);
  return code;
}

/**
 * 验证授权码
 */
function validateAuthorizationCode(code) {
  const authCode = AUTHORIZATION_CODES.get(code);
  if (!authCode) {
    return null;
  }
  
  if (authCode.used) {
    AUTHORIZATION_CODES.delete(code);
    return null;
  }
  
  if (authCode.expiresAt < new Date()) {
    AUTHORIZATION_CODES.delete(code);
    return null;
  }
  
  return authCode;
}

/**
 * 标记授权码为已使用
 */
function markAuthorizationCodeAsUsed(code) {
  const authCode = AUTHORIZATION_CODES.get(code);
  if (authCode) {
    authCode.used = true;
    AUTHORIZATION_CODES.set(code, authCode);
  }
}

/**
 * 清理过期令牌
 */
function cleanupExpiredTokens() {
  const now = new Date();
  
  // 清理过期的访问令牌
  for (const [token, data] of ACCESS_TOKENS.entries()) {
    if (data.expiresAt < now) {
      ACCESS_TOKENS.delete(token);
    }
  }
  
  // 清理过期的刷新令牌
  for (const [token, data] of REFRESH_TOKENS.entries()) {
    if (data.expiresAt < now) {
      REFRESH_TOKENS.delete(token);
    }
  }
  
  // 清理过期的授权码
  for (const [code, data] of AUTHORIZATION_CODES.entries()) {
    if (data.expiresAt < now) {
      AUTHORIZATION_CODES.delete(code);
    }
  }
}

/**
 * OAuth2.0 授权服务器策略配置
 */
passport.use('oauth2', new OAuth2Strategy({
    authorizationURL: process.env.OAUTH_AUTH_URL || 'http://localhost:3000/api/oauth2/authorize',
    tokenURL: process.env.OAUTH_TOKEN_URL || 'http://localhost:3000/api/oauth2/token',
    clientID: 'default-client',
    clientSecret: DEFAULT_CLIENT.secret,
    callbackURL: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/api/oauth2/callback',
    scope: ['read', 'write']
  },
  function(accessToken, refreshToken, profile, done) {
    // OAuth2.0认证回调函数
    const user = {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      accessToken,
      refreshToken
    };
    
    return done(null, user);
  }
));

/**
 * JWT 策略配置
 */
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'default-secret',
  issuer: 'accounting-system',
  audience: 'api-users'
}, function(payload, done) {
  // 验证JWT令牌
  const token = payload.token;
  const tokenData = ACCESS_TOKENS.get(token);
  
  if (!tokenData) {
    return done(null, false, { message: '令牌不存在' });
  }
  
  if (tokenData.expiresAt < new Date()) {
    ACCESS_TOKENS.delete(token);
    return done(null, false, { message: '令牌已过期' });
  }
  
  return done(null, tokenData.user);
}));

/**
 * 客户端管理函数
 */
const clientManager = {
  // 创建客户端
  createClient(clientData) {
    const client = {
      id: clientData.id || uuidv4(),
      name: clientData.name,
      secret: clientData.secret || crypto.randomBytes(32).toString('hex'),
      redirectUris: clientData.redirectUris || [],
      grants: clientData.grants || ['authorization_code'],
      scopes: clientData.scopes || ['read'],
      createdAt: new Date()
    };
    
    OAUTH_CLIENTS.set(client.id, client);
    return client;
  },
  
  // 获取客户端
  getClient(clientId) {
    return OAUTH_CLIENTS.get(clientId);
  },
  
  // 获取所有客户端
  getAllClients() {
    return Array.from(OAUTH_CLIENTS.values());
  },
  
  // 删除客户端
  deleteClient(clientId) {
    return OAUTH_CLIENTS.delete(clientId);
  }
};

/**
 * 令牌管理函数
 */
const tokenManager = {
  // 存储访问令牌
  storeAccessToken(token, data) {
    ACCESS_TOKENS.set(token, {
      ...data,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (data.expiresIn || 3600000)) // 默认1小时
    });
  },
  
  // 获取访问令牌
  getAccessToken(token) {
    return ACCESS_TOKENS.get(token);
  },
  
  // 删除访问令牌
  revokeAccessToken(token) {
    return ACCESS_TOKENS.delete(token);
  },
  
  // 验证访问令牌
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      const tokenData = ACCESS_TOKENS.get(token);
      
      if (!tokenData || tokenData.expiresAt < new Date()) {
        return null;
      }
      
      return tokenData.user;
    } catch (error) {
      return null;
    }
  },
  
  // 刷新访问令牌
  refreshAccessToken(refreshToken) {
    const tokenData = REFRESH_TOKENS.get(refreshToken);
    
    if (!tokenData || tokenData.expiresAt < new Date()) {
      return null;
    }
    
    // 生成新的访问令牌
    const newAccessToken = generateAccessToken({
      userId: tokenData.userId,
      clientId: tokenData.clientId,
      scope: tokenData.scope
    });
    
    // 删除旧的刷新令牌
    REFRESH_TOKENS.delete(refreshToken);
    
    // 存储新的访问令牌
    tokenManager.storeAccessToken(newAccessToken, {
      userId: tokenData.userId,
      clientId: tokenData.clientId,
      scope: tokenData.scope,
      expiresIn: '1h'
    });
    
    // 生成新的刷新令牌
    const newRefreshToken = generateRefreshToken({
      userId: tokenData.userId,
      clientId: tokenData.clientId,
      scope: tokenData.scope
    });
    
    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 3600
    };
  }
};

// 初始化默认客户端
clientManager.createClient(DEFAULT_CLIENT);

// 定期清理过期令牌
setInterval(cleanupExpiredTokens, 60000); // 每分钟清理一次

module.exports = {
  passport,
  clientManager,
  tokenManager,
  authenticateClient,
  generateAccessToken,
  generateRefreshToken,
  generateAuthorizationCode,
  validateAuthorizationCode,
  markAuthorizationCodeAsUsed,
  DEFAULT_CLIENT
};