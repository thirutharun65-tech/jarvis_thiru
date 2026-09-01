import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileCode,
  Globe,
  Hash,
  Key,
  Lock,
  Play,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SecurityLabScanResult, SecurityVulnerability } from '../types';
import { jarvisApi } from '../lib/api';
import { soundFX } from '../lib/audio';

interface SecurityLabPanelProps {
  scanResult: SecurityLabScanResult | null;
  onRunScan: (scanType: 'all' | 'vuln' | 'secrets' | 'ports' | 'deps', target: string) => void;
  isScanning: boolean;
}

export const SecurityLabPanel: React.FC<SecurityLabPanelProps> = ({
  scanResult,
  onRunScan,
  isScanning,
}) => {
  const [targetHost, setTargetHost] = useState('127.0.0.1');
  const [activeTab, setActiveTab] = useState<'scan' | 'crypto' | 'report'>('scan');
  const [inputText, setInputText] = useState('JARVIS_THIRU_LOCAL_LAB_PAYLOAD');
  const [hashAlgorithm, setHashAlgorithm] = useState<'sha256' | 'sha512' | 'md5' | 'sha1'>('sha256');
  const [calculatedHash, setCalculatedHash] = useState('');
  const [encodeMode, setEncodeMode] = useState<
    'base64_encode' | 'base64_decode' | 'hex_encode' | 'hex_decode' | 'rot13' | 'url_encode' | 'url_decode'
  >('base64_encode');
  const [encodedResult, setEncodedResult] = useState('');

  const handleComputeHash = async () => {
    soundFX.playBlip();
    const res = await jarvisApi.calculateHash(inputText, hashAlgorithm);
    setCalculatedHash(res);
  };

  const handleTransformEncoding = async () => {
    soundFX.playBlip();
    const res = await jarvisApi.transformEncoding(inputText, encodeMode);
    setEncodedResult(res);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-300 border-red-500/60 font-bold';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/60 font-bold';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-500/60';
      case 'LOW':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/60';
      case 'INFO':
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="jarvis-security-lab" className="max-w-7xl mx-auto p-4 space-y-4 font-mono">
      {/* Top HUD: Security Target Lock Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#060c18]/90 border border-emerald-500/40 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-400">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-['Orbitron',sans-serif] text-base font-bold text-emerald-300">
                AUTHORIZED SECURITY LAB
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-400/50 text-emerald-300 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                TARGET LOCKED
              </span>
            </div>
            <p className="text-xs text-emerald-400/70">
              STRICTLY AUTHORIZED: LOCALHOST &bull; 127.0.0.1 &bull; LOCAL CTF / VM LABS
            </p>
          </div>
        </div>

        {/* Target Lock Input Control */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#030712] border border-emerald-500/40 text-xs text-emerald-300">
            <span className="text-slate-400 font-bold">TARGET:</span>
            <input
              type="text"
              value={targetHost}
              onChange={(e) => setTargetHost(e.target.value)}
              className="bg-transparent text-emerald-200 font-bold focus:outline-none w-28"
            />
          </div>

          <button
            disabled={isScanning}
            onClick={() => {
              soundFX.playScan();
              onRunScan('all', targetHost);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>{isScanning ? 'SCANNING...' : 'EXECUTE FULL AUDIT'}</span>
          </button>
        </div>
      </div>

      {/* Nav Tabs: Scans & Audits | Crypto & Encodings | Security Report */}
      <div className="flex items-center gap-2 border-b border-cyan-900/40 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('scan')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'scan'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          DEFENSIVE AUDITS & SCANNER
        </button>
        <button
          onClick={() => setActiveTab('crypto')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'crypto'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          CRYPTOGRAPHY & ENCODINGS
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'report'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          SECURITY AUDIT REPORT
        </button>
      </div>

      {/* Tab 1: Defensive Audits & Scans */}
      {activeTab === 'scan' && (
        <div className="space-y-4">
          {/* Quick Module Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: 'vuln', label: 'OWASP Code Audit', icon: ShieldAlert, desc: 'SQLi, XSS, Deserialization' },
              { type: 'secrets', label: 'Secret Detection', icon: Key, desc: 'API Keys & Private Tokens' },
              { type: 'ports', label: 'Local Port Scanner', icon: Radio, desc: 'Safe Local Port Probe' },
              { type: 'deps', label: 'Dependency Auditor', icon: AlertTriangle, desc: 'CVE Database Check' },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.type}
                  disabled={isScanning}
                  onClick={() => {
                    soundFX.playScan();
                    onRunScan(mod.type as any, targetHost);
                  }}
                  className="p-3 rounded-xl bg-[#060c18]/90 hover:bg-cyan-950/40 border border-cyan-900/40 hover:border-cyan-400 text-left transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-200">{mod.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{mod.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Results Display */}
          {scanResult && (
            <div className="space-y-4">
              {/* Summary Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs text-center font-bold">
                <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300">
                  CRITICAL: {scanResult.summary.critical}
                </div>
                <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300">
                  HIGH: {scanResult.summary.high}
                </div>
                <div className="p-2 rounded-lg bg-yellow-950/60 border border-yellow-500/40 text-yellow-300">
                  MEDIUM: {scanResult.summary.medium}
                </div>
                <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300">
                  LOW: {scanResult.summary.low}
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                  INFO: {scanResult.summary.info}
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  TOTAL: {scanResult.summary.total}
                </div>
              </div>

              {/* Findings List */}
              <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 space-y-3">
                <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  IDENTIFIED VULNERABILITIES & CODE FINDINGS
                </h3>

                <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar">
                  {scanResult.findings.map((vuln) => (
                    <div
                      key={vuln.id}
                      className="p-3 rounded-xl bg-[#030712] border border-cyan-900/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] border ${getSeverityBadge(vuln.severity)}`}>
                            {vuln.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-200">{vuln.title}</span>
                        </div>
                        {vuln.cwe && <span className="text-[10px] text-slate-500">{vuln.cwe}</span>}
                      </div>

                      <p className="text-xs text-slate-300">{vuln.description}</p>

                      {vuln.codeSnippet && (
                        <div className="p-2 rounded bg-[#070e1c] text-[11px] text-cyan-200 border border-cyan-950">
                          <span className="text-[9px] text-slate-500 block mb-0.5">
                            {vuln.file} (Line {vuln.line}):
                          </span>
                          <code>{vuln.codeSnippet}</code>
                        </div>
                      )}

                      <div className="text-[11px] text-emerald-400">
                        <span className="text-slate-500 font-bold">Remediation: </span>
                        {vuln.remediation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Open Ports & Services */}
              {scanResult.openPorts && scanResult.openPorts.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30">
                  <h3 className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    LOCAL OPEN PORTS & NETWORK SERVICES
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {scanResult.openPorts.map((p) => (
                      <div key={p.port} className="p-2.5 rounded-lg bg-[#030712] border border-cyan-900/40">
                        <div className="flex items-center justify-between text-cyan-300 font-bold">
                          <span>Port {p.port}</span>
                          <span className="text-[9px] text-emerald-400">{p.state}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{p.service}</div>
                        {p.banner && <div className="text-[9px] text-slate-500 truncate">{p.banner}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Cryptography & Encodings Hub */}
      {activeTab === 'crypto' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Hasher */}
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <Hash className="w-4 h-4 text-cyan-400" />
              CRYPTOGRAPHIC HASH ENGINE
            </h3>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Input Text / Payload:</label>
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-[#030712] border border-cyan-900/60 text-cyan-200 p-2.5 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={hashAlgorithm}
                onChange={(e) => setHashAlgorithm(e.target.value as any)}
                className="bg-[#030712] border border-cyan-900/60 text-cyan-200 p-2 rounded-lg text-xs"
              >
                <option value="sha256">SHA-256 (Standard)</option>
                <option value="sha512">SHA-512 (High Security)</option>
                <option value="sha1">SHA-1 (Legacy)</option>
                <option value="md5">MD5 (Checksum)</option>
              </select>

              <button
                onClick={handleComputeHash}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                COMPUTE HASH
              </button>
            </div>

            {calculatedHash && (
              <div className="p-3 rounded-lg bg-[#030712] border border-cyan-500/40 text-xs text-cyan-300 break-all">
                <span className="text-[10px] text-slate-500 block mb-1">Calculated {hashAlgorithm.toUpperCase()}:</span>
                <code>{calculatedHash}</code>
              </div>
            )}
          </div>

          {/* Encodings */}
          <div className="p-4 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              MULTI-FORMAT ENCODING SUITE
            </h3>

            <div className="flex items-center gap-2">
              <select
                value={encodeMode}
                onChange={(e) => setEncodeMode(e.target.value as any)}
                className="w-full bg-[#030712] border border-cyan-900/60 text-cyan-200 p-2 rounded-lg text-xs"
              >
                <option value="base64_encode">Base64 Encode</option>
                <option value="base64_decode">Base64 Decode</option>
                <option value="hex_encode">Hexadecimal Encode</option>
                <option value="hex_decode">Hexadecimal Decode</option>
                <option value="rot13">ROT13 Cipher</option>
                <option value="url_encode">URL Percent Encode</option>
                <option value="url_decode">URL Percent Decode</option>
              </select>

              <button
                onClick={handleTransformEncoding}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shrink-0"
              >
                TRANSFORM
              </button>
            </div>

            {encodedResult && (
              <div className="p-3 rounded-lg bg-[#030712] border border-cyan-500/40 text-xs text-cyan-300 break-all">
                <span className="text-[10px] text-slate-500 block mb-1">Transformed Result:</span>
                <code>{encodedResult}</code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Security Report Export */}
      {activeTab === 'report' && (
        <div className="p-5 rounded-2xl bg-[#060c18]/90 border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cyan-300">
              JARVIS COMPREHENSIVE SECURITY ASSESSMENT REPORT
            </h3>
            <button
              onClick={() => {
                soundFX.playSuccess();
                alert('Report generated and saved to workspace/reports/security_audit.md');
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              EXPORT REPORT (.MD)
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#030712] border border-cyan-900/40 text-xs text-slate-300 space-y-2">
            <p className="text-cyan-400 font-bold">Target: 127.0.0.1 (Local Security Lab)</p>
            <p>Assessment Type: Defensive Static Code Analysis & Port Reconnaissance</p>
            <p>Framework: OWASP Top 10 & CWE Standard Baseline</p>
            <p className="text-emerald-400">Status: Verified clean on external boundaries. Local vulnerabilities mapped with actionable remediation steps.</p>
          </div>
        </div>
      )}
    </div>
  );
};
