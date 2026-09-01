"""
JARVIS THIRU — Text-To-Speech (TTS) Engine
Local speech synthesis using pyttsx3 or OS-native speech synthesizer.
"""
import sys
import os

class TTSEngine:
    def __init__(self, rate: float = 1.05, volume: float = 1.0):
        self.rate = rate
        self.volume = volume
        self.engine = None
        self._init_engine()

    def _init_engine(self):
        try:
            import pyttsx3
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', int(self.rate * 175))
            self.engine.setProperty('volume', self.volume)
        except Exception:
            self.engine = None

    def speak(self, text: str):
        if not text:
            return
        if self.engine:
            try:
                self.engine.say(text)
                self.engine.runAndWait()
                return True
            except Exception:
                pass
        
        # Fallback to PowerShell speech on Windows
        if sys.platform == "win32":
            try:
                escaped = text.replace('"', '\\"')
                os.system(f'powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak(\'{escaped}\');"')
                return True
            except Exception:
                pass
        return False
