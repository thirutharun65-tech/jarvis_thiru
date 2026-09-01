"""
JARVIS THIRU — Terminal & Process Execution Engine
Executes commands, captures stdout/stderr, handles timeouts and safe process terminations.
"""
import subprocess
import shlex
import time
import os
import signal
from typing import Dict, Any

class TerminalEngine:
    def __init__(self, default_cwd: str = None):
        self.default_cwd = default_cwd or os.getcwd()

    def run_command(self, command: str, cwd: str = None, timeout_seconds: float = 30.0) -> Dict[str, Any]:
        target_dir = cwd or self.default_cwd
        if not os.path.exists(target_dir):
            target_dir = os.getcwd()

        start_time = time.time()
        try:
            process = subprocess.Popen(
                command,
                shell=True,
                cwd=target_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(timeout=timeout_seconds)
            duration = round(time.time() - start_time, 2)
            return {
                "success": process.returncode == 0,
                "exitCode": process.returncode,
                "stdout": stdout,
                "stderr": stderr,
                "duration": duration,
                "command": command,
                "cwd": target_dir
            }
        except subprocess.TimeoutExpired:
            process.kill()
            return {
                "success": False,
                "exitCode": -1,
                "stdout": "",
                "stderr": f"Command timed out after {timeout_seconds}s.",
                "duration": timeout_seconds,
                "command": command,
                "cwd": target_dir
            }
        except Exception as e:
            return {
                "success": False,
                "exitCode": 1,
                "stdout": "",
                "stderr": str(e),
                "duration": 0.0,
                "command": command,
                "cwd": target_dir
            }
