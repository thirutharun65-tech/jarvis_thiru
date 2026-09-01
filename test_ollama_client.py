import json
from unittest.mock import Mock, patch

import pytest

from app.ai.ollama_client import OllamaClient, OllamaError


def response(status=200, payload=None, text=""):
    item = Mock(status_code=status, text=text)
    item.json.return_value = payload or {}
    return item


def test_status_requires_an_installed_model():
    client = OllamaClient(default_model="")
    with patch("app.ai.ollama_client.requests.get", side_effect=[response(payload={"version": "0.1"}), response(payload={"models": []})]):
        status = client.status()
    assert status.server_online and not status.chat_ready
    assert "no models" in status.message.lower()


def test_status_selects_installed_configured_model():
    client = OllamaClient(default_model="qwen2.5:latest")
    with patch("app.ai.ollama_client.requests.get", side_effect=[response(payload={"version": "0.1"}), response(payload={"models": [{"name": "qwen2.5:latest"}]})]):
        status = client.status()
    assert status.chat_ready
    assert status.selected_model == "qwen2.5:latest"


def test_chat_stream_uses_native_payload():
    client = OllamaClient(default_model="tinyllama")
    stream = Mock()
    stream.__enter__ = Mock(return_value=stream)
    stream.__exit__ = Mock(return_value=False)
    stream.status_code = 200
    stream.iter_lines.return_value = [json.dumps({"message": {"content": "Hi"}, "done": False}).encode(), json.dumps({"done": True}).encode()]
    tags = response(payload={"models": [{"name": "tinyllama"}]})
    with patch("app.ai.ollama_client.requests.get", return_value=tags), patch("app.ai.ollama_client.requests.post", return_value=stream) as post:
        assert "".join(client.chat_stream([{"role": "user", "content": "Hello"}])) == "Hi"
    payload = post.call_args.kwargs["json"]
    assert post.call_args.args[0].endswith("/api/chat")
    assert payload["model"] == "tinyllama"
    assert payload["stream"] is True
    assert payload["messages"][-1]["content"] == "Hello"


def test_missing_model_is_actionable():
    client = OllamaClient(default_model="missing")
    with patch("app.ai.ollama_client.requests.get", return_value=response(payload={"models": []})):
        with pytest.raises(OllamaError, match="not installed"):
            list(client.chat_stream([{"role": "user", "content": "Hello"}]))


def test_offline_fallback_is_disabled():
    client = OllamaClient(default_model="tinyllama")
    with pytest.raises(OllamaError, match="fallback replies are disabled"):
        client._fallback_reply("hello")
