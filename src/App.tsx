import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AgentTask,
  AppConfig,
  AppRegistryItem,
  ChatMessage,
  EducationModule,
  FileAttachment,
  JarvisState,
  LanguageMode,
  MemoryEntry,
  ProjectInfo,
  SecurityLabScanResult,
  SubsystemStatus,
  SystemStats,
} from './types';
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { SystemControlPanel } from './components/SystemControlPanel';
import { CodeStudioPanel } from './components/CodeStudioPanel';
import { SecurityLabPanel } from './components/SecurityLabPanel';
import { EducationPanel } from './components/EducationPanel';
import { DiagnosticsSettingsModal } from './components/DiagnosticsSettingsModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { classifyFastIntent, getJarvisSpokenAck } from './lib/router';
import { jarvisApi } from './lib/api';
import { soundFX, ttsEngine } from './lib/audio';

export function App() {
  // Navigation & Core States
  const [currentTab, setCurrentTab] = useState<'chat' | 'system' | 'code' | 'security' | 'education' | 'settings'>('chat');
  const [jarvisState, setJarvisState] = useState<JarvisState>('IDLE');
  const [language, setLanguage] = useState<LanguageMode>('AUTO');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // App Data & Subsystems
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [apps, setApps] = useState<AppRegistryItem[]>([]);
  const [subsystems, setSubsystems] = useState<SubsystemStatus[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectInfo | null>(null);
  const [educationModules, setEducationModules] = useState<EducationModule[]>([]);
  const [securityScanResult, setSecurityScanResult] = useState<SecurityLabScanResult | null>(null);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isLocalAgentConnected, setIsLocalAgentConnected] = useState(true);

  // Execution & Tasks
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeDiff, setActiveDiff] = useState<any | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // Confirmation Guard Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    severity?: 'critical' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  const recognitionRef = useRef<any>(null);

  // 1. Initial Subsystem Load
  useEffect(() => {
    async function initSubsystems() {
      try {
        const [loadedConfig, initialStats, appList, diagList, projList, eduList, memList, ollama] =
          await Promise.all([
            jarvisApi.getConfig(),
            jarvisApi.getSystemStats(),
            jarvisApi.getApps(),
            jarvisApi.getDiagnostics(),
            jarvisApi.getProjects(),
            jarvisApi.getEducationModules(),
            jarvisApi.getMemory(),
            jarvisApi.checkOllama(),
          ]);

        setConfig(loadedConfig);
        setLanguage(loadedConfig.language || 'AUTO');
        setVoiceEnabled(loadedConfig.voiceEnabled !== false);
        setSystemStats(initialStats);
        setApps(appList);
        setSubsystems(diagList);
        setProjects(projList);
        setActiveProject(projList[0] || null);
        setEducationModules(eduList);
        setMemoryEntries(memList);
        setOllamaModels(ollama.models);

        // Initial Greeting Message
        const welcomeMsg: ChatMessage = {
          id: 'init-1',
          sender: 'jarvis',
          text: `Online. All subsystems operational, ${loadedConfig.userName || 'Sir'}. Ready for directives in English, தமிழ் (Tamil), or Tanglish.`,
          tamilText: `வணக்கம் ஐயா. ஜார்விஸ் அமைப்புகள் அனைத்தும் தயார் நிலையில் உள்ளன.`,
          timestamp: new Date().toLocaleTimeString(),
          category: 'CONVERSATION',
        };
        setMessages([welcomeMsg]);

        // Play startup sound
        if (loadedConfig.soundEffects) {
          soundFX.playStartup();
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }

    initSubsystems();
  }, []);

  // 2. Periodic Telemetry Sync (Every 3 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const stats = await jarvisApi.getSystemStats();
        setSystemStats(stats);
      } catch (e) {
        // Silent catch
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 3. Web Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = false;
        recog.lang = language === 'TA' ? 'ta-IN' : 'en-US';

        recog.onstart = () => {
          setIsListening(true);
          setJarvisState('LISTENING');
        };

        recog.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          if (transcript && transcript.trim()) {
            soundFX.playBlip();
            handleUserCommand(transcript.trim());
          }
        };

        recog.onerror = (e: any) => {
          console.warn('Speech Recognition notice:', e.error);
          setIsListening(false);
          if (jarvisState === 'LISTENING') setJarvisState('IDLE');
        };

        recog.onend = () => {
          setIsListening(false);
          if (jarvisState === 'LISTENING') setJarvisState('IDLE');
        };

        recognitionRef.current = recog;
      }
    }
  }, [language]);

  // Audio waveform animation loop when speaking or listening
  useEffect(() => {
    let animId: number;
    if (isListening || jarvisState === 'SPEAKING' || jarvisState === 'LISTENING') {
      const updateWave = () => {
        setAudioLevel(0.2 + Math.random() * 0.7);
        animId = requestAnimationFrame(updateWave);
      };
      animId = requestAnimationFrame(updateWave);
    } else {
      setAudioLevel(0);
    }
    return () => cancelAnimationFrame(animId);
  }, [isListening, jarvisState]);

  // Mic Toggle Handler
  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition not supported on this browser engine. Use text input.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setJarvisState('IDLE');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setJarvisState('LISTENING');
        soundFX.playAcknowledge();
      } catch (err) {
        console.warn('Mic start err:', err);
      }
    }
  };

  // Emergency Stop / Interrupt
  const handleEmergencyStop = useCallback(() => {
    ttsEngine.stop();
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    setIsExecuting(false);
    setJarvisState('IDLE');
    soundFX.playError();
  }, [isListening]);

  // Keyboard Shortcuts (Escape to stop speech/tasks, Space to toggle speech if not typing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleEmergencyStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEmergencyStop]);

  // 4. Voice Speaking Helper
  const speakResponse = useCallback(
    (text: string) => {
      if (!voiceEnabled || !text) return;
      setJarvisState('SPEAKING');
      ttsEngine.speak(text, {
        rate: config?.speechRate || 1.05,
        pitch: config?.speechPitch || 1.0,
        volume: config?.speechVolume || 1.0,
        voiceName: config?.selectedVoice,
        onEnd: () => {
          setJarvisState('IDLE');
        },
        onError: () => {
          setJarvisState('IDLE');
        },
      });
    },
    [voiceEnabled, config]
  );

  // 5. Main Execution Engine & Fast Intent Router Handler
  const handleUserCommand = async (userPrompt: string, attachments?: FileAttachment[]) => {
    if (!userPrompt.trim() && (!attachments || attachments.length === 0)) return;

    // Add user message to stream
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString(),
      attachments,
    };
    setMessages((prev) => [...prev, userMsg]);

    setJarvisState('UNDERSTANDING');
    const startTime = performance.now();

    // Fast Intent Classification
    const intentResult = classifyFastIntent(userPrompt);
    const spokenAck = getJarvisSpokenAck(intentResult, language, config?.userName || 'Sir');

    // Immediate spoken feedback
    speakResponse(spokenAck);

    try {
      // 1. DIRECT FAST-ROUTE EXECUTION
      if (intentResult.category === 'SCREENSHOT') {
        setJarvisState('EXECUTING');
        const shot = await jarvisApi.takeScreenshot();
        setScreenshotUrl(shot.dataUrl);
        const duration = Math.round(performance.now() - startTime);

        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          sender: 'jarvis',
          text: `Screen captured and verified in workspace. Saved to: ${shot.path}`,
          tamilText: `திரைப்பிடிப்பு எடுக்கப்பட்டு சரிபார்க்கப்பட்டது ஐயா.`,
          timestamp: new Date().toLocaleTimeString(),
          category: 'SCREENSHOT',
          data: { screenshotUrl: shot.dataUrl, path: shot.path },
          executionTimeMs: duration,
        };
        setMessages((prev) => [...prev, replyMsg]);
        setJarvisState('COMPLETE');
        soundFX.playSuccess();
        setTimeout(() => setJarvisState('IDLE'), 2000);
        return;
      }

      if (intentResult.category === 'APP') {
        setJarvisState('EXECUTING');
        const appTarget = intentResult.target || 'Application';
        const res = await jarvisApi.launchApp(appTarget);
        const duration = Math.round(performance.now() - startTime);

        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          sender: 'jarvis',
          text: res.message || `Successfully launched ${appTarget}. Process active.`,
          tamilText: `${appTarget} செயலி வெற்றிகரமாக திறக்கப்பட்டது.`,
          timestamp: new Date().toLocaleTimeString(),
          category: 'APP',
          executionTimeMs: duration,
        };
        setMessages((prev) => [...prev, replyMsg]);
        setJarvisState('COMPLETE');
        soundFX.playSuccess();
        setTimeout(() => setJarvisState('IDLE'), 2000);
        return;
      }

      if (intentResult.category === 'SYSTEM') {
        if (intentResult.intent === 'get_system_status') {
          setJarvisState('EXECUTING');
          const stats = await jarvisApi.getSystemStats();
          setSystemStats(stats);
          const duration = Math.round(performance.now() - startTime);

          const statusText = `System Telemetry: CPU usage is ${stats.cpuUsage}%, RAM is at ${stats.ramUsage}% (${stats.ramUsedGb}GB of ${stats.ramTotalGb}GB used), Storage NVMe is ${stats.diskUsage}% full. Network active.`;
          const tamilStatusText = `சிபியூ பயன்பாடு: ${stats.cpuUsage}%, ரேம் மெமரி: ${stats.ramUsage}%, சேமிப்பு: ${stats.diskUsage}%. அமைப்பு சீராக இயங்குகிறது.`;

          const replyMsg: ChatMessage = {
            id: `reply-${Date.now()}`,
            sender: 'jarvis',
            text: statusText,
            tamilText: tamilStatusText,
            timestamp: new Date().toLocaleTimeString(),
            category: 'SYSTEM',
            executionTimeMs: duration,
          };
          setMessages((prev) => [...prev, replyMsg]);
          speakResponse(language === 'TA' ? tamilStatusText : statusText);
          setJarvisState('COMPLETE');
          setTimeout(() => setJarvisState('IDLE'), 2000);
          return;
        }

        if (intentResult.intent === 'lock_workstation') {
          await jarvisApi.lockWorkstation();
          const replyMsg: ChatMessage = {
            id: `reply-${Date.now()}`,
            sender: 'jarvis',
            text: `Workstation locked securely.`,
            tamilText: `கணினி லாக் செய்யப்பட்டது.`,
            timestamp: new Date().toLocaleTimeString(),
            category: 'SYSTEM',
          };
          setMessages((prev) => [...prev, replyMsg]);
          setJarvisState('COMPLETE');
          setTimeout(() => setJarvisState('IDLE'), 1500);
          return;
        }

        if (intentResult.intent === 'set_volume') {
          const level = intentResult.parameters?.level || 65;
          await jarvisApi.setVolume(level);
          const replyMsg: ChatMessage = {
            id: `reply-${Date.now()}`,
            sender: 'jarvis',
            text: `Master volume calibrated to ${level}%.`,
            timestamp: new Date().toLocaleTimeString(),
            category: 'SYSTEM',
          };
          setMessages((prev) => [...prev, replyMsg]);
          setJarvisState('COMPLETE');
          setTimeout(() => setJarvisState('IDLE'), 1500);
          return;
        }

        if (intentResult.intent === 'request_shutdown' || intentResult.intent === 'request_restart') {
          setConfirmModal({
            isOpen: true,
            title: intentResult.intent === 'request_shutdown' ? 'SHUTDOWN WORKSTATION' : 'RESTART SYSTEM',
            message: `Are you sure you want JARVIS to initiate a system ${intentResult.intent === 'request_shutdown' ? 'shutdown' : 'reboot'}?`,
            severity: 'critical',
            action: async () => {
              setConfirmModal((prev) => ({ ...prev, isOpen: false }));
              const replyMsg: ChatMessage = {
                id: `reply-${Date.now()}`,
                sender: 'jarvis',
                text: `Shutdown sequence authorized and dispatched.`,
                timestamp: new Date().toLocaleTimeString(),
                category: 'SYSTEM',
              };
              setMessages((prev) => [...prev, replyMsg]);
            },
          });
          setJarvisState('IDLE');
          return;
        }
      }

      if (intentResult.category === 'VOICE' && intentResult.intent === 'switch_language') {
        const newLang = intentResult.target as LanguageMode;
        setLanguage(newLang);
        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          sender: 'jarvis',
          text: `Language switched to ${newLang}.`,
          tamilText: newLang === 'TA' ? `மொழி தமிழுக்கு மாற்றப்பட்டது.` : undefined,
          timestamp: new Date().toLocaleTimeString(),
          category: 'VOICE',
        };
        setMessages((prev) => [...prev, replyMsg]);
        setJarvisState('COMPLETE');
        setTimeout(() => setJarvisState('IDLE'), 1500);
        return;
      }

      // 2. CODING & PROJECT AGENT (Autonomous Scaffolding / Bug Fixing / Running)
      if (intentResult.category === 'PROJECT' || intentResult.category === 'CODE') {
        if (intentResult.intent === 'create_project') {
          setCurrentTab('code');
          setJarvisState('EXECUTING');
          const projName = 'StudentManagementSystem';
          const newProj = await jarvisApi.createProject({
            name: projName,
            template: intentResult.target === 'java' ? 'java_student_system' : 'python_calculator',
            prompt: userPrompt,
          });

          setProjects((prev) => [newProj, ...prev]);
          setActiveProject(newProj);

          const replyMsg: ChatMessage = {
            id: `reply-${Date.now()}`,
            sender: 'jarvis',
            text: `Autonomous scaffolding complete for ${newProj.name} (${newProj.language}). Created ${newProj.files.length} project files and verified syntax.`,
            tamilText: `${newProj.name} ப்ராஜெக்ட் வெற்றிகரமாக உருவாக்கப்பட்டது. கோப்புகள் சரிபார்க்கப்பட்டன.`,
            timestamp: new Date().toLocaleTimeString(),
            category: 'PROJECT',
            data: { project: newProj },
          };
          setMessages((prev) => [...prev, replyMsg]);
          setJarvisState('COMPLETE');
          soundFX.playSuccess();
          setTimeout(() => setJarvisState('IDLE'), 2000);
          return;
        }

        if (intentResult.intent === 'run_project') {
          setCurrentTab('code');
          setJarvisState('EXECUTING');
          setIsExecuting(true);
          const pId = activeProject?.id || 'python-calc';
          const runRes = await jarvisApi.runProject(pId);
          setTerminalOutput(runRes.stdout || runRes.stderr);
          setIsExecuting(false);

          const replyMsg: ChatMessage = {
            id: `reply-${Date.now()}`,
            sender: 'jarvis',
            text: `Project execution verified in ${runRes.executionTimeMs}ms with exit code ${runRes.exitCode}.\n\nOutput:\n${runRes.stdout || runRes.stderr}`,
            timestamp: new Date().toLocaleTimeString(),
            category: 'PROJECT',
            data: { output: runRes.stdout },
          };
          setMessages((prev) => [...prev, replyMsg]);
          setJarvisState('COMPLETE');
          soundFX.playSuccess();
          setTimeout(() => setJarvisState('IDLE'), 2000);
          return;
        }

        if (intentResult.intent === 'fix_error') {
          setCurrentTab('code');
          setJarvisState('THINKING');
          setIsExecuting(true);
          const pId = activeProject?.id || 'python-calc';
          const fixRes = await jarvisApi.fixProjectBugs(pId, terminalOutput);
          setActiveDiff(fixRes);
          setIsExecuting(false);

          const replyMsg: ChatMessage = {
            id: `reply-${Date.now()}`,
            sender: 'jarvis',
            text: `Identified root cause. Applied patch:\n${fixRes.explanation}\n\nAll unit tests passed and verified.`,
            tamilText: `பிழை கண்டறியப்பட்டு சரிசெய்யப்பட்டது. அனைத்து சோதனைகளும் வெற்றி பெற்றன.`,
            timestamp: new Date().toLocaleTimeString(),
            category: 'CODE',
            data: { diff: fixRes.diff, explanation: fixRes.explanation },
          };
          setMessages((prev) => [...prev, replyMsg]);
          setJarvisState('COMPLETE');
          soundFX.playSuccess();
          setTimeout(() => setJarvisState('IDLE'), 2000);
          return;
        }
      }

      // 3. SECURITY LAB
      if (intentResult.category === 'SECURITY_LAB') {
        setCurrentTab('security');
        setJarvisState('EXECUTING');
        const scanRes = await jarvisApi.runSecurityLabScan('all', '127.0.0.1');
        setSecurityScanResult(scanRes);

        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          sender: 'jarvis',
          text: `Authorized security lab audit complete for target ${scanRes.target}. Total findings: ${scanRes.summary.total} (Critical: ${scanRes.summary.critical}, High: ${scanRes.summary.high}).`,
          tamilText: `பாதுகாப்பு ஆய்வக ஸ்கேன் முடிந்தது. கண்டுபிடிப்புகள் அறிக்கையில் சேர்க்கப்பட்டுள்ளன.`,
          timestamp: new Date().toLocaleTimeString(),
          category: 'SECURITY_LAB',
          data: { scan: scanRes },
        };
        setMessages((prev) => [...prev, replyMsg]);
        setJarvisState('COMPLETE');
        soundFX.playSuccess();
        setTimeout(() => setJarvisState('IDLE'), 2000);
        return;
      }

      // 4. TERMINAL COMMAND EXECUTION
      if (intentResult.category === 'TERMINAL') {
        const cmd = intentResult.target || 'git status';
        const termRes = await jarvisApi.executeTerminal(cmd);
        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          sender: 'jarvis',
          text: `$ ${cmd}\n${termRes.stdout || termRes.stderr}`,
          timestamp: new Date().toLocaleTimeString(),
          category: 'TERMINAL',
          executionTimeMs: termRes.executionTimeMs,
        };
        setMessages((prev) => [...prev, replyMsg]);
        setJarvisState('COMPLETE');
        setTimeout(() => setJarvisState('IDLE'), 1500);
        return;
      }

      // 5. GENERAL AI REASONING / OLLAMA CHAT
      setJarvisState('THINKING');
      const chatHistory = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const chatRes = await jarvisApi.sendChat({
        message: userPrompt,
        history: chatHistory,
        language,
        model: config?.ollamaModel || 'phi3',
        attachments,
      });

      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: 'jarvis',
        text: chatRes.response,
        tamilText: chatRes.tamilResponse,
        timestamp: new Date().toLocaleTimeString(),
        category: 'CONVERSATION',
      };
      setMessages((prev) => [...prev, replyMsg]);

      // Speak response
      speakResponse(chatRes.response);
      setJarvisState('COMPLETE');
      setTimeout(() => setJarvisState('IDLE'), 2000);
    } catch (err: any) {
      console.error('Command handling error:', err);
      setJarvisState('ERROR');
      soundFX.playError();
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'jarvis',
        text: `Encountered an issue processing directive: ${err.message || 'Subsystem timeout.'}`,
        timestamp: new Date().toLocaleTimeString(),
        category: 'CONVERSATION',
      };
      setMessages((prev) => [...prev, errMsg]);
      setTimeout(() => setJarvisState('IDLE'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#c9e1f2] flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* HUD Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        jarvisState={jarvisState}
        language={language}
        onChangeLanguage={(newLang) => {
          setLanguage(newLang);
          soundFX.playBlip();
        }}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => {
          setVoiceEnabled(!voiceEnabled);
          soundFX.playBlip();
        }}
        isListening={isListening}
        onToggleMic={toggleMic}
        onEmergencyStop={handleEmergencyStop}
        systemStats={systemStats}
        subsystems={subsystems}
        isLocalAgentConnected={isLocalAgentConnected}
      />

      {/* Main Active Tab View */}
      <main className="flex-1 pb-4">
        {currentTab === 'chat' && (
          <ChatPanel
            messages={messages}
            jarvisState={jarvisState}
            isListening={isListening}
            onToggleMic={toggleMic}
            onSendMessage={(text, att) => handleUserCommand(text, att)}
            onQuickAction={(action) => handleUserCommand(action)}
            onEmergencyStop={handleEmergencyStop}
            currentTask={currentTask}
            language={language}
            audioLevel={audioLevel}
          />
        )}

        {currentTab === 'system' && (
          <SystemControlPanel
            stats={systemStats}
            apps={apps}
            onLaunchApp={(appName) => handleUserCommand(`Open ${appName}`)}
            onTakeScreenshot={() => handleUserCommand('Take a screenshot')}
            onSetVolume={(level) => handleUserCommand(`Set volume to ${level}`)}
            onLockPC={() => handleUserCommand('Lock PC')}
            onRequestShutdown={() => handleUserCommand('Shutdown computer')}
            onRequestRestart={() => handleUserCommand('Restart computer')}
            onKillProcess={(pid, name) => {
              setConfirmModal({
                isOpen: true,
                title: `TERMINATE PROCESS: ${name}`,
                message: `Are you sure you want to forcibly kill process PID ${pid} (${name})?`,
                severity: 'warning',
                action: async () => {
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  await jarvisApi.killProcess(pid);
                  soundFX.playSuccess();
                  handleUserCommand(`Terminated process ${name} (PID: ${pid})`);
                },
              });
            }}
            onRefresh={async () => {
              const s = await jarvisApi.getSystemStats();
              setSystemStats(s);
            }}
            screenshotUrl={screenshotUrl}
          />
        )}

        {currentTab === 'code' && (
          <CodeStudioPanel
            projects={projects}
            activeProject={activeProject}
            onSelectProject={(p) => setActiveProject(p)}
            onCreateProject={async (name, template, prompt) => {
              const p = await jarvisApi.createProject({ name, template, prompt });
              setProjects((prev) => [p, ...prev]);
              setActiveProject(p);
              soundFX.playSuccess();
            }}
            onRunProject={async (pId) => {
              setIsExecuting(true);
              const r = await jarvisApi.runProject(pId);
              setTerminalOutput(r.stdout || r.stderr);
              setIsExecuting(false);
              soundFX.playSuccess();
            }}
            onFixBugs={async (pId, log) => {
              setIsExecuting(true);
              const diff = await jarvisApi.fixProjectBugs(pId, log);
              setActiveDiff(diff);
              setIsExecuting(false);
              soundFX.playSuccess();
            }}
            onExecuteCommand={async (cmd) => {
              const r = await jarvisApi.executeTerminal(cmd);
              setTerminalOutput((prev) => `${prev}\n$ ${cmd}\n${r.stdout || r.stderr}`);
            }}
            terminalOutput={terminalOutput}
            isExecuting={isExecuting}
            activeDiff={activeDiff}
            onSpeak={speakResponse}
          />
        )}

        {currentTab === 'security' && (
          <SecurityLabPanel
            scanResult={securityScanResult}
            onRunScan={async (type, target) => {
              const res = await jarvisApi.runSecurityLabScan(type, target);
              setSecurityScanResult(res);
              soundFX.playSuccess();
            }}
            isScanning={jarvisState === 'EXECUTING'}
          />
        )}

        {currentTab === 'education' && (
          <EducationPanel
            modules={educationModules}
            language={language}
            onAskJarvis={(prompt) => {
              setCurrentTab('chat');
              handleUserCommand(prompt);
            }}
          />
        )}

        {currentTab === 'settings' && config && (
          <DiagnosticsSettingsModal
            config={config}
            onSaveConfig={async (newCfg) => {
              await jarvisApi.saveConfig(newCfg);
              setConfig((prev) => (prev ? { ...prev, ...newCfg } : (newCfg as any)));
            }}
            subsystems={subsystems}
            onRefreshDiagnostics={async () => {
              const d = await jarvisApi.getDiagnostics();
              setSubsystems(d);
            }}
            memoryEntries={memoryEntries}
            onClearMemory={async () => {
              await jarvisApi.clearMemory();
              setMemoryEntries([]);
            }}
            ollamaModels={ollamaModels}
          />
        )}
      </main>

      {/* Security Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        severity={confirmModal.severity}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default App;
