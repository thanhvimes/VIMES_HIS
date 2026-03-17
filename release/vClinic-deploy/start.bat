@echo off
REM vClinic Quick Start Script for Windows

echo Starting vClinic Backend...

cd backend

REM Check if .env exists
if not exist .env (
    echo Error: .env file not found!
    echo Please copy .env.example to .env and configure it first:
    echo    copy .env.example .env
    echo    notepad .env
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    npm install --production
)

REM Start with PM2
where pm2 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting with PM2...
    pm2 start src/server.js --name vclinic-backend
    pm2 save
    echo Backend started with PM2
    echo View logs: pm2 logs vclinic-backend
) else (
    echo PM2 not found, starting with npm...
    npm start
)
