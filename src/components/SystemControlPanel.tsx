import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Cpu,
  Folder,
  HardDrive,
  Lock,
  Monitor,
  Music,
  Play,
  Power,
  RefreshCw,
  Sliders,
  Trash2,
  Volume2,
  VolumeX,
  Wifi,
  Zap,
} from 'lucide-react';
import { AppRegistryItem, ProcessInfo, SystemStats } from '../types';
import { soundFX } from '../lib/audio';

interface SystemControlPanelProps {
  stats: SystemStats | null;
  apps: AppRegistryItem[];
  onLaunchApp: (appIdOrName: string) => void;
  onTakeScreenshot: () => void;
  onSetVolume: (level: number) => void;
  onLockPC: () => void;
  onRequestShutdown: () => void;
  onRequestRestart: () => void;
  onKillProcess: (pid: number, name: string) => void;
  onRefresh: () => void;
  screenshotUrl: string | null;
}

export const SystemControlPanel: React.FC<SystemControlPanelProps> = ({
  stats,
  apps,
  onLaunchApp,
  onTakeScreenshot,
  onSetVolume,
  onLockPC,
  onRequestShutdown,
  onRequestRestart,
  onKillProcess,
  onRefresh,
  screenshotUrl,
}) => {
  const [volume, setVolumeState] = useState(65);
  const [filterTerm, setFilterTerm] = useState('');

  const handleVolumeChange = (newVol: number) => {
    setVolumeState(newVol);
    onSetVolume(newVol);
  };

  const filteredProcesses = stats?.activeProcesses.filter((p) =>
    p.name.toLowerCase().includes(filterTerm.toLowerCase()) || String(p.pid).includes(filterTerm)
  ) || [];

  return (
    <div id="jarvis-system-panel" className="max-w-7xl mx-auto p-4 space-y-5">
      {/* Top Header & Fast Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-['Orbitron',sans-serif] text-base font-bold text-cyan-300">
              WINDOWS CONTROL & HARDWARE TELEMETRY
            </h2>
            <p className="text-xs font-mono text-cyan-400/60">
              REAL-TIME PROCESSES &bull; REGISTRY LAUNCHER &bull; SECURITY GAUGES
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundFX.playBlip();
              onRefresh();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a172e] hover:bg-cyan-950 border border-cyan-900/50 hover:border-cyan-400 text-xs font-mono text-cyan-300 transition-all"
            title="Refresh System Stats"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>SYNC</span>
          </button>

          <button
            id="btn-quick-screenshot"
            onClick={() => {
              soundFX.playBlip();
              onTakeScreenshot();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400 text-xs font-mono text-cyan-200 font-bold transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>SCREENSHOT</span>
          </button>

          <button
            id="btn-quick-lock"
            onClick={() => {
              soundFX.playAcknowledge();
              onLockPC();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400 text-xs font-mono text-amber-200 font-bold transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>LOCK PC</span>
          </button>

          <button
            id="btn-quick-shutdown"
            onClick={() => {
              soundFX.playError();
              onRequestShutdown();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500 text-xs font-mono text-red-300 font-bold transition-all"
          >
            <Power className="w-3.5 h-3.5" />
            <span>POWER</span>
          </button>
        </div>
      </div>

      {/* Hardware Telemetry Gauges Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU Gauge */}
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <Cpu className="w-4 h-4 text-cyan-400" /> CPU USAGE
              </span>
              <span>{stats.cpuFrequencyGhz ? `${stats.cpuFrequencyGhz} GHz` : 'Multi-Core'}</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold font-mono text-cyan-300">{stats.cpuUsage}%</span>
              <span className="text-[10px] font-mono text-slate-400">{stats.osName}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-cyan-900/40">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  stats.cpuUsage > 80 ? 'bg-red-500' : stats.cpuUsage > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${stats.cpuUsage}%` }}
              />
            </div>
          </div>

          {/* RAM Gauge */}
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <HardDrive className="w-4 h-4 text-cyan-400" /> RAM MEMORY
              </span>
              <span>
                {stats.ramUsedGb} / {stats.ramTotalGb} GB
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold font-mono text-cyan-300">{stats.ramUsage}%</span>
              <span className="text-[10px] font-mono text-slate-400">DDR4/DDR5 Synchronous</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-cyan-900/40">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  stats.ramUsage > 85 ? 'bg-red-500' : 'bg-indigo-400'
                }`}
                style={{ width: `${stats.ramUsage}%` }}
              />
            </div>
          </div>

          {/* Disk Gauge */}
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <Folder className="w-4 h-4 text-cyan-400" /> STORAGE NVME
              </span>
              <span>
                {stats.diskUsedGb} / {stats.diskTotalGb} GB
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold font-mono text-cyan-300">{stats.diskUsage}%</span>
              <span className="text-[10px] font-mono text-slate-400">NTFS Primary Volume</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-cyan-900/40">
              <div
                className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${stats.diskUsage}%` }}
              />
            </div>
          </div>

          {/* Network & Battery */}
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <Wifi className="w-4 h-4 text-cyan-400" /> NETWORK & POWER
              </span>
              {stats.batteryPercent !== null ? (
                <span className="text-emerald-400">{stats.batteryPercent}% BAT</span>
              ) : (
                <span className="text-cyan-300">AC CONNECTED</span>
              )}
            </div>
            <div className="text-xs font-mono text-slate-300 space-y-1 my-1">
              <div className="flex justify-between">
                <span>TX / Upload:</span>
                <span className="text-cyan-300 font-bold">{stats.networkUpKbps} KB/s</span>
              </div>
              <div className="flex justify-between">
                <span>RX / Download:</span>
                <span className="text-cyan-300 font-bold">{stats.networkDownKbps} KB/s</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Uptime:</span>
                <span>{Math.floor(stats.uptimeSeconds / 3600)}h {Math.floor((stats.uptimeSeconds % 3600) / 60)}m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Application Launcher + Active Process Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Windows Application Registry & Volume Controller */}
        <div className="lg:col-span-5 space-y-5">
          {/* App Registry */}
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-cyan-400" /> WINDOWS APPLICATION REGISTRY
              </h3>
              <span className="text-[10px] font-mono text-slate-400">1-Click Launch</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {apps.map((app) => (
                <button
                  key={app.id}
                  id={`app-launch-${app.id}`}
                  onClick={() => {
                    soundFX.playAcknowledge();
                    onLaunchApp(app.name);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a172e] hover:bg-cyan-950/60 border border-cyan-900/40 hover:border-cyan-400/60 transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 group-hover:scale-110 transition-transform">
                      <Play className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-200 group-hover:text-cyan-200">
                        {app.name}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">{app.category}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                    READY
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Volume Control Deck */}
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" /> MASTER AUDIO LEVEL
              </h3>
              <span className="text-xs font-mono font-bold text-cyan-400">{volume}%</span>
            </div>

            <div className="flex items-center gap-3">
              <VolumeX className="w-4 h-4 text-slate-500 cursor-pointer" onClick={() => handleVolumeChange(0)} />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <Volume2 className="w-4 h-4 text-cyan-400 cursor-pointer" onClick={() => handleVolumeChange(100)} />
            </div>
          </div>

          {/* Screenshot Preview Card if taken */}
          {screenshotUrl && (
            <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400" /> RECENT SCREEN CAPTURE
                </h3>
                <a
                  href={screenshotUrl}
                  download={`screenshot_${Date.now()}.png`}
                  className="text-[10px] font-mono text-cyan-400 hover:underline"
                >
                  Download PNG
                </a>
              </div>
              <div className="rounded-lg border border-cyan-900/60 overflow-hidden">
                <img src={screenshotUrl} alt="Screen capture preview" className="w-full h-auto object-cover max-h-44" />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Process Explorer & Killer */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 shadow-lg flex flex-col h-[520px]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-cyan-300">
                ACTIVE TASK & PROCESS MANAGER
              </h3>
            </div>

            <input
              type="text"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              placeholder="Filter PID or name..."
              className="bg-[#040812] border border-cyan-900/50 text-cyan-200 px-2.5 py-1 rounded text-xs font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar border border-cyan-900/30 rounded-xl bg-[#030712]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#081224] text-cyan-400 border-b border-cyan-900/50 sticky top-0">
                <tr>
                  <th className="p-2.5">PID</th>
                  <th className="p-2.5">PROCESS NAME</th>
                  <th className="p-2.5">CPU %</th>
                  <th className="p-2.5">MEM (MB)</th>
                  <th className="p-2.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950/40 text-slate-300">
                {filteredProcesses.map((proc) => (
                  <tr key={proc.pid} className="hover:bg-cyan-950/30 transition-colors">
                    <td className="p-2.5 text-cyan-400/80 font-bold">{proc.pid}</td>
                    <td className="p-2.5 text-slate-200 font-semibold">{proc.name}</td>
                    <td className="p-2.5">
                      <span className={proc.cpuPercent > 5 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {proc.cpuPercent}%
                      </span>
                    </td>
                    <td className="p-2.5">{proc.memoryMb} MB</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => onKillProcess(proc.pid, proc.name)}
                        className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-[10px] font-bold transition-colors"
                        title={`Kill process ${proc.name} (${proc.pid})`}
                      >
                        TERMINATE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
