import React from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { PredictMarketLoader } from './PredictMarketLoader';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary-text' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none whitespace-nowrap';

    const variantStyles: Record<string, string> = {
      primary:
        'bg-primary active:bg-primary-active text-white rounded-sm disabled:bg-primary-disabled disabled:text-white',
      secondary:
        'bg-canvas border border-ink text-ink rounded-sm active:bg-surface-soft disabled:border-hairline-strong disabled:text-muted-soft',
      'tertiary-text':
        'text-ink underline active:text-body p-0 h-auto font-normal disabled:text-muted-soft focus-visible:ring-offset-0',
      ghost:
        'text-ink hover:bg-surface-soft active:bg-surface-strong rounded-sm disabled:text-muted-soft',
      danger:
        'bg-danger hover:bg-danger-hover active:bg-danger-active text-white rounded-sm disabled:opacity-50',
    };

    const sizeStyles: Record<string, string> = {
      sm: 'h-[36px] px-3 text-[14px]',
      md: 'h-[48px] px-6 text-[16px]',
      lg: 'h-[56px] px-8 text-[16px]',
      icon: 'w-10 h-10 p-0 rounded-full border border-hairline flex items-center justify-center',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClassName}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
            <PredictMarketLoader size={18} />
            <span className="inline-flex items-center gap-2 whitespace-nowrap">{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
