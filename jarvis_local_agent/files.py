"""
JARVIS THIRU — Workspace Filesystem Agent
Handles reading, writing, searching, inspecting, and safe file operations inside the user workspace.
"""
import os
import glob
from typing import List, Dict, Any, Optional

class FileAgent:
    def __init__(self, workspace_root: str = None):
        self.workspace_root = workspace_root or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "workspace"))
        os.makedirs(self.workspace_root, exist_ok=True)

    def _resolve_path(self, rel_path: str) -> str:
        if os.path.isabs(rel_path):
            return rel_path
        return os.path.normpath(os.path.join(self.workspace_root, rel_path))

    def list_files(self, sub_path: str = "") -> List[Dict[str, Any]]:
        target_dir = self._resolve_path(sub_path)
        if not os.path.exists(target_dir):
            return []
        
        result = []
        for root, dirs, files in os.walk(target_dir):
            for d in dirs:
                full = os.path.join(root, d)
                rel = os.path.relpath(full, self.workspace_root)
                result.append({"name": d, "path": rel, "type": "directory"})
            for f in files:
                full = os.path.join(root, f)
                rel = os.path.relpath(full, self.workspace_root)
                result.append({"name": f, "path": rel, "type": "file", "size": os.path.getsize(full)})
        return result

    def read_file(self, rel_path: str) -> Dict[str, Any]:
        target = self._resolve_path(rel_path)
        if not os.path.exists(target) or os.path.isdir(target):
            return {"success": False, "error": f"File '{rel_path}' not found."}
        try:
            with open(target, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            return {"success": True, "path": rel_path, "content": content}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def write_file(self, rel_path: str, content: str) -> Dict[str, Any]:
        target = self._resolve_path(rel_path)
        try:
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "w", encoding="utf-8") as f:
                f.write(content)
            return {"success": True, "path": rel_path, "bytes": len(content)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def search_text(self, query: str) -> List[Dict[str, Any]]:
        matches = []
        for root, _, files in os.walk(self.workspace_root):
            for file_name in files:
                full = os.path.join(root, file_name)
                try:
                    with open(full, "r", encoding="utf-8", errors="ignore") as f:
                        for line_no, line in enumerate(f, start=1):
                            if query.lower() in line.lower():
                                rel = os.path.relpath(full, self.workspace_root)
                                matches.append({
                                    "file": rel,
                                    "line": line_no,
                                    "text": line.strip()
                                })
                except Exception:
                    pass
        return matches
