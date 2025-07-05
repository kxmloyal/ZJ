#!/bin/bash

# 治具产能监控系统部署脚本
echo "开始部署治具产能监控系统..."

# 检查Node.js版本
NODE_VERSION=$(node -v)
echo "当前Node.js版本: $NODE_VERSION"

# 检查并安装依赖
echo "安装项目依赖..."
npm install

# 构建项目（如果有前端构建步骤）
echo "构建项目..."
npm run build

# 启动应用
echo "启动应用..."
if [ "$1" = "--prod" ]; then
  # 生产环境使用PM2管理进程
  if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    npm install -g pm2
  fi
  
  pm2 start server/server.js --name jig-monitoring
  
  # 保存PM2进程列表
  pm2 save
else
  # 开发环境使用nodemon
  if ! command -v nodemon &> /dev/null; then
    echo "安装nodemon..."
    npm install -g nodemon
  fi
  
  npm run dev &
fi

echo "部署完成！"
echo "应用已启动，访问 http://localhost:3000"