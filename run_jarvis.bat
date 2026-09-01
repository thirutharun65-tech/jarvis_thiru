@echo off
title JARVIS THIRU AI Assistant
echo ===================================================
echo     JARVIS THIRU — PERSONAL AI DESKTOP ASSISTANT
echo ===================================================
echo.
echo Starting JARVIS Local Python Bridge...
start "" python jarvis_local_agent/main.py
echo Starting JARVIS Web Application...
npm run dev
pause
