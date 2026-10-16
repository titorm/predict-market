import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'neutral'
    | 'optimistic'
    | 'realistic'
    | 'pessimistic'
    | 'shrinkflation'
    | 'floating';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-[1.18] whitespace-nowrap shrink-0';

  const variantStyles: Record<string, string> = {
    neutral: 'bg-surface-strong text-ink',
    optimistic: 'bg-surface-soft border border-hairline text-scenario-optimistic',
    realistic: 'bg-surface-soft border border-hairline text-scenario-realistic',
    pessimistic: 'bg-surface-soft border border-hairline text-scenario-pessimistic',
    shrinkflation: 'bg-surface-soft border border-hairline text-scenario-shrinkflation',
    floating: 'bg-canvas border border-hairline shadow-airbnb text-ink',
  };

  const combined = `${baseStyles} ${variantStyles[variant]} ${className}`.trim();

  return (
    <span className={combined} {...props}>
      {children}
    </span>
  );
};
