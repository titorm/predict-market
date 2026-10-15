'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Tag,
  MagnifyingGlass,
  Barcode,
  ChartLineUp,
  Storefront,
  CalendarBlank,
  Package,
  QrCode,
  TrendUp,
  Sparkle,
  ArrowsDownUp,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { ProductHistoryDrawer } from '@/components/products/ProductHistoryDrawer';
import { PredictMarketLoader } from '@/components/ui/PredictMarketLoader';

interface PurchasedProductItem {
  id: string;
  commercialName: string;
  ean: string | null;
  category: string;
  standardUnit: string;
  purchaseCount: number;
  lastPurchasedAt: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  lastPrice: number;
  lastStoreName: string;
}

type SortOption = 'recent' | 'purchases' | 'price-asc' | 'price-desc' | 'name';

export default function PurchasedProductsPage() {
  const [products, setProducts] = useState<PurchasedProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedProduct, setSelectedProduct] = useState<PurchasedProductItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenHistory = (product: PurchasedProductItem) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadPurchasedProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) {
          throw new Error('Falha ao carregar produtos');
        }
        const data = (await res.json()) as { products: PurchasedProductItem[] };

        if (isMounted && Array.isArray(data.products)) {
          queueMicrotask(() => {
            setProducts(data.products);
          });
        }
      } catch {
      } finally {
        if (isMounted) {
          queueMicrotask(() => {
            setIsLoading(false);
          });
        }
      }
    }

    loadPurchasedProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['Todos', ...Array.from(set).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.commercialName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.ean && p.ean.includes(q)) ||
          p.lastStoreName.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'Todos') {
      list = list.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    list.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.lastPurchasedAt).getTime() - new Date(a.lastPurchasedAt).getTime();
      }
      if (sortBy === 'purchases') {
        return b.purchaseCount - a.purchaseCount;
      }
      if (sortBy === 'price-asc') {
        return a.lastPrice - b.lastPrice;
      }
      if (sortBy === 'price-desc') {
        return b.lastPrice - a.lastPrice;
      }
      return a.commercialName.localeCompare(b.commercialName);
    });

    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const totalPurchases = products.reduce((acc, p) => acc + p.purchaseCount, 0);
  const avgOverallPrice =
    products.length > 0
      ? products.reduce((acc, p) => acc + p.lastPrice, 0) / products.length
      : 0;

  return (
    <div className="bg-canvas min-h-screen pb-16">
      <main className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        <PageHeader
          title="Produtos Comprados"
          description="Acompanhe o histórico de preços, compras registradas e variação entre supermercados."
          badge={
            <div className="flex items-center gap-2">
              <Badge variant="neutral" className="gap-1.5 py-0.5 px-2.5 text-[12px]">
                <Tag size={13} weight="bold" />
                <span>Catálogo Canônico</span>
              </Badge>
              <Badge variant="optimistic" className="gap-1 py-0.5 px-2.5 text-[12px]">
                <Sparkle size={13} weight="bold" />
                <span>{products.length} Produtos</span>
              </Badge>
            </div>
          }
          actions={
            <Link
              href="/scanner"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors"
            >
              <QrCode size={16} weight="bold" />
              <span>Escanear Nova Nota</span>
            </Link>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card variant="bordered" className="p-4 sm:p-5">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Produtos Catalogados
            </span>
            <strong className="text-[22px] sm:text-[26px] font-bold text-ink tabular-nums mt-1 block">
              {products.length}
            </strong>
            <span className="text-[12px] text-muted">itens únicos identificados</span>
          </Card>

          <Card variant="bordered" className="p-4 sm:p-5">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Total de Ocorrências
            </span>
            <strong className="text-[22px] sm:text-[26px] font-bold text-ink tabular-nums mt-1 block">
              {totalPurchases}
            </strong>
            <span className="text-[12px] text-muted">registros em cupons</span>
          </Card>

          <Card variant="bordered" className="p-4 sm:p-5">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Preço Médio da Cesta
            </span>
            <strong className="text-[22px] sm:text-[26px] font-bold text-primary tabular-nums mt-1 block">
              {formatBRL(avgOverallPrice)}
            </strong>
            <span className="text-[12px] text-muted">por unidade padrão</span>
          </Card>

          <Card variant="bordered" className="p-4 sm:p-5">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              Categorias Ativas
            </span>
            <strong className="text-[22px] sm:text-[26px] font-bold text-ink tabular-nums mt-1 block">
              {categories.length - 1}
            </strong>
            <span className="text-[12px] text-muted">departamentos de mercado</span>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-lg">
              <MagnifyingGlass
                size={18}
                weight="bold"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Buscar por nome do produto, categoria ou código EAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-hairline bg-canvas text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-ink transition-colors shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ArrowsDownUp size={16} weight="bold" className="text-muted" />
              <label htmlFor="sort-select" className="text-[13px] text-muted font-medium">
                Ordenar por:
              </label>
              <Select
                id="sort-select"
                size="sm"
                variant="default"
                containerClassName="w-auto min-w-[160px]"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Ordenar por"
              >
                <option value="recent">Mais Recentes</option>
                <option value="purchases">Mais Comprados</option>
                <option value="price-asc">Menor Preço</option>
                <option value="price-desc">Maior Preço</option>
                <option value="name">Nome (A-Z)</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-ink text-white font-semibold'
                      : 'bg-surface-soft text-muted hover:text-ink hover:bg-surface-strong border border-hairline'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 flex items-center justify-center">
            <PredictMarketLoader size="lg" text="Carregando catálogo de produtos comprados..." />
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card variant="bordered" className="p-12 text-center space-y-4">
            <Package size={48} weight="duotone" className="text-muted mx-auto" />
            <h2 className="text-[18px] font-bold text-ink">Nenhum produto localizado</h2>
            <p className="text-[14px] text-muted max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'Todos'
                ? 'Tente ajustar os filtros ou pesquisar com outro termo.'
                : 'Você ainda não possui produtos catalogados. Escaneie um cupom fiscal para iniciar o rastreamento de preços.'}
            </p>
            <div className="pt-2">
              <Link
                href="/scanner"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                <QrCode size={18} weight="bold" />
                <span>Escanear Cupom Fiscal</span>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const hasVariation = product.maxPrice > product.minPrice;
              const variationPct = hasVariation
                ? Math.round(((product.maxPrice - product.minPrice) / product.minPrice) * 100)
                : 0;

              return (
                <Card
                  key={product.id}
                  variant="bordered"
                  className="p-5 flex flex-col justify-between hover:border-ink/30 hover:shadow-airbnb transition-all space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="neutral" className="text-[11px] py-0 px-2">
                          {product.category}
                        </Badge>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-soft text-muted font-mono font-medium">
                          {product.standardUnit}
                        </span>
                      </div>

                      {hasVariation && (
                        product.lastPrice <= product.minPrice * 1.02 ? (
                          <Badge variant="optimistic" className="text-[10px] py-0 px-2 font-semibold">
                            Melhor Preço
                          </Badge>
                        ) : product.lastPrice >= product.maxPrice * 0.98 ? (
                          <Badge variant="pessimistic" className="text-[10px] py-0 px-2">
                            Pico (+{variationPct}%)
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[10px] py-0 px-2">
                            +{variationPct}% variação
                          </Badge>
                        )
                      )}
                    </div>

                    <div>
                      <h3 className="text-[16px] font-bold text-ink leading-snug line-clamp-2">
                        {product.commercialName}
                      </h3>
                      {product.ean && (
                        <span className="text-[11px] text-muted flex items-center gap-1 font-mono mt-1">
                          <Barcode size={13} weight="bold" />
                          {product.ean}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-hairline flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] text-muted block">Último Preço Pago</span>
                        <strong className="text-[20px] font-bold text-ink tabular-nums">
                          {formatBRL(product.lastPrice)}
                        </strong>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-muted block">Faixa de Preço</span>
                        <span className="text-[12px] font-medium text-body tabular-nums">
                          {formatBRL(product.minPrice)} – {formatBRL(product.maxPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-md bg-surface-soft text-[12px] text-muted space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Storefront size={14} weight="bold" />
                          <span className="truncate max-w-[150px]">{product.lastStoreName}</span>
                        </span>
                        <span className="tabular-nums font-medium text-ink">
                          {product.purchaseCount} {product.purchaseCount === 1 ? 'compra' : 'compras'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px]">
                        <CalendarBlank size={13} weight="bold" />
                        <span>Última em {formatDate(product.lastPurchasedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenHistory(product)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full border border-hairline text-[13px] font-semibold text-ink hover:bg-ink hover:text-white transition-colors"
                    >
                      <ChartLineUp size={16} weight="bold" />
                      <span>Ver Histórico de Preços</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <ProductHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        productId={selectedProduct?.id ?? null}
        initialName={selectedProduct?.commercialName}
        initialCategory={selectedProduct?.category}
        initialUnit={selectedProduct?.standardUnit}
      />
    </div>
  );
}
