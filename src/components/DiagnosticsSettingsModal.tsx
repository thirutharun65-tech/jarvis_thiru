import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  Download,
  HardDrive,
  Key,
  Mic,
  Monitor,
  RefreshCw,
  Save,
  Server,
  Settings,
  Shield,
  Trash2,
  Volume2,
  XCircle,
  Zap,
} from 'lucide-react';
import { AppConfig, MemoryEntry, SubsystemStatus } from '../types';
import { soundFX } from '../lib/audio';

interface DiagnosticsSettingsModalProps {
  config: AppConfig;
  onSaveConfig: (cfg: Partial<AppConfig>) => void;
  subsystems: SubsystemStatus[];
  onRefreshDiagnostics: () => void;
  memoryEntries: MemoryEntry[];
  onClearMemory: () => void;
  ollamaModels: string[];
}

export const DiagnosticsSettingsModal: React.FC<DiagnosticsSettingsModalProps> = ({
  config,
  onSaveConfig,
  subsystems,
  onRefreshDiagnostics,
  memoryEntries,
  onClearMemory,
  ollamaModels,
}) => {
  const [formData, setFormData] = useState<AppConfig>({ ...config });
  const [activeSubTab, setActiveSubTab] = useState<'diag' | 'settings' | 'local_agent' | 'memory'>('diag');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    soundFX.playSuccess();
    setSaveStatus('Preferences saved successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div id="jarvis-diagnostics-settings" className="max-w-7xl mx-auto p-4 space-y-4 font-mono">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Server className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-['Orbitron',sans-serif] text-base font-bold text-cyan-300">
              SYSTEM DIAGNOSTICS, LOCAL AGENT & CONFIGURATION
            </h2>
            <p className="text-xs text-cyan-400/60">
              8-SUBSYSTEM HEALTH CHECKS &bull; WINDOWS LOCAL AGENT BRIDGE &bull; SQLITE MEMORY
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundFX.playBlip();
            onRefreshDiagnostics();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400 text-xs text-cyan-200 font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RE-RUN DIAGNOSTICS</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-cyan-900/40 pb-2 text-xs">
        {[
          { id: 'diag', label: '8-SUBSYSTEM DIAGNOSTICS', icon: Activity },
          { id: 'local_agent', label: 'WINDOWS LOCAL AGENT SETUP', icon: Monitor },
          { id: 'settings', label: 'AI & VOICE PREFERENCES', icon: Settings },
          { id: 'memory', label: 'LOCAL SQLITE MEMORY', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                  : 'text-slate-400 hover:text-cyan-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: 8 Subsystems Diagnostics */}
      {activeSubTab === 'diag' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {subsystems.map((sub) => (
            <div
              key={sub.id}
              className="p-3.5 rounded-xl bg-[#060c18]/90 border border-cyan-900/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{sub.name}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                    sub.status === 'ONLINE'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                      : sub.status === 'DEGRADED'
                      ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                      : 'bg-red-950 text-red-400 border-red-500/40'
                  }`}
                >
                  ● {sub.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Latency: {sub.latencyMs ? `${sub.latencyMs}ms` : 'Local'}</span>
                <span>Verified live</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Windows Local Agent Setup */}
      {activeSubTab === 'local_agent' && (
        <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
            <div>
              <h3 className="font-bold text-cyan-300 text-sm">
                JARVIS WINDOWS LOCAL AGENT (REAL-TIME MACHINE BRIDGE)
              </h3>
              <p className="text-slate-400 text-[11px]">
                Run the dedicated local Python agent on your Windows computer to unlock real native OS control, local Ollama execution, and offline speech recognition.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#030712] border border-cyan-900/50 space-y-2">
              <span className="text-cyan-400 font-bold block">STEP 1: DOWNLOAD</span>
              <p className="text-slate-300 text-[11px]">
                Clone or extract the <code className="text-cyan-300">jarvis_local_agent/</code> folder onto your Windows machine.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#030712] border border-cyan-900/50 space-y-2">
              <span className="text-cyan-400 font-bold block">STEP 2: RUN LAUNCHER</span>
              <p className="text-slate-300 text-[11px]">
                Double click <code className="text-cyan-300">run_jarvis.bat</code> or run <code className="text-cyan-300">python main.py</code> in cmd/PowerShell.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#030712] border border-cyan-900/50 space-y-2">
              <span className="text-cyan-400 font-bold block">STEP 3: REAL-TIME LINK</span>
              <p className="text-slate-300 text-[11px]">
                The agent listens on <code className="text-emerald-300">http://127.0.0.1:8765</code> with secure origin validation.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#030712] border border-cyan-500/40 space-y-2">
            <span className="text-cyan-300 font-bold">Local Agent Connection Details:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Local Agent Endpoint URL:</label>
                <input
                  type="text"
                  value={formData.localAgentUrl}
                  onChange={(e) => setFormData({ ...formData, localAgentUrl: e.target.value })}
                  className="w-full bg-[#081224] border border-cyan-900/60 text-cyan-200 p-2 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Security Token / Pairing Secret:</label>
                <input
                  type="password"
                  value={formData.localAgentToken}
                  onChange={(e) => setFormData({ ...formData, localAgentToken: e.target.value })}
                  className="w-full bg-[#081224] border border-cyan-900/60 text-cyan-200 p-2 rounded text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI & Voice Preferences */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSave} className="p-5 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">User / Operator Name:</label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full bg-[#030712] border border-cyan-900/60 text-cyan-200 p-2 rounded text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">Ollama Model Preference:</label>
              <select
                value={formData.ollamaModel}
                onChange={(e) => setFormData({ ...formData, ollamaModel: e.target.value })}
                className="w-full bg-[#030712] border border-cyan-900/60 text-cyan-200 p-2 rounded text-xs"
              >
                <option value="phi3">phi3 (Default Fast ~2GB)</option>
                <option value="llama3">llama3 (Meta Llama 3)</option>
                <option value="mistral">mistral (Mistral 7B)</option>
                <option value="qwen2">qwen2 (Alibaba Qwen 2)</option>
                <option value="codellama">codellama (Code Llama)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">Permission Security Level:</label>
              <select
                value={formData.permissionLevel}
                onChange={(e) => setFormData({ ...formData, permissionLevel: e.target.value as any })}
                className="w-full bg-[#030712] border border-cyan-900/60 text-cyan-200 p-2 rounded text-xs"
              >
                <option value="NORMAL">NORMAL (Prompt for sensitive actions)</option>
                <option value="CONFIRM">CONFIRM (Prompt for all destructive actions)</option>
                <option value="READ_ONLY">READ ONLY (Safe mode)</option>
                <option value="RESTRICTED">RESTRICTED (Sandbox only)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">Ollama Host URL:</label>
              <input
                type="text"
                value={formData.ollamaBaseUrl}
                onChange={(e) => setFormData({ ...formData, ollamaBaseUrl: e.target.value })}
                className="w-full bg-[#030712] border border-cyan-900/60 text-cyan-200 p-2 rounded text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.wakeWordEnabled}
                onChange={(e) => setFormData({ ...formData, wakeWordEnabled: e.target.checked })}
                className="accent-cyan-400"
              />
              <span>Enable Wake Word ("Jarvis" / "ஜார்விஸ்")</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.soundEffects}
                onChange={(e) => setFormData({ ...formData, soundEffects: e.target.checked })}
                className="accent-cyan-400"
              />
              <span>Iron Man Neural Audio FX</span>
            </label>
          </div>

          {saveStatus && (
            <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
              {saveStatus}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>SAVE CONFIGURATION</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Local SQLite Memory Explorer */}
      {activeSubTab === 'memory' && (
        <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
            <h3 className="font-bold text-cyan-300">LOCAL SQLITE PERSISTENCE & CONTEXT MEMORY</h3>
            <button
              onClick={() => {
                if (confirm('Clear all local memory and history?')) {
                  onClearMemory();
                  soundFX.playAcknowledge();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CLEAR MEMORY</span>
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {memoryEntries.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No active long-term context stored.</p>
            ) : (
              memoryEntries.map((mem) => (
                <div key={mem.id} className="p-3 rounded-lg bg-[#030712] border border-cyan-900/40 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="text-cyan-400 font-bold uppercase">[{mem.category}]</span>
                    <span>{mem.timestamp}</span>
                  </div>
                  <div className="text-slate-200 font-bold">{mem.summary}</div>
                  <div className="text-slate-400 text-[11px]">{mem.details}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
