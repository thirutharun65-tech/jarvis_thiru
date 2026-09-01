"""
JARVIS THIRU — Application Entry Point
"""
import sys
import os

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.utils.logger import get_logger
from app.config import load_config

logger = get_logger("Main")


def _check_dependencies() -> bool:
    missing = []
    for pkg, mod in [
        ("PySide6", "PySide6"),
        ("requests", "requests"),
        ("psutil", "psutil"),
    ]:
        try:
            __import__(mod)
        except ImportError:
            missing.append(pkg)
    if missing:
        print(f"[JARVIS] Missing required packages: {', '.join(missing)}")
        print("[JARVIS] Run:  pip install -r requirements.txt")
        return False
    return True


def main():
    logger.info("═══════════════════════════════════")
    logger.info("  JARVIS THIRU  — Starting up…")
    logger.info("═══════════════════════════════════")

    if not _check_dependencies():
        sys.exit(1)

    from PySide6.QtWidgets import QApplication
    from PySide6.QtCore import Qt
    from PySide6.QtGui import QFont

    app = QApplication(sys.argv)
    app.setApplicationName("JARVIS THIRU")
    app.setApplicationVersion("1.0.0")
    app.setOrganizationName("JarvisThiru")

    # High-DPI support
    app.setAttribute(Qt.AA_UseHighDpiPixmaps, True)

    # Set default font
    font = QFont("Segoe UI", 10)
    app.setFont(font)

    from app.gui.main_window import MainWindow
    win = MainWindow()
    win.show()

    # Startup greeting
    cfg = load_config()
    user = cfg.get("user_name", "Sir")
    win._append_jarvis(
        f"Good day, {user}. JARVIS THIRU is fully operational. "
        f"All subsystems initialised. How may I assist you today?"
    )
    win._speak(
        f"Good day, {user}. JARVIS THIRU is online. How may I assist you?"
    )

    logger.info("GUI launched successfully.")
    sys.exit(app.exec())


# ============================================================================
# Serverless & Web Deployment Support
# ============================================================================

# AWS Lambda handler
def handler(event, context):
    """AWS Lambda handler for serverless deployment."""
    return {
        "statusCode": 200,
        "body": "JARVIS THIRU is running",
        "version": "1.0.0"
    }


# WSGI application for web servers
app = handler  # Alias for compatibility


if __name__ == "__main__":
    main()
