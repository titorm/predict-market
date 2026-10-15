'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkle,
  TrendUp,
  Storefront,
  ArrowsSplit,
  CheckCircle,
  CurrencyCircleDollar,
  ShoppingBag,
  Info,
  Car,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type {
  BasketForecastReport,
  ItemForecastOutput,
} from '@/core/engine/GroceryForecastEngine';

export interface ForecastResultsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  report: BasketForecastReport | null;
  isCalculating: boolean;
  cartItemCount: number;
}

export const ForecastResultsDrawer: React.FC<ForecastResultsDrawerProps> = ({
  isOpen,
  onClose,
  report,
  isCalculating,
  cartItemCount,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<'optimistic' | 'realistic' | 'pessimistic'>('realistic');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const splitAnalysis = report?.splitCartAnalysis;
  const allocationsByStore = splitAnalysis?.allocations
    ? splitAnalysis.allocations.reduce<Record<string, typeof splitAnalysis.allocations>>((acc, item) => {
        const store = item.assignedStoreName || 'Supermercado';
        if (!acc[store]) acc[store] = [];
        acc[store].push(item);
        return acc;
      }, {})
    : {};

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="forecast-drawer-title"
          className="w-screen max-w-md sm:max-w-xl bg-canvas border-l border-hairline shadow-2xl flex flex-col min-h-full transform transition-transform duration-300 ease-out"
        >
          <div className="p-5 sm:p-6 border-b border-hairline flex items-start justify-between gap-4 bg-canvas sticky top-0 z-10">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Sparkle size={20} weight="bold" className="text-primary" />
                <h2
                  id="forecast-drawer-title"
                  className="text-[17px] font-bold text-ink truncate"
                >
                  Previsão e Estratégia de Compra
                </h2>
              </div>
              <p className="text-[13px] text-muted">
                Simulação de {cartItemCount} {cartItemCount === 1 ? 'produto' : 'produtos'} cruzando supermercados da sua região.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 text-muted hover:text-ink hover:bg-surface-soft rounded-lg transition-colors"
              aria-label="Fechar painel de previsão"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {isCalculating ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-[14px] font-semibold text-ink">
                  Cruzando preços de atacado e varejo...
                </p>
                <p className="text-[12px] text-muted max-w-xs">
                  Calculando inflação EWMA, penalidade de transporte e arbitragem de lojas em Florianópolis.
                </p>
              </div>
            ) : !report ? (
              <div className="py-16 text-center text-[13px] text-muted">
                Nenhum dado de previsão disponível para este carrinho.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-ink">
                      Cenários Projetados para a Cesta
                    </span>
                    <span className="text-[11px] text-muted">
                      Base: {formatBRL(report.lastPaidBasketTotal)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedScenario('realistic')}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-4 ${
                        selectedScenario === 'realistic'
                          ? 'border-primary bg-primary/[0.04] ring-1 ring-primary'
                          : 'border-hairline bg-canvas hover:bg-surface-soft'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-ink">Cenário Realista</span>
                          <Badge variant="optimistic" className="text-[10px] py-0 px-1.5">
                            Recomendado
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted">
                          Inflação esperada de {(report.projectedMonthlyInflationPct * 100).toFixed(1)}% no mês alvo.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <strong className="text-[18px] font-bold text-ink tabular-nums block">
                          {formatBRL(report.realisticBasketTotal)}
                        </strong>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedScenario('optimistic')}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-4 ${
                        selectedScenario === 'optimistic'
                          ? 'border-primary bg-primary/[0.04] ring-1 ring-primary'
                          : 'border-hairline bg-canvas hover:bg-surface-soft'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-[13px] font-bold text-ink">Cenário Otimista</span>
                        <p className="text-[11px] text-muted">
                          Aproveitando todas as promoções e pisos históricos.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <strong className="text-[18px] font-bold text-success tabular-nums block">
                          {formatBRL(report.optimisticBasketTotal)}
                        </strong>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedScenario('pessimistic')}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-4 ${
                        selectedScenario === 'pessimistic'
                          ? 'border-primary bg-primary/[0.04] ring-1 ring-primary'
                          : 'border-hairline bg-canvas hover:bg-surface-soft'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-[13px] font-bold text-ink">Cenário Pessimista</span>
                        <p className="text-[11px] text-muted">
                          Teto de volatilidade e repasse máximo de preços.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <strong className="text-[18px] font-bold text-muted tabular-nums block">
                          {formatBRL(report.pessimisticBasketTotal)}
                        </strong>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Storefront size={18} weight="bold" className="text-primary" />
                    <h3 className="text-[14px] font-bold text-ink">
                      Qual o melhor caminho para economizar?
                    </h3>
                  </div>

                  {splitAnalysis && (
                    <div className="space-y-3">
                      <Card
                        variant="bordered"
                        className={`p-4 space-y-2.5 transition-colors ${
                          !splitAnalysis.isWorthSplitting
                            ? 'border-success/60 bg-success/[0.03]'
                            : 'border-hairline bg-canvas'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Storefront size={16} weight="bold" className="text-ink" />
                            <span className="text-[13px] font-bold text-ink">
                              Opção 1: Comprar Tudo em um Mercado Só
                            </span>
                          </div>
                          {!splitAnalysis.isWorthSplitting && (
                            <Badge variant="optimistic" className="text-[10px] py-0.5">
                              Melhor Escolha
                            </Badge>
                          )}
                        </div>

                        <div className="p-3 rounded-lg bg-surface-soft/60 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[11px] text-muted block">Supermercado mais barato</span>
                            <strong className="text-[14px] font-bold text-ink">
                              {splitAnalysis.bestSingleStoreName}
                            </strong>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-muted block">Total da cesta</span>
                            <strong className="text-[15px] font-bold text-ink tabular-nums">
                              {formatBRL(splitAnalysis.bestSingleStoreTotal)}
                            </strong>
                          </div>
                        </div>

                        <p className="text-[11px] text-muted">
                          Ideal para economizar tempo e combustível fazendo uma única parada.
                        </p>
                      </Card>

                      <Card
                        variant="bordered"
                        className={`p-4 space-y-3 transition-colors ${
                          splitAnalysis.isWorthSplitting
                            ? 'border-primary/60 bg-primary/[0.03]'
                            : 'border-hairline bg-canvas'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <ArrowsSplit size={16} weight="bold" className="text-primary" />
                            <span className="text-[13px] font-bold text-ink">
                              Opção 2: Dividir Carrinho entre 2 Mercados
                            </span>
                          </div>
                          {splitAnalysis.isWorthSplitting && (
                            <Badge variant="optimistic" className="text-[10px] py-0.5">
                              Maior Economia
                            </Badge>
                          )}
                        </div>

                        {splitAnalysis.isWorthSplitting ? (
                          <>
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-bold text-primary">
                                  Economia Líquida Real:
                                </span>
                                <strong className="text-[16px] font-bold text-primary tabular-nums">
                                  +{formatBRL(splitAnalysis.netSavings)}
                                </strong>
                              </div>
                              <p className="text-[11px] text-muted">
                                Já descontada a taxa de combustível/deslocamento ({formatBRL(splitAnalysis.transitCostPenalty)}).
                              </p>
                            </div>

                            <div className="space-y-2 pt-1">
                              <span className="text-[12px] font-bold text-ink block">
                                O que comprar em cada supermercado:
                              </span>

                              {Object.entries(allocationsByStore).map(([storeName, items]) => {
                                const storeSubtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
                                return (
                                  <div
                                    key={storeName}
                                    className="p-3 rounded-lg border border-hairline bg-canvas space-y-2"
                                  >
                                    <div className="flex items-center justify-between border-b border-hairline-soft pb-1.5">
                                      <strong className="text-[12px] font-bold text-ink">
                                        {storeName} ({items.length} {items.length === 1 ? 'item' : 'itens'})
                                      </strong>
                                      <span className="text-[12px] font-bold text-ink tabular-nums">
                                        {formatBRL(storeSubtotal)}
                                      </span>
                                    </div>
                                    <ul className="space-y-1 text-[11px] text-muted">
                                      {items.map((i) => (
                                        <li key={i.canonicalProductId} className="flex justify-between">
                                          <span className="truncate max-w-[220px]">
                                            {i.quantity}× {i.commercialName}
                                          </span>
                                          <span className="font-medium text-ink tabular-nums">
                                            {formatBRL(i.subtotal)}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="p-3 rounded-lg bg-surface-soft/60 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-ink text-[12px] font-semibold">
                              <Info size={14} weight="bold" />
                              <span>Não vale a pena dividir para esta lista</span>
                            </div>
                            <p className="text-[11px] text-muted leading-relaxed">
                              A diferença de preço entre os supermercados ({formatBRL(splitAnalysis.bestSingleStoreTotal - splitAnalysis.rawSplitTotal)}) não compensa a despesa de transporte estimada de {formatBRL(splitAnalysis.transitCostPenalty)}. O melhor é comprar tudo no {splitAnalysis.bestSingleStoreName}.
                            </p>
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-[13px] font-bold text-ink block">
                    Preços e Onde Encontrar Mais Barato
                  </span>

                  <div className="divide-y divide-hairline-soft border border-hairline rounded-lg overflow-hidden bg-canvas">
                    {report.items.map((item) => {
                      const unitPrice =
                        selectedScenario === 'optimistic'
                          ? item.optimisticUnit
                          : selectedScenario === 'pessimistic'
                          ? item.pessimisticUnit
                          : item.realisticUnit;

                      const totalPrice =
                        selectedScenario === 'optimistic'
                          ? item.optimisticTotal
                          : selectedScenario === 'pessimistic'
                          ? item.pessimisticTotal
                          : item.realisticTotal;

                      return (
                        <div
                          key={item.canonicalProductId}
                          className="p-3 flex items-center justify-between gap-3 text-[12px] hover:bg-surface-soft/30 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-ink truncate block">
                              {item.commercialName}
                            </span>
                            <span className="text-[11px] text-muted">
                              {item.quantity} {item.baseUnit} · Mais barato no {item.cheapestStoreName}
                            </span>
                          </div>

                          <div className="text-right shrink-0 tabular-nums">
                            <strong className="block text-[13px] font-bold text-ink">
                              {formatBRL(totalPrice)}
                            </strong>
                            <span className="text-[10px] text-muted">
                              {formatBRL(unitPrice)} / {item.baseUnit.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-4 sm:p-5 border-t border-hairline bg-canvas flex items-center justify-between gap-3 shrink-0">
            <span className="text-[12px] text-muted">
              Previsão calculada com base estatística regional.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-hairline bg-surface-soft hover:bg-surface-strong text-ink text-[12px] font-medium transition-colors"
            >
              Fechar Painel
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
