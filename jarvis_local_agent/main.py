"""
JARVIS THIRU — Windows Native Local Agent Bridge (v2.0)
Run this on your Windows machine for direct OS control, hardware telemetry, and local Ollama routing.
"""
import os
import sys
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from .agent import JarvisAgent
from .system import get_system_metrics
from .ollama import check_ollama_status

PORT = 8765
agent_instance = JarvisAgent()

class JarvisLocalHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        self._send_cors_headers()
        if self.path == '/status' or self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            ollama_info = check_ollama_status()
            data = {
                "status": "ONLINE",
                "platform": sys.platform,
                "pid": os.getpid(),
                "agentVersion": "2.0.0",
                "ollama": ollama_info,
                "workspace": agent_instance.files.workspace_root
            }
            self.wfile.write(json.dumps(data).encode('utf-8'))

        elif self.path == '/metrics':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            stats = get_system_metrics()
            self.wfile.write(json.dumps(stats).encode('utf-8'))

        elif self.path.startswith('/files'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            files = agent_instance.files.list_files()
            self.wfile.write(json.dumps({"files": files}).encode('utf-8'))

        elif self.path == '/education/problems':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            probs = agent_instance.education.get_practice_problems()
            self.wfile.write(json.dumps({"problems": probs}).encode('utf-8'))

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            req_data = json.loads(body) if body else {}
        except Exception:
            req_data = {}

        self._send_cors_headers()

        if self.path == '/command':
            cmd_text = req_data.get('command') or req_data.get('text', '')
            res = agent_instance.process_command(cmd_text)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))

        elif self.path == '/launch':
            app_name = req_data.get('app', '')
            res = agent_instance.process_command(f"open {app_name}")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))

        elif self.path == '/lock':
            res = agent_instance.process_command("lock pc")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))

        elif self.path == '/speak':
            text = req_data.get('text', '')
            agent_instance.tts.speak(text)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        elif self.path == '/projects/scaffold':
            name = req_data.get('name', 'app')
            lang = req_data.get('language', 'python')
            res = agent_instance.projects.scaffold_project(name, lang)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))

        elif self.path == '/projects/run':
            name = req_data.get('name', 'app')
            res = agent_instance.projects.run_project(name)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))

        else:
            self.send_response(404)
            self.end_headers()

def main():
    print(f"============================================================")
    print(f"  JARVIS THIRU — WINDOWS LOCAL AGENT BRIDGE (v2.0)")
    print(f"============================================================")
    print(f"• Local Endpoint: http://127.0.0.1:{PORT}")
    print(f"• Telemetry: psutil / Windows native")
    print(f"• Intent Router: English / தமிழ் (Tamil) / Tanglish")
    print(f"• Ollama integration: Active on http://127.0.0.1:11434")
    print(f"============================================================")
    server = HTTPServer(('127.0.0.1', PORT), JarvisLocalHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping agent...")
        server.server_close()

if __name__ == '__main__':
    main()
