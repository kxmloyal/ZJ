#!/bin/bash

# 治具产能监控系统部署脚本
echo "开始部署治具产能监控系统..."

# 定义日志文件路径
LOG_FILE="deployment.log"
exec > >(tee -a $LOG_FILE) 2>&1

# 显示当前工作目录
echo "当前工作目录: $(pwd)"

# 检查Node.js版本
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "错误：未找到Node.js，请先安装Node.js。"
    exit 1
fi
echo "当前Node.js版本: $NODE_VERSION"

# 检查并安装依赖
echo "正在安装项目依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "错误：安装项目依赖失败，请检查网络或项目配置。"
    exit 1
fi
echo "项目依赖安装完成。"

# 构建项目（如果有前端构建步骤）
echo "正在构建项目..."
npm run build
if [ $? -ne 0 ]; then
    echo "错误：项目构建失败，请检查构建配置。"
    exit 1
fi
echo "项目构建完成。"

# 启动数据库迁移
echo "开始数据库迁移..."
# 修改为正确的相对路径
node scripts/db-migrate.js
if [ $? -ne 0 ]; then
    echo "错误：数据库迁移失败，请检查数据库配置。"
    exit 1
fi
echo "数据库迁移完成。"

# 启动应用
echo "准备启动应用..."
if [ "$1" = "--prod" ]; then
    # 生产环境使用PM2管理进程
    if ! command -v pm2 &> /dev/null; then
        echo "正在安装PM2..."
        npm install -g pm2
        if [ $? -ne 0 ]; then
            echo "错误：安装PM2失败，请检查网络或npm配置。"
            exit 1
        fi
        echo "PM2安装完成。"
    fi
    
    pm2 start server/server.js --name jig-monitoring
    if [ $? -ne 0 ]; then
        echo "错误：使用PM2启动应用失败，请检查应用配置。"
        exit 1
    fi
    echo "应用已使用PM2启动。"
    
    # 保存PM2进程列表
    pm2 save
    if [ $? -ne 0 ]; then
        echo "错误：保存PM2进程列表失败。"
        exit 1
    fi
    echo "PM2进程列表已保存。"
else
    # 开发环境使用nodemon
    if ! command -v nodemon &> /dev/null; then
        echo "正在安装nodemon..."
        npm install -g nodemon
        if [ $? -ne 0 ]; then
            echo "错误：安装nodemon失败，请检查网络或npm配置。"
            exit 1
        fi
        echo "nodemon安装完成。"
    fi
    
    npm run dev &
    if [ $? -ne 0 ]; then
        echo "错误：使用nodemon启动应用失败，请检查应用配置。"
        exit 1
    fi
    echo "应用已使用nodemon启动。"
fi

echo "部署完成！"
echo "应用已启动，访问 http://localhost:3000"