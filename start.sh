#!/bin/bash

echo "🎠 室内亲子淘气堡乐园系统启动脚本"
echo "===================================="

# 检查并创建 data 目录
if [ ! -d "backend/data" ]; then
    mkdir -p backend/data
    echo "✅ 创建数据目录"
fi

# 检查后端依赖
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend && npm install
    cd ..
    echo "✅ 后端依赖安装完成"
fi

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend && npm install
    cd ..
    echo "✅ 前端依赖安装完成"
fi

# 检查 H5 依赖
if [ ! -d "h5/node_modules" ]; then
    echo "📦 安装 H5 依赖..."
    cd h5 && npm install
    cd ..
    echo "✅ H5 依赖安装完成"
fi

# 检查数据库
if [ ! -f "backend/data/playground.db" ]; then
    echo "🗄️  初始化数据库..."
    cd backend && npm run init-db
    cd ..
    echo "✅ 数据库初始化完成"
fi

echo ""
echo "===================================="
echo "🚀 系统准备就绪！"
echo ""
echo "📋 请分别在三个终端中执行以下命令："
echo ""
echo "1️⃣  启动后端服务:"
echo "   cd backend && npm run dev"
echo ""
echo "2️⃣  启动收银&管理后台:"
echo "   cd frontend && npm run dev"
echo ""
echo "3️⃣  启动家长H5端:"
echo "   cd h5 && npm run dev"
echo ""
echo "🌐 访问地址:"
echo "   - 收银&管理后台: http://localhost:5173"
echo "   - 家长H5端: http://localhost:5174"
echo ""
echo "🔑 默认账号: admin / 123456"
echo "===================================="
