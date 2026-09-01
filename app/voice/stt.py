"""
JARVIS THIRU — Speech-to-Text Recognizer
Non-blocking microphone listener using SpeechRecognition.
Emits recognised text via a callback.
"""
import threading
from typing import Callable, Optional
from app.utils.logger import get_logger

logger = get_logger("STT")


class STTEngine:
    def __init__(self, on_result: Optional[Callable[[str], None]] = None,
                 on_error: Optional[Callable[[str], None]] = None,
                 language: str = "en-IN"):
        """
        :param on_result: callback(text) called when speech recognised
        :param on_error:  callback(msg)  called on error
        :param language:  BCP-47 locale, e.g. 'en-IN', 'ta-IN', 'en-US'
        """
        self.on_result = on_result
        self.on_error  = on_error
        self.language  = language
        self._listening = False
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._available = True
        self._check_deps()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def start_listening(self) -> bool:
        if not self._available:
            self._emit_error("SpeechRecognition / PyAudio not available.")
            return False
        if self._listening:
            return True
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._listen_loop, daemon=True)
        self._thread.start()
        self._listening = True
        logger.info("STT: listening started.")
        return True

    def stop_listening(self) -> None:
        self._stop_event.set()
        self._listening = False
        logger.info("STT: listening stopped.")

    @property
    def is_listening(self) -> bool:
        return self._listening

    def listen_once(self) -> Optional[str]:
        """Blocking single-utterance capture. Returns text or None."""
        if not self._available:
            return None
        try:
            import speech_recognition as sr
            recognizer = sr.Recognizer()
            with sr.Microphone() as source:
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=15)
            return self._recognise(recognizer, audio)
        except Exception as exc:
            logger.warning(f"listen_once error: {exc}")
            return None

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------
    def _check_deps(self) -> None:
        try:
            import speech_recognition  # noqa: F401
            import pyaudio             # noqa: F401
        except ImportError as e:
            logger.warning(f"STT dependencies missing: {e}")
            self._available = False

    def _listen_loop(self) -> None:
        try:
            import speech_recognition as sr
            recognizer = sr.Recognizer()
            recognizer.dynamic_energy_threshold = True
            mic = sr.Microphone()
            with mic as source:
                recognizer.adjust_for_ambient_noise(source, duration=1)
                logger.info("STT: ambient calibration done.")

            def _handle(recognizer_: sr.Recognizer, audio: sr.AudioData) -> None:
                text = self._recognise(recognizer_, audio)
                if text:
                    logger.info(f"STT recognised: {text}")
                    if self.on_result:
                        self.on_result(text)

            stop_fn = recognizer.listen_in_background(mic, _handle, phrase_time_limit=15)
            self._stop_event.wait()
            stop_fn(wait_for_stop=False)
        except Exception as exc:
            logger.exception(f"STT loop crashed: {exc}")
            self._emit_error(str(exc))
        finally:
            self._listening = False

    def _recognise(self, recognizer, audio) -> Optional[str]:
        try:
            import speech_recognition as sr
            text = recognizer.recognize_google(audio, language=self.language)
            return text.strip()
        except sr.UnknownValueError:
            return None  # silence or unclear — not an error
        except sr.RequestError as e:
            self._emit_error(f"Google STT request error: {e}")
            return None

    def _emit_error(self, msg: str) -> None:
        logger.warning(f"STT error: {msg}")
        if self.on_error:
            self.on_error(msg)
