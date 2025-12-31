/**
 * 版本管理路由
 * 统一管理所有版本相关的API接口
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// 获取版本信息的通用函数
const getVersionInfo = (jsonPath, defaultVersion = '1.0.0') => {
  try {
    const fullPath = path.join(__dirname, '..', jsonPath);
    console.log(`[Version] 尝试读取文件: ${fullPath}`)
    console.log(`[Version] 文件存在: ${fs.existsSync(fullPath)}`)
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      console.log(`[Version] 文件内容: ${content}`)
      const data = JSON.parse(content);
      return {
        version: data.version || defaultVersion,
        name: data.name || '记账管理系统',
        buildTime: data.buildTime || new Date().toISOString()
      };
    }
  } catch (e) {
    console.warn(`[Version] 无法读取版本文件 ${jsonPath}: ${e.message}`);
  }
  return {
    version: defaultVersion,
    name: '记账管理系统',
    buildTime: new Date().toISOString()
  };
};

// 获取后端版本 - GET /api/version/backend
router.get('/backend', (req, res) => {
  const info = getVersionInfo('public/backend-version.json', '1.0.0');
  res.json({
    success: true,
    data: info
  });
});

// 获取管理端版本 - GET /api/version/admin
router.get('/admin', (req, res) => {
  const info = getVersionInfo('../AI-admin/public/version.json', '1.0.0');
  res.json({
    success: true,
    data: info
  });
});

// 获取客户端版本 - GET /api/version/client
router.get('/client', (req, res) => {
  const info = getVersionInfo('../AI-web/public/client-version.json', '1.0.0');
  res.json({
    success: true,
    data: info
  });
});

module.exports = router;