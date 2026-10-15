import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'bordered' | 'elevated';
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'bordered',
      interactive = false,
      className = '',
      onClick,
      onKeyDown,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'bg-canvas rounded-md';

    const variantStyles: Record<string, string> = {
      flat: 'border-0',
      bordered: 'border border-hairline',
      elevated: 'border border-hairline shadow-airbnb',
    };

    const interactiveStyles = interactive
      ? 'transition-shadow hover:shadow-airbnb cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink'
      : '';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    const combined = `${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${className}`.trim();

    return (
      <div
        ref={ref}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={combined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
