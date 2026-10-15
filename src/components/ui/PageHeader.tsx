import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  badge,
  className = '',
  backHref,
  onBack,
  backLabel = 'Voltar',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-hairline ${className}`}
    >
      <div className="space-y-1 min-w-0 flex-1">
        {badge && <div className="mb-2">{badge}</div>}
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel}
              title={backLabel}
              className="w-9 h-9 rounded-full border border-hairline flex items-center justify-center text-ink hover:bg-surface-soft hover:border-hairline-strong transition-colors shrink-0"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
          )}
          {onBack && !backHref && (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              title={backLabel}
              className="w-9 h-9 rounded-full border border-hairline flex items-center justify-center text-ink hover:bg-surface-soft hover:border-hairline-strong transition-colors shrink-0"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {typeof title === 'string' ? (
              <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-tight">
                {title}
              </h1>
            ) : (
              title
            )}
          </div>
        </div>
        {description && (
          typeof description === 'string' ? (
            <p className="text-[14px] text-muted max-w-2xl leading-relaxed">
              {description}
            </p>
          ) : (
            description
          )
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
