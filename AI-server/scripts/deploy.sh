#!/bin/bash
# 自动化部署脚本
# 使用方法: ./scripts/deploy.sh [environment]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查参数
ENVIRONMENT=${1:-development}
PROJECT_NAME="ai-serve"
DOCKER_IMAGE="$PROJECT_NAME:latest"

# 环境验证
validate_environment() {
    log_step "验证环境参数: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        development|test|production)
            log_info "环境验证通过: $ENVIRONMENT"
            ;;
        *)
            log_error "无效的环境参数: $ENVIRONMENT"
            echo "使用方法: $0 [development|test|production]"
            exit 1
            ;;
    esac
}

# 检查依赖
check_dependencies() {
    log_step "检查部署依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查 Docker (可选)
    if command -v docker &> /dev/null; then
        log_info "Docker 已安装"
        DOCKER_AVAILABLE=true
    else
        log_warn "Docker 未安装，将使用本地部署"
        DOCKER_AVAILABLE=false
    fi
    
    # 检查 Docker Compose (可选)
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose 已安装"
        DOCKER_COMPOSE_AVAILABLE=true
    else
        log_warn "Docker Compose 未安装"
        DOCKER_COMPOSE_AVAILABLE=false
    fi
}

# 环境设置
setup_environment() {
    log_step "设置环境配置: $ENVIRONMENT"
    
    # 设置环境变量
    export NODE_ENV=$ENVIRONMENT
    
    # 加载环境文件
    if [ -f ".env.$ENVIRONMENT" ]; then
        log_info "加载环境配置文件: .env.$ENVIRONMENT"
        set -a
        source ".env.$ENVIRONMENT"
        set +a
    elif [ -f ".env" ]; then
        log_info "加载默认环境配置文件: .env"
        set -a
        source ".env"
        set +a
    else
        log_warn "未找到环境配置文件，使用默认配置"
    fi
    
    # 设置数据库名称
    case $ENVIRONMENT in
        development)
            DB_NAME=${DB_NAME:-ai_serve_dev}
            ;;
        test)
            DB_NAME=${DB_NAME:-ai_serve_test}
            ;;
        production)
            DB_NAME=${DB_NAME:-ai_serve}
            ;;
    esac
    
    log_info "数据库名称: $DB_NAME"
}

# 安装依赖
install_dependencies() {
    log_step "安装项目依赖..."
    
    # 检查 package.json
    if [ ! -f "package.json" ]; then
        log_error "未找到 package.json 文件"
        exit 1
    fi
    
    # 安装依赖
    npm ci --silent
    log_info "依赖安装完成"
}

# 运行测试
run_tests() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_step "运行完整测试套件..."
        
        # 安装测试依赖
        npm ci --silent --only=dev
        
        # 运行单元测试
        log_info "运行单元测试..."
        npm run test:unit || {
            log_error "单元测试失败"
            exit 1
        }
        
        # 运行集成测试
        log_info "运行集成测试..."
        npm run test:integration || {
            log_error "集成测试失败"
            exit 1
        }
        
        # 运行 API 测试
        log_info "运行 API 测试..."
        npm run test:api || {
            log_error "API 测试失败"
            exit 1
        }
        
        log_info "所有测试通过"
    fi
}

# 代码检查
code_quality_check() {
    if [ "$ENVIRONMENT" != "development" ]; then
        log_step "执行代码质量检查..."
        
        # 运行 linter
        log_info "运行代码检查..."
        npm run lint || {
            log_error "代码检查失败"
            exit 1
        }
        
        # 格式化检查
        log_info "检查代码格式..."
        npm run format || {
            log_error "代码格式检查失败"
            exit 1
        }
        
        log_info "代码质量检查通过"
    fi
}

# Docker 部署
docker_deploy() {
    if [ "$DOCKER_AVAILABLE" = true ] && [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
        log_step "使用 Docker 部署..."
        
        # 构建镜像
        log_info "构建 Docker 镜像..."
        docker build -t $DOCKER_IMAGE . || {
            log_error "Docker 镜像构建失败"
            exit 1
        }
        
        # 根据环境选择部署策略
        case $ENVIRONMENT in
            development)
                # 开发环境：使用 docker-compose 开发配置
                log_info "启动开发环境服务..."
                docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
                ;;
            test)
                # 测试环境：启动测试相关服务
                log_info "启动测试环境服务..."
                docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
                ;;
            production)
                # 生产环境：启动完整服务栈
                log_info "启动生产环境服务..."
                docker-compose --profile production up -d
                ;;
        esac
        
        log_info "Docker 部署完成"
    else
        log_info "Docker 不可用，使用本地部署..."
        local_deploy
    fi
}

# 本地部署
local_deploy() {
    log_step "本地部署..."
    
    # 停止现有进程
    log_info "停止现有服务..."
    pkill -f "node.*server.js" || true
    pkill -f "nodemon.*server.js" || true
    
    # 清理端口占用
    PORT=${PORT:-4000}
    if lsof -ti:$PORT > /dev/null 2>&1; then
        log_info "清理端口 $PORT 占用..."
        lsof -ti:$PORT | xargs kill -9 || true
        sleep 2
    fi
    
    # 启动服务
    log_info "启动应用服务..."
    
    case $ENVIRONMENT in
        development)
            npm run dev &
            ;;
        test)
            npm run dev:test &
            ;;
        production)
            npm start &
            ;;
    esac
    
    SERVICE_PID=$!
    echo $SERVICE_PID > .service.pid
    
    log_info "服务已启动，PID: $SERVICE_PID"
}

# 健康检查
health_check() {
    log_step "执行健康检查..."
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 5
    
    # 检查服务健康状态
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "健康检查尝试 $attempt/$max_attempts"
        
        if curl -f http://localhost:${PORT:-4000}/api/health > /dev/null 2>&1; then
            log_info "✅ 服务健康检查通过"
            break
        else
            if [ $attempt -eq $max_attempts ]; then
                log_error "❌ 服务健康检查失败"
                exit 1
            fi
            log_warn "服务还未就绪，等待 3 秒后重试..."
            sleep 3
        fi
        
        attempt=$((attempt + 1))
    done
    
    # 运行端到端测试
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "运行端到端测试..."
        curl -f http://localhost:${PORT:-4000}/api/health/test/retry || {
            log_error "端到端测试失败"
            exit 1
        }
        log_info "✅ 端到端测试通过"
    fi
}

# 清理函数
cleanup() {
    if [ -f ".service.pid" ]; then
        SERVICE_PID=$(cat .service.pid)
        if ps -p $SERVICE_PID > /dev/null 2>&1; then
            log_info "停止服务 PID: $SERVICE_PID"
            kill $SERVICE_PID
        fi
        rm .service.pid
    fi
}

# 信号处理
trap cleanup EXIT

# 主函数
main() {
    log_info "🚀 开始部署 $PROJECT_NAME 到 $ENVIRONMENT 环境"
    
    validate_environment
    check_dependencies
    setup_environment
    install_dependencies
    run_tests
    code_quality_check
    docker_deploy
    health_check
    
    log_info "🎉 部署成功完成！"
    log_info "📊 服务状态: http://localhost:${PORT:-4000}/api/health"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "📈 监控面板: http://localhost:3000 (Grafana)"
        log_info "📊 指标收集: http://localhost:9090 (Prometheus)"
    fi
}

# 脚本入口
main "$@"