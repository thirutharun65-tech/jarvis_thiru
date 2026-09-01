"""
JARVIS THIRU — Configuration Module
"""
import os
import json

CONFIG_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(CONFIG_DIR, "config.json")

DEFAULT_CONFIG = {
    "user_name": "Thiru",
    "language": "AUTO",
    "port": 8765,
    "token": "jarvis-thiru-secure-token",
    "ollama_url": "http://127.0.0.1:11434",
    "default_model": "phi3",
    "speech_rate": 1.05,
    "speech_pitch": 1.0,
    "speech_volume": 1.0,
    "sound_effects": True,
    "wake_word": "Jarvis",
    "permission_level": "NORMAL",
    "workspace_dir": os.path.abspath(os.path.join(CONFIG_DIR, "..", "workspace")),
    "security_target": "127.0.0.1"
}

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return {**DEFAULT_CONFIG, **json.load(f)}
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()

def save_config(cfg):
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
        return True
    except Exception:
        return False
