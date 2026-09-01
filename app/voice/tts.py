"""
JARVIS THIRU — Text-to-Speech Engine
Background-threaded pyttsx3 TTS with voice auto-selection and queue.
"""
import threading
import queue
from typing import Optional
from app.utils.logger import get_logger

logger = get_logger("TTS")


class TTSEngine:
    def __init__(self, rate: int = 175, volume: float = 1.0, gender: str = "female"):
        self._rate = rate
        self._volume = volume
        self._gender = gender
        self._queue: queue.Queue = queue.Queue()
        self._speaking = False
        self._enabled = True
        self._engine = None
        self._thread = threading.Thread(target=self._worker, daemon=True)
        self._thread.start()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def speak(self, text: str, priority: bool = False) -> None:
        if not self._enabled or not text.strip():
            return
        if priority:
            # Clear current queue then enqueue
            while not self._queue.empty():
                try:
                    self._queue.get_nowait()
                except queue.Empty:
                    break
        self._queue.put(text)

    def stop(self) -> None:
        if self._engine:
            try:
                self._engine.stop()
            except Exception:
                pass
        # Drain queue
        while not self._queue.empty():
            try:
                self._queue.get_nowait()
            except queue.Empty:
                break

    def set_enabled(self, enabled: bool) -> None:
        self._enabled = enabled
        if not enabled:
            self.stop()

    def set_rate(self, rate: int) -> None:
        self._rate = rate
        if self._engine:
            try:
                self._engine.setProperty("rate", rate)
            except Exception:
                pass

    def set_volume(self, vol: float) -> None:
        self._volume = max(0.0, min(1.0, vol))
        if self._engine:
            try:
                self._engine.setProperty("volume", self._volume)
            except Exception:
                pass

    @property
    def is_speaking(self) -> bool:
        return self._speaking

    # ------------------------------------------------------------------
    # Internal worker
    # ------------------------------------------------------------------
    def _worker(self) -> None:
        try:
            import pyttsx3
            self._engine = pyttsx3.init()
            self._engine.setProperty("rate", self._rate)
            self._engine.setProperty("volume", self._volume)
            self._set_voice()
        except Exception as e:
            logger.warning(f"pyttsx3 init failed: {e}. TTS disabled.")
            self._enabled = False
            return

        while True:
            try:
                text = self._queue.get(timeout=1)
            except queue.Empty:
                continue

            if text is None:  # sentinel
                break

            self._speaking = True
            try:
                logger.debug(f"TTS speaking: {text[:60]}…")
                self._engine.say(text)
                self._engine.runAndWait()
            except Exception as exc:
                logger.warning(f"TTS speak error: {exc}")
            finally:
                self._speaking = False

    def _set_voice(self) -> None:
        if not self._engine:
            return
        try:
            voices = self._engine.getProperty("voices")
            if not voices:
                return
            # Prefer a female or male voice based on preference
            keyword = "zira" if self._gender == "female" else "david"
            for v in voices:
                if keyword in v.id.lower() or keyword in v.name.lower():
                    self._engine.setProperty("voice", v.id)
                    logger.info(f"TTS voice set to: {v.name}")
                    return
            # Fallback: any female/male match
            for v in voices:
                if self._gender in v.name.lower():
                    self._engine.setProperty("voice", v.id)
                    return
            # Final fallback: first available
            self._engine.setProperty("voice", voices[0].id)
        except Exception as exc:
            logger.debug(f"Voice selection error: {exc}")

    def shutdown(self) -> None:
        self._queue.put(None)
