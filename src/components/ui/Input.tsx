import React from 'react';
import { WarningCircle } from '@phosphor-icons/react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  showOptionalBadge?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      showOptionalBadge = false,
      required,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const hintId = hint && inputId ? `${inputId}-hint` : undefined;

    return (
      <div className="w-full">
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={inputId}
              className="block text-[12px] font-bold text-ink tracking-tight"
            >
              {label}
              {required && <span className="text-error ml-1">*</span>}
            </label>
            {!required && showOptionalBadge && (
              <span className="text-[11px] text-muted font-normal">(opcional)</span>
            )}
          </div>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            required={required}
            aria-invalid={!!error}
            aria-describedby={errorId || hintId}
            className={`w-full h-[56px] px-3.5 py-3.5 bg-canvas border rounded-sm text-[16px] text-ink placeholder:text-muted-soft focus:outline-none transition-colors ${
              error
                ? 'border-error bg-error/[0.02] focus:border-2 focus:border-error'
                : 'border-hairline focus:border-2 focus:border-ink'
            } ${className}`.trim()}
            {...props}
          />
        </div>
        {hint && !error && (
          <p id={hintId} className="text-[12px] text-muted mt-1.5 font-normal">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-[12px] text-error mt-1.5 font-medium flex items-center gap-1.5 animate-in fade-in duration-150"
          >
            <WarningCircle size={15} weight="bold" className="shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
