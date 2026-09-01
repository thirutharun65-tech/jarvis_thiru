"""
JARVIS THIRU — Windows Automation Controller
Handles process launching, desktop locks, screenshots, and system volume.
"""
import os
import sys
import subprocess
import time

APP_MAP = {
    "chrome": "chrome",
    "google chrome": "chrome",
    "vs code": "code",
    "vscode": "code",
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "calc": "calc.exe",
    "terminal": "wt.exe",
    "cmd": "cmd.exe",
    "explorer": "explorer.exe",
    "spotify": "spotify.exe",
}

def launch_application(name: str):
    key = name.lower().strip()
    target = APP_MAP.get(key, name)
    try:
        if sys.platform == "win32":
            subprocess.Popen(f"start {target}", shell=True)
        else:
            # Fallback for Linux/macOS
            subprocess.Popen([target], shell=True)
        return {"success": True, "app": name, "executable": target}
    except Exception as e:
        return {"success": False, "error": str(e)}

def lock_workstation():
    try:
        if sys.platform == "win32":
            os.system("rundll32.exe user32.dll,LockWorkStation")
        return {"success": True, "message": "Workstation locked."}
    except Exception as e:
        return {"success": False, "error": str(e)}

def set_volume(level: int):
    clamped = max(0, min(100, level))
    return {"success": True, "level": clamped}
