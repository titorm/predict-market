'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash, FloppyDisk, WarningCircle, QrCode } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { GroceryForecastEngine, BasketItemInput } from '@/core/engine/GroceryForecastEngine';
interface BasketApiResponse {
  basket: { id: string; name: string; target_cadence_days: number };
  items: Array<{
    id: string;
    canonicalProductId: string;
    quantity: number;
    unit: string;
    commercialName: string;
    ean: string | null;
    category: string | null;
  }>;
}

interface BasketPageProps {
  params: Promise<{ id: string }>;
}

export default function BasketDetailPage({ params }: BasketPageProps) {
  const resolvedParams = use(params);
  const [basketName, setBasketName] = useState('Carregando cesta...');
  const [items, setItems] = useState<BasketItemInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBasket() {
      try {
        const res = await fetch(`/api/baskets/${resolvedParams.id}`);
        if (!res.ok) {
          throw new Error('Falha ao carregar cesta');
        }
        const data = (await res.json()) as BasketApiResponse;

        if (isMounted && data.basket) {
          const mapped: BasketItemInput[] = (data.items ?? []).map((i) => {
            const rawUnit = i.unit.toUpperCase();
            const validUnit: 'KG' | 'L' | 'UN' =
              rawUnit === 'KG' || rawUnit === 'L' || rawUnit === 'UN' ? rawUnit : 'UN';

            return {
              canonicalProductId: i.canonicalProductId,
              commercialName: i.commercialName,
              ean: i.ean,
              baseUnit: validUnit,
              netMeasure: 1.0,
              quantity: i.quantity,
              currentUnitPrice: 15.0,
              currentStoreId: 'a0000000-0000-0000-0000-000000000001',
              history: [],
            };
          });

          queueMicrotask(() => {
            setBasketName(data.basket.name);
            setItems(mapped);
          });
        }
      } catch {
        if (isMounted) {
          queueMicrotask(() => {
            setBasketName('Cesta Padrão');
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

    loadBasket();

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: newQty };
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveBasket = async () => {
    setSaveStatus('Salvando...');
    try {
      const res = await fetch(`/api/baskets/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: basketName,
          items: items.map((i) => ({
            canonicalProductId: i.canonicalProductId,
            quantity: i.quantity,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao salvar');
      }

      setSaveStatus('Cesta salva com sucesso!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('Erro ao salvar cesta.');
    }
  };

  const engine = new GroceryForecastEngine();
  const report = items.length > 0 ? engine.generateFullReport(items, 35.0) : null;

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <PageHeader
        backHref="/dashboard"
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Cesta ID: {resolvedParams.id}</Badge>
          </div>
        }
        title={
          <input
            type="text"
            value={basketName}
            onChange={(e) => setBasketName(e.target.value)}
            className="text-[26px] sm:text-[30px] font-bold text-ink bg-transparent border-b border-dashed border-hairline focus:border-ink outline-none w-full max-w-xl"
          />
        }
        description="Ajuste fino de quantidades travadas para simulação do mês alvo."
        actions={
          <div className="flex items-center gap-2.5">
            {saveStatus && (
              <span className="text-[13px] text-primary font-medium">{saveStatus}</span>
            )}
            <Button variant="primary" size="md" onClick={handleSaveBasket} className="gap-2">
              <FloppyDisk size={18} weight="bold" />
              <span>Salvar Cesta</span>
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="py-12 text-center text-muted">Carregando itens da cesta...</div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="bordered" className="p-4 text-center">
              <span className="text-[11px] font-bold uppercase text-scenario-optimistic block">
                Cenário Otimista
              </span>
              <strong className="text-[20px] font-bold text-ink tabular-nums mt-1 block">
                {formatBRL(report.optimisticBasketTotal)}
              </strong>
            </Card>
            <Card variant="bordered" className="p-4 text-center bg-surface-soft">
              <span className="text-[11px] font-bold uppercase text-ink block">
                Cenário Realista (Padrão)
              </span>
              <strong className="text-[20px] font-bold text-ink tabular-nums mt-1 block">
                {formatBRL(report.realisticBasketTotal)}
              </strong>
            </Card>
            <Card variant="bordered" className="p-4 text-center">
              <span className="text-[11px] font-bold uppercase text-scenario-pessimistic block">
                Cenário Pessimista
              </span>
              <strong className="text-[20px] font-bold text-ink tabular-nums mt-1 block">
                {formatBRL(report.pessimisticBasketTotal)}
              </strong>
            </Card>
          </div>

          <Card variant="bordered" className="p-6">
            <h2 className="text-[18px] font-bold text-ink mb-4">Itens da Cesta ({items.length})</h2>
            <div className="divide-y divide-hairline-soft">
              {items.map((item, idx) => (
                <div key={`${item.canonicalProductId}-${idx}`} className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-medium text-ink truncate">{item.commercialName}</p>
                    <p className="text-[13px] text-muted">Preço pago: {formatBRL(item.currentUnitPrice)} / {item.baseUnit.toLowerCase()}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-hairline rounded-sm">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-ink hover:bg-surface-soft"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-semibold text-ink text-[14px] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-ink hover:bg-surface-soft"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="w-8 h-8 rounded-sm text-muted hover:text-error flex items-center justify-center"
                      aria-label="Remover item"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <Card variant="bordered" className="p-8 text-center space-y-4">
          <WarningCircle size={40} weight="bold" className="text-muted mx-auto" />
          <h2 className="text-[18px] font-bold text-ink">Esta cesta não possui produtos</h2>
          <p className="text-[14px] text-muted">
            Escaneie cupons fiscais para adicionar produtos e manter sua cesta base atualizada.
          </p>
        </Card>
      )}
    </div>
  );
}
