'use client';

import React, { useState } from 'react';
import { QrCode, ArrowUpRight, Star, ShoppingBagOpen } from '@phosphor-icons/react';
import { BasketForecastReport } from '@/core/engine/GroceryForecastEngine';
import { ForecastScenarioHero } from './ForecastScenarioHero';
import { ItemInflationRow } from './ItemInflationRow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface ForecastMarketplaceViewProps {
  report: BasketForecastReport;
  targetMonthName: string;
  onScanNewReceipt: () => void;
  userCity?: string;
}

export const ForecastMarketplaceView: React.FC<ForecastMarketplaceViewProps> = ({
  report,
  targetMonthName,
  onScanNewReceipt,
  userCity = 'Santa Catarina',
}) => {
  const [selectedScenario, setSelectedScenario] = useState<
    'optimistic' | 'realistic' | 'pessimistic'
  >('realistic');

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const activeTotal =
    selectedScenario === 'optimistic'
      ? report.optimisticBasketTotal
      : selectedScenario === 'realistic'
      ? report.realisticBasketTotal
      : report.pessimisticBasketTotal;

  const activeDelta = activeTotal - report.lastPaidBasketTotal;

  if (report.items.length === 0) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Card variant="bordered" className="max-w-md p-8 text-center space-y-4">
          <ShoppingBagOpen size={48} weight="bold" className="text-muted mx-auto" />
          <h2 className="text-[20px] font-bold text-ink">Nenhuma Cesta Base Selecionada</h2>
          <p className="text-[14px] text-muted">
            Escaneie seu primeiro cupom fiscal para gerar a previsão dos 3 cenários e a arbitragem de supermercados.
          </p>
          <Button variant="primary" onClick={onScanNewReceipt} className="w-full gap-2">
            <QrCode size={18} weight="bold" />
            <span>Escanear Primeiro Cupom</span>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <ForecastScenarioHero
            inflationPct={report.projectedMonthlyInflationPct}
            lastPaidTotal={report.lastPaidBasketTotal}
            bestSingleStoreName={report.splitCartAnalysis.bestSingleStoreName}
            isWorthSplitting={report.splitCartAnalysis.isWorthSplitting}
            netSavings={report.splitCartAnalysis.netSavings}
          />

          <section className="py-2 border-b border-hairline">
              <h2 className="text-[21px] font-bold leading-[1.40] text-ink mb-4">
                Onde comprar em {targetMonthName}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card variant="bordered" interactive className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="neutral">Menor atrito (1 viagem)</Badge>
                    <div className="flex items-center gap-1 text-[14px] font-semibold text-ink">
                      <Star size={14} weight="fill" />
                      <span>4.92</span>
                    </div>
                  </div>
                  <h3 className="text-[16px] font-semibold text-ink">
                    {report.splitCartAnalysis.bestSingleStoreName}
                  </h3>
                  <p className="text-[14px] text-muted mt-1">
                    Cesta completa concentrada em um único CNPJ
                  </p>
                  <div className="mt-4 pt-4 border-t border-hairline-soft flex items-baseline justify-between">
                    <span className="text-[14px] text-muted">Total estimado</span>
                    <strong className="text-[16px] font-semibold text-ink tabular-nums">
                      {formatBRL(report.splitCartAnalysis.bestSingleStoreTotal)}
                    </strong>
                  </div>
                </Card>

                <Card variant="bordered" interactive className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={report.splitCartAnalysis.isWorthSplitting ? 'optimistic' : 'neutral'}>
                      {report.splitCartAnalysis.isWorthSplitting
                        ? 'Recomendado após pedágio'
                        : 'Economia não paga deslocamento'}
                    </Badge>
                  </div>
                  <h3 className="text-[16px] font-semibold text-ink">
                    {report.splitCartAnalysis.storePairNames
                      ? `${report.splitCartAnalysis.storePairNames[0]} + ${report.splitCartAnalysis.storePairNames[1]}`
                      : 'Aguardando 2º mercado'}
                  </h3>
                  <p className="text-[14px] text-muted mt-1">
                    Inclui pedágio de {formatBRL(report.splitCartAnalysis.transitCostPenalty)} de transporte
                  </p>
                  <div className="mt-4 pt-4 border-t border-hairline-soft flex items-baseline justify-between">
                    <span className="text-[14px] text-muted">Economia líquida real</span>
                    <strong className="text-[16px] font-semibold text-primary tabular-nums">
                      {formatBRL(report.splitCartAnalysis.netSavings)}
                    </strong>
                  </div>
                </Card>
              </div>
            </section>

            <section className="py-4">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-[21px] font-bold leading-[1.40] text-ink">
                  Itens da cesta ({report.items.length})
                </h2>
                <span className="text-[14px] text-muted">
                  Exibindo cenário:{' '}
                  <strong className="text-ink capitalize">
                    {selectedScenario === 'optimistic'
                      ? 'Otimista'
                      : selectedScenario === 'realistic'
                      ? 'Realista'
                      : 'Pessimista'}
                  </strong>
                </span>
              </div>

              <div className="divide-y divide-hairline-soft border-t border-b border-hairline">
                {report.items.map((item, idx) => (
                  <ItemInflationRow
                    key={`${item.canonicalProductId}-${idx}`}
                    item={item}
                    scenario={selectedScenario}
                  />
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28">
            <Card variant="elevated" className="p-6">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-[21px] font-bold text-ink tabular-nums">
                    {formatBRL(activeTotal)}
                  </span>
                  <span className="text-[14px] text-muted ml-1.5">
                    estimado em {targetMonthName}
                  </span>
                </div>
                <span className="text-[13px] font-medium text-muted tabular-nums">
                  {activeDelta >= 0 ? `+${formatBRL(activeDelta)}` : formatBRL(activeDelta)}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="Cenários de Previsão"
                className="space-y-2.5 mb-5"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedScenario === 'optimistic'}
                  onClick={() => setSelectedScenario('optimistic')}
                  className={`w-full p-3.5 rounded-lg border text-left transition-all flex items-center justify-between gap-3 ${
                    selectedScenario === 'optimistic'
                      ? 'border-scenario-optimistic bg-scenario-optimistic/5 shadow-xs ring-1 ring-scenario-optimistic'
                      : 'border-hairline hover:border-hairline-strong bg-canvas'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          selectedScenario === 'optimistic'
                            ? 'bg-scenario-optimistic'
                            : 'bg-muted/40'
                        }`}
                      />
                      <span className="text-[13px] font-bold text-ink">Cenário Otimista</span>
                    </div>
                    <span className="block text-[11px] text-muted mt-0.5 truncate pl-4.5">
                      Melhores ofertas da região
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <strong className="block text-[16px] font-bold text-scenario-optimistic tabular-nums">
                      {formatBRL(report.optimisticBasketTotal)}
                    </strong>
                    <span className="block text-[11px] text-muted tabular-nums">
                      {report.optimisticBasketTotal < report.lastPaidBasketTotal
                        ? `-${formatBRL(report.lastPaidBasketTotal - report.optimisticBasketTotal)}`
                        : 'Preço piso'}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedScenario === 'realistic'}
                  onClick={() => setSelectedScenario('realistic')}
                  className={`w-full p-3.5 rounded-lg border text-left transition-all flex items-center justify-between gap-3 ${
                    selectedScenario === 'realistic'
                      ? 'border-ink bg-surface-soft shadow-xs ring-1 ring-ink'
                      : 'border-hairline hover:border-hairline-strong bg-canvas'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          selectedScenario === 'realistic' ? 'bg-ink' : 'bg-muted/40'
                        }`}
                      />
                      <span className="text-[13px] font-bold text-ink">Cenário Realista</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-strong text-muted">
                        Padrão
                      </span>
                    </div>
                    <span className="block text-[11px] text-muted mt-0.5 truncate pl-4.5">
                      Média histórica ponderada
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <strong className="block text-[16px] font-bold text-ink tabular-nums">
                      {formatBRL(report.realisticBasketTotal)}
                    </strong>
                    <span className="block text-[11px] text-muted tabular-nums">
                      {report.realisticBasketTotal >= report.lastPaidBasketTotal
                        ? `+${formatBRL(report.realisticBasketTotal - report.lastPaidBasketTotal)}`
                        : formatBRL(report.realisticBasketTotal - report.lastPaidBasketTotal)}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedScenario === 'pessimistic'}
                  onClick={() => setSelectedScenario('pessimistic')}
                  className={`w-full p-3.5 rounded-lg border text-left transition-all flex items-center justify-between gap-3 ${
                    selectedScenario === 'pessimistic'
                      ? 'border-scenario-pessimistic bg-scenario-pessimistic/5 shadow-xs ring-1 ring-scenario-pessimistic'
                      : 'border-hairline hover:border-hairline-strong bg-canvas'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          selectedScenario === 'pessimistic'
                            ? 'bg-scenario-pessimistic'
                            : 'bg-muted/40'
                        }`}
                      />
                      <span className="text-[13px] font-bold text-ink">Cenário Pessimista</span>
                    </div>
                    <span className="block text-[11px] text-muted mt-0.5 truncate pl-4.5">
                      Picos e sazonalidade alta
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <strong className="block text-[16px] font-bold text-scenario-pessimistic tabular-nums">
                      {formatBRL(report.pessimisticBasketTotal)}
                    </strong>
                    <span className="block text-[11px] text-muted tabular-nums">
                      +{formatBRL(report.pessimisticBasketTotal - report.lastPaidBasketTotal)}
                    </span>
                  </div>
                </button>
              </div>

              <div className="p-3 rounded-lg border border-hairline bg-surface-soft flex items-center justify-between mb-5">
                <div className="min-w-0 pr-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                    Estratégia Recomendada
                  </span>
                  <span className="text-[13px] font-medium text-ink truncate block">
                    {report.splitCartAnalysis.isWorthSplitting
                      ? 'Dividir carrinho em 2 mercados'
                      : `Comprar tudo em ${report.splitCartAnalysis.bestSingleStoreName}`}
                  </span>
                </div>
                <ArrowUpRight size={16} weight="bold" className="text-ink shrink-0" />
              </div>

              <Button
                variant="primary"
                onClick={onScanNewReceipt}
                className="w-full gap-2"
              >
                <QrCode size={20} weight="bold" />
                <span>Escanear nova nota fiscal</span>
              </Button>

              <p className="text-center text-[13px] text-muted mt-3">
                Cada nota escaneada melhora a precisão e libera +7 dias Pro
              </p>

              <div className="mt-6 pt-4 border-t border-hairline space-y-3 text-[14px]">
                <div className="flex justify-between text-body">
                  <span className="underline decoration-hairline">
                    Custo pago na nota base
                  </span>
                  <span className="tabular-nums">{formatBRL(report.lastPaidBasketTotal)}</span>
                </div>

                <div className="flex justify-between text-body">
                  <span className="underline decoration-hairline">
                    Variação projetada ({selectedScenario})
                  </span>
                  <span className="tabular-nums">
                    {activeDelta >= 0 ? `+${formatBRL(activeDelta)}` : formatBRL(activeDelta)}
                  </span>
                </div>

                <div className="flex justify-between text-body">
                  <span className="underline decoration-hairline">
                    Economia potencial (Carrinho Dividido)
                  </span>
                  <span className="text-primary font-medium tabular-nums">
                    -{formatBRL(report.splitCartAnalysis.netSavings)}
                  </span>
                </div>

                <div className="pt-3 border-t border-hairline flex justify-between text-[16px] font-semibold text-ink">
                  <span>Orçamento sugerido ({targetMonthName})</span>
                  <span className="tabular-nums">{formatBRL(activeTotal)}</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
  );
};
