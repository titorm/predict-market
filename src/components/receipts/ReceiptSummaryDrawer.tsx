'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Receipt,
  Storefront,
  CalendarBlank,
  CreditCard,
  Copy,
  Check,
  ArrowSquareOut,
  Trash,
  ShoppingCart,
  Tag,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PredictMarketLoader } from '@/components/ui/PredictMarketLoader';

export interface ReceiptSummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId: string | null;
  onReceiptDeleted?: (id: string) => void;
}

interface ReceiptSummaryData {
  receipt: {
    id: string;
    accessKey: string;
    issueNumber: string | null;
    series: string | null;
    issuedAt: string;
    totalAmount: number;
    discountAmount: number;
    netAmount: number;
    paymentMethod: string | null;
  };
  store: {
    id: string;
    name: string;
    corporateName: string | null;
    cnpj: string;
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string;
    state: string;
  };
  items: Array<{
    id: string;
    canonicalProductId: string | null;
    commercialName: string;
    rawDescription: string;
    category: string;
    standardUnit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export const ReceiptSummaryDrawer: React.FC<ReceiptSummaryDrawerProps> = ({
  isOpen,
  onClose,
  receiptId,
  onReceiptDeleted,
}) => {
  const [data, setData] = useState<ReceiptSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !receiptId) {
      queueMicrotask(() => {
        setData(null);
        setIsDeleteModalOpen(false);
      });
      return;
    }

    let isMounted = true;
    queueMicrotask(() => {
      setIsLoading(true);
    });

    async function loadReceipt() {
      try {
        const res = await fetch(`/api/receipts/${receiptId}`);
        if (res.ok) {
          const json = (await res.json()) as ReceiptSummaryData;
          if (isMounted) {
            queueMicrotask(() => {
              setData(json);
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

    loadReceipt();

    return () => {
      isMounted = false;
    };
  }, [isOpen, receiptId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleteModalOpen) {
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
  }, [isOpen, onClose, isDeleteModalOpen]);

  if (!isOpen) return null;

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

  const handleCopyKey = () => {
    if (!data?.receipt.accessKey) return;
    navigator.clipboard.writeText(data.receipt.accessKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDeleteReceipt = async () => {
    if (!receiptId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        onClose();
        if (onReceiptDeleted) {
          onReceiptDeleted(receiptId);
        }
      }
    } catch {
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex w-full sm:w-auto">
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-drawer-title"
            className="w-full sm:w-screen sm:max-w-lg bg-canvas border-l border-hairline shadow-2xl flex flex-col min-h-full transform transition-transform duration-300 ease-out safe-top"
          >
            <div className="p-4 sm:p-6 border-b border-hairline flex items-start justify-between gap-4 bg-canvas sticky top-0 z-10">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Receipt size={20} weight="bold" className="text-primary" />
                  <h2
                    id="receipt-drawer-title"
                    className="text-[17px] font-bold text-ink truncate"
                  >
                    {data?.store.name ?? 'Resumo da Nota Fiscal'}
                  </h2>
                </div>
                {data?.receipt.issuedAt && (
                  <p className="text-[12px] text-muted">
                    Emitida em {formatDate(data.receipt.issuedAt)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 -mr-2 text-muted hover:text-ink hover:bg-surface-soft rounded-lg flex items-center justify-center transition-colors touch-target shrink-0"
                aria-label="Fechar painel da nota"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <PredictMarketLoader size="md" text="Carregando resumo da nota fiscal..." />
                </div>
              ) : !data ? (
                <div className="py-16 text-center text-[13px] text-muted">
                  Detalhes da nota fiscal indisponíveis.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-hairline bg-surface-soft/40 space-y-0.5">
                      <span className="text-[11px] text-muted block">Total Líquido Pago</span>
                      <strong className="text-[18px] font-bold text-ink tabular-nums block">
                        {formatBRL(data.receipt.netAmount)}
                      </strong>
                    </div>

                    <div className="p-3 rounded-lg border border-hairline bg-surface-soft/40 space-y-0.5">
                      <span className="text-[11px] text-muted block">Itens Registrados</span>
                      <strong className="text-[18px] font-bold text-ink tabular-nums block">
                        {data.items.length} produtos
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg border border-hairline bg-canvas space-y-2 text-[12px]">
                    <div className="flex items-center gap-1.5 font-bold text-ink text-[13px]">
                      <Storefront size={16} weight="bold" className="text-primary" />
                      <span>{data.store.name}</span>
                    </div>
                    <p className="text-muted">
                      CNPJ: {data.store.cnpj} · {data.store.city}, {data.store.state}
                      {data.store.neighborhood ? ` (${data.store.neighborhood})` : ''}
                    </p>
                    {data.receipt.paymentMethod && (
                      <p className="text-muted flex items-center gap-1">
                        <CreditCard size={14} weight="bold" />
                        <span>Pagamento: {data.receipt.paymentMethod}</span>
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg border border-hairline bg-surface-soft/30 space-y-1.5">
                    <span className="text-[11px] text-muted font-medium block">
                      Chave de Acesso NFC-e:
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-[11px] font-mono text-ink break-all">
                        {data.receipt.accessKey}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="p-1.5 rounded-md hover:bg-surface-soft text-muted hover:text-ink transition-colors shrink-0"
                        title="Copiar chave de acesso"
                      >
                        {isCopied ? (
                          <Check size={14} weight="bold" className="text-success" />
                        ) : (
                          <Copy size={14} weight="bold" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-ink">
                        Itens da Nota ({data.items.length})
                      </span>
                    </div>

                    <div className="divide-y divide-hairline-soft border border-hairline rounded-lg overflow-hidden bg-canvas max-h-64 overflow-y-auto">
                      {data.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 flex items-center justify-between gap-3 text-[12px] hover:bg-surface-soft/30 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-ink truncate block">
                              {item.commercialName}
                            </span>
                            <span className="text-[10px] text-muted">
                              {item.quantity} {item.standardUnit} × {formatBRL(item.unitPrice)}
                            </span>
                          </div>
                          <span className="font-bold text-ink tabular-nums shrink-0">
                            {formatBRL(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {data && (
              <div className="p-4 sm:p-5 border-t border-hairline bg-canvas space-y-2 shrink-0 safe-bottom">
                <Link href={`/receipts/${data.receipt.id}`} className="block">
                  <Button variant="primary" size="md" className="w-full gap-2 rounded-lg text-[13px]">
                    <ArrowSquareOut size={16} weight="bold" />
                    <span>Ver Página Completa da Nota</span>
                  </Button>
                </Link>

                <div className="flex items-center gap-2">
                  <Link href="/forecast" className="flex-1">
                    <Button variant="secondary" size="md" className="w-full gap-1.5 rounded-lg text-[12px]">
                      <ShoppingCart size={15} weight="bold" />
                      <span>Simular no Carrinho</span>
                    </Button>
                  </Link>

                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="gap-1.5 rounded-lg text-[12px] px-3 shrink-0"
                    title="Excluir nota fiscal"
                  >
                    <Trash size={16} weight="bold" />
                    <span>Excluir</span>
                  </Button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteReceipt}
        isLoading={isDeleting}
        title="Excluir Nota Fiscal"
        description={`A nota fiscal de ${data?.store.name ?? 'Supermercado'} emitida em ${data?.receipt.issuedAt ? formatDate(data.receipt.issuedAt) : ''} e todos os seus itens serão permanentemente excluídos da sua conta.`}
        confirmLabel="Sim, Excluir Definitivamente"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </>
  );
};
