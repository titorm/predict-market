'use client';

import React, { useState, Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QrScannerViewport } from '@/components/scanner/QrScannerViewport';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckCircle, WarningCircle, Sparkle, ArrowLeft, Prohibit } from '@phosphor-icons/react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';

function ScannerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialInput = searchParams.get('sharedInput') ?? searchParams.get('scanned') ?? '';

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [processedReceiptId, setProcessedReceiptId] = useState<string | null>(null);
  const [receiptSummary, setReceiptSummary] = useState<{
    storeName?: string;
    itemsCount?: number;
    netAmount?: number;
  } | null>(null);

  const handleProcessKey = async (rawKeyOrUrl: string) => {
    setStatus('loading');
    setFeedbackMessage('Processando nota fiscal e consultando SEFAZ...');

    try {
      const response = await fetch('/api/receipts/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeUrlOrKey: rawKeyOrUrl,
        }),
      });

      const data = (await response.json()) as {
        receiptId?: string;
        itemsProcessed?: number;
        isDuplicate?: boolean;
        receipt?: {
          id: string;
          accessKey: string;
          storeName: string;
          totalAmount: number;
          netAmount: number;
          itemsCount: number;
        };
        error?: string;
      };

      if (response.status === 409 || data.isDuplicate) {
        if (data.receiptId) {
          setProcessedReceiptId(data.receiptId);
        }
        if (data.receipt) {
          setReceiptSummary({
            storeName: data.receipt.storeName,
            itemsCount: data.receipt.itemsCount,
            netAmount: data.receipt.netAmount,
          });
        }
        setStatus('duplicate');
        setFeedbackMessage(
          data.error ?? 'Esta chave de acesso já foi adicionada anteriormente. Nova importação bloqueada.'
        );
        return;
      }

      if (!response.ok) {
        setStatus('error');
        setFeedbackMessage(data.error ?? 'Falha ao consultar portal da SEFAZ.');
        return;
      }

      if (data.receiptId) {
        setProcessedReceiptId(data.receiptId);
      }
      if (data.receipt) {
        setReceiptSummary({
          storeName: data.receipt.storeName,
          itemsCount: data.receipt.itemsCount,
          netAmount: data.receipt.netAmount,
        });
      }

      setStatus('success');
      setFeedbackMessage(
        `Nota processada com sucesso! ${data.itemsProcessed ?? 0} itens integrados da SEFAZ.`
      );
    } catch (err: unknown) {
      setStatus('error');
      setFeedbackMessage(err instanceof Error ? err.message : 'Erro ao processar cupom fiscal.');
    }
  };

  const processedInitialRef = useRef(false);

  useEffect(() => {
    if (initialInput && !processedInitialRef.current) {
      processedInitialRef.current = true;
      queueMicrotask(() => {
        handleProcessKey(initialInput);
      });
    }
  }, [initialInput]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <PageHeader
        backHref="/receipts"
        title="Ingestão de Cupom (NFC-e)"
        description="Aponte a câmera para o QR Code da nota fiscal ou digite a chave de 44 dígitos."
        badge={
          <Badge variant="optimistic" className="gap-1 py-0.5 px-2.5 text-[12px]">
            <Sparkle size={12} weight="bold" />
            <span>+7 Dias Pro por Nota Nova</span>
          </Badge>
        }
      />

      {status === 'loading' && (
        <Card variant="bordered" className="p-8 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-hairline border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-[16px] font-medium text-ink">{feedbackMessage}</p>
          <p className="text-[13px] text-muted">
            Normalizando produtos canônicos e extraindo preços vigentes...
          </p>
        </Card>
      )}

      {status === 'success' && (
        <Card variant="bordered" className="p-8 text-center space-y-4 bg-surface-soft">
          <CheckCircle size={48} weight="fill" className="text-primary mx-auto" />
          <h2 className="text-[22px] font-bold text-ink">Nota Fiscal Processada</h2>
          <p className="text-[14px] text-body">{feedbackMessage}</p>

          {receiptSummary && (
            <div className="p-4 rounded-md bg-canvas border border-hairline max-w-sm mx-auto text-left space-y-1">
              <p className="text-[14px] font-semibold text-ink">{receiptSummary.storeName}</p>
              <div className="flex justify-between text-[13px] text-muted">
                <span>{receiptSummary.itemsCount} produtos</span>
                <span className="font-bold text-ink tabular-nums">
                  {receiptSummary.netAmount !== undefined ? formatBRL(receiptSummary.netAmount) : ''}
                </span>
              </div>
            </div>
          )}

          <Badge variant="optimistic" className="py-1 px-3 text-[13px]">
            +7 Dias de Acesso Pro Ativados!
          </Badge>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            {processedReceiptId && (
              <Button
                variant="primary"
                onClick={() => router.push(`/receipts/${processedReceiptId}`)}
              >
                Ver Detalhes da Nota Importada
              </Button>
            )}
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              Ver Previsão Atualizada
            </Button>
            <Button variant="secondary" onClick={() => setStatus('idle')}>
              Escanear Outra Nota
            </Button>
          </div>
        </Card>
      )}

      {status === 'duplicate' && (
        <Card variant="bordered" className="p-8 text-center space-y-4 border-hairline-strong">
          <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center text-error mx-auto">
            <Prohibit size={38} weight="bold" />
          </div>
          <Badge variant="pessimistic" className="py-1 px-3 text-[12px]">
            Chave Duplicada · Importação Bloqueada
          </Badge>
          <h2 className="text-[22px] font-bold text-ink">Esta Nota Fiscal Já Foi Adicionada</h2>
          <p className="text-[14px] text-muted max-w-md mx-auto">
            {feedbackMessage}
          </p>

          {receiptSummary && (
            <div className="p-4 rounded-md bg-surface-soft border border-hairline max-w-sm mx-auto text-left space-y-1">
              <span className="text-[11px] font-semibold text-muted uppercase">Cupom Existente</span>
              <p className="text-[15px] font-semibold text-ink">{receiptSummary.storeName}</p>
              <div className="flex justify-between text-[13px] text-muted pt-1">
                <span>{receiptSummary.itemsCount} produtos cadastrados</span>
                <span className="font-bold text-ink tabular-nums">
                  {receiptSummary.netAmount !== undefined ? formatBRL(receiptSummary.netAmount) : ''}
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            {processedReceiptId && (
              <Button
                variant="primary"
                onClick={() => router.push(`/receipts/${processedReceiptId}`)}
              >
                Ver Detalhes da Nota Já Salva
              </Button>
            )}
            <Button variant="secondary" onClick={() => router.push('/receipts')}>
              Ver Minhas Notas Fiscais
            </Button>
            <Button variant="secondary" onClick={() => setStatus('idle')}>
              Escanear Outro Cupom
            </Button>
          </div>
        </Card>
      )}

      {status === 'error' && (
        <Card variant="bordered" className="p-8 text-center space-y-4">
          <WarningCircle size={48} weight="bold" className="text-error mx-auto" />
          <h2 className="text-[20px] font-bold text-ink">Não Foi Possível Ingerir a Nota</h2>
          <p className="text-[14px] text-error">{feedbackMessage}</p>
          <Button variant="secondary" onClick={() => setStatus('idle')}>
            Tentar Novamente
          </Button>
        </Card>
      )}

      {status === 'idle' && (
        <QrScannerViewport
          initialSharedInput={initialInput}
          onScanSuccess={handleProcessKey}
          onError={(err) => setFeedbackMessage(err)}
        />
      )}
    </div>
  );
}

export default function ScannerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Carregando scanner...</div>}>
      <ScannerContent />
    </Suspense>
  );
}
