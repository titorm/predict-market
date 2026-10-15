'use client';

import React from 'react';
import { WarningCircle, CheckCircle, Warning, Info } from '@phosphor-icons/react';

export type FeedbackVariant = 'error' | 'success' | 'warning' | 'info';

export interface FeedbackAlertProps {
  variant?: FeedbackVariant;
  title?: string;
  message: string;
  detail?: string;
  diagnosis?: string;
  className?: string;
}

export function FeedbackAlert({
  variant = 'error',
  title,
  message,
  detail,
  diagnosis,
  className = '',
}: FeedbackAlertProps) {
  const variantConfig: Record<
    FeedbackVariant,
    {
      container: string;
      icon: React.ReactNode;
      titleColor: string;
    }
  > = {
    error: {
      container: 'bg-surface-soft border border-hairline border-l-4 border-l-error text-ink',
      icon: <WarningCircle size={18} weight="bold" className="text-error shrink-0 mt-0.5" />,
      titleColor: 'text-error',
    },
    success: {
      container: 'bg-surface-soft border border-hairline border-l-4 border-l-primary text-ink',
      icon: <CheckCircle size={18} weight="bold" className="text-primary shrink-0 mt-0.5" />,
      titleColor: 'text-primary',
    },
    warning: {
      container: 'bg-surface-soft border border-hairline border-l-4 border-l-amber-500 text-ink',
      icon: <Warning size={18} weight="bold" className="text-amber-600 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-700',
    },
    info: {
      container: 'bg-surface-soft border border-hairline border-l-4 border-l-ink text-ink',
      icon: <Info size={18} weight="bold" className="text-ink shrink-0 mt-0.5" />,
      titleColor: 'text-ink',
    },
  };

  const config = variantConfig[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`p-3.5 rounded-sm flex items-start gap-2.5 text-[13px] ${config.container} ${className}`.trim()}
    >
      {config.icon}
      <div className="flex-1 min-w-0 space-y-1">
        {title && <p className={`font-bold ${config.titleColor}`}>{title}</p>}
        <p className="text-body leading-relaxed break-words">{message}</p>
        {detail && (
          <p className="text-[12px] text-muted font-mono break-all pt-0.5">
            {detail}
          </p>
        )}
        {diagnosis && (
          <div className="mt-1 p-2 bg-canvas/80 border border-hairline rounded-sm text-[12px] text-ink font-medium">
            <span className="font-bold text-ink">Dica de resolução: </span>
            <span>{diagnosis}</span>
          </div>
        )}
      </div>
    </div>
  );
}
