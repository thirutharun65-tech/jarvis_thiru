"""
JARVIS THIRU — Memory & Context Store
SQLite-backed persistent memory for conversation history, active tasks, projects, and context.
"""
import sqlite3
import os
import time
import json
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "jarvis_memory.db")

class MemoryStore:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    role TEXT NOT NULL,
                    text TEXT NOT NULL,
                    language TEXT DEFAULT 'EN',
                    timestamp REAL NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS context_state (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at REAL NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS task_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    status TEXT NOT NULL,
                    category TEXT NOT NULL,
                    result_summary TEXT,
                    timestamp REAL NOT NULL
                )
            """)
            conn.commit()

    def add_message(self, role: str, text: str, language: str = "EN"):
        with self._get_conn() as conn:
            conn.execute(
                "INSERT INTO conversations (role, text, language, timestamp) VALUES (?, ?, ?, ?)",
                (role, text, language, time.time())
            )
            conn.commit()

    def get_recent_messages(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM conversations ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
            return [dict(r) for r in reversed(rows)]

    def set_context(self, key: str, value: Any):
        val_str = json.dumps(value) if not isinstance(value, str) else value
        with self._get_conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO context_state (key, value, updated_at) VALUES (?, ?, ?)",
                (key, val_str, time.time())
            )
            conn.commit()

    def get_context(self, key: str, default=None) -> Any:
        with self._get_conn() as conn:
            row = conn.execute("SELECT value FROM context_state WHERE key = ?", (key,)).fetchone()
            if not row:
                return default
            try:
                return json.loads(row["value"])
            except Exception:
                return row["value"]

    def log_task(self, title: str, status: str, category: str, result_summary: str = ""):
        with self._get_conn() as conn:
            conn.execute(
                "INSERT INTO task_history (title, status, category, result_summary, timestamp) VALUES (?, ?, ?, ?, ?)",
                (title, status, category, result_summary, time.time())
            )
            conn.commit()

    def get_task_history(self, limit: int = 15) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute("SELECT * FROM task_history ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
            return [dict(r) for r in rows]
