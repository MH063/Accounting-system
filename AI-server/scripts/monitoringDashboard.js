/**
 * 监控仪表板
 * 提供监控数据的可视化展示和管理界面
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

class MonitoringDashboard {
    constructor(port = 8080) {
        this.port = port;
        this.server = null;
        this.continuousMonitoring = null;
        this.dashboardData = {
            monitoringStatus: {},
            statistics: {},
            recentEvents: [],
            alerts: []
        };
    }

    /**
     * 启动仪表板服务器
     */
    async start() {
        console.log(`🚀 启动监控仪表板服务器...`);
        
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`✅ 监控仪表板已启动，访问地址: http://localhost:${this.port}`);
            console.log(`📊 仪表板页面: http://localhost:${this.port}/dashboard`);
            console.log(`📈 API端点: http://localhost:${this.port}/api/status`);
        });

        // 定期更新仪表板数据
        this.startDataUpdateLoop();
    }

    /**
     * 停止仪表板服务器
     */
    stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 监控仪表板已停止');
        }
    }

    /**
     * 处理HTTP请求
     */
    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;

        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        // 处理OPTIONS请求
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        try {
            switch (pathname) {
                case '/':
                    this.handleRoot(req, res);
                    break;
                case '/dashboard':
                    this.handleDashboard(req, res);
                    break;
                case '/api/status':
                    this.handleApiStatus(req, res);
                    break;
                case '/api/statistics':
                    this.handleApiStatistics(req, res);
                    break;
                case '/api/events':
                    this.handleApiEvents(req, res);
                    break;
                case '/api/alerts':
                    this.handleApiAlerts(req, res);
                    break;
                default:
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: '页面未找到' }));
            }
        } catch (error) {
            console.error('处理请求失败:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: '服务器内部错误' }));
        }
    }

    /**
     * 处理根路径请求
     */
    handleRoot(req, res) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.writeHead(200);
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>安全监控仪表板</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h1 { color: #333; text-align: center; margin-bottom: 30px; }
                    .feature { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #007bff; }
                    .feature h3 { margin-top: 0; color: #007bff; }
                    .link { display: inline-block; margin: 10px 5px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; transition: background 0.3s; }
                    .link:hover { background: #0056b3; }
                    .status { text-align: center; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🔒 安全监控仪表板</h1>
                    <div class="status">
                        <p>监控服务状态: <strong>${this.continuousMonitoring ? '运行中' : '未启动'}</strong></p>
                    </div>
                    
                    <div class="feature">
                        <h3>📊 实时监控</h3>
                        <p>提供敏感信息泄露、日志安全、第三方服务状态的实时监控</p>
                        <a href="/dashboard" class="link">查看仪表板</a>
                    </div>
                    
                    <div class="feature">
                        <h3>🔍 安全检查</h3>
                        <p>自动检测代码中的敏感信息、配置文件中的占位符、日志中的敏感数据</p>
                        <a href="/api/status" class="link">API状态</a>
                    </div>
                    
                    <div class="feature">
                        <h3>⚡ 性能监控</h3>
                        <p>监控第三方服务的连接状态和响应时间</p>
                        <a href="/api/statistics" class="link">统计数据</a>
                    </div>
                    
                    <div class="feature">
                        <h3>🚨 警报系统</h3>
                        <p>发现安全问题时的实时警报和通知</p>
                        <a href="/api/alerts" class="link">查看警报</a>
                    </div>
                </div>
            </body>
            </html>
        `);
    }

    /**
     * 处理仪表板页面请求
     */
    handleDashboard(req, res) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.writeHead(200);
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>安全监控仪表板</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
                    .dashboard { max-width: 1200px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; color: white; margin-bottom: 30px; }
                    .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
                    .header p { font-size: 1.1rem; opacity: 0.9; }
                    
                    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
                    .card { background: white; border-radius: 15px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: transform 0.3s; }
                    .card:hover { transform: translateY(-5px); }
                    .card h3 { color: #333; margin-bottom: 15px; font-size: 1.3rem; display: flex; align-items: center; }
                    .card .icon { font-size: 1.5rem; margin-right: 10px; }
                    .status { display: flex; justify-content: space-between; align-items: center; margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 8px; }
                    .status-label { font-weight: 600; color: #555; }
                    .status-value { font-weight: bold; }
                    .success { color: #28a745; }
                    .warning { color: #ffc107; }
                    .error { color: #dc3545; }
                    .info { color: #17a2b8; }
                    
                    .chart { height: 200px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666; font-style: italic; }
                    .events { max-height: 300px; overflow-y: auto; }
                    .event { padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff; }
                    .event-time { font-size: 0.9rem; color: #666; margin-bottom: 5px; }
                    .event-title { font-weight: 600; color: #333; }
                    .event-message { font-size: 0.9rem; color: #555; margin-top: 3px; }
                    
                    .refresh { position: fixed; bottom: 20px; right: 20px; background: #007bff; color: white; border: none; border-radius: 50%; width: 60px; height: 60px; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 15px rgba(0,123,255,0.3); transition: all 0.3s; }
                    .refresh:hover { background: #0056b3; transform: scale(1.1); }
                    .refresh:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                    
                    .loading { text-align: center; padding: 40px; color: #666; }
                    .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 10px; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    
                    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } .header h1 { font-size: 2rem; } }
                </style>
            </head>
            <body>
                <div class="dashboard">
                    <div class="header">
                        <h1>🔒 安全监控仪表板</h1>
                        <p>实时监控系统安全状态</p>
                    </div>
                    
                    <div class="grid">
                        <div class="card">
                            <h3><span class="icon">📊</span>监控状态</h3>
                            <div id="status-content" class="loading">
                                <div class="spinner"></div>
                                <div>加载中...</div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <h3><span class="icon">📈</span>统计数据</h3>
                            <div id="stats-content" class="loading">
                                <div class="spinner"></div>
                                <div>加载中...</div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <h3><span class="icon">🚨</span>最近警报</h3>
                            <div id="alerts-content" class="loading">
                                <div class="spinner"></div>
                                <div>加载中...</div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <h3><span class="icon">📋</span>最近事件</h3>
                            <div id="events-content" class="loading">
                                <div class="spinner"></div>
                                <div>加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button class="refresh" onclick="refreshDashboard()" title="刷新数据">🔄</button>
                
                <script>
                    let autoRefreshInterval;
                    
                    // 页面加载时初始化
                    document.addEventListener('DOMContentLoaded', function() {
                        refreshDashboard();
                        startAutoRefresh();
                    });
                    
                    // 自动刷新
                    function startAutoRefresh() {
                        autoRefreshInterval = setInterval(refreshDashboard, 30000); // 30秒刷新一次
                    }
                    
                    // 停止自动刷新
                    function stopAutoRefresh() {
                        if (autoRefreshInterval) {
                            clearInterval(autoRefreshInterval);
                        }
                    }
                    
                    // 刷新仪表板数据
                    async function refreshDashboard() {
                        const refreshBtn = document.querySelector('.refresh');
                        refreshBtn.disabled = true;
                        refreshBtn.innerHTML = '⏳';
                        
                        try {
                            // 并行加载所有数据
                            await Promise.all([
                                loadStatus(),
                                loadStatistics(),
                                loadAlerts(),
                                loadEvents()
                            ]);
                        } catch (error) {
                            console.error('刷新失败:', error);
                        } finally {
                            refreshBtn.disabled = false;
                            refreshBtn.innerHTML = '🔄';
                        }
                    }
                    
                    // 加载状态数据
                    async function loadStatus() {
                        try {
                            const response = await fetch('/api/status');
                            const data = await response.json();
                            displayStatus(data);
                        } catch (error) {
                            document.getElementById('status-content').innerHTML = '<div class="error">加载失败</div>';
                        }
                    }
                    
                    // 加载统计数据
                    async function loadStatistics() {
                        try {
                            const response = await fetch('/api/statistics');
                            const data = await response.json();
                            displayStatistics(data);
                        } catch (error) {
                            document.getElementById('stats-content').innerHTML = '<div class="error">加载失败</div>';
                        }
                    }
                    
                    // 加载警报数据
                    async function loadAlerts() {
                        try {
                            const response = await fetch('/api/alerts');
                            const data = await response.json();
                            displayAlerts(data);
                        } catch (error) {
                            document.getElementById('alerts-content').innerHTML = '<div class="error">加载失败</div>';
                        }
                    }
                    
                    // 加载事件数据
                    async function loadEvents() {
                        try {
                            const response = await fetch('/api/events');
                            const data = await response.json();
                            displayEvents(data);
                        } catch (error) {
                            document.getElementById('events-content').innerHTML = '<div class="error">加载失败</div>';
                        }
                    }
                    
                    // 显示状态
                    function displayStatus(data) {
                        const container = document.getElementById('status-content');
                        container.innerHTML = \`
                            <div class="status">
                                <span class="status-label">监控服务:</span>
                                <span class="status-value \${data.isRunning ? 'success' : 'error'}">\${data.isRunning ? '运行中' : '已停止'}</span>
                            </div>
                            <div class="status">
                                <span class="status-label">最后检查:</span>
                                <span class="status-value info">\${data.lastCheck ? new Date(data.lastCheck.timestamp).toLocaleString() : '暂无'}</span>
                            </div>
                            <div class="status">
                                <span class="status-label">总事件数:</span>
                                <span class="status-value info">\${data.totalEvents}</span>
                            </div>
                        \`;
                    }
                    
                    // 显示统计数据
                    function displayStatistics(data) {
                        const container = document.getElementById('stats-content');
                        const totalEvents = data.totalEvents || 0;
                        const alerts = data.alerts || 0;
                        const last24Hours = data.last24Hours || 0;
                        
                        container.innerHTML = \`
                            <div class="status">
                                <span class="status-label">总事件:</span>
                                <span class="status-value info">\${totalEvents}</span>
                            </div>
                            <div class="status">
                                <span class="status-label">警报数量:</span>
                                <span class="status-value \${alerts > 0 ? 'error' : 'success'}">\${alerts}</span>
                            </div>
                            <div class="status">
                                <span class="status-label">最近24小时:</span>
                                <span class="status-value info">\${last24Hours}</span>
                            </div>
                        \`;
                    }
                    
                    // 显示警报
                    function displayAlerts(data) {
                        const container = document.getElementById('alerts-content');
                        if (!data || data.length === 0) {
                            container.innerHTML = '<div class="success">暂无警报</div>';
                            return;
                        }
                        
                        const alertsHtml = data.slice(0, 5).map(alert => \`
                            <div class="event">
                                <div class="event-time">\${new Date(alert.timestamp).toLocaleString()}</div>
                                <div class="event-title">\${alert.title}</div>
                                <div class="event-message">\${alert.message}</div>
                            </div>
                        \`).join('');
                        
                        container.innerHTML = alertsHtml;
                    }
                    
                    // 显示事件
                    function displayEvents(data) {
                        const container = document.getElementById('events-content');
                        if (!data || data.length === 0) {
                            container.innerHTML = '<div class="success">暂无事件</div>';
                            return;
                        }
                        
                        const eventsHtml = data.slice(0, 5).map(event => \`
                            <div class="event">
                                <div class="event-time">\${new Date(event.timestamp).toLocaleString()}</div>
                                <div class="event-title">\${event.title}</div>
                                <div class="event-message">\${event.message}</div>
                            </div>
                        \`).join('');
                        
                        container.innerHTML = eventsHtml;
                    }
                    
                    // 页面卸载时停止自动刷新
                    window.addEventListener('beforeunload', stopAutoRefresh);
                </script>
            </body>
            </html>
        `);
    }

    /**
     * 处理API状态请求
     */
    handleApiStatus(req, res) {
        try {
            // 这里需要集成实际的ContinuousMonitoring实例
            const mockData = {
                isRunning: true,
                lastCheck: {
                    timestamp: new Date().toISOString(),
                    type: 'security',
                    title: '敏感信息检查',
                    message: '检查通过，未发现敏感信息泄露'
                },
                totalEvents: 42,
                recentEvents: [
                    {
                        timestamp: new Date().toISOString(),
                        type: 'security',
                        title: '敏感信息检查',
                        message: '检查通过，未发现敏感信息泄露'
                    },
                    {
                        timestamp: new Date(Date.now() - 3600000).toISOString(),
                        type: 'service',
                        title: '第三方服务验证',
                        message: '数据库连接正常，Redis服务可用'
                    }
                ]
            };
            
            res.writeHead(200);
            res.end(JSON.stringify(mockData));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    /**
     * 处理API统计请求
     */
    handleApiStatistics(req, res) {
        try {
            const mockStats = {
                totalEvents: 42,
                eventsByType: {
                    security: 15,
                    service: 12,
                    environment: 8,
                    error: 4,
                    system: 3
                },
                eventsByDay: {
                    '2025-12-01': 12,
                    '2025-11-30': 15,
                    '2025-11-29': 10,
                    '2025-11-28': 5
                },
                alerts: 2,
                last24Hours: 8
            };
            
            res.writeHead(200);
            res.end(JSON.stringify(mockStats));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    /**
     * 处理API事件请求
     */
    handleApiEvents(req, res) {
        try {
            const mockEvents = [
                {
                    timestamp: new Date().toISOString(),
                    type: 'security',
                    title: '敏感信息检查',
                    message: '检查通过，未发现敏感信息泄露'
                },
                {
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    type: 'service',
                    title: '第三方服务验证',
                    message: '数据库连接正常，Redis服务可用'
                },
                {
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    type: 'environment',
                    title: '环境配置检查',
                    message: '环境变量配置正确，安全评分: 85分'
                }
            ];
            
            res.writeHead(200);
            res.end(JSON.stringify(mockEvents));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    /**
     * 处理API警报请求
     */
    handleApiAlerts(req, res) {
        try {
            const mockAlerts = [
                {
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    type: 'security',
                    title: '发现敏感信息',
                    message: '在配置文件中发现未替换的占位符'
                },
                {
                    timestamp: new Date(Date.now() - 172800000).toISOString(),
                    type: 'service',
                    title: '服务连接失败',
                    message: 'Redis服务连接超时'
                }
            ];
            
            res.writeHead(200);
            res.end(JSON.stringify(mockAlerts));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    /**
     * 设置ContinuousMonitoring实例
     */
    setContinuousMonitoring(monitoring) {
        this.continuousMonitoring = monitoring;
    }

    /**
     * 启动数据更新循环
     */
    startDataUpdateLoop() {
        // 每30秒更新一次数据
        setInterval(() => {
            this.updateDashboardData();
        }, 30000);
        
        // 立即更新一次
        this.updateDashboardData();
    }

    /**
     * 更新仪表板数据
     */
    updateDashboardData() {
        if (this.continuousMonitoring) {
            this.dashboardData.monitoringStatus = this.continuousMonitoring.getStatus();
            this.dashboardData.statistics = this.continuousMonitoring.getStatistics();
            this.dashboardData.recentEvents = this.continuousMonitoring.monitoringLogs.slice(-10);
            this.dashboardData.alerts = this.continuousMonitoring.monitoringLogs
                .filter(event => event.type === 'security' || event.type === 'error')
                .slice(-10);
        }
    }
}

/**
 * 命令行接口
 */
async function main() {
    const dashboard = new MonitoringDashboard(8080);
    
    try {
        await dashboard.start();
        
        // 优雅关闭
        process.on('SIGINT', () => {
            console.log('\n🛑 正在关闭仪表板...');
            dashboard.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 正在关闭仪表板...');
            dashboard.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ 启动仪表板失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = MonitoringDashboard;