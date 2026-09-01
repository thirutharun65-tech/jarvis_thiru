import React from 'react';
import { AlertTriangle, Check, ShieldAlert, X } from 'lucide-react';
import { soundFX } from '../lib/audio';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'critical' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'CONFIRM DIRECTIVE',
  cancelText = 'ABORT',
  severity = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="jarvis-confirmation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-md p-6 rounded-2xl bg-[#081224] border ${
          severity === 'critical'
            ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
            : 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
        } space-y-4 font-mono`}
      >
        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-cyan-900/40 pb-3">
          <div
            className={`p-2 rounded-xl ${
              severity === 'critical' ? 'bg-red-950/80 text-red-400' : 'bg-amber-950/80 text-amber-400'
            }`}
          >
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-['Orbitron',sans-serif] text-sm font-bold text-slate-100">
              {title}
            </h3>
            <span className="text-[10px] text-red-400/80 font-bold tracking-widest uppercase">
              SECURITY CONFIRMATION REQUIRED
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 rounded-xl bg-[#030712] border border-cyan-900/40 text-xs text-slate-300 leading-relaxed">
          <p>{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              soundFX.playBlip();
              onCancel();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
          >
            <X className="w-4 h-4" />
            <span>{cancelText}</span>
          </button>

          <button
            onClick={() => {
              soundFX.playAcknowledge();
              onConfirm();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg ${
              severity === 'critical'
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold'
            } text-xs font-bold transition-all shadow-lg`}
          >
            <Check className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
