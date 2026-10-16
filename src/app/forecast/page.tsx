'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Receipt,
  Brain,
  Plus,
  Minus,
  Trash,
  MagnifyingGlass,
  Sparkle,
  QrCode,
  ArrowRight,
  ListPlus,
  CheckCircle,
  CaretDown,
  CaretUp,
  X,
  Storefront,
  Info,
} from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useToast } from '@/components/ui/Toast';
import { ForecastResultsDrawer } from '@/components/forecast/ForecastResultsDrawer';
import { PredictMarketLoader } from '@/components/ui/PredictMarketLoader';
import { classifyProductsWithBrowserAI } from '@/core/categorization/LocalProductCategorizer';
import type {
  BasketForecastReport,
} from '@/core/engine/GroceryForecastEngine';
import type {
  PantryReplenishmentReport,
  ReplenishmentRecommendation,
} from '@/core/engine/PantryReplenishmentEngine';

interface CartItem {
  canonicalProductId: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  estimatedUnitPrice: number;
  origin?: string;
  cadenceLabel?: string;
}

interface AvailableReceipt {
  id: string;
  trade_name?: string;
  city?: string;
  issued_at?: string;
  total_amount?: number | string;
  items_count?: number | string;
  issuedAt?: string;
  totalAmount?: number | string;
  netAmount?: number | string;
  itemsCount?: number | string;
  store?: {
    id?: string;
    name?: string;
    corporateName?: string;
    city?: string;
  };
}

interface CatalogProduct {
  id: string;
  commercialName: string;
  category: string;
  standardUnit: string;
  lastPrice: number;
  avgPrice: number;
}

interface ReceiptDetailItem {
  id?: string;
  canonical_product_id?: string | null;
  canonicalProductId?: string | null;
  commercial_name?: string | null;
  commercialName?: string | null;
  raw_description?: string;
  rawDescription?: string;
  category?: string | null;
  standard_unit?: string | null;
  standardUnit?: string | null;
  unit_of_measure?: string;
  unitOfMeasure?: string;
  quantity: number | string;
  unit_price?: number | string;
  unitPrice?: number | string;
}

export default function ForecastCartPage() {
  const toast = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [receiptsList, setReceiptsList] = useState<AvailableReceipt[]>([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const [isLoadingReceipt, setIsLoadingReceipt] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [smartReport, setSmartReport] = useState<PantryReplenishmentReport | null>(null);
  const [showStockedItems, setShowStockedItems] = useState(false);

  const [forecastReport, setForecastReport] = useState<BasketForecastReport | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [userCity, setUserCity] = useState('Florianópolis');

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [catRes, recRes, profRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/receipts'),
          fetch('/api/profile'),
        ]);

        if (catRes.ok) {
          const data = (await catRes.json()) as { products?: CatalogProduct[] };
          if (isMounted && Array.isArray(data.products)) {
            const { items, corrections } = await classifyProductsWithBrowserAI(
              data.products
            );
            if (isMounted) {
              queueMicrotask(() => {
                setCatalog(items);
              });
            }
            if (corrections.length > 0) {
              fetch('/api/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ corrections }),
              }).catch(() => {});
            }
          }
        }

        if (recRes.ok) {
          const data = (await recRes.json()) as { receipts?: AvailableReceipt[] };
          if (isMounted && Array.isArray(data.receipts)) {
            queueMicrotask(() => {
              setReceiptsList(data.receipts || []);
              if (data.receipts && data.receipts.length > 0 && !selectedReceiptId) {
                setSelectedReceiptId(data.receipts[0]!.id);
              }
            });
          }
        }

        if (profRes.ok) {
          const data = (await profRes.json()) as { profile?: { city?: string } };
          if (isMounted && data.profile?.city) {
            queueMicrotask(() => {
              setUserCity(data.profile?.city || 'Florianópolis');
            });
          }
        }
      } catch {
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [selectedReceiptId]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d);
    } catch {
      return isoStr;
    }
  };

  const getReceiptStoreName = (r: AvailableReceipt): string =>
    r.store?.name || r.trade_name || 'Supermercado';

  const getReceiptDate = (r: AvailableReceipt): string =>
    r.issuedAt || r.issued_at || '';

  const getReceiptAmount = (r: AvailableReceipt): number => {
    const raw = r.totalAmount ?? r.netAmount ?? r.total_amount ?? 0;
    return Number(raw) || 0;
  };

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
          origin: 'Manual',
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
            const step = i.unit === 'KG' ? (delta > 0 ? 0.1 : -0.1) : delta;
            const newQty = Math.max(0.001, Number((i.quantity + step).toFixed(3)));
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
    setIsClearModalOpen(true);
  };

  const handleConfirmClearCart = () => {
    setCartItems([]);
    setForecastReport(null);
    setIsClearModalOpen(false);
  };

  const handleLoadReceiptIntoCart = async (receiptId: string) => {
    if (!receiptId) return;
    queueMicrotask(() => {
      setIsLoadingReceipt(true);
    });

    try {
      const res = await fetch(`/api/receipts/${receiptId}`);
      if (res.ok) {
        const data = (await res.json()) as {
          receipt?: {
            trade_name?: string;
            store?: { name?: string };
          };
          store?: {
            name?: string;
          };
          items?: ReceiptDetailItem[];
        };

        const storeName =
          data.store?.name ||
          data.receipt?.store?.name ||
          data.receipt?.trade_name ||
          'Nota Fiscal';

        const rawItems = data.items || [];
        const itemsMap = new Map<string, CartItem>();

        for (const item of rawItems) {
          const canonicalId = item.canonicalProductId || item.canonical_product_id;
          if (!canonicalId) continue;
          const name =
            item.commercialName ||
            item.commercial_name ||
            item.rawDescription ||
            item.raw_description ||
            'Produto';
          const category = item.category || 'Geral';
          const unit =
            item.standardUnit ||
            item.standard_unit ||
            item.unitOfMeasure ||
            item.unit_of_measure ||
            'UN';
          const qty = Math.max(0.001, Number((Number(item.quantity) || 1).toFixed(3)));
          const price = Number(item.unitPrice ?? item.unit_price) || 15.0;

          const existing = itemsMap.get(canonicalId);
          if (existing) {
            const combinedQty = Number((existing.quantity + qty).toFixed(3));
            const weightedPrice =
              combinedQty > 0
                ? (existing.quantity * existing.estimatedUnitPrice + qty * price) / combinedQty
                : price;
            existing.quantity = combinedQty;
            existing.estimatedUnitPrice = Math.round(weightedPrice * 100) / 100;
          } else {
            itemsMap.set(canonicalId, {
              canonicalProductId: canonicalId,
              name,
              category,
              unit,
              quantity: qty,
              estimatedUnitPrice: price,
              origin: `Nota ${storeName}`,
            });
          }
        }

        const newItems = Array.from(itemsMap.values());

        queueMicrotask(() => {
          setCartItems(newItems);
          if (newItems.length > 0) {
            toast.success(`Carregados ${newItems.length} produtos de ${storeName}!`);
          } else {
            toast.warning('A nota fiscal não possui produtos catalogados.');
          }
        });
      } else {
        toast.error('Erro ao consultar os detalhes da nota fiscal.');
      }
    } catch {
      toast.error('Falha de conexão ao carregar nota fiscal.');
    } finally {
      queueMicrotask(() => {
        setIsLoadingReceipt(false);
      });
    }
  };

  const handleLoadSmartSuggestions = async () => {
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

            if (data.report.suggestedItems.length > 0) {
              const newItems: CartItem[] = data.report.suggestedItems.map((item) => ({
                canonicalProductId: item.canonicalProductId,
                name: item.commercialName,
                category: item.category,
                unit: item.standardUnit,
                quantity: item.recommendedQuantity,
                estimatedUnitPrice: item.estimatedUnitPrice,
                origin: 'Inteligente (Despensa)',
                cadenceLabel: item.cadenceLabel,
              }));
              setCartItems(newItems);
              toast.success(`Lista inteligente: ${newItems.length} itens com reposição recomendada carregados!`);
            } else if (data.report.stockedItems.length > 0) {
              const pantryItems: CartItem[] = data.report.stockedItems.map((item) => ({
                canonicalProductId: item.canonicalProductId,
                name: item.commercialName,
                category: item.category,
                unit: item.standardUnit,
                quantity: item.recommendedQuantity || 1,
                estimatedUnitPrice: item.estimatedUnitPrice,
                origin: 'Despensa (Cadência)',
                cadenceLabel: item.cadenceLabel,
              }));
              setCartItems(pantryItems);
              toast.info(`Despensa em dia! ${pantryItems.length} itens frequentes carregados para simulação.`);
            } else {
              toast.warning('Nenhum produto cadastrado na despensa ainda.');
            }
          });
        }
      } else {
        toast.error('Erro ao calcular reposição heurística.');
      }
    } catch {
      toast.error('Falha de conexão ao sugerir lista inteligente.');
    } finally {
      queueMicrotask(() => {
        setIsLoadingSuggestions(false);
      });
    }
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
            origin: 'Inteligente (Despensa)',
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
            origin: 'Inteligente (Despensa)',
            cadenceLabel: item.cadenceLabel,
          });
        }
      }
      return next;
    });

    setIsSuggestOpen(false);
  };

  const handleAddSingleSuggestion = (item: ReplenishmentRecommendation) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.canonicalProductId === item.canonicalProductId);
      if (existing) {
        return prev.map((i) =>
          i.canonicalProductId === item.canonicalProductId
            ? { ...i, quantity: item.recommendedQuantity, cadenceLabel: item.cadenceLabel }
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
          origin: 'Inteligente (Despensa)',
          cadenceLabel: item.cadenceLabel,
        },
      ];
    });
  };

  const handleCalculateForecast = async () => {
    if (cartItems.length === 0) return;

    queueMicrotask(() => {
      setIsCalculating(true);
      setIsDrawerOpen(true);
    });

    try {
      const res = await fetch('/api/forecasts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customItems: cartItems.map((i) => ({
            canonicalProductId: i.canonicalProductId,
            quantity: i.quantity,
          })),
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as BasketForecastReport;
        queueMicrotask(() => {
          setForecastReport(data);
        });
      }
    } catch {
    } finally {
      queueMicrotask(() => {
        setIsCalculating(false);
      });
    }
  };

  const cartEstimatedTotal = cartItems.reduce(
    (acc, i) => acc + i.quantity * i.estimatedUnitPrice,
    0
  );

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <PageHeader
        title="Previsão de Gastos"
        description={`Monte sua lista de compras e descubra onde seu carrinho sai mais barato em ${userCity}.`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/scanner">
              <Button variant="secondary" size="md" className="gap-2">
                <QrCode size={18} weight="bold" />
                <span>Importar Nova Nota</span>
              </Button>
            </Link>
          </div>
        }
      />

      {cartItems.length === 0 ? (
        <div className="space-y-6">
          <Card variant="bordered" className="p-6 sm:p-8 bg-canvas border-hairline text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <ShoppingCart size={24} weight="bold" />
            </div>
            <h2 className="text-[20px] font-bold text-ink">
              Monte sua lista e descubra onde pagar menos hoje
            </h2>
            <p className="text-[14px] text-muted max-w-md mx-auto">
              Escolha como deseja iniciar seu carrinho para comparar preços reais entre os supermercados da sua região.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card variant="bordered" className="p-5 bg-canvas border-hairline flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-surface-soft text-ink flex items-center justify-center">
                  <Receipt size={22} weight="bold" />
                </div>
                <h3 className="text-[16px] font-bold text-ink">
                  Repetir Compra Anterior
                </h3>
                <p className="text-[12px] text-muted">
                  Importe todos os itens de uma nota fiscal recente para ver quanto essa mesma compra custaria hoje.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {receiptsList.length > 0 ? (
                  <>
                    <Select
                      size="sm"
                      variant="default"
                      value={selectedReceiptId}
                      onChange={(e) => setSelectedReceiptId(e.target.value)}
                      aria-label="Selecionar Nota Fiscal"
                      options={receiptsList.map((r) => {
                        const formattedDate = formatDate(getReceiptDate(r));
                        return {
                          value: r.id,
                          label: getReceiptStoreName(r),
                          description: formattedDate
                            ? `Compra em ${formattedDate}`
                            : undefined,
                          detail: formatBRL(getReceiptAmount(r)),
                          icon: <Storefront size={15} weight="bold" />,
                        };
                      })}
                    />

                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleLoadReceiptIntoCart(selectedReceiptId)}
                      disabled={isLoadingReceipt || !selectedReceiptId}
                      className="w-full gap-2 rounded-lg"
                    >
                      {isLoadingReceipt ? (
                        <PredictMarketLoader size={18} />
                      ) : (
                        <Receipt size={16} weight="bold" />
                      )}
                      <span>Carregar Itens da Nota</span>
                    </Button>
                  </>
                ) : (
                  <p className="text-[12px] text-muted italic">
                    Nenhuma nota fiscal importada ainda.
                  </p>
                )}
              </div>
            </Card>

            <Card variant="bordered" className="p-5 bg-canvas border-hairline flex flex-col justify-between space-y-4 border-primary/30">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Brain size={22} weight="bold" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[16px] font-bold text-ink">
                    Reposição Automática
                  </h3>
                  <Badge variant="optimistic" className="text-[10px] py-0 px-1.5">
                    IA Local
                  </Badge>
                </div>
                <p className="text-[12px] text-muted">
                  Analisa o ritmo de consumo da sua casa e monta a lista apenas com os produtos que estão prestes a acabar.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleLoadSmartSuggestions}
                  disabled={isLoadingSuggestions}
                  className="w-full gap-2 rounded-lg"
                >
                  {isLoadingSuggestions ? (
                    <PredictMarketLoader size={18} />
                  ) : (
                    <Sparkle size={16} weight="bold" />
                  )}
                  <span>Gerar Lista da Despensa</span>
                </Button>
              </div>
            </Card>

            <Card variant="bordered" className="p-5 bg-canvas border-hairline flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-surface-soft text-ink flex items-center justify-center">
                  <ListPlus size={22} weight="bold" />
                </div>
                <h3 className="text-[16px] font-bold text-ink">
                  Escolher Item por Item
                </h3>
                <p className="text-[12px] text-muted">
                  Busque produtos do seu histórico e monte uma lista personalizada do zero.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="relative">
                  <MagnifyingGlass size={15} weight="bold" className="absolute left-3 top-3 text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar produto (ex: Arroz)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-hairline text-[13px] text-ink bg-surface-soft/40 focus:outline-none focus:border-ink"
                  />
                  {isSearchOpen && filteredCatalog.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsSearchOpen(false)} />
                      <div className="absolute left-0 right-0 top-11 z-30 bg-canvas border border-hairline rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-hairline-soft">
                        {filteredCatalog.map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleAddItem(prod)}
                            className="w-full p-2.5 text-left hover:bg-surface-soft flex items-center justify-between text-[12px] transition-colors"
                          >
                            <span className="font-medium text-ink truncate">{prod.commercialName}</span>
                            <span className="text-primary font-bold">{formatBRL(prod.lastPrice || 15.0)}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card variant="bordered" className="p-5 sm:p-6 space-y-5 bg-canvas border-hairline">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} weight="bold" className="text-primary" />
                  <h2 className="text-[18px] font-bold text-ink">
                    Sua Lista de Compras ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'})
                  </h2>
                </div>
                <p className="text-[13px] text-muted">
                  Ajuste as quantidades ou adicione novos produtos antes de comparar os mercados.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleLoadSmartSuggestions}
                  disabled={isLoadingSuggestions}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-[12px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  {isLoadingSuggestions ? (
                    <PredictMarketLoader size={16} />
                  ) : (
                    <Brain size={15} weight="bold" />
                  )}
                  <span>Sugerir Reposição da Despensa</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearCart}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-danger hover:text-danger-hover hover:bg-danger/10 px-2.5 py-1 rounded-md transition-colors"
                >
                  <Trash size={14} weight="bold" />
                  <span>Limpar lista</span>
                </button>
              </div>
            </div>

            {isSuggestOpen && smartReport && (
              <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-primary/15">
                  <div>
                    <div className="flex items-center gap-2">
                      <Brain size={18} weight="bold" className="text-primary" />
                      <h3 className="text-[15px] font-bold text-ink">
                        Sugestões de Reposição da Despensa
                      </h3>
                      <Badge variant="optimistic" className="text-[11px] py-0.5">
                        IA Local
                      </Badge>
                    </div>
                    <p className="text-[12px] text-muted mt-0.5">
                      {smartReport.suggestedItems.length > 0
                        ? 'Produtos que costumam acabar neste período de acordo com suas compras anteriores.'
                        : 'Sua despensa foi abastecida recentemente. Todos os produtos frequentes estão em dia.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {smartReport.suggestedItems.length > 0 ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddAllSuggestions}
                        className="gap-1.5 rounded-full text-[12px] h-8 px-3"
                      >
                        <CheckCircle size={14} weight="bold" />
                        <span>Adicionar Sugeridos ({smartReport.suggestedItems.length})</span>
                      </Button>
                    ) : smartReport.stockedItems.length > 0 ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          const items: CartItem[] = smartReport.stockedItems.map((item) => ({
                            canonicalProductId: item.canonicalProductId,
                            name: item.commercialName,
                            category: item.category,
                            unit: item.standardUnit,
                            quantity: item.recommendedQuantity || 1,
                            estimatedUnitPrice: item.estimatedUnitPrice,
                            origin: 'Despensa (Cadência)',
                            cadenceLabel: item.cadenceLabel,
                          }));
                          setCartItems(items);
                          toast.success(`${items.length} itens da despensa adicionados ao carrinho!`);
                        }}
                        className="gap-1.5 rounded-full text-[12px] h-8 px-3"
                      >
                        <CheckCircle size={14} weight="bold" />
                        <span>Carregar Itens da Despensa ({smartReport.stockedItems.length})</span>
                      </Button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setIsSuggestOpen(false)}
                      className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-soft transition-colors"
                      aria-label="Fechar painel"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>
                </div>

                {smartReport.suggestedItems.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {smartReport.suggestedItems.map((item) => (
                      <div
                        key={item.canonicalProductId}
                        className="p-3 rounded-lg border border-hairline bg-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-ink">{item.commercialName}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger/10 text-danger border border-danger/20">
                              {item.status === 'DEPLETED' ? 'Esgotado' : 'Estoque Baixo'}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted">{item.reason}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[12px] font-bold text-ink tabular-nums">
                            {item.recommendedQuantity} {item.standardUnit}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddSingleSuggestion(item)}
                            className="text-[11px] h-7 px-2.5 rounded-full"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-surface-soft border border-hairline flex items-center gap-3 text-[13px] text-muted">
                      <CheckCircle size={20} weight="fill" className="text-primary shrink-0" />
                      <span>
                        Nenhum item com estoque esgotado no momento. Exibindo {smartReport.stockedItems.length} produtos frequentes da sua despensa:
                      </span>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {smartReport.stockedItems.map((item) => (
                        <div
                          key={item.canonicalProductId}
                          className="p-2.5 rounded-lg border border-hairline bg-canvas flex items-center justify-between gap-3 text-[12px]"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-ink">{item.commercialName}</span>
                            <p className="text-[11px] text-muted">{item.reason}</p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddSingleSuggestion(item)}
                            className="text-[11px] h-7 px-2.5 rounded-full"
                          >
                            + Adicionar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <MagnifyingGlass size={16} weight="bold" className="absolute left-3.5 top-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Adicionar outro produto ao carrinho (ex: Leite, Feijão, Banana)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-hairline text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-ink bg-surface-soft/40"
              />

              {isSearchOpen && filteredCatalog.length > 0 && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsSearchOpen(false)} />
                  <div className="absolute left-0 right-0 top-12 z-30 bg-canvas border border-hairline rounded-lg shadow-lg max-h-64 overflow-y-auto divide-y divide-hairline-soft">
                    {filteredCatalog.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleAddItem(prod)}
                        className="w-full p-3 text-left hover:bg-surface-soft flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-ink truncate">{prod.commercialName}</p>
                          <span className="text-[11px] text-muted">{prod.category} · {prod.standardUnit}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[13px] font-bold text-ink tabular-nums">
                            {formatBRL(prod.lastPrice || prod.avgPrice || 15.0)}
                          </span>
                          <span className="block text-[11px] text-primary font-medium flex items-center justify-end gap-1">
                            <Plus size={11} weight="bold" /> Adicionar
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="divide-y divide-hairline-soft border border-hairline rounded-lg overflow-hidden bg-canvas">
              {cartItems.map((item) => (
                <div
                  key={item.canonicalProductId}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] hover:bg-surface-soft/30 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-semibold text-ink leading-tight">{item.name}</p>
                      {item.origin && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-soft text-muted">
                          {item.origin}
                        </span>
                      )}
                      {item.cadenceLabel && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {item.cadenceLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted">
                      {item.category} · Ref: {formatBRL(item.estimatedUnitPrice)} / {item.unit.toLowerCase()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline/60">
                    <div className="flex items-center border border-hairline rounded-lg bg-canvas overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.canonicalProductId, -1)}
                        className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-ink hover:bg-surface-soft transition-colors touch-target"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={14} weight="bold" />
                      </button>
                      <span className="min-w-[40px] sm:min-w-[34px] px-1 text-center font-bold text-ink tabular-nums text-[13px] sm:text-[12px]">
                        {Number(item.quantity.toFixed(3))}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.canonicalProductId, 1)}
                        className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-ink hover:bg-surface-soft transition-colors touch-target"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={14} weight="bold" />
                      </button>
                    </div>

                    <div className="text-right sm:w-24 tabular-nums">
                      <strong className="block text-ink font-bold text-[15px] sm:text-[14px]">
                        {formatBRL(item.quantity * item.estimatedUnitPrice)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.canonicalProductId)}
                      className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-colors rounded-lg touch-target"
                      aria-label="Remover item"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-surface-soft border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[12px] text-muted block">
                  Total de referência ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}):
                </span>
                <strong className="text-[22px] sm:text-[24px] font-bold text-ink tabular-nums">
                  {formatBRL(cartEstimatedTotal)}
                </strong>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleCalculateForecast}
                disabled={isCalculating || cartItems.length === 0}
                className="w-full sm:w-auto gap-2 shrink-0 rounded-full shadow-sm min-h-[48px]"
              >
                {isCalculating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Calculando Cenários e Mercados...</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={18} weight="bold" />
                    <span>Calcular Previsão com este Carrinho</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClearCart}
        title="Limpar Carrinho de Compras"
        description="Esta ação removerá todos os produtos do seu carrinho de previsão de gastos. Esta ação não poderá ser desfeita. Deseja continuar?"
        confirmLabel="Sim, Limpar Carrinho"
        cancelLabel="Cancelar"
        variant="danger"
      />

      <ForecastResultsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        report={forecastReport}
        isCalculating={isCalculating}
        cartItemCount={cartItems.length}
      />
    </div>
  );
}
