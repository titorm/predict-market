import React from 'react';

export interface PredictMarketLoaderProps {
  size?: 'sm' | 'md' | 'lg' | number;
  text?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: 36,
  md: 64,
  lg: 100,
};

export const PredictMarketLoader: React.FC<PredictMarketLoaderProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}>
      <style>{`
        @keyframes pm-loader-float {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-3px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-1.5px); }
        }
        @keyframes pm-loader-rs {
          0%, 35% { opacity: 0.85; transform: scale(1); }
          20% { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.6)); }
          45%, 100% { opacity: 0.85; transform: scale(1); }
        }
        @keyframes pm-loader-drop {
          0%, 38% { transform: translate(0, 0); filter: drop-shadow(0 0 0 transparent); }
          44% { transform: translate(0, -1.5px); }
          56% { transform: translate(2.5px, 7px); filter: drop-shadow(0 3px 8px rgba(16, 185, 129, 0.85)); }
          70% { transform: translate(2px, 6px); }
          88%, 100% { transform: translate(0, 0); filter: drop-shadow(0 0 0 transparent); }
        }
        @keyframes pm-loader-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .pm-anim-cart {
          animation: pm-loader-float 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: center;
        }
        .pm-anim-rs {
          animation: pm-loader-rs 2.4s ease-in-out infinite;
          transform-origin: 43px 59px;
        }
        .pm-anim-arrow {
          animation: pm-loader-drop 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
          transform-origin: 32px 44px;
        }
        .pm-anim-wheel {
          animation: pm-loader-spin 2.4s linear infinite;
          transform-origin: center;
        }
      `}</style>

      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible shrink-0 text-ink"
        aria-label="Carregando"
      >
        <g className="pm-anim-cart">
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
            opacity="0.9"
          />
          <path
            d="M 36 73 L 68 73"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.4"
          />

          <text
            className="pm-anim-rs"
            x="43"
            y="59"
            fill="#10b981"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontSize="13.5"
            fontWeight="800"
            letterSpacing="-0.5"
          >
            R$
          </text>

          <g className="pm-anim-arrow">
            <path
              d="M 32 44 L 52 44 L 60 53 L 66 44 L 80 59"
              stroke="#10b981"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 71 59 L 80 59 L 79 50"
              stroke="#10b981"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        <g transform="translate(43, 81)">
          <circle cx="0" cy="0" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle className="pm-anim-wheel" cx="0" cy="0" r="1.5" fill="#10b981" />
        </g>
        <g transform="translate(63, 81)">
          <circle cx="0" cy="0" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle className="pm-anim-wheel" cx="0" cy="0" r="1.5" fill="#10b981" />
        </g>
      </svg>

      {text && <p className="text-[14px] font-medium text-muted animate-pulse">{text}</p>}
    </div>
  );
};
