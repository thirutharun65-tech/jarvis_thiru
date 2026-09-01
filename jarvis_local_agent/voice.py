"""
JARVIS THIRU — Voice Recognition & Wake-Word Engine
Supports speech_recognition fallback and push-to-talk triggers.
"""
from typing import Optional

class VoiceEngine:
    def __init__(self, wake_word: str = "jarvis"):
        self.wake_word = wake_word.lower()
        self.is_listening = False

    def listen_once(self) -> Optional[str]:
        try:
            import speech_recognition as sr
            recognizer = sr.Recognizer()
            with sr.Microphone() as source:
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
                text = recognizer.recognize_google(audio)
                return text
        except Exception:
            return None

    def contains_wake_word(self, phrase: str) -> bool:
        if not phrase:
            return False
        return self.wake_word in phrase.lower()
