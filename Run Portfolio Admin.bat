@echo off
title Afsar Portfolio - Local Admin Dashboard
cd /d "c:\Users\asus\Desktop\Personal Portfolio website"
echo ================================================================
echo   AFSAR AHMAD PORTFOLIO - LOCAL ADMIN WORKSTATION
echo ================================================================
echo.
echo Starting local server on http://localhost:5000...
echo Opening Admin Dashboard in browser...
echo.
echo Login Credentials:
echo   Username: admin
echo   Password: editor2026!
echo.
echo Videos uploaded here are saved permanently on your laptop!
echo Click "Push to Live Site" inside the dashboard to publish to Render.
echo ================================================================
echo.

start "" "http://localhost:5000/admin"
node server/server.js
pause
