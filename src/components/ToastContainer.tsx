import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  X 
} from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        let borderColor = 'border-cyan-500/40';
        let bgColor = 'bg-[#0b0e1b]/95';
        let Icon = Info;
        let iconColor = 'text-cyan-400';

        if (toast.type === 'success') {
          borderColor = 'border-emerald-500/40';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'warning') {
          borderColor = 'border-amber-500/40';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else if (toast.type === 'error') {
          borderColor = 'border-rose-500/40';
          Icon = AlertCircle;
          iconColor = 'text-rose-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border ${borderColor} ${bgColor} shadow-2xl backdrop-blur-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-250`}
          >
            <Icon className={`w-5 h-5 ${iconColor} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-100">{toast.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
