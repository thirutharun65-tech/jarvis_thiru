"""
JARVIS THIRU — Project Scaffolding & Lifecycle Engine
Supports Python, Java, Node.js/React, and C++ project templates.
"""
import os
import json
from typing import Dict, Any, List
from .files import FileAgent
from .terminal import TerminalEngine

PROJECT_TEMPLATES = {
    "python": {
        "files": {
            "main.py": '"""\nPython Application\n"""\n\ndef main():\n    print("JARVIS Python Project running smoothly.")\n\nif __name__ == "__main__":\n    main()\n',
            "test_main.py": 'import unittest\nfrom main import main\n\nclass TestApp(unittest.TestCase):\n    def test_basic(self):\n        self.assertTrue(True)\n\nif __name__ == "__main__":\n    unittest.main()\n',
            "requirements.txt": "# Add dependencies here\n",
            "README.md": "# Python Project\nManaged by JARVIS THIRU Agent.\n"
        },
        "run_cmd": "python main.py",
        "test_cmd": "python -m unittest test_main.py"
    },
    "java": {
        "files": {
            "src/Main.java": 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("JARVIS Java Application Initialized.");\n    }\n}\n',
            "README.md": "# Java Application\nManaged by JARVIS THIRU Agent.\n"
        },
        "run_cmd": "javac src/Main.java && java -cp src Main",
        "test_cmd": "javac src/Main.java"
    },
    "node": {
        "files": {
            "index.js": 'console.log("JARVIS Node.js Microservice Active.");\n',
            "package.json": '{\n  "name": "jarvis-node-app",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js",\n    "test": "node index.js"\n  }\n}\n',
            "README.md": "# Node.js Project\nManaged by JARVIS THIRU Agent.\n"
        },
        "run_cmd": "node index.js",
        "test_cmd": "node index.js"
    }
}

class ProjectEngine:
    def __init__(self, workspace_root: str = None):
        self.file_agent = FileAgent(workspace_root)
        self.terminal = TerminalEngine(self.file_agent.workspace_root)

    def scaffold_project(self, project_name: str, language: str = "python") -> Dict[str, Any]:
        lang_key = language.lower().strip()
        template = PROJECT_TEMPLATES.get(lang_key, PROJECT_TEMPLATES["python"])
        
        project_dir = project_name.lower().replace(" ", "-")
        created_files = []

        for rel_file, content in template["files"].items():
            full_rel = os.path.join(project_dir, rel_file)
            self.file_agent.write_file(full_rel, content)
            created_files.append(full_rel)

        return {
            "success": True,
            "projectName": project_dir,
            "language": lang_key,
            "files": created_files,
            "mainFile": created_files[0] if created_files else "",
            "runCmd": template.get("run_cmd", ""),
            "testCmd": template.get("test_cmd", "")
        }

    def run_project(self, project_name: str, custom_cmd: str = None) -> Dict[str, Any]:
        proj_dir = os.path.join(self.file_agent.workspace_root, project_name)
        if not os.path.exists(proj_dir):
            return {"success": False, "stderr": f"Project directory '{project_name}' not found."}

        cmd = custom_cmd or "python main.py"
        # detect files
        if os.path.exists(os.path.join(proj_dir, "main.py")):
            cmd = "python main.py"
        elif os.path.exists(os.path.join(proj_dir, "index.js")):
            cmd = "node index.js"
        elif os.path.exists(os.path.join(proj_dir, "src", "Main.java")):
            cmd = "javac src/Main.java && java -cp src Main"

        return self.terminal.run_command(cmd, cwd=proj_dir)
