#!/bin/bash

# 治具产能监控系统重新部署脚本
echo "开始重新部署治具产能监控系统..."

# 停止应用
echo "停止正在运行的应用..."
cd /www/wwwroot/ZJ/scripts
./stop.sh

# 清除缓存和依赖
echo "清除缓存和依赖..."
rm -rf /www/wwwroot/ZJ/node_modules
rm -rf /www/wwwroot/ZJ/dist

# 重新部署应用
echo "重新部署应用..."
./deploy.sh

echo "重新部署完成！"