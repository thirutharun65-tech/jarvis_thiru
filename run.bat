@echo off
title JARVIS THIRU — Launching...
echo.
echo  ============================================
echo   J.A.R.V.I.S  T H I R U   -  v1.0
echo   Personal Desktop AI Assistant
echo  ============================================
echo.

REM -- Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

REM -- Install / check dependencies
echo [INFO] Checking dependencies...
pip install -r requirements.txt --quiet --disable-pip-version-check

REM -- Start Ollama in background if not running
echo [INFO] Checking Ollama...
tasklist /fi "imagename eq ollama.exe" 2>NUL | find /i "ollama.exe" >nul
if %errorlevel% neq 0 (
    echo [INFO] Starting Ollama in background...
    start /min "" ollama serve
    timeout /t 3 /nobreak >nul
)

echo.
echo [INFO] Launching JARVIS THIRU...
echo.
python main.py
pause
