// Web Audio API & Speech Synthesis / Recognition Engine for JARVIS THIRU

class SoundFXEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Action and Click helper aliases
  click() {
    this.playBlip();
  }

  action() {
    this.playAcknowledge();
  }

  success() {
    this.playSuccess();
  }

  error() {
    this.playError();
  }

  // Futuristic startup chord
  playStartup() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(120, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.4);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(240, now);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.4);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  // Holographic quick blip
  playBlip() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Command acknowledged chime
  playAcknowledge() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  // Execution complete success tone
  playSuccess() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  // Error alert tone
  playError() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Target lock / security scan beep
  playScan() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.linearRampToValueAtTime(1000, now + 0.12);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }
}

export const soundFX = new SoundFXEngine();

// Text-to-Speech Engine
export class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  public isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.loadVoices();
    }
    return this.voices;
  }

  speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voiceName?: string;
      language?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (e: any) => void;
    } = {}
  ): void {
    if (!this.synth) {
      options.onEnd?.();
      return;
    }

    this.stop();

    if (!text || text.trim() === '') {
      options.onEnd?.();
      return;
    }

    // Clean markdown/code snippets for clean voice output
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block generated.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[#*_~]/g, '')
      .trim();

    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // Detect Tamil text characters
    const hasTamil = /[\u0B80-\u0BFF]/.test(cleanText);

    if (hasTamil) {
      utterance.lang = 'ta-IN';
      const tamilVoice = this.voices.find(v => v.lang.startsWith('ta'));
      if (tamilVoice) utterance.voice = tamilVoice;
    } else if (options.voiceName) {
      const matchedVoice = this.voices.find(v => v.name === options.voiceName);
      if (matchedVoice) utterance.voice = matchedVoice;
    } else {
      // Default to crisp English voice (prefer UK/US natural voice)
      const preferred = this.voices.find(
        v =>
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('George')) &&
          (v.lang.startsWith('en'))
      ) || this.voices.find(v => v.lang.startsWith('en'));

      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      options.onError?.(e);
      options.onEnd?.();
    };

    this.synth.speak(utterance);
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}

export const ttsEngine = new TTSEngine();
