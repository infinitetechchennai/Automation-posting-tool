@echo off
title SocialPilot AI - Local Launcher
echo ========================================================
echo        SocialPilot AI - Full Stack Launcher
echo ========================================================
echo Starting Backend Server on http://localhost:8000 ...
start "SocialPilot Backend" cmd /k "cd backend && python run_server.py"

echo Starting Frontend Server on http://localhost:5173 ...
start "SocialPilot Frontend" cmd /k "cd frontend && npm run dev"

echo ========================================================
echo SocialPilot AI is launching!
echo Backend Docs:  http://localhost:8000/docs
echo Frontend App:  http://localhost:5173
echo ========================================================
pause
