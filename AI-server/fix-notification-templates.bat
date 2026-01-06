@echo off
REM ========================================
REM 通知模板表自动修复脚本 (Windows)
REM ========================================

echo.
echo ========================================
echo   通知模板功能修复工具
echo ========================================
echo.

cd /d %~dp0

echo [1/3] 检查数据库状态...
node migrations\check-database.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ 数据库检查失败，请检查数据库连接配置
    pause
    exit /b 1
)

echo.
echo [2/3] 创建数据库表...
node migrations\run-notification-templates-migration.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ 迁移执行失败
    echo.
    echo 请尝试手动执行SQL命令：
    echo psql -U postgres -d 你的数据库名 -f migrations\20240106_create_notification_templates_simple.sql
    pause
    exit /b 1
)

echo.
echo [3/3] 再次检查数据库状态...
node migrations\check-database.js

echo.
echo ========================================
echo   修复完成！
echo ========================================
echo.
echo 现在请执行以下步骤：
echo 1. 刷新浏览器页面 (Ctrl+F5)
echo 2. 进入"通知设置"标签页
echo 3. 查看"通知模板"和"通知接收人"功能
echo.
pause
