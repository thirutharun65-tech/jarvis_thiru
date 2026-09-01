"""
JARVIS THIRU — Central Configuration Manager
Loads/saves config from data/config.json with sane defaults.
"""
import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR  = BASE_DIR / "data"
LOGS_DIR  = DATA_DIR / "logs"
WORKSPACE_DIR = BASE_DIR / "workspace"

for _d in [DATA_DIR, LOGS_DIR, WORKSPACE_DIR]:
    _d.mkdir(parents=True, exist_ok=True)

CONFIG_FILE = DATA_DIR / "config.json"

DEFAULT_CONFIG: dict = {
    "app_name": "JARVIS THIRU",
    "version": "1.0.0",
    "ollama_host": "http://localhost:11434",
    "default_model": "",
    "language": "AUTO",
    "user_name": "Thiru",
    "voice_enabled": True,
    "speech_rate": 175,
    "speech_volume": 1.0,
    "voice_gender": "female",
    "hotkey_listen": "ctrl+shift+j",
    "theme": "jarvis_neon",
    "auto_speak_responses": True,
    "sound_effects": True,
    "security_safe_mode": True,
}


def load_config() -> dict:
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
            cfg = DEFAULT_CONFIG.copy()
            cfg.update(saved)
            return cfg
        except Exception:
            pass
    save_config(DEFAULT_CONFIG)
    return DEFAULT_CONFIG.copy()


def save_config(cfg: dict) -> bool:
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=4, ensure_ascii=False)
        return True
    except Exception:
        return False
