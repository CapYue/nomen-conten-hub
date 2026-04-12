@echo off
chcp 65001 >nul
echo ========================================
echo   原野 NomadWild 内容工厂 一键启动器
echo ========================================

echo [1/3] 启动小红书 API 服务 (端口 3003)...
start "XHS API (3003)" powershell -NoExit -Command "node xhs_api.js"
timeout /t 2 /nobreak >nul

echo [2/3] 启动豆包 API 服务 (端口 3004)...
start "Doubao API (3004)" powershell -NoExit -Command "node doubao_api.js"
timeout /t 2 /nobreak >nul

echo [3/3] 启动前端网站 (端口 5173)...
start "Frontend (5173)" powershell -NoExit -Command "npm run dev"

echo.
echo ========================================
echo   全部启动命令已发送！
echo   请在弹出的 3 个新窗口中查看运行日志。
echo   前端地址：http://localhost:5173
echo   小红书 API：http://localhost:3003
echo   豆包 API：http://localhost:3004
echo ========================================
pause
