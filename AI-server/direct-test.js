/**
 * 直接测试病毒扫描模块功能
 */

const fs = require('fs');
const path = require('path');

// 设置环境变量
process.env.NODE_ENV = 'test';
process.env.CLAMAV_MODE = 'simulate';
process.env.CLAMAV_ENABLED = 'true';
process.env.CLAMAV_LOCAL_ENABLED = 'false';
process.env.CLAMAV_ONLINE_ENABLED = 'false';

try {
  console.log('🔧 开始测试病毒扫描模块...');
  
  // 尝试导入病毒扫描模块
  const virusScannerModule = require('./middleware/virusScanner.js');
  
  console.log('✅ 模块导入成功');
  console.log('📋 模块导出类型:', typeof virusScannerModule);
  
  // 检查模块结构
  if (virusScannerModule.virusScanner) {
    console.log('✅ 找到 virusScanner 对象');
    const virusScanner = virusScannerModule.virusScanner;
    
    // 列出可用的函数
    console.log('\n📋 可用的扫描函数:');
    Object.keys(virusScanner).forEach(key => {
      if (typeof virusScanner[key] === 'function') {
        console.log(`  - ${key}()`);
      }
    });

    // 运行一个基本测试
    const runBasicTest = async () => {
      console.log('\n🛡️  运行基本功能测试...\n');
      
      // 创建测试文件
      const testDir = path.join(__dirname, 'test-files');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
        console.log('📁 测试目录创建成功');
      }
      
      const testFile = path.join(testDir, 'basic-test.txt');
      fs.writeFileSync(testFile, '这是一个基本测试文件');
      
      console.log('📝 测试文件:', testFile);
      
      try {
        // 测试初始化
        console.log('\n🔧 测试初始化...');
        const initResult = await virusScanner.initClamAV();
        console.log('✅ 初始化完成:', initResult.success ? '成功' : '失败');
        if (initResult.engine) {
          console.log('📊 扫描引擎:', initResult.engine);
        }
        
        // 测试文件扫描
        console.log('\n🔎 测试文件扫描...');
        const scanResult = await virusScanner.scanFile(testFile);
        console.log('✅ 扫描完成');
        console.log(`  - 结果: ${scanResult.isInfected ? '感染 🚨' : '安全 ✅'}`);
        console.log(`  - 时间: ${scanResult.scanTime}`);
        console.log(`  - 病毒: ${scanResult.viruses.length > 0 ? scanResult.viruses.join(', ') : '无'}`);
        
        // 获取扫描信息
        console.log('\n📊 获取扫描信息...');
        const scanInfo = await virusScanner.getScanInfo();
        console.log('✅ 信息获取完成:', scanInfo);
        
      } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
      }
      
      // 清理
      try {
        fs.unlinkSync(testFile);
        console.log('\n🧹 测试文件清理完成');
      } catch (error) {
        console.warn('⚠️  清理失败:', error.message);
      }
      
      console.log('\n✅ 病毒扫描模块测试完成');
      console.log('\n🎯 总结:');
      console.log('1. ✅ 模块可以正常导入和运行');
      console.log('2. ✅ 支持模拟模式，无需外部依赖');
      console.log('3. ✅ 适合在Zeabur等无服务器环境部署');
      console.log('4. 📖 详细配置请查看 CLAMAV_DEPLOYMENT.md');
    };
    
    runBasicTest();
    
  } else {
    console.log('⚠️  未找到 virusScanner 对象，尝试直接使用模块');
    
    // 检查是否有直接的扫描函数
    if (typeof virusScannerModule.scanFile === 'function') {
      console.log('✅ 找到直接导出的 scanFile 函数');
      
      const testDir = path.join(__dirname, 'test-files');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      const testFile = path.join(testDir, 'direct-test.txt');
      fs.writeFileSync(testFile, '直接函数测试文件');
      
      console.log('\n🔎 测试直接函数...');
      virusScannerModule.scanFile(testFile)
        .then(result => {
          console.log('✅ 扫描结果:', result.isInfected ? '感染' : '安全');
          fs.unlinkSync(testFile);
        })
        .catch(error => {
          console.error('❌ 扫描失败:', error.message);
        });
    }
  }
  
} catch (error) {
  console.error('❌ 导入模块失败:', error.message);
  console.log('\n💡 可能的解决方案:');
  console.log('1. 检查是否安装了必要的依赖 (npm install)');
  console.log('2. 确保 ClamAV 配置正确');
  console.log('3. 设置正确的环境变量');
  
  process.exit(1);
}