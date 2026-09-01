"""
JARVIS THIRU — Integrated Local Agent Orchestrator
Connects routing, permissions, memory, filesystem, code studio, system telemetry, and Ollama.
"""
from typing import Dict, Any
from .router import classify_intent
from .windows import launch_application, lock_workstation, set_volume
from .system import get_system_metrics
from .ollama import check_ollama_status, generate_chat_response
from .security_lab import is_target_authorized, compute_hash, encode_transform
from .config import load_config
from .permissions import PermissionManager
from .memory import MemoryStore
from .files import FileAgent
from .projects import ProjectEngine
from .code_agent import CodeAgent
from .education import EducationAgent
from .tts import TTSEngine

class JarvisAgent:
    def __init__(self):
        self.config = load_config()
        self.permissions = PermissionManager(self.config.get("permission_level", "NORMAL"))
        self.memory = MemoryStore()
        self.files = FileAgent(self.config.get("workspace_dir"))
        self.projects = ProjectEngine(self.config.get("workspace_dir"))
        self.code = CodeAgent(self.config.get("workspace_dir"))
        self.education = EducationAgent()
        self.tts = TTSEngine(self.config.get("speech_rate", 1.05), self.config.get("speech_volume", 1.0))

    def process_command(self, user_text: str) -> Dict[str, Any]:
        self.memory.add_message("user", user_text)
        category, intent, params = classify_intent(user_text)
        lang = params.get("lang", "EN")

        # 1. APP LAUNCH
        if category == "APP":
            app_name = params.get("app", "notepad")
            res = launch_application(app_name)
            speech = f"{app_name.capitalize()} open panren bro." if lang == "TANGLISH" else (f"{app_name.capitalize()} திறக்கப்படுகிறது." if lang == "TA" else f"Launching {app_name.capitalize()}.")
            self.memory.log_task(f"Launch {app_name}", "COMPLETE", "APP")
            self.memory.add_message("assistant", speech, lang)
            return {"category": category, "result": res, "speech": speech}

        # 2. SYSTEM TELEMETRY / LOCK
        elif category == "SYSTEM":
            if intent == "get_system_status":
                stats = get_system_metrics()
                speech = f"CPU {stats['cpuUsage']} percent bro." if lang == "TANGLISH" else (f"சிபியூ பயன்பாடு {stats['cpuUsage']} சதவீதம்." if lang == "TA" else f"CPU utilization is currently at {stats['cpuUsage']} percent.")
                self.memory.add_message("assistant", speech, lang)
                return {"category": category, "stats": stats, "speech": speech}
            elif intent == "lock_workstation":
                res = lock_workstation()
                speech = "Workstation locked bro." if lang == "TANGLISH" else "கணினி பூட்டப்பட்டது."
                self.memory.add_message("assistant", speech, lang)
                return {"category": category, "result": res, "speech": speech}

        # 3. PROJECT CREATION / RUN
        elif category == "PROJECT":
            if intent == "create_project":
                scaffold_res = self.projects.scaffold_project("calc_app", "python")
                speech = "Python project create panniten bro. Files ready." if lang == "TANGLISH" else "Python திட்டம் வெற்றிகரமாக உருவாக்கப்பட்டது."
                self.memory.log_task("Create Python Project", "COMPLETE", "PROJECT")
                self.memory.add_message("assistant", speech, lang)
                return {"category": category, "result": scaffold_res, "speech": speech}
            elif intent == "run_project":
                run_res = self.projects.run_project("calc_app")
                speech = "Project execute aachu bro." if lang == "TANGLISH" else "திட்டம் இயக்கப்பட்டது."
                self.memory.add_message("assistant", speech, lang)
                return {"category": category, "result": run_res, "speech": speech}

        # 4. BUG FIXING / CODE
        elif category == "CODE":
            speech = "Error inspect panni fix panren bro." if lang == "TANGLISH" else "பிழை சரிபார்க்கப்படுகிறது."
            self.memory.add_message("assistant", speech, lang)
            return {"category": category, "status": "INSPECTING", "speech": speech}

        # 5. SECURITY LAB
        elif category == "SECURITY_LAB":
            speech = "Authorized localhost security lab ready bro." if lang == "TANGLISH" else "பாதுகாப்பு ஆய்வுக்கூடம் தயாராக உள்ளது."
            self.memory.add_message("assistant", speech, lang)
            return {"category": category, "target": "127.0.0.1", "status": "TARGET_LOCKED", "speech": speech}

        # 6. EDUCATION
        elif category == "EDUCATION":
            exp = self.education.explain_topic(user_text, lang)
            self.memory.add_message("assistant", exp, lang)
            return {"category": category, "explanation": exp, "speech": exp}

        # 7. GENERAL CONVERSATION / LLM
        ai_reply = generate_chat_response(user_text, self.config.get("default_model", "phi3"), self.config.get("ollama_url"))
        self.memory.add_message("assistant", ai_reply, lang)
        return {"category": "CONVERSATION", "reply": ai_reply, "speech": ai_reply}
