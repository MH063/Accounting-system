/**
 * 测试实际病毒扫描模块
 */

const fs = require('fs');
const path = require('path');

// 尝试导入我们的病毒扫描模块
let virusScanner;

try {
  const virusScannerModule = require('./middleware/virusScanner.js');
  
  // 检查导出的结构
  console.log('🔍 病毒扫描模块导出结构:');
  console.log('- 模块类型:', typeof virusScannerModule);
  
  if (virusScannerModule.virusScanner) {
    console.log('- 有virusScanner对象');
    virusScanner = virusScannerModule.virusScanner;
  } else {
    console.log('- 直接导出函数');
    virusScanner = virusScannerModule;
  }
  
  // 列出可用的函数
  console.log('\n📋 可用的扫描函数:');
  Object.keys(virusScanner).forEach(key => {
    if (typeof virusScanner[key] === 'function') {
      console.log(`  - ${key}()`);
    }
  });

} catch (error) {
  console.error('❌ 导入病毒扫描模块失败:', error.message);
  console.log('\n💡 请确保环境变量配置正确');
  console.log('- 在 .env 文件中设置: CLAMAV_MODE=simulate');
  process.exit(1);
}

// 运行基本功能测试
const runModuleTest = async () => {
  console.log('\n🛡️  病毒扫描模块功能测试\n');

  try {
    // 创建测试文件
    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const safeFile = path.join(testDir, 'module-test.txt');
    fs.writeFileSync(safeFile, '这是用于模块测试的安全文件');

    console.log('📝 测试文件创建:', safeFile);

    // 测试初始化
    console.log('\n🔧 测试初始化...');
    try {
      const initResult = await virusScanner.initClamAV();
      console.log('  - 初始化结果:', initResult.success ? '成功 ✅' : '失败 ❌');
      if (initResult.engine) {
        console.log('  - 扫描引擎:', initResult.engine);
      }
    } catch (error) {
      console.log('  - 初始化失败（模拟模式）:', error.message);
    }

    // 测试单个文件扫描
    console.log('\n🔎 测试单个文件扫描...');
    try {
      const scanResult = await virusScanner.scanFile(safeFile);
      console.log('  - 扫描结果:', scanResult.isInfected ? '感染 🚨' : '安全 ✅');
      console.log('  - 扫描时间:', scanResult.scanTime);
      console.log('  - 检测到的病毒:', scanResult.viruses.length > 0 ? scanResult.viruses.join(', ') : '无');
    } catch (error) {
      console.log('  - 扫描失败:', error.message);
    }

    // 测试扫描信息
    console.log('\n📊 测试获取扫描信息...');
    try {
      const scanInfo = await virusScanner.getScanInfo();
      console.log('  - 扫描引擎信息:', scanInfo);
    } catch (error) {
      console.log('  - 获取信息失败:', error.message);
    }

    // 清理测试文件
    try {
      fs.unlinkSync(safeFile);
      console.log('\n🧹 测试文件清理完成');
    } catch (error) {
      console.warn('⚠️  清理失败:', error.message);
    }

    console.log('\n✅ 模块功能测试完成');
    console.log('\n🚀 Zeabur部署建议:');
    console.log('1. ✅ 模块已支持模拟模式，可在任何环境运行');
    console.log('2. 🔧 配置环境变量 CLAMAV_MODE=simulate 用于测试');
    console.log('3. 🌐 配置 CLAMAV_MODE=virus_total 使用在线扫描');
    console.log('4. 📖 详细配置请查看 CLAMAV_DEPLOYMENT.md');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  }
};

// 运行测试
runModuleTest();