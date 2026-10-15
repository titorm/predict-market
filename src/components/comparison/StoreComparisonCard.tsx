import React from 'react';
import { Star, MapPin, Tag, Sparkle } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface StoreComparisonCardProps {
  storeName: string;
  neighborhood: string;
  distanceKm?: number;
  rating?: number;
  coveragePct: number;
  basketTotal: number;
  isCheapest?: boolean;
}

export const StoreComparisonCard: React.FC<StoreComparisonCardProps> = ({
  storeName,
  neighborhood,
  distanceKm,
  rating = 4.9,
  coveragePct,
  basketTotal,
  isCheapest = false,
}) => {
  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  return (
    <Card
      variant="bordered"
      interactive
      className={`p-6 relative transition-all ${
        isCheapest ? 'border-primary/50 shadow-sm ring-1 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        {isCheapest ? (
          <Badge variant="optimistic" className="gap-1 py-0.5 px-2.5">
            <Sparkle size={12} weight="bold" />
            <span>Menor Preço</span>
          </Badge>
        ) : (
          <Badge variant="neutral">Bandeira Local</Badge>
        )}
        <div className="flex items-center gap-1 text-[14px] font-semibold text-ink">
          <Star size={14} weight="fill" />
          <span>{rating.toFixed(2)}</span>
        </div>
      </div>

      <h3 className="text-[16px] font-semibold text-ink mb-1 truncate">
        {storeName}
      </h3>

      <p className="text-[14px] text-muted flex items-center gap-1">
        <MapPin size={14} weight="bold" />
        <span>{neighborhood}</span>
        {distanceKm !== undefined && <span>· {distanceKm} km</span>}
      </p>

      <p className="text-[14px] text-muted flex items-center gap-1 mt-1">
        <Tag size={14} weight="bold" />
        <span>{coveragePct}% dos itens da sua cesta encontrados</span>
      </p>

      <div className="mt-4 pt-4 border-t border-hairline-soft flex items-baseline justify-between">
        <span className="text-[14px] text-muted">Custo da cesta</span>
        <strong className="text-[18px] font-bold text-ink tabular-nums">
          {formatBRL(basketTotal)}
        </strong>
      </div>
    </Card>
  );
};
