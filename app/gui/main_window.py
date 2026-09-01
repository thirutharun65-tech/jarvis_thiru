"""
JARVIS THIRU — Main Window (Iron Man HUD)
Full PySide6 GUI: chat, voice, system stats, code studio, security lab.
"""
import os
import threading
from datetime import datetime
from typing import Optional

from PySide6.QtCore import (Qt, QThread, Signal, QTimer, QPropertyAnimation,
                             QEasingCurve, Slot)
from PySide6.QtGui import QFont, QTextCursor, QIcon, QColor, QPalette
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QSplitter,
    QLabel, QTextEdit, QLineEdit, QPushButton, QProgressBar,
    QStatusBar, QSizePolicy, QComboBox, QFrame, QTabWidget,
    QScrollArea, QGridLayout, QApplication
)

from app.gui.styles import JARVIS_QSS, STATUS_ONLINE, STATUS_OFFLINE, STATUS_LISTEN, STATUS_IDLE
from app.config import load_config, save_config
from app.ai.ollama_client import OllamaClient
from app.agent.orchestrator import route
from app.computer.monitor import get_system_stats, format_stats_text
from app.computer.system_control import (
    launch_app, take_screenshot, lock_pc, shutdown_pc,
    restart_pc, abort_shutdown, kill_process, run_command
)
from app.security.sec_tools import (
    hash_text, hash_file, base64_encode, base64_decode,
    hex_encode, hex_decode, port_scan, format_port_scan,
    ping_host, dns_lookup, get_local_network_info
)
from app.coding.code_assistant import (
    validate_python_syntax, run_python_snippet, git_status, git_log
)
from app.files.file_ops import (
    search_files, get_file_info, find_duplicates, organize_folder
)
from app.utils.logger import get_logger

logger = get_logger("MainWindow")


# =============================================================================
# Worker thread for streaming AI responses
# =============================================================================

class StreamWorker(QThread):
    token_received  = Signal(str)
    stream_finished = Signal()
    error_occurred  = Signal(str)

    def __init__(self, client: OllamaClient, messages: list,
                 mode: str = "assistant", lang: str = "AUTO",
                 user_name: str = "Thiru"):
        super().__init__()
        self.client    = client
        self.messages  = messages
        self.mode      = mode
        self.lang      = lang
        self.user_name = user_name

    def run(self):
        try:
            for token in self.client.chat_stream(
                self.messages,
                mode=self.mode,
                lang=self.lang,
                user_name=self.user_name
            ):
                self.token_received.emit(token)
            self.stream_finished.emit()
        except Exception as exc:
            self.error_occurred.emit(str(exc))


# =============================================================================
# System stats updater
# =============================================================================

class StatsWorker(QThread):
    stats_ready = Signal(dict)

    def run(self):
        stats = get_system_stats()
        self.stats_ready.emit(stats)


class OllamaHealthWorker(QThread):
    status_ready = Signal(object)

    def __init__(self, client: OllamaClient):
        super().__init__()
        self.client = client

    def run(self):
        self.status_ready.emit(self.client.status())


# =============================================================================
# Main Window
# =============================================================================

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.cfg        = load_config()
        self.client     = OllamaClient()
        self.history    = []          # conversation messages
        self.mode       = "assistant" # assistant / coding / security
        self._streaming = False
        self._chat_ready = False
        self._tts       = None
        self._stt       = None
        self._voice_active = False
        self._worker: Optional[StreamWorker] = None

        self._init_voice()
        self._build_ui()
        self._apply_style()
        self._start_stats_timer()
        self._check_ollama_status()

        self.setWindowTitle("JARVIS THIRU — Personal AI Assistant")
        self.resize(1280, 800)
        logger.info("MainWindow initialised.")

    # ------------------------------------------------------------------
    # Voice initialisation (optional — graceful if missing deps)
    # ------------------------------------------------------------------

    def _init_voice(self):
        try:
            from app.voice.tts import TTSEngine
            self._tts = TTSEngine(
                rate=self.cfg.get("speech_rate", 175),
                volume=self.cfg.get("speech_volume", 1.0),
                gender=self.cfg.get("voice_gender", "female"),
            )
        except Exception as e:
            logger.warning(f"TTS not available: {e}")

        try:
            from app.voice.stt import STTEngine
            self._stt = STTEngine(
                on_result=self._on_stt_result,
                on_error=lambda m: self._show_status(f"STT error: {m}")
            )
        except Exception as e:
            logger.warning(f"STT not available: {e}")

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _build_ui(self):
        central = QWidget()
        central.setObjectName("centralWidget")
        self.setCentralWidget(central)
        root_layout = QHBoxLayout(central)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # ---- Sidebar ----
        sidebar = self._build_sidebar()
        root_layout.addWidget(sidebar)

        # ---- Main panel ----
        splitter = QSplitter(Qt.Horizontal)
        splitter.setHandleWidth(2)

        chat_panel = self._build_chat_panel()
        right_panel = self._build_right_panel()

        splitter.addWidget(chat_panel)
        splitter.addWidget(right_panel)
        splitter.setSizes([820, 440])

        root_layout.addWidget(splitter)

        # ---- Status bar ----
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self._show_status(STATUS_IDLE)

    def _build_sidebar(self) -> QWidget:
        sidebar = QWidget()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(200)
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Logo / title
        hdr = QWidget()
        hdr_layout = QVBoxLayout(hdr)
        hdr_layout.setContentsMargins(16, 20, 16, 20)

        title = QLabel("⬡ JARVIS")
        title.setObjectName("headerTitle")
        sub = QLabel("THIRU  v1.0")
        sub.setObjectName("headerSub")
        hdr_layout.addWidget(title)
        hdr_layout.addWidget(sub)
        layout.addWidget(hdr)

        sep = QFrame()
        sep.setFrameShape(QFrame.HLine)
        sep.setStyleSheet("color: #002244;")
        layout.addWidget(sep)

        # Nav buttons
        nav_items = [
            ("💬  Chat",        "chat",     self._nav_chat),
            ("🖥️  System",      "system",   self._nav_system),
            ("💻  Code Studio", "coding",   self._nav_coding),
            ("🔒  Security Lab","security", self._nav_security),
            ("⚙️  Settings",    "settings", self._nav_settings),
        ]
        self._nav_btns = {}
        for label, key, slot in nav_items:
            btn = QPushButton(label)
            btn.setObjectName("navBtn")
            btn.setCheckable(False)
            btn.clicked.connect(slot)
            btn.setCursor(Qt.PointingHandCursor)
            layout.addWidget(btn)
            self._nav_btns[key] = btn

        layout.addStretch()

        # Ollama status indicator
        self.ollama_indicator = QLabel("● Ollama: checking…")
        self.ollama_indicator.setStyleSheet("color:#004466; font-size:10px; padding:8px 16px;")
        layout.addWidget(self.ollama_indicator)

        # Clock
        self.clock_label = QLabel()
        self.clock_label.setStyleSheet("color:#003355; font-size:10px; padding:4px 16px 12px;")
        layout.addWidget(self.clock_label)
        clock_timer = QTimer(self)
        clock_timer.timeout.connect(self._update_clock)
        clock_timer.start(1000)
        self._update_clock()

        return sidebar

    def _build_chat_panel(self) -> QWidget:
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(12, 12, 6, 12)
        layout.setSpacing(8)

        # Header
        hdr = QLabel("NEURAL INTERFACE — CONVERSATION")
        hdr.setStyleSheet("color:#0055AA; font-size:10px; letter-spacing:3px;")
        layout.addWidget(hdr)

        # Chat display
        self.chat_display = QTextEdit()
        self.chat_display.setObjectName("chatDisplay")
        self.chat_display.setReadOnly(True)
        layout.addWidget(self.chat_display, stretch=1)

        # Mode selector + input bar
        bar = QHBoxLayout()
        self.mode_combo = QComboBox()
        self.mode_combo.addItems(["💬 Assistant", "💻 Coding", "🔒 Security"])
        self.mode_combo.currentIndexChanged.connect(self._on_mode_changed)
        self.mode_combo.setFixedWidth(140)

        self.input_field = QLineEdit()
        self.input_field.setObjectName("inputField")
        self.input_field.setPlaceholderText("Type a command or question…  (Enter to send)")
        self.input_field.returnPressed.connect(self._on_send)

        self.voice_btn = QPushButton("🎙")
        self.voice_btn.setObjectName("voiceBtn")
        self.voice_btn.setFixedWidth(50)
        self.voice_btn.setToolTip("Toggle voice input")
        self.voice_btn.clicked.connect(self._toggle_voice)

        self.send_btn = QPushButton("▶ Send")
        self.send_btn.setObjectName("sendBtn")
        self.send_btn.setFixedWidth(100)
        self.send_btn.clicked.connect(self._on_send)

        bar.addWidget(self.mode_combo)
        bar.addWidget(self.input_field, stretch=1)
        bar.addWidget(self.voice_btn)
        bar.addWidget(self.send_btn)
        layout.addLayout(bar)

        return panel

    def _build_right_panel(self) -> QWidget:
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(6, 12, 12, 12)
        layout.setSpacing(8)

        tabs = QTabWidget()

        # --- System Stats tab ---
        stats_tab = self._build_stats_tab()
        tabs.addTab(stats_tab, "📊 System")

        # --- Quick Actions tab ---
        actions_tab = self._build_actions_tab()
        tabs.addTab(actions_tab, "⚡ Quick Actions")

        # --- Output/Log tab ---
        self.output_display = QTextEdit()
        self.output_display.setObjectName("codeOutput")
        self.output_display.setReadOnly(True)
        self.output_display.setPlaceholderText("Command output, logs, and results appear here…")
        tabs.addTab(self.output_display, "📋 Output")

        layout.addWidget(tabs)
        return panel

    def _build_stats_tab(self) -> QWidget:
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("QScrollArea { border: none; background: transparent; }")

        content = QWidget()
        layout = QVBoxLayout(content)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(10)

        def _make_stat_block(label_text: str) -> tuple:
            frame = QFrame()
            frame.setObjectName("statsPanel")
            fl = QVBoxLayout(frame)
            fl.setContentsMargins(10, 8, 10, 8)
            title = QLabel(label_text)
            title.setObjectName("statLabel")
            val   = QLabel("—")
            val.setObjectName("statValue")
            bar   = QProgressBar()
            bar.setRange(0, 100)
            bar.setValue(0)
            fl.addWidget(title)
            fl.addWidget(val)
            fl.addWidget(bar)
            return frame, val, bar

        cpu_frame,  self.cpu_val,  self.cpu_bar  = _make_stat_block("CPU Usage")
        ram_frame,  self.ram_val,  self.ram_bar  = _make_stat_block("RAM Usage")
        disk_frame, self.disk_val, self.disk_bar = _make_stat_block("Disk C: Usage")
        bat_frame,  self.bat_val,  self.bat_bar  = _make_stat_block("Battery")
        net_frame = QFrame()
        net_frame.setObjectName("statsPanel")
        nl = QVBoxLayout(net_frame)
        nl.setContentsMargins(10, 8, 10, 8)
        nl.addWidget(QLabel("Network I/O").also(lambda l: l.setObjectName("statLabel")))
        self.net_val = QLabel("—")
        self.net_val.setObjectName("statValue")
        nl.addWidget(self.net_val)

        for f in [cpu_frame, ram_frame, disk_frame, bat_frame, net_frame]:
            layout.addWidget(f)

        layout.addStretch()
        scroll.setWidget(content)
        return scroll

    def _build_actions_tab(self) -> QWidget:
        widget = QWidget()
        grid = QGridLayout(widget)
        grid.setContentsMargins(10, 10, 10, 10)
        grid.setSpacing(8)

        actions = [
            ("📸 Screenshot",    self._quick_screenshot),
            ("🔒 Lock PC",       self._quick_lock),
            ("📊 System Status", self._quick_system_status),
            ("📝 Open Notepad",  lambda: self._quick_launch("notepad")),
            ("🧮 Calculator",    lambda: self._quick_launch("calc")),
            ("📁 File Explorer", lambda: self._quick_launch("explorer")),
            ("🌐 Browser",       lambda: self._quick_launch("msedge")),
            ("⚙️ Task Manager",  lambda: self._quick_launch("taskmgr")),
            ("🐍 Python Shell",  self._quick_python_shell),
            ("🔁 Restart PC",   self._quick_restart),
        ]

        for idx, (label, slot) in enumerate(actions):
            btn = QPushButton(label)
            btn.clicked.connect(slot)
            btn.setCursor(Qt.PointingHandCursor)
            btn.setMinimumHeight(44)
            grid.addWidget(btn, idx // 2, idx % 2)

        return widget

    # ------------------------------------------------------------------
    # Style
    # ------------------------------------------------------------------

    def _apply_style(self):
        self.setStyleSheet(JARVIS_QSS)

    # ------------------------------------------------------------------
    # Navigation
    # ------------------------------------------------------------------

    def _set_nav_active(self, key: str):
        for k, btn in self._nav_btns.items():
            btn.setProperty("active", k == key)
            btn.style().unpolish(btn)
            btn.style().polish(btn)

    def _nav_chat(self):
        self._set_nav_active("chat")
        self._append_system("Switched to Conversation mode.")

    def _nav_system(self):
        self._set_nav_active("system")
        self._quick_system_status()

    def _nav_coding(self):
        self._set_nav_active("coding")
        self.mode_combo.setCurrentIndex(1)
        self._append_system("Switched to Code Studio mode. Ask me to write, debug, or run code.")

    def _nav_security(self):
        self._set_nav_active("security")
        self.mode_combo.setCurrentIndex(2)
        self._append_system("Switched to Security Lab. Hash files, scan ports, encode/decode data.")

    def _nav_settings(self):
        self._set_nav_active("settings")
        self._show_settings()

    # ------------------------------------------------------------------
    # Core send / receive
    # ------------------------------------------------------------------

    def _on_send(self):
        text = self.input_field.text().strip()
        if not text or self._streaming:
            return
        if not self._chat_ready:
            self._append_system("Chat unavailable: Ollama is not ready. Use the status indicator for setup details.")
            return
        self.input_field.clear()
        self._append_user(text)
        self._route_and_respond(text)

    def _route_and_respond(self, text: str):
        category, intent, meta = route(text, self.cfg)
        lang      = self.cfg.get("language", "AUTO")
        user_name = self.cfg.get("user_name", "Thiru")

        if category == "system":
            result = self._handle_system_intent(intent, meta)
            if result:
                self._append_jarvis(result)
                self._speak(result)
            return

        if category == "security":
            result = self._handle_security_intent(intent, meta)
            if result:
                self._append_jarvis(result)
                return

        if category == "coding":
            result = self._handle_coding_intent(intent, meta)
            if result:
                self._append_jarvis(result)
                return

        if category == "file":
            result = self._handle_file_intent(intent, meta)
            if result:
                self._append_jarvis(result)
                return

        # Default: streaming AI
        mode = ["assistant", "coding", "security"][self.mode_combo.currentIndex()]
        self.history.append({"role": "user", "content": text})
        self._start_stream(mode, lang, user_name)

    def _start_stream(self, mode: str, lang: str, user_name: str):
        self._streaming = True
        self.send_btn.setEnabled(False)
        self._append_jarvis_start()

        self._worker = StreamWorker(self.client, list(self.history),
                                    mode=mode, lang=lang, user_name=user_name)
        self._worker.token_received.connect(self._on_token)
        self._worker.stream_finished.connect(self._on_stream_done)
        self._worker.error_occurred.connect(self._on_stream_error)
        self._worker.start()

    @Slot(str)
    def _on_token(self, token: str):
        cursor = self.chat_display.textCursor()
        cursor.movePosition(QTextCursor.End)
        cursor.insertText(token)
        self.chat_display.setTextCursor(cursor)
        self.chat_display.ensureCursorVisible()
        self._accumulated_reply = getattr(self, "_accumulated_reply", "") + token

    @Slot()
    def _on_stream_done(self):
        self._streaming = False
        self.send_btn.setEnabled(True)
        reply = getattr(self, "_accumulated_reply", "")
        self._accumulated_reply = ""
        if reply:
            self.history.append({"role": "assistant", "content": reply})
            if self.cfg.get("auto_speak_responses") and self._tts:
                # Only speak first 200 chars to avoid extremely long TTS
                self._speak(reply[:200])
        self._show_status(STATUS_IDLE)

    @Slot(str)
    def _on_stream_error(self, error: str):
        self._streaming = False
        self.send_btn.setEnabled(True)
        self._append_system(f"⚠️ Error: {error}")
        self._accumulated_reply = ""

    # ------------------------------------------------------------------
    # System intent handler
    # ------------------------------------------------------------------

    def _handle_system_intent(self, intent: str, meta: dict) -> str:
        extra     = meta.get("extra", "")
        safe_mode = meta.get("safe_mode", True)
        raw       = meta.get("raw_text", "")

        if intent == "launch_app":
            app_name = extra or raw.split()[-1]
            ok, msg = launch_app(app_name.strip(), safe_mode=safe_mode)
            return msg

        if intent == "open_url":
            import re
            m = re.search(r"https?://\S+", raw)
            url = m.group() if m else extra
            from app.computer.system_control import open_url
            ok, msg = open_url(url)
            return msg

        if intent == "screenshot":
            ok, path = take_screenshot()
            return f"Screenshot saved: `{path}`" if ok else f"Screenshot failed: {path}"

        if intent == "set_volume":
            import re
            m = re.search(r"\d+", raw)
            level = int(m.group()) if m else 50
            from app.computer.system_control import set_volume
            ok, msg = set_volume(level)
            return msg

        if intent == "lock":
            ok, msg = lock_pc()
            return msg

        if intent == "shutdown":
            ok, msg = shutdown_pc(delay_seconds=30)
            return msg

        if intent == "restart":
            ok, msg = restart_pc(delay_seconds=30)
            return msg

        if intent == "abort_shutdown":
            ok, msg = abort_shutdown()
            return msg

        if intent == "kill_process":
            proc = extra or raw.split()[-1]
            ok, msg = kill_process(proc.strip())
            return msg

        if intent == "system_status":
            stats = get_system_stats()
            return format_stats_text(stats)

        if intent == "running_apps":
            from app.computer.system_control import get_running_apps
            apps = get_running_apps()
            return "**Running processes:**\n" + ", ".join(apps[:30])

        return f"System command understood: `{intent}`"

    # ------------------------------------------------------------------
    # Security intent handler
    # ------------------------------------------------------------------

    def _handle_security_intent(self, intent: str, meta: dict) -> str:
        raw = meta.get("raw_text", "")

        if intent == "hash":
            import re
            # Try to extract a file path
            m = re.search(r"[A-Za-z]:\\[\w\\. -]+\.\w+", raw)
            if m:
                ok, digest = hash_file(m.group())
                return f"SHA-256 of `{m.group()}`:\n```\n{digest}\n```" if ok else digest
            # Hash the remaining text
            words = raw.split()
            # Remove the hash keyword
            text_to_hash = " ".join(w for w in words
                                     if w.lower() not in ("hash", "sha256", "sha1", "md5", "sha512",
                                                           "this", "the", "file", "text", "string"))
            if not text_to_hash:
                text_to_hash = raw
            results = hash_text(text_to_hash)
            lines = [f"**Hashes of:** `{text_to_hash[:50]}`"]
            for algo, val in results.items():
                lines.append(f"  **{algo.upper()}**: `{val}`")
            return "\n".join(lines)

        if intent == "encode":
            import re
            low = raw.lower()
            if "base64" in low and "decode" in low:
                m = re.search(r"decode\s+(.+)", raw, re.IGNORECASE)
                if m:
                    ok, dec = base64_decode(m.group(1).strip())
                    return f"Base64 decoded:\n```\n{dec}\n```" if ok else dec
            if "base64" in low:
                m = re.search(r"encode\s+(.+)", raw, re.IGNORECASE)
                text = m.group(1).strip() if m else raw
                enc = base64_encode(text)
                return f"Base64 encoded:\n```\n{enc}\n```"
            if "hex" in low and "decode" in low:
                m = re.search(r"decode\s+([0-9a-fA-F ]+)", raw, re.IGNORECASE)
                if m:
                    ok, dec = hex_decode(m.group(1).strip())
                    return f"Hex decoded:\n```\n{dec}\n```" if ok else dec
            if "hex" in low:
                m = re.search(r"encode\s+(.+)", raw, re.IGNORECASE)
                text = m.group(1).strip() if m else raw
                enc = hex_encode(text)
                return f"Hex encoded:\n```\n{enc}\n```"

        if intent == "port_scan":
            import re
            m = re.search(r"([\w.\-]+)\s*$", raw)
            host = m.group(1).strip() if m else "127.0.0.1"
            self._append_system(f"Scanning {host}… (this may take a few seconds)")
            results = port_scan(host)
            return format_port_scan(host, results)

        if intent == "ping":
            import re
            m = re.search(r"ping\s+(\S+)", raw, re.IGNORECASE)
            host = m.group(1) if m else "google.com"
            ok, out = ping_host(host)
            return f"```\n{out}\n```"

        if intent == "dns_lookup":
            import re
            m = re.search(r"(?:dns|lookup|resolve)\s+(\S+)", raw, re.IGNORECASE)
            host = m.group(1) if m else raw.split()[-1]
            ok, ips = dns_lookup(host)
            return f"**{host}** → {ips}" if ok else ips

        if intent == "network_info":
            info = get_local_network_info()
            return f"**Hostname:** `{info['hostname']}`\n**Local IP:** `{info['local_ip']}`"

        return None  # Let the AI handle it

    # ------------------------------------------------------------------
    # Coding intent handler
    # ------------------------------------------------------------------

    def _handle_coding_intent(self, intent: str, meta: dict) -> Optional[str]:
        raw = meta.get("raw_text", "")

        if intent == "validate_code":
            # Ask AI in coding mode instead
            return None

        if intent == "git":
            if "status" in raw.lower():
                return f"```\n{git_status()}\n```"
            if "log" in raw.lower():
                return f"```\n{git_log(10)}\n```"
            return None

        if intent == "run_code":
            # Extract code block from user message if backticks
            import re
            m = re.search(r"```(?:python)?\n?([\s\S]+?)```", raw)
            if m:
                code = m.group(1)
                valid, vmsg = validate_python_syntax(code)
                if not valid:
                    return vmsg
                ok, stdout, stderr = run_python_snippet(code)
                out_text = stdout or "(no output)"
                err_text = stderr or ""
                result = f"**Execution result:**\n```\n{out_text}\n```"
                if err_text:
                    result += f"\n**Errors:**\n```\n{err_text}\n```"
                return result

        # Let AI handle the rest in coding mode
        return None

    # ------------------------------------------------------------------
    # File intent handler
    # ------------------------------------------------------------------

    def _handle_file_intent(self, intent: str, meta: dict) -> Optional[str]:
        raw = meta.get("raw_text", "")
        extra = meta.get("extra", "")

        if intent == "search_files":
            kw = extra or raw.split()[-1]
            # default to Documents folder
            docs = os.path.expanduser("~/Documents")
            self._append_system(f"Searching for `{kw}` in {docs}…")
            res = search_files(docs, kw)
            if not res:
                return f"No files found matching `{kw}` in {docs}."
            return f"**Found {len(res)} files:**\n" + "\n".join(f"- `{os.path.basename(p)}`" for p in res)

        if intent == "file_info":
            import re
            m = re.search(r"([A-Za-z]:\\[\w\\. -]+\.\w+)", raw)
            path = m.group(1) if m else extra
            if not path:
                return "Please provide a valid file path."
            return get_file_info(path.strip())

        if intent == "find_duplicates":
            import re
            m = re.search(r"in\s+([A-Za-z]:\\[\w\\. -]+)", raw)
            path = m.group(1) if m else os.path.expanduser("~/Downloads")
            self._append_system(f"Scanning for duplicates in {path}… this may take a while.")
            
            def _run():
                dupes = find_duplicates(path)
                lines = []
                for h, paths in dupes.items():
                    lines.append(f"**Duplicate Group ({len(paths)} files):**")
                    for p in paths:
                        lines.append(f"  - `{p}`")
                res = "\n".join(lines) if lines else f"No duplicates found in {path}."
                from PySide6.QtCore import QMetaObject, Q_ARG, Qt
                QMetaObject.invokeMethod(self, "_append_jarvis", Qt.QueuedConnection, Q_ARG(str, res))
            
            import threading
            threading.Thread(target=_run, daemon=True).start()
            return "Started duplicate scan in the background. I will notify you when it's done."

        if intent == "organize_folder":
            import re
            m = re.search(r"organize\s+([A-Za-z]:\\[\w\\. -]+)", raw, re.IGNORECASE)
            path = m.group(1) if m else os.path.expanduser("~/Downloads")
            self._append_system(f"Organizing {path}…")
            ok, msg = organize_folder(path)
            return msg

        return None

    # ------------------------------------------------------------------
    # Chat display helpers
    # ------------------------------------------------------------------

    def _timestamp(self) -> str:
        return datetime.now().strftime("%H:%M:%S")

    def _append_user(self, text: str):
        ts = self._timestamp()
        html = (f'<div style="margin:8px 0;">'
                f'<span style="color:#004466;font-size:10px;">[{ts}]</span>'
                f'<span style="color:#0088CC;font-weight:bold;"> You: </span>'
                f'<span style="color:#A0D8EF;">{self._escape_html(text)}</span>'
                f'</div>')
        self.chat_display.append(html)

    def _append_jarvis_start(self):
        ts = self._timestamp()
        html = (f'<div style="margin:8px 0;">'
                f'<span style="color:#004466;font-size:10px;">[{ts}]</span>'
                f'<span style="color:#00FFAA;font-weight:bold;"> JARVIS: </span>')
        self.chat_display.append(html)
        self._show_status("🧠  JARVIS is thinking…")

    def _append_jarvis(self, text: str):
        ts = self._timestamp()
        safe = self._escape_html(text).replace("\n", "<br>")
        safe = safe.replace("`", "").replace("**", "")
        html = (f'<div style="margin:8px 0;">'
                f'<span style="color:#004466;font-size:10px;">[{ts}]</span>'
                f'<span style="color:#00FFAA;font-weight:bold;"> JARVIS: </span>'
                f'<span style="color:#B0FFD8;">{safe}</span>'
                f'</div>')
        self.chat_display.append(html)

    def _append_system(self, text: str):
        safe = self._escape_html(text).replace("\n", "<br>")
        html = (f'<div style="margin:4px 0;">'
                f'<span style="color:#003366;font-size:10px;">⚙ SYSTEM: </span>'
                f'<span style="color:#005588;font-size:11px;">{safe}</span>'
                f'</div>')
        self.chat_display.append(html)

    @staticmethod
    def _escape_html(text: str) -> str:
        return (text.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;"))

    # ------------------------------------------------------------------
    # Voice
    # ------------------------------------------------------------------

    def _toggle_voice(self):
        if self._stt is None:
            self._append_system("Voice recognition unavailable. Install `pyaudio` and `SpeechRecognition`.")
            return
        if self._voice_active:
            self._stt.stop_listening()
            self._voice_active = False
            self.voice_btn.setProperty("active", "false")
            self.voice_btn.style().unpolish(self.voice_btn)
            self.voice_btn.style().polish(self.voice_btn)
            self._show_status(STATUS_IDLE)
        else:
            ok = self._stt.start_listening()
            if ok:
                self._voice_active = True
                self.voice_btn.setProperty("active", "true")
                self.voice_btn.style().unpolish(self.voice_btn)
                self.voice_btn.style().polish(self.voice_btn)
                self._show_status(STATUS_LISTEN)
            else:
                self._append_system("Failed to start microphone. Check your audio device.")

    def _on_stt_result(self, text: str):
        # Called from background thread — use invokeMethod for thread safety
        from PySide6.QtCore import QMetaObject, Q_ARG
        QMetaObject.invokeMethod(
            self, "_handle_voice_input",
            Qt.QueuedConnection,
            Q_ARG(str, text)
        )

    @Slot(str)
    def _handle_voice_input(self, text: str):
        self.input_field.setText(text)
        self._append_system(f"🎙 Voice captured: {text}")
        self._on_send()

    def _speak(self, text: str):
        if self._tts and self.cfg.get("voice_enabled", True):
            self._tts.speak(text)

    # ------------------------------------------------------------------
    # System stats timer
    # ------------------------------------------------------------------

    def _start_stats_timer(self):
        self.stats_timer = QTimer(self)
        self.stats_timer.timeout.connect(self._refresh_stats)
        self.stats_timer.start(3000)
        self._refresh_stats()

    def _refresh_stats(self):
        worker = StatsWorker(self)
        worker.stats_ready.connect(self._update_stats_ui)
        worker.start()

    @Slot(dict)
    def _update_stats_ui(self, stats: dict):
        if "error" in stats:
            return
        try:
            cpu  = stats.get("cpu", {})
            ram  = stats.get("ram", {})
            bat  = stats.get("battery") or {}
            net  = stats.get("network", {})
            disks = stats.get("disks", [{}])

            cpu_pct = cpu.get("percent", 0)
            self.cpu_val.setText(f"{cpu_pct}% — {cpu.get('freq_mhz','?')} MHz")
            self.cpu_bar.setValue(int(cpu_pct))
            self._set_bar_color(self.cpu_bar, cpu_pct)

            ram_pct = ram.get("percent", 0)
            self.ram_val.setText(f"{ram.get('used_gb','?')} / {ram.get('total_gb','?')} GB ({ram_pct}%)")
            self.ram_bar.setValue(int(ram_pct))
            self._set_bar_color(self.ram_bar, ram_pct)

            if disks:
                d = disks[0]
                dp = d.get("percent", 0)
                self.disk_val.setText(f"{d.get('used_gb','?')} / {d.get('total_gb','?')} GB ({dp}%)")
                self.disk_bar.setValue(int(dp))
                self._set_bar_color(self.disk_bar, dp)

            if bat:
                bp = bat.get("percent", 0)
                plug_icon = "🔌" if bat.get("plugged") else "🔋"
                self.bat_val.setText(f"{bp}% {plug_icon}")
                self.bat_bar.setValue(int(bp))

            ns  = round(net.get("bytes_sent_mb", 0), 1)
            nr  = round(net.get("bytes_recv_mb", 0), 1)
            self.net_val.setText(f"↑ {ns} MB  ↓ {nr} MB")
        except Exception as exc:
            logger.debug(f"stats UI update error: {exc}")

    @staticmethod
    def _set_bar_color(bar: QProgressBar, value: float):
        if value >= 85:
            bar.setObjectName("critBar")
        elif value >= 65:
            bar.setObjectName("warnBar")
        else:
            bar.setObjectName("")
        bar.style().unpolish(bar)
        bar.style().polish(bar)

    # ------------------------------------------------------------------
    # Quick action handlers
    # ------------------------------------------------------------------

    def _quick_screenshot(self):
        ok, path = take_screenshot()
        msg = f"Screenshot saved: `{path}`" if ok else f"Screenshot error: {path}"
        self._append_jarvis(msg)

    def _quick_lock(self):
        ok, msg = lock_pc()
        self._append_jarvis(msg)

    def _quick_system_status(self):
        stats = get_system_stats()
        text  = format_stats_text(stats)
        self._append_jarvis(text)
        self.output_display.setPlainText(text)

    def _quick_launch(self, app: str):
        ok, msg = launch_app(app, safe_mode=False)
        self._append_jarvis(msg)

    def _quick_python_shell(self):
        import subprocess
        try:
            subprocess.Popen(["python"], creationflags=subprocess.CREATE_NEW_CONSOLE)
            self._append_jarvis("Python interactive shell launched in a new console.")
        except Exception as exc:
            self._append_system(f"Could not launch Python shell: {exc}")

    def _quick_restart(self):
        ok, msg = restart_pc(30)
        self._append_jarvis(msg)

    # ------------------------------------------------------------------
    # Settings (minimal inline)
    # ------------------------------------------------------------------

    def _show_settings(self):
        from PySide6.QtWidgets import QDialog, QFormLayout, QDialogButtonBox
        dlg = QDialog(self)
        dlg.setWindowTitle("JARVIS THIRU — Settings")
        dlg.setStyleSheet(JARVIS_QSS)
        dlg.resize(400, 300)
        form = QFormLayout(dlg)

        name_field = QLineEdit(self.cfg.get("user_name", "Thiru"))
        model_field = QLineEdit(self.cfg.get("default_model", ""))
        lang_combo  = QComboBox()
        lang_combo.addItems(["AUTO", "EN", "TA", "TANGLISH"])
        lang_combo.setCurrentText(self.cfg.get("language", "AUTO"))

        form.addRow("Your Name:", name_field)
        form.addRow("Ollama Model:", model_field)
        form.addRow("Language:", lang_combo)

        btns = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        btns.accepted.connect(dlg.accept)
        btns.rejected.connect(dlg.reject)
        form.addRow(btns)

        if dlg.exec():
            self.cfg["user_name"]     = name_field.text().strip() or "Thiru"
            self.cfg["default_model"] = model_field.text().strip()
            self.cfg["language"]      = lang_combo.currentText()
            save_config(self.cfg)
            self.client.default_model = self.cfg["default_model"]
            self._append_system("Settings saved.")

    # ------------------------------------------------------------------
    # Misc helpers
    # ------------------------------------------------------------------

    def _check_ollama_status(self):
        self._health_worker = OllamaHealthWorker(self.client)
        self._health_worker.status_ready.connect(self._set_ollama_status)
        self._health_worker.start()
        QTimer.singleShot(30000, self._check_ollama_status)

    @Slot(object)
    def _set_ollama_status(self, status):
        self._chat_ready = status.chat_ready
        self.send_btn.setEnabled(status.chat_ready and not self._streaming)
        if status.chat_ready:
            self.ollama_indicator.setText(f"● Ollama: READY · {status.selected_model}")
            self.ollama_indicator.setStyleSheet("color:#00AA44; font-size:10px; padding:8px 16px;")
            self._show_status(STATUS_ONLINE)
        elif status.server_online:
            self.ollama_indicator.setText("● Ollama: RUNNING · NO MODEL")
            self.ollama_indicator.setStyleSheet("color:#AA7700; font-size:10px; padding:8px 16px;")
            self._show_status(status.message)
        else:
            self.ollama_indicator.setText("● Ollama: OFFLINE")
            self.ollama_indicator.setStyleSheet("color:#AA4400; font-size:10px; padding:8px 16px;")
            self._show_status(status.message)

    def _update_clock(self):
        self.clock_label.setText(datetime.now().strftime("%d %b %Y  %H:%M:%S"))

    def _on_mode_changed(self, index: int):
        modes = ["assistant", "coding", "security"]
        self.mode = modes[index]

    def _show_status(self, msg: str):
        self.status_bar.showMessage(msg)

    def closeEvent(self, event):
        if self._tts:
            self._tts.shutdown()
        if self._stt:
            self._stt.stop_listening()
        event.accept()


# Monkey-patch to allow `.also()` chaining on QLabel (used in stats tab)
def _also(self, func):
    func(self)
    return self

QLabel.also = _also  # type: ignore
