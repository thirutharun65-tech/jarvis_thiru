# JARVIS THIRU — Personal Desktop AI Assistant

> *"A hero can be anyone. Even a man knowing something as simple as putting a coat on a young boy's shoulders." — J.A.R.V.I.S.*

---

## 🚀 Quick Start

```batch
run.bat
```

That's it. The launcher will:
1. Check Python is installed.
2. Install all required packages.
3. Start Ollama in the background (if not already running).
4. Launch the JARVIS THIRU GUI.

---

## 🛠 Manual Setup

```bash
pip install -r requirements.txt
ollama serve           # keep Ollama running
ollama list            # inspect installed models
ollama pull <model>    # install a model, for example: ollama pull llama3.2
python main.py
```

JARVIS uses Ollama's native API at `http://localhost:11434`. The app reports three separate states: server reachable, models installed, and chat-ready after selecting an installed model. It never fabricates an AI response when Ollama is unavailable.

If you want to control this Windows desktop from a deployed Vercel UI, you must run a separately authenticated local bridge on the same machine. This repository currently contains the PySide6 desktop client only; a Vercel deployment cannot reach `localhost` on your PC directly.

---

## 🎯 Features

| Category | Capabilities |
|----------|-------------|
| 💬 **Conversation** | Natural chat in English, Tamil, Tanglish via Ollama (phi3, llama3, etc.) |
| 🎙 **Voice I/O** | Microphone voice input + pyttsx3 offline TTS output |
| 🖥 **System Control** | Launch apps, screenshots, lock/shutdown, volume, process management |
| 📊 **System Monitor** | Live CPU, RAM, disk, battery, network stats |
| 💻 **Code Studio** | Code generation, Python execution, Git integration, syntax validation |
| 🔒 **Security Lab** | File hashing, base64/hex encoding, port scanning, ping, DNS lookup |
| ⚡ **Quick Actions** | One-click common tasks from the sidebar |

---

## 🗂 Project Structure

```
jarvis_thiru/
├── main.py                  Entry point
├── run.bat                  Windows launcher
├── requirements.txt
├── app/
│   ├── config.py            Settings manager
│   ├── ai/
│   │   ├── ollama_client.py Streaming Ollama client
│   │   └── prompts.py       JARVIS persona prompts
│   ├── agent/
│   │   └── orchestrator.py  Intent classifier & router
│   ├── coding/
│   │   └── code_assistant.py Python runner, Git, file helpers
│   ├── computer/
│   │   ├── system_control.py App launch, lock, shutdown, volume
│   │   └── monitor.py       Live system stats (psutil)
│   ├── gui/
│   │   ├── main_window.py   Iron Man HUD — PySide6 main window
│   │   └── styles.py        Cyberpunk QSS stylesheet
│   ├── security/
│   │   └── sec_tools.py     Hashing, encoding, port scanner
│   ├── utils/
│   │   └── logger.py        Centralized logger
│   └── voice/
│       ├── tts.py           pyttsx3 TTS engine
│       └── stt.py           SpeechRecognition STT engine
└── data/
    ├── config.json          User settings (auto-generated)
    └── logs/jarvis.log      Application log
```

---

## 🌐 Supported Voice Commands (examples)

| Command | Action |
|---------|--------|
| `open notepad` | Launches Notepad |
| `take a screenshot` | Captures screen to Pictures folder |
| `set volume 60` | Sets system volume to 60% |
| `lock pc` | Locks the workstation |
| `system status` | Shows live CPU/RAM/Battery stats |
| `hash this file C:\test.txt` | SHA-256 hash of a file |
| `port scan 192.168.1.1` | TCP port scan |
| `ping google.com` | Network ping |
| `git status` | Git repository status |
| `run python code: <code>` | Executes a Python snippet |

---

## ⚙️ Configuration

Edit `data/config.json` or use the in-app **Settings** dialog (sidebar → ⚙️).

Key options:
- `default_model` — Ollama model name (default: `phi3`)
- `language` — `AUTO`, `EN`, `TA`, `TANGLISH`
- `voice_enabled` — TTS on/off
- `user_name` — Your name (used in greetings)

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `PySide6` | GUI framework |
| `requests` | Ollama HTTP API |
| `psutil` | System monitoring |
| `pyttsx3` | Offline TTS |
| `SpeechRecognition` | Voice input |
| `pyaudio` | Microphone access |
| `pyautogui` | Screenshots & UI automation |

---

*Built for Thiru — by JARVIS THIRU AI Project*
