#!/bin/bash

# 治具产能监控系统停止脚本
echo "开始停止治具产能监控系统..."

# 检查是否使用PM2管理进程（生产环境）
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "jig-monitoring"; then
        echo "使用PM2停止应用..."
        pm2 stop jig-monitoring
        pm2 delete jig-monitoring
    else
        echo "未找到使用PM2管理的治具产能监控系统进程。"
    fi
else
    # 开发环境使用nodemon
    if command -v nodemon &> /dev/null; then
        # 查找并杀死nodemon进程
        NODEMON_PID=$(ps -ef | grep "nodemon server/server.js" | grep -v grep | awk '{print $2}')
        if [ -n "$NODEMON_PID" ]; then
            echo "杀死nodemon进程（PID: $NODEMON_PID）..."
            kill -9 $NODEMON_PID
        else
            echo "未找到使用nodemon运行的治具产能监控系统进程。"
        fi
    else
        echo "未安装nodemon，无法停止开发环境进程。"
    fi
fi

echo "停止完成！"