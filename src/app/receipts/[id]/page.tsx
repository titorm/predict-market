'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Storefront,
  Receipt,
  CalendarBlank,
  CreditCard,
  Tag,
  CheckCircle,
  Copy,
  Check,
  MagnifyingGlass,
  Funnel,
  WarningCircle,
  TrendUp,
  QrCode,
  ChartLineUp,
  Trash,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductHistoryDrawer } from '@/components/products/ProductHistoryDrawer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface ReceiptDetail {
  id: string;
  accessKey: string;
  issueNumber: string | null;
  series: string | null;
  issuedAt: string;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paymentMethod: string | null;
  rawPayload: unknown;
  createdAt: string;
}

interface StoreDetail {
  id: string;
  name: string;
  corporateName: string | null;
  cnpj: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface ReceiptItemDetail {
  id: string;
  canonicalProductId: string | null;
  itemIndex: number;
  rawDescription: string;
  commercialName: string;
  category: string;
  standardUnit: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number;
  discountValue: number;
  purchasedAt: string;
}

export default function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [items, setItems] = useState<ReceiptItemDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [copiedKey, setCopiedKey] = useState(false);
  const [drawerProductId, setDrawerProductId] = useState<string | null>(null);
  const [drawerProductName, setDrawerProductName] = useState<string | undefined>(undefined);
  const [drawerCategory, setDrawerCategory] = useState<string | undefined>(undefined);
  const [drawerUnit, setDrawerUnit] = useState<string | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenItemHistory = (item: ReceiptItemDetail) => {
    if (!item.canonicalProductId) return;
    setDrawerProductId(item.canonicalProductId);
    setDrawerProductName(item.commercialName);
    setDrawerCategory(item.category);
    setDrawerUnit(item.standardUnit);
    setIsDrawerOpen(true);
  };

  const handleDeleteReceipt = async () => {
    if (!receipt?.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/receipts');
      } else {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
      }
    } catch {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchReceiptData() {
      try {
        const res = await fetch(`/api/receipts/${resolvedParams.id}`);
        if (!res.ok) {
          if (isMounted) {
            queueMicrotask(() => {
              setErrorMessage('Nota fiscal não encontrada ou não foi possível carregar os dados.');
              setIsLoading(false);
            });
          }
          return;
        }

        const data = (await res.json()) as {
          receipt: ReceiptDetail;
          store: StoreDetail;
          items: ReceiptItemDetail[];
        };

        if (isMounted) {
          queueMicrotask(() => {
            setReceipt(data.receipt);
            setStore(data.store);
            setItems(data.items);
            setIsLoading(false);
          });
        }
      } catch (err: unknown) {
        if (isMounted) {
          queueMicrotask(() => {
            setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar nota fiscal.');
            setIsLoading(false);
          });
        }
      }
    }

    fetchReceiptData();

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  const formatCnpj = (cnpj: string) => {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  const formatAccessKey = (key: string) => {
    return key.replace(/(\d{4})/g, '$1 ').trim();
  };

  const handleCopyKey = () => {
    if (!receipt?.accessKey) return;
    navigator.clipboard.writeText(receipt.accessKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const categories = ['TODAS', ...Array.from(new Set(items.map((i) => i.category || 'Geral')))];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.commercialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rawDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'TODAS' || (item.category || 'Geral') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="bg-canvas min-h-screen py-16 px-6">
        <div className="max-w-[960px] mx-auto text-center space-y-4">
          <div className="w-10 h-10 border-4 border-hairline border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-[15px] font-medium text-ink">
            Carregando detalhes do cupom fiscal e produtos...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage || !receipt || !store) {
    return (
      <div className="bg-canvas min-h-screen py-16 px-6">
        <div className="max-w-[640px] mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-error mx-auto">
            <WarningCircle size={28} weight="bold" />
          </div>
          <h2 className="text-[20px] font-bold text-ink">Documento Fiscal Não Encontrado</h2>
          <p className="text-[14px] text-muted">
            {errorMessage ?? 'Não foi possível encontrar as informações solicitadas.'}
          </p>
          <div className="pt-2">
            <Button variant="secondary" onClick={() => router.push('/receipts')}>
              Voltar para Notas Fiscais
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas min-h-screen pb-16">
      <main className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        <PageHeader
          backHref="/receipts"
          title={store.name}
          description={`${store.city}, ${store.state}${store.neighborhood ? ` · ${store.neighborhood}` : ''} · Emitida em ${formatDate(receipt.issuedAt)}`}
          badge={
            <div className="flex items-center gap-2">
              <Badge variant="optimistic" className="gap-1.5 py-0.5 px-2.5 text-[12px]">
                <CheckCircle size={13} weight="bold" />
                <span>NFC-e Processada</span>
              </Badge>
              {store.corporateName && store.corporateName !== store.name && (
                <span className="text-[12px] text-muted">{store.corporateName}</span>
              )}
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsDeleteModalOpen(true)}
                className="gap-2 text-danger border-danger/30 hover:border-danger hover:bg-danger/10 hover:text-danger rounded-full"
              >
                <Trash size={16} weight="bold" />
                <span>Excluir Nota</span>
              </Button>
              <Link
                href="/scanner"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors"
              >
                <QrCode size={16} weight="bold" />
                <span>Escanear Nova Nota</span>
              </Link>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral" className="gap-1.5 py-1 px-3 text-[13px]">
            <Receipt size={14} weight="bold" />
            <span>Nº {receipt.issueNumber ?? '140396'} · Série {receipt.series ?? '512'}</span>
          </Badge>
          <Badge variant="neutral" className="gap-1.5 py-1 px-3 text-[13px]">
            <CreditCard size={14} weight="bold" />
            <span>{receipt.paymentMethod ?? 'Cartão de Crédito'}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="bordered" className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-muted uppercase tracking-wider">
              Subtotal Bruto
            </span>
            <p className="text-[24px] font-bold text-ink tabular-nums">
              {formatBRL(receipt.totalAmount)}
            </p>
            <span className="text-[12px] text-muted">
              {items.length} itens registrados
            </span>
          </Card>

          <Card variant="bordered" className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-muted uppercase tracking-wider">
              Descontos Aplicados
            </span>
            <p className="text-[24px] font-bold text-primary tabular-nums">
              - {formatBRL(receipt.discountAmount)}
            </p>
            <span className="text-[12px] text-muted">
              Economia obtida na compra
            </span>
          </Card>

          <Card variant="bordered" className="p-5 space-y-1 bg-surface-soft">
            <span className="text-[12px] font-medium text-muted uppercase tracking-wider">
              Total Líquido Pago
            </span>
            <p className="text-[24px] font-bold text-ink tabular-nums">
              {formatBRL(receipt.netAmount)}
            </p>
            <span className="text-[12px] text-muted">
              Valor fiscal final
            </span>
          </Card>
        </div>

        <Card variant="bordered" className="p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                Chave de Acesso da NFC-e (44 dígitos)
              </span>
              <p className="font-mono text-[13px] sm:text-[14px] text-ink break-all">
                {formatAccessKey(receipt.accessKey)}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleCopyKey}
              className="gap-1.5 shrink-0 h-9 text-[13px]"
            >
              {copiedKey ? (
                <>
                  <Check size={16} weight="bold" className="text-primary" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={16} weight="bold" />
                  <span>Copiar Chave</span>
                </>
              )}
            </Button>
          </div>

          <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
            <div className="flex items-center gap-1.5">
              <CalendarBlank size={16} weight="bold" />
              <span>Emitida em: {formatDate(receipt.issuedAt)}</span>
            </div>
            <div>
              <span>CNPJ Emitente: <strong>{formatCnpj(store.cnpj)}</strong></span>
            </div>
            {store.street && (
              <div>
                <span>Endereço: {store.street}{store.number ? `, ${store.number}` : ''}</span>
              </div>
            )}
          </div>
        </Card>

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-bold text-ink">
                Itens e Produtos da Nota Fiscal ({items.length})
              </h2>
              <p className="text-[13px] text-muted">
                Preços e quantidades extraídos diretamente da SEFAZ e vinculados à sua cesta.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <MagnifyingGlass
                size={16}
                weight="bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Filtrar produtos nesta nota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-full border border-hairline text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-ink bg-canvas"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Funnel size={16} weight="bold" className="text-muted shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-ink text-white'
                    : 'bg-surface-soft border border-hairline text-muted hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Card variant="bordered" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline bg-surface-soft text-[12px] font-semibold text-muted uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-center">Qtd</th>
                    <th className="py-3 px-4 text-right">Preço Unit.</th>
                    <th className="py-3 px-4 text-right">Desconto</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-[14px]">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-soft/50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-[12px] text-muted">
                        {item.itemIndex}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.canonicalProductId ? (
                          <button
                            type="button"
                            onClick={() => handleOpenItemHistory(item)}
                            className="text-left font-semibold text-ink hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
                            title="Ver histórico de preços deste produto"
                          >
                            <span>{item.commercialName}</span>
                            <ChartLineUp
                              size={14}
                              weight="bold"
                              className="text-muted group-hover:text-primary shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                            />
                          </button>
                        ) : (
                          <div className="font-semibold text-ink">
                            {item.commercialName}
                          </div>
                        )}
                        {item.rawDescription !== item.commercialName && (
                          <div className="font-mono text-[11px] text-muted">
                            {item.rawDescription}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral" className="text-[11px] py-0.5 px-2">
                          <Tag size={12} weight="bold" />
                          <span>{item.category}</span>
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center tabular-nums text-body">
                        {item.quantity}{' '}
                        <span className="text-[12px] text-muted">{item.unitOfMeasure}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-body">
                        {formatBRL(item.unitPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-primary font-medium">
                        {item.discountValue > 0 ? `- ${formatBRL(item.discountValue)}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-ink">
                        {formatBRL(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-hairline bg-surface-soft text-[14px] font-bold text-ink">
                    <td colSpan={4} className="py-4 px-4">
                      Total ({filteredItems.length} itens listados)
                    </td>
                    <td colSpan={2} className="py-4 px-4 text-right text-primary">
                      {formatBRL(filteredItems.reduce((acc, i) => acc + i.discountValue, 0))}
                    </td>
                    <td className="py-4 px-4 text-right text-[16px] tabular-nums">
                      {formatBRL(filteredItems.reduce((acc, i) => acc + i.totalPrice, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {filteredItems.length === 0 && (
              <div className="py-12 text-center text-muted text-[14px]">
                Nenhum produto encontrado para o filtro aplicado.
              </div>
            )}
          </Card>
        </section>
      </main>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteReceipt}
        title="Excluir Nota Fiscal"
        description="Esta ação removerá permanentemente esta nota fiscal e todos os seus itens do sistema. Esta ação não poderá ser desfeita. Deseja confirmar?"
        confirmLabel="Sim, Excluir Nota"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />

      <ProductHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        productId={drawerProductId}
        initialName={drawerProductName}
        initialCategory={drawerCategory}
        initialUnit={drawerUnit}
      />
    </div>
  );
}
