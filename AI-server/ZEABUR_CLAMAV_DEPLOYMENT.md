# ClamAV 在 Zeabur 上的完整部署指南

## 🚀 推荐方案：使用在线病毒扫描服务

### 为什么不安装本地 ClamAV？
- **Zeabur 是无服务器平台**，不支持长时间运行的进程
- **ClamAV 需要大量内存**来加载病毒库
- **启动时间过长**，影响用户体验
- **病毒库更新复杂**

---

## 📋 完整部署步骤

### 第一步：获取 VirusTotal API 密钥

#### 1.1 注册 VirusTotal 账户
1. 访问 [https://www.virustotal.com/](https://www.virustotal.com/)
2. 点击 "Join" 注册免费账户
3. 验证邮箱并登录

#### 1.2 获取 API 密钥
1. 登录后，点击右上角头像
2. 选择 "API key"
3. 点击 "Create API key"
4. 复制你的 API 密钥（格式类似：`abc123def456ghi789`）

#### 1.3 API 配额说明
- **免费版**：每分钟 4 次请求，每天 500 次
- **付费版**：无限制，$30/月起

### 第二步：配置 Zeabur 环境变量

#### 2.1 在项目根目录创建 `.env.zeabur` 文件
```env
# ClamAV 配置 - 使用在线扫描服务
CLAMAV_MODE=virus_total
CLAMAV_ONLINE_ENABLED=true
CLAMAV_ENABLED=true
CLAMAV_LOCAL_ENABLED=false

# VirusTotal API 配置
CLAMAV_VIRUS_TOTAL_API_KEY=你的_VirusTotal_API_密钥

# 文件大小限制 (10MB)
CLAMAV_MAX_FILE_SIZE=10485760

# 扫描超时 (30秒)
CLAMAV_SCAN_TIMEOUT=30000

# 服务器配置
PORT=4000
NODE_ENV=production
```

#### 2.2 在 Zeabur 控制台中设置环境变量
1. 登录 [Zeabur](https://zeabur.com)
2. 选择你的项目
3. 进入 "Environment Variables" 设置页面
4. 添加上述环境变量

### 第三步：更新代码集成

#### 3.1 确保 virusScanner.js 已更新
检查你的 `middleware/virusScanner.js` 是否包含以下功能：
- ✅ 支持 `virus_total` 模式
- ✅ 错误处理和重试机制
- ✅ 文件大小限制
- ✅ 日志记录

#### 3.2 在文件上传路由中集成病毒扫描
更新 `routes/upload.js`：
```javascript
const virusScanner = require('../middleware/virusScanner.js');

// 在文件上传处理中添加病毒扫描
const uploadWithVirusScan = async (req, res) => {
  try {
    const files = req.files;
    
    // 调用病毒扫描
    const scanResult = await virusScanner.virusScanner.scanFiles(files.map(f => f.path));
    
    if (scanResult.hasInfected) {
      // 删除感染的文件并返回错误
      await cleanupFiles(files.map(f => f.path));
      return res.status(400).json({
        success: false,
        message: '检测到病毒文件，上传被拒绝',
        viruses: scanResult.infectedFiles
      });
    }
    
    // 继续正常处理...
    
  } catch (error) {
    console.error('病毒扫描错误:', error);
    res.status(500).json({
      success: false,
      message: '病毒扫描服务暂时不可用，请稍后重试'
    });
  }
};
```

### 第四步：部署到 Zeabur

#### 4.1 提交代码到 Git
```bash
git add .
git commit -m "添加病毒扫描功能，支持 Zeabur 部署"
git push origin main
```

#### 4.2 在 Zeabur 上部署
1. **自动部署**：Zeabur 会自动检测到代码变更
2. **手动部署**：在 Zeabur 控制台点击 "Deploy"

#### 4.3 验证部署
访问你的应用，检查：
- ✅ 应用正常启动
- ✅ 没有 ClamAV 相关错误日志
- ✅ 文件上传功能正常

---

## 🔧 故障排除

### 常见问题

#### 1. API 密钥无效
**症状**：返回 401 未授权错误
**解决**：检查 API 密钥是否正确，是否超过配额

#### 2. 文件上传失败
**症状**：上传任何文件都返回错误
**解决**：
- 检查环境变量是否正确设置
- 查看日志中的具体错误信息
- 确保 API 密钥有足够配额

#### 3. 扫描超时
**症状**：文件上传响应很慢
**解决**：
- 减少文件大小限制
- 增加超时时间
- 检查网络连接

### 调试模式
在 `.env.zeabur` 中添加：
```env
LOG_LEVEL=debug
CLAMAV_DEBUG=true
```

---

## 📊 性能监控

### 监控指标
- **扫描成功率**：应 > 95%
- **平均扫描时间**：< 5秒
- **API 调用次数**：监控是否接近配额

### 日志分析
Zeabur 日志中会包含：
```
[VIRUS-SCAN] 开始扫描文件: user-upload.pdf
[VIRUS-SCAN] 使用 VirusTotal API 扫描
[VIRUS-SCAN] ✅ 文件安全: user-upload.pdf
```

---

## 💡 进阶配置

### 1. 多重扫描服务
可以同时配置多个扫描服务作为备选：
```env
CLAMAV_MODE=hybrid
CLAMAV_PRIMARY_SERVICE=virus_total
CLAMAV_BACKUP_SERVICE=hybrid_analysis
```

### 2. 白名单配置
为可信任文件类型创建白名单：
```env
CLAMAV_WHITELIST_EXTENSIONS=jpg,png,gif,pdf,txt
```

### 3. 缓存优化
为重复文件启用结果缓存：
```env
CLAMAV_CACHE_ENABLED=true
CLAMAV_CACHE_TTL=3600
```

---

## 🎯 最佳实践

### 1. 安全性
- 🔒 定期更换 API 密钥
- 🔒 监控异常上传行为
- 🔒 设置合理的文件大小限制

### 2. 性能
- ⚡ 启用文件类型过滤
- ⚡ 使用文件哈希缓存
- ⚡ 异步处理扫描结果

### 3. 成本控制
- 💰 设置合理的 API 调用频率
- 💰 实施用户上传配额限制
- 💰 监控 API 使用成本

---

## 📞 技术支持

如果遇到问题，请：
1. 检查 Zeabur 日志
2. 验证 API 密钥和配额
3. 测试网络连接
4. 查看错误详细信息

你的项目现在已经具备了完整的病毒扫描功能，可以在 Zeabur 上安全运行！🛡️