"""
JARVIS THIRU — Coding Assistant
Code generation, explanation, debugging, linting, script execution, and Git assistance.
All heavy AI tasks are delegated to the OllamaClient in coding mode.
"""
import ast
import subprocess
import tempfile
import os
from pathlib import Path
from typing import Tuple, Optional
from app.utils.logger import get_logger

logger = get_logger("CodingAssistant")


# ---------------------------------------------------------------------------
# Syntax validation
# ---------------------------------------------------------------------------

def validate_python_syntax(code: str) -> Tuple[bool, str]:
    """Check Python code for syntax errors. Returns (valid, message)."""
    try:
        ast.parse(code)
        return True, "✅ Syntax is valid."
    except SyntaxError as e:
        return False, f"❌ SyntaxError at line {e.lineno}: {e.msg}"


# ---------------------------------------------------------------------------
# Script execution
# ---------------------------------------------------------------------------

def run_python_snippet(code: str, timeout: int = 30) -> Tuple[bool, str, str]:
    """
    Execute a Python snippet in a subprocess and return (success, stdout, stderr).
    Always runs in a temp file for isolation.
    """
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py",
                                     delete=False, encoding="utf-8") as tmp:
        tmp.write(code)
        tmp_path = tmp.name
    try:
        result = subprocess.run(
            ["python", tmp_path],
            capture_output=True, text=True, timeout=timeout
        )
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "", f"Script timed out after {timeout}s."
    except Exception as exc:
        return False, "", str(exc)
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def run_powershell_snippet(script: str, timeout: int = 30) -> Tuple[bool, str, str]:
    """Execute a PowerShell snippet and return (success, stdout, stderr)."""
    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
            capture_output=True, text=True, timeout=timeout
        )
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "", f"PowerShell script timed out after {timeout}s."
    except Exception as exc:
        return False, "", str(exc)


# ---------------------------------------------------------------------------
# Git helpers
# ---------------------------------------------------------------------------

def git_status(cwd: Optional[str] = None) -> str:
    """Return `git status` output."""
    try:
        result = subprocess.run(
            ["git", "status"], capture_output=True, text=True, cwd=cwd
        )
        return result.stdout + result.stderr
    except Exception as exc:
        return f"Git error: {exc}"


def git_log(n: int = 10, cwd: Optional[str] = None) -> str:
    """Return recent git log."""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"-{n}"],
            capture_output=True, text=True, cwd=cwd
        )
        return result.stdout.strip() or "(no commits)"
    except Exception as exc:
        return f"Git error: {exc}"


def git_diff(cwd: Optional[str] = None) -> str:
    try:
        result = subprocess.run(
            ["git", "diff", "--stat"], capture_output=True, text=True, cwd=cwd
        )
        return result.stdout.strip() or "(no changes)"
    except Exception as exc:
        return f"Git error: {exc}"


def git_command(command: str, cwd: Optional[str] = None) -> Tuple[bool, str]:
    """Run an arbitrary git command safely."""
    if not command.startswith("git "):
        command = "git " + command
    try:
        result = subprocess.run(
            command, shell=True, capture_output=True, text=True, cwd=cwd
        )
        return result.returncode == 0, (result.stdout + result.stderr).strip()
    except Exception as exc:
        return False, str(exc)


# ---------------------------------------------------------------------------
# File read/write helpers for coding tasks
# ---------------------------------------------------------------------------

def read_file(path: str) -> Tuple[bool, str]:
    try:
        content = Path(path).read_text(encoding="utf-8")
        return True, content
    except Exception as exc:
        return False, str(exc)


def write_file(path: str, content: str) -> Tuple[bool, str]:
    try:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return True, f"Written: {path}"
    except Exception as exc:
        return False, str(exc)


def list_files(directory: str, extensions: Optional[list] = None) -> list:
    """Recursively list files optionally filtered by extensions."""
    try:
        result = []
        for p in Path(directory).rglob("*"):
            if p.is_file():
                if extensions is None or p.suffix.lower() in extensions:
                    result.append(str(p))
        return result
    except Exception as exc:
        logger.error(f"list_files error: {exc}")
        return []
