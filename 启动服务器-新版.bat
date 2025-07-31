@echo off
chcp 65001 >nul
title AI仁波切服务器

echo ================================
echo      AI仁波切本地服务器
echo ================================
echo.

cd /d "%~dp0"

echo 正在检查Python安装...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Python，请先安装Python 3.6+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Python检查通过
echo.
echo 正在启动服务器...
echo 启动后请访问: http://localhost:8000
echo.

python "简单服务器.py"

echo.
echo 服务器已停止
pause