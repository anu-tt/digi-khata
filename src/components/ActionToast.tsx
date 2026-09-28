import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Trash2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'delete' | 'info' | 'error';
  text: string;
}

interface ActionToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const ActionToast: React.FC<ActionToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 2800);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'delete':
        return {
          bg: 'bg-rose-950/95 border-rose-800 text-rose-100 shadow-rose-950/50',
          icon: <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-950/95 border-rose-800 text-rose-100 shadow-rose-950/50',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />,
        };
      case 'info':
        return {
          bg: 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/50',
          icon: <Info className="w-4 h-4 text-emerald-400 shrink-0" />,
        };
      case 'success':
      default:
        return {
          bg: 'bg-emerald-950/95 border-emerald-700 text-emerald-100 shadow-emerald-950/50',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[120] max-w-sm w-[90%] pointer-events-auto select-none animate-slide-down">
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-bold ${style.bg}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {style.icon}
          <span className="truncate">{toast.text}</span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition active:scale-90"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
