# 自动化部署脚本 (PowerShell 版本)
# 使用方法: .\scripts\deploy.ps1 [environment]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "test", "production")]
    [string]$Environment = "development"
)

# 全局变量
$Script:PROJECT_NAME = "ai-serve"
$Script:DOCKER_IMAGE = "$Script:PROJECT_NAME:latest"
$Script:IS_WINDOWS = $PSVersionTable.Platform -eq $null -or $PSVersionTable.Platform -like "*win*"

# 日志函数
function Write-Log {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "STEP")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $colors = @{
        "INFO" = "Green"
        "WARN" = "Yellow" 
        "ERROR" = "Red"
        "STEP" = "Blue"
    }
    
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $colors[$Level]
}

# 检查参数
function Test-Environment {
    Write-Log -Message "验证环境参数: $Environment" -Level "STEP"
    
    if ($Environment -notin @("development", "test", "production")) {
        Write-Log -Message "无效的环境参数: $Environment" -Level "ERROR"
        Write-Host "使用方法: .\scripts\deploy.ps1 [development|test|production]" -ForegroundColor Red
        exit 1
    }
    
    Write-Log -Message "环境验证通过: $Environment" -Level "INFO"
}

# 检查依赖
function Test-Dependencies {
    Write-Log -Message "检查部署依赖..." -Level "STEP"
    
    # 检查 Node.js
    try {
        $nodeVersion = node --version
        Write-Log -Message "Node.js 版本: $nodeVersion" -Level "INFO"
    }
    catch {
        Write-Log -Message "Node.js 未安装" -Level "ERROR"
        exit 1
    }
    
    # 检查 npm
    try {
        $npmVersion = npm --version
        Write-Log -Message "npm 版本: $npmVersion" -Level "INFO"
    }
    catch {
        Write-Log -Message "npm 未安装" -Level "ERROR"
        exit 1
    }
    
    # 检查 Docker (可选)
    $Script:DOCKER_AVAILABLE = $false
    try {
        $dockerVersion = docker --version
        Write-Log -Message "Docker 已安装: $dockerVersion" -Level "INFO"
        $Script:DOCKER_AVAILABLE = $true
    }
    catch {
        Write-Log -Message "Docker 未安装，将使用本地部署" -Level "WARN"
    }
    
    # 检查 Docker Compose (可选)
    $Script:DOCKER_COMPOSE_AVAILABLE = $false
    if ($Script:DOCKER_AVAILABLE) {
        try {
            $composeVersion = docker-compose --version
            Write-Log -Message "Docker Compose 已安装: $composeVersion" -Level "INFO"
            $Script:DOCKER_COMPOSE_AVAILABLE = $true
        }
        catch {
            Write-Log -Message "Docker Compose 未安装" -Level "WARN"
        }
    }
}

# 环境设置
function Set-Environment {
    Write-Log -Message "设置环境配置: $Environment" -Level "STEP"
    
    # 设置环境变量
    $env:NODE_ENV = $Environment
    
    # 加载环境文件
    $envFile = ".env.$Environment"
    if (Test-Path $envFile) {
        Write-Log -Message "加载环境配置文件: $envFile" -Level "INFO"
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                $name = $matches[1]
                $value = $matches[2]
                Set-Variable -Name $name -Value $value -Scope Global -ErrorAction SilentlyContinue
            }
        }
    }
    elseif (Test-Path ".env") {
        Write-Log -Message "加载默认环境配置文件: .env" -Level "INFO"
        Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                $name = $matches[1]
                $value = $matches[2]
                Set-Variable -Name $name -Value $value -Scope Global -ErrorAction SilentlyContinue
            }
        }
    }
    else {
        Write-Log -Message "未找到环境配置文件，使用默认配置" -Level "WARN"
    }
    
    # 设置数据库名称
    switch ($Environment) {
        "development" { $Script:DB_NAME = if ($DB_NAME) { $DB_NAME } else { "ai_serve_dev" } }
        "test" { $Script:DB_NAME = if ($DB_NAME) { $DB_NAME } else { "ai_serve_test" } }
        "production" { $Script:DB_NAME = if ($DB_NAME) { $DB_NAME } else { "ai_serve" } }
    }
    
    Write-Log -Message "数据库名称: $Script:DB_NAME" -Level "INFO"
}

# 安装依赖
function Install-Dependencies {
    Write-Log -Message "安装项目依赖..." -Level "STEP"
    
    # 检查 package.json
    if (-not (Test-Path "package.json")) {
        Write-Log -Message "未找到 package.json 文件" -Level "ERROR"
        exit 1
    }
    
    # 安装依赖
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Log -Message "依赖安装失败" -Level "ERROR"
        exit 1
    }
    
    Write-Log -Message "依赖安装完成" -Level "INFO"
}

# 运行测试
function Invoke-Tests {
    if ($Environment -eq "production") {
        Write-Log -Message "运行完整测试套件..." -Level "STEP"
        
        # 安装测试依赖
        npm ci --only=dev
        if ($LASTEXITCODE -ne 0) {
            Write-Log -Message "测试依赖安装失败" -Level "ERROR"
            exit 1
        }
        
        # 运行单元测试
        Write-Log -Message "运行单元测试..." -Level "INFO"
        npm run test:unit
        if ($LASTEXITCODE -ne 0) {
            Write-Log -Message "单元测试失败" -Level "ERROR"
            exit 1
        }
        
        # 运行集成测试
        Write-Log -Message "运行集成测试..." -Level "INFO"
        npm run test:integration
        if ($LASTEXITCODE -ne 0) {
            Write-Log -Message "集成测试失败" -Level "ERROR"
            exit 1
        }
        
        # 运行 API 测试
        Write-Log -Message "运行 API 测试..." -Level "INFO"
        npm run test:api
        if ($LASTEXITCODE -ne 0) {
            Write-Log -Message "API 测试失败" -Level "ERROR"
            exit 1
        }
        
        Write-Log -Message "所有测试通过" -Level "INFO"
    }
}

# 代码检查
function Test-CodeQuality {
    if ($Environment -ne "development") {
        Write-Log -Message "执行代码质量检查..." -Level "STEP"
        
        # 运行 linter
        Write-Log -Message "运行代码检查..." -Level "INFO"
        npm run lint
        if ($LASTEXITCODE -ne 0) {
            Write-Log -Message "代码检查失败" -Level "ERROR"
            exit 1
        }
        
        # 格式化检查
        Write-Log -Message "检查代码格式..." -Level "INFO"
        npm run format
        if ($LASTEXITCODE -ne 0) {
            Write-Log -Message "代码格式检查失败" -Level "ERROR"
            exit 1
        }
        
        Write-Log -Message "代码质量检查通过" -Level "INFO"
    }
}

# Docker 部署
function Start-DockerDeploy {
    if ($Script:DOCKER_AVAILABLE -and $Script:DOCKER_COMPOSE_AVAILABLE) {
        Write-Log -Message "使用 Docker 部署..." -Level "STEP"
        
        # 构建镜像
        Write-Log -Message "构建 Docker 镜像..." -Level "INFO"
        docker build -t $Script:DOCKER_IMAGE .
        if ($LASTEXITCODE -ne 0) {
            Write-Log -Message "Docker 镜像构建失败" -Level "ERROR"
            exit 1
        }
        
        # 根据环境选择部署策略
        switch ($Environment) {
            "development" {
                # 开发环境：使用 docker-compose 开发配置
                Write-Log -Message "启动开发环境服务..." -Level "INFO"
                if (Test-Path "docker-compose.dev.yml") {
                    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
                } else {
                    docker-compose up -d
                }
            }
            "test" {
                # 测试环境：启动测试相关服务
                Write-Log -Message "启动测试环境服务..." -Level "INFO"
                if (Test-Path "docker-compose.test.yml") {
                    docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
                } else {
                    docker-compose up -d
                }
            }
            "production" {
                # 生产环境：启动完整服务栈
                Write-Log -Message "启动生产环境服务..." -Level "INFO"
                docker-compose --profile production up -d
            }
        }
        
        Write-Log -Message "Docker 部署完成" -Level "INFO"
    }
    else {
        Write-Log -Message "Docker 不可用，使用本地部署..." -Level "INFO"
        Start-LocalDeploy
    }
}

# 本地部署
function Start-LocalDeploy {
    Write-Log -Message "本地部署..." -Level "STEP"
    
    # 停止现有进程
    Write-Log -Message "停止现有服务..." -Level "INFO"
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*server.js*" 
    } | Stop-Process -Force
    
    Get-Process -Name "nodemon" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*server.js*" 
    } | Stop-Process -Force
    
    # 清理端口占用
    $port = if ($PORT) { $PORT } else { 4000 }
    Write-Log -Message "清理端口 $port 占用..." -Level "INFO"
    
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
                 Select-Object -ExpandProperty OwningProcess
    
    if ($processes) {
        $processes | ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
    
    # 启动服务
    Write-Log -Message "启动应用服务..." -Level "INFO"
    
    $job = $null
    switch ($Environment) {
        "development" { $job = Start-Job -ScriptBlock { npm run dev } }
        "test" { $job = Start-Job -ScriptBlock { npm run dev:test } }
        "production" { $job = Start-Job -ScriptBlock { npm start } }
    }
    
    $Script:SERVICE_JOB = $job
    Write-Log -Message "服务已启动，Job ID: $($job.Id)" -Level "INFO"
}

# 健康检查
function Test-Health {
    Write-Log -Message "执行健康检查..." -Level "STEP"
    
    # 等待服务启动
    Write-Log -Message "等待服务启动..." -Level "INFO"
    Start-Sleep -Seconds 5
    
    # 检查服务健康状态
    $port = if ($PORT) { $PORT } else { 4000 }
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-Log -Message "健康检查尝试 $attempt/$maxAttempts" -Level "INFO"
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$port/api/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Log -Message "✅ 服务健康检查通过" -Level "INFO"
                break
            }
        }
        catch {
            if ($attempt -eq $maxAttempts) {
                Write-Log -Message "❌ 服务健康检查失败" -Level "ERROR"
                exit 1
            }
            Write-Log -Message "服务还未就绪，等待 3 秒后重试..." -Level "WARN"
            Start-Sleep -Seconds 3
        }
        
        $attempt++
    }
    
    # 运行端到端测试
    if ($Environment -eq "production") {
        Write-Log -Message "运行端到端测试..." -Level "INFO"
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$port/api/health/test/retry" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Log -Message "✅ 端到端测试通过" -Level "INFO"
            }
        }
        catch {
            Write-Log -Message "端到端测试失败" -Level "ERROR"
            exit 1
        }
    }
}

# 清理函数
function Stop-Deploy {
    if ($Script:SERVICE_JOB) {
        Write-Log -Message "停止服务 Job: $($Script:SERVICE_JOB.Id)" -Level "INFO"
        Stop-Job -Id $Script:SERVICE_JOB.Id -Force -ErrorAction SilentlyContinue
    }
}

# 信号处理
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Stop-Deploy
} | Out-Null

# 主函数
function Main {
    Write-Log -Message "🚀 开始部署 $Script:PROJECT_NAME 到 $Environment 环境" -Level "STEP"
    
    Test-Environment
    Test-Dependencies
    Set-Environment
    Install-Dependencies
    Invoke-Tests
    Test-CodeQuality
    Start-DockerDeploy
    Test-Health
    
    Write-Log -Message "🎉 部署成功完成！" -Level "INFO"
    $port = if ($PORT) { $PORT } else { 4000 }
    Write-Log -Message "📊 服务状态: http://localhost:$port/api/health" -Level "INFO"
    
    if ($Environment -eq "production") {
        Write-Log -Message "📈 监控面板: http://localhost:3000 (Grafana)" -Level "INFO"
        Write-Log -Message "📊 指标收集: http://localhost:9090 (Prometheus)" -Level "INFO"
    }
}

# 脚本入口
Main