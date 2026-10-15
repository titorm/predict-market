import React from 'react';
import { ShoppingCart, MapPin, CheckCircle } from '@phosphor-icons/react';
import { SplitCartRecommendation } from '@/core/engine/GroceryForecastEngine';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface SplitCartCardProps {
  recommendation: SplitCartRecommendation;
}

export const SplitCartCard: React.FC<SplitCartCardProps> = ({ recommendation }) => {
  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  return (
    <Card variant="bordered" className="p-6">
      <div className="flex items-center justify-between pb-4 border-b border-hairline mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart size={22} weight="bold" className="text-primary" />
          <h3 className="text-[18px] font-bold text-ink">
            Otimizador de Carrinho Dividido
          </h3>
        </div>
        <Badge variant={recommendation.isWorthSplitting ? 'optimistic' : 'neutral'}>
          {recommendation.isWorthSplitting
            ? `Economia Líquida: ${formatBRL(recommendation.netSavings)}`
            : 'Compra única mais vantajosa'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-surface-soft rounded-sm border border-hairline">
          <span className="text-[12px] font-bold text-muted uppercase block mb-1">
            Melhor Supermercado Único
          </span>
          <p className="text-[16px] font-semibold text-ink">
            {recommendation.bestSingleStoreName}
          </p>
          <p className="text-[14px] text-muted mt-1">
            Total da cesta inteira: <strong className="text-ink">{formatBRL(recommendation.bestSingleStoreTotal)}</strong>
          </p>
        </div>

        <div className="p-4 bg-surface-soft rounded-sm border border-hairline">
          <span className="text-[12px] font-bold text-muted uppercase block mb-1">
            Divisão em 2 Mercados
          </span>
          <p className="text-[16px] font-semibold text-ink">
            {recommendation.storePairNames
              ? `${recommendation.storePairNames[0]} + ${recommendation.storePairNames[1]}`
              : 'Não aplicável'}
          </p>
          <p className="text-[14px] text-muted mt-1">
            Custo bruto: {formatBRL(recommendation.rawSplitTotal)} + Deslocamento: {formatBRL(recommendation.transitCostPenalty)}
          </p>
        </div>
      </div>

      {recommendation.isWorthSplitting && (
        <div>
          <h4 className="text-[14px] font-bold text-ink mb-3 flex items-center gap-1.5">
            <CheckCircle size={16} weight="bold" className="text-primary" />
            Distribuição de Itens por Estabelecimento
          </h4>
          <div className="divide-y divide-hairline-soft border-t border-b border-hairline max-h-60 overflow-y-auto">
            {recommendation.allocations.map((alloc, idx) => (
              <div
                key={`${alloc.canonicalProductId}-${idx}`}
                className="py-2.5 flex items-center justify-between text-[14px]"
              >
                <div className="min-w-0 pr-4">
                  <p className="font-medium text-ink truncate">{alloc.commercialName}</p>
                  <p className="text-[12px] text-muted flex items-center gap-1">
                    <MapPin size={12} weight="bold" />
                    {alloc.assignedStoreName}
                  </p>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <span className="font-semibold text-ink">{formatBRL(alloc.subtotal)}</span>
                  <span className="block text-[12px] text-muted">{alloc.quantity}x {formatBRL(alloc.unitPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
