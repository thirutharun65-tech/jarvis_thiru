// Fast Intent Router for JARVIS THIRU (Zero-latency intent resolution)
import { IntentCategory, IntentResult, LanguageMode } from '../types';

export function detectLanguage(text: string): LanguageMode {
  // Check for Tamil Unicode range
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'TA';
  }
  // Check for common Tanglish markers
  const tanglishPatterns = /\b(panren|pannu|pannunga|sollu|sollunga|irukku|enna|eppadi|engae|indha|andha|paaru|edu|kudu|podu|vai|thira|kelu|pesu|la|ku|oda|aachu|romba|seri|aam)\b/i;
  if (tanglishPatterns.test(text)) {
    return 'TANGLISH';
  }
  return 'EN';
}

export function classifyFastIntent(rawText: string): IntentResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const lang = detectLanguage(text);

  // Strip wake words if present
  const cleaned = lower
    .replace(/^(jarvis|ஜார்விஸ்|hey jarvis|hi jarvis|ok jarvis)[,\s]*/i, '')
    .trim();

  // 1. SCREENSHOT
  if (
    /^(take\s+(a\s+)?screenshot|screenshot\s*(edukkavum|edu|pannu)?|capture\s+(the\s+)?screen|திரைப்பிடிப்பு\s*எடு)/i.test(cleaned) ||
    cleaned === 'screenshot' ||
    cleaned === 'ஸ்கிரீன்ஷாட்'
  ) {
    return {
      category: 'SCREENSHOT',
      intent: 'capture_screenshot',
      confidence: 0.99,
      suggestedAction: 'Capturing screen and saving to workspace.',
      languageDetected: lang,
      directExecution: true,
    };
  }

  // 2. SYSTEM STATUS / CPU / RAM / BATTERY / HARDWARE
  if (
    /\b(cpu\s*usage|ram\s*usage|memory\s*usage|system\s*(status|info|stats)|pc\s*status|battery|hardware\s*stats|how\s*is\s*my\s*pc|computer\s*health)\b/i.test(cleaned) ||
    /\b(சிஸ்டம்\s*நிலை|சிபியூ\s*பயன்பாடு|மெமரி|பேட்டரி)\b/i.test(cleaned) ||
    /\b(cpu\s*eppadi\s*irukku|system\s*speed|ram\s*evvalavu)\b/i.test(cleaned)
  ) {
    return {
      category: 'SYSTEM',
      intent: 'get_system_status',
      confidence: 0.98,
      suggestedAction: 'Fetching live CPU, RAM, Disk, and hardware telemetry.',
      languageDetected: lang,
      directExecution: true,
    };
  }

  // 3. LOCK / SHUTDOWN / RESTART
  if (/\b(lock\s*(pc|computer|screen|workstation)?|லாக்\s*செய்)\b/i.test(cleaned)) {
    return {
      category: 'SYSTEM',
      intent: 'lock_workstation',
      confidence: 0.98,
      suggestedAction: 'Locking workstation securely.',
      languageDetected: lang,
      directExecution: true,
    };
  }

  if (/\b(shutdown|power\s*off|turn\s*off\s*computer|கணினியை\s*நிறுத்து)\b/i.test(cleaned)) {
    return {
      category: 'SYSTEM',
      intent: 'request_shutdown',
      confidence: 0.95,
      suggestedAction: 'Requesting confirmation to shutdown computer.',
      languageDetected: lang,
      directExecution: false, // requires confirmation
    };
  }

  if (/\b(restart\s*(pc|computer)?|reboot)\b/i.test(cleaned)) {
    return {
      category: 'SYSTEM',
      intent: 'request_restart',
      confidence: 0.95,
      suggestedAction: 'Requesting confirmation to reboot system.',
      languageDetected: lang,
      directExecution: false, // requires confirmation
    };
  }

  // 4. VOLUME CONTROL
  const volMatch = cleaned.match(/\b(set\s*volume|volume|சத்தம்)\s*(to|at|ai)?\s*(\d{1,3})%?\b/i);
  if (volMatch) {
    const level = parseInt(volMatch[3], 10);
    return {
      category: 'SYSTEM',
      intent: 'set_volume',
      target: String(Math.min(100, Math.max(0, level))),
      confidence: 0.98,
      parameters: { level },
      suggestedAction: `Adjusting audio volume to ${level}%.`,
      languageDetected: lang,
      directExecution: true,
    };
  }

  // 5. APPLICATION LAUNCHING (Chrome, VS Code, Notepad, Terminal, Calculator, Edge, Explorer, etc.)
  const appMatch = cleaned.match(
    /\b(open|launch|start|run|திற)\s+(google\s+chrome|chrome|vs\s*code|vscode|visual\s*studio\s*code|notepad|calculator|calc|terminal|powershell|cmd|file\s*explorer|explorer|downloads|documents|spotify|firefox|edge|word|excel|github|browser)\b/i
  ) || cleaned.match(
    /\b(google\s+chrome|chrome|vs\s*code|vscode|notepad|calculator|calc|terminal|powershell|cmd|explorer|downloads)\s+(open\s*pannu|thira|launch\s*pannu|run\s*pannu)\b/i
  );

  if (appMatch) {
    const appRaw = (appMatch[1] === 'open' || appMatch[1] === 'launch' || appMatch[1] === 'start' || appMatch[1] === 'run' || appMatch[1] === 'திற')
      ? appMatch[2]
      : appMatch[1];
    
    let normalizedApp = appRaw.toLowerCase().trim();
    if (normalizedApp.includes('chrome')) normalizedApp = 'Chrome';
    else if (normalizedApp.includes('code') || normalizedApp.includes('vscode')) normalizedApp = 'VS Code';
    else if (normalizedApp.includes('note')) normalizedApp = 'Notepad';
    else if (normalizedApp.includes('calc')) normalizedApp = 'Calculator';
    else if (normalizedApp.includes('terminal') || normalizedApp.includes('powershell') || normalizedApp.includes('cmd')) normalizedApp = 'Terminal';
    else if (normalizedApp.includes('explorer') || normalizedApp.includes('downloads') || normalizedApp.includes('documents')) normalizedApp = 'File Explorer';
    else normalizedApp = appRaw;

    return {
      category: 'APP',
      intent: 'launch_app',
      target: normalizedApp,
      confidence: 0.97,
      parameters: { app: normalizedApp },
      suggestedAction: `Launching ${normalizedApp} application.`,
      languageDetected: lang,
      directExecution: true,
    };
  }

  // 6. FOLDER / WORKSPACE
  if (
    /\b(open\s+(downloads|documents|desktop|workspace|project\s*folder|source\s*folder))\b/i.test(cleaned) ||
    /\b(downloads|documents|desktop|workspace)\s*(folder\s*)?(open\s*pannu|thira)\b/i.test(cleaned)
  ) {
    const targetFolder = cleaned.includes('download') ? 'Downloads' : cleaned.includes('document') ? 'Documents' : cleaned.includes('desktop') ? 'Desktop' : 'Workspace';
    return {
      category: 'FOLDER',
      intent: 'open_folder',
      target: targetFolder,
      confidence: 0.96,
      parameters: { folder: targetFolder },
      suggestedAction: `Opening ${targetFolder} directory.`,
      languageDetected: lang,
      directExecution: true,
    };
  }

  // 7. SECURITY LAB (Target locked scans, secret checks, port scans, hashes, encoders)
  if (
    /\b(security\s*lab|scan\s*(localhost|127\.0\.0\.1|target|my\s*lab|port|ports)|port\s*scan|secret\s*scan|cve\s*check|vulnerability\s*scan|hash\s*(file|text)|base64\s*(encode|decode))\b/i.test(cleaned) ||
    /\b(செக்யூரிட்டி\s*லேப்|போர்ட்\s*ஸ்கேன்|ஹாஷ்)\b/i.test(cleaned) ||
    /\b(security\s*lab\s*open\s*pannu|localhost\s*scan\s*pannu|ports\s*check\s*pannu)\b/i.test(cleaned)
  ) {
    let subIntent = 'open_security_lab';
    if (/port\s*scan|scan\s*ports/i.test(cleaned)) subIntent = 'port_scan';
    else if (/vulnerability|vuln|cve|source/i.test(cleaned)) subIntent = 'vuln_scan';
    else if (/secret|credential|token/i.test(cleaned)) subIntent = 'secret_scan';
    else if (/hash/i.test(cleaned)) subIntent = 'hash_tool';

    return {
      category: 'SECURITY_LAB',
      intent: subIntent,
      target: '127.0.0.1 (Local Lab Target Locked)',
      confidence: 0.96,
      suggestedAction: 'Running authorized security lab diagnostics on locked local target.',
      languageDetected: lang,
      directExecution: true,
    };
  }

  // 8. PROJECT / CODING / BUG FIXING / CODE GENERATION
  if (
    /\b(create|build|generate|make)\s+(a\s+)?(python|java|react|node|javascript|typescript|c\+\+|html|web|dashboard|api|calculator|app|project|website)\b/i.test(cleaned) ||
    /\b(புது\s*(ப்ராஜெக்ட்|கோடிங்)|பைதான்\s*உருவாக்கு)\b/i.test(cleaned) ||
    /\b(project\s*create\s*pannu|python\s*project\s*pannu|react\s*website\s*panna)\b/i.test(cleaned)
  ) {
    const langMatch = cleaned.match(/\b(python|java|react|node|javascript|typescript|c\+\+|html|php|sql|django|flask)\b/i);
    const projType = langMatch ? langMatch[1].toLowerCase() : 'python';
    return {
      category: 'PROJECT',
      intent: 'create_project',
      target: projType,
      confidence: 0.94,
      parameters: { language: projType, fullPrompt: rawText },
      suggestedAction: `Autonomous project generation: scaffolding ${projType} project.`,
      languageDetected: lang,
      directExecution: true,
    };
  }

  if (
    /\b(run\s+(this\s+)?project|run\s+(this\s+)?code|execute\s+project|start\s+(the\s+)?server|run\s+tests)\b/i.test(cleaned) ||
    /\b(ப்ராஜெக்ட்\s*இயக்கு|ரன்\s*செய்)\b/i.test(cleaned) ||
    /\b(indha\s*project\s*run\s*pannu|code\s*run\s*pannu|server\s*start\s*pannu)\b/i.test(cleaned)
  ) {
    return {
      category: 'PROJECT',
      intent: 'run_project',
      confidence: 0.96,
      suggestedAction: 'Executing active project in workspace terminal.',
      languageDetected: lang,
      directExecution: true,
    };
  }

  if (
    /\b(find\s+(the\s+)?(error|bug)|fix\s+(this\s+)?(error|bug|all\s*errors)|debug\s+(this\s+)?(code|project)|syntax\s*check)\b/i.test(cleaned) ||
    /\b(பிழை\s*திருத்து|பக்\s*ஃபிக்ஸ்)\b/i.test(cleaned) ||
    /\b(error\s*fix\s*pannu|bug\s*find\s*pannu|error\s*enna\s*nu\s*paaru)\b/i.test(cleaned)
  ) {
    return {
      category: 'CODE',
      intent: 'fix_error',
      confidence: 0.95,
      parameters: { prompt: rawText },
      suggestedAction: 'Inspecting source files, identifying root cause, and applying verified patch.',
      languageDetected: lang,
      directExecution: true,
    };
  }

  if (
    /\b(analyze\s+(this\s+)?project|inspect\s+(this\s+)?project|explain\s+(this\s+)?(code|project)|search\s+for\s+bugs)\b/i.test(cleaned) ||
    /\b(indha\s*code\s*explain\s*pannu|project\s*analyze\s*pannu)\b/i.test(cleaned)
  ) {
    return {
      category: 'PROJECT',
      intent: 'analyze_project',
      confidence: 0.94,
      parameters: { prompt: rawText },
      suggestedAction: 'Performing architectural analysis of project structure and dependencies.',
      languageDetected: lang,
      directExecution: true,
    };
  }

  // 9. TERMINAL
  if (
    /^(terminal|cmd|powershell|run\s*command|exec)\s*:\s*(.+)/i.test(cleaned) ||
    /^(git\s+(status|diff|log|commit|push|pull|branch|checkout|add))/i.test(cleaned) ||
    /^(npm\s+(install|start|build|test|run))/i.test(cleaned) ||
    /^(pip\s+(install|list|freeze))/i.test(cleaned) ||
    /^(python\s+\S+\.py)/i.test(cleaned)
  ) {
    return {
      category: 'TERMINAL',
      intent: 'execute_command',
      target: cleaned,
      confidence: 0.96,
      parameters: { command: cleaned },
      suggestedAction: `Executing terminal command: ${cleaned}`,
      languageDetected: lang,
      directExecution: true,
    };
  }

  // 10. EDUCATION / CONCEPT EXPLANATION
  if (
    /\b(explain|what\s+is|how\s+does|teach\s+me|learn|dsa|linked\s*list|binary\s*tree|recursion|operating\s*system|dbms|normalization|tcp\/ip|osi\s*model)\b/i.test(cleaned) ||
    /\b(விளக்கு|கற்றுக்கொடு|என்னவென்று\s*சொல்)\b/i.test(cleaned) ||
    /\b(explain\s*pannu|sollikudu|solli\s*kodu|puriyala)\b/i.test(cleaned)
  ) {
    return {
      category: 'EDUCATION',
      intent: 'explain_concept',
      confidence: 0.92,
      parameters: { topic: cleaned },
      suggestedAction: 'Accessing structured education library & interactive code simulator.',
      languageDetected: lang,
      directExecution: false, // AI reasoning / structured module
    };
  }

  // 11. LANGUAGE SWITCH COMMANDS
  if (
    /\b(speak\s*tamil|தமிழில்\s*பேசு|தமிழ்\s*பேசு|tamil-la\s*pesu|switch\s*to\s*tamil)\b/i.test(cleaned)
  ) {
    return {
      category: 'VOICE',
      intent: 'switch_language',
      target: 'TA',
      confidence: 0.99,
      suggestedAction: 'Switching voice and UI language to Tamil (தமிழ்).',
      languageDetected: 'TA',
      directExecution: true,
    };
  }

  if (
    /\b(speak\s*english|english-la\s*pesu|switch\s*to\s*english|ஆங்கிலத்தில்\s*பேசு)\b/i.test(cleaned)
  ) {
    return {
      category: 'VOICE',
      intent: 'switch_language',
      target: 'EN',
      confidence: 0.99,
      suggestedAction: 'Switching voice and UI language to English.',
      languageDetected: 'EN',
      directExecution: true,
    };
  }

  if (
    /\b(speak\s*tanglish|tanglish-la\s*pesu|switch\s*to\s*tanglish)\b/i.test(cleaned)
  ) {
    return {
      category: 'VOICE',
      intent: 'switch_language',
      target: 'TANGLISH',
      confidence: 0.99,
      suggestedAction: 'Switching voice and UI language to Tanglish.',
      languageDetected: 'TANGLISH',
      directExecution: true,
    };
  }

  // 12. GENERAL CONVERSATION / COMPLEX REASONING (Route to Ollama / AI)
  return {
    category: 'CONVERSATION',
    intent: 'chat',
    confidence: 0.85,
    suggestedAction: 'Routing to Local Ollama neural model with JARVIS persona.',
    languageDetected: lang,
    directExecution: false,
  };
}

// Generate Iron Man style concise response based on intent and language
export function getJarvisSpokenAck(
  result: IntentResult,
  lang: LanguageMode = 'AUTO',
  userName: string = 'Sir'
): string {
  const effectiveLang = lang === 'AUTO' ? (result.languageDetected || 'EN') : lang;

  if (effectiveLang === 'TA') {
    switch (result.category) {
      case 'APP':
        return `நிச்சயமாக ஐயா. ${result.target || 'செயலியை'} திறக்கிறேன்.`;
      case 'SYSTEM':
        if (result.intent === 'get_system_status') return `சிஸ்டம் நிலையை சரிபார்க்கிறேன் ஐயா.`;
        if (result.intent === 'lock_workstation') return `கணினியை லாக் செய்கிறேன்.`;
        return `செயல்முறை தொடங்கப்படுகிறது.`;
      case 'SCREENSHOT':
        return `திரைப்பிடிப்பு எடுக்கப்பட்டது ஐயா.`;
      case 'PROJECT':
        if (result.intent === 'create_project') return `ப்ராஜெக்ட் உருவாக்கப்படுகிறது.`;
        if (result.intent === 'run_project') return `ப்ராஜெக்ட்டை இயக்குகிறேன்.`;
        return `ப்ராஜெக்ட் ஆய்வு செய்யப்படுகிறது.`;
      case 'CODE':
        return `குறியீட்டை ஆய்வு செய்து பிழையை சரிசெய்கிறேன்.`;
      case 'SECURITY_LAB':
        return `பாதுகாப்பு ஆய்வக ஸ்கேன் தொடங்கப்படுகிறது.`;
      case 'VOICE':
        return `சரி ஐயா. இனி தமிழில் உரையாடுவோம்.`;
      default:
        return `கேட்டறிந்து செயல்படுத்துகிறேன்.`;
    }
  }

  if (effectiveLang === 'TANGLISH') {
    switch (result.category) {
      case 'APP':
        return `Sure bro. ${result.target || 'App'} open panren.`;
      case 'SYSTEM':
        if (result.intent === 'get_system_status') return `System health check panren bro.`;
        if (result.intent === 'lock_workstation') return `PC lock panren.`;
        return `System command execute panren.`;
      case 'SCREENSHOT':
        return `Screenshot capture pannitten bro.`;
      case 'PROJECT':
        if (result.intent === 'create_project') return `Sure bro, pudhu project structure create panren.`;
        if (result.intent === 'run_project') return `Active project inspect pannitu run panren.`;
        return `Project analyze panren bro.`;
      case 'CODE':
        return `Sure bro. Code inspect pannitu error fix panren.`;
      case 'SECURITY_LAB':
        return `Local security lab lock pannitu scan start panren.`;
      case 'VOICE':
        return `Seri bro! Tanglish-la pesalam.`;
      default:
        return `Right bro. Processing...`;
    }
  }

  // English (Default)
  switch (result.category) {
    case 'APP':
      return `Certainly ${userName}. Opening ${result.target || 'application'}.`;
    case 'SYSTEM':
      if (result.intent === 'get_system_status') return `Accessing system telemetry, ${userName}.`;
      if (result.intent === 'lock_workstation') return `Securing workstation.`;
      if (result.intent === 'set_volume') return `Volume adjusted to ${result.target} percent.`;
      return `Executing system directive.`;
    case 'SCREENSHOT':
      return `Screen captured and saved to workspace, ${userName}.`;
    case 'FOLDER':
      return `Opening ${result.target || 'folder'}.`;
    case 'PROJECT':
      if (result.intent === 'create_project') return `Initiating project scaffold for ${result.target}.`;
      if (result.intent === 'run_project') return `Compiling and launching project in workspace.`;
      return `Analyzing project architecture.`;
    case 'CODE':
      return `Analyzing traceback. Locating root cause and preparing patch.`;
    case 'TERMINAL':
      return `Executing terminal directive.`;
    case 'SECURITY_LAB':
      return `Authorized target locked. Initiating security inspection.`;
    case 'VOICE':
      return `Voice preference updated. Systems online.`;
    default:
      return `Processing directive, ${userName}.`;
  }
}
