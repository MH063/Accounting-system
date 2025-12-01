# 安全最佳实践文档

## 敏感信息保护指南

### 🚨 重要提醒
本文档定义了项目中敏感信息的分类、保护措施和最佳实践，防止敏感信息泄露。

### 敏感信息分类

#### 高敏感信息 (High Risk)
- **JWT密钥和认证令牌**
- **数据库连接字符串**
- **API密钥和私钥**
- **用户密码哈希**

#### 中敏感信息 (Medium Risk)
- **会话密钥**
- **加密盐值**
- **第三方服务配置**
- **系统配置参数**

#### 低敏感信息 (Low Risk)
- **应用程序ID**
- **非敏感的环境变量**
- **公共配置信息**

### 文件保护规则

#### 严格禁止提交的文件类型
```
# 绝对不允许提交
*.key              # 所有密钥文件
*.pem              # PEM格式证书
*.p12              # PKCS12证书包
*.pfx              # PKCS#12证书包
*.jks              # Java密钥库
secrets.json       # 密钥配置文件
passwords.txt      # 密码文件
config/secrets.js  # 密钥配置
```

#### 必须在.gitignore中保护的目录
```
# 敏感数据目录
data/              # 数据文件（包含*.json文件）
security-reports/  # 安全报告
audit-reports/     # 审计报告
backup/           # 备份文件

# 环境变量文件
.env*             # 所有环境变量文件

# 日志文件（可能包含敏感信息）
logs/             # 日志目录
*.log            # 日志文件
```

### 开发环境配置

#### 1. 环境变量文件管理
```bash
# 允许的环境变量文件模板
.env.example      # 提供模板
.env.local        # 本地开发（已忽略）
.env.development  # 开发环境（已忽略）
.env.production   # 生产环境（已忽略）
```

#### 2. 数据库配置
```javascript
// ✅ 正确的数据库配置
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD, // 从环境变量获取
    database: process.env.DB_NAME
};

// ❌ 错误的硬编码配置
const dbConfig = {
    host: 'localhost',
    username: 'admin',
    password: 'hardcoded_password' // 禁止！
};
```

#### 3. JWT配置管理
```javascript
// ✅ 正确的JWT配置
const jwtConfig = {
    secret: process.env.JWT_SECRET, // 从环境变量获取
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER
};

// ❌ 错误的硬编码配置
const jwtConfig = {
    secret: 'hardcoded_jwt_secret_key' // 禁止！
};
```

### 安全检查清单

#### 代码提交前检查
- [ ] 检查是否包含硬编码密码
- [ ] 确认.env文件已被.gitignore忽略
- [ ] 验证API密钥和令牌不在代码中
- [ ] 检查日志文件是否包含敏感信息
- [ ] 确认敏感配置文件未提交

#### 定期安全审计
- [ ] 运行敏感信息检测工具
- [ ] 检查git历史记录
- [ ] 更新.gitignore配置
- [ ] 审查第三方依赖的安全性

### 工具和检测

#### 1. GitGuardian集成
```bash
# 在CI/CD中集成GitGuardian扫描
# .github/workflows/security.yml
- name: Run GitGuardian scan
  uses: GitGuardian/ggshield-action@v1.25.0
  env:
    GITHUB_PUSH_BEFORE_SHA: ${{ github.event.before }}
    GITHUB_PUSH_BASE_SHA: ${{ github.event.base }}
    GITHUB_PULL_BASE_SHA: ${{ github.event.pull_request.base.sha }}
    GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}
```

#### 2. 自定义检测脚本
```bash
#!/bin/bash
# scripts/security-check.sh

echo "🔍 检查敏感信息..."

# 检测JWT密钥
if grep -r "jwt.*secret" . --exclude-dir=node_modules --exclude="*.md"; then
    echo "⚠️ 发现JWT密钥相关代码，请检查！"
    exit 1
fi

# 检测API密钥
if grep -r "api.*key\|API_KEY" . --exclude-dir=node_modules --exclude="*.md"; then
    echo "⚠️ 发现API密钥相关代码，请检查！"
    exit 1
fi

echo "✅ 未发现明显的敏感信息泄露"
```

### 应急响应

#### 敏感信息泄露处理步骤
1. **立即停止使用泄露的密钥**
2. **生成新的密钥对替换泄露的密钥**
3. **清理GitHub历史记录**
4. **更新相关服务的配置**
5. **通知相关团队成员**

#### GitHub历史记录清理
```bash
# 清理敏感文件的完整历史
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch sensitive-file.json' \
--prune-empty --tag-name-filter cat -- --all

# 强制推送清理后的历史
git push origin --force --all
```

### 团队培训

#### 开发人员安全培训要点
1. **永远不要在代码中硬编码敏感信息**
2. **始终使用环境变量管理配置**
3. **定期检查.gitignore配置**
4. **使用安全工具进行代码审查**
5. **及时更新密钥和令牌**

### 工具推荐

#### 敏感信息检测工具
- **GitGuardian**: GitHub集成敏感信息检测
- **TruffleHog**: 敏感信息扫描工具
- **gitleaks**: Git仓库敏感信息检测
- **detect-secrets**: 敏感信息检测插件

#### 代码审查工具
- **ESLint security plugins**: JavaScript安全检查
- **SonarQube**: 代码质量和安全分析
- **Snyk**: 依赖安全扫描

### 联系方式

如发现敏感信息泄露问题，请立即联系：
- 开发团队负责人
- 安全团队
- 使用项目安全问题报告流程

---
**更新日期**: 2024年12月
**版本**: 1.0
**维护人员**: 开发团队