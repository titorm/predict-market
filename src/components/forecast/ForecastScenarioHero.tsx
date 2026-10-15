import React from 'react';
import { TrendUp, TrendDown, Minus, Storefront, Receipt, ArrowsSplit } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ForecastScenarioHeroProps {
  inflationPct: number;
  lastPaidTotal: number;
  bestSingleStoreName: string;
  isWorthSplitting: boolean;
  netSavings: number;
}

export const ForecastScenarioHero: React.FC<ForecastScenarioHeroProps> = ({
  inflationPct,
  lastPaidTotal,
  bestSingleStoreName,
  isWorthSplitting,
  netSavings,
}) => {
  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const isDeflation = inflationPct < -0.2;
  const isStable = Math.abs(inflationPct) <= 0.2;

  return (
    <Card variant="bordered" className="p-6 sm:p-8 bg-surface-soft/60">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="flex justify-center">
          {isDeflation ? (
            <Badge variant="optimistic" className="gap-1.5 py-1 px-3 text-[12px]">
              <TrendDown size={14} weight="bold" />
              <span>Economia Projetada na Cesta</span>
            </Badge>
          ) : isStable ? (
            <Badge variant="neutral" className="gap-1.5 py-1 px-3 text-[12px]">
              <Minus size={14} weight="bold" />
              <span>Preços Estáveis</span>
            </Badge>
          ) : (
            <Badge variant="pessimistic" className="gap-1.5 py-1 px-3 text-[12px]">
              <TrendUp size={14} weight="bold" />
              <span>Pressão Inflacionária Prevista</span>
            </Badge>
          )}
        </div>

        <div className="inline-flex items-baseline justify-center">
          <span className="text-[52px] sm:text-[60px] font-bold leading-none tracking-tight text-ink tabular-nums">
            {inflationPct > 0 ? '+' : ''}
            {inflationPct.toFixed(1)}%
          </span>
        </div>

        <h2 className="text-[17px] font-semibold text-ink">
          Variação Média Projetada na sua Despensa
        </h2>
        <p className="text-[13px] text-muted max-w-md mx-auto leading-relaxed">
          Média ponderada baseada nos itens da sua cesta e no histórico real de preços dos supermercados locais.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-hairline">
        <div className="bg-canvas p-3.5 sm:p-4 rounded-lg border border-hairline/80 flex flex-col justify-between min-w-0">
          <div className="flex items-center gap-1.5 text-muted text-[11px] font-bold uppercase tracking-wider mb-1">
            <Receipt size={14} weight="bold" />
            <span>Última Nota</span>
          </div>
          <strong className="text-[17px] sm:text-[18px] font-bold text-ink tabular-nums mt-1 truncate">
            {formatBRL(lastPaidTotal)}
          </strong>
          <span className="text-[11px] text-muted mt-0.5 truncate">Valor pago de referência</span>
        </div>

        <div className="bg-canvas p-3.5 sm:p-4 rounded-lg border border-hairline/80 flex flex-col justify-between min-w-0">
          <div className="flex items-center gap-1.5 text-muted text-[11px] font-bold uppercase tracking-wider mb-1">
            <Storefront size={14} weight="bold" />
            <span>Melhor Mercado Único</span>
          </div>
          <strong className="text-[17px] sm:text-[18px] font-bold text-ink truncate mt-1">
            {bestSingleStoreName}
          </strong>
          <span className="text-[11px] text-muted mt-0.5 truncate">Menor atrito (1 parada)</span>
        </div>

        <div className="bg-canvas p-3.5 sm:p-4 rounded-lg border border-hairline/80 flex flex-col justify-between min-w-0">
          <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold uppercase tracking-wider mb-1">
            <ArrowsSplit size={14} weight="bold" />
            <span>Carrinho Dividido</span>
          </div>
          <strong className="text-[17px] sm:text-[18px] font-bold text-primary tabular-nums mt-1 truncate">
            {isWorthSplitting ? `Poupa ${formatBRL(netSavings)}` : '1 mercado ideal'}
          </strong>
          <span className="text-[11px] text-muted mt-0.5 truncate">
            {isWorthSplitting ? 'Já descontado deslocamento' : 'Deslocamento não compensa'}
          </span>
        </div>
      </div>
    </Card>
  );
};
