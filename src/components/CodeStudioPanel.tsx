import React, { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  AlertCircle,
  ArrowRight,
  Bug,
  Check,
  CheckCircle,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  FilePlus,
  Folder,
  FolderPlus,
  HelpCircle,
  History,
  Layers,
  Lightbulb,
  Maximize2,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Share2,
  ShieldAlert,
  Sparkles,
  Square,
  Terminal,
  Trash2,
  Volume2,
  Wrench,
  X,
  Zap,
  Globe,
  Database,
  Award,
  BookOpen,
} from 'lucide-react';
import {
  CodeExecutionResult,
  CodeVersion,
  PracticeChallenge,
  PracticeSubmissionResult,
  ProjectFile,
  ProjectInfo,
  SqlQueryResult,
  SupportedLanguage,
} from '../types';
import { soundFX } from '../lib/audio';
import { jarvisApi } from '../lib/api';

interface CodeStudioPanelProps {
  projects: ProjectInfo[];
  activeProject: ProjectInfo | null;
  onSelectProject: (proj: ProjectInfo) => void;
  onCreateProject: (name: string, template: string, prompt?: string) => void;
  onRunProject: (projectId: string) => void;
  onFixBugs: (projectId: string, errorLog?: string) => void;
  onExecuteCommand: (cmd: string) => void;
  terminalOutput: string;
  isExecuting: boolean;
  activeDiff: { patchApplied: boolean; diff: string; explanation: string; testResult: any } | null;
  onSpeak?: (text: string) => void;
}

export const CodeStudioPanel: React.FC<CodeStudioPanelProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onRunProject,
  onFixBugs,
  onExecuteCommand,
  terminalOutput,
  isExecuting: isProjectExecuting,
  activeDiff,
  onSpeak,
}) => {
  // Studio Modes: Quick Code (Programiz Online Compiler), Practice, Web Preview, SQL Playground, Project Workspace
  const [studioMode, setStudioMode] = useState<'quick' | 'practice' | 'web' | 'sql' | 'project'>('quick');

  // Languages & Selected Language
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');

  // Editor State
  const [code, setCode] = useState<string>(`# Online Python Compiler (Programiz-Style)
# Write your code below and click RUN

def calculate_sum(a, b):
    return a + b

# Example with user input or direct values
a = 10
b = 20
print("Hello World from JARVIS Online Compiler!")
print(f"Result: {a} + {b} = {calculate_sum(a, b)}")
`);
  const [customStdin, setCustomStdin] = useState<string>('10\n20\n');
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [fontSize, setFontSize] = useState<number>(14);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'output' | 'errors' | 'input' | 'console' | 'tests'>('output');

  // Monaco Editor Ref
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Practice Challenges State
  const [challenges, setChallenges] = useState<PracticeChallenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<PracticeChallenge | null>(null);
  const [practiceCategory, setPracticeCategory] = useState<string>('DSA');
  const [practiceDifficulty, setPracticeDifficulty] = useState<string>('ALL');
  const [submissionResult, setSubmissionResult] = useState<PracticeSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  // SQL Playground State
  const [sqlQuery, setSqlQuery] = useState<string>(`-- SQL Playground (SQLite In-Memory Database)
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    salary INTEGER
);

INSERT INTO employees (name, department, salary) VALUES
    ('Thirutharun', 'Engineering', 125000),
    ('Tony Stark', 'R&D', 250000),
    ('Bruce Wayne', 'Management', 190000),
    ('Peter Parker', 'Photography', 45000);

-- Run query:
SELECT department, COUNT(*) AS employee_count, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;
`);
  const [sqlResult, setSqlResult] = useState<SqlQueryResult | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);

  // Web Playground State
  const [htmlCode, setHtmlCode] = useState<string>(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; background: #090d16; color: #38bdf8; padding: 24px; }
    .card { background: #0f172a; border: 1px solid #0284c7; padding: 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(2,132,199,0.2); }
    h1 { color: #38bdf8; font-size: 20px; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    button { background: #0284c7; color: #fff; font-weight: bold; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 12px; }
    button:hover { background: #0369a1; }
    #log { margin-top: 14px; font-family: monospace; font-size: 13px; color: #34d399; }
  </style>
</head>
<body>
  <div class="card">
    <h1>JARVIS Live Web Studio</h1>
    <p>Real-time client sandbox running responsive CSS & modern JavaScript.</p>
    <button onclick="triggerPulse()">Execute Subsystem Pulse</button>
    <div id="log">● Ready for interaction.</div>
  </div>

  <script>
    let count = 0;
    function triggerPulse() {
      count++;
      document.getElementById('log').innerText = '✓ Subsystem pulse #' + count + ' verified at ' + new Date().toLocaleTimeString();
    }
  </script>
</body>
</html>`);

  // History & Versioning
  const [versionHistory, setVersionHistory] = useState<CodeVersion[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  // JARVIS AI Assistant Panel State
  const [aiAssistantOpen, setAiAssistantOpen] = useState<boolean>(true);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'jarvis'; text: string; tamilText?: string; timestamp: string }>>([
    {
      sender: 'jarvis',
      text: 'Greetings Sir. JARVIS Code Studio is online with multi-language execution and real-time debugging. Select a language, write code, or ask for explanations in English or தமிழ்.',
      tamilText: 'வணக்கம் ஐயா. ஜார்விஸ் கோட் ஸ்டுடியோ தயார் நிலையில் உள்ளது. எந்த மொழியிலும் கோட் எழுதலாம் அல்லது தமிழில் விளக்கம் கேட்கலாம்.',
      timestamp: 'Just now',
    },
  ]);
  const [aiInput, setAiInput] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiPatchDiff, setAiPatchDiff] = useState<{
    patchApplied: boolean;
    beforeCode: string;
    afterCode: string;
    diff: string;
    explanation: string;
    tamilExplanation?: string;
  } | null>(null);

  // Project Workspace State (if switched to Project Mode)
  const [openTabs, setOpenTabs] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjTemplate, setNewProjTemplate] = useState('python_calculator');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isNewFileModal, setIsNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);

  // VS Code-Style Language Picker Modal & Filter
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState<string>('');
  const [languageCategoryFilter, setLanguageCategoryFilter] = useState<string>('all');
  const [cursorPosition, setCursorPosition] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  // Global Keyboard shortcuts (e.g. Ctrl+K M or Ctrl+Alt+L to open Language Switcher)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setShowLanguageModal((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setShowLanguageModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load languages on mount
  useEffect(() => {
    async function init() {
      try {
        const langs = await jarvisApi.getSupportedLanguages();
        if (langs && langs.length > 0) {
          setLanguages(langs);
          const py = langs.find((l) => l.id === 'python');
          if (py && !code) {
            setCode(py.defaultCode);
            if (py.sampleInput) setCustomStdin(py.sampleInput);
          }
        }
      } catch (e) {
        console.warn('Failed to load languages:', e);
      }

      // Load Practice challenges
      try {
        const chs = await jarvisApi.getPracticeChallenges();
        if (chs && chs.length > 0) {
          setChallenges(chs);
          setActiveChallenge(chs[0]);
        }
      } catch (e) {
        console.warn('Failed to load challenges:', e);
      }

      // Load auto-saved code from local storage
      const savedCode = localStorage.getItem('jarvis_studio_code');
      const savedLang = localStorage.getItem('jarvis_studio_lang');
      if (savedCode) setCode(savedCode);
      if (savedLang) setSelectedLanguage(savedLang);

      // Load history snapshots
      try {
        const hist = localStorage.getItem('jarvis_studio_history');
        if (hist) setVersionHistory(JSON.parse(hist));
      } catch (e) {}
    }
    init();
  }, []);

  // Sync Project Mode Files when activeProject changes
  useEffect(() => {
    if (activeProject && activeProject.files.length > 0) {
      const map: Record<string, string> = {};
      activeProject.files.forEach((f) => {
        map[f.path] = f.content || '';
      });
      setFileContents(map);

      const entry =
        activeProject.files.find((f) => f.name === activeProject.entryPoint) ||
        activeProject.files.find((f) => f.type === 'file') ||
        activeProject.files[0];

      if (entry) {
        setOpenTabs([entry]);
        setActiveFile(entry);
      }
    }
  }, [activeProject]);

  // Handle Monaco Mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom JARVIS Dark Theme
    monaco.editor.defineTheme('jarvis-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'string', foreground: '4ade80' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'type', foreground: '06b6d4' },
      ],
      colors: {
        'editor.background': '#070b14',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#334155',
        'editorLineNumber.activeForeground': '#0284c7',
        'editor.lineHighlightBackground': '#0f172a80',
        'editorCursor.foreground': '#06b6d4',
      },
    });

    monaco.editor.setTheme(editorTheme === 'vs-dark' ? 'jarvis-dark' : 'light');

    // Register Keybinding: Ctrl + Enter (or Cmd + Enter) -> Run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunCode();
    });

    // Register Keybinding: Ctrl + S (or Cmd + S) -> Save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveCode();
    });

    // Register Keybinding: Ctrl + Alt + L or F1 -> Language Switcher
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyL, () => {
      setShowLanguageModal(true);
    });

    // Track Cursor Position for VS Code Status Bar
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({
        line: e.position.lineNumber,
        col: e.position.column,
      });
    });
  };

  // Switch Language
  const handleSelectLanguage = (langId: string) => {
    soundFX.click();
    setSelectedLanguage(langId);
    localStorage.setItem('jarvis_studio_lang', langId);

    const found = languages.find((l) => l.id === langId);
    if (found) {
      // If code was default template or empty, load new language template
      setCode(found.defaultCode);
      if (found.sampleInput !== undefined) {
        setCustomStdin(found.sampleInput);
      }
      setIsSaved(true);
    }
  };

  // Auto-save & Local Storage
  const handleCodeChange = (value: string | undefined) => {
    const val = value || '';
    setCode(val);
    setIsSaved(false);
    localStorage.setItem('jarvis_studio_code', val);
  };

  // Save Snapshot / Version
  const handleSaveCode = () => {
    soundFX.success();
    setIsSaved(true);
    localStorage.setItem('jarvis_studio_code', code);

    const newVersion: CodeVersion = {
      id: `v-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      language: selectedLanguage,
      code,
      label: `Version ${versionHistory.length + 1}`,
    };

    const updated = [newVersion, ...versionHistory.slice(0, 19)];
    setVersionHistory(updated);
    localStorage.setItem('jarvis_studio_history', JSON.stringify(updated));

    setSaveToast('Saved locally & Snapshot created');
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Real Sandboxed Execution (Run Button)
  const handleRunCode = async () => {
    if (isExecuting) return;
    soundFX.action();
    setIsExecuting(true);
    setActiveBottomTab('output');

    try {
      if (studioMode === 'sql') {
        const res = await jarvisApi.executeSql(sqlQuery);
        setSqlResult(res);
        setIsExecuting(false);
        return;
      }

      const result = await jarvisApi.executeCode({
        language: selectedLanguage,
        code,
        stdin: customStdin,
      });

      setExecutionResult(result);

      if (result.status === 'success') {
        soundFX.success();
        if (onSpeak) {
          onSpeak('Program executed successfully with exit code zero.');
        }
      } else {
        soundFX.error();
        if (onSpeak) {
          onSpeak('Execution finished with errors. Output and diagnostics are displayed below.');
        }
      }
    } catch (err: any) {
      soundFX.error();
      setExecutionResult({
        status: 'error',
        stdout: '',
        stderr: err.message || 'Execution error',
        exitCode: 1,
        executionTime: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Stop Running Program
  const handleStopExecution = () => {
    soundFX.click();
    setIsExecuting(false);
    setExecutionResult({
      status: 'error',
      stdout: '',
      stderr: '[JARVIS EXEC ENGINE] Execution terminated by operator.',
      exitCode: 130,
      executionTime: 0,
    });
  };

  // Format Code
  const handleFormatCode = () => {
    soundFX.click();
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  // Clear Output
  const handleClearOutput = () => {
    soundFX.click();
    setExecutionResult(null);
  };

  // Jump to Line in Monaco Editor from Error click
  const handleJumpToLine = (lineNumber: number) => {
    soundFX.click();
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
      editorRef.current.focus();
    }
  };

  // Submit Practice Challenge
  const handleSubmitPractice = async () => {
    if (!activeChallenge || isSubmitting) return;
    soundFX.action();
    setIsSubmitting(true);
    try {
      const res = await jarvisApi.submitPracticeChallenge({
        challengeId: activeChallenge.id,
        language: selectedLanguage,
        code,
      });
      setSubmissionResult(res);
      setActiveBottomTab('tests');

      if (res.score === 100) {
        soundFX.success();
        if (onSpeak) {
          onSpeak('All test cases passed. Excellent logic implementation.');
        }
      } else {
        soundFX.error();
      }
    } catch (e: any) {
      soundFX.error();
      alert(`Submission failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic Challenge Generator
  const handleGenerateNewChallenge = async () => {
    soundFX.action();
    setIsSubmitting(true);
    try {
      const generated = await jarvisApi.generatePracticeChallenge({
        category: practiceCategory,
        difficulty: practiceDifficulty === 'ALL' ? 'Medium' : practiceDifficulty,
      });
      setChallenges((prev) => [generated, ...prev]);
      setActiveChallenge(generated);
      if (generated.starterCode[selectedLanguage]) {
        setCode(generated.starterCode[selectedLanguage]);
      }
      setSubmissionResult(null);
      soundFX.success();
    } catch (e: any) {
      soundFX.error();
      alert(`Could not generate challenge: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Select a Practice Challenge
  const handleSelectChallenge = (ch: PracticeChallenge) => {
    soundFX.click();
    setActiveChallenge(ch);
    setSubmissionResult(null);
    setShowHint(false);
    setShowSolution(false);

    const langCode = ch.starterCode[selectedLanguage] || ch.starterCode.python || Object.values(ch.starterCode)[0] || '';
    if (langCode) {
      setCode(langCode);
    }
  };

  // JARVIS AI Quick Action (Explain, Optimize, Find Bugs, Tamil)
  const handleAiAction = async (
    mode: 'explain' | 'error' | 'optimize' | 'convert' | 'tests' | 'tamil' | 'tanglish',
    customDirective?: string
  ) => {
    soundFX.action();
    setIsAiThinking(true);

    const userQuery =
      customDirective ||
      (mode === 'explain'
        ? 'Explain this code in detail.'
        : mode === 'error'
        ? 'Why did this error occur and how to fix it?'
        : mode === 'optimize'
        ? 'Optimize this solution for time & space complexity.'
        : mode === 'tamil'
        ? 'இந்த code explain பண்ணு (Explain in Tamil).'
        : mode === 'tanglish'
        ? 'Indha code explain pannunga bro.'
        : 'Analyze and provide test cases.');

    setAiMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: userQuery,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    try {
      const res = await jarvisApi.explainCode({
        language: selectedLanguage,
        code,
        error: executionResult?.stderr || undefined,
        output: executionResult?.stdout || undefined,
        prompt: userQuery,
        mode,
      });

      setAiMessages((prev) => [
        ...prev,
        {
          sender: 'jarvis',
          text: res.response,
          tamilText: res.tamilResponse,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      soundFX.success();
    } catch (e: any) {
      soundFX.error();
      setAiMessages((prev) => [
        ...prev,
        {
          sender: 'jarvis',
          text: `Neural error: ${e.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // JARVIS AI Bug Fixer (Generates Before/After Diff)
  const handleRequestAiFix = async () => {
    soundFX.action();
    setIsAiThinking(true);
    try {
      const patch = await jarvisApi.fixCodeWithAi({
        language: selectedLanguage,
        code,
        error: executionResult?.stderr || 'Syntax or logic error',
        output: executionResult?.stdout || undefined,
        stdin: customStdin,
      });

      setAiPatchDiff(patch);
      setAiMessages((prev) => [
        ...prev,
        {
          sender: 'jarvis',
          text: `Fix proposal prepared:\n${patch.explanation}\n\nReview the BEFORE and AFTER diff below and click [APPLY] to update your editor.`,
          tamilText: patch.tamilExplanation,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      soundFX.success();
    } catch (e: any) {
      soundFX.error();
      alert(`AI Fix generation failed: ${e.message}`);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Apply AI Proposed Fix into Monaco Editor
  const handleApplyAiPatch = () => {
    if (!aiPatchDiff) return;
    soundFX.success();
    setCode(aiPatchDiff.afterCode);
    setAiPatchDiff(null);
    setIsSaved(false);
    setSaveToast('AI Fix applied to editor! Click ▶ RUN to test.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Reject AI Patch
  const handleRejectAiPatch = () => {
    soundFX.click();
    setAiPatchDiff(null);
  };

  // Export / Download Code
  const handleDownloadCode = () => {
    soundFX.click();
    const curLang = languages.find((l) => l.id === selectedLanguage);
    const ext = curLang?.ext || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis_${selectedLanguage}_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share Code
  const handleShareCode = () => {
    soundFX.click();
    const encoded = btoa(encodeURIComponent(code));
    const url = `${window.location.origin}/#code=${encoded}&lang=${selectedLanguage}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  // Monaco Language mapping
  const getMonacoLanguage = () => {
    if (studioMode === 'sql') return 'sql';
    if (studioMode === 'web') return 'html';
    const found = languages.find((l) => l.id === selectedLanguage);
    return found?.monacoLang || selectedLanguage;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050811] text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER & STUDIO BAR */}
      <header className="h-14 border-b border-cyan-950/70 bg-[#070c18] px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Code2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider text-cyan-300">JARVIS CODE STUDIO</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                  v2.5 ONLINE COMPILER
                </span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => {
                soundFX.click();
                setStudioMode('quick');
              }}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                studioMode === 'quick'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              QUICK CODE
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setStudioMode('practice');
              }}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                studioMode === 'practice'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              PRACTICE
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setStudioMode('sql');
              }}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                studioMode === 'sql'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              SQL
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setStudioMode('web');
              }}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                studioMode === 'web'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              WEB PREVIEW
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setStudioMode('project');
              }}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                studioMode === 'project'
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              PROJECT MODE
            </button>
          </div>
        </div>

        {/* Right Header Controls: Language Switcher, Theme, Font, Status */}
        <div className="flex items-center gap-2">
          {studioMode !== 'sql' && studioMode !== 'web' && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
              {/* VS Code Style Quick Language Button */}
              <button
                onClick={() => {
                  soundFX.click();
                  setShowLanguageModal(true);
                }}
                className="px-2.5 py-1 rounded bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-800/60 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                title="Open All Languages Palette (Ctrl+Alt+L)"
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {languages.find((l) => l.id === selectedLanguage)?.name || selectedLanguage}
                </span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-700/50">
                  .{languages.find((l) => l.id === selectedLanguage)?.ext || 'code'}
                </span>
                <Search className="w-3 h-3 text-cyan-400 opacity-60 ml-0.5" />
              </button>

              {/* Fast Inline Dropdown */}
              <select
                value={selectedLanguage}
                onChange={(e) => handleSelectLanguage(e.target.value)}
                className="bg-transparent text-slate-400 hover:text-slate-200 text-xs font-mono focus:outline-none cursor-pointer border-l border-slate-800 pl-1.5 max-w-[130px] truncate"
                title="Quick Language Select"
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id} className="bg-slate-900 text-slate-200">
                    {l.name} (.{l.ext})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Theme & Font Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-lg text-xs font-mono">
            <select
              value={editorTheme}
              onChange={(e) => {
                const val = e.target.value as any;
                setEditorTheme(val);
                if (monacoRef.current) {
                  monacoRef.current.editor.setTheme(val === 'vs-dark' ? 'jarvis-dark' : 'light');
                }
              }}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="vs-dark" className="bg-slate-900">
                Dark HUD
              </option>
              <option value="light" className="bg-slate-900">
                Light
              </option>
            </select>
            <span className="text-slate-600">|</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value={12} className="bg-slate-900">
                12px
              </option>
              <option value={14} className="bg-slate-900">
                14px
              </option>
              <option value={16} className="bg-slate-900">
                16px
              </option>
              <option value={18} className="bg-slate-900">
                18px
              </option>
            </select>
          </div>

          {/* Online Sandbox Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE COMPILER
          </div>

          {/* Auto-save status */}
          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            {isSaved ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> SAVED
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">● UNSAVED</span>
            )}
          </div>

          {/* AI Panel Toggle */}
          <button
            onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
              aiAssistantOpen
                ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-cyan-300'
            }`}
            title="Toggle JARVIS AI Coding Assistant"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">JARVIS AI</span>
          </button>
        </div>
      </header>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="absolute top-16 right-6 z-50 bg-cyan-950 border border-cyan-500 text-cyan-200 px-3.5 py-1.5 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          {saveToast}
        </div>
      )}

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Practice Explorer (if in Practice Mode) or File Explorer (if in Project Mode) */}
        {studioMode === 'practice' && (
          <aside className="w-80 border-r border-slate-800 bg-[#070a14] flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold font-mono tracking-wide text-slate-200">CHALLENGE VAULT</span>
              </div>
              <button
                onClick={handleGenerateNewChallenge}
                disabled={isSubmitting}
                className="text-[11px] font-mono px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 flex items-center gap-1 transition-all"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                + GENERATE
              </button>
            </div>

            {/* Filter Category & Difficulty */}
            <div className="p-2 border-b border-slate-800/60 grid grid-cols-2 gap-2 text-xs font-mono">
              <select
                value={practiceCategory}
                onChange={(e) => setPracticeCategory(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 p-1.5 rounded focus:outline-none"
              >
                <option value="DSA">DSA</option>
                <option value="Python">Python</option>
                <option value="Algorithms">Algorithms</option>
                <option value="SQL">SQL</option>
              </select>
              <select
                value={practiceDifficulty}
                onChange={(e) => setPracticeDifficulty(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 p-1.5 rounded focus:outline-none"
              >
                <option value="ALL">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Challenge List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {challenges.map((ch) => {
                const isSelected = activeChallenge?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleSelectChallenge(ch)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/40 border-slate-800/60 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold line-clamp-1">{ch.title}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          ch.difficulty === 'Easy'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : ch.difficulty === 'Medium'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        }`}
                      >
                        {ch.difficulty}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 font-mono">{ch.topic}</div>
                  </button>
                );
              })}
            </div>

            {/* Active Challenge Overview */}
            {activeChallenge && (
              <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs font-mono space-y-2 max-h-56 overflow-y-auto">
                <div className="font-bold text-cyan-300">{activeChallenge.title}</div>
                <div className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {activeChallenge.description}
                </div>

                {activeChallenge.tamilDescription && (
                  <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200">
                    <span className="font-bold">தமிழ் விளக்கம்: </span>
                    {activeChallenge.tamilDescription}
                  </div>
                )}

                {activeChallenge.hint && (
                  <div>
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Lightbulb className="w-3 h-3" /> {showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                    {showHint && (
                      <div className="p-2 mt-1 rounded bg-amber-950/30 border border-amber-800/40 text-amber-200 text-[11px]">
                        {activeChallenge.hint}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        )}

        {/* Left Side: Multi-File Explorer (if in Project Mode) */}
        {studioMode === 'project' && (
          <aside className="w-64 border-r border-slate-800 bg-[#070a14] flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono tracking-wide text-slate-200">PROJECT FILES</span>
              </div>
              <button
                onClick={() => setIsCreatingModal(true)}
                className="text-[11px] font-mono px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 flex items-center gap-1"
              >
                + NEW
              </button>
            </div>

            {/* Project Select Dropdown */}
            <div className="p-2 border-b border-slate-800">
              <select
                value={activeProject?.id || ''}
                onChange={(e) => {
                  const p = projects.find((x) => x.id === e.target.value);
                  if (p) onSelectProject(p);
                }}
                className="w-full bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono p-1.5 rounded focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    📁 {p.name} ({p.language})
                  </option>
                ))}
              </select>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {activeProject?.files.map((file) => {
                const isOpen = activeFile?.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => {
                      soundFX.click();
                      if (!openTabs.find((t) => t.path === file.path)) {
                        setOpenTabs([...openTabs, file]);
                      }
                      setActiveFile(file);
                      setCode(fileContents[file.path] || file.content || '');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between text-xs font-mono transition-all ${
                      isOpen
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Center: Editor + Action Bar + Bottom Dock */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#060913]">
          {/* Action Bar (RUN, STOP, CLEAR, FORMAT, SAVE, SUBMIT, SHARE, DOWNLOAD) */}
          <div className="h-11 border-b border-slate-800 bg-[#0a0f1e] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {/* Primary RUN Button */}
              <button
                onClick={handleRunCode}
                disabled={isExecuting}
                className={`px-4 py-1.5 rounded-md font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-md ${
                  isExecuting
                    ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700 cursor-not-allowed animate-pulse'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95'
                }`}
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                    RUNNING...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    ▶ RUN <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(Ctrl+Enter)</span>
                  </>
                )}
              </button>

              {/* STOP Button (Terminates process) */}
              {isExecuting && (
                <button
                  onClick={handleStopExecution}
                  className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_10px_rgba(225,29,72,0.4)] active:scale-95 transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  ■ STOP
                </button>
              )}

              {/* Submit for Practice mode */}
              {studioMode === 'practice' && (
                <button
                  onClick={handleSubmitPractice}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      EVALUATING...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      SUBMIT SOLUTION
                    </>
                  )}
                </button>
              )}

              <div className="h-5 w-px bg-slate-800 mx-1" />

              {/* Utility Buttons: Clear, Format, Save */}
              <button
                onClick={handleClearOutput}
                className="px-2.5 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all flex items-center gap-1"
                title="Clear Output Window"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                CLEAR
              </button>

              <button
                onClick={handleFormatCode}
                className="px-2.5 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all flex items-center gap-1"
                title="Format Code"
              >
                <Wrench className="w-3.5 h-3.5" />
                FORMAT
              </button>

              <button
                onClick={handleSaveCode}
                className="px-2.5 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-all flex items-center gap-1"
                title="Save Snapshot (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
                SAVE
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* History Button */}
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-2.5 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all flex items-center gap-1"
                title="Version History & Restore"
              >
                <History className="w-3.5 h-3.5" />
                HISTORY ({versionHistory.length})
              </button>

              {/* Share Button */}
              <button
                onClick={handleShareCode}
                className="px-2.5 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-all flex items-center gap-1"
                title="Share Code Reference"
              >
                <Share2 className="w-3.5 h-3.5" />
                SHARE
              </button>

              {/* Download / Export Button */}
              <button
                onClick={handleDownloadCode}
                className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
                title="Download Source Code"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Editor Area / Live Preview */}
          <div className="flex-1 flex overflow-hidden">
            {studioMode === 'web' ? (
              // Web Mode: HTML Editor on Left, Live Preview Iframe on Right
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-800">
                <div className="flex flex-col h-full">
                  <div className="p-2 border-b border-slate-800 bg-[#080d1a] text-xs font-mono text-cyan-300 flex items-center justify-between">
                    <span>HTML / CSS / JS SOURCE</span>
                    <span className="text-[10px] text-slate-400">Live Reload Enabled</span>
                  </div>
                  <div className="flex-1">
                    <Editor
                      height="100%"
                      language="html"
                      theme={editorTheme === 'vs-dark' ? 'jarvis-dark' : 'light'}
                      value={htmlCode}
                      onChange={(val) => setHtmlCode(val || '')}
                      options={{
                        fontSize,
                        wordWrap,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col h-full bg-[#050811]">
                  <div className="p-2 border-b border-slate-800 bg-[#080d1a] text-xs font-mono text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> LIVE SANDBOX PREVIEW
                    </span>
                    <button
                      onClick={() => setHtmlCode((c) => c + ' ')}
                      className="text-[10px] text-slate-400 hover:text-cyan-300"
                    >
                      Refresh Frame
                    </button>
                  </div>
                  <div className="flex-1 bg-white">
                    <iframe
                      title="Live Web Preview"
                      srcDoc={htmlCode}
                      sandbox="allow-scripts allow-modals"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Standard Code Editor (Monaco)
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 min-h-0">
                  <Editor
                    height="100%"
                    language={getMonacoLanguage()}
                    theme={editorTheme === 'vs-dark' ? 'jarvis-dark' : 'light'}
                    value={code}
                    onChange={handleCodeChange}
                    onMount={handleEditorDidMount}
                    options={{
                      fontSize,
                      wordWrap,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      lineNumbers: 'on',
                      folding: true,
                      bracketPairColorization: { enabled: true },
                      cursorBlinking: 'smooth',
                      smoothScrolling: true,
                    }}
                  />
                </div>

                {/* VS Code Style Status Bar */}
                <div className="h-6 border-t border-slate-800/80 bg-[#060a15] px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300">
                      Ln {cursorPosition.line}, Col {cursorPosition.col}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">Spaces: 2</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">UTF-8</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">LF</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundFX.click();
                        setShowLanguageModal(true);
                      }}
                      className="px-2 py-0.5 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Click to select language mode (Ctrl+Alt+L)"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span className="font-bold">
                        {languages.find((l) => l.id === selectedLanguage)?.name || selectedLanguage}
                      </span>
                      <span className="text-slate-500">
                        ({languages.find((l) => l.id === selectedLanguage)?.version || 'v1.0'})
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. BOTTOM DOCK: OUTPUT, ERRORS, CUSTOM INPUT, CONSOLE, TESTS */}
          <div className="h-64 border-t border-slate-800 bg-[#070b16] flex flex-col shrink-0">
            {/* Dock Tabs Bar */}
            <div className="h-9 border-b border-slate-800 px-3 flex items-center justify-between bg-[#080d1a]">
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => {
                    soundFX.click();
                    setActiveBottomTab('output');
                  }}
                  className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                    activeBottomTab === 'output'
                      ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  OUTPUT
                  {executionResult && executionResult.status === 'success' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>

                <button
                  onClick={() => {
                    soundFX.click();
                    setActiveBottomTab('errors');
                  }}
                  className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                    activeBottomTab === 'errors'
                      ? 'bg-slate-800 text-rose-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  ERRORS
                  {executionResult?.stderr && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 text-[10px] font-bold border border-rose-800">
                      1
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    soundFX.click();
                    setActiveBottomTab('input');
                  }}
                  className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                    activeBottomTab === 'input'
                      ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  CUSTOM INPUT (STDIN)
                  {customStdin.trim() && (
                    <span className="text-[10px] text-amber-400">● Active</span>
                  )}
                </button>

                {studioMode === 'practice' && (
                  <button
                    onClick={() => {
                      soundFX.click();
                      setActiveBottomTab('tests');
                    }}
                    className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                      activeBottomTab === 'tests'
                        ? 'bg-slate-800 text-emerald-300 font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    TEST CASES
                    {submissionResult && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                        {submissionResult.score}%
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    soundFX.click();
                    setActiveBottomTab('console');
                  }}
                  className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                    activeBottomTab === 'console'
                      ? 'bg-slate-800 text-slate-200 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  RAW CONSOLE
                </button>
              </div>

              {/* Execution Metrics (Time, Exit Code) */}
              {executionResult && (
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>
                    Time: <strong className="text-cyan-300">{executionResult.executionTime}s</strong>
                  </span>
                  <span>
                    Exit: <strong className={executionResult.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'}>{executionResult.exitCode}</strong>
                  </span>
                  {executionResult.memoryMb && (
                    <span>
                      Mem: <strong className="text-slate-300">{executionResult.memoryMb} MB</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
              {/* 1. OUTPUT TAB */}
              {activeBottomTab === 'output' && (
                <div className="h-full">
                  {isExecuting ? (
                    <div className="flex items-center gap-3 text-cyan-400 py-6 px-4">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span className="animate-pulse">
                        Executing {languages.find((l) => l.id === selectedLanguage)?.name || selectedLanguage} in sandbox runtime...
                      </span>
                    </div>
                  ) : studioMode === 'sql' && sqlResult ? (
                    <div>
                      {sqlResult.error ? (
                        <div className="text-rose-400 p-2 rounded bg-rose-950/30 border border-rose-800/40 whitespace-pre-wrap">
                          {sqlResult.error}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-emerald-400 text-[11px]">
                            ✓ Query executed in {sqlResult.executionTimeMs}ms • {sqlResult.rowCount} rows returned
                          </div>
                          <div className="overflow-x-auto border border-slate-800 rounded">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-900 border-b border-slate-800 text-cyan-300">
                                  {sqlResult.columns.map((col, idx) => (
                                    <th key={idx} className="p-2 border-r border-slate-800 font-bold">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sqlResult.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="border-b border-slate-800/50 hover:bg-slate-900/40">
                                    {row.map((val, cIdx) => (
                                      <td key={cIdx} className="p-2 border-r border-slate-800/50 text-slate-300">
                                        {val !== null ? String(val) : 'NULL'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : executionResult ? (
                    <div>
                      {executionResult.stdout ? (
                        <pre className="text-emerald-300 leading-relaxed whitespace-pre-wrap selection:bg-emerald-900 selection:text-emerald-100">
                          {executionResult.stdout}
                        </pre>
                      ) : executionResult.status === 'success' ? (
                        <span className="text-slate-500 italic">Program executed successfully (no stdout produced).</span>
                      ) : null}

                      {executionResult.stderr && (
                        <div className="mt-2 p-2.5 rounded bg-rose-950/40 border border-rose-800/50 text-rose-300 whitespace-pre-wrap">
                          {executionResult.stderr}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center justify-center h-full gap-2">
                      <Terminal className="w-6 h-6 text-slate-600" />
                      <span>Click ▶ RUN or press Ctrl+Enter to execute program in sandbox.</span>
                    </div>
                  )}
                </div>
              )}

              {/* 2. ERRORS TAB (Structured with Line Jump) */}
              {activeBottomTab === 'errors' && (
                <div className="h-full">
                  {executionResult?.stderr ? (
                    <div className="space-y-3">
                      {executionResult.lineError && (
                        <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-600 flex items-start justify-between gap-3 shadow-lg">
                          <div>
                            <div className="flex items-center gap-2 font-bold text-rose-300">
                              <AlertCircle className="w-4 h-4 text-rose-400" />
                              <span>{executionResult.lineError.type || 'Compiler / Runtime Error'}</span>
                              <span className="px-2 py-0.5 rounded bg-rose-900 text-rose-200 text-[10px]">
                                Line {executionResult.lineError.line}
                              </span>
                            </div>
                            <p className="mt-1 text-slate-200 text-xs">{executionResult.lineError.message}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleJumpToLine(executionResult.lineError!.line)}
                              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 transition-all"
                            >
                              Jump to Line {executionResult.lineError.line}
                            </button>
                            <button
                              onClick={handleRequestAiFix}
                              className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              JARVIS Auto-Fix
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-rose-400 whitespace-pre-wrap leading-relaxed">
                        {executionResult.stderr}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center justify-center h-full gap-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <span className="text-slate-400">No compiler or runtime errors reported.</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3. CUSTOM INPUT TAB (Stdin) */}
              {activeBottomTab === 'input' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2 text-slate-400 text-[11px]">
                    <span>Enter custom input stream passed to stdin (e.g. `input()` or `cin &gt;&gt;` or `Scanner`):</span>
                    <button
                      onClick={() => setCustomStdin('5\n10\n')}
                      className="text-cyan-400 hover:underline"
                    >
                      Insert Sample [5, 10]
                    </button>
                  </div>
                  <textarea
                    value={customStdin}
                    onChange={(e) => setCustomStdin(e.target.value)}
                    placeholder="Enter input values on separate lines..."
                    className="flex-1 w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-amber-200 font-mono text-xs focus:outline-none focus:border-cyan-600 resize-none"
                  />
                </div>
              )}

              {/* 4. RAW CONSOLE TAB */}
              {activeBottomTab === 'console' && (
                <pre className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {terminalOutput ||
                    `[JARVIS COMPILER CORE]\nSandbox initialized.\nRuntime: ${selectedLanguage}\nIsolation: Active container namespace\nMax Execution Timeout: 6500ms\nReady.`}
                </pre>
              )}

              {/* 5. PRACTICE TEST CASES TAB */}
              {activeBottomTab === 'tests' && submissionResult && (
                <div className="space-y-3">
                  {/* Score Summary Banner */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                          submissionResult.score === 100
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                            : submissionResult.score >= 50
                            ? 'bg-amber-950 text-amber-400 border border-amber-600'
                            : 'bg-rose-950 text-rose-400 border border-rose-600'
                        }`}
                      >
                        {submissionResult.score}%
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 text-sm">
                          Passed {submissionResult.passed} / {submissionResult.totalTests} Test Cases
                        </div>
                        <div className="text-slate-400 text-xs font-mono">
                          Duration: {submissionResult.executionTime}s • Memory: {submissionResult.memoryMb} MB
                        </div>
                      </div>
                    </div>
                    <div className="text-right max-w-md text-xs text-cyan-300">
                      <p>{submissionResult.jarvisFeedback}</p>
                      {submissionResult.tamilFeedback && (
                        <p className="mt-1 text-cyan-400/80 text-[11px]">{submissionResult.tamilFeedback}</p>
                      )}
                    </div>
                  </div>

                  {/* Test Cases Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {submissionResult.testResults.map((tr) => (
                      <div
                        key={tr.id}
                        className={`p-2.5 rounded-lg border text-xs font-mono ${
                          tr.passed
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                            : 'bg-rose-950/30 border-rose-800/50 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">
                            Test #{tr.id} {tr.isHidden ? '(Private Test)' : ''}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tr.passed ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {tr.passed ? '✓ PASSED' : '✕ FAILED'}
                          </span>
                        </div>
                        {!tr.isHidden && (
                          <div className="text-[11px] text-slate-400 space-y-0.5">
                            <div>Input: <span className="text-amber-300">{tr.input || '(empty)'}</span></div>
                            <div>Expected: <span className="text-emerald-400">{tr.expected}</span></div>
                            <div>Output: <span className={tr.passed ? 'text-emerald-400' : 'text-rose-400'}>{tr.actual}</span></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. RIGHT SIDEBAR: INTEGRATED JARVIS AI CODING ASSISTANT */}
        {aiAssistantOpen && (
          <aside className="w-80 lg:w-96 border-l border-cyan-950/70 bg-[#070b16] flex flex-col shrink-0">
            {/* AI Assistant Header */}
            <div className="p-3 border-b border-cyan-950/70 bg-[#090e1c] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-300">JARVIS CODING COPILOT</div>
                  <div className="text-[10px] text-slate-400 font-mono">Neural Context Aware (EN / தமிழ்)</div>
                </div>
              </div>
              <button
                onClick={() => setAiAssistantOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Chips */}
            <div className="p-2 border-b border-slate-800 bg-slate-950/50 flex flex-wrap gap-1.5 text-[11px] font-mono">
              <button
                onClick={() => handleAiAction('explain')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-800 transition-all flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3 text-cyan-400" />
                EXPLAIN CODE
              </button>
              <button
                onClick={() => handleAiAction('error')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-rose-950 hover:text-rose-300 text-slate-300 border border-slate-800 transition-all flex items-center gap-1"
              >
                <Bug className="w-3 h-3 text-rose-400" />
                EXPLAIN ERROR
              </button>
              <button
                onClick={handleRequestAiFix}
                className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 transition-all flex items-center gap-1 font-bold"
              >
                <Wrench className="w-3 h-3 text-cyan-400" />
                FIX THIS (DIFF)
              </button>
              <button
                onClick={() => handleAiAction('tamil')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-cyan-950 text-cyan-200 border border-slate-800 transition-all"
              >
                தமிழில் விளக்கம்
              </button>
              <button
                onClick={() => handleAiAction('optimize')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
              >
                OPTIMIZE
              </button>
              <button
                onClick={() => handleAiAction('tests')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
              >
                GENERATE TESTS
              </button>
            </div>

            {/* AI Proposed Patch Diff (Before / After with Apply/Reject) */}
            {aiPatchDiff && (
              <div className="p-3 border-b border-cyan-800/50 bg-cyan-950/40 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> PROPOSED PATCH DIFF
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleApplyAiPatch}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow"
                    >
                      <Check className="w-3 h-3" /> APPLY
                    </button>
                    <button
                      onClick={handleRejectAiPatch}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                    >
                      REJECT
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300">{aiPatchDiff.explanation}</p>

                {/* Diff Viewer */}
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] max-h-40 overflow-y-auto space-y-1 font-mono">
                  <div className="text-rose-400 bg-rose-950/30 px-1 py-0.5 rounded">
                    <strong>BEFORE:</strong>
                    <pre className="whitespace-pre-wrap">{aiPatchDiff.beforeCode.slice(0, 150)}...</pre>
                  </div>
                  <div className="text-emerald-400 bg-emerald-950/30 px-1 py-0.5 rounded">
                    <strong>AFTER:</strong>
                    <pre className="whitespace-pre-wrap">{aiPatchDiff.afterCode.slice(0, 150)}...</pre>
                  </div>
                </div>
              </div>
            )}

            {/* AI Messages Chat Log */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-3 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                    {msg.tamilText && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 text-cyan-300 text-[11px]">
                        <strong>தமிழ்: </strong> {msg.tamilText}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono p-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>JARVIS neural reasoning active...</span>
                </div>
              )}
            </div>

            {/* AI Prompt Input Bar */}
            <div className="p-2.5 border-t border-slate-800 bg-[#080d1a]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!aiInput.trim() || isAiThinking) return;
                  handleAiAction('explain', aiInput.trim());
                  setAiInput('');
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask JARVIS (e.g. 'Fix error', 'இந்த code explain பண்ணு')..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || isAiThinking}
                  className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-all disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>

      {/* 5. HISTORY & RESTORE MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a0f1e] border border-cyan-800/60 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-cyan-300">Code Version Snapshots</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {versionHistory.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-mono">
                  No snapshots saved yet. Press Ctrl+S to save code versions.
                </div>
              ) : (
                versionHistory.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{ver.label} ({ver.language})</div>
                      <div className="text-slate-500 text-[11px]">Saved at {ver.timestamp}</div>
                    </div>
                    <button
                      onClick={() => {
                        soundFX.success();
                        setCode(ver.code);
                        setSelectedLanguage(ver.language);
                        setShowHistoryModal(false);
                        setSaveToast(`Restored ${ver.label}`);
                      }}
                      className="px-3 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-bold"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0f1e] border border-cyan-800/60 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-cyan-300">Share Code Studio Session</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Your code and selected language are encoded into a safe client reference:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-300 select-all"
              />
              <button
                onClick={() => {
                  soundFX.success();
                  navigator.clipboard.writeText(shareUrl);
                  alert('Share URL copied to clipboard!');
                }}
                className="px-3 py-2 rounded bg-cyan-600 text-slate-950 font-bold text-xs"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. VS CODE-STYLE LANGUAGE SWITCHER PALETTE MODAL */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-14 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-[#090e1c] border border-cyan-500/40 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden max-h-[85vh]">
            {/* Header & Search Bar */}
            <div className="p-4 border-b border-slate-800 bg-[#070b16] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-700/60 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-cyan-300 tracking-wide font-mono flex items-center gap-2">
                      SELECT LANGUAGE MODE
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-400 font-sans">
                        {languages.length} Languages Available
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="hidden sm:inline px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                    ESC to close
                  </kbd>
                  <button
                    onClick={() => setShowLanguageModal(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Filter Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type to filter language (e.g., python, rust, c++, solidity, react, sql, bash)..."
                  value={languageSearchQuery}
                  onChange={(e) => setLanguageSearchQuery(e.target.value)}
                  className="w-full bg-[#050811] border border-cyan-800/60 focus:border-cyan-400 rounded-lg pl-10 pr-10 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner"
                />
                {languageSearchQuery && (
                  <button
                    onClick={() => setLanguageSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'popular', label: '🔥 Popular' },
                  { id: 'systems', label: '⚙️ Systems' },
                  { id: 'web', label: '🌐 Web' },
                  { id: 'data_ai', label: '📊 Data & AI' },
                  { id: 'scripting', label: '📜 Scripting' },
                  { id: 'functional', label: 'λ Functional' },
                  { id: 'mobile', label: '📱 Mobile' },
                  { id: 'markup_config', label: '📄 Markup/Config' },
                  { id: 'enterprise', label: '🏢 Enterprise' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      soundFX.click();
                      setLanguageCategoryFilter(cat.id);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-all ${
                      languageCategoryFilter === cat.id
                        ? 'bg-cyan-600 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {languages
                .filter((lang) => {
                  const q = languageSearchQuery.toLowerCase().trim();
                  const matchesSearch =
                    !q ||
                    lang.name.toLowerCase().includes(q) ||
                    lang.id.toLowerCase().includes(q) ||
                    lang.ext.toLowerCase().includes(q) ||
                    (lang.description && lang.description.toLowerCase().includes(q)) ||
                    (lang.category && lang.category.toLowerCase().includes(q));

                  const matchesCat =
                    languageCategoryFilter === 'all' ||
                    (languageCategoryFilter === 'popular' && lang.popular) ||
                    lang.category === languageCategoryFilter;

                  return matchesSearch && matchesCat;
                })
                .map((lang) => {
                  const isCurrent = selectedLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => {
                        handleSelectLanguage(lang.id);
                        setShowLanguageModal(false);
                      }}
                      className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between group ${
                        isCurrent
                          ? 'bg-cyan-950/70 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500'
                          : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-cyan-700/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-200 font-mono group-hover:text-cyan-300 transition-colors">
                            {lang.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                            .{lang.ext}
                          </span>
                        </div>
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 font-bold bg-cyan-900/60 px-1.5 py-0.5 rounded border border-cyan-700/50">
                            <Check className="w-3 h-3" /> ACTIVE
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                        {lang.description || `${lang.name} programming environment.`}
                      </p>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                        <span className="capitalize">{lang.category || 'General'}</span>
                        <span className="text-slate-400">{lang.version || 'v1.0'}</span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Footer Summary */}
            <div className="p-3 border-t border-slate-800 bg-[#070a14] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>
                Showing{' '}
                <strong className="text-cyan-300">
                  {
                    languages.filter((lang) => {
                      const q = languageSearchQuery.toLowerCase().trim();
                      const matchesSearch =
                        !q ||
                        lang.name.toLowerCase().includes(q) ||
                        lang.id.toLowerCase().includes(q) ||
                        lang.ext.toLowerCase().includes(q);
                      const matchesCat =
                        languageCategoryFilter === 'all' ||
                        (languageCategoryFilter === 'popular' && lang.popular) ||
                        lang.category === languageCategoryFilter;
                      return matchesSearch && matchesCat;
                    }).length
                  }
                </strong>{' '}
                of {languages.length} languages
              </span>
              <span className="text-slate-500 hidden sm:inline">
                Click any language to load editor template and configure runtime
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
