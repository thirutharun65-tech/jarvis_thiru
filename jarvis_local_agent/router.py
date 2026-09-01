"""
JARVIS THIRU — Local Fast Intent Router
Sub-millisecond keyword and regex categorization in English, Tamil, and Tanglish.
"""
import re

def detect_language(text: str) -> str:
    # Check for Tamil script
    if re.search(r'[\u0B80-\u0BFF]', text):
        return "TA"
    # Check for Tanglish markers
    if re.search(r'\b(panren|pannu|sollu|irukku|enna|eppadi|indha|andha|paaru|edu|kudu|podu|la|aachu|bro)\b', text, re.IGNORECASE):
        return "TANGLISH"
    return "EN"

def classify_intent(raw_text: str):
    text = raw_text.strip()
    lower = text.lower()
    cleaned = re.sub(r'^(jarvis|ஜார்விஸ்|hey jarvis|hi jarvis)[,\s]*', '', lower, flags=re.IGNORECASE).strip()
    lang = detect_language(text)

    # 1. SCREENSHOT
    if re.search(r'\b(screenshot|capture screen|திரைப்பிடிப்பு)\b', cleaned, re.IGNORECASE):
        return "SCREENSHOT", "capture_screenshot", {"target": "screen", "lang": lang}

    # 2. SYSTEM STATUS / CPU / RAM
    if re.search(r'\b(cpu|ram|memory|system status|hardware|battery|சிபியூ|நிலை)\b', cleaned, re.IGNORECASE):
        return "SYSTEM", "get_system_status", {"target": "system", "lang": lang}

    # 3. WORKSTATION LOCK / SHUTDOWN
    if re.search(r'\b(lock pc|lock computer|லாக்)\b', cleaned, re.IGNORECASE):
        return "SYSTEM", "lock_workstation", {"target": "lock", "lang": lang}

    if re.search(r'\b(shutdown|power off|reboot|restart)\b', cleaned, re.IGNORECASE):
        return "SYSTEM", "request_power", {"target": "power", "lang": lang}

    # 4. APP LAUNCH
    app_match = re.search(r'\b(open|launch|start|run|திற)\s+(chrome|vs\s*code|vscode|notepad|calculator|calc|terminal|cmd|explorer|spotify)\b', cleaned, re.IGNORECASE)
    if not app_match:
        app_match = re.search(r'\b(chrome|vs\s*code|vscode|notepad|calculator|calc|terminal|explorer)\s+(open pannu|thira|launch)\b', cleaned, re.IGNORECASE)

    if app_match:
        app_name = app_match.group(2) if app_match.lastindex >= 2 else app_match.group(1)
        return "APP", "launch_app", {"app": app_name.strip(), "lang": lang}

    # 5. PROJECT / CODING
    if re.search(r'\b(create project|build python|create python|scaffold)\b', cleaned, re.IGNORECASE):
        return "PROJECT", "create_project", {"prompt": raw_text, "lang": lang}

    if re.search(r'\b(run project|run this|indha project run pannu)\b', cleaned, re.IGNORECASE):
        return "PROJECT", "run_project", {"lang": lang}

    if re.search(r'\b(fix error|fix bug|debug|indha error fix pannu)\b', cleaned, re.IGNORECASE):
        return "CODE", "fix_error", {"prompt": raw_text, "lang": lang}

    # 6. SECURITY LAB
    if re.search(r'\b(security lab|scan localhost|port scan|vulnerability|hash)\b', cleaned, re.IGNORECASE):
        return "SECURITY_LAB", "run_scan", {"target": "127.0.0.1", "lang": lang}

    # 7. EDUCATION
    if re.search(r'\b(explain|teach me|linked list|recursion|dsa|dbms|operating system)\b', cleaned, re.IGNORECASE):
        return "EDUCATION", "explain_concept", {"topic": raw_text, "lang": lang}

    return "CONVERSATION", "chat", {"prompt": raw_text, "lang": lang}
