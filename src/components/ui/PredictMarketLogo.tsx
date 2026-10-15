import React from 'react';

export interface PredictMarketLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export const PredictMarketLogo: React.FC<PredictMarketLogoProps> = ({
  size = 32,
  showText = true,
  className = '',
  theme = 'auto',
}) => {
  const isLight = theme === 'light';
  const textColor = isLight ? 'text-ink' : 'text-current';
  const greenColor = isLight ? '#059669' : '#10b981';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M 20 28 L 29 28 L 31 35"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 32 41 L 54 41 C 58 41 61 45 64 49 C 66 45 68 39 73 39 C 76 39 77 42 76 47 L 71 62 C 70 65 67 67 64 67 L 39 67 C 36 67 33 64 34 61 L 40 41"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <path
          d="M 36 73 L 68 73"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.45"
        />
        <text
          x="43"
          y="59"
          fill={greenColor}
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="13.5"
          fontWeight="800"
          letterSpacing="-0.5"
        >
          R$
        </text>
        <path
          d="M 32 44 L 52 44 L 60 53 L 66 44 L 80 59"
          stroke={greenColor}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 71 59 L 80 59 L 79 50"
          stroke={greenColor}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="43" cy="81" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
        <circle cx="63" cy="81" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
      </svg>

      {showText && (
        <span
          className={`font-bold tracking-tight inline-flex items-center ${textColor}`}
          style={{ fontSize: `${Math.round(size * 0.58)}px` }}
        >
          <span>Predict</span>
          <span style={{ color: greenColor }}>Market</span>
        </span>
      )}
    </div>
  );
};
