import React from 'react';
import {
  Activity,
  Cpu,
  Globe,
  HardDrive,
  Mic,
  MicOff,
  Power,
  Radio,
  Server,
  Shield,
  Square,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { JarvisState, LanguageMode, SubsystemStatus, SystemStats } from '../types';

interface HeaderProps {
  currentTab: 'chat' | 'system' | 'code' | 'security' | 'education' | 'settings';
  onSelectTab: (tab: 'chat' | 'system' | 'code' | 'security' | 'education' | 'settings') => void;
  jarvisState: JarvisState;
  language: LanguageMode;
  onChangeLanguage: (lang: LanguageMode) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  isListening: boolean;
  onToggleMic: () => void;
  onEmergencyStop: () => void;
  systemStats: SystemStats | null;
  subsystems: SubsystemStatus[];
  isLocalAgentConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  jarvisState,
  language,
  onChangeLanguage,
  voiceEnabled,
  onToggleVoice,
  isListening,
  onToggleMic,
  onEmergencyStop,
  systemStats,
  subsystems,
  isLocalAgentConnected,
}) => {
  const isBusy = jarvisState === 'SPEAKING' || jarvisState === 'EXECUTING' || jarvisState === 'THINKING';

  return (
    <header
      id="jarvis-hud-header"
      className="w-full bg-[#040812]/95 backdrop-blur-md border-b border-cyan-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40"
    >
      {/* Brand Identity & Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
          <Zap className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Orbitron',sans-serif] text-base font-bold tracking-wider text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              JARVIS THIRU
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              v2.0 PRO
            </span>
          </div>
          <p className="text-[10px] font-mono text-cyan-400/60 tracking-wider">
            NEURAL COPILOT &bull; WINDOWS CONTROL AGENT
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center bg-[#07111e]/90 p-1 rounded-xl border border-cyan-500/20 shadow-inner">
        {[
          { id: 'chat', label: 'HUD & CHAT', icon: Radio },
          { id: 'system', label: 'SYSTEM MONITOR', icon: Activity },
          { id: 'code', label: 'CODE STUDIO', icon: HardDrive },
          { id: 'security', label: 'SECURITY LAB', icon: Shield },
          { id: 'education', label: 'EDUCATION', icon: Globe },
          { id: 'settings', label: 'DIAGNOSTICS & SETUP', icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-btn-${tab.id}`}
              onClick={() => onSelectTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.3)] font-semibold'
                  : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/30 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Controls: Telemetry, Language, Voice & Emergency Stop */}
      <div className="flex items-center gap-3">
        {/* Real Hardware HUD Mini Widget */}
        {systemStats && (
          <div className="hidden lg:flex items-center gap-3 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-cyan-900/30 text-[11px] font-mono">
            <div className="flex items-center gap-1 text-cyan-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>CPU: {systemStats.cpuUsage}%</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-400/80">
              <HardDrive className="w-3.5 h-3.5" />
              <span>RAM: {systemStats.ramUsage}%</span>
            </div>
            {systemStats.batteryPercent !== null && (
              <div className="text-emerald-400">
                BAT: {systemStats.batteryPercent}%
              </div>
            )}
          </div>
        )}

        {/* Local Agent Status Badge */}
        <div
          id="badge-local-agent"
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono border ${
            isLocalAgentConnected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
          }`}
          title={isLocalAgentConnected ? 'Windows Local Agent Connected (Port 8765)' : 'Web Mode / Agent Bridge Standby'}
        >
          <span className={`w-2 h-2 rounded-full ${isLocalAgentConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isLocalAgentConnected ? 'AGENT: ONLINE' : 'AGENT: BRIDGE'}</span>
        </div>

        {/* Language Selector */}
        <div className="flex items-center bg-[#07111e] rounded-lg border border-cyan-900/40 p-0.5 text-xs font-mono">
          {(['AUTO', 'EN', 'TA', 'TANGLISH'] as LanguageMode[]).map((lang) => (
            <button
              key={lang}
              id={`lang-btn-${lang}`}
              onClick={() => onChangeLanguage(lang)}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                language === lang
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`Switch Language to ${lang}`}
            >
              {lang === 'TA' ? 'தமிழ்' : lang}
            </button>
          ))}
        </div>

        {/* TTS Toggle */}
        <button
          id="btn-toggle-tts"
          onClick={onToggleVoice}
          className={`p-2 rounded-lg border transition-all ${
            voiceEnabled
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/40'
              : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
          }`}
          title={voiceEnabled ? 'JARVIS Voice Audio Enabled' : 'JARVIS Voice Muted'}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Mic Toggle Button */}
        <button
          id="btn-toggle-mic"
          onClick={onToggleMic}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono tracking-wider transition-all ${
            isListening
              ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40'
          }`}
          title={isListening ? 'Click to Mute Microphone' : 'Click to Speak (Push-to-Talk)'}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{isListening ? 'LISTENING' : 'VOICE'}</span>
        </button>

        {/* Emergency Stop / Interrupt */}
        {isBusy && (
          <button
            id="btn-emergency-stop"
            onClick={onEmergencyStop}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600/30 border border-red-500 text-red-400 hover:bg-red-600/50 text-xs font-mono font-bold animate-pulse"
            title="Interrupt JARVIS speech & stop running task"
          >
            <Square className="w-3.5 h-3.5 fill-red-400" />
            <span>STOP</span>
          </button>
        )}
      </div>
    </header>
  );
};
