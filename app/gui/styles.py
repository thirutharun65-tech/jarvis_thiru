"""
JARVIS THIRU — Cyberpunk Iron Man HUD GUI Styles
"""

JARVIS_QSS = """
/* ============================================================
   JARVIS THIRU — Iron Man Cyberpunk HUD
   ============================================================ */

* {
    font-family: 'Segoe UI', 'Consolas', sans-serif;
    color: #00FFFF;
    selection-background-color: #00FFFF44;
    selection-color: #000010;
}

QMainWindow, QWidget#centralWidget {
    background: qlineargradient(
        x1:0, y1:0, x2:1, y2:1,
        stop:0 #000010, stop:0.5 #000820, stop:1 #001030
    );
}

/* ---- Sidebar ---- */
QWidget#sidebar {
    background: rgba(0, 20, 50, 200);
    border-right: 1px solid #003366;
}

/* ---- Header ---- */
QLabel#headerTitle {
    font-size: 22px;
    font-weight: bold;
    color: #00FFFF;
    letter-spacing: 3px;
}
QLabel#headerSub {
    font-size: 10px;
    color: #0088AA;
    letter-spacing: 2px;
}

/* ---- Chat area ---- */
QTextEdit#chatDisplay {
    background: rgba(0, 8, 25, 220);
    border: 1px solid #003366;
    border-radius: 8px;
    padding: 12px;
    font-size: 13px;
    color: #B0E8FF;
    line-height: 1.6;
}

/* ---- Input bar ---- */
QLineEdit#inputField {
    background: rgba(0, 20, 60, 200);
    border: 1px solid #0066AA;
    border-radius: 20px;
    padding: 10px 18px;
    font-size: 14px;
    color: #00FFFF;
}
QLineEdit#inputField:focus {
    border: 1px solid #00FFFF;
    background: rgba(0, 30, 80, 220);
}
QLineEdit#inputField::placeholder {
    color: #004466;
}

/* ---- Buttons ---- */
QPushButton {
    background: rgba(0, 60, 120, 180);
    border: 1px solid #0088CC;
    border-radius: 8px;
    padding: 8px 18px;
    color: #00FFFF;
    font-size: 12px;
    font-weight: bold;
}
QPushButton:hover {
    background: rgba(0, 120, 200, 200);
    border: 1px solid #00FFFF;
    color: #FFFFFF;
}
QPushButton:pressed {
    background: rgba(0, 200, 255, 100);
}
QPushButton#sendBtn {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #004488, stop:1 #0088CC);
    border-radius: 20px;
    padding: 10px 26px;
    font-size: 14px;
}
QPushButton#sendBtn:hover {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #0066CC, stop:1 #00BBFF);
}
QPushButton#voiceBtn {
    background: rgba(0, 80, 40, 180);
    border: 1px solid #00AA55;
    border-radius: 20px;
    color: #00FF88;
    font-size: 13px;
    padding: 10px 18px;
    min-width: 40px;
}
QPushButton#voiceBtn:hover {
    background: rgba(0, 160, 80, 200);
}
QPushButton#voiceBtn[active="true"] {
    background: rgba(0, 200, 100, 160);
    border: 2px solid #00FF88;
}

/* ---- Nav sidebar buttons ---- */
QPushButton#navBtn {
    background: transparent;
    border: none;
    border-left: 3px solid transparent;
    border-radius: 0;
    padding: 12px 20px;
    text-align: left;
    font-size: 12px;
    color: #4488AA;
}
QPushButton#navBtn:hover {
    background: rgba(0, 100, 180, 60);
    border-left: 3px solid #0088CC;
    color: #00CCFF;
}
QPushButton#navBtn[active="true"] {
    background: rgba(0, 120, 200, 80);
    border-left: 3px solid #00FFFF;
    color: #00FFFF;
}

/* ---- Stats panel ---- */
QWidget#statsPanel {
    background: rgba(0, 10, 30, 200);
    border: 1px solid #003355;
    border-radius: 8px;
}
QLabel#statLabel {
    font-size: 11px;
    color: #0088AA;
    padding: 2px;
}
QLabel#statValue {
    font-size: 14px;
    font-weight: bold;
    color: #00FFFF;
}

/* ---- Progress bars ---- */
QProgressBar {
    background: rgba(0, 20, 50, 200);
    border: 1px solid #003366;
    border-radius: 5px;
    height: 10px;
    text-align: center;
    font-size: 8px;
    color: transparent;
}
QProgressBar::chunk {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #004488, stop:1 #00FFFF);
    border-radius: 5px;
}
QProgressBar#warnBar::chunk {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #884400, stop:1 #FF8800);
}
QProgressBar#critBar::chunk {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #880000, stop:1 #FF2200);
}

/* ---- Status bar ---- */
QStatusBar {
    background: rgba(0, 10, 30, 200);
    border-top: 1px solid #003355;
    color: #004466;
    font-size: 10px;
}

/* ---- Scrollbars ---- */
QScrollBar:vertical {
    background: rgba(0, 10, 30, 180);
    width: 8px;
    border: none;
}
QScrollBar::handle:vertical {
    background: #003366;
    border-radius: 4px;
    min-height: 30px;
}
QScrollBar::handle:vertical:hover {
    background: #0066AA;
}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0; }

/* ---- ComboBox ---- */
QComboBox {
    background: rgba(0, 20, 60, 200);
    border: 1px solid #003366;
    border-radius: 6px;
    padding: 5px 10px;
    color: #00CCFF;
    min-width: 120px;
}
QComboBox::drop-down { border: none; }
QComboBox QAbstractItemView {
    background: #000C28;
    border: 1px solid #003366;
    selection-background-color: #003366;
    color: #00CCFF;
}

/* ---- Splitter ---- */
QSplitter::handle {
    background: #002244;
    width: 2px;
}

/* ---- Tab widget ---- */
QTabWidget::pane {
    background: rgba(0, 8, 25, 200);
    border: 1px solid #003366;
    border-radius: 6px;
}
QTabBar::tab {
    background: rgba(0, 20, 60, 180);
    border: 1px solid #003366;
    border-radius: 5px 5px 0 0;
    padding: 7px 18px;
    color: #004466;
    font-size: 11px;
}
QTabBar::tab:selected {
    background: rgba(0, 60, 120, 200);
    color: #00FFFF;
    border-bottom: 2px solid #00FFFF;
}
QTabBar::tab:hover {
    background: rgba(0, 40, 90, 200);
    color: #00BBFF;
}

/* ---- Code / Terminal output ---- */
QTextEdit#codeOutput {
    background: #000C1A;
    border: 1px solid #002244;
    border-radius: 6px;
    padding: 10px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    color: #00FF88;
}
"""

STATUS_ONLINE  = "🟢  JARVIS Neural Engine: ONLINE"
STATUS_OFFLINE = "🟡  JARVIS Neural Engine: OFFLINE (Ollama not running)"
STATUS_LISTEN  = "🎙️  Voice Input: ACTIVE — Listening…"
STATUS_IDLE    = "💤  Standing by, Sir."
