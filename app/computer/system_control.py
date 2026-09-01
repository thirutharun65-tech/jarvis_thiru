"""
JARVIS THIRU — PC System Control
Real automation: launch apps, volume, brightness, screenshots, lock, shutdown.
"""
import os
import subprocess
import platform
from pathlib import Path
from typing import Tuple, Optional
from app.utils.logger import get_logger

logger = get_logger("SystemControl")

# Allowed executables (security whitelist — safe mode)
_WHITELIST = {
    "notepad", "calc", "mspaint", "explorer", "cmd", "powershell",
    "code", "chrome", "msedge", "firefox", "winword", "excel",
    "vlc", "spotify", "obs64", "taskmgr", "control", "regedit",
    "python", "pip", "git", "node", "npm"
}


def launch_app(name: str, safe_mode: bool = True) -> Tuple[bool, str]:
    """
    Launch a Windows application by name or full path.
    :returns: (success, message)
    """
    name_lower = name.strip().lower().replace(".exe", "")
    if safe_mode and name_lower not in _WHITELIST:
        return False, (f"'{name}' is not on the approved launch list. "
                       "Disable safe mode or add it to the whitelist.")
    try:
        target = name if name.endswith(".exe") else name
        os.startfile(target)
        logger.info(f"Launched: {target}")
        return True, f"Launched {name} successfully."
    except FileNotFoundError:
        # Try via shell
        try:
            subprocess.Popen(["start", "", name], shell=True)
            return True, f"Launched {name} via shell."
        except Exception as exc:
            logger.error(f"launch_app shell fallback failed: {exc}")
            return False, f"Could not launch '{name}': {exc}"
    except Exception as exc:
        logger.error(f"launch_app failed: {exc}")
        return False, str(exc)


def open_file(path: str) -> Tuple[bool, str]:
    """Open any file with its default Windows application."""
    p = Path(path)
    if not p.exists():
        return False, f"File not found: {path}"
    try:
        os.startfile(str(p))
        return True, f"Opened: {p.name}"
    except Exception as exc:
        return False, str(exc)


def open_url(url: str) -> Tuple[bool, str]:
    """Open a URL in the default browser."""
    import webbrowser
    try:
        webbrowser.open(url)
        return True, f"Opened {url} in browser."
    except Exception as exc:
        return False, str(exc)


def take_screenshot(save_dir: Optional[str] = None) -> Tuple[bool, str]:
    """Capture the full screen and save it. Returns (success, filepath_or_error)."""
    try:
        import pyautogui
        from datetime import datetime
        folder = Path(save_dir) if save_dir else Path.home() / "Pictures"
        folder.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        fp = folder / f"jarvis_screenshot_{ts}.png"
        img = pyautogui.screenshot()
        img.save(str(fp))
        logger.info(f"Screenshot saved: {fp}")
        return True, str(fp)
    except Exception as exc:
        logger.error(f"Screenshot failed: {exc}")
        return False, str(exc)


def set_volume(level: int) -> Tuple[bool, str]:
    """
    Set system volume (0-100) using PowerShell.
    Uses the Windows built-in Audio API via nircmd if available, else PS script.
    """
    level = max(0, min(100, level))
    ps_script = (
        f"$vol = {level / 100};"
        "$devices = [Audio.AudioDevice]::GetDefault([Audio.AudioDeviceType]::Rendering);"
        # Fallback approach via COM
        "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"  # not exact, use PS Audio module below
    )
    # Reliable approach: PowerShell with audio module
    script = (
        f"Add-Type -TypeDefinition @\"\npublic class Vol {{\n"
        f"[System.Runtime.InteropServices.DllImport(\"winmm.dll\")]\n"
        f"public static extern int waveOutSetVolume(IntPtr h, uint vol);\n}}\n\"@;\n"
        f"$vol = {level}; $normalized = [Math]::Round($vol / 100 * 65535);\n"
        f"[Vol]::waveOutSetVolume([IntPtr]::Zero, ($normalized -bor ($normalized -shl 16)));"
    )
    try:
        subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
            capture_output=True, timeout=5
        )
        return True, f"Volume set to {level}%."
    except Exception as exc:
        return False, f"Volume change failed: {exc}"


def lock_pc() -> Tuple[bool, str]:
    """Lock the Windows workstation."""
    try:
        subprocess.run(["rundll32.exe", "user32.dll,LockWorkStation"], check=True)
        return True, "PC locked."
    except Exception as exc:
        return False, str(exc)


def shutdown_pc(delay_seconds: int = 30) -> Tuple[bool, str]:
    """Schedule a Windows shutdown (with confirmation delay)."""
    try:
        subprocess.run(["shutdown", "/s", "/t", str(delay_seconds)], check=True)
        return True, f"Shutdown scheduled in {delay_seconds}s. Run `shutdown /a` to abort."
    except Exception as exc:
        return False, str(exc)


def restart_pc(delay_seconds: int = 30) -> Tuple[bool, str]:
    try:
        subprocess.run(["shutdown", "/r", "/t", str(delay_seconds)], check=True)
        return True, f"Restart scheduled in {delay_seconds}s."
    except Exception as exc:
        return False, str(exc)


def abort_shutdown() -> Tuple[bool, str]:
    try:
        subprocess.run(["shutdown", "/a"], check=True)
        return True, "Shutdown aborted."
    except Exception as exc:
        return False, str(exc)


def run_command(command: str, shell: bool = True, cwd: Optional[str] = None, timeout: int = 30) -> Tuple[bool, str, str]:
    """
    Execute an arbitrary shell command.
    Returns (success, stdout, stderr).
    """
    logger.info(f"Executing command: {command!r}")
    try:
        result = subprocess.run(
            command,
            shell=shell,
            capture_output=True,
            text=True,
            cwd=cwd,
            timeout=timeout,
        )
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "", f"Command timed out after {timeout}s."
    except Exception as exc:
        return False, "", str(exc)


def get_running_apps() -> list:
    """Return a list of running process names (deduplicated)."""
    try:
        import psutil
        return sorted({p.name() for p in psutil.process_iter(["name"]) if p.info["name"]})
    except Exception:
        return []


def kill_process(name_or_pid) -> Tuple[bool, str]:
    """Kill a process by name or PID."""
    try:
        import psutil
        killed = []
        if isinstance(name_or_pid, int):
            psutil.Process(name_or_pid).kill()
            killed.append(str(name_or_pid))
        else:
            for proc in psutil.process_iter(["name", "pid"]):
                if proc.info["name"].lower() == name_or_pid.lower():
                    proc.kill()
                    killed.append(str(proc.info["pid"]))
        if killed:
            return True, f"Killed: {', '.join(killed)}"
        return False, f"No process found matching: {name_or_pid}"
    except Exception as exc:
        return False, str(exc)
