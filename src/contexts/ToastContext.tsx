import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => string;
    error: (message: string, title?: string, duration?: number) => string;
    warning: (message: string, title?: string, duration?: number) => string;
    info: (message: string, title?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'success', message, title, duration }),
    error: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'error', message, title, duration }),
    warning: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'warning', message, title, duration }),
    info: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'info', message, title, duration }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Visual Toast Container Component
function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onClose={() => onClose(item.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    error: <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
  };

  const borderThemes = {
    success: 'border-emerald-200/90 bg-white/95 text-slate-800 shadow-emerald-500/5',
    error: 'border-rose-200/90 bg-white/95 text-slate-800 shadow-rose-500/5',
    warning: 'border-amber-200/90 bg-white/95 text-slate-800 shadow-amber-500/5',
    info: 'border-blue-200/90 bg-white/95 text-slate-800 shadow-blue-500/5',
  };

  return (
    <div
      className={`pointer-events-auto rounded-[20px] border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in flex items-start gap-3.5 ${borderThemes[item.type]}`}
      role="alert"
    >
      {icons[item.type]}
      <div className="flex-1 min-w-0 pr-1">
        {item.title && (
          <h4 className="text-xs font-bold text-slate-900 leading-tight mb-0.5">
            {item.title}
          </h4>
        )}
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {item.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
