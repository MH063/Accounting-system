/**
 * 用户服务层
 * 处理用户相关的业务逻辑
 */

const BaseService = require('./BaseService');
const UserRepository = require('../repositories/UserRepository');
const TwoFactorRepository = require('../repositories/TwoFactorRepository');
const UserModel = require('../models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const TotpService = require('./TotpService');
const { getQueue, QUEUES } = require('../config/messageQueue');
const { 
  generateTokenPair, 
  refreshAccessToken, 
  revokeTokenPair 
} = require('../config/jwtManager');

const AdminAuthService = require('./AdminAuthService');

class UserService extends BaseService {
  constructor() {
    const userRepository = new UserRepository();
    super(userRepository);
    this.userRepository = userRepository;
    this.twoFactorRepository = new TwoFactorRepository();
    this.totpService = new TotpService();
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    const { pool } = require('../config/database');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');      
      logger.info('[UserService] 用户注册开始', { 
        username: userData.username,
        email: userData.email 
      });

      // 验证必填字段
      if (!userData.username || !userData.email || !userData.password) {
        throw new Error('用户名、邮箱和密码为必填项');
      }

      // 验证邮箱格式
      logger.debug('[UserService] 验证邮箱格式', { 
        email: userData.email,
        emailType: typeof userData.email
      });
      
      if (!this.isValidEmail(userData.email)) {
        logger.error('[UserService] 邮箱格式验证失败', { 
          email: userData.email,
          emailType: typeof userData.email
        });
        throw new Error('邮箱格式不正确');
      }

      // 检查用户名和邮箱是否已存在
      const exists = await this.userRepository.checkUserExists(
        userData.username,
        userData.email
      );

      if (exists.exists) {
        const conflictField = exists.conflictField;
        const conflictValue = conflictField === 'username' ? userData.username : userData.email;
        throw new Error(`${conflictField === 'username' ? '用户名' : '邮箱'} '${conflictValue}' 已被使用`);
      }

      // 加密密码
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);
      
      logger.debug('[UserService] 加密后的密码哈希:', { 
        passwordHash: passwordHash,
        passwordHashLength: passwordHash.length
      });
      
      // 创建用户模型
      const user = UserModel.create({
        username: userData.username,
        email: userData.email,
        passwordHash: passwordHash,
        full_name: userData.full_name || userData.username,
        phone: userData.phone || null,
        role: 'user', // 默认角色
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.debug('[UserService] 创建的用户模型:', { 
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        passwordHashLength: user.passwordHash ? user.passwordHash.length : 0
      });

      // 设置额外的用户属性
      if (userData.nickname) {
        user.nickname = userData.nickname;
      }
      
      if (userData.phone) {
        user.phone = userData.phone;
      }
      
      if (userData.avatar_url) {
        user.avatarUrl = userData.avatar_url;
      }

      // 验证数据
      const validation = user.validate();
      logger.debug('[UserService] 验证结果:', { 
        isValid: validation.isValid,
        errors: validation.errors
      });
      
      if (!validation.isValid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
      }      // 1. 创建新用户记录（状态设为pending，邮箱未验证）
      // 使用简化的字段集，让数据库使用默认值处理其他字段
      const insertUserQuery = `
        INSERT INTO users (
          username, email, password_hash, nickname,
          phone, status, email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const userValues = [
        user.username,
        user.email,
        user.passwordHash,
        user.nickname || '',
        user.phone || null,
        'pending',
        false
      ];
      
      // 恢复用户创建和角色分配代码
      const userResult = await client.query(insertUserQuery, userValues);
      const userId = userResult.rows[0].id;

      // 2. 为用户分配默认角色（'user'角色）
      const assignRoleQuery = `
        INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
        SELECT $1, id, NOW(), TRUE 
        FROM roles 
        WHERE role_name = 'user'
      `;

      await client.query(assignRoleQuery, [userId]);
      
      // 3. 生成邮箱验证码
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6位数字验证码
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

      const insertCodeQuery = `
        INSERT INTO verification_codes (
          email, code, code_type, expires_at
        ) VALUES ($1, $2, $3, $4)
      `;

      const codeValues = [
        user.email,
        verificationCode,
        'email_verification', // 验证码类型为邮箱验证
        expiresAt
      ];

      await client.query(insertCodeQuery, codeValues);

      // 4. 记录审计日志
      const insertAuditQuery = `
        INSERT INTO audit_logs (
          table_name, operation, record_id, new_values,
          user_id, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      const auditValues = [
        'users',
        'INSERT',
        userId,
        JSON.stringify({
          id: userId,
          username: user.username,
          email: user.email,
          status: 'pending',
          email_verified: false
        }),
        userId,
        '127.0.0.1', // TODO: 实际部署时应获取真实IP
        'API Client' // TODO: 实际部署时应获取真实User-Agent
      ];

      await client.query(insertAuditQuery, auditValues);
      // 提交事务
      await client.query('COMMIT');

      logger.info('[UserService] 用户注册成功', { 
        userId: userId,
        username: user.username 
      });

      // 返回用户信息（不包含敏感数据）
      const createdUser = {
        id: userId,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        phone: user.phone,
        avatar_url: user.avatarUrl,
        status: 'pending',
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      return {
        success: true,
        data: createdUser,
        message: '用户注册成功，请检查邮箱以完成验证',
        verification_code: verificationCode // 开发环境返回验证码，生产环境应通过邮件发送
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[UserService] 用户注册失败', { 
        error: error.message,
        username: userData.username,
        email: userData.email 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 用户登录
   * @param {Object} loginData - 登录数据
   * @returns {Promise<Object>} 登录结果
   */
  async login(loginData) {
    try {
      logger.info('[UserService] 用户登录开始', { 
        username: loginData.username || loginData.email 
      });

      const { username, email, password, captchaCode, sessionId, ip, userAgent } = loginData;

      // 验证必填字段
      if (!password) {
        return { success: false, message: '密码为必填项' };
      }

      if (!username && !email) {
        return { success: false, message: '用户名或邮箱为必填项' };
      }

      // 验证验证码（如果提供）
      if (captchaCode && sessionId) {
        const captchaValid = await this.validateCaptcha(captchaCode, sessionId, ip);
        if (!captchaValid) {
          logger.warn('[UserService] 用户登录失败: 验证码错误', { 
            sessionId,
            ip
          });
          return { success: false, message: '验证码错误，请重新输入' };
        }
      }

      // 查找用户（包含角色信息）
      const loginIdentifier = email || username;
      const user = await this.userRepository.findUserWithRoles(loginIdentifier);

      // 添加调试日志 - 将详细信息包含在message中以便控制台显示
      logger.info(`[UserService] 查找用户结果 - loginIdentifier: ${loginIdentifier}, userFound: ${!!user}, userId: ${user ? user.id : null}, username: ${user ? user.username : null}, passwordHashExists: ${user ? !!user.passwordHash : null}`);

      if (!user) {
        logger.warn(`[UserService] 用户登录失败: 用户不存在 - username: ${username || email}`);
        return { success: false, message: '用户名或密码错误' };
      }

      // 检查用户状态
      if (user.status !== 'active') {
        const statusMessages = {
          'inactive': '账户未激活，请联系管理员',
          'pending': '账户待审核，请稍后再试',
          'banned': '账户已被禁用，请联系管理员'
        };
        
        logger.warn('[UserService] 用户登录失败: 账户状态异常', { 
          userId: user.id,
          username: user.username,
          status: user.status
        });
        return { success: false, message: statusMessages[user.status] || '账户状态异常，请联系管理员' };
      }

      // 检查用户是否被锁定
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        logger.warn('[UserService] 用户登录失败: 账户已被锁定', { 
          userId: user.id,
          username: user.username,
          lockedUntil: user.lockedUntil 
        });
        return { success: false, message: `账户已被锁定，请于 ${new Date(user.lockedUntil).toLocaleString()} 后再试` };
      }

      // DEBUG: 打印密码哈希信息
      logger.info('[UserService] DEBUG: 验证密码', {
        username: user.username,
        inputPasswordLength: password ? password.length : 0,
        storedHash: user.passwordHash,
        storedHashLength: user.passwordHash ? user.passwordHash.length : 0
      });

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        // 记录登录失败
        await this.handleLoginFailure(user.id, username || email, user.login_protection_enabled);
        
        logger.warn('[UserService] 用户登录失败: 密码错误', { 
          userId: user.id,
          username: user.username 
        });
        return { success: false, message: '用户名或密码错误' };
      }

      // 密码正确，重置登录失败次数
      await this.userRepository.resetLoginAttempts(user.id);
      
      // 异地登录检测
      if (user.login_protection_enabled && user.lastLoginIp && user.lastLoginIp !== ip) {
        logger.warn('[UserService] 检测到异地登录', {
          userId: user.id,
          oldIp: user.lastLoginIp,
          newIp: ip
        });
        
        // 如果启用了邮件提醒
        if (user.email_alerts_enabled) {
          try {
            const emailQueue = getQueue(QUEUES.EMAIL);
            await emailQueue.add({
              to: user.email,
              subject: '【安全提醒】检测到异地登录',
              html: `
                <div style="padding: 20px; font-family: sans-serif; line-height: 1.6; color: #333;">
                  <h2 style="color: #d9534f; border-bottom: 1px solid #eee; padding-bottom: 10px;">账户安全提醒</h2>
                  <p>尊敬的 <strong>${user.nickname || user.username}</strong>：</p>
                  <p>系统检测到您的账户在新的地理位置（IP地址）登录，请确认是否为您本人操作。</p>
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>登录时间：</strong>${new Date().toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>登录 IP：</strong>${ip}</p>
                    <p style="margin: 5px 0;"><strong>上次登录 IP：</strong>${user.lastLoginIp}</p>
                  </div>
                  <p>如果这不是您的本人操作，您的账户可能面临安全风险。请立即采取以下措施：</p>
                  <ol>
                    <li>修改您的账户登录密码</li>
                    <li>检查账户的安全保护设置</li>
                    <li>检查是否有异常的操作记录</li>
                  </ol>
                  <p>如有疑问，请联系系统管理员。</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
                  <p style="color: #888; font-size: 12px; text-align: center;">此邮件由系统自动发送，请勿直接回复。</p>
                </div>
              `
            });
            logger.info('[UserService] 异地登录提醒邮件已加入队列', { userId: user.id });
          } catch (emailError) {
            logger.error('[UserService] 发送异地登录提醒邮件失败', { 
              error: emailError.message,
              userId: user.id 
            });
          }
        }
      }

      // 更新最后登录时间和IP
      await this.userRepository.updateLastLogin(user.id, ip);

      // 生成JWT双令牌
      const tokenPair = generateTokenPair(user.id, {
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      });

      // 创建用户会话(传入JWT refreshToken)
      const session = await this.createUserSession(user.id, ip, userAgent, {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken
      });

      logger.info('[UserService] 用户登录成功', { 
        userId: user.id,
        username: user.username 
      });

      return {
        success: true,
        data: {
          user: user.toApiResponse(),
          tokens: {
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
            expiresIn: tokenPair.expiresIn,
            refreshExpiresIn: tokenPair.refreshExpiresIn
          },
          session: session
        },
        message: '登录成功'
      };

    } catch (error) {
      logger.error('[UserService] 用户登录失败', { 
        error: error.message,
        username: loginData.username || loginData.email 
      });
      throw error;
    }
  }

  /**
   * 处理登录失败
   * @param {number} userId - 用户ID
   * @param {string} identifier - 用户标识符
   * @param {boolean} protectionEnabled - 是否启用登录保护
   */
  async handleLoginFailure(userId, identifier, protectionEnabled = true) {
    try {
      // 如果未启用登录保护，仅记录日志，不执行锁定逻辑
      if (!protectionEnabled) {
        logger.warn('[UserService] 登录失败 (未启用登录保护锁定)', { 
          userId, 
          identifier,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.userRepository.increaseFailedAttempts(userId);
      
      if (result.success) {
        const { loginAttempts, lockedUntil } = result;
        
        if (lockedUntil && new Date(lockedUntil) > new Date()) {
          logger.warn('[UserService] 账户被锁定', { 
            userId, 
            identifier,
            loginAttempts,
            lockedUntil 
          });
          
          // 记录安全事件
          logger.warn('[UserService] 安全事件: 多次登录失败导致账户锁定', {
            event: 'ACCOUNT_LOCKED',
            userId,
            identifier,
            loginAttempts,
            lockedUntil,
            timestamp: new Date().toISOString()
          });
        } else {
          logger.warn('[UserService] 登录失败次数增加', { 
            userId, 
            identifier,
            loginAttempts 
          });
        }
      }
    } catch (error) {
      logger.error('[UserService] 处理登录失败时出错', { 
        error: error.message,
        userId,
        identifier 
      });
    }
  }

  /**
   * 用户登出
   * @param {number} userId - 用户ID
   * @param {string} sessionToken - 会话令牌
   * @param {string} ipAddress - IP地址
   * @param {string} userAgent - 用户代理
   * @returns {Promise<Object>} 登出结果
   */
  async logout(userId, sessionToken, ipAddress, userAgent) {
    try {
      logger.info('[UserService] 用户登出', { userId, sessionToken });

      // 1. 更新当前会话状态为 revoked
      const updateSessionQuery = `
        UPDATE user_sessions 
        SET status = 'revoked', last_accessed_at = NOW() 
        WHERE session_token = $1 AND status = 'active' AND user_id = $2
        RETURNING id, session_token, refresh_token, status, expires_at
      `;

      const sessionResult = await this.userRepository.executeQuery(updateSessionQuery, [sessionToken, userId]);

      if (!sessionResult || sessionResult.rows.length === 0) {
        logger.warn('[UserService] 登出失败: 会话不存在或已失效', { 
          userId, 
          sessionToken 
        });
        return {
          success: false,
          message: '会话不存在或已失效'
        };
      }

      const updatedSession = sessionResult.rows[0];

      // 2. 撤销JWT令牌（加入黑名单）
      const { revokeTokenPair } = require('../config/jwtManager');
      try {
        // session_token 实际上存储的是访问令牌或与之关联的令牌
        // refresh_token 存储的是刷新令牌
        await revokeTokenPair(sessionToken, updatedSession.refresh_token, 'user_logout');
        logger.info('[UserService] JWT令牌已加入黑名单', { userId });
      } catch (revokeError) {
        logger.warn('[UserService] 撤销JWT令牌失败', { error: revokeError.message });
      }

      logger.info('[UserService] 用户登出成功', { 
        userId, 
        sessionToken,
        sessionId: updatedSession.id
      });

      // 记录安全事件
      logger.info('[UserService] 安全事件: 用户正常登出', {
        event: 'USER_LOGOUT',
        userId,
        sessionToken,
        sessionId: updatedSession.id,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          session: {
            id: updatedSession.id,
            sessionToken: updatedSession.session_token,
            status: updatedSession.status,
            expiresAt: updatedSession.expires_at
          }
        },
        message: '登出成功'
      };

    } catch (error) {
      logger.error('[UserService] 用户登出失败', { 
        error: error.message,
        userId,
        sessionToken
      });
      throw error;
    }
  }

  /**
   * 刷新访问令牌
   * @param {string} refreshToken - 刷新令牌
   * @param {Object} userInfo - 用户信息
   * @returns {Promise<Object>} 刷新结果
   */
  async refreshToken(refreshToken, userInfo = {}) {
    try {
      logger.info('[UserService] 刷新访问令牌');

      // 使用JWT管理器刷新令牌
      const newTokens = await refreshAccessToken(refreshToken, userInfo);

      logger.info('[UserService] 访问令牌刷新成功');

      return {
        success: true,
        data: {
          accessToken: newTokens.accessToken,
          expiresIn: newTokens.expiresIn,
          tokenType: 'Bearer'
        },
        message: '令牌刷新成功'
      };
    } catch (error) {
      logger.error('[UserService] 刷新访问令牌失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 安全刷新令牌（实现刷新令牌轮换机制）
   * @param {string} refreshToken - 刷新令牌
   * @param {Object} options - 选项参数
   * @returns {Promise<Object>} 刷新结果
   */
  async refreshSecureToken(refreshToken, options = {}) {
    const { pool } = require('../config/database');
    const client = await pool.connect();
    
    try {
      logger.info('[UserService] 安全刷新令牌开始');
      
      // 开始事务
      await client.query('BEGIN');
      
      // 1. 验证刷新令牌是否有效
      // 首先尝试直接匹配数据库中的刷新令牌
      let sessionQuery = `
        SELECT 
          s.id, s.user_id, s.session_token, s.refresh_token, s.status, s.expires_at,
          u.id as user_id, u.status as user_status, u.locked_until
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.refresh_token = $1
          AND s.status = 'active'
          AND s.expires_at > NOW()
          AND u.status = 'active'
          AND (u.locked_until IS NULL OR u.locked_until < NOW())
        FOR UPDATE  -- 行级锁，防止并发刷新
      `;
      
      let sessionResult = await client.query(sessionQuery, [refreshToken]);
      
      // 令牌复用检测逻辑
      if (sessionResult.rows.length === 0) {
        logger.warn('[UserService] 刷新令牌不匹配或会话不活跃，执行安全检测', { 
          refreshToken: refreshToken.substring(0, 15) + '...'
        });
        
        try {
          const { verifyToken } = require('../config/jwtManager');
          const decoded = verifyToken(refreshToken);
          
          if (decoded.type === 'refresh') {
            // 并发刷新容错：检查是否在令牌轮换的宽限期内
            const tokenBlacklist = require('../security/tokenBlacklist');
            const isActuallyRevoked = await tokenBlacklist.isTokenRevoked(refreshToken, true);
            const isRevokedWithGrace = await tokenBlacklist.isTokenRevoked(refreshToken, false);
            
            logger.info('[UserService] 令牌黑名单状态检测', {
              userId: decoded.userId,
              isActuallyRevoked,
              isRevokedWithGrace
            });

            // 如果 isActuallyRevoked 为 true 但 isRevokedWithGrace 为 false，
            // 说明该令牌处于轮换宽限期内（例如10秒内刚刚被刷新过）
            if (isActuallyRevoked && !isRevokedWithGrace) {
              logger.info('[UserService] 检测到处于宽限期内的并发刷新，尝试获取新令牌', { 
                userId: decoded.userId,
                tokenId: refreshToken.substring(refreshToken.length - 10)
              });
              
              // 尝试找到该用户最近更新的活跃会话，返回新的令牌对
              const latestSessionQuery = `
                SELECT session_token, refresh_token, expires_at
                FROM user_sessions 
                WHERE user_id = $1 AND status = 'active'
                ORDER BY last_accessed_at DESC
                LIMIT 1
              `;
              const latestSessionResult = await client.query(latestSessionQuery, [decoded.userId]);
              
              if (latestSessionResult.rows.length > 0) {
                const latestSession = latestSessionResult.rows[0];
                logger.info('[UserService] 成功获取并发刷新的新令牌', { userId: decoded.userId });
                
                await client.query('ROLLBACK');
                const error = new Error('检测到并发刷新尝试，请使用已更新的令牌');
                error.code = 'CONCURRENT_REFRESH';
                error.statusCode = 409;
                error.data = {
                  accessToken: latestSession.session_token,
                  refreshToken: latestSession.refresh_token,
                  userId: decoded.userId
                };
                throw error;
              }
              
              await client.query('ROLLBACK');
              const error = new Error('检测到并发刷新尝试，请使用已更新的令牌');
              error.code = 'CONCURRENT_REFRESH';
              error.statusCode = 409;
              throw error;
            }

            // 如果令牌本身有效但不在数据库中匹配，且不在黑名单宽限期内
            logger.warn('[UserService] 检测到刷新令牌复用尝试！强制撤销所有会话', { userId: decoded.userId });
            
            // 安全策略：撤销该用户的所有活跃会话，强制重新登录
            await client.query(
              "UPDATE user_sessions SET status = 'revoked', last_accessed_at = NOW() WHERE user_id = $1 AND status = 'active'",
              [decoded.userId]
            );
            
            await client.query('COMMIT');
            throw new Error('检测到异常的令牌使用行为，请重新登录');
          }
        } catch (jwtError) {
          if (jwtError.statusCode === 409 || jwtError.message === '检测到异常的令牌使用行为，请重新登录') {
            throw jwtError;
          }
          logger.debug('[UserService] 刷新令牌验证失败:', jwtError.message);
        }
        
        await client.query('ROLLBACK');
        throw new Error('无效的刷新令牌或会话已过期');
      }
      
      const session = sessionResult.rows[0];
      const userId = session.user_id;
      
      // 2. 生成新的访问令牌和刷新令牌
      const { generateTokenPair } = require('../config/jwtManager');
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        await client.query('ROLLBACK');
        throw new Error('用户不存在');
      }
      
      const tokenPair = generateTokenPair(userId, {
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      });
      
      // 3. 更新会话记录（实现刷新令牌轮换）
      // 先更新数据库中的刷新令牌，确保新令牌生效
      const updateSessionQuery = `
        UPDATE user_sessions 
        SET 
          session_token = $1,
          refresh_token = $2,
          expires_at = NOW() + INTERVAL '7 days',
          last_accessed_at = NOW()
        WHERE id = $3
        RETURNING id, user_id, session_token, refresh_token, expires_at
      `;
      
      const updateParams = [
        tokenPair.accessToken,
        tokenPair.refreshToken,
        session.id
      ];
      
      const updateResult = await client.query(updateSessionQuery, updateParams);
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('会话更新失败');
      }
      
      const updatedSession = updateResult.rows[0];
      
      // 4. 只有在成功更新数据库后，再撤销旧的刷新令牌
      const { revokeTokenPair } = require('../config/jwtManager');
      
      try {
        // 同时撤销旧的访问令牌和刷新令牌，使用 token_rotated 原因以支持宽限期
        await revokeTokenPair(session.session_token, refreshToken, 'token_rotated');
        logger.info('[UserService] 旧令牌对已加入黑名单（宽限期模式）');
      } catch (revokeError) {
        logger.warn('[UserService] 撤销旧令牌失败', { error: revokeError.message });
        // 这里不抛出错误，因为数据库已经更新成功
      }
      
      // 5. 记录审计日志
      const auditLogQuery = `
        INSERT INTO audit_logs (
          table_name, operation, record_id, old_values, new_values,
          user_id, ip_address, user_agent
        ) VALUES (
          'user_sessions', 'UPDATE', $1, $2, $3,
          $4, $5, $6
        )
      `;
      
      const auditParams = [
        updatedSession.id,
        JSON.stringify({
          last_activity: session.last_activity || session.last_accessed_at
        }),
        JSON.stringify({
          last_activity: updatedSession.last_activity || updatedSession.last_accessed_at,
          updated_at: updatedSession.updated_at
        }),
        userId,
        options.ipAddress || '0.0.0.0',
        options.userAgent || ''
      ];
      
      await client.query(auditLogQuery, auditParams);
      
      // 提交事务
      await client.query('COMMIT');
      
      logger.info('[UserService] 安全令牌刷新成功', { userId });
      
      return {
        success: true,
        data: {
          userId,
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          expiresIn: tokenPair.expiresIn,
          refreshExpiresIn: tokenPair.refreshExpiresIn
        },
        message: '令牌刷新成功'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[UserService] 安全刷新令牌失败', { 
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 解锁用户账户
   * @param {number} userId - 用户ID
   * @param {string} reason - 解锁原因
   * @returns {Promise<Object>} 解锁结果
   */
  async unlockUser(userId, reason = 'Admin unlock') {
    try {
      logger.info('[UserService] 解锁用户账户', { userId, reason });

      const success = await this.userRepository.unlockUser(userId, reason);

      if (success) {
        logger.info('[UserService] 用户账户解锁成功', { userId, reason });
        
        // 记录安全事件
        logger.info('[UserService] 安全事件: 用户账户被解锁', {
          event: 'ACCOUNT_UNLOCKED',
          userId,
          reason,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          message: '用户账户解锁成功'
        };
      } else {
        throw new Error('解锁用户账户失败');
      }

    } catch (error) {
      logger.error('[UserService] 解锁用户账户失败', { 
        error: error.message,
        userId,
        reason 
      });
      throw error;
    }
  }

  /**
   * 锁定用户账户
   * @param {number} userId - 用户ID
   * @param {string} reason - 锁定原因
   * @param {number} durationMinutes - 锁定时长（分钟）
   * @returns {Promise<Object>} 锁定结果
   */
  async lockUser(userId, reason = 'Admin lock', durationMinutes = 1440) {
    try {
      logger.info('[UserService] 锁定用户账户', { userId, reason, durationMinutes });

      const success = await this.userRepository.lockUser(userId, reason, durationMinutes);

      if (success) {
        logger.info('[UserService] 用户账户锁定成功', { userId, reason, durationMinutes });
        
        // 记录安全事件
        logger.warn('[UserService] 安全事件: 用户账户被锁定', {
          event: 'ACCOUNT_LOCKED_ADMIN',
          userId,
          reason,
          durationMinutes,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          message: '用户账户锁定成功'
        };
      } else {
        throw new Error('锁定用户账户失败');
      }

    } catch (error) {
      logger.error('[UserService] 锁定用户账户失败', { 
        error: error.message,
        userId,
        reason,
        durationMinutes 
      });
      throw error;
    }
  }

  /**
   * 获取用户账户状态
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 账户状态
   */
  async getAccountStatus(userId) {
    try {
      logger.info('[UserService] 获取用户账户状态', { userId });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      const lockStatus = await this.userRepository.checkUserLocked(userId);

      return {
        success: true,
        data: {
          userId: user.id,
          username: user.username,
          email: user.email,
          isActive: user.is_active,
          loginAttempts: lockStatus.loginAttempts,
          locked: lockStatus.locked,
          lockedUntil: lockStatus.lockedUntil,
          lockReason: lockStatus.reason,
          lastLogin: user.last_login,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        message: '获取账户状态成功'
      };

    } catch (error) {
      logger.error('[UserService] 获取用户账户状态失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 获取用户资料
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户资料
   */
  async getProfile(userId) {
    try {
      logger.info('[UserService] 获取用户资料', { userId });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        logger.warn('[UserService] 获取用户资料失败: 用户不存在', { userId });
        throw new Error('用户不存在');
      }

      if (user.status !== 'active') {
        logger.warn('[UserService] 获取用户资料失败: 用户未激活', { userId });
        throw new Error('用户未激活');
      }

      // 获取用户的角色信息
      const roles = await this.userRepository.getUserRoles(userId);
      
      // 如果有角色信息，更新用户对象
      if (roles) {
        user.role = roles.role;
        user.permissions = roles.permissions || [];
      }

      logger.info('[UserService] 获取用户资料成功', { 
        userId,
        username: user.username,
        role: user.role
      });

      return {
        success: true,
        data: user.toApiResponse(),
        message: '获取用户资料成功'
      };

    } catch (error) {
      logger.error('[UserService] 获取用户资料失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 更新用户资料
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateProfile(userId, updateData) {
    try {
      logger.info('[UserService] 更新用户资料', { 
        userId,
        data: this.sanitizeLogData(updateData) 
      });

      // 查找用户
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        logger.warn('[UserService] 更新用户资料失败: 用户不存在', { userId });
        throw new Error('用户不存在');
      }

      if (user.status !== 'active') {
        logger.warn('[UserService] 更新用户资料失败: 用户未激活', { userId });
        throw new Error('用户未激活');
      }

      // 验证更新数据
      const allowedFields = [
        'real_name', 'phone', 'avatar', 'bio',
        'login_protection_enabled', 'email_alerts_enabled', 'sms_alerts_enabled',
        'session_timeout_minutes', 'session_timeout_warning_minutes', 'biometric_enabled'
      ];
      const filteredData = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      if (Object.keys(filteredData).length === 0) {
        throw new Error('没有有效的更新数据');
      }

      // 检查用户名是否已存在（如果更新了用户名）
      if (updateData.username && updateData.username !== user.username) {
        const usernameExists = await this.userRepository.isUsernameExists(updateData.username, userId);
        if (usernameExists) {
          throw new Error(`用户名 '${updateData.username}' 已被使用`);
        }
        filteredData.username = updateData.username;
      }

      // 检查邮箱是否已存在（如果更新了邮箱）
      if (updateData.email && updateData.email !== user.email) {
        if (!this.isValidEmail(updateData.email)) {
          throw new Error('邮箱格式不正确');
        }
        
        const emailExists = await this.userRepository.isEmailExists(updateData.email, userId);
        if (emailExists) {
          throw new Error(`邮箱 '${updateData.email}' 已被使用`);
        }
        filteredData.email = updateData.email;
      }

      // 更新用户（updated_at由BaseRepository自动处理）
      const updatedUser = await this.userRepository.update(userId, filteredData);

      logger.info('[UserService] 更新用户资料成功', { 
        userId,
        username: updatedUser.username 
      });

      return {
        success: true,
        data: updatedUser.toApiResponse(),
        message: '用户资料更新成功'
      };

    } catch (error) {
      logger.error('[UserService] 更新用户资料失败', { 
        error: error.message,
        userId,
        data: this.sanitizeLogData(updateData) 
      });
      throw error;
    }
  }

  /**
   * 修改密码
   * @param {number} userId - 用户ID
   * @param {Object} passwordData - 密码数据
   * @returns {Promise<Object>} 修改结果
   */
  async changePassword(userId, passwordData) {
    try {
      logger.info('[UserService] 修改密码', { userId });

      const { currentPassword, newPassword } = passwordData;

      // 验证必填字段
      if (!currentPassword || !newPassword) {
        const err = new Error('当前密码和新密码为必填项');
        err.statusCode = 400;
        throw err;
      }

      // 验证新密码强度
      if (!this.isValidPassword(newPassword)) {
        const err = new Error('新密码不符合安全要求（至少8位，包含大小写字母、数字和特殊字符）');
        err.statusCode = 400;
        throw err;
      }

      // 查找用户
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        logger.warn('[UserService] 修改密码失败: 用户不存在', { userId });
        const err = new Error('用户不存在');
        err.statusCode = 404;
        throw err;
      }

      if (user.status !== 'active') {
        logger.warn('[UserService] 修改密码失败: 用户未激活', { userId });
        const err = new Error('用户未激活');
        err.statusCode = 403;
        throw err;
      }

      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isCurrentPasswordValid) {
        logger.warn('[UserService] 修改密码失败: 当前密码错误', { userId });
        const err = new Error('当前密码错误');
        err.statusCode = 400;
        throw err;
      }

      // 加密新密码
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // 更新密码
      const success = await this.userRepository.updatePassword(userId, newPasswordHash);

      if (!success) {
        const err = new Error('密码更新失败');
        err.statusCode = 500;
        throw err;
      }

      logger.info('[UserService] 修改密码成功', { userId });

      return {
        success: true,
        message: '密码修改成功'
      };

    } catch (error) {
      logger.error('[UserService] 修改密码失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  isValidEmail(email) {
    logger.debug('[UserService] 验证邮箱格式', { 
      email,
      emailType: typeof email,
      emailLength: email ? email.length : 'null/undefined'
    });
    
    if (!email || typeof email !== 'string') {
      logger.error('[UserService] 邮箱格式验证失败: 邮箱为空或不是字符串', { 
        email,
        emailType: typeof email
      });
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const result = emailRegex.test(email);
    
    logger.debug('[UserService] 邮箱格式验证结果', { 
      email,
      result
    });
    
    return result;
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {boolean} 是否有效
   */
  isValidPassword(password) {
    // 至少8位，包含大小写字母、数字和特殊字符
    // 允许的特殊字符：: 、 \ . ， ？ 《 》 < > / = + - * ~ @ # $ % ^ & ( ) ——
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[:、\\.,？《》<>/=+\-*~@#$%^&()——])[A-Za-z\d:、\\.,？《》<>/=+\-*~@#$%^&()——]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * 生成JWT令牌
   * @param {UserModel} user - 用户模型
   * @returns {string} JWT令牌
   */
  generateToken(user) {
    const { generateToken: signToken } = require('../config/jwtManager');
    return signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  }

  /**
   * 清理日志数据（移除敏感信息）
   * @param {Object} data - 原始数据
   * @returns {Object} 清理后的数据
   */
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    
    // 移除敏感字段
    const sensitiveFields = [
      'password', 'password_hash', 'passwordHash', 'pwd',
      'currentPassword', 'newPassword',
      'token', 'access_token', 'refresh_token',
      'secret', 'private_key', 'api_key', 'apiKey'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field] !== undefined) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * 验证创建数据
   * @param {Object} data - 待验证的数据
   * @returns {Promise<Object>} 验证结果
   */
  async validateData(data) {
    const errors = [];

    // 验证必填字段
    if (!data.username) {
      errors.push('用户名为必填项');
    }
    if (!data.email) {
      errors.push('邮箱为必填项');
    }
    if (!data.password) {
      errors.push('密码为必填项');
    }

    // 验证用户名格式
    if (data.username && !/^[\u4e00-\u9fa5a-zA-Z0-9_]{3,20}$/.test(data.username)) {
      errors.push('用户名必须是3-20位的中文、字母、数字或下划线');
    }

    // 验证邮箱格式
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('邮箱格式不正确');
    }

    // 验证密码强度
    if (data.password && !this.isValidPassword(data.password)) {
      errors.push('密码不符合安全要求（至少8位，包含大小写字母、数字和特殊字符）');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证更新数据
   * @param {Object} data - 待验证的数据
   * @param {Object} existing - 现有记录
   * @returns {Promise<Object>} 验证结果
   */
  async validateUpdateData(data, existing) {
    const errors = [];

    // 验证邮箱格式（如果提供）
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('邮箱格式不正确');
    }

    // 验证用户名格式（如果提供）
    if (data.username && !/^[一-龥a-zA-Z0-9_]{3,20}$/.test(data.username)) {
      errors.push('用户名必须是3-20位的中文、字母、数字或下划线');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 发送邮箱验证邮件
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 发送结果
   */
  async sendEmailVerification(userId) {
    try {
      logger.info('[UserService] 发送邮箱验证邮件', { userId });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      if (user.emailVerified) {
        return {
          success: true,
          message: '邮箱已验证'
        };
      }

      // 生成验证令牌
      const crypto = require('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时过期

      // 保存验证令牌
      await this.userRepository.update(userId, {
        verification_token: verificationToken,
        verification_token_expires: expires
      });

      // 发送邮件（这里模拟发送，实际项目中需要集成邮件服务）
      logger.info('[UserService] 邮箱验证邮件已发送', { 
        userId, 
        email: user.email,
        token: verificationToken 
      });

      return {
        success: true,
        message: '验证邮件已发送，请检查您的邮箱',
        data: {
          verificationToken, // 开发环境返回token，生产环境应该移除
          expiresIn: 24 * 60 * 60 // 24小时
        }
      };

    } catch (error) {
      logger.error('[UserService] 发送邮箱验证邮件失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 验证邮箱
   * @param {string} token - 验证令牌
   * @returns {Promise<Object>} 验证结果
   */
  async verifyEmail(token) {
    try {
      logger.info('[UserService] 验证邮箱', { token: token.substring(0, 8) + '...' });

      const user = await this.userRepository.findByVerificationToken(token);
      
      if (!user) {
        throw new Error('无效的验证令牌');
      }

      // 检查令牌是否过期
      if (!user.isEmailVerificationTokenValid()) {
        throw new Error('验证令牌已过期，请重新发送验证邮件');
      }

      // 验证邮箱
      await this.userRepository.update(user.id, {
        email_verified: true,
        verification_token: null,
        verification_token_expires: null
      });

      logger.info('[UserService] 邮箱验证成功', { userId: user.id });

      return {
        success: true,
        message: '邮箱验证成功'
      };

    } catch (error) {
      logger.error('[UserService] 邮箱验证失败', { 
        error: error.message,
        token: token.substring(0, 8) + '...' 
      });
      throw error;
    }
  }

  /**
   * 更新QQ号码
   * @param {number} userId - 用户ID
   * @param {string} qqNumber - QQ号码
   * @returns {Promise<Object>} 更新结果
   */
  async updateQQNumber(userId, qqNumber) {
    try {
      logger.info('[UserService] 更新QQ号码', { userId, qqNumber });

      // 验证QQ号码格式
      if (!/^\d{5,15}$/.test(qqNumber)) {
        throw new Error('QQ号码格式不正确');
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查QQ号码是否已被使用
      const existingUser = await this.userRepository.findByQQNumber(qqNumber);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('该QQ号码已被其他账户使用');
      }

      // 更新QQ号码
      await this.userRepository.update(userId, {
        qq_number: qqNumber,
        qq_verified: false // 重置验证状态
      });

      logger.info('[UserService] QQ号码更新成功', { userId, qqNumber });

      return {
        success: true,
        message: 'QQ号码更新成功，需要验证',
        data: {
          qq_number: qqNumber,
          qq_verified: false
        }
      };

    } catch (error) {
      logger.error('[UserService] 更新QQ号码失败', { 
        error: error.message,
        userId,
        qqNumber 
      });
      throw error;
    }
  }

  /**
   * 验证QQ号
   * @param {number} userId - 用户ID
   * @param {string} verificationCode - 验证代码
   * @returns {Promise<Object>} 验证结果
   */
  async verifyQQ(userId, verificationCode) {
    try {
      logger.info('[UserService] 验证QQ号', { userId });

      // 实际项目中，这里需要验证腾讯QQ API或短信验证
      // 这里简单模拟验证过程
      const isValidCode = verificationCode === process.env.QQ_VERIFICATION_CODE; // 模拟验证码

      if (!isValidCode) {
        throw new Error('验证代码错误');
      }

      // 验证成功
      await this.userRepository.update(userId, {
        qq_verified: true
      });

      logger.info('[UserService] QQ验证成功', { userId });

      return {
        success: true,
        message: 'QQ验证成功'
      };

    } catch (error) {
      logger.error('[UserService] QQ验证失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 请求密码重置
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object>} 请求结果
   */
  async requestPasswordReset(email) {
    try {
      logger.info('[UserService] 请求密码重置', { email });

      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        // 为安全考虑，即使用户不存在也返回成功
        return {
          success: true,
          message: '如果该邮箱地址已注册，您将收到密码重置邮件'
        };
      }

      // 生成重置令牌
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2小时过期

      // 保存重置令牌
      await this.userRepository.update(user.id, {
        reset_token: resetToken,
        reset_token_expires: expires
      });

      // 发送重置邮件（模拟）
      logger.info('[UserService] 密码重置邮件已发送', { 
        userId: user.id,
        email: user.email,
        token: resetToken 
      });

      return {
        success: true,
        message: '如果该邮箱地址已注册，您将收到密码重置邮件',
        data: {
          resetToken, // 开发环境返回token
          expiresIn: 2 * 60 * 60 // 2小时
        }
      };

    } catch (error) {
      logger.error('[UserService] 请求密码重置失败', { 
        error: error.message,
        email 
      });
      throw error;
    }
  }

  /**
   * 重置密码
   * @param {string} token - 重置令牌
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} 重置结果
   */
  async resetPassword(token, newPassword) {
    try {
      logger.info('[UserService] 重置密码', { token: token.substring(0, 8) + '...' });

      const user = await this.userRepository.findByResetToken(token);
      
      if (!user) {
        throw new Error('无效的重置令牌');
      }

      // 检查令牌是否过期
      if (!user.isPasswordResetTokenValid()) {
        throw new Error('重置令牌已过期，请重新请求密码重置');
      }

      // 验证新密码强度
      if (!this.isValidPassword(newPassword)) {
        throw new Error('新密码不符合安全要求（至少8位，包含大小写字母、数字和特殊字符）');
      }

      // 加密新密码
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // 更新密码并清除重置令牌
      await this.userRepository.update(user.id, {
        password_hash: newPasswordHash,
        reset_token: null,
        reset_token_expires: null
      });

      logger.info('[UserService] 密码重置成功', { userId: user.id });

      return {
        success: true,
        message: '密码重置成功，请使用新密码登录'
      };

    } catch (error) {
      logger.error('[UserService] 密码重置失败', { 
        error: error.message,
        token: token.substring(0, 8) + '...' 
      });
      throw error;
    }
  }

  /**
   * 停用账户
   * @param {number} userId - 用户ID
   * @param {string} reason - 停用原因
   * @returns {Promise<Object>} 停用结果
   */
  async deactivateAccount(userId, reason = '用户主动停用') {
    try {
      logger.info('[UserService] 停用账户', { userId, reason });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      if (!user.is_active) {
        return {
          success: true,
          message: '账户已是停用状态'
        };
      }

      // 停用账户
      await this.userRepository.update(userId, {
        is_active: false
      });

      // 撤销用户的所有令牌
      await revokeTokenPair(userId);

      logger.info('[UserService] 账户停用成功', { userId, reason });

      return {
        success: true,
        message: '账户已停用'
      };

    } catch (error) {
      logger.error('[UserService] 停用账户失败', { 
        error: error.message,
        userId,
        reason 
      });
      throw error;
    }
  }

  /**
   * 删除账户（软删除）
   * @param {number} userId - 用户ID
   * @param {string} password - 确认密码
   * @returns {Promise<Object>} 删除结果
   */
  async deleteAccount(userId, password) {
    try {
      logger.info('[UserService] 删除账户', { userId });

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        throw new Error('密码错误');
      }

      // 软删除：标记为已删除而不是真正删除
      const deleteReason = `账户被用户删除于 ${new Date().toISOString()}`;
      
      await this.userRepository.update(userId, {
        username: `deleted_${userId}_${Date.now()}`,
        email: `deleted_${userId}_${Date.now()}@deleted.com`,
        password_hash: null,
        is_active: false,
        deleted_at: new Date(),
        delete_reason: deleteReason
      });

      // 撤销用户的所有令牌
      await revokeTokenPair(userId);

      logger.info('[UserService] 账户删除成功', { userId });

      return {
        success: true,
        message: '账户已删除'
      };

    } catch (error) {
      logger.error('[UserService] 删除账户失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 检查用户名是否可用
   * @param {string} username - 用户名
   * @param {number} excludeUserId - 排除的用户ID
   * @returns {Promise<Object>} 检查结果
   */
  async checkUsernameAvailability(username, excludeUserId = null) {
    try {
      const exists = await this.userRepository.isUsernameExists(username, excludeUserId);
      
      return {
        success: true,
        data: {
          available: !exists
        },
        message: exists ? '用户名已被使用' : '用户名可用'
      };

    } catch (error) {
      logger.error('[UserService] 检查用户名可用性失败', { 
        error: error.message,
        username 
      });
      throw error;
    }
  }

  /**
   * 检查邮箱是否可用
   * @param {string} email - 邮箱
   * @param {number} excludeUserId - 排除的用户ID
   * @returns {Promise<Object>} 检查结果
   */
  async checkEmailAvailability(email, excludeUserId = null) {
    try {
      const exists = await this.userRepository.isEmailExists(email, excludeUserId);
      
      return {
        success: true,
        data: {
          available: !exists
        },
        message: exists ? '邮箱已被使用' : '邮箱可用'
      };

    } catch (error) {
      logger.error('[UserService] 检查邮箱可用性失败', { 
        error: error.message,
        email 
      });
      throw error;
    }
  }

  /**
   * 管理员登录
   * @param {Object} loginData - 登录数据
   * @returns {Promise<Object>} 登录结果
   */
  async adminLogin(loginData) {
    try {
      // 创建管理员认证服务实例
      const adminAuthService = new AdminAuthService();
      
      // 调用管理员认证服务进行登录验证
      const result = await adminAuthService.adminLogin(loginData);
      
      return result;
    } catch (error) {
      logger.error('[UserService] 管理员登录失败', { 
        error: error.message,
        username: loginData.username
      });
      throw error;
    }
  }

  /**
   * 获取管理员资料
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 管理员资料
   */
  async getAdminProfile(userId) {
    try {
      // 创建管理员认证服务实例
      const adminAuthService = new AdminAuthService();
      
      // 调用管理员认证服务获取资料
      const result = await adminAuthService.getAdminProfile(userId);
      
      if (!result.success) {
        return null;
      }
      
      return result.data;
    } catch (error) {
      logger.error('[UserService] 获取管理员资料失败', { 
        error: error.message,
        userId
      });
      return null;
    }
  }

  /**
   * 验证验证码
   * @param {string} captchaCode - 验证码
   * @param {string} sessionId - 会话ID
   * @param {string} ip - IP地址
   * @returns {Promise<boolean>} 验证结果
   */
  async validateCaptcha(captchaCode, sessionId, ip) {
    try {
      if (!captchaCode || !sessionId) {
        logger.warn('[UserService] 验证码或会话ID缺失', { sessionId, ip });
        return false;
      }

      // 查询验证码记录
      const selectQuery = `
        SELECT id, captcha_answer, expires_at, usage_count, max_usage 
        FROM captcha_codes 
        WHERE captcha_id = $1 
        AND expires_at > NOW() 
        AND usage_count < max_usage
        ORDER BY id DESC 
        LIMIT 1
      `;
      
      const result = await this.userRepository.executeQuery(selectQuery, [sessionId]);
      
      if (!result || result.rows.length === 0) {
        logger.warn('[UserService] 验证码记录不存在、已过期或使用次数超限', { sessionId, ip });
        return false;
      }
      
      const captcha = result.rows[0];
      
      // 记录验证尝试
      logger.info('[UserService] 验证码验证尝试', { 
        sessionId,
        ip,
        captchaId: captcha.id,
        providedCode: captchaCode.substring(0, 1) + '***'
      });
      
      // 验证答案（不区分大小写）
      const isValid = captcha.captcha_answer.toLowerCase() === captchaCode.toLowerCase();
      
      // 增加使用次数
      const updateQuery = `
        UPDATE captcha_codes 
        SET usage_count = usage_count + 1 
        WHERE id = $1
      `;
      await this.userRepository.executeQuery(updateQuery, [captcha.id]);
      
      if (!isValid) {
        logger.warn('[UserService] 验证码答案错误', { sessionId, ip });
        return false;
      }
      
      logger.info('[UserService] 验证码验证成功', { sessionId, ip });
      return true;
    } catch (error) {
      logger.error('[UserService] 验证码验证过程中发生错误', { 
        error: error.message,
        sessionId,
        ip
      });
      return false;
    }
  }

  /**
   * 创建用户会话
   * @param {number} userId - 用户ID
   * @param {string} ip - IP地址
   * @param {string} userAgent - 用户代理
   * @returns {Promise<Object>} 会话信息
   */
  /**
   * 记录并识别设备
   * @param {string} ip - IP地址
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 设备信息及冲突状态
   */
  async identifyAndTrackDevice(ip, userId) {
    try {
      // 1. 查找或创建设备标识 (以 IP 为核心标识)
      const findDeviceQuery = 'SELECT * FROM devices WHERE ip_address = $1';
      let deviceResult = await this.userRepository.executeQuery(findDeviceQuery, [ip]);
      let device;
      let conflictDetected = false;
      let conflictWithUserId = null;

      if (deviceResult.rows.length === 0) {
        // 创建新设备
        const insertDeviceQuery = `
          INSERT INTO devices (ip_address, last_login_user_id, updated_at)
          VALUES ($1, $2, NOW())
          RETURNING *
        `;
        const insertResult = await this.userRepository.executeQuery(insertDeviceQuery, [ip, userId]);
        device = insertResult.rows[0];
      } else {
        device = deviceResult.rows[0];
        // 2. 检测冲突：如果当前登录用户与该 IP 上次登录的用户不同
        if (device.last_login_user_id && device.last_login_user_id !== userId) {
          conflictDetected = true;
          conflictWithUserId = device.last_login_user_id;
          
          // 记录冲突日志
          const logConflictQuery = `
            INSERT INTO ip_conflict_logs (ip_address, user_id, other_user_id)
            VALUES ($1, $2, $3)
          `;
          await this.userRepository.executeQuery(logConflictQuery, [ip, userId, conflictWithUserId]);
          
          logger.warn('[UserService] 检测到 IP 地址冲突', {
            ip,
            currentUserId: userId,
            previousUserId: conflictWithUserId
          });
        }

        // 更新设备最后访问信息
        const updateDeviceQuery = 'UPDATE devices SET last_login_user_id = $1, updated_at = NOW() WHERE id = $2';
        await this.userRepository.executeQuery(updateDeviceQuery, [userId, device.id]);
      }

      return {
        deviceId: device.id,
        conflictDetected,
        conflictWithUserId
      };
    } catch (error) {
      logger.error('[UserService] 设备识别失败', { error: error.message, ip, userId });
      // 降级处理：如果不具备表结构，返回默认值不中断登录流程
      return { deviceId: null, conflictDetected: false };
    }
  }

  /**
   * 创建用户会话
   * @param {number} userId - 用户ID
   * @param {string} ip - IP地址
   * @param {string} userAgent - 用户代理
   * @param {Object} tokens - 令牌信息
   * @returns {Promise<Object>} 会话对象
   */
  async createUserSession(userId, ip, userAgent, tokens = null) {
    try {
      // 识别并跟踪设备
      const deviceTrack = await this.identifyAndTrackDevice(ip || '0.0.0.0', userId);
      
      // 生成会话令牌
      const sessionToken = tokens?.accessToken || this.generateSecureToken();
      const refreshToken = tokens?.refreshToken || this.generateSecureToken();
      
      // 解析用户代理信息
      const deviceInfo = this.parseUserAgent(userAgent);
      
      // 设置会话过期时间（默认7天）
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // 插入到数据库的 user_sessions 表
      let insertQuery, params;
      
      if (deviceTrack.deviceId) {
        // 如果有deviceId，包含device_id字段
        insertQuery = `
          INSERT INTO user_sessions (
            user_id, session_token, refresh_token, device_info, 
            ip_address, user_agent, status, expires_at, last_accessed_at,
            device_id
          ) VALUES (
            $1, $2, $3, $4, 
            $5, $6, 'active', $7, NOW(),
            $8
          )
          RETURNING id, user_id, session_token, refresh_token, device_info, ip_address, user_agent, status, expires_at, created_at, last_accessed_at
        `;
        
        params = [
          userId,
          sessionToken,
          refreshToken,
          JSON.stringify(deviceInfo),
          ip || '0.0.0.0',
          userAgent || '',
          expiresAt,
          deviceTrack.deviceId
        ];
      } else {
        // 如果没有deviceId，不包含device_id字段
        insertQuery = `
          INSERT INTO user_sessions (
            user_id, session_token, refresh_token, device_info, 
            ip_address, user_agent, status, expires_at, last_accessed_at
          ) VALUES (
            $1, $2, $3, $4, 
            $5, $6, 'active', $7, NOW()
          )
          RETURNING id, user_id, session_token, refresh_token, device_info, ip_address, user_agent, status, expires_at, created_at, last_accessed_at
        `;
        
        params = [
          userId,
          sessionToken,
          refreshToken,
          JSON.stringify(deviceInfo),
          ip || '0.0.0.0',
          userAgent || '',
          expiresAt
        ];
      }
      
      const result = await this.userRepository.executeQuery(insertQuery, params);
      const session = result.rows[0];
      
      // 如果检测到冲突，将会话标记中包含冲突信息
      if (deviceTrack.conflictDetected) {
        session.ip_conflict = true;
        session.conflict_with_user_id = deviceTrack.conflictWithUserId;
      }
      
      logger.info('[UserService] 创建用户会话', { 
        userId,
        sessionId: session.id,
        ip,
        deviceId: deviceTrack.deviceId,
        conflict: deviceTrack.conflictDetected
      });
      
      return session;
    } catch (error) {
      logger.error('[UserService] 创建用户会话失败', { 
        error: error.message,
        userId,
        ip
      });
      return null;
    }
  }

  /**
   * 获取用户的所有活跃会话
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 会话列表
   */
  /**
   * 获取用户的所有活跃会话，包含 IP 冲突检测
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 会话列表
   */
  async getUserSessions(userId) {
    try {
      // 查询会话，并关联设备表，同时检测是否有其他用户也在使用相同的 IP
      const query = `
        SELECT 
          s.id, s.session_token, s.device_info, s.ip_address, s.user_agent, 
          s.status, s.expires_at, s.created_at, s.last_accessed_at, s.device_id,
          (
            SELECT COUNT(DISTINCT s2.user_id) 
            FROM user_sessions s2 
            WHERE s2.ip_address = s.ip_address 
            AND s2.user_id != s.user_id 
            AND s2.status = 'active' 
            AND s2.expires_at > NOW()
          ) > 0 as has_ip_conflict
        FROM user_sessions s
        WHERE s.user_id = $1 AND s.status = 'active' AND s.expires_at > NOW()
        ORDER BY s.last_accessed_at DESC
      `;
      const result = await this.userRepository.executeQuery(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('[UserService] 获取用户会话失败', { error: error.message, userId });
      // 降级查询：如果上述复杂查询失败（例如表结构未更新），则执行基本查询
      const fallbackQuery = `
        SELECT id, session_token, device_info, ip_address, user_agent, status, expires_at, created_at, last_accessed_at
        FROM user_sessions
        WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
        ORDER BY last_accessed_at DESC
      `;
      const fallbackResult = await this.userRepository.executeQuery(fallbackQuery, [userId]);
      return fallbackResult.rows;
    }
  }

  /**
   * 撤销会话
   * @param {number} userId - 用户ID
   * @param {number} sessionId - 会话ID
   * @returns {Promise<boolean>} 是否成功
   */
  async revokeSession(userId, sessionId) {
    try {
      const query = `
        UPDATE user_sessions
        SET status = 'revoked', last_accessed_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status = 'active'
        RETURNING id
      `;
      const result = await this.userRepository.executeQuery(query, [sessionId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('[UserService] 撤销会话失败', { error: error.message, userId, sessionId });
      throw error;
    }
  }

  /**
   * 撤销用户除当前会话外的所有会话
   * @param {number} userId - 用户ID
   * @param {number} currentSessionId - 当前会话ID
   * @returns {Promise<number>} 撤销的会话数量
   */
  async revokeOtherSessions(userId, currentSessionId) {
    try {
      const query = `
        UPDATE user_sessions
        SET status = 'revoked', last_accessed_at = NOW()
        WHERE user_id = $1 AND id != $2 AND status = 'active'
      `;
      const result = await this.userRepository.executeQuery(query, [userId, currentSessionId]);
      return result.rowCount;
    } catch (error) {
      logger.error('[UserService] 撤销其他会话失败', { error: error.message, userId, currentSessionId });
      throw error;
    }
  }

  /**
   * 生成安全令牌
   * @returns {string} 安全令牌
   */
  generateSecureToken() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 生成唯一ID
   * @returns {number} 唯一ID
   */
  generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * 解析用户代理信息
   * @param {string} userAgent - 用户代理字符串
   * @returns {Object} 设备信息
   */
  parseUserAgent(userAgent) {
    if (!userAgent) {
      return {
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown'
      };
    }

    // 简单的用户代理解析
    // 实际项目中可以使用专门的库如ua-parser-js
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // 检测浏览器
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // 检测操作系统
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    // 检测设备类型
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iOS')) {
      device = 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      device = 'Tablet';
    }

    return {
      browser,
      os,
      device,
      raw: userAgent
    };
  }

  /**
   * 验证两步验证码
   * @param {Object} verificationData - 验证数据
   * @returns {Promise<Object>} 验证结果
   */
  async verifyTwoFactorCode(verificationData) {
    try {
      const { userId, code, codeType, ip, userAgent } = verificationData;
      logger.info('[UserService] 两步验证开始', { userId, codeType });

      // 查找用户
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 查找验证码记录
      const verificationRecord = await this.twoFactorRepository.verifyTwoFactorCode({
        email: user.email,
        code,
        codeType
      });

      if (!verificationRecord) {
        throw new Error('验证码无效或已过期');
      }

      // 标记验证码为已使用
      await this.twoFactorRepository.markCodeAsUsed(verificationRecord.id);

      // 更新用户的两步验证状态
      if (codeType === 'login') {
        await this.userRepository.update(userId, {
          last_login_at: new Date(),
          last_login_ip: ip
        });
      }

      // 生成JWT双令牌
      const tokenPair = generateTokenPair(userId, {
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      });

      // 创建用户会话(传入JWT refreshToken)
      const session = await this.createUserSession(userId, ip, userAgent, {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken
      });

      logger.info('[UserService] 两步验证成功', { userId });

      return {
        success: true,
        data: {
          user: user.toApiResponse(),
          tokens: {
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
            expiresIn: tokenPair.expiresIn,
            refreshExpiresIn: tokenPair.refreshExpiresIn
          },
          session: session
        },
        message: '两步验证成功'
      };

    } catch (error) {
      logger.error('[UserService] 两步验证失败', { 
        error: error.message,
        userId: verificationData.userId 
      });
      throw error;
    }
  }

  /**
   * 启用两步验证
   * @param {number} userId - 用户ID
   * @param {Object} enableData - 启用数据
   * @returns {Promise<Object>} 启用结果
   */
  async enableTwoFactor(userId, enableData) {
    try {
      const { code, codeType } = enableData;
      logger.info('[UserService] 启用两步验证', { userId, codeType });

      // 查找用户
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证验证码
      const verificationRecord = await this.twoFactorRepository.verifyTwoFactorCode({
        email: user.email,
        code,
        codeType
      });

      if (!verificationRecord) {
        throw new Error('验证码无效或已过期');
      }

      // 标记验证码为已使用
      await this.twoFactorRepository.markCodeAsUsed(verificationRecord.id);

      // 启用两步验证
      await this.userRepository.update(userId, {
        two_factor_enabled: true,
        updated_at: new Date()
      });

      logger.info('[UserService] 两步验证启用成功', { userId });

      return {
        success: true,
        data: {
          userId,
          enabled: true
        },
        message: '两步验证已启用'
      };

    } catch (error) {
      logger.error('[UserService] 启用两步验证失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 禁用两步验证
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 禁用结果
   */
  async disableTwoFactor(userId) {
    try {
      logger.info('[UserService] 禁用两步验证', { userId });

      // 查找用户
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 禁用两步验证
      await this.userRepository.update(userId, {
        two_factor_enabled: false,
        updated_at: new Date()
      });

      logger.info('[UserService] 两步验证禁用成功', { userId });

      return {
        success: true,
        data: {
          userId,
          enabled: false
        },
        message: '两步验证已禁用'
      };

    } catch (error) {
      logger.error('[UserService] 禁用两步验证失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 获取两步验证状态
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 状态信息
   */
  async getTwoFactorStatus(userId) {
    try {
      logger.info('[UserService] 获取两步验证状态', { userId });

      // 查找用户
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      logger.info('[UserService] 获取两步验证状态成功', { userId });

      return {
        success: true,
        data: {
          userId,
          enabled: user.twoFactorEnabled || false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        message: '获取两步验证状态成功'
      };

    } catch (error) {
      logger.error('[UserService] 获取两步验证状态失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 生成两步验证码
   * @param {number} userId - 用户ID
   * @param {string} codeType - 验证码类型
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 生成结果
   */
  async generateTwoFactorCode(userId, codeType, options = {}) {
    const { pool } = require('../config/database');
    const client = await pool.connect();
    
    try {
      logger.info('[UserService] 生成两步验证码', { userId, codeType });

      // 查找用户
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 生成6位随机数字验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 获取用户邮箱或手机号作为目标
      const target = options.target || user.email;
      const channel = options.channel || 'email';
      
      // 确定验证码类型
      let verificationCodeType;
      switch (codeType) {
        case 'login':
          verificationCodeType = 'login';
          break;
        case 'register':
          verificationCodeType = 'email_verification';
          break;
        case 'reset':
          verificationCodeType = 'password_reset';
          break;
        case 'verify':
          verificationCodeType = 'email_verification';
          break;
        case 'enable':
          verificationCodeType = 'email_verification';
          break;
        default:
          verificationCodeType = 'email_verification';
      }

      // 创建验证码记录
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + (options.expireMinutes || 10)); // 默认10分钟过期

      // 开始事务
      await client.query('BEGIN');

      // 插入验证码记录到 verification_codes 表
      const insertCodeQuery = `
        INSERT INTO verification_codes (
          email, code, code_type, expires_at
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `;

      const codeValues = [
        target, // 使用目标邮箱
        code,
        verificationCodeType, // 使用映射后的验证码类型
        expiresAt
      ];

      const codeResult = await client.query(insertCodeQuery, codeValues);
      const codeId = codeResult.rows[0].id;

      // 提交事务
      await client.query('COMMIT');

      logger.info('[UserService] 两步验证码生成成功', { 
        userId, 
        codeId: codeId,
        codeType,
        channel
      });

      return {
        success: true,
        data: {
          codeId: codeId,
          codeType,
          channel,
          target,
          expiresAt: expiresAt
        },
        message: '验证码已生成'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[UserService] 生成两步验证码失败', { 
        error: error.message,
        userId,
        codeType
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 发送邮箱验证码
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object>} 发送结果
   */
  async sendEmailVerificationCode(email) {
    const { pool } = require('../config/database');
    const client = await pool.connect();
    
    try {
      logger.info('[UserService] 发送邮箱验证码', { email });

      // 验证邮箱格式
      if (!this.isValidEmail(email)) {
        throw new Error('邮箱格式不正确');
      }

      // 生成6位数字验证码
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期

      // 开始事务
      await client.query('BEGIN');

      // 插入验证码记录到 verification_codes 表
      const insertCodeQuery = `
        INSERT INTO verification_codes (
          email, code, code_type, expires_at
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `;

      const codeValues = [
        email,
        verificationCode,
        'email_verification', // 验证码类型为邮箱验证
        expiresAt
      ];

      const codeResult = await client.query(insertCodeQuery, codeValues);
      const codeId = codeResult.rows[0].id;

      // 提交事务
      await client.query('COMMIT');

      // TODO: 实际项目中应该通过邮件服务发送验证码
      // 这里只是模拟发送过程
      logger.info('[UserService] 邮箱验证码已生成', { 
        email: email,
        codeId: codeId
      });

      return {
        success: true,
        message: '验证码已发送至您的邮箱',
        data: {
          codeId: codeId,
          // 在开发环境中返回验证码以便测试，生产环境应移除
          verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[UserService] 发送邮箱验证码失败', { 
        error: error.message,
        email 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 验证邮箱验证码
   * @param {string} email - 邮箱地址
   * @param {string} code - 验证码
   * @returns {Promise<Object>} 验证结果
   */
  async verifyEmailCode(email, code) {
    const { pool } = require('../config/database');
    const client = await pool.connect();
    
    try {
      logger.info('[UserService] 验证邮箱验证码', { email });
      
      // 验证输入
      if (!email || !code) {
        throw new Error('邮箱和验证码为必填项');
      }
      
      // 验证邮箱格式
      if (!this.isValidEmail(email)) {
        throw new Error('邮箱格式不正确');
      }
      
      // 验证验证码格式（6位数字）
      if (!/^\d{6}$/.test(code)) {
        throw new Error('验证码格式不正确');
      }
      
      // 开始事务
      await client.query('BEGIN');
      
      // 1. 验证验证码是否有效
      const findCodeQuery = `
        SELECT id, email, code, code_type, expires_at, used_at
        FROM verification_codes
        WHERE email = $1
            AND code = $2
            AND code_type = 'email_verification'
            AND used_at IS NULL
            AND expires_at > NOW()
      `;
      
      const codeResult = await client.query(findCodeQuery, [email, code]);
      
      if (codeResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('验证码无效或已过期');
      }
      
      const verificationRecord = codeResult.rows[0];
      
      // 2. 标记验证码为已使用
      const updateCodeQuery = `
        UPDATE verification_codes 
        SET used_at = NOW()
        WHERE id = $1 AND used_at IS NULL
      `;
      
      await client.query(updateCodeQuery, [verificationRecord.id]);
      
      // 3. 获取用户ID用于更新和审计日志
      const userQuery = `SELECT id, status FROM users WHERE email = $1`;
      const userResult = await client.query(userQuery, [email]);
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('用户不存在');
      }
      
      const user = userResult.rows[0];
      
      // 4. 更新用户邮箱验证状态（支持多种场景）
      let updateUserQuery;
      let updateUserParams;
      
      if (user.status === 'pending') {
        // 场景1：新用户注册验证（用户状态为 pending）
        updateUserQuery = `
          UPDATE users 
          SET 
              email_verified = TRUE,
              status = 'active',
              updated_at = NOW()
          WHERE email = $1 AND status = 'pending'
        `;
        updateUserParams = [email];
      } else {
        // 场景2：已有用户重新验证邮箱（用户状态已经是 active）
        updateUserQuery = `
          UPDATE users 
          SET 
              email_verified = TRUE,
              updated_at = NOW()
          WHERE email = $1 AND status = 'active'
        `;
        updateUserParams = [email];
      }
      
      await client.query(updateUserQuery, updateUserParams);
      
      // 5. 记录审计日志
      const insertLogQuery = `
        INSERT INTO audit_logs (
            table_name, operation, record_id, new_values,
            user_id, ip_address, user_agent
        ) VALUES (
            'users', 'UPDATE', $1, $2,
            $3, $4::inet, $5
        )
      `;
      
      const logValues = [
        user.id,
        JSON.stringify({
          email_verified: true,
          status: user.status === 'pending' ? 'active' : user.status
        }),
        user.id, 
        '127.0.0.1', 
        'API Request'
      ];
      
      await client.query(insertLogQuery, logValues);
      
      // 批量清理已使用的验证码
      const deleteOldCodesQuery = `
        DELETE FROM verification_codes 
        WHERE email = $1 
            AND code_type = 'email_verification'
            AND (used_at IS NOT NULL OR expires_at <= NOW())
      `;
      
      await client.query(deleteOldCodesQuery, [email]);
      
      // 提交事务
      await client.query('COMMIT');
      
      logger.info('[UserService] 邮箱验证码验证成功', { 
        userId: user.id,
        email: email,
        codeId: verificationRecord.id
      });
      
      return {
        success: true,
        message: '邮箱验证成功',
        data: {
          userId: user.id,
          email: email
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[UserService] 验证邮箱验证码失败', { 
        error: error.message,
        email 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 记录审计日志
   * @param {Object} logData - 日志数据
   * @returns {Promise<void>}
   */
  async logAuditAction(logData) {
    try {
      const { pool } = require('../config/database');
      
      const insertLogQuery = `
        INSERT INTO audit_logs (
          table_name, operation, record_id, new_values,
          user_id, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      const logValues = [
        logData.tableName || 'unknown',
        logData.operation || 'UNKNOWN',
        logData.recordId || 0,
        JSON.stringify({
          action: logData.action,
          severity: logData.severity || 'info',
          success: logData.success !== undefined ? logData.success : true,
          errorMessage: logData.errorMessage || null
        }),
        logData.userId || null,
        logData.ipAddress || '127.0.0.1'
      ];
      
      await pool.query(insertLogQuery, logValues);
    } catch (error) {
      logger.error('[UserService] 记录审计日志失败', { 
        error: error.message,
        action: logData?.action 
      });
      // 不抛出错误，因为审计日志不应该影响主流程
    }
  }

  /**
   * 发送密码重置验证码
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object>} 发送结果
   */
  async sendPasswordResetCode(email) {
    const { pool } = require('../config/database');
    const client = await pool.connect();
    
    try {
      logger.info('[UserService] 发送密码重置验证码', { email });

      // 验证邮箱格式
      if (!this.isValidEmail(email)) {
        throw new Error('邮箱格式不正确');
      }

      // 检查用户是否存在
      const userQuery = `SELECT id, status FROM users WHERE email = $1`;
      const userResult = await client.query(userQuery, [email]);
      
      if (userResult.rows.length === 0) {
        // 为安全考虑，即使用户不存在也返回成功
        return {
          success: true,
          message: '如果该邮箱地址已注册，您将收到密码重置验证码'
        };
      }

      const user = userResult.rows[0];
      
      // 检查用户状态
      if (user.status !== 'active') {
        logger.warn('[UserService] 密码重置失败: 用户状态不正确', { 
          userId: user.id, 
          status: user.status 
        });
        // 为安全考虑，即使用户状态不正确也返回成功
        return {
          success: true,
          message: '如果该邮箱地址已注册，您将收到密码重置验证码'
        };
      }

      // 生成6位数字验证码
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期

      // 开始事务
      await client.query('BEGIN');

      // 插入验证码记录到 verification_codes 表
      const insertCodeQuery = `
        INSERT INTO verification_codes (
          email, code, code_type, expires_at
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `;

      const codeValues = [
        email,
        verificationCode,
        'password_reset', // 验证码类型为密码重置
        expiresAt
      ];

      const codeResult = await client.query(insertCodeQuery, codeValues);
      const codeId = codeResult.rows[0].id;

      // 提交事务
      await client.query('COMMIT');

      // TODO: 实际项目中应该通过邮件服务发送验证码
      // 这里只是模拟发送过程
      logger.info('[UserService] 密码重置验证码已生成', { 
        email: email,
        userId: user.id,
        codeId: codeId
      });

      return {
        success: true,
        message: '验证码已发送至您的邮箱',
        data: {
          codeId: codeId,
          // 在开发环境中返回验证码以便测试，生产环境应移除
          verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[UserService] 发送密码重置验证码失败', { 
        error: error.message,
        email 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 使用验证码重置密码
   * @param {string} email - 邮箱地址
   * @param {string} code - 验证码
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} 重置结果
   */
  /**
   * 短信登录
   * @param {Object} loginData - 登录数据
   * @returns {Promise<Object>} 登录结果
   */
  async smsLogin(loginData) {
    const { pool } = require('../config/database');
    const client = await pool.connect();
    
    try {
      logger.info('[UserService] 短信登录开始', { phone: loginData.phone });

      const { phone, code, ip, userAgent } = loginData;

      // 验证必填字段
      if (!phone || !code) {
        throw new Error('手机号和验证码为必填项');
      }

      // 开始事务
      await client.query('BEGIN');

      // 1. 验证手机号码是否存在且状态正常
      logger.info('[UserService] 开始验证手机号码', { phone });
      // 注意：可能存在多个使用相同手机号的用户，我们需要确保获取到最新的用户
      const findUserQuery = `
        SELECT id, phone, phone_verified, status, failed_login_attempts, locked_until
        FROM users 
        WHERE phone = $1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const userResult = await client.query(findUserQuery, [phone]);
      logger.info('[UserService] 用户查询结果', { rowCount: userResult.rows.length });
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('手机号未注册或账户状态异常');
      }
      
      const user = userResult.rows[0];
      logger.info('[UserService] 找到用户', { userId: user.id, phone: user.phone, status: user.status });
      
      // 检查用户是否被锁定
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        await client.query('ROLLBACK');
        logger.warn('[UserService] 短信登录失败: 账户已被锁定', { 
          userId: user.id,
          phone,
          lockedUntil: user.locked_until 
        });
        throw new Error(`账户已被锁定，请于 ${new Date(user.locked_until).toLocaleString()} 后再试`);
      }

      // 2. 验证短信验证码
      logger.info('[UserService] 开始验证短信验证码', { userId: user.id, code });
      
      const findCodeQuery = `
        SELECT id, user_id, code, attempts, max_attempts, is_used, expires_at
        FROM two_factor_codes
        WHERE user_id = $1 
          AND code = $2 
          AND channel = 'sms' 
          AND code_type = 'login'
          AND is_used = FALSE
          AND expires_at > NOW()
          AND attempts < max_attempts
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const codeResult = await client.query(findCodeQuery, [user.id, code]);
      
      logger.info('[UserService] 验证码查询结果', { rowCount: codeResult.rows.length, userId: user.id, code: code });
      
      if (codeResult.rows.length === 0) {
        // 增加验证码尝试次数
        // 注意：根据表结构约束，attempts 字段需要在合理的范围内
        await client.query('ROLLBACK');
        logger.warn('[UserService] 短信登录失败: 验证码无效或已过期', { 
          userId: user.id,
          phone,
          code
        });
        throw new Error('验证码无效或已过期');
      }
      
      const verificationRecord = codeResult.rows[0];

      // 3. 更新验证码状态为已使用
      const updateCodeQuery = `
        UPDATE two_factor_codes 
        SET is_used = TRUE, used_at = NOW() 
        WHERE id = $1
      `;
      
      await client.query(updateCodeQuery, [verificationRecord.id]);

      // 4. 生成JWT双令牌
      const tokenPair = generateTokenPair(user.id, {
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      });

      // 5. 创建用户会话
      const sessionToken = tokenPair.accessToken;
      const refreshToken = tokenPair.refreshToken;
      
      // 解析用户代理信息
      const deviceInfo = this.parseUserAgent(userAgent);
      
      // 设置会话过期时间（默认7天）
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const insertSessionQuery = `
        INSERT INTO user_sessions (
          user_id, session_token, refresh_token, device_info, 
          ip_address, user_agent, status, expires_at, last_accessed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW())
        RETURNING id, user_id, session_token, refresh_token, device_info, ip_address, user_agent, status, expires_at, created_at, last_accessed_at
      `;
      
      const sessionParams = [
        user.id,
        sessionToken,
        refreshToken,
        JSON.stringify(deviceInfo),
        ip || '0.0.0.0',
        userAgent || '',
        expiresAt
      ];
      
      const sessionResult = await client.query(insertSessionQuery, sessionParams);
      const session = sessionResult.rows[0];

      // 6. 更新用户登录信息
      const updateUserQuery = `
        UPDATE users 
        SET last_login_at = NOW(), last_login_ip = $1, failed_login_attempts = 0 
        WHERE id = $2
      `;
      
      await client.query(updateUserQuery, [ip, user.id]);

      // 7. 记录审计日志
      const auditLogQuery = `
        INSERT INTO audit_logs (
          table_name, operation, record_id, new_values,
          user_id, ip_address, user_agent
        ) VALUES (
          'users', 'INSERT', $1, $2,
          $3, $4, $5
        )
      `;
      
      const auditParams = [
        user.id,
        JSON.stringify({
          action: 'sms_login',
          phone: user.phone,
          success: true
        }),
        user.id,
        ip || '0.0.0.0',
        userAgent || ''
      ];
      
      await client.query(auditLogQuery, auditParams);

      // 提交事务
      await client.query('COMMIT');

      logger.info('[UserService] 短信登录成功', { 
        userId: user.id,
        phone
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            status: user.status,
            phone_verified: user.phone_verified,
            last_login_at: new Date(),
            created_at: user.created_at
          },
          tokens: {
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
            expiresIn: tokenPair.expiresIn,
            refreshExpiresIn: tokenPair.refreshExpiresIn
          },
          session: session
        },
        message: '登录成功'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[UserService] 短信登录失败', { 
        error: error.message,
        phone: loginData.phone 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 使用验证码重置密码
   * @param {string} email - 邮箱地址
   * @param {string} code - 验证码
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} 重置结果
   */
  async resetPasswordWithCode(email, code, newPassword) {
    const { pool } = require('../config/database');
    const client = await pool.connect();
    const bcrypt = require('bcrypt');
    
    try {
      logger.info('[UserService] 使用验证码重置密码', { email });
      
      // 验证输入
      if (!email || !code || !newPassword) {
        throw new Error('邮箱、验证码和新密码为必填项');
      }
      
      // 验证邮箱格式
      if (!this.isValidEmail(email)) {
        throw new Error('邮箱格式不正确');
      }
      
      // 验证验证码格式（6位数字）
      if (!/^\d{6}$/.test(code)) {
        throw new Error('验证码格式不正确');
      }
      
      // 验证新密码强度
      if (!this.isValidPassword(newPassword)) {
        throw new Error('新密码不符合安全要求（至少8位，包含大小写字母、数字和特殊字符）');
      }
      
      // 开始事务
      await client.query('BEGIN');
      
      // 1. 验证验证码是否有效
      const findCodeQuery = `
        SELECT id, email, code, code_type, expires_at, used_at
        FROM verification_codes
        WHERE email = $1
            AND code = $2
            AND code_type = 'password_reset'
            AND used_at IS NULL
            AND expires_at > NOW()
      `;
      
      const codeResult = await client.query(findCodeQuery, [email, code]);
      
      if (codeResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('验证码无效或已过期');
      }
      
      const verificationRecord = codeResult.rows[0];
      
      // 2. 标记验证码为已使用
      const updateCodeQuery = `
        UPDATE verification_codes 
        SET used_at = NOW()
        WHERE id = $1 AND used_at IS NULL
      `;
      
      await client.query(updateCodeQuery, [verificationRecord.id]);
      
      // 3. 获取用户信息
      const userQuery = `SELECT id, status FROM users WHERE email = $1`;
      const userResult = await client.query(userQuery, [email]);
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('用户不存在');
      }
      
      const user = userResult.rows[0];
      
      // 4. 检查用户状态
      if (user.status !== 'active') {
        await client.query('ROLLBACK');
        throw new Error('用户状态不正确，无法重置密码');
      }
      
      // 5. 加密新密码
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // 6. 更新用户密码
      const updateUserQuery = `
        UPDATE users 
        SET 
            password_hash = $1,
            password_changed_at = NOW(),
            updated_at = NOW()
        WHERE email = $2
      `;
      
      await client.query(updateUserQuery, [newPasswordHash, email]);
      
      // 7. 记录审计日志
      const insertLogQuery = `
        INSERT INTO audit_logs (
            table_name, operation, record_id, new_values,
            user_id, ip_address, user_agent
        ) VALUES (
            'users', 'UPDATE', $1, $2,
            $3, $4::inet, $5
        )
      `;
      
      const logValues = [
        user.id,
        JSON.stringify({
          password_changed: true,
          password_changed_at: new Date().toISOString()
        }),
        user.id, 
        '127.0.0.1', 
        'API Request'
      ];
      
      await client.query(insertLogQuery, logValues);
      
      // 8. 批量清理已使用的验证码
      const deleteOldCodesQuery = `
        DELETE FROM verification_codes 
        WHERE email = $1 
            AND code_type = 'password_reset'
            AND (used_at IS NOT NULL OR expires_at <= NOW())
      `;
      
      await client.query(deleteOldCodesQuery, [email]);
      
      // 提交事务
      await client.query('COMMIT');
      
      logger.info('[UserService] 使用验证码密码重置成功', { 
        userId: user.id,
        email: email,
        codeId: verificationRecord.id
      });
      
      return {
        success: true,
        message: '密码重置成功，请使用新密码登录'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[UserService] 使用验证码重置密码失败', { 
        error: error.message,
        email 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 验证访问令牌有效性
   * @param {Object} validationData - 验证数据
   * @returns {Promise<Object>} 验证结果
   */
  async validateToken(validationData) {
    const { pool } = require('../config/database');
    const client = await pool.connect();
    const { verifyTokenWithBlacklist } = require('../config/jwtManager');
    
    try {
      logger.info('[UserService] 令牌验证开始');

      let { sessionToken, accessToken } = validationData;
      const token = accessToken || sessionToken;

      // 验证必填字段
      if (!sessionToken) {
        throw new Error('访问令牌为必填项');
      }

      // 1. 首先通过 JWT 和黑名单验证（处理宽限期）
      let decoded;
      try {
        decoded = await verifyTokenWithBlacklist(token);
      } catch (jwtError) {
        logger.warn('[UserService] JWT 验证未通过', { error: jwtError.message });
        throw new Error('令牌无效或已过期');
      }

      // 开始事务
      await client.query('BEGIN');

      // 2. 验证访问令牌有效性 - 查询 user_sessions 表
      // 允许两种情况：
      // a) session_token 匹配且 session 为 active
      // b) 如果 session_token 不匹配，但 decoded 成功且在黑名单宽限期内（通过 verifyTokenWithBlacklist 已验证），
      //    我们需要找到该用户当前活跃的 session
      
      const findSessionQuery = `
        SELECT us.id, us.user_id, us.status, us.expires_at, us.last_accessed_at, us.session_token,
               u.id as user_id, u.username, u.email, u.nickname, u.status as user_status, 
               u.two_factor_enabled, u.locked_until
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE (us.session_token = $1 OR (u.id = $2 AND us.status = 'active'))
          AND us.status = 'active'
          AND us.expires_at > NOW()
          AND u.status = 'active'
          AND (u.locked_until IS NULL OR u.locked_until < NOW())
        ORDER BY (us.session_token = $1) DESC -- 优先匹配当前的 token
        LIMIT 1
      `;
      
      const sessionResult = await client.query(findSessionQuery, [sessionToken, decoded.userId]);
      
      if (sessionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        logger.warn('[UserService] 数据库中未找到有效会话', { userId: decoded.userId });
        throw new Error('令牌无效或已过期');
      }
      
      const session = sessionResult.rows[0];
      
      // 如果 token 不匹配，说明它是旧 token 但处于宽限期内
      if (session.session_token !== sessionToken) {
        logger.info('[UserService] 使用宽限期内的旧访问令牌验证成功', { 
          userId: decoded.userId,
          currentSessionId: session.id 
        });
      }

      const user = {
        id: session.user_id,
        username: session.username,
        email: session.email,
        nickname: session.nickname,
        status: session.user_status,
        two_factor_enabled: session.two_factor_enabled,
        locked_until: session.locked_until
      };

      // 3. 更新会话最后访问时间
      const updateSessionQuery = `
        UPDATE user_sessions 
        SET last_accessed_at = NOW() 
        WHERE id = $1
      `;
      
      await client.query(updateSessionQuery, [session.id]);

      // 提交事务
      await client.query('COMMIT');

      logger.info('[UserService] 令牌验证成功', { 
        userId: user.id,
        sessionId: session.id
      });

      return {
        success: true,
        data: {
          user: user,
          session: {
            id: session.id,
            status: session.status,
            expires_at: session.expires_at,
            last_accessed_at: session.last_accessed_at,
            sessionToken: session.session_token // 返回最新的 session_token
          }
        },
        message: '验证成功'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[UserService] 令牌验证失败', { 
        error: error.message,
        sessionToken: validationData.sessionToken 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 生成TOTP两步验证密钥
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 密钥信息
   */
  async generateTotpSecret(userId) {
    try {
      logger.info('[UserService] 生成TOTP密钥', { userId });

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const secretInfo = this.totpService.generateSecret('AccountingSystem', user.username);
      
      const qrCode = await this.totpService.generateQRCode(secretInfo.otpauthUrl);
      const backupCodes = this.totpService.generateBackupCodes();

      logger.info('[UserService] TOTP密钥生成成功', { userId });

      return {
        success: true,
        data: {
          secret: secretInfo.secret,
          qrCode: qrCode,
          backupCodes: backupCodes,
          appName: 'AccountingSystem',
          username: user.username
        },
        message: 'TOTP密钥生成成功'
      };
    } catch (error) {
      logger.error('[UserService] 生成TOTP密钥失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 启用TOTP两步验证
   * @param {number} userId - 用户ID
   * @param {Object} enableData - 启用数据
   * @returns {Promise<Object>} 启用结果
   */
  async enableTotpAuth(userId, enableData) {
    try {
      const { secret, code, backupCodes } = enableData;
      logger.info('[UserService] 启用TOTP两步验证', { userId });

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const isValid = this.totpService.verifyToken(secret, code);
      if (!isValid) {
        throw new Error('验证码无效');
      }

      const existingAuth = await this.twoFactorRepository.getTwoFactorAuthByUserId(userId);
      if (existingAuth) {
        await this.twoFactorRepository.updateTwoFactorAuth(existingAuth.id, {
          secretKey: secret,
          backupCodes: backupCodes,
          isEnabled: true
        });
      } else {
        await this.twoFactorRepository.createTwoFactorAuth({
          userId: userId,
          secretKey: secret,
          backupCodes: backupCodes,
          isEnabled: true
        });
      }

      await this.userRepository.update(userId, {
        two_factor_enabled: true
      });

      logger.info('[UserService] TOTP两步验证启用成功', { userId });

      return {
        success: true,
        data: {
          userId,
          enabled: true
        },
        message: 'TOTP两步验证已启用'
      };
    } catch (error) {
      logger.error('[UserService] 启用TOTP两步验证失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 禁用TOTP两步验证
   * @param {number} userId - 用户ID
   * @param {Object} disableData - 禁用数据
   * @returns {Promise<Object>} 禁用结果
   */
  async disableTotpAuth(userId, disableData) {
    try {
      const { code } = disableData;
      logger.info('[UserService] 禁用TOTP两步验证', { userId });

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const auth = await this.twoFactorRepository.getTwoFactorAuthByUserId(userId);
      if (!auth || !auth.isEnabled) {
        throw new Error('两步验证未启用');
      }

      const isValid = this.totpService.verifyToken(auth.secretKey, code);
      if (!isValid) {
        const isBackupCodeValid = this.totpService.verifyBackupCode(auth.backupCodes, code);
        if (!isBackupCodeValid) {
          throw new Error('验证码无效');
        }
      }

      await this.twoFactorRepository.deleteTwoFactorAuth(userId);
      await this.userRepository.update(userId, {
        two_factor_enabled: false
      });

      logger.info('[UserService] TOTP两步验证禁用成功', { userId });

      return {
        success: true,
        data: {
          userId,
          enabled: false
        },
        message: 'TOTP两步验证已禁用'
      };
    } catch (error) {
      logger.error('[UserService] 禁用TOTP两步验证失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 验证TOTP两步验证码
   * @param {number} userId - 用户ID
   * @param {string} code - 验证码
   * @param {string} secret - 可选的密钥，用于启用过程中验证
   * @returns {Promise<Object>} 验证结果
   */
  async verifyTotpCode(userId, code, secret = null) {
    try {
      logger.info('[UserService] 验证TOTP两步验证码', { userId });

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      let secretKey = secret;
      let auth = null;

      if (!secretKey) {
        auth = await this.twoFactorRepository.getTwoFactorAuthByUserId(userId);
        if (!auth || !auth.isEnabled) {
          throw new Error('两步验证未启用');
        }
        secretKey = auth.secretKey;
      }

      const isValid = this.totpService.verifyToken(secretKey, code);
      if (!isValid) {
        if (auth) {
          const isBackupCodeValid = this.totpService.verifyBackupCode(auth.backupCodes, code);
          if (!isBackupCodeValid) {
            await this.twoFactorRepository.incrementVerificationAttempts(userId);
            throw new Error('验证码无效');
          }
        } else {
          throw new Error('验证码无效');
        }
      }

      if (auth) {
        await this.twoFactorRepository.resetVerificationAttempts(userId);
        await this.twoFactorRepository.updateTwoFactorAuth(auth.id, {
          lastUsedAt: new Date()
        });
      }

      logger.info('[UserService] TOTP两步验证码验证成功', { userId });

      return {
        success: true,
        data: {
          userId,
          verified: true
        },
        message: '验证成功'
      };
    } catch (error) {
      logger.error('[UserService] 验证TOTP两步验证码失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 获取TOTP两步验证状态
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 状态信息
   */
  async getTotpStatus(userId) {
    try {
      logger.info('[UserService] 获取TOTP两步验证状态', { userId });

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const auth = await this.twoFactorRepository.getTwoFactorAuthByUserId(userId);

      logger.info('[UserService] 获取TOTP两步验证状态成功', { userId });

      return {
        success: true,
        data: {
          userId,
          enabled: auth ? auth.isEnabled : false,
          createdAt: auth ? auth.createdAt : null,
          lastUsedAt: auth ? auth.lastUsedAt : null
        },
        message: '获取TOTP两步验证状态成功'
      };
    } catch (error) {
      logger.error('[UserService] 获取TOTP两步验证状态失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * 重新生成备用码
   * @param {number} userId - 用户ID
   * @param {Object} regenerateData - 重新生成数据
   * @returns {Promise<Object>} 重新生成结果
   */
  async regenerateBackupCodes(userId, regenerateData) {
    try {
      const { code } = regenerateData;
      logger.info('[UserService] 重新生成备用码', { userId });

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const auth = await this.twoFactorRepository.getTwoFactorAuthByUserId(userId);
      if (!auth || !auth.isEnabled) {
        throw new Error('两步验证未启用');
      }

      const isValid = this.totpService.verifyToken(auth.secretKey, code);
      if (!isValid) {
        throw new Error('验证码无效');
      }

      const newBackupCodes = this.totpService.generateBackupCodes();
      await this.twoFactorRepository.updateTwoFactorAuth(auth.id, {
        backupCodes: newBackupCodes
      });

      logger.info('[UserService] 备用码重新生成成功', { userId });

      return {
        success: true,
        data: {
          userId,
          backupCodes: newBackupCodes
        },
        message: '备用码已重新生成'
      };
    } catch (error) {
      logger.error('[UserService] 重新生成备用码失败', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }
}

module.exports = UserService;
