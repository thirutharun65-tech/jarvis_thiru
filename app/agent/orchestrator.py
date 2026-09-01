"""
JARVIS THIRU — Agent Orchestrator
Classifies user intents and routes them to the correct tool or AI mode.
"""
import re
from typing import Tuple, Optional
from app.utils.logger import get_logger

logger = get_logger("Orchestrator")


# ---------------------------------------------------------------------------
# Intent classification
# ---------------------------------------------------------------------------

_SYSTEM_PATTERNS = [
    (r"\b(open|launch|start|run)\s+(notepad|calc|calculator|paint|explorer|cmd|terminal|chrome|edge|firefox|spotify|vlc|obs|word|excel|vs code|code)\b", "launch_app"),
    (r"\b(open|launch|start)\s+(.+\.(exe|bat|lnk))\b", "launch_file"),
    (r"\b(open|show|go to|browse)\s+(https?://\S+)", "open_url"),
    (r"\b(screenshot|capture screen|take a screenshot)\b", "screenshot"),
    (r"\b(set volume|volume to|volume at)\s+(\d+)\b", "set_volume"),
    (r"\b(lock|lock pc|lock computer|lock screen)\b", "lock"),
    (r"\b(shutdown|power off|turn off)\b", "shutdown"),
    (r"\b(restart|reboot)\b", "restart"),
    (r"\b(abort shutdown|cancel shutdown)\b", "abort_shutdown"),
    (r"\b(kill|close|terminate)\s+(.+)", "kill_process"),
    (r"\b(system status|pc status|system stats|how is my pc|system info|battery|ram usage|cpu usage)\b", "system_status"),
    (r"\b(running|active)\s+(apps|processes|programs)\b", "running_apps"),
]

_CODING_PATTERNS = [
    (r"\b(write|generate|create|code|program|script|function|class)\s+(a |an |the )?(python|javascript|typescript|bash|powershell|rust|go|c\+\+)?\s*(code|script|function|class|app|program)\b", "coding"),
    (r"\b(debug|fix|explain|review|analyse|analyze|refactor|optimise|optimize)\s+(this|the|my)?\s*(code|script|function|bug|error)\b", "coding"),
    (r"\b(git|commit|push|pull|branch|merge|status|log|diff)\b", "git"),
    (r"\b(run|execute|test)\s+(this|the)?\s*(script|code|test|snippet)\b", "run_code"),
    (r"\b(validate|check|lint)\s+(python|syntax)\b", "validate_code"),
]

_SECURITY_PATTERNS = [
    (r"\b(hash|sha256|sha512|md5|sha1)\s+(this|the)?\s*(file|text|string|message)\b", "hash"),
    (r"\b(base64|encode|decode|hex)\b", "encode"),
    (r"\b(port scan|scan ports?|check ports?)\s*(on\s+)?(.+)\b", "port_scan"),
    (r"\b(ping)\s+(.+)\b", "ping"),
    (r"\b(dns|lookup|resolve)\s+(.+)\b", "dns_lookup"),
    (r"\b(whois)\s+(.+)\b", "whois"),
    (r"\b(network info|local ip|my ip|hostname)\b", "network_info"),
]

_FILE_PATTERNS = [
    (r"\b(search|find)\s+(file|files|for)\s+(.+)\b", "search_files"),
    (r"\b(file info|about file|details of)\s+(.+)\b", "file_info"),
    (r"\b(find|search for)\s+duplicates?\b", "find_duplicates"),
    (r"\b(organize|organise|sort)\s+(folder|directory|files)\b", "organize_folder"),
]


def classify_intent(text: str) -> Tuple[str, str, Optional[str]]:
    """
    Returns (category, intent_key, first_captured_group_or_None).
    Categories: 'system', 'coding', 'security', 'ai'
    """
    lower = text.lower().strip()

    for pattern, intent in _SYSTEM_PATTERNS:
        m = re.search(pattern, lower, re.IGNORECASE)
        if m:
            group = m.group(2) if m.lastindex and m.lastindex >= 2 else (m.group(1) if m.lastindex else None)
            return "system", intent, group

    for pattern, intent in _CODING_PATTERNS:
        m = re.search(pattern, lower, re.IGNORECASE)
        if m:
            return "coding", intent, None

    for pattern, intent in _SECURITY_PATTERNS:
        m = re.search(pattern, lower, re.IGNORECASE)
        if m:
            group = m.group(m.lastindex) if m.lastindex else None
            return "security", intent, group

    for pattern, intent in _FILE_PATTERNS:
        m = re.search(pattern, lower, re.IGNORECASE)
        if m:
            group = m.group(m.lastindex) if m.lastindex else None
            return "file", intent, group

    # Default: send to AI
    return "ai", "chat", None


def route(user_text: str, cfg: dict) -> Tuple[str, str, dict]:
    """
    Route the user input.
    Returns (category, intent, meta_dict) for the GUI/agent to act on.
    """
    category, intent, extra = classify_intent(user_text)
    safe_mode = cfg.get("security_safe_mode", True)
    lang = cfg.get("language", "AUTO")
    user_name = cfg.get("user_name", "Thiru")

    meta = {
        "extra": extra,
        "raw_text": user_text,
        "safe_mode": safe_mode,
        "lang": lang,
        "user_name": user_name,
    }
    logger.debug(f"Route → category={category}, intent={intent}, extra={extra}")
    return category, intent, meta
