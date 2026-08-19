import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  X,
  Trash2
} from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onClearAll?: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onClearAll,
}) => {
  if (!toasts || toasts.length === 0) return null;

  // Max stack limit to prevent UI overflow
  const visibleToasts = toasts.slice(-5);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {/* Clear All Button if multiple toasts are visible */}
      {visibleToasts.length > 2 && onClearAll && (
        <div className="flex justify-end pr-1 pointer-events-auto">
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-mono text-slate-400 hover:text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear All ({visibleToasts.length})</span>
          </button>
        </div>
      )}

      {visibleToasts.map((toast) => {
        let borderColor = 'border-cyan-500/40';
        let bgColor = 'bg-[#0b0e1b]/95';
        let Icon = Info;
        let iconColor = 'text-cyan-400';
        let glowColor = 'shadow-[0_0_20px_-5px_rgba(0,242,254,0.3)]';

        if (toast.type === 'success') {
          borderColor = 'border-emerald-500/40';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
          glowColor = 'shadow-[0_0_20px_-5px_rgba(0,245,160,0.3)]';
        } else if (toast.type === 'warning') {
          borderColor = 'border-amber-500/40';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
          glowColor = 'shadow-[0_0_20px_-5px_rgba(255,170,0,0.3)]';
        } else if (toast.type === 'error') {
          borderColor = 'border-rose-500/40';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
          glowColor = 'shadow-[0_0_20px_-5px_rgba(255,51,102,0.3)]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border ${borderColor} ${bgColor} ${glowColor} backdrop-blur-2xl flex items-start gap-3 transition-all duration-200 relative overflow-hidden`}
          >
            <Icon className={`w-5 h-5 ${iconColor} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-100">{toast.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-slate-500 hover:text-slate-300 p-1 transition-colors rounded-lg hover:bg-white/5"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
