'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash,
  MagnifyingGlass,
  Sparkle,
  Receipt,
  ListPlus,
  Brain,
  CheckCircle,
  X,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type {
  PantryReplenishmentReport,
  ReplenishmentRecommendation,
} from '@/core/engine/PantryReplenishmentEngine';

export interface CartItem {
  canonicalProductId: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  estimatedUnitPrice: number;
  replenishmentReason?: string;
  cadenceLabel?: string;
}

export interface CatalogProduct {
  id: string;
  commercialName: string;
  category: string;
  standardUnit: string;
  lastPrice: number;
  avgPrice: number;
}

export interface CustomBasketCartBuilderProps {
  initialItems?: CartItem[];
  onApplyCart: (items: Array<{ canonicalProductId: string; quantity: number }>) => void;
  onResetToReceipt: () => void;
  isCustomActive: boolean;
  isCalculating: boolean;
  userCity?: string;
}

export const CustomBasketCartBuilder: React.FC<CustomBasketCartBuilderProps> = ({
  initialItems = [],
  onApplyCart,
  onResetToReceipt,
  isCustomActive,
  isCalculating,
  userCity = 'Florianópolis',
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [smartReport, setSmartReport] = useState<PantryReplenishmentReport | null>(null);
  const [showStockedItems, setShowStockedItems] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = (await res.json()) as { products?: CatalogProduct[] };
          if (isMounted && Array.isArray(data.products)) {
            queueMicrotask(() => {
              setCatalog(data.products || []);
            });
          }
        }
      } catch {
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialItems.length > 0 && cartItems.length === 0) {
      queueMicrotask(() => {
        setCartItems(initialItems);
      });
    }
  }, [initialItems, cartItems.length]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog.slice(0, 6);
    const q = searchQuery.toLowerCase().trim();
    return catalog
      .filter(
        (p) =>
          p.commercialName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [catalog, searchQuery]);

  const quickStaples = useMemo(() => {
    return catalog.slice(0, 5);
  }, [catalog]);

  const handleAddItem = (prod: CatalogProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.canonicalProductId === prod.id);
      if (existing) {
        return prev.map((i) =>
          i.canonicalProductId === prod.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          canonicalProductId: prod.id,
          name: prod.commercialName,
          category: prod.category || 'Geral',
          unit: prod.standardUnit || 'UN',
          quantity: 1,
          estimatedUnitPrice: prod.lastPrice || prod.avgPrice || 15.0,
        },
      ];
    });
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleUpdateQty = (canonicalProductId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => {
          if (i.canonicalProductId === canonicalProductId) {
            const newQty = Math.max(1, i.quantity + delta);
            return { ...i, quantity: newQty };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveItem = (canonicalProductId: string) => {
    setCartItems((prev) => prev.filter((i) => i.canonicalProductId !== canonicalProductId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCalculate = () => {
    if (cartItems.length === 0) return;
    const payload = cartItems.map((i) => ({
      canonicalProductId: i.canonicalProductId,
      quantity: i.quantity,
    }));
    onApplyCart(payload);
  };

  const handleLoadSuggestions = async () => {
    queueMicrotask(() => {
      setIsLoadingSuggestions(true);
      setIsSuggestOpen(true);
    });

    try {
      const res = await fetch('/api/baskets/smart-suggest');
      if (res.ok) {
        const data = (await res.json()) as { success: boolean; report: PantryReplenishmentReport };
        if (data?.report) {
          queueMicrotask(() => {
            setSmartReport(data.report);
          });
        }
      }
    } catch {
    } finally {
      queueMicrotask(() => {
        setIsLoadingSuggestions(false);
      });
    }
  };

  const handleAddSuggestionItem = (item: ReplenishmentRecommendation) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.canonicalProductId === item.canonicalProductId);
      if (existing) {
        return prev.map((i) =>
          i.canonicalProductId === item.canonicalProductId
            ? {
                ...i,
                quantity: item.recommendedQuantity,
                replenishmentReason: item.reason,
                cadenceLabel: item.cadenceLabel,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          canonicalProductId: item.canonicalProductId,
          name: item.commercialName,
          category: item.category,
          unit: item.standardUnit,
          quantity: item.recommendedQuantity,
          estimatedUnitPrice: item.estimatedUnitPrice,
          replenishmentReason: item.reason,
          cadenceLabel: item.cadenceLabel,
        },
      ];
    });
  };

  const handleAddAllSuggestions = () => {
    if (!smartReport || smartReport.suggestedItems.length === 0) return;

    setCartItems((prev) => {
      const next = [...prev];
      for (const item of smartReport.suggestedItems) {
        const existingIndex = next.findIndex((i) => i.canonicalProductId === item.canonicalProductId);
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex]!,
            quantity: item.recommendedQuantity,
            replenishmentReason: item.reason,
            cadenceLabel: item.cadenceLabel,
          };
        } else {
          next.push({
            canonicalProductId: item.canonicalProductId,
            name: item.commercialName,
            category: item.category,
            unit: item.standardUnit,
            quantity: item.recommendedQuantity,
            estimatedUnitPrice: item.estimatedUnitPrice,
            replenishmentReason: item.reason,
            cadenceLabel: item.cadenceLabel,
          });
        }
      }
      return next;
    });

    setIsSuggestOpen(false);
  };

  const cartEstimatedTotal = cartItems.reduce(
    (acc, i) => acc + i.quantity * i.estimatedUnitPrice,
    0
  );

  return (
    <Card variant="bordered" className="p-5 sm:p-6 space-y-5 bg-canvas border-hairline">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} weight="bold" className="text-primary" />
            <h2 className="text-[18px] font-bold text-ink">
              Monte seu Carrinho de Compras
            </h2>
            {isCustomActive && (
              <Badge variant="optimistic" className="text-[11px] py-0.5 px-2">
                Previsão Ativa
              </Badge>
            )}
          </div>
          <p className="text-[13px] text-muted">
            Monte a sua lista de reposição. A plataforma estima custos e compara supermercados de {userCity}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadSuggestions}
            disabled={isLoadingSuggestions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-[12px] font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            {isLoadingSuggestions ? (
              <div className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
            ) : (
              <Brain size={15} weight="bold" />
            )}
            <span>Sugerir Lista Inteligente</span>
          </button>

          {isCustomActive && (
            <button
              type="button"
              onClick={onResetToReceipt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline text-[12px] font-medium text-muted hover:text-ink hover:bg-surface-soft transition-colors"
            >
              <Receipt size={14} weight="bold" />
              <span>Usar Última Nota Fiscal</span>
            </button>
          )}

          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="text-[12px] text-muted hover:text-danger transition-colors px-2 py-1"
            >
              Limpar lista
            </button>
          )}
        </div>
      </div>

      {isSuggestOpen && smartReport && (
        <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-primary/15">
            <div>
              <div className="flex items-center gap-2">
                <Brain size={18} weight="bold" className="text-primary" />
                <h3 className="text-[15px] font-bold text-ink">
                  Reposição Heurística da Despensa
                </h3>
                <Badge variant="optimistic" className="text-[11px] py-0.5">
                  Baseado em Cadência Real
                </Badge>
              </div>
              <p className="text-[12px] text-muted mt-0.5">
                Cálculo determinístico por intervalo de compra e consumo médio nas suas notas fiscais.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {smartReport.suggestedItems.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddAllSuggestions}
                  className="gap-1.5 rounded-full text-[12px] h-8 px-3"
                >
                  <CheckCircle size={14} weight="bold" />
                  <span>Adicionar Todos ({smartReport.suggestedItems.length})</span>
                </Button>
              )}
              <button
                type="button"
                onClick={() => setIsSuggestOpen(false)}
                className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-soft transition-colors"
                aria-label="Fechar painel de sugestões"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg border border-hairline bg-canvas">
              <span className="text-[11px] text-muted block">Itens para repor</span>
              <strong className="text-[16px] font-bold text-ink tabular-nums">
                {smartReport.suggestedItems.length}
              </strong>
            </div>
            <div className="p-2.5 rounded-lg border border-hairline bg-canvas">
              <span className="text-[11px] text-muted block">Custo estimado</span>
              <strong className="text-[16px] font-bold text-ink tabular-nums">
                {formatBRL(smartReport.totalSuggestedCost)}
              </strong>
            </div>
            <div className="p-2.5 rounded-lg border border-hairline bg-canvas col-span-2 sm:col-span-1">
              <span className="text-[11px] text-muted block">Itens abastecidos</span>
              <strong className="text-[16px] font-bold text-ink tabular-nums">
                {smartReport.stockedItems.length}
              </strong>
            </div>
          </div>

          {smartReport.suggestedItems.length === 0 ? (
            <div className="p-4 text-center text-[13px] text-muted bg-canvas rounded-lg border border-hairline">
              Sua despensa está em dia! Todos os itens consumidos recentemente ainda têm estoque estimado.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {smartReport.suggestedItems.map((item) => (
                <div
                  key={item.canonicalProductId}
                  className="p-3 rounded-lg border border-hairline bg-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-ink">{item.commercialName}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-soft text-muted font-medium">
                        {item.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.status === 'DEPLETED'
                            ? 'bg-danger/10 text-danger border border-danger/20'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}
                      >
                        {item.status === 'DEPLETED' ? 'Estoque Esgotado' : 'Estoque Baixo'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">{item.reason}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right tabular-nums">
                      <span className="block text-[11px] text-muted">
                        {item.recommendedQuantity} {item.standardUnit} × {formatBRL(item.estimatedUnitPrice)}
                      </span>
                      <strong className="text-[13px] font-bold text-ink">
                        {formatBRL(item.estimatedRestockCost)}
                      </strong>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddSuggestionItem(item)}
                      className="gap-1 text-[11px] h-7 px-2.5 rounded-full"
                    >
                      <Plus size={12} weight="bold" />
                      <span>Adicionar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {smartReport.stockedItems.length > 0 && (
            <div className="pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={() => setShowStockedItems((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink font-medium transition-colors"
              >
                {showStockedItems ? (
                  <CaretUp size={12} weight="bold" />
                ) : (
                  <CaretDown size={12} weight="bold" />
                )}
                <span>
                  {showStockedItems
                    ? 'Ocultar itens abastecidos'
                    : `Ver ${smartReport.stockedItems.length} itens abastecidos (estoque em dia)`}
                </span>
              </button>

              {showStockedItems && (
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {smartReport.stockedItems.map((item) => (
                    <div
                      key={item.canonicalProductId}
                      className="p-2.5 rounded-md border border-hairline/60 bg-surface-soft/40 flex items-center justify-between gap-2 text-[12px]"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-ink truncate block">
                          {item.commercialName}
                        </span>
                        <span className="text-[11px] text-muted">{item.reason}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-medium text-primary">
                          +{item.daysRemainingEstimate} dias
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <div className="relative flex items-center">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3.5 text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Digite o nome do produto para adicionar ao carrinho (ex: Arroz, Leite, Feijão)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-hairline text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-ink bg-surface-soft/40"
            />
          </div>

          {isSearchOpen && filteredCatalog.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsSearchOpen(false)}
              />
              <div className="absolute left-0 right-0 top-12 z-30 bg-canvas border border-hairline rounded-lg shadow-lg max-h-64 overflow-y-auto divide-y divide-hairline-soft">
                {filteredCatalog.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddItem(prod)}
                    className="w-full p-3 text-left hover:bg-surface-soft flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-ink truncate">
                        {prod.commercialName}
                      </p>
                      <span className="text-[11px] text-muted">
                        {prod.category} · {prod.standardUnit}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[13px] font-bold text-ink tabular-nums">
                        {formatBRL(prod.lastPrice || prod.avgPrice || 15.0)}
                      </span>
                      <span className="block text-[11px] text-primary flex items-center justify-end gap-1 font-medium">
                        <Plus size={12} weight="bold" /> Adicionar
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {quickStaples.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
            <span className="text-muted mr-1">Sugestões rápidas:</span>
            {quickStaples.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAddItem(p)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-hairline bg-surface-soft hover:bg-surface-strong text-ink text-[12px] transition-colors"
              >
                <Plus size={11} weight="bold" className="text-primary" />
                <span className="truncate max-w-[120px]">{p.commercialName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="p-8 text-center rounded-lg border border-dashed border-hairline bg-surface-soft/30 space-y-2">
          <ListPlus size={32} weight="bold" className="text-muted mx-auto" />
          <p className="text-[14px] font-medium text-ink">Seu carrinho de previsão está vazio</p>
          <p className="text-[12px] text-muted max-w-sm mx-auto">
            Adicione itens ou clique em &quot;Sugerir Lista Inteligente&quot; para preencher automaticamente com os produtos que estão na hora de repor.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="divide-y divide-hairline-soft border border-hairline rounded-lg overflow-hidden bg-canvas">
            {cartItems.map((item) => (
              <div
                key={item.canonicalProductId}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 text-[13px] hover:bg-surface-soft/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-ink truncate">{item.name}</p>
                    {item.cadenceLabel && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                        {item.cadenceLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted truncate">
                    {item.category} · Ref: {formatBRL(item.estimatedUnitPrice)} / {item.unit.toLowerCase()}
                    {item.replenishmentReason ? ` · ${item.replenishmentReason}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center border border-hairline rounded-md bg-canvas overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.canonicalProductId, -1)}
                      className="w-7 h-7 flex items-center justify-center text-ink hover:bg-surface-soft transition-colors"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={12} weight="bold" />
                    </button>
                    <span className="w-8 text-center font-bold text-ink tabular-nums text-[13px]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.canonicalProductId, 1)}
                      className="w-7 h-7 flex items-center justify-center text-ink hover:bg-surface-soft transition-colors"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={12} weight="bold" />
                    </button>
                  </div>

                  <div className="text-right w-20 tabular-nums">
                    <strong className="block text-ink font-bold text-[14px]">
                      {formatBRL(item.quantity * item.estimatedUnitPrice)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.canonicalProductId)}
                    className="p-1.5 text-muted hover:text-danger transition-colors rounded"
                    aria-label="Remover item"
                  >
                    <Trash size={15} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-surface-soft border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[12px] text-muted block">
                Total estimado de referência ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}):
              </span>
              <strong className="text-[20px] font-bold text-ink tabular-nums">
                {formatBRL(cartEstimatedTotal)}
              </strong>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleCalculate}
              disabled={isCalculating || cartItems.length === 0}
              className="gap-2 shrink-0 rounded-full"
            >
              {isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Calculando Previsão...</span>
                </>
              ) : (
                <>
                  <Sparkle size={16} weight="bold" />
                  <span>Calcular Previsão com este Carrinho</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
