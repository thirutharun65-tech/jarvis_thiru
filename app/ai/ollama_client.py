"""Reliable native Ollama REST client for the JARVIS desktop app."""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Dict, Generator, List, Optional
from urllib.parse import urlparse

import requests

from app.ai.prompts import get_system_prompt
from app.config import load_config
from app.utils.logger import get_logger

logger = get_logger("OllamaClient")


class OllamaError(RuntimeError):
    """An actionable Ollama API failure."""


@dataclass(frozen=True)
class OllamaStatus:
    server_online: bool
    models: List[str]
    selected_model: Optional[str]
    chat_ready: bool
    message: str


class OllamaClient:
    def __init__(self, host: Optional[str] = None, default_model: Optional[str] = None):
        cfg = load_config()
        self.host = self._normalize_host(host or cfg.get("ollama_host", "http://localhost:11434"))
        configured = default_model if default_model is not None else cfg.get("default_model")
        self.default_model = configured.strip() if isinstance(configured, str) and configured.strip() else None
        self._online: Optional[bool] = None

    @staticmethod
    def _normalize_host(host: str) -> str:
        value = host.strip().rstrip("/")
        if not value:
            raise ValueError("Ollama host cannot be empty")
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Ollama host must be an absolute http(s) URL")
        return value

    def _request_error(self, response: requests.Response, endpoint: str, model: Optional[str] = None) -> OllamaError:
        detail = response.text[:240].replace("\n", " ")
        suffix = f" for model '{model}'" if model else ""
        if response.status_code == 404:
            msg = f"Ollama endpoint {endpoint} returned 404{suffix}. Check the route and model name."
        else:
            msg = f"Ollama {endpoint} returned HTTP {response.status_code}{suffix}: {detail}"
        return OllamaError(msg)

    def get_version(self) -> str:
        try:
            response = requests.get(f"{self.host}/api/version", timeout=3)
        except requests.RequestException as exc:
            self._online = False
            raise OllamaError(f"Cannot reach Ollama at {self.host}. Start it with `ollama serve`." ) from exc
        if response.status_code != 200:
            self._online = False
            raise self._request_error(response, "/api/version")
        self._online = True
        return str(response.json().get("version", "unknown"))

    def is_online(self) -> bool:
        try:
            self.get_version()
            return True
        except (OllamaError, ValueError, requests.RequestException):
            return False

    def get_installed_models(self) -> List[str]:
        try:
            response = requests.get(f"{self.host}/api/tags", timeout=5)
        except requests.RequestException as exc:
            self._online = False
            raise OllamaError(f"Cannot reach Ollama at {self.host}. Start it with `ollama serve`.") from exc
        if response.status_code != 200:
            raise self._request_error(response, "/api/tags")
        models = response.json().get("models", [])
        return [item.get("name") for item in models if item.get("name")]

    def status(self) -> OllamaStatus:
        try:
            self.get_version()
            models = self.get_installed_models()
        except OllamaError as exc:
            return OllamaStatus(False, [], None, False, str(exc))
        selected = self.default_model if self.default_model in models else (models[0] if models else None)
        if selected is None:
            return OllamaStatus(True, models, None, False, "Ollama is running, but no models are installed. Run `ollama pull <model>`." )
        return OllamaStatus(True, models, selected, True, f"Ollama ready with {selected}")

    def test_connection(self, model: Optional[str] = None) -> str:
        selected = model or self.default_model
        if not selected:
            raise OllamaError("No Ollama model is selected. Install a model with `ollama pull <model>`." )
        if selected not in self.get_installed_models():
            raise OllamaError(f"Model '{selected}' is not installed. Run `ollama pull {selected}` or choose an installed model.")
        return self._chat_request([{ "role": "user", "content": "Hello" }], selected, stream=False).get("message", {}).get("content", "").strip()

    def _chat_request(self, messages: List[Dict[str, str]], model: str, stream: bool):
        payload = {"model": model, "messages": messages, "stream": stream, "options": {"temperature": 0.72, "top_p": 0.9}}
        try:
            response = requests.post(f"{self.host}/api/chat", json=payload, stream=stream, timeout=90)
        except requests.RequestException as exc:
            raise OllamaError(f"Cannot reach Ollama at {self.host}. Start it with `ollama serve`.") from exc
        if response.status_code != 200:
            raise self._request_error(response, "/api/chat", model)
        return response

    def chat_stream(self, messages: List[Dict[str, str]], model: Optional[str] = None, mode: str = "assistant", lang: str = "AUTO", user_name: str = "Thiru") -> Generator[str, None, None]:
        selected = model or self.default_model
        if not selected:
            raise OllamaError("No Ollama model is selected.")
        installed = self.get_installed_models()
        if selected not in installed:
            raise OllamaError(f"Model '{selected}' is not installed. Choose one of: {', '.join(installed) or 'none'}.")
        full_messages = [{"role": "system", "content": get_system_prompt(mode=mode, lang=lang, user_name=user_name)}] + messages
        with self._chat_request(full_messages, selected, stream=True) as response:
            for raw_line in response.iter_lines():
                if not raw_line:
                    continue
                try:
                    data = json.loads(raw_line.decode("utf-8"))
                except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                    raise OllamaError("Ollama returned malformed streaming JSON.") from exc
                token = data.get("message", {}).get("content", "")
                if token:
                    yield token
                if data.get("done"):
                    break

    def chat(self, messages: List[Dict[str, str]], model: Optional[str] = None, mode: str = "assistant", lang: str = "AUTO", user_name: str = "Thiru") -> str:
        return "".join(self.chat_stream(messages, model=model, mode=mode, lang=lang, user_name=user_name))

    def _fallback_reply(self, prompt: str) -> str:
        raise OllamaError("Offline fallback replies are disabled; Ollama is required for AI chat.")

