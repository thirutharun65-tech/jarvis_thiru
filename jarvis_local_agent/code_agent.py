"""
JARVIS THIRU — Autonomous Code & Bug Fixing Agent
Inspects stack traces, identifies broken lines, generates diffs, and verifies patches.
"""
import re
import difflib
from typing import Dict, Any, List
from .files import FileAgent
from .terminal import TerminalEngine

class CodeAgent:
    def __init__(self, workspace_root: str = None):
        self.file_agent = FileAgent(workspace_root)
        self.terminal = TerminalEngine(self.file_agent.workspace_root)

    def analyze_error(self, error_trace: str) -> Dict[str, Any]:
        file_match = re.search(r'File ["\'](.*?)["\'], line (\d+)', error_trace)
        syntax_match = re.search(r'SyntaxError:\s*(.*)', error_trace)
        type_match = re.search(r'(TypeError|ValueError|IndexError|KeyError):\s*(.*)', error_trace)

        detected_file = file_match.group(1) if file_match else None
        detected_line = int(file_match.group(2)) if file_match else None
        error_msg = syntax_match.group(1) if syntax_match else (type_match.group(2) if type_match else "Runtime Exception")

        return {
            "file": detected_file,
            "line": detected_line,
            "errorType": type_match.group(1) if type_match else ("SyntaxError" if syntax_match else "RuntimeError"),
            "message": error_msg,
            "analysis": f"Issue detected in {detected_file or 'workspace'} at line {detected_line or 'unknown'}."
        }

    def generate_patch(self, file_path: str, old_snippet: str, new_snippet: str) -> Dict[str, Any]:
        file_data = self.file_agent.read_file(file_path)
        if not file_data.get("success"):
            return {"success": False, "error": file_data.get("error")}

        original_text = file_data["content"]
        if old_snippet not in original_text:
            return {"success": False, "error": "Target snippet not found in source."}

        patched_text = original_text.replace(old_snippet, new_snippet, 1)
        diff_lines = list(difflib.unified_diff(
            original_text.splitlines(keepends=True),
            patched_text.splitlines(keepends=True),
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}"
        ))

        return {
            "success": True,
            "filePath": file_path,
            "diff": "".join(diff_lines),
            "newContent": patched_text
        }

    def apply_patch(self, file_path: str, new_content: str) -> Dict[str, Any]:
        return self.file_agent.write_file(file_path, new_content)
