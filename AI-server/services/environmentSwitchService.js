/**
 * 环境切换服务
 * 用于动态修改 NODE_ENV 并优雅重启服务
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ENV_FILE = path.join(__dirname, '../.env');
const SERVER_SCRIPT = 'server.js';
const LOG_FILE = path.join(__dirname, 'logs', 'environment-switch.log');

const ENVIRONMENTS = {
  development: {
    name: '开发环境',
    description: '功能完整，日志详细，适合调试',
    features: ['完整错误堆栈', '详细日志', '无速率限制', '热重载支持']
  },
  testing: {
    name: '测试环境',
    description: '模拟生产配置，用于集成测试',
    features: ['简化错误信息', '中等日志', '基本速率限制', '缓存启用']
  },
  production: {
    name: '生产环境',
    description: '性能优化，安全增强',
    features: ['安全错误处理', '最小日志', '严格速率限制', '性能优化']
  }
};

/**
 * 记录日志
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  
  // 控制台输出
  console.log(logMessage);
  
  // 文件日志
  try {
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (err) {
    console.error('写入日志失败:', err.message);
  }
}

/**
 * 读取当前环境配置
 */
function getCurrentEnvironment() {
  try {
    if (fs.existsSync(ENV_FILE)) {
      const content = fs.readFileSync(ENV_FILE, 'utf8');
      const match = content.match(/NODE_ENV=(\S+)/);
      if (match) {
        return match[1];
      }
    }
  } catch (err) {
    log(`读取环境配置失败: ${err.message}`, 'error');
  }
  return 'development';
}

/**
 * 更新 .env 文件中的 NODE_ENV
 */
function updateEnvironment(newEnv) {
  return new Promise((resolve, reject) => {
    try {
      if (!ENVIRONMENTS[newEnv]) {
        return reject(new Error(`不支持的环境: ${newEnv}`));
      }

      let content = '';
      if (fs.existsSync(ENV_FILE)) {
        content = fs.readFileSync(ENV_FILE, 'utf8');
      }

      // 检查是否已存在 NODE_ENV（兼容 Windows 的 \r\n 换行符）
      const envRegex = /^NODE_ENV=.*$/m;
      const timestamp = new Date().toISOString();
      const username = process.env.USER || 'system';

      if (envRegex.test(content)) {
        // 更新现有配置
        content = content.replace(envRegex, `NODE_ENV=${newEnv}`);
        log(`更新 NODE_ENV: ${newEnv} (由 ${username} 在 ${timestamp} 修改)`, 'warn');
      } else {
        // 添加新配置
        content = `# 环境切换 - ${timestamp}\nNODE_ENV=${newEnv}\n\n` + content;
        log(`设置 NODE_ENV: ${newEnv} (由 ${username} 在 ${timestamp} 创建)`, 'warn');
      }

      fs.writeFileSync(ENV_FILE, content, 'utf8');
      log(`.env 文件已更新: NODE_ENV=${newEnv}`, 'success');
      
      resolve({
        success: true,
        oldEnv: getCurrentEnvironment(),
        newEnv: newEnv,
        message: `环境已切换为 ${ENVIRONMENTS[newEnv].name}`
      });
    } catch (err) {
      log(`更新环境配置失败: ${err.message}`, 'error');
      reject(err);
    }
  });
}

/**
 * 获取进程ID
 */
function getServerPid() {
  try {
    const pidFile = path.join(__dirname, '.server.pid');
    if (fs.existsSync(pidFile)) {
      const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim());
      try {
        // 检查进程是否存在
        process.kill(pid, 0);
        return pid;
      } catch (e) {
        // 进程不存在
        fs.unlinkSync(pidFile);
      }
    }
  } catch (err) {
    log(`获取进程ID失败: ${err.message}`, 'error');
  }
  return null;
}

/**
 * 保存进程ID
 */
function saveServerPid(pid) {
  try {
    const pidFile = path.join(__dirname, '.server.pid');
    fs.writeFileSync(pidFile, pid.toString());
  } catch (err) {
    log(`保存进程ID失败: ${err.message}`, 'error');
  }
}

/**
 * 优雅关闭当前服务
 */
function shutdownServer() {
  return new Promise((resolve) => {
    const pid = getServerPid();
    
    if (!pid) {
      log('未找到运行中的服务器进程', 'warn');
      return resolve({ success: true, message: '无运行中的进程' });
    }

    log(`正在关闭服务器进程 (PID: ${pid})...`, 'info');

    // 发送 SIGTERM 信号
    try {
      process.kill(pid, 'SIGTERM');
      
      // 等待进程关闭
      let waitCount = 0;
      const maxWait = 30; // 最多等待30秒
      
      const checkInterval = setInterval(() => {
        waitCount++;
        try {
          process.kill(pid, 0);
        } catch (e) {
          // 进程已关闭
          clearInterval(checkInterval);
          log(`服务器进程已关闭`, 'success');
          
          // 清理 PID 文件
          try {
            const pidFile = path.join(__dirname, '.server.pid');
            if (fs.existsSync(pidFile)) {
              fs.unlinkSync(pidFile);
            }
          } catch (err) {
            // 忽略错误
          }
          
          resolve({ success: true, message: '服务器已关闭' });
        }
        
        if (waitCount >= maxWait) {
          clearInterval(checkInterval);
          log(`等待超时，强制终止进程`, 'warn');
          
          try {
            process.kill(pid, 'SIGKILL');
            resolve({ success: true, message: '服务器已强制关闭' });
          } catch (e) {
            resolve({ success: false, message: '关闭进程失败' });
          }
        }
      }, 1000);
      
    } catch (err) {
      log(`关闭服务器失败: ${err.message}`, 'error');
      resolve({ success: false, message: err.message });
    }
  });
}

/**
 * 启动服务
 */
function startServer() {
  return new Promise((resolve, reject) => {
    log(`正在启动服务器...`, 'info');
    
    const serverDir = __dirname;
    const child = spawn('node', [SERVER_SCRIPT], {
      cwd: serverDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      env: { ...process.env }
    });

    child.on('error', (err) => {
      log(`启动服务器失败: ${err.message}`, 'error');
      reject(err);
    });

    child.on('spawn', () => {
      const pid = child.pid;
      saveServerPid(pid);
      log(`服务器已启动 (PID: ${pid})`, 'success');
      resolve({ success: true, pid, message: '服务器启动成功' });
    });

    // 捕获标准输出
    child.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.includes('服务器已启动') || line.includes('API文档')) {
          log(`[SERVER] ${line}`, 'info');
        }
      });
    });

    // 捕获标准错误
    child.stderr.on('data', (data) => {
      log(`[SERVER ERROR] ${data.toString().trim()}`, 'error');
    });
  });
}

/**
 * 执行环境切换（只更新配置，重启由外部脚本处理）
 */
async function switchEnvironment(targetEnv, options = {}) {
  const {
    username = 'admin',
    reason = '环境切换',
    delay = 2000 // 延迟启动时间(ms)
  } = options;

  const startTime = Date.now();
  const currentEnv = getCurrentEnvironment();

  log(`========== 开始环境切换 ==========`);
  log(`当前环境: ${currentEnv} -> 目标环境: ${targetEnv}`);
  log(`操作人: ${username}, 原因: ${reason}`);

  // 验证目标环境
  if (!ENVIRONMENTS[targetEnv]) {
    throw new Error(`不支持的环境: ${targetEnv}`);
  }

  // 如果环境相同
  if (currentEnv === targetEnv) {
    log(`环境未改变，跳过切换`, 'info');
    return {
      success: true,
      message: `当前已是 ${ENVIRONMENTS[targetEnv].name}，无需切换`,
      environment: targetEnv,
      duration: 0
    };
  }

  const result = {
    success: false,
    oldEnv: currentEnv,
    newEnv: targetEnv,
    message: '',
    duration: 0
  };

  try {
    // 步骤1: 更新 .env 文件
    log(`步骤1: 更新环境配置...`);
    await updateEnvironment(targetEnv);

    // 步骤2: 生成重启命令
    const restartScript = path.join(__dirname, '..', 'restart-server.js');
    
    log(`步骤2: 准备重启服务...`);
    
    // 在后台启动重启脚本（作为独立进程）
    const restartChild = spawn('node', [restartScript, targetEnv], {
      cwd: path.dirname(restartScript),
      stdio: 'ignore',
      detached: true,
      env: { ...process.env, NODE_ENV: targetEnv }
    });
    
    restartChild.unref();
    
    log(`重启脚本已启动，将在新进程中执行`);
    
    result.success = true;
    result.message = `环境切换成功: ${ENVIRONMENTS[currentEnv].name} → ${ENVIRONMENTS[targetEnv].name}`;
    log(`环境切换完成，请等待服务重启...`, 'success');

  } catch (err) {
    result.message = `环境切换失败: ${err.message}`;
    log(`环境切换失败: ${err.message}`, 'error');
  }

  result.duration = Date.now() - startTime;
  log(`总耗时: ${result.duration}ms`);

  return result;
}

/**
 * 检查服务健康状态
 */
async function checkHealth(timeout = 10000) {
  const http = require('http');
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = setInterval(async () => {
      try {
        // 尝试连接本地服务
        const req = http.get('http://localhost:4000/api/health', (res) => {
          clearInterval(checkInterval);
          clearTimeout(timeoutHandle);
          resolve({
            success: true,
            statusCode: res.statusCode,
            responseTime: Date.now() - startTime
          });
        });
        
        req.on('error', (err) => {
          // 连接失败，继续检查
        });
        
        req.setTimeout(2000, () => {
          req.destroy();
        });
        
      } catch (err) {
        // 忽略错误，继续检查
      }
    }, 1000);

    // 超时处理
    const timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      resolve({
        success: false,
        message: '健康检查超时',
        responseTime: Date.now() - startTime
      });
    }, timeout);
  });
}

// 导出功能
module.exports = {
  switchEnvironment,
  updateEnvironment,
  shutdownServer,
  startServer,
  getCurrentEnvironment,
  checkHealth,
  ENVIRONMENTS
};

// 如果直接运行此脚本
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetEnv = args[0] || 'development';
  
  console.log('========================================');
  console.log('   环境切换脚本 - 记账管理系统');
  console.log('========================================');
  console.log(`目标环境: ${targetEnv}`);
  console.log('');
  
  switchEnvironment(targetEnv, { username: 'CLI' })
    .then(result => {
      console.log('');
      console.log('========================================');
      console.log(`结果: ${result.message}`);
      console.log(`耗时: ${result.duration}ms`);
      console.log('========================================');
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('切换失败:', err.message);
      process.exit(1);
    });
}
