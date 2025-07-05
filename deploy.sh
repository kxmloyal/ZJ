#!/bin/bash

# 治具产能监控系统部署脚本
# 使用方法: ./deploy.sh [--env=production|development] [--help]

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # 无颜色

# 环境变量
ENV="production"
APP_DIR=$(pwd)
LOG_FILE="$APP_DIR/deploy.log"
NODE_VERSION="18"

# 日志函数
log() {
  local message="$1"
  local level="${2:-INFO}"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# 错误处理函数
handle_error() {
  log "部署失败: $1" "ERROR"
  echo -e "${RED}部署失败: $1${NC}"
  exit 1
}

# 显示帮助信息
show_help() {
  echo "治具产能监控系统部署脚本"
  echo "用法: $0 [选项]"
  echo "选项:"
  echo "  --env=production|development  指定部署环境 (默认: production)"
  echo "  --help                       显示此帮助信息"
  exit 0
}

# 解析命令行参数
for arg in "$@"; do
  case $arg in
    --env=*)
      ENV="${arg#*=}"
      ;;
    --help)
      show_help
      ;;
    *)
      echo "未知参数: $arg"
      show_help
      ;;
  esac
done

# 检查环境是否支持
check_environment() {
  log "检查部署环境..."
  
  # 检查是否有root权限
  if [ "$EUID" -ne 0 ]; then
    log "请使用root权限运行此脚本" "ERROR"
    echo -e "${RED}请使用root权限运行此脚本${NC}"
    exit 1
  fi
  
  # 检测操作系统
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
  elif type lsb_release >/dev/null 2>&1; then
    OS=$(lsb_release -si)
    VERSION=$(lsb_release -sr)
  elif [ -f /etc/lsb-release ]; then
    . /etc/lsb-release
    OS=$DISTRIB_ID
    VERSION=$DISTRIB_RELEASE
  elif [ -f /etc/debian_version ]; then
    OS="debian"
    VERSION=$(cat /etc/debian_version)
  elif [ -f /etc/redhat-release ]; then
    OS="redhat"
    VERSION=$(cat /etc/redhat-release)
  else
    OS=$(uname -s)
    VERSION=$(uname -r)
  fi
  
  log "检测到操作系统: $OS $VERSION"
  
  # 检查Node.js是否安装
  if ! command -v node &> /dev/null; then
    log "Node.js未安装，开始安装..." "WARN"
    install_nodejs
  else
    NODE_VER=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VER" -lt "$NODE_VERSION" ]; then
      log "Node.js版本过低，需要v$NODE_VERSION+，当前版本: $(node -v)" "WARN"
      install_nodejs
    else
      log "Node.js已安装，版本: $(node -v)"
    fi
  fi
  
  # 检查npm是否安装
  if ! command -v npm &> /dev/null; then
    handle_error "npm未安装，请先安装Node.js"
  else
    log "npm已安装，版本: $(npm -v)"
  fi
  
  # 检查pm2是否安装
  if ! command -v pm2 &> /dev/null; then
    log "PM2未安装，开始安装..." "INFO"
    npm install -g pm2 || handle_error "PM2安装失败"
  else
    log "PM2已安装，版本: $(pm2 -v)"
  fi
  
  log "环境检查完成"
}

# 安装Node.js（改进版，支持多发行版）
install_nodejs() {
  log "开始安装Node.js v$NODE_VERSION..."
  
  case "$OS" in
    debian|ubuntu|linuxmint)
      log "安装适用于Debian/Ubuntu的Node.js..."
      # 添加NodeSource仓库
      curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash - || handle_error "添加Node.js仓库失败"
      
      # 安装Node.js和npm
      apt-get install -y nodejs || handle_error "Node.js安装失败"
      ;;
      
    centos|rhel|fedora)
      log "安装适用于CentOS/RHEL/Fedora的Node.js..."
      # 添加NodeSource仓库
      curl -fsSL https://rpm.nodesource.com/setup_$NODE_VERSION.x | bash - || handle_error "添加Node.js仓库失败"
      
      # 安装Node.js和npm
      yum install -y nodejs || handle_error "Node.js安装失败"
      ;;
      
    *)
      log "未知操作系统，尝试使用nvm安装Node.js..." "WARN"
      
      # 安装nvm
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
      
      # 加载nvm
      export NVM_DIR="$HOME/.nvm"
      [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
      
      # 安装指定版本的Node.js
      nvm install $NODE_VERSION || handle_error "使用nvm安装Node.js失败"
      nvm use $NODE_VERSION || handle_error "切换到Node.js $NODE_VERSION失败"
      ;;
  esac
  
  log "Node.js v$NODE_VERSION安装完成"
}

# 准备项目
prepare_project() {
  log "开始准备项目..."
  
  # 检查环境配置文件
  if [ ! -f ".env" ]; then
    log "未找到.env文件，创建示例配置..." "WARN"
    cp .env.example .env || handle_error "创建.env文件失败"
    log "请编辑.env文件配置数据库和其他参数" "WARN"
  fi
  
  # 安装项目依赖
  log "安装项目依赖..."
  npm install --production || handle_error "依赖安装失败"
  
  log "项目准备完成"
}

# 配置数据库
configure_database() {
  log "开始配置数据库..."
  
  # 检查数据库配置
  if [ ! -f "server/config/db.config.js" ]; then
    handle_error "未找到数据库配置文件: server/config/db.config.js"
  fi
  
  # 执行数据库迁移
  log "执行数据库迁移..."
  node scripts/db-migrate.js || handle_error "数据库迁移失败"
  
  log "数据库配置完成"
}

# 启动应用
start_application() {
  log "开始启动应用..."
  
  # 停止现有应用实例
  pm2 stop jig-monitoring-system || log "未找到正在运行的应用实例" "INFO"
  
  # 启动应用
  pm2 start server/server.js --name jig-monitoring-system || handle_error "应用启动失败"
  
  # 保存PM2进程列表
  pm2 save || log "保存PM2进程列表失败" "WARN"
  
  # 设置开机自启动
  pm2 startup || log "设置开机自启动失败" "WARN"
  
  log "应用启动成功"
  log "应用状态: $(pm2 status jig-monitoring-system)"
  
  echo -e "${GREEN}部署成功！应用已启动。${NC}"
  echo -e "${YELLOW}访问地址: http://localhost:${config.server.port}${NC}"
}

# 主函数
main() {
  log "开始部署治具产能监控系统 (环境: $ENV)..."
  echo -e "${YELLOW}开始部署治具产能监控系统 (环境: $ENV)...${NC}"
  
  check_environment
  prepare_project
  configure_database
  start_application
  
  log "部署完成！"
  echo -e "${GREEN}部署完成！${NC}"
}

# 执行主函数
main