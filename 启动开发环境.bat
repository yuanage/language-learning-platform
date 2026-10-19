@echo off
chcp 65001 >nul
echo ============================================
echo   语际 LingoBridge 开发环境一键启动
echo ============================================

cd /d "%~dp0"

echo [1/3] 启动 MySQL 容器（端口 3308）...
docker compose up -d mysql
if errorlevel 1 (
  echo 启动失败：请确认 Docker Desktop 已运行
  pause
  exit /b 1
)

echo [2/3] 等待数据库就绪并初始化数据...
timeout /t 20 /nobreak >nul
cd server
if not exist node_modules (
  echo 安装后端依赖...
  call npm install --registry=https://registry.npmmirror.com
)
start "llp-server" cmd /k "npm run seed && npm start"

cd ..\client
echo [3/3] 启动前端...
if not exist node_modules (
  echo 安装前端依赖...
  call npm install --registry=https://registry.npmmirror.com
)
start "llp-client" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul
start http://localhost:5174
echo 完成：前端 http://localhost:5174  后端 http://localhost:3002
echo 演示账号：admin/admin123  demo/demo1234
pause
