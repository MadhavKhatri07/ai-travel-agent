@echo off
title WanderAI - AI Travel Agent Starter
echo ============================================================
echo   Launching WanderAI - AI Travel Agent & Public Backend
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Python Backend API on port 5000...
start /b python backend/app.py > nul 2>&1

timeout /t 2 /nobreak > nul

echo [2/2] Starting Frontend Web Server on port 8080...
start /b python -m http.server 8080 > nul 2>&1

timeout /t 1 /nobreak > nul

echo Opening WanderAI in your browser...
start http://localhost:8080

echo.
echo ============================================================
echo WanderAI is now active at: http://localhost:8080
echo Keep this window open while using the application.
echo ============================================================
pause
