'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  ShoppingCart,
  CurrencyCircleDollar,
  Tag,
  Storefront,
  QrCode,
  ArrowRight,
  ChartBar,
} from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PredictMarketLoader } from '@/components/ui/PredictMarketLoader';

interface DashboardStatsData {
  receiptsCount: number;
  basketsCount: number;
  totalSavedBRL: number;
  productsCount: number;
  totalSpentBRL: number;
  lastReceiptDate: string | null;
  monthlyTrends: Array<{
    month: string;
    spent: number;
    savings: number;
  }>;
  topStores: Array<{
    storeId: string;
    storeName: string;
    city: string;
    receiptsCount: number;
    totalSpent: number;
  }>;
  topCategories: Array<{
    category: string;
    itemsCount: number;
    totalSpent: number;
  }>;
  recentReceipts: Array<{
    id: string;
    storeName: string;
    city: string;
    issuedAt: string;
    totalAmount: number;
    itemsCount: number;
  }>;
}

const INITIAL_STATS: DashboardStatsData = {
  receiptsCount: 0,
  basketsCount: 0,
  totalSavedBRL: 0,
  productsCount: 0,
  totalSpentBRL: 0,
  lastReceiptDate: null,
  monthlyTrends: [],
  topStores: [],
  topCategories: [],
  recentReceipts: [],
};

export default function DashboardGeneralPage() {
  const [stats, setStats] = useState<DashboardStatsData>(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = (await res.json()) as { success: boolean; stats: DashboardStatsData };
          if (isMounted && data.stats) {
            queueMicrotask(() => {
              setStats(data.stats);
              setIsLoading(false);
            });
          }
        } else {
          if (isMounted) {
            queueMicrotask(() => {
              setIsLoading(false);
            });
          }
        }
      } catch {
        if (isMounted) {
          queueMicrotask(() => {
            setIsLoading(false);
          });
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-24 flex items-center justify-center">
        <PredictMarketLoader size="lg" text="Carregando métricas da sua conta..." />
      </div>
    );
  }

  const maxMonthlySpent = Math.max(...stats.monthlyTrends.map((t) => t.spent), 100);
  const totalCategorySpent = stats.topCategories.reduce((acc, c) => acc + c.totalSpent, 0) || 1;

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <PageHeader
        title="Resumo Financeiro"
        description="Acompanhe quanto você já economizou, seus gastos mensais e a variação de preços dos seus produtos."
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Link href="/forecast" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto gap-2 rounded-full min-h-[44px]">
                <ShoppingCart size={16} weight="bold" />
                <span>Simular Próxima Compra</span>
              </Button>
            </Link>
            <Link href="/scanner" className="w-full sm:w-auto">
              <Button variant="secondary" size="md" className="w-full sm:w-auto gap-2 rounded-full min-h-[44px]">
                <QrCode size={16} weight="bold" />
                <span>Importar Nota</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/receipts" className="block group">
          <Card variant="bordered" className="p-5 bg-canvas border-hairline hover:border-ink/30 transition-all space-y-3 h-full">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                Compras Registradas
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-soft text-ink flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <Receipt size={18} weight="bold" />
              </div>
            </div>
            <div className="space-y-1">
              <strong className="text-[28px] font-bold text-ink tabular-nums block leading-tight">
                {stats.receiptsCount}
              </strong>
              <p className="text-[12px] text-muted truncate">
                Total investido: {formatBRL(stats.totalSpentBRL)}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary group-hover:translate-x-0.5 transition-transform">
              <span>Ver todas as notas</span>
              <ArrowRight size={12} weight="bold" />
            </span>
          </Card>
        </Link>

        <div className="block">
          <Card variant="bordered" className="p-5 bg-canvas border-hairline space-y-3 h-full border-success/30 bg-success/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                Economia Acumulada
              </span>
              <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <CurrencyCircleDollar size={18} weight="bold" />
              </div>
            </div>
            <div className="space-y-1">
              <strong className="text-[28px] font-bold text-success tabular-nums block leading-tight">
                {formatBRL(stats.totalSavedBRL)}
              </strong>
              <div className="flex items-center gap-1.5">
                <Badge variant="optimistic" className="text-[10px] py-0 px-1.5">
                  Descontos Reais
                </Badge>
                <span className="text-[11px] text-muted">
                  {stats.totalSpentBRL > 0 && stats.totalSavedBRL > 0
                    ? `${Math.round((stats.totalSavedBRL / (stats.totalSpentBRL + stats.totalSavedBRL)) * 100)}% poupado nas notas`
                    : 'Auditado nas notas'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted">
              Soma dos descontos diretos e ofertas aproveitadas nas suas compras.
            </p>
          </Card>
        </div>

        <Link href="/forecast" className="block group">
          <Card variant="bordered" className="p-5 bg-canvas border-hairline hover:border-ink/30 transition-all space-y-3 h-full">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                Listas Planejadas
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-soft text-ink flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <ShoppingCart size={18} weight="bold" />
              </div>
            </div>
            <div className="space-y-1">
              <strong className="text-[28px] font-bold text-ink tabular-nums block leading-tight">
                {stats.basketsCount}
              </strong>
              <p className="text-[12px] text-muted">
                Simulações de compra salvas
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary group-hover:translate-x-0.5 transition-transform">
              <span>Planejar nova compra</span>
              <ArrowRight size={12} weight="bold" />
            </span>
          </Card>
        </Link>

        <Link href="/products" className="block group">
          <Card variant="bordered" className="p-5 bg-canvas border-hairline hover:border-ink/30 transition-all space-y-3 h-full">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                Produtos Monitorados
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-soft text-ink flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                <Tag size={18} weight="bold" />
              </div>
            </div>
            <div className="space-y-1">
              <strong className="text-[28px] font-bold text-ink tabular-nums block leading-tight">
                {stats.productsCount}
              </strong>
              <p className="text-[12px] text-muted">
                Com histórico de preço por loja
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary group-hover:translate-x-0.5 transition-transform">
              <span>Consultar preços</span>
              <ArrowRight size={12} weight="bold" />
            </span>
          </Card>
        </Link>
      </div>

      {stats.receiptsCount === 0 && (
        <Card variant="bordered" className="p-8 bg-canvas border-hairline text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Receipt size={24} weight="bold" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-[18px] font-bold text-ink">Comece importando sua primeira nota fiscal</h3>
            <p className="text-[13px] text-muted">
              Escaneie o QR Code de qualquer cupom de supermercado para descobrir a variação de preços dos seus itens e planejar compras mais baratas.
            </p>
          </div>
          <Link href="/scanner">
            <Button variant="primary" size="md" className="gap-2 rounded-full">
              <QrCode size={16} weight="bold" />
              <span>Escanear Primeira Nota</span>
            </Button>
          </Link>
        </Card>
      )}

      {stats.monthlyTrends.length > 0 && (
        <Card variant="bordered" className="p-5 sm:p-6 bg-canvas border-hairline space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ChartBar size={20} weight="bold" className="text-primary" />
                <h2 className="text-[16px] font-bold text-ink">
                  Evolução Mensal de Gastos e Economia
                </h2>
              </div>
              <p className="text-[13px] text-muted">
                Comparativo dos gastos registrados e a economia obtida em cada período.
              </p>
            </div>

            <div className="flex items-center gap-4 text-[12px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-ink inline-block" />
                <span className="text-muted">Total Gasto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-success inline-block" />
                <span className="text-muted">Economia Real</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex sm:grid sm:grid-cols-6 gap-3 sm:gap-6 items-end h-44 border-b border-hairline pb-2 overflow-x-auto overflow-touch">
              {stats.monthlyTrends.map((trend) => {
                const spentPct = Math.min(100, Math.round((trend.spent / maxMonthlySpent) * 100));
                const savingsPct = Math.min(100, Math.round((trend.savings / maxMonthlySpent) * 100));

                return (
                  <div key={trend.month} className="flex flex-col items-center justify-end h-full gap-1 group min-w-[72px] sm:min-w-0 flex-1">
                    <div className="w-full flex items-end justify-center gap-1.5 h-36">
                      <div
                        style={{ height: `${Math.max(15, spentPct)}%` }}
                        className="w-1/2 max-w-[32px] bg-ink/80 rounded-t group-hover:bg-ink transition-colors relative flex justify-center"
                      >
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-7 text-[10px] font-bold bg-ink text-canvas px-1.5 py-0.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-20">
                          {formatBRL(trend.spent)}
                        </span>
                      </div>

                      <div
                        style={{ height: `${Math.max(8, savingsPct)}%` }}
                        className="w-1/2 max-w-[32px] bg-success/80 rounded-t group-hover:bg-success transition-colors relative flex justify-center"
                      >
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-7 text-[10px] font-bold bg-success text-canvas px-1.5 py-0.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-20">
                          +{formatBRL(trend.savings)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted font-medium mt-1">
                      {trend.month.split('-')[1]}/{trend.month.split('-')[0]?.slice(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered" className="p-5 sm:p-6 bg-canvas border-hairline space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <div className="flex items-center gap-2">
              <Storefront size={18} weight="bold" className="text-primary" />
              <h3 className="text-[15px] font-bold text-ink">
                Supermercados Frequentes
              </h3>
            </div>
            <Link href="/forecast" className="text-[12px] font-medium text-primary hover:underline">
              Simular carrinho →
            </Link>
          </div>

          <div className="space-y-3">
            {stats.topStores.length === 0 ? (
              <p className="text-[13px] text-muted italic">Nenhuma compra registrada ainda.</p>
            ) : (
              stats.topStores.map((store) => (
                <div
                  key={store.storeId}
                  className="p-3 rounded-lg border border-hairline bg-surface-soft/30 flex items-center justify-between gap-3 text-[13px]"
                >
                  <div className="min-w-0 flex-1">
                    <strong className="font-semibold text-ink block truncate">
                      {store.storeName}
                    </strong>
                    <span className="text-[11px] text-muted">
                      {store.city} · {store.receiptsCount} {store.receiptsCount === 1 ? 'nota' : 'notas'}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[13px] font-bold text-ink tabular-nums block">
                      {formatBRL(store.totalSpent)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card variant="bordered" className="p-5 sm:p-6 bg-canvas border-hairline space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <div className="flex items-center gap-2">
              <Tag size={18} weight="bold" className="text-primary" />
              <h3 className="text-[15px] font-bold text-ink">
                Gastos por Categoria
              </h3>
            </div>
            <Link href="/products" className="text-[12px] font-medium text-primary hover:underline">
              Ver produtos →
            </Link>
          </div>

          <div className="space-y-3">
            {stats.topCategories.length === 0 ? (
              <p className="text-[13px] text-muted italic">Nenhuma categoria registrada ainda.</p>
            ) : (
              stats.topCategories.map((cat) => {
                const pct = Math.round((cat.totalSpent / totalCategorySpent) * 100);
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-medium text-ink">{cat.category}</span>
                      <span className="text-muted tabular-nums">
                        {formatBRL(cat.totalSpent)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, pct)}%` }}
                        className="h-full bg-primary/80 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Card variant="bordered" className="p-5 sm:p-6 bg-canvas border-hairline space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Receipt size={18} weight="bold" className="text-ink" />
            <h3 className="text-[15px] font-bold text-ink">
              Últimas Notas Fiscais Importadas
            </h3>
          </div>
          <Link href="/receipts" className="text-[12px] font-medium text-primary hover:underline">
            Ver todas ({stats.receiptsCount}) →
          </Link>
        </div>

        {stats.recentReceipts.length === 0 ? (
          <p className="text-[13px] text-muted italic py-4">Nenhuma nota fiscal registrada ainda.</p>
        ) : (
          <div className="divide-y divide-hairline-soft border border-hairline rounded-lg overflow-hidden bg-canvas">
            {stats.recentReceipts.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-soft/40 transition-colors text-[13px]"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <strong className="font-semibold text-ink block truncate">
                    {rec.storeName}
                  </strong>
                  <span className="text-[11px] text-muted">
                    {formatDate(rec.issuedAt)} · {rec.itemsCount} itens registrados · {rec.city}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <span className="text-[14px] font-bold text-ink tabular-nums">
                    {formatBRL(rec.totalAmount)}
                  </span>
                  <Link href={`/receipts/${rec.id}`}>
                    <Button variant="secondary" size="sm" className="text-[11px] h-7 px-3 rounded-full">
                      Detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
