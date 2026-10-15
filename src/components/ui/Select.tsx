import React from 'react';
import { CaretDown, WarningCircle } from '@phosphor-icons/react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  showOptionalBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'surface';
  leftIcon?: React.ReactNode;
  options?: SelectOption[];
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      showOptionalBadge = false,
      size = 'md',
      variant = 'default',
      leftIcon,
      options,
      containerClassName = 'w-full',
      required,
      className = '',
      id,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const errorId = error && selectId ? `${selectId}-error` : undefined;
    const hintId = hint && selectId ? `${selectId}-hint` : undefined;

    const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
      sm: `h-[38px] text-[13px] rounded-md ${leftIcon ? 'pl-9' : 'pl-3'} pr-8`,
      md: `h-[48px] text-[15px] rounded-sm ${leftIcon ? 'pl-10' : 'pl-3.5'} pr-9`,
      lg: `h-[56px] text-[16px] rounded-sm ${leftIcon ? 'pl-10' : 'pl-3.5'} pr-10`,
    };

    const variantStyles: Record<'default' | 'surface', string> = {
      default: 'bg-canvas',
      surface: 'bg-surface-soft/60',
    };

    const caretSizes: Record<'sm' | 'md' | 'lg', number> = {
      sm: 14,
      md: 16,
      lg: 18,
    };

    const selectClass = [
      'w-full border text-ink appearance-none transition-colors focus:outline-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      sizeStyles[size],
      variantStyles[variant],
      error
        ? 'border-error bg-error/[0.02] focus:border-2 focus:border-error'
        : 'border-hairline focus:border-2 focus:border-ink',
      className,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return (
      <div className={containerClassName}>
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={selectId}
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
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center justify-center text-muted">
              {leftIcon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={errorId || hintId}
            className={selectClass}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute right-3 flex items-center justify-center text-muted">
            <CaretDown size={caretSizes[size]} weight="bold" />
          </div>
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

Select.displayName = 'Select';
