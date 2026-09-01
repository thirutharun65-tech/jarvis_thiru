# SPEC: JARVIS THIRU — Cleaned, Actionable Project Specification

Goal
- Build a real personal AI assistant (JARVIS THIRU) that behaves like a human-like assistant and can perform real actions on the user's local Windows machine through a local agent. No fakes, no placeholders.

Core principles
- Natural conversation: Understand free-form language in English, Tamil, and Tanglish; respond naturally in the user’s language.
- Context awareness: Maintain short-term conversation context (current project/task) and resolve pronouns like “it”, “that”, “the project”.
- Real actions: Only perform Windows actions via a secure local agent; report real outcomes.
- No fake data: No hardcoded “Connected”/“Done” statuses or fabricated results.
- Fast common commands: Handle quick OS commands with minimal latency using intent detection + tool call pipeline.
- Offline-first / local LLM: Default to local Ollama LLM for chat; detect and report model/connection problems.
- Security: Never expose arbitrary shell execution to the public internet. Require local authentication and confirmations for destructive actions.

Primary user scenarios (user stories)
- Natural chat: “Hey Jarvis” → assistant replies naturally.
- Education: “Explain recursion” and “Explain in Tamil”.
- Project creation: “Create a Python calculator” → new project workspace, files created, runnable.
- Iterative dev: “Add GUI”, “Run it”, “It has an error” → JARVIS continues working with same project/context and inspects real error output.
- Windows control: “Open Chrome” → agent launches Chrome and returns real success/failure message.
- System info: “How much RAM am I using?” → return real current values from host.
- Voice: Speech-to-text for commands and text-to-speech responses; support Tamil/English/mixed speech where possible.
- Image analysis: User uploads screenshot; JARVIS explains the error or the code in the image.

Functional requirements (high level)
1. Conversational engine
   - Use local Ollama model for generation and streaming responses.
   - Fallbacks: detect Ollama unavailability and inform user with actionable steps.

2. Context & memory
   - Short-term memory per session: keep projects, recent files, last-run output.
   - Allow user to “switch” or “explicitly set” current project.

3. Intent detection and routing
   - Quick intents (open app, show CPU, screenshot) should be detected and routed to local-agent APIs directly.
   - Complex requests (create project, explain code) go to the chat/assistant flow.

4. Local Windows agent
   - Secure, local-only agent (runs on user machine) to execute permitted actions (open app, run code, system stats, screenshot, file operations).
   - Agent must return structured results, exit codes, stdout/stderr, timings.

5. Voice support
   - Microphone input (STT) and TTS support; ability to interrupt/cancel speech.
   - Provide “stop speech” and “stop current task” controls.

6. Code Studio / Projects
   - Empty workspace initially.
   - Ability to create, edit, run, display stdout/stderr for code.
   - “Project mode”: plan → create files → run → test → fix → verify.

7. Diagnostics
   - Diagnostics page showing status of Python, Node.js, Git, Ollama, microphone, speaker, local agent, model presence.

8. Security & permissions
   - Explicit user confirmation for destructive operations.
   - Agent must authenticate local requests (e.g., token stored locally).
   - No public arbitrary shell endpoints. No unauthenticated remote control.

Non-functional requirements
- Streaming responses: UI displays progressively as model streams tokens.
- Low latency for fast commands.
- Robust cancellation (AI generation, voice, running processes).
- Cross-language support for Tamil/Tanglish (support for multilingual STT, TTS, and generation).
- Accessibility: keyboard and screen-reader friendly where possible.

Acceptance criteria (examples)
- Opening Chrome: when user asks to open Chrome, JARVIS sends a command to the local agent and replies only after the agent confirms; success message must reflect actual result. If Chrome not found, return a helpful error and remediation steps.
- Create and run Python project: “Create a Python calculator” results in a new folder with runnable python files, a README, tests (if requested), and a successful run shows real stdout in the UI.
- Ollama connectivity: If Ollama not running or model missing, UI shows “OLLAMA DISCONNECTED” and offers steps: start Ollama, install model, check endpoint.
- Voice stop: If JARVIS is speaking, pressing stop immediately silences output and cancels any cancellable task.
- System monitor: “How much RAM am I using?” returns current host values, not estimates.

Architecture (high-level)
- Frontend (Electron or Web UI + local bridge)
  - Chat UI with streaming support
  - Voice controls (mic, TTS)
  - Code Studio pane (editor, run, output)
  - Diagnostics & Tasks dashboard

- Local Agent (Windows service / daemon)
  - HTTP/IPC endpoint bound to localhost only
  - Authentication (local token or OS-level authentication)
  - Action handlers: process spawn, app launcher, system stats, screenshot, file operations (limited to workspace)
  - Safe sandboxing for code execution / confirm destructive actions

- Ollama (local LLM)
  - Check availability, model installed, stream inference
  - Fallbacks: show error and suggested fixes when unavailable

- Backend (optional)
  - If needed for remote UI hosting (Vercel for frontend), ensure only UI is remote; Windows agent remains local for actions. No remote arbitrary command execution.

Local agent API (suggested minimal endpoints)
- POST /api/launch
  - body: { command: "chrome", args: [...], cwd?: string }
  - returns: { success: boolean, pid?: number, stdout?: string, stderr?: string, detail?: string }

- POST /api/run (for running code)
  - body: { language: "python", scriptPath: "path", args: [...], timeoutMs?: number }
  - returns: { exitCode, stdout, stderr, durationMs }

- GET /api/stats
  - returns: { cpuPercent, ramUsedBytes, ramTotalBytes, processes: [{pid,name,cpu,mem}], timestamp }

- POST /api/screenshot
  - returns: { success, path, url? }

- POST /api/file/read
  - body: { path }
  - returns: { content, encoding }

- POST /api/confirm
  - For destructive actions: request confirmation and return result.

Authentication & security
- Local agent listens only on localhost or named pipe.
- Use a locally generated token or OS-level authentication to authorize UI requests.
- Confirm destructive actions with explicit user interaction.
- Log actions locally, with an option to clear logs.

Voice & STT/TTS considerations
- Use local or user-configured STT engines that support Tamil and mixed speech (e.g., VOSK or cloud if user consents).
- TTS should be cancellable; stream audio.
- Provide user settings for voice language and voice model.

Diagnostics & self-healing
- Diagnostics page with one-click “retry” for failed components (e.g., restart Ollama, reinstall model instructions, reconnect local agent).
- On failures, provide exact cause and actionable steps (e.g., port in use, model not installed).

Privacy & safety
- Default data locality: everything sensitive stays local (projects, system data).
- If telemetry or optional cloud features are implemented, require explicit opt-in.

MVP (minimum viable product) — prioritized
1. Core chat using local Ollama with streaming and Tamil/English simple support.
2. Local agent basic actions: open app, shell run with stdout/stderr, get CPU/RAM, screenshot.
3. Intent detection for fast Windows commands.
4. Project workspace: create/run Python script with visible stdout/stderr.
5. Diagnostics page that checks Ollama & local agent and reports status.
6. Voice input/TTS basic support (optional in MVP but strongly desired).
Acceptance for MVP: all actions must be real and verified by the local agent.

Roadmap & milestones (example)
- Milestone 0 — Repo scaffolding: empty frontend, local-agent skeleton, README, environment setup docs.
- Milestone 1 — Ollama connectivity + chat streaming: connect, check model, stream tokens.
- Milestone 2 — Local agent primitives: launch app, run commands, get stats.
- Milestone 3 — Intent router + quick commands UX.
- Milestone 4 — Projects & Code Studio (create/run Python project).
- Milestone 5 — Voice support & cancellation controls.
- Milestone 6 — Diagnostics, security hardening, acceptance tests.

Implementation checklist (developer-friendly)
- [ ] Create SPEC.md in repo (this file).
- [ ] Add CONTRIBUTING.md and development setup scripts.
- [ ] Implement local-agent prototype (HTTP server on localhost with auth token).
- [ ] Implement frontend: chat UI with streaming socket to Ollama.
- [ ] Implement quick-intent classifier (small rules + fallback to model).
- [ ] Implement project workspace manager (create, run, open file).
- [ ] Implement run sandbox for Python with safe limits and timeouts.
- [ ] Add diagnostics page showing component states.
- [ ] Add TTS/STT integration and “stop” button.
- [ ] Write end-to-end tests for sample flows (open app, create project, run script).
- [ ] Security audit: ensure no public endpoints or remote shell exposure.

Developer notes & best practices
- Stream model tokens to UI; allow cancellation.
- Distinguish between “question” and “command” using intent classifier.
- Keep workspace and file actions confined to a configurable workspace root (user selects).
- Avoid autos-executing any requests; always confirm before destructive changes.
- Provide transparent logs for actions run by the agent.

User-facing language & personality guidance
- Use friendly, natural language. Examples: “Sure bro, Chrome open panren.” or “Chrome open panna mudila bro — Chrome detect aagala.”
- Don’t overuse “bro.” Use sparingly and adapt to user tone.
- Always be truthful about the system state (e.g., “Ollama connect aagala bro — model missing. To fix: …”)

Example UI phrases
- On success: “Chrome open panniten bro.”
- On failure: “Chrome open panna mudila bro. Chrome detect aagala.”
- On missing model: “Ollama running illa or model illa. Start Ollama or install model X. Shall I show instructions?”

Testing & verification
- E2E tests that run on a Windows test machine with the agent installed.
- Testcases:
  - “Open Chrome” -> verify Chrome actually launched (PID + window).
  - Create and run python calculator -> verify file contents + stdout.
  - Ollama unavailable -> UI shows clear error and instructions.
  - Voice stop -> stops TTS and cancels running task.

Appendix: Short checklist for the repo right now
- Add SPEC.md (this file).
- Add run/local-agent dev readme: how to start agent, where to get token.
- Add minimal example: “hello” action that opens Notepad (for initial test).
- Add diagnostics endpoint usage docs.

---

If you want, I can now:
- Open a pull request from spec/clean-spec into the default branch.
- Split the checklist into GitHub issues and create them for you.
- Add scaffolding files (README.md, frontend and local-agent minimal skeletons).

Tell me which next step you want and I’ll continue.