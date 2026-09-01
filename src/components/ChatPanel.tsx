import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  ArrowRight,
  Bot,
  Camera,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  FolderOpen,
  Globe,
  Mic,
  MicOff,
  Paperclip,
  Play,
  RotateCcw,
  Send,
  Shield,
  Square,
  Terminal,
  User,
  X,
  Zap,
} from 'lucide-react';
import {
  AgentTask,
  ChatMessage,
  FileAttachment,
  IntentCategory,
  JarvisState,
  LanguageMode,
} from '../types';
import { ArcReactor } from './ArcReactor';
import { AudioVisualizer } from './AudioVisualizer';
import { soundFX } from '../lib/audio';

interface ChatPanelProps {
  messages: ChatMessage[];
  jarvisState: JarvisState;
  isListening: boolean;
  onToggleMic: () => void;
  onSendMessage: (text: string, attachments?: FileAttachment[]) => void;
  onQuickAction: (actionText: string) => void;
  onEmergencyStop: () => void;
  currentTask: AgentTask | null;
  language: LanguageMode;
  audioLevel: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  jarvisState,
  isListening,
  onToggleMic,
  onSendMessage,
  onQuickAction,
  onEmergencyStop,
  currentTask,
  language,
  audioLevel,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;
    onSendMessage(inputText.trim(), attachments.length > 0 ? attachments : undefined);
    setInputText('');
    setAttachments([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: FileAttachment = {
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          dataUrl: reader.result as string,
          content: typeof reader.result === 'string' ? reader.result.slice(0, 4000) : '',
        };
        setAttachments((prev) => [...prev, attachment]);
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundFX.playBlip();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryBadgeClass = (category?: IntentCategory) => {
    switch (category) {
      case 'APP':
        return 'bg-blue-950/60 text-blue-300 border-blue-500/40';
      case 'SYSTEM':
      case 'SCREENSHOT':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
      case 'PROJECT':
      case 'CODE':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40';
      case 'SECURITY_LAB':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
      case 'EDUCATION':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
      case 'TERMINAL':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="jarvis-chat-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-4.5rem)] p-4 max-w-7xl mx-auto overflow-hidden">
      {/* Left Column: Holographic Core & Quick Directive Palette */}
      <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
        {/* Arc Reactor Hologram Box */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.08)] relative overflow-hidden">
          <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/70 uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            ARC REACTOR CORE
          </div>
          <div className="my-3">
            <ArcReactor
              state={jarvisState}
              size={135}
              audioLevel={audioLevel}
              onClick={onToggleMic}
            />
          </div>

          <div className="w-full mt-3">
            <AudioVisualizer
              state={jarvisState}
              isActive={isListening}
              audioLevel={audioLevel}
            />
          </div>

          <div className="w-full mt-3 flex items-center justify-between text-[11px] font-mono text-cyan-400/80 px-2 py-1 bg-[#030712] rounded-lg border border-cyan-900/40">
            <span>MIC: {isListening ? 'ACTIVE [SPACEBAR]' : 'STANDBY'}</span>
            <span>INTENT: ZERO-LATENCY</span>
          </div>
        </div>

        {/* Active Multi-step Task Engine Indicator */}
        {currentTask && currentTask.status !== 'COMPLETED' && currentTask.status !== 'FAILED' && (
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 shadow-lg animate-pulse">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-300 font-bold mb-1.5">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                ACTIVE DIRECTIVE: {currentTask.title}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-400/30">
                {currentTask.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mb-2">{currentTask.description}</p>
            {/* Task Steps */}
            <div className="space-y-1.5">
              {currentTask.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-[#030712]/80 border border-cyan-900/40"
                >
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-cyan-400">{idx + 1}.</span> {step.title}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      step.status === 'completed'
                        ? 'text-emerald-400'
                        : step.status === 'running'
                        ? 'text-cyan-400 animate-spin'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.status === 'completed' ? '✓ VERIFIED' : step.status === 'running' ? '● EXECUTING' : '○ QUEUED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Voice Directives / One-Click Actions */}
        <div className="p-3.5 rounded-2xl bg-[#060c18]/90 border border-cyan-500/20 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300 font-bold mb-2.5">
            <span className="flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              RAPID DIRECTIVES
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click to execute</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Open VS Code', text: 'Open VS Code', icon: Code2 },
              { label: 'Open Chrome', text: 'Open Chrome', icon: Globe },
              { label: 'Take Screenshot', text: 'Take a screenshot', icon: Camera },
              { label: 'System Health', text: 'CPU usage?', icon: Activity },
              { label: 'Open Workspace', text: 'Open workspace folder', icon: FolderOpen },
              { label: 'Build Python App', text: 'Create a Python calculator application with tests', icon: Code2 },
              { label: 'Run Active Project', text: 'Run this project', icon: Terminal },
              { label: 'Fix All Errors', text: 'Fix all errors in active project', icon: RotateCcw },
              { label: 'Security Lab Scan', text: 'Scan my localhost security lab', icon: Shield },
              { label: 'Explain Linked List', text: 'Explain linked list with Java and Python examples', icon: Zap },
              { label: 'Tamil: பிழை திருத்து', text: 'இந்த project la irukura error fix pannu', icon: RotateCcw },
              { label: 'Tamil: சிபியூ நிலை', text: 'சிபியூ பயன்பாடு எப்படி உள்ளது?', icon: Activity },
            ].map((btn, i) => {
              const Icon = btn.icon;
              return (
                <button
                  key={i}
                  id={`quick-action-btn-${i}`}
                  onClick={() => {
                    soundFX.playAcknowledge();
                    onQuickAction(btn.text);
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-lg bg-[#0a1424] hover:bg-cyan-950/60 border border-cyan-900/30 hover:border-cyan-500/50 text-[11px] font-mono text-slate-300 hover:text-cyan-200 transition-all text-left group"
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: High-Tech Chat Feed & Execution Terminal */}
      <div className="lg:col-span-8 flex flex-col h-full rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.08)] overflow-hidden">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-[#081224] border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-300">
              JARVIS NEURAL TERMINAL STREAM
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>LANG: {language}</span>
            <span>&bull;</span>
            <span>MODEL: PHI3 / LOCAL OLLAMA</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.sender === 'user'
                    ? 'bg-blue-950 border-blue-500/50 text-blue-300'
                    : 'bg-cyan-950 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble & Cards */}
              <div
                className={`flex flex-col gap-1.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 px-1">
                  <span>{msg.sender === 'user' ? 'USER (THIRU)' : 'JARVIS THIRU'}</span>
                  <span>&bull;</span>
                  <span>{msg.timestamp}</span>
                  {msg.category && (
                    <span
                      className={`px-1.5 py-0.2 rounded border font-bold text-[9px] uppercase ${getCategoryBadgeClass(
                        msg.category
                      )}`}
                    >
                      {msg.category}
                    </span>
                  )}
                </div>

                {/* Body Content */}
                <div
                  className={`p-3.5 rounded-2xl text-xs font-mono leading-relaxed border backdrop-blur-md ${
                    msg.sender === 'user'
                      ? 'bg-blue-950/40 border-blue-500/40 text-blue-100 rounded-tr-none'
                      : 'bg-[#09152a]/90 border-cyan-500/30 text-cyan-100 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Tamil Alternate Rendering if available */}
                  {msg.tamilText && (
                    <div className="mt-2 pt-2 border-t border-cyan-900/40 text-cyan-300 text-[11px]">
                      <span className="text-[10px] text-cyan-400/60 block font-bold">தமிழ் வடிவம்:</span>
                      {msg.tamilText}
                    </div>
                  )}

                  {/* Render Code or Data Blocks if attached */}
                  {msg.data && typeof msg.data === 'object' && (
                    <div className="mt-2.5 p-2 rounded bg-[#030712] border border-cyan-900/50 text-[11px] font-mono text-slate-300 overflow-x-auto">
                      {msg.data.code && (
                        <div>
                          <div className="flex items-center justify-between mb-1 text-[10px] text-cyan-400">
                            <span>{msg.data.language || 'Code Snippet'}</span>
                            <button
                              onClick={() => copyToClipboard(msg.data.code, msg.id)}
                              className="flex items-center gap-1 hover:text-cyan-200"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedId === msg.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="text-cyan-200">{msg.data.code}</pre>
                        </div>
                      )}
                      {msg.data.output && (
                        <div className="mt-1 text-emerald-400 font-mono">
                          <span className="text-[10px] text-slate-500 block">Verified Output:</span>
                          <pre>{msg.data.output}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Screenshot Thumbnail Preview if present */}
                  {msg.data?.screenshotUrl && (
                    <div className="mt-2.5 rounded-lg border border-cyan-500/40 overflow-hidden shadow-lg">
                      <img
                        src={msg.data.screenshotUrl}
                        alt="Captured Screen"
                        className="w-full h-auto max-h-48 object-cover"
                      />
                      <div className="p-1.5 bg-[#030712] text-[10px] text-cyan-400 flex items-center justify-between">
                        <span>Verified Screenshot</span>
                        <a
                          href={msg.data.screenshotUrl}
                          download={`jarvis_capture_${Date.now()}.png`}
                          className="hover:underline text-cyan-300"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action status footer */}
                {msg.executionTimeMs && (
                  <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 px-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified execution in {msg.executionTimeMs}ms</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 bg-[#040914] border-t border-cyan-900/30 flex items-center gap-2 overflow-x-auto">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-[11px] font-mono text-cyan-300"
              >
                <Paperclip className="w-3 h-3 text-cyan-400" />
                <span className="truncate max-w-[120px]">{att.name}</span>
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-300 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar with Voice & Attachments */}
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-[#081224] border-t border-cyan-500/20 flex items-center gap-2"
        >
          {/* File Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-[#0a172e] hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 border border-cyan-900/40 transition-colors"
            title="Attach images, source code, ZIP, logs"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={onToggleMic}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : 'bg-[#0a172e] hover:bg-cyan-950/60 text-cyan-400 border-cyan-900/40'
            }`}
            title={isListening ? 'Listening... Click to stop' : 'Push to talk (Speech Recognition)'}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            id="jarvis-command-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'TA'
                ? 'ஜார்விஸ் கட்டளையை உள்ளிடவும் (எ.கா: "Chrome திற", "சிபியூ பயன்பாடு")...'
                : language === 'TANGLISH'
                ? 'Type command in Tanglish (e.g. "Jarvis indha error fix pannu", "Chrome open pannu")...'
                : 'Command JARVIS (e.g., "Open VS Code", "CPU usage?", "Build a Python calculator", "Fix error")...'
            }
            className="flex-1 bg-[#040812] border border-cyan-900/50 focus:border-cyan-400 text-cyan-100 placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />

          {/* Send Button */}
          <button
            id="btn-send-directive"
            type="submit"
            disabled={!inputText.trim() && attachments.length === 0}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] flex items-center justify-center"
            title="Dispatch Directive to Fast Router"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
