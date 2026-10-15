'use client';

import React, { useState } from 'react';

export interface PricePoint {
  month: string;
  avg: number;
  min: number;
  max: number;
}

export interface ProductPriceChartProps {
  data: PricePoint[];
  standardUnit?: string;
  height?: number;
}

export const ProductPriceChart: React.FC<ProductPriceChartProps> = ({
  data,
  standardUnit = 'UN',
  height = 220,
}) => {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg border border-hairline bg-surface-soft text-[13px] text-muted">
        Nenhum dado histórico registrado para este item.
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));

  if (sorted.length === 1) {
    const single = sorted[0];
    return (
      <div className="p-5 rounded-lg border border-hairline bg-surface-soft/40 space-y-3">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-semibold text-ink">Registro Único: {single.month}</span>
          <span className="text-muted">Unidade: {standardUnit}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-hairline">
          <div>
            <span className="text-[10px] uppercase font-bold text-scenario-optimistic block">Mínimo</span>
            <strong className="text-[16px] text-scenario-optimistic font-bold tabular-nums">
              {formatBRL(single.min)}
            </strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-ink block">Médio</span>
            <strong className="text-[16px] text-ink font-bold tabular-nums">
              {formatBRL(single.avg)}
            </strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-scenario-pessimistic block">Máximo</span>
            <strong className="text-[16px] text-scenario-pessimistic font-bold tabular-nums">
              {formatBRL(single.max)}
            </strong>
          </div>
        </div>
        <p className="text-[11px] text-muted text-center pt-1">
          A série temporal gráfica estará disponível a partir do segundo mês de dados.
        </p>
      </div>
    );
  }

  const svgWidth = 520;
  const svgHeight = height;
  const padding = { top: 24, right: 24, bottom: 38, left: 68 };

  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const allValues = sorted.flatMap((d) => [d.min, d.avg, d.max]);
  const minValRaw = Math.min(...allValues);
  const maxValRaw = Math.max(...allValues);

  const valSpread = maxValRaw - minValRaw;
  const yPadding = valSpread === 0 ? minValRaw * 0.1 || 1 : valSpread * 0.15;
  const minY = Math.max(0, minValRaw - yPadding);
  const maxY = maxValRaw + yPadding;

  const getX = (idx: number) => {
    if (sorted.length === 1) return padding.left + innerWidth / 2;
    return padding.left + (idx / (sorted.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    if (maxY === minY) return padding.top + innerHeight / 2;
    const norm = (val - minY) / (maxY - minY);
    return padding.top + innerHeight - norm * innerHeight;
  };

  const avgPoints = sorted.map((d, idx) => ({ x: getX(idx), y: getY(d.avg), data: d }));
  const minPoints = sorted.map((d, idx) => ({ x: getX(idx), y: getY(d.min) }));
  const maxPoints = sorted.map((d, idx) => ({ x: getX(idx), y: getY(d.max) }));

  const avgLinePath = avgPoints.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
    ''
  );

  const areaPath = `
    ${avgLinePath}
    L ${avgPoints[avgPoints.length - 1].x.toFixed(1)},${(padding.top + innerHeight).toFixed(1)}
    L ${avgPoints[0].x.toFixed(1)},${(padding.top + innerHeight).toFixed(1)}
    Z
  `;

  const rangeBandPath = `
    M ${minPoints[0].x.toFixed(1)},${minPoints[0].y.toFixed(1)}
    ${minPoints.slice(1).map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
    ${maxPoints.slice().reverse().map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
    Z
  `;

  const yTicks = [
    minY,
    minY + (maxY - minY) * 0.5,
    maxY,
  ];

  const activeData = activePointIndex !== null ? sorted[activePointIndex] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-ink">
            <span className="w-3 h-0.5 bg-primary rounded-full inline-block" />
            Preço Médio
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="w-3 h-2 bg-primary/10 rounded-xs inline-block border border-primary/20" />
            Faixa Mín-Máx
          </span>
        </div>

        {activeData ? (
          <div className="font-semibold text-ink tabular-nums text-[13px] bg-surface-soft px-2.5 py-0.5 rounded-full border border-hairline">
            {activeData.month}: <strong>{formatBRL(activeData.avg)}</strong>{' '}
            <span className="text-muted font-normal text-[11px]">
              ({formatBRL(activeData.min)} – {formatBRL(activeData.max)})
            </span>
          </div>
        ) : (
          <span className="text-muted text-[11px]">Toque ou passe o mouse nos pontos para detalhes</span>
        )}
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border border-hairline bg-canvas">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          style={{ maxHeight: `${height}px` }}
        >
          <defs>
            <linearGradient id="priceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e4d3b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#1e4d3b" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {yTicks.map((tickVal, i) => {
            const yPos = getY(tickVal);
            return (
              <g key={`ytick-${i}`}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={svgWidth - padding.right}
                  y2={yPos}
                  stroke="#ebebeb"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#929292"
                  className="font-mono tabular-nums"
                >
                  {formatBRL(tickVal)}
                </text>
              </g>
            );
          })}

          <path d={rangeBandPath} fill="#1e4d3b" fillOpacity="0.06" />

          <path d={areaPath} fill="url(#priceAreaGrad)" />

          <path
            d={avgLinePath}
            fill="none"
            stroke="#1e4d3b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {avgPoints.map((pt, idx) => {
            const isHovered = activePointIndex === idx;
            return (
              <g
                key={`point-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setActivePointIndex(idx)}
                onMouseLeave={() => setActivePointIndex(null)}
                onClick={() => setActivePointIndex(idx)}
              >
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#1e4d3b' : '#ffffff'}
                  stroke="#1e4d3b"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                <text
                  x={pt.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isHovered ? '#222222' : '#6a6a6a'}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {pt.data.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
