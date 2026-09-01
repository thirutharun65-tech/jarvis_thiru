"""
JARVIS THIRU — Ollama Chat Client
Thin, streaming wrapper around the local Ollama REST API with graceful offline fallback.
"""
import json
from typing import Generator, List, Dict, Optional

import requests

from app.utils.logger import get_logger
from app.config import load_config
from app.ai.prompts import get_system_prompt

logger = get_logger("OllamaClient")


class OllamaClient:
    def __init__(self, host: Optional[str] = None, default_model: Optional[str] = None):
        cfg = load_config()
        self.host = (host or cfg.get("ollama_host", "http://localhost:11434")).rstrip("/")
        self.default_model = default_model or cfg.get("default_model", "phi3")
        self._online: Optional[bool] = None  # cached after first check

    # ------------------------------------------------------------------
    # Connection helpers
    # ------------------------------------------------------------------
    def is_online(self) -> bool:
        try:
            r = requests.get(f"{self.host}/api/version", timeout=2)
            self._online = r.status_code == 200
        except Exception:
            self._online = False
        return bool(self._online)

    def get_installed_models(self) -> List[str]:
        try:
            r = requests.get(f"{self.host}/api/tags", timeout=3)
            if r.status_code == 200:
                return [m["name"] for m in r.json().get("models", [])]
        except Exception as exc:
            logger.debug(f"get_installed_models failed: {exc}")
        return []

    # ------------------------------------------------------------------
    # Core streaming chat
    # ------------------------------------------------------------------
    def chat_stream(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        mode: str = "assistant",
        lang: str = "AUTO",
        user_name: str = "Thiru",
    ) -> Generator[str, None, None]:
        """
        Stream the assistant reply token by token.
        Falls back to built-in canned replies if Ollama is offline.
        """
        model = model or self.default_model
        system_prompt = get_system_prompt(mode=mode, lang=lang, user_name=user_name)
        full_messages = [{"role": "system", "content": system_prompt}] + messages

        if not self.is_online():
            logger.warning("Ollama offline — using fallback reply.")
            fallback = self._fallback_reply(messages[-1]["content"] if messages else "")
            for word in fallback.split(" "):
                yield word + " "
            return

        url = f"{self.host}/api/chat"
        payload = {
            "model": model,
            "messages": full_messages,
            "stream": True,
            "options": {"temperature": 0.72, "top_p": 0.9},
        }

        try:
            with requests.post(url, json=payload, stream=True, timeout=90) as resp:
                if resp.status_code == 200:
                    for raw_line in resp.iter_lines():
                        if not raw_line:
                            continue
                        try:
                            data = json.loads(raw_line.decode("utf-8"))
                            token = data.get("message", {}).get("content", "")
                            if token:
                                yield token
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
                else:
                    msg = f"Ollama returned HTTP {resp.status_code}: {resp.text[:200]}"
                    logger.error(msg)
                    yield f"\n⚠️ {msg}"
        except requests.exceptions.ConnectionError:
            logger.error("Connection refused — is Ollama running?")
            yield "\n⚠️ Cannot reach Ollama. Please run `ollama serve` in a terminal."
        except Exception as exc:
            logger.exception("Unexpected error during Ollama streaming.")
            yield f"\n⚠️ Unexpected error: {exc}"

    # ------------------------------------------------------------------
    # Non-streaming convenience wrapper (for coding/tools)
    # ------------------------------------------------------------------
    def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        mode: str = "assistant",
        lang: str = "AUTO",
        user_name: str = "Thiru",
    ) -> str:
        return "".join(
            self.chat_stream(messages, model=model, mode=mode, lang=lang, user_name=user_name)
        )

    # ------------------------------------------------------------------
    # Offline fallback
    # ------------------------------------------------------------------
    def _fallback_reply(self, prompt: str) -> str:
        p = prompt.lower()
        if any(k in p for k in ("hello", "hi", "vanakkam", "hey")):
            return "Greetings, Sir. JARVIS THIRU is online and standing by. How may I assist you today?"
        if any(k in p for k in ("who are you", "yaar neenga", "introduce")):
            return ("I am JARVIS THIRU — your personalized AI assistant and PC automation co-pilot. "
                    "I can help you operate your computer, write code, manage files, and automate workflows.")
        if any(k in p for k in ("status", "system", "how are you")):
            return ("All local subsystems are nominal, Sir. The Ollama neural engine is currently offline. "
                    "You may start it by running `ollama serve` in a terminal.")
        if any(k in p for k in ("open", "launch", "start")):
            return "Understood. Routing that command to the automation layer now, Sir."
        return (f"Understood, Sir. I received: '{prompt[:80]}'. "
                "Start Ollama (`ollama serve`) to enable full neural reasoning.")
