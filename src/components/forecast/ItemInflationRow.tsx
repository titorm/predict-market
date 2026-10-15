import React from 'react';
import { WarningCircle, TrendDown, TrendUp } from '@phosphor-icons/react';
import { ItemForecastOutput } from '@/core/engine/GroceryForecastEngine';

interface ItemInflationRowProps {
  item: ItemForecastOutput;
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
}

export const ItemInflationRow: React.FC<ItemInflationRowProps> = ({ item, scenario }) => {
  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const scenarioUnit =
    scenario === 'optimistic'
      ? item.optimisticUnit
      : scenario === 'realistic'
      ? item.realisticUnit
      : item.pessimisticUnit;

  const scenarioTotal =
    scenario === 'optimistic'
      ? item.optimisticTotal
      : scenario === 'realistic'
      ? item.realisticTotal
      : item.pessimisticTotal;

  const isHighInflation = item.expectedMonthlyInflationPct > 3.0;
  const isDeflation = item.expectedMonthlyInflationPct < -1.0;

  return (
    <div className="py-3.5 flex items-center justify-between gap-4 transition-colors hover:bg-surface-soft/40 px-2 rounded-lg -mx-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-medium text-ink truncate">
            {item.commercialName}
          </p>
          {isDeflation ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-soft border border-hairline text-[11px] font-semibold text-primary shrink-0">
              <TrendDown size={12} weight="bold" />
              {item.expectedMonthlyInflationPct.toFixed(1)}%
            </span>
          ) : isHighInflation ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-soft border border-hairline text-[11px] font-semibold text-scenario-pessimistic shrink-0">
              <WarningCircle size={12} weight="bold" />
              +{item.expectedMonthlyInflationPct.toFixed(1)}%
            </span>
          ) : null}
        </div>
        <p className="text-[13px] text-muted mt-0.5">
          {item.quantity} {item.baseUnit} · Pago ant. {formatBRL(item.lastPaidUnit)} · Menor em{' '}
          <span className="text-body font-medium">{item.cheapestStoreName}</span>
        </p>
      </div>

      <div className="text-right shrink-0 tabular-nums">
        <p className="text-[16px] font-semibold text-ink">
          {formatBRL(scenarioTotal)}
        </p>
        <p className="text-[13px] text-muted">
          {formatBRL(scenarioUnit)} / {item.baseUnit.toLowerCase()}
        </p>
      </div>
    </div>
  );
};
