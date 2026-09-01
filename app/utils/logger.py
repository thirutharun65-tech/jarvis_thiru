"""
JARVIS THIRU — Centralized Logger
"""
import logging
import sys
from pathlib import Path

# Import lazily to avoid circular import issues
def _get_logs_dir() -> Path:
    from app.config import LOGS_DIR
    return LOGS_DIR


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logs_dir = _get_logs_dir()
        logs_dir.mkdir(parents=True, exist_ok=True)
        log_file = logs_dir / "jarvis.log"

        fmt = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")

        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setFormatter(fmt)
        fh.setLevel(logging.DEBUG)

        ch = logging.StreamHandler(sys.stdout)
        ch.setFormatter(fmt)
        ch.setLevel(logging.INFO)

        logger.setLevel(logging.DEBUG)
        logger.addHandler(fh)
        logger.addHandler(ch)
        logger.propagate = False
    return logger
