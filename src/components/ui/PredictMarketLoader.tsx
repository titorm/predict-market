import React, { useId } from 'react';

export interface PredictMarketLoaderProps {
  size?: 'sm' | 'md' | 'lg' | number;
  text?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: 36,
  md: 64,
  lg: 96,
};

export const PredictMarketLoader: React.FC<PredictMarketLoaderProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}>
      <style>{`
        @keyframes pm-loader-chassis {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-1.2px); }
          60% { transform: translateY(0.4px); }
        }
        @keyframes pm-loader-ribbon {
          0%, 25% {
            stroke-dashoffset: 38;
            opacity: 0.45;
          }
          55%, 80% {
            stroke-dashoffset: 0;
            opacity: 1;
            filter: drop-shadow(0 2px 5px rgba(16, 185, 129, 0.45));
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0.85;
          }
        }
        @keyframes pm-loader-arrowhead {
          0%, 42% {
            opacity: 0;
            transform: translate(-2px, -2px);
          }
          58%, 85% {
            opacity: 1;
            transform: translate(0, 0);
          }
          100% {
            opacity: 0.75;
            transform: translate(0, 0);
          }
        }
        @keyframes pm-loader-node {
          0%, 100% { opacity: 0.2; transform: scale(0.85); }
          35% { opacity: 1; transform: scale(1.15); }
        }
        .pm-anim-chassis {
          animation: pm-loader-chassis 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .pm-anim-ribbon {
          stroke-dasharray: 38;
          animation: pm-loader-ribbon 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .pm-anim-arrowhead {
          animation: pm-loader-arrowhead 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .pm-anim-node-1 {
          animation: pm-loader-node 2.2s ease-in-out infinite 0s;
          transform-origin: 15px 8px;
        }
        .pm-anim-node-2 {
          animation: pm-loader-node 2.2s ease-in-out infinite 0.18s;
          transform-origin: 20px 8px;
        }
        .pm-anim-node-3 {
          animation: pm-loader-node 2.2s ease-in-out infinite 0.36s;
          transform-origin: 25px 8px;
        }
      `}</style>

      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible shrink-0 text-ink"
        aria-label="Carregando"
      >
        <defs>
          <linearGradient id={`pm-loader-grad-${uid}`} x1="10" y1="10" x2="36" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        <circle className="pm-anim-node-1" cx="15" cy="7.5" r="1.2" fill="#10b981" />
        <circle className="pm-anim-node-2" cx="20" cy="7.5" r="1.2" fill="#10b981" />
        <circle className="pm-anim-node-3" cx="25" cy="7.5" r="1.2" fill="#10b981" />

        <g className="pm-anim-chassis">
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
            className="pm-anim-ribbon"
            d="M 11.2 13.2 H 18.8 L 22.6 17.2 L 26.8 11.8 L 35.5 20.5"
            stroke={`url(#pm-loader-grad-${uid})`}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            className="pm-anim-arrowhead"
            d="M 29.2 20.5 H 35.5 V 14.2"
            stroke={`url(#pm-loader-grad-${uid})`}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

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
          stroke={`url(#pm-loader-grad-${uid})`}
          strokeWidth="2.8"
          fill="none"
        />
      </svg>

      {text && <p className="text-[14px] font-medium text-muted animate-pulse">{text}</p>}
    </div>
  );
};

