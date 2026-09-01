export type JarvisState =
  | 'IDLE'
  | 'LISTENING'
  | 'UNDERSTANDING'
  | 'THINKING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'COMPLETE'
  | 'ERROR';

export type LanguageMode = 'AUTO' | 'EN' | 'TA' | 'TANGLISH';

export type IntentCategory =
  | 'APP'
  | 'SYSTEM'
  | 'FILE'
  | 'FOLDER'
  | 'SCREENSHOT'
  | 'VOICE'
  | 'PROJECT'
  | 'CODE'
  | 'TERMINAL'
  | 'EDUCATION'
  | 'SECURITY_LAB'
  | 'CONVERSATION';

export type PermissionLevel = 'READ_ONLY' | 'NORMAL' | 'CONFIRM' | 'RESTRICTED';

export interface IntentResult {
  category: IntentCategory;
  intent: string;
  target?: string | null;
  confidence: number;
  parameters?: Record<string, any>;
  suggestedAction?: string;
  languageDetected?: LanguageMode;
  directExecution: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'system';
  text: string;
  tamilText?: string;
  timestamp: string;
  category?: IntentCategory;
  intent?: string;
  status?: 'pending' | 'executing' | 'success' | 'failed';
  data?: any;
  taskSteps?: TaskStep[];
  executionTimeMs?: number;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  content?: string;
}

export interface TaskStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  durationMs?: number;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  category: IntentCategory;
  status: 'QUEUED' | 'PLANNING' | 'EXECUTING' | 'VERIFYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  steps: TaskStep[];
  startedAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

export interface SystemStats {
  cpuUsage: number;
  cpuFrequencyGhz?: number;
  ramUsage: number;
  ramUsedGb: number;
  ramTotalGb: number;
  diskUsage: number;
  diskUsedGb: number;
  diskTotalGb: number;
  batteryPercent: number | null;
  isCharging: boolean | null;
  networkUpKbps: number;
  networkDownKbps: number;
  uptimeSeconds: number;
  osName: string;
  osVersion: string;
  pythonVersion: string;
  hostname: string;
  activeProcesses: ProcessInfo[];
  currentTime: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMb: number;
  status?: string;
}

export interface AppRegistryItem {
  id: string;
  name: string;
  category: string;
  executable: string;
  iconName: string;
  installed: boolean;
  customPath?: string;
}

export interface ProjectFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  content?: string;
  language?: string;
  children?: ProjectFile[];
}

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  language: string;
  framework?: string;
  entryPoint?: string;
  description: string;
  files: ProjectFile[];
  dependencies: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  category: string;
  file?: string;
  line?: number;
  codeSnippet?: string;
  description: string;
  remediation: string;
  cwe?: string;
}

export interface SecurityLabScanResult {
  target: string;
  isTargetLocked: boolean;
  scanType: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  startedAt: string;
  finishedAt: string;
  findings: SecurityVulnerability[];
  openPorts?: { port: number; service: string; state: string; banner?: string }[];
  secretsFound?: { type: string; file: string; line: number; snippet: string }[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
}

export interface EducationModule {
  id: string;
  title: string;
  tamilTitle: string;
  category: 'DSA' | 'DBMS' | 'OS' | 'NETWORKS' | 'SOFTWARE_ENG' | 'AI_ML' | 'CYBER_DEFENSE';
  summary: string;
  tamilSummary: string;
  tanglishSummary: string;
  content: string;
  codeSnippets: { language: string; title: string; code: string; output?: string }[];
  practiceProblems: { question: string; tamilQuestion: string; difficulty: 'Easy' | 'Medium' | 'Hard'; hint: string; solution: string }[];
}

export interface SubsystemStatus {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'CHECKING';
  latencyMs?: number;
  details?: string;
  lastChecked: string;
}

export interface AppConfig {
  appName: string;
  version: string;
  userName: string;
  language: LanguageMode;
  voiceEnabled: boolean;
  wakeWordEnabled: boolean;
  wakeWord: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  selectedVoice: string;
  soundEffects: boolean;
  autoSpeak: boolean;
  permissionLevel: PermissionLevel;
  ollamaBaseUrl: string;
  ollamaModel: string;
  localAgentUrl: string;
  localAgentToken: string;
  theme: string;
  workspaceDir: string;
  securityTargetLock: string;
  startWithWindows: boolean;
}

export interface MemoryEntry {
  id: string;
  category: 'conversation' | 'task' | 'error' | 'preference' | 'project';
  summary: string;
  details: string;
  timestamp: string;
  tags: string[];
}

export interface SupportedLanguage {
  id: string;
  name: string;
  version: string;
  ext: string;
  monacoLang: string;
  category?: 'popular' | 'systems' | 'web' | 'data_ai' | 'scripting' | 'functional' | 'markup_config' | 'mobile' | 'enterprise';
  popular?: boolean;
  isAvailable: boolean;
  statusText: string;
  defaultCode: string;
  sampleInput?: string;
  description?: string;
}

export interface CodeExecutionRequest {
  language: string;
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface CodeExecutionResult {
  status: 'success' | 'error' | 'timeout';
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number; // in seconds
  memoryMb?: number;
  lineError?: {
    line: number;
    column?: number;
    message: string;
    type?: string;
    file?: string;
  };
}

export interface PracticeChallenge {
  id: string;
  title: string;
  tamilTitle?: string;
  category: 'Python' | 'Java' | 'C' | 'C++' | 'JavaScript' | 'TypeScript' | 'DSA' | 'SQL' | 'Algorithms';
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  tamilDescription?: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  starterCode: Record<string, string>;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }>;
  hint?: string;
  solutionExplanation?: string;
}

export interface PracticeSubmissionResult {
  score: number; // 0-100
  totalTests: number;
  passed: number;
  failed: number;
  executionTime: number;
  memoryMb: number;
  testResults: Array<{
    id: number;
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    isHidden: boolean;
    error?: string;
  }>;
  jarvisFeedback: string;
  tamilFeedback?: string;
}

export interface SqlQueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
  schema?: Array<{ table: string; columns: string[] }>;
}

export interface CodeVersion {
  id: string;
  timestamp: string;
  language: string;
  code: string;
  label?: string;
}
