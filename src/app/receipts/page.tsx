'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Storefront,
  CalendarBlank,
  CreditCard,
  QrCode,
  Sparkle,
  ArrowRight,
  MagnifyingGlass,
  CheckCircle,
  Trash,
} from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { QrScannerViewport } from '@/components/scanner/QrScannerViewport';
import { ReceiptSummaryDrawer } from '@/components/receipts/ReceiptSummaryDrawer';
import { PredictMarketLoader } from '@/components/ui/PredictMarketLoader';

interface ReceiptListItem {
  id: string;
  accessKey: string;
  issueNumber: string | null;
  series: string | null;
  issuedAt: string;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paymentMethod: string | null;
  itemsCount: number;
  store: {
    id: string;
    name: string;
    corporateName: string | null;
    cnpj: string;
    city: string;
    state: string;
    neighborhood: string | null;
  };
}

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [receiptToDelete, setReceiptToDelete] = useState<ReceiptListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchReceipts() {
      try {
        const res = await fetch('/api/receipts');
        if (res.ok && isMounted) {
          const data = (await res.json()) as { receipts: ReceiptListItem[] };
          queueMicrotask(() => {
            setReceipts(data.receipts || []);
            setIsLoading(false);
          });
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

    fetchReceipts();

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

  const handleScanSuccess = (accessKey: string) => {
    setIsScannerOpen(false);
    router.push(`/scanner?key=${accessKey}`);
  };

  const handleOpenDrawer = (id: string) => {
    setSelectedReceiptId(id);
    setIsDrawerOpen(true);
  };

  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/receipts/${receiptToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setReceipts((prev) => prev.filter((r) => r.id !== receiptToDelete.id));
        if (selectedReceiptId === receiptToDelete.id) {
          setIsDrawerOpen(false);
          setSelectedReceiptId(null);
        }
        setReceiptToDelete(null);
      }
    } catch {
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredReceipts = useMemo(() => {
    if (!searchQuery.trim()) return receipts;
    const q = searchQuery.toLowerCase().trim();
    return receipts.filter(
      (r) =>
        r.store.name.toLowerCase().includes(q) ||
        r.store.city.toLowerCase().includes(q) ||
        r.accessKey.includes(q)
    );
  }, [receipts, searchQuery]);

  const totalSpent = useMemo(
    () => receipts.reduce((acc, r) => acc + Number(r.netAmount), 0),
    [receipts]
  );

  const totalItems = useMemo(
    () => receipts.reduce((acc, r) => acc + Number(r.itemsCount), 0),
    [receipts]
  );

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <PageHeader
        title="Minhas Notas Fiscais"
        description="Consulte todas as suas compras registradas, confira os itens de cada cupom e acompanhe os descontos obtidos."
        actions={
          <Button
            variant="primary"
            onClick={() => setIsScannerOpen(true)}
            className="gap-2"
          >
            <QrCode size={18} weight="bold" />
            <span>Importar Nova Nota</span>
          </Button>
        }
      />

      <main className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="bordered" className="p-4 bg-canvas space-y-1">
            <div className="flex items-center gap-2 text-muted text-[13px]">
              <Receipt size={16} weight="bold" />
              <span>Notas Processadas</span>
            </div>
            <p className="text-[24px] font-bold text-ink tabular-nums">
              {receipts.length}
            </p>
            <span className="text-[12px] text-muted">Cupons NFC-e de Santa Catarina</span>
          </Card>

          <Card variant="bordered" className="p-4 bg-canvas space-y-1">
            <div className="flex items-center gap-2 text-muted text-[13px]">
              <Sparkle size={16} weight="bold" />
              <span>Gasto Total Registrado</span>
            </div>
            <p className="text-[24px] font-bold text-ink tabular-nums">
              {formatBRL(totalSpent)}
            </p>
            <span className="text-[12px] text-muted">
              Média de {formatBRL(receipts.length > 0 ? totalSpent / receipts.length : 0)} por compra
            </span>
          </Card>

          <Card variant="bordered" className="p-4 bg-canvas space-y-1">
            <div className="flex items-center gap-2 text-muted text-[13px]">
              <CheckCircle size={16} weight="bold" />
              <span>Produtos Mapeados</span>
            </div>
            <p className="text-[24px] font-bold text-ink tabular-nums">
              {totalItems}
            </p>
            <span className="text-[12px] text-muted">
              Alimentando o histórico regional
            </span>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Buscar por mercado ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-full border border-hairline text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-ink bg-canvas"
            />
          </div>

          <span className="text-[13px] text-muted">
            Exibindo {filteredReceipts.length} de {receipts.length} notas
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex items-center justify-center">
            <PredictMarketLoader size="lg" text="Carregando histórico de notas fiscais..." />
          </div>
        ) : filteredReceipts.length > 0 ? (
          <div className="space-y-4">
            {filteredReceipts.map((receipt) => (
              <Card
                key={receipt.id}
                variant="bordered"
                className="p-5 hover:shadow-airbnb transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => handleOpenDrawer(receipt.id)}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[18px] font-bold text-ink">
                      {receipt.store.name}
                    </span>
                    <Badge variant="neutral" className="text-[11px] py-0.5 px-2">
                      <Storefront size={12} weight="bold" />
                      <span>{receipt.store.city}, {receipt.store.state}</span>
                    </Badge>
                    <Badge variant="optimistic" className="text-[11px] py-0.5 px-2">
                      <CheckCircle size={12} weight="bold" />
                      <span>{receipt.itemsCount} produtos</span>
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
                    <div className="flex items-center gap-1">
                      <CalendarBlank size={14} weight="bold" />
                      <span>{formatDate(receipt.issuedAt)}</span>
                    </div>
                    {receipt.paymentMethod && (
                      <div className="flex items-center gap-1">
                        <CreditCard size={14} weight="bold" />
                        <span>{receipt.paymentMethod}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 font-mono text-[12px]">
                      <Receipt size={14} weight="bold" />
                      <span>Chave: ...{receipt.accessKey.slice(-12)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-hairline">
                  <div className="text-left md:text-right">
                    <div className="text-[20px] font-bold text-ink tabular-nums">
                      {formatBRL(receipt.netAmount)}
                    </div>
                    {receipt.discountAmount > 0 && (
                      <div className="text-[12px] text-primary font-medium">
                        Economia: {formatBRL(receipt.discountAmount)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDrawer(receipt.id);
                      }}
                      className="gap-1.5 h-10 text-[13px]"
                    >
                      <span>Ver Resumo</span>
                      <ArrowRight size={14} weight="bold" />
                    </Button>

                    <Button
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceiptToDelete(receipt);
                      }}
                      className="h-10 px-3 text-[13px]"
                      title="Excluir nota fiscal"
                      aria-label="Excluir nota fiscal"
                    >
                      <Trash size={16} weight="bold" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="bordered" className="p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-muted mx-auto">
              <Receipt size={28} weight="bold" />
            </div>
            <h2 className="text-[20px] font-bold text-ink">Nenhuma nota encontrada</h2>
            <p className="text-[14px] text-muted">
              {searchQuery
                ? 'Nenhum cupom fiscal corresponde ao termo pesquisado.'
                : 'Importe seu primeiro cupom fiscal para consultar os itens comprados e descobrir onde economizar.'}
            </p>
            <Button
              variant="primary"
              onClick={() => setIsScannerOpen(true)}
              className="gap-2 mx-auto"
            >
              <QrCode size={18} weight="bold" />
              <span>Importar Primeira Nota</span>
            </Button>
          </Card>
        )}
      </main>

      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Escanear NFC-e"
        maxWidth="max-w-md"
      >
        <QrScannerViewport onScanSuccess={handleScanSuccess} />
      </Modal>

      <ReceiptSummaryDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedReceiptId(null);
        }}
        receiptId={selectedReceiptId}
        onReceiptDeleted={(deletedId) => {
          setReceipts((prev) => prev.filter((r) => r.id !== deletedId));
        }}
      />

      <ConfirmationModal
        isOpen={!!receiptToDelete}
        onClose={() => setReceiptToDelete(null)}
        onConfirm={handleDeleteReceipt}
        isLoading={isDeleting}
        title="Excluir Nota Fiscal"
        description={`A nota fiscal de ${receiptToDelete?.store.name ?? 'Supermercado'} emitida em ${receiptToDelete ? formatDate(receiptToDelete.issuedAt) : ''} será permanentemente removida da sua conta.`}
        confirmLabel="Sim, Excluir Definitivamente"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}
