'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Storefront, ChartLineUp, Barcode, WarningCircle, QrCode } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductPriceChart } from '@/components/products/ProductPriceChart';
interface ProductPageProps {
  params: Promise<{ id: string }>;
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

export default function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [aliases, setAliases] = useState<StoreAlias[]>([]);
  const [history, setHistory] = useState<MonthlyPricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProductData() {
      try {
        const res = await fetch(`/api/products/${resolvedParams.id}`);
        if (!res.ok) {
          throw new Error('Falha ao carregar produto');
        }
        const data = (await res.json()) as ProductApiResponse;

        if (isMounted && data.product) {
          queueMicrotask(() => {
            setProduct(data.product);
            setAliases(data.aliases ?? []);
            setHistory(data.history ?? []);
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

    loadProductData();

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (isLoading) {
    return <div className="p-12 text-center text-muted">Carregando dados do produto canônico...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-16 text-center space-y-4">
        <WarningCircle size={48} weight="bold" className="text-muted mx-auto" />
        <h1 className="text-[20px] font-bold text-ink">Produto Canônico Não Encontrado</h1>
        <p className="text-[14px] text-muted">
          O identificador informado não corresponde a nenhum produto no catálogo canônico regional.
        </p>
        <Link href="/products" className="text-primary font-semibold underline inline-block">
          Voltar para Produtos Comprados
        </Link>
      </div>
    );
  }

  const latestStat = history[0];

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <PageHeader
        backHref="/products"
        title={product.commercialName}
        description={`Medida Líquida Padrão: ${product.netMeasure} ${product.baseUnit} · Resolução Canônica`}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="neutral">{product.category}</Badge>
            {product.ean && (
              <span className="text-[12px] text-muted flex items-center gap-1 font-mono">
                <Barcode size={14} weight="bold" />
                {product.ean}
              </span>
            )}
          </div>
        }
        actions={
          <Link
            href="/scanner"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover transition-colors shadow-xs"
          >
            <QrCode size={16} weight="bold" />
            <span>Escanear Nota</span>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered" className="p-4 text-center">
          <span className="text-[11px] font-bold uppercase text-scenario-optimistic block">
            Menor Preço Recente
          </span>
          <strong className="text-[24px] font-bold text-primary tabular-nums mt-1 block">
            {latestStat ? formatBRL(latestStat.min) : 'N/D'}
          </strong>
        </Card>

        <Card variant="bordered" className="p-4 text-center bg-surface-soft">
          <span className="text-[11px] font-bold uppercase text-ink block">
            Preço Médio Regional
          </span>
          <strong className="text-[24px] font-bold text-ink tabular-nums mt-1 block">
            {latestStat ? formatBRL(latestStat.avg) : 'N/D'}
          </strong>
        </Card>

        <Card variant="bordered" className="p-4 text-center">
          <span className="text-[11px] font-bold uppercase text-scenario-pessimistic block">
            Maior Preço Recente
          </span>
          <strong className="text-[24px] font-bold text-scenario-pessimistic tabular-nums mt-1 block">
            {latestStat ? formatBRL(latestStat.max) : 'N/D'}
          </strong>
        </Card>
      </div>

      <Card variant="bordered" className="p-6">
        <h2 className="text-[18px] font-bold text-ink mb-4 flex items-center gap-2">
          <ChartLineUp size={20} weight="bold" />
          <span>Evolução Histórica Mensal ({history.length} {history.length === 1 ? 'mês' : 'meses'})</span>
        </h2>
        <ProductPriceChart data={history} standardUnit={product.baseUnit} height={240} />
      </Card>

      <Card variant="bordered" className="p-6">
        <h2 className="text-[18px] font-bold text-ink mb-4 flex items-center gap-2">
          <Storefront size={20} weight="bold" />
          <span>Aliases Fiscais Vinculados ({aliases.length})</span>
        </h2>
        {aliases.length > 0 ? (
          <div className="divide-y divide-hairline-soft">
            {aliases.map((alias) => (
              <div key={`${alias.storeName}-${alias.rawCode}`} className="py-3 flex justify-between items-center text-[14px]">
                <div>
                  <p className="font-semibold text-ink">{alias.storeName}</p>
                  <p className="text-[12px] text-muted font-mono">{alias.rawDesc}</p>
                </div>
                <span className="text-[12px] text-muted">Cód: {alias.rawCode}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-muted">Nenhum alias registrado por supermercados até o momento.</p>
        )}
      </Card>
    </div>
  );
}
