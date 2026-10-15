'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  ChartLineUp,
  Storefront,
  Barcode,
  WarningCircle,
  Tag,
  ArrowSquareOut,
  CalendarBlank,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProductPriceChart } from './ProductPriceChart';
import { PredictMarketLoader } from '@/components/ui/PredictMarketLoader';

export interface ProductHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  initialName?: string;
  initialCategory?: string;
  initialUnit?: string;
}

interface ProductDetail {
  id: string;
  commercialName: string;
  ean: string | null;
  category: string;
  baseUnit: string;
  netMeasure: number;
}

interface StoreAlias {
  storeName: string;
  rawDesc: string;
  rawCode: string;
}

interface MonthlyPricePoint {
  month: string;
  avg: number;
  min: number;
  max: number;
}

interface ProductApiResponse {
  product: ProductDetail;
  aliases: StoreAlias[];
  history: MonthlyPricePoint[];
}

export const ProductHistoryDrawer: React.FC<ProductHistoryDrawerProps> = ({
  isOpen,
  onClose,
  productId,
  initialName,
  initialCategory,
  initialUnit,
}) => {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [aliases, setAliases] = useState<StoreAlias[]>([]);
  const [history, setHistory] = useState<MonthlyPricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !productId) {
      queueMicrotask(() => {
        setProduct(null);
        setAliases([]);
        setHistory([]);
        setError(null);
      });
      return;
    }

    let isMounted = true;
    queueMicrotask(() => {
      setIsLoading(true);
      setError(null);
    });

    async function loadProductData() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          throw new Error('Falha ao obter histórico de preços');
        }
        const data = (await res.json()) as ProductApiResponse;

        if (isMounted) {
          queueMicrotask(() => {
            setProduct(data.product);
            setAliases(data.aliases ?? []);
            setHistory(data.history ?? []);
          });
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar dados';
          queueMicrotask(() => {
            setError(msg);
          });
        }
      } finally {
        if (isMounted) {
          queueMicrotask(() => {
            setIsLoading(false);
          });
        }
      }
    }

    loadProductData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, productId]);

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

  const displayName = product?.commercialName ?? initialName ?? 'Detalhes do Produto';
  const displayCategory = product?.category ?? initialCategory;
  const displayUnit = product?.baseUnit ?? initialUnit;
  const latestStat = history[0];

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
          aria-labelledby="product-drawer-title"
          className="w-screen max-w-md sm:max-w-lg bg-canvas border-l border-hairline shadow-2xl flex flex-col min-h-full transform transition-transform duration-300 ease-out"
        >
          <div className="p-5 sm:p-6 border-b border-hairline flex items-start justify-between gap-4 bg-canvas sticky top-0 z-10">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {displayCategory && (
                  <Badge variant="neutral" className="text-[11px] py-0.5 px-2">
                    <Tag size={12} weight="bold" />
                    <span>{displayCategory}</span>
                  </Badge>
                )}
                {displayUnit && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-soft text-muted font-mono font-medium">
                    {displayUnit}
                  </span>
                )}
                {product?.ean && (
                  <span className="text-[11px] text-muted flex items-center gap-1 font-mono">
                    <Barcode size={13} weight="bold" />
                    {product.ean}
                  </span>
                )}
              </div>

              <h2
                id="product-drawer-title"
                className="text-[18px] sm:text-[20px] font-bold text-ink leading-snug"
              >
                {displayName}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel"
              className="w-9 h-9 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:bg-surface-soft transition-colors shrink-0"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {isLoading && !product ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <PredictMarketLoader size="lg" text="Carregando histórico e métricas..." />
              </div>
            ) : error ? (
              <Card variant="bordered" className="p-6 text-center space-y-3">
                <WarningCircle size={36} weight="bold" className="text-danger mx-auto" />
                <p className="text-[14px] font-medium text-ink">{error}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[13px] font-semibold text-primary hover:underline"
                >
                  Fechar
                </button>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-lg border border-hairline bg-canvas text-center">
                    <span className="text-[10px] font-bold uppercase text-scenario-optimistic block tracking-tight">
                      Mínimo
                    </span>
                    <strong className="text-[17px] sm:text-[19px] font-bold text-scenario-optimistic tabular-nums mt-1 block">
                      {latestStat ? formatBRL(latestStat.min) : 'N/D'}
                    </strong>
                  </div>

                  <div className="p-3 rounded-lg border border-hairline bg-surface-soft text-center">
                    <span className="text-[10px] font-bold uppercase text-ink block tracking-tight">
                      Médio
                    </span>
                    <strong className="text-[17px] sm:text-[19px] font-bold text-ink tabular-nums mt-1 block">
                      {latestStat ? formatBRL(latestStat.avg) : 'N/D'}
                    </strong>
                  </div>

                  <div className="p-3 rounded-lg border border-hairline bg-canvas text-center">
                    <span className="text-[10px] font-bold uppercase text-scenario-pessimistic block tracking-tight">
                      Máximo
                    </span>
                    <strong className="text-[17px] sm:text-[19px] font-bold text-scenario-pessimistic tabular-nums mt-1 block">
                      {latestStat ? formatBRL(latestStat.max) : 'N/D'}
                    </strong>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                    <ChartLineUp size={18} weight="bold" className="text-primary" />
                    <span>Evolução de Preços no Tempo</span>
                  </h3>

                  <ProductPriceChart data={history} standardUnit={displayUnit} height={200} />
                </div>

                <div className="space-y-3">
                  <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                    <Storefront size={18} weight="bold" className="text-primary" />
                    <span>Supermercados e Nomenclaturas ({aliases.length})</span>
                  </h3>

                  {aliases.length > 0 ? (
                    <div className="divide-y divide-hairline-soft border border-hairline rounded-lg overflow-hidden bg-canvas">
                      {aliases.map((alias) => (
                        <div
                          key={`${alias.storeName}-${alias.rawCode}-${alias.rawDesc}`}
                          className="p-3 space-y-1 hover:bg-surface-soft/60 transition-colors text-[13px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-ink">{alias.storeName}</span>
                            {alias.rawCode && (
                              <span className="text-[11px] text-muted font-mono">
                                Cód: {alias.rawCode}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-muted font-mono truncate">
                            {alias.rawDesc}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted p-4 rounded-lg bg-surface-soft text-center">
                      Nenhum estabelecimento adicional registrado para este item.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {productId && (
            <div className="p-4 border-t border-hairline bg-surface-soft flex items-center justify-between text-[13px]">
              <span className="text-muted text-[12px]">Precisa compartilhar?</span>
              <Link
                href={`/products/${productId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                <span>Abrir página completa</span>
                <ArrowSquareOut size={14} weight="bold" />
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
