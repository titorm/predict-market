'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle, WarningCircle, Warning, Info, X } from '@phosphor-icons/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ToastOptions {
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ToastContextType {
  show: (options: ToastOptions) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  dismiss: (id: string) => void;
  toasts: ToastItem[];
}

const ToastContext = createContext<ToastContextType | null>(null);

const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ type, message, title, duration = DEFAULT_DURATION }: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) => {
      show({ type: 'success', message, title, duration });
    },
    [show]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) => {
      show({ type: 'error', message, title, duration });
    },
    [show]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) => {
      show({ type: 'warning', message, title, duration });
    },
    [show]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) => {
      show({ type: 'info', message, title, duration });
    },
    [show]
  );

  const contextValue = useMemo(
    () => ({
      show,
      success,
      error,
      warning,
      info,
      dismiss,
      toasts,
    }),
    [show, success, error, warning, info, dismiss, toasts]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-[420px] w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const isError = toast.type === 'error';
  const role = isError ? 'alert' : 'status';

  const typeConfig: Record<
    ToastType,
    {
      borderColor: string;
      bgColor: string;
      icon: React.ReactNode;
      defaultTitle: string;
    }
  > = {
    success: {
      borderColor: 'border-primary/30',
      bgColor: 'bg-canvas',
      icon: <CheckCircle size={20} weight="fill" className="text-primary shrink-0" />,
      defaultTitle: 'Sucesso',
    },
    error: {
      borderColor: 'border-error/40',
      bgColor: 'bg-canvas',
      icon: <WarningCircle size={20} weight="fill" className="text-error shrink-0" />,
      defaultTitle: 'Erro',
    },
    warning: {
      borderColor: 'border-amber-400/50',
      bgColor: 'bg-canvas',
      icon: <Warning size={20} weight="fill" className="text-amber-600 shrink-0" />,
      defaultTitle: 'Atenção',
    },
    info: {
      borderColor: 'border-hairline-strong',
      bgColor: 'bg-canvas',
      icon: <Info size={20} weight="fill" className="text-ink shrink-0" />,
      defaultTitle: 'Informação',
    },
  };

  const config = typeConfig[toast.type];

  return (
    <div
      role={role}
      className={`pointer-events-auto border ${config.borderColor} ${config.bgColor} shadow-airbnb rounded-sm p-4 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-2 duration-200`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-bold text-ink tracking-tight">
          {toast.title || config.defaultTitle}
        </h3>
        <p className="text-[13px] text-body mt-0.5 break-words leading-relaxed">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar notificação"
        className="text-muted hover:text-ink p-1 rounded-sm transition-colors shrink-0 -mr-1 -mt-1"
      >
        <X size={16} weight="bold" />
      </button>
    </div>
  );
}
