import React, { useId } from 'react';

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
  const uid = useId().replace(/:/g, '');
  const isDark = theme === 'dark';
  const primaryTextClass = isDark ? 'text-white' : 'text-ink';
  const accentStart = isDark ? '#34d399' : '#10b981';
  const accentEnd = isDark ? '#10b981' : '#047857';
  const wordmarkAccent = isDark ? '#34d399' : '#059669';

  const fontSize = Math.round(size * 0.62);
  const gapSize = Math.max(8, Math.round(size * 0.26));

  return (
    <div
      className={`inline-flex items-center select-none group ${className}`}
      style={{ gap: `${gapSize}px` }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${primaryTextClass} transition-transform duration-300 group-hover:scale-[1.03]`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`pm-ribbon-${uid}`} x1="10" y1="10" x2="36" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={accentStart} />
            <stop offset="100%" stopColor={accentEnd} />
          </linearGradient>
        </defs>

        <path
          d="M 3.5 7.5 H 9.2 L 13.8 25.2 Q 14.3 27.2 16.4 27.2 H 29.8"
          stroke="currentColor"
          strokeWidth="3.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M 13.2 20.5 H 22.2"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.24"
        />

        <path
          d="M 11.2 13.2 H 18.8 L 22.6 17.2 L 26.8 11.8 L 35.5 20.5"
          stroke={`url(#pm-ribbon-${uid})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M 29.2 20.5 H 35.5 V 14.2"
          stroke={`url(#pm-ribbon-${uid})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx="16.2"
          cy="33.2"
          r="2.7"
          stroke="currentColor"
          strokeWidth="2.8"
          fill="none"
        />
        <circle
          cx="28.2"
          cy="33.2"
          r="2.7"
          stroke={`url(#pm-ribbon-${uid})`}
          strokeWidth="2.8"
          fill="none"
        />
      </svg>

      {showText && (
        <span
          className={`inline-flex items-baseline leading-none ${primaryTextClass}`}
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
          }}
        >
          <span
            className="font-extrabold"
            style={{ letterSpacing: '-0.045em' }}
          >
            Pred
            <span className="relative inline-block">
              ı
              <svg
                viewBox="0 0 8 8"
                className="w-[0.28em] h-[0.28em] absolute -top-[0.04em] left-1/2 -translate-x-1/2"
                aria-hidden="true"
              >
                <polygon points="4,0 8,4 4,8 0,4" fill={wordmarkAccent} />
              </svg>
            </span>
            ct
          </span>
          <span
            className="font-semibold"
            style={{
              color: wordmarkAccent,
              letterSpacing: '-0.035em',
              marginLeft: '0.02em',
            }}
          >
            Market
          </span>
          <span
            className="inline-block w-[0.18em] h-[0.18em] rounded-full ml-[0.08em] mb-[0.08em] shrink-0"
            style={{ backgroundColor: wordmarkAccent }}
            aria-hidden="true"
          />
        </span>
      )}
    </div>
  );
};

