import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  Code2,
  Copy,
  Globe,
  HelpCircle,
  Play,
  Sparkles,
  Zap,
} from 'lucide-react';
import { EducationModule, LanguageMode } from '../types';
import { soundFX } from '../lib/audio';

interface EducationPanelProps {
  modules: EducationModule[];
  language: LanguageMode;
  onAskJarvis: (prompt: string) => void;
}

export const EducationPanel: React.FC<EducationPanelProps> = ({
  modules,
  language,
  onAskJarvis,
}) => {
  const [selectedModule, setSelectedModule] = useState<EducationModule | null>(
    modules[0] || null
  );
  const [selectedLanguageTab, setSelectedLanguageTab] = useState<'EN' | 'TA' | 'TANGLISH'>('EN');
  const [activeProblemIdx, setActiveProblemIdx] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div id="jarvis-education-panel" className="max-w-7xl mx-auto p-4 space-y-4 font-mono">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#060c18]/90 border border-amber-500/40 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-400">
            <BookOpen className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-['Orbitron',sans-serif] text-base font-bold text-amber-300">
              JARVIS NEURAL EDUCATION & ENGINEERING ACADEMY
            </h2>
            <p className="text-xs text-amber-400/70">
              DSA &bull; OPERATING SYSTEMS &bull; NETWORKS &bull; DBMS &bull; AI/ML (ENGLISH / தமிழ் / TANGLISH)
            </p>
          </div>
        </div>

        {/* Multi-lingual explanation switcher */}
        <div className="flex items-center bg-[#030712] p-1 rounded-xl border border-amber-500/40 text-xs">
          <button
            onClick={() => setSelectedLanguageTab('EN')}
            className={`px-3 py-1 rounded-lg transition-all ${
              selectedLanguageTab === 'EN' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-slate-400'
            }`}
          >
            ENGLISH
          </button>
          <button
            onClick={() => setSelectedLanguageTab('TA')}
            className={`px-3 py-1 rounded-lg transition-all ${
              selectedLanguageTab === 'TA' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-slate-400'
            }`}
          >
            தமிழ்
          </button>
          <button
            onClick={() => setSelectedLanguageTab('TANGLISH')}
            className={`px-3 py-1 rounded-lg transition-all ${
              selectedLanguageTab === 'TANGLISH' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-slate-400'
            }`}
          >
            TANGLISH
          </button>
        </div>
      </div>

      {/* Main Grid: Modules List (Left) | Detailed Content & Code & Practice (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Topics List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="p-3 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30">
            <h3 className="text-xs font-bold text-cyan-300 mb-2">CURRICULUM TOPICS</h3>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => {
                    setSelectedModule(mod);
                    setActiveProblemIdx(null);
                    setShowSolution(false);
                    soundFX.playBlip();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all ${
                    selectedModule?.id === mod.id
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50 font-bold'
                      : 'bg-[#0a172e] hover:bg-amber-950/30 text-slate-300 border border-cyan-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{selectedLanguageTab === 'TA' ? mod.tamilTitle : mod.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#030712] text-amber-400 border border-amber-500/30">
                      {mod.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Deep Explanation & Interactive Playground */}
        <div className="lg:col-span-8 space-y-4">
          {selectedModule && (
            <>
              {/* Concept Overview Card */}
              <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-300">
                    {selectedLanguageTab === 'TA' ? selectedModule.tamilTitle : selectedModule.title}
                  </h3>
                  <button
                    onClick={() => onAskJarvis(`Explain ${selectedModule.title} with more depth and real-world examples in ${selectedLanguageTab}`)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400 text-cyan-200 text-xs font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    ASK JARVIS MORE
                  </button>
                </div>

                {/* Explanation Text */}
                <div className="p-3.5 rounded-xl bg-[#030712] border border-cyan-900/50 text-xs text-slate-200 leading-relaxed">
                  {selectedLanguageTab === 'TA'
                    ? selectedModule.tamilSummary
                    : selectedLanguageTab === 'TANGLISH'
                    ? selectedModule.tanglishSummary
                    : selectedModule.summary}
                </div>

                {/* Code Snippets */}
                {selectedModule.codeSnippets.map((snippet, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-cyan-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-cyan-400" />
                        {snippet.title} ({snippet.language})
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#030712] border border-cyan-900/60 text-xs text-cyan-200 overflow-x-auto">
                      <pre>{snippet.code}</pre>
                    </div>
                  </div>
                ))}
              </div>

              {/* Practice Problem & Interactive Quiz */}
              {selectedModule.practiceProblems.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-amber-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    INTERACTIVE CHALLENGE & PRACTICE PROBLEM
                  </h4>

                  {selectedModule.practiceProblems.map((prob, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#030712] border border-cyan-900/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">
                          {selectedLanguageTab === 'TA' ? prob.tamilQuestion : prob.question}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                          {prob.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setActiveProblemIdx(idx);
                            setShowSolution(!showSolution);
                            soundFX.playBlip();
                          }}
                          className="px-3 py-1 rounded-lg bg-[#0a172e] hover:bg-cyan-950 text-cyan-300 text-xs border border-cyan-900/40"
                        >
                          {showSolution && activeProblemIdx === idx ? 'HIDE SOLUTION' : 'SHOW HINT & SOLUTION'}
                        </button>
                      </div>

                      {showSolution && activeProblemIdx === idx && (
                        <div className="p-3 rounded-lg bg-[#081224] border border-emerald-500/40 text-xs text-emerald-300 space-y-1">
                          <p><strong className="text-slate-400">Hint:</strong> {prob.hint}</p>
                          <p><strong className="text-emerald-400">Solution:</strong> {prob.solution}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
